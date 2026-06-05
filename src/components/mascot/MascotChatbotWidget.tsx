import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Zap, Flame, Loader2 } from 'lucide-react';
import { callGemini } from '../../services/ai';
import type { Task, UserData, TeamMember } from '../../utils/helpers';

interface MascotChatbotWidgetProps {
  userData: UserData;
  tasks: Task[];
  teamMembers?: TeamMember[];
}

export default function MascotChatbotWidget({
  userData,
  tasks,
  teamMembers = []
}: MascotChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mascotName = userData.mascotName || 'Mochi';
  const mascotAvatar = userData.mascotAvatar || '🤖';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      let systemPrompt = `Bạn là ${mascotName}, trợ lý dự án của team Tít & Tún. `;
      if (userData.aiMode === 'sassy') {
        systemPrompt += "Bạn có tính cách 'cà khịa', hài hước và hay châm chọc nhưng rất tinh tế và giỏi chuyên môn. ";
      } else {
        systemPrompt += "Bạn có tính cách dễ thương, nhiệt tình, luôn động viên và khích lệ mọi người. ";
      }

      const activeTasks = tasks.filter(t => t.status === 'running').length;
      const doneTasks = tasks.filter(t => t.status === 'completed' || t.status === 'completed_late').length;
      
      systemPrompt += `\n\nNgữ cảnh hiện tại:
- Người dùng đang tương tác với bạn.
- Team đang có ${activeTasks} việc đang chạy, ${doneTasks}/${tasks.length} việc đã xong.
- Streak hiện tại: ${userData.streak || 0} ngày.
Hãy trả lời ngắn gọn (1-3 câu), thân thiện, có emoji và trực tiếp trả lời câu hỏi của người dùng. Tránh trả lời dài dòng. Không lặp lại ngữ cảnh.`;

      const response = await callGemini(userMsg, systemPrompt, 0, {
        model: userData.aiModel || 'google/gemma-4-31b-it:free',
        maxPromptChars: 2000,
        maxSystemChars: 800,
        useCache: false
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Xin lỗi, mình đang bận chút xíu, bạn thử lại sau nhé! 😅" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Đánh giá tiến độ hôm nay",
    "Cà khịa đối phương chút đi",
    "Động viên tụi mình đi",
    "Đề xuất công việc tiếp theo"
  ];

  const getStatusEmoji = () => {
    const isNight = new Date().getHours() >= 22 || new Date().getHours() < 5;
    const isFocusing = tasks.some(t => t.status === 'running');
    if (isFocusing) return '🧘';
    if (isNight) return '😴';
    return mascotAvatar;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-24 right-4 md:right-8 w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden z-[100] border ${
              userData.isDarkMode 
                ? 'bg-slate-900/90 border-slate-700/50 backdrop-blur-xl' 
                : 'bg-white/90 border-slate-200/50 backdrop-blur-xl'
            }`}
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between ${
              userData.isDarkMode ? 'bg-slate-800/80 border-b border-slate-700/50' : 'bg-slate-50/80 border-b border-slate-200/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-3xl filter drop-shadow-md">{getStatusEmoji()}</div>
                <div>
                  <h3 className="font-black text-sm">{mascotName}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {userData.aiMode === 'sassy' ? 'Cà khịa Mode' : 'Cute Mode'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="h-80 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="text-4xl mb-2">{getStatusEmoji()}</div>
                  <p className="text-xs font-bold mb-4">Chào cậu! Tớ giúp gì được nào?</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all hover:scale-105 active:scale-95 ${
                          userData.isDarkMode ? 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-indigo-500 text-slate-600 hover:text-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white self-end rounded-tr-sm shadow-md' 
                        : userData.isDarkMode 
                          ? 'bg-slate-800 text-slate-200 self-start rounded-tl-sm shadow-sm border border-slate-700/50' 
                          : 'bg-white text-slate-700 self-start rounded-tl-sm shadow-sm border border-slate-200/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && (
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm self-start rounded-tl-sm shadow-sm ${
                  userData.isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400'
                }`}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 ${
              userData.isDarkMode ? 'bg-slate-800/50 border-t border-slate-700/50' : 'bg-slate-50 border-t border-slate-200/50'
            }`}>
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Chat với Mochi..."
                  className={`w-full text-xs py-2.5 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    userData.isDarkMode 
                      ? 'bg-slate-900 text-white placeholder-slate-500' 
                      : 'bg-white text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500 hover:text-white disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-8 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-[0_8px_30px_rgb(99,102,241,0.5)] flex items-center justify-center z-[100] border-2 border-indigo-400"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/30" />
        <span className="text-3xl relative z-10 filter drop-shadow-md">
          {isOpen ? <X size={24} className="text-white" /> : getStatusEmoji()}
        </span>
      </motion.button>
    </>
  );
}
