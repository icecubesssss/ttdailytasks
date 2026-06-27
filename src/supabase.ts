import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cnzjuorvyfchfgwrgqkb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_JZEdW-Sp-BCfHdS3K076BA_Vm7ZY1Je";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
