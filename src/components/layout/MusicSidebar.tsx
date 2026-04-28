import React from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, MoreHorizontal, Music2 } from 'lucide-react';
import { formatDuration } from '../../utils/helpers';

interface MusicTrack {
  cover?: string;
  title?: string;
  artist?: string;
}

interface MusicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack?: MusicTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onToggleMute: () => void;
  isCaching?: boolean;
}

export default function MusicSidebar({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  onToggleMute,
  isCaching
}: MusicSidebarProps): React.ReactElement {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] transition-opacity duration-500 
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-[340px] z-[130] bg-slate-900/40 backdrop-blur-3xl border-r border-white/10 
          transition-transform duration-500 ease-out p-6 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-white/80 font-black text-sm uppercase tracking-widest">Now Playing</span>
            {isCaching && <span className="text-[9px] text-indigo-400 font-bold animate-pulse">Caching...</span>}
          </div>
          <button className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Cover Art */}
        <div className="relative flex-1 flex flex-col items-center justify-center">
          <div className="relative group">
            <div
              className={`w-56 h-56 rounded-full border-8 border-white/5 overflow-hidden shadow-2xl transition-transform duration-1000 
              ${isPlaying ? 'rotate-animation' : ''}`}
            >
              <img
                src={
                  currentTrack?.cover ||
                  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'
                }
                alt={currentTrack?.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Inner circle decor */}
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
          </div>

          {/* Track Info */}
          <div className="text-center mt-10 space-y-2 px-4">
            <h2 className="text-white text-xl font-black tracking-tight leading-tight line-clamp-3 uppercase">
              {currentTrack?.title || 'Unknown'}
            </h2>
            <p className="text-white/50 text-sm font-bold uppercase tracking-wider">
              {currentTrack?.artist || 'Unknown'}
            </p>
          </div>

          {/* Waveform Simulation */}
          <div className="w-full h-12 flex items-center justify-center gap-1 mt-8">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-white/20 transition-all duration-300
                  ${isPlaying ? 'animate-waveform' : 'h-2'}`}
                style={{
                  animationDelay: `${i * 0.05}s`,
                  height: isPlaying ? 'auto' : '8px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Controls Section */}
        <div className="mt-auto space-y-8">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div
              className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                onSeek((x / rect.width) * duration);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black font-mono text-white/40 tracking-wider">
              <span>{formatDuration(currentTime * 1000)}</span>
              <span>{formatDuration(duration * 1000)}</span>
            </div>
          </div>

          {/* Main Buttons */}
          <div className="flex items-center justify-between">
            <button onClick={onToggleMute} className="text-white/40 hover:text-white transition-all">
              {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <div className="flex items-center gap-6">
              <button onClick={onPrevious} className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              >
                {isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button onClick={onNext} className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
            <button className="text-white/40 hover:text-white transition-all">
              <Repeat size={20} />
            </button>
          </div>

          {/* Bottom Label */}
          <div className="flex justify-center pt-4 border-t border-white/5">
            <button className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white/60 transition-all flex items-center gap-2">
              <Music2 size={12} />
              Lyrics
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate 20s linear infinite;
        }
        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        .animate-waveform {
          animation: waveform 0.6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
