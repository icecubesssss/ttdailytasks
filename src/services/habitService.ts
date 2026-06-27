import { supabase } from '../supabase';
import { UserData, calculateLevel } from '../utils/helpers';
import { HABIT_CHECKIN_XP, HABIT_CHECKIN_GOLD, HABIT_TINY_XP, HABIT_TINY_GOLD,
  HABIT_DROP_CHANCE, FREEZE_SHARDS_PER_FREEZE
} from '../utils/constants';
import { HabitHistory, isCheckableDay, getTodayKey } from '../game/habitEngine';
import { gamificationMutex } from '../utils/mutex';

export interface Habit {
  id: string;
  title: string;
  emoji: string;
  monsterId: string;
  ownerId: string;
  createdByUid: string;
  type?: 'solo' | 'duo';
  tinyVersion: string;
  cueAfter?: string;
  cueTime?: string;
  createdAt: number;
  archivedAt?: number;
  sealedAt?: number | null;
  history: HabitHistory;
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
  duoCompleted?: boolean;
}

export const subscribeToHabits = (
  callback: (habits: Habit[]) => void,
  onError?: (e: unknown) => void
) => {
  supabase
    .from('habits')
    .select('*')
    .is('archived_at', null)
    .then(({ data, error }) => {
      if (error) {
        if (onError) onError(error);
        return;
      }
      if (data) {
        const habits = data.map(d => ({
          id: d.id,
          title: d.title,
          emoji: d.notes, // We stored emoji/notes in 'notes' column during migration
          monsterId: d.monster_id,
          ownerId: d.assignee_id,
          createdByUid: d.assignee_id, // We'll simplify this mapping
          type: d.is_duo ? 'duo' : 'solo',
          tinyVersion: d.title, // In Supabase, we might not have mapped tinyVersion, fallback to title
          cueAfter: d.cue_time,
          cueTime: d.cue_time,
          createdAt: d.created_at || Date.now(),
          archivedAt: d.archived_at,
          sealedAt: d.sealed_at,
          history: d.history || {},
          dropsClaimed: d.drops_claimed || {}
        } as unknown as Habit));
        callback(habits);
      }
    });

  const channel = supabase.channel('public:habits')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, () => {
      supabase
        .from('habits')
        .select('*')
        .is('archived_at', null)
        .then(({ data, error }) => {
          if (!error && data) {
            const habits = data.map(d => ({
              id: d.id,
              title: d.title,
              emoji: d.notes,
              monsterId: d.monster_id,
              ownerId: d.assignee_id,
              createdByUid: d.assignee_id,
              type: d.is_duo ? 'duo' : 'solo',
              tinyVersion: d.title,
              cueAfter: d.cue_time,
              cueTime: d.cue_time,
              createdAt: d.created_at || Date.now(),
              archivedAt: d.archived_at,
              sealedAt: d.sealed_at,
              history: d.history || {},
              dropsClaimed: d.drops_claimed || {}
            } as unknown as Habit));
            callback(habits);
          }
        });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createHabit = async (
  habit: Omit<Habit, 'id' | 'createdAt' | 'history' | 'dropsClaimed'>
): Promise<string> => {
  const id = crypto.randomUUID();
  const { error } = await supabase.from('habits').insert({
    id,
    title: habit.title,
    notes: habit.emoji,
    type: 'good',
    is_duo: habit.type === 'duo',
    assignee_id: habit.ownerId,
    cue_time: habit.cueTime || habit.cueAfter,
    monster_id: habit.monsterId,
    history: {},
    drops_claimed: {},
    created_at: Date.now()
  });

  if (error) throw error;
  return id;
};

export const archiveHabit = async (habitId: string): Promise<void> => {
  const { error } = await supabase.from('habits').update({ archived_at: Date.now() }).eq('id', habitId);
  if (error) throw error;
};

export const sealHabit = async (habitId: string): Promise<void> => {
  const { error } = await supabase.from('habits').update({ sealed_at: Date.now() }).eq('id', habitId);
  if (error) throw error;
};

const rewardFor = (mode: 'done' | 'tiny') =>
  mode === 'done'
    ? { xp: HABIT_CHECKIN_XP, gold: HABIT_CHECKIN_GOLD }
    : { xp: HABIT_TINY_XP, gold: HABIT_TINY_GOLD };

export const checkInHabit = async (
  uid: string,
  habitId: string,
  dateKey: string,
  mode: 'done' | 'tiny',
  actorKey?: 'tit' | 'tun'
): Promise<HabitCheckOutcome> => {
  return gamificationMutex.runExclusive(async () => {
  if (!isCheckableDay(dateKey)) {
    throw new Error('Chỉ điểm danh được hôm nay hoặc hôm qua thôi nhé!');
  }

  // 1. Fetch Habit & Stats
  const [ { data: habitData, error: habitErr }, { data: statsData, error: statsErr } ] = await Promise.all([
    supabase.from('habits').select('*').eq('id', habitId).single(),
    supabase.from('user_stats').select('*').eq('uid', uid).single()
  ]);

  if (habitErr || !habitData) throw new Error('Thói quen không tồn tại');
  if (statsErr || !statsData) throw new Error('User stats not found');

  const history = { ...(habitData.history || {}) };
  const dropsClaimed = { ...(habitData.drops_claimed || {}) };
  const existing = history[dateKey];
  let outcome: HabitCheckOutcome;

  const rollDrop = (out: HabitCheckOutcome, chanceMultiplier = 1, claimKey = dateKey) => {
    if (dateKey !== getTodayKey() || dropsClaimed[claimKey]) return;
    dropsClaimed[claimKey] = true;
    if (Math.random() >= HABIT_DROP_CHANCE * chanceMultiplier) return;
    if (Math.random() < 0.6) {
      const amount = 15 + Math.floor(Math.random() * 16);
      out.drop = { type: 'gold', amount };
      out.goldDelta += amount;
    } else {
      const shards = (statsData.freeze_shards || 0) + 1;
      const freezeEarned = shards >= FREEZE_SHARDS_PER_FREEZE;
      out.drop = {
        type: 'shard',
        shards: freezeEarned ? shards - FREEZE_SHARDS_PER_FREEZE : shards,
        freezeEarned
      };
    }
  };

  const isDuo = habitData.is_duo;

  if (isDuo) {
    if (actorKey !== 'tit' && actorKey !== 'tun') {
      throw new Error('Thiếu danh tính người điểm danh');
    }
    const partnerKey = actorKey === 'tit' ? 'tun' : 'tit';
    const r = rewardFor('tiny');

    // Roll drop before RPC so we can pass claim key if earned
    const claimKey = `${dateKey}:${actorKey}`;
    const canClaimDrop = dateKey === getTodayKey() && !dropsClaimed[claimKey];
    let willClaimDrop = false;
    let earnedDrop: HabitCheckOutcome['drop'];
    let dropGold = 0;

    if (canClaimDrop) {
      const chanceMultiplier = (existing === partnerKey) ? 2 : 1;
      if (Math.random() < HABIT_DROP_CHANCE * chanceMultiplier) {
        willClaimDrop = true;
        if (Math.random() < 0.6) {
          dropGold = 15 + Math.floor(Math.random() * 16);
          earnedDrop = { type: 'gold', amount: dropGold };
        } else {
          const shards = (statsData.freeze_shards || 0) + 1;
          const freezeEarned = shards >= FREEZE_SHARDS_PER_FREEZE;
          earnedDrop = {
            type: 'shard',
            shards: freezeEarned ? shards - FREEZE_SHARDS_PER_FREEZE : shards,
            freezeEarned
          };
        }
      }
    }

    // Atomic update for history + drops_claimed
    const { data: rpcData, error: rpcErr } = await supabase.rpc('atomic_update_habit_duo_rpc', {
      p_habit_id: habitId,
      p_date_key: dateKey,
      p_actor_key: actorKey,
      p_partner_key: partnerKey,
      p_claim_key: willClaimDrop ? claimKey : null
    });

    if (rpcErr) throw rpcErr;
    
    // Process outcome based on what actually happened
    const action = rpcData.action;
    if (action === 'unchecked') {
      outcome = { action: 'unchecked', mode: 'tiny', xpDelta: -r.xp, goldDelta: -r.gold };
    } else if (action === 'unchecked_duo') {
      outcome = { action: 'unchecked', mode: 'tiny', xpDelta: -r.xp, goldDelta: -r.gold, duoCompleted: true };
    } else if (action === 'checked_duo') {
      outcome = { action: 'checked', mode: 'tiny', xpDelta: r.xp, goldDelta: r.gold + dropGold, duoCompleted: true, drop: earnedDrop };
    } else {
      outcome = { action: 'checked', mode: 'tiny', xpDelta: r.xp, goldDelta: r.gold + dropGold, drop: earnedDrop };
    }
    
    // No need to update 'habits' again, RPC handled it.
  } else if (existing === mode) {
    const r = rewardFor(mode);
    delete history[dateKey];
    outcome = { action: 'unchecked', mode, xpDelta: -r.xp, goldDelta: -r.gold };
  } else if (existing === 'done' || existing === 'tiny') {
    const oldR = rewardFor(existing);
    const newR = rewardFor(mode);
    history[dateKey] = mode;
    outcome = { action: 'switched', mode, xpDelta: newR.xp - oldR.xp, goldDelta: newR.gold - oldR.gold };
  } else {
    const r = rewardFor(mode);
    history[dateKey] = mode;
    outcome = { action: 'checked', mode, xpDelta: r.xp, goldDelta: r.gold };
    rollDrop(outcome);
  }

  // 2. Update Habit History (Only for non-Duo, or if RPC wasn't used)
  if (!isDuo) {
    const { error: hUpdateErr } = await supabase.from('habits').update({ history, drops_claimed: dropsClaimed }).eq('id', habitId);
    if (hUpdateErr) throw hUpdateErr;
  }

  // 3. Update User Stats
  const finalXp = Math.max(0, (statsData.xp || 0) + outcome.xpDelta);
  const finalGold = Math.max(0, (statsData.gold || 0) + outcome.goldDelta);
  const statsUpdates: Record<string, unknown> = {
    xp: finalXp,
    gold: finalGold,
    level: calculateLevel(finalXp).level
  };

  if (outcome.drop?.type === 'shard') {
    statsUpdates.freeze_shards = outcome.drop.shards;
    if (outcome.drop.freezeEarned) {
      statsUpdates.streak_freezes = (statsData.streak_freezes || 0) + 1;
    }
  }

  const { error: sUpdateErr } = await supabase.from('user_stats').update(statsUpdates).eq('uid', uid);
  if (sUpdateErr) throw sUpdateErr;

  return outcome;
  });
};
