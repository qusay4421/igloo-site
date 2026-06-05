// Branded loading screen. Holds an opaque cover while the WebGL scene
// compiles (hiding the first-paint stutter), counts up, then fades to
// reveal the hero.
export default function Preloader({ progress, hidden }) {
  return (
    <div className="preloader" data-hidden={hidden} aria-hidden={hidden}>
      <div className="preloader__inner">
        <div className="preloader__brand">IGLOO°</div>
        <div className="preloader__bar">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <div className="preloader__pct">{String(progress).padStart(3, '0')}</div>
      </div>
    </div>
  )
}
