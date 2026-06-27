import React, { useState } from 'react';
import { Activity, Circle, Clock, CheckCircle2, AlertTriangle, Calendar, LayoutGrid, Layers } from 'lucide-react';
import { isSameWeek, isSameMonth } from 'date-fns';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskItem from './TaskItem';
import { useAudio } from '../../hooks/useAudio';
import { useTaskActionContext } from '../../contexts/TaskActionContext';
import type { Task, UserData, AppUser as User } from '../../utils/helpers';

interface ColumnHeaderProps {
  title: string;
  count: number;
  icon: React.ReactElement;
  colorClass: string;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ title, count, icon, colorClass }) => (
  <div className={`flex items-center justify-between p-3 rounded-2xl mb-4 font-black text-xs uppercase tracking-widest ${colorClass} sticky top-0 z-10 backdrop-blur-md`}>
    <div className="flex items-center gap-2">{icon} {title}</div>
    <span className="px-2 py-1 bg-white/20 rounded-lg">{count}</span>
  </div>
);

function DroppableColumn({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className={className}>{children}</div>;
}

interface TaskBoardProps {
  tasks: Task[];
  user: User | null;
  currentAssigneeId: string | null;
  isDark: boolean;
  now: number;
  aiLoading: boolean;
}

function TaskBoard({ 
  tasks, user, currentAssigneeId, isDark, now, aiLoading 
}: TaskBoardProps) {
  const nowDate = new Date(now);
  const {
    toggleTaskStatus,
    handleDeleteTask,
    handlePriorityChange,
    handleUpdateDeadline,
    handleRenameTask,
    handleSubTaskAction,
    handleUpdateTask,
    handleAiSubtasks
  } = useTaskActionContext();

  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const { playSound } = useAudio();

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetId = over.id as string;

    let targetStatus = '';
    if (targetId === 'todo-column') targetStatus = 'todo';
    else if (targetId === 'in-progress-column') targetStatus = 'in-progress';
    else if (targetId === 'done-column') targetStatus = 'done';
    else {
      const overTask = tasks.find(t => t.id === targetId);
      if (overTask) {
        if (overTask.status === 'completed') targetStatus = 'done';
        else if (overTask.status === 'running') targetStatus = 'in-progress';
        else targetStatus = 'todo';
      }
    }

    if (!targetStatus) return;

    const activeTask = tasks.find(t => t.id === taskId);
    if (!activeTask) return;

    if (targetStatus === 'todo' && activeTask.status !== 'idle' && activeTask.status !== 'paused') {
      toggleTaskStatus(taskId, 'pause');
    } else if (targetStatus === 'in-progress' && activeTask.status !== 'running') {
      toggleTaskStatus(taskId, 'start');
    } else if (targetStatus === 'done' && activeTask.status !== 'completed') {
      toggleTaskStatus(taskId, 'complete');
    }
  };

  const filterOptions: Array<{ id: 'week' | 'month' | 'all'; label: string; icon: React.ReactElement }> = [
    { id: 'week', label: 'Tuần này', icon: <Calendar size={14} /> },
    { id: 'month', label: 'Tháng này', icon: <Layers size={14} /> },
    { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={14} /> }
  ];

  const handleTimeFilterChange = (filterId: 'week' | 'month' | 'all') => {
    playSound('click');
    setTimeFilter(filterId);
  };

  const filteredByTime = tasks.filter(t => {
    if (timeFilter === 'all') return true;
    const taskDate = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
    if (timeFilter === 'week') return isSameWeek(taskDate, nowDate, { weekStartsOn: 1 });
    if (timeFilter === 'month') return isSameMonth(taskDate, nowDate);
    return true;
  });

  const sortedTasks = [...filteredByTime].sort((a,b) => b.createdAt - a.createdAt);

  const isOverdue = (t: Task) => {
    if (!t.deadline) return false;
    if (t.status === 'completed_late') return true;
    return t.deadline < now && t.status !== 'completed';
  };
  const overdueTasks = sortedTasks.filter(t => isOverdue(t));
  
  const todoTasks = sortedTasks.filter(t => (t.status === 'idle' || t.status === 'paused') && !isOverdue(t));
  const inProgressTasks = sortedTasks.filter(t => t.status === 'running' && !isOverdue(t));
  const doneTasks = sortedTasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 mb-6 gap-4">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" /> TIẾN ĐỘ TEAM
        </h3>

        {/* Time Filter Switcher */}
        <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/50'} gap-1`}>
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => handleTimeFilterChange(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                ${timeFilter === f.id 
                  ? (isDark ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-indigo-600 shadow-sm') 
                  : 'text-slate-500 hover:text-slate-400'}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
        
      </div>

      {/* KANBAN BOARD LAYOUT - Notion-like Horizontal Scroll on Mobile */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-row overflow-x-auto snap-x snap-mandatory flex-nowrap lg:flex-nowrap gap-4 pb-8 items-start w-full no-scrollbar">
           
           {/* CỘT CẦN LÀM */}
           <DroppableColumn id="todo-column" className={`shrink-0 w-[85vw] lg:w-auto lg:flex-1 p-3 rounded-3xl md:rounded-[2rem] min-h-[500px] transition-all snap-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-slate-100/50 border border-slate-200/50'}`}>
              <ColumnHeader title="Pending / 待办" count={todoTasks.length} icon={<Circle size={16}/>} colorClass={isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-500 shadow-sm"} />
              <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4 min-h-[100px]">
                  <AnimatePresence initial={false}>
                    {todoTasks.map(task => (
                      <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                      </Motion.div>
                    ))}
                  </AnimatePresence>
                  {todoTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed rounded-2xl md:rounded-3xl dark:border-slate-700">Trống</div>}
                </div>
              </SortableContext>
           </DroppableColumn>

           {/* CỘT ĐANG LÀM */}
           <DroppableColumn id="in-progress-column" className={`shrink-0 w-[85vw] lg:w-auto lg:flex-1 p-3 rounded-3xl md:rounded-[2rem] min-h-[500px] transition-all shadow-xl snap-center ${isDark ? 'bg-indigo-900/10 border border-indigo-500/20 shadow-indigo-500/5' : 'bg-indigo-50/50 border border-indigo-100 shadow-indigo-500/5'}`}>
              <ColumnHeader title="In Progress / 进行中" count={inProgressTasks.length} icon={<Clock size={16} className="animate-spin-slow"/>} colorClass="bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" />
              <SortableContext items={inProgressTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4 min-h-[100px]">
                  <AnimatePresence initial={false}>
                    {inProgressTasks.map(task => (
                      <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                      </Motion.div>
                    ))}
                  </AnimatePresence>
                  {inProgressTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-indigo-400/50 uppercase tracking-widest border-2 border-dashed border-indigo-400/30 rounded-2xl md:rounded-3xl">Chưa ai nhận việc</div>}
                </div>
              </SortableContext>
           </DroppableColumn>

           {/* CỘT ĐÃ XONG */}
           <DroppableColumn id="done-column" className={`shrink-0 w-[85vw] lg:w-auto lg:flex-1 p-3 rounded-3xl md:rounded-[2rem] min-h-[500px] transition-all opacity-80 hover:opacity-100 snap-center ${isDark ? 'bg-emerald-900/10 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-100'}`}>
              <ColumnHeader title="Finished / 已完成" count={doneTasks.length} icon={<CheckCircle2 size={16}/>} colorClass="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" />
              <SortableContext items={doneTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-4 min-h-[100px] relative">
                  <AnimatePresence initial={false}>
                    {doneTasks.map(task => (
                      <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                      </Motion.div>
                    ))}
                  </AnimatePresence>
                  {doneTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-emerald-400/50 uppercase tracking-widest border-2 border-dashed border-emerald-400/30 rounded-2xl md:rounded-3xl">Chưa có gì</div>}
                </div>
              </SortableContext>
           </DroppableColumn>

           {/* CỘT TRỄ HẠN / HỦY (Không có SortableContext) */}
           <div className={`shrink-0 w-[85vw] lg:w-auto lg:flex-1 p-3 rounded-3xl md:rounded-[2rem] min-h-[500px] transition-all snap-center ${isDark ? 'bg-red-900/10 border border-red-500/20' : 'bg-red-50/50 border border-red-100'}`}>
              <ColumnHeader title="Overdue / Xong muộn" count={overdueTasks.length} icon={<AlertTriangle size={16}/>} colorClass="bg-red-500 text-white shadow-lg shadow-red-500/20" />
              <div className="flex flex-col gap-4 relative">
                <AnimatePresence initial={false}>
                  {overdueTasks.map(task => (
                    <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                    </Motion.div>
                  ))}
                </AnimatePresence>
                {overdueTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-red-400/50 uppercase tracking-widest border-2 border-dashed border-red-400/30 rounded-2xl md:rounded-3xl">Tuyệt vời!</div>}
              </div>
           </div>

        </div>
      </DndContext>
    </div>
  );
}

export default React.memo(TaskBoard);
