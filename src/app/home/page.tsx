
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { db, auth } from "@/firebase/config";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   getDocs,
//   getDoc,
//   doc,
//   limit,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { Search } from "lucide-react";
// import BackButton from '@/components/BackButton';

// type ChatUser = {
//   chatId: string;
//   uid: string;
//   username: string;
//   lastMessage: string;
//   lastMessageTime: string;
//   hasUnread?: boolean;
// };

// const fetchChatUsers = async (currentUserId: string) => {
//   if (!currentUserId) return [];

//   const chatsRef = collection(db, "chats");
//   const q = query(chatsRef, where("participants", "array-contains", currentUserId));
//   const chatSnapshot = await getDocs(q);

//   const uniqueUsersMap = new Map<string, ChatUser>();

//   for (const chatDoc of chatSnapshot.docs) {
//     const chatData = chatDoc.data();
//     const participants: string[] = chatData.participants || [];
//     const otherUserId = participants.find((id) => id !== currentUserId);
//     if (!otherUserId || uniqueUsersMap.has(otherUserId)) continue;

//     const messagesQuery = query(
//       collection(db, "messages"),
//       where("chatId", "==", chatDoc.id),
//       orderBy("timestamp", "desc"),
//       limit(1)
//     );
//     const messagesSnapshot = await getDocs(messagesQuery);

//     const lastMsg = messagesSnapshot.docs[0]?.data() || {
//       text: "No messages yet",
//       timestamp: null,
//     };

//     const lastMessageTime = lastMsg?.timestamp?.toDate()?.toLocaleString() || "No timestamp";

//     const userDoc = await getDoc(doc(db, "users", otherUserId));
//     const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown User" };

//     uniqueUsersMap.set(otherUserId, {
//       chatId: chatDoc.id,
//       uid: otherUserId,
//       username: userData.username || "Unknown",
//       lastMessage: lastMsg.text || "",
//       lastMessageTime,
//     });

//   }

  
//   return Array.from(uniqueUsersMap.values());
// };

// export default function HomePage() {
//   const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [currentUsername, setCurrentUsername] = useState<string>(""); // 🆕 Add this
//   const router = useRouter();

//   // show username
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setCurrentUserId(user.uid);
//         // 🆕 Fetch username
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };
//         setCurrentUsername(userData.username || "Unknown");
//       } else {
//         setCurrentUserId(null);
//         setCurrentUsername("");
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//   if (!currentUserId) return;
//   setLoading(true);

//   const loadChatUsers = async () => {
//     const users = await fetchChatUsers(currentUserId);
//     const sorted = users.sort((a, b) => {
//       const aTime = new Date(a.lastMessageTime).getTime() || 0;
//       const bTime = new Date(b.lastMessageTime).getTime() || 0;
//       return bTime - aTime;
//     });
//     setChatUsers(sorted);
//     setLoading(false);
//   };

//   loadChatUsers();
// }, [currentUserId]);


//   useEffect(() => {
//   if (!currentUserId) return;

//   const chatsRef = collection(db, "chats");
//   const q = query(chatsRef, where("participants", "array-contains", currentUserId));

//   const unsubscribe = onSnapshot(q, async (snapshot) => {
//     const uniqueUsersMap = new Map<string, ChatUser>();

//     for (const chatDoc of snapshot.docs) {
//       const chatData = chatDoc.data();
//       const participants: string[] = chatData.participants || [];
//       const otherUserId = participants.find((id) => id !== currentUserId);
//       if (!otherUserId || uniqueUsersMap.has(otherUserId)) continue;

//       const userDoc = await getDoc(doc(db, "users", otherUserId));
//       const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };

//       const lastMsgQuery = query(
//         collection(db, "messages"),
//         where("chatId", "==", chatDoc.id),
//         orderBy("timestamp", "desc"),
//         limit(1)
//       );
//       const lastMsgSnap = await getDocs(lastMsgQuery);
//       const lastMsg = lastMsgSnap.docs[0]?.data() || {
//         text: "No messages yet",
//         timestamp: null,
//       };
//       const lastMessageTime = lastMsg?.timestamp?.toDate()?.toLocaleString() || "...";

//       const unreadQuery = query(
//         collection(db, "messages"),
//         where("chatId", "==", chatDoc.id),
//         where("receiver", "==", currentUserId),
//         where("seen", "==", false)
//       );
//       const unreadSnap = await getDocs(unreadQuery);
//       const hasUnread = !unreadSnap.empty;

//       uniqueUsersMap.set(otherUserId, {
//         chatId: chatDoc.id,
//         uid: otherUserId,
//         username: userData.username || "Unknown",
//         lastMessage: lastMsg.text || "",
//         lastMessageTime,
//         hasUnread,
//       });
//     }

//     const sortedUsers = Array.from(uniqueUsersMap.values()).sort((a, b) => {
//     const aTime = new Date(a.lastMessageTime).getTime() || 0;
//     const bTime = new Date(b.lastMessageTime).getTime() || 0;
//     return bTime - aTime; // DESC order
//   });

//   setChatUsers(sortedUsers);

//   });

//   return () => unsubscribe();
// }, [currentUserId]);



  

//   return (
//     <div className="p-6 max-w-xl mx-auto">
//       {/* 🆕 Show current username at top */}
//       {currentUsername && (
//   <div className="mb-4 flex items-center justify-between w-full max-w-xl mx-auto">
//     <BackButton />
//     <p className="text-lg font-semibold text-black dark:text-white truncate">
//       Welcome, @{currentUsername}
//     </p>
//     <button
//       onClick={() => (window.location.href = "/share")}
//       className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center"
//       title="Share"
//     >
//       {/* Standard share icon (like WhatsApp / Insta / Telegram) */}
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         className="h-6 w-6 text-blue-500"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M4 12v.01M12 4v.01M20 12v.01M12 20v.01M7.8 7.8l.01.01M16.2 7.8l.01.01M7.8 16.2l.01.01M16.2 16.2l.01.01"
//         />
//       </svg>
//     </button>
//   </div>
// )}


      

//       <div className="flex justify-between items-center mb-4">
//         <div className="mb-6 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
//           <div>
//             <p className="text-sm text-gray-800 font-medium">Need a fresh look?</p>
//             <p className="text-xs text-gray-500">Get a new premium avatar</p>
//           </div>
//           <button
//             onClick={() => router.push("/new-feature")}
//             className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-900 transition"
//           >
//             New Avatar
//           </button>
//         </div>

//         <Search
//           className="cursor-pointer text-black hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
//           // onClick={() => router.push("/search")}
//            onClick={() => {
//             window.location.href = '/search';
//           }}
//         />

//       </div>

//       {loading ? (
//         <p className="text-gray-500">Loading chats...</p>
//       ) : chatUsers.length === 0 ? (
//         <p className="text-gray-500">No chats yet.</p>
//       ) : (
//         <ul className="space-y-3">
//           {chatUsers.map((user) => (
//             <li
//               key={`${user.chatId}-${user.uid}`}
//               className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer flex justify-between items-center transition"
//               onClick={() => router.push(`/chat/${user.uid}`)}
//             >
//               <div>
//                 <p className="font-semibold text-black dark:text-white flex items-center gap-2">
//                   {user.username}
//                   {user.hasUnread && (
//                     <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full animate-pulse">
//                       New message
//                     </span>
//                   )}
//                 </p>
//                 {/* <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
//                   {user.lastMessage || "No messages yet"}
//                 </p> */}
//               </div>

//               <p className="text-xs text-gray-400 dark:text-gray-500">{user.lastMessageTime}</p>
//             </li>
//           ))}
//         </ul>

//       )}
//     </div>
//   );
// }


// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { db, auth } from "@/firebase/config";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   getDocs,
//   getDoc,
//   doc,
//   limit,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { Menu, Search, Share2, Sparkles } from "lucide-react";
// import BackButton from "@/components/BackButton";

// export default function HomePage() {
//   const [chatUsers, setChatUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [currentUsername, setCurrentUsername] = useState<string>("");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const router = useRouter();
//   const menuRef = useRef<HTMLDivElement>(null);

//   // close dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setMenuOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // auth and username fetch
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setCurrentUserId(user.uid);
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };
//         setCurrentUsername(userData.username || "Unknown");
//       } else {
//         setCurrentUserId(null);
//         setCurrentUsername("");
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // chat realtime updates
//   useEffect(() => {
//     if (!currentUserId) return;

//     const chatsRef = collection(db, "chats");
//     const q = query(chatsRef, where("participants", "array-contains", currentUserId));

//     const unsubscribe = onSnapshot(q, async (snapshot) => {
//       const uniqueUsersMap = new Map<string, any>();

//       for (const chatDoc of snapshot.docs) {
//         const chatData = chatDoc.data();
//         const participants: string[] = chatData.participants || [];
//         const otherUserId = participants.find((id) => id !== currentUserId);
//         if (!otherUserId || uniqueUsersMap.has(otherUserId)) continue;

//         const userDoc = await getDoc(doc(db, "users", otherUserId));
//         const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };

//         const lastMsgQuery = query(
//           collection(db, "messages"),
//           where("chatId", "==", chatDoc.id),
//           orderBy("timestamp", "desc"),
//           limit(1)
//         );
//         const lastMsgSnap = await getDocs(lastMsgQuery);
//         const lastMsg = lastMsgSnap.docs[0]?.data() || { text: "No messages yet" };
//         const lastMessageTime =
//           lastMsg?.timestamp?.toDate?.()?.toLocaleString?.() || "...";

//         uniqueUsersMap.set(otherUserId, {
//           chatId: chatDoc.id,
//           uid: otherUserId,
//           username: userData.username,
//           lastMessage: lastMsg.text,
//           lastMessageTime,
//         });
//       }

//       setChatUsers(Array.from(uniqueUsersMap.values()));
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [currentUserId]);

//   return (
//   <div className="p-6 max-w-xl mx-auto relative">
//     {/* Header */}
//     <div className="flex items-center justify-between mb-3">
//       <BackButton />
//       <h1 className="text-xl font-bold text-gray-800 dark:text-white">MimiChat</h1>

//       <div className="relative" ref={menuRef}>
//         <button
//           onClick={() => setMenuOpen(!menuOpen)}
//           className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//         >
//           <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
//         </button>

//         {menuOpen && (
//           <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
//             <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
//               <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Welcome</p>
//               <p className="font-semibold text-gray-800 dark:text-white">@{currentUsername}</p>
//             </div>

//             <button
//               onClick={() => {
//                 router.push("/new-feature");
//                 setMenuOpen(false);
//               }}
//               className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//             >
//               <Sparkles size={16} />
//               <span>Get a new avatar</span>
//             </button>

//             {/* <button
//               onClick={() => {
//                 router.push("/search");
//                 setMenuOpen(false);
//               }}
//               className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//             >
//               <Search size={16} />
//               <span>Search Users</span>
//             </button> */}

//             <button
//               onClick={() => {
//                 router.push("/share");
//                 setMenuOpen(false);
//               }}
//               className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//             >
//               <Share2 size={16} />
//               <span>Create and share</span>
//             </button>
//           </div>
//         )}
//       </div>
//     </div>

//     {/* 🔍 Search bar below header */}
//     <div className="mb-5">
//       <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
//         <Search className="w-5 h-5 text-gray-500" />
//         <input
//           type="text"
//           placeholder="Search users..."
//           className="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
//           onFocus={() => router.push("/search")}
//           readOnly
//         />
//       </div>
//     </div>

//     {/* Chat List */}
//     {loading ? (
//       <p className="text-gray-500">Loading chats...</p>
//     ) : chatUsers.length === 0 ? (
//       <p className="text-gray-500">No chats yet.</p>
//     ) : (
//       <ul className="space-y-3">
//         {chatUsers.map((user) => (
//           <li
//             key={user.uid}
//             onClick={() => router.push(`/chat/${user.uid}`)}
//             className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center transition"
//           >
//             <span className="font-semibold text-gray-800 dark:text-white">
//               {user.username}
//             </span>
//             <span className="text-xs text-gray-400 dark:text-gray-500">
//               {user.lastMessageTime}
//             </span>
//           </li>
//         ))}
//       </ul>
//     )}
//   </div>
// );

// }



// "use client";

// import { useEffect, useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { db, auth } from "@/firebase/config";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   getDocs,
//   getDoc,
//   doc,
//   limit,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { Menu, Search, Share2, Sparkles, X } from "lucide-react";
// import BackButton from "@/components/BackButton";

// export default function HomePage() {
//   const [chatUsers, setChatUsers] = useState<any[]>([]);
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [currentUsername, setCurrentUsername] = useState<string>("");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [search, setSearch] = useState("");
//   const router = useRouter();
//   const menuRef = useRef<HTMLDivElement>(null);

//   // close dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setMenuOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // auth and username fetch
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         setCurrentUserId(user.uid);
//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };
//         setCurrentUsername(userData.username || "Unknown");
//       } else {
//         setCurrentUserId(null);
//         setCurrentUsername("");
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // chat realtime updates
//   useEffect(() => {
//     if (!currentUserId) return;

//     const chatsRef = collection(db, "chats");
//     const q = query(chatsRef, where("participants", "array-contains", currentUserId));

//     const unsubscribe = onSnapshot(q, async (snapshot) => {
//       const uniqueUsersMap = new Map<string, any>();

//       for (const chatDoc of snapshot.docs) {
//         const chatData = chatDoc.data();
//         const participants: string[] = chatData.participants || [];
//         const otherUserId = participants.find((id) => id !== currentUserId);
//         if (!otherUserId || uniqueUsersMap.has(otherUserId)) continue;

//         const userDoc = await getDoc(doc(db, "users", otherUserId));
//         const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };

//         const lastMsgQuery = query(
//           collection(db, "messages"),
//           where("chatId", "==", chatDoc.id),
//           orderBy("timestamp", "desc"),
//           limit(1)
//         );
//         const lastMsgSnap = await getDocs(lastMsgQuery);
//         const lastMsg = lastMsgSnap.docs[0]?.data() || { text: "No messages yet" };
//         const lastMessageTime =
//           lastMsg?.timestamp?.toDate?.()?.toLocaleString?.() || "...";

//         uniqueUsersMap.set(otherUserId, {
//           chatId: chatDoc.id,
//           uid: otherUserId,
//           username: userData.username,
//           lastMessage: lastMsg.text,
//           lastMessageTime,
//         });
//       }

//       setChatUsers(Array.from(uniqueUsersMap.values()));
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [currentUserId]);

//   // 🔍 Search users dynamically
//   const handleSearch = async (text: string) => {
//     setSearch(text);
//     if (!text.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     setSearchLoading(true);
//     try {
//       const searchLower = text.toLowerCase();
//       const q = query(
//         collection(db, "users"),
//         where("username_lowercase", ">=", searchLower),
//         where("username_lowercase", "<=", searchLower + "\uf8ff")
//       );
//       const querySnapshot = await getDocs(q);
//       const results: any[] = [];
//       querySnapshot.forEach((doc) => {
//         if (doc.id !== currentUserId) {
//           results.push({ uid: doc.id, ...doc.data() });
//         }
//       });
//       setSearchResults(results);
//     } catch (err) {
//       console.error("Error searching users:", err);
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-xl mx-auto relative">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-3">
//         <BackButton />
//         <h1 className="text-xl font-bold text-gray-800 dark:text-white">MimiChat</h1>

//         <div className="relative" ref={menuRef}>
//           <button
//             onClick={() => setMenuOpen(!menuOpen)}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//           >
//             <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
//           </button>

//           {menuOpen && (
//             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
//               <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Welcome</p>
//                 <p className="font-semibold text-gray-800 dark:text-white">@{currentUsername}</p>
//               </div>

//               <button
//                 onClick={() => {
//                   router.push("/new-feature");
//                   setMenuOpen(false);
//                 }}
//                 className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//               >
//                 <Sparkles size={16} />
//                 <span>Get a new avatar</span>
//               </button>

//               <button
//                 onClick={() => {
//                   router.push("/share");
//                   setMenuOpen(false);
//                 }}
//                 className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
//               >
//                 <Share2 size={16} />
//                 <span>Create and share</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 🔍 Search bar inline (like WhatsApp/Telegram) */}
//       <div className="mb-5">
//         <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
//           <Search className="w-5 h-5 text-gray-500" />
//           <input
//             type="text"
//             placeholder="Search users..."
//             value={search}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
//           />
//           {search && (
//             <button onClick={() => setSearch("")}>
//               <X className="w-5 h-5 text-gray-500" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Search Results or Chats */}
// {search ? (
//   <div>
//     {searchLoading ? (
//       <div className="flex flex-col items-center justify-center text-center py-16">
//         <div className="text-5xl animate-spin-slow">👾</div>
//         <p className="mt-3 text-gray-500 text-lg font-medium">
//           Scanning the galaxy for users...
//         </p>
//       </div>
//     ) : searchResults.length > 0 ? (
//       <ul className="space-y-3">
//         {searchResults.map((user) => (
//           <li
//             key={user.uid}
//             onClick={() => router.push(`/chat/${user.uid}`)}
//             className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
//           >
//             <span className="font-semibold text-gray-800 dark:text-white">
//               {user.username}
//             </span>
//           </li>
//         ))}
//       </ul>
//     ) : (
//       <div className="flex flex-col items-center justify-center text-center py-16">
//         <div className="text-5xl animate-bounce">👾</div>
//         <p className="mt-3 text-gray-500 text-lg font-medium">No users found!</p>
//       </div>
//     )}
//   </div>
// ) : loading ? (
//   // 🌌 Fun Loading Screen
//   <div className="flex flex-col items-center justify-center text-center py-20">
//     <div className="text-6xl animate-spin-slow">👾</div>
//     <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg font-medium">
//       {["Calling your friends...", "Fetching cosmic messages...", "Almost there 👽"].map(
//         (msg, i) => (
//           <span key={i} className="block animate-fadeInOut delay-[${i}s]">
//             {msg}
//           </span>
//         )
//       )}
//     </p>
//   </div>
// ) : chatUsers.length === 0 ? (
//   // 🪩 Creative No Chats Screen
//   <div className="flex flex-col items-center justify-center text-center py-20">
//     <div className="text-6xl animate-bounce">👾</div>
//     <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg font-medium">
//       No chats yet!
//     </p>
//     <p className="text-gray-400 text-sm mt-1">Looks like your alien crew hasn’t arrived. Start exploring and meet new beings! 🪐</p>
//   </div>
// ) : (
//   <ul className="space-y-3">
//     {chatUsers.map((user) => (
//       <li
//         key={user.uid}
//         onClick={() => router.push(`/chat/${user.uid}`)}
//         className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center transition"
//       >
//         <span className="font-semibold text-gray-800 dark:text-white">
//           {user.username}
//         </span>
//         <span className="text-xs text-gray-400 dark:text-gray-500">
//           {user.lastMessageTime}
//         </span>
//       </li>
//     ))}
//   </ul>
// )}

//     </div>
//   );
// }

// app/home/page.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import dynamic from "next/dynamic";
// import ChatList from "@/components/ChatList";
// // load ChatPage only on client to avoid SSR/hydration issues (it uses audio/iframes)
// const ChatPage = dynamic(() => import("@/components/ChatPage"), { ssr: false });

// export default function HomePage() {
//   const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//   const [isMobile, setIsMobile] = useState(false);
//   const [mounted, setMounted] = useState(false); // <- prevents SSR/CSR mismatch
//   const router = useRouter();

//   useEffect(() => {
//     // mark mounted (client-only) to avoid rendering window-dependent UI on server
//     setMounted(true);

//     const handleResize = () => setIsMobile(window.innerWidth < 768);
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const handleSelectUser = (id: string) => {
//     if (isMobile) {
//       router.push(`/chat/${id}`); // mobile: keep existing behavior
//     } else {
//       setSelectedUserId(id); // desktop: show right pane
//     }
//   };

//   // Render a small server-matching shell until the client mounts.
//   // This prevents React complaining that server HTML != client HTML.
//   if (!mounted) {
//     return (
//       <div className="flex flex-col md:flex-row h-screen w-full bg-[#0d0d0d] text-white">
//         <div
//           className="
//             w-full md:w-1/3 lg:w-1/4
//             overflow-y-auto h-full
//             bg-[#121212] md:bg-[#f8f9fb]
//             border-r border-gray-800 md:border-gray-200
//             text-gray-300 md:text-gray-900
//             transition-all duration-300
//           "
//         >
//           {/* server shell: ChatList will hydrate on client */}
//         </div>

//         {/* server shell for right panel */}
//         <div className="flex-1 bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#141414]" />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col md:flex-row h-screen w-full bg-[#0d0d0d] text-white">
//       {/* LEFT: responsive sidebar (dark on mobile, light on desktop) */}
//       <div
//         className="
//           w-full md:w-1/3 lg:w-1/4
//           overflow-y-auto h-full
//           bg-[#121212] md:bg-[#f8f9fb]
//           border-r border-gray-800 md:border-gray-200
//           text-gray-300 md:text-gray-900
//           transition-all duration-300
//         "
//       >
//         <ChatList onSelectUser={handleSelectUser} selectedUserId={selectedUserId} />
//       </div>

//       {/* RIGHT: only show on desktop (non-mobile) */}
//       {!isMobile && (
//   <div
//     className="flex-1 flex items-center justify-center 
//                bg-gradient-to-br from-[#ffffff] via-[#f9f9f9] to-[#f3f3f3]"
//   >
//     {selectedUserId ? (
//       <div className="w-full h-full flex items-stretch justify-center">
//         <ChatPage userId={selectedUserId} />
//       </div>
//     ) : (
//       <div className="flex flex-col items-center justify-center text-center p-6 opacity-80">
//       <div className="text-6xl mb-4 animate-pulse">💬</div>
//       <h2 className="text-xl font-semibold text-gray-800">Choose a chat to start messaging</h2>
//       <p className="text-gray-600 mt-2">Select a user from the left panel</p>
//     </div>

//     )}
//   </div>
// )}

//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ChatList from "@/components/ChatList";

const ChatPage = dynamic(() => import("@/components/ChatPage"), { ssr: false });

export default function HomePage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectUser = (id: string) => {
    if (isMobile) {
      router.push(`/chat/${id}`);
    } else {
      setSelectedUserId(id);
    }
  };

  if (!mounted) {
    // 🎉 Centered alien monster with "Loading..."
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#F5F7FF] to-[#EAF0FF] dark:from-gray-900 dark:to-gray-800">
        <div className="text-6xl animate-spin-slow">👾</div>
        <p className="mt-4 text-gray-700 dark:text-gray-200 text-lg font-medium">
          loading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0d0d0d] text-white">
      {/* LEFT: responsive sidebar */}
      <div
        className="
          w-full md:w-1/3 lg:w-1/4
          overflow-y-auto h-full
          bg-[#121212] md:bg-[#f8f9fb]
          border-r border-gray-800 md:border-gray-200
          text-gray-300 md:text-gray-900
          transition-all duration-300
        "
      >
        <ChatList onSelectUser={handleSelectUser} selectedUserId={selectedUserId} />
      </div>

      {/* RIGHT: only show on desktop */}
      {!isMobile && (
        <div
          className="flex-1 flex items-center justify-center 
                     bg-gradient-to-br from-[#ffffff] via-[#f9f9f9] to-[#f3f3f3]"
        >
          {selectedUserId ? (
            <div className="w-full h-full flex items-stretch justify-center">
              <ChatPage userId={selectedUserId} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 opacity-80">
              <div className="text-6xl mb-4 animate-pulse">💬</div>
              <h2 className="text-xl font-semibold text-gray-800">
                Choose a chat to start messaging
              </h2>
              <p className="text-gray-600 mt-2">Select a user from the left panel</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
