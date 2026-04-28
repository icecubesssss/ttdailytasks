import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export default function Modal({ open, onClose, children, isDark = true }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 shadow-2xl transition-all border ${isDark ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}>
        {children}
      </div>
    </div>
  );
}
