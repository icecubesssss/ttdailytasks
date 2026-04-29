import React, { useRef } from 'react';
import { CalendarDays, Cpu, ListTree, Sparkles } from 'lucide-react';
import ProductivityReport from './ProductivityReport';
import { TeamMembersList, AppPreferences, FocusAutomation } from './subcomponents/StatsComponents';
import DailyQuestWidget from './widgets/DailyQuestWidget';
import MascotAssistantWidget from './widgets/MascotAssistantWidget';
import DuoFocusWidget from './widgets/DuoFocusWidget';
import { Task, TeamMember, UserData } from '../../utils/helpers';

const DEFAULT_SHORTCUT_NAME = 'Làm việc';

interface StatsViewProps {
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  onSummarize: () => void;
  isSummarizing: boolean;
  aiReport: string | null;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcut: string) => void;
  onTabChange?: (tab: string) => void;
  dailyQuest: any;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: () => void;
  onChangeMascotAvatar: () => void;
  partnerTask?: Task | null;
  myRunningTask?: Task | null;
  now: number;
}

export default function StatsView({ 
  tasks, isDark, teamMembers, userData, onSummarize, isSummarizing, 
  aiReport, onUpdateSettings, triggerSystemFocus, onTabChange,
  dailyQuest, onRefreshDailyQuest, onCompleteDailyQuest, currentTab, onRenameMascot, onChangeMascotAvatar,
  partnerTask, myRunningTask, now
}: StatsViewProps) {
  const startShortcutRef = useRef<HTMLInputElement>(null);
  const stopShortcutRef = useRef<HTMLInputElement>(null);

  const handleBlur = (key: string, val: string) => {
    onUpdateSettings({ [key]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[minmax(140px,auto)] gap-6 animate-in fade-in duration-700 pb-24">
      <DailyQuestWidget isDark={isDark} quest={dailyQuest} onRefresh={onRefreshDailyQuest} onComplete={onCompleteDailyQuest} />

      <MascotAssistantWidget
        isDark={isDark}
        userData={userData}
        currentTab={currentTab}
        tasks={tasks}
        duoActive={!!(partnerTask && myRunningTask)}
        onRename={onRenameMascot}
        onChangeAvatar={onChangeMascotAvatar}
      />

      <DuoFocusWidget
        isDark={isDark}
        myTask={myRunningTask}
        partnerTask={partnerTask}
        myName={userData.displayName || 'Bạn'}
        partnerName={partnerTask?.currentWorkerName || 'Đồng đội'}
        now={now}
      />
      
      {/* AI Insights tile */}
      <div className={`md:col-span-6 p-8 rounded-[2.5rem] relative overflow-hidden transition-all border-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12"><Cpu size={160} /></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h4 className="font-black text-xl mb-1 flex items-center gap-2">
                <Sparkles size={24} className="text-violet-500" /> AI Productivity Insights
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phân tích hiệu suất bằng trí tuệ nhân tạo</p>
            </div>
            
            <button 
              onClick={onSummarize} 
              disabled={isSummarizing || tasks.length === 0}
              className={`px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${isSummarizing ? 'bg-violet-500/50 text-white cursor-wait' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 active:scale-[0.98]'}`}
            >
              <Cpu size={20} className={isSummarizing ? 'animate-spin' : ''} />
              {isSummarizing ? 'ĐANG PHÂN TÍCH...' : 'CHẠY AI REPORT'}
            </button>
          </div>

          {aiReport ? (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-blue-600/10 border border-violet-500/20 animate-scale-in">
              <h5 className="font-black text-sm mb-4 text-violet-400 flex items-center gap-2">
                {userData.aiMode === 'sassy' ? '🔥 CHẾ ĐỘ CÀ KHỊA' : '💖 CHẾ ĐỘ DỄ THƯƠNG'}
              </h5>
              <p className={`text-lg leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} whitespace-pre-wrap italic`}>
                "{aiReport}"
              </p>
            </div>
          ) : (
            <div className={`p-12 border-2 border-dashed rounded-3xl text-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bấm nút phía trên để AI đánh giá ngày làm việc của bạn</p>
            </div>
          )}
        </div>
      </div>

      {/* Hero tile */}
      <div className="md:col-span-6">
        <ProductivityReport tasks={tasks} userData={userData} isDark={isDark} teamMembers={teamMembers} />
      </div>

      {/* Team tile */}
      <div className="md:col-span-2">
        <div className={`h-full p-5 rounded-[2.2rem] border-2 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <h4 className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" /> Thành Viên Team
          </h4>
          <TeamMembersList teamMembers={teamMembers} userData={userData} isDark={isDark} />
        </div>
      </div>

      {/* Preferences tile */}
      <div className="md:col-span-4">
        <AppPreferences userData={userData} isDark={isDark} onUpdateSettings={onUpdateSettings} onTabChange={onTabChange} />
      </div>

      {/* Quick actions tile */}
      <div className={`md:col-span-2 p-6 rounded-[2rem] border-2 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
        <h4 className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-4">Quick Actions</h4>
        <div className="space-y-3">
          <button
            onClick={() => onTabChange?.('tasks')}
            className={`w-full rounded-xl px-4 py-3 text-left text-xs font-black flex items-center justify-between transition-all ${isDark ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 shadow-sm'}`}
          >
            Mở Task Board
            <ListTree size={14} />
          </button>
          <button
            onClick={() => onTabChange?.('calendar')}
            className={`w-full rounded-xl px-4 py-3 text-left text-xs font-black flex items-center justify-between transition-all ${isDark ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 shadow-sm'}`}
          >
            Xem Calendar
            <CalendarDays size={14} />
          </button>
        </div>
      </div>

      {/* Automation tile */}
      <div className="md:col-span-4">
        <FocusAutomation 
          userData={userData} isDark={isDark} onUpdateSettings={onUpdateSettings} 
          triggerSystemFocus={triggerSystemFocus} startShortcutRef={startShortcutRef} 
          stopShortcutRef={stopShortcutRef} handleBlur={handleBlur} 
          DEFAULT_SHORTCUT_NAME={DEFAULT_SHORTCUT_NAME} 
        />
      </div>

    </div>
  );
}
