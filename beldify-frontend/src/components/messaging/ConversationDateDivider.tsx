/**
 * ConversationDateDivider
 *
 * Displays a centered date label between message groups in a chat thread.
 * Uses Atlas amber-200 hairlines (DESIGN.md §8 — "use amber-100/amber-200
 * hairlines for warmth") and muted on-surface-variant text.
 */

interface ConversationDateDividerProps {
  label: string;
}

export function ConversationDateDivider({ label }: ConversationDateDividerProps) {
  return (
    <div
      role="separator"
      aria-label={label}
      className="flex items-center gap-3 px-4 py-2"
    >
      {/* Left hairline */}
      <span className="h-px flex-1 bg-amber-200/60" aria-hidden="true" />

      {/* Centered date label */}
      <span className="shrink-0 select-none rounded-full border border-amber-200/70 bg-amber-50 px-3 py-0.5 text-center text-[11px] font-medium tracking-wide text-amber-900/70">
        {label}
      </span>

      {/* Right hairline */}
      <span className="h-px flex-1 bg-amber-200/60" aria-hidden="true" />
    </div>
  );
}

export default ConversationDateDivider;
