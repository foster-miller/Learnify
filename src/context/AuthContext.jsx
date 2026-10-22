import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until the stored session has been checked

  useEffect(() => {
    let active = true
    authService.getUser().then((u) => {
      if (!active) return
      setUser(u)
      setLoading(false)
    })
    const unsubscribe = authService.onChange((u) => active && setUser(u))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut: authService.signOut,
    }),
    [user, loading],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
