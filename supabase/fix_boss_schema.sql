DROP TABLE IF EXISTS public.weekly_boss;
CREATE TABLE public.weekly_boss (
    week_key TEXT PRIMARY KEY,
    boss_id TEXT NOT NULL,
    max_hp INTEGER NOT NULL,
    damage JSONB DEFAULT '{}'::jsonb,
    defeated_at BIGINT,
    claimed JSONB DEFAULT '{}'::jsonb
);

DROP TABLE IF EXISTS public.daily_quests;
CREATE TABLE public.daily_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    reward_gold INTEGER NOT NULL,
    deadline TEXT NOT NULL,
    tone TEXT NOT NULL,
    date_key TEXT NOT NULL,
    updated_at BIGINT,
    is_completed BOOLEAN DEFAULT false,
    completed_by TEXT,
    completed_by_name TEXT,
    completed_at BIGINT
);
