import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { UserData, QuickNoteItem } from '../../utils/helpers';
import './quicknote.css';

interface QuickNoteProps {
  userData: UserData;
  onUpdateSettings: (updates: Partial<UserData>) => void;
}

const COLORS = [
  { id: 'amber',  pin: '#f59e0b' },
  { id: 'rose',   pin: '#f43f5e' },
  { id: 'mint',   pin: '#10b981' },
  { id: 'sky',    pin: '#0ea5e9' },
  { id: 'violet', pin: '#8b5cf6' },
  { id: 'peach',  pin: '#f97316' },
];

function newNote(): QuickNoteItem {
  const colorId = COLORS[Math.floor(Math.random() * COLORS.length)].id;
  const rotation = parseFloat(((Math.random() - 0.5) * 6).toFixed(2));
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    content: '',
    color: colorId,
    createdAt: Date.now(),
    rotation,
  };
}

function Pin() {
  return (
    <svg width="22" height="30" viewBox="0 0 22 30" className="drop-shadow-md" aria-hidden="true">
      <circle cx="11" cy="10" r="9" className="qn-pin-head" />
      <circle cx="8" cy="7" r="2.5" className="qn-pin-shine" />
      <line x1="11" y1="18" x2="11" y2="29" className="qn-pin-needle" />
    </svg>
  );
}

interface NoteCardProps {
  note: QuickNoteItem;
  isDark: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  isSaved: boolean;
}

function NoteCard({ note, isDark: _isDark, onUpdate, onDelete, onColorChange, isSaved }: NoteCardProps) {
  const [localContent, setLocalContent] = useState(note.content);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useTape = note.id.charCodeAt(5) % 2 === 0;

  useEffect(() => { setLocalContent(note.content); }, [note.content]);

  // Set rotation via JS ref — no inline style= attribute
  useEffect(() => {
    wrapperRef.current?.style.setProperty('--note-rotation', `${note.rotation}deg`);
  }, [note.rotation]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onUpdate(note.id, e.target.value), 1200);
  };

  return (
    <div ref={wrapperRef} data-color={note.color} className="qn-wrapper group">
      {useTape ? (
        <div className="qn-tape" aria-hidden="true" />
      ) : (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 cursor-default">
          <Pin />
        </div>
      )}

      <div className={`qn-card ${useTape ? '' : 'qn-card-pin'}`}>
        {/* Lined paper */}
        <div className="qn-lines-wrapper" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="qn-line" />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex gap-1">
            {COLORS.map(col => (
              <button
                key={col.id}
                type="button"
                title={col.id}
                onClick={() => onColorChange(note.id, col.id)}
                className={`qn-dot ${note.color === col.id ? 'active' : ''}`}
                data-dot={col.id}
                aria-label={`Đổi màu ${col.id}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`qn-save text-[8px] font-black uppercase ${isSaved ? 'qn-save-dim' : 'qn-save-active'}`}>
              {isSaved ? <Check size={9} /> : '…'}
            </span>
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
              title="Xóa note"
              aria-label="Xóa note"
            >
              <X size={11} className="qn-save" />
            </button>
          </div>
        </div>

        <textarea
          value={localContent}
          onChange={handleChange}
          placeholder="Ghi gì đó..."
          className="qn-textarea"
          spellCheck={false}
          aria-label="Nội dung note"
        />
      </div>
    </div>
  );
}

export default function QuickNote({ userData, onUpdateSettings }: QuickNoteProps): React.ReactElement {
  const [notes, setNotes] = useState<QuickNoteItem[]>(userData.quicknotes ?? []);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const isDark = userData.isDarkMode;

  useEffect(() => {
    setNotes(userData.quicknotes ?? []);
  }, [userData.quicknotes]);

  const handleAdd = () => {
    const note = newNote();
    const updated = [...notes, note];
    setNotes(updated);
    onUpdateSettings({ quicknotes: updated });
  };

  const handleUpdate = useCallback((id: string, content: string) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, content } : n);
      onUpdateSettings({ quicknotes: updated });
      setSavedIds(s => new Set([...s, id]));
      return updated;
    });
  }, [onUpdateSettings]);

  const handleDelete = useCallback((id: string) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      onUpdateSettings({ quicknotes: updated });
      return updated;
    });
  }, [onUpdateSettings]);

  const handleColorChange = useCallback((id: string, color: string) => {
    setNotes(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, color } : n);
      onUpdateSettings({ quicknotes: updated });
      return updated;
    });
  }, [onUpdateSettings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-16">
      <div className={`qn-board ${isDark ? 'qn-board-dark' : ''}`}>
        <div className="qn-cork-texture" aria-hidden="true" />

        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-amber-900/60' : 'text-amber-900/50'}`}>
            📌 Quick Notes
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="text-4xl" aria-hidden="true">🗒️</span>
            <p className={`text-sm font-bold ${isDark ? 'text-amber-900/50' : 'text-amber-900/40'}`}>
              Chưa có note nào — tạo cái đầu tiên đi!
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 pt-4">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isDark={isDark}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onColorChange={handleColorChange}
                isSaved={savedIds.has(note.id)}
              />
            ))}
          </div>
        )}

        <button type="button" onClick={handleAdd} className="qn-add-btn" aria-label="Thêm note mới">
          <Plus size={14} aria-hidden="true" /> Thêm note
        </button>
      </div>
    </div>
  );
}
