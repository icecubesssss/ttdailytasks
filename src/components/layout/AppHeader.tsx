import React from 'react';
import {
  Moon,
  Sun,
  Layout,
  ShoppingBag,
  Sparkles,
  LayoutDashboard,
  ListTree,
  Calendar as CalendarIcon,
  ChevronDown,
  CheckCircle2,
  Snowflake
} from 'lucide-react';
import StreakCalendar from '../stats/StreakCalendar.jsx';
import { getAssigneeIdByEmail, getAvatarUrl } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';
import type { UserData, TeamMember } from '../../utils/helpers';
import type { User } from 'firebase/auth';

type HeaderMember = Pick<
  TeamMember,
  'uid' | 'email' | 'displayName' | 'avatarConfig' | 'ownedItemIds' | 'activeBooster'
>;

interface AppHeaderProps {
  user: User | null;
  userData: UserData;
  teamMembers: TeamMember[];
  activeTab: string;
  filterMode: string;
  onFilterModeChange: (mode: string) => void;
  onTabChange: (tab: string) => void;
  onOpenCloset: () => void;
  onToggleDarkMode: () => void;
  playSound: (soundName: string) => void;
}

function AppHeader({
  user,
  userData,
  teamMembers,
  activeTab,
  filterMode,
  onFilterModeChange,
  onTabChange,
  onOpenCloset,
  onToggleDarkMode,
  playSound
}: AppHeaderProps): React.ReactElement {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState<boolean>(false);

  return (
    <div className="flex flex-col gap-6 mb-8 mt-2 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="premium-logo select-none cursor-default whitespace-nowrap">TIT & TUN TASKS</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <div
            className={`flex items-center p-1 rounded-xl border transition-all duration-300 ${
              userData.isDarkMode
                ? 'bg-slate-900/40 border-slate-700/50 backdrop-blur-md'
                : 'bg-white/40 border-slate-200 shadow-sm backdrop-blur-md'
            }`}
          >
            <button
              onClick={() => onFilterModeChange('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
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
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                  filterMode === member.uid
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-indigo-500'
                }`}
              >
                {member.displayName?.split(' ')[0] || member.email?.split('@')[0]}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-300/30 dark:bg-slate-700/30 hidden sm:block"></div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('stats')}
              className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                  : userData.isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => onTabChange('shop')}
              className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeTab === 'shop'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                  : userData.isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}
            >
              <ShoppingBag size={16} />
            </button>

            <div className="relative ml-1">
              <button
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
                  userData.isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                } ${isViewDropdownOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {activeTab === 'tasks' ? (
                  <Layout size={16} />
                ) : activeTab === 'calendar' ? (
                  <CalendarIcon size={16} />
                ) : (
                  <ListTree size={16} />
                )}
                <ChevronDown
                  size={12}
                  className={`opacity-50 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isViewDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsViewDropdownOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-40 p-1.5 rounded-xl border shadow-2xl z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                    {['tasks', 'calendar', 'list'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          onTabChange(tab);
                          setIsViewDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          activeTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {tab === 'tasks' ? 'Board' : tab}
                        {activeTab === tab && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-[1.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-lg">
        <div className="flex items-center gap-3">
          <StreakCalendar userData={userData} isDark={userData.isDarkMode} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 font-black text-xs rounded-full">
            <Sparkles size={14} className="animate-pulse" /> {userData.ttGold} GOLD
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-xs rounded-full">
            <Snowflake size={14} className="animate-pulse" /> {userData.streakFreezes || 0}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-3">
            {[
              user
                ? {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: userData.displayName || user.displayName || 'Bạn',
                    avatarConfig: userData.avatarConfig,
                    ownedItemIds: userData.ownedItemIds || [],
                    activeBooster: userData.activeBooster
                  }
                : null,
              ...teamMembers.filter((m) => m.uid !== user?.uid)
            ].filter((member): member is HeaderMember => Boolean(member))
              .map((member) => (
                <button
                  key={member.uid}
                  onClick={() => member.uid === user?.uid && onOpenCloset()}
                  className={`avatar-edit-btn ${member.uid === user?.uid ? 'z-10' : ''}`}
                >
                  <div
                    className={`relative ${member.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}
                  >
                    <img
                      src={getAvatarUrl(
                        member.avatarConfig ||
                          DEFAULT_AVATARS[getAssigneeIdByEmail(member.email || '') || ''] ||
                          {}
                      )}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${
                        userData.isDarkMode ? 'border-slate-800' : 'border-white'
                      } shadow-md ${member.uid === user?.uid ? 'ring-2 ring-indigo-500/30' : ''}`}
                      alt={member.displayName}
                    />
                    {Boolean(member.activeBooster) && (
                      <div className="absolute top-0 right-0 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
          </div>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700/50"></div>
          <button
            onClick={() => {
              playSound('click');
              onToggleDarkMode();
            }}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:scale-110 transition-all border border-white/20 dark:border-white/5"
          >
            {userData.isDarkMode ? (
              <Sun size={16} className="text-yellow-400" />
            ) : (
              <Moon size={16} className="text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AppHeader);
