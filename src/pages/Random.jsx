import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { topicPath } from '../config/paths'
import { getRandomTopic } from '../services/wikiService'

// Picks a random topic, then hands off to the Topic page (which shows the "Try another" banner).
export default function Random() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getRandomTopic()
      .then((t) => !cancelled && navigate(topicPath(t.title), { replace: true, state: { random: true, trailReset: true } }))
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [navigate, attempt])

  return (
    <div className="container page center-page" aria-busy={!error}>
      {error ? (
        <>
          <p className="notice" role="alert">{error.message}</p>
          <div className="actions">
            <button className="btn" onClick={() => { setError(null); setAttempt((a) => a + 1) }}>Try again</button>
            <Link to="/" className="btn btn-ghost">Back to Discover</Link>
          </div>
        </>
      ) : (
        <p className="muted" role="status">Finding something curious…</p>
      )}
    </div>
  )
}
