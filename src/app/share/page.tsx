
// "use client";

// import { useEffect, useState } from "react";
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
//   getDoc,
// } from "firebase/firestore";
// import { auth } from "@/firebase/auth";
// import { app } from "@/firebase/config";
// import { analytics, logEvent } from "@/firebase/config";

// const db = getFirestore(app);
// const emotions = [
//   "amazement", "anger", "cheekiness", "disgust", "fear", "grief", "joy",
//   "outofbreath", "pain", "sadness",
//   // 🆕 Custom mixed/hybrid emotions
//   "happy",
//   "flirty",
//   "romantic",
//   "confident",
//   "excited",
//   "tired",
//   "nervous",
// ];

// // 🆕 Emotion to Icon Mapping for the new design
// const emotionIcons: Record<string, string> = {
//   amazement: "😮",
//   anger: "😡",
//   cheekiness: "😏",
//   disgust: "🤢",
//   fear: "😨",
//   grief: "😭",
//   joy: "😄",
//   outofbreath: "🥵",
//   pain: "🤕",
//   sadness: "😥",
//   happy: "😊",
//   flirty: "😉",
//   romantic: "🥰",
//   confident: "😎",
//   excited: "🤩",
//   tired: "😴",
//   nervous: "😬",
// };


// interface Message {
//   id: string;
//   sender: string;
//   receiver?: string;
//   audioUrl?: string | null;
//   usdUrl?: string;
//   shareUrl?: string;
//   // 🔑 ADDED: New saved fields
//   text?: string;
//   emotion?: string;
//   avatarModel?: string;
//   staticShapeKey?: string;
// }

// // ✅ Helper for guest users
// function getGuestId() {
//   if (typeof window === "undefined") return "guest_temp";
//   let id = localStorage.getItem("guest_id");
//   if (!id) {
//     id = "guest_" + Math.random().toString(36).substring(2, 10);
//     localStorage.setItem("guest_id", id);
//   }
//   return id;
// }

// const USDViewer: React.FC<{ usdUrl: string; audioUrl?: string; emotion?: string }> = ({ usdUrl, audioUrl, emotion }) => {
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
//      <div className="flex flex-col items-center rounded-lg shadow w-full p-1 h-[calc(52vh-100px)] sm:h-[40vh] md:h-[calc(90vh-100px)] bg-gray-300 dark:bg-gray-700 relative">
//       <div className="relative w-full h-full rounded-md overflow-hidden">
//         {isPlaying && usdUrl && (
//           <iframe
//             key={iframeKey}
//             src={`/index3.html?file=${encodeURIComponent(usdUrl)}&emotion=${encodeURIComponent(emotion || "joy")}`}
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

// // Add this definition near the top of the file, before ChatPage component

// interface AvatarOption {
//   name: string;
//   file: string; // The actual .usd file name (e.g., "xy.usd")
// }

// const avatarModels: Record<string, AvatarOption[]> = {
//   male: [
//     { name: "Male Avatar 2 (Raju)", file: "boy2.usd" }, 
//     { name: "Male Face (john without teeth)", file: "male_face.usd" }, // Adjust name for clarity
//     // { name: "Male Avatar 1 (XY)", file: "xy.usd" }, // <--- New Model 1
//     // <--- New Model 2
//   ],
//   female: [
//     { name: "pinki (pinki)", file: "girl.usd" },
//     { name: "Girl with Hairs (Default)", file: "girlwithhairs.usd" }, // Adjust name for clarity
    
//     // { name: "Female Avatar 2", file: "female_avatar_2.usd" }, 
//   ],
// };
// // const usdShapeKeys = [ "None", "Pucker", "happy", "hungry", "surprised", "Disgust", ];
// // New definition: Maps avatar file names to their available shape key lists
// const modelShapeKeyMap: Record<string, string[]> = {
//   // 1. Male Avatar 2 (Raju) - uses the current combined list (Raju's default)
//   "boy2.usd": ["None", "Pucker", "happy", "hungry", "surprised", "Disgust", "Angry"],
//   
//   // 2. Female Avatar (Pinki) - Add her specific list here
//   "girl.usd": ["None", "Angry", "crying", "happy", "Pucker", "surprised"], // Example Shape Keys for Pinki
//   
// };

// const ChatPage = () => {
//   const [currentUser, setCurrentUser] = useState(auth.currentUser);
//   const [, setMessages] = useState<Message[]>([]);
//   const [latestSentMessage, setLatestSentMessage] = useState<Message | null>(null);
//   const [shareUrl, setShareUrl] = useState<string | null>(null);
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [selectedGender, setSelectedGender] = useState("male");
//   const [selectedEmotion, setSelectedEmotion] = useState("joy");
//   const [showOptions, setShowOptions] = useState(false);
//   const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
//   const [audioList, setAudioList] = useState<string[]>([]);
//   const [selectedModel, setSelectedModel] = useState(avatarModels["male"][0].file); // Initialize with the default file name: "xy.usd"
//   // const [selectedStaticShapeKey, setSelectedStaticShapeKey] = useState(usdShapeKeys[0]);
//   const [availableStaticShapeKeys, setAvailableStaticShapeKeys] = useState<string[]>(
//   modelShapeKeyMap[avatarModels["male"][0].file] || ["None"]
// ); 
// const [selectedStaticShapeKey, setSelectedStaticShapeKey] = useState("None");



// // 🚀 FINAL FIX: Correctly handles model change cleanup without interfering with user selection.
// useEffect(() => {
//   const modelFile = selectedModel;
//   
//   // 1. Load the model-specific keys
//   const newKeys = modelShapeKeyMap[modelFile] || ["None"];
//   setAvailableStaticShapeKeys(newKeys);
//   
//   // 2. Perform cleanup ONLY IF the previously selected key is NOT in the new list.
//   // This handles switching from boy (Angry) to girl (no Angry).
//   if (!newKeys.includes(selectedStaticShapeKey)) {
//     // Reset the selected key to "None" if the previous key is no longer valid.
//     setSelectedStaticShapeKey("None"); 
//   }

//   console.log(`[ShapeKey Update] Model switched to ${modelFile}. Available keys:`, newKeys);

// // Dependency Array: Only needs 'selectedModel'. 
// // It does NOT need selectedStaticShapeKey, as that would cause a loop/reset issue.
// }, [selectedModel]);

//   //   // ✅ Refresh home for SharedArrayBuffer
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

//   // listen for auth changes
//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
//     return () => unsubscribe();
//   }, []);

//   // fetch messages
//   useEffect(() => {
//     const senderId = currentUser ? currentUser.uid : getGuestId();

//     const messagesQuery = query(
//       collection(db, "shared"),
//       where("sender", "==", senderId),
//       orderBy("timestamp", "asc")
//     );

//     const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
//       const msgs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Message));
//       setMessages(msgs);

//       const sent = msgs.filter((m) => m.sender === senderId && m.usdUrl);
//       if (sent.length > 0) {
//         const lastSent = sent[sent.length - 1];
//         lastSent.usdUrl = lastSent.usdUrl?.replace("http://", "https://");
//         setLatestSentMessage(lastSent);
//         setShareUrl(lastSent.shareUrl || null);
//       }
//     });

//     return () => unsubscribe();
//   }, [currentUser]);

//   // fetch audio list
//   useEffect(() => {
//     fetch("/api/list-audios")
//       .then((res) => res.json())
//       .then(setAudioList)
//       .catch(console.error);
//   }, []);

//   // Add this inside the ChatPage component, with your other useEffects:

// // useEffect(() => {
// //   // If the currently selected model is NOT "boy2.usd" and a static key is somehow selected, 
// //   // reset the static key to "None" to prevent bad API calls.
// //   if (selectedModel !== "boy2.usd" && selectedStaticShapeKey !== "None") {
// //     console.log(`[Cleanup] Model ${selectedModel} selected. Resetting static shape key.`);
// //     setSelectedStaticShapeKey("None");
// //   }
// // }, [selectedModel, selectedStaticShapeKey]); // Dependencies: runs when model or static key changes

//   // const sendMessage = async () => {
//   //   if (loading) return;
//   //   if (!message.trim() && !selectedAudio) return;

//   //   setLoading(true);

//   //   const senderId = currentUser ? currentUser.uid : getGuestId();
//   //   let userData = {};

//   //   if (currentUser) {
//   //     const userDoc = await getDoc(doc(db, "users", currentUser.uid));
//   //     userData = userDoc.exists() ? userDoc.data() : {};
//   //   }

//   //   try {
//   //     const docRef = await addDoc(collection(db, "shared"), {
//   //       sender: senderId,
//   //       senderName: currentUser
//   //         ? (userData as any).username || `User${Math.floor(Math.random() * 10000)}`
//   //         : `Guest${Math.floor(Math.random() * 10000)}`,
//   //       timestamp: new Date(),
//   //       guest: !currentUser,
//   //     });

//   //     if (selectedAudio) {
//   //       await generateAudioAndLipSync(null, docRef.id, selectedGender, selectedAudio, senderId);
//   //     } else {
//   //       await generateAudioAndLipSync(message, docRef.id, selectedGender, null, senderId);
//   //     }

//   //     setMessage("");
//   //     setSelectedAudio(null);
//   //     // ✅ Log message_sent event here, **inside the try block** so docRef is available
//   //     if (analytics) {
//   //       logEvent(analytics, "message_sent_from_share", {
//   //         message_id: docRef.id,
//   //         sender: senderId,
//   //         page: window.location.pathname,
//   //         has_audio: !!selectedAudio,
//   //         text_length: message ? message.length : 0,
//   //       });
//   //       console.log("[Analytics] message_sent_from_share:", docRef.id);
//   //     }
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert("Error sending message.");
//   //     setLoading(false);
//   //   }
//   // };

//   // const generateAudioAndLipSync = async (
//   //   text: string | null,
//   //   messageId: string,
//   //   gender: string,
//   //   audioFile?: string | null,
//   //   senderId?: string
//   // ) => {
//   //   try {
//   //     // ✅ Proper emotion mapping
//   //     const EMOTION_MAP: Record<string, string> = {
//   //       amazement: "Conversational",
//   //       anger: "Angry",
//   //       cheekiness: "Calm",
//   //       disgust: "Sad",
//   //       fear: "Sad",
//   //       grief: "Sad",
//   //       joy: "Conversational",
//   //       outofbreath: "Conversational",
//   //       pain: "Sad",
//   //       sadness: "Sad",
//   //       happy: "Conversational",
//   //       flirty: "Calm",
//   //       romantic: "Calm",
//   //       confident: "Conversational",
//   //       excited: "Conversational",
//   //       tired: "Calm",
//   //       nervous: "Sad",
//   //     };

//   //     // 🎯 Mapped emotion for TTS (Murf) and raw emotion for Audio2Face
//   //     const ttsEmotion = EMOTION_MAP[selectedEmotion.toLowerCase()] || "Conversational";
//   //     const a2fEmotion = selectedEmotion;

//   //     let audioFilePath = "";
//   //     let directoryAudio = "";

//   //     if (audioFile) {
//   //       // Use selected pre-downloaded audio file
//   //       audioFilePath = `/audio/downloaded/${audioFile}`;
//   //       directoryAudio = "D:/chat-avatar-app/public/audio/downloaded";
//   //     } else if (text) {
//   //       // 🔊 Generate TTS using mapped emotion
//   //       const ttsResponse = await fetch("/api/next", {
//   //         method: "POST",
//   //         headers: { "Content-Type": "application/json" },
//   //         body: JSON.stringify({ text, messageId, gender, emotion: ttsEmotion }),
//   //       });

//   //       const ttsData = await ttsResponse.json();
//   //       audioFilePath = ttsData.audioPath;
//   //       directoryAudio = "D:/chat-avatar-app/public/audio";
//   //     }

//   //     // 🧠 Generate USD animation using the same audio
//   //     const a2fResponse = await fetch("/api/audio2face", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({
//   //         audioFilePath,
//   //         outputDir: "D:/chat-avatar-app/public/usd_files",
//   //         messageId,
//   //         emotion: a2fEmotion, // Raw emotion goes here
//   //         gender,
//   //         model: selectedModel, // e.g., "xy.usd" or "raju.usd"
//   //         directoryAudio,
//   //       }),
//   //     });

//   //     const a2fData = await a2fResponse.json();
//   //     if (!a2fData.success) throw new Error("Audio2Face failed");

//   //     // ✅ Build final URLs
//   //     const usdFileUrl = `https://mimichat.space/usd_files/cache_${messageId}_cache.usd`;
//   //     const audioUrl = audioFile
//   //       ? audioFilePath
//   //       : `/audio/audio_${messageId}.wav`;

//   //     const newShareUrl = audioFile
//   //       ? `https://mimichat.space/view/${messageId}?audio=${audioFile}`
//   //       : `https://mimichat.space/view/${messageId}`;

//   //     // 🗂️ Update Firestore document with generated paths
//   //     await updateDoc(doc(db, "shared", messageId), {
//   //       audioUrl,
//   //       usdUrl: usdFileUrl,
//   //       shareUrl: newShareUrl,
//   //     });

//   //     // 🆕 Update frontend states
//   //     setLatestSentMessage({
//   //       id: messageId,
//   //       sender: senderId || getGuestId(),
//   //       audioUrl,
//   //       usdUrl: usdFileUrl,
//   //     });
//   //     setShareUrl(newShareUrl);
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert("Animation processing failed.");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // Replace the existing sendMessage function with this:
//   const sendMessage = async () => {
//       // 1. Get current state values
//       const textMessage = message.trim();
//       const isStaticPose = selectedStaticShapeKey !== "None";
      
//       // 2. Initial Validation: Check for a valid submission
//       // It is valid if: (Text is present OR Audio is selected OR a Static Pose is selected)
//       if (loading) return;
//       if (!textMessage && !selectedAudio && !isStaticPose) {
//           alert("Please enter a message, select pre-recorded audio, or select a static face pose.");
//           return;
//       }

//       setLoading(true);

//       const senderId = currentUser ? currentUser.uid : getGuestId();
//       let userData = {};

//       if (currentUser) {
//           const userDoc = await getDoc(doc(db, "users", currentUser.uid));
//           userData = userDoc.exists() ? userDoc.data() : {};
//       }

//                 // 3. Determine the final text to send to A2F/TTS
//           // If a static pose is selected, the message text should be ignored 
//           // to prevent unnecessary TTS/A2F processing for dynamic content.
//       const finalMessageText = isStaticPose ? null : (textMessage || null);

//       try {
//           const docRef = await addDoc(collection(db, "shared"), {
//               sender: senderId,
//               senderName: currentUser
//                   ? (userData as any).username || `User${Math.floor(Math.random() * 10000)}`
//                   : `Guest${Math.floor(Math.random() * 10000)}`,
//               timestamp: new Date(),
//               guest: !currentUser,
//               emotion: selectedEmotion,      // Save the selected emotion
//               avatarModel: selectedModel,    // Save the selected 3D model file name
//               staticShapeKey: selectedStaticShapeKey, // Already there, but ensures completeness
//               text: finalMessageText || "Sent a 3D message", // Save the final text/description
              
//           });


          
          
//           // 4. Call A2F/LipSync function
//           await generateAudioAndLipSync(
//               finalMessageText, // Pass the controlled text/null value
//               docRef.id, 
//               selectedGender, 
//               selectedAudio, 
//               senderId
//           );

//           // 5. Cleanup
//           setMessage("");
//           setSelectedAudio(null);
//           setSelectedStaticShapeKey("None"); // Optionally reset the static key after sending

//           // ✅ Log message_sent event here, **inside the try block** so docRef is available
//           if (analytics) {
//               logEvent(analytics, "message_sent_from_share", {
//                   message_id: docRef.id,
//                   sender: senderId,
//                   page: window.location.pathname,
//                   has_audio: !!selectedAudio,
//                   text_length: finalMessageText ? finalMessageText.length : 0,
//                   is_static_pose: isStaticPose,
//               });
//               console.log("[Analytics] message_sent_from_share:", docRef.id);
//           }
//       } catch (err) {
//           console.error(err);
//           alert("Error sending message.");
//           setLoading(false);
//       }
//   };
//   const generateAudioAndLipSync = async (
//     text: string | null,
//     messageId: string,
//     gender: string,
//     audioFile?: string | null,
//     senderId?: string
//   ) => {
//     // These states (selectedEmotion, selectedModel, selectedStaticShapeKey) 
//     // must be accessible in the scope where this function is defined.
//     const isStaticPose = selectedStaticShapeKey && selectedStaticShapeKey !== "None";

//     try {
//       // ✅ Proper emotion mapping for TTS (Murf)
//       const EMOTION_MAP: Record<string, string> = {
//         amazement: "Conversational", anger: "Angry", cheekiness: "Calm", disgust: "Sad", fear: "Sad",
//         grief: "Sad", joy: "Conversational", outofbreath: "Conversational", pain: "Sad", sadness: "Sad",
//         happy: "Conversational", flirty: "Calm", romantic: "Calm", confident: "Conversational",
//         excited: "Conversational", tired: "Calm", nervous: "Sad",
//       };

//       const ttsEmotion = EMOTION_MAP[selectedEmotion.toLowerCase()] || "Conversational";
      
//       let audioFilePath = "";
//       let directoryAudio = "";

//       // --- 1. Audio Generation (TTS or Pre-recorded) ---
//       if (audioFile) {
//         audioFilePath = `/audio/downloaded/${audioFile}`;
//         directoryAudio = "D:/chat-avatar-app/public/audio/downloaded";
//       } else if (text) {
//         // 🔊 Generate TTS using mapped emotion
//         const ttsResponse = await fetch("/api/next", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ text, messageId, gender, emotion: ttsEmotion }),
//         });

//         const ttsData = await ttsResponse.json();
//         audioFilePath = ttsData.audioPath;
//         directoryAudio = "D:/chat-avatar-app/public/audio";
//       }

//       // --- 2. Conditional USD Generation ---
//       let usdFileName = null;
//       let shapeKeyName = null;
//       let usdFileUrl = "";

//       // if (isStaticPose) {
//       //     // 💡 STATIC POSE: Skip Audio2Face call. Use the base model URL.
          
//       //     const baseModelFile = selectedModel; // e.g., "boy2.usd"
//       //     shapeKeyName = selectedStaticShapeKey;
          
//       //     // The USD file URL points to the base model, and the static key is appended 
//       //     // as a query parameter for the viewer to read.
//       //     usdFileUrl = `https://mimichat.space/usd_files/models/${baseModelFile}?staticKey=${shapeKeyName}`; 
//       if (isStaticPose) {
//     // 💡 ANIMATED POSE (Single Clip): Skip Audio2Face call. Use the pose-specific USD file.
    
//     const baseModelName = selectedModel.replace('.usd', ''); // e.g., "raju"
//     shapeKeyName = selectedStaticShapeKey; // e.g., "pucker"
    
//     // 🆕 MODIFICATION: Construct the file name using the pattern: modelname_expression.usd
//     const animatedPoseFile = `${baseModelName}_${shapeKeyName}.usd`; 
    
//     // The USD file URL now points directly to the pre-animated file.
//     usdFileUrl = `https://mimichat.space/usd_files/models/${animatedPoseFile}`; 
    
//     // Example output for raju + pucker:
//     // usdFileUrl will be: https://mimichat.space/usd_files/models/raju_pucker.usd
          
//       } else {
//           // 💡 DYNAMIC POSE: Run Audio2Face to generate lipsync animation.
          
//           const a2fEmotion = selectedEmotion;

//           // 🧠 Generate USD animation
//           const a2fResponse = await fetch("/api/audio2face", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               audioFilePath,
//               outputDir: "D:/chat-avatar-app/public/usd_files",
//               messageId,
//               emotion: a2fEmotion,
//               staticShapeKey: "None", // Explicitly ensure no static pose is applied by A2F
//               gender,
//               model: selectedModel,
//               directoryAudio,
//             }),
//           });

//           const a2fData = await a2fResponse.json();
//           if (!a2fData.success) throw new Error("Audio2Face failed");
          
//           // Audio2Face returns a new cached USD file name
//           usdFileName = `cache_${messageId}_cache.usd`;
//           shapeKeyName = null;
          
//           // Build the final dynamic USD URL
//           usdFileUrl = `https://mimichat.space/usd_files/${usdFileName}`;
//       }
      
//       // --- 3. Build Final Audio URL and Update Firestore ---
      

//       // Initial audioUrl and newShareUrl are set here (your existing code):
// const audioUrl = audioFile
//     ? audioFilePath
//     : `/audio/audio_${messageId}.wav`;

// const newShareUrl = audioFile
//     ? `https://mimichat.space/view/${messageId}?audio=${audioFile}`
//     : `https://mimichat.space/view/${messageId}`;
// // -----------------------------------------------------------------

// // 🛑 SIMPLE OVERRIDE BLOCK: Use 'let' to redefine or reassign the variables
// let finalAudioUrl: string | null = audioUrl;
// let finalNewShareUrl: string = newShareUrl;
// let finalUsdFileUrl: string = usdFileUrl; // Assuming this holds the base model URL

// if (isStaticPose) {
//     const baseModelName = selectedModel.replace('.usd', '');
//     const shapeKeyName = selectedStaticShapeKey;
//     const animatedPoseFile = `${baseModelName}_${shapeKeyName}.usd`; 
    
//     // Override the final URLs for the pose clip
//     finalUsdFileUrl = `https://mimichat.space/usd_files/models/${animatedPoseFile}`; 
//     finalAudioUrl = null; // Set to null
//     finalNewShareUrl = `https://mimichat.space/view/${messageId}?usd=${animatedPoseFile}`;
// }

// // -----------------------------------------------------------------
// // ⬇️ NOW, use the 'final' variables in your updateDoc and setShareUrl calls:

// await updateDoc(doc(db, "shared", messageId), {
//     audioUrl: finalAudioUrl, // Use finalAudioUrl
//     usdUrl: finalUsdFileUrl,
//     shareUrl: finalNewShareUrl, // Use finalNewShareUrl
//     // ...
// });

// setLatestSentMessage({
//      id: messageId,
//     sender: senderId || getGuestId(),
//     audioUrl: finalAudioUrl, // Use finalAudioUrl
//     usdUrl: finalUsdFileUrl,
// });
// setShareUrl(finalNewShareUrl); // Use finalNewShareUrl
      
//       // const audioUrl = audioFile
//       //   ? audioFilePath
//       //   : `/audio/audio_${messageId}.wav`;

//       // const newShareUrl = audioFile
//       //   ? `https://mimichat.space/view/${messageId}?audio=${audioFile}`
//       //   : `https://mimichat.space/view/${messageId}`;

//       // // 🗂️ Update Firestore document with generated paths
//       // await updateDoc(doc(db, "shared", messageId), {
//       //   audioUrl,
//       //   usdUrl: usdFileUrl,
//       //   shareUrl: newShareUrl,
//       //   // Save the shape key name (will be null for dynamic poses)
//       //   staticShapeKey: shapeKeyName, 
//       // });

//       // // 🆕 Update frontend states
//       // setLatestSentMessage({
//       //   id: messageId,
//       //   sender: senderId || getGuestId(),
//       //   audioUrl,
//       //   usdUrl: usdFileUrl,
//       // });
//       // setShareUrl(newShareUrl);

//     } catch (err) {
//       console.error(err);
//       alert("Animation processing failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🆕 Emotion Picker Component (using the emotionIcons map)
//   const EmotionPicker = () => (
//     <div className="grid grid-cols-5 gap-2 p-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
//       {emotions.map((emotion) => (
//         <button
//           key={emotion}
//           title={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
//           onClick={() => setSelectedEmotion(emotion)}
//           className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all text-xs
//             ${selectedEmotion === emotion
//               ? "bg-blue-500 text-white shadow-lg scale-105"
//               : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white"
//             }`}
//         >
//           <span className="text-xl">{emotionIcons[emotion] || '❓'}</span>
//           <span className="mt-1 hidden sm:inline">{emotion.charAt(0).toUpperCase()}</span>
//         </button>
//       ))}
//     </div>
//   );


//   return (
//     <div className="flex flex-col items-start w-full h-screen bg-gray-100 px-4">
//       <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
//         MimiChat
//       </h1>
//       {!currentUser && (
//         <div className="w-full max-w-md mx-auto mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center p-3 rounded-lg shadow-md">
//           <p className="text-sm md:text-base font-medium">
//             🔒 Login to get full access!
//           </p>
//           <button
//             onClick={() => window.location.href = "/login"}
//             className="mt-2 px-4 py-1 bg-white text-purple-600 font-semibold rounded-full shadow hover:bg-gray-100 text-sm"
//           >
//             Login
//           </button>
//         </div>
//       )}

//       <p className="self-center text-sm flex items-center gap-1 animate-bounce text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-1">
//         👾 Loading the 3D experience might take a moment for new users — thanks for your patience!
//       </p>

//       {/* <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-hidden mt-4">
//         {!latestSentMessage && (
//           <div className="text-center text-gray-500 mt-4 text-sm"></div>
//         )}

//         {latestSentMessage && (
//           <div className="w-full max-w-md flex flex-col items-center mt-2">
//             <USDViewer
//               usdUrl={latestSentMessage.usdUrl!}
//               audioUrl={latestSentMessage.audioUrl}
//             />
//             {shareUrl && (
//               <div className="mt-2 flex items-center gap-2 w-full">
//                 <input
//                   type="text"
//                   readOnly
//                   value={shareUrl}
//                   className="flex-1 border rounded px-2 py-1 text-black"
//                 />
//                 <button
//                   onClick={() => navigator.clipboard.writeText(shareUrl)}
//                   className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//                 >
//                   📋Copy
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div> */}

//       <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-hidden mt-4">
  
//   {/* 1. SHOW THE LATEST SENT MESSAGE AND URL (Visible EVEN when loading a new one) */}
//   {latestSentMessage && (
//     <div className="w-full max-w-md flex flex-col items-center mt-2">
//       <USDViewer
//         usdUrl={latestSentMessage.usdUrl!}
//         audioUrl={latestSentMessage.audioUrl|| undefined}
//         emotion={selectedEmotion}
//       />
//       {shareUrl && (
//         <div className="mt-2 flex items-center gap-2 w-full">
//           <input
//             type="text"
//             readOnly
//             value={shareUrl}
//             className="flex-1 border rounded px-2 py-1 text-black"
//           />
//           <button
//             onClick={() => navigator.clipboard.writeText(shareUrl)}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             📋Copy
//           </button>
//         </div>
//       )}
//     </div>
//   )}

//   {/* 2. SHOW THE LOADING INDICATOR (Visible only when processing) */}
//   {loading && (
//     <div className="w-full max-w-md flex flex-col items-center justify-center mt-2">
//       <div className="flex items-center space-x-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
//         <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//         <p className="text-lg font-semibold text-yellow-800">
//           🤖 **Creating your message...** Please wait!
//         </p>
//       </div>
//     </div>
//   )}

//   {/* 3. Empty state for first load (Show only if no message AND not loading) */}
//   {/* {!latestSentMessage && !loading && (
//     <div className="text-center text-gray-500 mt-4 text-sm"></div>
//   )} */}
//   {/* 3. Empty state for first load (Show only if no message AND not loading) */}
//   {!latestSentMessage && !loading && (
//     <div className="w-full max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-400/50 animate-fadeIn">
//      <h2 className="text-xl font-bold text-center text-blue-500 dark:text-blue-400 mb-4 flex items-center justify-center gap-2">
//     ✨ <span className="text-purple-600 dark:text-purple-400">Create</span> Your First Avatar Message! ✨
//   </h2>
//   <ul className="space-y-3 text-left text-gray-700 dark:text-gray-300">
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">1️⃣</span>
//       <p>
//         <span className="font-semibold text-purple-600 dark:text-purple-400">Type a message</span> into the input field below.
//       </p>
//     </li>
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">2️⃣</span>
//       <p>
//         Tap the <span className="font-semibold text-purple-600 dark:text-purple-400">+ button</span> to choose a <span className="font-semibold text-purple-600 dark:text-purple-400">Gender</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">Emotion</span> for your avatar. (Default: Male, Joy)
//       </p>
//     </li>
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">3️⃣</span>
//       <p>
//         Hit the <span className="font-semibold text-purple-600 dark:text-purple-400">Send button</span>! Your avatar will appear here, ready to share!
//       </p>
//     </li>
//   </ul>
//   <p className="mt-5 text-center text-sm font-semibold text-purple-500 dark:text-purple-400">
//     Ready to make your message come alive? Start typing now! 👇
//   </p>
//     </div>
//   )}
  
// </div>

//       <div className="fixed bottom-4 sm:relative left-0 w-full z-50 px-4 sm:px-0">
//         <div className="max-w-2xl mx-auto w-full relative">
//           <div className="flex items-center gap-3 px-4 py-2 sm:py-3 rounded-3xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-md shadow-lg w-full transition-all">

//             {/* Text input */}
//             <input
//               type="text"
//               placeholder="Type your message..."
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               disabled={!!selectedAudio}
//               className="flex-1 outline-none bg-transparent h-10 text-sm sm:text-base
//              text-black placeholder-gray-500
//              dark:text-white dark:placeholder-white px-2"
//             />



//             {/* Plus icon button */}
//             <button
//               onClick={() => setShowOptions(!showOptions)}
//               className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 dark:hover:bg-gray-700/50 transition-transform duration-200 transform hover:scale-105"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-black dark:text-white"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//             </button>

//             {/* Send button */}
//             <button
//               onClick={sendMessage}
//               className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
//                 loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
//               } transition-transform duration-200 transform hover:scale-105`}
//               // disabled={loading}
//               disabled={loading || (!message.trim() && !selectedAudio && selectedStaticShapeKey === "None")} 
//             >
//               {loading ? (
//                 <span>⏳</span>
//               ) : (
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5 text-white"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
//                 </svg>
//               )}
//             </button>
//           </div>

//           {/* Options panel */}
//           {showOptions && (
//             <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-sm border rounded-2xl shadow-xl p-4
//                           bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm z-50 transition-opacity duration-300">
//               <div className="flex flex-col gap-3">
                
//                 {/* Gender Select */}
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
//                   Select Gender:
//                 </div>
//                 <select
//                   className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                   value={selectedGender}
//                   onChange={(e) => {
//                   const newGender = e.target.value;
//                   setSelectedGender(newGender);
//                   // 🆕 Reset model to the default for the newly selected gender
//                   setSelectedModel(avatarModels[newGender][0].file);
//                 }}
//                 >
//                   <option value="male">🧑 Male</option>
//                   <option value="female">👧 Female</option>
//                 </select>
//                 {/* 🆕 NEW AVATAR MODEL SELECT */}
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                   Select Avatar Model:
//                 </div>
//                 <select
//                   className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                   value={selectedModel}
//                   onChange={(e) => setSelectedModel(e.target.value)}
//                 >
//                   {/* Filter models based on the current gender */}
//                   {avatarModels[selectedGender].map((model) => (
//                     <option key={model.file} value={model.file}>
//                       {model.name}
//                     </option>
//                   ))}
//                 </select>


// {/* 🆕 Fixed & Dynamic Static Shape Key Dropdown - MAX COMPRESSION */}
// <div className="flex flex-col w-full">
//     {/* Header Div - Removed mt-2 for minimal top spacing */}
//     <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center">
//        emotes only:
        
//         {/* Status Indicator: Shows if the current selection is static or if dynamic is ignored */}
//         {selectedStaticShapeKey !== "None" && (
//             <span className="text-blue-500 font-normal text-xs bg-blue-100 p-1 rounded">
//                 🗿 Static Pose Active
//             </span>
//         )}
//         {(selectedStaticShapeKey === "None" && availableStaticShapeKeys.length === 1) && (
//             <span className="text-red-500 font-normal text-xs bg-red-100 p-1 rounded">
//                 🚫 No Poses for Model
//             </span>
//         )}
//     </div>
    
//     {/* The Select Element - py-1 for reduced vertical padding/height */}
//     <select
//         className="border px-3 py-1 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//         value={selectedStaticShapeKey}
//         // 💡 Dynamic disabling logic: Disable if text or audio is present
//         disabled={!!selectedAudio || message.length > 0} 
//         onChange={(e) => {
//             const newKey = e.target.value;
//             setSelectedStaticShapeKey(newKey);
//             // If a static key is selected, reset the A2F emotion picker to Joy as a visual cue
//             if (newKey !== "None") {
//                 setSelectedEmotion("joy");
//             }
//         }}
//     >
//         {/* Iterates over the DYNAMIC list of keys for the selected model */}
//         {availableStaticShapeKeys.map((key) => (
//             <option key={key} value={key}>
//                 {key === "None" ? "Select Emotes" : `🗿 Static: ${key}`}
//             </option>
//         ))}
//     </select>
// </div>




//                 {/* Emotion Picker (New Design) - CONDITIONAL RENDERING */}
//                 {selectedStaticShapeKey === "None" ? (
//                   <>
//                     <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                       Select Emotion: <span className="text-blue-500 font-normal">({selectedEmotion})</span>
//                     </div>
//                     <EmotionPicker />
//                   </>
//                 ) : (
//                   <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
//                     * Text is **DISABLED** because a Static Pose ({selectedStaticShapeKey}) is selected.
//                   </div>
//                 )}

                

//                 {/* Emotion Picker (New Design) */}
//                 {/* <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                   Select Emotion: <span className="text-blue-500 font-normal">({selectedEmotion})</span>
//                 </div>
//                 <EmotionPicker /> */}

//                 {/* Audio Select */}
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                   Select Pre-recorded Audio:
//                 </div>
//                 <select
//                   className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                   value={selectedAudio || ""}
//                   onChange={(e) => setSelectedAudio(e.target.value || null)}
//                 >
//                   <option value="">🎙️ Use Text-to-Speech (TTS)</option>
//                   {audioList.map((file) => (
//                     <option key={file} value={file}>
//                       🎶 {file.replace(/\.[^/.]+$/, "")}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatPage;











"use client";

import { useEffect, useState, useRef } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  limit,
} from "firebase/firestore";
import { auth } from "@/firebase/auth";
import { app } from "@/firebase/config";
import { analytics, logEvent } from "@/firebase/config";

const db = getFirestore(app);

// --- Configuration Data ---
const emotions = [
  "amazement", "anger", "cheekiness", "disgust", "fear", "grief", "joy",
  "outofbreath", "pain", "sadness", "happy", "flirty", "romantic",
  "confident", "excited", "tired", "nervous",
];

const emotionIcons: Record<string, string> = {
  amazement: "😮", anger: "😡", cheekiness: "😏", disgust: "🤢",
  fear: "😨", grief: "😭", joy: "😄", outofbreath: "🥵",
  pain: "🤕", sadness: "😥", happy: "😊", flirty: "😉",
  romantic: "🥰", confident: "😎", excited: "🤩", tired: "😴", nervous: "😬",
};

interface Message {
  id: string;
  sender: string;
  receiver?: string;
  audioUrl?: string | null;
  usdUrl?: string;
  videoUrl?: string;
  shareUrl?: string;
  text?: string;
  emotion?: string;
  avatarModel?: string;
  staticShapeKey?: string;
}

interface AvatarOption {
  name: string;
  file: string;
  image: string;
}

const avatarModels: Record<string, AvatarOption[]> = {
  male: [
    { name: "Raju", file: "boy2.usd", image: "raju.png" },
    // { name: "Male Face (John)", file: "male_face.usd" },
    { name: "funny guy", file: "ishowspeed.usd", image: "speed.jpeg" },
    { name: "batman", file: "batman.usd", image: "batman.jpeg" },
  ],
  female: [
    { name: "Pinki", file: "girl.usd", image: "pinki.jpeg" },
    // { name: "Girl with Hair", file: "girlwithhairs.usd" },
  ],
};

const modelShapeKeyMap: Record<string, string[]> = {
  "boy2.usd": ["None", "Pucker", "happy", "hungry", "surprised", "Disgust", "Angry"],
  "girl.usd": ["None", "Angry", "crying", "happy", "Pucker", "surprised"],
};

// --- Helper Components ---
const VideoPlayer: React.FC<{ videoUrl: string }> = ({ videoUrl }) => (
  <div className="w-full rounded-lg overflow-hidden shadow-lg bg-black">
    <video
      src={videoUrl}
      controls
      autoPlay
      muted          // ✅ allow autoplay
      playsInline
      preload="metadata"
      className="w-full h-auto"
      onError={(e) => console.error("❌ VIDEO LOAD ERROR", videoUrl, e)}
      onLoadedData={() => console.log("✅ VIDEO LOADED", videoUrl)}
    />

  </div>
);


function getGuestId() {
  if (typeof window === "undefined") return "guest_temp";
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("guest_id", id);
  }
  return id;
}

async function waitForVideo(url: string, timeoutMs = 180000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (res.ok) return true;
    } catch {}

    await new Promise((r) => setTimeout(r, 4000));
  }

  return false;
}


const ChatPage = () => {
  // --- States ---
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [latestSentMessage, setLatestSentMessage] = useState<Message | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedGender, setSelectedGender] = useState("male");
  const [selectedEmotion, setSelectedEmotion] = useState("joy");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [audioList, setAudioList] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(avatarModels["male"][0].file);
  const [availableStaticShapeKeys, setAvailableStaticShapeKeys] = useState<string[]>(["None"]);
  const [selectedStaticShapeKey, setSelectedStaticShapeKey] = useState("None");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const newKeys = modelShapeKeyMap[selectedModel] || ["None"];
    setAvailableStaticShapeKeys(newKeys);
    if (!newKeys.includes(selectedStaticShapeKey)) setSelectedStaticShapeKey("None");
  }, [selectedModel]);

  useEffect(() => {
    fetch("/api/list-audios").then(res => res.json()).then(setAudioList).catch(console.error);
  }, []);
  
  // Update preview when selection changes
useEffect(() => {
  if (selectedAudio) {
    setPreviewUrl(`/audio/downloaded/${selectedAudio}`);
  } else {
    setPreviewUrl(null);
  }
}, [selectedAudio]);

  // SharedArrayBuffer Reload Fix
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.crossOriginIsolated && !sessionStorage.getItem("reloadedOnce")) {
      sessionStorage.setItem("reloadedOnce", "true");
      window.location.reload();
    }
  }, []);

  // Real-time Firestore Listener (Replaces manual polling)
  useEffect(() => {
    const senderId = currentUser ? currentUser.uid : getGuestId();
    const q = query(
      collection(db, "shared"),
      where("sender", "==", senderId),
      orderBy("timestamp", "desc"),
      limit(1)
    );

       const unsubscribe = onSnapshot(q, (snapshot) => {
  if (snapshot.empty) return;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as Message;

  // ✅ Only react to the message sent by THIS user/session
  if (data.sender === senderId) {
    setLatestSentMessage({ ...data, id: docSnap.id });
    setShareUrl(data.shareUrl || null);

    // ✅ Stop loader only when video is ready
   if (data.videoUrl) {
  waitForVideo(data.videoUrl).then(() => {
    setLoading(false);
  });
}

  }
});

return () => unsubscribe();


  }, [currentUser]);

  // --- Functions ---
  const sendMessage = async () => {
    const textMessage = message.trim();
    const isStaticPose = selectedStaticShapeKey !== "None";
    if (loading) return;
    if (!textMessage && !isStaticPose) return;

    setLoading(true);
    const senderId = currentUser ? currentUser.uid : getGuestId();
    let userData: any = {};

    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      userData = userDoc.exists() ? userDoc.data() : {};
    }

    const finalMessageText = isStaticPose ? null : (textMessage || null);

    try {
      const docRef = await addDoc(collection(db, "shared"), {
        sender: senderId,
        senderName: userData.username || `User_${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        emotion: selectedEmotion,
        avatarModel: selectedModel,
        staticShapeKey: selectedStaticShapeKey,
        text: textMessage || (isStaticPose ? `Emote: ${selectedStaticShapeKey}` : "Audio Msg"),
        status: "processing"
      });

      await generateAudioAndLipSync(finalMessageText, docRef.id, selectedGender, selectedAudio, senderId);
      
      setMessage("");
      setSelectedAudio(null);
      setShowOptions(false);
        // ✅ Log message_sent event here, **inside the try block** so docRef is available
          if (analytics) {
              logEvent(analytics, "message_sent_from_share", {
                  message_id: docRef.id,
                  sender: senderId,
                  page: window.location.pathname,
                  has_audio: !!selectedAudio,
                  text_length: finalMessageText ? finalMessageText.length : 0,
                  is_static_pose: isStaticPose,
              });
              console.log("[Analytics] message_sent_from_share:", docRef.id);
          }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const generateAudioAndLipSync = async (
  text: string | null,
  messageId: string,
  gender: string,
  audioFile: string | null,
  senderId: string
) => {
  const isStaticPose = selectedStaticShapeKey !== "None";
  try {
        const EMOTION_MAP: Record<string, string> = {
        amazement: "Conversational", anger: "Angry", cheekiness: "Calm", disgust: "Sad", fear: "Sad",
        grief: "Sad", joy: "Conversational", outofbreath: "Conversational", pain: "Sad", sadness: "Sad",
        happy: "Conversational", flirty: "Calm", romantic: "Calm", confident: "Conversational",
        excited: "Conversational", tired: "Calm", nervous: "Sad",
      };
    const ttsEmotion = EMOTION_MAP[selectedEmotion.toLowerCase()] || "Conversational";

    let audioFilePath = "";
    let directoryAudio = "";

    // if (audioFile) {
    //   audioFilePath = `/audio/downloaded/${audioFile}`;
    //   directoryAudio = "D:/chat-avatar-app/public/audio/downloaded";
    // } else 
      if (text) {
      const ttsRes = await fetch("/api/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, messageId, gender, emotion: ttsEmotion, avatarModel: selectedModel }),
      });
      const ttsData = await ttsRes.json();
      audioFilePath = ttsData.audioPath;
      directoryAudio = "D:/chat-avatar-app/public/audio";
    }

    let usdFileUrl = "";
    if (isStaticPose) {
      const base = selectedModel.replace('.usd', '');
      usdFileUrl = `https://mimichat.space/usd_files/models/${base}_${selectedStaticShapeKey}.usd`;
    } else {
      const a2fRes = await fetch("/api/audio2face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioFilePath, messageId, gender, model: selectedModel,
          emotion: selectedEmotion, directoryAudio, outputDir: "D:/chat-avatar-app/public/usd_files"
        }),
      });
      const a2fData = await a2fRes.json();
      if (!a2fData.success) throw new Error("Audio2Face failed");
      usdFileUrl = `https://mimichat.space/usd_files/cache_${messageId}_cache.usd`;
    }
    
    const newShareUrl = `https://mimichat.space/view/${messageId}`;

    await updateDoc(doc(db, "shared", messageId), {
    usdUrl: usdFileUrl,
    shareUrl: newShareUrl,
    audioUrl: isStaticPose ? null : `/audio/audio_${messageId}.wav`,
    status: "rendering"
  });


   fetch("/api/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messageId,
      usdUrl: usdFileUrl,
      audioUrl: isStaticPose ? undefined : `/audio/audio_${messageId}.wav`,
      bgmUrl: selectedAudio ? `/audio/downloaded/${selectedAudio}` : undefined, // Background music
      emotion: selectedEmotion, // ✅ PASS EMOTION
      avatarModel: selectedModel
      
    }),
  }).catch(() => {});


    // setLoading(false);

  } catch (err) {
    console.error(err);
    setLoading(false);
  }
};


  const EmotionPicker = () => (
    <div className="grid grid-cols-5 gap-2 p-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      {emotions.map((emo) => (
        <button
          key={emo}
          onClick={() => setSelectedEmotion(emo)}
          className={`flex flex-col items-center p-1 rounded-lg transition-all ${selectedEmotion === emo ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"}`}
        >
          <span className="text-xl">{emotionIcons[emo]}</span>
          <span className="text-[10px] truncate">{emo}</span>
        </button>
      ))}
    </div>
  );

//     return (
//     <div className="flex flex-col items-start w-full h-screen bg-gray-100 px-4">
//       <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
//         MimiChat
//       </h1>
//       {!currentUser && (
//         <div className="w-full max-w-md mx-auto mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center p-3 rounded-lg shadow-md">
//           <p className="text-sm md:text-base font-medium">
//             🔒 Login to get full access!
//           </p>
//           <button
//             onClick={() => window.location.href = "/login"}
//             className="mt-2 px-4 py-1 bg-white text-purple-600 font-semibold rounded-full shadow hover:bg-gray-100 text-sm"
//           >
//             Login
//           </button>
//         </div>
//       )}


//       <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-hidden mt-4">
  
//   {/* 1. SHOW THE LATEST SENT MESSAGE AND URL (Visible EVEN when loading a new one) */}
//   {latestSentMessage && (
//     <div className="w-full max-w-md flex flex-col items-center mt-2">
//         <VideoPlayer
//             key={latestSentMessage.videoUrl} // 🔥 VERY IMPORTANT
//             videoUrl={`${latestSentMessage.videoUrl}?v=${Date.now()}`}
//           />
      
//       {shareUrl && (
//         <div className="mt-2 flex items-center gap-2 w-full">
//           <input
//             type="text"
//             readOnly
//             value={shareUrl}
//             className="flex-1 border rounded px-2 py-1 text-black"
//           />
//           <button
//             onClick={() => navigator.clipboard.writeText(shareUrl)}
//             className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//           >
//             📋Copy
//           </button>
//         </div>
//       )}
//     </div>
//   )}

//   {/* 2. SHOW THE LOADING INDICATOR (Visible only when processing) */}
//   {loading && (
//     <div className="w-full max-w-md flex flex-col items-center justify-center mt-2">
//       <div className="flex items-center space-x-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
//         <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//         </svg>
//         <p className="text-lg font-semibold text-yellow-800">
//           🤖 **Creating your message...** Please wait!
//         </p>
//       </div>
//     </div>
//   )}

//   {/* 3. Empty state for first load (Show only if no message AND not loading) */}
//   {/* {!latestSentMessage && !loading && (
//     <div className="text-center text-gray-500 mt-4 text-sm"></div>
//   )} */}
//   {/* 3. Empty state for first load (Show only if no message AND not loading) */}
//   {!latestSentMessage && !loading && (
//     <div className="w-full max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-400/50 animate-fadeIn">
//      <h2 className="text-xl font-bold text-center text-blue-500 dark:text-blue-400 mb-4 flex items-center justify-center gap-2">
//     ✨ <span className="text-purple-600 dark:text-purple-400">Create</span> Your First Avatar Message! ✨
//   </h2>
//   <ul className="space-y-3 text-left text-gray-700 dark:text-gray-300">
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">1️⃣</span>
//       <p>
//         <span className="font-semibold text-purple-600 dark:text-purple-400">Type a message</span> into the input field below.
//       </p>
//     </li>
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">2️⃣</span>
//       <p>
//         Tap the <span className="font-semibold text-purple-600 dark:text-purple-400">+ button</span> to choose a <span className="font-semibold text-purple-600 dark:text-purple-400">Gender</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">Emotion</span> for your avatar. (Default: Male, Joy)
//       </p>
//     </li>
//     <li className="flex items-start gap-3">
//       <span className="flex-shrink-0 text-lg">3️⃣</span>
//       <p>
//         Hit the <span className="font-semibold text-purple-600 dark:text-purple-400">Send button</span>! Your avatar will appear here, ready to share!
//       </p>
//     </li>
//   </ul>
//   <p className="mt-5 text-center text-sm font-semibold text-purple-500 dark:text-purple-400">
//     Ready to make your message come alive? Start typing now! 👇
//   </p>
//     </div>
//   )}
  
// </div>

//       <div className="fixed bottom-4 sm:relative left-0 w-full z-50 px-4 sm:px-0">
//         <div className="max-w-2xl mx-auto w-full relative">
//           <div className="flex items-center gap-3 px-4 py-2 sm:py-3 rounded-3xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-md shadow-lg w-full transition-all">

//             {/* Text input */}
//             <input
//               type="text"
//               placeholder="Type your message..."
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               // disabled={!!selectedAudio}
//               className="flex-1 outline-none bg-transparent h-10 text-sm sm:text-base
//              text-black placeholder-gray-500
//              dark:text-white dark:placeholder-white px-2"
//             />



//             {/* Plus icon button */}
//             <button
//               onClick={() => setShowOptions(!showOptions)}
//               className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 dark:hover:bg-gray-700/50 transition-transform duration-200 transform hover:scale-105"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-5 w-5 text-black dark:text-white"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//             </button>

//             {/* Send button */}
//             <button
//               onClick={sendMessage}
//               className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
//                 loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
//               } transition-transform duration-200 transform hover:scale-105`}
//               // disabled={loading}
//               disabled={loading || (!message.trim() && selectedStaticShapeKey === "None")} 
//             >
//               {loading ? (
//                 <span>⏳</span>
//               ) : (
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5 text-white"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
//                 </svg>
//               )}
//             </button>
//           </div>

//           {/* Options panel */}
//           {showOptions && (
//             <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-sm border rounded-2xl shadow-xl p-4
//                           bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm z-50 transition-opacity duration-300">
//               <div className="flex flex-col gap-3">
                
//                 {/* Gender Select */}
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
//                   Select Gender:
//                 </div>
//                 <select
//                   className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                   value={selectedGender}
//                   onChange={(e) => {
//                   const newGender = e.target.value;
//                   setSelectedGender(newGender);
//                   // 🆕 Reset model to the default for the newly selected gender
//                   setSelectedModel(avatarModels[newGender][0].file);
//                 }}
//                 >
//                   <option value="male">🧑 Male</option>
//                   <option value="female">👧 Female</option>
//                 </select>
//                 {/* 🆕 NEW AVATAR MODEL SELECT */}
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                   Select Avatar Model:
//                 </div>
//                 <select
//                   className="border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                   value={selectedModel}
//                   onChange={(e) => setSelectedModel(e.target.value)}
//                 >
//                   {/* Filter models based on the current gender */}
//                   {avatarModels[selectedGender].map((model) => (
//                     <option key={model.file} value={model.file}>
//                       {model.name}
//                     </option>
//                   ))}
//                 </select>


//                 {/* Emotion Picker (New Design) - CONDITIONAL RENDERING */}
//                 {selectedStaticShapeKey === "None" ? (
//                   <>
//                     <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                       Select Emotion: <span className="text-blue-500 font-normal">({selectedEmotion})</span>
//                     </div>
//                     <EmotionPicker />
//                   </>
//                 ) : (
//                   <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
//                     * Text is **DISABLED** because a Static Pose ({selectedStaticShapeKey}) is selected.
//                   </div>
//                 )}

//              {/* BGM Container */}
//               <div className="space-y-2">
//                 <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
//                   Set Bgm
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <select
//                     className="flex-1 border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
//                     value={selectedAudio || ""}
//                     onChange={(e) => {
//                       const val = e.target.value || null;
//                       setSelectedAudio(val);
//                       if (audioRef.current) {
//                         audioRef.current.pause();
//                         audioRef.current.load(); // Resets the player for the new track
//                         setIsPlaying(false);     // Reset icon state
//                       }
//                     }}
//                   >
//                     <option value="">None (Silence)</option>
//                     {audioList.map((file) => (
//                       <option key={file} value={file}>
//                         🎶 {file.replace(/\.[^/.]+$/, "")}
//                       </option>
//                     ))}
//                   </select>

//                   {/* Preview Button */}
//                   {selectedAudio && (
//                     <button
//                       type="button"
//                       onClick={() => {
//                         if (audioRef.current) {
//                           if (audioRef.current.paused) {
//                             audioRef.current.play();
//                           } else {
//                             audioRef.current.pause();
//                           }
//                         }
//                       }}
//                       className={`p-2 text-white rounded-md transition-colors ${
//                         isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
//                       }`}
//                       title={isPlaying ? "Pause Preview" : "Play Preview"}
//                     >
//                       {isPlaying ? (
//                         /* Pause Icon */
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
//                         </svg>
//                       ) : (
//                         /* Play Icon */
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </button>
//                   )}
//                 </div>

//                 {/* Hidden Audio Player for Preview */}
//                 <audio 
//                   ref={audioRef} 
//                   src={previewUrl || ""} 
//                   onPlay={() => setIsPlaying(true)}
//                   onPause={() => setIsPlaying(false)}
//                   onEnded={() => setIsPlaying(false)}
//                 />
//               </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );


return (
    <div className="flex flex-col items-start w-full h-screen bg-gray-100 px-4 overflow-hidden">
      <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md py-2">
        MimiChat
      </h1>
      
      {!currentUser && (
        <div className="w-full max-w-md mx-auto mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center p-3 rounded-lg shadow-md">
          <p className="text-sm md:text-base font-medium">
            🔒 Login to get full access!
          </p>
          <button
            onClick={() => window.location.href = "/login"}
            className="mt-2 px-4 py-1 bg-white text-purple-600 font-semibold rounded-full shadow hover:bg-gray-100 text-sm"
          >
            Login
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-y-auto mt-4 pb-56">
        {/* 1. LATEST MESSAGE */}
        {latestSentMessage && (
          <div className="w-full max-w-md flex flex-col items-center mt-2">
            <VideoPlayer
              key={latestSentMessage.videoUrl}
              videoUrl={`${latestSentMessage.videoUrl}?v=${Date.now()}`}
            />
            
            {shareUrl && (
              <div className="mt-2 flex items-center gap-2 w-full bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 border-none outline-none text-black text-xs px-2"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-bold"
                >
                  📋Copy
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. LOADING INDICATOR */}
        {loading && (
          <div className="w-full max-w-md flex flex-col items-center justify-center mt-2">
            <div className="flex items-center space-x-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
              <svg className="animate-spin h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg font-semibold text-yellow-800">
                🤖 **Creating your message...** Please wait!
              </p>
            </div>
          </div>
        )}

        {/* 3. EMPTY STATE */}
        {!latestSentMessage && !loading && (
          <div className="w-full max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-400/50 animate-fadeIn">
            <h2 className="text-xl font-bold text-center text-blue-500 dark:text-blue-400 mb-4 flex items-center justify-center gap-2">
              ✨ <span className="text-purple-600 dark:text-purple-400">Create</span> Your First Avatar Message! ✨
            </h2>
            <ul className="space-y-3 text-left text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">1️⃣</span>
                <p><span className="font-semibold text-purple-600">Type a message</span> into the input field below.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">2️⃣</span>
                <p>Pick your <span className="font-semibold text-purple-600">Avatar</span> from the carousel.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 text-lg">3️⃣</span>
                <p>Tap <span className="font-semibold text-purple-600">+</span> for Emotions & BGM, then hit <span className="font-semibold text-purple-600">Send</span>!</p>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* --- STICKY CONTROLS --- */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-4 bg-gradient-to-t from-gray-100 to-transparent pt-10">
        <div className="max-w-2xl mx-auto w-full relative space-y-3">
          
          {/* VISUAL AVATAR SELECTOR */}
          <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Choose Character</span>
               <div className="flex bg-gray-200 rounded-full p-0.5 scale-90">
                  <button 
                    onClick={() => { setSelectedGender("male"); setSelectedModel(avatarModels["male"][0].file); }}
                    className={`px-3 py-0.5 text-[10px] rounded-full transition ${selectedGender === 'male' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                  >Male</button>
                  <button 
                    onClick={() => { setSelectedGender("female"); setSelectedModel(avatarModels["female"][0].file); }}
                    className={`px-3 py-0.5 text-[10px] rounded-full transition ${selectedGender === 'female' ? 'bg-white shadow text-pink-600 font-bold' : 'text-gray-500'}`}
                  >Female</button>
               </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pt-2 pb-1 no-scrollbar">
              {avatarModels[selectedGender].map((model) => (
                <button
                  key={model.file}
                  onClick={() => setSelectedModel(model.file)}
                  className={`flex-shrink-0 flex flex-col items-center transition-all duration-200 ${selectedModel === model.file ? "scale-110" : "opacity-40 grayscale-[30%]"}`}
                >
                  <div className={`w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center bg-gray-100 shadow-sm
                    ${selectedModel === model.file ? "border-blue-500 ring-2 ring-blue-500/20" : "border-transparent"}`}>
                    <img 
                      src={model.image} 
                      alt={model.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/100?text=" + model.name.charAt(0); }}
                    />
                  </div>
                  <span className={`text-[10px] mt-1 font-bold truncate w-16 text-center ${selectedModel === model.file ? "text-blue-600" : "text-gray-400"}`}>
                    {model.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* INPUT BAR */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-3xl bg-white shadow-2xl w-full border border-gray-200">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 outline-none bg-transparent h-10 text-sm text-black placeholder-gray-500 px-2"
            />

            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition ${showOptions ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={sendMessage}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-all active:scale-95 ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              }`}
              disabled={loading || (!message.trim() && selectedStaticShapeKey === "None")} 
            >
              {loading ? <span className="text-xs text-white">⏳</span> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>

          {/* YOUR ORIGINAL OPTIONS PANEL DESIGN (Restored for Laptop/Mobile consistency) */}
          {showOptions && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-sm border rounded-2xl shadow-xl p-4
                           bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm z-50 transition-opacity duration-300">
              <div className="flex flex-col gap-3">
              

                {/* Emotion Picker Conditional */}
                {selectedStaticShapeKey === "None" ? (
                  <>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                      Select Emotion: <span className="text-blue-500 font-normal">({selectedEmotion})</span>
                    </div>
                    <EmotionPicker />
                  </>
                ) : (
                  <div className="mt-2 p-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                    * Text DISABLED for Static Pose
                  </div>
                )}

                {/* BGM Select */}
                <div className="space-y-2 mt-2">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Set Bgm</div>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border px-3 py-2 rounded-md text-black dark:text-white bg-white dark:bg-gray-700 text-sm"
                      value={selectedAudio || ""}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setSelectedAudio(val);
                        if (audioRef.current) { audioRef.current.pause(); audioRef.current.load(); setIsPlaying(false); }
                      }}
                    >
                      <option value="">None (Silence)</option>
                      {audioList.map((file) => (
                        <option key={file} value={file}>🎶 {file.replace(/\.[^/.]+$/, "")}</option>
                      ))}
                    </select>
                    {selectedAudio && (
                      <button
                        type="button"
                        onClick={() => audioRef.current?.paused ? audioRef.current.play() : audioRef.current?.pause()}
                        className={`p-2 text-white rounded-md ${isPlaying ? "bg-red-500" : "bg-blue-500"}`}
                      >
                        {isPlaying ? "⏸" : "▶"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={previewUrl || ""} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default ChatPage;