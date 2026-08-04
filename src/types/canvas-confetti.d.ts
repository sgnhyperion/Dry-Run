declare module 'canvas-confetti' {
  interface ConfettiOptions {
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    ticks?: number;
    x?: number;
    y?: number;
    particleCount?: number;
    colors?: string[];
    shapes?: ('circle' | 'square')[];
    origin?: { x?: number; y?: number };
    scalar?: number;
    drift?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(options?: ConfettiOptions): void;

  export default confetti;
}
