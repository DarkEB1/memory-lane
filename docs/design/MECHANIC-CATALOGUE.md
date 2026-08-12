# THE MECHANIC CATALOGUE

The complete, deduplicated possibility space of ways a person with dementia could engage with an app built from their own life content.

**Sources:** nine divergent lens boards in `docs/design/mechanics/` — recall-core (memory scientist), emotional-and-narrative (reminiscence therapist), social-and-carehome (activities coordinator), voice-and-audio (audio designer), ambient-and-zero-effort (calm-technology designer), orientation-and-daily-life (occupational therapist), games-and-play (game designer), wildcards (the odd board), hybrids (fusion pass).

**Raw mechanics generated:** 179
**After deduplication:** 139
**Families:** 15

---

## How to read this

**IDs are stable.** M-01 … M-139 never change meaning. Downstream boards (culling, scheduling, UX, data model) should reference mechanics by ID, not by name — several names collide across the source boards.

**Convergence is recorded, not hidden.** Where two or more independent lenses invented the same mechanic without coordination, that is evidence the idea is load-bearing. The **Converged from** column names every source. A mechanic converged on by three or four lenses deserves more weight in the cull than one that appeared once.

**Superficial similarity is not identity.** Many mechanics look alike and are psychologically opposite — a two-picture question that is graded and a two-picture question that is structurally ungradeable are *not* the same mechanic even though the pixels match. The section **"Deliberately not merged"** at the end lists every near-miss and the distinction that kept them apart. Read it before collapsing anything further.

### Column legend

**Content ask** — what the family must supply, and how likely they are to actually supply it.

| Level | Meaning |
|---|---|
| **None** | Derived from content already in the app, or from birth year / postcode / calendar. Nothing new is asked of anyone. |
| **Low** | Photos, place names, dates, birth year, a name list. Families have these already and giving them takes minutes. |
| **Med** | Recorded voice clips, per-photo captions, tagging, short written notes. Needs a real authoring session and a good authoring flow, and will decay over time. |
| **High** | Content many families will not have, cannot make, or will refuse: archive audio of the dead, video of the patient's own hands working, the patient's own pre-diagnosis recordings, scans of their handwriting, hammy on-camera performances, sustained weekly reply commitments, or a real-world promise that must actually be kept. **A High mechanic that does not get its content is not a degraded mechanic; it is a broken one.** |

**Device** — anything required beyond a screen and a speaker. `—` means screen and speaker are sufficient.
Abbreviations: **Mic** · **Cam** · **Always-on** (a display that stays lit and unattended) · **NFC/tags** · **Sensor** (PIR, smart-plug, accelerometer) · **Handset** (telephone accessory) · **Live net** (real-time two-way connection) · **2nd device** (a family member's phone, a second tablet) · **TV cast** · **Props** (physical objects) · **Print/post** · **Scent** (scent cartridge accessory).

---

# F1 · Zero-Demand Exposure

**Function.** These mechanics carry no retrieval demand whatsoever, so failure is structurally impossible — which is what makes them the only surface that still works on the worst day, in the late afternoon, and in advanced impairment. Their mnemonic mechanism is mere exposure, perceptual fluency and incidental encoding: repeated non-attended presentation raises familiarity and processing ease even when no conscious recollection is available, and implicit familiarity is among the last things to go. Their motivational mechanism is subtler and possibly more important: they convert the device from a thing that asks questions into a thing that shows you your own life, which is the reframing that determines whether the app is still switched on in month four. Exposure is an outcome here, not a consolation prize for failing the real exercise.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-01** | The Ambient Frame | Photographs from their life cycle quietly on an idle screen, all day, and nobody ever asks about them. | scientist (Photograph That Waits), ambient ×3 (Frame That Waits, Pure Exposure, Idle Screen Life) | None–Low; captions optional | Always-on (ideally) |
| **M-02** | The Narrated Album | One photo at a time with a relative's voice saying who is in it and what was happening — patient-paced or self-advancing, the whole screen tappable. | scientist (Slow Album), game (Slide Carousel), ambient (One Thing On The Whole Screen) | Med — one voice caption per photo | — |
| **M-03** | Touch the Face, Hear the Voice | Touch a face in a group photo and that person introduces themselves in their own voice: "Hello Mum, it's Anne, I'm your eldest." | audio | Med — face-region tagging + a clip per person | — |
| **M-04** | The Living Room Channel | Between the programmes, the television itself shows their photographs and plays their songs. | ambient | None | TV cast |
| **M-05** | The Window Seat | A window onto a garden matching the real season and time of day, where their photos drift past like leaves. | game | None | — |
| **M-06** | Someone In The Next Room | A silent loop of a relative pottering in their own kitchen, not addressing the camera — just present. | ambient | High — ambient video per relative, non-addressing | — |
| **M-07** | Winding Down | At the sundown hour the device stops asking anything at all and plays slow familiar pictures to slow familiar music until bed. | audio (Winding Down), ambient (Wind-Down), OT (Sundown Ritual) | Low–Med — calm-content flags, goodnight clips | — |
| **M-08** | Night Chair | In the small hours a night carer sets a quiet screen beside them where a familiar voice reads something ordinary. | care-home | Med — a 3–5 min calm recording, curated low-arousal photos | — |
| **M-09** | The Twenty Minutes | The carer presses one button, the room fills with her photographs and her music for twenty minutes, and a voice says "he'll be back in a minute" — and he is. | hybrid | None | — |

---

# F2 · Recognition Probes

**Function.** Recognition survives dramatically longer than free recall in Alzheimer's — a two-alternative forced choice can be at ceiling when the name is completely unavailable. This family is where genuine measurement lives, and the difficulty dial is invisible: foil distance alone titrates from ceiling to floor without a single interface change. The motivational problem is the mirror image of the measurement benefit — a wrong answer about your own sister is a small humiliation even with nobody watching, and 50% chance performance means a wrong answer is uninformative to the researcher but does not *feel* uninformative to the person who gave it. Hence the sub-family that abolishes correctness entirely (M-12, M-13): the probe survives as data in the choice distribution while the patient experiences only preference.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-10** | Two Pictures, One Question | Two large photographs fill the screen: "which one is your Alice?" — and touching either is met with warmth. | scientist (This One or This One), ambient (Two Doors), audio (Her Voice Asks — question in a relative's voice) | Low; Med for the recorded-question variant | — |
| **M-11** | Odd One In | Three kitchens appear and she is asked, lightly, which one *feels* like hers — and one of them genuinely is. | scientist | Low — photos of real places; foils from era stock | — |
| **M-12** | It Doesn't Matter Which | "Which of these is your brother Jack?" — and whichever they tap, the app says "that's Jack" and moves warmly on. | reminiscence | Low | — |
| **M-13** | Both Are Right | Two pictures and a real preference inside the question — "which would you rather talk about today?" — with the recognition signal living in the choice distribution, not in a right answer. | reminiscence (Two Good Things), game (Postcard Rack — sorting places into "been there" / "fancy a visit"), hybrid (Both Are Right) | Low | — |
| **M-14** | Whose Voice Is That? | Two short clips play — "hello, it's me" — and they touch the photo of whoever they just heard. | audio | Med — same neutral phrase from 5+ relatives | — |
| **M-15** | The Sound of the Place | A kettle, a shipyard riveter, gulls — and a voice asks which one sounds like home. | audio | Low–Med; High for real site recordings | — |
| **M-16** | Which Came First | Two photographs decades apart, put in order — or, in the quiz-show skin, "was this before or after you and Bill were married?" | scientist (Which Came First), game (Quiz Night: Before or After) | Low — photos with approximate years + 2–3 anchor events | — |
| **M-17** | The Lost Property Office | A deferential clerk brings out things handed in and asks, respectfully, whether any of them are theirs to claim. | wildcard | Low — existing content plus era-matched decoys | — |
| **M-18** | Two Truths and a Tall Tale | Her son tells three things about the family, two true and one completely daft, and she picks the daft one and everyone laughs. | game | Med — recorded triples; families must be pushed hard toward *absurd*, not plausible | — |
| **M-19** | Correct the Machine | A cheerful voice gets something about his life wrong and he puts it right, and the voice thanks him for setting it straight. | reminiscence (Correct Me), hybrid (Correct the Machine) | Med — true facts each paired with a family-approved wrong version at two strengths | Mic (optional) |

---

# F3 · Errorless Cued Recall

**Function.** The clinical core. Explicit memory in dementia cannot tag an error as wrong and suppress it — the error is encoded implicitly and *strengthens* — so every mechanic here is engineered so the trial ends in a correct state regardless of what the patient does. Within that constraint, retrieval demand is graded: the answer arrives before the attempt (M-20), immediately after it (M-21), down a ladder of hints (M-22), or is withdrawn only as fast as performance allows (M-23). This family carries the two best-evidenced behavioural techniques in dementia — expanding-interval spaced retrieval (M-24, M-25) and vanishing cues (M-23) — both of which work because they exploit intact procedural and implicit learning rather than the damaged explicit system. The testing effect applies even when the patient has no conscious sense of having practised.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-20** | The Answer First | The name appears and is spoken, then a heartbeat later it is gone and he is asked gently "and who is this?" — and if nothing comes, the name simply returns. | scientist | Med — face photo, name as text and as a spoken clip | Mic (optional) |
| **M-21** | Ask and Always Answer | A voice asks one question about a photo and then, whatever happens — right, wrong, a story about something else, or silence — it says the answer warmly and sounds delighted. | ambient ×2 (The Frame That Asks, The Question With No Wrong Answer) | Med — a spoken question and a spoken answer sentence per item | Mic (optional) |
| **M-22** | The Ladder of Hints | If nothing comes, the voice quietly helps — "she was a nurse"… "her name starts with Mar-"… "Margaret" — until it is said, and either way it feels like arriving. | audio | Med — name plus 2–3 biographical fragments, ideally recorded as tiers | Mic (optional) |
| **M-23** | The Fading Name | The name under the photo is written in full today, "Ge___" next week, "G" the week after — and he finds he can still say it. Fade slowly, restore instantly. | scientist (The Fading Name), game (The Vanishing Name) | None beyond existing face/name content | Mic (optional) |
| **M-24** | The Widening Gap | The same handful of faces come back through the session — after seconds, then a minute, then at the end — and each success widens the next gap. | scientist | None; optionally 3–5 family-marked priority people | Mic (optional) |
| **M-25** | The One Sentence This Month | One single sentence the family and an OT agree matters most — "Jean comes on Wednesdays" — answer shown first, then asked back at 30s, 1m, 2m, 4m, 8m, then across days. | OT | Low — one sentence per month. That is the entire input. | Mic (optional) |
| **M-26** | Coming Into Focus | A photograph starts as a soft blur and slowly sharpens; she can say or tap the moment she knows — and it comes clear either way. | scientist (Coming Into Focus), ambient (The Slow Reveal) | None | Mic (optional) |
| **M-27** | The Long Introduction | "This is Margaret. She's the one with the loud laugh — she taught you to drive in the church car park." Then tomorrow, the same face and the same two things. | scientist | Med — 2–3 concrete unchanging descriptors per person, written well | — |
| **M-28** | The Face Across the Years | Three photographs of the same person at 20, 45 and 70 fade one into the next while a voice says who they are. | reminiscence | Low–Med — 3+ photos per person spanning decades | — |
| **M-29** | Say It Back | A voice says a name; he says it back. That is the whole exercise. | scientist | None | Mic (optional) |
| **M-30** | Just Say It | A photo appears, a voice asks who it is, and you answer out loud — there is nothing to press, and the recogniser may only ever *escalate support*, never contradict. | audio | Med — answer words plus accepted alternatives | **Mic (required)** |
| **M-31** | The Return Visit | A face he hasn't seen in four months comes back, introduced afresh as if for the first time — and it goes much faster than it did before. | scientist | None | — |
| **M-32** | Who Told You That? | Two voices he knows each told him something today; later he is asked which one said "we're coming on Saturday." | scientist | Med — clips from 2+ identifiable relatives, refreshed weekly | — |

---

# F4 · Completion & Overlearned Sequence

**Function.** Overlearned verbal chains — proverbs, hymn responses, lyrics, catchphrases, a sentence you have said ten thousand times — are stored semantically and procedurally and are among the very last language to go. Patients who cannot name their own children will complete a proverb reflexively. Mechanically this is priming doing almost all the work, so success is near-guaranteed, which makes this family the ideal session opener: it establishes the vocal channel and a rhythm of success before any real demand lands. The generation effect means self-produced completions are retained far better than heard ones, so it is genuine practice and not merely a warm-up. The design rule throughout: the app completes the phrase unconditionally, a half-beat later, so the patient's voice lands in unison rather than in judgement.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-33** | Finish The Sentence | In her husband's voice: "On a Sunday, we always used to walk down to the…" — and the sentence stops, and either way it finishes itself. | scientist | Med — 5–20 high-constraint personal stems written by a relative, ideally recorded | Mic (optional) |
| **M-34** | Finish the Line | A song known for sixty years plays and drops out one word short — "you are my sunshine, my only…" — and they sing it, with or without a bouncing ball on the lyrics. | reminiscence (Finish the Line), audio (Fill In the Line), game (Bouncing Ball Sing-Along) | Low — songs; Med for lyric timing marks | — |
| **M-35** | Complete the Saying | "A stitch in time…" — and the voice finishes it with them, and hands them another. | audio (Call and Response), game (Complete the Saying) | **None** for the standard set; Low–High for family catchphrases in the original speaker's voice | — |
| **M-36** | Read Me This | A short letter from a grandson in large type, read aloud by the patient, with the app's voice fading in just under theirs only if they stall. | audio | Med — short letters refreshed periodically | Mic (for the shadowing trigger) |
| **M-37** | Cue Script | A two-hander scene with only *his* lines printed, large, in a proper actor's part — and his daughter's recorded voice feeds him the cue and waits. | wildcard | High — scenes written from real remembered exchanges, plus the other part recorded with natural pauses | — |
| **M-38** | Pocket Answers | She practises out loud, with the answer already on screen, the sentences she needs when a stranger asks about her: name, where she grew up, what she did. | OT | Med — 5–8 identity facts in the patient's own phrasing, reviewed on a schedule | — |
| **M-39** | Your Own Voice, Waiting | The voice telling him his daughter's name and what he did for a living is his own, recorded four years ago when he could. | hybrid | **High** — a recording programme run at or near diagnosis; impossible to obtain retrospectively | — |

---

# F5 · Narration & Testimony

**Function.** Free recall is the most impaired capacity and normally the cruellest thing to ask for — but decoupled from evaluation and reframed as *telling*, it becomes a socially valued act rather than a test, and there is no correct answer to fail against. Narrative retrieval is generative and self-directed, reaching semantic and remote episodic content that no forced choice touches, and it produces the longest natural speech sample of any family here (word-finding pauses, type-token ratio, syntactic complexity — the densest research signal available at zero perceived burden). Motivationally this may be the strongest family in the catalogue, because the output is an artefact families genuinely treasure. Its characteristic failure is silence: an open microphone recording a word-finding blank is grim, and every mechanic here must degrade into cueing without comment.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-40** | Tell Me About This One | A single large photo and a warm voice: "I love this one — what was going on here?" — then the app goes quiet and listens for as long as she wants. | reminiscence, audio, scientist (Talking Back) | Low–Med — photos plus a one-line fallback caption | **Mic (required)** |
| **M-41** | The Storyteller's Chair | The screen shows only a soft empty armchair and "Ready when you are" — any story at all, unprompted. | reminiscence | None | **Mic (required)** |
| **M-42** | Sunday Afternoon | She does nothing while her photographs drift past to her own music, and any time she wants to say something the app is already listening. | reminiscence | None | **Mic (always-on)** |
| **M-43** | The Legacy Recording | She is asked to tell a story to her great-granddaughter, who is three, so she'll have it when she's older — and the tablet just listens. | care-home | Low–Med — a named recipient with a photo, 5–10 family-chosen prompts | **Mic (required)** |
| **M-44** | The Handover | At the end of the session he tells the app something — anything — and tomorrow it comes back to him in his own voice as the first card of the day. | OT | None; family review before replay is effectively mandatory | **Mic (required)** |
| **M-45** | The Book of You | The session ends with a one-page spread of what she said today — her words, her photo, her name at the bottom — "this is going in your book." | reminiscence | None | — |
| **M-46** | The Season Turning | In late October: conkers, coal smoke, dark afternoons — and what was autumn like when you were small? | reminiscence | **None** — derived from calendar, hemisphere and childhood region | Mic (optional) |

---

# F6 · Role Reversal & Expertise

**Function.** Every other family positions the patient as the one who might not know. This one positions them as the only person in the room who does. It targets crystallised knowledge, semantic memory about a lifelong craft, and remote autobiographical detail — the most robustly preserved territory there is — and retrieves it as *identity* ("I was a baker") rather than as recall. Generativity, the drive to pass something on, is a powerful and intact late-life motivator, and indignation at a machine getting your life wrong is a retrieval motivator that bypasses anxiety entirely. The characteristic risk is the mirror of the benefit: being cast as the expert and then failing is a deeper wound than failing a photo quiz, because the shortfall is consequential and witnessed. Questions must be pitched deliberately easy and families coached never to show disappointment.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-47** | Teach the Grandchild | A grandchild's recorded voice asks a real question — "Grandad, how do you know when bread is proved?" — and he teaches her. | reminiscence | Med — recorded questions from a named young relative, about a craft he genuinely owned | Mic (optional) |
| **M-48** | What Would You Tell Them | A question only a long life can answer — "what makes a marriage last?" — recorded as advice for the family. | reminiscence | **None** — a library of universal questions | **Mic (required)** |
| **M-49** | Ask Grandad | His granddaughter asks him something the family genuinely does not know — who the woman in the hat is, what year the boat photo was — and he tells her. | hybrid | Med — photos flagged as genuinely unidentified plus a recorded question | **Mic (required)** |
| **M-50** | Can You Help Me With This One? | Someone else's old photo, and she is asked, genuinely, whether she happens to know what kind of car that is or where that seaside might be. | care-home | Med — cross-family consent to show photos outside the owning family | Mic (optional) |
| **M-51** | My Turn to Show You | *He* holds the tablet, showing his own photos to a visitor, and the tablet quietly gives *the visitor* things to ask him about. | care-home | Med — 8–15 photos with one line of context each, shown to the listener not the patient | — |
| **M-52** | The Audio Guide | A chunky numbered handset, like the ones at stately homes, and his own front room is the exhibition — press 14 and a curator's voice tells him about the object at number 14. | wildcard | Med–High — 8–20 photographed objects with a 20–45s commentary each in museum register | Props (numbered keypad, optional) |
| **M-53** | The Switchboard | A telephone exchange lights up, a voice asks to be put through to "our Kathleen", and he pushes the plug into the socket with Kathleen's face on it. | wildcard | Med — a face plus a clip of each person talking *to someone else*, plus caller lines | — |
| **M-54** | The Wrong Number | The phone rings and it's a stranger who dialled wrong, lost near the market in the town where he grew up, asking him — because he'd know — how you get there from the station. | wildcard | **Low** — home town plus 3–5 place names; caller scripts are generated | Mic (optional), Handset (optional) |
| **M-55** | The Sunday Table | An empty laid table seen from the head of it, and she is asked — as the host, because it is her table — to put everybody where they sit. | wildcard | Low–Med — 5–10 face photos of the people who genuinely sat there | — |

---

# F7 · Music & Sound

**Function.** Musical memory, particularly for melodies encoded before about age 30, is strikingly spared in Alzheimer's — it depends on medial prefrontal and motor circuits rather than the hippocampal system, and singing along is procedural rather than declarative, so the words arrive as motor sequence and not as retrieval. Music-evoked autobiographical memory reliably reaches episodic content no verbal cue can touch, and produces genuine mood elevation independently of any recall at all. Two distinct uses live here: music as the activity (M-56, M-57, M-59, M-60, M-61) and music as a *pre-cue* (M-58), where period music reinstates the encoding context so that the photograph that follows lands in a prepared mind. The universal hazard is that music is a blunt emotional instrument — a first dance or a funeral hymn finds the grief first, with no warning and no operator present.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-56** | Your Song | Thirty seconds of a song from his late teens plays, and he can sing, tap, dance, cry, or say nothing at all. | scientist (The Song That Was Ours), reminiscence (Your Song) | **None** (derivable from birth year); Low if the family names songs. *Licensing is the hard part, not the code.* | — |
| **M-57** | The Wireless | A big brass dial tunes through stations — the music of their twenties, crackle between them, and now and then a family voice reading a letter, like a station announcer who happens to know them. | game, audio, ambient (Their Own Radio Station) | **None** to start; Med for family announcements and read letters | — |
| **M-58** | The Song First | Fifteen seconds of a song from when she was nineteen plays before anything appears, and only then does a photograph from that year arrive. | OT (The Song First), hybrid (The Song Opens the Door — into a blur-reveal) | Low — birth year plus loosely decade-tagged photos | — |
| **M-59** | Hum Along | A tune plays softly and when she hums or taps along, the band comes in behind her and it sounds better. | audio | None | **Mic and/or accelerometer** |
| **M-60** | The Duet | She sings a song she has known since she was nineteen with her daughter, forty miles away in a small window at the top of the screen, and the band covers whichever line either drops. | hybrid | High — a willing relative and ten scheduled minutes, repeatedly | **Live net, Cam, Mic** |
| **M-61** | The Song Everyone Knows | A song from when you were twenty plays in the lounge, the words come up huge, and whoever wants to sings. | care-home | **Low** — year of birth per resident is genuinely enough | — |

---

# F8 · Voice at a Distance

**Function.** This family does not primarily target memory; it targets loneliness, and it is the app's content supply chain. Voice carries emotional salience and social presence far better than text or photographs, and familiar voices are recognised long after faces. The reinforcement loop is a real person having heard what was said — not points, not streaks — and that is the most durable reason to come back tomorrow, precisely because it does not require the patient to remember being motivated. It also gives distant relatives a low-guilt five-minute way to participate, which is what keeps photos and clips flowing into every other family in this catalogue. Two hazards run throughout: **the empty letterbox** — no message today reads as abandonment, which is worse than never having offered — and **the liveness question**, where a recorded voice believed to be a live person produces a small bereavement that can recur daily.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-62** | The Answering Machine | A light blinks and one big button says "1 new message" — press it and hear what a granddaughter left this morning. | audio (The Answering Machine), ambient (Message Waiting — a physical box with a button), care-home (The Voice Letterbox) | **High as an ongoing habit** — 3–5 short recordings a week, sustained. Needs an evergreen fallback bank. | Props (physical button box, optional); Mic for replies |
| **M-63** | Send One Back | After she's told a story, a voice asks "shall I send that to Anne?" — and tomorrow Anne's reply is waiting. | audio (Send One Back), reminiscence (Someone Is Listening) | **High** — depends on a family member replying within ~24h, indefinitely | **Mic**, 2nd device |
| **M-64** | Recognised Today | She is told, warmly, that her granddaughter has been told she looked at the wedding photo — and next time there is a thank-you waiting. | care-home | None — derived; family opts into a digest | 2nd device |
| **M-65** | Hearts From Home | While she looks at a photo, small hearts and a name drift up the corner because her son, wherever he is, is watching along. | care-home | None — a single "send love" button on the family app | Live net, 2nd device |
| **M-66** | The Telephone | A real handset sits by the chair; lift it and someone in the family is talking about the day they got married. Put it down to end. Makes no claim to be live. | audio | Med — existing clips arranged into 2–4 minute "calls" | **Handset**, Mic (optional) |
| **M-67** | The Ringing Telephone | The phone rings with a real bell, he picks up, and his son chats — leaving natural gaps, and filling his own silences the way people do on the phone. | ambient, game (Who's on the Line?), hybrid (The Helpful Telephone — with a hint ladder built into the conversation) | High — call-shaped 45–90s recordings per relative, several variants each | **Handset**, Mic |
| **M-68** | The Empty Chair | Her son appears on the big screen and talks her through the photos he took at the beach — while the app feeds prompt cards to *his* screen ("show her the dog first"). | care-home | Med — a scheduled slot and the relative's own photos | **Live net, Cam, Mic**, 2nd device |
| **M-69** | A Hand With Someone | She sits down to a game of dominoes where the other player is her daughter, forty miles away, whose face is in a small window at the top of the table. | game | Med — a willing relative with a phone, regularly | **Live net, Cam, Mic**, 2nd device |
| **M-70** | Faces That Speak Clearly | Her son's face fills the screen, well lit and facing her, saying one short thing slowly, with the same words written huge underneath. | hybrid | Med — face-forward video in good light plus the exact words typed | — |
| **M-71** | Postbag Between Homes | A man in a care home in Glasgow has sent a photo of his shipyard, and it's on her screen this morning because her father worked in one — sometimes delivered by turning the tombola crank. | care-home (Postbag Between Homes), hybrid (A Ticket for Somebody Else) | None new — matched on existing place/occupation/era tags. **Needs an inter-home consent and moderation framework.** | Live net; Mic for replies |

---

# F9 · Orientation & Daily Function

**Function.** The outcome that matters here is not "she named 7 of 10 faces" but "she was calm when her son arrived" and "she found the bathroom." Orientation support — time, place, person — is the single most requested daily need in dementia care and is normally delivered by a stressed carer answering the same question for the ninth time; delivering it unprompted removes the humiliation of having to ask. The critical move throughout is **stripping the question**: reality-orientation boards work, but *asking* "what day is it?" is the confrontational part, so these mechanics state and never quiz. Route and task mechanics recruit procedural and visuospatial memory rather than declarative, and they rehearse the doing rather than the knowing — which is why first-person eye-height footage transfers to real walking when a plan view does not. Two structural warnings: much of this family depends on **photography of the patient's real environment** (one shared onboarding burden — build the capture flow once), and several depend on **something in the real world actually happening as promised**, where the failure mode is worse than not having the feature.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-72** | Good Morning, It Is You | At the same time each morning the tablet lights up on its own and a familiar voice says good morning, what day it is, where she is, and who is coming — then shows their faces and stops. | ambient | Med — a recorded greeting, preferred name, home place name, visitor photos, the rota | Always-on / auto-wake |
| **M-73** | The Quiet Anchor | A slow ten-second card: what day it is, what the weather is doing outside her actual window, what season it is — with a photo of her own street in that season. | OT | Low — postcode, ideally 4 seasonal photos of her own view | — |
| **M-74** | Just The One Word | In the hallway, one enormous line all day — "Today is Tuesday. Susan comes at 3." — changing only when the fact changes. | ambient | Low — the rota, or one line a day | **Always-on** |
| **M-75** | The Shipping Forecast | Every evening at the same hour, a calm formal bulletin in Shipping Forecast cadence — but the areas are the places of his life, and the report is who came today and who comes tomorrow. | wildcard | Low — 3–6 place names, the visit rota, a locale for weather | — |
| **M-76** | Who's Coming Today | A big photo of the one person visiting today, in that person's own voice — "it's me, Sarah, I'm coming at three" — repeatable as many times as she likes, and auto-playing twenty minutes before they arrive. | OT (Who's Coming Today + Warm-Up) | Med — a confirmed calendar entry, a recent face photo, a 10s clip per visitor | — |
| **M-77** | Today's Face on the Door | The photo and first name of the carer actually on shift right now, with one line in the carer's own words: "I'm Amina, I'll bring your tea at ten." | care-home / OT | Med–High — rota integration or a two-tap staff check-in, plus a photo and clip per staff member | — |
| **M-78** | The Doorbell Drill | A knock sounds and a moment later a real person from his life appears with their name and relationship spoken aloud — he just says hello. | OT | Med — 8–15 photos with a spoken name-and-relationship line, ideally in that person's voice | — |
| **M-79** | The Way to the Bathroom | A short silent first-person video at walking pace and seated eye height, from her own chair to her own bathroom door, watchable again just before she gets up. | OT (+ hybrid Two Walks, which shares one arrow-tap shell with M-82) | Med — one 15–30s phone video per route, filmed at her eye height | — |
| **M-80** | Two Doors (real doors) | Two large photographs, both real doors in the building she is standing in, and she taps the one that's the bathroom. | OT | Med — 4–8 real doorways shot from her approach angle | — |
| **M-81** | Where I'm Sleeping Tonight | A photo of her own bed with her own quilt, and her daughter's voice: "that's your room, Mum, number fourteen, along from the lounge." | OT | Low — one photo from the doorway plus one recorded orienting sentence | — |
| **M-82** | Walk Down Your Street | He moves along the street he grew up in, house by house, and says who lived where. | reminiscence (+ hybrid Two Walks) | Low — one address before ~age 25; imagery derived from street-level and archive sources | — |
| **M-83** | The Bell Cord | He sits upstairs on a bus driving in real time along a route he rode for twenty years, and when he sees his stop coming he rings the bell and the bus pulls in. | wildcard | Low — one habitual route as place names | — |
| **M-84** | Tea and Toast | She follows photos of her *own* kitchen, one step at a time, to make a cup of tea — her kettle, her mug. | OT | Med — 6–10 photos of her actual kitchen from her standing position, sequence confirmed. **Requires explicit family/OT safety sign-off.** | — |
| **M-85** | The Thing You Were Already Doing | When he picks up the teapot in the morning, a photo of the kitchen he had in 1968 appears on the counter screen — no question, no chime. | ambient, hybrid (The Tea That Remembers) | Med — photos tagged to a routine and place | **Sensor** (smart plug / PIR), 2nd screen |
| **M-86** | The Tablet Round | At the time medication is actually due, a photo of his own pill box in his own hand and a relative's voice: "morning tablets, Dad — the blue box." | OT | Low — a photo of the real dosette box, times, one prompt per slot. **Inside a clinical-safety boundary; never the only safeguard.** | — |
| **M-87** | The Room Knows You Came In | She walks into the room, the tablet notices, says hello by name, and shows whoever she saw most recently. | ambient | Low | **Sensor or Cam (presence only)** |

---

# F10 · Time, Anticipation & the Calendar

**Function.** Prospective memory — remembering to do a thing at a future time — is among the earliest and most functionally consequential capacities to fail, and it is almost entirely absent from paper-based cognitive testing. But the deeper motivational claim of this family is different: almost all of the anxiety in mild-to-moderate dementia is *not knowing what happens next*, and a single reliable externally-held commitment does more for that than any amount of retrieval practice. Serial and countdown forms manufacture anticipation, which is a motivational structure that does not require episodic memory to function — you do not need to recall the cliffhanger to feel the pull of tomorrow's episode when it arrives. The evidential third act (M-88, M-90) is the underrated move: converting an unverifiable memory claim into a recognition judgement about evidence is what repairs the "did that happen, or did I imagine it?" distress. **Every mechanic here is only as kind as the least reliable relative.**

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-88** | The Kept Promise | A small card counts down the one thing she has been told is coming — "Tom rings on Sunday" — then "Tom rings today", then "Tom rang", and the next morning eight seconds of him actually saying goodbye. | OT (The Kept Promise), hybrid (It Happened, and Here's the Proof) | **High in kind, not in volume** — one commitment a week that is genuinely kept, plus a one-button "I called" log | — |
| **M-89** | The Thing At Four O'Clock | In the morning the app says "your son is ringing at four" — and at ten past four it asks, warmly, "did he ring?" | scientist | High — depends on relatives doing what they said. *Research instrument, not daily exercise.* | Mic (optional) |
| **M-90** | Yesterday Actually Happened | "Yesterday, Margaret phoned you. You talked about the garden." — with her photo and, if she left one, eight seconds of her saying goodbye. **Absence is never displayed, only presence.** | OT | Low — a one-button contact log, used honestly | — |
| **M-91** | The Rehearsal Reel | Over the six weeks before her granddaughter's wedding, a little of it appears each day — the church, the dress, who'll be next to her — so by the day it feels like something she already knows. | OT | Med — 5–10 photos and 3–5 sentences about a real upcoming event, added progressively | — |
| **M-92** | The Bulb on the Windowsill | A relative plants a real bulb on her windowsill; every day the tablet shows one photograph of the person that bulb belongs to — and when it flowers, weeks later, that person comes. | wildcard | **High** — a real bulb and pot, 20–40 items for ONE nominated person, and a committed visit date | Props (bulb, pot) |
| **M-93** | The Serial | At the same time each day a four-minute radio drama plays the next episode of a story about her own life, opening with "previously, on Ashfield Road…" and stopping on a cliffhanger. | wildcard | **Highest authoring burden in the catalogue** — one life period broken into 15–30 episode beats, added a few at a time | — |
| **M-94** | Guess the Weight of the Cake | A cake under a glass dome at the fête, and she writes a guess — and so do her son, her granddaughter and the man from number nine, and nobody knows until Sunday. | wildcard | Med — a weekly unknowable question, and family who actually submit their own guesses | 2nd device |
| **M-95** | This Day, That Year | On an ordinary Tuesday: "seventy-one years ago today, you were married" — and the wedding photograph, and nothing asked at all. | reminiscence | Low — 3–10 dated life events with a photo each, to day-or-month precision | — |

---

# F11 · Play Forms & Luck

**Function.** These borrow the forms this generation grew up inside — card tables, dominoes, bingo halls, jigsaws, tombolas, quiz shows, market barrows — so no interaction has to be learned; the script is already owned. Two mechanisms do the work. First, **luck protects dignity**: where a die, a shuffle or a drum decides the outcome, a bad round is bad luck rather than evidence of decline, and the patient always has an honourable explanation. Second, **procedural and motor pleasure survives when episodic memory does not** — weight, snap, slide, thunk — so the hand can enjoy itself while the memory work happens sideways. Several of these are also structurally excellent hosts for clinical scheduling: an expanding-interval schedule hides completely inside a bingo caller repeating himself or a deck that keeps dealing the same faces, because repetition is already the texture of the game. No clocks, no scores against a norm, no red.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-96** | Family Snap | Cards flip one at a time and when two faces in a row are the same person he slaps the big brass bell — and the three faces the family most wants kept are the ones the deck quietly keeps dealing, at wider and wider intervals. | game (Family Snap), hybrid (Snap, With the Same Faces Coming Round) | Low — 8+ photos, 2 per person, 4+ people | — |
| **M-97** | Pairs That Stay Turned | Twelve face-down cards, and any card once turned stays face-up for the rest of the game, so the board gets easier as she goes. | game | Low–Med — 6+ photos, or better, 6 pairs of *related* images | — |
| **M-98** | Dominoes of Days | Chunky dominoes with a photo on each half, played onto the line whenever they share something — same person, same place, same decade. | game | Med — 20+ photos with at least one shared attribute each (drag into named piles) | — |
| **M-99** | Bingo of a Lifetime | A bingo card of nine pictures from her own life, a familiar voice calling them out, and she dabs until the card is full — with the caller coming back, again and again, to the one thing that matters most this month. | game (Bingo of a Lifetime), hybrid (The Caller Who Repeats Herself) | Med — 9–15 photos plus a recorded "call" each in caller's rhythm | — |
| **M-100** | Four-Piece Jigsaw | A family photograph in four big chunky pieces that leap home with a wooden clunk, until the picture is whole and the person in it says hello. | game | **Low** — one photo with a clear subject | — |
| **M-101** | Shove-Ha'penny Memory Lane | He flicks a coin up a wooden board and whichever bed it lands in opens and plays a memory — with no right or wrong place to land. | game | None — 5–9 pieces of any existing content | — |
| **M-102** | Beetle Drive | She rolls a big wooden die and each number adds another piece to a day in her life — roll a three and you get the weather, roll a five and you get who was there — until the scene assembles and someone tells the story of it. | game | Med — 5–6 tagged fragments per "day" | — |
| **M-103** | The Tombola | She turns a crank, the drum rattles, a ticket flutters out, and whatever's on it is what she gets — a song, a photo, a voice, a joke. **Also the app's navigation model for someone who cannot use menus.** | game | **None** — draws from everything already there | — |
| **M-104** | What's It Worth? | An object from her own house appears on velvet — the carriage clock, the Toby jug — she guesses what an expert would say, and the reveal is the value *and* her family's story about it. | game | Med — 5+ photos of personal objects plus a one-sentence note each | — |
| **M-105** | The Market Stall | A barrow-boy shouts his wares — and the wares are the things from her own kitchen — and when she points at one he wraps it in newspaper and hands it over. | wildcard | Med — 6–15 photographed objects she owned, plus one line each | — |
| **M-106** | The Float | He watches a fishing float on still water for as long as he likes, and every so often it dips — and when he strikes, he lands a photograph, a voice, a song. | wildcard | None | — |
| **M-107** | Signed For | A parcel arrives on screen with her name and old address on it, she signs for it with a finger, and it opens, and there is something from her life inside. | wildcard | **None** — enriched by her full name as it was written on post and one or two former addresses | — |

---

# F12 · Hands, Objects & Senses

**Function.** Everything here routes around the screen and the damaged declarative system entirely. Procedural memory is subserved by basal ganglia and cerebellum, largely spared until late stages, and is *learnable* even in dense amnesia; action observation primes the motor programme directly, so patients frequently begin a movement without being asked and without being able to say what they are doing. Object cues carry tactile and use memory that photographs cannot, and — critically — objects rarely carry the shame of not being recognised the way faces do. Olfactory cueing has unusually direct anatomical access to limbic and hippocampal structures and reaches older, more vivid, more emotional memories than any verbal or visual cue. The motivational payload is competence: this is where the man who was a joiner for 45 years gets to be someone who is good at something, which is the identity core the rest of the product is short of. The cost is hardware, and hardware in a care home gets lost, pocketed, washed, and debugged in front of residents.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-108** | Hands Remember | The screen shows the shed and the tools, and he does the thing he did ten thousand times — the same wiping motion, the same order — and his hands know it before he does. | scientist | Med — a described lifelong skill plus photos of the real objects. *A degraded simulation of a mastered skill is insulting.* | — |
| **M-109** | Hands That Knew How | He watches a short silent clip of hands doing the work he used to do — kneading, turning a lathe, casting a fly — and his own hands often start moving too. | reminiscence | **High** if family-filmed in the real place; Med from a curated library | — |
| **M-110** | The Smell of It | Carbolic soap, a coal fire, hay, Brylcreem — "can you almost smell it?" — and she is invited to describe it. | reminiscence | **None** for the imagery version (derived from birth year, region, occupation) | **Scent cartridge** for the physical variant; Mic optional |
| **M-111** | Table of Objects | Real things are laid on the table — a coin, a hairbrush, a tobacco tin — and when she picks one up the screen beside her shows the photo from her own life that matches it. | care-home | Med — photos tagged against a fixed vocabulary of ~30 props | **Props + NFC/tags** |
| **M-112** | The Keepsake That Speaks | A smooth wooden pebble by the chair; picking it up plays thirty seconds of his wife singing, and putting it down stops it. | ambient | **High** — 20–40s of very high emotional salience audio, plus a chosen physical object | **Props (instrumented object)** |
| **M-113** | In Her Own Hand | Her own recipe card, in her own handwriting, on screen — read out line by line by her daughter while she actually stirs the actual bowl. | wildcard | **High** — scans of her own handwriting, a family member reading each page, and a person physically present | Props (real ingredients); Mic optional |
| **M-114** | The Book That Knows Its Page | She turns the pages of an ordinary photo album on her lap and a voice in the room quietly tells her who is on each one. | ambient | Med–High — a printed photo book plus per-page captions; reprinting when content changes is slow and costly | **Printed book + NFC/tags** |
| **M-115** | The Weekly Card | A card arrives in the post each week with four photographs and four sentences printed large — pocketable, mantelpiece-able, showable to a visitor. | ambient | None beyond existing content, plus a postal address and printing costs | **Print/post** |

---

# F13 · Group & Care-Home Social

**Function.** Group reminiscence has the strongest evidence base of anything in the source material, and the active ingredient is largely social rather than mnemonic: recognition is easier and far less threatening when someone is beside you rather than assessing you, peers cue each other (one person's shipyard triggers another's), and turn-taking is deeply preserved procedural social behaviour. The coordinator's real KPI is durable peer relationship, not recall scores. The binding constraint on this entire family is **staff time, not tablet count** — mechanics where one staff action serves twenty residents will survive contact with a real rota; mechanics needing two simultaneously available, well-matched residents mostly will not, however clinically interesting they are. The second constraint is privacy: a life story told in a dayroom is told to strangers and staff, and the patient may not be able to consent meaningfully in the moment. Every mechanic here needs per-photo "may be shown communally" flags.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-116** | The Lounge Wall | Photos from residents' lives drift across the big screen in the lounge all afternoon, and you look up whenever you feel like it. | care-home | Low + **per-photo communal-consent flags**; 20+ photos across the home | **Always-on** big screen |
| **M-117** | Two Chairs, One Photo | You and the person opposite look at the same picture on a tablet lying flat between you, each with a big button on your own side meaning "I know this one" — or the tablet says "your turn" and you hand it sideways. | care-home (Two Chairs, One Photo; Pass the Photo) | None new; both residents enrolled and both families opted into shared viewing | — |
| **M-118** | The Kitchen Table | Two or three residents around one flat tablet take turns tapping their own portrait to tell the table about their own photograph. | reminiscence | Med — content for 2+ patients on one device, each with a portrait handle | Mic (optional) |
| **M-119** | The Placemat | She sits down in her usual chair and the tablet lying flat in front of her is already showing her own life — nobody asked her who she was. | ambient (Somebody Sat Down), hybrid (The Placemat) | Low + communal-consent flags | **NFC/tags** (chair tag, placemat, coaster) |
| **M-120** | Same Town, Same Time | A street or a factory comes up and the tablet quietly mentions that the lady across the table lived a few streets from there. | care-home | Low — place names and rough decades per resident | — |
| **M-121** | Two Hands, One Pair | She holds one half of a pair and the person opposite holds the other, and the answer only resolves when both have tapped. | care-home | Low–Med — 3+ photos of the same person across decades per resident | **2nd device or split screen**; two residents simultaneously |
| **M-122** | Life Bingo | The coordinator reads out "who worked on the railways?" to the whole lounge, and if that's you, you put your hand up and everyone claps. | care-home | **Low** — a 10-item life-facts sheet per resident, no photos needed | — |
| **M-123** | He's Behind You | A pantomime plays on the lounge screen with the family recorded as the cast, and at the moment everyone knows is coming, the whole room shouts the line. | wildcard | **High** — 2–4 relatives willing to make fools of themselves on camera. A half-hearted panto is a sad thing. | — |
| **M-124** | The Welcome Book | When you're new, the lounge screen shows a few of your photos and one thing you're proud of, and people come over and talk to you about them. | care-home | Low — a single admission form: 5 photos, a job/hometown line, one "thing to ask them about" | Always-on |
| **M-125** | The Grandchild's Errand | A visiting grandchild is given three small jobs — find out who is in this photo, get Grandma to hum this tune, take a picture of you both. | care-home | Low — 3–5 photos flagged "we'd love the story", plus a no-login guest mode | Cam, Mic (on the visitor's device) |
| **M-126** | The Handover Card | *(Staff-facing; the patient experiences only its effect.)* A carer she has never met walks in already knowing to ask her about the greenhouse. | care-home | None — generated from what landed well, plus a one-tap staff note | — |

---

# F14 · Grief, Reassurance & Sensitive Disclosure

**Function.** Deceased spouses and siblings are the most emotionally central figures in most lives; excluding them produces an app about a stranger's life. But telling someone daily that their wife has died means bereaving them daily, each time as fresh as the first, because the correction cannot be retained while the emotion can. This family exists to make that surface designed rather than accidental. The governing stance: **the app never volunteers a death, a diagnosis or a loss** — bereavement facts surface only in response to the patient reaching for them; the family sets a per-person disclosure policy (*tell gently* / *answer the feeling* / *go along*, where the comforting sentence is authored and owned by a human being, never invented by the app); lead with the emotion, then the person, then the fact if enabled; and no mechanic ever corrects a spoken false belief. Handled this way, reminiscence about the dead is consolidating rather than distressing — grief that is witnessed is easier than grief that is suppressed. Handled badly, this is the catastrophic failure surface of the whole product.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-127** | The Ones Who Are Gone | She chooses to visit a deceased loved one, and the app shows him warmly in the past tense — "Margaret, your wife, who you married in 1954" — and invites a memory, never a status update. | reminiscence | **High** — photos plus explicit family-authored framing text and a chosen disclosure posture per person | Mic (optional) |
| **M-128** | Safe Keeping | A quiet screen says "there's a recording of Jim here if you'd like to hear it" and waits — she only hears her late husband's voice if she says yes. | audio | **High** — archive audio (old video, voicemail, cassette) that many families simply do not have | — |
| **M-129** | The Standing Answer | One soft unlabelled heart button, always there; when she presses it — anxious, missing someone, not knowing where she is — she gets a warm pre-recorded answer from someone who loves her. Also available as a pebble on the arm of the chair. | OT (The Standing Answer), hybrid (The Stone That Answers) | Med–High — 3–6 clips per recurring question, authored under the disclosure policy by a named relative | Props (tangible variant) |
| **M-130** | The Grief Weather Report | *(The patient sees nothing.)* How often she reached for the lost, what she asked for, at what time of day, becomes a picture the family and clinical team can see. | OT | None — derived entirely from M-129 usage. **Surveillance of a person's grief; there is a real argument this should not exist.** | — |

---

# F15 · Invisible Layers, Schedulers & Instruments

**Function.** None of these is an exercise; each is a modifier, a scheduler or an instrument that wraps the others, and costing them as standalone mechanics will badly undervalue them. Three do mechanistic multiplication — context reinstatement before demand (M-132), temporal-gradient sequencing that opens every session in the reminiscence bump where success is near-certain (M-131), continuous demand adaptation as capacity fluctuates hour to hour (M-133). Three guarantee that a session cannot end in defeat (M-134, M-135, plus the non-verbal feedback layer M-137), which is what determines whether tomorrow happens at all. Two are pure research instruments the patient never meets (M-139, and M-138 which disguises an audiometric calibration as the tablet being fussy about itself). The sharpest ethical edge in the product lives here: continuous voice analysis of a person who cannot meaningfully consent, and silent adaptation that is unauditable — the researcher sees drift they cannot attribute to disease or to the app.

| ID | Mechanic | One line | Converged from | Content ask | Device |
|---|---|---|---|---|---|
| **M-131** | Back Along The Years | Each session starts a long way back — schooldays, courting, the first house — and walks forward through the decades, turning around invisibly before it reaches the parts that have gone. | scientist | Low — approximate years or decades on existing photos | — |
| **M-132** | The Room You Knew | Before anything is asked, the whole screen becomes the front room of the house on Ashfield Road, and it just sits there for half a minute while she settles. | scientist | Low — 1–3 photos of a place she lived | — |
| **M-133** | The Thermostat | *(She never meets this.)* How long she takes and how her voice sounds slides every question up and down the demand gradient, walking back into the deeper past whenever the present gets hard. | hybrid | None — derived from latency, prosody and touch behaviour | Mic (for the prosody input) |
| **M-134** | Fade To Rest | If she stops answering, the questions quietly stop too — pictures keep going, music softens, the screen dims to her favourite photo, and nothing more is ever asked. | ambient | None; optionally one nominated "resting photo" | — |
| **M-135** | Nothing Today | On a day she is clearly not up to it, the session becomes six photographs of people she loves, names spoken, nothing asked — and it must be invisible, with no "let's take it easy today". | OT | None — assembled from the highest-salience content already there | — |
| **M-136** | The Session That Starts Itself | Every day at four o'clock, without anyone doing anything, the tablet chimes softly and the first picture is already there. | ambient | Low — one preferred time set once | Always-on / auto-wake |
| **M-137** | The Chime | When she gets one right she hears a warm three-note phrase — nobody says "correct", nobody says "well done" — and there is a distinct, non-negative "moving on" sound so nothing is ever marked by silence. | audio | None; optionally a family-chosen "house sound" | — |
| **M-138** | Tuning In | The session opens with a familiar tune and "tell me when this is comfortable" while it slowly gets louder — a disguised audiometric and speech-in-noise calibration that adapts volume, EQ and speech rate to today's state. | audio | None | Mic (optional) |
| **M-139** | The Quiet Stopwatch | *(Nothing. She does the session exactly as before and never encounters this at all.)* Time-to-speech-onset, filled pauses, pronoun-for-noun substitution and articulation rate accrue daily at zero burden. | audio | None — derived from audio already captured | **Mic**; consent is the sharpest ethical edge in the product |

---

# Deliberately not merged

Pairs and clusters that look identical and are not. Collapsing any of these would destroy the distinction that makes one of them worth building.

| Kept apart | The distinction |
|---|---|
| **M-10** Two Pictures vs **M-12** It Doesn't Matter Which vs **M-13** Both Are Right | Identical pixels, opposite psychology. M-10 is graded and can be got wrong. M-12 abolishes correctness and *keeps the ritual* for someone who can no longer succeed — ethically loaded, a late-stage mode a family switches on knowingly. M-13 keeps the recognition signal as data in the choice distribution while removing the correctness frame from experience entirely. Different consent conversations, different failure modes, different data. |
| **M-10** Two Pictures vs **M-80** Two Doors (real doors) | Same interaction, different content domain and different outcome. M-80's targets are real doorways in the building the patient is standing in, and its win condition is finding the bathroom, not naming a face. |
| **M-11** Odd One In vs **M-17** Lost Property Office | Forced choice among alternatives (2AFC/3AFC) versus independent yes/no ownership judgements (old/new recognition with hits *and* false alarms). Different psychometrics entirely, and "is this yours?" asks for familiarity where "which is yours?" asks for comparison. |
| **M-20** The Answer First vs **M-21** Ask and Always Answer | M-20 pre-exposes the answer and withdraws it at a near-zero retention interval — errorless by construction, nothing is generated. M-21 asks cold and resolves unconditionally afterward — an unassisted generation attempt with a guaranteed non-punishing resolution. One avoids error encoding; the other accepts a little of it to buy the testing effect. |
| **M-24** The Widening Gap vs **M-25** The One Sentence This Month | Target count is the active ingredient. The clinical spaced-retrieval protocol works *because* it teaches one thing; M-24 runs several faces and is a different, weaker animal. Merging them would quietly delete the discipline that carries the evidence. |
| **M-33** Finish The Sentence vs **M-34** Finish the Line vs **M-35** Complete the Saying | Three different memory systems. M-33 is personal autobiographical (family-authored, high emotional risk, high content burden). M-34 is musical-procedural. M-35 is overlearned cultural-semantic and needs no family input at all. They have different content costs, different failure modes and different session positions. |
| **M-29** Say It Back vs **M-38** Pocket Answers | Repeating a name at zero retention interval (production effect, warm-up) versus rehearsing identity sentences that must be socially usable with a stranger (functional, and dangerous if a fact goes stale). |
| **M-01** Ambient Frame vs **M-04** Living Room Channel vs **M-116** Lounge Wall | Private idle screen, hijacked television, communal display. Same content, three different device relationships and three different harms: burn-in invisibility, loss of autonomy over the one medium they still control, and broadcasting a private life to a dayroom. |
| **M-07** Winding Down vs **M-08** Night Chair vs **M-09** The Twenty Minutes | Scheduled evening ritual, staff-initiated 3am crisis response, and carer-initiated respite block with an announced ending. Same zero-demand content, three different triggers and three different people being served. |
| **M-66** The Telephone vs **M-67** The Ringing Telephone | Liveness. M-66 makes no claim to be a live call; M-67 does, and that is either the strongest social-presence mechanic in the catalogue or a daily manufactured bereavement. The ethics board rules on M-67; M-66 does not need them to. |
| **M-88** The Kept Promise vs **M-89** The Thing At Four O'Clock | M-88 never asks the patient anything. M-89 asks "did he ring?" — a prospective-memory probe that manufactures failure by design and invites a face-saving lie. Excellent instrument, bad daily exercise. |
| **M-108** Hands Remember vs **M-109** Hands That Knew How | Enactment versus action observation. One asks a man with tremor and arthritis to perform a skill he mastered; the other asks nothing and lets the motor programme prime itself. Framing differs too: "this is what you knew" versus "have a go". |
| **M-96** Family Snap / **M-99** Bingo of a Lifetime vs **M-24**/**M-25** | Snap and Bingo are genuine play mechanics that can *host* an expanding-interval schedule (the hybrid board demonstrated both), but they are not the schedule. Build the schedule once as a layer; the games remain independently valuable without it. |
| **M-46** The Season Turning vs **M-05** The Window Seat | Both use seasonal congruence. M-46 asks a question and expects speech; M-05 asks nothing and is an idle surface. One is a warm-up, the other is an off-ramp. |
| **M-72** Good Morning vs **M-73** The Quiet Anchor vs **M-74** Just The One Word | Auto-waking morning briefing in a relative's voice; a ten-second orientation card at session start; a static always-on hallway line that can be checked forty times and never changes under you. Three device roles, three trigger models. |
| **M-129** The Standing Answer vs **M-112** The Keepsake That Speaks | Both can be a pebble. M-129 answers a question ("where am I", "who is coming", "where is he") under a disclosure policy; M-112 plays high-salience audio for its own sake and answers nothing. |

---

# Cross-cutting observations for the culling board

**Roughly eight shells cover about sixty of the generated mechanics.** Two-alternative forced choice, sentence/lyric completion, blur-to-sharp reveal, vanishing cues, open-ended narration to a listening mic, asynchronous relative-voice mail, ambient photo surface, and period radio. Build each shell once and vary the dressing — but see "Deliberately not merged" before assuming a shared shell means a shared mechanic.

**The zero-input set is a complete product, not the low-value tail.** M-01, M-02, M-05, M-07, M-09, M-56, M-57, M-72, M-73, M-95, M-103, M-134, M-135 require nothing from the patient at all and constitute a usable product for late-stage users on their own.

**The two mechanics with real evidence behind them are M-24/M-25 (spaced retrieval, Camp) and M-23 (vanishing cues, Glisky).** M-56/M-57 (music) has the strongest affective evidence. Group reminiscence (F13) has the strongest evidence of any *format*.

**Foil selection is the highest-leverage difficulty control in the system** (M-10, M-11, M-13, M-16) and it is completely invisible to the patient — one dial, no interface change, full titration from ceiling to floor.

**Bereavement flags are load-bearing infrastructure, not a feature.** Almost every failure mode in the source boards is a variant of "an unflagged dead person appeared". A per-person, per-photo sensitivity flag maintained by family is a prerequisite for at least forty mechanics here, and the disclosure policy (F14) is a product-level stance, not a setting on one screen.

**Fifteen mechanics depend on something in the real world happening as promised** (M-63, M-64, M-65, M-68, M-69, M-76, M-77, M-88, M-89, M-90, M-91, M-92, M-94, M-123, M-125). Every one has a failure mode worse than not having the feature. "What happens when reality doesn't cooperate" is a first-class design problem.

**Content burden is the real cull axis.** Ranked by how likely a busy relative is to actually supply it: place names, years and birth year (trivial) → photos (they have thousands) → one-line notes (fine) → voice captions (needs a genuinely good authoring flow) → recorded bingo calls, hint ladders, three-statement rounds, sung duets, panto scenes (needs the flow to be *fun for the family*, which is its own design problem) → archive audio of the dead, the patient's own pre-diagnosis recordings, scans of their handwriting (many families will never have these at all).

**Still missing after nine boards** — for whoever runs another divergent round: touch and texture (fabric, weight, temperature); animals, which for many patients are the most emotionally salient non-human content in a life; whole-body movement (everything here is seated and manual); agitation arriving *mid-session* at ninety seconds in, as opposed to a bad day chosen in advance; and the relative who has stopped coming — every social mechanic here assumes a willing family member, several assume one who replies within 24 hours, and nobody designed for the son who has not visited since March.
