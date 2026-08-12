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
| 0 | 0.00 | `0.95` | `0.4605627642513485` |
| 1 | 0.45 | `0.50/0.55 = 10/11 = 0.9090909090909091` | `0.8952631578947368` |
| 2 | 0.75 | `0.20/0.25 = 0.80` | `2.3980263157894737` |
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
| 0 | `MIN_INTERVAL_DAYS / M[0]` = `0.3619281…` d | 8.686 h |
| 1 | `MIN_INTERVAL_DAYS / M[1]` = `0.1861725…` d | 4.468 h |
| 2 | `MIN_INTERVAL_DAYS / M[2]` = `0.0694984…` d | 1.668 h |
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
