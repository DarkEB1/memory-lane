# Spaced Retrieval Therapy in Dementia + the SM-2 / FSRS Question

Research brief for the personalised memory-training pilot.
Scope: (A) clinical literature on Spaced Retrieval Training (SRT), errorless learning, vanishing cues, and the testing effect in impaired populations; (B) the technical spaced-repetition algorithm literature (SM-2, Anki, FSRS) and whether any of it transfers to a dementia population.

Written 2026-08-12. Every substantive claim below carries author/year + title + URL. Where I could not verify a detail from a primary source I say so explicitly.

Evidence grading used throughout:
**(a) proven** — replicated, RCT/meta-analytic support.
**(b) promising but underpowered** — positive signal, small n, weak designs.
**(c) plausible mechanism only** — theory or analogy, no direct evidence in this population.
**(d) disproven / no effect** — evidence exists and is null or negative.

---

## Summary (10 bullets)

1. **SRT works for what it claims to do, and only that.** It reliably teaches *specific, chosen, personally-relevant facts and cue–behaviour associations* to people with mild-to-moderate dementia, with retention from days to several months. **(a)** It does **not** slow disease progression, and no trial has ever shown that it does. **(d)**
2. **Cognitive training in mild-to-moderate dementia produces a small-to-moderate gain on global cognition (SMD 0.42, moderate-quality) versus usual care, but Cochrane found no benefit for activities of daily living, mood, or behavioural symptoms**, and only SMD 0.21 versus *active* controls. Reassuringly, it found **no evidence of increased burden or harm** to participants.
3. **Computerised cognitive training does not have evidence for preventing dementia in MCI** — Cochrane's conclusion is that available evidence "does not allow us to determine" whether it prevents dementia or maintains cognition. **(d/insufficient)**
4. **Unsupervised delivery loses roughly two thirds of the effect.** In a 2024 meta-analysis, supervised computerised training gave verbal-memory SMD 0.72 vs unsupervised 0.21; visual and working memory gains disappeared entirely when unsupervised. A home app with no human in the loop should expect the low number.
5. **Errorless learning beats errorful learning in this population, but the evidence is thin**: pooled effect 0.65 (95% CI 0.41–0.89) across 9 studies / 110 participants, with only 3 individual studies significant. **(b)** A serious critical review argues the advantage is smaller than claimed and that *effortful retrieval practice* is the more powerful ingredient.
6. **SRT is the resolution of that argument, not a side of it.** Camp's adjusted schedule is *retrieval practice titrated so that errors almost never occur* — the interval is shortened after a failure and lengthened after a success. That is why it outperforms both pure errorless drilling and unadjusted expanding schedules.
7. **The testing effect appears to survive in Alzheimer's disease.** Stamate et al. (2020) found AD patients who were trained *to the same encoding criterion* forgot at the same rate as healthy controls over one month, and both groups benefited from repeated retrieval. The deficit is primarily in **encoding**, not decay. **(b)** This directly contradicts the folk assumption that "there's no point, they'll forget it anyway."
8. **What is trainable is constrained by which memory systems survive.** Procedural/implicit memory and priming are relatively spared in aMCI and mild AD while episodic memory is the first casualty. Train personal-*semantic* facts, face–name associations, and cue–behaviour routines. Never build a mechanic that asks "what happened yesterday?" — that targets exactly the broken system and guarantees failure.
9. **SM-2's and FSRS's core assumptions fail here on nearly every axis**: they require patient self-grading (metamemory, impaired by anosognosia), they schedule at ≥1-day granularity (SRT operates at 10 s – 10 min within a session), they *drop* repeatedly-failed cards (Anki suspends a "leech" after 8 lapses — catastrophic for "my daughter's name"), they assume a stationary memory system (dementia is progressive), and their parameters are fitted to ~727 M reviews from ~10 000 self-selected, cognitively healthy Anki users.
10. **Recommendation: build a Camp-faithful two-timescale scheduler for v1, not FSRS.** It is the thing with clinical evidence, it is ~100 lines, it is auditable by a clinician, and it makes the "dose" reportable for a pilot. Log rich per-attempt telemetry so a DSR/FSRS-style model can be *fitted retrospectively* to this population later — which is a genuine research contribution nobody has made.

---

## Part A — The clinical literature

### A1. What SRT is, precisely

Spaced Retrieval Training is a direct memory intervention: the person is asked to recall a single target at progressively longer intervals, with the interval adjusted by performance.

- Origin: adapted from Landauer & Bjork's expanding-rehearsal work by Cameron Camp in 1989, who taught nursing-home residents with dementia the names and faces of their nurses. The key modification was **performance-adjusted delays**: correct recall → longer inter-trial interval; incorrect recall → immediately supply the correct answer and revert to the last successful interval. — Creighton, van der Ploeg & O'Connor (2013), *A literature review of spaced-retrieval interventions: a direct memory intervention for people with dementia*, International Psychogeriatrics 25(11):1743–1763. https://doi.org/10.1017/S1041610213001233 (record: https://www.cambridge.org/core/journals/international-psychogeriatrics/article/abs/literature-review-of-spacedretrieval-interventions-a-direct-memory-intervention-for-people-with-dementia/084A0C287F13F06E47EBEBD8A7C3D76D)
- Typical clinical interval ladder: start at 10–15 seconds, then double — 15 s, 30 s, 1 min, 2 min, 4 min, 8 min. On an error: give the right answer immediately, then re-ask at the last successful interval. If the person cannot succeed even at 15 s, the technique is judged unsuitable for them. Intervals are **filled with unrelated conversation or activity**, not silence. — Tactus Therapy, *Spaced Retrieval Training for Memory: A 'How To' Guide for Clinicians*. https://tactustherapy.com/spaced-retrieval-training-memory/ (clinical guide, not peer-reviewed; consistent with the trial protocols below)
- A published trial ladder: 45, 90, 180, 360, 720 s, 30 min/day for 5 weeks. — Jang, Lee & Yoo (2015), *Effects of spaced retrieval training with errorless learning in the rehabilitation of patients with dementia*, J Phys Ther Sci 27(9):2735–2738. https://pmc.ncbi.nlm.nih.gov/articles/PMC4616083/
- A tablet-delivered trial ladder: 0.75, 1.5, 3, 6, 12 min, with word-count escalation on two consecutive successes. — Han et al. (2017), *Efficacy of the Ubiquitous Spaced Retrieval-based Memory Advancement and Rehabilitation Training (USMART) program among patients with mild cognitive impairment: a randomized controlled crossover trial*, Alzheimer's Research & Therapy 9:39. https://pmc.ncbi.nlm.nih.gov/articles/PMC5461696/

**Design-critical observation:** every published SRT interval ladder tops out in the **minutes**, inside a single session. Cross-session spacing (days/weeks) is where maintenance data exists but is far less systematically studied. Anki/FSRS live entirely in the second regime and cannot even represent the first for review cards.

### A2. Does SRT work? Yes — narrowly. **(a)** for acquisition, **(b)** for maintenance, **(b/c)** for generalisation

- **Systematic review, semantic memory in AD**: 454 studies screened → 35 SRT studies → 12 at Level I/II evidence. SRT "had important positive effects on learning semantic information across the included studies"; concluded SRT is an effective semantic-memory technique in AD, with gaps around protocol standardisation, severity effects, maintenance and generalisation. — Oren, Willerton & Small (2014), *Effects of spaced retrieval training on semantic memory in Alzheimer's disease: a systematic review*, JSLHR. https://pubmed.ncbi.nlm.nih.gov/24023380/
- **Literature review, 34 studies incl. 3 RCTs**: SRT "can be successfully used to teach people with dementia new and previously known face- and object–name associations, as well as cue–behaviour associations." Maintenance demonstrated in 12 studies, generalisation in 6. Expected retention "from one day to several months following training." — Creighton, van der Ploeg & O'Connor (2013), as above.
- **Evidence-based practice recommendations (ANCDS/ASHA)**: 15 studies judged Class II and Class III evidence supporting SRT in dementia; findings "overwhelmingly positive" but "methodological shortcomings warrant cautious interpretation." — Hopper, Mahendra, Kim, Azuma, Bayles, Cleary & Tomoeda (2005), *Evidence-Based Practice Recommendations for Working with Individuals with Dementia: Spaced-Retrieval Training*, J Medical Speech-Language Pathology 13(4). https://apps.asha.org/EvidenceMaps/Articles/ArticleSummary/d1982e30-ffe9-42d4-bbef-880b2a299df9
- **The honest counterweight — meta-analysis, mild-to-moderate cognitive impairment**: SR "improves the learning capacity of patients with memory deficits, while evidence on its long-term effects and generalization to other untrained measures is quite inconsistent." Critically, **SR's benefit did not significantly differ from other learning techniques**, and generalisation depended on similarity between trained and untrained material. Existing evidence "remains quite scarce, mainly based on studies with moderate methodological quality." — Gámiz & González-Moreno et al. (2023), *Spaced Retrieval Effects on Learning Capacity in Patients With Mild-to-Moderate Cognitive Impairment: A Systematic Review and Meta-Analysis*, European Psychologist 28(4):225–246. https://econtent.hogrefe.com/doi/10.1027/1016-9040/a000510 (abstract accessible via https://psycnet.apa.org/record/2024-22281-001; full text was paywalled to me — author list taken from the Semantic Scholar record https://www.semanticscholar.org/paper/35797201f48964e1d48b6a55527c99132c656a2c and should be re-verified before publication)

**Read that last bullet carefully.** The strongest meta-analytic statement available is that spaced retrieval helps people learn, but *not demonstrably more than other structured learning techniques*. Our product's differentiator cannot honestly be "the spacing algorithm." It has to be the content (their own life), the adherence, and the caregiver/clinician workflow.

### A3. Worked examples of trainable content

- **Face–name, own caregivers**: 6 adults with probable AD, 6 sessions over 2 weeks; all participants extended the interval at which they could select the target photo and state the name, and **half transferred the association to the actual live person**. — Hawley & Cherry (2004), *Spaced-retrieval effects on name-face recognition in older adults with probable Alzheimer's disease*, Behavior Modification. https://pubmed.ncbi.nlm.nih.gov/14997953/ **(b)** — n=6.
- **Adjusted beats uniform**: 12 adults with probable AD, 9 sessions over 3 weeks. Adjusted (performance-contingent) spaced retrieval produced significantly more correct recall *and* significantly more transfer to the live person than a uniform expanded schedule. — Hawley, Cherry, Boudreaux & Jackson (2008), *A comparison of adjusted spaced retrieval versus a uniform expanded retrieval schedule for learning a name-face association in older adults with probable Alzheimer's disease*, J Clin Exp Neuropsychol. https://pubmed.ncbi.nlm.nih.gov/18612874/ **(b)** — n=12, but directly decision-relevant: **the interval must react to the individual's performance, not follow a fixed curve.**
- **Counter-evidence on schedule shape**: in healthy younger and older adults, expanding and equal-interval schedules both work, with **no robust advantage for expanding** after a 24 h delay. — Logan & Balota (2008), *Expanded vs. equal interval spaced retrieval practice: exploring different schedules of spacing and retention interval in younger and older adults*, Aging Neuropsychol Cogn. https://pubmed.ncbi.nlm.nih.gov/18421627/ (PDF: http://psychnet.wustl.edu/coglab/publications/Logan%20&%20Balota,%202008.pdf) — and Hochhalter et al. (2005) reportedly found no advantage for expanding retrieval over other schedules in AD (*A comparison of spaced retrieval to other schedules of practice for people with dementia*; I could not retrieve the primary record — PubMed was rate-limiting — so treat this as **unverified**: https://www.researchgate.net/publication/7761668).
  → **Implication: the magic is in the *adjustment* and in *spacing at all*, not in the expanding shape per se. Don't over-engineer the curve.**
- **Cue–behaviour and functional targets in RCTs**: SRT has been randomised for hyperphagic behaviour in residential dementia care (Kao et al., 46 intervention / 45 control, significant improvement) and for IADL outcomes. — summarised in a PCOM systematic review of three 2016–2017 RCTs, *Does Spaced Retrieval Therapy Help Improve Quality of Life for Individuals with Dementia?* https://digitalcommons.pcom.edu/pa_systematic_reviews/645/ (student systematic review — lower tier; primary trials should be pulled before citing publicly)
- **Vanishing cues** (progressively removing letter cues) enabled amnesic patients to acquire and retain *new semantic knowledge* over intervals of several months — but required far more trials than controls. — Glisky, Schacter & Tulving (1986), *Learning and retention of computer-related vocabulary in memory-impaired patients: Method of vanishing cues*, J Clin Exp Neuropsychol 8(3). https://www.tandfonline.com/doi/abs/10.1080/01688638608401320 ; critical evaluation in Thoene & Glisky and in *The method of vanishing cues: An evaluation of its effectiveness in teaching memory-impaired individuals* https://www.sciencedirect.com/science/article/abs/pii/0028393295000617
- **What is NOT trainable this way**: new *episodic* memory. Explicit/declarative memory impairment is the early hallmark of AD while procedural learning stays relatively spared until later disease. — *Procedural Learning in Individuals with Amnestic Mild Cognitive Impairment and Alzheimer's Dementia: a Systematic Review and Meta-analysis*, Neuropsychology Review (2020). https://link.springer.com/article/10.1007/s11065-020-09449-1 (author list not retrieved; verify before publication). See also the caveat that *long-term* (72 h) repetition priming **is** impaired in AD and degrades with severity, so "implicit memory is preserved" is too coarse a statement — *Implicit memory and Alzheimer's disease neuropathology* https://pubmed.ncbi.nlm.nih.gov/15975947/ and *Short- and long-term implicit memory in aging and Alzheimer's disease* https://pubmed.ncbi.nlm.nih.gov/16887792/

### A4. Errorless vs errorful — the real state of the argument

This is the single most important design question in Part A, and the literature genuinely disagrees.

**For errorless learning:**
- Meta-analysis, 9 studies, 110 participants (mean age 77), MCI and dementia: **summary effect size 0.65 (95% CI 0.41–0.89)** favouring errorless over errorful. But individual studies were significant in only 3 cases, and the authors' own conclusion is explicitly "tentative", limited by small samples and methodological issues. — Roberts, Jones & Clare (2012), *Errorless Learning in the Rehabilitation of Memory in Mild Cognitive Impairment and Dementia: A Meta-Analysis*, Non-Pharmacological Therapies in Dementia. https://research.aber.ac.uk/en/publications/errorless-learning-in-the-rehabilitation-of-memory-in-mild-cognit/ **(b)**
- Small-n AD study: "a significant advantage of EL over EF both for old and novel learning", though patients did improve under errorful conditions too, and individual-level errorless gains were not significant. Authors suggest errorless matters most for **severe** memory loss or where minimal cognitive effort is required; residual explicit memory reduces the advantage. — Metzler-Baddeley & Snowden (2005), *Brief report: errorless versus errorful learning as a memory rehabilitation approach in Alzheimer's Disease*, J Clin Exp Neuropsychol 27(8):1070–1079. https://pubmed.ncbi.nlm.nih.gov/16207625/ **(b)** — n=4.
- Balanced review: errorless learning "offers valuable benefits for at least some people with memory impairments when teaching certain types of tasks. However, the benefits are not evident for all groups, some findings are equivocal, and there are some limitations associated with this approach." — Clare & Jones (2008), *Errorless learning in the rehabilitation of memory impairment: a critical review*, Neuropsychology Review 18(1):1–23. https://pubmed.ncbi.nlm.nih.gov/18247118/
- Errorless approaches are effective for teaching **everyday tasks/skills** in dementia versus errorful or no treatment, with gains generally maintained at follow-up. — *Errorless learning of everyday tasks in people with dementia*, Clinical Interventions in Aging (2013). https://doi.org/10.2147/CIA.S46809 (paywalled to me; abstract-level claim)

**Against over-applying errorless learning:**
- A sustained critical review argues errorless learning "largely fails to capitalize on" retrieval practice, the most powerful learning principle known; that Bjork's *desirable difficulties* framework predicts effortful retrieval should win long-term; that Hunkin et al. (1998) found errorless performance *decreased* from immediate to delayed test while errorful did not; that errorless advantages appeared only on implicit-memory-style tasks (Evans et al. 2000; Riley et al. 2004) and not explicit recall; that in aphasia, errorful naming therapy showed **better** long-term retention (59% vs 47%) and generalisation (38% vs 15%); and that the actual harm from error learning "remains undemonstrated in clinical populations." Crucially it also notes that **Bier et al. (2008) found spaced retrieval in AD enabled the greatest number of patients to reach control-equivalent learning, compared with standard errorless methods.** — Middleton & Schwartz (2012), *Errorless learning in cognitive rehabilitation: A critical review*, Neuropsychological Rehabilitation 22(2):138–168. https://pmc.ncbi.nlm.nih.gov/articles/PMC3381647/

**Honest synthesis for our purposes:**
The literature does **not** establish that a wrong answer harms learning in dementia. What it establishes is (i) a modest pooled advantage for error-minimised methods **(b)**, and (ii) that adjusted spaced retrieval — which is *retrieval practice with the difficulty dialled to keep errors rare* — outperforms both rigid errorless drilling and non-adjusted schedules **(b)**.

The case for error-avoidance in *our* product is therefore **only partly cognitive and mostly affective and ethical**: repeated visible failure on the name of one's own daughter is a different event from failing a vocabulary flashcard, and the burden of proof is on anyone who wants to build failure into an intimate consumer product used unsupervised at home. Treat error-avoidance as a **safety and dignity requirement**, not as a claim about learning efficiency. That framing is defensible and does not overstate the science.

### A5. Do people with dementia forget faster? The evidence conflicts — and this matters for interval caps

- **"No"**: 40 AD patients and 42 matched controls learned short narratives **to a 70% accuracy criterion**, then were retested over one month under sparse vs frequent testing. "Alzheimer's Disease is not characterised by accelerated long term forgetting"; patients forgot at the same rate as controls. The impairment was in **encoding** (more trials needed to reach criterion), not retention. **Both groups benefited from repeated testing at one month.** — Stamate, Logie, Baddeley & Della Sala (2020), *Forgetting in Alzheimer's disease: Is it fast? Is it affected by repeated retrieval?*, Neuropsychologia 138:107351. https://doi.org/10.1016/j.neuropsychologia.2020.107351 (record: https://www.research.ed.ac.uk/en/publications/forgetting-in-alzheimers-disease-is-it-fast-is-it-affected-by-rep/ ; corrigendum: https://pubmed.ncbi.nlm.nih.gov/34749041/) **(b)** — strong design, single study.
- **"Yes"**: accelerated long-term forgetting (ALF) — normal retention at 30–60 min but abnormal loss over days to weeks — is documented in *presymptomatic* autosomal-dominant AD and preclinical sporadic AD, and is proposed as one of the earliest detectable changes. — Weston et al. (2018), *Accelerated long-term forgetting in presymptomatic autosomal dominant Alzheimer's disease: a cross-sectional study*, Lancet Neurology. https://www.thelancet.com/journals/laneur/article/PIIS1474-4422(17)30434-9/fulltext ; also *Accelerated long-term forgetting: A sensitive paradigm for detecting subtle cognitive impairment...*, Frontiers in Dementia (2023) https://www.frontiersin.org/journals/dementia/articles/10.3389/frdem.2023.1161875/full

These can be reconciled — ALF is measured in *presymptomatic/preclinical* individuals whose 30-min recall is normal, whereas Stamate matched on encoding in *diagnosed* AD — but the reconciliation is not settled. **Design consequence: do not assume a healthy forgetting curve, and do not assume a catastrophic one either. Cap long intervals conservatively and measure the actual per-item curve in our own pilot data.** That measurement is, in itself, a publishable output.

### A6. What the intervention category as a whole does and does not do

- **Cognitive training, mild-to-moderate dementia, 33 RCTs**: SMD **0.42** global cognition immediately post-treatment vs usual care (moderate-quality), verbal semantic fluency SMD 0.52, gains sustained 3–12 months; only SMD **0.21** vs active controls; **quality of evidence too low to determine any gains in mood, BPSD, or ADL capacity**; nearly all trials at high/unclear risk of selection and performance bias. **No evidence that participation increased participant burden.** — Bahar-Fuchs, Martyr, Goh, Sabates & Clare (2019), *Cognitive training for people with mild to moderate dementia*, Cochrane Database Syst Rev CD013069. https://pubmed.ncbi.nlm.nih.gov/30909318/ ; plain-language summary https://www.cochrane.org/CD013069/DEMENTIA_cognitive-training-people-mild-moderate-dementia
- **Computerised cognitive training to prevent dementia in MCI, 8 RCTs / 660 participants**: no trial even measured incident dementia; evidence very low quality; "currently available evidence does not allow us to determine whether or not computerised cognitive training will prevent clinical dementia or improve or maintain cognitive function." — Gates, Vernooij, Di Nisio et al. (2019), Cochrane CD012279. https://www.cochrane.org/evidence/CD012279_computerised-cognitive-training-preventing-dementia-people-mild-cognitive-impairment **(d/insufficient)**
- **Computerised cognitive training on memory, 35 RCTs (28 MCI n=1489; 9 dementia n=371)**: MCI verbal memory SMD 0.55 (0.35–0.74), visual 0.36 (0.12–0.60), working 0.37 (0.10–0.64). **Supervised** 0.72 / 0.51 / 0.33 vs **unsupervised** 0.21 (0.04–0.38) / 0.05 (−0.20–0.31, ns) / 0.49 (−0.09–1.06, ns). Dementia: only verbal memory significant, 0.64 (0.02–1.27), low certainty. — Chan et al. (2024), *Computerized cognitive training for memory functions in mild cognitive impairment or dementia: a systematic review and meta-analysis*, npj Digital Medicine 7:1. https://pmc.ncbi.nlm.nih.gov/articles/PMC10764827/
- **Tablet SRT in MCI, randomised crossover, 50 enrolled / 41 completers (18% dropout), 30 min twice weekly for 4 weeks**: significant on one of several memory measures, **Cohen's d = 0.49** on Word List Recall (1.12 vs 0.36 points); no significant differences on other memory measures. An occupational therapist attended sessions "for encouragement." — Han et al. (2017), Alzheimer's Res Ther 9:39. https://pmc.ncbi.nlm.nih.gov/articles/PMC5461696/ **(b)**

**Plain statement for our product copy:** There is no evidence that this class of intervention slows Alzheimer's disease, prevents dementia, preserves independence, or improves quality of life. There *is* reasonable evidence that a person with mild-to-moderate dementia can learn and retain specific chosen information, and modest evidence of small cognitive-test gains. Anything beyond that would be a lie.

### A7. What would be actively harmful or distressing

Flagged because the brief asks for it, and because some of these are easy to build by accident.

1. **Catastrophic reactions.** Sudden, excessive emotional or aggressive outbursts are a recognised feature of AD; they are precipitated by, among other things, "frustration, embarrassment, or agitation at their struggle to communicate or perform tasks they had previously performed with ease," and they "communicate the message: *this is all too much for me right now*." — *Emotional Lability, Intrusiveness, and Catastrophic Reactions* and *Agitation, Aggressive Behavior, and Catastrophic Reactions*, International Psychogeriatrics. https://www.intpsychogeriatrics.org/article/S1041-6102(24)05584-4/fulltext , https://www.intpsychogeriatrics.org/article/S1041-6102(24)04348-5/fulltext → **A daily unsupervised app that repeatedly presents unanswerable questions is a machine for generating this.**
2. **Free recall of recent episodic events** ("what did you do yesterday?", "who visited on Sunday?") targets the most impaired system and near-guarantees failure. See A3.
3. **Aggregate failure feedback**: scores, percentages, "you got 3/10", broken streaks, red X marks, "due card" backlog counts, and leaderboards. None of these exist in any SRT protocol in the literature; all of them make failure salient and cumulative.
4. **Bereavement and other painful facts.** SRT can be used to teach factual information, including facts a person repeatedly forgets. Training a person to re-learn that their spouse has died is a clinical decision with real potential to inflict repeated fresh grief; it must never be a caregiver-side free-text toggle in a consumer app. Treat this as a content-safety class requiring explicit clinical sign-off.
5. **Timers with visible countdown pressure**, and any prompt that requires the person to notice and acknowledge their own failure ("Did you get that right?" — this also requires the metamemory they may not have; see B3).
6. **Over-long sessions.** Supervised trial sessions ran 30 min; an unsupervised home session with no therapist present should be far shorter. There is no evidence supporting long daily unsupervised doses, and dropout in the one tablet RCT was 18% at 30 min twice weekly.

Note the honest counterpoint: Cochrane found **no evidence of increased participant burden** across 33 cognitive-training RCTs. But those were supervised, time-limited, and used neutral material — not photographs of the participant's own family. Our risk profile is different and unstudied.

---

## Part B — The algorithm question

### B1. What SM-2 actually is

SuperMemo 2, Woźniak (1990):
- Grades **q = 0–5** self-reported by the learner (5 perfect … 3 correct with serious difficulty … 0 complete blackout).
- Easiness factor update: `EF' := EF + (0.1 − (5−q)·(0.08 + (5−q)·0.02))`, floored at 1.3, initialised 2.5.
- Intervals: `I(1)=1 day`, `I(2)=6 days`, `I(n)=I(n−1)·EF`. Any grade < 3 **resets repetitions to I(1)**.
— https://super-memory.com/english/ol/sm2.htm

Licensing: the algorithm is published in Woźniak's 1990 Master's thesis and is universally re-implemented; the SuperMemo page carries **no explicit license grant**. Anki's own FAQ states SM-2 is "open and freely available" whereas "SuperMemo's latest algorithm is proprietary, and requires licensing," which is why Anki never adopted SM-17+. — https://faqs.ankiweb.net/what-spaced-repetition-algorithm
→ **Practical position: re-implementing SM-2 from the published description is standard practice and low risk. Do not copy SuperMemo source, do not use the SuperMemo name/marks.** (I found no affirmative license grant, so this is a risk judgement, not a legal fact — have counsel confirm before commercial launch.)

### B2. What FSRS is, and its licensing

- **DSR memory model** (Difficulty, Stability, Retrievability), descended from Woźniak's DSR and MaiMemo's DHP variant. Stability = storage strength; retrievability = current recall probability; difficulty ∈ [1,10]. Governing "laws": higher difficulty → smaller stability increase; higher stability → smaller stability increase (stabilisation decay); **lower retrievability → larger stability increase** (i.e. reviewing when you've nearly forgotten is more valuable). — https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
- **Forgetting curve.** FSRS v3: `R(t,S) = 0.9^(t/S)` (exponential). FSRS v4: `R(t,S) = (1 + t/(9S))^(−1)`, interval `I(r,S) = 9S(1/r − 1)` (power law). FSRS-6 (21 parameters): `R(t,S) = (1 + factor·t/S)^(−w₂₀)` with **trainable decay** w₂₀ and factor chosen so `R(S,S)=90%`. Interval = solve that for t at the target retention. — same source.
- **Same-day / short-term reviews are modelled from FSRS-5 onward**: `S' = S·e^(w₁₇(G−3+w₁₈))`, and in FSRS-6 `S' = S·e^(w₁₇(G−3+w₁₈))·S^(−w₁₉)`. This is the *only* part of FSRS that lives on our within-session timescale. — same source.
- **Academic lineage**: Ye, Su & Cao (2022), *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling*, KDD'22; Su, Ye, Nie, Cao & Chen (2023), *Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory*, IEEE TKDE. Listed at https://github.com/open-spaced-repetition/fsrs4anki/wiki/Research-resources
- **Benchmark**: ~727 M reviews from ~10 000 Anki users (dataset `open-spaced-repetition/anki-revlogs-10k`); metrics RMSE(bins), log loss, AUC. FSRS-6 with recency weighting beats Anki's SM-2 for **99.6%** of users; a general-purpose RWKV neural net beats FSRS-6 on all three metrics. — https://github.com/open-spaced-repetition/srs-benchmark , https://expertium.github.io/Benchmark.html . The benchmark page explicitly flags the population caveat: these are self-selected Anki users making their own cards.

**Licensing (verify LICENSE files at integration time):**

| Component | License as reported | Consequence for us |
|---|---|---|
| `open-spaced-repetition/free-spaced-repetition-scheduler` (TS/py reference) | MIT | Safe to vendor. |
| `open-spaced-repetition/fsrs-rs` (Rust; scheduler + optimizer + memory state) | BSD-3-Clause | Safe to vendor; attribution required. |
| **Anki itself** (`ankitects/anki`) | **AGPL-3.0-or-later** (composite; some files BSD-3/MIT/Apache-2.0, docs CC BY-SA 4.0) | **Do not vendor Anki code into a hosted service.** AGPL §13 would require offering our full server source to users. |
| SM-2 algorithm description | No explicit grant; published 1990, freely re-implemented | Re-implement from the paper; don't copy SuperMemo code or branding. |
| SuperMemo SM-17+ | Proprietary, requires licensing | Out of scope. |

Sources: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler , https://github.com/open-spaced-repetition/fsrs-rs , https://raw.githubusercontent.com/ankitects/anki/main/LICENSE , https://faqs.ankiweb.net/what-spaced-repetition-algorithm

### B3. Do SM-2/FSRS assumptions hold for a dementia population? Item by item

| Assumption | Holds for dementia? | Evidence / reasoning |
|---|---|---|
| **Learner self-grades recall quality** (SM-2 q0–5; Anki Again/Hard/Good/Easy — "be strict with yourself") | **No.** | Anosognosia and metamemory impairment: AD patients are "generally less able to judge their memory abilities than healthy older adults and tend to overestimate their task performance." Anosognosia is characteristic even in prodromal AD. — *Metamemory in Alzheimer's Disease*, Cortex https://www.sciencedirect.com/science/article/abs/pii/S0010945208706968 ; *Anosognosia in Mild Cognitive Impairment...* https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8044313/ . Nuance: item-level confidence judgments may be **relatively spared** even when global self-awareness is not — *Alzheimer's disease can spare local metacognition despite global anosognosia*, Neuropsychologia (2012) https://pubmed.ncbi.nlm.nih.gov/22722068/ . Even so, asking a person with dementia to rate their own failure is affectively hostile. **Grade objectively.** Anki button semantics: https://docs.ankiweb.net/studying.html |
| **Minimum review interval ≈ 1 day**; sub-day only via learning steps | **No.** | Every SRT protocol operates at 15 s – 12 min *within* a session (A1). Anki's minimum interval for lapsed review cards defaults to 1 day and maximum interval defaults to 100 years. https://docs.ankiweb.net/deck-options.html |
| **Long intervals (weeks–months) are desirable** | **Unproven and risky.** | SRT maintenance evidence spans "one day to several months" (Creighton 2013) but is inconsistent (Gámiz et al. 2023). ALF evidence suggests day-to-week losses may be abnormal (A5). Cap intervals. |
| **Repeated failures mean the card should be dropped** (Anki: 8 lapses → tag "leech" → **suspend**; manual suggests editing/deleting/waiting) | **Categorically no.** | The highest-value items (spouse's name, own address, the safe-transfer technique) are exactly the ones most likely to lapse. https://docs.ankiweb.net/leeches.html |
| **Memory system is stationary; parameters fitted once are valid** | **No.** | Dementia is progressive; ability declines over the deployment window. FSRS has **no drift/progression term** — difficulty and stability updates assume a fixed learner. |
| **Optimise parameters per user from their own review history** | **Infeasible.** | Anki's own guidance is that FSRS optimisation needs on the order of a few hundred to >1000 reviews and should be re-run ~monthly; it warns against hand-setting parameters. A patient doing 8 items/day reaches a few hundred reviews in ~1–2 months, by which point the underlying system has changed. https://docs.ankiweb.net/deck-options.html |
| **Parameters transfer across populations** | **Unknown, probably not.** | Trained on ~10k self-selected Anki users; the benchmark page itself flags this population caveat. https://expertium.github.io/Benchmark.html |
| **Target ~90% retention (i.e. ~10% failure by design)** | **No.** | Deliberately engineering a 1-in-10 failure rate on a photo of one's own daughter is exactly the affective risk in A7. Target success ≫ 90%, and place difficulty via *cue support*, not via letting the interval run long. https://docs.ankiweb.net/deck-options.html |
| **Retrieval practice beats restudy; spacing beats massing** | **Yes — and this is the load-bearing assumption that survives.** | Stamate et al. (2020): AD patients benefited from repeated retrieval at one month. Karpicke & Roediger's testing effect and the spacing literature reviewed in Middleton & Schwartz (2012). This is why building on the SRS tradition is legitimate at all. |

### B4. What a dementia-adapted scheduler must do differently — concrete spec sketch

**Two timescales, one item.**

*Within-session (the Camp loop, seconds→minutes):* an item enters the session at its current interval rung. Rungs: `10s, 20s, 40s, 80s, 160s, 320s, 640s` (or a personalised start). Success → advance one rung. Failure → **immediately show the answer, no scoring language**, then drop back to the last rung the person succeeded at. Gaps between an item's repetitions are filled by *other items in the session* — with 6–10 items in rotation the interleaving is free and matches the clinical instruction to fill the interval with unrelated activity.

*Across-session (hours→days):* per item, keep an "attained rung" and a cross-session interval ladder: `same day, 1d, 2d, 4d, 7d, 14d`, **hard-capped** (propose 30 d ceiling globally, 7 d ceiling for tier-1 identity/safety content). Advance one step after a session where the item was recalled at its target rung without cue support; retreat one step (never below "next session") after a session where it needed cue support or failed.

**Objective grading, four inputs, no patient self-report:**
`correct ∈ {0,1}` × `cue_level ∈ {0 = free recall, 1 = partial cue (first phoneme/letter, semantic hint), 2 = 2-alternative recognition, 3 = presented/familiarity only}` × `latency_ms` × `attempt_index`. Map to an internal grade. The patient never sees, and never supplies, a grade.

**Failure is never punished, and difficulty is carried by cue level, not by interval:**
On failure, do **not** primarily lengthen or shorten time — primarily *add cue support* and re-present. This is vanishing cues run in reverse and keeps the person succeeding. Only once success at a cue level is stable does the cue vanish. This is the mechanism that lets us honour errorless-learning ethics while keeping retrieval practice (A4).

**Nothing is ever dropped.** No leech threshold, no suspend, no auto-delete. Instead a **degradation ladder** per item: free recall → cued recall → 2-choice recognition → familiarity exposure ("here's Margaret, your daughter") with no question asked at all. An item that has degraded to the bottom rung still appears — it has simply become a moment of connection rather than a test. Caregiver/clinician may retire an item; the algorithm may not.

**Tiering.** Tier 1 (core identity, safety routines, primary caregivers) has a **floor** on frequency and a **ceiling** on interval; it appears regardless of predicted retrievability. Tier 2/3 (life events, extended family, hobbies) may drift longer. This inverts Anki's economics: Anki maximises facts-retained-per-minute; we must maximise *retention of a small designated set*, and reviewing something the person already knows well is not waste here — it is a successful, pleasant experience, which has its own value.

**Progression awareness.** Because ability declines, add an explicit slow drift: if the trailing window (say 14 days) shows falling success at a fixed cue level, globally step cue support up and intervals down, and surface this to the clinician dashboard as a signal — not to the patient, ever.

**Session shape.** Cap by time and by item count; end on a success; never end on a failure. Fixed short duration beats "clear the queue" — there must be no due-count, no backlog, and skipping a day must have no visible consequence.

### B5. So: FSRS, SM-2, or neither?

**Recommendation: neither, for v1. Build the Camp loop.**

Reasoning:
1. **Evidence match.** The clinical evidence base is for exactly the adjusted expanding schedule described in A1/A3. Adopting FSRS means adopting a model fitted to a different population to solve a problem (efficiently scheduling thousands of items over years) we do not have.
2. **Every FSRS behaviour we would have to disable is a load-bearing FSRS behaviour**: self-grading, ≥1-day intervals, 90% retention target, per-user optimisation, leeches. What remains after disabling them is not meaningfully FSRS.
3. **Simplicity.** The Camp loop is a small state machine. It is auditable, explainable to a clinician and a caregiver ("she saw her granddaughter's name 6 times today, at 10 s, 20 s, 40 s, 80 s, 160 s and 320 s"), and it makes the intervention **dose** reportable — which matters enormously for user type 3 (the doctor/researcher) and for any future publication.
4. **We can still get the model.** Log every attempt with full context. After a pilot we can fit a DSR/FSRS-shaped curve *to dementia data* — which, as far as I can find, nobody has done. That is the interesting research output, and it is only available to us if we instrument properly from day one.

If a memory model is wanted later, the right move is to keep FSRS's **functional form** — power-law forgetting `R(t,S) = (1 + factor·t/S)^(−decay)` — fit population-level priors from our own cohort, use per-item Bayesian updating rather than per-user optimisation, target retention ≥0.95, cap max interval, and add a progression drift term. Use `fsrs-rs` (BSD-3) or the MIT reference implementation as a starting point; **never vendor AGPL Anki code into the server**.

---

## Evidence quality assessment

| Claim | Grade | Basis |
|---|---|---|
| People with mild-to-moderate dementia can learn and retain specific face–name, object–name and cue–behaviour targets via SRT | **(a)** | 34-study review incl. 3 RCTs; 12 Level I/II studies; ANCDS Class II/III |
| Performance-adjusted intervals > fixed/uniform expanded schedules | **(b)** | One direct comparison, n=12 (Hawley 2008); contradicted for healthy adults (Logan & Balota 2008) |
| Expanding *shape* specifically is necessary | **(c/d)** | No robust advantage over equal intervals in healthy adults; Hochhalter reportedly null in dementia (unverified) |
| Errorless > errorful in MCI/dementia | **(b)** | Pooled 0.65 (0.41–0.89), n=110, 3/9 studies individually significant; strongly contested by Middleton & Schwartz (2012) |
| Errors are *harmful* (as opposed to merely less efficient) in dementia | **(c)** | No direct evidence; Middleton & Schwartz state the harm "remains undemonstrated." Our error-avoidance rests on dignity/distress grounds, plus the catastrophic-reaction literature |
| Repeated retrieval helps at 1-month delay in AD | **(b)** | Stamate 2020, n=40+42, strong design, single study |
| Cognitive training improves global cognition in mild-moderate dementia | **(a, small)** | Cochrane SMD 0.42 vs usual care, moderate quality; 0.21 vs active control |
| Cognitive training improves ADLs / mood / QoL in dementia | **(d / insufficient)** | Cochrane: evidence too low; moderately confident of **no** gains in mood, BPSD, ADL |
| Computerised training prevents dementia in MCI | **(d / insufficient)** | Cochrane CD012279: cannot determine; no trial measured incident dementia |
| Unsupervised delivery is substantially weaker | **(b→a)** | Chan 2024: 0.21 vs 0.72 verbal memory; visual/working memory null unsupervised |
| Procedural/implicit memory is relatively spared in aMCI/mild AD | **(a, with caveats)** | Meta-analysis (Neuropsych Rev 2020); but long-delay priming is impaired and degrades with severity |
| FSRS predicts recall better than SM-2 | **(a, wrong population)** | 727M reviews, 99.6% user-level superiority — in healthy self-selected Anki users |
| FSRS parameters transfer to a dementia population | **(c)** | Never tested. No published SRS-model fit to a dementia cohort that I could find |
| A daily unsupervised autobiographical SRT app improves any clinical outcome | **untested** | No trial of this design exists. Our pilot is feasibility, not efficacy |

**Biggest weaknesses in the base literature:** tiny samples (n=4–12 is typical), single-case and pre-post designs dominating, near-total absence of blinding, heterogeneous outcome measures, publication bias likely, almost no long-term follow-up, and a meta-analytic finding that spaced retrieval is **not clearly better than other structured learning methods**.

---

## DIRECT DESIGN IMPLICATIONS

### Scheduling engine
1. **DO** implement a Camp-style adjusted expanding-retrieval loop with two timescales (within-session seconds→minutes; across-session days), as specced in B4.
2. **DO NOT** ship FSRS or SM-2 as the v1 scheduler. **DO NOT** vendor AGPL-licensed Anki code into a hosted backend. If any FSRS code is used later, prefer `fsrs-rs` (BSD-3) or the MIT reference implementation, with attribution.
3. **DO** start within-session intervals around 10–15 s and roughly double on success; on failure, immediately supply the answer and return to the last successful interval.
4. **DO** cap the maximum across-session interval hard (propose 30 days global, 7 days for tier-1 content). **NEVER** allow the 100-year style ceilings that Anki defaults to.
5. **DO** let other items in the session fill the delay between one item's repetitions — this is the clinically prescribed "filled interval" and is free with 6–10 items in rotation.
6. **DO NOT** target 90% retention. Target ≥95% *success on the exercise as presented*, achieved by adjusting cue support rather than by letting intervals run long.
7. **DO** carry difficulty in a **cue ladder** (free recall → partial cue → 2-choice recognition → familiarity exposure), and vanish cues gradually as success stabilises.
8. **DO** add a slow progression-drift adjustment (trailing 14-day success at fixed cue level → global cue-up / interval-down), and surface that trend **only** to caregiver and clinician.

### Grading and failure
9. **NEVER** ask the patient to rate their own recall. No Again/Hard/Good/Easy, no "did you get that?", no confidence sliders. Grade objectively from correctness, cue level required, and latency.
10. **NEVER** show the patient a score, percentage, streak, accuracy chart, "cards due" count, red X, buzzer, or any aggregate of failure. Skipping days must carry no visible penalty and produce no backlog.
11. **NEVER** leave a failure hanging. On any miss: show/say the answer immediately, warmly, then re-present it easier and let the person succeed. **Always end a session on a success.**
12. **NEVER** implement leeches, auto-suspend, auto-delete, or any automatic removal of content. Only a caregiver or clinician may retire an item.

### Content
13. **DO** target: names and faces of family/caregivers, personal-semantic facts (address, daughter's name, grandson's job), cue–behaviour routines (use the walker, take the pill at breakfast, use the memory book), and use of external aids. These are the categories with published evidence.
14. **NEVER** build a mechanic that asks for free recall of *recent episodic* events ("what did you do yesterday?"). That targets the most impaired system and reliably produces failure.
15. **DO** prefer targets that are personal, functional, and **won't change** (clinical guidance) — a fact that changes creates re-learning conflict.
16. **DO** treat emotionally hazardous content (bereavement, diagnosis disclosure, estrangement, relocation) as a restricted class requiring explicit clinician sign-off. **NEVER** let a caregiver add "Where is Dad? — Dad died in 2019" through the ordinary content form without a warning and a review step.
17. **DO** start with 1–2 targets for a new user and expand only after observing tolerance (clinical guidance), and **DO** provide a screening step: if the person cannot succeed at the shortest interval with maximal cue support, the technique is not appropriate for them right now — say so honestly rather than degrading them daily.

### Sessions and framing
18. **DO** keep sessions short and fixed-length. Trial sessions were 30 min *with a therapist present*; unsupervised home sessions should be far shorter (5–10 min is a defensible starting point, to be validated in the pilot).
19. **DO** design a caregiver-in-the-loop mode and measure it separately — the meta-analytic difference between supervised (0.72) and unsupervised (0.21) is the single largest effect-modifier in this literature.
20. **DO NOT** claim, imply, or allow marketing copy to suggest that the app slows dementia, prevents decline, preserves independence, or improves quality of life. Honest framing: *"helps your relative keep hold of the specific names, faces and routines that matter most to your family, and gives you a shared daily moment together."* Everything beyond that is unevidenced.
21. **DO** instrument every attempt (item id, timestamp, presented cue level, correct/incorrect, latency, session position, caregiver present y/n) — this is what makes the researcher surface useful, makes the intervention dose reportable, and makes a later dementia-specific memory model possible.

---

## Open questions

1. **Interval ceilings.** Given the Stamate-vs-ALF conflict (A5), what is the longest safe cross-session interval for tier-1 content? Our own pilot data can answer this; nothing in the literature does.
2. **Does the errorless advantage hold when the content is emotionally loaded?** Every errorless-vs-errorful study used neutral material (word stems, novel names, computer vocabulary). No one has tested it on *your own daughter's name*. Assume the affective stakes are higher and design conservatively.
3. **Optimal cross-session frequency.** Trials used 2×/week (USMART, Hawley) up to daily (Jang). Daily unsupervised is untested for adherence and tolerance.
4. **Who benefits?** Severity thresholds are poorly characterised. SRT evidence is mild-to-moderate; moderate-to-severe face–name errorless work exists but is small. We need an explicit inclusion/exclusion rule and a graceful "this isn't right for you" path.
5. **Is FSRS's functional form even correct for this population?** Unknown — power-law vs exponential forgetting has never been fitted to dementia review data. Genuinely novel; requires our telemetry.
6. **Does training family faces produce anything that matters beyond the trained items** — recognition in real interactions, caregiver-relationship quality, reduced agitation? Hawley 2004 saw transfer to the live person in 3/6 participants. That is the most clinically meaningful signal in this whole literature and it is drastically underpowered.
7. **Legal/licensing confirmation** that re-implementing SM-2's published formulas carries no residual claim, and confirmation of current LICENSE files for any FSRS component actually vendored.
8. **Unverified citations to re-check before any external publication**: Hochhalter et al. (2005) schedule comparison; the author list for the Gámiz/González-Moreno European Psychologist meta-analysis; the author list for the 2020 Neuropsychology Review procedural-learning meta-analysis; the Kao et al. hyperphagia RCT (currently only via a student systematic review).
