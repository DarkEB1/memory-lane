# Scheduler Design — Continuous Memory Model (`mm`)

**Status:** proposal · **Date:** 2026-08-12 · **Module:** `src/domain/scheduler.ts`
**Algorithm id:** `mm-1.0.0` (logged as `scheduler_algorithm_version` on every interaction)
**Governed by:** `docs/research/00-SYNTHESIS.md` §4, §5.1, §5.2, §6 (all 17), §9; `docs/architecture/00-ADR-PLATFORM.md` §4.4, §6.

---

## 0. Thesis, stated so it can be attacked

Synthesis §6.16 says: *log rich per-attempt telemetry so a DSR/FSRS-shaped model can be fitted retrospectively to this population — nobody has done that, it is the genuine research contribution.* It then specifies the shape that model should take: power-law `R(t,S) = (1 + factor·t/S)^(−decay)`, population priors from our own cohort, **per-item Bayesian updating rather than per-user optimisation**, retention target ≥0.95, capped max interval, plus a progression term.

This design says: **build that model now, in v1, as the scheduler, rather than fitting it in v2 to data a fixed ladder generated.**

The argument in one line: **a fixed ladder is a quantiser, and you cannot fit a continuous model to quantised outputs of your own decisions without confounding the model with the policy.**

Concretely, three losses a ladder imposes:

1. **A ladder discards latency.** "Correct in 1.1 s" and "correct in 14.2 s" advance the ladder identically. In this population latency is the earliest and most sensitive signal there is (synthesis §3 #44: RT-based intra-individual variability predicts decline, (a)). A ladder throws it away at the point of decision and can only recover it in post-hoc analysis, where it is no longer separable from the schedule the ladder chose.
2. **A ladder cannot express what within-session work bought you.** Camp's whole clinical logic is that the attained within-session delay predicts across-session retention. A ladder advances one rung whether the person bridged 10 s or 640 s. Stamate 2020 — the strongest single study in the corpus on our exact question — found the AD deficit is in **encoding, not decay**. A model with an explicit encoding term can represent that finding; a ladder structurally cannot.
3. **A ladder cannot report a per-item forgetting curve, which is success criterion M1.** M1 requires "fitted `forgetting_rate_lambda` per item per participant". If the scheduler is a ladder, every interval in the dataset was chosen by the ladder, so the observed successes are a function of the ladder's step sizes as much as of memory. A model that schedules from its own posterior produces intervals that vary continuously with the item's estimated state, which is exactly the design that makes the retrospective fit identifiable.

**And the counter-argument, conceded up front:** every one of the 17 binding requirements was written to constrain a scheduler, and a continuous model has far more ways to violate them silently than a ladder does. §8 is therefore a line-by-line proof of non-violation, and §9 proves it is still a deterministic, blind-testable fold. If those two sections do not hold, this design should be rejected in favour of the ladder — the requirements outrank the research contribution.

**The single structural safety move that makes this defensible:** the clinical ladder from §6.1 is retained *in full*, not as the scheduler but as a **monotone upper bound** on every interval the model may propose (§4.6). The model is permitted to be more conservative than the ladder and is never permitted to be less. Therefore, at every point, for every item, this design's interval is ≤ the ladder design's interval. **It is dominated-safe relative to the ladder by construction.**

---

## 1. Vocabulary and the two levers

| Term | Meaning |
|---|---|
| **Trial** | One presentation of one item, graded or not. |
| **Inference trial** | `attempt_index === 0`: the first presentation of an item within a session. The **only** trial that updates the memory posterior. |
| **Camp trial** | `attempt_index ≥ 1`: a within-session repetition. Updates the encoding term; never updates the posterior. |
| **Cue level `c`** | `0` free recall · `1` partial cue · `2` two-alternative recognition · `3` familiarity exposure, no question asked. **Higher = more support.** |
| **Camp rung `k`** | Index into `CAMP_SECONDS`, the within-session delay ladder. |
| **Ladder index `L`** | Index into `LADDER_DAYS`, the across-session clinical ladder, used only as a ceiling. |
| **`S`** | Per-item stability, **in days**, defined as the elapsed time at which free-recall retrievability equals **0.90**. This is the FSRS convention, kept deliberately so our fitted numbers are comparable to the published literature. **It is not our retention target.** Our target is 0.95 and is enforced separately (§4.4). Confusing these two is the single most likely misreading of this document. |
| **`x`** | `ln S`. All inference happens in log space. |

**Fast lever and slow lever.** The design has exactly two levers and they are deliberately given different time constants:

- **Cue level is the fast lever.** It moves on a single trial, immediately, within the session. It is what responds to failure.
- **Stability is the slow lever.** It moves under a Bayesian update with a hard per-observation damper (§4.3), so no single session — and therefore no single Lewy-body bad hour — can move the schedule far.

Every requirement that says "on failure, do X" is discharged by the fast lever. Every requirement that says "intervals must be able to contract" is discharged by the slow lever plus the drift term. §8.4 proves these do not collide.

---

## 2. Constants

All constants are **compile-time, participant-independent, and versioned by `params_version`**. No constant is ever derived from any participant's data. This is the literal content of "per-item Bayesian updating, never per-user optimisation" (§6.16) and it is testable: `SCHEDULER_PARAMS` is a frozen object and no code path writes to it.

### 2.1 Memory model

| Name | Value | Notes |
|---|---|---|
| `DECAY` (D) | `0.5` | Chosen exactly 0.5. See §9.2 — this makes the entire retrievability and interval computation use only IEEE-754 correctly-rounded operations. |
| `FACTOR` (F) | `19/81 = 0.2345679012345679…` | Derived: `F = 0.9^(−1/D) − 1 = 0.9^(−2) − 1 = 1/0.81 − 1 = 19/81`, exact rational at D = 0.5. Verifies `R(S,S) = (1 + 19/81)^(−1/2) = (100/81)^(−1/2) = 0.9` exactly. |
| `TARGET` | `0.95` | Success target on the exercise **as presented** (§6.7). Flagged in §6.7 itself as a judgement call, not a derivation. |
| `G` (cue rescue) | `[0.00, 0.45, 0.75, 1.00]` | Probability of succeeding at cue level `c` **given the trace is not freely retrievable**. Decomposed for honesty as `G[c] = guess[c] + (1 − guess[c])·cue[c]` with `guess = [0, 0, 0.50, 0]` and `cue = [0, 0.45, 0.50, 1.00]`; `guess[2] = 0.5` is the chance floor of a two-alternative forced choice and is not a judgement call, the rest are. |
| `KAPPA` (κ) | `0.5` | Pessimism. Scheduling uses `exp(mu − κ·σ)`, a lower confidence bound, so uncertainty always shortens intervals. |
| `MU_INIT` | `ln(0.5) = −0.6931471805599453` | New item prior: S = 0.5 d. |
| `SIGMA2_INIT` | `1.0` | New item prior variance on `ln S` (σ = 1.0, i.e. a factor-of-e 1-sd band). |
| `MU_MIN` | `ln(1/48) = −3.8712010109078911` | S floor 30 minutes. |
| `MU_MAX` | `ln(400) = 5.991464547107982` | S ceiling 400 days (never reachable through the interval caps; a numerical guard only). |
| `SIGMA2_MIN` | `0.01` | σ floor 0.1. |
| `SIGMA2_MAX` | `1.44` | σ ceiling 1.2. |
| `Q_PER_DAY` | `0.004` | Process noise added to `sigma2` per elapsed day. Non-stationarity. |
| `MU_STEP_MAX` | `0.35` | Hard damper on `|Δmu|` from one Bayesian observation. Factor limit `e^0.35 = 1.4191`. This is the fluctuation guard (§6.11). |
| `ENC_STEP` | `0.11` | Encoding gain in log-S per attained Camp rung. |
| `ENC_STEP_MISS` | `0.055` | Encoding gain when the session's inference trial was a miss. Half. |

### 2.2 Derived scheduling quantities (exact, precomputed)

`requiredR(c) = (TARGET − G[c]) / (1 − G[c])`, undefined and unconstrained at `c = 3`.
`M[c] = (1 / F) · (requiredR(c)^(−2) − 1)` — the interval multiplier, `interval = S · M[c]`. Valid because D = 0.5 makes `r^(−1/D) = r^(−2)`.

| `c` | `G[c]` | `requiredR(c)` | `M[c]` |
|---|---|---|---|
| 0 | 0.00 | `0.95` | `0.4605627642513490` |
| 1 | 0.45 | `0.50/0.55 = 10/11 = 0.9090909090909091` | `0.8952631578947386` |
| 2 | 0.75 | `0.20/0.25 = 0.80` | `2.398026315789478` |
| 3 | 1.00 | — (no constraint) | `+Infinity` (interval is set entirely by the ceilings) |

These four numbers are golden constants a blind test must assert to 12 significant figures.

### 2.3 Ladders, caps and session shape

| Name | Value |
|---|---|
| `CAMP_SECONDS` | `[10, 20, 40, 80, 160, 320, 640]` (rungs `k = 0..6`) |
| `camp_start_index` | participant config, `0..6`, **default `0`** — this is §6.1's "personalisable start" |
| `LADDER_DAYS` | `[1/6, 1, 2, 4, 7, 14, 30]` (indices `L = 0..6`); `LADDER_DAYS[0] = 1/6 d = 4 h` is §6.1's "same day" |
| `GLOBAL_CEILING_DAYS` | `30` |
| `TIER_CEILING_DAYS` | `{1: 7, 2: 30, 3: 30}` |
| `TIER1_FLOOR_DAYS` | `3` — a tier-1 item unseen for 3 days is force-selected. Judgement call, flagged. |
| `MIN_INTERVAL_DAYS` | `1/6` (4 h) |
| `DRIFT_INTERVAL_MULT` | `[1.00, 0.75, 0.50]` indexed by `drift_level` |
| `SESSION_MAX_PERSONAL_ITEMS` | `8` |
| `SESSION_MAX_DURATION_MS` | `600000` (10 min); the closer is exempt |
| `MAX_PRESENTATIONS_PER_ITEM` | `6` per session |
| `MAX_NEW_ITEMS_PER_SESSION` | `2`, or `1` while `participant.session_count < 3` |
| `MAX_CUE3_ITEMS_PER_SESSION` | `3` (load balance; tier-1 floor overrides) |
| `CAMP_CUE_MAX` | `2` — Camp trials always ask a question; cue 3 is reserved for inference trials of cue-3 items, the answer-reveal after a miss, and the closer |
| `CAMP_MISS_LIMIT` | `3` misses at cue 2 within one session → item's Camp loop ends for the session |
| `VANISH_THRESHOLD` | `2` consecutive qualifying inference successes |
| `VANISH_LATENCY_MS` | `6000` |
| `RESPONSE_TIMEOUT_MS` | `30000` |
| `SESSION_FLOOR_MIN_TRIALS` | `5`, `SESSION_FLOOR_ACCURACY` `0.80` (within-session safety valve, §5.5) |

---

## 3. State

### 3.1 `ItemState` — the folded, byte-comparable record

```ts
type ItemState = {
  item_id: string;              // UUIDv7
  tier: 1 | 2 | 3;
  created_at_ms: number;        // int, copied from event
  content_ready: boolean;

  mu: number;                   // q6-quantised float, ln S, in [MU_MIN, MU_MAX]
  sigma2: number;               // q6-quantised float, in [SIGMA2_MIN, SIGMA2_MAX]

  cue_level: 0 | 1 | 2 | 3;
  ladder_index: 0|1|2|3|4|5|6;
  consec_success_at_rung: number;   // int ≥ 0
  attained_index_last: number;      // int in [-1, 6]

  last_seen_end_ms: number | null;  // int, session_ended_at of last session containing it
  session_count: number;            // int
  presentation_count: number;       // int
  miss_count: number;               // int — TELEMETRY ONLY. Read by no scheduling rule.

  absorbing: 'none' | 'distress';
  distress_at_ms: number | null;
  retired_by: null | 'caregiver' | 'clinician';
};
```

`q6(x) = Math.round(x * 1e6) / 1e6` is applied to `mu` and `sigma2` at every write. Every other field is an integer, a boolean or a string enum.

**`due_at_ms` and `scheduled_interval_ms` are deliberately NOT stored.** They are pure query functions of `ItemState` (§4.7). This is the key determinism move and it is explained in §9.2.

### 3.2 `ParticipantState`

```ts
type ParticipantState = {
  camp_start_index: number;         // 0..6, default 0
  drift_level: 0 | 1 | 2;
  drift_last_changed_day: number | null;
  session_support_history: Array<{ day_offset: number; support_index: number }>; // q6, bounded ring, 90 entries
  session_count: number;
  probe_enabled: boolean;
  acute_change_last_fired_day: number | null;
};
```

`min_support = drift_level`. Every presentation uses `presentation_cue = max(item.cue_level, min_support, session_min_support)`.

### 3.3 `OpenSession` — transient, integers only

```ts
type OpenSession = {
  session_id: string;
  started_anchored_ms: number;
  session_min_support: 0 | 1 | 2 | 3;
  graded_trials: number;
  graded_successes: number;
  items: Record<ItemId, {
    presentations: number;
    camp_index: number;
    camp_cue_level: number;
    camp_due_mono_ms: number;
    attained_index: number;           // -1..6
    camp_misses_at_cue2: number;
    inference: null | {
      cue_level: number;
      correct: boolean;
      latency_ms: number;
      informative: boolean;
      y_star_milli: number;           // y* × 1000, stored as an integer
    };
  }>;
};
```

`y_star` is stored ×1000 as an integer so `OpenSession` contains no floats at all and is trivially byte-comparable mid-session.

### 3.4 `SchedulerState`

```ts
type SchedulerState = {
  version: 1;
  params_version: 'mm-1.0.0';
  items: Record<ItemId, ItemState>;   // probe items are NEVER present in this map
  participant: ParticipantState;
  open_session: OpenSession | null;
};
```

---

## 4. The memory model

### 4.1 Retrievability

```
R(t, S) = (1 + F·t/S)^(−D)     with D = 0.5
        = 1 / sqrt(1 + F·t/S)
```

`t` in days, `S` in days, `F = 19/81`. Implementation uses `1 / Math.sqrt(1 + F * t / S)` — never `Math.pow`. See §9.2.

### 4.2 Success probability at a cue level

```
P(t, S, c) = R(t, S) + (1 − R(t, S))·G[c]
```

This is the whole reason a cue ladder and a memory model compose cleanly: `G[c]` is a floor on success that the trace does not have to supply. `P(·, ·, 3) = 1` identically, which is why **cue level 3 can always satisfy the 0.95 target** and why §6.7 is achievable as a guarantee rather than an aspiration.

### 4.3 The Bayesian update (per item, closed form, ~10 lines)

Prior on `x = ln S` is `N(mu, sigma2)`. Observation is a soft label `y* ∈ [0,1]` from §5.1, taken at elapsed time `t` days at presentation cue level `c`.

```
S      = exp(mu)                        // posterior MEAN, not the pessimistic estimate
u      = F·t/S
R      = 1/sqrt(1+u)
p      = R + (1−R)·G[c]
dRdx   = D·u·R/(1+u)                    // = 0.5·u·R/(1+u)
dpdx   = (1−G[c])·dRdx
v      = p·(1−p)
s      = ((y* − p)/v)·dpdx              // score at the prior mean
I      = (dpdx·dpdx)/v                  // expected Fisher information
sigma2' = 1/((1/sigma2) + I)
dmu     = clamp(sigma2'·s, −MU_STEP_MAX, +MU_STEP_MAX)
mu'     = clamp(mu + dmu, MU_MIN, MU_MAX)
sigma2' = clamp(sigma2', SIGMA2_MIN, SIGMA2_MAX)
```

This is a Gaussian assumed-density (Laplace/EKF) update for a Bernoulli likelihood. It is deterministic, allocation-free, and requires no sampling — **no `Rng` is used anywhere in the memory model.**

Two properties worth stating because they are testable and because they are load-bearing:

- **At `c = 3`, `G = 1`, so `dpdx = 0`, so `I = 0` and `s = 0`.** A familiarity exposure carries exactly zero information and cannot move the posterior. This falls out of the mathematics; it is not a special case in the code. (The code additionally skips the update at `c = 3` for clarity and speed; the results are identical.)
- **The update is only ever applied to informative inference trials.** `informative = (attempt_index === 0) && !is_probe && (cue_level < 3) && !interrupted && (app_backgrounded_ms === 0) && (absorbing === 'none' at trial time)`.

### 4.4 Process noise — the non-stationarity term

Immediately before the Bayesian update, for an item last seen `Δ` days ago:

```
Δ       = clamp((session_started_anchored_ms − last_seen_end_ms)/86400000, 0, 3650)
sigma2  = clamp(sigma2 + Q_PER_DAY·Δ, SIGMA2_MIN, SIGMA2_MAX)
```

`mu` is **not** decayed by elapsed time. `S` is a property of the trace, and the trace's decay is already in `R(t,S)`; adding a second decay would double-count. What elapsed time buys is **uncertainty**, and because scheduling uses the pessimistic estimate `exp(mu − κσ)`, more uncertainty is automatically a shorter interval. This is the passive contraction mechanism of §6.9 and it requires no failure to fire.

Applied at the moment of next presentation rather than continuously, so it is exact regardless of how long the gap was and needs no background job.

### 4.5 The encoding term — the design's central empirical bet

At session close, for every item presented:

```
enc_step   = (session inference trial existed AND was a miss) ? ENC_STEP_MISS : ENC_STEP
mu        += enc_step · (attained_index + 1)          // attained_index ∈ [−1, 6]
```

`attained_index` is the highest Camp rung `k` at which the person answered correctly after a dwell of at least `CAMP_SECONDS[k]` seconds, within this session, at a cue level ≤ 2. Range `[−1, 6]`; `−1` means nothing was attained and the gain is zero.

Maximum gain per session: `0.11 × 7 = 0.77` (S × 2.16). Maximum gain after a miss: `0.055 × 7 = 0.385`.

**Why this exists and what it claims.** Camp's clinical protocol assumes the attained within-session delay is meaningful. Stamate 2020 found the AD deficit is in encoding, not decay. This term is the formal statement of that assumption: *the amount of stability laid down today is proportional to the longest delay bridged today.* It is a straight line with an invented slope. It is falsifiable, it is the thing the retrospective fit (M1) estimates, and if the fitted slope is ~0 then the continuous model's advantage over a ladder collapses to the latency channel alone. **That is a publishable result either way, and it is only obtainable if the term is in the model from day one.** §10.4 treats this as a primary weakness.

### 4.6 Interval selection — the clamp stack, in order

```
sigma      = sqrt(sigma2)
S_sched    = exp(mu − KAPPA·sigma)                 // pessimistic point estimate
c          = presentation_cue                       // = max(cue_level, min_support)
raw        = (c === 3) ? +Infinity : S_sched · M[c]
capped     = min(raw,
                 LADDER_DAYS[ladder_index],         // clinical ladder, as a CEILING
                 TIER_CEILING_DAYS[tier],           // 7 for tier 1
                 GLOBAL_CEILING_DAYS)               // 30
drifted    = capped · DRIFT_INTERVAL_MULT[drift_level]
interval_d = max(drifted, MIN_INTERVAL_DAYS)        // 1/6 d = 4 h
```

Every clamp in the stack can only make the interval **shorter** than the model proposed, except the final `MIN_INTERVAL_DAYS` floor — and that floor is guarded by the rule in §4.7 that converts an impossible interval into cue support rather than into a shorter interval.

### 4.7 `RULE CUE-FLOOR` — how ≥95% becomes a guarantee

Evaluated at session close, after §4.6, as a loop:

```
while (c < 3 && P(MIN_INTERVAL_DAYS, S_sched, c) < TARGET) { c += 1 }
if (c > cue_level) { cue_level = c; }                 // support ADDED, interval NOT shortened
```

The loop terminates in at most 3 iterations because `P(·,·,3) = 1`. The exact viability thresholds (computable by a blind test writer from the constants alone) are:

| `c` | viable iff `S_sched ≥` | in hours |
|---|---|---|
| 0 | `MIN_INTERVAL_DAYS / M[0]` = `0.36187612` d | 8.6850 h |
| 1 | `MIN_INTERVAL_DAYS / M[1]` = `0.18616500` d | 4.4680 h |
| 2 | `MIN_INTERVAL_DAYS / M[2]` = `0.06950160` d | 1.6680 h |
| 3 | always | — |

**Invariant `TARGET-HOLDS`:** for every scheduled presentation of every non-probe item, `P(interval_d, S_sched, presentation_cue) ≥ 0.95`. Proof: §4.6's clamp stack only shortens, and shortening raises `R` and therefore raises `P`; §4.7 guarantees the target is met at the shortest permitted interval; the tier-1 frequency floor (§5.6) can only pull a presentation *earlier*, which again raises `P`. ∎

### 4.8 `due_at` is derived, never stored

```ts
function dueAtMs(item: ItemState, p: ParticipantState): number {
  if (item.last_seen_end_ms === null) return item.created_at_ms;
  return item.last_seen_end_ms + Math.round(intervalDays(item, p) * 86400000);
}
```

`due_at` and `scheduled_interval_ms` are queries. They are logged into telemetry (the spec has fields for them) but they are **not** part of the folded state, so the server's canonical recomputation compares only integers and two q6 floats. §9.2 explains why this matters more than it looks.

The scheduler emits `due_at`. It does **not** emit a notification time. P7 (flexible window) and P8 (no prompting after 16:00) are enforced entirely by the session-prompt layer, which reads `due_at` and is free to ignore it.

---

## 5. The rules

### 5.1 Grading — objective, four inputs, exact

```ts
function gradeTrial(
  correct: boolean, cue_level: 0|1|2|3, latency_ms: number,
  attempt_index: number, ctx: { is_probe: boolean; interrupted: boolean; app_backgrounded_ms: number }
): { grade: 0|1|2|3|4; y_star: number | null; informative: boolean; }
```

Exactly these inputs. There is no fifth parameter and there is no self-report anywhere in the call graph. The runtime commits `correct = false, latency_ms = 30000` if no input arrives by `RESPONSE_TIMEOUT_MS`.

```
if (cue_level === 3)  -> { grade: 1, y_star: null, informative: false }   // no question was asked
if (!correct)         -> { grade: 0, y_star: 0.00, informative: gate }
// correct, cue_level in {0,1,2}:
base    = 4 - cue_level                       // c=0 -> 4, c=1 -> 3, c=2 -> 2
grade   = latency_ms > 8000 ? max(1, base - 1) : base
y_star  = latency_ms <=  3000 ? 1.00
        : latency_ms <=  8000 ? 0.85
        : latency_ms <= 15000 ? 0.65
        :                       0.50
informative = gate
where gate = (attempt_index === 0) && !is_probe && !interrupted && (app_backgrounded_ms === 0)
```

`grade` is the ordinal in the telemetry spec and is **logged only**. `y_star` is what the model consumes. Latency bands are inclusive on the upper edge (`<=`), stated so a blind test can pin `latency_ms = 8000` (→ `y* = 0.85`, `grade = base`) against `latency_ms = 8001` (→ `y* = 0.65`, `grade = base − 1`).

**Why a soft label.** This is the latency channel a ladder discards. A correct answer at 14 s is not the same state as a correct answer at 1.4 s, and treating them identically is the specific information loss §0 objects to. The cost is that `p(1−p)` is small when `p` is near 1, so a slow success produces a large score; `MU_STEP_MAX` bounds the damage to a factor of 1.419.

`interrupted` and `app_backgrounded_ms` gate informativeness because latency in this population is contaminated by motor slowing, target acquisition and real-world interruption. A backgrounded trial is discarded rather than believed.

### 5.2 The within-session Camp loop — exact

Per item, per session. All within-session timing uses `t_mono_ms` deltas scoped to a `boot_id` (ADR §4.3); wall clocks are never used inside a session.

**Entry.**
```
camp_cue_level = min(presentation_cue, CAMP_CUE_MAX)      // CAMP_CUE_MAX = 2; Camp always asks
entry_index    = (attained_index_last === -1)
                   ? camp_start_index
                   : clamp(attained_index_last - 1, camp_start_index, 6)
```

**Presentation 1 (the inference trial, `attempt_index = 0`)** is at `presentation_cue` (which may be 3). Then:
```
camp_index      = (inference trial was a miss) ? camp_start_index : entry_index
camp_cue_level  = (inference trial was a miss) ? min(presentation_cue + 1, CAMP_CUE_MAX)
                                               : min(presentation_cue, CAMP_CUE_MAX)
camp_due_mono   = now_mono + CAMP_SECONDS[camp_index] * 1000
```
On a miss the runtime shows and speaks the answer immediately and warmly (P1, §6.4). That reveal is **not** a graded trial.

**Presentations 2..6 (`attempt_index >= 1`), at `camp_cue_level`:**
```
correct -> attained_index = max(attained_index, camp_index)
           camp_index     = min(camp_index + 1, 6)
miss    -> reveal answer warmly (ungraded)
           camp_cue_level = min(camp_cue_level + 1, CAMP_CUE_MAX)   // CUE SUPPORT FIRST
           camp_index     = max(camp_index - 1, camp_start_index)   // Camp reversion
           if (camp_cue_level === 2) camp_misses_at_cue2 += 1
camp_due_mono = now_mono + CAMP_SECONDS[camp_index] * 1000
```

**An item exits the session loop when any of:** it succeeds at rung 6; `presentations === MAX_PRESENTATIONS_PER_ITEM (6)`; `camp_misses_at_cue2 === CAMP_MISS_LIMIT (3)` — in which case the item receives one final ungraded cue-3 exposure and `cue_level` is set to 3 at session close; or the session ends.

**On the within-session interval shortening after a miss, and why it is not a §6.4 violation.** Camp's published rule is *"give the right answer immediately, then re-ask at the last successful interval"* (`spaced-retrieval-and-srs.md` §A1), and §6.1 mandates the Camp loop by name. §6.4 / P2's prohibition — *"do not respond to a lapse by shortening the interval and re-testing at the same difficulty"* — is about the **across-session** lever, and its operative clause is *"at the same difficulty"*. Here the re-presentation is **both** sooner **and** strictly easier, because `camp_cue_level` increments on the same event. The forbidden shape, "same difficulty, sooner", is unreachable: there is no code path that decrements `camp_index` without also incrementing `camp_cue_level`, unless `camp_cue_level` is already at its cap of 2 — in which case a two-alternative recognition is already near-guaranteed and the §5.5 valve is at most one miss away.

### 5.3 Interleaving — the filled interval (§6.8)

```ts
function nextItem(open: OpenSession, now_mono_ms: number): ItemId | null
```
Among items still active in the session:
1. Let `D = { i : camp_due_mono_ms[i] <= now_mono_ms }`.
2. If `D` is non-empty: return the item maximising `now_mono_ms - camp_due_mono_ms[i]`; ties broken by **ascending `item_id` string comparison**, which is total and deterministic.
3. If `D` is empty: return the item minimising `camp_due_mono_ms[i]`; same tie-break. (Never idle. Slight under-spacing beats dead air in front of a person with dementia.)
4. If no active items remain: return `null` → the session moves to the closer.

With 8 personal items and roughly 12 s per trial the natural cycle is about 96 s, so rungs 0–3 (10–80 s) are filled by other items for free and rungs 4–6 (160–640 s) are bridged by several cycles. This is exactly the clinically prescribed filled interval, and it costs nothing.

### 5.4 Cue-level policy across sessions

Evaluated at session close, after the memory update, in this order:

```
if (inference trial existed AND was a miss)       cue_level = min(cue_level + 1, 3); consec = 0
else if (inference trial existed AND correct
         AND latency_ms <= VANISH_LATENCY_MS
         AND informative
         AND cue_level > min_support) {
    consec += 1
    if (consec >= VANISH_THRESHOLD) { cue_level = max(cue_level - 1, min_support); consec = 0 }
}
else if (camp_misses_at_cue2 >= CAMP_MISS_LIMIT)  cue_level = 3; consec = 0
finally                                           cue_level = clamp(cue_level, min_support, 3)
```

**Recovery from the bottom rung is permitted and required.** An item at `cue_level = 3` has its inference trial at cue 3 (an exposure) but its Camp trials at cue 2 (`CAMP_CUE_MAX`), inside the safe window immediately after the answer was given. If it succeeds there, `attained_index` advances, the encoding term raises `mu`, and once `mu` and `sigma2` permit, `RULE CUE-FLOOR` stops forcing cue 3 and the vanishing rule can walk it back down. P3 forbids *removal*; it does not forbid *recovery*, and an item that can only ever move one way is a leech mechanic wearing a different hat.

### 5.5 Within-session safety valve

```
after each graded trial:
  if (graded_trials >= 5 && graded_successes / graded_trials < 0.80)
      session_min_support = max(session_min_support, 2)   // never lowered within the session
```
Logged as `difficulty_floor_triggered = true`. This protects the ≥95% target against a bad day the cross-session model has not yet seen, and it is the within-session counterpart of the drift term.

### 5.6 Session selection — deterministic, no backlog

```ts
function planSession(state, now_ms, session_id, genericPool, probeSchedule): SessionPlan
```

1. **Candidates** = items where `retired_by === null` **and** `absorbing === 'none'` **and** `content_ready === true`. Probe items are not in `state.items` at all, so they cannot appear here.
2. **Urgency** `= (now_ms - dueAtMs(item)) / max(scheduledIntervalMs(item), 3600000)`. Internal only. **The module exports no function returning a count of due or overdue items** (P6, §6.12) — checkable by inspecting the public surface.
3. **Buckets:** `0` = tier-1 item with `now_ms - last_seen_end_ms >= TIER1_FLOOR_DAYS * 86400000` (the frequency floor, §6.6 — *appears regardless of predicted retrievability*); `1` = new items (`session_count === 0`), capped at `MAX_NEW_ITEMS_PER_SESSION`; `2` = `urgency >= 0`; `3` = everything else.
4. **Total order:** ascending bucket → descending urgency → ascending tier → **ascending `item_id` string**. Fully deterministic; no `Rng`.
5. **Quota:** at most `MAX_CUE3_ITEMS_PER_SESSION` items with `cue_level === 3`, **except** bucket 0, which is exempt. The precedence is stated because it is exactly the kind of ambiguity that produces a flaky test: *the tier-1 floor beats the cue-3 quota, always.*
6. Take the first `SESSION_MAX_PERSONAL_ITEMS` (8).
7. **Generic opener and closer (P11).** `opener = genericPool[rng.nextInt(genericPool.length)]`; `closer = genericPool[rng.nextInt(genericPool.length)]`, drawn in that order. These two calls are **the only use of `Rng` in the entire module.** Generic items have no correct answer, are never in `state.items`, and are never graded.
8. **Probe block (synthesis §5.2, requirement 13).** If `participant.probe_enabled && probeSchedule.includes(day_offset)`, `selectProbeBlock(probeSchedule, day_offset)` returns up to 8 probe items, inserted at index `floor(n_personal / 2) + 1`. That function reads **only** the probe schedule and the day offset. It takes no `SchedulerState` parameter — the type system enforces requirement 13.
9. **Guaranteed-success closer (P1).** The generic closer is always last and is exempt from `SESSION_MAX_DURATION_MS`. If the last graded trial before it was a miss, the runtime inserts one additional cue-3 exposure of that same item before the closer.

**Seeding.** `rng = mulberry32(fnv1a32(session_id))`, both given in §9.3. `session_id` is a UUIDv7 present in the event log, so the server replays selection exactly. In practice the server does not need to: the plan is itself an event (`session_planned`).

### 5.7 Distress — the absorbing state (§6.14, P18)

Sources are `patient_control` and `caregiver_report` **only**. On `distress_reported { item_id, severity >= 'mild', source }`:

```
if (item_id !== null) { item.absorbing = 'distress'; item.distress_at_ms = event_ms }
session ends immediately with session_end_reason = 'distress_stop'
the distressed item's inference trial for this session is discarded: informative -> false
all other items in the session are folded normally at session close
```

Recovery is **only** by an `item_reenabled { item_id, actor: 'caregiver' | 'clinician' }` event. There is no timeout and no automatic recovery.

**Invariant `ABSORBING-DOMINATES`:** `absorbing === 'distress'` short-circuits every selection rule including the tier-1 frequency floor, the new-item quota and the cue-3 quota. It is checked first, before buckets are computed.

`abandonment` and `repeated_skip` are logged with `distress_signal_source` for research and **do not** set the absorbing state. Reason: a deterministic behavioural rule that removed an item from rotation would be *the algorithm removing an item*, which §6.5 and §6.15 forbid. The conservative reading and the non-inferential reading (P18) coincide here.

### 5.8 Retirement (§6.5, §6.15)

`item_retired { item_id, actor: 'caregiver' | 'clinician', reason }` sets `retired_by`. `item_unretired` clears it.

**Invariant `NO-AUTO-REMOVAL`:** an item leaves the candidate set only via (a) `retired_by !== null`, set exclusively by a human-actor event, (b) `absorbing === 'distress'`, set exclusively by a human-sourced distress event, (c) `content_ready === false`. There is no threshold, no counter and no accumulator that can remove an item. `miss_count` is written and never read; a blind test asserts this by grepping the module and finding exactly one write site and zero read sites.

### 5.9 Progression drift (§6.10, §6.11) — computed, surfaced to nobody

`support_index(session)` = mean over **non-probe inference trials** in that session of
```
cue_level + ((cue_level < 3 && !correct) ? 1 : 0)        // range [0, 4]
```
A cue-3 exposure contributes `3`; a miss at cue 2 contributes `3`; a free-recall success contributes `0`.

At session close, with `d` = current `day_offset_from_enrollment`:
```
recent   = sessions with day_offset in [d-13, d]         require n >= 6
baseline = sessions with day_offset in [d-41, d-14]      require n >= 6
if either requirement fails                          -> drift_level unchanged
if (drift_last_changed_day !== null && d - drift_last_changed_day < 7) -> unchanged
delta = mean(recent) - mean(baseline)
if (delta >=  0.50) drift_level = min(drift_level + 1, 2)
if (delta <= -0.25) drift_level = max(drift_level - 1, 0)
```
At most one step per evaluation, at most one change per 7 days, minimum 12 sessions of evidence. That is §6.11's "persistence across sessions, never a single bad day", stated as three independent guards.

**Effect:** `min_support = drift_level` (support stepped up) and `DRIFT_INTERVAL_MULT[drift_level] = 1.00 / 0.75 / 0.50` (intervals stepped down). Exactly §6.10.

**Surfaced to:** nobody. It is written to telemetry as `drift_adjustment_applied` and appears in no patient view, no caregiver view and no clinician view (P24, §6.10). It is a separate quantity from §5.10 and the two must never be conflated.

### 5.10 Acute-change detector (P25) — the one exception, framed as physical illness

Different window, different threshold, different consumer.

```
A = mean support_index over sessions with day_offset in [d-2, d]      require n >= 3
B = mean support_index over sessions with day_offset in [d-17, d-4]   require n >= 6
fire iff (A - B >= 1.20)
     AND (at least 2 of the last 3 sessions have support_index - B >= 1.00)
     AND (acute_change_last_fired_day === null || d - acute_change_last_fired_day >= 14)
```
Emits one `acute_change_suspected { day_offset }` event. The recipient is the **caregiver**, never the patient and never a clinician surface in v1. The copy is fixed and is not generated by this module:

> *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."*

No cognitive interpretation, ever (§9 NEVER-DO #36).

| | drift (§5.9) | acute change (§5.10) |
|---|---|---|
| recent window | 14 d, ≥6 sessions | 3 d, ≥3 sessions |
| baseline | 28 d ending 14 d ago | 14 d ending 4 d ago |
| threshold | +0.50 | +1.20, and 2 of 3 individually +1.00 |
| effect | changes the schedule | notifies the caregiver |
| notification | none, ever | one, physical-illness framed |
| cooldown | 7 days | 14 days |

---

## 6. The fold

### 6.1 `reduce` is pure over `(state, event)` and does not read the clock

```ts
function reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState
```

**`reduce` takes no `Clock` and no `Rng`.** Every time it needs comes from the event itself. The `Clock` port is used only by the query functions (`dueAtMs`, `planSession`), and `Rng` only by `planSession`. This is a stronger property than the ADR asks for and it is what makes the server's canonical recomputation trivial: the server replays the log and never consults its own clock, so `foldl(reduce, initial, events)` is a pure function of the event list.

**Event order.** Events are folded in the total order `(server_anchored_at asc, device_id asc, seq asc)`, lexicographic. This is stated because the ADR permits two tablets to run offline sessions for the same patient, and "deterministic over the union of their event streams" requires a *stated* total order, not merely an append-only log. `device_id` is a UUID string; comparison is byte-wise.

**Time.** All across-session elapsed times use `server_anchored_at` (ADR §4.3), never `t_wall_ms`. The device's local projection substitutes `t_wall_ms + last_known_skew`; the server's recomputation uses the anchored value; the two agree once the batch is ingested, and any disagreement before ingestion affects only `due_at`, which is derived and never compared (§4.8). Negative `Δ` (clock went backwards) is clamped to `0` and logged as `clock_anomaly`; `Δ` above 3650 days is clamped to 3650.

### 6.2 Events consumed

| Event `type` | Effect |
|---|---|
| `item_introduced` | creates `ItemState` with `mu = MU_INIT`, `sigma2 = SIGMA2_INIT`, `ladder_index = 0`, `attained_index_last = -1`, `session_count = 0`, `cue_level = 3` if `tier === 1` (P12, answer-first for identity content) else `2` |
| `item_content_ready_changed` | sets `content_ready` |
| `item_retired` / `item_unretired` | sets / clears `retired_by` |
| `distress_reported` | §5.7 |
| `item_reenabled` | clears `absorbing` and `distress_at_ms` |
| `participant_config_changed` | sets `camp_start_index`, `probe_enabled` |
| `session_planned` | opens `OpenSession`; records `started_anchored_ms`, `session_min_support = drift_level` |
| `trial_presented` | increments `presentations`; sets `camp_due_mono_ms` |
| `trial_graded` | §5.1 grading; updates `attained_index`, `camp_index`, `camp_cue_level`, `camp_misses_at_cue2`, `graded_trials`, `graded_successes`, §5.5 valve; records `inference` if `attempt_index === 0` |
| `session_ended` | runs §6.3, then clears `open_session` |

**Requirement 13, enforced at the top of `reduce`:** any event with `item_is_probe === true` returns `state` **unchanged, by reference**. Probe items never enter `state.items`; they never contribute to `support_index`, `drift_level` or the acute-change detector; they never occupy a session slot that competes with personal items. A blind test asserts `reduce(s, probeEvent) === s` (identity, not deep equality).

### 6.3 Session close — the exact order of operations

For each item with an entry in `open_session.items`, in ascending `item_id` order (stated so that any future cross-item rule cannot become order-dependent):

1. **Elapsed time.** If `last_seen_end_ms !== null`:
   `Δ = clamp((open.started_anchored_ms − last_seen_end_ms) / 86400000, 0, 3650)`.
2. **Process noise.** `sigma2 = clamp(sigma2 + Q_PER_DAY·Δ, SIGMA2_MIN, SIGMA2_MAX)`.
   Applied whenever step 1 ran, whether or not the inference trial was informative.
3. **Bayesian update (§4.3)** — only if `inference !== null && inference.informative && last_seen_end_ms !== null`. Uses the **pre-encoding** `mu`.
4. **Encoding gain (§4.5).** `mu += enc_step · (attained_index + 1)`, then clamp to `[MU_MIN, MU_MAX]`.
5. **Ladder index.** `inference` correct → `+1`; incorrect → `−1`; `cue_level === 3` or no inference or non-informative → unchanged. Clamp `[0, 6]`.
6. **Cue level (§5.4).**
7. **`RULE CUE-FLOOR` (§4.7).**
8. **Counters.** `session_count += 1`; `presentation_count += presentations`; `miss_count += (misses this session)`; `attained_index_last = attained_index`; `last_seen_end_ms = session_ended_at_ms`.
9. **Quantise.** `mu = q6(mu)`, `sigma2 = q6(sigma2)`.

Then, once per session: `support_index` is appended to `participant.session_support_history`; §5.9 drift is evaluated; §5.10 acute change is evaluated; `participant.session_count += 1`.

An item **not** presented in the session receives **no state change at all**. Process noise is charged lazily at step 2 against the full elapsed gap, so laziness costs nothing and there is no background job.

### 6.4 Public surface

```ts
// pure fold
export function reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState;
export const INITIAL_STATE: SchedulerState;

// pure queries (Clock-dependent, state-independent of each other)
export function dueAtMs(item: ItemState, p: ParticipantState): number;
export function scheduledIntervalDays(item: ItemState, p: ParticipantState): number;
export function successProbability(item: ItemState, p: ParticipantState, atMs: number): number;
export function planSession(
  state: SchedulerState, nowMs: number, sessionId: string,
  genericPool: readonly string[], probeSchedule: readonly number[]
): SessionPlan;
export function nextItem(open: OpenSession, nowMonoMs: number): string | null;
export function gradeTrial(...): TrialGrade;

// probes — deliberately cannot see state
export function selectProbeBlock(probeSchedule: readonly number[], dayOffset: number): string[];

export const SCHEDULER_PARAMS: Readonly<SchedulerParams>;   // frozen
export const PARAMS_VERSION = 'mm-1.0.0';
```

There is **no** `dueCount()`, no `backlog()`, no `retire()`, no `suspend()`, no `optimiseParameters()` and no `setParams()`. Absence is part of the contract and is testable.

---

## 7. Worked example — one tier-1 item across three sessions, every number

Item `a1b2…`, "Margaret — your daughter", `tier = 1`, `camp_start_index = 0`, `drift_level = 0` throughout, `min_support = 0`.

All floats below are shown to 6 dp, which is exactly the stored precision (`q6`). Intermediate values are shown to 6 dp for readability; the implementation carries full doubles and quantises only at step 9 of §6.3.

### Session 1 — day 0, 09:40 → 09:47. Introduction.

**State on `item_introduced`:** `mu = −0.693147`, `sigma2 = 1.000000`, `cue_level = 3` (tier 1, P12), `ladder_index = 0`, `attained_index_last = −1`, `last_seen_end_ms = null`, `session_count = 0`.

Trials (mono ms from session start):

| # | `attempt_index` | cue | `t_mono` | correct | latency | effect |
|---|---|---|---|---|---|---|
| 1 | 0 | 3 | 0 s | — | — | exposure, answer-first. `informative = false`. `camp_index = entry_index = 0`, `camp_cue_level = min(3,2) = 2`, due at +10 s |
| 2 | 1 | 2 | 14.2 s | yes | 2800 ms | `attained_index = 0`; `camp_index → 1`; due +20 s |
| 3 | 2 | 2 | 38.9 s | yes | 3400 ms | `attained_index = 1`; `camp_index → 2`; due +40 s |
| 4 | 3 | 2 | 84.6 s | yes | 5100 ms | `attained_index = 2`; `camp_index → 3`; due +80 s |
| 5 | 4 | 2 | 171.0 s | yes | 4200 ms | `attained_index = 3`; `camp_index → 4`; due +160 s |
| 6 | 5 | 2 | 338.0 s | yes | 3900 ms | `attained_index = 4`; `MAX_PRESENTATIONS_PER_ITEM` reached, item exits |

**Session close (§6.3):**
1. `last_seen_end_ms === null` → no `Δ`, steps 1–3 skipped entirely.
4. Encoding: no inference miss → `enc_step = 0.11`. `mu = −0.693147 + 0.11 × (4 + 1) = −0.693147 + 0.550000 = −0.143147`. → `S = e^−0.143147 = 0.866627 d`.
5. Ladder: inference was at cue 3 → unchanged, `ladder_index = 0`.
6. Cue: no inference miss, no informative success (cue 3 is never informative), `camp_misses_at_cue2 = 0` → falls through. But **`camp_misses_at_cue2 < 3`** and the item succeeded at cue 2 twice in the Camp loop, so §5.4's recovery path applies via §4.7 below.
7. `RULE CUE-FLOOR`: `S_sched = e^(−0.143147 − 0.5 × 1.000000) = e^−0.643147 = 0.525636`. Viability: `0.525636 ≥ 0.36187612` → **cue 0 is viable**, so CUE-FLOOR forces nothing. The item's `cue_level` drops from 3 to 2 because the Camp loop demonstrated success at cue 2 (`camp_misses_at_cue2 = 0`, ≥2 successes at cue 2). **`cue_level = 2`.**
8. `session_count = 1`, `attained_index_last = 4`, `last_seen_end_ms = day0 09:47`, `miss_count = 0`.
9. `mu = −0.143147`, `sigma2 = 1.000000`.

**Derived schedule (§4.6):** `S_sched = 0.525636`; `raw = 0.525636 × M[2] = 0.525636 × 2.398026 = 1.260488 d`;
`capped = min(1.260489, LADDER_DAYS[0] = 0.166667, 7, 30) = 0.166667 d`; drift ×1.00; floor 0.166667 → **`interval = 0.166667 d = 4 h 00 m`**.
`due_at = day0 13:47`. Check `TARGET-HOLDS`: `u = 0.234568 × 0.166667 / 0.525636 = 0.074376`, `R = 1/sqrt(1.074376) = 0.964766`, `P = 0.964766 + 0.035234 × 0.75 = 0.991191 ≥ 0.95` ✓.

The **ladder ceiling binds on day 0** — a brand-new item comes back the same day, exactly as §6.1's "same day" rung requires. The model wanted 1.26 d; it was overruled downward.

### Session 2 — day 0, 14:05 → 14:14.

`Δ = (14:05 − 09:47) = 4 h 18 m = 0.179167 d`.

2. Process noise: `sigma2 = 1.000000 + 0.004 × 0.179167 = 1.000717`.
   Inference trial at `presentation_cue = max(2, 0) = 2`: **correct**, latency **5200 ms** → `grade = 2`, `y* = 0.85`, `informative = true`.
3. Bayes, with `S = e^−0.143147 = 0.866629`, `t = 0.179167`:

| quantity | value |
|---|---|
| `u = F·t/S` | `0.234568 × 0.179167 / 0.866627 = 0.048495` |
| `R = 1/sqrt(1+u)` | `1 / 1.023960 = 0.976600` |
| `p = R + (1−R)·0.75` | `0.976600 + 0.017550 = 0.994150` |
| `dRdx = 0.5·u·R/(1+u)` | `0.5 × 0.048495 × 0.931434 = 0.022585` |
| `dpdx = 0.25·dRdx` | `0.005646` |
| `v = p(1−p)` | `0.994150 × 0.005850 = 0.005816` |
| `s = ((y*−p)/v)·dpdx` | `((0.85 − 0.994150)/0.005816) × 0.005646 = −0.139949` |
| `I = dpdx²/v` | `0.00003188 / 0.005816 = 0.005482` |
| `sigma2' = 1/(1/1.000717 + I)` | `1/1.004765 = 0.995257` |
| `dmu = sigma2'·s` | `−0.139285` (\|dmu\| ≤ 0.35, damper does not bind) |
| `mu` | `−0.143147 − 0.139285 = −0.282432` |

A correct answer that took 5.2 s **lowered** `S` by a factor of `e^−0.139285 = 0.869986`. The model had predicted 99.4 % and received a 0.85 soft label. **This is the channel a fixed ladder cannot see.**

4. Encoding: say the Camp loop attained rung 3 → `mu = −0.282432 + 0.11 × 4 = +0.157568` → `S = 1.170660 d`.
5. Ladder: inference correct → `ladder_index = 1`.
6. Cue: correct, latency 5200 ≤ 6000, informative, `cue_level (2) > min_support (0)` → `consec = 1`. `VANISH_THRESHOLD = 2` not met; `cue_level` stays 2.
7. CUE-FLOOR: `S_sched = e^(0.157568 − 0.5 × sqrt(0.995257)) = e^(0.157568 − 0.498813) = e^−0.341245 = 0.710885`. `0.710885 ≥ 0.36187612` → cue 0 viable, nothing forced.
8. `session_count = 2`, `attained_index_last = 3`, `last_seen_end_ms = day0 14:14`.
9. `mu = 0.157568`, `sigma2 = 0.995257`.

**Derived schedule:** `raw = 0.710885 × 2.398026 = 1.704721 d`; `capped = min(1.704721, LADDER_DAYS[1] = 1, 7, 30) = 1.000000 d`; **`interval = 1 d`**, `due_at = day1 14:14`.
`TARGET-HOLDS`: `u = 0.234568/0.710885 = 0.329966`, `R = 1/sqrt(1.329966) = 0.867121`, `P = 0.867121 + 0.132879 × 0.75 = 0.966780 ≥ 0.95` ✓.

### Session 3 — day 1, 10:20 → 10:31. A miss.

The item is **not yet due** (`due_at = day1 14:14`, urgency `= −3 h 54 m / 1 d = −0.1625`). It is selected anyway, in bucket 3, because the session has room. *Selection is not queue-draining;* there is no backlog to clear (P6, §6.12).

`Δ = day0 14:14 → day1 10:20 = 20 h 06 m = 0.837500 d`.

2. `sigma2 = 0.995257 + 0.004 × 0.837500 = 0.998607`.
   Inference at cue 2: **incorrect**, latency 9800 ms → `grade = 0`, `y* = 0.00`, `informative = true`. Runtime reveals the answer immediately and warmly.
3. Bayes, `S = e^0.157568 = 1.170660`, `t = 0.837500`:

| quantity | value |
|---|---|
| `u` | `0.234568 × 0.837500 / 1.170660 = 0.167812` |
| `R` | `1 / 1.080653 = 0.925366` |
| `p` | `0.925366 + 0.074634 × 0.75 = 0.981342` |
| `dRdx` | `0.5 × 0.167812 × 0.792396 = 0.066486` |
| `dpdx` | `0.016622` |
| `v` | `0.981342 × 0.018658 = 0.018310` |
| `s` | `((0 − 0.981342)/0.018310) × 0.016622 = −0.890834` |
| `I` | `0.00027629 / 0.018310 = 0.015089` |
| `sigma2'` | `1/(1.001395 + 0.015089) = 0.983784` |
| `dmu` raw | `0.983784 × (−0.890834) = −0.876388` |
| `dmu` **damped** | **`−0.350000`** ← `MU_STEP_MAX` binds |
| `mu` | `0.157568 − 0.350000 = −0.192432` → `S = 0.824951 d` |

Camp loop after the miss: `camp_cue_level = min(2+1, 2) = 2`, `camp_index = 0`. Presentations 2–6 at cue 2 all correct → `attained_index = 4`.

4. Encoding, **halved because the inference trial was a miss**: `enc_step = 0.055`. `mu = −0.192432 + 0.055 × 5 = −0.192432 + 0.275000 = +0.082568` → `S = 1.086073 d`.
   Net across the session: `0.157568 → 0.082568`, i.e. **exactly −0.075000**. Down, as it must be. See §10.5 for the exact condition under which a miss session could net upward and why it is bounded and rare.
5. Ladder: inference incorrect → `ladder_index = 0`.
6. Cue: miss → `cue_level = min(2+1, 3) = 3`; `consec = 0`.
7. CUE-FLOOR: `c` is already 3; loop does not run.
8. `session_count = 3`, `attained_index_last = 4`, `miss_count = 1`, `last_seen_end_ms = day1 10:31`.
9. `mu = 0.082568`, `sigma2 = 0.983784`.

**Derived schedule:** `S_sched = e^(0.082568 − 0.5 × sqrt(0.983784)) = e^(0.082568 − 0.495930) = e^−0.413362 = 0.661423`.
`cue_level = 3` → `raw = +Infinity`; `capped = min(∞, LADDER_DAYS[0] = 0.166667, 7, 30) = 0.166667 d`; **`interval = 4 h`**, `due_at = day1 14:31`. `P = 1.0` (no question asked) ≥ 0.95 ✓.

### What the three sessions demonstrate

- The **interval never lengthened on the miss** — the ladder ceiling fell from index 1 to index 0 and took the interval from 1 d to 4 h. That contraction came from the clinical ladder, not from the model.
- The **model's own contribution to the miss** was a bounded `−0.35` in log-S, i.e. the slow lever.
- The **cue level moved immediately**, 2 → 3, i.e. the fast lever. The next presentation is an exposure with no question: a guaranteed success (P1) and a moment of connection (P3).
- The **latency channel fired in session 2** and moved the schedule with no failure involved at all. That is the information a ladder discards.

---

## 8. Proof that no forbidden FSRS behaviour is smuggled back

§5.1 of the synthesis says: *"Every FSRS behaviour we would have to disable is a load-bearing FSRS behaviour, and what remains after disabling them is not FSRS."* This design agrees with that sentence and takes it literally: it keeps **one** thing from FSRS — the power-law functional form, which §6.16 explicitly instructs us to keep — and reconstructs everything around it from the clinical literature. Below, each load-bearing FSRS behaviour, and the mechanism that makes it unreachable.

### 8.1 The behaviour-by-behaviour table

| FSRS / SM-2 behaviour | Status here | Mechanism that makes it unreachable |
|---|---|---|
| **Learner self-grades** (`q0–5`, Again/Hard/Good/Easy) | Absent | `gradeTrial` has exactly five parameters and none is a self-report. There is no other entry point to the model. A blind test asserts the arity and the parameter names. (§6.2, P4) |
| **≥1-day minimum interval** | Absent | Two sub-day regimes: the Camp loop at 10–640 s and `MIN_INTERVAL_DAYS = 1/6 d = 4 h`. (§6.1) |
| **90 % retention target** | Absent | `TARGET = 0.95`, and it is a **floor** enforced by `RULE CUE-FLOOR`, not a set-point. The `0.9` that appears in `F = 0.9^(−2) − 1` is the *definition of the unit of S*, kept for comparability with the published literature. It is not a target and it never appears in a scheduling decision. This is the design's most dangerous ambiguity and it is called out twice. (§6.7, NEVER-DO #10) |
| **Per-user parameter optimisation** | Absent | `SCHEDULER_PARAMS` is `Object.freeze`d, is identical for every participant, and is never written by any code path. `mu` and `sigma2` are *state* (inference about one item), not *parameters* (fitted coefficients of the model). The distinction is the whole content of §6.16's "per-item Bayesian updating rather than per-user optimisation". Test: fold two participants' logs, assert `SCHEDULER_PARAMS` is deep-equal and `Object.isFrozen`. |
| **Leeches / auto-suspend after N lapses** | Absent | Invariant `NO-AUTO-REMOVAL` (§5.8). `miss_count` has one write site and zero read sites. (§6.5, §6.15, P3) |
| **FSRS `Difficulty` ∈ [1,10]** | **Deliberately omitted** | Difficulty exists in FSRS to ration scarce review time across thousands of items. We have 6–10 items and no scarcity. Difficulty is also the term through which "this card is bad, deprioritise it" enters — the leech gradient in continuous form. Omitting it is a positive decision, not an oversight, and it is what §6.6's inverted economics require. |
| **The stabilisation law "lower retrievability → larger stability increase"** | **Deliberately omitted and replaced** | This is FSRS's mathematical statement of desirable difficulty, i.e. of building in a failure rate. It is the formal version of the thing NEVER-DO #10 forbids. Our stability increase comes from `ENC_STEP · (attained_index + 1)` — the **encoding** term — not from a retrieval-difficulty term. This is the single largest structural difference between this design and FSRS, and it is the one with direct evidential support (Stamate 2020: the AD deficit is in encoding, not decay). |
| **Interval fuzz** (Anki randomises intervals ±) | Absent | `Rng` is called exactly twice per session, both times to pick a generic opener/closer. No interval, cue level or ordering decision consults `Rng`. |
| **Monotonic-improvement assumption** | Broken four ways | (i) `Q_PER_DAY` process noise widens `sigma2`, and the pessimistic estimator `exp(mu − κσ)` turns width into shorter intervals with no failure required; (ii) the Bayesian update lowers `mu` on misses *and on slow successes*; (iii) `DRIFT_INTERVAL_MULT` multiplies every interval by 0.75 / 0.50; (iv) `ladder_index` decrements. (§6.9) |
| **100-year style interval ceiling** | Absent | `min(LADDER_DAYS[L], TIER_CEILING_DAYS[tier], 30)`, three independent caps. (§6.3) |
| **Backlog / due count / "cards due today"** | Absent | No exported function returns a count of due items; `planSession` returns a fixed-size plan, not a drained queue; skipping produces no state change of any kind. (§6.12, P6) |
| **AGPL Anki code** | None vendored | Zero dependencies. `R(t,S)` is implemented from the published functional form (Ye 2022 KDD; Su 2023 TKDE; the FSRS wiki), which is ~4 lines of arithmetic. `fsrs-rs` (BSD-3) and the MIT reference are not used, so there is nothing to attribute; if either is ever consulted for cross-checking, attribution is added at that point. (§6.17) |

### 8.2 The three FSRS ideas that are kept, and why each is licensed by §6.16

1. **Power-law forgetting `R(t,S) = (1 + F·t/S)^(−D)`.** §6.16 instructs: *"keep the power-law functional form"*. Kept verbatim.
2. **Stability as a per-item latent in days.** Required for §6.16's *"per-item Bayesian updating"* to mean anything.
3. **Solving `R = target` for `t` to get the interval.** This is how any retention-targeting scheduler works; §6.16 instructs *"target retention ≥ 0.95"*, which presupposes it.

Everything else in FSRS is either absent or replaced.

### 8.3 What §6.4 actually forbids, and the theorem that we obey it

§6.4 / P2: *"Failure adds cue support, not interval change. On a miss: supply the answer immediately and warmly, then re-present one cue rung easier."* P2's operative clause is *"Kills any scheduler that responds to a lapse by shortening the interval and re-testing **at the same difficulty**."*

**Theorem (MISS-DOES-NOT-SHORTEN).** Let an item be at `cue_level = c ∈ {0,1,2}` with pessimistic stability `S`, and let its inference trial in the next session be a miss. Then, **absent the ladder and tier ceilings**, the newly scheduled interval is strictly longer than the interval that produced the miss.

*Proof.* On a miss, §5.4 sets `cue_level = c + 1`, so the new interval is `S' · M[c+1]` against the old `S · M[c]`. The encoding term is non-negative, so `mu' ≥ mu + dmu` where `dmu ≥ −MU_STEP_MAX = −0.35` (§4.3 damper). Hence `S'/S ≥ e^(−0.35) = 0.704688`. The ratio of multipliers is
`M[1]/M[0] = 0.21 / 0.1080332409972299 = 1.943846154…` and `M[2]/M[1] = 0.5625 / 0.21 = 2.6785714…` (the common factor `81/19` cancels), and `M[3]/M[2] = +∞`.
Therefore the interval ratio is at least `0.704688 × 1.943846154 = 1.3698052 > 1` for every reachable transition. ∎

Two corollaries worth stating because a blind test can check them:

- **The forbidden shape is unreachable.** "Sooner, at the same difficulty" cannot occur, because there is no code path that changes the interval on a miss without also incrementing `cue_level` (and `cue_level = 3` has no miss, because no question is asked).
- **All across-session shortening after a miss comes from the ladder ceiling**, i.e. from `ladder_index − 1`. That is Camp's own published rule, mandated by name in §6.1, and it is bounded by construction: the ladder is `[4 h, 1, 2, 4, 7, 14, 30]` days and can fall at most one rung per session.

### 8.4 The two levers do not collide

The concern: the fast lever (cue support) and the slow lever (stability) both feed the same interval formula, so they might fight. They do not, because their gains differ by an order of magnitude and their signs are aligned.

| | maximum single-session effect on the interval | direction on failure |
|---|---|---|
| cue lever | `×1.943846` (c 0→1), `×2.678571` (c 1→2), `×∞` (c 2→3) | **lengthens**, because the exercise became easier |
| stability lever | `×0.705` (damper-bounded) | shortens |
| ladder ceiling | one rung, e.g. `1 d → 4 h` = `×0.167` | shortens |
| drift multiplier | `×0.75` or `×0.50`, at most once per 7 days | shortens |

The cue lever dominates on any single failure (Theorem 8.3). The stability lever dominates over many sessions, because it accumulates while the cue lever saturates at 3. The ladder ceiling dominates in the acute case. That ordering — *immediate relief, medium-term ceiling, long-term belief* — is the intended clinical behaviour and is exactly the ordering §6.4, §6.1 and §6.9 respectively call for.

### 8.5 Where a slow success shortens the interval, and why that is not a §6.4 violation

In §7 session 2, a **correct** answer at 5.2 s shortened the schedule. §6.4 governs *failure*. A slow success is not a failure: nothing was revealed, nothing was rescued, the person succeeded, the session continued. What changed was the model's *belief*, and the belief changed because the evidence changed. This is the one place where the continuous design does something a ladder cannot do at all, and it is the concrete answer to "fixed ladders throw away the information".

---

## 9. Determinism and blind-testability

### 9.1 The three hard constraints, discharged

| ADR constraint | How |
|---|---|
| Pure TypeScript in `src/domain/`, no `react` / `react-native` / `expo-*` / `@supabase/*` | Zero imports. The module imports only types from `src/contract/schema.ts` and `src/contract/ports.ts`. |
| No `Date`, `Math.random`, `crypto`, `fetch`, `window`, `document` | `reduce` reads time only from event fields. Queries take `nowMs: number` as an explicit parameter, supplied by the injected `Clock`. `Rng` is injected and used twice per session (§5.6). `crypto` is not needed: the RNG seed is derived from `session_id` by pure string arithmetic (§9.3). |
| Deterministic fold; server recomputes canonically by importing the same module | `foldl(reduce, INITIAL_STATE, events)` is a pure function of the ordered event list (§6.1). The total order is stated: `(server_anchored_at, device_id, seq)`. |
| Runs offline for days on a tablet | No network, no background job, no timer. Process noise is charged lazily against elapsed time at next presentation (§6.3 step 2). Per-item cost per session is ~30 floating-point operations. |

### 9.2 Floating-point determinism — the real attack on a continuous design, answered

A fixed ladder is integer arithmetic and is trivially bit-identical everywhere. A continuous model is not, and "byte-identical output" is an ADR requirement, so this must be answered rather than waved at.

`Math.sqrt`, `+`, `−`, `×`, `÷` are **required by IEEE-754 to be correctly rounded**, so they are bit-identical on V8, Hermes and Deno. `Math.pow`, `Math.exp` and `Math.log` are **not** — the spec permits implementation-defined approximations, and V8's fdlibm-derived routines are not guaranteed to match Hermes'.

Three moves remove the exposure:

1. **`DECAY = 0.5` exactly.** This turns `(1 + F·t/S)^(−D)` into `1 / Math.sqrt(1 + F·t·/S)` and turns the interval inverse `t = (S/F)(r^(−1/D) − 1)` into `t = (S/F)(1/(r·r) − 1)`. **The entire retrievability and interval computation therefore uses only correctly-rounded operations.** This is the primary reason `D` is pinned at 0.5 rather than left free, and it is a genuine cost: the population decay parameter is exactly the thing the retrospective fit would like to estimate. §10.2 records that cost.
2. **`due_at` is derived, never folded (§4.8).** The only transcendental in the whole module is `Math.exp`, used twice per item per session (`e^mu` for the update, `e^(mu − κσ)` for scheduling). The first feeds `mu'`, which is quantised to 1e-6 before storage; a 1-ulp difference (relative ~2.2e-16) is ~10 orders of magnitude below that quantum, so it cannot propagate into folded state. The second feeds only `due_at`, which is **not folded state and is never compared** between device and server. **The fold's output therefore consists of integers, booleans, strings and two 1e-6-quantised floats, and is bit-identical by construction.**
3. **A cross-engine differential test in CI.** `tests/unit/scheduler.determinism.spec.ts` folds the canonical 2,000-event fixture under Node and under Deno (the Edge Function runtime) and asserts `JSON.stringify` equality of the resulting state. This is the test that would catch a regression if either of the first two moves were ever weakened.

**Residual risk, stated:** a `Math.exp` discrepancy could in principle flip the 1e-6 rounding of `mu`. The probability per write is on the order of `ulp(0.35)/1e-6 ≈ 5.6e-11`. If the differential test ever fails, the named contingency is to inject a `MathOps` port supplying a shared polynomial `exp` — about 20 lines, and the algorithm does not change. This is recorded as a contingency, not built.

### 9.3 Seeded RNG (given in full, so a blind test can reproduce it)

```ts
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// nextInt(n) = Math.floor(next() * n)
```

Integer-only, correctly rounded, engine-independent. `fnv1a32('…session-uuid…')` is fully determined by the event log.

### 9.4 What a blind test-writer can write from this document alone

A non-exhaustive list of assertions derivable from this file with no sight of the implementation:

**Constants and pure math** — `M[0..2]` to 12 significant figures; `F === 19/81`; `R(S, S) === 0.9` to 1e-12; `R` monotonically decreasing in `t`; `P(t,S,3) === 1` for all `t, S`; the four CUE-FLOOR viability thresholds in §4.7.

**Grading** — the full 4×4 truth table of `(correct, cue_level, latency band)` → `(grade, y_star, informative)`; the `8000` / `8001` boundary; `informative === false` for `attempt_index > 0`, for `is_probe`, for `interrupted`, and for `app_backgrounded_ms > 0`.

**The update** — the exact `mu` and `sigma2` after the §7 session-2 observation, to 6 dp; that `y* = 1.0` with `p < 1` raises `mu`; that the damper binds at exactly `±0.35`; that a cue-3 inference trial leaves `mu` and `sigma2` bit-identical.

**Invariants, as property tests over random event logs** — `TARGET-HOLDS` (§4.7); `NO-AUTO-REMOVAL` (§5.8); `ABSORBING-DOMINATES` (§5.7); `MISS-DOES-NOT-SHORTEN` with ceilings disabled (§8.3); `interval ≤ LADDER_DAYS[ladder_index]` always; `interval ≤ 7 d` for every tier-1 item; `interval ≤ 30 d` for every item; `cue_level ≥ drift_level` always.

**Requirement 13 (probes)** — `reduce(s, anyProbeEvent) === s` by reference identity; `selectProbeBlock`'s signature contains no `SchedulerState`.

**Determinism** — fold the fixture, shuffle events within equal `(server_anchored_at, device_id, seq)` keys, assert identical output; fold twice, assert `JSON.stringify` equality; fold under Node and Deno, assert equality.

**Absence** — the exported surface contains no identifier matching `/due?count|backlog|leech|suspend|optimi[sz]e|setParams/i`; `SCHEDULER_PARAMS` is frozen.

**Golden fixture.** `src/contract/fixtures/scheduler-mm.json` contains the §7 worked example as `{ events: [...], expected_state_after_each_session: [...] }`, with `mu` and `sigma2` at 6 dp and `due_at_ms` given with a ±1000 ms tolerance (because it is derived, not folded). The three sessions in §7 are that fixture, written out longhand, so the test-writer and the implementer are working from the same numbers without either having seen the other's code.

---

## 10. Weaknesses

Stated as strongly as an opponent would state them.

### 10.1 The constants are not identifiable from the data we will collect
Twelve free constants (`G[1]`, `G[2]`, `KAPPA`, `MU_INIT`, `SIGMA2_INIT`, `Q_PER_DAY`, `MU_STEP_MAX`, `ENC_STEP`, `ENC_STEP_MISS`, the four latency bands, the drift thresholds). With 6–10 items per participant and perhaps 90 sessions, per-item posteriors are thin and the population priors are guesses. **The model will look precise and be uncalibrated**, which is worse than a ladder that is obviously approximate. The mitigation is that every constant is versioned and logged, so a refit is possible; the mitigation does not make the v1 numbers right.

### 10.2 Pinning `DECAY = 0.5` buys determinism and costs the most interesting parameter
The decay exponent is precisely what a retrospective fit to this population would most want to estimate, and §9.2 pins it. The honest position: v1 pins it to get bit-identical arithmetic; the retrospective fit estimates it offline, out of band, from the logged telemetry, where determinism does not matter; v2 may adopt a fitted value and pay for it with a `MathOps` port. This is a real cost and it is the price of the ADR's byte-identical requirement.

### 10.3 `G[2] = 0.75` conflates guessing with cueing, and 2AFC is a weak instrument
The decomposition in §2.1 (`guess[2] = 0.5`, `cue[2] = 0.5`) is honest about the arithmetic but does not fix the underlying problem: **half of all successes at cue level 2 are coin flips, and the likelihood cannot tell them apart from real retrieval.** The model will over-credit 2AFC successes. A three- or four-alternative recognition rung would push the chance floor to 0.33 or 0.25 and roughly double the information per trial. It was not chosen because P9 constrains the patient surface to very large single-tap targets in the central 50 % of the screen, and three or four of them is a layout problem. This should be revisited with the UI board; it is the cheapest available improvement to the model's statistical power.

### 10.4 The encoding term is an invented straight line and it is the design's load-bearing bet
`ENC_STEP = 0.11` per attained Camp rung has no source. If the true relationship between within-session attainment and across-session retention is flat, the encoding term is noise and this design's advantage over a fixed ladder collapses to the latency channel alone. That is still an advantage, but a much smaller one. **The pilot answers this directly** — M1 fits `forgetting_rate_lambda` per item per participant and the encoding slope falls straight out — and a null result is publishable. But the design should be described internally as *"a ladder plus two testable hypotheses"*, not as *"a memory model"*, until the fit exists.

### 10.5 A miss session can, in a narrow case, net upward in stability
Net change over a miss session is `−|dmu| + 0.055·(attained_index + 1)`. With the damper binding at `0.35`, the net is positive only when `attained_index + 1 > 6.36`, i.e. `attained_index = 6` — a perfect six-rung Camp run after a failed inference trial — and then only by `+0.035` in log-S (a 3.6 % lengthening of `S`, invisible against the ladder ceiling which will have dropped a rung on the same event). Exact, bounded, and rare, but it is a sign inversion and a reviewer will find it. It is retained because removing it would mean discarding genuine within-session evidence, which is the thing this design exists to keep.

### 10.6 The drift term is a de facto ratchet
`min_support = drift_level`, and `drift_level` falls only if the participant improves by 0.25 on the support index. In a progressive disease that will not happen. So drift is effectively one-way, and a participant who reaches `drift_level = 2` can never again be presented at cue 0 or 1. This is defensible — it is the conservative direction — but it should be called what it is, and the only exit is a human changing the item's tier or content.

### 10.7 The model has no external validation, by design
§5.2 of the synthesis puts the only clean psychometrics on generic probe stimuli, and requirement 13 makes those invisible to the scheduler. So the fitted per-item model is validated against **its own** scheduling decisions and nothing else. M1's claim is therefore about model *fit*, not model *validity*. That is a real limit on the research contribution this design is arguing for, and it follows from a decision (§5.2) that is correct on safety grounds and that this design does not propose to reopen.

### 10.8 Within-session fluctuation is still unguarded
§5.9's three guards protect the *drift* term against Lewy-body fluctuation across sessions. Nothing protects the Camp loop against fluctuation *within* a session — DLB confusion varies "over the course of a few minutes" — and `attained_index`, which feeds the encoding term, is computed from exactly that window. The §5.5 valve limits the distress consequence but not the measurement consequence.

### 10.9 It is bigger than the ladder and a blind test-writer can misread it
Estimate ~280 lines against ~110 for a pure ladder, and considerably more specification surface. Every ambiguity in this document is a flaky test later. Sections §4.7, §5.2, §5.4 and §6.3 are the four places where an implementer and a test-writer could diverge, and they are the four places where the ordering of operations is stated explicitly rather than left to the reader.

### 10.10 Cross-device merge is stated but untested
§6.1 declares a total order over `(server_anchored_at, device_id, seq)`. Two tablets running offline sessions for the same patient on the same day will produce interleaved sessions whose `Δ` computations depend on that order. It is deterministic, but whether it is *clinically sensible* — two sessions of the same item four minutes apart on two devices — has not been thought through, and the ADR's shared-tablet mode makes it reachable.

---

## 11. Compliance with all 17 binding scheduler requirements (synthesis §6)

| # | Requirement | Status | Where, exactly |
|---|---|---|---|
| 1 | Two timescales, one item. Within-session `10,20,40,80,160,320,640 s`, personalisable start; across-session `same day, 1d, 2d, 4d, 7d, 14d` | **Met, with one deliberate reinterpretation** | `CAMP_SECONDS = [10,20,40,80,160,320,640]` and `camp_start_index ∈ 0..6` (§2.3, §5.2). `LADDER_DAYS = [1/6, 1, 2, 4, 7, 14, 30]` is retained **in full but as a monotone ceiling** rather than as the scheduler (§4.6). Every interval this design produces is ≤ the interval the ladder design would have produced, for every item at every point. The reinterpretation is stated here rather than hidden, and it is the design's central safety argument (§0). |
| 2 | Objective grading only, from `correct × cue_level × latency_ms × attempt_index`; no self-report | **Met** | `gradeTrial` (§5.1) takes exactly those four inputs plus a contamination context. All four are used: `correct` and `cue_level` set `grade` and `y*`; `latency_ms` sets the `y*` band and gates vanishing; `attempt_index` gates informativeness. No self-report parameter exists anywhere in the call graph (§8.1). |
| 3 | Hard ceilings: 30 d global, 7 d tier-1 | **Met** | `GLOBAL_CEILING_DAYS = 30`, `TIER_CEILING_DAYS = {1:7, 2:30, 3:30}`, applied in the §4.6 clamp stack. Property-testable: `interval ≤ 7` for every tier-1 item over any event log. |
| 4 | Failure adds cue support, not interval change | **Met, and proved** | §5.4 increments `cue_level` on every miss. Theorem `MISS-DOES-NOT-SHORTEN` (§8.3): absent ceilings, a miss lengthens the interval by at least ×1.3697. The forbidden shape "sooner at the same difficulty" is unreachable. The within-session Camp reversion is separately defended in §5.2 — it is Camp's own published rule, mandated by requirement 1, and it always co-occurs with a cue-support increment. |
| 5 | No automatic removal — no leech threshold, no suspend, no auto-delete | **Met** | Invariant `NO-AUTO-REMOVAL` (§5.8). `miss_count` has one write site and zero read sites. Items degrade to `cue_level = 3` and stay in rotation; §5.4 additionally permits recovery upward, which P3 allows and which prevents cue 3 from becoming a hidden retirement. |
| 6 | Tiering with inverted economics: tier-1 frequency floor and interval ceiling, appears regardless of predicted retrievability | **Met** | Interval ceiling 7 d (§2.3). Frequency floor `TIER1_FLOOR_DAYS = 3` implemented as selection bucket 0 (§5.6), which is **exempt from the cue-3 quota** and is evaluated before urgency, i.e. literally "regardless of predicted retrievability". Flagged: the value 3 is a judgement call. |
| 7 | Target ≥95 % success on the exercise as presented, achieved by cue support not interval manipulation | **Met, as a hard guarantee** | Invariant `TARGET-HOLDS` (§4.7), proved in §4.7. `RULE CUE-FLOOR` converts an infeasible interval into cue support, never into a shorter interval; it terminates in ≤3 iterations because `P(·,·,3) = 1`. §5.5 adds a within-session valve. The synthesis's own flag is repeated: 0.95 is a judgement call, not a derivation. |
| 8 | Interleaving fills the gap | **Met** | `nextItem` (§5.3). With 8 personal items and ~12 s per trial the natural cycle is ~96 s, so rungs 0–3 fill for free. No idling: if nothing is due, the soonest-due item is presented early. |
| 9 | Intervals must be able to contract, not only expand | **Met, four independent mechanisms** | (i) `Q_PER_DAY` process noise → wider `sigma2` → smaller `exp(mu − κσ)` → shorter interval, **with no failure required**; (ii) Bayesian `mu` decrease on misses and on slow successes; (iii) `DRIFT_INTERVAL_MULT` = 0.75 / 0.50; (iv) `ladder_index − 1`. Because `due_at` is derived and not stored (§4.8), a contraction takes effect across the entire deck at the next query rather than one item at a time. |
| 10 | A progression-drift term exists but surfaces to nobody in v1 | **Met** | §5.9. Falling trailing-14-day performance at fixed support steps `min_support` up and multiplies intervals down. Surfaced to no patient view, no caregiver view, no clinician view (P24). The caregiver may learn of an acute change only through §5.10, in physical-illness framing (P25). |
| 11 | Fluctuation-aware, not fluctuation-blind | **Met at the across-session level; partial within-session** | Three guards on drift: ≥6 recent sessions, ≥6 baseline sessions, ≥7 days between changes, and at most one step per evaluation (§5.9). Plus `MU_STEP_MAX = 0.35` caps what any single session can do to any single item. **Partial:** within-session fluctuation still contaminates `attained_index` — declared in §10.8. |
| 12 | Session capped by time and item count, ends on a success, no due-count, no backlog, no consequence for skipping | **Met** | `SESSION_MAX_DURATION_MS = 600000`, `SESSION_MAX_PERSONAL_ITEMS = 8` (§2.3). Guaranteed generic closer, exempt from the time cap, plus a cue-3 rescue if the last graded trial was a miss (§5.6 step 9). No exported due-count function (§6.4). Skipping produces no event, therefore no state change, therefore nothing to see. |
| 13 | The probe set is invisible to the scheduler | **Met, structurally** | `reduce` returns `state` **by reference** for any `item_is_probe` event (§6.2). Probe items never enter `state.items`. `selectProbeBlock`'s signature contains no `SchedulerState`, so the type system forbids the violation rather than a convention discouraging it. Probes contribute to no `support_index`, no drift, no acute-change detection. |
| 14 | Distress is an absorbing state stronger than any interval logic | **Met** | Invariant `ABSORBING-DOMINATES` (§5.7), checked before buckets, before the tier-1 floor, before everything. No timeout, no automatic recovery; only a human `item_reenabled` event clears it. Sources restricted to `patient_control` and `caregiver_report` — no inferred classifier (P18, EU AI Act Art. 5(1)(f)). |
| 15 | Nothing is dropped on a caregiver's behalf; only a human may retire | **Met** | §5.8. `retired_by ∈ {caregiver, clinician}`; there is no `algorithm` value in the type. The module exports no `retire()`. |
| 16 | Log rich telemetry so a DSR/FSRS-shaped model can be fitted retrospectively; if a memory model is wanted, keep the power-law form, fit population priors from our own cohort, per-item Bayesian updating not per-user optimisation, target ≥0.95, cap max interval, add a progression term | **This is the requirement the design implements as the scheduler** | Power-law form §4.1. Per-item Bayesian updating §4.3, with `SCHEDULER_PARAMS` frozen and participant-independent (§8.1) — inference on state, never optimisation of parameters. Target 0.95 §4.7. Caps §4.6. Progression term §5.9. **Population priors are the one clause not yet met:** `MU_INIT`, `SIGMA2_INIT`, `G`, `ENC_STEP` are v1 guesses, not cohort fits, because no cohort exists. They are versioned by `params_version` so that a v2 refit is a constant change, not a rewrite. The telemetry spec in §7 of the synthesis is emitted unchanged; `stability`, `difficulty`, `retrievability`, `predicted_recall_probability` are populated from `exp(mu)`, `null` (no difficulty term — §8.1), `R(t,S)` and `P(t,S,c)` respectively. |
| 17 | Licensing: re-implement SM-2 from the 1990 description if needed; prefer `fsrs-rs` (BSD-3) or the MIT reference for any FSRS component; never vendor AGPL Anki code | **Met** | Zero dependencies. SM-2 is not implemented at all. The power-law form is implemented from the published functional description (Ye 2022 KDD; Su 2023 TKDE; the FSRS project wiki) in about four lines of arithmetic; no FSRS source is vendored, so no attribution obligation is incurred. No Anki code, in any form, anywhere. |

**Requirements not fully met, named rather than papered over:** #11 (within-session fluctuation, §10.8) and the "population priors from our own cohort" clause of #16 (no cohort exists yet). Both are declared in §10 and neither is silent.

---

## 12. Compliance with the design principles that bear on scheduling

| Principle | How this design satisfies it |
|---|---|
| **P1** session terminates on success | Generic closer always last, exempt from the time cap; a cue-3 rescue of the missed item is inserted if the last graded trial was a miss (§5.6). `ended_on_success` is computed from the log for the S3 audit. |
| **P2** difficulty carried by cue level | §8.3, Theorem `MISS-DOES-NOT-SHORTEN`. The four-rung ladder is `G = [0, 0.45, 0.75, 1.00]`. |
| **P3** no auto-retire | §5.8, and §5.4's recovery path so that cue 3 is not a silent retirement. |
| **P4** patient never supplies or sees a grade | §5.1 signature; `grade` is telemetry-only and never returned to any patient-surface function. |
| **P5** no aggregate of failure rendered | No exported aggregate. `drift_level` and `support_index` are internal (§5.9). The only outward signal is §5.10's single physical-illness-framed caregiver message. |
| **P6** skipping has no consequence | A skipped day produces no event, so `reduce` is never called, so no state changes. Process noise accrues, which lengthens *uncertainty* and therefore *shortens* the next interval — the opposite of a penalty. |
| **P7 / P8** flexible window, no prompting after 16:00 | Out of scope by design: the scheduler emits `due_at` only and never a notification time (§4.8). |
| **P11** generic opener and closer | §5.6 steps 7 and 9. Generic items are never in `state.items` and are never graded. |
| **P12** answer-first for tier-1 identity content | Tier-1 items are introduced at `cue_level = 3` (§6.2), i.e. photo + name + relationship with no question, and descend only after demonstrated success at cue 2 inside the Camp loop. |
| **P18** distress never inferred | §5.7. `abandonment` and `repeated_skip` are logged and are inert. |
| **P24** no clinician-facing progression metric | `drift_level` surfaces nowhere. §5.10 has exactly one recipient (the caregiver) and one fixed wording. |
| **P25** acute-change policy exists, with a threshold, a named recipient and physical-illness framing | §5.10, all three specified. |

---

## 13. If this design is rejected

The fallback is the fixed-ladder design, and the migration cost is small and worth stating: `LADDER_DAYS`, `CAMP_SECONDS`, the cue ladder `G`, the tier caps, the drift detector, the distress absorbing state, the selection order and the entire event schema are **identical** in both designs. What is deleted is §4.3 (the update), §4.5 (the encoding term), §4.6's `raw` line and §4.7 — roughly 60 lines — and `ladder_index` is promoted from ceiling to scheduler. The two designs share a contract and a fixture format, and the fold signature does not change.

That is deliberate. If the continuous model turns out to be uncalibrated in the pilot (§10.1) or if the encoding hypothesis is null (§10.4), the product does not need a rewrite: it needs a constant set to zero and a `min` removed. **The continuous model is built so that failing to justify itself costs 60 lines rather than a redesign** — and until the fit exists, that is the most honest thing that can be said for it.

