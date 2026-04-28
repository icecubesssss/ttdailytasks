import React, { Suspense } from 'react';
import { Gift, Clock } from 'lucide-react';
import { SHOP_ITEMS } from '../../utils/constants';
import type { UserData, Task, TeamMember, LevelInfo } from '../../utils/helpers';

const StatsView = React.lazy(() => import('../stats/StatsView.jsx'));
const ShopView = React.lazy(() => import('../shop/ShopView.jsx'));
interface StatsViewProps {
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  levelInfo: LevelInfo;
  onSummarize: () => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  onTabChange: (tab: string) => void;
  dailyQuest: DailyQuest;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: (name: string) => void;
  onChangeMascotAvatar: (config: Record<string, any>) => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  now: number;
}

interface ShopViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  onBuyItem: (itemId: string) => void;
}

const StatsViewTyped = StatsView as React.ComponentType<StatsViewProps>;
const ShopViewTyped = ShopView as React.ComponentType<ShopViewProps>;

type DailyQuest = Record<string, any> | null;
type AIReport = string;

interface TicketLog {
  id: string;
  name: string;
  usedAt: number;
  user: string;
}

interface DashboardProps {
  view: string;
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  levelInfo: LevelInfo;
  onBuyItem: (itemId: string) => void;
  onUseTicket: (ticketId: string) => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  onSummarize: () => void;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  onTabChange: (tab: string) => void;
  dailyQuest: DailyQuest;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: (name: string) => void;
  onChangeMascotAvatar: (config: Record<string, any>) => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  now: number;
}

const ViewLoading = (): React.ReactElement => (
  <div className="p-12 text-center">
    <div className="inline-block w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đang tải dữ liệu...</p>
  </div>
);

interface StatHistoryProps {
  isDark: boolean;
  userData: UserData;
  onUseTicket: (ticketId: string) => void;
}

const StatHistory = ({ isDark, userData, onUseTicket }: StatHistoryProps): React.ReactElement => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
    <div className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Gift size={16} className="text-fuchsia-500" /> Kho Vé Của Mình
      </h4>
      <div className="space-y-3">
        {(userData.ownedItemIds || []).filter(
          (id) => SHOP_ITEMS.find((i) => i.id === id)?.type === 'ticket' || SHOP_ITEMS.find((i) => i.id === id)?.type === 'utility'
        ).length > 0 ? (
          (userData.ownedItemIds || [])
            .filter(
              (id) => SHOP_ITEMS.find((i) => i.id === id)?.type === 'ticket' || SHOP_ITEMS.find((i) => i.id === id)?.type === 'utility'
            )
            .map((ownedId, idx) => {
              const item = SHOP_ITEMS.find((i) => i.id === ownedId);
              return (
                <div
                  key={`${ownedId}-${idx}`}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item?.icon}</span>
                    <span className="text-xs font-black">{item?.name}</span>
                  </div>
                  <button
                    onClick={() => onUseTicket(ownedId)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    SỬ DỤNG
                  </button>
                </div>
              );
            })
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-700/20 rounded-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chưa có vé nào</p>
          </div>
        )}
      </div>
    </div>

    <div className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Clock size={16} className="text-blue-500" /> Lịch sử giao kèo
      </h4>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {(userData.ticketHistory || []).length > 0 ? (
          [...(userData.ticketHistory || [])].reverse().map((log: TicketLog) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border-l-4 ${
                isDark
                  ? 'bg-slate-800/20 border-blue-500/50 text-slate-300'
                  : 'bg-blue-50 border-blue-500/50 text-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-black">{log.name}</span>
                <span className="text-[8px] font-bold opacity-60 uppercase">
                  {new Date(log.usedAt).toLocaleDateString('vi')}
                </span>
              </div>
              <p className="text-[9px] font-bold">
                Người dùng: <span className="text-blue-500">{log.user}</span>
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Trống
          </div>
        )}
      </div>
    </div>
  </div>
);

export default function Dashboard({
  view,
  tasks,
  isDark,
  teamMembers,
  userData,
  levelInfo,
  onBuyItem,
  onUseTicket,
  isSummarizing,
  aiReport,
  onSummarize,
  onUpdateSettings,
  triggerSystemFocus,
  onTabChange,
  dailyQuest,
  onRefreshDailyQuest,
  currentTab,
  onRenameMascot,
  onChangeMascotAvatar,
  partnerTask,
  myRunningTask,
  now,
  onCompleteDailyQuest
}: DashboardProps): React.ReactElement | null {
  if (view === 'stats') {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4">
        <Suspense fallback={<ViewLoading />}>
          <StatsViewTyped
            tasks={tasks}
            isDark={isDark}
            teamMembers={teamMembers}
            userData={userData}
            levelInfo={levelInfo}
            onSummarize={onSummarize}
            isSummarizing={isSummarizing}
            aiReport={aiReport}
            onUpdateSettings={onUpdateSettings}
            triggerSystemFocus={triggerSystemFocus}
            onTabChange={onTabChange}
            dailyQuest={dailyQuest}
            onRefreshDailyQuest={onRefreshDailyQuest}
            onCompleteDailyQuest={onCompleteDailyQuest}
            currentTab={currentTab}
            onRenameMascot={onRenameMascot}
            onChangeMascotAvatar={onChangeMascotAvatar}
            partnerTask={partnerTask}
            myRunningTask={myRunningTask}
            now={now}
          />
        </Suspense>
        <StatHistory isDark={isDark} userData={userData} onUseTicket={onUseTicket} />
      </div>
    );
  }
  if (view === 'shop') {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4">
        <Suspense fallback={<ViewLoading />}>
          <ShopViewTyped
            userData={userData}
            levelInfo={levelInfo}
            isDark={isDark}
            onBuyItem={(itemId: string) => onBuyItem(itemId)}
          />
        </Suspense>
        <StatHistory isDark={isDark} userData={userData} onUseTicket={onUseTicket} />
      </div>
    );
  }
  return null;
}
