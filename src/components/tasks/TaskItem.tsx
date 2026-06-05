import React, { useState, useRef } from 'react';
import { Play, Pause, CheckCircle2, Clock, Calendar, Lock, BrainCircuit, ChevronDown } from 'lucide-react';
import { formatDuration, getLegacyIdByEmail } from '../../utils/helpers';
import type { Task } from '../../utils/helpers';
import { formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskTags, TaskTitle, SubTaskItem, TimerSettingsPopover } from './subcomponents/TaskComponents';

type SubTaskActionType = 'add' | 'toggle' | 'rename' | 'delete';

interface User {
  uid?: string;
  email?: string | null;
}

interface TaskItemProps {
  task: Task;
  user: User | null;
  currentAssigneeId: string | null;
  isDark: boolean;
  now: Date;
  aiLoading: boolean;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onSubTaskAdd: (taskId: string, subId: string | null, action: SubTaskActionType, title: string) => void;
  onSubTaskToggle: (taskId: string, subId: string, action: SubTaskActionType, title?: string) => void;
  onSubTaskDelete: (taskId: string, subId: string, action: SubTaskActionType) => void;
  onUpdateTask: (id: string, updates: any) => void;
  onAiSubtasks: (id: string, title: string) => void;
}

function TaskItem({
  task, user, currentAssigneeId, isDark, now, aiLoading,
  onStart, onPause, onComplete, onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks
}: TaskItemProps) {
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // Subtask panel collapsed by default — user expands on demand
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

  const editTitleRef = useRef<HTMLInputElement>(null);
  const newSubTaskRef = useRef<HTMLInputElement>(null);
  const editSubTaskRef = useRef<HTMLInputElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [tempDeadline, setTempDeadline] = useState(
    task.deadline
      ? new Date(task.deadline - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : ''
  );

  const elapsed =
    task.status === 'running'
      ? task.totalTrackedTime + (now.getTime() - (task.lastStartTime || 0))
      : task.totalTrackedTime;
  const displayTime =
    task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';
  const legacyId = getLegacyIdByEmail(user?.email);
  const isAssignedToMe =
    task.assigneeId === currentAssigneeId ||
    (task.assigneeId && task.assigneeId === legacyId);
  const isCreator = !!user && task.createdBy === user.uid;
  const isLocked = task.assigneeId && !isAssignedToMe && !isCreator;
  const isCompleted = task.status?.startsWith('completed');
  const overdue = !!task.deadline && isPast(task.deadline) && !isCompleted;

  // Subtask progress
  const subTasks = task.subTasks || [];
  const subDone = subTasks.filter((s) => s.isDone).length;
  const subTotal = subTasks.length;
  const subProgress = subTotal > 0 ? (subDone / subTotal) * 100 : 0;
  const hasSubTasks = subTotal > 0;

  const handleDeadlineSubmit = () => {
    if (tempDeadline) onUpdateDeadline(task.id, tempDeadline);
    setIsEditingDeadline(false);
  };

  const handleTitleSubmit = () => {
    const val = editTitleRef.current?.value?.trim();
    if (val && val !== task.title) onRenameTask(task.id, val);
    setIsEditingTitle(false);
  };

  const handleSubTaskRename = (subId: string) => {
    const val = editSubTaskRef.current?.value?.trim();
    if (val) onSubTaskToggle(task.id, subId, 'rename', val);
    setEditingSubTaskId(null);
  };

  return (
    <div
      className={`group relative p-4 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-2xl ${
        isDark
          ? isCompleted
            ? 'bg-slate-800/50 border-slate-700/50 opacity-70'
            : 'bg-slate-800/90 backdrop-blur-md border-slate-600 shadow-xl shadow-slate-900/50'
          : isCompleted
          ? 'bg-white/60 border-slate-200/50 opacity-70'
          : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-xl shadow-slate-200/50'
      } ${isWorking ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 border-indigo-500' : ''}`}
    >
      <TaskTags
        task={task}
        isLocked={!!isLocked}
        isDark={isDark}
        onPriorityChange={onPriorityChange}
        onDelete={onDelete}
      />

      <TaskTitle
        task={task}
        isLocked={!!isLocked}
        isCompleted={!!isCompleted}
        isDark={isDark}
        isEditing={isEditingTitle}
        editTitleRef={editTitleRef}
        onStartEdit={() => setIsEditingTitle(true)}
        onCancelEdit={handleTitleSubmit}
      />

      {task.autoPauseReason === 'heartbeat_timeout' && (
        <div
          className={`flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-xl ${
            isDark
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          <span className="text-[10px]">⏸️</span>
          <span className={`text-[9px] font-bold ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
            Đã tự dừng — quên tắt task
          </span>
        </div>
      )}

      {/* ── Subtask progress bar ──────────────────────────── */}
      {hasSubTasks && (
        <button
          onClick={() => setIsSubTasksOpen((v) => !v)}
          aria-expanded={isSubTasksOpen}
          aria-label={isSubTasksOpen ? 'Thu gọn subtasks' : 'Mở rộng subtasks'}
          className={`w-full mt-3 group/sub-toggle flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all ${
            isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100/70'
          }`}
        >
          {/* Progress track */}
          <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden ${
              isDark ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-emerald-500"
              style={{ width: `${subProgress}%` }}
            />
          </div>
          <span
            className={`text-[9px] font-black tabular-nums shrink-0 ${
              subDone === subTotal && subTotal > 0
                ? 'text-emerald-500'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            {subDone}/{subTotal}
          </span>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform duration-200 ${
              isSubTasksOpen ? 'rotate-180' : ''
            } ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
          />
        </button>
      )}

      {/* ── Bottom row: time + actions ────────────────────── */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col gap-1 text-[10px] font-bold">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            Tạo: {new Date(task.createdAt).toLocaleDateString('vi-VN')}
          </span>
          <div>
            {isEditingDeadline ? (
              <input
                type="datetime-local"
                value={tempDeadline}
                onChange={(e) => setTempDeadline(e.target.value)}
                onBlur={handleDeadlineSubmit}
                autoFocus
                aria-label="Hạn chót"
                className={`bg-indigo-500/10 border border-indigo-500/30 rounded px-1 py-0.5 outline-none text-[10px] ${
                  isDark ? 'text-indigo-300' : 'text-indigo-600'
                }`}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
              />
            ) : (
              <button
                onClick={() => !isLocked && setIsEditingDeadline(true)}
                disabled={!!isLocked}
                className={`flex flex-col text-left group/dl transition-all ${
                  isLocked ? 'cursor-default' : 'hover:scale-[1.02] cursor-pointer'
                }`}
              >
                <span
                  className={`flex items-center gap-1 ${
                    overdue
                      ? 'text-red-500 animate-pulse'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  Hạn:{' '}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Chưa có'}
                  {!isLocked && (
                    <Calendar size={10} className="opacity-0 group-hover/dl:opacity-100 transition-opacity" />
                  )}
                </span>
                {task.deadline && (
                  <span className={`text-[8px] ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                    ({formatDistanceToNow(task.deadline, { locale: vi, addSuffix: true })})
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => !isLocked && !isCompleted && setIsSettingsOpen(!isSettingsOpen)}
              disabled={!!isLocked || !!isCompleted}
              className={`flex items-center gap-1 font-mono transition-all group/timer ${
                isWorking ? 'text-indigo-500' : 'text-slate-400'
              } ${!isLocked && !isCompleted ? 'hover:text-indigo-400' : ''}`}
            >
              <Clock size={10} className={isWorking ? 'animate-spin' : ''} />
              {formatDuration(displayTime)}
            </button>
            {isSettingsOpen && (
              <TimerSettingsPopover
                task={task}
                isDark={isDark}
                onUpdateTask={onUpdateTask}
                onClose={() => setIsSettingsOpen(false)}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isLocked && !isCompleted && (
            <>
              <button
                onClick={() => (isWorking ? onPause(task.id) : onStart(task.id))}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isWorking
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-indigo-600 text-white hover:scale-110 shadow-md shadow-indigo-600/30'
                }`}
              >
                {isWorking ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button
                onClick={() => onComplete(task.id)}
                aria-label="Hoàn thành task"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isDark
                    ? 'bg-slate-700 text-slate-400 hover:bg-emerald-500 hover:text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white'
                }`}
              >
                <CheckCircle2 size={14} />
              </button>
            </>
          )}
          {isLocked && !isCompleted && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-300/10 text-slate-400 opacity-50">
              <Lock size={14} />
            </div>
          )}
        </div>
      </div>

      {/* ── Subtask expandable panel ──────────────────────── */}
      {(!isCompleted || hasSubTasks) && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isSubTasksOpen || (!hasSubTasks && !isCompleted)
              ? 'max-h-[600px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
            {subTasks.map((sub) => (
              <SubTaskItem
                key={sub.id}
                sub={sub}
                isLocked={!!isLocked}
                isCompleted={!!isCompleted}
                isDark={isDark}
                isEditing={editingSubTaskId === sub.id}
                editSubTaskRef={editSubTaskRef}
                onToggle={() => onSubTaskToggle(task.id, sub.id, 'toggle')}
                onRename={() => handleSubTaskRename(sub.id)}
                onDelete={() => onSubTaskDelete(task.id, sub.id, 'delete')}
                onStartEdit={() => setEditingSubTaskId(sub.id)}
              />
            ))}

            {!isLocked && !isCompleted && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = newSubTaskRef.current?.value?.trim();
                    if (val) {
                      onSubTaskAdd(task.id, null, 'add', val);
                      setResetKey((prev) => prev + 1);
                    }
                  }}
                  className="flex mt-2"
                >
                  <input
                    key={`newsub-${resetKey}`}
                    type="text"
                    ref={newSubTaskRef}
                    placeholder="+ Việc nhỏ..."
                    spellCheck="false"
                    autoComplete="off"
                    className={`w-full bg-slate-100/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] font-semibold outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'
                    }`}
                  />
                </form>
                {subTotal === 0 && (
                  <button
                    onClick={() => onAiSubtasks(task.id, task.title)}
                    disabled={aiLoading}
                    className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5 text-[9px] font-black uppercase text-violet-500 hover:bg-violet-500 hover:text-white transition-all"
                  >
                    <BrainCircuit size={12} /> AI Vạch cách làm
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Nút mở subtask khi chưa có subtask nào (panel luôn ẩn ở trên) */}
      {!hasSubTasks && !isCompleted && !isLocked && (
        <button
          onClick={() => setIsSubTasksOpen((v) => !v)}
          aria-expanded={isSubTasksOpen}
          className={`mt-2 w-full text-[9px] font-bold uppercase tracking-widest py-1 rounded-lg transition-all ${
            isSubTasksOpen
              ? isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'
              : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'
          }`}
        >
          {isSubTasksOpen ? '↑ Thu gọn' : '+ Thêm việc nhỏ'}
        </button>
      )}
    </div>
  );
}

export default React.memo(TaskItem);
