import { useRef, useMemo, useEffect } from 'react'
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

// Scroll-driven cinematic camera: dollies in and arcs while the look-at
// target slides from screen-centre toward the crystal, pulling it from the
// right edge into the focal centrepiece as you travel down the page.
function CameraRig({ scrollRef, mouse, offsetX }) {
  const { camera } = useThree()
  const s = useRef(0)
  const camPos = useMemo(() => new THREE.Vector3(0, 0, 5), [])
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame((_, delta) => {
    const raw = THREE.MathUtils.clamp(scrollRef.current ?? 0, 0, 1)
    s.current = THREE.MathUtils.damp(s.current, raw, 5, delta)
    const e = THREE.MathUtils.smoothstep(s.current, 0, 1)

    camPos.set(
      THREE.MathUtils.lerp(0, offsetX * 0.5, e) +
        Math.sin(s.current * Math.PI) * 0.7 +
        mouse.current.x * 0.25,
      THREE.MathUtils.lerp(0, 0.55, e) + mouse.current.y * 0.25,
      THREE.MathUtils.lerp(5.0, 3.0, e)
    )
    camera.position.lerp(camPos, Math.min(1, delta * 4))

    target.set(
      THREE.MathUtils.lerp(0, offsetX * 0.7, THREE.MathUtils.smoothstep(s.current, 0, 0.6)),
      0,
      0
    )
    camera.lookAt(target)
  })

  return null
}

const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2
const DROP_FROM = 6 // above the top of the view
const DROP_DUR = 2.0 // seconds
const DROP_DELAY = 0.35 // wait for the loader to finish clearing first

function Crystal({ meshRef, mouse, offsetX, baseScale, dragging, dragPos, placed, started }) {
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const introT = useRef(0)
  const wait = useRef(0)

  useFrame((state, delta) => {
    const m = meshRef.current
    if (!m) return
    m.scale.setScalar(baseScale)

    // hold off-screen above until the loader is gone
    if (!started || wait.current < DROP_DELAY) {
      if (started) wait.current += delta
      m.position.set(offsetX, DROP_FROM, 0)
      return
    }

    if (introT.current < 1) introT.current = Math.min(1, introT.current + delta / DROP_DUR)
    const p = introT.current
    const e = easeInOutSine(p)

    // a single clean roll, completing exactly as it lands
    if (p < 1) {
      m.rotation.x = (1 - p) * Math.PI * 2.2
      m.rotation.z = 0
    } else {
      m.rotation.x = mouse.current.y * 0.3
      m.rotation.z = mouse.current.x * 0.15
      m.rotation.y += delta * 0.14 // ambient spin only after it settles
    }

    const floatY = Math.sin(state.clock.elapsedTime * 0.5) * 0.06
    if (placed.current) {
      tmp.copy(dragPos.current)
    } else {
      tmp.set(offsetX, THREE.MathUtils.lerp(DROP_FROM, 0.1 + floatY, e), 0)
    }
    m.position.lerp(tmp, dragging.current ? 0.4 : p < 1 ? 1 : 0.09)
  })

  return (
    <mesh ref={meshRef} position={[offsetX, 0.1, 0]}>
      <icosahedronGeometry args={[1.35, 1]} />
      <MeshTransmissionMaterial
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
        resolution={512}
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

  // drag state for the grabbable crystal
  const meshRef = useRef()
  const dragging = useRef(false)
  const placed = useRef(false)
  const dragPos = useRef(new THREE.Vector3())
  const ndc = useRef(new THREE.Vector2())
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    const onMove = (e) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      )
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // grab + drag the crystal (window-level so it works even though the
  // canvas is pointer-events:none and the text sits on top)
  useEffect(() => {
    const setNdc = (e) => {
      ndc.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      )
    }
    const overCrystal = () => {
      if (!meshRef.current) return false
      raycaster.setFromCamera(ndc.current, camera)
      return raycaster.intersectObject(meshRef.current, false).length > 0
    }
    const toPlane = () => {
      raycaster.setFromCamera(ndc.current, camera)
      raycaster.ray.intersectPlane(dragPlane, dragPos.current)
    }
    const onDown = (e) => {
      setNdc(e)
      if (overCrystal()) {
        dragging.current = true
        placed.current = true
        toPlane()
        document.body.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }
    const onMove = (e) => {
      setNdc(e)
      if (dragging.current) {
        toPlane()
        e.preventDefault()
      } else {
        document.body.style.cursor = overCrystal() ? 'grab' : ''
      }
    }
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false
        document.body.style.cursor = ''
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
  }, [camera, raycaster, dragPlane])

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
      <Backdrop scrollRef={scrollRef} mouse={mouse} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Crystal
        meshRef={meshRef}
        mouse={mouse}
        offsetX={offsetX}
        baseScale={baseScale}
        dragging={dragging}
        dragPos={dragPos}
        placed={placed}
        started={started}
      />
      <CameraRig scrollRef={scrollRef} mouse={mouse} offsetX={offsetX} />
      <IceEnvironment />
    </>
  )
}

export default function Scene({ scrollRef, onReady, started = true }) {
  return (
    <div className="scene-canvas">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        onCreated={onReady}
      >
        <Rig scrollRef={scrollRef} started={started} />
        <Effects />
      </Canvas>
    </div>
  )
}
