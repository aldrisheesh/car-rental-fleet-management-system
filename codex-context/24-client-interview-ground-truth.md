# Client Interview Ground Truth
**Status:** Client-evidence baseline
**Last updated:** 2026-09-01

This document records Briah client statements reviewed after VS017. It does not automatically authorize implementation of every practice. Unclear boundaries remain in the Client Clarification Register.

## Product priority
Briah's primary need is a simple, cohesive, centralized booking/operations platform that reduces switching among Facebook/Meta messages, Google Calendar, notes/notebooks, GPS apps, spreadsheets, and other scattered tools. Centralized GPS is lower priority and does not block system completion.

## Current vehicle selection
Customers primarily choose vehicles themselves from available units/photos/information. Briah does not operate a formal customer recommendation algorithm. The Smart Vehicle Finder is therefore a researcher-designed capstone enhancement.

## Requirements before payment
Client-confirmed sequence: inquiry -> requirements -> verification -> additional documents if needed -> down payment. Do not move payment before requirement verification.

## Down payment
CLIENT CONFIRMED: minimum required down payment is 50% of the applicable total bill. Customers may voluntarily pay more. Briah also stated the down payment is non-refundable when the renter cancels. Exact bill composition and cancellation exceptions remain separate questions.

## Payment methods
CLIENT CONFIRMED current channels: bank transfer, GCash, and cash. Verification is manual against external proof/reference/transaction. Exact production account details must never be inferred from prototype data. Card/integrated payment is a future enhancement.

## Requirement review
Briah may request additional documents when concerns/red flags exist and may perform manual due diligence using appropriate official/online information. Do not automate scraping/external identity checks without future approved scope.

## Late return / extension
PARTIALLY CONFIRMED: Briah stated a PHP 3,000 charge for a late extension/return of less than six hours. Still unresolved: exact applicability, >=6-hour rule, full-day transition, and exceptions.

## Damage / return charges
Briah uses detailed/itemized damage penalties rather than one universal generic fee. Areas mentioned include panels, windows, seats/interior/dashboard, detailing, replacement parts, and other damage. Do not freeze amounts without the actual penalty schedule.

## Turnover
Briah's turnover includes communicating existing vehicle condition/damage and rental rules/possible penalties. A future approved slice may assess structured pre-rental condition evidence.

## Fleet distribution / allocation
The client described a real cross-branch mismatch: Manila is more sedan-heavy while Antipolo has more 7–8 seaters/SUV-type units, and demand may occur at the opposite branch. This validates VS014–VS016.

## Tie-up partner fallback
PARTIALLY CONFIRMED: Briah may source vehicles from tie-up partners when internal supply is insufficient. A 30% Briah / 70% partner arrangement was described. Do not assume the ratio is universal.

## Seasonal demand evidence
Client observations include strong "Ber month" demand, summer/family-vacation demand for seven-seaters, and relatively slower June/July periods. These support forecasting relevance but MUST NOT become hard-coded WMA multipliers.

## Restricted travel areas
PARTIALLY CONFIRMED: travel-area restrictions exist; Bicol was mentioned in relation to road conditions and some sedan use. Exact geography, affected vehicles/categories, restriction type, exceptions, and penalties remain unresolved. Do not hard-code `Bicol = no sedans`.

## UX / devices
Briah operates using iPhone, iPad, and laptop/desktop, including while mobile. The client emphasized a simple, cohesive experience suitable for non-technical users. Responsive phone/tablet usability is a client-backed acceptance concern.

## Privacy
Briah expressed renter-data privacy concern and avoids casually storing renter information in ordinary shared Google Drive. This supports protected authenticated storage/access controls.

## Evidence labels
Future context must distinguish: CLIENT CONFIRMED, PARTIALLY CONFIRMED, RESEARCHER-DESIGNED, PROVISIONAL, and OPEN CLARIFICATION.
