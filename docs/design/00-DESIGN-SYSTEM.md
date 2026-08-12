# 00 — DESIGN SYSTEM (BINDING)

**Status:** Binding for build. Supersedes the three patient direction documents as the specification of record.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles P1–P32, §9 NEVER DO ND-1–ND-40), `docs/design/00-V1-PRODUCT-SHAPE.md` (the six frozen mechanics, the ten-step walkthrough), `docs/architecture/00-ADR-PLATFORM.md` §7 (styling), `docs/research/elder-and-dementia-hci.md` (all empirical numbers, implications 1–56).
**Reference device (patient):** iPad 10.9"/11", landscape, orientation locked, **1180 × 820 pt**, 2360 × 1640 px at 264 ppi. **1 pt = 0.1924 mm. 1 mm = 5.198 pt.** Viewing distance 45 cm, on a stand.
**Requires seven written amendments to binding documents.** They are listed in §3, first, before anything is designed on top of them. If any is refused, the affected part of this system does not ship.

---

## 1. THE DECISION

### 1.1 The spine: THE TELEVISION PROGRAMME

**The patient surface is a broadcast.** It plays. It has a beginning and a sign-off. It continues if you do nothing. Touching is optional participation, never required input.

The three critic panels converged on this direction from three unrelated angles, and that convergence is the reason it is the spine rather than my preference:

- The **lived-experience** panel ranked it "least likely to humiliate anybody" and "the only one that has thought about what a wrong tap looks like from the armchair," and credited it with the only closed version of the deceased-person foil hole — the single finding in the whole review that would otherwise have produced a serious adverse event in week three.
- The **failure-mode** panel named its zero-input table as the only *auditable* rendering of the property all three directions claimed: "directly executable as a headless-agent exhaustion test," which converts S3 (≥99 % of sessions terminate on a success) from an aspiration into a state-machine walk.
- The **HCI** panel credited its caption strip ("implication 38 executed literally"), its card centres inside the central 50 %, and its invisible wrong tap, and gave it the fewest fatal findings of the three.

The structural argument underneath: **in a tap-to-continue design, silence means failure — the screen is stuck and someone must come and fix it. In a broadcast, silence means the programme carries on.** Apathy is the pre-registered F2 failure mode, it is the most prevalent neuropsychiatric symptom in dementia, and it is a *direct disease-caused predictor of not initiating any activity*. A design whose first requirement is "press this" is aimed at exactly the faculty the disease has taken. This direction removes initiation from the critical path without claiming personhood and without going silent-first.

**Two decisive discriminators against the rejected directions.**

Against **companion-voice**: it declares itself a visitor ("It's me"), and a metaphor that claims personhood incurs the obligations of personhood — the first of which is turn-taking, which it then breaks on card one by talking over her at t = 6.0 s. It also leads with the channel 55 % of adults 75+ have lost, and its own honest weakness section concedes it has no answer for the presbycusis-and-cataract intersection. Television claims nothing and therefore owes nothing, and its lead channel is a photograph.

Against **photo-album**: its session begins in silence with a photograph sitting on a table, which is precisely the object apathy defeats — Frank will not look at it, because looking at it is an initiation. Its own weakness #9 is the strongest self-criticism in the three documents: no text labels anywhere means a daughter two hundred miles away has nothing to say on the telephone. The caption strip answers that directly and for free.

### 1.2 What is borrowed, from where, and why

A design that takes everything from everyone has no spine. Six borrowings, each named, each because a critic identified it as superior to the spine's own answer, and each of which the spine absorbs without contradiction.

| # | Borrowed | From | Why it beats television's own answer |
|---|---|---|---|
| **B1** | **The stop panel** — one fixed, isolated, permanently-present non-photographic control, disclosed by position and by the same spoken sentence every session, no confirmation modal. | companion-voice | Television deleted the patient-side "not today" and substituted the **settling tap** (≥4 touches in 2 s), which three separate critics called fatal: it is a timed multi-tap gesture on a surface where P9/ND-31 permit single tap only, in a cohort where double-tap alone took 18.2 s with 3× the off-target errors; and it collides head-on with television's own best small decision (repeated touching *holds* a picture she likes), so the identical motor act means both "keep this here" and "end the programme now." P18 *requires* a patient-side control. The stop panel is the only one in the three documents a person with dementia could operate. **Taken with the HCI panel's mandatory fix applied: the panel carries the word.** |
| **B2** | **The speech-gated descent** — the rung clock advances only on no touch **and** no voice. | photo-album | The single highest-value fix in the review, and photo-album did not know it was its best idea (it appears in one clause). Without it the app finishes her sentences: she says "Margaret!" at three seconds and is told her sister's name at seven, ten cards a morning for twelve weeks. VAD is not ASR and holding a rung is not grading, so P27 and ND-26 are untouched, and the feature pipeline is already running for `utterance_duration_ms`. |
| **B3** | **The one-touch rule geometry** — on a single-subject page the whole picture zone is the target; the bone mat is the visible affordance and the surrounding ground is generous invisible slack. | photo-album | Dissolves §1.1's 1.9 off-target errors per attempt in ~82-year-olds, §1.3's 2.3 cm-vs-1.1 cm edge position bias and §1.4's kinetic tremor simultaneously, because there is no off-target region to fall into. The HCI panel called it "the strongest motor-accessibility position in the three documents." |
| **B4** | **The written P23 disclosure** — "I'm listening." at 40 pt in the caption strip whenever the mic is the point of the page. | photo-album (the line) + companion-voice (the once-per-session spoken sentence) | §8.4 requires the speech layer disclosed *in plain words in the patient UI*. Companion-voice discharged it in speech alone (lost to 55 % of the cohort) plus an unlabelled Ø24 pt amber dot — the only icon in any of the three documents, whose entire meaning is carried by being amber. This system takes the sentence, writes it, speaks it, and **deletes the dot**. |
| **B5** | **A non-figurative looping demonstration** — the two bone mats brighten alternately, 1200 ms, looping. | lived-experience panel's counter-proposal to companion-voice's hand | The HCI panel's fatal finding against television is that "bone means touchable" is a novel convention with no acquisition mechanism, and that the probe — the only measurement surface in the product — yields a datum only on a touch, so every participant who never acquires the convention contributes zero probe data, non-randomly, correlated with severity. Its prescribed fix was companion-voice's photographic hand. The lived-experience panel then found that hand **fatal for DLB**: a photorealistic, lined, disembodied adult hand extending and retracting every four seconds on a near-black ground at 45 cm is a fragment of a person, moving, in low light — the classic form of a Lewy-body misperception, in the one subtype the enrolment gate specifically flags. The alternating mat brighten teaches the same proposition, is non-figurative, and is **the identical visual event the person's own touch produces**, so the demonstration is literally a demonstration of the feedback. |
| **B6** | **The three-rung M-25 ladder and the `attained_rung` scale flag.** | companion-voice | A sentence has no photographic foil, and authoring one costs family content. Companion-voice is the only direction that noticed the consequence: `attained_rung` on target items is a **3-point scale**, and if it is not recorded as such the M4 analysis silently mixes two scales. The failure-mode panel then generalised the same insight to missing media. Both are absorbed as `rung_ladder_variant`. |

### 1.3 What is explicitly *not* borrowed, and why

- **Companion-voice's pre-session audio gate that refuses to start.** The instinct is right — a mute session logging `ended_on_success = true` poisons the adherence data — but the implementation puts the cost of a telemetry problem onto a patient, and hands a woman with dementia sitting alone the only error state in the product. Replaced by continuous monitoring plus a health flag (§9.6). The patient surface never has a screen whose content is a fault.
- **Companion-voice's "when voice was detected at rung 0, rung 3 speaks only the sentence and never restates the name."** Elegant, and the lived-experience panel called it the cheapest dignity win in the set. Declined: the name *is* the content of the item, and a cough that trips VAD would silently delete it. A behaviour that varies with an inferred signal about her, in a way that can remove the thing the card exists to deliver, is not worth the gain. Recorded as a rejected candidate, not an oversight.
- **Photo-album's underscore mask and companion-voice's 6 %-opacity ghost letters.** Both are fixed in §7.4 by a single decision that also removes a token.
- **The patient-facing roster, in all three directions.** Removed from the patient surface entirely (§8.9).

---

## 2. THE FORTY-ONE FINDINGS, AND WHERE EACH IS FIXED

Every **fatal** (13) and **serious** (28) finding from the three panels, with its disposition. Minor findings are folded in without separate listing except where they changed a number — the four that did are the rest photograph's dimming (§8.11), the P9 central-50 % departure (A4), implication 54's session-length target (A3), and tap-coordinate logging (§10).

**Six findings are fixed by deletion rather than by design**, and that is the healthiest column in the table: the settling tap, the microphone dot, early closedown, the `waiting` colour token, the patient-facing roster, and the audio gate that refused to start. Nothing replaced four of them, because nothing needed to.

### 2.1 Fatal

| Finding | Panel | Disposition |
|---|---|---|
| Television's `bone` rule has no acquisition mechanism; probe data lost non-randomly, correlated with severity | HCI | **Fixed.** B5 demonstration at every rung 2 and every probe item, plus a spoken **and** written instruction ("Put your finger on Margaret.") in the caption strip. §8.5, §8.7. |
| Television's settling tap (≥4 touches in 2 s) | HCI, failure-mode | **Deleted.** Replaced by B1, the labelled stop panel. §8.10. |
| companion-voice stop panel disclosed by audio alone, no label | HCI | **Fixed in the borrowing.** The panel reads `Stop for now` in `ink` at 40 pt, 12.44 : 1. §4.2, §8.10. |
| companion-voice's unlabelled amber microphone dot | HCI | **Deleted.** No icon exists anywhere on the patient surface. Disclosure is B4. |
| companion-voice's demonstration hand (DLB hallucination hazard) | lived-experience | **Not adopted.** B5 instead. |
| companion-voice's audio gate refusing to start | lived-experience | **Not adopted.** §9.6: never blocks, runs on captions, logs `audio_healthy = false`, notifies the caregiver out of band. |
| companion-voice's visitor persona talking over a speaking person | lived-experience | **Structurally absent** (no personhood claimed) **and** independently fixed by B2 for every direction. |
| companion-voice's rung-2 "correct mount's plate fills" | lived-experience | **Structurally absent.** Television's invisible wrong tap is the spine behaviour: both photographs dissolve out together and rung 3 arrives as a fresh single-picture frame. There is no frame in which the screen shows which card was touched. |
| Rung-2 foil not filtered by `person_status` — a deceased spouse as the foil | lived-experience | **Fixed and hardened.** §8.5.3: foil drawn only from `person_status = living` in the same deck, **fail-closed** — no living foil means no rung 2, `rung_ladder_variant = three_rung_no_foil`. Build-time assertion and a headless path check, because S4 is a per-path guarantee. |
| photo-album's substituted verb with zero instruction anywhere, ever | HCI | **Not applicable to the spine**, and the underlying defect (nothing teaches the affordance) is fixed by B5 plus the written instruction. |
| Wrong-resident attribution mid-session; the S4 audit is blind to its own worst failure | failure-mode | **Fixed.** §8.9: the roster leaves the patient surface; a staff handover screen behind the Guided Access passcode; a reversible first page; a staff abort writing `session_end_reason = wrong_resident` and **quarantining** the trial rows rather than attributing them; `device_mode` on every interaction row; S4 restated as "zero instances **given correct attribution**" with the residual named. |
| Offline revocation window: a card flagged after a death keeps asking "who is this?" for up to seven days | failure-mode | **Fixed.** §9.7: any card whose `person_status` has not been revalidated within **48 h** drops out of recognition mechanics (rungs 0/1/2) and degrades to rung 3 / M-02. P3-compliant (items degrade, never retire). `content_age_at_render_hours` logged so the S4 audit can separate "surfaced despite a flag" from "surfaced before the flag arrived." |
| companion-voice mid-session audio loss is byte-identical in telemetry to its celebrated best case | failure-mode | **Fixed for this system.** §9.6: continuous route/interruption monitoring, `audio_route_changes`, `audio_output_confirmed_ms`, per-session `audio_healthy`; audio-unhealthy sessions **excluded** from S3 and the adherence numerator rather than counted as successes. |

### 2.2 Serious

| Finding | Panel | Disposition |
|---|---|---|
| Nominal LRV computed from emitted display colours; no ambient envelope stated | HCI, failure-mode | **Fixed.** §11: LRV is reported as what it is (a computed relative-luminance separation, in the dark), a **measured on-device contrast** requirement replaces it as the compliance claim, a deployment illuminance envelope is stated, matte anti-glare film and a stand are pilot-kit requirements, True Tone and Night Shift are MDM-forced off, and `ambient_lux_at_install` is recorded. |
| Text opacity ramps are sub-AAA for three-quarters of their duration | HCI | **Structurally absent.** §6.5: **the opacity of text is never animated on the patient surface.** Every glyph is at full ink from the frame it appears in. |
| Masked-name glyphs carry information at 4.9 : 1 in hairlines | HCI | **Fixed by deleting a token.** §4.3: the `waiting` colour is removed. Unfilled letters are em-dashes in `caption` at **14.18 : 1**, in the name's own size and weight. This also repairs television's internal contradiction, in which a direction whose thesis is "colour never encodes meaning" introduced a colour whose only job was to encode "unfilled." |
| 32–48 pt band vs WCAG 1.4.4/1.4.8 200 % resize — the binding style rule and the binding accessibility rule cannot both hold | HCI | **Escalated in writing and partially resolved.** Amendment A2 (§3). Three enrolment steps; the largest renders the primary string at exactly **200 %** of the 32 pt floor and every string at ≥125 %; the caption strip is proven to fit at that step with a hard two-line cap (§5.4); the residual gap is a recorded, dated departure with the P10 argument attached. |
| Shared roster: six simultaneous choices, self-recognition from a photograph, undetectable error, confidentiality event | HCI, lived-experience, failure-mode | **Fixed.** §8.9, as above. |
| Television's early closedown: severity-correlated truncation, a hearing-loss population filter, VAD in a day room registering other people, the quiet attender cut off | HCI, lived-experience, failure-mode | **Deleted outright.** §8.11. The sign-off plays unconditionally and closedown catches every path, so S3 does not need it; and a rule that shortens the programme contradicts the direction's own thesis. `quiet_session` is logged as an observation and acted on by nobody. |
| A 6.0 s rung-0 window is the most aggressive of the three and sits on §4.3's named harm | HCI | **Fixed.** §6.3: every dwell is floored at **(spoken prompt duration + 8.0 s)** at rung 0, is a caregiver-set enrolment parameter with three steps, is logged, and is instrumented so the pilot produces the first waiting-tolerance distribution that exists for this cohort. |
| photo-album's 1.2 s foil-name-then-target: two face–name bindings inside 1.2 s | HCI | **Structurally absent** (invisible wrong tap; the foil is never named). |
| Patient-side "not today" deleted or replaced by a hidden gesture | lived-experience | **Fixed.** B1. Plus the closedown photograph is re-nominable by the caregiver from their phone without touching the tablet. |
| Fixed running order vs DLB fluctuation: the graded core lands after her lucid window closes | lived-experience | **Fixed.** §8.2: `session_order_variant`, a per-participant enrolment setting, front-loaded for `fluctuation_band = high`. It moves no element and changes no layout, so it lands on the content side of the P10 / §8.5 line. |
| Near-black ground unexamined against the one subtype the enrolment gate flags | lived-experience | **Fixed as a process, honestly.** §11.4: named watch category in the adverse-event register joined to `fluctuation_band`; a B6 side-by-side day-room test; and the palette is built as five tokens precisely so polarity can be inverted in one commit **before** enrolment opens, never after. |
| The app professes affection for a photograph it cannot see | lived-experience | **Fixed in copy.** §7.6. "I love this one." is deleted from the product. |
| companion-voice's mount inert at rungs 0/1/3 — a touch that does nothing teaches "broken" | lived-experience | **Fixed, and generalised into the spine's central rule.** §6.1: **touching the picture always plays its words again.** Nothing on the patient surface is ever inert. This also discharges implication 39's "provide a large, always-available play-again control," which no direction addressed, and it keeps the tap out of the grade entirely — so `attained_rung` on the personal deck is a pure function of the clock and B2, never of a self-report (P4). |
| photo-album's session opens in silence — the object apathy defeats | lived-experience | **Structurally absent.** The ident speaks at 1.0 s. |
| Session audible in a shared room; the cue ladder is broadcast to the lounge | lived-experience | **Fixed.** §9.5: `audio_output = speaker \| headphones \| captions_only`, caregiver-set once at enrolment, off the patient surface, frozen. Free, because every spoken word is already captioned verbatim. |
| Rung clock advances over a correct spoken answer | lived-experience | **Fixed.** B2. |
| Perseverative tapping skips the clinical core | failure-mode | **Structurally impossible here.** A touch never advances anything; it replays and holds. §6.1, §6.2. `perseveration_suspected` is still logged as a deterministic behavioural event, and the 60 s replay ceiling holds. |
| Centred masked name reflows horizontally as it fills | failure-mode | **Structurally absent.** All caption text is left-aligned at a fixed origin x = 80. |
| The 90 s walk-away timer appears never to fire, making §9.2 decorative | failure-mode | **Resolved by deletion.** With early closedown gone there is no abandonment timer at all, so there is nothing ambiguous to state. `timeout` never fires on this surface, and §10 says so. |
| Charging trolley, battery, and an unsuppressible iOS low-battery modal | failure-mode | **Fixed.** §11.5: MDM-enforced Low Power Mode off and auto-lock never; `expo-battery` declared as a required manifest addition; below 25 % the session ends at the next zero-demand boundary via the unconditional sign-off, so the person gets P1's guaranteed success instead of an OS modal mid-demand; `battery_level_start/end`, `low_power_mode` logged; and the document states plainly that the alert is an OS modal we cannot suppress and the mitigation is deployment, not code. |
| The held-finger state is undefined; palm contact rejected as a broken screen | failure-mode | **Fixed.** §6.6: acknowledgement **persists** while any pointer is down; the page's own advance timer continues regardless so a held finger can never stall the session; lift-and-replace is a fresh touch-down; large contacts are accepted at their centroid. |
| Adjacent tap counts with opposite meanings | failure-mode | **Resolved by deleting the settling tap.** |
| Missing media silently converts a four-rung ladder into three | failure-mode | **Fixed.** `rung_ladder_variant` per trial, `n_cards_dropped_media_not_ready` and `deck_size_at_render` per session, `turnaround_decade` recomputed from the rendered deck, and a **bundled fallback still-life** for the rest slot so the terminal state can never be absent. |
| The two screens a patient is most likely to meet on a bad day are the two nobody designed | failure-mode | **Fixed.** §8.12 designs both in the product's own grammar. The word "reconnect" never reaches the patient. |
| The demo build is the one build where audio does not autoplay; `AVAudioSession` category unspecified | failure-mode | **Fixed.** §9.4: `.playback` named as a hard requirement; a web-only operator start affordance that cannot exist in the native patient build; B6 mandated on native hardware, on a stand, in a real day room. |
| First-pointer-wins decides an identity by a 20 ms margin | failure-mode | **Fixed** by moving the roster off the patient surface plus the reversible first page. |
| Landscape lock does not stop a person rotating the tablet | failure-mode | **Fixed as far as software can.** §11.3: the stand is a hard pilot-kit requirement; the caption strip plus the bottom-right stop panel are two independent asymmetric landmarks; portrait behaviour is stated rather than left to be discovered by a resident. |
| `ended_on_success = true` for a session possibly delivered to an empty chair | lived-experience | **Fixed with one boolean.** §10: `session_had_any_response` reported alongside S3, so S3 is reportable pooled **and** restricted to responded sessions. Written into the protocol before B5. |

---

## 3. THE SEVEN AMENDMENTS THIS SYSTEM REQUIRES

Stated before anything is built on them. Each is narrow, written, and dated at sign-off. If one is refused, the affected part does not ship — it is not watered down.

**A1 — ND-32, "autoplay", narrowed.** *Amend to:* "autoplay" means **autoplaying video, and any content that translates, pans, zooms or scales across the screen.** Still content replacing still content by cross-dissolve, and audio beginning without a gesture, are permitted on the patient surface.
*Argument:* every other item in ND-32 is a motion item and the whole clause's cited evidence is vestibular — optic flow, cybersickness in 3 of 12, WCAG 2.3.3's "nausea, migraine headaches, and potentially needing bed rest." A 600 ms cross-dissolve between two still photographs in a frame that never translates produces zero optic flow. And the frozen v1 shape already assumes it in three places: step 3 plays 30 s of music with no gesture, step 10 says "the pictures keep going," and the ADR chose React Native partly for "audio playback for a user who cannot follow a 'tap to enable sound' prompt — no gesture gate."
*If refused:* kill the direction. A broadcast that needs a tap to keep broadcasting is tap-to-continue in a costume.
**This is the load-bearing risk of this document and should be reviewed as such, not as preamble.** I know exactly what it looks like: a designer explaining why the safety rule does not apply to his design. The mitigations are that it is narrow, written, and independently forced by the frozen shape.

**A2 — ADR §7's 32–48 pt patient type ceiling, raised for the largest enrolment step only.** *Amend to:* 32–48 pt for the default and small enrolment steps; **32–64 pt for the large step**, which may be selected only once, at enrolment, by the caregiver, and is frozen thereafter.
*Argument:* WCAG 1.4.4 requires 200 % text resize; 200 % of the ADR's own 32 pt floor is 64 pt, which is above the ADR's own 48 pt ceiling. The two binding rules are arithmetically incompatible and no design can satisfy both. §5.4 proves the caption strip fits at 64 pt with a hard two-line cap and no horizontal scroll.
*Residual, declared:* full 200 % conformance across *every* string is not achievable inside a fixed two-zone frame. At the large step the primary string is at 200 % and the smallest string at 125 %. This is a **recorded departure from WCAG 1.4.4**, argued on the grounds that P10 freezes the surface per participant and the size is therefore a per-participant configuration chosen once, not a runtime resize. It must be argued in writing in the accessibility conformance statement **before enrolment**, not discovered by an auditor afterwards.

**A3 — HCI implication 54's "target 3–5 minutes" for patient sessions.** *Amend to:* the sourced figure in §6.4 is a **30–35 minute fatigue threshold**, and it applies to caregiver authoring and clinician assessment. The 3–5 minute figure is `[derived]` and unsourced. The daily patient session is accepted at **8–10 minutes** against the sourced figure, which it clears by more than 3×. Session duration and within-session drop-off are instrumented so the derived number can be replaced with a measured one.

**A4 — P9's "central 50 % of the screen", read as the finding rather than the heuristic.** *Amend to:* patient target **centres** sit in the central 50 %; target **edges** may extend beyond it provided the target's active area exceeds the ~2.3 cm the outer 25 % demands (§1.3). Two declared exceptions, both with arithmetic attached in §5.3:
 - the two rung-2 cards, whose centres are at x = 310 and x = 870 inside the 295–885 band and whose 88.5 mm width is **3.8×** the outer-zone requirement;
 - the stop panel, whose centre is deliberately outside the band because **implication 4 requires an exit control in a fixed, isolated corner with a large dead zone**, and implication 4 wins for an exit. Its 61.6 mm width is **2.7×** the outer-zone requirement.
*This is a P-principle being read against its own evidence inside a design document, and it must be accepted or rejected by the principle owner before enrolment rather than left silently overruled.*

**A5 — The frozen §4 M-135 branch.** *Amend to:* Nothing Today replaces steps **4–7** with six M-02 cards, not steps 4–8. **The song always plays.** The frozen text replaces 4–8, which removes the song on unprimed sessions — i.e. removes the only zero-demand, highest-evidence, non-visual mechanic on precisely the day it is most wanted. `prime_condition` is still logged; on a Nothing Today it records the placement the session would have had.

**A6 — `session_end_reason` enum extended once, in the frozen telemetry spec, not per surface.** Add `battery_truncated`, `audio_unavailable`, `content_expired`, `wrong_resident`. Rule: fade-to-rest after the unconditional sign-off is `completed`; the stop panel is `user_ended`. On this surface `timeout` never fires and that is an assertion, not an accident (§8.11).

**A7 — Two dependencies added to the ADR's frozen manifest.** `expo-font` (to bundle Source Sans 3) and `expo-battery` (§11.5).
*The font is not cosmetic.* A platform system face changes with OS releases. An iOS update that reflows a name mid-study **is a patient-UI change and therefore a P10 protocol deviation**, delivered by Apple, unlogged, to a subset of participants. Bundling an OFL-licensed face at a pinned version is the only way P10 can actually hold for twelve weeks. No direction noticed this.

---

## 4. THE TOKENS

### 4.1 `src/ui/tokens.ts` — literal contents

```ts
// src/ui/tokens.ts
//
// The single source of truth for every colour, size, dimension and duration on
// all three surfaces. Nothing in src/ui/** may contain a literal hex value, a
// literal point size, or a literal millisecond figure. This is enforced in CI.
//
// The patient tokens are FROZEN PER PARTICIPANT at enrolment (P10). Changing a
// value here after enrolment opens is a protocol deviation, not a style change.
// Every contrast ratio in the comments below is computed from these exact hex
// values by scripts/contrast.ts, which runs in CI and fails the build if any
// comment disagrees with its own arithmetic.

// ─────────────────────────────────────────────────────────────────────────────
// UNITS
// Reference patient device: iPad 10.9"/11", landscape, 2360 x 1640 px @ 264 ppi,
// rendered at 2x => 1180 x 820 pt. Physical 227.0 x 157.8 mm.
// ─────────────────────────────────────────────────────────────────────────────
export const MM_PER_PT = 0.1924;
export const PT_PER_MM = 5.198;
export const mm = (pt: number) => pt * MM_PER_PT;

// ═════════════════════════════════════════════════════════════════════════════
// PATIENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Five values and the photographs. That is the entire patient palette.
 *
 * THE BONE RULE. `bone` means: the programme is talking about this picture, and
 * touching it will say it again. Nothing else in the product is ever bone,
 * except the stop panel, which is the one non-photographic thing you can touch.
 * The colour is the affordance. It never has to be explained because it is only
 * ever true.
 *
 * COLOUR NEVER ENCODES MEANING. The bone rule is a LUMINANCE code, redundant
 * with size, position, the spoken sentence and the written instruction. There is
 * no blue-vs-green, no pastel pair, no hue distinction anywhere; lens yellowing
 * makes green, blue and violet hard to separate. There is no orange or yellow
 * content on a light ground, because there is no light ground. Pure white is
 * never used: the brightest surface in the product is #FCF1DF, and it exists
 * for 200 ms at a time.
 *
 * COMPUTED CONTRAST (WCAG 2.x relative luminance; AAA floor for text is 7:1):
 *   caption on ground .................. 14.18 : 1   PASS
 *   ink on bone ........................ 12.44 : 1   PASS
 *   ink on boneTouched ................. 14.95 : 1   PASS
 * COMPUTED SURFACE SEPARATION (DSDC Stirling / BS 8300:2018 wants >= 30 points
 * between large adjacent surfaces; 40+ is described as excellent):
 *   bone vs ground ..................... 72.0 points
 *   boneTouched vs ground .............. 87.8 points
 * See section 11 of 00-DESIGN-SYSTEM.md before quoting these as satisfied
 * requirements: they are computed in the dark, and LRV is a property of a
 * reflecting surface. The binding compliance claim is MEASURED on-device
 * contrast at the deployment illuminance.
 */
export const patientColor = {
  /** The room. Every background, everywhere, always. LRV 1.2. */
  ground:      '#201B17',
  /** Touchable. The mat around every photograph the programme is talking about,
   *  the letterbox fill inside that mat, and the stop panel. LRV 73.2. */
  bone:        '#E8DDCB',
  /** Bone, touched. Also the demonstration state. +21.5% Weber / +9.7% Michelson
   *  over bone — chosen to sit well above the low-spatial-frequency detection
   *  threshold, which is the one band AD contrast sensitivity spares. LRV 88.9. */
  boneTouched: '#FCF1DF',
  /** All text on ground. The only text colour in the product bar the stop label. */
  caption:     '#F2E9DA',
  /** Text on bone. Used in exactly one place: the stop panel label. LRV 1.3. */
  ink:         '#221D18',
} as const;

/**
 * THREE ENROLMENT STEPS. Chosen once by the caregiver at enrolment, frozen for
 * the study (P10, implication 53). There is NO user-facing text-size control on
 * the patient surface.
 *
 * `lg` exceeds the ADR's 48 pt ceiling under amendment A2. 64 pt is exactly
 * 200% of the 32 pt floor (WCAG 1.4.4). Cap height ~0.66 em; at 45 cm:
 *   32 pt -> 4.06 mm -> 31.0 arcmin (20/20 letter threshold is ~5 arcmin;
 *                                    20/80 needs ~20 arcmin)
 *   40 pt -> 5.08 mm -> 38.8 arcmin
 *   48 pt -> 6.10 mm -> 46.6 arcmin
 *   64 pt -> 8.12 mm -> 62.0 arcmin
 */
export type PatientTypeStep = 'sm' | 'md' | 'lg';
export const patientType = {
  sm: { name: 40, speech: 36, sentence: 32 },
  md: { name: 48, speech: 40, sentence: 32 },   // default
  lg: { name: 64, speech: 52, sentence: 40 },   // requires amendment A2
} as const;

export const patientTypeInvariants = {
  /** Bundled at a pinned version. A system face changes with the OS, and an OS
   *  update that reflows a name mid-study is a P10 deviation delivered by Apple.
   *  Source Sans 3 is OFL-1.1: humanist, large x-height, open apertures, and it
   *  ships no Light cut to be tempted by. Requires expo-font (amendment A7). */
  family: 'SourceSans3-SemiBold',
  weight: '600',
  /** ONE weight. Never Light, never Thin: thin strokes are high spatial
   *  frequency and that is the exact AD deficit. */
  lineHeight: 1.5,
  letterSpacing: 0.5,
  /** Left-aligned at a fixed origin, always. Never centred, never justified
   *  (WCAG 1.4.8). A fixed left edge means the first word is always in the same
   *  physical pixels, and a masked name does not reflow as it fills. */
  align: 'left',
  maxLines: 2,
  maxWordsPerPrompt: 8,
  readingAge: '8-10',
} as const;

/**
 * GEOMETRY. Two zones and one panel, in identical positions on every screen of
 * the product for the entire study. This is what makes P10 and the
 * procedural-learning requirement (HCI 8.3) hold BY CONSTRUCTION rather than by
 * discipline, and it is machine-checkable.
 */
export const patientLayout = {
  screen:       { w: 1180, h: 820 },                       // 227.0 x 157.8 mm

  /** The picture. Tappable in full in the one-picture state. 71.95% of viewport. */
  pictureZone:  { x: 0,   y: 0,   w: 1180, h: 590 },       // 227.0 x 113.5 mm

  /** The only place in the product where words appear. Never tappable. */
  captionStrip: { x: 0,   y: 590, w: 1180, h: 230 },       // 227.0 x  44.3 mm
  captionText:  { x: 80,  y: 620, w: 680 },                // 130.8 mm column

  /** The one non-photographic control. Fixed, isolated, always present except
   *  at closedown. 61.6 x 25.0 mm. */
  stopPanel:    { x: 820, y: 660, w: 320,  h: 130 },

  /** ONE-PICTURE STATE. Mat is bone; the photograph is drawn contentFit:contain
   *  inside the window and all unfilled window area is bone, so a portrait
   *  photograph shows bone margins either side — a print mounted on card, never
   *  a black bar, and never a cropped face. */
  matSingle:    { x: 40,  y: 8,   w: 1100, h: 574 },
  photoSingle:  { x: 72,  y: 40,  w: 1036, h: 510 },       // 199.3 x  98.1 mm

  /** TWO-PICTURE STATE. Cue rung 2 and probe rung 2 ONLY. */
  matLeft:      { x: 80,  y: 20,  w: 460,  h: 520 },       //  88.5 x 100.0 mm
  matRight:     { x: 640, y: 20,  w: 460,  h: 520 },
  photoLeft:    { x: 112, y: 52,  w: 396,  h: 456 },       //  76.2 x  87.7 mm
  photoRight:   { x: 672, y: 52,  w: 396,  h: 456 },

  /** The bone border. Also the touch-acknowledgement surface and the
   *  demonstration surface. 32 pt = 6.2 mm. */
  matBorder: 32,

  /** Dead space, all >= the 8 mm requirement (implication 2). */
  cardGutter:            100,   // 19.2 mm  between the two cards
  pictureToStopPanel:     70,   // 13.5 mm  one-picture state
  cardToStopPanel:       120,   // 23.1 mm  two-picture state
  captionColumnToStop:    60,   // 11.5 mm
} as const;

/** Every patient touch target, with its computed physical size. The ADR's
 *  Playwright floor is 88 pt = 16.9 mm. There are exactly four. */
export const patientTargets = {
  picture:   { w: 1180, h: 590, mmW: 227.0, mmH: 113.5 },
  cardLeft:  { w: 460,  h: 520, mmW:  88.5, mmH: 100.0 },
  cardRight: { w: 460,  h: 520, mmW:  88.5, mmH: 100.0 },
  stop:      { w: 320,  h: 130, mmW:  61.6, mmH:  25.0 },
} as const;

/**
 * MOTION. Opacity and luminance only. Nothing on the patient surface ever
 * translates, rotates, scales or parallaxes, at any time, in any state.
 * Ken Burns is forbidden by name: it is optic flow across the entire viewport in
 * a cohort where 3 of 12 got cybersick and vestibular decline is associated with
 * falls.
 *
 * THE OPACITY OF TEXT IS NEVER ANIMATED. Text either is on screen at full ink or
 * is not on screen. A ramping glyph is sub-AAA for most of its ramp.
 */
export const patientMotion = {
  /** Every change of what is on screen. ADR §7 floors transitions at 300 ms;
   *  HCI 41 wants <=150 ms. HCI 41's concern is viewport motion, which a
   *  positionless cross-dissolve does not have, so the ADR governs. */
  crossDissolve: 600,
  /** The caption clearing after the answer-first beat. Slow, so it reads as the
   *  caption settling rather than as something being taken from her. */
  captionWithdraw: 1200,
  /** Touch acknowledgement: bone -> boneTouched. */
  ackIn: 100, ackHold: 200, ackOut: 200,
  /** The demonstration (B5): left mat, then right mat, then a gap. */
  demoRise: 300, demoHold: 600, demoFall: 300, demoGapBetweenMats: 400,
  demoLoopPeriod: 4000,
  /** Input lockout after any committing touch (HCI 9's 300-500 ms band). */
  inputLockout: 400,
  /** Never used. Listed so a reviewer can see they are absent. */
  translate: null, scale: null, rotate: null, parallax: null, kenBurns: null,
} as const;

/** SOUND. One tone, one voice. Nothing is ever marked by silence either: every
 *  transition sounds, so an absent tone never means anything. */
export const patientSound = {
  /** M-137, undifferentiated. Identical on every touch and every advance,
   *  regardless of outcome. Two discriminable sounds are a per-trial correctness
   *  signal she learns to read — ND-5 by the back door. */
  toneMs: 180, toneAttackMs: 40, toneFundamentalHz: 220,
  toneBandHz: [150, 900] as const,   // below the 2-4 kHz consonant band
  toneLufs: -16,
  /** ~3 syllables/second against a ~4 syl/s norm. */
  speechSyllablesPerSecond: 3.0,
  speechLeadInMs: 800, speechTailMs: 800,
  speechBandHz: [300, 2000] as const,
  /** iOS: AVAudioSession category. .playback is a HARD requirement — .ambient
   *  plays nothing when the device silent switch is on. */
  iosAudioSessionCategory: 'playback',
} as const;

/**
 * TIMING. Every dwell is floored at (spoken prompt duration + a silence budget).
 * `rungDwellStep` is a caregiver-set enrolment parameter, frozen, logged. None
 * of these numbers has a source: no dose-response or waiting-tolerance curve
 * exists for this population anywhere in the corpus. The pilot's first job on
 * this surface is to measure them.
 */
export type RungDwellStep = 'short' | 'standard' | 'long';
export const patientTiming = {
  silenceBudget: { short: 6.0, standard: 8.0, long: 11.0 },   // seconds, rung 0
  rung1Silence:  { short: 3.5, standard: 5.0, long:  7.0 },
  rung2Silence:  { short: 4.5, standard: 6.0, long:  8.0 },
  answerFirstHoldS: 3.0,
  rung3HoldS: 4.0,
  m02AdvanceS: 20.0,
  /** Touch replays and HOLDS the picture, resetting the advance timer up to a
   *  hard ceiling. A touch can never skip and can never stall. */
  replayCeilingS: 60.0,
  probeRevealS: 4.0,
  probeBlockCapS: 120.0,
  m40: { promptS: 6.0, silence1S: 15.0, cue1S: 4.0, silence2S: 21.0,
         cue2S: 4.0, silence3S: 15.0, closeS: 5.0 },
  /** B2: the rung clock does not advance while voice activity is detected, and
   *  restarts this long after speech stops. VAD is not ASR; holding a rung is
   *  not determining correctness (P27, ND-26 untouched). */
  speechGateRestartMs: 1500,
  /** A rung may be extended by speech to at most this multiple of its base
   *  dwell, so a talkative person is never held forever. */
  speechGateMaxExtensionFactor: 3.0,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// CAREGIVER — ordinary density. The patient rules are deliberately NOT
// inherited: 88 pt targets, 32-48 pt type and absent chrome are patient rules
// resting on patient evidence. Copying them here would be cargo cult. What IS
// inherited: 7:1 contrast (a caregiver spouse may be 82), single tap only, and
// no hamburger (~48% of over-45s do not recognise it).
// ═════════════════════════════════════════════════════════════════════════════
export const caregiverColor = {
  surface:   '#FBF9F5',   // LRV 94.9
  sunken:    '#F2EDE4',   // LRV 85.0
  ink:       '#1F1B17',   // 16.27 : 1 on surface, 14.67 : 1 on sunken
  inkQuiet:  '#544B41',   //  8.12 : 1 on surface
  line:      '#D8D0C3',   // decorative rule only; carries no meaning
  actionBg:  '#3A3129',
  actionInk: '#FBF9F5',   // 12.09 : 1 on actionBg
  calmBg:    '#E8DDCB',   // ink on calmBg = 12.74 : 1 (same bone as the patient
                          // surface, so it reads as one product)
  warnInk:   '#7A2E17',   //  8.95 : 1 on surface. Used for "Something upset
                          // her", never for a performance statement.
} as const;

export const caregiverType = {
  family: 'SourceSans3-Regular', familySemi: 'SourceSans3-SemiBold',
  display: 28, title: 22, body: 17, label: 15, caption: 13,
  lineHeight: 1.5,
} as const;

export const caregiverLayout = {
  /** 56 pt = 10.8 mm, at the ~11 mm near-100% hit-rate threshold for older
   *  adults (HCI 1.3). 44 pt = 8.5 mm sits below it and is not used for a
   *  primary action. */
  targetPrimary: 56, targetSecondary: 48, targetMin: 44,
  gutter: 16, pad: 20, radius: 10, maxContentWidth: 720,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// RESEARCHER — dense, read-only, plain DOM. Same values exported to tokens.css.
// AA contrast, 13-15 px body, sortable tables, instant state changes, a theme
// toggle. Density is a virtue here.
// ═════════════════════════════════════════════════════════════════════════════
export const researcherColor = {
  light: { surface: '#FBF9F5', panel: '#F2EDE4', ink: '#1F1B17',   // 16.27 : 1
           inkQuiet: '#544B41' /* 8.12 : 1 */, grid: '#DCD4C7' },
  dark:  { surface: '#211D19', panel: '#2A2521', ink: '#F2EDE4',   // 14.36 : 1
           inkQuiet: '#B7ADA0' /* 7.57 : 1 */, grid: '#3E3830' },
  /** Categorical identity slots. Per theme, because a single set cannot clear
   *  3:1 on both grounds. Every series carries a direct label and a table twin;
   *  colour is never the only encoding. */
  seriesLight: ['#8C4A2F','#3F6B57','#7A5C99','#A8802A','#2F5D7A','#8A3B57'],
  //             6.37      5.79      5.23      3.45      6.73      7.02  : 1 on surface
  seriesDark:  ['#AB7B67','#6B8D7E','#937BAC','#A8802A','#67899E','#AD7689'],
  //             4.59      4.57      4.52      4.61      4.50      4.57  : 1 on surface
  /** Status. NEVER used for a data series, and always paired with a WORD
   *  (MET / NOT MET / INSUFFICIENT DATA / AWAITING ENDPOINT) and a glyph. */
  statusLight: { met: '#3F6B57', notMet: '#8C3A2A',
                 insufficient: '#6B6257', awaiting: '#4A5A6B' },
  statusDark:  { met: '#6B8D7E', notMet: '#B0776C',
                 insufficient: '#8C857C', awaiting: '#7B8793' },
} as const;

export const researcherType = {
  family: 'SourceSans3-Regular', mono: 'ui-monospace, SFMono-Regular, monospace',
  h1: 22, h2: 17, body: 15, table: 13, micro: 11,
  tabularNums: 'tabular-nums', lineHeight: 1.45,
} as const;

export const researcherLayout = {
  rowHeight: 28, control: 32, controlMin: 24,
  gutter: 12, pad: 16, radius: 6,
} as const;
```

### 4.2 Computed contrast, stated not asserted

Computed from the exact hex values above with the WCAG 2.x relative-luminance formula (`scripts/contrast.ts`, run in CI):

| Pair | Role | Ratio | AAA 7:1 | LRV separation |
|---|---|---|---|---|
| `caption` on `ground` | every word the programme says | **14.18 : 1** | PASS | 81.1 |
| `ink` on `bone` | the stop-panel label | **12.44 : 1** | PASS | 71.9 |
| `ink` on `boneTouched` | the label while touched | **14.95 : 1** | PASS | 87.6 |
| `bone` on `ground` | mat vs room (surface rule) | 12.71 : 1 | — | **72.0** |
| `boneTouched` on `ground` | touched mat vs room | 15.27 : 1 | — | **87.8** |
| `boneTouched` vs `bone` | the touch state and the demonstration | 1.12 : 1 | n/a — not text, not a meaning code | 9.2 (Weber +21.5 %, Michelson 9.7 %) |

**The lowest text ratio anywhere on the patient surface is 12.44 : 1**, against the WCAG 1.4.6 AAA floor of 7 : 1 — a floor that exists to compensate for roughly 20/80 vision, on top of which AD contrast-sensitivity loss sits.

### 4.3 The token this system deletes

Television carried a fifth colour, `waiting` (#B5A798, 7.2 : 1), whose only job was to render the *unfilled* letters of a masked name. It is removed. Two reasons, and the second is the one that matters:

1. The masked name's dashes carry the word's **length**, which is the entire informational content of the cue. Text-equivalent information below 7 : 1 fails implication 16, and a thin horizontal rule is the highest-spatial-frequency mark that can be drawn — the least visible possible rendering of the most information-dense element on the page.
2. **A direction whose thesis is "colour never encodes meaning" cannot have a colour whose only job is to encode "unfilled."** Neither television nor any critic caught this. Distinguishing filled from unfilled by **glyph** (letter vs em-dash) rather than by colour removes the contradiction, removes the token, and raises the mask from 7.2 : 1 to 14.18 : 1.

---

## 5. GEOMETRY

### 5.1 The frame

```
 x=0                                                          x=1180 pt
 ┌──────────────────────────────────────────────────────────────────┐ y=0
 │  ┌────────────────────────────────────────────────────────────┐  │ y=8
 │  │ ░░ bone mat, 32 pt border ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
 │  │ ░ ┌──────────────────────────────────────────────────────┐ │  │ y=40
 │  │ ░ │                                                      │ │  │
 │  │ ░ │   THE PHOTOGRAPH  1036 × 510 pt  (199.3 × 98.1 mm)   │ │  │
 │  │ ░ │   contentFit: contain — a face is NEVER cropped      │ │  │
 │  │ ░ │   unfilled window area is bone, never black          │ │  │
 │  │ ░ └──────────────────────────────────────────────────────┘ │  │ y=550
 │  └────────────────────────────────────────────────────────────┘  │ y=582
 │      THE PICTURE ZONE — the whole 1180 × 590 is the target        │
 ├──────────────────────────────────────────────────────────────────┤ y=590
 │  Margaret                                    48 pt              │ │
 │  Your daughter. She rings on Sundays.        32 pt   ┌────────┐ │ │ y=660
 │  ← text always begins at x=80, for ever              │Stop for│ │ │
 │    THE CAPTION STRIP — never tappable                │  now   │ │ │
 │    the ONLY place words appear                       └────────┘ │ │ y=790
 └──────────────────────────────────────────────────────────────────┘ y=820
                                                        x=820  x=1140
```

Two zones and one panel. **There is no third zone.** No header, footer, corner, back arrow, home, settings, clock, date, battery symbol, wifi symbol, dots, or bar. **There are zero icons in the patient surface** — everything on screen is a photograph, a letterform, or a bone rectangle.

### 5.2 The two-picture state (rung 2 and probe rung 2 only)

```
 ┌──────────────────────────────────────────────────────────────────┐ y=0
 │   ┌────────────────┐                    ┌────────────────┐       │ y=20
 │   │░░ bone mat ░░░░│                    │░░ bone mat ░░░░│       │
 │   │░ ┌──────────┐ ░│  ← 100 pt gutter → │░ ┌──────────┐ ░│       │
 │   │░ │ 396×456  │ ░│     19.2 mm        │░ │ 396×456  │ ░│       │
 │   │░ └──────────┘ ░│     bare ground    │░ └──────────┘ ░│       │
 │   └────────────────┘                    └────────────────┘       │ y=540
 │    460×520 (88.5×100.0 mm)               460×520                 │
 │    centre x=310                          centre x=870            │
 ├──────────────────────────────────────────────────────────────────┤ y=590
 │  Which one is Margaret?                              ┌────────┐  │
 │  Put your finger on Margaret.                        │Stop for│  │
 │                                                      │  now   │  │
 └──────────────────────────────────────────────────────┴────────┴──┘
```

This is the **only** moment in the product where the picture zone changes shape, and it is a cut — a 600 ms cross-dissolve with zero translation.

### 5.3 Every number, computed

| Quantity | pt | mm | Requirement | Margin |
|---|---|---|---|---|
| Picture-zone target | 1180 × 590 | 227.0 × 113.5 | ≥ 88 pt (ADR) | 13.4× / 6.7× |
| Rung-2 / probe card | 460 × 520 | 88.5 × 100.0 | ≥ 88 pt; ≥ 20 mm (impl. 1); 40 mm large-screen optimum | 5.2× / 4.4× on the ADR floor; 2.2× on the optimum |
| Stop panel | 320 × 130 | 61.6 × 25.0 | ≥ 88 pt; ≥ 23 mm in the outer 25 % (impl. 3) | 3.6× / 1.5×; 2.7× on the outer-zone area |
| Gutter between cards | 100 | 19.2 | ≥ 8 mm (impl. 2) | 2.4× |
| Picture zone → stop panel | 70 | 13.5 | ≥ 8 mm | 1.7× |
| Card → stop panel | 120 | 23.1 | ≥ 8 mm; "large dead zone" (impl. 4) | 2.9× |
| Caption column → stop panel | 60 | 11.5 | visual separation only (text is not a target) | — |
| Card centres | x = 310, 870 | — | inside central 50 % = x 295–885 | both inside |
| Card vertical centre | y = 280 | — | inside central 50 % = y 205–615 | inside |
| Stop-panel centre | x = 980, y = 725 | — | **outside** the central 50 % | **declared departure A4**, required by impl. 4 |
| Bone border animated at rung 2 | 117,248 pt² | — | ≤ ~20 % of viewport (impl. 43) | **12.12 %** |
| Picture-zone target area | 696,200 pt² | — | — | 71.95 % of viewport |

### 5.4 Proof that the caption strip fits at the largest enrolment step

Strip is 230 pt tall; text block top is fixed at y = 620; hard two-line cap.

| Step | Worst-case block | Height | Fits in 230 − 2×24 padding = 182? |
|---|---|---|---|
| `sm` | 2 × (36 × 1.5) | 108 pt | yes, 74 pt slack |
| `md` | 2 × (40 × 1.5) | 120 pt | yes, 62 pt slack |
| `md` name + sentence | 48×1.5 + 32×1.5 | 120 pt | yes |
| `lg` | 2 × (52 × 1.5) | 156 pt | yes, 26 pt slack |
| `lg` name + sentence | 64×1.5 + 40×1.5 | 156 pt | yes, 26 pt slack |

Text column is 680 pt. At `lg`/52 pt with Source Sans 3 SemiBold's ~0.52 em average advance, that is ~25 characters per line, ~50 over two lines. The longest string the product can render is `"These are people from an old album."` at 35 characters — two lines, no overflow, **no horizontal scroll at any step**. Block bottom at `lg` is y = 776, clear of the screen edge and clear of the stop panel (which starts at x = 820, outside the 80–760 column).

---

## 6. INTERACTION RULES

### 6.1 The two rules of touch, and there will never be a third

> **1. One picture on screen → touching it plays its words again and holds it.**
> **2. Two pictures on screen → touching one is a choice.**
> Plus the stop panel, which is not a picture.

**Rule 1 is the most consequential decision in this document** and it replaces television's "at rungs −1/0/1, one touch: nothing happens."

- It removes every inert region from the patient surface. A person who touches her daughter's face and gets nothing has been taught the device is broken — on a UI frozen for twelve weeks, where the learning is procedural and depends on the motor act reliably producing a result.
- **The touch is never navigation and never a grade.** It cannot skip, cannot stall, and cannot advance a rung. `attained_rung` on the personal deck is therefore a pure function of the clock and the speech gate, never of anything she supplied about her own recall — which is what P4 requires and what photo-album's tap-as-grade confound (its own weakness #3) fails.
- It discharges implication 39's "provide a large, always-available *play again* control" — a requirement none of the three directions addressed — with no icon, no label, and no new object.
- It makes perseverative tapping structurally harmless: forty taps on the same spot hold one photograph for up to 60 s and then the programme continues. It cannot fast-forward through the clinical core, which is the failure mode photo-album's whole-screen advance created.

`replayCeilingS = 60` is a hard ceiling on any one picture; after it, the page advances regardless of touches.

### 6.2 What a touch does, exhaustively, on every screen

| Screen | One touch on the picture | Touch on the stop panel | No touch | No speech |
|---|---|---|---|---|
| Handover first page (shared only) | returns to the staff screen | n/a | ident begins at 5 s | n/a |
| Ident | replays "Here are your pictures." | ends the session via the sign-off | ident ends at 8 s | logged as a feature only |
| Saying (M-35) | *(the picture zone is empty — no bone, nothing to touch)* | ends via the sign-off | the voice completes the saying | valid; never a failure |
| Song (M-56) | replays the title and artist, holds the picture | ends via the sign-off | the song plays out | valid |
| Narrated card / rung 3 (M-02) | replays the voice, holds the picture (≤ 60 s) | ends via the sign-off | advances at 20 s / 4 s after speech | valid |
| Rung −1 (answer first) | replays the name and sentence | ends via the sign-off | withdrawal at 3 s after speech | valid |
| Rung 0 | replays "And who is this?" | ends via the sign-off | descends at (spoken + 8 s) | **holds the rung** (B2) |
| Rung 1 | replays the partial cue | ends via the sign-off | descends at (spoken + 5 s) | **holds the rung** (B2) |
| Rung 2 | **commits the choice**; both dissolve to rung 3 | ends via the sign-off | descends to rung 3 at (spoken + 6 s) | **holds the rung** (B2) |
| Probe item | **commits the choice**; both dissolve to the reveal | ends via the sign-off | reveals the name at (spoken + 6 s) | holds |
| Interview (M-40) | replays the prompt | ends via the sign-off | cue at 15 s, then 21 s, then a warm close | cue at 15 s, then 21 s, then a warm close |
| Closedown (M-134) | nothing (no mat, nothing is touchable) | *(panel is gone)* | holds for ever | holds for ever |

**Read the "no touch" column top to bottom.** It is a complete, coherent, nine-minute-fifty-three-second programme that ends on a photograph of someone she loves. That is the deliverable, and §9.1 gives it as an executable table.

There is no cell in this table containing "stuck", "waiting for input", "please try again", or "are you still there?". There is no state anywhere in the product in which the screen is waiting for something the person has not realised it wants.

### 6.3 The speech gate (B2)

The rung clock advances only when **no touch and no voice activity** have occurred. Voice activity is detected on-device by an energy-and-zero-crossing VAD. **It is not ASR, it never sees words, it never determines correctness, and no waveform is persisted from a demand page** — P27 and ND-26 are untouched.

- While voice activity is present, the current rung's remaining dwell is frozen.
- The clock restarts **1500 ms** after voice activity stops.
- A rung may be extended by speech to at most **3×** its base dwell, then descends regardless, so a talkative person is never held indefinitely on a demand page.
- `rung_dwell_extended_ms` and `voice_detected_in_window` are logged per trial as features.

Dwell floors, all of the form (spoken prompt duration + a silence budget), with the spoken duration computed at 3.0 syl/s plus 800 ms of silence each side:

| Rung | Spoken | Silence budget (`standard`) | Dwell |
|---|---|---|---|
| −1 answer first | ~5.9 s | 3.0 s hold | 8.9 s + 1.2 s withdrawal |
| 0 free recall | "And who is this?" ≈ 3.0 s | **8.0 s** | **11.0 s** |
| 1 partial cue | "Marg…" ≈ 1.9 s | 5.0 s | 6.9 s |
| 2 two-choice | question + instruction ≈ 6.3 s | 6.0 s | 12.3 s |
| 3 familiarity | ~5.9 s | 4.0 s hold | 9.9 s |

**Every one of these numbers is invented.** No dose-response or waiting-tolerance curve exists for this population anywhere in the corpus. `rungDwellStep` is a caregiver-set enrolment parameter (`short` / `standard` / `long`), frozen thereafter (P10, implication 53), and logged. Measuring it is the pilot's first job on this surface, using the same discipline HCI Open Question 1 prescribes for target size.

### 6.4 What is animated, and for exactly how long

| Event | Duration | Property | Never |
|---|---|---|---|
| Any change of what is on screen | **600 ms** | opacity | translate, scale, rotate, parallax |
| Caption clearing after the answer-first beat | **1200 ms** | opacity of the whole block, not of glyphs | per-glyph fade |
| Touch acknowledgement | in **100 ms**, holds **200 ms**, releases **200 ms** | `bone` → `boneTouched` on the mat border | any geometry change |
| Demonstration (B5) | rise 300 / hold 600 / fall 300, gap 400, other mat, then a 4000 ms loop | the same `bone` → `boneTouched` | figurative content, translation, travel |

**Never animated, ever, anywhere:** the opacity of text; the size or position of a photograph; the luminance of a photograph; the caption strip's origin; the picture zone's bounds; the stop panel; anything at all in the closedown state.

### 6.5 Text is never ramped

Every glyph is at full ink from the frame it appears in. Companion-voice's rung-1 mechanism ramped ink from 6 % to 100 % over 3000 ms; computed, that composite is **1.13 : 1 at 6 %, 1.70 : 1 at 25 %, 3.29 : 1 at 50 %**, and does not cross the 7 : 1 AAA floor until roughly 74 % opacity — about t = 2.2 s of a 3.0 s ramp. A mandated cue rung delivered sub-AAA for three quarters of its duration, to a population whose contrast sensitivity is worst exactly where letterforms live, is not a cue. When a caption changes, the *whole block* cross-dissolves at 600 ms; individual glyphs never fade.

### 6.6 Input handling

- **Single tap only.** No swipe, long-press, pinch, rotate, drag, double-tap, dwell-to-select, or multi-tap gesture of any count. There is no hidden gesture anywhere in the product.
- **Touch-DOWN commits.** Touch-up need not land inside — essential tremor (~4.6 % of 65+) is kinetic and degrades exactly the accurate terminal movement a touch-up requirement tests.
- **First pointer wins**; all subsequent pointers are discarded while one is down.
- **Micro-movement ignored.** There is no drag threshold to cross.
- **400 ms input lockout** after any committing touch. A touch swallowed by the lockout still receives the visual acknowledgement, so the hand is never told it did nothing.
- **Held-pointer state (fixed here, undefined in all three directions):** while any pointer remains down, the acknowledgement **persists** — the mat border stays at `boneTouched`. The page's own advance timer continues regardless, so a held finger can never stall the session. Lift-and-replace is a fresh touch-down.
- **Large-contact policy:** any contact whose major radius exceeds the OS palm-rejection threshold is accepted as a valid touch-down at its centroid. A rejected palm is a broken screen as far as she is concerned, and heel-of-hand contact from someone steadying herself is the modal input error in this cohort.
- **No `prefers-reduced-motion` toggle on the patient surface** and no theme control: P10 freezes the surface, so a user-facing appearance switch is a mid-study UI change with a switch on it. There is nothing to reduce — opacity cross-dissolves produce no optic flow.

---

## 7. COPY RULES

### 7.1 The rules

1. **Reading age 8–10** (COGA), never above lower-secondary (WCAG 3.1.5 AAA).
2. **One idea per sentence.** Active voice, present tense, concrete nouns, no metaphor, no idiom.
3. **≤ 8 words per prompt** (implication 25); ≤ 15 words per sentence (implication 24).
4. **Every spoken word is written, verbatim, at the moment it is spoken.** Never before, never after. Audio is never the sole carrier of anything (implication 37).
5. **Every written word is spoken.** Text is never the sole carrier either.
6. **The app never claims a feeling, a preference, or a fact it cannot know.** It cannot see the photograph (ND-17) and must not generate facts about her life (P19).
7. **No system vocabulary, ever** (implication 27).
8. **No praise, no evaluation, no diminutive, no pre-emptive reassurance.**
9. **The closing line of any block is identical regardless of what was produced.** A line that varies with the response is a grade.
10. **The person's own vocabulary**: "your daughter Sarah", never "Relative #2".

### 7.2 Right and wrong, on every string the product can say

| Wrong | Why | Right |
|---|---|---|
| "I love this one. What was going on here?" | The app cannot see the photograph and must not profess a feeling about it. For a person who has concluded there is somebody in the tablet, this is the sentence that settles it. *(Deviates from the frozen §4 step 7 wording — declared.)* | **"Tell me about this one."** |
| "That's a good one to keep." | Same defect: a claim about a photograph it cannot see. | **"Thank you."** |
| "I do love hearing about that." | Professed affection, and it varies in plausibility with whether she spoke. | **"Thank you."** Identical whether she spoke for two minutes or said nothing. Thanking is an act, not a claim about a photograph the app cannot see. |
| "Here is a little game. These are people from an old album. Nobody you know." | "Little" is the register adults use to children. "Nobody you know" is reassurance offered in advance of a difficulty — the oldest tell there is that you are expected to fail — and it invites the reasonable reply *how do you know who I know?* | **"Now some faces from an old album. Strangers, all of them."** |
| "Well done!" / "Nearly!" / "Good." / "Not quite." | Praise and near-miss language are evaluation. There is no correct answer to evaluate. | *(nothing — the programme says the name and continues)* |
| "Are you still there?" / "Still thinking?" | The first is an un-suppressible interruption (WCAG 2.2.4 AAA) and converts her absence into something the device noticed. The second is a comment on her performance. | *(nothing — the programme continues)* |
| "Tap the picture." / "Press to choose." | System vocabulary. Nobody instructs you to touch a television. | **"Put your finger on Margaret."** — a physical instruction in her own words, and the sentence a daughter can say down a telephone. |
| "Session complete. You got 6 of 10." | ND-5, ND-7, P1, P5. | *(nothing — the sign-off saying, then a photograph)* |
| "You haven't looked at these in five days." | ND-28, P6. | *(nothing — there is no backlog, so there is nothing to say)* |
| "Good morning, Margaret." | Time-of-day can be wrong; a name at the top is a greeting from a thing that claims to know her. | **"Here are your pictures."** |
| "It's me." | Four words asserting a known identity to a person who cannot place a voice, which she will then spend the session trying to solve. | *(never said)* |
| "Recording…" / a red dot / a microphone glyph | An icon nobody has to have learned, and a state carried by colour. | **"I'm listening."** written at 40 pt and spoken. |
| "Please reconnect this tablet." | System vocabulary, and an instruction to a person who cannot perform it — the actual recipient is a caregiver who is not in the room. | **"Nothing to look at just now."** The reconnect instruction goes to the caregiver's phone. |
| "Which one is Margaret? Are you sure?" | A confirmation is a second demand and a doubt. | **"Which one is Margaret?"** and then the programme goes on to talk about Margaret. |
| "Marg____" | Underscores at 40 pt render a fill-in-the-blank form — the visual grammar of a test paper, which Rememo's therapists rejected as clinical-assessment-like. | **"Marg — — — —"** — em-dashes read as a crossword, a thing this cohort has done every morning for sixty years. Length preserved, so it is a real cue and not an ellipsis. |

### 7.3 The complete patient-facing vocabulary

Every word the product can say. Nothing else is permitted on this surface, ever.

| Where | String |
|---|---|
| Notification | *"This morning's pictures are on now."* |
| Ident | *"Here are your pictures."* · *"I can hear you when you talk."* |
| Sayings (shipped, era + locale matched) | *"A stitch in time… saves nine."* · *"Many hands make light work."* · *"Where there's a will, there's a way."* |
| Song | *"{title}. {artist}, {year}."* |
| Answer first / rung 3 / M-02 | *"{Name}. {one sentence typed by the family}."* |
| Rung 0 | *"And who is this?"* |
| Rung 1 | *"{first k letters}…"* spoken as a sound, e.g. *"Marg…"* |
| Rung 2 and probe | *"Which one is {Name}?"* · *"Put your finger on {Name}."* |
| Probe reveal | *"{Name}."* |
| Probe intro | *"Now some faces from an old album. Strangers, all of them."* |
| Month target (M-25) | *"{sentence}"* → rung 0 is the sentence trailing off: *"Jean comes on…"* |
| Interview (M-40) | *"Tell me about this one."* · *"I'm listening."* · *"Take your time."* · *"Tell me anything at all."* · *"Thank you."* |
| Stop panel label | *"Stop for now"* |
| Stop panel tapped | *"All right. Let's stop there."* |
| Content expired | *"Nothing to look at just now."* |
| Handover first page (staff hands the tablet over) | *"{First name}"* — written only, never spoken |

**Content:** a first name, a relationship, one sentence typed by the family, a song title, an artist, a year. Nothing else. The one true sentence is composed from a fixed template over human-typed fields — no model is in the path (P19, ND-16).

### 7.4 Banned outright on the patient surface

Over and above §9: *session, card, deck, review, practice, exercise, test, quiz, score, correct, incorrect, wrong, right, try, again, next, start, begin, finish, done, complete, continue, skip, due, streak, backlog, today's, remaining, level, progress, tap, press, click, choose, select, ready, welcome, sorry, oops, well done, good, great, nearly, almost, nice, brilliant, remember, forget, memory, recall, brain, sync, queue, algorithm, error, failed, retry, loading, please wait.*

Enforced as a CI check over every string reachable from `src/ui/patient/**` and over the shipped content library.

**"Tap" never appears.** The bone colour, the size, the spoken instruction and the written instruction do the affording.

---

## 8. SCREEN SPECS

Reference: `patientLayout` in §4.1. Every screen is the same two zones and one panel. The state changes what is *on* the screen, never where the screen is.

### 8.1 Global invariants (true of every screen below)

- Ground is `#201B17`, full bleed, always, never tappable.
- The caption strip is at y 590–820, text origin x = 80, y = 620, left-aligned, ≤ 2 lines. Never tappable.
- The stop panel is at x 820–1140, y 660–790, present on **every** screen except closedown and the handover first page.
- Every change is a 600 ms cross-dissolve. Every advance and every committing touch sounds the one 180 ms tone.
- Nothing translates, scales, rotates, or parallaxes.

### 8.2 Session order

The frozen ten steps, with two declared variations.

| # | Segment | Mechanic | Zero-input dwell |
|---|---|---|---|
| 1 | The chime | runtime | — |
| 2 | **Ident** | — | 8.0 s |
| 3 | **The theme** — two sayings | M-35 | 2 × 14.2 s |
| 4 | **The music** (primed sessions) | M-56 | 30.0 s |
| 5 | **The headline** — month target, opening trial | M-25 | 37.9 s (three rungs) |
| 6 | **The people** — 6 tier-1 face cards | M-20 + M-24/M-22/M-23/M-10/M-131 | 6 × 50.2 s = 301.2 s |
| 7 | **The interval game** — the probe | M-20 / M-21 | 103.8 s (hard cap 120 s) |
| 8 | **The interview** | M-40 | 70.0 s |
| 9 | **The music** (unprimed sessions) | M-56 | 30.0 s |
| 10 | **The sign-off** — one saying | M-35 | 14.2 s |
| 11 | **Closedown** | M-134 | ∞ |

**Total, zero input: 593.5 s = 9 min 53 s.** Inside the frozen 8–10 minute budget and inside P29's ten-minute discipline.

**Variation 1 — `session_order_variant` (fixes the DLB fluctuation finding).** A per-participant enrolment setting, frozen, logged. `standard` runs the order above. `front_loaded`, the default for `fluctuation_band = high`, moves segment 6 (the Camp block) to immediately after the ident, so the graded core lands inside the lucid window rather than at minute six. It moves no element, changes no layout, no wording and no position, so it sits on the content side of the P10 / §8.5 line — the same side the M2 and M3 arms already sit on.

**Variation 2 — card count is a function of the dwell budget.** The Camp block presents **6** tier-1 cards at the `standard` dwell. At the `long` dwell it presents **5** and the session stays under ten minutes; the scheduler carries the sixth to tomorrow. `n_camp_cards_presented` is logged. This is a genuine, unavoidable conflict between the critic-mandated dwell floors, the frozen 6–10 card count and the frozen 8–10 minute budget; it is resolved in favour of the dwell floors and the session length, and it is named rather than absorbed silently.

**The M-25 filled interval.** The frozen shape asks for re-presentations at 1 m, 2 m, 4 m and 8 m *inside* a Camp block it also budgets at ~3 min. That is arithmetically impossible and all three directions inherited it. Resolved here: the month target re-presents at **30 s, 1 m, 2 m, 4 m and 8 m from its own opening trial, wherever in the session those land** — the 8 m re-presentation falls inside the probe or the interview, which are still a clinically-prescribed filled interval. Camp fidelity is preserved and the contradiction is removed. Flagged to the protocol owner.

### 8.3 Ident — 8.0 s

**Layout.** One-picture state. A photograph from her own deck, matted.
**Sequence.** t = 0.0 ground; 0.0–0.6 the photograph cross-dissolves up, strip empty; 0.6 the tone; 1.0 the strip writes and the voice says **"Here are your pictures."**; 4.0 the strip writes and the voice says **"I can hear you when you talk."** (the P23 / §8.4 disclosure, in both channels, in identical wording, every session, forever); 8.0 the programme begins.
**Tappable.** The picture zone — replays the line. The stop panel.
**No tap.** Advances at 8.0 s.
**Why an ident at all.** It is byte-identical every single time and it does the one job an ident does: *the thing you are about to watch is the thing you watched yesterday.* If she opens the app six times in a day it plays six times, from the top, with no comment — there is no "you've already done this today", because there is no *done*.

### 8.4 M-35 The saying — 14.2 s each

**Layout.** Ground. **No photograph.** The announcer speaking before the pictures start; the emptiness is what makes the first photograph land. **No bone in the picture zone**, so there is nothing there to touch, which is true.
**Sequence.** Strip writes and the voice says the stem *"A stitch in time…"* (3.3 s). Then a **5.0 s gap** in which nothing on screen changes and nothing is asked. Then, whether she has spoken or not, the strip cross-dissolves to the whole line and the voice completes it (3.9 s). Holds 2.0 s.
**Tappable.** The stop panel only.
**Microphone.** Open, features only, no waveform persisted, no ASR. This resolves the contradiction inside the frozen document, which describes M-35 both as the P25 floor sentinel ("failure to complete an overlearned proverb is a strong acute-change signal") and as having "no mic" — both cannot hold, and the sentinel is load-bearing for S7. `utterance_duration_ms` and `voiced_ratio` only.
**Purpose.** Two open, one closes. For thirty seconds at the top of every session the product demonstrates that it keeps going and that she cannot get it wrong, before it asks for anything at all.

### 8.5 M-20 the face card — the four rungs, frame by frame

One unanswered card is **50.2 s**.

#### Rung −1 — the answer, first (8.9 s + 1.2 s)

Photograph, matted, full picture zone. Strip: **`Margaret`** at 48 pt / **`Your daughter. She rings on Sundays.`** at 32 pt. Spoken in the family voice if recorded, TTS reading family-typed text otherwise. Held 3.0 s after speech ends. Then the whole caption block cross-dissolves away over **1200 ms** — slowly, so it reads as the caption clearing rather than as something being taken from her. **The photograph does not move.**

#### Rung 0 — free recall (11.0 s)

Same photograph, unchanged, same position. Strip: **`And who is this?`** Spoken once.
**No bone anywhere in the picture zone changes. Nothing on screen indicates that time is passing** — no spinner, no pulse, no dots, no countdown (WCAG 2.2.3 AAA).
Touching the picture replays the question. It does not advance and does not grade.
Descends when (no touch and no voice) for the dwell. **It always descends.** There is no branch in which it does not.

#### Rung 1 — partial cue (6.9 s)

No new screen. The photograph is untouched. Only the caption cross-dissolves:

```
  Marg — — — —
```

`name.slice(0, k)` followed by one em-dash per remaining letter, **all in `caption` at 14.18 : 1**, in the name's own size and weight. Length preserved. The voice says *"Marg…"* and stops, at the same reduced rate as everything else.
`k` increments by one per re-presentation of the item, capped at `ceil(len/2)`; on the next success it resets to its floor with no comment and no visible event.

#### Rung 2 — two-choice, reached downward as help (12.3 s)

The frame cuts to the two-picture state (§5.2) over 600 ms with zero translation.

- **Both mats are bone, because both are touchable.**
- **The demonstration (B5) runs for the whole rung:** the left mat's border goes `bone` → `boneTouched` over 300 ms, holds 600 ms, returns over 300 ms; 400 ms gap; the right mat does the same; then a pause to a 4000 ms loop period. 12.12 % of the viewport, stationary, non-figurative, and **identical to the acknowledgement her own touch produces.**
- Strip: **`Which one is Margaret?`** / **`Put your finger on Margaret.`** Both spoken.
- **The foil (§8.5.3) is a second photograph from the same deck.** Zero new content, ever.

**On any touch — either card.** The touched mat's border acknowledges within 100 ms. Then **both photographs dissolve out together**, the tone plays, and rung 3 arrives as a fresh single-picture frame of Margaret. **There is no intermediate moment. There is no frame in which the screen shows which card she touched.** She chose, and the programme went on to talk about Margaret. Same tone, same screen shape, same sentence, either way. `correct = 0` is written to the event log in the same transaction that advances the UI: you can record a failure and never display one.

**On a touch on bare ground between the cards:** nothing. The ground is never tappable in any state.
**On no touch:** descends to rung 3. Not choosing is not failing; it is another way of asking for help, and help is what arrives.

M-10's dignity lens is verbatim: *indefensible as a standalone personal probe.* It is defensible here because it is reached **downward, as help**, and is one of four states of one card.

#### Rung 3 — familiarity exposure, no question (9.9 s)

Photograph, matted, full picture zone. Strip: **`Margaret`** / **`Your daughter. She rings on Sundays.`** Spoken.

**There is no question mark anywhere on this screen.** Rung 3 and M-02 The Narrated Album are the same screen — the bottom of the mandated cue ladder and the product's warmest zero-demand surface are one object, which is why the ladder can never bottom out into failure. It bottoms out into the nicest page in the app.

> **The ladder only ever travels one direction — downward, toward more help — and its bottom rung is a photograph of somebody she loves with their name written under it. There is no rung below that and there is nothing to fall off.**

#### 8.5.1 What is recorded

On the personal deck, **nothing is graded**. The dependent variable is `attained_rung`: *we record how much help was needed, never whether she failed.* The ladder descends on a clock gated by silence, not on a judgement. A miss adds cue support and re-presents one rung easier; it **never** shortens the interval (P2).

#### 8.5.2 `rung_ladder_variant` — one field that stops two silent scale mixes

| Value | When | `attained_rung` scale |
|---|---|---|
| `four_rung` | normal personal card | 0–3 |
| `three_rung_no_foil` | no eligible living foil in the deck, or the foil's media is not ready | 0, 1, 3 |
| `three_rung_target` | M-25 month target: a sentence has no photographic foil | 0, 1, 3 |

Logged per trial and pre-registered before B5. Without it, M4 silently mixes a 4-point and a 3-point scale.

#### 8.5.3 Foil selection — fail-closed

```
foil = first(shuffle(deck.items
        .filter(i => i.id !== target.id)
        .filter(i => i.person_status === 'living')
        .filter(i => i.person_status_revalidated_within_hours <= 48)   // §9.7
        .filter(i => i.media_ready === true)))
if (foil === undefined) → rung_ladder_variant = 'three_rung_no_foil'; skip rung 2
```

**No `person_status` filter on the foil is how a widow's dead husband becomes the wrong answer to "Which one is Margaret?" on some Tuesday in week three.** That is an ND-12 breach, an S4 breach ("zero instances… any instance is a serious incident"), and a bereavement-confrontation adverse event delivered by a spaced-repetition engine — the exact systematic mechanism P16 exists to prevent, because the memory does not consolidate and each exposure is experienced as fresh loss. Enforced by a build-time assertion and by a headless path check over the state space, because S4 is a per-path guarantee.

### 8.6 M-25 the month target — 37.9 s

Identical shell, three rungs. Photograph of Jean, matted.
- **Answer first:** strip carries the sentence *"Jean comes on Wednesdays."* Spoken. Held 3.0 s, withdrawn over 1200 ms.
- **Rung 0:** strip carries **`Jean comes on — — — — — — — — —`**; the voice says *"Jean comes on…"* and trails off. The trailing sentence **is** the ask; there is no separate question and no question mark.
- **Rung 1:** letters fill from the left, same mechanism as §8.5.
- **Rung 3:** the whole sentence, spoken.
`rung_ladder_variant = three_rung_target`.

### 8.7 The probe — hard cap 120 s

**Intro (6.0 s).** Ground, no photograph. Strip: **`Now some faces from an old album.`** / **`Strangers, all of them.`** Spoken.

**Each item (16.3 s).** The **same two-picture state** as rung 2 — same geometry, same demonstration, same instruction, same motor act, forever. Two shipped stock faces. Strip: *"Which one is Harold?"* / *"Put your finger on Harold."* Window = spoken (6.3 s) + **`rung2Silence`** (6.0 s at `standard`) = 12.3 s, or a touch. Then both dissolve together and the reveal arrives as a single matted photograph of Harold with his name, spoken, 4.0 s.

The probe uses the **rung-2** silence budget rather than the rung-0 floor, and that is deliberate: the rung-0 floor of (spoken + 8.0 s) exists to absorb hearing, parsing, retrieval **and speech initiation**, and a probe item requires none of the last. It is a rung-2-shaped trial — two pictures visible, the demonstration running, a tap the only response — so it gets the rung-2 budget, from the same token.

Using the same layout as rung 2 rather than television's face-above-two-name-plates is deliberate: two different two-target layouts would be two motor procedures, which violates implication 6's fixed grid, and name plates would put words somewhere other than the caption strip, which breaks the product's one-place-for-words rule.

**Six items fit inside the 120 s cap untouched (6 × 16.3 + 6.0 intro = 103.8 s); up to eight if she touches.** Item order is randomised so no item is systematically dropped. `probe_items_presented` logged. `item_is_probe = true`; scheduler-blind; **no family content ever**. Distress on the probe disables it for the remainder of the study, logged as an adverse event, not as missing data, and the person is never told anything happened — subsequent sessions simply do not contain a probe block.

**The seam, flagged not papered over.** §5.2 requires the probe to record "the first uncued attempt." In a tap-only product where ASR never grades, a genuinely uncued face–name recall cannot be captured, so the first attempt is a two-name **recognition** tap. That is the BRANCH shape and BRANCH is the precedent §5.2 leans on, but recognition is not recall and M3's errorless-vs-spaced-retrieval contrast is thinner on 2AFC. **This is not created by this direction — it falls out of P9 ∩ P4 ∩ P27 in any tap-only rendering of the frozen set.** It needs a protocol decision, pre-registered before B5.

### 8.8 M-40 The interview — 70.0 s

One matted photograph, personal or generic era, randomised per session (M2).
- **t = 0:** strip writes and the voice says **"Tell me about this one."** (6.0 s)
- **t = 6.0:** the strip cross-dissolves to **`I'm listening.`** at 40 pt, and stays there for as long as the microphone is open. **That is the entire listening indicator.** No microphone icon, no level meter, no pulsing ring, no countdown, no waveform. A meter turns her speech into a measured quantity in front of her (P23, ND-5); a countdown is forbidden outright (WCAG 2.2.3).
- **t = 21.0:** *"Take your time."* (4.0 s), then back to `I'm listening.`
- **t = 46.0:** *"Tell me anything at all."* (4.0 s), then back to `I'm listening.`
- **t = 65.0:** *"Thank you."* (5.0 s), then the page turns.

The cues are non-questions on purpose: Rememo's therapists rejected Who/What/Where/When formats as clinical-assessment-like. The app cannot invent anything about the photograph — it cannot see it (ND-17) and must not generate facts about her life (P19).

**The closing line is identical whether she spoke for two minutes or said nothing at all.** A closing line that varies with what was produced is a grade.

Mic records; **ASR never grades** (P27, ND-26); transcripts never reach the research plane (§8.4). The primary outcome is words spoken, not accuracy, and there is no accuracy to have.

### 8.9 Shared care-home tablets — the roster leaves the patient surface

**There is no patient-facing roster in this product.**

All three directions put six faces in front of a person with dementia and asked her to identify her own photograph among five others. Implication 5 caps a patient screen at 2–3 choices; §6.2 pushes toward single-button operation. Nothing in the corpus establishes that self-recognition from a photograph is preserved in mild-to-moderate dementia — and the frozen shape's own enrolment Gate 2, question 1 ("difficulty recognising objects or people **in photographs**") exists precisely because photograph-mediated person recognition fails in an identifiable subgroup. A wrong tap there does not mis-start a session: it opens another resident's family photographs to the wrong person, which is a confidentiality event, and it writes another person's `attained_rung` under her pseudonym, corrupting the dataset for two participants at once.

**What replaces it.**

1. **A staff handover screen** at `app/(staff)/handover`, reachable **only when Guided Access is off** — i.e. by triple-click plus the staff passcode. The patient surface has no path to it by any tap, so a resident cannot reach another resident's content by any gesture that exists. Ordinary caregiver-surface rules apply (17 pt body, 56 pt targets, real labels, surname and room number permitted because the screen is staff-facing and behind a passcode).
2. **A reversible first page.** After staff select a resident, the tablet shows that resident's nominated rest photograph, matted, with their **first name** at 48 pt in the caption strip, held **5.0 s**. Staff hand the tablet over during this page. **Any touch during those 5 seconds returns to the handover screen.** It is not a confirmation modal (nothing is asked, nothing is labelled, it renders in the product's ordinary grammar) and it is not dwell-to-select (the default outcome is proceed, not wait), so ND-31/32 and §10.3 are untouched. It gives contention a costless undo and gives a mis-selection a second chance.
3. **A staff abort.** Exiting Guided Access mid-session returns to the handover screen, writes `session_end_reason = wrong_resident`, and **quarantines** the session's trial rows rather than attributing them.
4. **`device_mode` on every interaction row**, and a pre-registered rule that shared-device personal-deck data is analysed separately, because its attribution is unverifiable by construction.
5. **S4 restated** in the protocol as "zero instances **given correct attribution**", with wrong-resident attribution named as a known, unmeasurable residual. A Tier-1 criterion that reads clean because its worst failure is invisible to it is worse than one that admits a gap.

The ergonomic cost is real: staff perform a triple-click and a passcode at each handover. A native volume-button abort would be better and is recorded as an open question (§14), not shipped on speculation.

### 8.10 The stop panel (B1)

**Geometry.** 320 × 130 pt (61.6 × 25.0 mm) at x 820–1140, y 660–790. Bone. Label **`Stop for now`** in `ink` at 40 pt, centred in the panel, 12.44 : 1. Present on every screen except closedown and the handover first page, in the same pixels, forever.

**Disclosed in three redundant channels, never by colour:**
1. **The word on the panel.** This is the HCI panel's mandatory fix to companion-voice, where the only safety control in the product was disclosed by a spoken sentence alone — audio as sole carrier of an instruction, implication 37's hard NEVER, aimed at a cohort where 55 % of adults 75+ have disabling hearing loss. A deaf 84-year-old in that design had no way out.
2. **Position and size** — fixed, isolated by 13.5–23.1 mm of dead ground.
3. **Nothing in colour.** Its bone is redundant with the bone rule, not an encoding.

**On tap.** Acknowledgement within 100 ms. The voice says **"All right. Let's stop there."** The **sign-off saying plays**, so P1 still holds, then closedown. `session_end_reason = user_ended`, `distress_signal_source = patient_control`. **No confirmation modal** — modals are unrecognised context switches for this cohort (implication 47) and stopping is harmless, so it needs no confirming.

**The declared cost.** Television's bone rule had a converse — *no bone on screen means nothing to touch* — and a permanently present bone panel weakens it. That converse is worth less than an operable P18 control, and the loss is bounded: the stop panel is 41,600 pt² in a fixed corner, while the rung-2 mats are 239,200 pt² each, centred, animated, and named in the caption strip. The trade is stated rather than absorbed.

### 8.11 Closedown — M-134, and the deletion of early closedown

After the sign-off saying, the programme does not stop. It **settles**.

- One photograph, nominated by the family at onboarding, cross-dissolves up and holds. **Its mat is `ground`, not `bone`** — the mat coming off is the visual sign that the programme has finished and there is nothing to touch. Geometry is byte-identical; only the mat's fill changes, so the photograph does not move or resize.
- The stop panel is gone. The caption strip is empty and stays empty. There is no sound. **Nothing is asked, ever again.**
- **No "Session complete." No summary. No thank-you screen. No score. No "see you tomorrow." No count of anything.**
- **The photograph does not dim.** On mains power the screen holds at full luminance indefinitely. Both companion-voice and photo-album argued — correctly — that the lit resting photograph is the product's only answer to apathy, and then dimmed it to 40 % / 60 %. A face on a warm-dark ground, through a yellowed cataractous lens, with AD contrast sensitivity depressed at every spatial frequency but the lowest, may fall below useful threshold at 40 %. Neither cited anything for the dimming; both cited plenty for why the photograph must stay visible. Off mains, the OS timeout governs, and that is a deployment fact we do not control.
- **A bundled fallback still-life ships** for this slot, so if the nominated asset is the one that failed to download, the terminal state of the session — the state the whole S3 and P28 argument rests on — is never undefined.
- The photograph is **re-nominable by the caregiver from their phone**, without touching the tablet.

Trial state at fade is captured (`attained_rung` at fade, `voice_detected`, `session_end_reason`) so *"did not know"* and *"stopped attending"* stay distinguishable — offline, by a human, never by a runtime classifier.

**Early closedown is deleted.** Television's rule — zero touches and zero voice across two consecutive complete items — is removed entirely, not softened:

- It fires hardest on the participants whose data matters most. 55 % of adults 75+ have disabling hearing loss and fewer than 1 in 3 use an aid, so a large fraction of the cohort would have been scored as not responding to a prompt they never heard; and apathy is a direct disease-caused predictor of not initiating. Sessions would be truncated preferentially for the more impaired — **differential measurement error, the identical mechanism P27 invokes to forbid ASR grading, introduced through the session controller instead of the microphone.**
- Voice-activity detection in a care-home day room registers other people's speech; §4.2 names speech-in-noise as the dominant complaint precisely because those rooms are noisy. The trigger cannot attribute speech to the participant without inference the design forbids.
- The quiet attender — a person with DLB sitting still and watching — loses the graded core, so M4 and F1 lose exactly the participants who are engaging in the way the design says is valid.
- **And it contradicts the direction's own thesis.** "Silence means the programme carries on" cannot coexist with a rule that ends the programme on silence.

**S3 does not need it.** The sign-off plays unconditionally and closedown catches every path; there is no path through the product that terminates anywhere except on a photograph she likes, so ≥99 % of sessions terminating on a success is something a headless agent can **exhaust**, not something we audit hopefully. `quiet_session` (n_taps = 0 **and** no voice activity in any window) is logged as an observation and acted upon by nobody. **`session_end_reason = timeout` never fires on this surface**, and that is an assertion in the test suite, not an accident.

### 8.12 The two screens nobody designed

**Content expired** (past `content_valid_until`, ADR §4.5). One-picture state, a **shipped still-life** photograph from the generic library — a kettle, a garden gate, a wireless set; no people, because a still life cannot be a recognition demand. Strip: **`Nothing to look at just now.`** Matted, so touching it replays the sentence. The stop panel is present. Nothing is asked. `session_end_reason = content_expired` logged as a first-class session outcome, so a sync failure is never read as non-usage attrition in the F4 curve. **The reconnect instruction goes to the caregiver's phone and to the caregiver app. The word "reconnect" never appears on the patient surface.**

**Audio unavailable.** There is no screen. The session runs, the caption channel carries everything verbatim, `audio_healthy = false` is written on the session row, and the caregiver is notified out of band. §9.6.

---

## 9. RUNTIME REQUIREMENTS THIS DESIGN GENERATES

### 9.1 The zero-input table, executable

```
warm-up/ident ........   8.0 s  timer
saying 1 .............  14.2 s  timer          (3.3 stem + 5.0 gap + 3.9 + 2.0)
saying 2 .............  14.2 s  timer
song (primed) ........  30.0 s  end of clip
month target .........  37.9 s  timer, speech-gated (3 rungs)
face card × 6 ........ 301.2 s  timer, speech-gated (50.2 s each)
probe intro ..........   6.0 s  timer
probe item × 6 .......  97.8 s  timer or touch (16.3 s each); block cap 120 s
interview ............  70.0 s  timer
song (unprimed) ...... (30.0 s at step 9 instead of step 4)
sign-off .............  14.2 s  timer
closedown ............       ∞  never
                       ───────
TOTAL, ZERO INPUT      593.5 s = 9 min 53 s
```

One unanswered face card, for reference: `8.9 (answer) + 1.2 (withdrawal) + 11.0 (rung 0) + 6.9 (rung 1) + 12.3 (rung 2) + 9.9 (rung 3) = 50.2 s`.

This table is a state-machine specification. The headless agent walks it and asserts: every path terminates in closedown; `ended_on_success = true` on every path; no path contains a state whose advance condition is a touch.

### 9.2 Nothing Today (M-135)

Deterministic trigger only — two consecutive skips, an abandoned previous session, or any distress event. **Never an inferred classifier.** Steps 5–8 are replaced by six M-02 cards (photograph, name, one sentence, spoken, nothing asked, 13.9 s each). **The song always plays** (amendment A5). Steps 2, 3, 10 and 11 are unchanged, so P11 and P1 still hold. Session length 160 s.

**In this direction the branch is invisible for free.** On a normal day the programme is a sequence of photographs with a voice over them, interrupted occasionally by a question. On a bad day it is a sequence of photographs with a voice over them. There is no announcement, no banner, no "let's take it easy today", and no visual difference of any kind — because the bad-day mode is the *same frame with the questions removed*, and the frames were never labelled. `session_mode` logged first-class. `fluctuation_band = high` triggers the floor one step earlier.

### 9.3 The chime (P8)

Mid-morning local notification, session pre-assembled on the device, hard-blocked after 16:00 without explicit caregiver override (ND-29). Copy exactly: **"This morning's pictures are on now."** No count, no streak, no "you haven't in five days", no badge on the icon. If nobody picks the tablet up, **nothing happens** — no backlog, no catch-up, no message to anyone (P6, ND-28). Sold to the family honestly as a chime, because no Expo app can wake a sleeping iPad and pretending otherwise is a lie we would get caught in.

### 9.4 Audio session and the demo-build trap

- **`AVAudioSession` category `.playback`** is a hard requirement. `.ambient` — the plausible "polite" default — plays nothing when the device silent switch is on, which would delete the entire audio channel with no visible symptom.
- **The web build is not a patient surface.** Browsers block autoplay audio without a gesture, so the artefact most stakeholders will see — including B6, which P32 makes a gate on the mechanic freeze — is the one build where this direction's autoplay property is absent. The web build therefore ships an explicit **operator-facing start affordance that exists only on web** and is compiled out of the native patient build. **B6 must run on native hardware, on a stand, in a real day room**, or B6 tests a different product from the one that ships.

### 9.5 `audio_output` — the shared-lounge fix

Caregiver-set once at enrolment, off the patient surface, frozen: `speaker | headphones | captions_only`.

In a care-home lounge with six other residents and a care assistant within earshot, the spoken cue ladder broadcasts the fact that Bet needed help naming her own sister, and how much, to the room. `captions_only` costs nothing here because **every spoken word is already captioned verbatim** — it suppresses speech and the transition tone, and the caption channel carries the entire programme. Nothing is ever marked by silence in that mode either, because nothing sounds at all.

### 9.6 Continuous audio health

A pre-session gate is not enough: a Bluetooth speaker that drops at minute four, a day-room speaker unplugged by a cleaner, or an iOS route change after a call all pass a gate and then remove the audio channel.

- Subscribe to `AVAudioSession` `routeChange` and `interruption` for the whole session.
- On route loss, fall back to the device speaker and re-run a sub-audible output confirmation.
- **The session never refuses to start and never stops.** It runs on the caption channel.
- Log `audio_route_changes`, `audio_output_confirmed_ms`, and a per-session `audio_healthy` boolean. **Audio-unhealthy sessions are excluded from S3 and from the adherence numerator**, rather than banked as successes.

### 9.7 The 48-hour freshness gate on `person_status`

The patient session issues zero network calls and the device may be offline for the full `hard_expiry_days` (default 7). A family that marks a person deceased tonight would otherwise have that face keep asking "who is this?" for up to a week.

**Rule:** any card whose `person_status` has not been revalidated within **48 hours** drops out of recognition mechanics (rungs 0/1/2, and foil eligibility) and degrades to rung 3 / M-02 familiarity exposure. It is never retired (P3, ND-8) and never disappears. `content_age_at_render_hours` is logged per interaction so the S4 audit can separate "surfaced despite a flag" from "surfaced before the flag arrived" — different incidents, different fixes, and today they are indistinguishable.

The caregiver app must say, in plain words, that a status change takes effect when the tablet next connects, must offer a "put the tablet on wifi now" step, and must surface `last_sync` age.

---

## 10. TELEMETRY THIS DESIGN GENERATES

Fields the patient surface must emit that do not exist in the frozen §7 spec, each with the finding it closes. Every one needs a named pre-registered analysis under §8.4.1 or it does not ship.

| Field | Grain | Closes |
|---|---|---|
| `tap_x`, `tap_y` normalised to the target bounding box, `target_id`, `target_bounds` | interaction | HCI Open Question 1 — the first dementia-specific target-size dataset in the literature, prescribed in one line by the brief and thrown away by all three directions |
| `rung_ladder_variant` | trial | the 4-vs-3-point `attained_rung` scale mix |
| `rung_dwell_extended_ms`, `voice_detected_in_window` | trial | B2's effect, and the waiting-tolerance distribution |
| `content_age_at_render_hours` | interaction | offline revocation window |
| `device_mode` | interaction | wrong-resident attribution |
| `audio_healthy`, `audio_route_changes`, `audio_output_confirmed_ms` | session | silent mute sessions banked as successes |
| `battery_level_start`, `battery_level_end`, `low_power_mode` | session | battery truncation vs abandonment in the F4 curve |
| `n_cards_dropped_media_not_ready`, `deck_size_at_render` | session | silent ladder degradation; `turnaround_decade` recomputed from the rendered deck |
| `n_camp_cards_presented`, `probe_items_presented` | session | dwell-budget-driven card count |
| `session_had_any_response` (n_taps > 0 **or** any voice activity) | session | S3 becoming a tautology on a session delivered to an empty chair |
| `quiet_session` | session | replaces early closedown as an observation nobody acts on |
| `perseveration_suspected`, `tap_rate` | behavioural event | deterministic struggle proxy (P18-permitted), never a classifier |
| `session_order_variant`, `rung_dwell_step`, `patient_type_step`, `audio_output` | participant | frozen enrolment parameters, so a deviation is visible |
| `ambient_lux_at_install`, `display_nits` | device | the ambient envelope |

`session_end_reason` extended per amendment A6. **`timeout` never fires on this surface.**

---

## 11. THE DEPLOYMENT ENVELOPE

### 11.1 Contrast is measured, not computed

Every contrast figure in §4.2 is a property of the emitted colours **in the dark**. LRV is by definition a property of a *reflecting* surface under room illumination, and the HCI brief grades the built-environment→screen transfer as (c), plausible-mechanism-only. Under real ambient light a near-black ground is the most reflective element on the panel in photometric terms: a day room at 300–500 lux, or a conservatory at 2000+, raises the black level far more than it raises the already-bright mat, and the claimed 72–88 point separations compress toward the ambient floor.

**The binding compliance claim is therefore measured on-device contrast at the pilot's actual deployment illuminance, not a computed reflectance figure the medium cannot produce.**

Requirements:
- Photometer measurement of `caption`-on-`ground` and `bone`-on-`ground` at each install site, at the tablet's mounted position and angle, recorded with `ambient_lux_at_install`.
- **Minimum sustained screen luminance 400 nits**, auto-brightness floored at 60 %.
- **True Tone and Night Shift MDM-forced OFF.** They shift the display white point, so the asserted ratios are not what the panel emits, and no design should quote contrast to two decimal places while the white point is user-mutable.
- **Matte anti-glare film and a stand in the pilot kit.** The stand is already required by §11.2's documented involuntary-device-dragging finding.
- **Siting rule, enforced at install by the study coordinator:** do not site the tablet facing a window.

### 11.2 One palette for the pilot, chosen before enrolment

All three directions independently chose a near-black ground (#211D19, #241F1B, #201B17) and only one named the bet. Because P10 freezes the surface per participant, if the dark ground is wrong for a given room it is wrong for that participant for twelve weeks.

**Resolution:** the palette is five tokens precisely so its polarity can be inverted in a single commit **before enrolment opens, never after.** The B6 panel runs a side-by-side day-room test — two tablets, dark leaf and light leaf, in daylight — and one palette is chosen for the pilot. Per-participant polarity is P10-legal but is a fork of the patient surface and is **not** built; it is recorded in §14 as an open question.

### 11.3 Orientation

Landscape lock stops the content rotating; it does not stop a person rotating the tablet. **The stand is a hard pilot-kit requirement**, not a recommendation, and a fixed device removes this failure entirely.

If the tablet is nonetheless held in portrait, the app renders the landscape layout unchanged and does not detect or respond. The two independent asymmetric landmarks are the **caption strip along one long edge** and the **stop panel in one corner of it** — recoverable from shape alone without reading. This is stated so it is a known behaviour rather than something discovered by a resident.

### 11.4 The DLB watch category

Three near-blacks, three separate glare-and-LRV arguments, and not one direction checked the choice against the one subtype the enrolment gate flags. Low ambient luminance and low-contrast surrounds are the classic conditions for visual misperception, and the frozen shape already names on-screen faces as carrying unexamined hallucination risk.

**Actions:** the dark ground is added to the B6 panel agenda and to the adverse-event register as a named watch category joined to `fluctuation_band`. This is also the reason the demonstration is non-figurative (B5) and the reason no photographic hand appears anywhere in the product.

### 11.5 Power

- **MDM-enforced:** Low Power Mode disabled, auto-lock never, Guided Access on, the app foregrounded. On a shared trolley the tablet returns to mains between residents; this is written into the care-home protocol.
- **`expo-battery` is a required manifest addition (A7).** Below **25 %**, the session brings itself to its normal end at the next zero-demand boundary via the unconditional sign-off, so the person gets P1's guaranteed success instead of an OS modal mid-demand. `session_end_reason = battery_truncated`.
- **Stated plainly:** at 20 % and 10 % iOS displays a Low Battery alert. It is a system modal, **Guided Access does not suppress it**, and we cannot suppress it either. The mitigation is deployment, not code. Saying so is better than silence.

---

## 12. ACCESSIBILITY ASSERTIONS — THE CONFORMANCE SUITE

Every assertion below has an exact number and can be executed. The patient surface runs in the browser build at a **1180 × 820 CSS px** viewport (react-native-web maps pt to px 1:1), so `getBoundingClientRect()` returns the pt figures in §5 directly. Assertions marked **[manual]** cannot be automated and are install-time checks with a recorded result.

### 12.1 The test-id contract — the whole patient surface

```ts
// src/contract/testids.ts
export const patient = {
  ground:      'patient.ground',
  picture:     'patient.picture',        // control
  matSingle:   'patient.mat.single',
  cardLeft:    'patient.card.left',      // control
  cardRight:   'patient.card.right',     // control
  captionLine1:'patient.caption.1',
  captionLine2:'patient.caption.2',
  stop:        'patient.stop',           // control
} as const;
```

**A1. There are exactly four patient controls, ever.**
`queryAllByTestId(/^patient\./).filter(isPressable).length <= 4`, and the set of pressable test-ids is always a subset of `{picture, card.left, card.right, stop}`. Any other pressable node on the patient surface fails the build.

### 12.2 Touch targets — the ADR's ≥88 pt assertion, in full

For every pressable node: `rect.width >= 88 && rect.height >= 88`.

| Test-id | State | Expected rect (px) | Physical | ADR floor margin |
|---|---|---|---|---|
| `patient.picture` | one-picture states | `x=0, y=0, w=1180, h=590` | 227.0 × 113.5 mm | 13.4× / 6.7× |
| `patient.card.left` | two-picture states | `x=80, y=20, w=460, h=520` | 88.5 × 100.0 mm | 5.2× / 5.9× |
| `patient.card.right` | two-picture states | `x=640, y=20, w=460, h=520` | 88.5 × 100.0 mm | 5.2× / 5.9× |
| `patient.stop` | all except closedown, handover first page | `x=820, y=660, w=320, h=130` | 61.6 × 25.0 mm | 3.6× / 1.5× |

**A2.** Every rect above matches **exactly**, in every state in which it is present (tolerance 0 px — these are constants, not layout results).
**A3.** `patient.ground` is never pressable, in any state: `pointerEvents === 'none'`.
**A4.** `patient.picture` is not pressable in the two-picture state, and `card.left`/`card.right` do not exist in the one-picture state. Exactly one of the two states is mounted at any time.
**A5.** Dead space, computed from the rects:
 - `card.right.x - (card.left.x + card.left.width) === 100` (19.2 mm, requirement ≥ 8 mm)
 - `stop.y - (picture.y + picture.height) === 70` (13.5 mm)
 - `stop.y - (card.left.y + card.left.height) === 120` (23.1 mm)
**A6.** Target centres: `card.left` centre x = 310 and `card.right` centre x = 870, both within `[295, 885]`; both centres y = 280, within `[205, 615]`.
**A7.** `patient.stop` centre is `(980, 725)` — deliberately outside the central 50 %. The test asserts the **declared departure** (amendment A4) rather than the rule: `stop.width * MM_PER_PT >= 23` (61.6 mm ≥ 23 mm, the outer-25 % requirement).

### 12.3 Contrast and colour

Computed from `getComputedStyle` on rendered nodes, run through the WCAG 2.x relative-luminance formula. Tolerance ±0.05.

**A8.** Caption text on ground: **14.18 : 1** ≥ 7.0.
**A9.** Stop-panel label on the panel: **12.44 : 1** ≥ 7.0.
**A10.** Stop-panel label on the touched panel: **14.95 : 1** ≥ 7.0.
**A11.** **The lowest text contrast ratio found anywhere in the patient tree is ≥ 7.0.** The suite walks every text node in every state and takes the minimum; the expected minimum is **12.44**.
**A12.** Surface separation `bone` vs `ground` = **72.0** relative-luminance points ≥ 30 (DSDC/BS 8300 large-surface rule; 40+ described as excellent).
**A13.** The set of distinct colour values in `getComputedStyle` across the whole patient tree, excluding photograph pixels, is **exactly** `{#201B17, #E8DDCB, #FCF1DF, #F2E9DA, #221D18}` — five values, no sixth.
**A14.** No colour value in the patient tree has a blue channel exceeding its red channel (`b <= r` for every token) — a crude but exact machine check that no blue/green/violet encoding has crept in, given lens yellowing.
**A15.** Pure white `#FFFFFF` appears nowhere.
**A16.** No text node uses `boneTouched` or `bone` as a foreground colour; `caption` never appears on `bone`.

### 12.4 Type

**A17.** Every text node's `fontSize` ∈ `{32, 36, 40, 48}` at step `md`; ∈ `{32, 36, 40}` at `sm`; ∈ `{40, 52, 64}` at `lg`. **Nothing below 32 anywhere, at any step.**
**A18.** Every text node's `fontFamily === 'SourceSans3-SemiBold'` and `fontWeight === '600'`. No second family, no second weight.
**A19.** Every text node's `lineHeight / fontSize === 1.5` and `textAlign === 'left'`. `textAlign: center` and `justify` appear nowhere.
**A20.** Every caption text node's `rect.x === 80` — **the first word is always in the same physical pixels, in every state, at every step.**
**A21.** Caption block never exceeds 2 rendered lines and never exceeds y = 820: at step `lg`, block top y = 620, height ≤ 156, bottom ≤ 776.
**A22.** `document.documentElement.scrollWidth === 1180` in every state at every type step — **no horizontal scroll at 200 % of the type floor** (WCAG 1.4.4, partial per A2).
**A23.** No text is rendered inside an `<img>`, a `background-image`, or a canvas (WCAG 1.4.9): every string in the patient tree is a live text node.

### 12.5 Chrome, icons, motion

**A24.** Zero `<svg>`, zero `<canvas>`, zero icon-font glyph (codepoint ≥ U+E000), zero `mask-image`, zero `background-image` other than the photograph nodes, in the entire patient tree.
**A25.** A lint rule over `src/ui/patient/**`: the only React Native primitives importable are `View`, `Image`, `Text` and `Pressable`. No icon component exists to import. Enforced in `eslint.config.js` as a `no-restricted-imports` group, in CI, where an agent under deadline pressure cannot quietly undo it.
**A26.** No node has a `transform` containing `translate`, `scale`, `rotate`, `matrix`, `skew` or `perspective`, in any state, at any animation frame.
**A27.** Every `transitionDuration` / animation duration on the patient surface ∈ `{100, 200, 300, 600, 1200, 4000}` ms. **None is below 300 ms except the touch acknowledgement**, which is a state change required within 100 ms by implication 35 and is asserted separately as `ackIn <= 100`.
**A28.** No node has `overflow: scroll | auto`. `scrollHeight === clientHeight` on every container.
**A29.** No `role="dialog"`, no `aria-modal`, no portal, no overlay host, no `position: fixed` node other than the four controls and two zones.
**A30.** No countdown, progress, spinner or timer node exists: zero nodes whose text content matches `/\d+\s*(of|\/)\s*\d+/`, zero `role="progressbar"`, zero `role="timer"`.
**A31.** The demonstration's animated area at rung 2 = `2 × (460×520 − 396×456) = 117,248 px²` = **12.12 %** of the 967,600 px² viewport, `< 20 %` (implication 43).
**A32.** No photograph node's `opacity`, `filter`, `width` or `height` ever changes after mount. Only `bone` surfaces change luminance.

### 12.6 Copy

**A33.** Every string reachable from `src/ui/patient/**` and every string in the shipped content library is checked against the §7.4 banned list, case-insensitively, on word boundaries. Zero matches.
**A34.** Every patient-facing prompt is ≤ 8 words; every patient-facing sentence is ≤ 15 words.
**A35.** The set of distinct patient-facing strings, after template substitution is stubbed out, equals the §7.3 table exactly — **no string can reach the patient surface that is not in that table.**
**A36.** Zero `?` characters appear in any rung-3, M-02, closedown or sign-off state.
**A37.** Zero `!` characters appear anywhere on the patient surface.

### 12.7 Behaviour

**A38. The zero-input walk.** A headless agent walks §9.1 with no input. Assertions: the walk terminates in `closedown`; total elapsed = **593.5 s ± 0.5 s** at `rungDwellStep = standard`; `ended_on_success === true`; `n_taps === 0`; `session_end_reason === 'completed'`; **no state in the walk has a touch as its only advance condition.**
**A39. Exhaustion.** Over the full state space — every `session_mode`, every `session_order_variant`, every `rung_ladder_variant`, every `audio_output`, stop-panel tap at every state, battery truncation at every state — **every terminal state is `closedown` and `ended_on_success === true` on 100 % of paths.** S3's ≥99 % is thereby exhausted, not audited hopefully.
**A40. `timeout` is unreachable.** No path in the state space produces `session_end_reason === 'timeout'`.
**A41. Foil safety (S4).** For every deck fixture, every generated rung-2 trial: `foil.person_status === 'living'` **and** `foil.person_status_revalidated_within_hours <= 48` **and** `foil.media_ready === true`. Where no such foil exists, `rung_ladder_variant === 'three_rung_no_foil'` and no two-picture state is mounted. Asserted as a build-time invariant *and* walked in the exhaustion suite, because S4 is a per-path guarantee.
**A42. The wrong tap is invisible.** At rung 2, for both possible touches, the sequence of rendered frames is byte-identical from the acknowledgement onward: both mats dissolve together, the same tone plays, the same single-picture rung-3 frame arrives with the same caption. Asserted by frame hashing. **There is no frame in which the screen shows which card was touched.**
**A43. The speech gate.** With synthetic voice activity injected at t = 3.0 s for 4.0 s, the rung-0 dwell completes at `11.0 + 4.0 + 1.5 = 16.5 s`, not 11.0 s; and with continuous voice activity the rung descends at `11.0 × 3.0 = 33.0 s` (the extension cap), never later.
**A44. A touch never grades.** For every state, a touch on `patient.picture` leaves `attained_rung`, `correct` and `hint_level_reached` unchanged, and advances no rung. Only `n_taps`, `tap_x`, `tap_y` and the replay timer change.
**A45. The held pointer.** With `pointerdown` held for 10 s: the acknowledgement style persists for the full 10 s; the page's advance timer still fires on schedule; a `pointerup` followed by a new `pointerdown` produces a fresh acknowledgement.
**A46. Lockout.** A second `pointerdown` within 400 ms of a committing touch changes no state, and still receives the visual acknowledgement.
**A47. Multi-touch.** Two simultaneous `pointerdown` events on `card.left` and `card.right` commit exactly one choice — the first pointer — and the second is discarded.
**A48. Geometry invariance.** Across every state in the walk, `patient.captionText.x === 80`, `captionStrip` rect is constant, `pictureZone` rect is constant, and `stop` rect is constant. **A single diff of these four rects across all states must be empty.** This is the machine check that makes P10 and the procedural-position requirement hold by construction rather than by discipline.

### 12.8 Install-time checks that cannot be automated

**A49 [manual].** Photometer reading of `caption`-on-`ground` and `bone`-on-`ground` at the tablet's mounted position and angle, recorded with `ambient_lux_at_install`. This — not the computed figure in §4.2 — is the binding contrast claim (§11.1).
**A50 [manual].** True Tone off, Night Shift off, Low Power Mode disabled, auto-lock never, Guided Access on, sustained luminance ≥ 400 nits, auto-brightness floored at 60 %.
**A51 [manual].** Stand fitted; matte anti-glare film fitted; tablet not facing a window.
**A52 [manual].** Audio route confirmed at the device with the sub-audible tone; `audio_output` mode matches the room.

---

## 13. WHAT THIS SYSTEM IS STILL BAD AT

Stated so it is falsifiable rather than defended.

1. **A1 is a designer explaining why a safety rule does not apply to his design.** It is narrow, written, and independently forced by three parts of the frozen shape, and it is still the load-bearing risk of this document.
2. **It is optimised for the person who does nothing, and it may condescend to the person who can still do a great deal.** A brisk 71-year-old three months post-diagnosis may find a thing that answers its own questions quietly humiliating. B2 helps — it will not answer over her while she is speaking — but the ladder still descends on a clock. `rungDwellStep` is the only lever, and a caregiver setting a patient's pace is its own dignity problem. **If B6 finds this, the direction is wrong for a meaningful slice of the enrolled population and there is no patch.**
3. **Making silence valid makes silence unmeasurable.** We cannot distinguish *attending happily* from *asleep* from *left the room* without the classifier P18 and EU AI Act Art. 5(1)(f) forbid. `session_had_any_response` narrows it; it does not close it. The trade is only worth it if apathy really is the binding constraint on F2, which §12.1 of the frozen shape admits it cannot prove — so I have optimised for the same unproven variable the product director flagged as his own biggest uncertainty.
4. **The metaphor is cohort-specific and will drift.** Born 1935: the wireless, then a set in their twenties. Born 1955: colour and a remote. Enrolling in 2036: a video recorder, and a closedown reads as nothing. The direction rests only on the structural properties — *it plays, it continues, touch is optional, it ends* — and never on the aesthetics. §8.11 is where I came closest to crossing that line.
5. **The probe seam.** Recognition, not recall. Not created here; it falls out of P9 ∩ P4 ∩ P27. M3 is one of only two mechanism contributions the pilot has.
6. **Captions everywhere are an untested bet and P10 means we cannot test it.** HCI Open Question 6 asks directly whether transcribing a relative's voice helps or hurts and answers *untested*. Chosen always-on on the strength of the 55 % prevalence figure and the never-audio-alone rule. If it is wrong we learn it from B6 or not at all.
7. **B5 is untested.** No evidence exists that a brightening rectangle teaches "this responds to touch" to a person with dementia. It is implication 43's permitted exception, executed to spec, and it avoids the DLB hazard the photographic hand carries — but the acquisition claim is a design inference, and it is the second thing I would put in front of B6.
8. **The staff handover costs a triple-click and a passcode at every changeover**, which is friction on the people already carrying the most, and friction on staff is how care-home deployments quietly stop happening.
9. **Six residents per tablet is still a hard ceiling**, now imposed by the staff screen rather than by the patient surface — a twenty-bed home needs four tablets. That is a procurement conversation this system creates.

## 14. OPEN QUESTIONS FOR THE PROTOCOL OWNER AND B6

1. **The probe seam** — does the protocol accept 2AFC recognition as "the first uncued attempt", and is M3's contrast re-specified as *name-before-choice vs choice-then-name*? Must be pre-registered before B5.
2. **The M-25 filled interval** — is the §8.2 resolution (re-presentations run on their own clock across the whole session, not inside a 3-minute block) accepted?
3. **The dwell floors** — every number in §6.3 is invented. B6 should watch whether 11.0 s reads as patient or as awkward.
4. **Dark leaf or light leaf** — two tablets, side by side, in a real day room, in daylight (§11.2).
5. **Does B5 teach anything?** Show a rung-2 screen and say nothing. Does anyone put a finger on a picture?
6. **Does `Marg — — — —` read as a crossword or as a broken word?**
7. **Does the withdrawal at rung −1 read as the caption settling, or as something being taken away?**
8. **Per-participant palette polarity** — P10-legal, not built. Does the trial want it?
9. **A native volume-button staff abort** instead of the Guided Access triple-click (§8.9).
10. **`audio_output = captions_only`** — does a care home actually want a silent tablet, or does the voice do work we lose?
