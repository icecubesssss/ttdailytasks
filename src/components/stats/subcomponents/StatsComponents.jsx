import React from 'react';
import { Layout, Calendar as CalendarIcon, ListTree, Sparkles, Zap, Rocket, Cpu } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail } from '../../../utils/helpers';
import { DEFAULT_AVATARS, AI_MODELS } from '../../../utils/constants';

export function TeamMembersList({ teamMembers, userData, isDark }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {teamMembers.map(member => (
        <div key={member.uid} className={`relative overflow-hidden p-4 rounded-3xl flex flex-col gap-3 transition-all group ${isDark ? 'bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 shadow-xl shadow-slate-950/20' : 'bg-white border border-slate-200 hover:border-indigo-500/30 shadow-lg shadow-slate-200/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex-shrink-0 ${member.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}>
              <img src={getAvatarUrl(member.avatarConfig || DEFAULT_AVATARS[getAssigneeIdByEmail(member.email)] || {})} className="w-12 h-12 rounded-full border-2 border-indigo-400/40 object-cover" alt={member.displayName} />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 ring-1 ring-indigo-400/50">
                {member.level || 1}
              </div>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-2">
                <p className="font-black text-base truncate">{member.displayName}</p>
                {member.streak > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black animate-pulse">
                    <Sparkles size={10} className="fill-orange-500" />
                    {member.streak}
                  </div>
                )}
              </div>
              <p className="text-[9px] uppercase font-bold tracking-[0.14em] text-slate-500 truncate">
                {member.uid === userData.uid ? 'Bản thân' : 'Đồng hành'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">🔥</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.streak || 0} Ngày</span>
             </div>
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">💰</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.ttGold || 0}</span>
             </div>
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">✨</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.xp || 0} XP</span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppPreferences({ userData, isDark, onUpdateSettings, onTabChange }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={`p-5 rounded-[2rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400"><Layout size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Mặc định</h4><p className="text-[10px] font-bold text-slate-500">Tự động mở khi vào app</p></div>
        </div>
        <div className={`flex p-1 rounded-2xl gap-1 ${isDark ? 'bg-[#0e1e3d]/85 border border-[#233a63]' : 'bg-white border border-slate-200'}`}>
          {[
            { id: 'tasks', label: 'Board', icon: <Layout size={14} /> },
            { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={14} /> },
            { id: 'list', label: 'List', icon: <ListTree size={14} /> }
          ].map(v => (
            <button key={v.id} onClick={() => { onUpdateSettings({ defaultView: v.id }); if (onTabChange) onTabChange(v.id); }}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all ${userData.defaultView === v.id ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.55)]' : (isDark ? 'text-slate-400 hover:bg-[#1a2f57]/70' : 'text-slate-500 hover:bg-slate-100')}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`p-5 rounded-[2rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400"><Sparkles size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Chế độ AI</h4><p className="text-[10px] font-bold text-slate-500">Giọng văn trợ lý</p></div>
        </div>
        <div className={`flex p-1 rounded-2xl gap-1 ${isDark ? 'bg-[#0e1e3d]/85 border border-[#233a63]' : 'bg-white border border-slate-200'}`}>
          {[{ id: 'cute', label: 'Dễ thương', icon: '💖' }, { id: 'sassy', label: 'Cà khịa', icon: '🔥' }].map(m => (
            <button key={m.id} onClick={() => onUpdateSettings({ aiMode: m.id })}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all ${userData.aiMode === m.id ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_0_24px_rgba(217,70,239,0.45)]' : (isDark ? 'text-slate-400 hover:bg-[#1a2f57]/70' : 'text-slate-500 hover:bg-slate-100')}`}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`lg:col-span-2 p-5 rounded-[2.5rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400"><Cpu size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Động cơ AI (OpenRouter)</h4><p className="text-[10px] font-bold text-slate-500">Chọn model bạn muốn sử dụng</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AI_MODELS.map(model => (
            <button key={model.id} onClick={() => onUpdateSettings({ aiModel: model.id })}
              className={`flex items-center gap-3 p-3 rounded-2xl text-[11px] font-black uppercase transition-all border ${userData.aiModel === model.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : (isDark ? 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100')}`}>
              <span className="text-base">{model.icon}</span>
              <span className="truncate">{model.name}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

export function FocusAutomation({ userData, isDark, onUpdateSettings, triggerSystemFocus, startShortcutRef, stopShortcutRef, handleBlur, DEFAULT_SHORTCUT_NAME }) {
  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
      <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><Zap size={120} /></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div><h4 className="font-black text-lg mb-1 flex items-center gap-2"><Zap size={20} className="text-indigo-500 fill-indigo-500" /> Focus Automation</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tự động chuyển chế độ khi làm việc</p></div>
          <button onClick={() => onUpdateSettings({ autoFocusShortcut: !userData.autoFocusShortcut })}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${userData.autoFocusShortcut ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-700 text-slate-400'}`}>
            {userData.autoFocusShortcut ? 'Đang kích hoạt' : 'Đã tạm tắt'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="hidden md:block absolute top-[44px] left-1/2 -translate-x-1/2 w-12 h-px bg-slate-700/30"></div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black">1</div><span className="text-[11px] font-black uppercase text-slate-400">Khi Bắt Đầu Task</span></div>
            <div className="flex gap-2">
              <input type="text" ref={startShortcutRef} defaultValue={userData.shortcutName ?? DEFAULT_SHORTCUT_NAME} onBlur={(e) => handleBlur('shortcutName', e.target.value)} placeholder="VD: Làm việc" className={`flex-1 px-5 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`} />
              <button onClick={() => triggerSystemFocus(startShortcutRef.current?.value || userData.shortcutName || DEFAULT_SHORTCUT_NAME)} className="p-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"><Rocket size={18} /></button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black">2</div><span className="text-[11px] font-black uppercase text-slate-400">Khi Tạm Dừng / Xong</span></div>
            <div className="flex gap-2">
              <input type="text" ref={stopShortcutRef} defaultValue={userData.offShortcutName ?? ''} onBlur={(e) => handleBlur('offShortcutName', e.target.value)} placeholder="Trống = Không đổi" className={`flex-1 px-5 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} />
              <button onClick={() => { const s = stopShortcutRef.current?.value || userData.offShortcutName; if (s) triggerSystemFocus(s); }} disabled={!userData.offShortcutName} className={`p-3 rounded-2xl transition-all shadow-lg active:scale-95 ${userData.offShortcutName ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}><Rocket size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
