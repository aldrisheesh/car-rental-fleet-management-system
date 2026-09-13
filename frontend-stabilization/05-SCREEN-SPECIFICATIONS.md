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
**Results:** vehicle identity, capacity/category, pricing information supported by backend, availability/relevant fit information, clear selection action.  
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
**Context sections:** requirements, payment, pickup/rental, return/completion.  
**Rule:** only show actions permitted by canonical state.

### Requirements Submission
May be a section/step within Booking Detail rather than an isolated mental model. Explain required documents, upload status, review state, and safe resubmission reasons.

### Payment Submission
Accessible only when canonical prerequisites are met. Explain minimum required payment where canonical amount is available, accepted baseline channels, manual verification, and current review state. Never imply automatic gateway verification.

### Contact
Simple, reliable contact path. Do not show controls that appear interactive but do nothing. If email delivery depends on configured backend/provider behavior, failure states must be honest.

## P0 Admin Screens

### Dashboard
**Goal:** `What needs my attention now?`  
Prioritize actionable counts/queues, today's pickups/returns/active rentals, fleet readiness/availability, and concise operational summaries backed by canonical data. Avoid fabricated KPIs.

### Booking Queue
**Goal:** Find bookings needing review/action.  
Use understandable customer/vehicle/date/status information. Rows/cards must have an obvious way to open details. Avoid unexplained IDs as primary labels.

### Admin Booking Detail
**Goal:** Complete the human review/lifecycle work for one booking.  
Provide coherent sections for customer/trip context, requirements review, payment review, vehicle assignment/confirmation, rental release/return/settlement, and relevant activity. Enforce role/state restrictions.

### Fleet
**Goal:** Understand vehicle availability/readiness/branch/rental state.  
Status vocabulary must be interpretable and derived from canonical data.

### Maintenance
**Goal:** Understand maintenance attention and perform canonical create/complete/cancel workflows. Do not reintroduce prototype statuses or fabricated metrics.

### Decision Support
**Goal:** Explain forecast/allocation outputs, inputs, insufficiency/unknown states, and advisory nature. A panel member should understand why a recommendation exists.

### Reports
**Goal:** Present implemented operational analytics honestly. Do not reintroduce deferred financial/revenue analytics without canonical settlement semantics.

## Secondary screens
Calendar, Customers, Branches, Users/Roles, Settings, Profile, Notifications, and Activity should inherit the approved design system and navigation. They remain subject to role restrictions and capability migration review.
