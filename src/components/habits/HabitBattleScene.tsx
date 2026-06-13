import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Swords, Sparkles, ChevronRight } from 'lucide-react';
import type { Habit, HabitCheckOutcome } from '../../services/habitService';
import { getMonster } from '../../game/bestiary';
import {
  computeAutomaticity, monsterHpPercent, monsterStage, computeHabitStreak,
  isRevengeDay, getTodayKey, previewDamage, isCheckedForActor
} from '../../game/habitEngine';
import { rollCrit } from '../../game/battle';
import { useTypewriter } from '../../hooks/useTypewriter';
import { getAvatarUrl } from '../../utils/helpers';
import type { AvatarConfig } from '../../utils/helpers';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AURA: Record<string, string> = {
  rose: 'from-rose-500/30 via-rose-400/10',
  violet: 'from-violet-500/30 via-violet-400/10',
  amber: 'from-amber-500/30 via-amber-400/10',
  emerald: 'from-emerald-500/30 via-emerald-400/10',
  sky: 'from-sky-500/30 via-sky-400/10',
  fuchsia: 'from-fuchsia-500/30 via-fuchsia-400/10',
  cyan: 'from-cyan-500/30 via-cyan-400/10'
};

type Phase = 'intro' | 'menu' | 'attacking' | 'result' | 'victory';

interface HabitBattleSceneProps {
  habit: Habit;
  isDark: boolean;
  assigneeKey: string | null;
  avatarConfig?: AvatarConfig | null;
  onCheck: (habit: Habit, mode: 'done' | 'tiny', opts?: { silent?: boolean }) => Promise<HabitCheckOutcome | null>;
  onClose: () => void;
}

export default function HabitBattleScene({
  habit, isDark, assigneeKey, avatarConfig, onCheck, onClose
}: HabitBattleSceneProps): React.ReactElement {
  const monster = getMonster(habit.monsterId);
  const isDuo = habit.type === 'duo';
  const todayKey = getTodayKey();

  const baseAuto = useMemo(() => computeAutomaticity(habit), [habit]);
  const streak = useMemo(() => computeHabitStreak(habit.history || {}), [habit]);
  const revenge = useMemo(() => isRevengeDay(habit.history || {}), [habit]);
  const alreadyDone = isCheckedForActor(habit.history || {}, isDuo, assigneeKey, todayKey);

  // HP hiển thị (animate riêng để thấy thanh máu tụt)
  const [displayHp, setDisplayHp] = useState(monsterHpPercent(baseAuto));
  const [phase, setPhase] = useState<Phase>(alreadyDone ? 'victory' : 'intro');
  const [dialogue, setDialogue] = useState(
    alreadyDone ? `${monster.name} đã bị bạn hạ gục hôm nay rồi! 💫` : `${monster.name} xuất hiện!`
  );
  const [showMonsterAttack, setShowMonsterAttack] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);
  const [crit, setCrit] = useState(false);
  const [shake, setShake] = useState(false);
  const [floatDmg, setFloatDmg] = useState<number | null>(null);
  const [rewards, setRewards] = useState<HabitCheckOutcome | null>(null);
  const [monsterDefeated, setMonsterDefeated] = useState(false);
  const busyRef = useRef(false);

  const { display: typed, isDone: typedDone } = useTypewriter(dialogue);
  const damagePreview = previewDamage(habit, 'done');

  // Lượt quái đánh trước (kiểu Pokémon: địch ra chiêu rồi mới tới mình)
  useEffect(() => {
    if (phase !== 'intro') return;
    let alive = true;
    (async () => {
      await sleep(900);
      if (!alive) return;
      setShowMonsterAttack(true);
      setDialogue(`${monster.name} dùng ${monster.attackName}!`);
      setShake(true);
      await sleep(420);
      if (!alive) return;
      setShake(false);
      await sleep(700);
      if (!alive) return;
      setShowMonsterAttack(false);
      setDialogue(`“${monster.taunts[new Date().getDate() % monster.taunts.length]}”`);
      await sleep(1100);
      if (!alive) return;
      setPhase('menu');
      setDialogue('Tung chiêu nào để hạ gục nó? ⚔️');
    })();
    return () => {
      alive = false;
    };
  }, [phase, monster]);

  const attack = useCallback(
    async (mode: 'done' | 'tiny') => {
      if (busyRef.current) return;
      busyRef.current = true;
      const move = mode === 'done' ? monster.moves.full : monster.moves.tiny;
      const critRoll = rollCrit(streak, revenge);

      setPhase('attacking');
      setDialogue(`Bạn dùng ${move.name}! ${move.emoji}`);
      await sleep(650);

      // Va chạm
      setHitFlash(true);
      setCrit(critRoll.isCrit);
      setShake(true);
      setFloatDmg(mode === 'done' ? damagePreview : Math.max(1, Math.round(damagePreview / 2)));
      if (critRoll.isCrit) {
        confetti({ particleCount: 60, spread: 50, startVelocity: 45, origin: { x: 0.7, y: 0.35 }, colors: ['#fbbf24', '#f43f5e'] });
      }
      await sleep(140);
      setHitFlash(false);

      let outcome: HabitCheckOutcome | null = null;
      try {
        outcome = await onCheck(habit, mode, { silent: true });
      } catch {
        setShake(false);
        setFloatDmg(null);
        setDialogue('Đòn đánh trượt mất rồi! Thử lại nha 🥲');
        setPhase('menu');
        busyRef.current = false;
        return;
      }

      await sleep(360);
      setShake(false);

      // Thanh máu tụt
      const newHp = monsterHpPercent(computeAutomaticity({ ...habit, history: { ...habit.history, [todayKey]: mode } }));
      setDisplayHp(newHp);
      const willDefeat = !isDuo || outcome?.duoCompleted;
      setMonsterDefeated(Boolean(willDefeat));

      await sleep(500);
      setFloatDmg(null);
      setRewards(outcome);
      setPhase('result');

      if (willDefeat) {
        setDialogue(`💥 ${critRoll.isCrit ? 'CHÍ MẠNG! ' : ''}${monster.name}: “${monster.defeats[new Date().getDate() % monster.defeats.length]}”`);
        confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#6366f1', '#f59e0b'] });
      } else {
        setDialogue('Bạn đã ra đòn! Chờ người ấy khép vòng để hạ gục nó 💌');
      }
      busyRef.current = false;
    },
    [habit, monster, streak, revenge, damagePreview, onCheck, isDuo, todayKey]
  );

  const undo = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setDialogue(`${monster.name} hồi sức... bạn đã hoàn tác điểm danh.`);
    try {
      await onCheck(habit, isDuo ? 'tiny' : (habit.history?.[todayKey] === 'tiny' ? 'tiny' : 'done'), { silent: true });
    } catch {
      /* noop */
    }
    busyRef.current = false;
    onClose();
  }, [habit, monster, isDuo, todayKey, onCheck, onClose]);

  const stage = monsterStage(baseAuto);
  const auraGrad = AURA[monster.color] || AURA.rose;

  const node = (
    <div className="fixed inset-0 z-[1400] flex flex-col" role="dialog" aria-label={`Trận đấu với ${monster.name}`}>
      {/* nền */}
      <div className={`absolute inset-0 ${isDark ? 'bg-slate-950' : 'bg-slate-900'}`} />
      <div className={`absolute inset-0 bg-gradient-to-b ${auraGrad} to-transparent`} />
      <div className="absolute inset-0 battle-grid opacity-30" />
      <AnimatePresence>
        {hitFlash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 ${crit ? 'bg-amber-200' : 'bg-white'}`}
          />
        )}
      </AnimatePresence>

      {/* nút thoát */}
      <button
        onClick={onClose}
        aria-label="Rút lui"
        className="absolute top-4 right-4 z-20 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-90"
      >
        <X size={18} />
      </button>

      {/* sàn đấu */}
      <motion.div
        className="relative flex-1 flex flex-col justify-between px-5 pt-16 pb-2 max-w-3xl w-full mx-auto"
        animate={shake ? { x: [0, -10, 12, -8, 6, 0], y: [0, 4, -3, 2, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.42 }}
      >
        {/* ── Quái (địch) — góc trên phải ── */}
        <div className="flex items-start justify-end gap-3">
          {/* HP card */}
          <div className={`mt-4 rounded-2xl border px-3 py-2 backdrop-blur-md ${isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white/15 border-white/20'} text-white min-w-[44%]`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs truncate">{monster.emoji} {monster.name}</span>
              {streak > 0 && <span className="text-[9px] font-black text-orange-300">🔥 {streak}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[8px] font-black text-white/60">HP</span>
              <div className="flex-1 h-2.5 rounded-full bg-black/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
                  initial={false}
                  animate={{ width: `${displayHp}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[8px] font-black text-white/80 w-7 text-right">{displayHp}</span>
            </div>
          </div>

          <motion.div
            className="relative"
            animate={
              monsterDefeated
                ? { y: 60, opacity: 0, rotate: 60, scale: 0.7 }
                : showMonsterAttack
                ? { x: [-40, 10, 0], scale: [1, 1.12, 1] }
                : stage === 0
                ? { y: [0, -8, 0], rotate: [0, -4, 4, 0] }
                : { y: [0, -5, 0] }
            }
            transition={monsterDefeated ? { duration: 0.7 } : { duration: stage === 0 ? 1.4 : 2.4, repeat: monsterDefeated ? 0 : Infinity }}
          >
            <div className={`absolute inset-0 blur-2xl rounded-full bg-gradient-to-br ${auraGrad} to-transparent scale-150`} />
            <span className="relative text-8xl sm:text-9xl drop-shadow-2xl select-none">{monster.emoji}</span>
          </motion.div>
        </div>

        {/* ── Người chơi — góc dưới trái ── */}
        <div className="flex items-end justify-start gap-3 mb-1">
          <motion.div
            animate={phase === 'attacking' ? { x: [0, 220, 0], y: [0, -90, 0] } : { y: [0, -4, 0] }}
            transition={phase === 'attacking' ? { duration: 0.95, times: [0, 0.4, 1] } : { duration: 3, repeat: Infinity }}
            className="relative"
          >
            <div className="absolute inset-0 blur-xl rounded-full bg-indigo-500/30 scale-125" />
            {avatarConfig ? (
              <img src={getAvatarUrl(avatarConfig)} alt="Bạn" className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/30 shadow-2xl" />
            ) : (
              <span className="relative text-7xl">🧑‍🚀</span>
            )}
          </motion.div>

          {/* số damage bay */}
          <AnimatePresence>
            {floatDmg !== null && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: 1, y: -70, scale: crit ? 1.6 : 1.1 }}
                exit={{ opacity: 0, y: -110 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                className={`absolute left-1/2 top-1/3 font-black drop-shadow-lg ${crit ? 'text-amber-300 text-5xl' : 'text-white text-4xl'}`}
              >
                -{floatDmg}{crit && <span className="block text-sm text-amber-200 -mt-1">CHÍ MẠNG!</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Hộp thoại + menu (kiểu Pokémon) ── */}
      <div className={`relative z-10 border-t-4 ${isDark ? 'bg-slate-900 border-indigo-500/40' : 'bg-slate-800 border-indigo-400/50'} px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]`}>
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl border-2 ${isDark ? 'border-white/15 bg-slate-950/60' : 'border-white/20 bg-slate-900/50'} px-4 py-3 min-h-[4.5rem] flex items-center`}>
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
              {typed}
              {!typedDone && <span className="inline-block w-2 h-4 ml-0.5 bg-white/70 animate-pulse align-middle" />}
              {typedDone && (phase === 'result' || phase === 'victory') && <ChevronRight size={16} className="inline ml-1 text-white/60 animate-bounce" />}
            </p>
          </div>

          {/* Menu chiêu thức */}
          <AnimatePresence mode="wait">
            {phase === 'menu' && typedDone && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="grid grid-cols-2 gap-2 mt-3"
              >
                <button
                  onClick={() => attack('done')}
                  className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all"
                >
                  <span className="text-xl group-hover:scale-125 transition-transform">{monster.moves.full.emoji}</span>
                  <span className="text-left leading-tight">
                    {monster.moves.full.name}
                    <span className="block text-[9px] font-bold text-white/70">đòn chuẩn · -{damagePreview} HP</span>
                  </span>
                </button>
                {!isDuo ? (
                  <button
                    onClick={() => attack('tiny')}
                    className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-sm border border-white/15 active:scale-95 transition-all"
                  >
                    <span className="text-xl group-hover:scale-125 transition-transform">{monster.moves.tiny.emoji}</span>
                    <span className="text-left leading-tight">
                      {monster.moves.tiny.name}
                      <span className="block text-[9px] font-bold text-white/60">đòn nhẹ 2 phút · giữ chuỗi</span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-black text-sm border border-white/10 active:scale-95 transition-all"
                  >
                    Rút lui
                  </button>
                )}
                {revenge && (
                  <div className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-[10px] font-black animate-pulse">
                    💢 NGÀY PHỤC THÙ — đòn này CHÍ MẠNG chắc chắn!
                  </div>
                )}
              </motion.div>
            )}

            {/* Kết quả: phần thưởng */}
            {phase === 'result' && typedDone && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                {rewards && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-400/90 text-amber-950 text-xs font-black">
                      <Sparkles size={12} /> +{Math.max(0, rewards.goldDelta)} Gold
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-500/90 text-white text-xs font-black">
                      ⚡ +{Math.max(0, rewards.xpDelta)} XP
                    </span>
                    {rewards.drop?.type === 'gold' && (
                      <span className="px-3 py-1.5 rounded-full bg-violet-500/90 text-white text-xs font-black">🎁 Rơi +{rewards.drop.amount} Gold!</span>
                    )}
                    {rewards.drop?.type === 'shard' && (
                      <span className="px-3 py-1.5 rounded-full bg-sky-400/90 text-sky-950 text-xs font-black">
                        ❄️ {rewards.drop.freezeEarned ? '+1 Streak Freeze!' : `Mảnh băng ${rewards.drop.shards}/3`}
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  Tuyệt vời! Quay lại chiến trường ✨
                </button>
              </motion.div>
            )}

            {/* Đã hạ hôm nay → cho hoàn tác */}
            {phase === 'victory' && typedDone && (
              <motion.div
                key="victory"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-2 mt-3"
              >
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm active:scale-95 transition-all"
                >
                  Quay lại ✨
                </button>
                <button
                  onClick={undo}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black text-sm border border-white/10 active:scale-95 transition-all"
                >
                  Hoàn tác điểm danh
                </button>
              </motion.div>
            )}

            {phase === 'attacking' && (
              <motion.div key="atk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 mt-3 text-white/50 text-xs font-black">
                <Swords size={14} className="animate-pulse" /> đang tấn công…
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
