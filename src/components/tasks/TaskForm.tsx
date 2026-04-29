import React, { useState, useRef, memo } from 'react';
import { Plus, Timer, Calendar as CalendarIcon, Users, Tag, Clock, X, Circle, Loader2, ChevronDown } from 'lucide-react';
import { db, appId } from '../../firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { TeamMember, Task, SubTask } from '../../utils/helpers';
import type { User } from 'firebase/auth';

interface TaskFormProps {
  user: User | null;
  isDark: boolean;
  teamMembers?: TeamMember[];
  onLocalAdd?: (task: Task) => void;
}

const TaskForm = ({ user, isDark, teamMembers = [], onLocalAdd }: TaskFormProps): React.ReactElement => {
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [timerType, setTimerType] = useState<NonNullable<Task['type']>>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [assigneeId, setAssigneeId] = useState(user?.uid || '');
  const [deadline, setDeadline] = useState('');
  
  // Ref-based inputs for better Vietnamese IME support
  const titleRef = useRef<HTMLInputElement | null>(null);
  const subTaskRef = useRef<HTMLInputElement | null>(null);
  const [tempSubTasks, setTempSubTasks] = useState<SubTask[]>([]);
  const [formKey, setFormKey] = useState(0); // For resetting uncontrolled inputs
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTempSubTask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent): void => {
    e.preventDefault();
    const val = subTaskRef.current?.value?.trim();
    if (!val) return;
    setTempSubTasks([...tempSubTasks, { id: crypto.randomUUID(), title: val, isDone: false }]);
    if (subTaskRef.current) subTaskRef.current.value = '';
  };

  const removeTempSubTask = (id: string): void => {
    setTempSubTasks(tempSubTasks.filter(s => s.id !== id));
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;

    const currentTitle = titleRef.current?.value?.trim();
    if (!currentTitle) return;

    setIsSubmitting(true);

    const finalAssigneeId = assigneeId || user?.uid;
    const assignee = teamMembers.find(m => m.uid === finalAssigneeId);
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: currentTitle,
      createdBy: user?.uid || "local-user",
      assigneeId: finalAssigneeId || null,
      assigneeName: assignee?.displayName || null,
      assigneePhoto: assignee?.photoURL || null,
      deadline: deadline ? (() => {
        const d = new Date(deadline);
        if (!deadline.includes('T')) d.setHours(23, 0, 0, 0);
        return d.getTime();
      })() : (() => {
        const d = new Date();
        d.setHours(23, 0, 0, 0);
        return d.getTime();
      })(),
      priority: priority,
      status: 'idle',
      type: timerType,
      limitTime: timerType === 'countdown' ? countdownMinutes * 60 * 1000 : null,
      totalTrackedTime: 0,
      subTasks: tempSubTasks.map(st => ({...st, isDone: !!st.isDone})),
      createdAt: Date.now()
    };

    // Robust Sanitization: Firestore DOES NOT accept 'undefined', and we omit 'id' to let Firestore manage it
    const cleanTask = Object.entries(newTask).reduce<Record<string, unknown>>((acc, [key, val]) => {
      if (key !== 'id') {
        acc[key] = val === undefined ? null : val;
      }
      return acc;
    }, {});
    
    console.log("Submitting Task to Firebase (without local ID):", cleanTask);
    
    if (user && user.uid !== "local-user-test") {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), cleanTask);
          setFormKey(prev => prev + 1); // Reset uncontrolled inputs
          setAssigneeId(user?.uid || '');
          setDeadline('');
          setTempSubTasks([]);
        } catch(err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Add task error:", err);
          alert("Lỗi thêm công việc: " + message);
        }
    } else if (onLocalAdd) {
        onLocalAdd(newTask);
        setFormKey(prev => prev + 1);
        setTempSubTasks([]);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`p-1 md:p-2 rounded-3xl md:rounded-[2rem] mb-6 md:mb-10 transition-all ${isDark ? 'bg-slate-800/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-indigo-950/20' : 'bg-white/92 backdrop-blur-xl border border-slate-200/80 shadow-[0_24px_80px_-32px_rgba(148,163,184,0.45)]'}`}>
       <form onSubmit={handleAddTask} className="flex flex-col">
          
          <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2" key={`form-${formKey}`}>
             <Plus className="text-indigo-500 flex-shrink-0 w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
             <input 
               type="text" 
               ref={titleRef}
               placeholder="Khởi tạo việc mới cho Tít & Tún..."
               spellCheck="false"
               autoComplete="off"
               className={`w-full bg-transparent text-base md:text-xl font-medium outline-none transition-all ${isDark ? 'text-white' : 'text-slate-800'}`}
             />
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="ml-2 md:ml-4 bg-indigo-600 text-white px-3 md:px-6 py-1.5 md:py-2.5 text-[10px] md:text-sm rounded-full font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex-shrink-0 flex items-center gap-2"
             >
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
               {isSubmitting ? 'ĐANG LƯU...' : 'TẠO LỆNH'}
             </button>
          </div>

          {/* Subtasks addition area */}
          <div className="px-3 md:px-6 pb-2">
             <div className="flex flex-col gap-2">
                {tempSubTasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2">
                    <Circle size={10} className="text-slate-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{sub.title}</span>
                    <button 
                      type="button" 
                      onClick={() => removeTempSubTask(sub.id)} 
                      className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"
                      aria-label="Xóa việc nhỏ"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 mt-1" key={`subtask-${formKey}`}>
                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isDark ? 'border-slate-600 text-slate-500 opacity-60' : 'border-slate-300 text-slate-400 opacity-70'}`}>
                      <Plus size={10} />
                   </div>
                   <input 
                     type="text" 
                     ref={subTaskRef}
                     onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTempSubTask(e); } }}
                     placeholder="Ghi chú thêm các việc nhỏ (Enter để thêm)..."
                     spellCheck="false"
                     autoComplete="off"
                     className={`text-xs font-semibold bg-transparent outline-none flex-1 py-1 border-b border-transparent focus:border-indigo-500/30 transition-all ${isDark ? 'text-slate-200' : 'text-slate-500'}`}
                   />
                </div>
             </div>
          </div>

          <div className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 border-t mt-1 ${isDark ? 'border-slate-700/50' : 'border-slate-200/80'}`}>
             
             {/* Người phụ trách (Chỉ Tit / Tun) */}
             <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${assigneeId ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600') : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-indigo-50/70 text-slate-600 hover:bg-indigo-50')}`}>
                <Users size={14} className="flex-shrink-0"/>
                <select 
                  value={assigneeId} 
                  onChange={(e) => setAssigneeId(e.target.value)} 
                  className="task-form-select bg-transparent outline-none cursor-pointer appearance-none pr-5 min-w-[72px]"
                  aria-label="Chọn người phụ trách"
                >
                    <option value="">Ai nhận?</option>
                    {teamMembers.map(member => (
                      <option key={member.uid} value={member.uid}>{member.displayName || member.email}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none opacity-75" />
             </div>

             {/* Độ ưu tiên */}
             <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${priority === 'high' ? 'bg-red-500/10 text-red-500' : priority === 'medium' ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500') : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500')}`}>
                <Tag size={14} className="flex-shrink-0"/>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NonNullable<Task['priority']>)}
                  className="task-form-select bg-transparent outline-none cursor-pointer uppercase appearance-none pr-5 min-w-[68px]"
                  aria-label="Chọn độ ưu tiên"
                >
                  <option value="high">GẤP</option>
                  <option value="medium">Vừa</option>
                  <option value="low">Rảnh</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none opacity-75" />
             </div>

             {/* Deadline */}
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${deadline ? 'bg-pink-500/10 text-pink-500' : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}>
                <CalendarIcon size={14} className="flex-shrink-0"/>
                <input 
                  type="datetime-local" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  className={`task-form-datetime bg-transparent outline-none cursor-pointer max-w-[150px] ${isDark ? 'scheme-dark' : 'scheme-light'}`}
                  aria-label="Chọn thời hạn"
                />
             </div>

             {/* Chế độ Time */}
             <div className="flex items-center gap-1 ml-auto">
                <button type="button" onClick={() => setTimerType(timerType === 'stopwatch' ? 'countdown' : 'stopwatch')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-all ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                   {timerType === 'countdown' ? <><Timer size={14}/> Đếm ngược</> : <><Clock size={14}/> Đếm lên</>}
                </button>
                {timerType === 'countdown' && (
                  <input 
                    type="number" 
                    value={countdownMinutes} 
                    onChange={(e) => setCountdownMinutes(Number(e.target.value) || 0)} 
                    className={`w-14 text-center text-xs font-bold px-2 py-1.5 rounded-full outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`} 
                    aria-label="Số phút đếm ngược"
                    placeholder="25"
                  />
                )}
             </div>

          </div>
       </form>
    </div>
  );
};

export default memo(TaskForm);
