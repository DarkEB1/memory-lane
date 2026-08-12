# Scheduler Design — HYBRID LADDER

**Module:** `src/domain/scheduler.ts`
**Version string:** `SCHEDULER_VERSION = 'hybrid-ladder-1.0.0'`
**Status:** proposal, for adjudication against the other assigned scheduler designs
**Date:** 2026-08-12
**Governing documents:** `docs/research/00-SYNTHESIS.md` §4, §5.1, §5.2, §6, §9 · `docs/research/spaced-retrieval-and-srs.md` §A1, §A4, §A5, §B3, §B4 · `docs/architecture/00-ADR-PLATFORM.md` §4.4, §6

---

## 0. The thesis, and the verdict on it, stated first

**The thesis I was assigned:** a discrete ladder is the load-bearing mechanism, so the clinical behaviour is exactly the published Camp protocol and is explicable to a clinician; a continuous latent estimate rides alongside and influences *only* rung transitions and the progression-drift term, and is logged for later model fitting.

**My verdict after designing it: the hybrid earns its place, but on one argument only, and three of the four justifications usually offered for it are false.**

| Claimed justification for the latent | Verdict |
|---|---|
| "We need the model to fit DSR/FSRS to this population later" (req 16) | **False as a justification for runtime coupling.** Requirement 16 is satisfied entirely by the telemetry spec (§7 of the synthesis). Raw `(item, elapsed, presented_cue, correct, latency)` tuples are sufficient to fit any memory model offline. A latent in the runtime adds *nothing* to the research asset. Anyone who argues for the hybrid on research grounds is arguing for the wrong thing. |
| "The model schedules better" | **Not claimed, and must not be.** The latent never sets `due_at`. The ladder sets `due_at`. |
| "The model drives the drift detector" (req 10) | **Weak, and self-inflicted.** A counter-based drift detector ("trailing-14-day success at a fixed cue level") is more legible and is what requirement 10 literally asks for. The only reason I cannot use it is that the *soft assist* — the latent's one genuinely valuable behaviour — masks declining success by raising cue support. Adding the assist created the need for a less legible drift signal. That is a real complexity cost of the hybrid and I am naming it rather than hiding it. |
| "The model buys interval knowledge without spending a failure" | **True, and it is the whole case.** A pure discrete ladder learns that 7 days is too long for an item by *failing at 7 days* — on a photograph of the person's daughter. Requirement 7 (≥95% success) and P1/P2 make that failure expensive in a way it is not in Anki. The latent's `soft assist` and `promotion veto` let the engine spend *evidence* instead of *failures*. That is the only argument, and it is sufficient. |

**The property that makes the added complexity safe enough to accept:** the latent is specified as a **strictly conservative operator**. It can only ever move an item toward *shorter intervals and more cue support*. It can never lengthen an interval, never reduce cue support, and never accelerate anything.

> **INVARIANT M (Monotone Advisory).** For every reachable state and every input, the schedule produced with `model_advisory_enabled = true` presents each item **no later** and at a cue level **no harder** than the schedule produced with `model_advisory_enabled = false`.

That invariant is directly testable by a blind test-writer (run every golden fixture twice, once with each flag, and assert the ordering), and it bounds the blast radius of any bug in the latent to a single benign failure mode: **over-braking**, whose symptom is a deck that feels repetitive, not a patient who fails. Compare with the failure mode of a model that *drives* the schedule: a person failing on their daughter's face because a fitted-to-healthy-Anki-users parameter said 14 days was fine.

**If the principal applies LESS IS MORE and cuts:** cut in this order — (1) the latent-driven drift signal, replaced by the counter-based one in §11.4 and accepting that it under-detects while the assist is active; (2) the promotion veto (≈10 lines); (3) the soft assist, at which point this design *is* the pure ladder design and there is no hybrid. Do not cut in the other order. The soft assist is the last thing to go.

---

## 1. Scope, ports and constraints

### 1.1 What this module is

`src/domain/scheduler.ts` is a **pure deterministic fold** over the patient's event log, plus two pure query functions. It is imported unchanged by:

- the tablet (local projection, offline, `expo-sqlite`-backed event log), and
- the server (`supabase/functions/sync`, Deno) which **recomputes the same state canonically** from the ingested event log (ADR §4.4).

Scheduler state is never stored, never synced, never transmitted. It is always derived.

### 1.2 Hard constraints, restated as testable properties

| Constraint | How this design satisfies it |
|---|---|
| No `react`, `react-native`, `expo-*`, `@supabase/*` imports | The module imports only from `src/contract/schema.ts` and `src/contract/ports.ts` (types only). |
| No `Date`, `Math.random`, `crypto`, `fetch`, `window`, `document` | Every function that needs the time takes `now_ms: number` as a parameter. `Clock` is called by the *caller*, never inside the domain. |
| Deterministic fold | `reduce(state, event)` is total and referentially transparent. `fold(config, events) = events.reduce(reduce, initialState(config))`. |
| Byte-identical across runtimes | §14 — the floating-point contract. |
| Runs offline for days | Zero I/O. The only external input is `now_ms`. Missed days produce no backlog (§10.6). |
| Blind-testable from spec alone | §15 — the frozen fixture inventory. |

### 1.3 Ports actually used

```ts
interface Clock { nowMs(): number }          // called by the session runtime, passed in
interface Rng   { nextUnitFloat(): number }  // ACCEPTED BY THE CONTRACT, NEVER CALLED
```

**The scheduler consumes no randomness.** Every ordering decision terminates in a total order whose last key is `item_id` (lexicographic on the UUID string), so ties are structurally impossible. This is a *stronger* determinism guarantee than the ADR requires and it removes an entire class of flaky test. If a future feature needs randomness (e.g. distractor selection for 2-alternative recognition — which is a *presentation* concern, not a scheduling one), it must be injected via `Rng` **and the drawn value logged into the event**, so the fold stays replayable.

### 1.4 API surface — one mutator, three queries

```ts
export const SCHEDULER_VERSION: string;
export const CONSTANTS: SchedulerConstants;          // §13, frozen, exported for tests

export function initialState(config: SchedulerConfig): SchedulerState;
export function reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState;
export function fold(config: SchedulerConfig, events: readonly SchedulerEvent[]): SchedulerState;

export function selectNext(state: SchedulerState, now_ms: number): Selection;
export function resolvePresentation(state: SchedulerState, item_id: string, now_ms: number): Presentation;
export function gradeAttempt(input: AttemptInput): Grade | null;
```

`reduce` is the **only** state mutator. There is no `endSession(state)` function — session end is the `session_ended` event. This makes the fold the single source of truth and means the server and the device cannot diverge through an API call the other did not make.

`fold` requires events pre-sorted in **canonical order**: `(t_anchor_ms ASC, device_id ASC lexicographic, seq ASC)`. `t_anchor_ms` is the server-anchored timestamp (ADR §4.3); on-device, before sync, it is the local `t_wall_ms`. See weakness W12.

---

## 2. State model — every field, type and range

### 2.1 `SchedulerConfig` (immutable per participant for the study duration)

| Field | Type | Range | Default | Note |
|---|---|---|---|---|
| `config_version` | string | — | `'hybrid-ladder-1.0.0'` | logged as `scheduler_algorithm_version` |
| `tz_offset_minutes` | int | −720…840 | 0 | fixes the day boundary; never read from the OS inside the domain |
| `camp_start_rung_default` | int | 0…3 | 0 | requirement 1's "personalisable start" |
| `session_max_items` | int | 3…12 | 10 | distinct personal items per session |
| `session_max_ms` | int | 180000…900000 | 600000 | 10 min hard |
| `session_soft_end_ms` | int | 120000…session_max_ms | 480000 | 8 min; after this only camp reps and the closer |
| `tier1_min_per_session` | int | 0…5 | 3 | the tier-1 frequency floor |
| `not_due_fill_max` | int | 0…8 | 4 | interleaving budget (requirement 8) |
| `camp_max_reps_per_session` | int | 1…7 | 5 | bounds a single item's share of a session |
| `model_advisory_enabled` | bool | — | `true` | the ablation switch for INVARIANT M |

Per P10 (UI freeze) the analogous rule applies here: **`SchedulerConfig` is pinned at enrolment and may not change for the study duration.** A change is a protocol deviation and must be logged as one.

### 2.2 `ItemState` — one per non-probe item

**Identity and status**

| Field | Type | Range | Note |
|---|---|---|---|
| `item_id` | string (uuid) | — | primary key, and the final tie-break in every ordering |
| `tier` | 1 \| 2 \| 3 | — | 1 = core identity / primary caregivers / safety routines |
| `status` | `'active'` \| `'absorbed'` \| `'retired'` | — | see §12 |
| `introduced_at_ms` | int | ≥0 | first `item_added` |
| `absorbed_at_ms` | int \| null | — | set only by a `distress` event |
| `retired_at_ms` | int \| null | — | set only by an `item_retired` event |

**Discrete ladder state — LOAD-BEARING**

| Field | Type | Range | Note |
|---|---|---|---|
| `cue_level_target` | int | 0…3 | 0 free recall, 1 partial cue, 2 two-alternative recognition, 3 familiarity exposure (no question). Higher = more support. |
| `across_rung` | int | 0…6 | index into `ACROSS_LADDER_DAYS` |
| `camp_start_rung` | int | 0…3 | per-item override of `camp_start_rung_default` |
| `clean_streak` | int | 0…255 | consecutive CLEAN_SESSIONs at the current `cue_level_target` |
| `exposure_session_streak` | int | 0…255 | consecutive EXPOSURE_SESSIONs |
| `exposures_at_3` | int | 0…255 | exposures accumulated since `cue_level_target` last became 3 |
| `reached_3_by_demotion` | bool | — | `true` if the item arrived at rung 3 via a miss; governs the assist-check threshold |
| `consecutive_skips` | int | 0…255 | distinct sessions ending in a `skip` on this item |
| `last_seen_at_ms` | int \| null | ≥0 | `response_commit_ms` of the **last** presentation in the last session containing it |
| `last_graded_at_ms` | int \| null | ≥0 | `response_commit_ms` of the **last graded** (cue < 3) attempt |
| `due_at_ms` | int | ≥0 | derived; stored so ordering is explicit and assertable |
| `session_count` | int | ≥0 | sessions in which the item was presented at least once |
| `graded_presentations` | int | ≥0 | first attempts with `presented_cue_level < 3` |
| `lapse_count` | int | ≥0 | **logged only — no threshold, anywhere, ever** (P3, req 5) |

**Continuous latent state — ADVISORY ONLY**

| Field | Type | Range | Note |
|---|---|---|---|
| `stability_days` (`S`) | float \| null | 0.050…120.000, 6 dp | `null` until the item's first graded attempt |
| `s_delta_ewma` | float | −1.000…1.000, 6 dp | EWMA of `(m − 1)`; drives the drift signal |
| `last_r_hat` | float \| null | 0.000001…1.000000 | last computed retrievability, logged |
| `last_p_hat` | float \| null | 0.000000…1.000000 | last computed success probability *as presented*, logged |

**Within-session scratch (cleared by `session_ended`)**

| Field | Type | Range | Note |
|---|---|---|---|
| `in_session` | bool | — | presented at least once in the open session |
| `camp_rung` | int | 0…6 | interval index to be used for the **next** within-session repetition |
| `camp_best_rung` | int | −1…6 | last rung succeeded at this session; −1 = none |
| `camp_due_at_ms` | int \| null | — | absolute time of the next within-session repetition |
| `camp_reps` | int | 0…7 | presentations this session |
| `session_presented_cue` | int \| null | 0…3 | cue level resolved at first presentation, incl. soft assist |
| `session_cue_escalated` | bool | — | a miss occurred this session; `cue_level_target` already moved |
| `session_first_grade` | Grade \| null | — | grade of the first graded attempt this session |
| `session_first_r_obs` | float \| null | — | `r_hat` computed at that first graded presentation |
| `session_assist_fired` | bool | — | soft assist raised the presented cue above target |

### 2.3 `PatientState`

| Field | Type | Range | Note |
|---|---|---|---|
| `config` | SchedulerConfig | — | frozen |
| `items` | Map<item_id, ItemState> | — | insertion order irrelevant; all iteration is sorted |
| `drift_stage` | 0 \| 1 \| 2 | — | 0 none, 1 mild, 2 strong |
| `drift_last_change_day` | int \| null | — | day index; enforces the 7-day dwell |
| `session_log` | RingBuffer<SessionSummary, 40> | — | last 40 sessions; enough for the 28-day acute-change window |
| `acute_last_emitted_day` | int \| null | — | enforces the 14-day acute cooldown |
| `open_session` | OpenSession \| null | — | scratch for the session currently running |

`SessionSummary` (one per `session_ended`, 40 retained):

`{ session_id, day_index, ended_at_ms, n_graded_first, n_graded_first_correct, sum_presented_cue, n_presentations, ended_on_success }`

`OpenSession`:

`{ session_id, started_at_ms, day_index, distinct_items: string[], tier1_presented: string[], last_presented_item_id, assist_check_used: bool, last_attempt_correct: 0|1|null, trials: TrialRecord[] }`

---

## 3. Event vocabulary

The scheduler reduces over exactly these event types. Anything else in the log is ignored by `reduce` (returned unchanged).

| `type` | payload | effect |
|---|---|---|
| `item_added` | `{ item_id, tier, is_probe, cue_start_level?, camp_start_rung? }` | creates `ItemState`; `is_probe: true` → **no state created at all** (§9) |
| `item_tier_changed` | `{ item_id, tier }` | changes tier; re-clamps `across_rung` to the new `MAX_RUNG` |
| `session_started` | `{ session_id, started_at_ms }` | opens `open_session` |
| `attempt` | `{ item_id, session_id, presented_cue_level, camp_rung, attempt_index, correct: 0\|1\|null, latency_ms, stimulus_paint_ms, response_commit_ms, r_hat, p_hat, soft_assist_applied }` | the only learning event |
| `skip` | `{ item_id, session_id, at_ms }` | patient-side "not today" on an item |
| `session_ended` | `{ session_id, ended_at_ms, reason }` | runs the end-of-session pipeline (§8) |
| `distress` | `{ item_id \| null, session_id, source, severity, at_ms }` | absorbing state (§12) |
| `item_reenabled` | `{ item_id, at_ms, by }` | human-only |
| `item_retired` | `{ item_id, at_ms, by }` | human-only |

**There is no event that carries a patient self-assessment.** No `Again/Hard/Good/Easy`, no confidence, no "did you get that". The vocabulary makes P4 structurally unrepresentable rather than merely forbidden. A blind test-writer can assert this by asserting the exhaustiveness of the `SchedulerEvent` union.

`r_hat`, `p_hat` and `soft_assist_applied` are written into the `attempt` event by the presenting runtime (which obtained them from `resolvePresentation`). They are carried in the log so the server's recomputation does not have to reconstruct the presentation-time latent from a possibly-different state — the values that *were shown to the patient* are facts, not derivations.

---

## 4. The two ladders (requirement 1)

### 4.1 Within-session — the Camp loop, seconds to minutes

```
CAMP_LADDER_S = [10, 20, 40, 80, 160, 320, 640]     // rung 0..6, seconds
```

Personalisation: `camp_start_rung` per item, defaulting to `camp_start_rung_default` per patient, range 0…3. A person for whom 10 s is trivially easy starts at rung 2 (40 s) and the ladder is unchanged above that.

`camp_rung` is the index of the interval used for the **next** repetition. It is initialised to `camp_start_rung` at the item's first presentation in the session.

```
onWithinSessionSuccess(t_resp):        // grade ∈ {SLOW_HIT, CLEAN_HIT}
  gap_ms         = CAMP_LADDER_S[camp_rung] * 1000
  camp_best_rung = camp_rung
  camp_due_at_ms = t_resp + gap_ms
  camp_rung      = min(camp_rung + 1, 6)
  camp_reps      = camp_reps + 1

onWithinSessionMissResolved(t_r):      // t_r = response_commit_ms of the trial that ENDED the rescue chain
  camp_rung      = (camp_best_rung >= 0) ? camp_best_rung : camp_start_rung
  gap_ms         = CAMP_LADDER_S[camp_rung] * 1000
  camp_due_at_ms = t_r + gap_ms
  camp_reps      = camp_reps + 1
```

So the observed gaps for a clean run starting at rung 0 are exactly **10 s, 20 s, 40 s, 80 s, …**, and a miss reverts the gap to the last one that worked. That is Camp's published protocol (`spaced-retrieval-and-srs.md` §A1) verbatim.

**Items at `cue_level_target == 3` have no Camp loop.** They are presented exactly once per session and `camp_due_at_ms` stays `null`. Familiarity exposure is a moment of connection, not a measurement, and repeating it three times in six minutes would be a different thing.

`camp_reps` is capped at `camp_max_reps_per_session = 5`. Past the cap the item is not re-selected this session.

### 4.2 Across-session — the interval ladder, hours to days

```
ACROSS_LADDER_DAYS = [0, 1, 2, 4, 7, 14, 30]        // rung 0..6
                      ^ rung 0 is "same day"
SAME_DAY_OFFSET_MS = 10_800_000                     // 3 hours
```

**Due computation — exact:**

```
dayIndex(t_ms) = floor( (t_ms + tz_offset_minutes * 60000) / 86_400_000 )
dayStartMs(d)  = d * 86_400_000 - tz_offset_minutes * 60000

if across_rung == 0:
    due_at_ms = last_seen_at_ms + SAME_DAY_OFFSET_MS
else:
    due_day   = dayIndex(last_seen_at_ms) + ACROSS_LADDER_DAYS[across_rung]
    due_at_ms = dayStartMs(due_day)

isDue(now_ms) = (due_at_ms <= now_ms)
```

Rungs ≥ 1 are **day-granular**. An item last seen at 10:03 on day 5 with a 1-day interval is due from 00:00 on day 6, not from 10:03 on day 6. Anchoring to the exact clock time makes the schedule brittle against a family that runs the session ten minutes earlier than yesterday; the day-granular rule is what Anki gets right and it costs nothing. Rung 0 is deliberately clock-granular because "same day" means "a second session later today" and a 3-hour minimum gap is what makes that a real spacing rather than a repeat.

**Ceilings (requirement 3):**

```
MAX_RUNG_BY_TIER = { 1: 4, 2: 6, 3: 6 }      // tier 1 tops out at 7 days; tiers 2-3 at 30 days
MIN_RUNG         = 0                         // same day, for every tier
```

Effective ceiling after drift (§11): `MAX_RUNG_eff(tier) = max(0, MAX_RUNG_BY_TIER[tier] - drift_stage)`.

**Runtime invariant, asserted in the module and in tests:** `ACROSS_LADDER_DAYS[across_rung] <= 30` for every item and `<= 7` for every tier-1 item, at every point in every fold. There is no code path that can produce a longer interval; the assertion exists because requirement 3 is a safety property and safety properties get belt and braces.

### 4.3 The cue ladder (P2, requirement 4)

```
cue 0 — free recall             "Who is this?"                        (retrieval)
cue 1 — partial cue             first phoneme / initial / semantic hint (retrieval)
cue 2 — two-alternative         two faces, or two names                (recognition)
cue 3 — familiarity exposure    "Here's Margaret, your daughter."      (NO QUESTION ASKED)
```

Higher index = more support. Rung 3 produces no `correct` value and no grade.

---

## 5. The grading function (requirement 2)

```ts
type Grade = 0 | 1 | 2 | 3;   // MISS | RESCUED | SLOW_HIT | CLEAN_HIT

const SLOW_MS = [8000, 8000, 5000, Infinity];   // indexed by presented_cue_level
const TIMEOUT_MS = 20000;

function gradeAttempt({ correct, presented_cue_level, latency_ms, attempt_index }): Grade | null {
  if (presented_cue_level === 3) return null;              // EXPOSURE — ungraded, by definition
  if (correct === 0)             return 0;                 // MISS
  if (attempt_index > 0)         return 1;                 // RESCUED
  if (latency_ms > SLOW_MS[presented_cue_level]) return 2;  // SLOW_HIT
  return 3;                                                 // CLEAN_HIT
}
```

Exactly the four inputs requirement 2 names, and nothing else. Comparisons are strict `>`, so `latency_ms === 5000` at cue 2 is a `CLEAN_HIT`.

**No-response timeout.** If the runtime observes no input for `TIMEOUT_MS = 20000` from stimulus paint, it emits `correct: 0, latency_ms: 20000, error_type: 'no_response_timeout'` → `MISS`. This is the only way a `MISS` can occur without a tap.

**Latency thresholds are cue-dependent** because a two-alternative recognition decision is a different motor and cognitive act from free recall. 8000 / 8000 / 5000 are judgement calls (§13, provenance column).

**What each grade actually drives:**

| Grade | Drives |
|---|---|
| `CLEAN_HIT` (3) | camp advance; CLEAN_SESSION eligibility; `S` growth at `GAIN_CLEAN` |
| `SLOW_HIT` (2) | camp advance; **CLEAN_SESSION eligibility (yes)**; `S` growth at `GAIN_SLOW` |
| `RESCUED` (1) | **nothing.** Telemetry and the P1 audit only. |
| `MISS` (0) | rescue chain; `cue_level_target += 1`; FAILED_SESSION; `across_rung -= 1`; `S × SHRINK_MISS`; `lapse_count += 1` |
| `null` (exposure) | presentation counted; `exposures_at_3 += 1`; **no `S` update, no rung movement** |

**A SLOW_HIT is a clean session.** A correct answer is never treated by the ladder as a failure — latency modulates only the *magnitude* of the latent's stability update. Treating slowness as failure would demote items the person can actually do, which is both a dignity failure and, given intra-individual RT variability in this population (evidence table row 44) and DLB hour-to-hour fluctuation (row 85), measurement noise dressed as a clinical decision.

**`RESCUED` drives nothing.** I considered keying the stability shrink on rescue depth (0.65 for depth 1, 0.45 for depth ≥2) and rejected it: two more invented constants, no evidence, and a behaviour difference too small to matter against the ladder. `rescue_depth` is logged; if the pilot data justifies it, it can be added in v2 as a pure-telemetry-driven change.

---

## 6. The continuous latent — exact specification

### 6.1 Functional form

Requirement 16 names the form to keep: `R(t,S) = (1 + factor·t/S)^(−decay)`. I fix `decay = 0.5` and derive `factor` from the DSR convention `R(S,S) = 0.9`:

```
0.9 = (1 + F)^(-0.5)  →  F = 0.9^(-2) - 1 = 100/81 - 1 = 19/81
```

```
DECAY  = 0.5
FACTOR = 19/81 = 0.234568   (stored as the exact literal 0.2345679012345679)

r_hat(t_days, S) = 1 / sqrt(1 + FACTOR * t_days / S)
```

`decay = 0.5` is not an arbitrary choice. It is the FSRS-5 published value **and** it is the only exponent that turns the power law into a single `sqrt`, which is the one transcendental-adjacent operation IEEE-754 requires to be correctly rounded (§14). Fixing decay buys cross-runtime determinism for free. A trainable decay would cost `Math.pow`, which is implementation-approximated and would silently break the "server recomputes byte-identically" property in ADR §4.4.

`S` ("stability") is in days and means: *the interval at which this item's free-recall probability is 0.9.* It is **not** a clinical quantity, it is **not** a probability, and it must never be shown to a patient, caregiver, clinician or researcher as anything other than a model internal (P5, P24, req 10).

### 6.2 From retrievability to success-as-presented

Cue support raises the floor of the success distribution. Model it as a guessing/floor model:

```
CUE_FLOOR = [0.00, 0.15, 0.50, 1.00];        // indexed by presented cue level

p_hat(cue, r) = CUE_FLOOR[cue] + (1 - CUE_FLOOR[cue]) * r
```

- cue 0 (free recall): `p = r`
- cue 1 (partial cue): `p = 0.15 + 0.85r`
- cue 2 (2-alternative): `p = 0.50 + 0.50r` — the 0.50 is the guessing floor and is the one number here with a derivation
- cue 3 (exposure): `p = 1.00` — no question is asked, so there is nothing to fail

### 6.3 Stability initialisation

`S` is `null` until the item's first graded attempt. On that attempt:

```
S_INIT_BY_GRADE = { CLEAN_HIT: 1.000, SLOW_HIT: 0.600, MISS: 0.200 };
RUNG_S_INIT_W   = [1.00, 0.80, 0.50, —];    // indexed by presented cue level

S = clamp6( S_INIT_BY_GRADE[grade] * RUNG_S_INIT_W[presented_cue_level], S_MIN, S_MAX )
```

A clean hit at cue 2 is weaker evidence of stability than a clean hit at cue 0, so it initialises lower.

### 6.4 Stability update — once per session, per item

**`S` updates exactly once per item per session: on that session's first graded attempt (`attempt_index === 0`, `presented_cue_level < 3`).** Within-session Camp repetitions do **not** update `S`.

Rationale, stated because it is load-bearing: the latent models *across-session* retention. Camp repetitions are massed practice at 10–640 s; folding them into `S` would inflate stability by an amount that has nothing to do with whether the person will know the item tomorrow, and would make `S` a function of session length. This also caps the update rate at one per session, which is what makes the whole latent cheap and auditable.

```
GAIN_CLEAN     = 2.00      MIN_GAIN_CLEAN = 1.05
GAIN_SLOW      = 0.80      MIN_GAIN_SLOW  = 1.02
SHRINK_MISS    = 0.55
RUNG_W         = [1.00, 0.70, 0.40, —];    // evidential weight by presented cue level
S_MIN = 0.050   S_MAX = 120.000

r_obs = r_hat( elapsed_days, S_before )
        where elapsed_days = (stimulus_paint_ms - last_graded_at_ms) / 86_400_000

switch (grade) {
  CLEAN_HIT: m = max( 1 + GAIN_CLEAN * (1 - r_obs) * RUNG_W[cue], MIN_GAIN_CLEAN ); break;
  SLOW_HIT:  m = max( 1 + GAIN_SLOW  * (1 - r_obs) * RUNG_W[cue], MIN_GAIN_SLOW  ); break;
  MISS:      m = SHRINK_MISS; break;
}

S             = clamp6( S_before * m, S_MIN, S_MAX )
s_delta_ewma  = round6( 0.7 * s_delta_ewma + 0.3 * (m - 1) )
```

The `(1 − r_obs)` term is the DSR spacing law — *reviewing when you have nearly forgotten produces the larger stability gain* — and it is why a success after a long gap is worth much more than a success after three hours. `MIN_GAIN_CLEAN = 1.05` exists because without a floor, same-day (rung-0) successes would produce ~2.9% growth and an item could sit at the same-day rung effectively forever.

`s_delta_ewma` tracks `(m − 1)` rather than `ln(m)` **for determinism reasons** (§14): `Math.log` is implementation-approximated; `(m − 1)` is exact arithmetic and is a monotone surrogate that is entirely adequate for a threshold test.

### 6.5 Where the latent is allowed to act — the complete list

There are exactly **three** places, and no others:

| # | Mechanism | Direction | Bound |
|---|---|---|---|
| L1 | **Soft assist** — raise the presented cue level by one rung for a single trial | more support | ≤ +1 rung; never changes `cue_level_target`; re-evaluated every session; reverses instantly when `p_hat` recovers |
| L2 | **Promotion veto** — block an across-ladder promotion the discrete rule would have made | shorter interval | can only *block*, never *cause*, a rung change |
| L3 | **Vanish veto** — block a cue-vanish the discrete rule would have made | more support | can only *block*, never *cause*, a cue change |
| L4 | **Drift signal** — the patient-level input to `drift_stage` (§11) | more support, shorter intervals | gated by eligibility + 7-day dwell + ≤1 step per evaluation |

Every one of these moves the patient's experience in the conservative direction. That is INVARIANT M and it is what makes the hybrid acceptable.

### 6.6 L1 — the soft assist, exact

Evaluated **once per item per session, at the item's first presentation in that session**. Within-session repetitions inherit the resolved cue level (elapsed is seconds, so `r → 1` and re-evaluation would be meaningless).

```
SOFT_ASSIST_THRESHOLD_BY_DRIFT = [0.85, 0.90, 0.95];   // indexed by drift_stage

resolveSoftAssist(item, now_ms):
  c = item.cue_level_target
  if (c === 3)                     return 3;         // no assist above exposure
  if (!config.model_advisory_enabled) return c;
  if (item.S === null)             return c;         // never graded — no latent yet
  elapsed_days = (now_ms - item.last_graded_at_ms) / 86_400_000
  r = r_hat(elapsed_days, item.S)
  p = p_hat(c, r)
  return (p < SOFT_ASSIST_THRESHOLD_BY_DRIFT[drift_stage]) ? min(c + 1, 3) : c
```

**Why 0.85 and not 0.95.** The promotion veto (L2) holds an item at a rung until `p_hat` at the *next* rung would be ≥ 0.95, which means at the moment an item becomes due, `p_hat` sits at roughly 0.95. If the assist threshold were also 0.95 it would fire on essentially every trial, the presented cue would never equal the target, no session would ever be classified CLEAN, and the ladder would never climb. The gap between 0.85 and 0.95 is the **operating band**: an item is presented at its target cue level while `0.85 ≤ p̂ < 0.95` (which is what happens when it is overdue, or the day after a demotion), and gets a rung of help below 0.85. The width of that band is the single most behaviour-sensitive number in this design and it has no evidential basis. See weakness W2.

**Assist at cue 2 turns the trial into an exposure.** `min(2 + 1, 3) = 3`. An item whose predicted success has fallen below 0.85 even at two-alternative recognition is shown answer-first that day, with no question. That is correct — P12 is exactly this — and it is the mechanism by which the ≥95% target survives a bad week without anyone failing.

### 6.7 L2 — the promotion veto, exact

Evaluated in the end-of-session pipeline, step 3.

```
canPromote(item):
  if (!config.model_advisory_enabled) return true;
  if (item.S === null)                return true;    // no evidence, defer to the ladder
  t_next = ACROSS_LADDER_DAYS[item.across_rung + 1]   // in days; rung 0 -> 1 gives t_next = 1
  r_next = r_hat(t_next, item.S)
  p_next = p_hat(item.cue_level_target, r_next)
  return (p_next >= PROMOTE_THRESHOLD)                // PROMOTE_THRESHOLD = 0.95
```

Note `p_hat` uses `cue_level_target`, not the assisted level: the question is "at the support level we intend to present at, will they succeed after this longer gap?"

At `cue_level_target === 3`, `p_next === 1.00` and the veto never fires. Exposure items cannot fail, so there is nothing for the model to protect against; their interval movement is governed entirely by the discrete exposure rule (§8, step 3).

**There is no veto-patience escape hatch.** An item that never satisfies the veto is simply seen often. Requirement 6 says that explicitly: *"re-showing something already known well is not waste — it is a successful, pleasant experience with its own value."* The cost is session capacity, and that is handled by the queue (§10), not by relaxing the veto.

### 6.8 L3 — the vanish veto, exact

```
canVanish(item):
  if (!config.model_advisory_enabled) return true;
  if (item.S === null)                return true;
  t_now  = (item.across_rung === 0) ? 0.125 : ACROSS_LADDER_DAYS[item.across_rung]
  r      = r_hat(t_now, item.S)
  p      = p_hat(item.cue_level_target - 1, r)        // the HARDER rung we would move to
  return (p >= PROMOTE_THRESHOLD)                     // 0.95
```

`0.125` is `SAME_DAY_OFFSET_MS` expressed in days (3 h ÷ 24 h). Evaluated **after** the across-ladder transition, so it uses the item's new interval.

---

## 7. Trial-time behaviour

### 7.1 `resolvePresentation(state, item_id, now_ms) → Presentation`

```
Presentation = {
  item_id, presented_cue_level, camp_rung, is_exposure,
  is_assist_check, soft_assist_applied,
  r_hat, p_hat,                 // written into the attempt event; null if S is null
  attempt_index: 0
}
```

Resolution order — exact, and each step can only raise the presented cue level:

```
1.  base = item.cue_level_target
2.  if (item.session_cue_escalated)  base = item.cue_level_target       // already raised by this session's miss
3.  if (base === 3)                  return assistCheckOrExposure(item)  // §7.3
4.  presented = resolveSoftAssist(item, now_ms)                          // §6.6
5.  soft_assist_applied = (presented > base)
6.  return { presented_cue_level: presented, camp_rung: item.camp_rung, ... }
```

Within-session repetitions (`camp_reps > 0`) skip steps 3–5 and reuse `item.session_presented_cue`, unless a miss has since escalated it, in which case they use the escalated level.

### 7.2 The rescue chain (P1, requirement 4, §5.2.3)

On any `MISS`, the runtime **immediately**:

1. supplies the answer, warmly, with no scoring language, no red mark, no sound;
2. re-presents the same item at `min(presented_cue_level + 1, 3)` with `attempt_index += 1`.

The chain repeats until an attempt is correct or the presented level reaches 3, at which point it is an exposure and terminates by construction. **Maximum chain length is 4 trials and every chain terminates in a success.** This is what makes "record a failure and still never display one" (§5.2.3 of the synthesis) mechanically true rather than aspirational.

State effects of the chain:

- `cue_level_target = min(cue_level_target + 1, 3)` — **at most once per session** (guarded by `session_cue_escalated`). A single bad afternoon cannot dump an item from free recall to exposure-only. This is requirement 11 applied at item granularity.
- if the new `cue_level_target === 3`, set `reached_3_by_demotion = true` and `exposures_at_3 = 0`.
- `clean_streak = 0`, `lapse_count += 1`.
- `camp` reverts per §4.1.
- **Nothing is suspended, retired, or removed.** There is no lapse threshold. `lapse_count` is a telemetry integer with no consumer inside the module — a blind test can assert that by grepping the module for its only write site.

### 7.3 Escape from cue rung 3 — the assist-check

Rung 3 is where P3 sends everything that degrades, and if it is a one-way ratchet then one bad day on a DLB-band participant permanently converts an item the person can actually do into a photo they are shown but never asked about. Requirement 11 forbids that. So there is exactly one, tightly bounded, way up.

```
EXPOSURE_BEFORE_ASSIST_CHECK_FRESH    = 3     // item that STARTED at rung 3 (answer-first introduction, P12)
EXPOSURE_BEFORE_ASSIST_CHECK_DEMOTED  = 20    // item that FELL to rung 3 after a miss
MAX_ASSIST_CHECKS_PER_SESSION         = 1     // per patient, not per item

assistCheckOrExposure(item):
  threshold = item.reached_3_by_demotion ? 20 : 3
  eligible  = item.exposures_at_3 >= threshold
           && !open_session.assist_check_used
           && drift_stage === 0
           && item.status === 'active'
  if (!eligible) return { presented_cue_level: 3, is_exposure: true, is_assist_check: false }
  return { presented_cue_level: 2, is_exposure: false, is_assist_check: true }
```

Outcome handling:

- **correct** → `cue_level_target = 2`, `reached_3_by_demotion = false`, `exposures_at_3 = 0`, `clean_streak = 0`.
- **incorrect** → rescue chain (which lands at rung 3, an exposure, a success), `exposures_at_3 = 0`, `cue_level_target` stays 3, `session_cue_escalated = true`.

Either way `open_session.assist_check_used = true`.

**Why 20 for a demoted item.** This is the one place in the design that deliberately manufactures a possible failure, so it must be costed against requirement 7. One assist-check per 21 presentations of that item is a worst-case 4.8% first-attempt failure contribution on that item, and at most one per session across the whole deck. At roughly one session per day, a demoted item gets re-tested about once every three weeks. That is slow enough to respect P3 ("items degrade and stay there") and fast enough not to be a ratchet. Both numbers are judgement calls.

---

## 8. End-of-session pipeline — exact ordering

Triggered by `session_ended`. Runs for every item with `in_session === true`, iterated in `item_id` ascending order (so the fold is order-independent of the runtime), then the patient-level steps.

### 8.1 Per-item, in this exact order

**Step 1 — classify the session outcome.**

```
if (item.cue_level_target === 3 && !assist_check_occurred_for_item)  -> EXPOSURE_SESSION
else if (item.session_first_grade === MISS)                          -> FAILED_SESSION
else if (item.session_assist_fired || assist_check_occurred_for_item) -> SUPPORTED_SESSION
else                                                                  -> CLEAN_SESSION
```

Only the **first graded attempt of the session** (`attempt_index === 0`) determines the classification. Camp repetitions and rescue attempts do not. A CLEAN_SESSION therefore means: *the item was presented at exactly its target cue level, with no model assistance, and was answered correctly on the first ask.*

**Step 2 — stability update** (§6.4). Skipped for `EXPOSURE_SESSION` (no graded attempt exists).

**Step 3 — across-ladder transition.**

```
MAX = MAX_RUNG_eff(item.tier)              // = MAX_RUNG_BY_TIER[tier] - drift_stage, floored at 0
EXPOSURE_PROMOTE_N     = 3
EXPOSURE_MAX_RUNG_T1   = 2                 // 2 days — the tier-1 frequency floor for exposure items
EXPOSURE_MAX_RUNG_T23  = 4                 // 7 days

CLEAN_SESSION:
    clean_streak += 1
    if (across_rung < MAX && canPromote(item))  across_rung += 1
    exposure_session_streak = 0

SUPPORTED_SESSION:
    clean_streak = 0
    across_rung unchanged
    exposure_session_streak = 0

FAILED_SESSION:
    clean_streak = 0
    across_rung = max(across_rung - 1, MIN_RUNG)     // MIN_RUNG = 0
    exposure_session_streak = 0

EXPOSURE_SESSION:
    exposures_at_3 += 1
    exposure_session_streak += 1
    cap = (tier === 1) ? EXPOSURE_MAX_RUNG_T1 : EXPOSURE_MAX_RUNG_T23
    cap = min(cap, MAX)
    if (exposure_session_streak >= EXPOSURE_PROMOTE_N && across_rung < cap) {
        across_rung += 1
        exposure_session_streak = 0
    }
```

**Step 4 — cue vanish check.**

```
VANISH_N = [—, 2, 2, —];      // indexed by current cue_level_target; 0 has nowhere to go, 3 uses the assist-check

if (cue_level_target === 1 || cue_level_target === 2) {
    if (clean_streak >= VANISH_N[cue_level_target] && canVanish(item)) {
        cue_level_target -= 1
        clean_streak = 0
    }
}
```

**Step 5 — recompute `due_at_ms`** from `across_rung` and `last_seen_at_ms` per §4.2.

**Step 6 — clear within-session scratch.** `in_session = false`, `camp_* = initial`, `session_* = null/false`, `camp_reps = 0`.

### 8.2 Patient-level, after all items

**Step 7 — append the `SessionSummary`** to `session_log` (ring buffer, 40).

**Step 8 — evaluate the drift stage** (§11.1–11.3). If `drift_stage` changed, re-clamp every active item: `across_rung = min(across_rung, MAX_RUNG_eff(tier))` and recompute `due_at_ms`.

**Step 9 — evaluate the acute-change rule** (§11.5). If it fires, append an `acute_change_suspected` output to `state.outputs` (a queue the caregiver surface drains). This is the **only** human-facing output the scheduler produces.

**Step 10 — close `open_session`** (`open_session = null`).

---

## 9. Probe invisibility (requirement 13, §5.2)

Structural, not procedural:

1. `reduce` short-circuits on any event whose `item_id` belongs to a probe item: **it returns `state` unchanged, by reference.** No `ItemState` is ever created for a probe. There is nothing for adaptation, tiering, cue escalation, stability, drift or acute-change to act on because the state does not exist.
2. `selectNext` can never return a probe item — probe items are not in `state.items`, so it is not a filter that can be forgotten, it is an absence.
3. Probe selection lives in a **separate module**, `src/domain/probe.ts`, whose only exported function is

   ```ts
   selectProbe(day_index: number, enrolment_day_index: number,
               probe_set: readonly string[], disabled: boolean): string[] | null
   ```

   It takes no `SchedulerState` parameter. It *cannot* see scheduler state. Selection is a fixed rotation: `offset = (day_index - enrolment_day_index) mod probe_set.length`, returning up to 8 items from `offset` wrapping. When `disabled` (§5.2 point 5) it returns `null`.
4. The probe block is inserted by the **session runtime**, not the scheduler, positioned after the 3rd personal item, ≤8 items, ≤2 minutes.

**The one declared exception, stated because hiding it would be dishonest.** Probe outcomes are visible to exactly two rules, both safety rules:

- the **P1 closer** check (§10.5) — a session that ends on a probe miss must still end on a success, so `ended_on_success` is computed over *all* trials including probes;
- the **distress** rule (§12) — distress during the probe block ends the session and disables the probe for the remainder of the study, logged as an adverse event, not as missing data.

Neither touches any item state or any latent quantity. A blind test can assert this by folding two logs identical but for the probe attempts and asserting deep-equality of `state.items`, `state.drift_stage` and `state.acute_last_emitted_day`.

---

## 10. Queue selection — deterministic, total, tie-free

`selectNext(state, now_ms) → Selection`

```ts
type Selection =
  | { kind: 'item'; item_id: string; reason: 'camp'|'tier1'|'due'|'fill'; presentation: Presentation }
  | { kind: 'generic_filler' }
  | { kind: 'guaranteed_success_closer'; item_id: string }
  | { kind: 'end_session' };
```

### 10.0 Global preconditions, checked before every step

- Items with `status !== 'active'` are excluded, always, everywhere.
- **`selectNext` never returns the item that was just presented.** If the only candidate at any step is `open_session.last_presented_item_id`, that step yields nothing and evaluation falls through. This is what makes requirement 8's "interleaving fills the gap" mechanically true: an item's Camp repetition *cannot* be served back-to-back.
- If `now_ms - open_session.started_at_ms >= session_max_ms` → jump straight to step 5 (closer).

### 10.1 Step 1 — Camp repetitions (time-critical, highest priority)

Candidates: `in_session === true` ∧ `camp_due_at_ms !== null` ∧ `camp_due_at_ms <= now_ms` ∧ `camp_reps < camp_max_reps_per_session` ∧ `item_id !== last_presented_item_id`.

Order: `(camp_due_at_ms ASC, tier ASC, item_id ASC)`. Return the first.

### 10.2 Step 2 — the tier-1 reserved slots (requirement 6, frequency floor)

Applies while `open_session.tier1_presented.length < tier1_min_per_session` (3).

Candidates: `tier === 1` ∧ not yet presented this session ∧ `item_id !== last_presented_item_id`.

Order: `(due_at_ms ASC, last_seen_at_ms ASC NULLS FIRST, item_id ASC)`.

**Due status is not a filter here.** Tier-1 items are selected whether or not they are due — that is requirement 6's *"appears regardless of predicted retrievability"*, and it is the inverted economics: re-showing a well-known face is a successful, pleasant experience, not wasted capacity.

Consequence, stated so it is a design decision and not a surprise: with `N₁` active tier-1 items and 3 slots per session, **every tier-1 item is presented at least once every `ceil(N₁ / 3)` sessions**, because the ordering is least-recently-seen once nothing is due. With the recommended `N₁ ≤ 6` that is every other session. `N₁` is a content-authoring constraint, not a scheduler rule; the scheduler degrades gracefully but the floor weakens linearly as `N₁` grows.

### 10.3 Step 3 — due items

Candidates: not presented this session ∧ `due_at_ms <= now_ms` ∧ `item_id !== last_presented_item_id` ∧ `open_session.distinct_items.length < session_max_items`.

Order: `(tier ASC, due_at_ms ASC, item_id ASC)`.

`due_at_ms ASC` is exactly "most overdue first" and needs no separate overdue computation.

### 10.4 Step 4 — not-due fill (requirement 8, interleaving)

Applies only while `open_session.distinct_items.length < session_max_items` ∧ `now_ms - started_at_ms < session_soft_end_ms` ∧ `fill_count < not_due_fill_max` (4).

Candidates: not presented this session ∧ `item_id !== last_presented_item_id`.

Order: `(tier ASC, last_seen_at_ms ASC NULLS FIRST, item_id ASC)` — least recently seen.

### 10.5 Step 5 — the closer (P1, requirement 12)

Entered when: `distinct_items.length >= session_max_items`, **or** `now_ms - started_at_ms >= session_soft_end_ms` and no Camp repetition is pending, **or** `now_ms - started_at_ms >= session_max_ms`, **or** the runtime signals a user-initiated end.

The session **may not enter the closer** while `tier1_presented.length < min(tier1_min_per_session, count_of_active_tier1_items)` and time remains — step 2 is re-run first. That is what makes the tier-1 floor a floor rather than a preference.

```
if (open_session.last_attempt_correct === 0) {
    // the last thing that happened was a miss that the rescue chain has not yet resolved,
    // or a probe miss. P1 forbids ending here.
    pick the active item maximising (cue_level_target DESC, tier ASC, last_seen_at_ms ASC, item_id ASC)
    return { kind: 'guaranteed_success_closer', item_id }   // presented at cue 3: exposure, no question
}
return { kind: 'end_session' }
```

The guaranteed-success closer is presented at cue level 3 unconditionally — a familiarity exposure of a well-loved face with a relative's voice. It cannot fail because no question is asked. `ended_on_success` is then `true` by construction, and S3 in the success criteria (≥99% of sessions terminate on a success) becomes an audit of the fold rather than of anyone's intent.

### 10.6 Step 6 — generic filler

If every step above yields nothing — typically because a Camp repetition is due in 8 seconds and the only other candidate is the item just presented — return `{ kind: 'generic_filler' }`. The runtime plays an era-and-locale-matched generic item with no correct answer (P11). These are never scheduled, never graded, never appear in `state.items`.

### 10.7 No backlog, no due-count (requirement 12, P6)

- The module exports **no function that returns a count of due items.** There is nothing for a UI to render even by accident.
- `due_at_ms` is recomputed from `last_seen_at_ms`, so missed days never accumulate. An item overdue by ten days is *one* item, appearing once, at the front of step 3's ordering. Ten skipped days and one skipped day produce the same session.
- `skip` events update `consecutive_skips` and nothing else. They do not demote, do not shorten, do not escalate cue.

### 10.8 The session boundary

The generic opener and the generic closer (P11) are the **session runtime's** responsibility, outside this module. `selectNext` returning `end_session` is the signal to play the closer. The scheduler owns the middle of the session and nothing else.

---

## 11. Progression drift and acute change

### 11.1 The signal, and why it is not the obvious one

Requirement 10 says: *"If trailing 14-day success at a fixed cue level falls, the engine globally steps cue support up and intervals down."*

**That literal signal does not work in this design, and the reason is the soft assist.** When the person declines, `S` falls, `p̂` falls, the assist fires, the cue rises, and observed success stays high. The success rate is *stabilised by the very mechanism that is adapting*. A detector reading success would see nothing. The prediction residual `(outcome − p̂)` has the same problem: a well-calibrated model has residual ≈ 0 whether the person is stable or collapsing.

This is a genuine complexity cost that the hybrid imposes and that the pure ladder does not. I am not going to pretend otherwise.

The signal that does work is **the rate of change of the latent itself**: if stabilities across the deck are systematically shrinking, the person is losing ground, regardless of how much cue support is masking it in the success rate.

```
drift_signal = median over contributing items of item.s_delta_ewma

contributing item := status === 'active'
                  ∧ S !== null
                  ∧ graded_presentations >= 3
                  ∧ presented in at least one session in the trailing 14 days
```

**Exact median rule** (a total order is required, or the fold is not deterministic): sort contributing items ascending by `(s_delta_ewma ASC, item_id ASC)`. With `n` items, if `n` is odd take element `(n−1)/2`; if `n` is even take `round6((v[n/2 − 1] + v[n/2]) / 2)`.

Calibration, so the thresholds can be re-derived rather than believed: `(m − 1)` is roughly `+0.05…+0.20` for a clean hit, `+0.02` for a slow hit, and `−0.45` for a miss. An item missing about one first attempt in five has a long-run `s_delta_ewma` near `−0.026`; one in four, near `−0.053`. The thresholds below therefore sit at roughly **"the typical item is missing worse than 1 in 5"** for escalation and **"better than 1 in 6"** for recovery, with the gap providing hysteresis.

### 11.2 Eligibility — fluctuation-awareness (requirement 11)

`drift_stage` may change **only** when all of the following hold at `session_ended`:

```
DRIFT_WINDOW_DAYS        = 14
DRIFT_MIN_SESSIONS       = 5     // qualifying sessions in the window
DRIFT_MIN_DISTINCT_DAYS  = 5     // on at least 5 different days
DRIFT_MIN_ITEMS          = 4     // contributing to the median
DRIFT_DWELL_DAYS         = 7     // minimum days between stage changes

qualifying session := n_graded_first >= 4
```

The `≥5 sessions on ≥5 distinct days` gate is the anti-fluctuation guard: a DLB participant's bad afternoon cannot move the stage, and neither can three bad sessions in one day. The 7-day dwell means the stage can move at most twice in a fortnight. At most **one** step per evaluation.

### 11.3 Transitions and effects

```
DRIFT_UP_THRESHOLD    = -0.04
DRIFT_DOWN_THRESHOLD  = -0.01

if (eligible && drift_signal <= DRIFT_UP_THRESHOLD)    drift_stage = min(drift_stage + 1, 2)
else if (eligible && drift_signal >= DRIFT_DOWN_THRESHOLD) drift_stage = max(drift_stage - 1, 0)
else                                                    unchanged
if (changed) drift_last_change_day = current day index
```

| `drift_stage` | Soft-assist threshold | Interval ceiling | Assist-check |
|---|---|---|---|
| 0 | 0.85 | `MAX_RUNG_BY_TIER` (7 d / 30 d) | permitted |
| 1 | 0.90 | −1 rung (4 d / 14 d) | suppressed |
| 2 | 0.95 | −2 rungs (2 d / 7 d) | suppressed |

On any change, every active item is re-clamped: `across_rung = min(across_rung, MAX_RUNG_eff(tier))`, `due_at_ms` recomputed. **Recovery restores the ceilings**, so the drift term is not a ratchet either.

**Surfaces to nobody (requirement 10, P24).** `drift_stage` appears in exactly one place outside the fold: the research-plane telemetry field `drift_adjustment_applied`. There is no caregiver payload, no clinician payload, no patient-visible effect other than gentler sessions. The module exports no getter for it.

### 11.4 The counter-based fallback (what to ship if the latent is cut)

If the principal cuts the latent, replace §11.1–11.3 with:

```
signal = (first-attempt success rate over qualifying sessions in the trailing 14 days,
          restricted to attempts where presented_cue_level === cue_level_target)
stage up   if signal <= 0.85
stage down if signal >= 0.92
```

with the same eligibility gates, dwell, and effects. It is more legible and it is what requirement 10 literally asks for. It under-detects while the assist is active — but if the latent is cut, the assist is cut, and the problem disappears with it. **This is the honest fallback and it is why the drift term is the first thing I would sacrifice.**

### 11.5 Acute change (P25, requirement 10's carve-out) — deliberately model-free

This is the one output that reaches a human, so it **must not depend on the latent**. A delirium detector whose input is a model that has itself been quietly adapting to the decline it is supposed to detect is not a detector. It reads raw observables only.

```
ACUTE_BASE_WINDOW    = days [today-27, today-7]     ; min 6 qualifying sessions
ACUTE_RECENT_WINDOW  = days [today-2,  today]       ; min 2 qualifying sessions
ACUTE_COOLDOWN_DAYS  = 14

support_index(window) = sum(presented_cue_level over all first presentations) / count   // 0..3
success_rate(window)  = n_graded_first_correct / n_graded_first

fire  if  (support_index(recent) - support_index(base) >= 0.75 && support_index(recent) >= 1.50)
      OR  (success_rate(base) - success_rate(recent)   >= 0.30 && success_rate(recent)  <= 0.60)
```

Both limbs, OR'd. The support-index limb catches the collapse the assist is masking; the success-rate limb catches a collapse severe enough that even the assisted level fails. OR maximises sensitivity, which is the correct bias for a **treatable medical emergency** (P25) where the false-positive cost is one phone call and the false-negative cost is an untreated infection.

Output: a single record on `state.outputs`:

```
{ kind: 'acute_change_suspected', day_index, base_support, recent_support,
  base_success, recent_success, limb: 'support'|'success'|'both' }
```

The caregiver surface renders it in the P25-mandated physical-illness framing and nothing else: *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."* **The scheduler never emits a cognitive interpretation and the payload contains no word that could be read as one.** Rate-limited to once per 14 days per patient. Every firing is followed up per success criterion S7 (≥1 verified true positive and a documented false-positive rate).

---

## 12. Distress, absorbing state, and the precedence order (requirement 14, P18)

### 12.1 The precedence table

When rules conflict, this order is absolute. It is the answer to "what wins".

| # | Rule | Beats everything below |
|---|---|---|
| 1 | `status === 'retired'` — human retirement | item is invisible to every function; no state ever updates |
| 2 | `status === 'absorbed'` — distress | item is invisible to every function; state frozen |
| 3 | **Distress event** — ends the session immediately | including the P1 closer |
| 4 | `session_max_ms` hard cap | including pending Camp repetitions |
| 5 | **P1 guaranteed-success closer** | including "session is over" |
| 6 | Camp repetition due | tier-1 slot, due items, fill |
| 7 | Tier-1 reserved slot | due items, fill |
| 8 | Discrete ladder logic | — |
| 9 | Latent advisory (L1–L4) | may only make 8 more conservative |

**Rule 3 beats rule 5 and that is deliberate.** P18 says distress ends the session *immediately*. Playing a warm closer to someone who has just become distressed is P1 applied where it does harm. The session ends; `session_end_reason = 'distress_stop'`; `ended_on_success = false` and it is *supposed* to be false, because S3's compliance audit must be able to see it.

### 12.2 Distress handling, exact

`distress` event with `item_id` non-null:

```
item.status       = 'absorbed'
item.absorbed_at_ms = at_ms
open_session      = null                      // session ends immediately
session summary appended with reason 'distress_stop', ended_on_success = false
```

`distress` event with `item_id === null` (session-level, e.g. the caregiver's one-tap "stop, this is upsetting"): the item absorbed is the one identified by the greatest `stimulus_paint_ms` among trials in `open_session.trials`; if there are none, no item is absorbed. Session ends identically.

An absorbed item:

- is excluded from every selection step, forever;
- has **all** state frozen: no `S` update, no rung movement, no `due_at_ms` advancement, no contribution to the drift median, no contribution to the acute-change windows;
- returns **only** on an `item_reenabled` event, which only a human can produce.

### 12.3 Re-enablement — the gentlest possible reintroduction

```
on item_reenabled:
  status                 = 'active'
  cue_level_target       = 3                  // exposure only. no question is asked.
  reached_3_by_demotion  = true               // so 20 exposures precede any assist-check
  exposures_at_3         = 0
  across_rung            = 2                  // 2 days — not same-day, not immediately
  clean_streak           = 0
  exposure_session_streak = 0
  S                      unchanged            // the latent has no clinical meaning; there is nothing to punish
  due_at_ms              recomputed from last_seen_at_ms
```

A re-enabled item returns as a photograph and a warm sentence, roughly three weeks before anyone asks a question about it. That is the correct default and a caregiver can always retire it instead.

### 12.4 Repeated skip — deterministic behavioural rule, not an emotion classifier

P18 permits *"deterministic behavioural rules logged as behavioural events, explicitly not as emotion inference."*

```
on skip:  consecutive_skips += 1
          (reset to 0 on any attempt on that item)

if consecutive_skips >= 3 across 3 distinct sessions:
    cue_level_target = 3
    reached_3_by_demotion = true
    exposures_at_3 = 0
    emit output { kind: 'behavioural_event', subtype: 'repeated_skip', item_id }
```

The output is an **action prompt** on the caregiver surface — *"Would you like to set this one aside?"* — with buttons that produce `item_retired` or nothing. It is not a distress inference, it does not absorb the item, and the algorithm does not remove anything (requirements 5 and 15). It is a deterministic count of a patient-initiated control, disclosed to the patient in the patient UI per P23.

---

## 13. The complete constant table

Every number the engine uses, with provenance. **Read the provenance column before defending any of these in a regulatory meeting.**

| Constant | Value | Provenance |
|---|---|---|
| `CAMP_LADDER_S` | `[10,20,40,80,160,320,640]` | Synthesis §6.1, verbatim. Consistent with Camp's published protocol and Tactus clinical guide (10–15 s doubling). |
| `ACROSS_LADDER_DAYS` | `[0,1,2,4,7,14,30]` | Synthesis §6.1 gives `same day,1,2,4,7,14`. The 30-day rung is added so requirement 3's 30-day global ceiling is a live bound rather than dead code. |
| `SAME_DAY_OFFSET_MS` | `10_800_000` (3 h) | **Judgement call.** "Same day" needs a number; 3 h is short enough for a second session before the 16:00 block (P8) and long enough not to be a repeat. |
| `MAX_RUNG_BY_TIER` | `{1:4, 2:6, 3:6}` | Requirement 3: 7 d tier-1, 30 d global. |
| `MIN_RUNG` | `0` | Requirement 9 (contraction) + P3 (never removed). |
| `DECAY` | `0.5` | FSRS-5 published value. Also the only exponent that avoids `Math.pow` (§14). |
| `FACTOR` | `19/81` | Derived from `R(S,S)=0.9`, the DSR convention. |
| `CUE_FLOOR` | `[0.00,0.15,0.50,1.00]` | 0.50 is derived (2-alternative guessing). **0.15 is a judgement call.** 0.00 and 1.00 are definitional. |
| `SLOW_MS` | `[8000,8000,5000,∞]` | **Judgement calls.** No published RT norms for this population at these cue levels exist. |
| `TIMEOUT_MS` | `20000` | **Judgement call.** Must exceed `SLOW_MS[0]` by enough that a slow-but-real answer is never lost. |
| `S_INIT_BY_GRADE` | `{CLEAN:1.000, SLOW:0.600, MISS:0.200}` days | **Judgement calls**, chosen so a first clean hit puts the 95%-interval at ~0.46 d, i.e. "same day". |
| `RUNG_S_INIT_W` | `[1.00,0.80,0.50,—]` | **Judgement calls**, monotone in support. |
| `GAIN_CLEAN` / `MIN_GAIN_CLEAN` | `2.00` / `1.05` | **Judgement calls**, tuned so S≈1 → S≈30 takes ~25–35 clean sessions, matching the ladder's own length. |
| `GAIN_SLOW` / `MIN_GAIN_SLOW` | `0.80` / `1.02` | **Judgement calls.** |
| `SHRINK_MISS` | `0.55` | **Judgement call.** Roughly undoes 4–8 clean successes. |
| `RUNG_W` | `[1.00,0.70,0.40,—]` | **Judgement calls**, monotone in support. |
| `S_MIN` / `S_MAX` | `0.050` / `120.000` days | **Judgement calls**; `S_MAX` is 4× the interval ceiling so the clamp never binds in normal use. |
| `PROMOTE_THRESHOLD` | `0.95` | Requirement 7's ≥95% target, applied prospectively. |
| `SOFT_ASSIST_THRESHOLD_BY_DRIFT` | `[0.85,0.90,0.95]` | **Judgement calls.** The 0.85↔0.95 gap is the operating band; see W2. |
| `VANISH_N` | `[—,2,2,—]` | **Judgement call.** Two clean sessions before a cue is withdrawn. |
| `EXPOSURE_BEFORE_ASSIST_CHECK_FRESH` | `3` | **Judgement call.** P12 answer-first introduction lasts ~3 sessions. |
| `EXPOSURE_BEFORE_ASSIST_CHECK_DEMOTED` | `20` | **Judgement call**, costed at ≤4.8% first-attempt failure on that item (§7.3). |
| `MAX_ASSIST_CHECKS_PER_SESSION` | `1` | **Judgement call.** Bounds manufactured failure to ≤1 per session, deck-wide. |
| `EXPOSURE_PROMOTE_N` | `3` | **Judgement call.** |
| `EXPOSURE_MAX_RUNG_T1` / `_T23` | `2` (2 d) / `4` (7 d) | Requirement 6's tier-1 frequency floor. |
| `EWMA_ALPHA` (`s_delta_ewma`) | `0.3` (retain `0.7`) | **Judgement call.** ~3-session half-life. |
| `DRIFT_UP` / `DRIFT_DOWN` | `-0.04` / `-0.01` | **Judgement calls**, calibrated in §11.1 to ~1-in-5 / 1-in-6 miss rates. |
| `DRIFT_WINDOW_DAYS` | `14` | Requirement 10, verbatim. |
| `DRIFT_MIN_SESSIONS` / `_DISTINCT_DAYS` / `_ITEMS` | `5` / `5` / `4` | **Judgement calls** implementing requirement 11. |
| `DRIFT_DWELL_DAYS` | `7` | **Judgement call** implementing requirement 11. |
| `ACUTE_BASE_WINDOW` / `_RECENT_WINDOW` | `[t-27,t-7]` / `[t-2,t]` | **Judgement calls.** Baseline excludes the recent window to avoid self-contamination. |
| `ACUTE` thresholds | `+0.75 & ≥1.50` support; `−0.30 & ≤0.60` success | **Judgement calls**, biased toward sensitivity per P25. |
| `ACUTE_COOLDOWN_DAYS` | `14` | **Judgement call.** |
| `tier1_min_per_session` | `3` | **Judgement call.** 30% of a 10-item session. |
| `not_due_fill_max` | `4` | **Judgement call.** |
| `camp_max_reps_per_session` | `5` | **Judgement call.** Bounds one item to ≤50% of a session. |
| `session_max_items` / `_max_ms` / `_soft_end_ms` | `10` / `600000` / `480000` | Requirement 12 + P29 (≤10 min, ≤10 items) + `spaced-retrieval` implication 18. |

**Count: 12 constants with any external provenance, 30 that are judgement calls.** That ratio is the honest state of the evidence base and it should appear in any protocol document, not just here.

---

## 14. Determinism: the floating-point contract

ADR §4.4 requires that the server's recomputation from the event log equals the device's local projection. On a tablet that is Hermes or JavaScriptCore; on the server it is V8 under Deno. **This is where a "deterministic fold" quietly stops being deterministic and nobody notices for six months.**

ECMAScript specifies `Math.pow`, `Math.log`, `Math.exp` and the trigonometric functions as *implementation-approximated*: two conforming engines may return values differing in the last bits. IEEE-754 requires `sqrt` to be correctly rounded, and every mainstream engine emits the hardware instruction for it.

Three rules follow, and they shaped the arithmetic above:

1. **`decay` is fixed at exactly 0.5**, so `(1 + F·t/S)^(−0.5)` is `1 / Math.sqrt(1 + F·t/S)`. No `Math.pow`, ever. A trainable decay would be a nicer model and would break the ADR's central sync property; the ADR wins.
2. **`s_delta_ewma` tracks `(m − 1)`, not `ln(m)`.** No `Math.log`, ever. `(m − 1)` is exact arithmetic (`+ − × ÷`, all correctly rounded by IEEE-754) and is monotone in `m`, which is all a threshold test requires.
3. **Every stored float is rounded to 6 decimal places after every update**, with an exact helper:

   ```ts
   const round6 = (x: number) => Math.round(x * 1e6) / 1e6;   // ×, ÷, Math.round: all exact
   const clamp6 = (x, lo, hi) => round6(Math.min(Math.max(x, lo), hi));
   ```

   This truncates any residual last-bit divergence before it can accumulate across a fold of thousands of events. Every comparison (`p >= 0.95`, `signal <= -0.04`) is performed on rounded values.

**The residual risk, stated rather than waved at.** A one-ulp difference in `Math.sqrt` could in principle flip a 6-dp rounding at an exact tie. Mitigation, and it is a CI artifact, not a hope: `src/contract/fixtures/sqrt-conformance.json` contains 256 `(u, expected_sqrt_u)` pairs sampled across the operating range of `1 + F·t/S` (i.e. `[1.0, 200.0]`), asserted in the unit suite, which runs under both `jest-expo` (node) and a Deno task in CI. If any pair ever diverges, the fix is specified in advance: replace `Math.sqrt` with the fixed-iteration Newton–Raphson routine in `src/domain/exact.ts` (5 iterations from a bit-shifted seed, all `+ − × ÷`), which is deterministic by construction. Do not "investigate" a divergence; switch.

---

## 15. What the blind test-writer gets

Frozen into `src/contract/` before either agent starts. This is the whole contract; nothing in this document is implementation detail the test-writer is expected to infer.

| Artifact | Contents |
|---|---|
| `schema.ts` | zod schemas for `SchedulerConfig`, `SchedulerEvent` (discriminated union, exhaustive), `SchedulerState`, `ItemState`, `Selection`, `Presentation`, `Grade`, `SchedulerOutput` |
| `ports.ts` | `Clock`, `Rng` (types only) |
| `fixtures/constants.json` | the entire §13 table as data |
| `fixtures/grade-truth-table.json` | all 4 cue levels × {correct 0/1/null} × {latency below/at/above threshold} × {attempt_index 0/1} → expected `Grade \| null`. 96 rows. |
| `fixtures/ladder-tables.json` | `CAMP_LADDER_S`, `ACROSS_LADDER_DAYS`, `MAX_RUNG_BY_TIER`, `CUE_FLOOR`, `RUNG_W` |
| `fixtures/due-computation.json` | 40 `(last_seen_at_ms, across_rung, tz_offset_minutes) → due_at_ms` rows, including the day-boundary and negative-tz cases |
| `fixtures/golden-trace-margaret.json` | the §16 worked example as an event log plus the expected `ItemState` after every event, to 6 dp |
| `fixtures/selection-order.json` | 24 constructed states → expected `Selection`, covering every step of §10 and every tie-break |
| `fixtures/sqrt-conformance.json` | §14 |
| `fixtures/invariant-m-pairs.json` | 12 event logs, each folded with `model_advisory_enabled` true and false; asserts `due_at_ms(true) <= due_at_ms(false)` and `cue_level_target(true) >= cue_level_target(false)` for every item at every session boundary |
| `fixtures/probe-invisibility.json` | paired logs identical but for probe attempts; asserts deep-equality of `items`, `drift_stage`, `acute_last_emitted_day` |

Properties a blind test-writer can assert from the spec alone, without seeing a line of the implementation:

1. `fold(config, events)` is deterministic and independent of chunking: `fold(c, a.concat(b)) === fold(fold(c,a) as state, b)`.
2. No `across_rung` ever exceeds `MAX_RUNG_BY_TIER[tier]`; no tier-1 interval ever exceeds 7 days; no interval ever exceeds 30 days.
3. `status` becomes `'retired'` only from an `item_retired` event and `'absorbed'` only from a `distress` event. **No sequence of `attempt` events, of any length, at any grades, can change `status`.** (Requirements 5 and 15.)
4. Every rescue chain terminates in a trial with `correct !== 0`, in ≤4 trials.
5. `selectNext` never returns `open_session.last_presented_item_id` as `kind: 'item'`.
6. `selectNext` never returns the same `Selection` twice for the same `(state, now_ms)` without an intervening event.
7. A session whose last attempt had `correct === 0` yields `guaranteed_success_closer` before `end_session`.
8. INVARIANT M holds on every fixture pair.
9. Probe invisibility holds on every fixture pair.
10. `drift_stage` changes at most once per `DRIFT_DWELL_DAYS`, and never from a log with fewer than 5 qualifying sessions on 5 distinct days.
11. The module exports no function returning a count of due items, and `SchedulerOutput` has exactly two variants: `acute_change_suspected` and `behavioural_event`.

---

## 16. Worked example — one item, three sessions, every number

Item `it-margaret` (photograph of the patient's daughter + her recorded voice saying her name), `tier = 1`, `is_probe = false`.
`tz_offset_minutes = 0`, so day `d` begins at `d × 86_400_000` ms. Day 0 is enrolment day.
`model_advisory_enabled = true`, `drift_stage = 0` throughout.

**Entry state at the start of Session A** (the item has been in the deck for six days; earlier sessions are not shown):

```
cue_level_target   = 1            across_rung        = 1   (1 day)
S                  = 2.400000     s_delta_ewma       = 0.040000
clean_streak       = 1            camp_start_rung    = 0
last_seen_at_ms    = 468_180_000  (day 5, 10:03:00)
last_graded_at_ms  = 468_180_000
due_at_ms          = 604_800_000  (dayIndex(468_180_000)=5, +1 day → day 6 → 6×86_400_000)
graded_presentations = 6          lapse_count = 0        status = 'active'
```

---

### Session A — day 6, 10:00:00 (`session_started` at 554_400_000)

**Selection.** Step 1: no Camp repetitions (nothing in session). Step 2: tier-1 slots 0/3 filled, `it-margaret` is a candidate, ordering `(due_at_ms ASC …)` puts it first. → `reason: 'tier1'`.

**`resolvePresentation` at paint `554_520_000`:**

```
c            = 1  (not 3, so soft assist path)
elapsed_days = (554_520_000 - 468_180_000) / 86_400_000 = 86_340_000 / 86_400_000 = 0.999306
r_hat        = 1 / sqrt(1 + 0.234568 × 0.999306 / 2.400000)
             = 1 / sqrt(1 + 0.234405 / 2.400000)
             = 1 / sqrt(1.097669) = 1 / 1.047697 = 0.954474
p_hat        = 0.15 + 0.85 × 0.954474 = 0.961303
0.961303 >= 0.85  →  NO ASSIST.  presented_cue_level = 1.  camp_rung = 0.
```

**Trial A0** — `attempt_index 0`, paint `554_520_000`, response `554_524_100`, `correct = 1`, `latency_ms = 4100`.
`gradeAttempt`: cue 1 ≠ 3; correct; attempt_index 0; `4100 > SLOW_MS[1] = 8000`? no → **CLEAN_HIT (3)**.
Camp: `gap = CAMP_LADDER_S[0] = 10 s`; `camp_best_rung = 0`; `camp_due_at_ms = 554_534_100`; `camp_rung = 1`; `camp_reps = 1`.
Recorded: `session_first_grade = CLEAN_HIT`, `session_first_r_obs = 0.954474`, `session_assist_fired = false`.

*(Two other items are presented in between; `selectNext` cannot return `it-margaret` back-to-back.)*

**Trial A1** — paint `554_535_000` (≥ `camp_due_at_ms`), cue 1 (inherited), response `554_538_400`, `correct = 1`, `latency 3400` → **CLEAN_HIT**.
Camp: `gap = CAMP_LADDER_S[1] = 20 s`; `camp_best_rung = 1`; `camp_due_at_ms = 554_558_400`; `camp_rung = 2`; `camp_reps = 2`.

**Trial A2** — paint `554_559_000`, cue 1, response `554_564_900`, `correct = 1`, `latency 5900` → **CLEAN_HIT** (5900 ≤ 8000).
Camp: `gap = CAMP_LADDER_S[2] = 40 s`; `camp_best_rung = 2`; `camp_due_at_ms = 554_604_900`; `camp_rung = 3`; `camp_reps = 3`.

Observed within-session gaps: **10 s, 20 s, 40 s** — the Camp ladder, exactly.

**`session_ended` at `554_595_000`** (10 distinct items reached, before `camp_due_at_ms`).

**End-of-session pipeline for `it-margaret`:**

*Step 1 — classify.* `cue_level_target ≠ 3`; `session_first_grade = CLEAN_HIT ≠ MISS`; `session_assist_fired = false`; no assist-check → **CLEAN_SESSION**.

*Step 2 — stability.*
```
r_obs = 0.954474  (as computed at presentation)
m     = max( 1 + 2.00 × (1 - 0.954474) × RUNG_W[1]=0.70, 1.05 )
      = max( 1 + 2.00 × 0.045526 × 0.70, 1.05 ) = max(1.063736, 1.05) = 1.063736
S     = clamp6(2.400000 × 1.063736) = 2.552966
s_delta_ewma = round6(0.7 × 0.040000 + 0.3 × 0.063736) = round6(0.028000 + 0.019121) = 0.047121
```

*Step 3 — across ladder.* CLEAN_SESSION → `clean_streak = 2`. `across_rung = 1 < MAX_RUNG_eff(1) = 4`, so try to promote.
```
canPromote:  t_next = ACROSS_LADDER_DAYS[2] = 2 days
             r_next = 1 / sqrt(1 + 0.234568 × 2 / 2.552966) = 1 / sqrt(1.183761)
                    = 1 / 1.088008 = 0.919107
             p_next = 0.15 + 0.85 × 0.919107 = 0.931241
             0.931241 >= 0.95 ?  NO  →  ***VETOED***
across_rung stays 1.
```

*Step 4 — vanish.* `cue_level_target = 1`, `clean_streak = 2 >= VANISH_N[1] = 2`.
```
canVanish:   t_now = ACROSS_LADDER_DAYS[1] = 1 day
             r     = 1 / sqrt(1 + 0.234568 / 2.552966) = 1 / sqrt(1.091881)
                   = 1 / 1.044931 = 0.957001
             p     = CUE_FLOOR[0]=0.00 + 1.00 × 0.957001 = 0.957001
             0.957001 >= 0.95 ?  YES  →  ***PASS***
cue_level_target = 0.  clean_streak = 0.
```

*Step 5 — due.* `last_seen_at_ms = 554_564_900`; `dayIndex = 6`; `across_rung = 1` → `due_day = 7` → `due_at_ms = 604_800_000`. `last_graded_at_ms = 554_564_900`.

**Session A outcome in one line: the item got harder (cue 1 → 0) but not longer (interval held at 1 day, promotion vetoed).** That is the design thesis working — difficulty is carried by the cue, and the model braked the interval because it did not yet believe 2 days would hold.

**State after A:** `cue_level_target 0 · across_rung 1 · S 2.552966 · s_delta_ewma 0.047121 · clean_streak 0 · lapse_count 0 · due_at_ms 604_800_000`

---

### Session B — day 7, 10:00:00 (`session_started` at 640_800_000)

Item due (`604_800_000 ≤ 640_800_000`). Selected at step 2 (tier-1 slot).

**`resolvePresentation` at paint `640_802_000`:**
```
c            = 0
elapsed_days = (640_802_000 - 554_564_900)/86_400_000 = 86_237_100/86_400_000 = 0.998115
r_hat        = 1 / sqrt(1 + 0.234568 × 0.998115 / 2.552966) = 1 / sqrt(1.091708)
             = 1 / 1.044848 = 0.957077
p_hat        = CUE_FLOOR[0] + 1.00 × 0.957077 = 0.957077
0.957077 >= 0.85  →  NO ASSIST.  presented_cue_level = 0.
```

**Trial B0** — `attempt_index 0`, paint `640_802_000`, response `640_805_500`, `correct = 0`, `latency 3500` → **MISS (0)**.

**Rescue chain, immediately:** the answer is given, warmly ("That's Margaret, your daughter"), then re-presented at `min(0+1,3) = 1`.
**Trial B1** — `attempt_index 1`, paint `640_810_000`, response `640_813_000`, `correct = 1`, `latency 3000` → **RESCUED (1)**. `rescued_to_success = true`. Chain length 2.

State effects of the miss:
```
cue_level_target = min(0 + 1, 3) = 1       (session_cue_escalated = true; at most once this session)
clean_streak     = 0
lapse_count      = 1                        (logged; consumed by nothing)
Camp (onWithinSessionMissResolved at 640_813_000):
    camp_best_rung = -1  →  camp_rung = camp_start_rung = 0
    gap = CAMP_LADDER_S[0] = 10 s  →  camp_due_at_ms = 640_823_000;  camp_reps = 1
```

**Trial B2** — paint `640_824_000`, cue 1 (escalated), response `640_827_000`, `latency 3000`, `correct 1` → **CLEAN_HIT**.
Camp: `gap = CAMP_LADDER_S[0] = 10 s`; `camp_best_rung = 0`; `camp_due_at_ms = 640_837_000`; `camp_rung = 1`; `camp_reps = 2`.

**Trial B3** — paint `640_838_000`, cue 1, response `640_841_300`, `latency 3300`, `correct 1` → **CLEAN_HIT**.
Camp: `gap = CAMP_LADDER_S[1] = 20 s`; `camp_best_rung = 1`; `camp_due_at_ms = 640_861_300`; `camp_rung = 2`; `camp_reps = 3`.

**`session_ended` at `640_850_000`.** `open_session.last_attempt_correct = 1` → no guaranteed-success closer needed; `ended_on_success = true`.

**End-of-session pipeline:**

*Step 1.* `session_first_grade = MISS` → **FAILED_SESSION**.

*Step 2 — stability.* `r_obs = 0.957077`, grade MISS → `m = SHRINK_MISS = 0.55`.
```
S            = clamp6(2.552966 × 0.55) = 1.404131
s_delta_ewma = round6(0.7 × 0.047121 + 0.3 × (0.55 - 1)) = round6(0.032985 - 0.135000) = -0.102015
```

*Step 3 — across ladder.* FAILED_SESSION → `across_rung = max(1 - 1, 0) = 0` (same day). `clean_streak = 0`.

*Step 4 — vanish.* `cue_level_target = 1`, `clean_streak = 0 < 2` → no vanish.

*Step 5 — due.* `across_rung = 0` → `due_at_ms = 640_841_300 + 10_800_000 = 651_641_300` (day 7, 13:00:41.300).

**State after B:** `cue_level_target 1 · across_rung 0 · S 1.404131 · s_delta_ewma -0.102015 · clean_streak 0 · lapse_count 1 · due_at_ms 651_641_300`

Requirements 4, 5 and 9 all visible in one session: cue support was added (0 → 1), the interval contracted (1 d → same day), and nothing was removed, suspended or flagged.

---

### Session C — day 7, 14:30:00 (`session_started` at 657_000_000)

A second session the same day, started before the 16:00 block (P8). Item due (`651_641_300 ≤ 657_000_000`).

**`resolvePresentation` at paint `657_002_000`:**
```
c            = 1
elapsed_days = (657_002_000 - 640_841_300)/86_400_000 = 16_160_700/86_400_000 = 0.187045
r_hat        = 1 / sqrt(1 + 0.234568 × 0.187045 / 1.404131) = 1 / sqrt(1.031246)
             = 1 / 1.015503 = 0.984735
p_hat        = 0.15 + 0.85 × 0.984735 = 0.987025
0.987025 >= 0.85  →  NO ASSIST.  presented_cue_level = 1.
```

**Trial C0** — paint `657_002_000`, response `657_011_200`, `correct = 1`, `latency 9200`.
`9200 > SLOW_MS[1] = 8000` → **SLOW_HIT (2)**. *A correct answer. The ladder treats it as a clean session; only the stability gain is reduced.*
Camp: `gap = 10 s`; `camp_best_rung = 0`; `camp_due_at_ms = 657_021_200`; `camp_rung = 1`; `camp_reps = 1`.

**Trial C1** — paint `657_022_000`, response `657_026_000`, `latency 4000`, `correct 1` → **CLEAN_HIT**.
Camp: `gap = 20 s`; `camp_best_rung = 1`; `camp_due_at_ms = 657_046_000`; `camp_rung = 2`; `camp_reps = 2`.

**Trial C2** — paint `657_047_000`, response `657_050_600`, `latency 3600`, `correct 1` → **CLEAN_HIT**.
Camp: `gap = 40 s`; `camp_best_rung = 2`; `camp_due_at_ms = 657_090_600`; `camp_rung = 3`; `camp_reps = 3`.

**`session_ended` at `657_060_000`.**

**End-of-session pipeline:**

*Step 1.* First grade SLOW_HIT (not MISS), no assist, no assist-check → **CLEAN_SESSION**.

*Step 2 — stability.* `r_obs = 0.984735`, SLOW_HIT, cue 1 → `RUNG_W[1] = 0.70`.
```
m            = max( 1 + 0.80 × (1 - 0.984735) × 0.70, MIN_GAIN_SLOW = 1.02 )
             = max( 1 + 0.008548, 1.02 ) = 1.020000       ← the floor binds
S            = clamp6(1.404131 × 1.020000) = 1.432214
s_delta_ewma = round6(0.7 × (-0.102015) + 0.3 × 0.020000) = round6(-0.071411 + 0.006000) = -0.065411
```

*Step 3 — across ladder.* CLEAN_SESSION → `clean_streak = 1`. `across_rung = 0 < 4`, try to promote.
```
canPromote:  t_next = ACROSS_LADDER_DAYS[1] = 1 day
             r_next = 1 / sqrt(1 + 0.234568 / 1.432214) = 1 / sqrt(1.163781)
                    = 1 / 1.078787 = 0.926968
             p_next = 0.15 + 0.85 × 0.926968 = 0.937923
             0.937923 >= 0.95 ?  NO  →  ***VETOED***
across_rung stays 0.
```
*A pure ladder would have promoted here: one clean session after a lapse, back to 1 day. The latent held it at same-day for one more cycle. That is the entire behavioural difference the hybrid buys, and it is one rung, in the safe direction.*

*Step 4 — vanish.* `clean_streak = 1 < VANISH_N[1] = 2` → no vanish.

*Step 5 — due.* `across_rung = 0` → `due_at_ms = 657_050_600 + 10_800_000 = 667_850_600` (day 7, 17:30:50.600). Past the 16:00 prompt block, so no third session today; the item is simply the first due item tomorrow morning. **No backlog is created, no counter increments, nothing is displayed.**

**State after C:** `cue_level_target 1 · across_rung 0 · S 1.432214 · s_delta_ewma -0.065411 · clean_streak 1 · lapse_count 1 · due_at_ms 667_850_600`

---

### Supplementary trace — Session D, day 11: the soft assist firing

The family skips days 8, 9 and 10 (P6: no consequence, no message, no catch-up). Session D starts day 11 at 10:00 (`986_400_000`).

```
elapsed_days = (986_402_000 - 657_050_600)/86_400_000 = 329_351_400/86_400_000 = 3.811937
r_hat        = 1 / sqrt(1 + 0.234568 × 3.811937 / 1.432214) = 1 / sqrt(1.624303)
             = 1 / 1.274481 = 0.784633
p_hat        = 0.15 + 0.85 × 0.784633 = 0.816938
0.816938 < 0.85  →  ***SOFT ASSIST FIRES***  →  presented_cue_level = 2  (two-alternative)
cue_level_target is UNCHANGED at 1.  soft_assist_applied = true.
```

**Trial D0** — cue 2, `correct 1`, `latency 4200` (`4200 ≤ SLOW_MS[2] = 5000`) → **CLEAN_HIT**.
```
m            = max( 1 + 2.00 × (1 - 0.784633) × RUNG_W[2]=0.40, 1.05 )
             = max( 1 + 0.172294, 1.05 ) = 1.172294
S            = clamp6(1.432214 × 1.172294) = 1.679177
s_delta_ewma = round6(0.7 × (-0.065411) + 0.3 × 0.172294) = round6(-0.045788 + 0.051688) = 0.005900
```
*The DSR spacing law at work: a success after a long gap is worth far more than a success after three hours.*

*Step 1.* `session_assist_fired = true` → **SUPPORTED_SESSION**.
*Step 3.* `clean_streak = 0`; `across_rung` unchanged at 0.
*Step 4.* no vanish.

**This is the mechanism the entire hybrid exists for.** After a four-day gap the pure ladder would have asked a partial-cue question with a modelled ~82% chance of success, and would have learned that the gap was too long by producing a miss on a photograph of the person's daughter. The hybrid spent a rung of cue support instead, the person succeeded, the trial was pleasant, `S` rose sharply *because* the gap was long, and the ladder is unchanged and unpolluted. No failure was manufactured and no clinical state was altered by a model.

---

## 17. Compliance against the seventeen binding requirements (synthesis §6)

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Two timescales, one item; Camp `10…640 s` personalisable start; across-session `same day…14 d` | **Met** | §4.1, §4.2. `camp_start_rung_default` + per-item override. Ladder extended by a 30-day rung so requirement 3's global ceiling is a live bound. |
| 2 | Objective grading from `correct × cue_level × latency_ms × attempt_index` only; no self-report | **Met, structurally** | §5. The `SchedulerEvent` union contains no event that can carry a self-assessment — P4 is unrepresentable, not merely forbidden. |
| 3 | Ceilings: 30 d global, 7 d tier-1 | **Met** | §4.2. `MAX_RUNG_BY_TIER = {1:4, 2:6, 3:6}` plus a runtime assertion and a fixture. |
| 4 | Failure adds cue support, not interval change | **Met with a declared deviation — see §18.1** | §7.2. Primary response is immediate cue support at trial level. Interval also contracts one rung at session level, which requirement 9 demands. |
| 5 | No automatic removal — no leech, suspend, auto-delete | **Met, structurally** | §7.2, §12. `lapse_count` has one write site and zero read sites. `status` transitions only from human events. Asserted as blind property 3. |
| 6 | Tiering with inverted economics: tier-1 frequency floor + interval ceiling, appears regardless of retrievability | **Met** | §10.2 (3 reserved slots, due status not a filter), §4.2 (7-day ceiling), §8.1 (`EXPOSURE_MAX_RUNG_T1 = 2`). |
| 7 | Target ≥95% success on the exercise as presented, via cue support | **Targeted, not guaranteed — see §18.2** | §6.6, §6.7. What *is* guaranteed: 100% of trial chains terminate in a success (§7.2). |
| 8 | Interleaving fills the gap | **Met, structurally** | §10.0 — `selectNext` can never return the last-presented item, so a Camp repetition is always separated by other content or a generic filler. |
| 9 | Intervals must contract, not only expand | **Met, three ways** | §8.1 (FAILED_SESSION → −1 rung), §6.7 (promotion veto), §11.3 (drift ceiling reduction + re-clamp). |
| 10 | Progression-drift term exists, surfaces to nobody in v1 | **Met** | §11.1–11.3. `drift_stage` has no getter, no caregiver payload, no clinician payload. Only research-plane `drift_adjustment_applied`. The only human-facing output is the P25 acute-change record (§11.5), in physical-illness framing. |
| 11 | Fluctuation-aware; persistence across sessions; not one bad day | **Met, four guards** | Cue escalation ≤ +1 per session (§7.2); drift eligibility ≥5 sessions on ≥5 distinct days over ≥4 items (§11.2); 7-day dwell; ≤1 stage step per evaluation. |
| 12 | Session capped by time and item count, ends on a success, no due-count, no backlog, no skip consequence | **Met** | §10.5 (P1 closer), §10.7 (no count function exported; `due_at_ms` recomputed from `last_seen_at_ms`, so nothing accumulates), §12.4 (skip is a behavioural event, not a penalty). |
| 13 | Probe set invisible to the scheduler | **Met, structurally, with one declared exception** | §9. No `ItemState` exists for probes; `selectProbe` is in a separate module with no state parameter. Exception: probe outcomes reach the P1 closer check and the distress rule, and nothing else. |
| 14 | Distress is an absorbing state stronger than any interval logic | **Met** | §12.1 precedence table — distress is rank 3, above the P1 closer, above all ladder logic. Return requires a human event. |
| 15 | Nothing dropped on a caregiver's behalf | **Met** | §12.4. The repeated-skip rule emits an *action prompt* to a human; the algorithm removes nothing. |
| 16 | Log rich per-attempt telemetry so a DSR/FSRS model can be fitted retrospectively | **Met — and note it does not require the latent** | §3. Every `attempt` carries `presented_cue_level, correct, latency_ms, attempt_index, r_hat, p_hat, soft_assist_applied`; every session emits `S` before/after, `m`, veto outcomes, `drift_stage`. **The raw attempt tuples alone are sufficient to fit any model offline. This requirement is satisfied by logging, not by the hybrid.** |
| 17 | Licensing: no AGPL Anki code; SM-2 re-implemented from the published description; prefer BSD-3/MIT for FSRS components | **Met** | Zero vendored code. `decay = 0.5` and `factor = 19/81` are re-derived here from the published DSR convention `R(S,S) = 0.9`; the algebra is in §6.1. No SuperMemo or Anki source, names or marks. |

---

## 18. The two places I am not claiming full compliance

### 18.1 Requirement 4 and requirement 9 are in genuine tension, and I adjudicated

Requirement 4 (via P2) says *"On any miss, add cue support and re-present at the same interval; do not primarily shorten or lengthen time."* Requirement 9 says *"Intervals must be able to contract."* A miss is the single strongest evidence that an interval is too long, and it is the only evidence a pure ladder ever gets. Reading requirement 4 absolutely would mean intervals contract only when the drift term fires — a patient-level, 14-day-lagged, 5-session-gated mechanism — which is far too slow to satisfy requirement 9's stated purpose ("guaranteeing an accelerating failure rate" is what it exists to prevent).

**Adjudication, and the reasoning:**

- The **primary, immediate** response to a miss is cue support: the answer is supplied within ~2 seconds and the item is re-presented one rung easier. That is what the patient experiences. Requirement 4's clinical intent — *the person's experience of failure is answered with help, not with a schedule change they cannot perceive* — is fully honoured.
- The **secondary, invisible** response is a one-rung interval contraction at session end, floored at same-day, never below. It is bounded (one rung per session), it is in the safe direction only, and it is imperceptible to the patient.
- P2's own wording is *"do not **primarily** shorten or lengthen time"* — the qualifier is in the source text and it is what I am relying on.

If the principal disagrees, the change is one line in §8.1 (`FAILED_SESSION: across_rung unchanged`) and requirement 9 then rests entirely on the promotion veto (§6.7) — which is, notably, a mechanism only the hybrid has. **On that reading the hybrid becomes not merely justified but necessary**, because a pure ladder that may not contract on failure has no contraction mechanism at all.

### 18.2 The ≥95% target is steered, not guaranteed

Requirement 7 asks for ≥95% success on the exercise as presented, and flags honestly that the number is a judgement call with no dose-response derivation.

**The exact metric this design steers**, stated so it is auditable rather than rhetorical:

```
first_attempt_success_rate
  = count( attempt_index === 0 ∧ presented_cue_level < 3 ∧ correct === 1 )
  ÷ count( attempt_index === 0 ∧ presented_cue_level < 3 )
```

Exposures are excluded from both numerator and denominator: no question is asked, so there is nothing to succeed or fail at. Probe items are excluded (they are a separate, deliberately harder instrument, §5.2).

**What is guaranteed:** every trial chain terminates in a success in ≤4 trials (§7.2), and every session terminates on a success or a warm answerable prompt (§10.5). Those are structural and testable.

**What is not guaranteed:** the ≥95% number itself. Four mechanisms steer toward it — the soft assist, the promotion veto, the cue escalation on miss, and the drift term — and one mechanism steers away from it: the assist-check (§7.3), costed at ≤4.8% on a single demoted item and ≤1 manufactured failure per session deck-wide. **Whether the design lands at 95% is an empirical question the pilot answers, not a property the specification confers.** Any protocol document should say exactly that.

---

## 19. Weaknesses

Ranked roughly by how likely each is to matter.

**W1 — 30 of 42 constants are judgement calls with no external provenance.** §13's provenance column says so explicitly. Only the two interval ladders, the four ceilings, `decay`, `factor`, the 0.50 guessing floor, the 14-day drift window and the session caps have any external basis, and the ladders come from studies with n = 6–12 and the DSR constants come from ~10,000 self-selected cognitively healthy Anki users. **The latent is a plausible functional form with invented coefficients.** Its numeric outputs must never be reported to anyone as probabilities.

**W2 — the design is behaviourally sensitive to the 0.85 / 0.95 operating band, and both numbers are invented.** If the band is too narrow, the assist fires on almost every trial, no session is ever CLEAN, the ladder never climbs, every item sits at same-day, and a 10-item session becomes a 3-item session repeated. If it is too wide, the assist rarely fires and the hybrid degenerates to the pure ladder with extra code. There is no evidence to set either number and the pilot must instrument the distribution of `p̂` at presentation from day one so it can be re-tuned.

**W3 — latent self-cancellation forced a less legible drift signal.** The soft assist stabilises observed success, so requirement 10's literal detector ("trailing 14-day success at a fixed cue level") stops working, and I had to substitute `median(s_delta_ewma)` — a quantity no clinician will ever find intuitive. This is a complexity cost the hybrid imposes on itself. §11.4 documents the fallback.

**W4 — deleting the latent entirely still satisfies 16 of 17 requirements.** Only requirement 7 is materially better served by it, and even that is a modelling argument rather than a measured one. Anyone applying LESS IS MORE strictly has a defensible case for the pure ladder, and I would not call them wrong. The counter-argument is in §0 and in §18.1, and it is not overwhelming.

**W5 — cue-level ratcheting under fluctuation is bounded but not eliminated.** `cue_level_target` rises at most +1 per session but falls only via two consecutive CLEAN_SESSIONs. A DLB-band participant with roughly alternating good and bad sessions never accumulates two consecutive clean sessions and will ratchet toward exposure-only on items they can genuinely do about half the time. The 20-exposure assist-check is the only escape and it takes ~3 weeks. This is the single most likely way the design harms a real participant, and it is a direct consequence of `VANISH_N = 2`, which is invented.

**W6 — the latent will absorb confounds and mislabel them as item stability.** `S` is a per-item quantity but the observations feeding it are contaminated by time of day (P8: ~10% associative-memory penalty in the evening), fatigue, session ordinal, caregiver presence (a hard confound the telemetry spec captures per interaction) and medication. The engine models none of these. An item that happens to be scheduled late in sessions will acquire a systematically lower `S` than an identical item scheduled early.

**W7 — float determinism across Hermes / JSC / V8 is asserted, not yet proved.** §14's argument is sound and the mitigations are specified in advance, but until `sqrt-conformance.json` has actually run green on both runtimes in CI, the ADR §4.4 property "the server recomputes byte-identically" is a design intention. This should be the first test written, not the last.

**W8 — the device's local projection can transiently disagree with the server's canonical fold.** Canonical order is `(t_anchor_ms, device_id, seq)`, but `t_anchor_ms` is the *server-anchored* timestamp produced by the per-batch skew correction (ADR §4.3), and a device that has been offline for three days is ordering by its own drifted wall clock. For a single-device patient this is harmless (relative order within one device is preserved by `seq`). For a patient with two tablets running offline sessions on the same day, the device projection may order interleaved events differently from the server until both have synced. The states re-converge after sync; the transient divergence is real and should be measured in the physical-device run.

**W9 — the interleaving guarantee degrades below 6 items.** Requirement 8 says interleaving is "free" with 6–10 items. With a 3-item deck, the Camp ladder past 40 s cannot be filled by other personal items and falls through to generic filler. Generic filler is not equivalent to the clinically prescribed "unrelated conversation or activity", and P29 permits a deck as small as 10 items of which 3 may be tier-1 exposures. The design does not fail, but the clinical fidelity of the filled interval does.

**W10 — no evidence supports the specific structural rules.** `VANISH_N = 2`, `EXPOSURE_BEFORE_ASSIST_CHECK_DEMOTED = 20`, `tier1_min_per_session = 3`, `EXPOSURE_PROMOTE_N = 3`, `camp_max_reps_per_session = 5` are all inventions. They are internally coherent and each has a stated rationale, but none is derived from anything.

**W11 — the acute-change detector's false-positive rate is unknown and it is the one output that reaches a human.** Success criterion S7 requires a documented false-positive rate; the thresholds (`+0.75` support index, `−0.30` success) were chosen for sensitivity with no data. A detector that cries wolf at a carer with ~49% median burden prevalence is a harm, not a safety feature. This needs a pilot-stage kill switch.

**W12 — the tier-1 frequency floor weakens linearly with tier-1 deck size.** With 3 reserved slots, every tier-1 item is seen at least once every `ceil(N₁/3)` sessions. At `N₁ = 12` that is once every 4 sessions, which at real-world adherence (iCST: 40% managed ≥2/week) is once every two to three weeks — well outside the 7-day interval ceiling the tier is supposed to guarantee. The ceiling is enforced on `due_at_ms`; **the floor is not enforced on actual presentation, because sessions the family does not run cannot present anything.** No scheduler can fix that, but the design should not be described as guaranteeing a 7-day tier-1 cadence when adherence, not the algorithm, is the binding constraint.
