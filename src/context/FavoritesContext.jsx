import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { favoritesService } from '../services/favoritesService'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)
const NONE = [] // stable reference, so memoized callbacks don't change on every render

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  // Remember which user the titles belong to, so a previous user's list is never shown to the next one.
  const [state, setState] = useState({ userId: null, titles: [] })
  const userId = user?.id ?? null
  const titles = state.userId === userId ? state.titles : NONE

  useEffect(() => {
    if (!userId) return
    let active = true
    favoritesService
      .list()
      .then((list) => active && setState({ userId, titles: list }))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [userId])

  const isFavorite = useCallback((title) => titles.includes(title), [titles])

  // Optimistic: update the UI first, undo if the database rejects it.
  // Returns false when signed out so the caller can send the user to /signin.
  const toggle = useCallback(
    (topic) => {
      if (!userId) return false
      const saved = titles.includes(topic.title)
      const apply = (next) => setState({ userId, titles: next })
      apply(saved ? titles.filter((t) => t !== topic.title) : [topic.title, ...titles])
      const request = saved ? favoritesService.remove(topic.title) : favoritesService.add(topic.title)
      request.catch(() => apply(titles))
      return true
    },
    [userId, titles],
  )

  const value = useMemo(() => ({ titles, isFavorite, toggle }), [titles, isFavorite, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoritesContext)
