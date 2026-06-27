import { useEffect, useRef } from 'react';
import { getLegacyIdByEmail } from '../utils/helpers';
import type { AppUser as User } from '../utils/helpers';

interface Task {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'completed_late';
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  isAutomated?: boolean;
  assigneeId?: string | null;
}

interface TaskActions {
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
}

/**
 * Hook to handle automated task execution based on schedule.
 * @param tasks - List of tasks
 * @param now - Current timestamp
 * @param taskActions - Object containing toggleTaskStatus
 * @param user - Current logged-in user
 */
export const useAutoTaskLogic = (
  tasks: Task[], 
  now: number, 
  taskActions: TaskActions,
  user: User | null
): void => {
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks || !tasks.length || !now || !taskActions || !user) return;

    tasks.forEach(task => {
      const { id, status, scheduledStartTime, scheduledEndTime, isAutomated, assigneeId } = task;
      
      // We only care about tasks that have scheduling info from Calendar and are automated
      if (!scheduledStartTime || !scheduledEndTime || !isAutomated) return;

      // Restrict status triggers to the assigned user to prevent cross-user tasks starting
      const myUid = user.uid;
      const myLegacyId = getLegacyIdByEmail(user.email);
      const isAssignedToMe = !assigneeId || assigneeId === myUid || assigneeId === myLegacyId;
      if (!isAssignedToMe) return;

      // AUTO-START logic
      if (
        now >= scheduledStartTime && 
        now < scheduledEndTime && 
        status === 'idle' && 
        !triggeredRef.current.has(`${id}-start`)
      ) {
        console.log(`[AutoLogic] Starting task: ${task.title}`);
        triggeredRef.current.add(`${id}-start`);
        taskActions.toggleTaskStatus(id, 'start');
      }

      // AUTO-STOP logic
      if (
        now >= scheduledEndTime && 
        status === 'running' && 
        !triggeredRef.current.has(`${id}-complete`)
      ) {
        console.log(`[AutoLogic] Completing task: ${task.title}`);
        triggeredRef.current.add(`${id}-complete`);
        taskActions.toggleTaskStatus(id, 'complete', { completionSource: 'auto_schedule' });
      }
    });
  }, [tasks, now, taskActions, user]);
};
