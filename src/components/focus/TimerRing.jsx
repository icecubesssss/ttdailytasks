import React from 'react';
import { formatDuration } from '../../utils/helpers';

export default function TimerRing({ 
  ringSize, ringCenter, ringRadius, ringCircumference, ringOffset, 
  progress, displayTime, isCountdown, isPaused 
}) {
  return (
    <div className="relative focus-ring-container mb-4 group">
      <div className="absolute inset-0 rounded-full bg-white/5 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
      
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}
        className="relative z-10 transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <circle cx={ringCenter} cy={ringCenter} r={ringRadius}
          fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        
        <circle cx={ringCenter} cy={ringCenter} r={ringRadius}
          fill="none" stroke="url(#focusGradient)" strokeWidth="8"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-1000 ease-linear" />
        
        <circle
          cx={ringCenter + ringRadius * Math.cos(2 * Math.PI * progress)}
          cy={ringCenter + ringRadius * Math.sin(2 * Math.PI * progress)}
          r="8" fill="white" 
          className={`drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-linear
            ${!isPaused ? 'animate-pulse' : ''}`} 
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="relative w-[88%] h-[88%] flex flex-col items-center justify-center rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]">
          <div className="relative flex flex-col items-center">
            <div className="flex items-baseline">
              <span className="text-6xl md:text-7xl font-mono font-medium tabular-nums tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {formatDuration(displayTime).split(':')[0]}:{formatDuration(displayTime).split(':')[1]}
              </span>
              {!isCountdown && (
                <span className="absolute left-[105%] bottom-1.5 text-xl md:text-2xl font-mono font-light text-white/20 tabular-nums">
                  {Math.floor((displayTime % 1000) / 10).toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.5em] text-white/20">
              {!isPaused ? 'Focus Flow' : 'Paused'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
