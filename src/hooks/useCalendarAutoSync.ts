import { useEffect, useCallback, useRef } from 'react';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';
import { parseGCalEvent } from '../utils/calendarUtils';
import { addTask } from '../services/taskService';
import { ASSIGNEES } from '../utils/constants';
import { CalendarEvent } from '../utils/helpers';

type OwnerKey = keyof typeof ASSIGNEES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in ASSIGNEES;

interface CalendarAutoSyncProps {
  user: any;
  userData: any;
  teamMembers: any[];
  tasks: any[];
  config: {
    calendarApiKey: string;
    calendarIdTit: string;
    calendarIdTun: string;
    appsScriptUrl: string;
  };
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
  config
}: CalendarAutoSyncProps) => {
  const lastSyncRef = useRef<number>(0);
  const prevAutoSyncRef = useRef<boolean>(false);

  const sync = useCallback(async (options?: { force?: boolean; reason?: string }) => {
    if (!user) return;
    const allowWithoutAutoSync = options?.reason === 'enter_calendar';
    if (!userData.autoSyncCalendar && !allowWithoutAutoSync) return;
    
    // Sync at most once every 15 minutes to avoid API spam
    const now = Date.now();
    if (!options?.force && now - lastSyncRef.current < 15 * 60 * 1000) return;
    lastSyncRef.current = now;

    const { calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } = config;
    if (!appsScriptUrl && !calendarApiKey) return;

    const tMin = startOfDay(new Date());
    const tMax = endOfDay(new Date());

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
      });

      if (!exists) {
        console.log(`[AutoSync] Creating automated task for event: ${event.title}`);
        
        const assignee = teamMembers?.find(m => {
          if (!m?.email) return false;
          const legacyId = (m.email.toLowerCase() === 'dinhthai.ctv@gmail.com') ? 'tit' : 
                           (m.email.toLowerCase() === 'transontruc.03@gmail.com') ? 'tun' : null;
          return legacyId === event.owner;
        }) || null;

        const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));

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
          isDone: false,
          status: 'idle' as const,
          totalTrackedTime: 0,
          createdAt: Date.now(),
          subTasks: [],
          isAutomated: true // CRITICAL: Mark as automated to skip heartbeat
        };

        await addTask(newTask);
      }
    }
  }, [user, userData.autoSyncCalendar, tasks, teamMembers, config]);

  useEffect(() => {
    sync({ reason: 'interval_bootstrap' });
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);

  useEffect(() => {
    const isEnabled = Boolean(userData?.autoSyncCalendar);
    if (isEnabled && !prevAutoSyncRef.current) {
      lastSyncRef.current = 0;
      sync({ force: true, reason: 'autosync_enabled' });
    }
    prevAutoSyncRef.current = isEnabled;
  }, [userData?.autoSyncCalendar, sync]);

  return { triggerSync: sync };
};
