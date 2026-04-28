import React from 'react';
import { Trash2, Lock, Users, Clock, Calendar, Pencil, CheckCircle2, Circle, X, BrainCircuit } from 'lucide-react';

export function TaskTags({ task, isLocked, isDark, onPriorityChange, onDelete }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => !isLocked && onPriorityChange(task.id, task.priority)}
          disabled={isLocked}
          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isLocked ? 'cursor-default' : 'hover:scale-110 active:scale-95 cursor-pointer'} ${task.priority === 'high' ? 'bg-red-500/20 text-red-500' : task.priority === 'medium' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-500/20 text-slate-500'}`}
        >
          {task.priority || 'vừa'}
        </button>
        {task.assigneeId && (
          <span className={`flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full text-[9px] font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {task.assigneePhoto ? <img src={task.assigneePhoto} className="w-3.5 h-3.5 rounded-full" alt="" /> : <Users size={10} />}
            {task.assigneeName}
          </span>
        )}
        {task.status === 'completed_late' && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} /> Trễ hạn
          </span>
        )}
      </div>
      {!isLocked ? (
        <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
      ) : (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase tracking-widest">
          <Lock size={10} /> LOCK
        </div>
      )}
    </div>
  );
}

export function TaskTitle({ task, isLocked, isCompleted, isDark, isEditing, editTitleRef, onStartEdit }) {
  if (isEditing) return (
    <div className="mb-3">
      <input autoFocus type="text" ref={editTitleRef} defaultValue={task.title} spellCheck="false" autoComplete="off"
        className={`w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-2 outline-none text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`} />
    </div>
  );

  return (
    <div className="mb-3">
      <h4 onClick={() => !isLocked && onStartEdit()}
        className={`group/title relative text-sm font-extrabold leading-snug cursor-text flex items-start gap-2 ${isCompleted ? 'line-through text-slate-400' : (isDark ? 'text-white' : 'text-slate-800')}`}>
        {task.title}
        {!isLocked && !isCompleted && <Pencil size={12} className="opacity-0 group-hover/title:opacity-100 transition-opacity mt-1 text-slate-400" />}
      </h4>
    </div>
  );
}

export function SubTaskItem({ sub, isLocked, isCompleted, isDark, isEditing, editSubTaskRef, onToggle, onRename, onDelete, onStartEdit }) {
  return (
    <div className="flex items-start gap-1.5 group/sub">
      <button onClick={onToggle} disabled={isLocked || isCompleted}
        className={`mt-0.5 transition-colors ${(isLocked || isCompleted) ? 'cursor-not-allowed opacity-50' : ''} ${sub.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
        {sub.isDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      </button>

      {isEditing ? (
        <input autoFocus type="text" ref={editSubTaskRef} defaultValue={sub.title} onBlur={onRename}
          onKeyDown={(e) => e.key === 'Enter' && onRename()} spellCheck="false" autoComplete="off"
          className={`flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 outline-none text-[10px] ${isDark ? 'text-white' : 'text-slate-800'}`} />
      ) : (
        <span onClick={() => !isLocked && !isCompleted && onStartEdit()}
          className={`group/sub-text relative text-[10px] flex-1 leading-tight cursor-text flex items-center gap-1 ${sub.isDone ? 'text-slate-400 line-through' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
          {sub.title}
          {!isLocked && !isCompleted && <Pencil size={8} className="opacity-0 group-hover/sub-text:opacity-100 transition-opacity text-slate-400" />}
        </span>
      )}

      {!isLocked && !isCompleted && (
        <button onClick={onDelete} className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-red-500"><X size={10} /></button>
      )}
    </div>
  );
}

export function TimerSettingsPopover({ task, isDark, onUpdateTask, onClose }) {
  const isCountdown = task.type === 'countdown';
  const limitMs = task.limitTime || 0;

  const handleToggleTimerType = () => {
    const newType = task.type === 'stopwatch' ? 'countdown' : 'stopwatch';
    const newLimit = newType === 'countdown' ? 25 * 60 * 1000 : null;
    onUpdateTask(task.id, { type: newType, limitTime: newLimit });
  };

  const handleUpdateLimit = (mins) => {
    const ms = Math.max(1, parseInt(mins) || 1) * 60 * 1000;
    onUpdateTask(task.id, { limitTime: ms, type: 'countdown' });
  };

  return (
    <div className={`absolute bottom-full left-0 mb-2 z-50 w-48 p-3 rounded-2xl border shadow-xl animate-in fade-in zoom-in-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase text-slate-500">Đồng hồ</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
      </div>
      
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={handleToggleTimerType} className={`py-1.5 rounded-lg text-[9px] font-bold transition-all ${!isCountdown ? 'bg-indigo-500 text-white' : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700')}`}>
          Đếm xuôi
        </button>
        <button onClick={handleToggleTimerType} className={`py-1.5 rounded-lg text-[9px] font-bold transition-all ${isCountdown ? 'bg-indigo-500 text-white' : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700')}`}>
          Đếm ngược
        </button>
      </div>

      {isCountdown && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[15, 25, 45, 60].map(m => (
            <button key={m} onClick={() => handleUpdateLimit(m)} className={`py-1 rounded-lg text-[9px] font-bold transition-all border ${limitMs === m * 60000 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : (isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500')}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
