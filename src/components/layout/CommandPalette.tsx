import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { Moon, Sun, Shirt, ExternalLink, Sparkles, PanelLeftClose } from 'lucide-react';
import { NAV_TABS } from './navConfig';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
  onTabChange: (tab: string) => void;
  onToggleDarkMode: () => void;
  onOpenCloset: () => void;
  onToggleSidebar: () => void;
  playSound: (soundName: string) => void;
}

function CommandPalette({
  open,
  onOpenChange,
  isDark,
  onTabChange,
  onToggleDarkMode,
  onOpenCloset,
  onToggleSidebar,
  playSound,
}: CommandPaletteProps): React.ReactElement {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const runCommand = (action: () => void) => {
    playSound('click');
    action();
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Tìm nhanh"
      overlayClassName="fixed inset-0 z-[1200] bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      contentClassName={`fixed z-[1201] top-[20%] left-1/2 -translate-x-1/2 w-[92vw] max-w-md rounded-[1.75rem] border p-2 backdrop-blur-2xl shadow-2xl ${
        isDark
          ? 'bg-slate-900/85 border-white/10 text-slate-100'
          : 'bg-white/85 border-white/60 text-slate-900'
      }`}
    >
      <Command.Input
        autoFocus
        placeholder="Bạn muốn đi đâu nè? ✨"
        className={`w-full px-4 py-3 rounded-2xl bg-transparent outline-none text-sm font-bold placeholder:font-medium ${
          isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400'
        }`}
      />
      <Command.List className="max-h-72 overflow-y-auto no-scrollbar p-1">
        <Command.Empty className="py-8 text-center text-xs font-bold text-slate-400">
          Hông tìm thấy gì hết á 🥺
        </Command.Empty>

        <Command.Group
          heading="Đi tới"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-400"
        >
          {NAV_TABS.map((tab) => (
            <Command.Item
              key={tab.id}
              value={`đi tới ${tab.label}`}
              onSelect={() => runCommand(() => onTabChange(tab.id))}
              className="cmdk-item"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Hành động"
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-black [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-400"
        >
          <Command.Item
            value="bật tắt dark mode sáng tối"
            onSelect={() => runCommand(onToggleDarkMode)}
            className="cmdk-item"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span>
          </Command.Item>
          <Command.Item
            value="mở tủ đồ closet avatar"
            onSelect={() => runCommand(onOpenCloset)}
            className="cmdk-item"
          >
            <Shirt size={18} />
            <span>Mở tủ đồ</span>
          </Command.Item>
          <Command.Item
            value="thu gọn mở rộng thanh bên sidebar"
            onSelect={() => runCommand(onToggleSidebar)}
            className="cmdk-item"
          >
            <PanelLeftClose size={18} />
            <span className="flex-1">Thu gọn / mở thanh bên</span>
            <kbd className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">⌘\</kbd>
          </Command.Item>
          <Command.Item
            value="mở google calendar"
            onSelect={() => runCommand(() => window.open('https://calendar.google.com', '_blank', 'noopener'))}
            className="cmdk-item"
          >
            <ExternalLink size={18} />
            <span>Mở Google Calendar</span>
          </Command.Item>
        </Command.Group>
      </Command.List>

      <div className={`flex items-center gap-1.5 px-4 py-2 border-t text-[9px] font-bold text-slate-400 ${isDark ? 'border-white/5' : 'border-slate-200/60'}`}>
        <Sparkles size={10} className="text-indigo-400" />
        <span>↑↓ di chuyển · ↵ chọn · esc đóng</span>
      </div>
    </Command.Dialog>
  );
}

export default React.memo(CommandPalette);
