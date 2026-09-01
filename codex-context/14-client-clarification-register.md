# Client Clarification Register
**Status:** Active
**Last updated:** 2026-09-01

Previously established CQ items remain authoritative. See `24-client-interview-ground-truth.md`.

## CQ-027 — Smart Vehicle Finder Operational Restrictions
**Status:** Open — Partially evidenced

The Finder is researcher-designed, but client evidence confirms real travel-area/vehicle restrictions may exist. Clarify operational restrictions beyond active/readiness/availability/capacity/budget.

## CQ-028 — Restricted Travel Areas and Vehicle Applicability
**Status:** Open — Client clarification required

Known: restricted areas exist; Bicol was mentioned in relation to road conditions and some sedan use.

Missing: exact geography, affected vehicles/categories, absolute vs conditional restriction, exceptions, penalties, unit-specific vs category-wide.

Question:
> Nabanggit niyo po na may restricted travel areas, including Bicol especially for some sedan use. Ano po ang exact locations, anong vehicles/categories ang affected, at totally bawal po ba or may conditions/exceptions?

Guardrail: do not hard-code `Bicol = no sedans`.

## CQ-029 — Complete Late Return / Extension Charge Schedule
**Status:** Open — Partially confirmed

Known: client stated PHP 3,000 for less than six hours late.

Missing: applicability across units, exact six-hour boundary, rule beyond six hours, full-day transition, exceptions.

Question:
> Yung nabanggit niyo pong PHP 3,000 kapag less than six hours late, applicable po ba sa lahat ng units? Ano po ang charge kapag six hours or more, at kailan siya nagiging additional full rental day?

## CQ-030 — Tie-Up Partner Vehicle Process
**Status:** Open — Partially confirmed

Known: Briah may source tie-up vehicles; a 30% Briah / 70% partner arrangement was described.

Missing: whether ratio is universal, partner vehicle verification/recording, maintenance/liability/payment ownership, Browse/Finder visibility, and whether it belongs in current capstone scope.

Question:
> Kapag kumukuha po kayo ng unit sa tie-up partner, fixed po ba lagi ang 30/70? Paano po ninyo vine-verify at nire-record ang partner vehicle, at gusto niyo po bang kasama ito sa system or manual fallback lang?

## Presentation rule
Validate unresolved boundaries while demonstrating canonical workflows. Do not ask Briah to design researcher-defined algorithms such as WMA or baseline Finder ranking.
