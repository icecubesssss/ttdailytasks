import React from 'react';
import {
  Layout,
  CalendarDays,
  LayoutDashboard,
  ShoppingBag,
  StickyNote,
  Swords,
} from 'lucide-react';

export interface NavTab {
  id: string;
  label: string;
  icon: React.ReactElement;
  activeColor: string;
}

export const NAV_TABS: NavTab[] = [
  {
    id: 'tasks',
    label: 'Board',
    icon: <Layout size={20} />,
    activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
  },
  {
    id: 'calendar',
    label: 'Lịch',
    icon: <CalendarDays size={20} />,
    activeColor: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
  },
  {
    id: 'habits',
    label: 'Quái Thú',
    icon: <Swords size={20} />,
    activeColor: 'bg-rose-600 text-white shadow-lg shadow-rose-500/30',
  },
  {
    id: 'stats',
    label: 'Thống kê',
    icon: <LayoutDashboard size={20} />,
    activeColor: 'bg-violet-600 text-white shadow-lg shadow-violet-500/30',
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: <ShoppingBag size={20} />,
    activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  },
  {
    id: 'note',
    label: 'Ghi chú',
    icon: <StickyNote size={20} />,
    activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  },
];
