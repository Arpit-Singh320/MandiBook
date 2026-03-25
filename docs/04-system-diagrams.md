# System Diagrams

This file contains logical diagrams for the current and target MandiBook system.

## 1. High-Level Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +string name
        +enum role
        +string phone
        +string email
        +string password
        +string avatar
        +enum language
        +enum status
        +boolean profileComplete
        +string village
        +string district
        +string state
        +string pincode
        +float landHolding
        +string farmSize
        +string[] preferredMandis
        +string[] crops
        +string[] priceAlertCrops
        +UUID mandiId
        +string designation
        +date managingSince
        +string department
        +boolean twoFactorEnabled
        +string emailOtp
        +date emailOtpExpires
        +string phoneOtp
        +date phoneOtpExpires
        +int tokenVersion
        +matchPassword()
    }

    class Mandi {
        +UUID id
        +string name
        +string nameHi
        +string code
        +string address
        +string city
        +string district
        +string state
        +string pincode
        +float lat
        +float lng
        +string contactPhone
        +string[] crops
        +string operatingHoursOpen
        +string operatingHoursClose
        +string[] holidays
        +boolean isActive
        +float rating
        +UUID managerId
    }

    class TimeSlot {
        +UUID id
        +UUID mandiId
        +date date
        +string startTime
        +string endTime
        +string label
        +int capacity
        +int bookedCount
        +boolean isActive
    }

    class Booking {
        +UUID id
        +string bookingNumber
        +UUID farmerId
        +UUID mandiId
        +UUID slotId
        +date date
        +string timeSlot
        +string cropType
        +float estimatedQuantity
        +string vehicleNumber
        +enum status
        +text qrCodeData
        +date checkedInAt
        +date completedAt
        +date cancelledAt
        +string cancelReason
    }

    class CropPrice {
        +UUID id
        +string crop
        +string cropHi
        +string category
        +enum unit
        +UUID mandiId
        +float currentPrice
        +float prevPrice
        +float minPrice
        +float maxPrice
        +UUID updatedBy
        +getChangePercent()
        +getTrend()
    }

    class Notification {
        +UUID id
        +UUID userId
        +enum type
        +string title
        +string titleHi
        +text message
        +text messageHi
        +boolean isRead
        +string actionUrl
    }

    class Issue {
        +UUID id
        +UUID reporterId
        +string reporterName
        +UUID mandiId
        +string mandiName
        +string title
        +text description
        +enum status
        +enum priority
        +UUID assignedTo
        +text resolution
        +int comments
    }

    class AuditLog {
        +UUID id
        +UUID userId
        +string userName
        +enum userRole
        +string action
        +string entity
        +string entityId
        +text details
        +enum type
        +string ipAddress
    }

    class OtpRequest {
        +UUID id
        +string requestId
        +enum purpose
        +enum channel
        +string identifier
        +UUID userId
        +string otpHash
        +date expiresAt
        +int attempts
        +int maxAttempts
        +date lastSentAt
        +boolean consumed
        +date consumedAt
        +string status
        +string deliveryProvider
        +string deliveryReference
    }

    User "1" --> "0..1" Mandi : manages
    Mandi "1" --> "0..*" TimeSlot : has
    User "1" --> "0..*" Booking : creates
    Mandi "1" --> "0..*" Booking : receives
    TimeSlot "1" --> "0..*" Booking : allocated_to
    Mandi "1" --> "0..*" CropPrice : publishes
    User "1" --> "0..*" Notification : receives
    User "1" --> "0..*" Issue : reports
    Mandi "1" --> "0..*" Issue : related_to
    User "1" --> "0..*" AuditLog : produces
    User "1" --> "0..*" OtpRequest : owns
```

## 2. Use Case Diagram

```mermaid
flowchart LR
    Farmer[Farmer]
    Manager[Manager]
    Admin[Admin]

    UC1((Login with Phone OTP))
    UC2((Login with Email OTP))
    UC3((Complete Profile))
    UC4((Browse Mandis))
    UC5((Find Nearby Mandis))
    UC6((Book Slot))
    UC7((View QR Booking))
    UC8((Cancel Booking))
    UC9((View Prices))
    UC10((Manage Preferences))
    UC11((View Notifications))
    UC12((Report Issue))

    UC13((Manager Login))
    UC14((View Dashboard))
    UC15((Manage Bookings))
    UC16((Check In Farmer))
    UC17((Complete Booking))
    UC18((Manage Slots))
    UC19((Update Prices))
    UC20((Send Broadcast))
    UC21((View Reports))
    UC22((Resolve Issues))

    UC23((Admin Login + 2FA))
    UC24((View Platform Dashboard))
    UC25((Manage Mandis))
    UC26((Manage Users))
    UC27((View Analytics))
    UC28((Compare Prices))
    UC29((Broadcast Notifications))
    UC30((Oversee Issues))
    UC31((Download Reports))
    UC32((View Audit Logs))

    Farmer --> UC1
    Farmer --> UC2
    Farmer --> UC3
    Farmer --> UC4
    Farmer --> UC5
    Farmer --> UC6
    Farmer --> UC7
    Farmer --> UC8
    Farmer --> UC9
    Farmer --> UC10
    Farmer --> UC11
    Farmer --> UC12

    Manager --> UC13
    Manager --> UC14
    Manager --> UC15
    Manager --> UC16
    Manager --> UC17
    Manager --> UC18
    Manager --> UC19
    Manager --> UC20
    Manager --> UC21
    Manager --> UC22

    Admin --> UC23
    Admin --> UC24
    Admin --> UC25
    Admin --> UC26
    Admin --> UC27
    Admin --> UC28
    Admin --> UC29
    Admin --> UC30
    Admin --> UC31
    Admin --> UC32
```

## 3. Sequence Diagram - Farmer Email OTP Login (Target Design)

```mermaid
sequenceDiagram
    actor Farmer
    participant FE as Frontend
    participant Auth as Auth API
    participant OTP as OtpRequest Store
    participant Mail as Email Service

    Farmer->>FE: Enter email and request OTP
    FE->>Auth: POST /auth/farmer/send-email-otp {email}
    Auth->>OTP: create OTP request with requestId, otpHash, expiry
    Auth->>Mail: send code to email
    Mail-->>Auth: delivery reference
    Auth-->>FE: {otpRequestId, expiresAt, resendAfter}

    Farmer->>FE: Enter otp code
    FE->>Auth: POST /auth/farmer/verify-email-otp {otpRequestId, email, otp}
    Auth->>OTP: load request by requestId
    Auth->>OTP: validate identifier, expiry, attempts, consumed=false, otpHash match
    Auth->>Auth: find or create farmer user
    Auth->>OTP: mark consumed
    Auth-->>FE: {token, user, profileComplete}
    FE-->>Farmer: Redirect to dashboard or complete-profile
```

## 4. Sequence Diagram - Farmer Slot Booking

```mermaid
sequenceDiagram
    actor Farmer
    participant FE as Farmer UI
    participant BookingAPI as Booking Route
    participant Slot as TimeSlot
    participant Mandi as Mandi
    participant QR as QR Generator
    participant Notify as Notification
    participant Audit as AuditLog

    Farmer->>FE: Select mandi, date, slot, crop, quantity
    FE->>BookingAPI: POST /bookings
    BookingAPI->>Slot: validate slot exists, active, not full
    BookingAPI->>Mandi: validate mandi exists
    BookingAPI->>QR: generate QR data URL
    BookingAPI->>BookingAPI: create booking record
    BookingAPI->>Slot: increment bookedCount
    BookingAPI->>Notify: create booking-confirmed notification
    BookingAPI->>Audit: create booking audit log
    BookingAPI-->>FE: booking + qrCodeData
    FE-->>Farmer: Show confirmation and QR
```

## 5. Sequence Diagram - Manager Check-In

```mermaid
sequenceDiagram
    actor Manager
    participant FE as Manager UI
    participant API as Booking Route
    participant Booking as Booking
    participant Audit as AuditLog

    Manager->>FE: Open booking list and choose booking
    FE->>API: PUT /bookings/:id/checkin
    API->>Booking: fetch booking
    API->>Booking: validate status == confirmed
    API->>Booking: update status = checked-in
    API->>Audit: create check-in log
    API-->>FE: updated booking
    FE-->>Manager: Refresh booking row/status
```

## 6. Sequence Diagram - Admin Create Manager

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Admin UI
    participant API as Users Route
    participant User as User Model
    participant Audit as AuditLog

    Admin->>FE: Fill manager creation form
    FE->>API: POST /users/manager
    API->>User: validate uniqueness by email + role
    API->>User: create manager with hashed password
    API->>Audit: log manager creation
    API-->>FE: created manager summary
    FE-->>Admin: show success and refresh table
```

## 7. Activity Diagram - Farmer Login and Onboarding

```mermaid
flowchart TD
    A[Start login] --> B{Choose method}
    B -->|Phone| C[Request phone OTP]
    B -->|Email| D[Request email OTP]
    C --> E[Enter OTP]
    D --> E
    E --> F{OTP valid?}
    F -->|No| G[Show error and allow retry/resend]
    G --> E
    F -->|Yes| H[Create or load farmer user]
    H --> I{Profile complete?}
    I -->|No| J[Redirect to complete-profile]
    I -->|Yes| K[Redirect to farmer dashboard]
```

## 8. Activity Diagram - Booking Lifecycle

```mermaid
flowchart TD
    A[Farmer selects mandi and slot] --> B[Submit booking]
    B --> C{Slot active and available?}
    C -->|No| D[Reject booking]
    C -->|Yes| E[Generate booking number]
    E --> F[Generate QR payload]
    F --> G[Create booking record]
    G --> H[Increase slot booked count]
    H --> I[Create notification + audit log]
    I --> J[Booking confirmed]
    J --> K{Manager checks in?}
    K -->|No| L[Stay confirmed or cancel]
    K -->|Yes| M[Status checked-in]
    M --> N{Visit completed?}
    N -->|Yes| O[Status completed]
    N -->|No| P[Remain checked-in]
```

## 9. Activity Diagram - Issue Resolution Flow

```mermaid
flowchart TD
    A[Farmer or Manager reports issue] --> B[Issue created with open status]
    B --> C[Manager/Admin reviews issue]
    C --> D{Needs assignment?}
    D -->|Yes| E[Assign owner]
    D -->|No| F[Work directly]
    E --> G[Investigate problem]
    F --> G
    G --> H{Resolved?}
    H -->|No| I[Keep in-progress]
    I --> G
    H -->|Yes| J[Add resolution notes]
    J --> K[Mark resolved or closed]
```

## 10. State Diagram - Booking

```mermaid
stateDiagram-v2
    [*] --> confirmed
    confirmed --> cancelled : farmer cancels
    confirmed --> checked_in : manager check-in
    pending --> confirmed : approval/confirmation
    pending --> cancelled : cancel
    checked_in --> completed : manager completes
    checked_in --> cancelled : exceptional cancellation
    completed --> [*]
    cancelled --> [*]
```

## 11. State Diagram - Issue

```mermaid
stateDiagram-v2
    [*] --> open
    open --> in_progress : assigned / under review
    in_progress --> resolved : fix applied
    resolved --> closed : verification complete
    resolved --> in_progress : reopened
    open --> closed : invalid / duplicate
    closed --> [*]
```

## 12. State Diagram - OTP Request (Target)

```mermaid
stateDiagram-v2
    [*] --> created
    created --> sent : delivery attempted
    sent --> verified : correct code + valid request
    sent --> expired : expiresAt passed
    sent --> blocked : max attempts exceeded
    sent --> resent : resend triggered
    resent --> sent : new code active
    verified --> consumed
    expired --> [*]
    blocked --> [*]
    consumed --> [*]
```

## 13. Class Diagram Notes

### Current vs Target

The class diagram includes `OtpRequest` even though it is not yet implemented in the current backend, because:

- it is required to solve the email OTP reliability issue
- it cleanly separates verification sessions from user records
- it supports both farmer email login and admin second-factor verification

### Why `OtpRequest` matters

Without `OtpRequest`, the current design causes:

- overwritten OTP state on repeated sends
- no request/session binding
- weak auditability
- hard-to-debug invalid OTP incidents
- shared risk between farmer email login and admin 2FA

## 14. Diagram Usage Recommendation

Use these diagrams as the baseline for:

- software engineering documentation
- implementation planning
- Viva / presentation material
- PRD to engineering translation
- backend refactoring guidance

These diagrams represent the intended product architecture more accurately than the current mock-heavy frontend state.
