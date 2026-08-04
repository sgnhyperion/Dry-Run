// Placeholder landing for Dry Run. The real product (the voice-avatar
// interview session) gets built in Phase 1+. Kept dependency-free on purpose:
// this file imports nothing beyond React/Next so the skeleton stays lean.

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
        WORK IN PROGRESS · PHASE 0
      </span>

      <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Dry Run</h1>

      <p className="max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        An affective, self-improving <strong>AI interviewer</strong> you talk to. It
        remembers you, reads your composure from your voice, scores your answers, and
        gets better at pushing you where you&rsquo;re weak.
      </p>

      <p className="text-sm text-gray-400">
        Skeleton is live. Voice + avatar + Claude brain land in Phase 1.
      </p>
    </main>
  );
}
