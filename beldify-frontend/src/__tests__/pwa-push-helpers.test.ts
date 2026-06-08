/**
 * TDD: Web Push helper utilities
 * Tests run RED first, then the implementation makes them GREEN.
 */

import { describe, it, expect } from 'vitest';
import {
  urlBase64ToUint8Array,
  buildPushSubscriptionPayload,
} from '@/utils/webPush';

// ── urlBase64ToUint8Array ────────────────────────────────────────────────────

describe('urlBase64ToUint8Array', () => {
  it('converts a base64url VAPID public key to a Uint8Array', () => {
    // Real VAPID public key shape: 65 bytes uncompressed EC point
    const base64url =
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    const result = urlBase64ToUint8Array(base64url);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(65);
  });

  it('handles base64url padding characters correctly', () => {
    // 3-byte value → 4 base64 chars, no padding needed
    const base64url = 'AAAA';
    const result = urlBase64ToUint8Array(base64url);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(3);
  });

  it('converts - and _ to + and / for standard base64 decoding', () => {
    // '-' (0x3E in base64url) → '+', '_' (0x3F) → '/'
    // This encodes [0xf8, 0xff] in base64url as "+P8=" but with url chars: "-P8"
    const base64url = '-P8';
    const result = urlBase64ToUint8Array(base64url);
    expect(result[0]).toBe(0xf8);
    expect(result[1]).toBe(0xff);
  });

  it('throws on empty string', () => {
    expect(() => urlBase64ToUint8Array('')).toThrow();
  });
});

// ── buildPushSubscriptionPayload ─────────────────────────────────────────────

describe('buildPushSubscriptionPayload', () => {
  const mockSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: {
      p256dh: 'BNbxyz1234567890abcdef',
      auth: 'abcdefgh1234',
    },
    toJSON() {
      return {
        endpoint: this.endpoint,
        keys: this.keys,
      };
    },
  } as unknown as PushSubscription;

  it('extracts endpoint, p256dh, and auth from a PushSubscription', () => {
    const payload = buildPushSubscriptionPayload(mockSubscription);
    expect(payload.endpoint).toBe('https://fcm.googleapis.com/fcm/send/abc123');
    expect(payload.keys.p256dh).toBe('BNbxyz1234567890abcdef');
    expect(payload.keys.auth).toBe('abcdefgh1234');
  });

  it('returns a plain object safe for JSON.stringify', () => {
    const payload = buildPushSubscriptionPayload(mockSubscription);
    expect(() => JSON.stringify(payload)).not.toThrow();
    const json = JSON.parse(JSON.stringify(payload));
    expect(json.endpoint).toBeTruthy();
    expect(json.keys).toBeTruthy();
  });

  it('throws if subscription has no endpoint', () => {
    const bad = { endpoint: '', toJSON: () => ({ endpoint: '', keys: {} }) } as unknown as PushSubscription;
    expect(() => buildPushSubscriptionPayload(bad)).toThrow(/endpoint/i);
  });
});
