/**
 * Bestiary — quái vật đại diện cho "anti-identity": phiên bản lười của chính mình.
 * Mỗi thói quen khai chiến với 1 quái. Giọng quái: dụ dỗ đáng ghét kiểu dễ thương,
 * KHÔNG sỉ nhục người chơi (bài học từ Finch: shame phản tác dụng).
 */

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  /** Identity tốt mà người chơi đang xây ("Người khỏe mạnh") */
  identity: string;
  identityEmoji: string;
  /** Nhóm mục đích thói quen */
  purpose: string;
  /** Hue chủ đạo của card (tailwind color name) */
  color: 'rose' | 'violet' | 'amber' | 'emerald' | 'sky' | 'fuchsia' | 'cyan';
  /** Lời dụ dỗ khi quái còn sống (hiện ngẫu nhiên) */
  taunts: string[];
  /** Lời rên rỉ khi bị đánh bại trong ngày */
  defeats: string[];
  /** Tự giới thiệu lúc khai chiến */
  intro: string;
  /** Ví dụ thói quen + đòn nhẹ gợi ý trong wizard */
  examples: Array<{ habit: string; tiny: string; emoji: string }>;
}

export const BESTIARY: Monster[] = [
  {
    id: 'mo_quai',
    name: 'Mỡ Quái',
    emoji: '🦛',
    identity: 'Người khỏe mạnh',
    identityEmoji: '💪',
    purpose: 'Vận động · Thể dục',
    color: 'rose',
    taunts: [
      'Nằm thêm 5 phút nữa thôi mà~ trời lạnh lắm 🥶',
      'Tập gì tầm này, mai tập bù gấp đôi nha 😏',
      'Ghế sofa nhớ cậu lắm đó~',
      'Một ngày nghỉ có chết ai đâu nè 🍟'
    ],
    defeats: ['Ố ồ... cơ bụng đâu ra vậy 😵', 'Hôm nay tha cho cậu đó!', 'Mệt quá, mai tớ phục thù!'],
    intro: 'Khà khà, tôi là Mỡ Quái! Tôi lớn lên từ mỗi buổi tập cậu bỏ. Đánh bại tôi mỗi ngày... nếu rời nổi khỏi giường 🦛',
    examples: [
      { habit: 'Tập thể dục 30 phút', tiny: 'Plank 1 phút', emoji: '🏋️' },
      { habit: 'Chạy bộ buổi sáng', tiny: 'Đi bộ quanh nhà 2 phút', emoji: '🏃' },
      { habit: 'Uống đủ 2 lít nước', tiny: 'Uống 1 cốc nước', emoji: '💧' }
    ]
  },
  {
    id: 'cu_dem',
    name: 'Cú Đêm',
    emoji: '🦉',
    identity: 'Người ngủ đủ giấc',
    identityEmoji: '🌙',
    purpose: 'Ngủ sớm · Dậy sớm',
    color: 'violet',
    taunts: [
      'Tập này hay lắm, MỘT tập nữa rồi ngủ 📺',
      'Mới 11h mà, còn sớm chán~ 🌃',
      'Kéo phát nữa thôi, có khi trúng meme hay 😴',
      'Ngủ sớm là bỏ lỡ cả thế giới đó nha!'
    ],
    defeats: ['Hu hu, đèn tắt rồi... 😵', 'Ngủ ngon... mai gặp lại 🥱', 'Sao cưỡng được giấc ngủ vậy trời!'],
    intro: 'Hú hú~ Cú Đêm đây! Tôi sống nhờ những đêm cậu thức trắng lướt điện thoại. Dám lên giường đúng giờ không? 🦉',
    examples: [
      { habit: 'Đi ngủ trước 23h', tiny: 'Đặt điện thoại ra xa giường', emoji: '🛏️' },
      { habit: 'Dậy trước 6h30', tiny: 'Ngồi dậy, không nằm lại', emoji: '⏰' }
    ]
  },
  {
    id: 'ma_tri_hoan',
    name: 'Ma Trì Hoãn',
    emoji: '👻',
    identity: 'Người ham học',
    identityEmoji: '📚',
    purpose: 'Học tập · Đọc sách · Kỹ năng',
    color: 'sky',
    taunts: [
      'Mai học cũng được mà, hôm nay "nghiên cứu" TikTok đã 📱',
      'Đọc sách á? Để tâm trạng tốt đã rồi đọc~',
      'Deadline còn xa lắm, chill đi 🧘',
      'Học lúc 0h mới vào não, giờ chưa phải lúc 😌'
    ],
    defeats: ['Không thể nào, cậu học thật à?! 😵', 'Chữ nghĩa... đáng sợ quá...', 'Thua keo này tớ bày keo khác!'],
    intro: 'Hực hực... Ma Trì Hoãn đây. "Để mai tính" là câu thần chú tôi tặng cậu. Phá được lời nguyền không? 👻',
    examples: [
      { habit: 'Đọc sách 20 phút', tiny: 'Đọc 1 trang', emoji: '📖' },
      { habit: 'Học tiếng Anh', tiny: 'Học 5 từ mới', emoji: '🇬🇧' },
      { habit: 'Luyện code 30 phút', tiny: 'Giải 1 bài dễ', emoji: '💻' }
    ]
  },
  {
    id: 'zombie_luot',
    name: 'Zombie Lướt',
    emoji: '🧟',
    identity: 'Người sống tỉnh táo',
    identityEmoji: '🧠',
    purpose: 'Digital detox · Bớt mạng xã hội',
    color: 'emerald',
    taunts: [
      'Kéo phátttt nữa thôiii 🤤',
      'Có thông báo mới kìa, xem nhanh lắm~ 🔔',
      'Story người yêu cũ đăng gì kìa 👀',
      'Não cần "giải trí nhẹ" 3 tiếng thôi mà!'
    ],
    defeats: ['Brainnn... à nhầm, thua rồi 😵', 'Không dopamine... tớ tan biến đây...', 'Cậu cai được tớ thật à?!'],
    intro: 'Grừừ... Zombie Lướt đây. Mỗi cú vuốt vô thức là tôi mạnh thêm một chút. Buông điện thoại xuống xem nào 🧟',
    examples: [
      { habit: 'Không điện thoại sau 22h', tiny: 'Tắt thông báo 1 app', emoji: '📵' },
      { habit: 'Screen time dưới 3 tiếng', tiny: 'Xóa 1 app gây nghiện khỏi màn hình chính', emoji: '⏳' }
    ]
  },
  {
    id: 'quai_thung_vi',
    name: 'Quái Thủng Ví',
    emoji: '🕳️',
    identity: 'Người vững tài chính',
    identityEmoji: '💰',
    purpose: 'Tiết kiệm · Tài chính',
    color: 'amber',
    taunts: [
      'Sale 50% kìa, không mua là LỖ đó!! 🛍️',
      'Trà sữa chỉ 45k, rẻ mà~ 🧋',
      'Tiền là để tiêu, tiết kiệm làm gì cho khổ 💸',
      'Freeship 0đ, không chốt hơi phí nha!'
    ],
    defeats: ['Ví... đóng... chặt quá... 😵', 'Hôm nay không moi được đồng nào!', 'Cậu giàu lên là tớ đói đó!'],
    intro: 'Hè hè, Quái Thủng Ví xin chào! Tôi sống trong những cú "chốt đơn" lúc nửa đêm. Giữ được ví không nào? 🕳️',
    examples: [
      { habit: 'Ghi chép chi tiêu', tiny: 'Ghi lại 1 khoản hôm nay', emoji: '📒' },
      { habit: 'Không mua đồ ngoài kế hoạch', tiny: 'Bỏ 1 món khỏi giỏ hàng', emoji: '🛒' }
    ]
  },
  {
    id: 'suong_mu_lo_au',
    name: 'Sương Mù Lo Âu',
    emoji: '🌫️',
    identity: 'Người an yên',
    identityEmoji: '🧘',
    purpose: 'Thiền · Journal · Tinh thần',
    color: 'cyan',
    taunts: [
      'Ngồi yên 5 phút? Để nghĩ về 47 chuyện xấu hổ năm 2019 nhé 🙃',
      'Viết nhật ký làm gì, lo lắng tiếp đi~',
      'Thở sâu vô ích lắm, lo trước đi cho chắc 😰',
      'Tương lai mờ mịt lắm, để tôi kể cho nghe...'
    ],
    defeats: ['Tâm trí... trong veo quá... tớ tan mất 😵', 'Bình yên gì mà bình yên hoài vậy!', 'Hơi thở của cậu thổi bay tớ rồi...'],
    intro: 'Xìì... tôi là Sương Mù Lo Âu, chuyên phủ kín đầu cậu bằng "nhỡ đâu...". Hít thở sâu mà đuổi tôi đi xem 🌫️',
    examples: [
      { habit: 'Thiền 10 phút', tiny: 'Hít thở sâu 5 nhịp', emoji: '🧘' },
      { habit: 'Viết journal mỗi tối', tiny: 'Viết 1 câu biết ơn', emoji: '✍️' }
    ]
  },
  {
    id: 'bang_nguoi_lanh',
    name: 'Băng Nguội Lạnh',
    emoji: '🧊',
    identity: 'Cặp đôi gắn bó',
    identityEmoji: '💞',
    purpose: 'Thói quen đôi · Tình cảm',
    color: 'fuchsia',
    taunts: [
      'Hôm nay khỏi ôm nhau ha, ai xem máy nấy đi 📱',
      'Nói chuyện gì tầm này, mai nói~ 🥶',
      '"Ừ", "Ok", "Tùy" — nhắn vậy đủ rồi!',
      'Hẹn hò chi cho mệt, ở nhà mỗi người một góc êm hơn'
    ],
    defeats: ['Nóng quá... tớ tan chảy mất 😵💕', 'Dính nhau vậy ai chịu nổi!', 'Thôi được rồi, ngọt vừa thôi!'],
    intro: 'Krrrk... Băng Nguội Lạnh đây. Tôi dày lên sau mỗi ngày hai người quên nhau. Cùng nhau làm tan tôi chứ? 🧊',
    examples: [
      { habit: 'Ôm nhau nói chuyện 10 phút', tiny: 'Một cái ôm thật chặt', emoji: '🤗' },
      { habit: 'Khen nhau 1 câu mỗi ngày', tiny: 'Nhắn 1 tin nhắn dễ thương', emoji: '💌' }
    ]
  }
];

export const getMonster = (id: string): Monster =>
  BESTIARY.find((m) => m.id === id) || BESTIARY[0];

/** Trạng thái hình ảnh của quái theo điểm tự động hóa của thói quen */
export const MONSTER_STAGES = [
  { label: 'HUNG HĂNG', scale: 'text-6xl', desc: 'Quái đang rất mạnh!' },
  { label: 'GIẰNG CO', scale: 'text-5xl', desc: 'Cuộc chiến cân tài cân sức' },
  { label: 'RUN RẨY', scale: 'text-4xl', desc: 'Quái bắt đầu sợ bạn rồi' },
  { label: 'TEO TÓP', scale: 'text-3xl', desc: 'Sắp phong ấn được rồi!' }
] as const;

export const pickLine = (lines: string[], seed: number): string =>
  lines[Math.abs(seed) % lines.length];
