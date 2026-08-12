# Principal decisions log

Decisions taken by the principal (Slartibartfast) that resolve escalations left open by the boards. Each is binding and supersedes the "escalated" status in the frozen documents.

## PD-1 — Global drift term: KEPT ACTIVE in v1 (resolves MODULES §2.1 C-1)

**Date:** 2026-08-12.

MODULES §2.5 escalated the contradiction between PRODUCT-SHAPE §8.3 (removes the trailing-14-day global difficulty step on MHRA Class IIa grounds) and SCHEDULER-SPEC §14 (implements it in full). The principal's ruling:

> "We don't care about regulation — this is a general rule. We build first what the best strictly is, then we go ask for permission."

**Resolution:** SCHEDULER-SPEC §14 is built and runs **active** in v1. Module S10 (drift) and its clamp terms (S04, S06, S16, S17), state fields (`participant.driftLevel`, `activeSession.driftAtStart`) and six config fields are live, not dark, not deleted. This matches the manifest's default build ("Until it is taken, SCHEDULER-SPEC §14 is built exactly as frozen"), so **no rework is required** — the decision only removes the "delete it before Wave 3" branch. The MODULES §2.5 blast-radius table is retained for reference only.

## PD-1 general rule — build the best, seek permission after

The ruling above is a standing principle, not a one-off. Where a capability was deferred, dark-shipped, or cut **purely to reduce regulatory exposure**, build the fuller version instead. This applies going forward to the researcher surface: its clinical-trajectory / drift-detector views (deferred in SYNTHESIS §5.3 and PRODUCT-SHAPE on medical-device grounds) are **in scope**, fed by the now-active drift term.

**Boundary — this does NOT touch patient-safety or dignity constraints.** Rules such as "a session never ends on a failure", "no failure is ever displayed", and "decline is never surfaced to the patient or caregiver" come from harm-avoidance (SYNTHESIS §1.8: the dashboard-holder is abusive in ~1 case in 3) and dignity, not from regulation. They make the product better for the user and remain in force.
