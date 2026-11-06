// src/hooks/useLimit.js
// Knows when every AI model is out of quota. Gives { active, label, setResetsAt }.
import { useState, useEffect } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'

// "3:30 PM", or "3:30 AM tomorrow" if the reset is not today
const formatTime = (ms) => {
  const d = new Date(ms)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const time = `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
  return d.toDateString() === new Date().toDateString() ? time : `${time} tomorrow`
}

export default function useLimit() {
  const [resetsAt, setResetsAt] = useState(null) // epoch ms, or null when there is no limit

  // When the page opens, ask the backend if a limit is already active
  useEffect(() => {
    axios
      .get(`${serverUrl}/api/chat/status`, { withCredentials: true })
      .then(({ data }) => {
        if (data?.limited) setResetsAt(Number(data.resetsAt))
      })
      .catch(() => {})
  }, [])

  // Re-enable by itself when the reset time passes
  useEffect(() => {
    if (!resetsAt) return
    const id = setInterval(() => {
      if (Date.now() >= resetsAt) setResetsAt(null)
    }, 3000)
    return () => clearInterval(id)
  }, [resetsAt])

  const active = Boolean(resetsAt)
  const label = active ? `Your limit is over. Resets at ${formatTime(resetsAt)}` : ''

  return { active, label, setResetsAt }
}