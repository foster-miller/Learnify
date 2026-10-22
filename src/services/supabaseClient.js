import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// False when the two VITE_SUPABASE_* variables were not set at build time (for example, forgotten in the
// hosting dashboard). Browsing topics works without them; accounts and saved data do not.
export const supabaseConfigured = Boolean(url && key)
if (!supabaseConfigured) {
  console.warn('Learnify: Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Browsing works; accounts do not.')
}

// The publishable key is safe in the browser: Row Level Security decides what each user can touch.
// Placeholders stop createClient from throwing at startup, which would leave a blank page.
export const supabase = createClient(url || 'http://localhost:54321', key || 'not-configured')
