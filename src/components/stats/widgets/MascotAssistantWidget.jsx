import React from 'react';
import { Bot } from 'lucide-react';
import Card from '../../../shared/Card';
import Button from '../../../shared/Button';

const buildMessage = ({ aiMode, currentTab, tasks, streak, duoActive, mascotName }) => {
  const running = tasks.filter((task) => task.status === 'running').length;
  const done = tasks.filter((task) => task.status?.startsWith('completed')).length;

  if (aiMode === 'sassy') {
    if (duoActive) return `${mascotName}: Hai đứa đang tập trung ngon đấy. Đừng để nửa chừng rồi lặn nhé.`;
    if (running === 0) return `${mascotName}: Bảng task đang yên ắng ghê. Bấm Start đi nào, hero ơi.`;
    return `${mascotName}: ${done} task xong rồi, còn lại xử luôn cho trọn combo hôm nay.`;
  }

  if (duoActive) return `${mascotName}: Cả hai đang cố gắng cùng nhau, tuyệt lắm!`;
  if (currentTab === 'calendar') return `${mascotName}: Hôm nay có lịch dày, nhớ chừa slot nghỉ ngắn nha.`;
  if (streak >= 7) return `${mascotName}: Streak ${streak} ngày rồi, giữ nhịp thật đẹp nhé!`;
  return `${mascotName}: Mình gợi ý bắt đầu từ task quan trọng nhất để lấy đà nha.`;
};

export default function MascotAssistantWidget({
  isDark,
  userData,
  currentTab,
  tasks,
  duoActive,
  onRename,
  onChangeAvatar
}) {
  const mascotName = userData.mascotName || 'Mochi';
  const mascotAvatar = userData.mascotAvatar || '🤖';
  const message = buildMessage({
    aiMode: userData.aiMode,
    currentTab,
    tasks,
    streak: userData.streak || 0,
    duoActive,
    mascotName
  });

  return (
    <Card isDark={isDark} className="md:col-span-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
          <Bot size={16} className="text-cyan-500" /> Mascot AI Assistant
        </h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onRename} className="!text-[10px]">Đổi tên</Button>
          <Button variant="ghost" onClick={onChangeAvatar} className="!text-[10px]">Đổi avatar</Button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-2xl">{mascotAvatar}</div>
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
          {message}
        </div>
      </div>
    </Card>
  );
}
