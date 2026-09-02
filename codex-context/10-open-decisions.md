# Open Decisions

**Status:** Active
**Last updated:** 2026-09-02

## VS024 Admin Context Integration

Context belongs in both:
- booking vehicle-assignment review;
- branch-allocation recommendation review.

This follows R11.

Researcher-designed gap resolution:
- booking context targets booking pickup time;
- allocation context is explicitly current review-time route context because no exact transfer time exists.

Still open:
- whether context should later be persisted as a decision snapshot;
- whether Customer Finder should ever display context;
- CQ-028 exact client geographic restrictions;
- manual/API conflict policy beyond preserving/reporting conflict.

## Route Accessibility Unknown

VS023 uses a safe internal Unknown state when reliable accessibility evidence is unavailable. Add this to manuscript reconciliation if it becomes a public final vocabulary.
