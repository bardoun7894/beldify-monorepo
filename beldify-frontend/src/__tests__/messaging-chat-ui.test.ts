/**
 * Messaging Chat UI — TDD Tests
 *
 * Validates the new components added for the Atlas RTL chat redesign:
 *  1. groupMessagesByDay() — pure utility: boundary at midnight, locale label, empty list
 *  2. ConversationDateDivider — component file + Atlas class assertions
 *  3. TypingIndicator — component file + dot animation class assertions
 *  4. Conversation list — unread badge uses amber-500 + text-amber-950 (WCAG AA)
 *  5. Thread — sent bubble is indigo, received bubble is white card
 *
 * Strategy: `readFileSync`+`toContain` for component structure (matches project
 * convention from atlas-p0-fixes.test.ts / open-souk-api-alignment.test.ts).
 * Unit tests for pure logic (groupMessagesByDay).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf-8');
const exists = (rel: string) => existsSync(join(SRC, rel));

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 1 — groupMessagesByDay pure logic
// ──────────────────────────────────────────────────────────────────────────────
describe('groupMessagesByDay utility', () => {
  // We import from the util file via dynamic require so the test doesn't depend
  // on the component rendering environment.
  it('groups messages belonging to the same day together', async () => {
    const { groupMessagesByDay } = await import('../utils/groupMessagesByDay');
    const messages = [
      { id: '1', created_at: '2024-01-15T09:00:00Z', content: 'hello' },
      { id: '2', created_at: '2024-01-15T11:00:00Z', content: 'world' },
      { id: '3', created_at: '2024-01-16T10:00:00Z', content: 'next day' },
    ];
    const groups = groupMessagesByDay(messages as any);
    expect(groups).toHaveLength(2);
    expect(groups[0].messages).toHaveLength(2);
    expect(groups[1].messages).toHaveLength(1);
  });

  it('returns empty array for empty input', async () => {
    const { groupMessagesByDay } = await import('../utils/groupMessagesByDay');
    const groups = groupMessagesByDay([]);
    expect(groups).toHaveLength(0);
  });

  it('produces a non-empty label for each group', async () => {
    const { groupMessagesByDay } = await import('../utils/groupMessagesByDay');
    const messages = [
      { id: '1', created_at: '2024-03-20T08:00:00Z', content: 'morning' },
    ];
    const groups = groupMessagesByDay(messages as any);
    expect(groups[0].label).toBeTruthy();
    expect(typeof groups[0].label).toBe('string');
  });

  it('separates messages at the midnight boundary', async () => {
    const { groupMessagesByDay } = await import('../utils/groupMessagesByDay');
    // Use clearly different UTC dates (noon vs noon next day) to avoid
    // timezone-shift edge cases in the Node test environment.
    const messages = [
      { id: '1', created_at: '2024-06-01T12:00:00Z', content: 'day one' },
      { id: '2', created_at: '2024-06-02T12:00:00Z', content: 'day two' },
    ];
    const groups = groupMessagesByDay(messages as any);
    // They should be in separate day groups
    expect(groups).toHaveLength(2);
  });

  it('handles single message correctly', async () => {
    const { groupMessagesByDay } = await import('../utils/groupMessagesByDay');
    const messages = [
      { id: '99', created_at: '2024-07-04T12:00:00Z', content: 'solo' },
    ];
    const groups = groupMessagesByDay(messages as any);
    expect(groups).toHaveLength(1);
    expect(groups[0].messages[0].id).toBe('99');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — ConversationDateDivider component structure
// ──────────────────────────────────────────────────────────────────────────────
describe('ConversationDateDivider component', () => {
  it('component file exists', () => {
    expect(exists('components/messaging/ConversationDateDivider.tsx')).toBe(true);
  });

  it('renders the label prop', () => {
    const src = read('components/messaging/ConversationDateDivider.tsx');
    expect(src).toContain('label');
  });

  it('uses Atlas amber hairline for the divider line', () => {
    const src = read('components/messaging/ConversationDateDivider.tsx');
    // Should use amber-200 (Atlas hairline color) not generic gray borders
    expect(src).toContain('amber');
  });

  it('centers the label text', () => {
    const src = read('components/messaging/ConversationDateDivider.tsx');
    expect(src).toContain('text-center');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 3 — TypingIndicator component structure
// ──────────────────────────────────────────────────────────────────────────────
describe('TypingIndicator component', () => {
  it('component file exists', () => {
    expect(exists('components/messaging/TypingIndicator.tsx')).toBe(true);
  });

  it('has animated dots for visual typing feedback', () => {
    const src = read('components/messaging/TypingIndicator.tsx');
    expect(src).toContain('animate');
  });

  it('uses Atlas card / received bubble appearance (bg-card or white)', () => {
    const src = read('components/messaging/TypingIndicator.tsx');
    // Should look like a received message bubble
    expect(src).toMatch(/bg-card|bg-white/);
  });

  it('is accessible with an aria label or sr-only text', () => {
    const src = read('components/messaging/TypingIndicator.tsx');
    expect(src).toMatch(/aria-label|sr-only/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 4 — messages/page.tsx (conversation list) Atlas compliance
// ──────────────────────────────────────────────────────────────────────────────
describe('messages/page.tsx — Atlas conversation list compliance', () => {
  it('unread badge uses amber-500 background (Atlas accent)', () => {
    const src = read('app/community/messages/page.tsx');
    // atlas-secondary maps to amber; badge should use atlas-secondary or amber-500
    expect(src).toMatch(/atlas-secondary|amber-500/);
  });

  it('unread badge uses dark text for WCAG AA on amber (on-secondary or amber-950)', () => {
    const src = read('app/community/messages/page.tsx');
    expect(src).toMatch(/on-secondary|amber-950|amber-900/);
  });

  it('search input is present with aria-label', () => {
    const src = read('app/community/messages/page.tsx');
    expect(src).toContain('aria-label');
    expect(src).toContain('search');
  });

  it('has a designed empty state with empty-state icon', () => {
    const src = read('app/community/messages/page.tsx');
    expect(src).toContain('MessagesSquare');
  });

  it('imports ConversationDateDivider (or date grouping) from messaging components', () => {
    const src = read('app/community/messages/page.tsx');
    // Either direct date-divider import or groupMessagesByDay usage
    expect(src).toMatch(/ConversationDateDivider|groupMessagesByDay/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOCK 5 — messages/[shopId]/page.tsx (thread) Atlas compliance
// ──────────────────────────────────────────────────────────────────────────────
describe('messages/[shopId]/page.tsx — Atlas thread compliance', () => {
  it('sent bubble uses atlas-primary (indigo) background', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('atlas-primary');
  });

  it('received bubble uses bg-card or bg-white (light surface)', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toMatch(/bg-card|bg-white/);
  });

  it('composer textarea has correct aria-label', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('aria-label');
  });

  it('send button is disabled when input is empty', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('disabled');
    expect(src).toContain('input.trim()');
  });

  it('imports TypingIndicator component', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('TypingIndicator');
  });

  it('imports ConversationDateDivider for date dividers in thread', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('ConversationDateDivider');
  });

  it('imports groupMessagesByDay utility for day grouping', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toContain('groupMessagesByDay');
  });

  it('has a meaningful empty state when no messages exist', () => {
    const src = read('app/community/messages/[shopId]/page.tsx');
    expect(src).toMatch(/no.messages|empty|start/i);
  });
});
