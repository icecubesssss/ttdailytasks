import { db, appId } from '../firebase';
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, Unsubscribe, DocumentData, runTransaction
} from 'firebase/firestore';
import { UserData, TeamMember, calculateLevel } from '../utils/helpers';
import { DAILY_CHECKIN_XP, DAILY_CHECKIN_GOLD } from '../utils/constants';
import { computeTaskBaseReward } from '../game/rewardEngine';

export const callAwardRewards = async (uid: string, isLate: boolean, comboCount = 1) => {
  const userStatsRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  const teamMemberRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_members', uid);

  return await runTransaction(db, async (transaction) => {
    const statsDoc = await transaction.get(userStatsRef);
    if (!statsDoc.exists()) {
      throw new Error('User stats not found');
    }

    const userData = statsDoc.data() as UserData;
    const today = new Date().toDateString();

    const updates: any = {};
    // Công thức thưởng đi qua Reward Engine (combo=1 ⇒ đúng bằng công thức cũ)
    const base = computeTaskBaseReward(isLate, comboCount);
    let xpEarned = base.xp;
    let goldEarned = base.gold;

    // 1. Daily Check-in Logic
    if (userData.lastCheckIn !== today) {
      xpEarned += DAILY_CHECKIN_XP;
      goldEarned += DAILY_CHECKIN_GOLD;
      updates.lastCheckIn = today;
      
      const checkInHistory = { ...(userData.checkInHistory || {}) };
      checkInHistory[today] = 'active';
      updates.checkInHistory = checkInHistory;

      if (userData.lastCheckIn) {
        const lastDate = new Date(userData.lastCheckIn);
        lastDate.setHours(0,0,0,0);
        const currentDate = new Date();
        currentDate.setHours(0,0,0,0);
        
        const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
        
        if (diffDays === 1) {
          updates.streak = (userData.streak || 0) + 1;
        } else if (diffDays > 1 && (userData.streakFreezes || 0) >= diffDays - 1) {
          updates.streak = (userData.streak || 0) + 1;
          updates.streakFreezes = (userData.streakFreezes || 0) - (diffDays - 1);
          for (let i = 1; i < diffDays; i++) {
            const freezeDate = new Date(currentDate.getTime() - i * 86400000).toDateString();
            checkInHistory[freezeDate] = 'freeze';
          }
        } else if (diffDays > 0) {
          updates.streak = 1;
        }
      } else {
        updates.streak = 1;
      }
    }

    // 2. Booster Logic
    if (userData.activeBooster && Date.now() < userData.activeBooster.expiresAt) {
      if (userData.activeBooster.boosterType === 'xp') {
        xpEarned *= userData.activeBooster.multiplier;
      } else if (userData.activeBooster.boosterType === 'gold') {
        goldEarned *= userData.activeBooster.multiplier;
      }
    }

    // 3. Final Accumulation
    const finalXp = (userData.xp || 0) + Math.round(xpEarned);
    const finalGold = (userData.ttGold || 0) + Math.round(goldEarned);
    
    updates.xp = finalXp;
    updates.ttGold = finalGold;
    updates.level = calculateLevel(finalXp).level;

    transaction.update(userStatsRef, updates);
    
    const teamUpdates = {
      streak: updates.streak !== undefined ? updates.streak : userData.streak,
      xp: finalXp,
      level: updates.level,
      ttGold: finalGold,
      streakFreezes: updates.streakFreezes !== undefined ? updates.streakFreezes : userData.streakFreezes,
      lastCheckIn: updates.lastCheckIn || userData.lastCheckIn,
      lastActive: Date.now()
    };
    transaction.set(teamMemberRef, teamUpdates, { merge: true });

    return { success: true, updates };
  });
};

export const subscribeToUserStats = (uid: string, callback: (data: UserData | null, isFromServer: boolean) => void): Unsubscribe => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  return onSnapshot(userDocRef, (docSnap) => {
    const isFromServer = !docSnap.metadata.fromCache;
    if (docSnap.exists()) {
      callback(docSnap.data() as UserData, isFromServer);
    } else {
      callback(null, isFromServer);
    }
  });
};

export const subscribeToTeamMembers = (callback: (members: TeamMember[], isFromServer: boolean) => void): Unsubscribe => {
  const q = collection(db, 'artifacts', appId, 'public', 'data', 'team_members');
  return onSnapshot(q, (snap) => {
    const isFromServer = !snap.metadata.fromCache;
    callback(snap.docs.map(d => d.data() as TeamMember), isFromServer);
  });
};

export const initializeUserStats = async (uid: string, initialData: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await setDoc(userDocRef, initialData, { merge: true });
};

export const updateUserStats = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await updateDoc(userDocRef, updates as DocumentData);
  
  // AUTO-SYNC TO TEAM MEMBERS
  const publicFields: (keyof TeamMember)[] = ['streak', 'level', 'xp', 'ttGold', 'streakFreezes', 'lastCheckIn'];
  const teamUpdates: Partial<TeamMember> = {};
  let hasTeamUpdates = false;
  
  for (const field of publicFields) {
    if (field in updates) {
      (teamUpdates as any)[field] = (updates as any)[field];
      hasTeamUpdates = true;
    }
  }
  
  if (hasTeamUpdates) {
    updateTeamMemberActive(uid, teamUpdates).catch(() => undefined);
  }
};

export const updateTeamMemberActive = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_members', uid);
  return await updateDoc(docRef, {
    ...data,
    lastActive: Date.now()
  });
};

export const registerTeamMember = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_members', uid);
  return await setDoc(docRef, {
    ...data,
    lastActive: Date.now()
  }, { merge: true });
};
