import { XP_BASE } from './constants';

export interface AvatarConfig {
  seed?: string;
  hair?: string;
  eyes?: string;
  mouth?: string;
  body?: string;
  hairColor?: string;
  clothingColor?: string;
  skinColor?: string;
  facialHair?: string;
}

export interface SubTask {
  id: string;
  title: string;
  isDone: boolean;
}

export interface Task {
  id: string;
  status: 'running' | 'completed' | 'paused' | 'idle' | 'completed_late';
  title: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: number;
  createdAt: number;
  createdBy: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneePhoto?: string | null;
  type?: 'stopwatch' | 'countdown';
  limitTime?: number | null;
  totalTrackedTime: number;
  lastStartTime?: number;
  lastHeartbeat?: number;
  isAutomated?: boolean;
  subTasks?: SubTask[];
  autoPauseReason?: string;
  currentWorker?: string | null;
  currentWorkerName?: string | null;
  autoPausedAt?: number | null;
  endTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  calendarEventId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  isAllDay: boolean;
  owner: 'tit' | 'tun' | string;
  location?: string | null;
}

export interface UserData {
  uid?: string;
  displayName?: string;
  email?: string;
  xp: number;
  level: number;
  isDarkMode: boolean;
  lastCheckIn: string | null;
  streak: number;
  streakFreezes: number;
  unlockedBadgeIds: string[];
  lastSeenLevel: number;
  ownedItemIds: string[];
  activeBooster: {
    id: string;
    multiplier: number;
    boosterType: string;
    expiresAt: number;
  } | null;
  aiMode: string;
  aiModel?: string;
  ttGold: number;
  ticketHistory: any[];
  checkInHistory?: Record<string, string>;
  avatarConfig: AvatarConfig | null;
  autoFocusShortcut: boolean;
  shortcutName: string;
  offShortcutName: string;
  defaultView: string;
  calendarVisibility: { tit: boolean; tun: boolean };
  mascotName: string;
  mascotAvatar: string;
  autoSyncCalendar?: boolean;
  isLoaded: boolean;
  isFromServer?: boolean;
  music: {
    currentTrackIdx: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
  };
}

export interface TeamMember {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  streak?: number;
  xp?: number;
  level?: number;
  ttGold?: number;
  streakFreezes?: number;
  lastCheckIn?: string | null;
  avatarConfig?: AvatarConfig | null;
  ownedItemIds?: string[];
  activeBooster?: unknown;
}

export const formatDuration = (ms: number): string => {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const timeStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return isNegative ? `-${timeStr}` : timeStr;
};

export const getAvatarUrl = (config: AvatarConfig = {}): string => {
  const baseUrl = "https://api.dicebear.com/7.x/personas/svg";
  const params = new URLSearchParams({
    seed: config.seed || "Tit",
    hair: config.hair || "shortCombover",
    eyes: config.eyes || "open",
    mouth: config.mouth || "smile",
    body: config.body || "squared",
    hairColor: config.hairColor || "362c47",
    clothingColor: config.clothingColor || "456dff",
    skinColor: config.skinColor || "eeb4a4"
  });
  
  if (config.facialHair && config.facialHair !== 'none') {
    params.append('facialHair', config.facialHair);
    params.append('facialHairProbability', '100');
  } else {
    params.append('facialHairProbability', '0');
  }

  return `${baseUrl}?${params.toString()}`;
};

export const getLegacyIdByEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  const e = email.toLowerCase();
  if (e === 'dinhthai.ctv@gmail.com') return 'tit';
  if (e === 'transontruc.03@gmail.com') return 'tun';
  return null;
};

export const getAssigneeIdByEmail = (email: string | null | undefined, teamMembers: TeamMember[] = []): string | null => {
  if (!email) return null;
  const member = teamMembers.find(m => m?.email?.toLowerCase() === email.toLowerCase());
  return member ? member.uid : null;
};

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpNeeded: number;
  progress: number;
}

export const calculateLevel = (xp: number): LevelInfo => {
  let level = 1;
  let currentXp = xp;
  let xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));

  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    level += 1;
    xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));
  }
  return { level, currentXp, xpNeeded, progress: (currentXp / xpNeeded) * 100 };
};

export const safeJsonParse = (rawText: any, fallbackValue: any): any => {
  if (typeof rawText !== 'string') return fallbackValue;
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return fallbackValue;
  }
};

export interface StaleResult {
  isStale: boolean;
  activeTime?: number;
}

/**
 * Check if a running task is stale and should be auto-paused.
 * Returns { isStale, activeTime } — activeTime = ms to add to totalTrackedTime.
 */
export const checkTaskStale = (task: Task, now: number, timeoutMs = 300_000): StaleResult => {
  // Automated tasks NEVER go stale — they follow the schedule regardless of heartbeat
  if (task.status !== 'running' || task.isAutomated) return { isStale: false };

  const lastHB = task.lastHeartbeat;
  const lastStart = task.lastStartTime;

  // Has heartbeat → use as reference point
  if (lastHB !== undefined && now - lastHB > timeoutMs) {
    return {
      isStale: true,
      activeTime: Math.max(0, lastHB - (lastStart ?? lastHB))
    };
  }

  // Legacy task (no heartbeat field yet) → fallback to lastStartTime, cap at timeout
  if (lastHB === undefined && lastStart !== undefined && now - lastStart > timeoutMs) {
    return {
      isStale: true,
      activeTime: Math.min(now - lastStart, timeoutMs)
    };
  }

  return { isStale: false };
};
