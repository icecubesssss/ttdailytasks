import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMonster, pickLine } from '../../game/bestiary';
import type { Habit } from '../../services/habitService';

interface HabitBattleSceneProps {
  habit: Habit;
  mode: 'done' | 'tiny';
  onCheck: (mode: 'done' | 'tiny') => void;
  onClose: () => void;
  isDark?: boolean;
}

export default function HabitBattleScene({ habit, mode, onCheck, onClose, isDark }: HabitBattleSceneProps) {
  const [slashes, setSlashes] = useState<number>(0);
  const [isDefeated, setIsDefeated] = useState(false);
  const [slashMarks, setSlashMarks] = useState<{x: number, y: number, id: number}[]>([]);
  const monster = getMonster(habit.monsterId);

  const requiredSlashes = 3;

  const handleSlash = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isDefeated) return;
    
    // Create slash mark at cursor
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    setSlashMarks(prev => [...prev, { x: clientX, y: clientY, id: Date.now() }]);
    setSlashes(s => s + 1);
    
    if (slashes + 1 >= requiredSlashes) {
      setIsDefeated(true);
      setTimeout(() => {
        onCheck(mode);
        onClose();
      }, 1200);
    }
  };

  useEffect(() => {
    // Add body class to prevent scrolling while battling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const daySeed = new Date().getDate() + habit.id.length;
  const line = isDefeated ? pickLine(monster.defeats, daySeed) : pickLine(monster.taunts, daySeed);

  const sceneContent = (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md select-none cursor-crosshair"
        onClick={handleSlash}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors"
        >
          ✕
        </button>

        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="text-white/60 font-black text-sm uppercase tracking-widest mb-2">Trận chiến với</p>
          <h2 className="text-3xl font-black text-white">{monster.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            {Array.from({ length: requiredSlashes }).map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i < slashes ? 'w-8 bg-red-500 shadow-[0_0_10px_red]' : 'w-4 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        <div className="relative mt-20">
          <motion.img 
            src={monster.imageUrl} 
            alt={monster.name}
            className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-none"
            animate={
              isDefeated ? { scale: 0, opacity: 0, rotate: 180, filter: "brightness(0) drop-shadow(0 0 0px red)" } :
              { 
                y: [-15, 15, -15], 
                scale: slashes > 0 ? [1, 1.1, 1] : 1,
                rotate: slashes > 0 ? [-5, 5, -5, 5, 0] : 0,
                filter: slashes > 0 ? ['brightness(1)', 'brightness(2) drop-shadow(0 0 30px red)', 'brightness(1)'] : 'brightness(1)'
              }
            }
            transition={
              isDefeated ? { duration: 0.8, ease: "anticipate" } :
              { duration: slashes > 0 ? 0.3 : 3, repeat: slashes > 0 ? 0 : Infinity, ease: "easeInOut" }
            }
            key={slashes} // trigger animation re-run on slash
          />
          
          {/* Slash marks */}
          {slashMarks.map(mark => (
            <motion.div
              key={mark.id}
              className="fixed pointer-events-none text-6xl"
              style={{ left: mark.x - 30, top: mark.y - 30 }}
              initial={{ opacity: 1, scale: 0.5, rotate: Math.random() * 90 - 45 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.5 }}
            >
              💥
            </motion.div>
          ))}
        </div>

        <motion.p 
          className="text-white/90 font-bold mt-12 text-xl italic text-center max-w-lg px-6 pointer-events-none"
          key={line}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          "{line}"
        </motion.p>
        
        {!isDefeated && (
          <p className="absolute bottom-12 text-white/40 font-bold uppercase tracking-widest text-xs animate-pulse pointer-events-none">
            Nhấp liên tục để chém quái
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(sceneContent, document.body);
}
