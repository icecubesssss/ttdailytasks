-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: team_members (Replaces public/team_members and users collection)
CREATE TABLE IF NOT EXISTS public.team_members (
    uid TEXT PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    last_active BIGINT
);

-- Table: user_stats
CREATE TABLE IF NOT EXISTS public.user_stats (
    uid TEXT PRIMARY KEY REFERENCES public.team_members(uid) ON DELETE CASCADE,
    xp BIGINT DEFAULT 0,
    gold BIGINT DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    streak_freezes INTEGER DEFAULT 3,
    freeze_shards INTEGER DEFAULT 0,
    last_check_in TEXT,
    check_in_history JSONB DEFAULT '{}'::jsonb
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    type TEXT NOT NULL, -- 'daily', 'oneoff', 'recurring'
    difficulty TEXT, -- 'trivial', 'easy', 'medium', 'hard'
    urgency TEXT, -- 'high', 'normal', 'low'
    is_done BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    assignee_id TEXT REFERENCES public.team_members(uid),
    priority INTEGER DEFAULT 0,
    created_at BIGINT,
    completed_at BIGINT
);

-- Table: habits
CREATE TABLE IF NOT EXISTS public.habits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    type TEXT NOT NULL, -- 'good', 'bad', 'combo'
    base_gold INTEGER DEFAULT 0,
    base_xp INTEGER DEFAULT 0,
    history JSONB DEFAULT '{}'::jsonb,
    active_combo INTEGER DEFAULT 0,
    highest_combo INTEGER DEFAULT 0,
    cooldown_end BIGINT,
    is_duo BOOLEAN DEFAULT false,
    assignee_id TEXT REFERENCES public.team_members(uid),
    daily_check_ins JSONB DEFAULT '{}'::jsonb,
    cue_time TEXT,
    monster_id TEXT,
    drop_count INTEGER DEFAULT 0,
    last_defeated BIGINT,
    monster_phase INTEGER DEFAULT 1
);

-- Table: weekly_boss
CREATE TABLE IF NOT EXISTS public.weekly_boss (
    id TEXT PRIMARY KEY,
    hp_left INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    phase INTEGER DEFAULT 1,
    is_defeated BOOLEAN DEFAULT false
);

-- Table: daily_quests
CREATE TABLE IF NOT EXISTS public.daily_quests (
    id TEXT PRIMARY KEY,
    uid TEXT REFERENCES public.team_members(uid),
    type TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    reward JSONB NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at BIGINT
);

-- Functions
-- RPC for checking in habit and awarding stats safely
CREATE OR REPLACE FUNCTION award_stats_rpc(
    p_uid TEXT,
    p_xp BIGINT,
    p_gold BIGINT,
    p_shards INTEGER DEFAULT 0,
    p_freezes INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_stats
    SET xp = xp + p_xp,
        gold = gold + p_gold,
        freeze_shards = freeze_shards + p_shards,
        streak_freezes = streak_freezes + p_freezes,
        level = (xp + p_xp) / 1000 + 1 -- Simplified level calc, frontend does the exact
    WHERE uid = p_uid;
END;
$$;

CREATE OR REPLACE FUNCTION damage_weekly_boss_rpc(
    p_boss_id TEXT,
    p_damage INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.weekly_boss
    SET hp_left = GREATEST(0, hp_left - p_damage)
    WHERE id = p_boss_id;
END;
$$;
