import React, { memo } from 'react';
import { LucideProps } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ComponentType<LucideProps>;
  type?: 'button' | 'submit' | 'reset';
}

const Button = memo(({ children, onClick, className = '', variant = 'primary', disabled = false, icon: Icon, type = 'button' }: ButtonProps) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/25',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest
        transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        flex items-center gap-2 justify-center
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
});

export default Button;
