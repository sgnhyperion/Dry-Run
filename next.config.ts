import type { NextConfig } from "next";

// Minimal config. The old COOP/COEP header rules existed only for the USD
// WASM viewer + Razorpay, both removed in the Dry Run pivot.
// reactStrictMode disabled: Strict Mode double-mounts components in dev, which makes
// react-three-fiber create+dispose the WebGL context twice — spurious "Context Lost".
const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default nextConfig;
