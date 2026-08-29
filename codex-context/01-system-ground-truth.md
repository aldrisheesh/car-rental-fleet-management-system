# System Ground Truth

**Status:** Development Baseline v1 — Partially Frozen  
**Last updated:** 2026-08-29

## Project

**A Web-Based Car Rental Management System with Demand Forecasting and Context-Aware Fleet Allocation for Small-Scale Multi-Branch Businesses**

The target implementation supports the Manila and Antipolo operations of the partner car rental business.

## Core Purpose

The system centralizes rental operations and provides decision support. Major areas include:

- customer and renter records
- vehicle and branch records
- booking/reservation management
- requirement submission and verification
- manual payment verification
- rental transactions
- vehicle return and settlement
- maintenance monitoring
- operational fleet-status monitoring
- reports and dashboard summaries
- demand forecasting using Weighted Moving Average (WMA)
- customer-side rule-based vehicle recommendation
- admin-side rule-based branch allocation recommendation
- selected context-aware operational inputs
- notifications and alerts
- role-based access control
- centralized storage, backup, and recovery support

## System Actors

The defended system uses three actors:

1. **Owner/Admin**
2. **Operations Staff**
3. **Customer/Renter**

Do not introduce additional application roles unless the specification is formally revised.

## Decision Authority

System-generated forecasts, recommendations, and analytical outputs are advisory.

Final decisions concerning the following remain under the Owner/Admin:

- booking approval
- requirement verification
- payment verification
- vehicle assignment
- vehicle transfer / branch allocation
- rental settlement
- other critical operational actions

## Current Scope Boundaries

### Included

- Browser-accessible web system
- Customer and administrative workflows
- Manual proof-of-payment submission and verification
- Maintenance records and mileage/odometer information
- Three-period WMA short-term demand forecasting with a rolling three-week horizon
- Forecast evaluation using MAPE when corresponding valid actual demand is available
- Rule-based customer vehicle recommendation
- Rule-based branch allocation recommendation
- Selected external context through primary/fallback API providers with manual/unavailable fallbacks
- Operational fleet status

### Explicitly Not Included

- live GPS tracking
- direct GPS hardware integration
- geofencing
- automatic retrieval of AKSH GPS / Apple Find My coordinates
- replacement of existing GPS tools
- automated payment gateway processing in the current scope
- machine learning or AI-based autonomous decisions
- dynamic pricing algorithms
- automated fraud detection
- computer vision / ALPR
- automatic vehicle dispatch
- advanced route optimization
- enterprise-scale fleet relocation optimization
- unsupported numerical suitability, urgency, or confidence scoring

## GPS / Monitoring Ground Rule

AKSH GPS, Apple Find My, AirTags, and other tracking devices remain external tools.

The proposed system may store operational monitoring records, notes, vehicle/rental linkage, status, and manually recorded updates, but it must not claim direct real-time GPS integration.

## Payment Ground Rule

Current implementation uses:

- payment reference recording
- proof-of-payment upload
- manual Owner/Admin verification against external bank/e-wallet records

No built-in automated payment gateway is part of the current study scope.

## Forecasting Ground Rule

Forecasting uses a **three-period Weighted Moving Average** for weekly short-term demand per branch and vehicle category.

Frozen baseline:

- qualifying booking demand is aggregated by calendar week, branch, and vehicle category
- fixed weights are `0.50`, `0.30`, and `0.20`, with the most recent input receiving the highest weight
- the system generates Week +1, Week +2, and Week +3 forecasts
- Week +2 and Week +3 are generated recursively from the most recent available actual and forecast values
- at least three complete actual weekly observations are required before an initial forecast is generated
- decimal forecast values are retained for analytics; allocation requirement uses the mathematical ceiling
- primary MAPE evaluation uses historical one-week-ahead forecasts and excludes zero-actual periods from the divisor

See `05-forecasting-specification.md` for the authoritative formulas and evaluation rules.

Forecasting is statistical, interpretable, and advisory. It is not an AI/ML prediction model.

## Recommendation Ground Rule

There are **two distinct recommendation functions** and they must not be merged.

### Customer-Side Vehicle Recommendation

Customer-facing vehicle-selection assistance before booking.

Core inputs include:

- passenger capacity
- destination or travel area as customer-provided trip information
- total rental budget
- rental duration
- vehicle preference
- requested rental period
- vehicle availability
- maintenance readiness
- encoded vehicle information

The current development baseline uses hard eligibility rules and deterministic ranking. It does not use an arbitrary percentage-match score.

It does not approve a booking or guarantee assignment.

### Admin-Side Branch Allocation Recommendation

Administrative decision support based on:

- WMA forecast requirement for the evaluated branch/category/week
- projected available supply
- shortage and surplus
- vehicle availability
- maintenance readiness
- idle-vehicle information
- applicable contextual information

The system may recommend a possible transfer quantity and eligible candidate vehicles, but it does not automatically transfer or reassign vehicles.

See `06-recommendation-specification.md` for the authoritative rules.

## Context-Aware Ground Rule

Applicable context includes:

- weather condition
- road condition
- route feasibility
- route accessibility
- travel distance
- estimated travel time
- reference fuel efficiency
- estimated fuel consumption

Selected provider strategy:

- Weather primary: **Open-Meteo Forecast API**
- Weather fallback: **OpenWeather One Call API 3.0**
- Location/routing/road primary: **TomTom Orbis + TomTom Traffic Incidents**
- Location/routing/road fallback: **HERE Geocoding and Search API v7 + HERE Routing API v8 + HERE Traffic API v7**

Provider output is normalized into study-defined operational classifications. Context is applied after internal demand/supply/availability/readiness analysis and must not independently create a branch shortage or surplus.

If primary and fallback sources cannot provide usable information, authorized manual context may be recorded; otherwise the factor remains `Unavailable` or `Unknown`. Never silently assume a favorable condition.

See `07-external-context-and-api-rules.md`.

## Fuel-Efficiency Ground Rule

Fuel efficiency is reference information expressed in km/L. It may be based on manufacturer specifications or owner-provided information.

It is not continuously measured actual fuel performance.

Estimated fuel consumption is:

`EstimatedFuelLiters = TravelDistanceKm / ReferenceFuelEfficiencyKmPerLiter`

It is supporting information only.

## Evaluation Ground Rule

The study evaluates the developed system primarily for software quality, functionality, usability/interaction capability, feasibility, and the selected ISO/IEC 25010 characteristics defined in the current manuscript.

Sample or simulated data may be used for functional testing where sufficient historical data are unavailable, but such results must not be presented as long-term real-world operational effectiveness.

Evaluation-plan details that do not affect implementation may continue to be revised separately and must not override frozen implementation rules.
