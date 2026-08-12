# 00 — MASTER SPECIFICATION

**Memory Lane.** The single document a new engineer reads to understand what this is and why it is built this way.

**Status:** Derived. This document summarises and reconciles six governing documents. Where it disagrees with any of them, they win:

| Document | Authority |
|---|---|
| `docs/research/00-SYNTHESIS.md` | Evidence, design principles P1–P32, scheduler requirements, telemetry, success criteria, NEVER DO |
| `docs/design/00-V1-PRODUCT-SHAPE.md` | The six frozen mechanics, the session walkthrough, enrolment screening |
| `docs/design/00-SCHEDULER-SPEC.md` | The frozen scheduler contract |
| `docs/design/00-DESIGN-SYSTEM.md` | Tokens, geometry, copy, screens, accessibility assertions |
| `docs/architecture/00-ADR-PLATFORM.md` | Stack, offline, auth, blind-agent contract, repo layout |
| `docs/architecture/00-ADR-DATA.md` | Schemas, RLS, event envelope, consent, deletion, research plane |

§10 lists the contradictions between those documents that are still open. Read it before you write code that touches the scheduler, the probe, or the patient roster.

---

## 1. WHAT THIS IS, IN ONE PAGE

> **A ten-minute daily activity you do with your own family photographs — it plays you a song from your twenties, shows you the people you love and says who they are, asks you to tell it about one picture, and quietly practises the handful of names and the one sentence that matter most this month.**

It runs on a tablet, offline, in the person's own home or care home. It is a **television programme, not an app**: it plays, it has a beginning and a sign-off, and it continues whether or not anyone touches it. Touching is optional participation, never required input. There is no login, no menu, no score, no streak, and no way to get it wrong.

Three people use it. A person with mild-to-moderate dementia (the patient) watches it. A family member (the caregiver) supplies eleven things once and roughly one sentence a month. A researcher receives a pseudonymised, immutable, released dataset — and no live view of anybody.

### 1.1 The honest claim

This is the strongest claim the evidence supports, and it is the only claim any surface may make:

> **Spaced retrieval training reliably teaches and helps maintain specific, chosen, personally relevant facts and face–name associations in people with mild-to-moderate Alzheimer's disease — for those items and nothing beyond them — and doing it together, from your own family's photographs and voices, is a structured shared activity that people with dementia in the one closely comparable trial rated as improving their relationship with their carer.**
>
> *We have not tested this product. Everything above is inference from adjacent trials, and the three closest trials to it were null.*

Marketed as a shared activity and nothing more.

### 1.2 The claims we will never make

Banned from marketing, app-store copy, onboarding, in-app text, investor materials, the clinician surface label, and any testimonial we solicit. Enforced by an automated claim-lint over every copy surface, gating release (criterion C3).

Never claim or imply that Memory Lane **slows, delays, prevents, treats or reverses** dementia · reduces dementia risk · builds or protects **cognitive reserve** · preserves synapses or neurons or is "exercise for your brain" · improves **memory, focus, attention or brain health** generally · **transfers** beyond the practised items · improves **ADLs, independence** or delays institutionalisation · improves **quality of life** · improves **mood** · **persists after stopping** · moves **MMSE, MoCA, ADAS-Cog or CDR-SB**. Never use "clinically proven", "clinically validated", "brain training", "cognitive enhancement". Never show a family an improvement chart, a trend line, or a before/after. Never claim a regulatory status we do not hold.

The enforcement precedents are real: the FTC's $2M Lumosity order, the ASA's ruling against GMRD Apps upheld on an *implied* assessment, and FDA's 2026 General Wellness guidance, which assesses intended use **objectively from marketing** rather than from private intent.

### 1.3 The three facts that shaped everything

1. **Every trial that closely resembles this product was null, and two of them harmed the buyer.** iCST (n=356 dyads, ADAS-Cog p=0.45, 22% of carers delivered zero sessions). REMCARE (n=488, both primaries null, carer anxiety *up*, carers who attended more had more stress, p=0.005). Online Life Story Book (n=42, NPI d=−0.03, carer distress rebounded *above baseline* at six months). We are building in the shadow of three failures, not into open field.
2. **The caregiver is the only group with a statistically significant harm signal in the field's largest trial** — and 52% of family carers of people with dementia newly referred to mental-health services report some abusive behaviour toward the person, 34% at important levels. The hostile caregiver is not an edge case; it is roughly one in three. Every design decision about the caregiver surface follows from this.
3. **The scheduler is not the moat.** Spaced retrieval helps people learn but not demonstrably more than other structured learning techniques. The scheduler is retained because SRT is the only (a)-graded direct-memory intervention in this population and because it makes the intervention *dose* reportable. **The differentiator is the content pipeline and the consent architecture.** Say that internally and stop saying "the scheduler is the moat."

---

## 2. THE THREE PEOPLE

### 2.1 The patient

A person with mild-to-moderate dementia, at home or in a care home, enrolled after a clinician-reviewed subtype screen. **A first-class account holder with their own identity** — not a profile inside the caregiver's account (P22). The caregiver *advises*; under MCA 2005 ss.30–33 a personal consultee cannot authorise participation, and the database contains no value that means "consented" on the consultee pathway.

What they do: nothing they have to remember. A chime sounds mid-morning. If they pick the tablet up, a ten-minute programme plays. If they do not, nothing happens — no backlog, no catch-up, no counter, no message to anyone.

Their surface accepts **single tap only**, on targets ≥88 pt, with four controls in total, in the same pixels for the whole study. No swipe, drag, pinch, long-press, double-tap, scroll, modal, or hidden gesture exists anywhere in the product.

### 2.2 The caregiver

A family member. Online-first, on their own phone. They do three things:

- **Once, in under ten minutes:** supply eleven things (§3.1).
- **Once a month, in about a minute:** review one sentence — "Jean comes on Wednesdays" — because a sentence that has stopped being true is a rehearsed false comfort.
- **Whenever they want:** mark a person deceased or estranged, retire an item, add photographs, nominate the closing photograph, say "stop, this is upsetting."

What they do **not** get, deliberately: a progress dashboard, an accuracy chart, a trend line, a streak, a due-count, a decline signal, or face auto-tagging. The dashboard reports **moments and actions** — "she talked for two minutes about the Elm Street house" — never aggregates of failure. Multiple caregivers with differentiated permissions are supported, and a caregiver can be removed at the patient's request. Nothing is observable by a caregiver that is not disclosed to the patient in the patient UI, in plain words, and the database enforces this with a trigger: a permission not in the patient's `disclosed_permissions` cannot be granted.

### 2.3 The researcher

Designated the loser, in v1, deliberately. They receive:

- **A research export** — not a UI. A versioned, scheduled projection published as **immutable numbered releases**, pseudonymous, cohort-level, retrospective. No live view of any named participant.
- **A trial-operations console** — thin. Recruitment and consent events, adherence, attrition curves, the `ended_on_success` rate, the distress register, the deceased-surfacing audit, data completeness. This is not "engagement analytics"; it is the compliance instrument for six of seven Tier-1 safety criteria and it is what lets the pilot be stopped early if it is harming people.

They do **not** receive a clinical layer. No cognitive status, no trajectory, no progression-drift metric. That capability is **not built, not dark, and not in the repository** — a feature-flagged drift detector sitting in production is evidence of intended purpose, not a shield from it. Drift and trajectory are computed offline, in the analysis plane, by the investigator, as versioned recomputable derived variables. The researcher gets a *better* artefact: uncontaminated by runtime adaptation, recomputable when the method changes, auditable.

---

## 3. THE DAILY SESSION, MINUTE BY MINUTE

Total zero-input runtime: **9 minutes 53 seconds**. Every step runs with nobody else in the room. The times below are the design system's computed figures at the `standard` dwell setting.

**t = 0 — the chime.** A mid-morning local notification: *"This morning's pictures are on now."* No count, no badge, no "you haven't in five days". Hard-blocked after 16:00 without explicit caregiver override, because associative memory is ~10% worse in the evening and 21% of memory-clinic patients sundown. Sold honestly as a chime: no Expo app can wake a sleeping iPad, and pretending otherwise is a lie we would get caught in.

**0:00–0:08 — the ident.** A photograph from her own deck, matted. *"Here are your pictures."* Then *"I can hear you when you talk."* — the microphone disclosure, written and spoken, in identical wording, every session, forever. Byte-identical every time: the thing you are about to watch is the thing you watched yesterday. If she opens it six times in one day it plays six times, from the top, with no comment, because there is no *done*.

**0:08–0:36 — two sayings.** *"A stitch in time…"* — five seconds of nothing changing on screen — then, whether she spoke or not, *"…saves nine."* Generic, overlearned, era- and locale-matched, near-certain success, no personal stakes. This opens the vocal channel before any demand lands. It is also the acute-change floor sentinel: failure to complete an overlearned proverb is a strong physical-illness signal.

**0:36–1:06 — the song.** Thirty seconds from her late teens, decade-matched from her birth year. Zero demand. Singing, tapping, weeping and silence are all valid responses. In AD, music-evoked autobiographical memories beat picture-evoked ones — specific, fast, low-effort, predominantly positive. On randomly assigned *primed* sessions the song plays here; on *unprimed* sessions it plays at 8:37 instead. Same asset, two positions, one crossed factor, zero build.

**1:06–1:44 — the month target.** The one sentence that matters, at full published Camp fidelity: shown and spoken, withdrawn, then asked back. *"Jean comes on…"* and the voice trails off. The trailing sentence **is** the ask; there is no separate question and no question mark. It re-presents at 30 s, 1 m, 2 m, 4 m and 8 m from its own opening trial, wherever in the session those land.

**1:44–6:45 — the people.** Six tier-1 face cards, era-ordered from the reminiscence bump forward and turning around invisibly before the lost decades. Each card is **answer-first**: the name appears and is spoken with one true sentence typed by the family, held three seconds, then the caption clears slowly over 1.2 seconds — *the photograph does not move*. Then *"And who is this?"*, and nothing on screen indicates that time is passing. No spinner, no pulse, no countdown.

If she says nothing and touches nothing, the card descends one rung: `Marg — — — —` (em-dashes, not underscores — a crossword, not a test paper). Then two large photographs, *"Which one is Margaret?"* / *"Put your finger on Margaret."* Then, at the bottom, her name and her sentence again, with no question mark anywhere on the screen.

**The ladder only ever travels one direction — downward, toward more help — and its bottom rung is a photograph of somebody she loves with their name written under it. There is no rung below that and there is nothing to fall off.**

The clock is gated by her voice: while she is speaking, the rung does not advance. Touching a picture always replays its words and holds it — it never advances, never skips, and never grades. On the personal deck **nothing is graded**; the dependent variable is `attained_rung`, *how much help was needed*, never whether she failed. At the two-picture rung, **both photographs dissolve out together** whichever one she touched, the same tone plays, and the same single-picture frame arrives. There is no frame in which the screen shows which card she touched. `correct = 0` is written to the event log in the same transaction that advances the UI: **you can record a failure and never display one.**

**6:45–8:29 — the interval game (the probe).** *"Now some faces from an old album. Strangers, all of them."* Six to eight shipped stock faces, hard-capped at two minutes, identical items in identical order every day. This is the **only place in the product where a real uncued failure is recorded** — and no family content ever appears here. A miss is logged, then cue support is added until she succeeds. The probe is invisible to the scheduler: probe items are not in scheduler state at all and emit no scheduler event. Distress on the probe disables it for the remainder of the study, logged as an **adverse event, not as missing data**, and she is never told anything happened — subsequent sessions simply do not contain a probe block.

**8:29–9:39 — the interview.** One large photograph, personal or generic-era, randomised per session. *"Tell me about this one."* Then the caption becomes **`I'm listening.`** at 40 pt and stays there for as long as the microphone is open. That is the entire listening indicator: no icon, no level meter, no pulsing ring, no countdown. A meter turns her speech into a measured quantity in front of her. At 21 s: *"Take your time."* At 46 s: *"Tell me anything at all."* At 65 s: *"Thank you."* — **identical whether she spoke for two minutes or said nothing at all**, because a closing line that varies with what was produced is a grade. ASR never grades. Transcripts never reach the research plane.

**9:39–9:53 — the sign-off.** One more generic saying, played unconditionally. This is both the mandated generic closer and the held guaranteed-success item.

**9:53 → ∞ — closedown.** One photograph, nominated by the family, cross-dissolves up and holds. Its mat comes off — the visual sign that the programme has finished and there is nothing to touch. The stop panel is gone. The caption is empty. There is no sound. **Nothing is asked, ever again.** No "session complete", no summary, no thank-you screen, no "see you tomorrow", no count of anything. On mains power the photograph holds at full luminance indefinitely; it does not dim, because a face on a dark ground through a yellowed cataractous lens may fall below useful threshold at 40%.

### 3.1 The bad day

If a deterministic trigger fires — **two consecutive skips, an abandoned previous session, or any distress event** — the demand steps are replaced by six narrated cards: photograph, name, one sentence, spoken, nothing asked. The song still plays. The ident, the sayings, the sign-off and closedown are unchanged.

**There is no announcement of any kind.** On a normal day the programme is a sequence of photographs with a voice over them, interrupted occasionally by a question. On a bad day it is a sequence of photographs with a voice over them. The bad-day mode is the *same frame with the questions removed*, and the frames were never labelled. She is never told she is having a bad day. Misfiring toward gentleness is the safe direction and we accept it.

The trigger is **deterministic, never an inferred classifier** — EU AI Act Art. 5(1)(f) restricts emotion inference, and 5(1)(b) prohibits exploiting vulnerabilities due to age or disability. There is no ML affect model, no camera read, and no `inferred_classifier` value in the dissent enum. The absence of the enum value is the enforcement.

### 3.2 The stop panel

One fixed, isolated, permanently present control at the bottom right, on every screen except closedown. Bone-coloured, 320 × 130 pt, labelled **`Stop for now`** at 40 pt. Disclosed in three redundant channels — the written word, its fixed position and size, and never by colour. On tap: *"All right. Let's stop there."*, then the sign-off saying plays so the guaranteed-success rule still holds, then closedown. **No confirmation modal** — modals are unrecognised context switches for this cohort, and stopping is harmless, so it needs no confirming.

### 3.3 The day-1 content ask

**Eleven things: three profile answers and eight photographs.** Birth year, where they grew up, first language; then per photograph: who it is (the only typing in onboarding), relationship, decade, and **living / deceased / estranged / do-not-show — mandatory, unskippable, no default**. Plus one screen of era and theme blocklists (war, bereavement, displacement, institutional care). Median target 9 minutes, hard ceiling 10, **instrumented not estimated**.

The app runs a complete session from four photographs and a birth year, and a complete session from the birth year alone — the sayings, the song and the probe all ship in the app bundle and work on an empty deck in hour one and at week 52 for the 22% of families who will deliver nothing.

**Everything else is optional.** Recorded voice captions are optional; TTS reads family-typed text by default. A family that records nothing has a fully working product. **No mechanic degrades to broken when the family goes quiet.**

---

## 4. THE SIX MECHANICS

Six patient-facing mechanics. That is the whole surface. Everything else is runtime with no interaction shape of its own and no content ask.

| # | Mechanic | What it is for |
|---|---|---|
| 1 | **Complete the Saying** | The mandated generic opener *and* closer with no correct answer; the held guaranteed-success item; the acute-change floor sentinel; the generic arm of the personal-vs-generic A/B. **Zero content ask** — the only thing that works in hour one on an empty deck and at week 52 for a silent family. |
| 2 | **Your Song** | Music as a first-class content type from v1, on the strongest content evidence outside spaced retrieval. The only non-visual channel — the only thing that still works for anyone whose sight fails. Costs a birth year. *The weakest of the six, and the first to drop if music licensing does not close.* |
| 3 | **The Narrated Album** | The only zero-demand personal surface. It is what closedown fades into, what the bad-day mode assembles, and it is **the bottom rung of the cue ladder** — the familiarity-exposure state where no question is asked. The ladder bottoms out into the nicest page in the app. |
| 4 | **The Answer First** | The clinical core. Answer-first personal retrieval: name shown and spoken, withdrawn, then asked back, with help arriving before failure lands. This is what makes the intervention dose reportable. |
| 5 | **The generic probe** | The same shell with shipped stock faces, framed as a small game. The only measurement surface in the product, and the only place the errorless-vs-spaced-retrieval A/B can legally run. |
| 6 | **Tell Me About This One** | The only route to the primary mechanism outcome (words spoken, not accuracy), the only test of the claim that personal photographs are worse prompts than generic ones, the only **content-positive** mechanic — it produces recordings rather than consuming them — and the only place the patient's contributing role exists. |

### 4.1 Why the count is six and not sixteen

Most of what looks like a mechanic is the runtime, the item schema, or a rung of a ladder misfiled as a screen. The cue ladder is the decisive case. Four rungs are mandated. Authored rungs were priced at ~30 written fragments — well over the ten-minute onboarding budget, and that single cost was going to break onboarding.

**It is avoidable: every rung is cut from material the deck already contains.**

| Rung | What she sees | Where it comes from | New content |
|---|---|---|---|
| 0 | *"And who is this?"* | the card itself | — |
| 1 | `Marg — — — —` | `name.slice(0,k)` | **zero** |
| 2 | Two photographs, *"Which one is Margaret?"* | a second deck photo as the foil | **zero** |
| 3 | Name, spoken, one true sentence, no question | the item schema | **zero** |

Three separately-ranked "mechanics" collapse into four states of one card, and the ladder costs the family nothing. Ship them as three mechanics and you have shipped the same card three times and charged an exhausted person for it.

### 4.2 Variety comes from rendering, not from content

One photograph of Margaret — one upload, one typed name, three taps — appears as **six different experiences**: a narrated card, a graded answer-first target, a masked name, a two-photograph choice offered as help, a narration prompt, and a bad-day card. **Six renderings, one content ask.**

iCST's participants "exhausted the content faster than expected" — the *content*, not the shells. The fix is more photographs, which families already own thousands of, not more mechanics, which cost onboarding time and state space.

### 4.3 The foil rule that prevents the worst bug in the product

The two-photograph rung draws its foil **only from living people in the same deck, revalidated within 48 hours, with media ready — fail-closed.** No such foil, no rung 2.

Without that filter, a widow's dead husband becomes the wrong answer to *"Which one is Margaret?"* on some Tuesday in week three. Disclosure of spousal death to a person with dementia produces worsening behavioural symptoms in 18.4% of cases and worsening depression in 26.0%, and because the memory does not consolidate, **each disclosure is experienced as fresh loss** — a spaced-repetition engine is precisely the mechanism by which that becomes systematic. It is enforced by a build-time assertion and by a headless walk over the whole state space, because "zero instances" is a per-path guarantee, not a statistic.

---

## 5. THE SCHEDULER, IN PLAIN LANGUAGE

Enough that a clinician understands it without reading the formal spec.

### 5.1 What it is

**Two ladders of whole numbers and a negative-feedback loop.** No memory model, no forgetting curve, no fitted weights, no probability, and no floating-point arithmetic anywhere. It **reacts** to the person; it does not **predict** the person.

That distinction is the whole design. A model-based scheduler exists to answer "when does recall probability cross the target?" — which is the question we are forbidden to ask, because targeting 90% retention means building a deliberate 10% failure rate into a photograph of someone's daughter.

**The within-session ladder** (seconds to minutes): 10 s, 20 s, 40 s, 80 s, 160 s, 320 s, 640 s. This is the published spaced-retrieval protocol and it is the regime every clinical SRT study lives in.

**The across-session ladder** (hours to days): same day (90 min), 1, 2, 4, 7, 14, 30 days. **Hard ceilings: 30 days globally, 7 days for core identity items.** Never Anki's hundred-year style ceiling — the evidence on long-term forgetting in AD is unresolved, so we assume neither a healthy nor a catastrophic curve and cap conservatively.

### 5.2 What it does when she gets one wrong

**It adds help. It does not change the interval.**

This is the single most important behavioural difference from every consumer spaced-repetition system. A miss supplies the answer immediately and warmly, and the item is re-presented **one rung easier at the same interval**. An ordinary scheduler shortens the gap and asks the same hard question again, which is the same difficulty delivered more often.

The asymmetry is deliberate: **support rises after one missed trial and falls only after two qualifying sessions.** The safety bias, expressed as 1 < 2. And there is **at most one support escalation per item per session** — a single bad afternoon cannot dump a photograph from free recall to exposure-only.

### 5.3 How it decides she got it right

Objectively, from four things it observes: whether the answer was correct, how much help was on screen, how long she took, and whether this was her first attempt. **She is never asked to rate herself.** No Again/Hard/Good/Easy, no confidence slider, no "did you get that?". Anosognosia is characteristic even in prodromal AD, and asking a person to rate their own failure is affectively hostile regardless of what it does for the algorithm.

Speech is never graded. Voice detection holds the clock while she is talking, but it never sees words and never determines correctness — error rates would be systematically worse for the more impaired participants, manufacturing a false decline signal, plus a dignity failure where the app tells someone they were wrong when the microphone was.

There is one further protection: a trial is **void** if the app was backgrounded, if it was flagged as interrupted, or if the response arrived implausibly fast. The doorbell goes, the caregiver puts the tablet down, and forty minutes later the runtime commits a timeout — without this rule that single event would demote her daughter's photograph one rung, contract her interval, and make the whole next session gentler.

### 5.4 What it can never do

- **It can never retire, suspend, drop or hide an item.** There is no leech threshold, no lapse counter, no auto-delete, no "mature card", and no interval above which an item stops appearing. **There is no lapse-count field in scheduler state at all** — the absence *is* the enforcement, because no code path can exist that reads a count and removes a photograph. Only a human retires an item.
- **It can never count a backlog.** A missed week produces a session identical in shape to a missed nothing — only the ordering inside it differs. An item overdue by ten days is **one** item, appearing once, at the front. The module exports no function returning a count of due items, so there is nothing a UI could render even by accident.
- **It can never surface a cognitive metric to anyone.** Its entire human-facing output is three signals: two to the caregiver's authoring screen, and one acute-change advisory.
- **It can never read a clock or use randomness.** Both are declared as injected ports and never called. That is what makes the server's recomputation byte-identical.

### 5.5 Where it ends up

As the disease progresses, misses accumulate, intervals contract and support rises. The design has one fixed point, and it is the right one:

> **Her daughter's photograph, with her name spoken warmly under it, once in every session, forever, with no question asked.**

There is no state below that and no code path removes the item.

### 5.6 Distress

Distress ends the session immediately — **it outranks the guaranteed-success closer**, because playing a warm ending to someone who has just become distressed is a safety rule applied where it does harm. The session is honestly recorded as not having ended on a success. The item that produced it enters an **absorbing state** and does not return until a human re-enables it, and the caregiver is told which item was set aside, so silent disappearance is impossible by construction. **None of the session's per-item changes are applied** — a session that ended in harm must not be allowed to expand an interval.

A distress report naming an unknown or deleted item **still ends the session**. The reading in which a bad identifier makes the whole event a no-op was rejected: it would mean a person in distress keeps being shown cards because of a typo.

### 5.7 The one thing it tells a human

An **acute-change signal**, and it is about physical illness, never about cognition. A sudden collapse in session performance is far more likely to be delirium — precipitated by infection, dehydration, constipation, pain or medication, with dementia as the major predisposing factor — than progression. Delirium is a **treatable medical emergency** and it is entirely absent from the source research corpus; this is the single largest omission the evidence review found.

The detector is model-free, built out of quantities the scheduler's own compensation cannot suppress (it watches how much *support* is being consumed, not only how many misses are recorded), rate-limited to once a fortnight, and behind a kill switch. Recipient: **the caregiver, never the patient, never a clinician.** Wording, always: *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."* Never a cognitive interpretation.

Its false-positive rate is unknown, six of its thresholds are invented, and the pilot must measure it — a detector that cries wolf at a carer with ~49% median burden prevalence is a harm, not a safety feature.

### 5.8 The honest weaknesses

Twenty-six constants in this scheduler were invented rather than derived. Twenty-two of them fail toward *more contact and more support*. The ≥95% success target is a judgement call, not a derivation — no dose-response curve exists for this population. The global drift term may never fire at real adherence rates. The slow-response threshold of 8 seconds may fire on most trials in a real cohort, in which case intervals essentially never expand and the design collapses to a fixed schedule.

For comparison: FSRS-6 carries 21 fitted weights plus a functional form plus a retention target, none clinician-inspectable, none ever fitted to a dementia cohort. And none of it produces a sentence a clinician can read:

> *"She saw Margaret's name six times today, at 10, 20, 40, 80, 160 and 320 seconds, with a first-letter hint, and she got all six — so tomorrow's gap moves from four days to seven, and next week we'll try it without the hint."*

---

## 6. ARCHITECTURE

### 6.1 Stack

**Expo SDK 57 (React Native 0.86 + react-native-web), single package, no monorepo, no Tailwind, Supabase as the only backend.** 21 runtime dependencies, 30 total manifest entries.

Every proposal in the platform debate independently concluded the care-home tablet must be native, which collapsed the question from *web or native* to *which native*. React Native beats a WKWebView shell on this product's specific hard parts: App Store guideline 4.2 (real `UIView`s, so the "repackaged website" reading is structurally unavailable), first-party microphone capture producing AAC on both platforms, direct file writes rather than base64 across the JS bridge, a database outside WebKit's storage jurisdiction entirely, and audio playback with **no gesture gate** — essential for a user who cannot follow a "tap to enable sound" prompt.

Three surfaces, one file tree: `(patient)` in React Native primitives, `(caregiver)` in RN primitives online-first, `(researcher)` in `.web.tsx` only — plain DOM, real `<table>`, real `<svg>`.

We are paying for this with react-native-web being in maintenance mode (mitigated by pinning, by keeping `src/domain` renderer-free, and by treating a stall as an accelerant for the native migration that was always the destination) and with agents being weaker at React Native than at DOM.

### 6.2 Offline

**Only the patient surface is offline-capable, and only on native.** Caregiver is online-first; researcher is read-only and online-only. This single scoping cut deletes a second storage implementation, a media cache path, a service-worker layer, and the permanent obligation to hold two storage backends behaviourally identical.

After every successful sync the tablet holds an SQLCipher-encrypted database and every media file its patients' cards reference, content-addressed by hash, in the app sandbox. **A card is never shown unless all its media are verified ready.** Consequence: **the patient session issues zero network calls, online or offline.** Offline is not a mode; it is the normal operating condition, which is the only way to be confident it works on day three — because it is what we test on day one.

**Hard expiry** is the theft-versus-offline dial: content is valid for 7 days past the last sync (configurable per care home, hard minimum 4), after which the tablet refuses to render and shows one screen. The requirement is three days; five times the requirement would be an unforced two-week window in which a stolen tablet keeps rendering residents' faces. **The outbox is never discarded at expiry** — expiry stops rendering, it does not destroy research data.

That one dial independently bounds three things: the stolen-tablet window, the maximum residency of an erased photograph on an unreachable device, and the maximum time-to-completion of a deletion request. One number, three guarantees, none of them retrofitted.

### 6.3 Sync — there is nothing to merge

One Edge Function, one round trip. Three kinds of data and three reasons no conflict is possible:

| Data | Writer | Conflict |
|---|---|---|
| Telemetry events | patient device only | none — append-only, immutable, UUID-keyed. ~90% of writes |
| Card content, media, consent | caregiver, online only | none — single writer, server-authoritative, pull-only on the device |
| **Scheduler state** | **nobody** | **eliminated by design** |

The third row is the best single idea the architecture debate produced. **Scheduler state is not stored and not synced.** The device computes a local projection to pick the next card offline; the server **recomputes it canonically** from the ingested event log by importing the same TypeScript module in an Edge Function. The server derives rather than receives, so there is no write to conflict with, no merge engine, no CRDT, and no second implementation of the scheduler to keep in step. Zero sync-engine dependencies is a property of this data model, not a preference.

**Telemetry is never lost.** The event row commits in the same transaction that advances the UI, so a mid-tap crash loses nothing and no state change can exist without its event. `event_id` is the server primary key with `on conflict do nothing`, so at-least-once delivery plus server dedupe equals exactly-once effect and retries are free. Rows are deleted only on per-ID ACK. Sequence gaps are detectable, so a researcher can distinguish "the patient did not respond" from "we lost the event."

**Clocks are not trusted.** Within-session latency is monotonic-clock deltas scoped to a boot. Cross-session ordering uses a server-anchored timestamp: one anchor per boot, wall-derived and monotonised, with the per-batch skew applied. A tablet offline for three days *will* have drifted, and getting this wrong silently corrupts the study.

### 6.4 Device authentication

The hardest security problem in the product, and three tempting answers are all wrong:

- **Not anonymous sign-ins.** A patient device is not an anonymous user; it is a known, enrolled, revocable device.
- **Not hand-minted JWTs.** The legacy shared secret is deprecated, and the service key is itself signed with it — an Edge Function able to mint device tokens is also able to mint god-mode tokens.
- **Not stored refresh tokens.** Outside a ten-second reuse interval Supabase terminates the whole session on reuse, and on care-home wifi a lost response plus a backed-off retry is indistinguishable from theft. The penalty is a permanently dead tablet in front of a resident with dementia, recoverable only by a caregiver walking over with a new enrolment code.

**What we do: the device is a real Supabase auth user whose password is a 256-bit device secret in the Keychain.** Every token acquisition is a plain password sign-in — idempotent, retryable forever, with no rotation state to lose. Enrolment is a one-time 8-character code, single-use under concurrency by atomic update, hashed at rest, TTL ten minutes.

The Keychain class requires a device passcode, so **the MDM passcode requirement becomes enforced in code rather than written in a deployment protocol nobody reads.** Policies key off the **device**, never the patient, and **the JWT never carries a patient id**. The device role holds `SELECT` on exactly two views and `INSERT` on exactly two tables — **zero `SELECT` on any base patient table, zero `UPDATE`, zero `DELETE`, anywhere.** A stolen tablet cannot alter or destroy one row of research data. **Three days offline does not touch auth at all**, because the patient session never needs a token.

### 6.5 Data planes

**An event-sourced operational core with a physically separated research plane published as immutable numbered releases.** Ten Postgres schemas, each a distinct grant boundary, with real Postgres roles rather than JWT string comparison — because if every logged-in user holds the same role, "de-identification is a missing grant" is a `WHERE` clause in disguise.

Three sentences carry the whole design:

1. **The append-only event log is the source of truth for everything a device observed**, and for the scheduler fold.
2. **Human-written facts — consent, capacity, adverse events, content, retirement, eligibility — are ordinary append-only rows with real `CHECK` constraints**, because every access decision is a predicate over a row, and a fold inside an RLS policy is unindexable and unwritable-blind.
3. **The research plane is a different set of tables with different rows, holding no uuid, no date, no free text and no media reference**, written by a one-way projector and readable only as immutable numbered releases.

The bridging role that spans identity and research **cannot log in** and is not granted to the authenticator. No login principal, and no pair of colluding login principals, can traverse the pseudonym map.

Four structural properties worth knowing before you touch this code:

- **The stimulus descriptor is frozen into the event at stimulus paint.** Every other design joined mutable content tables at projection time — so when Margaret dies in week 8 and the caregiver flips her status, weeks 1–7 of trials get re-stamped `deceased` and the safety audit reports dozens of incidents that never happened. Run the mirror case and a real violation silently disappears.
- **The research plane is not live.** A researcher polling hourly and recording when each row first appears computes the enrolment date from a single row, and a participant's rows stopping on a Tuesday tells them to the day that someone withdrew, lost capacity or died. So it is **published, not queried**, on a fixed cadence, with a participant entering only after 28 days of history, and every release citing a number so a paper's figures stay reproducible forever.
- **k-anonymity is a release gate, not an export-time hope** — and **deck composition is treated as a quasi-identifier**, because a 1940s spouse marked deceased, two 1960s children, an estranged sibling, a pet and a Welsh-language era photo describes exactly one participant.
- **Consent governs use, not receipt.** No consent predicate appears on event ingest. The failure it prevents was demonstrated end to end: a resident refuses on Monday, a caregiver records the dissent on Tuesday, and the tablet — offline since Sunday — can then never upload **the distress events that are the evidence for the dissent**.

### 6.6 Privacy

The differentiating asset is the asset that can never be moved. Full-face photographs and voice prints are irreducible identifiers — they cannot be hashed or blurred into compliance, **only removed**. When the only remedy for a category of data is removal, the architecture must default to removed: the research plane is an **allow-list** generated from a manifest, where every column carries a named pre-registered analysis or CI fails, not a deny-list where a new column is exposed unless someone remembers to exclude it.

**No face detection, face clustering, auto-tagging or voiceprint processing. Ever, in any jurisdiction.** No face template, embedding, descriptor, bounding box or speaker identifier column exists in any schema, by construction. Illinois BIPA carries a private right of action and per-violation statutory damages; the photographs contain relatives who are not users and never consented — including the caregiver whose own voice is on the narration, who holds their own release row. This kills the most obvious way to reduce caregiver burden, and that tension is resolved by **manual tagging with radically reduced item counts**, not by shipping the classifier and hoping.

**Deletion reaches four places** — Postgres, Storage, **the tablets**, and the research plane, where it means something different. The argument is that the log never contained an identifier: every row holds opaque uuids, tokens and integers, structurally enforced by a payload firewall and a 5,000-name fuzz test. Delete the map row and the derived estate is anonymised at the same instant, without a single `UPDATE`. This is a **legal position, not an engineering fact**, and it must be confirmed in writing before the pilot; the fallback is a documented, registered chain break.

**A deletion request has a stated maximum time-to-completion of 7 days**, after which the photograph is unrenderable even on a tablet that never reconnects. That number can go in a privacy policy and be defended under questioning. Anything stronger is a lie about physics: a device with no power and no radio cannot be commanded. **A restore is not complete until the erasure ledger has been replayed** — an untested restore that silently resurrects a deleted family photograph is the worst bug this product can have, and the disaster-recovery drill is a pilot gate.

**Subject-access export is redacted by requester, not by patient.** In a population where 34% of family carers report important levels of abusive behaviour, the hostile requester is the modal case. A full bundle would hand a controlling son documentary evidence of who asked for his removal, which staff member logged her behavioural refusal and what they wrote, and who marked his late father do-not-show. Ids are re-mapped per export so no value a family holds also appears in a research release, and every export request is logged where the requesting caregiver cannot read it.

### 6.7 The blind-agent contract

Test-writers who cannot see the implementation, implementers who cannot see the tests. This fails when the contract is prose and succeeds when it is executable artefacts both sides import:

`src/contract/` holds zod schemas that are simultaneously the type source, the runtime validator and the spec; port interfaces with zero implementation; **a frozen `testids.ts`** so the test-writer writes `getByTestId(ids.patient.stop)` and the implementer writes `testID={ids.patient.stop}` and selector drift is a TypeScript error on both sides at once; **the RLS expectation table as data**, written from the policy spec and never from the policies — because a test derived from a policy asserts whatever that policy happens to do, so a policy reading the wrong claim produces a green test encoding the bug; canonical fixtures; and in-memory fakes with exported conformance suites.

Four ESLint rules hold the whole design up: `src/domain/**` may not import react, react-native, expo or supabase; the researcher surface is `.web.tsx` only; `no-restricted-globals` bans `Date`, `Math.random`, `crypto`, `fetch`, `window` and `document` inside the domain — six lines of config, and it is what makes blind-written tests deterministic instead of flaky; and the patient UI may import only `View`, `Image`, `Text` and `Pressable`, so no icon component exists to import.

Any change to `src/contract/**` requires a `contract:` commit prefix and explicit human review. Freezing is a process, not a wish.

---

## 7. WHAT V1 DELIBERATELY DOES NOT INCLUDE

This section matters as much as the rest. Most of what is missing is missing because building it would cause harm, not because we ran out of time.

**No clinician-facing anything.** No cognitive status, no trajectory, no progression-drift chart, no baseline assessment, no MMSE or MoCA item anywhere in the codebase including "inspired-by" screens. *Why:* adaptive software informing clinical decisions is a medical device; the regulator draws the line at the **behaviour**, not the display, so a built-but-hidden layer is a weaker position than never having built it. The written regulatory opinion has not been obtained.

**No caregiver progress dashboard.** No score, percentage, accuracy chart, declining trend, streak, due-count or backlog, to anyone, ever. *Why:* awareness of deficit longitudinally predicts depression onset; REMCARE's authors named "disappointment when improvements did not persist" as a probable carer-harm mechanism; and in a population where the dashboard-holder is behaving abusively in roughly one case in three, reframing "accuracy trends" as "good moments" is a copy change proposed as a solution to a measured psychological effect. The dashboard reports **moments and actions**.

**No streaks, points, badges, coins, mascots, confetti, leaderboards or childish illustration.** *Why:* gamification enjoyment evidence is GRADE low; the single study that measured adherence found the **control group adhered better**; one found gamified cognitive training *more frustrating* than plain puzzles. And the mechanism that makes streaks work — loss aversion over a possession — punishes symptom expression in a progressive illness.

**No self-rating.** No Again/Hard/Good/Easy, no confidence slider, no "I knew that / show me again". *Why:* anosognosia is characteristic even in prodromal AD, and this was the source corpus's own single largest unvalidated assumption.

**No inferred emotion, affect, distress or abuse classifier.** No camera-based emotion read, no prosody-driven silent adaptation, no behaviour-shaping engagement engine. *Why:* EU AI Act Art. 5(1)(f) and 5(1)(b), in force since February 2025 — and because unauditable adaptation destroys attribution. Bad ethics and worse measurement.

**No face detection, clustering, auto-tagging or voiceprint.** *Why:* §6.6. This is why the deck is capped at 8–10 items rather than a whole album.

**No AI-generated factual content reaching the patient.** TTS reads family-typed text; no generative captions, no generative prompts. *Why:* a hallucinated fact, presented answer-first under an error-avoidant regime, **would be consolidated by design** — an iatrogenic mechanism unique to this product.

**No always-on microphone.** *Why:* a continuously open microphone on a person enrolled by consultee advice is the sharpest consent edge in the product, and the interview yields the same speech corpus with a defensible consent story.

**No date-driven content surfacer** ("this day, that year"). *Why:* it will eventually surface a death anniversary, and the cheapest way to guarantee zero instances is not to build it.

**No patient-facing roster of residents.** *Why:* nothing establishes that self-recognition from a photograph is preserved in this population, and a wrong tap opens another resident's family photographs to the wrong person — a confidentiality event that also writes one person's data under another's pseudonym, corrupting two participants at once. Replaced by a staff handover screen behind a passcode, a reversible first page, and an abort that **quarantines** rather than attributes the session's rows.

**No video, no VR, no indirect input, no scrolling, no modals, no page transitions, no A/B testing on the patient surface.** *Why:* interface learning in dementia is procedural and binds motor sequences to spatial positions, so the surface is **frozen per participant for the study duration** — including the typeface, which is bundled at a pinned version, because an iOS update that reflows a name mid-study is a protocol deviation delivered by Apple, unlogged, to a subset of participants.

**No PCA or svPPA participants.** Not "difficult" — **contraindicated**. Posterior cortical atrophy causes difficulty recognising faces and objects in pictures; semantic-variant PPA destroys word and object meaning, so drilling person-knowledge drills the system being destroyed. A row asserting eligibility with two PCA positives **cannot be committed by any code path**, including the service role.

**Deferred, with the trigger named:** a standing-answer surface for repetitive anxious questioning (if the distress register demands it); a respite mode (if carer-burden telemetry says respite is the binding constraint, and only with the spoken promise about a human's return removed); wayfinding video (v2, when a video pipeline pays for itself across more than one mechanic); pocket answers for safety facts (v2, when a review-cadence owner exists — highest clinical score in the whole catalogue, blocked on maintenance rather than evidence).

**The test any future addition must pass: it adds no new patient-facing shell and no new required content type.**

---

## 8. SUCCESS CRITERIA

The pilot is a **feasibility, safety and mechanism study. It cannot produce an efficacy signal**, and any efficacy claim from it is pre-emptively forbidden in the protocol. Effects appear only above ~60% persistence or ~80% adherence; iCST managed 40%; detecting the active-control effect size would need 356 participants per arm.

### Tier 1 — Safety (any failure here stops the product, not just the pilot)

| # | Criterion |
|---|---|
| S1 | Distress events in **<5%** of completed sessions, with exact confidence intervals |
| S2 | **Zero** catastrophic reactions attributable to the app, independently reviewed |
| S3 | **≥99%** of sessions terminate on a success or a warm answerable prompt — computed from telemetry, not from intent |
| S4 | **Zero** instances of a deceased person surfaced in a recognition mechanic without an explicit caregiver decision. Any instance is a serious incident |
| S5 | Carer anxiety **does not worsen** baseline to end of pilot, pre-registered with an equivalence margin, reported regardless of direction. REMCARE found the opposite; we must be able to detect it |
| S6 | **Zero** participants continue after expressed dissent |
| S7 | Suspected-delirium notifications: **≥1 verified true positive and a documented false-positive rate**, with GP contact outcomes tracked |

S3 and S4 are not audited hopefully — they are **exhausted**. A headless agent walks the full patient state space and asserts that every terminal state is closedown, that success is recorded on 100% of paths, that the timeout end-reason is unreachable, and that every generated two-photograph trial has a living, revalidated, media-ready foil.

### Tier 2 — Feasibility and adherence (the realistic deliverable)

| # | Criterion |
|---|---|
| F1 | **≥60%** of dyads complete ≥1 session per week for ≥8 consecutive weeks (segment-window; benchmark iCST 40%) |
| F2 | **<20%** of dyads deliver **zero** sessions (iCST: 22%). The single most predictive early number |
| F3 | A usable deck in **≤10 minutes** of caregiver time, median, instrumented including physical-photo capture |
| F4 | Non-usage and dropout attrition reported **separately**, with curve shape classified. A single completion percentage is not acceptable |
| F5 | **≥50%** complete ≥4 of the first 7 probe days (benchmark 92% in a cognitively-unimpaired sample; a large gap is itself the finding) |
| F6 | Median caregiver authoring **≤5 min/week** after week 1, and not increasing |
| F7 | Recruitment yield and time-to-target documented, with the failure mode named in advance |

Adherence is defined on a **flexible window** ("this week"), never a deadline ("today by 6pm") — segment adherence runs 78.8% and stable where subsegment adherence runs 60.6% and decaying, same participants, same protocol. That is the cheapest single adherence win available.

### Tier 3 — Mechanism (what we can actually learn)

| # | Criterion |
|---|---|
| M1 | Per-item retention curves fitted to real dementia review data — **the first such dataset**, publishable regardless of direction |
| M2 | Pre-registered A/B: personal vs generic content. Primary outcome **words spoken**, not accuracy. Within-participant, randomised per session |
| M3 | Pre-registered A/B: errorless vs spaced-retrieval on face–name pairs. Per participant, frozen at enrolment |
| M4 | **≥80%** of tier-1 items still recallable at cue level ≤1 at week 12. This is the deck-as-promise claim; if it fails, the honest claim fails |
| M5 | **A published distress register** — the field's first systematic adverse-event data for a memory intervention |
| M6 | Within-person change reliability estimated in our own cohort. Assume ~0.6, not ~0.95. Below 0.5, no within-person trend claim is supportable at any horizon |

Randomisation of *content* is not A/B testing of the *interface*: the interface freeze governs layout, wording, icon, colour and position, and swapping which photograph appears moves no button.

### Tier 4 — Commercial and honesty

| # | Criterion |
|---|---|
| C1 | **≥40%** month-6 retention among dyads who complete week 4 |
| C2 | Willingness to pay validated **against the honest claim** — the sales page used in the pilot must be the compliant one |
| C3 | **Zero** statements failing the banned-claims audit. Automated claim-lint gating release |
| C4 | **≥90%** of caregivers state, unprompted and in their own words, that the app will not slow the disease. Therapeutic misconception is a design problem, not a disclaimer problem — a wrong answer is corrected, not recorded and ignored |

---

## 9. THE BLOCKERS THAT GATE REAL PATIENT RECRUITMENT

Named, owned, and gating. These are not open questions; they are things that must close before specific steps.

**Absolute prerequisites — no patient may be enrolled until these are closed:**

| # | Blocker | What it gates |
|---|---|---|
| **B5** | **REC/IRB approval, full board** (cognitively impaired population, intrusive research under MCA ss.30–31). Also required: written confirmation that adverse-event retention survives research-consent withdrawal | All study data collection. **Months of lead time, no engineering workaround, and a hard App Store submission blocker under guideline 5.1.3(iv).** Start in week one or discover it in week twenty |
| **B6** | **PPI panel** with people living with dementia (DEEP / EWGPWD / JLA) | The v1 mechanic freeze. The frozen set is made from other documents; it is the freeze we take to that panel, not the freeze that survives it. **It must run on native hardware, on a stand, in a real day room** — the web build is the one build where the programme does not autoplay |
| **B1** | **Written MHRA/FDA opinion**, scoped to the delirium notifier | An algorithm detecting acute change and telling a family to ring a GP is software providing information for a diagnostic decision, and it triggers real-world clinical action. Missing delirium is the biggest real-world harm in the product, so it cannot be deferred |
| **B3** | **US state biometric opinion** (BIPA/CUBI/Washington) covering photographs of non-user third parties — **and explicitly scoped to aggregated prosodic features, not only templates** | The content pipeline, and whether the speech-feature block ships at all |
| **B2** | **UK health/social-care information-governance position** (DCB0129/0160, DTAC, DSPT, Cyber Essentials), joint controllership and DPA with any deploying provider; plus written confirmation of the erasure position | Any care-home or NHS-adjacent deployment. Typically procurement blockers with months of lead time |
| **B4** | **EU AI Act Art. 5 assessment** of the notification behaviour and any distress signal | Any adaptive nudging, any distress detection |

**Evidence and integrity blockers — gate publication and any external claim:**

**B7** trial-registry search for unpublished, discontinued and null trials — publication bias is named as a systemic weakness in four source documents and mitigated in none. **B8** Cochrane full texts and Summary of Findings tables read directly, because every GRADE rating in the corpus came from an abstract, which is how it missed a bias-adjusted null and a moderator that was measured only in MCI. **B9** the self-reference-effect literature — cited in **zero** source documents, mixed-to-negative in AD, and the product's central hypothesis (personal content is retained better) has **no supporting citation anywhere**. **B10** competitor privacy policies actually read, plus churn and willingness-to-pay data — no competitor policy was read anywhere in the corpus, so any privacy-differentiation claim is currently unevidenced. **B11** suicide and acute crisis risk around diagnosis, particularly younger-onset, named nowhere in the safeguarding sections despite this being a daily touchpoint with a recently diagnosed person. **B12** the care-home operational model: who holds the account when the carer is paid staff (paid carers cannot be personal consultees), staff turnover, shared devices, infection control, DoLS/LPS, and activities budgets against a family subscription. **B13–B16** unresolved citations, journal-quality flags, conference abstracts cited as journal articles, and conflict-of-interest scrutiny applied to our own strongest evidence with the same standard we applied to a competitor's.

**Engineering gates, week one:**

- `eas build --platform ios` green in CI, TestFlight internal in month 1. This front-loads provisioning, privacy manifests, permission strings, and MDM/Guided Access provisioning in an actual care home — the things that kill pilots.
- Prove that custom Postgres roles are honoured end to end by PostgREST on the target plan, in a throwaway project. Everything in the grant map rests on it. **A split-plane design whose planes are separated by a `WHERE` clause is worse than an honest single-plane design, because it claims a guarantee it does not have.**
- Independent security review of the device auth path and the ingest canonicaliser before either touches a real patient.
- Choose the App Store distribution model (Business Manager Custom App or unlisted) **before the first submission** — a private app cannot later be flipped to unlisted; that requires a new app record.
- Disaster-recovery drill including erasure-ledger replay.

**And the standing warning:** recruitment failure, not effect size, is the most common way a pilot like this dies. The most likely single cause of overall failure is none of the above — it is that eight research documents studied how to make families use this, and **none studied whether they want it.** The one systematic review that asked found stated priorities are safety, independence, medication reminders, communication and scheduling, and that **memory training and reminiscence are not prominent among desired functions.**

---

## 10. OPEN CONTRADICTIONS BETWEEN THE GOVERNING DOCUMENTS

These are unresolved conflicts *between* binding documents, not weaknesses within one. Each needs an owner's decision before the affected code is written.

| # | Conflict | Where |
|---|---|---|
| **C-1** | **The global drift term.** The product shape formally amends the synthesis to **remove** the trailing-14-day, cross-item, global difficulty step from the v1 runtime, arguing that the adaptation — not the display — is the regulatory trigger. **The scheduler spec implements it in full** (`driftLevel` 0–2, altering opening cue, across-rung, ceiling and within-session start rung) and reports the requirement "Satisfied", citing the synthesis and never mentioning the amendment. Both documents are frozen. **This is the most consequential open conflict in the corpus and it has regulatory teeth.** | PRODUCT-SHAPE §8.3 vs SCHEDULER-SPEC §14, §24 row 10 |
| **C-2** | **The probe's cue level.** The scheduler spec states each probe trial "opens at cue level 0, one uncued attempt", and the synthesis requires "the first uncued attempt" to be recorded. The design system renders the probe in the **two-picture (2AFC recognition) state**, because in a tap-only product with no ASR grading a genuinely uncued recall cannot be captured. It flags the seam; it does not close it. This changes what M3 measures. | SYNTHESIS §5.2.3, SCHEDULER-SPEC §16 vs DESIGN-SYSTEM §8.7, §14.1 |
| **C-3** | **`session_end_reason` is a closed union in the frozen scheduler contract** (`budget_time`, `budget_trials`, `roster_exhausted`, `user_ended`, `distress_stop`, `abandoned`, `app_crash`). The design system's amendment A6 adds four values (`battery_truncated`, `audio_unavailable`, `content_expired`, `wrong_resident`) to the frozen telemetry spec. The amendment has not propagated to the scheduler contract, so the design system's own end reasons cannot currently be carried on a `SessionEnded` event. | DESIGN-SYSTEM §3 A6 vs SCHEDULER-SPEC §4.1 |
| **C-4** | **The patient-facing roster.** The platform ADR's frozen repo layout contains `app/(patient)/roster.tsx` — "shared mode: face grid (first name + photo)" — and §5.2 describes tapping a face as a client-side selection. The design system removes the patient-facing roster **entirely** and relocates it to `app/(staff)/handover` behind a Guided Access passcode. | ADR-PLATFORM §9, §5.2 vs DESIGN-SYSTEM §8.9 |
| **C-5** | **The bad-day branch spans different steps in three places.** The product shape says steps **4–8** are replaced (which removes the song on unprimed sessions). The design system's amendment A5 says **4–7** and that the song always plays. The design system's own §9.2 then says **5–8**. Three ranges, two documents, one of them internally inconsistent. | PRODUCT-SHAPE §4 vs DESIGN-SYSTEM §3 A5 vs §9.2 |
| **C-6** | **Interview copy.** The frozen product shape's step 7 wording is *"I love this one — what was going on here?"*. The design system deletes that sentence from the product on the grounds that the app cannot see the photograph and must not profess a feeling, and declares the deviation. Frozen text vs binding design system. | PRODUCT-SHAPE §4 step 7 vs DESIGN-SYSTEM §7.2 |
| **C-7** | **Card count vs the 6–10 rule.** The synthesis requires 6–10 items in rotation and the scheduler plans a roster of up to 8; the design system's dwell floors permit **6** cards at the standard dwell and **5** at the long dwell inside a ten-minute session, carrying the remainder to tomorrow. The carry-over is a runtime behaviour the scheduler does not model — unpresented roster items simply age. | SYNTHESIS §6 req 8, SCHEDULER-SPEC §11 vs DESIGN-SYSTEM §8.2 variation 2 |
| **C-8** | **Session-success accounting.** The scheduler records `endedOnSuccess = false`, honestly, for distress, abandonment and crash closes. The design system's exhaustion assertion states success is true on **100%** of paths. The two are reconcilable only if the walked state space excludes distress closes, which is not stated. | SCHEDULER-SPEC §12.3, §15.1 vs DESIGN-SYSTEM §12.7 A39 |
| **C-9** | **The proverb mechanic's microphone.** The product shape lists it as having no microphone and no storage, and also as the acute-change floor sentinel — which requires listening. The design system names this contradiction inside the frozen document and resolves it by opening the microphone for features only. The resolution is sound; the frozen text still reads both ways. | PRODUCT-SHAPE §2.1, §5 vs §4 step 2; DESIGN-SYSTEM §8.4 |

**Resolution rule until an owner decides:** the synthesis wins on evidence and safety; the product shape wins on scope; the design system wins on anything rendered; the scheduler spec wins on anything folded; the ADRs win on anything stored or transmitted. Where that rule does not resolve a row above — and for C-1 it does not, because the conflict is between a frozen amendment and a frozen contract — **stop and escalate rather than picking one.**
