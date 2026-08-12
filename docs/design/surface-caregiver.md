# CAREGIVER SURFACE — DESIGN

**Status:** Design, submitted for review. Not frozen.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles, §9 NEVER DO, §1 hardest truths — binding), `docs/design/00-V1-PRODUCT-SHAPE.md` (the frozen six, the day-1 ask, §9 enrolment screening), `docs/architecture/00-ADR-PLATFORM.md` (§5 device auth, §7 styling, §8 media, §10 distribution).
**Reference devices:** the caregiver's own phone (iPhone/Android, 390 × 844 pt reference) and the same app in a desktop browser at ≥1024 pt. Online-first, no offline promise (ADR §4.1). Portrait and landscape both supported; nothing is orientation-locked here — that is a patient-surface rule.
**Invents nothing.** Every screen below renders a decision already made in the three governing documents. Where I have made a new decision I say so and defend it in place.

---

## 1. THE SURFACE IN ONE SENTENCE

> **A short, plain, interruptible setup that leaves a working product behind at minute two, asks for eleven things in nine minutes, and then almost never speaks to you again — and a family-facing page that contains her voice, her photographs and things she said, and contains no number about her memory anywhere, ever.**

---

## 2. THE THREE CONSTRAINTS THAT SHAPE EVERY SCREEN

Everything in this document is downstream of three facts, and they pull in different directions.

### 2.1 One sitting, from a person who has no sittings left

~49% median burden prevalence, 75.9% reporting at least mild burden (§3 #51). Carers describe technology as *"mentally they are already overburdened."* Online Life Story Book required **~5 volunteer visits over 8–10 weeks** and produced **d = −0.03** (§1.1). P29 says a usable deck must be reachable in **one sitting of ≤10 minutes with ≤10 items**; F3 makes it a measured, not estimated, success criterion.

HCI implication 54 puts the ceiling on a caregiver authoring sitting at the **30–35 minute** fatigue threshold measured with people living with dementia (§6.4). Our whole first sitting, end to end, is designed at **~17 minutes** — half the ceiling — and the F3-measured deck portion inside it is **~9 minutes**. §3 states both numbers and does not conflate them.

### 2.2 It must keep working when they stop, because they will stop

**22% of iCST carers delivered zero sessions. Only 40% managed ≥2/week** (§1.1). In the Online Life Story Book trial, self-rated carer distress went **38.9 → 31.8 at 3 months → 44.7 at 6 months — above baseline** — once the volunteer withdrew. Withdrawal of support is not an edge case; it is the modal ending, and the previous generation of products got *worse than useless* at that point.

Therefore the governing rule of this surface:

> **There is no screen in this product whose purpose is to get the caregiver to come back.**

No streak, no completion percentage on the home screen, no "finish your setup", no re-engagement email, no badge, no push notification of any kind except the one in §11 that is about a suspected physical illness. P6 and ND-28 forbid the guilt versions. This document goes further and forbids the *cheerful* versions too, because the mechanism is identical and the population is one where non-use is partly a symptom (§1.9, apathy) rather than a behaviour to be corrected.

The product's answer to disengagement is not a nudge. It is §3: **the app runs a complete session from a birth year alone**, so a family that goes silent at minute two owns a working thing rather than a broken one.

### 2.3 The person holding this screen is, in roughly one case in three, the risk

**52% (95% CI 46–59%) of family carers of people with dementia newly referred to mental health services report some abusive behaviour toward the person; 34% (27–40%) report important levels** (Cooper et al., §3 #50). §1.8 states the consequence plainly: *"The dashboard-holder is, in roughly one case in three, already behaving abusively. Reframing the dashboard from 'accuracy trends' to 'good moments' is a copy change proposed as a solution to a measured psychological effect in a population where the modal case is not benign. That is not a UI problem."*

I accept that sentence as a rebuke to the obvious design and §9 answers it structurally, not with copy. The short version: **the family surface renders no fact about her performance and no fact about her participation, at any resolution, ever** — and the one family-facing feed that does exist runs on a 48-hour delay specifically so that it cannot be used as a daily compliance instrument.

---

## 3. THE EXACT DAY-1 MINIMUM, AND THE CLOCK

### 3.1 Three thresholds, and the first one is at minute two

| Threshold | What it costs | What the patient gets |
|---|---|---|
| **Absolute minimum — the product exists** | **One picker: her birth year.** ~15 seconds. | A complete session: two overlearned sayings (M-35), 30 s of a song from her late teens (M-56), the ≤8-item generic probe, the closer, fade to rest. Steps 2, 3, 6, 8, 9, 10 of the frozen walkthrough. Nothing personal, nothing broken. |
| **Personal minimum — her own family appears** | **Four photographs and a birth year** (§3, verbatim). | All of the above plus the Camp block, the narrated album, and "tell me about this one" on her own photographs. |
| **Day-1 target — the eleven things** | **Three profile answers and eight photographs.** | Full deck, era-ordered sequencing, a real month-target slot. |

**The birth year is captured in the first ninety seconds of the flow and never later.** This is the single most important sequencing decision on this surface. From that moment the family is not building a product; they are improving one that already runs. Every subsequent screen is optional in the strict sense that abandoning it leaves a working session on the tablet.

### 3.2 The eleven things

Per `00-V1-PRODUCT-SHAPE.md` §3, unchanged:

| What | How many | How it is entered here |
|---|---|---|
| Birth year | 1 | Wheel picker, decade-jump, default centred on 1940 |
| Where they grew up (town/region) | 1 | One line, free text, optional to skip |
| First language | 1 | Picker, English/Welsh/Polish/Punjabi/Urdu/Bengali/Gujarati/… + search |
| Photographs | 8 | Camera roll multi-select, or phone capture of a paper print |
| — who it is | per photo | **Typed. The only typing in onboarding.** Autocompletes across the deck. |
| — relationship | per photo | Chip row |
| — roughly which decade | per photo | Chip row, **pre-selected from EXIF where present** |
| — living / died / not in touch / please don't show | per photo | Chip row, **mandatory, no default, cannot be skipped** (P16, ND-12) |
| Era and theme blocklist | 1 screen | Tick-boxes (P17) |

**Nothing else is asked on day one.** In particular: **no sentence is authored per photograph.** §4.2 explains why and where the sentence actually comes from.

### 3.3 The clock, stated honestly in two numbers

F3 measures *"a usable deck (≥10 items) created in ≤10 minutes of caregiver time."* That clock covers profile + photographs + blocklist. It does not cover consent, screening or device enrolment, which are the study's cost and not the deck's. I am not going to quote the small number and let the reader think it is the whole sitting.

**F3 clock — the deck — target median 8 min 45 s, hard ceiling 10 min:**

| Step | Target |
|---|---|
| Profile: birth year, town, first language | 60 s |
| Choose 8 photographs | 90 s |
| Label 8 photographs (4 fields each) | 330 s |
| Era and theme blocklist | 45 s |
| **Deck total** | **8 min 45 s** |

**Whole first sitting — target ~17 minutes, ceiling 30 (HCI §6.4):**

| Step | Target |
|---|---|
| Sign up, magic link, return | 60 s |
| Who is this for — first name + **birth year** | 40 s |
| The honest claim + comprehension answer (C4) | 90 s |
| Consent pathway + declaration | 120 s |
| Screening — 14 questions (§7) | 100 s |
| Device mode | 20 s |
| Device enrolment, 8-character code | 90 s |
| *(the deck, above)* | 8 min 45 s |
| **Total** | **≈ 17 min 25 s** |

**Every one of these is instrumented, not estimated** (F3). The onboarding timer runs on wall-clock elapsed *inside* each screen, pauses on backgrounding, and is reported as a distribution, not a mean — because the family that takes 40 minutes is the finding, not the outlier.

### 3.4 The recurring ask

> **One sentence a month.** Reviewed, not written: the common case is one tap on "still true".

That is the entire ongoing obligation. F6 caps authoring at ≤5 min/week; this is roughly one minute a month. §10.3 designs the review. The headroom is deliberate and §1.8 is the reason: every trial that increased carer load increased carer harm, and this is the one axis where we can afford to be extravagant.

---

## 4. THE FLOW, AND HOW IT SURVIVES BEING ABANDONED

### 4.1 It will be abandoned. Design for the return, not the completion.

Twelve commit boundaries. **Every one writes to the server on the tap that produced it.** There is no wizard state held in memory, no "save and continue" button anywhere in the product, and no screen that can lose work by being closed (WCAG 2.2.6; HCI implication 51).

```
  1  account created ─────────────────────────────┐
  2  first name + BIRTH YEAR   ◄── product works ──┘
  3  comprehension answer submitted
  4  consent pathway recorded
  5  each screening answer (×14, one commit each)
  6  screening submitted ──────► PAUSE POINT (§7.4)
  7  device mode chosen
  8  device enrolled  (or explicitly skipped)
  9  town + first language
 10  each photograph added        (×8, one commit each)
 11  each photograph labelled     (×8 × 4 fields, one commit each)
 12  blocklist submitted
```

Rules that make resumption free:

1. **No password, ever.** Supabase magic link only (ADR §5.4). A returning caregiver taps a link in an email. There is nothing to remember, nothing to reset, and no social login (which also means App Store guideline 4.8 never fires).
2. **Return always lands on Home (§10), never inside the wizard.** Re-entering a half-finished form at the field you left is disorienting; re-entering at a stable, familiar place with one card on it is not.
3. **Home shows what exists, never what is missing.** There is no checklist with eight unticked boxes on it. §10.1 gives the exact copy.
4. **Redundant entry is a bug** (WCAG 3.3.7). Nothing is asked twice. Names autocomplete across the deck; the decade chip is pre-selected from EXIF; the person's first name is substituted into every subsequent question so the family never re-types it.
5. **In-flow progress is bounded and visible** — "Photograph 3 of 8" — because COGA requires current-step-plus-remaining for a task in progress. **Out-of-flow progress is never rendered**, because a percentage on a home screen is a nag with a progress bar drawn round it.

### 4.2 Where the "one true sentence" comes from, and why it is not on this list

M-27's item schema is *photo + name + relationship + one sentence*. The day-1 ask does not contain a sentence. That is not an omission.

> **For every card in the deck, the sentence is composed from the two fields the family already typed: `"This is your daughter Sarah."` The only human-authored sentence in the product is the single M-25 month-target.**

This is the §2.3 derivation principle applied to content instead of to cue rungs, and it is what keeps the deck inside nine minutes. Eight authored sentences at ~45 seconds each is six minutes — two thirds of the entire F3 budget — spent on prose that a template produces identically.

It is not AI-generated content and does not engage P19 or ND-16: it is a fixed template over fields a human typed, with no model in the path, no inference, and no fact that the family did not supply.

---

## 5. SIGN-UP

**Screen: `caregiver/join`**

One field: email. One button: *Send me a link.* Below it, in body text, not in a footer: who we are, that this is a research study, and the name and phone number of the study coordinator.

- **No password field.** ADR §5.4: magic link, no social providers.
- **No "create account" vs "sign in" fork.** One email box; the link works either way. A fork here costs a decision from someone who has none spare.
- **The link does not expire in a way that punishes.** If it has expired, the landing page says so and re-sends without asking for the address again.

**Screen: `caregiver/who`** — the second screen, and the most important one in the flow.

> **Who are we doing this for?**
> Their first name. *(One text field.)*
> The year they were born. *(Wheel picker, decade-jump.)*

Then, on the same screen, below the picker, in body text:

> *That is enough to start. From now on the app can play [Margaret] a song from when she was seventeen and two sayings she has known all her life. Everything after this makes it better; nothing after this is needed to make it work.*

Only the first name is collected. No surname, no date of birth, no address, no NHS number — none of it is needed by any mechanic, and every field we do not hold is a field that cannot leak (§1.11).

---

## 6. THE HONEST CLAIM, AND THE COMPREHENSION CHECK

**Screen: `caregiver/what-this-is`** — one screen, before consent, before screening, before anything is asked of the family.

C4 is a Tier-4 success criterion: **≥90% of caregivers correctly state, unprompted, in their own words, that the app will not slow the disease.** §1.5 and HCI implication 56 both say the same thing — therapeutic misconception is a design problem, not a disclaimer problem, and a family that expects disease modification will be harmed by disappointment and may over-pressure the patient.

The screen has three parts, in this order.

**Part 1 — what it is.** Four short sentences, lower-secondary reading level (WCAG 3.1.5 AAA), each on its own line:

> This is a ten-minute activity you can do with [Margaret]'s own photographs.
> It plays her a song from her twenties, shows her people she loves and says who they are, and asks her to tell it about one picture.
> It practises a handful of names and one sentence that matter most this month.
> That is all it is.

**Part 2 — what it is not.** Set in the same size and weight as Part 1, never smaller, never in a collapsed panel:

> It will not slow [Margaret]'s dementia down. It will not stop it, treat it, or turn it back.
> It will not improve her memory in general, her thinking, or how she manages day to day.
> Nothing it teaches her will carry over to anything it has not practised.
> If she stops using it, whatever it taught her is not expected to stay.
> **We have not tested this app. The three studies closest to it did not work.**

That last line is not a legal hedge, it is §2.1's own final clause and it belongs in front of the person paying.

**Part 3 — the check.** One text box:

> **In your own words: what do you think this will do for [Margaret]?**

On submit, the correction frame is shown to **every** family, regardless of what was typed:

> Thank you. Here is what we can honestly say, so that we and you are holding the same thing: *[Part 1, repeated verbatim.]*

**The app does not grade this answer.** There is no classifier reading a family's hopes about their mother and returning a verdict — that would be exactly the kind of inference P18 exists to forbid, aimed at the wrong person. The free text is stored in the content plane and **hand-coded by the study clinician** in the same review as the screening (§7.4). C4's ≥90% is measured from that human coding. A family whose answer shows therapeutic misconception is telephoned and the frame is corrected by a person — §9 of the product shape requires that a wrong answer be *corrected, not recorded and ignored*, and only a human can do that.

---

## 7. THE SCREENING

P26 requires eligibility gated by **subtype**, not severity band. ND-35 forbids enrolling PCA or svPPA into photo/face mechanics. ND-24 forbids an onboarding "baseline assessment" that reads as a screen — the ASA upheld a complaint against GMRD Apps on an *implied* assessment.

> **These questions are about the caregiver's observations of everyday life. They are never administered to the patient, never scored to the family, never described as a test or an assessment, and no cluster is ever named on screen.**

### 7.1 The framing screen

**Screen: `caregiver/about-her/intro`**

> **A few questions about how [Margaret] is, day to day.**
> There are no right answers and nothing here is a test of her. Some kinds of dementia change how the brain handles pictures and words, and for those kinds this app is the wrong thing — not just harder, but wrong. These questions help us find that out before we take up any more of your time.
> Fourteen questions. About two minutes. You can stop and come back.

The words *test*, *assessment*, *screen*, *score*, *baseline* and *eligibility* do not appear anywhere in this section of the product.

### 7.2 The fourteen questions

One question per screen. Three buttons, always the same three, always in the same position: **Yes** · **No** · **Not sure**. Each tap commits and advances. A back control returns to the previous question with the previous answer still selected.

Questions are `00-V1-PRODUCT-SHAPE.md` §9 Gate 2, with the person's own name substituted (HCI implication 26 — use the person's vocabulary, not "Relative #2"; it also measurably improves answer quality, because a family answers about Margaret more accurately than about "the patient").

**Cluster A (never labelled on screen):**
1. Does [Margaret] have difficulty recognising objects or people **in photographs**, even when she can see them perfectly clearly?
2. Does she reach for things and miss, or misjudge distances — pouring, doorways, stairs?
3. Has she had trouble reading a line of text or keeping her place on a page, when her eyesight has been checked and is fine?
4. Was difficulty **seeing or reading** one of the first things you noticed — before memory?

**Cluster B (never labelled on screen):**

5. Does she ask what a common word means ("what is a colander?")?
6. Has her speech become fluent but empty — plenty of "thing" and "that one", few specific names?
7. Does she have trouble recognising what an everyday object is **for**, not just what it is called?
8. Was **word meaning**, rather than forgetting recent events, the first thing to change?

**Cluster C (never labelled on screen):**

9. Does her alertness change markedly within a single day — sharp for an hour, very confused an hour later?
10. Does she see people or animals that are not there?
11. Does she act out dreams, shout, or move a great deal in her sleep?
12. Has she fallen or fainted without an obvious cause?

**Two single questions:**

13. Any suspected infection, recent hospitalisation, or new confusion in the last two weeks?
14. Have her sight and hearing been checked in the last twelve months, with any correction she needs in use?

**A running count is never displayed.** No "3 of 4 in this group", no colour change, no summary at the end. A visible tally would be a score (ND-5's family), and it would let a family that wants in reverse-engineer the arithmetic and answer to it.

**Gate 1** — diagnosis of record — is asked once, before question 1, as an optional single line: *"If [Margaret] has a letter from a memory clinic, what does it say the diagnosis is? Leave this blank if you don't have one — most families don't."* Free text, never a picker of subtypes, because a picker of subtypes is a diagnostic instrument on a family's phone.

### 7.3 "Not sure" is a first-class answer

An exhausted person who does not know is worse served by being made to guess, and a forced binary here manufactures data. **"Not sure" counts as *not positive* in the instant arithmetic and routes the whole questionnaire to expedited clinician review.** It carries no penalty and no follow-up question.

### 7.4 What happens at the end — the pause point

This is the most carefully constructed transition in the flow, and it is built around one sentence in §9 of the product shape:

> *"A named study clinician reviews every Gate-2 questionnaire before enrolment. Family self-screening alone is not sufficient for an exclusion decision of this consequence."*

Read literally — and it should be — that forbids the obvious design, which is to compute the arithmetic and tell the family "not eligible" on the spot. **The app therefore never renders an eligibility verdict, in either direction.** It does not say yes and it does not say no.

| Instant arithmetic | What the family sees | What happens |
|---|---|---|
| **Clean** (no cluster at ≥2 Yes, Q13 No) | *"Thank you. Someone from the study reads these before we go any further — that usually happens within a working day. In the meantime, let's get the tablet set up."* | Flow **continues in the same sitting**. Clinician review runs in parallel and can only ever *add* an exclusion — it is a safety net over inclusion, not a gate on the family's time. |
| **Cluster A ≥2 Yes**, or PCA on the letter | *"Thank you. There are a couple of answers here that we want a clinician to look at properly before we ask you for anything else. [Dr Name] will ring you — usually tomorrow, never later than two working days. We are not going to ask you to upload photographs until then."* | Flow **stops**. No content is requested. §7.5. |
| **Cluster B ≥2 Yes**, or svPPA/PPA on the letter | *(identical copy)* | Flow **stops**. §7.5. |
| **Cluster C ≥2 Yes**, or DLB on the letter | **Nothing. No message of any kind.** | Flow continues normally. `fluctuation_band = high` is set in the research plane and shown in the trial operations console. The family is never told, because telling a family "we think your mother may have Lewy body dementia" from a fourteen-question form on a phone is a diagnosis delivered by software. |
| **Q13 Yes** (acute change) | *"Let's not start this fortnight. A chest infection or a water infection makes everything harder for a while, and it passes. That is all this is — it isn't about her memory and it isn't a no. We'll email you in four weeks."* | Flow **pauses four weeks**, then re-screens from question 1. Everything already entered is kept. Nothing is deleted. |
| **Q14 No** (sensory) | One line at the end of the flow, not a block: *"Worth booking her an eye test and a hearing check if it has been a while — it makes a real difference to how this goes, and it is a common reason things look worse than they are."* | Flow continues. Flag to the trial operations console. |

**The bad news is delivered by a human being, on the telephone, and confirmed in writing** (§9 Gate 3: *"Told plainly, in writing, with the reason and a signpost"*). The app's job is to generate that letter for the clinician and to hold a copy the family can re-read; the app's job is not to be the one that says it.

Cost of this design, stated: a family in the Cluster A/B path has spent about six minutes and receives, that day, nothing. That is the correct trade. Six minutes is much better than seventeen minutes and a deck of their mother's photographs built for a product that is contraindicated for her.

### 7.5 The exclusion letter

Generated by the app, sent by the clinician, held in the family's account. Draft, for the Cluster A case:

> We are not going to enrol [Margaret], and we want to tell you exactly why.
>
> From your answers, [Margaret] may have a form of dementia that changes how the brain makes sense of what the eyes see. It is not a problem with her eyes and it is not a problem with her effort or her trying.
>
> This app is built almost entirely out of photographs. For someone with this particular difficulty, an app like ours does not simply work less well — it asks her, every single day, to do the one thing that has become hardest. We are not willing to sell you that.
>
> **This is not a diagnosis and we are not her doctors.** Please take these answers to her memory clinic or GP. The words that will be useful to them are **"posterior cortical atrophy"**.
>
> [Alzheimer's Society PCA page · Rare Dementia Support · the study coordinator's number]
>
> Nothing you gave us has been deleted. If you would like it all removed now, one tap here does it, permanently, and we will confirm by email.

Naming the clinical term here is deliberate and is not a violation of the plain-language rule. The rule governs the *questions*, which a family must answer without jargon. The letter's job is different: it is to arm a family with the exact phrase that will get them seen, and withholding it to sound gentle would be a disservice.

---

## 8. DEVICE MODE

**Screen: `caregiver/device/mode`** — two cards, no default selected, no recommendation badge.

> **Whose tablet is it?**
>
> **[ It's hers. ]**
> She picks it up and it opens straight into her photographs. No tapping her name, no password, nothing to remember.
>
> **[ It's shared — other people use it too. ]**
> It shows a row of faces and she taps her own. Use this in a care home, or for the tablet in the kitchen that everyone uses.

And, under the shared card, in body text and not in a tooltip:

> Be aware: anyone who picks up a shared tablet can tap her face and see her photographs. There is no lock on it. If that is not right for your family, use a tablet that is only hers.

That sentence is an honest rendering of ADR §5.2: *"On a shared tablet, tapping a face is a purely client-side selection that grants nothing server-side. There is no privilege boundary between residents on one tablet and pretending otherwise would be theatre."* A family is entitled to that fact before they upload photographs of their mother, and a care home is entitled to it before it buys one tablet instead of two.

Mode is stored on `devices.mode` (ADR §5.2 schema) and is **per device**, not per patient. A family may run a personal tablet at home and be enrolled on a shared tablet at a day centre; both are rows in `device_patients`.

---

## 9. DEVICE ENROLMENT — THE 8-CHARACTER CODE

This is the only moment in the product when an adult who is not the patient operates the patient's device, and it is where P29's *"unresearched wall"* actually lives: the first-run obstacle is hardware, not content.

### 9.1 On the caregiver's phone

**Screen: `caregiver/device/code`**

> **Open the app on [Margaret]'s tablet and type this in.**
>
> # K7QM 3XBF
>
> This code works for the next ten minutes. If it stops working, tap below and we'll make you another — there is no limit and it costs nothing.
>
> **[ Give me a new code ]**   **[ The tablet isn't here right now ]**

- **Eight characters, 32-symbol alphabet, 40 bits, `sha256(code)` stored and never the code, TTL 10 minutes, single use, five failed attempts burns it** (ADR §5.2, unchanged).
- **The alphabet is Crockford base32** — `0123456789ABCDEFGHJKMNPQRSTVWXYZ` — which is exactly 32 symbols and excludes `I`, `L`, `O`, `U` by design. The decoder additionally accepts `O→0` and `I`/`L→1` on input, so a caregiver who reads an `0` as an `O` still succeeds. `U` is excluded so that no generated code is accidentally obscene.
- Rendered **4 + 4 with a space**, never with a hyphen (a hyphen reads as optional, or as a minus sign).
- **There is no countdown timer.** WCAG 2.2.3 forbids time limits on the patient surface; a ticking clock is also simply hostile to an interrupted person, and this population of caregivers includes 78-year-old spouses. When the code expires, the screen does not hide it or animate — it replaces the code with one large button, *Give me a new code*.
- **"The tablet isn't here right now" is a first-class exit.** It is not a skip-link in grey text. Enrolment resumes from Home at any later time, and the rest of the flow continues without it.

### 9.2 On the tablet — `app/(patient)/enrol.tsx`

This screen lives in the patient route group and is subject to patient-surface constraints, but it is operated by the caregiver. It is shown **once, ever**; after redemption the route is unreachable.

- **32 keys, 8 columns × 4 rows, each 120 × 100 pt** on a 1180 × 820 pt landscape iPad. Every key is far above the ADR's 88 pt patient minimum (≈17.6 mm, at the ~17.5 mm performance plateau, HCI §1.3) and above the 44 pt platform floor by a factor of two and a half.
- Entered characters appear in 48 pt type in eight fixed slots. **No cursor, no blinking, no auto-advance animation.** A key press fills the next slot instantly.
- One correction control: **⌫ Delete**, isolated in a fixed corner with a large dead zone, never adjacent to a character key (HCI implication 4).
- On the eighth character the app submits automatically. There is no "Done" button to find.
- **Failure states are stated, never scored:** *"That code didn't work. Have another go, or ask for a new one on your phone."* No attempt counter is displayed, though five failures burn the code server-side.
- **If the device has no passcode, enrolment refuses before the keypad is drawn**, with ADR §5.2's exact wording: *"This tablet must have a passcode before it can be enrolled."* The Keychain class `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` makes the MDM requirement enforced in code rather than written in a protocol nobody reads.

### 9.3 The one thing the caregiver is told to do with the hardware

At the end of enrolment, one screen, one instruction, no illustration of a person:

> **Put it somewhere it lives.** A stand on the kitchen table, or propped on the sideboard, plugged in. Tablets that get put away in a drawer stop being used, and a tablet that slides about while she is touching it is hard to use.

This is HCI §11.2 — involuntary dragging of the tablet itself is a documented failure mode and the study authors' own recommendation is to fix the device to a surface. A stand is part of the pilot kit (HCI implication 14).

---

## 10. THE DECK: ADDING PEOPLE AND PHOTOGRAPHS

The bottleneck is here: 8 photographs × 4 fields = 32 inputs in ~7 minutes, which is 13 seconds per input including the photograph choosing. The structure below is what makes that achievable.

### 10.1 Two passes, not eight forms

**Pass 1 — `caregiver/deck/choose`. Choose them all first. ~90 seconds.**

Multi-select from the camera roll, up to 8 at a time, plus a large *Take a photo of a print* button. Batching is faster than a per-item form and, more importantly, **it puts the pleasant part first**: choosing photographs of your mother is the only step in this flow that a grieving person might actually want to do, and it should not come after four minutes of admin.

Guidance copy, one line, because it changes the content quality more than any other sentence on this surface:

> Pick faces, not scenery. People she knew between about fifteen and thirty are the ones that come back most easily.

That is P14 and §3 #27 — the reminiscence bump concentrates at ages 6–30 and is partially preserved in AD, and "only positive events increased between ages 15–30" — translated into a single instruction. There is no essay about the reminiscence bump; there is one sentence that changes what gets uploaded.

**Photographs of paper prints** get one extra affordance and nothing more: a rectangle guide and an auto-crop-and-deskew on capture. No glare correction, no colour restoration, no enhancement. P29 names physical photo digitisation as *"the actual first-run obstacle"* and it is genuinely unsolved; what we can do cheaply we do, and we do not pretend to have solved it.

**Pass 2 — `caregiver/deck/label`. One photograph at a time. ~40 seconds each.**

The photograph fills the top two-thirds of the screen. Four questions beneath it, all on one screen, no scrolling on a 390 × 844 pt phone:

| Field | Control | Speed move |
|---|---|---|
| **Who is this?** | Text field, keyboard opens on screen entry | **Autocompletes across the deck.** The second photograph of Sarah is two taps. This is the only typing in onboarding. |
| **Who is she to [Margaret]?** | Chip row: daughter · son · husband · wife · sister · brother · friend · grandchild · *someone else* | Ordered by frequency in this population, not alphabetically. *Someone else* opens one text field. |
| **Roughly when?** | Chip row: 1930s … 2020s | **Pre-selected from EXIF `DateTimeOriginal` where present**, changeable in one tap (WCAG 3.3.7, COGA pre-fill). Blank for scanned prints. Only `era_decade` ever crosses to the research plane — no real date leaves the system (P21, ND-18). |
| **And Sarah —** | Chip row, **four options, no default**: *is living* · *has died* · *we're not in touch* · *please don't show her* | **Mandatory. Cannot be skipped. Cannot be defaulted.** This is the only place in the flow we deliberately spend time. |

Header: *Photograph 3 of 8.* Bounded, finite, with a visible end (HCI implication 45).

### 10.2 The most important sentence on the caregiver surface

Under the status chips, permanently, not behind a tooltip:

> If someone has died, we will still show her face and say her name warmly. We will never ask [Margaret] a question whose answer means knowing she is gone.

This is P16's provisional rule — *allow the face and the voice; never the death; never a question whose correct answer requires knowing they are gone* — said to the family in their own words, at the exact moment they are being made to answer a question about a dead person.

The evidence behind the mandatory field: disclosure of spousal death to a person with dementia produced **18.4% worsening BPSD and 26.0% worsening depression** (Kato 2023, n=508 care managers), and because the memory does not consolidate, **each disclosure is experienced as fresh loss**. A spaced-repetition engine is precisely the mechanism by which that becomes systematic. S4 is a Tier-1 safety criterion demanding **zero** instances; the cheapest guarantee available is a field that cannot be left blank.

Downstream, invisibly: `person_status = deceased` defaults the card OFF for M-20 and M-10 (recognition) and permits it in M-02 and M-40 (narration and open story). `do-not-show` removes it from everything, keeps the file, and does not delete it — because a family who marks *please don't show her* today may not mean *destroy this photograph*.

### 10.3 The blocklist

**Screen: `caregiver/deck/never`** — one screen, tick-boxes, P17.

> **Is there anything we should keep away from?**
> Tick anything that is difficult for [Margaret]. We will keep those years and those subjects out of what we show her.
>
> ☐ The war, or military service
> ☐ Anyone who has died
> ☐ Leaving home, or moving country
> ☐ Hospitals, care homes, children's homes
> ☐ *Something else — tell us in a line*

P17 requires era-level and theme-level blocklists captured **at onboarding, not per-item afterwards**, because Cochrane names PTSD as a specific risk group for reminiscence, late-onset PTSD symptoms can worsen following dementia onset, and life-story work has documented *"sensitive information and personal disclosures emerged uninvited."* Per-item flagging is the design that requires the family to notice the harm before they can prevent it.

The free-text line is content plane and never crosses to research (P21).

### 10.4 What is *not* on any of these screens

- **No face detection, no "is this Sarah?" suggestion, no clustering, no auto-tagging.** P20 and ND-17, and it is not a close call: BIPA carries a private right of action and per-violation statutory damages, and these photographs contain relatives who are not users and never consented (§1.11, blocker B3). This is *"the most obvious way to reduce caregiver content-entry burden"* and the corpus names it as the brief's own primary product risk. We do not ship it. **The deck is capped at 8–10 items precisely because tagging is manual** — the two decisions are the same decision.
- **No album import, no "add 200 photos".** More content is not the goal; §2.4 gets six renderings out of every one photograph.
- **No AI-written captions, no generative prompts, no "help me write this".** P19, ND-16. A hallucinated fact, presented answer-first under an error-avoidant regime, would be consolidated by design.

---

## 11. THE OPTIONAL VOICE RECORDINGS

M-02's burden score was 5, and the reason was one line: *"one recorded voice caption per photo, forever."* The mechanic ships because that cost was removed, and this surface is where the removal is enforced.

**Three rules, and they are the whole design:**

1. **Recording is never offered during the first sitting.** It is not a step, not a skip-link, and not a greyed-out box implying incompleteness. It appears for the first time on Home, once, **after the family has seen a session actually run** — typically day 3 or 4.
2. **It is never offered per photograph.** Offering it eight times is asking eight times.
3. **The offer states the truth about itself:** *"A family that records nothing has a fully working app. A family that records something has a warmer one. Both are fine, and we will not ask again."*

**Screen: `caregiver/voice`** — reached only from that one card, or from any photograph's action list thereafter.

- One photograph, one large record button, **10-second cap** (HCI implication 40 — short recordings, ≤10 s, against listening-effort fatigue at ~4 syllables/second).
- Playback before keeping, and re-record without penalty.
- **Captioned on screen when it plays to the patient, in large text** (HCI implication 38): 55% of adults 75+ have disabling hearing loss and fewer than 1 in 3 who would benefit has ever used a hearing aid. Audio is never the sole carrier of anything (HCI implication 37).
- The default is not silence: with no recording, TTS reads the family-typed sentence. **That is not AI-generated content** (P19) — the app reads what a human wrote.

**The codec trap, from ADR §8, rendered as a screen state.** A caregiver recording in Chrome gets `audio/webm;codecs=opus` by default, which Safari and WKWebView cannot play — the family's recording would be *silent* on the patient's iPad, with no way for a person with dementia to report it. So:

> If `MediaRecorder.isTypeSupported('audio/mp4')` is false, **the record button is disabled**, with: *"Recording doesn't work in this browser. Open the app on your phone and it will work there."*

A disabled button with an honest reason is correct here. A silent recording arriving on a tablet in front of a person who cannot tell you it is silent is the worst available outcome.

---

## 12. HOME — THE SCREEN A CAREGIVER ACTUALLY LIVES ON

**Screen: `caregiver/home`.** Every return lands here. It is the hub; there is no tab bar, no drawer, and **no hamburger** — ~49% of adults over 40 correctly predict the hamburger opens a menu and ~48% of users over 45 do not recognise it (HCI §2.5), and every caregiver in this product is over 40.

Four regions, fixed order, ordinary density.

### 12.1 The state line — what exists, never what is missing

Exactly one sentence at the top, chosen from a closed set:

| Deck state | Line |
|---|---|
| Birth year only | **It's working.** She'll get a song from 1955 and two sayings she has known all her life. |
| 1–3 photographs | **It's working**, with three of her own photographs in it. |
| 4–7 photographs | **It's working properly now** — four photographs is enough for a full session with her own family in it. |
| 8+ | **That's the full set.** More is welcome and never needed. |

There is **no progress bar, no percentage, no "3 of 8" and no checklist of unticked items on this screen.** The in-flow counter (§4.1 rule 5) exists inside a task; a counter *outside* a task is a nag with a progress bar drawn round it. Every line above is true, and every line above says the product already works.

### 12.2 The device line — the only "is it being used" fact in the product

> Her tablet last connected **this morning**.
> — or —
> Her tablet **hasn't connected for nine days**. It may need plugging in, or moving nearer the wifi. **[ What to check ]**

This is a fact about a **device**, not about a person. It exists because ADR §4.5 sets `content_valid_until = last_successful_sync + 7 days` and a tablet past that refuses to render content — a family must be able to fix that, and only they can.

It is deliberately the *only* channel through which anything about usage reaches this screen, and it is deliberately not convertible into a statement about Margaret. `session_end_reason` distinguishes `device_failure` from `user_ended` from `abandonment` because *"abandonment and device failure mean opposite things clinically and must never be indistinguishable"* (§7 telemetry) — **the family gets only the device half.** The other half goes to the research plane and to nobody else.

### 12.3 Two permanent actions

Always present, always in the same place, never moved:

**[ Add photographs ]** — re-enters Pass 1 at any time.

**[ Something upset her ]** — designed in §14.

### 12.4 Moments

The most recent entry from the feed (§13), rendered as one card. Tapping it opens the feed.

**If there is nothing yet:** *"Nothing here yet. Things she says and sings will show up here a couple of days after they happen."* — which is a true statement of the mechanism and not a placeholder implying failure.

### 12.5 The monthly card, when due

> **Is this still true?**
> *"Jean comes on Wednesdays."*
> **[ Still true ]**   **[ Change it ]**   **[ Stop saying it ]**

One tap for the common case. This is the entire recurring obligation in the product and it is designed to cost about fifteen seconds.

Why it is reviewed rather than left alone: §3, verbatim — *"a sentence that has stopped being true is a rehearsed false comfort."* An M-25 target is drilled at full Camp fidelity, which means the product is the mechanism by which a false fact becomes fluent.

**If it is never reviewed:** after two missed months the target **stops being asked and drops to rung 3** — shown and spoken as an M-02 familiarity card, never as a question. That is a cue-level change, which P2 permits, and specifically *not* an algorithmic retirement, which P3 and ND-8 forbid. The monthly email then changes once, and only once, to name the risk without guilt: *"We are still saying 'Jean comes on Wednesdays' to her. If that has stopped being true, tell us and we'll stop."* §18.2 records why I am not fully satisfied with this.

---

## 13. MOMENTS — THE DANGEROUS SCREEN

### 13.1 What P5 actually requires

> *"No aggregate of failure is ever rendered to the patient or the caregiver: no score, percentage, accuracy chart, declining trend, streak, due-count, or backlog. … Kills the caregiver progress dashboard as normally conceived. Requires the caregiver surface to report **events and moments** ('she talked for two minutes about the Elm Street house'), plus **actions** ('retire this item', 'add more from the 1950s')."*

And §1.8 anticipates the cheap reading of that and rejects it in advance: renaming the dashboard from "accuracy trends" to "good moments" is *"a copy change proposed as a solution to a measured psychological effect in a population where the modal case is not benign."*

So the defence below is structural. There are four mechanisms, and the copy is the least of them.

### 13.2 Mechanism 1 — a closed set of entry types, and nothing else may ever be added

Four entry kinds exist. The set is closed in the schema, not by convention.

| # | Entry | Example | Source | Why it is safe |
|---|---|---|---|---|
| 1 | **She talked** | *"Tuesday — about two minutes about the photograph of the house on Elm Street."* | M-40 trial: `utterance_duration_ms` + which photograph. **Rendered only above a 20-second floor.** | Words spoken is M2's primary outcome and is explicitly *not accuracy*. It is also the one measure in the product on which a person with dementia can only ever do well. |
| 2 | **There is a recording** | *"There is 40 seconds of her talking about Elm Street. **[ Listen ]**"* | The M-40 recording, content plane. | This is P29's *"first shareable artefact in week one"* and P31's contributing role. She made a thing; her family can hear it. This is the product's actual emotional payload. |
| 3 | **The song played** | *"Wednesday — 'Que Sera Sera' played."* | M-56. | Zero-demand, zero-judgement, and it happens every session, which matters for mechanism 3 below. |
| 4 | **She stayed with one** | *"She sat with the wedding photograph for a while on Thursday."* | Dwell before advance in M-02. | A statement about attention to a picture, with no correct answer attached and no comparison over time. |

**Two entry types were designed and killed, and the reasons are the rule:**

- ***"She finished the saying 'a stitch in time'."*** Overlearned, near-certain, no personal stakes — it looks completely harmless. It is not, because it happens on **every** session, so its **absence is informative**. A feed that shows successes only, in a class of event that normally always occurs, tells you exactly when it did not occur. Killed.
- ***"She remembered Sarah today."*** Every version of this is a per-item outcome. A caregiver who learns which names are slipping has been handed both a grief trigger and, in the one-in-three case, a weapon. It also fails P23 outright: a per-item outcome is not observable by the patient, so the caregiver may not have it.

> **The rule that generated both kills: no entry may be of a kind whose absence carries information about how she did.**

### 13.3 Mechanism 2 — a 48-hour delay, which is the real protection

> **No entry becomes visible until at least 48 hours after the session that produced it.**

This is the single most important line in this document after the day-1 number.

A same-day feed is a compliance instrument. It lets a person standing in a kitchen check, at 6pm, whether their mother did the thing they told her to do — and in a population where 34% of carers report important levels of abusive behaviour, that is a lever we would be building and handing over. A 48-hour delay destroys it. There is no version of "did you do it today" that this feed can answer.

It is deterministic (not randomised — randomness here would look like manipulation), it is one rule, it is trivially implementable, and — critically — **it is disclosable to the patient in one sentence**, which is what P23 requires:

> *"Anything this app tells your family, it tells them two days later. Nobody is watching you today."*

The delay also reduces the caregiver's own checking behaviour, which is itself a burden vector and, per §1.8, the axis on which every previous trial did harm.

**The one thing that is exempt from the delay is §14's acute-change message**, because it is medically urgent. The fact that the *only* fast channel in the product is the one about a suspected physical illness is not an accident; it is the shape of the whole design in miniature.

### 13.4 Mechanism 3 — the feed has no calendar and cannot go to zero on a session that ran

- **No calendar view. No day grid. No week view. No "last active".** No timestamp finer than a day name.
- Entries are a flat reverse-chronological list with no empty slots rendered. Absence has no shape to be seen against.
- Because entry type 3 (the song) fires on **every** session including Nothing Today mode, a session that ran always produces at least one entry. Feed density varies; it does not go to zero for a session that happened.

**Residual, stated rather than hidden:** if no session runs at all for two weeks, the feed produces nothing for two weeks, and a determined person can infer non-use. That is irreducible — any family-facing artefact feed leaks it. What the mechanisms above achieve is that the leak is **coarse (weeks, not days), delayed (48 hours), uncountable (no numbers), and never about her performance**. I am not going to claim it is zero.

### 13.5 Mechanism 4 — Moments is a permission, and it is not the default for everyone

P23: *"Caregiver monitoring defaults to the minimum, and is removable at the patient's request. … Kills the all-powerful single caregiver account. Requires multiple caregivers with differentiated permissions and a documented removal path."*

Two permissions exist in v1. Two, not a matrix.

| Permission | What it grants | Default |
|---|---|---|
| **Content** | Add photographs, write and review the month sentence, mark status, stop an item, report distress, manage the device. | Everyone invited. |
| **Moments** | See the feed. Hear the recordings. | **The advocate only.** Anyone else must be granted it explicitly, by the advocate, one person at a time. |

The **advocate** is the single person named on the consent pathway (§15). There is exactly one and it is a study role, not a purchase.

So the second daughter who is invited to help can add photographs of her mother — genuinely useful, genuinely low-risk — and cannot watch her mother. That is monitoring defaulting to the minimum, expressed as a default rather than as a preference screen nobody opens.

### 13.6 What Moments is *not*, spelled out

**No** score · **no** percentage · **no** accuracy · **no** chart of any kind · **no** trend line · **no** sparkline · **no** "improving"/"declining" · **no** streak · **no** session count · **no** due count · **no** backlog · **no** per-item history · **no** comparison to last week · **no** comparison to other families · **no** goal · **no** target · **no** milestone · **no** export of any of it.

There is no charting library on the caregiver route at all. `recharts` is restricted to `app/(researcher)/**` and that restriction is an ESLint rule (ADR §6.2), not a habit. **The caregiver surface cannot draw a chart because the code to draw one is not reachable from it.** That is how ND-22 — *never ship a caregiver-facing cognitive decline chart* — is held: by a lint rule, in CI, where an agent under deadline pressure cannot quietly undo it.

---

## 14. ACTIONS — WHAT THE FAMILY CAN DO

P5's second half. Actions are what a caregiver surface is *for*, once the reporting has been stripped down to §13.

Every photograph, from Moments or from the deck, carries the same five actions in the same order:

| Action | Effect | Governing rule |
|---|---|---|
| **This upset her** | Immediate. Item enters an absorbing state and does not return until a human re-enables it. Logs an `adverse_event`. Trips M-135 (Nothing Today) deterministically for the next session. | P18, ND-14, scheduler req. 14. Distress is stronger than any interval logic. |
| **Stop showing this one** | Item out of rotation. Reversible by the same person, any time. | P3, ND-8 — **only a human retires an item.** The algorithm may never. |
| **Change what we say** | Edits the name / relationship / sentence. | The template in §4.2 recomposes. |
| **Add more from the 1950s** | Jumps to Pass 1 with the decade pre-filtered. | P5's own worked example, implemented literally. |
| **Delete this photograph** | Storage object deleted, row deleted, `revocations` entry issued so the tablet purges its local copy on next sync. | ADR §8. *"Deleting only from Postgres would leave photographs of a person on a tablet in a care home."* |

### 14.1 The distress control has to work when the caregiver knows nothing

P18 permits *"a one-tap caregiver 'stop, this is upsetting'"* and that is a safety mechanism, so it must survive the realistic case: something happened, the caregiver was in another room, and they do not know which photograph did it.

**[ Something upset her ]** on Home →

> **When was it?**   **[ Just now ]**  **[ Earlier today ]**  **[ Yesterday ]**
>
> **Do you know which one?**
> *(the photographs from that session, large, tappable)*
> **[ I don't know which ]**

- Tapping a photograph: that item enters the absorbing state and the event is logged against it.
- **[ I don't know which ]**: logs the `adverse_event` with no item attribution, drops the next session to Nothing Today mode (M-135), and **retires nothing**. Suppressing a whole session's items on a guess would silently gut the deck, and would make a distressed carer's honest "I don't know" more destructive than a precise answer.
- Either path shows the same closing line, which is the only reassurance the app offers anywhere: *"Thank you for telling us. We've stopped it. Nothing you do here can break anything."*

No confirmation dialog. No "are you sure". The action is reversible and the cost of a false positive is one photograph out of rotation, which is nothing.

---

## 15. CONSENT

P22 is the strictest principle in the corpus and the one most likely to be quietly softened by a product team, so it is written out here in the form of screens.

> *"The patient is a first-class account holder with their own identity. The caregiver **advises**; they never assert that the patient consented."*
> MCA 2005 ss.30–33: a personal consultee advises on what the person would have wanted and **cannot authorise participation**; *"nothing must be done to which the participant appears to object."*

### 15.1 The pathway is recorded, not chosen by the family

**The app does not ask the caregiver to assess capacity.** Capacity for this decision is determined at recruitment by the study clinician, and the caregiver surface **records** the pathway that was determined. A capacity assessment rendered as a radio group on a family member's phone would be both legally worthless and an invitation to the exact conflict of interest §1.8 describes.

`consent_pathway ∈ { direct, supported, consultee }`, with `capacity_status` and a dated `capacity_review_date`.

### 15.2 Screen `caregiver/consent` — three variants

**Direct** — the person consents for themselves. The screen is informational only: *"[Margaret] has signed her own consent form. You don't need to do anything here. She can change her mind at any time, about any part of it, and she doesn't need a reason."*

**Supported** — the person decides with support. Same, plus: *"You were there to help her think it through. That is what supported means; the decision was hers."*

**Consultee** — the caregiver acts as personal consultee. This is the only variant with an input, and the wording of that input is load-bearing:

> As [Margaret]'s consultee you are not giving permission on her behalf — the law does not let you, and we would not ask you to. What we are asking is different:
>
> **Knowing her as you do, do you believe she would be willing to take part?**
>
> **[ Yes, I believe she would ]**   **[ No, I don't think she would ]**   **[ I'm not sure ]**
>
> Whatever you say here, this holds: **nothing will happen that she appears to object to.** If she pushes the tablet away, that is her answer, and we stop. You do not have to persuade her, and we will never ask you to.

**There is no checkbox anywhere in this product that says the patient consented, and none can be added**, because the consent event schema has no such value: `event_type ∈ { initial, reaffirmation, dissent_observed, withdrawal, capacity_change, consultee_change, purpose_change }` and `pathway` is one of the three. A caregiver assertion of patient consent is not representable.

### 15.3 Dissent is one tap from Home and it always wins

**[ She doesn't want to ]** — reachable from Home, from Moments and from any photograph.

> **[ She doesn't want to ]**
> **[ Stop for now ]** — nothing happens until you say otherwise. The tablet goes quiet. Nothing is deleted.
> **[ Stop for good ]** — we take her out of the study. You can have everything back, or have it all destroyed, or both.

Logged as `consent_event: dissent_observed` or `withdrawal`. **S6 is a Tier-1 safety criterion: zero participants continue after expressed dissent.** That is audited from this log, so the control has to be somewhere it will actually be found on a bad evening — not in a settings screen.

### 15.4 Re-affirmation, on a cadence, framed as the study's job

Every 12 weeks, and on any capacity change: one email, one screen. Framing matters, because a re-consent prompt is easily read as a demand on an exhausted person:

> **This is our check-in, not a job for you.** The law says we come back and ask again, because it has been three months and things change. Two questions, about a minute.

Recorded as `consent_event: reaffirmation` with `outcome`. This is a first-class logged event, not a background flag, because P22 requires it and because a consent record that cannot be audited is not a consent record.

### 15.5 Multiple caregivers and the removal path

- **Invite by email.** New people get **Content** only (§13.5). Moments is granted one person at a time, explicitly, by the advocate.
- **Everyone with access is listed on one screen, always, with the date they were added.** No hidden accounts. There is no invisible viewer in this product.
- **Removal.** The advocate can remove anyone. **The patient's own removal path in v1 is a human being on a telephone number printed on the plain-words sheet (§16), not a button.** She is on a chrome-less device with no settings and no keyboard; there is nowhere to put the button that would not violate the patient surface.

That is a real gap against P23's *"removable at the patient's request"* and I am not going to dress a phone number up as equivalent to a control she holds. It is recorded in §18.1.

---

## 16. THE PLAIN-WORDS SHEET — HOW P23 IS ACTUALLY HONOURED

> *"Nothing may be observable by the caregiver that is not disclosed to the patient in the patient UI. No covert modes."*

The patient UI has no chrome, no settings, no text surface and no navigation, by design and by ND-31/32. It therefore cannot carry a disclosure. Pretending otherwise would be the covert mode P23 forbids, wearing a compliance label.

**So the disclosure is a physical artefact.** The caregiver surface generates a one-page sheet, printable and emailable, written *to the patient*, in the second person, at reading age 8–10 (WCAG 3.1.5 AAA, W3C COGA). It is read aloud to her at consent by the study clinician, left with her, and re-read at each 12-weekly re-affirmation.

Draft, in full, because if it cannot be said in a page it is not disclosed:

> **Margaret — what this tablet does, and who sees it.**
>
> This tablet shows you photographs of your family and plays you music. You can use it or not use it. Nothing bad happens if you don't.
>
> It keeps a note of what you tap and how long you take. That is how it knows which photograph to show you next.
>
> **Your daughter Sarah can see:** photographs of you talking about a picture, how long you talked for, and which songs played. **She sees these two days later, not on the same day. Nobody is watching you today.**
>
> **She cannot see** whether you got anything right or wrong. Nobody can. The tablet does not keep a mark of that to show anybody.
>
> If the tablet finds things suddenly much harder for you than usual, it tells Sarah to check whether you might be poorly — a chest infection or a water infection can do that. It does not tell her anything about your memory.
>
> If you want Sarah to stop seeing any of it, or you want to stop altogether, ring **[coordinator name] on [number]**. You do not need a reason and nobody will ask you for one.

Every claim on that sheet is enforced by the design above. If a future feature makes any line of it false, the feature does not ship — **the sheet is the specification, not the marketing.**

---

## 17. THE ONE NOTIFICATION

**Exactly one push notification type exists in this product.** Not one category — one.

It is P25's acute-change message, it goes to the caregiver, never to the patient, never to a clinician, and its wording is fixed:

> **[Margaret] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP.**

- Trigger is **deterministic**: a threshold over the generic probe plus the M-35 proverb floor sentinel. No inferred classifier (P18, ND-15, EU AI Act Art. 5(1)(f)).
- **Fluctuation-aware**: requires persistence across sessions and never fires on a single bad day, or it manufactures decline out of Lewy-body noise (scheduler req. 11). For `fluctuation_band = high` participants the persistence requirement is longer.
- **Never a cognitive interpretation.** The words "memory", "worse", "declining", "progression" and "dementia" do not appear in it.
- It is the **only** thing exempt from the 48-hour Moments delay, because missing delirium is the biggest real-world harm in the product (S7) and delirium is a treatable medical emergency.
- Every one is followed up and the false-positive rate is documented (S7).

**Everything else the product might want to say, it does not say.** No code-expired push. No "your tablet is offline" push. No monthly-sentence push. No re-engagement. No product news. The only other outbound messages in the whole system are the magic link, the monthly sentence email, and the 12-weekly re-affirmation email — three transactional emails, all ignorable forever with no consequence.

**Blocker note:** B1 (a written MHRA/FDA opinion) is on the critical path and is scoped to this notifier. An algorithm that detects acute change and tells a family to ring a GP is *software providing information used for a diagnostic decision* — a higher-risk shape than a drift chart, and it ships anyway because S7 is Tier-1. It does not ship before B1 closes.

---

## 18. DELETE EVERYTHING

**Screen: `caregiver/erase`** — reachable in two taps from Home, not buried, and not behind a support email.

Required three times over: requirement 8's erase path, App Store guideline 5.1.1(v) (the caregiver app creates accounts), and UK GDPR. It is therefore free, and it is a screen a grieving family will one day need on the worst week of their life.

> **[ Take everything back ]** — every photograph and recording, as files, by email. Nothing is deleted.
> **[ Destroy everything ]** — every photograph, every recording, every note, gone from us and gone from her tablet. This cannot be undone.

The destroy path deletes the storage object, deletes the row, and issues a `revocations` entry so devices purge their local copies on next sync (ADR §8). It gets its own integration test, because *"deleting only from Postgres would leave photographs of a person on a tablet in a care home; that would be the worst bug in this product."*

**What survives, and it is said on the screen rather than in a policy:** *"The study keeps the anonymous record of how the app was used — no photographs, no recordings, no names, no dates. That is the part that lets us publish honestly about whether this worked. If you want that removed too, tell us and we will, up until the study is analysed."*

---

## 19. STYLING AND INTERACTION SPEC

ADR §7 governs: `StyleSheet.create` plus `src/ui/tokens.ts`. **No NativeWind, no Tailwind, no component library.** Breakpoints via `useWindowDimensions`, because CSS media queries do not exist on native.

The caregiver surface is "ordinary density" per the ADR — but ordinary density calibrated for a population that includes a great many 70-year-old spouses, not for a 28-year-old product manager.

| Property | Value | Derivation |
|---|---|---|
| Body text | **17 pt minimum**, medium weight | Apple's 11 pt floor is *"not defensible as a body size"* even for general use here (HCI §3.6). Never Light or Thin — thin strokes are high-spatial-frequency and AD contrast-sensitivity loss is worst there (HCI §3.1). |
| Headings | ≥24 pt | |
| Primary action targets | **≥56 pt** | 56 pt ≈ **11.2 mm**, which is the ~11 mm near-100%-hit-rate threshold for older adults (HCI §1.3). 44 pt ≈ 8.8 mm sits *below* it. This is derived from the document's own figures, not invented. |
| Secondary targets | ≥44 pt | WCAG 2.5.5 AAA floor. |
| Dead space between targets | ≥8 mm | HCI implication 2. |
| Contrast | **≥7:1 body text**, ≥4.5:1 non-text boundaries | WCAG 1.4.6 AAA. Applied to the caregiver surface too, because it costs nothing and the spouse-caregiver is 78. |
| Line height / paragraph spacing | ≥1.5 / ≥1.5× line height, left-aligned, **never justified**, ≤80 characters | WCAG 1.4.8 AAA. |
| Reading level | Lower-secondary (WCAG 3.1.5 AAA); COGA's 8–10 where feasible | An exhausted, grieving person reads like a tired person regardless of their education. |
| Colour | Never encode meaning in blue-vs-green, blue-vs-purple, or pastel pairs. Never orange or yellow content on a light ground. | Lens yellowing degrades exactly those discriminations (HCI §3.2, §3.3). Colour is always redundant with text and luminance. |
| Motion | Instant replace or cross-fade ≤150 ms. No parallax, no slide navigation, no autoplay. `prefers-reduced-motion` honoured. | HCI §5.1, WCAG 2.3.3 AAA. |
| Gestures | **Single tap only, here too.** No double-tap, no long-press, no swipe-to-delete. Swipe permitted only as a redundant accelerator that duplicates a visible button. | Double-tap took **18.2 s vs 8.4 s** with 1.9 vs 0.6 off-target errors in adults aged ~82 (HCI §1.1), and a caregiver may well be 82. |
| Navigation | Home is the hub. **No hamburger, no drawer, no tab bar.** Every control carries a text label, not an icon alone. | HCI §2.5, §2.6 — focus groups demanded pictogram **and** text label. |
| Forms | Autosave on every commit. No timeouts that lose work (WCAG 2.2.6). No redundant entry (3.3.7). Reversible actions rather than confirmation dialogs (3.3.6). | HCI implication 51 — caregivers enter content in fragmented, interrupted sessions. |
| Theme | Follows the system. No in-app theme picker. | Not a patient-surface constraint here, but a preference screen nobody opens is a screen. |

The 88 pt / 32–48 pt / one-action-per-screen / no-chrome constraints are **patient-surface only** and are not applied here. A caregiver surface built to patient constraints would take forty minutes to complete and would fail F3 on the first family.

---

## 20. WHAT THIS SURFACE EMITS

| Emitted | Where it goes | Notes |
|---|---|---|
| Onboarding step timings, per screen, paused on backgrounding | Research plane | **F3 is measured, not estimated.** Reported as a distribution. |
| Content-authoring time per week after week 1 | Research plane | **F6: ≤5 min/week and not increasing.** Carer burden is the primary product risk. |
| `consent_event` — initial / reaffirmation / dissent_observed / withdrawal / capacity_change / consultee_change | Research plane + trial ops | S6 audit. MCA s.33 compliance. |
| `adverse_event` — every "this upset her", with `related_item_class`, never the photograph | Research plane + trial ops | S1, S2, M5. The field's first systematic distress register. |
| Gate-2 answers, Gate-1 free text, C4 comprehension free text | **Trial operations console only** | Never rendered back to the family. Never a score anywhere. |
| `person_status` per item | Content plane, joined for the S4 audit | S4: zero deceased surfacings in a recognition mechanic. |
| `fluctuation_band`, `dementia_subtype`, sensory flags | Research plane | Pre-registered stratification, not a post-hoc split. |
| Device last-sync, hard-expiry state | Caregiver home + trial ops | The only usage-adjacent fact the family ever sees, and it is about hardware. |
| **Photographs, recordings, names, free text, the blocklist line** | **Content plane only. Never crosses.** | P21, ND-18. No real date, no full-face photograph, no voice recording, no real name reaches research. |

---

## 21. §9 NEVER-DO AUDIT FOR THIS SURFACE

| # | Never-do | Where it is held |
|---|---|---|
| 5 | No score, chart, streak, red X, due-count, backlog | §13.6, and enforced by an ESLint restriction putting `recharts` out of reach of the caregiver routes |
| 6 | Never ask the patient to rate their own recall | Nothing on this surface reaches the patient except content she can hear |
| 12 | Never surface a deceased person in a recognition mechanic without explicit caregiver decision | §10.1 — mandatory, undefaultable `person_status`; §10.2 says why, to the family |
| 13 | Never correct the patient about factual reality | The monthly sentence review (§12.5) exists so the *app* never asserts something false |
| 14 | Never re-present an item that produced distress until a human re-enables it | §14, absorbing state, reversible only by a person |
| 15 | Never build an inferred emotion or distress classifier | §14 is a caregiver tap; §17's trigger is a deterministic threshold; the C4 free text is hand-coded by a clinician, never classified |
| 16 | No AI-generated factual content without human approval | §10.4 — no generated captions, prompts or sentences. §4.2's template is not generation |
| 17 | No face detection, clustering, auto-tagging, voiceprint | §10.4. The deck cap and the manual tagging are the same decision |
| 18 | Never export a real date, full-face photo, voice recording or real name to research | §20 |
| 19 | Never build an automated abuse or neglect detection classifier | Not built. §13's protections are structural, not detective — we reduce what a dashboard-holder is handed, we do not surveil them back |
| 20 | Never implement covert monitoring; nothing observable by the caregiver may be undisclosed to the patient | §16. Every §13 entry type is a line on the sheet |
| 21 | Never let a caregiver assert the patient consented | §15.2 — not representable in the schema |
| 22 | Never ship a caregiver-facing cognitive decline chart | §13.6 — held by a lint rule, in CI |
| 24 | No onboarding "baseline assessment" that reads as a screen | §7 — never administered to the patient, never scored to the family, never named as a test, no running tally |
| 27 | No points, badges, mascots, confetti, streaks | None exist. §2.2 also removes the cheerful re-engagement versions |
| 28 | Never send guilt-framed messages to the caregiver | §17 — one notification, and it is about a suspected infection |
| 29 | Never nudge after ~16:00 | The chime picker offers **08:30–11:30 only**. §22.4 explains why the permitted override is not built |
| 30 | Never require the patient to log in or enter a code | §9.2 is operated by the caregiver, once, ever; after redemption the route is unreachable |
| 34 | Never require caregiver co-presence | Nothing on this surface is a daily action. §3.4 |
| 39 | Never target advertising at recently diagnosed families | No advertising surface exists in the product |

---

## 22. WHAT IS DELIBERATELY ABSENT

Each of these was designed, considered, and cut. The reason matters more than the absence.

1. **The progress dashboard.** P5 kills it by name. §13 is what replaces it, and §13.2's closed entry set is what stops it growing back one harmless-looking chart at a time.
2. **Any number about her memory, at any resolution, in any form.** Not a percentage, not a count, not "she's doing well", not a green tick.
3. **Session counts, calendars, day grids, "last active", and days-since.** These are missed-day counters wearing neutral clothes (P6, ND-28). The only usage-adjacent fact on this surface is about the **tablet** (§12.2).
4. **The after-16:00 chime override.** ND-29 permits it with explicit caregiver override; we do not build the control. Associative memory — exactly what we train — is ~10% worse in the evening (d = 0.34, Sliwinski 2022) and 21.2% of memory-clinic patients sundown with agitation. Building a permitted-but-harmful control invites its use. Via negativa.
5. **Face auto-tagging and every other content-entry convenience it would buy.** P20, ND-17, blocker B3. The single largest usability sacrifice in this document, made knowingly.
6. **AI-written sentences, captions and prompts.** P19, ND-16. A hallucinated fact presented answer-first under an error-avoidant regime would be *consolidated by design*.
7. **An eligibility verdict rendered by software.** §7.4. The app never says yes and never says no; a named clinician does, on the telephone, in writing.
8. **A capacity assessment as a form.** §15.1. Legally worthless and an invitation to the exact conflict of interest §1.8 measures.
9. **A "patient consented" checkbox.** Not representable in the consent schema (§15.2).
10. **Passwords, PINs and social login.** Magic link only (ADR §5.4). Nothing to remember, nothing to reset, and guideline 4.8 never fires.
11. **A countdown timer on the enrolment code.** §9.1.
12. **Per-photograph voice recording in the first sitting.** §11. This is the specific cost that scored M-02 a burden 5, and the flow is built so it is never charged.
13. **Eight authored sentences.** §4.2. Six minutes of the nine-minute budget, saved by a template.
14. **Re-engagement of any kind** — emails, pushes, badges, "we miss you", "finish your setup", completion percentages on Home. §2.2. Non-use is partly a symptom (§1.9), and a product that nags at a symptom is aimed at the wrong mechanism.
15. **Sharing, social features, family feeds and public artefacts.** The recording is exportable to the family who own it and goes nowhere else. §1.11 — this is a liability moat, not an equity one.
16. **A hamburger menu**, on a surface where conventional patterns are otherwise permitted. ~48% of users over 45 do not recognise it, and every user of this surface is over 40.

---

## 23. OPEN DISAGREEMENTS I AM NOT PRETENDING TO HAVE SETTLED

### 23.1 The patient's removal path is a telephone number, not a control she holds

P23 requires caregiver monitoring to be *"removable at the patient's request."* In v1 that request is made by ringing the study coordinator, because the patient surface has no chrome, no settings and no keyboard, and every place a removal control could go violates ND-31/32.

This is a genuine gap, not a solved problem. The honest framing is that the patient's agency here is mediated by a human being, which is better than nothing and worse than a control. The strongest available fix — a spoken "I don't want Sarah seeing this" captured by M-40's microphone and reviewed by the study team — is an always-listening consent channel and reintroduces exactly the shape M-42 was killed for. I have not found a fourth option and I would like one.

### 23.2 A stale month-target degraded to rung 3 is still a false comfort

§12.5 resolves the collision between "review the sentence monthly" and ND-8 ("never let the algorithm retire an item") by dropping an unreviewed target to rung 3 rather than removing it — a cue-level change, which P2 permits.

But a rung-3 card is *shown and spoken*. So if Jean has stopped coming on Wednesdays, the product goes on warmly telling Margaret that Jean comes on Wednesdays, just without asking her to say it back. That is quieter iatrogenic false comfort, not the absence of it. The alternative — stopping it — is an algorithmic retirement and ND-8 is a hard stop. I have chosen the ND-8-compliant option and I am not confident it is the kinder one.

### 23.3 The 48-hour delay reduces the leak but does not close it

§13.4 states it: two weeks of silence in the feed is inferable non-use. Every mechanism in §13 makes the signal coarse, delayed and uncountable, and none of them makes it zero. A family-facing artefact feed that cannot leak participation is, as far as I can tell, a feed with no entries in it.

### 23.4 One sitting may be the wrong variable entirely

§12.1 of the synthesis names it: *"apathy is the most prevalent neuropsychiatric symptom in dementia, a direct disease-caused predictor of not initiating any activity,"* and it appears nowhere in the engagement corpus. This entire surface is optimised hard for **caregiver authoring burden**, on the assumption that authoring burden is what kills F2.

If §12.1 is right, the binding constraint is nobody pressing anything, the seventeen minutes I have spent so much effort compressing were never the problem, and every design move in this document is aimed slightly to the left of the target. I cannot prove otherwise from this side of the pilot. It is pre-registered as the named F2 failure mode.

### 23.5 The screening pause costs a family six minutes for nothing, and I have not tested whether they forgive it

§7.4 stops the flow before any photograph is asked for. That is right on the harm axis and I would make the same call again. But a family who spends six minutes on a form and is told "someone will ring you tomorrow" is a family who may simply not answer the telephone. F7 — recruitment yield — is the criterion this design puts at risk, and *"recruitment failure, not effect size, is the most common way a pilot like this dies."*

### 23.6 B6 has not run

P32 makes the mechanic freeze conditional on a PPI panel with people living with dementia. Every screen above was made out of other documents. §16's plain-words sheet in particular is a text written *about* people who were not asked whether it says the right things, which is the exact criticism P32 exists to prevent. It should go to the panel before it goes to a family.
