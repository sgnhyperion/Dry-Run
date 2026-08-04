// import type { Config } from "tailwindcss";

// export default {
//   content: [
//     "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         background: "var(--background)",
//         foreground: "var(--foreground)",
//       },
//     },
//   },
//   plugins: [],
// } satisfies Config;

import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: "var(--background)",       // page background
        textPrimary: "var(--foreground)",     // main text
        bgSecondary: "var(--card-bg)",        // cards, inputs
        textSecondary: "var(--text-secondary)", 
        accentPurple: "var(--accent-purple)",
        accentPink: "var(--accent-pink)",
        accentCyan: "var(--accent-cyan)",
      },
    },
  },
  plugins: [],
} satisfies Config;
