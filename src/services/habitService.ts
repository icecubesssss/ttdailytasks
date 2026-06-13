import { db, appId } from '../firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, runTransaction,
  query, where, Unsubscribe
} from 'firebase/firestore';
import { UserData, calculateLevel } from '../utils/helpers';
import {
  HABIT_CHECKIN_XP, HABIT_CHECKIN_GOLD, HABIT_TINY_XP, HABIT_TINY_GOLD,
  HABIT_DROP_CHANCE, FREEZE_SHARDS_PER_FREEZE
} from '../utils/constants';
import { HabitHistory, isCheckableDay, getTodayKey } from '../game/habitEngine';

export interface Habit {
  id: string;
  title: string;
  emoji: string;
  monsterId: string;
  /** 'tit' | 'tun' — đồng bộ với assigneeId của tasks */
  ownerId: string;
  createdByUid: string;
  /** solo (mặc định) | duo — cả hai cùng check trong ngày mới trọn vẹn */
  type?: 'solo' | 'duo';
  /** Đòn nhẹ 2 phút — phiên bản tối thiểu (BJ Fogg) */
  tinyVersion: string;
  /** Implementation intention: "Sau khi ___" */
  cueAfter?: string;
  cueTime?: string;
  createdAt: number;
  archivedAt?: number;
  /** Tốt nghiệp 66 ngày — quái bị phong ấn, vào Đền */
  sealedAt?: number | null;
  history: HabitHistory;
  /** Ngày đã roll drop — chống toggle off/on để re-roll quà */
  dropsClaimed?: Record<string, boolean>;
}

export type HabitDrop =
  | { type: 'gold'; amount: number }
  | { type: 'shard'; shards: number; freezeEarned: boolean };

export interface HabitCheckOutcome {
  action: 'checked' | 'unchecked' | 'switched';
  mode: 'done' | 'tiny';
  xpDelta: number;
  goldDelta: number;
  drop?: HabitDrop;
  /** Duo: đòn này khép vòng — cả hai đã check hôm nay 💞 */
  duoCompleted?: boolean;
}

const habitsCol = () => collection(db, 'artifacts', appId, 'public', 'data', 'habits');
const habitRef = (id: string) => doc(db, 'artifacts', appId, 'public', 'data', 'habits', id);
const statsRef = (uid: string) => doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');

export const subscribeToHabits = (
  callback: (habits: Habit[]) => void,
  onError?: (e: unknown) => void
): Unsubscribe =>
  onSnapshot(
    query(habitsCol(), where('archivedAt', '==', null)),
    (snap) => callback(snap.docs.map((d) => ({ ...(d.data() as Habit), id: d.id }))),
    (e) => onError?.(e)
  );

export const createHabit = async (
  habit: Omit<Habit, 'id' | 'createdAt' | 'history' | 'dropsClaimed'>
): Promise<string> => {
  const ref = doc(habitsCol());
  const payload: Record<string, unknown> = {
    ...habit,
    id: ref.id,
    createdAt: Date.now(),
    archivedAt: null,
    history: {},
    dropsClaimed: {}
  };
  // Firestore không nhận undefined (cueAfter/cueTime là tuỳ chọn)
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  await setDoc(ref, payload);
  return ref.id;
};

export const archiveHabit = async (habitId: string): Promise<void> =>
  updateDoc(habitRef(habitId), { archivedAt: Date.now() });

/** Phong ấn quái — thói quen tốt nghiệp, rời chiến trường vào Đền */
export const sealHabit = async (habitId: string): Promise<void> =>
  updateDoc(habitRef(habitId), { sealedAt: Date.now() });

const rewardFor = (mode: 'done' | 'tiny') =>
  mode === 'done'
    ? { xp: HABIT_CHECKIN_XP, gold: HABIT_CHECKIN_GOLD }
    : { xp: HABIT_TINY_XP, gold: HABIT_TINY_GOLD };

/**
 * Điểm danh (hoặc bỏ điểm danh) 1 thói quen + cộng/trừ thưởng + roll drop —
 * tất cả trong MỘT transaction để hai thiết bị không ghi đè nhau và không
 * nhân đôi quà. Drop chỉ roll 1 lần/ngày/thói quen (dropsClaimed).
 */
export const checkInHabit = async (
  uid: string,
  habitId: string,
  dateKey: string,
  mode: 'done' | 'tiny',
  actorKey?: 'tit' | 'tun'
): Promise<HabitCheckOutcome> => {
  if (!isCheckableDay(dateKey)) {
    throw new Error('Chỉ điểm danh được hôm nay hoặc hôm qua thôi nhé!');
  }

  return await runTransaction(db, async (transaction) => {
    const habitSnap = await transaction.get(habitRef(habitId));
    const statsSnap = await transaction.get(statsRef(uid));
    if (!habitSnap.exists()) throw new Error('Thói quen không tồn tại');
    if (!statsSnap.exists()) throw new Error('User stats not found');

    const habit = habitSnap.data() as Habit;
    const stats = statsSnap.data() as UserData;
    const existing = habit.history?.[dateKey];

    // Ghi đè cả map (đang trong transaction nên không sợ ghi đè chéo thiết bị;
    // dot-path kiểu `history.2026-06-13` không phải field path hợp lệ của Firestore)
    const history = { ...(habit.history || {}) };
    const dropsClaimed = { ...(habit.dropsClaimed || {}) };
    let outcome: HabitCheckOutcome;

    // Roll drop ngẫu nhiên — chỉ hôm nay, mỗi claimKey 1 lần
    // (solo: 1 lần/ngày/thói quen; duo: mỗi người 1 lượt riêng để người khép vòng vẫn có vía x2)
    const rollDrop = (out: HabitCheckOutcome, chanceMultiplier = 1, claimKey = dateKey) => {
      if (dateKey !== getTodayKey() || dropsClaimed[claimKey]) return;
      dropsClaimed[claimKey] = true;
      if (Math.random() >= HABIT_DROP_CHANCE * chanceMultiplier) return;
      if (Math.random() < 0.6) {
        const amount = 15 + Math.floor(Math.random() * 16); // 15..30 gold
        out.drop = { type: 'gold', amount };
        out.goldDelta += amount;
      } else {
        const shards = (stats.freezeShards || 0) + 1;
        const freezeEarned = shards >= FREEZE_SHARDS_PER_FREEZE;
        out.drop = {
          type: 'shard',
          shards: freezeEarned ? shards - FREEZE_SHARDS_PER_FREEZE : shards,
          freezeEarned
        };
      }
    };

    if (habit.type === 'duo') {
      // ── Thói quen ĐÔI: mỗi người nhận nửa thưởng khi check; đủ cả hai = 'done' ──
      if (actorKey !== 'tit' && actorKey !== 'tun') {
        throw new Error('Thiếu danh tính người điểm danh');
      }
      const partnerKey = actorKey === 'tit' ? 'tun' : 'tit';
      const r = rewardFor('tiny');

      if (existing === actorKey) {
        delete history[dateKey];
        outcome = { action: 'unchecked', mode: 'tiny', xpDelta: -r.xp, goldDelta: -r.gold };
      } else if (existing === 'done') {
        history[dateKey] = partnerKey;
        // duoCompleted=true: cú toggle này phá vòng duo đã khép (để trừ đúng damage boss)
        outcome = {
          action: 'unchecked', mode: 'tiny', xpDelta: -r.xp, goldDelta: -r.gold, duoCompleted: true
        };
      } else if (existing === partnerKey) {
        history[dateKey] = 'done';
        outcome = {
          action: 'checked', mode: 'tiny', xpDelta: r.xp, goldDelta: r.gold, duoCompleted: true
        };
        rollDrop(outcome, 2, `${dateKey}:${actorKey}`); // khép vòng duo: vía rơi đồ nhân đôi
      } else {
        history[dateKey] = actorKey;
        outcome = { action: 'checked', mode: 'tiny', xpDelta: r.xp, goldDelta: r.gold };
        rollDrop(outcome, 1, `${dateKey}:${actorKey}`);
      }
    } else if (existing === mode) {
      // Bỏ điểm danh: trừ lại đúng thưởng gốc (drop không bị thu hồi nhưng cũng không roll lại)
      const r = rewardFor(mode);
      delete history[dateKey];
      outcome = { action: 'unchecked', mode, xpDelta: -r.xp, goldDelta: -r.gold };
    } else if (existing === 'done' || existing === 'tiny') {
      // Đổi chế độ đòn (done <-> tiny): điều chỉnh phần chênh
      const oldR = rewardFor(existing);
      const newR = rewardFor(mode);
      history[dateKey] = mode;
      outcome = {
        action: 'switched',
        mode,
        xpDelta: newR.xp - oldR.xp,
        goldDelta: newR.gold - oldR.gold
      };
    } else {
      // Điểm danh mới
      const r = rewardFor(mode);
      history[dateKey] = mode;
      outcome = { action: 'checked', mode, xpDelta: r.xp, goldDelta: r.gold };
      rollDrop(outcome);
    }

    transaction.update(habitRef(habitId), { history, dropsClaimed });

    const finalXp = Math.max(0, (stats.xp || 0) + outcome.xpDelta);
    const finalGold = Math.max(0, (stats.ttGold || 0) + outcome.goldDelta);
    const statsUpdates: Record<string, unknown> = {
      xp: finalXp,
      ttGold: finalGold,
      level: calculateLevel(finalXp).level
    };
    if (outcome.drop?.type === 'shard') {
      statsUpdates.freezeShards = outcome.drop.shards;
      if (outcome.drop.freezeEarned) {
        statsUpdates.streakFreezes = (stats.streakFreezes || 0) + 1;
      }
    }
    transaction.update(statsRef(uid), statsUpdates);

    return outcome;
  });
};
