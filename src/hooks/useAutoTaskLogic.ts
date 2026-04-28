import { useEffect, useRef } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'completed_late';
  scheduledStartTime?: number;
  scheduledEndTime?: number;
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
 */
export const useAutoTaskLogic = (
  tasks: Task[], 
  now: number, 
  taskActions: TaskActions
): void => {
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tasks || !tasks.length || !now || !taskActions) return;

    tasks.forEach(task => {
      const { id, status, scheduledStartTime, scheduledEndTime } = task;
      
      // We only care about tasks that have scheduling info from Calendar
      if (!scheduledStartTime || !scheduledEndTime) return;

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
  }, [tasks, now, taskActions]);
};
