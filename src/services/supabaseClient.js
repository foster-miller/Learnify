import { createClient } from '@supabase/supabase-js'

// The publishable key is safe in the browser: Row Level Security decides what each user can touch.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
