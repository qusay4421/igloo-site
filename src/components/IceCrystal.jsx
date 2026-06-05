import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/crystal.js'

function Crystal({ scrollRef }) {
  const mesh = useRef()
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))
  const { viewport } = useThree()

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

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

  // push the crystal to the right on wide screens, center on narrow ones
  const offsetX = viewport.width > 9 ? 2.4 : 0
  const baseScale = viewport.width > 9 ? 1 : 0.7

  useFrame((state, delta) => {
    if (!mesh.current) return
    uniforms.uTime.value = state.clock.elapsedTime
    mouse.current.lerp(target.current, Math.min(1, delta * 2.2))
    const scroll = scrollRef.current ?? 0

    mesh.current.rotation.y += delta * 0.18
    mesh.current.rotation.x = mouse.current.y * 0.4 + scroll * 2.0
    mesh.current.rotation.z = mouse.current.x * 0.2
    mesh.current.position.x = offsetX + mouse.current.x * 0.15
    mesh.current.position.y = 0.2 + mouse.current.y * 0.15 + scroll * 3.0
    const s = baseScale * (1 - scroll * 0.25)
    mesh.current.scale.setScalar(s)
  })

  return (
    <mesh ref={mesh} position={[offsetX, 0.2, 0]}>
      <icosahedronGeometry args={[1.5, 8]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        extensions={{ derivatives: true }}
      />
    </mesh>
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
        <Crystal scrollRef={scrollRef} />
      </Canvas>
    </div>
  )
}
