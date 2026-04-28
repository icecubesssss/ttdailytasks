import { useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import * as taskService from '../services/taskService';
import * as aiService from '../services/aiService';
import type { Task, SubTask } from '../utils/helpers';
import type { User } from 'firebase/auth';
import type { UserData } from '../utils/helpers';

interface TaskActionParams {
  tasks: Task[];
  user: User | null;
  userData: UserData;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  awardTaskRewards: (isLate: boolean) => Promise<void>;
  awardSubTaskRewards: () => Promise<void>;
  playSound: (soundName: string) => void;
}

export interface TaskActionReturn {
  aiLoading: boolean;
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
  handlePriorityChange: (id: string, currentPriority?: string) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleRenameTask: (taskId: string, newTitle: string) => Promise<void>;
  handleUpdateDeadline: (taskId: string, newDate: string | Date) => Promise<void>;
  handleSubTaskAction: (
    taskId: string,
    subId: string | null,
    type: 'add' | 'toggle' | 'rename' | 'delete',
    val?: string
  ) => Promise<void>;
  handleAiSubtasks: (taskId: string, title: string) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

const ignoreAsyncError = (): undefined => undefined;

export const useTaskActions = ({
  tasks,
  user,
  userData,
  setTasks,
  triggerSystemFocus,
  awardTaskRewards,
  awardSubTaskRewards,
  playSound
}: TaskActionParams): TaskActionReturn => {
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const toggleTaskStatus = useCallback(
    async (
      id: string,
      action: 'start' | 'pause' | 'complete',
      options?: { completionSource?: 'manual' | 'auto_schedule' }
    ): Promise<void> => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const currentTime = Date.now();
      let updates: Partial<Task> = {};
      let newTotal = task.totalTrackedTime;

      const uid = user ? user.uid : 'local-user-test';

      if (action === 'start') {
        playSound(task.type === 'countdown' ? 'focus-start' : 'click');
        updates = {
          status: 'running',
          lastStartTime: currentTime,
          currentWorker: uid,
          currentWorkerName: user?.displayName || 'Đồng đội',
          lastHeartbeat: currentTime,
          autoPauseReason: undefined
        };
        if (userData.autoFocusShortcut && userData.shortcutName)
          triggerSystemFocus(userData.shortcutName);
      } else if (action === 'pause') {
        if (task.status === 'running') newTotal += currentTime - (task.lastStartTime || 0);
        updates = {
          status: 'paused',
          totalTrackedTime: newTotal,
          lastStartTime: undefined,
          currentWorker: undefined,
          lastHeartbeat: undefined
        };
        if (userData.autoFocusShortcut && userData.offShortcutName)
          triggerSystemFocus(userData.offShortcutName);
      } else if (action === 'complete') {
        playSound('complete');
        if (task.status === 'running') newTotal += currentTime - (task.lastStartTime || 0);
        const isAutoScheduleComplete = options?.completionSource === 'auto_schedule';
        const isLate = isAutoScheduleComplete
          ? false
          : Boolean(task.deadline && currentTime > task.deadline);
        updates = {
          status: isLate ? 'completed_late' : 'completed',
          totalTrackedTime: newTotal,
          lastStartTime: undefined,
          endTime: currentTime,
          currentWorker: undefined,
          lastHeartbeat: undefined
        };

        if (userData.autoFocusShortcut && userData.offShortcutName)
          triggerSystemFocus(userData.offShortcutName);

        if (task.priority === 'high') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899']
          });
        }

        await awardTaskRewards(isLate);
      }

      // Optimistic Update: Cập nhật giao diện ngay lập tức
      const updatedTasks = tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      setTasks(updatedTasks);

      // Gửi lên server ở background
      if (user && user.uid !== 'local-user-test') {
        taskService.updateTask(id, updates).catch((err) => {
          console.error('Optimistic Update failed, reverting...', err);
          // Nếu lỗi thì quay về state cũ
          setTasks(tasks);
        });
      }
    },
    [
      tasks,
      user,
      userData.autoFocusShortcut,
      userData.shortcutName,
      userData.offShortcutName,
      triggerSystemFocus,
      awardTaskRewards,
      playSound,
      setTasks
    ]
  );

  const handlePriorityChange = useCallback(
    async (id: string, currentPriority?: string): Promise<void> => {
      const priorities = ['low', 'medium', 'high'];
      const normalizedPriority = currentPriority ?? 'low';
      const nextPriority =
        priorities[(priorities.indexOf(normalizedPriority) + 1) % priorities.length];
      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(id, { priority: nextPriority as 'low' | 'medium' | 'high' }).catch(ignoreAsyncError);
      else setTasks(tasks.map((t) => (t.id === id ? { ...t, priority: nextPriority as Task['priority'] } : t)));
    },
    [tasks, user, setTasks]
  );

  const handleDeleteTask = useCallback(
    async (id: string): Promise<void> => {
      playSound('delete');
      if (user && user.uid !== 'local-user-test')
        taskService.deleteTask(id).catch(ignoreAsyncError);
      else setTasks(tasks.filter((t) => t.id !== id));
    },
    [tasks, user, playSound, setTasks]
  );

  const handleRenameTask = useCallback(
    async (taskId: string, newTitle: string): Promise<void> => {
      if (!newTitle.trim()) return;
      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(taskId, { title: newTitle }).catch(ignoreAsyncError);
      else
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
        );
    },
    [user, setTasks]
  );

  const handleUpdateDeadline = useCallback(
    async (taskId: string, newDate: string | Date): Promise<void> => {
      if (!newDate) return;
      const d = new Date(newDate);
      if (typeof newDate === 'string' && !newDate.includes('T'))
        d.setHours(23, 0, 0, 0);
      const deadlineTs = d.getTime();

      const task = tasks.find((t) => t.id === taskId);
      const updates: Partial<Task> = { deadline: deadlineTs };

      // Nếu task đã hoàn thành muộn, nhưng deadline mới lại sau thời điểm hoàn thành -> cho thành hoàn thành đúng hạn
      if (task?.status === 'completed_late' && task.endTime && deadlineTs >= task.endTime) {
        updates.status = 'completed';
      }

      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(taskId, updates).catch(ignoreAsyncError);
      else
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
    },
    [tasks, user, setTasks]
  );

  const handleSubTaskAction = useCallback(
    async (
      taskId: string,
      subId: string | null,
      type: 'add' | 'toggle' | 'rename' | 'delete',
      val?: string
    ): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let newSubTasks: SubTask[] = [...(task.subTasks || [])];
      let isNowDone = false;

      if (type === 'add' && val)
        newSubTasks.push({ id: crypto.randomUUID(), title: val, isDone: false });
      else if (type === 'toggle' && subId) {
        const sub = newSubTasks.find((s) => s.id === subId);
        if (!sub) return;
        isNowDone = !sub.isDone;
        newSubTasks = newSubTasks.map((s) =>
          s.id === subId ? { ...s, isDone: isNowDone } : s
        );
      } else if (type === 'rename' && subId && val)
        newSubTasks = newSubTasks.map((s) =>
          s.id === subId ? { ...s, title: val } : s
        );
      else if (type === 'delete' && subId)
        newSubTasks = newSubTasks.filter((s) => s.id !== subId);

      if (isNowDone) await awardSubTaskRewards();

      if (user && user.uid !== 'local-user-test') {
        taskService.updateSubTasks(taskId, newSubTasks).catch(ignoreAsyncError);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, subTasks: newSubTasks } : t))
        );
      }
    },
    [tasks, user, awardSubTaskRewards, setTasks]
  );

  const handleAiSubtasks = useCallback(
    async (taskId: string, title: string): Promise<void> => {
      setAiLoading(true);
      try {
        const steps = await aiService.suggestSubTasks(title, {
          model: userData.aiMode
        });
        if (Array.isArray(steps)) {
          for (const step of steps) await handleSubTaskAction(taskId, null, 'add', step);
        }
      } catch (e) {
        console.error('AI subtask error:', e);
        await handleSubTaskAction(
          taskId,
          null,
          'add',
          `🤖 AI gợi ý: Phân tích và lên kế hoạch cụ thể cho: ${title}`
        );
      } finally {
        setAiLoading(false);
      }
    },
    [handleSubTaskAction, userData.aiMode]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<void> => {
      if (user && user.uid !== 'local-user-test') {
        taskService.updateTask(taskId, updates).catch(ignoreAsyncError);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
      }
    },
    [user, setTasks]
  );

  return {
    aiLoading,
    toggleTaskStatus,
    handlePriorityChange,
    handleDeleteTask,
    handleRenameTask,
    handleUpdateDeadline,
    handleSubTaskAction,
    handleAiSubtasks,
    handleUpdateTask
  };
};
