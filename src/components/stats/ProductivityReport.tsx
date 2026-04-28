import { useState } from 'react';
import { BarChart3, Clock, Target, Flame } from 'lucide-react';
import { useProductivityStats } from '../../hooks/useProductivityStats';
import type { Task, TeamMember, UserData } from '../../utils/helpers';
import ProductivityStatCard from './productivity/ProductivityStatCard';
import { FocusDistributionChart, PeakHoursChart } from './productivity/ProductivityCharts';
import { GoalProgressCard, ProductivityInsights } from './productivity/ProductivityInsights';

interface ProductivityReportProps {
  tasks: Task[];
  userData: UserData;
  isDark: boolean;
  teamMembers: TeamMember[];
}

export default function ProductivityReport({ tasks, userData, isDark, teamMembers }: ProductivityReportProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const stats = useProductivityStats(tasks, timeRange, teamMembers);

  return (
    <div className={`p-4 md:p-8 rounded-[2.5rem] w-full ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Báo Cáo Năng Suất
        </h2>

        <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <button onClick={() => setTimeRange('week')} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${timeRange === 'week' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Tuần
          </button>
          <button onClick={() => setTimeRange('month')} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${timeRange === 'month' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Tháng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ProductivityStatCard isDark={isDark} icon={<BarChart3 size={18} />} label="Sessions" value={stats.sessions} sub="Lượt tập trung" />
        <ProductivityStatCard isDark={isDark} icon={<Clock size={18} />} label="Tổng thời gian" value={stats.totalFocus} sub={<div className="flex items-center gap-1.5 mt-1"><span className="text-[10px] font-bold text-indigo-400">Tít: {stats.titTotal}</span><span className="text-[10px] font-bold text-slate-500">•</span><span className="text-[10px] font-bold text-pink-400">Tún: {stats.tunTotal}</span></div>} />
        <ProductivityStatCard isDark={isDark} icon={<Target size={18} className="text-emerald-500" />} label="Tỷ lệ đúng hạn" value={`${stats.onTimeRate}%`} sub={<div className="flex items-center gap-1.5 mt-1"><span className="text-[10px] font-bold text-red-500">Trễ: {stats.lateCount}</span><span className="text-[10px] font-bold text-slate-500">(Tít: {stats.titLate} • Tún: {stats.tunLate})</span></div>} />
        <ProductivityStatCard isDark={isDark} icon={<Flame size={18} className="text-orange-500" />} label="Chuỗi (Streak)" value={`${userData.streak || 0} ngày`} sub="Cố gắng giữ phong độ!" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FocusDistributionChart stats={stats} isDark={isDark} />
        <PeakHoursChart stats={stats} isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GoalProgressCard stats={stats} timeRange={timeRange} isDark={isDark} />
        <ProductivityInsights stats={stats} isDark={isDark} />
      </div>
    </div>
  );
}
