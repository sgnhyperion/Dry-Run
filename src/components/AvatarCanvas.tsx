'use client';

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

// 3D Avatar Component
function Avatar3D() {
  const gltf = useGLTF("/avatar1.glb"); // Replace with your GLB path
  return <primitive object={gltf.scene} scale={9} position={[0, -3, 0]} />;
}

export default function AvatarCanvas() {
  return (
    <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={null}>
        <Avatar3D />
      </Suspense>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  );
}
