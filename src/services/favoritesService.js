// Favorites live in public.favorites. RLS limits every query to the signed-in user's rows,
// and user_id defaults to auth.uid(), so the app never sends it.
import { supabase } from './supabaseClient'

export const favoritesService = {
  // Titles only, newest first. The Favorites page re-fetches images and summaries from Wikipedia.
  async list() {
    const { data, error } = await supabase
      .from('favorites')
      .select('topic_title')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((r) => r.topic_title)
  },
  async add(title) {
    const { error } = await supabase.from('favorites').insert({ topic_title: title })
    if (error && error.code !== '23505') throw error // 23505 = already saved
  },
  async remove(title) {
    const { error } = await supabase.from('favorites').delete().eq('topic_title', title)
    if (error) throw error
  },
}
