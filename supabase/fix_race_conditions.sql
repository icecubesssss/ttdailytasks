-- Fix race conditions for Boss Damage and Duo Habit check-ins

-- 1. Boss Damage RPC
CREATE OR REPLACE FUNCTION deal_boss_damage_rpc(
    p_week_key TEXT,
    p_actor_key TEXT,
    p_amount INTEGER,
    p_now BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_boss RECORD;
    v_new_damage JSONB;
    v_total_damage INTEGER;
    v_just_defeated BOOLEAN := false;
BEGIN
    -- Lock the row to prevent concurrent modifications
    SELECT * INTO v_boss FROM public.weekly_boss WHERE week_key = p_week_key FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Boss not found for week %', p_week_key;
    END IF;

    IF v_boss.defeated_at IS NOT NULL THEN
        -- Already defeated, just return current state
        SELECT COALESCE(SUM(value::int), 0) INTO v_total_damage FROM jsonb_each_text(v_boss.damage);
        RETURN jsonb_build_object('justDefeated', false, 'totalDamage', v_total_damage, 'bossId', v_boss.boss_id);
    END IF;

    -- Calculate new damage
    v_new_damage := v_boss.damage;
    IF v_new_damage ? p_actor_key THEN
        v_new_damage := jsonb_set(v_new_damage, ARRAY[p_actor_key], to_jsonb((v_new_damage->>p_actor_key)::int + p_amount));
    ELSE
        v_new_damage := jsonb_set(v_new_damage, ARRAY[p_actor_key], to_jsonb(p_amount));
    END IF;

    -- Calculate total damage
    SELECT COALESCE(SUM(value::int), 0) INTO v_total_damage FROM jsonb_each_text(v_new_damage);

    -- Check if defeated
    IF v_total_damage >= v_boss.max_hp THEN
        v_just_defeated := true;
        UPDATE public.weekly_boss 
        SET damage = v_new_damage, defeated_at = p_now
        WHERE week_key = p_week_key;
    ELSE
        UPDATE public.weekly_boss 
        SET damage = v_new_damage
        WHERE week_key = p_week_key;
    END IF;

    RETURN jsonb_build_object('justDefeated', v_just_defeated, 'totalDamage', v_total_damage, 'bossId', v_boss.boss_id);
END;
$$;

-- 2. Habit Duo Atomic Check-in RPC
CREATE OR REPLACE FUNCTION atomic_update_habit_duo_rpc(
    p_habit_id TEXT,
    p_date_key TEXT,
    p_actor_key TEXT,
    p_partner_key TEXT,
    p_claim_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_habit RECORD;
    v_history JSONB;
    v_drops JSONB;
    v_existing TEXT;
    v_new_val TEXT;
    v_action TEXT;
BEGIN
    -- Lock the row
    SELECT * INTO v_habit FROM public.habits WHERE id = p_habit_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Habit not found';
    END IF;

    v_history := COALESCE(v_habit.history, '{}'::jsonb);
    v_drops := COALESCE(v_habit.drops_claimed, '{}'::jsonb);
    v_existing := v_history->>p_date_key;

    -- State machine logic
    IF v_existing = p_actor_key THEN
        v_new_val := NULL;
        v_action := 'unchecked';
    ELSIF v_existing = 'done' THEN
        v_new_val := p_partner_key;
        v_action := 'unchecked_duo';
    ELSIF v_existing = p_partner_key THEN
        v_new_val := 'done';
        v_action := 'checked_duo';
    ELSE
        v_new_val := p_actor_key;
        v_action := 'checked';
    END IF;

    -- Apply history changes
    IF v_new_val IS NULL THEN
        v_history := v_history - p_date_key;
    ELSE
        v_history := jsonb_set(v_history, ARRAY[p_date_key], to_jsonb(v_new_val));
    END IF;

    -- Apply drops claimed
    IF p_claim_key IS NOT NULL THEN
        v_drops := jsonb_set(v_drops, ARRAY[p_claim_key], 'true'::jsonb);
    END IF;

    UPDATE public.habits 
    SET history = v_history, drops_claimed = v_drops 
    WHERE id = p_habit_id;

    RETURN jsonb_build_object('action', v_action, 'history', v_history, 'drops_claimed', v_drops, 'existing', COALESCE(v_existing, 'none'));
END;
$$;
