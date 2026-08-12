# What a Researcher Needs: Outcome Measures, Digital Biomarkers, and Study Design

**Domain research for the dementia/MCI personalised spaced-repetition app.**
Prepared 2026-08-12. Every substantive claim carries a citation. Where evidence is weak, absent, or negative, it is labelled as such.

---

## Summary (10 bullets)

1. **Do not build the MMSE into the app.** It is copyrighted, was transferred to a commercial publisher in 2000–2001, and is licensed per-administration (~$1.23–$1.48 per use plus manual purchase). Reproducing its items is a legal risk. The field has already migrated away from it ([Newman & Feldman 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC4160306/); [Powsner & Powsner 2005](https://psychiatryonline.org/doi/10.1176/appi.ajp.162.3.627-a)).

2. **Do not build the MoCA into the app either.** MoCA's own permission page states that *"the development of material related to the MoCA, including... any other electronic material, is prohibited"* and that the test may only be accessed through the MoCA website ([MoCA Cognition, Permission](https://mocacognition.com/permission/)). A third-party app cannot legally embed it. Reference it as an *externally administered* clinician variable instead.

3. **The app's own core mechanic — repeated retrieval of the same personal content over consecutive days — is already a validated digital biomarker paradigm.** The Boston Remote Assessment of Neurocognitive Health (BRANCH) multi-day learning curve does exactly this and separates cognitively unimpaired from cognitively impaired at Cohen's *d* = 0.83–1.30, with ICC = 0.94 and 92–96% adherence ([Papp et al. 2023](https://pubmed.ncbi.nlm.nih.gov/37971862/); [Boston BRANCH validation, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)). **This is the single most important precedent for this project.**

4. **The highest-value research output of this app is not "did the patient improve" — it is the learning curve and forgetting curve themselves.** Reduced short-term practice effects predict amyloid positivity with an odds ratio of ~13.5, and outperformed conventional biomarkers in 7 of 9 head-to-head comparisons ([Duff et al. 2017](https://pubmed.ncbi.nlm.nih.gov/28966919/); [practice-effects vs biomarkers, 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11710530/)).

5. **Intra-individual variability (IIV) in reaction time is a real, replicated early marker — confirmed.** A systematic review of 22 longitudinal studies found greater baseline IIV consistently predicted cognitive decline, impairment and mortality ([Haynes, Bauermeister & Bunce 2017](https://pubmed.ncbi.nlm.nih.gov/28462758/)). RT-based IIV outperforms accuracy-based IIV (*d* = 1.07–1.19 vs 0.46) ([Christ, Combrinck & Thomas 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5900796/)).

6. **Be honest in all framing: there is no evidence that cognitive training prevents or slows dementia.** The Cochrane review of computerised cognitive training in MCI found *no trial reported incident dementia at all*, and rated evidence very low quality ([Gates et al. 2019, CD012279](https://www.cochrane.org/evidence/CD012279_computerised-cognitive-training-preventing-dementia-people-mild-cognitive-impairment)). In mild-to-moderate dementia there is a small-to-moderate effect on *global cognition* (SMD 0.42) but **no** demonstrated benefit for ADLs, quality of life, mood, or behaviour ([Bahar-Fuchs et al. 2019, CD013069](https://www.cambridge.org/core/journals/bjpsych-advances/article/cognitive-training-for-people-with-mild-to-moderate-dementia-a-cochrane-review/C6F3C93BDC0335844F483EDB98062B3E)).

7. **A conventional RCT is likely out of reach for a pilot; plan for single-case experimental designs (SCED/N-of-1).** Against an *active* control the expected effect is SMD ≈ 0.21, which requires ~356 participants per arm (my calculation, standard two-sided 80% power formula). SCED with staggered multiple baselines is the appropriate design and has an established reporting standard ([SCRIBE 2016, Tate et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC4873717/)).

8. **Between-person reliability is easy; within-person change reliability is hard.** In remote mobile cognitive testing of older adults with MCI, between-person reliability was 0.94–0.97 but *within-person change* reliability was only 0.57–0.72 ([Thompson et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9390883/)). Detecting change *within* one patient — exactly what this app claims to do — is the statistically harder problem and needs many more data points.

9. **Our content is intrinsically identifiable and can never be shared as research data.** Full-face photographs and voice prints are two of HIPAA's 18 Safe Harbor identifiers, and they cannot be hashed or blurred into compliance — they must be removed ([HHS Safe Harbor identifier list, summarised](https://www.johndcook.com/blog/hipaa-identifiers-explained/)). The shareable dataset must be built from *metadata about* the content, never the content.

10. **Cognitive testing itself distresses people with dementia — 70% report distress, and distress is driven by perceived difficulty, not actual score** ([Lai et al. 2008](https://pubmed.ncbi.nlm.nih.gov/18772474/)). This is the hardest constraint in the whole project: the measurement design and the safety design are in direct tension, because clean psychometrics want failure trials and safety wants none.

---

## Key Findings

### A. Standard clinical outcome instruments — what they measure and whether we can touch them

| Instrument | What it measures | Licence status | Can we administer in-app? |
|---|---|---|---|
| **MMSE** | Global cognition screen, 0–30 | **Copyrighted, commercially licensed per administration** | **No — avoid entirely** |
| **MoCA** | Global cognition screen, 0–30, more sensitive to MCI | Free for clinical/educational use by health institutions; **electronic derivative works explicitly prohibited**; written permission needed for research; certification mandatory | **No — cannot embed. Ingest as external clinician-entered score** |
| **ADAS-Cog** | Cognitive battery, standard AD trial primary endpoint | Clinician-administered, ~45 min | No — clinician-administered only; ingest as external variable |
| **CDR / CDR-SB** | Global severity staging via semi-structured interview with patient *and* informant | Requires rater training | No — but CDR-SB is the endpoint regulators care about; ingest as external variable |
| **ADCS-ADL** | Informant-rated functional ability | Informant questionnaire | **Yes — caregiver-administrable in-app** |
| **QOL-AD** | 13-item quality of life, self- and proxy-report versions | Widely used, strongest QoL evidence base in dementia | **Yes — both versions, but see the agreement warning below** |
| **NPI-Q** | Informant-rated neuropsychiatric symptoms + caregiver distress | Brief informant form | **Yes — caregiver-administrable** |
| **GDS-15** | Self-reported depression | Public domain | Yes, but validity degrades with cognitive severity |
| **Cornell Scale (CSDD)** | Depression in dementia, clinician-integrated patient + informant | — | Preferred over GDS when MMSE < 15 |

**MMSE copyright.** The MMSE was published in 1975 and circulated freely for 25 years. In 2000 the authors transferred copyright to MiniMental LLC, which granted exclusive publication rights to Psychological Assessment Resources (PAR) in 2001. PAR charges per administration (~$1.23–$1.48) and requires manual purchase; it has pursued removal of MMSE item wording from websites and publications, and even a faster derivative instrument (the "Sweet 16") was withdrawn under pressure ([Newman & Feldman 2011, *Copyright and Open Access at the Bedside*](https://pmc.ncbi.nlm.nih.gov/articles/PMC4160306/)). The practical result is that the MMSE now appears in fewer textbooks and tools. **Verified: the MMSE is copyrighted and commercially licensed.**

**MoCA is not the easy substitute people assume.** Universities, hospitals, clinics and health professionals may use the MoCA without permission for *clinical and educational* purposes provided it stays free to patients — but **research use requires written permission**, commercial/pharma-funded use requires a licensing agreement, training and certification has been mandatory since September 2019, and creation of electronic derivative material is prohibited ([MoCA Cognition, Permission page](https://mocacognition.com/permission/)). A privately developed app embedding a MoCA-like screen is squarely in the prohibited zone.

**Open alternatives exist if we ever need an in-app global screen:** SLUMS was placed in the public domain by its developers, and GPCOG and the CAM are free for clinical and research use with attribution ([Newman & Feldman 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC4160306/)). None are as trial-standard as MoCA or ADAS-Cog.

**What the reference research infrastructure actually uses.** The NACC Uniform Data Set — the standardised longitudinal instrument used across NIA-funded Alzheimer's Disease Research Centers since 2005 — collects the CDR plus NACC FTLD behaviour/language domains (Form B4), the NACC Functional Assessment Scale (B7), the NPI-Q (B5), the GDS (B6), and a neuropsychological battery (C2) whose scores include the MoCA total ([NACC UDS-3 forms and documentation](https://naccdata.org/data-collection/forms-documentation/uds-3); [Weintraub et al. 2018, UDSNB 3.0](https://pubmed.ncbi.nlm.nih.gov/29240561/)). **If we mirror UDS field names and coding for the clinician-entered variables, our data slots straight into the dominant US dementia research ecosystem at near-zero cost.** This is the single cheapest interoperability win available.

**Effect sizes researchers will benchmark us against.** For MCI, a change of +2 to +3 on ADAS-Cog and +1 on CDR-SB is considered a minimal clinically important difference; for mild AD, +3 on ADAS-Cog and +2 on CDR-SB ([Muir et al. 2024, *Minimal clinically important difference in Alzheimer's disease: Rapid review*](https://pmc.ncbi.nlm.nih.gov/articles/PMC11095473/)). For calibration on how small "clinically meaningful" really is: in CLARITY-AD, lecanemab's 18-month treatment effect was −0.45 points on CDR-SB and −1.44 on ADAS-Cog14, both **below** the MCID thresholds above ([Muir et al. 2024](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.13770); [Petersen et al. 2024, *The search for clarity regarding clinically meaningful outcomes*](https://link.springer.com/article/10.1186/s13195-024-01412-z)). **A memory app must not claim it will move these numbers.**

**QOL-AD self vs proxy do not agree — this is important.** In 1,330 dyads, Bland-Altman limits of agreement between self- and proxy-rated QoL-AD ran from −15.7 to +8.5 points against a pre-specified acceptable range of ±3, and item-level weighted kappas were mostly < 0.20. Proxies rated QoL an average 3.4 points lower (4.7 points lower for informal home carers). Disagreement was driven by neuropsychiatric symptoms (NPI-Q) and functional dependency and caregiver burden — **not** by dementia severity or depression ([Römhild et al. 2018, RightTimePlaceCare secondary analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6022444/)). Collect both; never substitute one for the other; treat the *discrepancy* as its own variable.

---

### B. Digital biomarkers and passive sensing — signal, and a lot of noise

**Confirmed and strong: intra-individual variability (IIV).** A systematic review of 22 longitudinal studies (9 with longitudinal IIV, 17 predicting outcomes from baseline IIV) found IIV increases over time — especially past age 75 — and that greater baseline IIV consistently predicted cognitive decline, impairment and mortality ([Haynes, Bauermeister & Bunce 2017, *J Int Neuropsychol Soc* 23(5):431–445](https://pubmed.ncbi.nlm.nih.gov/28462758/)). Reported risk in one cohort was a ~40% increase in dementia risk per SD of RT variability (HR 1.43) ([summarised in Medscape coverage of the Sydney Memory and Ageing Study line of work](https://www.medscape.com/viewarticle/857584); primary: [Bunce et al., Sydney MAS](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5549897/)).

**How to compute IIV, concretely.** The best-specified method: take intra-individual standard deviation (ISD) of *residual* reaction times, after regressing out age and session-order (practice) effects, computed separately for simple and complex tasks. In 109 cognitively unimpaired older adults doing ~12.7 monthly at-home assessments, complex-task IIV predicted executive decline (β = −0.10, 95% CI −0.16 to −0.03) and, in amyloid-positive individuals, overall cognitive decline (β = −0.62, 95% CI −1.18 to −0.06), and correlated with inferior-temporal tau (β = 0.18) ([Jutten et al. 2023, *Neuropsychology* 38(2):184–197](https://pmc.ncbi.nlm.nih.gov/articles/PMC12184789/)). Limitations were candid: only 6 participants progressed to MCI, the sample was highly educated, the home testing environment was uncontrolled, and — notably for us — **they did not collect mood, stress, sleep or fatigue, and flagged that as a gap**.

**RT-based IIV beats accuracy-based IIV.** In 23 mild-to-moderate AD patients vs 25 controls, ISD from simple RT (*d* = 1.07) and choice RT (*d* = 1.19) discriminated far better than ISD from list recognition accuracy (*d* = 0.46), though domain-matched accuracy IIV retained value for predicting episodic memory ([Christ, Combrinck & Thomas 2018, *Front Hum Neurosci* 12:124](https://pmc.ncbi.nlm.nih.gov/articles/PMC5900796/)). **Implication: log response *latency* with as much fidelity as we log correctness.**

**Learning curves — the flagship. This is our paradigm.** The multi-day BRANCH protocol has participants complete three cross-modal associative memory tasks — **face–name**, groceries–prices, digits–signs — with *identical stimuli* every day for seven consecutive days, ~12–13 minutes per session on the participant's own device. Learning is quantified as an adjusted area-under-the-curve across days ([BRANCH validation, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)).

Results across studies:
- **Feasibility/adherence:** 96% of 181 cognitively unimpaired adults completed all assessments, with no differences by device type or time of day ([Papp et al. 2023, *Alzheimers Dement*](https://pubmed.ncbi.nlm.nih.gov/37971862/)); 92% completed ≥4 of 7 days in a mixed unimpaired/impaired sample ([BRANCH validation 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)).
- **Reliability:** ICC = 0.94 for the learning curve ([Papp et al. 2023](https://pubmed.ncbi.nlm.nih.gov/37971862/)).
- **Discrimination:** cognitively unimpaired vs cognitively impaired, Cohen's *d* = 0.83 (primary, n = 81) and *d* = 1.30 (replication, n = 63) ([BRANCH validation 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)).
- **Convergent validity:** r = 0.53 with MMSE, r = −0.40 with QDRS ([ibid.](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)).
- **Biomarker sensitivity:** learning curve scores declined monotonically across ascending amyloid/tau biomarker groups in 167 cognitively unimpaired adults ([Rentz/Papp group, 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12738084/)); and multi-day learning curve **added substantially to plasma p-tau217** in predicting decline over ~2.3 years — AUC 0.63 for p-tau217 alone vs **0.82 combined** (p = 0.034) ([Soberanes et al. 2025, *Alzheimers Dement* 21(Suppl 3):e103614](https://pmc.ncbi.nlm.nih.gov/articles/PMC12740139/)). **Caveat: that last one is a conference abstract with only 15 decliners — treat as promising, not proven.**
- **Limitations acknowledged:** limited ethnic diversity, small MCI subsample (n = 16), restricted cognitive testing beyond MMSE ([BRANCH validation 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12183941/)).

**Practice effects as a biomarker.** Attenuated short-term practice effects independently predicted amyloid positivity, with odds of being amyloid-positive **13.5× higher** in low- vs high-practice-effect individuals ([Duff et al. 2017, *Short-Term Practice Effects and Amyloid Deposition*](https://pubmed.ncbi.nlm.nih.gov/28966919/)). In head-to-head comparison, practice-effect effect sizes exceeded biomarker effect sizes in 7 of 9 comparisons ([Duff et al. 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11710530/)). This is a strong argument for a **fixed, repeated "probe set"** of items that is deliberately *not* adapted by the scheduler — see Design Implications.

**Speech features — promising, generalisation unproven.** Classification accuracy averages ~89% for AD and ~82% for MCI vs controls in reviews, with best results from combined acoustic + linguistic features; ADReSS challenge winners reached 85–89.6% ([de la Fuente Garcia et al. 2020, systematic review](https://pubmed.ncbi.nlm.nih.gov/32929494/); [Luz et al. 2020, ADReSS challenge](https://arxiv.org/pdf/2004.06833); [Acoustic speech analysis in AD: systematic review and meta-analysis, 2024](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11573841/)). Rate-related and interruption-related parameters (pause structure, articulation rate) are the most discriminative. **But** data scarcity, standardisation, privacy and interpretability remain open, and most models are trained on the same small English picture-description corpora.

**Keystroke/tap dynamics — treat reported accuracy with deep scepticism.** A widely cited study reported 97.9% sensitivity / 96.9% specificity for MCI from inter-key flight time. I checked the methodology: **n = 111 (64 controls, 47 amnestic MCI), cross-sectional, and no independent validation set — the figures appear to be in-sample**, the authors do not discuss overfitting or cross-validation, and generalisability is limited to amnestic MCI ([Park 2024, *JMIR* 26:e59247](https://pmc.ncbi.nlm.nih.gov/articles/PMC11561447/)). Do not repeat these numbers as if they were validated. The directionally credible finding is that inter-key latency, key hold duration, and error-related behaviours differ in MCI/early AD.

**Passive sensing (gait, phone use) — currently far too weak to build on.** The recent typing-variability and gait-asymmetry findings come from a sample of **21 older adults, of whom only 4 had MCI or dementia**, reported as preliminary analyses of an ongoing study with p-values but no effect sizes or classification accuracy ([Shen et al. 2026, *Alzheimers Dement* 21(Suppl 2):e107368](https://pmc.ncbi.nlm.nih.gov/articles/PMC12784374/)). Passive sensing is category (c) — plausible mechanism only.

**The field-level gap we can fill.** A systematic review of 78 studies of digital cognitive biomarkers found most computerised tests match or beat paper-and-pencil tests (test batteries: sensitivity and specificity > 75%, AUC > 0.8), but explicitly identified as under-explored: **"novel digital biomarkers like response time per trial or click patterns"**, and noted only 20% of studies reported race/ethnicity ([Chan et al. 2022, *Digital Cognitive Biomarker for MCI and Dementia: A Systematic Review*](https://pmc.ncbi.nlm.nih.gov/articles/PMC9320101/)). Per-trial response time and interaction patterns over months of naturalistic use, on personally meaningful content, is precisely what this app generates and almost nobody has.

---

### C. Ecological momentary assessment (EMA)

EMA is feasible in this population and adherence is better than most teams expect. In a 30-day protocol with EMA surveys 3×/day and mobile cognitive tests every other day, adherence was 86% for surveys and 84–85% for cognitive tests, and **did not differ between MCI and cognitively normal participants** or by demographics ([Thompson et al. 2022, *Feasibility and validity of ecological momentary cognitive testing among older adults with MCI*](https://pmc.ncbi.nlm.nih.gov/articles/PMC9390883/)). Conventional acceptability threshold in this literature is ≥80% compliance.

Critical psychometric nuance from the same study: **between-person reliability was 0.94–0.97, but within-person change reliability was 0.57 (verbal list learning) and 0.72 (visual working memory)**. Ceiling effects appeared on easier trials, and fatigue effects emerged for one task over 30 days. Sample was predominantly White and highly educated, and the authors could not verify effort or rule out cheating in unsupervised remote administration ([ibid.](https://pmc.ncbi.nlm.nih.gov/articles/PMC9390883/)).

Practical read: a **single-item mood/fatigue/sleep check per session is cheap and closes the exact gap Jutten et al. flagged** — IIV is meaningless if you cannot rule out that a bad day was a bad night's sleep.

---

### D. Study design: why an RCT is the wrong first move here

**The powering problem.** Cognitive training vs a passive control in mild-to-moderate dementia yields SMD = 0.42 (95% CI 0.23–0.62, moderate-quality evidence) on global cognition; vs an *active* control it drops to SMD = 0.21 (95% CI −0.23 to 0.64, not statistically significant, low quality) ([Bahar-Fuchs et al. 2019, Cochrane CD013069 — 33 RCTs, 1988–2018, 12 countries](https://www.cambridge.org/core/journals/bjpsych-advances/article/cognitive-training-for-people-with-mild-to-moderate-dementia-a-cochrane-review/C6F3C93BDC0335844F483EDB98062B3E)). Standard two-sided 80% power at α = 0.05 requires ≈ 89 per arm to detect SMD 0.42 and ≈ 356 per arm to detect SMD 0.21 *(my calculation: n = 2(1.96+0.84)²/SMD²)*. A pilot will not do this.

**Individualised content makes it worse.** Every participant's stimuli differ, so between-subject variance from content difficulty is confounded with treatment. This is a textbook case for within-subject designs.

**SCED is the appropriate design family.** Single-case experimental designs test intervention effects in one to three patients using repeated measurement and sequential, optionally randomised, introduction of the intervention, analysed by visual analysis plus design-specific statistics. The main types are withdrawal/reversal, multiple-baseline, alternating-treatments and changing-criterion designs; multiple-baseline introduces the intervention to three or more patients, settings or behaviours at staggered times ([Krasny-Pacini & Evans 2018, *Single-case experimental designs to assess intervention effectiveness in rehabilitation: A practical guide*, Ann Phys Rehabil Med](https://www.sciencedirect.com/science/article/pii/S1877065717304542)). Most SCED work in rehabilitation is in cognitive interventions, so reviewers in this field know the design.

**The methodological bar.** Professional guidelines require the experimental effect to be demonstrated **on at least three occasions** by systematically manipulating the independent variable. SCRIBE 2016 is the 26-item reporting checklist (title/abstract 2, introduction 2, method 14, results 3, discussion 3, documentation 2), covering design type, procedural changes, replication, randomisation, blinding, participant selection, setting, ethics/consent, **operational definitions and measurement frequency**, **procedural fidelity**, justification of analysis, sequence completed, **raw data reporting**, and adverse events ([Tate et al. 2016, SCRIBE 2016 Statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC4873717/)). The companion risk-of-bias instrument is the **RoBiNT scale**; the What Works Clearinghouse Procedures and Standards Handbook v5.0 (Aug 2022, rev. Dec 2022) also carries single-case design standards ([WWC handbooks](https://ies.ed.gov/ncee/wwc/handbooks)).

Two items matter enormously for us and are cheap to satisfy in software: **item 20 requires reporting raw data**, and **item 21 requires reporting adverse events**. An app that exports per-trial raw data and logs distress events by default makes its own studies publishable.

**A worked precedent in exactly our shape.** A multiple-baseline SCED evaluated a digital game intervention on cognition in nursing-home residents: 5 participants (4 completers), staggered baselines of 5–9 weeks assigned at random, intervention 30–60 min × 3/week for 6–10 weeks, a weekly repeated cognitive probe battery across 16 measurement occasions, analysed by visual inspection plus **Bayesian multilevel modelling** ([Yamada et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11080204/)). Note the design shape: **weekly probe measurement, randomised staggered baseline, and a modelling approach that pools across participants without requiring an RCT.**

---

### E. Data standards, de-identification and sharing

**De-identification is our binding constraint.** HIPAA Safe Harbor requires removal of 18 identifier classes, which include names; all date elements finer than year; **biometric identifiers including voice prints**; and **full-face photographs and comparable images**. Biometric and photographic identifiers are inherently unique and persistent — they cannot be blurred or hashed into Safe Harbor compliance, they must be removed ([HHS Safe Harbor identifier list, summarised](https://www.johndcook.com/blog/hipaa-identifiers-explained/)). Our entire content substrate — family photos, relatives' names, voice recordings, dated life events — is a wall of Safe Harbor identifiers.

The consequence is structural, not procedural: **there must be two separate data planes.** A *content plane* (photos, audio, names, real dates) that never leaves the family's control and is never in a research export, and a *research plane* (behavioural telemetry, content *metadata*, derived features) that is designed from day one to contain zero identifiers.

**FAIR and NIH.** The FAIR principles — Findable, Accessible, Interoperable, Reusable — were published by Wilkinson et al. in 2016 and are the stated guiding principles behind NIH policy ([FAIR Principles, NNLM](https://www.nnlm.gov/guides/data-thesaurus/fair-principles); [NIAID, FAIR Data Principles at NIH](https://www.niaid.nih.gov/research/fair-data-principles)). Since 2023, **all** NIH grant applications or renewals generating scientific data must include a Data Management and Sharing Plan, with an emphasis on deposit in established repositories; the policy explicitly accepts informed consent, privacy, and legal/ethical restrictions as valid reasons to limit sharing ([NIH DMS Policy 2023, summarised](https://libguides.wvu.edu/rdm/nih2023)). **Our privacy story is compatible with NIH policy — we are allowed to restrict content sharing, provided we say so up front in the DMSP.**

**OMOP vs FHIR — my recommendation: neither, at first; then OMOP.** OMOP CDM, from OHDSI, is a patient-centric model purpose-built for observational *research* analytics; FHIR is a RESTful exchange standard built for *clinical care* interoperability. They are complementary rather than competing, and FHIR→OMOP transformation pipelines exist ([InterSystems, *Differences between FHIR and OMOP*](https://www.intersystems.com/bnl-nl/impuls-blog/differences-between-fhir-and-omop/); [HL7 Vulcan, FHIR-to-OMOP project](https://hl7vulcan.org/projects/fhir-to-omop/); [Ostropolets et al., MENDS-on-FHIR](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10690355/)). Neither has a good native representation for millisecond-resolution per-trial interaction telemetry — that is not what they are for. Forcing our core data into OMOP early would be premature and would cost more than it returns. **The high-value, low-cost move is aligning the clinician-entered instrument fields with NACC UDS coding** (see section A), which is what dementia researchers actually use, and keeping an OMOP `OBSERVATION`/`MEASUREMENT` export as a later adapter.

---

### F. Harms — what would actively hurt a person with dementia

This is not a soft section. It constrains the measurement design.

**Cognitive testing distresses this population.** In 154 patients with mild-to-moderate AD vs 62 controls, **70% of AD patients reported distress after testing, vs 47% of controls (p < 0.001)**. Distress was predicted by *perceived difficulty* and by the patient's sense of having declined relative to 10 years ago — **actual cognitive performance was a weak predictor**, with only language scores showing any association ([Lai et al. 2008, *Self-reported distress after cognitive testing in patients with Alzheimer's disease*, J Gerontol A](https://pubmed.ncbi.nlm.nih.gov/18772474/)).

Read that finding precisely, because it is counter-intuitive and it dictates design: **making the task easier reduces harm; making the score better does not.** Perceived difficulty is the causal lever we control.

**Catastrophic reactions** — acute overwhelm expressed as agitation, tearfulness or aggression — can be precipitated by cognitive symptoms and misperception, contribute to premature institutionalisation, and are addressed principally through environmental modification ([Kaufer et al., *Emotional Lability, Intrusiveness, and Catastrophic Reactions*, Int Psychogeriatrics](https://www.sciencedirect.com/science/article/pii/S1041610224055844)). An app that repeatedly surfaces a failed retrieval of a spouse's or child's name is a plausible trigger. Anxiety in dementia is itself associated with decreased independence and increased care-home admission ([Spector et al. 2012, CBT for anxiety in dementia: RCT protocol](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3495021/)).

**Additional harms specific to a research-instrumented app:**
- **Confrontation with decline.** A caregiver- or researcher-facing dashboard showing a downward trend line, if visible to the patient, delivers a prognosis nobody consented to receive.
- **Inflated expectations.** Framing this as slowing disease progression is not supported by evidence (see the Cochrane findings) and sets families up for a second grief when decline continues regardless.
- **Caregiver burden as a hidden harm.** The caregiver is unpaid data-entry labour. NPI-Q caregiver distress and Zubin Burden Interview scores were significant moderators of proxy-report validity ([Römhild et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6022444/)) — burden is both an outcome to measure and a risk to manage.

---

## Evidence Quality Assessment

| Claim | Category | Note |
|---|---|---|
| MMSE is copyrighted and per-use licensed | **(a) Proven** | Documented commercial licence, multiple independent sources |
| MoCA prohibits third-party electronic derivatives | **(a) Proven** | Publisher's own stated terms |
| Multi-day learning curves discriminate impaired vs unimpaired | **(a) Proven** | *d* = 0.83–1.30, ICC 0.94, replicated in an independent cohort |
| Reaction-time IIV predicts decline/dementia/mortality | **(a) Proven** | Systematic review, 22 longitudinal studies |
| Reduced practice effects associate with amyloid positivity | **(a) Proven** (association), (b) as a screening tool | OR 13.5; screening use not prospectively validated |
| Learning curve + p-tau217 predicts imminent decline (AUC 0.82) | **(b) Promising but underpowered** | Conference abstract, 15 decliners |
| Speech features detect AD | **(b) Promising** | ~85–89% accuracy but narrow corpora, contested generalisation |
| Keystroke dynamics detect MCI at ~98% sensitivity | **(b) Promising, figures unreliable** | In-sample, no held-out validation, n = 111 |
| Passive gait/phone sensing detects impairment | **(c) Plausible mechanism only** | n = 21 with 4 cases; preliminary |
| EMA is feasible and well-tolerated in MCI | **(a) Proven** | 84–86% adherence, no MCI/control difference |
| Cognitive training improves global cognition in mild-moderate dementia | **(a) Proven, small** | SMD 0.42 vs control (moderate certainty) |
| Cognitive training improves ADLs, QoL, mood, or behaviour | **(d) No evidence of effect** | Cochrane: no meaningful gains |
| Computerised cognitive training prevents dementia in MCI | **(d) Untested — literally no data** | No trial reported incident dementia |
| Cognitive training slows disease progression | **(d) Not demonstrated** | No mechanism-level or clinical evidence supports this |
| Cognitive testing causes distress in people with dementia | **(a) Proven** | 70% vs 47%, p < 0.001 |

---

## Direct Design Implications

### Instruments

1. **Never implement MMSE items anywhere in the codebase, including as "inspired-by" screens.** Legal exposure, and reviewers will flag it.
2. **Never implement MoCA items.** Instead build a `clinician_assessments` table that *ingests* externally administered MoCA/ADAS-Cog/CDR-SB scores with `instrument`, `version`, `score`, `subscale_scores`, `administered_by`, `assessment_date`, `administration_setting`. The doctor enters the number; the app never renders the test.
3. **Do implement, as caregiver-facing forms:** NPI-Q (with its caregiver-distress ratings), ADCS-ADL, QOL-AD proxy version. **Do implement, as patient-facing:** QOL-AD self-report. These are informant/self questionnaires, not proprietary cognitive tests.
4. **Always collect QOL-AD self *and* proxy, store separately, and compute the discrepancy as a first-class variable.** Never impute one from the other — the limits of agreement are ±15 points.
5. **Mirror NACC UDS field naming and coding conventions** for every clinician-entered variable. Cheapest interoperability available.
6. **Use CSDD rather than GDS-15 when the patient's staging indicates moderate-or-worse impairment**; gate this on the clinician-entered severity, not on our own metrics.

### The measurement architecture

7. **Reserve a fixed "probe set" of items that the spaced-repetition scheduler is forbidden to touch.** This is the most important measurement decision in the project. If every item's interval adapts, the retrieval success rate is a property of the algorithm, not of the person, and *no* learning-curve or practice-effect metric is interpretable. The probe set should be presented on a fixed schedule (e.g. same items, first N days, then fixed weekly recurrence), matching the BRANCH design where identical stimuli recur daily for 7 days.
8. **Build the onboarding period as an explicit 7-day multi-day learning curve**, computed as adjusted area-under-the-curve, deliberately mirroring BRANCH. This gives every participant a baseline metric with a published comparator, ICC 0.94, and known effect sizes.
9. **Log latency with the same rigour as correctness.** RT-based IIV outperforms accuracy-based IIV by roughly 2×. Concretely: use a monotonic clock (`performance.now()`), start the clock at stimulus *paint*, not at data fetch or navigation, and record device refresh rate. **Never compare raw RT across devices** — restrict IIV computation to within-person, within-device windows.
10. **Compute IIV as the ISD of residualised RT**, residualising on session ordinal (practice), item position within session, and age — following Jutten et al. Store the raw trials; compute derived metrics in the analysis layer, versioned, so they can be recomputed when the method improves.
11. **Collect a one-tap mood / sleep / fatigue check per session.** Jutten et al. explicitly named the absence of this as a limitation. It is one screen and it substantially raises the interpretability of every IIV number we produce.
12. **Assume within-person change reliability of ~0.6, not ~0.95.** Design for many measurement occasions per person rather than precise single measurements. Do not display short-window trend lines that the underlying reliability cannot support.

### Study design

13. **Design the pilot as a randomised multiple-baseline SCED across participants**, not an underpowered RCT. Randomise the baseline length (e.g. 2–6 weeks) per participant; the app should support a "baseline mode" that administers probe measurements without the intervention content.
14. **Make the app SCRIBE-compliant by construction:** raw per-trial data export (item 20), a structured adverse-event/distress log (item 21), procedural fidelity logging (item 17 — did the session run as scheduled, was it caregiver-assisted, was it interrupted), and a frozen, versioned protocol record (item 25).
15. **Version and log everything that could change the measurement:** `app_version`, `scheduler_algorithm_version`, `content_set_version`, `scoring_rubric_version`. An algorithm change mid-study is a confound; without version stamps it is an unrecoverable one.
16. **Do not promise dementia prevention, progression-slowing, or ADL/QoL improvement in any user-facing or investor-facing copy.** The Cochrane evidence is clear: no trial has even measured dementia incidence, and ADL/QoL/mood benefits are unsupported. Honest framing — "daily engagement with your own life story, with the memory practice scheduled for you" — is defensible; "keeps Alzheimer's at bay" is not.

### Privacy and data plane

17. **Enforce two physically separate data planes.** Content plane: photos, audio, names, real dates, relationships — encrypted, family-scoped, **never present in any research export, ever**. Research plane: telemetry, content metadata, derived features, pseudonymous IDs.
18. **Never export a real date.** Export `day_offset_from_enrollment` (integer) plus `time_of_day_bucket`. Full dates are Safe Harbor identifiers.
19. **Extract speech features on-device and discard or firewall the raw audio.** Voice prints are Safe Harbor identifiers and cannot be de-identified. Exporting `speech_rate_wpm`, `pause_count`, `mean_pause_ms`, `articulation_rate`, `filled_pause_count`, `type_token_ratio` is fine; exporting the waveform is not. If raw audio must be retained for reanalysis, it lives in the content plane under separate, explicit, revocable consent.
20. **Photos never leave the content plane.** For research, store only metadata: `content_class`, `relationship_category`, `era_decade`, `caregiver_rated_emotional_valence`, `n_media_assets`, `media_type`.
21. **Write the Data Management and Sharing Plan up front**, stating that content data is restricted for privacy and consent reasons and that the behavioural dataset is the shareable artefact. NIH policy explicitly accommodates this.

### Safety — non-negotiable

22. **Never show the patient a downward trend line, a score decline, a percentile, or a "you used to get this right" message.** Trends belong on the caregiver and clinician surfaces only, behind an explicit gate.
23. **Cap consecutive failures and terminate on distress, not on item count.** Because distress tracks *perceived difficulty* rather than actual performance, a difficulty-adaptive floor is a genuine safety mechanism, not just UX polish. After N consecutive failures, drop to recognition/multiple-choice, then to a cued success, then end the session on a success.
24. **Use errorless/cued presentation as the default for personally significant items** (spouse, children). The cost of a failed retrieval on these items is emotional, not just psychometric.
25. **Log distress as a structured adverse event**, with `distress_signal_source` (self-report, caregiver-report, abandonment, rage-tap pattern), severity, and the item context. This is both an ethics requirement and SCRIBE item 21 — and it is a genuinely novel research variable.
26. **Never let session abandonment be silently indistinguishable from device failure.** They mean opposite things clinically. Log `session_end_reason` explicitly.
27. **Measure caregiver burden as an outcome** (NPI-Q distress items, ZBI), because the caregiver's labour is what makes the app run and their burden moderates every proxy measure we collect.

---

## Concrete Telemetry Specification

The fields below are what I would log. Everything in the *research plane* is designed to be exportable with no identifiers.

### `interaction` — one row per item presentation (the core research table)

**Identity & context**
- `interaction_id` (uuid), `session_id`, `participant_pseudonym`, `study_arm`, `phase` (baseline / intervention / withdrawal / follow-up)
- `app_version`, `scheduler_algorithm_version`, `content_set_version`, `scoring_rubric_version`
- `device_class`, `os_version`, `screen_css_px`, `device_pixel_ratio`, `display_refresh_hz`, `input_modality` (touch / mouse / keyboard / voice)
- `day_offset_from_enrollment` (int — **never a real date**), `time_of_day_bucket`, `local_hour`, `session_ordinal_today`
- `administered_by` (self / caregiver_assisted / caregiver_proxy) — **a hard confound; must be captured per interaction, not per session**

**Scheduling state (the SRS variables)**
- `item_id` (pseudonymous), `item_is_probe` (bool — probe-set items excluded from adaptation)
- `repetition_number`, `lapse_count`, `days_since_last_review`, `days_since_first_introduction`, `scheduled_interval_days`, `interval_deviation_days` (actual − scheduled)
- `stability`, `difficulty`, `retrievability` (or SM-2 `ease_factor`), `predicted_recall_probability`

**Item metadata (content plane never crosses over)**
- `content_class` (person / place / event / object / routine), `relationship_category` (spouse / child / grandchild / sibling / friend / other), `era_decade`, `caregiver_rated_emotional_valence`, `caregiver_rated_importance`, `media_type`, `n_media_assets`, `cue_modality` (photo / audio / text / mixed)

**Timing (millisecond resolution, monotonic clock, clock started at stimulus paint)**
- `stimulus_paint_ts_mono`, `first_input_ts_mono`, `response_commit_ts_mono`
- `latency_to_first_input_ms`, `total_response_time_ms`, `decision_time_ms` (first input → commit)
- `app_backgrounded_ms`, `n_backgrounds`, `interrupted` (bool) — **required to exclude contaminated trials from IIV**

**Hesitation & interaction dynamics**
- `n_answer_changes`, `n_taps`, `tap_hold_durations_ms` (array), `mean_tap_hold_ms`, `sd_tap_hold_ms`
- `inter_key_flight_times_ms` (array) for typed responses, `n_backspaces`
- `dwell_before_first_touch_ms`, `pointer_path_length_px`, `n_direction_reversals`
- `scroll_events`, `zoom_events`

**Response & outcome**
- `correct` (bool), `grade` (ordinal), `self_rated_confidence`
- `error_type`: `omission` / `no_response_timeout` / `semantic_near_miss` / `phonological_near_miss` / `intrusion_other_person` / `perseveration` / `confabulation` / `wrong_but_plausible` — **error taxonomy is high-value and almost nobody logs it**
- `response_text_hash` or coded category (**never the raw name in the research plane**)

**Assistance / scaffolding (the errorless-learning variables)**
- `hint_level_reached` (0 = none, 1 = semantic cue, 2 = phonemic cue, 3 = multiple choice, 4 = shown answer)
- `n_hints`, `time_to_first_hint_ms`, `presentation_mode` (free_recall / cued_recall / recognition), `n_distractors`
- `assistance_dependency_index` (derived)

**Speech-response features (features only; audio stays in content plane)**
- `utterance_duration_ms`, `speech_rate_wpm`, `articulation_rate`, `n_pauses`, `mean_pause_ms`, `max_pause_ms`, `n_filled_pauses`, `voiced_ratio`, `type_token_ratio`, `asr_confidence`

**Safety**
- `distress_signal` (none / mild / moderate / severe), `distress_signal_source`, `difficulty_floor_triggered` (bool), `item_retired_after` (bool) + `retirement_reason`

### `session` — one row per session
`session_id`, `participant_pseudonym`, `day_offset_from_enrollment`, `start_ts_mono`, `duration_ms`, `planned_n_items`, `completed_n_items`, `session_end_reason` (completed / user_ended / distress_stop / timeout / app_crash / device_failure), `caregiver_present`, `mood_checkin`, `sleep_quality_checkin`, `fatigue_checkin`, `enjoyability_rating`, `mean_rt_ms`, `median_rt_ms`, `isd_residual_rt_ms`, `cv_rt`, `accuracy`, `n_lapses`, `network_state`

### `clinician_assessment` — externally administered
`instrument` (MoCA / ADAS-Cog / CDR / CDR-SB / ADCS-ADL / NPI-Q / GDS-15 / CSDD / QOL-AD-self / QOL-AD-proxy), `instrument_version`, `total_score`, `subscale_scores` (jsonb), `administered_by_role`, `day_offset_from_enrollment`, `administration_setting`, `nacc_uds_form_equivalent`

### `adverse_event`
`event_id`, `participant_pseudonym`, `day_offset_from_enrollment`, `severity`, `category`, `related_item_class`, `narrative_coded`, `action_taken`, `reported_by`

### Derived research variables (computed, versioned, recomputable)
`multi_day_learning_curve_auc`, `forgetting_rate_lambda`, `retention_at_1d/7d/30d`, `isd_residual_rt` (simple and complex splits), `cv_rt`, `ex_gaussian_tau` (where trial counts permit), `short_term_practice_effect_slope`, `assistance_dependency_index`, `error_type_proportions`, `adherence_rate`, `qol_self_proxy_discrepancy`

### How researchers should consume it

*(This recommendation is grounded in the FAIR/NIH requirements cited above and in standard research practice; I did not find empirical studies of researcher tool preference, so treat the ranking as reasoned judgement rather than evidence.)*

1. **Tidy long-format CSV export is the load-bearing deliverable** — one row per interaction, one file per table, plus a machine-readable data dictionary (variable name, label, type, units, permissible values, derivation formula). This is what actually gets loaded into R and Python and what makes a repository deposit reusable. Do this first and do it well.
2. **A read-only, token-scoped REST API** for longitudinal pulls, so researchers do not re-download the whole corpus weekly.
3. **A dashboard third, not first.** Dashboards are for recruitment monitoring, adherence tracking and data-quality checks — not for analysis. Researchers will not accept a dashboard as a substitute for the raw file.
4. **A reproducible example notebook** (R and Python) that loads the export and reproduces the derived metrics. This is the highest-leverage single artefact for adoption.
5. **An OMOP `OBSERVATION`/`MEASUREMENT` adapter later**, if and when a partner site needs it. Not in v1.

---

## Open Questions

1. **Does personally meaningful content invalidate comparison to normed paradigms?** BRANCH's psychometrics rest on standardised stimuli. Our stimuli vary per person, so between-person comparison of raw accuracy is meaningless — only *within-person slope* is interpretable. Does the fixed probe set need standardised (non-personal) stimuli to be comparable across participants? I think yes, and that is a significant product decision: a portion of every session may need to be generic.
2. **Is caregiver-assisted administration a confound we can control, or one we must stratify on?** Unknown. It plausibly affects RT by hundreds of milliseconds and correctness substantially. Needs a pilot sub-study.
3. **Is effort/cheating detectable?** Thompson et al. flagged this as unresolved in unsupervised remote testing. Our caregiver-assist pathway makes it worse — a caregiver prompting the answer is invisible in the current field set.
4. **What is the minimum trial count for a stable ISD estimate in this population?** The IIV literature uses lab tasks with hundreds of trials. A 10-minute daily session yields perhaps 15–25. This may be the binding technical limit on IIV as a metric here, and I found no source that resolves it.
5. **Consent and capacity.** I was unable to complete research on capacity-to-consent, proxy/LAR consent, and ongoing assent in digitally mediated dementia research (search budget exhausted). This is a genuine gap and must be filled before any pilot — including the question of what happens to already-collected data when capacity is lost or consent is withdrawn.
6. **GDPR.** If a pilot runs in the EU/UK, health data and biometric data are special-category under Article 9 with a stricter regime than HIPAA, and "de-identified" is a higher bar (pseudonymised data is still personal data). Not researched here; flagged as a blocker for any non-US pilot.
7. **Regulatory posture.** Whether this is a wellness product or a medical device / clinical decision support tool depends on the claims made. I could not retrieve the FDA guidance on Digital Health Technologies for Remote Data Acquisition in Clinical Investigations (URL 404s). If we make any diagnostic or prognostic claim from the digital biomarkers, this becomes a regulatory question, not just a scientific one.
8. **Should distress events be a published outcome?** I think yes — the field lacks systematic data on the emotional cost of cognitive training, and reporting it honestly would be a genuine contribution. But it is also the finding most likely to be commercially inconvenient.
