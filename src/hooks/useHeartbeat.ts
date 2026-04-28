import { useEffect, useMemo } from 'react';
import * as taskService from '../services/taskService';
import { checkTaskStale, Task } from '../utils/helpers';
import { HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT } from '../utils/constants';
import type { User } from 'firebase/auth';

/**
 * Heartbeat system for auto-pausing stale tasks.
 * - Sends heartbeat every 90s while user has a running task
 * - Cleans up stale tasks on boot (1 time)
 * - Sends final heartbeat when tab becomes hidden
 */
export function useHeartbeat(user: User | null, tasks: Task[]): void {
  const myRunningTaskId = useMemo(() => {
    if (!user || user.uid === 'local-user-test') return null;
    return tasks.find(t => t.status === 'running' && t.currentWorker === user.uid)?.id || null;
  }, [user, tasks]);

  const hasBootedRef = { current: false };

  // A. Heartbeat Sender — mỗi 90s, chạy khi tab mở (foreground & background)
  useEffect(() => {
    if (!myRunningTaskId) return;
    const send = () => {
      taskService.updateTask(myRunningTaskId, { lastHeartbeat: Date.now() }).catch(() => {});
    };
    send(); // gửi ngay khi start
    const interval = setInterval(send, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [myRunningTaskId]);

  // B. Boot-time Cleanup — 1 lần khi app load xong + tasks đã có data
  useEffect(() => {
    if (!user || user.uid === 'local-user-test' || hasBootedRef.current || !tasks.length) return;
    hasBootedRef.current = true;

    const now = Date.now();
    tasks.forEach(task => {
      const { isStale, activeTime } = checkTaskStale(task, now, HEARTBEAT_TIMEOUT);
      if (isStale) {
        console.log(`[Heartbeat] Boot cleanup: auto-pausing "${task.title}"`);
        taskService.updateTask(task.id, {
          status: 'paused',
          totalTrackedTime: (task.totalTrackedTime || 0) + (activeTime ?? 0),
          lastStartTime: undefined,
          autoPauseReason: 'heartbeat_timeout'
        }).catch(() => {});
      }
    });
  }, [user, tasks]);

  // C. Page Visibility — gửi heartbeat cuối khi tab bị ẩn
  useEffect(() => {
    if (!myRunningTaskId) return;
    const handler = () => {
      if (document.hidden) {
        taskService.updateTask(myRunningTaskId, { lastHeartbeat: Date.now() }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [myRunningTaskId]);
}
