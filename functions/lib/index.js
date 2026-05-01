"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardRewards = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const XP_PER_TASK = 20;
const DAILY_CHECKIN_XP = 50;
const DAILY_CHECKIN_GOLD = 100;
const GOLD_PER_TASK = 10;
const XP_BASE = 100;
function calculateLevel(xp) {
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
exports.awardRewards = functions.https.onCall(async (data, context) => {
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
        let updates = {};
        let xpEarned = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
        let goldEarned = GOLD_PER_TASK;
        if (userData.lastCheckIn !== today) {
            xpEarned += DAILY_CHECKIN_XP;
            goldEarned += DAILY_CHECKIN_GOLD;
            updates.lastCheckIn = today;
            const checkInHistory = { ...(userData.checkInHistory || {}) };
            checkInHistory[today] = 'active';
            updates.checkInHistory = checkInHistory;
            if (userData.lastCheckIn) {
                const lastDate = new Date(userData.lastCheckIn);
                lastDate.setHours(0, 0, 0, 0);
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);
                const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
                if (diffDays === 1) {
                    updates.streak = (userData.streak || 0) + 1;
                }
                else if (diffDays > 1 && (userData.streakFreezes || 0) >= diffDays - 1) {
                    updates.streak = (userData.streak || 0) + 1;
                    updates.streakFreezes = (userData.streakFreezes || 0) - (diffDays - 1);
                    for (let i = 1; i < diffDays; i++) {
                        const freezeDate = new Date(currentDate.getTime() - i * 86400000).toDateString();
                        checkInHistory[freezeDate] = 'freeze';
                    }
                }
                else if (diffDays > 0) {
                    updates.streak = 1;
                }
            }
            else {
                updates.streak = 1;
            }
        }
        if (userData.activeBooster && Date.now() < userData.activeBooster.expiresAt) {
            if (userData.activeBooster.boosterType === 'xp') {
                xpEarned *= userData.activeBooster.multiplier;
            }
            else if (userData.activeBooster.boosterType === 'gold') {
                goldEarned *= userData.activeBooster.multiplier;
            }
        }
        const finalXp = (userData.xp || 0) + Math.round(xpEarned);
        const finalGold = (userData.ttGold || 0) + Math.round(goldEarned);
        updates.xp = finalXp;
        updates.ttGold = finalGold;
        updates.level = calculateLevel(finalXp);
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
});
//# sourceMappingURL=index.js.map