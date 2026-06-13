/**
 * Habit Engine — toàn bộ chỉ số thói quen DERIVE từ history bằng hàm thuần.
 * Không lưu counter/streak vào Firestore (tránh bug mirror-clobber như streak cũ).
 *
 * Điểm tự động hóa dùng exponential smoothing (mô tả công khai của Loop Habit
 * Tracker, viết lại từ công thức toán — không copy code GPL): làm đều mỗi ngày
 * đạt ~80% sau 1 tháng, ~96% sau 2 tháng. Lỡ vài ngày chỉ tụt nhẹ, không về 0.
 */

/**
 * 'done'/'tiny'/'skip' cho thói quen solo.
 * 'tit'/'tun' cho thói quen ĐÔI: một người đã check, chờ người kia — đủ cả hai
 * thì giá trị chuyển thành 'done'.
 */
export type CheckValue = 'done' | 'tiny' | 'skip' | 'tit' | 'tun';
export type HabitHistory = Record<string, CheckValue>;

/** Phong ấn: 66 ngày (nghiên cứu Lally) + độ thuần hóa đủ cao */
export const SEAL_DAYS = 66;
export const SEAL_AUTOMATICITY = 0.8;

export interface HabitLike {
  history: HabitHistory;
  createdAt: number;
}

const DAY_MS = 86400000;

/** Hệ số làm mượt cho thói quen hàng ngày: 0.5^(1/13) — half-life 13 ngày */
export const DAILY_SMOOTHING = Math.pow(0.5, 1 / 13);

/** Cửa sổ tính toán — đủ dài để score hội tụ, đủ ngắn để rẻ */
export const HISTORY_WINDOW_DAYS = 180;

/** Key ngày theo giờ ĐỊA PHƯƠNG, dạng YYYY-MM-DD (không dùng toISOString — lệch UTC) */
export const getDayKey = (d: Date | number = Date.now()): string => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getTodayKey = (): string => getDayKey();
export const getYesterdayKey = (now = Date.now()): string => getDayKey(now - DAY_MS);

/** Giá trị 1 ngày đóng góp vào điểm tự động hóa */
const checkScore = (value: CheckValue | undefined): number | null => {
  if (value === 'done') return 1;
  if (value === 'tiny') return 0.5; // đòn nhẹ: giữ vòng lặp sống, sức mạnh một nửa
  if (value === 'tit' || value === 'tun') return 0.5; // duo mới 1 người check
  if (value === 'skip') return null; // ngày nghỉ chủ động: không cộng không trừ
  return 0; // bỏ lỡ
};

/**
 * Điểm tự động hóa 0..1.
 * Tính từ ngày tạo thói quen đến HÔM QUA; hôm nay chỉ tính khi đã điểm danh
 * (giữa ngày chưa check không bị coi là "lỡ").
 */
export const computeAutomaticity = (habit: HabitLike, now = Date.now()): number => {
  const startMs = Math.max(habit.createdAt, now - HISTORY_WINDOW_DAYS * DAY_MS);
  const todayKey = getDayKey(now);
  let score = 0;

  for (let t = startMs; getDayKey(t) < todayKey; t += DAY_MS) {
    const value = checkScore(habit.history[getDayKey(t)]);
    if (value === null) continue;
    score = score * DAILY_SMOOTHING + value * (1 - DAILY_SMOOTHING);
  }

  const todayValue = checkScore(habit.history[todayKey]);
  if (todayValue !== null && habit.history[todayKey] !== undefined) {
    score = score * DAILY_SMOOTHING + todayValue * (1 - DAILY_SMOOTHING);
  }

  return Math.min(1, Math.max(0, score));
};

/** HP của quái = phần "chưa tự động" của thói quen */
export const monsterHpPercent = (automaticity: number): number =>
  Math.round((1 - automaticity) * 100);

/** Giai đoạn hình ảnh của quái: 0 hung hăng → 3 teo tóp */
export const monsterStage = (automaticity: number): 0 | 1 | 2 | 3 => {
  if (automaticity >= 0.85) return 3;
  if (automaticity >= 0.55) return 2;
  if (automaticity >= 0.25) return 1;
  return 0;
};

/** Sát thương hiển thị của 1 đòn = mức HP quái sẽ mất nếu check hôm nay */
export const previewDamage = (habit: HabitLike, mode: 'done' | 'tiny', now = Date.now()): number => {
  const current = computeAutomaticity(habit, now);
  const value = mode === 'done' ? 1 : 0.5;
  const next = current * DAILY_SMOOTHING + value * (1 - DAILY_SMOOTHING);
  return Math.max(1, Math.round((next - current) * 100));
};

/** Chuỗi ngày liên tiếp (done/tiny; skip cho đi qua). Hôm nay chưa check thì tính từ hôm qua. */
export const computeHabitStreak = (history: HabitHistory, now = Date.now()): number => {
  let streak = 0;
  let t = now;
  if (history[getDayKey(now)] === undefined) t = now - DAY_MS; // hôm nay chưa check: chưa mất chuỗi

  for (;;) {
    const value = history[getDayKey(t)];
    if (value === 'done' || value === 'tiny') streak += 1;
    else if (value === 'skip' || value === 'tit' || value === 'tun') {
      // ngày nghỉ / duo mới 1 người: không cộng nhưng không đứt
    } else break;
    t -= DAY_MS;
  }
  return streak;
};

/** Đủ điều kiện phong ấn: sống đủ 66 ngày + độ thuần hóa cao */
export const isSealable = (habit: HabitLike, now = Date.now()): boolean =>
  now - habit.createdAt >= SEAL_DAYS * DAY_MS &&
  computeAutomaticity(habit, now) >= SEAL_AUTOMATICITY;

/** Số ngày đã chiến đấu với quái */
export const daysSinceCreated = (habit: HabitLike, now = Date.now()): number =>
  Math.floor((now - habit.createdAt) / DAY_MS) + 1;

/**
 * "Ngày Phục Thù" (never miss twice): hôm qua lỡ, hôm kia có làm,
 * hôm nay chưa check → hôm nay là ngày quyết định để không thành chuỗi xấu.
 */
export const isRevengeDay = (history: HabitHistory, now = Date.now()): boolean => {
  if (history[getDayKey(now)] !== undefined) return false;
  const yesterday = history[getDayKey(now - DAY_MS)];
  const dayBefore = history[getDayKey(now - 2 * DAY_MS)];
  return yesterday === undefined && (dayBefore === 'done' || dayBefore === 'tiny');
};

/** N ngày gần nhất (cũ → mới) để vẽ dải chấm */
export const lastNDays = (
  history: HabitHistory,
  n: number,
  now = Date.now()
): Array<{ key: string; value: CheckValue | undefined; isToday: boolean }> => {
  const out: Array<{ key: string; value: CheckValue | undefined; isToday: boolean }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = getDayKey(now - i * DAY_MS);
    out.push({ key, value: history[key], isToday: i === 0 });
  }
  return out;
};

/** Chỉ cho điểm danh hôm nay hoặc hôm qua (chống backfill farm streak) */
export const isCheckableDay = (dateKey: string, now = Date.now()): boolean =>
  dateKey === getDayKey(now) || dateKey === getYesterdayKey(now);

/** Ngày này ĐÃ check đối với người này chưa (duo: phần mình hoặc cả hai) */
export const isCheckedForActor = (
  history: HabitHistory,
  isDuo: boolean,
  actorKey: string | null,
  dateKey: string
): boolean => {
  const value = history[dateKey];
  if (value === undefined) return false;
  if (isDuo) return value === 'done' || value === actorKey;
  return true;
};
