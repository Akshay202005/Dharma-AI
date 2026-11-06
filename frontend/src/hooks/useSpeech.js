// src/hooks/useSpeech.js
import { useRef, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function useSpeech() {
  const [muted, setMuted] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const mutedRef = useRef(false) // ref so async code always sees the latest mute value
  const audioRef = useRef(null)
  const jobRef = useRef(0) // lets an older speak() notice it was replaced and give up

  const stop = useCallback(() => {
    jobRef.current += 1 // cancels any request still in flight
    window.speechSynthesis?.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
  }, [])

  // Accepts a message object ({ _id, content }) or a plain string
  const speak = useCallback(async (msg) => {
    const text = typeof msg === 'string' ? msg : msg?.content
    const id = typeof msg === 'string' ? null : msg?._id
    if (!text || mutedRef.current) return

    stop()
    const job = jobRef.current
    const stale = () => jobRef.current !== job || mutedRef.current

    // 1) ElevenLabs voice via your backend (200 = ready, 202 = still being made)
    if (id) {
      try {
        let url = null
        for (let i = 0; i < 4 && !url; i++) {
          const res = await axios.post(
            `${serverUrl}/api/chat/messages/${id}/audio`,
            {},
            { withCredentials: true }
          )
          if (res.status === 200) url = res.data.audio.url
          else await wait(1000)
        }
        if (stale()) return
        if (url) {
          const audio = new Audio(url)
          audioRef.current = audio
          setSpeaking(true)
          await new Promise((resolve, reject) => {
            audio.onended = resolve
            audio.onerror = () => reject(new Error('audio error'))
            audio.play().catch(reject) // if the browser blocks autoplay, this lands in catch
          })
          if (jobRef.current === job) {
            audioRef.current = null
            setSpeaking(false)
          }
          return
        }
      } catch (e) {
        console.log('Cloud voice failed, using browser voice:', e?.response?.status || e.message)
        audioRef.current = null
        setSpeaking(false)
        if (stale()) return
      }
    }

    // 2) Fallback: the browser's own voice
    if (!window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(text)

    // male English voices from your list, best first
    const PREFERRED = ['Microsoft David', 'Google UK English Male']
    const voices = window.speechSynthesis.getVoices()
    const male = PREFERRED
      .map((name) => voices.find((v) => v.name.includes(name)))
      .find(Boolean)

    if (male) {
      u.voice = male
      u.lang = male.lang
    } else {
      u.lang = 'en-US'
    }

    u.pitch = 0.8   // a bit deeper
    u.rate = 0.9    // slightly slower sounds calmer

    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [stop])

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (next) stop() // muting cuts off anything currently playing
  }, [stop])

  useEffect(() => stop, [stop]) // stop speaking when leaving the page

  return { speak, stop, toggleMute, muted, speaking }
}