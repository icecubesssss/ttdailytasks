import React from 'react';
import { X, Scissors, Sparkles, User2, CheckCircle2 } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail } from '../../utils/helpers';
import { DEFAULT_AVATARS, FASHION_OPTIONS } from '../../utils/constants';
import type { UserData, LevelInfo, FashionOption } from '../../utils/helpers';

interface ClosetViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  userEmail: string;
  onEquipItem: (category: string, value: string) => void;
  onClose: () => void;
}

const WARDROBE_CATEGORIES = ['hair', 'hairColor', 'skinColor', 'eyes', 'mouth', 'facialHair', 'body', 'clothingColor'];

const getAvatarPreviewSrc = (userData, userEmail) => {
  const avatarConfig = userData.avatarConfig || DEFAULT_AVATARS[getAssigneeIdByEmail(userEmail)] || { seed: userData.displayName };
  const cacheKey = avatarConfig.avatarVersion ?? JSON.stringify(avatarConfig);
  return `${getAvatarUrl(avatarConfig)}&v=${encodeURIComponent(cacheKey)}`;
};

export default function ClosetView({ userData, levelInfo, isDark, userEmail, onEquipItem, onClose }: ClosetViewProps) {
  const avatarPreviewSrc = getAvatarPreviewSrc(userData, userEmail);

  return (
    <div className="animate-in slide-in-from-right-8 duration-500 space-y-8 pb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter">Phòng Thay Đồ</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 p-8 rounded-[3rem] ${isDark ? 'bg-slate-900/80 border border-slate-800' : 'bg-white border border-slate-100 shadow-xl'} flex flex-col items-center justify-center text-center sticky top-20`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Diện mạo hiện tại</p>
          <div className={`relative mb-8 ${userData.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}>
            <img
              src={avatarPreviewSrc}
              className="w-48 h-48 rounded-full border-4 border-indigo-500 shadow-2xl shadow-indigo-500/30"
              alt="Avatar Preview"
            />
          </div>
          <h3 className="text-xl font-black mb-1">{userData.displayName}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-outfit">Lv.{levelInfo.level} Fashionista</p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {WARDROBE_CATEGORIES.map(cat => (
            <div key={cat} className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
              <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                {cat === 'hair' ? <Scissors size={14} /> :
                  cat.includes('Color') ? <Sparkles size={14} /> :
                    cat === 'eyes' ? <Sparkles size={14} /> : <User2 size={14} />}
                {cat.toUpperCase()}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FASHION_OPTIONS[cat].map(item => {
                  const isEquipped = userData.avatarConfig?.[cat] === item.value;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onEquipItem(cat, item.value)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative ${isEquipped ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-400'}`}
                    >
                      {cat.toLowerCase().includes('color') ? (
                        <div className={`w-8 h-8 rounded-full border border-white/20`} style={{ backgroundColor: `#${item.value}` }}></div>
                      ) : (
                        <span className="text-2xl">{item.icon}</span>
                      )}
                      <span className="text-[9px] font-black uppercase text-center leading-tight">{item.name}</span>
                      {isEquipped && <div className="absolute top-1 right-1"><CheckCircle2 size={12} className="text-indigo-500" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
