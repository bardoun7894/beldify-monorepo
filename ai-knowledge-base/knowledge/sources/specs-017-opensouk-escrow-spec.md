---
name: specs/017-opensouk-escrow/spec.md
description: Auto-synced from specs/017-opensouk-escrow/spec.md
type: source
sync_origin: specs/017-opensouk-escrow/spec.md
sync_hash: bcd465671be636df
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/017-opensouk-escrow/spec.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Feature Specification: Open Souk Milestone Escrow + Contract Workspace

**Feature Branch**: `017-opensouk-escrow`
**Created**: 2026-07-04
**Status**: Draft (default assumptions marked — review before /speckit.plan)
**Input**: "Open Souk milestone escrow + post-acceptance contract workspace: platform-held escrow funded per milestone, released on buyer acceptance/delivery, with dispute states, layered on the existing 9-state custom-order machine and PayoutRequest/StoreRevenue ledger. Contract room = messaging + deliverables + milestone tracker after a proposal is accepted."

> **Why this feature** — Open Souk today has the freelance-marketplace *spine* (post brief → blind bids → buyer picks winner → deliver → review) but money moves **buyer → seller directly** via seller-verified bank transfer. That is the single biggest trust gap versus Upwork/Freelancer: nothing protects the buyer if work isn't delivered, and nothing guarantees the seller gets paid on completion. This feature adds **platform-held escrow with milestone release** plus a **contract workspace** where the accepted parties collaborate.

## Assumptions *(defaults chosen where product decisions were open — flip any before planning)*

- **A1 — Custody model**: Escrow is a **platform-held ledger state** layered on the *existing* bank-transfer + receipt-upload flow (matches how deposits work today). Funds are "held" once an admin/automated check confirms receipt into the platform account; "released" moves them to the seller's realized balance. This ships **without** depending on activating CMI/Stripe online capture (which the user deferred), while leaving a clean seam to swap in CMI capture later.
- **A2 — Payment rail**: bank-transfer-with-receipt now; CMI-ready interface (`EscrowFundingDriver`) so online capture drops in later.
- **A3 — Milestone policy**: the **seller proposes milestones in their bid** (label + amount + est. delivery); buyer funds them at acceptance. Default template when seller proposes none: **50% upfront / 50% on delivery**.
- **A4 — Disputes**: **admin-only manual arbitration**. Raising a dispute freezes release on the affected milestone until an admin resolves (full release, full refund, or split).
- **A5 — Fees**: platform commission is applied **at release time**, reusing `CommissionRate`/`CommissionSetting`; buyer funds the gross, seller realizes net.
- **A6 — Scope of "contract"**: a contract is created when a `PostResponse` is **accepted** (post → `in_progress`). One contract per accepted proposal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buyer funds escrow and releases on delivery (Priority: P1)

After a buyer accepts a seller's proposal, a **contract** is created with the seller's proposed milestones. The buyer funds a milestone (uploads transfer receipt → platform confirms → milestone `funded/held`). The seller does the work, marks the milestone **delivered**; the buyer reviews and **releases**, moving funds to the seller's realized balance. This is the MVP: it makes Open Souk money-safe end-to-end for the happy path.

**Why this priority**: Escrow custody + release is the core trust mechanism; nothing else matters without it. Delivers a viable product on its own.

**Independent Test**: Accept a proposal → fund one milestone → seller marks delivered → buyer releases → assert funds appear as realized in `StoreRevenue`/payout-available and the milestone is `released`.

**Acceptance Scenarios**:

1. **Given** an accepted proposal with a 50/50 milestone plan, **When** the buyer funds milestone 1 and the platform confirms receipt, **Then** milestone 1 status is `held` and the contract shows funds in escrow (not yet the seller's).
2. **Given** milestone 1 is `held`, **When** the seller marks it delivered and the buyer releases it, **Then** the milestone is `released`, platform commission is deducted, and the seller's net is added to realized/payout-available balance.
3. **Given** milestone 1 is `held`, **When** neither party acts, **Then** funds remain held by the platform (never auto-flow to the seller without buyer release or admin action).

### User Story 2 - Contract workspace: chat, deliverables, milestone tracker (Priority: P2)

Once a contract exists, buyer and seller share a **contract room**: acceptance-gated realtime messaging (reuses Soketi/`MessageSent`), a **deliverables** panel (seller uploads files/links per milestone; buyer downloads), and a **milestone tracker** showing each milestone's amount + status. Replaces the thin post-acceptance handoff today.

**Why this priority**: Makes the escrow states legible and gives the parties a place to actually transact. High value but the P1 money flow can be demoed via API without the room.

**Independent Test**: Open a contract → send a message (both directions) → seller attaches a deliverable to milestone 1 → buyer sees it → tracker reflects statuses. Verify a non-party cannot access the room.

**Acceptance Scenarios**:

1. **Given** a contract between buyer B and seller S, **When** B opens the contract room, **Then** B sees the milestone tracker, the deliverables for each milestone, and the message thread — and a third user gets 403.
2. **Given** the seller uploads a deliverable to a `held` milestone, **When** the buyer opens the room, **Then** the deliverable is downloadable and the milestone shows "awaiting review".

### User Story 3 - Dispute + admin arbitration (Priority: P3)

Either party can **raise a dispute** on a `held` milestone (reason + optional evidence). This freezes release. An admin reviews in `/admin/...` and resolves: **release to seller**, **refund to buyer**, or **split**. Resolution is logged and both parties notified.

**Why this priority**: Essential for real trust but only exercised on the unhappy path; P1+P2 are demonstrable without it.

**Independent Test**: Fund a milestone → buyer raises dispute → assert release is blocked → admin resolves as refund → assert buyer refund recorded and milestone `refunded`.

**Acceptance Scenarios**:

1. **Given** a `held` milestone, **When** the buyer raises a dispute, **Then** the milestone becomes `disputed` and neither party can release it.
2. **Given** a `disputed` milestone, **When** an admin resolves it as `split 60/40`, **Then** 60% is released to the seller (net of commission) and 40% refunded to the buyer, and the milestone is `resolved`.

### Edge Cases

- Buyer funds a milestone but the transfer receipt is rejected → milestone returns to `pending`, no funds held.
- Seller marks delivered but buyer neither releases nor disputes within a review window → **[NEEDS CLARIFICATION: auto-release timeout? Upwork uses 14 days. Default assumption: no auto-release in v1; admin can force-release.]**
- Contract is cancelled while a milestone is `held` → held funds must resolve via refund or dispute, never silently vanish.
- Partial funding: buyer funds milestone 1 but not 2 → seller should only start work on funded milestones (surface funded/unfunded clearly).
- Commission rate changes between funding and release → rate is snapshotted at **release** (A5) — document this so revenue is deterministic ([[beldify-paid-order-revenue-bugs]] warns about revenue-recording correctness).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a **Contract** when a `PostResponse` transitions to `accepted` (post → `in_progress`), linking buyer, seller, post, and the accepted proposal.
- **FR-002**: A Contract MUST hold one or more **Milestones**, each with a label, amount (MAD), optional estimated delivery, and a status in `{pending, funded, held, delivered, released, disputed, refunded, resolved, cancelled}`.
- **FR-003**: Milestones MUST be seeded from the seller's proposal; if none provided, System MUST create a default 50%-upfront / 50%-on-delivery plan (A3).
- **FR-004**: Buyer MUST be able to **fund** a milestone; funds MUST enter a platform-held escrow state (`held`) only after receipt confirmation, and MUST NOT be the seller's realized balance until released.
- **FR-005**: Seller MUST be able to mark a `held` milestone **delivered** and attach deliverables.
- **FR-006**: Buyer MUST be able to **release** a `delivered` (or `held`) milestone; on release System MUST deduct platform commission (reusing `CommissionRate`/`CommissionSetting`, snapshotted at release) and add the seller's **net** to realized revenue feeding the existing `StoreRevenue`/`PayoutRequest` ledger — **without** double-counting or mutating `store_revenues` incorrectly.
- **FR-007**: Either party MUST be able to **raise a dispute** on a `held`/`delivered` milestone; a disputed milestone MUST block release until admin resolution.
- **FR-008**: Admin MUST be able to resolve a dispute as **release / refund / split**, with the split amounts recorded and both parties notified.
- **FR-009**: System MUST expose a **contract workspace** to the two parties only (403 for everyone else): milestone tracker, per-milestone deliverables, and acceptance-gated realtime messaging (reuse Soketi `MessageSent`).
- **FR-010**: All escrow state transitions MUST be recorded in an append-only ledger/audit trail (who, when, amount, from→to state) so money movement is fully reconstructable.
- **FR-011**: System MUST NOT let held funds leave escrow except via buyer release or admin resolution (no silent auto-release in v1).
- **FR-012**: Escrow funding MUST go through an `EscrowFundingDriver` abstraction so bank-transfer (v1) and CMI/Stripe capture (later) are interchangeable (A2). **[NEEDS CLARIFICATION: confirm CMI is the target online rail.]**
- **FR-013**: Contract, milestone, and dispute events MUST notify the relevant party (reuse existing notification/Web Push infra).

### Key Entities

- **Contract**: one per accepted proposal. Attributes: buyer, seller (store), community post, source `PostResponse`, status, created/closed timestamps. Bridges the Open Souk proposal world and the escrow/payout world.
- **Milestone**: belongs to a Contract. Attributes: label, gross amount (MAD), commission snapshot, net amount, status, estimated delivery, funded-at / held-at / released-at timestamps.
- **EscrowLedgerEntry**: append-only money-movement record (milestone, direction buyer→escrow / escrow→seller / escrow→buyer-refund, amount, actor, reason).
- **Deliverable**: belongs to a Milestone. File/link uploaded by seller, downloadable by buyer.
- **Dispute**: belongs to a Milestone. Raiser, reason, evidence, admin resolution (release/refund/split + amounts), resolved-by/at.
- **ContractMessage**: reuses/extends existing messaging; scoped to the Contract's two parties.

Relationships: `CustomOrder`/Open Souk post → Contract (1:1 on acceptance) → Milestones (1:N) → {Deliverables, Disputes} (1:N) and EscrowLedgerEntries (1:N). Release feeds → `StoreRevenue`/`PayoutRequest` (existing ledger, [[beldify-seller-payouts]]).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A buyer can fund → have a seller deliver → release a milestone end-to-end, with the released net appearing correctly in the seller's payout-available balance (0 revenue-accounting discrepancies across a reconciliation test).
- **SC-002**: 100% of held funds are accounted for at all times — every MAD in escrow maps to exactly one milestone in a `held`/`disputed` state; a reconciliation query never finds orphaned or double-counted funds.
- **SC-003**: A non-party is never able to read a contract room, its deliverables, or its messages (403 on every access path).
- **SC-004**: A disputed milestone can never be released by either party; only an admin resolution changes its terminal state.
- **SC-005**: Every escrow money movement is reconstructable from the append-only ledger (who/when/amount/state-transition) for audit.

