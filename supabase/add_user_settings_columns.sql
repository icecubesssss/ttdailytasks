-- Migration to add missing user settings columns to user_stats table

ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS owned_item_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS active_booster JSONB,
ADD COLUMN IF NOT EXISTS is_dark_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_mode TEXT DEFAULT 'cute',
ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'google/gemma-4-31b-it:free',
ADD COLUMN IF NOT EXISTS mascot_name TEXT DEFAULT 'Mochi',
ADD COLUMN IF NOT EXISTS mascot_avatar TEXT DEFAULT '🤖',
ADD COLUMN IF NOT EXISTS calendar_visibility JSONB DEFAULT '{"tit": true, "tun": true}'::jsonb,
ADD COLUMN IF NOT EXISTS default_view TEXT DEFAULT 'tasks',
ADD COLUMN IF NOT EXISTS auto_sync_calendar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS music JSONB DEFAULT '{"currentTrackIdx": 0, "isPlaying": false, "volume": 0.7, "isMuted": false}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_focus_shortcut BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shortcut_name TEXT DEFAULT 'Làm việc',
ADD COLUMN IF NOT EXISTS off_shortcut_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ticket_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS unlocked_badge_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_seen_level INTEGER DEFAULT 1;
