import { useCallback } from 'react';
import { useEffect } from 'react';
import { Task } from '../utils/helpers';
import type { User } from 'firebase/auth';

interface UseFocusTimerReturn {
  focusingTaskId: string | null;
  triggerSystemFocus: (name: string) => void;
}

export function useFocusTimer(user: User | null, tasks: Task[]): UseFocusTimerReturn {
  const focusingTaskId = user
    ? tasks.find(t => t.status === 'running' && t.currentWorker === user.uid)?.id ?? null
    : null;

  // Sync with Extension: gửi state khi focusingTaskId thay đổi
  useEffect(() => {
    if (!user) return;
    const focusingTask = tasks.find(t => t.id === focusingTaskId);
    if (focusingTask) {
      window.postMessage({ type: 'TT_FOCUS_START', taskTitle: focusingTask.title }, '*');
    } else {
      window.postMessage({ type: 'TT_FOCUS_END' }, '*');
    }
  }, [focusingTaskId, tasks, user]);

  // Re-sync khi extension vừa được cài lại / reload
  useEffect(() => {
    if (!user) return;

    function onExtensionReady(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== 'TT_FOCUS_GUARD_READY') return;

      const focusingTask = tasks.find(t => t.id === focusingTaskId);
      if (focusingTask) {
        window.postMessage({ type: 'TT_FOCUS_START', taskTitle: focusingTask.title }, '*');
      } else {
        window.postMessage({ type: 'TT_FOCUS_END' }, '*');
      }
    }

    window.addEventListener('message', onExtensionReady);
    return () => window.removeEventListener('message', onExtensionReady);
  }, [focusingTaskId, tasks, user]);

  // System Focus Shortcut
  const triggerSystemFocus = useCallback((name: string) => {
    if (!name) return;
    console.log("🚀 Kích hoạt Shortcut:", name);

    const url = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(name)}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  return {
    focusingTaskId,
    triggerSystemFocus
  };
}
