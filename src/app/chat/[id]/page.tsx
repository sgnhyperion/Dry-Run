
// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import {
//   getFirestore,
//   collection,
//   addDoc,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   updateDoc,
//   doc,
//   getDocs,
//   getDoc
// } from "firebase/firestore";
// import { auth } from "@/firebase/auth";
// import { app } from "@/firebase/config";


// const db = getFirestore(app);
// const emotions = [
//   "amazement",
//   "anger",
//   "cheekiness",
//   "disgust",
//   "fear",
//   "grief",
//   "joy",
//   "outofbreath",
//   "pain",
//   "sadness",
// ];
// interface Message {
//   id: string;
//   sender: string;
//   receiver: string;
//   audioUrl?: string;
//   usdUrl?: string;
// }

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
//   <div className="flex flex-col items-center bg-gray-900 rounded-lg shadow w-full max-w-md p-2 h-[calc(50vh-100px)]">
//   <div className="relative w-full h-full rounded-md overflow-hidden">
//     {isPlaying && usdUrl && (
//       <iframe
//         key={iframeKey}
//         src={`/index3.html?file=${encodeURIComponent(usdUrl)}`}
//         width="100%"
//         height="100%"
//         frameBorder="0"
//         allowFullScreen
//         className="absolute top-0 left-0 w-full h-full"
//       />
//     )}
//   </div>

//   <div className="mt-2 flex gap-4">
//     {!isPlaying ? (
//       <button
//         onClick={handlePlay}
//         className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 text-sm"
//       >
//         Play
//       </button>
//     ) : (
//       <button
//         onClick={handlePause}
//         className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 text-sm"
//       >
//         Stop
//       </button>
//     )}
//   </div>
// </div>

// );

// };

// const markMessagesAsSeen = async (chatId: string, currentUserId: string) => {
//   const q = query(
//     collection(db, "messages"),
//     where("chatId", "==", chatId),
//     where("receiver", "==", currentUserId),
//     where("seen", "==", false)
//   );

//   const querySnapshot = await getDocs(q);
//   const updatePromises = querySnapshot.docs.map((docSnap) =>
//     updateDoc(doc(db, "messages", docSnap.id), { seen: true })
//   );

//   await Promise.all(updatePromises);
// };

// const ChatPage = () => {
//   // const router = useRouter();
//   const params = useParams();
//   const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
//   const currentUser = auth.currentUser;

//   const [, setMessages] = useState<Message[]>([]);
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [chatId, setChatId] = useState<string | null>(null);
//   const [selectedGender, setSelectedGender] = useState("male");
//   const [selectedEmotion, setSelectedEmotion] = useState("joy");
//   const [showOptions, setShowOptions] = useState(false);
//   // const toggleOptions = () => setShowOptions(!showOptions);


//   const [latestSentMessage, setLatestSentMessage] = useState<Message | null>(null);
//   const [latestReceivedMessage, setLatestReceivedMessage] = useState<Message | null>(null);
//   const [senderName, setSenderName] = useState<string>("");
//   const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
//   const [audioList, setAudioList] = useState<string[]>([]);

 


//   useEffect(() => {
//     const fetchSenderName = async () => {
//       if (latestReceivedMessage?.sender) {
//         const userDoc = await getDoc(doc(db, "users", latestReceivedMessage.sender));
//         if (userDoc.exists()) {
//           setSenderName(userDoc.data().username || "Unknown");
//         } else {
//           setSenderName("Unknown");
//         }
//       }
//     };

//   fetchSenderName();
// }, [latestReceivedMessage]);

//   useEffect(() => {
//     if (!userId || !currentUser) return;

//     const fetchOrCreateChat = async () => {
//       try {
//         const q = query(
//           collection(db, "chats"),
//           where("participants", "array-contains", currentUser.uid)
//         );
//         const querySnapshot = await getDocs(q);

//         let existingChatId: string | null = null;

//         querySnapshot.forEach((docSnap) => {
//           const participants: string[] = docSnap.data().participants;
//           if (participants.includes(userId)) {
//             existingChatId = docSnap.id;
//           }
//         });

//         if (!existingChatId) {
//           const newChatRef = await addDoc(collection(db, "chats"), {
//             participants: [currentUser.uid, userId],
//             createdAt: new Date(),
//           });
//           existingChatId = newChatRef.id;
//         }

//         setChatId(existingChatId);

//         const messagesQuery = query(
//           collection(db, "messages"),
//           where("chatId", "==", existingChatId),
//           orderBy("timestamp", "asc")
//         );

//         const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
//           const msgs = querySnapshot.docs.map((doc) => ({
//             id: doc.id,
//             ...doc.data(),
//           })) as Message[];

//           setMessages(msgs);

//           const sent = msgs.filter(m => m.sender === currentUser.uid && m.usdUrl);
//           const received = msgs.filter(m => m.sender !== currentUser.uid && m.usdUrl);

//           // if (sent.length > 0) setLatestSentMessage(sent[sent.length - 1]);
//           // if (received.length > 0) setLatestReceivedMessage(received[received.length - 1]);
//           if (sent.length > 0) {
//             const lastSent = sent[sent.length - 1];
//             lastSent.usdUrl = lastSent.usdUrl?.replace("http://", "https://");
//             setLatestSentMessage(lastSent);
//           }
//           if (received.length > 0) {
//             const lastReceived = received[received.length - 1];
//             lastReceived.usdUrl = lastReceived.usdUrl?.replace("http://", "https://");
//             setLatestReceivedMessage(lastReceived);
//           }

//         });

//         return () => unsubscribe();
//       } catch (err) {
//         console.error("Error in chat setup:", err);
//       }
//     };

//     fetchOrCreateChat();
//   }, [userId, currentUser]);

// // for updating seen
//   useEffect(() => {
//   if (chatId && currentUser?.uid) {
//     markMessagesAsSeen(chatId, currentUser.uid);
//   }
// }, [chatId, currentUser?.uid]);

// // fetch audio from download
//   useEffect(() => {
//     fetch("/api/list-audios")
//       .then(res => res.json())
//       .then(setAudioList)
//       .catch(console.error);
//   }, []);

// // send message

//   // const sendMessage = async () => {
//   //   if (!message.trim() || !currentUser || loading || !chatId) return;

//   //   setLoading(true);

//   //   try {
//   //     const docRef = await addDoc(collection(db, "messages"), {
//   //       chatId,
//   //       sender: currentUser.uid,
//   //       receiver: userId,
//   //       timestamp: new Date(),
//   //       seen: false,
//   //     });

//   //     await generateAudioAndLipSync(message, docRef.id, selectedGender);
//   //     setMessage("");
//   //   } catch (err) {
//   //     console.error("Send error:", err);
//   //     alert("Error sending message.");
//   //     setLoading(false); // re-enable if failed early
//   //   } 
//   //   // finally {
//   //   //   setLoading(false);
//   //   // }
//   // };

//   const sendMessage = async () => {
//     if (!currentUser || loading) return;
  
//     // If no text AND no audio chosen → block
//     if (!message.trim() && !selectedAudio) return;
  
//     setLoading(true);
  
//      try {
//       const docRef = await addDoc(collection(db, "messages"), {
//         chatId,
//         sender: currentUser.uid,
//         receiver: userId,
//         timestamp: new Date(),
//         seen: false,
//       });

  
//       if (selectedAudio) {
//         // skip TTS, go direct to audio2face
//         await generateAudioAndLipSync(null, docRef.id, selectedGender, selectedAudio);
//       } else {
//         await generateAudioAndLipSync(message, docRef.id, selectedGender, null);
//       }
  
//       setMessage("");
//       setSelectedAudio(null);
//     } catch (err) {
//       console.error(err);
//       alert("Error sending message.");
//       setLoading(false);
//     }
//   };


//   // const generateAudioAndLipSync = async (text: string, messageId: string, gender: string) => {
//   //   try {
//   //     const ttsResponse = await fetch("/api/next", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ text, messageId, gender }),
//   //     });
//   //     const ttsData = await ttsResponse.json();
//   //     const audioFilePath = ttsData.audioPath;
//   //     console.log(audioFilePath);

//   //     const a2fResponse = await fetch("/api/audio2face", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         audioFilePath,
//   //         outputDir: "D:/chat-avatar-app/public/usd_files",
//   //         messageId,
//   //         emotion: selectedEmotion,
//   //         gender
//   //       }),
//   //     });

//   //     const a2fData = await a2fResponse.json();
//   //     console.log(a2fData)
//   //     if (!a2fData.success) throw new Error("Audio2Face failed");

//   const generateAudioAndLipSync = async (
//   text: string | null,
//   messageId: string,
//   gender: string,
//   audioFile?: string | null
// ) => {
//   if (!currentUser) return;

//   try {
//     let audioFilePath = "";
//     let directoryAudio = "";

//     if (audioFile) {
//       // Pre-downloaded audio path
//       audioFilePath = `/audio/downloaded/${audioFile}`;
//       directoryAudio = "D:/chat-avatar-app/public/audio/downloaded";
//     } else if (text) {
//       // Generate via TTS
//       const ttsResponse = await fetch("/api/next", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, messageId, gender }),
//       });
//       const ttsData = await ttsResponse.json();
//       audioFilePath = ttsData.audioPath;
//       directoryAudio = "D:/chat-avatar-app/public/audio";
//     }

//     console.log(directoryAudio);

//     const a2fResponse = await fetch("/api/audio2face", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         audioFilePath,
//         outputDir: "D:/chat-avatar-app/public/usd_files",
//         messageId,
//         emotion: selectedEmotion,
//         gender,
//         directoryAudio,
//       }),
//     });

//     const a2fData = await a2fResponse.json();
//     if (!a2fData.success) throw new Error("Audio2Face failed");
 
//       const usdFileUrl = `https://mimichat.space/usd_files/cache_${messageId}_cache.usd`;

//       // await updateDoc(doc(db, "messages", messageId), {
//       //   audioUrl: `/audio/audio_${messageId}.wav`,
//       //   usdUrl: usdFileUrl,
//       // });
//       let audioUrl: string;
//       if (audioFile) {
//         // For preloaded audios
//         audioUrl = `/audio/downloaded/${audioFile}`;
//       } else {
//         // For TTS-generated audios
//         audioUrl = `/audio/audio_${messageId}.wav`;
//       }

//       await updateDoc(doc(db, "messages", messageId), {
//         audioUrl,
//         usdUrl: usdFileUrl,
//       });
//     } catch (err) {
//       console.error("Lip sync error:", err);
//       alert("Animation processing failed.");
//     }finally {
//     // ✅ re-enable send button here
//     setLoading(false);
//   }
//   };

// return (
//   <div className="flex flex-col items-center w-full h-screen bg-gray-100 px-2">
//     {/* Header */}
//     <h2 className="text-xl font-bold my-2 text-black">MimiChat</h2>

//     {/* Viewers container */}
//     <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-hidden">
//       {/* 👉 Show this only if no messages exist */}
//       {!latestSentMessage && !latestReceivedMessage && (
//         <div className="text-center text-gray-500 mt-4 text-sm">
//           No message found. Send the first message using cool avatars! 😎
//         </div>
//       )}
//       {latestReceivedMessage && (
//         <div className="w-full max-w-md">
//           <p className="text-center text-sm text-gray-600">{senderName || "Unknown"}</p>
//           <USDViewer
//             usdUrl={latestReceivedMessage.usdUrl!}
//             audioUrl={latestReceivedMessage.audioUrl}
//           />
//         </div>
//       )}

//       {latestSentMessage && (
//         <div className="w-full max-w-md">
//           <p className="text-center text-sm text-gray-600">You</p>
//           <USDViewer
//             usdUrl={latestSentMessage.usdUrl!}
//             audioUrl={latestSentMessage.audioUrl}
//           />
//         </div>
//       )}
//     </div>

//     {/* Input section fixed at bottom */}
//     <div className="w-full bg-white border-t shadow-md z-50 p-3">
//       <div className="max-w-2xl mx-auto w-full relative">
//         <div className="flex items-center gap-2 border px-3 py-2 rounded-md">
//           <input
//             type="text"
//             placeholder="Type your message..."
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             disabled={!!selectedAudio}
//             className="flex-1 outline-none text-black"
//           />
//           <button onClick={() => setShowOptions(!showOptions)}>⚙️</button>
//           <button
//             onClick={sendMessage}
//             className={`ml-1 px-3 py-1 rounded-md text-sm text-white 
//               ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
//             disabled={loading}
//           >
//             {loading ? "⏳" : "✈️"}
//           </button>

//         </div>

//         {showOptions && (
//           <div className="absolute bottom-14 left-0 w-full bg-white border rounded-md shadow-lg p-3 z-50">
//             <div className="flex flex-col gap-3">
//               <select
//                 className="border px-3 py-2 rounded-md text-black"
//                 value={selectedGender}
//                 onChange={(e) => setSelectedGender(e.target.value)}
//               >
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//               </select>
//               <select
//                 className="border px-3 py-2 rounded-md text-black"
//                 value={selectedEmotion}
//                 onChange={(e) => setSelectedEmotion(e.target.value)}
//               >
//                 {emotions.map((emotion) => (
//                   <option key={emotion} value={emotion}>
//                     {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
//                   </option>
//                 ))}
//               </select>
//               <select
//                   className="border px-3 py-2 rounded-md text-black"
//                   value={selectedAudio || ""}
//                   onChange={e => setSelectedAudio(e.target.value || null)}
//                 >
//                   <option value="">not selected</option>
//                   {audioList.map(file => (
//                     <option key={file} value={file}>
//                       {file.replace(/\.[^/.]+$/, "")} {/* remove extension for cleaner look */}
//                     </option>
//                   ))}
//               </select>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );



// };

// export default ChatPage;

// "use client";

// import { useParams } from "next/navigation";
// import ChatPage from "@/components/ChatPage";

// export default function ChatIdPage() {
//   const params = useParams();
//   const userId =
//     params && typeof params.id === "string"
//       ? params.id
//       : Array.isArray(params?.id)
//       ? params.id[0]
//       : "";

//   if (!userId) return null; // optional fallback while params load

//   return <ChatPage userId={userId} />;
// }

"use client";

import { useParams } from "next/navigation";
import ChatPage from "@/components/ChatPage";

export default function ChatIdPage() {
  const params = useParams();
  const userId =
    params && typeof params.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  if (!userId) return null;

  // 🎯 THE FIX: Use the dynamic userId as the key.
  // When the key changes, React is forced to re-mount the component, 
  // resetting all the internal states of ChatPage.
  return <ChatPage key={userId} userId={userId} />;
}