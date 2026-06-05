import React from 'react';
import { Moon, Sun, Sparkles, Snowflake } from 'lucide-react';
import StreakCalendar from '../stats/StreakCalendar';
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
  onUpdateSettings: (updates: Partial<UserData>) => void;
  playSound: (soundName: string) => void;
}

function AppHeader({
  user,
  userData,
  teamMembers,
  filterMode,
  onFilterModeChange,
  onOpenCloset,
  onToggleDarkMode,
  onUpdateSettings,
  playSound,
}: AppHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 mb-8 mt-2 animate-fade-in-up">
      {/* ── Branding row ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="premium-logo select-none cursor-default whitespace-nowrap">
          TIT &amp; TUN TASKS
        </h1>

        {/* Filter + Dark mode */}
        <div className="flex items-center gap-2">
          {/* Member filter pill */}
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

          {/* Dark mode toggle */}
          <button
            onClick={() => {
              playSound('click');
              onToggleDarkMode();
            }}
            aria-label="Chuyển chế độ sáng/tối"
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

      {/* ── Stats + Avatar bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-[1.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-lg">
        {/* Left: streak + gold + freeze */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <StreakCalendar userData={userData} isDark={userData.isDarkMode} />

            {!userData.isFromServer && userData.isLoaded && (
              <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm z-20">
                SYNCING
              </div>
            )}

            {userData.isFromServer && !userData.hasRestoredStreak && (
              <button
                onClick={() => {
                  const isTun =
                    user?.email?.toLowerCase().includes('tun') ||
                    user?.email?.toLowerCase().includes('truc');
                  const defaultVal = isTun ? '28' : '31';
                  const val = window.prompt(
                    `Nhập số Streak muốn khôi phục (Tit: 31, Tun: 28):`,
                    defaultVal
                  );
                  if (val && !isNaN(Number(val))) {
                    onUpdateSettings({ streak: Number(val), hasRestoredStreak: true });
                  }
                }}
                className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full hover:bg-red-600 shadow-sm z-20"
              >
                RESTORE
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 font-black text-xs rounded-full">
            <Sparkles size={14} className="animate-pulse" /> {userData.ttGold} GOLD
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-xs rounded-full">
            <Snowflake size={14} className="animate-pulse" /> {userData.streakFreezes || 0}
          </div>
        </div>

        {/* Right: avatars */}
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
                    activeBooster: userData.activeBooster,
                  }
                : null,
              ...teamMembers.filter((m) => m.uid !== user?.uid),
            ]
              .filter((member): member is HeaderMember => Boolean(member))
              .map((member) => (
                <button
                  key={member.uid}
                  onClick={() => member.uid === user?.uid && onOpenCloset()}
                  aria-label={member.uid === user?.uid ? 'Mở tủ đồ' : member.displayName || ''}
                  className={`avatar-edit-btn ${member.uid === user?.uid ? 'z-10' : ''}`}
                >
                  <div
                    className={`relative ${
                      member.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''
                    }`}
                  >
                    <img
                      src={getAvatarUrl(
                        member.avatarConfig ||
                          DEFAULT_AVATARS[getAssigneeIdByEmail(member.email || '') || ''] ||
                          {}
                      )}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${
                        userData.isDarkMode ? 'border-slate-800' : 'border-white'
                      } shadow-md ${
                        member.uid === user?.uid ? 'ring-2 ring-indigo-500/30' : ''
                      }`}
                      alt={member.displayName || ''}
                    />
                    {Boolean(member.activeBooster) && (
                      <div className="absolute top-0 right-0 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AppHeader);
