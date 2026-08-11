"use client";

// Milestone 1.1 — the avatar on screen.
//
// react-three-fiber (r3f) lets us describe a three.js scene as React JSX. Instead of
// imperatively `new THREE.Scene()`, `scene.add(...)`, we write <Canvas>, <mesh>, <primitive/>
// and r3f builds + updates the underlying three.js objects for us. Every lowercase JSX tag
// (<ambientLight/>, <primitive/>) maps to a three.js class (THREE.AmbientLight, etc.).

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useEffect, useRef } from "react";

const MODEL_URL = "/avatar.vrm"; // served from public/. Swap this file with your VRoid export later.

// A shared box both the button (below) and the animation loop can read.
// It'll hold the browser's live sound meter once the sound is turned on.
let analyser: AnalyserNode | null = null;

async function startMic() {
  // ask the browser for microphone access (pops a permission prompt)
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  //AudioContext = the browser's audio engine. We make one, then build a 
  // "meter" (analyser) and plug the mic into it.
  const ctx = new AudioContext();
  const micSource = ctx.createMediaStreamSource(stream);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  micSource.connect(analyser);

  console.log("🎤 mic is on", analyser);
}

function VrmAvatar() {
  // useGLTF loads + caches a glTF/GLB. A .vrm IS a .glb with VRM extensions, but the base
  // GLTFLoader doesn't understand those extensions — so we register VRMLoaderPlugin on the
  // loader (4th arg = "extend the loader"). The plugin parses the VRM data and stashes a ready
  // VRM instance at gltf.userData.vrm.
  const gltf = useGLTF(MODEL_URL, undefined, undefined, (loader) => {
    // `as any`: drei types the loader via @types/three, three-vrm via three-stdlib. The two
    // GLTFLoader type definitions are structurally incompatible even though the runtime objects
    // are identical — a known TS-only clash. The cast bridges it; behavior is unaffected.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loader.register((parser: any) => new VRMLoaderPlugin(parser) as any);
  });

  const vrm = gltf.userData.vrm as VRM;
  const blinkTimer = useRef(0);

  // Runs once when the VRM is ready.
  useEffect(() => {
    if (!vrm) return;
    // VRM 0.x avatars face -Z (away from a default camera); this rotates them to face +Z like
    // VRM 1.0. It's a no-op on our VRM-1.0 sample but keeps the code correct for any model.
    VRMUtils.rotateVRM0(vrm);
    // NOTE: intentionally NOT calling removeUnnecessaryVertices / combineSkeletons — those
    // optimizations can corrupt morph-target vertex buffers, which then crashes the WebGL
    // renderer the moment we drive a morph (blink/visemes). Re-add only if perf demands + verified.
    vrm.scene.traverse((obj) => (obj.frustumCulled = false));
  }, [vrm]);

  // The render loop. r3f calls this every frame with (state, deltaSeconds).
  // vrm.update(delta) advances everything time-based inside the VRM: spring bones (hair/cloth
  // physics), look-at, and expression blending. Without it, the model is frozen.
  useFrame((_, delta) => {
    if (!vrm) return;

    // Liveness check: a slow auto-blink. This also proves the expression pipeline end-to-end —
    // the exact same mechanism will drive visemes (aa/ih/ou/ee/oh) in Milestone 1.2.
    blinkTimer.current += delta;
    const cycle = blinkTimer.current % 4; // blink roughly every 4s
    const blink = cycle > 3.85 ? Math.sin((cycle - 3.85) / 0.15 * Math.PI) : 0;
    vrm.expressionManager?.setValue("blink", blink);

    if(analyser){
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const average = sum/bufferLength;
      const normalizedAverage = average/255;
      const mouth = 8*normalizedAverage
      vrm.expressionManager?.setValue("aa", mouth);
    }


    // Clamp delta: on the first frame (or after the tab is backgrounded) delta can be huge, which
    // makes spring-bone physics overshoot → vertices fly to NaN/infinity → the GPU crashes. Capping
    // at ~1/30s keeps the physics integrator stable no matter what.
    vrm.update(Math.min(delta, 1 / 30));
  });

  // Guard: while the VRM is still parsing, userData.vrm is briefly undefined — render nothing
  // rather than crash on vrm.scene. (Must sit AFTER all hooks — hooks can't run conditionally.)
  if (!vrm) return null;

  // <primitive/> drops an already-built three.js object into the r3f scene graph as-is.
  return <primitive object={vrm.scene} />;
}

// NOTE: no useGLTF.preload here on purpose. preload() caches the model by URL *without* our
// VRMLoaderPlugin, so a later useGLTF(...) with the plugin would get the cached pluginless glTF
// (userData.vrm === undefined). Skipping preload keeps the plugin-registered load as the only one.

export default function AvatarViewer() {
  return (
    <div className="h-screen w-screen bg-neutral-900">
      <button onClick={startMic} style={{ position: "absolute", zIndex: 1, margin: 12, padding: "6px 12px" }}>
        Start mic
      </button>
      {/* camera: eye-level, ~1.4m up (VRM avatars are ~1.5m tall), pulled back 1.4m to frame the head+torso */}
      {/* dpr capped at 1.5: on a Retina Mac the default (2) renders 4x the pixels, which combined with */}
      {/* MToon's multi-pass shading exhausts the GPU and drops the WebGL context. 1.5 still looks crisp. */}
      <Canvas
        camera={{ position: [0, 1.35, 1.4], fov: 30 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {/* Lights. ambientLight = flat fill so nothing is pure black; directionalLight = a sun for shape/shadow. */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[1, 2, 3]} intensity={1.2} />

        {/* Suspense: useGLTF "suspends" (pauses render) while the 10MB VRM downloads; fallback shows meanwhile. */}
        <VrmAvatar />

        {/* Drag to orbit / scroll to zoom — lets us inspect the model. target = look at head height. */}
        <OrbitControls target={[0, 1.3, 0]} />
      </Canvas>
    </div>
  );
}
