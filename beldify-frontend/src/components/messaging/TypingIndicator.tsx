/**
 * TypingIndicator
 *
 * Displays the "other user is typing" indicator as three bouncing dots
 * styled as a received message bubble (bg-card, Atlas ring).
 *
 * Wire up via RealtimeChatContext.onUserTyping() in the parent page.
 * The component is pure presentational — it just animates while mounted.
 */

export function TypingIndicator() {
  return (
    <div
      className="flex items-end gap-2"
      role="status"
      aria-label="The other person is typing"
    >
      {/* Match the small avatar placeholder used in received bubbles */}
      <div className="mb-0.5 h-7 w-7 shrink-0 rounded-full bg-atlas-secondary/20" aria-hidden="true" />

      {/* Bubble — mirrors received message styling */}
      <div className="rounded-2xl rounded-es-md bg-card px-4 py-3 shadow-atlas-sm ring-1 ring-outline/15">
        <span className="sr-only">Typing…</span>
        <div className="flex items-center gap-1" aria-hidden="true">
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/40"
            style={{ animationDelay: '0ms', animationDuration: '900ms' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/40"
            style={{ animationDelay: '150ms', animationDuration: '900ms' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/40"
            style={{ animationDelay: '300ms', animationDuration: '900ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export default TypingIndicator;
