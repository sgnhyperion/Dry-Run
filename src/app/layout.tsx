// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// import { Pacifico } from "next/font/google";

// const pacifico = Pacifico({
//   weight: "400",          // Required
//   variable: "--font-pacifico",
//   subsets: ["latin"],
// });



// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "MimiChat – Chat using Avatars",
//   description: "Chat using expressive 3D avatars powered by AI",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       {/* <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {children}
//       </body> */}
//       <body className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}>
//         {children}
//       </body>


//     </html>
//   );
// }

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Pacifico } from "next/font/google";
import PageTracker from "@/components/PageTracker"; // ✅ Added line
import PresenceTracker from "@/components/PresenceTracker";

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MimiChat – Chat using Avatars",
  description: "Chat using expressive 3D avatars powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable} ${pacifico.variable} 
          antialiased 
          bg-bgPrimary 
          text-textPrimary
        `}
      >
        {children}
         <PageTracker /> {/* ✅ Added line */}
         <PresenceTracker />
      </body>
    </html>
  );
}
