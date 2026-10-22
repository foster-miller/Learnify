// public.profiles: one row per user, created by the on_auth_user_created trigger.
// Parental mode ('kids') is deliberately not stored here; its PIN stays on the device.
import { supabase } from './supabaseClient'

export const profileService = {
  async get() {
    const { data, error } = await supabase
      .from('profiles')
      .select('text_size, theme, content_filter')
      .maybeSingle()
    if (error) throw error
    return data
  },
  async save(userId, { textSize, theme, showMature }) {
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      text_size: textSize,
      theme,
      content_filter: showMature ? 'off' : 'nsfw',
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },
}
