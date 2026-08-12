# 00 — MODULE MANIFEST (FROZEN DECOMPOSITION)

**Status:** Frozen by the presiding engineer, 2026-08-12. Binding on every build agent.
**Purpose:** the definitive list of modules, their contracts, their dependencies and their build waves. A module contract here is written so that (a) a blind test-writer who sees only this contract and the named spec sections can write a complete failing test suite, and (b) a blind implementer who sees only this contract and the named spec sections — and never the tests — can implement it correctly first time.

**Binding sources, in precedence order.** Where two disagree, the higher wins, except where §2 records an explicit adjudication.

| # | Document | Wins on |
|---|---|---|
| 1 | `docs/research/00-SYNTHESIS.md` | evidence, safety, principles P1–P32, telemetry §7, criteria §8, NEVER DO §9 |
| 2 | `docs/design/00-V1-PRODUCT-SHAPE.md` | scope — the six mechanics, the walkthrough, enrolment screening |
| 3 | `docs/design/00-DESIGN-SYSTEM.md` | anything rendered |
| 4 | `docs/design/00-SCHEDULER-SPEC.md` | anything folded |
| 5 | `docs/architecture/00-ADR-PLATFORM.md` | anything stored or transmitted (stack, auth, offline) |
| 6 | `docs/architecture/00-ADR-DATA.md` | anything stored or transmitted (schema, RLS, planes) |

`docs/design/surface-caregiver.md` and `docs/design/surface-researcher.md` are **ADVISORY, not binding** (both are marked "Not frozen"). No module in this manifest is sourced from them. An implementer may read them for detail; where they conflict with the six above, the six win. If they are frozen later they refine U08–U14 without changing a contract.

---

## 1. THE SHAPE OF THE DECOMPOSITION

**136 modules in six layers.** Granularity is set **inversely to the cost of a defect**, not uniformly:

- **Safety- and privacy-critical** code is split down to one decidable rule per module, each with a named exhaustive fixture or total decision table: the scheduler fold (25 modules), the foil chooser, the payload firewall, the ingest canonicaliser, the research projector, the erasure orchestrator, the RLS/grant layer. A defect here is an adverse event, a confidentiality incident, or a corrupted study.
- **Contract** is split by *reader set*, because the point of freezing is that a change to one frozen literal must not force a re-freeze of the others.
- **Presentational** code stays coarse: a defect is visible on first render and is caught by the conformance suite. The one exception is patient frame geometry, which carries 48 numeric assertions and is therefore its own module of constants with no logic.

**The atomicity test applied to every candidate split** was not "is this small enough?" but: *can an agent handed only this contract and the named spec section produce a correct implementation, and can a second agent handed only the same thing write a test that passes for the right reason?* Where the answer was no because the unit was too large, it was split at a seam the specification itself draws. Where the answer was no because the unit was too small to be meaningful alone, it was merged.

---

## 2. ADJUDICATIONS, DECLARED DEVIATIONS AND RAISED DEFECTS

Everything in this section changes what gets built. Each is stated here rather than absorbed into a module description. Items marked **`contract:`** require a `contract:`-prefixed commit and explicit human review before Wave 1 closes (ADR-PLATFORM §6.2).

### 2.1 Adjudications of the MASTER-SPEC §10 open contradictions

| # | Conflict | Adjudication | Rule applied |
|---|---|---|---|
| **C-1** | Global drift term: PRODUCT-SHAPE §8.3 removes it; SCHEDULER-SPEC §14 implements it | **ESCALATED, NOT DECIDED.** SCHEDULER-SPEC §14 is implemented exactly as frozen, and the blast radius is isolated so the amendment costs one wave if it wins. See §2.5. | none resolves it — MASTER-SPEC §10 says stop and escalate |
| **C-2** | Probe cue level: SCHEDULER-SPEC §16 "opens at cue level 0" vs DESIGN-SYSTEM §8.7 two-picture 2AFC | **DESIGN-SYSTEM wins outright.** The probe emits **no scheduler event** (§16), so nothing about it is folded. It is a 2AFC recognition trial: `opening_cue_level: 2`, `presentation_mode: 'recognition'`, `n_distractors: 1`, `correct` recorded on the first uncued attempt, then rescue at cue 3 to `rescued_to_success: true`. Owner: R07. The M3 re-specification (§8.7's seam) is a protocol item, not an engineering one. | design system wins on anything rendered |
| **C-3** | `session_end_reason`: frozen 7-member scheduler union vs amendment A6's four extra values | **Two fields, no lossy mapping, and the frozen union is untouched.** `SessionEnded.reason` carries the scheduler's own `SessionEndReason` (what the fold sees). The telemetry row carries `session_end_reason: RuntimeEndReason`, a distinct 12-member union (§2.3). A38 asserts the telemetry field. Owners: C01 (the union), R06 (the resolver), T06 (the row). | both preserved; neither amended |
| **C-4** | `app/(patient)/roster.tsx` in ADR-PLATFORM §9 vs DESIGN-SYSTEM §8.9 | **DESIGN-SYSTEM wins.** `app/(patient)/roster.tsx` is **not built**. U07 (`app/(staff)/handover`) replaces it. ADR-PLATFORM §9's repo layout is amended in the same `contract:` commit. | design system wins on anything rendered |
| **C-5** | Nothing Today replaces steps 4–8 / 4–7 / 5–8 | **§9.2's 5–8 is correct and A5's "4–7" is the typo.** Steps 5, 6, 7, 8 (month target, camp block, probe, interview) are replaced by six M-02 cards. Steps 2, 3, 4, 9, 10, 11 are unchanged, which is what makes A5's "the song always plays" true on both prime placements. Owner: R01. | internal consistency of the winning document |
| **C-6** | Interview copy: "I love this one" vs "Tell me about this one." | **DESIGN-SYSTEM §7.2 wins.** The banned sentence is absent from C13's table, so it is unrenderable. | design system wins on anything rendered |
| **C-7** | 6–10 cards vs the dwell budget's 6 (standard) / 5 (long) | **No conflict in the fold.** `planRoster` plans up to 8; the runtime presents 6 or 5; unpresented roster entries have `trialsThisSession === 0` and age via §12.2 S4. Owners: S12 (plan), R01 (present count). | each document governs its own layer |
| **C-8** | `endedOnSuccess=false` on distress vs A39's "100% of paths" | **A39 is restated, and the restatement is the contract.** See §2.4. | reconciliation stated rather than assumed |
| **C-9** | Proverb microphone | **DESIGN-SYSTEM §8.4 wins:** microphone open, features only, no waveform persisted. | design system wins on anything rendered |

### 2.2 Declared deviations requiring `contract:` review

**D-1 — `src/contract/schema.ts` is the scheduler's four frozen literals; the zod boundary schemas move to `src/contract/wire/`.**
SCHEDULER-SPEC §21.2 names `src/contract/schema.ts` literally and invariant I-9 is asserted against exactly those four exports. ADR-PLATFORM §6.1 assigns the same filename to the zod layer. Both cannot hold. The frozen spec keeps the filename it names; the zod layer becomes `src/contract/wire/{envelope,payloads,api}.ts`. ADR-PLATFORM §6.1's file list is amended in the same commit. Nothing is lost and I-9 stops contradicting the ADR.

**D-2 — the device reconstructs the eight server-written scheduler events locally; the server's fold is canonical.**
ADR-PLATFORM §4.4 requires the device to pick the next card offline, §4.2 forbids storing scheduler state, and ADR-DATA §13 denies the device any read on `log.event_log`. Nothing in any governing document supplies the device with `ItemAdded`, `ItemTierSet`, `ItemRecognitionBlockSet`, `ItemContentReadyChanged`, `ItemRetired`, `ItemReEnabled`, `ProbeDisabledSet` or `AcuteSignalDelivered`. Without them the device cannot fold and the patient session cannot run.

> **The device derives those events from the `device.device_content` / `device.device_roster` pull, into a local append-only journal (`sched_journal`), stamped `deviceId = '00000000-0000-0000-0000-000000000000'` (ADR-DATA §6.6's server device id, which sorts first under `strAsc`), `anchorMs = pull.server_time_ms`, and a locally assigned monotone `seq`. The device folds `sched_journal ∪ outbox(scheduler types)` in canonical order. The server folds `log.event_log`.**

The divergence is **confined to selection and bounded by one sync interval**, and it cannot corrupt state: `openingCueLevel`, `floorCueLevel` and `trialClass` are trusted payload facts recorded by the presenter (SCHEDULER-SPEC §5.1 note 4), so whatever the device chose to present, the server folds the same transition from the same payload. Only `dueAtMs` and roster *ordering* can differ, and only by the timestamp the device assigned to a server fact. `proj.scheduler_state` (the server fold) is authoritative and is what the research plane reads. Owner: **T08**.

**D-3 — no waveform is persisted from the patient surface in v1.**
DESIGN-SYSTEM §8.4 already requires features-only for M-35. ADR-DATA §12.5 gives the device **no grant and no policy on `storage.objects`**, so a patient device cannot upload media by any route the design permits. M-43 (The Legacy Recording) was cut in PRODUCT-SHAPE §6. Therefore the interview (M-40) yields VAD activity and the §7 prosodic feature block only; `Recorder` is a **caregiver-surface port**, absent from the patient runtime. Cost, named: M-40 produces no artefact, and P31's contributing role is delivered by the act of telling the story rather than by a saved file. This deletes an upload path, a release chain, a retention schedule and a DPIA data-subject class from v1.

**D-4 — `device.device_roster` is widened with the per-participant runtime configuration.**
ADR-PLATFORM §5.2 budgets exactly two device views and ADR-DATA §12.2 lists `device_roster`'s columns. The device provably needs the five per-participant `SchedulerConfig` fields (SCHEDULER-SPEC §2.1), the four frozen enrolment parameters (DESIGN-SYSTEM §10), the content-set version, the P17 blocklists, and enough to choose a song decade and an era ordering. Adding a third view is forbidden; widening one existing view adds no grant.

`device_roster` gains: `music_decade`, `bump_decade`, `content_language`, `content_set_version`, `probe_ordinals smallint[]`, `probe_disabled`, `acute_signal_enabled`, `within_start_rung`, `params_version`, `tz_offset_minutes`, `session_order_variant`, `rung_dwell_step`, `patient_type_step`, `audio_output`, `fluctuation_band`, `era_blocklist`, `theme_blocklist`.
**`birth_year` is deliberately NOT shipped** — `music_decade` and `bump_decade` are the banded forms, so ADR-PLATFORM §5.3's "a thief learns that N people live somewhere, not who, where or with what condition" survives intact. Owner: **B14**.

**D-5 — the foil is chosen by SCHEDULER-SPEC §9.5's deterministic index, not by DESIGN-SYSTEM §8.5.3's `shuffle`.**
§9.5 states "Zero `Rng` calls"; I-11 requires purity; A39's exhaustion requires an enumerable state space; a shuffled foil makes all three impossible. §8.5.3's binding content is its **filter set and its fail-closed rule**, not its pseudocode. The composition:
`foilFor` (S05) chooses deterministically from the same-tier, active, `contentReady`, non-`recognitionBlocked` pool — which already excludes deceased/estranged/do_not_show, because `recognitionBlocked` is set from `person_status`. The two filters the scheduler cannot model — the **48-hour `person_status` freshness gate** (§9.7) and **media readiness at render** — are applied by **R09** at presentation time; a foil that fails them yields `rung_ladder_variant = 'three_rung_no_foil'` and the trial opens at cue 3, which is exactly §9.1's existing empty-pool rewrite (E32). **A41 has one owner: R09.**

**D-6 — the §9.1 zero-input table and the §6.3 dwell floors are contract data, not domain constants.**
DESIGN-SYSTEM §4.1 places `patientTiming` in `src/ui/tokens.ts`, but `src/domain/**` may not depend on `src/ui/**` and the blind test-writer may read only `src/contract/**`. Both A38 and A43 are otherwise unwritable blind. The numbers therefore live in `src/contract/programme.ts` (**C14**) and `src/ui/tokens.ts` (**U01**) re-exports them, so §4.1's literal contents are satisfied with exactly one definition.

**D-7 — the closed patient vocabulary is contract data.**
Same argument: A33/A34/A35 assert against the §7.3 table, and a test-writer cannot read `src/domain/copy.ts`. The table, its per-string spoken duration, the §7.4 banned list and the §2.2 claim rules live in `src/contract/copy.ts` (**C13**). The render function is domain (**R08**).

**D-8 — spoken duration is per-string data, not a runtime syllable estimator.**
The patient vocabulary is closed and finite (A35), so every string's spoken duration is a literal on its C13 row. This deletes an entire class of divergence between two blind agents implementing a syllable counter, and makes the §9.1 totals a composition of literals.

**D-9 — `app.clinician_assessments` gains `subject_role`.**
S5 (carer anxiety, a Tier-1 criterion) has no data home in any governing document. One column — `subject_role text not null check (subject_role in ('patient','caregiver'))` — admits GHQ-28-anxiety and HADS-A without a second table. Owner: **B06**.

**D-10 — `app.devices` gains three install-record columns.**
A49–A52 are manual install checks whose *results* have no home. `ambient_lux_at_install int`, `display_nits int`, `install_checklist jsonb`. Owner: **B04**.

**D-11 — `probe.disabled_set` has a source row: `app.adverse_events.probe_disabled_as_result`.**
ADR-DATA §6.6 lists seven server-written trigger events but names source tables for only six. SYNTHESIS §5.2 point 5 and `app.adverse_events.probe_disabled_as_result` supply the seventh. One RPC (`app.disable_probe`) writes the adverse-event row; an AFTER trigger emits the event. Owners: **B15** (RPC), **B11** (trigger).

**D-12 — `proj.session.session_end_reason`'s CHECK list is replaced.**
ADR-DATA §11.2's list `('completed','user_ended','distress_stop','timeout','app_crash','device_failure','faded_to_rest','abandoned')` matches neither the scheduler union nor amendment A6, contains `timeout` which A40 asserts is unreachable, and lacks every budget reason. Replaced by the 12-member `RuntimeEndReason` union of §2.3. `faded_to_rest → completed`; `device_failure → battery_truncated | audio_unavailable`. Owner: **B13**.

### 2.3 `RuntimeEndReason` — the pinned 12-member union

```
'completed' | 'user_ended' | 'distress_stop' | 'abandoned' | 'app_crash'
| 'budget_time' | 'budget_trials' | 'roster_exhausted'
| 'battery_truncated' | 'audio_unavailable' | 'content_expired' | 'wrong_resident'
```

`'timeout'` is **absent by construction**, which makes A40 a type property and a schema property as well as a walk property. `'audio_unavailable'` is a member (amendment A6) but the session machine **never produces it**: DESIGN-SYSTEM §9.6 requires that audio loss never stops a session. R04's exhaustion asserts that no injected `audio_route_lost` input reaches any terminal state other than closedown.

### 2.4 A39, restated — the contract both agents build against

> **A39.** Over the full state space — every `session_mode`, every `session_order_variant`, every `rung_ladder_variant`, every `audio_output`, every `rung_dwell_step`, a stop-panel tap at every segment, a battery drop at every segment, an audio route loss at every segment, and a content-expired start — **every terminal state is `closedown`**. On every path containing no distress report, `ended_on_success === true`. A path containing a distress report terminates in `closedown` with `ended_on_success === false`, honestly, because SCHEDULER-SPEC §15.1 rank 3 beats rank 5 and playing a warm closer to someone who has just become distressed is P1 applied where it does harm.

This is the reconciliation MASTER-SPEC C-8 says is available only if the walked state space excludes distress closes. It is now stated. Owner: **R04**.

### 2.5 ESCALATION C-1 — the drift term, and its exact blast radius

PRODUCT-SHAPE §8.3 **removes** the trailing-14-day global difficulty step from the v1 runtime on MHRA Class IIa grounds; SCHEDULER-SPEC §14 **implements it in full** and reports requirement 10 "Satisfied". Both are frozen. The resolution rule does not resolve it. **This decision belongs to the principal and has regulatory teeth. It must be taken before Wave 3 opens.**

Until it is taken, SCHEDULER-SPEC §14 is built exactly as frozen. If the amendment wins, the deletion is:

| Delete | Where |
|---|---|
| `evaluateDrift` and its fixture | **S10** (whole module) |
| `participant.driftLevel` | C04 `ParticipantState` |
| `activeSession.driftAtStart` | C04 `ActiveSessionState` |
| the `driftLevel` argument and the `− driftLevel` term in `effectiveAcrossRung`, and the drift conjunct of `canVanish` | **S04** |
| `c = min(c + s.driftAtStart, 3)` | **S06** |
| `clamp(withinStartRung − driftAtStart, 0, 6)` → `withinStartRung` | **S16** |
| step S8, and `driftLevel` in step S10 | **S17** |
| `driftAdjustmentApplied` becomes constant 0 | **S22** |
| six `drift*` config fields | C02 (49 → 43 fields; `config.json` re-pinned) |
| `drift.json` | fixture manifest |

**One module deleted, two state fields, four clamp terms, six config fields.** No other module changes. That is the cost of the decision, and it is why drift is isolated rather than woven through.

### 2.6 Raised defects in the governing documents

Per SCHEDULER-SPEC §23's standing instruction — *re-derive, and when a stated total disagrees with its components, the components win and the defect is raised rather than silently resolved* — the following are raised, not resolved:

- **DEFECT-1.** DESIGN-SYSTEM §9.2 states a Nothing Today session of **160 s**. Composed from its own unchanged components at `standard` (ident 8.0 + two sayings 28.4 + song 30.0 + six M-02 cards at 13.9 = 83.4 + sign-off 14.2) the total is **164.0 s**. The components win. R01's assertion is on the composition; the stated total is recorded as an approximation.
- **DEFECT-2.** ADR-DATA §11.2's `proj.session.session_end_reason` CHECK list is inconsistent with both the frozen scheduler union and amendment A6. Resolved by D-12 above; raised here so the ADR is corrected rather than silently overridden.
- **DEFECT-3.** ADR-DATA §6.6 prose says "Seven server-written types are emitted by AFTER triggers on `app.items` and `app.depicted_persons`" but the table lists **eight** server-written scheduler types (the seven plus `acute.signal_delivered`, which is written by the P25 job, not a trigger) and names a source table for only six. Resolved by D-11; raised so the ADR is corrected.
- **DEFECT-4.** DESIGN-SYSTEM §6.3's dwell table prints only the `standard` column, which reads as a hole. It is not one: §4.1's `patientTiming` supplies `short` and `long` for all three variable rungs. Rungs −1 and 3 do not vary with `rungDwellStep` (`answerFirstHoldS: 3.0`, `rung3HoldS: 4.0` are scalars) — stated so neither agent invents a variation.

### 2.7 The §7 telemetry fields with no producer — the waiver set

ADR-DATA §8.2 assertion 2 requires every field in SYNTHESIS §7 to map to a manifest row **or** to a `research.field_waiver` row carrying a reason and an approver. The following have **no producer in this product** and must have waivers approved **in Wave 1**, before either blind agent starts, because discovering them in month nine makes the backfill impossible:

`mood_checkin`, `sleep_quality_checkin`, `fatigue_checkin`, `enjoyability_rating` (no mechanic collects them; P4 forbids patient self-rating of recall but not of mood — this is a protocol decision, not an engineering one) · `n_answer_changes`, `n_backspaces`, `inter_key_flight_times_ms`, `pointer_path_length_px`, `n_direction_reversals`, `scroll_events`, `zoom_events` (a tap-only surface with no text entry and no scrolling produces none of them) · `speech_rate_wpm`, `articulation_rate`, `type_token_ratio` (require a transcript; D-3 and P27 forbid one) · `asr_confidence`, `asr_language` (no ASR in the path) · `response_text_hash` (ADR-DATA §6.5 declines it in v1; `response_token_class` replaces it) · the model-fitted derived variables `multi_day_learning_curve_auc`, `forgetting_rate_lambda`, `retention_at_1d/7d/30d`, `isd_residual_rt`, `cv_rt`, `ex_gaussian_tau`, `short_term_practice_effect_slope` (investigator-computed offline per PRODUCT-SHAPE §8.2 surface C; the release builder populates only `adherence_rate`, `persistence_rate`, the two attrition curves, `session_ended_on_success_rate`, `distress_event_rate` and `assistance_dependency_index`).

Owner of the check: **B16**. Owner of the approval: the protocol owner.

---

## 3. WAVE TABLE

A wave contains only modules whose every dependency lies in a strictly earlier wave, so a wave may be built entirely in parallel. **Backend migration modules are authored in parallel within their wave and applied in migration-number order** — their ordering constraint is at apply time, not at author time, because ADR-DATA specifies each file's DDL completely.

| Wave | Theme | Modules | n |
|---|---|---|---|
| **W0** | Gates before anything | G01, G02 | 2 |
| **W1** | **THE CONTRACT FREEZE** — one unit, one `contract:` commit, one human review | C01–C18 | 18 |
| **W2** | Pure leaves: contract-only dependencies | S01, S02, S03, S05, S07, S08, S09, S13, S14, S23 · R01, R02, R05, R06, R07, R08, R09, R10 · T01, T02, T03, T04, T06, T07, T08 · Y01, Y02, Y03 · P01, P02, P03, P04, P05 · A01, A02 · B01–B10 | 45 |
| **W3** | Second order | S04, S10, S11 · R03 · T05 · A03, A05, A06, A07, A09, A10, A11, A12, A13, A14, A15 · U01 · B11–B20 | 27 |
| **W4** | Scheduler mid-tier, client composites, backend security | S06, S12, S17, S18, S19, S22 · A04, A08 · U02, U03, U08, U09, U10, U12 · B21–B25 | 19 |
| **W5** | Scheduler composites, session machine, edge functions | S15, S16, S24 · R04 · U04, U11, U13 · B26, B27, B28, B29, B32, B33, B34, B36 | 15 |
| **W6** | The reducer | S20 · U14 | 2 |
| **W7** | The fold | S21 | 1 |
| **W8** | The scheduler barrel (its export list is the assertion) | S25 | 1 |
| **W9** | Everything that imports the barrel | B30, B31, B35 · U05, U06, U07 | 6 |
| **G** | **Continuous from W0, never a final phase** | `eas build --platform ios` in CI · the RLS suite over `policies.ts` · the accessibility conformance suite · the claim-lint gate · the banned-lexicon gate · `npx expo install --check` · the disaster-recovery drill including `ops.replay_erasure_ledger()` | — |

**Total: 136 modules.**

Two tracks run concurrently after W1 and never block each other until W9: the **client track** (S·R·T·Y·P·A·U) and the **backend track** (B). The only cross-track edges are B30/B31/B35 → S25 (the server imports the scheduler barrel) and U08–U14 → B15/B18/B19 (the UI calls named RPCs and views).

---

## 4. DEPENDENCY GRAPH

Contract modules are omitted from the edges below — **every** module depends on the contract package, and stating it 136 times carries no information. Only cross-module edges within `src/domain`, `src/adapters`, `supabase` and `src/ui` are shown.

```
G01 ─┐
G02 ─┴─> C01..C18 (frozen as one unit) ──> everything

SCHEDULER
  S01 arith ──> S04 ──> S06 ──┐
                 │             ├──> S15 next-trial ──┐
  S05 foil ──────┴─────────────┘                     │
  S13 probe-due ──────────────────────────────────────┤
  S14 closer ─────────────────────────────────────────┘
  S01 ──> S10 drift ──┐
  S01 ──> S11 acute ──┼──> S24 signals
  S01 ──> S12 roster ─┴──> S16 session-open
  S08 outcome ─┐
  S09 across  ─┼──> S17 session-close
  S04, S10 ────┘
  S02 grading ─┐
  S07 cue-tr  ─┴──> S19 reduce-trial ──┐
  S04 ──> S18 reduce-items ────────────┼──> S20 reduce ──> S21 fold ──> S25 barrel
  S16, S17 ────────────────────────────┘                                   │
  S03 init ──> S21                                                         │
  S22 trial-telemetry, S23 session-telemetry ──────────────────────────────┘

SESSION RUNTIME
  R02 dwell ──> R03 rung-machine ──┐
  R01 plan ────────────────────────┼──> R04 session-machine
  R05 end-resolution ──────────────┤
  R07 probe-block ─────────────────┘
  R08 copy-render ──> R03, R04
  R06 era-order, R09 eligibility, R10 library ──> R01

TELEMETRY / SYNC
  T04 stimulus ──> T05 interaction-row
  T03 canonical-order ──> T08 device-projection ──> (U05)
  T01 envelope, T02 clock-anchor ──> A08 net.sync
  Y01 pull+expiry, Y02 outbox-drain ──> A08
  Y03 media-plan ──> A08

ADAPTERS
  A01 db.sqlite ──> A03 outbox.sqlite
  A09 clock/ids/rng ──> A04 media.native, A15 storage-upload
  A07 supabase ──> A08 net.sync, A15

BACKEND (apply order = migration number)
  B01 roles/schemas/authn
   └> B02 types+tenancy
       ├> B03 consent   ├> B04 devices   ├> B05 content/media
       ├> B06 safety/erasure-ledgers     └> B07 identity
  B08 payload-firewall ──> B09 event-log ──> B10 ingest/canonicaliser
  B09 ──> B11 app→log triggers ; B12 log→app reactors
  B10 ──> B13 proj tables+projectors ──> B14 device views ; B15 caregiver views+RPCs
  B07 ──> B16 research manifest+tables ──> B17 projector/severance ──> B18 analysis views
  B13 ──> B19 ops console ; B06+B17 ──> B20 erasure orchestrator
  (all tables) ──> B21 rls-enable ──> B22 policies ──> B23 grants ──> B24 registry-seed ──> B25 fixtures
  B26 guard ──> B28 enrol, B29 redeem, B30 sync, B32 export, B33 delete
  B27 payload-validate ──> B30
  S25 ──> B31 server-fold ──> B30 ; S25 ──> B35 p25-notify
  B17+B18 ──> B34 publish-release ; B16+B17 ──> B36 codebook

UI
  U01 tokens ──> U02 frame ──> U04 segments ──> U05 patient-shell
  U03 input ──> U05 ; R04 ──> U04, U05 ; S25 ──> U05 ; T05,T06,T08 ──> U05
  U01 ──> U06 enrol/expired/closedown ; U07 handover
  U01 ──> U08 onboarding, U09 deck, U10 home, U11 consent
  U01 ──> U12 researcher-primitives ──> U13 ops-console, U14 releases
```

---

## 5. THE CONTRACT PACKAGE, FILE BY FILE

`src/contract/` is the only artefact both blind agents share. It is frozen as **one unit** in W1, in one `contract:` commit, with one human review (ADR-PLATFORM §6.2). The internal write order below is a convenience, not a set of build waves.

```
src/contract/
  types.ts              C01  scalar aliases and every closed union the system speaks
  config.ts             C02  SchedulerConfig (49 fields) + defaultConfig
  events.ts             C03  the 14-member SchedulerEvent union + EventEnvelope + Attempt
  scheduler-state.ts    C04  ItemState, RosterEntry, ActiveSessionState, SessionSummary,
                             ParticipantState, SchedulerState
  scheduler-api.ts      C05  TrialDirective, RosterPlan, SchedulerSignal,
                             TrialSchedulingTelemetry, SessionSchedulingTelemetry, Scheduler
  schema.ts             C06  the FOUR frozen plain-data literals of SCHEDULER-SPEC §21.2
  wire/envelope.ts      C07  zEventEnvelope, zBatchHeader, seq composite, the 4 payload shapes
  wire/payloads.ts      C08  the 20 payload schemas, zStimulusDescriptor, toSchedulerEvent
  wire/api.ts           C09  sync push/pull/ACK, device row shapes, enrolment, export, delete
  ports.ts              C10  every injected capability, interfaces only, zero implementation
  testids.ts            C11  the frozen testID const object for all three surfaces
  policies.ts           C12  the RLS expectation table as DATA + the declared caller obligations
  copy.ts               C13  the closed patient vocabulary + spoken durations + banned lists
  programme.ts          C14  segment kinds, the §9.1 zero-input table, the §6.3 dwell floors,
                             motion and input timings
  fixtures/
    types.ts            C15  the row shape of every fixture file + the fixture manifest
    scheduler/*.json         AUTHORED BY THE BLIND TEST-WRITER, not by an implementer
    decks/*.json             ditto
  testing/
    fakes.ts            C16  in-memory fakes for every port; fixed clock; seeded rng
    conformance.ts      C17  exported behavioural suites every port implementation must pass
    supabase.ts         C18  signInAsFixtureDevice / signInAsFixtureUser against seed.sql
```

**What is deliberately NOT in the contract package.** No implementation of anything. No fixture *data* — §23 assigns that to the blind test-writer and listing it as implementation work would collapse the boundary the whole process exists to hold. No default value that a rule could read instead of taking as an argument.

**The freeze rule.** Any change to `src/contract/**` requires a `contract:` commit prefix and explicit human review. CI rejects an implementer commit touching `tests/**` and a test-writer commit touching `src/domain/**`, `src/adapters/**` or `app/**` (G01).

---

## 6. MODULE CONTRACTS

Every module block carries **path**, **purpose**, **api** (exact signatures), **deps**, **spec** (the sections an agent is given), **blind test** (what the test-writer asserts), **risk** and **wave**.

Risk classes: `safety` (a defect harms a person), `privacy` (a defect discloses), `correctness` (a defect corrupts the study), `presentational` (a defect is visible on first render).

---

### LAYER G — GATES

#### G01 — boundary enforcement · `eslint.config.js`, `scripts/ci-gates.mjs` · ~180 lines
**purpose.** The rules that make every architectural guarantee in this repository mechanical rather than aspirational. Built **first**, before the contract package, because a rule added after the domain wave finds violations instead of preventing them.
**api.**
```
eslint.config.js — a flat config enforcing:
  no-restricted-imports in src/domain/**: react, react-native, expo-*, @supabase/*, ../ui
  no-restricted-globals in src/domain/**: Date, Math.random, crypto, fetch, window, document,
                                          performance, navigator, localStorage
  app/(researcher)/**   restricted to *.web.tsx
  src/ui/patient/**     may import only View, Image, Text, Pressable from react-native
  no literal hex colour, pt size or ms duration outside src/ui/tokens.ts and
                        src/contract/programme.ts
scripts/ci-gates.mjs — exports:
  checkAgentPaths(diff)        implementer commit touching tests/** => fail;
                               test-writer commit touching src/domain|src/adapters|app => fail
  checkContractPrefix(commit)  any src/contract/** change without a `contract:` prefix => fail
  checkExpoInstall()           `npx expo install --check` must be clean
  checkSyncNoServiceRole()     supabase/functions/sync/** must not reference SERVICE_ROLE_KEY
  checkBannedCopy()            every string reachable from src/ui/patient/** and the bundled
                               content library against C13.BANNED_PATIENT_WORDS => zero matches
  checkClaimLint()             every marketing, store and in-product string through P05 => zero
  checkContrastComments()      every contrast ratio in a comment recomputed from its hex values
  checkNoFaceApi()             no face-detection, clustering, auto-tagging or voiceprint import
                               anywhere in src/** or app/**
  checkSchedulerPurity()       the built src/domain/scheduler/** source contains no Date,
                               Math.random, performance, crypto, fetch, window or document
                               outside comments  (invariant I-10a)
  checkNoClinicalLayer()       repository-wide: no drift detector, trajectory, progression metric
                               or cognitive-status component exists in any form, feature-flagged
                               or otherwise (PRODUCT-SHAPE §8.2 surface C)
```
**deps.** none.
**spec.** ADR-PLATFORM §6.2 (the four rules that hold the whole design up), §3; DESIGN-SYSTEM §12.5 A25, §12.6 A33; SYNTHESIS §8 C3, P20, P24; V1-PRODUCT-SHAPE §8.2 surface C; ADR-DATA §13 final INVARIANT row.
**blind test.** Each rule has a **must-fail** fixture and a **must-pass** sibling: a domain file importing `expo-sqlite`; one calling `Date.now()`; a patient component importing `ScrollView`; a `src/ui` file with an inline `#201B17`; a researcher route named `.tsx`; a synthetic implementer diff touching `tests/`; a `sync/index.ts` containing `SERVICE_ROLE_KEY`; a caregiver file importing a face-detection module. Each fixture asserts the specific rule id, not merely "lint failed".
**risk.** correctness. **wave.** W0.

#### G02 — app and build configuration · `app.json`, `eas.json`, `assets/fonts/`, `assets/library/` · ~150 lines
**purpose.** Everything the native build needs that is not code and that carries a binding requirement: the SQLCipher flag, the orientation lock, the permission strings, the privacy manifest, the two amendment-A7 dependencies, and the bundled generic content library.
**api.**
```
app.json   expo.plugins: ['expo-sqlite', { useSQLCipher: true }], expo-font (Source Sans 3
             SemiBold + Regular, pinned), expo-camera, expo-audio, expo-secure-store
           expo.orientation: 'landscape'                      (DESIGN-SYSTEM §11.3)
           expo.ios.infoPlist: NSCameraUsageDescription, NSMicrophoneUsageDescription,
             NSPhotoLibraryUsageDescription — plain words, no system vocabulary
           expo.ios.privacyManifests: declared API reasons (file timestamp, user defaults,
             disk space, system boot time)
eas.json   build profiles: development, preview, production; ios.simulator for CI
assets/fonts/SourceSans3-SemiBold.ttf, SourceSans3-Regular.ttf   (OFL-1.1, pinned)
assets/library/manifest.json + assets/library/**   the bundled generic library:
             sayings (locale-matched), music clips (decade-matched), 8 stock probe faces
             (probe_ordinal 1..8), era photos, the fallback still-life
package.json  ADR-PLATFORM §3's 21 runtime + 9 dev dependencies, plus expo-font and
             expo-battery (amendment A7). No other package.
```
**deps.** none.
**spec.** ADR-PLATFORM §3, §9 (repo layout — **amended by D-1 and C-4**), §10; DESIGN-SYSTEM §3 A7, §4.1 (`patientTypeInvariants.family`), §11.3, §11.5; V1-PRODUCT-SHAPE §3 ("M-35, M-56 and the probe all ship in the app bundle").
**blind test.** `npx expo install --check` clean; the dependency set equals ADR-PLATFORM §3 plus exactly `expo-font` and `expo-battery`, with nothing from the "explicitly not installed" list present; `useSQLCipher: true` present; orientation `landscape`; every permission string passes the banned-lexicon check; the bundled library manifest has exactly 8 rows with non-null `probe_ordinal` and they are identical for every participant; the fallback still-life exists and depicts no people. **A CI check asserts `assets/library/manifest.json` and `app.generic_library` agree row-for-row on `(content_set_version, kind, locale, probe_ordinal, licence_ref)`.**
**risk.** correctness. **wave.** W0.

---

### LAYER C — THE CONTRACT PACKAGE (W1, one frozen unit)

#### C01 — scalar and union vocabulary · `src/contract/types.ts` · ~55 lines
**purpose.** Every scalar alias and closed union the whole system speaks, so no other module invents one.
**api.**
```ts
export type ItemId = string; export type DeviceId = string; export type SessionId = string;
export type BootId = string; export type PatientId = string; export type SubjectId = string;
export type Tier = 1 | 2 | 3;
export type CueLevel = 0 | 1 | 2 | 3;
export type Rung = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ItemStatus = 'active' | 'absorbing_distress' | 'retired';
export type TrialClass = 'FLOOR' | 'SUPPORTED' | 'VANISH';
export type Grade = 'MISS' | 'SLOW' | 'CLEAN' | 'EXPOSURE';
export type SessionOutcome = 'CLEAN_SESSION' | 'SLOW_SESSION' | 'SUPPORTED_SESSION'
  | 'EXPOSURE_SESSION' | 'MISSED_SESSION' | 'NO_EVIDENCE';
/** The FROZEN scheduler union. Carried on SessionEnded. Never extended. */
export type SessionEndReason = 'budget_time' | 'budget_trials' | 'roster_exhausted'
  | 'user_ended' | 'distress_stop' | 'abandoned' | 'app_crash';
/** The runtime/telemetry union (§2.3). Contains NO 'timeout' — that absence is A40. */
export type RuntimeEndReason = SessionEndReason | 'completed'
  | 'battery_truncated' | 'audio_unavailable' | 'content_expired' | 'wrong_resident';
export type PersonStatus = 'living' | 'deceased' | 'estranged' | 'do_not_show';
export type RelationshipGroup = 'partner' | 'child_or_grandchild' | 'sibling_or_parent'
  | 'friend_or_other' | 'self_or_pet';
export type EraBand = 'pre_1950' | '1950s_60s' | 'post_1970';
export type PresentationMode = 'free_recall'|'cued_recall'|'recognition'|'familiarity_exposure';
export type RungLadderVariant = 'four_rung' | 'three_rung_no_foil' | 'three_rung_target';
export type SessionMode = 'standard' | 'nothing_today';
export type SessionOrderVariant = 'standard' | 'front_loaded';
export type RungDwellStep = 'short' | 'standard' | 'long';
export type PatientTypeStep = 'sm' | 'md' | 'lg';
export type AudioOutput = 'speaker' | 'headphones' | 'captions_only';
export type PrimeCondition = 'primed' | 'unprimed';
export type M2PhotoSource = 'personal' | 'generic';
export type DistressSource = 'patient_control' | 'caregiver_report';   // EXACTLY TWO. P18.
export type ByRole = 'caregiver' | 'clinician';                        // NO 'algorithm'. P3.
export type MomentKind = 'long_narration' | 'song_played' | 'item_first_success'
  | 'tier1_maintained' | 'session_shared_with_caregiver' | 'new_item_added';
export type ConsentPurpose = 'care_delivery' | 'research_behavioural'
  | 'research_speech_features' | 'media_retention' | 'third_party_imagery'
  | 'contact_for_followup';
export const SERVER_DEVICE_ID: '00000000-0000-0000-0000-000000000000';
```
**deps.** none.
**spec.** SCHEDULER-SPEC §3 (type block), §4.1; ADR-DATA §5.1, §6.6 (server device id), §11.2 (`proj.moment.kind`); DESIGN-SYSTEM §8.5.2, §9.5, §4.1; §2.3 of this manifest.
**blind test.** Type-only at compile time; asserted at runtime through C06's literals and, per union, through a companion `satisfies readonly T[]` array in the test file with a `never`-defaulted exhaustive switch. Named negatives: `DistressSource` has exactly two members and contains neither `'abandonment'` nor `'repeated_skip'`; `ByRole` does not contain `'algorithm'`; `RuntimeEndReason` does not contain `'timeout'`; `MomentKind` deep-equals ADR-DATA §11.2's CHECK list (a CI check compares the TypeScript union to the SQL constraint).
**risk.** correctness. **wave.** W1.

#### C02 — scheduler configuration · `src/contract/config.ts` · ~115 lines
**purpose.** The 49-field `SchedulerConfig` and the single `defaultConfig` value, so that no rule anywhere contains a number.
**api.** `export interface SchedulerConfig { … }` — all 49 fields exactly as SCHEDULER-SPEC §2.1 declares them, in that order, the five per-participant fields first. `export const defaultConfig: SchedulerConfig` — the §2.1 literal, verbatim.
**deps.** C01.
**spec.** SCHEDULER-SPEC §2 (constants table, Value column), §2.1 (the complete declaration and the literal), §2.3 (well-formedness precondition).
**blind test.** `fixtures/scheduler/config.json` deep-equals `defaultConfig` — one assertion pins all 49 names and all 49 values. `Object.keys(defaultConfig).length === 49`. Every §2.3 precondition holds of `defaultConfig` itself: both ladders length 7 and strictly increasing, `ceilingRung` keys exactly {1,2,3}, `sessionMaxTrials === sessionMaxItems * maxTrialsPerItemPerSession`, `vanishPerSession === 1`, `minPlausibleLatencyMs <= slowLatencyMs <= responseTimeoutMs <= maxLatencyMs`.
**risk.** correctness. **wave.** W1.

#### C03 — the scheduler event union · `src/contract/events.ts` · ~50 lines
**purpose.** The exhaustive 14-member `SchedulerEvent` union, its envelope, and `Attempt`.
**api.**
```ts
export interface EventEnvelope {
  eventId: string; deviceId: DeviceId; bootId: BootId; seq: number; anchorMs: number; }
export interface Attempt {
  correct: boolean; cueLevel: CueLevel; latencyMs: number; attemptIndex: number;
  interrupted: boolean; appBackgroundedMs: number; }
export type SchedulerEvent = EventEnvelope & (
  | { type:'ItemAdded'; itemId:ItemId; tier:Tier; recognitionBlocked:boolean; contentReady:boolean }
  | { type:'ItemContentReadyChanged'; itemId:ItemId; contentReady:boolean }
  | { type:'ItemTierSet'; itemId:ItemId; tier:Tier; by:ByRole }
  | { type:'ItemRecognitionBlockSet'; itemId:ItemId; recognitionBlocked:boolean; by:ByRole }
  | { type:'ItemRetired'; itemId:ItemId; by:ByRole; reason:string }
  | { type:'ItemReEnabled'; itemId:ItemId; by:ByRole }
  | { type:'ProbeDisabledSet'; disabled:boolean; by:ByRole }
  | { type:'SessionStarted'; sessionId:SessionId; startedMonoMs:number }
  | { type:'TrialCompleted'; sessionId:SessionId; itemId:ItemId; openingCueLevel:CueLevel;
      floorCueLevel:CueLevel; trialClass:TrialClass; isCloser:boolean;
      attempts:readonly Attempt[]; terminalMonoMs:number; terminalAnchorMs:number }
  | { type:'GenericFillerShown'; sessionId:SessionId }
  | { type:'ProbeBlockCompleted'; sessionId:SessionId; elapsedMs:number; truncated:boolean }
  | { type:'DistressReported'; sessionId:SessionId; itemId:ItemId|null;
      severity:'mild'|'moderate'|'severe'; source:DistressSource }
  | { type:'SessionEnded'; sessionId:SessionId; reason:SessionEndReason;
      closerPresented:boolean; endedMonoMs:number }
  | { type:'AcuteSignalDelivered' } );
```
**deps.** C01.
**spec.** SCHEDULER-SPEC §5, §5.1 notes 1–8.
**blind test.** Exhaustiveness by `switch (e.type)` with a `never` default. `Attempt` carries no key matching `/confidence|rating|self|asr|grade/i` — asserted at runtime through C06's `ATTEMPT_KEYS` (I-9 clause 1). Per-variant field counts asserted against C06's `EVENT_SCHEMA`.
**risk.** safety. **wave.** W1.

#### C04 — the scheduler state model · `src/contract/scheduler-state.ts` · ~75 lines
**purpose.** Every state record with its exact field set, so eight domain modules taking `SchedulerState` mean the same thing by it.
**api.** `ItemState` (13 fields), `CountedTrial`, `RosterEntry` (13 fields), `ActiveSessionState` (18 fields), `SessionSummary` (9 fields), `ParticipantState` (9 fields), `SchedulerState` (7 fields) — transcribed exactly from SCHEDULER-SPEC §3.1–§3.4, including `readonly version: 1` and `readonly paramsVersion: string`.
**deps.** C01, C02.
**spec.** SCHEDULER-SPEC §3.1, §3.2, §3.3, §3.4.
**blind test.** Type-only, plus runtime key-list assertions transcribed from the spec: `ItemState` exactly 13 fields, `ParticipantState` exactly 9, `ActiveSessionState` exactly 18. **The absences are asserted by name:** no `lapseCount`, no `missCount`, no `isProbe`, no `dueCount`, no `backlog` on any interface. `gentleActive` and `driftAtStart` exist on `ActiveSessionState` and **not** on `ParticipantState`, which is what makes them snapshots.
**risk.** safety. **wave.** W1.

#### C05 — the scheduler public API · `src/contract/scheduler-api.ts` · ~90 lines
**purpose.** The directive, plan, signal and telemetry shapes, and the `Scheduler` interface the barrel must satisfy.
**api.**
```ts
export type TrialDirective =
  | { kind:'NO_SESSION' }
  | { kind:'TRIAL'; itemId:ItemId; openingCueLevel:CueLevel; floorCueLevel:CueLevel;
      trialClass:TrialClass; foilItemId:ItemId|null }
  | { kind:'PROBE_BLOCK'; probeItemIds: readonly ItemId[] }
  | { kind:'FILLER' }
  | { kind:'CLOSER'; itemId:ItemId|null }
  | { kind:'END'; reason:SessionEndReason };
export interface RosterPlan { itemIds: readonly ItemId[]; forcedMissing: readonly ItemId[]; }
export type SchedulerSignal =
  | { kind:'tier1_floor_unsatisfied'; itemIds: readonly ItemId[] }
  | { kind:'items_set_aside';        itemIds: readonly ItemId[] }
  | { kind:'acute_change_suspected'; limb:'support'|'miss'|'absence' };

/** SCHEDULER-SPEC §17.3, transcribed field-for-field. EXACTLY 23 fields. */
export interface TrialSchedulingTelemetry {
  itemId: ItemId | null; itemTier: Tier | null; repetitionNumber: number;
  daysSinceLastReview: number | null; daysSinceFirstIntroduction: number | null;
  scheduledIntervalMs: number | null; acrossIntervalDeviationMs: number | null;
  withinSessionRung: Rung | null; withinIntervalDeviationMs: number | null;
  attainedRung: Rung | null; driftAdjustmentApplied: 0|1|2;
  difficultyFloorTriggered: boolean; overdueReturnApplied: boolean;
  openingCueLevel: CueLevel; floorCueLevel: CueLevel; wasVanishAttempt: boolean;
  presentationMode: PresentationMode; nDistractors: 0|1; isCloser: boolean;
  stability: null; difficulty: null; retrievability: null; predictedRecallProbability: null; }

/** SCHEDULER-SPEC §17.4, transcribed field-for-field. EXACTLY 9 fields. */
export interface SessionSchedulingTelemetry {
  sessionId: SessionId; endedOnSuccess: boolean; sessionEndReason: SessionEndReason;
  plannedNItems: number; completedNItems: number; probeBlockEmitted: boolean;
  probeTruncated: boolean; nFillersShown: number; clockAnomalyCount: number; }

export interface Scheduler { /* the ten methods of §4, exactly as declared */ }
```
**deps.** C01, C02, C03, C04.
**spec.** SCHEDULER-SPEC §4, §4.1, **§17.3 (verbatim — there is NO `scheduledIntervalDays` and NO `intervalDeviationDays`; the within- and across-session deviation fields have distinct names)**, **§17.4 (verbatim)**.
**blind test.** A CI script diffs each interface against the literal TypeScript block in the named spec section and fails on any difference — the W1 gate that catches a mis-transcribed frozen type *before* anything is built on it. Plus: a constructed `TrialSchedulingTelemetry` has exactly 23 keys and a `SessionSchedulingTelemetry` exactly 9; the last four trial fields are typed `null`.
**risk.** correctness. **wave.** W1.

#### C06 — the four frozen runtime literals · `src/contract/schema.ts` · ~50 lines
**purpose.** Four plain-data frozen exports giving the type-level safety claims of §5.1 a runtime artefact to be asserted against. Without them invariant I-9 is unwritable.
**api.** `ENVELOPE_KEYS`, `ATTEMPT_KEYS`, `EVENT_SCHEMA` (exactly 14 keys; payload keys only, excluding `type` and the envelope), `EVENT_VARIANTS` (exactly 9 keys) — transcribed verbatim from SCHEDULER-SPEC §21.2.
**deps.** C03.
**spec.** SCHEDULER-SPEC §21.2 (the complete literal), I-9 clauses 1–4, and the three decisions beneath it (payload keys only; `type` is not a key; arrays are order-sensitive — transcribe, do not sort).
**blind test.** Four deep equalities against the §21.2 literal, plus I-9's four negatives: no `ATTEMPT_KEYS` member matches `/confidence|rating|self|asr/i`; `EVENT_VARIANTS['DistressReported.source']` has length exactly 2 and contains neither `'abandonment'` nor `'repeated_skip'`; `EVENT_VARIANTS['ItemRetired.by']` and `['ItemReEnabled.by']` each equal `['caregiver','clinician']` and neither contains `'algorithm'`; `Object.keys(EVENT_SCHEMA).sort()` equals the 14 sorted type names and `EVENT_SCHEMA.AcuteSignalDelivered` is `[]`.
**risk.** safety. **wave.** W1.

#### C07 — the wire envelope · `src/contract/wire/envelope.ts` · ~60 lines
**purpose.** The zod schema for the on-the-wire envelope and batch header, the composite `seq` bounds, and the four permitted payload string shapes — the artefacts the device, `/sync`, the registry seed and the 5,000-name fuzz test all import.
**api.**
```ts
export const zEventEnvelope: z.ZodType<{ event_id:string; device_id:string; patient_id:string;
  session_id:string|null; boot_id:string; boot_ordinal:number; seq:number; type:string;
  payload_version:number; payload:Record<string,unknown>; t_mono_ms:number; t_wall_ms:number;
  client_version:string }>;
export const zBatchHeader: z.ZodType<{ batch_id:string; boot_wall_ms:number;
  boot_mono_ms:number; client_sent_wall_ms:number }>;
export type WireEvent = z.infer<typeof zEventEnvelope>;
export type BatchHeader = z.infer<typeof zBatchHeader>;
export const SEQ_BOOT_MULTIPLIER: 100_000_000;
export const WITHIN_BOOT_SEQ_MAX: 99_999_999;
export const PAYLOAD_STRING_RE: { snake:RegExp; uuid:RegExp; hex64:RegExp; dotted:RegExp };
export const EVENT_TYPE_RE: RegExp;                 // ^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$
export function payloadShapeOk(p: unknown, depth?: number): boolean;
```
**deps.** none.
**spec.** ADR-DATA §6.1 (envelope and batch header, verbatim; the composite `seq` and why it is composite), §6.5 layer 1 (the four permitted string shapes, with the exact regexes and the depth-4 / array-64 bounds).
**blind test.** The name fuzz, and it is decisive: a 5,000-entry first-name dictionary in four casings through `payloadShapeOk`, asserting **100% rejection** — `"Margaret"` fails on the leading capital, `"Margaret Thatcher"` on the space, `"14 Elm Street"` on both, and a lowercased `"margaret"` **passes the shape** and must be caught by C08's vocabulary layer. Depth 5 rejected; a 65-element array rejected. Positive: the §6.1 literal parses unchanged. `seq = boot_ordinal*1e8 + 99_999_999` parses; one higher does not.
**risk.** privacy. **wave.** W1.

#### C08 — the 20 payload schemas · `src/contract/wire/payloads.ts` · ~200 lines
**purpose.** A zod payload schema per registered wire type, the frozen stimulus descriptor, and the one mapping from wire to `SchedulerEvent`.
**api.**
```ts
export const zStimulusDescriptor: z.ZodType<{ content_class:string;
  relationship_group:RelationshipGroup; era_band:EraBand; person_status:PersonStatus;
  recognition_blocked:boolean; content_provenance:'family_upload'|'generic_library'|'physical_scan';
  media_kind:string; n_media_assets:number; cue_modality:string; content_language:string;
  item_tier:Tier; is_month_target:boolean; content_is_generic:boolean; valence_band:string;
  importance_band:string; content_set_version:string; presentation_mode:PresentationMode;
  n_distractors:number }>;
export type WireType = /* the 20 dotted tokens of ADR-DATA §6.6 */;
export const WIRE_PAYLOADS: Readonly<Record<WireType, z.ZodTypeAny>>;   // exactly 20 keys
export const SCHEDULER_WIRE_TYPES: readonly WireType[];                 // exactly 14
export function toSchedulerEvent(w: WireEvent, anchorMs: number): SchedulerEvent | null;
export function toJsonSchema(t: WireType): object;   // emitted into log.event_type.payload_schema
```
**deps.** C01, C03, C07.
**spec.** ADR-DATA §6.6 (the 20-type table and which 14 are `is_scheduler`), §9 (the stimulus descriptor literal), §8.4 (the coarsening table), §8.6; SCHEDULER-SPEC §5 (authoritative for the 14 scheduler payloads); adjudication C-2 of this manifest.
**blind test.** Per type: one accept fixture and three reject fixtures (wrong enum member, missing key, a string violating the §6.5 shape). `Object.keys(WIRE_PAYLOADS).length === 20`; `SCHEDULER_WIRE_TYPES.length === 14`, mapping 1:1 onto `EVENT_SCHEMA`'s key set. `toSchedulerEvent` returns `null` for exactly the six non-scheduler types and round-trips every fixture in `sessions/*.json` back to the `SchedulerEvent` those fixtures already pin. `media.purged` requires `{sha256:hex64, revocation_id:uuid, local_file_existed:boolean}`. `probe.trial_completed` requires `opening_cue_level: 2` and `n_distractors: 1` (C-2). `session.co_present_declared` is the only schema producing `caregiver_present_source = 'declared'`, and **no schema anywhere produces `'inferred'`** (§8.6).
**risk.** privacy. **wave.** W1.

#### C09 — the HTTP surface · `src/contract/wire/api.ts` · ~110 lines
**purpose.** Every request and response shape that crosses the network, plus the two device row shapes the pull returns.
**api.**
```ts
export const zDeviceRosterRow: z.ZodType<{ patient_id:string; display_first_name:string;
  avatar_sha256:string|null; ui_version_pinned:string; content_valid_until_ms:number;
  hard_expiry_days:number; music_decade:number; bump_decade:number; content_language:string;
  content_set_version:string; probe_ordinals:number[]; probe_disabled:boolean;
  acute_signal_enabled:boolean; within_start_rung:number; params_version:string;
  tz_offset_minutes:number; session_order_variant:SessionOrderVariant;
  rung_dwell_step:RungDwellStep; patient_type_step:PatientTypeStep; audio_output:AudioOutput;
  fluctuation_band:'standard'|'high'; era_blocklist:string[]; theme_blocklist:string[] }>;  // D-4
export const zDeviceContentRow: z.ZodType<{ op:'upsert'|'purge'; patient_id:string;
  item_id:string|null; person_display_name:string|null; one_sentence:string|null; tier:number|null;
  content_class:string|null; era_decade:number|null; content_language:string|null;
  is_month_target:boolean|null; recognition_allowed:boolean|null; person_status:PersonStatus|null;
  person_status_validated_at_ms:number|null; relationship_group:RelationshipGroup|null;
  era_band:EraBand|null; valence_band:string|null; importance_band:string|null;
  content_provenance:string|null; content_is_generic:boolean|null; media_sha256:string|null;
  media_mime:string|null; media_bytes:number|null; media_role:string|null; ord:number|null;
  revocation_id:string|null; updated_at_ms:number }>;
export const zSyncPushRequest: z.ZodType<{ header:BatchHeader; events:WireEvent[];
  sessions:unknown[]; last_cursor:string|null }>;
export const zSyncPullResponse: z.ZodType<{
  accepted:string[];
  quarantined:{ event_id:string; reason:string; retryable:boolean }[];
  boot_anchors:{ boot_id:string; base_ms:number; mono_origin_ms:number }[];
  roster_delta: DeviceRosterRow[]; cards_delta: DeviceContentRow[];
  media_manifest_delta:{ sha256:string; mime:string; bytes:number; signed_url:string }[];
  server_time_ms:number; content_valid_until_ms:number; new_cursor:string }>;
export const MAX_EVENTS_PER_PUSH: 500;
export const zEnrolDeviceRequest, zEnrolDeviceResponse, zRedeemEnrolmentRequest,
  zRedeemEnrolmentResponse, zExportRequest, zExportResponse, zDeleteRequest,
  zDeleteResponse: z.ZodType<…>;
```
**deps.** C01, C07, C08.
**spec.** ADR-PLATFORM §4.4, §4.5, §5.2; ADR-DATA §6.8 (the ACK contract), §12.2 (`device_content` / `device_roster` — **widened by D-4**), §10.4(a), §10.8, §10.3.
**blind test.** A pull response omitting `accepted` fails to parse — **HTTP 201 is not an ACK**. A push of 501 events is rejected. `zEnrolDeviceResponse` carries no `device_secret` field at the type level; `code` matches `/^[0-9A-HJ-NP-TV-Z]{8}$/`. A `cards_delta` row with `op:'purge'` requires a `revocation_id` and either `media_sha256` or `item_id`. **`zDeviceRosterRow` has no `birth_year`, no surname, no date of birth, no room number and no diagnosis field** — D-4's privacy assertion, checked by key enumeration.
**risk.** privacy. **wave.** W1.

#### C10 — the ports · `src/contract/ports.ts` · ~130 lines
**purpose.** Every boundary the pure code is allowed to touch, as interfaces with zero implementation.
**api.**
```ts
export interface CardRow { itemId:ItemId; patientId:PatientId; tier:Tier;
  recognitionAllowed:boolean; personStatus:PersonStatus; personStatusValidatedAtMs:number;
  displayName:string; oneSentence:string; eraDecade:number; relationshipGroup:RelationshipGroup;
  eraBand:EraBand; valenceBand:string; importanceBand:string; contentProvenance:string;
  contentIsGeneric:boolean; isMonthTarget:boolean; contentLanguage:string; contentReady:boolean; }
export interface MediaRow { sha256:string; itemId:ItemId; role:string; mime:string;
  bytes:number; state:'pending'|'ready'; }
export interface SchedJournalRow { seq:number; anchorMs:number; event:SchedulerEvent; }   // D-2
export interface SyncMeta { cursor:string|null; lastSuccessfulSyncMs:number|null;
  contentValidUntilMs:number|null; lastKnownSkewMs:number; }
export interface DeviceMeta { bootOrdinal:number; withinBootSeq:number; allocationCounter:number; }

export interface Db {
  readRoster(): Promise<DeviceRosterRow[]>;
  readCards(patientId:PatientId): Promise<CardRow[]>;
  readMedia(): Promise<MediaRow[]>;
  applyPullPlan(plan:PullPlan): Promise<void>;
  readSchedJournal(patientId:PatientId): Promise<SchedJournalRow[]>;
  appendSchedJournal(patientId:PatientId, rows:readonly SchedJournalRow[]): Promise<void>;
  readSyncMeta(): Promise<SyncMeta>;      writeSyncMeta(m:SyncMeta): Promise<void>;
  readDeviceMeta(): Promise<DeviceMeta>;  writeDeviceMeta(m:DeviceMeta): Promise<void>;
  transaction<T>(fn:(tx:Db)=>Promise<T>): Promise<T>;
  wipe(): Promise<void>; }
export interface Outbox {
  /** MUST be callable inside a Db transaction: write-before-render, ADR §4.3 property 1. */
  enqueue(tx:Db, e:WireEvent): Promise<void>;
  peekBatch(max:number, nowMs:number): Promise<WireEvent[]>;
  ackAccepted(ids:readonly string[]): Promise<void>;
  ackPermanentlyRejected(ids:readonly string[]): Promise<void>;
  markRetryable(ids:readonly string[], nextAttemptAtMs:number): Promise<void>;
  dropExpired(beforeMs:number): Promise<number>;
  depth(): Promise<number>; bytes(): Promise<number>; }
export interface MediaStore { has(sha256:string): Promise<boolean>; uri(sha256:string): string;
  download(sha256:string, signedUrl:string, expectedBytes:number):
    Promise<'ready'|'hash_mismatch'|'failed'>;
  purge(sha256:string): Promise<boolean>;          // returns whether a local file existed
  purgeAll(): Promise<void>; bytesUsed(): Promise<number>; evictTo(bytes:number): Promise<number>; }
export interface SecureStore {
  getDeviceCredential(): Promise<{email:string;deviceSecret:string}|null>;
  setDeviceCredential(v:{email:string;deviceSecret:string}): Promise<void>;
  getDbKey(): Promise<string|null>; setDbKey(k:string): Promise<void>;
  nextBootOrdinal(): Promise<number>; clear(): Promise<void>; }
export class PasscodeRequiredError extends Error {}
export interface Net { signIn(email:string, secret:string): Promise<'ok'|'revoked'|'unavailable'>;
  sync(req:SyncPushRequest): Promise<{status:'ok'; body:SyncPullResponse}
                                    | {status:'unavailable'} | {status:'revoked'}>;
  isOnline(): boolean; }
/** Declared for ADR contract conformance. NEVER CALLED by src/domain/scheduler. */
export interface Clock { nowMs(): number; localDayIndex(): number; }
export interface MonoClock { bootId(): BootId; nowMonoMs(): number; }
export interface Rng { nextInt(boundExclusive:number): number; }
export interface Digest { sha256Hex(b:Uint8Array): Promise<string>;
  sha256File(uri:string): Promise<string>;
  hmacSha256(key:Uint8Array, msg:string): Promise<Uint8Array>; uuidv7(): string; }
export interface AudioOut { speak(text:string): Promise<{durationMs:number}>;
  playClip(uri:string, maxMs:number): Promise<void>; tone(): Promise<void>;
  route(): 'speaker'|'headphones'|'none';
  onRouteChange(cb:(r:'speaker'|'headphones'|'none')=>void): () => void;
  confirmOutput(): Promise<number|null>; health(): {audioHealthy:boolean; routeChanges:number}; }
export interface Vad { subscribe(cb:(active:boolean)=>void): () => void;
  windows(): readonly { startMs:number; endMs:number; voiced:boolean }[]; }
/** CAREGIVER SURFACE ONLY. Absent from the patient runtime (D-3). */
export interface Recorder { start(): Promise<void>;
  stop(): Promise<{uri:string; mime:string; durationMs:number}|null>; }
export interface Battery { level(): Promise<number>; lowPowerMode(): Promise<boolean>;
  subscribe(cb:(level:number)=>void): () => void; }
export interface Notifications { scheduleChime(atMs:number|null, body:string): Promise<void>;
  cancelAll(): Promise<void>; }
```
**deps.** C01, C03, C07, C09.
**spec.** ADR-PLATFORM §6.1, §4.2, §4.3, §4.4, §5.2; SCHEDULER-SPEC §4 (`Clock` and `Rng` declared for conformance and never called); ADR-DATA §6.4; D-2 and D-3 of this manifest.
**blind test.** Structural: an AST test asserts the file contains only `interface`, `type` and one `class extends Error`, with zero function bodies, and imports nothing from `src/adapters/**`. Every behavioural obligation is discharged by C17. `Recorder` is asserted absent from the patient bundle by a bundle grep (D-3).
**risk.** correctness. **wave.** W1.

#### C11 — the test-id contract · `src/contract/testids.ts` · ~50 lines
**purpose.** Freezes every interactive element's `testID` so selector drift is a TypeScript error on both sides at once.
**api.**
```ts
export const patient = { ground:'patient.ground', picture:'patient.picture',
  matSingle:'patient.mat.single', cardLeft:'patient.card.left', cardRight:'patient.card.right',
  captionLine1:'patient.caption.1', captionLine2:'patient.caption.2', stop:'patient.stop' } as const;
export const PATIENT_CONTROLS: readonly ['patient.picture','patient.card.left',
  'patient.card.right','patient.stop'];
export const staff: Readonly<Record<string,string>>;
export const caregiver: Readonly<Record<string,string>>;
export const researcher: Readonly<Record<string,string>>;
```
**deps.** none.
**spec.** DESIGN-SYSTEM §12.1 (the patient literal, verbatim), §12.2; ADR-PLATFORM §6.1.
**blind test.** `Object.values(patient)` deep-equals the §12.1 literal; `PATIENT_CONTROLS.length === 4` and is a subset of it. The teeth are assertion **A1** in U02/U05: the set of pressable nodes matching `/^patient\./` is always a subset of `PATIENT_CONTROLS` and never exceeds 4.
**risk.** correctness. **wave.** W1.

#### C12 — the RLS expectation table · `src/contract/policies.ts` · ~240 lines
**purpose.** The complete authorisation expectation for every role, object and verb, **written from the specification and never from the SQL**, as data an agent who has never seen a migration can iterate.
**api.**
```ts
export interface PolicyExpectation { role:string; object:string; verb:string;
  allowedWhen:string; deniedWhen:string; }
export const policyExpectations: readonly PolicyExpectation[];   // ADR-DATA §13, all ~70 rows
export interface CallerObligation { id:string; statement:string; }
export const callerObligations: readonly CallerObligation[];
```
`callerObligations` carries the obligations the domain cannot defend and that must be enforced by the caller: `nextTrial` must receive a `nowMonoMs` drawn from `activeSession.bootId` (§10 note 3, E49); `sessionTelemetry` must be called **before** folding its `SessionEnded` (§17.4); `trialTelemetry` **before** folding its `TrialCompleted` (§17.3 note 4); `fold`'s input must already satisfy §6.1's per-device monotonicity; and **one device per patient at a time** (§6.1, E7).
**deps.** none.
**spec.** ADR-DATA §13 (the complete literal), §12.1 (the 42501-vs-zero-rows distinction), §3 (the three `information_schema` assertions); ADR-PLATFORM §6.1; SCHEDULER-SPEC §10, §17.3, §17.4, E7, E49.
**blind test.** Shape: every row has all five fields; `deniedWhen` beginning `'ALWAYS. 42501'` and `'ZERO ROWS'` partition the negative rows and **the two are different assertions** — the suite asserts a privilege error where the row says 42501 and an empty result where it says zero rows, and must never conflate them. The real proof is downstream in B22/B23.
**risk.** privacy. **wave.** W1.

#### C13 — the closed patient vocabulary · `src/contract/copy.ts` · ~120 lines
**purpose.** Every word the product may say to the patient with its spoken duration; the two banned lists; the copy limits. Frozen here rather than in domain because the blind test-writer may read only `src/contract/**` (D-7, D-8).
**api.**
```ts
export type CopyKey = 'notification' | 'ident.1' | 'ident.2' | 'saying.stem' | 'saying.full'
  | 'song' | 'answer_first' | 'rung0' | 'rung1' | 'rung2.question' | 'rung2.instruction'
  | 'rung3' | 'probe.intro' | 'probe.question' | 'probe.instruction' | 'probe.reveal'
  | 'month_target.full' | 'month_target.rung0' | 'interview.open' | 'interview.listening'
  | 'interview.cue1' | 'interview.cue2' | 'interview.close' | 'stop.label' | 'stop.spoken'
  | 'content_expired' | 'handover.first_name';
export interface CopyEntry { template:string; spokenMs:number; spoken:boolean; written:boolean; }
export const COPY: Readonly<Record<CopyKey, CopyEntry>>;      // the §7.3 table, verbatim
export const BANNED_PATIENT_WORDS: readonly string[];          // the §7.4 list, verbatim
export const BANNED_CLAIM_RULES: readonly { rule:number; pattern:RegExp; source:string }[];
export const COPY_LIMITS: { maxPromptWords: 8; maxSentenceWords: 15; maxLines: 2 };
export const MASK_GLYPH: '—';                                  // em-dash, never an underscore
```
**deps.** none.
**spec.** DESIGN-SYSTEM §7.1 (the ten rules), §7.2 (right and wrong on every string), §7.3 (the complete vocabulary — transcribe), §7.4 (banned outright), §12.6 A33–A37; SYNTHESIS §2.2 (the 15 numbered banned claims, including rule 15's "~6-month delay in expected decline", *delete on sight*).
**blind test.** `Object.keys(COPY)` deep-equals the §7.3 table's row set. Every template passes the banned-word check case-insensitively on **word boundaries**, so `'contapt'` does not match `'tap'`. Every prompt ≤ 8 words, every sentence ≤ 15. Zero `!` anywhere. Zero `?` in `rung3`, `month_target.*`, `interview.close`, `stop.spoken`, `content_expired`. The §7.2 forbidden sentences — "I love this one", "Well done!", "Are you still there?", "Tap the picture", "Session complete", "Please reconnect this tablet", "Good morning", "It's me" — are absent from every template. `BANNED_CLAIM_RULES` has one entry per numbered §2.2 claim, each with a positive fixture drawn verbatim from the source.
**risk.** safety. **wave.** W1.

#### C14 — the programme timetable and timing floors · `src/contract/programme.ts` · ~150 lines
**purpose.** The frozen §9.1 zero-input table, the §6.3 dwell floors at all three enrolment steps, and every motion and input duration — as contract data so A38, A27 and A43 are assertable blind and there is exactly one definition (D-6).
**api.**
```ts
export type SegmentKind = 'ident' | 'saying' | 'song' | 'month_target' | 'face_card'
  | 'm02_card' | 'probe_intro' | 'probe_item' | 'interview' | 'signoff' | 'closedown'
  | 'content_expired' | 'handover_first_page';
/** Zero-input dwell per segment kind per rungDwellStep, ms. DESIGN-SYSTEM §9.1 + §4.1. */
export const SEGMENT_MS: Readonly<Record<SegmentKind, Readonly<Record<RungDwellStep, number>>>>;
export const TOTAL_ZERO_INPUT_MS_STANDARD: 593_500;
export const SESSION_BUDGET_MS: 600_000;
/** §6.3 dwell floors. Rung -1 = answer first; rung 3 = familiarity exposure. */
export const RUNG_SILENCE_MS: Readonly<Record<-1|0|1|2|3, Readonly<Record<RungDwellStep,number>>>>;
  // -1 {3000,3000,3000} · 0 {6000,8000,11000} · 1 {3500,5000,7000}
  //  2 {4500,6000, 8000} · 3 {4000,4000, 4000}
export const WITHDRAWAL_MS: 1200;
export const SPEECH_GATE_RESTART_MS: 1500;
export const SPEECH_GATE_MAX_EXTENSION: 3;
export const REPLAY_CEILING_MS: 60_000;
export const INPUT_LOCKOUT_MS: 400;
export const MOTION_MS: { crossDissolve:600; captionWithdraw:1200; ackIn:100; ackHold:200;
  ackOut:200; demoRise:300; demoHold:600; demoFall:300; demoGap:400; demoLoop:4000 };
export const ALLOWED_DURATIONS_MS: readonly [100,200,300,600,1200,4000];
export const TONE: { ms:180; attackMs:40; fundamentalHz:220; lufs:-16 };
export const PROBE_BLOCK_CAP_MS: 120_000;
export const PROBE_MAX_ITEMS: 8;
export const CAMP_CARDS: Readonly<Record<RungDwellStep, number>>;   // {short:6, standard:6, long:5}
export const M02_CARD_MS: 13_900;
export const NOTHING_TODAY_CARDS: 6;
export const HANDOVER_FIRST_PAGE_MS: 5_000;
export const BATTERY_TRUNCATE_PERCENT: 25;
```
**deps.** C01.
**spec.** DESIGN-SYSTEM §9.1 (the executable zero-input table), §8.2 (session order and both variations), §6.3 (dwell floors), §6.4, §6.6, §4.1 (`patientTiming`, `patientMotion`, `patientSound` — the literal source of every number above), §8.7, §8.9, §9.2, §11.5, §12.5 A27.
**blind test.** The §9.1 composition at `standard` — `ident + 2×saying + song + month_target + 6×face_card + probe_intro + 6×probe_item + interview + signoff` — sums to **593 500 ms ± 500**, transcribed from §9.1 and asserted against `SEGMENT_MS`. One unanswered face card decomposes as `8900 + 1200 + 11000 + 6900 + 12300 + 9900 = 50 200`, asserted against `RUNG_SILENCE_MS` plus the spoken durations on C13's rows. At `long`, `CAMP_CARDS === 5` and the composed total stays `< 600 000`. `ALLOWED_DURATIONS_MS` contains every value in `MOTION_MS` and nothing else (A27). `RUNG_SILENCE_MS[0].standard === 8000`, `[1].standard === 5000`, `[2].standard === 6000`, matching §6.3's printed column; `[-1]` and `[3]` are constant across steps (DEFECT-4).
**risk.** safety. **wave.** W1.

#### C15 — fixture row types and the fixture manifest · `src/contract/fixtures/types.ts` · ~110 lines
**purpose.** The row shape of every fixture file and the manifest of which file exercises which frozen export, so the test-writer authors data and the runner loads it without either side inventing a format.
**api.** `GradeFixtureRow`, `CueTransitionFixtureRow`, `AcrossTransitionFixtureRow`, `SessionFixture`, `DecisionTableRow`, `HelperFixtureRow`, `WalkFixture`, `FixtureManifestEntry`, `FIXTURE_MANIFEST` (SCHEDULER-SPEC §23, verbatim), and `unreachable(row): boolean` — SCHEDULER-SPEC §23's five-clause predicate implemented **mechanically**, so both agents label the identical subset. `unreachable` is an informational label and **never a missing value**: `cueTransition` is total and all 384 rows carry a full expected result.
**deps.** C01, C02, C03, C04, C05, C14.
**spec.** SCHEDULER-SPEC §23 (the manifest table and the `unreachable` predicate), §7.2, §9.4, §13.2, §18, §19.
**blind test.** Row counts match the manifest exactly: `grades.json` 128, `cue-transitions.json` 384, `across-transitions.json` 756, `decision-table.json` 80, `ordering/out-of-order-batches.json` 3, `sessions/no-op-seq.json` 10. **The intersection of the manifest's `exercises` column with SCHEDULER-SPEC §21.1 is total in both directions** — every one of the 27 frozen names is exercised by at least one file and no file names a non-export. Every fixture JSON parses against its declared row type.
**risk.** correctness. **wave.** W1.

#### C16 — in-memory fakes · `src/contract/testing/fakes.ts` · ~280 lines
**purpose.** A fake for every port, so unit and component tests run with zero mocks and full determinism.
**api.** `makeMemoryDb(seed?)`, `makeMemoryOutbox()`, `makeMemoryMediaStore()`, `makeMemorySecureStore()`, `makeFixedClock(nowMs, monoMs)` with `advance(ms)`, `makeSeededRng(seed)`, `makeFakeDigest()` (deterministic, non-cryptographic, tests only), `makeScriptedNet(script)`, `makeFakeAudio()`, `makeFakeVad(windows)`, `makeFakeBattery(level)`.
**deps.** C10.
**spec.** ADR-PLATFORM §6.1, §6.3 (zero mocks; everything injected).
**blind test.** Each fake is the subject of C17's suites. The fixed clock and seeded rng make any test using them byte-reproducible — asserted by running a walk twice and hashing the emission stream.
**risk.** correctness. **wave.** W1.

#### C17 — port conformance suites · `src/contract/testing/conformance.ts` · ~300 lines
**purpose.** Exported behavioural suites that any implementation of a port must pass. **This is what makes two `Db` implementations safe and the in-memory fake trustworthy everywhere else.**
**api.** `describeDbPort(make)`, `describeOutboxPort(make)`, `describeMediaStorePort(make, caps)`, `describeSecureStorePort(make)`, `describeNetPort(make)`, `describeAudioPort(make)`.
**deps.** C10, C16.
**spec.** ADR-PLATFORM §6.1, §6.3 (two implementations, not three); ADR-DATA §6.4, §6.8.
**blind test.** The suites *are* the test, so their correctness is proved two ways: they pass against C16's fakes and against A01/A03, and they **fail on the named assertion** against a deliberately broken stub. The named cases: `peekBatch` returns strictly ascending `seq` for one device and **never skips ahead of an unACKed row** (it truncates the batch instead); a row survives `ackAccepted` of a different id; `enqueue` is atomic with a caller-supplied write, so aborting the transaction loses both the event and the state change or neither; a download whose bytes hash differently returns `'hash_mismatch'` and leaves no file; `purge` returns whether a file existed; `nextBootOrdinal` is strictly increasing across simulated cold starts, never 0, and survives a database wipe; `setDeviceCredential` on a passcode-less device throws `PasscodeRequiredError`; a `'revoked'` sync result is distinguishable by the caller from `'unavailable'`; `Vad` emits only booleans and exposes no transcript surface.
**risk.** correctness. **wave.** W1.

#### C18 — fixture sign-in · `src/contract/testing/supabase.ts` · ~50 lines
**purpose.** Gives the blind test-writer a real token against seeded fixture data with no implementation knowledge — the helper that closes the last hole in the blind-agent contract.
**api.** `signInAsFixtureDevice(client, 'device-a'|'device-b'|'device-shared')`, `signInAsFixtureUser(client, 'caregiver'|'carehome_admin'|'researcher'|'trial_ops', label)`, `export const fixtureIds: Readonly<Record<string,string>>` — the documented deterministic uuids of `supabase/seed.sql`.
**deps.** none (types only).
**spec.** ADR-PLATFORM §6.1 ("closes the last hole" — four lines of `signInWithPassword`); ADR-DATA §15 (the seed paragraph).
**blind test.** Against a started local Supabase with `seed.sql` applied: the returned token decodes to `app_metadata.role === 'device'` and the correct `device_id`; a second call is idempotent; `fixtureIds` resolves every scenario named in ADR-DATA §15.
**risk.** correctness. **wave.** W1.

---

### LAYER S — THE SCHEDULER · `src/domain/scheduler/`

25 modules for a 3 339-line frozen specification that already names 27 exports and 18 fixture files. **The decomposition is the specification's own**; it invents no unit. Every module is pure, integer-only, and imports nothing outside `src/contract/**`.

#### S01 — integer arithmetic · `arithmetic.ts` · ~35 lines
**purpose.** The five pure integer primitives every other scheduler rule is built from.
**api.** `clamp(x, lo, hi)`, `clampGap(x, clockMaxGapMs)`, `gapBinds(x, clockMaxGapMs)`, `localDayIndex(anchorMs, tzOffsetMinutes)`, `median(xs: readonly number[])`.
**deps.** none.
**spec.** SCHEDULER-SPEC §1.1 (arithmetic discipline), §1.3 (`clampGap`, `gapBinds`, and the explicit statement that both are **pure and increment nothing**), §1.4 (`localDayIndex` and the standard-time decision), §17.1 (`median`, TOTAL: `median([]) === 0`).
**blind test.** `helpers.json`: both `clampGap` bounds and the negative branch (a backwards clock reads as **zero** elapsed, never negative); `gapBinds` at exactly `0`, at `clockMaxGapMs` and at `clockMaxGapMs + 1`; `localDayIndex` at `tzOffsetMinutes ∈ {−720, 0, 840}` and across a pre-1970 anchor where `Math.floor` of a negative operand matters; `median` odd, even, singleton and **empty → 0** (never `NaN`, never throws). Property: `clampGap` output always satisfies `Number.isInteger` and lies in `[0, clockMaxGapMs]`.
**risk.** correctness. **wave.** W2.

#### S02 — objective grading · `grading.ts` · ~30 lines
**purpose.** Turn one attempt into a grade, and decide when a trial is too contaminated to drive any transition.
**api.** `gradeOf(a: Attempt, slowLatencyMs: number): Grade`, `isVoid(a: Attempt, minPlausibleLatencyMs: number): boolean`.
**deps.** C01, C03.
**spec.** SCHEDULER-SPEC §7.1 (exact and total, with `EXPOSURE` checked **first and unconditionally**, the strict `>` comparison, and the rule that a rescue attempt can never grade `CLEAN`), §7.2 (fixture obligation), §7.3 (`isVoid` and what a VOID trial does and does not update).
**blind test.** `grades.json` is **exhaustive, not sampled**: `correct{2} × cueLevel{4} × latencyMs{0,299,300,1,7999,8000,8001,30000} × attemptIndex{0,1}` = **128 rows**, all with `interrupted:false, appBackgroundedMs:0`. Both functions are total over the declared types, so the table *is* the specification and there is no untested input. Boundaries pinned: `8000` is `CLEAN`, `8001` is `SLOW`; `299` is void, `300` is not.
**risk.** safety. **wave.** W2.

#### S03 — the only constructor · `initial-state.ts` · ~25 lines
**purpose.** Build the pinned initial `SchedulerState` from a config, never throwing and never validating.
**api.** `initialState(config: SchedulerConfig): SchedulerState`.
**deps.** C02, C04.
**spec.** SCHEDULER-SPEC §2.2 (the complete pinned output), §2.3 (`initialState` never throws and never validates `config`).
**blind test.** `helpers.json`: `initialState(defaultConfig)` deep-equals the §2.2 literal field for field; `state.config === config` **by reference** (stored, never copied); `items` and `seqHighWater` are `{}` and not `undefined`; `probeDisabled` is `false`; a malformed config still returns without throwing.
**risk.** correctness. **wave.** W2.

#### S05 — the two-alternative foil · `foil.ts` · ~30 lines
**purpose.** Choose the foil deterministically, with `recognitionBlocked` people excluded from every pool. **This is the module where a defect surfaces a widow's dead husband as the wrong answer**, which is why it is alone.
**api.** `foilFor(state: SchedulerState, targetItemId: ItemId): ItemId | null`.
**deps.** C01, C04.
**spec.** SCHEDULER-SPEC §9.5 (the exact pool filter, the `strAsc` sort, the `trialsCompleted mod pool.length` index, and "Zero `Rng` calls"), §15.3 clause 3; declared deviation **D-5** of this manifest (§8.5.3's `shuffle` is overruled; its filter set is applied by R09 at presentation time).
**blind test.** `presentation.json`: the pool is same-tier, `status === 'active'`, `contentReady`, `!recognitionBlocked`, `itemId !== target`; an empty pool returns `null` (which §9.1 rewrites to cue 3 — E32); the ordering is `strAsc` on `itemId` so the result is single-valued; calling twice on the same state returns the same foil. **Invariant I-7 over an exhaustive deck enumeration: a `recognitionBlocked` item is never returned, for any target, in any state.** Structural: the module makes zero `Rng` calls and imports nothing that could.
**risk.** safety. **wave.** W2.

#### S07 — the cue transition table · `cue-transition.ts` · ~55 lines
**purpose.** The five-arm total function deciding whether and how a trial rewrites an item's cue floor.
**api.**
```ts
export function cueTransition(input: { floor:CueLevel; openingCue:CueLevel;
  trialClass:TrialClass; grade0:Grade; cueRaisedThisSession:boolean }):
  { cueLevel:CueLevel; writesCueLevel:boolean; stableSessionsReset:boolean;
    vanishResolved:boolean; cueRaisedThisSession:boolean };
```
**deps.** C01.
**spec.** SCHEDULER-SPEC §9.4 — the five arms **checked in the stated order**, with row counts `32 + 96 + 32 + 32 + 192 = 384`; the pinned rule that "no cue change" means `item.cueLevel` **IS NOT WRITTEN**, which is why `writesCueLevel` exists; the note that `openingCue` is an input of the signature and is **read by no arm** (it is carried only so the fixture can compute §23's `unreachable` label); §18.1's extension table.
**blind test.** `cue-transitions.json` — all **384 rows** of the exhaustive cross-product `4 × 4 × 3 × 4 × 2`, each carrying all five output values and the mechanical `unreachable` label from C15. The test-writer asserts the arm **partition** (32/96/32/32/192) before asserting a single value. Two rows differing only in `openingCue` have identical results. Arm 1's `max(f−1, 0)` is exercised at `f === 0` (an `unreachable: true` row the function must still answer). Arm 2 covers `VANISH + EXPOSURE`. Arm 5 writes **nothing** — neither `cueLevel` nor `stableSessions`.
**risk.** safety. **wave.** W2.

#### S08 — session outcome for one item · `outcome.ts` · ~30 lines
**purpose.** Reduce one item's counted trials to a single session outcome, in exactly the six-step order.
**api.** `outcomeFor(trials: readonly CountedTrial[]): SessionOutcome`.
**deps.** C01, C04.
**spec.** SCHEDULER-SPEC §13.1 — the `VANISH` filter applied **first**, then the six steps checked in exactly that order, with the reasoning for why **step 4 (`SUPPORTED_SESSION`) must precede step 5 (`EXPOSURE_SESSION`)**: it is what closes the DLB cue ratchet.
**blind test.** `outcome.json` ~40 cases exercising the six-step order, with a dedicated block proving step 4 precedes step 5 (all-`EXPOSURE` trials of `SUPPORTED` class classify `SUPPORTED_SESSION`, not `EXPOSURE_SESSION`); `VANISH` trials filtered out before step 1; an empty array → `NO_EVIDENCE`; an item whose own floor is 3 reaches step 5 and yields `EXPOSURE_SESSION`, which is how a degraded item still recovers.
**risk.** safety. **wave.** W2.

#### S09 — the across-session ladder transition · `across-transition.ts` · ~40 lines
**purpose.** The single site in the whole design where an across-rung advances or contracts, with the tier ceiling binding.
**api.**
```ts
export function acrossTransition(input: { tier:Tier; acrossRung:Rung; stableSessions:number;
  outcome:SessionOutcome; vanishResolved:boolean }, config: SchedulerConfig):
  { acrossRung:Rung; stableSessions:number };
```
**deps.** C01, C02, C04.
**spec.** SCHEDULER-SPEC §13.2 (the six-row table and the rationale for each hold), §13.4 (the contraction proof), requirement 3 (ceilings).
**blind test.** `across-transitions.json` — all **756 rows** (`3 tiers × 7 rungs × 6 outcomes × 2 vanishResolved × 3 driftLevels`) with entering `stableSessions` fixed at 0, each row also carrying the derived `dueOffsetMs`. **Invariant I-4(a) holds in every row: `0 <= acrossRung <= ceilingRung[tier]`.** `vanishResolved` suppresses the `stableSessions` increment on both `CLEAN_SESSION` and `EXPOSURE_SESSION`. `MISSED_SESSION` contracts regardless of support level.
**risk.** safety. **wave.** W2.

#### S13 — the probe-due predicate · `probe-due.ts` · ~20 lines
**purpose.** Decide from the fold's own state whether the probe block is owed — never from a device-supplied flag.
**api.** `probeDue(state: SchedulerState, nowMonoMs: number): boolean`.
**deps.** C04.
**spec.** SCHEDULER-SPEC §16 (the five conjuncts, and that eligibility is decided from `lastProbeLocalDay`, computed from the anchored timestamp and the frozen `tzOffsetMinutes`, never from an untrusted device clock).
**blind test.** `next-trial.json`: each of the five conjuncts falsified one at a time — empty `probeItemIds`, `probeDisabled`, `probeEmitted`, `lastProbeLocalDay === session.localDayIndex`, and elapsed below `floor(sessionMaxMs / 2)` with probe time subtracted. Two sessions on one local day: the second gets no probe (E28). Structural: probe ids can never enter `state.items` (rule R8, WE-22).
**risk.** correctness. **wave.** W2.

#### S14 — the guaranteed-success closer · `closer.ts` · ~30 lines
**purpose.** Pick the held P1 closer item, or `null` meaning the generic shipped closer.
**api.** `closerItemId(state: SchedulerState): ItemId | null`.
**deps.** C01, C04.
**spec.** SCHEDULER-SPEC §10.2 (the pool, the `recognitionBlocked` de-preference with fallback, the `sessionCount mod pool.length` **rotation**, and the empty-pool → `null` case).
**blind test.** `next-trial.json`: an empty or fully-degraded pool returns `null` (no `min` over an empty set — E17); `recognitionBlocked` items are de-preferred but are used when nothing else qualifies; **three consecutive `sessionCount` values yield three different items**, which is the repair that stops a dead spouse becoming a deterministic daily fixation; a `retired` or `absorbing_distress` item is never returned.
**risk.** safety. **wave.** W2.

#### S23 — per-session telemetry · `session-telemetry.ts` · ~35 lines
**purpose.** Produce the nine per-session scheduling fields, returning `null` iff there is no active session.
**api.** `sessionTelemetry(state, reason: SessionEndReason, closerPresented: boolean): SessionSchedulingTelemetry | null`.
**deps.** C04, C05.
**spec.** SCHEDULER-SPEC §17.4 (the nine fields and the function, verbatim; the stated caller obligation to call it **before** folding the `SessionEnded`).
**blind test.** `telemetry.json`: returns `null` when `activeSession === null` — the honest answer when the caller obligation is violated; `endedOnSuccess === closerPresented` exactly, in both directions (I-16); `completedNItems` counts roster entries with `trialsThisSession >= 1`; `nFillersShown` is `activeSession.fillersShown` — **WE-5's value is 5, not 1, and must be re-derived from §10's picker rather than transcribed** (SCHEDULER-SPEC §23 raises this as a fixed defect and it is the pattern to follow). Pure: mutates nothing, increments nothing.
**risk.** correctness. **wave.** W2.

#### S04 — the gentleness transforms · `gentleness.ts` · ~55 lines
**purpose.** The three elapsed- and drift-aware transforms that add support at presentation time without ever mutating item state.
**api.**
```ts
export function effectiveAcrossRung(item: Pick<ItemState,'tier'|'acrossRung'>,
  driftLevel: 0|1|2, config: SchedulerConfig): Rung;
export function overdueReturn(item: Pick<ItemState,'tier'|'acrossRung'|'lastSeenAtMs'>,
  sessionStartAnchorMs: number, driftLevel: 0|1|2, config: SchedulerConfig): boolean;
export function canVanish(state: SchedulerState, entry: RosterEntry): boolean;
```
**deps.** C01, C02, C04, S01.
**spec.** SCHEDULER-SPEC §9.2 (`overdueReturn`, PURE, increments nothing; a never-presented item is `false`), §9.3 (the nine-conjunct unified vanishing rule and why the **deck-wide** cap is load-bearing; `config.vanishPerSession` is **read by no rule** — the cap is `!session.vanishUsed` and the boolean's shape *is* the cap), §12.2 (`effectiveAcrossRung`, with the ceiling itself contracting under drift).
**blind test.** Exhaustive over the finite domain `3 tiers × 7 rungs × 3 driftLevels` for `effectiveAcrossRung`, asserting **I-15(c): `effectiveAcrossRung(item, d+1) <= effectiveAcrossRung(item, d)`**. `presentation.json` and WE-7 (the hospital return) for `overdueReturn`, including the purity assertion that it increments no counter. `canVanish` falsified **one conjunct at a time** across all nine, with **I-15(b)**: it is false whenever any of `driftAtStart > 0`, `gentleActive` or `entry.overdueReturn` is set.
**risk.** safety. **wave.** W3.

#### S10 — progression drift · `drift.ts` · ~50 lines
**purpose.** The bounded, symmetric, fluctuation-aware global drift level that surfaces to nobody. **Subject to ESCALATION C-1 (§2.5).**
**api.** `evaluateDrift(history: readonly SessionSummary[], anchorMs: number, driftLevel: 0|1|2, config: SchedulerConfig): 0|1|2`.
**deps.** C02, C04, S01.
**spec.** SCHEDULER-SPEC §14 (the window definition with its **three-key sort including `historyIndex`**, the `|W| < driftMinSessions` short-circuit, the `bad*2 > |W|` and `bad*4 <= |W|` arms, and the tail condition); SYNTHESIS §6 requirements 10 and 11.
**blind test.** `drift.json` ~40 cases: history below and at `driftMinSessions`; **2 versus 3 consecutive bad sessions** — the constant that stops DLB fluctuation being read as decline, and the one invented constant whose wrong direction is genuinely harmful; recovery in both directions; the `bad*2 > n` boundary at `n = 6` and `n = 7`; non-qualifying entries excluded from the window; a duplicate `sessionId` made harmless by the third sort key (E47). Property: output always in `{0,1,2}` and no single added summary moves it by more than one step. **Structural: no exported getter for `driftLevel` exists anywhere (I-8).**
**risk.** safety. **wave.** W3.

#### S11 — the acute-change detector · `acute-change.ts` · ~65 lines
**purpose.** The model-free three-limb P25 detector, returning a limb or `null` and acting on nothing. This is the only output of the scheduler that reaches a human, and it gates a treatable medical emergency.
**api.** `acuteChange(state: SchedulerState, nowAnchorMs: number): 'support'|'miss'|'absence'|null`.
**deps.** C02, C04, S01.
**spec.** SCHEDULER-SPEC §17.1 in full — the `acuteSignalEnabled` kill switch checked first, the rate limit against `acuteLastFiredAtMs`, the recent/base window definitions, limb 1 (support **before** miss, both inside the same guard), limb 3 (absence), and the reasoning for why the support index survives the engine's own masking; SYNTHESIS P25, §8 S7.
**blind test.** `acute.json` ~25 cases: each of the three limbs firing alone; **the WE-14 self-masking case** — a delirium-shaped crash whose miss limb is defeated by the engine's own difficulty floor while the support limb survives; even and odd `median` including singleton and empty; the 14-day rate limit; `acuteSignalEnabled: false` returning `null` unconditionally. **Purity: called twice on the same state it returns the same value, mutates nothing, and in particular never increments `clockAnomalyCount` despite calling `clampGap`** (§1.3, E46).
**risk.** safety. **wave.** W3.

#### S06 — presentation resolution · `presentation.ts` · ~50 lines
**purpose.** Resolve what one roster entry is actually shown as: opening cue, floor, trial class and foil.
**api.** `resolvePresentation(state, entry): { openingCueLevel; floorCueLevel; trialClass; foilItemId }`.
**deps.** C01, C04, S04, S05.
**spec.** SCHEDULER-SPEC §9.1 (the exact pseudocode: `recognitionBlocked` checked **FIRST**, then the disjoint vanish and transform branches, then the `c === 2 && foil === null → c = 3` rewrite, then the `trialClass` derivation from `c` versus `f`), §9 (the four-rung table).
**blind test.** `presentation.json` ~35 cases: `recognitionBlocked` takes precedence over everything and returns 3 unconditionally; the vanish branch and the transform branch are provably **disjoint** because `canVanish` requires all three transforms clear; each of the three transforms and their clamping at 3; the empty-foil-pool rewrite (E32, exercised by `it_0555` in the canonical deck). **I-15(a): `openingCueLevel` is monotone non-decreasing in `gentleActive`, in `entry.overdueReturn` and in each increment of `driftAtStart`** — decidable by exhaustive enumeration over the finite domain, no log generation required.
**risk.** safety. **wave.** W4.

#### S12 — roster planning · `plan-roster.ts` · ~70 lines
**purpose.** Deterministically select and order the session's items, with no backlog representable anywhere.
**api.** `planRoster(state: SchedulerState, nowAnchorMs: number): RosterPlan`.
**deps.** C04, C05, S01, S04.
**spec.** SCHEDULER-SPEC §11 (the exact picker, `isForced`, the six-component `PRIORITY_KEY`, and that fresh items hold **reserved slots** and are never squeezed out), §11.1 (**the exact length formula — `min(8, |freshAllowed| + |returning|)`; the previous `min(8, |eligible|)` is withdrawn and a blind test must assert the former**), §11.2 (the tier-1 floor and its honest limit), §11.3 (the first-session ramp table).
**blind test.** `roster-order.json` ~30 cases: all-due, none-due, exactly one due, forced tier-1 overflow producing `forcedMissing`, fresh-item reservation, the first-session cap of 2 over a 10-item all-fresh deck (roster length **2**, not 8), `contentReady === false` exclusion, `status !== 'active'` exclusion, and the `it_10 < it_9` tie-break proving the ordering is `strAsc` on `itemId` and not numeric. Property: `itemIds.length <= sessionMaxItems`, no duplicates, `forcedMissing` ascending, and calling twice returns an identical array. **Structural: the module exports no count of due, overdue or pending items — there is nothing a UI could render even by accident (I-8).**
**risk.** safety. **wave.** W4.

#### S17 — the session close pipeline · `session-close.ts` · ~130 lines
**purpose.** The **twelve**-step close pipeline (S0–S11) that writes every item's ladder, the summary, the drift level and the whole deck's due dates, in exactly the stated order.
**api.** `closeSession(state, args: { sessionId; reason: SessionEndReason; closerPresented: boolean; anchorMs: number }): SchedulerState`.
**deps.** C04, S04, S08, S09, S10.
**spec.** SCHEDULER-SPEC §12.2 — **steps S0 through S11, twelve steps, in this exact order**, including S1's second disjunct (`activeSession.endRequested === 'distress_stop'` forces the distress branch whatever reason the `SessionEnded` carries), S6's unconditional push, S7 firing on distress **regardless of item count**, S8's drift evaluation after the S6 push, S10's use of the **post-**S8 drift level over **every** item, and S11 setting `activeSession = null`; §12.3 (`endedOnSuccess = (event.closerPresented === true)`, the whole rule).
**blind test.** The **order is observable and must be asserted**: S3 mutates `cueLevel` before S5 reads it for `supportIdxMilli`; S6 pushes unconditionally including for a distress abort; S8 precedes S10 so `dueAtMs` uses the post-drift level; S1's second disjunct forces the distress branch even under `reason:'app_crash'` (E36). Chained `sessions/*.json` WE-2 → WE-3 → WE-4 → WE-5, each starting from the previous file's asserted final state, with `seqHighWater.d1` pinned at **129 / 158 / 188 / 208**. **I-4(b) is a postcondition of exactly this function and not a state invariant** — every item satisfies S10's own formula after a close, and WE-29 shows why asserting it as a state invariant is a defect in the test.
**risk.** safety. **wave.** W4.

#### S18 — the non-session event effects · `reduce-items.ts` · ~85 lines
**purpose.** Apply the eight non-session events to the item map and the participant record, including the deliberate full reset on re-enable.
**api.** `reduceItemEvent(state, event: Extract<SchedulerEvent, {type:'ItemAdded'|'ItemContentReadyChanged'|'ItemTierSet'|'ItemRecognitionBlockSet'|'ItemRetired'|'ItemReEnabled'|'ProbeDisabledSet'|'AcuteSignalDelivered'}>): SchedulerState`.
**deps.** C02, C04, C03, S04.
**spec.** SCHEDULER-SPEC §6.5 (the per-event effect table, verbatim, including `ItemAdded`'s complete insert literal and `ItemReEnabled`'s unconditional full reset with the five fields it does **not** touch), §6.4 rules R5, R8, R10 and the five scope decisions beneath them, and the note that non-session events during an open session are applied immediately and **do not touch the roster**.
**blind test.** Per-event fixtures. `ItemAdded` inserts `cueLevel: 3` iff `tier === 1 || recognitionBlocked` else `2`, with `dueAtMs === addedAtMs === anchorMs` (E26, so there is no coercion ambiguity and no 40-item first session). An `ItemAdded` naming an id in `config.probeItemIds` is **dropped** (R8, WE-22, E41). `ItemReEnabled` resets an already-active item (E38, WE-20) and leaves `tier`, `recognitionBlocked`, `contentReady`, `addedAtMs`, `lastSeenAtMs` and `repetitionNumber` untouched. `ItemTierSet` clamps `acrossRung` to the new ceiling **then** recomputes `dueAtMs` (E30). `ItemRecognitionBlockSet{true}` forces `cueLevel = 3` immediately.
**risk.** safety. **wave.** W4.

#### S19 — the trial fold · `reduce-trial.ts` · ~140 lines
**purpose.** Fold one `TrialCompleted`: the void path, the within-ladder move, the cue write, and the exhaustively-closed closer delta.
**api.** `reduceTrial(state, event: Extract<SchedulerEvent,{type:'TrialCompleted'}>): SchedulerState`.
**deps.** C04, C03, S02, S07.
**spec.** SCHEDULER-SPEC §7.3 (a VOID trial updates **exactly two things** plus `lastPresentedItemId`), §8.2 (cue-3 openings close the item out unconditionally), §8.3 (the two-row within-ladder table, the single `withinDone` rule, and the "and always" list), §9.4 (the mechanical `reduce` block, and the **authority table** naming which payload field each rule reads and which it never reads), §10.2 (**the closer's state delta, complete and closed** — five things and nothing else; `isVoid` is not consulted; a null closer produces no `TrialCompleted` at all), §6.4 rules R6, R7, R11.
**blind test.** `decision-table.json` — the 72 rows of §18 plus the 8 of §18.1. WE-15 (the doorbell: a void trial updates only `repetitionNumber` and `nextEligibleMonoMs`). WE-25 (a closer sets only `closerEmitted`, `lastPresentedItemId` and `repetitionNumber`). **WE-27, both variants: a disagreeing `floorCueLevel` does NOT rewrite the floor on a non-MISS trial (arm 5, `writesCueLevel:false`), and DOES write `min(floorCueLevel+1,3)` on a MISS (arm 3), which can be a two-rung rise and is correct** (E54). WE-19: a trial naming a set-aside item is a total no-op (R11). WE-23: `openingCueLevel: 3` with `attempts[0].cueLevel: 1` grades `MISS`, raises the floor, **and** sets `withinDone = true` — single-valued, not a contradiction.
**risk.** safety. **wave.** W4.

#### S22 — per-trial telemetry · `trial-telemetry.ts` · ~110 lines
**purpose.** Produce the scheduling-state group of the §7 interaction row for one presentation, pre-increment, across all four branches, never throwing.
**api.** `trialTelemetry(state, directive: Extract<TrialDirective,{kind:'TRIAL'}|{kind:'CLOSER'}>, nowAnchorMs: number, nowMonoMs: number): TrialSchedulingTelemetry`.
**deps.** C04, C05, S01, S04.
**spec.** SCHEDULER-SPEC §17.3 in full — the complete four-branch decision procedure, the **(P)** presentation-field rule identical in all four branches, the BRANCH 3 item-derived shape, the all-null shape, and the four notes: **a closer naming a real item is BRANCH 3, not branch 2**; `floorCueLevel` on such a closer is `item.cueLevel`, not 3; `withinIntervalDeviationMs` on a closer is the ordinary formula measured against the **stale** `nextEligibleMonoMs`; and `repetitionNumber` is **PRE-increment on every branch**. Also: `scheduledIntervalMs` is always integer ms and there is no `scheduled_interval_days`; the two deviation fields are **not** gap-clamped; the two `daysSince*` fields **are**; and none of the three moves `clockAnomalyCount` because the function is pure.
**blind test.** `telemetry.json` covering all four branches: a real `TRIAL` (WE-24 — `it_0042` reports `repetitionNumber: 32` after two folded trials while about to be presented for its third); a **`CLOSER` naming a real item** (WE-25, branch 3, `openingCueLevel: 3` with `floorCueLevel: 2`); `CLOSER{itemId:null}` (branch 2, the all-null shape); `activeSession === null` (branch 1); a directive naming an id absent from `state.items` (branch 4). Every `presentationMode` / `nDistractors` pair. The four model fields are `null` by construction. Purity asserted by a structural clone diff of `state` before and after (I-11).
**risk.** correctness. **wave.** W4.

#### S15 — the trial picker · `next-trial.ts` · ~95 lines
**purpose.** The single directive-producing query: what does the runtime show right now.
**api.** `nextTrial(state: SchedulerState, nowMonoMs: number): TrialDirective`.
**deps.** C04, C05, S06, S13, S14.
**spec.** SCHEDULER-SPEC §10 — the candidate filter, then the six numbered steps in order (end resolution with distress outranking every budget; closer then end, with the three reasons that skip the closer; probe; the interleaving guarantee; readiness; the four-component strict total order), §10.1 (`FILLER` and why it exists), §10.2 (`closerItemId`), §15.1 (the precedence table); and the three consequences of `nextTrial` holding no memory between calls — **`PROBE_BLOCK` repeats until completed, deliberately, and does not hang the session**; `nowMonoMs` is trusted absolutely and nothing is clamped or validated; and the bootId obligation is the caller's (E49).
**blind test.** `next-trial.json` ~40 cases walking the six steps: within-ladder readiness and the early-presentation branch; the back-to-back guard (**I-14**: never `TRIAL` with `itemId === lastPresentedItemId` while any other candidate exists); `FILLER` on a one-item roster and the `sessionMaxFillers` cap; **two consecutive identical calls both returning the identical `PROBE_BLOCK`** (E40); `CLOSER(null)` on a fully-degraded deck (E17); every end reason; distress beating `budget_time`. Single-valued because the sort key ends in `itemId`. Purity by structural clone diff (I-11).
**risk.** safety. **wave.** W5.

#### S16 — session open · `session-open.ts` · ~60 lines
**purpose.** Build the ephemeral `ActiveSessionState`, taking the gentleness and drift **snapshots** that fix the session's presentation policy for its whole duration.
**api.** `openSession(state, event: Extract<SchedulerEvent,{type:'SessionStarted'}>): SchedulerState`.
**deps.** C04, C03, S01, S04, S12.
**spec.** SCHEDULER-SPEC §12.1 (the four numbered steps in order, including step 2's long-absence gentleness rule and `newRosterEntry`'s `overdueReturn` snapshot), §8.3 (the roster-entry initialisation block including `withinRung = clamp(withinStartRung − driftAtStart, 0, 6)`), §3.2 (snapshot semantics — `gentleActive` and `driftAtStart` are **never re-read** from `participant`).
**blind test.** `sessions/*.json` WE-2 step 1 and WE-5: a gap `> longAbsenceMs` raises `gentleSessionsRemaining` to at least 1 (E24); `gentleActive` and `driftAtStart` are snapshots and changing `participant` mid-session changes no presentation; the roster is fixed here and **never recomputed** (§6.5 — an `ItemAdded` mid-session is invisible for the rest of that session, E42); the long-absence check is one of only two `clampGap` sites reachable from `reduce`, so it is one of only two that can move `clockAnomalyCount`.
**risk.** safety. **wave.** W5.

#### S24 — the signals query · `signals.ts` · ~35 lines
**purpose.** The module's entire human-facing output: three signal kinds, in one fixed order, recomputed on demand, none of them a performance statement about the person.
**api.** `signals(state: SchedulerState, nowAnchorMs: number): readonly SchedulerSignal[]`.
**deps.** C04, C05, S11, S12.
**spec.** SCHEDULER-SPEC §17.2 (the exact pseudocode — it **calls `planRoster`** and pushes `tier1_floor_unsatisfied` from `plan.forcedMissing`, then `items_set_aside` from `status === 'absorbing_distress'` ascending, then `acute_change_suspected`), §11.2 (the wording obligation on the caregiver surface), §15.1 (set-aside items are surfaced so silent disappearance is impossible by construction).
**blind test.** `signals.json` ~12 cases: empty; each kind alone; all three together in the fixed order (tier1, set_aside, acute); rate-limited and `acuteSignalEnabled:false` suppression. Never mutates (I-11). **No signal carries `driftLevel`, and none is a performance statement** — asserted by key enumeration over the union.
**risk.** safety. **wave.** W5.

#### S20 — the reducer · `reduce.ts` · ~170 lines
**purpose.** The total, never-throwing dispatcher: idempotency, crash recovery, the twelve no-op rules, distress, and the clock-anomaly counter.
**api.** `reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState`.
**deps.** C02, C04, C03, S01, S16, S17, S18, S19.
**spec.** SCHEDULER-SPEC §6.2 (R0 and **R1 unconditional**, plus the complete reference-equality contract: exactly one rule returns the input by reference), §6.3 (R2 crash recovery and the three holes it closes), §6.4 (R3–R12 and the five scope decisions — **R5 covers exactly five event types and `ItemAdded` is not among them**; R5 does **not** cover `DistressReported`), §6.5, §15.1 (the four numbered distress steps, `DistressReported`'s exemption from R5, and the repeat-report behaviour), §1.3 (`clockAnomalyCount` is `+1` per event, never per binding call).
**blind test.** `sessions/no-op-seq.json` — **10 rows, one no-op per rule, each asserting that `seqHighWater` still advances and that a NEW top-level object is returned** (WE-17, E33); only R0 returns by reference (I-2). WE-18: a `DistressReported` naming an unknown item **still ends the session**, still emits no closer, still forces the distress branch, still yields `gentleOnDistress` — only the absorb step is skipped (E34). WE-10: R2 closes an abandoned session through the full pipeline as `app_crash` with `closerPresented:false`. E45: a backwards clock binding `clampGap` nine times in one `SessionStarted` moves the counter by exactly **+1**. **I-17: `reduce` never throws for any `(state, event)` pair drawn from the declared types.**
**risk.** safety. **wave.** W6.

#### S21 — the fold · `fold.ts` · ~20 lines
**purpose.** Apply an already-canonically-ordered event array to an initial state, sorting nothing and validating nothing.
**api.** `fold(config: SchedulerConfig, events: readonly SchedulerEvent[]): SchedulerState`.
**deps.** S03, S20.
**spec.** SCHEDULER-SPEC §4, §6.1 (**the boundary obligation is explicitly NOT this module's job**; `fold` does not check it, does not sort and does not throw), §6.2 (ingest-order violations are tolerated, not detected, and the two failure shapes that result).
**blind test.** **I-3**: `fold(config, log) === log.reduce(reduce, initialState(config))`. **I-2**: duplicating every event in place yields a deeply-equal state. **I-19**: any permutation preserving each item's own trial order, keeping `SessionStarted` first and `SessionEnded` last and `seq` ascending per device, folds to a deeply-equal state — which is what makes §19's item-major logs legitimate fixture inputs (`we-2-permuted.json`). `ordering/out-of-order-batches.json` — WE-26's three cases, keyed to **`fold`**, asserting **the tolerated corruption in numbers** and not a repaired result: R0 silently drops a late-sorting event and can swallow a whole session with no trace, and R2 degrades an unclosed session to `app_crash`. **I-18**: state size is a function of the deck and the 90-entry history ring, never of the event count.
**risk.** safety. **wave.** W7.

#### S25 — the frozen barrel · `index.ts` · ~20 lines
**purpose.** Re-export exactly the 27 frozen names and nothing else, so that **the export list is itself the assertion**.
**api.** `export { acrossTransition, acuteChange, canVanish, clampGap, closerItemId, cueTransition, defaultConfig, effectiveAcrossRung, evaluateDrift, foilFor, fold, gapBinds, gradeOf, initialState, isVoid, localDayIndex, median, nextTrial, outcomeFor, overdueReturn, planRoster, probeDue, reduce, resolvePresentation, sessionTelemetry, signals, trialTelemetry }`.
**deps.** S01–S24, C02.
**spec.** SCHEDULER-SPEC §21.1 (the frozen list, **sorted by `strAsc`** — `acrossTransition` before `acuteChange`), and the note that `src/contract/schema.ts` is a separate module and is **not** part of this list.
**blind test.** **I-8**: `Object.keys(module).sort()` deep-equals the 27-name list transcribed from §21.1. Adding a `getDriftLevel`, a `dueCount`, an `overdueItems` or a `pendingItems` fails this test — freezing the list *is* the assertion. **I-10(a)**: the built source contains no `Date`, `Math.random`, `performance`, `crypto`, `fetch`, `window` or `document` outside comments (also enforced by G01). `const _: Scheduler = mod` compiles, proving the barrel satisfies C05's interface. **I-10(b)**: `fold` called twice on the same inputs returns deeply-equal states. **A spy-based assertion is impossible by construction and must not be written** — there is no injection point (§4).
**risk.** safety. **wave.** W8.

---

### LAYER R — THE SESSION RUNTIME · `src/domain/session/`

Ten modules. The television programme as pure state machines, with every duration taken from C14 and every string from C13, so the whole runtime is testable with zero mocks and no clock.

#### R01 — programme composition · `plan.ts` · ~150 lines
**purpose.** Compose the ordered segment list for one session — the eleven-step programme, the front-loaded variant, the Nothing Today branch — as data, before anything is rendered. Also owns the M-135 trigger, whose **parameter type admits no latency, prosody, affect or classifier input at all**: that signature is the P18 / ND-15 / EU AI Act 5(1)(f) enforcement point.
**api.**
```ts
export interface PlannedSegment { kind:SegmentKind; itemId:ItemId|null; foilItemId:ItemId|null;
  probeOrdinal:number|null; sayingId:string|null; songId:string|null;
  photoSource:M2PhotoSource|null; zeroInputMs:number; rungLadderVariant:RungLadderVariant|null; }
export interface SessionPlan { segments: readonly PlannedSegment[]; sessionMode:SessionMode;
  orderVariant:SessionOrderVariant; primeCondition:PrimeCondition; m2PhotoSource:M2PhotoSource;
  rungDwellStep:RungDwellStep; nCampCards:number; probeIncluded:boolean;
  turnaroundDecade:number|null; zeroInputTotalMs:number; }
export function nothingTodayTriggered(f: { consecutiveSkips:number;
  previousSessionAbandoned:boolean; distressSinceLastSession:boolean;
  fluctuationBand:'standard'|'high' }): boolean;
export function planSession(input: { roster:RosterPlan; cards:readonly CardRow[];
  library:LibrarySelection; probeOrdinals:readonly number[]; probeIncluded:boolean;
  monthTargetItemId:ItemId|null; restPhotoSha:string|null; bumpDecade:number;
  orderVariant:SessionOrderVariant; rungDwellStep:RungDwellStep;
  primeCondition:PrimeCondition; m2PhotoSource:M2PhotoSource;
  sessionMode:SessionMode; contentExpired:boolean }): SessionPlan;
```
**deps.** C01, C05, C14, R06, R09, R10.
**spec.** DESIGN-SYSTEM §8.2 (the eleven steps, **variation 1** `session_order_variant` moving the camp block to immediately after the ident, **variation 2** the dwell-driven card count, and the M-25 filled-interval resolution — re-presentations at 30 s / 1 m / 2 m / 4 m / 8 m from the target's own opening trial, wherever in the session those land), §9.1 (the zero-input table), §9.2 (Nothing Today), §8.12 (content expired); V1-PRODUCT-SHAPE §4 (the numbered walkthrough and the invisible branch), §2.2 M-135; adjudications **C-5** and **C-7** of this manifest.
**blind test.** **A38 in arithmetic form:** `planSession` at `standard`, standard order, six camp cards, probe included, yields `zeroInputTotalMs === 593_500 ± 500` — composed from C14's `SEGMENT_MS`, which the test-writer transcribes independently from §9.1. At `long`: `nCampCards === 5` and the total stays `< 600_000`. `front_loaded` places the camp block immediately after the ident and contains **exactly the same multiset of segments** as `standard`. **Nothing Today replaces exactly steps 5–8** (month target, camp block, probe, interview) with six `m02_card` segments, leaves the ident, both sayings, the song at whichever placement `primeCondition` gives it, the sign-off and closedown **byte-identical**, and contains zero `face_card`, zero `probe_item`, zero `interview` — the branch is invisible because the frames were never labelled. The composed Nothing Today total is asserted against its components (**DEFECT-1**: §9.2's stated 160 s does not equal its own 164.0 s composition; the components win). Every plan's last segment is `closedown` and its penultimate is `signoff`, **on every input combination, exhaustively enumerated**. `nothingTodayTriggered` is exhaustive over its full truth table and the `high` band fires one step earlier.
**risk.** safety. **wave.** W2.

#### R02 — the rung dwell clock and the speech gate · `dwell.ts` · ~90 lines
**purpose.** The clock arithmetic of one rung: base dwell from C14, frozen while voice is present, restarted 1500 ms after speech stops, capped at 3× the base.
**api.**
```ts
export interface DwellState { baseMs:number; elapsedMs:number; extendedMs:number;
  frozen:boolean; sinceSpeechMs:number; voiceDetectedInWindow:boolean; }
export function baseDwellMs(rung: -1|0|1|2|3, spokenMs:number, step:RungDwellStep): number;
export function startDwell(baseMs:number): DwellState;
export function tickDwell(s:DwellState, deltaMs:number, voiceActive:boolean): DwellState;
export function dwellComplete(s:DwellState): boolean;
export function dwellTelemetry(s:DwellState): { rungDwellExtendedMs:number;
  voiceDetectedInWindow:boolean };
```
`baseDwellMs(rung, spokenMs, step) = spokenMs + RUNG_SILENCE_MS[rung][step]`.
**deps.** C01, C14.
**spec.** DESIGN-SYSTEM §6.3 (the speech gate B2, the dwell-floor table, the 1500 ms restart, the 3× extension cap, and the explicit statement that every number is invented and is a frozen enrolment parameter), §4.1 `patientTiming`; **DEFECT-4** of this manifest (the `short` and `long` columns live in §4.1, not in §6.3's printed table; rungs −1 and 3 are constant across steps).
**blind test.** **A43, directly:** with synthetic voice injected at t = 3.0 s for 4.0 s, a rung-0 dwell at `standard` (11.0 s) completes at `11.0 + 4.0 + 1.5 = 16.5 s`, **not** 11.0 s; with continuous voice it completes at `11.0 × 3.0 = 33.0 s` — the extension cap — and **never later**. A table over all five rungs × all three steps against `RUNG_SILENCE_MS` plus the C13 spoken durations: at `standard`, rung 0 = 11 000, rung 1 = 6 900, rung 2 = 12 300, rung −1 = 8 900, rung 3 = 9 900. Property: `dwellComplete` is monotone — once true it stays true under further ticks — and `tickDwell` never returns a negative `elapsedMs` for any delta, so a held finger or a suspended app cannot stall a segment.
**risk.** safety. **wave.** W2.

#### R05 — end resolution and closedown selection · `end.ts` · ~60 lines
**purpose.** Resolve how a session ends, and which photograph it settles on. Small and alone, because **A39 and A40 are assertions about this function**.
**api.**
```ts
export function resolveEndReason(f: { stopTapped:boolean; distress:boolean;
  batteryPercent:number; lowPowerMode:boolean; contentExpired:boolean; wrongResident:boolean;
  audioHealthy:boolean; schedulerEnd:SessionEndReason|null; atZeroDemandBoundary:boolean }):
  RuntimeEndReason | null;
export function closerPresented(r: RuntimeEndReason): boolean;
export function toSchedulerReason(r: RuntimeEndReason): SessionEndReason;
export function closedownPhotoSha(nominated: string|null, fallbackStillLife: string): string;
```
**deps.** C01, C14.
**spec.** DESIGN-SYSTEM §8.10 (the stop panel: tap → sign-off plays → closedown; `user_ended`), §8.11 (closedown, the deletion of early closedown, the bundled fallback still-life, and **`timeout` never fires on this surface — an assertion, not an accident**), §8.12, §9.6 (**audio loss never stops a session**), §11.5 (below 25% the session ends at the **next zero-demand boundary** via the unconditional sign-off), §3 A6; SCHEDULER-SPEC §12.3, §15.1 rank 3; §2.3 and **§2.4** of this manifest.
**blind test.** Exhaustive over the input cross-product. `'timeout'` is **not in the return type** (A40 as a type property). `audioHealthy:false` **never** produces a terminal reason — it returns `null` and the session continues on captions. Battery below 25% returns `'battery_truncated'` **only at a zero-demand boundary**, never mid-demand. Distress outranks every other input and yields `closerPresented === false`. `toSchedulerReason` maps `completed → schedulerEnd`, `battery_truncated|content_expired → 'user_ended'`, `wrong_resident → 'abandoned'`, and is total. `closedownPhotoSha` returns the bundled still-life when the nomination is absent, so the terminal state is **never undefined**.
**risk.** safety. **wave.** W2.

#### R06 — era-ordered sequencing · `era-order.ts` · ~45 lines
**purpose.** Order the camp block from the reminiscence bump forward, turning around invisibly before the lost decades, and record the turnaround as a first-class variable.
**api.** `orderByEra(items: readonly {itemId:ItemId; eraDecade:number}[], bumpDecade:number): { ordered: readonly ItemId[]; turnaroundDecade:number|null }`.
**deps.** C01.
**spec.** V1-PRODUCT-SHAPE §2.2 M-131 (a sequencing policy over `era_decade`, no UI, **`turnaround_decade` logged as a first-class variable**); SYNTHESIS P14 (the bump at ages 10–30 and its positivity); ADR-DATA §11.2 (`proj.session.turnaround_decade` — "first-class or the era analysis is uninterpretable"); DESIGN-SYSTEM §10 (recomputed from the **rendered** deck).
**blind test.** Deterministic and total: the output is a **permutation** of the input, asserted by multiset equality; ties break on `itemId`; the ordering runs forward from `bumpDecade` and turns around before the earliest decade present; `turnaroundDecade` is a decade **present in the input**, or `null` when fewer than two decades are represented. No randomness, so the A39 walk can enumerate it.
**risk.** correctness. **wave.** W2.

#### R07 — the probe block · `probe.ts` · ~70 lines
**purpose.** Run the only place in the product where a real uncued failure is recorded — and rescue every one of them.
**api.**
```ts
export interface ProbeTrialPlan { probeOrdinal:number; targetName:string;
  targetSha:string; foilSha:string; }
export function planProbeBlock(ordinals: readonly number[], library: LibrarySelection,
  maxItems:number, capMs:number, step:RungDwellStep): readonly ProbeTrialPlan[];
export function probeTrialOutcome(firstUncuedCorrect:boolean):
  { correct:boolean; recordsFailure:true; rescuedToSuccess:true;
    revealMs:number; presentationMode:'recognition'; nDistractors:1 };
```
**deps.** C01, C02, C14, R10.
**spec.** SYNTHESIS §5.2 points 1–6 (generic, standardised, identical across participants; ≤8 items, ≤2 minutes; **the trial records the first uncued attempt and then rescues**; the personal deck is never used as a probe; distress disables the probe for the remainder of the study and is logged as an **adverse event, not missing data**); DESIGN-SYSTEM §8.7 (the intro, the per-item 16.3 s at `standard`, the same two-picture state as rung 2 with the rung-2 silence budget, the 4.0 s reveal, the 120 s hard cap, and the seam it flags); SCHEDULER-SPEC §16 (probe items are **not** in `state.items` and produce **no scheduler event at all**); adjudication **C-2** of this manifest.
**blind test.** The block is the frozen ordinals **in list order** — identical items, identical order, every day, which is the BRANCH fixed-stimulus shape F5 measures. Six untouched items fit the cap: `6 × 16 300 + 6 000 = 103 800 ms < 120 000`; a seventh and eighth fit only if she touches. **The block emits `probe.trial_completed` telemetry rows and zero `TrialCompleted` scheduler events** — asserted over the emission stream. `probeTrialOutcome` always terminates in `rescuedToSuccess: true`: *you can record a failure and still never display one.* No family content can enter the block: `planProbeBlock` reads only the bundled library.
**risk.** safety. **wave.** W2.

#### R08 — patient copy rendering · `copy.ts` · ~65 lines
**purpose.** Render every patient-facing string from the closed vocabulary, including the partial-name cue, with no model anywhere in the path.
**api.**
```ts
export function renderString(key:CopyKey, vars: Readonly<Record<string,string|number>>): string;
export function maskName(name:string, k:number): string;      // 'Marg — — — —'
export function maskK(nameLength:number, representationNumber:number): number;  // ceil(len/2) cap
export function violatesCopyRules(s:string):
  readonly ('banned_word'|'too_many_words'|'exclamation'|'question_mark')[];
```
**deps.** C13.
**spec.** DESIGN-SYSTEM §7.2 (the em-dash decision that replaced the underscore **and deleted a colour token**), §7.3 (the complete vocabulary), §7.4 (banned outright), §8.5 rung 1 (`k` increments per re-presentation of the item, capped at `ceil(len/2)`, and **resets on the next success with no comment and no visible event**), §12.6 A33–A37.
**blind test.** **A35:** the set of distinct strings `renderString` can produce, with variable substitution stubbed, equals C13's `COPY` table **exactly** — no string can reach the patient that is not in that table. **A33:** every output passes `violatesCopyRules` with an empty result, checked case-insensitively on word boundaries. **A34:** every prompt ≤ 8 words, every sentence ≤ 15. **A37:** zero `!` anywhere. `maskName('Margaret', 4) === 'Marg — — — —'` — em-dashes, **not** underscores, length preserved so it is a real cue and not an ellipsis. `maskK` never exceeds `ceil(len/2)`.
**risk.** safety. **wave.** W2.

#### R09 — content eligibility and the ladder variant · `eligibility.ts` · ~75 lines
**purpose.** The client-side safety gate on what may appear in a recognition mechanic — the 48-hour `person_status` freshness rule, media readiness, the P17 blocklists — and the field that stops two silent scale mixes. **This module owns assertion A41.**
**api.**
```ts
export const STATUS_FRESHNESS_MS: 172_800_000;                 // 48 hours
export function recognitionPermitted(c:CardRow, nowMs:number): boolean;
export function mayBeFoil(c:CardRow, nowMs:number): boolean;
export function contentAgeAtRenderHours(c:CardRow, nowMs:number): number;
export function blocked(c:CardRow, eraBlocklist:readonly string[],
  themeBlocklist:readonly string[]): boolean;
export function rungLadderVariant(target:CardRow, foil:CardRow|null,
  nowMs:number): RungLadderVariant;
```
**deps.** C01, C09, C10.
**spec.** DESIGN-SYSTEM §9.7 (the 48-hour freshness gate: a card whose `person_status` has not been revalidated within 48 h **drops out of rungs 0/1/2 and foil eligibility and degrades to rung 3 / M-02**, is never retired, and logs `content_age_at_render_hours` so the S4 audit can separate "surfaced despite a flag" from "surfaced before the flag arrived"), §8.5.2 (`rung_ladder_variant`), §8.5.3 (the **fail-closed foil filter set** — living, revalidated ≤48 h, media ready); SYNTHESIS P16, P17, ND-12; declared deviation **D-5** of this manifest.
**blind test.** **A41, exhaustively:** over `personStatus{4} × ageHours{0, 47, 48, 49} × mediaReady{2}`, `mayBeFoil` is true **only** when the status is `living`, the age is ≤ 48 h and the media is ready. Boundaries at exactly 48 h, at 48 h + 1 ms, and for a deceased person with an explicit caregiver override. Where no candidate qualifies, `rungLadderVariant` returns `three_rung_no_foil` and **never a fallback to a deceased person**. A month target always returns `three_rung_target` regardless of deck contents. `blocked` excludes an item whose era decade or theme is in either P17 blocklist, from target, foil, closer and era-photo roles alike.
**risk.** safety. **wave.** W2.

#### R10 — the bundled generic library · `library.ts` · ~80 lines
**purpose.** Select the saying, the song, the frozen probe set, the era photo and the fallback still-life from the bundled manifest — deterministically, totally, and **on an empty deck**. This is what makes V1-PRODUCT-SHAPE §3's promise true: a complete session from four photographs and a birth year, and a complete session from the birth year alone, in hour one and at week 52 for the 22% of families who deliver nothing.
**api.**
```ts
export interface LibraryEntry { id:string; kind:'saying'|'era_photo'|'music_clip'|'stock_face'
  |'still_life'; locale:string; eraDecade:number|null; birthYearLo:number|null;
  birthYearHi:number|null; probeOrdinal:number|null; targetName:string|null;
  assetPath:string; licenceRef:string; body:Record<string,unknown>; }
export interface LibrarySelection { sayings: readonly LibraryEntry[]; song: LibraryEntry|null;
  probeSet: readonly LibraryEntry[]; eraPhoto: LibraryEntry|null; stillLife: LibraryEntry; }
export function selectLibrary(manifest: readonly LibraryEntry[], input: { locale:string;
  musicDecade:number; bumpDecade:number; contentSetVersion:string;
  probeOrdinals:readonly number[]; sessionOrdinal:number }): LibrarySelection;
```
**deps.** C01.
**spec.** V1-PRODUCT-SHAPE §2.1 (M-35, M-56 and the probe **ship in the app bundle** and consume no family content), §3 ("the app runs a complete session from four photographs and a birth year, and a complete session from the birth year alone"); DESIGN-SYSTEM §7.3 (the three shipped sayings), §8.4, §8.7, §8.12 (the shipped still-life — a kettle, a garden gate, a wireless set; **no people, because a still life cannot be a recognition demand**); ADR-DATA §5.4 `app.generic_library` (`kind`, `locale`, `birth_year_lo/hi`, `probe_ordinal 1..8`, `licence_ref`, and the partial unique index that freezes the probe set per `content_set_version`).
**blind test.** Total on an **empty personal deck**: every field of `LibrarySelection` is populated (or `song`/`eraPhoto` are honestly `null` when the manifest has no locale match) and `stillLife` is **never null**. `probeSet` is exactly the eight rows with the given `content_set_version` and non-null `probe_ordinal`, **in ordinal order, identical for every participant** — asserted by selecting for two different participants and deep-equalling. Saying rotation is `sessionOrdinal mod n` so no randomness enters. `song` matches `musicDecade` and the locale. Every returned entry carries a non-empty `licenceRef` (M-56's licensing is an open blocker and the field is where it is named).
**risk.** safety. **wave.** W2.

#### R03 — the rung machine · `rung-machine.ts` · ~150 lines
**purpose.** The per-card cue ladder as a timed state machine with the speech gate, so **no path can wait on a touch**.
**api.**
```ts
export type RungState = 'answer_first'|'withdrawal'|'rung0'|'rung1'|'rung2'|'rung3'|'done';
export interface RungMachine { state:RungState; dwell:DwellState; k:number;
  attempts:readonly Attempt[]; nTaps:number; replayHoldMs:number; lockoutMs:number;
  pointerDown:boolean; committedSide:'left'|'right'|null; attainedRung:CueLevel;
  ladderVariant:RungLadderVariant; }
export function startRung(input:{ openingCueLevel:CueLevel; floorCueLevel:CueLevel;
  ladderVariant:RungLadderVariant; step:RungDwellStep; nameLength:number;
  representationNumber:number }): RungMachine;
export function tickRung(m:RungMachine, deltaMs:number, voiceActive:boolean): RungMachine;
export function touchRung(m:RungMachine, target:'picture'|'card_left'|'card_right',
  monoMs:number): { machine:RungMachine; effect:'replay'|'commit_choice'|'ignored' };
export function pointerDown(m:RungMachine): RungMachine;
export function pointerUp(m:RungMachine): RungMachine;
```
**deps.** C01, C13, C14, R02, R08.
**spec.** DESIGN-SYSTEM §6.1 (the two rules of touch and that **rule 1 is the most consequential decision in the document** — one picture on screen, touching it plays its words again and holds it; the touch is never navigation, never a grade, cannot skip, cannot stall, cannot advance a rung), §6.2 (the exhaustive per-screen touch table), §6.6 (touch-**down** commits; first pointer wins; micro-movement ignored; the 400 ms lockout still receives the acknowledgement; the **held-pointer state** — acknowledgement persists while any pointer is down and the page's advance timer continues regardless; large contacts accepted at their centroid), §8.5 (the four rungs frame by frame), §8.6 (the three-rung month-target ladder).
**blind test.** **A44:** for every state, a touch on the picture leaves `attainedRung`, `correct` and `hint_level_reached` unchanged and advances no rung — only `nTaps` and the replay hold change. **A45:** a pointer held for 10 s keeps the acknowledgement for the full 10 s **and the advance timer still fires on schedule**; lift-and-replace is a fresh touch-down. **A46:** a second pointer-down within 400 ms changes no state but still receives the acknowledgement. **A47:** two simultaneous pointer-downs on `card_left` and `card_right` commit exactly one choice — the first. The replay ceiling of 60 s is hard: after it the rung advances regardless of touches, so perseverative tapping is structurally harmless. `three_rung_no_foil` and `three_rung_target` **skip rung 2 entirely** and no two-picture state is ever mounted for them. The ladder **only ever travels downward**; there is no input that raises a rung.
**risk.** safety. **wave.** W3.

#### R04 — the session machine · `machine.ts` · ~420 lines
**purpose.** The television programme as a pure state machine: given a plan and a stream of inputs, what is on screen, what is spoken, and what happens next — with or without a touch. **The largest module in the client, and it is whole because A39 requires one enumerable state space.**
**api.**
```ts
export type SessionInput =
  | { kind:'tick'; deltaMs:number }
  | { kind:'touch'; target:'picture'|'card_left'|'card_right'|'stop'; xNorm:number; yNorm:number }
  | { kind:'pointer'; down:boolean }
  | { kind:'voice'; active:boolean }
  | { kind:'distress'; source:DistressSource; itemId:ItemId|null }
  | { kind:'battery'; percent:number; lowPowerMode:boolean }
  | { kind:'audio_route_lost' }
  | { kind:'staff_abort' };
export interface Frame { segment:PlannedSegment; pictureState:'one'|'two'|'none'|'closedown';
  photoShas: readonly string[]; matFill:'bone'|'boneTouched'|'ground';
  captionLine1:string|null; captionLine2:string|null;
  speak:string|null; toneOnEnter:boolean; stopPanelVisible:boolean;
  demonstrationRunning:boolean; }
export type Emission =
  | { kind:'trial_completed'; payload:unknown } | { kind:'filler_shown' }
  | { kind:'probe_trial_completed'; payload:unknown }
  | { kind:'probe_block_completed'; elapsedMs:number; truncated:boolean }
  | { kind:'distress_reported'; source:DistressSource; itemId:ItemId|null }
  | { kind:'session_ended'; runtimeReason:RuntimeEndReason;
      schedulerReason:SessionEndReason; closerPresented:boolean };
export interface MachineState { plan:SessionPlan; index:number; frame:Frame;
  rung:RungMachine|null; elapsedMs:number; nTaps:number; anyVoice:boolean;
  ended:RuntimeEndReason|null; emitted: readonly Emission[]; }
export function startProgramme(plan:SessionPlan, ctx:{ step:RungDwellStep }): MachineState;
export function step(s:MachineState, i:SessionInput): MachineState;
export function isTerminal(s:MachineState): boolean;   // true ONLY in closedown
```
**deps.** C01, C05, C13, C14, R01, R02, R03, R05, R07, R08.
**spec.** DESIGN-SYSTEM §6.1, §6.2 (the exhaustive touch table — **read the "no touch" column top to bottom: it is a complete, coherent nine-minute-fifty-three-second programme that ends on a photograph she loves**), §8.1 (global invariants), §8.3–§8.12 (every screen, frame by frame, with its timings), §9.1 (the zero-input table **as a state-machine specification**), §9.2, §9.6, §11.5, §12.7 A38–A48; SCHEDULER-SPEC §15.1 (distress rank 3 beats rank 5); **§2.4 of this manifest (A39 as restated)**.
**blind test.**
- **A38 — the zero-input walk.** Feed only `tick` inputs: the walk terminates in `closedown`, total elapsed **593.5 s ± 0.5 s** at `rungDwellStep = standard`, `nTaps === 0`, `runtimeReason === 'completed'`, `closerPresented === true`, and **no state in the walk has a touch as its only advance condition**.
- **A39 — exhaustion, as restated in §2.4.** Over every `sessionMode` × `sessionOrderVariant` × `rungLadderVariant` × `audioOutput` × `rungDwellStep`, plus a stop-panel tap at every segment, a battery drop at every segment, an audio route loss at every segment, and a content-expired start: **every terminal state is `closedown`**; `ended_on_success === true` on 100% of paths containing no distress report; a path containing a distress report terminates in `closedown` with `ended_on_success === false`.
- **A40.** No path produces `'timeout'`.
- **A42 — the wrong tap is invisible.** At rung 2, for both possible touches, the emitted `Frame` sequence from the acknowledgement onward is **byte-identical**: both mats dissolve together, the same tone plays, the same single-picture rung-3 frame arrives with the same caption. Asserted by hashing the frame array. **There is no frame in which the screen shows which card was touched**, and `correct = 0` is emitted in the same step that advances the frame.
- **A36.** Zero `?` characters in any rung-3, M-02, closedown or sign-off frame.
- An injected `audio_route_lost` at every segment **never** reaches a terminal state other than closedown, and never sets `runtimeReason = 'audio_unavailable'` (§9.6 / §2.3).
- A `distress` input at any segment sets `runtimeReason = 'distress_stop'`, emits **no closer**, and still terminates in closedown.
**risk.** safety. **wave.** W5.

---

### LAYER T — TELEMETRY AND THE DEVICE PROJECTION · `src/domain/telemetry/`

#### T01 — the wire envelope builder · `envelope.ts` · ~50 lines
**purpose.** Build a wire envelope from injected identifiers and clocks, including the composite `seq` that survives a reinstall.
**api.** `composeSeq(bootOrdinal, withinBootSeq): number`, `decomposeSeq(seq): {bootOrdinal, withinBootSeq}`, `nextWithinBootSeq(n): number`, `buildEnvelope(p): WireEvent`, `buildBatchHeader(p): BatchHeader`.
**deps.** C03, C07, C08.
**spec.** ADR-DATA §6.1 (**`seq = boot_ordinal × 10⁸ + within_boot_seq`, and why it is composite** — the MDM-reinstall failure that would otherwise make a tablet quarantine 100% of its telemetry forever while reporting clean syncs), §6.6.
**blind test.** `composeSeq(2, 1) === 200_000_001`; `decomposeSeq(composeSeq(a,b)) === {a,b}` for every boundary. **The reinstall property, provable in one assertion:** `composeSeq(3, 1) > composeSeq(2, 99_999_999)`. `withinBootSeq > 99_999_999` is rejected. Every built envelope parses against `zEventEnvelope` for every registered type, and every payload string passes `payloadShapeOk` — a 5,000-name fuzz over every string field produces zero valid events (V10).
**risk.** correctness. **wave.** W2.

#### T02 — device-side clock anchoring · `clock-anchor.ts` · ~90 lines
**purpose.** Turn a boot-scoped monotonic reading into a server-anchored epoch millisecond that is monotone within and across boots.
**api.** `monotoniseBootWall(nowWallMs, prevBootWallMs, prevBootMaxMonoMs): number`, `provisionalAnchor(bootWallMs, bootMonoMs, lastKnownSkewMs): BootAnchor`, `anchoredAtMs(anchor, tMonoMs): number`, `applyServerAnchors(local, fromServer): Record<BootId, BootAnchor>`, `clockDivergenceMs(anchor, tWallMs, anchoredMs): number`.
**deps.** C01, C07.
**spec.** ADR-DATA §6.3 (the five properties table and the specific failure each fixes; `boot_wall_ms` is **monotonised device-locally at cold start**; the mono origin is **this** boot's, never the sending boot's), §6.4 (before its first sync of a boot the device anchors with `last_known_skew_ms`, and the `/sync` response returns the server's anchors so the device **re-folds**).
**blind test.** **V5 as a unit fixture:** three cold starts on three consecutive days, offline throughout, pushed at once — the recovered day offsets are **0, 1, 2** and not three values inside a 45-minute window. `monotoniseBootWall` never returns below `prevBootWallMs + prevBootMaxMonoMs + 1`, even when the raw wall clock steps backwards by a day. `anchoredAtMs` is affine in `tMonoMs` and therefore strictly monotone within a boot. `applyServerAnchors` is idempotent and server-wins. `clockDivergenceMs` is **signed and not clamped**.
**risk.** correctness. **wave.** W2.

#### T03 — canonical ordering · `canonical-order.ts` · ~45 lines
**purpose.** The one total ordering over events, plus the per-device running maximum that the ingest boundary owes the fold. **Deliberately outside the scheduler's frozen export list.**
**api.** `canonicalCompare(a, b): -1|0|1`, `sortCanonical(events)`, `enforcePerDeviceMonotonicity(events)`.
**deps.** C01.
**spec.** SCHEDULER-SPEC §6.1 (the boundary obligation, stated there **because getting it wrong silently corrupts the study**, and explicitly disowned by the scheduler module); ADR-DATA §6.4 (the same ordering, materialised as `ordering_key`).
**blind test.** A property test over 10 000 generated events asserts `canonicalCompare` is a **strict total order** — irreflexive, antisymmetric, transitive, and never returning 0 for distinct `(deviceId, seq)`. `enforcePerDeviceMonotonicity` applies a running maximum per device and its output satisfies **V4** (`anchorMs` non-decreasing in `seq` for every device). Structural: neither name appears on SCHEDULER-SPEC §21.1's frozen list, so exporting them from the scheduler barrel would fail I-8.
**risk.** correctness. **wave.** W2.

#### T04 — the stimulus descriptor · `stimulus.ts` · ~55 lines
**purpose.** Freeze what the patient actually saw into the trial event **at stimulus paint**, so no later content edit can rewrite history.
**api.** `buildStimulusDescriptor(card: CardRow, ctx: { presentationMode; nDistractors; contentSetVersion; isMonthTarget; cueModality; nMediaAssets }): StimulusDescriptor`, `eraBand(eraDecade): EraBand`, `relationshipGroup(c): RelationshipGroup`.
**deps.** C01, C08, C10.
**spec.** ADR-DATA §9 in full (the JSON literal; **the projector joins nothing mutable**; the S4 false-positive storm the alternative guarantees; and the residual, stated), §8.4 (the coarsening table).
**blind test.** **V16 as a unit fixture:** a descriptor built while `personStatus` is `'living'` **still reads `'living'` after the `CardRow` is mutated to `'deceased'`** — the builder copies, it never references. `eraBand` and `relationshipGroup` are total over their input domains with an exhaustive fixture per output member, and each **matches its SQL twin in B02 on the same inputs** (a CI check runs both). Every string value in the output passes `payloadShapeOk`.
**risk.** safety. **wave.** W2.

#### T06 — the session telemetry row · `session-row.ts` · ~85 lines
**purpose.** Assemble the §7 session row, keeping abandonment, crash, battery, device failure and a silent-audio session permanently distinguishable.
**api.** `buildSessionPayload(input: { sched: SessionSchedulingTelemetry|null; runtimeReason:RuntimeEndReason; audio:{healthy; routeChanges; outputConfirmedMs}; battery:{start; end; lowPowerMode}; deck:{nCardsDroppedMediaNotReady; deckSizeAtRender; nCampCardsPresented; probeItemsPresented}; observation:{nTaps; anyVoice}; turnaroundDecade:number|null; sessionMode; sessionOrderVariant; allocation:{counter; method; m2PhotoSource; primeCondition} }): Record<string, unknown>`.
**deps.** C01, C05.
**spec.** SYNTHESIS §7 (`session` block); DESIGN-SYSTEM §10 (the thirteen added fields), §9.6 (**audio-unhealthy sessions are excluded from S3 and from the adherence numerator, never banked as successes**), §11.5; ADR-DATA §6.9 (`session.started` carries the delivered allocation).
**blind test.** `session_had_any_response === (nTaps > 0 || anyVoice)` **exactly** — the field that stops S3 becoming a tautology on a session delivered to an empty chair; `quiet_session` is its negation. `ended_on_success` is **copied from the scheduler telemetry and never recomputed**. `session_end_reason`'s domain is the 12-member `RuntimeEndReason` union and `'timeout'` is not among it. Every output key appears in the §7 ∪ §10 union, asserted against a transcribed key list. An audio-unhealthy session sets `audio_healthy: false` and the ops-console S3 denominator excludes it.
**risk.** correctness. **wave.** W2.

#### T07 — speech features · `speech-features.ts` · ~45 lines
**purpose.** Derive the pre-registered prosodic feature set from an on-device signal summary — **no transcript and no ASR anywhere in the path**. This module's *type* is the P27 enforcement point.
**api.**
```ts
export interface SpeechFeatures { utteranceDurationMs:number; nPauses:number;
  meanPauseMs:number; maxPauseMs:number; voicedRatio:number; nFilledPauses:number; }
export function extractSpeechFeatures(
  windows: readonly {startMs:number; endMs:number; voiced:boolean}[]): SpeechFeatures;
export function band(v:number, edges: readonly number[]): number;
```
**deps.** none.
**spec.** SYNTHESIS §7 (the speech-response block), P27 (ASR never grades and never determines correctness), ND-26; ADR-DATA §8.8 (**speech features are a speaker biometric and are treated as one** — reduce to the minimum pre-registered set, coarsen to bands at projection, gate the whole block at the projector on `research_speech_features`, and **if the equal-error-rate test verifies a speaker, the block does not ship**).
**blind test.** Pure over an injected window array: empty input yields zeroes and **never `NaN`**; pause counting is exact on hand-built fixtures; `band` is total and monotone. **The type carries no text, no token, no word, no confidence and no transcript field** — a key-enumeration assertion, and the module's source contains no speech-recognition import. §7's `speech_rate_wpm`, `articulation_rate` and `type_token_ratio` are **absent** because they require a transcript (see the §2.7 waiver set).
**risk.** privacy. **wave.** W2.

#### T08 — the device scheduler projection · `device-projection.ts` · ~110 lines
**purpose.** **The fix for declared deviation D-2.** Derive the eight server-written scheduler events from the pull, maintain the local journal, and assemble the canonical event stream the device folds.
**api.**
```ts
export function deriveServerEvents(prev: readonly CardRow[], next: readonly CardRow[],
  prevRoster: DeviceRosterRow|null, nextRoster: DeviceRosterRow,
  serverTimeMs: number, fromSeq: number): readonly SchedJournalRow[];
export function deviceEventStream(journal: readonly SchedJournalRow[],
  outbox: readonly WireEvent[], patientId: PatientId): readonly SchedulerEvent[];
```
**deps.** C01, C03, C09, C10, T03.
**spec.** ADR-PLATFORM §4.4 ("the device computes a local projection to pick the next card offline"), §4.2 (**no `schedule_state` on the tablet**); ADR-DATA §6.6 (the eight server-written scheduler types and the all-zeros server device id that sorts first), §13 (the device has no read on `log.event_log`); **declared deviation D-2 of this manifest, which an implementer must read in full**.
**blind test.** A card appearing in `next` and absent from `prev` yields exactly one `ItemAdded` with `tier`, `recognitionBlocked = !recognitionAllowed` and `contentReady` taken from the row. A `tier` change yields `ItemTierSet{by:'caregiver'}`; a `recognitionAllowed` flip yields `ItemRecognitionBlockSet`; a `contentReady` flip yields `ItemContentReadyChanged`; disappearance yields `ItemRetired`; reappearance after retirement yields `ItemReEnabled`; a `probe_disabled` flip on the roster row yields `ProbeDisabledSet`. Every derived event carries `deviceId === SERVER_DEVICE_ID` and `anchorMs === serverTimeMs`, and **sorts before any device event in the same millisecond** under `canonicalCompare` — so item creation precedes the trial that uses it. Applying the same delta twice appends nothing (idempotent on `(itemId, field, value)`). `deviceEventStream` returns a canonically ordered array that satisfies `enforcePerDeviceMonotonicity` unchanged. **A spelling correction to `oneSentence` or `displayName` produces no event at all.**
**risk.** correctness. **wave.** W2.

#### T05 — the interaction telemetry row · `interaction-row.ts` · ~120 lines
**purpose.** Assemble the full §7 interaction row from the scheduler group, the design-system group and the descriptor frozen at paint.
**api.** `buildInteractionPayload(input: { sched: TrialSchedulingTelemetry; stimulus: StimulusDescriptor; attempts: readonly Attempt[]; timing: {...}; touch: { nTaps; taps: readonly {x;y;holdMs;targetId;targetBounds}[] }; dwell: { extendedMs; voiceDetected }; speech: SpeechFeatures|null; context: { deviceMode:'personal'|'shared'; contentAgeAtRenderHours:number; rungLadderVariant:RungLadderVariant; audioHealthy:boolean; administeredBy:string|null } }): Record<string, unknown>`.
**deps.** C05, C08, T04, T07.
**spec.** SYNTHESIS §7 (the `interaction` field list, and the explicit removal of `self_rated_confidence` under P4); DESIGN-SYSTEM §10 (the thirteen added fields with the finding each closes — tap coordinates normalised to the target bounding box, `rung_ladder_variant`, `rung_dwell_extended_ms`, `voice_detected_in_window`, `content_age_at_render_hours`, `device_mode`); ADR-DATA §8.6 (`administered_by` is **nullable and defaults `NULL`**, with exactly one legal producer and **no `'inferred'` value**).
**blind test.** Field-set equality against the §7 ∪ §10 union, asserted as a sorted key list. **No key named `self_rated_confidence` and no ASR-derived grade exists** (P4, P27). Every string value satisfies `payloadShapeOk` — the 5,000-name fuzz over every string field yields zero valid rows (V10). Tap coordinates are normalised to the target bounding box. `administered_by` is `null` unless a co-presence declaration supplied it, and the protocol pre-registers the residual rather than filling it with a constant.
**risk.** privacy. **wave.** W3.

---

### LAYER Y — SYNC · `src/domain/sync/`

#### Y01 — the pull reducer and hard expiry · `pull.ts` · ~110 lines
**purpose.** Turn one pull response into the concrete local work list, and own the dead-man dial that decides whether the tablet may render at all.
**api.**
```ts
export interface PullPlan { upsertRoster: readonly DeviceRosterRow[];
  upsertCards: readonly CardRow[]; deleteCards: readonly ItemId[];
  upsertMedia: readonly MediaRow[];
  download: readonly {sha256:string; signedUrl:string; bytes:number}[];
  purge: readonly {sha256:string|null; itemId:ItemId|null; revocationId:string}[];
  contentValidUntilMs:number; cursor:string; }
export function planPull(res: SyncPullResponse, local: { haveSha: readonly string[] }): PullPlan;
export function contentValidUntil(lastSuccessfulSyncMs:number, hardExpiryDays:number): number;
export function renderPermitted(nowMs:number, contentValidUntilMs:number|null): boolean;
export const HARD_EXPIRY_MIN_DAYS: 4; export const HARD_EXPIRY_DEFAULT_DAYS: 7;
```
**deps.** C09, C10.
**spec.** ADR-PLATFORM §4.4 (one round trip, the pull sets), §4.5 (hard expiry, default 7, hard minimum 4, and that **the outbox is never discarded at expiry** — expiry stops rendering, it does not destroy research data); ADR-DATA §10.4(a) (**revocations ride inside the content view as `op = 'purge'`**, because exactly two device views are budgeted).
**blind test.** A `sha256` already in `haveSha` is **never re-downloaded** (content addressing). A revocation always produces a purge entry **even when the file is absent locally** — the receipt still fires with `local_file_existed: false`. A `patient`-scoped revocation purges every sha for that patient. Purges are ordered **before** fetches. `contentValidUntilMs` is taken from the response and never computed locally. Applying the same pull twice produces a second plan whose application is a no-op. `renderPermitted` is false when `contentValidUntilMs` is `null` (never synced) and at the boundary millisecond; `hardExpiryDays` below 4 is clamped **up**, never down. **A fixture asserts that no `PullPlan` field can mutate the outbox.**
**risk.** privacy. **wave.** W2.

#### Y02 — the outbox drain and ACK fold · `outbox.ts` · ~80 lines
**purpose.** Select the next push batch in strict FIFO `seq` order, and decide from one response exactly which rows are deleted, retried or dropped at hard expiry.
**api.**
```ts
export function selectBatch(queued: readonly WireEvent[], max:number, nowMs:number,
  backoffUntil: Readonly<Record<string, number>>): readonly WireEvent[];
export interface DrainDecision { delete: readonly string[];
  retryAt: readonly {eventId:string; nextAttemptAtMs:number}[]; dropExpired: readonly string[]; }
export function foldSyncResponse(sent: readonly WireEvent[], res: SyncPullResponse,
  ctx: { nowMs:number; attemptCounts:Readonly<Record<string,number>>;
         hardExpiryMs:number; firstQueuedAtMs:Readonly<Record<string,number>> }): DrainDecision;
export function nextBackoffMs(attempt:number): number;
```
**deps.** C07, C09.
**spec.** ADR-DATA §6.8 (**the ACK contract in full: HTTP 201 is not an ACK**; delete only for an id in `accepted` or in `quarantined` with `retryable:false`; a `retryable:true` quarantine stays and backs off, capped at `hard_expiry_days`), §6.4 (**FIFO within a device is a client contract clause, not a hope** — the outbox drains in `seq` order and never skips ahead of an unACKed row); ADR-PLATFORM §4.3 properties 3 and 4.
**blind test.** Exhaustive over the four membership cases × `retryable` × expired. An id in `accepted` is deleted; in `quarantined` with `retryable:false` is deleted; with `retryable:true` is retried and **never deleted before hard expiry**; **an id in neither list is retried** — the assertion that stops a newer tablet losing 100% of its telemetry to an older server while every sync looks clean. `delete` and `retryAt ∪ dropExpired` **partition** the sent set with no overlap and no loss. `selectBatch` output is a **prefix** of the seq-ordered queue, length ≤ 500, and a backed-off row **truncates** the batch rather than being skipped over — asserted by a fixture where row 3 of 10 is backed off and the batch has exactly 2 rows. **V7:** one bad row in a 400-row batch deletes 399 and retains 1.
**risk.** correctness. **wave.** W2.

#### Y03 — the media work plan · `media.ts` · ~55 lines
**purpose.** Decide which media to fetch, which to evict under pressure, and when a card may render.
**api.** `planMediaWork(manifest, local, budgetBytes): { fetch: readonly string[]; evict: readonly string[] }`, `cardIsRenderable(card: CardRow, mediaStates: Readonly<Record<string,'pending'|'ready'|'purged'>>): boolean`.
**deps.** C09, C10.
**spec.** ADR-PLATFORM §4.2 (content addressing; a row flips to `ready` only after the download completes **and** the hash verifies; **a card is never shown unless all its media are ready**), §4.3 (**media is deleted to make room; the outbox never is**), §8 (distribution).
**blind test.** A card with **any** non-ready media is never renderable (E18). Eviction selects media and **never** an outbox row — asserted structurally, since the return type admits no outbox operation. Content addressing means two cards sharing one `sha256` produce exactly one fetch and one stored file. `evict` is ordered deterministically (largest, then least-recently-referenced, then `sha256` ascending) so the plan is single-valued.
**risk.** correctness. **wave.** W2.

---

### LAYER P — POLICY · `src/domain/policy/`

#### P01 — within-participant allocation · `allocation.ts` · ~50 lines
**purpose.** Say exactly which bytes are digested to allocate this session's two within-participant arms, and read the arms out of the resulting digest — with the digest itself performed outside the pure layer, because `src/domain/**` may not touch `crypto`.
**api.**
```ts
export function allocationMessage(factor:'m2'|'prime', deviceId:DeviceId, counter:number): string;
export function armFromDigest(factor:'m2', d:Uint8Array): M2PhotoSource;
export function armFromDigest(factor:'prime', d:Uint8Array): PrimeCondition;
export function allocationRecord(counter:number, m2:M2PhotoSource, prime:PrimeCondition):
  { allocation_counter:number; allocation_method:'hmac_sha256_v1';
    m2_photo_source:M2PhotoSource; prime_condition:PrimeCondition };
```
**deps.** C01.
**spec.** ADR-DATA §6.9 in full — **the device computes, the device records what it delivered, and the server verifies but never overrides**; the exact message form `'m2:' || device_id || ':' || counter`; the low-bit extraction; the device-local `allocation_counter`, persisted and **never renumbered**; and the failure the alternative guarantees (a second tablet's backlog shifting every ordinal, flipping the recorded arm for half the study, differentially by connectivity and therefore by site). V1-PRODUCT-SHAPE §8.5 (M2 and prime are within-participant per session; M3 is frozen at enrolment and is **not** this module's business).
**blind test.** `allocationMessage` is asserted **character for character** against §6.9's literal for a fixed device id and counter — that string is the whole contract, because the server recomputes from it. `armFromDigest` is `digest[0] & 1` and is asserted over **all 256** possible first bytes. **The module imports no `crypto`** — a structural assertion, and precisely what makes it testable without mocks, because the caller supplies the digest bytes.
**risk.** correctness. **wave.** W2.

#### P02 — the notification window · `notification-window.ts` · ~30 lines
**purpose.** Compute the mid-morning chime time and hard-block any prompt after 16:00.
**api.** `nextChimeAtMs(nowMs:number, tzOffsetMinutes:number, localHour:number, localMinute:number, caregiverOverride:boolean): number | null`, `export const HARD_BLOCK_LOCAL_HOUR: 16`.
**deps.** none.
**spec.** SYNTHESIS P8 (mid-morning; associative memory ~10% worse in the evening; 21.2% of memory-clinic patients sundown), ND-28, ND-29; DESIGN-SYSTEM §9.3 (the exact copy, no count, no streak, no badge; **if nobody picks the tablet up, nothing happens**).
**blind test.** A table over every hour 00–23: a time at or after 16:00 returns `null` unless `caregiverOverride`; otherwise it schedules mid-morning on the next local day. Boundaries at 15:59, 16:00, and across `tzOffsetMinutes` of −720 and +840. **Guilt-framed copy is structurally impossible because the function returns only a timestamp** — there is no message parameter and no count parameter.
**risk.** safety. **wave.** W2.

#### P03 — the P25 acute-change message · `acute-message.ts` · ~35 lines
**purpose.** Compose the acute-change message in physical-illness wording only, and decide whether it may be sent at all.
**api.**
```ts
export function p25Message(firstName:string): { recipient:'caregiver'; title:string; body:string };
export function mayNotify(i: { limb:'support'|'miss'|'absence'; lastFiredAtMs:number|null;
  nowAnchorMs:number; rateLimitMs:number; recipientHoldsPermission:boolean;
  enabled:boolean }): boolean;
export const ACUTE_FORBIDDEN_TERMS: readonly string[];
```
**deps.** none.
**spec.** SYNTHESIS P25 (**the wording, given verbatim**: *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."*; a defined threshold, a named recipient, **never a cognitive interpretation**), §6 requirement 10, P24, §8 S7; V1-PRODUCT-SHAPE §8.2 surface D (**B1 is on the critical path**); SCHEDULER-SPEC §17.1 (the scheduler never acts on the signal).
**blind test.** The rendered body contains `'physical illness'` and `'GP'` and matches **none** of `ACUTE_FORBIDDEN_TERMS` = {memory, decline, worse, cognitive, progression, dementia, deteriorat*} on word boundaries. `recipient` is `'caregiver'` for all three limbs — exhaustive over the limb domain — and **never the patient and never a clinician**. `mayNotify` is exhaustive over 3 limbs × the rate-limit boundary × `recipientHoldsPermission` × `enabled`, returning `false` whenever no recipient holds `can_receive_p25_alert` and `false` unconditionally when `enabled` is false.
**risk.** safety. **wave.** W2.

#### P04 — enrolment screening · `screening.ts` · ~70 lines
**purpose.** Turn the fourteen caregiver-reported observations plus the diagnosis of record into an eligibility outcome **and nothing else**. The return type is where ND-24 becomes structural: there is no numeric output of any kind.
**api.**
```ts
export type ScreeningAnswer = 'yes' | 'no' | 'not_sure';
export interface ScreeningInput { subtypeOnLetter: DementiaSubtype;
  answers: readonly ScreeningAnswer[]; }         // exactly 14, in §9 Gate 2 order
export type ScreeningOutcome =
  | { decision:'not_eligible'; reason:'PCA'|'svPPA' }
  | { decision:'defer'; reason:'acute_change'|'sensory'; weeks:number }
  | { decision:'eligible'; fluctuationBand:'standard'|'high' };
export function screen(i: ScreeningInput): ScreeningOutcome;
export const SCREENING_QUESTIONS: readonly { id:number; cluster:string; text:string }[]; // 14
```
**deps.** C01.
**spec.** V1-PRODUCT-SHAPE §9 in full — Gate 1 (diagnosis of record), Gate 2 (the fourteen questions **written as things a family already knows**, in four clusters), Gate 3 (the outcome table: any **two** PCA → not eligible; any two svPPA → not eligible; any two DLB → eligible with `fluctuation_band = high`; the acute gate → defer four weeks; the sensory gate → defer); ND-24 (never scored, never shown as a number, never described as an assessment); SYNTHESIS P26.
**blind test.** Exhaustive over the decision boundaries: one PCA yes is eligible, two is not; the same for svPPA; two DLB flags set `fluctuationBand: 'high'` and **do not exclude**; a PCA or svPPA subtype on the letter excludes regardless of answers; the acute gate defers four weeks and is **not** an exclusion; the sensory gate defers. **The return type admits no score and no count** — key enumeration. `SCREENING_QUESTIONS.length === 14` and every text matches §9's wording.
**risk.** safety. **wave.** W2.

#### P05 — the claim lint · `claim-lint.ts` · ~55 lines
**purpose.** Check any marketing, store or in-product string against the §2.2 forbidden-claims list, gating release. This is criterion **C3** as a build gate rather than a paragraph.
**api.** `export interface ClaimViolation { rule:number; matched:string; source:string }`, `lintClaims(text:string): readonly ClaimViolation[]`, `lintSurface(strings: readonly string[]): readonly ClaimViolation[]`.
**deps.** C13.
**spec.** SYNTHESIS §2.2 (the fifteen numbered banned claims, with the enforcement precedents — the FTC's $2M Lumosity order, the ASA ruling against GMRD upheld on an *implied* assessment, FDA's 2026 General Wellness guidance assessing intended use **objectively from marketing**), §8 Tier-4 C3, §9 items 1–4 and 12–14.
**blind test.** One positive fixture per numbered rule drawn **verbatim from §2.2**, including rule 15's `'~6-month delay in expected decline'`, which must be caught on sight. A compliant control page returns zero violations. The honest-claim paragraph of §2.1 returns zero violations. Matching is case-insensitive on word boundaries so a legitimate word containing a banned substring does not fire.
**risk.** safety. **wave.** W2.

---

### LAYER A — ADAPTERS · `src/adapters/`

Fifteen modules for 21 runtime dependencies. Every adapter's behavioural obligation is discharged by a C17 conformance suite, so an adapter contract states only what the suite cannot: the platform API, the configuration that is load-bearing, and the assertions that are native- or web-specific.

#### A01 — SQLite store · `db.sqlite.ts` · ~240 lines
**purpose.** The durable local store on native: `expo-sqlite` with SQLCipher, holding roster, cards, media, the scheduler journal, the outbox and sync metadata inside the app sandbox.
**api.** `makeSqliteDb(opts:{ key:string; name?:string }): Promise<Db>`, `migrateLocal(db): Promise<void>`, `wipeLocal(db): Promise<void>`. Local tables: `roster`, `cards`, `card_media`, `sched_journal`, `events` (outbox), `sync_meta`, `device_meta`.
**deps.** C10, C17.
**spec.** ADR-PLATFORM §3 (`expo-sqlite` with **`useSQLCipher: true`** — first-party, config plugin plus `PRAGMA key`), §4.2 (**note the absence of `schedule_state`**); declared deviation **D-2** (the `sched_journal` table is the device's local reconstruction and is never uploaded).
**blind test.** `describeDbPort(makeSqliteDb)` — the identical suite `db.memory` passes. Plus native-only: a transaction that throws mid-way leaves **no partial rows**; `wipeLocal` leaves zero tables; **opening with the wrong key fails rather than returning empty results**, which proves encryption is on and not merely configured.
**risk.** privacy. **wave.** W2.

#### A02 — in-memory store and outbox · `db.memory.ts` · ~180 lines
**purpose.** The same store and outbox held in memory for the browser build and for every component test.
**api.** `makeMemoryDbAdapter(seed?): Promise<Db>`, `makeMemoryOutboxAdapter(): Promise<Outbox>`, `hydrate(db, snapshot): Promise<void>`.
**deps.** C10, C17.
**spec.** ADR-PLATFORM §4.1 (**the browser build is online-first and makes no multi-day-offline promise**; it runs the full patient surface against an in-memory `Db` hydrated at load, with the outbox POSTed immediately rather than queued, and it is labelled as such), §6.3 (**two implementations, not three — the IndexedDB backend is deleted**).
**blind test.** `describeDbPort` and `describeOutboxPort`, byte-for-byte the same suites A01 and A03 pass. **Divergence between the two implementations is a failure in the shared suite rather than a production surprise, and that is the entire justification for the module existing separately from a test double.**
**risk.** correctness. **wave.** W2.

#### A03 — the durable outbox · `outbox.sqlite.ts` · ~140 lines
**purpose.** The telemetry queue that is never lost: appended in the same transaction that advances the UI, drained strictly in `seq` order, deleted only on a per-id acknowledgement.
**api.** `makeSqliteOutbox(db: Db): Outbox`, `export const OUTBOX_ALARM_BYTES: 52_428_800`, `outboxHealth(o): Promise<{depth; bytes; alarm; oldestSeq}>`.
**deps.** C10, C17, A01, Y02.
**spec.** ADR-PLATFORM §4.3 (the four testable properties: **write-before-render**, `event_id` as the server primary key, deletion only on per-id ACK, `seq` gaps detectable) and its eviction policy (**media is deleted to make room; the outbox never is**), §4.5 (the outbox is never discarded at hard expiry); ADR-DATA §6.4, §6.8.
**blind test.** `describeOutboxPort(makeSqliteOutbox)`. Plus **V6 as an integration case:** destroy the SQLite database, keep the Keychain boot ordinal, sign in, emit 100 events — assert **zero quarantine rows and 100 log rows**. Write-before-render is proved by aborting the transaction at a sampled set of frame changes and asserting that neither the event nor the UI advance survives. The 50 MB alarm fires. `evictTo` on the media store never removes an outbox row.
**risk.** correctness. **wave.** W3.

#### A04 — native media store · `media.native.ts` · ~130 lines
**purpose.** Content-addressed media on the filesystem: download, verify the hash, then flip to ready.
**api.** `makeNativeMediaStore(digest: Digest, dir?: string): MediaStore`, `mediaPath(sha256): string` — `${documentDirectory}media/<sha256>`.
**deps.** C10, C17, A09.
**spec.** ADR-PLATFORM §4.2 (content addressing; a row flips to `ready` only after the download completes **and** the hash verifies), §8 (distribution, playback from the local `file://` URI, and the erase path that must delete the **file** as well as the row); ADR-DATA §10.4 (the purge receipt is an ordinary telemetry event carrying `local_file_existed`).
**blind test.** `describeMediaStorePort`. Decisive cases: a file whose bytes do not hash to its name returns `'hash_mismatch'`, is rejected, and **leaves no file behind**; `purge` returns whether a file existed, which is the value the `media.purged` receipt carries; two cards sharing one `sha256` store one file; `evictTo` removes media in a defined order and returns bytes freed.
**risk.** privacy. **wave.** W4.

#### A05 — web media store · `media.web.ts` · ~70 lines
**purpose.** Object-URL media for the browser build, with the same interface and no durability promise.
**api.** `makeWebMediaStore(digest: Digest): MediaStore`.
**deps.** C10, C17.
**spec.** ADR-PLATFORM §4.1, §6.3 (Playwright's WebKit proves interaction logic and layout geometry, **not codec behaviour and not storage durability**).
**blind test.** `describeMediaStorePort` with the durability clauses marked unsupported by the suite's declared capability flag, and asserted to **throw a named error rather than silently succeed**. The point of the module is that the patient surface's rendering path is identical in the browser, so U05's E2E assertions exercise real media handling rather than a stub.
**risk.** correctness. **wave.** W3.

#### A06 — Keychain store · `secure.native.ts` · ~90 lines
**purpose.** The three secrets that live in the Keychain — the device credential, the SQLCipher key and the boot ordinal — under the access class that **refuses to exist on a passcode-less tablet**.
**api.** `makeSecureStore(): SecureStore`.
**deps.** C10, C17.
**spec.** ADR-PLATFORM §5.2 ("Storage on the tablet": `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`, why `AfterFirstUnlock` is wrong for a tablet that is never powered off, and the two deliberate consequences — **the MDM passcode requirement becomes enforced in code rather than written in a deployment protocol nobody reads**, and removing the passcode later destroys the item and forces re-enrolment); "on web, `expo-secure-store` does not exist — the browser build has **no enrolment path at all**"; ADR-DATA §6.1 (`boot_ordinal` survives reinstall).
**blind test.** `describeSecureStorePort`. The two that matter: setting an item on a simulated passcode-less device throws **`PasscodeRequiredError`** and enrolment must not proceed; `nextBootOrdinal` is **strictly increasing across simulated cold starts even when the SQLite database has been destroyed in between** — which is scenario V6, the reinstall that would otherwise brick a tablet. `clear()` makes every getter `null`. There is **no web counterpart**, by design, asserted by the absence of the file from the web bundle.
**risk.** privacy. **wave.** W3.

#### A07 — the Supabase client · `supabase.ts` · ~130 lines
**purpose.** The one client factory: **no persisted session, no auto-refresh, no stored refresh token** — every token acquisition is an idempotent, retryable-forever password sign-in.
**api.** `makeClient(url, anonKey): SupabaseClient`, `signInAsDevice(client, cred): Promise<{ok:true}|{ok:false; revoked:boolean; retryAfterMs:number}>`, `signInAsUser(client, email): Promise<void>` (magic link, **no social providers**), `wipeOnRevocation(deps:{db; media; secure}): Promise<void>`.
**deps.** C09, C10.
**spec.** ADR-PLATFORM §5.1 (the three tempting answers that are all wrong, and why), §5.2 ("Session": `persistSession: false, autoRefreshToken: false, detectSessionInUrl: false`; a failed sign-in is retried with backoff **forever** using the same stored secret and **cannot brick the device**), §5.2 "Revocation" (wipe SQLite, the media directory and both Keychain items **before rendering anything**), §5.4 (magic link, no social providers, so guideline 4.8 never fires).
**blind test.** Against a local Supabase: a correct credential signs in, and the same call repeated ten times succeeds ten times — **proving idempotence and the absence of rotation state**. A banned auth user returns `revoked: true`, distinguishable from a network error which returns a backoff. `wipeOnRevocation` leaves zero SQLite tables, zero media files and zero Keychain items, **asserted in that order and asserted to run before any render**. A structural assertion that the options object contains exactly the three `false` flags. **No test may reference a refresh token, because none is ever requested or stored.**
**risk.** privacy. **wave.** W3.

#### A08 — the sync client · `net.sync.ts` · ~180 lines
**purpose.** Perform the one sync round trip as the device itself, validate the response, and apply the plan.
**api.** `makeSyncClient(deps:{client; clock; monoClock; outbox; db; media; secure}): Net & { drain(): Promise<{pushed; acked; retained; expired}> }`.
**deps.** C09, C10, T01, T02, T08, Y01, Y02, Y03, A07.
**spec.** ADR-PLATFORM §4.4 (one Edge Function, one round trip: push up to 500 events plus the cursor; pull the deltas plus server time and the new cursor), §4.5; ADR-DATA §6.8 (**`Prefer: return=minimal`, because `RETURNING` requires the `SELECT` the device does not have**; HTTP 201 is not an ACK), §6.4 (the response returns the server's boot anchors and **the device re-folds**).
**blind test.** Against a local Supabase with the real migrations: push 501 events and assert exactly 500 go in the first batch **in ascending `seq`**; a response listing an id in neither `accepted` nor `quarantined` leaves that outbox row present; a `retryable:true` quarantine retains and backs off; the returned `boot_anchors` are applied and a subsequent local fold produces the same `anchoredAtMs` the server stored (**V9's device half**). The pull's `cards_delta` is passed through T08 and the derived events land in `sched_journal`. **A CI source check asserts this module never constructs a client from a service-role key.**
**risk.** privacy. **wave.** W4.

#### A09 — clocks, ids and randomness · `platform.ts` · ~110 lines
**purpose.** **The only file in the app permitted to name `Date`, `performance`, `crypto` or `Math.random`.** Wall time, the study day index, the boot-scoped monotonic clock, SHA-256, HMAC, UUIDv7 and bounded random integers.
**api.** `makeClock(tzOffsetMinutes): Clock`, `makeMonoClock(): MonoClock`, `makeDigest(): Digest`, `makeRng(): Rng`, `uuidv7(nowMs:number, randomBytes:Uint8Array): string`, `permutation(rng, n): readonly number[]`.
**deps.** C10, S01, T02.
**spec.** ADR-PLATFORM §3 (`expo-crypto` for SHA-256 content addressing and UUIDv7 generation), §4.3 (**clocks are not trusted**; within-session latency is `t_mono_ms` deltas scoped to a `boot_id`), §6.2 (`no-restricted-globals` inside `src/domain/**`); ADR-DATA §6.3, §6.9; SCHEDULER-SPEC §1.3, §1.4.
**blind test.** `uuidv7` is **injectable-deterministic**: with a fixed `nowMs` and a fixed random source it produces a fixed string, sorts lexicographically in time order, and matches the RFC layout. `sha256Hex` matches published vectors and `hmacSha256` matches RFC 4231 vectors — **no mocking required, the answers are public constants.** `makeClock().localDayIndex()` equals `S01.localDayIndex(fixedNow, tz)` for a frozen fake time. `makeMonoClock` is non-decreasing within one `bootId` and regenerates `bootId` on cold start. `nextInt(n)` is uniform over `[0,n)` by a chi-square over 10⁵ draws and never returns `n`. **G01 asserts this file and no other in `src/**` names a restricted global**, and that nothing in `src/domain/scheduler/**` calls `makeRng`.
**risk.** correctness. **wave.** W3.

#### A10 — native audio · `audio.native.ts` · ~200 lines
**purpose.** Speech and tone playback with the audio-session category that survives the silent switch, continuous route-and-interruption monitoring, and the recording codec rule.
**api.** `makeNativeAudio(opts:{ output: AudioOutput }): Promise<AudioOut>`, `makeNativeRecorder(): Promise<Recorder>` (**caregiver surface only**, D-3), `isAcceptedAudioContainer(mime): boolean`.
**deps.** C10, C14.
**spec.** DESIGN-SYSTEM §9.4 (**`AVAudioSession` category `.playback` is a HARD requirement — `.ambient`, the plausible "polite" default, plays nothing when the silent switch is on, which would delete the entire audio channel with no visible symptom**), §9.5 (`audio_output`; `captions_only` suppresses speech **and the transition tone**), §9.6 (continuous route and interruption monitoring; on route loss fall back to the device speaker and re-run a sub-audible output confirmation; **the session never refuses to start and never stops**); ADR-PLATFORM §8 (the webm/opus trap and the four-part codec rule).
**blind test.** `isAcceptedAudioContainer` is a pure table test, and the ADR's own prescribed fixture test runs **real files captured from both browser families** through it, asserting `audio/webm;codecs=opus` is rejected and `audio/mp4|m4a|aac` accepted. Maestro on the simulator: the session is audible **with the silent switch on**. A simulated route loss increments `routeChanges`, falls back to the speaker, re-runs the confirmation, and **the session continues on captions**. `captions_only` produces zero playback calls while the caption channel is unaffected.
**risk.** safety. **wave.** W3.

#### A11 — web audio · `audio.web.ts` · ~90 lines
**purpose.** Browser audio for the demo and E2E build, with the mp4 capability gate and the operator-facing start affordance **that exists only on web**.
**api.** `makeWebAudio(): Promise<AudioOut & { requiresStartGesture: true }>`, `makeWebRecorder(): Promise<Recorder | null>`.
**deps.** C10.
**spec.** DESIGN-SYSTEM §9.4 (**the demo-build trap**: browsers block autoplay without a gesture, so the artefact most stakeholders will see — **including B6, which P32 makes a gate on the mechanic freeze** — is the one build where this direction's autoplay property is absent; the web build therefore ships an explicit operator-facing start affordance compiled out of the native patient build, and **B6 must run on native hardware, on a stand, in a real day room**); ADR-PLATFORM §8 (web capture requests `audio/mp4` or the record button is **disabled** with "please record in the app on your phone").
**blind test.** Playwright: when `MediaRecorder.isTypeSupported('audio/mp4')` is false, `makeWebRecorder` returns `null` and the caller must disable the control with the exact sentence. `requiresStartGesture` is `true` on web and **the symbol is absent from the native bundle**, asserted by a bundle grep.
**risk.** correctness. **wave.** W3.

#### A12 — voice activity detection · `vad.ts` · ~90 lines
**purpose.** On-device energy-and-zero-crossing voice activity detection. **Not ASR, never words, never correctness, and no waveform persisted from a demand page.**
**api.** `makeVad(opts:{ frameMs; energyThreshold; zcrThreshold }): Promise<Vad>`, `export const PERSISTS_WAVEFORM: false`.
**deps.** C10.
**spec.** DESIGN-SYSTEM §6.3 (the B2 speech gate: **it is not ASR, it never sees words, it never determines correctness, and no waveform is persisted from a demand page** — so P27 and ND-26 are untouched); §8.4 (the M-35 sentinel takes features only); SYNTHESIS P27, ND-26; declared deviation **D-3**.
**blind test.** Fed recorded fixture buffers: silence yields `active: false`, speech yields `active: true`, and a 60 dB room-noise fixture is documented **with its false-positive rate** rather than assumed away. The load-bearing tests are negative and structural: **the module exports no transcript, no token, no word and no confidence; its source contains no speech-recognition import; and a filesystem assertion after a full demand-page run finds zero audio files written.** Paired with R02's A43, which proves the detector's output only ever *extends* a dwell and never shortens one or changes a grade.
**risk.** privacy. **wave.** W3.

#### A13 — device services · `device-services.ts` · ~90 lines
**purpose.** Notification scheduling with the 16:00 hard block, battery reporting, and connectivity transitions.
**api.** `makeNotifications(): Notifications`, `makeBattery(): Battery`, `onConnectivityChange(cb): () => void`.
**deps.** C13, C14, P02.
**spec.** DESIGN-SYSTEM §9.3 (the chime: exact copy, hard block after 16:00, **no badge**, and the honest framing that no Expo app can wake a sleeping iPad), §11.5 (`expo-battery`; below 25% the session ends at the next zero-demand boundary; and the plain statement that the iOS Low Battery alert is a system modal **Guided Access does not suppress and neither can we** — the mitigation is deployment, not code); ADR-PLATFORM §3 (`expo-network`); SYNTHESIS P8, ND-28, ND-29.
**blind test.** `scheduleChime(null, …)` schedules **nothing**. The body string is exactly `COPY.notification` and passes the banned-lexicon check. **No badge, count, streak or repeat-on-miss field is settable, because the signature admits none** — a missed chime schedules nothing. `battery.level()` drives R05's truncation only at a zero-demand boundary.
**risk.** safety. **wave.** W3.

#### A14 — image capture · `image.ts` · ~60 lines
**purpose.** Caregiver photo capture and downscale to 1600 px longest edge before upload. **The one place P20 is most tempting to break.**
**api.** `capturePhoto(): Promise<{uri; width; height} | null>`, `pickFromLibrary(): Promise<{uri; width; height} | null>`, `downscale(uri, maxEdge): Promise<{uri; bytes; mime:'image/jpeg'}>`.
**deps.** none beyond Expo.
**spec.** ADR-PLATFORM §8 (capture: `expo-camera`, `expo-image-manipulator` downscales to **1600 px longest edge before upload**); SYNTHESIS P20, ND-17 (**no face detection, face clustering, auto-tagging or voiceprint processing — ever, in any jurisdiction**); V1-PRODUCT-SHAPE §3 ("this is why the deck is capped at 8–10 items rather than a whole album").
**blind test.** `downscale` of a 4032-px fixture yields a longest edge of **exactly 1600** and a mime of `image/jpeg`. A capture returning `null` (user cancelled) **must not be an error path**. **No face-detection API is imported — asserted by a bundle grep, which is the P20 enforcement point** and is also checked repository-wide by G01.
**risk.** privacy. **wave.** W3.

#### A15 — storage upload · `storage.ts` · ~60 lines
**purpose.** Upload caregiver media to the private bucket at `patient/<id>/<sha256>`, TUS-resumable above ~6 MB.
**api.** `uploadMedia(client, patientId, localUri, sha256, mime, bytes): Promise<'ok'|'conflict'|'failed'>`.
**deps.** A07, A09.
**spec.** ADR-PLATFORM §8 (upload: direct to a private Supabase Storage bucket, RLS on `storage.objects`, TUS above ~6 MB); ADR-DATA §5.4 (the `storage_path_matches` constraint), §12.5 (the single caregiver policy; **the device has no policy and no grant on `storage.objects` at all** — media reaches a tablet only through short-lived signed URLs).
**blind test.** Against a local Supabase: the object lands at **exactly** `patient/<uuid>/<hex>`; a path not matching the constraint is **rejected by the database, not by the client**; a re-upload of the same `sha256` is a conflict, not a duplicate. A device token attempting the same upload receives `42501` (a `policies.ts` row).
**risk.** privacy. **wave.** W3.

---

### LAYER B — BACKEND · `supabase/`

36 modules for 30 migration files, six edge functions and one script — **fewer modules than artefacts**. Migration modules are authored in parallel within a wave (ADR-DATA specifies each file's DDL completely) and **applied in migration-number order**.

#### B01 — roles, the floor, the schemas and the token hook · `0001_roles_and_floor.sql`, `0002_schemas.sql`, `0003_authn.sql` · ~170 lines
**purpose.** The security floor: nine real Postgres roles, ten schemas, every default privilege revoked, and an access-token hook whose unrecognised branch fails closed.
**api.** the nine roles (`device`, `caregiver`, `carehome_admin`, `researcher`, `trial_ops` granted to `authenticator`; `log_writer`, `app_view_owner`, `bridge`, `ops_view_owner` granted to **nobody**); the ten schemas with their authorizations; `authn.access_token_hook(jsonb)`, `authn.jwt_role()`, `authn.device_id()`, `authn.care_home_id()`.
**deps.** none.
**spec.** ADR-DATA §3 (the schema and grant map, and the three `information_schema` assertions), §3.1 (**real Postgres roles, not JWT string comparison** — because if every logged-in user holds `authenticated`, "de-identification is a missing grant" is a `WHERE` clause in disguise; plus the week-1 verification gate), §3.2 (the hook, verbatim, and **the load-bearing unrecognised-role branch**).
**blind test.** pgTAP: the three §3 assertions return exactly the stated row sets against an empty database. `access_token_hook` is a pure function of its argument — feed it a null role, a misspelled role, a role taken from **`user_metadata`** rather than `app_metadata`, and a forged role, and assert **every one yields `authenticated`**, which holds nothing anywhere. **V22:** attempt to write `app_metadata` from every client role, assert failure, re-mint a token, assert the role is unchanged. And the gate everything rests on: `select 1 from app.patients` as a researcher JWT returns **`42501`, not zero rows**.
**risk.** privacy. **wave.** W2.

#### B02 — app types, banding functions, tenancy and people · `0004_app_types.sql`, `0005_app_tenancy_people.sql` · ~320 lines
**purpose.** Every `app` enum and banding function, plus care homes, users, memberships, patients, caregiver links and the enrolment screening — with the constraints that make ND-35 and P23 unforgeable at the storage layer.
**api.** the 18 enums of §5.1; `app.age_band`, `app.era_band`, `app.relationship_group`, `app.valence_band`, `app.importance_band`, `app.tod_bucket`; `app.care_homes`, `app.user_profiles`, `app.memberships`, `app.patients`, `app.patient_caregivers`, `app.enrolment_screenings`; `app.enforce_disclosure()`.
**deps.** B01.
**spec.** ADR-DATA §5.1 (the DDL verbatim, every constraint and every partial unique index), §8.4 (the coarsening the banding functions must implement); V1-PRODUCT-SHAPE §9 (the three enrolment gates and what each outcome does).
**blind test.** pgTAP: **an `app.patients` row with `dementia_subtype` PCA or svPPA and a non-null `enrolled_on` cannot be committed by any path including `service_role`** (ND-35 as a constraint, not a policy). An `enrolment_screenings` row asserting eligibility with `pca_positive_count >= 2` is rejected. `paid_carer_is_not_a_consultee` and `paid_carer_cannot_manage_consent` reject a paid-staff link attempting either (B12). A caregiver link carrying a permission absent from `disclosed_permissions` raises **23514** (P23 made enforceable). The two partial unique indexes permit exactly one primary caregiver and exactly one P25 recipient. `app.dissent_channel` has **no `inferred_classifier`** member and `app.retired_by_role` has **no `algorithm`** member. Every banding function is total over its input domain with one fixture per output member, and **matches its TypeScript twin in T04 on the same inputs**.
**risk.** safety. **wave.** W2.

#### B03 — consent, capacity and dissent · `0006_app_consent_capacity.sql` · ~230 lines
**purpose.** The consent machine in which a caregiver cannot record that a patient consented — **not because a policy forbids it, but because the sentence cannot be formed.**
**api.** `app.consent_events` with all seven CHECKs, `app.capacity_records`, `app.consent_state`, `app.consent_permits(uuid, app.consent_purpose)`, `app.capacity_review_current(uuid)`, the dissent trigger.
**deps.** B02.
**spec.** ADR-DATA §5.2 (the DDL verbatim), §7.1 (**MCA 2005 ss.30–33 as a `CHECK`**, with the two flanking constraints: a caregiver may never be the recorder of a "the subject consented" row on any pathway, and entry is harder than exit), §7.2 (expiry is a **processing state, not a reminder**), §7.3 (six separable purposes), §7.4 (behavioural withdrawal with teeth; `dissent_active` is absorbing), §7.6, §7.7; SYNTHESIS P22, P23, ND-21; §8 S6.
**blind test.** pgTAP, and these are the highest-value rows in the whole suite. **On the consultee pathway, a row with any outcome meaning "consented" raises 23514 — asserted for every outcome value in the enum, proving no such value exists.** A caregiver inserting `subject_consented` raises; inserting `initial` raises; inserting `withdrawal` or `dissent_observed` **succeeds** — the role that cannot let someone in can always let them out. `consent_permits` returns false the day `reaffirm_due_on` passes, **with no cron having run**. `capacity_review_current` returns false when **no capacity record exists at all** — absence of evidence is not consent. Inserting `dissent_observed` sets `processing_paused_at`, sets `dissent_active`, and writes a revocation row in the same transaction; only a clinician-recorded `reinstated` clears it, and an `initial` row does not. **V20:** drop `app.consent_state`, rebuild from `consent_events`, assert an identical table.
**risk.** privacy. **wave.** W2.

#### B04 — devices, enrolment and arm assignment · `0007_app_devices_enrolment.sql` · ~160 lines
**purpose.** Tablets, their patient assignments, single-use enrolment codes, the frozen per-participant trial arm, and the install record.
**api.** `app.devices` (plus **D-10**: `ambient_lux_at_install`, `display_nits`, `install_checklist jsonb`), `app.device_patients` (with **soft** `unassigned_at`), `app.enrolment_codes`, `app.arm_assignment` + its `BEFORE UPDATE` trigger, `app.device_patient_ids()`, `app.device_ever_served(uuid)`.
**deps.** B02.
**spec.** ADR-PLATFORM §5.2 (the schema, the 10-minute TTL, five failed attempts burn the code, `hard_expiry_days >= 4`); ADR-DATA §5.3 (`auth_user_id` and `device_id` are `ON DELETE RESTRICT`, **deleting a device must never be able to delete telemetry**; `unassigned_at` is soft because the erasure ledger and the ingest gate need it), §6.9 (M3 lives in `arm_assignment` with a trigger that raises), §12.2; DESIGN-SYSTEM §12.8 A49–A52; **D-10**.
**blind test.** pgTAP: `hard_expiry_days = 3` is rejected by CHECK. **No `CASCADE` path reaches `log.event_log` from `auth.users` or `app.devices`** — a `pg_constraint` walk. Two concurrent redemptions of one code: the atomic update means exactly one returns a `device_id`. A sixth attempt on a code with `attempts = 5` fails. **Updating an `arm_assignment` row raises**, forcing a visible superseding row. `device_ever_served` returns true for a patient the device has been **unassigned** from while `device_patient_ids` excludes them — the two functions must differ on exactly that case, which is the reassigned-tablet backlog scenario.
**risk.** privacy. **wave.** W2.

#### B05 — depicted persons, media and content · `0008_app_content_media.sql` · ~380 lines
**purpose.** The third-party consent chain, the media object with its retention date and codec constraint, the decks and items, the generic library, and the gates that stop a deceased person reaching a recognition mechanic.
**api.** `app.depicted_persons`, `app.media_objects`, `app.media_subjects`, `app.decks`, `app.items`, `app.item_media`, `app.generic_library`; `app.enforce_media_release()`, `app.set_destroy_by()`, `app.enforce_recognition_gate()`, `app.retract_recognition_on_status_change()`.
**deps.** B02.
**spec.** ADR-DATA §5.4 in full (the DDL verbatim; **the release gate that closes the vacuous-truth hole and runs at readiness, not at attach**; the note that the recording caregiver is a depicted person of their own voice and holds their own release row; the recognition gate in **two places** — a trigger so the row cannot exist, and the device view so a compromised client cannot route around it; and the reverse-direction retraction that reaches the tablet), §10.9 (BIPA retention enforced by `destroy_by NOT NULL`); SYNTHESIS P16, P20, ND-12, ND-17; ADR-PLATFORM §8 (the codec rule in the schema).
**blind test.** pgTAP: inserting a depicted person **without `person_status` raises 23502** — NOT NULL with no default, so P16 cannot be skipped. A media object flipped to `ready` with zero subject rows **and** no `no_persons_depicted_attested_by` raises 23514 — **absence of a tag must not read as absence of a person** (BIPA §15(b)). A subject whose release basis is `none_held` blocks readiness. A voice caption with `mime = 'audio/webm'` is rejected **by the schema**, closing the codec trap at the storage layer. `storage_path` must equal `'patient/' || patient_id || '/' || encode(sha256,'hex')`. `probe_is_never_personal` rejects a probe item with a `depicted_person_id`. **And the P20 defence, which is a schema invariant and not a policy: no `vector`/`pgvector`/`cube` extension is installed, and no column in *any* schema is named or typed as an embedding, template, faceprint, voiceprint, descriptor, `speaker_id` or `face_bbox`.**
**risk.** privacy. **wave.** W2.

#### B06 — safety, alerts, revocations and the two ledgers · `0009_app_safety_revocations.sql`, `0010_app_erasure_export.sql` · ~230 lines
**purpose.** The adverse-event register, the P25 notification whose recipient can only be a caregiver, revocations and their acknowledgements, and the erasure and export request ledgers.
**api.** `app.adverse_events`, `app.acute_change_notifications` + `app.enforce_p25_recipient()`, `app.revocations`, `app.revocation_acks`, `app.clinician_assessments` (plus **D-9**: `subject_role text not null check (subject_role in ('patient','caregiver'))`), `app.medication_and_comorbidity`, `app.erasure_requests`, `app.export_requests`.
**deps.** B02, B05.
**spec.** ADR-DATA §5.5 (the DDL verbatim), §10.3 (the nine stage timestamp columns), §10.5 (**the closing invariant**), §10.8 (`redaction_profile` and where the log is readable); SYNTHESIS §7 (`adverse_event`, `clinician_assessment`), P24, P25, §8 S1/S2/S5/S7; **D-9**.
**blind test.** pgTAP: **an `acute_change_notification` addressed to a clinician or to the patient raises**; addressed to a caregiver holding `can_receive_p25_alert` it succeeds — a clinician-addressed acute-change notification is the MDR Rule 11 trigger and must be **impossible, not unimplemented**. `adverse_events.narrative` exists in `app` and is asserted **absent from every research table and every analysis view** (paired with B17). A revocation acknowledgement is unique per `(revocation_id, device_id)`. `erasure_requests` carries **no `participant_code` column** — and the cross-plane assertion runs: **no table anywhere carries both a participant-pseudonym-shaped and a patient-identifier-shaped column**. `clinician_assessments` admits GHQ-28-anxiety and HADS-A with `subject_role = 'caregiver'`, which is where S5 lives.
**risk.** privacy. **wave.** W2.

#### B07 — the identity bridge · `0011_identity.sql` · ~130 lines
**purpose.** The two maps and the pepper reference, with disjoint readers and a frozen day-0 anchor. **The smallest structure in the design and the one everything else rests on.**
**api.** `identity.subject_map` (`patient_id` **ON DELETE RESTRICT**), `identity.participant_map` (`subject_id` nullable and **deliberately not a foreign key**), `identity.study_pepper` (a Vault reference, never the bytes), `identity.freeze_anchor()`, and the two `subject_map` policies.
**deps.** B01, B02.
**spec.** ADR-DATA §4 in full — the three tables, the disjoint readers, **the property stated at exactly its true strength**, severance rather than deletion, and the immutability of the anchor.
**blind test.** pgTAP: `researcher` has **no `USAGE` on `identity`**, so `select * from identity.participant_map` returns **`42501` — a privilege error, not an empty result set**. `participant_map` and `study_pepper` are granted to **nobody** — asserted for all five login roles. A caregiver can read the `subject_map` row for their own patient and no other. Changing `enrolled_on` or `tz_offset_minutes` once any event exists for that subject raises **23514**; before any event exists it succeeds. **Deleting a patient while a live `subject_map` row exists raises** — proving severance must be its own ordered step and cannot happen by cascade.
**risk.** privacy. **wave.** W2.

#### B08 — the payload firewall and the event registry · `0012_log_registry.sql` · ~180 lines
**purpose.** The rule that a payload string may only be a snake token, a UUID, a hex digest or a dotted version — and the registry that makes an unknown type a quarantine row rather than a bricked tablet.
**api.** `log.event_type`, `log.payload_vocabulary`, `log.payload_shape_ok(jsonb, int)` (immutable, parallel safe), `log.assert_payload_vocabulary()`.
**deps.** B01.
**spec.** ADR-DATA §6.5 (the three layers, with the exact plpgsql for layer 1 and **the reason "no string may contain a space" is insufficient — a first name contains no space either**), §6.6 (**a registry, not a Postgres `enum`**, because an unknown enum value is a `22P02` raised at parse time that aborts the entire batch and bricks every tablet on a TestFlight ring).
**blind test.** **V10, the decisive one:** a 5,000-entry first-name dictionary in original case, lowercased, underscore-joined and hyphen-joined, pushed through every registered type and every string field, asserting **100% rejection**. Unit cases: `"Margaret"` fails on the leading capital, `"Margaret Thatcher"` on the space, `"14 Elm Street"` on both, and **`"margaret"` passes the shape and must be caught by the vocabulary layer**. Depth 5 rejected; a 65-element array rejected. `log.event_type` holds exactly **20** rows and exactly **14** carry `is_scheduler`, cross-checked against C06's `EVENT_SCHEMA` key set.
**risk.** privacy. **wave.** W2.

#### B09 — the event log and the hash chain · `0013_log_event_log.sql` · ~250 lines
**purpose.** The append-only log that is the source of truth: opaque subject ids, a per-device hash chain in arrival order, a generated ordering key, and a mutation trigger that refuses even the owner.
**api.** `log.event_log` (with the generated `ordering_key`, both unique constraints and both payload CHECKs), `log.boot_anchor`, `log.device_chain`, `log.quarantine`, `log.projection_queue`, `log.content_change`, `log.chain_break_register`; `log.deny_mutation()`, `log.verify_chain(uuid)`, `log.write_server_event(...)`.
**deps.** B07, B08.
**spec.** ADR-DATA §6.7 (the DDL verbatim and the four load-bearing decisions), §6.3 (the boot anchor and its five properties), §6.4 (the canonical total order, materialised), §10.6 (the chain-break register and the single GUC-gated delete path).
**blind test.** pgTAP: **`UPDATE`, `DELETE` and `TRUNCATE` on `log.event_log` all raise `42501` — asserted as the table owner and as `service_role`**, because RLS forced with zero policies means nobody reads and the trigger means nobody writes. `ordering_key` sorts identically to `(anchored_at_ms, device_id, seq)` over a shuffled fixture. **`log.verify_chain` walks `chain_pos`, not `seq`, and reports a `seq` gap as information rather than as a fault** — an honest device with an out-of-order arrival produces zero `hash_mismatch` rows and one gap row. A registered chain break reports as registered, not as tampering. `log.content_change` stores column **names** and never values, so the audit does not become a second unerasable copy of the person's name.
**risk.** privacy. **wave.** W2.

#### B10 — ingest and the canonicaliser · `0014_ingest.sql` · ~260 lines
**purpose.** The device's two write targets and the statement-level canonicaliser **whose per-row savepoint means no single row can ever abort a batch.** With the device auth path, the highest-consequence function in the repository.
**api.** `ingest.event`, `ingest.session` (INSERT only, **column-scoped**, to role `device`), `ingest.canonicalise()` (`AFTER INSERT ... REFERENCING NEW TABLE AS inserted FOR EACH STATEMENT`), `log.replay_quarantine(text)`.
**deps.** B07, B08, B09.
**spec.** ADR-DATA §6.7 (**the canonicaliser verbatim, and its four load-bearing decisions**: the per-row `BEGIN … EXCEPTION` block that makes it safe for the free-text firewall to be a `CHECK`; one statement-level loop under one chain-head lock because a `BEFORE ROW` trigger cannot see rows inserted earlier in the same statement; the chain following **arrival** (`chain_pos`) and not `seq`; and that it **inserts, chains and enqueues but does not project**), §6.2 (idempotency in three layers, and that a `seq` collision is **quarantined, not dropped and not raised**), §6.3, §6.8; and **"a queue, deliberately, and not an `ingest_seq > watermark` cursor"** — identity columns are allocated before commit, so a watermark worker silently drops events.
**blind test.** **V7:** one bad row in a 400-row batch yields 399 log rows, 1 quarantine row, HTTP 200 and a per-id ACK that omits the bad one. **V8:** an unknown type is `retryable: true`, unACKed and durably quarantined; register the type, run `replay_quarantine`, assert the event lands. **V2:** 50 batch-arrival permutations across devices preserving FIFO within each device, ingested into a fresh database each time, replayed and hashed — **all 50 identical**. **V4:** `anchored_at_ms` is non-decreasing in `seq` for every device. **V5:** three boots, 72 hours, one push, day offsets 0/1/2. **V6:** reinstall with a preserved Keychain ordinal — zero quarantine. A device naming `anchored_at_ms`, `ingest_seq`, `chain_pos` or `received_at` gets **`42501` at parse time**, because those columns are not in the column-level grant.
**risk.** privacy. **wave.** W2.

#### B11 — app→log triggers · `0015_app_to_log_triggers.sql` · ~190 lines
**purpose.** Emit the seven server-written scheduler events from human-written rows, so the log stays the single ordered input to `fold` **without anybody inventing a synthetic event for a spelling correction**.
**api.** AFTER triggers on `app.items` (`item.added`, `item.content_ready_changed`, `item.tier_set`, `item.retired`, `item.re_enabled`), on `app.depicted_persons` (`item.recognition_block_set`), and on `app.adverse_events` where `probe_disabled_as_result` (`probe.disabled_set` — **declared deviation D-11**), all written under `SERVER_DEVICE_ID` and a `log.server_seq` sequence.
**deps.** B05, B06, B09.
**spec.** ADR-DATA §6.6 (the server-written types, the fixed all-zeros server device id, and **why it sorts first**: a server event and a device event in the same millisecond put the item creation before the trial that uses it — the only ordering anyone would want); **D-11 and DEFECT-3 of this manifest**.
**blind test.** pgTAP: inserting an item emits exactly one `item.added` whose payload key set deep-equals `EVENT_SCHEMA.ItemAdded` and validates against the registry schema. **A spelling correction to `one_sentence` or `headline_name` emits no event at all.** Flipping a depicted person to `deceased` emits `item.recognition_block_set` for **every** item that names them and for no other item. An adverse event with `probe_disabled_as_result = true` emits exactly one `probe.disabled_set{disabled:true}`. **No trigger anywhere can emit `item.retired` with `by = 'algorithm'` — the value does not exist in `app.retired_by_role` and is absent from the payload vocabulary.** Ordering: the all-zeros device id sorts before any real device in the same millisecond.
**risk.** safety. **wave.** W3.

#### B12 — log→app reactors · `0015b_log_to_app_reactors.sql` · ~110 lines
**purpose.** **The fix for the unowned `absorbing_since` writer.** Two AFTER INSERT triggers on `log.event_log` that reach back into `app` for the two facts the device observes and the operational plane must act on.
**api.**
```sql
log.on_distress_reported()   -- type = 'distress.reported': resolve subject_id -> patient_id via
                             -- identity.subject_map, resolve the subject item from the payload
                             -- (or the session's last presented item), and set
                             -- app.items.absorbing_since = now() where status is active
log.on_media_purged()        -- type = 'media.purged': stamp app.revocation_acks
```
**deps.** B05, B07, B09.
**spec.** ADR-DATA §10.4(b) (**"an `AFTER INSERT` trigger on `log.event_log` stamps `app.revocation_acks`"** — the precedent this module generalises), §12.2 (`device_content` filters `i.absorbing_since is null`, so **something must write it**); SCHEDULER-SPEC §15.1 (distress is absorbing until a human re-enables), requirement 14; SYNTHESIS P18, ND-14; ADR-DATA §5.4 (`app.items.absorbing_since`, `absorbing_cleared_by`).
**blind test.** pgTAP: insert `distress.reported` naming item X → **`device.device_content` returns zero rows for X on the next sync**, and `signals` surfaces `items_set_aside`. `app.re_enable_item(X)` clears `absorbing_since`, stamps `absorbing_cleared_by`, and emits `item.re_enabled` via B11 — so the item returns **at maximum support and re-earns its way up**. A distress report naming an unknown or probe id **absorbs nothing and raises nothing** — the session-ending behaviour lives in the fold, not here (§15.1 step 3). A `media.purged` receipt stamps exactly one `revocation_acks` row and is idempotent under replay.
**risk.** safety. **wave.** W3.

#### B13 — operational projections · `0016_proj_tables.sql`, `0017_proj_projectors.sql` · ~540 lines
**purpose.** The derived operational plane, rebuildable by truncate-and-replay, reachable directly by nobody, drained by a worker under a per-subject lock, and rewindable without ever destroying the generation that was delivered.
**api.** `proj.session`, `proj.interaction`, `proj.scheduler_state`, `proj.moment`, `proj.integrity_flag`, `proj.derivation_state`; `proj.apply(event_id)`, `proj.drain(projector, n)` (`for update skip locked` **plus** `pg_advisory_xact_lock(subject)`), `proj.invalidate_from(subject, ingest_seq)`.
**deps.** B09, B10, B11.
**spec.** ADR-DATA §11.1 (**the rule and the CI check: a table is authoritative iff no derivation may write it; a cache iff truncate+replay reproduces it; two lists checked against each other**), §11.2 (the DDL — **and `proj.session.session_end_reason`'s CHECK is replaced per D-12**), §11.3 (**no snapshots; full refold, with the arithmetic**, and why the rewind depth is bounded by `hard_expiry_days`), §11.4 (**derived-plane constraints record; they never reject** — and the derivation builds into a staging generation and swaps by bumping `derivation_generation`, so a failed rebuild leaves the previous one intact), §6.7 (the queue and the per-subject advisory lock).
**blind test.** **V1:** fold a fixture set twice, hash both, assert equal. **V3, the one that matters:** ingest device A and project; then ingest device B's three-day-stale stream that sorts into the middle; assert the final projection **equals ingesting A+B together in canonical order from clean**. The cache rule as an executable check: truncate every `proj` table, replay, assert byte-identical contents. Two concurrent drains for one subject serialise on the advisory lock and produce **one** `session_ordinal_today`. A tier-1 interval-ceiling breach records a `proj.integrity_flag` and **does not abort the rebuild**. **`proj.moment` carries no `correct`, `grade`, `accuracy`, `score`, `count`, `percent`, `rate` or `trend` column** — a column-name deny-list, and `kind` deep-equals C01's `MomentKind`. `session_end_reason`'s CHECK is the 12-member union of §2.3 and **contains no `'timeout'`**.
**risk.** correctness. **wave.** W3.

#### B14 — the device views · `0018_device_views.sql` · ~180 lines
**purpose.** The device's entire read surface: **two views**, with revocations riding inside the content view and the per-participant configuration riding inside the roster view.
**api.** `device.device_roster` (**widened per D-4**), `device.device_content` (upsert `union all` purge), both `security_invoker = false`, owned by `app_view_owner`, `SELECT` granted to `device` only.
**deps.** B03, B04, B05, B07.
**spec.** ADR-DATA §12.2 (the four-row surface, the two view bodies verbatim, and the **three deliberate omissions** in the ingest `WITH CHECK`), §10.4(a) (**revocations ride inside the content view because exactly two device views are budgeted — a real constraint honoured rather than negotiated**), §7.5 (the six places consent gates, two of which are these views), §9 consequence 4 (the device echoes **banded** telemetry fields so raw ratings reach neither the tablet nor the research plane); ADR-PLATFORM §5.2, §5.3; **declared deviation D-4**.
**blind test.** Every `policies.ts` row naming either view: **zero rows** for a patient of another device, ward or home; zero rows when consent is withdrawn, dissent is active, or the patient is erased; zero rows for an item that is retired, **absorbing**, has any non-ready media, or names a `do_not_show` person. **V14:** insert `dissent_observed` and assert `device_roster` returns zero rows on the next sync. The negative shape: **no surname, no date of birth, no room number, no diagnosis, no `birth_year` and no raw caregiver rating** — asserted by column enumeration; the view exposes `era_band` and `valence_band` but never `era_decade` or the raw rating. `person_status_validated_at_ms` is present, because R09's 48-hour gate needs it.
**risk.** privacy. **wave.** W3.

#### B15 — caregiver views and action RPCs · `0019_caregiver_views.sql` · ~220 lines
**purpose.** The caregiver's only read path — moments — and the small set of RPCs through which a human, and **only** a human, may change the deck.
**api.** `app.my_moments` (definer view); RPCs `app.retire_item(uuid, text)`, `app.re_enable_item(uuid)`, `app.set_item_tier(uuid, int)`, `app.set_person_status(uuid, app.person_status)`, `app.set_month_target(uuid, text)`, `app.report_distress(uuid, uuid|null, app.adverse_severity)`, `app.disable_probe(uuid, text)`, `app.declare_co_presence(uuid)`, `app.record_consent_event(...)`, `app.nominate_rest_photo(uuid, uuid)`, `app.set_blocklists(uuid, text[], text[])`.
**deps.** B03, B05, B07, B13.
**spec.** ADR-DATA §11.6 (the caregiver's read path and **its honest cost**), §12.3, §8.6 (`session.co_present_declared` is the **only** legal producer of `administered_by`, and there is no `'inferred'` value); SYNTHESIS P3, P5, P18, ND-8, ND-22; V1-PRODUCT-SHAPE §3 (**one sentence a month, reviewed monthly, because a sentence that has stopped being true is a rehearsed false comfort**); SCHEDULER-SPEC §15.2, §6.5; **D-11**.
**blind test.** pgTAP: `app.my_moments` has **no column whose name matches accuracy, score, count, percent, rate, trend or streak** — enumerated, so adding one later fails the test — and `kind` is the six-value closed set. A caregiver without `can_view_moments` gets zero rows. `retire_item` writes `by = 'caregiver'` and **there is no code path, RPC or trigger anywhere that can write `by = 'algorithm'`**, asserted by grepping the payload vocabulary and the enum. `report_distress` accepts a **null `item_id`** — the caregiver need not know which card, which is what makes P18's one-tap control real. `disable_probe` writes an `adverse_events` row with `probe_disabled_as_result = true` (so the probe disabling is **an adverse event, not missing data**) and B11 emits the event. `declare_co_presence` is the only writer of `session.co_present_declared`. `set_month_target` enforces the one-per-deck partial unique index and records `last_reviewed_on`. Every mutation goes through an RPC — **there is no client-side write path**, asserted by intercepting requests in U09.
**risk.** safety. **wave.** W3.

#### B16 — the research manifest and the projected tables · `0020_research_study_manifest.sql`, `0021_research_tables.sql` · ~420 lines
**purpose.** The field manifest that is **the source of the research DDL rather than a checklist against it**, and the ten projected tables it generates.
**api.** `research.study`, `research.study_access`, `research.release`, `research.field_manifest`, `research.field_waiver`; the ten projected tables (`participant`, `participant_status`, `session`, `interaction`, `safety_register`, `consent_event`, `clinician_assessment`, `medication_and_comorbidity`, `derived_variable`, `coverage_gap`), every one carrying `published_in_release` and `superseded_in_release`; the four manifest assertions.
**deps.** B01, B07.
**spec.** ADR-DATA §8.1 (**what is structurally absent — this is the design**), §8.2 (the manifest and its four CI assertions, including that **`source_kind = 'literal'` does not exist**), §8.3 (releases), §11.5 (the table-by-table consent-gate map — and that `participant_status`, `safety_register`, `consent_event` and `coverage_gap` are **not** consent-gated).
**blind test.** **V21, three ways: forward** — every column in `research` has a live manifest row; **reverse** — every field named in SYNTHESIS §7 maps to a manifest row **or** to a `field_waiver` row carrying a reason and an approver (**this is where §2.7's waiver set is enforced, and the check runs at contract-freeze time, not at release time**); **populated** — every manifest column appears in the projector's insert list. The structural assertions: **no column in `research` or `analysis` has type `uuid`, `date`, `timestamp`, `timestamptz` or `interval`**; no column name matches the identifier-shaped regex; **no foreign key leaves the `research` schema** (which is what makes escalation to a second Postgres instance a configuration change rather than a redesign). **V12:** attempt UUIDv7 timestamp extraction on every id-shaped column and fail if any decodes to a plausible date.
**risk.** privacy. **wave.** W3.

#### B17 — the research projector and severance · `0022_research_projector.sql` · ~340 lines
**purpose.** The one-way bridge: keyed pseudonymisation, projection, the k-anonymity gate, the release builder and severance. `bridge` has `SELECT` and **only** `SELECT` on `app`, `log` and `proj` — the one-way direction is a grant, not a discipline.
**api.** `link.pseudo_id(uuid, uuid)` (`hmac(id, study_pepper)`, 64 hex), `link_project(subject uuid, through_ingest_seq bigint)`, `link.assert_k_anonymity(study, release_no)`, `link.sever(participant_code, app.withdrawal_scope)`, `link.build_release(study)`.
**deps.** B07, B13, B16.
**spec.** ADR-DATA §8.3 (immutable numbered releases and the four properties), §8.4 (**k-anonymity as a release gate with the fixed suppression order, and deck composition treated as a quasi-identifier with a linkage test that runs before every release**), §8.5 (device fingerprints collapsed to one band), §8.7 (**the plane declares its own holes; temporary exclusions do not advance the watermark**), §8.8 (the speech block gated **at the projector**), §9 (**the projector joins nothing mutable**), §10.5 (`link.sever` verbatim and its three interlocks), §11.5, §7.7.
**blind test.** **V11, the negative test worth more than the structural ones:** write `ZZSENTINELZZ` and `1931-04-07` into every free-text column in `app` **and every string field of every event payload** — the one the sentinel tests miss, because a jsonb payload is not a free-text column — run the projector, grep the whole `research` schema and every `analysis` view. **Zero hits.** **V16:** a trial recorded with `person_status = 'living'`, the person then flipped to `deceased`, re-derived — the projected value is **still `living`** and S4 reports zero incidents. **V19:** a cohort with a k=2 cell refuses to publish, then publishes with the suppression recorded. **V15:** an adverse event at T and a withdrawal at T+5 minutes — the AE **and the session denominator** appear in the next release while the behavioural rows do not. A participant without `research_speech_features` has every prosodic column **`NULL`, not hidden**. The deck-composition linkage test reaches k ≥ 5. `link.sever` retains `participant_code`, `study_id`, `severed_at` and `severance_scope` while nulling `subject_id`, `enrolled_on`, `tz_offset_minutes` and the allocation subkey.
**risk.** privacy. **wave.** W3.

#### B18 — the analysis views · `0023_analysis_views.sql` · ~340 lines
**purpose.** The eleven release-scoped, study-scoped definer views that are **the only schema a researcher can name**, with every column enumerated by hand.
**api.** `analysis.release_no()`; `analysis.interaction`, `.session`, `.participant`, `.participant_status`, `.probe_trial`, `.safety_register`, `.consent_event`, `.clinician_assessment`, `.medication_and_comorbidity`, `.derived_variable`, `.coverage_gap`, `.release` — all owned by `bridge`, `security_invoker = false`, `SELECT` granted to `researcher` only.
**deps.** B16, B17.
**spec.** ADR-DATA §8.9 (the three-layer reach, the `analysis.interaction` definition with **every column spelled out**, and the ban on `select i.*` — **that one shortcut is what handed a caregiver-who-is-also-a-researcher the pseudonym of her own father in two browser tabs**), §8.3 (the `published_in_release <= pinned` predicate), and the requirement that **every relation in `analysis` has `relkind = 'v'`**; §7.7 (the safety register is not consent-gated).
**blind test.** Every `policies.ts` row naming `researcher`: **`42501`** on schemas `app`, `identity`, `log`, `proj`, `research` **and `ops`**; **zero rows** for another study, expired access, a release after the pin, or a superseded generation. **`analysis.safety_register` returns rows for a participant who withdrew research consent — the one place the gate must not apply.** Column-set equality against the live manifest, so a `select *` shortcut cannot compile past CI. **A materialised view in `analysis` fails the `relkind` assertion** — which closes the "someone materialises the slow view six months in and the consent gate silently freezes" hole. **No `alter default privileges` exists in `research` or `analysis`**, so a new object fails closed. **V13:** poll `analysis.*` hourly for a simulated week and assert no participant's row set changes outside a release boundary.
**risk.** privacy. **wave.** W3.

#### B19 — the trial-operations console · `0024_ops_console.sql` · ~450 lines
**purpose.** The compliance-audit instrument for the Tier-1 and Tier-2 criteria — **the surface that lets the pilot be stopped early if it is harming people.** Identified, live, operational, and deliberately **not** a research surface.
**api.** `ops.config`; and the views, **all fourteen criteria plus the alarms**: `ops.s1_distress_rate`, `s2_catastrophic`, `s3_ended_on_success`, `s4_deceased_surfacing`, `s5_carer_anxiety`, `s6_exposure`, `s7_acute_followup`, `f1_segment_adherence`, `f2_zero_delivery`, `f3_onboarding_time`, `f4_attrition_curves`, `f5_probe_days`, `f6_authoring_time`, `f7_recruitment`, `quarantine_counts`, `erasure_status`, `concurrent_device_overlap`, `integrity_flags`. `SELECT` granted to `trial_ops` only.
**deps.** B03, B06, B13.
**spec.** ADR-DATA §12.4, §15 row 24; V1-PRODUCT-SHAPE §8.2 surface B (**ships thin; the compliance audit instrument for six of seven Tier-1 safety criteria; no per-participant cognitive rendering; labelled per P24**); SYNTHESIS §8 (every criterion and its exact measurement).
**blind test.** Each view checked against a seeded cohort with **hand-computed** expected values. **S3 is computed from `session.ended_on_success` telemetry and never from intent**, and audio-unhealthy sessions are excluded from its numerator (§9.6). **S4 joins the frozen stimulus descriptor and not the current content row** (V16). **F4 emits non-usage attrition and dropout attrition as two separate curves and refuses to emit a single completion percentage.** F3 reads instrumented onboarding timings; **its absence is a build failure even though its value is a pilot finding.** S5 reads `clinician_assessments` where `subject_role = 'caregiver'`. The negative assertion is the important one: **no `ops` view contains a per-participant cognitive metric, trajectory or drift value** — column names enumerated — and **`researcher` has no `USAGE` on `ops` at all**.
**risk.** safety. **wave.** W3.

#### B20 — the erasure orchestrator · `0025_erasure_orchestrator.sql` · ~340 lines
**purpose.** The nine ordered idempotent stages that make "we deleted it" a falsifiable claim with a stated maximum time-to-completion.
**api.** `ops.request_erasure(patient, case_ref, scope, research_scope)` (**granted to `carehome_admin`** — an identified human at the site, which is who actually receives the request), `ops.advance_erasure(erasure)` (one stage per invocation), `ops.erasure_is_complete(erasure)`, `ops.replay_erasure_ledger()`, `ops.execute_chain_break(subject, case_ref)`.
**deps.** B06, B07, B09, B17.
**spec.** ADR-DATA §10.3 (**the nine-stage table and why each is in that order** — capture the holding-device set **including `unassigned_at` rows** before any cascade; storage before rows; **severance at stage 4 before the content delete at stage 5, because `subject_map.patient_id` is `ON DELETE RESTRICT`**), §10.4 (the four purge mechanisms and **the honest bound**), §10.5, §10.6, §10.7.
**blind test.** **V17:** enrol two devices, seed one photograph on both, request erasure, sync one — assert the file is gone from **that filesystem** and the request is stuck at `awaiting_devices` with one outstanding; sync the second — assert `complete`. **Every stage invoked twice must be idempotent.** Stage 5 attempted before stage 4 **raises**, because of the `ON DELETE RESTRICT` interlock. An unreachable device passes its hard expiry and the request completes with `devices_unconfirmed` **naming it**, so the ledger carries a number rather than an assumption. **V18:** restore to a point before an erasure, run `replay_erasure_ledger()`, assert the photograph is gone again. **There is no fast path that skips the device leg, for any scope.** `guaranteed_purged_by` equals `max(last_sync_at + hard_expiry_days)` over the stage-1 holding set.
**risk.** privacy. **wave.** W3.

#### B21 — RLS enable and force · `0026_rls_enable.sql` · ~70 lines
**purpose.** Enable **and force** row-level security on every table in the five protected schemas, **before any grant exists**, so no window occurs in which a table is reachable and unprotected.
**api.** `alter table … enable row level security; alter table … force row level security;` for every relation in `app`, `log`, `proj`, `identity`, `research`.
**deps.** B02–B09, B13, B16.
**spec.** ADR-DATA §12.1 (**`force` matters because migrations run as owner and an unforced table lets the owner bypass**), §15 (RLS precedes grants).
**blind test.** pgTAP asserts `relrowsecurity AND relforcerowsecurity` for **every** relation in those five schemas, **so a new table cannot ship unprotected**. Migration ordering is asserted in CI: 0026 precedes 0029.
**risk.** privacy. **wave.** W4.

#### B22 — the policies · `0027_rls_policies.sql` · ~360 lines
**purpose.** Every policy in the design, each naming its role explicitly, with the device's four-row surface and the study-integrity field freeze.
**api.** the device insert policies on `ingest.*`; the caregiver select/update/insert policies with the `ui_version_pinned` / `dementia_subtype` / `tz_offset_minutes` / `enrolled_on` freeze; `consent_no_update` and `consent_no_delete`; `items_no_delete`; the `carehome_admin` policies; and the five `security definer` predicate helpers (`app.device_patient_ids`, `app.device_ever_served`, `app.caregiver_patient_ids`, `app.caregiver_edits`, `app.admin_care_home_ids`), every call site wrapped as `(select app.fn())` so the planner hoists it into a once-per-query InitPlan.
**deps.** B21, C12.
**spec.** ADR-DATA §12.1–§12.5 in full.
**blind test.** **Every row of `policies.ts`, positive and negative.** The three deliberate omissions in the device `WITH CHECK` are each their own test: **no consent predicate** (§7.5 — a withdrawn patient's tablet must still be able to deposit the evidence of the dissent); **no `revoked_at is null` predicate** (revocation is precisely when a device is holding evidence somebody wants); and **`device_ever_served`, not currently-assigned** (a shared tablet reassigned on Friday still holds three days of telemetry, including adverse events, and F2's zero-delivery number is lost for exactly the disrupted deployments most likely to produce it). Structural: **`pg_policy.polroles <> '{0}'` everywhere**, so no policy silently applies to `PUBLIC`. A caregiver update that changes `ui_version_pinned`, `dementia_subtype`, `enrolled_on` or `tz_offset_minutes` is refused — **and the freeze applies with more force to `carehome_admin`, the role with more power, not less**.
**risk.** privacy. **wave.** W4.

#### B23 — storage policies and the grant map · `0028_storage_policies.sql`, `0029_grants.sql` · ~190 lines
**purpose.** The single storage policy and every grant in the design in one readable diff. **This file is the security review.**
**api.** the `patient-media` bucket and its one caregiver policy; every `GRANT` and every `REVOKE`, ordered by schema.
**deps.** B22.
**spec.** ADR-DATA §12.5, §12.6, §3 (the three `information_schema` assertions), §15 rows 28–29; ADR-PLATFORM §6.3 (**this is the suite the pilot is gated on**).
**blind test.** **Assertion 1:** `select table_schema, table_name, privilege_type from information_schema.role_table_grants where grantee = 'device'` returns **exactly four rows** — `device.device_content SELECT`, `device.device_roster SELECT`, `ingest.event INSERT`, `ingest.session INSERT`. **Assertion 2:** `select distinct table_schema … where grantee = 'researcher'` returns **exactly one schema, `analysis`**, with no exception for `ops`. **Assertion 3:** zero rows for `USAGE` on `identity`, `research`, `log` or `proj` by any login role. **The device has no grant on `storage.objects` at all.** **No `alter default privileges … grant` exists in any schema**, so a new object fails closed.
**risk.** privacy. **wave.** W4.

#### B24 — the registry seed · `0030_seed_registry.sql` · ~160 lines
**purpose.** Seed the twenty event types with their JSON Schemas, the payload vocabulary, `ops.config` and the initial study row.
**api.** 20 rows in `log.event_type` with `payload_schema` **emitted from C08**; `log.payload_vocabulary`; `ops.config` (including `pitr_days`); `research.study`; `app.generic_library` seeded from the bundled manifest.
**deps.** B08, B16, B23, C08, C09, G02.
**spec.** ADR-DATA §6.6 (the 20 types), §6.5 layer 2 (**the JSON Schema is emitted from the same zod definitions the device and the blind test-writer import**), §15 row 30.
**blind test.** **A generated-artefact check: every `payload_schema` in the registry is byte-identical to the JSON Schema `C08.toJsonSchema` emits for that type — drift between the device's validator and the server's is a failing test rather than a silent quarantine storm.** Exactly 14 rows carry `is_scheduler = true` and they map 1:1 onto SCHEDULER-SPEC §5. `app.generic_library` agrees row-for-row with `assets/library/manifest.json` (G02's check, from the other side).
**risk.** correctness. **wave.** W4.

#### B25 — the fixture seed · `supabase/seed.sql` · ~340 lines
**purpose.** The named scenarios every test suite reads, with deterministic uuids documented at the top of the file.
**api.** three families; two devices and one shared tablet; one participant with a **three-day backlog across three boots**; one withdrawn participant; one erased participant; and **one participant whose adverse event precedes their withdrawal by five minutes**.
**deps.** B24.
**spec.** ADR-DATA §15 (the seed paragraph); ADR-PLATFORM §9.
**blind test.** Applying the seed twice is **idempotent**. Every scenario named in §15 is reachable by a documented constant, and `C18.fixtureIds` resolves each. **V5, V14, V15 and V17 all draw their subjects from here**, so each must exist with the exact shape those tests assume. `signInAsFixtureDevice('device-a')` succeeds and yields a token whose `device_id` matches.
**risk.** correctness. **wave.** W4.

#### B26 — the device-scoped client and caller guard · `functions/_shared/guard.ts` · ~90 lines
**purpose.** Construct the Postgres client for the ingest path **from the device's own Authorization header, never from the service-role key**, and verify a human caller's own JWT and membership before any function touches `service_role`.
**api.** `deviceClient(req): SupabaseClient`, `requireDeviceClaims(req): { deviceId; careHomeId }`, `requireCaller(req, roles): Promise<{ userId; careHomeIds }>`, `jsonError(status, code): Response`.
**deps.** A07, C09.
**spec.** ADR-DATA §6.8 (**"`/sync` must call Postgres as the device"** — and the consequence if it does not: *every grant, policy and column restriction in this document becomes decorative*), §12.6 (the Edge Functions that hold `service_role` verify the caller first); ADR-PLATFORM §5.2; §13's final INVARIANT row.
**blind test.** **A CI check on the function source asserts `SERVICE_ROLE_KEY` is not referenced anywhere in the `/sync` call path** (also enforced by G01). A request with no token, a token with the wrong role, or a token for a different care home yields 401/403 **and no privileged query is issued** — asserted by a spy on the service client that must record zero calls. An insert naming a foreign `device_id` returns `42501` rather than silently succeeding.
**risk.** privacy. **wave.** W5.

#### B27 — the payload validator · `functions/_shared/payload-validate.ts` · ~70 lines
**purpose.** Validate every incoming payload against the registry schema at ingest, **routing failures to quarantine rather than aborting a batch**.
**api.** `validatePayload(type, version, payload, registry): { ok:true } | { ok:false; reason:'schema_invalid'|'unknown_type'; retryable:boolean }`.
**deps.** C08, C09.
**spec.** ADR-DATA §6.5 layer 2, §6.8.
**blind test.** An unknown type is `retryable: true`; a schema-invalid payload is `retryable: false`. **V10's 5,000-name corpus is rejected at this layer for every type and every string field.** The validator **never throws**.
**risk.** privacy. **wave.** W5.

#### B28 — enrol-device · `functions/enrol-device/index.ts` · ~130 lines
**purpose.** An authenticated human creates a tablet: device rows, a real auth user with unforgeable `app_metadata`, and an eight-character code returned **once** to the caregiver's screen.
**api.** `POST /functions/v1/enrol-device { care_home_id, patient_ids[], mode, label, hard_expiry_days? } -> { device_id, code, expires_at_ms }`.
**deps.** B04, B26, C09.
**spec.** ADR-PLATFORM §5.2 "Enrolment" (the four numbered steps; `app_metadata = { role, device_id, care_home_id, mode }` writable only by `service_role`, **the property the whole scheme rests on**; a 40-bit code from a 32-symbol alphabet stored only as `sha256`, TTL 10 minutes; **return the code, never the secret**).
**blind test.** A caller who is not a member of `care_home_id` is refused **before anything is written** — assert zero device rows afterwards. The created auth user's `app_metadata` carries the four claims, and **V22** proves it cannot be modified from any client role. **The response body contains no `device_secret`**, asserted by field enumeration. Two enrolments produce different codes, and the code itself appears **nowhere** in the database — only its `sha256`.
**risk.** privacy. **wave.** W5.

#### B29 — redeem-enrolment · `functions/redeem-enrolment/index.ts` · ~100 lines
**purpose.** The tablet exchanges a code for its durable credential **exactly once, under concurrency, and never again for any reason**.
**api.** `POST /functions/v1/redeem-enrolment { code } -> { device_id, email, device_secret }`; errors `410 already_redeemed | 410 expired | 403 revoked | 429 attempts_exhausted`.
**deps.** B04, C09.
**spec.** ADR-PLATFORM §5.2 "Redemption" (**the atomic `update … where redeemed_at is null and expires_at > now() returning device_id` is what makes it genuinely single-use under concurrency**; rejects if `devices.revoked_at` is not null; increments `attempts`; five failures burn the code).
**blind test.** Two concurrent redemptions of one valid code, issued inside overlapping transactions: **exactly one 200 and one 410**. A second redemption after success is 410 and returns no secret. An expired code is 410; a revoked device is 403; five wrong attempts burn the code so the sixth attempt **with the correct code** still fails. The returned secret is 32 bytes of entropy and matches the auth user's password, provable by immediately calling `signInAsDevice` with it.
**risk.** privacy. **wave.** W5.

#### B30 — the sync function · `functions/sync/index.ts` · ~280 lines
**purpose.** One round trip: deposit the outbox **as the device itself**, return per-id ACKs and boot anchors, pull the deltas and revocations.
**api.** `POST /functions/v1/sync (zSyncPushRequest) -> zSyncPullResponse`, with `Authorization` = the device's own access token.
**deps.** B10, B14, B26, B27, B31, C09.
**spec.** ADR-PLATFORM §4.4; ADR-DATA §6.8 (the ACK contract in full; `Prefer: return=minimal`; **the function must not hold `service_role`**).
**blind test.** Every response validated against `zSyncPullResponse`. **V7:** a batch containing one schema-invalid row returns **HTTP 200** with 399 in `accepted` and 1 in `quarantined`. **V8:** an unknown type returns `retryable: true` and is absent from `accepted`. The response **always carries `accepted`, even when empty**. `boot_anchors` are returned for every boot the device pushed, so the device can re-fold (§6.4). A request without `Prefer: return=minimal` fails with a permission error rather than silently succeeding. **The CI source check asserts the client is constructed from the incoming `Authorization` header and that `SERVICE_ROLE_KEY` does not appear in the file.**
**risk.** privacy. **wave.** W9.

#### B31 — the server fold · `functions/_shared/server-fold.ts` · ~90 lines
**purpose.** Recompute scheduler state **canonically** on the server by importing the same domain module the tablet runs, so the two agree by construction rather than by hope.
**api.** `toSchedulerEvents(rows: readonly LogRow[]): readonly SchedulerEvent[]` (ordered by `ordering_key`), `refoldSubject(events, config): SchedulerState`, `persistSchedulerState(sql, subjectId, state, throughIngestSeq): Promise<void>`.
**deps.** S25, T03, B13, C08.
**spec.** ADR-PLATFORM §4.4 (**the server recomputes canonically by importing the same `src/domain/scheduler` module in a Deno Edge Function**); ADR-DATA §6.4 (the determinism statement at exactly its true strength), §11.2 (`proj.scheduler_state` is a **cache, never authoritative, granted to no role**); **declared deviation D-2** (this fold is the authoritative one).
**blind test.** **V9, and it is the only test that proves the two-runtime claim:** run `fold` on the Hermes fixture and in Deno over the same canonical array and **deep-equal** the results. Because the scheduler is integer-only with no `Math.exp` or `Math.pow`, byte-identity is a **structural** property and a failure means someone introduced floating point. **V1:** fold a fixture set twice and hash both. `toSchedulerEvents` orders strictly by `ordering_key` and drops the six non-scheduler types, asserted against `EVENT_SCHEMA`. **A CI grep asserts no second implementation of the scheduler exists anywhere.**
**risk.** correctness. **wave.** W9.

#### B32 — export-patient · `functions/export-patient/index.ts` · ~230 lines
**purpose.** Build the subject-access bundle **redacted by requester, not by patient** — because in a population where 34% of family carers report important levels of abusive behaviour, **the hostile requester is the modal case**.
**api.** `POST /functions/v1/export-patient { patient_id, redaction_profile:'subject_full'|'caregiver_redacted' } -> { export_id, download_url, expires_at }`. Bundle: `patient.json`, `items.json`, `media/<sha256>.<ext>`, `consent_log.json`, `depicted_persons.json`, `sessions.json`, `events.ndjson`.
**deps.** B05, B06, B26, C09.
**spec.** ADR-DATA §10.8 (the full two-column redaction table, and both further rules: **ids are re-mapped per export**, and **every export request is logged where the requesting caregiver cannot read it**), §10.1 (export is the identifiable plane and never touches `research`).
**blind test.** Two exports of the same patient under the two profiles, diffed row by row against §10.8's table: `caregiver_redacted` contains **no other caregiver's link, no observer identity on a dissent or adverse-event record, no narrative, no `person_status` attribution and no `do_not_show` author**. **No id value in a bundle also appears in any research release** — asserted by intersecting the two id sets and requiring it empty. The requesting caregiver cannot read `app.export_requests` (a `policies.ts` row). The redacted profile contains no research row at all.
**risk.** privacy. **wave.** W5.

#### B33 — delete-patient · `functions/delete-patient/index.ts` · ~120 lines
**purpose.** The authorised entry point to erasure, and the invocation that advances one stage at a time.
**api.** `POST /functions/v1/delete-patient { patient_id, case_ref, scope, research_scope } -> { erasure_id, stage, guaranteed_purged_by }`; `POST …/advance { erasure_id } -> { stage, devices_confirmed, devices_unconfirmed }`.
**deps.** B20, B26.
**spec.** ADR-DATA §10.3, §10.4(d) (**`guaranteed_purged_by` and the stated maximum time-to-completion of `hard_expiry_days`**); ADR-PLATFORM §10 (in-app account deletion is required because the caregiver app creates accounts).
**blind test.** A caller who is not a care-home admin for that patient gets `42501` **and creates no request row**. `guaranteed_purged_by` equals `max(last_sync_at + hard_expiry_days)` over the holding-device set captured at stage 1 **including `unassigned_at` rows** — the test that catches a job losing its own work list. Repeated `advance` calls at the same stage are no-ops. **The response never contains a `participant_code`.** The wording surfaced to the caregiver is "within 7 days", **never "immediately"**.
**risk.** privacy. **wave.** W5.

#### B34 — publish-release · `functions/publish-release/index.ts` · ~120 lines
**purpose.** Build and publish an immutable numbered research release on a fixed cadence at a fixed hour.
**api.** `POST /functions/v1/publish-release { study_id } -> { release_no, k_min, row_counts, suppressions }`.
**deps.** B17, B18.
**spec.** ADR-DATA §8.3, §8.4.
**blind test.** **V19:** k < 5 refuses to publish, then publishes with the suppressions recorded. **V13:** rows appear only at release boundaries. A participant enters only after `min_participant_days` (default 28) and **their whole history to the cutoff appears at once**. **A published release is never rewritten** — a correction is a new generation superseding at a **future** release number, so a citation stays resolvable forever.
**risk.** privacy. **wave.** W5.

#### B35 — the P25 notifier · `functions/p25-notify/index.ts` · ~100 lines
**purpose.** Deliver the acute-change message to the one named caregiver recipient in physical-illness wording, and record the delivery as an event. **The unowned requirement two of the three proposals dropped.**
**api.** `POST /functions/v1/p25-notify { subject_id } -> { sent: boolean; limb: string | null }`.
**deps.** S25, P03, B06, B09.
**spec.** SYNTHESIS P25, §8 S7; V1-PRODUCT-SHAPE §8.2 surface D (**ships; B1 is on the critical path**); SCHEDULER-SPEC §17.1, §17.2 (`acute_change_suspected` is one of exactly three signals), §6.5 (`AcuteSignalDelivered` is the **only** event that advances `acuteLastFiredAtMs`).
**blind test.** Reads `signals(state, now)` for `kind === 'acute_change_suspected'`; resolves the single caregiver holding `can_receive_p25_alert`; inserts `app.acute_change_notifications` (which B06's trigger validates); and **writes `acute.signal_delivered` via `log.write_server_event`, which is what advances the rate limit**. The body passes P03's word-boundary assertion. **The recipient is always a caregiver and never the patient and never a clinician.** With `acuteSignalEnabled: false`, nothing is ever sent. A second fire inside `acuteRateLimitMs` is suppressed.
**risk.** safety. **wave.** W9.

#### B36 — the codebook generator · `scripts/codebook.ts` · ~170 lines
**purpose.** The data dictionary and release notes, **generated from the field manifest so the codebook cannot drift from the plane it describes.**
**api.** `generateCodebook(sql, studyId, releaseNo): Promise<{ markdown:string; csv:string }>`; `CodebookRow { table; column; type; sourceKind; preregisteredAnalysis; protocolSection; approvedBy; approvedOn; suppressionApplied }`.
**deps.** B16, B17.
**spec.** V1-PRODUCT-SHAPE §8.2 surface A (**not a UI — a versioned, scheduled export job plus a data dictionary and codebook**); ADR-DATA §8.2 (the manifest is the source of the DDL and every column carries a named pre-registered analysis), §8.4 (the applied suppressions are recorded per release so the codebook is accurate).
**blind test.** The generated row set equals `research.field_manifest` joined to the release's recorded suppressions — asserted **in both directions**, so a column present in the plane but absent from the codebook, or vice versa, is a failing test. **Every row's `preregisteredAnalysis` is non-empty — GDPR purpose limitation as a build gate.** The release notes state the release number, the cutoff day offset, the derivation, scheduler and content-set versions, and the achieved k, **all read from `research.release` and never typed by a human**.
**risk.** privacy. **wave.** W5.

---

### LAYER U — THE THREE SURFACES · `src/ui/`, `app/`

Fourteen modules for roughly twenty screens plus the token file. Presentational code is deliberately coarse: a defect is visible on first render and is caught by the conformance suite. **The one exception is U02**, which is constants carrying 48 numeric assertions and is therefore its own module with no logic in it.

#### U01 — design tokens · `src/ui/tokens.ts`, `src/ui/tokens.css`, `scripts/contrast.ts` · ~280 lines
**purpose.** Every colour, size, dimension and duration in the product, declared once, with a script that recomputes each stated contrast ratio and **fails the build if a comment disagrees with its own arithmetic**.
**api.** `MM_PER_PT: 0.1924`, `PT_PER_MM: 5.198`, `mm(pt)`; `patientColor` (exactly five values), `patientType` (three enrolment steps), `patientTypeInvariants`, `patientLayout`, `patientTargets`, `patientMotion`, `patientSound`, `patientTiming`; `caregiverColor`, `caregiverType`, `caregiverLayout`; `researcherColor`, `researcherType`, `researcherLayout`. **`patientTiming`, `patientMotion` and `patientSound` re-export C14 so there is exactly one definition (D-6).** `scripts/contrast.ts` exports `ratio(hexA, hexB)` and `checkComments()`.
**deps.** C01, C14.
**spec.** DESIGN-SYSTEM §4.1 (**the literal contents, transcribed exactly**), §4.2 (computed contrast, stated not asserted), §4.3 (**the deleted `waiting` token and why** — a direction whose thesis is "colour never encodes meaning" cannot have a colour whose only job is to encode "unfilled"), §5.3 (every geometric number, computed); ADR-PLATFORM §7 (**no NativeWind, no Tailwind**; one tokens module plus the same values as CSS custom properties).
**blind test.** `scripts/contrast.ts` recomputes every ratio in the §4.1 comments from the exact hex values with the WCAG 2.x relative-luminance formula and fails on any disagreement — **the comments are executable**. **A13:** exactly five distinct patient colour values, no sixth. **A14:** no token has a blue channel exceeding its red channel — a crude but exact machine check that no blue/green/violet encoding has crept in, given lens yellowing. **A15:** `#FFFFFF` appears nowhere. **A12:** `bone` vs `ground` separation is 72.0 relative-luminance points. Every rect in `patientLayout` matches §5.3's table exactly via `mm()`. `tokens.css` is generated from `tokens.ts` and a drift check asserts every exported scalar appears as a custom property with the same value.
**risk.** presentational. **wave.** W3.

#### U02 — the patient frame · `src/ui/patient/frame.tsx` · ~420 lines
**purpose.** **The frame that never moves:** two zones and one panel, in identical pixels on every screen for the whole study, with exactly four things that can be touched. Constants and geometry; no behaviour.
**api.** `Ground({children})`, `OnePicture({photoSha, matFill, onTouchDown})`, `TwoPictures({leftSha, rightSha, demonstrating, onChoose})`, `CaptionStrip({line1, line2, typeStep})`, `StopPanel({visible, pressed, onStop})`, `Crossfade({children, keyId, durationMs})`.
**deps.** C11, U01.
**spec.** DESIGN-SYSTEM §5.1 (the frame diagram), §5.2 (the two-picture state — **the only moment in the product where the picture zone changes shape, and it is a cut: a 600 ms cross-dissolve with zero translation**), §5.3 (every number, computed), §5.4 (the caption strip fits at the largest step with a hard two-line cap), §8.1 (global invariants), §8.10 (the stop panel and its **three redundant disclosure channels, never colour**), §6.4, §6.5 (**the opacity of text is never animated**), §12.1–§12.5.
**blind test.** The Playwright geometry suite at a **1180 × 820** viewport, where `getBoundingClientRect()` returns the pt figures directly. **A1:** at most four pressable nodes, always a subset of `PATIENT_CONTROLS`. **A2:** every rect matches **exactly, tolerance 0 px**, in every state it appears in. **A3:** `patient.ground` is never pressable in any state. **A4:** exactly one of the one-picture and two-picture states is mounted at any time. **A5:** `card.right.x − (card.left.x + width) === 100`; `stop.y − (picture.y + height) === 70`; `stop.y − (card.left.y + height) === 120`. **A6:** card centres at x 310 and 870, both in [295, 885]; both centres y 280, in [205, 615]. **A7:** the stop-panel centre is (980, 725) and the test asserts **the declared departure** (`stop.width * MM_PER_PT >= 23`) rather than the central-50% rule. **A8–A11:** the lowest text contrast anywhere in the patient tree is 12.44 : 1. **A16:** `caption` never appears on `bone`. **A17–A19:** font size in the allowed set per step, one family, one weight, `lineHeight/fontSize === 1.5`, `textAlign: left`, and `center`/`justify` appear nowhere. **A20:** every caption text node's `rect.x === 80`, in every state at every step. **A21–A22:** two-line cap, block bottom ≤ 776 at `lg`, `scrollWidth === 1180` at every step. **A23:** every string is a live text node, never inside an image or canvas. **A24:** zero `<svg>`, zero `<canvas>`, zero icon-font glyph, zero `mask-image`. **A26:** no `transform` containing translate, scale, rotate, matrix, skew or perspective, **at any animation frame**. **A27:** every duration in `ALLOWED_DURATIONS_MS`, with `ackIn <= 100` asserted separately. **A28:** no `overflow: scroll|auto`. **A29:** no dialog, no `aria-modal`, no portal, no overlay host. **A30:** no countdown, progress, spinner or timer node. **A31:** the demonstration's animated area is 117 248 pt² = **12.12%** of the viewport. **A32:** no photograph node's `opacity`, `filter`, `width` or `height` ever changes after mount — **only bone surfaces change luminance**. **A48:** a single diff of the four constant rects across every state in the walk is **empty**.
**risk.** presentational (with 48 numeric assertions). **wave.** W4.

#### U03 — patient input handling · `src/ui/patient/input.ts` · ~110 lines
**purpose.** The pointer state machine: touch-down commits, first pointer wins, the 400 ms lockout that still acknowledges, the held-pointer state, and the large-contact policy.
**api.** `useTouchAck(): { touched; onPointerDown; onPointerUp }`, `useDemonstration(active): { leftLit; rightLit }`, `normaliseTap(e, bounds): { xNorm; yNorm; offsetPx }`.
**deps.** C14, U01.
**spec.** DESIGN-SYSTEM §6.6 in full (**touch-DOWN commits** — touch-up need not land inside, because essential tremor is kinetic and degrades exactly the accurate terminal movement a touch-up requirement tests; first pointer wins; micro-movement ignored, no drag threshold; the 400 ms lockout still receives the acknowledgement **so the hand is never told it did nothing**; the held-pointer state; **large contacts accepted at their centroid, because a rejected palm is a broken screen as far as she is concerned**), §6.4 (the 100/200/200 acknowledgement and the B5 demonstration loop), §10 (`tap_x`, `tap_y` normalised to the target bounding box, and `off_target_tap_offset_px`).
**blind test.** **A27** (durations in the allowed set; acknowledgement within 100 ms). **A45:** a pointer held for 10 s keeps the acknowledgement for the full 10 s. **A46:** a second pointer-down within 400 ms changes no state **but still receives the acknowledgement**. **A47:** two simultaneous pointer-downs commit exactly one choice. **A31:** the demonstration is `bone → boneTouched` on the mat border only, non-figurative, stationary, and identical to the acknowledgement the person's own touch produces. `normaliseTap` output is in [0,1]² relative to the target bounds and yields the HCI-Open-Question-1 dataset.
**risk.** presentational. **wave.** W4.

#### U04 — patient segment rendering · `src/ui/patient/screens.tsx` · ~460 lines
**purpose.** What the unchanging frame contains at each moment of the programme — one render description per segment kind, all rendering the same two zones with different content.
**api.** `renderFrame(frame: Frame, ctx: { typeStep; mediaUri(sha):string }): { photoShas; matFill; line1; line2; pictureState; stopPanelVisible; demonstrating }` — covering ident, saying, song, answer-first, rungs 0/1/2/3, month target, probe intro, probe item, probe reveal, interview, sign-off, closedown, content-expired, handover first page.
**deps.** C11, C13, R03, R04, U01, U02.
**spec.** DESIGN-SYSTEM §8.3–§8.8 (every screen frame by frame with its timings), §8.11 (**closedown: the mat comes off — its fill is `ground`, not `bone`, and that is the visual sign the programme has finished; the photograph does not dim; the stop panel is gone; the caption is empty and stays empty; nothing is asked, ever again; and a bundled fallback still-life ships so the terminal state is never undefined**), §8.12 (content expired — a still life with no people, and **the word "reconnect" never reaches the patient**); §7.3 (the vocabulary these screens may render).
**blind test.** Per segment kind, snapshot the returned description and assert it against the frame-by-frame prose. Rung 1 renders `Marg — — — —` in `caption` at the name's own size and weight, **never in a fifth colour**. **Rung 3 and M-02 produce an identical description**, proving they are the same screen — which is why the ladder can never bottom out into failure. Closedown has `matFill: 'ground'`, no stop panel, an empty caption, and **geometry byte-identical to the preceding frame**, so the photograph does not move or resize. **A36:** zero `?` characters in any rung-3, M-02, closedown or sign-off description. **A42** is proved jointly with R04 by hashing the description sequence for both possible rung-2 touches. **A23:** every string is a live text node.
**risk.** presentational. **wave.** W5.

#### U05 — the patient session shell · `app/(patient)/session.tsx` · ~340 lines
**purpose.** The one screen that is the whole product: it wires the ports, drives the machine's clock, commits every event **in the same transaction that advances the frame**, and **issues zero network calls**.
**api.** `export default function SessionScreen(): JSX.Element`; `makeSessionHost(deps:{ db; outbox; media; clock; monoClock; audio; vad; battery; scheduler }): { start(patientId): Promise<void>; dispose(): void }`.
**deps.** C10, R01, R04, S25, T01, T04, T05, T06, T08, Y01, U02, U03, U04, A01–A13.
**spec.** ADR-PLATFORM §4.2 (**the patient session issues zero network calls, online or offline**), §4.3 property 1 (write-before-render in one SQLite transaction); DESIGN-SYSTEM §9.1 (the zero-input table as an executable state-machine specification), §9.6, §11.5; ADR-DATA §9 (**the stimulus descriptor is written at stimulus paint by the only party that knows what was rendered**); **declared deviation D-2** (the device folds `sched_journal ∪ outbox`).
**blind test.** **A38** end to end: the Playwright zero-input walk against the web build with a seeded in-memory `Db` completes in 593.5 s of virtual time with no input and terminates in closedown. **The network assertion:** intercept every request during a full session and assert **the count is zero**. **Write-before-render:** abort the transaction at each of a sampled set of frame changes and assert that neither the event nor the frame advance survives — **no state change can exist without its event, and none without the other**. **A1:** never more than four pressable nodes. A battery drop injected at every segment brings the session to the sign-off and then closedown, **never to an OS modal mid-demand**. The scheduler is called through the S25 barrel only, with `nowMonoMs` drawn from the same boot as `activeSession.bootId` (`policies.ts` caller obligation).
**risk.** safety. **wave.** W9.

#### U06 — enrolment, content-expired and closedown screens · `app/(patient)/enrol.tsx`, `src/ui/patient/terminal.tsx` · ~180 lines
**purpose.** The once-ever eight-character code entry — **the only screen on the tablet that asks anybody for anything, and the only one a patient never sees** — plus the two terminal screens.
**api.** `export default function EnrolScreen(): JSX.Element`; `redeemAndStore(deps:{secure; client}, code): Promise<{ok:true} | {ok:false; reason:'expired'|'redeemed'|'revoked'|'attempts'|'no_passcode'}>`; `Closedown({photoSha, fallbackSha})`; `ContentExpired({stillLifeSha})`.
**deps.** C09, C13, R05, Y01, A06, A07, U01, U02, B29.
**spec.** ADR-PLATFORM §5.2 (redemption; storage under `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`; **the plain-words message when the device has no passcode**), §12 risk 5 (guideline 2.1 mitigation: a demo enrolment code, a synthetic resident, and a screen recording in the review notes); DESIGN-SYSTEM §8.11, §8.12, §7.2; SYNTHESIS ND-30 (**the patient never logs in** — this screen is operated by a caregiver or admin, once).
**blind test.** Each failure reason renders its own message and **leaves no credential behind** — the SecureStore is empty after every failure path. The no-passcode path shows exactly *"This tablet must have a passcode before it can be enrolled."* and refuses. On success both Keychain items are written and **the screen is never reachable again**; a subsequent cold start goes straight to the session. **The screen is unreachable from the session surface by any tap that exists**, asserted by the navigation graph. `ContentExpired`'s caption is exactly *"Nothing to look at just now."*, the still life contains no people, and **the word "reconnect" appears nowhere in the patient tree** (A33/A35).
**risk.** safety. **wave.** W9.

#### U07 — the staff handover · `app/(staff)/handover.tsx` · ~200 lines
**purpose.** How a shared tablet changes hands **without a resident ever being asked to identify her own photograph**. This module exists because adjudication C-4 deletes `app/(patient)/roster.tsx`.
**api.** `export default function HandoverScreen(): JSX.Element`; `FirstPage({firstName, restPhotoSha, onReturn, onProceed})`; `abortToHandover(sessionId): Promise<void>`.
**deps.** C10, C11, U01, U02.
**spec.** DESIGN-SYSTEM §8.9 in full (**there is no patient-facing roster in this product**; the staff screen at `app/(staff)/handover` reachable only when Guided Access is off; the reversible five-second first page; the staff abort writing `session_end_reason = wrong_resident` and **quarantining the trial rows rather than attributing them**; `device_mode` on every interaction row; and **S4 restated as "zero instances given correct attribution" with the residual named**); adjudication **C-4**.
**blind test.** **Navigation assertion: no sequence of taps available on the patient surface reaches this route** — walked exhaustively, because a resident reaching another resident's photographs is a confidentiality event. The first page: **any touch within 5.0 s returns to the handover screen**; no touch proceeds; nothing is labelled and nothing is asked, so it is **neither a modal nor dwell-to-select** — the default outcome is proceed, not wait. `abortToHandover` writes `wrong_resident` **and** marks the session's trial rows quarantined rather than attributing them — assert both, because attributing them corrupts two participants' datasets at once. **Caregiver-surface rules apply here** (17 pt body, 56 pt targets, real labels, surname and room number permitted because the screen is staff-facing and behind a passcode), **not patient rules**.
**risk.** privacy. **wave.** W9.

#### U08 — caregiver onboarding, screening and the comprehension check · `app/(caregiver)/onboarding/` · ~460 lines
**purpose.** The day-1 ask — **eleven things in under ten minutes** — plus the clinician-reviewed subtype screen and the C4 comprehension check, all in one sitting.
**api.** `OnboardingStack()`; `ScreeningForm({onOutcome})`; `ComprehensionCheck({onAnswer})`; `OnboardingSummary { birthYear; grewUp; firstLanguage; photos; elapsedMs; perStepMs }`.
**deps.** P04, P05, U01, B02, B15.
**spec.** V1-PRODUCT-SHAPE §3 (**the exact eleven things and the entry mechanism for each; median target 9 minutes, hard ceiling 10; instrumented, not estimated**), §9 (the three gates, the fourteen questions, the outcome table, and that **a named study clinician reviews every Gate-2 questionnaire before enrolment**); SYNTHESIS §8 F3, C4 (**≥90% of caregivers state, unprompted and in their own words, that the app will not slow the disease — a wrong answer is corrected, not recorded and ignored**), §2.1 (the honest claim), P17, P29.
**blind test.** **F3 as an executable test:** a scripted run with eight photographs emits `elapsedMs` and `perStepMs` — **the number itself is a pilot finding, but its absence is a build failure.** The person-status picker cannot be advanced past without a value; submitting empty is blocked client-side **and, if bypassed, raises `23502` at the database** — the two-layer assertion. **C4:** the check accepts free text and a wrong answer routes to correction; **nothing is persisted as a comprehension score, only a `corrected` flag.** **C3:** every string on this surface passes P05's claim lint. The screening produces an eligibility outcome **and no number** (P04's return type). The blocklist screen offers the four named categories (war, bereavement, displacement, institutional care) as tick-boxes. **Typing appears in exactly one place — the person's name — asserted by counting text inputs across the whole flow.**
**risk.** safety. **wave.** W4.

#### U09 — caregiver deck management and capture · `app/(caregiver)/deck/` · ~480 lines
**purpose.** Getting a photograph into the deck and managing it afterwards: capture, downscale, the release attestation that cannot be skipped, the mandatory unskippable person-status field, retire / re-enable / re-tier, and the one sentence a month.
**api.** `DeckScreen({patientId})`; `PhotoPass({onAdd})`; `DetailPass({drafts, onCommit})`; `PersonStatusPicker({value, onChange, error})`; `ReleaseAttestation({onAttest, onNoPersons})`; `ItemActions({itemId, status, tier, onRetire, onReEnable, onSetTier})`; `MonthTargetEditor({current, lastReviewedOn, onSave})`.
**deps.** A14, A15, B05, B15, U01, C11.
**spec.** V1-PRODUCT-SHAPE §3 (the eleven things; **one sentence a month, reviewed monthly, because a sentence that has stopped being true is a rehearsed false comfort**); SYNTHESIS P3, P16, P20, ND-8, ND-12, ND-17; ADR-PLATFORM §8 (the 1600 px downscale; the codec trap and the exact sentence *"please record in the app on your phone"*); ADR-DATA §5.4 (the release gate: **either name the depicted persons or attest that it depicts none**), §12.3; SCHEDULER-SPEC §15.2, §6.5 (**`ItemReEnabled` is a full reset**).
**blind test.** **`PersonStatusPicker` has no default value and no dismiss affordance**; selecting `deceased` surfaces the recognition-default-off explanation and requires an explicit override action. Marking media ready without a subject row **or** a no-persons attestation surfaces the server's `23514` as a field-level prompt rather than a crash. A photograph over 1600 px is downscaled **before** upload, asserted on the uploaded bytes. In a browser where `MediaRecorder.isTypeSupported('audio/mp4')` is false the record control is **disabled** with the exact sentence. **Every mutation goes through a B15 RPC — there is no client-side write path, asserted by intercepting requests.** Retiring posts `by ∈ {caregiver, clinician}` and **the type admits no third value**; there is **no bulk action and no automatic retirement anywhere in the surface**. Re-enabling explains in plain words that the item returns at maximum support and re-earns its way up. **The decisive negative: the flow contains no face-detection, clustering, auto-tagging or voiceprint call** — a source assertion, because this is the most obvious way to reduce caregiver burden and the one that is forbidden outright.
**risk.** privacy. **wave.** W4.

#### U10 — caregiver home, moments, alerts and settings · `app/(caregiver)/index.tsx`, `src/ui/caregiver/` · ~440 lines
**purpose.** The screen a caregiver lives on: what exists, the device line, the moments feed, the P25 alert inbox, the one-tap distress control, and the frozen enrolment parameters.
**api.** `HomeScreen()`; `MomentsFeed({patientId})`; `SyncAgeBanner({lastSyncAt, onShowWifiHelp})`; `AcuteChangeNotice({firstName, onAcknowledge})`; `StopThisIsUpsetting({onReport})`; `SettingsScreen()`.
**deps.** B06, B15, P03, U01, C11.
**spec.** SYNTHESIS P5 (**no score, percentage, accuracy chart, declining trend, streak, due-count or backlog, to anyone, ever**), P6 (**no missed-day counter, no guilt message**), P18 (**a one-tap caregiver "stop, this is upsetting"**), P23, P25, P10, ND-22, ND-28; ADR-DATA §11.6 (moments and actions), §8.6; DESIGN-SYSTEM §6.3 (`rungDwellStep` set once at enrolment), §9.5 (`audio_output` set once, **off the patient surface**), §8.11 (the rest photograph is **re-nominable from the caregiver's phone without touching the tablet**), §9.7 (**the caregiver app must say in plain words that a status change takes effect when the tablet next connects, offer a "put the tablet on wifi now" step, and surface the `last_sync` age**); V1-PRODUCT-SHAPE §8.2 surface D.
**blind test.** The rendered tree is run through a lint asserting **zero occurrences of a percentage sign, a fraction of the form `n of m`, and the words streak, backlog, due, missed or score, and zero chart or progress elements** — a second layer over a structural guarantee, since `app.my_moments` has no such columns. The data source is `app.my_moments` and nothing else, asserted by request interception: **no query touches `proj.interaction` or any analysis view.** The state line says what exists, never what is missing. **`StopThisIsUpsetting` works when the caregiver knows nothing — one tap, no item selection required (`itemId: null` is legal).** `AcuteChangeNotice` renders P03's body verbatim, refuses to render for a clinician or patient role (mirroring B06's trigger), and its text passes the forbidden-cognitive-vocabulary lint. **Changing `rungDwellStep`, `session_order_variant`, `patient_type_step` or `audio_output` after enrolment is refused with an explicit protocol-deviation message (P10).** The sync banner renders the age and the wifi step and **never a guilt-framed sentence** — asserted against §7.2's wrong column as a negative fixture.
**risk.** safety. **wave.** W4.

#### U11 — caregiver consent, withdrawal and deletion · `app/(caregiver)/consent/`, `app/(caregiver)/delete.tsx` · ~360 lines
**purpose.** The consent surfaces in the words the law requires, the withdrawal choice in plain language, the documented caregiver-removal path, and delete-everything with the honest seven-day wording.
**api.** `ConsentScreen({pathway:'direct'|'supported'|'consultee'})`; `WithdrawalFlow({onWithdraw(scope, purposes)})`; `DissentButton({patientId, onRecorded})`; `CaregiverRemoval({patientId})`; `DeleteEverythingScreen()`.
**deps.** B03, B15, B33, U01, C11.
**spec.** ADR-DATA §7.1 (**a consultee advises and cannot authorise**), §7.3 (six separable purposes), §7.4, §7.6 (**the participant chooses prospective or retrospective, in plain words — it is a column, not a decision an engineer makes for them**), §10.4(d) (`guaranteed_purged_by`); SYNTHESIS P22, P23, §8 S6; ADR-PLATFORM §10 (in-app account deletion is required because the caregiver app creates accounts).
**blind test.** **The consultee pathway offers no control whose label or value means "consented"** — enumerate every rendered option and assert none maps to a `subject_consented`-family outcome; the server would reject it with `23514` anyway, **and the UI must not be able to attempt it.** A caregiver can always record `withdrawal` and `dissent_observed` but never an `initial` or a reaffirmation. The withdrawal flow states, **in the same sentence as the choice**, that published releases cannot be unpublished. Caregiver removal is reachable in at most two taps. **The delete screen states "within 7 days", never "immediately"**, and surfaces `guaranteed_purged_by` from B33's response.
**risk.** privacy. **wave.** W5.

#### U12 — researcher shell and DOM primitives · `app/(researcher)/_layout.web.tsx`, `src/ui/researcher/` · ~380 lines
**purpose.** The plain-DOM shell, the P24 label as a component, the release picker, and real tables and real charts consuming the same token values so it reads as the same product.
**api.** `ResearcherLayout()`; `NotAClinicalAssessmentLabel()`; `ReleasePicker({releases, pinned, onPin})`; `DataTable<T>({rows, columns})`; `AttritionChart({nonUsage, dropout})`; `RateWithCI({label, numerator, denominator})`; `export const SURFACE_LABEL: 'Engagement and usage analytics for research — not a clinical assessment; not for diagnosis or treatment decisions.'`
**deps.** U01, B18.
**spec.** V1-PRODUCT-SHAPE §8.2 surfaces A and B, and **surface C: NOT BUILT. NOT DARK. NOT IN THE REPOSITORY**; SYNTHESIS P24, §8 F4; ADR-PLATFORM §7 (researcher: `.web.tsx`, real `<table>`, real `<svg>`, Recharts, plain CSS from the same tokens), §6.2 (the researcher surface is `.web.tsx` only).
**blind test.** **`SURFACE_LABEL` renders on every researcher page** — a route-table test — it is a component and not a footer string, and its text matches P24's wording verbatim. Every query goes through `analysis.*` and a **pinned release number**; a `42501` from any other schema surfaces as an explicit permission error rather than an empty table. **`AttritionChart`'s props admit two series and no merged one — it structurally refuses to render a single combined completion percentage (F4).** `RateWithCI` always renders an **exact interval** and never a bare percentage. **No chart component accepts a per-participant trajectory series — the prop type does not exist.** Every chart carries a direct label and a table twin, and every status colour is paired with a word. The route is `.web.tsx` only, enforced by G01.
**risk.** privacy. **wave.** W4.

#### U13 — the trial-operations console · `app/(researcher)/ops.web.tsx` · ~340 lines
**purpose.** The compliance-audit instrument for the Tier-1 and Tier-2 criteria — **the surface that lets the pilot be stopped early if it is harming people.**
**api.** `OpsConsolePage()`; `CriterionTile({id:'S1'…'S7'|'F1'…'F7', status:'met'|'not_met'|'insufficient'|'awaiting', value, ci?})`.
**deps.** B19, U01, U12.
**spec.** V1-PRODUCT-SHAPE §8.2 surface B; SYNTHESIS §8 Tier-1 and Tier-2 (every criterion and its measurement); ADR-DATA §12.4 (the console is **identified** — it names participants, care homes and devices — because it is the sponsor's live safety instrument, **which is why it is a separate role and a separate schema from `researcher`/`analysis`**).
**blind test.** Renders **S1–S7 and F1–F7** with exact confidence intervals and **no per-participant cognitive rendering** — column and label enumeration. **F4 draws two attrition curves separately and never combines them into one completion percentage.** S3 shows the telemetry-computed rate with audio-unhealthy sessions excluded. S4 shows zero incidents against the frozen descriptor. The P24 label is present. **The `trial_ops` role reaches this page and the `researcher` role receives `42501`** — asserted against a live local Supabase with both tokens.
**risk.** safety. **wave.** W5.

#### U14 — releases, cohort and export · `app/(researcher)/*.web.tsx` · ~420 lines
**purpose.** Plain-DOM browsing of immutable numbered releases, their codebooks and the cohort tables — retrospective, cohort-level, **never a live view of a named participant**.
**api.** `ReleasesPage()`, `CohortPage()`, `SessionsPage()`, `SafetyPage()`, `ProbePage()`, `ArmsPage()`, `DataExportPage()`.
**deps.** B18, B36, U01, U12.
**spec.** V1-PRODUCT-SHAPE §8.2 surface A (**not a UI — a versioned, scheduled export job plus a data dictionary and codebook**; cohort-level and retrospective); ADR-DATA §8.3 (immutable numbered releases; **a publication cites a release number and re-running the analysis returns the same numbers in two years**), §8.9.
**blind test.** Every query names `analysis.*` and a pinned release. **The arms page shows allocation health without unblinding, and unblinding is a database event and not a UI action.** The safety page reports the four zero-target audits with exact intervals. The codebook is rendered from B36's output and **a column present in the plane but absent from the codebook fails the test**. **Assertion by absence, and it is the important one: a repository-wide grep proves no drift detector, trajectory, progression metric or cognitive-status component exists in any form, feature-flagged or otherwise** (G01's `checkNoClinicalLayer`) — because a hidden UI over a built device is a weaker position than never having built it.
**risk.** privacy. **wave.** W6.

---

## 7. LESS IS MORE — JUSTIFYING 136

The principal's rule is minimum code and no speculative abstraction, and 136 modules invites the obvious objection. Here is the counting.

**The decomposition creates no artefact. It assigns an owner to artefacts the governing documents already name.**

| Layer | Modules | Artefacts the binding documents already require | Verdict |
|---|---|---|---|
| Backend | 36 | 30 migration files (ADR-DATA §15) + 6 edge functions (ADR-PLATFORM §9) + 1 seed + 1 codebook job = **38** | **fewer than the artefacts** |
| Scheduler | 25 | 27 named exports (SCHEDULER-SPEC §21.1) + 18 named fixture files (§23) = **45 named units** | **fewer than the spec's own units** |
| Adapters | 15 | 21 runtime dependencies (ADR-PLATFORM §3) | **fewer than the dependencies** |
| UI | 14 | ~20 screens + the tokens file + the contrast script | **fewer than the screens** |
| Contract | 18 | the 6 directories of ADR-PLATFORM §6.1 | **more files — see below** |
| Session runtime, telemetry, sync, policy | 26 | §§6–9 of the design system, §7 of the synthesis, §§6.1–6.9 of ADR-DATA | proportionate |
| Gates | 2 | ADR-PLATFORM §6.2's four rules + `app.json`/`eas.json` | — |

**Four layers of six are strictly smaller than the artefact count they own.** The one place the module count exceeds the document's own file count is the contract package, and that is the one place where splitting is the *point*: `src/contract/**` is frozen behind a human review, and a package split by reader set means a change to the wire envelope does not reopen the scheduler's frozen literals. Merging them would make the package impossible to freeze, because every change to either concern would reopen the other.

**Three merges I made, against the fine-grained instinct, because the fragments could not be understood apart:**

- **U02 is one 420-line module** of geometry constants rather than seven components, because A48's assertion — *a single diff of the four rects across every state must be empty* — has no owner if the rects are declared in seven files.
- **R04 is one 420-line state machine** rather than a machine per segment, because A39 requires the *whole* state space to be exhausted, and a machine split across modules has no single enumerable state space.
- **B23 is the storage policy and every grant in one file**, because ADR-DATA calls file 0029 *the security review*: an agent writing grants without seeing the policies they backstop cannot know whether a guarantee rests on a **missing grant (`42501`)** or an **editable predicate (zero rows)** — and that distinction is the entire de-identification argument.

**Two splits I made, against the cohesion instinct, because the merged unit failed the atomicity test:**

- **The reducer is four modules behind a dispatcher** (S18 items, S19 trial, S16 open, S17 close, S20 dispatch), because SCHEDULER-SPEC gives `closeSession` its own explicit twelve-step signature operating only on state, and `nextTrial` is a pure query that writes nothing. They share no mutable state; the coupling is state *shape*, which C04 already carries. A merged 1 100-line reducer is the one place where its own specification spans four sections and would acquire a silent contradiction.
- **S05 (`foilFor`) is alone at 30 lines**, because it is the module where a defect surfaces a widow's dead husband as the wrong answer to *"Which one is Margaret?"* on some Tuesday in week three, and because A41 needs one owner.

**And two things this decomposition deliberately cannot express.** There is no module for a progression-drift surface, no `getDriftLevel`, no `dueCount`, no `overdueItems`, no caregiver accuracy view and no clinical layer — not feature-flagged, not dark, not in the repository. ADR-DATA renders ND-22 as a set of missing columns; SCHEDULER-SPEC renders P24 as a frozen export list that fails a test if anyone adds a getter; G01 renders surface C as a repository-wide grep. **Each is carried forward as an absence, because an absence is the only form of these requirements that survives a sprint under deadline pressure.**

---

## 8. WHAT REMAINS UNOWNED

Every unowned requirement the audits found has been given a module. What follows is unowned **by design** — each is named so it is a decision and not a blind spot.

1. **ESCALATION C-1 — the drift term.** Not decided here. §2.5 states the blast radius exactly: one module, two state fields, four clamp terms, six config fields. **Must be decided by the principal before Wave 3 opens.**
2. **The §2.7 waiver set.** Twenty-two §7 telemetry fields have no producer in this product. B16 enforces that each carries a `research.field_waiver` row with a reason and an approver, but **the approval is the protocol owner's and must land in Wave 1**, because discovering it in month nine makes the backfill impossible.
3. **Blockers B1–B16** (SYNTHESIS §10, MASTER-SPEC §9). Regulatory, ethical and evidential. No engineering workaround exists for any of them. **B5 (REC/IRB) and B6 (PPI panel) gate patient recruitment; B1 (MHRA/FDA opinion scoped to P25) gates B35's deployment; B3 (biometric opinion scoped to aggregated prosodic features) gates whether T07's block ships at all.**
4. **A49–A52, the manual install checks.** G02 and B04 give their *results* a home (`ambient_lux_at_install`, `display_nits`, `install_checklist`); performing them is a study-coordinator task with a recorded result, not a module.
5. **S5's instrument administration.** D-9 gives the carer-anxiety score a data home and B19 a view; administering GHQ-28-A or HADS-A is external to the system.
6. **The model-fitted derived variables** — learning-curve AUC, `forgetting_rate_lambda`, `retention_at_*`, `isd_residual_rt`, `cv_rt`, `ex_gaussian_tau`, the practice-effect slope. Computed **offline in the analysis plane by the investigator** per V1-PRODUCT-SHAPE §8.2 surface C, as versioned recomputable derived variables. B36's codebook records the method version; nothing in this repository computes them.
7. **`surface-caregiver.md` and `surface-researcher.md` are not frozen.** U08–U14 are specified from the binding six. If those two documents are frozen later they refine those modules without changing a contract — but until then, no module may cite them.
8. **The B6 PPI panel's verdict on the mechanic freeze.** V1-PRODUCT-SHAPE is explicit: *"This is the freeze I bring to that panel, not the freeze that survives it."* Everything in this manifest inherits that condition.

---

## 9. THE ORDER OF OPERATIONS

1. **W0 now.** G01 before anything, because a boundary rule added after the domain wave finds violations instead of preventing them.
2. **Escalate C-1 and the §2.7 waiver set to the principal and the protocol owner, in parallel with W0.** Both must close before W3.
3. **Freeze the contract package as one `contract:` commit with one human review.** The W1 gate is the CI diff of C02, C04, C05 and C06 against their literal spec blocks — the check that catches a mis-transcribed frozen type before anything is built on it.
4. **Commission the blind test-writer and the blind implementer separately, from W2 onward.** The test-writer's first instruction is SCHEDULER-SPEC §23's: **re-derive every number in §19 from §§6–17; when §19 and §§6–17 disagree, §§6–17 win and the defect is raised, not silently resolved.** Four such disagreements have already been found and fixed; a fifth is likely.
5. **Run the G-track continuously from W0**, never as a final phase: `eas build --platform ios` in CI, the RLS suite over `policies.ts`, the accessibility conformance suite, the claim lint, the banned-lexicon check, `expo install --check`, and the disaster-recovery drill including `ops.replay_erasure_ledger()`.
