import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Check } from 'lucide-react';
import type { UseWeeklyBossReturn } from '../../hooks/useWeeklyBoss';
import { ASSIGNEES } from '../../utils/constants';
import { bossPhase, bossWeaknessOfDay } from '../../game/battle';
import { getTodayKey } from '../../game/habitEngine';

interface BossBannerProps {
  boss: UseWeeklyBossReturn;
  isDark: boolean;
}

/** Banner Boss Tuần — mọi task + mọi đòn đánh quái của CẢ HAI đều trừ máu boss */
function BossBanner({ boss, isDark }: BossBannerProps): React.ReactElement {
  const {
    bossInfo, totalDamage, maxHp, hpLeft, damageByActor,
    defeated, myClaimed, daysLeft, rewardGold, claim
  } = boss;
  const hpPercent = Math.max(0, Math.round((hpLeft / maxHp) * 100));
  const phase = bossPhase(hpPercent);
  const weakness = bossWeaknessOfDay(getTodayKey());

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border p-4 mb-5 transition-shadow duration-500 ${
        isDark
          ? `bg-gradient-to-r from-slate-900/80 to-indigo-950/60 border-white/10 ${phase.aura}`
          : `bg-gradient-to-r from-white/70 to-indigo-50/70 border-white/60 shadow-sm ${phase.aura}`
      }`}
    >
      <div className="flex items-center gap-4">
        <motion.span
          className="text-5xl select-none"
          animate={
            defeated
              ? { rotate: 180, opacity: 0.5 }
              : { scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }
          }
          transition={defeated ? { duration: 0.5 } : { duration: 1.6, repeat: Infinity }}
        >
          {defeated ? (
            <span className="text-5xl opacity-50">🏳️</span>
          ) : (
            <motion.img 
              src={bossInfo.imageUrl} 
              alt={bossInfo.name} 
              className="w-16 h-16 object-contain drop-shadow-2xl"
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">
              Boss tuần · còn {daysLeft} ngày
            </span>
            <span className="font-black text-sm">{bossInfo.name}</span>
            {!defeated && (
              <span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase border border-slate-500/20">
                {phase.label}
              </span>
            )}
          </div>

          <p className="text-[11px] font-bold italic text-slate-400 truncate mt-0.5">
            “{defeated ? bossInfo.defeatLine : phase.mood}”
          </p>

          <div className="flex items-center gap-2 mt-2">
            <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-orange-500"
                initial={false}
                animate={{ width: `${hpPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">
              {hpLeft}/{maxHp} HP
            </span>
          </div>

          <p className="text-[9px] font-bold text-slate-400 mt-1">
            ⚔️ {Object.entries(ASSIGNEES)
              .map(([key, info]) => `${info.name}: ${damageByActor[key] || 0} dmg`)
              .join(' · ')}{' '}
            | Điểm yếu hôm nay:{' '}
            <span className="text-amber-500 font-black uppercase">
              {weakness === 'task' ? 'Task (x2 Dmg)' : 'Habit (x2 Dmg)'}
            </span>
          </p>
        </div>

        {defeated && (
          <button
            onClick={claim}
            disabled={myClaimed}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl font-black text-[10px] transition-all ${
              myClaimed
                ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 active:scale-95 animate-pulse'
            }`}
          >
            {myClaimed ? <Check size={18} /> : <Gift size={18} />}
            {myClaimed ? 'ĐÃ NHẬN' : `NHẬN ${rewardGold}G`}
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(BossBanner);
