import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { 
  startOfWeek, addDays, addWeeks, subWeeks, 
  isSameDay, startOfDay, endOfDay, format 
} from 'date-fns';

import { parseGCalEvent } from '../../utils/calendarUtils';
import { ASSIGNEES } from '../../utils/constants';
import { addTask } from '../../services/taskService';
import { getLegacyIdByEmail, Task, TeamMember, CalendarEvent } from '../../utils/helpers';
import SetupGuide from './SetupGuide';
import CalendarHeader from './CalendarHeader';
import GridView from './GridView';
import WeeklyOverview from './WeeklyOverview';
import { useTaskActionContext } from '../../contexts/TaskActionContext';

type OwnerKey = keyof typeof ASSIGNEES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in ASSIGNEES;

interface CalendarViewProps {
  isDark: boolean;
  calendarApiKey: string | null;
  calendarIdTit: string | null;
  calendarIdTun: string | null;
  appsScriptUrl: string | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  currentAssigneeId: string | null;
  now: number;
  aiLoading: boolean;
  userData: any;
  onUpdateSettings: (updates: any) => void;
}

export default function CalendarView({ 
  isDark, calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl, tasks, 
  teamMembers, currentAssigneeId, now, aiLoading,
  userData, onUpdateSettings
}: CalendarViewProps) {
  const {
    toggleTaskStatus,
    handleDeleteTask,
    handlePriorityChange,
    handleUpdateDeadline,
    handleRenameTask,
    handleSubTaskAction,
    handleUpdateTask,
    handleAiSubtasks
  } = useTaskActionContext();
  
  const onStart = (id: string) => toggleTaskStatus(id, 'start');
  const onPause = (id: string) => toggleTaskStatus(id, 'pause');
  const onComplete = (id: string) => toggleTaskStatus(id, 'complete');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTit, setShowTit] = useState(userData?.calendarVisibility?.tit !== false);
  const [showTun, setShowTun] = useState(userData?.calendarVisibility?.tun !== false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'grid'>('weekly');
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  useEffect(() => {
    if (userData?.calendarVisibility) {
      const tit = userData.calendarVisibility.tit !== false;
      const tun = userData.calendarVisibility.tun !== false;
      requestAnimationFrame(() => {
        setShowTit((curr: boolean) => curr === tit ? curr : tit);
        setShowTun((curr: boolean) => curr === tun ? curr : tun);
      });
    }
  }, [userData?.calendarVisibility]);

  const fetchEvents = useCallback(async () => {
    if (!appsScriptUrl && !calendarApiKey) return;
    setLoading(true);
    setError(null);
    const tMin = startOfDay(weekStart);
    const tMax = endOfDay(addDays(weekStart, 6));

    const fetchViaAppsScript = async (calId: string, owner: string) => {
      if (!calId) return [];
      const params = new URLSearchParams({
        calendarId: calId,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
      });
      const url = `${appsScriptUrl}?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (data.error) return [];
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };

    const fetchViaDirectApi = async (calId: string, owner: string) => {
      if (!calId) return [];
      const params = new URLSearchParams({
        key: calendarApiKey as string,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          setError(prev => (prev ? prev + ' | ' : '') + `${owner}: ${errBody?.error?.message || res.status}`);
          return [];
        }
        const data = await res.json();
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };

    const fetchOne = async (calId: string | null, owner: string) => {
      if (!calId) return [];
      if (appsScriptUrl) {
        const res = await fetchViaAppsScript(calId, owner);
        if (res.length > 0) return res;
      }
      if (calendarApiKey) return await fetchViaDirectApi(calId, owner);
      return [];
    };

    const [titEvents, tunEvents] = await Promise.all([
      fetchOne(calendarIdTit, 'tit'),
      fetchOne(calendarIdTun, 'tun'),
    ]);

    setEvents([...titEvents, ...tunEvents].filter(e => e.start && e.end));
    setLoading(false);
  }, [weekStart, calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl]);

  useEffect(() => { 
    const timer = setTimeout(() => fetchEvents(), 0);
    const handleFocus = () => fetchEvents();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchEvents]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollTo = (new Date().getHours() - 6) * 64;
    scrollRef.current.scrollTop = Math.max(0, scrollTo);
  }, [viewMode]);

  const visibleEvents = events.filter(e => (e.owner === 'tit' && showTit) || (e.owner === 'tun' && showTun));
  const getEventsForDay = (day: Date) => visibleEvents.filter(e => !e.isAllDay && isSameDay(e.start!, day));
  const getAllDayForDay = (day: Date) => visibleEvents.filter(e => e.isAllDay && isSameDay(e.start!, day));
  const getTasksForDay = (day: Date) => (tasks || []).filter(t => {
    if (!t.deadline || !isSameDay(new Date(t.deadline), day)) return false;
    if (t.status === 'completed' || t.status === 'completed_late') return false;
    const member = teamMembers?.find(m => m.uid === t.assigneeId);
    const legacyId = getLegacyIdByEmail(member?.email) || (t.assigneeId === 'tit' || t.assigneeId === 'tun' ? t.assigneeId : null);
    if (legacyId === 'tit') return showTit;
    if (legacyId === 'tun') return showTun;
    return true;
  });

  const handleConvertEventToTask = async (event: CalendarEvent) => {
    if (!event.start || !event.end) return;
    try {
      const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
      const assignee = teamMembers?.find(m => {
        if (!m?.email) return false;
        const legacyId = (m.email.toLowerCase() === 'dinhthai.ctv@gmail.com') ? 'tit' : 
                         (m.email.toLowerCase() === 'transontruc.03@gmail.com') ? 'tun' : null;
        return legacyId === event.owner;
      });

      const newTask: any = {
        title: event.title,
        createdBy: userData?.uid || "local-user",
        creatorName: userData?.displayName || "System",
        assigneeId: assignee?.uid || event.owner,
        assigneeName: assignee?.displayName || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].name : event.owner),
        assigneePhoto: assignee?.photoURL || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].photo : null),
        deadline: event.end.getTime(),
        scheduledStartTime: event.start.getTime(),
        scheduledEndTime: event.end.getTime(),
        priority: 'medium',
        timerType: 'countdown',
        limitTime: durationMins,
        isDone: false,
        status: 'idle',
        totalTrackedTime: 0,
        createdAt: Date.now(),
        subTasks: []
      };
      const docRef = await addTask(newTask);
      if (docRef?.id && onStart) {
        setTimeout(() => onStart(docRef.id), 500);
      }
    } catch (e) {
      console.error("Lỗi chuyển đổi Event thành Task:", e);
    }
  };

  if (!calendarApiKey && !appsScriptUrl) return <SetupGuide isDark={isDark} />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <CalendarHeader 
        isDark={isDark}
        weekLabel={`${format(weekStart, 'dd/MM')} – ${format(addDays(weekStart, 6), 'dd/MM/yyyy')}`}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        subWeeks={subWeeks}
        addWeeks={addWeeks}
        viewMode={viewMode}
        setViewMode={setViewMode}
        goToday={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); }}
        showTit={showTit} setShowTit={setShowTit}
        showTun={showTun} setShowTun={setShowTun}
        onUpdateSettings={onUpdateSettings}
        userData={userData}
        fetchEvents={fetchEvents}
        loading={loading}
      />

      {viewMode === 'grid' ? (
        <GridView 
          isDark={isDark} loading={loading} error={error}
          visibleEvents={visibleEvents} weekDays={weekDays}
          getAllDayForDay={getAllDayForDay}
          getEventsForDay={getEventsForDay}
          getTasksForDay={getTasksForDay}
          scrollRef={scrollRef}
        />
      ) : (
        <WeeklyOverview 
          isDark={isDark} weekDays={weekDays} events={visibleEvents} tasks={tasks}
          selectedDay={selectedDay} onSelectDay={setSelectedDay}
          getEventsForDay={getEventsForDay} getTasksForDay={getTasksForDay}
          onStart={onStart} onPause={onPause} onComplete={onComplete}
          onDelete={handleDeleteTask} onPriorityChange={(id, priority) => { handlePriorityChange(id, priority); }}
          onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask}
          onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction}
          onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks}
          now={now}
          aiLoading={aiLoading}
          onConvertEventToTask={handleConvertEventToTask}
          loading={loading} error={error}
          currentAssigneeId={currentAssigneeId}
          teamMembers={teamMembers}
          userEmail={userData?.email}
        />
      )}

      <div className="flex justify-center">
        <a href="https://calendar.google.com" target="_blank" rel="noopener"
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105
            ${isDark ? 'bg-slate-800/50 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
          <ExternalLink size={14} /> Mở Google Calendar để thêm lịch
        </a>
      </div>
    </div>
  );
}
