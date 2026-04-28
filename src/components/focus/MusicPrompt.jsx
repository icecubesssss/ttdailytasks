import React from 'react';
import { Music } from 'lucide-react';

export default function MusicPrompt({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-12">
          <Music size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Bật Nhạc Ngay?</h3>
        <p className="text-white/60 text-sm font-bold leading-relaxed mb-8">
          Để tăng sự tập trung, bạn có muốn bật giai điệu yêu thích ngay bây giờ không?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
          >
            Kích hoạt ngay 🚀
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
