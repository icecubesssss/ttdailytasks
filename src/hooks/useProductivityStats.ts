import { useMemo } from 'react';
import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
  format, isSameDay, getHours, isWithinInterval, subWeeks, subMonths 
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Task, TeamMember, getLegacyIdByEmail } from '../utils/helpers';

const WEEK_STARTS_ON = 1;

export interface DistributionData {
  label: string;
  value: number;
  titMs: number;
  tunMs: number;
}

export interface HourData {
  tit: number;
  tun: number;
  total: number;
}

export interface ProductivityStats {
  sessions: number;
  totalFocus: string;
  titTotal: string;
  tunTotal: string;
  onTimeRate: number;
  lateCount: number;
  titLate: number;
  tunLate: number;
  changePct: number;
  distribution: DistributionData[];
  maxDist: number;
  hours: HourData[];
  maxHourMs: number;
  peakHour: number;
  bestDay: string;
  bestDayMs: string;
  totalFocusMs: number;
}

export function useProductivityStats(tasks: Task[], timeRange: 'week' | 'month', teamMembers: TeamMember[] = []): ProductivityStats {
  return useMemo(() => {
    const normalizeAssignee = (task: Task): 'tit' | 'tun' | 'unknown' => {
      const assigneeId = task.assigneeId?.toLowerCase().trim();
      const assigneeName = task.assigneeName?.toLowerCase().trim();

      if (assigneeId === 'tit' || assigneeId === 'tun') return assigneeId;
      if (assigneeId) {
        const memberByUid = teamMembers.find(m => m?.uid?.toLowerCase() === assigneeId);
        const legacyFromUid = getLegacyIdByEmail(memberByUid?.email);
        if (legacyFromUid === 'tit' || legacyFromUid === 'tun') return legacyFromUid;
      }

      if (assigneeName?.includes('tít') || assigneeName?.includes('tit')) return 'tit';
      if (assigneeName?.includes('tún') || assigneeName?.includes('tun')) return 'tun';

      return 'unknown';
    };

    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
    
    if (timeRange === 'week') {
      currentStart = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
      currentEnd = endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
      previousStart = subWeeks(currentStart, 1);
      previousEnd = subWeeks(currentEnd, 1);
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = subMonths(currentStart, 1);
      previousEnd = subMonths(currentEnd, 1);
    }

    const currentInterval = { start: currentStart, end: currentEnd };
    const previousInterval = { start: previousStart, end: previousEnd };
    const getTaskDate = (t: Task) => new Date(t.endTime || t.lastStartTime || t.createdAt || now);

    const currentTasks = tasks.filter(t => t.totalTrackedTime > 0 && isWithinInterval(getTaskDate(t), currentInterval));
    const previousTasks = tasks.filter(t => t.totalTrackedTime > 0 && isWithinInterval(getTaskDate(t), previousInterval));

    const totalFocusMs = currentTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0);
    const prevTotalFocusMs = previousTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0);
    const sessions = currentTasks.length;

    const completedTasks = currentTasks.filter(t => t.status?.startsWith('completed'));
    const onTimeTasks = completedTasks.filter(t => t.status === 'completed');
    const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;

    const titTasks = currentTasks.filter(t => normalizeAssignee(t) === 'tit');
    const tunTasks = currentTasks.filter(t => normalizeAssignee(t) === 'tun');

    const formatTime = (ms: number) => {
      if (ms === 0) return '0m';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const distribution: DistributionData[] = [];
    if (timeRange === 'week') {
      eachDayOfInterval(currentInterval).forEach(d => {
        const dayTasks = currentTasks.filter(t => isSameDay(getTaskDate(t), d));
        const titMs = dayTasks.filter(t => normalizeAssignee(t) === 'tit').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        const tunMs = dayTasks.filter(t => normalizeAssignee(t) === 'tun').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        distribution.push({ label: format(d, 'EEE', { locale: vi }), value: titMs + tunMs, titMs, tunMs });
      });
    } else {
      let curr = currentStart;
      let weekNum = 1;
      while(curr <= currentEnd) {
        let eow = endOfWeek(curr, { weekStartsOn: WEEK_STARTS_ON });
        if(eow > currentEnd) eow = currentEnd;
        const weekTasks = currentTasks.filter(t => isWithinInterval(getTaskDate(t), {start: curr, end: eow}));
        const titMs = weekTasks.filter(t => normalizeAssignee(t) === 'tit').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        const tunMs = weekTasks.filter(t => normalizeAssignee(t) === 'tun').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        distribution.push({ label: `T${weekNum}`, value: titMs + tunMs, titMs, tunMs });
        curr = new Date(eow.getTime() + 86400000);
        weekNum++;
      }
    }

    const maxDist = Math.max(...distribution.map(d => d.value), 1);

    const hours: HourData[] = Array(24).fill(null).map(() => ({ tit: 0, tun: 0, total: 0 }));
    currentTasks.forEach(t => {
      const h = getHours(getTaskDate(t));
      const assignee = normalizeAssignee(t);
      if (assignee === 'tit') hours[h].tit += t.totalTrackedTime;
      else if (assignee === 'tun') hours[h].tun += t.totalTrackedTime;
      hours[h].total += t.totalTrackedTime;
    });
    const maxHourMs = Math.max(...hours.map(h => h.total), 1);
    const peakHour = hours.findIndex(h => h.total === maxHourMs);

    const changePct = prevTotalFocusMs > 0 ? Math.round(((totalFocusMs - prevTotalFocusMs) / prevTotalFocusMs) * 100) : (totalFocusMs > 0 ? 100 : 0);

    let bestDay = 'N/A', bestDayMsValue = 0;
    if (timeRange === 'week' && distribution.length > 0) {
      const best = [...distribution].sort((a,b) => b.value - a.value)[0];
      if (best.value > 0) { bestDay = best.label; bestDayMsValue = best.value; }
    }

    return {
      sessions,
      totalFocus: formatTime(totalFocusMs),
      titTotal: formatTime(titTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0)),
      tunTotal: formatTime(tunTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0)),
      onTimeRate,
      lateCount: currentTasks.filter(t => t.status === 'completed_late').length,
      titLate: titTasks.filter(t => t.status === 'completed_late').length,
      tunLate: tunTasks.filter(t => t.status === 'completed_late').length,
      changePct, distribution, maxDist, hours, maxHourMs, peakHour, bestDay,
      bestDayMs: formatTime(bestDayMsValue),
      totalFocusMs
    };
  }, [tasks, timeRange, teamMembers]);
}
