import React from 'react';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Calendar as CalIcon, Clock, Settings, List } from 'lucide-react';
import { OWNER_STYLES } from '../../utils/calendarUtils';
import WeeklyTaskCard from './WeeklyTaskCard';
import { Task, TeamMember, CalendarEvent } from '../../utils/helpers';

type OwnerKey = keyof typeof OWNER_STYLES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in OWNER_STYLES;

interface WeeklyOverviewProps {
  isDark: boolean;
  weekDays: Date[];
  events: CalendarEvent[];
  tasks: Task[];
  selectedDay: number;
  onSelectDay: (idx: number) => void;
  getEventsForDay: (day: Date) => CalendarEvent[];
  getTasksForDay: (day: Date) => Task[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  currentAssigneeId: string | null;
  teamMembers: TeamMember[];
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority?: string) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onSubTaskAdd: (
    taskId: string,
    subTaskId: string | null,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskToggle: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskDelete: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete'
  ) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAiSubtasks: (taskId: string, title: string) => void;
  now: number;
  aiLoading: boolean;
  loading: boolean;
  error: string | null;
  onConvertEventToTask: (event: CalendarEvent) => void;
  userEmail: string | null | undefined;
}

export default function WeeklyOverview({ 
  isDark, weekDays, events, tasks, selectedDay, onSelectDay, getEventsForDay, getTasksForDay, 
  onStart, onPause, onComplete, currentAssigneeId, teamMembers,
  onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks,
  now, aiLoading, loading, error, onConvertEventToTask, userEmail
}: WeeklyOverviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-500 animate-pulse">
          <Loader2 size={14} className="animate-spin" /> Đang cập nhật lịch trình...
        </div>
      )}
      {error && !loading && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
          ⚠️ Lỗi đồng bộ: {error}
        </div>
      )}
      
      {/* Day Selector */}
      <div className={`p-2 rounded-[2rem] ${isDark ? 'glass-dark border border-slate-700/50' : 'glass-light shadow-xl border border-white/20'} flex gap-2 overflow-x-auto no-scrollbar`}>
        {weekDays.map((day, i) => {
          const active = selectedDay === i;
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onSelectDay(i)}
              className={`flex-1 min-w-[90px] p-4 rounded-3xl transition-all flex flex-col items-center gap-1.5 relative
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 z-10'
                  : isDark
                    ? 'hover:bg-slate-800/80 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-slate-500'}`}>
                {format(day, 'EEE', { locale: vi })}
              </span>
              <span className="text-xl font-black">{format(day, 'd')}</span>
              <span className={`text-[9px] font-bold ${active ? 'text-indigo-300' : 'text-slate-500/60'}`}>
                Tháng {format(day, 'MM')}
              </span>

              {today && !active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {today && active && (
                <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-[8px] font-black text-indigo-900 uppercase tracking-tighter shadow-sm">
                  Hôm nay
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Column */}
        <div className={`p-8 rounded-[3rem] ${isDark ? 'glass-dark border border-slate-700/30' : 'glass-light shadow-2xl border border-white/20'} min-h-[450px]`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center"><CalIcon size={18} /></div>
            Lịch trình ngày {format(weekDays[selectedDay], 'd/MM')}
          </h4>

          <div className="space-y-4 animate-in fade-in duration-700">
            {getEventsForDay(weekDays[selectedDay]).length > 0 ? (
              getEventsForDay(weekDays[selectedDay]).map((event, idx) => {
                const style = isOwnerKey(event.owner) ? OWNER_STYLES[event.owner] : OWNER_STYLES.tit;
                return (
                  <div key={event.id}
                    className={`group p-5 rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-95 animate-in slide-in-from-right-4 duration-300
                      ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'} relative overflow-hidden [animation-delay:${idx * 50}ms]`}
                  >
                    <div className="flex items-start gap-4 pr-10">
                      <div className={`mt-1 w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}>
                        <Clock size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-black text-base mb-1 truncate group-hover:text-indigo-400 transition-colors">{event.title}</h5>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-500/5"><Clock size={12} className="text-indigo-500" /> {event.start ? format(event.start, 'HH:mm') : '--:--'} – {event.end ? format(event.end, 'HH:mm') : '--:--'}</span>
                          {event.location && <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-500/5 truncate max-w-[150px]"><Settings size={12} className="text-pink-500" /> {event.location}</span>}
                        </div>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${event.owner === 'tit' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
                        {style.label}
                      </div>
                    </div>
                    
                    {/* Add to Tasks Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onConvertEventToTask && onConvertEventToTask(event); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95"
                      title="Chuyển thành Task"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-center space-y-6 animate-pulse">
                <div className={`w-20 h-20 rounded-[2rem] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex items-center justify-center text-slate-600`}>
                  <CalIcon size={40} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Trống lịch trình</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Tận hưởng thời gian nghỉ ngơi nhé!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Column */}
        <div className={`p-8 rounded-[3rem] ${isDark ? 'glass-dark border border-slate-700/30' : 'glass-light shadow-2xl border border-white/20'} min-h-[450px]`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-rose-500 mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center"><List size={18} /></div>
            Công việc hạn {format(weekDays[selectedDay], 'd/MM')}
          </h4>

          <div className="space-y-4 animate-in fade-in duration-700">
            {getTasksForDay(weekDays[selectedDay]).length > 0 ? (
              getTasksForDay(weekDays[selectedDay]).map((task) => (
                <WeeklyTaskCard 
                  key={task.id} 
                  task={task} 
                  currentAssigneeId={currentAssigneeId} 
                  teamMembers={teamMembers}
                  userEmail={userEmail}
                  isDark={isDark} 
                  now={now} 
                  aiLoading={aiLoading}
                  onStart={onStart} 
                  onPause={onPause} 
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onPriorityChange={onPriorityChange}
                  onUpdateDeadline={onUpdateDeadline}
                  onRenameTask={onRenameTask}
                  onSubTaskAdd={onSubTaskAdd}
                  onSubTaskToggle={onSubTaskToggle}
                  onSubTaskDelete={onSubTaskDelete}
                  onUpdateTask={onUpdateTask}
                  onAiSubtasks={onAiSubtasks}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-center space-y-6 animate-pulse">
                <div className={`w-20 h-20 rounded-[2rem] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex items-center justify-center text-slate-600`}>
                  <List size={40} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có deadline</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Bạn đang kiểm soát rất tốt!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
