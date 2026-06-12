import {
  XP_PER_TASK, GOLD_PER_TASK, XP_PER_SUBTASK, GOLD_PER_SUBTASK
} from '../utils/constants';
import type { UserData } from '../utils/helpers';

/**
 * Reward Engine — nguồn công thức thưởng DUY NHẤT của app.
 * Cả optimistic UI (client) lẫn transaction Firestore đều phải tính qua đây
 * để hai bên không bao giờ lệch số.
 *
 * Nguyên tắc: với comboCount = 1 và không booster, kết quả PHẢI bằng đúng
 * công thức cũ (XP_PER_TASK/GOLD_PER_TASK) — không ai tự nhiên giàu lên/nghèo đi.
 */

// ── Combo trong ngày: task thứ 2, 3… liên tiếp được cộng thêm, trần x1.5 ──
export const COMBO_STEP = 0.1;
export const COMBO_MAX_MULTIPLIER = 1.5;

export const comboMultiplier = (comboCount: number): number =>
  Math.min(1 + Math.max(0, comboCount - 1) * COMBO_STEP, COMBO_MAX_MULTIPLIER);

export interface TaskRewardBase {
  xp: number;
  gold: number;
  comboMult: number;
}

/** Thưởng gốc cho 1 task (chưa gồm daily check-in, chưa gồm booster). */
export const computeTaskBaseReward = (isLate: boolean, comboCount = 1): TaskRewardBase => {
  const comboMult = comboMultiplier(comboCount);
  const xpBase = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
  return {
    xp: Math.round(xpBase * comboMult),
    gold: Math.round(GOLD_PER_TASK * comboMult),
    comboMult
  };
};

export interface BoostedReward {
  xp: number;
  gold: number;
}

/** Áp booster đang active (nếu còn hạn) lên lượng xp/gold. */
export const applyBooster = (
  xp: number,
  gold: number,
  booster: UserData['activeBooster']
): BoostedReward => {
  if (booster && Date.now() < booster.expiresAt) {
    if (booster.boosterType === 'xp') xp *= booster.multiplier;
    else if (booster.boosterType === 'gold') gold *= booster.multiplier;
  }
  return { xp: Math.round(xp), gold: Math.round(gold) };
};

/** Thưởng subtask (đã gồm booster — giữ đúng hành vi cũ của awardSubTaskRewards). */
export const computeSubtaskReward = (booster: UserData['activeBooster']): BoostedReward =>
  applyBooster(XP_PER_SUBTASK, GOLD_PER_SUBTASK, booster);

/**
 * Đếm combo hôm nay: số task user đã hoàn thành trong ngày (kể cả task vừa xong).
 * Truyền vào danh sách endTime của các task completed của user.
 */
export const countComboToday = (completedEndTimes: Array<number | undefined>, now = Date.now()): number => {
  const today = new Date(now).toDateString();
  const doneToday = completedEndTimes.filter(
    (t) => typeof t === 'number' && new Date(t).toDateString() === today
  ).length;
  return doneToday + 1; // +1 cho task vừa hoàn thành
};
