import React from 'react';
import { Flame } from 'lucide-react';
import Card from '../../../shared/Card';
import Badge from '../../../shared/Badge';

const getTrackedMs = (task, now) => {
  if (!task) return 0;
  const base = task.totalTrackedTime || 0;
  if (task.status === 'running' && task.lastStartTime) return base + (now - task.lastStartTime);
  return base;
};

const fmt = (ms) => new Date(Math.max(0, ms)).toISOString().substr(11, 8).replace(/^00:/, '');

export default function DuoFocusWidget({ isDark, myTask, partnerTask, myName, partnerName, now }) {
  if (!myTask || !partnerTask) return null;

  const myMs = getTrackedMs(myTask, now);
  const partnerMs = getTrackedMs(partnerTask, now);
  const total = Math.max(myMs, partnerMs, 1);

  return (
    <Card isDark={isDark} className="md:col-span-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
          <Flame size={16} className="text-orange-500" /> Tít/Tún cũng đang cố gắng!
        </h4>
        <Badge className={isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'}>
          Song hành realtime
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span>{myName}</span><span>{fmt(myMs)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700/30 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(myMs / total) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span>{partnerName}</span><span>{fmt(partnerMs)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700/30 overflow-hidden">
            <div className="h-full bg-fuchsia-500 rounded-full transition-all duration-500" style={{ width: `${(partnerMs / total) * 100}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}
