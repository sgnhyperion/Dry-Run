"use client";

/**
 * Continuous mic capture into a ring buffer, with live loudness for VAD.
 *
 * WHY NOT MediaRecorder. The push-to-talk version used MediaRecorder, which is fine when a click
 * marks the start of speech but useless once VAD does. VAD can only detect speech ~80ms AFTER it
 * begins, so the first word is always already gone — you need PRE-ROLL, audio from before the
 * trigger. MediaRecorder can't give you that: its webm chunks aren't independently decodable (the
 * header lives in chunk one), so you can't just keep the last N chunks and splice them.
 *
 * So we capture raw Float32 PCM into a circular buffer and cut the utterance out of it ourselves,
 * starting a few hundred milliseconds BEFORE the trigger. We encode the WAV too, which also drops
 * the container-format guesswork on the server.
 *
 * The AudioWorklet runs on the audio thread, so a busy main thread (React rendering, WebGL avatar)
 * can't drop samples — which a ScriptProcessorNode would.
 */

const RING_SECONDS = 30;
const FRAME = 1024; // samples the worklet batches before posting (~21ms at 48kHz)

// Inlined as a Blob URL so there's no separate public/ asset to keep in sync with this file.
const WORKLET_SRC = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(${FRAME});
    this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.buf[this.n++] = ch[i];
      if (this.n === ${FRAME}) {
        // Transfer a copy — the worklet reuses its own buffer every render quantum.
        this.port.postMessage(this.buf.slice(0));
        this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor('capture', CaptureProcessor);
`;

export class AudioCapture {
  private ctx: AudioContext;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private ring: Float32Array;
  private writeIndex = 0; // monotonic total samples written; modulo gives the ring position
  readonly sampleRate: number;

  /** Most recent frame's RMS, 0..1. The VAD reads this. */
  level = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.sampleRate = ctx.sampleRate;
    this.ring = new Float32Array(this.sampleRate * RING_SECONDS);
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Browser AEC is what makes speak-to-interrupt survive on laptop speakers — without it
        // the agent's own voice comes back through the mic and trips the VAD constantly.
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
    try {
      await this.ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "capture");

    this.node.port.onmessage = (e) => {
      const frame = e.data as Float32Array;
      this.write(frame);

      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
      this.level = Math.sqrt(sum / frame.length);
    };

    // NOT connected to destination — routing the mic to the speakers would cause feedback.
    // The worklet still runs; it doesn't need a downstream sink to receive input.
    this.source.connect(this.node);
  }

  private write(frame: Float32Array) {
    const len = this.ring.length;
    for (let i = 0; i < frame.length; i++) {
      this.ring[(this.writeIndex + i) % len] = frame[i];
    }
    this.writeIndex += frame.length;
  }

  /** Total samples captured since start — the clock VAD marks timestamps against. */
  get position(): number {
    return this.writeIndex;
  }

  /**
   * Encode the samples between two absolute positions as a WAV blob.
   * Clamps to what the ring still holds, so a very long utterance degrades to its tail
   * rather than returning garbage from wrapped-around memory.
   */
  sliceToWav(from: number, to: number): Blob | null {
    const len = this.ring.length;
    const oldest = Math.max(0, this.writeIndex - len);
    const start = Math.max(from, oldest);
    const end = Math.min(to, this.writeIndex);
    const count = end - start;
    if (count <= 0) return null;

    const pcm = new Float32Array(count);
    for (let i = 0; i < count; i++) pcm[i] = this.ring[(start + i) % len];

    return encodeWav(pcm, this.sampleRate);
  }

  stop() {
    this.node?.port.close();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.node = null;
    this.source = null;
    this.stream = null;
    this.level = 0;
  }
}

/** Float32 [-1,1] → 16-bit PCM WAV. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}
