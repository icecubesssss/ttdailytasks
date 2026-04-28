import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo Animation */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />
          <div className="relative w-24 h-24 bg-slate-900 border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/10" />
            <Sparkles size={40} className="text-white animate-bounce" />
          </div>
        </div>

        {/* Text and Loading */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white/70 animate-fade-in">
            TIT & TUN TASKS
          </h1>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Loader2 size={14} className="text-indigo-400 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Initializing Experience
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Powered by Gemini AI • Premium Productivity
        </p>
      </div>
    </div>
  );
}
