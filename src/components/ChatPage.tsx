
"use client";

import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs, getDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/firebase/auth";
import { app } from "@/firebase/config";
import { useRouter } from "next/navigation";

const db = getFirestore(app);

const emotions = [
  "amazement",
  "anger",
  "cheekiness",
  "disgust",
  "fear",
  "grief",
  "joy",
  "outofbreath",
  "pain",
  "sadness",
  // 🆕 Custom mixed/hybrid emotions
  "happy",
  "flirty",
  "romantic",
  "confident",
  "excited",
  "tired",
  "nervous",
];

// 🆕 Emotion to Icon Mapping for the new design
const emotionIcons: Record<string, string> = {
  amazement: "😮",
  anger: "😡",
  cheekiness: "😏",
  disgust: "🤢",
  fear: "😨",
  grief: "😭",
  joy: "😄",
  outofbreath: "🥵",
  pain: "🤕",
  sadness: "😥",
  happy: "😊",
  flirty: "😉",
  romantic: "🥰",
  confident: "😎",
  excited: "🤩",
  tired: "😴",
  nervous: "😬",
};

type ChatMode = "3d" | "text";

interface Message {
  id: string;
  sender: string;
  receiver: string;
  audioUrl?: string;
  usdUrl?: string;
  seen?: boolean;        // has the other person seen this message
  timestamp?: any;       // Firestore timestamp
  // 🆕 ADDED FIELDS
  text?: string | null;       // The typed text content
  emotion?: string;           // The selected emotion (e.g., 'joy')
  avatarModel?: string;       // The selected 3D model (e.g., 'boy2.usd')
  staticShapeKey?: string;
  type?: "3d" | "text";
}


interface USDViewerProps {
  usdUrl: string;
  audioUrl?: string;
  isNewMessage?: boolean;
  seen?: boolean; // only for sent messages
  timestamp?: any; // Firestore timestamp
  isSentMessage?: boolean; // true if message is sent by current user
  receiverOnline?: boolean; // optional, if you track online status
  senderName?: string; 
  emotion?: string;
  avatarModel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const USDViewer: React.FC<USDViewerProps> = ({
  usdUrl,
  audioUrl,
  isNewMessage,
  seen,
  timestamp,
  isSentMessage = false,
  receiverOnline = false,
  senderName,
  emotion,
  avatarModel,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  // ⭐ NEW: REFS FOR PERFECT SYNC
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncRequestRef = useRef<number>(0);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => setIframeReady(true), 200);
      return () => clearTimeout(timer);
    } else {
      setIframeReady(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isNewMessage) {
      setShowNewMessage(true);
      const timer = setTimeout(() => setShowNewMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isNewMessage]);

  useEffect(() => {
    if (!audioUrl) return;
    const newAudio = new Audio(audioUrl);
    
    const handleAudioEnd = () => {
      handlePause();
    };

    newAudio.addEventListener('ended', handleAudioEnd);
    setAudio(newAudio);

    return () => {
      newAudio.pause();
      newAudio.currentTime = 0;
      newAudio.removeEventListener('ended', handleAudioEnd);
    };
  }, [audioUrl]);

  // Play audio after USD loaded
  useEffect(() => {
    const handleUSDLoaded = (event: MessageEvent) => {
      if (event.data?.type === "USD_LOADED" && audio && isPlaying) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
    };
    window.addEventListener("message", handleUSDLoaded);
    return () => window.removeEventListener("message", handleUSDLoaded);
  }, [audio, isPlaying]);

  // ⭐ NEW: CONTINUOUS SYNC LOOP (The "Puppeteer" logic)
  useEffect(() => {
    const syncLoop = () => {
      if (isPlaying && audio && iframeRef.current) {
        // Force the iframe to the exact millisecond of the audio
        iframeRef.current.contentWindow?.postMessage({
          type: 'SYNC_TICK',
          timeMs: audio.currentTime * 1000
        }, "*");
      }
      syncRequestRef.current = requestAnimationFrame(syncLoop);
    };

    if (isPlaying) {
      syncRequestRef.current = requestAnimationFrame(syncLoop);
    }

    return () => {
      if (syncRequestRef.current) cancelAnimationFrame(syncRequestRef.current);
    };
  }, [isPlaying, audio]);

  const handlePlay = () => {
    setIframeKey(prev => prev + 1);
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIframeKey(0);
    setIsPlaying(false);
  };

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const now = new Date();
    
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) {
      return timePart;
    } else {
      const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${datePart}, ${timePart}`;
    }
  };

  return (
    <div className="flex flex-col items-center rounded-lg shadow w-full p-1 h-[calc(52vh-100px)] sm:h-[40vh] md:h-[calc(90vh-100px)] bg-gray-300 dark:bg-gray-700 relative">
      <div className="relative w-full h-full rounded-md overflow-hidden">
        {isPlaying && iframeReady && usdUrl && (
          <iframe
            ref={iframeRef} // ⭐ ADDED REF HERE
            key={iframeKey}
            src={`/index3.html?file=${encodeURIComponent(usdUrl)}&emotion=${encodeURIComponent(emotion || "joy")}&avatarModel=${encodeURIComponent(avatarModel || "boy2.usd")}`}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          onClick={() => { handlePause(); onPrev?.(); }}
          disabled={!hasPrev || isPlaying}
          className={`px-3 py-1 rounded text-xs transition
            ${hasPrev && !isPlaying
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
        >
          ◀
        </button>

        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 text-sm"
          >
            Play
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 text-sm"
          >
            Stop
          </button>
        )}

        <button
          onClick={() => { handlePause(); onNext?.(); }}
          disabled={!hasNext || isPlaying}
          className={`px-3 py-1 rounded text-xs transition
            ${hasNext && !isPlaying
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
        >
          ▶
        </button>
      </div>

      {showNewMessage && (
        <span className="absolute top-0 right-0 -translate-y-1/2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
          New Message
        </span>
      )}

      {(isSentMessage || !isSentMessage) && (
        <div className="absolute bottom-1 right-1 text-xs flex items-center gap-1">
          {isSentMessage ? (
            seen ? (
              <span className="text-blue-500 font-bold">✓✓</span>
            ) : (
              <span className={`text-gray-400 font-bold ${receiverOnline ? "animate-pulse" : ""}`}>✓</span>
            )
          ) : null}
          <span className="text-gray-500 dark:text-gray-300 text-[10px]">{formatTime(timestamp)}</span>
        </div>
      )}

      {senderName && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded text-xs text-white/80 dark:text-gray-200/80">
            <span>{senderName}</span>
          </div>
        )}
    </div>
  );
};

// without loop 
// const USDViewer: React.FC<USDViewerProps> = ({
//   usdUrl,
//   audioUrl,
//   isNewMessage,
//   seen,
//   timestamp,
//   isSentMessage = false,
//   receiverOnline = false,
//   senderName,
//   emotion,
//     // 🆕 navigation
//   onPrev,
//   onNext,
//   hasPrev,
//   hasNext,
// }) => {
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
//   const [iframeKey, setIframeKey] = useState(0);
//   const [showNewMessage, setShowNewMessage] = useState(false);
//   const [iframeReady, setIframeReady] = useState(false);

//   // ... (Delayed iframe render and New Message badge effects remain the same) ...
//   useEffect(() => {
//     if (isPlaying) {
//       const timer = setTimeout(() => setIframeReady(true), 200);
//       return () => clearTimeout(timer);
//     } else {
//       setIframeReady(false);
//     }
//   }, [isPlaying]);

//   useEffect(() => {
//     if (isNewMessage) {
//       setShowNewMessage(true);
//       const timer = setTimeout(() => setShowNewMessage(false), 10000);
//       return () => clearTimeout(timer);
//     }
//   }, [isNewMessage]);


//   // --- MODIFICATION 1: Audio Initialization (Remove loop, add 'ended' listener) ---
//   useEffect(() => {
//     if (!audioUrl) return;
//     const newAudio = new Audio(audioUrl);
//     // newAudio.loop = true; // REMOVED: No more looping!
    
//     const handleAudioEnd = () => {
//       // MODIFICATION 2: Call handlePause when the audio finishes
//       handlePause();
//     };

//     newAudio.addEventListener('ended', handleAudioEnd);

//     setAudio(newAudio);

//     return () => {
//       newAudio.pause();
//       newAudio.currentTime = 0;
//       newAudio.removeEventListener('ended', handleAudioEnd); // Cleanup listener
//     };
//   }, [audioUrl]);
//   // -----------------------------------------------------------------------------------

//   // Play audio after USD loaded
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
//     setIframeKey(prev => prev + 1);
//     setIsPlaying(true);
//   };
  
//   // NOTE: handlePause must be defined before the first useEffect for handleAudioEnd
//   // which is fine since React Functional Components capture the latest function definition
//   // or you could wrap handlePause in a useCallback for better dependency management.
//   // For simplicity, defining it here works.
//   const handlePause = () => {
//     if (audio) {
//       audio.pause();
//       audio.currentTime = 0;
//     }
//     setIframeKey(0);
//     setIsPlaying(false);
//   };

//   // ... (formatTime and return JSX remain the same) ...

//   const formatTime = (ts: any) => {
//     if (!ts) return "";
//     const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
//     const now = new Date();
    
//     // Check if the message was sent today
//     const isToday = date.getDate() === now.getDate() &&
//                      date.getMonth() === now.getMonth() &&
//                      date.getFullYear() === now.getFullYear();

//     const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

//     if (isToday) {
//       // If today, just show the time (e.g., 10:30 AM)
//       return timePart;
//     } else {
//       // If not today, show Month, Day, and Time (e.g., Oct 22, 10:30 AM)
//       const datePart = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
//       return `${datePart}, ${timePart}`;
//     }
//   };

// return (
//   <div className="flex flex-col items-center rounded-lg shadow w-full p-1 h-[calc(52vh-100px)] sm:h-[40vh] md:h-[calc(90vh-100px)] bg-gray-300 dark:bg-gray-700 relative">
//     {/* USD iframe */}
//     <div className="relative w-full h-full rounded-md overflow-hidden">
//       {isPlaying && iframeReady && usdUrl && (
//         <iframe
//           key={iframeKey}
//           src={`/index3.html?file=${encodeURIComponent(usdUrl)}&emotion=${encodeURIComponent(emotion || "joy")}`}
//           width="100%"
//           height="100%"
//           frameBorder="0"
//           allowFullScreen
//           className="absolute top-0 left-0 w-full h-full"
//         />
//       )}
//     </div>

//     {/* Controls: Prev / Play-Stop / Next */}
//     <div className="mt-2 flex items-center justify-center gap-3">
//       {/* Prev */}
//       <button
//         onClick={() => { handlePause(); onPrev?.(); }}
//         disabled={!hasPrev || isPlaying}
//         className={`px-3 py-1 rounded text-xs transition
//           ${hasPrev && !isPlaying
//             ? "bg-blue-500 hover:bg-blue-600 text-white"
//             : "bg-gray-300 text-gray-400 cursor-not-allowed"
//           }`}
//       >
//         ◀
//       </button>


//       {/* Play / Stop */}
//       {!isPlaying ? (
//         <button
//           onClick={handlePlay}
//           className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 text-sm"
//         >
//           Play
//         </button>
//       ) : (
//         <button
//           onClick={handlePause}
//           className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 text-sm"
//         >
//           Stop
//         </button>
//       )}

//       {/* Next */}
//       <button
//         onClick={() => { handlePause(); onNext?.(); }}
//         disabled={!hasNext || isPlaying}
//         className={`px-3 py-1 rounded text-xs transition
//           ${hasNext && !isPlaying
//             ? "bg-blue-500 hover:bg-blue-600 text-white"
//             : "bg-gray-300 text-gray-400 cursor-not-allowed"
//           }`}
//       >
//         ▶
//       </button>

//     </div>

//     {/* New Message Badge */}
//     {showNewMessage && (
//       <span className="absolute top-0 right-0 -translate-y-1/2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full shadow-md animate-pulse">
//         New Message
//       </span>
//     )}

//     {/* Seen / Tick and Timestamp */}
//     {(isSentMessage || !isSentMessage) && (
//       <div className="absolute bottom-1 right-1 text-xs flex items-center gap-1">
//         {isSentMessage ? (
//           seen ? (
//             <span className="text-blue-500 font-bold">✓✓</span>
//           ) : (
//             <span className={`text-gray-400 font-bold ${receiverOnline ? "animate-pulse" : ""}`}>✓</span>
//           )
//         ) : null}
//         <span className="text-gray-500 dark:text-gray-300 text-[10px]">{formatTime(timestamp)}</span>
//       </div>
//     )}

//     {/* Sender Name */}
//     {senderName && (
//         <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded text-xs text-white/80 dark:text-gray-200/80">
//           <span>{senderName}</span>
//         </div>
//       )}
//   </div>
// );


// };


// Mark messages as seen
const markMessagesAsSeen = async (chatId: string, currentUserId: string) => {
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    where("receiver", "==", currentUserId),
    where("seen", "==", false)
  );
  const querySnapshot = await getDocs(q);
  const updatePromises = querySnapshot.docs.map((docSnap) =>
    updateDoc(doc(db, "messages", docSnap.id), { seen: true })
  );
  await Promise.all(updatePromises);
};




// Add this definition near the top of the file, before ChatPage component

interface AvatarOption {
  name: string;
  file: string; // The actual .usd file name (e.g., "xy.usd")
}

const avatarModels: Record<string, AvatarOption[]> = {
  male: [
    { name: "Raju", file: "boy2.usd" },
    // { name: "Male Face (john without teeth)", file: "male_face.usd" }, // Adjust name for clarity
    { name: "funny guy", file: "ishowspeed.usd" },
    { name: "batman", file: "batman.usd" },
    // { name: "Male Avatar 1 (XY)", file: "xy.usd" }, // <--- New Model 1
    // <--- New Model 2
  ],
  female: [
    { name: "pinki", file: "girl.usd" },
    // { name: "Girl with Hairs (Default)", file: "girlwithhairs.usd" }, // Adjust name for clarity
  ],
};

const modelShapeKeyMap: Record<string, string[]> = {
  // 1. Male Avatar 2 (Raju) - uses the current combined list (Raju's default)
  "boy2.usd": [
    "None",
    "Pucker",
    "happy",
    "hungry",
    "surprised",
    "Disguist",
    "Angry",
  ], // 2. Female Avatar (Pinki) - Add her specific list here
  "girl.usd": ["None", "Angry", "crying", "happy", "Pucker", "surprised"], // Example Shape Keys for Pinki
};

// Main ChatPage component
export default function ChatPage({ userId }: { userId: string }) {
  const router = useRouter();
  const currentUser = auth.currentUser;
  const [chatMode, setChatMode] = useState<"3d" | "text">("3d");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState("male");
  const [selectedEmotion, setSelectedEmotion] = useState("joy");
  const [showOptions, setShowOptions] = useState(false);
  const [latestSentMessage, setLatestSentMessage] = useState<Message | null>(
    null
  );
  const [latestReceivedMessage, setLatestReceivedMessage] =
    useState<Message | null>(null);
  const [senderName, setSenderName] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioList, setAudioList] = useState<string[]>([]);
  const [otherUserStatus, setOtherUserStatus] = useState<{
    online: boolean;
    lastSeen?: any;
  } | null>(null);
  const [otherUsername, setOtherUsername] = useState<string>("A Friend"); // <-- Use empty string or null initially
  const [selectedModel, setSelectedModel] = useState(
    avatarModels["male"][0].file
  ); // Initialize with the default file name: "xy.usd"
  const [availableStaticShapeKeys, setAvailableStaticShapeKeys] = useState<
    string[]
  >(modelShapeKeyMap[avatarModels["male"][0].file] || ["None"]);
  const [selectedStaticShapeKey, setSelectedStaticShapeKey] = useState("None");
  const [hasUnreadText, setHasUnreadText] = useState(false);
  const [hasUnread3d, setHasUnread3d] = useState(false);


  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [sentIndex, setSentIndex] = useState(0);

  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [receivedIndex, setReceivedIndex] = useState(0);

   // Ref for autoscrolling in text chat mode
    const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSentMessage =
  sentMessages.length > 0 ? sentMessages[sentIndex] : null;

const currentReceivedMessage =
  receivedMessages.length > 0 ? receivedMessages[receivedIndex] : null;

  const goPrevSent = () => {
  setSentIndex(i => Math.max(0, i - 1));
};

const goNextSent = () => {
  setSentIndex(i => Math.min(sentMessages.length - 1, i + 1));
};


const goPrevReceived = () => {
  setReceivedIndex(i => Math.max(0, i - 1));
};

const goNextReceived = () => {
  setReceivedIndex(i => Math.min(receivedMessages.length - 1, i + 1));
};

const openTextChat = async () => {
  // setChatMode("text");
  setHasUnreadText(false);

  if (!chatId || !currentUser) return;

  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    where("receiver", "==", currentUser.uid),
    where("type", "==", "text"),
    where("seen", "==", false)
  );

  const snap = await getDocs(q);

  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, "messages", d.id), { seen: true })
  );

  await Promise.all(updates);
};

// Helper function to mark ALL unseen 3D messages for the current user in this chat
const mark3DMessagesAsSeen = async () => {
    if (!chatId || !currentUser) return;

    const q = query(
        collection(db, "messages"),
        where("chatId", "==", chatId),
        where("receiver", "==", currentUser.uid),
        where("type", "==", "3d"), // <-- Filter for 3D messages
        where("seen", "==", false)
    );

    const snap = await getDocs(q);

    const updates = snap.docs.map((d) =>
        updateDoc(doc(db, "messages", d.id), { seen: true })
    );

    await Promise.all(updates);
    console.log(`[Seen Status] Marked ${snap.docs.length} 3D messages as seen.`);
};




// 🚀 FINAL FIX: Correctly handles model change cleanup without interfering with user selection.
useEffect(() => {
  const modelFile = selectedModel;
  
  // 1. Load the model-specific keys
  const newKeys = modelShapeKeyMap[modelFile] || ["None"];
  setAvailableStaticShapeKeys(newKeys);
  
  // 2. Perform cleanup ONLY IF the previously selected key is NOT in the new list.
  // This handles switching from boy (Angry) to girl (no Angry).
  if (!newKeys.includes(selectedStaticShapeKey)) {
    // Reset the selected key to "None" if the previous key is no longer valid.
    setSelectedStaticShapeKey("None"); 
  }

    console.log(
      `[ShapeKey Update] Model switched to ${modelFile}. Available keys:`,
      newKeys
    );

    // Dependency Array: Only needs 'selectedModel'.
    // It does NOT need selectedStaticShapeKey, as that would cause a loop/reset issue.
  }, [selectedModel]);

  // --- NEW EFFECT TO FETCH OTHER USER'S NAME ---
  useEffect(() => {
    const fetchOtherUserName = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          // Use the actual username, or "A Friend" as a fallback
          setOtherUsername(userDoc.data().username || "A Friend");
        } else {
          setOtherUsername("A Friend"); // If user document doesn't exist
        }
      } catch (err) {
        console.error("Error fetching other user's name:", err);
        setOtherUsername("A Friend");
      }
    };
    fetchOtherUserName();
  }, [userId]);
  // --------------------------

  // Fetch audio files
  useEffect(() => {
    fetch("/api/list-audios")
      .then((res) => res.json())
      .then(setAudioList)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!userId || !currentUser) return;

    const fetchExistingChat = async () => {
      try {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        let existingChatId: string | null = null;
        querySnapshot.forEach((docSnap) => {
          const participants: string[] = docSnap.data().participants;
          if (participants.includes(userId)) {
            existingChatId = docSnap.id;
          }
        });

        // ❌ REMOVE THE CHAT CREATION LOGIC HERE:
        /*
        if (!existingChatId) {
          const newChatRef = await addDoc(collection(db, "chats"), {
            participants: [currentUser.uid, userId],
            createdAt: new Date(),
          });
          existingChatId = newChatRef.id;
        }
        */

        setChatId(existingChatId);
      } catch (err) {
        console.error("Error fetching chat:", err);
      }
    };

    fetchExistingChat(); // Renamed function for clarity
  }, [userId, currentUser]);


// New User/Chat Reset Logic
useEffect(() => {
  // If no chat ID exists (meaning we are viewing a brand new contact profile)
  // and the user is logged in, force a reset of the message arrays.
  if (currentUser && chatId === null) {
    console.log("ChatPage: Forcing indexed avatar state reset for New User Mode.");
    
    // Clear the arrays and reset the indices
    setSentMessages([]);
    setSentIndex(0);
    setReceivedMessages([]);
    setReceivedIndex(0);
  }
}, [chatId, currentUser]);

// 🔥 HARD RESET when switching user on desktop
useEffect(() => {
  console.log("Switching user → resetting TEXT chat state");

  setMessages([]);            // ❗ THIS is the missing piece
  setHasUnreadText(false);

  // Optional but recommended
  setChatMode("3d");          // prevents ghost text mode
}, [userId]);


  // Message Subscription useEffect (Only runs for existing chats)
  useEffect(() => {
    // GUARD: If no chatId exists (new user) or no user is logged in, exit.
    if (!chatId || !currentUser) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);

    // Filter messages for the two main viewers
    const sent = msgs.filter(m => m.sender === currentUser.uid && m.usdUrl);
    const received = msgs.filter(m => m.sender !== currentUser.uid && m.usdUrl);

    setSentMessages(prev => {
    if (prev.length !== sent.length) {
      setSentIndex(sent.length - 1);
    }
    return sent;
  });

  setReceivedMessages(prev => {
    if (prev.length !== received.length) {
      setReceivedIndex(received.length - 1);
    }
    return received;
  });



      // 1. Latest Sent Message (Your avatar's viewer)
      if (sent.length > 0) {
        setLatestSentMessage({
          ...sent[sent.length - 1],
          usdUrl: sent[sent.length - 1].usdUrl?.replace("http://", "https://"),
        });
      } else {
        setLatestSentMessage(null); // <-- Reset to null if no sent messages
      }

      // 2. Latest Received Message (Other user's avatar's viewer)
      if (received.length > 0) {
        setLatestReceivedMessage({
          ...received[received.length - 1],
          usdUrl: received[received.length - 1].usdUrl?.replace(
            "http://",
            "https://"
          ),
        });
      } else {
        setLatestReceivedMessage(null); // <-- Reset to null if no received messages
      }
    });

  return () => unsubscribe();
}, [chatId, currentUser]);

// ✅ STEP 1: Auto-mark TEXT messages as seen when already in text mode
useEffect(() => {
  if (!chatId || !currentUser) return;
  if (chatMode !== "text") return;

  const hasUnseenText = messages.some(
    m =>
      m.type === "text" &&
      m.receiver === currentUser.uid &&
      m.seen === false
  );

  if (hasUnseenText) {
    openTextChat();
  }
}, [messages, chatMode, chatId, currentUser]);



 // Autoscroll to latest message in text chat mode
  useEffect(() => {
    if (chatMode === "text" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMode]);



 // Mark messages as seen for BOTH Text and 3D mode


 // 🚀 COMBINED UNREAD STATUS CHECKER
useEffect(() => {
    if (!currentUser) return;
    
    let unseenText = false;
    let unseen3d = false;

    // Iterate through all messages only once
    messages.forEach(msg => {
        // Skip messages sent by the current user
        if (msg.sender === currentUser.uid || msg.seen === true) {
            return;
        }

        // Check for unseen messages from the other user
        if (msg.type === "text") {
            unseenText = true;
        } else if (msg.type === "3d") {
            unseen3d = true;
        }
    });

    // Update state based on the calculated flags
    setHasUnreadText(unseenText);
    setHasUnread3d(unseen3d);
    
    // Note: We don't check chatMode here, we calculate the status always.
    // The UI handles conditional rendering based on chatMode.
}, [messages, currentUser]); // Only depends on messages list changing

 // ✅ STEP 2: Mark 3D messages as seen ONLY in 3D mode
useEffect(() => {
  if (!chatId || !currentUser) return;
  if (chatMode !== "3d") return;

  mark3DMessagesAsSeen();
}, [receivedMessages.length, chatMode, chatId, currentUser]);




  // Fetch sender name
  useEffect(() => {
    const fetchSenderName = async () => {
      if (latestReceivedMessage?.sender) {
        const userDoc = await getDoc(
          doc(db, "users", latestReceivedMessage.sender)
        );
        setSenderName(
          userDoc.exists() ? userDoc.data().username || "Unknown" : "Unknown"
        );
      }
    };
    fetchSenderName();
  }, [latestReceivedMessage]);

  // Subscribe to other user online/offline status
  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        let lastSeenDate: Date | null = null;

        if (data.lastSeen) {
          // Firestore Timestamp
          if (data.lastSeen.seconds) {
            lastSeenDate = new Date(data.lastSeen.seconds * 1000);
          } else {
            // Already JS Date or string
            const d = new Date(data.lastSeen);
            if (!isNaN(d.getTime())) lastSeenDate = d;
          }
        }

        setOtherUserStatus({
          online: data.online || false,
          lastSeen: lastSeenDate,
        });
      }
    });

    return () => unsub();
  }, [userId]);

  // Autoscroll to latest message in text chat mode
  useEffect(() => {
    if (chatMode === "text" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMode]);

  // Send message
  const sendMessage = async () => {
    // Use !chatId for the first message, but also check for other conditions
    if (!currentUser || loading) return;

    // 🔑 STEP 0A: Check for static pose
    const isStaticPose =
      selectedStaticShapeKey && selectedStaticShapeKey !== "None";

    // 🔑 STEP 0B: VALIDATION: Message is valid if (text OR audio OR static pose)
    if (!message.trim() && !selectedAudio && !isStaticPose) {
      alert(
        "Please enter a message, select pre-recorded audio, or select a face pose."
      );
      return;
    }

    setLoading(true);
    try {
      // 🔑 STEP 1: FIND OR CREATE CHAT ID
      let currentChatId = chatId;
      if (!currentChatId) {
        // 🚀 CREATE the new chat document now
        const newChatRef = await addDoc(collection(db, "chats"), {
          participants: [currentUser.uid, userId],
          createdAt: new Date(),
        });
        currentChatId = newChatRef.id;
        // Update state so subsequent messages don't try to create a new chat
        setChatId(currentChatId);
      }

      // Now use `currentChatId` for all Firebase operations

    // 🔑 STEP 2: Define the server timestamp once
    const timestamp = serverTimestamp();
    // Use a description if no text, based on the media type
    const messageText = message.trim() || (isStaticPose ? "Sent a 3D pose clip" : (selectedAudio ? "Sent a voice message" : "Sent a 3D message")); 

     const messageType = chatMode === "text" ? "text" : "3d";

    // 🔑 STEP 3: Write the new message to 'messages'
    const docRef = await addDoc(collection(db, "messages"), {
      chatId: currentChatId, 
      sender: currentUser.uid,
      receiver: userId,
      timestamp: timestamp, 
      seen: false,
      // text: messageText, // Save the actual typed text (or null)
      emotion: selectedEmotion,      // Save the selected emotion
      avatarModel: selectedModel,    // Save the selected 3D model file name
      staticShapeKey: selectedStaticShapeKey, // Save the static pose key
      type: messageType,
      text: messageType === "text" ? message.trim() : null,
      // ------------------------------------
  
    });

    // 🔑 STEP 4: DENORMALIZE - Update the 'chats' document
    const chatDocRef = doc(db, "chats", currentChatId); 
    await updateDoc(chatDocRef, {
      lastMessageText: messageText, 
      lastMessageTimestamp: timestamp, 
    });

    if (chatMode === "text") {
        setMessage("");
        setLoading(false);
        return;
      }


      // 🔑 STEP 5: Determine final text/null to send to A2F/TTS
      // If a static pose is selected, the message text should be ignored
      // to prevent unnecessary TTS/A2F processing for dynamic content.
      const finalMessageText = isStaticPose ? null : message.trim() || null;

      // 🔑 STEP 6: Continue with Audio2Face generation
      await generateAudioAndLipSync(
        finalMessageText, // Controlled text/null
        docRef.id,
        selectedGender,
        selectedEmotion,
        selectedModel, // Pass selectedModel
        selectedStaticShapeKey, // Pass selectedStaticShapeKey
        selectedAudio
      );

      // 🔑 STEP 7: Cleanup
      setMessage("");
      setSelectedAudio(null);
      setSelectedStaticShapeKey("None"); // Reset the static key after sending
    } catch (err) {
      console.error("Error sending message or creating chat:", err);
      alert("Error sending message.");
      setLoading(false);
    }
    // Note: setLoading(false) is primarily handled inside generateAudioAndLipSync's finally block,
    // which is better as it waits for the full processing chain.
  };

  // Define the emotion map (ensure this is accessible)
  const EMOTION_MAP: Record<string, string> = {
    amazement: "Conversational",
    cheekiness: "Calm",
    fear: "sad",
    calmness: "Calm",
    sadness: "Sad",
    grief: "Sad",
    pain: "sad",
    anger: "Angry",
    outofbreath: "Conversational",
    joy: "Conversational",
    happy: "Conversational",
    flirty: "Calm",
    romantic: "Calm",
    confident: "Conversational",
    excited: "Conversational",
    tired: "Calm",
    nervous: "sad",
  };

  // Audio + Lip sync
  const generateAudioAndLipSync = async (
    text: string | null,
    messageId: string,
    gender: string,
    setemotion: string,
    selectedModel: string, // 🆕 New Parameter
    selectedStaticShapeKey: string, // 🆕 New Parameter
    audioFile?: string | null
  ) => {
    if (!currentUser) return;

    // 🔑 Step 0: Check for Static Pose and determine final USD/Audio plan
    const isStaticPose =
      selectedStaticShapeKey && selectedStaticShapeKey !== "None";

    // Map user-selected emotion to Murf style
    const murfEmotion =
      EMOTION_MAP[setemotion.toLowerCase()] || "Conversational";

    let finalAudioUrl: string | null = null;
    let finalUsdFileUrl: string = "";

    try {
      // --- A. Dynamic (Text/Audio) Flow: TTS/Pre-recorded + Audio2Face ---
      if (!isStaticPose) {
        let audioFilePath = "";
        let directoryAudio = "";

        if (audioFile) {
          audioFilePath = `/audio/downloaded/${audioFile}`;
          directoryAudio = "D:/chat-avatar-app/public/audio/downloaded";
        } else if (text) {
          // 🔊 Generate TTS using mapped emotion
          const ttsResponse = await fetch("/api/next", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              messageId,
              gender,
              setemotion: murfEmotion,
              avatarModel: selectedModel,
            }),
          });
          const ttsData = await ttsResponse.json();
          audioFilePath = ttsData.audioPath;
          directoryAudio = "D:/chat-avatar-app/public/audio";
        }

        // 🧠 Run Audio2Face
        const a2fResponse = await fetch("/api/audio2face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioFilePath,
            outputDir: "D:/chat-avatar-app/public/usd_files",
            messageId,
            emotion: setemotion, // Use the original user emotion for A2F
            staticShapeKey: "None",
            gender,
            model: selectedModel,
            directoryAudio,
          }),
        });

        const a2fData = await a2fResponse.json();
        if (!a2fData.success)
          throw new Error("something went wrong, try again.");

        // Set final URLs for Dynamic Flow
        finalUsdFileUrl = `https://mimichat.space/usd_files/cache_${messageId}_cache.usd`;
        finalAudioUrl = audioFile
          ? `/audio/downloaded/${audioFile}`
          : `/audio/audio_${messageId}.wav`;
      }

      // --- B. Static Pose Flow: Skip TTS/A2F, use pre-animated USD clip ---
      else {
        const baseModelName = selectedModel.replace(".usd", ""); // e.g., "raju"
        const shapeKeyName = selectedStaticShapeKey; // e.g., "pucker"

        // Construct the file name: modelname_expression.usd
        const animatedPoseFile = `${baseModelName}_${shapeKeyName}.usd`;

        // Set final URLs for Static Pose Flow
        finalUsdFileUrl = `https://mimichat.space/usd_files/models/${animatedPoseFile}`;
        finalAudioUrl = null; // Set audio to null
      }

      // 🔑 Final Firestore Update
      await updateDoc(doc(db, "messages", messageId), {
        audioUrl: finalAudioUrl,
        usdUrl: finalUsdFileUrl,
      });
    } catch (err) {
      console.error("Lip sync error:", err);
      alert("something went wrong, try again.");
      // Re-throw or handle error to ensure external logging/feedback is possible
      throw err;
    } finally {
      // Ensures loading state is reset after processing completes (success or fail)
      setLoading(false);
    }
  };

  // --- FIX: Formats the last seen time for display ---
  const formatLastSeen = (lastSeen: Date | undefined) => {
    if (!lastSeen) return "";
    const time = lastSeen.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = lastSeen.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    const now = new Date();
    const isToday =
      lastSeen.getDate() === now.getDate() &&
      lastSeen.getMonth() === now.getMonth() &&
      lastSeen.getFullYear() === now.getFullYear();

    return `Last seen ${isToday ? "today" : date} at ${time}`;
  };
  // ---------------------------------------------------

  // 🆕 Emotion Picker Component (using the emotionIcons map)
  const EmotionPicker = () => (
    <div className="grid grid-cols-5 gap-2 p-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      {emotions.map((emotion) => (
        <button
          key={emotion}
          title={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          onClick={() => setSelectedEmotion(emotion)}
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all text-xs
            ${
              selectedEmotion === emotion
                ? "bg-blue-500 text-white shadow-lg scale-105"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white"
            }`}
        >
          <span className="text-xl">{emotionIcons[emotion] || "❓"}</span>
          <span className="mt-1 hidden sm:inline">
            {emotion.charAt(0).toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );

  const TextBubble = ({
    text,
    isMe,
    timestamp,
    seen,
  }: {
    text: string;
    isMe: boolean;
    timestamp?: any;
    seen?: boolean;
  }) => {
    const formatTime = (ts: any) => {
      if (!ts) return "";
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div
        className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-2`}
      >
        <div
          className={`max-w-[75%] sm:max-w-[60%] px-4 py-2 rounded-2xl shadow-sm ${
            isMe
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          }`}
        >
          <p className="text-sm sm:text-base break-words whitespace-pre-wrap">
            {text}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span
              className={`text-[10px] ${
                isMe ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formatTime(timestamp)}
            </span>
            {isMe && (
              <span className="text-xs ml-1">
                {seen ? (
                  <span className="text-blue-200">✓✓</span>
                ) : (
                  <span className="text-blue-300">✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };


 return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100 dark:bg-gray-900">
          {/* H1 and mobile top bar */}

    {/* H1 and mobile top bar - STICKY HEADER */}
<div className="
  relative w-full px-3 pt-1 md:hidden 
  sticky top-0 z-40 
  bg-gray-100 dark:bg-gray-900
  pb-2
  border-b border-gray-200/50 dark:border-gray-800/50
  shadow-sm
">
  {/* Top Row: Back button, Logo, and Chat buttons */}
  <div className="flex items-center justify-between">
    {/* Left side: Back button and Logo */}
    <div className="flex items-center gap-3">
      {/* Back Button - Match MimiChat height */}
      <button
        onClick={() => router.push("/home")}
        className="flex items-center justify-center h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors px-2"
        title="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-700 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>
      
      {/* Logo */}
      <div className="flex flex-col">
        <h1 className="font-pacifico text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
          MimiChat
        </h1>
        
        {/* Status right below logo */}
        {otherUserStatus && (
          <p
            className={`text-xs dark:text-gray-300 mt-0.5 ${
              otherUserStatus.online ? "text-green-500 font-medium" : "text-gray-500"
            }`}
          >
            {otherUserStatus.online
              ? "Online"
              : otherUserStatus.lastSeen
              ? formatLastSeen(otherUserStatus.lastSeen)
              : "Offline"}
          </p>
        )}
      </div>
    </div>

    {/* Right side: 3D/Text Chat Buttons */}
    <div className="flex gap-2">
      <button
        onClick={() => setChatMode("3d")}
        className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
          chatMode === "3d" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
        }`}
        title="3D Chat"
      >
        🧑‍🦱
        {hasUnread3d && chatMode !== "3d" && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        )}
      </button>

      <button
        onClick={() => setChatMode("text")}
        className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
          chatMode === "text"
            ? "bg-green-500 text-white"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
        title="Text Chat"
      >
        💬
        {hasUnreadText && chatMode !== "text" && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        )}
      </button>
    </div>
  </div>
</div>


    {/* H1 left-aligned for desktop */}

    {/* Old buttons hidden on mobile */}
    <div className="hidden md:flex justify-center gap-2 mb-2">
      <div className="hidden md:flex justify-center gap-2 mb-2">
    <button
      onClick={() => setChatMode("3d")}
      className={`relative px-4 py-1 rounded-full text-sm ${ // ✨ ADDED 'relative' HERE
        chatMode === "3d"
          ? "bg-blue-500 text-white"
          : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      🧑‍🦱 3D Chat
      {hasUnread3d && chatMode !== "3d" && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
      )}
    </button>
</div>

      {/* text */}

      <button
        onClick={() => {
          setChatMode("text"); // instantly changes button color
          // openTextChat();       // async logic runs after
        }}
        className={`relative px-4 py-1 rounded-full text-sm transition-colors ${
          chatMode === "text"
            ? "bg-green-500 text-white"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        💬 Text Chat

        {hasUnreadText && chatMode !== "text" && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        )}
      </button>




    </div>

      <div
        className="
        flex-1 w-full
        overflow-y-auto
        px-2 pt-3
        md:grid md:grid-cols-2 md:gap-6
        max-w-6xl mx-auto
      "
      >
        {chatMode === "3d" && !currentSentMessage && !currentReceivedMessage && (
          <div className="flex flex-col items-center justify-center mt-8 md:col-span-2">
            <div className="text-6xl mb-4 animate-bounce">🎭</div>
            <h2 className="text-xl sm:text-2xl font-bold text-center text-blue-500 dark:text-blue-400 mb-4 flex items-center justify-center gap-2 flex-wrap whitespace-normal px-4">
              ✨{" "}
              <span className="text-purple-600 dark:text-purple-400">Send</span>{" "}
              Your First Message to&nbsp;
              <span className="text-blue-400 dark:text-blue-300">
                {otherUsername || "A Friend"}
              </span>
              ! ✨
            </h2>
            <ul className="space-y-3 text-left text-gray-700 dark:text-gray-300 max-w-md px-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">1️⃣</span>
                <p className="text-sm sm:text-base">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Type a message
                  </span>{" "}
                  into the input field below.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">2️⃣</span>
                <p className="text-sm sm:text-base">
                  Tap the{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    + button
                  </span>{" "}
                  to choose a{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Gender
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Emotion
                  </span>{" "}
                  for your avatar. (Default: Male, Joy)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">3️⃣</span>
                <p className="text-sm sm:text-base">
                  Hit the{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    Send button
                  </span>
                  ! Your avatar message will be sent.
                </p>
              </li>
            </ul>
            <p className="mt-5 text-center text-sm font-semibold text-purple-500 dark:text-purple-400 px-4">
              Ready to make your message come alive? Start typing now! 👇
            </p>
          </div>
        )}
        {chatMode === "text" &&
          messages.filter((m) => m.type === "text").length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12 md:col-span-2 px-4">
              <div className="text-6xl mb-4 animate-bounce">💬</div>
              <h2 className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">
                Start Chatting with {otherUsername || "A Friend"}!
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-md">
                Type your message below to begin the conversation 🚀
              </p>
            </div>
          )}
        {chatMode === "text" && (
          <div className="flex flex-col gap-1 md:col-span-2 pb-4 max-w-4xl mx-auto w-full">
            {messages
              .filter((msg) => msg.type === "text" && msg.text)
              .map((msg) => (
                <TextBubble
                  key={msg.id}
                  text={msg.text!}
                  isMe={msg.sender === currentUser?.uid}
                  timestamp={msg.timestamp}
                  seen={msg.seen}
                />
              ))}
            {/* Invisible div for autoscrolling */}
            <div ref={messagesEndRef} />
          </div>
        )}

        {chatMode === "3d" && (
          <>
            {currentReceivedMessage && (
            <div className="mb-2">
              <USDViewer
                usdUrl={currentReceivedMessage.usdUrl!}
                audioUrl={currentReceivedMessage.audioUrl}
                timestamp={currentReceivedMessage.timestamp}
                senderName={senderName}
                emotion={currentReceivedMessage.emotion}
                avatarModel={currentReceivedMessage.avatarModel}
                onPrev={goPrevReceived}
                onNext={goNextReceived}
                hasPrev={receivedIndex > 0}
                hasNext={receivedIndex < receivedMessages.length - 1}
              />
            </div>
          )}

          {currentSentMessage && (
            <div className="mb-4">
              <USDViewer
                usdUrl={currentSentMessage.usdUrl!}
                audioUrl={currentSentMessage.audioUrl}
                timestamp={currentSentMessage.timestamp}
                seen={currentSentMessage.seen}
                isSentMessage
                senderName="You"
                emotion={currentSentMessage.emotion}
                avatarModel={currentSentMessage.avatarModel}
                onPrev={goPrevSent}
                onNext={goNextSent}
                hasPrev={sentIndex > 0}
                hasNext={sentIndex < sentMessages.length - 1}
              />
            </div>
          )}

          </>
        )}
      </div>
      {/* Modern floating input bar */}
      <div className="sticky bottom-0 w-full bg-transparent px-4 pb-4">
        <div className="max-w-2xl mx-auto w-full relative">
          <div className="flex items-center gap-3 px-4 py-2 sm:py-3 rounded-3xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-md shadow-lg w-full transition-all">
            {/* Text input */}
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!!selectedAudio}
              className="flex-1 outline-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-transparent h-10 text-sm sm:text-base"
            />

            {/* Plus icon button */}
            {chatMode === "3d" && (
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 dark:hover:bg-gray-700/50 transition-transform duration-200 transform hover:scale-105"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-black dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
            
            {/* Send button */}
            <button
              onClick={sendMessage}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } transition-transform duration-200 transform hover:scale-105 relative`}
              disabled={loading}
            >
              {loading ? (
                // START: NEW ANIMATED LOADING CONTENT
                <div className="flex items-center justify-center w-full h-full">
                  <svg
                    className="animate-spin h-5 w-5 text-white/80"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {/* Small "Creating" text appearing above the button */}
                  <span className="absolute bottom-full mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full shadow-md animate-pulse">
                    Creating...
                  </span>
                </div>
              ) : (
                // END: NEW ANIMATED LOADING CONTENT
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
            </button>
          </div>
          {showOptions && (
            <div
              className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-sm border rounded-2xl shadow-xl p-4
                          bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm z-50 transition-opacity duration-300"
            >
              <div className="flex flex-col gap-3">
                {/* Gender Select */}
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Select Gender:
                </div>
                <select
                  className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
                  value={selectedGender}
                  onChange={(e) => {
                    const newGender = e.target.value;
                    setSelectedGender(newGender);
                    // 🆕 Reset model to the default for the newly selected gender
                    setSelectedModel(avatarModels[newGender][0].file);
                  }}
                >
                  <option value="male">🧑 Male</option>
                  <option value="female">👧 Female</option>
                </select>

                {/* 🆕 NEW AVATAR MODEL SELECT */}
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                  Select Avatar Model:
                </div>
                <select
                  className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {/* Filter models based on the current gender */}
                  {avatarModels[selectedGender].map((model) => (
                    <option key={model.file} value={model.file}>
                      {model.name}
                    </option>
                  ))}
                </select>

                {/* 🆕 Fixed & Dynamic Static Shape Key Dropdown - MAX COMPRESSION */}
                {/* <div className="flex flex-col w-full">
                  
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center">
                    emotes only:
                    
                    {selectedStaticShapeKey !== "None" && (
                      <span className="text-blue-500 font-normal text-xs bg-blue-100 p-1 rounded">
                        🗿 Static Pose Active
                      </span>
                    )}
                    {selectedStaticShapeKey === "None" &&
                      availableStaticShapeKeys.length === 1 && (
                        <span className="text-red-500 font-normal text-xs bg-red-100 p-1 rounded">
                          🚫 No Poses for Model
                        </span>
                      )}
                  </div>

                  <select
                    className="border px-3 py-1 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
                    value={selectedStaticShapeKey}
                    // 💡 Dynamic disabling logic: Disable if text or audio is present
                    disabled={!!selectedAudio || message.length > 0}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      setSelectedStaticShapeKey(newKey);
                      // If a static key is selected, reset the A2F emotion picker to Joy as a visual cue
                      if (newKey !== "None") {
                        setSelectedEmotion("joy");
                      }
                    }}
                  >
                  
                    {availableStaticShapeKeys.map((key) => (
                      <option key={key} value={key}>
                        {key === "None" ? "Select Emotes" : `🗿 Static: ${key}`}
                      </option>
                    ))}
                  </select>
                </div> */}


                {/* Emotion Picker (New Design) - CONDITIONAL RENDERING */}
                {selectedStaticShapeKey === "None" ? (
                  <>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                      Select Emotion:{" "}
                      <span className="text-blue-500 font-normal">
                        ({selectedEmotion})
                      </span>
                    </div>
                    <EmotionPicker />
                  </>
                ) : (
                  <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                    * Text is **DISABLED** because a Static Pose (
                    {selectedStaticShapeKey}) is selected.
                  </div>
                )}

                {/* Audio Select */}
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                  Select Pre-recorded Audio:
                </div>
                <select
                  className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
                  value={selectedAudio || ""}
                  onChange={(e) => setSelectedAudio(e.target.value || null)}
                >
                  <option value="">🎙️ Use Text-to-Speech (TTS)</option>
                  {audioList.map((file) => (
                    <option key={file} value={file}>
                      🎶 {file.replace(/\.[^/.]+$/, "")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );


}

