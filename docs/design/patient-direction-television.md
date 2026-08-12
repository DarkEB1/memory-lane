# PATIENT SURFACE — DIRECTION: THE TELEVISION PROGRAMME

**Status:** Design direction, for review against the frozen v1 shape. Not binding.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles, §9 NEVER DO), `docs/design/00-V1-PRODUCT-SHAPE.md` (the six frozen mechanics), `docs/research/elder-and-dementia-hci.md` (all empirical numbers), `docs/architecture/00-ADR-PLATFORM.md` §7 (styling).
**Scope:** the patient surface only. Caregiver onboarding, enrolment code entry, and the researcher surface are out of scope and use ordinary modern UI.
**Requires one amendment to a binding rule** (ND-32, "autoplay") to be viable. That amendment is argued in §3. If it is refused, this direction does not ship.

---

## 1. THE ARGUMENT

A person born in 1941 has, by 2026, spent roughly sixty years in a room with a television. They have never once wondered what a television is for, where its content came from, what to press to make it work, or whether they are doing it right. They have zero years of practice with an app.

Every dementia-facing app ever built has asked them to hold, simultaneously: *this rectangle contains a task; the task is waiting for me; my touch is what makes it move; if I do not touch it, nothing happens and that is my fault.* That is four unfamiliar propositions before the first photograph appears.

A television asks for none of them. It plays. It plays whether you are watching, whether you understand, whether you are asleep, whether you have gone to make tea. It has a beginning you recognise and an end you recognise. Talking back to it is completely normal and completely optional and nobody has ever been marked wrong for it.

**The proposal: the patient surface is not an app that happens to be gentle. It is a broadcast. It runs. Touch is participation, never input.**

### 1.1 What this buys, against named failures in the corpus

| Named failure | Where it is named | What a broadcast does about it |
|---|---|---|
| **Apathy** — the most prevalent neuropsychiatric symptom in dementia, a *direct disease-caused predictor of not initiating any activity* | §1.9; §12.1 of the frozen shape names it as the pre-registered F2 failure mode and admits the product has no mechanic aimed at it | Initiation is removed from the critical path. The programme initiates; the person attends or does not. A design whose first requirement is "press this" is aimed at exactly the faculty the disease has taken. |
| **The blank stare that kills tap-to-continue** | Not named in the corpus, which is itself the point. §2.3 of the HCI brief documents its cousins — "forgot to wait for a selection timer", "forgot the task rules mid-task" | There is no tap-to-continue anywhere in the product. There is no state in which the screen is waiting for something the person has not realised it wants. |
| **Walking away** | P28: design for the caregiver's absence. §4 step 10 of the frozen shape. F4: non-usage attrition must be a curve, not an anecdote | Walking away is the normal, expected, non-remarkable end of a broadcast. Nothing pauses, nothing accuses, nothing is left half-done. |
| **The 16% catastrophic-reaction rate during evaluation** (Tiberti 1998, n=146) — *"a recall-testing app is a neuropsychological evaluation from the patient's phenomenological point of view"* | HCI §7.1, called the most important number in that document | The phenomenology of watching a programme is not the phenomenology of sitting an examination. This is the single most valuable thing the metaphor does and it is not cosmetic — it changes what the person believes is happening to them. |
| **Hearing loss: 55% of adults 75+, fewer than 1 in 3 who would benefit use an aid; presbycusis strips 2–4 kHz, exactly the consonant band** | HCI §4.1–4.2 | Television solved this in 1979. Everything the programme says appears simultaneously as a caption, verbatim, in 40 pt. Nobody in this cohort needs to be taught what subtitles are. |
| **Content exhaustion** — Rai 2021's participants "exhausted the content faster than expected" | §1.1 | A programme is expected to be the same shape every day. That is what a programme *is*. The frozen shape's Rule of the Rotating Frame (§10, argument 2) — identical graded core, variety spent on the surround — is a broadcast running order, not a compromise. |

### 1.2 The inversion that makes it work

In a tap-to-continue design, **silence means failure**: the screen is stuck, the person is stuck, and someone has to come and fix it.

In a broadcast, **silence means the programme carries on**. It is not a state at all. It is the space between the question and the presenter answering it.

Everything below follows from that one sentence.

---

## 2. THE ONE THING ON SCREEN THAT IS NEW

Nothing in this direction invents a mechanic. All six frozen mechanics survive unchanged in substance. What the direction adds is a single structural object:

> **The caption strip.** A band across the bottom of the screen, 180 pt tall, full width, permanently in exactly the same place. It is the only place in the entire product where words appear. Everything the programme says is written there at the moment it is spoken. It never moves. It never scrolls. It never contains a control.

And a single colour rule:

> **Bone means touchable, and nothing else in the product is ever bone.** When there is nothing to touch, there is no bone on screen. The colour is the affordance. It never has to be explained, because it is only ever true.

---

## 3. THE RULE THIS DIRECTION BREAKS, STATED FIRST

**ND-32:** *"Never use page transitions, parallax, autoplay, viewport motion, modals, hidden menus, or scrolling on the patient surface."*

A self-advancing programme is, on the plainest reading of that word, autoplay. I am not going to pretend otherwise.

**Why I think the word is doing the wrong work there.** Every other item in ND-32 is a *motion* item, and the evidence cited for the whole clause (HCI §5.1–5.3) is vestibular: optic flow, cybersickness in 3 of 12 participants under HMD, WCAG 2.3.3's verbatim "nausea, migraine headaches, and potentially needing bed rest." Two still photographs replacing one another by a 600 ms cross-dissolve, in a frame that never translates, produces zero optic flow. The harm the rule was written to prevent is not present.

**And the frozen shape already assumes it.** §4 step 3 plays 30 seconds of music with no gesture. Step 10 says *"the pictures keep going."* M-134 is defined as an inactivity timeout that continues rendering. The ADR celebrates, as a reason to choose React Native over WKWebView, *"audio playback for a user who cannot follow a 'tap to enable sound' prompt — no gesture gate."* The v1 product as frozen is already a thing that plays by itself. This direction makes that honest and total rather than partial and unremarked.

**What I am asking for, precisely:**

> ND-32's "autoplay" is narrowed, in writing, to: *autoplaying video, and any content that translates, pans, zooms or scales across the screen.* Still content replacing still content by cross-dissolve, and audio beginning without a gesture, are permitted on the patient surface.

Nothing else in §9 is touched. If the review will not grant that narrowing, this direction is dead and should be killed rather than watered down — a broadcast that requires a tap to keep broadcasting is a tap-to-continue app wearing a costume, and it will fail in exactly the way tap-to-continue apps fail.

### 3.1 Two smaller collisions, resolved in the open

**ADR §7 says "no transition under 300 ms." HCI implication 41 says "screens replace instantly or cross-fade over ≤150 ms."** These contradict. The ADR is the binding styling decision, and HCI 41's stated concern (§5.1–5.3) is viewport motion, which we have none of. **Resolved for the ADR: every change on the patient surface is a 600 ms cross-dissolve. Nothing ever slides, and nothing ever changes faster than the eye can be startled by.**

**HCI implications 44 and 45 ask for a persistent location header ("Your photos — 2 of 5") and a finite visual progress indicator.** I am resolving against both. A counter on the patient surface is one bad day away from being read as a score, and ND-5 forbids a due-count. The television direction supplies the same reassurance by a route this cohort already reads fluently: **a programme signals its finiteness by having a beginning and a sign-off, not by numbering itself.** The theme at the top and the closing saying at the bottom are the progress indicator. There is no counter anywhere in the product.

---

## 4. THE SET

### 4.1 The physical assumption

10.2"–10.9" iPad, **landscape, orientation locked**, propped or mounted at 40–50 cm, in Guided Access / single-app mode, mains-powered where possible. Rotation is unlearnable (HCI §2.2) and an orientation change is a layout change, which invalidates procedural learning (§8.3) — so the frame has one shape, for ever.

A stand is part of the pilot kit. Involuntarily dragging the whole tablet is a documented failure mode (HCI §11.2) and the paper's own recommendation is to fix the device to a surface.

At 264 ppi rendered at 2×, **1 pt = 0.192 mm**. Every physical figure below is derived from that.

### 4.2 The frame

```
 x=0                                                              x=1180 pt
 ┌────────────────────────────────────────────────────────────────┐  y=0
 │                                                                │
 │                                                                │
 │                    THE PICTURE                                 │
 │              1180 × 640 pt  (227 × 123 mm)                      │
 │        photograph fitted inside, never cropped                  │
 │                                                                │
 │                                                                │
 ├────────────────────────────────────────────────────────────────┤  y=640
 │  THE CAPTION STRIP        1180 × 180 pt  (227 × 35 mm)          │
 │  text begins at x=80, always, for ever                          │
 └────────────────────────────────────────────────────────────────┘  y=820
```

Two zones. That is the entire layout system. There is no third zone, no header, no footer, no corner, no chrome. There is no clock, no date, no battery, no wifi symbol, no back arrow, no home affordance, no settings, no dots, no bar.

**There are zero icons in the patient surface.** Everything on screen is either a photograph or a word. Ambiguous icons are explicitly warned against (HCI §2.4) and the hamburger — the most standardised icon in software — is correctly read by only ~49% of adults over 40 (§2.5). We spend none of that budget.

### 4.3 Touch geometry

ADR §7 sets a hard floor of **88 pt** touch targets, asserted in Playwright via `getBoundingClientRect().width >= 88`. At 0.192 mm/pt that floor is **16.9 mm** — comfortably past the ~11 mm near-100 % hit-rate threshold, but just *under* the ~17.5 mm plateau where older-adult button performance stops improving (HCI §1.3). It is a floor and this direction treats it as one. Real targets:

| Target | Size | Physical | Justification |
|---|---|---|---|
| The picture (M-02, M-20 rung 0/1/3, M-40) | 1180 × 640 pt | 227 × 123 mm | The whole frame is the target. The frozen shape says "whole screen tappable" and means it. |
| Two-choice card (rung 2, probe) | 460 × 560 pt | 88 × 108 mm | 2.2× the 40 mm large-screen optimum for older participants (§1.3). |
| Gutter between the two cards | 100 pt | **19.2 mm** | Requirement is ≥8 mm (implication 2). We are 2.4× it. Never two tappable things closer than a finger width, and a finger pad is 16–20 mm. |
| Roster face (shared tablet) | 300 × 330 pt | 58 × 63 mm | Grid corners fall in the outer 25 %, where required active area doubles from ~1.1 cm to ~2.3 cm (§1.3). At 58 mm we clear the doubled requirement 2.5×. |

**Horizontal placement.** The two choice cards sit at centres x=310 and x=870. The central 50 % of an 1180 pt frame is x=295 to x=885. Both are inside it, deliberately (implication 3).

**Input rules**, all from HCI §B:
- Single tap only. No swipe, long-press, pinch, rotate, drag, or double-tap.
- Multi-touch suppressed: first pointer wins, all others discarded.
- Accept **touch-down** inside the hit area. Do not require touch-up inside it — essential tremor (~4.6 % of 65+) is kinetic and degrades exactly the accurate-return movement.
- 400 ms post-tap lockout, all pointer events dropped.
- Micro-movement ignored; no drag threshold to cross.
- **No dwell-to-select, ever.** Participants forgot to wait (§10.3).
- Tap acknowledgement within 100 ms: the touched surface lifts in luminance by ~12 %, holds 200 ms, returns.

### 4.4 The palette

Three values and the photographs. That is all.

| Token | Hex | LRV | Role |
|---|---|---|---|
| `ground` | `#201B17` | ≈ 1.2 | The room. Every background, everywhere, always. |
| `bone` | `#E8DDCB` | ≈ 73 | **Touchable.** Nothing else is ever this colour. |
| `caption` | `#F2E9DA` | ≈ 81 | Text on ground. |
| `ink` | `#221D18` | ≈ 1.4 | Text on bone. |
| `waiting` | `#B5A798` | ≈ 39 | Used in exactly one place: the unfilled letters of a masked name. |

**Contrast, measured not asserted:**
- `caption` on `ground` = **13.9 : 1**. WCAG 1.4.6 AAA requires 7:1; that 7:1 figure exists to compensate for roughly 20/80 vision, and contrast-sensitivity loss in AD sits *on top of* normal ageing, worst at high spatial frequencies (§3.1).
- `ink` on `bone` = **12.2 : 1**.
- `waiting` on `ground` = **7.2 : 1** — still above AAA, because a masked name is information, not decoration.
- **LRV separation `ground` → `bone` = 71.8 points.** DSDC Stirling / BS 8300:2018 require ≥30 between critical adjacent surfaces and describe 40+ as excellent. This is the surface rule most commonly missed and we are 2.4× past the excellent threshold.

**Colour never encodes meaning.** There is no blue-versus-green, no pastel pair, no hue distinction anywhere — lens yellowing makes green, blue and violet hard to separate (§3.2). The bone rule is a *luminance* code, redundant with size and position. There is no orange or yellow content on a light ground anywhere, because there is no light ground anywhere (§3.3). Pure white is never used (implication 22).

**Why dark.** Three reasons, in order of weight. It is the only way the photograph becomes the brightest object in the room, which is the entire point of the direction. It removes glare and light scatter from a yellowed, cataractous lens. And a warm near-black room at 40 cm with one lit picture in it is what a television actually looks like — it is the cheapest possible signal that this is a thing to watch rather than a thing to operate.

### 4.5 Type

**One family. One weight. One optical size.**

- A humanist sans with a large x-height and open apertures. **Source Sans 3 Semibold** is the recommendation: openly licensed, no vendor risk, no Light weight to be tempted by. Ruled out: geometric sans faces (closed apertures, single-storey *a*, low x-height — all high-spatial-frequency problems), anything with a Light or Thin cut, and anything with a display cut. Thin strokes are high spatial frequency and that is precisely the band AD strips first (§3.1).
- **Nothing on the patient surface is below 32 pt.** ADR §7 sets the band at 32–48 pt and this direction stays inside it:

| Element | Size | Physical cap height ≈ | Where |
|---|---|---|---|
| A person's name | **48 pt** | 9.2 mm | Caption strip, first line |
| Everything the programme says | **40 pt** | 7.7 mm | Caption strip |
| The one sentence about a person | **32 pt** | 6.2 mm | Caption strip, second line |

- Left-aligned at a fixed x=80, always. Never centred, never justified (WCAG 1.4.8). **A fixed left edge means the first word is always in the same physical place** — the eye learns where to look procedurally, which is the only kind of learning we can rely on.
- Line height 1.5. Maximum two lines. Maximum ~8 words per line.
- Real text, never baked into an image (WCAG 1.4.9).
- Reading age 8–10 (COGA), never above lower-secondary (WCAG 3.1.5 AAA). One idea per sentence, active voice, present tense, concrete nouns, no metaphor, no idiom.

### 4.6 Motion

- **Every change is a 600 ms cross-dissolve.** Nothing else exists.
- Nothing translates. Nothing rotates. Nothing scales. Nothing parallaxes.
- **Ken Burns is forbidden.** The slow pan-and-zoom across a photograph is the single most tempting cliché of the television metaphor, and it is optic flow across the entire viewport in a cohort where 3 of 12 participants got cybersick and vestibular decline is associated with falls. The photographs are still. They are still the way a photograph in a frame on a sideboard is still.
- No looping instructional animation, even though HCI implication 43 permits one. Two reasons: P10 freezes the UI, so a thing that appears in session 1 and never again is a change across sessions; and **a programme that requires no input requires no tutorial.** There is nothing to teach.

### 4.7 Sound

- **Every spoken word is captioned, verbatim, at the moment it is spoken.** Never before it, never after it. 55 % of adults 75+ have disabling hearing loss and under 1 in 3 who would benefit have ever used an aid.
- TTS voice: low fundamental, warm, **~3 syllables/second** against a ~4 syl/s normal rate. Normal speech is >240 phonemic chunks per minute and listening effort under hearing loss *or* dementia produces persistent fatigue (§4.3).
- Audio is mixed with its intelligibility carried below 2 kHz wherever possible. Presbycusis elevates thresholds monotonically above 2 kHz — 3 kHz worse than 2, 4 worse than 3 — and 2–4 kHz is where the consonants live. We do not rely on consonant clarity to carry meaning; the caption does that.
- **One sound effect exists in the entire product.** A single soft, non-negative, undifferentiated transition tone, identical on every touch and every advance, regardless of outcome (M-137, half-shipped). Two discriminable sounds are a per-trial correctness signal the person learns to read — ND-5 through the back door. The clause we hold is: *nothing is ever marked by silence.*
- **Volume is a caregiver setting, set once, off the patient surface.** M-138 was cut because a slider is a drag and P9 forbids drags.
- Family voice recordings are optional; TTS reads family-typed text by default. A family that records nothing has a fully working programme.

---

## 5. TURNING THE SET ON

### 5.1 The chime (P8, step 1)

Mid-morning local notification. Session already assembled and pre-loaded on the device. Hard-blocked after 16:00 without explicit caregiver override (ND-29).

Copy, exactly: **"This morning's pictures are on now."**

No count. No name of a streak. No "you haven't in five days." No badge on the icon. If nobody picks the tablet up, **nothing happens** — no backlog, no catch-up, no message to anyone (P6, ND-28). The chime is sold to the family as a chime, because no Expo app can wake a sleeping tablet on iOS and pretending otherwise is a lie we would get caught in.

### 5.2 Personal device

**There is no home screen. There is no title screen. There is no Start button.**

The app foregrounds and the programme is already beginning. No login, no code, no password, no puzzle (ND-30, WCAG 3.3.8/3.3.9).

**The warm-up — 4 seconds.** The screen is `ground`. Over 600 ms a single photograph from her deck cross-dissolves up into the picture zone and holds. The caption strip is empty. There is one soft tone. Then the announcer speaks and the programme has started.

That is the ident. It is four seconds long, it happens identically every single time, and it does the one job an ident does: *it tells you the thing you are about to watch is the thing you watched yesterday.*

If she opens it six times in a day, it plays six times, from the top, with no comment. There is no "you've already done this today," because there is no *done*.

### 5.3 Shared care-home tablet

The roster is the **one screen in the entire product that waits for ever.** It is not part of the programme. It is the aerial socket, and it must never start someone else's broadcast on its own.

```
 ┌────────────────────────────────────────────────────────────────┐
 │                                                                │
 │    ┌──────────┐    ┌──────────┐    ┌──────────┐                │
 │    │          │    │          │    │          │                │
 │    │  photo   │    │  photo   │    │  photo   │   each tile    │
 │    │          │    │          │    │          │   300×330 pt   │
 │    │ Margaret │    │  Ellen   │    │  Peter   │   58×63 mm     │
 │    └──────────┘    └──────────┘    └──────────┘   bone-matted  │
 │                                                                │
 │    ┌──────────┐    ┌──────────┐    ┌──────────┐   40 pt gutters │
 │    │  photo   │    │  photo   │    │  photo   │                │
 │    │  Iris    │    │  Frank   │    │  Joan    │                │
 │    └──────────┘    └──────────┘    └──────────┘                │
 │                                                                │
 └────────────────────────────────────────────────────────────────┘
```

- Face and **first name only**, 32 pt inside the tile. No surname, no room number, no date of birth. That constraint already exists in the ADR's `device_roster` view and is what limits what a thief learns from photographing the screen.
- Bone mat around each portrait: these are the only touchable things, and the whole grid is touchable, so the bone rule is not violated.
- Caption strip reads: **"Who is watching?"** — spoken once, on entry, then silence.
- **Maximum six faces. There is no page two.** Scrolling is forbidden on the patient surface (implication 7) and a paging control is navigation chrome. A ward with nine residents gets two tablets. The ADR already establishes this precedent for a different reason ("a care home needing a hard boundary between two residents gets two tablets").
- Tapping a face dissolves straight into the warm-up. Server-side this grants nothing; it is a client-side selection, exactly as the ADR specifies.
- The roster dims 25 % after five minutes and holds there for ever. It never sleeps on mains power.

---

## 6. THE RUNNING ORDER

The frozen ten-step session, rendered as broadcast segments. Nothing is added, nothing is dropped, nothing is reordered.

| # | Segment | Mechanic | On screen | Sound | What she does |
|---|---|---|---|---|---|
| 1 | The chime | runtime | — | notification | Nothing, or picks it up |
| 2 | **The theme** — two sayings | **M-35** | ground; caption only | announcer | Says it, or doesn't |
| 3 | **The music** (primed sessions) | **M-56** | one still era photograph, held 30 s | the song | Sings, taps the table, weeps, or nothing |
| 4 | **The headline** — the one sentence | **M-25** | photograph + sentence | spoken | Nothing required |
| 5 | **The people** — 6–10 face cards | **M-20** + M-24/M-25/M-22/M-23/M-10/M-131 | the ladder, §7 | spoken | Nothing, or one choice |
| 6 | **The interval game** — ≤8 stock faces | **M-20/M-21 probe** | face + two name plates | spoken | One choice |
| 7 | **The interview** | **M-40** | one large photograph, then silence | then nothing | Talks, or doesn't |
| 8 | **The music** (unprimed sessions) | **M-56** | as step 3 | the song | as step 3 |
| 9 | **The sign-off** — one saying | **M-35** | ground; caption only | announcer | Says it, or doesn't |
| 10 | **Closedown** | **M-134** | one nominated photograph, for ever | silence | Nothing, for ever |

Total 8–10 minutes if she does nothing at all. Well inside the 30–35 minute fatigue envelope (§6.4) and inside the 3–5 minute target for the demanding portion.

### 6.1 M-35 — Complete the Saying → **the theme**

Screen: `ground`. **No photograph.** This is the announcer speaking before the pictures start, and its visual emptiness is what makes the first photograph land.

```
 ┌────────────────────────────────────────────────────────────────┐
 │                                                                │
 │                                                                │
 │                        (nothing)                               │
 │                                                                │
 │                                                                │
 ├────────────────────────────────────────────────────────────────┤
 │  A stitch in time...                                    40 pt  │
 │                                                                │
 └────────────────────────────────────────────────────────────────┘
```

Spoken: *"A stitch in time…"* Then a **five-second gap**, in which the screen does not change and the caption does not change and nothing is asked. Then, whether she has spoken or not, the caption cross-dissolves to the whole line and the voice completes it:

```
 │  A stitch in time saves nine.                                  │
```

Two of these open. One closes. **Nothing is ever tappable during a saying.** There is no bone on screen. This is the purest statement of the direction: for forty-five seconds at the top of every session, the product demonstrates that it will keep going and that she cannot get it wrong, before it asks her for anything at all.

It is also the P25 floor sentinel — failure to complete an overlearned proverb is a strong acute-change signal — and the P1 guaranteed-success closer, played unconditionally.

### 6.2 M-56 — Your Song → **the music**

30 seconds from her late teens, decade-matched from birth year.

One generic era photograph from the shipped library, **absolutely still**, for the full 30 seconds. No album art (licensing). No visualiser. No waveform. No lyric. No pulse. Caption strip holds the title once:

```
 │  The Tennessee Waltz                                    40 pt  │
 │  Patti Page, 1950                                       32 pt  │
```

**Nothing is tappable during the song.** That is deliberate and it is the mechanic working: singing, tapping the table, weeping and complete silence are all correct, and adding a control would imply one of them was more correct than the others.

Placement is randomised per session — before the personal block (primed, = M-58) or after it (unprimed control). `prime_condition` is logged. One asset, two positions, zero build.

### 6.3 M-02 — The Narrated Album → **the picture and the voice-over**

The default frame of the whole programme, and the fallback for everything.

```
 ┌────────────────────────────────────────────────────────────────┐
 │                    ┌──────────────────┐                        │
 │                    │                  │                        │
 │                    │   Margaret       │   photograph fitted,   │
 │                    │   1968           │   never cropped,       │
 │                    │                  │   4 pt corner radius   │
 │                    └──────────────────┘                        │
 ├────────────────────────────────────────────────────────────────┤
 │  Margaret                                               48 pt  │
 │  Your daughter. She rings on Sundays.                   32 pt  │
 └────────────────────────────────────────────────────────────────┘
```

Photograph is **fitted, never cropped** — a face is never cut off to fill a frame. Letterboxed in `ground`. No drop shadow, no vignette, no filter, no border. It reads as a photograph, not as a card in an app.

Spoken in the family voice if one was recorded, TTS otherwise, reading the family-typed sentence. No generative text ever reaches this strip (P19, ND-16).

**The whole frame is one touch target, and the touch does exactly one thing: it plays the voice again.** Not "next". Never "next".

This is the most consequential small decision in the direction. In a broadcast, a touch is leaning forward, not pressing on. A "next" control is the one control a confused hand can use to erase the thing she was looking at, and it is the control that turns watching back into operating.

- The frame advances on its own after **20 seconds**.
- Each touch replays the voice and resets that timer, up to a hard ceiling of **60 seconds** on any one photograph, after which it advances regardless.
- So repeated touching *holds* a picture she likes. It cannot skip and it cannot stall.

The frozen shape credits "patient-paced advance in M-02" as delivering the agency that killed M-13. I am reading "patient-paced" as **dwell**, not **skip**, and saying so out loud, because the two are opposite in dignity terms and the frozen shape does not disambiguate them.

### 6.4 M-20 — The Answer First → **the people**

The ladder. Full frame-by-frame in §7 below.

Era-ordered from the reminiscence bump forward, turning around invisibly before the lost decades (M-131). `turnaround_decade` logged. The person sees no ordering, no chapter, no heading — the running order of a programme is not shown to the viewer, it is just the order things happen in.

### 6.5 The probe → **the interval game**

≤8 generic stock faces, ≤2 minutes, mid-session, scheduler-blind. **No family content ever appears here.**

The announcer introduces it, once per session, in the caption strip:

```
 │  Here is a little game.                                        │
 │  These are people from an old album. Nobody you know.          │
```

That second line is not decoration. It is the dignity guarantee of the whole segment: it tells her, in advance and in plain words, that these are strangers and that not knowing them is the expected and correct state of affairs. It also happens to be true, which is why we can say it.

```
 ┌────────────────────────────────────────────────────────────────┐
 │              ┌──────────────────┐                              │
 │              │   stock face     │                              │
 │              └──────────────────┘                              │
 │      ┌────────────────┐      ┌────────────────┐                │
 │      │    Harold      │      │    Douglas     │  bone plates   │
 │      └────────────────┘      └────────────────┘  460 × 180 pt  │
 ├────────────────────────────────────────────────────────────────┤
 │  Is this Harold, or Douglas?                            40 pt  │
 └────────────────────────────────────────────────────────────────┘
```

Two bone name-plates, 460 × 180 pt each (88 × 35 mm), 100 pt apart, centres inside the central 50 %.

On any touch: both plates dissolve, the correct name appears in the strip, it is spoken, and the face stays. The tone is the same tone either way. The screen shape is the same either way. **Nothing on screen ever differs between a right answer and a wrong one.**

`item_is_probe = true`. This is the only place in the product where a real failure is recorded and it is never displayed. Any distress event disables the probe for the remainder of the study and is logged as an adverse event, not as missing data.

### 6.6 M-40 — Tell Me About This One → **the interview**

One large photograph — personal or generic era, randomised per session (M2).

```
 │  I love this one. What was going on here?               40 pt  │
```

Then, over 600 ms, **the caption strip empties and stays empty.**

That is the entire listening indicator. No microphone icon. No level meter. No pulsing ring. No countdown. A meter would turn her speech into a measured quantity in front of her, which is exactly the thing P23 and ND-5 exist to prevent, and a countdown is forbidden outright (WCAG 2.2.3).

**The words going away is the signal that it is her turn.** It is repeatable, it is identical every time, and it is learned procedurally after about three sessions without anyone explaining it.

Cueing, from the shipped generic library, spoken and captioned:
- after **15 s** of silence — *"Take your time."*
- after a further **25 s** — *"Tell me anything at all."*
- after a further **30 s**, it closes warmly regardless of what was produced — *"That's a good one to keep."*

Those cues are non-questions on purpose. Rememo's therapists explicitly rejected Who/What/Where/When formats as clinical-assessment-like, so the cue must not be "who else was there?" And the app cannot invent anything about the photograph, because it cannot see it (ND-17, no face detection) and must not generate facts about her life (P19).

The mic records. **ASR never grades** (P27, ND-26). Transcripts never reach the research plane (§8.4). The primary outcome here is words spoken, not accuracy, and there is no accuracy to have.

---

## 7. THE FOUR RUNGS ON SCREEN

This is where the ladder either works or the product fails, so it is specified frame by frame. The rungs are derived from the deck, not authored — **new content cost: zero.**

**The television reading of the ladder:** a presenter asks a question, leaves a gap, gives you the first syllable, narrows it to two, and then tells you the answer and says something nice about the person. Nobody watching at home has ever failed that sequence. It is not four difficulty levels. It is one person being helped, in public, gently, by someone whose job is to make sure they are not left hanging.

### Rung −1: the answer, first

Before any question exists. This is M-20's whole thesis: help arrives before failure lands.

```
 │  [photograph of Margaret, full frame]                          │
 ├────────────────────────────────────────────────────────────────┤
 │  Margaret                                               48 pt  │
 │  Your daughter. She rings on Sundays.                   32 pt  │
```
Spoken. Held **4 s**. Then the name and sentence cross-dissolve away over 1200 ms — slowly, so it reads as the caption clearing rather than as something being taken from her. The photograph does not move.

### Rung 0 — free recall

```
 │  [same photograph, unchanged, same position]                   │
 ├────────────────────────────────────────────────────────────────┤
 │  And who is this?                                       40 pt  │
```
Spoken once. **No bone on screen. Nothing is tappable. Nothing is required.**

Waits **7 seconds**. Then descends. It always descends — there is no branch in which it does not.

### Rung 1 — partial cue (M-23)

No new screen. The photograph is untouched. Only the caption cross-dissolves:

```
 │  Marg – – – – –                                         40 pt  │
      ^^^^  caption colour     ^^^^^^^^^  waiting colour
```

`name.slice(0, k)` in `caption`, one em-dash per remaining letter in `waiting`. **Length is preserved**, so the dashes are a real cue and not just an ellipsis. The voice says *"Marg…"* and stops, at the same reduced rate as everything else.

Waits **7 seconds**. Then descends.

The frozen shape writes this as `Marg____`. Underscores at 40 pt read as a form field. Dashes read as a crossword, which is a thing this cohort has done every morning for sixty years.

### Rung 2 — two-choice (M-10, reached downward, never as a cold probe)

The frame cuts. This is the only moment in the product where the picture zone changes shape, and it is a **cut** — a 600 ms cross-dissolve with no translation. Television cuts. That is what television does.

```
 ┌────────────────────────────────────────────────────────────────┐
 │   ┌──────────────────┐         ┌──────────────────┐            │
 │   │                  │         │                  │            │
 │   │   Margaret       │         │    the foil      │  460×560pt │
 │   │   (target)       │         │  (2nd deck photo)│  88×108 mm │
 │   │                  │         │                  │            │
 │   └──────────────────┘         └──────────────────┘            │
 │      bone mat            100 pt / 19.2 mm      bone mat        │
 ├────────────────────────────────────────────────────────────────┤
 │  Which one is Margaret?                                 40 pt  │
 └────────────────────────────────────────────────────────────────┘
```

Both photographs are large. Both are family. Both are bone-matted, because both are touchable, and that is the first bone she has seen in this trial.

Waits **12 seconds**. If nothing is touched, it descends anyway.

**On any touch — either card:** both photographs dissolve out together, the tone plays, and rung 3 arrives as a fresh single-photo frame of Margaret. There is no intermediate moment. There is no frame in which the screen shows which card she touched. She chose, and the programme went on to talk about Margaret.

The dignity lens on M-10 is verbatim: *indefensible as a standalone personal probe.* It is defensible here because it is reached downward, as help, and because it is one of four states of one card rather than a mechanic of its own.

### Rung 3 — familiarity exposure, no question (M-02)

```
 │  [photograph of Margaret, full frame]                          │
 ├────────────────────────────────────────────────────────────────┤
 │  Margaret                                               48 pt  │
 │  Your daughter. She rings on Sundays.                   32 pt  │
```

Spoken. Held **8 s**. **There is no question mark anywhere on this screen.**

> **The ladder only ever travels one direction — downward, toward more help — and its bottom rung is a photograph of somebody she loves with their name written under it. There is no rung below that and there is nothing to fall off.**

### 7.1 What is recorded

On the personal deck, **nothing is graded.** The dependent variable is `attained_rung` — the frozen shape's own words: *"we record how much help was needed, never whether she failed."*

The ladder descends on a timer, not on a judgement. A touch at rung 2 stops the descent; silence does not. Voice activity in the window is logged as a speech *feature* (`utterance_duration_ms`), never as correctness, never through ASR.

This is not a workaround. It is the only reading of the frozen constraints that is internally consistent: P4 forbids self-report grading, P27 forbids ASR grading, and the surface accepts single tap only — so on a card whose first two rungs have no tap target, **there is no mechanism by which a personal-deck failure could be recorded even if we wanted one.** The direction makes that a feature and states it plainly.

### 7.2 The seam I am flagging rather than papering over

§5.2 of the synthesis requires the probe to record *"the first uncued attempt."* In a tap-only product where ASR never grades, a genuinely uncued face–name recall cannot be captured. The probe's first attempt is therefore a **two-name recognition tap** — which is the BRANCH shape, and BRANCH is the precedent §5.2 leans on. But it is a recognition attempt, not a recall attempt, and M3's errorless-vs-spaced-retrieval contrast is thinner on 2AFC than it would be on free recall.

**This is a real cost to M3 and it is not created by this direction — it is created by the intersection of P9, P4 and P27, and it exists in any tap-only rendering of the frozen set.** It needs a decision from the protocol owner, not from a designer.

---

## 8. DOING NOTHING: THE COMPLETE TIMING TABLE

The programme run with **zero touches and zero speech** from beginning to end.

| Segment | Dwell | Advance trigger |
|---|---|---|
| Warm-up / ident | 4 s | timer |
| Saying 1: stem | 5 s | timer |
| Saying 1: completion | 5 s | timer |
| Saying 2: stem + completion | 10 s | timer |
| Song (primed sessions) | 30 s | end of clip |
| Month-target, opening trial | ~20 s | timer |
| **Per face card:** answer-first | 4 s | timer |
| — rung 0 | 7 s | timer |
| — rung 1 | 7 s | timer |
| — rung 2 | 12 s | timer **or touch** |
| — rung 3 | 8 s | timer |
| **= one unanswered card** | **38 s** | |
| Camp block, 6 cards | ~3 min 48 s | with month-target re-presentations interleaved at 1 m / 2 m / 4 m / 8 m |
| Probe intro | 6 s | timer |
| **Per probe item** | 10 s + 6 s reveal | **touch, or timer** |
| Probe, 8 items | ~2 min | |
| Interview: prompt | 6 s | timer |
| — silence | 15 s | timer |
| — "Take your time." | 25 s | timer |
| — "Tell me anything at all." | 30 s | timer |
| — warm close | 6 s | timer |
| Song (unprimed sessions) | 30 s | end of clip |
| Sign-off saying | 20 s | timer |
| **Closedown** | **∞** | never |

**Total, zero input: roughly 9 minutes**, inside the 8–10 minute frozen budget and inside P29's ten-minute discipline. Touching makes it shorter, never longer, except on a photograph she wants to keep looking at — which is the only place in the product where her action extends anything.

---

## 9. CLOSEDOWN — M-134, Fade To Rest

After the sign-off saying, the programme does not stop. It **settles**.

One photograph, nominated by the family at onboarding, cross-dissolves up and holds. The caption strip is empty and stays empty. There is no sound. Nothing is asked, ever again.

- No "Session complete." No summary. No thank-you screen. No score. No "see you tomorrow."
- The screen dims 25 % after 5 minutes and holds there. It dims no further and never sleeps on mains power.
- It stays like that until a human picks the tablet up.

**Why this specific ending.** For a person who was a child or young adult between 1950 and 1975, the closedown was a real, nightly, remembered thing — the programmes ended, the screen settled, and then it just sat there. It is one of the few interface states this generation has decades of practice with **and** it is exactly what M-134 specifies: demand withdraws, the pictures keep going, nothing more is asked. The metaphor and the requirement arrived at the same screen independently, which is the strongest evidence I have that the metaphor is the right one.

Trial state at fade is captured, so *"did not know"* and *"stopped attending"* stay distinguishable (`attained_rung` at fade + `voice_detected` flag + `session_end_reason`).

`ended_on_success = true` is set by the sign-off saying at step 9, which plays unconditionally. Closedown catches everything else. Between them, S3 (≥99 % of sessions terminate on a success or a warm answerable prompt) is a property of the state machine rather than an aspiration audited after the fact.

### 9.1 Early closedown

Closedown also arrives early, on a **deterministic** rule and never on an inferred classifier (P18, ND-15):

> Zero touches **and** zero voice activity across **two consecutive complete items** → cross-dissolve to closedown.

Logged as a behavioural event with `distress_signal_source = abandonment`. Not emotion inference — a count of two things that either happened or did not.

**The false-positive case, stated:** a person sitting quietly and enjoying the programme without speaking or touching will have it shortened. She then gets a photograph she loves, held indefinitely, instead of prompts. That is misfiring toward gentleness, which is the direction the frozen shape already accepts for M-135, and the worst outcome of the error is a nicer screen.

---

## 10. THE SETTLING TAP — the patient's only way out

HCI implication 31 asks for an always-visible "I'm done for now." I am proposing we do not build it, and the substitute must be stated before the deviation can be judged.

**Why not build it.** It is a permanent bone-coloured object sitting beside a photograph of her daughter whose only function is to make the nice thing stop, for a person with fluctuating attention and a tremor. It is also, structurally, navigation chrome, which the ADR forbids, and it re-introduces the idea that this is a task with an exit.

**What replaces it.** Two things, both already true:

1. **Leaving is free and unremarked.** Look away, walk off, put it down: the programme continues briefly and settles onto a photograph. There is nothing to escape from, because every path in the product terminates in a picture she likes, held for ever.
2. **The settling tap.** Four or more touches within two seconds, anywhere on screen, goes immediately to closedown. It is not labelled, it is not taught, it appears in no documentation shown to the patient, and it does not need to be — **it is the physical thing an overwhelmed or distressed hand actually does**, and HCI implication 33 already names rapid repeated taps as a struggle proxy. It is deterministic, it is logged as `distress_signal_source = patient_control`, and it satisfies P18's requirement for a patient-side "not today" without putting a stop button next to a photograph of Margaret.

It cannot misfire harmfully: the worst case is a photograph she loves, held for ever. It does not collide with tap-to-replay in M-02, because one touch replays and four fast touches rest.

The caregiver's one-tap *"stop, this is upsetting"* (P18) lives on the caregiver's own phone and on the tablet's hardware buttons, both of which are operated by a human, which is the correct place for a judgement about distress.

---

## 11. THE INVISIBLE BRANCH — M-135, Nothing Today

Deterministic trigger only: **two consecutive skips, an abandoned previous session, or any distress event.** Never an inferred classifier.

Steps 4 through 8 are replaced by **six high-salience M-02 cards** — photograph, name, one sentence, spoken, nothing asked. Steps 2, 9 and 10 are unchanged, so P11's generic opener and closer and P1's guaranteed-success closer still hold.

**In this direction the branch is invisible for free.** On a normal day the programme is a sequence of photographs with a voice over them, interrupted occasionally by a question. On a bad day it is a sequence of photographs with a voice over them. There is no announcement, no banner, no "let's take it easy today," no visual difference of any kind — because the bad-day mode is the *same frame* with the questions removed, and the frames were never labelled in the first place.

`session_mode` is logged first-class. She is never told she is having a bad day. In a tap-to-continue design this branch needs careful concealment; in a broadcast it is simply a shorter running order, which is a thing programmes do all the time.

DLB-band participants (`fluctuation_band = high`) trigger the floor one step earlier, per the enrolment gate.

---

## 12. EVERY INTERACTION AND EVERY NON-INTERACTION

**The patient surface has exactly two actions, for ever: *again*, and *that one*.** There is no third. There will never be a third.

| Where | One touch | Four fast touches | No touch | No speech |
|---|---|---|---|---|
| Roster (shared tablet) | starts that resident's programme | first touch wins, rest locked out | waits for ever | n/a |
| Saying (M-35) | nothing happens, no acknowledgement | closedown | the voice completes the saying | logged as feature only |
| Song (M-56) | nothing happens | closedown | the song plays out | valid; nothing recorded as failure |
| Narrated card (M-02) | replays the voice, holds the picture | closedown | advances at 20 s | valid |
| Rung −1 / 0 / 1 (M-20) | nothing happens | closedown | descends one rung | descends one rung |
| Rung 2 (M-10) | commits, dissolves to rung 3 | closedown | descends to rung 3 at 12 s | descends to rung 3 |
| Rung 3 (M-02) | replays the voice | closedown | next card at 8 s | valid |
| Probe item | commits, reveals the name | closedown | reveals the name at 10 s | valid |
| Interview (M-40) | replays the photograph's prompt | closedown | cue at 15 s, then 25 s, then warm close | cue at 15 s, then 25 s, then warm close |
| Closedown (M-134) | nothing happens | nothing happens | holds for ever | holds for ever |

**Read the "no touch" column top to bottom. It is a complete, coherent, ten-minute experience that ends on a photograph of someone she loves.** That is the deliverable.

There is no cell in this table containing the words "stuck", "waiting for input", "please try again", or "are you still there?".

---

## 13. THE COMPLETE PATIENT-FACING VOCABULARY

Every word the product can say. Reading age 8–10. Nothing else is permitted on this surface.

**Sayings (shipped library, era + locale matched).** *"A stitch in time saves nine." · "Many hands make light work." · "Where there's a will, there's a way."*

**Questions.** *"And who is this?" · "Which one is [Name]?" · "Is this [A], or [B]?" · "Who is watching?"*

**The interview.** *"I love this one. What was going on here?" · "Take your time." · "Tell me anything at all." · "That's a good one to keep."*

**The game.** *"Here is a little game." · "These are people from an old album. Nobody you know."*

**Content.** A first name. A relationship. One sentence typed by the family. A song title and artist. Nothing else.

**The notification.** *"This morning's pictures are on now."*

**Banned outright on this surface**, over and above §9: *session, card, deck, review, practice, exercise, test, quiz, score, correct, wrong, try, again, next, start, begin, finish, done, complete, continue, skip, due, streak, today's, remaining, level, progress, tap, press, choose, select, ready, welcome, well done, good, nearly, almost, sorry.*

**"Tap" never appears.** The bone colour and the size do the affording. In a broadcast, nobody instructs you to touch the screen.

---

## 14. COMPLIANCE AUDIT

### Against §9 NEVER DO

| # | Rule | Held by |
|---|---|---|
| 5 | No score, chart, streak, red X, "wrong", due-count, backlog | No aggregate surface exists. No counter of any kind, including the finite progress indicator HCI 45 asks for (§3.1). One undifferentiated tone. |
| 6 | Never ask the patient to rate their own recall | No self-report anywhere. The two actions are "again" and "that one". |
| 7 | Never end on a failure, summary or score | Step 9 plays unconditionally; §9 closedown catches everything else. `ended_on_success` is a property of the state machine. |
| 8 | Never let the algorithm retire an item | Items degrade to rung 3 and stay in rotation. |
| 11 | Never ask for free recall of recent episodic events | Nothing touches recency. M-40 is open narration about a photograph. |
| 12 | Never surface a deceased person in a recognition mechanic without explicit caregiver decision | `person_status` mandatory and unskippable at upload; deceased defaults OFF for rungs 0–2, permitted at rung 3 and in M-40. Face and voice yes; never the death; never a question whose answer requires knowing they are gone. |
| 13 | Never correct the patient about factual reality | There is no frame in which the product tells her she was wrong. On a two-choice touch, both cards dissolve and the programme talks about the target. |
| 15 | No inferred emotion or distress classifier | M-135 and early closedown are deterministic counts. The settling tap is a count of touches. |
| 16 | No AI-generated factual content | TTS reads family-typed text. Cue lines are shipped and generic. |
| 27 | No points, badges, mascots, confetti, streaks | Zero icons, zero illustration, zero colour with meaning. |
| 29 | Never nudge after 16:00 | Notification scheduler hard-blocks. |
| 30 | Never require login or a code | Personal device opens into the programme. Shared tablet is a face grid. |
| 31 | Single tap only, no drag/swipe/scroll/modal/transition | Two actions. Cross-dissolve only. No modal, no sheet, no overlay, no scroll. |
| 32 | No transitions, parallax, autoplay, viewport motion | **Partially breached and amended in writing — see §3.** Ken Burns explicitly forbidden. Nothing translates. |
| 33 | Never change the patient UI mid-study; never A/B it | One layout, one palette, one typeface, one weight, frozen at enrolment. No teaching animation that appears only in session 1. No user-facing theme control. |
| 34 | Never require caregiver co-presence | Every segment runs with nobody else in the room. |

### Against ADR §7

| Requirement | Held |
|---|---|
| Minimum 88 pt touch targets | Floor is 88 pt; smallest real target is a 460 × 180 pt name plate; largest is the whole 1180 × 640 pt frame. Asserted in Playwright. |
| 32–48 pt type | Name 48, speech 40, sentence 32. Nothing below 32 exists. |
| 7:1 contrast | 13.9:1, 12.2:1, 7.2:1 measured. LRV separation 71.8 points. |
| No navigation chrome | Two zones. Zero icons. No header, footer, back, home, or settings. |
| One action per screen | Two actions in the whole product; never two *kinds* on one screen. |
| No gestures beyond tap | Single tap, first pointer only, touch-down commit, 400 ms lockout. |
| No transition under 300 ms | Every change is a 600 ms cross-dissolve. |
| No user-facing theme control | One look. Dark, warm, permanent. |
| `StyleSheet.create` + tokens module | Five colour tokens, three type sizes, two zone rectangles. There is very little here to style. |

---

## 15. WHAT THIS DIRECTION IS BAD AT

Six things, in descending order of how much they should worry a reviewer.

**1. It requires an amendment to a §9 hard stop, and §9 hard stops exist because people talk designers out of them.** §3 is the argument, and I believe it, and I also know exactly what it looks like: a designer explaining why the safety rule does not apply to his design. The mitigation is that the amendment is narrow, written down, and independently forced by three parts of the frozen shape that already assume it. But the review should treat §3 as the load-bearing risk of this whole document and not as preamble.

**2. It is optimised for the person who does nothing, and it may condescend to the person who can still do a great deal.** A brisk 71-year-old with mild AD, three months post-diagnosis, may find a thing that answers its own questions before she has drawn breath quietly humiliating. P10 freezes the UI at enrolment, so we cannot tune the dwell timings per person after the fact without breaking the freeze. The frozen shape has no severity-adaptive surface and this direction cannot invent one. **If the PPI panel (B6) finds this, the direction is wrong for a meaningful slice of the enrolled population and there is no patch.** The only lever available is the pre-enrolment dwell configuration, which is a caregiver setting made once — and a caregiver setting a patient's pace is its own dignity problem.

**3. Making silence valid makes silence unmeasurable.** We can no longer distinguish *attending happily* from *asleep* from *left the room* without building the classifier P18 and the EU AI Act forbid. F1, F2 and F4 all get noisier: `session.duration_ms` stops being a proxy for engagement, and the non-usage attrition curve inherits a fatter, blurrier tail. The honest research position is that this direction trades measurement precision for the thing it is meant to buy, and the trade is only worth it if apathy really is the binding constraint — which §12.1 of the frozen shape admits it cannot prove.

**4. The metaphor is cohort-specific and it will drift.** Somebody born in 1935 grew up with the wireless and got a set in their twenties. Somebody born in 1955 grew up with colour, three channels and a remote control. Somebody enrolling in 2036 grew up with a video recorder and will not read a closedown as anything. And P14 requires per-item language and locale, so the cultural furniture cannot be load-bearing. **The direction must rest only on the metaphor's structural properties — it plays, it continues, touch is optional, it ends — and never on its aesthetics.** I have tried to hold that line. §9's closedown is the place I came closest to crossing it.

**5. The probe seam (§7.2).** The uncued attempt becomes a recognition attempt. This is not created by the television direction — it falls out of P9 ∩ P4 ∩ P27 in any tap-only rendering — but this document is where it becomes unavoidable, and M3 is one of only two mechanism contributions the pilot has.

**6. Captions everywhere are an untested bet.** HCI Open Question 6 asks directly whether transcribing a relative's voice helps or hurts, and answers *untested* — it solves presbycusis but adds a competing visual channel that may raise load. P10 forbids A/B testing on the patient surface, so we must choose one and live with it for the pilot. I have chosen always-on, on the strength of the 55 % prevalence figure and the never-audio-alone rule. If it is wrong, we will not find out from this pilot's design, only from the PPI panel, and that is one more reason B6 must run before anything is frozen.

---

## 16. WHAT WOULD KILL THIS DIRECTION

Stated in advance so it is falsifiable rather than defended.

- **The ND-32 narrowing is refused.** Kill it; do not build a broadcast that requires a tap.
- **The PPI panel (B6) reports that people living with dementia experience a self-answering programme as being talked over, or as being handled.** That is the failure mode this direction is most exposed to and the one the literature cannot tell us about, because eight documents researched how to make families use this and none researched whether they want it.
- **Early-closedown false positives, measured in the pilot, truncate a substantial fraction of sessions for people who were attending.** The rule in §9.1 is deterministic but the threshold (two items) is a judgement call with no derivation, exactly like §6.7's ≥95 % target, and it should be labelled as one.
