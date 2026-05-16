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
exports.autoSyncCalendar = exports.awardRewards = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const XP_PER_TASK = 50;
const DAILY_CHECKIN_XP = 20;
const DAILY_CHECKIN_GOLD = 50;
const GOLD_PER_TASK = 50;
const XP_BASE = 500;
function calculateLevel(xp) {
    let level = 1;
    let currentXp = xp;
    let xpNeeded = Math.floor(XP_BASE * Math.pow(1.6, level - 1));
    while (currentXp >= xpNeeded) {
        currentXp -= xpNeeded;
        level += 1;
        xpNeeded = Math.floor(XP_BASE * Math.pow(1.6, level - 1));
    }
    return level;
}
async function processAwardRewards(uid, appId, isLate) {
    const userStatsRef = db.doc(`artifacts/${appId}/users/${uid}/profile/stats`);
    const teamMemberRef = db.doc(`artifacts/${appId}/public/data/team_members/${uid}`);
    return db.runTransaction(async (transaction) => {
        const statsDoc = await transaction.get(userStatsRef);
        if (!statsDoc.exists) {
            return { success: false, error: 'User stats not found' };
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
            streak: updates.streak !== undefined ? updates.streak : (userData.streak || 0),
            xp: finalXp,
            level: updates.level,
            ttGold: finalGold,
            streakFreezes: updates.streakFreezes !== undefined ? updates.streakFreezes : (userData.streakFreezes || 0),
            lastCheckIn: updates.lastCheckIn || userData.lastCheckIn,
            lastActive: Date.now()
        };
        transaction.set(teamMemberRef, teamUpdates, { merge: true });
        return { success: true, updates };
    });
}
exports.awardRewards = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const uid = context.auth.uid;
    const isLate = data.isLate || false;
    const appId = data.appId || 'tt-daily-task';
    return await processAwardRewards(uid, appId, isLate);
});
exports.autoSyncCalendar = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
    const appId = 'tt-daily-task';
    const CONFIG = {
        appsScriptUrl: 'https://script.google.com/macros/s/AKfycbxYIP70rPBMD82EdKXOLFAf-ufCZ6iptvpgv9ODHOalM7J6FO-SZgWpoE_f5qygpWuH/exec',
        calendars: [
            { id: 'thaitd.mathtech@gmail.com', owner: 'tit', email: 'dinhthai.ctv@gmail.com' },
            { id: '9bfaacc5ea449c8dd82d1fd5018c4032ddeb4e0d6abb0f901fb5287928762c3d@group.calendar.google.com', owner: 'tun', email: 'transontruc.03@gmail.com' }
        ]
    };
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const teamSnap = await db.collection(`artifacts/${appId}/public/data/team_members`).get();
    const teamMembers = teamSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
    const tasksSnap = await db.collection(`artifacts/${appId}/public/data/tasks`).get();
    const existingTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    for (const cal of CONFIG.calendars) {
        try {
            const params = new URLSearchParams({
                calendarId: cal.id,
                timeMin: todayStart.toISOString(),
                timeMax: todayEnd.toISOString()
            });
            const response = await fetch(`${CONFIG.appsScriptUrl}?${params}`);
            if (!response.ok)
                continue;
            const data = await response.json();
            const events = data.items || [];
            const member = teamMembers.find(m => m.email?.toLowerCase() === cal.email.toLowerCase());
            if (!member)
                continue;
            for (const event of events) {
                if (!event.start?.dateTime || !event.end?.dateTime)
                    continue;
                const startTime = new Date(event.start.dateTime).getTime();
                const endTime = new Date(event.end.dateTime).getTime();
                const eventId = event.id;
                const task = existingTasks.find(t => t.calendarEventId === eventId ||
                    (t.title === event.summary && t.scheduledStartTime === startTime));
                if (!task) {
                    console.log(`[Background] Creating task for: ${event.summary}`);
                    const durationMins = Math.max(25, Math.round((endTime - startTime) / 60000));
                    const newTask = {
                        title: event.summary || '(Không tiêu đề)',
                        createdBy: "system-background",
                        creatorName: "AutoSync",
                        assigneeId: member.uid,
                        assigneeName: member.displayName || cal.owner,
                        deadline: endTime,
                        scheduledStartTime: startTime,
                        scheduledEndTime: endTime,
                        calendarEventId: eventId,
                        priority: 'medium',
                        timerType: 'countdown',
                        limitTime: durationMins,
                        isDone: false,
                        status: 'idle',
                        totalTrackedTime: 0,
                        createdAt: now,
                        subTasks: [],
                        isAutomated: true
                    };
                    const docRef = await db.collection(`artifacts/${appId}/public/data/tasks`).add(newTask);
                    if (now >= endTime) {
                        await autoFinishTask(docRef.id, newTask, member.uid, appId);
                    }
                    else if (now >= startTime) {
                        await db.collection(`artifacts/${appId}/public/data/tasks`).doc(docRef.id).update({ status: 'running' });
                    }
                }
                else if (!task.isDone && now >= (task.scheduledEndTime || task.deadline)) {
                    await autoFinishTask(task.id, task, member.uid, appId);
                }
                else if (task.status === 'idle' && now >= task.scheduledStartTime && now < task.scheduledEndTime) {
                    await db.collection(`artifacts/${appId}/public/data/tasks`).doc(task.id).update({ status: 'running' });
                }
            }
        }
        catch (err) {
            console.error(`Error syncing calendar ${cal.id}:`, err);
        }
    }
});
async function autoFinishTask(taskId, task, uid, appId) {
    console.log(`[Background] Auto-finishing task: ${task.title}`);
    const duration = (task.scheduledEndTime || task.deadline) - (task.scheduledStartTime || task.createdAt);
    await db.collection(`artifacts/${appId}/public/data/tasks`).doc(taskId).update({
        status: 'completed',
        isDone: true,
        endTime: Date.now(),
        totalTrackedTime: duration > 0 ? duration : 25 * 60 * 1000
    });
    await processAwardRewards(uid, appId, false);
}
//# sourceMappingURL=index.js.map