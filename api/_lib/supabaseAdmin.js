import { createClient } from '@supabase/supabase-js';

// Server-only client using the service_role key (never sent to the
// browser — set only as a server environment variable). It bypasses Row
// Level Security entirely, which is exactly what push-subscription storage
// needs: those rows aren't owned by any authenticated user (see
// supabase/schema.sql), so RLS denies the public anon/authenticated roles
// and only this trusted server-side key can read or write them.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAdmin = supabaseAdminConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
