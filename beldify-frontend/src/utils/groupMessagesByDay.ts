/**
 * groupMessagesByDay
 *
 * Partitions a chronologically-sorted list of messages into day groups.
 * Each group carries a human-readable label for the ConversationDateDivider.
 *
 * The date key uses the local calendar day (YYYY-MM-DD) so "midnight boundary"
 * is the user's local midnight, matching how people perceive message history.
 */

import { Message } from '@/types/community';

export interface DayGroup {
  /** ISO date string used as the React key (YYYY-MM-DD local). */
  dateKey: string;
  /** Human-readable label shown in the divider (e.g. "Today", "Mon 2 Jun"). */
  label: string;
  messages: Message[];
}

/** Format a Date into a local YYYY-MM-DD string for grouping. */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Produce a short, friendly label for a day bucket. */
function makeDayLabel(dateKey: string): string {
  const today = toLocalDateKey(new Date());

  // Build the date by parsing the key directly (no TZ shift from ISO string).
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // "Today" / "Yesterday" shortcuts.
  if (dateKey === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === toLocalDateKey(yesterday)) return 'Yesterday';

  // Within the current year: short locale string like "Mon 2 Jun".
  const isCurrentYear = y === new Date().getFullYear();
  if (isCurrentYear) {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  // Older: include year.
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Group messages by calendar day.
 *
 * @param messages - List of messages in any order; they will be sorted by created_at.
 * @returns Array of DayGroup objects in chronological order.
 */
export function groupMessagesByDay(messages: Message[]): DayGroup[] {
  if (!messages || messages.length === 0) return [];

  // Sort chronologically first.
  const sorted = [...messages].sort((a, b) => {
    const da = new Date(
      (a as any).created_at ?? (a as any).createdAt ?? 0
    ).getTime();
    const db = new Date(
      (b as any).created_at ?? (b as any).createdAt ?? 0
    ).getTime();
    return da - db;
  });

  const groupMap = new Map<string, Message[]>();

  for (const msg of sorted) {
    const raw = (msg as any).created_at ?? (msg as any).createdAt;
    const date = raw ? new Date(raw) : new Date();
    const key = toLocalDateKey(date);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(msg);
  }

  return Array.from(groupMap.entries()).map(([dateKey, msgs]) => ({
    dateKey,
    label: makeDayLabel(dateKey),
    messages: msgs,
  }));
}
