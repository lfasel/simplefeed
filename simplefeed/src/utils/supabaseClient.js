import { createClient } from "@supabase/supabase-js"

// Shared Supabase client used across app modules.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
