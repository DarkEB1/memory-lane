# Emotional & Narrative Mechanics

**Lens: The reminiscence therapist**

Generated for the divergent phase. Nothing here is filtered for feasibility, cost, or clinical
evidence. The organising principle is that the patient is the *expert in the room* — the holder of a
life the app does not know. The app's job is to ask, listen, and reflect back. Success is not a score.
Success is ten minutes of feeling like yourself.

Design commitments running through all of these:

- **No wrong answers exist.** Where a mechanic could produce a "wrong" response, the mechanic is
  redesigned so that any response is a valid one.
- **The patient talks more than the app.** Speaking is the primary output, not tapping.
- **Grief is content, not a bug.** Deceased people are the most emotionally salient people in a life.
  Excluding them sanitises the life. Every mechanic that can touch loss has a stated safety posture.
- **Being witnessed is the reward.** The reinforcement loop is a real family member hearing what was
  said, not a streak counter.

---

## 1. Tell Me About This One

**One line:** A single large photo from the patient's own life fills the screen and a warm recorded
voice asks "tell me about this one" — then the app goes quiet and listens for as long as they want to talk.

- **Input needed:** 1+ photos from the patient's life, each with a family-written one-line caption
  used only as a fallback prompt ("This is you and Margaret at Whitby, 1962"). Optional: a 5-second
  clip of a family member recording the prompt in their own voice.
- **Interaction:** Just watch, then speak aloud. No tapping required to answer. One large green
  "I'm finished" button, which is optional — silence for 20 seconds also advances gently.
- **Why it might work:** Free autobiographical retrieval with maximal cueing and zero retrieval
  demand. The photo does the remembering; the patient does the narrating. Open prompts have no
  correct answer, so there is no failure state to detect. Social presence from a familiar recorded
  voice raises engagement over a synthetic one.
- **Failure mode:** Patient doesn't recognise their own photo and feels the ground drop away.
  Mitigation: the caption is spoken aloud after a pause, converting recall into recognition, then
  into simple co-presence ("that's a lovely spot, isn't it"). Also: patient talks for eleven minutes
  and the family never listens to it — the mechanic dies of being unheard.
- **Difficulty:** low
- **Variant of:** novel

---

## 2. The Storyteller's Chair

**One line:** The screen shows only a soft empty armchair and the words "Ready when you are" — the
patient tells any story they like, unprompted, and the app records it as a keepsake.

- **Input needed:** Nothing — derived from existing content, or from nothing at all. Optionally a
  family-supplied list of topics used only if the patient stalls for 30+ seconds.
- **Interaction:** Speak aloud. One tap on a large picture of the chair to begin.
- **Why it might work:** Removes even the photo scaffold, positioning the patient as author rather
  than respondent. For patients with strong preserved narrative — especially well-rehearsed
  set-piece stories told for decades — this exercises deeply consolidated remote memory that is
  spared long into the disease. The blank canvas signals trust.
- **Failure mode:** The blank prompt is the exact thing a frightened patient cannot fill. Empty screen
  becomes a mirror of the emptiness they fear. Must degrade to mechanic 1 quickly and without comment.
- **Difficulty:** low
- **Variant of:** Tell Me About This One

---

## 3. Teach the Grandchild

**One line:** A grandchild's recorded voice asks the patient a real question — "Grandad, how do you
know when bread is proved?" — and the patient answers, teaching them.

- **Input needed:** 1+ recorded questions (10-30 seconds) from a named younger family member, phrased
  as genuine requests for expertise, ideally about a skill or trade the patient actually owned.
  Optional: a photo of the grandchild.
- **Interaction:** Watch/listen, then speak aloud.
- **Why it might work:** Inverts the tested/testing power dynamic completely. Semantic and procedural
  knowledge about a lifelong craft is among the most robustly preserved material, and it is retrieved
  as *identity* ("I was a baker") rather than as recall. Generativity — the drive to pass something on
  — is a strong late-life motivator. And it is a real request from a real loved person, not an exercise.
- **Failure mode:** The patient cannot answer a question about their own trade and experiences it as
  the loss of the thing they were proudest of — a far deeper wound than failing a photo quiz.
  Requires questions pitched deliberately easy, and a graceful "that's alright, tell me anything
  about the bakery" fallback. Also risks patronising if the question is transparently fake.
- **Difficulty:** medium
- **Variant of:** novel

---

## 4. Your Song

**One line:** Thirty seconds of a song from the patient's late teens and early twenties plays, and
they can sing, tap, dance, cry, or say nothing at all.

- **Input needed:** Year of birth plus 3+ songs the family knows they loved; or nothing — derived
  from birth year against a period music library (peak reminiscence bump, ages 15-25).
- **Interaction:** No input at all required. Optional large heart button ("play it again").
- **Why it might work:** Musical memory is subserved by structures relatively spared in Alzheimer's;
  music from the reminiscence bump carries dense autobiographical and emotional associations and
  frequently unlocks speech and affect in patients who are otherwise non-verbal. Requires no
  retrieval effort whatsoever — pure receptive engagement, always succeeds.
- **Failure mode:** A song attached to a specific grief (their wedding waltz, a funeral hymn) lands
  without warning and floods them. Music is also the most likely mechanic to produce crying — which
  is often therapeutic but must never leave the patient alone with it.
- **Difficulty:** low
- **Variant of:** novel

---

## 5. Finish the Line

**One line:** A song they've known for sixty years plays and stops one word short — "you are my
sunshine, my only ..." — and they say or sing the ending.

- **Input needed:** 3+ songs, hymns, or sayings from the patient's era; or nothing — derived from
  birth year and region.
- **Interaction:** Speak or sing aloud. No detection of correctness — the app simply completes the
  line with them, in the recording, a half-beat later.
- **Why it might work:** Priming and procedural/implicit memory. Overlearned lyric completion runs on
  automatic sequence retrieval and typically survives when explicit recall is gone. Errorless by
  construction: the app sings the answer regardless, so the patient's voice always lands in unison
  rather than in judgement.
- **Difficulty:** low
- **Failure mode:** If the app pauses too long waiting for an answer it becomes a test. The pause must
  be short and the completion unconditional. Sing-along mechanics can also read as childish if the
  material is nursery-grade rather than adult repertoire.
- **Variant of:** Your Song

---

## 6. This Day, That Year

**One line:** On an ordinary Tuesday the app says "seventy-one years ago today, you were married" and
shows the wedding photograph, and nothing is asked of them at all.

- **Input needed:** 3-10 dated life events with a photo each (marriage, births, emigration, demob,
  first house). Dates required to day-or-month precision.
- **Interaction:** No input at all. Watch. Optional "tell me about it" continuation into mechanic 1.
- **Why it might work:** Anniversary cueing gives strong temporal-contextual retrieval support, and
  the "today" framing orients the patient in time without quizzing them about the date. Emotional
  salience is maximal. It also gives the patient something true and specific to tell a care worker
  later that day — a conversational asset.
- **Failure mode:** Anniversary of a death, a stillbirth, a divorce. Also: the anniversary of a
  marriage to a spouse who has died, surfacing on a bad day, can produce fresh grief as though the
  loss were new. Family must be able to mark a date as "not for the app", and any date can be
  flagged "only when someone is with them".
- **Difficulty:** medium
- **Variant of:** novel

---

## 7. The Ones Who Are Gone

**One line:** The patient chooses to visit a deceased loved one, and the app shows them warmly in the
past tense — "Margaret, your wife, who you married in 1954" — and invites a memory, never a status update.

- **Input needed:** Photos of the deceased person plus explicit family-supplied framing text and a
  chosen disclosure posture: (a) always spoken of in past tense, (b) never state the death, redirect
  to memory, (c) exclude entirely.
- **Interaction:** Tap one large portrait to enter. Speak aloud. Large "that's enough for now" exit
  always visible.
- **Why it might work:** Deceased spouses and siblings are the most emotionally central figures in most
  lives; excluding them produces an app about a stranger's life. Handled well, reminiscence about
  the dead is consolidating rather than distressing, and grief that is witnessed is easier than grief
  that is suppressed. Critically, this mechanic never asks "where is Margaret?" — the question that
  forces repeated rediscovery of bereavement.
- **Failure mode:** The catastrophic one. If the app ever implies the person is alive, or if the
  patient asks "is she dead?" and the app answers, the patient can re-experience the bereavement at
  full force. Requires the family's explicit posture, and a hard rule that the app never delivers news.
- **Difficulty:** high
- **Variant of:** Tell Me About This One

---

## 8. The Face Across the Years

**One line:** Three photographs of the same person at 20, 45 and 70 fade one into the next while a
voice says their name and who they are, and the patient watches a life happen.

- **Input needed:** 3+ photos of the same person spanning decades, plus name and relationship, plus
  a spoken name clip.
- **Interaction:** Just watch. Optional single tap to hold on a photo they like.
- **Why it might work:** Errorless learning of face-name associations by repeated pairing without any
  test trial — the association is presented, never probed, avoiding the error-strengthening problem in
  amnesia. Morphing across decades bridges the recognition gap for patients whose memory of a person
  is anchored to a much younger face than the one who visits them.
- **Failure mode:** The visual ageing of a spouse or sibling can read as a small memento mori. Also,
  patients who have lost the person's identity entirely may find the sequence beautiful but
  meaningless, which is fine — unless a family member is watching and grieves visibly beside them.
- **Difficulty:** medium
- **Variant of:** novel

---

## 9. Two Good Things

**One line:** Two large photographs appear side by side — the seaside and the garden — and the patient
simply taps the one they'd rather talk about today.

- **Input needed:** 6+ photos across distinct themes (places, people, work, holidays), no captions
  strictly required.
- **Interaction:** Tap one of two large pictures. Then speak, or not.
- **Why it might work:** Preference has no correct answer, so choosing is always a success. Two-option
  forced choice is within reach for advanced impairment where open questions are not, and it gives the
  patient *agency over the session* — they steer, the app follows. Choice-making is itself a preserved
  and dignity-relevant capacity.
- **Failure mode:** If the app ever reacts as though one choice were better, the mechanic collapses
  into a test. Two photos that both carry loss give a choice between two griefs. Patients with
  apathy may tap neither and stall.
- **Difficulty:** low
- **Variant of:** novel

---

## 10. The Smell of It

**One line:** A photo of a thing with a strong smell — carbolic soap, a coal fire, Sunday roast, hay,
Brylcreem — appears with the words "can you almost smell it?", and the patient is invited to describe it.

- **Input needed:** Nothing — derived from birth year, region and occupation against a curated
  period-smell image library. Optional: family-supplied specifics ("his father's pipe tobacco").
  Ambitious variant requires a physical scent cartridge accessory beside the tablet.
- **Interaction:** Watch, then speak aloud. In the accessory variant: lift a small pot and sniff.
- **Why it might work:** Olfactory cueing has unusually direct anatomical access to limbic and
  hippocampal structures and reliably evokes older, more emotional, more vivid autobiographical
  memories than verbal or visual cues (the Proust effect). Even *imagined* smell via imagery cues
  reaches memories that photographs of people do not.
- **Failure mode:** Anosmia is early and common in neurodegeneration; "can you smell it?" can expose a
  loss the patient hadn't named. Phrase as invitation to remember, never as a perceptual test. Smells
  are also potent trauma cues — disinfectant for hospitals, smoke for war.
- **Difficulty:** low (imagery) / high (physical scent accessory)
- **Variant of:** Tell Me About This One

---

## 11. Hands That Knew How

**One line:** The patient watches a short silent clip of hands doing the work they used to do — kneading
dough, turning a lathe, casting a fly, threading a needle — and their own hands often start moving too.

- **Input needed:** The patient's occupations and hobbies (text). Video from a curated library; or,
  richer, a family-recorded 20-second clip of the actual task, ideally in the actual place.
- **Interaction:** No input at all — watch. Optional: mimic the movement in the air.
- **Why it might work:** Procedural memory is dissociable from and outlives declarative memory. Action
  observation primes the motor programme directly; patients frequently begin the movement without
  being asked and without being able to say what they are doing. Competence is felt in the body rather
  than reported, which is exactly where it is still intact.
- **Failure mode:** Watching hands do something yours can no longer do, because of arthritis, tremor
  or apraxia, is a direct confrontation with decline. Needs framing as "this is what you knew", not
  "have a go".
- **Difficulty:** medium
- **Variant of:** novel

---

## 12. The Book of You

**One line:** At the end of a session the app quietly reads back a beautiful one-page spread of what
the patient said today — their words, their photo, their name at the bottom — and says "this is going
in your book."

- **Input needed:** Nothing — derived from existing content and the session's own recordings.
- **Interaction:** Just watch and listen. Optional single tap to turn the page.
- **Why it might work:** Legacy and witness. The output of the session is not a score but an artefact
  with the patient's name on it, which converts effort into contribution. Seeing one's own words
  presented as worth keeping counters the pervasive late-life sense of being a burden and produces a
  concrete reason to come back tomorrow that is not compliance.
- **Failure mode:** If the transcription is wrong, garbled, or exposes confusion back to them in print,
  the reflection becomes a mirror of the deficit. Safer to present the audio of their own voice, or
  heavily family-curated text, than raw automatic transcription.
- **Difficulty:** medium
- **Variant of:** novel

---

## 13. Someone Is Listening

**One line:** After the patient finishes talking, the screen shows "Sarah is listening to this" and
later that day a real reply comes back in Sarah's voice, about what they actually said.

- **Input needed:** At least one committed family member willing to listen and reply within ~24 hours.
  No new content — the mechanic runs on the family's attention, not their uploads.
- **Interaction:** Speak aloud, then later just listen. Optional single tap to hear the reply again.
- **Why it might work:** Closes the loop from monologue into relationship. The reinforcement is social
  presence and being genuinely heard, not points. For care-home patients with infrequent visits, an
  asynchronous voice from a real person is a substantially different emotional object from an app
  response. It also gives distant family a low-guilt, five-minute way to participate.
- **Failure mode:** The family stops replying. The patient may not remember that no reply came — but
  may equally register abandonment. If the promise "Sarah is listening" ever becomes false the whole
  app's trustworthiness goes with it. Needs a graceful degradation to "saved for Sarah" phrasing.
- **Difficulty:** medium
- **Variant of:** The Book of You

---

## 14. Walk Down Your Street

**One line:** The patient slowly moves along the street they grew up in, house by house, and says
who lived where.

- **Input needed:** One address or place name where the patient lived before ~age 25. Imagery derived
  from street-level map services; contemporaneous archive photographs if available.
- **Interaction:** Tap a single large arrow to move one house forward. Speak aloud.
- **Why it might work:** Spatial and topographic memory of childhood environments is deeply
  consolidated and often intact when recent spatial memory is destroyed. The street acts as a
  structured retrieval scaffold — a method-of-loci walk through a real life — where each location
  cues names, families, shops and events in sequence rather than requiring free search.
- **Failure mode:** The street has been demolished, redeveloped, or is now visibly deprived —
  confronting the patient with the erasure of their world. Modern street imagery may also trigger
  reality-orientation conflict ("that's not right, the dairy was there"), which must be met with
  agreement, not correction.
- **Difficulty:** high
- **Variant of:** novel

---

## 15. The Season Turning

**One line:** In late October the app shows conkers, coal smoke, and dark afternoons, and asks what
autumn was like when they were small.

- **Input needed:** Nothing — derived from the calendar, hemisphere, and the patient's childhood
  region. Optional: family photos tagged by season.
- **Interaction:** Watch, then speak aloud.
- **Why it might work:** Seasonal cues are shared, non-personal, and impossible to get wrong, so they
  work as a warm-up before any personal content. They also provide gentle temporal orientation
  without asking the date, and seasonal childhood routines (harvest, blackout, school shoes, summer
  holidays) are heavily rehearsed generic-autobiographical material that remains accessible when
  specific episodes do not.
- **Failure mode:** Low. The main risk is blandness — a generic season prompt with no personal hook can
  feel like a screensaver and produce nothing. Winter content can also compound seasonal low mood in
  patients already isolated indoors.
- **Difficulty:** low
- **Variant of:** Tell Me About This One

---

## 16. Correct Me

**One line:** A gentle voice states something slightly wrong about the patient's own life — "you were
a schoolteacher, weren't you?" — and the patient puts it right.

- **Input needed:** 5+ true facts about the patient (job, birthplace, spouse's name, number of
  children, car they drove), each paired with a family-approved near-miss distortion.
- **Interaction:** Speak aloud. No tapping.
- **Why it might work:** Being the authority who corrects the machine is a powerful dignity inversion —
  the patient holds knowledge the app lacks. Recognition of a mismatch is easier than free recall, and
  indignation is a strong retrieval motivator that bypasses anxiety. Any response, including "no, that's
  not right" without the correct answer, is a win.
- **Failure mode:** The serious one — if the patient accepts the false statement, the app has just
  planted misinformation about their own life, and repeated exposure can consolidate it. Mandatory
  that the truth is always spoken immediately afterwards, warmly ("of course — a joiner, forty years
  at Pattinson's"). Some patients will also find being contradicted about their own life distressing
  rather than energising, so this must be opt-in per patient.
- **Difficulty:** medium
- **Variant of:** novel

---

## 17. What Would You Tell Them

**One line:** The app asks a question only a long life can answer — "what makes a marriage last?" —
and records the patient's answer as advice for the family.

- **Input needed:** Nothing — a library of universal wisdom questions. Optional: family-supplied
  questions they genuinely want answered ("Mum, what should I do about the house?").
- **Interaction:** Listen, then speak aloud.
- **Why it might work:** Targets crystallised knowledge and moral/semantic reasoning, both far more
  robust than episodic memory. There is no fact to retrieve, so no failure is possible. Positions the
  patient in the elder role — the one whose judgement is sought — which for many is the identity they
  have most recently lost.
- **Failure mode:** Can feel like being interviewed for a eulogy, particularly for patients aware of
  their trajectory. "What would you tell them" contains an implicit "when you're gone". Framing must
  be present-tense and casual.
- **Difficulty:** low
- **Variant of:** Teach the Grandchild

---

## 18. The Kitchen Table

**One line:** Two or three residents sit around one shared tablet lying flat between them and take
turns tapping their own photograph to tell the table about it.

- **Input needed:** Content for 2+ patients on the same device, each with a distinct portrait as
  their handle. No cross-sharing without consent.
- **Interaction:** Tap your own portrait, then speak to the room. Device lies flat, no screen faces
  any single person.
- **Why it might work:** Group reminiscence has the strongest evidence base of anything in this
  document, and the active ingredient is largely social. The device becomes a table centrepiece and
  turn-taking device rather than a screen, preserving eye contact between people. Peers cue each
  other — one person's shipyard triggers another's.
- **Failure mode:** Comparison and shame. A resident with fluent narrative beside one with none makes
  the gap visible to both. Also privacy: a life story told in a dayroom is told to strangers and
  staff, and the patient may not be able to consent meaningfully to that in the moment.
- **Difficulty:** medium
- **Variant of:** Tell Me About This One

---

## 19. It Doesn't Matter Which

**One line:** The app shows two photos and asks "which of these is your brother Jack?" — and whichever
they tap, the app says "that's Jack" and moves warmly on.

- **Input needed:** 2+ photos per named person; the family must be comfortable with the app never
  correcting.
- **Interaction:** Tap one of two large pictures.
- **Why it might work:** Deliberately abandons assessment to preserve the *form* of a familiar
  activity. Errorless by absolute construction — no error can be produced. For patients who still
  enjoy the ritual of being asked but can no longer succeed at it, this keeps the ritual and discards
  the scoring. The felt experience is of getting it right every time.
- **Failure mode:** Ethically loaded. Patients with insight may notice and feel humoured, which is
  worse than failing honestly. Families may find it dishonest. And it removes any diagnostic signal
  the researcher might want. Should be a late-stage mode the family switches on knowingly, not a
  default.
- **Difficulty:** low
- **Variant of:** Two Good Things

---

## 20. Sunday Afternoon

**One line:** The patient does nothing at all while their own photographs drift slowly past to their
own music, and any time they want to say something the app is already listening.

- **Input needed:** Nothing — derived from existing content, once ~20 photos and a few songs exist.
- **Interaction:** No input at all. Ambient. Always-on microphone that captures anything said aloud
  and files it against whatever was on screen.
- **Why it might work:** The zero-demand floor of the whole system. On a bad day, a tired or agitated
  patient can still receive their own life without being asked for anything, and passive
  personalised-media exposure has calming effects independent of recall. Because it never asks, it
  never fails; spontaneous utterances captured this way are often richer than prompted ones.
- **Failure mode:** Indistinguishable from a screensaver if it never earns attention, and an
  always-listening microphone in a care home is a serious surveillance and consent problem —
  particularly for anything said by staff or other residents in the room.
- **Difficulty:** medium
- **Variant of:** Your Song
