// import type { NextApiRequest, NextApiResponse } from "next";
// // import path from "path";

// interface TTSResponse {
//   success?: boolean;
//   error?: string;
//   audioPath?: string;
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<TTSResponse>
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   const { text, messageId, gender, setemotion } = req.body;
//   if (!text || !messageId) {
//     return res.status(400).json({ error: "Text and messageId are required" });
//   }

//   const outputFile = `/audio_${messageId}.wav`; // Path to save the file in the public directory
//   const flaskApiUrl = "http://127.0.0.1:5001/generate-tts"; // Flask API URL

//   try {
//     // Send a POST request to the Flask API
//     // Construct absolute URL for internal API call
//     const protocol = req.headers["x-forwarded-proto"] || "http";
//     const host = req.headers.host;
//     const baseUrl = `${protocol}://${host}`;

//     const hinglishText = await fetch(`${baseUrl}/api/hinglish`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text: text,
//       }),
//     });

//     const hinglishData = await hinglishText.json();
//     if (!hinglishData.normalizedText) {
//       throw new Error("Failed to normalize text");
//     }
//     console.log({ hinglishData, text });

//     const response = await fetch(flaskApiUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         text: hinglishData.normalizedText,
//         filename: `audio_${messageId}.wav`, // Send the file path to Flask
//         gender: gender,
//         setemotion: setemotion,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("TTS failed");
//     }

//     const data = await response.json();
//     // console.log(data)
//     if (data.success) {
//       // Return the path to the generated audio file
//       res.status(200).json({ success: true, audioPath: outputFile });
//     } else {
//       throw new Error("Failed to generate TTS audio");
//     }
//   } catch (error) {
//     console.error("TTS Error:", error);
//     res.status(500).json({ error: "TTS failed" });
//   }
// }




// This includes a fallback mechanism for when Gemini is overloaded.

import type { NextApiRequest, NextApiResponse } from "next";

interface TTSResponse {
  success?: boolean;
  error?: string;
  audioPath?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TTSResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text, messageId, gender, setemotion, avatarModel } = req.body;
  if (!text || !messageId) {
    return res.status(400).json({ error: "Text and messageId are required" });
  }

  const outputFile = `/audio_${messageId}.wav`;
  const flaskApiUrl = "http://127.0.0.1:5001/generate-tts";

  try {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // 1. Attempt Normalization with a Bypass Fallback
    let processedText = text; // Default to original text

    try {
      const hinglishResponse = await fetch(`${baseUrl}/api/hinglish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
        // Optional: fail fast if Gemini is hanging (e.g., 5 seconds)
        // signal: AbortSignal.timeout(5000), 
      });

      if (hinglishResponse.ok) {
        const hinglishData = await hinglishResponse.json();
        if (hinglishData.normalizedText) {
          processedText = hinglishData.normalizedText;
          console.log("Normalization successful:", processedText);
        }
      } else {
        console.warn("Hinglish API returned status:", hinglishResponse.status, "Bypassing...");
      }
    } catch (normError) {
      // If Gemini is overloaded or fetch fails, we catch the error here and do nothing.
      // processedText remains as the original 'text'.
      console.error("Bypassing Normalization due to error:", normError);
    }

    // 2. Send to Flask TTS
    const response = await fetch(flaskApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: processedText,
        filename: `audio_${messageId}.wav`,
        gender: gender,
        setemotion: setemotion,
        avatarmodel: avatarModel,
      }),
    });

    if (!response.ok) {
      throw new Error("TTS Flask API failed");
    }

    const data = await response.json();
    if (data.success) {
      res.status(200).json({ success: true, audioPath: outputFile });
    } else {
      throw new Error("Failed to generate TTS audio via Flask");
    }
  } catch (error) {
    console.error("Critical TTS Error:", error);
    res.status(500).json({ error: "TTS failed" });
  }
}