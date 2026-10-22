// Supabase Auth (email + password). Sessions persist in the browser automatically.
// OAuth providers can be added later with supabase.auth.signInWithOAuth.
import { supabase } from './supabaseClient'

// Reduce a Supabase user to the small shape the UI uses.
export const toUser = (u) =>
  u && {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0],
  }

export const authService = {
  async getUser() {
    const { data } = await supabase.auth.getSession()
    return toUser(data.session?.user)
  },
  // Calls back on sign-in, sign-out and token refresh. Returns an unsubscribe function.
  onChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toUser(session?.user)))
    return () => data.subscription.unsubscribe()
  },
  async signIn({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  // `needsConfirmation` is true when the project requires email confirmation before a session exists.
  async signUp({ email, password, name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: name ? { full_name: name } : {} },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  },
  async signOut() {
    await supabase.auth.signOut()
  },
}
