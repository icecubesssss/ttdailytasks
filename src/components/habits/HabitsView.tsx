import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Swords, Trophy, Snowflake } from 'lucide-react';
import HabitBattleCard from './HabitBattleCard';
import HabitWizard from './HabitWizard';
import { useHabits } from '../../hooks/useHabits';
import { getTodayKey } from '../../game/habitEngine';
import { FREEZE_SHARDS_PER_FREEZE } from '../../utils/constants';
import { ASSIGNEES } from '../../utils/constants';
import type { UserData } from '../../utils/helpers';

interface HabitsViewProps {
  user: User | null;
  userData: UserData;
  isDark: boolean;
  currentAssigneeId: string | null;
}

export default function HabitsView({ user, userData, isDark, currentAssigneeId }: HabitsViewProps): React.ReactElement {
  const { myHabits, partnerHabits, isLoaded, canCreateMore, checkIn, createHabit, archiveHabit } =
    useHabits(user, currentAssigneeId);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const todayKey = getTodayKey();
  const doneToday = useMemo(
    () => myHabits.filter((h) => h.history?.[todayKey] !== undefined).length,
    [myHabits, todayKey]
  );
  const isPerfectDay = myHabits.length > 0 && doneToday === myHabits.length;

  const partnerKey = currentAssigneeId === 'tit' ? 'tun' : 'tit';
  const partnerName = ASSIGNEES[partnerKey as keyof typeof ASSIGNEES]?.name || 'Người ấy';
  const shards = userData.freezeShards || 0;

  return (
    <div className="animate-fade-in-up">
      {/* ── Header trận chiến ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            ⚔️ Trận chiến hôm nay
            {isPerfectDay && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black shadow-lg shadow-amber-500/30">
                <Trophy size={12} /> NGÀY TOÀN THẮNG
              </span>
            )}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {myHabits.length === 0
              ? 'Mỗi thói quen là một con quái — đánh bại nó mỗi ngày để nó teo dần.'
              : `Đã hạ ${doneToday}/${myHabits.length} con quái · mỗi lần điểm danh là 1 phiếu bầu cho con người bạn muốn trở thành`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {shards > 0 && (
            <span
              title={`Đủ ${FREEZE_SHARDS_PER_FREEZE} mảnh tự đổi thành 1 Streak Freeze`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 text-[10px] font-black"
            >
              <Snowflake size={12} /> mảnh băng {shards}/{FREEZE_SHARDS_PER_FREEZE}
            </span>
          )}
          {canCreateMore && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-95 transition-all"
            >
              <Swords size={16} /> Khai chiến
            </button>
          )}
        </div>
      </div>

      {/* ── Chiến trường của mình ── */}
      {!isLoaded ? (
        <div className="p-6 text-xs font-black text-slate-400">Đang dò la quái vật…</div>
      ) : myHabits.length === 0 ? (
        <button
          onClick={() => setIsWizardOpen(true)}
          className={`w-full rounded-[2rem] border-2 border-dashed p-10 text-center transition-all hover:scale-[1.01] active:scale-95 ${
            isDark ? 'border-white/10 hover:border-indigo-400/40' : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="text-5xl mb-3">🦛🦉👻</div>
          <p className="font-black text-sm">Chưa có con quái nào để đánh!</p>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Bấm để khai chiến với phiên bản lười của chính mình ⚔️
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {myHabits.map((habit) => (
            <HabitBattleCard
              key={habit.id}
              habit={habit}
              isDark={isDark}
              isOwner
              onCheck={checkIn}
              onArchive={(h) => archiveHabit(h.id)}
            />
          ))}
        </div>
      )}

      {/* ── Chiến trường của người ấy ── */}
      {partnerHabits.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wide mb-3">
            👀 Chiến trường của {partnerName}
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 opacity-90">
            {partnerHabits.map((habit) => (
              <HabitBattleCard key={habit.id} habit={habit} isDark={isDark} isOwner={false} />
            ))}
          </div>
        </div>
      )}

      <HabitWizard
        open={isWizardOpen}
        isDark={isDark}
        onClose={() => setIsWizardOpen(false)}
        onCreate={createHabit}
      />
    </div>
  );
}
