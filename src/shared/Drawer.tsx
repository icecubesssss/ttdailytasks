import React from 'react';
import { Drawer as Vaul } from 'vaul';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isDark?: boolean;
  children: React.ReactNode;
}

/**
 * Bottom-sheet drawer (vaul) cho mobile — kéo thả vật lý như app native.
 * Trên desktop các flow vẫn dùng Modal; Drawer dành cho màn hình nhỏ.
 */
export default function Drawer({ open, onOpenChange, title, isDark = false, children }: DrawerProps): React.ReactElement {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-[1100] bg-slate-900/40 backdrop-blur-sm" />
        <Vaul.Content
          aria-describedby={undefined}
          className={`fixed bottom-0 left-0 right-0 z-[1101] max-h-[92dvh] rounded-t-[2rem] border-t outline-none pb-[env(safe-area-inset-bottom)] ${
            isDark
              ? 'bg-slate-900/95 border-white/10 text-slate-100'
              : 'bg-white/95 border-white/60 text-slate-900'
          } backdrop-blur-2xl`}
        >
          <div className={`mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
          <Vaul.Title className="px-5 py-2 text-sm font-black text-center">{title}</Vaul.Title>
          <div className="px-5 pb-6 overflow-y-auto no-scrollbar max-h-[78dvh]">{children}</div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
