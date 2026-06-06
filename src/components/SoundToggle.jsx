import { useState } from 'react'
import { audio } from '../audio.js'

export default function SoundToggle() {
  const [on, setOn] = useState(false)

  const toggle = () => {
    if (on) {
      audio.disable()
      setOn(false)
    } else {
      audio.enable()
      audio.tick(880)
      setOn(true)
    }
  }

  return (
    <button
      className="snd-btn"
      onClick={toggle}
      aria-label={on ? 'Mute sound' : 'Enable sound'}
      title={on ? 'Mute' : 'Sound'}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M4 9v6h4l5 4V5L8 9H4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {on ? (
          <path
            d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M22 9.5l-5 5M17 9.5l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  )
}
