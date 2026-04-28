// utils/calendarUtils.ts
import { CalendarEvent } from './helpers';

export const HOUR_HEIGHT = 64;
export const DAY_START_HOUR = 5;
export const DAY_END_HOUR = 24;
export const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i + DAY_START_HOUR);

export interface OwnerStyle {
  gradient: string;
  dot: string;
  label: string;
}

export const OWNER_STYLES: Record<string, OwnerStyle> = {
  tit: { gradient: 'from-indigo-500 to-blue-600', dot: 'bg-indigo-500', label: 'Tít' },
  tun: { gradient: 'from-pink-500 to-rose-600', dot: 'bg-pink-500', label: 'Tún' },
};

export function parseGCalEvent(raw: any, owner: string): CalendarEvent {
  const start = raw.start?.dateTime
    ? new Date(raw.start.dateTime)
    : raw.start?.date ? new Date(raw.start.date + 'T00:00:00') : null;
  const end = raw.end?.dateTime
    ? new Date(raw.end.dateTime)
    : raw.end?.date ? new Date(raw.end.date + 'T23:59:59') : null;
  return {
    id: raw.id,
    title: raw.summary || '(Không tiêu đề)',
    start,
    end,
    isAllDay: !raw.start?.dateTime,
    owner,
    location: raw.location || null,
  };
}
