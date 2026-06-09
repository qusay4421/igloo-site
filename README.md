# IGLOO° — interactive studio site

Building toward [igloo.inc](https://www.igloo.inc/) level, one iteration at a time.
No generic AI templates — hand-written shaders, deliberate motion, real WebGL.

## Stack

- **React 18** + **Vite** — app shell & fast dev
- **React Three Fiber** + **three.js** — WebGL scene graph
- **GLSL** — custom domain-warped noise shader (`src/shaders/background.js`)
- **GSAP** + **ScrollTrigger** — masked text reveals, parallax, timelines
- **Lenis** — smooth scroll, wired into ScrollTrigger

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle
```

## Iteration log

- **v0.2** — IBM Plex Mono type system; shader rebalanced to ~3:1 light-blue:dark-blue;
  replaced masked reveals with a decode/scramble effect (`ScrambleText.jsx`) — slots
  start blank, fill with random glyphs, resolve to final chars. Text flipped to dark
  ink for contrast on the lighter background.
- **v0.1** — Foundation: custom glacial GLSL background (mouse + scroll reactive),
  Lenis smooth scroll, GSAP hero intro + scroll-reveal sections, grain overlay,
  Clash Display / Satoshi type system.

## Roadmap (toward igloo.inc)

1. **Spline / GLB hero object** — a real 3D centerpiece (ice shard / creature) with
   scroll-driven camera. Draco-compressed GLB, baked lighting.
2. **Custom shader materials on the model** — fresnel, refraction, subsurface.
3. **Scroll-choreographed sections** — pinned scenes, camera moves per section.
4. **Post-processing** — bloom, chromatic aberration, depth of field (postprocessing lib).
5. **Custom cursor + magnetic interactions + page transitions.**
6. **Audio-reactive / UI sound design**, preloader, performance budget (LOD, lazy).

## Credits

- Hero model: "Fox" from the Khronos glTF Sample Assets. Model by PixelMannen
  (CC0); rig + animations by Tom Kranis (CC-BY 4.0); glTF conversion by
  AsoboStudio / Microsoft. Re-skinned here as a frosted ice material.

## Asset sources

Poly Haven (HDRIs/textures, CC0), Sketchfab / poly.pizza / Quaternius (models),
Fontshare (fonts), Freesound (audio). Always check license.
