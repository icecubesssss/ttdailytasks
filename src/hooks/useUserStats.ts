import { useState, useEffect } from 'react';
import * as userService from '../services/userService';
import { 
  getAssigneeIdByEmail, calculateLevel, TeamMember, UserData
} from '../utils/helpers';
import {
  DEFAULT_AVATARS, BOOSTER_DURATIONS, GOLD_PER_TASK, GOLD_PER_SUBTASK, 
  DAILY_CHECKIN_GOLD, XP_PER_TASK, DAILY_CHECKIN_XP, 
  XP_PER_SUBTASK, SHOP_ITEMS
} from '../utils/constants';
import { useAppStore, defaultUserData } from '../store/useAppStore';

const DEFAULT_SHORTCUT_NAME = 'Làm việc';
type AssigneeKey = 'tit' | 'tun';
type BoosterType = keyof typeof BOOSTER_DURATIONS;

const isAssigneeKey = (value: string | null): value is AssigneeKey => value === 'tit' || value === 'tun';
const isBoosterType = (value: unknown): value is BoosterType => value === 'xp' || value === 'gold';

const getDefaultAvatarByEmail = (email: string | null | undefined, fallbackSeed?: string) => {
  const assigneeId = getAssigneeIdByEmail(email);
  if (isAssigneeKey(assigneeId)) return DEFAULT_AVATARS[assigneeId];
  return { seed: fallbackSeed };
};

const ignoreAsyncError = () => undefined;

export function useUserStats(user: any) {
  const userData = useAppStore((state: any) => state.userData) as UserData;
  const setUserData = useAppStore((state: any) => state.setUserData);
  const patchUserData = useAppStore((state: any) => state.patchUserData);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 1. Sync User Stats
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const unsubscribe = userService.subscribeToUserStats(user.uid, async (data: any) => {
      if (data) {
        let needsUpdate = false;
        const updates: any = {};

        if (data.streakFreezes === undefined) { updates.streakFreezes = 3; needsUpdate = true; }
        if (data.unlockedBadgeIds === undefined) { updates.unlockedBadgeIds = []; updates.lastSeenLevel = data.level || 1; needsUpdate = true; }
        if (data.avatarConfig === undefined || data.avatarConfig?.avatarVersion !== 8) {
          updates.avatarConfig = getDefaultAvatarByEmail(user.email, user.displayName);
          needsUpdate = true;
        }
        if (data.ttGold === undefined) { updates.ttGold = 0; needsUpdate = true; }
        if (data.ticketHistory === undefined) { updates.ticketHistory = []; needsUpdate = true; }
        if (data.checkInHistory === undefined) { updates.checkInHistory = {}; needsUpdate = true; }
        if (data.mascotName === undefined) { updates.mascotName = 'Mochi'; needsUpdate = true; }
        if (data.mascotAvatar === undefined) { updates.mascotAvatar = '🤖'; needsUpdate = true; }

        if (needsUpdate) {
          userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
        }
        patchUserData({ ...data, ...updates, isLoaded: true });
      } else {
        const initial = { 
          ...defaultUserData,
          level: 1,
          isDarkMode: false,
          streak: 0,
          streakFreezes: 3, 
          unlockedBadgeIds: [], lastSeenLevel: 1, ownedItemIds: [], aiMode: 'cute', 
          ttGold: 0, ticketHistory: [], checkInHistory: {}, autoFocusShortcut: true, 
          shortcutName: DEFAULT_SHORTCUT_NAME, offShortcutName: '', defaultView: 'tasks', 
          calendarVisibility: { tit: true, tun: true }, 
          avatarConfig: getDefaultAvatarByEmail(user?.email, user?.displayName) 
        };
        userService.initializeUserStats(user.uid, initial).catch(ignoreAsyncError);
        patchUserData({ ...initial, isLoaded: true });
      }
    });
    return () => unsubscribe();
  }, [user, patchUserData, user?.email, user?.displayName]);

  // 2. Sync Team Members
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const un = userService.subscribeToTeamMembers(setTeamMembers);
    return () => un();
  }, [user]);

  // 3. Heartbeat
  useEffect(() => {
    if (!user || user.uid === "local-user-test" || user.isAnonymous) return;

    const updateActive = async () => {
      try {
        await userService.updateTeamMemberActive(user.uid, {
          photoURL: undefined,
          streak: userData.streak || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          ttGold: userData.ttGold || 0,
          streakFreezes: userData.streakFreezes || 0
        });
      } catch {
        ignoreAsyncError();
      }
    };

    updateActive();
    const interval = setInterval(updateActive, 20000);
    return () => clearInterval(interval);
  }, [user, userData.ownedItemIds, userData.avatarConfig, userData.streak, userData.xp, userData.level, userData.ttGold, userData.streakFreezes]);

  // 4. Booster Cleanup
  useEffect(() => {
    if (!userData.activeBooster) return;
    const interval = setInterval(() => {
      if (userData.activeBooster && Date.now() > userData.activeBooster.expiresAt) {
        const updates = { activeBooster: null };
        patchUserData(updates);
        if (user && user.uid !== 'local-user-test') {
          userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userData.activeBooster, user, patchUserData]);

  const handleUpdateSettings = async (updates: any) => {
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  const handleBuyItem = async (item: any) => {
    if ((userData.ttGold || 0) < item.price) {
      alert("Bạn không đủ TT Gold để mua vật phẩm này! Hãy chăm chỉ làm việc thêm nhé.");
      return;
    }
    const currentLevel = calculateLevel(userData.xp || 0).level;
    if (currentLevel < (item.minLevel || 1)) {
      alert(`Bạn cần đạt Level ${item.minLevel} để mua vật phẩm này!`);
      return;
    }

    let updates: any = { ttGold: (userData.ttGold || 0) - item.price };
    if (item.id === 'freeze') updates.streakFreezes = (userData.streakFreezes || 0) + 1;
    else if (item.type === 'booster') {
      const boosterType = item.boosterType as unknown;
      const durationMs = isBoosterType(boosterType) ? BOOSTER_DURATIONS[boosterType] : 0;
      updates.activeBooster = { id: item.id, multiplier: item.multiplier, boosterType: item.boosterType, expiresAt: Date.now() + durationMs };
    } else {
      if (userData.ownedItemIds?.includes(item.id) && item.type !== 'ticket') {
        alert("Bạn đã sở hữu vật phẩm này rồi!");
        return;
      }
      updates.ownedItemIds = [...(userData.ownedItemIds || []), item.id];
    }

    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  const handleUseTicket = async (ticketId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === ticketId);
    if (!item || !userData.ownedItemIds?.includes(ticketId)) return;
    if (!window.confirm(`Bạn muốn sử dụng "${item.name}" ngay bây giờ?`)) return;

    const newOwned = [...userData.ownedItemIds];
    newOwned.splice(newOwned.indexOf(ticketId), 1);

    const updates = {
      ownedItemIds: newOwned,
      ticketHistory: [...(userData.ticketHistory || []), { id: crypto.randomUUID(), ticketId, name: item.name, usedAt: Date.now(), user: user.displayName || "Thành viên" }]
    };

    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
    alert(`Đã kích hoạt ${item.name}! Hãy tận hưởng nhé ✨`);
  };

  const handleEquipItem = async (category: string, val: any) => {
    const updates = { avatarConfig: { ...(userData.avatarConfig || {}), [category]: val } };
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  const awardTaskRewards = async (isLate: boolean) => {
    if (!user || user.uid === 'local-user-test') return;

    try {
      const today = new Date().toDateString();
      let xpEarned = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
      let statsUpdates: any = { xp: (userData.xp || 0) + xpEarned };

      if (userData.lastCheckIn !== today) {
        xpEarned += DAILY_CHECKIN_XP;
        statsUpdates.xp = (userData.xp || 0) + xpEarned;
        statsUpdates.lastCheckIn = today;
        statsUpdates.ttGold = (userData.ttGold || 0) + DAILY_CHECKIN_GOLD;
        statsUpdates.checkInHistory = { ...(userData.checkInHistory || {}), [today]: 'active' };

        if (userData.lastCheckIn) {
          const diffDays = Math.round((new Date().setHours(0,0,0,0) - new Date(userData.lastCheckIn).setHours(0,0,0,0)) / 86400000);
          if (diffDays === 1) statsUpdates.streak = (userData.streak || 0) + 1;
          else if (diffDays > 1 && (userData.streakFreezes || 0) >= diffDays - 1) {
            statsUpdates.streak = (userData.streak || 0) + 1;
            statsUpdates.streakFreezes = userData.streakFreezes - (diffDays - 1);
            for (let i = 1; i < diffDays; i++) statsUpdates.checkInHistory[new Date(Date.now() - i*86400000).toDateString()] = 'freeze';
          } else statsUpdates.streak = 1;
        } else statsUpdates.streak = 1;
      }

      let goldEarned = GOLD_PER_TASK;
      if (userData.activeBooster) {
        if (userData.activeBooster.boosterType === 'xp') xpEarned *= userData.activeBooster.multiplier;
        else if (userData.activeBooster.boosterType === 'gold') goldEarned *= userData.activeBooster.multiplier;
      }
      statsUpdates.xp = (userData.xp || 0) + Math.round(xpEarned);
      statsUpdates.ttGold = (userData.ttGold || 0) + Math.round(goldEarned);
      statsUpdates.level = calculateLevel(statsUpdates.xp).level;
      
      await userService.updateUserStats(user.uid, statsUpdates);
      patchUserData(statsUpdates);
    } catch (e) {
      console.warn('Award rewards failed', e);
    }
  };

  const awardSubTaskRewards = async () => {
    if (!user || user.uid === 'local-user-test') return;

    let xpG = XP_PER_SUBTASK;
    let goldG = GOLD_PER_SUBTASK;
    if (userData.activeBooster) {
      if (userData.activeBooster.boosterType === 'xp') xpG *= userData.activeBooster.multiplier;
      else if (userData.activeBooster.boosterType === 'gold') goldG *= userData.activeBooster.multiplier;
    }
    
    const updates = {
      xp: (userData.xp || 0) + Math.round(xpG),
      ttGold: (userData.ttGold || 0) + Math.round(goldG)
    };

    patchUserData(updates);
    userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  return {
    userData,
    setUserData,
    teamMembers,
    handleBuyItem,
    handleUseTicket,
    handleEquipItem,
    handleUpdateSettings,
    awardTaskRewards,
    awardSubTaskRewards
  };
}
