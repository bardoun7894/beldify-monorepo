# Feature Specification: Buyer Address Book & Recently-Viewed Shelf

**Feature Branch**: `018-address-book-recently-viewed`
**Created**: 2026-07-05
**Status**: Draft
**Input**: User description: "Two independent, low-risk buyer-experience features: (1) Buyer Address Book — saved shipping addresses selectable at checkout, managed from an account page. (2) Recently-Viewed Products Shelf — rail of last-viewed products on homepage/PDP, client-side only for v1."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save and reuse a shipping address (Priority: P1)

An authenticated buyer who has ordered before wants to check out without retyping their address every time. They save an address once, then pick it from a list on every future checkout.

**Why this priority**: Directly reduces the highest-friction step in repeat purchase (checkout re-entry), which the KB retention audit flags as a known conversion drag. Independently valuable even without the recently-viewed feature.

**Independent Test**: Can be fully tested by logging in, adding an address in account settings, starting checkout, and confirming the saved address appears as a selectable option that fills the shipping fields — delivers value with zero dependency on story 2.

**Acceptance Scenarios**:

1. **Given** an authenticated buyer with no saved addresses, **When** they open Account → Addresses and submit a new address (label, recipient, phone, city, full address), **Then** it appears in their address list and is marked default if it's their first.
2. **Given** an authenticated buyer with 2+ saved addresses, **When** they reach the checkout shipping step, **Then** they see their saved addresses as selectable options (default pre-selected) instead of an empty free-text form.
3. **Given** an authenticated buyer with a saved address, **When** they edit or delete it from Account → Addresses, **Then** the change is reflected immediately in the address list and in future checkouts.
4. **Given** a guest (not logged in) buyer, **When** they check out, **Then** they still see the existing free-text address form — no change to guest checkout.

---

### User Story 2 - Set a default address (Priority: P2)

A buyer with multiple addresses (e.g., home and a gift-recipient address) wants one marked as default so checkout pre-selects it without extra taps.

**Why this priority**: Meaningful UX polish on top of story 1, but story 1 delivers full value (manual selection) without it.

**Independent Test**: Add two addresses, mark one default, confirm checkout pre-selects that one.

**Acceptance Scenarios**:

1. **Given** a buyer with multiple saved addresses, **When** they mark one as default, **Then** any previously-default address is automatically un-marked (exactly one default at a time).
2. **Given** a buyer with a default address, **When** they start checkout, **Then** the default address is pre-selected but they can still switch to another saved address.

---

### User Story 3 - Rediscover a recently-viewed product (Priority: P2)

A buyer (guest or authenticated) browses several products, gets distracted, and returns to the site later. They want an easy way to find what they were looking at without re-searching.

**Why this priority**: Closes a known retention gap (session dead-ends with no re-entry hook per the KB Hooked-model audit) but is independent of the address-book work — different subsystem, different users benefit.

**Independent Test**: View 3+ product pages, return to the homepage, confirm a "Recently viewed" rail shows those products in most-recent-first order, with no login required.

**Acceptance Scenarios**:

1. **Given** a buyer (guest or authenticated) who has viewed at least 1 product in this browser, **When** they visit the homepage, **Then** a "Recently viewed" rail appears showing their last viewed products, most recent first.
2. **Given** a buyer who has never viewed a product in this browser, **When** they visit the homepage, **Then** the "Recently viewed" rail does not render (no empty-state clutter).
3. **Given** a buyer who has viewed more than the tracked limit (20) of products, **When** the limit is exceeded, **Then** only the most recent 20 are retained and shown.
4. **Given** a buyer viewing a product already in their recently-viewed list, **When** they view it again, **Then** it moves to the front of the list rather than appearing twice.

### Edge Cases

- What happens when a buyer deletes the address currently marked default? → System must auto-promote another saved address to default, or leave "no default" if none remain (checkout falls back to address selection with nothing pre-selected).
- What happens when a buyer deletes an address that's mid-checkout (open cart with that address selected)? → Checkout falls back to the default or prompts re-selection; no orphaned reference to a deleted address.
- What happens when a buyer has zero saved addresses and starts checkout? → Falls back to today's free-text address entry, with a prompt to save it for next time.
- What happens when a recently-viewed product is later deleted or goes out of stock? → It is skipped/filtered from the rail rather than showing a broken link.
- What happens when a buyer clears browser storage? → Recently-viewed list resets to empty (acceptable — it is explicitly ephemeral, client-side only for v1).
- What is the max number of saved addresses per buyer? → Reasonable default cap of 10 to prevent unbounded list growth (assumption, not user-specified).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated buyer to create a saved address with label, recipient name, phone, city, and full address text.
- **FR-002**: System MUST allow an authenticated buyer to list, edit, and delete their own saved addresses; buyers MUST NOT be able to view or modify another buyer's addresses.
- **FR-003**: System MUST allow exactly one saved address per buyer to be marked as default at any time.
- **FR-004**: System MUST present a buyer's saved addresses as selectable options during checkout, pre-selecting the default address when one exists.
- **FR-005**: System MUST leave guest checkout behavior unchanged (free-text address entry, no account required).
- **FR-006**: System MUST cap saved addresses per buyer at 10; attempting to add an 11th MUST be rejected with a clear message to delete one first.
- **FR-007**: System MUST track the most recently viewed products (up to 20) per browser session for both guest and authenticated buyers, without requiring login.
- **FR-008**: System MUST display a "Recently viewed" rail only when at least one tracked product exists; the rail MUST NOT render an empty state.
- **FR-009**: System MUST order the recently-viewed rail most-recent-first, moving a re-viewed product to the front rather than duplicating it.
- **FR-010**: Recently-viewed tracking MUST be scoped to the buyer's browser/device for v1 (no cross-device sync); this is an explicit, documented limitation, not a defect.
- **FR-011**: System MUST omit deleted or unavailable products from the recently-viewed rail at render time.

### Key Entities *(include if feature involves data)*

- **Saved Address**: Belongs to one buyer; attributes are label, recipient name, phone, city, full address text, and a default flag. A buyer may have 0–10 saved addresses.
- **Recently-Viewed Entry**: A client-side (browser-scoped) record of a product identifier and last-viewed timestamp, capped at 20 entries per browser, ordered by recency. Not a server-persisted entity for v1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning buyer with a saved address can complete checkout address selection in under 10 seconds (vs. re-typing a full address today).
- **SC-002**: At least 95% of checkout sessions for buyers with a default saved address require zero manual address entry.
- **SC-003**: The "Recently viewed" rail renders correctly (matches actual browsing order, no duplicates, no dead product links) in 100% of manual test passes across guest and authenticated sessions.
- **SC-004**: Address book management (add/edit/delete) completes with a visible confirmation in under 2 seconds of user action, matching existing account-page interaction patterns.

## Assumptions

- Saved-address cap of 10 per buyer is a reasonable default; not explicitly requested but prevents unbounded growth.
- Recently-viewed v1 is intentionally client-side/localStorage only (per YAGNI) — no cross-device sync, no server persistence, no merge-on-login. This mirrors the existing guest-wishlist pattern and can be escalated later if usage data warrants it.
- The known hardcoded checkout tax-rate issue is explicitly out of scope for this feature and is not touched by this work.
