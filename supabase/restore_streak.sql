UPDATE public.habits
SET assignee_id = 'b85afcd1-37cb-4ab5-8c9d-90127fbe2de3'
WHERE assignee_id IS NULL;

UPDATE public.user_stats
SET streak = 59
WHERE uid = 'b85afcd1-37cb-4ab5-8c9d-90127fbe2de3';
