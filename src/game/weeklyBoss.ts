/**
 * Boss Tuần — mục tiêu chung của cả hai: MỌI task hoàn thành và MỌI lần đánh quái
 * của cả Tít lẫn Tún đều trừ máu boss. Hạ xong mỗi người nhận pot vàng.
 * Đây là cơ chế "party quest" (Habitica) thu nhỏ cho 2 người.
 */

export interface WeeklyBossConfig {
  id: string;
  name: string;
  emoji: string;
  intro: string;
  defeatLine: string;
}

export const BOSS_ROSTER: WeeklyBossConfig[] = [
  {
    id: 'luoi_vuong',
    name: 'Lười Vương',
    emoji: '🦥',
    intro: 'Khừm... tuần này cứ từ từ, việc đâu có chạy đi đâu~',
    defeatLine: 'Hai đứa này... chăm gì mà chăm dữ vậy... 😵'
  },
  {
    id: 'rong_deadline',
    name: 'Rồng Deadline',
    emoji: '🐲',
    intro: 'GRAOO! Deadline của các ngươi là bữa sáng của ta!',
    defeatLine: 'Không thể nào... các ngươi xong việc ĐÚNG HẠN?!'
  },
  {
    id: 'ba_tuoc_tri_tre',
    name: 'Bá Tước Trì Trệ',
    emoji: '🧛',
    intro: 'Ta sống bằng những việc "để mai tính" của các ngươi, khe khe~',
    defeatLine: 'Năng suất... ánh sáng năng suất... chói quá... 🦇'
  },
  {
    id: 'quy_bua_bon',
    name: 'Quỷ Bừa Bộn',
    emoji: '👹',
    intro: 'Kế hoạch là để vứt xó! Cứ rối tung lên cho ta!',
    defeatLine: 'Ngăn nắp vậy thì ta sống sao nổi... 😵'
  },
  {
    id: 'ma_xao_nhang',
    name: 'Ma Xao Nhãng',
    emoji: '🎭',
    intro: 'Ơ kìa nhìn gì đó kìa— mất tập trung chưa? Hehe~',
    defeatLine: 'Focus của hai người... đáng sợ thật... 💨'
  }
];

export const WEEKLY_BOSS_MAX_HP = 100;
export const WEEKLY_BOSS_REWARD_GOLD = 300;

// Sát thương từng hành động
export const BOSS_DMG_TASK = 3;
export const BOSS_DMG_TASK_LATE = 1;
export const BOSS_DMG_HABIT = 1;
export const BOSS_DMG_DUO_COMPLETE = 2;

/** Key tuần ISO-8601 dạng 2026-W24 (tuần bắt đầu thứ 2) */
export const getWeekKey = (now = Date.now()): string => {
  const d = new Date(now);
  // Chuyển về thứ 5 của tuần hiện tại (chuẩn ISO xác định năm-tuần)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNum = (target.getDay() + 6) % 7; // T2=0..CN=6
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const getBossById = (id: string): WeeklyBossConfig =>
  BOSS_ROSTER.find((b) => b.id === id) || BOSS_ROSTER[0];

/** Boss của tuần — chọn ổn định theo hash của weekKey để 2 máy ra cùng 1 boss */
export const pickBossForWeek = (weekKey: string): WeeklyBossConfig => {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) {
    hash = (hash * 31 + weekKey.charCodeAt(i)) | 0;
  }
  return BOSS_ROSTER[Math.abs(hash) % BOSS_ROSTER.length];
};

/** Còn lại bao nhiêu ngày trong tuần (đến hết Chủ nhật) */
export const daysLeftInWeek = (now = Date.now()): number => {
  const d = new Date(now);
  const dayNum = (d.getDay() + 6) % 7; // T2=0..CN=6
  return 7 - dayNum;
};
