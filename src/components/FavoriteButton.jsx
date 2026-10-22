import { useLocation, useNavigate } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { Bookmark, BookmarkCheck } from './Icons'

export default function FavoriteButton({ topic, className = '' }) {
  const { isFavorite, toggle } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = isFavorite(topic.title)

  const onClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!toggle(topic)) navigate('/signin', { state: { from: location.pathname + location.search } })
  }

  return (
    <button
      type="button"
      className={`fav-btn ${saved ? 'is-saved' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${topic.title} from favorites` : `Save ${topic.title} to favorites`}
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
    </button>
  )
}
