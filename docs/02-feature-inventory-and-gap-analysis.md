# Feature Inventory and Gap Analysis

## Status Legend

- `Working` - implemented in backend and meaningfully connected in frontend
- `Backend Only` - backend API exists but frontend is not wired properly
- `Frontend Mock Only` - UI exists but is still driven by mock/static data
- `Partial` - some integration exists but behavior, payloads, or UX are incomplete
- `Missing` - not implemented in a meaningful way in either layer

## 1. Full Feature Inventory

## A. Public Website / Entry Experience

### Landing Page

- marketing homepage
- hero section
- feature showcase
- social proof
- stats
- comparison section
- FAQ
- CTA
- footer

Status: `Working` as a marketing frontend feature

### Actor Entry Points

- farmer login page
- manager login page
- admin login page

Status: `Partial`

Reason:

- pages exist and connect to auth context
- manager and admin credential flows are real
- farmer phone/email OTP request and verification are connected
- admin login UI says "authenticator app" in one place while backend actually sends code via email
- farmer login redirect logic does not fully distinguish all profile-completion cases in the page itself and relies on route guard behavior

## B. Farmer Features

### 1. Farmer Authentication

#### Phone OTP Login

Frontend:

- request OTP by phone
- enter 6-digit code
- verify and login

Backend:

- `POST /api/auth/farmer/send-otp`
- `POST /api/auth/farmer/verify-otp`
- Twilio Verify integration

Status: `Working`, with operational dependency on valid Twilio setup

#### Email OTP Login

Frontend:

- request OTP by email
- enter 6-digit code
- verify and login

Backend:

- `POST /api/auth/farmer/send-email-otp`
- `POST /api/auth/farmer/verify-email-otp`
- Brevo email send
- OTP stored on `User`

Status: `Partial / Unreliable`

Main problems:

- OTP tied directly to user record instead of a dedicated request
- no unique OTP request id
- poor support for resends/concurrency/attempt tracking
- fragile behavior for first-time users created with empty `name`
- email delivery or verification mismatch can present as invalid OTP

### 2. Profile Completion

Frontend:

- `app/farmer/complete-profile/page.tsx`
- collects name, location, farm size, crops, language

Backend:

- `PUT /api/auth/complete-profile`

Status: `Working`

Notes:

- route guard already redirects incomplete farmer profiles
- some fields available in backend model are not exposed in this form yet, such as land holding and preferred mandis

### 3. Farmer Route Protection

Frontend:

- `app/farmer/layout.tsx`

Behavior:

- unauthenticated user redirected to `/farmer-login`
- non-farmer redirected away
- incomplete profile redirected to `/farmer/complete-profile`

Status: `Working`

### 4. Farmer Dashboard

Frontend:

- `app/farmer/page.tsx`

Backend:

- `GET /api/dashboard/farmer`

Status: `Partial`

What is real:

- page has been migrated to live dashboard API

What is still weak:

- frontend and backend dashboard payload shapes must stay aligned carefully
- nearby/preferred mandi enrichment is still limited

### 5. Slot Booking

Frontend:

- `app/farmer/book-slot/page.tsx`

Backend:

- `GET /api/mandis`
- `GET /api/slots?mandiId=...&date=...`
- `POST /api/bookings`

Status: `Working`

What is real:

- mandi selection
- date/slot fetching
- booking creation
- QR generation returned from backend

Remaining concerns:

- no prevention of duplicate bookings for same farmer/date/slot
- slot concurrency protection is basic and may need transactional hardening
- no booking confirmation notification surface beyond notification record creation

### 6. My Bookings

Frontend:

- `app/farmer/bookings/page.tsx`

Backend:

- `GET /api/bookings/my`
- `PUT /api/bookings/:id/cancel`
- `GET /api/bookings/:id`

Status: `Partial`

What is real now:

- listing from API
- search/filter against live data
- QR display support

What is still missing:

- cancellation action not yet exposed in rewritten UI
- response shape mismatch risk because backend returns association alias `mandi` while frontend types sometimes expect `Mandi`
- no pagination handling in UI

### 7. Crop Prices

Frontend:

- `app/farmer/prices/page.tsx`

Backend:

- `GET /api/prices`

Status: `Partial`

What is real now:

- live price fetch

What is missing:

- no mandi-specific filtering UI
- contract mismatch risk because backend includes association alias `mandi`, while frontend sometimes expects `Mandi`
- no price alert subscription management from this screen

### 8. Notifications

Frontend:

- `app/farmer/notifications/page.tsx`

Backend:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

Status: `Working`

Remaining concerns:

- notification type enum values from backend are more specific than frontend display categories
- no pagination in UI

### 9. Nearby Mandis

Frontend:

- `app/farmer/nearby-mandis/page.tsx`

Backend:

- `GET /api/mandis`
- `GET /api/mandis/nearby`

Status: `Partial`

What is real now:

- live mandi list fetch

What is missing:

- geolocation-powered nearby search is not using `/api/mandis/nearby`
- original map-based experience was effectively removed during rewrite and needs proper restoration if map is required
- live distance sorting is not currently integrated in the rewritten version

### 10. Farmer Profile

Frontend:

- `app/farmer/profile/page.tsx`

Backend support exists via:

- `/api/auth/me`
- `PUT /api/users/profile`
- `PUT /api/users/preferred-mandis`
- `GET /api/bookings/my`

Status: `Frontend Mock Only`

Current problem:

- profile page still uses local mock data for stats, booking history, preferred mandis, crops, and preference views
- page has not yet been rewritten to live APIs

### 11. Price Alert Preferences

Backend support:

- user model contains `priceAlertCrops`
- `/api/users/profile` allows updating `priceAlertCrops`

Frontend:

- visible as mock chip UI in profile/preferences

Status: `Backend Only / Frontend Mock Only`

### 12. Farmer Issue Reporting

Backend:

- `POST /api/issues`

Frontend:

- no dedicated farmer issue reporting page found in current portal routes

Status: `Backend Only`

## C. Manager Features

### 1. Manager Authentication

Frontend:

- `app/manager-login/page.tsx`

Backend:

- `POST /api/auth/manager/login`

Status: `Working`

### 2. Manager Route Protection

Frontend:

- `app/manager/layout.tsx`

Status: `Working`

### 3. Manager Dashboard

Frontend:

- `app/manager/page.tsx`

Backend:

- `GET /api/dashboard/manager`

Status: `Frontend Mock Only`

Notes:

- backend has useful stats, top crops, available slots, and recent bookings
- frontend still renders fully static dashboard cards and tables

### 4. Booking Management

Frontend:

- `app/manager/bookings/page.tsx`

Backend:

- `GET /api/bookings/mandi/:mandiId`
- `PUT /api/bookings/:id/checkin`
- `PUT /api/bookings/:id/complete`
- `GET /api/bookings/:id`

Status: `Frontend Mock Only`

What backend can already do:

- list mandi bookings
- summarize statuses
- check in confirmed bookings
- complete checked-in bookings

What UI still lacks:

- actual API fetch
- QR-based validation/check-in workflow
- booking detail modal bound to live data
- action buttons wired to backend

### 5. Slot Management

Frontend:

- `app/manager/slots/page.tsx`

Backend:

- `GET /api/slots`
- `POST /api/slots`
- `PUT /api/slots/:id`
- `PUT /api/slots/:id/toggle`
- `DELETE /api/slots/:id`

Status: `Frontend Mock Only`

### 6. Price Management

Frontend:

- `app/manager/prices/page.tsx`

Backend:

- `GET /api/prices?mandiId=...`
- `PUT /api/prices/:id`
- `POST /api/prices`

Status: `Frontend Mock Only`

### 7. Manager Notifications

Frontend:

- `app/manager/notifications/page.tsx`

Backend:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `POST /api/notifications/broadcast`

Status: `Frontend Mock Only`

### 8. Manager Reports

Frontend:

- `app/manager/reports/page.tsx`

Backend:

- `GET /api/dashboard/manager/reports`

Status: `Frontend Mock Only`

### 9. Manager Issue Handling

Backend:

- `GET /api/issues`
- `PUT /api/issues/:id`

Frontend:

- no manager issue page found in current route tree

Status: `Backend Only`

## D. Admin Features

### 1. Admin Authentication

Frontend:

- `app/admin-login/page.tsx`

Backend:

- `POST /api/auth/admin/login`
- `POST /api/auth/admin/verify-2fa`

Status: `Partial`

What works:

- credential step
- second-step verification via emailed code

What is weak:

- UI text still references authenticator app in one location even though backend uses email code
- second factor uses same OTP storage fields as farmer email auth
- no dedicated 2FA request tracking

### 2. Admin Route Protection

Frontend:

- `app/admin/layout.tsx`

Status: `Working`

### 3. Admin Dashboard

Frontend:

- `app/admin/page.tsx`

Backend:

- `GET /api/dashboard/admin`

Status: `Frontend Mock Only`

### 4. Mandi Management

Frontend:

- `app/admin/mandis/page.tsx`

Backend:

- `GET /api/mandis`
- `GET /api/mandis/:id`
- `POST /api/mandis`
- `PUT /api/mandis/:id`
- `PUT /api/mandis/:id/toggle`
- `GET /api/mandis/:id/stats`

Status: `Frontend Mock Only`

### 5. User Management

Frontend:

- `app/admin/users/page.tsx`

Backend:

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id/status`
- `POST /api/users/manager`

Status: `Frontend Mock Only`

### 6. Platform Analytics

Frontend:

- `app/admin/analytics/page.tsx`

Backend:

- `GET /api/dashboard/analytics`

Status: `Frontend Mock Only`

### 7. Price Overview

Frontend:

- `app/admin/prices/page.tsx`

Backend:

- `GET /api/prices/overview`
- `GET /api/prices`
- `POST /api/prices`

Status: `Frontend Mock Only`

### 8. Admin Notifications / Broadcast

Frontend:

- `app/admin/notifications/page.tsx`

Backend:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `POST /api/notifications/broadcast`

Status: `Frontend Mock Only`

### 9. Issues & Complaints

Frontend:

- `app/admin/issues/page.tsx`

Backend:

- `GET /api/issues`
- `PUT /api/issues/:id`

Status: `Frontend Mock Only`

### 10. Reports

Frontend:

- `app/admin/reports/page.tsx`

Backend:

- `GET /api/dashboard/admin/reports`

Status: `Frontend Mock Only`

### 11. Audit Logs

Frontend:

- `app/admin/audit-logs/page.tsx`

Backend:

- `GET /api/audit-logs`

Status: `Frontend Mock Only`

## 2. Backend API Inventory

## Auth APIs

- `POST /api/auth/farmer/send-otp`
- `POST /api/auth/farmer/send-email-otp`
- `POST /api/auth/farmer/verify-otp`
- `POST /api/auth/farmer/verify-email-otp`
- `PUT /api/auth/complete-profile`
- `POST /api/auth/manager/login`
- `POST /api/auth/admin/login`
- `POST /api/auth/admin/verify-2fa`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## User APIs

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/profile`
- `PUT /api/users/preferred-mandis`
- `PUT /api/users/:id/status`
- `POST /api/users/manager`

## Mandi APIs

- `GET /api/mandis`
- `GET /api/mandis/nearby`
- `GET /api/mandis/:id`
- `POST /api/mandis`
- `PUT /api/mandis/:id`
- `PUT /api/mandis/:id/toggle`
- `GET /api/mandis/:id/stats`

## Slot APIs

- `GET /api/slots`
- `POST /api/slots`
- `PUT /api/slots/:id`
- `PUT /api/slots/:id/toggle`
- `DELETE /api/slots/:id`

## Booking APIs

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/mandi/:mandiId`
- `PUT /api/bookings/:id/cancel`
- `PUT /api/bookings/:id/checkin`
- `PUT /api/bookings/:id/complete`
- `GET /api/bookings/:id`

## Price APIs

- `GET /api/prices`
- `GET /api/prices/overview`
- `PUT /api/prices/:id`
- `POST /api/prices`

## Notification APIs

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `POST /api/notifications/broadcast`

## Issue APIs

- `GET /api/issues`
- `POST /api/issues`
- `PUT /api/issues/:id`

## Audit APIs

- `GET /api/audit-logs`

## Dashboard APIs

- `GET /api/dashboard/farmer`
- `GET /api/dashboard/manager`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/analytics`
- `GET /api/dashboard/manager/reports`
- `GET /api/dashboard/admin/reports`

## 3. Major Contract Mismatches and Risks

## Association Alias Mismatch

Backend commonly uses Sequelize aliases like:

- `mandi`
- `farmer`
- `slot`

Frontend types sometimes expect:

- `Mandi`
- `Farmer`
- `TimeSlot`

Impact:

- pages may render blank related fields
- QR/buttons/details can silently break

## Dashboard Shape Mismatch

`lib/data-api.ts` defines dashboard shapes that do not exactly match actual backend payloads.

Example:

- backend farmer dashboard returns `data.stats.activeBookings`, `data.stats.totalVisits`, `data.stats.avgPricePerQuintal`, `data.stats.qrScans`
- frontend type definitions also include fields like `preferredMandis`, `favoriteCrops` that are not returned by backend farmer dashboard

Impact:

- typed assumptions are inaccurate
- manager/admin pages rewritten later can break unless API types are corrected first

## Logout Token Version Gap

Backend increments `tokenVersion` on logout, but `protect` middleware only verifies JWT signature and user existence.

Impact:

- logout does not actually invalidate previously issued tokens server-side

## Manager Scope Enforcement Gap

Several manager endpoints rely on role checks but do not always enforce that a manager can only mutate resources belonging to `req.user.mandiId`.

Impact:

- a manager could potentially operate on unrelated mandi ids if the frontend or a client sends them

## OTP Data Model Weakness

Email OTP and admin 2FA both reuse `User.emailOtp` and `User.emailOtpExpires`.

Impact:

- resend collisions
- overwrite race conditions
- impossible to track multiple requests
- limited observability
- no unique verification session ids

## 4. Features That Exist Only in Frontend Mock UI

These pages are still primarily mock-driven:

- manager dashboard
- manager bookings
- manager slots
- manager prices
- manager notifications
- manager reports
- admin dashboard
- admin mandis
- admin users
- admin analytics
- admin prices
- admin notifications
- admin issues
- admin reports
- admin audit logs
- farmer profile

## 5. Features That Exist Only in Backend

These capabilities exist in API/domain form but have weak or absent frontend usage:

- nearby mandi geolocation API
- manager reports API
- admin reports API
- issues workflow
- user suspension workflow
- manager creation workflow
- mandi stats API
- preferred mandis update API
- price alert crops persistence support

## 6. Highest Priority Gaps

- remove remaining mock data from manager/admin portals
- rewrite farmer profile page with live APIs
- redesign email OTP architecture with unique OTP request ids
- align `lib/data-api.ts` with real backend response shapes
- enforce token invalidation and stronger manager resource scoping
- reintroduce real nearby-mandi geolocation/map flow
- expose issue reporting/resolution flows in frontend

## 7. Final Gap Assessment

The project is not empty or purely conceptual.

The backend already covers most core business domains.

The primary implementation gap is that the frontend still behaves like a demo in many protected pages, while the backend already contains enough endpoints to support a much more real product.

The second major gap is authentication robustness, especially for email OTP and admin second-factor verification.
