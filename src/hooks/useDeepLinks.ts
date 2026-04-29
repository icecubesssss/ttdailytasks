import { useEffect, useRef } from 'react';
import { TaskActionReturn } from './useTaskActions';

interface UseDeepLinksProps {
  taskActions: TaskActionReturn;
  isLoaded: boolean;
}

export const useDeepLinks = ({ taskActions, isLoaded }: UseDeepLinksProps) => {
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    const action = params.get('action');

    if (taskId && action) {
      const processingKey = `${taskId}-${action}`;
      if (processedRef.current === processingKey) return;
      processedRef.current = processingKey;

      console.log(`[DeepLink] Handling action "${action}" for task "${taskId}"`);

      if (action === 'start') {
        taskActions.toggleTaskStatus(taskId, 'start').then(() => {
          // Clear URL params without reloading
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        });
      } else if (action === 'complete') {
        taskActions.toggleTaskStatus(taskId, 'complete').then(() => {
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        });
      }
    }
  }, [isLoaded, taskActions]);
};
