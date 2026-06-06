import { useEffect, useRef } from 'react'

// A single white dot that tracks the pointer 1:1 (no ring).
export default function CustomCursor() {
  const dot = useRef(null)

  useEffect(() => {
    // only on devices with a real pointer (skip touch)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-custom-cursor')

    const onMove = (e) => {
      if (dot.current) {
        dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
      }
    }
    window.addEventListener('pointermove', onMove)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return <div ref={dot} className="cursor-dot" />
}
