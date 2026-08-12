# Engagement, Adherence and Motivation for Older Adults in Digital Health

**Domain research for a dementia/MCI personal-memory training app**
Prepared: 2026-08-12. Author: research subagent (Board 1).
Evidence grading used throughout: **(a) proven** · **(b) promising but underpowered** · **(c) plausible mechanism only** · **(d) disproven / no effect**.

> **Scope warning.** Four distinct populations appear below and must never be blurred: cognitively healthy older adults; subjective cognitive decline (SCD); mild cognitive impairment (MCI); mild dementia; moderate/severe dementia. Almost all the *engagement* literature is drawn from the first two. Evidence in mild dementia is thin; in moderate/severe dementia it is close to absent. Every claim below is tagged with its population.

---

## Summary (10 bullets)

1. **Plan for catastrophic non-usage attrition, not polite dropout.** Eysenbach's law of attrition is the base rate: open-access eHealth tools routinely retain <1–7% of users long-term, and even inside supervised trials completion of a full computerised cognitive training (CCT) protocol was **12%** in a 631-person dementia-risk cohort (Turunen 2019). Design and evaluate for the shape of the curve, not the endpoint. **(a)**
2. **The single most relevant trial to our product design failed.** iCST — cognitive stimulation delivered *at home by the family carer*, 3×30 min/week for 25 weeks — found **no** cognitive or quality-of-life benefit, and **22% of carers delivered zero sessions**; only 40% managed ≥2/week (Orrell 2017). But it *did* improve the person with dementia's rated relationship quality with their carer (ES 0.32, p=0.02). If we build this, the honest primary claim is relational and experiential, not cognitive. **(a) for the null; (b) for the relationship benefit**
3. **Human support beats app mechanics, reliably and by a lot.** Guided digital interventions achieve 56–81% adherence vs 26–69% unguided; guidance raises completion (g=0.29; log OR 0.50), and *human* guidance beats automated guidance (Musiat 2022; Werntz 2022; Mohr 2011). A human in the loop is not a nice-to-have — it is the strongest adherence lever we have. **(a)**
4. **Adherence has a threshold, and below it the intervention does nothing.** Meta-analysis of 55 RCTs (n=4,455): training effects are significant only when engagement/persistence >60% or adherence >80% (Li 2024, Hedges' g = 0.286 overall). Sub-threshold users are not "getting a bit of benefit" — they are getting noise. **(a)**
5. **Gamification for older adults is weakly supported and has documented backfire.** Systematic review: 10/12 studies positive but "mostly weak", one **negative** — participants found gamified cognitive training *less enjoyable and more frustrating* than ordinary puzzles (Koivisto & Malik 2021). Meta-analysis of enjoyment: SMD 0.34, GRADE **low**, and in the one study measuring adherence the *control* group adhered better (Ferreira-Brito 2025). **(b)/(d) depending on the element**
6. **Streaks are an evidence gap dressed up as a best practice.** There is essentially no RCT evidence on streaks in older adults, none in dementia. The only older-adult data are correlational real-world platform analytics (Perx cohort, n=250 ≥65y: streak users +26.5% engagement) with severe survivorship bias. For a population whose illness *guarantees* missed days, a streak is a scheduled humiliation. **(c) for benefit; harm is a real risk**
7. **Morning is measurably better, and the afternoon/evening is measurably worse.** Associative memory is ~10% worse in the evening than the morning in older adults (d=0.34; Sliwinski/ARC cohort 2022); the synchrony effect appears in ~83% of older-adult studies; diurnal preference shifts to morningness after age 55. Separately, sundowning affects ~21% of memory-clinic dementia patients, expressed as agitation (56%), irritability (54%) and anxiety (46%) in late afternoon/evening (Toccaceli Blasi 2023). **(a)**
8. **Dose has an inverted U.** In 8,709 SCD/MCI/mild-dementia users, ≥60s benefited most at 50–<55 min/day, **6** days a week — training **7** days/week produced a *sharp decline* in gains (npj Digital Medicine 2024). A rest day is evidence-based. Separately, dementia-usability work recommends capping single sessions at 30–35 min for cognitive load reasons (Sriram 2024). These conflict; see Open Questions.
9. **The caregiver is the actual bottleneck and is already at capacity.** ~49% median prevalence of burden across meta-analyses of informal caregivers; 75.9% report at least mild burden; spouses worst affected. Carers explicitly describe technology as unaffordable *cognitive* overhead: "mentally they are already overburdened" (Chen 2024, n=29). Any content-authoring workload we impose is a direct tax on a depressed, time-poor person. **(a)**
10. **Errors are not neutral for this population.** Errorless learning outperforms errorful learning in dementia because errors are implicitly consolidated and cannot be explicitly corrected — and it reduces negative corrective feedback, producing a more pleasant experience (Voigt-Radloff 2017; Clare & Jones). Any mechanic that generates repeated visible failure (scores, "wrong", declining graphs, leaderboards) is contraindicated on both learning and welfare grounds. **(a) for the learning claim; (c) for the affective claim in our specific UI**

---

## Key findings with citations

### 1. Attrition: what to actually expect

**Eysenbach, G. (2005). The Law of Attrition. J Med Internet Res 7(1):e11.** https://www.jmir.org/2005/1/e11/ (full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC1550631/)
- Distinguishes **dropout attrition** (lost to follow-up in the study) from **nonusage attrition** (still enrolled, stopped using the app). These are different problems with different fixes; our analytics must measure both separately.
- Three canonical curve shapes: logarithmic (constant proportional decay), sigmoid (curiosity → disappointment → stable hardcore users), L-shaped (rapid weed-out then stability).
- Real magnitudes cited: a panic-disorder self-help program had **1%** completion; MoodGym **0.5%** completion in open access vs **22.5%** in a trial setting; a heart-failure platform retained **45% at 3 months and 7% at 3 years**.
- Proposes the **run-in and withdrawal design**: an initial open period identifies genuine users, then randomise among them. Directly applicable to our pilot design.
- Grade: **(a)** as a descriptive law; the curve-shape taxonomy is **(c)**.

**Turunen, M. et al. (2019). Computer-based cognitive training for older adults: Determinants of adherence. PLOS ONE 14(7):e0219541.** https://pmc.ncbi.nlm.nih.gov/articles/PMC6620011/
- n=631, mean age 69.5, FINGER trial, elevated dementia risk (not diagnosed dementia).
- **63%** trained at least once; **20%** completed ≥half (72/144 sessions); **12%** completed all. Mean 45.7 sessions, **median 15**. The median-vs-mean gap is the whole story: a small hardcore carries the average.
- Predictors of *starting*: prior computer use (strongest), better baseline memory, being married/cohabiting, positive expectations of the study.
- Predictor of *continuing*: prior computer use only.
- **Null predictors**: age, sex, education, health status, depressive symptoms, physical activity.
- Grade: **(a)**. Note the population is at-risk-but-healthy; adherence in diagnosed dementia will be worse and more carer-dependent.

**Li, Z., He, H., Chen, Y., Guan, Q. (2024). Effects of engagement, persistence and adherence on cognitive training outcomes in older adults with and without cognitive impairment: systematic review and meta-analysis of RCTs. Age and Ageing 53(1):afad247.** https://pubmed.ncbi.nlm.nih.gov/38266127/
- 55 RCTs, 4,455 older adults (mean 73.9y), spanning normal cognition, MCI, and neurodegenerative dementia.
- Overall cross-domain effect **Hedges' g = 0.286 (95% CI 0.224–0.348)** — small.
- **Threshold finding:** training effects are significant when engagement or persistence rates exceed **60%**, or adherence exceeds **80%**.
- Memory, visuospatial and reasoning domains required *higher* persistence than executive function/attention/language.
- Counter-intuitively, cognitively normal older adults required *more* persistence to show gains than those already impaired.
- Grade: **(a)** for the association; **(c)** for causality (engaged people differ systematically from disengaged ones — see Perski below).

**Adherence definitions change the number by 30 points.** *Adherence type impacts completion rates of frequent mobile cognitive assessments among older adults with and without cognitive impairment (2023).* https://pmc.ncbi.nlm.nih.gov/articles/PMC10571616/
- n=33 (27% cognitively impaired), 17 × ~5-min assessments over a year via DANA Brain Vital.
- **Subsegment adherence** (hit the exact deadline): **60.6%**, degrading from 93.9% to 72.7% across the year.
- **Segment adherence** (complete within a flexible window): **78.8%**, and *stable* at 87.9–97.0%.
- **Cumulative adherence** (did it eventually): **90.9%**.
- Grade: **(a)** — small n but the mechanism is arithmetic, not inferential. This is the single cheapest adherence intervention available to us: widen the window.

### 2. Human in the loop vs pure app mechanics

**Mohr, D.C., Cuijpers, P., Lehman, K. (2011). Supportive Accountability: A Model for Providing Human Support to Enhance Adherence to eHealth Interventions. J Med Internet Res 13(1):e30.** https://pmc.ncbi.nlm.nih.gov/articles/PMC3221353/
- Mechanism: adherence rises via **accountability to a coach perceived as trustworthy, benevolent and expert**.
- Key propositions we can operationalise: expectations must be **process-oriented, not outcome-oriented**; the patient must help *set* them; monitoring must be framed as supportive not punitive; **reciprocity** (the patient gets something definable back) must be explicit; **bond** amplifies the effect; and **intrinsic motivation moderates** — the more intrinsically motivated the person, the less support they need.
- Grade: **(c)** as a causal model (it is a theory paper), but its predictions are supported by the meta-analyses below.

**Musiat, P. et al. (2022). Impact of guidance on intervention adherence in computerised interventions for mental health problems: a meta-analysis. Psychological Medicine.** https://pubmed.ncbi.nlm.nih.gov/34802474/
- Guidance significantly increases amount completed (**g = 0.29, 95% CI 0.18–0.40**) and proportion of completers (**log OR 0.50, 95% CI 0.34–0.66**); full completion **~12 percentage points higher** with guidance.
- Reported adherence bands: guided **56–81%**, unguided **26–69%**.
- Grade: **(a)**, but population is adult mental health, not dementia — extrapolate with care.

**Werntz, A. et al. (2022). Man vs. machine: A meta-analysis on the added value of human support in text-based internet treatments. Behaviour Research and Therapy.** https://www.sciencedirect.com/science/article/pii/S0272735822000642
- **Human** guidance beat **technological** (automated) guidance on both symptoms (g = 0.11, p<.01) and adherence (g = 0.26–0.29, p<.01).
- **Regular** guidance beat **optional/on-demand** guidance for adherence (OR 1.89, g = 0.35, p<.05).
- Grade: **(a)**. Design read: scheduled human contact > "contact us if you need help".
- **Honest counter-evidence:** at least one meta-analysis found *higher* effect sizes for fully automated interventions in anxiety (d=0.55 vs 0.35), and others find no guided/unguided difference. Human support reliably improves *adherence*; its effect on *outcomes* is condition-dependent.

**Perski, O., Blandford, A., West, R., Michie, S. (2017). Conceptualising engagement with digital behaviour change interventions. Transl Behav Med 7(2):254–267.** https://pmc.ncbi.nlm.nih.gov/articles/PMC5526809/
- Engagement = **behavioural** (amount/frequency/duration/depth of usage) + **experiential** (attention, interest, affect). Both must be measured; usage alone is a poor proxy.
- Critical caution: **more engagement is not automatically better.** The features people use most are often not the features causally linked to outcome, and observed engagement↔outcome correlations are confounded by baseline motivation.
- Grade: **(a)** as a conceptual contribution; direct warning against optimising for time-in-app.

### 3. Gamification: what works, what patronises

**Koivisto, J. & Malik, A. (2021). Gamification for Older Adults: A Systematic Literature Review. The Gerontologist 61(7):e360–e372.** https://academic.oup.com/gerontologist/article/61/7/e360/5856423 · https://pubmed.ncbi.nlm.nih.gov/32530026/
- 12 studies, **mean N=33** (range 9–60), mean duration ~6 weeks, 8/12 randomised.
- Most common elements: **adaptive/increasing difficulty** (notably more prominent than in general gamification research), social elements, points/scores, clear goals, progress indicators.
- Outcomes: 1 strong positive, **9 weak positive**, 1 null, **1 weak negative** — in which participants found cognitive-training *games* "less enjoyable and more frustrating" than traditional puzzles.
- Authors' own verdict: "mostly weak indications of positive effects." No pooled effect sizes reported. Likely publication bias.
- Grade: **(b)** overall; the frustration finding is a documented **(b)** backfire.

**Ferreira-Brito, F. et al. (2025). Effectiveness of Gamification on Enjoyment and Satisfaction in Older Adults: Systematic Review and Meta-Analysis. JMIR Aging 8:e72559.** https://pmc.ncbi.nlm.nih.gov/articles/PMC12178586/
- 6 studies (5 pooled), 419 participants, mean age 74.7; includes Parkinson's and MCI subgroups.
- Enjoyment/satisfaction: **SMD 0.34 (95% CI 0.05–0.64), I²=24%** — small.
- **GRADE certainty: low**, downgraded for very serious risk of bias.
- **Negative finding worth repeating:** in the single study that measured adherence, the **control group adhered better**; exergame participants dropped out due to dissatisfaction.
- No significant subgroup differences by session duration, population, or immersion method.
- Grade: **(b)** for enjoyment; **(d)** for any claim gamification improves adherence in older adults.

**Boot, W. & Charness, N. (2019). The potential and pitfalls of gamification to support older adults' adherence to healthcare interventions. Innovation in Aging.** https://pmc.ncbi.nlm.nih.gov/articles/PMC6840662/
- Central pitfall identified is the **age-related digital/gaming divide**: a lack of enthusiasm for and experience with video game play among older adults undermines gamification's assumed appeal. Points/badges/leaderboards are borrowed from a culture many of our users never joined.
- Grade: **(c)** — conference abstract, no primary data.

**On stigma and condescension specifically.** The direct empirical literature is thinner than the folk wisdom suggests, but it exists:
- *Design Preferences for a Serious Game–Based Cognitive Assessment of Older Adults in Prison: Thematic Analysis.* JMIR Serious Games 2023;11:e45467. https://games.jmir.org/2023/1/e45467 — participants wanted **childish graphics avoided**, because *gimmicky gameplay can be condescending*. (Retrieved via search index; we were unable to fetch the full text, so treat as a single qualitative study in an unusual population.) Grade: **(c)**.
- Koivisto & Malik note that gerontechnologies explicitly targeting older adults carry **stigmatising symbolism** that deters adoption, and that perceptions of gaming as "childish and immature" are held by some older adults themselves. Grade: **(b)**.
- **Honest statement of the gap:** we found no adequately powered study directly testing "infantilising design reduces adherence in older adults." The claim is well-attested qualitatively and mechanistically, not quantitatively. Do not cite it to a funder as proven.

**Counter-evidence — real-world data where gamification looks good.** *Mobile health apps for older adults: real-world evidence on engagement and medication adherence.* Frontiers in Digital Health 2026. https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2026.1716880/full
- n=250, ≥65y (mean 70.1), commercial Perx platform, Australia/US. Median retention **595.5 days**; median medication adherence 95%.
- Feature association with engagement vs baseline: **leaderboard +62.5%, streak tracking +26.5%, community forum +17.1%, rewards tab −12.8%**. Authors interpret this as intrinsic/social motivators outperforming extrinsic rewards.
- **Severe caveats:** correlational; commercial platform with a **7-day inclusion threshold that excludes early disengagers** (textbook survivorship bias — exactly the population Eysenbach warns about); outcome is medication adherence, not cognitive training; participants are cognitively healthy 70-year-olds, **not people with dementia**. Feature *usage* is likely a marker of engaged users, not a cause of engagement.
- Grade: **(c)**. Useful as a hypothesis generator; not evidence that streaks or leaderboards would help our users.

### 4. Streaks and loss framing

There is **no RCT evidence on streak mechanics in older adults or in dementia**. This is a genuine hole in the literature and we should say so publicly rather than borrow Duolingo's design and assume it transfers.

What we can anchor:
- **Gain framing generally beats loss framing for prevention behaviours.** Gallagher & Updegraff (2012), *Health Message Framing Effects on Attitudes, Intentions, and Behavior: A Meta-analytic Review*, Ann Behav Med — gain-framed messages more effective for illness-prevention behaviours overall (**r = .083, p = .002**), with the effect strongest for skin cancer prevention (r=.237), smoking cessation (r=.198) and physical activity (r=.160). https://www.researchgate.net/publication/51714173 · Grade **(a)** for the direction, though the effect is small.
- **Loss framing is not uniformly worse for older adults** — among older adults with chronic conditions and among those with no prior social-participation experience, loss-framed messages sometimes outperformed. *Message framing effects on attitude and intention toward social participation in old age.* https://pmc.ncbi.nlm.nih.gov/articles/PMC10476306/ · Grade **(b)**.
- **The mechanism that makes streaks work is the mechanism that makes them harmful here.** A streak converts consistency into a possession, and loss aversion protects it. In a progressive illness, missed days are not a motivational failure — they are symptoms (a bad day, an infection, a hospital admission, disease progression). A mechanic that punishes symptom expression is a mechanic that punishes the patient for being ill. Grade: **(c)** — reasoned from loss aversion plus the errorless-learning literature, not from a trial. We should treat it as a **safety constraint**, not an optimisation question.
- Popular claims that ~40% of users abandon a product within two weeks of breaking a long streak circulate widely in design blogs; we could **not** trace them to a peer-reviewed source and they should not be cited.

### 5. Session timing: time of day, sundowning

**Sliwinski et al. / ARC cohort (2022). Sharper in the morning: Cognitive time of day effects revealed with high-frequency smartphone testing.** https://pmc.ncbi.nlm.nih.gov/articles/PMC9116128/
- n=169 older adults (mean 75.9, range 61–94), **90% cognitively normal, remainder very mild dementia**; 4 brief smartphone sessions/day for 7 days.
- **Associative memory** was ~10% worse in the evening than morning (**d = 0.34**, p<.001). **Processing speed and spatial working memory showed no time-of-day effect.**
- Grade: **(a)** for associative memory specifically — which is precisely the faculty our app trains (face↔name, photo↔event).

**Chronotype and synchrony effects in human cognitive performance: a systematic review. Chronobiology International 2025.** https://www.tandfonline.com/doi/full/10.1080/07420528.2025.2490495
- Synchrony effect evidenced in **83.33%** of older-adult studies, especially for fluid abilities and **associative memory**; less consistent for item memory. Diurnal preference shifts toward **morningness after age ~55**.
- Grade: **(a)** for the existence of the effect; **(b)** for its size in any individual.

**Toccaceli Blasi, M. et al. (2023). Sundowning in Patients with Dementia: Identification, Prevalence, and Clinical Correlates. J Alzheimers Dis.** https://pubmed.ncbi.nlm.nih.gov/37334595/
- 184 memory-clinic patients; **21.2%** sundowned. Symptoms: agitation 56.4%, irritability 53.8%, anxiety 46.2%. Correlates: older age, later onset, **greater cognitive/functional decline (CDR)**, more nocturnal awakenings, hearing loss, anticholinergic/antipsychotic use.
- Grade: **(a)** for prevalence in clinic populations.

**Canevelli, M. et al. (2016). Sundowning in Dementia: Clinical Relevance, Pathophysiological Determinants, and Therapeutic Approaches. Front Med 3:73.** https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2016.00073/full
- Prevalence estimates range **2.5%–66%** depending on criteria — the construct is loosely defined. Contributing factors include reduced daytime light exposure, afternoon fatigue, reduced caregiver availability in the late afternoon, and **absence of a daily routine**.
- Grade: **(a)** for the descriptive syndrome; **(c)** for causal mechanism.

### 6. Session length, dose, and fatigue

**Dose–response relationship between computerized cognitive training and cognitive improvement. npj Digital Medicine (2024) 7:220.** https://pmc.ncbi.nlm.nih.gov/articles/PMC11327304/
- Retrospective cohort, **8,709 participants**, 2017–2022, mean age 63.2. Population mix: **SCD 7.7%, MCI 60.9%, mild dementia 31.4%** — unusually relevant to us.
- Optimal for **≥60y: 50 to <55 min/day** (adjusted effect 3.9, 95% CI 1.4–6.4, p=0.002), at **6 days/week**. For <60y: 25–<30 min/day.
- **Inverted U confirmed:** training 7 days/week caused a *sharp decline* in weekly cognitive index change. More is not better.
- Caveats: retrospective, commercial platform, no adherence/attrition reporting, "cognitive index" is the vendor's own composite — high risk of survivorship and measurement bias. Grade: **(b)**.

**Sriram, V. et al. (2024). Technology Usability for People Living With Dementia: Concept Analysis. JMIR Aging 7:e51987.** https://pmc.ncbi.nlm.nih.gov/articles/PMC11255540/
- Dementia-specific usability attributes: **intuitiveness/simplicity** (usable without prior instruction), **personalisation**, **adaptability as the disease progresses**, **learnability with minimal cognitive load**.
- Antecedent that matters most for us: **co-use with a caregiver** is a structural condition of usability, not an add-on.
- Concrete requirements: minimise cognitive load, **limit sessions to ~30–35 minutes**, clear navigation so users cannot "get lost", large buttons and readable text, **lower-pitched audio** for age-related hearing loss, and collect feedback in **real time** because retrospective self-report is unreliable in this population.
- Grade: **(b)** — concept analysis, not a trial, but the constraints are conservative and low-cost.

**Note the conflict:** the dose-response paper says ~50 min/day for over-60s; the dementia-usability literature says cap at 30–35 min. The dose paper is 61% MCI and skews younger (mean 63); the usability work targets diagnosed dementia. Resolve in favour of the shorter session for our population, and never assume a longer session is "more therapeutic".

### 7. What actually helps this population (and what the honest claim is)

**Orrell, M. et al. (2017). The impact of individual Cognitive Stimulation Therapy (iCST) on cognition, quality of life, caregiver health, and family relationships in dementia: A randomised controlled trial. PLOS Medicine 14(3):e1002269.** https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002269 · HTA report: https://www.ncbi.nlm.nih.gov/books/NBK311123/
- **This is the closest existing trial to our product concept.** 356 dyads randomised; 273 completed at 26 weeks. Carer-delivered, at home, **up to 3 × 30-min sessions/week for 25 weeks** (max 75 sessions), with professional support.
- **Adherence reality: 22% (39/180) of carers delivered ZERO sessions. Only 40% (72/180) managed ≥2 sessions/week. 51% completed >30 sessions overall.** Compliance was described as "much lower than expected."
- **Primary outcomes null:** cognition (ADAS-Cog) MD −0.55 (95% CI −2.00 to 0.90), p=0.45. Self-reported QoL (QoL-AD) MD −0.02 (−1.22 to 0.82), p=0.97.
- **Positive secondary:** people with dementia in the iCST arm rated **relationship quality with their carer** more positively — MD 1.77 (95% CI 0.26–3.28), **p=0.02, ES 0.32**. Carer health-related QoL appeared improved; carers who did more sessions had fewer depressive symptoms (correlational, confounded).
- No improvements in ADLs, depression, or BPSD.
- Grade: **(a)** for the null on cognition/QoL and for the adherence figures. **(b)** for the relationship benefit.

**Woods, B. et al. (2012). Cognitive stimulation to improve cognitive functioning in people with dementia. Cochrane Database Syst Rev CD005562.** https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub2/full
- 15 RCTs, 718 participants, mild-to-moderate dementia. Consistent small cognitive benefit over usual care — roughly equivalent to a **~6-month delay** in expected decline, over and above medication.
- **Self-reported quality of life/well-being: SMD 0.38 (95% CI 0.11–0.65).** **Staff-rated communication and social interaction: SMD 0.44 (0.17–0.71).**
- **No** differences on mood, ADLs, general behavioural function, problem behaviour, or family caregiver outcomes.
- Crucially, CST is distinguished by its **broad focus and social elements** — it is delivered in groups. The individual, carer-delivered version (iCST above) removed the group and lost the effect.
- Grade: **(a)**.

**Woods, B. et al. (2018). Reminiscence therapy for dementia. Cochrane Database Syst Rev CD001120.** https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/information
- 22 studies. Some evidence of improved quality of life, cognition, communication and possibly mood — **but all benefits small and inconsistent across dementia types and settings.**
- **Modality matters:** *individual* reminiscence associated with improved cognition and mood; *group* reminiscence with improved communication; QoL benefits most evident in **care homes**.
- Grade: **(b)** — this is the evidence base underpinning "use their own life content", and it is real but modest. Do not oversell it.

**Peer-led activity app in long-term care (cluster RCT, 72 residents with early-stage dementia).** https://pmc.ncbi.nlm.nih.gov/articles/PMC10738604/
- Residents led activities for peers using an app: **99% adherence to the required steps, with minimal staff help** — strong evidence that people with early-stage dementia *can* operate a well-designed app.
- Significant in-session gains in **constructive engagement and pleasure**, reduced distracted engagement (p<.01).
- **No distal effects** on neuropsychiatric symptoms, agitation, depression or QoL — except an assisted-living subgroup which improved on depression and QoL.
- Grade: **(b)**. Design read: the benefit is *in the moment*. Social role ("I am leading this") is a powerful engagement mechanic that is the opposite of infantilising.

**Gates, N.J. et al. (2020). Computerised cognitive training for maintaining cognitive function in cognitively healthy people in late life. Cochrane Database Syst Rev.** https://pubmed.ncbi.nlm.nih.gov/32104914/
- 8 RCTs, 1,183 cognitively healthy 65+, 12–26 weeks. **Certainty of evidence low or very low for all outcomes.** Small immediate benefit to global cognition vs active control (SMD −0.31) that **did not persist at 12 months** (SMD −0.21). Benefits "of uncertain clinical importance."
- Grade: **(d)** for durable benefit in healthy older adults. Include this in any honest framing — it is directly relevant to what we may *not* claim.

### 8. The caregiver

**Prevalence of burden.** *Prevalence of depression, anxiety, burden, burnout, and stress in informal caregivers: An umbrella review of meta-analyses* (2025). https://www.sciencedirect.com/science/article/pii/S2950307825000785 — **median prevalence of caregiver burden 49.26%**. And a 2025 cross-sectional study of dementia caregivers found **75.9% reported at least mild burden**, with burden associated with hours of daily care and reduced leisure time; **spousal caregivers had higher odds of abnormal depression and anxiety** (https://link.springer.com/article/10.1186/s12912-025-04014-8). Grade: **(a)**.

**Belle, S.H. et al. (2006). Enhancing the quality of life of dementia caregivers from different ethnic or racial groups: REACH II randomized controlled trial. Ann Intern Med.** https://pubmed.ncbi.nlm.nih.gov/17116917/
- 642 caregivers, **12 in-home and telephone sessions over 6 months** addressing depression, burden, self-care, social support and care-recipient behaviour.
- **Clinical depression prevalence 12.6% (intervention) vs 22.7% (control), p=0.001.** Significant QoL improvement for Hispanic/Latino (p<0.001), white (p=0.037) and Black spousal caregivers (p=0.003).
- Grade: **(a)**. The lesson: what demonstrably helps caregivers is *structured human contact and skills training*, not software. A caregiver-facing app that adds tasks without adding support is moving in the wrong direction.

**Chen, X. et al. (2024). Barriers to using eHealth/mHealth platforms and perceived beneficial features among informal carers of persons living with dementia: a qualitative study.** https://pmc.ncbi.nlm.nih.gov/articles/PMC10771641/
- 29 informal carers (Singapore, mean age 56.3, 23 female). Four barrier themes: **preference for face-to-face**, **limited digital skills**, **cognitive overload** — one carer noting "mentally they are already overburdened" so adding technology became counterproductive — and **poor user experience destroying trust** (e.g. a location tracker reporting impossible positions).
- Wanted features: stage-specific education, resource directories, peer forums, reminders, appointment/prescription management.
- Grade: **(b)** — single-country qualitative, but consistent with the systematic review below.

**Promotors and barriers to implementation and adoption of assistive technology and telecare for people with dementia and their caregivers: a systematic review (2022).** https://pmc.ncbi.nlm.nih.gov/articles/PMC9780101/
- 30 studies. **Promotors:** personalised training for all stakeholders, prioritising safety (which for carers often outranks privacy concerns), stakeholder involvement in design, ease of use, cultural relevance.
- **Barriers:** unintended consequences causing **stress, confusion and negative emotions**; introduction **too late** (after a crisis rather than proactively); technology anxiety; **system failures and connectivity problems that erode trust**; digital literacy gaps; cost.
- Grade: **(b)** — mostly qualitative synthesis.

### 9. Routine, habit and errorless learning

**Errorless learning.** *Structured relearning of activities of daily living in dementia: the randomized controlled REDALI-DEM trial on errorless learning.* Alzheimer's Research & Therapy (2017). https://alzres.biomedcentral.com/articles/10.1186/s13195-017-0247-9 · and *Errorless learning of everyday tasks in people with dementia* https://pubmed.ncbi.nlm.nih.gov/24049443/
- Rationale: in Alzheimer's, explicit memory cannot flag and correct errors, so **errors get implicitly consolidated** alongside correct responses. Preventing errors directs limited capacity to the correct response.
- Compared with errorful learning or no treatment, errorless learning is more effective for teaching meaningful daily tasks/skills, with gains generally maintained at follow-up; it also **reduces negative corrections, making the experience more pleasant**.
- Honest caveat: REDALI-DEM itself did **not** find errorless superior to errorful learning on its primary ADL outcome — the errorless advantage is clearer for discrete memory targets (names, personal information, calendar use) than for complex ADLs.
- Grade: **(a)** for discrete memory targets; **(b)/(d)** for complex ADLs.

**Routine and habit.** Habit/procedural memory is relatively spared in dementia while episodic memory declines, which is the standard rationale for structured daily routines in dementia care (Alzheimer's Association, *Daily Care Plan*, https://www.alz.org/help-support/caregiving/daily-care/daily-care-plan; UCSF Memory and Aging Center, https://memory.ucsf.edu/caregiving-support/behavior-personality-changes). Canevelli 2016 (above) lists **absence of a daily routine** as a contributor to sundowning.
- Grade: **(c)** — clinically near-universal advice, mechanistically sound, but the specific claim "a fixed daily app slot will become a habit in dementia" is **untested**. We should test it, not assume it.

---

## Evidence quality assessment

| Claim | Grade | Best evidence | Main weakness |
|---|---|---|---|
| Massive non-usage attrition is the default in eHealth | **(a)** | Eysenbach 2005; Turunen 2019 | Base rates come from other conditions |
| Human support raises adherence | **(a)** | Musiat 2022; Werntz 2022 | Mental-health populations, not dementia |
| Adherence thresholds (>60% persistence / >80% adherence) gate any benefit | **(a)** assoc., **(c)** causal | Li 2024 (55 RCTs) | Confounded by baseline motivation |
| Carer-delivered home cognitive sessions do not improve cognition or QoL | **(a)** | Orrell 2017 (n=356) | One trial, one protocol |
| Carer-delivered sessions improve the *relationship* | **(b)** | Orrell 2017, ES 0.32 | Secondary outcome, multiple comparisons |
| Group cognitive stimulation gives small real benefits | **(a)** | Woods 2012 Cochrane | Group format; not our delivery model |
| Reminiscence using personal content helps modestly | **(b)** | Woods 2018 Cochrane, 22 studies | Small, inconsistent, setting-dependent |
| CCT in healthy older adults produces no durable benefit | **(d)** | Gates 2020 Cochrane | Low/very low certainty either way |
| Gamification improves enjoyment slightly | **(b)** | Ferreira-Brito 2025, SMD 0.34, GRADE low | 6 studies, high bias risk |
| Gamification improves adherence in older adults | **(d)** | Ferreira-Brito 2025 (control adhered better) | Single study measuring adherence |
| Gamified training can be *more frustrating* than plain puzzles | **(b)** | Koivisto & Malik 2021 | One study within a review |
| Infantilising design harms adoption | **(c)** | Qualitative only | No powered quantitative test |
| Streaks help older adults / people with dementia | **(c)** | Correlational platform data only | Survivorship bias; no RCT; no dementia data |
| Morning > evening for associative memory | **(a)** | ARC smartphone study, d=0.34; synchrony review | Effect modest; individual chronotype varies |
| Sundowning affects a substantial minority in late afternoon | **(a)** | Toccaceli Blasi 2023 (21.2%) | Construct definition varies wildly (2.5–66%) |
| Dose has an inverted U; 7 days/week is worse than 6 | **(b)** | npj Digital Medicine 2024 (n=8,709) | Retrospective, vendor data, vendor outcome |
| Cap sessions ~30–35 min for dementia | **(b)** | Sriram 2024 concept analysis | Not a trial |
| Errorless learning beats errorful for discrete memory targets | **(a)** | Clare & Jones; REDALI-DEM | Null for complex ADLs |
| Caregivers are at/over capacity | **(a)** | Umbrella review (49% burden); REACH II | — |
| Adding technology tasks increases carer cognitive load | **(b)** | Chen 2024; ATT systematic review | Qualitative |

**Systemic weaknesses across this whole literature:** tiny samples (gamification mean N=33), short durations (~6 weeks), near-universal absence of blinding, heavy reliance on cognitively healthy or MCI samples with mild dementia under-represented and moderate/severe dementia essentially absent, publication bias toward positive results, commercial platforms publishing their own outcome measures, and — most relevant to us — **engagement is almost always reported as a nuisance parameter rather than a pre-registered outcome.**

---

## DIRECT DESIGN IMPLICATIONS

### Framing and claims (do this first, it constrains everything else)

1. **DO** frame the product as *a shared daily moment built from your family's own memories, which people with dementia and their families report enjoying and which improves the caregiving relationship.* That claim is supported (Orrell 2017 relationship ES 0.32; Woods 2012 QoL SMD 0.38; peer-led app in-session pleasure).
2. **NEVER** claim the app slows disease progression, delays dementia, or improves cognition. iCST — the closest analogue — was null on cognition (p=0.45) and QoL (p=0.97), and Cochrane found no durable cognitive benefit of CCT in healthy elders. Claiming otherwise is both unsupported and, for a family facing this diagnosis, cruel.
3. **DO** pre-register engagement as a primary pilot outcome (both behavioural and experiential, per Perski 2017), not a footnote.

### Attrition and measurement

4. **DO** instrument **dropout attrition and non-usage attrition separately** (Eysenbach 2005), and plot the retention curve rather than reporting a single completion percentage. Expect an L- or logarithmic-shaped curve.
5. **DO** set realistic pilot targets anchored to Li 2024's thresholds: to have any chance of a signal we need **>60% persistence / >80% adherence** in the retained group. Anything less means we are measuring noise.
6. **DO** budget for iCST-like carer behaviour: **~20% of caregivers will do nothing at all**, and only ~40% will hit twice a week. Design the pilot's power calculation and the product's success criteria around that, not around an idealised user.
7. **DO** consider Eysenbach's **run-in and withdrawal design** for the pilot: a 2-week open run-in to identify genuine users, then randomise among them, reporting both ITT and the engaged-subgroup result honestly.
8. **DO** define adherence with a **flexible window** ("done today" or even "done this week"), not a hard deadline. Segment-level adherence was 78.8% vs 60.6% for deadline-level, and stable rather than decaying (PMC10571616). This is the cheapest single adherence win available.

### The human in the loop

9. **DO** build the caregiver in as the accountability partner, structured per Mohr 2011: expectations must be **process-oriented** ("we did our session together"), **co-set with the family**, and **monitoring framed as supportive, never punitive**.
10. **DO** schedule **regular** rather than optional support contact — regular guidance beat on-demand guidance for adherence (OR 1.89; Werntz 2022). For a pilot, a fortnightly 10-minute phone call from a research coordinator is likely to move adherence more than any feature we could build in a month.
11. **DO** give the caregiver **reciprocity** — something they receive from each session (a saved recording, a note of what their relative enjoyed, a shareable moment). Mohr's model makes reciprocity a requirement, not a garnish.
12. **DON'T** rely on app notifications as the primary prompt. Automated guidance underperformed human guidance on both adherence and outcomes.

### Session scheduling and dose

13. **DO** default the session to **mid-morning**, and make time-of-day a first-class configurable set by the caregiver. Associative memory — exactly what we train — is ~10% better in the morning (d=0.34), and the synchrony effect is present in ~83% of older-adult studies.
14. **NEVER** schedule or nudge a session in the **late afternoon or evening**. ~21% of dementia patients sundown, presenting with agitation, irritability and anxiety, and the risk rises with disease severity. Hard-block prompts after ~16:00 by default; require an explicit caregiver override.
15. **DO** cap sessions at **10–15 minutes** for v1 (well under the 30–35 min dementia-usability ceiling from Sriram 2024, and far under the 50 min "optimal dose" which came from a younger, mostly-MCI cohort). Adherence risk dominates dose-response optimisation at this stage.
16. **DO** build in a **rest day**: 6 days/week outperformed 7 in the largest dose-response dataset, where daily-without-break produced a *sharp decline* in gains. This is also a humane default.
17. **DO** anchor the session to an **existing daily routine** chosen by the caregiver (after breakfast, after the morning carer visit). Routine leverages relatively-spared procedural memory and absence of routine is implicated in sundowning. Flag this as a hypothesis to test, not established fact.
18. **DO** let the caregiver **pause the plan** (holiday, illness, hospital admission, bereavement) without penalty and without any catch-up backlog. A backlog of overdue cards is a guilt machine.

### Motivation mechanics — what to build and what to refuse

19. **NEVER** implement a streak counter that resets to zero, and never send a "you lost your streak" message. There is no evidence streaks help this population, and the mechanic punishes symptom expression in a progressive illness. If we want consistency feedback, use a **non-resetting cumulative count** ("you've shared 43 memories together") or an unpunished calendar heatmap.
20. **NEVER** show the person with dementia a score, an accuracy percentage, a declining trend line, or a comparison with their own past performance. This makes decline legible to the person experiencing it, and Cochrane found no mood benefit from these interventions to offset the risk.
21. **NEVER** put patients on a leaderboard against each other. Competitive social comparison across people at different disease stages ranks people by how ill they are.
22. **DO** apply **errorless-learning principles** in the session: prompt before the person can guess wrong, offer the answer generously and early, treat non-recall as a cue to give more support rather than to mark an item wrong. Never display the word "wrong", "incorrect", or a red cross to the patient. The correct response should be the only response consolidated.
23. **DO** use **gain framing** in patient-facing and carer-facing copy ("you shared three memories today"), consistent with the meta-analytic direction favouring gain frames for prevention behaviours. Reserve any loss framing for the *clinician* dashboard, never the patient's screen.
24. **DON'T** build points, badges, coins, cartoon mascots, celebratory confetti, or childish illustration. Evidence for benefit is weak (SMD 0.34, GRADE low), one study found gamified cognitive training *more frustrating* than plain puzzles, one found gamification *reduced* adherence, and qualitative work reports gimmicky gameplay reads as condescending. Adult, plain, photographic, dignified.
25. **DO** keep the two gamification elements that *are* supported: **adaptive difficulty** (the most common element in the older-adult gamification literature and the mechanism our spaced-repetition engine already provides) and **clear goals/progress** — expressed as content and relationship progress ("we've covered your grandchildren this week"), not as score.
26. **DO** design for **social role and contribution**, not consumption. The peer-led care-home app achieved 99% step adherence and significant in-session pleasure by putting the person with dementia in the *leading* role. Our equivalent: the patient tells the story, records a message back to a grandchild, chooses which album to visit. This is the single strongest anti-infantilisation move available.
27. **DO** design the win as **in-session pleasure**, because that is where the peer-led trial's effects were, and where reminiscence and CST effects are strongest. Optimise the felt quality of the 10 minutes, not the retention metric.

### The caregiver's own experience

28. **DO** treat caregiver content-authoring effort as the **primary product risk**. ~49% of informal caregivers meet burden criteria, spouses worst; carers describe technology as cognitive overload on top of an already-full load.
29. **DO** make first-run setup produce a usable deck in **under 10 minutes** with **≤10 items**. Do not ask for a comprehensive family tree. Let the deck grow through use.
30. **DO** support **low-effort asynchronous contribution from the wider family** (a sibling in another city uploads three photos and a 20-second voice note) so the primary carer is not the sole content pipeline. This directly addresses the "keep the content fresh" bottleneck.
31. **DO** allow **bulk photo import with optional captions** and defer metadata; never block a session on incomplete content.
32. **NEVER** send the caregiver guilt-framed messages ("You haven't done a session in 5 days"). Use neutral, offer-shaped prompts ("Want a 5-minute session? Here's one ready to go") and cap notification frequency.
33. **DO** make the app **fail visibly gracefully**. System failures and wrong information were reported as trust-destroying for carers; a single wrong or distressing item can end usage permanently.
34. **DO** give the caregiver **stage-appropriate education and a route to human support** — the features carers actually asked for, and the thing (REACH II) with real evidence of reducing caregiver depression (12.6% vs 22.7%).

### Safety and distress — things that could actively harm

35. **NEVER** surface a photo of a deceased spouse, child or parent without the caregiver having pre-marked its emotional status. Repeated unexpected re-confrontation with a bereavement the person cannot retain is a foreseeable source of acute distress. Provide a per-item flag: *safe* / *needs a person present* / *never show*. Grade **(c)** — clinical precaution, not trial evidence, but the cost of getting it wrong is severe.
36. **DO** provide a one-tap **"stop, this is upsetting"** control for the caregiver that immediately ends the session, suppresses the item, and logs it — and never asks the patient to explain why.
37. **NEVER** ask the patient orientation-style questions that expose deficit ("What year is it? Who is this?") without a scaffolded, errorless prompt available first.
38. **DO** ensure the patient-facing surface has **no failure state at all**: every response path ends in acknowledgement. Difficulty adaptation happens invisibly in the scheduler.
39. **DO** design audio with **lower-pitched voices** and large readable type per dementia-usability guidance, and assume co-use with a caregiver rather than solo use as the disease progresses.
40. **DO** anticipate that **prior computer use is the strongest adherence predictor** (Turunen 2019). Screen for it, and for participants with low digital familiarity, plan for caregiver-operated sessions from day one rather than treating that as a failure mode.

---

## Open questions

1. **Does an errorless, non-scored, personal-content session actually get used more than a conventional scored one?** Nobody has tested this head-to-head in dementia. It is a clean A/B for our pilot and would be a genuine contribution.
2. **Streaks in a progressive illness: harm, help, or nothing?** No evidence exists. If we test anything, test *non-resetting cumulative counts vs resetting streaks vs no counter* — and pre-register distress/caregiver-guilt as an outcome, not just retention.
3. **What is the minimum viable human contact?** Werntz 2022 says regular > optional, but not how much. Is a fortnightly 10-minute call enough, or does it need weekly? This determines whether the product can scale beyond a supported pilot.
4. **Dose conflict unresolved:** 50 min/day (npj 2024, mostly MCI, mean age 63) vs ≤30–35 min (dementia usability). Where is the tolerance ceiling in mild dementia specifically? We should measure fatigue/agitation as a function of session length in the pilot rather than assume.
5. **Does anchoring to an existing routine actually build a habit in dementia?** Widely recommended clinically, never tested for a digital daily task in this population.
6. **Who is the app *for* when the patient can no longer operate it?** iCST and the usability literature both point to co-use, but our success metrics, and the ethics of continuing, change when the caregiver is effectively the sole user.
7. **Does asynchronous family contribution sustain content freshness?** This is our proposed solution to the caregiver bottleneck and it is untested. High-value, cheap to instrument.
8. **Chronotype personalisation:** is a fixed morning default enough, or should the schedule adapt to individual chronotype and to observed within-person good/bad days? The synchrony literature implies the latter but has never been implemented adaptively for this population.
9. **How do we detect and respond to genuine decline?** When performance falls because the disease progressed, the scheduling engine must not respond by drilling harder. What is the safe, non-distressing degradation path, and who is told?
10. **Moderate/severe dementia is an evidence vacuum.** Almost nothing above applies. If the pilot includes anyone beyond mild dementia, we are doing exploratory work and should say so.

---

## Source list

- Eysenbach 2005, *The Law of Attrition*, JMIR — https://www.jmir.org/2005/1/e11/ · https://pmc.ncbi.nlm.nih.gov/articles/PMC1550631/
- Turunen et al. 2019, *Computer-based cognitive training for older adults: Determinants of adherence*, PLOS ONE — https://pmc.ncbi.nlm.nih.gov/articles/PMC6620011/
- Li, He, Chen & Guan 2024, *Effects of engagement, persistence and adherence on cognitive training outcomes in older adults*, Age Ageing 53(1):afad247 — https://pubmed.ncbi.nlm.nih.gov/38266127/
- *Adherence type impacts completion rates of frequent mobile cognitive assessments among older adults* 2023 — https://pmc.ncbi.nlm.nih.gov/articles/PMC10571616/
- Mohr, Cuijpers & Lehman 2011, *Supportive Accountability*, JMIR 13(1):e30 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3221353/
- Musiat et al. 2022, *Impact of guidance on intervention adherence in computerised interventions for mental health problems: a meta-analysis* — https://pubmed.ncbi.nlm.nih.gov/34802474/
- Werntz et al. 2022, *Man vs. machine: a meta-analysis on the added value of human support in text-based internet treatments*, Behav Res Ther — https://www.sciencedirect.com/science/article/pii/S0272735822000642
- Perski, Blandford, West & Michie 2017, *Conceptualising engagement with digital behaviour change interventions*, Transl Behav Med — https://pmc.ncbi.nlm.nih.gov/articles/PMC5526809/
- Koivisto & Malik 2021, *Gamification for Older Adults: A Systematic Literature Review*, The Gerontologist 61(7):e360 — https://academic.oup.com/gerontologist/article/61/7/e360/5856423
- Ferreira-Brito et al. 2025, *Effectiveness of Gamification on Enjoyment and Satisfaction in Older Adults: Systematic Review and Meta-Analysis*, JMIR Aging — https://pmc.ncbi.nlm.nih.gov/articles/PMC12178586/
- Boot & Charness 2019, *The potential and pitfalls of gamification to support older adults' adherence to healthcare interventions* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6840662/
- *Design Preferences for a Serious Game–Based Cognitive Assessment of Older Adults in Prison*, JMIR Serious Games 2023;11:e45467 — https://games.jmir.org/2023/1/e45467
- *Mobile health apps for older adults: real-world evidence on engagement and medication adherence*, Front Digit Health 2026 — https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2026.1716880/full
- Gallagher & Updegraff 2012, *Health Message Framing Effects on Attitudes, Intentions, and Behavior: A Meta-analytic Review*, Ann Behav Med — https://www.researchgate.net/publication/51714173
- *Message framing effects on attitude and intention toward social participation in old age* — https://pmc.ncbi.nlm.nih.gov/articles/PMC10476306/
- *Sharper in the morning: Cognitive time of day effects revealed with high-frequency smartphone testing* 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9116128/
- *Chronotype and synchrony effects in human cognitive performance: a systematic review*, Chronobiol Int 2025 — https://www.tandfonline.com/doi/full/10.1080/07420528.2025.2490495
- Toccaceli Blasi et al. 2023, *Sundowning in Patients with Dementia: Identification, Prevalence, and Clinical Correlates*, JAD — https://pubmed.ncbi.nlm.nih.gov/37334595/
- Canevelli et al. 2016, *Sundowning in Dementia*, Front Med 3:73 — https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2016.00073/full
- *Dose–response relationship between computerized cognitive training and cognitive improvement*, npj Digit Med 2024 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11327304/
- Sriram et al. 2024, *Technology Usability for People Living With Dementia: Concept Analysis*, JMIR Aging 7:e51987 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11255540/
- Orrell et al. 2017, *The impact of individual Cognitive Stimulation Therapy (iCST)…*, PLOS Med 14(3):e1002269 — https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002269 · HTA: https://www.ncbi.nlm.nih.gov/books/NBK311123/
- Woods et al. 2012, *Cognitive stimulation to improve cognitive functioning in people with dementia*, Cochrane CD005562 — https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD005562.pub2/full
- Woods et al. 2018, *Reminiscence therapy for dementia*, Cochrane CD001120 — https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/information
- Gates et al. 2020, *Computerised cognitive training for maintaining cognitive function in cognitively healthy people in late life*, Cochrane — https://pubmed.ncbi.nlm.nih.gov/32104914/
- *Revolutionizing digital engagement: effects of an app enabling persons with dementia to lead activities for peers* (cluster RCT, 72 residents) — https://pmc.ncbi.nlm.nih.gov/articles/PMC10738604/
- Belle et al. 2006, *REACH II randomized controlled trial*, Ann Intern Med — https://pubmed.ncbi.nlm.nih.gov/17116917/
- *Prevalence of depression, anxiety, burden, burnout, and stress in informal caregivers: umbrella review of meta-analyses* 2025 — https://www.sciencedirect.com/science/article/pii/S2950307825000785
- *Factors associated with anxiety, stress, depression and burden among informal caregivers of patients with dementia*, BMC Nursing 2025 — https://link.springer.com/article/10.1186/s12912-025-04014-8
- Chen et al. 2024, *Barriers to using eHealth/mHealth platforms … informal carers of persons living with dementia* — https://pmc.ncbi.nlm.nih.gov/articles/PMC10771641/
- *Promotors and barriers to the implementation and adoption of assistive technology and telecare for people with dementia and their caregivers: a systematic review* 2022 — https://pmc.ncbi.nlm.nih.gov/articles/PMC9780101/
- Voigt-Radloff et al. 2017, *REDALI-DEM trial on errorless learning*, Alz Res Ther — https://alzres.biomedcentral.com/articles/10.1186/s13195-017-0247-9
- *Errorless learning of everyday tasks in people with dementia* — https://pubmed.ncbi.nlm.nih.gov/24049443/
- Alzheimer's Association, *Daily Care Plan* — https://www.alz.org/help-support/caregiving/daily-care/daily-care-plan
- UCSF Memory and Aging Center, *Behavior & Personality Changes* — https://memory.ucsf.edu/caregiving-support/behavior-personality-changes

**Sources we could not verify and therefore did not rely on:** popular claims that ~40% of users abandon a product within two weeks of breaking a long streak (design-blog provenance only); a reported 75% dropout in a dementia app trial cited in a secondary review without traceable primary source; Milkman et al.'s gym-attendance megastudy finding on rewarding returns after a missed session (paywalled, could not retrieve).
