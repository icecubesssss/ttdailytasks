import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAudio } from './useAudio';
import { useAppBootstrap } from './useAppBootstrap';
import { useUserStats } from './useUserStats';
import { useAppUiActions } from './useAppUiActions';
import { useDailyQuest } from './useDailyQuest';
import { useAiActions } from './useAiActions';
import { useFocusTimer } from './useFocusTimer';
import { useHeartbeat } from './useHeartbeat';
import { useAppEffects } from './useAppEffects';
import { useTaskActions } from './useTaskActions';
import { useAppViewModel } from './useAppViewModel';
import { useAutoTaskLogic } from './useAutoTaskLogic';
import { useCalendarAutoSync } from './useCalendarAutoSync';
import { useNow } from './useNow';
import { useActivityResume } from './useActivityResume';
import { useDeepLinks } from './useDeepLinks';
import { isDummyConfig, googleCalendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } from '../firebase';

export function useTTApp() {
  const tasks = useAppStore((state) => state.tasks);
  const setTasks = useAppStore((state) => state.setTasks);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  // UI State
  const [currentTab, setCurrentTab] = useState('tasks');
  const [hasUserSelectedTab, setHasUserSelectedTab] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'partner' | string>('all');
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const { playSound } = useAudio();

  // Custom Hooks
  const { user, authError, isLoading } = useAppBootstrap({ setTasks });
  const { 
    userData, setUserData, teamMembers, handleBuyItem, handleUseTicket, 
    handleEquipItem, handleUpdateSettings, awardTaskRewards, awardSubTaskRewards 
  } = useUserStats(user);
  
  const uiActions = useAppUiActions({
    playSound,
    setHasUserSelectedTab,
    setCurrentTab,
    setFilterMode,
    userData,
    setUserData,
    handleUpdateSettings
  });

  const { dailyQuest, handleRefreshDailyQuest, handleCompleteDailyQuest } = useDailyQuest({ tasks, userData, user, handleUpdateSettings, playSound });
  const aiActions = useAiActions({ tasks, userData });

  const { focusingTaskId, triggerSystemFocus } = useFocusTimer(user, tasks);
  const now = useNow();
  const config = {
    calendarApiKey: googleCalendarApiKey,
    calendarIdTit,
    calendarIdTun,
    appsScriptUrl
  };

  useAppEffects({ userData, tasks, dailyQuest, playSound, setTheme });
  useHeartbeat(user, tasks);

  const taskActions = useTaskActions({
    tasks,
    user,
    userData,
    setTasks,
    triggerSystemFocus,
    awardTaskRewards,
    awardSubTaskRewards,
    playSound
  });

  // Automated logic for schedule
  useAutoTaskLogic(tasks, now, taskActions);

  // Deep Link Handling
  useDeepLinks({ taskActions, isLoaded: userData.isLoaded });

  // Auto Sync Calendar events to tasks
  const { triggerSync } = useCalendarAutoSync({
    user,
    userData,
    teamMembers,
    tasks,
    config
  });

  useActivityResume({
    user,
    tasks,
    onResume: triggerSync
  });

  const viewModel = useAppViewModel({
    tasks,
    filterMode,
    user,
    teamMembers,
    currentTab,
    hasUserSelectedTab,
    defaultView: userData.defaultView,
    userXp: userData.xp
  });

  const previousTabRef = useRef<string | null>(null);
  useEffect(() => {
    const nextTab = viewModel.activeTab;
    if (nextTab === 'calendar' && previousTabRef.current !== 'calendar') {
      triggerSync({ force: true, reason: 'enter_calendar' });
    }
    previousTabRef.current = nextTab;
  }, [viewModel.activeTab, triggerSync]);

  return {
    // State
    user,
    userData,
    teamMembers,
    tasks,
    theme,
    authError,
    isLoading,
    activeTab: viewModel.activeTab,
    filterMode,
    isClosetOpen,
    now,
    
    // UI Helpers
    setIsClosetOpen,
    playSound,
    
    // Actions
    handleUpdateSettings,
    handleBuyItem,
    handleUseTicket,
    handleEquipItem,
    handleTabChange: uiActions.handleTabChange,
    handleFilterModeChange: uiActions.handleFilterModeChange,
    handleToggleDarkMode: uiActions.handleToggleDarkMode,
    handleRenameMascot: uiActions.handleRenameMascot,
    handleChangeMascotAvatar: uiActions.handleChangeMascotAvatar,
    
    // Task Actions
    taskActions,
    triggerSystemFocus,
    
    // AI & Quest
    dailyQuest,
    handleRefreshDailyQuest,
    handleCompleteDailyQuest,
    aiActions,
    
    // View Model Extras
    filteredTasks: viewModel.filteredTasks,
    partnerTask: viewModel.partnerTask,
    partnerInfo: viewModel.partnerInfo,
    myRunningTask: viewModel.myRunningTask,
    levelInfo: viewModel.levelInfo,
    focusingTaskId,
    
    // Config
    config
  };
}
