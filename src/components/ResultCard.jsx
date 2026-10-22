import { Link } from 'react-router-dom'
import { topicPath } from '../config/paths'
import FavoriteButton from './FavoriteButton'

// Horizontal list card (Search results, drill-down lists).
// `keepTrail` extends the drill-down path instead of starting a new one.
export default function ResultCard({ topic, keepTrail = false }) {
  return (
    <article className="card result-card">
      <Link to={topicPath(topic.title)} state={keepTrail ? undefined : { trailReset: true }} className="result-link">
        <div className="thumb">{topic.image ? <img src={topic.image} alt="" loading="lazy" /> : <div className="img-fallback" />}</div>
        <div className="result-body">
          {topic.description && <p className="eyebrow muted">{topic.description}</p>}
          <h3 className="serif">{topic.title}</h3>
          <p className="muted small clamp-2">{topic.extract}</p>
          <span className="link-text small">Explore →</span>
        </div>
      </Link>
      <FavoriteButton topic={topic} />
    </article>
  )
}
