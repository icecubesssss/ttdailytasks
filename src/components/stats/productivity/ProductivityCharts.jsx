import React from 'react';

export function FocusDistributionChart({ stats, isDark }) {
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col h-72 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phân bố thời gian</h4>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tít</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tún</span></div>
        </div>
      </div>
      <div className="flex-1 flex items-end justify-between gap-2 mt-4">
        {stats.distribution.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-3 w-full group h-40">
            <div className="relative w-full flex justify-center flex-1">
              <div 
                className={`absolute bottom-0 w-8 md:w-12 flex flex-col justify-end rounded-lg overflow-hidden transition-all duration-700 ease-out ${d.value === 0 ? (isDark ? 'bg-slate-800/50' : 'bg-slate-100') : ''}`}
                style={{ height: `${Math.max((d.value / stats.maxDist) * 100, 5)}%` }}
              >
                {d.value > 0 && (
                  <>
                    <div style={{ height: `${(d.tunMs / d.value) * 100}%` }} className="bg-pink-400 w-full group-hover:brightness-110 transition-all"></div>
                    <div style={{ height: `${(d.titMs / d.value) * 100}%` }} className="bg-indigo-500 w-full group-hover:brightness-110 transition-all"></div>
                  </>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeakHoursChart({ stats, isDark }) {
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col h-72 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Giờ Vàng Tập Trung</h4>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tít</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tún</span></div>
        </div>
      </div>
      <div className="flex-1 flex items-end justify-between gap-1 mt-4">
        {stats.hours.map((val, i) => (
          <div key={i} className="flex flex-col items-center w-full h-40 relative group">
            <div 
              className={`absolute bottom-0 w-full flex flex-col justify-end rounded-sm overflow-hidden transition-all duration-700 ${val.total === 0 ? (isDark ? 'bg-slate-800/50' : 'bg-slate-100') : ''} ${i === stats.peakHour ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
              style={{ height: `${Math.max((val.total / stats.maxHourMs) * 100, 2)}%` }}
            >
              {val.total > 0 && (
                <>
                  <div style={{ height: `${(val.tun / val.total) * 100}%` }} className="bg-pink-400 w-full group-hover:brightness-110 transition-all"></div>
                  <div style={{ height: `${(val.tit / val.total) * 100}%` }} className="bg-indigo-500 w-full group-hover:brightness-110 transition-all"></div>
                </>
              )}
            </div>
            {i % 6 === 0 && <span className="absolute -bottom-6 text-[8px] font-bold text-slate-500">{i.toString().padStart(2, '0')}:00</span>}
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-[10px] font-bold text-slate-400">Giờ năng suất nhất: <span className="text-emerald-500 font-black">{stats.peakHour.toString().padStart(2, '0')}:00 - {(stats.peakHour + 1).toString().padStart(2, '0')}:00</span></p>
      </div>
    </div>
  );
}
