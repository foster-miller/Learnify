import { useEffect, useState } from 'react'

// Runs `fn` whenever `deps` change; ignores results from superseded runs.
// Loading is derived (not set synchronously in the effect) to avoid cascading renders.
export function useAsync(fn, deps) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = JSON.stringify(deps)

  useEffect(() => {
    let cancelled = false
    fn()
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((error) => !cancelled && setState({ key, data: null, error }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = state.key === key
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current,
  }
}
