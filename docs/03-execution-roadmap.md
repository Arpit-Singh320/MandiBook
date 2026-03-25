# Execution Roadmap

## 1. Delivery Strategy

The project should be completed in controlled phases instead of page-by-page random fixes.

The recommended order is:

1. stabilize contracts and auth foundations
2. finish farmer portal end-to-end
3. finish manager portal end-to-end
4. finish admin portal end-to-end
5. close operational/security gaps
6. add reporting, QA, and polish

This order minimizes rework because:

- auth and type mismatches affect every portal
- farmer portal is the most important product journey
- manager/admin portals depend on stable booking, slot, price, notification, and audit behavior

## 2. Phase Plan

## Phase 0 - Baseline Stabilization

### Objectives

- freeze active codebase path
- align frontend and backend contracts
- confirm route ownership and actor flows
- remove high-risk auth/session inconsistencies

### Tasks

- correct `lib/data-api.ts` types to match actual backend payloads
- normalize association names used by frontend components
- verify every auth response shape in `lib/api.ts`
- enforce logout invalidation or remove misleading `tokenVersion` semantics until properly enforced
- review manager scoping on resource mutation routes
- document all current API contracts

### Deliverables

- accurate API client typings
- no broken session restore
- stable auth/session behavior

### Acceptance Criteria

- frontend no longer assumes fields missing from backend responses
- session restore works after reload for all actor roles
- logout actually removes effective access from UI and, ideally, server validation path

## Phase 1 - OTP/Auth Refactor

### Objectives

- replace fragile email OTP flow
- unify verification semantics
- support unique OTP request tracking

### Tasks

- introduce dedicated OTP request entity/model
- redesign farmer email OTP flow
- redesign admin second-factor flow to use request IDs
- add resend, expiry, attempt count, and consumption rules
- update frontend login pages to submit `otpRequestId`

### Deliverables

- robust email OTP architecture
- reliable admin second-factor flow
- auditable OTP lifecycle

### Acceptance Criteria

- email OTP verification does not rely on OTP fields directly on `User`
- every OTP send returns unique request id
- verification succeeds only for correct request id + identifier + code
- resend creates or rotates request state safely

## Phase 2 - Finish Farmer Portal

### Objectives

- make farmer experience fully real and production-like

### Tasks

- finish farmer profile rewrite with live APIs
- add booking cancellation action in farmer bookings page
- restore real nearby mandi experience using `/api/mandis/nearby`
- connect preferred mandis update UI
- connect price alert crop preferences UI
- add farmer issue reporting page or panel
- review caching/loading/error UX on all farmer pages

### Deliverables

- fully backend-driven farmer portal

### Acceptance Criteria

- no mock data remains in farmer protected routes
- farmer can login, complete profile, browse mandis, book slot, view QR, cancel booking, view prices, manage notifications, and update profile/preferences

## Phase 3 - Finish Manager Portal

### Objectives

- connect every manager page to real APIs

### Tasks

- rewrite manager dashboard with `/dashboard/manager`
- rewrite booking management with `/bookings/mandi/:mandiId`
- wire check-in and complete actions
- rewrite slots page with `/slots` CRUD
- rewrite prices page with `/prices` list/update/create`
- rewrite notifications page with `/notifications` and `/notifications/broadcast`
- rewrite reports page with `/dashboard/manager/reports`
- add manager issue management page using `/issues`

### Deliverables

- live manager operations console

### Acceptance Criteria

- no manager page uses mock arrays
- bookings, slot changes, and price updates immediately reflect backend state
- manager can broadcast notifications and resolve issues for own mandi only

## Phase 4 - Finish Admin Portal

### Objectives

- connect admin governance, analytics, and operations UI to real APIs

### Tasks

- rewrite admin dashboard with `/dashboard/admin`
- rewrite mandi management with `/mandis` CRUD + toggle + stats
- rewrite user management with `/users` list/detail/status + create manager
- rewrite analytics with `/dashboard/analytics`
- rewrite price overview with `/prices/overview`
- rewrite notifications with `/notifications` + admin broadcast`
- rewrite issues with `/issues`
- rewrite reports with `/dashboard/admin/reports`
- rewrite audit logs with `/audit-logs`

### Deliverables

- live admin control plane

### Acceptance Criteria

- no admin protected page uses mock data
- admin can manage users, mandis, prices, issues, analytics, notifications, and audit logs through real APIs

## Phase 5 - Security and Data Integrity Hardening

### Objectives

- close correctness, race condition, and authorization gaps

### Tasks

- enforce `tokenVersion` check or remove dead invalidation logic
- enforce manager resource scoping against `req.user.mandiId`
- add transactional protection for slot booking and slot count increments
- add duplicate booking guards
- add stronger input validation with `express-validator`
- add resend throttling and verification attempt caps for OTP flows
- add audit log coverage where missing

### Deliverables

- hardened backend behavior

### Acceptance Criteria

- manager cannot mutate another mandi's bookings/slots/prices
- two simultaneous booking attempts cannot oversubscribe the same slot easily
- OTP brute-force and replay paths are rate-limited and traceable

## Phase 6 - Reporting, Testing, and Demo Readiness

### Objectives

- make project submission/demo safe

### Tasks

- add API smoke test coverage
- add frontend typecheck/lint cleanup
- validate seeded data against all three portals
- verify login flows across phone/email/admin 2FA
- prepare screenshots/demo scripts
- ensure docs reflect final implementation

### Deliverables

- stable demo build
- submission-ready architecture docs

### Acceptance Criteria

- critical flows pass manual QA
- no demo page shows placeholder/mock metrics unless explicitly labeled
- documentation matches delivered product behavior

## 3. Work Breakdown by Module

## Auth Module

Priority: `P0`

Must finish before large portal work because every route depends on it.

### Required backend changes

- dedicated OTP request model
- request id-based verification
- stronger resend and attempt handling
- token invalidation validation

### Required frontend changes

- login pages must carry request id state
- better loading/error messaging
- consistent redirect rules after auth

## Booking Module

Priority: `P0`

### Required backend changes

- transactional booking creation
- duplicate booking prevention
- improved cancellation and check-in validation

### Required frontend changes

- farmer booking management actions
- manager booking operations
- booking details and QR handling

## Mandi + Slot Module

Priority: `P1`

### Required backend changes

- manager scope checks
- optional bulk slot operations later

### Required frontend changes

- nearby mandi geolocation integration
- manager slot CRUD integration
- admin mandi CRUD integration

## Prices Module

Priority: `P1`

### Required backend changes

- optional anomaly endpoints later
- validation around duplicate crop entries per mandi already partially present

### Required frontend changes

- farmer live browsing
- manager update/create flows
- admin comparison dashboard integration

## Notifications Module

Priority: `P1`

### Required backend changes

- possibly add filtering by type and pagination controls
- consider delivery channels later

### Required frontend changes

- manager/admin broadcast forms
- all actor notification pages on real APIs

## Issues Module

Priority: `P2`

### Required backend changes

- maybe comment thread/history later
- assignment validation later

### Required frontend changes

- farmer issue submission UI
- manager issue queue UI
- admin issue oversight UI

## Reports and Analytics Module

Priority: `P2`

### Required frontend changes

- charts and summaries must consume real dashboard/report endpoints
- remove all static graph values

## 4. Recommended Sprint Order

## Sprint 1

- API contract alignment
- OTP redesign backend
- login page refactor
- auth/session stabilization

## Sprint 2

- farmer profile
- farmer bookings actions
- nearby mandis live flow
- farmer preferences and issue reporting

## Sprint 3

- manager dashboard
- manager bookings
- manager slots
- manager prices

## Sprint 4

- manager notifications
- manager reports
- admin dashboard
- admin mandis
- admin users

## Sprint 5

- admin analytics
- admin prices
- admin notifications
- admin issues
- admin reports
- admin audit logs

## Sprint 6

- security hardening
- validation
- QA
- demo readiness

## 5. Recommended Ownership Structure

If work is split among team members:

- `Member A` - auth + OTP + session + backend validations
- `Member B` - farmer portal end-to-end
- `Member C` - manager portal end-to-end
- `Member D` - admin portal + analytics + audit logs
- `Member E` - testing, documentation, diagrams, QA support

## 6. Critical Dependencies

- OTP redesign must happen before claiming email OTP is production-ready
- contract alignment must happen before manager/admin UI rewrites
- booking hardening must happen before live manager check-in/completion demos
- manager scope protection must happen before admin/manager acceptance testing

## 7. Final Recommended Immediate Next Actions

1. fix API typings and response alias mismatches
2. implement OTP request-id design in backend and auth frontend
3. finish remaining farmer pages
4. rewrite manager portal with real APIs
5. rewrite admin portal with real APIs
6. harden security and booking integrity

This is the fastest path to a fully working project without repeatedly rewriting the same files.
