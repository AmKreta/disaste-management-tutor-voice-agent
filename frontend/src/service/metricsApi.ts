import { BASE_URL } from "./constant";

export type SessionMetricTotals = {
  ttfb_count: number;
  ttfb_avg_seconds: number | null;
  ttfb_max_seconds: number | null;
  llm_prompt_tokens: number;
  llm_completion_tokens: number;
  llm_total_tokens: number;
  tts_characters: number;
  stt_audio_seconds: number;
};

export type SessionMetrics = {
  session_id: string;
  totals: SessionMetricTotals;
  latency: unknown[];
  usage: unknown[];
};

const RETRY_DELAY_MS = 200;
const RETRY_ATTEMPTS = 16;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSessionMetrics(sessionId: string): Promise<SessionMetrics> {
  const path = `${BASE_URL}/metrics/${encodeURIComponent(sessionId)}`;
  const finalize = await fetch(path, { method: "POST" });
  if (finalize.ok) {
    return (await finalize.json()) as SessionMetrics;
  }

  let lastError = new Error(
    finalize.status === 404
      ? "Session metrics are not ready"
      : "Could not load session metrics"
  );

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetch(path);
    if (response.ok) {
      return (await response.json()) as SessionMetrics;
    }
    lastError = new Error(
      response.status === 404
        ? "Session metrics are not ready"
        : "Could not load session metrics"
    );
    if (response.status !== 404 || attempt === RETRY_ATTEMPTS - 1) {
      break;
    }
    await wait(RETRY_DELAY_MS);
  }

  throw lastError;
}
