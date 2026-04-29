import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, LayoutGrid, List, Eye, EyeOff, RefreshCw, Zap 
} from 'lucide-react';
import { OWNER_STYLES } from '../../utils/calendarUtils';
import { UserData } from '../../utils/helpers';

interface CalendarHeaderProps {
  isDark: boolean;
  weekLabel: string;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  subWeeks: (date: Date, amount: number) => Date;
  addWeeks: (date: Date, amount: number) => Date;
  viewMode: 'grid' | 'weekly';
  setViewMode: (mode: 'grid' | 'weekly') => void;
  goToday: () => void;
  showTit: boolean;
  setShowTit: (val: boolean) => void;
  showTun: boolean;
  setShowTun: (val: boolean) => void;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  userData: UserData;
  fetchEvents: () => void;
  loading: boolean;
}

export default function CalendarHeader({ 
  isDark, weekLabel, currentDate, setCurrentDate, subWeeks, addWeeks, 
  viewMode, setViewMode, goToday, showTit, setShowTit, showTun, setShowTun, 
  onUpdateSettings, userData, fetchEvents, loading 
}: CalendarHeaderProps) {
  const autoSync = userData?.autoSyncCalendar === true;

  return (
    <div className={`p-4 md:p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => subWeeks(d, 1))}
              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-[140px]">
              <h3 className="font-black text-sm">{weekLabel}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {format(currentDate, 'MMMM yyyy', { locale: vi })}
              </p>
            </div>
            <button onClick={() => setCurrentDate(d => addWeeks(d, 1))}
              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-100/50'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
                ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Lưới
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
                ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> Tổng quan
            </button>
          </div>

          <button onClick={goToday}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            Hôm nay
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Sync Toggle */}
          <button onClick={() => onUpdateSettings({ autoSyncCalendar: !autoSync })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${autoSync ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            <Zap size={12} className={autoSync ? 'fill-amber-500' : ''} />
            {autoSync ? 'Auto Sync ON' : 'Auto Sync OFF'}
          </button>

          <button onClick={() => {
            const newVal = !showTit;
            setShowTit(newVal);
            onUpdateSettings({ calendarVisibility: { ...userData?.calendarVisibility, tit: newVal } });
          }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${showTit ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            {showTit ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className={`w-2 h-2 rounded-full ${OWNER_STYLES.tit.dot}`} /> Tít
          </button>
          <button onClick={() => {
            const newVal = !showTun;
            setShowTun(newVal);
            onUpdateSettings({ calendarVisibility: { ...userData?.calendarVisibility, tun: newVal } });
          }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${showTun ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            {showTun ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className={`w-2 h-2 rounded-full ${OWNER_STYLES.tun.dot}`} /> Tún
          </button>
          <button onClick={fetchEvents} disabled={loading}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

