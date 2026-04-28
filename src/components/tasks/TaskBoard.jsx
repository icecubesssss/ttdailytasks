import React, { useState } from 'react';
import { Activity, Circle, Clock, CheckCircle2, AlertTriangle, Calendar, LayoutGrid, Layers } from 'lucide-react';
import { isSameWeek, isSameMonth } from 'date-fns';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';
import { useAudio } from '../../hooks/useAudio';
import { useTaskActionContext } from '../../contexts/TaskActionContext';

const ColumnHeader = ({ title, count, icon, colorClass }) => (
  <div className={`flex items-center justify-between p-3 rounded-2xl mb-4 font-black text-xs uppercase tracking-widest ${colorClass}`}>
    <div className="flex items-center gap-2">{icon} {title}</div>
    <span className="px-2 py-1 bg-white/20 rounded-lg">{count}</span>
  </div>
);

function TaskBoard({ 
  tasks, user, currentAssigneeId, isDark, now, aiLoading 
}) {
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

  const [activeTab, setActiveTab] = useState('todo'); // 'todo', 'in-progress', 'done'
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'all'
  const { playSound } = useAudio();

  const handleTimeFilterChange = (filterId) => {
    playSound('click');
    setTimeFilter(filterId);
  };

  const handleActiveTabChange = (tabId) => {
    playSound('click');
    setActiveTab(tabId);
  };

  const filteredByTime = tasks.filter(t => {
    if (timeFilter === 'all') return true;
    const taskDate = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
    if (timeFilter === 'week') return isSameWeek(taskDate, now, { weekStartsOn: 1 });
    if (timeFilter === 'month') return isSameMonth(taskDate, now);
    return true;
  });

  const sortedTasks = [...filteredByTime].sort((a,b) => b.createdAt - a.createdAt);

  const isOverdue = (t) => {
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
          {[
            { id: 'week', label: 'Tuần này', icon: <Calendar size={14} /> },
            { id: 'month', label: 'Tháng này', icon: <Layers size={14} /> },
            { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={14} /> }
          ].map(f => (
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

      {/* MOBILE COLUMN TABS */}
      <div className="flex lg:hidden gap-2 mb-4 px-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => handleActiveTabChange('todo')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'todo' ? (isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm') : 'text-slate-500 border-transparent'}`}
          >
            Sắp làm ({todoTasks.length})
          </button>
          <button 
            onClick={() => handleActiveTabChange('in-progress')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'in-progress' ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Đang làm ({inProgressTasks.length})
          </button>
          <button 
            onClick={() => handleActiveTabChange('done')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'done' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Đã xong ({doneTasks.length})
          </button>
          <button 
            onClick={() => handleActiveTabChange('overdue')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'overdue' ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Trễ / Muộn ({overdueTasks.length})
          </button>
      </div>

      {/* KANBAN BOARD LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start w-full">
         
         {/* CỘT CẦN LÀM */}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all ${activeTab === 'todo' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-slate-100/50 border border-slate-200/50'}`}>
            <ColumnHeader title="Pending / 待办" count={todoTasks.length} icon={<Circle size={16}/>} colorClass={isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-500 shadow-sm"} />
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {todoTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={now} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {todoTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed rounded-2xl md:rounded-3xl dark:border-slate-700">Trống</div>}
            </div>
         </div>

         {/* CỘT ĐANG LÀM */}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all shadow-xl ${activeTab === 'in-progress' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-indigo-900/10 border border-indigo-500/20 shadow-indigo-500/5' : 'bg-indigo-50/50 border border-indigo-100 shadow-indigo-500/5'}`}>
            <ColumnHeader title="In Progress / 进行中" count={inProgressTasks.length} icon={<Clock size={16} className="animate-spin-slow"/>} colorClass="bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" />
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {inProgressTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={now} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {inProgressTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-indigo-400/50 uppercase tracking-widest border-2 border-dashed border-indigo-400/30 rounded-2xl md:rounded-3xl">Chưa ai nhận việc</div>}
            </div>
         </div>

         {/* CỘT ĐÃ XONG */}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all opacity-80 hover:opacity-100 ${activeTab === 'done' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-emerald-900/10 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-100'}`}>
            <ColumnHeader title="Finished / 已完成" count={doneTasks.length} icon={<CheckCircle2 size={16}/>} colorClass="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" />
            <div className="flex flex-col gap-4 relative">
              <AnimatePresence initial={false}>
                {doneTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={now} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {doneTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-emerald-400/50 uppercase tracking-widest border-2 border-dashed border-emerald-400/30 rounded-2xl md:rounded-3xl">Chưa có gì</div>}
            </div>
         </div>

         {/* CỘT TRỄ HẠN / HỦY */}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all ${activeTab === 'overdue' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-red-900/10 border border-red-500/20' : 'bg-red-50/50 border border-red-100'}`}>
            <ColumnHeader title="Overdue / Xong muộn" count={overdueTasks.length} icon={<AlertTriangle size={16}/>} colorClass="bg-red-500 text-white shadow-lg shadow-red-500/20" />
            <div className="flex flex-col gap-4 relative">
              <AnimatePresence initial={false}>
                {overdueTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={now} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {overdueTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-red-400/50 uppercase tracking-widest border-2 border-dashed border-red-400/30 rounded-2xl md:rounded-3xl">Tuyệt vời!</div>}
            </div>
         </div>

      </div>
    </div>
  );
}

export default React.memo(TaskBoard);
