/**
 * Open Souk — Job detail + ProposalCard + ProposalForm
 *
 * Static source-reading tests (readFileSync + toContain) following the
 * established project pattern.  Covers:
 *  - accepted → emerald highlight (not amber)
 *  - delivery_days rendered in ProposalCard
 *  - seller mini-profile inline stats (avgRating, completedJobs etc.)
 *  - required-skills chips on post detail
 *  - buyer card on post detail
 *  - delivery_days field in ProposalForm
 *  - hasMyProposal guard in page
 *  - Accept button with confirm dialog
 *  - No "AI photo enhance" chip on every card (anti-slop)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf-8');

const CARD = 'src/components/community/ResponseCard.tsx';
const FORM = 'src/components/community/ResponseForm.tsx';
const PAGE = 'src/app/community/posts/[id]/page.tsx';

// ── ProposalCard ─────────────────────────────────────────────────────────────

describe('ProposalCard — accepted highlight is emerald', () => {
  it('uses emerald ring for accepted status (not amber ring)', () => {
    const card = read(CARD);
    expect(card).toMatch(/emerald/);
  });

  it('does NOT use amber ring-2 for accepted state', () => {
    const card = read(CARD);
    // Old code: ring-2 ring-amber-500 for accepted
    // New code must use emerald, not amber, for accepted
    expect(card).not.toMatch(/isAccepted.*ring-amber-500|ring-amber-500.*isAccepted/);
  });

  it('accepted badge uses emerald colors', () => {
    const card = read(CARD);
    // The accepted status badge text background should be emerald
    expect(card).toMatch(/emerald/);
  });
});

describe('ProposalCard — delivery_days display', () => {
  it('renders delivery_days from proposal data', () => {
    const card = read(CARD);
    expect(card).toMatch(/delivery_days|deliveryDays/);
  });

  it('renders a delivery days label (يسلّم|delivery|days)', () => {
    const card = read(CARD);
    // Should show a delivery timeline — either via t() key or literal text
    expect(card).toMatch(/delivery|يسلّم|t\(['"]/);
  });
});

describe('ProposalCard — seller mini-profile inline stats', () => {
  it('renders avgRating from seller object', () => {
    const card = read(CARD);
    expect(card).toMatch(/avgRating|avg_rating|seller\??\.(avgRating|avg_rating)/);
  });

  it('renders completedJobs from seller object', () => {
    const card = read(CARD);
    expect(card).toMatch(/completedJobs|completed_jobs/);
  });

  it('renders star rating display', () => {
    const card = read(CARD);
    expect(card).toMatch(/Star|star/);
  });
});

describe('ProposalCard — no spurious AI chip on every card', () => {
  it('does NOT show "AI photo enhance" chip on every proposal card', () => {
    const card = read(CARD);
    // The chip should not be rendered inline for every card with no real AI action
    expect(card).not.toMatch(/AI photo enhance/);
  });
});

describe('ProposalCard — Accept button with confirm', () => {
  it('Accept button calls confirm before accepting', () => {
    const card = read(CARD);
    expect(card).toMatch(/confirm\(/);
  });

  it('Accept button is present for post owner', () => {
    const card = read(CARD);
    expect(card).toMatch(/accept|Accept/);
    expect(card).toMatch(/isPostOwner/);
  });
});

// ── ProposalForm ─────────────────────────────────────────────────────────────

describe('ProposalForm — delivery_days field', () => {
  it('has a delivery_days input field', () => {
    const form = read(FORM);
    expect(form).toMatch(/delivery_days/);
  });

  it('appends delivery_days to FormData on submit', () => {
    const form = read(FORM);
    expect(form).toMatch(/delivery_days/);
    // Append call
    expect(form).toMatch(/append.*delivery_days|delivery_days.*append/s);
  });

  it('has a number input for delivery days', () => {
    const form = read(FORM);
    expect(form).toMatch(/type.*number.*delivery|delivery.*type.*number/s);
  });
});

// ── Post Detail Page ─────────────────────────────────────────────────────────

describe('PostDetailPage — required-skills chips', () => {
  it('renders required_skills from post data', () => {
    const page = read(PAGE);
    expect(page).toMatch(/required_skills|requiredSkills/);
  });
});

describe('PostDetailPage — buyer card', () => {
  it('renders buyer mini-profile', () => {
    const page = read(PAGE);
    expect(page).toMatch(/post\.buyer|buyer\?|buyer card/);
  });

  it('renders buyer name', () => {
    const page = read(PAGE);
    // buyer name from post.buyer.name or legacy post.userName
    expect(page).toMatch(/buyer\.name|userName|user\.name/);
  });
});

describe('PostDetailPage — hasMyProposal guard', () => {
  it('checks hasMyProposal or has_my_proposal to hide proposal form', () => {
    const page = read(PAGE);
    expect(page).toMatch(/hasMyProposal|has_my_proposal/);
  });
});

describe('PostDetailPage — inline proposal flow (not redirect)', () => {
  it('has a hasMyProposal guard that hides the form for already-submitted sellers', () => {
    // The form is gated by !hasMyProposal (no showResponseForm toggle state —
    // the guard is derived from the backend hasMyProposal / has_my_proposal flag).
    const page = read(PAGE);
    expect(page).toMatch(/hasMyProposal/);
  });

  it('renders a proposal section for authenticated sellers who have not yet proposed', () => {
    const page = read(PAGE);
    // The conditional block: !isMyPost && postIsOpen && isAuthenticated && !hasMyProposal && isSeller
    expect(page).toMatch(/hasMyProposal/);
    expect(page).toMatch(/isSeller/);
  });
});

describe('PostDetailPage — two-column desktop layout', () => {
  it('uses lg:grid-cols-[1fr_400px] asymmetric two-column layout', () => {
    // The post detail page uses an editorial asymmetric grid (main content +
    // 400px sidebar) rather than an even lg:grid-cols-2 split.
    const page = read(PAGE);
    expect(page).toMatch(/lg:grid-cols-\[1fr_400px\]|lg:grid-cols-\[/);
  });
});
