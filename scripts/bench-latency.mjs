/**
 * Latency A/B: pipelined vs sequential voice turns.
 *
 * Answers one question with numbers instead of adjectives:
 *   How much does overlapping generation with synthesis actually cut the wait
 *   before the user hears the first word?
 *
 * Both arms run through the SAME route, the same brain, the same TTS server, on the same
 * machine — the only difference is the `mode` flag. That's what makes the delta attributable
 * to the pipelining and not to anything else.
 *
 * The headline metric is firstAudioMs (time-to-first-audio). Deliberately NOT totalMs: a voice
 * agent is judged on when it starts talking, not when it stops. totalMs is reported anyway,
 * because a change that improved TTFA while blowing up total time would be a regression in
 * disguise and should be visible.
 *
 * Usage:  node scripts/bench-latency.mjs [baseUrl] [runs]
 */

const BASE = process.argv[2] || "http://localhost:3001";
const RUNS = Number(process.argv[3] || 3);

// Fixed prompt set spanning realistic interview turns: a short ack, a normal answer,
// and one that reliably provokes a long multi-sentence reply (where pipelining should win most).
const PROMPTS = [
  "Yeah, that makes sense.",
  "I'd use Redis with an LRU eviction policy and write-through caching.",
  "Ask me a hard multi-part question about distributed consensus and tell me what to cover.",
];

async function runTurn(prompt, mode) {
  const started = performance.now();
  const res = await fetch(`${BASE}/api/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], mode }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;
  // Measured client-side too: the server's own clock can't see network/serialisation cost.
  let clientFirstAudioMs = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const e = JSON.parse(line.slice(6));
      if (e.type === "audio" && clientFirstAudioMs === null) {
        clientFirstAudioMs = Math.round(performance.now() - started);
      }
      if (e.type === "done") result = e;
      if (e.type === "error") throw new Error(e.message);
    }
  }

  if (!result) throw new Error("stream ended without a done event");
  return { ...result.timings, clientFirstAudioMs, reply: result.reply };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
};

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

async function main() {
  console.log(`\nLatency A/B — ${BASE} · ${RUNS} runs/prompt · median reported\n`);

  // One throwaway turn: the first request pays model load and JIT warmup, which would
  // otherwise be charged entirely to whichever arm happened to run first.
  process.stdout.write("warming up… ");
  await runTurn("Hello.", "pipelined").catch(() => {});
  console.log("done\n");

  const rows = [];

  for (const prompt of PROMPTS) {
    const arms = {};
    for (const mode of ["sequential", "pipelined"]) {
      const ttfa = [];
      const total = [];
      for (let i = 0; i < RUNS; i++) {
        try {
          const t = await runTurn(prompt, mode);
          if (t.firstAudioMs != null) ttfa.push(t.clientFirstAudioMs);
          if (t.totalMs != null) total.push(t.totalMs);
        } catch (err) {
          console.error(`  ! ${mode} failed: ${err.message}`);
        }
      }
      arms[mode] = {
        ttfa: ttfa.length ? median(ttfa) : null,
        total: total.length ? median(total) : null,
        ok: `${ttfa.length}/${RUNS}`,
      };
    }
    rows.push({ prompt, ...arms });
  }

  console.log(
    pad("prompt", 42) + padL("seq TTFA", 10) + padL("pipe TTFA", 11) +
    padL("saved", 9) + padL("speedup", 9) + padL("ok", 8),
  );
  console.log("-".repeat(89));

  const speedups = [];
  for (const r of rows) {
    const s = r.sequential.ttfa;
    const p = r.pipelined.ttfa;
    const saved = s != null && p != null ? s - p : null;
    const speedup = s != null && p != null && p > 0 ? (s / p).toFixed(2) + "x" : "—";
    if (s != null && p != null && p > 0) speedups.push(s / p);

    console.log(
      pad(r.prompt.slice(0, 40), 42) +
      padL(s != null ? s + "ms" : "—", 10) +
      padL(p != null ? p + "ms" : "—", 11) +
      padL(saved != null ? saved + "ms" : "—", 9) +
      padL(speedup, 9) +
      padL(`${r.pipelined.ok}`, 8),
    );
  }

  console.log("-".repeat(89));
  if (speedups.length) {
    const avg = speedups.reduce((a, b) => a + b, 0) / speedups.length;
    console.log(`\nmean TTFA speedup: ${avg.toFixed(2)}x`);
  }
  console.log("\ntotal turn time (should NOT regress):");
  for (const r of rows) {
    console.log(
      "  " + pad(r.prompt.slice(0, 40), 42) +
      padL(`seq ${r.sequential.total ?? "—"}ms`, 14) +
      padL(`pipe ${r.pipelined.total ?? "—"}ms`, 15),
    );
  }
  console.log();
}

main().catch((e) => {
  console.error("bench failed:", e.message);
  process.exit(1);
});
