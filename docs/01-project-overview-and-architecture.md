# Project Overview and Architecture

## 1. Project Summary

MandiBook is a multi-actor mandi management and farmer support platform with three primary portals:

- `Farmer Portal`
- `Manager Portal`
- `Admin Portal`

The intended product goals are:

- farmer onboarding through OTP-based authentication
- mandi slot booking with QR code-based entry/check-in
- crop price discovery and publishing
- mandi discovery and nearby mandi search
- notifications and broadcast communication
- issue reporting and operational resolution
- user, mandi, and platform governance through admin tools
- analytics, reports, and auditability

## 2. Active Repository Layout

The actively edited project copy for this task is:

- `/Users/arpitsingh/Desktop/College_Work/MandiBook/MandiBook_Frontend`
- `/Users/arpitsingh/Desktop/College_Work/MandiBook/MandiBook_Backend`

This documentation pack is aligned to the `MandiBook` copy above and should be treated as the source of truth for the current MVP work.

## 3. Technology Stack

## Frontend

- `Next.js 16`
- `React 19`
- `TypeScript`
- `TailwindCSS v4`
- `motion`
- `lucide-react`
- `react-leaflet` / `leaflet`
- custom auth context with local storage persistence

## Backend

- `Node.js`
- `Express`
- `Sequelize`
- `PostgreSQL`
- `JWT`
- `Twilio Verify` for phone OTP
- `Brevo transactional email` for email OTP / admin 2FA email code
- `QRCode` package for booking QR generation
- `helmet`, `cors`, `morgan`, `express-rate-limit`

## 4. High-Level Architecture

## Frontend Architecture

The frontend is organized around:

- route-based portals in `app/`
- `lib/api.ts` for auth endpoints
- `lib/data-api.ts` for non-auth data endpoints
- `lib/auth-context.tsx` for session restore, login, logout, and user state
- actor-specific layouts with route guards

### Frontend Entry Areas

- `app/page.tsx` - landing page
- `app/farmer-login/page.tsx` - farmer phone/email OTP login
- `app/manager-login/page.tsx` - manager credential login
- `app/admin-login/page.tsx` - admin credential login + email code verification
- `app/farmer/*` - farmer portal
- `app/manager/*` - manager portal
- `app/admin/*` - admin portal

## Backend Architecture

The backend is organized around:

- `src/server.js` as the Express bootstrapper
- `src/config/db.js` for Sequelize/PostgreSQL connection
- `src/models/*` for domain entities
- `src/routes/*` for API modules
- `src/middleware/auth.js` for JWT auth and role authorization
- `src/config/twilio.js` and `src/config/brevo.js` for outbound OTP delivery

### Registered Backend Route Modules

- `/api/auth`
- `/api/users`
- `/api/bookings`
- `/api/mandis`
- `/api/slots`
- `/api/prices`
- `/api/notifications`
- `/api/issues`
- `/api/audit-logs`
- `/api/dashboard`

## 5. Core Domain Model

The main entities currently implemented in backend Sequelize models are:

- `User`
- `Mandi`
- `TimeSlot`
- `Booking`
- `CropPrice`
- `Notification`
- `Issue`
- `AuditLog`

## User

Represents all three actor types:

- farmer
- manager
- admin

It also stores:

- phone/email
- password where relevant
- profile fields
- preferred mandis
- crops
- price alert crops
- role-specific metadata
- role-scoped session and verification metadata
- login tracking
- tokenVersion for logout invalidation intent

## Mandi

Represents an APMC mandi location and includes:

- location metadata
- coordinates
- contact details
- crop coverage
- operating hours
- active/inactive state
- rating
- optional manager assignment

## TimeSlot

Represents per-mandi, per-day booking slots with:

- start/end time
- label
- capacity
- booked count
- active status

## Booking

Represents a farmer booking with:

- booking number
- farmer, mandi, and slot linkage
- crop and quantity
- vehicle number
- booking status lifecycle
- QR payload image data
- timestamps for check-in, completion, and cancellation

## CropPrice

Represents mandi-specific crop prices with:

- crop name
- unit
- mandi
- current and previous prices
- min/max price fields
- updater metadata
- trend/change helper methods

## Notification

Represents user-targeted notifications with:

- typed notification category
- title/message
- read status
- optional action URL
- localized fields

## Issue

Represents complaints/operational issues with:

- reporter
- optional mandi association
- priority
- status
- assignment
- resolution
- comment count

## AuditLog

Represents platform activity trail with:

- actor metadata
- action description
- entity and entity id
- typed category
- IP address
- created time

## 6. Important Associations

Current model associations include:

- `User hasOne Mandi` as managed mandi
- `Mandi belongsTo User` as manager
- `Mandi hasMany TimeSlot`
- `Mandi hasMany Booking`
- `Mandi hasMany CropPrice`
- `Booking belongsTo User` as farmer
- `Booking belongsTo Mandi`
- `Booking belongsTo TimeSlot`
- `Notification belongsTo User`
- `Issue belongsTo User` as reporter
- `Issue belongsTo Mandi`
- `AuditLog belongsTo User`

## 7. Authentication Architecture

## Farmer

Current farmer login methods:

- phone OTP via Twilio Verify
- email OTP via custom OTP generation and Brevo email send

Current farmer identity problem:

- phone and email login currently create or find farmer records independently
- there is no guaranteed identity-linking layer that merges a farmer who first logs in with phone and later logs in with email
- `/api/auth/me` has enough profile fields to drive the portal, but the onboarding contract still needs to force a single canonical farmer profile across both login methods

Current farmer session flow:

1. request OTP
2. verify OTP
3. create user if new
4. issue JWT
5. redirect to complete profile if profile incomplete
6. allow portal access through layout guard

## Manager

Current manager login method:

- email + password

## Admin

Current admin login method:

- email + password
- second step verification using email OTP sent through Brevo

## Session Restore

Frontend restores session by:

1. reading `mandibook_auth` from local storage
2. calling `/api/auth/me`
3. normalizing the returned user shape
4. repersisting normalized user state

Current session expectation for MVP:

- successful login should survive refresh and browser restart
- session should remain valid for up to `30 days` of inactivity
- logout should explicitly invalidate the active token on the server

## 8. Current Architectural Strengths

- backend already has a real relational domain model
- booking creation is real and generates QR images
- dashboard endpoints exist for all three actors
- role-based auth middleware is present
- audit logging exists across several core flows
- notification infrastructure exists
- issue management infrastructure exists
- frontend auth persistence and route guards are already present

## 9. Current Architectural Weaknesses

- frontend and backend response shapes are not consistently aligned
- manager and admin portals are mostly still mock-driven UI layers
- identity is split across phone-first and email-first farmer login flows, which causes profile confusion and duplicate-user risk
- first-login profile completion is not enforced as a single canonical onboarding gate across both farmer auth methods
- slot discovery depends entirely on pre-created `TimeSlot` rows, so a mandi/date with no seeded rows shows an empty booking step even when the UI suggests booking should be available
- price discovery is still too mandi-centric in presentation and does not yet expose a clean state -> district -> mandi browsing/filter flow for farmers
- manager write access is not consistently scoped to only the mandi they manage across all operational routes
- admin-to-manager-to-mandi ownership rules are not yet documented or enforced as a single source of truth
- several UI pages assume data structures different from actual backend payloads
- frontend lacks shared query/cache layer and standardized error/loading patterns across all portals
- there is no dedicated service layer in backend; route handlers are carrying business logic directly

## 10. Architecture Recommendation

The project should evolve toward:

- stable frontend API contract layer
- backend service-oriented auth/booking/notification modules
- dedicated OTP request model
- a canonical identity model where a farmer can authenticate with either phone or email but still resolves to one farmer record
- mandatory first-login profile completion before full farmer portal access
- manager actions scoped to one assigned mandi unless promoted by admin privileges
- farmer price discovery that combines official market feed data with mandi-managed local overrides
- stricter authorization rules around mandi-scoped manager actions
- consistent actor dashboard contracts
- elimination of all mock data from protected portals

This recommendation is expanded in the roadmap and OTP redesign files.
