import { db, appId } from '../firebase';
import { callGemini } from './ai';
import { safeJsonParse, Task } from '../utils/helpers';
import { doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';

const questDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'daily_quests', 'current');

export interface DailyQuest {
  title: string;
  goal: string;
  rewardGold: number;
  deadline: string;
  tone: 'cute' | 'sassy';
  dateKey: string;
  updatedAt: number;
  isCompleted?: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: number;
}

export const subscribeToDailyQuest = (
  callback: (data: DailyQuest | null) => void, 
  onError?: (error: any) => void
): Unsubscribe =>
  onSnapshot(
    questDocRef,
    (snapshot) => callback(snapshot.exists() ? snapshot.data() as DailyQuest : null),
    (error) => onError?.(error)
  );

export const ensureDailyQuest = async (tasks: Task[] = [], options: { model?: string } = {}): Promise<DailyQuest> => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const taskSummary = tasks
    .slice(0, 20)
    .map((task) => `- ${task.title} [${task.priority || 'medium'}] (${task.status || 'idle'})`)
    .join('\n');

  const prompt = `Bạn là game master cho app quản lý task của cặp đôi. Tạo 1 nhiệm vụ chung trong ngày.
Trả về JSON object đúng format:
{"title":"...","goal":"...","rewardGold":500,"deadline":"12:00","tone":"cute|sassy"}

Yêu cầu:
- Nhiệm vụ có thể hoàn thành trong ngày.
- Reward từ 200-700.
- Dựa một phần vào dữ liệu task hiện tại nếu có.

Danh sách task:
${taskSummary || 'Không có task nào.'}`;

  const raw = await callGemini(prompt, 'Bạn tạo daily quest ngắn gọn, hành động được.', 0, {
    model: options.model,
    maxPromptChars: 1800,
    maxSystemChars: 500,
    useCache: true,
    cacheTtlMs: 10 * 60 * 1000
  });
  
  const parsed = safeJsonParse(raw, {
    title: 'Cùng hoàn thành 3 việc trước 12h',
    goal: 'Mỗi người ít nhất 1 task hoàn thành trước buổi trưa',
    rewardGold: 500,
    deadline: '12:00',
    tone: 'cute'
  });

  const payload: DailyQuest = {
    ...parsed,
    dateKey: todayKey,
    updatedAt: Date.now()
  };

  await setDoc(questDocRef, payload, { merge: true });
  return payload;
};

export const completeDailyQuest = async (quest: DailyQuest | null, userId: string, userName: string): Promise<Partial<DailyQuest> | undefined> => {
  if (!quest || quest.isCompleted) return;
  const payload = {
    isCompleted: true,
    completedBy: userId,
    completedByName: userName,
    completedAt: Date.now()
  };
  await setDoc(questDocRef, payload, { merge: true });
  return payload;
};
