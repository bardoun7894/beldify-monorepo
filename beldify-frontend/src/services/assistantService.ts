/**
 * assistantService — Darija Conversational Shopping Assistant (FR4)
 *
 * Calls the Next.js proxy route at POST /api/buyer-ai/assistant
 * which forwards to Laravel POST /api/buyer-ai/assistant
 * (keeping CSRF cookies + rate-limit middleware in the server-to-server hop).
 *
 * Response contract (backend always returns 200 — AI failure degrades server-side):
 *   { reply: string, products: AssistantProduct[], suggestions: string[] }
 *
 * This service throws real network/HTTP errors so the UI can show
 * a localised retry prompt (FR6 graceful error).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Locale codes accepted by the backend contract. */
export type AssistantLocale = 'ar' | 'ma' | 'fr' | 'en' | 'es';

/** One turn in the conversation history (matches contract exactly). */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** A product returned by the assistant endpoint (server-grounded, locale-aware). */
export interface AssistantProduct {
  id: number;
  name: string;
  price: number | null;
  image: string | null;
  slug: string | null;
}

/** Request payload for POST /api/buyer-ai/assistant. */
export interface AssistantRequest {
  message: string;   // max 500 chars
  history: ConversationTurn[];  // max 10 items (send [] if empty)
  locale: AssistantLocale;
}

/** Response from the assistant endpoint (ALWAYS 200 from backend). */
export interface AssistantResponse {
  reply: string;
  products: AssistantProduct[];  // 0–8 items, server-grounded
  suggestions: string[];          // 0–5 chips
}

// ─────────────────────────────────────────────────────────────────────────────
// Service function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/buyer-ai/assistant (via Next proxy route, not direct to Laravel)
 *
 * Sends the current message + conversation history to the backend.
 * The history array should be capped to the last 10 turns before calling
 * (this function also enforces the cap defensively).
 *
 * - On 200: resolves with {reply, products, suggestions}.
 * - On 422 (validation): throws an Error with the backend's message string.
 * - On 429 (throttle): throws an Error signalling rate-limit.
 * - On network error / 5xx: throws an Error (caller shows localised fallback).
 *
 * NOTE: The backend always returns 200 — AI failures degrade server-side into
 * a generic reply + empty products. This function should NOT swallow real
 * HTTP failures because the UI needs to know to show a retry prompt.
 */
export async function assistant(
  payload: AssistantRequest
): Promise<AssistantResponse> {
  // Enforce client-side caps to match contract
  const body: AssistantRequest = {
    message: payload.message.trim().slice(0, 500),
    history: payload.history.slice(-10),
    locale: payload.locale,
  };

  const res = await fetch('/api/buyer-ai/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include', // forward session cookies for CSRF
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Surface 422 and 429 as errors; let the UI handle display
    const errorData = await res.json().catch(() => ({}));
    const message =
      (errorData as { message?: string }).message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as AssistantResponse;
}
