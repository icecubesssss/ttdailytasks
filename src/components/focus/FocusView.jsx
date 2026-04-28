import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, ListTree, Pause, CheckCircle2, Music, ChevronRight, ListMusic, ChevronLeft, Play, Flame, Settings2, RotateCcw, Timer, Clock } from 'lucide-react';
import { formatDuration, getAvatarUrl, getAssigneeIdByEmail } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';
import MusicSidebar from '../layout/MusicSidebar';
import MixerSidebar from '../layout/MixerSidebar';
import { useFocusMusic } from '../../hooks/useFocusMusic';

import TimerRing from './TimerRing';
import FocusChecklist from './FocusChecklist';
import MusicPrompt from './MusicPrompt';
import { useTaskActionContext } from '../../contexts/TaskActionContext';

export default function FocusView({
  task, now, userData, triggerSystemFocus, partnerTask, partnerInfo
}) {
  const { toggleTaskStatus, handleUpdateTask, handleSubTaskAction } = useTaskActionContext();
  const onPause = () => toggleTaskStatus(task.id, 'pause');
  const onComplete = () => toggleTaskStatus(task.id, 'complete');
  const onUpdateTask = handleUpdateTask;
  const onSubTaskToggle = handleSubTaskAction;
  const onSubTaskAdd = handleSubTaskAction;

  const [showChecklist, setShowChecklist] = useState(true);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(true);
  const [hasInteractedWithMusic, setHasInteractedWithMusic] = useState(false);
  const newSubTaskRef = useRef(null);

  const {
    tracks, currentTrack, currentTrackIdx, setCurrentTrackIdx,
    isPlaying, togglePlay, handleNext, handlePrevious,
    currentTime, duration, handleSeek,
    volume, isMuted, setIsMuted,
    isCaching, cachedIds, uploadProgress,
    handleFileUpload, handleDeleteTrack, handleRandomPlay
  } = useFocusMusic(userData);

  useEffect(() => {
    if (isPlaying) {
      requestAnimationFrame(() => {
        setShowMusicPrompt(curr => curr === false ? curr : false);
        setHasInteractedWithMusic(curr => curr === true ? curr : true);
      });
    }
  }, [isPlaying]);

  // Timer Logic
  const isPaused = task.status === 'paused' || task.status === 'idle';
  
  const getMs = (val) => {
    if (!val) return null;
    if (val.seconds) return val.seconds * 1000;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const stableStartTime = useMemo(() => {
    return getMs(task.lastStartTime) || now;
  }, [now, task.lastStartTime]);

  const lastStart = getMs(task.lastStartTime) || stableStartTime;
  const rawTotalTracked = getMs(task.totalTrackedTime) || 0;
  const totalTracked = rawTotalTracked > 86400000 ? 0 : rawTotalTracked; 
  
  const limitMs = getMs(task.limitTime) || 0;
  const elapsed = isPaused ? 0 : Math.max(0, now - lastStart);
  const totalElapsed = totalTracked + elapsed;
  
  const isCountdown = task.type === 'countdown' && limitMs > 0;
  const displayTime = isCountdown ? (limitMs - totalElapsed) : totalElapsed;
  
  const progress = isCountdown 
    ? Math.min(1, totalElapsed / (limitMs || 1)) 
    : (totalElapsed % 60000) / 60000;

  // Settings Actions
  const handleToggleTimerType = () => {
    const newType = task.type === 'stopwatch' ? 'countdown' : 'stopwatch';
    const newLimit = newType === 'countdown' ? 25 * 60 * 1000 : null;
    onUpdateTask(task.id, { type: newType, limitTime: newLimit });
  };

  const handleUpdateLimit = (mins) => {
    const ms = Math.max(1, parseInt(mins) || 1) * 60 * 1000;
    onUpdateTask(task.id, { limitTime: ms, type: 'countdown' });
  };

  const handleResetTimer = () => {
    if (window.confirm("Đặt lại đồng hồ về 0?")) {
      onUpdateTask(task.id, { totalTrackedTime: 0, lastStartTime: now });
    }
  };

  const ringSize = 280;
  const ringRadius = ringSize / 2 - 16;
  const ringCircumference = 2 * Math.PI * ringRadius;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto custom-scrollbar bg-slate-950">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <img src="/focus-bg.png" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between p-4 md:p-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => triggerSystemFocus(userData?.shortcutName || 'Làm việc')} className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl hover:bg-white/20 transition-colors group hidden sm:block">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 group-active:scale-95 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white max-w-[200px] sm:max-w-md truncate">{task.title}</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Focusing Now</p>
          </div>
        </div>

        {/* Co-focus status */}
        {partnerTask && partnerInfo && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <div className="relative">
              <img src={getAvatarUrl(partnerInfo.avatarConfig || DEFAULT_AVATARS[getAssigneeIdByEmail(partnerInfo.email)] || {})} className="w-6 h-6 rounded-full border border-white/50" />
              <div className="absolute -bottom-0.5 -right-0.5"><Flame size={10} className="text-orange-500 animate-pulse" fill="currentColor"/></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-white/70 uppercase leading-none">{partnerInfo.displayName}</span>
              <span className="text-[10px] text-white font-mono leading-none">{formatDuration(Math.max(0, (partnerTask.totalTrackedTime || 0) + (partnerTask.status === 'running' && partnerTask.lastStartTime ? (now - partnerTask.lastStartTime) : 0)))}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all active:scale-95 ${isSettingsOpen ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
            <Settings2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button onClick={() => setIsMusicOpen(true)} className="p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 group hidden sm:block">
            <Music size={16} className={`sm:w-[18px] sm:h-[18px] ${isPlaying ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={() => setIsMixerOpen(true)} className="p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 group">
            <ListMusic size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button onClick={() => setShowChecklist(v => !v)} className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all active:scale-95 ${showChecklist ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
            <ListTree size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* Settings Overlay */}
      {isSettingsOpen && (
        <div className="absolute top-20 left-4 md:left-6 z-30 w-72 p-5 rounded-[2rem] bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Timer Settings</h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/60 uppercase ml-1">Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                <button onClick={handleToggleTimerType} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${!isCountdown ? 'bg-white text-slate-950 shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  <Clock size={14} /> Stopwatch
                </button>
                <button onClick={handleToggleTimerType} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isCountdown ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  <Timer size={14} /> Countdown
                </button>
              </div>
            </div>

            {isCountdown && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/60 uppercase ml-1">Limit Time (minutes)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map(m => (
                    <button key={m} onClick={() => handleUpdateLimit(m)} className={`py-2 rounded-xl text-xs font-bold transition-all border ${limitMs === m * 60000 ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button onClick={handleResetTimer} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all border border-red-500/20">
                <RotateCcw size={14} /> Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center min-h-[calc(100vh-80px)] px-4 pb-6">
        <div className="flex-1 min-h-4 max-h-[15vh]" />
        
        <TimerRing 
          ringSize={ringSize} ringCenter={ringSize/2} ringRadius={ringRadius} 
          ringCircumference={ringCircumference} ringOffset={ringCircumference * (1 - progress)}
          progress={progress} displayTime={displayTime} isCountdown={isCountdown} isPaused={isPaused}
        />

        <div className="flex items-center gap-6 mb-8 shrink-0 relative z-20">
          <button onClick={onPause} className={`p-5 rounded-full backdrop-blur-xl border transition-all active:scale-90 shadow-2xl ${isPaused ? 'bg-white text-slate-950 border-white shadow-white/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
          </button>
          <button onClick={onComplete} className="p-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white border border-emerald-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-90 shadow-xl">
            <CheckCircle2 size={32} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 min-h-2 max-h-[8vh]" />

        <FocusChecklist 
          task={task} userData={userData} subTasks={task.subTasks || []} 
          subDone={(task.subTasks || []).filter(s => s.isDone).length}
          showChecklist={showChecklist} onSubTaskToggle={onSubTaskToggle}
          onSubTaskAdd={onSubTaskAdd} newSubTaskRef={newSubTaskRef}
        />
      </div>

      <MusicSidebar 
        isOpen={isMusicOpen} onClose={() => setIsMusicOpen(false)}
        currentTrack={currentTrack} isPlaying={isPlaying} onTogglePlay={togglePlay}
        onNext={handleNext} onPrevious={handlePrevious} currentTime={currentTime}
        duration={duration} onSeek={handleSeek} volume={isMuted ? 0 : volume}
        onToggleMute={() => setIsMuted(!isMuted)} isCaching={isCaching}
      />

      <MixerSidebar 
        isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)}
        tracks={tracks} currentTrackIdx={currentTrackIdx} onSelectTrack={setCurrentTrackIdx}
        cachedIds={cachedIds} totalTracks={tracks.length} onFileUpload={handleFileUpload}
        onAddViaUrl={() => {}} onDeleteTrack={handleDeleteTrack} uploadProgress={uploadProgress}
      />

      {showMusicPrompt && !hasInteractedWithMusic && !isPlaying && tracks.length > 0 && (
        <MusicPrompt onConfirm={handleRandomPlay} onCancel={() => setShowMusicPrompt(false)} />
      )}
    </div>
  );
}
