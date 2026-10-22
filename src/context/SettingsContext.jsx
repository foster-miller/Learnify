import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setFilterLevel } from '../services/contentFilter'
import { profileService } from '../services/profileService'
import { useAuth } from './AuthContext'

const KEY = 'learnify:settings'
export const TEXT_SIZES = { md: 100, lg: 115, xl: 130 }
const DEFAULTS = { textSize: 'md', theme: 'light', showMature: false, parentalPin: null }

const load = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return DEFAULTS
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)

  const parental = Boolean(settings.parentalPin)
  const filterLevel = parental ? 'kids' : settings.showMature ? 'off' : 'nsfw'
  // Set during render so child effects/fetches in this same pass see the right level.
  setFilterLevel(filterLevel)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--text-scale', TEXT_SIZES[settings.textSize] / 100)
    root.dataset.theme = settings.theme
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  // Signed in: load saved preferences from the profile (they win over this device's copy).
  const { user } = useAuth()
  const userId = user?.id ?? null
  useEffect(() => {
    if (!userId) return
    let active = true
    profileService
      .get()
      .then((p) => {
        if (!active || !p) return
        setSettings((s) => ({
          ...s,
          textSize: p.text_size in TEXT_SIZES ? p.text_size : s.textSize,
          theme: p.theme,
          showMature: p.content_filter === 'off',
        }))
      })
      .catch(() => {}) // offline or not ready: keep the local settings
    return () => {
      active = false
    }
  }, [userId])

  // Apply a change locally, and mirror the synced fields to the profile when signed in.
  const update = useCallback(
    (patch) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      if (userId && ['textSize', 'theme', 'showMature'].some((k) => k in patch)) {
        profileService.save(userId, next).catch(() => {})
      }
    },
    [settings, userId],
  )

  // Parental mode is locked behind a PIN. Both functions return true on success.
  const enableParental = useCallback((pin) => {
    if (!/^\d{4}$/.test(pin)) return false
    setSettings((s) => ({ ...s, parentalPin: pin, showMature: false }))
    return true
  }, [])
  const disableParental = useCallback(
    (pin) => {
      if (pin !== settings.parentalPin) return false
      setSettings((s) => ({ ...s, parentalPin: null }))
      return true
    },
    [settings.parentalPin],
  )

  const value = useMemo(
    () => ({ ...settings, parental, filterLevel, update, enableParental, disableParental }),
    [settings, parental, filterLevel, update, enableParental, disableParental],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext)
