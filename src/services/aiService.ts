import { callGemini } from './ai';
import { safeJsonParse, Task, UserData } from '../utils/helpers';

export const generateTaskSummary = async (tasks: Task[], userData: UserData): Promise<string> => {
  const summarizedTasks = tasks.slice(0, 20);
  const dataStr = summarizedTasks.map(t => `- [${t.status === 'completed' ? 'X' : ' '}] ${t.title} (Người làm: ${t.assigneeName || 'Chưa gán'}, Hạn: ${t.deadline ? new Date(t.deadline).toLocaleDateString('vi') : 'Không'})`).join('\n');

  const titTasks = tasks.filter(t => t.assigneeId === 'tit');
  const tunTasks = tasks.filter(t => t.assigneeId === 'tun');
  const titDone = titTasks.filter(t => t.status === 'completed').length;
  const tunDone = tunTasks.filter(t => t.status === 'completed').length;

  let systemPrompt = "Bạn là quản lý dự án dễ thương của cặp đôi Tít & Tún.";
  if (userData.aiMode === 'sassy') {
    systemPrompt = "Bạn là quản lý dự án cực kỳ 'cà khịa', hài hước và hay châm chọc cặp đôi Tít & Tún nhưng vẫn rất yêu quý họ. Hãy viết báo cáo thật mặn mòi.";
  }

  const prompt = `Đây là danh sách công việc của Team Tít & Tún (tối đa 20 việc gần nhất):\n${dataStr}\n\nTổng: ${tasks.length} việc, Xong: ${tasks.filter(t => t.status === 'completed').length}, Đang chạy: ${tasks.filter(t => t.status === 'running').length}\nTít: ${titDone}/${titTasks.length} xong. Tún: ${tunDone}/${tunTasks.length} xong.\n\nHãy viết 1 đoạn văn (4-5 câu) bằng tiếng Việt đánh giá tiến độ. Nếu ở chế độ 'cà khịa', hãy châm chọc sự lười biếng hoặc khen ngợi một cách đầy muối. Gọi tên Tít và Tún trực tiếp.`;

  return await callGemini(prompt, systemPrompt, 0, {
    model: userData.aiMode, // Wait, in the JS it was userData.aiModel. Let me check UserData.
    maxPromptChars: 2200,
    maxSystemChars: 700,
    useCache: true,
    cacheTtlMs: 3 * 60 * 1000
  });
};

export const suggestSubTasks = async (title: string, options: { model?: string } = {}): Promise<string[]> => {
  const prompt = `Bạn là trợ lý lập kế hoạch. Hãy phân tích công việc sau và đề xuất TỐI ĐA 5 bước thực hiện ngắn gọn, rõ ràng, dễ hành động. Trả lời ĐÚNG định dạng JSON array of strings, ví dụ: ["Bước 1", "Bước 2"]. Không giải thích thêm gì.\n\nCông việc: "${title}"`;
  
  const result = await callGemini(prompt, "", 0, {
    model: options.model,
    maxPromptChars: 1200,
    useCache: true,
    cacheTtlMs: 30 * 60 * 1000
  });
  const parsed = safeJsonParse(result, []);
  if (Array.isArray(parsed)) {
    return parsed.slice(0, 5).filter((item) => typeof item === 'string' && item.trim().length > 0);
  }
  return [];
};
