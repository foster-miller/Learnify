import { Link } from 'react-router-dom'
import { topicPath } from '../config/paths'

// Structured facts from Wikidata (born, age, occupation, awards…). Names that have their own
// Wikipedia article link onward, which extends the drill-down trail.
export default function QuickFacts({ facts, title }) {
  if (!facts?.length) return null
  return (
    <section className="facts" aria-label={`Quick facts about ${title}`}>
      <p className="eyebrow">Quick facts</p>
      <dl>
        {facts.map((f) => (
          <div key={f.label} className="fact">
            <dt className="muted small">{f.label}</dt>
            <dd>
              {f.parts.map((p, i) => (
                <span key={`${p.text}-${i}`}>
                  {i > 0 && ', '}
                  {p.title ? <Link to={topicPath(p.title)} className="fact-link">{p.text}</Link> : p.text}
                </span>
              ))}
              {f.more > 0 && <span className="muted small"> +{f.more} more</span>}
              {f.note && <span className="muted small"> ({f.note})</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
