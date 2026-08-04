
// import { NextApiRequest, NextApiResponse } from "next";
// import admin from "firebase-admin";
// // ❌ Replaced old User model import with the correct ApiKey model import
// import ApiKey from "@/models/ApiKey"; 
// import connectToDatabase from "@/lib/mongo"; 

// // --- Firebase Admin Initialization ---
// try {
//   if (!admin.apps.length) {
//     console.log("Initializing Firebase Admin...");
    
//     // Keeping .trim() for robust environment variable parsing
//     admin.initializeApp({
//       credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!.trim())),
//     });
//     console.log("Firebase Admin initialized ✅");
//   }
// } catch (e) {
//   console.error("Firebase Admin init failed:", e);
//   // Re-throw to prevent the application from starting in an insecure/broken state
//   throw new Error("Firebase Admin SDK failed to initialize. Check FIREBASE_ADMIN_KEY.");
// }

// // --- Next.js Pages Router Handler ---
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   try {
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader) {
//       return res.status(401).json({ error: "No token" });
//     }

//     const token = authHeader.replace("Bearer ", "");
    
//     // 1. Verify Token and get UID
//     const decoded = await admin.auth().verifyIdToken(token);
//     const uid = decoded.uid;

//     await connectToDatabase();
    
//     // 2. CRITICAL FIX: Query the correct ApiKey model (which searches the 'apikeys' collection)
//     const userKeys = await ApiKey.find({ userId: uid })
//                                  // Sort by expiry to prioritize the most current subscription
//                                  .sort({ expiresAt: -1 });

//     // 3. Select the best/active key record
//     const activeKeyRecord = userKeys.find(k => k.key && k.status === "active");

//     // 4. Respond based on API Key Status
//     if (!activeKeyRecord) {
//       // 200 OK: User authenticated, but no valid key found in the 'apikeys' collection
//       return res.status(200).json({ apiKey: null, plan: "free" });
//     }

//     // 5. Success Response (Active API Key Found)
//     return res.status(200).json({
//       apiKey: activeKeyRecord.key, 
//       plan: activeKeyRecord.plan, 
//       expiresAt: activeKeyRecord.expiresAt,
//     });

//   } catch (err) {
//     // 6. Handle Errors
//     console.error("API KEY ERROR:", err);
    
//     // Return 401 for token issues, ensuring a JSON response
//     return res.status(401).json({ error: "Authentication failed or server error." }); 
//   }
// }


// /pages/api/route.ts

import { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";
import ApiKey from "@/models/ApiKey"; 
import connectToDatabase from "@/lib/mongo"; 

// --- Firebase Admin Initialization ---
// NOTE: This must run successfully for token verification to work.
try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin...");
    
    // Keeping .trim() for robust environment variable parsing
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!.trim())),
    });
    console.log("Firebase Admin initialized ✅");
  }
} catch (e) {
  console.error("Firebase Admin init failed:", e);
  // Re-throw to prevent the application from starting in an insecure/broken state
  throw new Error("Firebase Admin SDK failed to initialize. Check FIREBASE_ADMIN_KEY.");
}

// --- Next.js Pages Router Handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    // Check for Authorization header presence and format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token or invalid format" });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // 1. Verify Token and get UID (This is the failure point)
    // If the token is invalid, expired, or the Admin SDK is misconfigured, this line throws.
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    await connectToDatabase();
    
    // 2. Query the active API key
    const userKeys = await ApiKey.find({ userId: uid })
                                 .sort({ expiresAt: -1 });

    // 3. Select the best/active key record
    const activeKeyRecord = userKeys.find(k => k.key && k.status === "active");

    // 4. Respond based on API Key Status
    if (!activeKeyRecord) {
      // 200 OK: User authenticated, but no valid key found 
      return res.status(200).json({ apiKey: null, plan: "free" });
    }

    // 5. Success Response (Active API Key Found)
    return res.status(200).json({
      apiKey: activeKeyRecord.key, 
      plan: activeKeyRecord.plan, 
      expiresAt: activeKeyRecord.expiresAt,
    });

  } catch (err) {
    // 💥 CRITICAL DEBUGGING: LOG THE SPECIFIC FIREBASE ERROR
    // This output in your server terminal will tell you why the 401 is happening.
    console.error("TOKEN VERIFICATION FAILED. RAW ERROR:", (err as Error).message);
    
    // 6. Return 401 for token issues
    return res.status(401).json({ error: "Authentication failed. Check server logs for specific token error." }); 
  }
}