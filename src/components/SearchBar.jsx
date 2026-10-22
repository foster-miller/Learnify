import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchPath } from '../config/paths'
import { Close, SearchIcon } from './Icons'

export default function SearchBar({ initial = '', autoFocus = false }) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // ⌘K / Ctrl+K focuses the search field.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    if (value.trim()) navigate(searchPath(value.trim()))
  }

  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search categories, ideas, anything…"
        aria-label="Search topics"
        autoFocus={autoFocus}
      />
      {value ? (
        <button type="button" className="icon-btn" aria-label="Clear search" onClick={() => { setValue(''); inputRef.current?.focus(); if (initial) navigate('/search') }}>
          <Close size={18} />
        </button>
      ) : (
        <kbd className="kbd" aria-hidden="true">⌘ K</kbd>
      )}
    </form>
  )
}
