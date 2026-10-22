import { Link } from 'react-router-dom'
import { topicPath } from '../config/paths'
import { Arrow } from './Icons'
import FavoriteButton from './FavoriteButton'

// Grid card (Discover, Favorites).
export default function TopicCard({ topic, eyebrow, showFavorite = false }) {
  return (
    <article className="card topic-card">
      <Link to={topicPath(topic.title)} state={{ trailReset: true }} className="card-link">
        <div className="card-img">
          {topic.image ? <img src={topic.image} alt="" loading="lazy" /> : <div className="img-fallback" />}
        </div>
        <div className="card-body">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h3 className="serif">{topic.title}</h3>
          <p className="muted clamp-2">{topic.description || topic.extract}</p>
          <span className="card-foot">
            <span className="muted small">Explore</span>
            <Arrow size={16} />
          </span>
        </div>
      </Link>
      {showFavorite && <FavoriteButton topic={topic} className="on-image" />}
    </article>
  )
}
