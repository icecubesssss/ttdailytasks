import React from 'react';
import { SHOP_ITEMS } from '../../utils/constants';

export default function ShopView({ userData, levelInfo, isDark, onBuyItem }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SHOP_ITEMS.map(item => {
          const isLocked = (levelInfo.level || 1) < (item.minLevel || 1);
          const canAfford = (userData?.ttGold || 0) >= item.price;
          const isOwned = userData.ownedItemIds?.includes(item.id) && item.type !== 'ticket';

          return (
            <div key={item.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all relative overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} ${isLocked ? 'opacity-70 grayscale' : ''}`}>
              <div className="flex items-center gap-4 relative z-10 w-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'} ${isLocked ? '' : 'animate-float'}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h5 className="font-black text-sm">{item.name}</h5>
                  <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} line-clamp-1`}>{item.desc}</p>
                  <p className={`text-[11px] font-black mt-1 ${canAfford ? 'text-yellow-500' : 'text-red-400'}`}>💰 {item.price} TTG</p>
                </div>
                <button
                  onClick={() => onBuyItem(item)}
                  disabled={isLocked || !canAfford || isOwned}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all whitespace-nowrap ${isOwned ? 'bg-emerald-500 text-white' : (!isLocked && canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50')}`}
                >
                  {isLocked ? `LEVEL ${item.minLevel}` : (isOwned ? 'ĐÃ CÓ' : 'MUA NGAY')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
