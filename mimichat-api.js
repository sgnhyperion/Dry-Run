require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors");
const path = require("path");
const os = require("os");
const fs = require("fs");
const util = require("util");
const mongoose = require("mongoose");
const { execFile } = require("child_process");
const fetch = require("node-fetch");

const execFilePromise = util.promisify(execFile);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ✅ API Key Schema
const ApiKeySchema = new mongoose.Schema({
  key: String,
  plan: String, // free | paid
  credits: Number,
  active: Boolean,
  createdAt: { type: Date, default: Date.now }
});

const ApiKey = mongoose.model("ApiKey", ApiKeySchema);

// ✅ LOCAL CONFIG
const FLASK_SERVER_URL = "http://tts.mimichat.space/generate-tts";
const PYTHON_PATH = "python";

// ✅ LOCAL STORAGE
const PUBLIC_DIR = path.join(__dirname, "public");
const AUDIO_DIR = path.join(PUBLIC_DIR, "audio");
const USD_DIR = path.join(PUBLIC_DIR, "usd_files");

fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(USD_DIR, { recursive: true });

/* ---------------- API KEY CHECK ---------------- */

async function validateApiKey(apiKey) {
    if (!apiKey) return null;

    const keyDoc = await ApiKey.findOne({ key: apiKey, status: "active" }); // Use status instead of active for clarity

    // 1. Check if the key exists and is active
    if (!keyDoc) return null;

    // 2. Check Expiration for Paid Plans ("monthly" or similar)
    // The key validation logic should check if the paid subscription date has passed.
    if (keyDoc.plan !== "free") {
        // We expect paid plans to have an 'expiresAt' date
        const expirationDate = keyDoc.expiresAt;
        
        // If the expiration date exists and is in the past, the key is invalid.
        if (expirationDate && expirationDate < new Date()) {
            console.log(`Paid API Key ${keyDoc.key} has expired.`);
            return null;
        }
    }
    return keyDoc;
}

/* ---------------- TTS ---------------- */

async function callElevenLabsAPI(text, gender, emotion, messageId) {
  const filename = `${messageId}.wav`;

  const payload = {
    text,
    filename,
    gender,
    setemotion: emotion
  };

  const response = await fetch("http://127.0.0.1:5001/generate-tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  if (!data.success || !data.audioPath) {
    throw new Error("Flask audio file not created");
  }

  // ✅ Flask already saved the file in /public/audio
  const finalAudioPath = path.join(
    __dirname,
    "public",
    data.audioPath.replace("/audio/", "audio/")
  );

  if (!fs.existsSync(finalAudioPath)) {
    throw new Error("Flask audio file not found on disk");
  }

  return {
    tempAudioPath: finalAudioPath,
    publicAudioUrl: `http://localhost:3000${data.audioPath}`
  };
}




/* ---------------- A2F ---------------- */

async function callAudio2FaceService(tempAudioPath, character_model, emotion, messageId) {
  const outputDir = os.tmpdir();
  const a2fScriptPath = path.join(__dirname, "scripts/audio2faceapi.py");

  const { stderr } = await execFilePromise(PYTHON_PATH, [
    a2fScriptPath,
    tempAudioPath,
    character_model,
    outputDir,
    messageId,
    emotion,
  ], { timeout: 60000 });

  if (stderr) throw new Error(stderr);

  const finalUsdPath = path.join(outputDir, `cache_${messageId}_cache.usd`);
  if (!fs.existsSync(finalUsdPath)) throw new Error("USD not generated");

  return finalUsdPath;
}

/* ---------------- CORE PIPELINE ---------------- */

async function processAnimationRequest({ text, character_model, emotion, gender, messageId }) {
  let tempAudioPath = null;
  let tempUsdPath = null;

  try {
    const ttsResult = await callElevenLabsAPI(text, gender, emotion, messageId);
    tempAudioPath = ttsResult.tempAudioPath;

    tempUsdPath = await callAudio2FaceService(
      tempAudioPath,
      character_model,
      emotion,
      messageId
    );

    const finalAudioPath = path.join(AUDIO_DIR, `audio_${messageId}.wav`);
    const finalUsdPath = path.join(USD_DIR, `cache_${messageId}_cache.usd`);

    fs.copyFileSync(tempAudioPath, finalAudioPath);
    fs.copyFileSync(tempUsdPath, finalUsdPath);

    return {
      status: "success",
      audioUrl: `http://localhost:3000/audio/${messageId}.wav`,
      usdUrl: `http://localhost:3000/usd_files/cache_${messageId}_cache.usd`,
    };
  } finally {
    if (tempAudioPath && fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    if (tempUsdPath && fs.existsSync(tempUsdPath)) fs.unlinkSync(tempUsdPath);
  }
}
app.get("/", (req, res) => {
  res.send("✅ Mimichat API is Live");
});


/* ---------------- MAIN API ---------------- */

app.post("/generate", async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  const keyDoc = await validateApiKey(apiKey);

  if (!keyDoc) return res.status(401).json({ error: "Invalid or expired API key" });

  const { text, character_model, emotion, gender, messageId } = req.body;

  if (!text || !character_model || !emotion || !gender) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const finalMessageId = messageId || Date.now().toString(36);

  try {
    const result = await processAnimationRequest({
      text,
      character_model,
      emotion,
      gender,
      messageId: finalMessageId,
    });

    // ✅ Deduct Credits If Free Plan
    if (keyDoc.plan === "free") {
      keyDoc.credits -= 1;
      await keyDoc.save();
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

/* ---------------- STATIC HOSTING ---------------- */

app.use("/audio", express.static(AUDIO_DIR));
app.use("/usd_files", express.static(USD_DIR));

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Local API running at http://0.0.0.0:${PORT}`);
});
