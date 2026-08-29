# Roles and Permissions

**Status:** Baseline Frozen; field-level reservation permissions still open  
**Last updated:** 2026-08-24

## Basis

This specification follows the defended Chapter 3 use-case model. The three application actors are:

- Owner/Admin
- Operations Staff
- Customer/Renter

Implementation should preserve these actor boundaries. Existing frontend mock behavior must not override this specification.

---

## 1. Owner/Admin

The Owner/Admin has full administrative and operational decision authority within the system.

### Allowed Functional Areas

- Login
- View administrative dashboard
- Manage customer records
- Manage vehicle records
- Set vehicle status
- Assign vehicle branch
- Manage maintenance records
- Manage reservations
- Encode reservation details when needed
- Review reservation details
- Update reservation status
- View booking calendar
- Review customer/renter information and uploaded requirements
- Record requirement verification status
- Review payment proof/reference
- Record payment verification status
- Manage rental transactions
- Process vehicle return
- Review vehicle condition on return
- Review remaining balance
- Record settlement information
- View forecasted demand
- View fleet allocation recommendations
- View generated reports
- Configure system notifications/alerts
- Perform final booking, payment, vehicle assignment, allocation, and settlement decisions

### Sensitive Data

Owner/Admin is the internal role authorized to access sensitive renter requirements and payment-verification information as required to perform verification.

---

## 2. Operations Staff

Operations Staff has restricted operational access centered on reservation coordination.

### Explicitly Allowed by the Defended Use Case

- Login
- Open reservation module
- Encode **permitted** reservation details
- Review **non-payment** reservation details
- Update **permitted** booking information
- View booking calendar

### Explicit Restriction

Operations Staff **cannot access payment-related reservation information**.

### Not Assigned to Operations Staff in the Defended Use Cases

Unless the specification is formally revised, Operations Staff must not be granted the following administrative functions:

- customer-record management
- requirement-document review or verification
- payment-proof access or payment verification
- vehicle-record management
- maintenance-record management
- active rental transaction management
- return settlement management
- demand forecasting
- fleet allocation recommendations
- administrative reports/dashboard
- notification configuration

### Sensitive Documents

Operations Staff must not receive access to:

- customer government-ID files
- driver's-license files
- payment-proof files

Where operational coordination requires it, Staff may be shown a non-sensitive derived status (for example, whether a requirement has already been verified), but not the protected document itself. This derived-status behavior must remain consistent with the final workflow/UI specification.

### Open Detail

The manuscript uses the phrases **“permitted reservation details”** and **“permitted booking information”** without enumerating exact editable fields.

The exact Staff-editable reservation fields remain an open decision. See `10-open-decisions.md`.

---

## 3. Customer/Renter

Customer/Renter access is restricted to customer-facing functions and the customer's own records.

### Allowed Functional Areas

- Register account
- Login
- Access customer-facing account
- Browse/view applicable vehicle information
- Use Customer-Side Vehicle Recommendation
- Submit own booking request
- View own reservation details/status
- Proceed through applicable booking requirements
- Submit own renter information
- Upload own required documents
- View own requirement status
- Submit own payment reference/proof
- View own payment status
- Participate in own rental transaction
- View own booking/rental updates
- Receive own notifications
- View rental policies/agreements applicable to the customer

### Restrictions

Customer/Renter must not:

- view another customer's records
- view another customer's requirements or payment proof
- perform requirement verification
- perform payment verification
- approve bookings
- manage vehicles or branches
- manage maintenance
- view administrative forecasts
- view branch allocation recommendations
- view administrative reports
- configure system-wide notifications
- perform administrative settlement decisions

---

## 4. Access-Control Principles

### Own-Record Isolation

Customer access to bookings, requirements, payments, rentals, and notifications must be limited to records associated with that authenticated customer.

### Least Privilege

Operations Staff receives only the access necessary for the defended reservation-coordination role.

### Sensitive Data

IDs, driver's licenses, payment proofs, and sensitive financial/verification data require stronger restrictions than ordinary reservation data.

### Human Decision Authority

The system must not allow recommendation/forecast logic to bypass Owner/Admin authority over critical operational decisions.

### Enforcement Layers

During implementation, Codex should enforce these functional rules at appropriate layers, including:

- UI visibility/availability
- server-side authorization
- database access policies
- protected file/storage policies

Hidden UI controls alone are not security.

Codex may choose appropriate technical abstractions, but must preserve the functional boundaries in this document.

---

## 5. Implementation Instruction for Codex

When implementing RBAC:

1. Treat this document as authoritative over existing mock-data role assumptions.
2. Do not add privileges merely because an existing screen/button is present.
3. Do not infer Staff access to a module that the defended use cases assign only to Owner/Admin.
4. Enforce Customer own-record isolation.
5. Protect uploaded IDs/licenses and payment proofs independently from ordinary public/customer-facing assets.
6. If a required permission is not specified here or in a later frozen document, report the ambiguity rather than inventing a business rule.
