// Text to speech with the browser's built-in voices (Web Speech API): free, no key.
// One shared player, so starting a section stops whichever one was reading before.
//
// Long text is read in short chunks. Chrome silently cuts off a single long utterance after
// ~15 seconds, and chunking also makes pause/stop respond quickly between sentences.
import { useSyncExternalStore } from 'react'
import { stripPronunciation } from '../utils/text'

const getSynth = () => (typeof window !== 'undefined' ? window.speechSynthesis : null)
export const speechSupported = () => Boolean(getSynth())

let state = { id: null, status: 'idle' } // status: 'idle' | 'playing' | 'paused'
const listeners = new Set()
const emit = (next) => {
  state = next
  listeners.forEach((l) => l())
}
const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

let prefs = { rate: 1, voiceURI: '' }
export const setSpeechPrefs = (next) => {
  prefs = { ...prefs, ...next }
}

// An English voice reads Greek, Cyrillic, CJK or IPA symbols as noise, so leave them out of what is spoken
// (they stay on screen). Pronunciation notes in parentheses go too.
export function speakable(text) {
  return stripPronunciation(text)
    .replace(/[\u0370-\u1DFF\u1F00-\u1FFF\u2E80-\uFFFF]+/g, '')
    .replace(/\(\s*[,;]?\s*\)/g, '')
    .replace(/\s+([,;.])/g, '$1')
    .replace(/([,;])\s*(?=[,;])/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Voice choice. Browsers expose every installed voice, including joke voices ("Zarvox", "Bad News") and
// basic ones that sound robotic. Premium/Enhanced/Neural/Natural voices (downloaded from the system, or
// built into Edge and Chrome) sound far better, so when the user has not picked a voice we prefer those.
const NOVELTY = new Set(['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Fred', 'Good News', 'Jester', 'Junior', 'Organ', 'Ralph', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Kathy'])
const baseName = (v) => v.name.replace(/\s*\(.*\)$/, '')
export const isNovelty = (v) => NOVELTY.has(baseName(v))
export const isHighQuality = (v) => /premium|enhanced|natural|neural|siri|google/i.test(v.name)

function voiceScore(v, lang) {
  let score = 0
  if (v.lang.toLowerCase().replace('_', '-').startsWith(lang)) score += 10
  if (v.lang.toLowerCase().replace('_', '-') === (navigator.language || '').toLowerCase()) score += 3 // same region
  if (isHighQuality(v)) score += 40
  if (v.default) score += 15 // the voice the user's system already uses; beats other basic voices, not a premium one
  if (!v.localService) score += 5
  if (isNovelty(v)) score -= 100
  return score
}

// Best voice for the user's language, or null to let the browser use its own default.
export function autoVoice(voices) {
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase()
  const best = voices
    .filter((v) => v.lang.toLowerCase().startsWith(lang))
    .sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0]
  return best && voiceScore(best, lang) > 0 ? best : null
}

let queue = []
let run = 0 // bumps on every play/stop so callbacks from an old run are ignored

// Break text into pieces of at most `max` characters, preferring sentence ends, then commas, then spaces.
export function chunkText(text, max = 220) {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+(?:[.!?]+["'”’)\]]*(?:\s+|$)|$)/g) || []
  const pieces = []
  for (const sentence of sentences.map((s) => s.trim()).filter(Boolean)) {
    let rest = sentence
    while (rest.length > max) {
      const at = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf('; ', max), rest.lastIndexOf(' ', max))
      const cut = at > max / 2 ? at + 1 : max
      pieces.push(rest.slice(0, cut).trim())
      rest = rest.slice(cut).trim()
    }
    if (rest) pieces.push(rest)
  }
  // Merge short neighbors so we don't speak dozens of tiny fragments.
  return pieces.reduce((out, piece) => {
    const last = out[out.length - 1]
    if (last && last.length + piece.length + 1 <= max) out[out.length - 1] = `${last} ${piece}`
    else out.push(piece)
    return out
  }, [])
}

function speakNext(myRun) {
  const synth = getSynth()
  if (!synth || myRun !== run) return
  const text = queue.shift()
  if (!text) return emit({ id: null, status: 'idle' })
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = prefs.rate
  const installed = synth.getVoices()
  const voice = (prefs.voiceURI && installed.find((v) => v.voiceURI === prefs.voiceURI)) || autoVoice(installed)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }
  utterance.onend = () => speakNext(myRun)
  // 'canceled' / 'interrupted' come from our own stop(); anything else, skip ahead rather than stall.
  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') speakNext(myRun)
  }
  synth.speak(utterance)
}

export function stop() {
  const synth = getSynth()
  run += 1
  queue = []
  synth?.cancel()
  if (state.status !== 'idle') emit({ id: null, status: 'idle' })
}

export function play(id, text) {
  const synth = getSynth()
  if (!synth || !text?.trim()) return
  stop()
  queue = chunkText(speakable(text))
  emit({ id, status: 'playing' })
  speakNext(run)
}

// One button, three behaviours: start, pause, resume.
export function toggle(id, text) {
  const synth = getSynth()
  if (!synth) return
  if (state.id !== id) return play(id, text)
  if (state.status === 'playing') {
    synth.pause()
    emit({ id, status: 'paused' })
  } else if (state.status === 'paused') {
    synth.resume()
    emit({ id, status: 'playing' })
  }
}

// 'idle' | 'playing' | 'paused' for one section id.
export function useSpeechStatus(id) {
  return useSyncExternalStore(subscribe, () => (state.id === id ? state.status : 'idle'))
}

// Installed voices (they load asynchronously in most browsers). English first, then the rest.
let voiceCache = []
const voiceListeners = new Set()
const readVoices = () => {
  const voices = (getSynth()?.getVoices() ?? []).filter((v) => !isNovelty(v))
  voiceCache = [...voices].sort((a, b) => Number(b.lang.startsWith('en')) - Number(a.lang.startsWith('en')) || a.name.localeCompare(b.name))
  voiceListeners.forEach((l) => l())
}
const subscribeVoices = (l) => {
  if (!voiceListeners.size) {
    readVoices()
    getSynth()?.addEventListener?.('voiceschanged', readVoices)
  }
  voiceListeners.add(l)
  return () => {
    voiceListeners.delete(l)
    if (!voiceListeners.size) getSynth()?.removeEventListener?.('voiceschanged', readVoices)
  }
}
export const useVoices = () => useSyncExternalStore(subscribeVoices, () => voiceCache)
