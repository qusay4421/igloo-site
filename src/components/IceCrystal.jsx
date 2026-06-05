import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Crystal({ scrollRef }) {
  const mesh = useRef()
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))
  const { viewport } = useThree()

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

  const offsetX = viewport.width > 9 ? 2.4 : 0
  const baseScale = viewport.width > 9 ? 1 : 0.7

  useFrame((state, delta) => {
    if (!mesh.current) return
    mouse.current.lerp(target.current, Math.min(1, delta * 2.2))
    const scroll = scrollRef.current ?? 0

    mesh.current.rotation.y += delta * 0.16
    mesh.current.rotation.x = mouse.current.y * 0.4 + scroll * 2.0
    mesh.current.rotation.z = mouse.current.x * 0.2
    mesh.current.position.x = offsetX + mouse.current.x * 0.15
    mesh.current.position.y = 0.2 + mouse.current.y * 0.15 + scroll * 3.0
    mesh.current.scale.setScalar(baseScale * (1 - scroll * 0.25))
  })

  return (
    <mesh ref={mesh} position={[offsetX, 0.2, 0]}>
      {/* low detail + flatShading = cut ice-gem facets that bend light */}
      <icosahedronGeometry args={[1.55, 0]} />
      <MeshTransmissionMaterial
        flatShading
        transmission={1}
        thickness={1.7}
        roughness={0.05}
        ior={1.31}
        chromaticAberration={0.06}
        anisotropicBlur={0.1}
        distortion={0.25}
        distortionScale={0.4}
        temporalDistortion={0.08}
        color="#cfeeff"
        attenuationColor="#6fb6ff"
        attenuationDistance={1.6}
        resolution={512}
      />
    </mesh>
  )
}

// Procedural studio lighting — light panels the glass reflects/refracts,
// no external HDRI fetch. Tuned to an icy blue/white key with cool fills.
function IceEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer
        intensity={2.4}
        position={[0, 2.5, 4]}
        scale={[7, 7, 1]}
        color="#dff3ff"
      />
      <Lightformer
        intensity={1.4}
        position={[-5, 1, -1]}
        scale={[5, 5, 1]}
        color="#3f7fd6"
      />
      <Lightformer
        intensity={1.8}
        position={[4, -2, 2]}
        scale={[4, 4, 1]}
        color="#ffffff"
      />
      <Lightformer
        intensity={1.1}
        position={[0, -3, -3]}
        scale={[6, 3, 1]}
        color="#9ecbff"
      />
    </Environment>
  )
}

export default function IceCrystal({ scrollRef }) {
  return (
    <div className="fx-canvas">
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 45 }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <Crystal scrollRef={scrollRef} />
        <IceEnvironment />
      </Canvas>
    </div>
  )
}
