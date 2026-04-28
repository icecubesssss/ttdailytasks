import React from 'react';
import { getAssigneeIdByEmail } from './utils/helpers';
import { useTTApp } from './hooks/useTTApp';

// Components
import LoginScreen from './components/auth/LoginScreen';
import SplashScreen from './components/auth/SplashScreen';
import AppHeader from './components/layout/AppHeader';
import AppMainContent from './components/layout/AppMainContent';
import AppOverlays from './components/layout/AppOverlays';
import { AppProviders } from './components/layout/AppProviders';

export default function App(): React.ReactElement {
  const app = useTTApp();

  // --- Render ---
  if (app.isLoading) return <SplashScreen />;

  if (app.authError && !app.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl max-w-sm">
          <h3 className="text-red-500 font-black mb-2">AUTH ERROR</h3>
          <p className="text-red-400 text-xs font-bold leading-relaxed">{app.authError}</p>
        </div>
      </div>
    );
  }

  if (!app.user) return <LoginScreen authError={app.authError} />;
  if (!app.userData.isLoaded) return <SplashScreen />;

  return (
    <AppProviders taskActions={app.taskActions}>
      <div className={`min-h-screen transition-all duration-700 font-outfit mesh-bg ${app.userData.isDarkMode ? 'dark text-slate-100' : 'text-slate-900'} pb-24`}>
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-16">
          <AppHeader
            user={app.user}
            userData={app.userData}
            teamMembers={app.teamMembers}
            activeTab={app.activeTab}
            filterMode={app.filterMode}
            onFilterModeChange={app.handleFilterModeChange}
            onTabChange={app.handleTabChange}
            onOpenCloset={() => app.setIsClosetOpen(true)}
            onToggleDarkMode={app.handleToggleDarkMode}
            playSound={app.playSound}
          />

          <AppMainContent
            activeTab={app.activeTab}
            user={app.user}
            userData={app.userData}
            teamMembers={app.teamMembers}
            tasks={app.tasks}
            filteredTasks={app.filteredTasks}
            aiLoading={app.taskActions.aiLoading}
            currentAssigneeId={getAssigneeIdByEmail(app.user?.email, app.teamMembers)}
            calendarApiKey={app.config.calendarApiKey}
            calendarIdTit={app.config.calendarIdTit}
            calendarIdTun={app.config.calendarIdTun}
            appsScriptUrl={app.config.appsScriptUrl}
            handleUpdateSettings={app.handleUpdateSettings}
            levelInfo={app.levelInfo}
            handleBuyItem={app.handleBuyItem}
            handleUseTicket={app.handleUseTicket}
            handleSummarize={app.aiActions.handleSummarize}
            isSummarizing={app.aiActions.isSummarizing}
            aiReport={app.aiActions.aiReport}
            triggerSystemFocus={app.triggerSystemFocus}
            handleTabChange={app.handleTabChange}
            dailyQuest={app.dailyQuest}
            handleRefreshDailyQuest={app.handleRefreshDailyQuest}
            onCompleteDailyQuest={app.handleCompleteDailyQuest}
            handleRenameMascot={app.handleRenameMascot}
            handleChangeMascotAvatar={app.handleChangeMascotAvatar}
            partnerTask={app.partnerTask}
            myRunningTask={app.myRunningTask}
            now={app.now}
            toggleTaskStatus={app.taskActions.toggleTaskStatus}
            handleDeleteTask={app.taskActions.handleDeleteTask}
          />

          <AppOverlays
            isClosetOpen={app.isClosetOpen}
            setIsClosetOpen={app.setIsClosetOpen}
            theme={app.theme}
            userData={app.userData}
            levelInfo={app.levelInfo}
            userEmail={app.user?.email || undefined}
            handleEquipItem={app.handleEquipItem}
            focusingTaskId={app.focusingTaskId || undefined}
            tasks={app.tasks}
            toggleTaskStatus={app.taskActions.toggleTaskStatus}
            onSubTaskToggle={app.taskActions.handleSubTaskAction}
            onSubTaskAdd={app.taskActions.handleSubTaskAction}
            onUpdateTask={app.taskActions.handleUpdateTask}
            triggerSystemFocus={app.triggerSystemFocus}
            partnerTask={app.partnerTask}
            partnerInfo={app.partnerInfo || undefined}
            now={app.now}
          />
        </div>
      </div>
    </AppProviders>
  );
}
