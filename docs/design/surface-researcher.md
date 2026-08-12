# RESEARCHER SURFACE — THE TRIAL OPERATIONS CONSOLE AND THE RESEARCH EXPORT

**Status:** Design, submitted for freeze. Not frozen.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles, §7 telemetry, §8 success criteria, §9 NEVER DO), `docs/design/00-V1-PRODUCT-SHAPE.md` §8 (the settled researcher surface), `docs/architecture/00-ADR-PLATFORM.md` §5.4 / §6 / §7.
**Renders:** Surface **A** (research export) and Surface **B** (trial operations console) of the frozen §8.2 table. Surface **C** (clinical layer) is not designed here because it is not built, not dark, and not in the repository.
**Reference viewport:** 1440 × 900 minimum, designed to 1680 × 1050. Desktop only, mouse and keyboard, plain DOM.
**Cohort scale assumed:** 24–60 enrolled dyads. Every cohort table is exhaustive and unpaginated at that size; §15.6 states what breaks past ~300.

---

## 1. THE SURFACE IN ONE SENTENCE

> **A dense, read-only, pseudonymous instrument panel that answers one question on every screen — *is this pilot running, and is it hurting anyone?* — plus a versioned export job that hands an investigator the entire behavioural corpus as tidy CSV with a codebook, and never once renders a person's cognition as a line going down.**

The patient surface is designed by subtraction. This one is designed by addition, and it is the only surface in the product where **information density is a virtue**: small type, real tables, hairline rules, many numbers on screen at once, no hero illustration, no empty state that says "no data yet 🎉".

---

## 2. WHAT SHIPS, RESTATED, AND THE ONE RULE THAT DIVIDES IT

### 2.1 The frozen table, unchanged

| Surface | Status | This document |
|---|---|---|
| **A — Research export** | SHIPS IN FULL | §14. A scheduled, versioned job producing a signed bundle to a named investigator under REC approval and a DPA. Not a download button. |
| **B — Trial operations console** | SHIPS THIN | §6–§13. Eight screens. The compliance audit instrument for six of seven Tier-1 safety criteria. |
| **C — Clinical layer** | NOT BUILT | Not designed. Drift, trajectory and progression are computed offline by the investigator from the export, as versioned recomputable derived variables. |
| **D — P25 delirium notifier** | SHIPS (caregiver-facing) | Its **audit trail** appears on this surface (§10.5). The notifier itself is not this surface. |

"Ships thin" is not "ships lightly". It is the instrument that lets the pilot be stopped early. It is thin in *scope*, not in *rigour*.

### 2.2 The rendering rule

Everything in §7 of the synthesis is collected. The question this surface has to answer, screen by screen, is what may be *drawn*. The line is not "which data" — it is **which noun the quantity is a property of**.

> **A chart may render a quantity that is a property of the STUDY, of a SESSION, or of the INSTRUMENT.
> A chart may not render a quantity that is a property of a PARTICIPANT'S COGNITION OVER TIME.**

| Property of… | Examples | Renders? |
|---|---|---|
| The study | recruitment, allocation balance, version homogeneity, data completeness, `seq` gaps | **Yes** |
| A session | duration, `session_end_reason`, `ended_on_success`, step reached, `session_mode`, `administered_by`, time of day | **Yes** |
| The instrument | per-probe-item difficulty, rescue integrity, ceiling/floor effects, probe attrition | **Yes** |
| Safety | adverse events, distress rate with exact CIs, deceased-surfacing incidents, dissent, probe-disabled, P25 notifier outcomes | **Yes — per participant, by regulatory obligation** |
| A participant's cognition over time | accuracy trend, `attained_rung` trend, latency trend, `forgetting_rate_lambda`, learning-curve AUC, retention at 7d/30d, IIV, practice-effect slope, `predicted_recall_probability` | **No. Exported, never drawn.** |

Two corollaries that make the rule operable rather than pious:

**2.2.1 Rows are permitted; trends are not.** A researcher inspecting raw `interaction` rows in a table is doing data access under REC approval. A rendered trajectory is an *interpretation the product authored*, and it is the interpretation — not the number — that MDR Annex VIII Rule 11 and MHRA's *"adapts exercises based on user responses"* example are about. So the per-participant interaction table exists (§11.4), and the outcome columns inside it sit behind an explicit disclosure toggle that is off by default and writes an access-log row. That toggle is not security theatre; it is the audit artefact that lets us prove to a reviewer how often anyone looked.

**2.2.2 Cohort aggregates of the generic probe are permitted; individual probe curves are not.** The probe is generic, standardised, identical across participants and scheduler-blind. A pooled learning curve over stock face–name items is a psychometric property of an instrument in a research population. §8.1 of the frozen shape restored M1/M4/M6 on exactly this reasoning: *the research plane exports nothing that reads as clinical status **about an identified individual to anyone in a care relationship with them***. Guardrails in §10.

**I am not pretending this line is sharp.** §19.1 records where a regulator could reasonably put it somewhere else and what it would cost us.

### 2.3 What is deliberately absent, and why each absence is load-bearing

| Absent | Why |
|---|---|
| Any per-participant accuracy, retention, rung or latency **chart** | §2.2. This is the whole Class IIa exposure. |
| Any drift / trajectory / progression indicator anywhere | ND-23; §8.3 removed the global drift term from the runtime entirely. |
| Any patient name, photograph, voice clip, typed sentence, or free-text narrative | ND-18; P20/P21. Enforced by missing grants (§4.3), not by filtering. |
| Any real date, anywhere, including in the adverse-event register | ND-18. `day_offset_from_enrollment` only. Requires an amendment to ADR §4.3 — see §17.1. |
| Any live view of a named participant | §8.2 Surface A: *"Cohort-level and retrospective — no live view of a named participant."* The console's freshness contract is in §5.5. |
| A "download all data" button in the browser | §14.1. Export is a job with a recipient, a manifest and a log, not a click. |
| Any write capability for the `researcher` role | ADR §4.1: researcher is read-only. Two narrow write grants exist for two other roles (§4.2). |
| A green/amber/red traffic light as the only status encoding | Colour is never the sole channel (§15.4); and a green light on a Tier-1 safety criterion invites exactly the complacency the register exists to prevent. |
| Any of the patient surface's 88pt / 7:1 / no-chrome / 300ms rules | §15.7. Those are patient rules with patient evidence. Applying them here would be cargo cult and would cost density for no benefit. |

---

## 3. WHO THE RESEARCHER IS, AND WHAT THEY ARE ACTUALLY DOING

Three jobs, in the order of how often they are done:

1. **The Monday morning check (weekly, 4 minutes).** Did anything bad happen? Is anyone drifting toward zero? Is the data still arriving? → Screens 1 and 4 answer this without scrolling.
2. **The data-quality dig (monthly, 40 minutes).** Why does participant P-0173 have 40% missing timing fields? Which app version were they on? Did their tablet lose events? → Screens 6 and 8.
3. **The analysis (twice, at lock and at publication).** Everything real happens in R or Python against the export. The console is not an analysis tool and does not pretend to be one.

The corpus is explicit that the ranking is: **tidy CSV first, read-only API second, dashboard third** (`outcome-measures-and-data.md` §"How researchers should consume it"). This document honours that ordering: §14 is the load-bearing section and §6–§13 are the operations instrument that keeps the study alive long enough for §14 to matter.

---

## 4. ROLES, GRANTS, AND WHAT DE-IDENTIFICATION IS MADE OF

### 4.1 The architectural inheritance

ADR §5.4, verbatim: *"Researchers never query base tables. They query `research.*` views exposing a stable pseudonymous `participant_code`, age band, and metrics — no names, no media, no free text. The pseudonym↔patient mapping lives in a schema with **no grant to the researcher role at all**. De-identification is a missing grant, not a `WHERE` clause somebody can forget."*

This design adds nothing to that principle and extends it three times: to the **content plane**, to the **arm key**, and to the **outcome views before data lock**.

### 4.2 Three roles

| Role | Reads | Writes | Held by |
|---|---|---|---|
| `researcher` | all of `research.*` except `research.outcome_by_arm_*` | **nothing** | study team, analysts |
| `safety_reviewer` | all of `researcher`, plus `research.adverse_event_detail` | exactly two columns: `adverse_event.reviewed_at` / `.review_outcome_coded`, and `p25_notification.followup_outcome` | the named clinical advisor (S2), who is not the analyst |
| `investigator` | all of `researcher` | `insert into export_request` only | the named PI on the REC application |

No role has `UPDATE` or `DELETE` on any telemetry table, in any schema. Ever. A researcher cannot fix a row; they can only annotate a derived variable in their own analysis plane.

### 4.3 The four missing grants

| Grant that does not exist | Consequence |
|---|---|
| `researcher` → `identity.participant_map` | No route from `participant_code` to a person. |
| `researcher` → `content.*` and `storage.objects` | No photo, no audio, no name, no typed sentence, no transcript reaches this surface even if a view is written wrong. The export job runs under the same missing grant. |
| `researcher` → `study.arm_key` | Arm labels render as `A`/`B`, `S1`/`S2`, `P1`/`P2`. Nobody on this surface can learn which is errorless and which is recall-first. (§12) |
| `researcher` → `research.outcome_by_arm_*` **until** `study.analysis_locked_at is not null` | By-arm outcome views do not exist as a permission during data collection. Unblinding is a database event with a timestamp, not a UI preference. (§12.4) |

Four grants that were never written are worth more than four hundred lines of filtering code, and they are testable: `policies.ts` (ADR §6.1) gets one row per missing grant, asserted negatively by the blind RLS suite.

### 4.4 The consent-linked column class

§8.4.3 requires the speech-feature layer to be *disclosed in plain words in the patient UI and the consent form, and separately removable*. That makes speech features a **removable column class**:

- `participant.speech_features_consent` (bool) governs the entire speech block in `interaction`.
- When false, the speech columns are `NULL` **and** `speech_features_withheld = true` is set on every row.
- The manifest records the count of participants withheld.

NULL-because-withheld and NULL-because-no-utterance are never the same value. This is the same discipline §7 imposes on `session_end_reason` (*"abandonment and device failure mean opposite things clinically and must never be indistinguishable"*), applied to missingness rather than to endings.

---

## 5. THE SHELL

### 5.1 Eight screens

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ DEMENTIA-ANKI · TRIAL OPERATIONS      study PILOT-01 · day 84 · export v7    │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Cohort · Adherence · Sessions · Safety · Probe · Arms · Data & Export        │  ← 7 tabs
│ ─────────────────────────────────────────────────────────────────────────── │
│ FILTER ROW  [phase ▾] [subtype ▾] [fluctuation band ▾] [site ▾] [day range] │  ← scopes everything below
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  … screen content …                                                          │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│ engagement and usage analytics for research — not a clinical assessment;      │
│ not for diagnosis or treatment decisions.                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Seven tabs plus **Participant**, which has no tab — it is reachable only by clicking a `participant_code` in any table, and it carries a "back to where you came from" crumb. That is deliberate: there is no way to browse participants as a gallery, because a gallery of people is what a caregiver dashboard looks like and P23/§1.8 make that shape hazardous even here.

### 5.2 The label is a component, not a footer string

P24 requires the surface to ship labelled *"engagement and usage analytics for research — not a clinical assessment; not for diagnosis or treatment decisions."* It renders:

- as a persistent footer bar on every screen, 13px, secondary ink, never dismissible;
- **inside every exported chart PNG/SVG**, baked into the artefact, because a screenshot pasted into a slide deck is exactly how a label gets lost;
- as line 1 of `README.md` in every export bundle;
- as a `<meta>` on the page and a caption in the print stylesheet.

C3 (automated claim-lint over all copy surfaces, gating release) covers this surface's strings too.

### 5.3 The filter row

One filter row, above everything it scopes, per the dataviz rule against per-chart filters. Filters: `phase`, `dementia_subtype`, `fluctuation_band`, `severity_band`, `consent_pathway`, study-day range. Every chart on the screen re-renders against the same slice; the active slice and its `n` are printed in the row so no chart is ever read out of context.

**Two filters do not exist:** arm (§12.3), and free-text search.

**Small-cell suppression is a property of the filter, not of each chart.** Any slice yielding `n < 5` participants renders as `n < 5 — suppressed` across the whole screen, with the count of suppressed strata shown. This is the same k-anonymity floor as the export (§14.5) and it exists because a 40-person pilot with subtype, locale and age band on screen is re-identifiable by anyone who knows one participant.

### 5.4 Layout grid

12-column, 1240px content width at 1440 viewport, 16px gutters, 24px vertical rhythm. Charts sit in cards: hairline ring `rgba(11,11,11,0.10)`, 16px padding, no shadow, no rounded corner larger than 4px. Card header is title (15px, primary ink) + question (13px, secondary ink, italic). **Every card states the question it answers in its own subtitle.** A chart that cannot state its question in one line does not ship.

### 5.5 Freshness, and why this surface is deliberately stale

§8.2 forbids a live view of a named participant. The console reads a **materialised snapshot rebuilt nightly at 03:00 study-server time**, and prints `snapshot: day 84, built 7 h ago` in the header. Three reasons, in order of weight:

1. It removes the "watching someone in real time" affordance entirely, which is the P23 hazard in its research-plane form.
2. It makes every number on screen reproducible — two researchers looking on the same day see the same figure, and a number quoted in a meeting can be recovered.
3. It makes the export and the console consistent by construction: the export is a materialisation of the same views at the same cursor.

The **one exception**: new `adverse_event` rows and `p25_notification` rows stream within 60 seconds and raise a persistent banner until the safety reviewer marks them reviewed. A safety register that is 7 hours stale is not a safety register.

---

## 6. SCREEN 1 — COHORT

The study's vital signs. Answers: *is this pilot alive, and is it hurting anyone?*

### 6.1 The criterion strip (top of screen, above everything)

One tile per Tier-1 and Tier-2 criterion, 14 tiles, four rows of four-ish, each 220 × 96px:

```
┌────────────────────────────┐
│ S1  distress events        │
│ 2.1%  ▸ target < 5%        │
│ 95% CI 1.2–3.5 · n=1,204   │
│ ✓ MET                      │
└────────────────────────────┘
```

Rules for the tile:

- The **number is the largest thing** (24px, proportional figures), the target is beside it, the interval is under it, `n` is always printed.
- Status is one of exactly four words: **MET · NOT MET · INSUFFICIENT DATA · AWAITING ENDPOINT**. Never a bare colour. Status colour is from the reserved status palette (§15.2) and is always paired with a glyph and the word.
- `INSUFFICIENT DATA` is a first-class state and is the default. A criterion computed on n=3 is neither met nor failed, and a design that has no way of saying so will silently report a met criterion in week two.
- `AWAITING ENDPOINT` is the correct state for **S5** (carer anxiety, GHQ-28 / HADS-A), which is externally administered at baseline and end of pilot and cannot be computed continuously. The tile shows baseline `n` collected and endpoint `n` outstanding.
- Tiles for **S2** (zero catastrophic reactions), **S4** (zero deceased-surfacing), **S6** (zero continuations after dissent) are **zero-or-incident** tiles: a large `0` in the normal state; on any non-zero value the tile turns critical, states the count, and links straight to the incident rows. There is no "1 is fine" rendering for a criterion whose target is zero.
- Clicking a tile scrolls to and highlights the chart or table that computes it. Every criterion is one click from its evidence.

### 6.2 Charts

**C-01 · Recruitment funnel**
- **Question:** will recruitment kill this pilot before effect size gets a chance to? (F7; §P32 names recruitment failure as the most common way a pilot like this dies.)
- **Mark:** horizontal bars, one per stage, count direct-labelled at the bar end, with per-stage yield % against the previous stage.
- **x:** count (0 → approached). **y:** stage, ordinal, top to bottom: approached → consent-to-approach → Gate-2 screened → clinician-reviewed → eligible → enrolled → still active.
- **Colour:** ordinal ramp, one hue (blue), step 250 upward — never categorical, because the stages are ordered and a categorical palette would imply they are different kinds of thing.
- **Attrition rail:** a second, right-aligned bar per stage showing the *exclusion reasons* as a small stacked bar: PCA-excluded / svPPA-excluded / deferred-acute-change / deferred-sensory / declined / other. These are the P26 gate outcomes and they are their own finding — a high PCA-exclusion rate means the eligible population is smaller than the market assumed.
- **Table twin:** stage, n, yield %, cumulative yield %.

**C-02 · Enrolment against plan**
- **Question:** are we on the recruitment trajectory the protocol committed to?
- **Mark:** step line (actual, blue), solid hairline reference line (plan). Not dashed — dashing is reserved for nothing on this surface, per the anti-pattern list; the plan line is a *different colour and directly labelled*, not a different stroke.
- **x:** study day, 0 → today. **y:** cumulative enrolled.
- **Direct labels:** endpoint of each line only.

**C-03 · Zero-session dyads (F2)**
- **Question:** what proportion of enrolled dyads have never run a single session?
- **Form:** a **hero figure**, not a chart. This is *"the single most predictive early number"* and it gets the largest type on the screen (48px). Under it: `target < 20% · iCST comparator 22%`, with the comparator as a small reference marker on a thin meter track.
- Why a hero figure and not a bar: a one-bar bar chart is an anti-pattern, and burying this number in a chart grid is how it gets read late.

**C-04 · Onboarding time (F3)**
- **Question:** does the eleven-thing day-1 ask actually fit in one sitting?
- **Mark:** ECDF step line. **x:** instrumented caregiver minutes, 0–25. **y:** cumulative proportion of dyads.
- **References:** vertical hairline at the 10-minute hard ceiling; horizontal hairline at 0.5 so the median reads straight off the curve.
- **Why ECDF and not a histogram:** F3 is stated as *a median and a ceiling*. An ECDF answers both from one mark, and it does not have a bin-width parameter that can be tuned to flatter the result.
- **Annotation:** proportion under 10 min, printed. Includes physical-photo capture time (F3 says "including physical-photo capture"); a separate faint line shows the same ECDF excluding capture, so the P29 digitisation wall is visible rather than absorbed.

**C-05 · Caregiver authoring minutes per week (F6)**
- **Question:** is carer burden creeping? (The primary product risk. §1.8: *every trial that increased carer involvement increased carer cost*.)
- **Mark:** median line with an IQR ribbon. **x:** study week. **y:** minutes of instrumented caregiver authoring time.
- **Reference:** hairline at 5 minutes.
- **The criterion has two halves and the chart must show both:** ≤5 min/week *and not increasing over time*. The card prints the fitted week-on-week slope with its CI beside the chart. A flat median at 4 minutes with a positive slope is a failing criterion that a median line alone would hide.

**C-06 · Session-mode composition**
- **Question:** how much of the corpus is bad-day mode, and is that share stable?
- **Mark:** stacked area, 2px surface gap between bands. **x:** study week. **y:** proportion of sessions, 0–1. **Series:** `normal` / `nothing_today` (M-135).
- **Why it is on the landing screen:** §2.2 of the frozen shape says `session_mode` is logged first-class *"or it is the largest generator of non-random missingness in the design."* A rising `nothing_today` share means the analysable denominator is shrinking in a way that correlates with the thing being measured. That is an MNAR alarm, and it is a study-integrity finding, not a cognition finding.

---

## 7. SCREEN 2 — ADHERENCE & RETENTION

Answers: *are people using it, are they leaving, and are those two the same people?*

**C-07 · Segment vs subsegment adherence**
- **Question:** is adherence stable on a flexible window and decaying on a daily one — i.e. does the P7 finding replicate here?
- **Mark:** two lines, categorical slots 1 (blue) and 2 (orange), both direct-labelled at their right endpoints, legend present.
- **x:** study week. **y:** adherence proportion, 0–1.
- **Series:** `segment` = proportion of active dyads with ≥1 session that week. `subsegment` = mean proportion of days within the week with a session.
- **Reference:** hairline at 0.60 (F1's threshold), and two faint comparator markers on the right margin: iCST 40% at ≥2/week, and the segment/subsegment benchmark pair 78.8% stable vs 60.6% decaying (93.9% → 72.7%). Comparators are labelled `comparator — different population` and are visually recessive.
- **Why both lines on one chart:** the *gap* between them is the finding, and P7 — "the cheapest single adherence win available" — is the design decision the gap justifies. Two separate charts would hide it. (This is not a dual-axis chart: both series are proportions on one 0–1 axis.)

**C-08 · The two attrition curves, separately**
- **Question:** who has formally left, and who has silently stopped without telling us? (F4; Eysenbach requires these separately and a single completion percentage is explicitly not acceptable.)
- **Mark:** two step lines, survival-style, no smoothing, no interpolation between weeks.
- **x:** study week. **y:** proportion of the enrolled cohort remaining, 1 → 0.
- **Series:** `dropout attrition` = a `consent_event` of type `withdrawal` (slot 2, orange). `non-usage attrition` = still consented, no session in 14 days (slot 1, blue).
- **The band between the two lines is filled at 12% opacity of slot 1 and labelled directly: "silently stopped, still enrolled".** That population is the one the analysis has to decide how to treat, and it is invisible on any single completion figure.
- **Annotation:** the curve-shape classification (logarithmic / sigmoid / L) is *computed offline* and printed as text with its fit statistic. It is not a chart feature, because a fitted shape drawn over the data invites reading the fit instead of the data.
- **Censoring is shown:** a tick on each line at every week where a participant is still within their planned follow-up, so a falling line is not confused with a shortening denominator.

**C-09 · Sessions per dyad per week — distribution**
- **Question:** is the cohort mean hiding a split between a heavy-use minority and a silent majority?
- **Mark:** stacked area of dyad counts by session-count band (0 / 1 / 2–3 / 4–6 / 7+ sessions that week), 2px gaps, ordinal ramp (blue, steps 250→600), legend plus direct labels on the two largest bands.
- **x:** study week. **y:** count of active dyads.
- **Why bands and not a mean:** Li 2024's thresholds (>60% persistence, >80% adherence) are properties of individuals, not of a cohort mean; a mean of 3.1 sessions/week is compatible with nobody reaching threshold.

**C-10 · Time-of-day distribution**
- **Question:** when does the session actually happen, and is the ND-29 rule holding?
- **Mark:** column chart. **x:** `local_hour` (or `time_of_day_bucket` when the hour is suppressed under small-cell rules). **y:** session count.
- **Reference:** a hairline at 16:00 with the region beyond it in a recessive wash, labelled.
- **Paired counter, beside the chart, not in it:** *notifications fired after 16:00 without a recorded caregiver override* — **target 0**. Sessions after 16:00 are permitted (a family may open the app whenever they like); *nudges* after 16:00 are not. Conflating the two would make a compliance breach look like ordinary usage, and this is the chart where that mistake is easiest to make.

---

## 8. SCREEN 3 — SESSIONS

Answers: *what does a session actually look like, and where does it break?*

**C-11 · Session step funnel**
- **Question:** where does the session break?
- **Mark:** horizontal bars, one per step of the frozen §4 walkthrough, count and % of started sessions direct-labelled.
- **x:** proportion of started sessions reaching this step. **y:** the ten steps, in order: opener → song(primed) → month-target → Camp block → probe → tell-me-about-this-one → song(unprimed) → closer → fade-to-rest.
- **Colour:** ordinal ramp, one hue. Steps are ordered; categorical would be wrong.
- **Why this is the most actionable chart on the surface:** it maps 1:1 onto the frozen walkthrough, so a drop between two bars names the mechanic to fix. A collapse at step 6 (the probe) is a different product problem from a collapse at step 5 (the Camp block), and a single "completion rate" number cannot tell them apart.
- **It is not a cognition chart:** reaching a step is a property of the session, not of the person's memory.

**C-12 · Session end reason composition**
- **Question:** are sessions ending, being abandoned, or crashing — and is the mix changing?
- **Mark:** stacked area, 2px gaps. **x:** study week. **y:** proportion, 0–1.
- **Series:** `completed` / `user_ended` / `distress_stop` / `timeout` / `app_crash` / `device_failure`. Six series, at the token ceiling; `distress_stop` is additionally direct-labelled always, even at 0.4%, because it is the one that matters.
- **This chart exists because of one sentence in §7:** *abandonment and device failure mean opposite things clinically and must never be indistinguishable*. Drawing them as one "incomplete" band would re-introduce exactly the ambiguity the field was created to remove. A rising `app_crash` share is an engineering bug; a rising `user_ended` share is a product finding; a rising `distress_stop` share stops the pilot.

**C-13 · `ended_on_success` compliance (S3)**
- **Question:** is P1 actually holding in the field, computed from telemetry rather than from intent?
- **Mark:** line, **y-axis clipped to 0.90–1.00** with the truncation stated in the axis label (`0.90–1.00, truncated`). **x:** study week. **Reference:** hairline at 0.99.
- **Truncating a y-axis is normally a sin. It is correct here** and the reason is worth stating: the criterion is ≥99%, so the entire decision space is the top 1% of the range and a 0–1 axis renders the chart as a flat line with no information in it. The truncation is declared in the axis label and the table twin shows raw counts.
- **Paired counter:** count of sessions with `ended_on_success = false`, each one a clickable row. At ≥99% there should be a handful in the whole pilot and every one should be individually explicable.

**C-14 · `administered_by` composition**
- **Question:** how much of my dataset is confounded by proxy administration?
- **Mark:** stacked area. **x:** study week. **y:** proportion of interactions.
- **Series:** `self` / `caregiver_assisted` / `caregiver_proxy`.
- **Why it is prominent:** §7 marks this *"a hard confound"* captured per interaction rather than per session, and `outcome-measures-and-data.md` Open Question 2 says it is unresolved whether this is a covariate or a stratification variable. Either way the analyst must know the proportion before the analysis plan is written, not after. Paired with a second, thinner chart of `caregiver_present` × `caregiver_present_source` (declared vs inferred), which is the P28 check: is the product actually running without the carer, as designed?

**C-15 · Session duration and item completion**
- **Question:** is the session running the 8–10 minutes it was designed to run?
- **Mark:** ECDF of session duration. **x:** minutes, 0–20. **y:** cumulative proportion. **Reference:** a shaded 8–10 minute design band.
- **Beside it:** median `completed_n_items / planned_n_items` by week, with IQR ribbon.

**T-01 · The cohort session table**
Real `<table>`, dense (28px rows, 13px tabular-nums), sortable on every column, filterable, virtualised past 2,000 rows, CSV-copyable.

`participant_code · day_offset · time_of_day_bucket · duration_ms · planned_n · completed_n · session_end_reason · ended_on_success · session_mode · caregiver_present · administered_by(modal) · mood/sleep/fatigue · prime placement · M-40 stimulus label · network_state · app_version · patient_ui_version · n_backgrounds · interrupted · seq_gap_count`

Not present: `accuracy`, `mean_rt_ms`, `median_rt_ms`, `isd_residual_rt_ms`, `cv_rt`, `n_lapses`. Those are in `session.csv` in the export. They are outcome columns and they are not drawn or tabulated here — see §11.4 for the one place they are reachable and what that costs.

---

## 9. SCREEN 4 — SAFETY

The most important screen in the product. Answers: *is this hurting anyone, and did a human look?*

### 9.1 The adverse-event register (T-02)

A real table, default-sorted `reviewed_at IS NULL` first, then severity descending, then `day_offset` descending. Unreviewed events are pinned and the tab carries a count badge.

| Column | Note |
|---|---|
| `event_id` | short, copyable |
| `participant_code` | links to Screen 6 |
| `day_offset_from_enrollment` | never a date |
| `severity` | mild / moderate / severe |
| `category` | distress / catastrophic_reaction / bereavement_confrontation / carer_distress / acute_change_suspected_delirium / other |
| `related_item_class` | `content_class` + `relationship_category` + `era_decade` + `person_status` + `content_is_generic`. **Never the item's name, photo or sentence.** |
| `mechanic_at_event` | which of the six was on screen |
| `narrative_coded` | see §9.2 |
| `action_taken` | enum |
| `reported_by` | patient_control / caregiver_report / abandonment / repeated_skip — **never an inferred classifier** (P18) |
| `probe_disabled_as_result` | bool |
| `reviewed_at` / `review_outcome_coded` | the only writable cells on this surface, `safety_reviewer` only |

Row expansion shows the session context: the session's step at the moment of the event, `session_mode`, `attained_rung` at that trial, `distress_signal_source`, and the three interactions before it. **This is the one place a per-trial outcome field renders without a toggle**, and it renders because an adverse event cannot be reviewed without its context. That is a considered exception to §2.2 and it is recorded as one.

### 9.2 `narrative_coded` is not prose — a required tightening of §7

§7 lists `narrative_coded` in `adverse_event` without defining it. Left loose, a well-meaning study nurse types *"Margaret cried when she saw her late husband John on the Tuesday card"* and every de-identification guarantee in §14.5 is gone in one sentence.

> **Definition, binding on the schema:** `narrative_coded` is a tuple of `(precipitant_class enum, expression_class enum, resolution_class enum, ≤3 controlled-vocabulary tags)`. There is no free-text column in the research plane's adverse-event table, in any form, at any length.

The clinician's free-text narrative lives in the **trial master file**, outside both planes, under the site's own governance, and never crosses into the export. §14.5 makes this a testable invariant.

### 9.3 Distress rate with exact intervals (S1)

**C-16 · Per-participant distress rate**
- **Question:** is the harm spread across the cohort or concentrated in one person? That distinction is the difference between *stop the product* and *withdraw one participant*, and a pooled percentage cannot make it.
- **Mark:** caterpillar / forest plot — one row per participant, point estimate with an exact (Clopper–Pearson) 95% interval whisker, sorted by rate descending. At n ≤ 60 every participant fits on one screen.
- **x:** proportion of that participant's completed sessions with any distress event, 0 → max. **y:** `participant_code`, ordinal.
- **Reference:** vertical hairline at 0.05; a pooled diamond at the bottom of the plot.
- **Pooled interval:** sessions are clustered within participants, so the pooled figure carries a **cluster bootstrap** interval and is labelled as such beside the naive Clopper–Pearson one. Reporting the naive interval alone would overstate precision by roughly the design effect, and S1 is a criterion that stops the product.
- **Is a per-participant safety rate "clinical status"?** No. It is an adverse-event rate. Per-participant adverse-event reporting is a regulatory obligation in every trial framework we will be judged under, including SCRIBE item 21. §2.2 permits it explicitly.

### 9.4 The zero-target audits

**S4 — deceased surfacing.** A content-flag audit joined to the interaction log: every interaction where `person_status = 'deceased'` and `presentation_mode ∈ {free_recall, cued_recall, recognition}`. Normal state: a large `0`. Any instance: a serious-incident table with participant, day, item class, the flag state at the time of presentation, and the caregiver-decision record that should have existed. Every instance is a serious incident and the tile says so.

**S2 — catastrophic reactions.** Count (target zero) plus review status per event. Independent review by the named clinical advisor is a workflow state on the row, not an assumption.

**S6 — dissent.** A consent audit: any `dissent_observed` event, and whether a session ran after it. Target zero continuations. Column: interval in days between the dissent event and the last subsequent session. A non-zero value is an MCA s.33 breach and is rendered as one.

**Consent hygiene, alongside.** Overdue `capacity_review_date`, overdue reaffirmations against the fixed cadence, participants whose `consent_pathway = consultee` (a stratification variable and an ethics-monitoring population). These are not criteria; they are the things that turn into criteria failures if nobody looks.

### 9.5 Probe-disabled register

Every participant whose probe was disabled by §5.2.5, with the triggering adverse event and the study day. Two reasons it is its own panel rather than a column:

1. A disabled probe is a **permanent structural hole** in that participant's M1 and F5 data and the analyst must know before modelling, not during.
2. It is logged as an adverse event, **not as missing data**, and a surface that shows it only as a gap in a curve would quietly re-classify it as the latter.

The probe learning-curve charts (§10) annotate their per-point `n` with the count lost to probe-disabling, so the denominator's shrinkage is never mistaken for an effect.

### 9.6 P25 delirium-notifier audit (S7)

Surface D is caregiver-facing. Its **audit trail** lives here, because S7 requires *≥1 verified true positive and a documented false-positive rate, with GP contact outcomes tracked*.

**T-03:** one row per notification — day_offset, the deterministic threshold values that fired it (generic-probe threshold, M-35 proverb floor-sentinel result), the wording variant sent, whether the caregiver acted, whether a GP was contacted, and the verified outcome (`confirmed_physical_illness` / `no_illness_found` / `not_followed_up` / `unknown`), written by `safety_reviewer`.

**Beside it:** a 2×2 count — notified × verified — with sensitivity left deliberately uncomputable, because the denominator (undetected delirium episodes) is not observable in this design. Printing a fabricated sensitivity would be worse than printing nothing, so the cell reads `not estimable by design` with a footnote. The FP rate *is* computable and is printed.

**Why this is not the forbidden clinical layer:** the notifier already exists, is already caregiver-facing, is already gated on B1, and is deterministic. Rendering an audit of what it did adds no new device exposure; **withholding** the audit would violate S7 and leave the highest-consequence component of the product unevaluated.

---

## 10. SCREEN 5 — PROBE (THE INSTRUMENT)

The generic probe is the only measurement surface in the product (§5.2). This screen is about **the instrument**, not about people.

### 10.1 The guardrails, stated before the charts

1. **No individual curve is ever drawn.** Not labelled, not anonymised, not as faint spaghetti — a hoverable line is an identity.
2. **The participant filter does not apply to this screen.** Selecting one participant elsewhere and navigating here clears the selection with a visible notice. If a per-participant probe curve could be produced by filtering to n=1, the guardrail is decorative.
3. **Minimum cell n = 5** to render any point, inherited from §5.3.
4. **By-arm splits do not exist as a permission before data lock** (§4.3, §12.4).
5. **Every point prints its `n`**, and the per-point loss to probe-disabling is annotated separately from ordinary missingness.

### 10.2 Charts

**C-17 · The 7-day onboarding learning curve**
- **Question:** does a BRANCH-shaped multi-day learning curve exist at all in a mild-to-moderate dementia cohort? This is M1 and it is publishable in either direction.
- **Mark:** line for the cohort mean, 95% CI ribbon, plus a lighter 10th–90th percentile band so heterogeneity is visible without any individual being traceable.
- **x:** probe day 1–7. **y:** proportion correct on **first uncued attempt** (the only place in the product where a real uncued failure is recorded).
- **Comparator:** BRANCH's reported figures rendered as a recessive right-margin annotation, explicitly labelled `comparator — cognitively unimpaired, n=181; MCI subsample n=16; different stimuli, population, duration and schedule`. §5.2.6 is unambiguous that reliability is re-established in our cohort and not inherited, so the comparator is annotation, never a plotted series on our axis.
- **Under the chart:** F5's number — proportion of participants completing ≥4 of the first 7 probe days, target ≥50%, against BRANCH's 92% — with the reminder from the criterion that *a large gap is itself the finding*.

**C-18 · Fixed weekly probe recurrence**
- **Question:** does the standardised instrument behave stably enough across the pilot to support a fitted retention model offline?
- **Mark:** line with CI ribbon. **x:** study week. **y:** cohort mean first-uncued-attempt accuracy on the fixed probe set.
- **This is the closest thing on this surface to the forbidden object, and it gets the strictest guardrails:** pooled only, n≥5 per point, no participant filter, no by-arm split before lock, per-point `n` printed, and a caption that says in words what it is and is not — *a cohort-level property of a standardised instrument; not a trajectory, not a status, not about any participant.*
- **Composition is shown alongside**, because a cohort mean over a shrinking, non-randomly-shrinking denominator is a trap: a small stacked area of who is contributing each week (active / probe-disabled / non-usage / withdrawn).

**C-19 · Per-item difficulty**
- **Question:** is any of the eight stock items broken — at floor, at ceiling, or systematically harder?
- **Mark:** horizontal bars, one per probe item, sorted by difficulty. **x:** proportion correct pooled across cohort and days. **y:** item ordinal (`probe_item_01`…`08`; the stimulus itself never renders here).
- **References:** hairlines at 0.10 and 0.90 marking floor and ceiling zones.
- **Why it matters and is clean:** an at-floor item contributes no information to the learning curve and carries the distress risk of the whole probe for nothing. Removing it is an instrument decision. This is a property of the item, not of a person.

**C-20 · Rescue integrity**
- **Question:** is the mechanism that makes P1 compatible with interpretable psychometrics actually working?
- **Mark:** line, y clipped to 0.95–1.00 with the truncation declared. **x:** study week. **y:** proportion of probe trials that started as a miss and terminated in a success (`rescued_to_success`).
- **Target 1.00.** §5.2.3 is the engineering trick the whole adjudication rests on: *you can record a failure and still never display one*. If rescue ever fails, a person with dementia was shown a failure. That is a bug with an ethical consequence, and it gets a chart of its own rather than a line in a log.

### 10.3 What is not on this screen

`multi_day_learning_curve_auc`, `forgetting_rate_lambda`, `retention_at_1d/7d/30d`, `short_term_practice_effect_slope`, `isd_residual_rt`, `cv_rt`, `ex_gaussian_tau`, `assistance_dependency_index`, M4's tier-1 retention, M6's within-person change reliability. All exported. None drawn. M4 and M6 in particular are per-participant longitudinal quantities and are computed in the analysis plane, versioned and recomputable — which §8.2 correctly argues gives the researcher a *better* artefact than a rendered one: uncontaminated by runtime adaptation, recomputable when the method changes, auditable.

---

## 11. SCREEN 6 — PARTICIPANT

Reachable only from a `participant_code` in a table. No browsing. No gallery.

### 11.1 Header

```
P-0173                                                          [back to Safety ▸]
arm A · stimulus randomiser 0.48 · prime randomiser 0.52
AD · moderate · age band 80–84 · education band 11–13 · first language en-GB
fluctuation_band: standard      prior_computer_use: none      apathy (NPI-Q item): 2
consent: consultee · reaffirmed day 60 · capacity review due day 90  ⚠ 6 days
enrolled day 0 · current study day 84 · phase: intervention
app 1.4.2 · scheduler 3 · content-set 2 · rubric 1 · patient-UI v1 (pinned, never changed)
```

No name. No photograph. No initials. No real date. No site. No room number. No free text of any kind.

`patient_ui_version` is printed prominently because P10 pins each participant to a UI version for the study duration, and a participant whose pin changed is a protocol deviation that must be visible on the first screen anyone looks at.

### 11.2 The session strip

The single most useful object on the screen, and it has no y-axis at all.

```
day  1                    30                    60                    84
     ████·██████·███·██████████·████░████·███████████·██·███████▓███████
     ↑                    ↑                              ↑
     enrolled             AE (mild distress, day 31)     probe disabled (day 62)
```

One cell per study day. Cell state: no session · completed · user_ended · distress_stop · crash/device_failure · nothing-today mode. Adverse events, consent events and P25 notifications are marked beneath the strip.

**Encoding:** state is carried by fill *and* by a distinct glyph, never by colour alone. Hover gives the session summary; click opens the session.

It answers *what does this person's participation actually look like* in one horizontal glance, and it contains not one particle of cognitive information.

### 11.3 Panels

- **Adherence:** sessions per week as a small column sparkline (counts), segment-window adherence for this participant, longest gap, days since last session.
- **Completeness:** proportion of expected fields present by field group; `seq`-gap count with the device that produced them; `interrupted` and `n_backgrounds` rates (the fields required to exclude contaminated trials from IIV).
- **Safety:** this participant's adverse events, distress rate with exact CI, probe-disabled flag and date, count of items in absorbing state (count only — the item's class is available in the export, the item's content is available nowhere).
- **Consent timeline:** `consent_event` rows on a day-offset strip: initial / reaffirmation / capacity_change / dissent_observed / withdrawal. Overdue reaffirmation flagged.
- **Instrumentation:** device class, OS, screen CSS px, DPR, refresh Hz, input modality, and the version quartet by study day. A version change mid-participant is rendered as a vertical rule across the session strip, because it is a confound and §7's whole reason for those four fields is that *"an algorithm change mid-study is a confound; without version stamps it is an unrecoverable one."*
- **Randomiser integrity, this participant:** proportion of sessions assigned `S1` and `P1`, with a binomial band around 0.5. Drift outside the band is a randomiser bug, not a finding, and it is the participant-level half of §12.2.

### 11.4 The interaction table, and the toggle

One row per item presentation, dense, virtualised, sortable, exportable to clipboard.

**Always visible:** `interaction_id`, `day_offset`, session, ordinal, `item_id`, `item_is_probe`, `item_tier`, `content_class`, `relationship_category`, `era_decade`, `person_status`, `content_is_generic`, `content_provenance`, `content_language`, `presentation_mode`, `within_session_rung`, `repetition_number`, `days_since_last_review`, `scheduled_interval_days`, `interval_deviation_days`, `administered_by`, `interrupted`, `n_backgrounds`, `distress_signal`, `distress_signal_source`, `difficulty_floor_triggered`, `item_absorbing_state_entered`.

**Behind `▸ show response and scheduling-state fields` — collapsed by default, and expanding it writes a row to `access_log` (who, when, which participant, which session range):**
`correct`, `grade`, `error_type`, `attained_rung`, `hint_level_reached`, `n_hints`, `time_to_first_hint_ms`, `rescued_to_success`, `latency_to_first_input_ms`, `total_response_time_ms`, `decision_time_ms`, `stability`, `difficulty`, `retrievability`, `predicted_recall_probability`, `assistance_dependency_index`, and the speech-feature block.

The toggle is not access control — a researcher can read every one of these columns in the export five minutes later. It is three things at once: a **friction** that stops idle browsing of a person's failures; a **statement** to a REC about how the team treats these columns; and an **artefact** that lets us report, at the end of the pilot, precisely how often anyone looked. It costs a `<details>` element and one insert.

**Never in this table, at any expansion:** `response_text_hash` in raw form (the coded `error_type` carries the analytic value), any transcript, any audio reference, any media path.

---

## 12. SCREEN 7 — ARMS & RANDOMISATION (MONITORING WITHOUT UNBLINDING)

### 12.1 What is randomised

| Factor | Design | Unit | Frozen shape |
|---|---|---|---|
| **M3** — probe: errorless (answer-first) vs recall-first | between-participant, **frozen at enrolment** | participant | §8.5 — it changes the shape of the trial |
| **M2** — M-40 stimulus: personal vs generic era photograph | **within-participant, randomised per session** | session | §8.5 — a pure stimulus swap in an identical shell |
| **Prime** — M-56 before or after the Camp block | **within-participant, randomised per session** | session | §2.4 — one asset, two placements |

P10 forbids A/B testing on the *patient interface*. §8.5 resolves that none of these moves a button, changes a layout, wording, icon, colour or position. That resolution has to be written into the protocol explicitly, and this screen is where it is *audited*.

### 12.2 What the screen shows (all blind-safe)

**Allocation balance.** Counts per arm label, with the allocation sequence's realised imbalance and its expected range under the pre-registered scheme (permuted blocks, stratified by `dementia_subtype` band and `fluctuation_band`). Knowing that arm A has 14 and arm B has 13 reveals nothing about which is which.

**C-21 · Randomiser integrity, within-participant**
- **Question:** is the per-session randomiser actually 50/50, or has it silently jammed?
- **Mark:** dot plot — one dot per participant. **x:** that participant's realised proportion of `S1` sessions. **y:** participant, ordinal. **Reference:** 0.5, with a binomial 95% band that narrows as that participant's session count grows.
- **A second, identical panel for the prime placement (`P1`/`P2`).**
- **Why this earns a screen:** a broken within-participant randomiser is a silent study-killer. It produces plausible data, breaks no test, and destroys M2 and the prime-condition analysis simultaneously. Nobody notices until the analysis. Two dot plots catch it in week two.

**Operational quantities by arm label.** Enrolment, retention, non-usage attrition, data completeness, and session-count distribution, split A vs B. These are *feasibility* quantities, not outcomes: knowing that arm B has worse data completeness tells you to chase a device bug, not which arm won.

**Colour rule:** arms use categorical slots 1 and 2 (blue, orange) — **identity hues, never the status palette**. Painting arm A green and arm B red would encode a verdict into an unlabelled comparison, which is the exact failure the blinding exists to prevent.

### 12.3 What the screen does not show, and the mechanism

| Withheld | Mechanism |
|---|---|
| What A and B *mean* | `researcher` has no grant on `study.arm_key`. The mapping exists in one table with one grant, to the trial statistician. |
| Any **outcome** split by arm — probe accuracy, learning curve, words spoken, `attained_rung` | The by-arm outcome views do not exist as a permission until data lock (§12.4). |
| **Adverse-event rate split by arm** | See §12.5 — this one is genuinely hard and it goes somewhere else. |
| An arm filter on any other screen | Not built. Filtering the whole console by arm is an outcome comparison with extra steps. |

### 12.4 Unblinding is a database event

```
study.analysis_locked_at  timestamptz null
```

While null: `research.outcome_by_arm_*` views are not granted to any role. When set — after the pre-registered statistical analysis plan is registered and the database is locked — the grant is issued, and the console's Arms screen grows an "Outcomes by arm" section that did not previously exist as a permission.

Setting `analysis_locked_at` requires a migration and a `contract:`-prefixed commit under ADR §6.2's human-review rule. Unblinding therefore leaves a git commit, a migration, a timestamp and a reviewer. That is the whole mechanism, and it is stronger than any amount of UI discipline because it cannot be reached by clicking.

### 12.5 The safety–blinding collision, resolved

Safety monitoring genuinely needs to know whether harm concentrates in one arm. Blinding genuinely needs the analyst not to know. Both are right, and the honest resolution is that **they are different people**.

- The **console shows the adverse-event register arm-blind**, to everyone, always.
- A separate **DSMB export**, produced by the same job under a different grant, ships the register split by arm label *plus the key*, to the named clinical advisor (S2) and the independent safety reviewer — who are not the analysts.
- The stopping rule is pre-registered, is theirs to apply, and its application is logged as a study event visible to everyone. The team learns *that* the safety reviewer looked, never *what they saw*.

This adds no new UI and no new role: S2 already names an independent clinical reviewer and §8.2 already makes early stopping the console's purpose. It adds one export target and one recipient.

---

## 13. SCREEN 8 — DATA & EXPORT

Answers: *is this dataset going to be analysable, and can I get it?*

**C-22 · Completeness heatmap**
- **Question:** which field groups are quietly failing to arrive, and since when?
- **Mark:** heatmap grid, 2px surface gaps between cells. **x:** study week. **y:** field group (interaction timing · hesitation dynamics · scheduling state · speech features · session check-ins · clinician assessments · medication & comorbidity · consent events · adverse events).
- **Colour:** sequential, one hue, light→dark = proportion of *expected* rows present. Legend with a scale; a table twin gives the numbers.
- **Never rainbow, never diverging** — completeness has a floor and a ceiling and no meaningful midpoint.
- **The word "expected" is doing all the work** and the definition is printed on the card: expected rows are derived from the session plan and the participant's consent flags, so a withheld speech block reads as `withheld` (a distinct hatched state), not as `missing`.

**C-23 · Event-sequence gaps**
- **Question:** did we lose telemetry, and where?
- **Mark:** column chart. **x:** study week. **y:** count of detected `seq` gaps, split by device.
- **Why this exists:** ADR §4.3 property 4 — *"a researcher can distinguish 'the patient did not respond' from 'we lost the event'."* That property is a promise made by the architecture; this chart is the only place it is ever checked. Without it the promise is untested for the life of the pilot.

**C-24 · Version timeline**
- **Question:** is my cohort homogeneous, or am I analysing two studies?
- **Mark:** Gantt-style horizontal bars — one row per version string, spanning the study days on which it was in force, with the participant count carried at each span.
- **y:** version string, grouped by the four version axes (`app_version`, `scheduler_algorithm_version`, `content_set_version`, `scoring_rubric_version`) plus `patient_ui_version`.
- **A vertical rule marks any day on which a scheduler or rubric version changed**, because a cohort split across two scheduler versions must be analysed as two cohorts or as a covariate, and that decision must be made before the analysis rather than discovered in it.

**T-04 · Export log.** One row per export run: `export_id`, `generated_at`, study day covered, recipient, row counts per file, bundle sha256, codebook version, schema version, source commit sha, requester, REC reference. Immutable. Every published number in every paper is recoverable to the exact bytes it came from.

**Request an export.** `investigator` only. Inserts a row into `export_request`; the job runs asynchronously and delivers out-of-band. The browser never streams the corpus. **Codebook viewer** and a **codebook diff between versions** sit beside it, because a variable whose derivation changed between v6 and v7 is the single most common way a longitudinal analysis silently breaks.

---

## 14. THE EXPORT

This is Surface A, it *ships in full*, and it is the load-bearing deliverable.

### 14.1 Shape

**Not a UI.** A versioned, scheduled job. Weekly during collection, plus on-demand at lock and at publication. Output is an immutable bundle, hashed, logged, and delivered to a named investigator under REC/IRB approval (B5) and a DPA.

Alongside it, per `outcome-measures-and-data.md` #280: a **read-only, token-scoped REST endpoint** over the same `research.*` views for longitudinal pulls, so nobody re-downloads the corpus weekly. Same missing grants, same suppression rules, same codebook.

### 14.2 Bundle contents

```
pilot01_export_v7_day084/
  README.md                        ← P24 label, DMSP statement, citation, DUA summary
  CHANGELOG.md                     ← what changed since v6, per variable
  manifest.json                    ← ids, hashes, row counts, coarsening record, source commit
  codebook.csv                     ← the enforcement artefact (§14.4)

  interaction.csv        (+ .parquet)   one row per item presentation
  session.csv                           one row per session
  participant.csv                       one row per participant
  medication_and_comorbidity.csv        recorded at enrolment and on change
  clinician_assessment.csv              externally administered, NACC-UDS-aligned names
  adverse_event.csv                     coded only, no narrative
  consent_event.csv
  probe_item.csv                        the generic probe registry — ordinals, no stimuli
  randomisation.csv                     participant_code, arm_label, allocation ordinal, stratum
  study_meta.csv                        versions in force by study day
  derived_variables.csv                 long: participant × variable × value × method_version

  examples/load_and_recompute.R
  examples/load_and_recompute.py
```

**Tidy long format, one file per table**, because that is what actually gets loaded into R and Python and what makes a repository deposit reusable. Parquet is a *mirror* of the one large table, never the only copy — a bundle that requires a library to open is a bundle a reviewer cannot check.

`examples/` recomputes every derived variable from the raw tables and asserts equality with `derived_variables.csv`. It is the highest-leverage single artefact for adoption and it doubles as a regression test on the derivation layer: if the notebook stops reproducing the derived file, a derivation changed without a version bump.

### 14.3 Field set

Exactly §7 of the synthesis, with these deltas, each justified:

| Delta | Reason |
|---|---|
| `self_rated_confidence` — **absent** | Already removed by §7. P4 forbids it existing at all. |
| `narrative` free text — **absent**; `narrative_coded` is the tuple of §9.2 | Closes the largest re-identification hole in the spec. |
| `response_text_hash` — **salted per study and per item**: `sha256(study_salt ‖ item_id ‖ normalise(response))`, salt never exported | Preserves within-item repeat detection ("did she give the same wrong answer twice") and destroys cross-item linkage and dictionary attack. |
| `server_anchored_at` — **absent**; replaced by `day_offset_from_enrollment` + `within_session_ms_from_start` + `time_of_day_bucket` | ADR §4.3 exposes a real timestamp to researcher views. ND-18 and P21 forbid it. See §17.1. |
| `site_id` — **absent** | day_offset plus site re-links a participant to their enrolment day at a small site. If site stratification is pre-registered it ships as a separate site-level file under the DPA. |
| `speech_features_withheld` (bool) — **added** | §4.4. Makes withheld distinguishable from absent. |
| `probe_disabled_from_day` (int, nullable) — **added** | Makes probe-disabling analysable as a competing risk rather than as missingness. |
| `dementia_subtype` realised levels exclude PCA and svPPA | They are excluded at enrolment by P26/ND-35, so the levels are AD / DLB / vascular / FTD-behavioural / mixed / MCI-unspecified. |

### 14.4 The codebook is the enforcement mechanism

`codebook.csv` columns:

`table · variable · label · type · units · permissible_values · derivation · plane · preregistered_analysis · added_in_version · deprecated_in_version · withheld_if`

`preregistered_analysis` is **NOT NULL** and holds a protocol section reference. This operationalises §8.4.1 — *every §7 field carries a named pre-registered analysis in the protocol, or it does not ship* — as one column and one CI check:

> **The export job fails if any column present in any exported file lacks a codebook row with a non-empty `preregistered_analysis`.**

"Collect everything and decide later" is the posture GDPR purpose-limitation exists to forbid and the first thing a full-board REC will cut. A rule that lives in a build gate survives contact with a deadline; a rule that lives in a document does not.

### 14.5 De-identification guarantees, as testable invariants

Each one states the *mechanism*, not the intention, and each has a test. Promises are not guarantees; missing grants and failing builds are.

| # | Invariant | Mechanism | Test |
|---|---|---|---|
| 1 | No real date, timestamp or datetime leaves the research plane | No `date`/`timestamp`/`timestamptz` column exists in any `research.*` view except `manifest.generated_at`, which describes the export, not a person | Schema assertion over `information_schema.columns`, in CI |
| 2 | No free text, in any table, at any length | Every text column in `research.*` is a declared enum or a controlled-vocabulary array | Type assertion in CI; a `text` column in a research view fails the build |
| 3 | No photograph, audio, waveform or media path | The export role has **no grant** on `content.*` or `storage.objects`; the schema has no `bytea` and no storage-reference column | Negative RLS test in `policies.ts`; schema assertion |
| 4 | No transcript, ever, in any form including hashed | ASR output is never persisted outside the content plane; there is no column to hold it | Schema assertion; §8.4.2 |
| 5 | No name, of a participant or of anyone in a photograph | `participant_code` is a random opaque token; `identity.participant_map` has no grant to any research role; item names never enter the research plane | Negative RLS test |
| 6 | Quasi-identifier cells below k=5 are coarsened before export | `age_band × dementia_subtype × country_locale × first_language × years_education_band` is cross-tabbed; the rarest dimension of any sub-5 cell is coarsened, and the coarsening is recorded in `manifest.json` | Export-job assertion; the manifest records what was coarsened so an analyst is never silently misled about resolution |
| 7 | Withheld ≠ missing | `speech_features_withheld`, `probe_disabled_from_day`, `session_end_reason`, `caregiver_present_source` | Codebook `withheld_if` column; example notebook asserts the distinction survives a round trip |
| 8 | Every export is immutable, hashed and attributable | `export_log` row per run; re-running produces a new `export_id` and never mutates a prior bundle | Log table is append-only by grant |
| 9 | Speech features are independently removable at the participant's request | Consent flag governs the column class at export time, retrospectively across all historical rows | Integration test: flipping the flag re-exports historical rows with the block withheld |

**Invariant 4 restated, because it is the one that will be argued about:** P27 forbids ASR for grading and is silent on ASR for feature extraction. §8.4.2 closes that gap deliberately: *a transcript of a person narrating their family is the most re-identifying artefact in the system*. Speech **features** cross the plane; words never do. And per §8.4.3, if the feature layer cannot survive being described honestly to the person it is collected from, it does not run.

---

## 15. THE CHART SYSTEM

### 15.1 Surfaces and ink

The researcher surface consumes the same tokens as the rest of the product (ADR §7: `src/ui/tokens.css`, the same values as `tokens.ts`), so it reads as the same product — a warm neutral ground, not a cold blue-grey SaaS dashboard.

| Role | Light | Dark |
|---|---|---|
| Page plane | `#F2EDE4` | `#211D19` |
| Chart surface / card | `#FBF9F5` | `#2A2521` |
| Primary ink | `#171310` | `#F5F1EA` |
| Secondary ink | `#5A534B` | `#C3BCB1` |
| Muted (axis, tick) | `#8A8177` | `#8A8177` |
| Gridline (hairline) | `#E4DED2` | `#332E29` |
| Baseline / axis | `#C9C1B4` | `#3E3832` |
| Hairline ring | `rgba(23,19,16,0.10)` | `rgba(245,241,234,0.10)` |

`#211D19` is THE LEAF from the patient surface. The two surfaces share a ground and share nothing else, which is the correct amount of family resemblance between a photograph album and an instrument panel.

### 15.2 Palettes — validated, not eyeballed

Categorical (identity: arms, series, composition bands), in fixed slot order, **never cycled**:

| Slot | Hue | Light | Dark |
|---|---|---|---|
| 1 | blue | `#2a78d6` | `#3987e5` |
| 2 | orange | `#eb6834` | `#d95926` |
| 3 | aqua | `#1baf7a` | `#199e70` |
| 4 | yellow | `#eda100` | `#c98500` |

Validated against these surfaces, not against a generic white:

```
light  #FBF9F5, 4 slots  → lightness PASS · chroma PASS · CVD 9.1 PASS · normal-vision 22.9 PASS
                            contrast WARN (#1baf7a 2.68, #eda100 2.06) → relief rule applies
dark   #2A2521, 4 slots  → all five checks PASS (CVD 8.4, normal-vision 19.8, contrast ≥3:1)
all-pairs forms, 3 slots → PASS in both modes (light CVD 9.2 / dark 9.4)
```

The light-mode contrast WARN is **not dismissable**: it obligates visible direct labels or a table view on every chart using slots 3 and 4 on the light surface. Both are mandatory here anyway (§15.4), so the obligation is already discharged — but it is recorded so a future palette change re-triggers it.

- **Sequential** (magnitude: completeness heatmap, funnel stages, ordinal bands): one hue, blue, light→dark, steps 250→650. Ordinal ramps start no lighter than step 250 on light and no darker than step 600 on dark.
- **Diverging** (deviation from a target): blue ↔ red with a neutral gray midpoint. Used on exactly one thing — deviation of realised randomiser proportion from 0.5 — because a hue at the midpoint would make "correctly balanced" look like a value rather than like nothing.
- **Status** (MET / NOT MET / INSUFFICIENT DATA / AWAITING ENDPOINT, and adverse-event severity): the reserved status palette, `good #0ca30c` · `warning #fab219` · `serious #ec835a` · `critical #d03b3b`. **Reserved means reserved:** never used for a series, and always paired with a glyph and a word.
- **Arms are categorical, never status.** Stated twice on purpose (§12.2).
- **Scatter, small multiples and any all-pairs form cap at three series.** Past three: fold to "Other" or facet. Never a generated ninth hue.

### 15.3 Marks

Thin marks; 2px lines; ≥8px markers with a 2px surface ring where they overlap; 4px rounded data-ends on bars, anchored square to the baseline; 2px surface gaps between stacked segments and adjacent bars; hairline solid gridlines one shade off the surface; **no dashed rules anywhere** — dashing reads as "projection" or "threshold" and both meanings are load-bearing elsewhere on this surface, so the channel is kept clean and reference lines are distinguished by colour and a direct label instead.

Direct labels are **selective**: line endpoints, the extreme, the one series that matters. Never a number on every point. Values live in the axis, the tooltip and the table twin.

Text wears text tokens, never the series colour. A coloured mark sits beside a label; the label itself is ink.

### 15.4 Every chart has a table twin

Not a fallback — a peer. A `[table]` toggle in every card header swaps the SVG for a real `<table>` with the same numbers, copyable and screen-reader-navigable. Three reasons: it discharges the light-mode contrast relief rule; it is the WCAG-clean equivalent for any encoding; and — the practical one — **a researcher copying a number into a paper should copy it from a table, not read it off a pixel.**

Colour is never the sole channel anywhere: composition bands carry direct labels, status carries a glyph and a word, session-strip states carry a glyph.

### 15.5 Interaction

Crosshair plus tooltip on every line and area chart; per-mark tooltip on every bar, dot and heatmap cell; hit areas ≥24px including the 2px gap; keyboard focus shows exactly what hover shows. Tooltips **enhance and never gate** — every value is reachable from the axis, a direct label, or the table twin.

Refetch holds the previous render at reduced opacity. No skeleton flash, no layout jump — a dashboard that jumps while you are reading a number is a dashboard whose numbers get misquoted.

One filter row above everything it scopes. No per-chart filters. No filters inside a card.

### 15.6 Density, and where it breaks

At n = 24–60 participants: the cohort table is exhaustive and unpaginated; the distress caterpillar has one row per participant on one screen; the randomiser dot plots have one dot per participant.

Past ~300 participants those three forms fail. The stated migration: the caterpillar becomes a histogram of rates with the top-10 outliers tabulated beneath; the dot plots become a density strip with a binomial envelope; the cohort table paginates. This is written down so that scaling is a known switch rather than a rediscovered surprise — but v1 does not build it, because a pilot that reaches 300 participants has succeeded beyond every number in §8.

### 15.7 What this surface deliberately does NOT inherit from the patient surface

| Patient rule | Here | Why |
|---|---|---|
| 88pt touch targets | 24–32px controls | Mouse and keyboard. The evidence is about 80-year-old fingers on glass. |
| 32–48pt type | 13–15px body, 11px axis ticks | The evidence is AD contrast-sensitivity loss at high spatial frequencies. It is not about researchers. |
| 7:1 contrast (WCAG AAA) | 4.5:1 (AA) for text, 3:1 for non-text | AAA here would cost density and buy nothing evidenced. AA is not a relaxation; it is the correct standard for this user. |
| No navigation chrome, one action per screen | Tabs, filters, sortable tables, many actions | The researcher is a different user with different capabilities (HCI implication 13, explicitly). |
| No transition under 300ms | 0ms — instant state changes only | The 300ms floor exists so a screen change is not perceived as a flicker by someone with fluctuating attention. Here, instant is correct and animation is noise. |
| No user-facing theme control | Light/dark toggle, respecting `prefers-color-scheme` | P10 freezes the *patient* UI. Nothing freezes this one. |

Copying the patient rules here would be cargo cult, and the resulting surface would be worse at its job while being no safer for anyone.

---

## 16. IMPLEMENTATION

### 16.1 What it is made of

Per ADR §7 and §9: `app/(researcher)/**` is **`.web.tsx` only**, enforced by ESLint. Plain DOM, real `<table>`, real `<svg>`, `recharts@^3.10.1`, plain CSS consuming `src/ui/tokens.css`. No component library. `@tanstack/react-query` for fetching (researcher and caregiver only; the patient surface must not import it).

The researcher bundle carries the react-native-web baseline (~300–450 KB gz) because the root layout is RN. Accepted in ADR §2.4: it is an internal desktop dashboard behind a login.

### 16.2 Recharts, and the three places it is not used

Recharts renders: lines, areas, stacked areas, columns, bars, dot plots, reference lines, CI ribbons (`<Area>` over a band), tooltips, legends. That is C-01 through C-15, C-17, C-18, C-19, C-20, C-21, C-23.

Hand-written SVG, ~40–90 lines each, for three:

- **The session strip (§11.2)** — a run of `<rect>`s with glyph overlays. A chart library models this as a chart; it is a calendar-free state strip and Recharts would fight it.
- **The completeness heatmap (C-22)** — a grid of `<rect>`s. Recharts has no heatmap primitive and simulating one with a stacked bar is the kind of cleverness that breaks on the next minor version.
- **The version timeline (C-24)** — Gantt spans. Same reasoning.

Three small components, each with a table twin, each testable through `testids.ts`.

### 16.3 Data path

The console reads a **materialised nightly snapshot** (§5.5) exposed as `research.*` views through PostgREST. No aggregation in the browser: every chart's series arrives pre-aggregated with its `n` and its interval, so the number on screen and the number in the export are computed by the same SQL. A percentage computed twice, in two languages, is a percentage that will eventually disagree with itself in a meeting.

Small-cell suppression and the k=5 floor are applied **in the view**, not in the component. A suppression rule in a React component is one refactor away from being gone.

### 16.4 Testing

- Every interactive element and every chart card carries a `testids.ts` const, so Playwright selectors and implementation cannot drift (ADR §6.1).
- The blind RLS suite gets one `policies.ts` row per missing grant in §4.3, asserted **negatively** — `{ role: 'researcher', table: 'identity.participant_map', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' }` and its three siblings.
- The de-identification invariants of §14.5 are CI assertions over `information_schema`, not unit tests over a function — a schema assertion cannot be routed around by a new code path.
- Playwright E2E covers: filter scoping across all charts on a screen, small-cell suppression firing, the outcome-toggle writing an access-log row, and the absence of `research.outcome_by_arm_*` before lock.
- Every chart's table twin is asserted to contain the same values as the chart's data prop. That single test is what makes the table twin trustworthy rather than decorative.

---

## 17. REQUIRED AMENDMENTS TO OTHER DOCUMENTS

Three, each small, each blocking.

### 17.1 ADR §4.3 — `server_anchored_at` must not reach the research plane

ADR §4.3 says: *"Researcher views expose only `server_anchored_at`."* That is a real timestamp on a real participant's real activity, and ND-18 and P21 forbid it. The clock-reconciliation design is right and stays; only the exposure changes.

> **Amendment:** `server_anchored_at` is used server-side to order events and to compute `day_offset_from_enrollment`, `within_session_ms_from_start` and `time_of_day_bucket`. The research views expose those three derived fields and no timestamp. The invariant of §14.5 #1 is asserted in CI.

Cost: one view definition. The ADR's actual purpose — that a three-day-offline tablet's drifted clock does not silently corrupt the study — is fully preserved.

### 17.2 §7's `narrative_coded` must be defined before the schema is written

Per §9.2: a tuple of three enums plus ≤3 controlled-vocabulary tags. There is no free-text column in the research plane's adverse-event table. Undefined, this field is the largest re-identification hole in an otherwise careful specification.

### 17.3 The codebook's `preregistered_analysis` column is a build gate, not documentation

Per §14.4. §8.4.1 says every field carries a named pre-registered analysis *or it does not ship*. That sentence needs an enforcement point or it is an aspiration; the export job's failure on a null value is that point.

---

## 18. §9 NEVER-DO AUDIT FOR THIS SURFACE

| # | Never-do | Where it is held |
|---|---|---|
| 5 | No score/chart/streak shown to the **patient** | Nothing on this surface is reachable from a patient device. Separate role, separate auth, separate route group. |
| 13 | Never correct the patient about factual reality | No patient-facing output exists here. |
| 18 | Never export a real date, full-face photo, voice recording or real name | §14.5 invariants 1–5, each a missing grant or a schema assertion. §17.1 fixes the one place the ADR breached it. |
| 19 | Never build an automated abuse or neglect detection classifier | Nothing on this surface classifies a caregiver. Carer burden is an *outcome measured by instrument* (NPI-Q distress, ZBI, S5), never an inference from telemetry. |
| 20 | Never implement covert monitoring; nothing observable by the caregiver may be undisclosed to the patient | This surface is observable by the **researcher**, not the caregiver — which is precisely P23's hole, closed by §8.4.3: the speech-feature layer is disclosed in plain words in the patient UI and the consent form and is separately removable (§4.4). |
| 22 | Never ship a caregiver-facing cognitive decline chart | No chart here is caregiver-reachable. The caregiver surface is a different route group with a different role. |
| 23 | Never ship a clinician-facing cognitive status, trajectory or progression-drift metric in v1 | §2.2's rendering rule; Surface C not built; §10.3's explicit list of what is exported but never drawn. |
| 24 | Never ship an onboarding "baseline assessment" that reads as a screen | The 7-day probe onboarding curve (C-17) is rendered **cohort-level only**, never as an individual baseline, and the enrolment screen (§9 of the frozen shape) is administered to the caregiver and referrer and produces an eligibility outcome and nothing else — no score reaches this surface. |
| 25 | Never embed MMSE or MoCA items | `clinician_assessment` **ingests** externally administered totals as numbers. No instrument item text exists anywhere in the codebase. |
| 36 | Never read a sudden collapse as progression without raising physical illness | §9.6. The only acute-change component in the product is the P25 notifier, its wording is physical-illness-only, and this surface renders its audit trail, not a judgement. |
| 40 | Never present a p<0.05 secondary outcome as proven, in either direction | Every proportion on this surface ships with an interval and an `n`; `INSUFFICIENT DATA` is a first-class criterion state; no p-value is rendered anywhere on this surface at all. |

---

## 19. OPEN DISAGREEMENTS I AM NOT PRETENDING TO HAVE SETTLED

**19.1 The rendering rule is a line drawn with judgement, and a regulator could draw it elsewhere.**
I hold that a raw telemetry row read by an investigator under REC approval is *data access*, while a rendered trajectory is *an interpretation the product authored* — and that MDR Rule 11 and the MHRA example are about the latter. A reviewer could reasonably say the distinction is cosmetic, that the corpus of rows plus a spreadsheet is the same artefact as the chart, and that intended use is assessed objectively from what the software makes easy. If that reading wins, the fallback is cheap and should be pre-costed: **remove the outcome-toggle from §11.4 entirely and make raw response fields export-only.** One `<details>` element and one access-log insert are deleted; nothing else in the design moves. B1's written regulatory opinion should be scoped to include this question, not only to P25.

**19.2 C-18 is the closest thing on this surface to the forbidden object.**
A cohort-mean accuracy line across twelve weeks of a fixed instrument, in a progressive illness, is *shaped* like a decline curve even though it is a property of an instrument in a research population. I have given it every guardrail I can think of (§10.1) and I still think it is the one chart a hostile reviewer would point at first. The honest alternative is to cut it from the console and leave the weekly recurrence to the offline analysis. I have kept it because the composition panel beside it is the only place the shrinking, non-randomly-shrinking denominator is visible, and shipping M1 blind to its own denominator is a worse failure. **This should go to B1 and to the REC as a named question, not as an assumption.**

**19.3 Adherence is partly an outcome measure of the disease, not of the product.**
§1.9 names apathy as the most prevalent neuropsychiatric symptom and a direct disease-caused predictor of not initiating any activity, and §12.1 of the frozen shape names it as the likely binding constraint on F2. Every adherence chart on Screen 2 therefore measures a mixture of product quality and disease severity, and the console cannot separate them. `apathy_score` (NPI-Q item) is in `participant` for exactly this reason and the pre-registered analysis should stratify on it — but a stratified analysis is not a chart, and a researcher reading C-07 without §1.9 in mind will over-attribute a falling line to the product. **I have not found a way to render that caveat that does not read as an excuse**, and a caption is a weak instrument against a strong-looking line.

**19.4 The nightly snapshot trades safety latency for reproducibility, and I have split the difference by hand.**
Adverse events stream within 60 seconds; everything else is up to 24 hours stale. The split is a judgement about which numbers are decisions and which are context. A DSMB might reasonably want the distress *rate* live too, and the cost of that is that two people quoting the same rate in the same meeting can disagree. I have chosen reproducibility for rates and immediacy for events, and I can defend it, but it is a choice and not a derivation.

**19.5 Three roles may be one role too many for a pilot of this size.**
`researcher` / `safety_reviewer` / `investigator` are all named in the governing documents, so I am not inventing them — but in a 30-dyad pilot run by four people, role separation that exists only in the database and not in the building is theatre with a maintenance cost. The separation is worth keeping **only if the named clinical advisor is genuinely independent of the analysts**, which is an operational commitment the protocol has to make and which I cannot make on its behalf. If S2's independent reviewer turns out to be the PI, §12.5's blinding resolution collapses and should be replaced by an explicit "this pilot is unblinded for safety" statement in the protocol rather than by a role that pretends otherwise.

**19.6 Nothing here has been shown to a researcher.**
B6 requires a PPI panel before the mechanic freeze. There is no equivalent obligation for this surface and there probably should be: this design is derived from the corpus's own statement that it *"did not find empirical studies of researcher tool preference"* and that its consumption ranking is *"reasoned judgement rather than evidence."* The load-bearing deliverable — the tidy CSV bundle and the example notebook — is the part I am confident about, because that recommendation rests on FAIR/NIH requirements and standard practice. The eight screens are the part I would show to two working dementia trialists before building, and I would expect to lose at least one screen.
