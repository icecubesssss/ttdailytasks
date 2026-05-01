import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import * as userService from '../services/userService';
import { 
  getAssigneeIdByEmail, calculateLevel, TeamMember, UserData
} from '../utils/helpers';
import {
  DEFAULT_AVATARS, BOOSTER_DURATIONS, GOLD_PER_TASK, GOLD_PER_SUBTASK, 
  DAILY_CHECKIN_GOLD, XP_PER_TASK, DAILY_CHECKIN_XP, 
  XP_PER_SUBTASK, SHOP_ITEMS, ShopItem
} from '../utils/constants';
import { useAppStore, defaultUserData } from '../store/useAppStore';

type UserStatsUpdates = Partial<UserData> & Record<string, unknown>;

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

export function useUserStats(user: User | null) {
  const userData = useAppStore((state) => state.userData);
  const setUserData = useAppStore((state) => state.setUserData);
  const patchUserData = useAppStore((state) => state.patchUserData);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 1. Sync User Stats
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const unsubscribe = userService.subscribeToUserStats(user.uid, async (data: UserData | null, isFromServer: boolean) => {
      if (data) {
        let needsUpdate = false;
        const updates: UserStatsUpdates = {};

        if (data.streakFreezes === undefined) { updates.streakFreezes = 3; needsUpdate = true; }
        if (data.unlockedBadgeIds === undefined) { updates.unlockedBadgeIds = []; updates.lastSeenLevel = data.level || 1; needsUpdate = true; }
        if (data.avatarConfig === undefined || (data.avatarConfig as Record<string, unknown>)?.avatarVersion !== 8) {
          updates.avatarConfig = getDefaultAvatarByEmail(user.email ?? undefined, user.displayName ?? undefined);
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
        patchUserData({ ...data, ...updates, isLoaded: true, isFromServer });
      } else {
        // DO NOT initialize with 0 if we can find data in teamMembers
        const currentMember = teamMembers.find(m => m.uid === user.uid);
        const initial = { 
          ...defaultUserData,
          level: currentMember?.level || 1,
          streak: currentMember?.streak || 0,
          streakFreezes: currentMember?.streakFreezes !== undefined ? currentMember.streakFreezes : 3,
          xp: currentMember?.xp || 0,
          ttGold: currentMember?.ttGold || 0,
          isDarkMode: false,
          unlockedBadgeIds: [], lastSeenLevel: 1, ownedItemIds: [], aiMode: 'cute', 
          ticketHistory: [], checkInHistory: {}, autoFocusShortcut: true, 
          shortcutName: DEFAULT_SHORTCUT_NAME, offShortcutName: '', defaultView: 'tasks', 
          calendarVisibility: { tit: true, tun: true }, 
          avatarConfig: getDefaultAvatarByEmail(user?.email ?? undefined, user?.displayName ?? undefined) 
        };
        userService.initializeUserStats(user.uid, initial).catch(ignoreAsyncError);
        patchUserData({ ...initial, isLoaded: true });
      }
    });
    return () => unsubscribe();
  }, [user, patchUserData, user?.email, user?.displayName]);

  // 2. Sync Team Members (Single Source of Truth for Stats)
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const un = userService.subscribeToTeamMembers((members, isFromServer) => {
      setTeamMembers(members);
      
      const currentMember = members.find(m => m.uid === user.uid);
      if (currentMember) {
        const isTit = user.email?.toLowerCase().includes('dinhthai');
        const correctFreezes = isTit
          ? Math.max(currentMember.streakFreezes || 0, 3)
          : (currentMember.streakFreezes || 0);

        // Patch Zustand store so Header is correct
        patchUserData({
          streak: currentMember.streak,
          xp: currentMember.xp,
          level: currentMember.level,
          ttGold: currentMember.ttGold,
          streakFreezes: correctFreezes,
          lastCheckIn: currentMember.lastCheckIn,
          isFromServer // Only trust server data
        });

        // If Firestore has wrong freeze count, fix it so Stats card also shows correct value
        if (correctFreezes !== (currentMember.streakFreezes || 0)) {
          userService.updateTeamMemberActive(user.uid, { streakFreezes: correctFreezes }).catch(ignoreAsyncError);
          userService.updateUserStats(user.uid, { streakFreezes: correctFreezes }).catch(ignoreAsyncError);
        }
      }
    });
    return () => un();
  }, [user, patchUserData]);

  // 3. Heartbeat
  useEffect(() => {
    if (!user || user.uid === "local-user-test" || user.isAnonymous) return;

    const updateActive = async () => {
      // CRITICAL: Do NOT heartbeat (which pushes stats to server) if we are using cached/stale data.
      // This prevents overwriting fresh server stats with old cached stats from a previous session.
      if (!userData.isFromServer) return;

      try {
        await userService.updateTeamMemberActive(user.uid, {
          photoURL: undefined,
          streak: userData.streak || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          ttGold: userData.ttGold || 0,
          streakFreezes: userData.streakFreezes || 0,
          lastCheckIn: userData.lastCheckIn
        });
      } catch {
        ignoreAsyncError();
      }
    };

    updateActive();
    const interval = setInterval(updateActive, 20000);
    return () => clearInterval(interval);
  }, [user, userData.ownedItemIds, userData.avatarConfig, userData.streak, userData.xp, userData.level, userData.ttGold, userData.streakFreezes, userData.lastCheckIn, userData.isFromServer]);

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

  const handleUpdateSettings = async (updates: UserStatsUpdates) => {
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  const handleBuyItem = async (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if ((userData.ttGold || 0) < item.price) {
      alert("Bạn không đủ TT Gold để mua vật phẩm này! Hãy chăm chỉ làm việc thêm nhé.");
      return;
    }
    const currentLevel = calculateLevel(userData.xp || 0).level;
    if (currentLevel < (item.minLevel || 1)) {
      alert(`Bạn cần đạt Level ${item.minLevel} để mua vật phẩm này!`);
      return;
    }

    let updates: UserStatsUpdates = { ttGold: (userData.ttGold || 0) - item.price };
    if (item.id === 'freeze') updates.streakFreezes = (userData.streakFreezes || 0) + 1;
    else if (item.type === 'booster') {
      const boosterType = item.boosterType as unknown;
      const durationMs = isBoosterType(boosterType) ? BOOSTER_DURATIONS[boosterType] : 0;
      updates.activeBooster = { id: item.id, multiplier: item.multiplier ?? 1, boosterType: item.boosterType ?? '', expiresAt: Date.now() + durationMs };
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
      ticketHistory: [...(userData.ticketHistory || []), { id: crypto.randomUUID(), ticketId, name: item.name, usedAt: Date.now(), user: user?.displayName || "Thành viên" }]
    };

    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
    alert(`Đã kích hoạt ${item.name}! Hãy tận hưởng nhé ✨`);
  };

  const handleEquipItem = async (category: string, val: unknown) => {
    const updates = { avatarConfig: { ...(userData.avatarConfig || {}), [category]: val } };
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };

  const awardTaskRewards = async (isLate: boolean) => {
    if (!user || user.uid === 'local-user-test') return;
    
    // 1. Call Server-Side Logic (Source of Truth)
    userService.callAwardRewards(isLate).catch(e => {
      console.warn('Cloud rewards failed, falling back to local simulation', e);
    });

    // 2. Optimistic UI (Simple feedback while server processes)
    // We don't simulate the complex streak logic locally anymore to avoid confusion
    const xpEarned = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
    const finalXp = (userData.xp || 0) + xpEarned;
    
    patchUserData({
      xp: finalXp,
      ttGold: (userData.ttGold || 0) + GOLD_PER_TASK,
      level: calculateLevel(finalXp).level
    });
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
