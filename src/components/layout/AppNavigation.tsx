import React from 'react';
import {
  Layout,
  CalendarDays,
  LayoutDashboard,
  ShoppingBag,
  StickyNote,
  ExternalLink,
} from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactElement;
  activeColor: string;
}

const NAV_TABS: NavTab[] = [
  {
    id: 'tasks',
    label: 'Board',
    icon: <Layout size={20} />,
    activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
  },
  {
    id: 'calendar',
    label: 'Lịch',
    icon: <CalendarDays size={20} />,
    activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
  },
  {
    id: 'stats',
    label: 'Thống kê',
    icon: <LayoutDashboard size={20} />,
    activeColor: 'bg-violet-600 text-white shadow-lg shadow-violet-500/30',
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: <ShoppingBag size={20} />,
    activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  },
  {
    id: 'note',
    label: 'Ghi chú',
    icon: <StickyNote size={20} />,
    activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  },
];

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
      className="app-dock"
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
