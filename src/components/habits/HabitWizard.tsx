import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Swords } from 'lucide-react';
import Modal from '../../shared/Modal';
import { BESTIARY, getMonster } from '../../game/bestiary';
import type { Habit } from '../../services/habitService';

export type NewHabitData = Omit<
  Habit,
  'id' | 'createdAt' | 'history' | 'dropsClaimed' | 'ownerId' | 'createdByUid'
>;

interface HabitWizardProps {
  open: boolean;
  isDark: boolean;
  onClose: () => void;
  onCreate: (data: NewHabitData) => Promise<void>;
}

const STEP_TITLES = [
  'Bạn muốn trở thành ai?',
  'Đòn đánh hàng ngày',
  'Đặt bẫy cho quái',
  'Gặp mặt kẻ thù'
];

/**
 * Wizard khai chiến — đi đúng 4 Luật của Atomic Habits:
 * 1. Identity (chọn quái = chọn con người muốn trở thành)
 * 2. Make it easy (thói quen + đòn nhẹ 2 phút bắt buộc)
 * 3. Make it obvious (implementation intention: "Sau khi X, tôi sẽ Y lúc Z")
 * 4. Make it attractive (màn ra mắt quái — có kẻ thù cụ thể để đánh bại)
 */
export default function HabitWizard({ open, isDark, onClose, onCreate }: HabitWizardProps): React.ReactElement | null {
  const [step, setStep] = useState(0);
  const [monsterId, setMonsterId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [tinyVersion, setTinyVersion] = useState('');
  const [cueAfter, setCueAfter] = useState('');
  const [cueTime, setCueTime] = useState('');
  const [habitType, setHabitType] = useState<'solo' | 'duo'>('solo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const monster = monsterId ? getMonster(monsterId) : null;
  const canNext =
    step === 0 ? Boolean(monsterId)
    : step === 1 ? title.trim().length > 0 && tinyVersion.trim().length > 0
    : true;

  const reset = () => {
    setStep(0);
    setMonsterId(null);
    setTitle('');
    setEmoji('🎯');
    setTinyVersion('');
    setCueAfter('');
    setCueTime('');
    setHabitType('solo');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!monsterId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        emoji,
        monsterId,
        type: habitType,
        tinyVersion: tinyVersion.trim(),
        cueAfter: cueAfter.trim() || undefined,
        cueTime: cueTime || undefined
      } as NewHabitData);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-indigo-500/30 ${
    isDark ? 'bg-slate-800/60 border-white/10 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
  }`;

  return (
    <Modal open={open} onClose={handleClose} isDark={isDark} maxWidthCls="max-w-2xl">
      <div className="w-full mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-gradient-to-r from-indigo-500 to-pink-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <h3 className="text-lg font-black mb-1">{STEP_TITLES[step]}</h3>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            {/* ── B1: chọn identity / quái ── */}
            {step === 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 mb-3">
                  Mỗi lần điểm danh là 1 phiếu bầu cho con người bạn muốn trở thành — và 1 nhát chém vào con quái cản đường.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto no-scrollbar pr-1">
                  {BESTIARY.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMonsterId(m.id);
                        // Băng Nguội Lạnh là quái của cặp đôi — mặc định thói quen đôi
                        if (m.id === 'bang_nguoi_lanh') setHabitType('duo');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-95 ${
                        m.id === 'bang_nguoi_lanh' ? 'sm:col-span-2 justify-center sm:px-8' : ''
                      } ${
                        monsterId === m.id
                          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                          : isDark
                          ? 'border-white/10 bg-slate-800/40 hover:border-indigo-400/50'
                          : 'border-slate-200 bg-white/60 hover:border-indigo-300'
                      }`}
                    >
                      <img src={m.imageUrl} alt={m.name} className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
                      <span className={`min-w-0 ${m.id === 'bang_nguoi_lanh' ? 'flex-initial' : 'flex-1'}`}>
                        <span className="block font-black text-xs truncate">
                          {m.identityEmoji} {m.identity}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400 truncate">
                          đấu với {m.name} · {m.purpose}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── B2: thói quen + đòn nhẹ ── */}
            {step === 1 && monster && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400">
                  Gợi ý từ chiến trường của {monster.name}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {monster.examples.map((ex) => (
                    <button
                      key={ex.habit}
                      onClick={() => {
                        setTitle(ex.habit);
                        setTinyVersion(ex.tiny);
                        setEmoji(ex.emoji);
                      }}
                      className="px-3 py-1.5 rounded-full text-[10px] font-black border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 transition-all"
                    >
                      {ex.emoji} {ex.habit}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                    aria-label="Emoji thói quen"
                    className={`${inputCls} !w-16 text-center`}
                  />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Thói quen mỗi ngày (vd: Tập thể dục 30 phút)"
                    className={inputCls}
                  />
                </div>
                <div>
                  <input
                    value={tinyVersion}
                    onChange={(e) => setTinyVersion(e.target.value)}
                    placeholder="🤏 Đòn nhẹ 2 phút cho ngày kiệt sức (bắt buộc)"
                    className={inputCls}
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-1.5 px-1">
                    Ngày mệt rã rời, làm bản tí hon này vẫn giữ được chuỗi — vòng lặp không chết là thắng.
                  </p>
                </div>
                <button
                  onClick={() => setHabitType(habitType === 'duo' ? 'solo' : 'duo')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-black transition-all ${
                    habitType === 'duo'
                      ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-500 ring-2 ring-fuchsia-500/20'
                      : isDark
                      ? 'border-white/10 text-slate-400 hover:border-fuchsia-400/40'
                      : 'border-slate-200 text-slate-500 hover:border-fuchsia-300'
                  }`}
                >
                  <span>💞 Thói quen ĐÔI — cả hai cùng check mới trọn vẹn</span>
                  <span className={`w-9 h-5 rounded-full p-0.5 transition-all ${habitType === 'duo' ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${habitType === 'duo' ? 'translate-x-4' : ''}`} />
                  </span>
                </button>
              </div>
            )}

            {/* ── B3: implementation intention ── */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400">
                  Thói quen cần mỏ neo. Công thức khoa học: <i>“Sau khi X, tôi sẽ {title || 'làm thói quen'}”</i> — cụ thể gấp đôi tỉ lệ thành công.
                </p>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Sau khi…</label>
                  <input
                    value={cueAfter}
                    onChange={(e) => setCueAfter(e.target.value)}
                    placeholder="vd: đánh răng buổi tối / tắt máy tính"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1">Giờ nhắc (tuỳ chọn)</label>
                  <input
                    type="time"
                    value={cueTime}
                    onChange={(e) => setCueTime(e.target.value)}
                    aria-label="Giờ nhắc"
                    title="Giờ nhắc"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* ── B4: gặp quái ── */}
            {step === 3 && monster && (
              <div className="text-center py-2">
                  <img src={monster.imageUrl} alt={monster.name} className="w-24 h-24 mx-auto object-contain drop-shadow-xl" />
                <p className={`text-sm font-bold italic mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  “{monster.intro}”
                </p>
                <div className={`rounded-2xl border p-3 text-left text-xs font-bold space-y-1 ${isDark ? 'border-white/10 bg-slate-800/40' : 'border-slate-200 bg-white/60'}`}>
                  <p>{emoji} <b>{title}</b></p>
                  <p className="text-slate-400">🤏 Đòn nhẹ: {tinyVersion}</p>
                  {cueAfter && <p className="text-slate-400">📍 Sau khi {cueAfter}{cueTime ? ` · ${cueTime}` : ''}</p>}
                  <p className="text-slate-400">🏆 Phong ấn {monster.name} sau 66 ngày đều đặn</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Điều hướng ── */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
            className={`flex items-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
              isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-black/5'
            }`}
          >
            <ChevronLeft size={14} /> {step === 0 ? 'Để sau' : 'Quay lại'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                canNext
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-300/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              Tiếp <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-95 transition-all disabled:opacity-60"
            >
              <Swords size={14} /> {isSubmitting ? 'ĐANG KHAI CHIẾN…' : 'KHAI CHIẾN!'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
