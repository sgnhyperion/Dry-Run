// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // ✅ Razorpay + Developers Page (NO COEP RESTRICTIONS)
      {
        source: "/premium",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },

      // ✅ Razorpay API routes (optional safety)
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },

    ];
  },
};

module.exports = nextConfig;
