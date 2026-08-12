# 00 — EVIDENCE SYNTHESIS (GOVERNING DOCUMENT)

**Status:** Authoritative. Supersedes the summary bullets and DO/NEVER lists of all eight domain documents where they conflict with this file.
**Compiled:** 2026-08-12. Research director synthesis of eight domain briefs plus two adversarial audits (skeptic audit + gap audit).
**Scope:** governs every downstream product, design, scheduling, data, claims and pilot decision.

---

## 0. How to read this document

The eight domain briefs are good research and bad advocacy. Their body text is generally careful; their **summary bullets and design-implication lists are systematically more confident than the sections they summarise**, and the design rules were written by the same people who wanted the product to exist. Two audits verified primary sources and found: a keystone moderator applied to a population it was never measured in, a bias-adjusted null that was never reported, four different grades for one claim across five documents, an uncited "~6-month delay in decline" that violates the corpus's own hard rule, three mis-cited references, and an entire missing axis (dementia subtype, delirium, apathy, elder abuse base rates, demand-side evidence).

**Every claim below has been re-graded once, by one person, against one rubric.** Where the audits corrected a claim, the corrected version is used. Where two documents disagreed, an adjudication is recorded with a named winner.

**Grading rubric (single, applied uniformly):**

| Grade | Meaning | Bar |
|---|---|---|
| **(a)** Proven | Replicated, adequately powered, survives sensitivity/bias adjustment, in *our* population | Meta-analysis or ≥2 independent adequately-powered RCTs |
| **(b)** Promising | Positive signal, but underpowered, single-source, secondary outcome, or wrong population | Anything that fails (a) but has a real number attached |
| **(c)** Mechanism only | Theory, analogy, qualitative, clinical consensus, or extrapolation across populations | No direct evidence in this population |
| **(d)** Tested and null / no evidence exists | Evidence exists and is null, or the question has never been measured | State which of the two it is |

Two rules that were violated across the corpus and are now binding:
1. **A secondary outcome with p≈0.02–0.04 from a trial with ~13 outcomes and no multiplicity correction is (b). Always. Regardless of whether the finding is convenient.** This regrades REMCARE's carer anxiety from (a) to (b) *and* iCST's relationship benefit stays (b).
2. **A finding measured in MCI, or in cognitively unimpaired adults, or in healthy older adults, cannot be graded above (c) for a dementia product.** Extrapolation must be labelled as extrapolation at the point of use, not in a footnote.

---

## 1. THE HARDEST TRUTHS

These are not caveats. They are the terms on which this product exists. Any board paper, spec or investor deck that omits them is misrepresenting the evidence base.

### 1.1 Every trial that closely resembles this product was null, and two of them harmed the buyer.

- **iCST** (Orrell 2017, n=356 dyads): caregiver-delivered individual cognitive stimulation at home, 75 sessions/25 weeks. ADAS-Cog MD −0.55, **p=0.45**. QoL-AD p=0.97. **22% of carers delivered zero sessions**; only 40% managed ≥2/week. https://pubmed.ncbi.nlm.nih.gov/28350796/
- **REMCARE** (Woods 2016, n=488): joint patient+carer reminiscence. Both primary outcomes null (QoL-AD p=0.53; carer GHQ-28 p=0.35). Carer anxiety up (MD 1.25, p=0.04, secondary, uncorrected). **Carers who attended more had more stress (p=0.005).** https://pmc.ncbi.nlm.nih.gov/articles/PMC4836678/
- **Online Life Story Book** (Elfrink 2021, n=42 dyads): digital multimedia life-story book, community, very mild/mild dementia. NPI **Cohen's d = −0.03**. Self-rated carer distress 38.9 → 31.8 at 3 months → **44.7 at 6 months, above baseline**, once the volunteer withdrew. https://pmc.ncbi.nlm.nih.gov/articles/PMC8443059/
- **iCST app feasibility RCT** (Rai 2021, 61 dyads): only carer EQ-5D moved. Participants exhausted the content faster than expected. https://pubmed.ncbi.nlm.nih.gov/35221680/

The competitive brief's framing — *"nobody has combined the four things we are proposing"* — is technically true and rhetorically misleading. **The honest version: the three most similar combinations were built, trialled, and failed; the fourth component (the scheduler) is the one with the least evidence in this population and the most evidence in a completely unrelated one (727M reviews from ~10,000 self-selected healthy Anki users).**

### 1.2 The core mechanic is the specific thing the evidence warns against — and the corpus's own fix guts the product.

Astell 2010 found personal family photographs produced *fewer and thinner* stories than generic period photographs, because personal items *"perform as a memory test."* Rememo's therapists explicitly rejected Who/What/Where/When formats as clinical-assessment-like. CIRCA — the one intervention here with replicated positive findings — works **because** it is deliberately generic and has no correct next item.

The corpus's proposed fix is to cap recognition items at ≤30% of a session. **That number has no source anywhere in eight documents.** And if it were enforced, the spaced-repetition engine — the technical heart, the claimed differentiator, the thing the project is named for — is relegated to under a third of the experience. The other 70% is a photo browser, which is exactly what GreyMatters, InspireD and My House of Memories shipped and could not sustain.

*Audit correction applied:* Astell 2010 is regraded **(c)** — International Journal of Computers in Healthcare, not MEDLINE-indexed, journal defunct, "two small studies" with **no stated sample size**, no statistical test, unreplicated in 16 years. It is not strong enough to veto the technical core. It **is** strong enough to make personal-vs-generic the first pre-registered A/B in the pilot.

### 1.3 The supervision effect is the strongest moderator we can name, was never measured in dementia, and is structurally unavailable to us.

Chan 2024's supervised (SMD 0.72) vs unsupervised (0.21) verbal-memory split is conducted **entirely within the MCI stratum** (19 studies n=913 vs 9 studies n=576). **The 9 dementia trials (n=371) were never stratified by supervision.** One document graded this up to (a) and built the entire caregiver-as-co-participant thesis on it.

Worse: the proposed substitute for supervision — caregiver as co-participant — is **precisely the design REMCARE tested and that raised carer anxiety, and that iCST tested and that 22% of carers refused to perform at all.** Our answer to the biggest evidential problem is the exact intervention with the field's only statistically significant harm signal.

### 1.4 The measurement thesis and the safety thesis are irreducibly opposed, and both were written as if they had won.

`outcome-measures-and-data.md` #7 requires a fixed probe set the scheduler is **forbidden to touch**, with real failure trials, or no learning-curve or practice-effect metric is interpretable. Thirteen separate design rules across the safety sections require ≥95% success, no failure state, cue escalation before failure, silent retirement on distress. **A scheduler-immune probe set is, from the patient's side, a recurring test they are guaranteed to fail more of as the disease progresses.** Nobody decided which one loses. §5.2 of this document decides it.

### 1.5 The corpus's own hard rules forbid claiming anything a family would pay for.

No cognition. No transfer. No reserve. No slowing. No prevention. No independence. No ADLs. No QoL. No persistence after stopping. No MMSE trend. No improvement chart. What remains — *"a warm shared activity built from your own life"* — is available for free from a shoebox of photographs and a Sunday afternoon. `cognitive-intervention-efficacy.md` Open Question 8 asks this directly (*"will families still adopt it, and is there an obligation to make sure they are not buying hope?"*) and **no document answers it.** It is the commercial question and it is filed under ethics.

### 1.6 The adherence arithmetic says the pilot cannot produce an efficacy signal, and the team will read one anyway.

Li 2024's threshold: effects appear only above **>60% persistence or >80% adherence**. iCST managed 40% at ≥2/week; 22% at zero. FINGER's computerised arm: **12% completion**. Open-access eHealth long-term retention: **1–7%** (Eysenbach). `outcome-measures-and-data.md` computes **356 participants per arm** to detect the active-control effect size (SMD 0.21). A feasibility pilot will produce a retention curve and a distress register. **US POINTER — where both arms improved with no no-treatment control — is the standing warning about what within-person improvement means, and it is the exact shape of result this pilot will generate.**

### 1.7 By our own regulatory analysis, the product as designed is a medical device.

MHRA places *"adapts exercises based on user responses"* at Class IIa/IIb. MDR Annex VIII Rule 11 captures software informing clinical decisions. `spaced-retrieval-and-srs.md` §B4 specifies a **progression-drift detector surfaced to a clinician dashboard**. `competitive-landscape.md` says a written regulatory opinion is needed **before** that dashboard is built. It has not been obtained; the dashboard is in the design; and the corpus's comfort — *"the framing does the regulatory work"* — is the exact reasoning FDA's 2026 General Wellness guidance forecloses by assessing intended use **objectively from marketing**, not from private intent.

### 1.8 The buyer is the only group with a statistically significant harm signal in the field's largest trial, and the design increases their load.

The caregiver is payer, content pipeline, supervision substitute, safety circuit-breaker, distress detector and adherence engine — a person with **~49% median burden prevalence**, 75.9% reporting at least mild burden, who describes technology as *"mentally they are already overburdened."* REMCARE: carer anxiety rose with attendance. Elfrink: carer distress rebounded above baseline. IN LIFE: carer workload limited intervention intensity. **Every trial that increased carer involvement increased carer cost.** The product's central design move is to increase carer involvement.

And: **52% (95% CI 46–59%) of family carers of people with dementia newly referred to mental health services report some abusive behaviour toward the person; 34% (27–40%) report important levels** (Cooper et al., https://pubmed.ncbi.nlm.nih.gov/19164392/). The ethics brief graded "family monitoring can become coercive control" as (b/c) with *"no incidence estimates."* An incidence estimate exists and it is large. **The dashboard-holder is, in roughly one case in three, already behaving abusively.** Reframing the dashboard from "accuracy trends" to "good moments" is a copy change proposed as a solution to a measured psychological effect in a population where the modal case is not benign. That is not a UI problem.

### 1.9 The app can be actively wrong — not merely unhelpful — for identifiable groups it will certainly enrol.

The eight documents are functionally an Alzheimer's-only brief. They are silent on:

- **Posterior cortical atrophy** — presenting form in ~1 in 20 people with Alzheimer's, causes *"difficulty recognising faces and objects in pictures"* and impaired spatial perception. A photo-recognition app is **contraindicated**, not merely difficult. https://www.alzheimers.org.uk/about-dementia/types-dementia/posterior-cortical-atrophy
- **Semantic-variant PPA** — destroys word and object meaning. Drilling person-knowledge is drilling exactly the system being destroyed. FTD is *"mostly diagnosed in people under 65"*, which breaks every assumption about caregiver age, work status and dependent children. https://www.alzheimers.org.uk/about-dementia/types-dementia/frontotemporal-dementia
- **Dementia with Lewy bodies** — 5% of recorded diagnoses but *"may account for up to 20% of all dementia"*; confusion varies *"from hour to hour or even over the course of a few minutes"*; visual hallucinations; REM sleep behaviour disorder; falls. **Minute-to-minute fluctuation destroys every longitudinal metric in the outcome brief** — learning-curve AUC, IIV, practice-effect slope, progression drift — and will be misread by the scheduler as decline and by any distress heuristic as disengagement. On-screen faces in DLB carry unexamined hallucination risk. https://www.alzheimers.org.uk/about-dementia/types-dementia/dementia-with-lewy-bodies-symptoms
- **Delirium** — entirely absent from all eight documents. Acute disturbance of attention and cognition over hours to days, fluctuating, precipitated by infection (incl. UTI), dehydration, constipation, pain, medication (up to 39% of cases), with dementia as the major predisposing factor. https://www.ncbi.nlm.nih.gov/books/NBK470399/ **This is the most consequential omission for a daily-telemetry product: a sudden collapse in session performance is far more likely to be delirium than progression, and delirium is a treatable medical emergency.** The corpus rule "never surface decline, never build inference" collides head-on with this.
- **Apathy** — the most prevalent neuropsychiatric symptom in dementia, a direct disease-caused predictor of not initiating any activity. It appears **nowhere** in the engagement brief, which models all non-usage as attrition, burden, gamification failure or caregiver bandwidth. If a substantial fraction of the population cannot reach Li 2024's thresholds for neurological reasons, then the power calculation is wrong, "engagement" is partly an outcome measure of the disease rather than of the product, and every nudge and reciprocity mechanic is aimed at a mechanism that is not the binding one.

### 1.10 Every strong subgroup in the evidence points away from the product's chosen shape.

| Where the evidence lives | What we are building |
|---|---|
| Reminiscence QoL benefit in **care homes** (SMD 0.46); community subgroup **null** (5 studies, n=867) | Community, at home |
| Supervised delivery (SMD 0.72 vs 0.21) — and that split is MCI-only | Unsupervised |
| CST clearest at **≥2 sessions/week with a facilitator**, in mild dementia, 45-min group | Daily, short, solo |
| Reminiscence trial dose: **~1×/week, 30–35 min, 12 weeks** | Daily 5–15 min, indefinitely |
| CIRCA works because content is **generic** with no correct answer | Personal content with a correct answer |

Four design choices, five moves away from where the evidence lives. The design-implication sections acknowledge each individually and never confront them in aggregate.

Compounding: `reminiscence-and-autobiographical.md` #31 concludes *"our best-evidenced target may be moderate dementia in a care setting with staff support, not mild dementia at home alone"* and calls it uncomfortable. `competitive-landscape.md` states flatly *"Our app targets MCI to mild dementia living at home."* Both are in the same corpus, neither cites the other, and **the product decision silently went with the one the evidence supports less.**

### 1.11 The differentiating asset is the asset that can never be moved.

Full-face photographs and voice prints are irreducible HIPAA Safe Harbor identifiers — they cannot be hashed or blurred into compliance, only removed. UK GDPR special-category rules attach on top. **US state biometric statutes (Illinois BIPA — private right of action, per-violation statutory damages; Texas CUBI; Washington) attach the moment any face detection, clustering, auto-tagging or voiceprint processing touches a family photo** — including photos of relatives who are not users and never consented. The richer and more valuable the content becomes, the less can be done with it: no research export, no model training, no sharing, no AI features without a per-person release chain. **This is a liability moat, not an equity moat**, and its ongoing cost — storage, encryption, deletion guarantees, DPIA, breach exposure over decades of family archives — is unpriced anywhere in the research.

### 1.12 There is a serious possibility that the correct product is not this one.

Follow every safety constraint the research imposes — cap test-shaped items, target ≥95% success, never let an interval run long, never drop an item, never show a grade, never ask the patient to self-rate, blend generic era content into every session, design for the carer's absence, ship a finished artefact in week one — **and what remains is CIRCA plus a music player plus a life-story book with a gentle rotation.** The spaced-repetition scheduler is simultaneously the least evidenced component, the most hazardous one, and the one the constraints progressively dissolve. That deserves an explicit decision (§5.1) rather than an implicit survival.

### 1.13 Nobody researched what people with dementia and their families actually want.

The systematic review of assistive technology and telecare adoption in dementia finds stated priorities are **safety, independence, medication reminders, communication and scheduling** — and that **memory training and reminiscence are not prominent among desired functions.** https://pmc.ncbi.nlm.nih.gov/articles/PMC9780101/ Combined with the competitive brief's own finding that reminiscence apps stall commercially, this is the most likely cause of failure and the only domain with zero research behind it. Eight documents researched how to make people use what we build; none researched whether they want it.

---

## 2. THE HONEST CLAIM

### 2.1 The strongest claim the evidence actually supports

> **Spaced retrieval training reliably teaches and helps maintain specific, chosen, personally relevant facts and face–name associations in people with mild-to-moderate Alzheimer's disease — for those items and nothing beyond them — and doing it together, from your own family's photographs and voices, is a structured shared activity that people with dementia in the one closely comparable trial rated as improving their relationship with their carer.**
>
> *We have not tested this product. Everything above is inference from adjacent trials, and the three closest trials to it were null.*

**What licenses each clause:**

| Clause | Evidence | Grade |
|---|---|---|
| SRT teaches specific chosen facts / face–name / cue–behaviour associations in mild-moderate dementia | Oren 2014 (12 Level I/II studies) https://pubmed.ncbi.nlm.nih.gov/24023380/ ; Creighton 2013 (34 studies incl. 3 RCTs); Hopper 2005 (ANCDS Class II/III) | **(a) narrow** |
| Retention "one day to several months" | Creighton 2013; maintenance in 12 studies | **(b)** |
| Repeated retrieval still helps at 1 month in AD; deficit is encoding, not decay | Stamate 2020, n=40 AD + 42 controls, matched to encoding criterion | **(b)** single strong study |
| "for those items and nothing beyond them" | Owen 2010 (n=11,430, zero transfer); Simons 2016; Kudlicka 2023 (goal attainment SMD 1.46, everything else negligible or slightly negative) | **(a)** |
| Relationship-with-carer improvement | iCST, MD 1.77 (0.26–3.28), p=0.02, **ES 0.32, secondary outcome, uncorrected** | **(b)** |
| "structured shared activity" / conversation quality | CIRCA: more initiation, more equal partners, replicated Dundee + Canada feasibility | **(b)** |
| "We have not tested this product" | No trial of a daily unsupervised autobiographical SRT app exists | **untested** |

**Note the asymmetry deliberately preserved:** the relationship claim and the carer-anxiety warning are now graded identically at (b). We do not get to promote one and demote the other.

### 2.2 Claims that are unsupportable, forbidden, or legally actionable

Every item below is banned from marketing, app-store copy, onboarding, in-app text, investor materials, the clinician surface label, and any testimonial we solicit or publish. FDA's 2026 General Wellness guidance assesses intended use **objectively from marketing**; the FTC's $2M Lumosity order and the ASA's ruling against GMRD Apps (upheld on an *implied* assessment) are the enforcement precedents.

1. Slows, delays, halts, prevents, treats, reverses or modifies dementia, Alzheimer's, MCI or cognitive decline.
2. Reduces dementia risk. (Gates 2019 Cochrane: **no trial reported incident dementia at all.** Not weak evidence — absent evidence.)
3. Builds, protects or preserves cognitive reserve. (Reserve is a lifecourse construct that works by *tolerating* pathology; Wilson 2010 shows higher reserve → **faster** post-diagnosis decline. The claim is not merely unsupported, it is backwards for our users.)
4. Preserves synapses, neurons, brain tissue or brain volume; any neuroplasticity or "use it or lose it" or "exercise for your brain" framing. (No human RCT; animal enrichment data contradictory — Lazarov 2005 vs Arendash 2004. It also implies fault.)
5. Improves memory, focus, attention, thinking, or "brain health" in general. (Owen 2010; Simons 2016.)
6. Transfers beyond the practised items.
7. Improves activities of daily living, independence, or delays institutionalisation. (Bahar-Fuchs 2019: cannot determine; Kudlicka 2023: small **negative** effect on general functional ability at follow-up.)
8. Improves quality of life. (Reminiscence QoL SMD 0.11, CI −0.12 to 0.33, **null overall**, and the **community subgroup — our population — is null**, 5 studies n=867. iCST QoL-AD p=0.97.)
9. Improves mood or reduces depression. (Bahar-Fuchs 2019: unable to determine; iCST: no improvement.)
10. Benefits persist after stopping. (Only 8/37 CST trials reported any follow-up; Maintenance CST null overall on cognition; SenseCam benefits gone at 6 months.)
11. Any MMSE, MoCA, ADAS-Cog or CDR-SB movement. (Lecanemab's 18-month effect was −0.45 CDR-SB, **below** the MCID. A memory app must not claim to move these.)
12. "Clinically proven", "clinically validated", "brain training", "cognitive enhancement", "protect their memory", "keeps Alzheimer's at bay".
13. Any improvement chart, upward trend line, or before/after comparison shown to a family.
14. Any FDA/MHRA/CE status we do not hold — including describing a *designation* as a clearance.
15. **The uncited "~6-month delay in expected decline"** that appears in `engagement-adherence-motivation.md` §7 and its evidence table. It is not in Woods 2012 CD005562, it is a cross-trial inference with no source, and it is precisely the disease-trajectory claim the corpus's own claim rule #2 forbids. **Delete on sight.**

### 2.3 Corrections to the corpus that must propagate everywhere

| Document | Was | Is now |
|---|---|---|
| cognitive-intervention #B, spaced-retrieval #A6/§4 | Supervision effect graded (b→a), drives design implication 18 | **(b), MCI only. Untested in dementia — Chan 2024 did not stratify its 9 dementia trials by supervision.** Every downstream decision resting on it is extrapolation. |
| cognitive-intervention #B | Dementia verbal memory SMD 0.64 (0.02–1.27) presented as the surviving positive signal | **Add: restricted to low-risk-of-bias studies it falls to SMD 0.23 (−0.02 to 0.49), non-significant. Authors rate certainty "low"; >half the dementia studies were at high risk of bias. Computerised cognitive training in dementia is (d/insufficient), not (b).** |
| engagement §7 + table | "Group CST ≈ ~6-month delay in decline", (a); cites superseded 2012 Cochrane | **Delete the delay clause. Use Woods 2023 CD005562: cognition SMD 0.40 (0.25–0.55), QoL SMD 0.25 (0.07–0.42), communication SMD 0.53 (0.36–0.70) high certainty. Only 8/37 trials reported follow-up — durability unknown.** |
| elder-and-dementia-hci §7.3, table, implication 55 | "11 RCTs… no differences… SMD −0.11 to 0.31", cited to "Clare & Woods", graded (d) | **Mis-attributed (it is Bahar-Fuchs, Clare & Woods 2013) and superseded. Use Bahar-Fuchs 2019 CD013069: SMD 0.42 vs passive control, 0.21 (ns) vs active control, no benefit on ADL/mood/QoL. The (d) grade and implication 55's framing both go.** |
| outcome-measures bullets 3–4, §B, implications 7–8 | BRANCH "ICC 0.94, 92–96% adherence (Papp 2023)" presented as validating our core mechanic | **Mis-cited (PMID 37971862 is Weizenbaum et al., *Neuropsychology* 2024). BRANCH validated a 7-day fixed-stimulus protocol chiefly in 181 cognitively unimpaired adults; discrimination figures rest on an MCI subsample of n=16. We share the shape but not the stimuli, population, duration or fixed schedule. Reliability must be re-established, not inherited.** |
| outcome-measures bullet 4 | Practice-effect OR 13.5 for amyloid positivity, graded "(a) Proven" | **n=27 (9 intact, 18 MCI), non-demented, no independent validation. Regrade (b).** Graded (a) in the same table that correctly demolishes a keystroke study at n=111 for in-sample validation — that double standard is now closed. |
| ethics table + bullet 7 | REMCARE carer anxiety graded (a) proven | **(b). Secondary outcome, ~13 outcomes, p=0.04, no multiplicity correction, both primaries null. Keep the design precaution — the asymmetry of harm justifies it — but stop calling it proven.** |
| cognitive-intervention bullet 1, §A | "2024 Lancet Commission update", cited to Sommerlad, *Alz&Dem* 20(Suppl 4):e085068 | **That is an AAIC conference abstract supplement, not the Commission. Cite Livingston G et al., *Lancet* 2024;404(10452):572–628 directly.** |
| cognitive-intervention §E | Woods 2018 reminiscence Cochrane, PMID 30092689, "improved QoL, cognition, communication, mood" | **Wrong PMID (30092689 is O'Philbin, *Expert Rev Neurother* — the abridged version). Cochrane CD001120 is PMID 29493789. Substantively wrong: QoL SMD 0.11 (−0.12 to 0.33) = null overall; cognition SMD 0.11 (0.00–0.23) clinically trivial; community subgroup null. Since we are a community product, the relevant subgroup result is the null one.** |
| reminiscence bullet 6, §3, implications 4/8/9 | Astell 2010 personal-worse-than-generic as "central threat", vetoes the core mechanic; ≤30% recognition cap | **Regrade (c): unindexed defunct journal, n unreported, no statistical test, unreplicated in 16 years. Becomes a pre-registered pilot A/B, not a design law. The ≤30% cap has no source and is deleted as a rule (see §4, P11 for what replaces it).** |
| competitive bullet 8, §Privacy, §Product/UX | "Existing app estate is bad on privacy — our clearest competitive advantage"; "DO use tablets, 61% of researched apps did" | **Category error. Ye 2023 reviewed 50 apps described in 44 *academic studies*. Whether a paper discusses security is a property of the paper. No competitor privacy policy was read anywhere in this corpus. Any privacy differentiation claim is currently unevidenced. The tablet justification is research-methodology popularity used circularly — replaced by the ergonomic evidence in the HCI brief.** |
| Errorless learning — 4 grades across 5 documents | (a) in engagement, (b) in spaced-retrieval, (d) in HCI and ethics | **Adjudicated once: (b/d). Not established as superior for learning in mild-moderate dementia. REDALI-DEM (n=161, best-powered) null. For face–name pairs specifically — our exact paradigm — spaced retrieval significantly outperformed errorless learning (Haslam 2011, JCEN 33(4), dementia subgroup n=15). Error avoidance is justified on dignity and distress grounds only.** |
| cognitive-intervention §K + implication 10; HCI §7.1 | Tiberti's 16% as "roughly one in six people with AD reacts catastrophically in that setting" → ≥95% retention target | **State exactly: per-person prevalence across a full ~45-minute clinical neuropsychological battery administered by a stranger, single centre, Buenos Aires, 1998, unreplicated at that rate. The bridging premise ("a daily home session is structurally a neuropsychological evaluation") is an assumption, not a finding, and must be labelled as one. The ≈95% target has no derivation from this number and is a judgement call.** |
| outcome-measures bullet 10 | "Cognitive testing distresses people with dementia — 70% report distress" | **70% of 154 mild-moderate AD vs 47% of 62 cognitively intact controls — excess attributable to AD ≈ 23 points. Distress tracked *perceived difficulty*, not actual performance. The design implication survives; the scare number does not.** |

---

## 3. WHAT IS ACTUALLY KNOWN — CONSOLIDATED EVIDENCE TABLE

| # | Claim | Grade | Population | Key source |
|---|---|---|---|---|
| 1 | SRT teaches specific chosen facts/face–name/cue–behaviour targets | **(a) narrow** | mild-mod dementia | Oren 2014; Creighton 2013 |
| 2 | Performance-adjusted intervals > fixed/uniform expanding | **(b)** | prob. AD, n=12 | Hawley 2008 |
| 3 | Expanding *shape* specifically is necessary | **(c/d)** | healthy + AD | Logan & Balota 2008 null; Hochhalter unverified |
| 4 | Repeated retrieval helps at 1-month delay in AD | **(b)** | AD n=40 | Stamate 2020 |
| 5 | CST improves cognition | **(a) small** | mild-mod dementia, **group, facilitated** | Woods 2023, SMD 0.40, ≈1.99 MMSE |
| 6 | CST improves communication/social interaction | **(a)** high certainty | as above | Woods 2023, SMD 0.53 |
| 7 | Cognitive training improves global cognition vs **passive** control | **(a) small** | mild-mod dementia | Bahar-Fuchs 2019, SMD 0.42 |
| 8 | …vs **active** control | **(d) null** | as above | SMD 0.21 (−0.23–0.64), ns |
| 9 | Cognitive rehabilitation improves the **specific goals trained** | **(a)** high certainty | mild-mod dementia | Kudlicka 2023, SMD 1.46 |
| 10 | …and generalises | **(d) tested, negative** | as above | negligible/slightly negative on memory, QoL, mood, function |
| 11 | Transfer to untrained/everyday cognition | **(d) tested, negative** | healthy | Owen 2010 n=11,430; Simons 2016 |
| 12 | Computerised CT helps memory in **MCI** | **(b)** | MCI n=1,489 | Chan 2024 |
| 13 | Computerised CT helps memory in **dementia** | **(d)/insufficient** | dementia n=371 | Chan 2024: SMD 0.64 → **0.23 (−0.02–0.49) after bias adjustment** |
| 14 | Supervision moderates computerised CT | **(b) — MCI only, untested in dementia** | MCI | Chan 2024, 0.72 vs 0.21 |
| 15 | Caregiver-delivered home cognitive stimulation improves cognition | **(d) tested, negative** | mild-mod dementia | iCST p=0.45 |
| 16 | Caregiver-delivered sessions improve patient-rated relationship | **(b)** | as above | iCST ES 0.32, p=0.02, secondary |
| 17 | Joint carer+patient memory work raises carer anxiety | **(b)** | as above | REMCARE MD 1.25, p=0.04, secondary, both primaries null |
| 18 | Reminiscence improves QoL — **community-dwelling** | **(d) null** | community, n=867 | Woods 2018 Cochrane subgroup |
| 19 | Reminiscence improves QoL — **care home** | **(b)** | care home, n=193 | SMD 0.46 (0.18–0.75) |
| 20 | Reminiscence improves cognition | **(d) trivial** | mild-mod | SMD 0.11 (0.00–0.23), high certainty |
| 21 | Digital life-story book improves NPI / carer distress | **(d) tested, null** | very mild/mild, community | Elfrink 2021, d=−0.03 |
| 22 | Multimedia reminiscence improves conversation equality/initiation | **(b)** | mild-mod, institutional | CIRCA, Dundee + Canada |
| 23 | Personalised reminiscence improves relationship/wellbeing | **(b)** uncontrolled | early-mod dementia | InspireD, 30 dyads, no control |
| 24 | Personal photos are **worse** prompts than generic | **(c)** | dementia, n unreported | Astell 2010 — unindexed, unreplicated |
| 25 | Familiar/self-chosen **music** is a superior AM cue in AD | **(a)** | AD | Kaiser & Berntsen 2023 |
| 26 | Music interventions reduce depressive symptoms/behaviour problems | **(a)** moderate certainty | institutional | van der Steen 2018; **no cognition effect** |
| 27 | Reminiscence bump ~ages 10–30, partially preserved in AD | **(a)** | AD | Berntsen 2022; Munawar 2018 |
| 28 | Personal **semantic** knowledge outlasts episodic autobiographical | **(a)** | AD | El Haj et al. |
| 29 | Errorless > errorful learning | **(b/d) not established** | mild-mod dementia | REDALI-DEM n=161 null; Haslam 2011 SR **>** EL for face–name |
| 30 | Errors are *harmful* (vs merely less efficient) | **(c)** | — | Middleton & Schwartz: harm "remains undemonstrated in clinical populations" |
| 31 | Catastrophic reactions occur during full neuropsych evaluation | **(b)** — per-person, full battery, 1 centre, 1998 | AD n=146 | Tiberti 1998, 16% |
| 32 | Cognitive testing distresses PwD **more than controls** | **(a)** | mild-mod AD | Lai 2008, 70% vs 47%, driven by **perceived difficulty** |
| 33 | Greater awareness of deficit predicts later depression | **(b)** longitudinal observational | MCI + AD | anosognosia literature |
| 34 | Human support raises adherence | **(a)** | adult mental health (**not dementia**) | Musiat 2022 g=0.29; Werntz 2022 |
| 35 | Effects require >60% persistence / >80% adherence | **(a)** assoc., **(c)** causal | mixed, 55 RCTs | Li 2024 |
| 36 | Massive non-usage attrition is the default | **(a)** | eHealth generally | Eysenbach 2005; Turunen 2019 (12% completion) |
| 37 | Gamification improves adherence in older adults | **(d)** | older adults | Ferreira-Brito 2025 — **control adhered better** |
| 38 | Streaks help older adults / PwD | **(c)**, harm plausible | none | no RCT exists |
| 39 | Morning > evening for **associative memory** | **(a)** | older adults, 90% CN | Sliwinski 2022, d=0.34 |
| 40 | Sundowning affects a substantial minority late in the day | **(a)** | memory clinic | Toccaceli Blasi 2023, 21.2% |
| 41 | Direct touch >> indirect input for PwD | **(a)** | mild-mod dementia | JMIR 2020, n=12, P=.01; one participant cried |
| 42 | Older adults need targets far above platform minimums | **(a)** direction, **(b)** exact mm | healthy 80+ | TATOO battery; ~17.5 mm plateau |
| 43 | Contrast sensitivity loss in AD beyond normal ageing | **(a)** | AD | replicated psychophysics |
| 44 | RT-based intra-individual variability predicts decline | **(a)** | older adults, mostly CN | Haynes 2017 (22 longitudinal studies) |
| 45 | Multi-day fixed-stimulus learning curves discriminate CU vs CI | **(b)** for our use | **cognitively unimpaired**, n=181; MCI subsample n=16 | BRANCH — stimuli/population/duration all differ from ours |
| 46 | Reduced practice effects associate with amyloid positivity | **(b)** | n=27, **non-demented** | Duff 2017, OR 13.5 |
| 47 | EMA is feasible and tolerated | **(a)** | MCI + CN | Thompson 2022, 84–86% |
| 48 | Within-person change reliability is poor | **(a)** | MCI + CN | Thompson 2022, 0.57–0.72 vs between-person 0.94–0.97 |
| 49 | MMSE/MoCA cannot be embedded | **(a)** legal | — | PAR licensing; MoCA permission page |
| 50 | Family carers report abusive behaviour toward the person | **(a)** | dementia carers newly referred, n=220 | 52% any (46–59); 34% important (27–40) |
| 51 | Caregivers are at or over capacity | **(a)** | informal carers | ~49% median burden prevalence; 75.9% ≥mild |
| 52 | Assistive tech priorities are safety/independence/reminders — **not** memory training or reminiscence | **(b)** | dementia dyads | ATT adoption systematic review |
| 53 | Brain-training claims are legally actionable | **(a)** | — | FTC v Lumos $2M; ASA v GMRD (implied assessment); ASA v Neuronix |
| 54 | Adaptive-content software informing clinical decisions is a device | **(a)** regulatory | — | MHRA Class IIa/IIb example; MDR Rule 11; FDA 2026 General Wellness |

---

## 4. DESIGN PRINCIPLES

These are binding. Each is specific enough to argue against a proposed feature. Format: **rule — because [evidence] — therefore [what it kills].**

| # | Principle | Evidence | What it forbids / requires |
|---|---|---|---|
| **P1** | **A session must terminate on a success or a warm answerable prompt. Never on a failure, never on a summary, never on a score.** | Distress after cognitive testing tracks *perceived difficulty*, not performance (Lai 2008: 70% AD vs 47% controls); catastrophic reactions are precipitated by "inability to meet expectations" (Tiberti 1998; ACHCA) | Kills end-of-session recap screens, "you got 6 of 10", and any queue that can run out mid-failure. Requires the session runtime to hold a guaranteed-success closer (a familiarity-exposure item, a favourite photo with a relative's voice) that is played whenever the last graded trial was a miss. |
| **P2** | **Difficulty is carried by cue level, never by interval length.** On any miss, add cue support and re-present at the same interval; do not primarily shorten or lengthen time. | Vanishing cues (Glisky 1986) enable retention in memory-impaired patients; adjusted spaced retrieval beat uniform expanding (Hawley 2008, n=12); FSRS/SM-2's 90%-retention target is tuned for a learner where a lapse is emotionally free | Kills any scheduler that responds to a lapse by shortening the interval and re-testing at the same difficulty. Requires a 4-rung cue ladder: free recall → partial cue → 2-alternative recognition → familiarity exposure (no question asked). |
| **P3** | **No item is ever auto-retired, auto-suspended, or auto-deleted by the algorithm. Only a human retires an item.** | Anki suspends a "leech" after 8 lapses; the highest-value items (spouse's name, own address) are precisely the ones that lapse most. Silent disappearance of a spouse from the rotation is unstudied — no document cites anything on whether a person notices or is distressed by it | Kills leech thresholds, lapse-count suspension, and "silent retirement" as an automatic safety behaviour. Requires: items degrade down the cue ladder to familiarity exposure and stay there. The **mandated safety behaviour of silent removal is itself unevidenced** and must not be implemented as an automatic rule. |
| **P4** | **The patient never supplies a grade and never sees one.** Grade objectively from `correct` × `cue_level` × `latency` × `attempt_index`. | Anosognosia is characteristic even in prodromal AD; AD patients "tend to overestimate their task performance" (*Cortex*, Metamemory in AD). Asking a person to rate their own failure is affectively hostile regardless | Kills Again/Hard/Good/Easy, confidence sliders, "Did you get that?", and the HCI brief's proposed *"I knew that / Show me again"* self-report grading (implication 29) — which is the corpus's own single biggest unvalidated assumption (HCI Open Question 2). Self-report may be offered as a *navigation* affordance but must not feed the scheduler. |
| **P5** | **No aggregate of failure is ever rendered to the patient or the caregiver: no score, percentage, accuracy chart, declining trend, streak, due-count, or backlog.** | Awareness of deficit longitudinally predicts onset of depression at ~16 months (anosognosia literature); REMCARE authors named "disappointment when improvements did not persist" as a probable carer-harm mechanism; Elfrink's carer distress rose *above baseline* at 6 months | Kills the caregiver progress dashboard as normally conceived. Requires the caregiver surface to report **events and moments** ("she talked for two minutes about the Elm Street house"), plus **actions** ("retire this item", "add more from the 1950s"). |
| **P6** | **Skipping has no consequence. There is no backlog, no catch-up, no missed-day counter, no guilt message.** | No RCT evidence on streaks in older adults, none in dementia; the mechanism that makes streaks work (loss aversion over a possession) punishes symptom expression in a progressive illness; guilt is longitudinally associated with caregiver depressive symptoms | Kills streaks, "don't break your chain", "[Patient] hasn't practised in 5 days", and any due-queue that grows. Requires a non-resetting cumulative count at most ("you've shared 43 memories together"). |
| **P7** | **Adherence is defined on a flexible window ("this week"), never a deadline ("today by 6pm").** | Segment adherence 78.8% and *stable* (87.9–97.0%) vs subsegment adherence 60.6% *decaying* (93.9% → 72.7%) across a year, same participants, same protocol (PMC10571616) | The cheapest single adherence win available. Kills daily-deadline notifications. |
| **P8** | **Sessions default to mid-morning and are hard-blocked from prompting after 16:00 without explicit caregiver override.** | Associative memory — exactly what we train — is ~10% worse in the evening (d=0.34, Sliwinski 2022); synchrony effect in ~83% of older-adult studies; 21.2% of memory-clinic patients sundown with agitation (56%), irritability (54%), anxiety (46%) | Kills evening engagement pushes and "catch up before bed" nudges. |
| **P9** | **The patient surface accepts single tap only, on targets ≥20 mm with ≥8 mm dead space, in the central 50% of the screen, with multi-touch suppressed.** | Double-tap took 18.2 s vs 8.4 s in 80+ adults with 3× the off-target errors; prior smartphone experience did **not** rescue performance; rotate is unlearnable; indirect input caused a participant to cry and the experiment to be stopped (JMIR 2020, n=12, P=.01); edge targets need ~2× the area (2.3 cm vs 1.1 cm) | Kills swipe, long-press, pinch, drag, double-tap, dwell-to-select, hamburger menus, drop-downs, modals, scrolling on the patient surface, and mouse/controller/HMD input entirely. |
| **P10** | **The patient UI is frozen. No layout, wording, icon, colour or position change after a participant is enrolled. No A/B testing on the patient surface, ever.** | Interface learning in dementia is procedural, and procedural memory encodes motor sequences bound to spatial positions; ~half of early-stage dementia participants used a tablet independently over 7 days and **no baseline trait predicted who** (Lim 2013) | Kills progressive disclosure, feature flags, seasonal theming, and every growth experiment on the patient side. Requires pinning each participant to a UI version for the study duration. |
| **P11** | **Every session opens and closes with generic, era-and-locale-matched content that has no correct answer; personal retrieval items sit in the middle.** | CIRCA — the only replicated positive finding in this neighbourhood — works *because* content is generic with hyperlinked random access and no correct next step; Astell 2010 (c) suggests personal items "perform as a memory test" | This **replaces the unsourced ≤30% recognition cap**. It is a session-shape rule, not a ratio, and it is falsifiable in the pilot. Requires a generic content library matched to birth cohort and locale — which is a build cost the corpus never priced. |
| **P12** | **Answer-first presentation is the default for tier-1 identity content: show photo + name + relationship + one sentence, then invite elaboration.** | Personal *semantic* knowledge outlasts episodic autobiographical memory in AD (El Haj); therapy staff explicitly rejected Who/What/Where/When formats as clinical-assessment-like (Rememo); Middleton & Schwartz find harm from errors "undemonstrated" but the affective stakes here are not neutral | Kills the naive "Who is this?" flashcard as the default interaction. Does **not** kill retrieval practice — retrieval remains available at lower cue levels once success at a given rung is stable. |
| **P13** | **Never build a mechanic requiring free recall of recent episodic events.** | Episodic memory is the first casualty in AD while personal-semantic knowledge is preserved longer; recent content has the worst yield and the highest failure risk | Kills "what did you do yesterday?", "who visited on Sunday?", and any recency-based quiz. Recent photos are permitted as **passive review only** (SenseCam), never as recognition items. |
| **P14** | **Content is biased to the reminiscence bump (ages 10–30), positive valence, culturally-scripted first-time events; language is a per-item attribute, not an app setting.** | Bump concentrates at ages 6–30 in AD and is partially preserved; "only positive events increased between ages 15–30" — the bump is a *positivity* phenomenon; music cues peak at 15–24; cultural life scripts are culture-specific and in immigrants "events prior to migration were more frequently recalled in Spanish, whereas events after migration were more frequently recalled in English" (Munawar 2018) | Requires `content_language` per item, first-language reversion support, TTS/ASR language coverage, RTL and non-Latin scripts. Without this the pilot silently selects for monolingual English speakers — the same generalisability failure the outcome brief criticises in BRANCH. |
| **P15** | **Music is a first-class content type, self-chosen by the person, not a nice-to-have.** | In AD, music-evoked autobiographical memories beat picture-evoked ones: specific, fast, low-effort, predominantly positive (Kaiser & Berntsen 2023, 15 clinical studies); self-chosen beats researcher-selected; music interventions probably reduce depressive symptoms (Cochrane, moderate certainty) — with **no cognition effect** | Requires music in the content model from v1. Forbids claiming music as a cognitive intervention. |
| **P16** | **Every person in the content library carries `living / deceased / estranged / do-not-show`, and deceased-person content defaults to OFF for recognition mechanics.** | Disclosure of spousal death to a person with dementia: 18.4% worsening BPSD, 26.0% worsening depression (Kato 2023, n=508 care managers). Because the memory does not consolidate, **each disclosure is experienced as fresh loss** — and a spaced-repetition engine is the mechanism by which this becomes systematic | Kills any content-entry flow that does not force this field. Note the unresolved distinction (ethics Open Q6): the evidence concerns *disclosure of death*, not *seeing the face*. Provisional rule: **allow the face and the voice; never the death; never a question whose correct answer requires knowing they are gone.** |
| **P17** | **Trauma and era-level exclusion is captured at onboarding, not per-item afterwards.** | Cochrane names PTSD as a specific risk group for reminiscence; late-onset PTSD symptoms can worsen following dementia onset; life-story work documented "sensitive information and personal disclosures emerged uninvited" | Requires era-level and theme-level blocklists (war/military service, bereavement, displacement, institutional care), not just per-item flags. |
| **P18** | **Distress ends the session immediately and makes that item an absorbing state until a human re-enables it. Distress detection is human-reported or deterministic — never an inferred emotion classifier.** | Ethics: distress must be stronger than any SRS interval logic. **EU AI Act Art. 5(1)(f) restricts emotion inference and 5(1)(b) prohibits exploiting vulnerabilities due to age or disability where behaviour is materially distorted and significant harm results — in force since 2 Feb 2025** (https://artificialintelligenceact.eu/article/5/) | Kills any ML distress/affect classifier, any camera-based emotion read, and any behaviour-shaping engagement engine tuned against a vulnerable user. Permits: a one-tap caregiver "stop, this is upsetting", a patient-side "not today", and deterministic behavioural rules logged as *behavioural events*, explicitly not as emotion inference. |
| **P19** | **No AI-generated factual content about a person's life may reach the patient without human preview and approval.** | Rememo's therapists operate a human preview-and-approve gate as standard practice. **A hallucinated fact, presented answer-first under an error-avoidant regime, would be consolidated by design** — an iatrogenic mechanism unique to this product and unexamined anywhere in the corpus | Kills auto-generated captions, auto-written prompts, and any generative "fill in the story" feature shipping without a caregiver gate. |
| **P20** | **No face detection, face clustering, auto-tagging or voiceprint processing. Ever, in any jurisdiction.** | Illinois BIPA carries a private right of action and per-violation statutory damages; Texas CUBI and Washington attach similarly; the photos contain relatives who are not users and never consented. Full-face photographs and voice prints are irreducible HIPAA Safe Harbor identifiers — they cannot be de-identified, only removed | Kills the most obvious way to reduce caregiver content-entry burden (auto-tagging faces), which is the brief's own stated *primary product risk*. This tension must be resolved by design (manual tagging with radically reduced item counts), not by shipping the classifier and hoping. |
| **P21** | **Two physically separate data planes. The content plane never appears in any research export, and no real date ever leaves the system.** | HIPAA Safe Harbor: names, all date elements finer than year, biometric identifiers including voice prints, full-face photographs. UK GDPR treats health and biometric data as special-category with pseudonymised data still personal data | Requires `day_offset_from_enrollment` (int) + `time_of_day_bucket` in place of dates; speech **features** extracted on-device with the waveform firewalled; photos represented in research only as `content_class`, `relationship_category`, `era_decade`, `caregiver_rated_valence`, `media_type`. |
| **P22** | **The patient is a first-class account holder with their own identity. The caregiver *advises*; they never assert that the patient consented.** | MCA 2005 ss.30–33: a personal consultee advises on what the person would have wanted and **cannot authorise participation**; "nothing must be done to which the participant appears to object"; CRPD Art. 12 and supported decision-making are the direction of statutory travel | Kills "patient as a profile inside the caregiver's account". Requires a three-path capacity-aware enrolment fork, dated capacity records with review dates, and re-affirmation as a first-class logged consent event on a fixed cadence. |
| **P23** | **Nothing may be observable by the caregiver that is not disclosed to the patient in the patient UI. No covert modes. Caregiver monitoring defaults to the minimum, and is removable at the patient's request.** | Family caregivers consented on the person's behalf in GPS-tracking research without considering the person's preferences; technology-facilitated coercive control uses exactly these tools. **52% of family carers of people with dementia report some abusive behaviour; 34% at important levels** (Cooper et al.) | This regrades "what happens when the caregiver IS the problem" from an edge case to a **modal case**. Kills the all-powerful single caregiver account. Requires multiple caregivers with differentiated permissions and a documented removal path. |
| **P24** | **No progression-drift detector, decline signal, or cognitive-status metric is surfaced to a clinician in v1.** | MHRA places "adapts exercises based on user responses" at Class IIa/IIb; MDR Annex VIII Rule 11 captures software providing information used for diagnostic or therapeutic decisions; FDA's 2026 guidance assesses intended use **objectively from marketing**; ASA upheld against GMRD Apps for an *implied* assessment on a Facebook ad | Kills `spaced-retrieval-and-srs.md` §B4's clinician-facing progression drift, kills any onboarding "baseline assessment", kills anything on the clinician surface that reads as a trajectory. The clinician/researcher surface ships labelled **"engagement and usage analytics for research — not a clinical assessment; not for diagnosis or treatment decisions."** Sea Hero Quest is the model. |
| **P25** | **A designed acute-change policy exists and is framed as physical illness, never as cognitive judgement.** | Delirium: acute, fluctuating, precipitated by infection/dehydration/constipation/pain/medication (up to 39% of cases), with dementia the major predisposing factor, and it is a **treatable medical emergency** (StatPearls NBK470399) | This is the one exception to "never surface change". A sudden collapse in session performance is more likely delirium than progression. Requires: a defined threshold, a named recipient (caregiver, not patient), and wording of the form *"[Name] has found the last few sessions much harder than usual. This is often caused by a physical illness such as an infection — it may be worth ringing the GP."* Never a cognitive interpretation. |
| **P26** | **Eligibility is gated by dementia *subtype*, not only by severity band.** | PCA (~1 in 20 of AD) causes difficulty recognising faces and objects in pictures — **contraindicated**. svPPA destroys word and object meaning — drilling person-knowledge drills the system being destroyed. DLB fluctuates hour to hour and minute to minute — every longitudinal metric becomes uninterpretable and the scheduler will misread fluctuation as decline | Requires a screening question set at enrolment and explicit exclusion/adaptation rules. Kills "mild-to-moderate dementia" as a sufficient inclusion criterion. |
| **P27** | **ASR never grades a response, and never determines correctness.** | No document in the corpus contains any evidence on ASR word error rates for older, dysarthric, hypophonic (DLB/Parkinsonian), aphasic or accented speakers; the acoustic-marker literature it relies on is English-corpus-biased and does not address ASR error at all | Error rates would be systematically worse for the more impaired participants — differential measurement error manufacturing a false decline signal, plus a dignity failure where the app tells someone they were wrong when the microphone was. `asr_confidence` is logged as metadata only. Grading comes from tap or from caregiver marking. |
| **P28** | **Design for the caregiver's absence. Co-presence is an optional enhancement, never a requirement, and never a prerequisite for a session to run.** | REMCARE's proposed harm mechanisms were extra work with no respite; carers who attended *more* had *more* stress (p=0.005); iCST: 22% delivered zero sessions; IN LIFE: carer workload limited intervention intensity | Kills any design where sessions cannot run without the carer sitting alongside — that is rebuilding REMCARE. Note this **directly contradicts** the supervision-effect rationale (P-note: see §1.3); we resolve in favour of the carer, because the supervision evidence is MCI-only and the carer-harm evidence is in our population. |
| **P29** | **A usable deck must be reachable in one sitting of ≤10 minutes with ≤10 items, and the first shareable artefact must exist in week one.** | Online Life Story Book required ~5 volunteer visits over 8–10 weeks and produced d=−0.03; ~49% median carer burden prevalence; evidence favours the *product* of life-story work (a book, a slideshow) over the *process* for relationship outcomes | Kills the comprehensive family-tree onboarding wizard. **And confronts the unresearched wall:** for a person whose bump falls in the 1940s–70s, the highest-yield content is on paper, in a box, undated, unlabelled. Physical photo digitisation — scanning, phone capture, glare, colour cast, orientation, missing metadata, who adjudicates identity — is the actual first-run obstacle and sits upstream of every adherence intervention proposed. |
| **P30** | **No points, badges, coins, mascots, confetti, childish illustration, or leaderboards.** | Gamification enjoyment SMD 0.34, **GRADE low**; the single study measuring adherence found the **control group adhered better**; one study found gamified cognitive training *more frustrating* than plain puzzles; gerontechnologies targeting older adults carry stigmatising symbolism | Keeps the two supported elements only: adaptive difficulty (which the scheduler already provides) and clear goals expressed as content progress. Requires: adult, plain, photographic, dignified. |
| **P31** | **Design for social role and contribution, not consumption.** | The peer-led care-home app achieved 99% step adherence with minimal staff help and significant in-session pleasure by putting the person with dementia in the *leading* role | The strongest anti-infantilisation move available: the patient tells the story, records a message back to a grandchild, chooses which album to visit. |
| **P32** | **Every design decision derived from literature must be checked against people living with dementia before the mechanic set is frozen.** | No document researched involvement methodology (DEEP network, Alzheimer Europe's EWGPWD, INVOLVE/James Lind Alliance), which is both evidence-based practice and a de facto REC/IRB and funder expectation. The ethics brief's own CRPD/supported-decision-making argument makes designing *about* rather than *with* this group hard to defend | Requires a PPI panel before the v1 mechanic freeze. Also unresearched and gating: recruitment routes (memory services, Join Dementia Research, ADRCs), consent-to-approach yields, and the well-known tendency of dementia trials to under-recruit. **Recruitment failure, not effect size, is the most common way a pilot like this dies.** |

---

## 5. THE THREE DECISIONS NOBODY MADE

### 5.1 Does the scheduler survive?

**Verdict: yes, but demoted and reframed.** The spaced-retrieval engine is retained because SRT is the only **(a)**-graded direct-memory intervention in this population, and because it makes the intervention *dose* reportable — which is what a pilot and a publication need. It is **not** retained as the differentiator, because the strongest meta-analytic statement available is that spaced retrieval helps people learn *but not demonstrably more than other structured learning techniques* (Gámiz/González-Moreno 2023).

The differentiator is therefore **the content pipeline and the consent architecture**, not the algorithm. Say that internally and stop saying "the scheduler is the moat."

Build the **Camp loop**, not FSRS or SM-2. Every FSRS behaviour we would have to disable — self-grading, ≥1-day intervals, 90% retention target, per-user optimisation, leeches — is a load-bearing FSRS behaviour, and what remains after disabling them is not FSRS. Never vendor AGPL Anki code into a hosted backend.

### 5.2 Probe set vs safety — the adjudication

**Safety wins on personal content. Measurement gets a small generic probe.**

The contradiction (§1.4) dissolves at exactly one point: **BRANCH's psychometrics were established on identical *standardised* stimuli, not personal content.** Using generic stimuli for the fixed probe is therefore *more* faithful to the precedent, not less — and it removes the "scheduled bereavement" problem entirely, because no family face is ever in the un-adapted set.

Concrete resolution:

1. The probe set is **generic, standardised, non-personal, identical across participants** (the BRANCH shape: face–name with stock faces, or an equivalent). It is the only place in the product where a real uncued failure is recorded.
2. It is **≤8 items, ≤2 minutes**, positioned mid-session, framed in patient-facing copy as a small game, never as a test.
3. **The trial records the first uncued attempt and then rescues.** A miss is logged as a miss, then cue support is added and the item is re-presented until the person succeeds. This is the engineering trick that makes P1 (terminate on success) compatible with interpretable psychometrics: *you can record a failure and still never display one.*
4. The personal deck is **fully adaptive and never used as a probe.** No family face is ever presented at a fixed difficulty for measurement purposes.
5. Any participant showing distress on the probe has the probe disabled for the remainder of the study, and that is logged as an adverse event, not as missing data.
6. Reliability is **re-established in our own cohort, not inherited**. BRANCH's ICC 0.94 (n=181 cognitively unimpaired) and d=0.83–1.30 (MCI subsample n=16) are comparators, not our numbers.

**Cost of this decision, stated plainly:** we lose per-item psychometrics on the personal content, which was the more interesting research asset. We keep a defensible learning-curve metric and a defensible distress register. That is the trade and it is the right way round.

### 5.3 Which user loses?

The three user types have genuinely opposed interests, and the documents resolve every conflict in the patient's favour on paper while the revenue depends on the other two. **The designated loser is user type 3 (the doctor/researcher), in v1.**

- The clinician surface ships with **no cognitive metric, no trajectory, no drift detector** (P24). It is engagement and usage analytics, labelled as such.
- The research plane collects everything (§7) but exports nothing that reads as clinical status.
- The regulated capability is deferred until a **written regulatory opinion exists** — which the competitive brief said must precede the dashboard and which has not been obtained.

The caregiver loses second: they get fewer automation conveniences (no face auto-tagging, P20) and a deliberately thin dashboard (P5). The patient loses nothing, which is the only defensible ordering given that they cannot leave.

---

## 6. SCHEDULER REQUIREMENTS

What a dementia-adapted scheduler must do differently from Anki. All of these are binding on the v1 engine.

1. **Two timescales, one item.** Within-session Camp loop at seconds→minutes (`10s, 20s, 40s, 80s, 160s, 320s, 640s`, personalisable start); across-session ladder at hours→days (`same day, 1d, 2d, 4d, 7d, 14d`). Anki cannot represent the first regime for review cards at all, and every published SRT interval ladder lives there.
2. **Objective grading only.** `correct ∈ {0,1}` × `cue_level ∈ {0..3}` × `latency_ms` × `attempt_index` → internal grade. No patient self-report anywhere in the loop (P4).
3. **Hard interval ceilings: 30 days global, 7 days for tier-1 identity and safety content.** Never Anki's 100-year style ceiling. Justification: the Stamate-vs-accelerated-long-term-forgetting conflict is unresolved, so assume neither a healthy nor a catastrophic curve and cap conservatively.
4. **Failure adds cue support, not interval change** (P2). On a miss: supply the answer immediately and warmly, then re-present one cue rung easier.
5. **No automatic removal.** No leech threshold, no suspend, no auto-delete (P3). Items degrade down the cue ladder to familiarity exposure and remain in rotation as moments of connection.
6. **Tiering with inverted economics.** Tier 1 (core identity, primary caregivers, safety routines) has a frequency **floor** and an interval **ceiling** and appears regardless of predicted retrievability. Anki maximises facts-retained-per-minute; we maximise retention of a small designated set, and re-showing something already known well is not waste — it is a successful, pleasant experience with its own value.
7. **Target ≥95% success on the exercise as presented**, achieved by cue support, not by interval manipulation. **Flag honestly: this number is a judgement call, not a derivation.** No published dose-response or desirable-difficulty curve exists for this population.
8. **Interleaving fills the gap.** With 6–10 items in rotation, other items naturally fill the delay between one item's repetitions — this is the clinically prescribed "filled interval" and it is free.
9. **Intervals must be able to contract, not only expand.** Off-the-shelf SM-2/FSRS assume monotonic improvement; our users' underlying retention declines, so an unmodified SM-2 pushes intervals out exactly as ability falls, guaranteeing an accelerating failure rate.
10. **A progression-drift term exists in the model but surfaces to nobody in v1.** If trailing 14-day success at a fixed cue level falls, the engine globally steps cue support up and intervals down. It does **not** notify a clinician (P24) and it does **not** notify the patient. It may inform the caregiver only through the acute-change policy (P25), and only in physical-illness framing.
11. **Fluctuation-aware, not fluctuation-blind.** DLB-band participants can vary hour to hour; the drift detector must require persistence across sessions and must not respond to a single bad day. Otherwise the scheduler manufactures decline out of Lewy-body fluctuation.
12. **Session shape is capped by time and item count, ends on a success (P1), has no due-count, no backlog, and no visible consequence for skipping.**
13. **The probe set is invisible to the scheduler.** `item_is_probe = true` items are excluded from all adaptation, all cue escalation, and all tiering (§5.2).
14. **Distress is an absorbing state stronger than any interval logic.** An item that produced distress does not return until a human re-enables it.
15. **Nothing is dropped on a caregiver's behalf.** Only a caregiver or clinician may retire an item; the algorithm may not.
16. **Log rich per-attempt telemetry so a DSR/FSRS-shaped model can be fitted retrospectively to *this* population.** Nobody has done that. It is the genuine research contribution and it is only available if we instrument from day one. If a memory model is wanted later: keep the power-law functional form `R(t,S) = (1 + factor·t/S)^(−decay)`, fit population priors from our own cohort, use per-item Bayesian updating rather than per-user optimisation, target retention ≥0.95, cap max interval, add a progression term.
17. **Licensing:** re-implement SM-2 from the published 1990 description if needed; prefer `fsrs-rs` (BSD-3) or the MIT reference implementation for any FSRS component; **never vendor AGPL-3.0 Anki code into a hosted service** (§13 would require offering full server source).

---

## 7. TELEMETRY SPECIFICATION

Per-interaction fields to log. Everything in the research plane must be exportable with zero identifiers (P21). New fields added by this synthesis are marked **†**.

### `interaction` — one row per item presentation

**Identity & context**
`interaction_id`, `session_id`, `participant_pseudonym`, `study_arm`, `phase` (baseline/intervention/withdrawal/follow-up), `app_version`, `scheduler_algorithm_version`, `content_set_version`, `scoring_rubric_version`, `patient_ui_version`**†**, `device_class`, `os_version`, `screen_css_px`, `device_pixel_ratio`, `display_refresh_hz`, `input_modality`, `day_offset_from_enrollment` (int — never a real date), `time_of_day_bucket`, `local_hour`, `session_ordinal_today`, `administered_by` (self / caregiver_assisted / caregiver_proxy — captured **per interaction**, not per session; a hard confound)

**Scheduling state**
`item_id`, `item_is_probe` (bool), `item_tier`**†** (1/2/3), `repetition_number`, `lapse_count`, `days_since_last_review`, `days_since_first_introduction`, `scheduled_interval_days`, `interval_deviation_days`, `within_session_rung`**†**, `attained_rung`**†**, `stability`, `difficulty`, `retrievability`, `predicted_recall_probability`, `drift_adjustment_applied`**†**

**Item metadata (content plane never crosses over)**
`content_class`, `relationship_category`, `era_decade`, `caregiver_rated_emotional_valence`, `caregiver_rated_importance`, `media_type`, `n_media_assets`, `cue_modality`, `content_language`**†**, `content_is_generic`**†** (bool), `person_status`**†** (living/deceased/estranged/do-not-show), `content_provenance`**†** (family_upload / generic_library / physical_scan)

**Timing (millisecond resolution, monotonic clock, started at stimulus *paint*)**
`stimulus_paint_ts_mono`, `first_input_ts_mono`, `response_commit_ts_mono`, `latency_to_first_input_ms`, `total_response_time_ms`, `decision_time_ms`, `app_backgrounded_ms`, `n_backgrounds`, `interrupted` (bool — required to exclude contaminated trials from IIV)

**Hesitation & interaction dynamics**
`n_answer_changes`, `n_taps`, `tap_hold_durations_ms[]`, `mean_tap_hold_ms`, `sd_tap_hold_ms`, `inter_key_flight_times_ms[]`, `n_backspaces`, `dwell_before_first_touch_ms`, `pointer_path_length_px`, `n_direction_reversals`, `off_target_tap_offset_px`**†** (tap coordinate minus target centre — closes HCI Open Question 1), `scroll_events`, `zoom_events`

**Response & outcome**
`correct` (bool — **first uncued attempt only** for probe items), `grade` (ordinal, system-assigned), `error_type` (omission / no_response_timeout / semantic_near_miss / phonological_near_miss / intrusion_other_person / perseveration / confabulation / wrong_but_plausible — high-value and almost nobody logs it), `response_text_hash` or coded category (**never the raw name in the research plane**)
*Removed:* `self_rated_confidence` — forbidden by P4.

**Assistance / scaffolding**
`hint_level_reached` (0 none / 1 semantic / 2 phonemic / 3 multiple choice / 4 shown answer), `n_hints`, `time_to_first_hint_ms`, `presentation_mode` (free_recall / cued_recall / recognition / familiarity_exposure), `n_distractors`, `assistance_dependency_index` (derived), `rescued_to_success`**†** (bool — did the trial terminate in a success after a miss)

**Speech-response features (features only; audio stays in the content plane)**
`utterance_duration_ms`, `speech_rate_wpm`, `articulation_rate`, `n_pauses`, `mean_pause_ms`, `max_pause_ms`, `n_filled_pauses`, `voiced_ratio`, `type_token_ratio`, `asr_confidence` (**metadata only — never used for grading**, P27), `asr_language`**†**

**Safety**
`distress_signal` (none/mild/moderate/severe), `distress_signal_source` (patient_control / caregiver_report / abandonment / repeated_skip — **never an inferred classifier**, P18), `difficulty_floor_triggered` (bool), `item_absorbing_state_entered`**†** (bool), `item_retired_by`**†** (caregiver / clinician — never `algorithm`), `retirement_reason`

### `session` — one row per session
`session_id`, `participant_pseudonym`, `day_offset_from_enrollment`, `start_ts_mono`, `duration_ms`, `planned_n_items`, `completed_n_items`, `session_end_reason` (completed / user_ended / distress_stop / timeout / app_crash / device_failure — **abandonment and device failure mean opposite things clinically and must never be indistinguishable**), `ended_on_success`**†** (bool — P1 compliance audit), `caregiver_present`, `caregiver_present_source`**†** (declared / inferred), `mood_checkin`, `sleep_quality_checkin`, `fatigue_checkin`, `enjoyability_rating`, `generic_opener_played`**†**, `generic_closer_played`**†**, `mean_rt_ms`, `median_rt_ms`, `isd_residual_rt_ms`, `cv_rt`, `accuracy`, `n_lapses`, `network_state`

### `participant` — enrolment and clinical context (research plane, no identifiers)
`participant_pseudonym`, `dementia_subtype`**†** (AD / PCA / svPPA / other-PPA / DLB / vascular / FTD-behavioural / mixed / MCI-unspecified), `severity_band`**†**, `age_band`**†** (never DOB), `years_education_band`**†**, `first_language`**†**, `country_locale`**†**, `prior_computer_use`**†** (strongest adherence predictor, Turunen 2019), `apathy_score`**†** (NPI-Q apathy item — closes the corpus's single biggest engagement blind spot), `hearing_aid_use`**†**, `corrected_vision`**†**, `capacity_status` + `capacity_review_date`**†**, `consent_pathway`**†** (direct / supported / consultee)

### `medication_and_comorbidity`**†** — recorded at enrolment and on change
`anticholinergic_burden_score`, `benzodiazepine` (bool), `antipsychotic` (bool), `sedative` (bool), `cholinesterase_inhibitor` (bool — Orrell 2014's only positive cognitive signal appeared **solely** in the AChEI subgroup), `memantine` (bool), `anti_amyloid_therapy`**†** (none / lecanemab / donanemab / other — a 2026 pilot will enrol these; infusion schedules and ARIA are confounds), `recent_infection`, `recent_hospitalisation`, `pain_reported`, `constipation_reported`, `dehydration_flag`
*Rationale: every IIV, learning-curve and practice-effect slope computed without these is confounded, and the otherwise-thorough telemetry spec had no field for any of them.*

### `clinician_assessment` — externally administered, never rendered in-app
`instrument` (MoCA / ADAS-Cog / CDR / CDR-SB / ADCS-ADL / NPI-Q / GDS-15 / CSDD / QOL-AD-self / QOL-AD-proxy), `instrument_version`, `total_score`, `subscale_scores` (jsonb), `administered_by_role`, `day_offset_from_enrollment`, `administration_setting`, `nacc_uds_form_equivalent` (mirror NACC UDS field naming — the cheapest interoperability available)

### `adverse_event` — SCRIBE item 21, first-class from day one
`event_id`, `participant_pseudonym`, `day_offset_from_enrollment`, `severity`, `category` (distress / catastrophic_reaction / bereavement_confrontation / carer_distress / acute_change_suspected_delirium**†** / other), `related_item_class`, `narrative_coded`, `action_taken`, `reported_by`, `probe_disabled_as_result`**†**

### `consent_event`**†**
`event_id`, `participant_pseudonym`, `day_offset_from_enrollment`, `event_type` (initial / reaffirmation / dissent_observed / withdrawal / capacity_change / consultee_change / purpose_change), `pathway`, `outcome`, `recorded_by`

### Derived research variables (computed, versioned, recomputable)
`multi_day_learning_curve_auc` (probe items only), `forgetting_rate_lambda`, `retention_at_1d/7d/30d`, `isd_residual_rt` (simple/complex split, residualised on session ordinal, item position and age), `cv_rt`, `ex_gaussian_tau`, `short_term_practice_effect_slope`, `assistance_dependency_index`, `error_type_proportions`, `adherence_rate` (segment-window definition), `persistence_rate`, `nonusage_attrition_curve`**†**, `dropout_attrition_curve`**†** (Eysenbach requires these separately), `qol_self_proxy_discrepancy`, `session_ended_on_success_rate`**†**, `distress_event_rate`**†**

---

## 8. SUCCESS CRITERIA

The pilot is a feasibility, safety and mechanism study. **It cannot produce an efficacy signal** (§1.6) and any efficacy claim from it must be pre-emptively forbidden in the protocol. These are the criteria by which the product should be judged.

### Tier 1 — Safety (any failure here stops the product, not just the pilot)

| # | Criterion | Measurement |
|---|---|---|
| S1 | Session-level distress events (any severity) in **<5%** of completed sessions | `adverse_event` rate ÷ `session` count, reported per participant and pooled, with exact CIs |
| S2 | **Zero** catastrophic reactions attributable to the app across the pilot | Adverse-event register, caregiver-reported, independently reviewed by the named clinical advisor |
| S3 | **≥99%** of sessions terminate on a success or a warm answerable prompt | `session.ended_on_success` — a P1 compliance audit computed from telemetry, not from intent |
| S4 | **Zero** instances of a deceased person being surfaced in a recognition mechanic without an explicit caregiver decision | Content-flag audit joined to `interaction` log; any instance is a serious incident |
| S5 | Carer anxiety (GHQ-28 anxiety subscale or HADS-A) **does not worsen** from baseline to end of pilot; pre-registered as a primary safety outcome with an equivalence margin | Paired change, reported regardless of direction. REMCARE found the opposite; we must be able to detect it |
| S6 | **Zero** participants continue after expressed dissent | `consent_event` audit; MCA s.33 compliance |
| S7 | Suspected-delirium acute-change notifications: **≥1 verified true positive and a documented false-positive rate**, with GP contact outcomes tracked | Follow-up on every P25 notification |

### Tier 2 — Feasibility and adherence (the realistic deliverable)

| # | Criterion | Measurement |
|---|---|---|
| F1 | **≥60%** of enrolled dyads complete ≥1 session per week for ≥8 consecutive weeks | Segment-window adherence. Benchmark: iCST 40% at ≥2/week |
| F2 | **<20%** of enrolled dyads deliver **zero** sessions | Direct comparison to iCST's 22%. This is the single most predictive early number |
| F3 | A usable deck (≥10 items) is created in **≤10 minutes of caregiver time**, median, measured not estimated | Instrumented onboarding timing, including physical-photo capture |
| F4 | Non-usage attrition and dropout attrition curves reported **separately**, with curve shape classified (logarithmic / sigmoid / L) | Eysenbach 2005. A single completion percentage is not acceptable |
| F5 | **≥50%** of participants complete ≥4 of the first 7 probe days | Benchmark: BRANCH 92% in a cognitively-unimpaired-weighted sample. A large gap is itself the finding |
| F6 | Median caregiver content-authoring time **≤5 minutes/week** after week 1, and not increasing over time | Instrumented; carer burden is the primary product risk |
| F7 | Recruitment: target consent-to-approach yield and time-to-target documented, with the failure mode named in advance | Recruitment failure, not effect size, is the most common way this pilot dies |

### Tier 3 — Mechanism (what we can actually learn)

| # | Criterion | Measurement |
|---|---|---|
| M1 | Per-item retention curves fitted to real dementia review data — the first such dataset | Fitted `forgetting_rate_lambda` per item per participant; publishable regardless of direction |
| M2 | Pre-registered A/B: personal vs generic content, answer-first, matched interaction pattern. Primary outcome: **words spoken / story elicited**, not accuracy | Directly tests the Astell 2010 (c) finding that currently sits as an unexamined veto over the core mechanic |
| M3 | Pre-registered A/B: errorless (answer-first) vs spaced-retrieval (recall-first with rescue) on **face–name pairs specifically** | Haslam 2011 found SR > EL in exactly this paradigm (dementia subgroup n=15). Nobody has replicated it |
| M4 | Tier-1 item retention: **≥80%** of designated tier-1 items still recallable at cue level ≤1 at week 12 | This is the deck-as-promise claim (§2.1). If it fails, the honest claim fails |
| M5 | A published distress register — the field's first systematic adverse-event data for a memory intervention | Cochrane explicitly calls for evaluation of negative impact and notes it has not been done |
| M6 | Within-person change reliability estimated in our own cohort | Assume ~0.6, not ~0.95 (Thompson 2022). If it is below 0.5, no within-person trend claim is supportable at any horizon |

### Tier 4 — Commercial and honesty

| # | Criterion | Measurement |
|---|---|---|
| C1 | **≥40%** month-6 retention among dyads who complete week 4 | Nobody in the competitive survey reports 12-month home retention. Assume it is bad |
| C2 | Willingness to pay validated **against the honest claim**, not an aspirational one — the sales page used in the pilot must be the compliant one | Conversion from a page containing "This app does not treat or slow dementia" |
| C3 | **Zero** marketing, app-store or in-product statements that fail the §2.2 audit | Automated claim-lint over all copy surfaces, gating release |
| C4 | Caregiver comprehension check at onboarding: **≥90%** correctly state, unprompted, that the app will not slow the disease | Therapeutic misconception is a design problem, not a disclaimer problem. Ask them in their own words and correct the frame |

---

## 9. NEVER DO

Consolidated, deduplicated, adjudicated. These are hard stops.

1. Never claim, imply, or allow a testimonial to imply that the app slows, delays, prevents, treats or reverses dementia, Alzheimer's, MCI or cognitive decline.
2. Never claim transfer, general memory improvement, "brain health", cognitive reserve, neuroplasticity, or "use it or lose it".
3. Never claim improvement in ADLs, independence, quality of life, or mood.
4. Never state or imply that benefits persist after stopping.
5. Never show the patient a score, percentage, accuracy chart, trend line, streak, red X, buzzer, "wrong"/"incorrect", due-count, or backlog.
6. Never ask the patient to rate their own recall, confidence, or whether they got it right.
7. Never end a session on a failure, a summary screen, or a score.
8. Never let the algorithm retire, suspend, drop or silently remove an item.
9. Never let an interval-based scheduler push intervals out as ability falls (no monotonic-improvement assumption).
10. Never target 90% retention; never build a deliberate ~10% failure rate into a photo of someone's daughter.
11. Never ask for free recall of recent episodic events.
12. Never surface a deceased person in a recognition mechanic without an explicit caregiver decision, and never present a prompt whose correct answer requires knowing someone has died.
13. Never correct the patient about factual reality (who is alive, where they live, what year it is).
14. Never re-present an item that produced distress until a human re-enables it.
15. Never build an inferred emotion, affect, or distress classifier (EU AI Act Art. 5(1)(f)); never build a behaviour-shaping engagement engine tuned against a vulnerable user (Art. 5(1)(b)).
16. Never let AI-generated factual content about a person's life reach the patient without human preview and approval.
17. Never perform face detection, face clustering, auto-tagging or voiceprint processing (BIPA/CUBI/Washington; third parties who never consented).
18. Never export a real date, a full-face photograph, a voice recording, or a real name into the research plane.
19. Never build an automated abuse or neglect detection classifier.
20. Never implement covert or invisible monitoring; nothing observable by the caregiver may be undisclosed to the patient.
21. Never let a caregiver assert that the patient consented, or override the patient's expressed objection.
22. Never ship a caregiver-facing cognitive decline chart.
23. Never ship a clinician-facing cognitive status, trajectory, or progression-drift metric in v1 (MDR Rule 11 / MHRA Class IIa trigger).
24. Never ship an onboarding "baseline assessment" that reads as a screen (ASA upheld against an *implied* assessment).
25. Never embed MMSE or MoCA items anywhere in the codebase, including "inspired-by" screens.
26. Never use ASR output to grade a response or determine correctness.
27. Never use points, badges, coins, mascots, confetti, childish illustration, leaderboards, or streaks that reset.
28. Never send guilt-framed messages to the caregiver ("You haven't done a session in 5 days").
29. Never nudge or schedule a session after ~16:00 without explicit caregiver override.
30. Never require the patient to log in, enter a code, remember a password, or solve a puzzle.
31. Never use indirect input (mouse, trackpad, cursor, controller), head-mounted VR, dwell-to-select, or any gesture other than single tap on the patient surface.
32. Never use page transitions, parallax, autoplay, viewport motion, modals, hidden menus, or scrolling on the patient surface.
33. Never change the patient UI mid-study; never A/B test on the patient surface.
34. Never require caregiver co-presence for a session to run.
35. Never enrol PCA or svPPA participants into photo/face recognition mechanics.
36. Never interpret a sudden performance collapse as cognitive progression without first raising the possibility of physical illness (delirium).
37. Never vendor AGPL-3.0 Anki code into a hosted backend.
38. Never solicit testimonials with undisclosed incentives (a separate FTC count against Lumosity).
39. Never target advertising at recently diagnosed families or bereavement-adjacent audiences.
40. Never present a p<0.05 secondary outcome from a multi-outcome trial as proven — in either direction, for either the benefits or the harms.

---

## 10. OUTSTANDING BLOCKERS

Named, owned, and gating. These are not open questions for the pilot — they are things that must be closed before specific build steps.

| # | Blocker | Gates |
|---|---|---|
| B1 | **Written MHRA/FDA regulatory opinion** on the adaptive scheduler and any clinician-facing metric | The clinician/researcher surface. Named in `competitive-landscape.md` Open Q4 and never obtained |
| B2 | **DCB0129 / DCB0160 / DTAC / DSPT / Cyber Essentials** position for any UK health or social care deployment; joint-controllership and DPA with any deploying care provider | Any care-home or NHS-adjacent pilot. Typically procurement blockers with months of lead time. *(NHS Digital primary pages returned HTTP 403 during audit — scope and mandatory status must be verified.)* |
| B3 | **US state biometric law opinion** (BIPA/CUBI/Washington) covering photos of non-user third parties | The content pipeline design, before it is specified |
| B4 | **EU AI Act Art. 5 assessment** of the engagement engine and any distress signal | Any adaptive nudging, any distress detection |
| B5 | **REC/IRB approval, full-board** (cognitively impaired population, intrusive research under MCA s.30–31) | All study data collection |
| B6 | **PPI panel** with people living with dementia (DEEP / EWGPWD / JLA) | The v1 mechanic freeze |
| B7 | **Trial-registry search** (ClinicalTrials.gov, ISRCTN, PROSPERO) for unpublished, discontinued and null trials of personalised reminiscence and digital life-story interventions | The claims document. Publication bias is named as a systemic weakness in four documents and mitigated in none |
| B8 | **Cochrane full texts and Summary of Findings tables read directly.** Every GRADE rating quoted across eight documents came from an abstract or plain-language summary; that is how the corpus missed Chan 2024's bias-adjusted null and its MCI-only supervision split | Re-grading any (a) claim in §3 |
| B9 | **Self-reference-effect-in-AD literature** (Kalenzaga, Lalanne, Genon et al.) — cited in **zero** documents, mixed-to-negative in AD, and the product's central hypothesis (personal content is retained better) has **no supporting citation anywhere** | The M2 A/B design and the product thesis |
| B10 | **Competitor privacy policies read**, plus churn and willingness-to-pay data | Any privacy or business-model positioning claim |
| B11 | **Suicide and acute psychological crisis risk** around diagnosis, particularly younger-onset — named nowhere in the safeguarding section despite the product being a daily touchpoint with a recently diagnosed person, and despite the corpus's own finding that greater awareness of deficit predicts depression onset | The escalation policy, which cannot be written without it |
| B12 | **Care-home operational model**: who holds the account when the carer is paid staff (paid carers cannot be personal consultees), staff turnover, shared devices, infection control, offline-first, DoLS/LPS, CQC Reg 9, activities-coordinator budgets vs a £9.99 family subscription | Any care-setting deployment — and note residents are predominantly moderate-to-severe, the band where the engagement evidence is "close to absent" and where tablets stop working |
| B13 | **Unresolved citations still sitting in the documents:** Hochhalter 2005; the Gámiz/González-Moreno author list; the 2020 *Neuropsychology Review* procedural-learning author list; the Kao hyperphagia RCT (sourced only to a student review); the Nuffield six-component framework; El Haj and Munawar attributions inferred rather than read | Any external publication or regulatory submission |
| B14 | **Journal-quality flags never raised:** IJERPH (MDPI, delisted from Web of Science 2023) is the sole basis for the single-button design rule; Astell 2010 is in a defunct non-MEDLINE-indexed title | The design rules that rest on them |
| B15 | **Conference abstracts cited as journal articles** in at least five places, two flagged: the "2024 Lancet Commission update"; two IPA congress supplement catastrophic-reaction items (attributed to different authors in two documents that disagree about who wrote the same source); Astell 2025 CIRCA Canada; Soberanes 2025; Shen 2026 | The evidence table |
| B16 | **COI scrutiny applied to our own strongest evidence.** The competitive brief correctly flags Karlene Ball's Posit Science consulting on ACTIVE, then applies no equivalent check to CST — where Spector, Orrell and Woods co-authored the manual, the founding RCT, the maintenance trial, iCST, REMCARE **and the two Cochrane reviews grading their own intervention.** Not disqualifying; but a document that flags COI for the competitor and not for its own best evidence is not applying one standard | Any external evidence summary |

---

## 11. ONE-PARAGRAPH VERDICT

The evidence supports building a **short, gentle, dyad-friendly, personal-content activity with a small clinically-faithful spaced-retrieval loop inside it**, marketed as a shared activity and nothing more, in a population deliberately chosen (mild dementia, at home) **against** the strongest subgroup evidence (moderate dementia, care home, facilitated, group) — a choice that must be pre-registered as such. It does not support a spaced-repetition product. The scheduler earns its place because it makes the dose reportable and because SRT is the only (a)-graded direct-memory intervention here, not because it is the moat. The three closest trials to this concept were null and two harmed the buyer. The measurement asset survives only in a generic, non-personal, deliberately small probe. The clinician surface must ship without the capability that made it interesting. And the single largest unexamined risk is not efficacy, regulation or engineering — it is that eight documents researched how to make families use this, and none researched whether they want it.
