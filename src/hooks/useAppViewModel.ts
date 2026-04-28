import { useMemo } from 'react';
import { calculateLevel, LevelInfo, Task, TeamMember } from '../utils/helpers';
import type { User } from 'firebase/auth';

interface UseAppViewModelProps {
  tasks: Task[];
  filterMode: string;
  user: User | null;
  teamMembers: TeamMember[];
  currentTab: string;
  hasUserSelectedTab: boolean;
  defaultView: string;
  userXp: number;
}

interface UseAppViewModelReturn {
  activeTab: string;
  filteredTasks: Task[];
  partnerTask: Task | undefined;
  partnerInfo: TeamMember | { displayName: string; email: string } | null;
  myRunningTask: Task | undefined;
  levelInfo: LevelInfo;
}

export const useAppViewModel = ({
  tasks,
  filterMode,
  user,
  teamMembers,
  currentTab,
  hasUserSelectedTab,
  defaultView,
  userXp
}: UseAppViewModelProps): UseAppViewModelReturn => {
  const activeTab = hasUserSelectedTab ? currentTab : (defaultView || currentTab);

  const filteredTasks = useMemo(() => (
    tasks.filter((task) => {
      if (filterMode === 'all') return true;
      return task.assigneeId === filterMode;
    })
  ), [tasks, filterMode]);

  const uid = user ? user.uid : "local-user-test";

  const partnerTask = useMemo(
    () => tasks.find((t) => t.status === 'running' && t.currentWorker && t.currentWorker !== uid),
    [tasks, uid]
  );

  const partnerInfo = useMemo(() => {
    if (!partnerTask) return null;
    return teamMembers.find((m) => m.uid === partnerTask.currentWorker) || {
      displayName: partnerTask.currentWorkerName || 'Đồng đội',
      email: partnerTask.currentWorkerName === 'Tít' ? 'tit@example.com' : 'tun@example.com'
    };
  }, [partnerTask, teamMembers]);

  const myRunningTask = useMemo(
    () => tasks.find((t) => t.status === 'running' && t.currentWorker === uid),
    [tasks, uid]
  );

  const levelInfo = useMemo(() => calculateLevel(userXp || 0), [userXp]);

  return {
    activeTab,
    filteredTasks,
    partnerTask,
    partnerInfo,
    myRunningTask,
    levelInfo
  };
};
