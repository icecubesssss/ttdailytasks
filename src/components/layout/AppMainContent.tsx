import React, { lazy, Suspense, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import TaskForm from '../tasks/TaskForm';
import TaskBoard from '../tasks/TaskBoard';
import QuickNote from '../quicknote/QuickNote';
import type { Task, UserData, TeamMember, LevelInfo, AppUser as User } from '../../utils/helpers';

const CalendarView = lazy(() => import('../calendar/CalendarView'));
const Dashboard = lazy(() => import('./Dashboard'));
const HabitsView = lazy(() => import('../habits/HabitsView'));

interface CalendarViewProps {
  isDark: boolean;
  calendarApiKey: string;
  calendarIdTit: string;
  calendarIdTun: string;
  appsScriptUrl: string;
  tasks: Task[];
  teamMembers: TeamMember[];
  currentAssigneeId: string | null;
  now: number;
  aiLoading: boolean;
  userData: UserData;
  onUpdateSettings: (updates: Partial<UserData>) => void;
}

const CalendarViewTyped = CalendarView as React.ComponentType<CalendarViewProps>;

type DailyQuest = Record<string, any>;
type AIReport = string;

interface AppMainContentProps {
  activeTab: string;
  user: User | null;
  userData: UserData;
  teamMembers: TeamMember[];
  tasks: Task[];
  filteredTasks: Task[];
  aiLoading: boolean;
  currentAssigneeId: string | null;
  now: number;
  calendarApiKey: string;
  calendarIdTit: string;
  calendarIdTun: string;
  appsScriptUrl: string;
  handleUpdateSettings: (updates: Partial<UserData>) => void;
  levelInfo: LevelInfo;
  handleBuyItem: (itemId: string) => void;
  handleUseTicket: (ticketId: string) => void;
  handleSummarize: () => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  triggerSystemFocus: (shortcutName: string) => void;
  handleTabChange: (tab: string) => void;
  dailyQuest: DailyQuest | null;
  handleRefreshDailyQuest: () => void;
  handleRenameMascot: () => void;
  handleChangeMascotAvatar: () => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  onCompleteDailyQuest: () => void;
  toggleTaskStatus: (id: string, action: 'start' | 'pause' | 'complete') => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): LazyErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Lazy chunk render failed:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-black">
          Không thể tải module giao diện. Vui lòng tải lại trang.
        </div>
      );
    }
    return this.props.children;
  }
}

function AppMainContent({
  activeTab,
  user,
  userData,
  teamMembers,
  tasks,
  filteredTasks,
  aiLoading,
  currentAssigneeId,
  now,
  calendarApiKey,
  calendarIdTit,
  calendarIdTun,
  appsScriptUrl,
  handleUpdateSettings,
  levelInfo,
  handleBuyItem,
  handleUseTicket,
  handleSummarize,
  isSummarizing,
  aiReport,
  triggerSystemFocus,
  handleTabChange,
  dailyQuest,
  handleRefreshDailyQuest,
  handleRenameMascot,
  handleChangeMascotAvatar,
  partnerTask,
  myRunningTask,
  onCompleteDailyQuest,
}: AppMainContentProps): React.ReactElement {
  // TaskForm collapse — closed by default, open on demand
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormOpen = useCallback(() => setIsFormOpen(true), []);
  const handleFormClose = useCallback(() => setIsFormOpen(false), []);

  const isDark = userData.isDarkMode;
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = toggleBtnRef.current;
    if (!el) return;
    el.setAttribute('aria-expanded', isFormOpen ? 'true' : 'false');
    if (isFormOpen) {
      el.setAttribute('aria-controls', 'task-form-panel');
    } else {
      el.removeAttribute('aria-controls');
    }
  }, [isFormOpen]);

  return (
    <AnimatePresence mode="wait">
      {activeTab === 'note' ? (
        <div key="note">
          <QuickNote userData={userData} onUpdateSettings={handleUpdateSettings} />
        </div>
      ) : activeTab === 'habits' ? (
        <div key="habits">
          <LazyErrorBoundary>
            <Suspense
              fallback={
                <div className="p-6 text-xs font-black text-slate-400">Đang dò la quái vật…</div>
              }
            >
              <HabitsView
                user={user}
                userData={userData}
                isDark={isDark}
                currentAssigneeId={currentAssigneeId}
              />
            </Suspense>
          </LazyErrorBoundary>
        </div>
      ) : activeTab === 'tasks' || activeTab === 'calendar' ? (
        <div key="main-tasks">

          {/* ── Collapsible Task Form ───────────────────────── */}
          <div className="mb-6">
            {/* Toggle button — always visible */}
            <button
              id="btn-toggle-task-form"
              ref={toggleBtnRef}
              onClick={() => setIsFormOpen((v) => !v)}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all duration-300 active:scale-95 ${
                isFormOpen
                  ? isDark
                    ? 'bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/50'
              }`}
            >
              {isFormOpen ? (
                <>
                  <X size={16} className="transition-transform group-hover:rotate-90 duration-200" />
                  Đóng form
                </>
              ) : (
                <>
                  <Plus size={16} className="transition-transform group-hover:rotate-90 duration-200" />
                  Tạo task mới
                </>
              )}
            </button>

            {/* Animated form panel */}
            <AnimatePresence>
              {isFormOpen && (
                <Motion.div
                  id="task-form-panel"
                  key="task-form"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <TaskForm
                    user={user}
                    isDark={isDark}
                    teamMembers={teamMembers}
                    onAfterSubmit={handleFormClose}
                  />
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Task Board ──────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={filteredTasks}
              user={user}
              currentAssigneeId={currentAssigneeId}
              isDark={isDark}
              now={now}
              aiLoading={aiLoading}
            />
          )}

          {/* ── Calendar ────────────────────────────────────── */}
          {activeTab === 'calendar' && (
            <LazyErrorBoundary>
              <Suspense
                fallback={
                  <div className="p-6 text-xs font-black text-slate-400">Đang tải Calendar...</div>
                }
              >
                <CalendarViewTyped
                  isDark={isDark}
                  calendarApiKey={calendarApiKey}
                  calendarIdTit={calendarIdTit}
                  calendarIdTun={calendarIdTun}
                  appsScriptUrl={appsScriptUrl}
                  tasks={tasks}
                  teamMembers={teamMembers}
                  currentAssigneeId={currentAssigneeId}
                  now={now}
                  aiLoading={aiLoading}
                  userData={userData}
                  onUpdateSettings={handleUpdateSettings}
                />
              </Suspense>
            </LazyErrorBoundary>
          )}
        </div>
      ) : (
        <div key={activeTab}>
          <LazyErrorBoundary>
            <Suspense
              fallback={
                <div className="p-6 text-xs font-black text-slate-400">Đang tải dashboard...</div>
              }
            >
              <Dashboard
                view={activeTab}
                tasks={tasks}
                isDark={isDark}
                teamMembers={teamMembers}
                userData={userData}
                levelInfo={levelInfo}
                onBuyItem={handleBuyItem}
                onUseTicket={handleUseTicket}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
                aiReport={aiReport}
                onUpdateSettings={handleUpdateSettings}
                triggerSystemFocus={triggerSystemFocus}
                onTabChange={handleTabChange}
                dailyQuest={dailyQuest}
                onRefreshDailyQuest={handleRefreshDailyQuest}
                onCompleteDailyQuest={onCompleteDailyQuest}
                currentTab={activeTab}
                onRenameMascot={handleRenameMascot}
                onChangeMascotAvatar={handleChangeMascotAvatar}
                partnerTask={partnerTask}
                myRunningTask={myRunningTask}
                now={now}
              />
            </Suspense>
          </LazyErrorBoundary>
        </div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(AppMainContent);
