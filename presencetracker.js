// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// --- CONFIGURATION ---
// 1. Path to your Firebase Admin Service Account Key
const serviceAccount = require('./see-you-7ffec-firebase-adminsdk-ntqnb-617184660b.json');
const CLIENT_ORIGIN = 'https://mimichat.space'; // Replace with your client URL
const PORT = 3001;

// Initialize Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with required CORS settings
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- SOCKET.IO CONNECTION LOGIC ---

io.on('connection', async (socket) => {
    const idToken = socket.handshake.auth.token;
    let uid = null;

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
    } catch (error) {
        console.error("Socket Connection Rejected: Invalid or expired token.", error.message);
        socket.emit('auth_error', 'Invalid or expired authentication token.');
        return socket.disconnect(true);
    }

    // Authentication Successful
    console.log(`User ${uid} connected.`);
    const userRef = db.collection('users').doc(uid);

    // 3. Mark User ONLINE immediately in Firestore (FIX: Using set with merge)
    try {
        await userRef.set({
            online: true,
            lastActive: FieldValue.serverTimestamp(),
            lastSeen: FieldValue.serverTimestamp(),
            socketId: socket.id 
        }, { merge: true }); // <--- FIX APPLIED HERE
    } catch (err) {
        // You should now see an error here ONLY if there's a network or permission issue
        console.error(`Error setting user ${uid} online:`, err.message);
    }

    // 4. The CRITICAL Disconnection Hook
    socket.on('disconnect', async (reason) => {
        console.log(`User ${uid} disconnected. Reason: ${reason}`);

        // Mark User OFFLINE in Firestore (FIX: Using set with merge)
        try {
            await userRef.set({
                online: false,
                lastActive: FieldValue.serverTimestamp(),
                lastSeen: FieldValue.serverTimestamp(),
                socketId: null
            }, { merge: true }); // <--- FIX APPLIED HERE
        } catch (err) {
            // You should now see an error here ONLY if there's a network or permission issue
            console.error(`Error setting user ${uid} offline:`, err.message);
        }
    });
});

// --- START SERVER ---
server.listen(PORT, () => console.log(`🚀 Presence Server running on http://localhost:${PORT}`));