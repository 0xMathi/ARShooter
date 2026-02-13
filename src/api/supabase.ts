import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase client - null if credentials are not configured */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export function isLeaderboardEnabled(): boolean {
  return supabase !== null;
}
