
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useParams, useSearchParams } from "next/navigation";
// import { db } from "@/firebase/config"; // 🟢 make sure you have this import
// import { doc, getDoc } from "firebase/firestore"; // 🟢 Added
// import Confetti from "react-confetti";
// import { motion } from "framer-motion";
// import { analytics, logEvent } from "@/firebase/config";
// import { preloadUsdModule } from "@/usdLoader";


// const USDViewer: React.FC<{ usdUrl: string; audioUrl?: string }> = ({
//   usdUrl,
//   audioUrl,
// }) => {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
//   const [iframeKey, setIframeKey] = useState(0);

//   useEffect(() => {
//     if (!audioUrl) return;
//     const newAudio = new Audio(audioUrl);
//     newAudio.loop = true;
//     setAudio(newAudio);

//     return () => {
//       newAudio.pause();
//       newAudio.currentTime = 0;
//     };
//   }, [audioUrl]);

//   useEffect(() => {
//     const handleUSDLoaded = (event: MessageEvent) => {
//       if (event.data?.type === "USD_LOADED" && audio && isPlaying) {
//         audio.currentTime = 0;
//         audio.play().catch(console.error);
//       }
//     };
//     window.addEventListener("message", handleUSDLoaded);
//     return () => window.removeEventListener("message", handleUSDLoaded);
//   }, [audio, isPlaying]);

//   const handlePlay = () => {
//     setIframeKey((prev) => prev + 1);
//     setIsPlaying(true);
//      // 🔥 Log event to Firebase Analytics
//   if (analytics) {
//     logEvent(analytics, "play_clicked", {
//       usd_file: usdUrl,              // optional metadata
//       audio_file: audioUrl,          // optional metadata
//       page: window.location.pathname // track page
//     });
//     console.log("[Analytics] Play button clicked");
//   }
//   };

//   const handlePause = () => {
//     if (audio) {
//       audio.pause();
//       audio.currentTime = 0;
//     }
//     setIframeKey(0);
//     setIsPlaying(false);
//   };

//   return (
//     <div className="flex flex-col items-center rounded-lg shadow w-[90vw] max-w-[900px] 
//                 h-[50vh] md:h-[60vh] lg:h-[70vh] p-2 
//                 bg-gray-300 dark:bg-gray-700 relative mx-auto">

//       <div className="relative w-full h-full rounded-md overflow-hidden">
//         {isPlaying && usdUrl && (
//           <iframe
//             key={iframeKey}
//             src={`/index3.html?file=${encodeURIComponent(usdUrl)}`}
//             width="100%"
//             height="100%"
//             frameBorder="0"
//             allowFullScreen
//             className="absolute top-0 left-0 w-full h-full"
//           />
//         )}
//       </div>

//       <div className="mt-2 flex gap-4">
//         {!isPlaying ? (
//           <button
//             onClick={handlePlay}
//             className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 text-sm"
//           >
//             Play
//           </button>
//         ) : (
//           <button
//             onClick={handlePause}
//             className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 text-sm"
//           >
//             Stop
//           </button>
          
//         )}
//       </div>
//     </div>
//   );
// };

// const ChatPage = () => {
//   const router = useRouter();
//   const params = useParams();
//   const searchParams = useSearchParams();
//   const messageId = Array.isArray(params?.id) ? params.id[0] : params?.id;

//   const selectedPoseFile = searchParams ? searchParams.get("usd") : null;
//   let usdUrl: string;
//   let audioUrl: string | undefined;
  
// if (selectedPoseFile) {
//     // ✅ CASE 3: STATIC POSE CLIP (e.g., ?usd=raju_pucker.usd)
//     
//     // The final URL path to the static asset
//     usdUrl = `https://mimichat.space/usd_files/models/${selectedPoseFile}`;
//     
//     // Explicitly set audio to undefined (no audio playback)
//     audioUrl = undefined;
//   } else {

//   usdUrl = `https://mimichat.space/usd_files/cache_${messageId}_cache.usd`;
//  const selectedAudio = searchParams ? searchParams.get("audio") : null;
// ;
//   audioUrl = selectedAudio
//     ? `/audio/downloaded/${selectedAudio}`
//     : `/audio/audio_${messageId}.wav`;
// }

//   const [celebrate, setCelebrate] = useState(false);
//   const [emojis, setEmojis] = useState<{ id: number; left: number; top: number }[]>([]);
//   const [messageData, setMessageData] = useState<any>(null); // 🟢 Added state for message data


//   // ✅ Refresh home for SharedArrayBuffer
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (!window.crossOriginIsolated && !sessionStorage.getItem("reloadedOnce")) {
//       console.warn("Page not cross-origin isolated. Reloading to enable USD SharedArrayBuffer...");
//       sessionStorage.setItem("reloadedOnce", "true");
//       const el = document.createElement("div");
//       el.style.position = "fixed";
//       el.style.top = "0";
//       el.style.left = "0";
//       el.style.width = "100%";
//       el.style.padding = "12px";
//       el.style.textAlign = "center";
//       el.style.backgroundColor = "#fcd34d";
//       el.style.color = "#1f2937";
//       el.style.zIndex = "9999";
//       el.innerText = "Loading environment for 3D avatars to work...";
//       document.body.appendChild(el);
//       window.location.reload();
//     }
//   }, []);

//     // useEffect(() => {
//     //   // Start downloading USD module as soon as home page loads
//     //   preloadUsdModule()
//     //     .then(() => console.log("✅ USD module preloaded"))
//     //     .catch((err) => console.error("❌ Failed to preload USD module:", err));
//     // }, []);
  

//   // 🟢 Fetch Firestore message data
//   useEffect(() => {
//     if (!messageId) return;

//     const fetchMessage = async () => {
//       try {
//         const docRef = doc(db, "shared", messageId);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           setMessageData(docSnap.data());
//         } else {
//           console.warn("No such message found!");
//         }
//       } catch (error) {
//         console.error("Error fetching message:", error);
//       }
//     };

//     fetchMessage();
//   }, [messageId]);

//   const handleLoginClick = () => {
//     setCelebrate(true);

//     // create floating emojis
//     const newEmojis = Array.from({ length: 5 }, (_, i) => ({
//       id: i,
//       left: Math.random() * 100,
//       top: Math.random() * 100,
//     }));
//     setEmojis(newEmojis);

//     setTimeout(() => {
//       router.push("/share");
//     }, 1500);
//   };

//   return (
//     <div className="flex flex-col w-full h-screen bg-gray-100 px-4 relative">
//       {celebrate && <Confetti numberOfPieces={150} recycle={false} />}

//       {celebrate &&
//         emojis.map((e) => (
//           <motion.div
//             key={e.id}
//             className="absolute text-3xl pointer-events-none select-none"
//             style={{ left: `${e.left}%`, top: `${e.top}%` }}
//             animate={{ y: ["0px", "-30px", "0px"], rotate: [0, 15, -15, 0] }}
//             transition={{
//               duration: 2 + Math.random() * 2,
//               repeat: Infinity,
//               delay: Math.random() * 0.5,
//             }}
//           >
//             👾
//           </motion.div>
//         ))}

//       {/* Header */}
//       <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md mb-2">
//         MimiChat
//       </h1>

//       {/* 🟢 Sender name */}
//       {/* {messageData?.senderName && (
//         <p className="text-center text-sm text-gray-600 mb-2">
//           Message from <span className="font-semibold">{messageData.senderName}</span>
//         </p>
//       )} */}

//      {/* Viewers container */}
// <div className="flex justify-center w-full flex-1 overflow-hidden">
//   <div className="w-[90vw] max-w-[900px]">
//     <USDViewer usdUrl={usdUrl} audioUrl={audioUrl} />
//    <p className="text-center text-lg font-bold mt-2">
//   <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
//     Click on
//   </span>{" "}
//   <span className="text-blue-500 animate-bounce">Play</span>{" "}
//   <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
//     to start
//   </span>
// </p>
// <p className="text-center text-xs mt-2 text-red-500 font-medium">
//   ⚠️ First time loading may take a minute — 3D files & engine are downloading.<br />
//   It’ll be much faster next time thanks to caching 🚀
// </p>


//   </div>
// </div>


//       {/* Footer with prompt + login */}
//       {/* Floating Footer */}
// <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 px-4">
//   <div className="max-w-md w-full bg-white rounded-lg shadow-md p-3 flex justify-between items-center">
//     {/* Reply text */}
//     <span className="text-gray-700 text-sm">
//       Reply to <span className="font-semibold">{messageData?.senderName || "..."}</span> with 3D message
//     </span>

//     {/* Login button */}
//     <button
//       onClick={handleLoginClick}
//       className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
//     >
//       yeah →
//     </button>
//   </div>
// </div>

//     </div>
//   );
// };

// export default ChatPage;





"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

import Confetti from "react-confetti";
import { motion } from "framer-motion";

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const messageId = params?.id as string;

  const [messageData, setMessageData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const emojis = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 80,
  }));

  /* ==============================
     FETCH MESSAGE
  ============================== */
  useEffect(() => {
    if (!messageId) return;

    const fetchData = async () => {
      const snap = await getDoc(doc(db, "shared", messageId));
      if (!snap.exists()) return;

      const data = snap.data();
      setMessageData(data);

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3000);
      }
    };

    fetchData();
  }, [messageId]);

  const handleLoginClick = () => {
    router.push("/share");
  };

 return (
  <div className="flex flex-col w-full h-screen bg-gray-100 px-4 relative">
    {/* Header */}
    <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md mb-2">
      MimiChat
    </h1>

    {/* Video Viewer */}
    <div className="flex justify-center w-full flex-1 overflow-hidden">
      <div className="w-full max-w-[900px] px-2">

        <div
          className="
            relative w-full
            aspect-[9/16] sm:aspect-video
            bg-black rounded-lg overflow-hidden
          "
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              👾 Preparing video…
            </div>
          )}
        </div>

      </div>
    </div>

    {/* Floating Footer */}
    <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-3 flex justify-between items-center">
        <span className="text-gray-700 text-sm">
          {/* Reply to{" "}
          <span className="font-semibold">
            {messageData?.senderName || "..."}
          </span>{" "} */}
          {/* with 3D message */}
          Create your own 3d message.
        </span>

        <button
          onClick={handleLoginClick}
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
        >
          yeah →
        </button>
      </div>
    </div>
  </div>
);

}
