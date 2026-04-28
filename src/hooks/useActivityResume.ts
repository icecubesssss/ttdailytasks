import { useEffect, useRef } from 'react';
import * as taskService from '../services/taskService';
import type { Task } from '../utils/helpers';
import type { User } from 'firebase/auth';

interface UseActivityResumeProps {
  user: User | null;
  tasks: Task[];
  onResume?: () => void;
}

export const useActivityResume = ({ user, tasks, onResume }: UseActivityResumeProps): void => {
  const lastResumeAtRef = useRef<number>(0);

  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;

      const now = Date.now();
      if (now - lastResumeAtRef.current < 3000) return;
      lastResumeAtRef.current = now;

      const uid = user?.uid;
      if (uid && uid !== 'local-user-test') {
        const myRunningTask = tasks.find(
          (task) => task.status === 'running' && task.currentWorker === uid
        );
        if (myRunningTask?.id) {
          taskService.updateTask(myRunningTask.id, { lastHeartbeat: now }).catch(() => {});
        }
      }

      onResume?.();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [user, tasks, onResume]);
};
