import { supabase } from '../supabase';
import { UserData, TeamMember, calculateLevel } from '../utils/helpers';
import { DAILY_CHECKIN_XP, DAILY_CHECKIN_GOLD } from '../utils/constants';
import { computeTaskBaseReward, computeSubtaskReward } from '../game/rewardEngine';
import { gamificationMutex } from '../utils/mutex';

export const callAwardRewards = async (uid: string, isLate: boolean, comboCount = 1) => {
  return gamificationMutex.runExclusive(async () => {
  const { data: statsData, error: statsError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('uid', uid)
    .single();

  if (statsError || !statsData) {
    throw new Error('User stats not found');
  }

  const userData = {
    xp: statsData.xp,
    ttGold: statsData.gold,
    level: statsData.level,
    streak: statsData.streak,
    streakFreezes: statsData.streak_freezes,
    lastCheckIn: statsData.last_check_in,
    checkInHistory: statsData.check_in_history || {},
    activeBooster: null
  } as Partial<UserData>;

  const today = new Date().toDateString();
  const updates: any = {};
  const dbUpdates: any = {};

  const base = computeTaskBaseReward(isLate, comboCount);
  let xpEarned = base.xp;
  let goldEarned = base.gold;

  if (userData.lastCheckIn !== today) {
    xpEarned += DAILY_CHECKIN_XP;
    goldEarned += DAILY_CHECKIN_GOLD;
    updates.lastCheckIn = today;
    dbUpdates.last_check_in = today;
    
    const checkInHistory = { ...(userData.checkInHistory || {}) };
    checkInHistory[today] = 'active';
    updates.checkInHistory = checkInHistory;
    dbUpdates.check_in_history = checkInHistory;

    if (userData.lastCheckIn) {
      const lastDate = new Date(userData.lastCheckIn);
      lastDate.setHours(0,0,0,0);
      const currentDate = new Date();
      currentDate.setHours(0,0,0,0);
      
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
      const currentFreezes = userData.streakFreezes !== undefined ? userData.streakFreezes : 3;
      
      if (diffDays === 1) {
        updates.streak = (userData.streak || 0) + 1;
      } else if (diffDays > 1 && currentFreezes >= diffDays - 1) {
        updates.streak = (userData.streak || 0) + 1;
        updates.streakFreezes = currentFreezes - (diffDays - 1);
        for (let i = 1; i < diffDays; i++) {
          const freezeDate = new Date(currentDate.getTime() - i * 86400000).toDateString();
          checkInHistory[freezeDate] = 'freeze';
        }
        dbUpdates.check_in_history = checkInHistory;
      } else if (diffDays > 0) {
        updates.streak = 1;
        // The user missed more days than they had freezes for.
        // The freezes were consumed chronologically, so they are now 0.
        updates.streakFreezes = 0;
      }
    } else {
      updates.streak = 1;
    }
    
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.streakFreezes !== undefined) dbUpdates.streak_freezes = updates.streakFreezes;
  }

  const finalXp = (userData.xp || 0) + Math.round(xpEarned);
  const finalGold = (userData.ttGold || 0) + Math.round(goldEarned);
  const newLevel = calculateLevel(finalXp).level;
  
  updates.xp = finalXp;
  updates.ttGold = finalGold;
  updates.level = newLevel;
  
  dbUpdates.xp = finalXp;
  dbUpdates.gold = finalGold;
  dbUpdates.level = newLevel;

  const { error: updateError } = await supabase
    .from('user_stats')
    .update(dbUpdates)
    .eq('uid', uid);
    
  if (updateError) throw updateError;
  
  return { success: true, updates };
  });
};

export const subscribeToUserStats = (uid: string, callback: (data: UserData | null, isFromServer: boolean) => void) => {
  supabase
    .from('user_stats')
    .select('*')
    .eq('uid', uid)
    .single()
    .then(({ data, error }) => {
      if (!error && data) {
        callback({
          xp: data.xp,
          ttGold: data.gold,
          level: data.level,
          streak: data.streak,
          streakFreezes: data.streak_freezes,
          freezeShards: data.freeze_shards,
          lastCheckIn: data.last_check_in,
          checkInHistory: data.check_in_history,
          avatarConfig: data.avatar_config && Object.keys(data.avatar_config).length > 0 ? data.avatar_config : null,
          ownedItemIds: data.owned_item_ids,
          activeBooster: data.active_booster,
          isDarkMode: data.is_dark_mode,
          aiMode: data.ai_mode,
          aiModel: data.ai_model,
          mascotName: data.mascot_name,
          mascotAvatar: data.mascot_avatar,
          calendarVisibility: data.calendar_visibility,
          defaultView: data.default_view,
          autoSyncCalendar: data.auto_sync_calendar,
          music: data.music,
          autoFocusShortcut: data.auto_focus_shortcut,
          shortcutName: data.shortcut_name,
          offShortcutName: data.off_shortcut_name,
          ticketHistory: data.ticket_history,
          unlockedBadgeIds: data.unlocked_badge_ids,
          lastSeenLevel: data.last_seen_level
        } as UserData, true);
      } else {
        callback(null, true);
      }
    });

  const channel = supabase.channel(`public:user_stats:uid=eq.${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `uid=eq.${uid}` }, (payload: any) => {
      const data = payload.new;
      callback({
        xp: data.xp,
        ttGold: data.gold,
        level: data.level,
        streak: data.streak,
        streakFreezes: data.streak_freezes,
        freezeShards: data.freeze_shards,
        lastCheckIn: data.last_check_in,
        checkInHistory: data.check_in_history,
        avatarConfig: data.avatar_config && Object.keys(data.avatar_config).length > 0 ? data.avatar_config : null,
        ownedItemIds: data.owned_item_ids,
        activeBooster: data.active_booster,
        isDarkMode: data.is_dark_mode,
        aiMode: data.ai_mode,
        aiModel: data.ai_model,
        mascotName: data.mascot_name,
        mascotAvatar: data.mascot_avatar,
        calendarVisibility: data.calendar_visibility,
        defaultView: data.default_view,
        autoSyncCalendar: data.auto_sync_calendar,
        music: data.music,
        autoFocusShortcut: data.auto_focus_shortcut,
        shortcutName: data.shortcut_name,
        offShortcutName: data.off_shortcut_name,
        ticketHistory: data.ticket_history,
        unlockedBadgeIds: data.unlocked_badge_ids,
        lastSeenLevel: data.last_seen_level
      } as UserData, true);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToTeamMembers = (callback: (members: TeamMember[], isFromServer: boolean) => void) => {
  const fetchMembers = () => {
    supabase
      .from('team_members')
      .select('*, user_stats(*)')
      .then(({ data, error }) => {
        if (!error && data) {
          const members = data.map(d => ({
            uid: d.uid,
            email: d.email,
            displayName: d.display_name,
            photoURL: d.photo_url,
            lastActive: d.last_active,
            xp: d.user_stats?.xp || 0,
            ttGold: d.user_stats?.gold || 0,
            level: d.user_stats?.level || 1,
            streak: d.user_stats?.streak || 0,
            streakFreezes: d.user_stats?.streak_freezes || 3,
            lastCheckIn: d.user_stats?.last_check_in || null,
            avatarConfig: (d.user_stats?.avatar_config && Object.keys(d.user_stats.avatar_config).length > 0) ? d.user_stats.avatar_config : null,
            ownedItemIds: d.user_stats?.owned_item_ids || [],
            activeBooster: d.user_stats?.active_booster || null
          } as TeamMember));
          callback(members, true);
        }
      });
  };

  fetchMembers();

  const channel = supabase.channel('public:team_members_stats')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, fetchMembers)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, fetchMembers)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const initializeUserStats = async (uid: string, initialData: Partial<UserData>): Promise<void> => {
  await supabase.from('user_stats').upsert({
    uid,
    xp: initialData.xp || 0,
    gold: initialData.ttGold || 0,
    level: initialData.level || 1,
    streak: initialData.streak || 0,
    streak_freezes: initialData.streakFreezes || 3,
    last_check_in: initialData.lastCheckIn || null,
    check_in_history: initialData.checkInHistory || {}
  });
};

export const updateUserStats = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
  if (updates.ttGold !== undefined) dbUpdates.gold = updates.ttGold;
  if (updates.level !== undefined) dbUpdates.level = updates.level;
  if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
  if (updates.streakFreezes !== undefined) dbUpdates.streak_freezes = updates.streakFreezes;
  if (updates.freezeShards !== undefined) dbUpdates.freeze_shards = updates.freezeShards;
  if (updates.lastCheckIn !== undefined) dbUpdates.last_check_in = updates.lastCheckIn;
  if (updates.checkInHistory !== undefined) dbUpdates.check_in_history = updates.checkInHistory;
  
  if (updates.avatarConfig !== undefined) dbUpdates.avatar_config = updates.avatarConfig;
  if (updates.ownedItemIds !== undefined) dbUpdates.owned_item_ids = updates.ownedItemIds;
  if (updates.activeBooster !== undefined) dbUpdates.active_booster = updates.activeBooster;
  if (updates.isDarkMode !== undefined) dbUpdates.is_dark_mode = updates.isDarkMode;
  if (updates.aiMode !== undefined) dbUpdates.ai_mode = updates.aiMode;
  if (updates.aiModel !== undefined) dbUpdates.ai_model = updates.aiModel;
  if (updates.mascotName !== undefined) dbUpdates.mascot_name = updates.mascotName;
  if (updates.mascotAvatar !== undefined) dbUpdates.mascot_avatar = updates.mascotAvatar;
  if (updates.calendarVisibility !== undefined) dbUpdates.calendar_visibility = updates.calendarVisibility;
  if (updates.defaultView !== undefined) dbUpdates.default_view = updates.defaultView;
  if (updates.autoSyncCalendar !== undefined) dbUpdates.auto_sync_calendar = updates.autoSyncCalendar;
  if (updates.music !== undefined) dbUpdates.music = updates.music;
  if (updates.autoFocusShortcut !== undefined) dbUpdates.auto_focus_shortcut = updates.autoFocusShortcut;
  if (updates.shortcutName !== undefined) dbUpdates.shortcut_name = updates.shortcutName;
  if (updates.offShortcutName !== undefined) dbUpdates.off_shortcut_name = updates.offShortcutName;
  if (updates.ticketHistory !== undefined) dbUpdates.ticket_history = updates.ticketHistory;
  if (updates.unlockedBadgeIds !== undefined) dbUpdates.unlocked_badge_ids = updates.unlockedBadgeIds;
  if (updates.lastSeenLevel !== undefined) dbUpdates.last_seen_level = updates.lastSeenLevel;

  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('user_stats').update(dbUpdates).eq('uid', uid);
  }
};

export const updateTeamMemberActive = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  const dbUpdates: any = { last_active: Date.now() };
  if (data.displayName !== undefined) dbUpdates.display_name = data.displayName;
  if (data.photoURL !== undefined) dbUpdates.photo_url = data.photoURL;
  await supabase.from('team_members').update(dbUpdates).eq('uid', uid);
};

export const registerTeamMember = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  await supabase.from('team_members').upsert({
    uid,
    email: data.email,
    display_name: data.displayName,
    photo_url: data.photoURL,
    last_active: Date.now()
  });
};

export const callAwardSubTaskRewards = async (uid: string, activeBooster: any) => {
  return gamificationMutex.runExclusive(async () => {
    const { data: statsData } = await supabase.from('user_stats').select('*').eq('uid', uid).single();
    if (!statsData) throw new Error('User stats not found');
    
    const { xp: xpG, gold: goldG } = computeSubtaskReward(activeBooster);
    const finalXp = (statsData.xp || 0) + xpG;
    const finalGold = (statsData.gold || 0) + goldG;
    const newLevel = calculateLevel(finalXp).level;
    
    const dbUpdates = { xp: finalXp, gold: finalGold, level: newLevel };
    await supabase.from('user_stats').update(dbUpdates).eq('uid', uid);
    
    return { success: true, updates: { xp: finalXp, ttGold: finalGold, level: newLevel } };
  });
};
