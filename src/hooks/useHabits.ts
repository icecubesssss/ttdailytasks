import { useEffect, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { User } from 'firebase/auth';
import * as habitService from '../services/habitService';
import type { Habit } from '../services/habitService';
import { celebrate } from '../game/celebrationStore';
import { getMonster, pickLine } from '../game/bestiary';
import { getTodayKey, previewDamage, isCheckedForActor } from '../game/habitEngine';
import { useAppStore } from '../store/useAppStore';
import { MAX_ACTIVE_HABITS, FREEZE_SHARDS_PER_FREEZE } from '../utils/constants';
import { dealBossDamage } from '../services/weeklyBossService';
import { BOSS_DMG_HABIT, BOSS_DMG_DUO_COMPLETE } from '../game/weeklyBoss';
import { celebrateBossDefeat } from './useWeeklyBoss';

const ignoreAsyncError = (): undefined => undefined;

export interface UseHabitsReturn {
  habits: Habit[];
  myHabits: Habit[];
  partnerHabits: Habit[];
  sealedHabits: Habit[];
  isLoaded: boolean;
  canCreateMore: boolean;
  checkIn: (habit: Habit, mode: 'done' | 'tiny') => Promise<void>;
  createHabit: (
    data: Omit<Habit, 'id' | 'createdAt' | 'history' | 'dropsClaimed' | 'ownerId' | 'createdByUid'>
  ) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  sealHabit: (habit: Habit) => Promise<void>;
}

export function useHabits(user: User | null, currentAssigneeId: string | null): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const patchUserData = useAppStore((s) => s.patchUserData);

  useEffect(() => {
    if (!user || user.uid === 'local-user-test') return;
    const unsubscribe = habitService.subscribeToHabits(
      (list) => {
        setHabits([...list].sort((a, b) => a.createdAt - b.createdAt));
        setIsLoaded(true);
      },
      ignoreAsyncError
    );
    return () => unsubscribe();
  }, [user]);

  // Duo habit hiện ở chiến trường của CẢ HAI; habit đã phong ấn vào Đền
  const myHabits = useMemo(
    () =>
      habits.filter(
        (h) => !h.sealedAt && (h.ownerId === currentAssigneeId || h.type === 'duo')
      ),
    [habits, currentAssigneeId]
  );
  const partnerHabits = useMemo(
    () =>
      habits.filter(
        (h) => !h.sealedAt && h.ownerId !== currentAssigneeId && h.type !== 'duo'
      ),
    [habits, currentAssigneeId]
  );
  const sealedHabits = useMemo(
    () => habits.filter((h) => Boolean(h.sealedAt)).sort((a, b) => (b.sealedAt || 0) - (a.sealedAt || 0)),
    [habits]
  );

  const checkIn = useCallback(
    async (habit: Habit, mode: 'done' | 'tiny') => {
      if (!user || user.uid === 'local-user-test') return;
      const todayKey = getTodayKey();
      const monster = getMonster(habit.monsterId);
      const damage = previewDamage(habit, mode);

      try {
        const actorKey =
          currentAssigneeId === 'tit' || currentAssigneeId === 'tun' ? currentAssigneeId : undefined;
        const outcome = await habitService.checkInHabit(user.uid, habit.id, todayKey, mode, actorKey);

        // Đòn này cũng trừ máu Boss Tuần (hoàn tác thì trả máu — chống farm toggle)
        if (actorKey && outcome.action !== 'switched') {
          const dmgBase = outcome.duoCompleted ? BOSS_DMG_DUO_COMPLETE : BOSS_DMG_HABIT;
          dealBossDamage(actorKey, outcome.action === 'unchecked' ? -dmgBase : dmgBase)
            .then((res) => {
              if (res.justDefeated) celebrateBossDefeat(res.bossId);
            })
            .catch(ignoreAsyncError);
        }

        // Cập nhật ví ngay cho "đã tay" (server snapshot sẽ xác nhận lại sau)
        const { userData } = useAppStore.getState();
        patchUserData({
          xp: Math.max(0, (userData.xp || 0) + outcome.xpDelta),
          ttGold: Math.max(0, (userData.ttGold || 0) + outcome.goldDelta),
          ...(outcome.drop?.type === 'shard'
            ? {
                freezeShards: outcome.drop.shards,
                ...(outcome.drop.freezeEarned
                  ? { streakFreezes: (userData.streakFreezes || 0) + 1 }
                  : {})
              }
            : {})
        });

        if (outcome.action === 'unchecked') {
          celebrate({ kind: 'damage', label: `${monster.name} hồi sức!`, sub: 'đã hoàn tác điểm danh' });
          return;
        }

        // Đòn đánh + thưởng
        celebrate(
          {
            kind: 'damage',
            label: `-${damage} HP ${monster.name}`,
            sub: pickLine(monster.defeats, habit.id.length + new Date().getDate())
          },
          { kind: 'gold', label: `+${Math.max(0, outcome.goldDelta)} Gold` },
          { kind: 'xp', label: `+${Math.max(0, outcome.xpDelta)} XP` }
        );

        if (outcome.drop?.type === 'gold') {
          celebrate({ kind: 'drop', label: `Quái đánh rơi +${outcome.drop.amount} Gold!` });
        } else if (outcome.drop?.type === 'shard') {
          celebrate(
            outcome.drop.freezeEarned
              ? { kind: 'freeze', label: '+1 STREAK FREEZE!', sub: 'ghép đủ 3 mảnh băng ❄️' }
              : {
                  kind: 'freeze',
                  label: `Mảnh băng +1`,
                  sub: `${outcome.drop.shards}/${FREEZE_SHARDS_PER_FREEZE} mảnh — đủ 3 đổi 1 Freeze`
                }
          );
        }

        // Duo: khép vòng hay đang chờ người kia?
        if (habit.type === 'duo' && outcome.action === 'checked') {
          celebrate(
            outcome.duoCompleted
              ? { kind: 'combo', label: '💞 DUO HOÀN THÀNH!', sub: 'cả hai cùng làm hôm nay — băng tan!' }
              : { kind: 'checkin', label: 'Đã điểm danh phần mình', sub: 'chờ người ấy khép vòng 💌' }
          );
        }

        // Ngày Toàn Thắng: tất cả thói quen của mình hôm nay đã xử xong
        const allDone = myHabits.every(
          (h) =>
            h.id === habit.id ||
            isCheckedForActor(h.history || {}, h.type === 'duo', currentAssigneeId, todayKey)
        );
        if (allDone && myHabits.length > 1 && outcome.action === 'checked') {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#6366f1', '#ec4899', '#10b981']
          });
          celebrate({
            kind: 'levelup',
            label: 'NGÀY TOÀN THẮNG!',
            sub: `Hạ gục cả ${myHabits.length} con quái hôm nay 🏆`
          });
        }
      } catch (e) {
        celebrate({
          kind: 'damage',
          label: 'Đòn đánh trượt!',
          sub: e instanceof Error ? e.message : 'Thử lại nhé'
        });
      }
    },
    [user, myHabits, patchUserData, currentAssigneeId]
  );

  const sealHabit = useCallback(async (habit: Habit) => {
    const monster = getMonster(habit.monsterId);
    await habitService.sealHabit(habit.id);
    confetti({
      particleCount: 220,
      spread: 110,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#a78bfa', '#f472b6', '#34d399']
    });
    celebrate({
      kind: 'levelup',
      label: `PHONG ẤN ${monster.name.toUpperCase()}! 🔮`,
      sub: `66 ngày bền bỉ — bạn đã trở thành ${monster.identity} ${monster.identityEmoji}`
    });
  }, []);

  const createHabit = useCallback(
    async (
      data: Omit<Habit, 'id' | 'createdAt' | 'history' | 'dropsClaimed' | 'ownerId' | 'createdByUid'>
    ) => {
      if (!user || user.uid === 'local-user-test' || !currentAssigneeId) return;
      if (myHabits.length >= MAX_ACTIVE_HABITS) {
        celebrate({
          kind: 'damage',
          label: `Tối đa ${MAX_ACTIVE_HABITS} thói quen thôi!`,
          sub: 'Ít mà chắc — phong ấn bớt quái cũ đã nhé'
        });
        return;
      }
      const monster = getMonster(data.monsterId);
      await habitService.createHabit({
        ...data,
        ownerId: currentAssigneeId,
        createdByUid: user.uid
      });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      celebrate({ kind: 'combo', label: `KHAI CHIẾN ${monster.name}!`, sub: monster.purpose });
    },
    [user, currentAssigneeId, myHabits.length]
  );

  const archiveHabit = useCallback(async (habitId: string) => {
    await habitService.archiveHabit(habitId).catch(ignoreAsyncError);
  }, []);

  return {
    habits,
    myHabits,
    partnerHabits,
    sealedHabits,
    isLoaded,
    canCreateMore: myHabits.length < MAX_ACTIVE_HABITS,
    checkIn,
    createHabit,
    archiveHabit,
    sealHabit
  };
}
