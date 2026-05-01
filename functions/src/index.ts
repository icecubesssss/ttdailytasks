import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Constants (Keep in sync with Client utils/constants.ts)
const XP_PER_TASK = 20;
const DAILY_CHECKIN_XP = 50;
const DAILY_CHECKIN_GOLD = 100;
const GOLD_PER_TASK = 10;
const XP_BASE = 100;

function calculateLevel(xp: number): number {
  let level = 1;
  let currentXp = xp;
  let xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));

  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    level += 1;
    xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));
  }
  return level;
}

interface AwardRewardsData {
  isLate?: boolean;
  appId?: string;
}

/**
 * Cloud Function to award rewards for task completion.
 * This is the source of truth for streak and stats.
 */
export const awardRewards = functions.https.onCall(async (data: AwardRewardsData, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const isLate = data.isLate || false;
  const appId = data.appId || 'tt-daily-task';

  const userStatsRef = db.doc(`artifacts/${appId}/users/${uid}/profile/stats`);
  const teamMemberRef = db.doc(`artifacts/${appId}/public/data/team_members/${uid}`);

  return db.runTransaction(async (transaction) => {
    const statsDoc = await transaction.get(userStatsRef);
    if (!statsDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User stats not found.');
    }

    const userData = statsDoc.data() || {};
    const today = new Date().toDateString();
    
    let updates: Record<string, any> = {};
    let xpEarned = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
    let goldEarned = GOLD_PER_TASK;

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
    updates.level = calculateLevel(finalXp);

    // Update both documents in transaction
    transaction.update(userStatsRef, updates);
    
    // For team member, only update public fields
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
});
