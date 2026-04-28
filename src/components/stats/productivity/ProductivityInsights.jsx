import React from 'react';
import { Target, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export function GoalProgressCard({ stats, timeRange, isDark }) {
  const goalMs = timeRange === 'week' ? 10 * 3600000 : 40 * 3600000;
  const progressPct = Math.min(Math.round((stats.totalFocusMs / goalMs) * 100), 100);

  return (
    <div className={`p-6 rounded-[2rem] flex flex-col justify-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tiến độ mục tiêu</h4>
        <span className={`px-2 py-1 rounded text-[10px] font-black ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{progressPct}%</span>
      </div>
      <div className="mb-4">
        <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.totalFocus}</h3>
        <p className="text-xs font-bold text-slate-400">/ {timeRange === 'week' ? '10h' : '40h'} mục tiêu</p>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'} mb-2`}>
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }}></div>
      </div>
      <p className="text-[10px] font-bold text-emerald-500 text-center uppercase tracking-widest">Keep going!</p>
    </div>
  );
}

export function ProductivityInsights({ stats, isDark }) {
  return (
    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        <Target size={16} className="text-slate-400 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Ngày đỉnh nhất</p>
        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.bestDay}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{stats.bestDayMs} focus</p>
      </div>

      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        <Clock size={16} className="text-slate-400 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Khung giờ vàng</p>
        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.peakHour}:00</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">Siêu tập trung</p>
      </div>

      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center col-span-2 md:col-span-1 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        {stats.changePct >= 0 ? <TrendingUp size={16} className="text-emerald-500 mb-2" /> : <TrendingDown size={16} className="text-red-500 mb-2" />}
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">So với tuần trước</p>
        <h3 className={`text-xl font-black ${stats.changePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{stats.changePct > 0 ? '+' : ''}{stats.changePct}%</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{stats.changePct >= 0 ? 'Tăng trưởng' : 'Giảm nhẹ'}</p>
      </div>
    </div>
  );
}
