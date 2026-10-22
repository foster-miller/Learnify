import { Link, useSearchParams } from 'react-router-dom'
import ResultCard from '../components/ResultCard'
import SearchBar from '../components/SearchBar'
import { Shuffle } from '../components/Icons'
import { SUGGESTIONS } from '../config/app'
import { searchPath } from '../config/paths'
import { useSettings } from '../context/SettingsContext'
import { useAsync } from '../hooks/useAsync'
import { search } from '../services/wikiService'

export default function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { filterLevel } = useSettings()
  const { data, loading, error } = useAsync(() => (q ? search(q) : Promise.resolve([])), [q, filterLevel])

  return (
    <div className="container page narrow">
      <p className="eyebrow">Find your next fascination</p>
      <h1 className="serif">What are you curious about?</h1>
      <SearchBar key={q} initial={q} autoFocus={!q} />

      {!q && (
        <p className="muted">Try{' '}
          {SUGGESTIONS.map((s) => <Link key={s} to={searchPath(s)} className="underlined">{s}</Link>)}
        </p>
      )}

      {q && (
        <>
          <p className="muted result-count" role="status">
            {loading ? 'Searching…' : error ? '' : `${data.length} ${data.length === 1 ? 'topic' : 'topics'} for “${q}”`}
          </p>
          {error && <p className="notice" role="alert">Search failed. Check your connection and try again.</p>}
          <div className="result-list" aria-busy={loading}>
            {loading && Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton sk-result" />)}
            {!loading && data?.map((t) => <ResultCard key={t.title} topic={t} />)}
          </div>
          {!loading && !error && data.length === 0 && <p className="muted">Nothing found. Try a broader word.</p>}
          {!loading && data?.length > 0 && <p className="muted small center">You’ve explored all {data.length} matches.</p>}
        </>
      )}

      <h2 className="serif">Follow the thread</h2>
      <div className="chips">
        {['Fungi', 'Forest ecosystem', 'Honey bee'].map((s) => <Link key={s} to={searchPath(s)} className="chip">{s}</Link>)}
      </div>
      <Link to="/random" className="btn btn-ghost block"><Shuffle size={18} /> Or surprise me</Link>
    </div>
  )
}
