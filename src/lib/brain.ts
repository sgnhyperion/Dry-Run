import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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

export type BrainProvider = "openai" | "gemini" | "ollama" | "anthropic";

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

export type BrainOptions = {
  /** System prompt. Defaults to the interviewer. This is what makes the seam multi-AGENT rather
   *  than single-purpose: every agent is the same transport with a different system prompt. */
  system?: string;
  signal?: AbortSignal;
  maxTokens?: number;
  /** Low temperature for agents that must be consistent (the analyst); higher for conversation. */
  temperature?: number;
  /**
   * MODEL TIERING by latency class.
   *
   * "interactive" — the voice path. The user hears every word, so time-to-first-token is the
   *                 binding constraint and a *smaller, non-reasoning* model usually wins.
   * "background"  — agents nobody is waiting to hear. Latency is free here, so this tier can
   *                 afford a SLOWER, SMARTER model.
   *
   * Named by ROLE, not by speed, because which model is right flips by provider:
   *   anthropic → interactive = Haiku (fast, no thinking), background = Sonnet (better judgement)
   *   ollama    → both the SAME model, because a single local instance holds one at a time and
   *               swapping cost a measured 56-second stall (see below)
   *
   * Why tiering exists at all: running the analyst concurrently on the same 14B model pushed
   * time-to-first-audio from 1463ms to 4307ms. Logically it's off the critical path, but on
   * shared compute it still steals CPU. "Not awaited" is not the same as "free".
   */
  tier?: "interactive" | "background";
};

/** Per-provider model for a latency tier. */
function modelFor(provider: BrainProvider, tier: "interactive" | "background"): string {
  if (provider === "anthropic") {
    // Haiku 4.5 on the voice path specifically because it predates the 4.6 family and so does
    // NOT reason by default — the opposite of the problem Gemini gave us, where thinking could
    // be bounded but never disabled. Sonnet 5 for the analyst: slower, but it's off the path,
    // and stricter JSON adherence is worth real money there.
    return tier === "background"
      ? process.env.ANTHROPIC_BACKGROUND_MODEL || "claude-sonnet-5"
      : process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
  }
  if (provider === "ollama") {
    const main = process.env.OLLAMA_MODEL || "qwen2.5:14b";
    // Default the fast tier to the SAME model. Counter-intuitive, but measured: Ollama holds one
    // model at a time unless OLLAMA_MAX_LOADED_MODELS is raised on the daemon, so a *different*
    // analyst model forces an evict-and-reload every turn — which produced a 56-SECOND stall
    // mid-conversation. A swap costs far more than the contention tiering was meant to avoid.
    // Set OLLAMA_FAST_MODEL explicitly only if the daemon can hold both models resident.
    return tier === "background" ? process.env.OLLAMA_BACKGROUND_MODEL || main : main;
  }
  if (provider === "gemini") {
    return tier === "background"
      ? process.env.GEMINI_BACKGROUND_MODEL || "gemini-3.6-flash"
      : process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }
  return tier === "background"
    ? process.env.OPENAI_BACKGROUND_MODEL || "gpt-4o-mini"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";
}

/** Streams reply text deltas as they're generated. The unit of latency is the FIRST delta. */
export async function* streamBrain(
  messages: ChatMessage[],
  opts: BrainOptions = {},
): AsyncGenerator<string> {
  const provider = activeProvider();
  const o = {
    system: opts.system ?? INTERVIEWER_PERSONA,
    signal: opts.signal,
    maxTokens: opts.maxTokens ?? 160,
    temperature: opts.temperature ?? 0.7,
    model: modelFor(provider, opts.tier ?? "interactive"),
  };
  const gen =
    provider === "gemini"
      ? streamGemini(messages, o)
      : provider === "ollama"
      ? streamOllama(messages, o)
      : provider === "anthropic"
      ? streamAnthropic(messages, o)
      : streamOpenAI(messages, o);
  for await (const delta of gen) yield delta;
}

/** Non-streaming convenience for agents nobody is waiting to HEAR (the analyst). */
export async function completeBrain(
  messages: ChatMessage[],
  opts: BrainOptions = {},
): Promise<string> {
  let out = "";
  for await (const delta of streamBrain(messages, opts)) out += delta;
  return out;
}

type ResolvedOptions = {
  system: string;
  signal?: AbortSignal;
  maxTokens: number;
  temperature: number;
  model: string;
};

async function* streamOpenAI(
  messages: ChatMessage[],
  o: ResolvedOptions,
): AsyncGenerator<string> {
  const client = new OpenAI();
  const stream = await client.chat.completions.create(
    {
      model: o.model,
      messages: [{ role: "system", content: o.system }, ...messages],
      stream: true,
      temperature: o.temperature,
      // Hard cap: a voice agent that monologues is a broken voice agent. Also bounds worst-case turn length.
      max_tokens: o.maxTokens,
    },
    { signal: o.signal },
  );

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

async function* streamGemini(
  messages: ChatMessage[],
  o: ResolvedOptions,
): AsyncGenerator<string> {
  const ai = new GoogleGenAI({});
  const stream = await ai.models.generateContentStream({
    model: o.model,
    // Role vocabulary is translated at the boundary: our neutral "assistant" is Gemini's "model".
    // API dialect must never leak into app state.
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: o.system,
      maxOutputTokens: o.maxTokens,
      temperature: o.temperature,
      // THE LATENCY FIX. gemini-3.6-flash reasons by default — a measured 462 thought tokens for a
      // 7-token reply. Every one of those is dead time before the first audible word, and a voice turn
      // needs reflexes, not deliberation. Floor it.
      // NOTE: budget 0 is REJECTED by this model (400 INVALID_ARGUMENT — verified by bisect); it cannot
      // fully disable thinking, only bound it. 128 is the lowest value confirmed to work.
      thinkingConfig: { thinkingBudget: 128 },
    },
  });

  for await (const chunk of stream) {
    if (o.signal?.aborted) return;
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
  o: ResolvedOptions,
): AsyncGenerator<string> {
  const res = await fetch(`${process.env.OLLAMA_URL || "http://127.0.0.1:11434"}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: o.signal,
    body: JSON.stringify({
      model: o.model,
      messages: [{ role: "system", content: o.system }, ...messages],
      stream: true,
      options: { num_predict: o.maxTokens, temperature: o.temperature },
      // Keep BOTH tiers resident. Without this, Ollama evicts one model to load the other, and a
      // cold reload of the 14B produced a measured 56-SECOND stall mid-conversation. Model tiering
      // trades CPU contention for swap stalls unless the models stay loaded — so pin them.
      // Needs the RAM to hold both (~9GB + ~2GB here) and OLLAMA_MAX_LOADED_MODELS >= 2.
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || "30m",
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

/**
 * Anthropic. ⚠️ WRITTEN BUT NEVER EXECUTED — no API key available at time of writing.
 * Typechecks against the SDK; verify against a real key before relying on it.
 */
async function* streamAnthropic(
  messages: ChatMessage[],
  o: ResolvedOptions,
): AsyncGenerator<string> {
  const client = new Anthropic();

  const stream = await client.messages.create(
    {
      model: o.model,
      max_tokens: o.maxTokens,
      temperature: o.temperature,
      // Anthropic takes the system prompt as a TOP-LEVEL field, not a message with role
      // "system" — so filter it out of the array rather than passing it through.
      system: o.system,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      stream: true,
    },
    { signal: o.signal },
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
