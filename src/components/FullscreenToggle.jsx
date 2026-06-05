import { useEffect, useState } from 'react'

const getFsElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement || null

export default function FullscreenToggle() {
  const [fs, setFs] = useState(false)

  useEffect(() => {
    const onChange = () => setFs(!!getFsElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const toggle = () => {
    if (getFsElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      exit?.call(document)
    } else {
      const el = document.documentElement
      const req = el.requestFullscreen || el.webkitRequestFullscreen
      req?.call(el)
    }
  }

  return (
    <button
      className="fs-btn"
      onClick={toggle}
      aria-label={fs ? 'Exit full screen' : 'Enter full screen'}
      title={fs ? 'Exit full screen' : 'Full screen'}
    >
      {fs ? (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M15 21v-4a2 2 0 0 1 2-2h4M3 15h4a2 2 0 0 1 2 2v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="fs-btn__label">{fs ? 'Exit' : 'Fullscreen'}</span>
    </button>
  )
}
