import React from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { getAvatarUrl, Task, UserData, SubTask } from '../../utils/helpers';

interface FocusChecklistProps {
  task: Task;
  userData: UserData;
  subTasks: SubTask[];
  subDone: number;
  showChecklist: boolean;
  onSubTaskToggle: (taskId: string, subId: string, type: 'toggle' | 'rename' | 'delete' | 'add', val?: string) => Promise<void>;
  onSubTaskAdd: (taskId: string, subId: string | null, type: 'add', val: string) => Promise<void>;
  subResetKey: string | number;
  newSubTaskRef: React.RefObject<HTMLInputElement | null>;
}

export default function FocusChecklist({
  task,
  userData,
  subTasks,
  subDone,
  showChecklist,
  onSubTaskToggle,
  onSubTaskAdd,
  subResetKey,
  newSubTaskRef
}: FocusChecklistProps) {
  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = newSubTaskRef.current?.value?.trim();
    if (!val) return;
    onSubTaskAdd(task.id, null, 'add', val);
    if (newSubTaskRef.current) {
      newSubTaskRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black text-sm truncate">{task.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {task.assigneeName || 'Team'} {subTasks.length > 0 ? `• ${subDone}/${subTasks.length} xong` : ''}
            </p>
          </div>
          <img src={getAvatarUrl(userData.avatarConfig || {})} className="w-8 h-8 rounded-full border border-white/20" alt="" />
        </div>
        {subTasks.length > 0 && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${(subDone / subTasks.length) * 100}%` }} />
          </div>
        )}
      </div>

      {showChecklist && subTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {subTasks.map(sub => (
              <button key={sub.id} onClick={() => onSubTaskToggle(task.id, sub.id, 'toggle')}
                className="flex items-center gap-2.5 w-full group py-0.5 focus:outline-none">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                  ${sub.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-white/50'}`}>
                  {sub.isDone && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className={`text-xs font-bold text-left
                  ${sub.isDone ? 'text-slate-500 line-through' : 'text-white/70 group-hover:text-white'}`}>
                  {sub.title}
                </span>
              </button>
            ))}
          </div>
          <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2 border-t pt-2 border-white/10">
            <Plus size={10} className="text-slate-500" />
            <input type="text"
              key={`focus-sub-${subResetKey}`}
              ref={newSubTaskRef}
              placeholder="Thêm việc nhỏ..."
              spellCheck="false"
              autoComplete="off"
              className="bg-transparent border-none outline-none text-xs font-bold flex-1 text-white/70 placeholder:text-slate-600 font-[inherit]" />
          </form>
        </div>
      )}
    </div>
  );
}
