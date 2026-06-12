import React from 'react';
import { ExternalLink } from 'lucide-react';
import { NAV_TABS } from './navConfig';

interface AppNavigationProps {
  activeTab: string;
  isDark: boolean;
  onTabChange: (tab: string) => void;
  showCalendarLink?: boolean;
}

function AppNavigation({
  activeTab,
  isDark,
  onTabChange,
  showCalendarLink = false,
}: AppNavigationProps): React.ReactElement {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="app-dock lg:hidden"
    >
      <div
        className={`app-dock-inner ${
          isDark
            ? 'bg-slate-900/70 border-white/10'
            : 'bg-white/70 border-white/50'
        }`}
      >
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`app-dock-btn ${
                isActive
                  ? tab.activeColor
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}
            >
              <span className="app-dock-icon">{tab.icon}</span>
              <span className={`app-dock-label ${isActive ? 'opacity-100 max-h-4' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* GCal quick link — chỉ hiện khi đang ở tab calendar */}
        {showCalendarLink && (
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Mở Google Calendar"
            aria-label="Mở Google Calendar"
            className={`app-dock-btn ${
              isDark
                ? 'text-slate-400 hover:text-sky-400 hover:bg-white/10'
                : 'text-slate-500 hover:text-sky-600 hover:bg-black/5'
            }`}
          >
            <span className="app-dock-icon"><ExternalLink size={18} /></span>
            <span className="app-dock-label opacity-0 max-h-0 overflow-hidden">GCal</span>
          </a>
        )}
      </div>
    </nav>
  );
}

export default React.memo(AppNavigation);
