import React from 'react';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { HOURS, DAY_START_HOUR, HOUR_HEIGHT } from '../../utils/calendarUtils';
import { TimeNowIndicator, EventBlock, TaskDeadlineMarker, AllDayEvent } from './CalendarSubComponents';

export default function GridView({ 
  isDark, loading, error, visibleEvents, weekDays, 
  getAllDayForDay, getEventsForDay, getTasksForDay, scrollRef 
}) {
  return (
    <div className={`rounded-3xl overflow-hidden ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-500">
          <Loader2 size={14} className="animate-spin" /> Đang tải lịch...
        </div>
      )}
      {error && !loading && (
        <div className={`flex items-center justify-center gap-2 p-3 text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
          ⚠️ {error}
        </div>
      )}

      {/* ALL DAY EVENTS */}
      {visibleEvents.some(e => e.isAllDay) && (
        <div className={`grid grid-cols-[60px_repeat(7,1fr)] border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
          <div className="flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase">
            Cả ngày
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className={`p-1.5 min-h-[28px] ${isDark ? 'border-slate-700/30' : 'border-slate-200/30'} border-l`}>
              {getAllDayForDay(day).map(e => <AllDayEvent key={e.id} event={e} />)}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="calendar-scroll overflow-y-auto max-h-[70vh]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-0">
          <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <span className={`text-[10px] font-bold -mt-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {weekDays.map((day, i) => (
            <div key={i}
              className={`relative ${isDark ? 'border-slate-700/30' : 'border-slate-200/30'} border-l`}
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
            >
              <div className={`sticky top-0 z-10 flex flex-col items-center py-2 border-b backdrop-blur-md
                ${isToday(day)
                  ? (isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50/90 border-indigo-200')
                  : (isDark ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-slate-200/50')}`}>
                <span className={`text-[9px] font-bold uppercase ${isToday(day) ? 'text-indigo-500' : 'text-slate-500'}`}>
                  {format(day, 'EEE', { locale: vi })}
                </span>
                <span className={`text-lg font-black ${isToday(day) ? 'text-indigo-500' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {HOURS.map(h => (
                <div key={h}
                  className={`absolute left-0 right-0 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200/60'}`}
                  style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px` }}
                />
              ))}

              {isToday(day) && <TimeNowIndicator />}

              <div className="absolute inset-0">
                {getEventsForDay(day).map(e => <EventBlock key={e.id} event={e} isDark={isDark} />)}
                {getTasksForDay(day).map(t => <TaskDeadlineMarker key={t.id} task={t} isDark={isDark} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
