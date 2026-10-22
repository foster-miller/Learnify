// Wikipedia data source. Everything the UI needs goes through this file, so another
// wiki (or a backend) can replace it as long as the returned shapes stay the same:
//   Topic = { title, description, extract, image, url }
import { applyFilter } from './contentFilter'

const API = 'https://en.wikipedia.org/w/api.php'
const REST = 'https://en.wikipedia.org/api/rest_v1'

const cache = new Map()

async function getJSON(url) {
  if (cache.has(url)) return cache.get(url)
  const promise = fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`)
    const json = await res.json()
    // The Action API reports throttling/errors as HTTP 200 with an `error` body.
    if (json.error) throw new Error(json.error.info || 'Wikipedia is busy. Please try again.')
    return json
  })
  cache.set(url, promise)
  promise.catch(() => cache.delete(url)) // never cache failures
  return promise
}

const action = (params) => {
  const qs = new URLSearchParams({ format: 'json', origin: '*', ...params })
  return getJSON(`${API}?${qs}`)
}

const pageToTopic = (p) => ({
  title: p.title,
  description: p.description || '',
  extract: p.extract || '',
  image: p.thumbnail?.source || null,
  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
})

const PAGE_PROPS = {
  prop: 'pageimages|extracts|description',
  piprop: 'thumbnail',
  pithumbsize: '600',
  exintro: '1',
  explaintext: '1',
  exsentences: '2',
  exlimit: 'max',
}

const byIndex = (a, b) => (a.index ?? 0) - (b.index ?? 0)
const toTopics = (data) => Object.values(data.query?.pages || {}).sort(byIndex).map(pageToTopic)

export async function search(term, limit = 12) {
  if (!term.trim()) return []
  const data = await action({
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrlimit: String(limit),
    ...PAGE_PROPS,
  })
  return applyFilter(toTopics(data).filter((t) => !/disambiguation/i.test(t.description)))
}

// Batch lookup of specific titles, returned in the order requested.
export async function getTopics(titles) {
  const data = await action({ action: 'query', titles: titles.join('|'), redirects: '1', ...PAGE_PROPS })
  const pages = Object.values(data.query?.pages || {}).map(pageToTopic)
  const byTitle = new Map(pages.map((p) => [p.title.toLowerCase(), p]))
  const redirects = new Map((data.query?.redirects || []).map((r) => [r.from.toLowerCase(), r.to.toLowerCase()]))
  const found = titles
    .map((t) => byTitle.get(t.toLowerCase()) || byTitle.get(redirects.get(t.toLowerCase())))
    .filter(Boolean)
  // Different requested titles can redirect to the same article; keep it once.
  return [...new Map(found.map((t) => [t.title, t])).values()]
}

export async function getSummary(title) {
  const data = await getJSON(`${REST}/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
  return {
    title: data.title,
    description: data.description || '',
    extract: data.extract || '',
    image: data.originalimage?.source || data.thumbnail?.source || null,
    imageCaption: data.description || data.title,
    url: data.content_urls?.desktop?.page,
    isDisambiguation: data.type === 'disambiguation',
  }
}

const NOISE = /^(list of|index of|outline of|\d{3,4}\b|wikipedia|help:|category:)|\(disambiguation\)|\d{4}.*\s[–—]\s|^(isbn|issn|oclc|doi|pmid|jstor|wayback machine|bibcode)$/i

// Lateral topics: pages similar to this one, with images and blurbs.
export async function getLateralTopics(title, limit = 20) {
  // `morelike:` ranks pages by similarity, so each step stays on-theme. Linked pages
  // (generator=links, prop=links) come back alphabetical, which is noise.
  const data = await action({
    action: 'query',
    generator: 'search',
    gsrsearch: `morelike:${title}`,
    gsrnamespace: '0',
    gsrlimit: '30',
    ...PAGE_PROPS,
    exsentences: '1',
  })
  const topics = toTopics(data).filter(
    (t) => t.extract && t.title !== title && !NOISE.test(t.title) && !/disambiguation/i.test(t.description),
  )
  return applyFilter(topics).slice(0, limit)
}

const BAD_CATEGORY = /(\bbirths$|\bdeaths$|living people|articles|wikipedia|pages|cs1|use |all |short description|webarchive|wikidata|commons|stubs|redirects)/i

export async function getRelatedCategories(title, limit = 6) {
  const data = await action({
    action: 'query',
    titles: title,
    prop: 'categories',
    clshow: '!hidden',
    cllimit: '40',
  })
  const page = Object.values(data.query?.pages || {})[0]
  const names = (page?.categories || [])
    .map((c) => c.title.replace(/^Category:/, ''))
    .filter((n) => !BAD_CATEGORY.test(n))
    .slice(0, limit)
  return applyFilter(names.map((title) => ({ title })))
}

export async function getRandomTopic(attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${REST}/page/random/summary`)
    if (!res.ok) continue
    const d = await res.json()
    const topic = {
      title: d.title,
      description: d.description || '',
      extract: d.extract || '',
      image: d.originalimage?.source || d.thumbnail?.source || null,
    }
    if (d.type !== 'disambiguation' && topic.extract && applyFilter([topic]).length) return topic
  }
  throw new Error('Could not find a random topic. Please try again.')
}

// ---------------------------------------------------------------------------------------------
// Full article: every section of the page as plain text, so nothing Wikipedia knows is hidden.
// ---------------------------------------------------------------------------------------------
const SKIP_SECTIONS = /^(see also|notes?|references?|further reading|external links|bibliography|sources|citations|footnotes|works cited|selected bibliography)$/i
const paragraphs = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean)

// Plain-text extracts mark headings as "== Title ==" (level = number of "=" signs).
function parseSections(text) {
  const matches = [...text.matchAll(/^(={2,6})\s*(.+?)\s*\1\s*$/gm)]
  const lead = paragraphs(text.slice(0, matches[0]?.index ?? text.length))
  const sections = []
  let current = null
  matches.forEach((m, i) => {
    const level = m[1].length
    const body = paragraphs(text.slice(m.index + m[0].length, matches[i + 1]?.index ?? text.length))
    const id = `section-${i}`
    if (level === 2) {
      current = SKIP_SECTIONS.test(m[2]) ? null : { id, title: m[2], paragraphs: body, children: [] }
      if (current) sections.push(current)
    } else if (current) {
      current.children.push({ id, title: m[2], level, paragraphs: body })
    }
  })
  return {
    lead,
    sections: sections.filter((s) => s.paragraphs.length || s.children.some((c) => c.paragraphs.length)),
  }
}

export async function getArticle(title) {
  const data = await action({
    action: 'query',
    prop: 'extracts|pageprops',
    ppprop: 'wikibase_item',
    explaintext: '1',
    exsectionformat: 'wiki',
    redirects: '1',
    titles: title,
  })
  const page = Object.values(data.query?.pages || {})[0]
  if (!page || page.missing !== undefined) throw new Error('Article not found')
  const parsed = parseSections(page.extract || '')
  // Body text only (no References/Notes), so reference boilerplate such as "ISBN" never ranks as a topic.
  const plain = [...parsed.lead, ...parsed.sections.flatMap((sec) => [...sec.paragraphs, ...sec.children.flatMap((c) => c.paragraphs)])].join('\n')
  return { qid: page.pageprops?.wikibase_item || null, plain, ...parsed }
}

// ---------------------------------------------------------------------------------------------
// Wikidata: structured facts (birthplace, age, awards…) plus "deeper" and "zoom out" topics.
// ---------------------------------------------------------------------------------------------
const WD = 'https://www.wikidata.org/w/api.php'
const wikidata = (params) => getJSON(`${WD}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`)

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function parseTime(value) {
  const m = /^([+-])(\d+)-(\d\d)-(\d\d)/.exec(value?.time || '')
  if (!m) return null
  return { year: Number(m[2]), bce: m[1] === '-', month: Number(m[3]), day: Number(m[4]), precision: value.precision }
}

function formatDate(t) {
  if (!t) return null
  // Deep time (fossil ranges, geology): "323 million years ago" reads better than "323200000 BC".
  if (t.bce && t.year >= 1e6) return `${Math.round(t.year / 1e6).toLocaleString('en-US')} million years ago`
  const era = t.bce ? ' BC' : ''
  if (t.precision >= 11 && t.month && t.day) return `${t.day} ${MONTHS[t.month - 1]} ${t.year}${era}`
  if (t.precision >= 10 && t.month) return `${MONTHS[t.month - 1]} ${t.year}${era}`
  return `${t.year}${era}`
}

function ageBetween(born, end) {
  if (!born || born.bce || born.precision < 9) return null
  let age = end.year - born.year
  if (born.precision >= 11 && (end.month < born.month || (end.month === born.month && end.day < born.day))) age -= 1
  return age >= 0 && age < 130 ? age : null
}

// Most recent value of a quantity property (population, area): preferred rank, else latest "point in time".
function latestQuantity(list = []) {
  const live = list.filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue?.value?.amount)
  if (!live.length) return null
  const stamp = (c) => c.qualifiers?.P585?.[0]?.datavalue?.value?.time || ''
  const best = live.find((c) => c.rank === 'preferred') || live.reduce((a, b) => (stamp(b) > stamp(a) ? b : a))
  const v = best.mainsnak.datavalue.value
  return { amount: Number(v.amount), unit: (v.unit || '').split('/').pop() }
}

// Properties to read, in display order: [property, max values shown].
const PERSON_FACTS = [['P106', 4, 'Occupation'], ['P27', 3, 'Citizenship'], ['P69', 3, 'Education'], ['P166', 4, 'Awards'], ['P26', 2, 'Spouse'], ['P800', 3, 'Notable works']]
const GENERIC_FACTS = [
  ['P31', 2, 'Type'], ['P105', 1, 'Rank'], ['P171', 1, 'Parent taxon'], ['P141', 1, 'Conservation status'],
  ['P17', 2, 'Country'], ['P131', 2, 'Location'], ['P276', 2, 'Venue'], ['P159', 1, 'Headquarters'],
  ['P36', 1, 'Capital'], ['P6', 1, 'Head of government'], ['P169', 1, 'CEO'], ['P452', 2, 'Industry'],
  ['P1029', 4, 'Crew'], ['P710', 4, 'Participants'], ['P664', 2, 'Organized by'],
  ['P170', 2, 'Created by'], ['P112', 2, 'Founded by'], ['P178', 2, 'Developer'],
]
// Properties whose extra values are history (past mayors, former capitals): show one, hide the count.
const SINGLE_VALUE = new Set(['P6', 'P36', 'P169', 'P159'])
// Closely connected items worth opening next ("dive deeper").
const PERSON_DEEPER = ['P69', 'P108', 'P166', 'P26', 'P800', 'P101', 'P737', 'P19', 'P20']
const GENERIC_DEEPER = ['P527', 'P178', 'P170', 'P112', 'P131', 'P138']
// Broader items ("zoom out").
const PERSON_BROADER = ['P106', 'P27']
const GENERIC_BROADER = ['P171', 'P279', 'P361', 'P17'] // parent taxon, subclass of, part of, country

export async function getRelated(qid, selfTitle) {
  const ent = await wikidata({ action: 'wbgetentities', ids: qid, props: 'claims' })
  const claims = ent.entities?.[qid]?.claims || {}
  const ids = (p) =>
    (claims[p] || [])
      .filter((c) => c.rank !== 'deprecated')
      .map((c) => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean)
  // The present holder of a single-holder role (CEO, mayor, capital…): Wikidata marks past holders with an
  // end date, so take the preferred entry, else the latest one with no end. Nothing is better than a wrong answer.
  const startOf = (c) => c.qualifiers?.P580?.[0]?.datavalue?.value?.time || ''
  const current = (p) => {
    const live = (claims[p] || []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue?.value?.id)
    const preferred = live.filter((c) => c.rank === 'preferred')
    const open = preferred.length ? preferred : live.filter((c) => !c.qualifiers?.P582)
    return open.sort((a, b) => startOf(b).localeCompare(startOf(a))).map((c) => c.mainsnak.datavalue.value.id)
  }
  const time = (p) => parseTime(claims[p]?.find((c) => c.rank !== 'deprecated')?.mainsnak?.datavalue?.value)

  const isPerson = ids('P31').includes('Q5')
  const factSpec = isPerson ? PERSON_FACTS : GENERIC_FACTS
  const deeperProps = isPerson ? PERSON_DEEPER : GENERIC_DEEPER
  const broaderProps = isPerson ? PERSON_BROADER : GENERIC_BROADER
  const take = (props, per) => props.flatMap((p) => ids(p).slice(0, per))
  const deeperIds = [...new Set(take(deeperProps, 3))].slice(0, 14)
  let broaderIds = [...new Set(take(broaderProps, 3).filter((id) => id !== 'Q5'))]
  // "Instance of" (taxon, painting…) only helps when nothing more specific exists.
  if (!isPerson && broaderIds.length === 0) broaderIds = [...new Set([...broaderIds, ...ids('P31').slice(0, 3)])]
  broaderIds = broaderIds.slice(0, 8)
  const need = new Set([
    ...deeperIds,
    ...broaderIds,
    ...factSpec.flatMap(([p, n]) => (SINGLE_VALUE.has(p) ? current(p).slice(0, n) : ids(p).slice(0, n * 3))),
    ...ids('P19').slice(0, 2),
    ...ids('P20').slice(0, 2),
  ])

  // One call turns every referenced item into an English label and (if it exists) an enwiki article title.
  // wbgetentities accepts at most 50 ids per call, so resolve in batches.
  const refs = {}
  const all = [...need]
  const batches = Array.from({ length: Math.ceil(all.length / 50) }, (_, i) => all.slice(i * 50, i * 50 + 50))
  const resolved = await Promise.all(
    batches.map((batch) =>
      wikidata({ action: 'wbgetentities', ids: batch.join('|'), props: 'labels|sitelinks', languages: 'en', sitefilter: 'enwiki' }),
    ),
  )
  for (const data of resolved) {
    for (const [id, e] of Object.entries(data.entities || {})) {
      const article = e.sitelinks?.enwiki?.title || null
      // Newer entries sometimes lack an English label but already have an English article.
      refs[id] = { text: e.labels?.en?.value || article?.replace(/\s*\(.*\)$/, ''), title: article }
    }
  }
  const part = (id) => (refs[id]?.text ? refs[id] : null)

  const facts = []
  if (isPerson) {
    const born = time('P569')
    const died = time('P570')
    const bornPlaces = ids('P19').slice(0, 2).map(part).filter(Boolean)
    if (born || bornPlaces.length) {
      const now = new Date()
      const age = died ? null : ageBetween(born, { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
      facts.push({
        label: 'Born',
        parts: [formatDate(born) && { text: formatDate(born) }, ...bornPlaces].filter(Boolean),
        note: age != null ? `age ${age}` : null,
      })
    }
    if (died) {
      const diedPlaces = ids('P20').slice(0, 2).map(part).filter(Boolean)
      const age = ageBetween(time('P569'), died)
      facts.push({
        label: 'Died',
        parts: [{ text: formatDate(died) }, ...diedPlaces],
        note: age != null ? `aged ${age}` : null,
      })
    }
  } else {
    const sciName = claims.P225?.[0]?.mainsnak?.datavalue?.value
    if (typeof sciName === 'string') facts.push({ label: 'Scientific name', parts: [{ text: sciName }] })
    for (const [prop, label] of [['P577', 'Published'], ['P619', 'Launched'], ['P620', 'Landed'], ['P580', typeof sciName === 'string' ? 'First appeared' : 'Started'], ['P582', 'Ended'], ['P585', 'Date']]) {
      const t = time(prop)
      if (t && (label !== 'Date' || !time('P580'))) facts.push({ label, parts: [{ text: formatDate(t) }] })
    }
    // A painting is "created", a city "established", a company "founded".
    const inception = time('P571')
    const madeBySomeone = ['P170', 'P50', 'P57', 'P86'].some((p) => claims[p]?.length)
    const isPlace = claims.P1082 || claims.P625
    if (inception) {
      facts.push({ label: madeBySomeone ? 'Created' : isPlace ? 'Established' : 'Founded', parts: [{ text: formatDate(inception) }] })
    }
    const employees = latestQuantity(claims.P1128)
    if (employees) facts.push({ label: 'Employees', parts: [{ text: Math.round(employees.amount).toLocaleString('en-US') }] })
    const population = latestQuantity(claims.P1082)
    if (population) facts.push({ label: 'Population', parts: [{ text: Math.round(population.amount).toLocaleString('en-US') }] })
    const area = latestQuantity(claims.P2046)
    if (area?.unit === 'Q712226') {
      facts.push({ label: 'Area', parts: [{ text: `${Number(area.amount.toFixed(1)).toLocaleString('en-US')} km²` }] })
    }
  }
  for (const [prop, max, label] of factSpec) {
    // Different items can share a label (e.g. the same award for different years); show each name once.
    const unique = [...new Map((SINGLE_VALUE.has(prop) ? current(prop) : ids(prop)).map(part).filter(Boolean).map((r) => [r.text, r])).values()]
    if (unique.length) facts.push({ label, parts: unique.slice(0, max), more: SINGLE_VALUE.has(prop) ? 0 : Math.max(0, unique.length - max) })
  }

  // "Venue: United States" next to "Country: United States" adds nothing; keep the first mention.
  const seen = new Set()
  const distinct = facts.filter((f) => {
    const repeat = !['Born', 'Died'].includes(f.label) && f.parts.every((p) => seen.has(p.text))
    f.parts.forEach((p) => seen.add(p.text))
    return !repeat
  })

  const titlesOf = (list) =>
    [...new Set(list.map((id) => refs[id]?.title).filter((t) => t && t !== selfTitle))].slice(0, 12)
  const [deeper, broader] = await Promise.all([
    getTopics(titlesOf(deeperIds)).then(applyFilter),
    getTopics(titlesOf(broaderIds)).then(applyFilter),
  ])
  return { isPerson, facts: distinct, deeper, broader }
}

// ---------------------------------------------------------------------------------------------
// Mentioned topics: pages the article links to, ranked by how much the article talks about them.
// Titles alone mislead ("Wimbledon" in the text, "The Championships, Wimbledon" as the page), so we
// read the article source, where links look like [[Target|display text]], and count both the links
// and the display text in the body.
// ---------------------------------------------------------------------------------------------
const NAMESPACE = /^(file|image|category|template|help|wikipedia|portal|draft|talk|user|special|media|wp|mos):/i
const END_SECTIONS = /^==\s*(?:See also|Notes|References|Further reading|External links|Bibliography|Sources)\s*==\s*$/im

function linkStats(wikitext) {
  const body = wikitext
    .split(END_SECTIONS)[0]
    .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/gi, '') // citations are not "the article talking about" a page
  const stats = new Map()
  for (const m of body.matchAll(/\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|([^\]\n]*))?\]\]/g)) {
    let target = m[1].trim().replace(/_/g, ' ')
    if (!target || NAMESPACE.test(target)) continue
    target = target[0].toUpperCase() + target.slice(1)
    const display = (m[2] ?? m[1]).replace(/'{2,}/g, '').trim().toLowerCase()
    const entry = stats.get(target) || { links: 0, displays: new Set() }
    entry.links++
    if (display.length >= 4) entry.displays.add(display)
    stats.set(target, entry)
  }
  return stats
}

const countOf = (haystack, needle) => {
  let n = 0
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n++
  return n
}

export async function getMentionedTopics(title, plainText, limit = 12) {
  if (!plainText) return []
  const data = await action({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    formatversion: '2',
    redirects: '1',
    titles: title,
  })
  const wikitext = Object.values(data.query?.pages || {})[0]?.revisions?.[0]?.slots?.main?.content || ''
  const haystack = plainText.toLowerCase()
  const selfKey = title.toLowerCase()
  const selfBase = selfKey.replace(/\s*\(.*\)$/, '')

  const scored = [...linkStats(wikitext)]
    // Namesakes ("Mona Lisa (opera)", "Mona Lisa (Nat King Cole song)") share the name, not the subject.
    .filter(([t]) => t.toLowerCase() !== selfKey && t.toLowerCase().replace(/\s*\(.*\)$/, '') !== selfBase && !NOISE.test(t))
    .map(([t, { links, displays }]) => {
      const base = t.replace(/\s*\(.*\)$/, '').toLowerCase() // "Honeydew (excretion)" -> "honeydew"
      const names = new Set([...displays, ...(base.length >= 4 ? [base] : [])])
      // The most-used name wins (not the sum), so "Venus" and "Venus Williams" don't double count.
      const mentions = Math.max(0, ...[...names].map((name) => countOf(haystack, name)))
      return { t, n: Math.max(links, mentions) }
    })
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 24)
    .map((x) => x.t)

  return applyFilter(await getTopics(scored.slice(0, 20))).slice(0, limit)
}
