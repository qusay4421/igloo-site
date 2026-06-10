import { useRef, useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrambleText from './components/ScrambleText.jsx'
import FullscreenToggle from './components/FullscreenToggle.jsx'
import Preloader from './components/Preloader.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import Magnetic from './components/Magnetic.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import { audio } from './audio.js'
import { useLenis } from './hooks/useLenis.js'

// heavy WebGL stack (three/drei/postprocessing) split into its own chunk
const Scene = lazy(() => import('./components/Scene.jsx'))

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const scrollRef = useRef(0)
  const root = useRef(null)
  useLenis(scrollRef)

  // ---- Preloader: count up while the WebGL scene initializes ----
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const sceneReady = useRef(false)

  useEffect(() => {
    let raf
    const duration = 1800
    const t0 = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      // hold below 100 until the scene has actually initialized
      const ceil = sceneReady.current ? 100 : 92
      setProgress(Math.min(ceil, Math.round(eased * 100)))
      if (k >= 1 && sceneReady.current) {
        setProgress(100)
        setTimeout(() => setLoading(false), 350)
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // lock scroll while the preloader is up
  useEffect(() => {
    document.documentElement.style.overflow = loading ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [loading])

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
      <CustomCursor />
      <Preloader progress={progress} hidden={!loading} />
      <Suspense fallback={null}>
        <Scene
          scrollRef={scrollRef}
          started={!loading}
          onReady={() => (sceneReady.current = true)}
        />
      </Suspense>
      <div className="grain" />

      <nav className="nav">
        <div className="nav__brand">IGLOO°</div>
        <div className="nav__right">
          <div className="nav__links">
            <Magnetic>
              <a href="#approach" onMouseEnter={() => audio.tick()}>
                Approach
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#craft" onMouseEnter={() => audio.tick()}>
                Craft
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#next" onMouseEnter={() => audio.tick()}>
                Next
              </a>
            </Magnetic>
          </div>
          <Magnetic>
            <SoundToggle />
          </Magnetic>
          <Magnetic>
            <FullscreenToggle />
          </Magnetic>
        </div>
      </nav>

      <main className="content">
        <header className="hero">
          <ScrambleText
            as="div"
            className="hero__eyebrow"
            text="Interactive · WebGL · 2026"
            delay={150}
            play={!loading}
          />
          <h1 className="hero__title">
            <ScrambleText as="span" className="line" text="Frozen" delay={350} play={!loading} />
            <ScrambleText as="span" className="line" text="in motion" delay={550} play={!loading} />
          </h1>
          <ScrambleText
            as="p"
            className="hero__sub"
            text="A studio experiment in real-time graphics, building toward the immersive, tactile web, every frame computed, not faked"
            delay={950}
            speed={1.1}
            play={!loading}
          />
          <ScrambleText
            as="div"
            className="hero__scroll"
            text="Scroll to explore"
            delay={1300}
            play={!loading}
          />
        </header>

        <section className="section" id="approach">
          <div className="section__index">01 / Approach</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="We treat the browser as a canvas for living, breathing worlds, shaders, physics, and motion that respond to you"
          />
        </section>

        <section className="section" id="craft">
          <div className="section__index">02 / Craft</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="No templates, no stock gradients, just hand-written GLSL, deliberate typography, and motion tuned frame by frame"
          />
        </section>

        <section className="section" id="next">
          <div className="section__index">03 / Next</div>
          <ScrambleText
            as="p"
            className="reveal-line"
            trigger="view"
            speed={1.1}
            text="This is iteration one, Spline scenes, 3D models, and scroll-driven cameras are coming, one refinement at a time"
          />
        </section>

        <section className="section closing" id="end">
          <ScrambleText
            as="p"
            className="closing-line"
            trigger="view"
            speed={1.1}
            text="The ice keeps moving, so do we"
          />
          <Magnetic>
            <a className="closing-cta" href="#" onMouseEnter={() => audio.tick(1400)}>
              Start a project
            </a>
          </Magnetic>
        </section>

        <footer className="footer">
          <span>Built with React · R3F · GLSL · GSAP</span>
          <span>v0.36 / 2026</span>
        </footer>
      </main>
    </div>
  )
}
