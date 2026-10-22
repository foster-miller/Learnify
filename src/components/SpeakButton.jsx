import { speechSupported, stop, toggle, useSpeechStatus } from '../services/speechService'
import { Pause, Play, Stop } from './Icons'

// Play / pause / resume for one block of text, plus a stop button once it has started.
// `id` is unique per block, so only one block reads at a time. Renders nothing when the
// browser has no speech support.
export default function SpeakButton({ id, label, text }) {
  const status = useSpeechStatus(id)
  if (!speechSupported() || !text?.trim()) return null

  const action = status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Listen'
  return (
    <span className="speak" role="group" aria-label={label}>
      <button type="button" className={`speak-btn ${status !== 'idle' ? 'is-active' : ''}`} onClick={() => toggle(id, text)} aria-label={`${action}: ${label}`}>
        {status === 'playing' ? <Pause size={16} /> : <Play size={16} filled />}
        <span>{action}</span>
      </button>
      {status !== 'idle' && (
        <button type="button" className="speak-stop" onClick={stop} aria-label={`Stop: ${label}`}>
          <Stop size={14} filled />
        </button>
      )}
    </span>
  )
}
