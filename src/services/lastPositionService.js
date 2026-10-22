// One row per user in public.last_position: the drill-down trail they were last on.
import { supabase } from './supabaseClient'

export const lastPositionService = {
  async get() {
    const { data, error } = await supabase.from('last_position').select('trail').maybeSingle()
    if (error) throw error
    return data?.trail ?? []
  },
  async save(trail) {
    const { error } = await supabase
      .from('last_position')
      .upsert({ trail: trail.slice(-50), updated_at: new Date().toISOString() })
    if (error) throw error
  },
}
