import type { NextApiRequest, NextApiResponse } from "next";
import WebSocket from "ws"; // WebSocket client for Node.js

interface ConvertResponse {
  success: boolean;
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ConvertResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { usdFilePath, glbFilePath } = req.body;

  if (!usdFilePath || !glbFilePath) {
    return res.status(400).json({ success: false, message: "USD file path and GLB file path are required" });
  }

  try {
    const websocketUrl = "ws://192.168.31.80:5000"; // WebSocket URL
    const ws = new WebSocket(websocketUrl);

    ws.on("open", () => {
      const message = JSON.stringify({
        usd_file_path: usdFilePath,
        glb_file_path: glbFilePath,
      });
      ws.send(message); // Send data to server
    });

    ws.on("message", (data) => {
      const response = JSON.parse(data.toString());
      if (response.usd_file_path && response.glb_file_path) {
        res.status(200).json({ success: true, message: "Conversion started successfully" });
      } else {
        res.status(500).json({ success: false, message: "Conversion failed" });
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      res.status(500).json({ success: false, message: "WebSocket connection failed" });
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// next dev