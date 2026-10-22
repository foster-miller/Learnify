import { Link } from 'react-router-dom'
import { topicPath } from '../config/paths'
import { ArrowLeft } from './Icons'

// Shows the drill-down trail: Discover / Insect / Bee / Honey …
// Earlier steps link back and cut the trail at that point.
export default function Breadcrumb({ trail }) {
  const parent = trail.length > 1 ? trail[trail.length - 2] : null
  return (
    <nav className="breadcrumb" aria-label="Your path">
      <Link to={parent ? topicPath(parent) : '/'} aria-label="Back" className="crumb-back">
        <ArrowLeft size={16} />
      </Link>
      <ol>
        <li><Link to="/">Discover</Link></li>
        {trail.map((title, i) => (
          <li key={`${title}-${i}`} aria-current={i === trail.length - 1 ? 'page' : undefined}>
            {i === trail.length - 1 ? <span>{title}</span> : <Link to={topicPath(title)}>{title}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
