import React from 'react';
import { X, StickyNote, Plus } from 'lucide-react';
import QuickNote from '../quicknote/QuickNote';
import type { UserData } from '../../utils/helpers';

interface QuickNoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  onUpdateSettings: (updates: Partial<UserData>) => void;
}

export default function QuickNoteSidebar({
  isOpen,
  onClose,
  userData,
  onUpdateSettings
}: QuickNoteSidebarProps): React.ReactElement {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[140] transition-opacity duration-500 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel - Wider for notes */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl z-[150] bg-slate-950/90 backdrop-blur-3xl border-l border-white/10 
          transition-transform duration-500 ease-out flex flex-col shadow-2xl
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
              <StickyNote size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight">Quick Notes</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Workspace Scratchpad</p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            title="Đóng"
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <QuickNote 
            userData={userData} 
            onUpdateSettings={onUpdateSettings} 
          />
        </div>

        {/* Bottom Tip */}
        <div className="p-4 bg-white/5 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
            Auto-saves every 1.2 seconds
          </p>
        </div>
      </div>
    </>
  );
}
