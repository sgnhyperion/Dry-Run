import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

/**
 * The brain: streaming, stateless, provider-agnostic.
 *
 * STATELESS ON PURPOSE. The previous contract was `askBrain(question, previousId)` where `id` was
 * Gemini's *server-side* conversation state. That is provider-locked state we don't own — it can't
 * be replayed, inspected, trimmed, or moved to another provider. Every other provider (OpenAI,
 * Anthropic, Ollama) is natively stateless: you resend the transcript each turn. So the caller owns
 * the transcript and providers become pure translators.
 *
 * That single change is what makes context engineering possible at all — you can't compact,
 * re-rank, or inject retrieved memory into a context window the provider is hiding from you.
 */

export type Role = "system" | "user" | "assistant";
export type ChatMessage = { role: Role; content: string };

export type BrainProvider = "openai" | "gemini" | "ollama";

export function activeProvider(): BrainProvider {
  return (process.env.BRAIN_PROVIDER as BrainProvider) || "openai";
}

/**
 * Product logic, deliberately OUTSIDE both adapters — an adapter's only job is dialect
 * translation. Adding Anthropic later means adding a third translator and nothing else.
 *
 * Tuned for VOICE, not chat: short replies, no markdown, no lists. Every extra token is
 * extra speech the candidate has to sit through, so brevity is a latency feature here.
 */
export const INTERVIEWER_PERSONA = `You are a friendly but sharp technical interviewer for software/AI roles.

RULES — you are speaking OUT LOUD, so:
- Keep every reply under 3 sentences. Short is better.
- Plain spoken prose only. No markdown, no bullet points, no code blocks, no emoji.
- Ask exactly ONE question per turn.
- Briefly acknowledge their answer, then probe deeper or move on.
- Adapt difficulty to how they're doing.
- Never reveal or solve the answer for them.
- Don't lecture. You are having a conversation, not giving a talk.`;

/** Streams reply text deltas as they're generated. The unit of latency is the FIRST delta. */
export async function* streamBrain(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const provider = activeProvider();
  const gen =
    provider === "gemini"
      ? streamGemini(messages, signal)
      : provider === "ollama"
      ? streamOllama(messages, signal)
      : streamOpenAI(messages, signal);
  for await (const delta of gen) yield delta;
}

async function* streamOpenAI(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const client = new OpenAI();
  const stream = await client.chat.completions.create(
    {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: INTERVIEWER_PERSONA }, ...messages],
      stream: true,
      temperature: 0.7,
      // Hard cap: a voice agent that monologues is a broken voice agent. Also bounds worst-case turn length.
      max_tokens: 160,
    },
    { signal },
  );

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

async function* streamGemini(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({});
  const stream = await ai.models.generateContentStream({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    // Role vocabulary is translated at the boundary: our neutral "assistant" is Gemini's "model".
    // API dialect must never leak into app state.
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: INTERVIEWER_PERSONA,
      maxOutputTokens: 160,
      // THE LATENCY FIX. gemini-3.6-flash reasons by default — a measured 462 thought tokens for a
      // 7-token reply. Every one of those is dead time before the first audible word, and a voice turn
      // needs reflexes, not deliberation. Floor it.
      // NOTE: budget 0 is REJECTED by this model (400 INVALID_ARGUMENT — verified by bisect); it cannot
      // fully disable thinking, only bound it. 128 is the lowest value confirmed to work.
      thinkingConfig: { thinkingBudget: 128 },
    },
  });

  for await (const chunk of stream) {
    if (signal?.aborted) return;
    const text = chunk.text;
    if (text) yield text;
  }
}

/**
 * Local Ollama — $0, offline, no quota, no account.
 *
 * Earns its place beyond cost: this project has now hit THREE free-tier walls (Gemini TTS 429s,
 * the brain 403, and Gemini quota again while load-testing this very pipeline). A local provider
 * means latency work never stalls on someone else's rate limiter.
 */
async function* streamOllama(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch(`${process.env.OLLAMA_URL || "http://127.0.0.1:11434"}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:14b",
      messages: [{ role: "system", content: INTERVIEWER_PERSONA }, ...messages],
      stream: true,
      options: { num_predict: 160 },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama failed (${res.status}) — is \`ollama serve\` running?`);
  }

  // Ollama streams NDJSON: one complete JSON object per line. A network chunk can split a line
  // in half, so hold the remainder in a buffer and only parse up to the last newline.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      // .message.content — nested, and it's `content`, not `text`.
      const delta = JSON.parse(line)?.message?.content;
      if (delta) yield delta;
    }
  }
}
