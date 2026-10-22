import { Link } from 'react-router-dom'
import TopicCard from '../components/TopicCard'
import { Cloud } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { useAsync } from '../hooks/useAsync'
import { getTopics } from '../services/wikiService'

export default function Favorites() {
  const { user, loading: authLoading } = useAuth()
  const { titles } = useFavorites()
  // Only titles are stored; images and summaries come fresh from Wikipedia.
  const { data, loading } = useAsync(() => (titles.length ? getTopics(titles) : Promise.resolve([])), [titles])

  if (authLoading) return <div className="container page" aria-busy="true"><div className="skeleton sk-hero" /></div>

  if (!user) {
    return (
      <div className="container page narrow center-page">
        <p className="eyebrow">Your personal library</p>
        <h1 className="serif">Keep your curiosity close.</h1>
        <p className="muted">Sign in to save topics and find them here later.</p>
        <Link to="/signin" state={{ from: '/favorites' }} className="btn">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="container page">
      <p className="eyebrow">Your personal library</p>
      <h1 className="serif display">Keep your curiosity close.</h1>
      <p className="muted lede-text">The topics you love, ready whenever inspiration strikes.</p>

      {titles.length === 0 ? (
        <div className="notice">
          Nothing saved yet. Tap the bookmark on any topic to keep it here.{' '}
          <Link to="/" className="link-strong">Discover something →</Link>
        </div>
      ) : (
        <div className="card-grid" aria-busy={loading}>
          {loading && titles.slice(0, 4).map((t) => <div key={t} className="skeleton sk-card" />)}
          {data?.map((t) => <TopicCard key={t.title} topic={t} showFavorite />)}
        </div>
      )}

      <section className="banner">
        <Cloud size={26} />
        <div>
          <strong>A library that goes with you</strong>
          <p className="muted small">Saved to {user.name}’s account, so it’s here on every device you sign in on.</p>
        </div>
        <Link to="/account" className="link-text">Manage account →</Link>
      </section>
    </div>
  )
}
