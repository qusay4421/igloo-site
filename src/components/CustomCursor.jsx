import { useEffect, useRef } from 'react'

// A two-part cursor: a tight dot that tracks 1:1 and a ring that trails with
// easing. It grows over links/buttons and reflects the crystal grab state
// (read from documentElement.dataset.cursor, set by the 3D scene).
export default function CustomCursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    // only on devices with a real pointer (skip touch)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-custom-cursor')

    const m = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const r = { x: m.x, y: m.y }
    const hover = { current: false }
    let raf

    const onMove = (e) => {
      m.x = e.clientX
      m.y = e.clientY
      if (dot.current) {
        dot.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) translate(-50%, -50%)`
      }
    }
    const onOver = (e) => {
      hover.current = !!(e.target.closest && e.target.closest('a, button, [data-cursor]'))
    }

    const loop = () => {
      r.x += (m.x - r.x) * 0.18
      r.y += (m.y - r.y) * 0.18
      if (ring.current) {
        ring.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0) translate(-50%, -50%)`
        const grab = document.documentElement.dataset.cursor || ''
        ring.current.dataset.state = grab || (hover.current ? 'link' : '')
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove)
    document.addEventListener('pointerover', onOver)
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  )
}
