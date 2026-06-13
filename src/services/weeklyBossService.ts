import { db, appId } from '../firebase';
import { doc, onSnapshot, runTransaction, Unsubscribe } from 'firebase/firestore';
import { UserData, calculateLevel } from '../utils/helpers';
import {
  getWeekKey, pickBossForWeek, WEEKLY_BOSS_MAX_HP, WEEKLY_BOSS_REWARD_GOLD
} from '../game/weeklyBoss';

export interface WeeklyBossDoc {
  weekKey: string;
  bossId: string;
  maxHp: number;
  /** Sát thương từng người: { tit: 12, tun: 9 } */
  damage: Record<string, number>;
  defeatedAt: number | null;
  /** Ai đã nhận pot vàng */
  claimed: Record<string, boolean>;
}

const bossRef = (weekKey: string) =>
  doc(db, 'artifacts', appId, 'public', 'data', 'weekly_boss', weekKey);
const statsRef = (uid: string) =>
  doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');

const freshBossDoc = (weekKey: string): WeeklyBossDoc => ({
  weekKey,
  bossId: pickBossForWeek(weekKey).id,
  maxHp: WEEKLY_BOSS_MAX_HP,
  damage: {},
  defeatedAt: null,
  claimed: {}
});

export const subscribeToWeeklyBoss = (
  callback: (boss: WeeklyBossDoc | null) => void,
  onError?: (e: unknown) => void
): Unsubscribe =>
  onSnapshot(
    bossRef(getWeekKey()),
    (snap) => callback(snap.exists() ? (snap.data() as WeeklyBossDoc) : null),
    (e) => onError?.(e)
  );

export interface BossDamageResult {
  justDefeated: boolean;
  totalDamage: number;
  bossId: string;
}

/**
 * Trừ máu boss tuần (fire-and-forget từ task/habit). Tự tạo doc tuần nếu chưa có.
 * amount âm = hoàn tác (bỏ điểm danh) để không farm damage bằng toggle.
 * Trả về justDefeated=true đúng 1 lần — lúc cú đánh này hạ gục boss.
 */
export const dealBossDamage = async (
  actorKey: string,
  amount: number
): Promise<BossDamageResult> => {
  const weekKey = getWeekKey();
  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(bossRef(weekKey));
    const boss = snap.exists() ? (snap.data() as WeeklyBossDoc) : freshBossDoc(weekKey);

    const wasDefeated = Boolean(boss.defeatedAt);
    const damage = {
      ...boss.damage,
      [actorKey]: Math.max(0, (boss.damage[actorKey] || 0) + amount)
    };
    const totalDamage = Object.values(damage).reduce((a, b) => a + b, 0);
    const justDefeated = !wasDefeated && totalDamage >= boss.maxHp;

    transaction.set(bossRef(weekKey), {
      ...boss,
      damage,
      defeatedAt: justDefeated ? Date.now() : boss.defeatedAt
    });

    return { justDefeated, totalDamage, bossId: boss.bossId };
  });
};

/** Nhận pot vàng sau khi hạ boss — mỗi người 1 lần/tuần */
export const claimBossReward = async (uid: string, actorKey: string): Promise<number> => {
  const weekKey = getWeekKey();
  return await runTransaction(db, async (transaction) => {
    const bossSnap = await transaction.get(bossRef(weekKey));
    const statsSnap = await transaction.get(statsRef(uid));
    if (!bossSnap.exists()) throw new Error('Tuần này chưa có boss');
    if (!statsSnap.exists()) throw new Error('User stats not found');

    const boss = bossSnap.data() as WeeklyBossDoc;
    if (!boss.defeatedAt) throw new Error('Boss còn sống nhăn răng kìa!');
    if (boss.claimed?.[actorKey]) throw new Error('Bạn nhận thưởng tuần này rồi mà~');

    const stats = statsSnap.data() as UserData;
    const finalGold = (stats.ttGold || 0) + WEEKLY_BOSS_REWARD_GOLD;

    transaction.update(bossRef(weekKey), { claimed: { ...boss.claimed, [actorKey]: true } });
    transaction.update(statsRef(uid), {
      ttGold: finalGold,
      level: calculateLevel(stats.xp || 0).level
    });

    return WEEKLY_BOSS_REWARD_GOLD;
  });
};
