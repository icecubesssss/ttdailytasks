import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCelebrationStore, Celebration } from '../../game/celebrationStore';

const KIND_STYLES: Record<Celebration['kind'], string> = {
  gold: 'bg-amber-400/90 text-amber-950 border-amber-300 shadow-amber-500/40',
  xp: 'bg-indigo-500/90 text-white border-indigo-400 shadow-indigo-500/40',
  combo: 'bg-gradient-to-r from-orange-500/95 to-rose-500/95 text-white border-orange-300 shadow-orange-500/50',
  checkin: 'bg-emerald-500/90 text-white border-emerald-300 shadow-emerald-500/40',
  levelup: 'bg-gradient-to-r from-indigo-500/95 via-violet-500/95 to-pink-500/95 text-white border-violet-300 shadow-violet-500/60',
  drop: 'bg-violet-500/90 text-white border-violet-300 shadow-violet-500/40',
  damage: 'bg-rose-500/90 text-white border-rose-300 shadow-rose-500/40',
  freeze: 'bg-sky-400/90 text-sky-950 border-sky-200 shadow-sky-500/40'
};

const KIND_EMOJIS: Record<Celebration['kind'], string> = {
  gold: '✨',
  xp: '⚡',
  combo: '🔥',
  checkin: '☀️',
  levelup: '🎉',
  drop: '🎁',
  damage: '💥',
  freeze: '❄️'
};

/**
 * Lớp hiển thị "cảm xúc" toàn app: chip thưởng bay lên từ đáy màn hình.
 * pointer-events-none — không bao giờ chặn thao tác.
 */
export default function CelebrationLayer(): React.ReactElement {
  const items = useCelebrationStore((s) => s.items);

  return (
    <div className="fixed inset-x-0 bottom-28 lg:bottom-14 z-[1300] pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 28, scale: 0.5, rotate: -4 }}
            animate={{ opacity: 1, y: 0, scale: item.kind === 'levelup' ? 1.1 : 1, rotate: 0 }}
            exit={{ opacity: 0, y: -44, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={`flex items-center gap-2 border backdrop-blur-xl shadow-lg font-black select-none ${
              item.kind === 'levelup'
                ? 'px-6 py-3 rounded-3xl text-base'
                : 'px-4 py-1.5 rounded-full text-xs'
            } ${KIND_STYLES[item.kind]}`}
          >
            <span className={item.kind === 'levelup' ? 'text-xl' : 'text-sm'}>
              {KIND_EMOJIS[item.kind]}
            </span>
            <span className="whitespace-nowrap">{item.label}</span>
            {item.sub && <span className="text-[10px] font-bold opacity-80 whitespace-nowrap">{item.sub}</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
