# Ethics, Consent, Safeguarding and Caregiver Dynamics

**Domain research for a caregiver-configured, patient-facing, researcher-observed memory-training app for people with dementia / Alzheimer's / MCI.**

Date: 2026-08-12. Author: research subagent. Evidence grading used throughout:
**(a) proven** · **(b) promising but underpowered** · **(c) plausible mechanism only** · **(d) disproven / no effect**.

> Scope note: this document covers ethics, consent, safeguarding and family dynamics. It does **not** assess whether cognitive training works — that is a separate domain — except where efficacy evidence directly constrains what we are ethically permitted to *claim*.

---

## Summary (10 bullets)

1. **A dementia diagnosis does not remove consent capacity.** Capacity is decision-specific and time-specific, and must be presumed present until demonstrated otherwise. Building the product around "the caregiver signs up and the patient just uses it" is the single biggest ethical failure mode available to us. *(a)*
2. **Consent must be a process, not an event.** The dementia research ethics literature converges on "process consent": re-affirm at intervals, watch for non-verbal dissent, treat any objection as decisive. *(a)*
3. **Proxies do not consent — in England & Wales they *advise*.** Under the Mental Capacity Act 2005 a "personal consultee" gives advice on what the person would have wanted; they cannot authorise participation, and if the person appears to object, participation stops. *(a)*
4. **Assent/dissent must be readable from behaviour**, not just from a tap on a button. Withdrawal signals include agitation, disengagement, repeated avoidance — the product must detect and honour these. *(a)*
5. **Monitoring by relatives is genuinely dual-use.** The same dashboard that supports care is the mechanism of technology-facilitated coercive control. Covert or non-consented tracking is documented as a real pattern in eldercare technology. *(b/c)*
6. **Repeatedly confronting a person with their own deficits causes measurable harm.** Disclosure of distressing truths to people with dementia is associated with worsening BPSD (18.4%) and worsening depression (26.0%) in care-manager reports; catastrophic reactions are triggered by "inability to meet expectations". *(b, with strong clinical consensus)*
7. **Family-facing "joint memory work" can harm the *carer*.** The REMCARE RCT found joint reminiscence groups produced a **statistically significant increase in carer anxiety** (mean difference 1.25, 95% CI 0.25–2.26, p=0.04) with no benefit to the person with dementia. This is the closest analogue trial to what we are building and it is a *negative* result for the caregiver. *(a — a well-powered RCT)*
8. **Errorless learning is not proven superior.** The best-powered RCT (REDALI-DEM, n=161) found **no difference** between errorless and trial-and-error learning. Errorlessness is still the right *ethical* default (dignity, distress avoidance) but must not be marketed as an efficacy feature. *(d for efficacy superiority; a for safety/acceptability)*
9. **Marketing hope to desperate families is a regulated legal risk, not just a moral one.** The FTC fined Lumosity $2M for claims that its games "reduce or delay cognitive impairment", explicitly citing preying on fear of dementia; FTC/FDA have issued joint warning letters over Alzheimer's claims. Any cognition/prevention claim requires competent and reliable human clinical evidence. *(a)*
10. **Data rights are unresolved when the subject cannot exercise them.** UK GDPR contains no mechanism for a third party to make a subject access request on behalf of someone lacking capacity; only an attorney/deputy has clear standing. We must design our own rights machinery rather than assume the law supplies one.

---

## Key findings with citations

### 1. Capacity and consent

**MCA 2005 five principles and the two-stage test.** Presumption of capacity; all practicable steps to support decision-making; the right to make unwise decisions; best interests; least restrictive option. The functional test is understand / retain / use-and-weigh / communicate, and capacity is decision-specific — a person may have capacity to decide about clothing but not finances, and capacity fluctuates across hours and days.
- Alzheimer's Society, *Dementia and the Mental Capacity Act 2005* — https://www.alzheimers.org.uk/get-support/legal-financial/dementia-mental-capacity-act
- Health Research Authority, *Mental Capacity Act* — https://www.hra.nhs.uk/planning-and-improving-research/policies-standards-legislation/mental-capacity-act/

**Capacity assessment in research requires "all practicable steps" (MCA s.1(3)); cognitive test scores alone are not sufficient.** Researchers must distinguish momentary confusion (reorientable) from sustained objection or distress (which warrants pausing or withdrawal), and should explore the cause of distress before terminating.
- David MCB, Del Giovane M, Wilson D, Truman T, Huntley JD, Suleman M, Ruck Keene A, Parker M, Sharp DJ, Malhotra PA (2024). *Considerations for legal, ethical, and effective practice in dementia research.* Brain Communications 6(4):fcae211 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11231934/

**Consultee, not proxy consent (England & Wales).** A *personal consultee* is someone engaged in caring for the person or interested in their welfare, unpaid; a *nominated consultee* is used where no personal consultee exists. The consultee **advises** — if they advise against, the person must not take part. MCA ss.30–33: research must relate to the impairing condition, must not be equally effective with capacitous participants, and — critically — **"nothing must be done to which the participant appears to object unless it is to protect him/her from harm."** Advance statements must be honoured. If a participant loses capacity mid-study, continuing requires s.30 approval and consultee advice.
- Health Research Authority, *Mental Capacity Act* — https://www.hra.nhs.uk/planning-and-improving-research/policies-standards-legislation/mental-capacity-act/
- Mental Capacity Act 2005, ss.30–33.

**US equivalent: Legally Authorized Representative (LAR) + assent.** Under 45 CFR 46, consent may be sought from the subject *or* their LAR; for minimal-risk research with decisionally impaired adults, IRBs expect provisions for obtaining **assent from the subject** alongside LAR consent, and the protocol must specify how assent capability is judged. **Dissent should be treated as decisive.**
- eCFR, 45 CFR Part 46 — https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-46
- HHS OHRP, *Informed Consent FAQs* — https://www.hhs.gov/ohrp/regulations-and-policy/guidance/faq/informed-consent/index.html
- NIH Policy Manual 3014-301, *Informed Consent* — https://policymanual.nih.gov/3014-301

**Process consent is the field standard.** A systematic review of 29 studies found significant variability in consent approaches and recommended shifting to *process consent consultation*; it also found assent from persons with dementia was typically **implicit rather than explicit** when surrogates decided — i.e. researchers *assumed* assent, which is exactly the failure we must engineer against.
- West E, Stuckelberger A, Pautex S, Staaks J, Gysels M (2017). *Operationalising ethical challenges in dementia research — a systematic review of current evidence.* Age and Ageing 46(4):678–687 — https://academic.oup.com/ageing/article/46/4/678/2926037

**Process consent method (Dewing).** Consent is sought before the study and **re-affirmed before each subsequent data collection episode**, with explicit attention to verbal and non-verbal signs of dissent.
- Dewing J (2008). *Process Consent and Research with Older Persons Living with Dementia.* Research Ethics Review 4(2):59–64 — https://journals.sagepub.com/doi/10.1177/174701610800400205
- Black BS, Rabins PV, Sugarman J, Karlawish JH (2010). *Seeking assent and respecting dissent in dementia research.* Am J Geriatr Psychiatry — https://pubmed.ncbi.nlm.nih.gov/20094021/

**End-of-life / impaired-capacity consent statement (MORECare_Capacity).** Systematic review + transparent expert consultation producing recommendations on consent processes for adults with impaired capacity, including flexible and ongoing models.
- Evans CJ et al. (2020). *Processes of consent in research for adults with impaired mental capacity nearing the end of life: systematic review and transparent expert consultation (MORECare_Capacity statement).* BMC Medicine 18:221 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7374835/

**Rights framing: CRPD Article 12.** Legal capacity (holding and exercising rights) is distinct from mental capacity (decision-making skills). CRPD General Comment No. 1 argues for supported decision-making replacing substitute decision-making; this is contested but has driven statutory reform in Ireland, India and Australian jurisdictions. The product-relevant point: **supported decision-making is the direction of travel, and designing for "the carer decides" is designing against the regulatory trend.**
- Alzheimer Europe (2020). *Legal capacity and decision making: the ethical implications of lack of legal capacity on the lives of people with dementia* — https://www.alzheimer-europe.org/sites/default/files/2021-11/Alzheimer%20Europe%20summary%20on%202020%20Report%20Legal%20capacity%20and%20decision%20making%20summary.pdf
- Martinez-Martin N et al. / Scholten M, Gather J, Vollmann J (2020). *Dementia, Treatment Decisions, and the UN Convention on the Rights of Persons With Disabilities.* Front Psychiatry 11:571722 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7680726/
- Wied TS et al. (2019). *Deciding in dementia: The possibilities and limits of supported decision-making.* Int J Law Psychiatry — https://www.sciencedirect.com/science/article/abs/pii/S016025271930130X

---

### 2. Surveillance, monitoring and dignity

**The safety-vs-autonomy frame is too crude.** Qualitative work in long-term dementia care argues the debate cannot be reduced to a two-way trade-off; it must also account for stakeholder relationships, staff/carer surveillance effects, and equity of access.
- Berridge C, Wetle TF et al. / Niemeijer AR et al.; and Bennett B et al. (2019). *Moving beyond 'safety' versus 'autonomy': a qualitative exploration of the ethics of using monitoring technologies in long-term dementia care.* BMC Geriatrics 19:184 — https://doi.org/10.1186/s12877-019-1155-6

**Concrete ethical criteria for sensor-based surveillance** — seven best-practice recommendations: focus on the person's wellbeing before deployment; data minimisation with automatic purging; restricted access and strong authentication; open design; transparency without stigmatising signage; autonomy support via documented patient values; and social consensus among stakeholders. Also: deploy only where probability of benefit is high; **re-evaluate whenever health status changes**; prefer the least intrusive modality; monitoring is most defensible when it *replaces* a more restrictive measure. The authors note scientific evidence of benefit "remains sparse".
- Lahr J, Schulze N, Wüst LN, Beisbart C, Bruhin LC, Ienca M, Nef T, Trachsel M, Klöppel S (2025). *Ethics of Sensor-Based Surveillance of People with Dementia in Clinical Practice.* Sensors 25(7):2252 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11990963/

**Covert and non-consultative use by families is a documented pattern.** In GPS-tracking research, many family caregivers consented quickly on the person's behalf without considering the person's own preferences, and few involved the person in the decision, despite their obligation as substitute decision-makers to align with the person's values. Recommendation: the decision whether/when/how to use tracking should be made **at the time of diagnosis, jointly** by the person, family and professionals, and **no one should be coerced into using tracking technology**.
- Landau R, Werner S (2012). *Ethical aspects of using GPS for tracking people with dementia: recommendations for practice.* International Psychogeriatrics 24(3):358–366 — https://pubmed.ncbi.nlm.nih.gov/22014284/
- *The Ethics of Electronic Tracking Devices in Dementia Care: An Interview Study with Developers.* (2024) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11078786/
- *Ethical perspectives on GPS tracking for people with dementia: insights from an online citizens' jury.* BMC Medical Ethics (2026) — https://link.springer.com/article/10.1186/s12910-026-01423-5

**AgeTech as a vector for abuse.** Monitoring/tracking of older relatives is widely assumed to be lawful and is therefore under-scrutinised; technology-facilitated coercive control uses exactly these tools (location, smart home, remote control) to isolate and control. One documented caregiver approach: blocking exits and installing cameras throughout the home.
- Kohn N (2025). *AgeTech Is Transforming Eldercare But Risks Abusive Surveillance.* Forbes — https://www.forbes.com/sites/ninakohn/2025/09/02/agetech-is-transforming-eldercare-but-risks-abusive-surveillance/
- Alzheimer's Association, *Technology Safety for Older Adults* — https://www.alz.org/help-support/caregiving/safety/technology-safety-older-adults

**Scoping/overview reviews confirm ethics is systematically under-addressed** in home monitoring and assistive technology for cognitive impairment.
- *Ethical considerations in home monitoring technologies for persons living with cognitive impairment: a scoping review.* The Gerontologist (2026) — https://academic.oup.com/gerontologist/article-abstract/66/3/gnaf261/8339763
- Scerri A, Schou Juul F, Silva R et al. (2026). *Ethical issues associated with assistive technologies for persons living with dementia and their caregivers — an overview of reviews.* Dementia — https://journals.sagepub.com/doi/10.1177/14713012251341374
- Alzheimer Europe (2010). *The ethical issues linked to the use of assistive technology in dementia care* — https://www.alzheimer-europe.org/resources/publications/2010-alzheimer-europe-report-ethical-issues-linked-use-assistive-technology
- Alzheimer Europe / EWGPWD & EDCWG, *Discussion paper and guidelines for the ethical use of technology for and by people with dementia* — https://www.alzheimer-europe.org/resources/publications/discussion-paper-and-guidelines-ethical-use-technology-and-people-dementia

---

### 3. Failure, distress, and confronting people with their deficits

**Catastrophic reaction.** An overreaction to minor stress presenting as sudden anger, verbal or physical aggression. Documented precipitants include **fatigue, overstimulation, inability to meet expectations, and persistent misinterpretations**. A memory quiz that a person keeps failing hits three of four precipitants directly.
- American College of Health Care Administrators, *Catastrophic Reactions and Aging* — https://www.achca.org/index.php?option=com_dailyplanetblog&view=entry&category=aging&id=101:catastrophic-reactions-and-aging
- Indiana Dept of Health, Nurse Aide Curriculum, Lesson 21: Cognitive Impairment/Dementia/Alzheimer's — https://www.in.gov/health/files/Indiana_Nurse_Aide_Curriculum_Lessons_21-25.pdf

**Repeated disclosure of distressing truth causes harm.** In a survey of 508 Japanese care managers (72.6% response), among those who had disclosed a spouse's death to a person with dementia, **18.4% reported worsening BPSD** and **26.0% reported worsening depression**. Notably ~83% held pro-disclosure *attitudes* but ~44% disclosed less than half the time — practitioners' behaviour diverges from their stated principle precisely because of observed harm.
- Kato Y, Nakazawa E, Mori K, Akabayashi A (2023). *Disclosure of Spousal Death to Patients with Dementia: Attitude and Actual Behavior of Care Managers.* Eur J Investig Health Psychol Educ — https://pmc.ncbi.nlm.nih.gov/articles/PMC9955679/

Because the person cannot consolidate the new memory, **each disclosure is experienced as fresh loss**. Reality orientation is not recommended as a primary approach in moderate-to-severe dementia because repeated correction is experienced as confrontation.

**Anosognosia is the norm, and awareness predicts depression.** ~60% of MCI and ~81% of Alzheimer's dementia patients show some anosognosia. Longitudinally, **greater awareness of deficit predicted onset of depression and "emotional deficit" (including anxiety) at ~16 months.** This is the sharpest finding in this section: an app whose core loop *increases the person's awareness of their own memory failure* is plausibly increasing depression risk.
- StatPearls, *Anosognosia* — https://www.ncbi.nlm.nih.gov/books/NBK513361/
- Gerretsen P et al. / Vannini P et al. (2021). *Anosognosia in Mild Cognitive Impairment: Lack of Awareness of Memory Difficulties Characterizes Prodromal Alzheimer's Disease* — https://pmc.ncbi.nlm.nih.gov/articles/PMC8044313/
- *The association between anosognosia and neuropsychiatric symptoms in neurodegenerative dementias: a narrative review.* Front Neurol (2025) — https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2025.1649627/full

**Errorless learning: right ethics, unproven efficacy advantage.** The rationale is that people with AD cannot use impaired explicit memory to detect and correct errors, so errors get implicitly consolidated. But the definitive trial found no superiority.
- REDALI-DEM: Voigt-Radloff S et al. (2017). *Structured relearning of activities of daily living in dementia: the randomized controlled REDALI-DEM trial on errorless learning.* Alzheimer's Research & Therapy. n=161 randomised, MMSE 14–24, mild-to-moderate AD/mixed. Both arms improved from baseline (EL d=0.61, TEL d=0.47 on Task A) but **"no significant differences between the treatment groups were found for primary or secondary outcomes."** Serious adverse events (4 EL / 5 TEL) judged unrelated to treatment; **no dropouts attributed to treatment-related distress** — https://pmc.ncbi.nlm.nih.gov/articles/PMC5364615/

**Reminiscence therapy: safe for the person, but see the carer finding below.** The Cochrane review found **no evidence of harmful effects on people with dementia**, while flagging that not all autobiographical memories are pleasant and that negative impact needs monitoring.
- Woods B, O'Philbin L, Farrell EM, Spector AE, Orrell M (2018). *Reminiscence therapy for dementia.* Cochrane Database Syst Rev CD001120 — https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/full

---

### 4. Caregiver dynamics: pressure, guilt, conflict

**The single most important trial for us is a negative one for carers.** REMCARE — a pragmatic multicentre RCT of *joint* reminiscence groups (person with dementia + family carer together, which is structurally what our app creates) — found **no support for effectiveness or cost-effectiveness**, and carers in the intervention arm reported a **significant increase in anxiety at 10 months (GHQ-28 subscale, mean difference 1.25, 95% CI 0.25–2.26, F=8.28, p=0.04)**. The authors' conclusion: any benefit to attendees "must be viewed in the context of raised anxiety and stress in their carers."
- Woods B, Russell I, Hoare Z et al. (2012). *REMCARE: reminiscence groups for people with dementia and their family caregivers — effectiveness and cost-effectiveness pragmatic multicentre randomised trial.* Health Technology Assessment 16(48) — https://www.journalslibrary.nihr.ac.uk/hta/HTA16480 and https://www.ncbi.nlm.nih.gov/books/NBK115063/
- Woods RT et al. (2016). *REMCARE: Pragmatic Multi-Centre Randomised Trial…* — https://pmc.ncbi.nlm.nih.gov/articles/PMC4836678/

**Guilt is a live clinical variable, not a motivational lever.** Longitudinally, greater guilt in adult-child caregivers was associated with **increased depressive symptoms**; caregivers driven by duty, guilt or societal expectation are more prone to isolation and psychological distress; perceived inability to provide optimal care is itself a major source of emotional burden and guilt.
- *Discrete Emotions, Depressive Symptoms, and Caregiver Burden in Adult Children of Parents with Cognitive Change* — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12763109/
- Losada A et al. (2021). *The emotional experience of caregiving in dementia: Feelings of guilt and ambivalence underlying narratives of family caregivers.* — https://pubmed.ncbi.nlm.nih.gov/33530724/
- *A qualitative study on the subjective experience of prolonged care among family members of patients with moderate to severe dementia* — https://pmc.ncbi.nlm.nih.gov/articles/PMC12042549/

**What actually helps carers is expectation-adjustment, not effort-escalation.** Qualitative work on psychoeducational interventions found the mechanism of change was carers learning to *change their expectations* and worry less about the future — the opposite of a dashboard showing a declining score.
- *A qualitative exploration of changes and mechanisms of changes in a psychoeducational intervention for family dementia caregivers* — https://pmc.ncbi.nlm.nih.gov/articles/PMC11437664/

**Therapeutic misconception affects surrogates too.** Families making decisions on behalf of a relative are vulnerable to interpreting research/intervention participation through a clinical-care schema — i.e. believing it is treatment. Mitigation requires explicitly challenging that cognitive frame, not merely disclosing it in fine print.
- Christensen K et al. / *When Does Therapeutic Misconception Affect Surrogates' or Subjects' Decision Making about Whether to Participate in Dementia Research?* AMA Journal of Ethics (2017) — https://journalofethics.ama-assn.org/article/when-does-therapeutic-misconception-affect-surrogates-or-subjects-decision-making-about-whether/2017-07
- *Ethical challenges in preclinical Alzheimer's disease observational studies and trials: results of the Barcelona summit* — https://pmc.ncbi.nlm.nih.gov/articles/PMC4861656/

---

### 5. Data rights when the subject cannot exercise them

**There is no statutory proxy SAR mechanism.** ICO guidance is explicit that **no provision in the UK GDPR, MCA 2005, MCA (NI) 2016 or AWI (Scotland) 2000 enables a third party to make a subject access request on behalf of a person lacking capacity**; the workable route is an attorney under an LPA or a court-appointed deputy, who may also give GDPR consent.
- ICO, *How do we recognise a subject access request (SAR)?* — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/right-of-access/how-do-we-recognise-a-subject-access-request-sar/
- ICO, *A guide to individual rights* — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/

**Implication:** consent is a *weak* lawful basis here (it must be freely given, and a person lacking capacity cannot freely give it, while a carer generally cannot give it for them). Plan for legitimate interests / public task (research) with a DPIA, plus consent-like ceremonial UX for dignity — and never let the UX imply the patient consented when they did not.

**Commercial terms of use undermine informed consent in mHealth.** Users are routinely required to accept lengthy legalese that may permit data release or sale — a structural departure from informed consent norms.
- Rothstein MA et al. (2018). *How Could Commercial Terms of Use and Privacy Policies Undermine Informed Consent in the Age of Mobile Health?* AMA Journal of Ethics — https://journalofethics.ama-assn.org/article/how-could-commercial-terms-use-and-privacy-policies-undermine-informed-consent-age-mobile-health/2018-09

**Secondary use / AI training consent is an open gap.** Traditional consent assumes a bounded study with an endpoint; AI training creates ongoing, evolving uses. "Meta-consent" (letting people pre-state their preferences about categories of future use) has proof-of-concept support.
- Ploug T, Holm S (2017). *Eliciting meta consent for future secondary research use of health data using a smartphone application.* — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5558710/
- *Citizens, Research Ethics Committee Members and Researchers' Attitude Toward Information and Consent for the Secondary Use of Health Data* — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8236664/

---

### 6. Research ethics for the doctor/researcher surface

- Research that is *intrusive* and involves people lacking capacity requires REC approval as an "appropriate body" under MCA s.30–31, must relate to the impairing condition, and must not be equally achievable with capacitous participants (HRA, above).
- Under the Common Rule, research involving cognitively impaired individuals that is greater than minimal risk requires **full board review**, and additional safeguards must be documented where subjects are vulnerable to coercion or undue influence (45 CFR 46; NIH 3014-301, above).
- **Re-consent triggers** (synthesised from HRA + West 2017 + David 2024): loss of capacity after initial consent (needs s.30 approval + consultee advice to continue; otherwise withdraw and destroy/anonymise data); material change of purpose (e.g. new outcome, new data recipient, commercial sharing); change of consultee; and — for process-consent integrity — at each new data-collection modality.
- **Aggregate/researcher analytics on identifiable patients is a separate consent object** from "the patient uses the app". Do not bundle.

---

### 7. Marketing hope: the specific hazard

**Lumosity / FTC (Jan 2016).** Lumos Labs settled charges that it deceived consumers with unfounded claims that its games improve performance at work and school and **"reduce or delay cognitive impairment associated with age and other serious health conditions."** $2M redress; a $50M judgment suspended on financial condition; obligation to notify and allow easy cancellation for subscribers 2009–2014; and, going forward, **human clinical testing required before broad cognition claims**. FTC's Jessica Rich: *"Lumosity preyed on consumers' fears about age-related cognitive decline, suggesting their games could stave off memory loss, dementia, and even Alzheimer's disease."* The complaint also charged failure to disclose that testimonials were solicited through prize contests.
- FTC (2016). *Lumosity to Pay $2 Million to Settle FTC Deceptive Advertising Charges for Its "Brain Training" Program* — https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program
- FTC case file, *Lumos Labs, Inc.* — https://www.ftc.gov/legal-library/browse/cases-proceedings/132-3212-lumos-labs-inc-lumosity-mobile-online-cognitive-game
- FTC business blog (2016). *Mind the gap: What Lumosity promised vs. what it could prove* — https://www.ftc.gov/business-guidance/blog/2016/01/mind-gap-what-lumosity-promised-vs-what-it-could-prove

**Scientific consensus against brain-training claims.** Stanford Center on Longevity + Max Planck Institute for Human Development gathered leading cognitive psychologists and neuroscientists, concluding claims are "frequently exaggerated and at times misleading" and that such claims **"exploit the anxiety of adults facing old age for commercial purposes."**
- Stanford Center on Longevity & Max Planck Institute for Human Development (2014). *A Consensus on the Brain Training Industry from the Scientific Community* — https://longevity.stanford.edu/a-consensus-on-the-brain-training-industry-from-the-scientific-community/ (full statement: https://longevity.stanford.edu/a-consensus-on-the-brain-training-industry-from-the-scientific-community-2)
- Note there is a substantive counter-statement from the industry side: https://www.brainhq.com/longevityresponse/ — read both; the dispute is about the strength of transfer evidence, not about whether marketing overreach occurred.

**FTC/FDA enforcement extends to any Alzheimer's claim.** Joint warning letters (Feb 2019) targeted products claiming to treat Alzheimer's; the standard is that it is illegal to advertise prevention/treatment/cure of a disease **without competent and reliable scientific evidence, which for Alzheimer's means well-controlled human clinical studies.**
- FTC (2019). *FTC and FDA Send Warning Letters to Companies Selling Dietary Supplements Claiming to Treat Alzheimer's Disease…* — https://www.ftc.gov/news-events/news/press-releases/2019/02/ftc-fda-send-warning-letters-companies-selling-dietary-supplements-claiming-treat-alzheimers-disease
- FDA, *Watch Out for False Promises About So-Called Alzheimer's Cures* — https://www.fda.gov/consumers/consumer-updates/watch-out-false-promises-about-so-called-alzheimers-cures

---

### 8. Safeguarding

**Care Act 2014 (England).** A statutory safeguarding duty applies to any adult over 18 who, because of care and support needs, cannot protect themselves from abuse or the risk of it; the Act strengthened organisational duties to share information when requested by a Safeguarding Adults Board.
- *Elder abuse and adult safeguarding.* Medicine (2020) — https://www.sciencedirect.com/science/article/abs/pii/S135730392030267X
- MDT members are well placed to identify risk factors for or evidence of elder abuse (ibid.).

**Honest position on the app's duty:** we found **no evidence base and no established regulatory framework** for a consumer app that infers abuse, neglect or rapid decline from usage telemetry. There is no mandatory-reporter status for an app developer in England & Wales (unlike, e.g., California's mandated reporter law for care custodians — https://oag.ca.gov/sites/all/files/agweb/pdfs/bmfea/yld_text.pdf). Screening for elder abuse is itself an immature science with acknowledged research gaps.
- *Screening and detection of elder abuse: Research opportunities and lessons learned from emergency geriatric care, intimate partner violence, and child abuse.* — https://pmc.ncbi.nlm.nih.gov/articles/PMC7339956/

Therefore: **do not build an abuse-detection classifier.** Build a *disclosure route* and an *escalation policy for human-reviewed signals*. Automated inference of abuse from a memory app's telemetry is (c) plausible mechanism only, with high false-positive cost (destroying a family relationship, or triggering a safeguarding referral that removes someone's home care).

---

## Evidence quality assessment

| Claim | Grade | Basis | Population |
|---|---|---|---|
| Capacity is decision-specific, presumed, and fluctuates | **(a) proven / settled law** | Statute + HRA guidance | All |
| Process consent > one-time consent in dementia research | **(a)** | Systematic review (West 2017, 29 studies) + expert consensus | Mild–moderate dementia |
| Dissent must be respected regardless of consultee advice | **(a) legal requirement** | MCA s.33 | Lacking capacity |
| Joint carer+patient memory work raises carer anxiety | **(a)** — single well-powered pragmatic RCT, p=0.04, small effect | REMCARE, n≈488 dyads | Mild–moderate dementia + family carer |
| Repeated distressing disclosure worsens BPSD/depression | **(b)** — retrospective self-report by care managers, no control group, Japan | Kato 2023, n=508 CMs | Mild–severe |
| Awareness of deficit predicts later depression | **(b)** — longitudinal observational | Anosognosia literature | MCI + AD dementia |
| Errorless learning is *superior* to errorful learning for ADLs | **(d) not supported** | REDALI-DEM RCT n=161, null | Mild–moderate AD (MMSE 14–24) |
| Errorless/failure-avoidant design is *safe and acceptable* | **(a)** | REDALI-DEM: no distress-related dropouts; Cochrane RT: no harm to PwD | Mild–moderate |
| Reminiscence content is safe for the person with dementia | **(a)** | Cochrane 2018 — no evidence of harm | Mild–moderate, some severe |
| Family monitoring can become coercive control | **(b/c)** — documented qualitative patterns and legal commentary; no incidence estimates | Older adults incl. dementia |
| Telemetry can reliably detect abuse/neglect | **(c) plausible mechanism only** — no validated instrument | — |
| Brain-training marketing claims exploit fear and are legally actionable | **(a)** | FTC enforcement + scientific consensus statement | Healthy older adults primarily |

**Populations are NOT interchangeable.** REMCARE and REDALI-DEM are mild-to-moderate *dementia*. The anosognosia depression finding spans MCI and AD dementia. FTC/Stanford consensus concerns *healthy older adults*. A person with MCI who has full capacity and full insight is in a completely different ethical position from a person with moderate dementia and anosognosia — and our product will have both.

**What we could not establish:** we found no RCT, and no regulatory guidance, on (i) caregiver-authored personal content used as spaced-repetition material, (ii) caregiver dashboards showing longitudinal cognitive decline to family members, or (iii) app-mediated safeguarding escalation. These are genuinely novel and should be treated as such in any REC/IRB submission.

---

## DIRECT DESIGN IMPLICATIONS

### A. Consent and enrolment

1. **DO** make the patient a first-class account holder with their own identity, not a "profile" inside the caregiver's account. The data subject must exist as a subject in the data model.
2. **DO** run a capacity-aware enrolment fork at setup with three explicit paths: (i) **patient consents directly** (default; presume capacity); (ii) **patient consents with support** — caregiver reads/explains, patient decides; (iii) **patient lacks capacity for this decision** — caregiver acts as *consultee/LAR*, and the app records **who they are, their relationship, whether they are paid, and their basis for believing this is what the person would want**. Paid carers cannot be personal consultees.
3. **NEVER** allow the caregiver to tick a box asserting the patient consented. The caregiver path must be visibly labelled "advice on what [name] would have wanted", not "consent".
4. **DO** implement re-affirmation on a schedule: a lightweight, dignified "Is it OK to carry on doing these together?" at first session, then at a fixed cadence (e.g. every 30 days) and at every material change. Log each affirmation as a first-class consent event. This is the Dewing process-consent model in software.
5. **DO** treat behavioural dissent as withdrawal. Define machine-readable dissent signals: closing/abandoning ≥N consecutive sessions, repeated skips of the same item, a "Not today" / "I don't want to" control always present on screen, and any caregiver-flagged distress. On dissent: **pause the schedule, notify the caregiver, do not auto-resume.**
6. **NEVER** let the caregiver override a patient's expressed objection to a session, an item, or the whole product. Hard-code MCA s.33: nothing to which the participant appears to object.
7. **DO** support capacity fluctuation: capacity status is a dated record with a review date, not a permanent flag. Re-prompt at review.
8. **DO** capture an **advance preferences** record at enrolment while capacity is best: which relatives may see data, what content is off-limits, whether they want to be told about deaths, whether they consent to research use later. This is the single highest-value thing to collect on day one and it degrades gracefully.

### B. Never confront the person with their own decline

9. **NEVER** show the patient a score, a percentage correct, a streak-broken message, a "you got this wrong last time", a leaderboard, or a declining trend line. The core harm mechanism is increasing awareness of deficit, which predicts depression, and creating "inability to meet expectations", which precipitates catastrophic reactions.
10. **DO** design the patient loop to be failure-tolerant by construction: cue-first / recognition-before-recall, progressive prompting, and an outcome vocabulary the patient never sees as binary right/wrong. Frame everything as *looking at* rather than *being tested on*. (Note honestly: errorless design is chosen for dignity and distress-avoidance, **not** because it is proven to produce better learning — REDALI-DEM found no advantage.)
11. **NEVER** let an item that produced distress return on schedule. Distress must be an absorbing state for that item until a human explicitly re-enables it. The scheduler must have a "retire on distress" path that is stronger than any SRS interval logic.
12. **DO** cap session length and give an always-available graceful exit that reads as completion, not abandonment ("That's a lovely place to stop"). Fatigue and overstimulation are documented catastrophic-reaction triggers.
13. **NEVER** correct the patient about factual reality (who is alive, where they live, what year it is) inside the app. If they say something factually wrong, accept it.

### C. Deceased, estranged, and painful people

14. **DO** require a per-person status field on every human in the content library: `living / deceased / estranged / do-not-show`, plus a free-text "how [name] refers to them".
15. **NEVER** surface a deceased person in a way that implies they are alive *or* that discloses the death. No "Where does X live now?", no "When did you last see X?", no memorial framing. Bereavement disclosure caused worsening BPSD in 18.4% and worsening depression in 26.0% of care-manager-reported cases — and because the memory does not consolidate, it is re-experienced each time.
16. **DO** default new deceased-person content to **off**, requiring an explicit caregiver decision plus (where capacity allows) the patient's own advance preference.
17. **DO** provide a one-tap **"Never show this again"** on every item, available to *both* patient and caregiver, with no confirmation dialogue and no explanation required.
18. **DO** allow content to be scoped away from a specific relative (estrangement, divorce, family rift) without deleting it — a `visible_to` list, not a delete.
19. **DO** warn caregivers at content-entry time that autobiographical material is not uniformly pleasant (Cochrane's explicit caveat) and prompt them to consider whether each item could evoke grief, shame or trauma.

### D. The caregiver dashboard: the highest-risk surface we will build

20. **NEVER** ship a caregiver-facing cognitive decline chart. It is a decline visualisation aimed at the person most vulnerable to guilt and anxiety, and the closest evidence we have (REMCARE) shows a *joint memory intervention significantly increased carer anxiety with no patient benefit*. If a clinician needs trend data, put it behind the clinician surface.
21. **NEVER** use streaks, adherence percentages, missed-day counters, red states, or nudges of the form "[Patient] hasn't practised in 5 days" to the caregiver. Guilt is longitudinally associated with caregiver depressive symptoms; we would be weaponising the mechanism.
22. **DO** invert the caregiver dashboard: report *what happened that was good* (moments of recognition, items enjoyed, a photo they lingered on) and *what to change* (retire this item, add more from this era). Give the carer something to do that is not "make them do more".
23. **DO** set expectations downward at onboarding — the mechanism of benefit in caregiver psychoeducation is *changing expectations*, not increasing effort. Include an explicit "this will not stop the disease" screen (see F).
24. **DO** show the patient, in patient-appropriate language, **who can see what** — and give them a control to reduce it. Transparency without stigma is a stated best-practice criterion for surveillance tech.
25. **DO** make the monitoring surface proportionate and reviewable: minimum viable telemetry, automatic purge schedules, a documented re-evaluation when the person's status changes, and a written justification captured at setup for why monitoring is in the person's interest.
26. **NEVER** implement covert or invisible monitoring modes. Nothing may be observable by the caregiver that is not disclosed to the patient in the patient UI. This is the single clearest line between assistive technology and technology-facilitated coercive control.
27. **DO** support multiple caregivers with differentiated permissions, and support **removing** a caregiver at the patient's request. A single all-powerful caregiver account is an abuse architecture.

### E. Safeguarding

28. **DO NOT** build automated abuse/neglect detection. There is no validated instrument, and false positives are catastrophic (safeguarding referral, family rupture, loss of care).
29. **DO** build a passive **disclosure route**: a persistent, plainly-worded "Something's wrong / I need help" affordance in the patient UI and a "I'm not coping" affordance in the caregiver UI, both routing to real signposting (Alzheimer's Society, local adult safeguarding, 999) rather than to us.
30. **DO** define, before pilot, a written **escalation policy** covering: (i) a direct disclosure of harm by patient or caregiver; (ii) content uploaded that itself evidences harm; (iii) a clinician's request for data. Name the accountable human, the timeframe, and the threshold. Publish it.
31. **DO** state prominently, in product and in contract, that **the app is not a monitoring or emergency service** and does not observe the person's safety. Anything else invites reliance we cannot honour.
32. **DO** flag *rapid change* to the clinician surface only where a clinician is enrolled, framed as "worth a conversation", never as a diagnosis, and never surfaced to the patient.

### F. Marketing and claims — hard rules

33. **NEVER** claim, imply, or allow a testimonial to imply that the app slows, delays, prevents, treats or reverses dementia, Alzheimer's or cognitive decline. This is the exact conduct the FTC penalised, and the substantiation bar is well-controlled human clinical studies we do not have.
34. **NEVER** use the words "clinically proven", "brain training", "cognitive enhancement", or "protect their memory" in consumer-facing copy without a specific trial to point at.
35. **DO** state plainly, on the landing page and in onboarding: *"This will not slow the disease. It is designed to create good moments with familiar faces and stories, and to be gentle if memory doesn't come."* Under-promise deliberately — it is both the honest position and the only defensible one.
36. **NEVER** solicit testimonials with incentives without disclosing it (a specific FTC charge in the Lumosity complaint).
37. **DO** treat therapeutic misconception as a design problem, not a disclaimer problem. Families will read "memory training" as "treatment". Break the frame explicitly at the moment of purchase and again at enrolment, in the caregiver's own words back to us if possible ("In your words, what do you hope this does?" → correct the frame if needed).
38. **NEVER** target advertising at recently diagnosed families or bereavement-adjacent audiences.

### G. Data rights

39. **DO** designate a **data rights delegate** at enrolment (attorney/deputy where one exists; otherwise the consultee) and record the legal basis — noting honestly that UK GDPR has no proxy-SAR mechanism, so this is our own governance, not a statutory one.
40. **DO** provide a full export and a full delete that the delegate can execute, and honour a patient's own erasure request even where the caregiver objects, unless a legal retention obligation applies.
41. **DO** use a lawful basis that does not depend on the patient's consent for core processing (legitimate interests / public task for research), with a DPIA, **and separately** obtain granular, revocable consent-or-consultee-advice for: research use, aggregate analytics, clinician access, and any model training. Never bundle these.
42. **NEVER** sell, share for advertising, or train third-party models on family photos, voice recordings of relatives, or life-event content. Voice recordings of relatives are biometric-adjacent, often of people who are not our users and have never consented — obtain consent from the *recorded relative* too.
43. **DO** build a meta-consent style preferences page for future secondary use rather than a one-time blanket permission.

### H. Research surface

44. **DO** obtain REC/IRB approval before any study data collection, and expect full-board review because the population is cognitively impaired.
45. **DO** implement re-consent triggers in code: capacity loss (→ pause research collection, seek consultee advice, or withdraw and anonymise), consultee change, purpose change, new data recipient. Make "withdraw and anonymise" a real, tested code path — HRA guidance makes it the fallback when s.30 approval is absent.
46. **DO** keep the research dataset logically separable from the care dataset so withdrawal from research does not degrade the person's app experience — otherwise withdrawal is coerced.
47. **DO** log a distress/adverse-event register from day one of the pilot. Given that our intervention repeatedly probes memory, distress is our foreseeable adverse event and a REC will ask how we count it.

---

## Open questions

1. **Is a caregiver-visible longitudinal performance view ever defensible?** Our reading of REMCARE says no by default. But clinicians may need it and some carers may find it validating. Proposal: default off, patient-controlled, clinician-gated. Needs a decision.
2. **Who owns the "distress" judgement?** The app can detect abandonment and skips; it cannot detect tears. Do we require caregiver co-presence for the first N sessions to calibrate? That has its own cost (carer burden).
3. **What happens when the caregiver *is* the problem?** We have designed a removal path (rule 27) but not an adjudication path. If a patient with impaired capacity asks to remove the caregiver who is also their consultee, who decides? This likely needs a named safeguarding lead and a documented policy, not code.
4. **Jurisdiction.** MCA 2005 (England & Wales), AWI 2000 (Scotland), MCA (NI) 2016, and the US Common Rule/LAR framework differ materially. Which do we build to for the pilot? Building to the strictest (MCA + process consent) is the safe default but adds friction.
5. **Voice recordings of relatives** — is the recorded relative a data subject with their own rights? Almost certainly yes. Do we need their consent, and what happens when they withdraw it and the patient has come to depend on the recording?
6. **Deceased-person content when the patient explicitly asks for it.** If a person with dementia asks to see their late spouse, refusing is also a harm (paternalism, loss of comfort). The evidence is about *disclosure of death*, not about *seeing the face*. Design proposal: allow the face and voice, never the death. Needs clinical review.
7. **Do we need a clinician in the loop for pilot at all?** Ethically it strengthens us considerably (safeguarding route, capacity assessment, adverse event review). Commercially it slows us. Recommend: yes, at least one named clinical advisor with a defined escalation role.
8. **Post-mortem / post-decline data.** What happens to the account when the person dies or moves to residential care? Families will want the content. GDPR rights lapse at death in the UK; our own policy must be written in advance.
9. **We could not verify the Nuffield Council's six-component ethical framework verbatim** from an accessible primary source; we did verify its four-factor tool for weighing wellbeing against autonomy (importance of the issue; current distress or pleasure; whether underlying values have genuinely changed; whether preference change stems from psychosocial factors or the dementia itself) via Knüppel et al. 2013 (https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001498). Someone should read the full Nuffield report (https://www.nuffieldbioethics.org/publication/dementia-ethical-issues/) before we cite it in any regulatory submission.

---

## Sources

- Alzheimer Europe (2010). *The ethical issues linked to the use of assistive technology in dementia care* — https://www.alzheimer-europe.org/resources/publications/2010-alzheimer-europe-report-ethical-issues-linked-use-assistive-technology
- Alzheimer Europe (2020). *Legal capacity and decision making* (summary) — https://www.alzheimer-europe.org/sites/default/files/2021-11/Alzheimer%20Europe%20summary%20on%202020%20Report%20Legal%20capacity%20and%20decision%20making%20summary.pdf
- Alzheimer Europe / EWGPWD & EDCWG. *Discussion paper and guidelines for the ethical use of technology for and by people with dementia* — https://www.alzheimer-europe.org/resources/publications/discussion-paper-and-guidelines-ethical-use-technology-and-people-dementia
- Alzheimer's Association. *Technology Safety for Older Adults* — https://www.alz.org/help-support/caregiving/safety/technology-safety-older-adults
- Alzheimer's Society. *Dementia and the Mental Capacity Act 2005* — https://www.alzheimers.org.uk/get-support/legal-financial/dementia-mental-capacity-act
- Black BS et al. (2010). *Seeking assent and respecting dissent in dementia research* — https://pubmed.ncbi.nlm.nih.gov/20094021/
- David MCB et al. (2024). *Considerations for legal, ethical, and effective practice in dementia research.* Brain Commun 6(4):fcae211 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11231934/
- Dewing J (2008). *Process Consent and Research with Older Persons Living with Dementia* — https://journals.sagepub.com/doi/10.1177/174701610800400205
- eCFR. *45 CFR Part 46 — Protection of Human Subjects* — https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-46
- Evans CJ et al. (2020). *MORECare_Capacity statement.* BMC Medicine — https://pmc.ncbi.nlm.nih.gov/articles/PMC7374835/
- FDA. *Watch Out for False Promises About So-Called Alzheimer's Cures* — https://www.fda.gov/consumers/consumer-updates/watch-out-false-promises-about-so-called-alzheimers-cures
- FTC (2016). *Lumosity to Pay $2 Million…* — https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program
- FTC (2016). *Mind the gap: What Lumosity promised vs. what it could prove* — https://www.ftc.gov/business-guidance/blog/2016/01/mind-gap-what-lumosity-promised-vs-what-it-could-prove
- FTC (2019). *FTC and FDA Send Warning Letters…Alzheimer's Disease* — https://www.ftc.gov/news-events/news/press-releases/2019/02/ftc-fda-send-warning-letters-companies-selling-dietary-supplements-claiming-treat-alzheimers-disease
- Health Research Authority. *Mental Capacity Act* — https://www.hra.nhs.uk/planning-and-improving-research/policies-standards-legislation/mental-capacity-act/
- ICO. *Right of access / recognising a SAR* — https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/right-of-access/how-do-we-recognise-a-subject-access-request-sar/
- Kato Y, Nakazawa E, Mori K, Akabayashi A (2023). *Disclosure of Spousal Death to Patients with Dementia* — https://pmc.ncbi.nlm.nih.gov/articles/PMC9955679/
- Knüppel H, Mertz M, Schmidhuber M, Neitzke G, Strech D (2013). *Inclusion of Ethical Issues in Dementia Guidelines: A Thematic Text Analysis.* PLOS Medicine — https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001498
- Kohn N (2025). *AgeTech Is Transforming Eldercare But Risks Abusive Surveillance.* Forbes — https://www.forbes.com/sites/ninakohn/2025/09/02/agetech-is-transforming-eldercare-but-risks-abusive-surveillance/
- Lahr J et al. (2025). *Ethics of Sensor-Based Surveillance of People with Dementia in Clinical Practice.* Sensors 25(7):2252 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11990963/
- Landau R, Werner S (2012). *Ethical aspects of using GPS for tracking people with dementia* — https://pubmed.ncbi.nlm.nih.gov/22014284/
- Losada A et al. (2021). *The emotional experience of caregiving in dementia* — https://pubmed.ncbi.nlm.nih.gov/33530724/
- NIH Policy Manual 3014-301. *Informed Consent* — https://policymanual.nih.gov/3014-301
- Nuffield Council on Bioethics (2009). *Dementia: ethical issues* — https://www.nuffieldbioethics.org/publication/dementia-ethical-issues/
- Rothstein MA et al. (2018). *How Could Commercial Terms of Use and Privacy Policies Undermine Informed Consent in the Age of Mobile Health?* — https://journalofethics.ama-assn.org/article/how-could-commercial-terms-use-and-privacy-policies-undermine-informed-consent-age-mobile-health/2018-09
- Scerri A et al. (2026). *Ethical issues associated with assistive technologies for persons living with dementia and their caregivers — an overview of reviews.* Dementia — https://journals.sagepub.com/doi/10.1177/14713012251341374
- Scholten M, Gather J, Vollmann J (2020). *Dementia, Treatment Decisions, and the UN CRPD.* Front Psychiatry 11:571722 — https://pmc.ncbi.nlm.nih.gov/articles/PMC7680726/
- Stanford Center on Longevity & Max Planck Institute (2014). *A Consensus on the Brain Training Industry from the Scientific Community* — https://longevity.stanford.edu/a-consensus-on-the-brain-training-industry-from-the-scientific-community/
- StatPearls. *Anosognosia* — https://www.ncbi.nlm.nih.gov/books/NBK513361/
- Voigt-Radloff S et al. (2017). *REDALI-DEM trial on errorless learning.* Alzheimers Res Ther — https://pmc.ncbi.nlm.nih.gov/articles/PMC5364615/
- West E, Stuckelberger A, Pautex S, Staaks J, Gysels M (2017). *Operationalising ethical challenges in dementia research.* Age and Ageing 46(4):678–687 — https://academic.oup.com/ageing/article/46/4/678/2926037
- Woods B et al. (2012). *REMCARE.* Health Technology Assessment 16(48) — https://www.journalslibrary.nihr.ac.uk/hta/HTA16480
- Woods B, O'Philbin L, Farrell EM, Spector AE, Orrell M (2018). *Reminiscence therapy for dementia.* Cochrane Database Syst Rev CD001120 — https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD001120.pub3/full
- *Moving beyond 'safety' versus 'autonomy'.* BMC Geriatrics 19:184 (2019) — https://doi.org/10.1186/s12877-019-1155-6
- *Ethical considerations in home monitoring technologies for persons living with cognitive impairment: a scoping review.* The Gerontologist (2026) — https://academic.oup.com/gerontologist/article-abstract/66/3/gnaf261/8339763
- *Screening and detection of elder abuse* — https://pmc.ncbi.nlm.nih.gov/articles/PMC7339956/
- *Elder abuse and adult safeguarding* — https://www.sciencedirect.com/science/article/abs/pii/S135730392030267X
- *When Does Therapeutic Misconception Affect Surrogates' or Subjects' Decision Making about Whether to Participate in Dementia Research?* AMA J Ethics (2017) — https://journalofethics.ama-assn.org/article/when-does-therapeutic-misconception-affect-surrogates-or-subjects-decision-making-about-whether/2017-07
