import { create } from 'zustand';
import { Task, UserData } from '../utils/helpers';

export const DEFAULT_USER_DATA: UserData = {
  xp: 0,
  level: 1,
  isDarkMode: false,
  lastCheckIn: null,
  streak: 0,
  streakFreezes: 3,
  unlockedBadgeIds: [],
  lastSeenLevel: 1,
  ownedItemIds: [],
  activeBooster: null,
  aiMode: 'cute',
  ttGold: 0,
  ticketHistory: [],
  avatarConfig: null,
  autoFocusShortcut: true,
  shortcutName: 'Làm việc',
  offShortcutName: '',
  defaultView: 'tasks',
  calendarVisibility: { tit: true, tun: true },
  mascotName: 'Mochi',
  mascotAvatar: '🤖',
  isLoaded: false,
  music: {
    currentTrackIdx: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false
  }
};

export interface AppState {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  upsertTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;

  userData: UserData;
  setUserData: (userData: UserData | ((prev: UserData) => UserData)) => void;
  patchUserData: (updates: Partial<UserData>) => void;

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  tasks: [],
  setTasks: (tasks) =>
    set((state) => ({
      tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks
    })),
  upsertTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId)
    })),

  userData: DEFAULT_USER_DATA,
  setUserData: (userData) =>
    set((state) => ({
      userData: typeof userData === 'function' ? userData(state.userData) : userData
    })),
  patchUserData: (updates) =>
    set((state) => ({
      userData: { ...state.userData, ...updates }
    })),

  theme: 'light',
  setTheme: (theme) => set({ theme })
}));

export const defaultUserData = DEFAULT_USER_DATA;
