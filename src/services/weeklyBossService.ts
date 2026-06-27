import { supabase } from '../supabase';
import { UserData, calculateLevel } from '../utils/helpers';
import {
  getWeekKey, pickBossForWeek, WEEKLY_BOSS_MAX_HP, WEEKLY_BOSS_REWARD_GOLD
} from '../game/weeklyBoss';

export interface WeeklyBossDoc {
  weekKey: string;
  bossId: string;
  maxHp: number;
  damage: Record<string, number>;
  defeatedAt: number | null;
  claimed: Record<string, boolean>;
}

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
) => {
  const weekKey = getWeekKey();
  
  supabase
    .from('weekly_boss')
    .select('*')
    .eq('week_key', weekKey)
    .single()
    .then(({ data, error }) => {
      if (error && error.code !== 'PGRST116') {
        if (onError) onError(error);
        return;
      }
      if (data) {
        callback({
          weekKey: data.week_key,
          bossId: data.boss_id,
          maxHp: data.max_hp,
          damage: data.damage || {},
          defeatedAt: data.defeated_at,
          claimed: data.claimed || {}
        });
      } else {
        callback(null);
      }
    });

  const channel = supabase.channel(`public:weekly_boss:week_key=eq.${weekKey}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_boss', filter: `week_key=eq.${weekKey}` }, (payload: any) => {
      const data = payload.new;
      if (data) {
        callback({
          weekKey: data.week_key,
          bossId: data.boss_id,
          maxHp: data.max_hp,
          damage: data.damage || {},
          defeatedAt: data.defeated_at,
          claimed: data.claimed || {}
        });
      } else {
        callback(null);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export interface BossDamageResult {
  justDefeated: boolean;
  totalDamage: number;
  bossId: string;
}

export const dealBossDamage = async (actorKey: string, amount: number): Promise<{ justDefeated: boolean, totalDamage: number, bossId: string }> => {
  const weekKey = getWeekKey();
  
  const { data, error } = await supabase.rpc('deal_boss_damage_rpc', {
    p_week_key: weekKey,
    p_actor_key: actorKey,
    p_amount: amount,
    p_now: Date.now()
  });

  if (error) {
    console.error('Lỗi khi đánh boss:', error);
    throw error;
  }

  return data as { justDefeated: boolean, totalDamage: number, bossId: string };
};

export const claimBossReward = async (uid: string, actorKey: string): Promise<number> => {
  const weekKey = getWeekKey();
  
  const [ { data: bossData, error: bossErr }, { data: statsData, error: statsErr } ] = await Promise.all([
    supabase.from('weekly_boss').select('*').eq('week_key', weekKey).single(),
    supabase.from('user_stats').select('*').eq('uid', uid).single()
  ]);

  if (bossErr || !bossData) throw new Error('Tuần này chưa có boss');
  if (statsErr || !statsData) throw new Error('User stats not found');

  const boss = {
    weekKey: bossData.week_key,
    bossId: bossData.boss_id,
    maxHp: bossData.max_hp,
    damage: bossData.damage || {},
    defeatedAt: bossData.defeated_at,
    claimed: bossData.claimed || {}
  };

  if (!boss.defeatedAt) throw new Error('Boss còn sống nhăn răng kìa!');
  if (boss.claimed?.[actorKey]) throw new Error('Bạn nhận thưởng tuần này rồi mà~');

  const finalGold = (statsData.gold || 0) + WEEKLY_BOSS_REWARD_GOLD;

  const newClaimed = { ...boss.claimed, [actorKey]: true };
  
  await Promise.all([
    supabase.from('weekly_boss').update({ claimed: newClaimed }).eq('week_key', weekKey),
    supabase.from('user_stats').update({
      gold: finalGold,
      level: calculateLevel(statsData.xp || 0).level
    }).eq('uid', uid)
  ]);

  return WEEKLY_BOSS_REWARD_GOLD;
};
