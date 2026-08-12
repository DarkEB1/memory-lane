# 00 — V1 PRODUCT SHAPE (FROZEN)

**Status:** Frozen by the product director, 2026-08-12. Binding on all downstream build, data, protocol and copy work.
**Governed by:** `docs/research/00-SYNTHESIS.md`. Where this document and the synthesis conflict, the synthesis wins — except at the two points marked **AMENDMENT**, where I am explicitly overruling the synthesis, saying so, and owning it.
**Provisional on:** B6 (PPI panel). P32 says the mechanic freeze is not mine to make alone. This is the freeze I bring to that panel, not the freeze that survives it.

---

## 1. THE PRODUCT, IN ONE SENTENCE

> **A ten-minute daily activity you do with your own family photographs — it plays you a song from your twenties, shows you the people you love and says who they are, asks you to tell it about one picture, and quietly practises the handful of names and the one sentence that matter most this month.**

Marketed as a shared activity and nothing more. Every claim in §2.2 of the synthesis is banned from every surface. The compliant sales page is the one used in the pilot (C2).

---

## 2. THE FROZEN SET

### 2.1 Six patient-facing mechanics

| # | ID | Name | What the patient does | Content it consumes | Share of session |
|---|---|---|---|---|---|
| 1 | **M-35** | Complete the Saying | Hears half a proverb, finishes it, the app finishes it with her either way | **Nothing.** Shipped generic library, era + locale matched | ~65 s (opener + closer) |
| 2 | **M-56** | Your Song | 30 s of a song from her late teens. Sings, taps, weeps, or nothing | **Nothing** (birth year) | 30 s |
| 3 | **M-02** | The Narrated Album | One photo, whole screen tappable, a voice says who it is and one true thing about them | Deck photo + name + relationship + one sentence | ~60 s, plus it is the fallback for everything |
| 4 | **M-20** | The Answer First *(personal)* | Name shown and spoken, withdrawn, "and who is this?" — help arrives before failure lands | Same deck. **Zero marginal content** | ~3 min |
| 5 | **M-20 / M-21** | The generic probe (§5.2) | Same shell, stock faces, framed as a small game | **Nothing.** Shipped stock faces | ≤2 min, ≤8 items |
| 6 | **M-40** | Tell Me About This One | One photo, "what was going on here?", then the app is quiet and listens | Same deck photo, **or a generic era photo** | ~2 min |

**Six. That is the whole patient-facing surface.** Every other survivor below is runtime with no interaction shape of its own and no content ask.

### 2.2 The runtime (mandatory, invisible, zero content ask, NOT mechanics)

| ID | Role | Why it is not a mechanic |
|---|---|---|
| **M-24** | The Camp engine — 6–10 tier-1 items in rotation, within-session seconds→minutes, across-session hours→days | Scheduler requirement 1. A queue and a timer. The patient meets M-20's card, not this. |
| **M-25** | The one month-target running full published Camp fidelity (30 s / 1 m / 2 m / 4 m / 8 m, then across days) | A `target_count = 1` configuration of the same engine with its own dedicated schedule. Kept distinct from M-24 per the catalogue's "Deliberately not merged" — target count is the active ingredient — but it is a schedule, not a screen. |
| **M-22** | The four-rung cue ladder (P2, scheduler requirement 4) | **Rungs are DERIVED, not authored.** See §2.3. This is the single most important decision in this document. |
| **M-23** | Rung 1: partial name mask (`name.slice(0,k)`), fade slowly, restore silently | A substring function driven by a per-item integer. |
| **M-10** | Rung 2: two large photos, reached *downward as help*, never as a cold probe | The dignity lens is explicit: indefensible as a standalone personal probe. As help, it is one of four states of one card. |
| **M-131** | Era-ordered session sequencing from the reminiscence bump forward, turning around before the lost decades | A sequencing policy over `era_decade`. No UI. `turnaround_decade` logged as a first-class variable. |
| **M-134** | Fade To Rest — demand withdraws, screen settles on a nominated photo | An inactivity timeout. Makes S3 (≥99% ended on success) achievable rather than aspirational, and makes the app safe to leave running (P28 implemented, not asserted). Trial state at fade is captured. |
| **M-135** | Nothing Today — six high-salience M-02 cards, all demand suppressed, no announcement | One enum in the session planner. **Deterministic trigger only** (2 consecutive skips / previous-session abandonment / any distress event) — never an inferred classifier (P18, ND-15). `session_mode` logged first-class or it is the largest generator of non-random missingness in the design. |
| **M-137** | **Undifferentiated half only.** One non-negative transition sound, identical regardless of outcome | Two discriminable sounds are a per-trial correctness signal the patient learns to read — ND-5 by the back door. The defensible clause is *nothing is ever marked by silence*. |
| **M-27** | The item **schema**, not a screen: photo + name + relationship + one sentence | P12 literally specifies this. It is the deck record every other mechanic consumes. |
| **P8** | Mid-morning local notification, session pre-loaded | A line in the notification scheduler. **Not M-136**: its catalogued 16:00 breaches ND-29, and no Expo app can wake a sleeping tablet. Sold honestly as a chime. |

### 2.3 The cue ladder is derived, and this is what makes the product affordable

P2 mandates four rungs. The burden lens priced authored rungs at ~30 written fragments — "well over the P29 ten-minute budget" — and that single cost was going to break onboarding.

**It is avoidable. Cut every rung from material the deck already contains:**

| Rung | What the patient sees | Where it comes from | New content |
|---|---|---|---|
| 0 | "And who is this?" | The card itself | — |
| 1 | `Marg____` | `name.slice(0,k)` — **M-23** | **zero** |
| 2 | Two large photos, "which one is Margaret?" | A second deck photo as the foil — **M-10**, reached downward | **zero** |
| 3 | Name shown and spoken, one true sentence, no question | The M-27 schema — **M-02** | **zero** |

Three separately-ranked "mechanics" collapse into four states of one card, the ladder costs the family nothing, and P2 becomes affordable instead of aspirational. **Ship them as three mechanics and you have shipped the same card three times and charged an exhausted person for it.**

### 2.4 Variety comes from rendering, not from content

One photograph of Margaret — one upload, one typed name, three taps — appears as **six different experiences**:

1. An M-02 narrated card (zero demand)
2. An M-24 Camp target (graded, answer-first)
3. A masked name, `Marg____` (M-23, rung 1)
4. A two-photo choice offered as help (M-10, rung 2)
5. An M-40 narration prompt ("what was going on here?")
6. A bad-day card in Nothing Today mode (M-135)

**Six renderings, one content ask.** That is the whole variety strategy and it costs the caregiver nothing. Rai 2021's iCST participants "exhausted the content faster than expected" — the *content*, not the shells. The fix is more photographs, which families already own thousands of, not more mechanics, which cost onboarding time and state space.

The music asset is the second instance of the principle: **one 30-second clip, two placements** — before the personal block (context-reinstatement primed, = M-58) or after it (unprimed control), randomised per session. Same asset, two experiences, one crossed factor, zero build.

---

## 3. THE DAY-1 CONTENT ASK — THE NUMBER

> **Eleven things: three profile answers and eight photographs.**

| What | How many | How it is entered |
|---|---|---|
| Birth year | 1 | Picker |
| Where they grew up (town/region) | 1 | One line |
| First language | 1 | Picker |
| Photographs | 8 | Camera roll or phone capture |
| — who it is | per photo | Typed. **The only typing in onboarding.** |
| — relationship | per photo | Picker |
| — roughly which decade | per photo | Picker |
| — living / deceased / estranged / do-not-show | per photo | Picker, **mandatory, cannot be skipped** (P16) |
| Era and theme blocklist (war, bereavement, displacement, institutional care) | 1 screen | Tick-boxes (P17) |

**Median target 9 minutes. Hard ceiling 10 (F3). Instrumented, not estimated.**

**The app runs a complete session from four photographs and a birth year.** Below that it runs a complete session from the birth year alone — M-35, M-56 and the probe all ship in the app bundle and work on an empty deck in hour one and at week 52 for the 22% of families who will deliver nothing (F2, iCST's number).

### Ongoing ask

> **One sentence a month.** The M-25 target — "Jean comes on Wednesdays". Reviewed monthly, because a sentence that has stopped being true is a rehearsed false comfort.

That is the entire recurring obligation. F6 caps authoring at ≤5 min/week; we are at roughly one minute a month. The headroom is deliberate — every previous trial that increased carer load increased carer harm (§1.8), and this is the one axis where we can be extravagantly generous.

### Everything optional

Recorded voice captions are **optional**. The one sentence per person is read by TTS from family-typed text by default (this is not AI-generated content under P19 — the app reads what a human wrote). A family that records nothing has a fully working product. A family that records everything has a warmer one. **No mechanic degrades to broken when the family goes quiet.**

### Zero caregiver input on the day

Nothing above is a daily action. The chime fires mid-morning; if nobody picks the tablet up, nothing happens — no backlog, no catch-up, no counter, no message (P6, ND-28). The session assembles itself from the deck and the shipped library. **The carer's presence is an enhancement and never a prerequisite (P28).**

---

## 4. THE SESSION — NUMBERED WALKTHROUGH

Total 8–10 minutes. Every step runs with nobody else in the room.

| # | Step | Mechanic | Time | Notes |
|---|---|---|---|---|
| **1** | **The chime.** Mid-morning local notification (P8), session already loaded. Hard-blocked after 16:00 without explicit caregiver override (ND-29). | runtime | 0 s | Sold as a chime, not a self-waking screen. If ignored: nothing. |
| **2** | **Opener — two sayings.** "A stitch in time…" Generic, overlearned, era and locale matched, zero personal stakes, near-certain success. Establishes the vocal channel before any demand lands. | **M-35** | ~45 s | P11's mandated generic opener. Also the P25 floor sentinel: failure to complete an overlearned proverb is a strong acute-change signal. |
| **3** | **The song.** 30 s from her late teens, decade-matched from birth year. Zero demand — singing, tapping, weeping and silence are all valid responses. | **M-56** | 30 s | On randomly-assigned *primed* sessions this plays here (= M-58). On *unprimed* sessions it plays at step 8 instead. `prime_condition` logged. |
| **4** | **The month-target, opening trial.** The one sentence that matters: shown and spoken first, withdrawn, then asked back at 30 s. | **M-25** | ~20 s | Camp trial 1 at full published fidelity. If no sentence has been authored, this slot is simply absent. |
| **5** | **The Camp block.** 6–10 tier-1 face cards, era-ordered from the reminiscence bump forward and turning around invisibly before the lost decades. Each card is answer-first: the name appears and is spoken, then withdraws. Any miss adds cue support and re-presents one rung easier — **never a shorter interval** (P2, §6.4). The month-target re-presents at 1 m, 2 m, 4 m, 8 m *inside* this block: the deck cards are the clinically prescribed filled interval (§6.8). | **M-20** + M-24 + M-25 + M-22/M-23/M-10 + M-131 | ~3 min | On the personal deck we record **how much help was needed**, never whether she failed. `attained_rung` is the dependent variable. |
| **6** | **The probe.** ≤8 generic stock faces, ≤2 minutes, framed in patient copy as a small game, never as a test. Scheduler-blind (`item_is_probe = true`). **The only place in the product where a real uncued failure is recorded** — first uncued attempt logged, then cue support added until she succeeds. No family content ever appears here. | **M-20** (errorless arm) or **M-21** (recall-first arm) | ≤2 min | Arm assigned **per participant, frozen at enrolment** — this is M3. Any distress event disables the probe for the remainder of the study and is logged as an adverse event, not as missing data (§5.2.5). |
| **7** | **Tell me about this one.** One large photograph. "I love this one — what was going on here?" Then the app goes quiet and listens for as long as she wants. No correct answer exists. After 15 s of silence it cues without comment; it always ends warmly regardless of what was produced. | **M-40** | ~2 min | Photo is **personal or generic era**, randomised per session — this is M2, whose primary outcome is words spoken, not accuracy. Mic records; **ASR never grades** (P27, ND-26). |
| **8** | **The song** (unprimed sessions only). | **M-56** | 30 s | Control placement. |
| **9** | **Closer — one saying.** Generic, overlearned, guaranteed success. `ended_on_success = true`. | **M-35** | ~20 s | P11's mandated generic closer *and* P1's held guaranteed-success item, played unconditionally, not only after a miss. |
| **10** | **Fade to rest.** Demand withdraws, the pictures keep going, the screen settles on a nominated photograph and nothing more is ever asked. | **M-134** | ∞ | Makes the device safe to put down and walk away from. Trial state at fade is captured so "did not know" and "stopped attending" stay distinguishable. |

### The invisible branch

If the deterministic trigger fires — **two consecutive skips, an abandoned previous session, or any distress event** — steps 4 through 8 are replaced by six high-salience M-02 cards, names spoken, nothing asked, **with no announcement of any kind** (M-135). Steps 2, 9 and 10 are unchanged, so P11 and P1 still hold. `session_mode` is logged as a first-class variable.

She is never told she is having a bad day. Misfiring toward gentleness is the safe direction and we accept it.

### Compliance check against the brief's binding rules

| Rule | Where it is satisfied |
|---|---|
| Nothing from §9 NEVER DO appears | Audited item by item in §7 below |
| Session runs with **zero** caregiver input on the day | Every step draws on the one-time deck or the shipped library |
| Day-1 content completable in one sitting | 11 things, median 9 min, hard cap 10 (F3) |
| Session ends on a success (P1) | Step 9 is generic and near-ceiling; step 10 catches disengagement; S3 audited from telemetry |
| Probe is the only recorded uncued failure, ≤8 items, ≤2 min, no family content | Step 6; personal deck is answer-first with immediate rescue and records support level, not failure |
| Variety from re-rendering the same content | §2.4 — six renderings per photograph, one content ask |

---

## 5. WHY SIX, AND NOT FIVE

The brief requires that if more than six patient-facing mechanics survive, each must earn its place against every other. Six survive. Here is each one killed and the consequence:

| Delete | What breaks |
|---|---|
| **M-35** | P11 mandates a generic opener **and** closer; P1 mandates a held guaranteed-success closer; P25 needs a floor sentinel; M2 needs a generic arm. It is the only mechanic with a literally zero content ask, and the only thing that works in hour one on an empty deck and at week 52 for a family that has gone silent. Nothing else in the set covers any of these. |
| **M-56** | P15 makes music a first-class content type "from v1" on the strongest content evidence outside spaced retrieval (a). It is the only non-visual channel — the only thing that still works for anyone the P26 gate mis-sorts or whose sight fails. It costs the family a birth year. **This is the weakest of the six and I say so: it is required by no success criterion, its research yield alone is 3, and it is the first to drop if the count must fall to five or if music licensing does not close before build start.** |
| **M-02** | It is the only zero-demand personal surface, it is what M-134 fades into, it is what M-135 assembles, and it is **rung 3 of P2's cue ladder** — the familiarity-exposure rung where no question is asked. Delete it and the graceful termination, the bad-day mode and the bottom of the mandated cue ladder all lose the thing they render. |
| **M-20 (personal)** | This is the entire clinical core. §5.1 keeps the scheduler because SRT is the only (a)-graded direct-memory intervention in this population and because it makes the dose reportable; §11 specifies "a small clinically-faithful spaced-retrieval loop inside it". Delete it and the product is CIRCA plus a music player plus a life-story book — the shape with the most prior art and the worst commercial record. |
| **The probe** | §5.2 makes it the only measurement surface in the product. M1, M3, M4 and M6 all die. It is also the only place the errorless-vs-spaced-retrieval A/B can legally run, because on the personal deck a cold recall attempt is exactly what the brief forbids. |
| **M-40** | The only route to M2's primary outcome (words spoken / story elicited), the only test available of the Astell 2010 (c) finding that sits as an unexamined veto over the technical core, the only mechanic that is content-**positive** (it produces recordings rather than consuming them), and the only place P31's contributing role exists. Nothing else in the set elicits speech with no correct answer. |

**And no pair is doing the same job.** M-02 and M-20 share a shell at opposite demand levels — that is the variety principle working, not duplication. M-35 and M-40 both have no correct answer, but M-35 is near-ceiling completion with no mic and M-40 is open narration with a mic that generates content. M-56 and M-35 both open the session, but one is zero-demand affect and the other is a vocal-channel success; they are sequential, not alternative. The probe and M-20-personal share a state machine and differ on the one axis that matters — one is fixed and generic and records failure, the other is adaptive and personal and never does.

---

## 6. SCORING TABLE AND VERDICTS

Worst-lens score = the minimum across the five lenses (dignity/safety, clinical evidence, caregiver burden, engineering, research instrument). Mean is the arithmetic mean. **Verdict is mine.**

| ID | Mechanic | Min | Mean | Verdict | Reason |
|---|---|---|---|---|---|
| M-25 | The One Sentence This Month | 9 | 9.8 | **RUNTIME (ship)** | Highest-scoring mechanic in 139. Full Camp fidelity, one sentence a month, carries M4. A schedule, not a screen. |
| M-20 | The Answer First | 9 | 9.6 | **SHIP ×2** | Personal card **and** the §5.2 generic probe. Same shell, `item_is_probe` decides. |
| M-23 | The Fading Name | 9 | 9.6 | **RUNTIME — rung 1** | Substring + rung integer. Shipping as a mechanic inflates the count and buys nothing. |
| M-24 | The Widening Gap | 8 | 9.4 | **RUNTIME (ship)** | §6.8's 6–10 item rotation and scheduler req. 1. Serves as M-25's filled interval. Zero marginal content. |
| M-58 | The Song First | 8 | 8.8 | **ABSORBED into M-56** | Not an activity — a placement. One asset, two positions, randomised. Zero build. |
| M-40 | Tell Me About This One | 7 | 8.6 | **SHIP** | The only M2 instrument. Content-positive. |
| M-129 | The Standing Answer | 7 | 8.0 | **CUT → v1.1** | Second always-on patient surface with its own P9 surface, its own telemetry, the F14 disclosure subsystem, and 3–6 authored emotional clips per recurring question. Fails the one-sitting test. First v1.1 addition if the distress register demands it. |
| M-22 | The Ladder of Hints | 6 | 8.8 | **RUNTIME, rungs DERIVED** | The burden-6 rating was for authored fragments. Derive the rungs (§2.3) and the cost goes to zero. |
| M-131 | Back Along The Years | 6 | 8.8 | **RUNTIME (ship)** | Sequencing policy, no UI. `turnaround_decade` logged or era-stratified analysis is uninterpretable. |
| M-48 | What Would You Tell Them | 6 | 8.4 | **CUT → v1.1** | Duplicates the single generic slot P11 requires *one* of, and duplicates M-40's recorder. Loses to M-35 on repeatability, no-mic, no-storage, no artefact promise, and P25 sentinel duty. |
| M-132 | The Room You Knew | 6 | 8.4 | **CUT → v2** | A third pre-registered manipulation in a pilot that cannot power the first two. 30 s of a ≤10-min session that M-40 uses better. (c) evidence. |
| M-10 | Two Pictures, One Question | 6 | 8.0 | **RUNTIME — rung 2 only** | Dignity lens verbatim: "indefensible as a cold personal probe". Survives only as help, reached downward. |
| M-135 | Nothing Today | 5 | 8.8 | **RUNTIME (ship)** | P1 + §6.12. Conditions in §2.2 are non-negotiable. |
| M-35 | Complete the Saying | 5 | 8.6 | **SHIP** | Opener, closer, P1 reserve, M2 generic arm, P25 sentinel. Zero ask. |
| M-134 | Fade To Rest | 5 | 8.6 | **RUNTIME (ship)** | S3 and P28 made real. |
| M-21 | Ask and Always Answer | 5 | 8.0 | **SHIP — PROBE ONLY** | The M3 spaced-retrieval arm. On generic stock faces its burden-5 rating **collapses to zero**, because we author the probe, not the family. |
| M-26 | Coming Into Focus | 5 | 7.6 | **CUT** | Clinical 5 — "adds nothing M-22 and M-23 do not already deliver on evidenced ground". Engineering 6 — animated `blurRadius` cannot use the native driver; doing it properly is a new pre-render asset pipeline for one mechanic. |
| M-136 | The Session That Starts Itself | 5 | 7.2 | **CUT — survives as P8 chime** | ND-29 violation as catalogued (16:00). No Expo app can wake a sleeping tablet on iOS. Kept honestly as a mid-morning notification with the session pre-loaded. |
| M-138 | Tuning In | 5 | 7.2 | **CUT** | P23 violation (undisclosed measurement under a friendly disguise). And the honest version cannot be built: a volume slider is a **drag**, forbidden by P9. Volume is a caregiver setting; `hearing_aid_use` stays a static §7 field. |
| M-11 | Odd One In | 5 | 6.6 | **CUT** | 3AFC restatement of a rung we already have. No additional evidential support. Foil count is a parameter, not a mechanic. |
| M-96 | Family Snap | 5 | 6.4 | **CUT** | Speed-pressured motor task with a visible miss, in a cohort whose response speed degrades first. The schedule it hosts is the evidenced part and exists as a layer. |
| M-46 | The Season Turning | 4 | 8.2 | **CUT** | Same generic slot as M-35, fires annually so no repetition within a pilot (research 4). P11 requires a generic opener, not three. |
| M-13 | Both Are Right | 4 | 8.0 | **CUT** | No correctness record, no per-item curve (research 4). The agency it buys is delivered by M-40 and by patient-paced advance in M-02 at no extra state. |
| M-27 | The Long Introduction | 4 | 7.6 | **RUNTIME — the item schema** | P12 specifies this exact record. It is the deck, not a screen. |
| M-09 | The Twenty Minutes | 4 | 7.4 | **CUT → v1.1** | The only negative-burden mechanic in 139 and still cut: M-134 + M-02 already let a carer start it and walk away, so M-09 adds **only** the announced return — which is the app making a factual promise about the world it cannot keep. It adds hazard and no capability. |
| M-103 | The Tombola | 4 | 7.4 | **CUT** | Flagged P9 by three lenses (a crank is a drag). And a fixed-shape ≤10-minute session has no navigation to do — the session **is** the navigation. |
| M-02 | The Narrated Album | 4 | 7.2 | **SHIP, burden defused** | Burden-5 was "one recorded voice caption per photo, forever". Made **optional** with TTS reading family-typed text. The central unpriced cost is now unpriced because it is not charged. |
| M-29 | Say It Back | 4 | 6.6 | **CUT** | Clinical 4: repetition at zero retention interval is not retrieval. M-35 achieves the warm-up and the vocal channel generically at zero cost. |
| M-47 | Teach the Grandchild | 4 | 6.4 | **CUT** | Depends on a third party the primary carer must chase. Most families have exactly one willing relative and they are at capacity. |
| M-33 | Finish The Sentence | 4 | 6.0 | **CUT** | Med authoring ask for (c) benefit. Family-authored stems are not overlearned in the sense that carries the completion evidence, and low-constraint stems break the mechanic silently. |
| M-56 | Your Song | 3 | 8.4 | **SHIP (weakest of six)** | P15 mandate, (a) content evidence, zero ask, only non-visual channel. Research yield 3 alone; 8 once randomised as a placement. |
| M-31 | The Return Visit | 3 | 7.6 | **CUT** | Violates §6.3 / P-SCHED-3: a four-month gap breaches the 30-day global and 7-day tier-1 ceilings, which exist because the Stamate-vs-accelerated-forgetting conflict is unresolved. |
| M-73 | The Quiet Anchor | 3 | 7.4 | **CUT** | Research 3, live-weather network dependency in an offline-first product, and it competes for the opener slot M-35 already holds on stronger grounds. |
| M-95 | This Day, That Year | 3 | 7.4 | **CUT** | A date-driven surfacer will eventually surface a death anniversary. S4 demands **zero** instances; the cheapest guarantee is not to build the surfacer. Fires on a handful of days per participant for research 3. |
| M-17 | The Lost Property Office | 3 | 7.2 | **CUT** | Best recognition psychometrics in the catalogue, wrong stimuli for them. Liberal response bias in AD makes false alarms near-guaranteed and here they are about whether her own possessions are hers. §5.2 has already fixed one probe shape. |
| M-79 | The Way to the Bathroom | 3 | 7.2 | **CUT → v2** | Highest human value outside the honest claim, which is exactly why it does not ship in a pilot testing that claim. Requires a whole video capture-and-storage pipeline for one mechanic. Research 3. |
| M-34 | Finish the Line | 3 | 7.0 | **CUT** | Research 3 (at ceiling, sung response overlaps the recording). Gated on the same licensing blocker as M-56, which already holds the music slot. |
| M-38 | Pocket Answers | 3 | 7.0 | **CUT → v2** | Highest clinical score in the ranked set (10) and still cut: perpetual maintenance with a safety edge the carer cannot delegate. A stale identity fact rehearsed to fluency and spoken to a stranger is worse than no answer. Revisit when a review-cadence owner exists. |
| M-43 | The Legacy Recording | 3 | 7.0 | **CUT** | M-40's recorder with a different prompt source. A one-off artefact, not a repeated measure. |
| M-137 | The Chime | 3 | 7.0 | **HALF SHIPS** | Differentiated version is ND-5 by the back door and contaminates the data — the patient starts responding to the audio contingency. Undifferentiated half ships as a runtime rule. |
| M-80 | Two Doors (real doors) | 3 | 6.8 | **CUT — ND-5 VIOLATION** | Quizzes precisely where its own family principle says state and never ask, and attaches a correct answer to finding the bathroom. Research value 7 does not buy a §9 violation. |
| M-15 | The Sound of the Place | 3 | 6.6 | **CUT** | Clinical 3, no evidential base, soft ground truth confounded by near-universal hearing loss. |
| M-76 | Who's Coming Today | 3 | 6.6 | **CUT** | Burden 3. Requires a confirmed rota maintained forever and stakes the patient's expectation on the world cooperating. A no-show is a manufactured disappointment — a failure state worse than not having the feature. |
| M-90 | Yesterday Actually Happened | 3 | 6.6 | **CUT** | Exemplary design (absence never displayed) and research 3. An ongoing action depending on a relative, for (c) mechanism-only benefit. |
| M-99 | Bingo of a Lifetime | 3 | 6.6 | **CUT** | Burden 3: 9–15 *performed* recordings in a caller's rhythm, refreshed as content rotates, from a person with no spare capacity. |
| M-133 | The Thermostat | — | — | **KILLED OUTRIGHT** | Prosody-driven silent adaptation is an inferred-affect classifier in substance (P18, ND-15, EU AI Act Art. 5(1)(f)) and unauditable adaptation that destroys attribution. Bad ethics and worse measurement. |
| M-130 | The Grief Weather Report | — | — | **KILLED OUTRIGHT** | Surveillance of a person's grief rendered to family, in a population where 34% of carers report important levels of abusive behaviour (§3 #50) and P23 makes that the modal case. |
| M-42 | Sunday Afternoon (always-on mic) | — | — | **KILLED OUTRIGHT** | A continuously open microphone on a person enrolled by consultee advice is the sharpest consent edge in the product. M-40 yields the same speech corpus with a defensible consent story. |
| M-89 | The Thing At Four O'Clock | — | — | **KILLED OUTRIGHT** | Manufactures failure by design and invites a face-saving lie that corrupts the measurement anyway. |

---

## 7. §9 NEVER-DO AUDIT

Every hard stop that the frozen set could plausibly touch, and where it is held:

| # | Never-do | How the frozen set holds it |
|---|---|---|
| 5 | No score, chart, streak, red X, "wrong", due-count, backlog | No aggregate surface exists. M-137 ships undifferentiated so even the *sound* is not a correctness signal. No backlog (P6). |
| 6 | Never ask the patient to rate their own recall | No self-report anywhere. Grading is `correct × cue_level × latency × attempt_index`. |
| 7 | Never end on a failure, summary or score | Step 9 (M-35 generic closer) plays unconditionally; step 10 (M-134) catches disengagement. S3 audited from telemetry. |
| 8 | Never let the algorithm retire an item | No leech threshold, no suspend, no auto-delete. Items degrade to rung 3 (M-02 familiarity exposure) and stay in rotation. |
| 9/10 | No monotonic-improvement scheduler; never target 90% retention | Camp ladder with hard ceilings (30 d global, 7 d tier-1). Intervals contract item-locally. Target ≥95% by cue support, never by interval manipulation. |
| 11 | Never ask for free recall of recent episodic events | No mechanic in the set touches recency. M-40 is open narration about a photograph, never "what did you do yesterday?". |
| 12 | Never surface a deceased person in a recognition mechanic without explicit caregiver decision | `person_status` is a **mandatory, unskippable** field at upload. Deceased defaults OFF for M-20/M-10 and is permitted in M-02 and M-40 (face and voice yes, never the death, never a question whose answer requires knowing they are gone). Audited as S4. |
| 15 | Never build an inferred emotion or distress classifier | M-135's trigger is deterministic (2 skips / abandonment / distress event). M-133 killed outright. |
| 16 | No AI-generated factual content without human approval | TTS reads family-typed text. No generative captions, no generative prompts. |
| 17 | No face detection, clustering, auto-tagging, voiceprint | Manual tagging only. This is why the deck is capped at 8–10 items rather than a whole album. |
| 18 | Never export a real date, full-face photo, voice recording or real name to the research plane | `day_offset_from_enrollment` only; photos as `content_class`/`era_decade`/etc.; transcripts never persisted to the research plane. |
| 24 | No onboarding "baseline assessment" that reads as a screen | The enrolment screen (§9) is administered to the **caregiver and referrer**, never the patient, never scored, never described as an assessment. |
| 26 | ASR never grades | Grading is by tap. `asr_confidence` is metadata. |
| 27 | No points, badges, mascots, confetti, streaks | None exist. |
| 29 | Never nudge after 16:00 | P8 chime is mid-morning; the notification scheduler hard-blocks after 16:00. **This is why M-136 was cut as catalogued.** |
| 30 | Never require the patient to log in or remember a code | The tablet opens into the session. |
| 31/32 | Single tap only; no drag, swipe, scroll, modal, page transition | **This is why M-138 and M-103 died** — a volume slider and a tombola crank are both drags. |
| 33 | Never change the patient UI mid-study; never A/B the patient surface | UI frozen at enrolment per participant. M2/M3 arms are **content and trial-order assignment**, not interface — see §8. |
| 34 | Never require caregiver co-presence | §3. |
| 35 | Never enrol PCA or svPPA into photo/face mechanics | §9 Gate 2 excludes them from the product entirely. |
| 36 | Never read a sudden collapse as progression without raising physical illness | P25 notifier, §8. |

---

## 8. THE RESEARCHER SURFACE — SETTLED

§5.3 designated the researcher as the loser. **It is right that the researcher loses and wrong about what they lose**, and its chosen implementation — a built-but-dark clinical layer — is the one option that is bad on every axis at once. Concretely:

### 8.1 AMENDMENT to §5.3

§5.3 says "the research plane collects everything but exports nothing that reads as clinical status." Read literally, that forbids M1 (per-item retention curves), M4 (tier-1 retention at week 12) and M6 (within-person change reliability) — which are success criteria in the same document. P24 forbids a metric surfaced **to a clinician**; a pseudonymised cohort export to a named investigator under REC approval is not that.

> **§5.3 now reads: the research plane exports nothing that reads as clinical status *about an identified individual to anyone in a care relationship with them*.**

P24 is preserved intact. M1/M4/M6 are restored. Cost: nothing.

### 8.2 What ships

| Surface | Status | Contents |
|---|---|---|
| **A — Research export** | **SHIPS IN FULL** | Not a UI. A versioned, scheduled export job plus a data dictionary and codebook. Everything in §7 of the synthesis, pseudonymised, `day_offset_from_enrollment` only, content plane firewalled (P21). Cohort-level and retrospective — **no live view of a named participant**. Delivered under REC/IRB (B5) and a DPA. |
| **B — Trial operations console** | **SHIPS THIN** | Recruitment and consent events (S6/F7); segment-window adherence (F1/F2); non-usage and dropout attrition as **separate** curves (F4); `ended_on_success` rate (S3); the distress/adverse-event register (S1/S2/M5); the deceased-surfacing audit (S4); probe-disabled events; data completeness. **No per-participant cognitive rendering.** This is not "engagement analytics" — it is the compliance audit instrument for six of seven Tier-1 safety criteria, and it is what lets the pilot be stopped early if it is harming people. Labelled per P24: *"engagement and usage analytics for research — not a clinical assessment; not for diagnosis or treatment decisions."* |
| **C — Clinical layer** | **NOT BUILT. NOT DARK. NOT IN THE REPOSITORY.** | A feature-flagged drift detector sitting in production is **evidence of intended purpose, not a shield from it** — FDA's 2026 guidance assesses intended use objectively, and a hidden UI over a built device is a weaker position than never having built it. Drift, trajectory and progression are computed **offline in the analysis plane by the investigator**, as versioned recomputable derived variables. The researcher gets a *better* artefact: uncontaminated by runtime adaptation, recomputable when the method changes, auditable. |
| **D — P25 delirium notifier** | **SHIPS. B1 is on the critical path.** | An algorithm detecting acute change and telling a family to ring a GP is *software providing information used for a diagnostic decision* and triggers real-world clinical action — a **higher**-risk shape than a drift chart. S7 is Tier-1 and missing delirium is the biggest real-world harm in the product, so it cannot be deferred. Deterministic threshold over the generic probe plus the M-35 proverb floor sentinel; recipient is the **caregiver**, never the patient, never a clinician; wording is physical-illness only, never a cognitive interpretation (P25). **B1 (written MHRA/FDA opinion) must be scoped to P25 before launch — it never gated the researcher surface, which is why deferring it protected the wrong thing.** |

### 8.3 AMENDMENT: §6.10's global drift term is REMOVED from the v1 runtime

§6.10 says the drift term "surfaces to nobody" and then specifies that when trailing-14-day success at a fixed cue level falls, **the engine globally steps cue support up and intervals down**. It acts on the patient every day. The MHRA Class IIa example the synthesis itself cites is *"adapts exercises based on user responses"* — **the trigger is the adaptation, not the display.** §5.3 drew the line at the screen; the regulator drew it at the behaviour, and so we deferred the harmless half and shipped the triggering half.

It also destroys the science it was meant to preserve. A global term that moves in response to performance silently rescales the instrument in response to the thing being measured (M-133's named flaw, arriving through the back door), and §6.11 concedes that in the DLB band it will chase Lewy-body noise and bake it into the record.

**What is removed:** the trailing-14-day, cross-item, global difficulty step.
**What stays, unchanged:** the item-local cue ladder (P2, §6.4) — a miss adds cue support and re-presents one rung easier — which is deterministic, item-scoped, standard errorless technique and not adaptive clinical software; the deterministic difficulty floor (M-135); and scheduler requirement 9 (intervals must be able to contract), which remains an item-local property.

### 8.4 Data-minimisation discipline (the price of the full export)

"Collect everything and decide later" is the posture GDPR purpose-limitation exists to forbid and the first thing a full-board REC will cut. **Maximum defensible research capability is maximum *pre-registered* collection, not maximum collection.**

1. **Every §7 field carries a named pre-registered analysis in the protocol, or it does not ship.** One column in the data dictionary.
2. **Transcripts are content-plane and are never persisted to the research plane.** Speech *features* only. P27 forbids ASR for grading and is silent on ASR for feature extraction; a transcript of a person narrating their family is the most re-identifying artefact in the system.
3. **P23's hole is closed.** P23 forbids anything observable by the *caregiver* that is undisclosed to the patient, and says nothing about the researcher. The speech-feature layer is disclosed in plain words in the patient UI and the consent form, and is separately removable. **If it cannot survive being described honestly to the person it is collected from, it does not run.**

### 8.5 The P10 / M2–M3 collision, resolved

P10 forbids A/B testing on the patient surface "ever". Its evidence is procedural motor learning **bound to spatial position**. M2 and M3 are the pilot's only two mechanism contributions and both require randomised assignment.

> **P10 governs interface, not content assignment.** Randomising which photograph appears, or whether a name precedes or follows an attempt, moves no button and changes no layout, wording, icon, colour or position.

- **M3** (probe: answer-first vs recall-first) — assigned **per participant, frozen at enrolment**, because it changes the shape of the trial.
- **M2** (M-40: personal vs generic photograph) — **within-participant, randomised per session**, because it is a pure stimulus swap inside an identical shell. Better powered, and no interface consequence at all.
- **Prime condition** (M-56 before or after the Camp block) — within-participant, randomised per session. Free mechanism data with an internal control.

This must be written into the protocol explicitly, or the pilot's entire scientific contribution dies on a principle written for a different reason.

---

## 9. ENROLMENT SCREENING

P26 requires eligibility gated by **subtype**, not severity band. ND-35 forbids enrolling PCA or svPPA into photo/face mechanics. ND-24 forbids an onboarding assessment that reads as a screen.

> **Therefore: the screen is administered to the caregiver and the referrer, never to the patient. It produces an eligibility outcome and nothing else. It is never scored, never shown to anyone as a number, never stored as a cognitive measure, and never described to the family as an assessment.**

### Gate 1 — Diagnosis of record

`dementia_subtype` taken from the memory-service letter where it exists. Most families will not have one, which is why Gate 2 exists.

### Gate 2 — Caregiver-reported observations (never administered to the patient)

Written as things a family already knows about their person's everyday life.

**Posterior cortical atrophy cluster — any TWO is exclusionary**
1. Does she have difficulty recognising objects or people **in photographs**, even when she can see them perfectly clearly?
2. Does she reach for things and miss, or misjudge distances — pouring, doorways, stairs?
3. Has she had trouble reading a line of text or keeping her place on a page, when her eyesight has been checked and is fine?
4. Was difficulty **seeing or reading** one of the first things you noticed — before memory?

**Semantic-variant PPA cluster — any TWO is exclusionary**
5. Does she ask what a common word means ("what is a colander?")?
6. Has her speech become fluent but empty — plenty of "thing" and "that one", few specific names?
7. Does she have trouble recognising what an everyday object is **for**, not just what it is called?
8. Was **word meaning**, rather than forgetting recent events, the first thing to change?

**Dementia with Lewy bodies cluster — any TWO is a FLAG, not an exclusion**
9. Does her alertness change markedly within a single day — sharp for an hour, very confused an hour later?
10. Does she see people or animals that are not there?
11. Does she act out dreams, shout, or move a great deal in her sleep?
12. Has she fallen or fainted without an obvious cause?

**Acute-change gate (P25, the corpus's largest omission)**
13. Any suspected infection, recent hospitalisation, or new confusion in the last two weeks?

**Sensory gate**
14. Have sight and hearing been checked in the last twelve months, with any correction in use?

### Gate 3 — What each outcome does

| Outcome | Decision | Handling |
|---|---|---|
| **PCA ≥2, or PCA on the letter** | **Not eligible** | Told plainly, in writing, with the reason and a signpost. A photo-recognition product is contraindicated, not merely difficult. Selling it to this family would be the clearest avoidable harm in the whole design. |
| **svPPA ≥2, or svPPA / PPA on the letter** | **Not eligible** | Same handling. Drilling person-knowledge drills the system being destroyed. |
| **DLB ≥2, or DLB on the letter** | **Eligible, flagged `fluctuation_band = high`** | (a) Pre-registered stratification variable, not a post-hoc split. (b) The M-135 difficulty floor triggers one step earlier. (c) **No within-person trend is reported for these participants at any horizon** — M6 says nothing is supportable below r≈0.5 and DLB is where reliability collapses. (d) On-screen faces carry unexamined hallucination risk: a named safety-watch category in the adverse-event register from day one. |
| **Acute-change gate positive** | **Defer four weeks, re-screen** | Not an exclusion. Delirium is a treatable medical emergency and enrolling into one manufactures a false decline signal. |
| **Sensory gate negative** | **Defer to an optician or audiologist** | Not an exclusion. Contrast-sensitivity loss in AD beyond normal ageing (#43) is otherwise read as memory decline, and hearing loss confounds every latency in the dataset. |

### Who runs it

A **named study clinician reviews every Gate-2 questionnaire before enrolment**. Family self-screening alone is not sufficient for an exclusion decision of this consequence. C4's comprehension check — ≥90% of caregivers stating unprompted, in their own words, that the app will not slow the disease — happens in the same sitting, and a wrong answer is corrected, not recorded and ignored.

---

## 10. THE FOUR ARGUMENTS, IN SUMMARY, AND WHAT I TOOK FROM EACH

**Argument 1 — the minimalist ("four shells, two content types").** The count is inflated because most "mechanics" are the session runtime, the item schema, or a rung of a ladder misfiled as a screen.
*Taken:* the entire reclassification, and — decisively — **the derived cue ladder** (§2.3), which is the single best idea in the four arguments and the thing that makes P29's ten-minute budget survivable. Also: the discipline that every v1.1 addition must add neither a new shell nor a new required content type.
*Rejected:* the claim that M-56 is deferrable. P15 says music is first-class **from v1** and it costs a birth year.

**Argument 2 — variety is already mandatory.** P11 requires three structurally different things per session; P1 requires a held closer; §6.8 requires filler; §5.2 requires a separate probe; §6.12 requires a floor mode. Six surfaces fall out of binding rules before anyone says "fun". And the mechanics that create variety are precisely the ones that ask the family for nothing.
*Taken:* the whole framing. The frozen session **is** its OPEN → PRIME → CORE → TELL → CLOSE shape. Also its Rule of the Rotating Frame: **the graded core is deliberately identical day to day — that is where the evidence lives — and variety is spent entirely on the surround.** And the insistence that any varying frame element be randomised as a crossed factor rather than left to drift.
*Rejected:* seventeen parameterisations. P10 freezes the UI at enrolment, so every shell must be learned in week one, and S3/S4 are per-path guarantees over a state space a headless agent has to be able to exhaust.

**Argument 3 — CIRCA-shaped, testing as a minority.** The one replicated positive result in this neighbourhood works by *not* testing; the best-evidenced outcome in the corpus is a conversation outcome; the pilot cannot measure efficacy, so v1 should be optimised for what it can measure, and testing is the main threat to exactly those numbers.
*Taken:* the composition. Graded personal retrieval is ~3 of ~9 minutes, bracketed by generic no-correct-answer content at both ends, with music and narration carrying the rest. Also: **all recorded uncued failure moves to the generic probe** and M-21 leaves the family deck entirely — which is what the brief independently required.
*Rejected:* deleting M-24. §6.8 explicitly prescribes 6–10 items in rotation as the filled interval, and with the ladder derived it costs zero marginal content. M-25's single-target discipline is preserved by giving it its own dedicated within-session schedule; the deck is what fills its gaps.

**Argument 4 — the researcher's case.** §5.3 regulated the wrong noun, "built-but-dark" is the worst of three options, and the global drift term is the actual Class IIa trigger.
*Taken:* almost all of it — the §5.3 amendment, the full export, the trial-operations console reframed as a safety instrument, no clinical layer in any form, the removal of §6.10's global drift term, B1 back on the critical path scoped to P25, the P10/M2–M3 resolution, and the transcript and P23 hole closures.
*Rejected:* the pure-data keeps (M-17, M-26, M-29, M-31, M-138). Research value does not buy a §9 violation, a second probe shape, a drag gesture, or a breach of the interval ceilings — and Argument 4 conceded that principle itself on M-80.

---

## 11. WHAT WAS CUT, GROUPED BY REASON

**Cut as §9 / design-principle violations (not negotiable):** M-80 (ND-5), M-103 (P9 — a crank is a drag), M-136 as catalogued (ND-29 at 16:00), M-138 (P23 undisclosed measurement; and P9 forbids the slider that would make it honest), M-137's differentiated version (ND-5 by the back door), M-31 (§6.3 / P-SCHED-3 interval ceilings), M-133 (P18 / ND-15 / EU AI Act Art. 5(1)(f)), M-130 (P23 in a population where 34% of carers report important levels of abusive behaviour), M-42 (always-on mic under consultee consent), M-89 (manufactures failure by design).

**Cut as a duplicate of a slot already filled:** M-46 and M-48 (P11 requires *one* generic opener/closer, and M-35 also serves as P1's reserve and P25's sentinel), M-11 (a foil-count parameter, not a mechanic), M-13 (agency already delivered by M-40 and patient-paced M-02), M-34 (M-56 holds the music slot), M-43 and M-47 (M-40's recorder with a different prompt source), M-17 (§5.2 has already fixed one probe shape), M-29 (M-35 does the warm-up generically at zero cost).

**Cut because the content ask does not fit one exhausted sitting or does not survive the family going quiet:** M-129 (3–6 authored emotional clips per recurring question), M-99 (9–15 performed recordings, refreshed), M-33 (skilled stem authoring that breaks silently when done badly), M-38 (perpetual maintenance with a safety edge the carer cannot delegate), M-47 (depends on a third party the carer must chase), M-76 and M-90 (depend on reality cooperating and a log maintained forever).

**Cut because they buy nothing the runtime does not already deliver:** M-26 (clinical 5, and animating `blurRadius` off the native driver means a new asset pipeline for one mechanic), M-96 (speed pressure and a visible miss for a schedule that exists as a layer), M-73 (network dependency for weather, competing for a filled slot).

**Cut and named for later, with the trigger stated:**

| Deferred | Trigger for v1.1 / v2 |
|---|---|
| **M-129 The Standing Answer** | If the distress register shows repetitive anxious questioning dominating. First addition. |
| **M-09 The Twenty Minutes** | If carer-burden telemetry says respite is the binding constraint — and only with the spoken promise about a human's return removed. |
| **M-48 What Would You Tell Them** | If F2's zero-delivery rate comes in worse than predicted. Adds no new shell and no new content type. |
| **M-132 The Room You Knew** | v2, when the pilot is powered for a third manipulation. |
| **M-79 The Way to the Bathroom** | v2, when a video pipeline pays for itself across more than one mechanic. |
| **M-38 Pocket Answers** | v2, when a review-cadence owner exists. Highest clinical score in the ranked set; the blocker is maintenance, not evidence. |

**The test any future addition must pass: it adds no new patient-facing shell and no new required content type.**

---

## 12. OPEN DISAGREEMENTS I AM NOT PRETENDING TO HAVE SETTLED

1. **Apathy and initiation may be the binding constraint on F2, not authoring burden.** §1.9 names apathy as the most prevalent neuropsychiatric symptom and a direct disease-caused predictor of not initiating any activity, and it appears nowhere in the engagement corpus. I have optimised hard for authoring burden and I cannot prove that is the right variable. If this pilot dies, it is more likely to die of nobody pressing anything than of a carer running out of content. **This is pre-registered as the named F2 failure mode**, and the only mechanic that addresses it directly (M-136) cannot be built as specified because no Expo app can wake a sleeping tablet on iOS. An always-on lit display is a hardware and deployment decision, not a mechanic, and it can be added without a seventh shell.

2. **M-24 may be claiming Camp's (a) grade for a configuration Camp did not test.** The catalogue's "Deliberately not merged" table says target count is the active ingredient. I kept the 6–10 item deck on §6.8's explicit authority and preserved M-25's single-target discipline separately — but §6.8 may itself be over-reaching, and a reviewer is entitled to say the deck is a weaker animal wearing the evidence of a stronger one.

3. **Removing §6.10 may weaken scheduler requirement 9.** I hold that interval contraction stays item-local and nothing is lost. A scheduler reviewer may disagree, and this is an amendment to a binding section, so it should be argued, not assumed.

4. **§6.7's ≥95% success target is an admitted judgement call**, and I have staked a 6–10 item personal deck on it holding daily in a fluctuating illness with no dose-response curve in existence for this population.

5. **Music licensing is unresolved.** M-56 ships with a graceful-degrade path (family-nominated local file, or silence), but if licensing does not close, P15 is only partially honoured and M-56 is the mechanic I drop to reach five.

6. **B6 has not run.** P32 makes the mechanic freeze conditional on a PPI panel with people living with dementia. This document is made from other documents. It is the freeze I take to that panel, not the freeze that survives it.
