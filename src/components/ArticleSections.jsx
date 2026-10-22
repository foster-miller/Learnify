import { useState } from 'react'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Open/closed state shared by the article and its table of contents. The first section is open
// by default; anything the reader toggles is remembered as an explicit override.
export function useOpenSections(sections) {
  const [overrides, setOverrides] = useState({})
  const isOpen = (id) => overrides[id] ?? id === sections[0]?.id
  const allOpen = sections.length > 0 && sections.every((s) => isOpen(s.id))

  return {
    isOpen,
    allOpen,
    toggle: (id) => setOverrides((o) => ({ ...o, [id]: !isOpen(id) })),
    setAll: (value) => setOverrides(Object.fromEntries(sections.map((s) => [s.id, value]))),
    jump: (id) => {
      setOverrides((o) => ({ ...o, [id]: true }))
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
      )
    },
  }
}

function Body({ paragraphs }) {
  return paragraphs.map((p, i) => <p key={i} className="muted article-p">{p}</p>)
}

// Every section of the Wikipedia article, collapsible.
// `lead` is the intro text that follows the hero's short summary.
export default function ArticleSections({ title, lead, sections, state }) {
  return (
    <div className="article">
      {lead.length > 0 && (
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="serif">The full picture</h2>
          <Body paragraphs={lead} />
        </section>
      )}

      {sections.length > 0 && (
        <section aria-labelledby="inside-heading">
          <div className="section-head">
            <h2 id="inside-heading" className="serif">Inside {title}</h2>
            <button className="link-text" onClick={() => state.setAll(!state.allOpen)}>
              {state.allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          {sections.map((s) => {
            const open = state.isOpen(s.id)
            return (
              <div key={s.id} id={s.id} className="acc">
                <h3>
                  <button className="acc-btn serif" aria-expanded={open} aria-controls={`${s.id}-panel`} onClick={() => state.toggle(s.id)}>
                    {s.title}
                    <span className="acc-icon" aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                </h3>
                {open && (
                  <div id={`${s.id}-panel`} className="acc-panel">
                    <Body paragraphs={s.paragraphs} />
                    {s.children.filter((c) => c.paragraphs.length).map((c) => (
                      <div key={c.id}>
                        <h4 className="serif">{c.title}</h4>
                        <Body paragraphs={c.paragraphs} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

// Table of contents for the sidebar. Opens a section and scrolls to it.
export function Contents({ sections, onJump }) {
  if (!sections.length) return null
  return (
    <nav className="toc" aria-label="On this page">
      <p className="eyebrow">On this page</p>
      <ul>
        {sections.map((s) => (
          <li key={s.id}><button className="link-text" onClick={() => onJump(s.id)}>{s.title}</button></li>
        ))}
      </ul>
    </nav>
  )
}
