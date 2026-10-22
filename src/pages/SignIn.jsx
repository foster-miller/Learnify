import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Arrow, Eye } from '../components/Icons'
import { APP_NAME } from '../config/app'
import { useAuth } from '../context/AuthContext'
import { supabaseConfigured } from '../services/supabaseClient'

export default function SignIn() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/'
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />
  const signingUp = mode === 'signup'

  const switchMode = () => {
    setMode(signingUp ? 'signin' : 'signup')
    setError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!supabaseConfigured) return setError('Accounts are unavailable: this site is not connected to its database yet.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    try {
      if (signingUp) {
        const { needsConfirmation } = await signUp({ email, password, name: name.trim() })
        if (needsConfirmation) setNotice('Check your email for a confirmation link, then sign in.')
        else navigate(from, { replace: true })
      } else {
        await signIn({ email, password })
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page signin">
      <div className="signin-art" role="img" aria-label="Misty forest path">
        <div>
          <p className="eyebrow light">A place for curious minds</p>
          <p className="serif display">There’s always more to discover.</p>
          <p className="light-muted">Save what speaks to you. Follow a new interest. Build a little library of the things that make you, you.</p>
        </div>
      </div>

      <form className="signin-form" onSubmit={submit} noValidate>
        <p className="eyebrow">Your curiosity, all in one place</p>
        <h1 className="serif display">{signingUp ? 'Create your account.' : 'Welcome back.'}</h1>
        <p className="muted">
          {signingUp
            ? 'Save favorites and pick up exactly where you left off, on any device.'
            : 'Sign in to find your favorites and pick up where your curiosity left off.'}
        </p>

        {signingUp && (
          <label>Name (optional)
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>Email address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>Password
          <span className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signingUp ? 'new-password' : 'current-password'} required />
            <button type="button" className="icon-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}><Eye size={18} /></button>
          </span>
        </label>
        {!supabaseConfigured && (
          <p className="notice" role="status">Accounts are unavailable right now because this site isn’t connected to its database yet. You can still explore every topic.</p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
        <button className="btn btn-wide" type="submit" disabled={busy || !supabaseConfigured}>
          <Arrow size={18} /> {busy ? 'One moment…' : signingUp ? 'Create account' : 'Sign in'}
        </button>
        <p className="center small">
          {signingUp ? 'Already have an account? ' : `New to ${APP_NAME}? `}
          <button type="button" className="link-text" onClick={switchMode}>{signingUp ? 'Sign in' : 'Create an account →'}</button>
        </p>
        <p className="center"><Link to="/" className="underlined small">Just looking? Explore {APP_NAME} without an account</Link></p>
      </form>
    </div>
  )
}
