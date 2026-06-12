import { create } from 'zustand';

/**
 * Celebration queue — mọi nơi trong app bắn cảm xúc qua đây (chip bay, banner).
 * UI hiển thị bởi <CelebrationLayer/>. Phần thưởng phải "đã" trong ~3 giây
 * đầu tiên (BJ Fogg: celebration khắc thói quen vào não) nên chip tự biến mất nhanh.
 */

export type CelebrationKind =
  | 'gold' | 'xp' | 'combo' | 'checkin' | 'levelup' | 'drop' | 'damage' | 'freeze';

export interface Celebration {
  id: string;
  kind: CelebrationKind;
  label: string;
  sub?: string;
}

interface CelebrationState {
  items: Celebration[];
  push: (items: Array<Omit<Celebration, 'id'>>) => void;
  remove: (id: string) => void;
}

const LIFETIME_MS = 2400;
const STAGGER_MS = 280;

export const useCelebrationStore = create<CelebrationState>((set) => ({
  items: [],
  push: (newItems) => {
    newItems.forEach((item, i) => {
      const id = crypto.randomUUID();
      setTimeout(() => {
        set((state) => ({ items: [...state.items, { ...item, id }] }));
        setTimeout(() => {
          set((state) => ({ items: state.items.filter((c) => c.id !== id) }));
        }, item.kind === 'levelup' ? LIFETIME_MS * 2 : LIFETIME_MS);
      }, i * STAGGER_MS);
    });
  },
  remove: (id) => set((state) => ({ items: state.items.filter((c) => c.id !== id) }))
}));

/** API tiện dụng: celebrate({kind:'gold', label:'+50'}, {kind:'xp', label:'+50 XP'}) */
export const celebrate = (...items: Array<Omit<Celebration, 'id'>>): void =>
  useCelebrationStore.getState().push(items);
