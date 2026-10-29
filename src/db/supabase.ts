import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Shared Supabase client, used to reach the `groq` Edge Function.
 *
 * It is `null` when the project has not been configured (see `.env.example`);
 * content generation then falls back to the local templates in `lib/contentGenerators`.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
