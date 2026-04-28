import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { 
  Play, Pause, Check, Trash2, Pencil, X, BrainCircuit, Circle, CheckCircle2, Clock, Timer, Calendar
} from 'lucide-react';
import { formatDuration, getLegacyIdByEmail, Task, TeamMember } from '../../utils/helpers';
import { TimerSettingsPopover } from '../tasks/subcomponents/TaskComponents';

interface WeeklyTaskCardProps {
  task: Task;
  currentAssigneeId: string | null;
  teamMembers: TeamMember[];
  userEmail: string | null | undefined;
  isDark: boolean;
  aiLoading: boolean;
  now: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
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
}

export default function WeeklyTaskCard({ 
  task, currentAssigneeId, teamMembers, userEmail, isDark, aiLoading, now,
  onStart, onPause, onComplete, onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks 
}: WeeklyTaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);
  const [tempDeadline, setTempDeadline] = useState(task.deadline ? new Date(task.deadline - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');

  const legacyId = getLegacyIdByEmail(userEmail);
  const assigneeMember = teamMembers?.find(m => m.uid === task.assigneeId);
  const taskLegacyId = getLegacyIdByEmail(assigneeMember?.email) || (task.assigneeId === 'tit' || task.assigneeId === 'tun' ? task.assigneeId : null);
  
  const isAssignedToMe = task.assigneeId === currentAssigneeId || (task.assigneeId && taskLegacyId === legacyId);
  const isCreator = task.createdBy === currentAssigneeId;
  const isLocked = !!(task.assigneeId && !isAssignedToMe && !isCreator);

  const assigneeDisplayName = task.assigneeName || (taskLegacyId === 'tit' ? 'Tít' : taskLegacyId === 'tun' ? 'Tún' : 'Chưa gán');

  const handleTitleSubmit = () => {
    const val = editTitleRef.current?.value?.trim();
    if (val && val !== task.title) onRenameTask(task.id, val);
    setIsEditingTitle(false);
  };

  const handleDeadlineSubmit = () => {
    if (tempDeadline) onUpdateDeadline(task.id, tempDeadline);
    setIsEditingDeadline(false);
  };

  const elapsed = task.status === 'running' ? (task.totalTrackedTime || 0) + (now - (task.lastStartTime || now)) : (task.totalTrackedTime || 0);
  const displayTime = task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';

  return (
    <div className={`group p-5 rounded-[2rem] border transition-all hover:scale-[1.01] animate-in slide-in-from-left-4 duration-300
      ${task.status === 'completed' ? 'opacity-60 grayscale-[0.3]' : ''}
      ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
      
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:rotate-12 flex-shrink-0
          ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          {task.status === 'completed' ? '✅' : (task.priority === 'high' ? '🔥' : '📌')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                ref={editTitleRef}
                defaultValue={task.title}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                placeholder="Tiêu đề công việc"
                title="Sửa tiêu đề công việc"
                className={`flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1 outline-none text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}
              />
            ) : (
              <h5 
                onClick={() => !isLocked && setIsEditingTitle(true)}
                className={`font-black text-base truncate cursor-text flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-slate-500' : 'group-hover:text-indigo-500'} transition-colors`}
              >
                {task.title}
                {!isLocked && <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />}
              </h5>
            )}
            
            {!isLocked && (
              <button onClick={() => onDelete(task.id)} title="Xóa task" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
            <button
              onClick={() => !isLocked && onPriorityChange(task.id, task.priority)}
              disabled={isLocked}
              title={`Đổi mức độ ưu tiên (Hiện tại: ${task.priority || 'vừa'})`}
              className={`px-2 py-0.5 rounded-lg border transition-all ${isLocked ? 'cursor-default' : 'hover:scale-105 active:scale-95'} ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-500/5 border-slate-500/10'}`}
            >
              {task.priority || 'vừa'}
            </button>

            <span className={`px-2 py-0.5 rounded-lg border ${taskLegacyId === 'tit' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : (taskLegacyId === 'tun' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20')}`}>
              {assigneeDisplayName}
            </span>

            <div className="flex items-center">
              {isEditingDeadline ? (
                <input
                  type="datetime-local"
                  value={tempDeadline}
                  onChange={(e) => setTempDeadline(e.target.value)}
                  onBlur={handleDeadlineSubmit}
                  autoFocus
                  placeholder="Chọn thời hạn"
                  title="Đặt thời hạn hoàn thành"
                  className={`bg-indigo-500/10 border border-indigo-500/30 rounded px-1 py-0.5 outline-none text-[10px] ${isDark ? 'text-indigo-300 [color-scheme:dark]' : 'text-indigo-600 [color-scheme:light]'}`}
                />
              ) : (
                <button 
                  onClick={() => !isLocked && setIsEditingDeadline(true)}
                  className={`flex items-center gap-1 hover:text-indigo-500 transition-colors ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <Calendar size={12} /> {task.deadline ? format(new Date(task.deadline), 'HH:mm dd/MM') : 'Hạn'}
                </button>
              )}
            </div>
            
            <div className="relative flex items-center">
              <button 
                onClick={() => !isLocked && task.status !== 'completed' && setIsSettingsOpen(!isSettingsOpen)} 
                disabled={isLocked || task.status === 'completed'} 
                title="Cài đặt thời gian"
                className={`flex items-center gap-1 font-mono transition-all group/timer ${isWorking ? 'text-indigo-500' : 'text-slate-500'} ${(!isLocked && task.status !== 'completed') ? 'hover:text-indigo-400' : ''}`}
              >
                {task.type === 'countdown' ? <Timer size={12} className={isWorking ? 'animate-spin' : ''} /> : <Clock size={12} className={isWorking ? 'animate-spin' : ''} />}
                {formatDuration(displayTime)}
              </button>
              {isSettingsOpen && (
                <TimerSettingsPopover task={task} isDark={isDark} onUpdateTask={onUpdateTask} onClose={() => setIsSettingsOpen(false)} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status !== 'completed' && (
            <>
              {task.status === 'running' ? (
                <button
                  onClick={() => !isLocked && onPause(task.id)}
                  disabled={isLocked}
                  className={`p-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 ${!isLocked ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                  title={!isLocked ? "Tạm dừng" : "Chỉ người nhận việc mới được tương tác"}
                >
                  <Pause size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={() => !isLocked && onStart(task.id)}
                  disabled={isLocked}
                  className={`p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 ${!isLocked ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                  title={!isLocked ? "Bắt đầu" : "Chỉ người nhận việc mới được tương tác"}
                >
                  <Play size={16} fill="currentColor" />
                </button>
              )}
              <button
                onClick={() => !isLocked && onComplete(task.id)}
                disabled={isLocked}
                className={`p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 ${!isLocked ? 'bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                title={!isLocked ? "Hoàn thành" : "Chỉ người nhận việc mới được tương tác"}
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </>
          )}
          {task.status === 'completed' && (
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
              <Check size={20} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {((task.subTasks && task.subTasks.length > 0) || (task.status !== 'completed' && !isLocked)) && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
          {(task.subTasks || []).map(sub => (
            <div key={sub.id} className="flex items-center gap-2 group/sub">
              <button
                onClick={() => !isLocked && task.status !== 'completed' && onSubTaskToggle(task.id, sub.id, 'toggle')}
                disabled={isLocked || task.status === 'completed'}
                title={sub.isDone ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                className={`transition-colors ${sub.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
              >
                {sub.isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </button>
              
              {editingSubTaskId === sub.id ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={sub.title}
                  onBlur={(e) => {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) onSubTaskToggle(task.id, sub.id, 'rename', val);
                    setEditingSubTaskId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) onSubTaskToggle(task.id, sub.id, 'rename', val);
                      setEditingSubTaskId(null);
                    }
                  }}
                  placeholder="Tên việc nhỏ..."
                  title="Sửa tên việc nhỏ"
                  className={`flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 outline-none text-[11px] ${isDark ? 'text-white' : 'text-slate-800'}`}
                />
              ) : (
                <span 
                  onClick={() => !isLocked && task.status !== 'completed' && setEditingSubTaskId(sub.id)}
                  className={`text-[11px] font-bold flex-1 cursor-text flex items-center gap-2 ${sub.isDone ? 'text-slate-400 line-through' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}
                >
                  {sub.title}
                  {!isLocked && task.status !== 'completed' && <Pencil size={10} className="opacity-0 group-hover/sub:opacity-100 text-slate-400" />}
                </span>
              )}

              {!isLocked && task.status !== 'completed' && (
                <button 
                  onClick={() => onSubTaskDelete(task.id, sub.id, 'delete')} 
                  title="Xóa việc nhỏ"
                  className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          {!isLocked && task.status !== 'completed' && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="+ Thêm việc nhỏ..."
                title="Thêm việc nhỏ mới"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const val = target.value.trim();
                    if (val) {
                      onSubTaskAdd(task.id, null, 'add', val);
                      target.value = '';
                    }
                  }
                }}
                className={`flex-1 bg-slate-100/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-indigo-500 transition-all ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
              />
              {(!task.subTasks || task.subTasks.length === 0) && (
                <button
                  onClick={() => onAiSubtasks(task.id, task.title)}
                  disabled={aiLoading}
                  title="AI gợi ý cách làm"
                  className="px-3 py-1.5 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 text-[10px] font-black uppercase text-violet-500 hover:bg-violet-500 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <BrainCircuit size={14} /> AI
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
