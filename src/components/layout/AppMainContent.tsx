import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import TaskForm from '../tasks/TaskForm';
import TaskBoard from '../tasks/TaskBoard.jsx';
import TaskListView from '../tasks/TaskListView.jsx';
import type { Task, UserData, TeamMember, LevelInfo } from '../../utils/helpers';
import type { User } from 'firebase/auth';

const CalendarView = lazy(() => import('../calendar/CalendarView'));
const Dashboard = lazy(() => import('./Dashboard'));

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
  handleRenameMascot: (name: string) => void;
  handleChangeMascotAvatar: (config: Record<string, any>) => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  onCompleteDailyQuest: () => void;
  toggleTaskStatus: (id: string, action: 'start' | 'pause' | 'complete') => Promise<void>;
  handleDeleteTask: (id: string) => void;
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
  toggleTaskStatus,
  handleDeleteTask
}: AppMainContentProps): React.ReactElement {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'tasks' || activeTab === 'calendar' || activeTab === 'list' ? (
        <div key="main-tasks">
          <div className="animate-in slide-in-from-bottom-8">
            <TaskForm user={user} isDark={userData.isDarkMode} teamMembers={teamMembers} />
          </div>

          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={filteredTasks}
              user={user}
              currentAssigneeId={currentAssigneeId}
              isDark={userData.isDarkMode}
              now={now}
              aiLoading={aiLoading}
            />
          )}

          {activeTab === 'calendar' && (
            <LazyErrorBoundary>
              <Suspense
                fallback={
                  <div className="p-6 text-xs font-black text-slate-400">Đang tải Calendar...</div>
                }
              >
                <CalendarViewTyped
                  isDark={userData.isDarkMode}
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

          {activeTab === 'list' && (
            <TaskListView
              tasks={filteredTasks}
              user={user}
              currentAssigneeId={currentAssigneeId}
              isDark={userData.isDarkMode}
              now={now}
              onStart={(id: string) => toggleTaskStatus(id, 'start')}
              onPause={(id: string) => toggleTaskStatus(id, 'pause')}
              onComplete={(id: string) => toggleTaskStatus(id, 'complete')}
              onDelete={handleDeleteTask}
            />
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
                isDark={userData.isDarkMode}
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
