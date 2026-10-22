import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const KEY = 'learnify:trail'
let booted = false // module state resets on every full page load

const read = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// The drill-down path (insects → bees → honey …). Arriving from Discover/Search/Random
// (`state.trailReset`) starts a fresh trail; drilling deeper appends; revisiting an earlier
// step cuts the trail back to it. Computed during render so the breadcrumb never flickers.
export function useTrail(title) {
  const { state, key } = useLocation()
  const [computed, setComputed] = useState({ key: null, trail: [] })

  if (computed.key !== key) {
    let trail = read()
    const at = trail.indexOf(title)
    // A fresh page load (typed URL, refresh) has no meaningful earlier path, so start over.
    const firstVisit = !booted
    booted = true
    if (state?.restoreTrail?.at(-1) === title) trail = state.restoreTrail
    else if (state?.trailReset || firstVisit || !trail.length) trail = [title]
    else if (at >= 0) trail = trail.slice(0, at + 1)
    else trail = [...trail, title]
    try {
      sessionStorage.setItem(KEY, JSON.stringify(trail))
    } catch {
      /* ignore */
    }
    setComputed({ key, trail })
    return trail
  }
  return computed.trail
}
