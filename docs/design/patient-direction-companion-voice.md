# PATIENT SURFACE — DIRECTION: THE COMPANION THAT SPEAKS FIRST

**Status:** Design direction, for adjudication. Not frozen.
**Governed by:** `docs/research/00-SYNTHESIS.md` (§4 principles, §9 NEVER DO — binding), `docs/design/00-V1-PRODUCT-SHAPE.md` (the frozen six), `docs/architecture/00-ADR-PLATFORM.md` §7 (styling).
**Renders:** all six frozen mechanics, all four cue rungs, both device modes. Invents nothing new.
**Device assumed:** 10.2" iPad, landscape, **1080 × 810 pt**, screen 197 × 147 mm → **5.48 pt/mm**, propped on a stand at ~45 cm. Every measurement below is in points with the millimetre conversion stated, because the research numbers are in millimetres and the code is in points.

---

## 1. THE ARGUMENT: WHY THE VOICE HAS TO LEAD

I am not arguing that voice is nicer. I am arguing that after the binding rules are applied, **the voice is the only channel left standing**, and that everyone who has built this product visually-first has been designing for a person who knows that a rectangle on glass can be pressed.

### 1.1 Subtract everything the rules forbid and see what remains

ND-30, ND-31, ND-32 and P9 delete, from the patient surface: login, codes, swipe, long-press, pinch, rotate, drag, double-tap, dwell-to-select, multi-touch, scrolling, modals, sheets, popovers, hidden menus, tab bars, drop-downs, page transitions, parallax, autoplay motion, toasts and banners. P10 deletes progressive disclosure, feature flags and every layout change forever. ND-5 deletes score, chart, streak, due-count, backlog, red X. ND-27 deletes points, badges, mascots, confetti.

What is left of a graphical user interface is **a photograph and a single tap**. That is the whole vocabulary. A photograph and a single tap cannot sequence a ten-minute activity, cannot ask a question, cannot supply a partial cue, cannot end warmly, and cannot tell a person who has never used a computer what is happening. Something has to carry the structure, and the rules have already killed every visual mechanism for carrying it.

**The voice is not a stylistic direction. It is the residue.**

### 1.2 The channel that survives AD vision is not text

Contrast sensitivity in Alzheimer's is depressed at every spatial frequency tested except the lowest, **worst at high spatial frequencies** — fine detail, thin strokes, small type (Gilmore/Cronin-Golomb, replicated psychophysics, grade (a)). This is on top of normal ageing, in which presbyopia is near-universal at 65+ and contrast sensitivity becomes acute by ~80.

Text is high-spatial-frequency content by construction. A face at 113 mm across is low-spatial-frequency content. **A design whose load-bearing channel is text has chosen the channel that fails first in exactly the sensory dimension this population loses first.** WCAG AAA's 7:1 was chosen to compensate for contrast sensitivity loss equivalent to roughly 20/80 vision; it is the floor here, not the target, and no contrast ratio rescues a channel whose problem is stroke frequency rather than luminance.

### 1.3 The gap is not literacy — it is the interactivity model

A person can have a reading age of forty and still not know that a rectangle on glass is a thing you press. Only ~49% of adults 40+ correctly predicted that the hamburger icon opens a menu; ~48% of over-45s do not recognise it at all. In an 80+ cohort, double-tap took **18.2 s vs 8.4 s** with **1.9 vs 0.6** off-target errors, and — the finding that should end the argument — **prior smartphone experience did not improve performance**, which the authors attribute to musculoskeletal and nervous-system ageing rather than unfamiliarity. Familiarity is not the missing ingredient. There is no amount of onboarding that installs the interactivity model.

Voice has no interactivity model to install. **Nobody has to be taught that when a person speaks to you, you may answer.** That competence was acquired at age three and it is not what dementia takes first.

### 1.4 P31, and the difference between a partner and an operator

P31 requires design for social role and contribution, not consumption; the strongest anti-infantilisation move available. A device that speaks first and then waits casts the person as the **responding half of a conversation** — a role, with standing, that she has held her whole life. A device that waits to be operated casts her as an operator, and an operator who does not know how to operate is failing continuously, in silence, with nobody to tell.

### 1.5 It is the only design that can discharge the disclosure duty

P23 forbids anything observable by the caregiver that is not disclosed to the patient **in the patient UI**. §8.4 closes the same hole for the speech-feature layer: *"disclosed in plain words in the patient UI… if it cannot survive being described honestly to the person it is collected from, it does not run."* A written disclosure to a person who cannot reliably read is not a disclosure. A spoken one is. This direction is the only one in which that obligation is actually discharged rather than papered over.

### 1.6 The strongest counter-evidence, met head on

Joddrell & Astell 2016 found that in dementia specifically, **"integrated prompts (text boxes and animations) were more effective than voice prompts"** for supporting independent use, grade (b). Implication 37 hardens this into *never make audio the sole carrier of any instruction or state*.

Two responses, and I accept the constraint in full.

1. **That finding is about instructions for operating software.** It compares ways of teaching a procedure. This design has no procedure to teach, because it has deleted the interface: there is nothing to operate, no state to report, no navigation to explain. The one gesture that does exist — point at a photograph — is taught by **a looping demonstration animation** (§6.4), exactly as that finding prescribes, and never by voice alone.
2. **"Nothing must be read" is not "nothing is written."** The design constraint I hold is: *the session is completable, comprehensible and warm with zero reading and zero taps.* Text is present on every state, at 40–48 pt, as a **redundant caption channel for the 55% of adults 75+ with disabling hearing loss**. Neither channel is ever the sole carrier of anything. The voice leads; the screen never contradicts it and never requires it.

That is the honest position. The design leads with voice and is fully redundant. §11 states what it costs.

---

## 2. THE METAPHOR: THE VISITOR WITH THE ALBUM

> **The device pretends to be a person who has come round to sit with you and look at photographs.**

Not a radio, not an assistant, not a game. A visitor. An 85-year-old already knows how to use a visitor, completely, with no instruction, because:

- **A visitor speaks first.** You are never required to open a conversation with a device that has been sitting silently in the corner.
- **A visitor waits.** Silence is not an error condition to a visitor. It is part of the conversation.
- **A visitor fills their own silences.** If you don't answer, they answer themselves and carry on, warmly, without remarking on it. This is exactly the four-rung cue ladder, and it is exactly what a kind person does.
- **A visitor holds the photograph up.** You look at what they are holding. The screen is *the thing the visitor is holding*, not a control panel.
- **You point at a photograph.** Pointing at a picture of a person, while somebody asks who it is, is a pre-literate, pre-technological, universal human act. It is the only gesture in this product.

Corollary, and it is the whole design in one line: **the screen is a mantelpiece in a dim room, and the only objects on it are photographs.** Nothing on the patient surface is a button. There is exactly one non-photographic tappable object in the entire product, and the voice tells you about it, out loud, once per session, forever.

---

## 3. VISUAL LANGUAGE

### 3.1 The problem to avoid, stated

Two failure modes bracket this cohort. **Toy** — primary colours, rounded cartoon shapes, mascots, confetti — is banned outright by P30/ND-27 and is documented as stigmatising symbolism in gerontechnology. **Hospital** — clinical white, blue-grey system chrome, sans-serif density, progress bars — is worse, because the 16% catastrophic-reaction base rate in Tiberti 1998 was measured *in a clinical assessment setting*, and a screen that looks like a clinic recruits the frame we are spending the whole product avoiding.

The escape from both is **domestic**: a lit photograph in a dim room. Not an app looking at you; a room you are in.

### 3.2 Palette — one committed appearance, forever

There is no theme control (ADR §7), no light/dark toggle, no user preference. Not a shortcut: **P10 freezes the patient UI at enrolment**, so a theme control is a mid-study UI change with a switch on it.

| Token | Hex | Relative luminance | LRV | Role |
|---|---|---|---|---|
| `ground` | `#241F1B` | 0.0143 | **1.4** | The dim room. The full bleed behind everything. Never tappable, anywhere, in any state. |
| `mount` | `#F4EFE7` | 0.8676 | **86.8** | Warm paper. The card a photograph is mounted on. Every photograph and every glyph in the product lives on this surface. |
| `ink` | `#1A1613` | 0.0084 | 0.8 | All type. **15.7:1** on `mount` — well past the 7:1 AAA floor. |
| `stop` | `#B3A594` | 0.3863 | **38.6** | The one non-photographic tappable object. `ink` on it = **7.5:1** ✓. |
| `attend` | `#D98A2B` | 0.3312 | 33.1 | The microphone-open dot. Non-text; **5.9:1** on `ground`, past the 4.5:1 non-text floor. |

**The 30-point LRV rule (DSDC Stirling / BS 8300:2018) is the one most designs miss, and it applies to large adjacent surfaces, not glyphs.** Every adjacency here clears it with margin:

| Adjacency | Separation | Requirement |
|---|---|---|
| `mount` on `ground` | **85.4 pts** | ≥30 (40+ = "excellent") ✓ |
| `stop` on `ground` | **37.2 pts** | ≥30 ✓ |
| `stop` vs `mount` | **48.2 pts** | must not read as a photograph ✓ |

**Colour never carries meaning anywhere.** The stop panel is identified by position, size and the spoken sentence; its stone colour is redundant. Nothing is encoded blue-vs-green or in pastels — lens yellowing makes green, blue and violet hard to discriminate, and this palette contains none of the three. No orange or yellow content sits on a light ground; `attend` is amber on a near-black ground, which is where a yellowed lens transmits best, not worst.

**Why dark, given that low luminance hurts contrast sensitivity:** the surround is dark and the *content* is bright. Every photograph and every glyph sits on an LRV-86.8 surface. The dim ground kills glare and light scatter (which lens yellowing amplifies) without ever putting the content on a dark field. That is the mantelpiece: a lit picture in a low room.

### 3.3 Type

Plain humanist sans, Regular and Medium weights only — **never Light or Thin**, because thin strokes are high-spatial-frequency and that is the exact deficit. System face (SF Pro Display; every size here is ≥20 pt so Display is correct), tracking +0.5 pt, **left-aligned, never justified**, line-height 1.5, line length far under 80 characters by construction.

| Element | Size | Note |
|---|---|---|
| Name on the nameplate | **48 pt** | The ADR's ceiling. Cap height ≈ 6.2 mm ≈ 47 arcmin at 45 cm — ~9× the 20/20 letter threshold, ~2.4× what 20/80 needs. |
| One true sentence, sayings, song title, stop panel | **40 pt** | |
| Roster first names | **36 pt** | |

Nothing on the patient surface is smaller than 36 pt. Card text is **always real text, never baked into an image** (WCAG 1.4.9).

**Left alignment is load-bearing, not stylistic.** The rung-1 partial mask fills a name in place; a centred name reflows as it fills, and reflow is motion on the one object a person is staring at. A fixed left origin means the first characters occupy the same pixels partial and complete.

### 3.4 Photographs

`expo-image`, `contentFit="cover"`, `recyclingKey` per card, from the local `file://` URI, preloaded one card ahead. Never letterboxed — a black bar is a surface with no LRV story. The mount's paper border *is* the frame.

---

## 4. THE FRAME — ONE SCREEN, FOREVER

The frozen shape says `session.tsx` is the whole product on one screen. It is. There is one layout; the states change what is *on* the mantelpiece, never where the mantelpiece is.

### 4.1 One-photo state — the default (rungs 0, 1, 3; M-02; M-40; M-35; M-56; rest)

```
 ground 1080 × 810
 ┌─────────────────────────────────────────────────────┐
 │                                                     │
 │        ┌───────── mount 700 × 750 ─────────┐        │   mount origin x=190, y=30
 │        │                                   │        │
 │        │   photo window 620 × 590          │        │   inset 40 from L/R/T
 │        │   (113 × 108 mm)                  │        │
 │        │                                   │        │
 │        │───────────────────────────────────│        │
 │        │  nameplate 620 × 100 (48 pt ink)  │        │   hairline 2pt ink@15%
 │        └───────────────────────────────────┘        │
 │                                                     │
 │  ┌── stop 300 × 140 ──┐                        ●    │   stop x=40 y=630
 │  │  Stop for now      │                             │   attend dot Ø24, x=1016 y=770
 │  └────────────────────┘                             │
 └─────────────────────────────────────────────────────┘
```

- **Mount tap area: 700 × 750 pt = 128 × 137 mm.** The ADR's 88 pt (16.1 mm) floor is a floor this design never approaches; the smallest tappable object in the product is 300 pt (55 mm).
- **Nameplate is always present, even when empty.** A blank plate is a plate. If the plate appeared only when there was a name on it, the plate's arrival would be an event, and events on a card mean something. Nothing may ever arrive or leave except ink.
- **Dead space from stop panel to mount: 150 pt = 27 mm.** Requirement is ≥8 mm; implication 4 forbids a navigational control adjacent to an answer control. 27 mm of bare ground, on all sides, always.

### 4.2 Two-photo state (cue rung 2, and probe rung 2 only)

```
 ┌─────────────────────────────────────────────────────┐
 │                                                     │
 │  ┌── mount 460×540 ──┐  ✋  ┌── mount 460×540 ──┐   │   x=50 and x=570, y=135
 │  │ photo 380×420     │      │ photo 380×420     │   │   gutter 60 pt = 11 mm
 │  │                   │      │                   │   │   hand 180×180 in gutter
 │  │───────────────────│      │───────────────────│   │
 │  │ nameplate 380×80  │      │ nameplate 380×80  │   │
 │  └───────────────────┘      └───────────────────┘   │
 │                                                     │
 │  ┌── stop ────────────┐                        ●    │
 └─────────────────────────────────────────────────────┘
```

- Each mount **460 × 540 pt = 84 × 99 mm**. Gutter **60 pt = 11 mm** of dead ground, past the 8 mm requirement.
- **On the central-50% rule, honestly.** Implication 3 says keep controls in the central 50% because required touch-active area rises from ~1.1 cm centrally to ~2.3 cm in the outer 25%. These mounts sit outside the central 50% and I am not pretending otherwise. But the rule exists to guarantee a *required area*, and 84 mm is **36× the 2.3 cm the outer zone demands.** The substance of the finding is satisfied by three orders of magnitude; the heuristic derived from it is not. I use the underlying number, not the heuristic, and I say which.
- **These are the only two positions in the product where a tap on a photograph decides anything.** Because rungs 0, 1 and 3 have nothing to tap at all, there is no motor procedure elsewhere for this state to invalidate. The procedure is: *two pictures side by side → point at one*, and it never varies, in any session, forever.

### 4.3 The one transition in the entire product

One-photo ↔ two-photo is a **300 ms cross-fade with zero translation, zero scale, zero parallax**. Nothing slides, nothing moves under the finger, no viewport motion, no optic flow.

**Named conflict, resolved:** HCI implication 41 says screens replace instantly or cross-fade over **≤150 ms**; ADR §7 says **no transition under 300 ms**. The 150 ms figure was written to stop slide/push navigation and vestibular harm — motion, not duration. A positionless cross-fade produces no optic flow at any duration, so the ADR's floor governs and both intents hold. **300 ms cross-fade, never a translation.** Flagged for the architect's ruling.

---

## 5. HOW A SESSION STARTS

### 5.1 Personal device — nobody presses anything

The tablet is on a stand and has been showing yesterday's rest photograph at 40% brightness since yesterday. Mid-morning, the P8 chime fires; the session is already loaded. The screen returns to 100% over 300 ms, and:

> *"Good morning. It's me. Shall we look at some photographs?"*

Then it waits 6.0 s, and then it simply begins. **No tap is required to start.** There is no start button, no "begin", no tap-to-continue. A person who never touches the tablet has already started.

Immediately after the greeting, before the first saying, every session, in identical wording, forever:

> *"If you'd like to stop, put your hand on the wide flat panel down at the bottom on your left."*
> *"I'll be listening, so I can hear you."*

The first sentence is the P18 patient-side stop control, disclosed by position, never by colour. The second is the P23 / §8.4 disclosure of the speech-feature layer, in plain words, in the patient UI, to a person who may not read — the obligation actually discharged.

**The honest limit, from the ADR:** no Expo app can wake a sleeping iPad. This flow requires the device kept awake and the app foregrounded — a Guided Access / kiosk / charging-stand deployment decision, not a mechanic. If the tablet is asleep, the chime is an OS notification somebody must tap, and that tap is the one gesture in the whole product we do not control. It is also §12.1's named F2 failure mode — apathy and initiation — arriving at the very first frame. Named, not hidden.

### 5.2 Shared care-home tablet — the roster

The only screen in the product that is not the session.

Grid of **up to six** mounts, 320 × 380 pt (58 × 69 mm), 3 × 2, gutters 60 pt (11 mm), each holding a resident's photograph with their first name at 36 pt on the plate. Ground behind, as always.

> *"Hello. Which one of you is it?"*

The demonstration hand (§6.4) appears once in the centre of the grid, pointing at a mount and withdrawing, looping every 4 s. Then silence, indefinitely. **The roster is the one place the app never self-advances**, because self-advancing would start somebody else's session.

**Six, hard.** No scrolling on the patient surface (ND-32); paging is navigation chrome (ND-32, P9). A care home with more than six residents on a tablet gets another tablet — which is already the ADR's answer for hard boundaries between residents.

---

## 6. HOW HELP ARRIVES: THE FOUR RUNGS, RENDERED

This is the mechanism by which the product never shows a failure, so it is specified to the millisecond.

**Help is reached by silence, not by asking for it.** There is no hint button, no "show me", no "tell me". Asking for help is an admission, and P4 forbids the patient supplying any signal about their own recall. The companion simply notices that a silence has gone on and helps, the way a kind person does, without remarking on it.

**Nothing on screen changes between rungs except how much ink is on the nameplate and how many photographs are on the mantelpiece.** No rung indicator, no dots, no "hint 2 of 4". Descending is invisible from the person's side.

### 6.1 The clock

| t | Rung | Voice | Screen |
|---|---|---|---|
| 0.0 s | — | *"And who is this?"* | One mount. Photograph. **Nameplate empty.** |
| 0.0–6.0 s | **0 — free recall** | silence | **Absolutely nothing changes.** No spinner, no pulse, no timer, no countdown. |
| 6.0 s | **1 — partial cue** | *"Her name starts with Marg…"* (trails off) | The name appears on the plate: first *k* characters at full ink, the remainder as **ghosts at 6% opacity**. Nothing else changes. |
| 6.0–9.0 s | 1 | silence | The ghosts **ramp linearly to 100% over 3000 ms**. No sound, no movement, no announcement. By 9.0 s the name is simply there. |
| 9.0 s | **2 — two-choice** | *"Margaret is one of these two. Point to Margaret."* | 300 ms cross-fade to the two-photo state. The **demonstration hand** begins looping in the gutter. |
| 9.0–15.0 s | 2 | silence | Hand loops. Nothing else. |
| 15.0 s | **3 — familiarity exposure** | *"This is Margaret. She's your sister. She still sends you a card on your birthday."* | 300 ms cross-fade back to one mount, the target photograph, **nameplate full from the frame it appears in**. |
| 15.0–23.0 s | 3 | silence | Held 8.0 s. Then the undifferentiated knock, and the next card. |

**A person who touches nothing descends the entire ladder in 23 seconds and arrives at a warm, true sentence about her sister.** Failure is structurally unrenderable, because the bottom of the ladder is a statement and not a question.

### 6.2 Why the mask is ghost letters and not underscores

`name.slice(0,k)` with the remainder as `Marg____` renders a fill-in-the-blank form. That is the visual grammar of a test paper, and Rememo's therapists rejected exactly this shape as clinical-assessment-like. **Faded ink on an old photograph** is the grammar we want instead. Same substring function, same zero content cost, opposite frame. And it matters less than it sounds, because the voice has already delivered the cue — the letters do not need to be read at all.

### 6.3 Rung 3 is visually identical to rung 0

Same mount, same position, same photograph, same plate. The only difference is that the plate is full from the first frame instead of empty. **From the screen alone there is no way to tell that a ladder was descended.** That is the point.

### 6.4 The demonstration hand — the most important object in the design

It is the only thing in the entire product that ever says *this screen can be touched*, and it says it by showing rather than telling, to a person who has never held a device that responded to being touched.

- A **photograph** of an adult hand — lined, real, an adult's hand, never a cartoon, never a cursor, never an icon.
- **180 × 180 pt**, in the gutter between the two mounts. **3.7% of the viewport** — implication 43's cap is 20%.
- **Stationary in position.** The hand does not travel across the screen. The index finger extends and retracts over **1200 ms**, looping every 4 s. This is the "small, local, looping instructional animation on a stationary layout" that §5.4 explicitly permits, and it is the only motion in the product other than opacity.
- It never appears in the one-photo state, because in the one-photo state there is nothing that requires a tap.

### 6.5 What happens on a tap at rung 2

**Both mounts render identically regardless of which was tapped.** The correct mount's nameplate fills with the name at full ink; the voice says *"That's Margaret."* The other mount is not dimmed, not marked, not receded, not crossed. Nothing at all happens to it.

This is the visual analogue of M-137's undifferentiated chime, and for the same reason: two discriminable outcome renderings are a per-trial correctness signal the person learns to read, which is ND-5 by the back door. **The defensible clause is that nothing is ever marked by absence.** So both plates are handled the same: the target's fills because it is being answered, and the foil's was empty and stays empty, in every case, whichever was touched.

Tap feedback: the touched mount's border thickens from 0 to 6 pt **within 100 ms**, holds 300 ms, releases. No sound (the knock belongs to card boundaries). Immediate contextual feedback for every touch is a documented success factor; it is affirmational and it is identical for both mounts.

### 6.6 Input rules, with the numbers behind them

- **Touch-down inside the mount commits.** Touch-up is not required to land inside. Essential tremor affects ~4.6% of adults 65+ and is a *kinetic* tremor — it degrades exactly the accurate terminal movement that a touch-up requirement tests.
- **Multi-touch suppressed**: first pointer only, all others discarded; 400 ms post-tap lockout (in the 300–500 ms band), which costs nothing because no double-tap exists anywhere.
- **No dwell-to-select, anywhere.** Participants forgot to wait for selection timers; it is a documented failure mode.
- **No countdown timer, ever** (WCAG 2.2.3 AAA). Nothing on screen ever indicates that time is passing. The rung clock is not a deadline: a response arriving at rung 1 is accepted at rung 1, and rung 3 asks nothing at all, so there is no moment at which time running out costs the person anything.

### 6.7 M-25's ladder is three rungs, not four — a consequence worth flagging

The month-target is a sentence, not a face. Rung 2 requires a photographic foil; a sentence has no foil, and authoring one costs family content, which is the exact thing §2.3's derived ladder exists to avoid (there is only ever one target, so no second sentence exists to borrow).

**Therefore the M-25 ladder runs 0 → 1 → 3.** The plate goes empty → partial → full, and the two-photo state never appears for a target trial. Consequence for the analysis plane: `attained_rung` on target items is a **3-point scale**, not 4, and must be recorded as such or the M4 analysis silently mixes two scales. Flagged for the protocol.

---

## 7. THE SIX FROZEN MECHANICS, RENDERED

### M-35 — Complete the Saying (opener ×2, ~45 s; closer ×1, ~20 s)

One-photo state. The mount holds a **still-life photograph from the shipped generic library**, era and locale matched: a kettle, a garden gate, a pair of boots, a wireless set. **No people** — a still life cannot be a recognition demand.

Nameplate carries the saying at 40 pt, using the one and only ink mechanism the product owns: the first half in full ink as the voice says it, the second half at 6% ghosts, ramping to 100% over 3000 ms when the app speaks it.

> *"A stitch in time…"* — 6.0 s of silence — *"…saves nine."*

Either way. Nothing on screen changes at any other point. **There is nothing to tap during a saying**, and that is the point: the first 45 seconds of every session establish that this device talks, and expects nothing.

**Microphone, and a contradiction inside the frozen document.** §4 step 2 makes M-35 the P25 floor sentinel — *"failure to complete an overlearned proverb is a strong acute-change signal"* — while §5 describes M-35 as *"near-ceiling completion with no mic."* Both cannot hold; with no microphone there is no completion signal and S7 loses its sentinel. **My resolution:** the microphone is open during a saying, the waveform is never written to disk, ASR never runs (P27), and only `utterance_duration_ms` and `voiced_ratio` — already in §7 of the telemetry spec, features-only, content plane firewalled — are extracted on device. The `attend` dot is lit, and the spoken disclosure in §5.1 has already covered it. **This needs an explicit ruling and I am not assuming one.**

### M-56 — Your Song (30 s)

One-photo state. The mount holds a **generic era photograph** matched to the decade of her late teens — a dance hall, a promenade, a street — no identifiable people. Nameplate: song title and artist at 40 pt, full ink from the first frame. Zero demand.

**No album art** (a corporate object, and a licensing hazard). **No visualiser** (motion). **No progress bar** (a progress bar is a timer). Nothing on screen moves for thirty seconds. That is the hardest thing in this document to hold and it is correct: a still photograph and a song from 1957 is what the mechanic *is*.

**Volume has no on-screen control.** A slider is a drag; P9 forbids it and it is why M-138 died. Volume is a caregiver setting. The device's **physical volume buttons stay live** — a hardware affordance, not a UI gesture, and the one control a person of 85 already knows, because it is the knob on a wireless set.

### M-02 — The Narrated Album (~60 s, and the fallback for everything)

One-photo state. Photograph, nameplate full from the frame, voice: name, relationship, one true sentence, from the M-27 record, read by TTS from family-typed text (P19: no generated content).

**Tapping the mount advances to the next photograph. Tapping is never required** — after 8.0 s the app advances itself. Patient-paced for a person who paces, self-driving for a person who does not, and the same code path either way.

Small departure, declared: the frozen table says *"whole screen tappable."* Here the tap region is the mount — 700 × 750 pt, 128 × 137 mm — and the ground is never tappable in any state, anywhere. **One rule ("you touch a photograph") beats two**, and a tappable ground would make the two-photo state ambiguous.

### M-20 — The Answer First, personal (~3 min)

The graded core. Per card:

1. **Answer first.** One-photo state, nameplate full, voice: *"This is Margaret. Your sister."* Hold 2.5 s.
2. **Withdrawal.** The nameplate ink ramps **down to 0% over 3000 ms**, silently. No sound, no movement, no announcement. The plate stays; only the ink leaves. **This is the only moment in the entire product where ink ever leaves a plate**, and it is the visual event that means *now it's your turn.*
3. **The ladder** (§6.1) runs.

The M-25 opening trial is the identical shell with a sentence on the plate instead of a name, and the three-rung ladder of §6.7.

**A miss adds cue support and re-presents one rung easier — never a shorter interval** (P2). From the person's side there is no such thing as a miss; there is a companion who says a bit more.

### The generic probe — M-20 errorless arm / M-21 recall-first arm (≤8 items, ≤2 min)

Same shell. Same two mount positions. Same hand. `item_is_probe = true`; scheduler-blind; the only place in the product where a real uncued failure is recorded, then rescued until she succeeds.

**Framed by the voice, because there is no copy:**

> *"Here's a little game. These are people I've made up. This one is called Peter."*

*People I've made up* is doing real work. It is true, it protects dignity absolutely — failing to recognise a stranger is not a failure — and it means the person is never told she is being measured while also never being told anything false. Never the words "test", "quiz", "score", "try", "correct" — nor any system vocabulary (implication 27).

Stock faces sit in the same mounts on the same ground, indistinguishable in every way except that a shipped set shares crop, lighting and era treatment in a way family snapshots never do. **No family content ever appears here.**

Distress on the probe disables it for the remainder of the study and it is logged as an adverse event, not missing data. **The person is never told anything happened**: subsequent sessions simply do not contain a probe block, with no announcement of any kind.

### M-40 — Tell Me About This One (~2 min)

One-photo state. Mount holds the photograph — personal or generic era, randomised per session (M2). **The nameplate is empty for the whole of M-40, permanently**, because the plate is where answers live and there is no correct answer here.

> *"I love this one. What was going on here?"*

The `attend` dot lights. Then the app is quiet and listens for as long as she wants.

**Nothing on screen changes while she talks.** No waveform, no level meter, no recording chrome, no elapsed time. A level meter is a performance mirror and an elapsed timer is a deadline; both convert open narration into a measured act.

After 15 s of silence, one shipped generic cue, without comment — *"Was that at the seaside?"* — then quiet again.

**It ends warmly regardless, in identical words, whether she spoke for two minutes or said nothing at all:** *"I do love hearing about that."* A closing line that varies with what was produced is a grade.

Mic records; **ASR never grades** (P27, ND-26). Transcripts never reach the research plane (§8.4).

---

## 8. FADE TO REST — M-134

After the closing saying, the mount holds the nominated photograph. The voice says nothing more, ever. The `attend` dot goes dark.

Over **8 minutes**, ground and mount dim on a linear ramp to **40% luminance** — 0.125%/s, below the perceptual threshold for a change, so nothing is ever seen to happen. It stops at 40% and never reaches black. The screen is held awake indefinitely: **a black tablet is a broken tablet to this cohort**, and a dark rectangle where a photograph was is a loss.

Nothing is ever asked again. The device is safe to put down and walk away from — P28 implemented rather than asserted, and S3 (≥99% ended on success) made achievable rather than aspirational. Trial state at fade is captured so *"did not know"* and *"stopped attending"* stay distinguishable in the data.

---

## 9. THE FOUR TAPS

The entire patient surface, exhaustively:

1. **Tap a mount at cue rung 2 or probe rung 2** → choose. Two positions, forever.
2. **Tap the mount during M-02** → advance early. Never required.
3. **Tap the stop panel** → *"Alright. Let's stop there."* Then the generic closer plays (so P1 still holds) and the screen fades to rest. `distress_signal_source = patient_control`. **No confirmation modal** — modals are unrecognised context switches, and stopping is harmless, so it needs no confirming.
4. **Tap your own face on the shared roster** → begin.

Everything else is voice and silence. There is no back, no home, no menu, no settings, no next, no pause, no replay button — nothing that would need a label, an icon, or a concept.

**On implication 46 ("give exactly one back/home affordance, with a text label"):** there is nowhere to go back to. The session is a single frozen frame with no navigation, so a back control would be a control with no referent — the frozen document reaches the same conclusion in killing M-103, that *"a fixed-shape ≤10-minute session has no navigation to do — the session is the navigation."* The stop panel is the one exit and it is fixed, isolated by 27 mm of dead ground, labelled in words, and announced out loud every session.

---

## 10. NON-INTERACTION — THE CASE THE PRODUCT IS ACTUALLY DESIGNED FOR

### 10.1 They tap nothing at all, for the entire session

**This is the design's headline property.** The full session — greeting, two sayings, song, target trial, six to ten Camp cards each descending the full ladder, probe, narration, closing saying, rest — runs to completion on silence in eight to ten minutes, ends on a near-ceiling generic saying, and settles on a photograph.

Logged as `session_end_reason = completed`, `ended_on_success = true`, `n_taps = 0`. **Zero taps is a complete, valid, successful session, not a degraded one.** Every other design in this space treats the untapped session as a failure to engage; this one treats it as the modal case and builds for it first.

### 10.2 They walk away

The app cannot know, and must not guess. No camera (P20), no inferred-presence heuristic, no affect classifier (P18, ND-15, EU AI Act Art. 5(1)(f)).

So it **behaves identically whether the room is empty or full** — which is exactly why silence can never be punished. The session runs on, plays the closer, fades to rest. A caregiver returning two hours later finds the tablet showing a photograph of Margaret at 40% brightness, and nothing has gone wrong.

**Forbidden, explicitly: "Are you still there?"** It manufactures a demand, it is a check-up, and it converts a person's absence into something the device has noticed. If the room is empty it is talking to nobody; if the room is not empty it has just told a person she was being watched.

Distinguishing *"did not know"* from *"stopped attending"* is not possible at runtime without inference, so it is not attempted at runtime. Trial state at fade, `n_taps`, and speech features go to the analysis plane, and the distinction is made there, offline, by a human.

### 10.3 They talk to it and it cannot understand

Nothing happens, and nothing is allowed to happen. ASR never grades (P27) — error rates would be systematically worse for the more impaired participants, manufacturing a false decline signal, plus the dignity failure of telling somebody she was wrong when the microphone was. Grading is by tap or not at all. **A spoken answer at rung 0 does not stop the ladder**, so a person who answered correctly out loud will still be told her sister's name a few seconds later — warmly, and as if it were the most natural thing.

That is a real cost of the design and I am declaring it: **a correct spoken answer is rewarded with a gentle repetition rather than recognition.** The alternative is ASR adjudicating a person's memory, which is forbidden, and rightly.

---

## 11. HONEST WEAKNESSES

### 11.1 The lead channel is the one this cohort is most likely to have lost — and the redundancy that fixes it re-imports the problem

**55% of adults 75+ have disabling hearing loss and fewer than 1 in 3 of those who would benefit have ever used a hearing aid.** Presbycusis takes **above 2 kHz** first, worsening monotonically, and the consonant cues that distinguish words — "s", "f", "th" — sit at **2–4 kHz**. Speech becomes audible but unintelligible, and the dominant complaint is speech in noise, which threshold elevation alone does not explain because central auditory processing declines too.

That is precisely where this design lives. "Margaret" and "Marjorie". "And who is this?" and "Who is this?". The design depends on those being distinct at exactly the frequency band that is gone.

My mitigations — level normalisation, energy kept in the 500 Hz–2 kHz band, utterances ≤10 s, speech rate reduced to ~3.2 syllables/s against a ~4 syll/s norm, 800 ms of silence around every utterance, and 40–48 pt captions on the nameplate — are real, but two of them do nothing for central auditory processing decline, and the last one **works by putting text back on the screen**. For the presbycusis-and-cataract intersection, this design's two channels fail together and there is no third. A visual-first design at least degrades to a photograph you can point at.

**I do not have an answer to this. It is the strongest argument against the direction and it should be tested first, in the PPI panel (B6), before the mechanic freeze — not in the pilot.**

### 11.2 Every timing number in §6.1 is invented

6.0 s to rung 1. 3000 ms ink ramp. 6.0 s to rung 2. 8.0 s hold at rung 3. 15 s before M-40's cue. 8.0 s M-02 auto-advance. 8-minute rest ramp.

**None of these has a source.** No dose-response or waiting-tolerance curve exists for this population anywhere in the corpus. If 6.0 s is too short the app talks over her while she is still working, which is exactly §4.3's named failure — *the conversation moves on before processing completes.* If it is too long the silence becomes uncomfortable and the apathy/initiation failure mode wins. The rung dwell is settable per participant at enrolment, changed only by a deliberate caregiver-initiated step (P10, implication 53), and logged. **The pilot's first job on this surface should be to measure it.**

### 11.3 It is nearly useless on mute, silently, in front of a person who cannot report it

A Bluetooth speaker that has drifted, a day-room volume knob turned down by a cleaner, a routing change after a call — and the entire interface is gone, with no visible symptom, and the session still logs as `completed` with `ended_on_success = true`. This is precisely the shape of failure the ADR names in its audio codec section: *silent on the patient's iPad, with no way for a patient with dementia to report it.*

**Requirement this direction generates:** an audio-output health check before every session — route present, output volume above a floor, a sub-audible test tone confirmed at the device. If it fails, **the session refuses to start** and shows the caregiver reconnect screen rather than running a mute session that pollutes the adherence data with a false success.

### 11.4 One committed appearance means no relief for the outliers

No theme control, no text-size control on the patient surface. A person with severe glare sensitivity, or one in a bright conservatory with reflections, gets what everybody gets. I accept this because P10 makes a user-facing appearance switch a mid-study UI change, and because the dark-ground / bright-mount split is the right default for lens yellowing. But it *is* a real loss and it lands on the people furthest from the mean.

### 11.5 The ladder is uncalibrated against the thing it is trying to prevent

The 16% catastrophic-reaction base rate comes from a **full ~45-minute neuropsychological battery administered by a stranger**, single centre, Buenos Aires, 1998, unreplicated at that rate — and the bridging premise that a daily home session is structurally a neuropsychological evaluation is an assumption, not a finding. The whole silence ladder exists to defuse a number whose applicability to this format is genuinely unknown. It may be over-engineering. It may be nowhere near enough. **The distress register (M5) is the only way to find out and it is why S1 and S2 are Tier 1.**

---

## 12. WHAT THIS DIRECTION LEAVES FOR THE ARCHITECT TO RULE ON

| # | Question | My position |
|---|---|---|
| 1 | **Microphone during M-35.** The frozen doc says both "no mic" and "P25 floor sentinel". | Mic open, features only, no ASR, no waveform persisted, spoken disclosure. §7. Needs a ruling. |
| 2 | **300 ms vs ≤150 ms cross-fade.** ADR §7 vs HCI implication 41. | 300 ms, no translation. Both intents hold. §4.3. |
| 3 | **`attained_rung` is a 3-point scale for M-25 target items.** | Must be recorded distinctly or M4 mixes two scales. §6.7. |
| 4 | **Mount-tappable, not screen-tappable, for M-02.** | One rule beats two; the ground is never tappable anywhere. §7. |
| 5 | **Six residents per shared tablet, hard.** | No scrolling, no paging. More residents = more tablets. §5.2. |
| 6 | **Audio-output health check gates session start.** | New requirement generated by this direction. §11.3. |
| 7 | **Session length 8–10 min vs implication 54's 3–5 min target.** | Frozen doc wins; fade-to-rest means nobody is ever *held* for ten minutes. Noted, not resolved. |
