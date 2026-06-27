import { supabase } from '../supabase';
import { callGemini } from './ai';
import { safeJsonParse, Task } from '../utils/helpers';

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
) => {
  supabase
    .from('daily_quests')
    .select('*')
    .eq('id', 'current')
    .single()
    .then(({ data, error }) => {
      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
        if (onError) onError(error);
        return;
      }
      if (data) {
        callback({
          title: data.title,
          goal: data.goal,
          rewardGold: data.reward_gold,
          deadline: data.deadline,
          tone: data.tone,
          dateKey: data.date_key,
          updatedAt: data.updated_at,
          isCompleted: data.is_completed,
          completedBy: data.completed_by,
          completedByName: data.completed_by_name,
          completedAt: data.completed_at
        } as DailyQuest);
      } else {
        callback(null);
      }
    });

  const channel = supabase.channel('public:daily_quests')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_quests', filter: 'id=eq.current' }, (payload: any) => {
      const data = payload.new;
      if (data) {
        callback({
          title: data.title,
          goal: data.goal,
          rewardGold: data.reward_gold,
          deadline: data.deadline,
          tone: data.tone,
          dateKey: data.date_key,
          updatedAt: data.updated_at,
          isCompleted: data.is_completed,
          completedBy: data.completed_by,
          completedByName: data.completed_by_name,
          completedAt: data.completed_at
        } as DailyQuest);
      } else {
        callback(null);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

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

  await supabase.from('daily_quests').upsert({
    id: 'current',
    title: payload.title,
    goal: payload.goal,
    reward_gold: payload.rewardGold,
    deadline: payload.deadline,
    tone: payload.tone,
    date_key: payload.dateKey,
    updated_at: payload.updatedAt,
    is_completed: false,
    completed_by: null,
    completed_by_name: null,
    completed_at: null
  });

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
  await supabase.from('daily_quests').update({
    is_completed: payload.isCompleted,
    completed_by: payload.completedBy,
    completed_by_name: payload.completedByName,
    completed_at: payload.completedAt
  }).eq('id', 'current');
  return payload;
};
