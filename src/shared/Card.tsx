import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  isDark?: boolean;
  className?: string;
  noPadding?: boolean;
}

const Card = memo(({ children, isDark, className = '', noPadding = false }: CardProps) => {
  return (
    <div className={`
      rounded-3xl border transition-all duration-500
      ${isDark 
        ? 'bg-slate-900/60 border-slate-800/60 backdrop-blur-xl shadow-2xl shadow-black/20' 
        : 'bg-white/80 border-slate-200/60 backdrop-blur-md shadow-xl shadow-slate-200/40'}
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {children}
    </div>
  );
});

export default Card;
