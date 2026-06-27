CREATE TABLE IF NOT EXISTS public.shared_music (
    id TEXT PRIMARY KEY,
    mood TEXT,
    title TEXT NOT NULL,
    artist TEXT,
    cover TEXT,
    url TEXT NOT NULL,
    storage_path TEXT,
    drive_id TEXT,
    is_custom BOOLEAN DEFAULT false,
    created_at TEXT,
    uploaded_by TEXT
);

-- Disable RLS to allow anon insert for now, or just create a policy
ALTER TABLE public.shared_music DISABLE ROW LEVEL SECURITY;
