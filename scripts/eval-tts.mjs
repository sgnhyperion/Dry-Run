const BASE = "http://localhost:3000/api/tts";
const RUNS = 3; // per sentence → take the median (first call is often a cold start)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SENTENCES = [
  "Got it — that makes sense.",
  "Welcome. To start, can you explain what a variational autoencoder is and how it differs from a standard autoencoder?",
  "Got it — that makes sense.",
  "Interesting — so why does the reparameterization trick let us backpropagate through a random sampling step?",
  "Walk me through the time complexity — is it O(n log n)? And how does the KL-divergence term affect the ELBO objective?",
  "No worries, take your time — that was a tricky one, and you're on the right track.",
  "In 2017, the Transformer paper replaced RNNs and LSTMs with self-attention across 8 attention heads.",
  "Let's switch topics. Imagine you're designing a rate limiter for an API — how would you handle bursts, and what data structure would you reach for first?",
  "Right."
];

// ceremony: WAV(24kHz,16-bit,mono) → seconds
function wavDurationSec(byteLength) {
  return (byteLength - 44) / (24000 * 2);
}

function median(nums) {
  // 👉 YOUR PART: sort a *copy* ascending, return the middle element
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function timeOne(text) {
    const t0 = performance.now();
    try{
        const res = await fetch(BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        if (!res.ok) {
            return { ok: false, status: res.status, statusText: res.statusText };
        }

        const buf = await res.arrayBuffer();
        const synthMs = performance.now() - t0;
        const durationSec = wavDurationSec(buf.byteLength);
        return { ok: true, synthMs, durationSec };
    }
    catch (err) {
        console.error("Error during TTS request:", err);
        return { ok: false, error: err };
    }
}

const rows = [];
for (const text of SENTENCES) {
    const synthTimes = [];
    let durationSec = 0;
    for (let i = 0; i < RUNS; i++) {

        // Throttle requests to avoid overwhelming the server, especially if it's running locally
        await sleep(7000); // small delay between runs to avoid overwhelming the server

        const res = await timeOne(text);

        if(res.ok === false) {
            console.error(`Error during TTS request for text: "${text}"`);
            continue; // Skip this run and continue with the next one
        }

        const { synthMs, durationSec: d } = res;
        synthTimes.push(synthMs);
        durationSec = d; // all runs should have the same duration
    }
    if(synthTimes.length === 0) {
        console.error(`All TTS requests failed for text: "${text}"`);
        rows.push({ text: text.slice(0, 30), ok: `0/${RUNS}`, synthMs: "—", durationSec: "—", rtf: "—" });
    } else {
        const synth = median(synthTimes);
        const rtf = (synth / 1000) / durationSec;
        rows.push({ text: text.slice(0, 30), ok: `${synthTimes.length}/${RUNS}`, synthMs: Math.round(synth), durationSec: +durationSec.toFixed(2), rtf: +rtf.toFixed(2) }); 
    }
}
console.table(rows);