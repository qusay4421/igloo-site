import { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene from './components/Scene.jsx'
import ScrambleText from './components/ScrambleText.jsx'
import FullscreenToggle from './components/FullscreenToggle.jsx'
import { useLenis } from './hooks/useLenis.js'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const scrollRef = useRef(0)
  const root = useRef(null)
  useLenis(scrollRef)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax drift on the section index labels (subtle depth)
      gsap.utils.toArray('.section').forEach((sec) => {
        const idx = sec.querySelector('.section__index')
        if (!idx) return
        gsap.to(idx, {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: sec,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

      // recalc after fonts/layout settle so triggers map to final positions
      const t = setTimeout(() => ScrollTrigger.refresh(), 300)
      return () => clearTimeout(t)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      <Scene scrollRef={scrollRef} />
      <div className="grain" />

      <nav className="nav">
        <div className="nav__brand">IGLOO°</div>
        <div className="nav__right">
          <div className="nav__links">
            <a href="#approach">Approach</a>
            <a href="#craft">Craft</a>
            <a href="#next">Next</a>
          </div>
          <FullscreenToggle />
        </div>
      </nav>

      <main className="content">
        <header className="hero">
          <ScrambleText
            as="div"
            className="hero__eyebrow"
            text="Interactive · WebGL · 2026"
            delay={150}
          />
          <h1 className="hero__title">
            <ScrambleText as="span" className="line" text="Frozen" delay={350} />
            <ScrambleText as="span" className="line" text="in motion." delay={550} />
          </h1>
          <ScrambleText
            as="p"
            className="hero__sub"
            text="A studio experiment in real-time graphics, building toward the immersive, tactile web. Every frame is computed, not faked."
            delay={950}
            speed={1.1}
          />
          <ScrambleText
            as="div"
            className="hero__scroll"
            text="Scroll to explore"
            delay={1300}
          />
        </header>

        <section className="section" id="approach">
          <div className="section__index">01 / Approach</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="We treat the browser as a canvas for living, breathing worlds. Shaders, physics, and motion that respond to you."
          />
        </section>

        <section className="section" id="craft">
          <div className="section__index">02 / Craft</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="No templates. No stock gradients. Just hand-written GLSL, deliberate typography, and motion tuned frame by frame."
          />
        </section>

        <section className="section" id="next">
          <div className="section__index">03 / Next</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="This is iteration one. Spline scenes, 3D models, and scroll-driven cameras are coming, one refinement at a time."
          />
        </section>

        <footer className="footer">
          <span>Built with React · R3F · GLSL · GSAP</span>
          <span>v0.9 / 2026</span>
        </footer>
      </main>
    </div>
  )
}
