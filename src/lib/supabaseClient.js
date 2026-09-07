import { createClient } from '@supabase/supabase-js';

// Real accounts/sync are opt-in: until VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set (see .env.example), the app keeps working
// exactly as before, on localStorage alone — nothing here breaks the
// no-backend demo while those credentials aren't configured yet.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
