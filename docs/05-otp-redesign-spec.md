# OTP Redesign Specification

## 1. Problem Statement

The current email OTP system is unreliable and hard to reason about.

Today, email OTP state is stored directly on the `User` table using:

- `emailOtp`
- `emailOtpExpires`

This is used for:

- farmer email login
- admin second-factor verification

That design causes multiple problems.

## 2. Current Problems in Existing Design

## A. OTP tied directly to `User`

A user can only have one effective OTP state at a time.

If a second OTP is requested:

- the previous code is overwritten
- old frontend state becomes invalid without any request-level trace
- debugging becomes difficult

## B. No Unique Verification Session ID

The frontend currently verifies with:

- email + otp
n- or tempUserId + code for admin

There is no dedicated `otpRequestId` that represents the exact verification attempt.

Impact:

- no way to distinguish old OTP vs latest OTP
- no clean resend flow
- no strong session linkage
- invalid OTP errors can appear even when the user uses a recently received code but for a replaced request state

## C. No Attempt Tracking

There is no strong tracking for:

- total verification attempts
- blocked requests
- brute-force prevention per request

## D. Shared State for Different Purposes

Farmer email login and admin second-factor verification both reuse the same email OTP fields on `User`.

Impact:

- login and 2FA flows can interfere conceptually
- auditing is weak
- future OTP expansion becomes messy

## E. Poor Operational Visibility

The current design does not preserve a proper record of:

- when OTP was generated
- which request it belongs to
- resend count
- delivery provider response id
- whether OTP was consumed or expired

## 3. Design Goal

Replace the direct-on-user OTP model with a dedicated OTP request lifecycle using a unique request id.

Every OTP send should create or rotate a concrete verification session, and every verify call must include that session id.

## 4. Target OTP Architecture

## Core Idea

Introduce a new backend entity:

- `OtpRequest`

Each OTP request represents one verification session.

Fields should include:

- `id`
- `requestId`
- `purpose`
- `channel`
- `identifier`
- `userId` optional
- `otpHash`
- `expiresAt`
- `attempts`
- `maxAttempts`
- `resendCount`
- `lastSentAt`
- `consumed`
- `consumedAt`
- `status`
- `deliveryProvider`
- `deliveryReference`
- `metadata`

## Recommended Enum Values

### purpose

- `farmer_email_login`
- `admin_email_2fa`
- `farmer_phone_login_fallback` optional if ever needed
- `password_reset` future

### channel

- `email`
- `sms`

### status

- `created`
- `sent`
- `verified`
- `expired`
- `blocked`
- `cancelled`

## 5. Proposed Data Model

```txt
OtpRequest
---------
id: UUID (PK)
requestId: STRING UNIQUE
purpose: ENUM
channel: ENUM
identifier: STRING
userId: UUID NULL
otpHash: STRING
expiresAt: DATETIME
attempts: INT default 0
maxAttempts: INT default 5
resendCount: INT default 0
lastSentAt: DATETIME
consumed: BOOLEAN default false
consumedAt: DATETIME NULL
status: ENUM
deliveryProvider: STRING NULL
deliveryReference: STRING NULL
metadata: JSONB NULL
createdAt: DATETIME
updatedAt: DATETIME
```

## 6. OTP Generation Rules

### Send Flow Rules

When a user requests OTP:

1. validate identifier
2. decide purpose
3. find user if one already exists for identifier and role
4. create new `OtpRequest`
5. generate 6-digit OTP
6. hash OTP before storing
7. send OTP via provider
8. store provider response metadata
9. return `otpRequestId`, expiry, and resend cooldown metadata to frontend

### Security Rules

- never store plain OTP in database
- always store hashed OTP
- never return OTP in API response outside local debug-only development mode if explicitly allowed
- set short expiry, e.g. 5 to 10 minutes
- cap attempts, e.g. 5
- cap resend frequency, e.g. not more than once per 30 to 60 seconds

## 7. Proposed Backend API Contract

## Farmer Email OTP

### Send

`POST /api/auth/farmer/send-email-otp`

Request:

```json
{
  "email": "farmer@example.com"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP sent to email",
  "method": "email",
  "otpRequestId": "otp_req_123456",
  "expiresInSeconds": 600,
  "resendAfterSeconds": 30
}
```

### Verify

`POST /api/auth/farmer/verify-email-otp`

Request:

```json
{
  "otpRequestId": "otp_req_123456",
  "email": "farmer@example.com",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt",
  "isNew": false,
  "profileComplete": true,
  "user": {}
}
```

## Admin 2FA Email Code

### Begin login

`POST /api/auth/admin/login`

Request:

```json
{
  "email": "admin@mandibook.in",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "message": "2FA code sent to email",
  "requires2FA": true,
  "otpRequestId": "otp_req_admin_001",
  "tempUserId": "uuid",
  "expiresInSeconds": 600,
  "resendAfterSeconds": 30
}
```

### Verify 2FA

`POST /api/auth/admin/verify-2fa`

Request:

```json
{
  "tempUserId": "uuid",
  "otpRequestId": "otp_req_admin_001",
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt",
  "user": {}
}
```

## 8. Backend Verification Rules

When verifying OTP:

1. load `OtpRequest` by `otpRequestId`
2. reject if not found
3. reject if identifier mismatch
4. reject if purpose mismatch
5. reject if already consumed
6. reject if expired
7. reject if blocked due to attempts
8. compare incoming OTP with hashed OTP
9. increment attempts on failure
10. mark blocked if max attempts exceeded
11. mark consumed and verified on success
12. continue login/register flow

## 9. Pseudocode - Send Email OTP

```js
async function sendFarmerEmailOtp(email) {
  validateEmail(email);

  let user = await User.findOne({ where: { email, role: 'farmer' } });

  const otp = generateOTP(6);
  const otpHash = await hashOtp(otp);
  const requestId = createOtpRequestId();

  const otpRequest = await OtpRequest.create({
    requestId,
    purpose: 'farmer_email_login',
    channel: 'email',
    identifier: email,
    userId: user?.id || null,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    maxAttempts: 5,
    resendCount: 0,
    lastSentAt: new Date(),
    consumed: false,
    status: 'created',
    deliveryProvider: 'brevo',
  });

  const delivery = await sendEmailOTP(email, user?.name || 'Farmer', otp);

  await otpRequest.update({
    status: delivery.success ? 'sent' : 'cancelled',
    deliveryReference: delivery.messageId || null,
  });

  if (!delivery.success) {
    throw new Error('Failed to send email OTP');
  }

  return {
    otpRequestId: otpRequest.requestId,
    expiresInSeconds: 600,
    resendAfterSeconds: 30,
  };
}
```

## 10. Pseudocode - Verify Email OTP

```js
async function verifyFarmerEmailOtp({ otpRequestId, email, otp }) {
  const req = await OtpRequest.findOne({ where: { requestId: otpRequestId } });
  if (!req) throw invalidRequest();
  if (req.purpose !== 'farmer_email_login') throw invalidRequest();
  if (req.identifier !== email) throw invalidRequest();
  if (req.consumed) throw alreadyUsed();
  if (req.expiresAt < new Date()) throw expired();
  if (req.attempts >= req.maxAttempts) throw blocked();

  const ok = await compareOtpHash(otp, req.otpHash);
  if (!ok) {
    await req.increment('attempts');
    throw invalidOtp();
  }

  let user = await User.findOne({ where: { email, role: 'farmer' } });
  let isNew = false;
  if (!user) {
    user = await User.create({ name: '', email, role: 'farmer', language: 'en', profileComplete: false });
    isNew = true;
  }

  await req.update({ consumed: true, consumedAt: new Date(), status: 'verified' });

  return buildLoginResponse(user, isNew);
}
```

## 11. Frontend Changes Required

## Farmer Login Page Changes

Current page stores only:

- email
- OTP digits

It must additionally store:

- `otpRequestId`
- expiry countdown
- resend cooldown

### New send flow

After send email OTP succeeds:

- store `otpRequestId` in state
- move to OTP step
- show countdown

### New verify flow

When verifying:

- send `otpRequestId`, `email`, `otp`

## Admin Login Page Changes

After credential step succeeds:

- store `otpRequestId`
- store `tempUserId`
- move to second-factor step

Verify call must send both:

- `tempUserId`
- `otpRequestId`
- `code`

## 12. Additional Endpoints Recommended

### Resend endpoint

`POST /api/auth/otp/resend`

Request:

```json
{
  "otpRequestId": "otp_req_123456"
}
```

Behavior:

- validate resend cooldown
- invalidate or supersede previous active request according to policy
- send a fresh code
- return new `otpRequestId` if rotating request ids

### Request status endpoint optional

`GET /api/auth/otp/:otpRequestId/status`

Useful for:

- frontend countdown synchronization
- debugging
- observability

## 13. Recommended Policies

## Expiry

- farmer email OTP: `10 minutes`
- admin 2FA email code: `5 to 10 minutes`

## Attempts

- max attempts per request: `5`

## Resend cooldown

- minimum `30 seconds`

## Active request policy

Recommended:

- create new request on resend
- mark previous pending request as superseded or cancelled
- only latest active request should verify successfully

## 14. Database Migration Plan

### Step 1

Create new `OtpRequest` model and table.

### Step 2

Update auth routes to use new model for:

- farmer email OTP
- admin email 2FA

### Step 3

Keep old user OTP fields temporarily for backward compatibility.

### Step 4

Migrate frontend to request-id-based verification.

### Step 5

Once stable, remove or stop using:

- `User.emailOtp`
- `User.emailOtpExpires`
- `User.phoneOtp`
- `User.phoneOtpExpires` where not needed

## 15. Optional Future Extension

The same `OtpRequest` model can later support:

- password reset OTP
- phone OTP fallback if Twilio is unavailable
- manager invite codes
- email verification after profile completion

## 16. Why This Solves Your Current Issue

Your current invalid email OTP problem is likely caused by one or more of these scenarios:

- the OTP on `User` was overwritten by a later send
- the wrong request context is being verified
- the user is verifying after expiry but without clear request tracking
- admin and farmer OTP logic are sharing fragile user-level state

A unique `otpRequestId` solves this because:

- each OTP is tied to one explicit verification session
- resend behavior becomes deterministic
- verification becomes traceable and auditable
- provider delivery references can be logged
- frontend can always verify against the correct request

## 17. Immediate Recommended Implementation Order

1. add `OtpRequest` model
2. implement farmer email OTP using request ids
3. implement admin email 2FA using request ids
4. update frontend login pages to store and send request ids
5. add resend cooldown and attempt limit
6. add audit logs for OTP send/verify events
7. remove dependence on `User.emailOtp` for live flows

## 18. Final Recommendation

Do not continue extending the current direct-on-user email OTP design.

The correct next step is to implement a dedicated OTP request lifecycle with a unique request id and request-scoped verification.

That will make the email OTP flow reliable enough for both:

- farmer email login
- admin second-factor verification
