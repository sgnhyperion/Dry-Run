

// import type { NextApiRequest, NextApiResponse } from "next";
// import { getFirestore, collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
// import { app } from "@/firebase/config";

// const db = getFirestore(app);
// const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
// const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;
// const BASE_URL = "https://mimichat.space";

// /* ---------------- POLLING HELPER ---------------- */
// async function waitForVideoReady(messageId: string, timeoutMs = 300000) { // default 5 min
//   const start = Date.now();

//   while (Date.now() - start < timeoutMs) {
//     const snap = await getDoc(doc(db, "shared", messageId));
//     const data = snap.data();

//     if (data?.videoUrl && data.status === "done") {
//       return data.videoUrl;
//     }

//     // wait 2 seconds before checking again
//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }

//   throw new Error("Timeout waiting for video to be ready");
// }

// /* ---------------- HELPERS ---------------- */
// async function sendTelegramMessage(chatId: number, text: string) {
//   try {
//     await fetch(`${TELEGRAM_API}/sendMessage`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ chat_id: chatId, text }),
//     });
//   } catch (e) {
//     console.error("Telegram error:", e);
//   }
// }

// /* ---------------- HANDLER ---------------- */
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") return res.status(405).json({ ok: false });

//   // 1. Secret Validation (X-Telegram-Bot-Api-Secret-Token)
//   const secret = req.headers["x-telegram-bot-api-secret-token"];
//   if (TELEGRAM_SECRET && secret !== TELEGRAM_SECRET) {
//     return res.status(401).json({ ok: false });
//   }

//   const update = req.body;
//   const message = update.message;
//   const chatId = message?.chat.id;
//   const rawText = message?.text;
//   const username = message?.from?.username || "Telegram User";

//   // Ignore non-text messages
//   if (!rawText || !chatId) return res.status(200).json({ ok: true });

//   // 🚀 Step A: Acknowledge Telegram IMMEDIATELY (Prevents Telegram from retrying)
//   res.status(200).json({ ok: true });

//   // 🛠️ Step B: Start Background Rendering
//   (async () => {
//     try {
//       let text = rawText.trim();
//       let gender = "male";
//       let model = "boy2.usd";

//       // 🔍 COMMAND & GENDER PARSING
//       if (text.toLowerCase().startsWith("/female")) {
//         gender = "female";
//         model = "girl.usd";
//         text = text.replace(/^\/female\s*/i, ""); 
//       } 
//       else if (text.toLowerCase().startsWith("/male")) {
//         gender = "male";
//         model = "boy2.usd";
//         text = text.replace(/^\/male\s*/i, "");
//       } 
//       else if (text.startsWith("/")) {
//         text = text.replace(/^\/[^\s]+\s*/i, ""); 
//       }

//       // Final check: if the user sent ONLY a command or empty slash
//       if (!text || text.length === 0) {
//         await sendTelegramMessage(chatId, "⚠️ Please provide a message! \nExample: /female Hello there!");
//         return;
//       }

//       // 2. Create Firestore Entry
//       const docRef = await addDoc(collection(db, "shared"), {
//         sender: `telegram_${chatId}`,
//         senderName: username,
//         timestamp: new Date(),
//         text: text,
//         avatarModel: model,
//         emotion: "joy",
//         status: "processing"
//       });

//       await sendTelegramMessage(chatId, `⏳ Rendering your ${gender} avatar... Please wait a moment.`);

//       // 3. TTS (Text-to-Speech)
//       const ttsRes = await fetch(`${BASE_URL}/api/next`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text, messageId: docRef.id, gender, emotion: "Conversational" }),
//       });
//       const ttsData = await ttsRes.json();
//       const audioUrl = `/audio/${ttsData.audioPath}`;

//       // 4. Audio2Face (Lip Sync Generation)
//       await fetch(`${BASE_URL}/api/audio2face`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           audioFilePath: ttsData.audioPath,
//           outputDir: "D:/chat-avatar-app/public/usd_files",
//           messageId: docRef.id,
//           emotion: "joy",
//           gender,
//           model,
//           directoryAudio: "D:/chat-avatar-app/public/audio",
//         }),
//       });

//       // 5. Trigger Video Rendering
//       const usdUrl = `${BASE_URL}/usd_files/cache_${docRef.id}_cache.usd`;
//       const shareUrl = `${BASE_URL}/view/${docRef.id}`;
      
//       try {
//         await fetch(`${BASE_URL}/api/generate-video`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ messageId: docRef.id, usdUrl, audioUrl }),
//           signal: AbortSignal.timeout(300000) // 5 min
//         });
//       } catch (fetchErr) {
//         console.log("[Background] Render triggered, proceeding to polling wait...");
//       }

//       // 6. Wait until the video is actually ready
//       let finalVideoUrl: string;
//       try {
//         finalVideoUrl = await waitForVideoReady(docRef.id, 300000); // wait up to 5 min
//       } catch (err) {
//         console.error("[VIDEO TIMEOUT]", err);
//         await sendTelegramMessage(chatId, "❌ Video is taking too long to render. Please try again later.");
//         return;
//       }

//       // 7. Update Firestore (optional)
//       await updateDoc(doc(db, "shared", docRef.id), {
//         usdUrl,
//         audioUrl,
//         shareUrl,
//       });

//       // 8. Send Result to Telegram
//       const telegramRes = await fetch(`${TELEGRAM_API}/sendVideo`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           chat_id: chatId,
//           video: finalVideoUrl,
//           caption: `🎭 Done! Here is your ${gender} 3D message.\n\n🔗 Web Link: ${shareUrl}`,
//         }),
//       });

//       // Fallback: send text link if video fails
//       if (!telegramRes.ok) {
//         const errData = await telegramRes.json();
//         console.error("Telegram Video Send Failed:", errData);
//         await sendTelegramMessage(chatId, `🎭 Your video is ready! You can view and download it here: ${shareUrl}`);
//       }

//     } catch (err) {
//       console.error("[CRITICAL BACKGROUND ERROR]", err);
//       await sendTelegramMessage(chatId, "❌ Sorry, the rendering process encountered an error. Please try again later.");
//     }
//   })();
// }



import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { app } from "@/firebase/config";

const db = getFirestore(app);
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET;
const BASE_URL = "https://mimichat.space";

/* ---------------- HELPERS ---------------- */
async function waitForVideoReady(messageId: string, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const snap = await getDoc(doc(db, "shared", messageId));
    const data = snap.data();
    if (data?.videoUrl && data.status === "done") return data.videoUrl;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("Timeout waiting for video to be ready");
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

/* ---------------- HANDLER ---------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const secret = req.headers["x-telegram-bot-api-secret-token"];
  if (TELEGRAM_SECRET && secret !== TELEGRAM_SECRET) {
    return res.status(401).json({ ok: false });
  }

  const update = req.body;
  const message = update.message;
  const chatId = message?.chat.id;
  const rawText = message?.text;
  const username = message?.from?.username || "Telegram User";

  if (!rawText || !chatId) return res.status(200).json({ ok: true });

  // 🚀 Step A: Acknowledge Telegram IMMEDIATELY
  res.status(200).json({ ok: true });

  // 🛠️ Step B: Start Background Rendering
  (async () => {
    try {
      // 1. SPAM PREVENTION: Check if user has a job currently "processing"
      const q = query(
        collection(db, "shared"),
        where("sender", "==", `telegram_${chatId}`),
        where("status", "==", "processing"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const activeJob = querySnapshot.docs[0].data();
        const jobStartTime = activeJob.timestamp?.toDate().getTime() || 0;
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

        // If a job started less than 10 mins ago and is still "processing", ignore this new request.
        if (jobStartTime > tenMinutesAgo) {
          console.log(`[IGNORE] User ${chatId} already has an active render.`);
          return; 
        }
      }

      // 🔍 COMMAND & GENDER PARSING
      let text = rawText.trim();
      let gender = "male";
      let model = "boy2.usd";

      if (text.toLowerCase().startsWith("/female")) {
        gender = "female";
        model = "girl.usd";
        text = text.replace(/^\/female\s*/i, ""); 
      } else if (text.toLowerCase().startsWith("/male")) {
        gender = "male";
        model = "boy2.usd";
        text = text.replace(/^\/male\s*/i, "");
      } else if (text.startsWith("/")) {
        text = text.replace(/^\/[^\s]+\s*/i, ""); 
      }

      if (!text || text.length === 0) {
        await sendTelegramMessage(chatId, "⚠️ Please provide a message! \nExample: /female Hello there!");
        return;
      }

      // 2. Create Firestore Entry (This acts as the "Lock")
      const docRef = await addDoc(collection(db, "shared"), {
        sender: `telegram_${chatId}`,
        senderName: username,
        timestamp: new Date(),
        text: text,
        avatarModel: model,
        emotion: "joy",
        status: "processing"
      });

      await sendTelegramMessage(chatId, `⏳ creating your message... Please wait a moment.`);

      // 3. TTS (Text-to-Speech)
      const ttsRes = await fetch(`${BASE_URL}/api/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, messageId: docRef.id, gender, emotion: "Conversational" }),
      });
      const ttsData = await ttsRes.json();
      const audioUrl = `/audio/${ttsData.audioPath}`;

      // 4. Audio2Face
      await fetch(`${BASE_URL}/api/audio2face`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioFilePath: ttsData.audioPath,
          outputDir: "D:/chat-avatar-app/public/usd_files",
          messageId: docRef.id,
          emotion: "joy",
          gender,
          model,
          directoryAudio: "D:/chat-avatar-app/public/audio",
        }),
      });

      // 5. Trigger Video Rendering
      const usdUrl = `${BASE_URL}/usd_files/cache_${docRef.id}_cache.usd`;
      const shareUrl = `${BASE_URL}/view/${docRef.id}`;
      
      try {
        await fetch(`${BASE_URL}/api/generate-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: docRef.id, usdUrl, audioUrl }),
          signal: AbortSignal.timeout(300000)
        });
      } catch (fetchErr) {
        console.log("[Background] Render triggered, proceeding to polling...");
      }

      // 6. Wait for Video Ready
      let finalVideoUrl: string;
      try {
        finalVideoUrl = await waitForVideoReady(docRef.id, 300000);
      } catch (err) {
        console.error("[VIDEO TIMEOUT]", err);
        // Important: Update status so they aren't blocked forever if it times out
        await updateDoc(doc(db, "shared", docRef.id), { status: "error" });
        await sendTelegramMessage(chatId, "❌ Video is taking too long to render. Please try again later.");
        return;
      }

      // 7. Update Firestore
      await updateDoc(doc(db, "shared", docRef.id), {
        usdUrl,
        audioUrl,
        shareUrl,
        // Status is already set to 'done' by the internal render API
      });

      // 8. Send Result
      const telegramRes = await fetch(`${TELEGRAM_API}/sendVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          video: finalVideoUrl,
          caption: `🎭 Done! Here is your ${gender} 3D message.\n\n🔗 Web Link: ${shareUrl}`,
        }),
      });

      if (!telegramRes.ok) {
        await sendTelegramMessage(chatId, `🎭 Your video is ready! View it here: ${shareUrl}`);
      }

    } catch (err) {
      console.error("[CRITICAL ERROR]", err);
      await sendTelegramMessage(chatId, "❌ Sorry, an error occurred. Please try again.");
    }
  })();
}