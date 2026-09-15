# 05 - Screen Specifications

These are responsibilities, not pixel layouts.

## P0 Customer Screens

### Home
**Goal:** Make the service and next action immediately understandable.  
**Must include:** clear value proposition; obvious Find a Car action; short `How it works` explanation; trust/policy cues without clutter.  
**Avoid:** duplicated booking/search widgets with unclear differences; nonfunctional decorative controls.

### Find a Car
**Goal:** Help a novice identify suitable available vehicles.  
**Inputs:** only verified inputs needed by canonical Finder/browse behavior.  
**Results:** vehicle identity, capacity/category, pricing information supported by backend, Finder eligibility/reasons when the Finder was used, and a clear selection action. Ordinary browse must not label every active vehicle as available for selected dates.
**Avoid:** internal allocation/forecast terminology.

### Vehicle Detail / Selection
**Goal:** Let the renter understand what they are selecting and proceed confidently.  
**Must communicate:** vehicle photos when available, meaningful specifications, branch/current relevant location information where accurate, price/rental context, availability constraints, Reserve action.

### Reserve / Trip Details
**Goal:** Collect only information needed to create the canonical booking request.  
**Rules:** preselected vehicle should not appear changeable if changing it would invalidate the preceding selection; known profile data should not be redundantly re-entered unless canonical backend requires confirmation; group pickup/return/service method logically; use explicit labels.

### Authentication Interruption
**Goal:** Explain why authentication is needed and preserve booking intent.  
**Must not:** redirect an authenticated Admin into a customer journey incorrectly; silently lose trip input.

### My Bookings
**Goal:** Show current/actionable booking first, then past bookings.  
**Each item:** understandable status, dates, vehicle, next-action cue where applicable.

### Booking Detail
**Goal:** Be the customer's source of truth for one booking.  
**Header:** vehicle/booking identity, dates, high-level status.  
**Primary block:** `What happens next` / `Action required`.  
**Progress:** Booking -> Requirements -> Payment -> Confirmation -> Rental -> Return.  
**Context sections:** requirements, payment, pickup/rental, return record.  
**Rule:** only show actions permitted by canonical state.
**State contract:** put a named action-or-waiting panel before secondary information. It must state what happened, whether the renter must act, why a locked step is unavailable, and what happens after the next action. Use a status badge as a supporting cue only.

### Requirements Submission
May be a section/step within Booking Detail rather than an isolated mental model. Explain required documents, upload status, review state, and safe resubmission reasons.

### Payment Submission
Accessible only when canonical prerequisites are met. The client-confirmed policy is a minimum 50% down payment after requirements verification. The frontend may state that policy, but it must display a peso amount only when a trustworthy canonical `required_amount` is available; it must not invent or calculate an amount from incomplete financial semantics. Explain accepted baseline channels, manual verification, and current review state. Never imply automatic gateway verification.

### Contact
Use an honest informational contact surface in the stabilized baseline. Show only verified business contact/service information and supported external actions. Do not retain or recreate a message form that simulates successful delivery. A server-backed contact form requires separate authorization and a verified delivery contract.

## P0 Admin Screens

### Dashboard
**Goal:** `What needs my attention now?`  
Prioritize a role-permitted, linked attention queue before summary metrics; then show today's pickups/returns/active rentals, fleet readiness/availability, and concise operational summaries backed by canonical data. Each metric must disclose its time basis and unknown/unavailable state where relevant. Avoid fabricated KPIs and display-only attention counts.

### Booking Queue
**Goal:** Find bookings needing review/action.  
Use understandable customer/vehicle/date/status information and a visible next operational action. Rows/cards must have an obvious way to open a deep-linkable detail. Avoid unexplained IDs as primary labels; retain IDs as copyable secondary reference. On narrow screens, use prioritised record cards or an explicitly scrollable, labelled table—not clipped columns.

### Admin Booking Detail
**Goal:** Complete the human review/lifecycle work for one booking.  
Provide coherent sections for customer/trip context, requirements review, payment review, vehicle assignment/confirmation, rental release/return, and relevant activity. Enforce role/state restrictions before rendering actions; Operations Staff must receive an explanatory read-only view where the server denies mutation authority. Settlement is not a supported workflow section without a Lead-approved contract.

### Fleet
**Goal:** Understand vehicle availability/readiness/branch/rental state.  
Status vocabulary must be interpretable and derived from canonical data.

### Maintenance
**Goal:** Understand maintenance attention and perform canonical create/complete/cancel workflows. Do not reintroduce prototype statuses or fabricated metrics.

### Decision Support
**Goal:** Explain forecast/allocation outputs, inputs, insufficiency/unknown states, and advisory nature. A panel member should understand why a recommendation exists.

## Cross-screen interaction requirements

- Forms use visible labels, grouped related fields, persistent helper text for complex inputs, correct mobile input types, meaningful autocomplete, and inline errors connected to their fields. On failed multi-field submission, present a focusable linked error summary and move focus to it or the first invalid field.
- Long or upload-heavy flows show a step/progress indicator, permit predictable back navigation, warn before discarding unsaved input, and never require re-entry of information already supplied unless canonically necessary.
- Loading reserves layout space and uses a contextual skeleton for meaningful waits; submit actions show progress only after the request begins. Empty states explain the condition and provide a valid next action. Error states name the problem and recovery action; success is confirmed in context and announced without stealing focus.
- Tables expose sort state and a readable alternative or strategy at narrow widths. Charts expose a text summary, visible legend, exact values on keyboard/tap as well as pointer interaction, and a meaningful loading/empty/error state.

### Reports
**Goal:** Present implemented operational analytics honestly. Do not reintroduce deferred financial/revenue analytics without canonical settlement semantics.

## Secondary screens
Calendar, Customers, Branches, Users/Roles, Audit Trail, Profile, and Notifications should inherit the approved design system and navigation. Customers and Profile must use only canonical server/auth-backed data. Settings is excluded from the stabilized navigation until a server-backed settings contract exists. All secondary screens remain subject to role restrictions and capability migration review.
