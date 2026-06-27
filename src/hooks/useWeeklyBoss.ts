import { useEffect, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { AppUser as User } from '../utils/helpers';
import * as weeklyBossService from '../services/weeklyBossService';
import type { WeeklyBossDoc } from '../services/weeklyBossService';
import {
  getWeekKey, pickBossForWeek, getBossById, daysLeftInWeek,
  WEEKLY_BOSS_MAX_HP, WEEKLY_BOSS_REWARD_GOLD, WeeklyBossConfig
} from '../game/weeklyBoss';
import { celebrate } from '../game/celebrationStore';
import { useAppStore } from '../store/useAppStore';

const ignoreAsyncError = (): undefined => undefined;

/** Ăn mừng hạ boss — gọi từ bất kỳ nơi nào gây damage chí mạng */
export const celebrateBossDefeat = (bossId: string): void => {
  const boss = getBossById(bossId);
  confetti({
    particleCount: 250,
    spread: 120,
    origin: { y: 0.5 },
    colors: ['#f43f5e', '#f59e0b', '#6366f1', '#10b981']
  });
  celebrate({
    kind: 'levelup',
    label: `ĐÃ HẠ ${boss.name.toUpperCase()}! ${boss.emoji}`,
    sub: `“${boss.defeatLine}” — vào tab Quái Thú nhận ${WEEKLY_BOSS_REWARD_GOLD} Gold nha!`
  });
};

export interface UseWeeklyBossReturn {
  bossInfo: WeeklyBossConfig;
  totalDamage: number;
  maxHp: number;
  hpLeft: number;
  damageByActor: Record<string, number>;
  defeated: boolean;
  myClaimed: boolean;
  daysLeft: number;
  rewardGold: number;
  claim: () => Promise<void>;
}

export function useWeeklyBoss(user: User | null, playerSlug: string | null): UseWeeklyBossReturn {
  const [bossDoc, setBossDoc] = useState<WeeklyBossDoc | null>(null);
  const patchUserData = useAppStore((s) => s.patchUserData);

  useEffect(() => {
    if (!user || user.uid === 'local-user-test') return;
    const unsubscribe = weeklyBossService.subscribeToWeeklyBoss(setBossDoc, ignoreAsyncError);
    return () => unsubscribe();
  }, [user]);

  const weekKey = getWeekKey();
  const bossInfo = bossDoc ? getBossById(bossDoc.bossId) : pickBossForWeek(weekKey);
  const maxHp = bossDoc?.maxHp || WEEKLY_BOSS_MAX_HP;
  const damageByActor = useMemo(() => bossDoc?.damage || {}, [bossDoc]);
  const totalDamage = useMemo(
    () => Object.values(damageByActor).reduce((a, b) => a + b, 0),
    [damageByActor]
  );
  const hpLeft = Math.max(0, maxHp - totalDamage);
  const defeated = Boolean(bossDoc?.defeatedAt);
  const myClaimed = Boolean(playerSlug && bossDoc?.claimed?.[playerSlug]);

  const claim = useCallback(async () => {
    if (!user || user.uid === 'local-user-test' || !playerSlug) return;
    try {
      const gold = await weeklyBossService.claimBossReward(user.uid, playerSlug);
      const { userData } = useAppStore.getState();
      patchUserData({ ttGold: (userData.ttGold || 0) + gold });
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#fbbf24'] });
      celebrate({ kind: 'gold', label: `+${gold} Gold`, sub: `chiến lợi phẩm từ ${bossInfo.name}` });
    } catch (e) {
      celebrate({
        kind: 'damage',
        label: 'Chưa nhận được thưởng',
        sub: e instanceof Error ? e.message : 'Thử lại nhé'
      });
    }
  }, [user, playerSlug, patchUserData, bossInfo.name]);

  return {
    bossInfo,
    totalDamage,
    maxHp,
    hpLeft,
    damageByActor,
    defeated,
    myClaimed,
    daysLeft: daysLeftInWeek(),
    rewardGold: WEEKLY_BOSS_REWARD_GOLD,
    claim
  };
}
