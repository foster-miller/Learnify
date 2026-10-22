// Best-effort keyword filter. Levels: 'off' | 'nsfw' (default) | 'kids' (parental mode).
// Real moderation needs a backend; this only keeps obviously mature topics out of lists.
const NSFW = [
  'porn', 'erotic', 'sex act', 'sexual intercourse', 'fetish', 'nudity', 'nude', 'genital', 'orgasm',
  'prostitut', 'bdsm', 'masturbat', 'hentai', 'striptease', 'sex position',
]
const KIDS = [
  'murder', 'massacre', 'genocide', 'suicide', 'torture', 'rape', 'serial killer', 'gore', 'drug abuse',
  'cocaine', 'heroin', 'methamphetamine', 'alcoholism', 'gambling', 'terroris', 'execution', 'war crime',
  'sexual', 'sex ', 'abortion', 'slavery', 'self-harm',
]

let level = 'nsfw'

export const setFilterLevel = (next) => {
  level = next
}
export const getFilterLevel = () => level

export function isAllowed(item) {
  if (level === 'off') return true
  const text = `${item.title} ${item.description || ''} ${item.extract || ''}`.toLowerCase()
  const words = level === 'kids' ? [...NSFW, ...KIDS] : NSFW
  return !words.some((w) => text.includes(w))
}

export const applyFilter = (items) => items.filter(isAllowed)
