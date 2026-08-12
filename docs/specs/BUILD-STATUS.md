# BUILD STATUS — resume pointer

**Updated:** 2026-08-13. Read this first when resuming in a fresh context.

## Where we are

Design phase complete (7 adversarial boards). Module manifest frozen (136 modules,
`00-MODULES.md`). **W1 contract package is FROZEN** — `src/contract/` (C01–C18),
committed as the `contract:` commit `333b0b1`. Whole tree `tsc` clean, eslint clean,
14 contract self-check assertions pass (`tests/contract/contract-selfcheck.test.ts`).

Scheduler spec (`docs/design/00-SCHEDULER-SPEC.md`) passed the blind-test-writer gate
after 3 rounds (11→6→1→0 blocking ambiguities). Most killed by exact TypeScript types.

## The next step

**Wave 2: the blind build begins.** Per `00-MODULES.md` §3 wave table, W2 is 45
modules with contract-only dependencies (pure leaves) — buildable in parallel.

For EACH module, follow `docs/BRANCHING.md`:
1. `tests/<m>` and `impl/<m>` both cut from `main` (which holds the frozen contract).
2. A blind test-writer authors `tests/**` seeing ONLY the module's contract + its named
   spec section (never the implementation). This includes authoring the fixture DATA
   under `src/contract/fixtures/scheduler/*.json` and `decks/*.json` (the manifest
   assigns fixture data to the test-writer, not the implementer).
3. A blind implementer writes `src/**` seeing ONLY the contract + spec (never the tests).
4. `verify/<m>` merges tests into impl; orchestrator runs the suite; failures returned to
   the implementer as symptoms (inputs/expected/actual), never the test file.
5. Merge to `main` when green. One module = one merge = independently revertable.

Enforce blindness by branch isolation (a test file does not exist on the impl branch).

## Build order (waves, from `00-MODULES.md` §3)

- W2 (45): S01,S02,S03,S05,S07,S08,S09,S13,S14,S23 · R01,R02,R05,R06,R07,R08,R09,R10 ·
  T01,T02,T03,T04,T06,T07,T08 · Y01,Y02,Y03 · P01–P05 · A01,A02 · B01–B10
- W3(27) W4(19) W5(15) W6(2) W7(1 the fold S21) W8(1 barrel S25) W9(6)
- Client track (S·R·T·Y·P·A·U) and backend track (B) run concurrently after W1.

## Open items / decisions

- PD-1 (`DECISIONS.md`): drift term ACTIVE in v1. General rule: build the best, seek
  regulatory permission after. Does NOT relax patient-safety/dignity constraints.
- Unowned/handoff items: `00-MODULES.md` §8 (regulatory blockers B1–B16, telemetry field
  waivers needing protocol-owner approval, PPI panel). These gate real patient
  recruitment, not the build.

## What the orchestrator needs from Slartibartfast (upcoming, not now)

1. **Docker Desktop running** before the backend wave — local Supabase needs it.
   (`docker info` currently fails; daemon not started.)
2. **Cloud Supabase keys** near the very end, for deployment.

## Repo

github.com/DarkEB1/memory-lane (public). Everything committed + pushed through `333b0b1`.
Toolchain: Node 22.7.0, Expo SDK 57, jest (domain + component projects), eslint domain
purity rules live. `npm run web` builds; `npx jest --selectProjects domain` runs pure core.
