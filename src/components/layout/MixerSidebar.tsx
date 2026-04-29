import React from 'react';
import { X, Play, Plus, Trash2 } from 'lucide-react';
import type { MusicTrackData } from '../../hooks/useFocusMusic';

interface Track extends MusicTrackData {}

interface MixerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: MusicTrackData[];
  currentTrackIdx: number;
  onSelectTrack: (idx: number) => void;
  onFileUpload: (file: File, selectedMood?: string) => Promise<void>;
  onDeleteTrack: (track: MusicTrackData) => Promise<void>;
  onAddViaUrl: (url: string) => void;
  uploadProgress?: number;
}

export default function MixerSidebar({
  isOpen,
  onClose,
  tracks,
  currentTrackIdx,
  onSelectTrack,
  onFileUpload,
  onDeleteTrack,
  onAddViaUrl,
  uploadProgress = 0
}: MixerSidebarProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = React.useState<string>('');
  const [showUrlForm, setShowUrlForm] = React.useState<boolean>(false);

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
        className={`fixed inset-y-0 right-0 w-full max-w-[340px] z-[130] bg-slate-900/40 backdrop-blur-3xl border-l border-white/10 
          transition-transform duration-500 ease-out p-6 flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
          <span className="text-white/80 font-black text-sm uppercase tracking-widest">Sound Mixer</span>
          <div className="w-10" />
        </div>

        {/* Local Library Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Shared Library</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUrlForm(!showUrlForm)}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors
                  ${showUrlForm ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}
            >
              <Plus size={12} />
              Link
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              <Plus size={12} />
              File
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/mp3,audio/mpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file);
                e.target.value = ''; // Reset for same file re-upload
              }
            }}
          />
        </div>

        {showUrlForm && (
          <div className="mb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Dán link Drive/Dropbox vào đây..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={() => {
                if (urlInput.trim()) {
                  onAddViaUrl(urlInput.trim());
                  setUrlInput('');
                  setShowUrlForm(false);
                }
              }}
              className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all"
            >
              Thêm vào thư viện
            </button>
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Đang tải lên Cloud...</span>
              <span className="text-[10px] font-black text-indigo-400">{uploadProgress}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[9px] text-white/20 font-bold italic">
          Nhạc tải lên sẽ được đồng bộ cho cả Tít và Tún dùng chung.
        </p>

        {/* Header for list */}
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Up Next</h3>
            <span className="text-[10px] font-bold text-white/30">{tracks.length} tracks</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {tracks.map((track, idx) => {
              const isActive = idx === currentTrackIdx;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(idx)}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-3 group
                    ${
                      isActive
                        ? 'bg-white/15 border-white/20'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                >
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-500/60 flex items-center justify-center">
                        <Play size={16} className="text-white animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-black truncate ${
                          isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 truncate">{track.artist}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {track.isCustom && (
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc muốn xóa bài "${track.title}"?`)) {
                            onDeleteTrack(track);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {!isActive && (
                      <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={12} className="text-white fill-current" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-white/20 italic">Thư viện nhạc dùng chung cho cả Tít và Tún.</p>
        </div>
      </div>
    </>
  );
}
