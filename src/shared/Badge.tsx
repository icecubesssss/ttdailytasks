import React, { memo } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = memo(({ children, className = '' }: BadgeProps) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
});

export default Badge;
