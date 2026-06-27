import React, { useState } from 'react';
import type { AppUser as User } from '../../utils/helpers';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Sparkles, Snowflake, Search,
  PanelLeftClose, Pin, ExternalLink,
} from 'lucide-react';
import { NAV_TABS } from './navConfig';
import StreakCalendar from '../stats/StreakCalendar';
import { getAvatarUrl, getDefaultAvatar } from '../../utils/helpers';
import type { UserData, TeamMember } from '../../utils/helpers';

interface AppSidebarProps {
  user: User | null;
  userData: UserData;
  teamMembers: TeamMember[];
  activeTab: string;
  filterMode: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onTabChange: (tab: string) => void;
  onFilterModeChange: (mode: string) => void;
  onOpenCloset: () => void;
  onToggleDarkMode: () => void;
  onOpenPalette: () => void;
  playSound: (soundName: string) => void;
}

function AppSidebar({
  user,
  userData,
  teamMembers,
  activeTab,
  filterMode,
  isCollapsed,
  onToggleCollapsed,
  onTabChange,
  onFilterModeChange,
  onOpenCloset,
  onToggleDarkMode,
  onOpenPalette,
  playSound,
}: AppSidebarProps): React.ReactElement {
  const isDark = userData.isDarkMode;

  // Hover-peek kiểu Notion: rail thu gọn tự hé ra khi rê chuột, thu lại khi rời đi.
  const [isPeeking, setIsPeeking] = useState(false);
  const expanded = !isCollapsed || isPeeking;

  const members = [
    user
      ? {
          uid: user.uid,
          email: user.email || '',
          displayName: userData.displayName || user.displayName || 'Bạn',
          avatarConfig: userData.avatarConfig,
          ownedItemIds: userData.ownedItemIds || [],
          activeBooster: userData.activeBooster,
        }
      : null,
    ...teamMembers.filter((m) => m.uid !== user?.uid),
  ].filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <aside
      aria-label="Thanh bên"
      onMouseEnter={() => isCollapsed && setIsPeeking(true)}
      onMouseLeave={() => setIsPeeking(false)}
      className={`app-sidebar hidden lg:flex flex-col fixed left-4 top-4 bottom-4 z-[900] rounded-[2rem] border backdrop-blur-2xl transition-all duration-300 ${
        expanded ? 'w-64 p-4' : 'w-20 p-3'
      } ${
        isDark
          ? 'bg-slate-900/60 border-white/10 text-slate-100'
          : 'bg-white/60 border-white/50 text-slate-900 shadow-xl shadow-indigo-500/5'
      } ${isPeeking ? 'shadow-2xl shadow-indigo-500/20 bg-white/80 dark:bg-slate-900/80' : ''}`}
    >
      {/* ── Logo + nút ghim/thu gọn (vị trí cố định, không nhảy) ── */}
      <div className={`flex items-center ${expanded ? 'justify-between' : 'justify-center'} mb-4`}>
        {expanded ? (
          <span className="premium-logo !text-xl whitespace-nowrap select-none">TIT &amp; TUN</span>
        ) : (
          <span className="text-2xl select-none" title="TIT & TUN TASKS">💞</span>
        )}
        {expanded && (
          <button
            onClick={() => {
              setIsPeeking(false);
              onToggleCollapsed();
            }}
            title={isCollapsed ? 'Ghim thanh bên mở (⌘\\)' : 'Thu gọn thanh bên (⌘\\)'}
            aria-label={isCollapsed ? 'Ghim thanh bên mở' : 'Thu gọn thanh bên'}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"
          >
            {isCollapsed ? <Pin size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* ── Workspace: avatar đôi + chips ── */}
      <div
        className={`rounded-3xl border mb-4 ${
          isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white/50 border-white/60'
        } ${expanded ? 'p-3' : 'p-2 flex flex-col items-center gap-2'}`}
      >
        <div className={`flex items-center ${expanded ? '-space-x-3' : 'flex-col gap-1'}`}>
          {members.map((member) => (
            <button
              key={member.uid}
              onClick={() => member.uid === user?.uid && onOpenCloset()}
              aria-label={member.uid === user?.uid ? 'Mở tủ đồ' : member.displayName || ''}
              title={member.uid === user?.uid ? 'Mở tủ đồ' : member.displayName || ''}
              className={member.uid === user?.uid ? 'z-10' : ''}
            >
              <div className="relative">
                <img
                  src={getAvatarUrl(
                    member.avatarConfig ||
                      getDefaultAvatar(member.email) ||
                      {}
                  )}
                  className={`w-9 h-9 rounded-full border-2 shadow-md ${
                    isDark ? 'border-slate-800' : 'border-white'
                  } ${member.uid === user?.uid ? 'ring-2 ring-indigo-500/30' : ''}`}
                  alt={member.displayName || ''}
                />
                {Boolean(member.activeBooster) && (
                  <div className="absolute top-0 right-0 bg-emerald-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {expanded && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <StreakCalendar userData={userData} isDark={isDark} />
            <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 font-black text-[10px] rounded-full">
              <Sparkles size={12} /> {userData.ttGold ?? 0}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] rounded-full">
              <Snowflake size={12} /> {userData.streakFreezes || 0}
            </span>
            {!userData.isFromServer && userData.isLoaded && (
              <span className="px-2 py-1 bg-indigo-500 text-white text-[8px] font-black rounded-full animate-pulse">
                SYNC
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Filter thành viên ── */}
      {expanded && (
        <div
          className={`flex items-center p-1 rounded-2xl border mb-4 ${
            isDark ? 'bg-slate-800/40 border-white/5' : 'bg-white/50 border-white/60'
          }`}
        >
          <button
            onClick={() => onFilterModeChange('all')}
            className={`flex-1 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-indigo-500'
            }`}
          >
            Tất cả
          </button>
          {teamMembers.map((member) => (
            <button
              key={member.uid}
              onClick={() => onFilterModeChange(member.uid)}
              className={`flex-1 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterMode === member.uid
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-indigo-500'
              }`}
            >
              {member.displayName?.split(' ')[0] || member.email?.split('@')[0]}
            </button>
          ))}
        </div>
      )}

      {/* ── Nav ── */}
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded-2xl text-sm font-bold transition-colors duration-200 active:scale-95 ${
                expanded ? 'px-3.5 py-2.5' : 'justify-center p-3'
              } ${
                isActive
                  ? 'text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className={`absolute inset-0 rounded-2xl ${tab.activeColor}`}
                />
              )}
              <span className={`relative z-10 flex items-center gap-3 ${expanded ? '' : 'justify-center'}`}>
                {tab.icon}
                {expanded && <span>{tab.label}</span>}
              </span>
            </button>
          );
        })}

        {activeTab === 'calendar' && (
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Mở Google Calendar"
            className={`flex items-center gap-3 rounded-2xl text-sm font-bold transition-all ${
              expanded ? 'px-3.5 py-2.5' : 'justify-center p-3'
            } ${isDark ? 'text-slate-400 hover:text-sky-400 hover:bg-white/10' : 'text-slate-500 hover:text-sky-600 hover:bg-black/5'}`}
          >
            <ExternalLink size={18} />
            {expanded && <span>Google Calendar</span>}
          </a>
        )}
      </nav>

      {/* ── Footer ── */}
      <div className={`flex ${expanded ? 'items-center' : 'flex-col items-center'} gap-2 pt-3 mt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-200/60'}`}>
        <button
          onClick={onOpenPalette}
          title="Tìm nhanh (⌘K)"
          aria-label="Tìm nhanh"
          className={`flex items-center gap-2 rounded-2xl border text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 ${
            expanded ? 'flex-1 px-3 py-2' : 'p-2.5 justify-center'
          } ${
            isDark
              ? 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white'
              : 'bg-white/50 border-white/60 text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search size={14} />
          {expanded && (
            <>
              <span className="flex-1 text-left">Tìm nhanh…</span>
              <kbd className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">⌘K</kbd>
            </>
          )}
        </button>

        <button
          onClick={() => {
            playSound('click');
            onToggleDarkMode();
          }}
          aria-label="Chuyển chế độ sáng/tối"
          title="Chuyển chế độ sáng/tối"
          className="p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:scale-110 transition-all border border-white/20 dark:border-white/5"
        >
          {isDark ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-indigo-600" />}
        </button>
      </div>
    </aside>
  );
}

export default React.memo(AppSidebar);
