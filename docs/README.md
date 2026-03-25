# MandiBook Project Documentation Pack

This folder contains the implementation baseline for the current MandiBook project across both:

- `MandiBook_Frontend`
- `MandiBook_Backend`

## Documents

- `01-project-overview-and-architecture.md`
  - project summary
  - tech stack
  - repository structure
  - backend and frontend architecture overview

- `02-feature-inventory-and-gap-analysis.md`
  - full feature list from frontend and backend
  - actor-wise functionality matrix
  - what is working
  - what is partially working
  - what is UI-only/mock
  - what is missing

- `03-execution-roadmap.md`
  - phased execution plan
  - module-by-module completion strategy
  - priorities and dependencies
  - acceptance criteria

- `04-system-diagrams.md`
  - class diagram
  - use case diagram
  - sequence diagrams
  - activity diagrams
  - state diagrams

- `05-otp-redesign-spec.md`
  - current OTP problems
  - proposed OTP architecture using unique OTP request IDs
  - backend model and API design
  - frontend flow changes
  - security rules and rollout plan

- `06-mvp-auth-role-and-operations-spec.md`
  - unified phone/email farmer identity rules
  - mandatory first-login profile completion
  - 30-day session expectation
  - admin -> manager -> mandi ownership model
  - slot, booking, pricing, and QR verification rules for the MVP

## Current Status Summary

At the time of this audit:

- farmer authentication is partially integrated with the backend
- phone OTP uses Twilio Verify
- email OTP now uses request-scoped verification, but identity unification and onboarding rules still need tightening
- manager and admin credential flows are connected to backend auth
- several farmer pages were already being migrated from mock data to real APIs
- most manager and admin portal pages are still mock-data UI pages
- backend already exposes a meaningful API surface for bookings, mandis, slots, prices, notifications, issues, users, audit logs, and dashboards
- frontend and backend contracts are not fully aligned in several places
- the core MVP now needs one canonical source of truth for actor roles, sessions, slot availability, and pricing ownership

## Recommended Reading Order

1. `01-project-overview-and-architecture.md`
2. `02-feature-inventory-and-gap-analysis.md`
3. `03-execution-roadmap.md`
4. `06-mvp-auth-role-and-operations-spec.md`
5. `05-otp-redesign-spec.md`
6. `04-system-diagrams.md`

## Main Conclusion

The project is not blocked by lack of backend breadth.

The main blockers are:

- incomplete frontend integration
- contract mismatches between frontend and backend payload shapes
- OTP architecture weaknesses for email/admin 2FA
- missing operational features around validation, resend throttling, and verification request tracking
