import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
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

function Crystal({ scrollRef, mouse }) {
  const mesh = useRef()
  const { viewport } = useThree()

  // anchor a fixed margin from the right edge so it never clips off-screen;
  // centered + smaller on mobile
  const isNarrow = viewport.aspect < 1.0
  const baseScale = isNarrow ? 0.6 : 0.9
  const margin = 1.35 * baseScale + 0.35 // crystal radius * scale + gap
  const offsetX = isNarrow ? 0 : viewport.width * 0.5 - margin

  useFrame((state, delta) => {
    if (!mesh.current) return
    const scroll = scrollRef.current ?? 0
    mesh.current.rotation.y += delta * 0.16
    mesh.current.rotation.x = mouse.current.y * 0.4 + scroll * 2.0
    mesh.current.rotation.z = mouse.current.x * 0.2
    mesh.current.position.x = offsetX + mouse.current.x * 0.15
    mesh.current.position.y = 0.35 + mouse.current.y * 0.15 + scroll * 3.0
    mesh.current.scale.setScalar(baseScale * (1 - scroll * 0.25))
  })

  return (
    <mesh ref={mesh} position={[offsetX, 0.35, 0]}>
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

function Rig({ scrollRef }) {
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))

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

  useFrame((_, delta) => {
    mouse.current.lerp(target.current, Math.min(1, delta * 2.2))
  })

  return (
    <>
      <Backdrop scrollRef={scrollRef} mouse={mouse} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Crystal scrollRef={scrollRef} mouse={mouse} />
      <IceEnvironment />
    </>
  )
}

export default function Scene({ scrollRef }) {
  return (
    <div className="scene-canvas">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <Rig scrollRef={scrollRef} />
      </Canvas>
    </div>
  )
}
