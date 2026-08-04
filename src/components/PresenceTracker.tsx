
"use client";

import { useEffect, useState } from "react";
// Ensure these imports point to your actual Firebase client configuration
import { auth } from "@/firebase/config"; 
import { onAuthStateChanged } from "firebase/auth";
import { io, Socket } from "socket.io-client"; 

const SOCKET_SERVER_URL = "https://socket.mimichat.space"; // Must match your server's URL

export default function PresenceTracker() {
  const [uid, setUid] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 1. Track logged-in user and get UID
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // 2. Socket.io Connection Logic
  useEffect(() => {
    if (!uid) {
        // Ensure any old socket is closed if user logs out
        socket?.disconnect(); 
        setSocket(null);
        return;
    }
    
    let activeSocket: Socket | null = null;
    
    const connectSocket = async () => {
        // A. Get the secure Firebase ID Token
        const idToken = await auth.currentUser?.getIdToken();

        if (!idToken) {
            console.error("No ID Token found. Cannot connect to presence server.");
            return;
        }

        // B. Connect to the Socket.io server, passing the token in the 'auth' object
        activeSocket = io(SOCKET_SERVER_URL, {
            // Token passed securely here
            auth: { token: idToken }, 
            transports: ['websocket'],
            reconnectionAttempts: 5 
        });

        activeSocket.on("connect", () => {
            console.log(`Presence Tracker: Connected as ${uid}`);
        });

        activeSocket.on("disconnect", (reason) => {
            console.log(`Presence Tracker: Disconnected. Reason: ${reason}`);
        });

        activeSocket.on("auth_error", (message) => {
            console.error(`Presence Tracker Auth Error: ${message}`);
            // Force sign out if server rejects token
            auth.signOut(); 
        });

        setSocket(activeSocket);
    };

    connectSocket();

    // 3. Cleanup: Disconnect the socket when the component unmounts (tab closes/refresh)
    return () => {
        if (activeSocket) {
            activeSocket.disconnect();
            console.log("Presence Tracker: Cleanup - Socket disconnected.");
        }
    };
  }, [uid]);

  // The component renders nothing, it's just a side effect handler
  return null;
}