import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Swords, Trash2 } from 'lucide-react';
import type { Habit } from '../../services/habitService';
import { getMonster, pickLine, MONSTER_STAGES } from '../../game/bestiary';
import {
  computeAutomaticity, monsterHpPercent, monsterStage, computeHabitStreak,
  isRevengeDay, lastNDays, getTodayKey, previewDamage,
  isSealable, daysSinceCreated, isCheckedForActor
} from '../../game/habitEngine';
import { ASSIGNEES } from '../../utils/constants';

const HP_BAR_COLORS: Record<string, string> = {
  rose: 'from-rose-500 to-rose-400',
  violet: 'from-violet-500 to-violet-400',
  amber: 'from-amber-500 to-amber-400',
  emerald: 'from-emerald-500 to-emerald-400',
  sky: 'from-sky-500 to-sky-400',
  fuchsia: 'from-fuchsia-500 to-fuchsia-400',
  cyan: 'from-cyan-500 to-cyan-400'
};

interface HabitBattleCardProps {
  habit: Habit;
  isDark: boolean;
  isOwner: boolean;
  /** 'tit' | 'tun' của người đang xem — cần cho thói quen đôi */
  assigneeKey?: string | null;
  onCheck?: (habit: Habit, mode: 'done' | 'tiny') => void;
  onBattle?: (habit: Habit) => void;
  onArchive?: (habit: Habit) => void;
  onSeal?: (habit: Habit) => void;
}

function HabitBattleCard({
  habit, isDark, isOwner, assigneeKey = null, onCheck, onBattle, onArchive, onSeal
}: HabitBattleCardProps): React.ReactElement {
  const todayKey = getTodayKey();
  const monster = getMonster(habit.monsterId);
  const isDuo = habit.type === 'duo';

  const { auto, hp, stage, streak, revenge, todayValue, week, damage, sealable, days } = useMemo(() => {
    const auto = computeAutomaticity(habit);
    return {
      auto,
      hp: monsterHpPercent(auto),
      stage: monsterStage(auto),
      streak: computeHabitStreak(habit.history || {}),
      revenge: isRevengeDay(habit.history || {}),
      todayValue: (habit.history || {})[todayKey],
      week: lastNDays(habit.history || {}, 7),
      damage: previewDamage(habit, isDuo ? 'tiny' : 'done'),
      sealable: isSealable(habit),
      days: daysSinceCreated(habit)
    };
  }, [habit, todayKey, isDuo]);

  const myDone = isCheckedForActor(habit.history || {}, isDuo, assigneeKey, todayKey);
  // Quái chỉ "nằm" khi trận hôm nay trọn vẹn (duo cần đủ cả hai)
  const defeated = isDuo ? todayValue === 'done' : todayValue === 'done' || todayValue === 'tiny';
  const waitingPartner = isDuo && myDone && !defeated;
  const missingKey = isDuo && (todayValue === 'tit' || todayValue === 'tun')
    ? (todayValue === 'tit' ? 'tun' : 'tit')
    : null;
  const missingName = missingKey ? ASSIGNEES[missingKey as keyof typeof ASSIGNEES].name : '';

  const daySeed = new Date().getDate() + habit.id.length;
  const line = defeated
    ? pickLine(monster.defeats, daySeed)
    : waitingPartner || missingKey
    ? `Hê hê, ${missingName} chưa làm là chưa xong đâu nha~`
    : pickLine(monster.taunts, daySeed);
  const stageInfo = MONSTER_STAGES[stage];

  return (
    <div
      className={`relative rounded-[1.75rem] border p-4 transition-all ${
        isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white/60 border-white/60 shadow-sm'
      } ${defeated ? 'opacity-90' : ''}`}
    >
      {revenge && !defeated && isOwner && (
        <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse shadow-lg shadow-red-500/40">
          💢 NGÀY PHỤC THÙ — đừng lỡ 2 ngày liên tiếp!
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* ── Quái ── */}
        <motion.div
          className="relative w-16 shrink-0 text-center select-none"
          animate={
            defeated
              ? { rotate: 90, scale: 0.8, opacity: 0.55 }
              : stage === 0
              ? { rotate: [0, -7, 7, 0], scale: [1, 1.06, 1] }
              : stage === 3
              ? { y: [0, 2, 0], scale: 0.95 }
              : { y: [0, -2, 0] }
          }
          transition={defeated ? { duration: 0.4 } : { duration: stage === 0 ? 1.1 : 2.2, repeat: Infinity }}
        >
          <span className={`${stageInfo.scale} ${defeated ? 'grayscale' : ''} inline-block`}>
            {monster.emoji}
          </span>
          {defeated && <span className="absolute -top-1 -right-1 text-lg">💫</span>}
        </motion.div>

        {/* ── Thông tin trận đấu ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-sm truncate">{habit.emoji} {habit.title}</span>
            {isDuo && (
              <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-[9px] font-black">
                💞 ĐÔI
              </span>
            )}
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-500">
                <Flame size={11} className="fill-orange-500" /> {streak}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">
              {monster.name} · {stageInfo.label}
            </span>
            <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${HP_BAR_COLORS[monster.color]}`}
                initial={false}
                animate={{ width: `${hp}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <span className="text-[9px] font-black text-slate-400 whitespace-nowrap">{hp} HP</span>
          </div>

          <p className={`text-[11px] font-bold mt-1.5 italic truncate ${defeated ? 'text-emerald-500' : 'text-slate-400'}`}>
            “{line}”
          </p>

          {/* 7 ngày gần nhất */}
          <div className="flex items-center gap-1 mt-2">
            {week.map((d) => (
              <span
                key={d.key}
                title={d.key}
                className={`w-2 h-2 rounded-full ${
                  d.value === 'done'
                    ? 'bg-emerald-500'
                    : d.value === 'tiny'
                    ? 'bg-emerald-300'
                    : d.value === 'tit' || d.value === 'tun'
                    ? 'bg-amber-400'
                    : d.value === 'skip'
                    ? 'bg-sky-300'
                    : d.isToday
                    ? `border ${isDark ? 'border-slate-600' : 'border-slate-300'}`
                    : isDark
                    ? 'bg-slate-700'
                    : 'bg-slate-200'
                }`}
              />
            ))}
            <span className="text-[9px] font-bold text-slate-400 ml-1">độ thuần hóa {Math.round(auto * 100)}%</span>
          </div>
        </div>

        {/* ── Nút tấn công ── */}
        {isOwner && onCheck && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => (onBattle ? onBattle(habit) : onCheck(habit, 'done'))}
              title={
                myDone
                  ? 'Xem lại trận đấu'
                  : isDuo
                  ? `Vào trận — điểm danh phần mình (-${damage} HP)`
                  : `Vào trận đấu! (-${damage} HP)`
              }
              aria-label={myDone ? 'Xem lại trận đấu' : 'Vào trận đấu'}
              className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                defeated || todayValue === 'done'
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40'
                  : waitingPartner
                  ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-600 dark:bg-fuchsia-500/20'
                  : todayValue === 'tiny'
                  ? 'bg-emerald-200 border-emerald-300 text-emerald-700'
                  : `${isDark ? 'border-slate-600 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-500'} hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-105`
              }`}
            >
              {defeated ? (
                <span className="text-xl">✓</span>
              ) : waitingPartner ? (
                <span className="text-xl">💌</span>
              ) : (
                <Swords size={22} className={revenge ? 'text-red-500' : 'text-indigo-500'} />
              )}
            </motion.button>
            {!defeated && !isDuo && !myDone && (
              <button
                onClick={() => onCheck(habit, 'tiny')}
                title={`Đòn nhẹ 2 phút: ${habit.tinyVersion}`}
                className="text-[9px] font-black text-slate-400 hover:text-indigo-500 transition-colors"
              >
                🤏 đòn nhẹ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Đủ 66 ngày + thuần hóa cao → phong ấn */}
      {isOwner && sealable && onSeal && (
        <button
          onClick={() => {
            if (window.confirm(`Phong ấn ${monster.name}? "${habit.title}" tốt nghiệp sau ${days} ngày — quái vào Đền, bạn không cần điểm danh nữa! 🔮`)) {
              onSeal(habit);
            }
          }}
          className="w-full mt-3 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 active:scale-95 transition-all animate-pulse"
        >
          🔮 PHONG ẤN {monster.name.toUpperCase()} — {days} ngày, quái đã bị thuần hóa!
        </button>
      )}

      {/* Đòn nhẹ là gì + cue + nút xóa */}
      {isOwner && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200/40 dark:border-white/5">
          <p className="text-[9px] font-bold text-slate-400 truncate">
            {habit.cueAfter ? `📍 Sau khi ${habit.cueAfter}` : ''}
            {habit.cueAfter && habit.tinyVersion ? ' · ' : ''}
            {habit.tinyVersion ? `🤏 ${habit.tinyVersion}` : ''}
          </p>
          {onArchive && (
            <button
              onClick={() => {
                if (window.confirm(`Đầu hàng ${monster.name}? Thói quen "${habit.title}" sẽ bị lưu trữ.`)) {
                  onArchive(habit);
                }
              }}
              title="Lưu trữ thói quen"
              aria-label="Lưu trữ thói quen"
              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(HabitBattleCard);
