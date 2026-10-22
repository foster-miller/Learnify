import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { APP_NAME, TAGLINE } from '../config/app'
import { useAuth } from '../context/AuthContext'
import { Bookmark, Compass, SearchIcon, Sprout, User } from './Icons'

const NAV = [
  { to: '/', label: 'Discover', Icon: Compass, end: true },
  { to: '/search', label: 'Search', Icon: SearchIcon },
  { to: '/favorites', label: 'Favorites', Icon: Bookmark },
]

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

function Logo() {
  return (
    <Link to="/" className="logo" aria-label={`${APP_NAME} home`}>
      <Sprout size={26} />
      <span className="logo-name serif">{APP_NAME.toLowerCase()}</span>
      <span className="logo-tag muted small">{TAGLINE}</span>
    </Link>
  )
}

export default function Layout() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="top-nav" aria-label="Main">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-user">
            {user ? (
              <Link to="/account" className="user-chip">
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-name">{user.name}</span>
              </Link>
            ) : (
              <>
                <Link to="/account" className="muted small settings-link">Settings</Link>
                <Link to="/signin" className="link-strong">Sign in ↗</Link>
              </>
            )}
          </div>
          <Link to={user ? '/account' : '/signin'} className="avatar mobile-avatar" aria-label={user ? 'Account' : 'Sign in'}>
            {user ? initials(user.name) : <User size={18} />}
          </Link>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner small muted">
          <span>© 2026 {APP_NAME} · Stay curious.</span>
          <span className="footer-links">
            <a href="https://en.wikipedia.org/wiki/Wikipedia:About" target="_blank" rel="noreferrer">About Wikipedia</a>
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">Content: CC BY-SA</a>
            <Link to="/account">Accessibility</Link>
          </span>
        </div>
      </footer>

      <nav className="tab-bar" aria-label="Main">
        {[...NAV, { to: '/account', label: 'Account', Icon: User }].map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
