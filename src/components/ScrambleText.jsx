import { useEffect, useRef } from 'react'

// Characters used while a glyph is still "decoding".
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&@<>/\\=+*'
const rand = (s) => s[Math.floor(Math.random() * s.length)]
// escape html-special glyphs so they render as text, not markup
const esc = (c) =>
  c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c

/*
  Decode reveal: random glyphs fill each slot, then resolve to the final char.
  e.g. "Cool": UDBH -> Chde -> Codf -> Cool

  Layout-stable: spaces are never scrambled and every unresolved slot reserves
  its final glyph's width (invisible), so the element ALWAYS occupies its exact
  final wrapped footprint — even before/after animating. This means the page
  height never changes (no scroll jank) and the effect only runs on screen.

  Props:
    text     final string
    trigger  'mount' (animate on load) | 'view' (replays each time it enters view)
    delay    ms delay before starting (mount trigger)
    speed    >1 faster, <1 slower
*/
export default function ScrambleText({
  text,
  as: Tag = 'span',
  className = '',
  trigger = 'mount',
  delay = 0,
  speed = 1,
  play = true,
}) {
  const ref = useRef(null)
  const raf = useRef(0)
  const shown = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // invisible placeholder that reserves the final text's exact footprint
    const renderStatic = () => {
      let out = ''
      for (const ch of text) {
        out += ch === ' ' ? ' ' : `<span class="scramble-pending">${esc(ch)}</span>`
      }
      el.innerHTML = out
    }

    const animate = () => {
      cancelAnimationFrame(raf.current)
      const queue = [...text].map((to) => {
        const s = Math.floor((Math.random() * 55) / speed)
        const e = s + 26 + Math.floor((Math.random() * 55) / speed)
        return { to, start: s, end: e, char: null }
      })

      let frame = 0
      const tick = () => {
        let out = ''
        let complete = 0
        for (const q of queue) {
          if (q.to === ' ') {
            out += ' '
            complete++
            continue
          }
          if (frame >= q.end) {
            complete++
            out += esc(q.to)
          } else if (frame >= q.start) {
            if (!q.char || Math.random() < 0.28) q.char = rand(POOL)
            out += `<span class="scramble-dim">${esc(q.char)}</span>`
          } else {
            out += `<span class="scramble-pending">${esc(q.to)}</span>`
          }
        }
        el.innerHTML = out
        if (complete === queue.length) return
        frame++
        raf.current = requestAnimationFrame(tick)
      }
      tick()
    }

    // reserve space immediately so nothing shifts before first play
    renderStatic()

    let timer
    let io
    if (trigger === 'view') {
      io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting && en.intersectionRatio >= 0.35) {
              if (!shown.current) {
                shown.current = true
                animate()
              }
            } else if (!en.isIntersecting) {
              // fully off screen: reset so it replays next time it enters
              shown.current = false
              cancelAnimationFrame(raf.current)
              renderStatic()
            }
          }
        },
        { threshold: [0, 0.35] }
      )
      io.observe(el)
    } else if (play) {
      timer = setTimeout(animate, delay)
    }

    return () => {
      clearTimeout(timer)
      if (io) io.disconnect()
      cancelAnimationFrame(raf.current)
    }
  }, [text, trigger, delay, speed, play])

  return <Tag ref={ref} className={className} aria-label={text} />
}
