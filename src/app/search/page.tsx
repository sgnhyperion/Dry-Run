"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth } from "@/firebase/auth";
import { app } from "@/firebase/config";
import BackButton from '@/components/BackButton';

const db = getFirestore(app);

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [recentChats, setRecentChats] = useState<{ id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // ✅ Ensures this component only renders on the client
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch recent chats from Firestore
  useEffect(() => {
    if (!hydrated) return; // Ensure it runs only after hydration

    const fetchRecentChats = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const chatUsers: { id: string; username: string }[] = [];

        for (const chatDoc of querySnapshot.docs) {
          const data = chatDoc.data();
          const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
          
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            if (userDoc.exists()) {
              chatUsers.push({ id: otherUserId, username: userDoc.data().username || "Unknown" });
            }
          }
        }

        setRecentChats(chatUsers);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChats();
  }, [hydrated]);

  // Search for users in Firestore
  // const handleSearch = async () => {
  //   if (!search.trim()) return;

  //   setLoading(true);

  //   try {
  //     const q = query(collection(db, "users"), where("username", ">=", search), where("username", "<=", search + "\uf8ff"));
  //     const querySnapshot = await getDocs(q);

  //     const results: { id: string; username: string }[] = querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       username: doc.data().username
  //     }));

  //     setUsers(results);
  //   } catch (error) {
  //     console.error("Error searching users:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSearch = async () => {
  if (!search.trim()) return;

  setLoading(true);

  try {
    const searchLower = search.toLowerCase();

    const q = query(
      collection(db, "users"),
      where("username_lowercase", ">=", searchLower),
      where("username_lowercase", "<=", searchLower + "\uf8ff")
    );

    const querySnapshot = await getDocs(q);

    const seen = new Set();
    const results: { id: string; username: string }[] = [];

    querySnapshot.forEach((doc) => {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        results.push({
          id: doc.id,
          username: doc.data().username,
        });
      }
    });

    setUsers(results);
  } catch (error) {
    console.error("Error searching users:", error);
  } finally {
    setLoading(false);
  }
};


  // ✅ Prevent rendering until hydration is complete
  if (!hydrated) return null;

  // return (
  //   <div className="flex flex-col items-center p-4">
  //     <BackButton/>
  //     <h2 className="text-2xl font-bold mb-4">Search Users</h2>
      
  //     <input
  //       type="text"
  //       placeholder="Enter username..."
  //       value={search}
  //       onChange={(e) => setSearch(e.target.value)}
  //       className="border px-3 py-2 rounded-md"
  //     />
      
  //     <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2">
  //       Search
  //     </button>

  //     {loading && <p className="text-gray-500 mt-3">Loading...</p>}

  //     {/* Search Results */}
  //     {users.length > 0 && !loading && (
  //       <div className="mt-4 w-full">
  //         <h3 className="text-lg font-semibold">Search Results:</h3>
  //         <ul>
  //           {users.map((user) => (
  //             <li key={user.id} className="border p-2 rounded-md mt-2 cursor-pointer hover:bg-gray-100" 
  //                 onClick={() => router.push(`/chat/${user.id}`)}>
  //               {user.username}
  //             </li>
  //           ))}
  //         </ul>
  //       </div>
  //     )}

  //     {/* Recent Chats */}
  //     {/* {recentChats.length > 0 && !loading && (
  //       <div className="mt-6 w-full">
  //         <h3 className="text-lg font-semibold">Recent Chats:</h3>
  //         <ul>
  //           {recentChats.map((chat) => (
  //             <li key={chat.id} className="border p-2 rounded-md mt-2 cursor-pointer hover:bg-gray-100" 
  //                 onClick={() => router.push(`/chat/${chat.id}`)}>
  //               {chat.username}
  //             </li>
  //           ))}
  //         </ul>
  //       </div>
  //     )} */}

  //     {!loading && recentChats.length === 0 && users.length === 0 && (
  //       <p className="text-gray-500 mt-4">No users found.</p>
  //     )}
  //   </div>
  // );

  return (
  <div className="flex flex-col p-4 items-center">
    
    {/* Back button aligned left */}
    <div className="w-full flex justify-start mb-4">
      <BackButton />
    </div>

    {/* Page header */}
    <h2 className="text-2xl font-bold mb-4">Search Users</h2>

    {/* Search input */}
    <input
      type="text"
      placeholder="Enter username..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border px-3 py-2 rounded-md w-full max-w-md text-black"
    />

    {/* Search button */}
    <button
      onClick={handleSearch}
      className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
    >
      Search
    </button>

    {loading && <p className="text-gray-500 mt-3">Loading...</p>}

    {/* Search Results */}
    {users.length > 0 && !loading && (
      <div className="mt-4 w-full max-w-md">
        <h3 className="text-lg font-semibold">Search Results:</h3>
        <ul>
          {users.map((user) => (
            <li
              key={user.id}
              className="border p-2 rounded-md mt-2 cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/chat/${user.id}`)}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* No users message */}
    {!loading && recentChats.length === 0 && users.length === 0 && (
      <p className="text-gray-500 mt-4">No users found.</p>
    )}
  </div>
);

};


export default HomePage;


