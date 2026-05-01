import { db, appId, app } from '../firebase';
import { 
  doc, onSnapshot, setDoc, updateDoc, collection, Unsubscribe, DocumentData
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserData, TeamMember } from '../utils/helpers';

const functions = getFunctions(app);

export const callAwardRewards = async (isLate: boolean) => {
  const awardRewards = httpsCallable(functions, 'awardRewards');
  return await awardRewards({ isLate, appId });
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

/** Mirror widget-relevant stats to a public path so the Scriptable widget can read without auth. */
const syncPublicStats = async (uid: string, data: Partial<UserData>): Promise<void> => {
  const relevantFields = ['streak', 'level', 'xp', 'ttGold', 'streakFreezes'];
  const hasRelevant = relevantFields.some(f => f in data);
  if (!hasRelevant) return;

  const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'widget_stats', uid);
  const mirror: Record<string, unknown> = { updatedAt: Date.now() };
  for (const f of relevantFields) {
    if (f in data) mirror[f] = (data as Record<string, unknown>)[f];
  }
  await setDoc(publicRef, mirror, { merge: true });
};

export const initializeUserStats = async (uid: string, initialData: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await setDoc(userDocRef, initialData, { merge: true });
  syncPublicStats(uid, initialData).catch(() => undefined);
};

export const updateUserStats = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await updateDoc(userDocRef, updates as DocumentData);
  syncPublicStats(uid, updates).catch(() => undefined);
  
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
