import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HOUR_HEIGHT, DAY_START_HOUR, DAY_END_HOUR, OWNER_STYLES } from '../../utils/calendarUtils';

export function TimeNowIndicator() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  if (top < 0 || top > (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg shadow-red-500/50" />
        <div className="flex-1 h-[2px] bg-red-500/80" />
      </div>
    </div>
  );
}

export function EventBlock({ event }) {
  if (!event.start || !event.end || event.isAllDay) return null;
  const startMin = event.start.getHours() * 60 + event.start.getMinutes();
  const endMin = event.end.getHours() * 60 + event.end.getMinutes();
  const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(24, ((endMin - startMin) / 60) * HOUR_HEIGHT);
  const style = OWNER_STYLES[event.owner] || OWNER_STYLES.tit;
  const timeStr = `${format(event.start, 'HH:mm')} – ${format(event.end, 'HH:mm')}`;

  return (
    <div
      className={`absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden cursor-default
        bg-gradient-to-br ${style.gradient} text-white shadow-lg
        border border-white/10 transition-all hover:scale-[1.02] hover:shadow-xl hover:z-30`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px' }}
      title={`${event.title}\n${timeStr}${event.location ? '\n📍 ' + event.location : ''}`}
    >
      <p className="text-[10px] font-black leading-tight truncate">{event.title}</p>
      {height > 36 && <p className="text-[9px] opacity-80 font-semibold mt-0.5">{timeStr}</p>}
      {height > 54 && event.location && <p className="text-[8px] opacity-60 mt-0.5 truncate">📍 {event.location}</p>}
    </div>
  );
}

export function AllDayEvent({ event }) {
  const style = OWNER_STYLES[event.owner] || OWNER_STYLES.tit;
  return (
    <div className={`px-2 py-1 rounded-lg text-[9px] font-bold text-white bg-gradient-to-r ${style.gradient} truncate mb-0.5`}>
      {event.title}
    </div>
  );
}

export function TaskDeadlineMarker({ task, isDark }) {
  if (!task.deadline) return null;
  const d = new Date(task.deadline);
  const min = d.getHours() * 60 + d.getMinutes();
  const top = ((min - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  if (top < 0) return null;
  return (
    <div
      className={`absolute left-1 right-1 rounded-lg px-2 py-1 z-10
        ${task.status === 'completed' ? 'opacity-40' : ''}
        ${isDark ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}
      style={{ top: `${top}px`, height: '24px' }}
      title={`Task: ${task.title}`}
    >
      <p className={`text-[9px] font-bold truncate flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
        {task.status === 'completed' ? '✅' : '📌'} {task.title}
      </p>
    </div>
  );
}
