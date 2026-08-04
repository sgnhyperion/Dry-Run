

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Menu, Search, Share2, Sparkles, X } from "lucide-react";
import { preloadUsdModule } from "@/usdLoader";

type Props = {
  onSelectUser?: (id: string) => void;
  selectedUserId?: string | null;
};

// Define a structured type for chat users
type ChatUser = {
  chatId: string;
  uid: string;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimestamp: any; // Firestore Timestamp type
  hasUnread: boolean;
};

// Global User Cache to reduce redundant Firestore reads
const userCache: { [key: string]: { username: string } } = {};

// --- UTILITY FUNCTION FOR CHAT LIST DATE FORMATTING ---
const formatLastMessageTime = (timestamp: any): string => {
  if (!timestamp || !timestamp.toDate) return '...';

  // Convert Firestore Timestamp to JavaScript Date
  const date = timestamp.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (dateOnly.getTime() === today.getTime()) {
    // Today: show only time (e.g., 10:30 AM)
    return date.toLocaleTimeString([], timeOptions);
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    // Yesterday: show "Yesterday"
    return 'Yesterday';
  } else if (dateOnly.getFullYear() === now.getFullYear()) {
    // This year: show Month and Day (e.g., Oct 22)
    return date.toLocaleDateString([], dateOptions);
  } else {
    // Older: show full date (e.g., 10/22/24)
    return date.toLocaleDateString();
  }
};
// --------------------------------------------------------


export default function ChatList({ onSelectUser, selectedUserId }: Props) {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [usersStatus, setUsersStatus] = useState<{ [key: string]: { online: boolean, lastSeen: number } }>({});
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadChatIdsRef = useRef<Set<string>>(new Set());


  useEffect(() => {
  if (!currentUserId) return;

  async function fetchRandomSuggestions() {
    try {
      // Get all users except the current user
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers: any[] = [];
      usersSnap.forEach((docSnap) => {
        const userData = docSnap.data();
        // ✅ ADDED CHECK: Ensure username exists and is not an empty string
        if (docSnap.id !== currentUserId && userData.username && userData.username.trim() !== "") {
          allUsers.push({ uid: docSnap.id, ...userData });
        }
      });

      // Get users already in chat
      const chatsSnap = await getDocs(
        query(collection(db, "chats"), where("participants", "array-contains", currentUserId))
      );
      const chattedUserIds = new Set<string>();
      chatsSnap.forEach((chatDoc) => {
        const data = chatDoc.data();
        const others = (data.participants || []).filter((p: string) => p !== currentUserId);
        others.forEach((id: string) => chattedUserIds.add(id));
      });

      // Filter out chatted users
      const newUsers = allUsers.filter((u) => !chattedUserIds.has(u.uid));

      // Randomly select 5
      const shuffled = newUsers.sort(() => 0.5 - Math.random());
      setSuggestedUsers(shuffled.slice(0, 5));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }

  fetchRandomSuggestions();
}, [currentUserId]);


  useEffect(() => {
    // Start downloading USD module as soon as home page loads
    preloadUsdModule()
      .then(() => console.log("✅ USD module preloaded"))
      .catch((err) => console.error("❌ Failed to preload USD module:", err));
  }, []);

  // ✅ Refresh home for SharedArrayBuffer
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.crossOriginIsolated && !sessionStorage.getItem("reloadedOnce")) {
      console.warn("Page not cross-origin isolated. Reloading to enable USD SharedArrayBuffer...");
      sessionStorage.setItem("reloadedOnce", "true");
      const el = document.createElement("div");
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.width = "100%";
      el.style.padding = "12px";
      el.style.textAlign = "center";
      el.style.backgroundColor = "#fcd34d";
      el.style.color = "#1f2937";
      el.style.zIndex = "9999";
      el.innerText = "Loading environment for 3D avatars to work...";
      document.body.appendChild(el);
      window.location.reload();
    }
  }, []);

  // Auth check useEffect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCheckingAuth(false);
      } else {
        router.replace("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch current user info useEffect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { username: "Unknown" };
        setCurrentUsername(userData.username || "Unknown");
      } else {
        setCurrentUserId(null);
        setCurrentUsername("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click useEffect
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ OPTIMIZED: Fetch chats + last messages + unread
  useEffect(() => {
    if (!currentUserId) return;

    const chatsRef = collection(db, "chats");
    const chatsQuery = query(chatsRef, where("participants", "array-contains", currentUserId));

    // 1. Unread Messages Listener
    const unreadQuery = query(
      collection(db, "messages"),
      where("receiver", "==", currentUserId),
      where("seen", "==", false)
    );

    const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
      const unreadChats = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        unreadChats.add(data.chatId);
      });
      unreadChatIdsRef.current = unreadChats;

      setChatUsers((prev) =>
        prev.map((chat) => ({
          ...chat,
          hasUnread: unreadChats.has(chat.chatId),
        }))
      );
    });

    // 2. Chat List Listener (Optimized)
    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      const chatDocs = snapshot.docs;
      const otherUserIds = new Set<string>();
      
      // First pass: Collect all unique other user IDs
      for (const chatDoc of chatDocs) {
        const chatData = chatDoc.data();
        const participants: string[] = chatData.participants || [];
        const otherUserId = participants.find((id) => id !== currentUserId);
        if (otherUserId && !userCache[otherUserId]) {
          otherUserIds.add(otherUserId);
        }
      }
      
      // Second pass (Optimized): Fetch all missing user data in parallel
      if (otherUserIds.size > 0) {
        const userPromises = Array.from(otherUserIds).map(id => getDoc(doc(db, "users", id)));
        const userSnaps = await Promise.all(userPromises);
        
        userSnaps.forEach(userDoc => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userCache[userDoc.id] = { username: userData.username || "Unknown" };
          }
        });
      }

      // Third pass: Construct the final chat list using cached/fetched data
      const chatsArray: ChatUser[] = chatDocs
        .map((chatDoc) => {
          const chatData = chatDoc.data();
          const participants: string[] = chatData.participants || [];
          const otherUserId = participants.find((id) => id !== currentUserId);

          if (!otherUserId) return null;

          const userData = userCache[otherUserId] || { username: "Unknown" };

          // Assume 'lastMessageText' and 'lastMessageTimestamp' are denormalized on 'chats' doc
          // const lastMsgText = chatData.lastMessageText || "No messages yet";
          const lastMsgTimestamp = chatData.lastMessageTimestamp || null;
          
          // --- FIX: Use the new utility function for date formatting ---
          const lastMsgTime = formatLastMessageTime(lastMsgTimestamp); 
          // -------------------------------------------------------------

          return {
            chatId: chatDoc.id,
            uid: otherUserId,
            username: userData.username,
            // lastMessage: lastMsgText,
            lastMessageTime: lastMsgTime,
            lastMessageTimestamp: lastMsgTimestamp,
            hasUnread: unreadChatIdsRef.current.has(chatDoc.id),
          };
        })
        .filter((chat): chat is ChatUser => chat !== null); // Filter out nulls

      // Sort by the denormalized timestamp
      chatsArray.sort((a, b) => {
        const tA = a.lastMessageTimestamp?.toMillis?.() || 0;
        const tB = b.lastMessageTimestamp?.toMillis?.() || 0;
        return tB - tA;
      });

      setChatUsers(chatsArray);
      setLoading(false);
    });

    return () => {
      unsubscribeChats();
      unsubscribeUnread();
    };
  }, [currentUserId]);

  // Listen to all users' online/offline updates useEffect remains the same
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const statusMap: { [key: string]: { online: boolean; lastSeen: number } } = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.online !== undefined) {
          statusMap[doc.id] = { online: data.online, lastSeen: data.lastSeen || 0 };
        }
      });
      setUsersStatus(statusMap);
    });
    return () => unsubscribe();
  }, []);

  // handleSearch remains the same
  const handleSearch = async (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const searchLower = text.toLowerCase();
      // NOTE: For better search performance, consider using a dedicated search service 
      // like Algolia or a more advanced Firestore search index if your user base grows large.
      const q = query(
        collection(db, "users"),
        where("username_lowercase", ">=", searchLower),
        where("username_lowercase", "<=", searchLower + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) results.push({ uid: doc.id, ...doc.data() });
      });
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // handleLogout remains the same
  const handleLogout = () => {
    setLoggingOut(true);
    auth.signOut()
      .then(() => router.replace("/login"))
      .catch((err) => {
        console.error("Logout failed:", err);
        setLoggingOut(false);
      });
  };

  // handleUserClick remains the same
  const handleUserClick = async (id: string) => {
    if (!currentUserId) return;

    const chat = chatUsers.find(c => c.uid === id);
    if (chat) {
      const unreadQuery = query(
        collection(db, "messages"),
        where("chatId", "==", chat.chatId),
        where("receiver", "==", currentUserId),
        where("seen", "==", false),
        where("type", "==", "3d")

      );
      const unreadSnap = await getDocs(unreadQuery);
      // Batch writes are often better here if many documents need updating, but this is fine for a few.
      unreadSnap.forEach(async (msgDoc) => await updateDoc(msgDoc.ref, { seen: true }));

      setChatUsers(prev => prev.map(c => (c.uid === id ? { ...c, hasUnread: false } : c)));
    }

    if (onSelectUser) onSelectUser(id);
    else router.push(`/chat/${id}`);
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#F5F7FF] to-[#EAF0FF] dark:from-gray-900 dark:to-gray-800">
        <div className="text-6xl animate-spin-slow">👾</div>
        <p className="mt-4 text-gray-700 dark:text-gray-200 text-lg font-medium">loading...</p>
      </div>
    );
  }

//   return (
//     <div className="p-4 md:p-3 overflow-y-auto h-full bg-gray-100 md:bg-transparent dark:bg-gray-900">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-3">
//         <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">MimiChat</h1>

//         <div className="relative" ref={menuRef}>
//           <button
//             onClick={() => setMenuOpen(!menuOpen)}
//             className={`p-2 rounded-md transition-colors ${
//               menuOpen
//                 ? "bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-900"
//                 : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
//             } hover:bg-gray-300 dark:hover:bg-gray-700 md:text-gray-800 md:hover:bg-gray-200`}
//           >
//             <Menu className="w-6 h-6" />
//           </button>

//           {menuOpen && (
//             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
//               <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Welcome</p>
//                 <p className="font-semibold text-gray-800 dark:text-white">{currentUsername}</p>
//               </div>

//               {/* <button onClick={() => router.push("/new-feature")} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition">
//                 <Sparkles size={16} /><span>Coming soon</span>
//               </button> */}

//               <button onClick={() => router.push("/share")} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition">
//                 <Share2 size={16} /><span>Create and share</span>
//               </button>

//               <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-lg transition">
//                 <span>Logout</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Search */}
//       <div className="mb-4">
//         <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
//           <Search className="w-5 h-5 text-gray-500" />
//           <input
//             type="text"
//             placeholder="Search users..."
//             value={search}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
//           />
//           {search && <button onClick={() => setSearch("")}><X className="w-5 h-5 text-gray-500" /></button>}
//         </div>
//       </div>

//       {/* 🔹 Suggestions Section */}
// {suggestedUsers.length > 0 && (
//   <div className="mb-6">
//     <h2 className="text-gray-600 dark:text-gray-300 font-semibold mb-2">Suggestions</h2>
//     <div className="flex gap-4 overflow-x-auto pb-2">
//       {suggestedUsers.map((user) => (
//         <div
//           key={user.uid}
//           onClick={() => handleUserClick(user.uid)}
//           className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
//         >
//           <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
//             {user.username?.[0]?.toUpperCase() || "?"}
//           </div>
//           <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 truncate w-16 text-center">
//             {user.username}
//           </p>
//         </div>
//       ))}
//     </div>
//   </div>
// )}


//       {/* Chat List / Search Results */}
//       {search ? (
//         searchLoading ? (
//           <LoadingState text="Scanning the galaxy for users..." />
//         ) : searchResults.length > 0 ? (
//           <ul className="space-y-2">
//             {searchResults.map((user) => (
//               // NEW CODE (Inside the searchResults.map)
// <li 
//   key={user.uid} 
//   onClick={() => handleUserClick(user.uid)} 
//   className="group flex items-center gap-3 p-3 bg-gray-100 md:bg-white dark:bg-gray-900 border border-gray-200 md:border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:shadow-md hover:scale-[1.01] hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
// >
//   <div className="flex items-center gap-3">
//     {/* 🌟 PFP INITIAL HERE 🌟 */}
//     <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-lg bg-gray-400 dark:bg-gray-700">
//       {/* Extracting the first letter and making it uppercase */}
//       {user.username?.[0]?.toUpperCase() || "?"} 
//     </div>
    
//     <div className="flex flex-col">
//       <div className="flex items-center gap-2">
//         <span className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">
//           {user.username}
//         </span>
//         {/* Optional: Add online status if you want it in search results too */}
//         {usersStatus[user.uid]?.online && <span className="w-3 h-3 rounded-full bg-green-500" title="Online" />}
//       </div>
//     </div>
//   </div>
// </li>
//             ))}
//           </ul>
//         ) : (
//           <EmptyState text="No users found!" />
//         )
//       ) : loading ? (
//         <LoadingState text="Fetching cosmic messages..." />
//       ) : chatUsers.length === 0 ? (
//         <EmptyState text="No chats yet! Your 3D avatars are standing by. Step in, explore, and make some virtual friends! 🎮" />
//       ) : (
//         <ul className="space-y-2">
//           {chatUsers.map((user) => (
//             <li key={user.uid} onClick={() => handleUserClick(user.uid)}
//               className={`group flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border shadow-sm ${
//                 selectedUserId === user.uid
//                   ? "bg-gray-100 md:bg-gray-100 dark:bg-gray-800 border-gray-200 md:border-gray-300 dark:border-gray-700 scale-[1.01]"
//                   : "bg-gray-100 md:bg-white dark:bg-gray-900 border-gray-200 md:border-gray-300 dark:border-gray-700 hover:shadow-md hover:scale-[1.01] hover:bg-gray-200 dark:hover:bg-gray-800"
//               }`}
//             >
//               <div className="flex items-center gap-3">
//                 <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-lg ${
//                   user.hasUnread ? "bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" : "bg-gray-400 dark:bg-gray-700"
//                 }`}>
//                   {user.username?.[0]?.toUpperCase() || "?"}
//                 </div>
//                 <div className="flex flex-col">
//                   <div className="flex items-center gap-2">
//                     <span className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">{user.username}</span>
//                     {usersStatus[user.uid]?.online && <span className="w-3 h-3 rounded-full bg-green-500" title="Online" />}
//                   </div>
//                   {/* <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
//                     {user.lastMessage}
//                   </p> */}
//                 </div>
//               </div>
//               <div className="flex flex-col items-end gap-1">
//                 <span className="text-xs text-gray-400 dark:text-gray-500">{user.lastMessageTime}</span>
//                 {user.hasUnread && <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full shadow-sm">New</span>}
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}


//       {loggingOut && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//           <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
//             <div className="text-6xl animate-spin-slow">👾</div>
//             <p className="mt-4 text-gray-700 dark:text-gray-200 text-lg font-medium">Logging out...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
return (
  <div className="p-4 md:p-3 overflow-y-auto h-full bg-gray-100 md:bg-transparent dark:bg-gray-900">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">MimiChat</h1>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-md transition-colors ${
            menuOpen
              ? "bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-900"
              : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          } hover:bg-gray-300 dark:hover:bg-gray-700 md:text-gray-800 md:hover:bg-gray-200`}
        >
          <Menu className="w-6 h-6" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Welcome</p>
              <p className="font-semibold text-gray-800 dark:text-white">{currentUsername}</p>
            </div>

            <button
              onClick={() => router.push("/share")}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <Share2 size={16} />
              <span>Create and share</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-lg transition"
            >
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Search */}
    <div className="mb-4">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>

    {/* 🔹 Suggestions Section */}
    {suggestedUsers.length > 0 && (
      <div className="mb-6">
        <h2 className="text-gray-600 dark:text-gray-300 font-semibold mb-2">Suggestions</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {suggestedUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => handleUserClick(user.uid)}
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.username?.[0]?.toUpperCase() || "?"}
                </div>
                {usersStatus[user.uid]?.online && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                    title="Online"
                  />
                )}
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 truncate w-16 text-center">
                {user.username}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Chat List / Search Results */}
    {search ? (
      searchLoading ? (
        <LoadingState text="Scanning the galaxy for users..." />
      ) : searchResults.length > 0 ? (
        <ul className="space-y-2">
          {searchResults.map((user) => (
            <li
              key={user.uid}
              onClick={() => handleUserClick(user.uid)}
              className="group flex items-center gap-3 p-3 bg-gray-100 md:bg-white dark:bg-gray-900 border border-gray-200 md:border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:shadow-md hover:scale-[1.01] hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-lg bg-gray-400 dark:bg-gray-700">
                    {user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  {usersStatus[user.uid]?.online && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                      title="Online"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">
                    {user.username}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="No users found!" />
      )
    ) : loading ? (
      <LoadingState text="Fetching cosmic messages..." />
    ) : chatUsers.length === 0 ? (
      <EmptyState text="No chats yet! Your 3D avatars are standing by. Step in, explore, and make some virtual friends! 🎮" />
    ) : (
      <ul className="space-y-2">
        {chatUsers.map((user) => (
          <li
            key={user.uid}
            onClick={() => handleUserClick(user.uid)}
            className={`group flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border shadow-sm ${
              selectedUserId === user.uid
                ? "bg-gray-100 md:bg-gray-100 dark:bg-gray-800 border-gray-200 md:border-gray-300 dark:border-gray-700 scale-[1.01]"
                : "bg-gray-100 md:bg-white dark:bg-gray-900 border-gray-200 md:border-gray-300 dark:border-gray-700 hover:shadow-md hover:scale-[1.01] hover:bg-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-lg ${
                    user.hasUnread
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"
                      : "bg-gray-400 dark:bg-gray-700"
                  }`}
                >
                  {user.username?.[0]?.toUpperCase() || "?"}
                </div>
                {usersStatus[user.uid]?.online && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                    title="Online"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-500 transition-colors">
                  {user.username}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">{user.lastMessageTime}</span>
              {user.hasUnread && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full shadow-sm">
                  New
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}

    {loggingOut && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
          <div className="text-6xl animate-spin-slow">👾</div>
          <p className="mt-4 text-gray-700 dark:text-gray-200 text-lg font-medium">Logging out...</p>
        </div>
      </div>
    )}
  </div>
);



}

// 🔹 Loading / Empty states
function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="text-6xl animate-spin-slow">👾</div>
      <p className="mt-4 text-gray-500 text-lg font-medium">{text}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="text-6xl animate-bounce">👾</div>
      <p className="mt-4 text-gray-500 text-lg font-medium">{text}</p>
    </div>
  );
}
