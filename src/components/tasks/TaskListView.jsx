import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Circle, Clock, AlertTriangle, Users, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDuration } from '../../utils/helpers';
import { ASSIGNEES } from '../../utils/constants';

const TaskListItem = ({
  task, isDark, now, currentAssigneeId, user,
  onStart, onPause, onComplete, onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const elapsed = task.status === 'running' ? task.totalTrackedTime + (now - task.lastStartTime) : task.totalTrackedTime;
  const displayTime = task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';
  const isAssignedToMe = task.assigneeId === currentAssigneeId;
  const isCreator = user && task.createdBy === user.uid;
  const isLocked = task.assigneeId && !isAssignedToMe && !isCreator;
  const hasDeadline = !!task.deadline;
  const overdue = hasDeadline && isPast(task.deadline) && task.status !== 'completed';
  const subTasks = task.subTasks || [];

  return (
    <div className={`flex flex-col p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-800' : 'bg-white/90 border-slate-200 hover:bg-white shadow-sm'} ${isWorking ? 'ring-1 ring-indigo-500' : ''} ${task.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="flex-shrink-0 mt-0.5 self-start">
          {task.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-500" /> : 
           isWorking ? <Clock size={18} className="text-indigo-500 animate-spin-slow" /> : 
           overdue ? <AlertTriangle size={18} className="text-red-500" /> : 
           <Circle size={18} className="text-slate-400" />}
        </div>

        {/* Core Info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer" onClick={() => subTasks.length > 0 && setExpanded(!expanded)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold truncate ${task.status === 'completed' ? 'line-through text-slate-500' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                {task.title}
              </h4>
              {task.priority === 'high' && <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-red-500/20 text-red-500 uppercase">GẤP</span>}
            </div>
            
            <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold text-slate-500">
              {task.assigneeId && (
                <span className="flex items-center gap-1"><Users size={10} /> {task.assigneeName}</span>
              )}
              {hasDeadline && (
                <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                  <Calendar size={10} /> {formatDistanceToNow(task.deadline, { locale: vi, addSuffix: true })}
                </span>
              )}
              {subTasks.length > 0 && (
                <span className="flex items-center gap-0.5 text-indigo-400">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {subTasks.filter(s => s.isDone).length}/{subTasks.length} việc nhỏ
                </span>
              )}
              <span className={`flex items-center gap-1 ml-auto sm:ml-0 font-mono ${isWorking ? 'text-indigo-500' : ''}`}>
                <Clock size={10} /> {formatDuration(displayTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isLocked && task.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); isWorking ? onPause(task.id) : onStart(task.id); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isWorking ? 'bg-amber-500 text-white shadow-md' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
            >
              {isWorking ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
          )}
          {!isLocked && task.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          {!isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Subtasks */}
      {expanded && subTasks.length > 0 && (
        <div className={`mt-3 pt-3 pl-8 border-t flex flex-col gap-1.5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          {subTasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-2">
              {sub.isDone ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Circle size={12} className="text-slate-400" />}
              <span className={`text-xs ${sub.isDone ? 'line-through text-slate-500' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TaskGroup = ({ title, tasksList, colorClass, icon, isDark, now, currentAssigneeId, user, onStart, onPause, onComplete, onDelete }) => {
  if (tasksList.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-3 ${colorClass}`}>
        {icon} {title} ({tasksList.length})
      </h3>
      <div className="flex flex-col gap-2">
        {tasksList.map(task => (
          <TaskListItem 
            key={task.id} 
            task={task} 
            isDark={isDark} 
            now={now} 
            currentAssigneeId={currentAssigneeId} 
            user={user}
            onStart={onStart}
            onPause={onPause}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

function TaskListView({
  tasks, user, currentAssigneeId, isDark, now,
  onStart, onPause, onComplete, onDelete
}) {
  const sortedTasks = [...tasks].sort((a,b) => b.createdAt - a.createdAt);

  const isOverdue = (t) => t.deadline && t.deadline < now && t.status !== 'completed';
  const overdueTasks = sortedTasks.filter(t => isOverdue(t));
  const inProgressTasks = sortedTasks.filter(t => t.status === 'running' && !isOverdue(t));
  const todoTasks = sortedTasks.filter(t => (t.status === 'idle' || t.status === 'paused') && !isOverdue(t));
  const doneTasks = sortedTasks.filter(t => t.status === 'completed');

  return (
    <div className={`p-4 md:p-6 rounded-[2.5rem] ${isDark ? 'bg-slate-900/40 border border-slate-800' : 'bg-slate-50/50 border border-slate-200'} pb-24`}>
      <TaskGroup title="Overdue" tasksList={overdueTasks} colorClass="text-red-500" icon={<AlertTriangle size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="In Progress" tasksList={inProgressTasks} colorClass="text-indigo-500" icon={<Clock size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="To Do" tasksList={todoTasks} colorClass="text-slate-500" icon={<Circle size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="Finished" tasksList={doneTasks} colorClass="text-emerald-500" icon={<CheckCircle2 size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />

      {tasks.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed rounded-[2rem] border-slate-300 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-500">Chưa có công việc nào!</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(TaskListView);
