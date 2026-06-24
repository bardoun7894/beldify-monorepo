'use client';

/**
 * useAiFeatures — AI feature-flag hook
 *
 * Fetches GET /api/ai/features once per page load and returns the flags.
 * Contract: { buyer_assistant: boolean, buyer_ai: boolean, tryon: boolean }
 *
 * Safe defaults: ALL flags are false until the fetch resolves.
 * Error policy: any fetch failure (network, non-ok response, parse error) keeps
 * ALL flags false — never throw, never break the UI.
 *
 * The result is module-level cached so multiple components share one request.
 */

import { useState, useEffect } from 'react';

export interface AiFeatureFlags {
  buyer_assistant: boolean;
  buyer_ai: boolean;
  tryon: boolean;
}

const SAFE_DEFAULT: AiFeatureFlags = {
  buyer_assistant: false,
  buyer_ai: false,
  tryon: false,
};

// Module-level cache: null = not started, Promise = in-flight, AiFeatureFlags = settled
let cache: AiFeatureFlags | null = null;
let inFlight: Promise<AiFeatureFlags> | null = null;

function fetchAiFeatures(): Promise<AiFeatureFlags> {
  if (inFlight) return inFlight;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  inFlight = fetch(`${apiUrl}/api/ai/features`, {
    // Cache for 60 s in the browser
    next: { revalidate: 60 },
  } as RequestInit)
    .then(async (res) => {
      if (!res.ok) return { ...SAFE_DEFAULT };
      const raw = await res.json();
      const flags: AiFeatureFlags = {
        buyer_assistant: Boolean(raw?.buyer_assistant),
        buyer_ai: Boolean(raw?.buyer_ai),
        tryon: Boolean(raw?.tryon),
      };
      cache = flags;
      return flags;
    })
    .catch(() => {
      return { ...SAFE_DEFAULT };
    })
    .finally(() => {
      // Keep inFlight so subsequent hooks reuse the same settled result
    });

  return inFlight;
}

/**
 * React hook that returns the current AI feature flags.
 * Defaults to all-false (hidden) until the one-shot fetch settles.
 */
export function useAiFeatures(): AiFeatureFlags {
  const [flags, setFlags] = useState<AiFeatureFlags>(() => cache ?? { ...SAFE_DEFAULT });

  useEffect(() => {
    // If already cached from a previous mount, skip
    if (cache !== null) {
      setFlags(cache);
      return;
    }

    let cancelled = false;
    fetchAiFeatures().then((resolved) => {
      if (!cancelled) setFlags(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return flags;
}
