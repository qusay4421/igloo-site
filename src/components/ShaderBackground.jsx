import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/background.js'

function Plane({ scrollRef }) {
  const mat = useRef()
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))
  const { size, viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
    }),
    [] // eslint-disable-line
  )

  // pointer tracking (normalized -1..1)
  useMemo(() => {
    const onMove = (e) => {
      target.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1)
      )
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((state, delta) => {
    if (!mat.current) return
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    // smooth (lerp) the mouse so it glides instead of snapping
    mouse.current.lerp(target.current, Math.min(1, delta * 2.2))
    uniforms.uMouse.value.copy(mouse.current)
    uniforms.uScroll.value = scrollRef.current ?? 0
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function ShaderBackground({ scrollRef }) {
  return (
    <div className="bg-canvas">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1] }}
      >
        <Plane scrollRef={scrollRef} />
      </Canvas>
    </div>
  )
}
