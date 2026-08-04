

// import { NextApiRequest, NextApiResponse } from "next";
// import axios from "axios";
// import path from "path";
// import { addToQueue } from "../../utils/a2fQueue";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { audioFilePath, outputDir, messageId, emotion, gender, directoryAudio } = req.body;

//   if (!audioFilePath || !outputDir || !messageId || !emotion || !gender || !directoryAudio) {
//     return res.status(400).json({ error: "Missing required params" });
//   }

//   try {
//     // Wrap the whole process in a queue to prevent race conditions
//     const outputFilePath = await addToQueue(async () => {
//       const rawAudioFileName = path.basename(audioFilePath);
//       const audioFileName = rawAudioFileName.endsWith(".wav") ? rawAudioFileName : rawAudioFileName + ".wav";

//       // Select USD file based on gender
//       const usdFilePath =
//         gender === "female"
//           ? "D:/chat-avatar-app/girlwithhairs.usd"
//           : "D:/chat-avatar-app/male_face.usd";

//       // Step 1: Load USD file
//       const loadResponse = await axios.post("http://127.0.0.1:8011/A2F/USD/Load", { file_name: usdFilePath });
//       if (loadResponse.status !== 200) throw new Error("Failed to load USD file");

//       // Step 2: Set root path
//       const setRootResponse = await axios.post("http://127.0.0.1:8011/A2F/Player/SetRootPath", {
//         a2f_player: "/World/LazyGraph/Player",
//         dir_path: directoryAudio,
//       });
//       if (setRootResponse.status !== 200) throw new Error("Failed to set root path");

//       // Step 3: Set audio track
//       const setAudioResponse = await axios.post("http://127.0.0.1:8011/A2F/Player/SetTrack", {
//         a2f_player: "/World/LazyGraph/Player",
//         file_name: audioFileName,
//       });
//       if (setAudioResponse.status !== 200) throw new Error("Failed to set audio track");

//       // Step 3.5: small delay for A2F to catch up
//       await new Promise((r) => setTimeout(r, 500));

//       // Step 3.6: Set emotion
//       const setEmotionResponse = await axios.post("http://127.0.0.1:8011/A2F/A2E/SetEmotionByName", {
//         a2f_instance: "/World/LazyGraph/CoreFullface",
//         emotions: { [emotion]: 100 },
//       });
//       if (setEmotionResponse.status !== 200) throw new Error("Failed to set emotion");

//       // Step 4: Export geometry cache
//       const geometryResponse = await axios.post("http://127.0.0.1:8011/A2F/Exporter/ExportGeometryCache", {
//         export_directory: outputDir,
//         file_name: `cache_${messageId}`,
//         cache_type: "usd",
//         xform_keys: "false",
//         batch: "false",
//         fps: 10,
//       });
//       if (geometryResponse.status !== 200) throw new Error("Failed to export geometry cache");

//       // Construct output file path
//       return path.join(outputDir, `cache_${messageId}_cache.usd`);
//     });

//     // Send result to user
//     res.status(200).json({ success: true, outputFilePath });
//   } catch (error) {
//     console.error("Error in audio2face process:", error);
//     if (error instanceof Error) {
//       res.status(500).json({ error: "Audio2Face process failed", details: error.message });
//     } else {
//       res.status(500).json({ error: "Audio2Face process failed", details: "Unknown error" });
//     }
//   }
// }


import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import path from "path";
import { addToQueue } from "../../utils/a2fQueue";

/**
 * Emotion blending map
 * - Keys: new custom emotion names you can use in chat page
 * - Values: blend of existing A2F emotions with percentage weights
 * - Default A2F emotions (cheekiness, sadness, calmness, etc.) will still work as-is
 */
const EMOTION_BLEND_MAP: Record<string, Record<string, number>> = {
  // ✅ Hybrid / new emotions
  "flirty": { joy: 60, cheekiness: 40 },
  "happy": { joy: 70, calmness: 30 },
  "romantic": { calmness: 40, joy: 40, cheekiness: 20 },
  "confident": { calmness: 50, amazement: 30, joy: 20 },
  "excited": { amazement: 60, joy: 40 },
  "tired": { sadness: 50, calmness: 50 },
  "nervous": { fear: 60, sadness: 40 },
  "angry": { anger: 100 },
  "default": { joy: 100 },
};
const MODELS_BASE_DIR = "D:/chat-avatar-app/"; // All your .usd files live here

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Added 'model' to the destructured body
const { audioFilePath, outputDir, messageId, emotion, gender, model, directoryAudio } = req.body;

// Added validation check for 'model'
if (!audioFilePath || !outputDir || !messageId || !emotion || !gender || !model || !directoryAudio) {
  return res.status(400).json({ error: "Missing required params, including model." });
}

  try {
    const outputFilePath = await addToQueue(async () => {
      const rawAudioFileName = path.basename(audioFilePath);
      const audioFileName = rawAudioFileName.endsWith(".wav") ? rawAudioFileName : rawAudioFileName + ".wav";

      // Select USD file based on gender
      // const usdFilePath =
      //   gender === "female"
      //     ? "D:/chat-avatar-app/girlwithhairs.usd"
      //     : "D:/chat-avatar-app/male_face.usd";
      // Use the provided 'model' (e.g., "xy.usd") to construct the full path
      const usdFilePath = path.join(MODELS_BASE_DIR, model);

      // Step 1: Load USD file
      const loadResponse = await axios.post("http://127.0.0.1:8011/A2F/USD/Load", { file_name: usdFilePath });
      if (loadResponse.status !== 200) throw new Error("Failed to load USD file");

      // Step 2: Set root path
      const setRootResponse = await axios.post("http://127.0.0.1:8011/A2F/Player/SetRootPath", {
        a2f_player: "/World/LazyGraph/Player",
        dir_path: directoryAudio,
      });
      if (setRootResponse.status !== 200) throw new Error("Failed to set root path");

      // Step 3: Set audio track
      const setAudioResponse = await axios.post("http://127.0.0.1:8011/A2F/Player/SetTrack", {
        a2f_player: "/World/LazyGraph/Player",
        file_name: audioFileName,
      });
      if (setAudioResponse.status !== 200) throw new Error("Failed to set audio track");

      // Step 3.5: Small delay for A2F to catch up
      await new Promise((r) => setTimeout(r, 500));

      // Step 3.6: Resolve emotion → may be default, hybrid, or mixed
      let finalEmotions: Record<string, number>;

      if (EMOTION_BLEND_MAP[emotion]) {
        // New or hybrid emotion (like "flirty")
        finalEmotions = EMOTION_BLEND_MAP[emotion];
      } else {
        // Existing A2F emotion (like "cheekiness", "sadness", etc.)
        finalEmotions = { [emotion]: 100 };
      }

      // Step 3.7: Send emotion data
      const setEmotionResponse = await axios.post("http://127.0.0.1:8011/A2F/A2E/SetEmotionByName", {
        a2f_instance: "/World/LazyGraph/CoreFullface",
        emotions: finalEmotions,
      });
      if (setEmotionResponse.status !== 200) throw new Error("Failed to set emotion");

      // Step 4: Export geometry cache
      const geometryResponse = await axios.post("http://127.0.0.1:8011/A2F/Exporter/ExportGeometryCache", {
        export_directory: outputDir,
        file_name: `cache_${messageId}`,
        cache_type: "usd",
        xform_keys: "false",
        batch: "false",
        fps: 15,
      });
      if (geometryResponse.status !== 200) throw new Error("Failed to export geometry cache");

      return path.join(outputDir, `cache_${messageId}_cache.usd`);
    });

    res.status(200).json({ success: true, outputFilePath });
  } catch (error) {
    console.error("Error in audio2face process:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: "Audio2Face process failed", details: error.message });
    } else {
      res.status(500).json({ error: "Audio2Face process failed", details: "Unknown error" });
    }
  }
}
