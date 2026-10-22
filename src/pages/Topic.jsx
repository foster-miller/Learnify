import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ArticleSections, { Contents, useOpenSections } from '../components/ArticleSections'
import Breadcrumb from '../components/Breadcrumb'
import FavoriteButton from '../components/FavoriteButton'
import QuickFacts from '../components/QuickFacts'
import ResultCard from '../components/ResultCard'
import { Shuffle } from '../components/Icons'
import { searchPath } from '../config/paths'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useSettings } from '../context/SettingsContext'
import { useAsync } from '../hooks/useAsync'
import { useTrail } from '../hooks/useTrail'
import { isAllowed } from '../services/contentFilter'
import { lastPositionService } from '../services/lastPositionService'
import { getArticle, getLateralTopics, getMentionedTopics, getRelated, getRelatedCategories, getSummary } from '../services/wikiService'
import { splitLead } from '../utils/text'

const NONE = []

// A group of topic cards under a heading. Links extend the drill-down trail.
function TopicGroup({ title, hint, topics, loading }) {
  if (!loading && !topics?.length) return null
  return (
    <section className="group">
      <h3 className="serif">{title}</h3>
      <p className="muted small">{hint}</p>
      {loading ? (
        <div className="skeleton sk-list" />
      ) : (
        <div className="result-grid">
          {topics.map((t) => <ResultCard key={t.title} topic={t} keepTrail />)}
        </div>
      )}
    </section>
  )
}

export default function Topic() {
  const { title } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { filterLevel } = useSettings()
  const { isFavorite } = useFavorites()
  const { user } = useAuth()
  const trail = useTrail(title)
  const trailKey = trail.join('|')

  // Remember where a signed-in user is, so Discover can offer to resume it.
  useEffect(() => {
    if (user) lastPositionService.save(trail).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, trailKey])

  const summary = useAsync(() => getSummary(title), [title, filterLevel])
  const article = useAsync(() => getArticle(title), [title])
  const lateral = useAsync(() => getLateralTopics(title), [title, filterLevel])
  const categories = useAsync(() => getRelatedCategories(title), [title, filterLevel])
  const qid = article.data?.qid ?? null
  const related = useAsync(() => (qid ? getRelated(qid, summary.data?.title || title) : Promise.resolve(null)), [qid, filterLevel])
  const mentioned = useAsync(
    () => (article.data ? getMentionedTopics(title, article.data.plain) : Promise.resolve(NONE)),
    [title, Boolean(article.data), filterLevel],
  )
  const sections = article.data?.sections ?? NONE
  const openState = useOpenSections(sections)

  if (summary.error) {
    return (
      <div className="container page">
        <Breadcrumb trail={trail} />
        <p className="notice" role="alert">We couldn’t load “{title}”. It may not exist, or Wikipedia is unreachable.</p>
        <Link to="/" className="btn">Back to Discover</Link>
      </div>
    )
  }
  if (summary.loading) {
    return (
      <div className="container page" aria-busy="true">
        <Breadcrumb trail={trail} />
        <div className="skeleton sk-hero" />
      </div>
    )
  }

  const topic = summary.data
  if (!isAllowed(topic)) {
    return (
      <div className="container page">
        <Breadcrumb trail={trail} />
        <p className="notice">This topic is hidden by your content settings.</p>
        <Link to="/account" className="btn">Review settings</Link>
      </div>
    )
  }

  // Short summary on top; the rest of the intro continues below. Both come from the same
  // paragraph, so no sentence appears twice.
  const lead = article.data?.lead ?? []
  const firstLead = lead[0] ?? topic.extract.split('\n')[0] ?? ''
  const { brief, rest } = splitLead(firstLead)
  const extendedLead = article.data ? [rest, ...lead.slice(1)].filter(Boolean) : NONE

  const parent = trail.length > 1 ? trail[trail.length - 2] : null
  const facts = related.data?.facts
  const categoryChips = (categories.data || []).filter((c) => c.title.toLowerCase() !== topic.title.toLowerCase())
  const broader = related.data?.broader ?? NONE
  // Deeper = Wikidata's closely connected items first, then the topics the article talks about most.
  const broaderTitles = new Set(broader.map((t) => t.title))
  const deeper = [...new Map([...(related.data?.deeper ?? NONE).slice(0, 6), ...(mentioned.data ?? NONE)].map((t) => [t.title, t])).values()]
    .filter((t) => !broaderTitles.has(t.title))
    .slice(0, 14)
  // Each topic appears in one group only: deeper and zoom-out take priority over "alongside".
  const taken = new Set([...deeper, ...broader].map((t) => t.title))
  const alongside = (lateral.data ?? NONE).filter((t) => !taken.has(t.title)).slice(0, 12)

  return (
    <div className="container page">
      <Breadcrumb trail={trail} />

      {state?.random && (
        <div className="banner" role="status">
          <Shuffle size={26} />
          <div>
            <strong>Your curiosity landed here.</strong>
            <p className="muted small">Randomly picked from Wikipedia. Meet {topic.title}.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/random', { replace: true })}>
            <Shuffle size={18} /> Try another
          </button>
        </div>
      )}

      <section className="topic-hero">
        <div>
          <p className="eyebrow">{parent ? `${parent} · Level ${trail.length}` : 'Starting point'}</p>
          <h1 className="serif">{topic.title}</h1>
          {topic.description && <p className="lede serif">{topic.description}</p>}
          <p className="brief">{brief}</p>
          <div className="actions">
            <FavoriteButton topic={topic} className="fav-labeled" />
            <span className="muted small">{isFavorite(topic.title) ? 'Saved to favorites' : 'Save to favorites'}</span>
          </div>
        </div>
        {topic.image && (
          <figure>
            <img src={topic.image} alt={topic.imageCaption} />
            <figcaption className="muted small">{topic.imageCaption}</figcaption>
          </figure>
        )}
      </section>

      <div className="topic-layout">
        <div>
          {article.loading && <div className="skeleton sk-list" aria-busy="true" />}
          {article.error && <p className="notice">Couldn’t load the full article. Try reloading.</p>}
          {article.data && <ArticleSections title={topic.title} lead={extendedLead} sections={sections} state={openState} />}
        </div>
        <aside className="side">
          {related.loading ? <div className="skeleton sk-facts" /> : <QuickFacts facts={facts} title={topic.title} />}
          <Contents sections={sections} onJump={openState.jump} />
        </aside>
      </div>

      <section className="keep-exploring" aria-labelledby="keep-heading">
        <h2 id="keep-heading" className="serif">Keep exploring</h2>
        <TopicGroup
          title={`Dive deeper into ${topic.title}`}
          hint="Closely connected: the people, places, awards and works at the heart of this topic."
          topics={deeper}
          loading={article.loading || related.loading || mentioned.loading}
        />
        <TopicGroup
          title="Alongside"
          hint="Similar topics at the same level, to explore sideways."
          topics={alongside}
          loading={lateral.loading}
        />
        <TopicGroup
          title="Zoom out"
          hint={`The bigger picture ${topic.title} belongs to.`}
          topics={broader}
          loading={article.loading || related.loading}
        />
        {categoryChips.length > 0 && (
          <section className="group">
            <h3 className="serif">Browse by category</h3>
            <div className="chips">
              {categoryChips.map((c) => (
                <Link key={c.title} className="chip" to={searchPath(c.title)}>{c.title}</Link>
              ))}
            </div>
          </section>
        )}
      </section>

      <p className="muted small source-note">
        Source:{' '}
        <a href={topic.url} target="_blank" rel="noreferrer" className="link-strong">{topic.title} on Wikipedia ↗</a>
        {' '}· Text available under CC BY-SA 4.0. Facts from Wikidata (CC0).
      </p>
    </div>
  )
}
