# Mechanics — Voice and Sound

Lens: the audio designer. Everything here is built on the family's recorded voices, the patient's own speech, music, or non-verbal sound. Divergent phase — nothing culled for feasibility, cost, or weirdness. Culling happens later.

A note that runs through all of these: **the microphone is never a grader.** Where speech is captured, the session moves forward regardless of what was said. Anything derived from the speech (latency, fluency, word-finding) is researcher-facing only and never surfaced to the patient as a score, a streak, or a "let's try that again".

---

## 1. Her Voice Asks

- **oneLine:** Your daughter's voice says "Mum — who's this one? I think it's the one from the beach," and two big photographs are on the screen for you to touch.
- **inputNeeded:** One 3–8 second voice clip per question, recorded by a named family member in the app's record screen; plus the 2 photos the question refers to.
- **interaction:** Tap one of two large pictures.
- **whyItMightWork:** Social presence — a familiar voice recruits attention and cooperation in a way synthetic speech and on-screen text do not, and carries prosody (warmth, no interrogative "test" edge). It also converts a reading task into a listening task, bypassing visual acuity and literacy decline. The question is recognition, not recall, so the floor is low.
- **failureMode:** Hearing the daughter's voice from a machine while the daughter is not in the room can read as her being present, then absent — a small repeated loss. If the clip has a teacherly tone ("Come on, you know this") it becomes a test administered by family, which is worse than a test administered by a stranger.
- **difficultyToBuild:** low
- **variantOf:** novel

## 2. Just Say It

- **oneLine:** A photo appears, a voice asks who it is, and you simply answer out loud — there is nothing to press.
- **inputNeeded:** Photos with the answer word(s) typed in by family (name, place, relation) plus accepted alternatives ("Bill", "William", "Grandad", "your brother").
- **interaction:** Speak aloud. No touch at all.
- **whyItMightWork:** Removes the entire motor and UI layer — no tremor problem, no "where do I press", no swipe/tap literacy. Speaking is the most overlearned response an adult has. Free recall also produces richer retrieval than recognition, and the answer arrives with usable latency and fluency data attached.
- **failureMode:** Speech recognition mishears an accent, a quiet voice, or dentures, and the app responds as if the patient got it wrong — the single most humiliating failure available in this product. Also: patients who have learned that machines don't understand them stop speaking altogether. Mitigation is that ASR only ever *escalates support*, never contradicts.
- **difficultyToBuild:** high
- **variantOf:** novel

## 3. Fill In the Line

- **oneLine:** A song you have known for sixty years plays, and just before the last few words the singing drops out and you finish the line.
- **inputNeeded:** 3–10 songs the family knows were formative (licensed audio or family-sung recordings) with rough lyric timings; family can just tap along once to mark the drop-out point.
- **interaction:** Sing or speak aloud; no input required to proceed.
- **whyItMightWork:** Music and lyric completion are supported by procedural and implicit memory systems that are relatively spared well into moderate and severe dementia. The melody primes the words — the patient is not retrieving, they are being carried. Almost nobody fails, which makes it a good session opener to establish "I can do this".
- **failureMode:** The song is emotionally loaded in an unanticipated way (a wedding song, a funeral hymn) and the drop-out arrives at exactly the wrong lyric. Also, being watched or heard while singing can be embarrassing on a shared care-home tablet.
- **difficultyToBuild:** medium
- **variantOf:** novel

## 4. The Wireless

- **oneLine:** You press one large button and a fifteen-minute radio programme about your life plays — a presenter's voice, your songs, letters from your family read aloud, and now and then a gentle question you can answer to the room.
- **inputNeeded:** Everything already in the account (photos are ignored), plus at least ~10 minutes of audio material: voice clips, songs, one or two family-read letters. Family optionally records a station ident.
- **interaction:** One press to start. Then just listen — answering aloud is optional and unmonitored for correctness.
- **whyItMightWork:** Radio is a deeply familiar cultural form for this cohort with no learned interaction demands and no screen literacy needed at all. It works for profound visual impairment, for late-day agitation, and in bed. The programme format legitimises passive participation: not answering a radio is normal, not answering a quiz is failure.
- **failureMode:** Becomes background noise nobody engages with — a television left on. Or the "presenter" voice feels patronising, a children's-hour tone applied to an adult.
- **difficultyToBuild:** medium
- **variantOf:** novel

## 5. Touch the Face, Hear the Voice

- **oneLine:** You touch a face in the photograph and that person speaks to you — "Hello Mum, it's Anne, I'm your eldest."
- **inputNeeded:** One photo per person with a face region tagged by family, plus a 5–10s self-introduction clip recorded by that person in their own voice ("Hello X, it's Y, I'm your…").
- **interaction:** Tap a face on screen. Free exploration — no right answer, no sequence.
- **whyItMightWork:** Errorless learning by design: touching produces the answer, never a judgement. Repeated pairing of face + name + voice + relation is the exact structure used in spaced-retrieval face-name training, but delivered as browsing rather than testing. Voice is a second, independent identity cue that sometimes survives when face recognition has gone.
- **failureMode:** Patient taps repeatedly and the same greeting loops, revealing the machinery and flattening the person into a recording. If a tagged person has since died or become estranged, an unguarded tap delivers that voice with no warning.
- **difficultyToBuild:** low
- **variantOf:** novel

## 6. Safe Keeping

- **oneLine:** A quiet screen says "There's a recording of Jim here if you'd like to hear it" and waits — you only hear your late husband's voice if you say yes.
- **inputNeeded:** Archive audio of the deceased person (old video, voicemail, cassette) uploaded by family, plus an explicit family decision flag: allowed / allowed-with-warning / never; plus how the person should be referred to.
- **interaction:** Tap a large YES, or tap nothing and it goes away after a while.
- **whyItMightWork:** Emotional salience is the strongest retrieval cue available, and a spouse's voice is the most salient audio a person owns. Consent-first framing preserves agency: the patient chooses to enter the memory, which is the difference between grief and comfort. For patients who have forgotten a death, the opt-in wording never asserts that the person is alive or dead.
- **failureMode:** The catastrophic case in this whole product. It re-bereaves — the patient learns of the death again, or believes the person is in the next room. It can trigger prolonged distress hours after the session ends, with staff unaware of the cause. Needs a carer-visible log of when it played.
- **difficultyToBuild:** medium
- **variantOf:** Touch the Face, Hear the Voice

## 7. Call and Response

- **oneLine:** A voice says "A stitch in time…" and you say the rest, and it says "…that's the one" and gives you another.
- **inputNeeded:** Nothing from the family for the generic set (proverbs, hymn responses, playground rhymes, adverts of the era). Optionally: family-supplied private phrases — a father's catchphrase, a call-and-response used with the grandchildren.
- **interaction:** Speak aloud. Progression is on a timer, not on the answer.
- **whyItMightWork:** Overlearned verbal chains are stored semantically and procedurally and are among the last language to go. The prompt does most of the work (priming), so success is near-guaranteed — this is errorless practice that produces the *feeling* of remembering, which is the motivational fuel for the rest of the session.
- **failureMode:** Feels like the "orientation questions" of a clinical assessment if the pacing is brisk. Region and generation mismatches turn a guaranteed win into a blank ("that's not how we said it").
- **difficultyToBuild:** low
- **variantOf:** Fill In the Line

## 8. The Answering Machine

- **oneLine:** A light is blinking and a big button says "1 new message" — you press it and hear a message your granddaughter left for you this morning.
- **inputNeeded:** Family records short messages ad hoc through their phone app; ideally a habit of 3–5 per week. Falls back to a stored bank of evergreen messages when nobody has recorded lately.
- **interaction:** Press one large physical-feeling button. Optionally hold a second button to record a reply.
- **whyItMightWork:** The answerphone is a fully learned procedural interaction from this cohort's working life — no new UI to acquire. It supplies a *reason to open the app that isn't exercise*, and the daily unpredictability creates genuine anticipation. Recording a reply closes a social loop and gives the patient a producer role, not just a recipient one.
- **failureMode:** No new message today reads as "nobody called" — abandonment, and worse than never having offered. Repeated re-listening to the same message with no memory of having heard it can distress family who see the play counts.
- **difficultyToBuild:** medium
- **variantOf:** novel

## 9. The Sound of the Place

- **oneLine:** You hear a kettle, a shipyard riveter and gulls, and a voice asks which one sounds like home.
- **inputNeeded:** Family tags places lived/worked (town, industry, coast/farm/city) and, best case, uploads 1–2 real recordings — the actual church bells, the farm, the front room clock.
- **interaction:** Tap one of two or three large pictures, or say it aloud.
- **whyItMightWork:** Environmental sound bypasses language entirely and reaches autobiographical memory through a different route than either words or photographs — useful when naming has degraded but the person is intact. Non-verbal recognition is preserved late. Real site recordings carry episodic specificity that stock audio cannot.
- **failureMode:** Sounds are ambiguous even to healthy listeners; failing at "what is this noise" feels like a hearing test, and hearing loss is already a live insecurity. Some sounds (sirens, air-raid-adjacent, hospital beeps) are frightening.
- **difficultyToBuild:** medium
- **variantOf:** Her Voice Asks

## 10. Whose Voice Is That?

- **oneLine:** Two short voice clips play in turn — "Hello, it's me" — and you touch the photo of whichever one you just heard.
- **inputNeeded:** 5+ family members each recording the same neutral phrase, 3–5s, plus a photo of each.
- **interaction:** Tap one of two large photographs.
- **whyItMightWork:** Voice identity recognition (phonagnosia aside) draws on a partly separate route from face recognition, so it can succeed on days when faces fail — giving the session another way to end in a win. It also rehearses the exact skill that matters in real life: knowing who is on the telephone.
- **failureMode:** Genuinely hard — siblings and same-generation relatives sound alike, and phone-quality audio strips the cues. A run of misses on people you love is a direct confrontation with decline. Needs to be short and to sit after an easy win.
- **difficultyToBuild:** low
- **variantOf:** Her Voice Asks

## 11. Hum Along

- **oneLine:** A tune plays softly and you hum or tap along with it; when you do, the band comes in behind you and it sounds better.
- **inputNeeded:** Nothing beyond the music already chosen. Optionally the family flags 2–3 songs the person used to sing or play.
- **interaction:** Hum, sing, or tap the table — microphone and/or accelerometer listens; no correctness, no buttons.
- **whyItMightWork:** Rhythmic entrainment and musical procedural memory are robust; joining in is possible for people who can no longer speak in sentences. Making the accompaniment *respond* to the patient's own sound converts them from audience into performer — agency and mastery without any possibility of a wrong answer. Very effective for agitation.
- **failureMode:** Self-consciousness on a shared tablet, or a person who "was never musical" being asked to perform. If the responsive accompaniment glitches, it feels like being musically corrected.
- **difficultyToBuild:** high
- **variantOf:** Fill In the Line

## 12. The Ladder of Hints

- **oneLine:** You're asked who's in the photo; if you don't answer, the voice quietly helps — "she was a nurse"… "her name starts with Mar-"… "Margaret" — until you say it, and either way it feels like you got there.
- **inputNeeded:** Per person: name, one or two biographical fragments (occupation, where they lived, relation), and family recording the hint tiers in their own voice — or generated from typed facts.
- **interaction:** Speak aloud, or say nothing; the ladder descends on a generous timer.
- **whyItMightWork:** Textbook cued recall with graded prompts, ending in errorless provision of the answer. Every session ends with the correct name having been said out loud in the room. The *level* of hint required is a clean, sensitive longitudinal measure of retrieval difficulty — real data, invisible to the patient.
- **failureMode:** The descent through hints is legible as "you're failing, here's more help" — a slow, public countdown of decline. Timing is everything: too fast is condescending, too slow is abandonment. Family recording hints in an increasingly exasperated tone would be corrosive.
- **difficultyToBuild:** medium
- **variantOf:** Just Say It

## 13. Tell Me About This One

- **oneLine:** A photograph comes up and a voice says "I love this one — what was going on here?" and then just listens for as long as you talk.
- **inputNeeded:** Photos with a one-line family note for context (used only for the follow-up prompt, never to grade). Optionally family-recorded interviewer prompts.
- **interaction:** Speak freely; nothing to press. Optionally a large "that's all" button.
- **whyItMightWork:** Open autobiographical narration with no correct answer — reminiscence therapy's core move. It is generative rather than judged, it produces the longest and most natural speech sample of any mechanic here (word-finding pauses, type-token ratio, syntactic complexity — a rich research signal), and the recordings are themselves an artefact the family will treasure.
- **failureMode:** A blank photograph with no story available is a void the patient must fill in front of a listening machine; silence becomes shameful. Also privacy: candid, confused, or distressing speech is being recorded and family can hear it — consent must be real and revocable.
- **difficultyToBuild:** medium
- **variantOf:** novel

## 14. The Chime

- **oneLine:** When you get one right, you hear a warm little three-note phrase — nobody says "correct", nobody says "well done".
- **inputNeeded:** Nothing — a designed sound set. Optionally family chooses a "house sound" (their own doorbell, a mantel clock chime, a grandchild's laugh).
- **interaction:** No input; it is the response layer to every other mechanic.
- **whyItMightWork:** Non-verbal reinforcement lands faster than speech, needs no comprehension, and crucially avoids the infantilising register of spoken praise ("Well done!" is what you say to a child or a dog). Consistent earcons become learned within days and carry the session's structure — start, success, moving on, done — for patients who can't follow spoken instruction.
- **failureMode:** Absence of the chime becomes an audible failure marker — the silence after a wrong answer is louder than any buzzer. Needs a distinct, non-negative "moving on" sound so nothing is ever marked by silence. Hearing loss in the high registers can make the chime inaudible, so success becomes invisible.
- **difficultyToBuild:** low
- **variantOf:** novel

## 15. Read Me This

- **oneLine:** A short letter from your grandson is on the screen in large type and a voice asks if you'd read it out loud — and it reads along with you, just under your voice, if you slow down.
- **inputNeeded:** Short family-written letters (40–80 words) refreshed periodically; family may also record a reference reading.
- **interaction:** Read aloud. The app's supporting voice fades in only when the patient stalls.
- **whyItMightWork:** Reading aloud is preserved late (surface reading is procedural) and produces a comfortable, non-testing use of voice. The shadowing support means the sentence always completes — errorless by construction. Prosody and reading rate over months are a clean, low-effort research signal.
- **failureMode:** Vision loss and unfamiliar fonts make it a literacy test. Being "read along with" can feel like being corrected by a teacher. Someone who has lost reading entirely encounters a wall of text they can no longer decode — a stark self-discovery.
- **difficultyToBuild:** medium
- **variantOf:** Fill In the Line

## 16. The Telephone

- **oneLine:** A real telephone handset sits by the chair; you pick it up and someone in your family is talking to you about the day you got married.
- **inputNeeded:** All existing voice/photo content, delivered audio-only; family voice clips arranged into 2–4 minute "calls". Requires a paired handset accessory (BT handset or dumb-looking hardware).
- **interaction:** Lift a receiver. Put it down to end. That's the whole interface.
- **whyItMightWork:** The single most overlearned interaction available to this cohort — picking up a telephone survives when tablets are unrecognisable. It is private (crucial in a care home), hands-free of screens, comfortable for the visually impaired, and the handset's physical affordance is self-explanatory: no instruction, no onboarding, no back button.
- **failureMode:** Belief that it is a live call — the patient talks and is not answered, or believes they have spoken to someone who has died. Hardware in a care home gets lost, flat, or shared. Risk of the patient trying to make outbound calls and finding nothing.
- **difficultyToBuild:** high
- **variantOf:** The Wireless

## 17. Send One Back

- **oneLine:** After you've told a story, a voice asks "shall I send that to Anne?" — and tomorrow Anne's reply is waiting for you.
- **inputNeeded:** Nothing new to set up; requires family to actually reply (the app nudges them). Consent settings for who may hear what.
- **interaction:** Tap a large YES; later, press one button to hear the reply.
- **whyItMightWork:** Turns a solitary exercise into a genuine relationship with feedback — motivation that doesn't depend on the patient remembering to be motivated. The reply is proof that the speaking mattered, which is the most durable reason to come back tomorrow. Also gives distant family a way to be present daily without a phone call the patient may struggle with.
- **failureMode:** Family stop replying — the emptiness is felt as rejection, and worse than never having offered. Patient says something confused or intimate and doesn't understand it will be heard. Family receive distressing evidence of decline with no support attached to it.
- **difficultyToBuild:** medium
- **variantOf:** The Answering Machine

## 18. Tuning In

- **oneLine:** The session opens with a familiar tune and a voice saying "tell me when this is comfortable" while it slowly gets louder — and you say "that's fine".
- **inputNeeded:** Nothing — derived from existing music/voice content.
- **interaction:** Speak aloud, or tap a large "that's fine" button.
- **whyItMightWork:** A disguised audiometric and speech-in-noise calibration that runs every session and quietly adapts volume, EQ (presbycusis lift), and speech rate to today's state — the difference between a patient who "can't do it" and one who couldn't hear it. Framed as the app adjusting itself, so the deficit belongs to the machine, not the person. Longitudinal hearing-threshold drift is a real research byproduct.
- **failureMode:** Reads as a hearing test, which is exactly the anxiety it is meant to sidestep — the framing must be that the tablet is being fussy, not the ear. In a shared care-home room it also broadcasts to others that this person is deaf.
- **difficultyToBuild:** medium
- **variantOf:** novel

## 19. The Quiet Stopwatch

- **oneLine:** Nothing — the patient does the session exactly as before and never encounters this at all.
- **inputNeeded:** Nothing — derived entirely from audio already captured in other mechanics.
- **interaction:** No input at all; it is a passive layer over every spoken mechanic.
- **whyItMightWork:** Time-to-speech-onset, filled pauses ("um", "the thing"), pronoun-for-noun substitution, sentence length and articulation rate are established, sensitive markers of cognitive-linguistic change — and they accrue daily, at home, in a naturalistic setting, at zero burden. It gives the researcher a dense signal without a single item that the patient can perceive as a test.
- **failureMode:** Not experienced by the patient — which is itself the risk. Continuous voice analysis of a person who cannot meaningfully consent is the sharpest ethical edge in this product. If any of it ever leaks into the patient-facing UI ("you were slower today"), it becomes the cruellest feature in the app.
- **difficultyToBuild:** high
- **variantOf:** Just Say It

## 20. Winding Down

- **oneLine:** In the evening you press one button and there are no questions at all — just your music, your family's voices saying goodnight, and the sound of your old kitchen clock.
- **inputNeeded:** Family records 3–5 goodnight lines; a handful of calm tracks; optionally an ambient bed from home.
- **interaction:** One press, then nothing. Auto-fades and stops.
- **whyItMightWork:** Explicitly zero-demand. Late-afternoon and evening are when agitation peaks and capacity is lowest, so the day's last touchpoint should ask for nothing while still being *theirs*. Preserves the daily habit on bad days without ever producing a failure, which protects the streak of self-image that makes tomorrow's real session possible.
- **failureMode:** Family voices at bedtime prompting a search for absent people — "where is she, she was just here". Or it quietly cannibalises the real sessions because it's easier, and staff default to it.
- **difficultyToBuild:** low
- **variantOf:** The Wireless
