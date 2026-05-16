import { useEffect, useCallback, useRef } from 'react';
import { startOfDay, endOfDay, isSameDay, addDays } from 'date-fns';
import { parseGCalEvent } from '../utils/calendarUtils';
import { addTask } from '../services/taskService';
import { ASSIGNEES } from '../utils/constants';
import { CalendarEvent } from '../utils/helpers';

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
  config,
  awardTaskRewards
}: CalendarAutoSyncProps) => {
  const lastSyncRef = useRef<number>(0);
  const isLoadedRef = useRef<boolean>(false);

  const sync = useCallback(async (options?: { force?: boolean; reason?: string }) => {
    if (!user) return;
    if (!userData.isLoaded) return;

    // IMPORTANT: Respect the user's auto-sync setting
    if (userData.autoSyncCalendar === false && !options?.force) {
      console.log(`[AutoSync] Skipping (Sync is OFF in settings)`);
      return;
    }

    // Sync at most once every 15 minutes to avoid API spam
    const now = Date.now();
    if (!options?.force && now - lastSyncRef.current < 15 * 60 * 1000) return;
    lastSyncRef.current = now;

    console.log(`[AutoSync] Triggering sync... Reason: ${options?.reason || 'periodic'}`);

    const { calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } = config;
    if (!appsScriptUrl && !calendarApiKey) return;

    // Expand window: From 24 hours ago until 48 hours in the future
    const tMin = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tMax = endOfDay(addDays(new Date(), 2));

    const fetchViaAppsScript = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId) return [];
      const params = new URLSearchParams({
        calendarId: calId,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
      });
      try {
        const res = await fetch(`${appsScriptUrl}?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        if (data?.error) return [];
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };

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

    const fetchOne = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId) return [];
      if (appsScriptUrl) {
        const scriptEvents = await fetchViaAppsScript(calId, owner);
        if (scriptEvents.length > 0) return scriptEvents;
      }
      if (calendarApiKey) return await fetchViaDirectApi(calId, owner);
      return [];
    };

    const [titEvents, tunEvents] = await Promise.all([
      fetchOne(calendarIdTit, 'tit'),
      fetchOne(calendarIdTun, 'tun'),
    ]);

    const allEvents = [...titEvents, ...tunEvents].filter(
      (e): e is CalendarEvent & { start: Date; end: Date } => Boolean(e.start && e.end && !e.isAllDay)
    );

    console.log(`[AutoSync] Found ${allEvents.length} eligible events across calendars.`);

    // Local set to avoid creating duplicates in the same loop
    const newlyCreatedTitles = new Set<string>();

    for (const event of allEvents) {
      // Check if task already exists for this event
      const exists = tasks.some((t) => {
        if (event.id && t.calendarEventId) return t.calendarEventId === event.id;
        return (
          t.scheduledStartTime === event.start.getTime() &&
          t.title === event.title &&
          Boolean(t.deadline) &&
          isSameDay(new Date(t.deadline as number), event.start)
        );
      }) || newlyCreatedTitles.has(`${event.title}-${event.start.getTime()}`);

      if (!exists) {
        console.log(`[AutoSync] Creating automated task for event: ${event.title}`);
        newlyCreatedTitles.add(`${event.title}-${event.start.getTime()}`);
        
        const assignee = teamMembers?.find(m => {
          if (!m?.email) return false;
          const legacyId = (m.email.toLowerCase() === 'dinhthai.ctv@gmail.com') ? 'tit' : 
                           (m.email.toLowerCase() === 'transontruc.03@gmail.com') ? 'tun' : null;
          return legacyId === event.owner;
        }) || null;

        const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
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
          timerType: 'countdown',
          limitTime: durationMins,
          isDone: isPast,
          status: isPast ? 'completed' as const : 'idle' as const,
          totalTrackedTime: isPast ? durationMins * 60 * 1000 : 0,
          endTime: isPast ? event.end.getTime() : undefined,
          createdAt: Date.now(),
          subTasks: [],
          isAutomated: true // CRITICAL: Mark as automated to skip heartbeat
        };

        await addTask(newTask);
        
        // If it's a past task, we "catch up" the rewards immediately
        if (isPast) {
          console.log(`[AutoSync] Awarding catch-up rewards for past task: ${event.title}`);
          awardTaskRewards(false).catch(() => {});
        }
      }
    }
  }, [user, userData.isLoaded, userData.autoSyncCalendar, tasks, teamMembers, config, awardTaskRewards]);

  useEffect(() => {
    sync({ reason: 'interval_bootstrap' });
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  useEffect(() => {
    if (userData.isLoaded && !isLoadedRef.current) {
      isLoadedRef.current = true;
      lastSyncRef.current = 0;
      sync({ force: true, reason: 'user_data_loaded' });
    }
  }, [userData.isLoaded, sync]);

  return { triggerSync: sync };
};
