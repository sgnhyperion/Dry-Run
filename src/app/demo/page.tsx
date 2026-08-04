

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const USDViewer: React.FC<{ usdUrl: string; audioUrl?: string }> = ({
  usdUrl,
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const newAudio = new Audio(audioUrl);
    newAudio.loop = true;
    setAudio(newAudio);

    return () => {
      newAudio.pause();
      newAudio.currentTime = 0;
    };
  }, [audioUrl]);

  useEffect(() => {
    const handleUSDLoaded = (event: MessageEvent) => {
      if (event.data?.type === "USD_LOADED" && audio && isPlaying) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
    };

    window.addEventListener("message", handleUSDLoaded);
    return () => window.removeEventListener("message", handleUSDLoaded);
  }, [audio, isPlaying]);

  const handlePlay = () => {
    setIframeKey((prev) => prev + 1);
    setIsPlaying(true);

  };
  

  const handlePause = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIframeKey(0);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 rounded-lg shadow-lg w-[400px]">
      <div
        className="relative w-[400px] h-[300px] overflow-hidden rounded-md"
        style={{ display: isPlaying ? "block" : "none" }}
      >
        {isPlaying && usdUrl && (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={`/index3.html?file=${encodeURIComponent(usdUrl)}`}
            width="800"
            height="600"
            frameBorder="0"
            allowFullScreen
            style={{
              transform: "scale(0.5)",
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        )}
      </div>

      <div className="mt-4 flex gap-4">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
          >
            Play
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
};

interface Message {
  text: string;
  sender: "user" | "bot";
  usdUrl?: string;
  audioUrl?: string;
}

const captions = [
    "Hi, I am new user",
    "Wow, that’s really smooth!",
    "That would be awesome!",
  ];

const DemoChatPage = () => {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hey there! 👋 I'm Mimi, your demo assistant!",
      usdUrl: "https://mimichat.space/usd_files/mimi1_cache.usd",
      audioUrl: "https://mimichat.space/audio/mimi1.wav",
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedGender, setSelectedGender] = useState("female");
  const [count, setCount] = useState(2);

  

  const hasReachedLimit = count >= captions.length * 2 + 2;

  const sendMessage = () => {
    if (hasReachedLimit) return;

    const userId = count;
    const botId = count + 1;
    const currentCaption =
      captions[Math.floor(count / 2) - 1] || "Hi, I am user";

    const newUserMessage: Message = {
      sender: "user",
      text: currentCaption,
      usdUrl: `https://mimichat.space/usd_files/mimi${userId}_cache.usd?id=${userId}`,
      audioUrl: `https://mimichat.space/audio/mimi${userId}.wav?id=${userId}`,
    };

    const newBotMessage: Message = {
      sender: "bot",
      text: "That's cool! Want to see how I move?",
      usdUrl: `https://mimichat.space/usd_files/mimi${botId}_cache.usd?id=${botId}`,
      audioUrl: `https://mimichat.space/audio/mimi${botId}.wav?id=${botId}`,
    };

    setMessages((prev) => [...prev, newUserMessage, newBotMessage]);
    setCount(count + 2);

    const nextCaption = captions[Math.floor(count / 2)] || "";
    setInput(nextCaption);
  };

  useEffect(() => {
    setInput(captions[0]);
  }, []);

  const latestUserMsg = [...messages].reverse().find((m) => m.sender === "user");
  const latestBotMsg = [...messages].reverse().find((m) => m.sender === "bot");

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 bg-gray-100">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-black">mimichat</h2>

      <div className="flex flex-col gap-4 w-full items-center">
        {latestBotMsg?.usdUrl && (
          <USDViewer usdUrl={latestBotMsg.usdUrl} audioUrl={latestBotMsg.audioUrl} />
        )}
        {latestUserMsg?.usdUrl && (
          <USDViewer usdUrl={latestUserMsg.usdUrl} audioUrl={latestUserMsg.audioUrl} />
        )}
      </div>

      <div className="w-full max-w-sm mt-6 bg-white border rounded-xl p-3">
        {hasReachedLimit ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-gray-700">You&apos;ve reached the end of the demo. 🎉</p>
            <p className="text-sm text-gray-500">Login to chat with real people!</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <select
              className="border px-3 py-2 rounded-md focus:outline-none text-black min-w-[80px]"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="male">M</option>
              <option value="female">F</option>
            </select>

            <input
              type="text"
              className="border flex-1 px-3 py-2 rounded-md focus:outline-none text-black"
              value={input}
              readOnly
            />

            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoChatPage;
