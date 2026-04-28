export const XP_PER_TASK = 50;
export const XP_PER_SUBTASK = 10;
export const XP_BASE = 100;
export const DAILY_CHECKIN_XP = 20;

export const GOLD_PER_TASK = 50;
export const GOLD_PER_SUBTASK = 10;
export const DAILY_CHECKIN_GOLD = 50;

export const BOOSTER_DURATIONS = {
  xp: 2 * 60 * 60 * 1000,   // 2 hours
  gold: 1 * 60 * 60 * 1000  // 1 hour
};

export const ASSIGNEES = {
  'tit': { name: 'Tít', photo: null },
  'tun': { name: 'Tún', photo: null }
} as const;

export interface AvatarConfig {
  avatarVersion: number;
  seed: string;
  hair: string;
  eyes: string;
  mouth: string;
  body: string;
  hairColor: string;
  clothingColor: string;
}

export const DEFAULT_AVATARS: Record<string, AvatarConfig> = {
  'tit': { avatarVersion: 8, seed: 'Tit', hair: 'shortCombover', eyes: 'open', mouth: 'smile', body: 'squared', hairColor: '362c47', clothingColor: '456dff' },
  'tun': { avatarVersion: 8, seed: 'Tun', hair: 'long', eyes: 'happy', mouth: 'bigSmile', body: 'rounded', hairColor: '6c4545', clothingColor: 'f55d81' }
};

export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (done: number, streak: number, level: number) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first', icon: '🌱', name: 'Khởi Động', desc: 'Hoàn thành task đầu tiên', check: (done) => done >= 1 },
  { id: 'five', icon: '⚡', name: 'Siêu Nhân', desc: 'Hoàn thành 5 tasks', check: (done) => done >= 5 },
  { id: 'ten', icon: '🔥', name: 'Nhiệt Huyết', desc: 'Hoàn thành 10 tasks', check: (done) => done >= 10 },
  { id: 'twenty', icon: '💎', name: 'Kim Cương', desc: 'Hoàn thành 20 tasks', check: (done) => done >= 20 },
  { id: 'fifty', icon: '👑', name: 'Huyền Thoại', desc: 'Hoàn thành 50 tasks', check: (done) => done >= 50 },
  { id: 'streak3', icon: '🎯', name: 'Kiên Trì', desc: 'Streak 3 ngày liên tiếp', check: (_, streak) => streak >= 3 },
  { id: 'streak7', icon: '🏆', name: 'Bền Bỉ', desc: 'Streak 7 ngày liên tiếp', check: (_, streak) => streak >= 7 },
  { id: 'level5', icon: '🚀', name: 'Phi Hành Gia', desc: 'Đạt Level 5', check: (_, __, level) => level >= 5 },
  { id: 'level10', icon: '🌟', name: 'Ngôi Sao', desc: 'Đạt Level 10', check: (_, __, level) => level >= 10 },
];

export type ShopItemType = 'ticket' | 'booster' | 'utility' | 'theme';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  desc: string;
  icon: string;
  price: number;
  minLevel: number;
  multiplier?: number;
  boosterType?: 'xp' | 'gold';
}

export const SHOP_ITEMS: ShopItem[] = [
  // --- TICKETS ---
  { id: 'ticket_snack', type: 'ticket', name: '🍔 Vé Ăn Nhẹ', desc: 'Mời một bữa trà sữa "tầm trung".', icon: '🍔', price: 500, minLevel: 1 },
  { id: 'ticket_lunch', type: 'ticket', name: '🍱 Vé Bữa Trưa', desc: 'Một bữa trưa tươm tất do đối phương bao.', icon: '🍱', price: 1500, minLevel: 3 },
  { id: 'ticket_dinner', type: 'ticket', name: '🥂 Vé Bữa Tối', desc: 'Buffet hoặc nhà hàng cao cấp.', icon: '🥂', price: 4000, minLevel: 5 },
  { id: 'ticket_intimacy', type: 'ticket', name: '🔥 Vé "Đổi Gió"', desc: 'Một buổi tối nồng cháy chỉ có hai người.', icon: '🔥', price: 5000, minLevel: 10 },

  // --- BOOSTERS ---
  { id: 'booster_xp_2x', type: 'booster', name: '🧪 Potion X2 XP', desc: 'X2 XP nhận được trong 2 giờ.', icon: '🧪', price: 1000, minLevel: 2, multiplier: 2, boosterType: 'xp' },
  { id: 'booster_gold_1.5x', type: 'booster', name: '🧲 Nam Châm Vàng', desc: 'X1.5 Gold nhận được trong 1 giờ.', icon: '🧲', price: 800, minLevel: 2, multiplier: 1.5, boosterType: 'gold' },

  // --- UTILITY ---
  { id: 'freeze', type: 'utility', name: 'Streak Freeze', desc: 'Bảo vệ chuỗi làm việc khi lỡ quên.', icon: '❄️', price: 1000, minLevel: 1 },

  // --- THEMES ---
  { id: 'theme_sakura', type: 'theme', name: '🌸 Theme Sakura', desc: 'Sắc hồng lãng mạn.', icon: '🌸', price: 2000, minLevel: 5 },
  { id: 'theme_cyberpunk', type: 'theme', name: '🏙️ Theme Cyberpunk', desc: 'Tương lai huyền ảo.', icon: '🏙️', price: 2500, minLevel: 6 },
  { id: 'theme_neon_night', type: 'theme', name: '🌃 Theme Neon Night', desc: 'Ánh đèn ban đêm rực rỡ.', icon: '🌃', price: 1500, minLevel: 4 },
];

export interface FashionOption {
  id: string;
  name: string;
  icon?: string;
  value: string;
}

export const FASHION_OPTIONS: Record<string, FashionOption[]> = {
  hair: [
    { id: 'h1', name: 'Combover', icon: '💇‍♂️', value: 'shortCombover' },
    { id: 'h2', name: 'Side Shave', icon: '💈', value: 'sideShave' },
    { id: 'h3', name: 'Tóc Dài', icon: '👩‍🦰', value: 'long' },
    { id: 'h4', name: 'Xoăn Cao', icon: '👨‍🦱', value: 'curlyHighTop' },
    { id: 'h5', name: 'Bob Cut', icon: '👩', value: 'bobCut' },
    { id: 'h6', name: 'Tóc Xoăn', icon: '👨‍🦱', value: 'curly' },
    { id: 'h7', name: 'Tóc Bím', icon: '👧', value: 'pigtails' },
    { id: 'h8', name: 'Búi Xoăn', icon: '👱‍♀️', value: 'curlyBun' },
    { id: 'h9', name: 'Đầu Đinh', icon: '👨‍🦲', value: 'buzzcut' },
    { id: 'h10', name: 'Mái Bằng', icon: '👩', value: 'bobBangs' },
    { id: 'h11', name: 'Trọc', icon: '👨‍🦲', value: 'bald' },
    { id: 'h12', name: 'Hói', icon: '👨‍🦳', value: 'balding' },
    { id: 'h13', name: 'Lưỡi Trai', icon: '🧢', value: 'cap' },
    { id: 'h14', name: 'Búi Cao', icon: '👱‍♀️', value: 'bunUndercut' },
    { id: 'h15', name: 'Fade', icon: '💈', value: 'fade' },
    { id: 'h16', name: 'Nón Len', icon: '🧶', value: 'beanie' },
    { id: 'h17', name: 'Búi Thẳng', icon: '👱‍♀️', value: 'straightBun' },
    { id: 'h18', name: 'Siêu Dài', icon: '👸', value: 'extraLong' },
    { id: 'h19', name: 'Combover Chops', icon: '💇‍♂️', value: 'shortComboverChops' },
    { id: 'h20', name: 'Mohawk', icon: '💇‍♂️', value: 'mohawk' },
  ],
  eyes: [
    { id: 'e1', name: 'Mở Mắt', icon: '👀', value: 'open' },
    { id: 'e2', name: 'Nhắm Mắt', icon: '😑', value: 'sleep' },
    { id: 'e3', name: 'Nháy Mắt', icon: '😉', value: 'wink' },
    { id: 'e4', name: 'Đeo Kính', icon: '👓', value: 'glasses' },
    { id: 'e5', name: 'Hạnh Phúc', icon: '😊', value: 'happy' },
    { id: 'e6', name: 'Kính Mát', icon: '🕶️', value: 'sunglasses' },
  ],
  mouth: [
    { id: 'm1', name: 'Cười Mỉm', icon: '🙂', value: 'smile' },
    { id: 'm2', name: 'Hơi Buồn', icon: '🙁', value: 'frown' },
    { id: 'm3', name: 'Ngạc Nhiên', icon: '😮', value: 'surprise' },
    { id: 'm4', name: 'Ngậm Nướu', icon: '👶', value: 'pacifier' },
    { id: 'm5', name: 'Cười Lớn', icon: '😄', value: 'bigSmile' },
    { id: 'm6', name: 'Nhếch Mép', icon: '😏', value: 'smirk' },
    { id: 'm7', name: 'Đôi Môi', icon: '👄', value: 'lips' },
  ],
  body: [
    { id: 'b1', name: 'Áo Vuông', icon: '👕', value: 'squared' },
    { id: 'b2', name: 'Áo Tròn', icon: '👕', value: 'rounded' },
    { id: 'b3', name: 'Dáng Nhỏ', icon: '👕', value: 'small' },
    { id: 'b4', name: 'Áo Caro', icon: '👕', value: 'checkered' },
  ],
  facialHair: [
    { id: 'f0', name: 'Không Râu', icon: '👨', value: 'none' },
    { id: 'f1', name: 'Râu Quai Nón', icon: '🧔', value: 'beardMustache' },
    { id: 'f2', name: 'Râu Tam Giác', icon: '🧔', value: 'pyramid' },
    { id: 'f3', name: 'Râu Hải Cẩu', icon: '🧔', value: 'walrus' },
    { id: 'f4', name: 'Râu Cằm', icon: '🧔', value: 'goatee' },
    { id: 'f5', name: 'Râu Bóng', icon: '🧔', value: 'shadow' },
    { id: 'f6', name: 'Râu Nhỏ', icon: '🧔', value: 'soulPatch' },
  ],
  hairColor: [
    { id: 'hc1', name: 'Đen Tím', value: '362c47' },
    { id: 'hc2', name: 'Nâu Trầm', value: '6c4545' },
    { id: 'hc3', name: 'Đỏ Hồng', value: 'e15c66' },
    { id: 'hc4', name: 'Hồng Phấn', value: 'e16381' },
    { id: 'hc5', name: 'Cam Đào', value: 'f27d65' },
    { id: 'hc6', name: 'Cam Vàng', value: 'f29c65' },
    { id: 'hc7', name: 'Xám Khói', value: 'dee1f5' },
  ],
  skinColor: [
    { id: 's1', name: 'Trắng Hồng', value: 'eeb4a4' },
    { id: 's2', name: 'Trắng Sáng', value: 'e7a391' },
    { id: 's3', name: 'Tự Nhiên', value: 'e5a07e' },
    { id: 's4', name: 'Hơi Ngăm', value: 'd78774' },
    { id: 's5', name: 'Bánh Mật', value: 'b16a5b' },
    { id: 's6', name: 'Rám Nắng', value: '92594b' },
    { id: 's7', name: 'Đậm Màu', value: '623d36' },
  ],
  clothingColor: [
    { id: 'c1', name: 'Xanh Blue', value: '456dff' },
    { id: 'c2', name: 'Xanh Mint', value: '54d7c7' },
    { id: 'c3', name: 'Tím', value: '7555ca' },
    { id: 'c4', name: 'Xanh Lá', value: '6dbb58' },
    { id: 'c5', name: 'Đỏ', value: 'e24553' },
    { id: 'c6', name: 'Vàng', value: 'f3b63a' },
    { id: 'c7', name: 'Hồng', value: 'f55d81' },
    { id: 'c8', name: 'Trắng', value: 'ffffff' },
  ]
};

export interface AiModel {
  id: string;
  name: string;
  icon: string;
}

export const AI_MODELS: AiModel[] = [
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B (Best)', icon: '🚀' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (Pro)', icon: '🧠' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (Stable)', icon: '💎' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Logic)', icon: '🛠' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Fast)', icon: '⚡' },
  { id: 'inclusionai/ling-2.6-1t:free', name: 'Ling-2.6 1T (Huge)', icon: '🌐' },
  { id: 'tencent/hy3-preview:free', name: 'Hy3 Preview (MoE)', icon: '☁️' },
];

// Heartbeat Timeout
export const HEARTBEAT_INTERVAL = 90_000;   // 90s — client gửi heartbeat
export const HEARTBEAT_TIMEOUT = 300_000;   // 5 phút — ngưỡng auto-pause
