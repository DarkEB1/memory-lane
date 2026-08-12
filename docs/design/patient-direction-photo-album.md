# PATIENT SURFACE — DIRECTION: THE ALBUM ON THE LAP

**Status:** Design direction, submitted for selection. Not frozen.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles, §9 NEVER DO), `docs/design/00-V1-PRODUCT-SHAPE.md` (the six frozen mechanics), `docs/architecture/00-ADR-PLATFORM.md` §7 (styling).
**Renders:** all six frozen mechanics, the four-rung cue ladder, both device modes. Invents nothing.
**Reference device:** iPad 10.9"/11", **landscape, orientation locked**, 1180 × 820 pt. Also checked at 1080 × 810 (iPad 10.2").

---

## 1. THE DIRECTION IN ONE SENTENCE

> **The screen is a page of a black-leaf photograph album. One print, mounted, centre of the page, with the caption written underneath it. You touch the print and the page turns. There is nothing else on the screen — no button, no icon, no label, no header, no back, no menu, no chrome of any kind — and there never is, on any screen, ever.**

Everything the app wants to say, it writes under the picture. Everything the person wants to do, she does by touching the picture.

---

## 2. WHY THIS IS THE ONLY METAPHOR THAT NEEDS NO INSTRUCTION

Six claims, each with the evidence it rests on.

**2.1 Every other tablet metaphor was imported from an office this cohort never worked in.**
Files, folders, the desktop, the window, the tab, the menu, the back arrow, the hamburger — these are metaphors from a 1970s Xerox research lab, taught to office workers from about 1990. A person born in 1938 met none of them. The numbers: only ~49% of adults over 40 correctly predict that the hamburger icon opens a menu; ~48% of users over 45 do not recognise it at all (HCI §2.5). Focus groups of people with mild dementia and their carers independently demanded *both* pictogram **and** text label on every control, clear home/back keys, no codes, no passwords, minimal typing (HCI §2.6). They were describing the cost of metaphors that were never learned.

**2.2 Dementia does not permit learning them now.**
In the 7-day in-home iPad trial, roughly **half** of early-stage dementia participants used the tablet independently, and **no baseline trait predicted which half** (HCI §8.1). We cannot select for the users who will learn a novel interface, and we cannot teach the rest. The only interfaces available to us are the ones already learned.

**2.3 The album is already in her hands, in the system this disease spares longest.**
Interface learning in dementia is **procedural**, and procedural memory encodes motor sequences bound to spatial positions (HCI §8.3). Procedural memory is relatively preserved against explicit memory. The album's procedure — one picture at a time, reach out, touch the picture, the next one comes — was encoded before 1960 and rehearsed thousands of times across a lifetime. **We are not asking her to learn a motor sequence. We are borrowing one that was laid down seventy years ago and stored where the disease goes last.**

This is not a metaphor at all. It is the object, rendered.

**2.4 The album's affordance count is exactly one, which is the number the evidence asks for.**
"Procedural operations should be replaced with simple operations (e.g. single-button operation)" (HCI §6.2, `[MOD-DEM]`). W3C COGA: limit options per screen, avoid simultaneous tasks, keep controls obviously controls. ADR §7: one action per screen. An album has one action. It has always had one action.

**2.5 The album has no failure state and never had one.**
Tiberti 1998: **16% of 146 people with AD showed a catastrophic reaction during a routine neuropsychological evaluation** — during exactly the kind of tested-recall interaction this product performs. The HCI brief's hard NEVER is: do not present the app to the patient as a test; the 16% figure was measured *inside an explicit testing frame* (§K). The album is the strongest available non-test frame because it is not a frame at all. **You cannot get an album wrong.** There is no correct way to look at photographs, there is no score, and nobody has ever been marked on it.

**2.6 It is a social object that does not require a second person.**
The classic posture is two people and one album on a sofa — which is the shared activity the product is honestly sold as (§2.1 of the synthesis). But nobody has ever needed a companion to look at an album alone. That is P28 (design for the caregiver's absence) and P31 (the person leads) satisfied by the object's own nature rather than by a feature.

**And the honest counter, stated here rather than buried:** the album's real verb is a pinch-and-lift at the page edge — a two-finger gesture at the extreme edge of the surface, which is precisely what P9 forbids and what §1.1/§2.2 show is unlearnable on glass (rotate shows *no improvement at all* across repeated tasks; edge targets need ~2× the area, 2.3 cm vs 1.1 cm). We keep the album's identity and substitute its verb: **touching the picture**. That substitution is defensible — putting a finger on a photograph, on a face, is a thing people do to photographs and is not a computing gesture — but it is a substitution, and §12.1 records it as untested.

---

## 3. THE PAGE — GEOMETRY AND INVARIANTS

### 3.1 The two rectangles that never move

```
1180 × 820 pt, landscape, locked

  ┌──────────────────────────────────────────────────────────┐  y=0
  │                        THE LEAF                          │
  │        ┌────────────────────────────────────┐            │  y=80
  │        │                                    │            │
  │        │            THE FRAME               │            │
  │        │           800 × 500 pt             │            │
  │        │                                    │            │
  │        └────────────────────────────────────┘            │  y=580
  │        x=190                            x=990            │
  │                                                          │  y=620
  │              THE CAPTION BAND  800 × 150                 │
  │                                                          │  y=770
  └──────────────────────────────────────────────────────────┘  y=820
```

- **THE LEAF** — the album page. Full bleed, edge to edge, `#211D19`, a deep warm charcoal-brown. It is the same colour on every screen of the product, forever.
- **THE FRAME** — 800 × 500 pt, always at x 190–990, y 80–580. Warm white `#F2EDE4`, square corners, no shadow, no rounding, no border. It is a mounted print on a black album leaf.
- **THE CAPTION BAND** — 800 × 150 pt, directly beneath the frame, same width as the frame, no background of its own (leaf shows through). This is where an album's caption is written: under the print, in the print's width.

**These two rectangles are in the same place on every screen in the product for the entire study.** They do not move, resize, animate, or reflow. Nothing else is ever on the screen.

This is the strongest structural rule in the direction, and it is what makes P10 (UI frozen at enrolment, no A/B on the patient surface) and HCI §8.3 (procedural learning is bound to spatial position) hold by construction rather than by discipline.

### 3.2 The page grammar

> **The frame holds the subject. The caption band holds what the album says about the subject.**

| Subject | What is in the frame | What is in the caption band |
|---|---|---|
| A photograph | the print, `contentFit: contain` inside a 24 pt warm-white mount → image box 752 × 452 | the name, the one true sentence, or the question |
| A saying | the saying, set as a written card, dark ink on the warm-white mount | (empty, or the second half of the saying) |
| A song | the title, set as a written card | the artist and the year |
| A choice | the frame **divides** into two prints (see §5, rung 2) | the question, spanning both |

`contentFit: contain`, never `cover`. A portrait photograph shows with warm-white margins either side — which is exactly what a print looks like in an album, and which means **we never crop a face**.

### 3.3 The one touch rule

> **Touch what is in the frame.**

- **One thing in the frame** → the whole screen advances. Every pixel of the 1180 × 820 is live. The print is the visible affordance; the rest of the leaf is a generous, invisible margin of error.
- **Two things in the frame** (rung 2, and the roster) → each is its own target; the leaf between and around them is inert.

Making the *whole screen* the target on single-subject pages is the single largest accessibility win available here, and it is a direct consequence of the metaphor. HCI §1.1 measured **1.9 touch-outside-target errors per attempt** in adults aged ~82 (vs 0.6 in middle-aged adults), and prior smartphone experience did not rescue it. §1.3 measured that hitting 80% accuracy needs ~2.3 cm of active area in the left 25% of the screen against ~1.1 cm in the central 50%. **Both findings become irrelevant when there is no off-target region to fall into.** Off-target offset is still logged (`off_target_tap_offset_px`, closing HCI Open Question 1) but it can no longer produce an outcome.

The ADR's Playwright assertion `getBoundingClientRect().width >= 88` passes on every patient control by a factor of four or more: the smallest target anywhere in this direction is a 340 pt half-frame (≈67 mm), against a minimum of 88 pt (≈17 mm) and an HCI-derived floor of 20 mm.

### 3.4 Touch handling

| Rule | Number | Source |
|---|---|---|
| Accept touch-**down**, never require touch-up inside the target | — | essential tremor is kinetic and degrades accurate movement, HCI §1.4 (ET ~4.6% of 65+) |
| Ignore all pointers after the first while one is down | — | unintended multi-touch activation is a documented failure, HCI §2.1, §2.4 |
| Ignore movement entirely — there is nothing to drag | — | drag needed 14.8 vs 8.1 attempts in 80+ adults, HCI §1.1 |
| Input lockout after every page turn | **400 ms** | HCI implication 9 (300–500 ms post-tap lockout) |
| Visual acknowledgement of touch-down | **within 1 frame (≈16 ms)** | HCI implication 35 requires feedback within 100 ms |
| No double-tap, long-press, dwell-to-select, swipe, pinch, rotate | — | P9; double-tap took 18.2 s vs 8.4 s with 3× off-target errors, HCI §1.1; "forgot to wait for selection time", §10.3 |

**Touch acknowledgement:** on touch-down the mount brightens from `#F2EDE4` to `#FFFCF6` instantly — a state change, not an animation, so no transition duration exists. It holds until the page turn begins. A tap swallowed by the 400 ms lockout still gets the acknowledgement, so the hand is never told it did nothing.

---

## 4. VISUAL LANGUAGE

### 4.1 The thesis: the app contributes no colour of its own

The dominant surface is dark warm charcoal. The only bright things on screen are the photographs and the words underneath them. **Every chromatic pixel in this product came out of the family's shoebox.** The interface has one dark tone and two paper tones and that is the entire palette. Her life is the design; the app is the leaf it is stuck to.

### 4.2 Tokens

| Token | Value | Role | Contrast on leaf | LRV |
|---|---|---|---|---|
| `leaf` | `#211D19` | the album page, every screen | — | **≈ 1** |
| `mount` | `#F2EDE4` | the frame; the print's own border | **14.4 : 1** | **≈ 85** |
| `mountTouched` | `#FFFCF6` | touch-down state, 16 ms, no fade | 15.6 : 1 | ≈ 96 |
| `ink` | `#F2EDE4` | names, questions, sentences on the leaf | **14.4 : 1** | — |
| `inkQuiet` | `#C8BFB0` | era line, secondary caption | **9.2 : 1** | — |
| `inkOnMount` | `#211D19` | text set inside the frame (sayings, song titles) | 14.4 : 1 vs mount | — |
| `rule` | `#948A7C` | the rule under a missing letter (rung 1) | 4.9 : 1 (non-text boundary) | — |

- **7:1 WCAG 1.4.6 AAA is the floor and every text pair clears it with margin.** The lowest text ratio in the product is 9.2:1.
- **The leaf/mount LRV difference is ≈ 84 points**, against the DSDC Stirling / BS 8300:2018 minimum of **30** and the "excellent, gives margin for advanced dementia" mark of **40**. This is the single most-missed rule in the HCI brief (implication 17) and this direction clears it by more than double the excellent threshold, on the only two surfaces that exist.
- **No meaning is encoded in colour anywhere**, so §3.2's blue/green/violet discrimination loss under lens yellowing is not merely mitigated — it is unreachable.
- **No orange or yellow content on a light ground** (§3.3, lemon yellow worst) — unreachable, because there is no light ground.
- **No pure white at full brightness** (implication 22) — the brightest surface is `#F2EDE4`.

### 4.3 Type

One family: the platform system sans (SF Pro on iOS), **Regular 400 and Medium 500 only**. Never Light or Thin — thin strokes are high-spatial-frequency and AD contrast sensitivity is worst exactly there (HCI §3.1).

| Role | Size | Weight | Alignment |
|---|---|---|---|
| The name — the one word that matters | **48 pt** | 500 | centred under the print |
| The one true sentence | **36 pt** | 400 | left-aligned in the frame's width |
| The question | **36 pt** | 400 | centred |
| The era line ("Blackpool, about 1957") | **32 pt** | 400, `inkQuiet` | centred |
| A saying / a song title, set in the frame | **48 pt** | 400 | centred |
| A roster name | **44 pt** | 500 | centred |

All within the ADR's 32–48 pt band. Line height **1.5**. Paragraph spacing **1.5× line height**. Never justified (WCAG 1.4.8). A single caption line is centred, as an album caption is; anything running to two lines is left-aligned in the frame's width.

**We borrow the album's caption *position*, never its handwriting.** A script or handwriting face is high-spatial-frequency by construction and is exactly what §3.1 says this cohort cannot resolve. The caption looks like an album caption because of where it sits, not because of how it is drawn.

**Text is always real text, never baked into an image** (WCAG 1.4.9, implication 21) — which also means it scales.

**Text size is a caregiver setting with three steps (32 / 40 / 48 pt base), chosen once at enrolment and frozen.** At the largest step the caption band grows to 200 pt and the frame shrinks to 800 × 450. That is a layout change, so per P10 and HCI implication 53 it is chosen before day one and never changed again.

### 4.4 Motion

**Opacity only. Nothing in this product ever translates, scales, rotates, or moves.** The photograph never changes size and never slides. This satisfies WCAG 2.3.3 (AAA) and HCI §5.1–5.3 (nausea, migraine, cybersickness in 3 of 12 participants) not by suppression but because there is no motion to suppress.

| Transition | Duration | Note |
|---|---|---|
| Page turn (print cross-fades to print) | **400 ms** | ADR §7: no transition under 300 ms |
| Caption ink appearing | **900 ms** | M-23's "fade slowly" |
| Caption ink withdrawing (answer-first) | **1200 ms** | slow enough to read as settling, not as a UI event |
| Touch acknowledgement | **0 ms — a state, not a transition** | reconciles ADR §7 with HCI implication 35 |

**Recorded conflict:** the ADR mandates *no transition under 300 ms*; HCI implication 41 says screens should "replace instantly or cross-fade over ≤ 150 ms". The ADR is binding and wins. The resolution that makes both defensible: HCI's ban is on *page-slide, parallax, viewport motion and content moving under the finger*. A stationary 400 ms opacity cross-fade is none of those. It is the visual equivalent of a page settling, and it is slower than any UI event a user would read as a machine responding.

### 4.5 Sound

- **One voice.** The family's recorded voice where it exists; otherwise TTS reading family-typed text (P19 — the app reads what a human wrote; never generated). Rate reduced; recordings ≤ 10 s (implication 40).
- **One chime.** M-137, undifferentiated: a single soft tone on every page turn, identical regardless of outcome. Its energy sits at **500–1500 Hz**, deliberately below the 2–4 kHz consonant band that presbycusis destroys first (HCI §4.2: threshold elevation above 2 kHz, worsening monotonically). Two discriminable sounds would be a per-trial correctness signal the patient learns to read — ND-5 by the back door, and the frozen shape already kills it.
- **Nothing is ever marked by silence either.** Every page turn chimes, so the absence of a chime never means anything.
- **Audio is never the sole channel for anything.** **55% of US adults 75+ have disabling hearing loss and fewer than 1 in 3 who would benefit have ever used a hearing aid** (HCI §4.1). Every word the app speaks is also written in the caption band or the frame, at 36–48 pt, at ≥9:1 contrast, before or as it is spoken (implication 38). If the sound is off, broken, or unheard, the product still works.

### 4.6 Why it does not look like a toy

No rounded blobs. No illustration. No mascot. No cartoon. No primary colours. No confetti, badges, coins, stars, or progress rings (P30, ND-27). Every rectangle has square corners. Nothing bounces, pops, or wobbles. There is not one drawn shape anywhere in the product that is not a photograph or a letterform.

### 4.7 Why it does not look like a hospital

Hospital software is white ground, clinical blue accents, dense 14 pt type, icon rows, form fields, progress bars, and charts. This direction has **no white ground, no blue anywhere, no type below 32 pt, no icons at all, no fields, no bars, and no charts**. "No icons" is enforceable as a lint rule over `src/ui/patient/**`: the patient surface may render `Image` (photographs) and `Text`, and nothing else.

What it looks like instead: **a black-leaf album under a warm reading lamp.**

---

## 5. THE FOUR CUE RUNGS, RENDERED

This is how the app never shows a failure.

> **The ladder is not four screens. It is one page that keeps being written on. The photograph never moves, never resizes, never changes. Only the caption gains ink. Nothing is ever taken away, nothing is marked, nothing turns red, nothing says "no".**

Help arrives by the page becoming *more written*, which is the direction an album's page naturally travels. A page with more writing on it is a better page, not a remedial one.

### Rung 0 — free recall

```
        ┌────────────────────────────────────┐
        │                                    │
        │      [ photograph of Margaret ]    │
        │                                    │
        └────────────────────────────────────┘

                 And who is this?
```

Caption band: `And who is this?` — 36 pt, centred, `ink`. Spoken once, softly, as it appears. Then silence. **No timer, no dots, no countdown, no spinner, no "thinking" indicator** (WCAG 2.2.3 AAA: no time limits, ever). The app waits.

She says the name aloud, or she touches the picture, or she does nothing.

**Grading:** `attained_rung = 0`. Mic is open; `utterance_duration_ms`, `speech_rate_wpm`, `latency_to_first_input_ms` are logged as features. **ASR never grades and never determines correctness** (P27). There is no "I knew that" button and no "Show me again" button — HCI implication 29 proposed exactly that and **P4 kills it explicitly** as the corpus's single biggest unvalidated assumption. The patient never supplies a grade and never sees one.

**After 8 seconds of no touch and no speech:** rung 1.

### Rung 1 — partial cue

```
        ┌────────────────────────────────────┐
        │                                    │
        │      [ photograph of Margaret ]    │
        │                                    │
        └────────────────────────────────────┘

                 And who is this?

                  M a r g _ _ _ _
```

The question **stays**. The masked name fades in beneath it over 900 ms: `name.slice(0, k)` at 48 pt, with each missing letter drawn as a 28 pt-wide `rule`-coloured underscore. M-23, a substring function driven by a per-item integer, **zero new content**.

"Fade slowly, restore silently": **every 8 seconds, `k` increments by one and that single letter fades in over 900 ms**, up to `k = ceil(len/2)`. When she next succeeds on the item, `k` resets to its floor with no comment, no announcement, and no visible event.

**Grading:** `attained_rung = 1`, `hint_level_reached = 2`, `presentation_mode = cued_recall`.

**After the mask reaches its cap and 8 more seconds pass:** rung 2.

### Rung 2 — two-choice, reached downward as help

```
   ┌───────────────┐        ┌───────────────┐
   │               │  120pt │               │
   │  [ Margaret ] │  gutter│   [ Jean ]    │
   │               │        │               │
   └───────────────┘        └───────────────┘
    340 × 500 pt              340 × 500 pt

              Which one is Margaret?
```

The frame **divides** without moving: two prints, 340 × 500 pt each, within the same 800 pt outer bounds, separated by a **120 pt gutter of bare leaf (≈ 24 mm)** — three times the ≥8 mm dead-space requirement (implication 2). Each target is ≈ 67 mm wide, against the ~17.5 mm performance plateau (HCI §1.3).

Caption band: `Which one is Margaret?` — 36 pt, centred, spanning both.

The foil is **a second photograph from the same deck** (M-10, §2.3) — zero new content, ever.

**M-10 is reached only downward, as help.** The dignity lens is verbatim: "indefensible as a cold personal probe". It is never the first thing she sees on a personal card. It is the third thing the page offers her when the first two did not land.

#### What happens on a wrong tap — the most important paragraph in this document

She touches Jean.

The mount under Jean brightens. The chime sounds — the same chime as always. Then, in the caption band beneath Jean's print, the page writes **`Jean`** at 48 pt and speaks it.

1.2 seconds later, the leaf turns to a single print of Margaret at rung 3, with her name and her one true sentence written underneath, spoken.

**There is no "no". There is no "not quite". There is no red, no shake, no buzz, no second attempt, no re-ask, no correction.** She touched a picture and the album told her who it was, and then it showed her Margaret. She was never told she was wrong. She was told two true things about two people she loves.

`correct = 0` is written to the event log in the same SQLite transaction that advances the UI. **You can record a failure and never display one** — §5.2.3's requirement, rendered as a page turn.

**A tap on the bare leaf at rung 2:** both mounts brighten for 300 ms and settle. No text, no sound, no reproach. Contextual feedback that points at the two touchable things (implication 35, §8.2) without ever implying a mistake was made.

**No tap for 20 seconds:** rung 3. Not choosing is not failing; it is another way of asking for help, and help is what arrives.

### Rung 3 — familiarity exposure, no question

```
        ┌────────────────────────────────────┐
        │                                    │
        │      [ photograph of Margaret ]    │
        │                                    │
        └────────────────────────────────────┘

                     Margaret

        Your daughter. She rings on Sundays.
```

Name at 48 pt. The one true sentence at 36 pt. Spoken in that order, family voice if recorded, TTS otherwise. **There is no question mark anywhere on the page.** There is nothing to answer.

> **Rung 3 and M-02 The Narrated Album are the same screen.** The bottom of the mandated cue ladder and the product's warmest zero-demand surface are one object. This is why the ladder can never bottom out into failure: **it bottoms out into the nicest page in the app.**

`attained_rung = 3`, `presentation_mode = familiarity_exposure`, `rescued_to_success = true`.

The page turns 8 seconds after the sentence finishes.

### The ladder as data

The rung she was on when she turned the page **is** the datum. No self-report (P4), no ASR (P27), no adjudication. Objective, from a tap, exactly as scheduler requirement 2 demands: `correct × cue_level × latency × attempt_index`.

**On the personal deck we record how much help was needed, never whether she failed.** `attained_rung` is the dependent variable. `hint_level_reached`, `n_hints`, `time_to_first_hint_ms`, `assistance_dependency_index` all fall out of the page's own behaviour with no additional interaction.

Per P2 and scheduler requirement 4: **a miss adds cue support and re-presents one rung easier. It never shortens the interval.**

---

## 6. THE SIX FROZEN MECHANICS, RENDERED

### 6.1 M-35 — Complete the Saying (opener and closer)

The frame holds a **written card**: `inkOnMount` on the mount, 48 pt, centred. This is period-correct album practice — a title page or a written leaf tipped in among the prints — and it means the frame still never moves.

```
        ┌────────────────────────────────────┐
        │                                    │
        │        A stitch in time...         │
        │                                    │
        └────────────────────────────────────┘
```

Spoken as it appears. Then silence — she finishes it, or she doesn't.

**After 6 seconds:** `...saves nine.` fades in beneath it inside the same frame over 900 ms, and is spoken **with** her either way. The complete saying sits for 2 seconds. Then the page turns.

Generic, overlearned, era- and locale-matched, zero personal stakes, near-certain success, **zero content ask**. It establishes the vocal channel before any demand lands (P11's mandated generic opener), it is P1's guaranteed-success closer played unconditionally, and it is P25's floor sentinel: failure to complete an overlearned proverb is a strong acute-change signal.

Two at the open (~45 s), one at the close (~20 s).

### 6.2 M-56 — Your Song

```
        ┌────────────────────────────────────┐
        │                                    │
        │        Rock Around the Clock        │
        │                                    │
        └────────────────────────────────────┘

              Bill Haley & His Comets
                      1955
```

Frame: the title, 48 pt, written card. Caption band: artist at 36 pt, year at 32 pt `inkQuiet`. 30 seconds of a song from her late teens, decade-matched from birth year.

**No waveform. No equaliser. No progress bar. No pause button. No volume control** — a slider is a drag and P9 forbids it; volume is a caregiver setting and this is why M-138 died.

Zero demand: singing, tapping, weeping and silence are all valid responses. The title card is not decoration — it is the second channel, and it names what she is hearing for the 55% who may not hear it well.

**A tap during the song turns the page, exactly as everywhere else.** The song is not precious and the album is hers to turn. Breaking the one touch rule here to protect a 30-second clip would cost more than the clip is worth. `song_ended_by = tap | completed` is logged; nothing else changes.

Placement is randomised per session: before the personal block (primed, = M-58) or after it (unprimed). Same asset, two positions, `prime_condition` logged, zero build.

### 6.3 M-02 — The Narrated Album

This is rung 3 (§5). It is also the fallback for everything, the thing M-134 fades into, the thing M-135 assembles, and the product's home state. One photograph, name, one true sentence, spoken, nothing asked.

It is worth saying plainly: **in this direction, the zero-demand mechanic is not a special mode. It is what the app looks like when it is doing nothing in particular.** Which is what an album looks like.

### 6.4 M-20 — The Answer First (personal), and the M-25 month-target

The Camp block. Answer-first, then withdrawal, then the ladder.

**Beat 1 — the answer.** The leaf turns to the print with its caption **already written**: `Margaret` at 48 pt, the sentence at 36 pt. Spoken. This is rung 3's exact page. 4 seconds.

**Beat 2 — the withdrawal.** The caption ink fades out over **1200 ms**, leaving the print alone on the leaf. The photograph does not move. Nothing slides. A beat of silence.

**Beat 3 — the question.** `And who is this?` fades into the caption position over 900 ms. Rung 0. The ladder runs (§5).

6–10 tier-1 face cards, era-ordered from the reminiscence bump forward and turning around invisibly before the lost decades (M-131 — a sequencing policy, no UI, `turnaround_decade` logged).

**The month-target (M-25)** is the same page with a sentence instead of a name. Frame: a photograph of Jean. Caption after withdrawal: the masking mechanism applied to the sentence rather than the name —

```
             Jean comes on _ _ _ _ _ _ _ _ _
```

M-23's `slice` generalises from names to the month-sentence at **zero marginal cost**. Rung 2 for the month-target divides the frame into two **written cards** (`Wednesdays` / `Sundays`) in the same two positions with the same 120 pt gutter — identical geometry, identical motor act, and the one touch rule ("touch what is in the frame") holds unchanged.

It re-presents at 30 s, 1 m, 2 m, 4 m, 8 m across the block; the deck cards are the clinically prescribed filled interval.

**The one lie this direction tells:** ink does not disappear from a real album page. The withdrawal in beat 2 is the single un-album-like event in the product, and it sits inside the mechanic carrying the entire clinical core. §12.2 owns this.

### 6.5 The generic probe (M-20 errorless arm / M-21 recall-first arm)

≤ 8 generic stock faces, ≤ 2 minutes, scheduler-blind (`item_is_probe = true`), no family content ever, arm frozen at enrolment per participant.

**Opening card**, in the frame: `Now a few faces to put names to.` — 8 words, reading age ~9, no test vocabulary anywhere ("test", "quiz", "score", "correct", "session", "card", "review" are banned from the patient surface entirely, implication 27).

**The probe is not visually signposted to the patient**, and it should not be. Stock faces read as *more pages of the album with people she does not know* — which in a real family album is completely ordinary. Everybody's album has strangers in it: a cousin's wedding, a works outing, somebody's neighbour at the seaside.

**Each item, two beats:**

1. **The open ask.** Print in the frame, `Who is this?` in the caption band. Mic open. 6 seconds. `correct = null`, `presentation_mode = free_recall`; `utterance_duration_ms` and latency logged as speech features. Nothing is scored here.
2. **The scored choice.** The frame divides. Two stock prints, `Which one is Alice?`. This is the **only** trial in the entire product that produces a recorded uncued failure. `correct ∈ {0,1}`, `presentation_mode = recognition`, `item_is_probe = true`.

Then, either way, the frame reunites into a single print of Alice with her name written and spoken — rung 3, the same page as everything else. **A miss is logged, then cue support is added and the item is re-presented until she succeeds.** Distress on the probe disables the probe for the remainder of the study and is logged as an adverse event, not as missing data.

**Recorded consequence, and it is a real one.** P9 (single tap only) and P27 (ASR never grades) together make an objectively-scored *uncued free-recall* trial impossible on any patient surface, this one included. The probe therefore measures **2-alternative recognition**, not free recall. That lowers its ceiling and weakens comparability with BRANCH's face–name protocol. It also reshapes what M3 contrasts: errorless-vs-recall-first becomes *name-before-choice* vs *choice-then-name*, which is still a real and pre-registrable contrast, but it is not the contrast §5.2 describes. This is a cost of the binding constraints, not of the album — any tap-only direction pays it — and it needs to be written into the protocol before B5, not discovered in analysis. Foil count is a parameter, not a mechanic (this is why M-11 died); two is the value that fits the frame.

### 6.6 M-40 — Tell Me About This One

The quietest page in the product, and the best fit the metaphor has.

**Beat 1.** Print in the frame. Caption band writes `I love this one.` — spoken. Then, beneath it, `What was going on here?` — spoken. Two lines, 4 words and 5 words.

**Beat 2.** Both lines fade out over 1200 ms. **The photograph sits alone on the leaf.** In the caption position, one small persistent line at 32 pt, `inkQuiet`:

```
                  I'm listening.
```

And then the app is quiet. No question mark, no prompt, no timer, nothing to do, nothing to answer. **This is precisely what an album looks like when someone is telling you about a picture.**

`I'm listening.` is the **P23 disclosure, in plain words, in the patient UI, in the patient's own language, for the entire duration of recording.** It is content, not chrome; it is true; it is captioned rather than iconic; and it doubles as the only instruction the page gives. There is no red dot and no microphone glyph — icons are chrome, a red dot is alarming, and neither is a disclosure a person can read.

**After 15 seconds of silence** the caption cues without comment, from the item's own data at zero content cost: `That's Margaret, at the seaside.` — spoken once, then back to `I'm listening.`

**It always ends warmly regardless of what was produced.** On a tap, or at ~2 minutes: `Thank you. I love hearing about that one.` — 8 words, spoken, then the page turns.

Photo is personal or generic era, randomised per session (M2). Mic records; **ASR never grades** (P27, ND-26). The primary outcome is words spoken, not accuracy. There is no correct answer and the page never behaves as though there could be one.

---

## 7. EVERY SCREEN, IN ORDER

Total 8–10 minutes. Every step runs with nobody else in the room.

| # | The screen | Frame holds | Caption holds | Mechanic | Auto-advance if untouched |
|---|---|---|---|---|---|
| 0 | *the resting photograph from yesterday* | a print | nothing | M-134 | turns every 20 s, forever |
| 1 | first saying | `A stitch in time...` | `...saves nine.` at 6 s | M-35 | ~15 s |
| 2 | second saying | as above | as above | M-35 | ~15 s |
| 3 | the song *(primed sessions)* | title | artist, year | M-56 | 30 s |
| 4 | month-target, opening trial | photo of Jean | sentence → withdrawal → masked sentence | M-25 | ladder, ~20 s |
| 5a–5j | the Camp block, 6–10 cards | a print | answer → withdrawal → rung 0 → 1 → 2 → 3 | M-20 + M-24 + M-22/23/10 + M-131 | ladder, ≤60 s per card |
| 6 | probe opener | `Now a few faces to put names to.` | — | — | 4 s |
| 6a–6h | probe items, ≤8 | stock print → two stock prints → one print | `Who is this?` → `Which one is Alice?` → name | M-20 / M-21 | 6 s + 20 s + 8 s |
| 7 | tell me about this one | a print | `I love this one.` → `I'm listening.` | M-40 | 120 s |
| 8 | the song *(unprimed sessions)* | title | artist, year | M-56 | 30 s |
| 9 | closing saying | a saying | its second half | M-35 | ~15 s |
| 10 | fade to rest | a print | **nothing, ever again** | M-134 | 20 s each × 6, then it settles |

**Ladder timings inside a card:** rung 0 at 0 s → rung 1 at 8 s → one letter every 8 s to the cap → rung 2 → rung 3 at 20 s → page turns 8 s after the sentence ends.

**The invisible branch (M-135, Nothing Today).** On a deterministic trigger only — two consecutive skips, an abandoned previous session, or any distress event; **never an inferred classifier** — steps 4 through 8 are replaced by six M-02 pages: a print, a name, a sentence, spoken, nothing asked. Steps 1, 2, 9 and 10 are unchanged, so P11 and P1 still hold. `session_mode` is logged first-class.

> **In this direction the bad-day mode requires no new screen, no announcement, and is undetectable to the patient — because M-02 is what the album looks like by default.** The difficulty floor and the home page are the same object. She is never told she is having a bad day, because there is nothing on screen that could tell her.

---

## 8. HOW A SESSION STARTS

**Personal device.** The tablet is provisioned once by the caregiver and runs in Guided Access / kiosk mode. There is no login, no code, no password, no puzzle, ever (P9, ND-30, WCAG 3.3.8/3.3.9).

**There is no launch state, because an album is never "off" — it is closed or open, and we leave it open.** The screen is already showing yesterday's resting photograph when she picks it up. The chime fires mid-morning (P8, hard-blocked after 16:00 per ND-29; the session is already loaded and needs no network — the patient session issues zero network calls). Tapping the notification, or simply touching the resting photograph, turns the page to the first saying and the session has begun.

There is no "Start", no "Welcome", no "Good morning, Margaret", no "Ready?", no date, no time, no weather. **There is a photograph, and then there is the next one.**

If she picks it up after 16:00, or after today's session has run, the resting photographs simply keep turning. **The album never refuses. It only ever has less to say.** No "come back tomorrow", no due count, no backlog, no catch-up, no counter, no message (P6, ND-28).

**Shared care-home tablet — the shelf.** Before you open an album, you pick which album.

```
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  [face]  │   │  [face]  │   │  [face]  │
   └──────────┘   └──────────┘   └──────────┘
      Margaret        Ellen          Doris

   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  [face]  │   │  [face]  │   │  [face]  │
   └──────────┘   └──────────┘   └──────────┘
       Colin          Ruth          Arthur
```

Same leaf, same dark ground. Six prints, 320 × 290 pt each, mounted, with a first name at 44 pt written beneath in the album-caption manner. Tiles are 320 × 350 pt with 55 pt gutters — every target ≈ 63 mm, every gutter ≈ 11 mm. Tap yours; the shelf cross-fades over 400 ms into your first page.

**Hard cap: six residents per tablet.** Not seven. Scrolling is forbidden on the patient surface (ND-32, implication 7) and paging is chrome, so the cap is a real constraint on deployment: a seventh resident requires a second tablet. The ADR already reaches the same conclusion by a different route ("a care home needing a hard boundary between two residents gets two tablets").

The roster is the one screen in this direction where a person can choose wrong and the app cannot tell. §12.7 owns it.

---

## 9. WHAT HAPPENS WHEN SHE DOES NOTHING

### 9.1 She pauses on a page

Nothing is lost and nothing is threatened. Every page has an auto-advance and every advance is downward into help, never onward into more demand. **No countdown is ever displayed** (WCAG 2.2.3 AAA). No "are you still there?" — that is an un-suppressible interruption and WCAG 2.2.4 (AAA) forbids it. No "still thinking?" — that is a comment on her performance.

### 9.2 She walks away mid-session

**After 90 seconds with no touch and no speech on any demand page, the session fades to rest.** Silently. No message, no summary, no score, no "you completed 4 of 10".

The 90 s rest timer runs **only on demand pages** (rungs 0–2). Zero-demand pages — sayings, songs, rung 3, M-40's listening — have their own budgets and turn themselves.

`session_end_reason = timeout`. Trial state at the moment of fade is captured, so **"did not know" and "stopped attending" stay distinguishable in the data** (M-134's stated purpose). `ended_on_success` is computed from whether the last page carried demand — and because fade-to-rest is itself a warm demand-free page, **S3 (≥99% of sessions terminate on a success) holds by construction, not by hope.**

**When she comes back and touches it, the resting album turns. It does not resume.** There is no resume, ever. Resuming means the app remembers something she does not, and drops her into a demand with no context. Tomorrow's session starts fresh; the scheduler treats unseen items as unseen.

### 9.3 She never touches it at all — the apathy case

**The app runs the entire session by itself.**

Every page auto-advances. Every demand descends the ladder unanswered to rung 3. What plays is the opener, the song, her people named one after another with a true sentence about each, the closer, and then the album resting on a photograph she loves. She is told everything and asked nothing.

**A session with zero taps is a complete session, a logged session, and a session that ends on a success.** `n_taps = 0`, `attained_rung = 3` on every item, `ended_on_success = true`.

This matters more than any other property in this document. §12 of the frozen shape names apathy — the most prevalent neuropsychiatric symptom in dementia and a direct disease-caused predictor of not initiating any activity — as the pre-registered F2 failure mode, and admits that if the pilot dies, it is more likely to die of nobody pressing anything than of a carer running out of content. **This direction's worst-case behaviour is a warm slideshow with a familiar voice that runs on its own with nobody in the room, and that is the best available answer to a person who cannot initiate.**

The honest counterweight is in §12.8: a zero-tap session produces almost no measurement.

### 9.4 Fade to rest, in detail

After the closing saying, the caption fades and does not return. The frame turns to a photograph every 20 seconds — six of them, no captions, no names, no questions, no speech, only the chime — and then settles on the caregiver-nominated photograph and stays there.

**Nothing more is ever asked.** A tap on the resting album turns to another resting photograph, forever, with no demand of any kind. The device is safe to hand to someone, safe to leave on a table, safe to walk away from (P28 implemented, not asserted).

Brightness drops to 60% after 60 s at rest. If the tablet is not charging it follows the OS display timeout after 10 minutes; on a charging stand it stays lit indefinitely, because a lit photograph of your daughter is the only thing in this product that fights apathy without asking anything of anyone.

---

## 10. WHERE THIS DIRECTION OVERRULES THE HCI BRIEF, AND WHY

The HCI brief is empirical and binding on its numbers. Three of its *design implications* are overruled here, each by a document that outranks it. Recorded so this is not relitigated as an oversight.

| HCI implication | This direction | Why |
|---|---|---|
| **29** — two buttons, "Tell me" / "I know"; the self-report is the grading signal | **Killed.** No self-report anywhere. The rung at which she turns the page is the grade. | **P4 kills it by name**, calling it "the corpus's own single biggest unvalidated assumption" (HCI's own Open Question 2). Metamemory is impaired in AD; ND-6 forbids asking the patient to rate her own recall. |
| **31 / 46** — an always-visible labelled exit; one back/home affordance with a text label | **No exit, no back, no home, no label.** | ADR §7: no navigation chrome, one action per screen. And the metaphor's own answer: there is nowhere to go back to, because the session is a fixed sequence with no branches. **You do not close an album. You put it down.** "I'm done for now" is delivered by stopping — 90 s → fade to rest — which costs no decision and no button. |
| **44 / 45** — a persistent header showing location; visual finite progress ("2 of 5") | **Neither exists.** | ND-5 forbids a due-count or backlog surfaced to the patient; a finite progress row is a countable demand and P6 forbids anything that reads as a quota. WCAG 2.4.8 Location has no referent when there is exactly one place. |
| **41** — cross-fade ≤ 150 ms | **400 ms.** | ADR §7 mandates no transition under 300 ms and is binding. Reconciled in §4.4: implication 41's target is *page-slide, parallax and viewport motion*; a stationary opacity cross-fade is none of those. |

Everything else in the HCI brief's implications A–L is satisfied or exceeded.

---

## 11. WHAT THE ENGINEERING CONTRACT LOOKS LIKE

Short, because there is almost nothing to build.

```ts
// src/contract/testids.ts — the patient surface, in full
patient: {
  leaf:        'patient.leaf',
  frame:       'patient.frame',
  frameLeft:   'patient.frame.left',
  frameRight:  'patient.frame.right',
  caption:     'patient.caption',
  rosterTile:  (i: number) => `patient.roster.${i}`,
}
```

Six identifiers. The whole patient surface is **one screen component** (`app/(patient)/session.tsx`) driven by a page descriptor, plus the roster. No navigator, no stack, no modal host, no drawer, no tab bar, no header — expo-router's stack is never pushed on the patient side because there is nowhere to push to.

Lint rule, enforceable: `src/ui/patient/**` may render `View`, `Image` and `Text` and nothing else. No icon component exists to import.

The Playwright touch-target assertion `getBoundingClientRect().width >= 88` passes on every control with the smallest being 340 pt.

---

## 12. WHAT THIS DIRECTION COSTS — HONEST WEAKNESSES

1. **The verb is not the album's verb.** Real page-turning is a pinch-and-lift at the page edge, forbidden by P9 and unlearnable on glass. We keep the album's identity and substitute *touch the picture*. Whether the identity survives the substitution for a 90-year-old is untested and is the first thing I would put in front of the B6 PPI panel.

2. **The answer-first withdrawal is the metaphor's one lie.** Ink does not vanish from an album page. It is the single un-album-like event in the product and it sits inside M-20, the mechanic carrying the entire clinical core. Rendering it as slow ink-fade on a stationary photograph is the gentlest available form of the lie; it is still a lie.

3. **Tap-as-grade is confounded and I cannot un-confound it.** A tap at rung 0 means "I know this" and "let's move on" identically. Mitigations: `attained_rung`, not `correct`, is the dependent variable on the personal deck, so the confound degrades a variable that is not a primary outcome; and `latency_to_first_input_ms` plus `utterance_duration_ms` let an analyst separate "tapped in 1.2 s in silence" from "tapped after speaking for four seconds". Mitigated, not solved.

4. **The probe becomes a recognition measure, not a free-recall measure.** §6.5. This weakens M1's learning curves and reshapes M3's contrast, and it must be pre-registered as such rather than discovered. It is a cost of P9 + P27 in combination, which the synthesis never reconciled, and every tap-only direction pays it.

5. **The masked name is a literacy task wearing a memory task's clothes.** `Marg____` requires orthographic access and word-fragment completion. Nothing in the corpus establishes that fragment completion is preserved in mild-moderate AD the way face familiarity is (§3 #28 concerns personal *semantic* knowledge, not orthography). Rung 1 is mandated by P2 and derived at zero cost by M-23, and it may still be the weakest rung on the ladder.

6. **The dark leaf is a bet, and it is the token I most expect to lose.** Implication 22's warning against pure white at full brightness is graded (c); the DSDC 30-point LRV rule is satisfied by dark-on-light or light-on-dark equally; neither has been tested with this cohort. A dark screen can read as "off" or "broken" to someone expecting a lit display, and its reflectance in a bright care-home day room is worse than a light ground's. This needs B6, and the palette is built as three tokens precisely so it can be inverted in one commit before enrolment opens — never after (P10).

7. **The roster is the one screen where a person can be wrong and the app cannot tell.** A resident tapping the wrong face gets someone else's album, and no software can detect it. The premise — that her own photograph is the one she recognises — is the whole product's premise, so if it fails here it has failed everywhere. Logged as `roster_selection_corrected` when a carer intervenes; otherwise invisible.

8. **A zero-tap session is complete but near-uninformative.** `attained_rung = 3` on every item is indistinguishable between "descended because she did not know" and "descended because she was not looking". Session-level `n_taps = 0` flags it for exclusion, and speech features give partial discrimination, but the app's most humane failure mode is also its least measurable one. That trade is the right way round and it should be stated in the protocol, not defended in review.

9. **No text labels means nothing to say to her on the telephone.** A daughter two hundred miles away cannot say "press the blue button at the bottom" — there is no blue button and there is no bottom. Every other direction gives the caregiver a vocabulary for remote help; this one gives her "touch the picture" and nothing else. That cost lands on the caregiver, who is already the person carrying the most, and it is the strongest argument against this direction that I know of.

10. **Six residents per shared tablet is a hard deployment ceiling**, imposed by the no-scrolling and no-chrome rules together. A twenty-bed home needs four tablets. That is a procurement conversation this direction creates.

---

## 13. WHAT I WOULD PUT IN FRONT OF THE B6 PANEL

P32 makes the mechanic freeze conditional on a panel with people living with dementia, and the same applies here. Five questions, in priority order:

1. Show the resting page and say nothing. Does anyone touch it without being told to? *(This is the whole direction's load-bearing claim.)*
2. Dark leaf or light leaf. Two tablets, side by side, in a real day room in daylight. *(§12.6.)*
3. Watch a rung-2 miss. Does "the album told me two true things" read as warm, or does the second name land as a correction? *(§5, the most important paragraph here.)*
4. Does `Marg____` read as a hint, or as a broken word? *(§12.5.)*
5. Does the withdrawal in M-20 read as the page settling, or as something being taken away? *(§12.2.)*
