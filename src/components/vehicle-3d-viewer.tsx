
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei'
import { Suspense } from 'react'

// Carrega o modelo GLB
function TruckModel() {
  // Make sure the model is in the public/models directory
  const { scene } = useGLTF('/models/caminhao.glb') 
  return <primitive object={scene} scale={1.2} />
}

// Renderiza a cena 3D
export default function Vehicle3DViewer() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <TruckModel />
          <Environment preset="city" />
          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.5}
            scale={10}
            blur={1.5}
            far={4.5}
          />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  )
}
