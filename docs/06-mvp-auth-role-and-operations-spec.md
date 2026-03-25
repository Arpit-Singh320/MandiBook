# MVP Auth, Role, and Operations Specification

## 1. Purpose

This document defines the minimum working product behavior for the current MandiBook build.

It exists to remove ambiguity in five areas:

- unified farmer identity across phone and email login
- mandatory first-login profile completion
- durable session behavior
- clear role ownership between admin, manager, and farmer
- mandi-specific pricing, slot, booking, and QR operations

## 2. Product Roles and Ownership

## Admin

The admin is the platform owner and supervisor.

Admin responsibilities:

- create and manage mandi records
- create manager accounts
- assign exactly one primary manager to a mandi for MVP
- reassign managers when needed
- activate or suspend managers and mandis
- oversee platform activity, audit logs, prices, bookings, and issues
- manage verification policy and platform settings

Admin does not perform day-to-day mandi operations.

## Manager

The manager is the operational owner of one mandi.

Manager responsibilities:

- manage time slots for the mandi they are assigned to
- manage mandi crop prices for their mandi only
- view and oversee farmer bookings for their mandi only
- scan QR codes at gate/check-in time
- verify and update booking status
- handle farmer issues related to their mandi

Manager must not be able to change another mandi's slots, prices, or bookings.

## Farmer

The farmer is the end user of the platform.

Farmer responsibilities and capabilities:

- register or log in using phone OTP or email OTP
- complete profile on first successful sign-in
- browse prices by state, district, mandi, and crop
- discover nearby mandis
- select mandi, date, and time slot
- create booking with crop and logistics details
- receive QR code for entry/check-in
- view booking history, notifications, and profile data

## 3. Canonical Identity Rules

MandiBook supports two farmer auth methods:

- SMS OTP
- Email OTP

These are two login channels for one farmer identity, not two separate farmer types.

Required MVP rule:

- one farmer must map to one canonical `User` row

Required identity fields:

- `id`
- `role`
- `phone` nullable but unique when present
- `email` nullable but unique when present
- `profileComplete`
- shared profile fields

Required MVP identity behavior:

1. if a farmer logs in with phone and we already know that phone, return that farmer
2. if a farmer logs in with email and we already know that email, return that farmer
3. if a farmer later adds the missing phone or email during profile completion, that value must become linked to the same farmer row
4. if a login attempt arrives with a phone/email that belongs to an existing farmer via another linked credential, the backend must resolve to the same farmer row instead of creating a duplicate user
5. duplicate farmer records for the same real person must be treated as a bug

Recommended backend shape for MVP:

- keep `User` as the canonical actor table
- treat phone/email as linked identifiers on the same farmer record
- use `OtpRequest` for verification events, not as identity storage

## 4. Farmer Onboarding and First-Login Flow

## Entry

A farmer may start with either:

- phone OTP request
- email OTP request

## Verification result

On successful OTP verification the backend must always return:

- authenticated session token
- normalized farmer payload
- `profileComplete`
- enough identity fields for frontend routing

## Mandatory onboarding rule

If `profileComplete === false`:

- the farmer must be routed to complete profile before full portal usage
- only minimal pages should remain accessible until completion
- `/api/auth/me` must expose enough data to let frontend decide whether to route to onboarding or dashboard

## Required farmer profile fields for MVP

The first-time farmer profile should collect:

- full name
- phone if missing
- email if missing
- village
- district
- state
- pincode
- land holding
- farm size
- primary crops
- preferred mandis
- language

Optional for MVP but supported later:

- avatar
- price alert preferences
- alternate contact method
- government identity references

## Completion behavior

On profile submission:

- backend validates mandatory fields
- backend stores missing phone/email onto the same farmer identity
- backend marks `profileComplete = true`
- subsequent `/me` calls return the completed record
- future login through either verified channel returns the same completed farmer profile

## 5. Session and Verification Policy

## Session duration

The expected MVP session behavior is:

- once authenticated, the user should remain signed in across refresh/reopen
- session expires after `30 days` of inactivity
- manual logout invalidates the current session immediately

## Verification policy

- first successful use of a phone or email login method requires OTP verification
- admin accounts require credential login plus second-step OTP verification
- manager accounts should also be verification-capable, but password login is acceptable for MVP if admin created them

## Recommended token policy

- JWT or session token should encode an inactivity timeout equivalent to 30 days
- `tokenVersion` remains the server-side invalidation switch for logout or forced sign-out
- frontend should restore via `/api/auth/me` and only clear session when `/me` rejects the token

## 6. Mandi, Manager, and Admin Relationship Model

## Mandi lifecycle

For MVP, only admin can:

- create mandi
- update mandi core metadata
- activate/deactivate mandi
- assign/reassign a manager

Required mandi data:

- name
- code
- address
- city
- district
- state
- pincode
- latitude
- longitude
- operating hours
- supported crops
- active status
- manager assignment

## Manager account lifecycle

For MVP, only admin can:

- create manager account
- assign manager to mandi
- reset manager password
- suspend or reactivate manager

A manager account should contain:

- name
- email
- phone optional
- password hash
- assigned `mandiId`
- designation
- status
- profileComplete

## 7. Slots and Booking Operations

## Slot truth

The booking UI depends on actual `TimeSlot` rows for a specific `mandiId + date`.

Current problem visible in the screenshot:

- the booking step reaches date selection successfully
- the selected date has no matching rows in `TimeSlot`
- result: UI shows `No slots available for this date`

Therefore the real MVP rule is:

- a date is bookable only if real slot rows exist for that mandi and date

## Required manager slot behavior

Managers must be able to:

- create slots for their mandi
- edit slot times, labels, capacity, active state
- deactivate or delete empty slots
- view slot utilization

## Required farmer booking flow

1. choose mandi
2. choose a date that has available slots
3. choose an active slot with remaining capacity
4. enter crop details and logistics information
5. create booking
6. receive QR code
7. manager scans QR to verify arrival/check-in

## Booking payload for MVP

- farmer id from auth session
- mandi id
- slot id
- date
- crop type
- estimated quantity
- vehicle number optional
- QR code payload
- booking status lifecycle

## Booking lifecycle for MVP

- `pending` or `confirmed`
- `checked-in`
- `completed`
- `cancelled`

## 8. Pricing Model for MVP

The farmer price experience should not depend on a single generic list.

It must support two layers of truth:

## Layer A: official market feed

Source:

- `data.gov.in` mandi daily prices

Required browsing/filter dimensions:

- state
- district
- market/mandi
- commodity
- date

This is the broad discovery layer for farmers.

## Layer B: local mandi-managed prices

Source:

- MandiBook manager-created or manager-updated `CropPrice` rows scoped to their assigned mandi

This is the operational mandi layer used for booking and local decision-making.

## MVP pricing rules

- admin can create baseline mandi price entries if needed
- manager can add, update, or delete prices for only their mandi
- farmer price page should support state-level browsing and mandi-level filtering
- when both official feed data and mandi-local data exist, UI should clearly label the source
- local mandi-managed price is the editable operational value inside the platform
- official feed is reference/discovery data and should not silently overwrite local mandi-managed prices

## 9. QR Verification Flow

## Farmer side

After booking creation the farmer receives:

- booking number
- booking details
- QR code

## Manager side

The manager should be able to:

- scan QR
- resolve booking
- verify mandi ownership of the booking
- mark status as `checked-in` or reject invalid QR

## Required safety checks

- QR must map to a valid booking
- booking must belong to the manager's mandi
- booking must not already be completed or cancelled

## 10. MVP Seed and Demo Data Requirements

The development seed should include:

- at least two admin accounts
- one or more managers assigned to mandis
- several farmers with complete profiles
- mandi records with coordinates and crops
- real upcoming time slots for multiple future dates
- sample crop prices per mandi
- sample bookings with QR payloads

Requested admin accounts for the development seed:

- `arpit2005singh@gmail.com`
- `mandibook.admin@gmail.com`

These should be seeded as admin users in development only, with password hashes stored securely.

## 11. Immediate MVP Blockers Identified from Current Build

- auth feels unreliable because identity can diverge between phone and email entry paths
- session retention does not yet match the expected 30-day inactivity model
- first-login profile completion is not the single enforced onboarding gate for every farmer login path
- booking appears broken when selected dates do not have actual slot rows
- pricing UI is too flat and does not yet expose proper state -> district -> mandi navigation
- manager pricing ownership and mandi scoping need stricter enforcement
- admin creation of mandis and managers needs a documented and implemented workflow

## 12. Implementation Priority

1. make docs and contracts the source of truth
2. unify farmer identity across phone and email
3. enforce first-login profile completion
4. stabilize 30-day session restore behavior
5. make slot creation and slot availability operational
6. implement manager-scoped price CRUD and farmer price filters
7. implement admin mandi and manager management
8. validate QR verification end to end
