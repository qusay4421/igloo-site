import { useRef, useMemo, useEffect, useState, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/background.js'

// Fullscreen shader background, rendered INSIDE the 3D scene (clip-space plane,
// ignores the camera) so the glass crystal can refract it instead of black.
function Backdrop({ scrollRef, mouse }) {
  const { size, viewport } = useThree()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    uniforms.uMouse.value.copy(mouse.current)
    uniforms.uScroll.value = scrollRef.current ?? 0
  })

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// Scroll-driven cinematic camera: starts framing the hero crystal on the
// right, then flies FORWARD through the fogged ice field, gently wandering,
// with the look-at swinging from the crystal to straight down the corridor.
function CameraRig({ scrollRef, mouse, offsetX }) {
  const { camera } = useThree()
  const s = useRef(0)
  const camPos = useMemo(() => new THREE.Vector3(0, 0, 5), [])
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame((_, delta) => {
    const raw = THREE.MathUtils.clamp(scrollRef.current ?? 0, 0, 1)
    // single smoother on the scroll value; the camera is then a pure
    // deterministic function of it, so the path is identical up and down
    // (no compounding lag / no failing to retrace on fast scroll)
    s.current = THREE.MathUtils.damp(s.current, raw, 8, delta)
    const e = THREE.MathUtils.smoothstep(s.current, 0, 1)

    camPos.set(
      Math.sin(e * Math.PI * 1.4) * 1.4 + mouse.current.x * 0.4,
      THREE.MathUtils.lerp(0, 1.0, e) + mouse.current.y * 0.4,
      THREE.MathUtils.lerp(5, -22, e) // travel forward through the field
    )
    camera.position.copy(camPos)

    // look at the crystal first, then ahead down the corridor
    target.set(
      THREE.MathUtils.lerp(offsetX * 0.7, 0, THREE.MathUtils.smoothstep(s.current, 0, 0.4)),
      0,
      camPos.z - 6
    )
    camera.lookAt(target)
  })

  return null
}

// A fogged field of ice shards scattered through depth — one instanced draw
// call. Gives the scene real parallax/volume so the camera flies THROUGH
// space rather than arcing in front of a flat backdrop.
function IceField() {
  const ref = useRef()
  const count = 70
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const shards = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        p: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 12,
          -1 - Math.random() * 38,
        ],
        r: [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ],
        s: 0.12 + Math.random() * 0.7,
      })),
    []
  )

  useLayoutEffect(() => {
    shards.forEach((d, i) => {
      dummy.position.set(d.p[0], d.p[1], d.p[2])
      dummy.rotation.set(d.r[0], d.r[1], d.r[2])
      dummy.scale.setScalar(d.s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [shards, dummy])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.06
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#3b6e9c"
        roughness={0.4}
        metalness={0.15}
        flatShading
        emissive="#0b2238"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  )
}

const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2
const DROP_FROM = 6 // above the top of the view
const DROP_DUR = 2.0 // seconds
const DROP_DELAY = 0.35 // wait for the loader to finish clearing first
// fixed world axes so drag direction stays consistent no matter how far the
// crystal has already turned (avoids the flipped-axis trackball problem)
const WORLD_X = new THREE.Vector3(1, 0, 0)
const WORLD_Y = new THREE.Vector3(0, 1, 0)

function Crystal({ meshRef, matRef, offsetX, baseScale, spinning, spinVel, started }) {
  const introT = useRef(0)
  const wait = useRef(0)

  useFrame((state, delta) => {
    const m = meshRef.current
    if (!m) return

    // hold invisible & off-screen above until the loader is gone
    if (!started || wait.current < DROP_DELAY) {
      if (started) wait.current += delta
      m.position.set(offsetX, DROP_FROM, 0)
      m.scale.setScalar(baseScale)
      if (matRef.current) matRef.current.opacity = 0
      return
    }

    if (introT.current < 1) introT.current = Math.min(1, introT.current + delta / DROP_DUR)
    const p = introT.current
    const e = easeInOutSine(p)

    // fade + scale in so it materializes gradually rather than popping
    if (matRef.current) matRef.current.opacity = THREE.MathUtils.clamp(p * 1.8, 0, 1)
    m.scale.setScalar(baseScale * THREE.MathUtils.lerp(0.82, 1, e))

    const floatY = Math.sin(state.clock.elapsedTime * 0.5) * 0.06

    if (p < 1) {
      // intro: a single clean roll that completes as it lands
      m.rotation.x = (1 - p) * Math.PI * 2.2
      m.rotation.z = 0
      m.position.set(offsetX, THREE.MathUtils.lerp(DROP_FROM, 0.1 + floatY, e), 0)
    } else {
      // spin from click-drag: apply angular velocity around WORLD axes (so
      // drag direction is consistent regardless of current orientation),
      // with momentum that decays after release (idle drift when at rest)
      m.rotateOnWorldAxis(WORLD_Y, spinVel.current.x * 0.006)
      m.rotateOnWorldAxis(WORLD_X, spinVel.current.y * 0.006)
      spinVel.current.multiplyScalar(spinning.current ? 0.6 : 0.94)
      if (!spinning.current && spinVel.current.lengthSq() < 0.02) {
        m.rotateOnWorldAxis(WORLD_Y, delta * 0.12)
      }
      m.position.set(offsetX, 0.1 + floatY, 0)
    }
  })

  return (
    <mesh ref={meshRef} position={[offsetX, 0.1, 0]}>
      <icosahedronGeometry args={[1.35, 1]} />
      <MeshTransmissionMaterial
        ref={matRef}
        transparent
        flatShading
        transmission={1}
        thickness={1.4}
        roughness={0.04}
        ior={1.33}
        chromaticAberration={0.05}
        anisotropicBlur={0.1}
        distortion={0.2}
        distortionScale={0.35}
        temporalDistortion={0.06}
        color="#dbf2ff"
        attenuationColor="#86c4ff"
        attenuationDistance={2.2}
        resolution={256}
        samples={4}
        background={new THREE.Color('#05070d')}
      />
    </mesh>
  )
}

function IceEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2.6} position={[0, 2.5, 4]} scale={[7, 7, 1]} color="#dff3ff" />
      <Lightformer intensity={1.5} position={[-5, 1, -1]} scale={[5, 5, 1]} color="#3f7fd6" />
      <Lightformer intensity={2.0} position={[4, -2, 2]} scale={[4, 4, 1]} color="#ffffff" />
      <Lightformer intensity={1.2} position={[0, -3, -3]} scale={[6, 3, 1]} color="#9ecbff" />
    </Environment>
  )
}

// Cinematic colour-grade pass: glow on the bright ice crests, a hair of
// lens colour-fringe, gentle depth blur, vignette, and fine film grain.
function Effects() {
  return (
    <EffectComposer disableNormalPass multisampling={4}>
      <DepthOfField focusDistance={0.012} focalLength={0.025} bokehScale={1.6} />
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0006, 0.0006]}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.72} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.16} />
    </EffectComposer>
  )
}

function Rig({ scrollRef, started }) {
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))
  const { viewport, camera } = useThree()

  // spin state for the crystal (click + drag to rotate it)
  const meshRef = useRef()
  const matRef = useRef()
  const spinning = useRef(false)
  const spinVel = useRef(new THREE.Vector2(0, 0))
  const last = useRef(new THREE.Vector2(0, 0))
  const ndc = useRef(new THREE.Vector2())
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  // single pointer handler: cursor-parallax + grab-to-spin the crystal
  // (window-level so it works even though the canvas is pointer-events:none
  // and the text sits on top)
  useEffect(() => {
    const setPointer = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = -((e.clientY / window.innerHeight) * 2 - 1)
      ndc.current.set(nx, ny)
      target.current.set(nx, ny)
    }
    const overCrystal = () => {
      if (!meshRef.current) return false
      raycaster.setFromCamera(ndc.current, camera)
      return raycaster.intersectObject(meshRef.current, false).length > 0
    }
    const setCursor = (v) => {
      document.body.style.cursor = v
      document.documentElement.dataset.cursor = v
    }
    const onDown = (e) => {
      setPointer(e)
      if (overCrystal()) {
        spinning.current = true
        last.current.set(e.clientX, e.clientY)
        spinVel.current.set(0, 0)
        setCursor('grabbing')
        e.preventDefault()
      }
    }
    const onMove = (e) => {
      setPointer(e)
      if (spinning.current) {
        // feed the drag delta straight into angular velocity (same direction
        // as the mouse: drag right -> spins right, drag down -> tilts down)
        spinVel.current.set(e.clientX - last.current.x, e.clientY - last.current.y)
        last.current.set(e.clientX, e.clientY)
        e.preventDefault()
      } else {
        setCursor(overCrystal() ? 'grab' : '')
      }
    }
    const onUp = () => {
      if (spinning.current) {
        spinning.current = false
        setCursor('')
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [camera, raycaster])

  useFrame((_, delta) => {
    mouse.current.lerp(target.current, Math.min(1, delta * 2.2))
  })

  // layout: anchor the crystal a fixed margin in from the right edge
  // (centred + smaller on mobile)
  const isNarrow = viewport.aspect < 1.0
  const baseScale = isNarrow ? 0.6 : 0.9
  const margin = 1.35 * baseScale + 0.35
  const offsetX = isNarrow ? 0 : viewport.width * 0.5 - margin

  return (
    <>
      <fog attach="fog" args={['#060d1a', 7, 40]} />
      <Backdrop scrollRef={scrollRef} mouse={mouse} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <IceField />
      <Crystal
        meshRef={meshRef}
        matRef={matRef}
        offsetX={offsetX}
        baseScale={baseScale}
        spinning={spinning}
        spinVel={spinVel}
        started={started}
      />
      <CameraRig scrollRef={scrollRef} mouse={mouse} offsetX={offsetX} />
      <IceEnvironment />
    </>
  )
}

export default function Scene({ scrollRef, onReady, started = true }) {
  // pause the render loop entirely while the tab is hidden (saves CPU/GPU/battery)
  const [frameloop, setFrameloop] = useState('always')
  useEffect(() => {
    const onVis = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div className="scene-canvas">
      <Canvas
        frameloop={frameloop}
        // AA handled by the EffectComposer (multisampling); canvas AA would
        // be redundant work since we render through the composer.
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        onCreated={onReady}
      >
        <Rig scrollRef={scrollRef} started={started} />
        <Effects />
      </Canvas>
    </div>
  )
}
