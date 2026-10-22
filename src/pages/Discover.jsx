import { useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import TopicCard from '../components/TopicCard'
import { Compass, Shuffle } from '../components/Icons'
import { CATEGORIES, GROUPS, SUGGESTIONS } from '../config/app'
import { searchPath, topicPath } from '../config/paths'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { lastPositionService } from '../services/lastPositionService'
import { useAsync } from '../hooks/useAsync'
import { applyFilter } from '../services/contentFilter'
import { getTopics } from '../services/wikiService'

export default function Discover() {
  const { filterLevel } = useSettings()
  const [group, setGroup] = useState('All categories')
  const { data, loading, error } = useAsync(() => getTopics(CATEGORIES.map((c) => c.title)).then(applyFilter), [filterLevel])

  const { user } = useAuth()
  const resume = useAsync(() => (user ? lastPositionService.get() : Promise.resolve([])), [user?.id])
  const lastTrail = resume.data || []

  const groupOf =(title) => CATEGORIES.find((c) => c.title.toLowerCase() === title.toLowerCase())?.group
  const topics = (data || []).filter((t) => group === 'All categories' || groupOf(t.title) === group)
  const hero = (data || []).find((t) => t.image)

  return (
    <div className="container page">
      <section className="hero">
        <div>
          <p className="eyebrow">Follow your curiosity</p>
          <h1 className="serif display">A little wonder.<br />A world to discover.</h1>
          <p className="muted lede-text">Find a new fascination, revisit a favorite, or let curiosity take the lead. Good questions start here.</p>
          <SearchBar />
          <p className="try small muted">
            Try{' '}
            {SUGGESTIONS.map((s) => (
              <Link key={s} to={searchPath(s)} className="underlined">{s}</Link>
            ))}
          </p>
        </div>
        {hero && (
          <figure className="hero-img">
            <img src={hero.image} alt="" />
            <figcaption className="serif">Small things. Endless stories.</figcaption>
          </figure>
        )}
      </section>

      {lastTrail.length > 0 && (
        <section className="banner" aria-label="Continue where you left off">
          <Compass size={28} />
          <div>
            <h2 className="serif">Pick up where you left off</h2>
            <p className="muted small">{lastTrail.join(' → ')}</p>
          </div>
          <Link to={topicPath(lastTrail.at(-1))} state={{ restoreTrail: lastTrail }} className="btn">Continue</Link>
        </section>
      )}

      <section className="banner">
        <Shuffle size={28} />
        <div>
          <h2 className="serif">Not sure where to begin?</h2>
          <p className="muted small">A random topic might be your next great interest.</p>
        </div>
        <Link to="/random" className="btn"><Shuffle size={18} /> Surprise me</Link>
      </section>

      <section>
        <div className="section-head">
          <h2 className="serif">A world of possibilities</h2>
          <span className="muted small">{data ? topics.length : CATEGORIES.length} starting points</span>
        </div>
        <div className="chips" role="group" aria-label="Filter categories">
          {['All categories', ...GROUPS].map((g) => (
            <button key={g} className={`chip ${group === g ? 'active' : ''}`} aria-pressed={group === g} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="serif">Start somewhere interesting</h2>
        {error && <p className="notice" role="alert">We couldn’t reach Wikipedia. Check your connection and refresh.</p>}
        <div className="card-grid" aria-busy={loading}>
          {loading && Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton sk-card" />)}
          {topics.map((t) => <TopicCard key={t.title} topic={t} eyebrow={groupOf(t.title)} showFavorite />)}
        </div>
      </section>
    </div>
  )
}
