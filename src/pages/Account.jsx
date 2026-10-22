import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SPEECH_RATES, TEXT_SIZES, useSettings } from '../context/SettingsContext'
import { autoVoice, isHighQuality, play, speechSupported, stop, useVoices } from '../services/speechService'

const SIZE_LABELS = { md: 'Standard', lg: 'Large', xl: 'Extra large' }

export default function Account() {
  const { user, signOut } = useAuth()
  const s = useSettings()
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const voices = useVoices()
  const automatic = autoVoice(voices)
  const hasNaturalVoice = voices.some(isHighQuality)

  const toggleParental = (e) => {
    e.preventDefault()
    const ok = s.parental ? s.disableParental(pin) : s.enableParental(pin)
    setPinMsg(ok ? '' : s.parental ? 'Incorrect PIN.' : 'Choose a 4-digit PIN.')
    if (ok) setPin('')
  }

  return (
    <div className="container page narrow">
      <p className="eyebrow">Account & accessibility</p>
      <h1 className="serif">Make it yours.</h1>

      <section className="panel">
        <h2 className="serif">Profile</h2>
        {user ? (
          <p className="muted">Signed in as <strong>{user.name}</strong> ({user.email}). <button className="link-text" onClick={() => signOut()}>Sign out</button></p>
        ) : (
          <p className="muted">You’re browsing as a guest. <Link to="/signin" className="link-strong">Sign in</Link> to save favorites.</p>
        )}
      </section>

      <section className="panel">
        <h2 className="serif">Reading</h2>
        <fieldset>
          <legend>Text size</legend>
          <div className="segmented">
            {Object.keys(TEXT_SIZES).map((k) => (
              <button key={k} aria-pressed={s.textSize === k} className={s.textSize === k ? 'active' : ''} onClick={() => s.update({ textSize: k })}>
                {SIZE_LABELS[k]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Appearance</legend>
          <div className="segmented">
            <button aria-pressed={s.theme === 'light'} className={s.theme === 'light' ? 'active' : ''} onClick={() => s.update({ theme: 'light' })}>Light</button>
            <button aria-pressed={s.theme === 'contrast'} className={s.theme === 'contrast' ? 'active' : ''} onClick={() => s.update({ theme: 'contrast' })}>High-contrast dark</button>
          </div>
        </fieldset>
      </section>

      {speechSupported() && (
        <section className="panel">
          <h2 className="serif">Read aloud</h2>
          <p className="muted small">Every section of a topic has a Listen button. Voices come from your device, so they vary by browser.</p>
          <fieldset>
            <legend>Speed</legend>
            <div className="segmented">
              {SPEECH_RATES.map((r) => (
                <button key={r} aria-pressed={s.speechRate === r} className={s.speechRate === r ? 'active' : ''} onClick={() => s.update({ speechRate: r })}>
                  {r}×
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span className="legend-like">Voice</span>
            <select value={s.speechVoice} onChange={(e) => s.update({ speechVoice: e.target.value })}>
              <option value="">Automatic{automatic ? ` (${automatic.name})` : ' (device default)'}</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang}){isHighQuality(v) ? ' ★ natural' : ''}</option>
              ))}
            </select>
          </label>
          {!hasNaturalVoice && (
            <p className="muted small">
              Your device only has basic voices, which sound robotic. For much more natural speech, install a free premium voice and reload this page.
              On a Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, then download one marked Premium or Enhanced.
              On Windows: open Learnify in Microsoft Edge, which includes “Natural” voices. Automatic picks the best voice it finds.
            </p>
          )}
          <div className="actions">
            <button className="btn btn-ghost" type="button" onClick={() => play('voice-test', 'This is how Learnify will read topics aloud to you.')}>Test voice</button>
            <button className="link-text" type="button" onClick={stop}>Stop</button>
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="serif">Content</h2>
        <label className="check">
          <input type="checkbox" checked={s.showMature && !s.parental} disabled={s.parental} onChange={(e) => s.update({ showMature: e.target.checked })} />
          Allow mature topics (turns off the not-safe-for-work filter)
        </label>
        <p className="muted small">The filter is keyword-based and best-effort; it can miss things.</p>

        <form onSubmit={toggleParental} className="pin-form">
          <h3>Parental mode {s.parental && <span className="badge">On</span>}</h3>
          <p className="muted small">Hides mature and sensitive topics. {s.parental ? 'Enter your PIN to turn it off.' : 'Set a 4-digit PIN to lock it on.'}</p>
          <div className="pin-row">
            <input inputMode="numeric" pattern="\d{4}" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="PIN" aria-label="Parental PIN" />
            <button className="btn" type="submit">{s.parental ? 'Turn off' : 'Turn on'}</button>
          </div>
          {pinMsg && <p className="error" role="alert">{pinMsg}</p>}
          <p className="muted small">Demo only: the PIN is stored in this browser.</p>
        </form>
      </section>
    </div>
  )
}
