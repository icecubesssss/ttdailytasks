import { useEffect, useCallback, useRef } from 'react';
import { endOfDay, addDays } from 'date-fns';
import { parseGCalEvent } from '../utils/calendarUtils';
import { addTask } from '../services/taskService';
import { ASSIGNEES } from '../utils/constants';
import { CalendarEvent, getLegacyIdByEmail } from '../utils/helpers';

type OwnerKey = keyof typeof ASSIGNEES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in ASSIGNEES;

interface CalendarAutoSyncProps {
  user: any;
  userData: {
    autoSyncCalendar?: boolean;
    isLoaded?: boolean;
    [key: string]: any;
  };
  teamMembers: any[];
  tasks: any[];
  isTasksLoaded: boolean;
  isTeamMembersLoaded: boolean;
  config: {
    calendarApiKey: string;
    calendarIdTit: string;
    calendarIdTun: string;
    appsScriptUrl: string;
  };
  awardTaskRewards: (isLate: boolean) => Promise<void>;
}

/**
 * Hook to automatically sync Google Calendar events to Tasks.
 * Creates automated tasks that follow the schedule without heartbeat requirements.
 */
export const useCalendarAutoSync = ({
  user,
  userData,
  teamMembers,
  tasks,
  isTasksLoaded,
  isTeamMembersLoaded,
  config,
  awardTaskRewards
}: CalendarAutoSyncProps) => {
  const lastSyncRef = useRef<number>(0);
  const isLoadedRef = useRef<boolean>(false);

  const sync = useCallback(async (options?: { force?: boolean; reason?: string }) => {
    if (!user) return;
    if (!userData.isLoaded) return;
    // CRITICAL: Wait until both tasks and team members have loaded from Firestore
    // to avoid creating duplicate tasks against an empty task list on startup.
    if (!isTasksLoaded || !isTeamMembersLoaded) {
      console.log(`[AutoSync] Skipping - waiting for data to load (tasks:${isTasksLoaded}, team:${isTeamMembersLoaded})`);
      return;
    }

    // IMPORTANT: Respect the user's auto-sync setting
    if (!userData.autoSyncCalendar) {
      console.log(`[AutoSync] Skipping (Sync is OFF in settings)`);
      return;
    }

    // Sync at most once every 15 minutes to avoid API spam
    const now = Date.now();
    if (!options?.force && now - lastSyncRef.current < 15 * 60 * 1000) return;
    lastSyncRef.current = now;

    console.log(`[AutoSync] Triggering sync... Reason: ${options?.reason || 'periodic'}`);

    const { calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } = config;

    // Apps Script runAutomation đã tạo task mỗi 5' — tránh sync kép gây trùng
    if (appsScriptUrl) {
      console.log('[AutoSync] Skipping client-side task creation (Apps Script handles sync)');
      return;
    }

    if (!calendarApiKey) return;

    // Sync window: Current day only (from 00:00:00 to 23:59:59.999)
    const tMin = new Date();
    tMin.setHours(0, 0, 0, 0);
    const tMax = new Date();
    tMax.setHours(23, 59, 59, 999);

    // Only reached when Apps Script URL is NOT set — use Google Calendar API directly
    const fetchViaDirectApi = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId || !calendarApiKey) return [];
      const params = new URLSearchParams({
        key: calendarApiKey,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };

    const [titEvents, tunEvents] = await Promise.all([
      fetchViaDirectApi(calendarIdTit, 'tit'),
      fetchViaDirectApi(calendarIdTun, 'tun'),
    ]);

    const allEvents = [...titEvents, ...tunEvents].filter(
      (e): e is CalendarEvent & { start: Date; end: Date } => Boolean(e.start && e.end && !e.isAllDay)
    );

    console.log(`[AutoSync] Found ${allEvents.length} eligible events across calendars.`);

    // Local set to avoid creating duplicates in the same loop
    const newlyCreatedTitles = new Set<string>();

    const normalizeEventId = (id?: string | null) =>
      id ? id.replace(/@google\.com$/i, '').split('_')[0] : '';

    for (const event of allEvents) {
      const assignee = teamMembers?.find(m => {
        if (!m?.email) return false;
        return getLegacyIdByEmail(m.email) === event.owner;
      }) || null;
      const assigneeId = assignee?.uid || event.owner;

      // Check if task already exists for this event
      const exists = tasks.some((t) => {
        if (event.id && t.calendarEventId) {
          if (t.calendarEventId === event.id) return true;
          if (normalizeEventId(t.calendarEventId) === normalizeEventId(event.id)) return true;
        }
        return (
          t.scheduledStartTime === event.start.getTime() &&
          t.title === event.title &&
          (t.assigneeId === assigneeId || !t.assigneeId)
        );
      }) || newlyCreatedTitles.has(`${event.title}-${event.start.getTime()}-${assigneeId}`);

      if (!exists) {
        console.log(`[AutoSync] Creating automated task for event: ${event.title}`);
        newlyCreatedTitles.add(`${event.title}-${event.start.getTime()}-${assigneeId}`);

        const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
        const durationMs = durationMins * 60 * 1000;
        const isPast = event.end.getTime() < now;

        const newTask = {
          title: event.title,
          createdBy: "system-autosync",
          creatorName: "AutoSync",
          assigneeId: assignee?.uid || event.owner,
          assigneeName: assignee?.displayName || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].name : event.owner),
          assigneePhoto: assignee?.photoURL || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].photo : null),
          deadline: event.end.getTime(),
          scheduledStartTime: event.start.getTime(),
          scheduledEndTime: event.end.getTime(),
          calendarEventId: event.id,
          priority: 'medium' as const,
          type: 'stopwatch' as const,
          limitTime: 0,
          isDone: isPast,
          status: isPast ? 'completed' as const : 'idle' as const,
          totalTrackedTime: isPast ? durationMs : 0,
          endTime: isPast ? event.end.getTime() : undefined,
          createdAt: Date.now(),
          subTasks: [],
          isAutomated: false
        };

        await addTask(newTask);
        
        // If it's a past task, we "catch up" the rewards immediately
        if (isPast) {
          console.log(`[AutoSync] Awarding catch-up rewards for past task: ${event.title}`);
          awardTaskRewards(false).catch(() => {});
        }
      }
    }
  }, [user, userData.isLoaded, userData.autoSyncCalendar, isTasksLoaded, isTeamMembersLoaded, tasks, teamMembers, config, awardTaskRewards]);

  useEffect(() => {
    sync({ reason: 'interval_bootstrap' });
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  useEffect(() => {
    // Only fire startup sync when ALL data sources are confirmed loaded
    if (userData.isLoaded && isTasksLoaded && isTeamMembersLoaded && !isLoadedRef.current) {
      isLoadedRef.current = true;
      lastSyncRef.current = 0; // Reset throttle so startup sync fires immediately
      sync({ force: true, reason: 'all_data_loaded' });
    }
  }, [userData.isLoaded, isTasksLoaded, isTeamMembersLoaded, sync]);

  return { triggerSync: sync };
};
