---
name: specs/017-opensouk-escrow/research.md
description: Auto-synced from specs/017-opensouk-escrow/research.md
type: source
sync_origin: specs/017-opensouk-escrow/research.md
sync_hash: 12f0d9bfa8ed080b
created: 2026-07-06
updated: 2026-07-06
---

<!-- This page is auto-synced from specs/017-opensouk-escrow/research.md by /kb-docs-sync.
     Edits below this line will be overwritten on the next sync. Do not modify. -->

# Research: opensouk-escrow

**Generated**: 2026-07-04
**Feature**: [spec.md](./spec.md) — Open Souk milestone escrow + post-acceptance contract workspace

<!-- Sections below are populated by /kb-spec <mode> before each Spec Kit phase.
     Each section is owned by exactly one mode and is replaced wholesale on re-run. -->

## Prior art from KB

*Queried at 2026-07-04 · Mode: pre · Grounded in OKF ([[concepts/open-souk-feature]]), auto-memory, and direct backend code inspection.*

### Current-state facts (verified in backend code, not just memory)

**Custom-order state machine** (`app/Models/CustomOrder.php`) — 9 states:
`requested → quoted → deposit_paid → in_progress → ready → delivered → closed` (+ `cancelled`). There is also a `deposit_paid` **boolean** column distinct from the status.

**Deposit today is NOT escrow.** `CustomOrderDepositPaymentController` exposes:
- `bankDetails()` — returns the seller's RIB/bank details for a manual transfer
- `store()` — buyer records a deposit payment (quoted → deposit_paid), bank-transfer + receipt upload
- `verify()` — **seller** manually verifies the incoming bank transfer (this route is the currently-uncommitted `custom-orders/{id}/deposit-payment/verify` hunk in the working tree)

So money moves **buyer → seller directly** (peer-to-peer bank transfer, seller-verified). The platform never custodies funds. This is the core gap escrow must close.

**Payout ledger already exists** (models present): `PayoutRequest`, `PayoutSetting`, `StoreRevenue`, plus `Commission*` family (`Commission`, `CommissionTransaction`, `CommissionPayment`, `CommissionBatch`, `CommissionRate`, `CommissionSetting`). Per [[beldify-seller-payouts]] (feature 009, unmerged): manual payout ledger where `available = realized − paid − open`, `/admin/payouts` flow is approve→transfer→mark-paid, and it **never mutates `store_revenues`** directly.

**Payment rails** (per [[beldify-payment-gateway-state]]): Stripe + CMI drivers are real and deployed; webhook marks order paid. Online payment *activation* is a frontend + credentials job, deferred by the user. **CMI is the Moroccan rail.** Today most real money is COD + bank transfer + receipt upload ([[beldify-guest-checkout]]: COD ≤ 500 MAD else transfer+receipt).

**Communication gating** (per [[beldify-opensouk-blind-bidding]]): blind bidding (buyer sees all proposals, seller sees own + count). Buyer↔seller contact is **gated behind an accepted proposal** on `/buyer/messages/send`. Realtime messaging infra is live (Soketi container running on prod, `MessageSent` contract per [[beldify-realtime-messaging]]).

**Proposal acceptance** (just deployed): `PostResponse::accept()` sets the winning proposal `accepted`, moves the post to `in_progress`, and auto-rejects all other pending proposals. Sellers can now edit their own pending proposal ([[beldify-opensouk-edit-proposal-deployed]]).

### What this means for the escrow feature

1. **Escrow is a genuinely new money-custody layer** — not a tweak to the deposit flow. Requires the platform to hold funds (real payment capture via CMI/Stripe, or a manual "funds received into platform account" ledger entry for bank transfer).
2. **The 9-state custom-order machine is the substrate.** Escrow milestones hang off a contract that begins at proposal-acceptance (post → `in_progress`) and should reconcile with `delivered`/`closed`.
3. **Reuse the payout ledger, don't fork it.** Milestone release should feed `StoreRevenue`/`PayoutRequest` "realized" the same way order revenue does — escrow release = the event that makes funds *realized* for the seller.
4. **Contract workspace reuses Soketi/`MessageSent`** — messaging already exists and is acceptance-gated; add deliverables + milestone tracker on top rather than a new channel.
5. **Dispute states are new** and must freeze release until resolved (admin arbitration).

### Open product decisions (genuinely the user's — flagged for spec)

- **Custody model**: true payment-capture escrow (CMI/Stripe holds), or a manual "platform-verified funds held" ledger state layered on bank transfer (matches how deposits work today)?
- **Payment rail for escrow funding**: CMI (Moroccan, deployed driver) vs bank-transfer-with-receipt (current real-money path)?
- **Milestone policy**: buyer-defined at funding, seller-proposed in the bid, or a single "50% upfront / 50% on delivery" default?
- **Dispute arbitration**: admin-only manual resolution, or a structured refund/partial-release policy?
- **Fees**: does the platform commission apply at escrow-release time, and does it reuse `CommissionRate`/`CommissionSetting`?

### Prior-art citations

[[concepts/open-souk-feature]] · [[beldify-opensouk-lifecycle-features]] · [[beldify-payment-gateway-state]] · [[beldify-seller-payouts]] · [[beldify-opensouk-blind-bidding]] · [[beldify-guest-checkout]] · [[beldify-realtime-messaging]] · [[beldify-opensouk-edit-proposal-deployed]] · [[beldify-paid-order-revenue-bugs]]

