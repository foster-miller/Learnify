const ABBREVIATIONS = /(?:\b(?:Dr|Mr|Mrs|Ms|Prof|St|Jr|Sr|vs|etc|Inc|Ltd|No|Mt|Gen|Col|Lt|Sgt|Rev|Hon|Fr)|\b[A-Z]|\bc|\bca|\bU\.S|\bU\.K)\.$/

// Sentence ends: ., ! or ? followed by a space and a capital/quote, but not after an abbreviation or initial.
function sentenceEnds(text) {
  const ends = []
  for (const m of text.matchAll(/[.!?]["”’)]*\s+(?=[A-Z"“(])/g)) {
    const end = m.index + m[0].trimEnd().length
    if (!ABBREVIATIONS.test(text.slice(0, end))) ends.push(end)
  }
  return ends
}

// Removes pronunciation and transliteration clutter such as "( or ; Japanese: 京都, Kyōto [k̟ʲjó̞ò̞.tò̞] )":
// parentheticals holding IPA brackets, non-Latin scripts, or "pronounced". Dates and "née" notes stay.
const FOREIGN = /[\u0250-\u02FF\u0300-\u1DFF\u1F00-\u1FFF\u2E80-\uFFFF]|\[|pronounced|\blisten\b/i
export function stripPronunciation(text) {
  return text
    .replace(/\s*\(([^()]*)\)/g, (all, inner) => (!inner.trim() || FOREIGN.test(inner) || /^[\s;,]*(or\b|;)/.test(inner) ? '' : all))
    .replace(/\s+([,;.])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Splits an intro paragraph into a short summary (first sentence, or two if the first is tiny)
// and the remainder, so the same words are never shown twice.
export function splitLead(paragraph = '', { min = 90, max = 320 } = {}) {
  const text = stripPronunciation(paragraph)
  const ends = sentenceEnds(text)
  let cut = ends[0] ?? text.length
  if (cut < min && ends[1] && ends[1] <= 260) cut = ends[1]
  if (cut > max) {
    const space = text.lastIndexOf(' ', max - 20)
    cut = space > 0 ? space : max
    return { brief: `${text.slice(0, cut).replace(/[,;:\s]+$/, '')}…`, rest: text.slice(cut).trim() }
  }
  return { brief: text.slice(0, cut).trim(), rest: text.slice(cut).trim() }
}
