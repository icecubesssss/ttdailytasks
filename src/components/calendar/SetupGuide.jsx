import React from 'react';
import { Calendar as CalIcon, ExternalLink } from 'lucide-react';

export default function SetupGuide({ isDark }) {
  return (
    <div className={`p-8 rounded-[2.5rem] text-center space-y-6 ${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border shadow-xl'}`}>
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
        <CalIcon size={36} className="text-white" />
      </div>
      <h3 className="text-xl font-black">Kết Nối Google Calendar</h3>
      <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Để hiển thị lịch trình của Tít & Tún, bạn cần cấu hình 3 biến môi trường trong file <code className="px-1.5 py-0.5 rounded bg-slate-700/50 text-indigo-400 text-xs">.env</code>:
      </p>
      <div className={`text-left p-5 rounded-2xl font-mono text-xs space-y-2 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border'}`}>
        <p><span className="text-emerald-500">VITE_GOOGLE_CALENDAR_API_KEY</span>=<span className="text-slate-400">your_api_key</span></p>
        <p><span className="text-indigo-400">VITE_CALENDAR_ID_TIT</span>=<span className="text-slate-400">dinhthai.ctv@gmail.com</span></p>
        <p><span className="text-pink-400">VITE_CALENDAR_ID_TUN</span>=<span className="text-slate-400">transontruc.03@gmail.com</span></p>
      </div>
      <div className={`text-left p-5 rounded-2xl text-xs space-y-3 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
        <p className="font-black text-indigo-500 uppercase tracking-widest text-[10px]">Hướng dẫn nhanh</p>
        <ol className={`list-decimal list-inside space-y-2 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-indigo-500 underline">Google Cloud Console</a> → Tạo API Key</li>
          <li>Bật <strong>Google Calendar API</strong> trong Library</li>
          <li>Mỗi người vào Google Calendar → Settings → chọn calendar → <strong>"Make available to public"</strong></li>
          <li>Copy Calendar ID (thường là email) vào file <code className="text-indigo-400">.env</code></li>
          <li>Restart dev server (<code className="text-indigo-400">npm run dev</code>)</li>
        </ol>
      </div>
      <div className="flex justify-center">
        <a href="https://calendar.google.com" target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-lg"
        >
          <ExternalLink size={16} /> Mở Google Calendar
        </a>
      </div>
    </div>
  );
}
