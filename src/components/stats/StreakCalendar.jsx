import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday
} from 'date-fns';
import { Flame, Snowflake, ChevronLeft, ChevronRight, Target, X } from 'lucide-react';

const WEEK_STARTS_ON = 1;

export default function StreakCalendar({ userData, isDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const streak = userData.streak || 0;
  const lastCheckIn = userData.lastCheckIn; 
  const checkInHistory = userData.checkInHistory || {};

  const getDayStatus = (date) => {
    const dateStr = date.toDateString();
    if (checkInHistory[dateStr]) return checkInHistory[dateStr];
    
    if (!lastCheckIn || streak === 0) return 'inactive';

    const lastCheckInDate = new Date(lastCheckIn);
    lastCheckInDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const diffFromLastCheckIn = Math.round((lastCheckInDate - targetDate) / 86400000);
    if (diffFromLastCheckIn >= 0 && diffFromLastCheckIn < streak) return 'active';

    const diffFromTodayToLast = Math.round((todayDate - lastCheckInDate) / 86400000);
    if (diffFromTodayToLast > 1) {
      const diffToTarget = Math.round((targetDate - lastCheckInDate) / 86400000);
      if (diffToTarget > 0 && diffToTarget < diffFromTodayToLast) {
        if ((userData.streakFreezes || 0) >= diffFromTodayToLast - 1) return 'freeze';
      }
    }
    return 'inactive';
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="relative">
      {/* Nút Streak chính */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500 font-black text-xs rounded-full backdrop-blur-md hover:bg-orange-500/20 transition-all active:scale-95 group relative z-10"
      >
        <Flame size={16} className={`group-hover:scale-110 transition-transform ${streak > 0 ? 'fill-orange-500 animate-pulse' : ''}`} /> 
        {streak} NGÀY
      </button>

      {/* Overlay Modal using React Portal to escape local z-index stacking context */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className={`relative w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border-2 border-slate-800' : 'bg-white border-2 border-slate-100'}`}>
            
            <button onClick={() => setIsOpen(false)} className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
              <X size={18} />
            </button>

            {/* Header Duolingo Style */}
            <div className="flex flex-col items-center justify-center mb-6 mt-2">
              <div className="relative">
                <Flame size={64} className="text-orange-500 fill-orange-500 drop-shadow-xl" />
                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full"></div>
              </div>
              <h2 className={`text-3xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{streak}</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>Ngày Lửa</p>
            </div>

            {/* Calendar Control */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className={`p-2 rounded-2xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronLeft size={20} />
              </button>
              <span className={`font-black text-sm uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button onClick={nextMonth} className={`p-2 rounded-2xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-3">
              {weekDays.map((day, idx) => (
                <div key={idx} className={`text-center text-[11px] font-black uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {days.map((day, index) => {
                const status = getDayStatus(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDay = isToday(day);
                
                let bgClass = isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100";
                let borderClass = "border-transparent border-2";
                let icon = null;

                if (!isCurrentMonth) {
                  bgClass = isDark ? "text-slate-600" : "text-slate-300";
                } else if (status === 'active') {
                  bgClass = "bg-orange-500 text-white font-black";
                  borderClass = "border-orange-500";
                } else if (status === 'freeze') {
                  bgClass = isDark ? "bg-blue-900/40 text-blue-400 font-black" : "bg-blue-100 text-blue-600 font-black";
                  borderClass = isDark ? "border-blue-800/50" : "border-blue-200";
                  icon = <Snowflake size={12} className="absolute -top-1.5 -right-1.5 text-blue-500" />;
                }

                if (isTodayDay && status !== 'active') {
                  borderClass = isDark ? "border-slate-600" : "border-slate-300";
                  if(status !== 'freeze') {
                    bgClass += isDark ? " bg-slate-800/50 font-bold" : " bg-slate-50 font-bold";
                  }
                }

                return (
                  <div key={index} className="flex justify-center items-center relative group">
                    <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all cursor-default select-none ${bgClass} ${borderClass}`}>
                      <span className="text-sm font-bold">{format(day, "d")}</span>
                    </div>
                    {icon}
                  </div>
                );
              })}
            </div>

            {/* Footer text */}
            <div className="mt-8 text-center bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
              <p className={`text-xs font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                 {streak > 0 ? "Tuyệt vời! Bạn đang giữ phong độ rất tốt!" : "Hãy bắt đầu chuỗi ngày mới nào!"}
              </p>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
