
// /pages/api/generate-video.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { setup, captureFrames, stitchVideo } from "../../utils/renderUtils";
import fs from "fs";
import path from "path";
import { Browser } from "puppeteer";

import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/firebase/config";

const db = getFirestore(app);

// === PATH CONFIG ===
// const RENDER_ROOT_DIR = path.join(process.cwd(), "public", "renders");
const RENDER_ROOT_DIR = "D:\\chat-avatar-app\\public\\renders";
const FINAL_VIDEO_PUBLIC_PATH = "/renders/";

interface RenderRequestBody {
  messageId: string;
  usdUrl: string;
  audioUrl?: string;
  bgmUrl?: string;
  emotion?: string;
  avatarModel?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { messageId, usdUrl, audioUrl, bgmUrl, emotion, avatarModel } = req.body as RenderRequestBody;

  if (!messageId || !usdUrl) {
    return res.status(400).json({
      success: false,
      message: "Missing required parameters: messageId or usdUrl",
    });
  }

  const docRef = doc(db, "shared", messageId);

  /* =====================================================
     1️⃣ IDEMPOTENCY GUARD (VERY IMPORTANT)
  ===================================================== */
  const snap = await getDoc(docRef);
  if (snap.exists() && snap.data()?.videoUrl) {
    console.log(`[SKIP] Video already exists for ${messageId}`);
    return res.status(200).json({
      success: true,
      skipped: true,
      videoUrl: snap.data()?.videoUrl,
    });
  }

  /* =====================================================
     2️⃣ MARK AS RENDERING
  ===================================================== */
  try {
    await updateDoc(docRef, {
      status: "rendering",
      renderStartedAt: new Date(),
    });
  } catch {}

  /* =====================================================
     3️⃣ PATH SETUP
  ===================================================== */
  const tempOutputDir = path.join(RENDER_ROOT_DIR, `frames_${messageId}`);

  const audioFileName = audioUrl
    ? path.basename(audioUrl)
    : `audio_${messageId}.wav`;

  const audioFilePath = path.join(
    process.cwd(),
    "public",
    "audio",
    audioFileName
  );
  // 🆕 ADD THIS: Resolve BGM Path correctly
let bgmFilePath: string | undefined = undefined;
if (bgmUrl) {
  // Removes leading slash and joins with public directory
  const relativeBgmPath = bgmUrl.startsWith('/') ? bgmUrl.substring(1) : bgmUrl;
  bgmFilePath = path.join(process.cwd(), "public", relativeBgmPath);
}

  console.log(`\n🎬 START RENDER: ${messageId}`);
  console.log(`USD: ${usdUrl}`);
  console.log(`AUDIO: ${audioFilePath}`);
  if (bgmFilePath) console.log(`BGM PATH: ${bgmFilePath}`); // Verify this in logs

  let browser: Browser | null = null;

  try {
    /* =====================================================
       4️⃣ SETUP (PUPPETEER)
    ===================================================== */
    const renderData = await setup(
  usdUrl,
  audioFilePath,
  tempOutputDir,
  emotion || "joy",
  avatarModel || "raju.usd",
);

    browser = renderData.browser;
    const page = renderData.page;

    /* =====================================================
       5️⃣ CAPTURE FRAMES
    ===================================================== */
    await captureFrames(
      page,
      renderData.frameCount,
      renderData.frameDelay,
      tempOutputDir
    );

    await browser.close();
    browser = null;

    /* =====================================================
       6️⃣ STITCH VIDEO
    ===================================================== */
    const outputVideoName = await stitchVideo(
      messageId,
      audioFilePath,
      bgmFilePath ?? "",
      renderData.audioExists,
      tempOutputDir
    );

    const publicVideoPath = FINAL_VIDEO_PUBLIC_PATH + outputVideoName;
    const absoluteVideoUrl = `https://mimichat.space${publicVideoPath}`;

    console.log(`✅ VIDEO READY: ${absoluteVideoUrl}`);

    /* =====================================================
       7️⃣ UPDATE FIRESTORE (ONLY NOW)
    ===================================================== */
    await updateDoc(docRef, {
      videoUrl: absoluteVideoUrl,
      status: "done",
      renderedAt: new Date(),
    });

    /* =====================================================
       8️⃣ CLEANUP FRAMES
    ===================================================== */
    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }

    return res.status(200).json({
      success: true,
      message: "Video generated successfully",
      videoUrl: publicVideoPath,
      messageId,
    });

  } catch (error: any) {
    console.error(`🛑 RENDER FAILED [${messageId}]`, error);

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    if (fs.existsSync(tempOutputDir)) {
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
    }

    try {
      await updateDoc(docRef, {
        status: "failed",
        error: error?.message || "Render failed",
        failedAt: new Date(),
      });
    } catch {}

    return res.status(500).json({
      success: false,
      message: "Video rendering failed",
      error: error?.message,
    });
  }
}
