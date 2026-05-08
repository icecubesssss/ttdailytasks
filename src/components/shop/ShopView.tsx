import React, { useState } from 'react';
import { SHOP_ITEMS, type ShopItem } from '../../utils/constants';
import type { UserData, LevelInfo } from '../../utils/helpers';
import { Coins, Lock, Package, Palette, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';

interface ShopViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  onBuyItem: (itemId: string) => void;
  onUpdateSettings: (updates: Partial<UserData>) => void;
}

type Category = 'all' | 'ticket' | 'booster' | 'utility' | 'theme';

export default function ShopView({ userData, levelInfo, isDark, onBuyItem, onUpdateSettings }: ShopViewProps) {
  const [activeTab, setActiveTab] = useState<Category>('all');

  const categories = [
    { id: 'all', label: 'Tất cả', icon: <ShoppingBag size={14} /> },
    { id: 'ticket', label: 'Vé Thưởng', icon: <Package size={14} /> },
    { id: 'booster', label: 'Bổ Trợ', icon: <Zap size={14} /> },
    { id: 'utility', label: 'Tiện Ích', icon: <Coins size={14} /> },
    { id: 'theme', label: 'Chủ Đề', icon: <Palette size={14} /> },
  ];

  const filteredItems = activeTab === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(item => item.type === activeTab);

  const GIFTED_THEME_IDS = ['theme_sakura', 'theme_cyberpunk', 'theme_neon_night', 'theme_luxury_gold', 'theme_macos_26'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Gold Header */}
      <div className={`p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-white border border-slate-100 shadow-xl'}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-yellow-400 via-orange-500 to-red-500" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 animate-pulse-slow">
            <Coins size={40} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase italic">Trung Tâm Mua Sắm</h3>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tích lũy Gold từ việc hoàn thành task</p>
          </div>
        </div>
        
        <div className={`px-8 py-4 rounded-3xl flex items-center gap-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số dư hiện tại</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-yellow-500 font-mono">{(userData?.ttGold || 0).toLocaleString()}</span>
              <span className="text-sm font-black text-yellow-600">TTG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id as Category)}
            className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black transition-all ${
              activeTab === cat.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm border border-slate-100'
            }`}
          >
            {cat.icon}
            {cat.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isLocked = (levelInfo.level || 1) < (item.minLevel || 1);
          const canAfford = (userData?.ttGold || 0) >= item.price;
          const isOwned = userData.ownedItemIds?.includes(item.id) && item.type !== 'ticket';
          const isGifted = GIFTED_THEME_IDS.includes(item.id);

          const isTheme = item.type === 'theme';
          const isActive = userData.activeThemeId === item.id;

          return (
            <div 
              key={item.id} 
              className={`group p-0.5 rounded-[2.2rem] transition-all duration-500 hover:scale-[1.03] active:scale-95 shop-item-card ${
                isActive ? 'active' : ''
              } ${isLocked ? 'grayscale opacity-60' : ''}`}
            >
              <div className={`h-full p-7 rounded-[2rem] flex flex-col relative overflow-hidden transition-all ${
                isDark 
                  ? 'bg-slate-900/95 border border-slate-800/50 group-hover:bg-slate-900' 
                  : 'bg-white border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] group-hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.15)]'
              }`}>
                {/* Status Badges */}
                <div className="absolute top-5 right-5 flex flex-col gap-2 z-10">
                  {isOwned && (
                    <div className={`${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'} px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1.5 border transition-all`}>
                      <CheckCircle2 size={12} /> {isActive ? 'ĐANG DÙNG' : (isGifted ? 'BẢN GIỚI HẠN' : 'ĐÃ SỞ HỮU')}
                    </div>
                  )}
                  {isLocked && (
                    <div className="bg-slate-500/10 text-slate-500 px-3 py-1.5 rounded-full text-[9px] font-black flex items-center gap-1.5 border border-slate-500/20">
                      <Lock size={12} /> LEVEL {item.minLevel}
                    </div>
                  )}
                </div>

                {/* Decorative Background Icon */}
                <div className="absolute -bottom-4 -right-4 text-8xl opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700 select-none">
                  {item.icon}
                </div>

                {/* Icon Container */}
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl mb-8 transition-all duration-500 relative ${
                  isDark ? 'bg-slate-800/50 shadow-inner' : 'bg-slate-50 shadow-sm'
                } ${!isLocked ? 'group-hover:rotate-[15deg] group-hover:scale-110' : ''}`}>
                   {/* Ambient Glow */}
                   {!isLocked && (
                     <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                   )}
                  <span className="relative z-10">{item.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 relative z-10">
                  <h5 className="font-black text-base mb-2 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">{item.name}</h5>
                  <p className={`text-[11px] font-medium leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.desc}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-500/10 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Giá trị</span>
                    <span className={`text-base font-black ${canAfford || isOwned ? 'text-yellow-500' : 'text-red-400'}`}>
                      {isOwned ? 'PREMIUM' : `${item.price.toLocaleString()} TTG`}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (isOwned && isTheme) {
                        onUpdateSettings({ activeThemeId: isActive ? '' : item.id });
                      } else {
                        onBuyItem(item.id);
                      }
                    }}
                    disabled={isLocked || (!canAfford && !isOwned) || (isOwned && !isTheme)}
                    className={`px-6 py-3 rounded-2xl font-black text-[11px] transition-all duration-300 transform active:scale-90 ${
                      isOwned 
                        ? (isTheme ? (isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:shadow-xl' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/25 hover:-translate-y-1') : 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-default shadow-none')
                        : (isLocked ? 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 shadow-none' : 
                          (canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/25 hover:-translate-y-1' : 'bg-red-50 text-red-300 dark:bg-red-900/10 shadow-none cursor-not-allowed'))
                    }`}
                  >
                    {isOwned 
                      ? (isTheme ? (isActive ? 'GỠ THEME' : 'SỬ DỤNG') : (isGifted ? 'BẢN QUYỀN' : 'ĐÃ CÓ')) 
                      : (isLocked ? `LV. ${item.minLevel}` : (canAfford ? 'MUA NGAY' : 'CẦN GOLD'))
                    }
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Chưa có vật phẩm nào trong mục này</p>
        </div>
      )}
    </div>
  );
}
