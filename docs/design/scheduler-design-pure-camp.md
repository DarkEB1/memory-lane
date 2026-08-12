# Scheduler Design — PURE CAMP LOOP

**Status:** design proposal, one of several competing scheduler designs.
**Thesis:** the evidence supports the published clinical protocol and nothing more. Every parameter we invent is a parameter we cannot justify. A small bounded-integer state machine is testable, explicable to a clinician in one sentence, and impossible to get subtly wrong.
**Module:** `src/domain/scheduler/` — pure TypeScript, no `react`/`react-native`/`expo-*`/`@supabase/*`, no `Date`/`Math.random`/`crypto`/`fetch`/`window`/`document`.
**Author's claim to prove:** this design satisfies contraction (§6 requirement 9) and tiering (requirement 6) with **no continuous model, no floating-point arithmetic anywhere, and no fitted parameters**.

---

## 0. The thesis, stated so it can be attacked

Three facts from the research govern this design:

1. **The expanding *shape* is not load-bearing.** Logan & Balota 2008 found no robust advantage for expanding over equal intervals; Hochhalter 2005 reportedly null in dementia. Synthesis §3 row 3 grades "expanding shape specifically is necessary" as **(c/d)**. So the curve is not where the value is, and any effort spent modelling the curve precisely is effort spent on an ungraded hypothesis.
2. **The *adjustment* is load-bearing.** Hawley 2008 (n=12): performance-adjusted intervals beat a uniform expanded schedule, with more transfer to the live person. Synthesis §3 row 2, **(b)**. So the engine must react to the individual. It does not follow that it must react *continuously*.
3. **Spaced retrieval is not demonstrably better than other structured learning techniques** (Gámiz/González-Moreno 2023). Synthesis §5.1 says so in the sentence that demotes the scheduler.

Put together: the scheduler's job is to *react to the person*, not to *predict the person*. A continuous DSR-style model (stability, difficulty, retrievability) exists to answer the question "when will recall probability cross 0.9?" — a question we are forbidden to ask (requirement 7 and NEVER-DO #10 both reject the 90% retention target, and P5 forbids surfacing any of it). Having removed the question, we should remove the machinery that answers it.

What replaces it is a **negative-feedback loop over two bounded integer ladders**: a cue ladder that carries difficulty (P2) and an interval ladder that carries frequency. Both ratchet in both directions. That loop, and nothing else, is the whole engine.

**The clinician test.** A design in this domain must be sayable to a speech and language therapist in one breath:

> "She saw Margaret's name six times in today's session — at 10, 20, 40, 80, 160 and 320 seconds — with a first-letter hint, and she got all six. So tomorrow's gap moves from four days to seven, and next week we'll try it without the hint."

There is no sentence of that shape for FSRS-6's 21 weights.

---

## 1. Notation, units, and arithmetic discipline

- All times are **integer milliseconds since Unix epoch**, named `*AtMs`. All durations are **integer milliseconds**, named `*Ms`.
- **There is no floating-point arithmetic in this module.** No `/` producing a non-integer, no `Math.pow`, no `Math.exp`. The single division in the whole design (`missRatePpt`) is written `Math.floor((1000 * missed) / presented)` over integers. This is not stylistic: it is what makes "byte-identical output from the same event log" a structural guarantee rather than a hope. A server recomputing state in Node and a tablet computing it in Hermes cannot disagree about integer arithmetic.
- All counters are clamped to `[0, 255]` unless stated otherwise, so the state has a fixed maximum encoded size and the fold cannot grow without bound.
- `clamp(x, lo, hi) = min(max(x, lo), hi)`.
- Lexicographic tuple comparison means: compare element 0; if equal compare element 1; etc. Numbers ascending. Strings ascending by **UTF-16 code unit** (JavaScript's default `<` on strings), which is what `Array.prototype.sort` gives with an explicit comparator and is stable across engines.

---

## 2. Constants — the complete list, with failure directions

Every constant is here. There are no others hidden in the prose. Ten of the twenty are directly quoted from the synthesis or derived arithmetically from something that is; ten are invented, and each invented one is labelled with **which way it fails if it is wrong**.

| Constant | Value | Source | Invented? | If wrong, fails toward |
|---|---|---|---|---|
| `WITHIN_LADDER_MS` | `[10000, 20000, 40000, 80000, 160000, 320000, 640000]` | §6.1 verbatim | No | — |
| `ACROSS_LADDER_MS` | `[5400000, 86400000, 172800000, 345600000, 604800000, 1209600000, 2592000000]` (90 min, 1 d, 2 d, 4 d, 7 d, 14 d, 30 d) | §6.1 verbatim + §6.3 global 30 d ceiling as the 7th rung | Rung 0 only — §6.1 says "same day"; 90 min is a choice | Shorter = more repetition, more contact. Gentle. |
| `CEILING_RUNG` | `{1: 4, 2: 6, 3: 6}` (tier 1 → 7 d; tiers 2/3 → 30 d) | §6.3 verbatim | No | — |
| `SLOW_LATENCY_MS` | `8000` | — | **YES** | Both directions: too low → more SLOW → intervals hold instead of expanding and cues vanish more slowly. Too high → SLOW never fires and the grade collapses to correct/incorrect, which is the pre-2020 clinical protocol. **Monotone-safe in both directions.** |
| `RESPONSE_TIMEOUT_MS` | `30000` | — | **YES** | Too low → more recorded misses → more cue support, shorter intervals. Gentle. |
| `CUE_VANISH_SESSIONS` | `2` | — | **YES** (smallest integer that requires persistence *across* sessions, per requirement 11) | Too high → person is under-challenged and stays over-supported. Gentle but paternalistic. |
| `TIER1_FLOOR_SESSIONS` | `2` | requirement 6 ("frequency floor") gives the shape, not the number | **YES** | Too low → tier-1 crowds the roster. Too high → tier-1 floor is weak. |
| `SESSION_MAX_ITEMS` | `8` | §6.8 "6–10 items in rotation" | Weakly (midpoint of a stated range) | — |
| `SESSION_MAX_MS` | `600000` (10 min) | `spaced-retrieval-and-srs.md` implication 18 ("5–10 min is a defensible starting point"), P29 ("≤10 minutes") | Weakly | — |
| `MAX_TRIALS_PER_ITEM_PER_SESSION` | `7` | **derived** = `WITHIN_LADDER_MS.length` | No | — |
| `SESSION_MAX_TRIALS` | `56` | **derived** = `SESSION_MAX_ITEMS × MAX_TRIALS_PER_ITEM_PER_SESSION` | No | — |
| `NEW_ITEMS_PER_SESSION` | `1` | implication 17 ("start with 1–2 targets, expand only after observing tolerance") | No | — |
| `MISS_TARGET_PPT` | `50` | **derived** from §6.7's ≥95% success target (1000 − 950) | No | — |
| `DRIFT_WINDOW_MS` | `1209600000` (14 d) | §6.10 verbatim ("trailing 14-day") | No | — |
| `DRIFT_MIN_SESSIONS` | `6` | — | **YES** | Too high → drift never fires; the per-item ladders still contract, so the loss is only the *global* response. |
| `DRIFT_CONSECUTIVE` | `3` | §6.11 gives "must require persistence across sessions", not the number | **YES** | Too low → the scheduler manufactures decline out of DLB fluctuation. **This is the one invented constant whose wrong direction is genuinely harmful, and it is why it is 3 and not 2.** |
| `DRIFT_MAX` | `2` | — | **YES** | Caps total global contraction at 2 rungs. Too low → under-responds; the per-item ladder still works. |
| `DRIFT_MIN_ITEMS_PER_SESSION` | `3` | — | **YES** | A rate over fewer than 3 items is noise. Too high → fewer sessions qualify, drift is slower. Gentle. |
| `ACUTE_MISS_PPT` | `400` | — | **YES** | Too low → false "ring the GP" prompts. Named as the acute-change threshold; see §12 and the weakness list. |
| `ACUTE_BASELINE_PPT` | `150` | — | **YES** | As above. |
| `PROBE_MAX_ITEMS` | `8` | §5.2 point 2 verbatim ("≤8 items") | No | — |
| `PROBE_MAX_MS` | `120000` | §5.2 point 2 verbatim ("≤2 minutes") | No | — |
| `SESSION_HISTORY_MAX` | `60` | — | **YES** | Bounds the fold's state size. Must exceed the largest analysis window (14 d of sessions). 60 is ~2 sessions/day for a month. |

**Honest accounting.** Ten invented constants. That is not zero, and I will not pretend it is. The comparison that matters: FSRS-6 carries **21 fitted weights plus a functional form plus a target-retention parameter**, none of which a clinician can inspect, all of which were fitted to 727 M reviews from ~10,000 self-selected cognitively healthy Anki users (§1.1), and none of which have ever been fitted to a dementia cohort. Here, **eight of the ten invented constants fail in the "gentler, more contact, more support" direction**, one (`DRIFT_CONSECUTIVE`) is set conservatively precisely because it does not, and two (`ACUTE_*`) govern a signal that is advisory-only and never acts on scheduling.

Every constant above is exposed in `SchedulerConfig` and overridable per participant. Nothing is baked into a function body.

---

## 3. State model — every field, with type and range

The scheduler is a fold. This is the entire fold state. There is nothing else.

### 3.1 `ItemState` — one per content item

```ts
type ItemId = string;                 // opaque, unique, stable
type Tier = 1 | 2 | 3;
type CueLevel = 0 | 1 | 2 | 3;        // 0 free recall, 1 partial cue,
                                      // 2 two-alternative recognition,
                                      // 3 familiarity exposure (no question asked)
type ItemStatus = 'active' | 'absorbing_distress' | 'retired';

interface ItemState {
  itemId: ItemId;
  tier: Tier;                          // human-set. The algorithm never writes this.
  isProbe: boolean;                    // if true, NOTHING below this line is ever read or written
  recognitionBlocked: boolean;         // P16: deceased/estranged. Forces cue 3. Human-set.

  acrossRung: 0|1|2|3|4|5|6;           // index into ACROSS_LADDER_MS. Telemetry: attained_rung.
  cueLevel: CueLevel;                  // the item's cue FLOOR — the support it is normally given
  stableSessions: number;              // 0..255, consecutive stable sessions at this cueLevel

  lastSeenAtMs: number | null;         // null = never presented
  dueAtMs: number;                     // epoch ms. For a never-presented item, = addedAtMs.
  addedAtMs: number;
  sessionsSincePresented: number;      // 0..255. Drives the tier-1 frequency floor.

  repetitionNumber: number;            // 0..2^31-1. Total non-closer, non-probe trials ever. Telemetry only.
  status: ItemStatus;
}
```

**Eleven meaningful fields, of which four are the state machine** (`acrossRung`, `cueLevel`, `stableSessions`, `status`) and the rest are timestamps, human-set metadata, or telemetry counters. Compare FSRS's per-card `(stability: f32, difficulty: f32, retrievability: f32, elapsed, reps, lapses)` plus 21 shared weights.

**There is no `lapseCount` field.** `lapse_count` appears in the telemetry spec (§7) and is computed by the research plane from the event log. It is deliberately absent from scheduler state so that **no code path can exist that reads a lapse count and removes an item** (requirement 5, P3, NEVER-DO #8). The absence is the enforcement.

### 3.2 `ActiveSessionState` — ephemeral, lives inside the fold, discarded at session end

```ts
interface RosterEntry {
  itemId: ItemId;
  withinRung: 0|1|2|3|4|5|6;           // index of the delay to apply AFTER the next success
  nextEligibleAtMs: number;
  trialsThisSession: number;           // 0..7
  withinDone: boolean;                 // completed the within ladder; leaves rotation
  vanishAttemptedThisSession: boolean;
  vanishResolvedThisSession: boolean;  // a vanish attempt happened and was scored
  lastTerminalResponseAtMs: number | null;
  floorTrials: FloorTrialRecord[];     // one per trial whose opening cue == the item's floor
}

interface FloorTrialRecord { grade0: Grade; }   // grade of attempt 0 only

interface ActiveSessionState {
  sessionId: string;
  startedAtMs: number;
  localDayIndex: number;               // supplied by the edge from the Clock port
  isFirstSessionOfLocalDay: boolean;
  roster: RosterEntry[];               // ordered as produced by planRoster; length <= 8
  trialsCompleted: number;             // non-probe, non-closer
  lastPresentedItemId: ItemId | null;
  probeEmitted: boolean;
  probeElapsedMs: number;
  endRequested: null | SessionEndReason;
}
```

### 3.3 `ParticipantState` — the only global state

```ts
interface SessionSummary {
  sessionId: string;
  startedAtMs: number;
  presentedItems: number;              // non-probe roster entries with >= 1 trial
  missRatePpt: number;                 // 0..1000
}

interface ParticipantState {
  driftLevel: 0 | 1 | 2;               // requirement 10. Surfaces to nobody.
  difficultyFloorTriggered: boolean;   // requirement 7 enforcement, one-session lag
  probeDisabled: boolean;              // §5.2 point 5, human-set
  history: SessionSummary[];           // ring buffer, length <= SESSION_HISTORY_MAX (60)
}
```

### 3.4 `SchedulerState`

```ts
interface SchedulerState {
  config: SchedulerConfig;             // all 20 constants, plus withinStartRung, probeItemIds
  participant: ParticipantState;
  items: ReadonlyMap<ItemId, ItemState>;   // iteration order is never relied upon; all
                                           // orderings are produced by explicit sorts
  activeSession: ActiveSessionState | null;
}
```

`config.withinStartRung: 0..6` — the "personalisable start" of requirement 1. Participant-level, not per-item. Per-item within-ladder starts are an invented parameter with no clinical source; Camp's protocol restarts the ladder each session.

**State size bound.** Per item: 11 fields, all scalars. Per participant: 4 fields plus a 60-entry ring buffer of 4-field records. For a 40-item deck the entire scheduler state serialises to a few kilobytes and is fully recomputable from the event log. It is never synced (ADR §4.4).

---

## 4. Ports, determinism, and why this module needs neither Clock nor Rng

The ADR requires `Clock` and `Rng` to be injected ports. This design accepts them for contract conformance and **calls neither inside the fold**.

```ts
export interface Clock { nowMs(): number; localDayIndex(): number; }
export interface Rng   { nextInt(boundExclusive: number): number; }
```

- **Time enters only through event payloads.** Every event carries `atMs`, stamped by the adapter at the edge using `Clock.nowMs()`. The reducer reads `event.atMs` and never asks for the current time. Pure query functions (`nextTrial`, `planRoster`) take `nowMs` as an explicit argument.
- **Randomness is not used at all.** The one place a naive design would reach for it — choosing the distractor for a two-alternative recognition presentation — is specified deterministically in §7.4. `Rng` is declared in the port surface for conformance and is never called. A blind test-writer may assert `expect(rngSpy.nextInt).not.toHaveBeenCalled()` across the entire suite.

**Consequence:** `reduce(state, event)` is a pure function of two plain values. The server recomputing canonical state from the event log runs identical code with no injected dependencies at all. Byte-identical output is structural, not tested-for.

**Event ordering.** Events fold in ascending `(atMs, eventSeq)` where `eventSeq` is a monotonically increasing integer assigned at append time on the originating device and preserved through sync. Ties in `atMs` are broken by `eventSeq`. Two events with identical `(atMs, eventSeq)` are a data corruption bug, not a scheduling ambiguity.

---

## 5. The grading function — exact, total, and the only place the four inputs meet

Requirement 2: `correct ∈ {0,1}` × `cue_level ∈ {0..3}` × `latency_ms` × `attempt_index` → internal grade. No patient self-report anywhere.

```ts
type Grade = 'MISS' | 'SLOW' | 'CLEAN' | 'EXPOSURE';

interface Attempt {
  correct: boolean;      // from tap, or from caregiver marking. NEVER from ASR (P27).
  cueLevel: CueLevel;    // the cue level this attempt was PRESENTED at
  latencyMs: number;     // integer >= 0, from stimulus paint to response commit
  attemptIndex: number;  // 0 for the first attempt of a trial
}

function gradeOf(a: Attempt, slowLatencyMs: number): Grade {
  if (a.cueLevel === 3)      return 'EXPOSURE';   // no question was asked
  if (a.attemptIndex > 0)    return a.correct ? 'SLOW' : 'MISS';
  if (!a.correct)            return 'MISS';
  if (a.latencyMs > slowLatencyMs) return 'SLOW';
  return 'CLEAN';
}
```

Notes a blind test-writer needs:

- `EXPOSURE` is checked **first** and unconditionally. At cue level 3 nothing is asked, so `correct` is meaningless and is ignored. `EXPOSURE` is **not** ranked against the other three; it is a separate branch. The only total order in this design is over `{MISS < SLOW < CLEAN}`.
- A response that reaches `RESPONSE_TIMEOUT_MS` is submitted by the runtime as `{correct: false, latencyMs: RESPONSE_TIMEOUT_MS}` and grades `MISS`. An omission and a wrong answer grade identically; the *error type* is logged separately (§7 telemetry `error_type`) and never used by the scheduler.
- A rescue attempt (`attemptIndex > 0`) can never grade `CLEAN`. This is deliberate: a person who needed the answer supplied has not demonstrated fluent retrieval, and `CLEAN` is the only grade that expands an interval.
- `asr_confidence` is not an input. `latencyMs` is the only continuous input to the entire engine, and its only effect is the `CLEAN`/`SLOW` split, whose only effect is to withhold expansion and withhold cue-vanishing. **The single continuous input can only make the schedule gentler.**

---

## 6. The within-session Camp loop

### 6.1 Trial structure — bounded, and terminates in success by construction

A **trial** is one visit to one item. It is a sequence of attempts:

- Attempt 0 is presented at the trial's **opening cue level** `c` (§7.3).
- On `MISS`, the runtime **immediately and warmly supplies the answer**, then attempt `k+1` is presented at cue level `min(c + k + 1, 3)`.
- On `CLEAN`, `SLOW` or `EXPOSURE`, the trial terminates.

Because cue level 3 asks no question, it grades `EXPOSURE`, so the trial terminates at or before cue 3. **Maximum attempts per trial = `4 − c`. Every trial terminates in a success or a warm exposure.** P1 is therefore structural, not a runtime check.

**The affective bound on repeated visible misses.** A 4-attempt trial requires opening at cue 0. But the cue floor ratchets up on any floor-level miss (§7.2) and falls only after two stable sessions, so a person who is struggling spends essentially all trials at cue 2 or 3, where the maximum is 2 attempts or 1. Only a person currently succeeding at free recall can experience a 4-attempt trial, and by construction they succeed at cue 0 most of the time. **The rule that makes the worst case rare is the same rule that carries difficulty.** This is the argument that lets the pure protocol stand without an invented "max attempts" cap.

### 6.2 Within-ladder transitions

`withinRung` is the index of the delay to apply **after** the next success. On entering a session, every roster item is initialised:

```
withinRung        = clamp(config.withinStartRung - participant.driftLevel, 0, 6)
nextEligibleAtMs  = session.startedAtMs        // the first presentation is immediate
trialsThisSession = 0
withinDone        = false
```

(The drift subtraction is requirement 10's "intervals down" applied to the within-session timescale. At `driftLevel 0` it is the identity.)

At **trial close**, let `r = withinRung` and `t = ` the terminal attempt's response time in ms:

| Attempt-0 grade | `withinRung` after | `nextEligibleAtMs` | `withinDone` |
|---|---|---|---|
| `CLEAN` / `SLOW` / `EXPOSURE` | `min(r + 1, 6)` | `t + WITHIN_LADDER_MS[r]` | `true` if `r === 6`, else `false` |
| `MISS` | `r` (**unchanged**) | `t + WITHIN_LADDER_MS[r]` | `false` |

And always: `trialsThisSession += 1`; `item.repetitionNumber += 1`.

The `MISS` row is requirement 4 and P2 in their entirety: **the interval does not move, the cue moves.** The item is re-presented at the same rung, one cue rung easier. This is Camp's adjusted schedule with the adjustment axis rotated from time onto support — which is what P2 mandates and what Glisky's vanishing cues supplies the mechanism for.

An item leaves the within-session rotation when `withinDone` or `trialsThisSession >= MAX_TRIALS_PER_ITEM_PER_SESSION (7)`.

### 6.3 The interval is a minimum, honoured best-effort

With 8 items in rotation, other items fill the gaps (requirement 8 — the clinically prescribed "filled interval", free). But the queue cannot honour exact seconds: if every item is waiting on its timer, the scheduler must either idle or present early.

**Rule: the scheduler never idles and never shows a countdown** (a visible timer is named as harmful in `spaced-retrieval-and-srs.md` A7.5). If no item is ready, it presents the item that will be ready soonest, early. The rung advances on success regardless of whether the nominal delay was fully honoured. The actual elapsed interval is logged (`interval_deviation`).

This is a deliberate, evidenced deviation and it is the second place my thesis does real work: the expanding *shape* is graded **(c/d)**, so an engine that treats the ladder as a target rather than a contract is not discarding anything the evidence supports. An engine built on a continuous retrievability model cannot make this trade — its intervals are its predictions.

In practice the early-presentation branch fires only in the first ~40 seconds of a session, because a trial costs 5–15 s of wall clock and eight of them exceed rung 2.

### 6.4 `nextTrial` — the exact picker

```
nextTrial(state, nowMs):
  s = state.activeSession
  if s is null                                                  -> NO_SESSION
  if s.endRequested !== null                                    -> END(s.endRequested)
  if (nowMs - s.startedAtMs - s.probeElapsedMs) >= config.sessionMaxMs
                                                                -> END('budget_time')
  if s.trialsCompleted >= SESSION_MAX_TRIALS                    -> END('budget_trials')
  if probeDue(state, nowMs)                                     -> PROBE_BLOCK          // §10

  candidates = s.roster entries where
        !withinDone
     && trialsThisSession < MAX_TRIALS_PER_ITEM_PER_SESSION
     && items[itemId].status === 'active'

  if candidates is empty                                        -> END('roster_exhausted')
  if candidates.length >= 2:
       candidates = candidates where itemId !== s.lastPresentedItemId   // no back-to-back

  ready = candidates where nextEligibleAtMs <= nowMs
  pool  = ready.length > 0 ? ready : candidates

  chosen = min of pool by tuple
       [ nextEligibleAtMs asc, withinRung asc, tier asc, itemId asc ]

  return TRIAL(chosen.itemId, openingCueFor(state, chosen))
```

`itemId` is unique, so the sort key is a **strict total order**: `nextTrial` is single-valued for any state and `nowMs`. There is no tie to break and no randomness to seed.

The `candidates.length >= 2` guard is the interleaving guarantee: an item is never presented twice in a row while any other item is available.

---

## 7. The cue ladder — the only carrier of difficulty

Four rungs, exactly as P2 and requirement 4 specify:

| `cueLevel` | Presentation | Can be missed? |
|---|---|---|
| 0 | Free recall — "Who is this?" | Yes |
| 1 | Partial cue — first phoneme/letter, semantic hint | Yes |
| 2 | Two-alternative recognition — target plus one foil | Yes |
| 3 | Familiarity exposure — "Here's Margaret, your daughter." No question asked. | **No** |

`cueLevel` on `ItemState` is the item's **floor**: the support it is normally given. Higher number = more support.

### 7.1 The unified vanishing rule

The same rule governs all four rungs, including the return from familiarity exposure. This is Glisky's method of vanishing cues expressed as three lines of integer logic.

**At the item's first trial of a session**, a **vanish attempt** is made — the trial opens one rung *harder* than the floor — if and only if all of:

```
entry.trialsThisSession === 0
&& !entry.vanishAttemptedThisSession
&& item.stableSessions >= CUE_VANISH_SESSIONS (2)
&& item.cueLevel > 0
&& !item.recognitionBlocked
&& state.participant.driftLevel === 0
&& !state.participant.difficultyFloorTriggered
```

Then the opening cue is `item.cueLevel - 1`, and `entry.vanishAttemptedThisSession = true`.

At most **one vanish attempt per item per session**.

Note what this buys: an item that has degraded to cue 3 (familiarity exposure) still accrues `stableSessions` from its exposures, and after two stable sessions is offered a real question again. **An item can recover.** No separate "re-offer" mechanism, no second counter, no special case for the bottom rung. Requirement 5's "items degrade down the cue ladder to familiarity exposure and remain in rotation" is satisfied, and P3's concern about silent disappearance is answered by an item that keeps appearing and keeps being offered a way back up.

### 7.2 Cue transitions — applied at TRIAL close, immediately

Let `c0` = the opening cue level of attempt 0, `f` = `item.cueLevel` at the moment the trial opened, `g0` = the grade of attempt 0.

| Case | Condition | Effect |
|---|---|---|
| **Floor miss** | `c0 === f` and `g0 === 'MISS'` | `item.cueLevel = min(f + 1, 3)`; `item.stableSessions = 0` |
| **Vanish success** | `c0 === f - 1` and `g0 ∈ {'CLEAN','SLOW'}` | `item.cueLevel = f - 1`; `item.stableSessions = 0`; `entry.vanishResolvedThisSession = true` |
| **Vanish failure** | `c0 === f - 1` and `g0 === 'MISS'` | `item.cueLevel` unchanged; `item.stableSessions = 0`; `entry.vanishResolvedThisSession = true` |
| Otherwise | — | no cue change |

Cue transitions are applied at **trial** close so that the very next trial in the same session reflects them. On a floor miss, the item's next presentation is genuinely one rung easier — requirement 4 literally. On a vanish success, the rest of the session runs at the new harder floor, which is what makes the vanish real rather than cosmetic.

**Asymmetry, deliberately:** the cue rises after **one** missed trial; it falls only after **two** stable sessions. That is the safety bias, expressed as `1 < 2`.

**A vanish failure does not raise the floor.** The person failed at a level we deliberately made harder than their established level. Punishing them for our probe would be both wrong and destabilising. It costs `stableSessions`, which is the correct price.

### 7.3 `openingCueFor` — exact

```
openingCueFor(state, entry):
  item = state.items[entry.itemId]
  if item.recognitionBlocked                         -> 3            // P16
  if canVanish(state, entry)                         -> item.cueLevel - 1
  base = item.cueLevel
  if state.participant.difficultyFloorTriggered      -> base = min(base + 1, 3)
  base = min(base + state.participant.driftLevel, 3)
  return base
```

The drift and difficulty-floor terms are **presentation-time transforms only**. They never write to `item.cueLevel`. When drift recovers, every item springs back to its own history unchanged. This is why the design needs no "un-drift" logic: the mutation never happened.

`canVanish` requires `driftLevel === 0 && !difficultyFloorTriggered`, so vanish and the transforms can never both apply. The two branches are disjoint and a blind test-writer can test them independently.

### 7.4 Two-alternative recognition: the foil, chosen without randomness

```
foilPoolFor(state, targetItemId):
  pool = items where status === 'active'
                 && !isProbe
                 && !recognitionBlocked
                 && itemId !== targetItemId
                 && tier === items[targetItemId].tier
  sort pool by itemId ascending
  if pool is empty -> null
  return pool[ session.trialsCompleted mod pool.length ]
```

If `foilPoolFor` returns `null`, a cue-2 presentation is impossible and that attempt is presented at cue level 3 instead (grading `EXPOSURE`). The `mod trialsCompleted` rotation spreads foils across a session deterministically. **No `Rng` call. Fully reproducible for a blind test.**

---

## 8. The across-session ladder

### 8.1 Session outcome for one item

Computed at session close over that item's **floor trials only** — trials whose opening cue equalled the item's floor at the time. Vanish attempts are excluded, because the outcome is defined "at the item's cue level" and a vanish attempt is by definition not at it.

```
outcomeFor(entry):
  ft = entry.floorTrials
  if ft is empty                                    -> NO_FLOOR_EVIDENCE
  if any g0 === 'MISS'      in ft                   -> MISSED_SESSION
  if any g0 === 'SLOW'      in ft                   -> SLOW_SESSION
  if all g0 === 'EXPOSURE'  in ft                   -> EXPOSURE_SESSION
  otherwise                                          -> CLEAN_SESSION
```

Checked in that order. `CLEAN_SESSION` therefore covers "all `CLEAN`" and "a mix of `CLEAN` and `EXPOSURE`".

**Why the outcome is session-level and not trial-level.** A two-alternative recognition trial is 50% correct by chance. If the ladder advanced on a single lucky trial it would be corruptible by guessing. `CLEAN_SESSION` requires *every* floor trial's attempt 0 to grade `CLEAN`; with the typical 4–6 trials per item per session, chance-clean at cue 2 is `0.5^5 ≈ 3%`, and two consecutive such sessions (the vanish threshold) is `~0.1%`. **The session-level definition is what makes a chance-level cue rung safe to build on**, and it costs nothing.

### 8.2 Across-ladder transitions at session close

| Outcome | `acrossRung` | `stableSessions` |
|---|---|---|
| `CLEAN_SESSION` | `min(acrossRung + 1, CEILING_RUNG[tier])` | `+1` (clamped 255) unless `vanishResolvedThisSession` |
| `SLOW_SESSION` | **hold** | `0` |
| `EXPOSURE_SESSION` | **hold** | `+1` (clamped 255) unless `vanishResolvedThisSession` |
| `MISSED_SESSION` | `max(acrossRung - 1, 0)` | `0` |
| `NO_FLOOR_EVIDENCE` | **hold** | unchanged |

Then, for every item with `trialsThisSession >= 1`:

```
item.lastSeenAtMs           = entry.lastTerminalResponseAtMs
item.sessionsSincePresented = 0
item.dueAtMs                = item.lastSeenAtMs
                            + ACROSS_LADDER_MS[ effectiveAcrossRung(item, driftLevel) ]

effectiveAcrossRung(item, driftLevel) =
    clamp( item.acrossRung - driftLevel, 0, max(0, CEILING_RUNG[item.tier] - driftLevel) )
```

And for every active non-probe item with `trialsThisSession === 0`:

```
item.sessionsSincePresented = min(item.sessionsSincePresented + 1, 255)
```

`EXPOSURE_SESSION` holds rather than advances because an exposure produces **no retrieval evidence**. This is the rule that prevents a degraded item from drifting out to 30 days and effectively vanishing — the failure mode P3 is most worried about — without needing any special "degraded item" logic.

`SLOW_SESSION` holds rather than advances: a slow retrieval is a success worth having but not evidence for a longer gap. Holding is the conservative reading and it is the only effect `SLOW_LATENCY_MS` has on intervals.

---

## 9. Requirement 9 — contraction, proven without a continuous model

The concern is real and correctly stated in §6.9: SM-2 and FSRS assume monotonic improvement, so as the underlying system degrades they push intervals *out* exactly as ability falls, producing an accelerating failure rate. Here is why that cannot happen in this design.

**Two independent contraction mechanisms, both per-item, both integer:**

1. `MISSED_SESSION → acrossRung − 1`. Any session containing one floor-level miss shortens the next gap by one rung. The ladder is bidirectional at every rung.
2. `Floor miss → cueLevel + 1`. Any floor-level miss adds support to the presentation itself.

**One global mechanism (§11):** `driftLevel` subtracts from every item's effective across-rung, every item's effective ceiling, and every item's within-session start rung, and adds to every item's opening cue.

### 9.1 The convergence argument

Consider an item under a person whose ability is falling. Model the ability as: the probability of a `CLEAN_SESSION` at cue floor `f` and gap `ACROSS_LADDER_MS[r]` is non-increasing in `r`, non-increasing in calendar time, and non-decreasing in `f`. (Those three monotonicities are the only assumptions; none of them require a functional form.)

- Each session produces exactly one of `{advance, hold, retreat}` on `acrossRung ∈ [0, 6]`, and exactly one of `{raise, hold, lower}` on `cueLevel ∈ [0, 3]`.
- As ability falls, `P(MISSED_SESSION)` rises, so retreats become more frequent than advances. `acrossRung` is a bounded integer under a biased random walk with an absorbing barrier at 0 and a reflecting ceiling — **it descends.**
- Simultaneously `cueLevel` ratchets up on every floor miss and requires two consecutive stable sessions to fall. Under rising miss rates it **ascends.**
- The joint fixed point is `(acrossRung = 0, cueLevel = 3)`: the item is presented in **every** session, at a gap of 90 minutes, as a warm familiarity exposure with no question asked, still offered a vanish attempt every second stable session.

**That fixed point is exactly the end state P3 and requirement 5 prescribe** — "items degrade down the cue ladder to familiarity exposure and remain in rotation as moments of connection". It is reached by a monotone argument on two bounded integers. No stability parameter, no forgetting curve, no retrievability estimate is required to get there, and none of the numbers involved are fitted.

### 9.2 The worst case, stated

The worst thing this design can do to a declining person is present their daughter's photograph with her name, warmly, in every session, forever. That is the floor. There is no state below it, and there is no code path that removes the item (§13).

### 9.3 Ladder chatter — a named artefact, not a bug

An item whose true optimal gap sits between two rungs will oscillate: `CLEAN` at 4 d → advance to 7 d → `MISS` at 7 d → contract to 4 d → `CLEAN` → …. Steady-state behaviour is an alternation with roughly a 50% miss rate *at the upper rung only*, which the `difficultyFloorTriggered` rule (§11.1) damps by adding cue support in the session after each bad one.

I considered and **rejected** a hysteresis counter ("require two clean sessions to advance"). It is one line and it would work. It is also an eleventh invented constant with no clinical source, and the artefact it removes is clinically benign — both 4 d and 7 d are inside the evidenced band, and re-showing something the person already knows is explicitly *not* waste (requirement 6). Per the thesis, the parameter loses.

---

## 10. Requirement 6 — tiering, without a continuous model

Anki's economy is facts-retained-per-minute, which requires a retrievability estimate to allocate against. We are not doing that. Tiering here is **two integer clamps and one counter**, and it needs no prediction at all.

**Interval ceiling.** `CEILING_RUNG = {1: 4, 2: 6, 3: 6}` binds inside the `CLEAN_SESSION` advance rule. A tier-1 item cannot exceed rung 4 = **7 days**; a tier-2/3 item cannot exceed rung 6 = **30 days**. Requirement 3, exactly.

**Frequency floor.** An item is **forced** into the roster when `tier === 1 && sessionsSincePresented >= TIER1_FLOOR_SESSIONS (2)`, regardless of `dueAtMs`. This is the "appears regardless of predicted retrievability" clause — and it is trivially satisfiable here because there *is* no predicted retrievability to override.

**Priority.** Tier is component 3 of the roster sort key (§11.2), so among equally-due items, tier 1 goes first.

**The honesty catch.** With `SESSION_MAX_ITEMS = 8` and `TIER1_FLOOR_SESSIONS = 2`, the floor is satisfiable only if the number of tier-1 items is at most 16, and comfortably only if it is at most 8. **When a forced item is squeezed out of the roster the scheduler emits `SchedulerSignal{kind: 'tier1_floor_unsatisfied', itemIds}` rather than dropping it silently.** Silent degradation of a stated guarantee is exactly the class of bug this design exists to prevent. The signal goes to the caregiver-authoring surface as "you have marked more items as essential than a session can hold", never to the patient.

---

## 11. Session construction

### 11.1 The difficulty floor — requirement 7's actual mechanism

Requirement 7 asks for ≥95% success on the exercise as presented, achieved by cue support, not interval manipulation. Here is the mechanism, and then the honest statement of what it does and does not guarantee.

At session close, over non-probe roster entries with `trialsThisSession >= 1`:

```
presented = count of such entries
missed    = count of those whose outcome is MISSED_SESSION
if presented >= DRIFT_MIN_ITEMS_PER_SESSION (3):
    missRatePpt = floor((1000 * missed) / presented)
    push {sessionId, startedAtMs, presented, missRatePpt} onto participant.history  (ring, max 60)
    participant.difficultyFloorTriggered = (missRatePpt > MISS_TARGET_PPT (50))
else:
    // too few items to compute a meaningful rate; leave the flag and history untouched
```

When `difficultyFloorTriggered` is true, **every** non-probe item in the next session opens one cue rung easier (`min(cueLevel + 1, 3)`) and all vanish attempts are suppressed. It clears at the next session close whose miss rate is at or under target. Presentations under this rule are logged with `difficulty_floor_triggered = true`.

**This is deliberately single-session-responsive, and the drift term (§11.4) deliberately is not.** That resolves the tension between requirement 7 (hit 95%, which needs a fast response) and requirement 11 (do not manufacture decline out of a DLB participant's bad afternoon, which needs a slow one). The resolution is that **adding cue support is always safe and can therefore be fast; moving intervals is not and must therefore be slow.** One bad day makes the next session gentler. Only three consecutive bad sessions inside a fortnight move any interval.

**What is guaranteed and what is not.** Requirement 7 is a **control target with a negative-feedback loop and a one-session-lag floor, not an invariant.** No scheduler can guarantee ≥95% success on the first session after a stroke, a UTI, or a change of medication. Any design claiming otherwise is claiming to predict the patient. What is guaranteed is: (a) every *trial* terminates in success or warm exposure, so displayed success is 100%; (b) a session above the miss target is always followed by a gentler session; (c) repeated misses monotonically drive each item toward its guaranteed-success floor. I state this as a partial satisfaction in §14 rather than pretending.

### 11.2 Roster selection — deterministic, total, no backlog

```
planRoster(state, nowMs):
  eligible = items where status === 'active' && !isProbe

  fresh         = eligible where lastSeenAtMs === null
  freshAllowed  = sort(fresh, [tier asc, itemId asc]).slice(0, NEW_ITEMS_PER_SESSION (1))
  pool          = eligible minus (fresh minus freshAllowed)

  roster = sort(pool, PRIORITY_KEY(nowMs)).slice(0, SESSION_MAX_ITEMS (8))

  forcedMissing = pool where isForced(item) and item not in roster
  if forcedMissing is non-empty: emit signal 'tier1_floor_unsatisfied'
```

```
isForced(item)      = item.tier === 1 && item.sessionsSincePresented >= TIER1_FLOOR_SESSIONS
PRIORITY_KEY(item)  = [ isForced(item) ? 0 : 1,
                        item.dueAtMs <= nowMs ? 0 : 1,
                        item.tier,
                        item.dueAtMs,
                        item.lastSeenAtMs ?? -1,
                        item.itemId ]
```

Compared lexicographically. `itemId` is unique, so this is a **strict total order** — `planRoster` has exactly one correct output for any `(state, nowMs)`, which is precisely what a blind test-writer needs.

**The roster is always filled to `min(8, |pool|)`**, drawing from not-yet-due items when there are too few due ones. Three consequences, all required:

- **There is no backlog and no due-count, ever** (requirement 12, P6, NEVER-DO #5). The concept does not exist in the state model. Skipping five days produces a roster identical in shape to skipping none — only the ordering differs.
- **A session is never short and never empty.** The patient's experience does not vary with adherence.
- **Re-showing a well-known item is a feature** (requirement 6): "re-showing something already known well is not waste — it is a successful, pleasant experience with its own value."

New items enter with `acrossRung = 0`, `stableSessions = 0`, and:

```
cueLevel = (tier === 1 || recognitionBlocked) ? 3 : 2
```

Tier-1 identity content starts at familiarity exposure — **answer-first, exactly P12** ("show photo + name + relationship + one sentence, then invite elaboration"). The vanishing rule then walks it up to recognition and eventually to free recall as success stabilises. That sequence is errorless acquisition followed by vanishing cues, which is the composite the literature actually supports (A4 synthesis: "adjusted spaced retrieval — retrieval practice with the difficulty dialled to keep errors rare — outperforms both rigid errorless drilling and non-adjusted schedules"), and it falls out of one rule rather than being a mode.

### 11.3 Session shape and the closer

```
[ GENERIC_OPENER ]                       // P11, no correct answer, not graded
[ trials … ]                             // §6.4, interleaved
[ PROBE_BLOCK ]                          // §12, inserted mid-session, at most once per local day
[ trials … ]
[ CLOSER_TRIAL ]                         // familiarity exposure, not graded
[ GENERIC_CLOSER ]                       // P11, no correct answer, not graded
```

Session ends at the **first** of: `budget_time`, `budget_trials`, `roster_exhausted`, `user_ended` (patient "not today"), `abandoned` (no input for 180 s — the runtime's rule, not the scheduler's), `distress_stop`, `app_crash`.

**The closer** (P1's "guaranteed-success closer"):

```
closerItem = min over roster of [ item.cueLevel === 3 ? 0 : 1, item.tier, item.itemId ]
presented at cue level 3, isCloser = true
```

The closer trial is **excluded from every state transition**: it does not append to `floorTrials`, does not advance `withinRung`, does not update `lastSeenAtMs`, does not count toward `trialsCompleted`, and does not enter the drift computation. It exists purely to satisfy P1 and is logged with `is_closer = true`.

The closer is emitted for every end reason **except `distress_stop` and `abandoned`** — on distress the session must stop immediately (requirement 14), and on abandonment nobody is there to see it. Both are logged honestly with `ended_on_success = false` so that the S3 compliance audit (≥99% of sessions end on success) measures reality rather than intent.

### 11.4 Progression drift — requirement 10 and requirement 11 together

Evaluated once per session close, after the history push, using integer arithmetic only.

```
W = participant.history entries where
        startedAtMs > event.atMs - DRIFT_WINDOW_MS (14 d)
     && presented >= DRIFT_MIN_ITEMS_PER_SESSION (3)
    ordered by startedAtMs ascending

if |W| < DRIFT_MIN_SESSIONS (6):
    driftLevel unchanged                                   // insufficient evidence

else:
    bad  = count of W with missRatePpt > MISS_TARGET_PPT (50)
    tail = last DRIFT_CONSECUTIVE (3) entries of W

    if bad * 2 > |W|  and  every entry in tail has missRatePpt >  50:
        driftLevel = min(driftLevel + 1, DRIFT_MAX (2))

    else if bad * 4 <= |W|  and  every entry in tail has missRatePpt <= 50:
        driftLevel = max(driftLevel - 1, 0)

    else:
        driftLevel unchanged
```

Properties, each mapping to a requirement:

- **Changes by at most one rung per session close.** Bounded, slow.
- **Requires three consecutive above-target sessions to move up.** A single bad day, or an hour-to-hour DLB fluctuation, cannot move it. Requirement 11, satisfied by a stated persistence condition rather than by a smoothing constant.
- **Requires six qualifying sessions in the window before it fires at all.** A new participant is never drifted.
- **Symmetric and reversible.** `driftLevel` falls under the same persistence discipline. A participant who recovers from a chest infection returns to their previous schedule automatically, because drift never mutated any item's own state (§7.3).
- **Excludes probe items entirely** (requirement 13): `presented` counts non-probe roster entries only.
- **Surfaces to nobody** (requirement 10, P24). `driftLevel` is domain state. It is written to telemetry as `drift_adjustment_applied` in the research plane. There is no clinician-facing rendering, no caregiver-facing rendering, no patient-facing rendering. The only human-visible consequence is that sessions become slightly more frequent and slightly more supported.

Effects of `driftLevel` (all presentation-time, none mutating item state):

| Target | Transform |
|---|---|
| Opening cue level | `min(cueLevel + driftLevel, 3)` |
| Effective across rung | `clamp(acrossRung - driftLevel, 0, max(0, CEILING_RUNG[tier] - driftLevel))` |
| Within-session start rung | `clamp(withinStartRung - driftLevel, 0, 6)` |
| Vanish attempts | suppressed while `driftLevel > 0` |

---

## 12. The probe set — requirement 13

`isProbe === true` items are **structurally invisible to everything above**. This is enforced by construction, not by conditionals scattered through the code: probe items are never members of `state.items` at all. They live in `config.probeItemIds: ItemId[]`, an ordered list, and the scheduler's only interaction with them is emitting a block.

```
probeDue(state, nowMs) =
     config.probeItemIds.length > 0
  && !participant.probeDisabled                   // §5.2 point 5
  && session.isFirstSessionOfLocalDay
  && !session.probeEmitted
  && (nowMs - session.startedAtMs - session.probeElapsedMs) >= floor(config.sessionMaxMs / 2)
```

The block is `config.probeItemIds.slice(0, PROBE_MAX_ITEMS (8))` **in list order** — identical items, identical order, every day, which is the BRANCH fixed-stimulus shape §5.2 point 1 requires. Each probe trial:

- opens at **cue level 0**, uncued, one attempt;
- `correct` from that first uncued attempt is recorded and **is a real recorded failure** (§5.2 point 3, the only place in the product where one exists);
- on `MISS`, the answer is supplied and the item is re-presented at cue level 3, terminating in `EXPOSURE`. The person always succeeds; the miss is still in the log. *You can record a failure and still never display one.*

Probe trials **do not** count toward `SESSION_MAX_TRIALS`, do not consume `sessionMaxMs` (their elapsed time accumulates into `session.probeElapsedMs`, which is subtracted from the budget check), do not touch `lastPresentedItemId`, do not enter `participant.history`, do not affect `driftLevel` or `difficultyFloorTriggered`, and write no `ItemState` anywhere. The block is capped at `PROBE_MAX_MS (120000)`; the runtime truncates it and logs the truncation.

`probeDisabled` is set by a human event only (`ProbeDisabled{by, reason}`), per §5.2 point 5, and the disabling is an adverse event, not missing data.

---

## 13. Distress, retirement, and the things the algorithm cannot do

### 13.1 Distress is an absorbing state stronger than any interval logic (requirement 14, P18)

```
DistressReported {
  atMs, sessionId,
  itemId?: ItemId,
  severity: 'mild' | 'moderate' | 'severe',
  source: 'patient_control' | 'caregiver_report' | 'abandonment' | 'repeated_skip'
}
```

`source` is exhaustive and contains **no inferred-classifier option**. There is no code path in this module that constructs a `DistressReported` event; the module only consumes them. EU AI Act Art. 5(1)(f) compliance is therefore a property of the type, checkable by reading `schema.ts`.

On any `DistressReported`, in this order:

1. `activeSession.endRequested = 'distress_stop'`. `nextTrial` returns `END` immediately on its next call. No further trial is issued.
2. **No closer is emitted.** Requirement 14 outranks P1, and the session is logged `ended_on_success = false`.
3. The subject item — `event.itemId` if present, otherwise the item of the trial in progress, otherwise none — gets `status = 'absorbing_distress'`. Its `acrossRung`, `cueLevel` and `stableSessions` are **frozen at their pre-session values**.
4. On the subsequent `SessionEnded{reason: 'distress_stop'}`, **no per-item transitions are applied to any item.** Not the misses, not the cleans. `sessionsSincePresented` is not incremented. `lastSeenAtMs` and `dueAtMs` are not updated.

Rationale for step 4: a distress-aborted session is an **adverse event, not evidence**. Reading it as evidence would let a single upsetting moment expand intervals (via the cleans that preceded it) or contract them (via the misses) on the basis of a session that ended in harm. Discarding it is one line and has no ambiguous cases.

The session **is still pushed to `participant.history`** if it presented ≥3 items, so repeated distress does register in the drift window. Hiding adverse sessions from the drift detector would be the wrong kind of tidiness.

An `absorbing_distress` item is excluded from `eligible` in every pool. It returns **only** on `ItemReEnabled{itemId, by: 'caregiver'|'clinician'}`, which sets `status = 'active'`, `cueLevel = 3`, `acrossRung = 0`, `stableSessions = 0` — maximum support, minimum gap, re-earning its way up through the ordinary rules.

### 13.2 Nothing is removed by the algorithm (requirements 5 and 15, P3, NEVER-DO #8)

The **only** transitions into `status = 'retired'` are `ItemRetired{itemId, by: 'caregiver' | 'clinician', reason}`. The `by` field has no `'algorithm'` variant, in the type. There is no leech threshold, no lapse counter in state, no suspend, no auto-delete, no "mature card" concept, and no interval above which an item stops appearing.

A blind test-writer can assert this negatively and completely:

> For every event type in `SchedulerEvent` except `ItemRetired`, folding it over any state never produces an item with `status === 'retired'`.

That is one property-based test over the full event union and it closes requirement 15 permanently.

---

## 14. Compliance against the seventeen binding requirements

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Two timescales, one item; within `10–640 s` personalisable start; across `same day…14 d` | **Satisfied** | `WITHIN_LADDER_MS` §2, `ACROSS_LADDER_MS` §2, `config.withinStartRung` §3.4, §6, §8 |
| 2 | Objective grading from `correct × cue_level × latency_ms × attempt_index`; no self-report | **Satisfied** | §5. All four inputs consumed; the `Attempt` type has no confidence, no self-rating, no ASR field |
| 3 | Ceilings: 30 d global, 7 d tier-1 | **Satisfied** | `CEILING_RUNG = {1:4, 2:6, 3:6}`; binds inside the only advance rule, §8.2 |
| 4 | Failure adds cue support, not interval change | **Satisfied** | §6.2 `MISS` row leaves `withinRung` unchanged; §7.2 floor-miss raises `cueLevel` at trial close so the next presentation is one rung easier |
| 5 | No automatic removal; items degrade to exposure and stay | **Satisfied** | §13.2. No lapse counter exists in state; fixed point of §9.1 is exposure-in-every-session |
| 6 | Tiering with inverted economics: frequency floor + interval ceiling | **Satisfied** | §10. Two clamps and a counter; no retrievability to override. Unsatisfiability is signalled, never silent |
| 7 | Target ≥95% success as presented, via cue support | **Partially satisfied — declared** | §11.1. Displayed success is 100% by construction (§6.1). Recorded success is a control target with a one-session-lag floor and a convergent loop, **not an invariant.** No design can guarantee it against delirium or medication change; a design that claims to is predicting the patient |
| 8 | Interleaving fills the gap, 6–10 items | **Satisfied** | `SESSION_MAX_ITEMS = 8`; roster always filled; back-to-back presentation forbidden while ≥2 candidates exist, §6.4 |
| 9 | Intervals must contract as well as expand | **Satisfied, with a proof** | §9. Two per-item mechanisms plus a global one; monotone convergence on bounded integers |
| 10 | Progression-drift term exists, surfaces to nobody | **Satisfied** | §11.4. Integer, bounded, symmetric, presentation-time-only, no rendering path |
| 11 | Fluctuation-aware: persistence across sessions, never one bad day | **Satisfied** | §11.4 requires 3 consecutive above-target sessions and ≥6 qualifying sessions in 14 days. Fast response is confined to cue support (§11.1), which is always safe |
| 12 | Session capped by time and items, ends on success, no due-count, no backlog, no skip consequence | **Satisfied** | §11.2 (roster always filled — backlog is not representable), §11.3 (closer), §6.4 (budgets) |
| 13 | Probe set invisible to the scheduler | **Satisfied structurally** | §12. Probe items are not members of `state.items`; invisibility is a consequence of the data layout, not a set of guards |
| 14 | Distress is absorbing, stronger than interval logic | **Satisfied** | §13.1. Ends the session with no closer; freezes the item; discards the session's transitions; returns only on a human event |
| 15 | Nothing dropped on a caregiver's behalf | **Satisfied** | §13.2. `by` has no `'algorithm'` variant. One property test closes it |
| 16 | Rich per-attempt telemetry for a retrospective DSR/FSRS fit | **Partially satisfied — declared** | §15. Every raw field needed for a retrospective fit is emitted. **The derived fields `stability`, `difficulty`, `retrievability`, `predicted_recall_probability` in synthesis §7 are emitted as `null`, because this design has no continuous model.** That is the cost of the thesis and it is stated, not hidden |
| 17 | Licensing: no SuperMemo code, no AGPL Anki code | **Satisfied trivially** | Zero third-party algorithm code. Both ladders are protocol descriptions from Camp/Creighton/Tactus (clinical literature, not software). No SM-2 formula, no DSR functional form, no FSRS weights |

**Two partial satisfactions, both declared: requirement 7 (target, not invariant) and requirement 16 (raw log yes, derived model fields null).** Everything else is fully satisfied, and five of them (5, 13, 15, 17, and half of 2) are satisfied *structurally* — by the shape of the types rather than by logic that could be wrong.

---

## 15. Telemetry emitted

Per non-probe, non-closer trial, the scheduler supplies the §7 `interaction` scheduling-state group:

`item_id`, `item_is_probe` (false), `item_tier`, `repetition_number`, `days_since_last_review` (integer floor of `(atMs − lastSeenAtMs)/86400000`), `days_since_first_introduction`, `scheduled_interval_days` (`ACROSS_LADDER_MS[effectiveAcrossRung] / 86400000`, integer where whole, else the ms value with a `scheduled_interval_ms` companion for rung 0), `interval_deviation_ms` (actual minus scheduled, signed), `within_session_rung`, `attained_rung` (`acrossRung`), `drift_adjustment_applied` (`driftLevel`), `difficulty_floor_triggered`, `opening_cue_level`, `floor_cue_level`, `was_vanish_attempt`, `hint_level_reached`, `presentation_mode` (derived from terminal cue level), `n_distractors`, `rescued_to_success`, `attempt_count`, `is_closer`.

Emitted as `null` in v1, with the reason recorded in the field dictionary: `stability`, `difficulty`, `retrievability`, `predicted_recall_probability`. **This design has no such quantities.** Requirement 16's actual purpose — that a DSR/FSRS-shaped model can be fitted *retrospectively to this population*, which nobody has done — is fully served, because a retrospective fit needs `(item, participant, timestamp, elapsed, cue level, correct, latency)` and every one of those is logged at full resolution. The fit does not need the engine to have believed in a model while collecting the data. Arguably it is better that it did not: an engine that schedules by a model produces reviews correlated with the model's own predictions, and the resulting dataset is confounded for fitting that same model. **A ladder-scheduled dataset is a cleaner instrument for the research contribution than a model-scheduled one.** That is a genuine, non-obvious argument for this design and it is the strongest one I have.

Per session, the scheduler supplies: `ended_on_success`, `session_end_reason`, `planned_n_items`, `completed_n_items`, `generic_opener_played`, `generic_closer_played`, `probe_block_emitted`, `probe_truncated`.

**Signals emitted (never rendered to the patient, ever):**

```ts
type SchedulerSignal =
  | { kind: 'tier1_floor_unsatisfied'; itemIds: ItemId[] }        // → caregiver authoring surface
  | { kind: 'acute_change_suspected'; atMs: number };             // → P25 policy only
```

The acute-change signal (P25, requirement 10's single permitted caregiver route) is deliberately much sharper than drift, because delirium is acute while progression is slow:

```
acuteChangeSuspected(history, nowMs) =
     at least 3 entries in the last 7 days
  && the last 2 entries both have missRatePpt >= ACUTE_MISS_PPT (400)
  && median missRatePpt of the 5 entries immediately preceding those 2 is <= ACUTE_BASELINE_PPT (150)
```

Median of 5: sort the five values ascending, take index 2. Exact, integer, no interpolation.

**The scheduler does not act on this signal.** It changes no interval and no cue level. It is handed to the caregiver surface, which renders it only in P25's physical-illness wording — *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."* Never a cognitive interpretation, never to a clinician in v1 (P24).

---

## 16. Public surface, and what the blind test-writer gets

```ts
// src/contract/ports.ts — Scheduler
export interface Scheduler {
  initialState(config: SchedulerConfig): SchedulerState;
  reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState;   // pure, total
  nextTrial(state: SchedulerState, nowMs: number): TrialDirective;        // pure
  planRoster(state: SchedulerState, nowMs: number): RosterPlan;           // pure
  gradeOf(a: Attempt, slowLatencyMs: number): Grade;                      // pure
  signals(state: SchedulerState, nowMs: number): SchedulerSignal[];       // pure
}
```

`reduce` is **total**: every event type applied to every state yields a state. Events that are meaningless in context (a `TrialCompleted` with no active session, a duplicate `SessionEnded`) return the state unchanged rather than throwing. A scheduler that throws on a replayed event cannot be recomputed from a log on a server, and the ADR requires exactly that.

Because there is no `Clock` or `Rng` inside the fold, the entire unit suite runs with **zero mocks and zero fakes** — the ADR §6.3 target ("Zero mocks; everything injected") is met by there being nothing to inject.

**`src/contract/fixtures/scheduler/` — the expected-output tables.** These are what actually make blind test-authoring work, and they are data, not prose:

| File | Shape | Rows |
|---|---|---|
| `grades.json` | `{correct, cueLevel, latencyMs, attemptIndex, slowLatencyMs} → grade` | Full cross-product: 2 × 4 × {0, 1, 7999, 8000, 8001, 30000} × {0, 1} = 96 rows. `gradeOf` is total over its domain, so the table is exhaustive, not sampled |
| `cue-transitions.json` | `{cueLevel, openingCue, grade0} → {cueLevel', stableSessions', vanishResolved}` | 4 × 4 × 4 = 64 rows, including the impossible combinations marked `unreachable` |
| `across-transitions.json` | `{tier, acrossRung, outcome, driftLevel} → {acrossRung', dueOffsetMs}` | 3 × 7 × 5 × 3 = 315 rows |
| `roster-order.json` | item arrays with `nowMs` → expected ordered `itemId[]` | ~30 hand-built cases: all-due, none-due, forced-tier-1 overflow, fresh-item cap, exact-tie-on-dueAt-broken-by-itemId |
| `drift.json` | `history[] × nowMs × driftLevel → driftLevel'` | ~40 cases: below `DRIFT_MIN_SESSIONS`, exactly at it, 2-consecutive vs 3-consecutive, recovery, the `bad*2 > n` boundary at `n = 6, 7` |
| `sessions/*.json` | full event log → full expected final `SchedulerState` | The three golden sessions of §17, plus a distress abort, plus a probe day, plus a 30-day no-contact replay |

The last row is the highest-value artefact: a **golden-log test**. Feed the event array, compare the serialised final state byte-for-byte. It cannot pass for the wrong reason, and it is writable by an agent who has never seen the implementation, from §17 alone.

**Negative assertions the spec licenses:**

- `rng.nextInt` is never called (§4).
- No `Date`, `Math.random`, `crypto`, `fetch`, `window`, `document` — ESLint `no-restricted-globals`, ADR §6.2.
- No non-integer intermediate value appears in any state field: assert `Number.isInteger` on every numeric field of the serialised state after every fold step.
- No fold of any event other than `ItemRetired` produces `status === 'retired'` (§13.2).
- `reduce(reduce(s, e), e)` for a duplicate-delivered event equals `reduce(s, e)` for every idempotent event type, and the event log's `eventSeq` makes non-idempotent replays detectable.

---

## 17. Worked example — three sessions of one item, every number

**Item** `it_0042` — a photograph of the participant's daughter Margaret with her name and relationship. `tier: 1`, `isProbe: false`, `recognitionBlocked: false`.

**Config:** defaults. `withinStartRung = 0`, `sessionMaxMs = 600000`, `slowLatencyMs = 8000`, `CEILING_RUNG[1] = 4`.
**Participant:** `driftLevel = 0`, `difficultyFloorTriggered = false` throughout (other items in the roster performed at target).

**State entering Session A** (this item has been in rotation for some weeks):

```
acrossRung: 3   (ACROSS_LADDER_MS[3] = 345_600_000 ms = 4 days)
cueLevel:   1   (partial cue — first letter of "Margaret")
stableSessions: 1
lastSeenAtMs: T0
dueAtMs:      T0 + 345_600_000
sessionsSincePresented: 0
```

---

### Session A — `SA = T0 + 349_000_000` (4 days 1 hour after last seen; due)

Roster: `isForced` = false (`sessionsSincePresented` is 0), `dueAtMs <= SA` → key component 2 = 0, `tier` = 1 → sorts near the front of an 8-item roster.

Enter session: `withinRung = clamp(0 − 0, 0, 6) = 0`; `nextEligibleAtMs = SA`; `trialsThisSession = 0`.
Vanish check: `stableSessions (1) >= 2`? **No.** Opening cue = floor = **1** for every trial this session.

| # | Presented at | Opening cue | attempt 0 | latency | **Grade** | Response at | `WITHIN_LADDER_MS[r]` | next eligible | `withinRung` after |
|---|---|---|---|---|---|---|---|---|---|
| T1 | `SA+9 000` | 1 | correct | 4 200 | **CLEAN** | `SA+13 200` | `L[0]=10 000` | `SA+23 200` | 0 → 1 |
| T2 | `SA+48 000` | 1 | correct | 3 100 | **CLEAN** | `SA+51 100` | `L[1]=20 000` | `SA+71 100` | 1 → 2 |
| T3 | `SA+95 000` | 1 | correct | **9 500** | **SLOW** | `SA+104 500` | `L[2]=40 000` | `SA+144 500` | 2 → 3 |
| T4 | `SA+152 000` | 1 | correct | 5 000 | **CLEAN** | `SA+157 000` | `L[3]=80 000` | `SA+237 000` | 3 → 4 |
| T5 | `SA+240 000` | 1 | correct | 4 800 | **CLEAN** | `SA+244 800` | `L[4]=160 000` | `SA+404 800` | 4 → 5 |
| T6 | `SA+410 000` | 1 | correct | 6 200 | **CLEAN** | `SA+416 200` | `L[5]=320 000` | `SA+736 200` | 5 → 6 |

T3 is the only interesting row: 9 500 ms > `slowLatencyMs` 8 000, so `CLEAN` becomes `SLOW`. Note the person answered **correctly**; nothing was displayed differently and the interval did not move.

At `SA+600 000` the budget check `600 000 − 0 >= 600 000` fires → `END('budget_time')`. Next eligible for this item was `SA+736 200`, so it would not have been presented again anyway. Closer trial (a cue-3 item), then generic closer.

**Session A close for `it_0042`:**

```
floorTrials (opening cue 1 == floor 1): [CLEAN, CLEAN, SLOW, CLEAN, CLEAN, CLEAN]
  any MISS?  no
  any SLOW?  YES               -> outcome = SLOW_SESSION

acrossRung      : hold at 3                              (SLOW does not expand)
stableSessions  : 1 -> 0                                 (SLOW resets the vanish streak)
cueLevel        : 1 (unchanged — no floor miss, no vanish attempt)
repetitionNumber: += 6
lastSeenAtMs    : SA + 416 200
sessionsSincePresented : 0
effectiveAcrossRung = clamp(3 − 0, 0, max(0, 4 − 0)) = 3
dueAtMs         : SA + 416 200 + 345 600 000 = SA + 346 016 200
```

*One slow answer among six correct ones cost the item its interval expansion and its vanish streak. That is the whole effect of `SLOW_LATENCY_MS` — conservative in both directions, exactly as claimed in §2.*

---

### Session B — `SB = SA + 347 000 000` (≈4 days 0.4 h later; due)

Enter: `withinRung = 0`, `nextEligibleAtMs = SB`.
Vanish check: `stableSessions (0) >= 2`? **No.** Opening cue = **1**.

| # | Presented at | Opening cue | attempt 0 | latency | **Grade** | Response at | `L[r]` | next eligible | `withinRung` |
|---|---|---|---|---|---|---|---|---|---|
| T1 | `SB+11 000` | 1 | correct | 3 900 | **CLEAN** | `SB+14 900` | 10 000 | `SB+24 900` | 0 → 1 |
| T2 | `SB+44 000` | 1 | correct | 4 100 | **CLEAN** | `SB+48 100` | 20 000 | `SB+68 100` | 1 → 2 |
| T3 | `SB+90 000` | 1 | correct | 3 600 | **CLEAN** | `SB+93 600` | 40 000 | `SB+133 600` | 2 → 3 |
| T4 | `SB+140 000` | 1 | correct | 5 500 | **CLEAN** | `SB+145 500` | 80 000 | `SB+225 500` | 3 → 4 |
| T5 | `SB+230 000` | 1 | correct | 4 000 | **CLEAN** | `SB+234 000` | 160 000 | `SB+394 000` | 4 → 5 |
| T6 | `SB+400 000` | 1 | correct | 4 400 | **CLEAN** | `SB+404 400` | 320 000 | `SB+724 400` | 5 → 6 |

`END('budget_time')` at `SB+600 000`. Closer, generic closer.

**Session B close:**

```
floorTrials: [CLEAN ×6]
  any MISS? no.  any SLOW? no.  all EXPOSURE? no.   -> outcome = CLEAN_SESSION

acrossRung      : min(3 + 1, CEILING_RUNG[1] = 4) = 4        <- 4 days becomes 7 days
                  (the tier-1 ceiling of rung 4 = 7 d now BINDS; a tier-2 item
                   would have gone on to rung 5 = 14 d and eventually rung 6 = 30 d)
stableSessions  : 0 -> 1                                     (vanishResolved = false)
cueLevel        : 1
lastSeenAtMs    : SB + 404 400
effectiveAcrossRung = clamp(4 − 0, 0, 4) = 4  ->  ACROSS_LADDER_MS[4] = 604 800 000
dueAtMs         : SB + 404 400 + 604 800 000 = SB + 605 204 400
```

*Requirement 3 and requirement 6 in one line: the item wanted to keep expanding and the tier-1 ceiling stopped it at 7 days. No prediction was involved.*

---

### Session C — `SC = SB + 606 000 000` (≈7 days later; due)

Enter: `withinRung = 0`, `nextEligibleAtMs = SC`.
Vanish check: `stableSessions (1) >= 2`? **No.** Opening cue = **1**.

**T1 — a miss, and the whole of requirement 4 in one trial.**

- Presented `SC+10 000`, opening cue **1**, `attemptIndex 0`. No response by 30 000 ms → runtime submits `{correct: false, latencyMs: 30 000}` → **MISS**.
- The answer is supplied immediately and warmly (`SC+40 000` → `SC+46 000`): *"That's Margaret — your daughter."*
- Attempt 1 opens at cue `min(1 + 0 + 1, 3) = 2`, two-alternative recognition. Foil chosen by §7.4: `foilPool` = active tier-1 items sorted by `itemId`, index `trialsCompleted (0) mod |pool|`. Response correct, 4 100 ms, `attemptIndex 1` → **SLOW** (a rescue can never be `CLEAN`). Trial terminates in success. Terminal response `SC+50 100`.
- **Trial close:** `c0 (1) === floor (1)` and `g0 === MISS` → **floor miss**:

```
cueLevel       : min(1 + 1, 3) = 2          <- applied NOW, not at session close
stableSessions : 1 -> 0
withinRung     : 0 -> 0    UNCHANGED        <- requirement 4: the interval does not move
nextEligibleAtMs = 50 100 + L[0] (10 000) = SC + 60 100
floorTrials    : [MISS]
```

**T2 onward — the very next presentation is one cue rung easier**, at the new floor of 2. Vanish is not possible (`stableSessions = 0`).

| # | Presented at | Opening cue | attempt 0 | latency | **Grade** | Response at | `L[r]` | next eligible | `withinRung` |
|---|---|---|---|---|---|---|---|---|---|
| T2 | `SC+72 000` | **2** | correct | 3 800 | **CLEAN** | `SC+75 800` | 10 000 | `SC+85 800` | 0 → 1 |
| T3 | `SC+95 000` | 2 | correct | 3 200 | **CLEAN** | `SC+98 200` | 20 000 | `SC+118 200` | 1 → 2 |
| T4 | `SC+130 000` | 2 | correct | 4 900 | **CLEAN** | `SC+134 900` | 40 000 | `SC+174 900` | 2 → 3 |
| T5 | `SC+185 000` | 2 | correct | 3 400 | **CLEAN** | `SC+188 400` | 80 000 | `SC+268 400` | 3 → 4 |
| T6 | `SC+275 000` | 2 | correct | 4 600 | **CLEAN** | `SC+279 600` | 160 000 | `SC+439 600` | 4 → 5 |
| T7 | `SC+445 000` | 2 | correct | 3 900 | **CLEAN** | `SC+448 900` | 320 000 | — | 5 → 6 |

After T7, `trialsThisSession = 7 = MAX_TRIALS_PER_ITEM_PER_SESSION` → the item leaves rotation for this session. The remaining ~150 s of budget goes to other roster items.

`END('budget_time')` at `SC+600 000`. Closer, generic closer.

**Session C close:**

```
floorTrials: [MISS, CLEAN, CLEAN, CLEAN, CLEAN, CLEAN, CLEAN]
  any MISS at floor? YES                            -> outcome = MISSED_SESSION

acrossRung      : max(4 − 1, 0) = 3                 <- 7 days CONTRACTS back to 4 days
stableSessions  : 0
cueLevel        : 2   (already applied at T1's trial close)
lastSeenAtMs    : SC + 448 900
effectiveAcrossRung = clamp(3 − 0, 0, 4) = 3  ->  ACROSS_LADDER_MS[3] = 345 600 000
dueAtMs         : SC + 448 900 + 345 600 000 = SC + 346 048 900
```

**Session-level:** suppose 6 of 8 roster items were presented and this was the only `MISSED_SESSION`. Then `missRatePpt = floor((1000 × 1) / 6) = 166 > 50` → `difficultyFloorTriggered = true`, and in the **next** session every non-probe item opens one rung easier and all vanish attempts are suppressed. `{startedAtMs: SC, presented: 6, missRatePpt: 166}` is pushed to `participant.history`. Drift is evaluated; with fewer than 6 qualifying sessions in the trailing 14 days, or without 3 consecutive above-target sessions, `driftLevel` stays 0.

---

### The three sessions in one line each

| | Outcome | `acrossRung` | Interval | `cueLevel` | `stableSessions` |
|---|---|---|---|---|---|
| **Entering A** | — | 3 | 4 d | 1 | 1 |
| **A** | `SLOW_SESSION` (one 9.5 s answer) | 3 — **hold** | 4 d | 1 | **0** |
| **B** | `CLEAN_SESSION` | **4** — expand, **ceiling binds** | **7 d** | 1 | **1** |
| **C** | `MISSED_SESSION` (one timeout) | **3** — **contract** | **4 d** | **2** — support added | **0** |

Hold, expand into the tier-1 ceiling, contract with added support. Three integers moved. Requirements 3, 4, 6 and 9 are all visible in that table, and a clinician can read it without being told what any of it means.

---

## 18. What I considered and rejected

| Rejected | Why |
|---|---|
| A retrievability estimate `R(t,S)` | It answers "when does recall probability cross the target?", a question requirement 7 and NEVER-DO #10 forbid us to ask. Remove the question, remove the machinery |
| Hysteresis on interval advance (require 2 clean sessions) | Would remove ladder chatter (§9.3). Costs an eleventh invented constant to fix a clinically benign artefact. The parameter loses |
| One state change per session (either cue or interval, not both) | Safer-feeling, one line, no clinical source. A miss next session undoes both moves anyway |
| Per-item `withinStartRung` | Camp's protocol restarts the ladder each session. A per-item within-session start is state with no source |
| Reverting `withinRung` to the last successful rung on a miss (Camp's literal rule) | Superseded by requirement 4 and P2, which are binding: difficulty is carried by cue level, never by interval length |
| A `maxAttemptsPerTrial` cap | Unnecessary: the cue ladder's cap at 3 bounds it structurally at `4 − c`, and §6.1 shows the 4-attempt case is confined to people currently succeeding at free recall |
| Excluding distress-aborted sessions from `participant.history` | Tidier, and wrong. Repeated distress must register in the drift window |
| A skip counter feeding `repeated_skip` distress | The patient surface has no per-item skip (P9: single tap, one action per screen). "Not today" is session-level. The counter would be state with no producer |
| `Rng` for foil selection | §7.4 is deterministic and clinically better (same-tier foils). Removing the last `Rng` call makes the whole module a pure function of the event log |

---

## 19. What would make this design wrong

Stated so the pilot can falsify it rather than confirm it.

1. **If ladder chatter is not benign** — if the pilot's distress register shows adverse events clustering on items oscillating between two rungs — then hysteresis is required and the "no eleventh constant" position loses.
2. **If `SLOW` at 8 000 ms fires on most trials** in a real mild-to-moderate cohort, then intervals essentially never expand, the design collapses to a fixed 90-minute/1-day schedule, and `slowLatencyMs` must be fitted per participant — which is the first crack in "no fitted parameters".
3. **If seven across-rungs is too coarse** — if per-item retention curves fitted retrospectively (criterion M1) show a strong mode between 7 and 14 days that the ladder cannot express — then the ladder needs more rungs, or a continuous interval, and the pure position weakens.
4. **If `driftLevel` never fires** in a 12-week pilot because `DRIFT_MIN_SESSIONS = 6` is unreachable at real adherence rates (iCST: 40% managed ≥2/week), then requirement 10 is satisfied on paper and dead in practice. **This is the most likely of the five.**
5. **If the tier-1 floor is routinely unsatisfiable** because families mark 15 items as essential, then `SESSION_MAX_ITEMS` and the floor are in genuine conflict and one of them must give.

Each of these is measurable from the telemetry in §15 without any additional instrumentation, which is the point of logging raw rather than logging model state.

---

## 20. One-paragraph summary

The engine is two bounded integer ladders and a negative-feedback loop. Difficulty is carried entirely by a four-rung cue ladder that rises on one missed trial and falls after two stable sessions; frequency is carried entirely by a seven-rung interval ladder that advances on a clean session, holds on a slow or exposure session, and retreats on a missed session, clamped by tier. Failure never moves an interval; it adds support. Every trial terminates in a success or a warm exposure by construction. Contraction is guaranteed by a monotone argument on two bounded integers whose joint fixed point — presented every session as a familiarity exposure, still offered a way back up — is precisely the end state the safety principles prescribe. There is no continuous model, no floating-point arithmetic, no fitted parameter, no clock inside the fold, and no randomness anywhere. Ten constants are invented; eight of them fail toward more contact and more support, and all twenty are in one table. Requirement 7 is satisfied as a control target with a one-session-lag floor rather than as an invariant, and requirement 16's derived model fields are emitted as `null` — those two admissions are the price of the thesis, and I would rather pay them in the open than build twenty-one weights nobody in this population has ever fitted and no clinician can read.
