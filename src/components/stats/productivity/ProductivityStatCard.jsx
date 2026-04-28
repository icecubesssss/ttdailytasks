import React from 'react';

export default function ProductivityStatCard({ icon, label, value, sub, isDark }) {
  return (
    <div className={`p-4 md:p-5 rounded-[2rem] flex flex-col justify-between h-full ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
        <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        {sub && <div className="text-xs font-bold text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
