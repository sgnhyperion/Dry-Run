"use client";

interface StartButtonProps {
  onStart: () => void;
}

export default function StartButton({ onStart }: StartButtonProps) {
  return (
    <button
      onClick={onStart}
      aria-label="Start microphone"
      className="
        group
        absolute bottom-4 left-1/2 z-10 -translate-x-1/2

        flex h-16 w-16
        items-center justify-center
        rounded-full

        border border-violet-400/30
        bg-violet-500/10
        backdrop-blur-xl

        shadow-[0_0_25px_rgba(139,92,246,0.25)]

        transition-all duration-300
        hover:scale-110
        hover:bg-violet-500/20
        hover:shadow-[0_0_45px_rgba(139,92,246,0.5)]
        active:scale-95
      "
    >
      {/* Outer beating ring */}
      <span
        className="
          absolute inset-0
          rounded-full
          border border-violet-400/30
          animate-ping
        "
      />

      {/* Second subtle ring */}
      <span
        className="
          absolute -inset-2
          rounded-full
          border border-violet-400/10
          animate-pulse
        "
      />

      {/* Left sound wave */}
      <div className="absolute -left-7 flex items-center gap-1">
        <span className="voice-wave h-3" />
        <span className="voice-wave h-6" style={{ animationDelay: "100ms" }} />
        <span className="voice-wave h-9" style={{ animationDelay: "200ms" }} />
      </div>

      {/* Right sound wave */}
      <div className="absolute -right-7 flex items-center gap-1">
        <span className="voice-wave h-9" style={{ animationDelay: "200ms" }} />
        <span className="voice-wave h-6" style={{ animationDelay: "100ms" }} />
        <span className="voice-wave h-3" />
      </div>

      {/* Microphone */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="
          relative z-10
          h-8 w-8
          text-violet-200
          transition-transform duration-300
          group-hover:scale-110
        "
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 11a7 7 0 0 1-14 0"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18v3M8 21h8"
        />
      </svg>

      {/* Live indicator */}
      <span
        className="
          absolute right-1 top-1
          h-2.5 w-2.5
          rounded-full
          bg-violet-400
          shadow-[0_0_10px_rgba(167,139,250,0.9)]
          animate-pulse
        "
      />
    </button>
  );
}