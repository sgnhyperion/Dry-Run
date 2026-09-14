"use client";

import { lipSync } from "@/lib/lipsync";

/**
 * Gapless playback queue for streamed sentence audio.
 *
 * THE PROBLEM WITH THE OBVIOUS APPROACH. Playing chunk N+1 from chunk N's `onended` callback
 * inserts a gap: the event fires on the main thread, which may be busy rendering, so you get an
 * audible stutter between every sentence. Speech with holes in it sounds worse than speech that
 * started later.
 *
 * THE FIX. Schedule against the AudioContext's own clock. Each chunk is queued to start exactly
 * when the previous one ends (`nextStartTime`), handing the timing to the audio thread instead of
 * the JS event loop. Chunks arriving ahead of playback are scheduled into the future and simply
 * wait their turn; a chunk arriving late starts immediately.
 *
 * Everything routes through a single shared AnalyserNode so the avatar's lip-sync sees one
 * continuous signal for the whole reply rather than restarting per sentence.
 */
export class AudioQueue {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private nextStartTime = 0;
  private live = new Set<AudioBufferSourceNode>();
  private onIdle?: () => void;

  constructor(ctx: AudioContext, onIdle?: () => void) {
    this.ctx = ctx;
    this.onIdle = onIdle;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    // source → analyser → speakers: the audio is both HEARD and MEASURED in one pass.
    this.analyser.connect(ctx.destination);
  }

  /** Decode and schedule one chunk. Returns the AudioContext time it will begin playing. */
  async enqueue(base64Wav: string): Promise<number> {
    const bytes = Uint8Array.from(atob(base64Wav), (c) => c.charCodeAt(0));
    // decodeAudioData detaches the buffer it's given, so hand it the slice, not the view.
    const audio = await this.ctx.decodeAudioData(bytes.buffer as ArrayBuffer);

    const source = this.ctx.createBufferSource();
    source.buffer = audio;
    source.connect(this.analyser);

    // Publish the analyser on the first chunk — this is what drives the avatar's mouth.
    lipSync.analyser = this.analyser;

    // Either continue the existing schedule, or start now if the queue has drained.
    // A small lead-in absorbs decode jitter without being audible.
    const startAt = Math.max(this.ctx.currentTime + 0.02, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + audio.duration;

    this.live.add(source);
    source.onended = () => {
      this.live.delete(source);
      // Queue fully drained → close the mouth and tell the UI it stopped speaking.
      if (this.live.size === 0) {
        lipSync.analyser = null;
        this.onIdle?.();
      }
    };

    return startAt;
  }

  /** True while any scheduled audio is still playing or pending. */
  get speaking(): boolean {
    return this.live.size > 0;
  }

  /**
   * Hard stop — used for barge-in. Must kill *scheduled-but-not-started* sources too, not just
   * audible ones: by the time the user interrupts, several sentences may already be queued into
   * the future, and letting those play is exactly the failure barge-in exists to prevent.
   */
  stop() {
    for (const source of this.live) {
      source.onended = null; // don't fire the idle callback per-source while tearing down
      try {
        source.stop();
      } catch {
        // already stopped — fine
      }
    }
    this.live.clear();
    this.nextStartTime = 0;
    lipSync.analyser = null;
    this.onIdle?.();
  }
}
