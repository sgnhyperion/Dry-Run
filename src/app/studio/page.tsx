"use client";

// The /studio route renders the 3D avatar. We load AvatarViewer with ssr:false because
// three.js/WebGL only exists in the browser — there's no <canvas> or GPU on the Next.js
// server, so we skip server-rendering this component and mount it purely client-side.
import dynamic from "next/dynamic";

const AvatarViewer = dynamic(() => import("@/components/AvatarViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-400">
      Loading avatar…
    </div>
  ),
});

export default function StudioPage() {
  return <AvatarViewer />;
}
