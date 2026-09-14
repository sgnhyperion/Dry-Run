"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Push-to-talk mic capture.
 *
 * Deliberately NOT streaming. The roadmap defers barge-in/VAD to Phase 6, so this records a
 * discrete utterance and hands back one Blob — which is all a turn-based interview needs, and
 * it avoids adopting a whole real-time voice framework for a Phase-6 polish feature.
 *
 * Phase 4 reuses this same Blob as the SER model's input, so the audio is already where it
 * needs to be — nothing to re-plumb when affect lands.
 */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Browser-side cleanup, free and meaningfully better for Whisper on a laptop mic.
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  /** Stops capture and resolves with the recorded audio. */
  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      // MediaRecorder flushes its final buffer asynchronously — the last chunk only lands
      // after 'stop' fires. Reading chunksRef synchronously after stop() would drop the tail
      // of every recording, so the Blob has to be assembled inside the handler.
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        // Release the mic so the browser's recording indicator actually turns off.
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.stop();
    });
  }, []);

  return { recording, start, stop };
}
