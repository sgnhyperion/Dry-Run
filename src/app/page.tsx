'use client';
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { db } from "@/firebase/config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Link from "next/link"; 

// --- START: VideoAd Component (Unchanged) ---
function VideoAd() {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700/50">
      <video
        className="w-full h-full object-cover"
        src="/mimichat.mp4" 
        loop
        autoPlay
        muted={false} 
        controls={true} 
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
// --- END: VideoAd Component ---

// --- START: Waitlist Form Component (Still here but unused in IntroPage) ---
function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await addDoc(collection(db, "waitlist"), {
        email,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to save waitlist email:", err);
      alert("Failed to join waitlist. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-green-500 font-medium text-center"
      >
        ✅ Thanks for joining! We'll notify you when Mimichat launches.
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto w-full">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-5 py-3 rounded-md text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full"
      />
      <button
        type="submit"
        disabled={loading}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-md font-medium shadow-md hover:shadow-lg transition-all duration-200 ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Joining..." : "Join the Waitlist"}
      </button>
    </form>
  );
}
// --- END: Waitlist Form Component ---


// --- START: Floating Emojis Component (Unchanged) ---
function FloatingEmojis() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const emojis = ["👾", "👾", "👾", "👾", "👾"];
  return (
    <>
      {emojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl pointer-events-none select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ y: ["0px", "-20px", "0px"], rotate: [0, 15, -15, 0] }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </>
  );
}
// --- END: Floating Emojis Component ---

// --- START: Footer Component (MODIFIED) ---
// function Footer() {
//   return (
//     <footer className="w-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 py-6 px-4 md:px-8 mt-auto">
//       <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
        
//         {/* Copyright */}
//         <p className="mb-4 sm:mb-0">
//           © {new Date().getFullYear()} MimiChat. All rights reserved.
//         </p>

//         {/* Links: Only API Documentation remains */}
//         <div className="flex space-x-4">
//           <Link href="/docs" className="hover:text-blue-500 transition-colors">
//             API Documentation
//           </Link>
//         </div>

//       </div>
//     </footer>
//   );
// }
function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 py-8 px-4 md:px-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
        
        {/* Brand */}
        <div className="text-center md:text-left">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            MimiChat
          </p>
          <p className="text-xs mt-1">
            © {new Date().getFullYear()} MimiChat. All rights reserved.
          </p>
        </div>

        {/* Policy Links */}
        <div className="flex flex-wrap justify-center gap-5">
          <Link href="/contact-us" className="hover:text-blue-500 transition-colors">
            Contact
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-blue-500 transition-colors">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-blue-500 transition-colors">
            Refund
          </Link>
          <Link href="/delivery-policy" className="hover:text-blue-500 transition-colors">
            Delivery
          </Link>
          <Link href="/privacy-policy" className="hover:text-blue-500 transition-colors">
            Privacy
          </Link>
        </div>

      </div>
    </footer>
  );
}

// --- END: Footer Component ---

export default function IntroPage() {
  const [mounted, setMounted] = useState(false); 

  useEffect(() => {
    setMounted(true);
    
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;800&family=Inter:wght@400;500&display=swap"; 
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { 
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>('.bg-layer').forEach((el, idx) => {
        el.style.transform = `translate(${e.clientX * 0.01 * idx}px, ${e.clientY * 0.01 * idx}px)`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    // Layout: min-h-screen to allow footer, flex-col layout
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300 font-inter overflow-x-hidden">

      {/* --- START: Navigation/Logo Area (FIXED TO TOP-LEFT) --- */}
      <nav className="z-20 w-full px-4 py-4 absolute top-0 left-0 flex justify-start">
        <Link href="/" passHref>
          <h1 className="font-pacifico text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
            MimiChat
          </h1>
        </Link>
      </nav>
      {/* --- END: Navigation/Logo Area --- */}

      {/* --- START: Background Effects (Parallax) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bg-layer absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.07),transparent_60%)]"></div>
        <div className="bg-layer absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.2),transparent_60%)]"></div>
      </div>
      {/* --- END: Background Effects --- */}

      {/* --- START: Main Content Area (Hero Section) --- */}
      {/* Spacing: pt-20/md:pt-28 (top) and pb-4/md:pb-16 (bottom) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center pt-20 pb-4 md:pt-28 md:pb-16 px-4 space-y-12 md:space-y-0 md:space-x-12 flex-grow">
        <div className="flex-1 text-center md:text-left space-y-6 w-full max-w-lg mx-auto">

          {/* --- START: Headline --- */}
          <h1
            style={{ fontFamily: "'Montserrat', sans-serif" }} 
            className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-tight text-gray-900 dark:text-white"
          >
            Chatting using 3D avatars.
          </h1>
          {/* --- END: Headline --- */}

          <p className="text-gray-700 dark:text-gray-300 text-lg lg:text-xl leading-relaxed max-w-xl mx-auto md:mx-0">
            Get ready for a new social experience with expressive avatars that can speak, emote, and gesture with you.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
            {/* Try Now Button */}
            {/* <a
              href="/share"
              className="w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-md font-medium shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Try Now as Guest(get a demo) →
            </a> */}

            <Link
  href="/share"
  className="w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-md font-medium shadow-md hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
>
  Try Now as Guest(get a demo) →
</Link>

            {/* OR Divider */}
            <div className="flex items-center w-full gap-2">
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">or</span>
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700"></div>
            </div>

            {/* Continue to Login */}
            {/* <a
              href="/login"
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
              Continue to Login and chat with anyone
            </a> */}

            <Link
  href="/login"
  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
>
  Continue to Login and chat with anyone
</Link>

            {/* Access API (Desktop Only) */}
            {/* <div className="hidden md:block w-full mt-4">
              <div 
                className="p-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl" 
              >
                <a
                  href="/docs"
                  className="w-full flex flex-col items-center justify-center bg-white dark:bg-gray-950 text-gray-800 dark:text-white py-4 rounded-lg font-medium shadow-inner transition-all duration-200"
                >
                  <span 
                    className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Access API
                  </span>
                  <span className="text-xs opacity-80 mt-1 dark:text-gray-400">
                    Integrate Mimichat avatar chatting with your platform.
                  </span>
                </a>
              </div>
            </div> */}
          </div>
        </div>

        {/* VideoAd Component */}
        <div className="flex-1 w-full max-w-md h-[550px] sm:h-[500px] md:h-96 mx-auto">
          <VideoAd />
        </div>
        
      </div>
      {/* --- END: Main Content Area (Hero Section) --- */}

      {/* --- START: Footer --- */}
      <Footer />
      {/* --- END: Footer --- */}
      
      {/* CSS for fixing potential mobile zoom issue and gradient text */}
      <style jsx global>{`
        /* Global CSS Fix for Mobile Zoom */
        html, body {
          max-width: 100%;
          overflow-x: hidden;
          touch-action: pan-y;
        }
        
        /* Gradient Text Animation (Kept for style consistency) */
        @keyframes gradientText {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradientText {
          background-size: 200% 200%;
          animation: gradientText 5s ease infinite;
        }
      `}</style>
    </div>
  );
}