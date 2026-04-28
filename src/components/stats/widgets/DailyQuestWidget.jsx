import React from 'react';
import { Sparkles, Coins, Check } from 'lucide-react';
import Card from '../../../shared/Card';
import Badge from '../../../shared/Badge';
import Button from '../../../shared/Button';

export default function DailyQuestWidget({ isDark, quest, onRefresh, onComplete }) {
  const isCompleted = quest?.isCompleted;

  return (
    <Card isDark={isDark} className={`md:col-span-6 relative overflow-hidden transition-all duration-500 ${isCompleted ? 'border-emerald-500/30' : ''}`}>
      <div className={`absolute -right-6 -top-4 transition-colors duration-500 ${isCompleted ? 'text-emerald-500/10' : 'text-fuchsia-500/10'}`}>
        <Sparkles size={110} />
      </div>
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className={isCompleted ? 'text-emerald-500' : 'text-violet-500'} />
            AI Daily Quest
          </h4>
          <div className="flex items-center gap-2">
            <Badge className={isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'}>
              {quest?.dateKey || 'Hôm nay'}
            </Badge>
            {!isCompleted && (
              <Button variant="ghost" onClick={onRefresh} className="!text-[10px]">
                Làm mới quest
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <p className={`font-black text-lg leading-snug mb-2 ${isCompleted ? 'line-through opacity-50' : ''}`}>
              {quest?.title || 'Cùng hoàn thành 3 việc trước 12h trưa'}
            </p>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'} ${isCompleted ? 'opacity-50' : ''}`}>
              {quest?.goal || 'Mỗi người xử lý ít nhất 1 task quan trọng trong buổi sáng.'}
            </p>

            <div className="flex items-center gap-2">
              <Badge className={isCompleted ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}>
                <Coins size={12} /> {isCompleted ? 'Đã nhận' : `+${quest?.rewardGold || 500}`} Gold
              </Badge>
              <Badge className={isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}>
                {isCompleted ? `Xong lúc ${new Date(quest.completedAt).toLocaleTimeString('vi', {hour:'2-digit', minute:'2-digit'})}` : `Deadline ${quest?.deadline || '12:00'}`}
              </Badge>
            </div>
          </div>

          {isCompleted ? (
            <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Check size={16} /> Hoàn thành bởi {quest.completedByName}
            </div>
          ) : (
            <button 
              onClick={onComplete}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Xác nhận hoàn thành
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
