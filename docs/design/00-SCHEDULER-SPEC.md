# 00 — SCHEDULER SPECIFICATION (THE CONTRACT)

**Status:** FROZEN. This document is the sole contract between the blind test-writer and the blind implementer. Neither sees the other's output. Both see only this file, `src/contract/**`, and the ADR.
**Module:** `src/domain/scheduler/` — pure TypeScript. No `react`, `react-native`, `expo-*`, `@supabase/*`. `no-restricted-globals`: `Date`, `Math.random`, `crypto`, `fetch`, `window`, `document`.
**Supersedes:** `scheduler-design-pure-camp.md`, `scheduler-design-memory-model.md`, `scheduler-design-hybrid-ladder.md`. Where any of those three disagrees with this document, this document wins. Their worked examples are **void** and must not be transcribed into fixtures.

---

## 0. The decision, and what was taken from where

**Chosen: the pure Camp ladder** — two bounded integer ladders and a negative-feedback loop. No continuous memory model, no floating-point arithmetic, no fitted parameters.

**Why.** Synthesis §5.1 demotes the scheduler explicitly: spaced retrieval "helps people learn but not demonstrably more than other structured learning techniques", and the differentiator is the content pipeline and the consent architecture. The expanding *shape* is graded (c/d); the *adjustment* is graded (b). A scheduler must therefore **react** to the person, not **predict** the person. A DSR/FSRS-style latent exists to answer "when does recall probability cross the target?" — the question requirement 7 and NEVER-DO #10 forbid. `hybrid-ladder` concedes both load-bearing points itself: requirement 16 "is satisfied entirely by telemetry; the runtime latent adds nothing to the research asset" (W-thesis §1), and "deleting the latent entirely still satisfies 16 of 17 requirements" (W4). Its own cut-order terminates in "this IS the pure ladder."

**The operative constraint is the blind-agent contract, not elegance.** Integer-only arithmetic makes ADR §4.4's "the server recomputes byte-identically" a structural property rather than a CI hope; `memory-model` must pin `decay = 0.5` to avoid `Math.pow`, still leaves `Math.exp` as a cross-engine risk, and admits the mitigation is "recorded but not built." Every additional line of specification surface is a place two blind agents diverge, and both continuous designs carry a fatal spec/worked-example contradiction on their single most consequential transition (the escape from cue level 3) — which corrupts the golden-log fixture, the highest-value artefact in the whole process.

**Three things were taken from the rejected designs, each because an attack forced it, none of them a model:**

| Borrowed | From | Forced by | Cost |
|---|---|---|---|
| Cue-level-3 items are presented **once** per session with no within-session loop | both | *"56 exposures in one session"* / *"18 wrong answers per session at CAMP_CUE_MAX"* | Removes a rule. Strictly simpler. |
| An **elapsed-aware gentleness transform** (`overdueReturn`) | hybrid's soft assist, reduced to one integer comparison | *"Nothing in the presentation path is elapsed-aware… first session home from hospital opens with 'Who is this?'"* | One constant (`OVERDUE_RETURN_MULTIPLIER`), one comparison. **No latent, no float, no probability.** |
| A **`SUPPORTED_SESSION`** outcome | hybrid | *"cue ratcheting under DLB alternation is a one-way trip"* | One enum member. Replaces nothing; closes the ratchet. |

Against LESS IS MORE: each of the three **removes** a failure mode that the pilot's Tier-1 safety criteria (S1–S4) would otherwise measure as a serious incident, and the second and third together cost one integer constant and one enum member. No mechanism was borrowed for capability.

Everything else in this document is repair of the chosen design against the attack findings, not synthesis.

---

## 1. Notation, arithmetic, and the three kinds of time

### 1.1 Arithmetic discipline

- **There is no floating-point arithmetic anywhere in this module.** No `/` yielding a non-integer, no `Math.pow`, `Math.exp`, `Math.log`, `Math.sqrt`. Every division is written `Math.floor(a / b)` over integers, or `Math.floor((a * b) / c)` where the multiplication is stated to be safe.
- All products in this document are bounded by `2^40`; no intermediate exceeds `Number.MAX_SAFE_INTEGER`.
- `clamp(x, lo, hi) = Math.min(Math.max(x, lo), hi)`.
- `Math.floor` is used for all flooring, including of negative operands (relevant only to `localDayIndex` for pre-1970 anchors, which cannot occur but is defined anyway).
- Every counter is clamped to `[0, COUNTER_MAX = 255]` unless a wider bound is stated. `repetitionNumber` and `sessionCount` clamp to `[0, 2147483647]`.
- **Every numeric field of `SchedulerState` satisfies `Number.isInteger` after every fold step.** This is invariant I-1 and is property-testable.

### 1.2 Comparators — exact, and the only ones permitted

```ts
// numbers ascending
const numAsc = (a: number, b: number) => (a < b ? -1 : a > b ? 1 : 0);
// strings ascending by UTF-16 code unit — JavaScript's default `<` on strings
const strAsc = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
// lexicographic tuple: compare element 0, then 1, … Numbers with numAsc, strings with strAsc.
```

Every ordering in this document is a **tuple whose final element is `itemId`** (or `sessionId`, or `deviceId`+`seq`), all of which are unique. **Every ordering is therefore a strict total order and every ordered query is single-valued.** There are no ties to break. `Array.prototype.sort` stability is never relied upon.

### 1.3 The three kinds of time — never interchangeable

| Name | Type | Source | Used for | Never used for |
|---|---|---|---|---|
| `anchorMs` | integer epoch ms | ADR §4.3 server-anchored timestamp. Before sync, the adapter supplies `t_wall_ms` corrected by the last known server skew. | Everything across sessions: `lastSeenAtMs`, `dueAtMs`, `addedAtMs`, drift windows, acute windows, `localDayIndex`, and the canonical fold order. | Within-session timing. Latency. |
| `monoMs` | integer ms | `performance.now()` delta, scoped to `bootId` (ADR §4.3). | Everything within a session: `nextEligibleMonoMs`, the session time budget, `latencyMs`, probe elapsed. | Anything that crosses a session or a `bootId`. |
| `bootId` | string (uuid) | regenerated on cold start | Scoping `monoMs`. Comparing `monoMs` across differing `bootId` is **forbidden** and is prevented structurally by rule R2 (§6.3). | — |

**Gap clamping.** Every elapsed quantity computed from two `anchorMs` values is passed through

```
clampGap(x) = clamp(x, 0, CLOCK_MAX_GAP_MS)         // CLOCK_MAX_GAP_MS = 315_360_000_000 (3650 d)
```

A negative gap — the device clock went backwards — therefore reads as **zero elapsed**, which is the gentle direction: the item is treated as just-seen.

**`clampGap` is PURE.** It returns a number and increments nothing. Its companion predicate is

```
gapBinds(x) = (x < 0 || x > CLOCK_MAX_GAP_MS)
```

which is also pure.

**`clockAnomalyCount` — the exact rule, chosen (was ambiguous).**

> During one call to `reduce(state, event)` that is not short-circuited by R0, if **one or more** `clampGap` evaluations performed anywhere inside that call have `gapBinds === true`, then exactly once, at the end of that call, `participant.clockAnomalyCount = min(participant.clockAnomalyCount + 1, COUNTER_MAX (255))`. If none binds, it is unchanged. **The increment is `+1` per event, never per binding call.** A `SessionStarted` whose backwards clock makes the long-absence check *and* all eight `overdueReturn` checks bind increments the counter by exactly **1**, not by 9.

> **No other function ever writes `clockAnomalyCount`.** `planRoster`, `nextTrial`, `signals`, `acuteChange`, `trialTelemetry` and `sessionTelemetry` call `clampGap` freely and remain pure; calling `planRoster` directly (rather than through `reduce(SessionStarted)`) with a skewed clock therefore leaves the counter alone. This resolves the contradiction between "`trialTelemetry` is pure" and "the clamp increments a counter": the telemetry sites compute, the fold counts.

`clampGap` is applied at exactly **five** sites and nowhere else: `overdueReturn` (§9.2), `longAbsence` (§12.1), the `acuteChange` rate-limit check (§17.1), `daysSinceLastReview` telemetry (§17.3), and `daysSinceFirstIntroduction` telemetry (§17.3). Of these, only the first two are ever reached from inside `reduce`, so only the first two can move `clockAnomalyCount`.

### 1.4 Local day

```
localDayIndex(anchorMs, tzOffsetMinutes) = Math.floor((anchorMs + tzOffsetMinutes * 60000) / 86400000)
```

`config.tzOffsetMinutes` is an integer in `[-720, 840]`, **frozen at enrolment and never read from the OS inside the domain.** Set it to the participant's **standard-time** offset, so that in a DST jurisdiction the error is confined to the summer half-year and to the 00:00–01:00 local window. `localDayIndex` is a **study clock, not a wall calendar**; `day_offset_from_enrollment` in telemetry §7 inherits the same definition. This consequence is accepted, not overlooked.

---

## 2. Constants — the complete list, with provenance and failure direction

Every constant lives in `SchedulerConfig` and is overridable per participant. There are no numbers in function bodies.

**Naming, pinned.** The SCREAMING_SNAKE names below are the names of the *concepts* and are what the prose of this document uses. The `SchedulerConfig` **field** for each is the lowerCamelCase transliteration of the same name (`WITHIN_LADDER_MS` → `config.withinLadderMs`, `MISS_TARGET_PPT` → `config.missTargetPpt`, `CEILING_RUNG` → `config.ceilingRung`). Wherever this document writes `ACROSS_LADDER_MS[k]` it means `config.acrossLadderMs[k]`. There are no exceptions and no second naming scheme.

| Constant | Value | Provenance | Invented? | If wrong, fails toward |
|---|---|---|---|---|
| `WITHIN_LADDER_MS` | `[10000,20000,40000,80000,160000,320000,640000]` | synthesis §6 req 1, verbatim | No | — |
| `ACROSS_LADDER_MS` | `[5400000,86400000,172800000,345600000,604800000,1209600000,2592000000]` | §6 req 1 (`same day,1,2,4,7,14 d`) + req 3's 30-day global ceiling as rung 6 | Rung 0 only ("same day" → 90 min) | Shorter = more contact. Gentle. |
| `CEILING_RUNG` | `{1:4, 2:6, 3:6}` | §6 req 3 verbatim (7 d tier-1, 30 d global) | No | — |
| `SLOW_LATENCY_MS` | `8000` | — | **Yes** | Both directions safe. Low → intervals hold instead of expanding. High → grade collapses to correct/incorrect (the pre-2020 clinical protocol). |
| `RESPONSE_TIMEOUT_MS` | `30000` | — | **Yes** | Low → more recorded misses → more cue support. Gentle. |
| `MIN_PLAUSIBLE_LATENCY_MS` | `300` | P9 (80+ adults: 3× off-target taps; double-tap a known failure mode) | **Yes** | Low → accidental taps score as fluent recall. High → real fast responses are discarded as void. Void is the safe side. |
| `MAX_LATENCY_MS` | `600000` | schema bound only | **Yes** | Boundary rejection, not behaviour. |
| `CUE_VANISH_SESSIONS` | `2` | §6 req 11 ("persistence across sessions") gives the shape; 2 is the smallest integer satisfying it | **Yes** | High → under-challenged, over-supported. Gentle but paternalistic. |
| `VANISH_PER_SESSION` | `1` | — | **Yes** | **Deck-wide** cap. High → the confrontation rate scales with deck degradation. This constant is what stops that. |
| `TIER1_FLOOR_SESSIONS` | `3` | §6 req 6 gives the shape, not the number | **Yes** | Low → tier-1 crowds the roster. High → the floor is weak. |
| `SESSION_MAX_ITEMS` | `8` | §6 req 8 "6–10 items" (midpoint) | Weakly | — |
| `SESSION_MAX_MS` | `600000` | P29 "≤10 minutes" | Weakly | — |
| `MAX_TRIALS_PER_ITEM_PER_SESSION` | `7` | **derived** `= WITHIN_LADDER_MS.length` | No | — |
| `SESSION_MAX_TRIALS` | `56` | **derived** `= SESSION_MAX_ITEMS × MAX_TRIALS_PER_ITEM_PER_SESSION` | No | — |
| `SESSION_MAX_FILLERS` | `16` | — | **Yes** | Bounds a filler/trial alternation. High → a longer, blander session. |
| `NEW_ITEMS_FIRST_SESSION` | `2` | implication 17 "start with 1–2 targets" | No | — |
| `NEW_ITEMS_PER_SESSION` | `1` | implication 17 | No | — |
| `MISS_TARGET_PPT` | `50` | **derived** from §6 req 7's ≥95% (`1000 − 950`) | No | — |
| `GENTLE_ON_MISS` | `1` | — | **Yes** | Sessions of extra support after an above-target session. High → over-supported. Gentle. |
| `GENTLE_ON_DISTRESS` | `2` | `= CUE_VANISH_SESSIONS`, so a distress event outlives one vanish cycle | **Yes** | Gentle in both directions. |
| `OVERDUE_RETURN_MULTIPLIER` | `2` | — | **Yes** | Low → every slightly-late item is over-supported (gentle, and intervals stop expanding). High → the hospital-return case is not caught. |
| `LONG_ABSENCE_MS` | `1209600000` (14 d) | §6 req 10's trailing-14-day window, reused | Weakly | — |
| `DRIFT_WINDOW_MS` | `1209600000` (14 d) | §6 req 10 verbatim | No | — |
| `DRIFT_MIN_SESSIONS` | `6` | — | **Yes** | High → drift never fires; the per-item ladders still contract, so only the *global* response is lost. |
| `DRIFT_CONSECUTIVE` | `3` | §6 req 11 gives "persistence", not the number | **Yes** | **The one invented constant whose wrong direction is genuinely harmful** — too low manufactures decline out of DLB fluctuation. That is why it is 3 and not 2. |
| `DRIFT_MAX` | `2` | — | **Yes** | Caps total global contraction at 2 rungs. |
| `DRIFT_MIN_ITEMS_PER_SESSION` | `3` | — | **Yes** | A rate over fewer than 3 items is noise. High → drift is slower. Gentle. |
| `ACUTE_RECENT_WINDOW_MS` | `604800000` (7 d) | — | **Yes** | — |
| `ACUTE_BASE_WINDOW_MS` | `2419200000` (28 d) | — | **Yes** | — |
| `ACUTE_RECENT_MIN_SESSIONS` | `2` | iCST adherence (40% managed ≥2/week) | **Yes** | High → the detector is dead by density for most participants. |
| `ACUTE_BASE_MIN_SESSIONS` | `4` | — | **Yes** | As above. |
| `ACUTE_SUPPORT_DELTA_MILLI` | `750` | — | **Yes** | FPR unknown. See §25. |
| `ACUTE_SUPPORT_FLOOR_MILLI` | `1500` | — | **Yes** | As above. |
| `ACUTE_MISS_DELTA_PPT` | `300` | — | **Yes** | As above. |
| `ACUTE_MISS_FLOOR_PPT` | `400` | — | **Yes** | As above. |
| `ACUTE_ABSENCE_PRIOR_SESSIONS` | `10` | — | **Yes** | Low → fires on family holidays. |
| `ACUTE_ABSENCE_PRIOR_WINDOW_MS` | `2592000000` (30 d) | — | **Yes** | — |
| `ACUTE_ABSENCE_SILENT_MS` | `604800000` (7 d) | — | **Yes** | Low → fires on holidays. High → misses the crash. |
| `ACUTE_RATE_LIMIT_MS` | `1209600000` (14 d) | — | **Yes** | — |
| `PROBE_MAX_ITEMS` | `8` | §5.2 point 2 verbatim | No | — |
| `PROBE_MAX_MS` | `120000` | §5.2 point 2 verbatim | No | — |
| `SESSION_HISTORY_MAX` | `90` | **derived**: must cover `ACUTE_BASE_WINDOW_MS` (28 d) at the maximum plausible 3 sessions/day | No | — |
| `CLOCK_MAX_GAP_MS` | `315360000000` (3650 d) | — | **Yes** | Boundary hygiene only. |
| `COUNTER_MAX` | `255` | — | No | Bounds state size. |

### 2.1 `SchedulerConfig` — the complete declaration (`src/contract/config.ts`)

Five fields are **not** constants from the table above; they are per-participant settings with no clinical default beyond the one stated.

```ts
export interface SchedulerConfig {
  // ---- per-participant settings ----
  paramsVersion: string;                  // opaque to every rule; copied verbatim into state
  tzOffsetMinutes: number;                // integer in [-720, 840]; frozen at enrolment (§1.4)
  withinStartRung: Rung;                  // 0..6; DEFAULT 0
  probeItemIds: readonly ItemId[];        // ordered, frozen at enrolment; DEFAULT []
  acuteSignalEnabled: boolean;            // §17.1 kill switch; DEFAULT true

  // ---- ladders and ceilings ----
  withinLadderMs: readonly number[];      // length exactly 7
  acrossLadderMs: readonly number[];      // length exactly 7
  ceilingRung: Readonly<Record<Tier, Rung>>;   // keys exactly 1, 2, 3

  // ---- grading ----
  slowLatencyMs: number;
  responseTimeoutMs: number;
  minPlausibleLatencyMs: number;
  maxLatencyMs: number;

  // ---- cue ladder ----
  cueVanishSessions: number;
  vanishPerSession: number;
  tier1FloorSessions: number;

  // ---- session shape ----
  sessionMaxItems: number;
  sessionMaxMs: number;
  maxTrialsPerItemPerSession: number;
  sessionMaxTrials: number;
  sessionMaxFillers: number;
  newItemsFirstSession: number;
  newItemsPerSession: number;

  // ---- gentleness ----
  missTargetPpt: number;
  gentleOnMiss: number;
  gentleOnDistress: number;
  overdueReturnMultiplier: number;
  longAbsenceMs: number;

  // ---- drift ----
  driftWindowMs: number;
  driftMinSessions: number;
  driftConsecutive: number;
  driftMax: number;
  driftMinItemsPerSession: number;

  // ---- acute-change detector ----
  acuteRecentWindowMs: number;
  acuteBaseWindowMs: number;
  acuteRecentMinSessions: number;
  acuteBaseMinSessions: number;
  acuteSupportDeltaMilli: number;
  acuteSupportFloorMilli: number;
  acuteMissDeltaPpt: number;
  acuteMissFloorPpt: number;
  acuteAbsencePriorSessions: number;
  acuteAbsencePriorWindowMs: number;
  acuteAbsenceSilentMs: number;
  acuteRateLimitMs: number;

  // ---- probe ----
  probeMaxItems: number;
  probeMaxMs: number;

  // ---- bounds ----
  sessionHistoryMax: number;
  clockMaxGapMs: number;
  counterMax: number;
}
```

**`defaultConfig` is an exported value** and is exactly this object (every number is the "Value" column above, verbatim):

```ts
export const defaultConfig: SchedulerConfig = {
  paramsVersion: 'camp-1.0.0',
  tzOffsetMinutes: 0,
  withinStartRung: 0,
  probeItemIds: [],
  acuteSignalEnabled: true,

  withinLadderMs: [10000, 20000, 40000, 80000, 160000, 320000, 640000],
  acrossLadderMs: [5400000, 86400000, 172800000, 345600000, 604800000, 1209600000, 2592000000],
  ceilingRung: { 1: 4, 2: 6, 3: 6 },

  slowLatencyMs: 8000,
  responseTimeoutMs: 30000,
  minPlausibleLatencyMs: 300,
  maxLatencyMs: 600000,

  cueVanishSessions: 2,
  vanishPerSession: 1,
  tier1FloorSessions: 3,

  sessionMaxItems: 8,
  sessionMaxMs: 600000,
  maxTrialsPerItemPerSession: 7,
  sessionMaxTrials: 56,
  sessionMaxFillers: 16,
  newItemsFirstSession: 2,
  newItemsPerSession: 1,

  missTargetPpt: 50,
  gentleOnMiss: 1,
  gentleOnDistress: 2,
  overdueReturnMultiplier: 2,
  longAbsenceMs: 1209600000,

  driftWindowMs: 1209600000,
  driftMinSessions: 6,
  driftConsecutive: 3,
  driftMax: 2,
  driftMinItemsPerSession: 3,

  acuteRecentWindowMs: 604800000,
  acuteBaseWindowMs: 2419200000,
  acuteRecentMinSessions: 2,
  acuteBaseMinSessions: 4,
  acuteSupportDeltaMilli: 750,
  acuteSupportFloorMilli: 1500,
  acuteMissDeltaPpt: 300,
  acuteMissFloorPpt: 400,
  acuteAbsencePriorSessions: 10,
  acuteAbsencePriorWindowMs: 2592000000,
  acuteAbsenceSilentMs: 604800000,
  acuteRateLimitMs: 1209600000,

  probeMaxItems: 8,
  probeMaxMs: 120000,

  sessionHistoryMax: 90,
  clockMaxGapMs: 315360000000,
  counterMax: 255,
};
```

`fixtures/scheduler/config.json` is `defaultConfig` serialised, and a blind test asserts deep equality against the export. That single fixture pins all 49 field names and all 49 values.

### 2.2 `initialState` — the complete output, pinned

```ts
initialState(config) = {
  version: 1,
  paramsVersion: config.paramsVersion,      // the ONLY source; no other rule reads or writes it
  config,                                   // stored by reference, never copied, never mutated
  participant: {
    driftLevel: 0,
    gentleSessionsRemaining: 0,
    probeDisabled: false,                   // DEFAULT false; only ProbeDisabledSet changes it
    sessionCount: 0,
    lastSessionEndedAtMs: null,
    lastProbeLocalDay: null,
    acuteLastFiredAtMs: null,
    clockAnomalyCount: 0,
    history: [],
  },
  items: {},                                // empty object, not undefined
  activeSession: null,
  seqHighWater: {},                         // empty object, not undefined
}
```

`initialState` never throws and never validates `config`.

### 2.3 Config well-formedness — a precondition, not a runtime check

`reduce` never throws (§6.4), and it does not validate `config` either. The following is a **precondition on the caller** and on every property-test generator. Behaviour outside it is **undefined and untested**; fixtures must not exercise it.

```
withinLadderMs.length === 7 && acrossLadderMs.length === 7
acrossLadderMs is strictly increasing; withinLadderMs is strictly increasing
ceilingRung has exactly keys 1,2,3, each an integer in [0, 6]
withinStartRung is an integer in [0, 6]
tzOffsetMinutes is an integer in [-720, 840]
0 <= minPlausibleLatencyMs <= slowLatencyMs <= responseTimeoutMs <= maxLatencyMs
0 <= missTargetPpt <= 1000
1 <= sessionMaxItems <= 64 ; 1 <= maxTrialsPerItemPerSession <= 7
sessionMaxTrials === sessionMaxItems * maxTrialsPerItemPerSession
1 <= driftMax <= 2 ; driftMinSessions >= 1 ; driftConsecutive >= 1
counterMax >= 1 ; sessionHistoryMax >= 1 ; clockMaxGapMs >= 0
every other numeric field is a non-negative integer
```

Two consequences a blind agent must not have to infer:

- **Property-test generators generate `defaultConfig` with at most the five per-participant fields varied**, each inside its stated domain. "Arbitrary config" is out of scope for §21.
- **Payload values outside a prose bound are accepted, not rejected.** `latencyMs > maxLatencyMs`, `latencyMs < 0`, `attempts.length > 4`, `attemptIndex` gaps or non-ascending order, and `seq` gaps are all folded exactly as the rules read them: `gradeOf` compares against `slowLatencyMs` and nothing else; only `attempts[0]` is consulted (§5.1 note 5), so `attempts.length` and `attemptIndex` ordering beyond index 0 are inert; `seq` gaps are ordinary forward progress under R0. **`reduce` is total over the declared types, full stop** (I-17).

**Honest accounting.** 26 invented constants, of which 22 fail toward more contact and more support. Four do not: `DRIFT_CONSECUTIVE` (set to 3 for exactly that reason) and the four `ACUTE_*` thresholds, which govern a signal the scheduler **never acts on** — it changes no interval and no cue level — and which is gated behind `config.acuteSignalEnabled` so the pilot can kill it. Compare FSRS-6: 21 fitted weights plus a functional form plus a retention target, none clinician-inspectable, none ever fitted to a dementia cohort.

---

## 3. State model — every field, with type and range

Probe items are **not members of `state.items`** (§16). There is no `isProbe` field anywhere in `ItemState`.

```ts
type ItemId    = string;   // opaque, unique, stable; final tie-break in every ordering
type DeviceId  = string;
type SessionId = string;
type BootId    = string;
type Tier      = 1 | 2 | 3;
type CueLevel  = 0 | 1 | 2 | 3;   // 0 free recall, 1 partial cue,
                                  // 2 two-alternative recognition,
                                  // 3 familiarity exposure — NO QUESTION ASKED
type Rung      = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ItemStatus = 'active' | 'absorbing_distress' | 'retired';
```

### 3.1 `ItemState` — one per non-probe content item (13 fields)

```ts
interface ItemState {
  itemId: ItemId;
  tier: Tier;                       // human-set. The algorithm NEVER writes this.
  recognitionBlocked: boolean;      // P16: deceased / estranged / do-not-show. Human-set.
                                    // Forces cue 3, bars vanishing, bars foil-pool membership.
  contentReady: boolean;            // ADR §4.2: a card is never shown unless all media are ready.

  acrossRung: Rung;                 // index into ACROSS_LADDER_MS. Telemetry: attained_rung.
  cueLevel: CueLevel;               // the item's cue FLOOR — the support it is normally given.
  stableSessions: number;           // 0..255. Consecutive qualifying sessions at this floor.
  status: ItemStatus;

  lastSeenAtMs: number | null;      // anchorMs of the terminal response of its last counted trial.
                                    // null = never presented.
  dueAtMs: number;                  // anchorMs. For a never-presented item, === addedAtMs.
  addedAtMs: number;                // anchorMs.
  sessionsSincePresented: number;   // 0..255. Drives the tier-1 frequency floor.
  repetitionNumber: number;         // 0..2147483647. Telemetry only.
}
```

**There is no `lapseCount` field and no `missCount` field.** `lapse_count` in telemetry §7 is computed by the research plane from the event log. Its absence from scheduler state means **no code path can exist that reads a lapse count and removes an item** (req 5, P3, NEVER-DO #8). The absence *is* the enforcement.

### 3.2 `ActiveSessionState` — ephemeral, discarded at session close

```ts
type TrialClass = 'FLOOR' | 'SUPPORTED' | 'VANISH';
type Grade      = 'MISS' | 'SLOW' | 'CLEAN' | 'EXPOSURE';

interface CountedTrial { grade0: Grade; trialClass: TrialClass; }

interface RosterEntry {
  itemId: ItemId;
  withinRung: Rung;                  // index of the delay to apply AFTER the next success
  nextEligibleMonoMs: number;
  trialsThisSession: number;         // 0..7, counted trials only
  withinDone: boolean;
  vanishAttempted: boolean;
  vanishResolved: boolean;
  cueRaisedThisSession: boolean;     // at most ONE floor-miss cue escalation per item per session
  overdueReturn: boolean;            // snapshot taken at planRoster; §9.2
  floorAtSessionStart: CueLevel;     // telemetry + fixtures; never read by a rule
  lastTerminalAnchorMs: number | null;
  lastTerminalMonoMs: number | null;
  trials: CountedTrial[];            // length <= 7
}

interface ActiveSessionState {
  sessionId: SessionId;
  deviceId: DeviceId;
  bootId: BootId;
  startedAnchorMs: number;
  startedMonoMs: number;
  localDayIndex: number;
  roster: RosterEntry[];             // length <= SESSION_MAX_ITEMS
  trialsCompleted: number;           // counted, non-closer, non-probe
  fillersShown: number;              // 0..SESSION_MAX_FILLERS
  lastPresentedItemId: ItemId | null;
  probeEmitted: boolean;
  probeElapsedMs: number;
  probeTruncated: boolean;           // §16; the holder for telemetry's `probeTruncated`
  vanishUsed: boolean;               // deck-wide cap of VANISH_PER_SESSION
  gentleActive: boolean;             // snapshot of participant.gentleSessionsRemaining > 0
  driftAtStart: 0 | 1 | 2;           // snapshot of participant.driftLevel
  closerEmitted: boolean;
  endRequested: SessionEndReason | null;
}
```

`gentleActive` and `driftAtStart` are **snapshots taken at `SessionStarted` and never re-read from `participant`**. A session's presentation policy is therefore fixed for its whole duration, which is what makes `TrialClass` well-defined.

### 3.3 `ParticipantState`

```ts
interface SessionSummary {
  sessionId: SessionId;
  startedAnchorMs: number;
  localDayIndex: number;
  presentedItems: number;      // 0..8
  missRatePpt: number;         // 0..1000
  supportIdxMilli: number;     // 0..3000
  qualifying: boolean;         // presentedItems >= DRIFT_MIN_ITEMS_PER_SESSION
  endedOnSuccess: boolean;
  endReason: SessionEndReason;
}

interface ParticipantState {
  driftLevel: 0 | 1 | 2;               // req 10. Surfaces to nobody.
  gentleSessionsRemaining: 0 | 1 | 2 | 3;  // req 7's fast lever
  probeDisabled: boolean;              // §5.2 point 5, human-set only
  sessionCount: number;                // 0..2147483647; incremented at session close
  lastSessionEndedAtMs: number | null; // anchorMs
  lastProbeLocalDay: number | null;
  acuteLastFiredAtMs: number | null;   // anchorMs; advanced only by AcuteSignalDelivered
  clockAnomalyCount: number;           // 0..255
  history: SessionSummary[];           // ring buffer, newest last, length <= SESSION_HISTORY_MAX
}
```

### 3.4 `SchedulerState`

```ts
interface SchedulerState {
  readonly version: 1;
  readonly paramsVersion: string;      // e.g. 'camp-1.0.0'; opaque to every rule
  config: SchedulerConfig;
  participant: ParticipantState;
  items: Readonly<Record<ItemId, ItemState>>;   // key iteration order is NEVER relied upon
  activeSession: ActiveSessionState | null;
  seqHighWater: Readonly<Record<DeviceId, number>>;  // §6.2 idempotency
}
```

**State size bound.** 13 scalars per item; a 40-item deck plus a 90-entry history serialises to well under 100 kB. `seqHighWater` holds one entry per device that has ever contributed (expected cardinality 1–2; ADR §5.2 binds a tablet to a device row). Scheduler state is **never synced** (ADR §4.4) and is always recomputable from the event log.

---

## 4. Public API and injected ports — exact TypeScript

```ts
// src/contract/ports.ts

/** Declared for ADR contract conformance. NEVER CALLED by this module. */
export interface Clock { nowMs(): number; localDayIndex(): number; }
/** Declared for ADR contract conformance. NEVER CALLED by this module. */
export interface Rng { nextInt(boundExclusive: number): number; }

export interface Scheduler {
  /** Pure. The only constructor. */
  initialState(config: SchedulerConfig): SchedulerState;

  /** Pure and TOTAL: every event applied to every state yields a state.
   *  Never throws. Never reads a clock. Never calls Rng. */
  reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState;

  /** Pure. fold(config, events) === events.reduce(reduce, initialState(config)).
   *  `events` MUST already be in canonical order (§6.1); fold does not sort. */
  fold(config: SchedulerConfig, events: readonly SchedulerEvent[]): SchedulerState;

  /** Pure. `nowMonoMs` is scoped to state.activeSession.bootId. */
  nextTrial(state: SchedulerState, nowMonoMs: number): TrialDirective;

  /** Pure. `nowAnchorMs` is a server-anchored epoch ms. */
  planRoster(state: SchedulerState, nowAnchorMs: number): RosterPlan;

  /** Pure, total over its declared domain. */
  gradeOf(a: Attempt, slowLatencyMs: number): Grade;

  /** Pure. True when the attempt must drive no state transition (§7.3). */
  isVoid(a: Attempt, minPlausibleLatencyMs: number): boolean;

  /** Pure. Recomputed on demand; never mutates. Ordered per §17.2. */
  signals(state: SchedulerState, nowAnchorMs: number): readonly SchedulerSignal[];

  /** Pure. The scheduling-state group of telemetry §7 for one presentation.
   *  `nowMonoMs` is scoped to state.activeSession.bootId and is required for
   *  `withinIntervalDeviationMs`. Returns the CLOSER(null) shape of §17.3 when
   *  `directive.kind === 'CLOSER' && directive.itemId === null`. */
  trialTelemetry(
    state: SchedulerState,
    directive: Extract<TrialDirective, { kind: 'TRIAL' } | { kind: 'CLOSER' }>,
    nowAnchorMs: number,
    nowMonoMs: number,
  ): TrialSchedulingTelemetry;

  /** Pure. The per-session group of telemetry §7. Call it with the reason and
   *  closerPresented flag you are about to put on `SessionEnded`, BEFORE folding it.
   *  Returns null iff state.activeSession === null. §17.4. */
  sessionTelemetry(
    state: SchedulerState,
    reason: SessionEndReason,
    closerPresented: boolean,
  ): SessionSchedulingTelemetry | null;
}
```

### 4.1 The exported pure helpers — the fixture surface

§23 mandates unit fixtures against internal computations. **Those computations are therefore exported**, as free functions from `src/domain/scheduler/index.ts`, alongside the `Scheduler` methods. This closes the largest gap in the previous revision: five of the eleven fixture files were keyed to functions that had no exported name.

```ts
export type SessionOutcome =
  | 'CLEAN_SESSION' | 'SLOW_SESSION' | 'SUPPORTED_SESSION'
  | 'EXPOSURE_SESSION' | 'MISSED_SESSION' | 'NO_EVIDENCE';

/** §1.3. Pure. Increments nothing. */
export function clampGap(x: number, clockMaxGapMs: number): number;
export function gapBinds(x: number, clockMaxGapMs: number): boolean;

/** §1.4. Pure. */
export function localDayIndex(anchorMs: number, tzOffsetMinutes: number): number;

/** §17.1. Pure. `xs` need NOT be pre-sorted; the function sorts a copy with numAsc. */
export function median(xs: readonly number[]): number;

/** §12.2. Pure. */
export function effectiveAcrossRung(
  item: Pick<ItemState, 'tier' | 'acrossRung'>, driftLevel: 0 | 1 | 2, config: SchedulerConfig,
): Rung;

/** §9.2. Pure. Increments nothing. */
export function overdueReturn(
  item: Pick<ItemState, 'tier' | 'acrossRung' | 'lastSeenAtMs'>,
  sessionStartAnchorMs: number, driftLevel: 0 | 1 | 2, config: SchedulerConfig,
): boolean;

/** §9.3. Pure. */
export function canVanish(state: SchedulerState, entry: RosterEntry): boolean;

/** §9.5. Pure. Returns null when the pool is empty. */
export function foilFor(state: SchedulerState, targetItemId: ItemId): ItemId | null;

/** §9.1. Pure. */
export function resolvePresentation(state: SchedulerState, entry: RosterEntry): {
  openingCueLevel: CueLevel; floorCueLevel: CueLevel;
  trialClass: TrialClass; foilItemId: ItemId | null;
};

/** §9.4, the table, as a TOTAL function over its five inputs. */
export function cueTransition(input: {
  floor: CueLevel; openingCue: CueLevel; trialClass: TrialClass;
  grade0: Grade; cueRaisedThisSession: boolean;
}): {
  cueLevel: CueLevel;             // the item's new floor
  stableSessionsReset: boolean;   // true => item.stableSessions = 0
  vanishResolved: boolean;        // true => entry.vanishResolved = true
  cueRaisedThisSession: boolean;  // the new value of entry.cueRaisedThisSession
};

/** §13.1. Pure. */
export function outcomeFor(trials: readonly CountedTrial[]): SessionOutcome;

/** §13.2, the table, as a TOTAL function. */
export function acrossTransition(input: {
  tier: Tier; acrossRung: Rung; stableSessions: number;
  outcome: SessionOutcome; vanishResolved: boolean;
}, config: SchedulerConfig): { acrossRung: Rung; stableSessions: number };

/** §14. Pure. Returns the NEW driftLevel. */
export function evaluateDrift(
  history: readonly SessionSummary[], anchorMs: number,
  driftLevel: 0 | 1 | 2, config: SchedulerConfig,
): 0 | 1 | 2;

/** §17.1. Pure. Increments nothing. */
export function acuteChange(
  state: SchedulerState, nowAnchorMs: number,
): 'support' | 'miss' | 'absence' | null;

/** §16. Pure. */
export function probeDue(state: SchedulerState, nowMonoMs: number): boolean;

/** §10.2. Pure. Returns null => generic P11 closer. */
export function closerItemId(state: SchedulerState): ItemId | null;

export { defaultConfig };

export type SessionEndReason =
  | 'budget_time' | 'budget_trials' | 'roster_exhausted'
  | 'user_ended'  | 'distress_stop' | 'abandoned' | 'app_crash';

export type TrialDirective =
  | { kind: 'NO_SESSION' }
  | { kind: 'TRIAL'; itemId: ItemId; openingCueLevel: CueLevel; floorCueLevel: CueLevel;
      trialClass: TrialClass; foilItemId: ItemId | null }
  | { kind: 'PROBE_BLOCK'; probeItemIds: readonly ItemId[] }
  | { kind: 'FILLER' }
  | { kind: 'CLOSER'; itemId: ItemId | null }     // null => generic P11 closer
  | { kind: 'END'; reason: SessionEndReason };

export interface RosterPlan {
  itemIds: readonly ItemId[];        // length <= SESSION_MAX_ITEMS, in truncation order
  forcedMissing: readonly ItemId[];  // tier-1 items squeezed out; ascending itemId
}

export interface Attempt {
  correct: boolean;          // from tap or caregiver marking. NEVER from ASR (P27).
  cueLevel: CueLevel;        // the cue level this attempt was PRESENTED at
  latencyMs: number;         // integer, [0, MAX_LATENCY_MS], stimulus paint -> response commit
  attemptIndex: number;      // integer >= 0; 0 for the first attempt of a trial
  interrupted: boolean;      // telemetry §7 `interrupted`
  appBackgroundedMs: number; // integer >= 0; telemetry §7 `app_backgrounded_ms`
}

export type SchedulerSignal =
  | { kind: 'tier1_floor_unsatisfied'; itemIds: readonly ItemId[] }
  | { kind: 'items_set_aside'; itemIds: readonly ItemId[] }
  | { kind: 'acute_change_suspected'; limb: 'support' | 'miss' | 'absence' };
```

**`Attempt` has no `confidence`, no `selfRating`, no `asrConfidence`, and no `grade` field.** P4 and P27 are enforced by the type, not by discipline. This is invariant I-9.

**Neither `Clock` nor `Rng` is ever called.** Time enters only through event payloads; the two-alternative foil is chosen deterministically (§9.5).

**There is no injection point, and that is the point (was ambiguous).** `initialState(config)` is the only constructor and it takes no ports. The module never imports `Clock` or `Rng` and no function accepts one. A spy-based assertion is therefore **impossible and must not be written** — the previous revision's `expect(rngSpy.nextInt).not.toHaveBeenCalled()` is withdrawn. The unit suite runs with **zero mocks**, and I-10 is a **structural** assertion instead (§21).

---

## 5. Event vocabulary — complete, with every payload field

Every event carries the same envelope. There is no other event type; the union is exhaustive and a blind test may assert exhaustiveness by `switch` with a `never` default.

```ts
interface EventEnvelope {
  eventId: string;      // UUIDv7, ADR §4.3
  deviceId: DeviceId;
  bootId: BootId;
  seq: number;          // integer >= 0, strictly increasing per device, never reused
  anchorMs: number;     // integer epoch ms, server-anchored (§1.3)
}

export type SchedulerEvent = EventEnvelope & (
  | { type: 'ItemAdded';   itemId: ItemId; tier: Tier; recognitionBlocked: boolean;
      contentReady: boolean }
  | { type: 'ItemContentReadyChanged'; itemId: ItemId; contentReady: boolean }
  | { type: 'ItemTierSet'; itemId: ItemId; tier: Tier; by: 'caregiver' | 'clinician' }
  | { type: 'ItemRecognitionBlockSet'; itemId: ItemId; recognitionBlocked: boolean;
      by: 'caregiver' | 'clinician' }
  | { type: 'ItemRetired'; itemId: ItemId; by: 'caregiver' | 'clinician'; reason: string }
  | { type: 'ItemReEnabled'; itemId: ItemId; by: 'caregiver' | 'clinician' }
  | { type: 'ProbeDisabledSet'; disabled: boolean; by: 'caregiver' | 'clinician' }

  | { type: 'SessionStarted'; sessionId: SessionId; startedMonoMs: number }
  | { type: 'TrialCompleted'; sessionId: SessionId; itemId: ItemId;
      openingCueLevel: CueLevel; floorCueLevel: CueLevel; trialClass: TrialClass;
      isCloser: boolean;
      attempts: readonly Attempt[];              // length >= 1, ordered by attemptIndex ascending
      terminalMonoMs: number; terminalAnchorMs: number }
  | { type: 'GenericFillerShown'; sessionId: SessionId }
  | { type: 'ProbeBlockCompleted'; sessionId: SessionId; elapsedMs: number; truncated: boolean }
  | { type: 'DistressReported'; sessionId: SessionId; itemId: ItemId | null;
      severity: 'mild' | 'moderate' | 'severe';
      source: 'patient_control' | 'caregiver_report' }
  | { type: 'SessionEnded'; sessionId: SessionId; reason: SessionEndReason;
      closerPresented: boolean; endedMonoMs: number }

  | { type: 'AcuteSignalDelivered' }
);
```

### 5.1 Notes a blind agent must not have to infer

1. **There is no `isProbe` field on any event and no probe item is ever added.** Probe items are configured (`config.probeItemIds`) and their trials produce **no scheduler event at all** — the runtime logs them straight to telemetry. Requirement 13 is satisfied by absence, not by filtering. A `TrialCompleted` naming an unknown `itemId` returns the state **unchanged** (§6.4 rule R5).
2. **`DistressReported.source` has exactly two variants, both human.** There is no `'abandonment'` and no `'repeated_skip'` variant, and no code path in this module constructs a `DistressReported`. Abandonment is `SessionEnded{reason:'abandoned'}` and changes **no item state**. EU AI Act Art. 5(1)(f) compliance is a property of the type, checkable by reading `schema.ts`.
3. **`ItemRetired.by` and `ItemReEnabled.by` have no `'algorithm'` variant, in the type.** Invariant I-6.
4. **`openingCueLevel`, `floorCueLevel` and `trialClass` are FACTS recorded by the presenter, not derivations.** They are what the patient actually saw. `reduce` reads them and never recomputes them. If they disagree with `nextTrial`'s output for that state, the fold **trusts the payload** and the adapter emits `presentation_mismatch = true` in telemetry. This is what keeps the device projection and the server recomputation identical when they have folded the same events.
5. **`attempts` is the complete rescue chain of one trial**, ordered by `attemptIndex` ascending starting at 0, `length >= 1`, `length <= 4`. Only `attempts[0]` drives any state transition. Later attempts are telemetry and the P1 audit.
6. **`DistressReported.severity` is consumed by NOTHING in this module.** `'mild'`, `'moderate'` and `'severe'` are behaviourally identical: all three set `endRequested = 'distress_stop'`, absorb the subject item, and produce `GENTLE_ON_DISTRESS = 2`. It is carried for the research plane and the caregiver record only. A blind test-writer must **not** build a case that expects the three to differ, and a blind implementer must **not** branch on it. (Chosen deliberately: graduating the response would mean the module deciding that some distress is not distress.)
7. **`attempts.length` is bounded `[1, 4]` by the presenter, not by `reduce`.** A payload with `length > 4`, with `attemptIndex` gaps, or with non-ascending `attemptIndex` folds without error: only `attempts[0]` is read (note 5), so everything past index 0 is inert. See §2.3.
8. `terminalAnchorMs` is the anchored timestamp of the **terminal attempt's response commit**. For an `EXPOSURE` attempt (cue 3, no question asked) the runtime commits at the advance tap or at the end of the spoken sentence, whichever comes first, and reports `latencyMs` measured to that instant. `gradeOf` ignores `latencyMs` at cue 3; the fold uses `terminalAnchorMs` and `terminalMonoMs`.

---

## 6. Fold discipline — ordering, idempotency, totality, crash recovery

### 6.1 Canonical order

```
canonicalOrder(e) = [ e.anchorMs asc, e.deviceId asc (strAsc), e.seq asc ]
```

`deviceId` is in the key. Two events from different devices in the same millisecond are ordered, not ambiguous. **`fold` does not sort; it requires its input already sorted.**

**Boundary obligation (stated here because getting it wrong silently corrupts the study).** ADR §4.3 applies skew correction *per batch*, so a naive `anchorMs` is **not** monotone within one device's stream. The ingest boundary MUST enforce, before handing events to `fold`:

> for every device `d`, `anchorMs` is non-decreasing in `seq` order — implemented as a running maximum over that device's stream.

With that obligation met, `canonicalOrder` preserves per-device causal order exactly, and is a strict total order because `(deviceId, seq)` is unique. Without it, a session's `SessionEnded` can sort before its `SessionStarted`; rule R2 (§6.3) makes that non-corrupting but it is still wrong, and fixture `ordering/out-of-order-batches.json` asserts the boundary's behaviour.

**Device-vs-server divergence, declared.** The device folds only the events it has produced. The server folds the union. They agree **iff they have folded the same set**. The product therefore ships a stated precondition: **one device per patient at a time.** If the ADR later returns other devices' events on `/sync` pull, the fold is already correct over the union — that is why `deviceId` is in the ordering key — but until it does, "two tablets merge deterministically" describes the *server's* state only, and the second tablet's local projection will be stale until it syncs and re-folds. This is a documented limitation, not a claim.

### 6.2 Idempotency — rule R0

```
R0. if (event.seq <= (state.seqHighWater[event.deviceId] ?? -1))  return state UNCHANGED (by reference)
R1. otherwise the returned state has seqHighWater[event.deviceId] = event.seq
```

**R1 is UNCONDITIONAL and outranks every "state unchanged" in §6.4 (was ambiguous, chosen).**

> Any event that survives R0 advances `seqHighWater[event.deviceId]` to `event.seq`, **including** an event that R3–R12 make a behavioural no-op. "State unchanged" in the §6.4 table means *no other field of `SchedulerState` changes*; it never means `seqHighWater` is left behind. Concretely: `reduce(s, TrialCompleted{itemId:'unknown', deviceId:'d1', seq:9})` returns a **new** state object, deeply equal to `s` except `seqHighWater.d1 === 9`.

**Reference-equality contract, complete (was undefined).** Exactly one rule returns the input by reference:

| | returned by reference? |
|---|---|
| R0 fires (`seq <= highWater`) | **Yes** — `reduce(s, e) === s`, the identity assertion in I-2 |
| any other event | **No** — a fresh top-level object, even for a no-op |

No test may assert reference identity for a non-R0 no-op, and no implementation may return one. Structural sharing *below* the top level (an untouched `items` record, an untouched `participant`) is permitted and unasserted.

`seq` is strictly increasing per device and never reused (ADR §4.3), so R0 makes `reduce` exactly-once against duplicate local delivery, retried SQLite writes, and replayed batches. **Invariant I-2:** folding any canonical log twice, with every event duplicated in place, yields a state deeply equal to folding it once — the duplicate always lands on R0 precisely *because* R1 already advanced the high-water mark on the no-op.

**Ingest-order violations are tolerated, not detected.** §6.1 places the per-device monotonicity obligation on the ingest boundary. `fold` does **not** check it, does not sort, and does not throw. A log that violates it is folded exactly as ordered; R2 converts the worst case into an `app_crash` close (§6.3). There is no validation function and no error channel — that is what "total" means.

### 6.3 Crash and boot recovery — rule R2

An event is **session-scoped** iff its type is one of `SessionStarted`, `TrialCompleted`, `GenericFillerShown`, `ProbeBlockCompleted`, `DistressReported`, `SessionEnded`.

```
R2. if (state.activeSession !== null
        && event is session-scoped
        && (event.sessionId !== activeSession.sessionId || event.bootId !== activeSession.bootId)):
      state = closeSession(state, {
        sessionId: activeSession.sessionId,
        reason: 'app_crash',
        closerPresented: false,
        anchorMs: Math.max(activeSession.startedAnchorMs, event.anchorMs),
      })                                          // the full §12 pipeline runs
      // then continue processing `event` against the NEW state
```

This single rule closes three distinct holes:

- **The session that never ends.** A battery death produces no `SessionEnded`; the next `SessionStarted` closes the abandoned one through the full pipeline, so its six clean trials are *not* silently discarded and `app_crash` is not behaviourally identical to a clean end (telemetry §7 requires exactly that distinction).
- **`monoMs` across a `bootId`.** A force-quit restarts `performance.now()` near zero. Comparing the surviving `nextEligibleMonoMs` (tens of thousands) against a `nowMonoMs` of a few hundred would invert the Camp ladder and grant a full six-rung attainment for six back-to-back repetitions. R2 makes the comparison unreachable.
- **Stray foreign-session events.** They close the open session and are then handled by the ordinary rules (a `SessionEnded` for a foreign session finds no active session and returns unchanged).

### 6.4 Totality — the rules that make `reduce` never throw

| Rule | Condition | Result |
|---|---|---|
| R3 | `SessionStarted` while a session with the **same** `sessionId` and `bootId` is open | state unchanged (R0 usually catches this first) |
| R4 | any session-scoped event other than `SessionStarted` while `activeSession === null` | state unchanged |
| R5 | an **`Item*` event** naming an `itemId` not in `state.items` | state unchanged (this is the probe path and the unknown-id path) |
| R6 | `TrialCompleted` whose `itemId` has no roster entry in the open session | state unchanged |
| R7 | `TrialCompleted` with `attempts.length === 0` | state unchanged |
| R8 | `ItemAdded` for an `itemId` already in `state.items`, **or for an `itemId` present in `config.probeItemIds`** | state unchanged |
| R9 | `SessionEnded` whose `sessionId` differs from the open session's | state unchanged (R2 has already closed the open one) |
| R10 | `ItemRetired` for an item already `status === 'retired'` | state unchanged |
| R11 | `TrialCompleted` whose `itemId` is in `state.items` with `status !== 'active'` | state unchanged |
| R12 | `ProbeBlockCompleted` while `session.probeEmitted === true` | state unchanged |

In every row, R1 still applies (§6.2): `seqHighWater` advances.

**Five scope decisions that were previously ambiguous, now chosen:**

1. **R5 covers `Item*` events ONLY** — `ItemAdded`, `ItemContentReadyChanged`, `ItemTierSet`, `ItemRecognitionBlockSet`, `ItemRetired`, `ItemReEnabled`. It does **not** cover `TrialCompleted` (which R6 and R11 handle) and it does **not** cover `DistressReported`. A `DistressReported` naming a probe id, a deleted id, or any unknown id **still ends the session** — see §15.1 step 3. Requirement 14 is not gated behind an id lookup.
2. **R10 no longer covers `ItemReEnabled`.** `ItemReEnabled` applies its full §6.5 reset **every time**, including to an item that is already `status === 'active'`. Its writes are a deliberate ladder reset, not an idempotent status assignment, and the previous "may be returned unchanged" made two blind agents produce different trajectories from the same log. There is exactly one behaviour: reset.
3. **R11 is new and makes the §15.1 precedence table real.** A `TrialCompleted` naming a `retired` or `absorbing_distress` item is a total no-op even though the item is in `state.items` and has a roster entry — rank 1 and rank 2 say "invisible to every function", and without R11 the §8.3 "always" block would have moved `repetitionNumber`, `cueLevel`, `trials` and `trialsCompleted` on a set-aside item. Unreachable via `nextTrial` (which filters on `status === 'active'`); fully reachable in a generated log and in a distress-then-trial ordering.
4. **R8 also blocks probe-id collisions.** Requirement 13's "satisfied by absence" now has an enforcement point: an `ItemAdded` naming an id in `config.probeItemIds` is dropped, so a probe can never become schedulable. `config.probeItemIds` and `state.items` are disjoint by construction, for every reachable state.
5. **R12 makes the probe block once-per-session.** A second `ProbeBlockCompleted` neither overwrites nor accumulates `probeElapsedMs` — it is dropped. The first one wins.

A scheduler that throws on a replayed event cannot be recomputed from a log on a server, and ADR §4.4 requires exactly that.

### 6.5 Per-event effects (non-session events)

| Event | Effect |
|---|---|
| `ItemAdded` | Insert `{itemId, tier, recognitionBlocked, contentReady, acrossRung: 0, cueLevel: (tier === 1 \|\| recognitionBlocked) ? 3 : 2, stableSessions: 0, status: 'active', lastSeenAtMs: null, dueAtMs: event.anchorMs, addedAtMs: event.anchorMs, sessionsSincePresented: 0, repetitionNumber: 0}` |
| `ItemContentReadyChanged` | `contentReady = event.contentReady` |
| `ItemTierSet` | `tier = event.tier`; then `acrossRung = min(acrossRung, CEILING_RUNG[tier])`; then recompute `dueAtMs` (§12.2 step S10 formula) |
| `ItemRecognitionBlockSet` | `recognitionBlocked = event.recognitionBlocked`; if it became `true`, also `cueLevel = 3` |
| `ItemRetired` | `status = 'retired'` |
| `ItemReEnabled` | **Unconditionally, whatever the current status:** `status = 'active'; cueLevel = 3; acrossRung = 0; stableSessions = 0; sessionsSincePresented = 0; dueAtMs = event.anchorMs + ACROSS_LADDER_MS[0]` — maximum support, minimum gap, re-earning its way up through the ordinary rules. `tier`, `recognitionBlocked`, `contentReady`, `addedAtMs`, `lastSeenAtMs` and `repetitionNumber` are **not** touched |
| `ProbeDisabledSet` | `participant.probeDisabled = event.disabled` |
| `AcuteSignalDelivered` | `participant.acuteLastFiredAtMs = event.anchorMs` |

**`ItemReEnabled` on a healthy active item is a full reset, deliberately (was ambiguous).** The caregiver surface only offers "bring this back" for a set-aside or retired item, so the case arises only from a replayed or hand-built log — but it arises, so it is defined: the item drops to cue 3 / rung 0 and re-earns its way up. The alternative reading (no-op because already active) was rejected because it makes the effect of an event depend on invisible prior state, which is exactly what a blind implementer gets wrong.

**Non-session events during an open session are applied immediately and do NOT touch the roster.** An `ItemAdded` arriving mid-session inserts the item into `state.items` at once, but `activeSession.roster` was fixed at `SessionStarted` (§12.1 step 3) and is never recomputed. The new item is therefore invisible to `nextTrial` for the remainder of that session, and first becomes schedulable at the next `SessionStarted`. The same holds for `ItemContentReadyChanged{contentReady:true}`. Conversely `ItemRetired` mid-session takes effect immediately, because `nextTrial`'s candidate filter reads `state.items[itemId].status` live (§10) and R11 drops any trial that names it.

**Tier-1 identity content is introduced at cue level 3 — answer-first, exactly P12.** The vanishing rule (§9.3) then walks it up to recognition and eventually to free recall. Errorless acquisition followed by vanishing cues is the composite the literature supports (A4), and here it falls out of one rule rather than being a mode.

---

## 7. Grading — the only place requirement 2's four inputs meet

### 7.1 `gradeOf` — exact and total

```ts
function gradeOf(a: Attempt, slowLatencyMs: number): Grade {
  if (a.cueLevel === 3)            return 'EXPOSURE';   // no question was asked
  if (a.attemptIndex > 0)          return a.correct ? 'SLOW' : 'MISS';
  if (!a.correct)                  return 'MISS';
  if (a.latencyMs > slowLatencyMs) return 'SLOW';
  return 'CLEAN';
}
```

- `EXPOSURE` is checked **first and unconditionally**. At cue 3 nothing is asked, so `correct` is meaningless and ignored. `EXPOSURE` is **not ranked** against the other three; it is a separate branch. The only total order in this design is `MISS < SLOW < CLEAN`.
- The comparison is **strict `>`**: `latencyMs === 8000` is `CLEAN`; `8001` is `SLOW`.
- A rescue attempt (`attemptIndex > 0`) can **never** grade `CLEAN`. A person who needed the answer supplied has not demonstrated fluent retrieval, and `CLEAN` is the only grade that expands an interval.
- A response reaching `RESPONSE_TIMEOUT_MS` is committed by the runtime as `{correct: false, latencyMs: 30000}` and grades `MISS`. Omission and wrong answer grade identically; `error_type` is logged separately (telemetry §7) and is **never read by the scheduler**.
- `latencyMs` is the **only** continuous input to the entire engine, and its only effect is the `CLEAN`/`SLOW` split, whose only effects are to withhold interval expansion and withhold cue-vanishing. **The single continuous input can only make the schedule gentler.** That is why an invented 8000 ms threshold is tolerable.

### 7.2 Fixture obligation

`fixtures/scheduler/grades.json` is **exhaustive, not sampled**:
`correct {false,true} × cueLevel {0,1,2,3} × latencyMs {0, 299, 300, 1, 7999, 8000, 8001, 30000} × attemptIndex {0, 1}` = **2 × 4 × 8 × 2 = 128 rows**, all with `interrupted: false, appBackgroundedMs: 0`. `gradeOf` is total over its domain, so the table is complete by construction.

### 7.3 `isVoid` — contaminated and implausible trials

```ts
function isVoid(a: Attempt, minPlausibleLatencyMs: number): boolean {
  return a.interrupted
      || a.appBackgroundedMs > 0
      || a.latencyMs < minPlausibleLatencyMs;   // 300
}
```

**A trial is VOID iff `isVoid(attempts[0])`.** A VOID trial:

- is logged in full with `error_type` and `void_reason`;
- terminates warmly — the runtime supplies the answer and moves on;
- **drives no state transition whatever**: no `trials` append, no `withinRung` advance, no cue change, no `trialsCompleted` increment, no `lastSeenAtMs` / `lastTerminalAnchorMs` update, no contribution to `missRatePpt`;
- updates exactly two things, so the session does not stall: `item.repetitionNumber += 1` and `entry.nextEligibleMonoMs = terminalMonoMs + WITHIN_LADDER_MS[entry.withinRung]`, and sets `session.lastPresentedItemId = itemId`.

The voidness of `attempts[k>0]` is logged and otherwise ignored.

**Why this exists.** The doorbell goes; the caregiver puts the tablet down; on return the runtime commits `{correct:false, latencyMs: 400000}`. Without this rule that single event demotes the daughter's photograph one cue rung, contracts her interval one rung, and makes the whole next session gentler. And a tremor resting a finger on the screen at 180 ms on a two-alternative trial is correct by coin flip and is otherwise the **strongest positive signal the engine can receive** — P9's own evidence base says off-target and double-tap errors are ~3× more common in this population.

---

## 8. The within-session Camp loop

### 8.1 Trial structure — bounded, terminates in success by construction

A **trial** is one visit to one item.

- Attempt 0 opens at the trial's **opening cue level** `c` (§9.1).
- On `MISS`, the runtime **immediately and warmly supplies the answer**, then attempt `k+1` opens at `min(c + k + 1, 3)`.
- On `CLEAN`, `SLOW` or `EXPOSURE`, the trial terminates.

Because cue 3 asks no question it grades `EXPOSURE`, so every trial terminates at or before cue 3 in at most `4 − c` attempts. **P1 is structural, not a runtime check.**

### 8.2 Cue-level-3 items are presented ONCE per session

> **If a trial's opening cue level is 3, then at trial close `entry.withinDone = true` unconditionally.**

A familiarity exposure is a moment of connection, not a measurement. Repeating "Here's Margaret, your daughter" six times in ten minutes is a different thing from the thing the Camp protocol prescribes, and running the full seven-rung ladder over a fully degraded eight-item deck would produce 56 exposures in one session.

**Stated consequence:** a deck in which every item has degraded to cue 3 produces a session of ~8 trials, ending on `roster_exhausted` in roughly two minutes. That is honest — there is nothing to practise — and it is gentler than the alternative. It is not a bug and fixtures assert it.

### 8.3 Within-ladder transitions

On entering a session, every roster entry is initialised:

```
withinRung         = clamp(config.withinStartRung - session.driftAtStart, 0, 6)
nextEligibleMonoMs = session.startedMonoMs         // the first presentation is immediate
trialsThisSession  = 0;  withinDone = false;  vanishAttempted = false
vanishResolved     = false;  cueRaisedThisSession = false;  trials = []
lastTerminalAnchorMs = null;  lastTerminalMonoMs = null
floorAtSessionStart  = item.cueLevel
```

At **trial close** of a non-VOID, non-closer trial, with `r = withinRung`, `g0 = gradeOf(attempts[0])`, `t = terminalMonoMs`:

| `g0` | `withinRung` after | `nextEligibleMonoMs` | `withinDone` |
|---|---|---|---|
| `CLEAN` / `SLOW` / `EXPOSURE` | `min(r + 1, 6)` | `t + WITHIN_LADDER_MS[r]` | `event.openingCueLevel === 3 \|\| r === 6` |
| `MISS` | `r` (**unchanged**) | `t + WITHIN_LADDER_MS[r]` | `event.openingCueLevel === 3` |

**Both rows read `event.openingCueLevel`, and §8.2's "unconditionally" wins (was ambiguous, chosen).** The single rule is:

> `withinDone` becomes `true` at trial close iff `event.openingCueLevel === 3`, or (`g0 !== 'MISS'` and `r === 6`).

This matters only for a payload that grades `MISS` while declaring `openingCueLevel: 3` — reachable when `attempts[0].cueLevel` disagrees with `openingCueLevel` (§5.1 note 4 makes both trusted facts that `reduce` never reconciles). `nextTrial` cannot produce it; §21's arbitrary-interleaving generators can. Such a trial still closes the item out for the session, because the *presentation* was an exposure and §8.2's clinical rule is about the presentation, not the grade.

And always: `trialsThisSession += 1`; `trialsCompleted += 1`; `item.repetitionNumber += 1`; `lastTerminalAnchorMs = terminalAnchorMs`; `lastTerminalMonoMs = t`; `trials.push({grade0, trialClass})`; `session.lastPresentedItemId = itemId`.

**The `MISS` row is requirement 4 and P2 in their entirety: the interval does not move, the cue moves.** This is Camp's adjusted schedule with the adjustment axis rotated from time onto support.

An item leaves the within-session rotation when `withinDone === true` or `trialsThisSession >= MAX_TRIALS_PER_ITEM_PER_SESSION (7)`.

### 8.4 The interval is a minimum, honoured best-effort

The scheduler **never idles and never shows a countdown** (a visible timer is named harmful in A7.5). If no roster item is ready, it presents the soonest-eligible one early. The rung advances on success regardless. The actual elapsed within-session interval is logged as `within_interval_deviation_ms` (signed).

This is evidenced, not sloppy: the expanding shape is graded (c/d), so treating the ladder as a target rather than a contract discards nothing the evidence supports. In practice the early branch fires only in the first ~40 s of a session.

---

## 9. Presentation resolution — the cue ladder

Four rungs. **Higher number = more support.**

| `cueLevel` | Presentation | Can be missed? |
|---|---|---|
| 0 | Free recall — "Who is this?" | Yes |
| 1 | Partial cue — first phoneme/letter, semantic hint | Yes |
| 2 | Two-alternative recognition — target plus one foil | Yes (50% by chance) |
| 3 | Familiarity exposure — "Here's Margaret, your daughter." No question asked. | **No** |

`item.cueLevel` is the item's **floor**: the support it is normally given.

### 9.1 `resolvePresentation` — pure, exact

```
resolvePresentation(state, entry) -> { openingCueLevel, floorCueLevel, trialClass, foilItemId }
  item = state.items[entry.itemId]
  s    = state.activeSession
  f    = item.cueLevel

  if (item.recognitionBlocked)          c = 3                         // P16 — checked FIRST
  else if (canVanish(state, entry))     c = f - 1
  else {
        c = f
        if (s.gentleActive)             c = min(c + 1, 3)
        if (entry.overdueReturn)        c = min(c + 1, 3)
        c = min(c + s.driftAtStart, 3)
  }

  foilItemId = (c === 2) ? foilFor(state, entry.itemId) : null
  if (c === 2 && foilItemId === null)   c = 3          // no foil exists -> exposure instead

  trialClass = c <  f ? 'VANISH'
             : c === f ? 'FLOOR'
             :           'SUPPORTED'

  return { openingCueLevel: c, floorCueLevel: f, trialClass, foilItemId }
```

`gentleActive`, `overdueReturn` and `driftAtStart` are **presentation-time transforms only**. They never write `item.cueLevel`. When they clear, every item springs back to its own history unchanged, so no "un-drift" logic is needed: the mutation never happened.

`canVanish` requires `driftAtStart === 0 && !gentleActive && !overdueReturn`, so the vanish branch and the transform branch are **disjoint** and independently testable.

### 9.2 `overdueReturn` — the elapsed-aware guard

Computed once per roster entry at `planRoster` time and snapshotted:

```
overdueReturn(item, sessionStartAnchorMs, driftLevel) =
     item.lastSeenAtMs !== null
  && clampGap(sessionStartAnchorMs - item.lastSeenAtMs)
       > OVERDUE_RETURN_MULTIPLIER (2) * ACROSS_LADDER_MS[ effectiveAcrossRung(item, driftLevel) ]
```

A never-presented item has `overdueReturn === false`.

**Why.** Three weeks in hospital, or a fortnight of apathy, and nothing else in the engine notices. `stableSessions` has no recency and `canVanish` reads only the previous session's miss rate, so the first session home would open with the **hardest presentation the engine can produce** — a vanish attempt on every eligible item at once — for someone with three weeks of deconditioning and probable hospital-acquired delirium. This one integer comparison converts that into: one rung more support, no vanish attempt, and no interval expansion (the session classifies `SUPPORTED_SESSION`, §13.1). It is the whole of what the hybrid design's continuous soft assist buys, at the cost of one comparison and no model.

### 9.3 The unified vanishing rule

At an item's **first trial of a session**, a **vanish attempt** opens one rung *harder* than the floor iff **all** of:

```
entry.trialsThisSession === 0
&& !entry.vanishAttempted
&& !session.vanishUsed                                   // DECK-WIDE cap, VANISH_PER_SESSION = 1
&& item.stableSessions >= CUE_VANISH_SESSIONS (2)
&& item.cueLevel > 0
&& !item.recognitionBlocked
&& !entry.overdueReturn
&& session.driftAtStart === 0
&& !session.gentleActive
```

Then `openingCueLevel = item.cueLevel - 1`, and at trial close `entry.vanishAttempted = true`, `session.vanishUsed = true`.

**The deck-wide cap is load-bearing and is the single most important repair in this document.** Without it, the design's own proven fixed point — every item at `cueLevel 3`, `acrossRung 0` — produces this: two exposure sessions raise `stableSessions` to 2 on *all eight items simultaneously*; the next session opens all eight at cue 2, a real two-alternative question the person cannot do; roughly half are misses on family photographs and the other half are correct **by coin flip** and promote the floor, which then fails next session and cycles. The confrontation rate would grow with the number of degraded items — that is, **it would accelerate with decline**. With the cap it is at most one vanish attempt per session regardless of deck size or degradation, and a failed one costs `stableSessions`, so the next attempt on that item is two qualifying sessions away.

**Which item gets the slot is deterministic**: the first vanish-eligible item that `nextTrial` presents in that session. `nextTrial` is single-valued, so this is single-valued.

### 9.4 Cue transitions — applied at TRIAL close, immediately

With `c0 = openingCueLevel`, `f = floorCueLevel` (both from the event payload), `g0 = gradeOf(attempts[0])`, on a non-VOID, non-closer trial:

| Case | Condition | Effect |
|---|---|---|
| **Floor/supported miss** | `trialClass ∈ {FLOOR, SUPPORTED}` and `g0 === 'MISS'` and `!entry.cueRaisedThisSession` | `item.cueLevel = min(f + 1, 3)`; `item.stableSessions = 0`; `entry.cueRaisedThisSession = true` |
| **Repeat miss, same session** | as above but `entry.cueRaisedThisSession === true` | `item.stableSessions = 0` only. **No further cue rise.** |
| **Vanish success** | `trialClass === 'VANISH'` and `g0 === 'CLEAN'` | `item.cueLevel = f - 1`; `item.stableSessions = 0`; `entry.vanishResolved = true` |
| **Vanish slow** | `trialClass === 'VANISH'` and `g0 === 'SLOW'` | `item.cueLevel` **unchanged**; `item.stableSessions = 0`; `entry.vanishResolved = true` |
| **Vanish failure** | `trialClass === 'VANISH'` and `g0 === 'MISS'` | `item.cueLevel` **unchanged**; `item.stableSessions = 0`; `entry.vanishResolved = true` |
| Otherwise | — | no cue change |

**Which payload field is authoritative where — pinned (was ambiguous).** `attempts[0].cueLevel`, `event.openingCueLevel`, `event.floorCueLevel` and `event.trialClass` are four independent trusted facts (§5.1 note 4). They can disagree. `reduce` **never reconciles them** and never recomputes any of them; each rule reads exactly the one named here and no other:

| Quantity | Reads | Never reads |
|---|---|---|
| `g0 = gradeOf(attempts[0], slowLatencyMs)` | `attempts[0].cueLevel` | `openingCueLevel` |
| `isVoid` | `attempts[0]` | anything else |
| the cue transition (§9.4) | `event.floorCueLevel` (as `f`) and `event.trialClass` | `item.cueLevel`, `attempts[0].cueLevel` |
| `withinDone` (§8.3) | `event.openingCueLevel` | `attempts[0].cueLevel` |
| `entry.trials.push` | `g0` and `event.trialClass` | — |

So a payload with `openingCueLevel: 3` and `attempts[0].cueLevel: 1` grades `MISS`, raises the floor to `min(floorCueLevel + 1, 3)`, **and** sets `withinDone = true`. That is a single-valued outcome, not a contradiction. The adapter is what notices the disagreement and emits `presentation_mismatch = true`; the fold's job is to be deterministic, not to be right about what the presenter did.

Four further things a blind agent must not have to infer:

1. **The rise is `min(f + 1, 3)`, keyed on the FLOOR, not on the opening cue.** An item at floor 1 shown at cue 2 (because the session is gentle) that misses goes to floor 2, not floor 3. The floor is a record of the item's own established level; the transforms add support on top of it and must not ratchet it.
2. **At most one cue escalation per item per session** (`cueRaisedThisSession`). A single bad afternoon cannot dump an item from free recall to exposure-only. This is requirement 11 at item granularity.
3. **A vanish failure does not raise the floor.** The person failed at a level *we* deliberately made harder than their established level. Punishing them for our probe would be wrong and destabilising. It costs `stableSessions`, which is the correct price.
4. **A vanish attempt promotes only on `CLEAN`, not on `SLOW`.** A two-alternative trial is 50% correct by chance; requiring the strictest grade removes the slow-guess half at zero cost.

Transitions apply at **trial** close so the very next trial in the same session reflects them: on a floor miss the next presentation is genuinely one rung easier (requirement 4, literally); on a vanish success the rest of the session runs at the new harder floor, making the vanish real rather than cosmetic.

**Deliberate asymmetry:** the cue rises after one missed trial and falls only after two qualifying sessions. The safety bias, expressed as `1 < 2`.

### 9.5 The two-alternative foil, chosen without randomness

```
foilFor(state, targetItemId):
  target = state.items[targetItemId]
  pool = items where status === 'active'
                 && contentReady
                 && !recognitionBlocked
                 && itemId !== targetItemId
                 && tier === target.tier
  sort pool by itemId ascending (strAsc)
  if pool is empty -> null
  return pool[ state.activeSession.trialsCompleted mod pool.length ]
```

Zero `Rng` calls. Same-tier foils are clinically better than random ones. **`recognitionBlocked` items are excluded from every foil pool**, so a deceased spouse never appears as a wrong answer on his own children's cards (P16, NEVER-DO #12, S4).

---

## 10. `nextTrial` — the exact picker

```
nextTrial(state, nowMonoMs):
  s = state.activeSession
  if (s === null) return { kind: 'NO_SESSION' }

  candidates = s.roster entries where
        !withinDone
     && trialsThisSession < MAX_TRIALS_PER_ITEM_PER_SESSION (7)
     && state.items[itemId].status === 'active'
     && state.items[itemId].contentReady

  // 1. END RESOLUTION — distress outranks every budget
  endReason =
      s.endRequested !== null                                              ? s.endRequested
    : (nowMonoMs - s.startedMonoMs - s.probeElapsedMs) >= config.sessionMaxMs ? 'budget_time'
    : s.trialsCompleted >= SESSION_MAX_TRIALS (56)                         ? 'budget_trials'
    : candidates.length === 0                                              ? 'roster_exhausted'
    : null

  // 2. CLOSER, then END
  if (endReason !== null) {
      if (s.closerEmitted) return { kind: 'END', reason: endReason }
      if (endReason === 'distress_stop' || endReason === 'abandoned' || endReason === 'app_crash')
                            return { kind: 'END', reason: endReason }
      return { kind: 'CLOSER', itemId: closerItemId(state) }
  }

  // 3. PROBE
  if (probeDue(state, nowMonoMs))
      return { kind: 'PROBE_BLOCK', probeItemIds: config.probeItemIds.slice(0, PROBE_MAX_ITEMS) }

  // 4. INTERLEAVING GUARANTEE (requirement 8)
  if (candidates.length >= 2)
      candidates = candidates where itemId !== s.lastPresentedItemId
  else if (candidates.length === 1
           && candidates[0].itemId === s.lastPresentedItemId
           && s.fillersShown < SESSION_MAX_FILLERS (16))
      return { kind: 'FILLER' }

  // 5. READINESS
  ready = candidates where nextEligibleMonoMs <= nowMonoMs
  pool  = ready.length > 0 ? ready : candidates

  // 6. STRICT TOTAL ORDER
  chosen = min of pool by [ nextEligibleMonoMs asc,
                            withinRung asc,
                            state.items[itemId].tier asc,
                            itemId asc (strAsc) ]

  return { kind: 'TRIAL', itemId: chosen.itemId, ...resolvePresentation(state, chosen) }
```

Because `itemId` is unique the sort key is a **strict total order**: `nextTrial` is single-valued for any `(state, nowMonoMs)`. There is no tie to break and no randomness to seed.

**`nextTrial` is a pure query and holds no memory between calls.** Three consequences, all previously unstated:

1. **`PROBE_BLOCK` repeats until it is completed, deliberately.** `probeDue` clears only on `ProbeBlockCompleted` (§16), so if the runtime never emits one, every subsequent `nextTrial` past the half-budget mark returns `PROBE_BLOCK` again. This is **intended**: the probe is re-offered, not silently dropped. It does not hang the session — `probeElapsedMs` stays 0, so the step-1 budget check keeps advancing and `budget_time` eventually fires, after which the CLOSER/END path runs normally. A `next-trial.json` case may therefore assert that two consecutive calls with the same `(state, nowMonoMs)` both return the identical `PROBE_BLOCK` directive.
2. **`nowMonoMs` is trusted absolutely.** `nowMonoMs < s.startedMonoMs` is permitted and produces a negative elapsed, so the `budget_time` check is simply false and readiness comparisons run as written. `SessionStarted` with a negative or large `startedMonoMs` is likewise stored verbatim. Nothing is validated, nothing is clamped, nothing throws.
3. **`nextTrial` carries no `bootId` and cannot defend the query path.** R2 protects the *fold* from cross-boot `monoMs`; the query path has no such structural protection because its signature has no `bootId`. **It is the caller's obligation** to pass a `nowMonoMs` drawn from the same boot as `state.activeSession.bootId`. This is a declared limitation of the API, enforced in `policies.ts`, not in this module.

### 10.1 `FILLER`

`GenericFillerShown` sets `session.lastPresentedItemId = null` and `session.fillersShown += 1`. The runtime plays a generic, era-and-locale-matched item with no correct answer (P11). It is never graded, never scheduled and never in `state.items`.

This exists because the first session of every participant has a small roster (2 fresh items) and because late in a deployment a roster can shrink to one. Without it a one-item roster produces the item presented seven times back-to-back in ninety seconds — the massed-practice condition the Camp protocol exists to avoid. Past `SESSION_MAX_FILLERS` the guard stops and the item is returned; the session will end shortly afterwards on a budget.

### 10.2 `closerItemId` — the P1 guaranteed-success closer

```
closerItemId(state):
  pool = state.activeSession.roster entries where
             items[itemId].status === 'active' && items[itemId].contentReady
  nonBlocked = pool where !items[itemId].recognitionBlocked
  pool = nonBlocked.length > 0 ? nonBlocked : pool
  if (pool.length === 0) return null                       // -> generic P11 closer
  sort pool by [ items[itemId].tier asc, itemId asc ]
  return pool[ state.participant.sessionCount mod pool.length ].itemId
```

Presented at **cue level 3, unconditionally**, `isCloser: true`.

**The closer's state delta, complete and exhaustive (was ambiguous — this list is now closed).** A `TrialCompleted{isCloser: true}` that survives R0–R12 does **exactly** this and nothing else:

```
session.closerEmitted        = true                    <- THIS is the event that sets it
session.lastPresentedItemId  = event.itemId
item.repetitionNumber        = min(item.repetitionNumber + 1, 2147483647)
```

and **nothing** else: no `entry.trials` append, no `entry.trialsThisSession` increment, no `withinRung` advance, no `nextEligibleMonoMs` update, no `withinDone`, no `lastSeenAtMs` / `lastTerminalAnchorMs` / `lastTerminalMonoMs` update, no `cueLevel` change, no `stableSessions` change, no `session.trialsCompleted` increment, no `vanishUsed`, no contribution to `presented`, `missRatePpt` or `supportIdxMilli`. `isVoid` is **not** consulted; a closer is never VOID.

Three notes:

- **`repetitionNumber` DOES increment.** `repetitionNumber` counts *presentations*, which is why a VOID trial increments it too (§7.3). The item was shown; the counter moves. It is telemetry-only and reads no rule, so this cannot leak into the ladder.
- **There is no `CloserPresented` event.** §5's union is exhaustive and does not contain one. `session.closerEmitted` is set by `TrialCompleted{isCloser: true}` and by nothing else. (An earlier revision's prose referred to a `CloserPresented` event; it never existed.)
- **A closer with `itemId: null`** (the generic P11 closer, E17) produces **no `TrialCompleted` at all** — the runtime plays generic content and emits nothing. `session.closerEmitted` is therefore *not* set, and the following `SessionEnded` still carries `closerPresented: true`, which is what `endedOnSuccess` reads (§12.3). `closerEmitted` exists only to stop `nextTrial` emitting a second `CLOSER`; with a null closer the runtime ends the session directly.

**Two repairs are visible here.** The closer **rotates** by `sessionCount mod pool.length` — a fixed `min()` over a total order would have made a tier-1 `recognitionBlocked` item (lowest `itemId` among cue-3 tier-1 items) the closer of *literally every session, indefinitely*: a deterministic daily fixation on a dead spouse that nobody chose. And `recognitionBlocked` items are **de-preferred** and the pool may be **empty**, in which case the closer is generic rather than a crash on `min([])`.

---

## 11. `planRoster` — deterministic, total, no backlog

Called inside `reduce` on `SessionStarted` with `nowAnchorMs = event.anchorMs`, and exported for testing.

```
planRoster(state, nowAnchorMs):
  eligible = items where status === 'active' && contentReady === true
  fresh    = eligible where lastSeenAtMs === null
  returning = eligible minus fresh

  freshCap = state.participant.sessionCount === 0
               ? NEW_ITEMS_FIRST_SESSION (2)
               : NEW_ITEMS_PER_SESSION (1)
  freshAllowed = sort(fresh, [tier asc, addedAtMs asc, itemId asc]).slice(0, freshCap)

  ordered = concat(freshAllowed, sort(returning, PRIORITY_KEY(nowAnchorMs)))
  itemIds = ordered.slice(0, SESSION_MAX_ITEMS (8))

  forcedMissing = sort(returning where isForced(item) && itemId not in itemIds, [itemId asc])
  return { itemIds, forcedMissing }
```

```
isForced(item)     = item.tier === 1 && item.sessionsSincePresented >= TIER1_FLOOR_SESSIONS (3)
PRIORITY_KEY(item) = [ isForced(item) ? 0 : 1,
                       item.dueAtMs <= nowAnchorMs ? 0 : 1,
                       item.tier,
                       item.dueAtMs,
                       item.lastSeenAtMs ?? -1,
                       item.itemId ]
```

Compared lexicographically. `itemId` is unique, so this is a **strict total order** — `planRoster` has exactly one correct output for any `(state, nowAnchorMs)`.

**Fresh items are prepended, i.e. they hold reserved slots** and are never squeezed out by the truncation. The throttle counts *introductions*, not *intentions*.

### 11.1 The roster length — the exact formula

**Pinned (the previous revision's `min(8, |eligible|)` was loose prose and is withdrawn).** The roster length is exactly

```
roster.length === min(SESSION_MAX_ITEMS (8), |freshAllowed| + |returning|)
```

where `freshAllowed = min(freshCap, |fresh|)` and `freshCap` is `NEW_ITEMS_FIRST_SESSION (2)` when `sessionCount === 0` and `NEW_ITEMS_PER_SESSION (1)` otherwise. **The fresh-item throttle is inside the count**, so `min(8, |eligible|)` is wrong whenever untouched fresh items are being held back: a first session over a 10-item all-fresh deck returns a roster of **2**, not 8, exactly as the §11.3 ramp table says. A blind test must assert the formula above, never `min(8, |eligible|)`.

Three required consequences:

1. **There is no backlog and no due-count, ever** (requirement 12, P6, NEVER-DO #5). The concept is not representable in the state model. `dueAtMs` is recomputed from `lastSeenAtMs`, so missed days never accumulate: an item overdue by ten days is **one** item, appearing once, at the front of the ordering. Skipping five days produces a roster identical in shape to skipping none — only the ordering differs. **The module exports no function returning a count of due or overdue items**, so there is nothing a UI could render even by accident (invariant I-8).
2. **A session is never short and never empty *for a given deck maturity*.** Adherence does not change the roster's length or shape — only the ordering inside it. (The first-session ramp does change it, by design and on purpose; see §11.3.)
3. **Re-showing a well-known item is a feature** (requirement 6): "re-showing something already known well is not waste — it is a successful, pleasant experience with its own value."

### 11.2 The tier-1 floor and its honest limit

`forcedMissing` non-empty surfaces as `SchedulerSignal{kind:'tier1_floor_unsatisfied', itemIds}` (§17.2) to the **caregiver authoring surface only**, never to the patient, worded as a scheduling fact and never as a user error:

> "These will appear about every third session rather than every other one."

With `SESSION_MAX_ITEMS = 8` and `TIER1_FLOOR_SESSIONS = 3` the floor is satisfiable up to roughly 12 tier-1 items with room for other content — which covers spouse, three children, two grandchildren, the daily paid carer, the home address and the medication routine without complaint. Silent degradation of a stated guarantee is the class of bug this design exists to prevent, so the signal exists; but it must never be the first thing the product says to a newly-diagnosed family about their list of the people who matter.

### 11.3 The first-session ramp, stated as a decision

| Participant session | Fresh items admitted | Roster size with a 10-item deck |
|---|---|---|
| 1st (`sessionCount === 0`) | 2 | 2 |
| 2nd | 1 | 3 |
| 3rd | 1 | 4 |
| … | 1 | … |
| 8th onward | 1 | 8 (cap) |

This is implication 17 ("start with 1–2 targets and expand only after observing tolerance") implemented literally. The `FILLER` directive (§10.1) prevents back-to-back presentation while the roster is thin.

---

## 12. Session lifecycle

### 12.1 `SessionStarted` — exact, in order

```
1. R0 (idempotency), R2 (crash close) have already run.
2. If participant.lastSessionEndedAtMs !== null
     && clampGap(event.anchorMs - participant.lastSessionEndedAtMs) > LONG_ABSENCE_MS (14 d):
        participant.gentleSessionsRemaining = max(participant.gentleSessionsRemaining, 1)
3. plan = planRoster(state, event.anchorMs)
4. activeSession = {
     sessionId: event.sessionId, deviceId: event.deviceId, bootId: event.bootId,
     startedAnchorMs: event.anchorMs, startedMonoMs: event.startedMonoMs,
     localDayIndex: localDayIndex(event.anchorMs, config.tzOffsetMinutes),
     roster: plan.itemIds.map(id => newRosterEntry(id)),      // §8.3 initialisation
     trialsCompleted: 0, fillersShown: 0, lastPresentedItemId: null,
     probeEmitted: false, probeElapsedMs: 0, probeTruncated: false, vanishUsed: false,
     gentleActive: participant.gentleSessionsRemaining > 0,
     driftAtStart: participant.driftLevel,
     closerEmitted: false, endRequested: null,
   }
   where newRosterEntry sets entry.overdueReturn = overdueReturn(item, event.anchorMs,
                                                                 participant.driftLevel)
```

Step 2 is the apathy and post-hospital rule: **the first session after a gap of more than 14 days runs at one extra rung of support with all vanish attempts suppressed.** Apathy is the most prevalent neuropsychiatric symptom in dementia and a direct disease-caused predictor of not initiating any activity (§1.9), so low session density is a clinical feature of a large fraction of the enrolled population, not an engagement failure.

### 12.2 `SessionEnded` — the complete close pipeline, in this exact order

`closeSession(state, {sessionId, reason, closerPresented, anchorMs})`:

```
S0.  If activeSession === null or sessionId !== activeSession.sessionId -> return state unchanged.
S1.  distress = (reason === 'distress_stop')
                || (activeSession.endRequested === 'distress_stop')

S2.  For each roster entry, compute outcome(entry) per §13.1.
     PURE COMPUTATION ONLY — no mutation in this step.

S3.  If NOT distress: for each roster entry with items[itemId].status === 'active',
     iterated in ASCENDING itemId order, apply the §13.2 transition table to
     acrossRung and stableSessions; and if entry.trialsThisSession >= 1:
         item.lastSeenAtMs           = entry.lastTerminalAnchorMs
         item.sessionsSincePresented = 0

S4.  If NOT distress: for every item with status === 'active' that is either not in the
     roster, or in the roster with trialsThisSession === 0:
         item.sessionsSincePresented = min(item.sessionsSincePresented + 1, 255)

S5.  presented = count of roster entries with trialsThisSession >= 1   (any final item status)
     missed    = count of those whose outcome === 'MISSED_SESSION'
     missRatePpt     = presented > 0 ? Math.floor((1000 * missed) / presented) : 0
     supportIdxMilli = presented > 0
                       ? Math.floor((1000 * Σ items[e.itemId].cueLevel) / presented)   // AFTER S3
                       : 0
     (Σ over the same `presented` entries, in ascending itemId order; addition is commutative
      over integers so the order is immaterial and is stated only for reviewability.)

S6.  Push { sessionId, startedAnchorMs: activeSession.startedAnchorMs,
            localDayIndex: activeSession.localDayIndex,
            presentedItems: presented, missRatePpt, supportIdxMilli,
            qualifying: presented >= DRIFT_MIN_ITEMS_PER_SESSION (3),
            endedOnSuccess: closerPresented === true,
            endReason: reason }
     onto participant.history. If length > SESSION_HISTORY_MAX (90), drop the oldest.
     THE PUSH IS UNCONDITIONAL, INCLUDING FOR A DISTRESS-ABORTED SESSION.

S7.  g = max(participant.gentleSessionsRemaining - 1, 0)              // this session consumed one
     if (distress)                                       g = max(g, GENTLE_ON_DISTRESS (2))
     else if (presented >= 1 && missRatePpt > MISS_TARGET_PPT (50))
                                                         g = max(g, GENTLE_ON_MISS (1))
     participant.gentleSessionsRemaining = g

S8.  Evaluate drift (§14) against participant.history AFTER the S6 push, using `anchorMs`.

S9.  participant.sessionCount        = min(participant.sessionCount + 1, 2147483647)
     participant.lastSessionEndedAtMs = anchorMs

S10. For EVERY item in state.items, in ascending itemId order, recompute:
         item.dueAtMs = item.lastSeenAtMs === null
             ? item.addedAtMs
             : item.lastSeenAtMs
               + ACROSS_LADDER_MS[ effectiveAcrossRung(item, participant.driftLevel /* post-S8 */) ]

S11. activeSession = null
```

Four ambiguities that two blind agents would otherwise resolve differently, closed here:

- **S1's second disjunct is load-bearing (new).** Once a `DistressReported` has set `endRequested = 'distress_stop'`, the session is a distress close **whatever reason the eventual `SessionEnded` carries**. Without it, a runtime that reported distress and then emitted `SessionEnded{reason:'user_ended'}` — or a crash close via R2, which passes `reason:'app_crash'` — would silently re-enable S3 and S4 and apply per-item transitions to a session containing an absorbed item. The reason string is still recorded verbatim in the summary (S6), so `app_crash` and `distress_stop` remain distinguishable in telemetry; only the *pipeline branch* is forced.
- **S10 uses the POST-drift `driftLevel`.** Recomputing `dueAtMs` for the whole deck in one step means a drift change takes effect across every item at the very next query, rather than one item at a time as each comes up.
- **S6 is unconditional**, so a distress-aborted session registers in both the drift window and the acute-change windows. Hiding adverse sessions from the detectors would be the wrong kind of tidiness. Its `missRatePpt` and `supportIdxMilli` are computed for **measurement only** (S2 runs, S3 does not).
- **S7 fires on a distress close regardless of item count.** The single moment in the whole deployment where gentleness matters most is the session *after* a distress event, and the old `presented >= 3` guard left that session at full difficulty with every vanish attempt armed.

```
effectiveAcrossRung(item, driftLevel) =
    clamp(item.acrossRung - driftLevel, 0, max(0, CEILING_RUNG[item.tier] - driftLevel))
```

The **ceiling itself contracts under drift**, so a drifting tier-1 participant's ceiling falls from 7 d to 4 d to 2 d. The tier guarantee tightens under decline rather than merely holding.

### 12.3 `endedOnSuccess` — the exact formula

```
endedOnSuccess = (event.closerPresented === true)
```

That is the whole rule. The closer is by construction a cue-3 familiarity exposure that cannot fail, so if the runtime presented it the session ended on a guaranteed success and if it did not, it did not. Success criterion S3 (≥99% of sessions terminate on a success) therefore becomes an **audit of the fold**, not an audit of anyone's intent. `distress_stop`, `abandoned` and `app_crash` never carry a closer and are recorded `false`, honestly.

---

## 13. The across-session ladder

### 13.1 Session outcome for one item — checked in exactly this order

Computed over `entry.trials` — the item's **counted, non-closer, non-VOID** trials.

`entry.trials` contains one record per counted trial, **including `VANISH` trials**. `outcomeFor` then filters them out: a `VANISH` trial is recorded (so telemetry and I-13 can see it) and is invisible to the outcome (so a probe we chose to make harder cannot cost the item its ladder). Both halves are needed; neither is a typo for the other.

```
outcomeFor(entry):
  t = entry.trials where trialClass !== 'VANISH'
  1. if (t.length === 0)                              -> 'NO_EVIDENCE'
  2. if (any g0 === 'MISS'     in t)                  -> 'MISSED_SESSION'
  3. if (any g0 === 'SLOW'     in t)                  -> 'SLOW_SESSION'
  4. if (any trialClass === 'SUPPORTED' in t)         -> 'SUPPORTED_SESSION'
  5. if (all g0 === 'EXPOSURE' in t)                  -> 'EXPOSURE_SESSION'
  6. otherwise                                        -> 'CLEAN_SESSION'
```

**Step 4 must be checked before step 5.** An item at floor 2 raised to cue 3 by `gentleActive` produces all-`EXPOSURE` trials that are `SUPPORTED`-class; classing that as `EXPOSURE_SESSION` would increment `stableSessions`. In a DLB-band participant with alternating good and bad sessions that produces exactly this loop — bad session sets `gentleActive`; the gentle session cannot be missed, so `missRatePpt` is 0, which clears `gentleActive` **and** banks a stable session; two of those arm a vanish attempt — so the engine would reliably schedule its hardest probe onto the session following a good one, which for an alternating patient is a bad one about half the time. Step 4 before step 5 closes it: a session run at elevated support is not evidence about the item's own floor, in either direction.

An item whose **own floor is 3** (degraded, or `recognitionBlocked`) has `c === f === 3` → `FLOOR` class → reaches step 5 → `EXPOSURE_SESSION` → `stableSessions += 1`. **An item can therefore still recover from the bottom rung**, which is what requirement 5 and P3 require. The `gentleActive` transform is a no-op at the ceiling (`min(3+1,3) = 3`), so degraded items keep accruing stability even during a gentle session — correctly, because nothing about their presentation changed.

### 13.2 Session-close transitions

| Outcome | `acrossRung` | `stableSessions` |
|---|---|---|
| `CLEAN_SESSION` | `min(acrossRung + 1, CEILING_RUNG[tier])` | `min(+1, 255)` **unless** `entry.vanishResolved`, in which case unchanged |
| `SLOW_SESSION` | **hold** | `0` |
| `SUPPORTED_SESSION` | **hold** | `0` |
| `EXPOSURE_SESSION` | **hold** | `min(+1, 255)` **unless** `entry.vanishResolved`, in which case unchanged |
| `MISSED_SESSION` | `max(acrossRung − 1, 0)` | `0` |
| `NO_EVIDENCE` | **hold** | unchanged |

Rationale for each hold:

- **`EXPOSURE_SESSION` holds** because an exposure produces **no retrieval evidence**. This single rule prevents a degraded (cue-3) item from drifting out to 30 days and effectively vanishing — the failure mode P3 fears most — with no special "degraded item" logic anywhere.
- **`SLOW_SESSION` holds** because a slow retrieval is a success worth having but is not evidence for a longer gap. It is the only effect `SLOW_LATENCY_MS` has on intervals.
- **`SUPPORTED_SESSION` holds** because the item was shown with more support than its floor; a clean run says nothing about whether the *floor* can take a longer gap.
- **`MISSED_SESSION` contracts regardless of support level.** Contraction is never suppressible; requirement 9 outranks tidiness.

`vanishResolved` suppresses the `stableSessions` increment so that a resolved vanish always costs the streak, win or lose. The next attempt on that item is two qualifying sessions away.

### 13.3 Why the outcome is session-level and not trial-level

A two-alternative recognition trial is 50% correct by chance. If the ladder advanced on a single lucky trial it would be corruptible by guessing. `CLEAN_SESSION` requires **every** non-vanish counted trial's attempt 0 to grade `CLEAN`; with 4–6 trials per item per session, chance-clean at cue 2 is `0.5^5 ≈ 3%`. The session-level definition is what makes a chance-level cue rung safe to build on, and it costs nothing.

### 13.4 Requirement 9 — contraction, and why it is guaranteed

**Two per-item mechanisms and one global one, all integer:**

1. `MISSED_SESSION → acrossRung − 1`. Any session containing one miss shortens the next gap by one rung. The ladder is bidirectional at every rung; there is no "graduated" or "mature" state that only moves outward.
2. Floor/supported miss → `cueLevel + 1`, applied at trial close. Support is added to the presentation itself.
3. `driftLevel` subtracts from every item's effective across-rung **and** from every item's effective ceiling, and adds to every opening cue.

**Convergence.** Assume only three monotonicities — `P(CLEAN_SESSION)` is non-increasing in `acrossRung`, non-increasing in calendar time, and non-decreasing in `cueLevel`. No functional form is required. Each session produces exactly one of `{advance, hold, retreat}` on `acrossRung ∈ [0,6]` and one of `{raise, hold, lower}` on `cueLevel ∈ [0,3]`. As ability falls, `P(MISSED_SESSION)` rises, so retreats outnumber advances: `acrossRung` is a bounded integer under a biased walk with an absorbing barrier at 0 and a reflecting ceiling — **it descends**. Simultaneously `cueLevel` ratchets up on every floor miss and requires two qualifying sessions to fall — **it ascends**. The joint fixed point is `(acrossRung = 0, cueLevel = 3)`: presented in **every** session, at a 90-minute gap, as a warm familiarity exposure with no question asked, once per session, still eligible for the deck's single vanish slot when two qualifying sessions have accrued.

**That fixed point is exactly the end state P3 and requirement 5 prescribe.** The worst thing this design can do to a declining person is present their daughter's photograph with her name, warmly, once in every session, forever. There is no state below that, and no code path removes the item.

### 13.5 Ladder chatter — a named artefact, not a bug

An item whose true optimal gap sits between two rungs oscillates: `CLEAN` at 4 d → advance to 7 d → `MISS` at 7 d → contract to 4 d → …, giving roughly a 50% miss rate **at the upper rung only**, damped by `gentleSessionsRemaining` adding support in the session after each bad one. A hysteresis counter would remove it in one line and was **rejected**: it is another invented constant, and the artefact is clinically benign — both 4 d and 7 d sit inside the evidenced band, and re-showing a known item is explicitly not waste (requirement 6). Listed as falsifiable in §25: if the pilot's distress register shows adverse events clustering on oscillating items, hysteresis is required.

---

## 14. Progression drift — requirements 10 and 11 together

Evaluated once per session close, at step S8, integer arithmetic only.

```
W = participant.history entries where
        e.qualifying === true
     && e.startedAnchorMs > anchorMs - DRIFT_WINDOW_MS (14 d)
    ordered by [ startedAnchorMs asc, sessionId asc (strAsc), historyIndex asc ]
    // historyIndex = the entry's position in participant.history (0 = oldest).
    // It is unique by construction, so the order is a STRICT TOTAL ORDER even if two
    // entries share a sessionId. Nothing else in this module reads historyIndex.

if (|W| < DRIFT_MIN_SESSIONS (6)):
    driftLevel unchanged                                   // insufficient evidence
else:
    bad  = count of W with missRatePpt >  MISS_TARGET_PPT (50)
    tail = last DRIFT_CONSECUTIVE (3) entries of W
    if      (bad * 2 >  |W| && every entry in tail has missRatePpt >  50)
            driftLevel = min(driftLevel + 1, DRIFT_MAX (2))
    else if (bad * 4 <= |W| && every entry in tail has missRatePpt <= 50)
            driftLevel = max(driftLevel - 1, 0)
    else    driftLevel unchanged
```

**Duplicate `sessionId` in `history` is not prevented and not an error.** S6 pushes unconditionally and never de-duplicates; a hand-built or replayed log can therefore contain two entries with the same `sessionId`. The third sort key above makes that harmless and single-valued. No rule anywhere looks a `SessionSummary` up by `sessionId`.

| Property | Requirement served |
|---|---|
| Changes by at most one rung per session close | bounded, slow |
| Requires 3 consecutive above-target sessions to move up | req 11 — a single bad day, or an hour-to-hour DLB fluctuation, cannot move it |
| Requires 6 qualifying sessions in the window before it fires at all | a new participant is never drifted |
| Symmetric and reversible under the same discipline | recovery from a chest infection returns the previous schedule automatically, because drift never mutated any item's own state |
| Counts non-probe items only (`presented` is over roster entries; probes are not in `state.items`) | req 13 |
| **Surfaces to nobody** | req 10, P24 — `driftLevel` reaches telemetry as `drift_adjustment_applied` and nowhere else. **The module exports no getter for it** and no `SchedulerSignal` carries it. |

Effects, all presentation-time, none mutating item state:

| Target | Transform |
|---|---|
| Opening cue level | `min(cueLevel + driftAtStart, 3)` |
| Effective across rung **and ceiling** | `clamp(acrossRung − driftLevel, 0, max(0, CEILING_RUNG[tier] − driftLevel))` |
| Within-session start rung | `clamp(withinStartRung − driftAtStart, 0, 6)` |
| Vanish attempts | suppressed while `driftAtStart > 0` |

**Declared:** `DRIFT_MIN_SESSIONS = 6` inside 14 days may be unreachable at real adherence (iCST: 40% managed ≥2/week; 22% delivered zero), in which case requirement 10 is satisfied on paper and dead in practice. The per-item ladders still contract, so the loss is confined to the **global** response. This is §25's most likely falsifier.

---

## 15. Distress, retirement, and the things the algorithm cannot do

### 15.1 Distress is absorbing and stronger than any interval logic

**Precedence table (absolute):**

| Rank | Rule |
|---|---|
| 1 | `status === 'retired'` — invisible to every function; no state ever updates |
| 2 | `status === 'absorbing_distress'` — invisible to every function; state frozen |
| 3 | `DistressReported` — ends the session immediately, **beating the P1 closer** |
| 4 | `sessionMaxMs` / `SESSION_MAX_TRIALS` / `roster_exhausted` |
| 5 | The P1 guaranteed-success closer |
| 6 | Probe block |
| 7 | Within-session readiness and the interleaving guarantee |
| 8 | Cue and interval ladder logic |

On `DistressReported`, in this order. **R4 and R9 still apply** (`activeSession === null`, or a foreign `sessionId` after R2, is a no-op); **R5 does NOT** — see the note below.

```
1. activeSession.endRequested = 'distress_stop'.
   UNCONDITIONALLY, whatever event.itemId names and whatever endRequested already held.
   nextTrial returns END on its next call. No further trial is issued.
2. NO CLOSER IS EMITTED. Requirement 14 outranks P1.
   The session is logged endedOnSuccess = false, honestly, so the S3 audit measures reality.
3. Subject item = event.itemId if non-null,
                  else the item of the trial in progress (session.lastPresentedItemId),
                  else none.
   If a subject item exists AND it is a key of state.items AND its status === 'active':
       item.status = 'absorbing_distress'.
   Otherwise this step is SKIPPED and step 1 still stands.
   Its acrossRung, cueLevel and stableSessions are FROZEN at their pre-session values,
   which follows automatically from step 4.
4. On the subsequent SessionEnded{reason:'distress_stop'}, the §12.2 pipeline runs
   with `distress = true`: steps S3 and S4 are SKIPPED, so NO per-item transitions
   are applied to ANY item — not the misses, not the cleans; sessionsSincePresented
   is not incremented; lastSeenAtMs and dueAtMs are not updated by S3.
   Steps S2, S5, S6, S7, S8, S9, S10, S11 all run.
```

**Rank 3 beats rank 5 deliberately.** P18 says distress ends the session immediately. Playing a warm closer to someone who has just become distressed is P1 applied where it does harm.

**`DistressReported` is exempt from R5 — chosen, and this is the safety-critical decision in the document.** R5 drops item-scoped events naming an unknown `itemId`; `DistressReported` carries an `itemId` and would otherwise be swallowed whole. It is **not**. A distress report naming a probe id, a deleted id, or a typo **still ends the session, still emits no closer, still forces the distress branch of the close pipeline, and still yields `GENTLE_ON_DISTRESS = 2`.** Only step 3 — the absorb — is skipped, because there is nothing to absorb. The reading in which an unknown id makes the whole event a no-op was rejected: it would mean a person in distress keeps being shown cards because of a bad identifier, which is the precise failure requirement 14 exists to make impossible.

**Repeat `DistressReported` in one session is defined.** The second and subsequent reports are processed identically: step 1 is idempotent (`endRequested` is already `'distress_stop'`), and step 3 runs again against the **new** subject item, so a second report naming a different item absorbs that item too. Two items can be set aside from one session. There is no "already ending" guard and no cap.

**Rationale for step 4.** A distress-aborted session is an **adverse event, not evidence**. Reading it as evidence would let a single upsetting moment expand intervals (via the cleans that preceded it) or contract them (via the misses) on the basis of a session that ended in harm. Discarding is one rule with no ambiguous cases. The cost is real and declared in §25: a person may complete twenty clean trials before becoming upset and none of them count.

An `absorbing_distress` item is excluded from `eligible` in **every** pool — roster, foil pool, closer candidates, tier-1 forcing. It returns **only** on `ItemReEnabled` (§6.5), and its entry into the absorbing state is surfaced to the caregiver by `SchedulerSignal{kind:'items_set_aside'}` so that silent disappearance is impossible by construction rather than by the absence of a code path.

### 15.2 Nothing is removed by the algorithm

The **only** transition into `status = 'retired'` is `ItemRetired`, whose `by` field has no `'algorithm'` variant **in the type**. There is no leech threshold, no lapse counter in state, no suspend, no auto-delete, no "mature card" concept, and no interval above which an item stops appearing.

There is no `skip` event and no skip counter. The patient surface has no per-item skip (P9: single tap, one action per screen); "not today" is session-level and produces `SessionEnded{reason:'user_ended'}`, which changes no item state. `abandonment` produces `SessionEnded{reason:'abandoned'}`, which changes no item state either. **Abandonment must never absorb an item**: apathy is the modal reason an apathetic participant's session ends, and letting it absorb would silently delete the spouse's photograph because the person got up to answer the door.

Also human-only: `ItemTierSet`, `ItemRecognitionBlockSet`, `ProbeDisabledSet` (disabling the probe is an adverse event, not missing data — §5.2 point 5).

### 15.3 P16 — deceased, estranged, do-not-show

`recognitionBlocked` is set by a human, derived from the content plane's `person_status ∈ {deceased, estranged, do-not-show}`. Its four effects, all in this document and all testable:

1. `resolvePresentation` returns opening cue **3, unconditionally, checked first** (§9.1).
2. It is excluded from `canVanish` (§9.3), so it can never be walked down to "Who is this?" on a widow's dead husband.
3. It is excluded from every **foil pool** (§9.5), so it never appears as a wrong answer on its own children's cards.
4. It is **de-preferred as the closer** (§10.2), so it cannot become a deterministic daily fixation.

New items with `recognitionBlocked === true` are introduced at `cueLevel 3` regardless of tier, and `ItemRecognitionBlockSet{recognitionBlocked: true}` forces `cueLevel = 3` immediately.

S4 ("zero instances of a deceased person surfaced in a recognition mechanic") is auditable to zero against invariant I-7.

---

## 16. The probe set — requirement 13, satisfied by absence

Probe items are **never members of `state.items`**. They live in `config.probeItemIds: readonly ItemId[]`, an ordered list frozen at enrolment. There is no `isProbe` field on any state object or any event, and probe trials produce **no scheduler event at all** — the runtime logs them straight to telemetry.

```
probeDue(state, nowMonoMs) =
     config.probeItemIds.length > 0
  && !participant.probeDisabled
  && !session.probeEmitted
  && participant.lastProbeLocalDay !== session.localDayIndex
  && (nowMonoMs - session.startedMonoMs - session.probeElapsedMs)
        >= Math.floor(config.sessionMaxMs / 2)
```

**Probe eligibility is decided from the fold's own state** (`lastProbeLocalDay`), computed from the anchored timestamp and the frozen `tzOffsetMinutes` — never from a per-session boolean supplied by an untrusted device clock. The block is `config.probeItemIds.slice(0, PROBE_MAX_ITEMS (8))` **in list order** — identical items, identical order, every day, which is the BRANCH fixed-stimulus shape §5.2 point 1 requires and which F5 ("≥4 of the first 7 probe days") measures.

The **first** `ProbeBlockCompleted` of a session sets, by assignment:

```
session.probeEmitted           = true
session.probeElapsedMs         = clamp(event.elapsedMs, 0, PROBE_MAX_MS (120000))
session.probeTruncated         = event.truncated
participant.lastProbeLocalDay  = session.localDayIndex
```

**A second `ProbeBlockCompleted` in the same session is a no-op (rule R12, chosen).** It does not overwrite and does not accumulate: `session.probeEmitted === true` already, so the event is dropped and `probeElapsedMs`, `probeTruncated` and `lastProbeLocalDay` keep the first block's values. At most one probe block is credited per session, which is what `probeDue`'s `!session.probeEmitted` guard already intended and what F5's fixed-stimulus design requires.

**`event.truncated` now has a home.** It lands in `session.probeTruncated` and is surfaced by `sessionTelemetry` (§17.4). The previous revision promised a `probeTruncated` telemetry output with no state field to hold it and no function to emit it; both now exist.

Probe trials **do not** count toward `SESSION_MAX_TRIALS`, do not consume `sessionMaxMs` (their elapsed time is subtracted from the budget check), do not touch `lastPresentedItemId`, do not enter `participant.history`, do not affect `driftLevel` or `gentleSessionsRemaining`, and write no `ItemState` anywhere.

Inside the block each probe trial opens at **cue level 0**, one uncued attempt; `correct` on that first attempt is a **real recorded failure** — the only one in the product (§5.2 point 3) — and on a miss the answer is supplied and the item re-presented at cue 3, terminating in exposure. *You can record a failure and still never display one.*

---

## 17. Signals and telemetry

### 17.1 The acute-change detector (P25) — model-free and self-masking-proof

This is the **only** output of this module that reaches a human, and it gates a treatable medical emergency. It is therefore built out of quantities the engine's own compensation cannot suppress.

```
median(xs)  // xs: integers, sorted ascending with numAsc
  n = xs.length
  n odd  -> xs[(n-1)/2]
  n even -> Math.floor((xs[n/2 - 1] + xs[n/2]) / 2)

acuteChange(state, nowAnchorMs):
  if (!config.acuteSignalEnabled) return null
  if (participant.acuteLastFiredAtMs !== null
      && clampGap(nowAnchorMs - participant.acuteLastFiredAtMs) < ACUTE_RATE_LIMIT_MS (14 d))
      return null

  recent = history where startedAnchorMs >  nowAnchorMs - ACUTE_RECENT_WINDOW_MS (7 d)
                      && presentedItems >= 1
  base   = history where startedAnchorMs >  nowAnchorMs - ACUTE_BASE_WINDOW_MS (28 d)
                      && startedAnchorMs <= nowAnchorMs - ACUTE_RECENT_WINDOW_MS
                      && presentedItems >= 1

  // LIMB 1 — SUPPORT (the limb that works when the person is failing too hard to be graded)
  if (recent.length >= ACUTE_RECENT_MIN_SESSIONS (2)
      && base.length >= ACUTE_BASE_MIN_SESSIONS (4)) {
      sR = median(recent.map(supportIdxMilli));  sB = median(base.map(supportIdxMilli))
      if (sR - sB >= ACUTE_SUPPORT_DELTA_MILLI (750) && sR >= ACUTE_SUPPORT_FLOOR_MILLI (1500))
          return 'support'
      mR = median(recent.map(missRatePpt));      mB = median(base.map(missRatePpt))
      if (mR - mB >= ACUTE_MISS_DELTA_PPT (300) && mR >= ACUTE_MISS_FLOOR_PPT (400))
          return 'miss'
  }

  // LIMB 3 — ABSENCE (the only limb reachable at low adherence)
  prior = history where startedAnchorMs > nowAnchorMs - ACUTE_ABSENCE_PRIOR_WINDOW_MS (30 d)
                     && startedAnchorMs <= nowAnchorMs - ACUTE_ABSENCE_SILENT_MS (7 d)
  silent = history where startedAnchorMs > nowAnchorMs - ACUTE_ABSENCE_SILENT_MS
  if (prior.length >= ACUTE_ABSENCE_PRIOR_SESSIONS (10) && silent.length === 0)
      return 'absence'

  return null
```

`supportIdxMilli` is computed from the item's **own stored `cueLevel`** (its floor), which rises on floor misses and is **never written by `gentleActive`, `overdueReturn` or `driftLevel`**. This is the repair: a miss-rate-only detector is defeated by the engine's own difficulty floor — a UTI crash makes day 1 exceed the miss threshold, which immediately pushes every item one rung easier, which converts cue-2 items into cue-3 exposures that **cannot be missed**, so day 2's miss rate collapses toward zero and the second reading never arrives. The support index rises through exactly the same event that suppresses the miss rate.

**The scheduler never acts on this signal.** It changes no interval and no cue level. It is handed to the caregiver surface, which renders it **only** in P25's physical-illness wording — *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."* Never a cognitive interpretation, never to a clinician in v1 (P24), never to the patient. The payload contains no word that could be read as a cognitive interpretation: `limb` is `'support' | 'miss' | 'absence'` and nothing else.

### 17.2 `signals` — a pure query, ordered

```
signals(state, nowAnchorMs): SchedulerSignal[]
  out = []
  plan = planRoster(state, nowAnchorMs)
  if (plan.forcedMissing.length > 0)
      out.push({ kind: 'tier1_floor_unsatisfied', itemIds: plan.forcedMissing })
  setAside = items where status === 'absorbing_distress', ascending itemId
  if (setAside.length > 0)
      out.push({ kind: 'items_set_aside', itemIds: setAside.map(itemId) })
  limb = acuteChange(state, nowAnchorMs)
  if (limb !== null)
      out.push({ kind: 'acute_change_suspected', limb })
  return out          // always in this order: tier1, set_aside, acute
```

The rate limit advances only when the adapter emits `AcuteSignalDelivered` after actually rendering. `signals` never mutates.

**Signals never reach the patient, ever.** `tier1_floor_unsatisfied` and `items_set_aside` go to the caregiver *authoring* surface; `acute_change_suspected` goes to the P25 policy. None is a performance statement about the person.

### 17.3 Telemetry supplied by this module

`trialTelemetry` returns the scheduling-state group of telemetry §7 for one presentation:

```ts
interface TrialSchedulingTelemetry {
  itemId: ItemId | null;                     // null ONLY for CLOSER{itemId:null}
  itemTier: Tier | null;                     // null ONLY for CLOSER{itemId:null}
  repetitionNumber: number;
  daysSinceLastReview: number | null;        // Math.floor(clampGap(now - lastSeenAtMs)/86400000)
  daysSinceFirstIntroduction: number | null; // Math.floor(clampGap(now - addedAtMs)/86400000)
  scheduledIntervalMs: number | null;        // ACROSS_LADDER_MS[effectiveAcrossRung]; ALWAYS integer ms
  acrossIntervalDeviationMs: number | null;  // (now - lastSeenAtMs) - scheduledIntervalMs, signed
  withinSessionRung: Rung | null;
  withinIntervalDeviationMs: number | null;  // nowMonoMs - entry.nextEligibleMonoMs, signed
  attainedRung: Rung | null;                 // item.acrossRung
  driftAdjustmentApplied: 0 | 1 | 2;
  difficultyFloorTriggered: boolean;         // session.gentleActive
  overdueReturnApplied: boolean;
  openingCueLevel: CueLevel; floorCueLevel: CueLevel; wasVanishAttempt: boolean;
  presentationMode: 'free_recall' | 'cued_recall' | 'recognition' | 'familiarity_exposure';
  nDistractors: 0 | 1;
  isCloser: boolean;
  stability: null; difficulty: null; retrievability: null; predictedRecallProbability: null;
}
```

**The three fields that were previously underdetermined, now pinned:**

1. **`withinIntervalDeviationMs`** `= entry.lastTerminalMonoMs === null ? null : nowMonoMs - entry.nextEligibleMonoMs`. This is exactly "actual minus the intended within-ladder delay", because `nextEligibleMonoMs` was set to `lastTerminalMonoMs + WITHIN_LADDER_MS[rung at last close]` (§8.3) — so the rung at last close needs no separate storage and the signature needs no extra argument beyond `nowMonoMs`, which §4 now takes. It is **not** gap-clamped; it is a signed within-session quantity in `monoMs`. Negative means presented early (§8.4).
2. **`presentationMode`** is a total function of `openingCueLevel` alone: `0 → 'free_recall'`, `1 → 'cued_recall'`, `2 → 'recognition'`, `3 → 'familiarity_exposure'`.
3. **`nDistractors`** `= openingCueLevel === 2 ? 1 : 0`. There is no other value; the two-alternative trial has exactly one foil (§9.5) and every other cue level has none.

Also pinned: `acrossIntervalDeviationMs` is **not** gap-clamped either (it is explicitly signed, and clamping it would destroy the sign it exists to carry); `daysSinceLastReview` and `daysSinceFirstIntroduction` **are** gap-clamped, and — per §1.3 — none of the three moves `clockAnomalyCount`, because `trialTelemetry` is pure.

**`CLOSER{itemId: null}` — the exact return (E17).** The generic P11 closer names no item, so every item-derived field is `null` and the presentation fields describe the generic card:

```
{ itemId: null, itemTier: null, repetitionNumber: 0,
  daysSinceLastReview: null, daysSinceFirstIntroduction: null,
  scheduledIntervalMs: null, acrossIntervalDeviationMs: null,
  withinSessionRung: null, withinIntervalDeviationMs: null, attainedRung: null,
  driftAdjustmentApplied: session.driftAtStart,
  difficultyFloorTriggered: session.gentleActive,
  overdueReturnApplied: false,
  openingCueLevel: 3, floorCueLevel: 3, wasVanishAttempt: false,
  presentationMode: 'familiarity_exposure', nDistractors: 0, isCloser: true,
  stability: null, difficulty: null, retrievability: null, predictedRecallProbability: null }
```

`trialTelemetry` **never throws**: with `state.activeSession === null`, or with a `TRIAL` directive naming an id not in `state.items`, it returns this same all-null shape with `openingCueLevel` / `floorCueLevel` / `isCloser` copied from the directive.

**`scheduledIntervalMs` is always integer milliseconds.** There is no `scheduled_interval_days` field emitted by this module — a field whose type changes with its value cannot be asserted by a blind test. The two deviation fields have **distinct names** for the within-session and across-session quantities; they were conflated in the source design.

The last four fields are **`null` in v1, deliberately.** This design has no continuous model. Requirement 16's actual purpose — that a DSR/FSRS-shaped model can be fitted **retrospectively to this population**, which nobody has done — is fully served, because a retrospective fit needs `(item, participant, timestamp, elapsed, cue level, correct, latency)` and every one of those is logged at full resolution. A model-scheduled dataset is moreover confounded for fitting that same model, because reviews correlate with the model's own predictions; a ladder-scheduled dataset is the cleaner instrument.

### 17.4 `sessionTelemetry` — the per-session group

The previous revision listed eight per-session fields "supplied by this module" with no function to supply them. Here is the function.

```ts
interface SessionSchedulingTelemetry {
  sessionId: SessionId;
  endedOnSuccess: boolean;        // === closerPresented (§12.3)
  sessionEndReason: SessionEndReason;
  plannedNItems: number;          // activeSession.roster.length
  completedNItems: number;        // count of roster entries with trialsThisSession >= 1
  probeBlockEmitted: boolean;     // activeSession.probeEmitted
  probeTruncated: boolean;        // activeSession.probeTruncated
  nFillersShown: number;          // activeSession.fillersShown
  clockAnomalyCount: number;      // participant.clockAnomalyCount, at call time
}

sessionTelemetry(state, reason, closerPresented):
  if (state.activeSession === null) return null
  return { sessionId: state.activeSession.sessionId,
           endedOnSuccess: closerPresented,
           sessionEndReason: reason,
           plannedNItems: state.activeSession.roster.length,
           completedNItems: count(roster where trialsThisSession >= 1),
           probeBlockEmitted: state.activeSession.probeEmitted,
           probeTruncated: state.activeSession.probeTruncated,
           nFillersShown: state.activeSession.fillersShown,
           clockAnomalyCount: state.participant.clockAnomalyCount }
```

**Call it BEFORE folding the `SessionEnded`.** `reason` and `closerPresented` are the values the caller is about to put on that event; the module cannot know them from state, and after the fold `activeSession` is `null` and the answer is gone. This is a stated caller obligation, and `sessionTelemetry` returning `null` is the honest answer when it is violated. It is pure, mutates nothing, and increments nothing.

Per session this module supplies exactly the nine fields of `SessionSchedulingTelemetry` (§17.4).

---

## 18. THE DECISION TABLE — `correct` × `cue_level` × `tier` × due-state

**Baseline held constant across all 72 rows** (transcribe exactly):

```
attempts            = [ { correct, cueLevel: <cue>, latencyMs: 4000, attemptIndex: 0,
                          interrupted: false, appBackgroundedMs: 0 } ]   // plus the rescue chain
item.cueLevel (floor) = <cue>            -> trialClass = FLOOR
session.gentleActive  = false ;  session.driftAtStart = 0 ;  entry.overdueReturn = false
entry.cueRaisedThisSession = false ;  entry.vanishResolved = false
item.stableSessions   = 0 ;  item.sessionsSincePresented = 0 ;  item.recognitionBlocked = false
This is the item's ONLY counted trial in the session.
Entering acrossRung: 0 for due-state NEVER (a new item), 4 otherwise.
```

**Due-state definitions.** `NEVER` = `lastSeenAtMs === null`. `NOT_DUE` = `dueAtMs > nowAnchorMs`. `DUE` = `dueAtMs <= nowAnchorMs`.
**Selection column.** `FRESH` = admitted through the reserved fresh slots (§11), ordered `[tier, addedAtMs, itemId]`. Otherwise the first two components of `PRIORITY_KEY` are shown; the full key is `[forced, dueFlag, tier, dueAtMs, lastSeenAtMs ?? -1, itemId]` and `isForced` is `false` throughout because `sessionsSincePresented = 0`.
**Reachable column.** `NO` rows are still fully defined — `reduce` is total — but no event sequence from `initialState` can produce that entering state, because a never-presented tier-1 or `recognitionBlocked` item is introduced at cue 3 and a never-presented tier-2/3 item at cue 2 (§6.5). A blind test asserts the values *and* the unreachability.

| # | correct | cue | tier | due-state | grade | cueLevel' | stable' | outcome | acrossRung' | dueOffsetMs | selection | reachable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | false | 0 | 1 | NEVER | MISS | 1 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO — tier-1 enters at cue 3 |
| 2 | false | 0 | 1 | NOT_DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,1,…] | YES |
| 3 | false | 0 | 1 | DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,1,…] | YES |
| 4 | false | 0 | 2 | NEVER | MISS | 1 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO — tier-2 enters at cue 2 |
| 5 | false | 0 | 2 | NOT_DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,2,…] | YES |
| 6 | false | 0 | 2 | DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,2,…] | YES |
| 7 | false | 0 | 3 | NEVER | MISS | 1 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO — tier-3 enters at cue 2 |
| 8 | false | 0 | 3 | NOT_DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,3,…] | YES |
| 9 | false | 0 | 3 | DUE | MISS | 1 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,3,…] | YES |
| 10 | false | 1 | 1 | NEVER | MISS | 2 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO |
| 11 | false | 1 | 1 | NOT_DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,1,…] | YES |
| 12 | false | 1 | 1 | DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,1,…] | YES |
| 13 | false | 1 | 2 | NEVER | MISS | 2 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO |
| 14 | false | 1 | 2 | NOT_DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,2,…] | YES |
| 15 | false | 1 | 2 | DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,2,…] | YES |
| 16 | false | 1 | 3 | NEVER | MISS | 2 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO |
| 17 | false | 1 | 3 | NOT_DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,3,…] | YES |
| 18 | false | 1 | 3 | DUE | MISS | 2 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,3,…] | YES |
| 19 | false | 2 | 1 | NEVER | MISS | 3 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | NO |
| 20 | false | 2 | 1 | NOT_DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,1,…] | YES |
| 21 | false | 2 | 1 | DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,1,…] | YES |
| 22 | false | 2 | 2 | NEVER | MISS | 3 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | **YES** |
| 23 | false | 2 | 2 | NOT_DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,2,…] | YES |
| 24 | false | 2 | 2 | DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,2,…] | YES |
| 25 | false | 2 | 3 | NEVER | MISS | 3 | 0 | MISSED_SESSION | 0 | 5400000 | FRESH | **YES** |
| 26 | false | 2 | 3 | NOT_DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,1,3,…] | YES |
| 27 | false | 2 | 3 | DUE | MISS | 3 | 0 | MISSED_SESSION | 3 | 345600000 | [1,0,3,…] | YES |
| 28 | false | 3 | 1 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | **YES** |
| 29 | false | 3 | 1 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,1,…] | YES |
| 30 | false | 3 | 1 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,1,…] | YES |
| 31 | false | 3 | 2 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | YES — only if `recognitionBlocked` |
| 32 | false | 3 | 2 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,2,…] | YES |
| 33 | false | 3 | 2 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,2,…] | YES |
| 34 | false | 3 | 3 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | YES — only if `recognitionBlocked` |
| 35 | false | 3 | 3 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,3,…] | YES |
| 36 | false | 3 | 3 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,3,…] | YES |
| 37 | true | 0 | 1 | NEVER | CLEAN | 0 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 38 | true | 0 | 1 | NOT_DUE | CLEAN | 0 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,1,1,…] | YES |
| 39 | true | 0 | 1 | DUE | CLEAN | 0 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,0,1,…] | YES |
| 40 | true | 0 | 2 | NEVER | CLEAN | 0 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 41 | true | 0 | 2 | NOT_DUE | CLEAN | 0 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,2,…] | YES |
| 42 | true | 0 | 2 | DUE | CLEAN | 0 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,2,…] | YES |
| 43 | true | 0 | 3 | NEVER | CLEAN | 0 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 44 | true | 0 | 3 | NOT_DUE | CLEAN | 0 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,3,…] | YES |
| 45 | true | 0 | 3 | DUE | CLEAN | 0 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,3,…] | YES |
| 46 | true | 1 | 1 | NEVER | CLEAN | 1 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 47 | true | 1 | 1 | NOT_DUE | CLEAN | 1 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,1,1,…] | YES |
| 48 | true | 1 | 1 | DUE | CLEAN | 1 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,0,1,…] | YES |
| 49 | true | 1 | 2 | NEVER | CLEAN | 1 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 50 | true | 1 | 2 | NOT_DUE | CLEAN | 1 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,2,…] | YES |
| 51 | true | 1 | 2 | DUE | CLEAN | 1 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,2,…] | YES |
| 52 | true | 1 | 3 | NEVER | CLEAN | 1 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 53 | true | 1 | 3 | NOT_DUE | CLEAN | 1 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,3,…] | YES |
| 54 | true | 1 | 3 | DUE | CLEAN | 1 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,3,…] | YES |
| 55 | true | 2 | 1 | NEVER | CLEAN | 2 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | NO |
| 56 | true | 2 | 1 | NOT_DUE | CLEAN | 2 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,1,1,…] | YES |
| 57 | true | 2 | 1 | DUE | CLEAN | 2 | 1 | CLEAN_SESSION | **4 (ceiling binds)** | 604800000 | [1,0,1,…] | YES |
| 58 | true | 2 | 2 | NEVER | CLEAN | 2 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | **YES** |
| 59 | true | 2 | 2 | NOT_DUE | CLEAN | 2 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,2,…] | YES |
| 60 | true | 2 | 2 | DUE | CLEAN | 2 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,2,…] | YES |
| 61 | true | 2 | 3 | NEVER | CLEAN | 2 | 1 | CLEAN_SESSION | 1 | 86400000 | FRESH | **YES** |
| 62 | true | 2 | 3 | NOT_DUE | CLEAN | 2 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,1,3,…] | YES |
| 63 | true | 2 | 3 | DUE | CLEAN | 2 | 1 | CLEAN_SESSION | 5 | 1209600000 | [1,0,3,…] | YES |
| 64 | true | 3 | 1 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | **YES** |
| 65 | true | 3 | 1 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,1,…] | YES |
| 66 | true | 3 | 1 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,1,…] | YES |
| 67 | true | 3 | 2 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | YES — only if `recognitionBlocked` |
| 68 | true | 3 | 2 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,2,…] | YES |
| 69 | true | 3 | 2 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,2,…] | YES |
| 70 | true | 3 | 3 | NEVER | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 0 | 5400000 | FRESH | YES — only if `recognitionBlocked` |
| 71 | true | 3 | 3 | NOT_DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,1,3,…] | YES |
| 72 | true | 3 | 3 | DUE | EXPOSURE | 3 | 1 | EXPOSURE_SESSION | 4 | 604800000 | [1,0,3,…] | YES |

**Four properties readable straight off the table**, each of which a blind test should assert as a property rather than row by row:

- **`correct` is ignored at cue 3.** Rows 28–36 and 64–72 are pairwise identical. No question was asked.
- **The tier-1 ceiling binds and nothing else does.** Rows 38/39, 47/48, 56/57 sit at rung 4 = 7 days where their tier-2/3 twins go to rung 5 = 14 days. There is exactly one advance site in the whole design, so the ceiling cannot be bypassed.
- **A miss never changes the interval within the session and always contracts it at the session close by exactly one rung**, floored at 0. Requirement 4 and requirement 9 are visible in the same row.
- **Due-state affects selection only.** It never appears in a grade, a cue transition, or a ladder transition. That is what "no backlog" means mechanically.

### 18.1 The `SUPPORTED` / `VANISH` extension of the table

The 72 rows above all have `trialClass = FLOOR`. The two other classes differ only in the two right-hand transition columns, and this small table completes the cross-product:

| trialClass | how it arises | `g0` | `cueLevel'` | `stableSessions'` | contributes to outcome? |
|---|---|---|---|---|---|
| `FLOOR` | `c === f` | MISS | `min(f+1,3)` (once/session) | 0 | yes |
| `FLOOR` | | SLOW/CLEAN/EXPOSURE | `f` | via outcome | yes |
| `SUPPORTED` | `gentleActive` ∨ `overdueReturn` ∨ `driftAtStart > 0` ∨ `recognitionBlocked` with `f < 3` | MISS | `min(f+1,3)` (once/session) | 0 | yes — forces `SUPPORTED_SESSION` unless a MISS or SLOW outranks it |
| `SUPPORTED` | | SLOW/CLEAN/EXPOSURE | `f` | 0 (via `SUPPORTED_SESSION`) | yes |
| `VANISH` | `canVanish` (§9.3) | CLEAN | `f − 1` | 0, `vanishResolved = true` | **no** |
| `VANISH` | | SLOW | `f` | 0, `vanishResolved = true` | **no** |
| `VANISH` | | MISS | `f` (**unchanged**) | 0, `vanishResolved = true` | **no** |
| any | attempt 0 is `isVoid` | — | `f` | unchanged | **no** — the trial is VOID (§7.3) |

---

## 19. WORKED EXAMPLES — transcribe these directly into fixtures

### 19.0 The canonical setup — a COMPLETE literal state, `S0`

Every field below is stated. Nothing is "plausible"; nothing is invented at fixture-authoring time. `sessions/*.json` compares by deep equality, so any omission here is a guaranteed failure, and the previous revision omitted eleven of them.

```
E0 = 1800000000000        // localDayIndex(E0, 0) = Math.floor(1800000000000/86400000) = 20833
config = defaultConfig (§2.1) with EXACTLY these five overrides:
         tzOffsetMinutes    = 0
         withinStartRung    = 0
         probeItemIds       = []            // so no PROBE_BLOCK occurs anywhere in WE-2..WE-5
         acuteSignalEnabled = true
         paramsVersion      = 'camp-1.0.0'
```

**`S0.participant`** — complete:

```
driftLevel 0 ; gentleSessionsRemaining 0 ; probeDisabled true ; sessionCount 12
lastSessionEndedAtMs 1800000000000 ; lastProbeLocalDay null ; acuteLastFiredAtMs null
clockAnomalyCount 0 ; history = [H_01 … H_10]   (10 entries, oldest first)
```

**`S0.participant.history`** — generated by an exact rule, so all nine fields of all ten entries are determined:

```
for k = 1..10:
  H_k = { sessionId:        'h_' + k padded to 2 digits,      // 'h_01' … 'h_10'
          startedAnchorMs:  E0 - (11 - k) * 86400000,
          localDayIndex:    20822 + k,                        // = floor(startedAnchorMs/86400000)
          presentedItems:   6,
          missRatePpt:      0,
          supportIdxMilli:  1833,
          qualifying:       true,
          endedOnSuccess:   true,
          endReason:        'budget_time' }
```

so `H_01.startedAnchorMs = 1799136000000` … `H_10.startedAnchorMs = 1799913600000`.

**`S0.items`** — six items, all `status: 'active'`, `contentReady: true`, `sessionsSincePresented: 0`, `lastSeenAtMs: 1800000000000`, `addedAtMs: 1799136000000`, `repetitionNumber: 30`:

| itemId | tier | cueLevel | acrossRung | stableSessions | recognitionBlocked | `dueAtMs` | note |
|---|---|---|---|---|---|---|---|
| `it_0042` | 1 | 1 | 3 | 1 | false | 1800345600000 | Margaret, the daughter — the traced item |
| `it_0101` | 1 | 3 | 0 | 0 | **true** | 1800005400000 | Harold, deceased husband (P16) |
| `it_0203` | 1 | 2 | 3 | 0 | false | 1800345600000 | |
| `it_0311` | 2 | 2 | 4 | 0 | false | 1800604800000 | |
| `it_0402` | 2 | 1 | 5 | 0 | false | 1801209600000 | |
| `it_0555` | 3 | 2 | 3 | 0 | false | 1800345600000 | the only tier-3 item — **has no foil** |

`S0.activeSession = null`. `S0.seqHighWater = { d1: 100 }`. `S0.version = 1`. `S0.paramsVersion = 'camp-1.0.0'`.

**`S0` is fold-reachable**: every `dueAtMs` above equals `lastSeenAtMs + ACROSS_LADDER_MS[effectiveAcrossRung(item, 0)]`, which is what S10 would have written.

Closer pool (active, ready, **non-blocked**) sorted `[tier, itemId]` = `[it_0042, it_0203, it_0311, it_0402, it_0555]`, **length 5** — unchanged across sessions A–D, so the closer rotates `sessionCount mod 5`.

**`it_0555` has no foil, and this is load-bearing.** `foilFor('it_0555')` filters to `tier === 3`, of which `it_0555` is the only member, so the pool is empty and §9.1 rewrites its opening cue from 2 to **3**. It is therefore `SUPPORTED`-class in every session below, grades `EXPOSURE`, and takes exactly one trial. E32, inside the canonical deck rather than off to one side.

**`it_0101` has `overdueReturn === true` in every session below** — its `acrossRung` is 0, so the threshold is `2 × 5400000 = 10800000` (3 h) and the sessions are four days apart. It is inert: `recognitionBlocked` is checked **first** in §9.1, so the opening cue is 3 either way, and `canVanish` was already false. It shows up only in `trialTelemetry.overdueReturnApplied`.

#### 19.0.1 How the event logs are written, and why the order does not matter

Sessions A–D below are given as **per-item trial tables**. The `sessions/*.json` event array is generated from them mechanically:

```
SessionStarted
then, in ITEM-MAJOR order (items ascending by itemId, each item's trials in listed order):
    one TrialCompleted per listed trial
then the closer TrialCompleted (isCloser: true), if the table says a closer was presented
then SessionEnded
```

Envelopes: `deviceId: 'd1'`, `bootId` as stated per session, `seq` starting at 101 and incrementing by 1 across the whole chain (so `S0.seqHighWater.d1 = 100` and the final `seqHighWater.d1 = 100 + total events`), `eventId` = `'e_' + seq` zero-padded to 4 digits, `anchorMs` = the event's own terminal/started/ended anchor as stated.

> **Item-major order is safe, and this is a testable property.** The folded result of a session is **invariant under any permutation that preserves each item's own trial order**. Every cross-item channel is either a count (`trialsCompleted`), a set (`vanishUsed`), or ephemeral and discarded at close (`lastPresentedItemId`, `withinRung`, `nextEligibleMonoMs`); and `openingCueLevel` / `floorCueLevel` / `trialClass` are trusted payload facts that `reduce` never recomputes (§5.1 note 4), so a mid-session floor change cannot retroactively alter a sibling item's presentation. Fixture `sessions/we-2-permuted.json` asserts exactly this: the same trials interleaved round-robin fold to a byte-identical final state.

Consequently the tables below **do not** claim to be the presentation order `nextTrial` would have produced. They are the fixture input. The picker is tested separately by `next-trial.json`.

**`terminalMonoMs` grid.** Every session uses the same grid, so the only per-session arithmetic is `terminalAnchorMs = sessionStartAnchorMs + terminalMonoMs`:

| item | trial 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| `it_0101` | 12000 | — | — | — | — | — | — |
| `it_0555` | 30000 | — | — | — | — | — | — |
| `it_0042` | 4000 | 94000 | 184000 | 274000 | 364000 | 454000 | 544000 |
| `it_0203` | 48000 | 138000 | 228000 | 318000 | 408000 | 498000 | — |
| `it_0311` | 66000 | 156000 | 246000 | 336000 | 426000 | 516000 | — |
| `it_0402` | 84000 | 174000 | 264000 | 354000 | 444000 | 534000 | 560000 |

(Session C overrides `it_0042`'s trial 1 to **40000**, because that trial contains a 30 000 ms timeout plus a rescue attempt.)

Every non-closer attempt is `{correct, cueLevel: <openingCueLevel>, latencyMs: 4000, attemptIndex: 0, interrupted: false, appBackgroundedMs: 0}` unless the table says otherwise. `SLOW` trials use `latencyMs: 9500`; `EXPOSURE` trials use `correct: true, latencyMs: 2000`. Every closer is `{itemId, openingCueLevel: 3, floorCueLevel: <its floor>, trialClass: <per §9.1>, isCloser: true, attempts: [{correct: true, cueLevel: 3, latencyMs: 2000, attemptIndex: 0, interrupted: false, appBackgroundedMs: 0}]}`.

#### 19.0.2 The chain, declared

**WE-2 (session A) → WE-3 (session B) → WE-4 (session C) → WE-5 (session D) are CHAINED.** Each starts from the previous one's stated final state; `S0` feeds session A. Every number below has been re-derived under that chaining, including vanish eligibility, the drift window's actual size, and `it_0101`'s `stableSessions`. The previous revision's numbers were derived per-session in isolation and did not survive chaining; they are void.

**WE-6, WE-7, WE-8, WE-9, WE-10, WE-11, WE-12, WE-13, WE-14, WE-15, WE-16 and WE-17…WE-24 are NOT chained.** Each states its own entering state and stands alone.

**No vanish attempt occurs in sessions A, B, C or D.** This is engineered, not accidental, and the mechanism is stated so a blind test-writer can verify it rather than assume it:

| entering | items with `stableSessions >= 2` | vanish-eligible? |
|---|---|---|
| A | none | — |
| B | none | — |
| C | `it_0101` (2) | **no** — `recognitionBlocked` bars it (§9.3) |
| D | `it_0101` (3) | **no** — blocked, *and* `gentleActive` suppresses all vanish attempts |

Session B is deliberately built to give `it_0203`, `it_0311` and `it_0402` one `SLOW` trial each, which resets their `stableSessions` to 0 and keeps the deck-wide vanish slot unused through session C. The vanish path is exercised by **WE-6**, from its own stated state. (A previous revision chained A→B→C without checking this and asserted session-C numbers that a chained fold contradicts.)

---

### WE-1 — `gradeOf` boundaries (8 rows; `grades.json` is the exhaustive 128)

`slowLatencyMs = 8000`, `minPlausibleLatencyMs = 300`, `interrupted false`, `appBackgroundedMs 0`.

| # | correct | cueLevel | latencyMs | attemptIndex | `isVoid` | `gradeOf` |
|---|---|---|---|---|---|---|
| 1a | true | 1 | 299 | 0 | **true** | `CLEAN` (but the trial is VOID and transitions nothing) |
| 1b | true | 1 | 300 | 0 | false | `CLEAN` |
| 1c | true | 1 | 7999 | 0 | false | `CLEAN` |
| 1d | true | 1 | 8000 | 0 | false | `CLEAN` — comparison is strict `>` |
| 1e | true | 1 | 8001 | 0 | false | `SLOW` |
| 1f | false | 1 | 30000 | 0 | false | `MISS` |
| 1g | true | 1 | 4000 | 1 | false | `SLOW` — a rescue can never be `CLEAN` |
| 1h | false | 3 | 30000 | 0 | false | `EXPOSURE` — cue 3 is checked first; `correct` ignored |

---

### WE-2 — Session A: one slow answer costs the expansion and the streak

`SA = E0 + 349000000 = 1800349000000`. `sessionId 'S_A'`, `bootId 'B1'`, `deviceId 'd1'`, `startedMonoMs 0`.

**Entry checks.** `clampGap(SA − lastSessionEndedAtMs) = 349000000 <= LONG_ABSENCE_MS (1209600000)` → no gentle bump; `gentleActive = false`; `driftAtStart = 0`. `overdueReturn` per item, `gap = 349000000` against `2 × ACROSS_LADDER_MS[effectiveAcrossRung]`:

| item | rung | threshold | `overdueReturn` |
|---|---|---|---|
| `it_0042` | 3 | 691200000 | false |
| `it_0101` | 0 | 10800000 | **true** (inert — blocked, cue 3 either way) |
| `it_0203` | 3 | 691200000 | false |
| `it_0311` | 4 | 1209600000 | false |
| `it_0402` | 5 | 2419200000 | false |
| `it_0555` | 3 | 691200000 | false |

**`planRoster(S0, SA)`** — every item `isForced = false` (`sessionsSincePresented 0`); `dueFlag = 0` for `it_0042`, `it_0101`, `it_0203`, `it_0555` and `1` for `it_0311`, `it_0402`:

```
itemIds = ['it_0101', 'it_0042', 'it_0203', 'it_0555', 'it_0311', 'it_0402']
forcedMissing = []
```

(`it_0042` before `it_0203`: equal `dueAtMs` 1800345600000 and equal `lastSeenAtMs`, so `itemId` breaks it.)

**The trials.** Grades per §19.0.1's grid; `latencyMs 4000` unless stated.

| item | opening cue | floor | class | grades, in order | trials |
|---|---|---|---|---|---|
| `it_0042` | 1 | 1 | `FLOOR` | `CLEAN, CLEAN, SLOW (9500 ms at trial 3), CLEAN, CLEAN, CLEAN` | 6 |
| `it_0101` | 3 | 3 | `FLOOR` | `EXPOSURE` | 1 |
| `it_0203` | 2 | 2 | `FLOOR` | `CLEAN × 6` (foil `it_0042`) | 6 |
| `it_0311` | 2 | 2 | `FLOOR` | `CLEAN × 6` (foil `it_0402`) | 6 |
| `it_0402` | 1 | 1 | `FLOOR` | `CLEAN × 6` | 6 |
| `it_0555` | **3** | 2 | `SUPPORTED` | `EXPOSURE` | 1 |

Closer: `sessionCount 12 mod 5 = 2` → **`it_0311`**, at `terminalMonoMs 560000`, `terminalAnchorMs 1800349560000`.
`SessionEnded{sessionId:'S_A', reason:'budget_time', closerPresented:true, endedMonoMs:600000, anchorMs:1800349600000}`.

**Last terminal anchors** (`SA + terminalMonoMs`): `it_0042` 1800349454000, `it_0101` 1800349012000, `it_0203` 1800349498000, `it_0311` 1800349516000, `it_0402` 1800349534000, `it_0555` 1800349030000.

**Expected `it_0042`:**

```
outcome           = SLOW_SESSION        (no MISS; a SLOW present)
acrossRung        = 3      (HOLD)
stableSessions    = 1 -> 0
cueLevel          = 1      (unchanged)
repetitionNumber  = 30 + 6 = 36
lastSeenAtMs      = 1800349454000
sessionsSincePresented = 0
effectiveAcrossRung = clamp(3 − 0, 0, max(0, 4 − 0)) = 3
dueAtMs           = 1800349454000 + 345600000 = 1800695054000
```

**Expected final state after session A — every item, complete:**

| item | cueLevel | acrossRung | stableSessions | ssp | repetitionNumber | lastSeenAtMs | dueAtMs | outcome |
|---|---|---|---|---|---|---|---|---|
| `it_0042` | 1 | 3 | 0 | 0 | 36 | 1800349454000 | 1800695054000 | `SLOW_SESSION` |
| `it_0101` | 3 | 0 | 1 | 0 | 31 | 1800349012000 | 1800354412000 | `EXPOSURE_SESSION` |
| `it_0203` | 2 | 4 | 1 | 0 | 36 | 1800349498000 | 1800954298000 | `CLEAN_SESSION` |
| `it_0311` | 2 | 5 | 1 | 0 | **37** | 1800349516000 | 1801559116000 | `CLEAN_SESSION` |
| `it_0402` | 1 | 6 | 1 | 0 | 36 | 1800349534000 | 1802941534000 | `CLEAN_SESSION` |
| `it_0555` | 2 | 3 | 0 | 0 | 31 | 1800349030000 | 1800694630000 | `SUPPORTED_SESSION` |

`it_0311`'s **37** is the closer's `repetitionNumber += 1` (§10.2) on top of its six counted trials. That single digit is the whole of the closer-increment decision, and it is asserted here so the two blind agents cannot differ on it.

**Expected session summary** `{sessionId:'S_A', startedAnchorMs:1800349000000, localDayIndex:20837, presentedItems:6, missRatePpt:0, supportIdxMilli:1833, qualifying:true, endedOnSuccess:true, endReason:'budget_time'}`.
Floors after close are `1,3,2,2,1,2`, Σ = 11 → `Math.floor(1000 × 11 / 6) = 1833`.

**Participant after A:** `sessionCount 13`, `gentleSessionsRemaining max(0−1,0) = 0`, `lastSessionEndedAtMs 1800349600000`, `clockAnomalyCount 0`, `history.length 11`, `driftLevel 0`.

**Drift at S8, derived not asserted.** `anchorMs = 1800349600000`, window opens at `1800349600000 − 1209600000 = 1799140000000`. `H_01` (1799136000000) falls **outside**; `H_02 … H_10` and `S_A` are inside → **`|W| = 10`**. `bad = 0`; up needs `0 > 10` (no); down needs `0 <= 10` ✓ and the last 3 all `<= 50` ✓ → `driftLevel = max(0 − 1, 0) = 0`.

`it_0101` (Harold): opening cue 3 by `recognitionBlocked`, `trialClass = FLOOR` (3 === 3), `withinDone = true` at trial close → **exactly one trial**, `EXPOSURE`. He is never a foil, never vanished, and was **not** the closer.

---

### WE-3 — Session B: `it_0042` is clean and the tier-1 ceiling binds

`SB = 1800696000000`. `sessionId 'S_B'`, `bootId 'B1'`, `startedMonoMs 0`. Chained from WE-2.

**Entry checks.** `SB − lastSessionEndedAtMs = 346400000 <= 14 d` → no bump; `gentleActive = false`; `driftAtStart = 0`. `overdueReturn` false for all except `it_0101` (inert). No item has `stableSessions >= 2` → **no vanish**.

**`planRoster`** → `['it_0101', 'it_0042', 'it_0555', 'it_0203', 'it_0311', 'it_0402']`, `forcedMissing = []`.

| item | opening cue | floor | class | grades, in order | trials |
|---|---|---|---|---|---|
| `it_0042` | 1 | 1 | `FLOOR` | `CLEAN × 6` | 6 |
| `it_0101` | 3 | 3 | `FLOOR` | `EXPOSURE` | 1 |
| `it_0203` | 2 | 2 | `FLOOR` | `CLEAN × 5, SLOW` | 6 |
| `it_0311` | 2 | 2 | `FLOOR` | `CLEAN × 5, SLOW` | 6 |
| `it_0402` | 1 | 1 | `FLOOR` | `CLEAN × 5, SLOW` | 6 |
| `it_0555` | **3** | 2 | `SUPPORTED` | `EXPOSURE` | 1 |

Closer: `13 mod 5 = 3` → **`it_0402`**, `terminalMonoMs 560000`.
`SessionEnded{reason:'budget_time', closerPresented:true, endedMonoMs:600000, anchorMs:1800696600000}`.

**Expected `it_0042`:**

```
outcome        = CLEAN_SESSION
acrossRung     = min(3 + 1, CEILING_RUNG[1] = 4) = 4      <- 4 days becomes 7 days,
                                                             AND THE TIER-1 CEILING NOW BINDS
stableSessions = 0 -> 1               (vanishResolved = false)
cueLevel       = 1
lastSeenAtMs   = 1800696454000
dueAtMs        = 1800696454000 + 604800000 = 1801301254000
```

A tier-2 item in the same position would have gone to rung 5 = 14 days.

**Expected final state after session B:**

| item | cueLevel | acrossRung | stableSessions | repetitionNumber | lastSeenAtMs | dueAtMs | outcome |
|---|---|---|---|---|---|---|---|
| `it_0042` | 1 | **4** | 1 | 42 | 1800696454000 | 1801301254000 | `CLEAN_SESSION` |
| `it_0101` | 3 | 0 | **2** | 32 | 1800696012000 | 1800701412000 | `EXPOSURE_SESSION` |
| `it_0203` | 2 | 4 | 0 | 42 | 1800696498000 | 1801301298000 | `SLOW_SESSION` |
| `it_0311` | 2 | 5 | 0 | 43 | 1800696516000 | 1801906116000 | `SLOW_SESSION` |
| `it_0402` | 1 | 6 | 0 | **43** | 1800696534000 | 1803288534000 | `SLOW_SESSION` |
| `it_0555` | 2 | 3 | 0 | 32 | 1800696030000 | 1801041630000 | `SUPPORTED_SESSION` |

All `sessionsSincePresented = 0`. `it_0402`'s 43 = 36 + 6 + 1 (closer).

**Summary** `{sessionId:'S_B', startedAnchorMs:1800696000000, localDayIndex:20841, presentedItems:6, missRatePpt:0, supportIdxMilli:1833, qualifying:true, endedOnSuccess:true, endReason:'budget_time'}`. Floors `1,3,2,2,1,2` → 1833.
**Participant:** `sessionCount 14`, `gentleSessionsRemaining 0`, `lastSessionEndedAtMs 1800696600000`, `history.length 12`.
**Drift:** window opens at `1799487000000`; `H_06 … H_10`, `S_A`, `S_B` are inside → **`|W| = 7`**; `bad = 0` → `driftLevel = 0`.

**The three `SLOW`s are the point.** They cost `it_0203`, `it_0311` and `it_0402` their streaks, which is why nothing is vanish-eligible in session C. Chase that through and WE-4's numbers hold; ignore it and they do not.

---

### WE-4 — Session C: the timeout, and requirement 4 in one trial

`SC = 1801302000000`. `sessionId 'S_C'`, `bootId 'B1'`, `startedMonoMs 0`. Chained from WE-3.

**Entry checks.** `SC − lastSessionEndedAtMs = 605400000 <= 14 d` → no bump; `gentleActive = false`; `driftAtStart = 0`. `overdueReturn` false for all except `it_0101` (inert). Vanish-eligible: only `it_0101` has `stableSessions >= 2`, and it is `recognitionBlocked` → **`session.vanishUsed` stays `false` all session**.

**`planRoster`** → `['it_0101', 'it_0042', 'it_0203', 'it_0555', 'it_0311', 'it_0402']`, `forcedMissing = []`.

**T1 of `it_0042` — the whole of requirement 4:**

```
openingCueLevel 1, floorCueLevel 1, trialClass FLOOR
attempts[0] = {correct:false, cueLevel:1, latencyMs:30000, attemptIndex:0,
               interrupted:false, appBackgroundedMs:0}          -> gradeOf = MISS
answer supplied immediately and warmly: "That's Margaret — your daughter."
attempts[1] = {correct:true,  cueLevel:2, latencyMs:4100, attemptIndex:1, ...}  -> SLOW
   the rescue's foil is foilFor(state, 'it_0042') = ['it_0203'] -> 'it_0203'
   (a runtime concern: only attempts[0] drives state, §5.1 note 5)
terminalMonoMs 40000 ; terminalAnchorMs SC + 40000 = 1801302040000

TRIAL CLOSE:
  cueLevel            = min(floorCueLevel + 1, 3) = 2   <- APPLIED NOW, not at session close
  cueRaisedThisSession = true
  stableSessions      = 0
  withinRung          = 0 -> 0  UNCHANGED       <- requirement 4: the interval does not move
  nextEligibleMonoMs  = 40000 + WITHIN[0] (10000) = 50000
  trials              = [ {MISS, FLOOR} ]
```

T2–T7 open at the **new floor of 2** — the next presentation is genuinely one rung easier — with `floorCueLevel: 2`, `trialClass: FLOOR`, foil `it_0203`, all `CLEAN`, at the §19.0.1 grid monos `94000, 184000, 274000, 364000, 454000, 544000`. `withinRung` runs `0→1→2→3→4→5→6`; after T7 `trialsThisSession = 7 = MAX_TRIALS_PER_ITEM_PER_SESSION` and the item leaves rotation.

| item | opening cue | floor | class | grades, in order | trials |
|---|---|---|---|---|---|
| `it_0042` | 1, then **2** | 1, then **2** | `FLOOR` | `MISS, CLEAN × 6` | 7 |
| `it_0101` | 3 | 3 | `FLOOR` | `EXPOSURE` | 1 |
| `it_0203` | 2 | 2 | `FLOOR` | `CLEAN × 6` | 6 |
| `it_0311` | 2 | 2 | `FLOOR` | `CLEAN × 6` | 6 |
| `it_0402` | 1 | 1 | `FLOOR` | `CLEAN × 6` | 6 |
| `it_0555` | **3** | 2 | `SUPPORTED` | `EXPOSURE` | 1 |

Closer: `14 mod 5 = 4` → **`it_0555`**, `terminalMonoMs 570000`.
`SessionEnded{reason:'budget_time', closerPresented:true, endedMonoMs:600000, anchorMs:1801302600000}`.

**Expected `it_0042`:**

```
outcome        = MISSED_SESSION       (rule 2 fires; the six CLEANs do not rescue it)
acrossRung     = max(4 − 1, 0) = 3    <- 7 days CONTRACTS to 4 days (requirement 9, with numbers)
stableSessions = 0
cueLevel       = 2                    (already applied at T1's trial close)
lastSeenAtMs   = 1801302544000
dueAtMs        = 1801302544000 + 345600000 = 1801648144000
```

**Expected final state after session C:**

| item | cueLevel | acrossRung | stableSessions | repetitionNumber | lastSeenAtMs | dueAtMs | outcome |
|---|---|---|---|---|---|---|---|
| `it_0042` | **2** | **3** | 0 | 49 | 1801302544000 | 1801648144000 | `MISSED_SESSION` |
| `it_0101` | 3 | 0 | **3** | 33 | 1801302012000 | 1801307412000 | `EXPOSURE_SESSION` |
| `it_0203` | 2 | 4 | 1 | 48 | 1801302498000 | 1801907298000 | `CLEAN_SESSION` |
| `it_0311` | 2 | **6** | 1 | 49 | 1801302516000 | 1803894516000 | `CLEAN_SESSION` |
| `it_0402` | 1 | 6 | 1 | 49 | 1801302534000 | 1803894534000 | `CLEAN_SESSION` |
| `it_0555` | 2 | 3 | 0 | **34** | 1801302030000 | 1801647630000 | `SUPPORTED_SESSION` |

`it_0203`'s rung is `min(4 + 1, CEILING_RUNG[1] = 4) = 4` — the tier-1 ceiling binding a second time, on a different item. `it_0402`'s is `min(6 + 1, 6) = 6`. `it_0555`'s 34 = 32 + 1 + 1 (closer).

**Summary** `{sessionId:'S_C', startedAnchorMs:1801302000000, localDayIndex:20848, presentedItems:6, missRatePpt:166, supportIdxMilli:2000, qualifying:true, endedOnSuccess:true, endReason:'budget_time'}`.
`missRatePpt = Math.floor(1000 × 1 / 6) = 166`. Floors after close `2,3,2,2,1,2`, Σ = 12 → `Math.floor(1000 × 12 / 6) = 2000`.

**Participant:** `sessionCount 15`, `lastSessionEndedAtMs 1801302600000`, `history.length 13`,
`gentleSessionsRemaining = max(max(0−1,0), GENTLE_ON_MISS (1)) = 1` → **the next session opens every item one rung easier and suppresses all vanish attempts.**

**Drift: `|W| = 3`, so drift does not evaluate at all.** The window opens at `1801302600000 − 1209600000 = 1800093000000`; every `H_k` is older than that (the newest, `H_10`, is at 1799913600000), so `W = [S_A, S_B, S_C]` and `|W| = 3 < DRIFT_MIN_SESSIONS (6)` → **`driftLevel` unchanged at 0, on the insufficient-evidence branch.** This is the honest consequence of three sessions spread over eleven days: the ten warm-up entries have aged out. A previous revision asserted `|W| = 11` here and in WE-2, which no chained fold can produce.

**The three sessions in one line each (`it_0042`):**

| | outcome | `acrossRung` | interval | `cueLevel` | `stableSessions` |
|---|---|---|---|---|---|
| entering A | — | 3 | 4 d | 1 | 1 |
| A | `SLOW_SESSION` | 3 — hold | 4 d | 1 | 0 |
| B | `CLEAN_SESSION` | 4 — expand, **ceiling binds** | 7 d | 1 | 1 |
| C | `MISSED_SESSION` | 3 — **contract** | 4 d | **2** — support added | 0 |

---

### WE-5 — Session D: the gentle session, and the DLB ratchet that does not happen

`SD = 1801649000000`. `sessionId 'S_D'`, `bootId 'B1'`, `startedMonoMs 0`. Chained from WE-4.

**Entry checks.** `SD − lastSessionEndedAtMs = 346400000 <= 14 d` → no bump, but `gentleSessionsRemaining = 1` from session C → **`gentleActive = true`**. `driftAtStart = 0`. Every vanish attempt is suppressed by `gentleActive` alone.

**`planRoster`** → `['it_0101', 'it_0042', 'it_0555', 'it_0203', 'it_0311', 'it_0402']`.

| item | floor | opening cue | class | grades | trials |
|---|---|---|---|---|---|
| `it_0042` | 2 | `min(2+1,3) = 3` | `SUPPORTED` | `EXPOSURE` | 1 |
| `it_0101` | 3 | `min(3+1,3) = 3` | **`FLOOR`** | `EXPOSURE` | 1 |
| `it_0203` | 2 | 3 | `SUPPORTED` | `EXPOSURE` | 1 |
| `it_0311` | 2 | 3 | `SUPPORTED` | `EXPOSURE` | 1 |
| `it_0402` | 1 | `min(1+1,3) = 2` | `SUPPORTED` | `CLEAN × 7` (foil `it_0311`) | 7 |
| `it_0555` | 2 | 3 | `SUPPORTED` | `EXPOSURE` | 1 |

`it_0402` is the only item still in rotation after the first pass (the other five have `openingCueLevel === 3` → `withinDone` at trial close). Between its 6th and 7th trials it is the sole candidate **and** the last presented, so `nextTrial` returns `FILLER`: one `GenericFillerShown{sessionId:'S_D'}` is in the log, `fillersShown` ends at **1**, and `lastPresentedItemId` is nulled so trial 7 can be issued. After trial 7 (`withinRung` 6 → `withinDone`) every candidate is exhausted → `roster_exhausted`.

Closer: `15 mod 5 = 0` → **`it_0042`**, `terminalMonoMs 580000`.
`SessionEnded{reason:'roster_exhausted', closerPresented:true, endedMonoMs:590000, anchorMs:1801649590000}`.

```
it_0042 outcome = SUPPORTED_SESSION   (rule 4 fires BEFORE rule 5 — this is the ratchet-breaker)
acrossRung     = 3   HOLD       (a supported clean run is not evidence for a longer gap)
stableSessions = 0              (NOT +1 — so two alternating DLB sessions cannot arm a vanish)
cueLevel       = 2   unchanged  (the transform never writes the floor)
```

`it_0402` is the same lesson at the other end: seven straight `CLEAN`s, and because the session was gentle every one of them is `SUPPORTED`-class, so step 4 fires and its `acrossRung` **holds at 6** and its `stableSessions` drops `1 → 0`. A clean run at elevated support says nothing about the floor.

`it_0101` (floor 3): `min(3+1,3) = 3 === f` → `trialClass = FLOOR` → `EXPOSURE_SESSION` → **`stableSessions 3 → 4`**. **The gentle transform is a no-op at the ceiling, so already-degraded items keep accruing stability. An item can still recover from the bottom rung.** (A previous revision printed `1 → 2` here, which is what an unchained reading gives; chained from `S0` through A, B and C it is `3 → 4`.)

**Expected final state after session D:**

| item | cueLevel | acrossRung | stableSessions | repetitionNumber | lastSeenAtMs | dueAtMs | outcome |
|---|---|---|---|---|---|---|---|
| `it_0042` | 2 | 3 | 0 | **51** | 1801649004000 | 1801994604000 | `SUPPORTED_SESSION` |
| `it_0101` | 3 | 0 | **4** | 34 | 1801649012000 | 1801654412000 | `EXPOSURE_SESSION` |
| `it_0203` | 2 | 4 | 0 | 49 | 1801649048000 | 1802253848000 | `SUPPORTED_SESSION` |
| `it_0311` | 2 | 6 | 0 | 50 | 1801649066000 | 1804241066000 | `SUPPORTED_SESSION` |
| `it_0402` | 1 | 6 | 0 | 56 | 1801649560000 | 1804241560000 | `SUPPORTED_SESSION` |
| `it_0555` | 2 | 3 | 0 | 35 | 1801649030000 | 1801994630000 | `SUPPORTED_SESSION` |

`it_0042`'s 51 = 49 + 1 (its trial) + 1 (the closer).

**Summary** `{sessionId:'S_D', startedAnchorMs:1801649000000, localDayIndex:20852, presentedItems:6, missRatePpt:0, supportIdxMilli:2000, qualifying:true, endedOnSuccess:true, endReason:'roster_exhausted'}`.
**Participant:** `sessionCount 16`, **`gentleSessionsRemaining = max(1 − 1, 0) = 0`** → the floor clears, `lastSessionEndedAtMs 1801649590000`, `history.length 14`.
**Drift:** window opens at `1800439990000`; `W = [S_B, S_C, S_D]`, `|W| = 3 < 6` → unchanged at 0.

**`sessionTelemetry(state, 'roster_exhausted', true)` for this session** (called before folding `SessionEnded`): `{sessionId:'S_D', endedOnSuccess:true, sessionEndReason:'roster_exhausted', plannedNItems:6, completedNItems:6, probeBlockEmitted:false, probeTruncated:false, nFillersShown:1, clockAnomalyCount:0}`.

---

### WE-6 — the vanish attempt, deck-wide, and its three outcomes

**NOT chained.** Entering state: `S0` of §19.0 with exactly three overrides — `it_0203.stableSessions = 2`, `it_0402.stableSessions = 3`, `participant.sessionCount = 20` — and session E started at `SE = 1800349000000` (so the `overdueReturn` table of WE-2 applies unchanged).

Entering session E: `gentleActive false`, `driftAtStart 0`, `vanishUsed false`. Two items qualify (`stableSessions >= 2`, `cueLevel > 0`, `!recognitionBlocked`, `!overdueReturn`): `it_0203` (floor 2, stable 2) and `it_0402` (floor 1, stable 3).

`nextTrial` presents `it_0203` first (it wins §10 step 6). **It takes the single deck-wide slot**: opening cue `2 − 1 = 1`, `trialClass = VANISH`, `session.vanishUsed = true`. `it_0402` is then presented at its own floor 1, `trialClass = FLOOR`, because `!session.vanishUsed` now fails.

| `g0` of the vanish trial | `it_0203.cueLevel'` | `stableSessions'` | `vanishResolved` | contribution to outcome |
|---|---|---|---|---|
| `CLEAN` | **1** | 0 | true | none — `VANISH` trials are excluded from `outcomeFor` |
| `SLOW` | 2 (unchanged) | 0 | true | none |
| `MISS` | 2 (**unchanged** — we made it harder, not them) | 0 | true | none |

On `MISS` the rescue chain re-presents at cue 2, correct → `SLOW`, trial terminates in success. If `it_0203`'s only other trials that session are at its floor of 2 and all `CLEAN`, the outcome is `CLEAN_SESSION` → `acrossRung + 1`, and `stableSessions` is **not** incremented because `vanishResolved === true`. The next attempt on that item is therefore two qualifying sessions away, win or lose.

---

### WE-7 — the hospital return (`overdueReturn`)

**NOT chained.** Entering state: `S0` with `it_0402` set to `tier 2, cueLevel 1, acrossRung 4, stableSessions 2, lastSeenAtMs = 1801303269500`, and `participant.lastSessionEndedAtMs = 1801303269500`.
Session F at `SF = 1801303269500 + 1900000000 = 1803203269500` (≈22 days later).

```
effectiveAcrossRung(item, 0) = clamp(4, 0, 6) = 4  ->  ACROSS_LADDER_MS[4] = 604800000
clampGap(SF − lastSeenAtMs) = 1900000000 > 2 × 604800000 = 1209600000   ->  overdueReturn = TRUE
```

Also, `clampGap(SF − participant.lastSessionEndedAtMs) > LONG_ABSENCE_MS` → `gentleSessionsRemaining = max(g, 1)` at `SessionStarted` → `gentleActive = true` as well.

Result: `canVanish` fails (twice over); opening cue `= min(min(1+1,3)+1, 3) = 3` — one rung for `gentleActive`, one for `overdueReturn`, clamped — `trialClass = SUPPORTED`, grade `EXPOSURE`, one trial.

```
outcome        = SUPPORTED_SESSION
acrossRung     = 4   HOLD          <- no expansion after a three-week absence
stableSessions = 0
cueLevel       = 1   UNCHANGED     <- the transform never writes the floor;
                                      the item springs back next session
```

Without this rule the first session home from hospital would have opened with a **vanish attempt at free recall** on every eligible item at once, for someone three weeks deconditioned with probable hospital-acquired delirium.

---

### WE-8 — a fully degraded deck: the fixed point

Eight items, all `cueLevel 3`, `acrossRung 0`, `stableSessions 0`, `driftLevel 0`, `gentleActive false`.

Each item: opening cue 3 → `EXPOSURE` → `withinDone = true` at trial close → **one trial each, 8 trials, ~2 minutes**, then `END('roster_exhausted')` → `CLOSER` → `END`.

```
every item: outcome EXPOSURE_SESSION -> acrossRung HOLD 0, stableSessions 0 -> 1
            dueAtMs = lastSeenAtMs + ACROSS_LADDER_MS[0] = lastSeenAtMs + 5400000  (90 min)
presented = 8, missed = 0, missRatePpt = 0, supportIdxMilli = Math.floor(1000×24/8) = 3000
endedOnSuccess = true
```

After the **second** such session `stableSessions = 2` on all eight — and **exactly one** of them gets a vanish attempt in session three, because `VANISH_PER_SESSION = 1` is deck-wide. Worst case: **one** recorded miss, rescued warmly, and that item's streak resets. Without the deck-wide cap this is eight simultaneous two-alternative questions the person cannot answer, roughly half of them coin-flip "successes" that promote a floor which then fails — a confrontation schedule that **accelerates with decline**.

Session duration is honestly short. There is nothing to practise, and 8 warm exposures is the correct session for that person.

---

### WE-9 — distress

Session G, five items presented, `it_0203` on screen. At mono 340000 a `DistressReported{itemId: 'it_0203', severity: 'moderate', source: 'caregiver_report'}` arrives.

```
1. activeSession.endRequested = 'distress_stop'
2. it_0203.status = 'absorbing_distress'
3. nextTrial -> END('distress_stop')   — NO CLOSER (requirement 14 outranks P1)
4. SessionEnded{reason:'distress_stop', closerPresented:false}:
     S2 runs (outcomes computed for MEASUREMENT)
     S3, S4 SKIPPED  -> NO item's acrossRung, cueLevel, stableSessions, lastSeenAtMs,
                        dueAtMs or sessionsSincePresented changes
     S5 computes presented = 5, missRatePpt and supportIdxMilli from the pre-session floors
     S6 pushes the summary with endedOnSuccess = FALSE, endReason 'distress_stop'
     S7 gentleSessionsRemaining = max(max(g−1,0), GENTLE_ON_DISTRESS (2)) = 2
     S8 drift evaluated (the adverse session IS in the window)
     S9 sessionCount += 1 ; lastSessionEndedAtMs = anchorMs
     S10 dueAtMs recomputed for all items (moves only if driftLevel moved)
     S11 activeSession = null
```

`signals()` now returns `{kind:'items_set_aside', itemIds:['it_0203']}`. The next **two** sessions run with `gentleActive = true` and every vanish attempt suppressed. `it_0203` returns only on `ItemReEnabled`, which restores it at `cueLevel 3, acrossRung 0, stableSessions 0, dueAtMs = anchorMs + 5400000`.

A `DistressReported{itemId: null}` absorbs `session.lastPresentedItemId` if non-null, otherwise no item; everything else is identical.

---

### WE-10 — crash, then restart (rule R2)

```
events (canonical order):
  1 SessionStarted   {sessionId:'S1', bootId:'B1', seq:1, anchorMs: X,        startedMonoMs: 0}
  2 TrialCompleted   {sessionId:'S1', bootId:'B1', seq:2, ... it_0042 CLEAN, terminalMonoMs 13200,
                                                            terminalAnchorMs X+13200}
  3 TrialCompleted   {sessionId:'S1', bootId:'B1', seq:3, ... it_0203 CLEAN, terminalMonoMs 31000,
                                                            terminalAnchorMs X+31000}
     <battery dies — no SessionEnded is ever written>
  4 SessionStarted   {sessionId:'S2', bootId:'B2', seq:4, anchorMs: X+86400000, startedMonoMs: 0}
```

At event 4, R2 fires (`sessionId` and `bootId` both differ): the full §12.2 pipeline runs for `S1` with `reason:'app_crash'`, `closerPresented:false`, `anchorMs = max(X, X+86400000) = X+86400000`. **Both clean trials count**: `it_0042` and `it_0203` each get `CLEAN_SESSION` → `acrossRung + 1` (clamped by tier), `stableSessions + 1`, `lastSeenAtMs` set from their own `lastTerminalAnchorMs` (`X+13200`, `X+31000`). The summary records `endedOnSuccess: false, endReason: 'app_crash'`. **Then** `S2` opens against the updated state.

Discarding would have been the other defensible reading and is **forbidden**: telemetry §7 states that abandonment and device failure "mean opposite things clinically and must never be indistinguishable", and a discard makes `app_crash` behaviourally identical to a clean end.

A `TrialCompleted` arriving with `bootId: 'B2'` while `S1/B1` is open closes `S1` the same way; the trial then finds `activeSession === null` and returns the state unchanged (R4). Its `monoMs` was never compared across the boot boundary.

---

### WE-11 — replay and duplicate delivery (invariant I-2)

```
log      = [e1, e2, e3]  with (deviceId 'd1', seq 1,2,3)
doubled  = [e1, e1, e2, e2, e3, e3]
fold(config, log)  deep-equals  fold(config, doubled)
```

Because `e1` raises `seqHighWater['d1']` to 1, the second `e1` satisfies R0 (`1 <= 1`) and returns the state **by reference**. A test may assert `reduce(s, e) === reduce(reduce(s, e), e)` by identity for every event type.

Two devices in the same millisecond: `{anchorMs: 1800000000000, deviceId: 'd1', seq: 7}` and `{anchorMs: 1800000000000, deviceId: 'd2', seq: 7}` are ordered `d1` before `d2` by `strAsc` on `deviceId`. There is one correct order and one resulting state.

---

### WE-12 — roster ordering: many due, one due, zero due

`nowAnchorMs = N = 1800000000000`. Five active, ready, previously-seen items:

| itemId | tier | dueAtMs | lastSeenAtMs | ssp | `PRIORITY_KEY` |
|---|---|---|---|---|---|
| `it_a` | 1 | `N − 1000` | `N − 400000000` | 0 | `[1, 0, 1, N−1000, N−400000000, 'it_a']` |
| `it_b` | 1 | `N + 1000` | `N − 100000` | **4** | `[0, 1, 1, N+1000, N−100000, 'it_b']` |
| `it_c` | 2 | `N − 5000` | `N − 500000000` | 0 | `[1, 0, 2, N−5000, N−500000000, 'it_c']` |
| `it_d` | 3 | `N − 5000` | `N − 600000000` | 0 | `[1, 0, 3, N−5000, N−600000000, 'it_d']` |
| `it_e` | 2 | `N + 86400000` | `N − 3600000` | 0 | `[1, 1, 2, N+86400000, N−3600000, 'it_e']` |

**Expected `planRoster(state, N).itemIds` = `['it_b', 'it_a', 'it_c', 'it_d', 'it_e']`, `forcedMissing = []`.**
`it_b` is **not due** and comes first because `isForced` (tier 1, `sessionsSincePresented 4 >= 3`) is component 0 of the key. That is requirement 6's frequency floor beating due-ness.

**Zero due items:** set every `dueAtMs = N + 86400000` and every `ssp = 0`. Order becomes `[1,1,tier,dueAtMs,lastSeen,itemId]` → `['it_a', 'it_b', 'it_c', 'it_e', 'it_d']`. **The roster is still filled to `min(8, 5) = 5`.** A session is never short and never empty.

**One due item:** identical shape; the due item sorts into the `dueFlag = 0` group and everything else follows. No branch of `planRoster` is conditional on how many items are due.

**String tie-break, pinned:** two items identical but for `itemId`, `'it_10'` and `'it_9'`. `strAsc` is UTF-16, **not numeric**: `'1' < '9'`, so **`it_10` sorts first**. Fixtures must use zero-padded ids to avoid surprising humans, but the rule is the rule.

**Backlog, absent:** the same five items after 1 skipped day and after 30 skipped days produce rosters of the **same length and the same shape**; only the ordering within the `dueFlag = 0` group differs. Nothing accumulates, no counter increments, and there is no exported function that could report a due count.

---

### WE-13 — the tier-1 floor squeezed

14 active tier-1 items, all with `sessionsSincePresented >= 3`, plus 6 tier-2 items. `planRoster` returns the first 8 by `PRIORITY_KEY` (all forced, so ordered by `[dueAtMs, lastSeenAtMs, itemId]` within tier 1) and `forcedMissing` = the other 6, **ascending `itemId`**.

`signals(state, now)` returns `[{kind:'tier1_floor_unsatisfied', itemIds:[…6 ids…]}]` — to the caregiver **authoring** surface, worded as a scheduling fact ("these will appear about every third session rather than every other one"), never as a user error and never to the patient.

---

### WE-14 — the delirium-shaped crash, and the detector that survives it

A UTI on day 40 of a deck of 8 tier-1/2 items at `cueLevel 1`.

| day | what happens | `missRatePpt` | floors after close | `supportIdxMilli` |
|---|---|---|---|---|
| ≤ 39 | baseline | 0 | `1×8` | 1000 |
| 40 | 6 of 8 items miss at floor | `Math.floor(1000×6/8) = 750` | six rise to 2, two stay 1 → Σ 14 | 1750 |
| 41 | `gentleActive = true` → every item opens one rung up; cue-2 items become cue-3 **exposures, which cannot be missed** | **0** | Σ 14 | 1750 |
| 42 | still elevated; two more items miss at their new floors | 250 | Σ 16 | 2000 |

**A miss-rate-only detector is dead here**: day 41's zero is manufactured by the engine's own compensation. The support index is not, because `gentleActive` never writes `cueLevel`.

`acuteChange` at day 42 with `base` = 6 sessions from days 14–35 with `supportIdxMilli [1000,1000,1200,1000,800,1000]` and `recent` = days 40, 41, 42 with `[1750,1750,2000]`:

```
median(base)   sorted [800,1000,1000,1000,1000,1200], n=6 even -> floor((1000+1000)/2) = 1000
median(recent) sorted [1750,1750,2000], n=3 odd       -> 1750
1750 − 1000 = 750 >= ACUTE_SUPPORT_DELTA_MILLI (750)  AND  1750 >= 1500   -> FIRE, limb 'support'
```

Miss limb, for contrast: `median(recent missRatePpt) = median([750,0,250]) = 250`; `median(base) = 0`; `250 − 0 = 250 < 300` → would **not** fire. The support limb is the one that catches the crash the engine is masking.

`signals()` returns `{kind:'acute_change_suspected', limb:'support'}`. The scheduler **changes nothing**. The caregiver surface renders only the P25 physical-illness sentence. After `AcuteSignalDelivered`, the rate limit blocks re-firing for 14 days.

**Recovery.** The infection is treated; day 46 onward is clean; `gentleSessionsRemaining` decays to 0; each item's floor falls one rung per two qualifying sessions through the single deck-wide vanish slot; `acrossRung` climbs one rung per clean session, clamped by tier. Nothing was retired, suspended or flagged, and no interval was ever changed by the detector.

**Absence limb.** With `prior` = 11 sessions in `(N−30d, N−7d]` and `silent` = 0 sessions in `(N−7d, N]`, limb 1 is skipped (`recent.length 0 < 2`) and limb 3 fires `'absence'`. At an adherence of one session a fortnight, limb 3 is the **only** reachable limb, which is why it exists.

---

### WE-15 — the void trial (the doorbell)

`it_0042` at floor 1, `acrossRung 4`. Presented at cue 1; the caregiver answers the door; the runtime commits `{correct: false, latencyMs: 400000, attemptIndex: 0, interrupted: true, appBackgroundedMs: 92000}`.

```
isVoid -> true  (three separate reasons)
EXPECTED STATE DELTA, COMPLETE:
  item.repetitionNumber      += 1
  entry.nextEligibleMonoMs    = terminalMonoMs + WITHIN_LADDER_MS[entry.withinRung]
  session.lastPresentedItemId = 'it_0042'
  EVERYTHING ELSE UNCHANGED: cueLevel 1, acrossRung 4, stableSessions, withinRung,
  trialsThisSession, trialsCompleted, entry.trials, lastSeenAtMs, dueAtMs — all unchanged.
```

Without this rule one doorbell demotes the daughter's photograph a cue rung, contracts her interval a rung, and makes the whole next session gentler.

**The mirror case:** `{correct: true, latencyMs: 180, cueLevel: 2, attemptIndex: 0}` — a tremor resting a finger on the screen, correct by coin flip on a two-alternative trial. `latencyMs < 300` → **VOID**. Otherwise it would be the single strongest positive signal the engine can receive, and two of them would arm a vanish attempt.

---

### WE-16 — clock skew in both directions

| case | input | expected |
|---|---|---|
| Clock jumps **backwards** 6 h between sessions | `lastSeenAtMs = Y` on **all six** items, `sessionStartAnchorMs = Y − 21600000`, and `lastSessionEndedAtMs = Y` | `clampGap(−21600000) = 0`; `overdueReturn = false` for every item; `daysSinceLastReview = 0`. **`participant.clockAnomalyCount` goes 0 → 1, not 0 → 7.** The clamp binds seven times inside this one `SessionStarted` — once in the long-absence check and once per roster entry — and the counter moves by exactly **+1**, because the rule is per event (§1.3). The item is treated as **just seen** — the gentle direction. No `NaN`, no negative interval, no exclusion from selection. |
| Clock is **26 years** behind (dead RTC) | `sessionStartAnchorMs − lastSeenAtMs = 820000000000` | `clampGap` returns `315360000000` (3650 d); `clockAnomalyCount += 1` (again, once for the event); `overdueReturn = true`; the session runs at one extra rung of support with vanish suppressed. |
| The **same** skewed session is folded twice | the identical `SessionStarted`, replayed | R0 fires on the replay and returns the state **by reference**, so `clockAnomalyCount` stays at 1. The counter is idempotent under replay because it lives behind R0, like everything else. |
| `planRoster(state, skewedAnchorMs)` called **directly** | any clamp-binding gap | Returns the roster. **`clockAnomalyCount` does not move** — only `reduce` counts (§1.3). Same for `signals`, `trialTelemetry`, `acuteChange` and `nextTrial`. |
| Clock corrected **mid-session** | irrelevant | Within-session timing is `monoMs` scoped to `bootId` and is untouched by any wall-clock correction. The session budget, `nextEligibleMonoMs` and `latencyMs` cannot move. |
| Batch skew reorders one device's own events | `anchorMs` non-monotone in `seq` | The **ingest boundary** must apply a running maximum (§6.1). If it does not, R2 closes the mis-ordered session as `app_crash` rather than corrupting it, and `ordering/out-of-order-batches.json` fails loudly. |

---

### WE-17 — `seqHighWater` advances on a no-op (R1 beats R3–R12)

**NOT chained.** From `S0` (`seqHighWater = {d1: 100}`), fold one event that every §6.4 rule makes a behavioural no-op:

```
e = TrialCompleted { deviceId:'d1', bootId:'B1', seq:101, anchorMs: 1800100000000,
                     sessionId:'S_X', itemId:'it_9999', openingCueLevel:1, floorCueLevel:1,
                     trialClass:'FLOOR', isCloser:false, attempts:[...one attempt...],
                     terminalMonoMs: 5000, terminalAnchorMs: 1800100005000 }
```

R4 fires first (`activeSession === null`). **Expected:**

```
result deep-equals S0 EXCEPT  seqHighWater = { d1: 101 }
result !== S0                 (NOT reference-equal — R1 built a new top-level object)
```

Then folding the identical `e` again hits R0 and returns **by reference**: `reduce(reduce(S0,e),e) === reduce(S0,e)`. Both halves matter: without R1 the deep-equality fixtures diverge by a `seqHighWater` entry; without R0's reference return, I-2's identity assertion fails. Repeat the same shape for each of R3, R5, R6, R7, R8, R9, R10, R11, R12 — ten rows in `sessions/no-op-seq.json`, all with the same expected shape.

---

### WE-18 — `DistressReported` naming an unknown item still ends the session

**NOT chained.** From `S0`, open session `S_G` at `SG = 1800349000000`, complete two trials for `it_0042` (`CLEAN`, `CLEAN`), then:

```
DistressReported { sessionId:'S_G', itemId:'probe_007', severity:'mild',
                   source:'patient_control' }
```

`'probe_007'` is not a key of `state.items` — it is a probe id, so it never was. **Expected:**

```
activeSession.endRequested = 'distress_stop'      <- SET. R5 does not apply to DistressReported.
no item's status changes                          <- step 3 skipped; there is nothing to absorb
nextTrial(state, t) = { kind:'END', reason:'distress_stop' }   <- no CLOSER
signals(state, now) contains NO items_set_aside entry
```

then on `SessionEnded{reason:'distress_stop', closerPresented:false}`: S1's `distress = true`, **S3 and S4 are skipped**, so `it_0042` keeps `cueLevel 1, acrossRung 3, stableSessions 1, lastSeenAtMs 1800000000000, dueAtMs 1800345600000` — its two clean trials count for nothing — and `sessionsSincePresented` stays 0 for every item. S6 pushes `{presentedItems: 1, missRatePpt: 0, supportIdxMilli: 1000, endedOnSuccess: false, endReason:'distress_stop'}`. S7 gives `gentleSessionsRemaining = 2`.

**`severity: 'mild'` produces exactly this too**, and so does `'severe'`: §5.1 note 6. A fixture that expects the three to differ is wrong.

**The variant that closes the other hole:** replace the final event with `SessionEnded{reason:'user_ended', closerPresented:true}`. S1's second disjunct still sets `distress = true` (because `endRequested === 'distress_stop'`), so S3/S4 stay skipped and no item transitions — but the summary honestly records `endReason:'user_ended'` and `endedOnSuccess: true`. The pipeline branch follows the distress, the record follows the event.

---

### WE-19 — a trial naming a set-aside item is a total no-op (R11)

**NOT chained.** From WE-18's post-distress state, `it_0203` has been absorbed by a prior report and `status === 'absorbing_distress'`, but it still has a roster entry in the open session. Fold:

```
TrialCompleted { sessionId:'S_G', itemId:'it_0203', openingCueLevel:2, floorCueLevel:2,
                 trialClass:'FLOOR', isCloser:false,
                 attempts:[{correct:false, cueLevel:2, latencyMs:5000, attemptIndex:0,
                            interrupted:false, appBackgroundedMs:0}], ... }
```

**Expected: state unchanged but for `seqHighWater`.** `it_0203.repetitionNumber`, `.cueLevel`, `.stableSessions`, the entry's `trials`, `trialsThisSession`, and `session.trialsCompleted` and `.lastPresentedItemId` **all hold**. Without R11 the §8.3 "always" block would have moved five of those on an item the precedence table calls invisible. Unreachable from `nextTrial`; trivially reachable from a generated log.

---

### WE-20 — `ItemReEnabled` resets an already-active item

**NOT chained.** From `S0`, fold `ItemReEnabled{itemId:'it_0402', by:'caregiver', anchorMs: 1800400000000}`. `it_0402` is `status: 'active'` already. **Expected — the full reset applies anyway:**

```
status                 = 'active'      (unchanged in value, written anyway)
cueLevel               = 3             <- was 1
acrossRung             = 0             <- was 5
stableSessions         = 0
sessionsSincePresented = 0
dueAtMs                = 1800400000000 + 5400000 = 1800405400000
tier 2, recognitionBlocked false, contentReady true, addedAtMs 1799136000000,
lastSeenAtMs 1800000000000, repetitionNumber 30       <- ALL UNTOUCHED
```

R10 covers `ItemRetired` only. The no-op reading is withdrawn.

---

### WE-21 — the second probe block is dropped (R12)

**NOT chained.** From `S0` with `config.probeItemIds = ['p_1','p_2','p_3']` and `participant.probeDisabled = false`, open a session at `SA`, then fold two probe completions in a row:

```
1. ProbeBlockCompleted { sessionId:'S_A', elapsedMs: 45000,  truncated: false }
2. ProbeBlockCompleted { sessionId:'S_A', elapsedMs: 200000, truncated: true  }
```

**Expected after both:** `probeEmitted true`, `probeElapsedMs 45000`, `probeTruncated false`, `participant.lastProbeLocalDay 20837`. The second event moves **only** `seqHighWater`: no overwrite (which would have credited 120000 after clamping) and no accumulation (which would have credited 120000 too, by a different route). The first block wins.

Had the *first* event been the truncated one, `probeElapsedMs = clamp(200000, 0, 120000) = 120000` and `probeTruncated = true`, and `sessionTelemetry` would report that pair.

Before either event, `probeDue(state, nowMonoMs)` is `true` once `nowMonoMs - startedMonoMs - probeElapsedMs >= Math.floor(600000 / 2) = 300000`, and `nextTrial` returns `{kind:'PROBE_BLOCK', probeItemIds:['p_1','p_2','p_3']}` on **every** call until one is folded — asserted twice in a row on the same `(state, nowMonoMs)`.

---

### WE-22 — an `ItemAdded` naming a probe id is dropped (R8)

**NOT chained.** From `S0` with `config.probeItemIds = ['p_1','p_2','p_3']`, fold
`ItemAdded{itemId:'p_2', tier:2, recognitionBlocked:false, contentReady:true}`.

**Expected:** `state.items` still has exactly the six canonical keys; `'p_2'` is **not** among them. `config.probeItemIds` and `state.items` are disjoint in every reachable state, so requirement 13's "satisfied by absence" now has a mechanism rather than a convention.

For contrast, `ItemAdded{itemId:'it_0600', tier:2, recognitionBlocked:false, contentReady:true, anchorMs: 1800400000000}` **is** inserted, with `cueLevel 2, acrossRung 0, stableSessions 0, status 'active', lastSeenAtMs null, dueAtMs 1800400000000, addedAtMs 1800400000000, sessionsSincePresented 0, repetitionNumber 0`. If a session is open when it arrives, it is **absent from that session's roster** and first becomes schedulable at the next `SessionStarted` (§6.5).

---

### WE-23 — the payload that disagrees with itself

**NOT chained.** From `S0` with an open session and `it_0042` on the roster at floor 1, fold a trial whose declared opening cue and whose attempt-0 cue disagree — reachable only from a generated log, and fully defined:

```
TrialCompleted { itemId:'it_0042', openingCueLevel: 3, floorCueLevel: 1, trialClass:'SUPPORTED',
                 isCloser:false,
                 attempts:[{correct:false, cueLevel:1, latencyMs:5000, attemptIndex:0,
                            interrupted:false, appBackgroundedMs:0}],
                 terminalMonoMs: 20000, terminalAnchorMs: <SA + 20000> }
```

**Expected — each rule reads its own field (§9.4), and nothing is reconciled:**

```
g0 = gradeOf(attempts[0]) = MISS            <- reads attempts[0].cueLevel (1), NOT openingCueLevel
cueLevel = min(floorCueLevel + 1, 3) = 2    <- reads floorCueLevel, NOT attempts[0].cueLevel
stableSessions = 0 ; cueRaisedThisSession = true
withinRung UNCHANGED at 0                   <- the MISS row of §8.3
withinDone = TRUE                           <- reads openingCueLevel (3); §8.2 wins
trials = [ {MISS, SUPPORTED} ]              <- trialClass from the payload
```

The item leaves rotation on a `MISS`, which `nextTrial` can never produce and which §21's arbitrary interleavings certainly will. It is one state, not two.

---

### WE-24 — `trialTelemetry` for the generic closer, and for a real trial

**NOT chained.** During session A of WE-2, at `nowMonoMs = 200000`, `nowAnchorMs = 1800349200000`, with `it_0042` due to be presented at opening cue 1 and its entry holding `withinRung 2`, `lastTerminalMonoMs 94000`, `nextEligibleMonoMs 114000`:

```
trialTelemetry(state, {kind:'TRIAL', itemId:'it_0042', openingCueLevel:1, floorCueLevel:1,
                       trialClass:'FLOOR', foilItemId:null}, 1800349200000, 200000) =
{ itemId:'it_0042', itemTier:1, repetitionNumber:32,
  daysSinceLastReview: Math.floor(clampGap(1800349200000 - 1800000000000)/86400000) = 4,
  daysSinceFirstIntroduction: Math.floor(clampGap(1800349200000 - 1799136000000)/86400000) = 14,
  scheduledIntervalMs: 345600000, acrossIntervalDeviationMs: 349200000 - 345600000 = 3600000,
  withinSessionRung: 2, withinIntervalDeviationMs: 200000 - 114000 = 86000,
  attainedRung: 3, driftAdjustmentApplied: 0, difficultyFloorTriggered: false,
  overdueReturnApplied: false,
  openingCueLevel: 1, floorCueLevel: 1, wasVanishAttempt: false,
  presentationMode: 'cued_recall', nDistractors: 0, isCloser: false,
  stability: null, difficulty: null, retrievability: null, predictedRecallProbability: null }
```

`withinIntervalDeviationMs` is `+86000` — presented 86 s **late**, which is ordinary (§8.4) and is why the field is signed and needs no clamping. `nDistractors` is 0 because the opening cue is 1; at cue 2 it would be 1 and `presentationMode` would be `'recognition'`.

And the case the previous revision's non-nullable types made unrepresentable (E17):

```
trialTelemetry(state, {kind:'CLOSER', itemId: null}, anyAnchor, anyMono) =
  the all-null shape printed in §17.3 — itemId null, itemTier null, repetitionNumber 0,
  every interval and rung field null, openingCueLevel 3, floorCueLevel 3,
  presentationMode 'familiarity_exposure', nDistractors 0, isCloser true.
```

It returns; it does not throw.

---

## 20. Edge-case register — every case an attacker raised, with its defined behaviour

| # | Case | Defined behaviour | Where |
|---|---|---|---|
| E1 | Device wall clock is wrong / jumps / goes backwards | `anchorMs` is server-anchored, never `Date`; all gaps pass `clampGap` and increment `clockAnomalyCount`. Within-session timing is `monoMs` and is unaffected. | §1.3, WE-16 |
| E2 | `performance.now()` restarts (force-quit, low-memory kill) | R2 closes the session as `app_crash` before any cross-boot `monoMs` comparison can occur. | §6.3, WE-10 |
| E3 | Session never ends (battery death) | R2 runs the full close pipeline with `reason:'app_crash'`, `closerPresented:false`. Evidence is kept; `app_crash` is distinguishable from a clean end. | §6.3, WE-10 |
| E4 | Duplicate event delivery / retried SQLite write / replayed batch | R0 drops any `seq <= seqHighWater[deviceId]` and returns the state **by reference**. | §6.2, WE-11 |
| E5 | Two events in the same millisecond from different devices | `canonicalOrder` includes `deviceId`; the order is total and single-valued. | §6.1, WE-11 |
| E6 | Per-batch skew makes `anchorMs` non-monotone within one device | Stated **boundary obligation**: running maximum per device before `fold`. Violation degrades to `app_crash`, never to corruption. | §6.1 |
| E7 | Device projection ≠ server fold | Declared: they agree iff they folded the same set. One-device-per-patient is a stated product precondition, not an assumed property. | §6.1 |
| E8 | Backlog after a week / a month / a year away | `dueAtMs` is recomputed from `lastSeenAtMs`; nothing accumulates; the roster is the same shape; `overdueReturn` makes the return session gentler and non-expanding. **No exported due count.** | §9.2, §11.1, WE-7, WE-12 |
| E9 | Delirium-shaped crash and recovery | Cue floors rise (one per item per session), `acrossRung` contracts, `gentleSessionsRemaining` fires, the **support-index** acute limb survives the engine's own masking, nothing is retired. | §17.1, WE-14 |
| E10 | Distress mid-trial | Session ends immediately with **no closer**; the item absorbs; **no per-item transitions apply to any item**; the summary is still pushed; the next two sessions are gentle and vanish-free; `items_set_aside` signals the caregiver. | §15.1, WE-9 |
| E11 | `DistressReported` with `itemId: null` | Absorbs `session.lastPresentedItemId` if non-null, else no item. Session ends identically. | §15.1 |
| E12 | Abandonment / repeated skipping | `SessionEnded{reason:'abandoned'}`. **Changes no item state.** There is no `abandonment` distress source and no skip counter, in the type. | §15.2 |
| E13 | Zero due items | Roster still filled to the §11.1 length `min(8, freshAllowed + returning)`; ordering shifts, nothing else. Due-ness is a sort key, never a filter. | §11.1, WE-12 |
| E14 | Exactly one due item | No special branch exists; it sorts into the `dueFlag = 0` group. | WE-12 |
| E15 | Many due items (deck ≫ 8) | Truncation at 8 by a strict total order; `forcedMissing` signalled, never dropped silently. | §11, WE-13 |
| E16 | Roster of size 1, or the only candidate is the last-presented item | `FILLER` (generic P11 item, ungraded, never in `state.items`), capped at `SESSION_MAX_FILLERS`. | §10.1 |
| E17 | Empty roster / every item retired or absorbed mid-session | `END('roster_exhausted')` → `CLOSER(null)` → generic P11 closer → `endedOnSuccess` follows `closerPresented`. **No `min` over an empty set anywhere.** | §10.2 |
| E18 | Media not downloaded yet | `contentReady === false` excludes the item from `eligible`, from foil pools, and from closer candidates — so it cannot occupy a forced tier-1 slot in an unbreakable loop. | §11, ADR §4.2 |
| E19 | Latency 0, or 180 ms, or 400 000 ms; `interrupted`; app backgrounded | `isVoid` → the trial is VOID and transitions nothing but `repetitionNumber` and `nextEligibleMonoMs`. | §7.3, WE-15 |
| E20 | `latencyMs` exactly at a boundary (`8000` / `8001` / `300` / `299`) | Pinned: `>` is strict; `<` is strict. 128-row exhaustive fixture. | §7.1–7.2, WE-1 |
| E21 | Deceased / estranged person in the deck | `recognitionBlocked`: forced cue 3, no vanish, excluded from every foil pool, de-preferred as closer. | §15.3 |
| E22 | Every item degraded to cue 3 | One exposure each, ~8 trials, `roster_exhausted`, ~2 minutes; **exactly one** vanish attempt deck-wide per session. | §8.2, §9.3, WE-8 |
| E23 | DLB alternating good/bad sessions | Cue rises at most **once per item per session**; a gentle session classifies `SUPPORTED_SESSION` so it neither expands the interval nor banks a stable session; drift needs 3 consecutive above-target sessions **and** 6 qualifying sessions in 14 days. | §9.4, §13.1, §14 |
| E24 | Apathy: one session a fortnight | `LONG_ABSENCE_MS` forces a gentle first session back; `overdueReturn` adds a rung; the acute **absence** limb is the one detector that works at that density. Drift will not fire — declared, not hidden. | §12.1, §17.1, §25 |
| E25 | First-ever session of a new participant | 2 fresh items, roster of 2, `FILLER` between repetitions. Ramp table in §11.3. | §11.3 |
| E26 | Caregiver bulk-adds 40 items at onboarding | 1 new item per session thereafter; `ItemAdded` sets `dueAtMs = addedAtMs` explicitly, so there is no coercion ambiguity and no 40-item first session. | §6.5, §11 |
| E27 | `TrialCompleted` naming an unknown `itemId` (probe, or deleted) | State unchanged (R5). Probe items are not in `state.items` at all. | §6.4, §16 |
| E28 | Two sessions on the same local day | Second session gets no probe block (`lastProbeLocalDay`); everything else is ordinary. | §16 |
| E29 | DST boundary / participant travels | `tzOffsetMinutes` frozen at enrolment to **standard** time. `localDayIndex` is a study clock, not a wall calendar. Declared. | §1.4 |
| E30 | `SetTier` mid-deployment | `acrossRung = min(acrossRung, CEILING_RUNG[newTier])`, then `dueAtMs` recomputed. | §6.5 |
| E31 | `ItemReEnabled` after distress | `cueLevel 3, acrossRung 0, stableSessions 0, dueAtMs = anchorMs + 90 min`. Re-earns its way up through the ordinary rules. | §6.5 |
| E32 | No foil available at cue 2 (deck of one tier) | The attempt is presented at cue 3 instead and grades `EXPOSURE`. | §9.1, §9.5, `it_0555` in §19.0 |
| E33 | An event that every §6.4 rule makes a no-op | `seqHighWater[deviceId]` **still advances** (R1 outranks the table); a **new** top-level object is returned. Reference identity is guaranteed by R0 and by nothing else. | §6.2, WE-17 |
| E34 | `DistressReported` naming a probe id, a deleted id or a typo | **R5 does not apply.** The session still ends with no closer, still forces the distress branch, still yields `GENTLE_ON_DISTRESS`. Only the absorb step is skipped. | §15.1, WE-18 |
| E35 | Two `DistressReported` in one session | Both processed; `endRequested` is idempotent; each absorbs its own subject item. Two items can be set aside from one session. | §15.1 |
| E36 | `SessionEnded` with a non-distress reason after a `DistressReported` | S1's second disjunct forces `distress = true`, so S3/S4 stay skipped. The summary still records the literal `endReason`. | §12.2 S1, WE-18 |
| E37 | `TrialCompleted` for a `retired` or `absorbing_distress` item that still holds a roster entry | Rule R11: total no-op. Makes precedence ranks 1–2 real rather than aspirational. | §6.4, §15.1, WE-19 |
| E38 | `ItemReEnabled` for an item that is already `active` | Full ladder reset applies: cue 3, rung 0, stable 0, `dueAtMs = anchorMs + 90 min`. Not a no-op. | §6.5, WE-20 |
| E39 | Second `ProbeBlockCompleted` in one session | Rule R12: dropped. No overwrite, no accumulation. The first block's `elapsedMs` and `truncated` stand. | §16, WE-21 |
| E40 | `PROBE_BLOCK` is never completed | `nextTrial` re-offers it on every call, by design. `probeElapsedMs` stays 0, so `budget_time` still fires and the CLOSER/END path still runs. Not a hang. | §10, WE-21 |
| E41 | `ItemAdded` naming an id in `config.probeItemIds` | Rule R8: dropped. `config.probeItemIds` and `state.items` are disjoint in every reachable state. | §6.4, WE-22 |
| E42 | `ItemAdded` mid-session | Inserted into `state.items` at once; **absent from the open session's roster**, which is fixed at `SessionStarted`. Schedulable from the next session. | §6.5, WE-22 |
| E43 | `openingCueLevel`, `floorCueLevel` and `attempts[0].cueLevel` disagree | Each rule reads exactly one stated field; nothing is reconciled or recomputed. Single-valued, and the adapter emits `presentation_mismatch`. | §9.4, WE-23 |
| E44 | `CLOSER` with `itemId: null` passed to `trialTelemetry` | Returns the stated all-null shape. Every item-derived field is nullable in the return type. Never throws. | §17.3, WE-24 |
| E45 | Backwards clock binding `clampGap` nine times in one `SessionStarted` | `clockAnomalyCount` moves by exactly **+1**. Per event, never per call. | §1.3, WE-16 |
| E46 | `planRoster` / `signals` / `trialTelemetry` called directly with a skewed clock | They compute and return; `clockAnomalyCount` does **not** move. Only `reduce` counts. | §1.3, WE-16 |
| E47 | Duplicate `sessionId` in `participant.history` | Not prevented, not an error. The §14 window sort's third key (`historyIndex`) keeps it a strict total order. | §14 |
| E48 | `nowMonoMs < activeSession.startedMonoMs`, or a negative `startedMonoMs` | Stored and used verbatim; elapsed goes negative, so the budget check is simply false. Nothing clamps, nothing throws. | §10 |
| E49 | `nextTrial` called with a `nowMonoMs` from another boot | **Undefended** — the signature carries no `bootId`. A declared caller obligation enforced in `policies.ts`, not here. R2 protects the fold only. | §10 |
| E50 | `latencyMs > MAX_LATENCY_MS`, `attempts.length > 4`, `attemptIndex` gaps, `seq` gaps | All accepted and folded as the rules read them. Only `attempts[0]` drives state; `gradeOf` compares against `slowLatencyMs` alone. | §2.3, §5.1 |
| E51 | A `fold` input violating §6.1's per-device monotonicity | Tolerated, not detected: no check, no sort, no throw. R2 degrades the worst case to `app_crash`. | §6.2 |
| E52 | `DistressReported.severity` of `mild` vs `severe` | **Behaviourally identical.** Carried for the record; consumed by nothing. | §5.1 note 6 |

---

## 21. Invariants — write these as property-based tests over arbitrary event logs

Generate random canonical logs (arbitrary interleavings of every event type, arbitrary latencies including boundaries, arbitrary clock skew) and assert the table below.

**Generator contract, pinned.** "Arbitrary" is bounded, and the bounds are part of the contract:

- **Config is `defaultConfig`** with at most the five per-participant fields of §2.1 varied inside their stated domains. Malformed configs are out of scope (§2.3).
- **Events are well-typed but not well-behaved.** Generate unknown `itemId`s, empty `attempts`, foreign `sessionId`s and `bootId`s, negative gaps, `seq` gaps, out-of-range `latencyMs`, and `attempts.length` up to 8 — all of which `reduce` must absorb (I-17).
- **`seq` is strictly increasing per `deviceId`** and `anchorMs` is non-decreasing per device, because §6.1 makes that the ingest boundary's job and the module is specified against a log that already satisfies it. A generator that violates it is testing the boundary, not this module; `ordering/out-of-order-batches.json` covers that case explicitly and separately.

| # | Invariant |
|---|---|
| **I-1** | Every numeric field of `SchedulerState` satisfies `Number.isInteger` after every fold step. No `NaN`, no `Infinity`, no non-integer. |
| **I-2** | `fold(config, log)` deep-equals `fold(config, logWithEveryEventDuplicatedInPlace)`. And `reduce(reduce(s,e),e) === reduce(s,e)` **by reference identity**. |
| **I-3** | `fold(config, log) === log.reduce(reduce, initialState(config))` — replay and incremental application are identical by construction; assert it anyway. |
| **I-4** | For every item at every point: `0 <= acrossRung <= CEILING_RUNG[tier]`, and therefore `dueAtMs − lastSeenAtMs <= 2592000000` (30 d) for every item and `<= 604800000` (7 d) for every tier-1 item. |
| **I-5** | `0 <= cueLevel <= 3`; `0 <= stableSessions <= 255`; `0 <= sessionsSincePresented <= 255`; `roster.length <= 8`; `trialsThisSession <= 7`; `history.length <= 90`; `gentleSessionsRemaining <= 3`; `driftLevel <= 2`. |
| **I-6** | For every event type **except `ItemRetired`**, folding it over any state never produces an item with `status === 'retired'`. And no sequence of `TrialCompleted` events of any length, at any grades, changes any item's `status`. |
| **I-7** | If `item.recognitionBlocked` then in every `TRIAL` directive for it `openingCueLevel === 3`, it never appears as a `foilItemId`, and `canVanish` is false. |
| **I-8** | **The exported surface is exactly the frozen list of §21.1 — assert `Object.keys(module).sort()` deep-equals it.** The list contains no getter for `driftLevel` and no function returning a count of due, overdue or pending items; freezing the list *is* the assertion, so adding one later fails this test. |
| **I-9** | `Attempt` has no key matching `/confidence\|rating\|self\|asr/i`. `DistressReported.source` has exactly two variants, both human. `ItemRetired.by` and `ItemReEnabled.by` have no `'algorithm'` variant. **Assert against `src/contract/schema.ts`**, which exports a plain-data `EVENT_SCHEMA: Record<SchedulerEvent['type'], readonly string[]>` listing each event type's payload keys, and `ATTEMPT_KEYS: readonly string[]`. These are the runtime artefacts the type-level claims are checked against; without them I-9 is unwritable. |
| **I-10** | **Structural, not spy-based.** The module never imports `Clock` or `Rng` and no exported function accepts one (§4). Assert: (a) the built module's source contains no occurrence of `Date`, `Math.random`, `performance`, `crypto`, `fetch`, `window` or `document` outside comments — this is the `no-restricted-globals` rule of the header, promoted to a test; (b) `fold(config, log)` called twice on the same inputs returns deeply-equal states. Spy injection is impossible by construction and must not be attempted. |
| **I-11** | `nextTrial(state, t)` is a pure function: called twice with identical arguments it returns deeply-equal results and mutates nothing. Same for `planRoster`, `signals`, `trialTelemetry`, `sessionTelemetry` and every §4.1 helper. Assert by deep-equality of a structural clone of `state` taken before and after. |
| **I-12** | **A GENERATOR constraint, not a module property.** Well-formed trial chains satisfy `attempts.length <= 4` and never end on a `MISS`; the *generator* emits only those, and requirement 7's "displayed success is 100%" is a claim about the runtime that produces the chains. `reduce` neither validates nor enforces it: a chain of length 9 ending on a `MISS` folds without complaint (only `attempts[0]` is read). Assert I-12 over the generator's output, never over `reduce`'s behaviour. |
| **I-13** | Within one session, an item's `cueLevel` increases by at most 1 (`cueRaisedThisSession`), and `session.vanishUsed` transitions `false → true` at most once. |
| **I-14** | `nextTrial` never returns `kind:'TRIAL'` with `itemId === session.lastPresentedItemId` while any other candidate exists. |
| **I-15** | **Monotone safety, restated at the only level where it is non-vacuous.** The previous fold-level phrasing was vacuous: `trialClass` and `openingCueLevel` are trusted payload facts, so replaying a fixed log under a different `gentleSessionsRemaining` yields byte-identical item state, and there is no API to "force" the field anyway. Assert instead, over arbitrary `(state, entry)` pairs: (a) `resolvePresentation` with `gentleActive: true` returns an `openingCueLevel` **>=** the one with `gentleActive: false`, and likewise for `entry.overdueReturn` and for each increment of `driftAtStart`; (b) `canVanish` is **false** whenever any of the three is set; (c) `effectiveAcrossRung(item, d+1) <= effectiveAcrossRung(item, d)` for `d ∈ {0,1}`, hence the `dueAtMs` S10 writes is **no later**. Each is a total function of its arguments and each is decidable by exhaustive enumeration over the finite domain — no log generation required. |
| **I-16** | For any log containing at least one `SessionEnded` with `closerPresented: true`, that session's `SessionSummary.endedOnSuccess === true`; and for `reason ∈ {distress_stop, abandoned, app_crash}`, `closerPresented` is `false` and `endedOnSuccess` is `false`. |
| **I-17** | `reduce` never throws, for any `(state, event)` pair drawn from the declared types — including malformed-but-typed inputs (unknown ids, empty `attempts`, foreign `sessionId`, negative gaps). |
| **I-18** | **State size is bounded, with a constant to assert against.** `JSON.stringify(state).length <= 4096 + 512 × |items| + 256 × min(90, sessionsClosed) + 64 × |devices|`. And: folding a log of 10 000 events over a fixed 40-item deck and a fixed device set yields a serialised length no greater than folding the first 1 000 — the size is a function of the deck and the 90-entry history ring, never of the event count. |
| **I-19** | **Fold order within a session is immaterial.** For any session's event array, any permutation that preserves each item's own trial order, keeps `SessionStarted` first and `SessionEnded` last, and keeps `seq` ascending per device, folds to a deeply-equal final state. This is what makes §19's item-major event logs legitimate fixture inputs (§19.0.1). |

### 21.1 The frozen export list (I-8)

```
acuteChange, acrossTransition, canVanish, clampGap, closerItemId, cueTransition,
defaultConfig, effectiveAcrossRung, evaluateDrift, foilFor, fold, gapBinds, gradeOf,
initialState, isVoid, localDayIndex, median, nextTrial, outcomeFor, overdueReturn,
planRoster, probeDue, reduce, resolvePresentation, sessionTelemetry, signals,
trialTelemetry
```

27 names, sorted. Types and interfaces are erased at runtime and are not part of the assertion. Nothing else is exported; in particular there is no `getDriftLevel`, no `dueCount`, no `overdueItems`, and no `pendingItems`. `probeDue` returns a `boolean` about the probe block and is not an item query.

---

## 22. What this module explicitly does NOT do

1. **It does not predict.** There is no stability, no difficulty, no retrievability, no recall probability, no forgetting curve, no fitted weight, and no floating-point number anywhere in its state or its arithmetic. It reacts; it does not forecast.
2. **It does not remove, retire, suspend, deprioritise or hide any item.** There is no leech threshold, no lapse counter in state, no auto-delete, no "mature card", and no interval above which an item stops appearing. Only a human event changes `status`.
3. **It does not infer emotion, affect or distress.** It only consumes `DistressReported` events whose `source` is one of two human values. No classifier, no camera read, no acoustic affect model. (EU AI Act Art. 5(1)(f).)
4. **It does not read a clock or consume randomness.** `Clock` and `Rng` are declared for ADR contract conformance and never called.
5. **It does not count, expose, or represent a backlog, a due count, an overdue count, a streak, a score, an accuracy, or a percentage.** These are not fields that happen to be private; they are concepts absent from the state model.
6. **It does not surface anything to the patient.** Its entire output surface toward humans is three `SchedulerSignal` kinds, two of which go to the caregiver *authoring* surface and one to the P25 acute-change policy.
7. **It does not surface a cognitive metric, trajectory or drift value to a clinician.** `driftLevel` has no exported getter and appears only as a research-plane telemetry field (P24, NEVER-DO #23).
8. **It does not grade from ASR, from self-report, or from any confidence signal.** Those fields do not exist on `Attempt` (P4, P27).
9. **It does not schedule, grade or adapt probe items.** Probe items are not in its state and produce no scheduler events (requirement 13).
10. **It does not own the session runtime.** The generic opener, the generic closer content, the answer-reveal, the P25 wording, the probe stimuli, the touch targets and the rescue-chain presentation all belong to the runtime. This module returns directives and folds events.
11. **It does not sync.** Scheduler state is derived, never stored, never merged (ADR §4.4).
12. **It does not emit `stability`, `difficulty`, `retrievability` or `predicted_recall_probability`.** Those four telemetry fields are `null` in v1, deliberately and with the reason recorded in the field dictionary.

---

## 23. Fixture manifest — `src/contract/fixtures/scheduler/`

The blind test-writer authors these from this document alone. They are **data**, not prose.

**Every fixture below is keyed to a name on the §21.1 frozen export list.** The previous revision keyed five files to computations that had no exported name — about 1 250 of ~1 500 rows were unwritable as specified. That is fixed by §4.1, not by rewording the manifest.

| File | Exercises | Shape | Rows / cases |
|---|---|---|---|
| `config.json` | `defaultConfig` | the serialised object → deep equality | **1** (pins 49 field names and values) |
| `grades.json` | `gradeOf`, `isVoid` | `{correct, cueLevel, latencyMs, attemptIndex, interrupted, appBackgroundedMs, slowLatencyMs, minPlausibleLatencyMs} → {grade, isVoid}` | **128** — the exhaustive cross-product of §7.2 |
| `decision-table.json` | the fold | the 72 rows of §18, verbatim, plus the 8 rows of §18.1 | **80** |
| `cue-transitions.json` | `cueTransition` | `{floor, openingCue, trialClass, grade0, cueRaisedThisSession} → {cueLevel, stableSessionsReset, vanishResolved, cueRaisedThisSession}` | 4 × 4 × 3 × 4 × 2 = **384**, every row carrying values (see below) |
| `outcome.json` | `outcomeFor` | `{trials: [{grade0, trialClass}]} → SessionOutcome` | ~40 cases exercising the six-step order, especially step 4 before step 5 |
| `across-transitions.json` | `acrossTransition`, `effectiveAcrossRung` | `{tier, acrossRung, outcome, vanishResolved, driftLevel} → {acrossRung, stableSessions, dueOffsetMs}` with entering `stableSessions` fixed at **0** and `dueOffsetMs = acrossLadderMs[effectiveAcrossRung({tier, acrossRung: result.acrossRung}, driftLevel)]` | 3 × 7 × 6 × 2 × 3 = **756** |
| `roster-order.json` | `planRoster` | `{items[], nowAnchorMs, sessionCount} → {itemIds[], forcedMissing[]}` | ~30: all-due, none-due, one-due, forced-tier-1 overflow, fresh-item reservation, first-session cap of 2, `contentReady` exclusion, the `it_10 < it_9` tie-break, the §11.1 length formula |
| `next-trial.json` | `nextTrial`, `probeDue`, `closerItemId` | `{state, nowMonoMs} → TrialDirective` | ~40: readiness, early presentation, back-to-back guard, `FILLER`, `PROBE_BLOCK` twice in a row, `CLOSER(null)`, every end reason |
| `drift.json` | `evaluateDrift` | `{history[], anchorMs, driftLevel} → driftLevel'` | ~40: below/at `DRIFT_MIN_SESSIONS`, 2-vs-3 consecutive, recovery, the `bad*2 > n` boundary at `n = 6, 7`, non-qualifying entries excluded, duplicate `sessionId` |
| `acute.json` | `acuteChange`, `median` | `{history[], nowAnchorMs, acuteLastFiredAtMs} → limb \| null` | ~25: all three limbs, the WE-14 masking case, the even/odd median, the rate limit, `acuteSignalEnabled: false` |
| `presentation.json` | `resolvePresentation`, `canVanish`, `foilFor`, `overdueReturn` | `{state, entry} → {openingCueLevel, floorCueLevel, trialClass, foilItemId}` | ~35: `recognitionBlocked` first, the three transforms and their clamping, the vanish branch, the empty-foil-pool rewrite to cue 3 |
| `telemetry.json` | `trialTelemetry`, `sessionTelemetry` | `{state, directive, nowAnchorMs, nowMonoMs} → TrialSchedulingTelemetry`, and `{state, reason, closerPresented} → SessionSchedulingTelemetry \| null` | ~20, including `CLOSER(null)`, `activeSession === null`, and every `presentationMode` / `nDistractors` pair |
| `ordering/out-of-order-batches.json` | the ingest boundary | two-batch session with inverted `anchorMs` → expected state | 3 |
| `sessions/no-op-seq.json` | R1 vs R3–R12 | one no-op event per rule → expected state | **10** (WE-17) |
| `sessions/*.json` | `fold` | full event log → full expected final `SchedulerState`, compared by deep equality | **WE-2 → WE-3 → WE-4 → WE-5, chained** (four files, each starting from the previous file's asserted final state), plus `we-2-permuted` (I-19), WE-6 (×3 outcomes), WE-7, WE-8, WE-9, WE-10, WE-11, WE-15, WE-16, WE-18, WE-19, WE-20, WE-21, WE-22, WE-23 |

**`unreachable` in `cue-transitions.json` — the exact predicate.** `unreachable` is an **informational label, never a missing value**: `cueTransition` is total, so every one of the 384 rows carries a full expected result and both agents must produce it. A row is labelled `unreachable: true` iff any of:

```
(a) trialClass !== (openingCue < floor ? 'VANISH' : openingCue === floor ? 'FLOOR' : 'SUPPORTED')
(b) openingCue === 3 && grade0 !== 'EXPOSURE'
(c) openingCue !== 3 && grade0 === 'EXPOSURE'
(d) trialClass === 'VANISH' && cueRaisedThisSession === true     // a vanish is trial 0 of the session
(e) trialClass === 'VANISH' && floor === 0                       // nothing below free recall
```

Anything else is `unreachable: false`. Note that (b) and (c) describe the *self-consistent* presenter; §5.1 note 4 lets a payload violate them, which is why the rows still carry values and why WE-23 exists. The predicate is stated mechanically so the test-writer and the implementer label the identical subset.

`sessions/*.json` is the highest-value artefact: feed the event array, compare the serialised final state field-for-field. It cannot pass for the wrong reason and it is writable by an agent who has never seen the implementation, from §19 alone. §19.0 now states a **complete literal `S0`** — every history entry, every `addedAtMs`, every `dueAtMs`, every `repetitionNumber`, the envelope rule and the `seq` origin — and §19.0.1 states the event-generation rule, so both sides of the deep equality are constructible.

**Every number in §19 was re-derived from the rules in §§6–17 under the chaining declared in §19.0.2, and must be re-derived again, not trusted, when the fixtures are authored — a disagreement between §19 and §§6–17 is a defect in this document and must be raised, not silently resolved.** Three such disagreements were raised against the previous revision and are now fixed: the chained vanish eligibility entering session C, `it_0101`'s `stableSessions` entering session D, and `|W|` in the drift window at the close of sessions A and C.

---

## 24. Coverage against the seventeen binding requirements

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Two timescales; within 10–640 s with personalisable start; across same-day…14 d | **Satisfied** | `WITHIN_LADDER_MS`, `ACROSS_LADDER_MS`, `config.withinStartRung`, §8, §13 |
| 2 | Objective grading from `correct × cue_level × latency_ms × attempt_index`; no self-report | **Satisfied structurally** | §7.1 consumes all four; `Attempt` has no confidence/rating/ASR field (I-9) |
| 3 | Ceilings 30 d global, 7 d tier-1 | **Satisfied** | `CEILING_RUNG` binds inside the single advance site (§13.2); invariant I-4 |
| 4 | Failure adds cue support, not interval change | **Satisfied** | §8.3 `MISS` row leaves `withinRung` unchanged; §9.4 raises the floor at **trial** close so the next presentation is genuinely easier; WE-4 |
| 5 | No automatic removal; items degrade to exposure and stay | **Satisfied structurally** | §15.2; no lapse counter in state; the §13.4 fixed point is exposure-in-every-session; invariant I-6 |
| 6 | Tiering with inverted economics: frequency floor + interval ceiling | **Satisfied** | §11 (`isForced` is component 0 of `PRIORITY_KEY`), §13.2 ceiling; unsatisfiability signalled, never silent |
| 7 | Target ≥95% success as presented, via cue support | **Partially satisfied — declared** | §12.2 S7 + §9.4. Displayed success is 100% by construction (I-12). Recorded success is a convergent control target with a one-session-lag floor, **not an invariant.** See §25. |
| 8 | Interleaving fills the gap, 6–10 items | **Satisfied** | `SESSION_MAX_ITEMS = 8`; roster always filled; back-to-back forbidden (I-14); `FILLER` when the roster is thin |
| 9 | Intervals must contract as well as expand | **Satisfied, with a proof** | §13.4: two per-item mechanisms plus drift; monotone convergence on two bounded integers |
| 10 | Progression-drift term exists, surfaces to nobody | **Satisfied** | §14; integer, bounded, symmetric, presentation-time only, no exported getter (I-8) |
| 11 | Fluctuation-aware: persistence across sessions, never one bad day | **Satisfied** | §14 (3 consecutive + 6 qualifying in 14 d) for the global term; §9.4 (`cueRaisedThisSession`) and §13.1 (`SUPPORTED_SESSION` before `EXPOSURE_SESSION`) for the per-item term |
| 12 | Session capped by time and items, ends on success, no due-count, no backlog, no skip consequence | **Satisfied** | §10 budgets, §10.2 closer, §11.1 (backlog not representable), §15.2 (skip changes nothing) |
| 13 | Probe set invisible to the scheduler | **Satisfied structurally** | §16 — probe items are not in `state.items` and emit no scheduler event |
| 14 | Distress absorbing, stronger than interval logic | **Satisfied** | §15.1 precedence table; rank 3 beats rank 5 |
| 15 | Nothing dropped on a caregiver's behalf | **Satisfied structurally** | §15.2; `by` has no `'algorithm'` variant; invariant I-6 closes it in one property test |
| 16 | Rich per-attempt telemetry for a retrospective DSR/FSRS fit | **Partially satisfied — declared** | §17.3. Every raw field a retrospective fit needs is logged at full resolution. The four **derived model fields are `null`** because this design has no continuous model. See §25. |
| 17 | Licensing: no SuperMemo code, no AGPL Anki code | **Satisfied trivially** | Zero third-party algorithm code. Both ladders are protocol descriptions from the clinical literature. No SM-2 formula, no DSR functional form, no FSRS weights. |

---

## 25. Declared weaknesses — so the pilot can falsify this rather than confirm it

1. **Requirement 7 is a control target, not an invariant.** Guaranteed: every trial terminates in a success or a warm exposure (I-12), any session above the 50 ppt target is followed by a gentler one, and repeated misses drive each item monotonically to its guaranteed-success floor. **Not** guaranteed: ≥95% *recorded* success against delirium, a UTI or a medication change. No scheduler can promise that, and one that does is predicting the patient.
2. **Requirement 16's derived fields are `null`.** A reviewer wanting live retrievability on a clinician surface cannot have it from this module — and P24 forbids that surface in v1 anyway. Mitigation and arguably an advantage: a ladder-scheduled dataset is a cleaner instrument for fitting a model than a model-scheduled one.
3. **Chance success at cue 2 inflates apparent success.** A two-alternative trial is 50% correct by guessing. Mitigated by defining `CLEAN_SESSION` at the session level (§13.3), by requiring `CLEAN` (not `SLOW`) to promote a vanish, and by the deck-wide vanish cap. Not eliminated.
4. **Interval resolution is coarse** — seven across-rungs. An item whose true optimal gap is 3 or 10 days gets 2/4 or 7/14. If retrospectively fitted per-item curves (criterion M1) show a strong mode the ladder cannot express, the ladder needs more rungs and the pure position weakens.
5. **Ladder chatter** at a rung boundary is damped by `gentleSessionsRemaining`, not removed. Hysteresis was rejected as another invented constant. **If the pilot's distress register shows adverse events clustering on oscillating items, this position loses.**
6. **Drift may never fire in practice** — the most likely falsifier. `DRIFT_MIN_SESSIONS = 6` inside 14 days may be unreachable at real adherence (iCST: 40% managed ≥2/week; 22% delivered zero). Requirement 10 would then be satisfied on paper and dead in the field. The per-item ladders still contract, so the loss is confined to the global response.
7. **`SLOW_LATENCY_MS = 8000` may fire on most trials** in a real mild-to-moderate cohort. If it does, intervals essentially never expand, the design collapses to a fixed 90-minute/1-day schedule, and the threshold must be fitted per participant — the first genuine crack in "no fitted parameters".
8. **Within-session intervals are best-effort**, not honoured exactly (§8.4). The 10/20/40 s ladder in the clinician-facing sentence is nominal, not measured. Logged as `within_interval_deviation_ms`; if the pilot shows large systematic deviation, the clinician explanation is weaker than advertised.
9. **Discarding all per-item transitions from a distress-aborted session loses real evidence** — twenty clean trials before the upset count for nothing. Chosen because a session ending in harm must not expand an interval and because the rule has no ambiguous cases. Partially mitigated: the summary still enters `history`, so repeated distress registers in the drift and acute windows.
10. **The acute-change signal rests on six invented thresholds** and its false-positive rate is unknown. S7 requires ≥1 verified true positive **and** a documented false-positive rate, so the pilot must measure it. Mitigated by three things: the scheduler never acts on it, it is rendered exclusively in physical-illness wording, and it is behind `config.acuteSignalEnabled` — a kill switch, because a detector that cries wolf at a carer with ~49% median burden prevalence is a harm, not a safety feature.
11. **The absence limb may fire on a family holiday.** Two more invented constants (`ACUTE_ABSENCE_PRIOR_SESSIONS`, `ACUTE_ABSENCE_SILENT_MS`) exist only because every other limb is dead at real adherence. It is the weakest-provenance rule in the document and the first to cut if the pilot's FPR is bad.
12. **Multi-week DLB fluctuation is not addressed.** Drift is symmetric and reversible, which handles the hour-to-hour case the synthesis names; a participant fluctuating on a multi-week rhythm will be tracked by drift as if the fluctuation were progression. No design in the set addresses this, and it is not addressable without a subtype-aware model that P24 and P26 would both make hard to ship.
13. **Device-vs-server divergence is bounded but real** until sync, and "two tablets merge deterministically" is a property of the **server's** fold only (§6.1, E7). The one-device-per-patient precondition must be enforced in `policies.ts`, not assumed.
14. **26 invented constants**, of which 22 fail toward more contact and more support. `DRIFT_CONSECUTIVE` is the one whose wrong direction is genuinely harmful, which is why it is 3. The four `ACUTE_*` thresholds govern an advisory signal the scheduler never acts on. The comparison is comparative, not absolute: FSRS-6 carries 21 fitted weights plus a functional form plus a retention target, none clinician-inspectable, none ever fitted to a dementia cohort — and there is no clinician-readable sentence of the shape *"she saw Margaret's name six times today, at 10, 20, 40, 80, 160 and 320 seconds, with a first-letter hint, and she got all six — so tomorrow's gap moves from four days to seven, and next week we'll try it without the hint."*





