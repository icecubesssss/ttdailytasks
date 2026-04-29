import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail, Task, TeamMember, AvatarConfig } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';

type PartnerInfo = TeamMember | { displayName: string; email: string; avatarConfig?: AvatarConfig | null };

interface DuoFocusBannerProps {
  task?: Task;
  partnerInfo?: PartnerInfo;
  now: number;
  isDark: boolean;
}

export default function DuoFocusBanner({ task, partnerInfo, now, isDark }: DuoFocusBannerProps) {
  if (!task || !partnerInfo) return null;

  const calculateDuration = () => {
    let total = task.totalTrackedTime || 0;
    if (task.status === 'running' && task.lastStartTime) {
      total += now - task.lastStartTime;
    }
    return Math.max(0, total);
  };

  const durationStr = new Date(calculateDuration()).toISOString().substr(11, 8).replace(/^00:/, '');

  const partnerAvatarKey = getAssigneeIdByEmail(partnerInfo.email);
  const partnerAvatarUrl = getAvatarUrl(
    partnerInfo.avatarConfig || (partnerAvatarKey ? DEFAULT_AVATARS[partnerAvatarKey] : undefined) || {}
  );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 p-3 pr-5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
        isDark
          ? 'bg-slate-900/80 border-indigo-500/30 shadow-indigo-500/10'
          : 'bg-white/90 border-indigo-200 shadow-indigo-500/20'
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur animate-pulse opacity-50"></div>
        <img
          src={partnerAvatarUrl}
          alt={partnerInfo.displayName}
          className="relative w-10 h-10 rounded-full border-2 border-indigo-400 object-cover"
        />
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
          <Flame size={12} className="text-orange-500 animate-pulse" fill="currentColor" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            Tít/Tún cũng đang cố gắng!
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-sm font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {task.title}
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {durationStr}
          </span>
        </div>
      </div>
    </Motion.div>
  );
}
