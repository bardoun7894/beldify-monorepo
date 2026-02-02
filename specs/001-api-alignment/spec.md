# Feature Specification: Frontend-Backend API Alignment

**Feature Branch**: `001-api-alignment`
**Created**: 2026-01-31
**Status**: Draft
**Input**: User description: "Align frontend API calls with backend routes across all domains (messaging, community, cart, wishlist, auth, reviews) as documented in frontend-backend-alignment.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buyer Messaging Works End-to-End (Priority: P1)

A buyer opens their messages, views conversations, sends a message, and sees the unread count update correctly. All messaging actions route to the correct backend buyer endpoints without fallback logic or cross-domain leakage.

**Why this priority**: Messaging is a core buyer-seller interaction. Broken messaging directly blocks transactions and user trust.

**Independent Test**: Can be fully tested by logging in as a buyer, listing conversations, sending a message to a shop, marking it read, and checking the unread count — all calls hit the correct `/api/v1/buyer/messages/*` backend routes.

**Acceptance Scenarios**:

1. **Given** a logged-in buyer, **When** they open the messages page, **Then** conversations are fetched from the correct buyer messaging endpoint and displayed.
2. **Given** a logged-in buyer with unread messages, **When** the unread count is requested, **Then** the count is fetched from the correct unread-count endpoint (not the mismatched `/unread` path).
3. **Given** a buyer viewing a conversation, **When** they mark it as read, **Then** the system calls the correct backend mark-read endpoint with the message ID.
4. **Given** a buyer sending a message, **When** the message is submitted, **Then** it is sent via the correct domain-specific send endpoint.

---

### User Story 2 - Cart and Checkout Operations Are Consistent (Priority: P1)

A buyer adds items to their cart, applies a coupon, removes a coupon, and proceeds through the checkout flow. All cart operations use the correct backend endpoints and payload shapes.

**Why this priority**: Cart and checkout directly impact revenue. Misaligned endpoints cause failed purchases.

**Independent Test**: Can be tested by adding an item to the cart with stock and variant details, applying a coupon, removing it, and verifying each call succeeds against the backend.

**Acceptance Scenarios**:

1. **Given** a buyer on a product page, **When** they add an item to cart, **Then** the request includes stock and variant details in the correct payload format.
2. **Given** a buyer with items in cart, **When** they apply a coupon, **Then** the request uses the correct apply-coupon endpoint.
3. **Given** a buyer with an applied coupon, **When** they remove it, **Then** the request uses the correct remove-coupon endpoint and method.

---

### User Story 3 - Community Posts and Responses Work Correctly (Priority: P2)

A user creates, updates, and deletes community posts. They accept or reject responses to their posts. All community operations route to the versioned backend endpoints.

**Why this priority**: Community features drive engagement but are not transaction-critical.

**Independent Test**: Can be tested by creating a community post, updating it, accepting a response, and deleting the post — verifying all calls use the correct versioned routes.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a community post, **Then** the request goes to the correct versioned community posts endpoint.
2. **Given** a post with responses, **When** the author accepts a response, **Then** the request uses the backend accept endpoint (not a generic CRUD status endpoint).
3. **Given** a post author, **When** they update or delete their post, **Then** the request goes to the correct versioned endpoint with the correct method.

---

### User Story 4 - Wishlist Operations Are Aligned (Priority: P2)

A buyer adds products to their wishlist, views the list, and removes products. All wishlist calls use the correct backend endpoints.

**Why this priority**: Wishlist supports purchase intent but is not blocking for core transactions.

**Independent Test**: Can be tested by adding a product to wishlist, listing items, and removing a product — verifying each call uses the correct backend path.

**Acceptance Scenarios**:

1. **Given** a logged-in buyer, **When** they add a product to their wishlist, **Then** the request uses the correct backend wishlist endpoint and path.
2. **Given** a buyer with wishlist items, **When** they remove a product, **Then** the request targets the correct product-based deletion endpoint.

---

### User Story 5 - Auth and Profile Endpoints Are Correct (Priority: P2)

A buyer fetches their profile and password reset flows use the correct backend routes or are gracefully handled when backend routes do not exist.

**Why this priority**: Auth is foundational but the misalignments here are narrow (profile path, password reset availability).

**Independent Test**: Can be tested by fetching the user profile and verifying the call targets the correct backend profile endpoint.

**Acceptance Scenarios**:

1. **Given** a logged-in buyer, **When** the frontend fetches their profile, **Then** it calls the correct backend profile endpoint.
2. **Given** a buyer requesting a password reset, **When** the frontend initiates the flow, **Then** it either calls a valid backend API route or redirects to the web-based password reset flow.

---

### User Story 6 - Reviews Use Product-Based Endpoints (Priority: P3)

A buyer views product reviews, submits a review, and reacts to reviews. All review operations use the product-based backend endpoints.

**Why this priority**: Reviews enhance trust but are supplementary to core buying flows.

**Independent Test**: Can be tested by listing reviews for a product, submitting a review, and reacting — verifying all calls use the product-based routes.

**Acceptance Scenarios**:

1. **Given** a product page, **When** reviews are loaded, **Then** the request goes to the correct product-based reviews endpoint.
2. **Given** a buyer submitting a review, **When** the review is posted, **Then** it uses the correct product reviews endpoint.
3. **Given** a buyer reacting to a review, **When** the reaction is submitted, **Then** it uses the correct product review reaction endpoint.

---

### User Story 7 - Seller and Community Messaging Use Correct Domains (Priority: P2)

Seller messaging routes to the seller messaging domain and community messaging routes to the community messaging domain. No cross-domain fallback exists.

**Why this priority**: Domain separation prevents data leakage and ensures correct message routing.

**Independent Test**: Can be tested by sending a message as a seller and as a community user, verifying each hits the correct domain-specific endpoint.

**Acceptance Scenarios**:

1. **Given** a seller sending a message, **When** the message is submitted, **Then** it routes to the seller messaging domain.
2. **Given** a community user sending a message, **When** the message is submitted, **Then** it routes to the community messaging domain.
3. **Given** any messaging call, **When** the primary endpoint is used, **Then** no fallback to a different domain occurs.

---

### Edge Cases

- What happens when a frontend call targets a backend route that does not exist (e.g., cart merge-guest, checkout)? The system should return a clear error, not silently fail or fall back.
- What happens when a buyer tries to mark a message as read but the backend only supports mark-read by message ID (not by shop ID)? The frontend must resolve the correct message ID before calling.
- What happens when the community response CRUD endpoints are called but the backend only supports accept/reject? The frontend must use accept/reject or the backend must add CRUD routes.
- What happens when hardcoded production URLs are used in a staging or development environment? Environment-based URL resolution must be used everywhere.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST route all buyer messaging calls through the correct buyer messaging backend endpoints with correct path segments.
- **FR-002**: System MUST route all seller messaging calls through the correct seller messaging backend endpoints.
- **FR-003**: System MUST route all community messaging calls through the correct community messaging backend endpoints.
- **FR-004**: System MUST NOT contain cross-domain messaging fallback logic in frontend proxies.
- **FR-005**: System MUST use the message-ID-based mark-read pattern as the canonical approach across all messaging domains.
- **FR-006**: System MUST use the correct backend coupon endpoints for apply and remove operations.
- **FR-007**: System MUST use the correct backend cart-items endpoint with stock and variant details for adding items to cart.
- **FR-008**: System MUST use the correct backend wishlist endpoints for list, add, and remove operations.
- **FR-009**: System MUST use the correct backend profile endpoint for fetching user data.
- **FR-010**: System MUST use product-based review endpoints for listing, submitting, and reacting to reviews.
- **FR-011**: System MUST route all community post operations through the correct versioned backend endpoints.
- **FR-012**: System MUST use accept/reject endpoints for community responses.
- **FR-013**: System MUST replace all hardcoded production URLs with environment-based configuration.
- **FR-014**: System MUST use Next.js API proxies for all browser-initiated API calls to avoid CORS issues.
- **FR-015**: System MUST handle missing backend routes (cart merge-guest, checkout, buyer message check) by removing the frontend calls and adding TODO comments for future backend implementation. (Resolved: defer backend routes, frontend-only scope.)

### Key Entities

- **Messaging Domain**: One of buyer, seller, or community. Determines the base URL path for all messaging operations.
- **Conversation**: A thread of messages between a buyer and a shop or between community users.
- **Cart Item**: A product with stock and variant details added to a buyer's cart.
- **Community Post**: User-generated content with responses that can be accepted or rejected.
- **Review**: A product-specific review with reactions, tied to a product ID.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of frontend API calls match the documented backend route paths with no path mismatches remaining in the codebase.
- **SC-002**: Zero cross-domain messaging fallback logic exists in the frontend proxy layer.
- **SC-003**: All buyer flows (cart, messaging, wishlist, reviews, auth) complete successfully end-to-end without routing errors.
- **SC-004**: All seller and community messaging flows complete successfully with correct domain routing.
- **SC-005**: Zero hardcoded production URLs remain in frontend source code; all API calls use environment-based configuration.
- **SC-006**: All community post and response operations complete successfully against the versioned backend endpoints.

## Assumptions

- The backend routes documented in `frontend-backend-alignment.md` are accurate and currently deployed.
- Backend aliases for deprecated routes will be handled as a separate concern and are not part of this feature's scope.
- The CSRF token handling will continue to work through the existing proxy mechanism; no changes to CSRF flow are in scope unless a routing change breaks it.
- Password reset will default to redirecting to the existing web-based flow unless a backend API route is added.
- The cart merge-guest and checkout routes are assumed to be deferred unless clarified otherwise.

## Out of Scope

- Adding new backend endpoints (unless clarified in FR-015).
- Changes to the backend codebase.
- UI/UX changes — this is purely an API routing alignment.
- Performance optimization of API calls.
- Authentication flow changes beyond correcting the profile endpoint path.
