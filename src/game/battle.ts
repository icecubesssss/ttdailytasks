/**
 * Battle logic — chí mạng, điểm yếu boss theo ngày.
 * Kiến trúc battle scene học từ các repo Pokémon mã nguồn mở:
 * hàng đợi sự kiện tuần tự + chạm-để-tiếp-tục + khóa input khi đang animation.
 */

/** Chí mạng: streak càng dài đánh càng hiểm. 10% gốc +2%/ngày chuỗi, trần 35%. */
export const critChance = (streak: number): number =>
  Math.min(0.1 + streak * 0.02, 0.35);

export interface CritRoll {
  isCrit: boolean;
  /** Ngày Phục Thù: chí mạng chắc chắn (never miss twice phải đã tay) */
  guaranteed: boolean;
}

export const rollCrit = (streak: number, revengeDay: boolean): CritRoll => {
  if (revengeDay) return { isCrit: true, guaranteed: true };
  return { isCrit: Math.random() < critChance(streak), guaranteed: false };
};

/** Chí mạng nhân đôi damage lên Boss Tuần */
export const CRIT_BOSS_MULTIPLIER = 2;

/** Điểm yếu của boss hôm nay — deterministic theo ngày, 2 máy ra cùng kết quả */
export type BossWeakness = 'task' | 'habit';

export const bossWeaknessOfDay = (dateKey: string): BossWeakness => {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? 'task' : 'habit';
};

export const BOSS_WEAKNESS_MULTIPLIER = 2;

/** Boss hồi máu mỗi ngày cả hai cùng lười (không ai gây damage) */
export const BOSS_IDLE_HEAL_PER_DAY = 5;

/** Phase của boss theo % máu còn lại — đổi thái độ và hiệu ứng */
export interface BossPhase {
  label: string;
  /** aura màu (tailwind classes cho vòng sáng) */
  aura: string;
  mood: string;
}

export const bossPhase = (hpPercent: number): BossPhase => {
  if (hpPercent > 66) {
    return { label: 'UNG DUNG', aura: 'shadow-slate-500/30', mood: 'Boss còn khỏe, chưa coi hai bạn ra gì~' };
  }
  if (hpPercent > 33) {
    return { label: 'CẢNH GIÁC', aura: 'shadow-amber-500/50', mood: 'Boss bắt đầu thấm đòn, ra chiêu hiểm hơn!' };
  }
  if (hpPercent > 0) {
    return { label: 'CUỒNG NỘ', aura: 'shadow-rose-600/60', mood: 'Boss điên tiết! Dứt điểm ngay kẻo nó gượng dậy!' };
  }
  return { label: 'GỤC NGÃ', aura: 'shadow-emerald-500/50', mood: 'Boss đã bị hạ — nhận chiến lợi phẩm thôi!' };
};
