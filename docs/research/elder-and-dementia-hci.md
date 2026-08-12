# HCI and Interface Design for Older Adults and People with Dementia

Research brief for a personal-content memory-training app (caregiver authoring / patient exercise / clinician analytics).
Compiled 2026-08-12. Scope: empirical HCI + clinical literature on interface design for ages 65+/80+, MCI, mild and moderate dementia.

**Population discipline note.** Throughout, I mark which population a finding comes from:
`[HOA]` healthy older adults, `[MCI]` mild cognitive impairment, `[MILD-DEM]` mild dementia, `[MOD-DEM]` moderate dementia,
`[MIXED]` mixed/unspecified severity. Evidence does **not** transfer freely between these. Most touch-target and vision numbers
come from `[HOA]`; most gesture-failure and distress findings come from `[MILD-DEM]`/`[MOD-DEM]`.

Evidence grades used: **(a) proven**, **(b) promising but underpowered**, **(c) plausible mechanism only**, **(d) disproven / no effect**.

---

## Summary (10 bullets)

1. **Tap is the only gesture you can rely on.** Direct single-tap on a large, static, visible target is learnable and retained by people with dementia. Drag is learnable for `[HOA]` but error-prone; rotate/pinch is effectively unlearnable for technology-naive older adults; swipe, long-press, and hidden-menu affordances have no discoverable signifier and fail. **(a)** for tap-superiority, **(b)** for the exact gesture ranking.
2. **Older adults' touch accuracy is far worse than the 44 px accessibility floor implies.** In adults aged ~82, double-tap took 18.2 s vs 8.4 s for middle-aged adults, with 1.9 vs 0.6 off-target errors; drag tasks needed 14.8 vs 8.1 attempts. Prior smartphone experience did *not* rescue performance. Design to **≥15 mm** targets minimum, **20 mm+** for primary actions, with **≥5 mm** dead space between them. **(a)**
3. **Contrast sensitivity loss in Alzheimer's is on top of, and separate from, normal ageing.** AD patients show depressed contrast sensitivity at all but the lowest spatial frequencies, worst at high frequencies. WCAG AAA 7:1 is the *floor*, not the target; add a 30-point Light Reflectance Value difference between adjacent large surfaces, following dementia-care built-environment standards. **(a)**
4. **Blue/green/violet discrimination degrades with lens yellowing.** Never encode meaning in blue-vs-green or in low-saturation pastels; never use lemon-yellow or orange text/content on light backgrounds. **(a)** for the perceptual change, **(b)** for the specific colour-preference recommendations.
5. **Failure feedback is the single biggest safety risk in this product class.** 16% of 146 AD patients exhibited a *catastrophic reaction* during a routine neuropsychological evaluation — i.e. during exactly the kind of tested-recall interaction this app performs. A "wrong" state must never be presented as failure. **(a)**
6. **But: "errorless learning" is not the magic bullet it is often sold as.** The largest RCT (REDALI-DEM, n=161) found errorless learning gave **no additional benefit over trial-and-error learning** for relearning daily activities; both structured conditions improved. **(d)** for EL's learning superiority in mild–moderate dementia; the case for error avoidance in our app is **affective/dignity-based**, not learning-based, and should be stated that way.
7. **People with dementia can learn new interfaces — partially, slowly, and only if the interface never changes.** Roughly half of early-stage dementia participants used an iPad independently over 7 days at home; no baseline trait predicted who would. Learning appears procedural, which imposes a hard requirement: identical layout, identical wording, identical position, every session, forever. **(b)**
8. **Indirect input (mouse, controller, cursor) is actively harmful.** In a 12-person comparative study `[MILD-DEM/MOD-DEM]`, indirect devices required significantly more assistance (P=.01), and one experienced participant cried and the experiment had to be stopped. Touch or nothing. **(a)** within this evidence base.
9. **Animation and motion are a liability, not a delight.** WCAG 2.3.3 (AAA) exists because interaction-triggered motion causes nausea and migraine; cybersickness appeared in 3 of 12 people with dementia in immersive conditions. Ban parallax, page-slide transitions, autoplay, and any decorative motion; honour `prefers-reduced-motion`. **(a)**
10. **Hearing is a co-morbidity you must design around, not an afterthought.** 55% of US adults 75+ have disabling hearing loss and fewer than 1 in 3 who could benefit have ever used a hearing aid; presbycusis hits >2 kHz hardest — exactly the 2–4 kHz consonant band. Never make audio the sole channel for anything. **(a)**

---

## Key findings with citations

### 1. Motor accuracy, touch targets, tremor

**1.1 Older adults are slower and less accurate on every touchscreen gesture, and experience does not fix it. `[HOA, 80+]` (a)**
Cross-sectional comparison of 28 older adults (mean 81.9 ± 4.2 y) vs 25 middle-aged adults (mean 53.4 ± 5.9 y) on the TATOO battery (touch whole screen, touch corners, double-tap, drag in all directions, drag along straight paths, pinch):
double-tap took ~18.2 s vs 8.4 s; touch-outside-target errors 1.9 vs 0.6; drag required 14.8 vs 8.1 attempts. Crucially, prior smartphone experience did not improve older adults' performance, which the authors attribute to musculoskeletal/nervous system ageing rather than unfamiliarity.
- Effect of Age on the Touchscreen Manipulation Ability of Community-Dwelling Adults (2021) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7924826/

**1.2 Touchscreen manipulation ability correlates with hand strength and manual dexterity. `[HOA]` (b)**
- Correlation between the Ability to Manipulate a Touchscreen Device and Hand Strength and Manual Dexterity among Community-Living Older Individuals (2021) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8431526/

**1.3 Target-size thresholds. `[HOA]` (a) for the direction, (b) for exact millimetres**
- Smartphone targets: hit rate ~80% at ~6 mm, approaching 100% at ~11 mm. Performance on mobile buttons improved as size increased **up to ~17.5 mm** (range tested 7.5–27.5 mm in 5 mm steps).
  - Touchscreen mobile devices and older adults: A usability study — https://www.researchgate.net/publication/264815431_Touchscreen_mobile_devices_and_older_adults_A_usability_study
  - Touch Screen User Interfaces for Older Adults: Button Size and Spacing (Jin, Plocher & Kiff) — https://www.researchgate.net/publication/225367546_Touch_Screen_User_Interfaces_for_Older_Adults_Button_Size_and_Spacing
- Large vertical touchscreen (65"): optimal button 30 mm for younger, **40 mm for older** participants; accuracy >97% across all sizes tested (10–50 mm), i.e. bigger buttons buy *speed and comfort*, not just accuracy.
  - Exploring Usability Disparities in Multi-touch Screen Interaction Among Older Adults and Younger Individuals — https://scholar.hit.edu.cn/en/publications/exploring-usability-disparities-in-multi-touch-screen-interaction/
- **Touch position bias is not uniform across the screen.** To hit 80% accuracy for older users, required touch-active area was ~**2.3 cm** in the left 25% of the screen vs ~**1.1 cm** in the central 50% — i.e. edge and off-hand-side targets need roughly double the area.
  - Optimization of Touch Active Area Size Based on Click Position Bias in Older Adults' Touchscreen Interaction (2024) — https://link.springer.com/chapter/10.1007/978-3-031-61543-6_15
- Physical basis: the average human fingertip contact patch is ~16–20 mm wide (MIT Touch Lab), and users with motor impairment show error rates up to ~75% higher on small targets.
  - Referenced in: WCAG 2.5.8 implementation guidance — https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide

**1.4 Tremor and arthritis prevalence in the target cohort. `[HOA]` (a)**
Essential tremor affects ~4.6% of adults 65+; Parkinson's disease ~1.8% of 65+. ET is a kinetic tremor that specifically degrades *accurate* movements — i.e. precisely the tap-a-small-target action.
- Causes of Tremor Other than Parkinson's, American Parkinson Disease Association — https://www.apdaparkinson.org/article/other-causes-of-tremor/
- New horizons in late-onset essential tremor: a pre-cognitive biomarker of dementia? (Age and Ageing, 2022) — https://academic.oup.com/ageing/article/51/7/afac135/6625704

**1.5 Standards floors (these are minimums, not goals).**
- WCAG 2.2 SC **2.5.8 Target Size (Minimum), AA**: ≥24 × 24 CSS px, with spacing escape hatches — https://www.w3.org/TR/WCAG22/
- WCAG 2.2 SC **2.5.5 Target Size (Enhanced), AAA**: ≥44 × 44 CSS px, **no spacing escape hatch** — https://www.w3.org/TR/WCAG22/
- Apple HIG: minimum tap target 44 × 44 **points** (≈ 8.8 mm on a standard-density iPhone) — https://developer.apple.com/design/human-interface-guidelines/accessibility (page is JS-rendered; corroborated by https://knowledge.evinced.com/mobile-validations/tappable-area)
- **Honest gap:** 44 pt ≈ 8.8 mm is *below* the ~11 mm near-100%-hit-rate threshold for healthy older adults and far below the ~17.5 mm plateau. Platform accessibility minimums are insufficient for this population.

### 2. Gesture comprehension — what is and is not understood

**2.1 Direct touch beats indirect input, decisively, and indirect input can cause distress. `[MILD-DEM/MOD-DEM]` (a)**
Comparative observational study, n=12, mean age 75.1, **mean MMSE 17.33 (SD 5.79)** — mild-to-moderate dementia. Only 6 of 12 completed all conditions; 4 withdrew or could not complete tasks. Participants required significantly more assistance with indirect interaction devices than direct ones (P=.01). Mouse use produced "great difficulties in understanding how to use it" (cursor mapping/tracking); **one experienced participant cried and the experiment had to be stopped.** Tablets showed unintended multi-touch activation and involuntary device movement. HMD produced cybersickness in 3 participants.
Recommendations from the authors: disable unnecessary buttons, prefer single-function controls, physically fix the tablet to a surface.
- User Experience of Interactive Technologies for People With Dementia: Comparative Observational Study (JMIR, 2020) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7439148/

**2.2 Gesture learnability ranking for technology-naive older adults. `[HOA]` (b)**
- Tap: easy to learn immediately.
- Drag: relatively high learnability and the skill **transfers across applications**.
- Rotate: low learnability — most participants showed **no improvement at all** across repeated tasks.
- Pinch and drag performance improved measurably after ~1 week of daily use (Kobayashi et al., 2011), i.e. these are *trainable but not intuitive*.
  - Intuitive Learnability of Touch Gestures for Technology-Naïve Older Adults (Interacting with Computers) — https://ieeexplore.ieee.org/document/8212636
  - Elderly user evaluation of mobile touchscreen interactions (Kobayashi et al., INTERACT 2011), summarised in: Examining the Usability of Touch Screen Gestures for Elderly People — https://link.springer.com/chapter/10.1007/978-3-319-48746-5_43
  - Drag-and-drop for older adults using touchscreen devices (Vigouroux et al.) — https://hal.science/hal-01090431/document

**2.3 Specific interaction failures observed in people with dementia. `[MILD-DEM/MOD-DEM]` (b)**
Hackner et al.'s "Mindtraining" tablet photo-album study with early- and middle-stage dementia (65+) documented: involuntarily activating menu buttons, involuntarily dragging the whole tablet, forgetting to wait for a selection timer, and forgetting the task rules mid-task.
- Mindtraining: Playful Interaction Techniques for People with Dementia — https://link.springer.com/chapter/10.1007/978-3-319-46100-7_21

**2.4 Multi-touch must be actively suppressed. `[MIXED-DEM]` (a)**
The 45-article literature review found multitouch gestures "require careful programming to prevent accidental activation", and explicitly recommends **avoiding drop-down menus and ambiguous icons**, minimising navigational steps, and using large uncluttered layouts with consistent colours and icons.
- Joddrell & Astell, Studies Involving People With Dementia and Touchscreen Technology: A Literature Review (JMIR Rehabil Assist Technol, 2016) — https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/

**2.5 The hamburger menu is not understood by this cohort. `[HOA]` (b)**
Only ~49% of participants aged 40+ correctly predicted that the hamburger icon opens a navigation menu; ~48% of users older than 45 do not recognise it. NN/g's standing recommendation is to label the icon "Menu"; hidden navigation measurably hurts discoverability and task metrics for all users.
- The Hamburger-Menu Icon Today: Is it Recognizable? (NN/g) — https://www.nngroup.com/articles/hamburger-menu-icon-recognizability/
- Hamburger Menus and Hidden Navigation Hurt UX Metrics (NN/g) — https://www.nngroup.com/articles/hamburger-menus/
- Recognition percentages as reported in: Is the Hamburger Menu Icon Recognizable? — https://medium.com/@mfaridshad/is-the-hamburger-menu-icon-recognizable-b206670b9a8b
  *(Caveat: the percentage figures circulate via secondary sources; treat as directional, not precise.)*

**2.6 Caregiver-reported requirements match the lab findings. `[MILD-DEM]` (b)**
Two focus-group studies (8 PwD + 10 carers; then 5 + 5) produced explicit technical requirements: large buttons and icons carrying **both pictogram and text label**; clear home/back keys; minimal clicks; avoid endless scrolling; **consistent button placement across screens**; simple step-by-step instructions; calm uncluttered interfaces; short simple sentences without jargon; **no codes or passwords**; minimal typing; voice-over option; consistent functionality across sessions.
- Selecting apps for people with mild dementia: Identifying user requirements for apps enabling meaningful activities and self-management (2019) — https://pmc.ncbi.nlm.nih.gov/articles/PMC6453092/

### 3. Vision: text, contrast, colour

**3.1 Contrast sensitivity is impaired in AD beyond normal ageing. `[MILD-DEM/MOD-DEM]` (a)**
Contrast sensitivity function is depressed at every spatial frequency tested except the lowest, with the strongest deficit at **high spatial frequencies** — i.e. fine detail, thin strokes, small type. This "provides a rationale for complaints of poor vision in AD patients."
- Contrast sensitivity dysfunction in Alzheimer's disease (1993) — https://pubmed.ncbi.nlm.nih.gov/8232951/
- Cronin-Golomb, Visuospatial Function in Alzheimer's Disease and Related Disorders — https://www.bu.edu/neuropsychology/files/2015/02/Cronin-Golomb-AD-chapter-Budson-2011.pdf
  (selective losses of contrast sensitivity, colour perception and stereoacuity in AD, dissociable from normal ageing and from Parkinson's)
- Visual contrast sensitivity in Alzheimer's disease, mild cognitive impairment, and older adults with cognitive complaints — https://www.sciencedirect.com/science/article/abs/pii/S0197458012004290

**3.2 Normal ageing baseline. `[HOA]` (a)**
Visual acuity decline accelerates above age 50; presbyopia is near-universal in adults 65+; contrast sensitivity declines from ~50 and becomes acute by ~80; lens/cornea yellowing interferes with colour perception, making **green, blue and violet hard to distinguish**, and reducing sensitivity particularly in the blue and green regions of the spectrum.
- GerontoVis: Data Visualization at the Confluence of Aging (2024) — https://arxiv.org/html/2403.13173v1
- Age-related changes in visual search: manipulation of colour cues based on cone contrast and opponent modulation space (Sci Rep, 2020) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7721812/

**3.3 Colour choices that actively harm legibility for older adults. `[HOA]` (b)**
Visual colour sensitivity drops significantly when older adults read **orange and yellow content on light backgrounds — lemon yellow worst**. The recommendation is to use warm hues as background/brand colour, never as the carrier of large amounts of information on a light ground.
- Elderly-Centric Chromatics: Unraveling the Color Preferences and Visual Needs of the Elderly in Smart APP Interfaces (Int J Human–Computer Interaction, 2024) — https://www.tandfonline.com/doi/full/10.1080/10447318.2024.2338659

**3.4 The dementia-care built-environment standard: 30-point LRV difference. `[MIXED-DEM]` (b)**
The Dementia Services Development Centre (University of Stirling) and BS 8300:2018 recommend a **minimum 30-point Light Reflectance Value difference** between critical adjacent surfaces; 40+ points is described as excellent and gives margin for advanced dementia. This is the physical-environment analogue of a contrast ratio and is a stronger requirement than WCAG's text-only ratios because it applies to *large surfaces and boundaries*, not just glyphs.
- Your dementia design toolkit: Light reflectance values (LRVs), DSDC Stirling — https://www.dementia.stir.ac.uk/newsblog/dementia-design-toolkit-lrvs
- Contrast Ratios & LRV for Dementia Design — https://signageforcare.com/us/learn/contrast-ratio-lrv-guide
- Kirklees Dementia Friendly Design Tool — https://www.kirklees.gov.uk/beta/health-and-well-being/pdf/kirklees-dementia-design-guide.pdf

**3.5 WCAG AAA text requirements. (a) — standard, not empirical**
- **1.4.6 Contrast (Enhanced), AAA**: ≥7:1 normal text, ≥4.5:1 large text. The 7:1 figure was chosen to compensate for contrast sensitivity loss equivalent to roughly **20/80 vision**.
  - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html and https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html
- **1.4.8 Visual Presentation, AAA**: user-selectable foreground/background colours; line width ≤80 characters; text **not justified**; line spacing ≥1.5 within paragraphs; paragraph spacing ≥1.5× the line spacing (i.e. ~2.5× baseline gap); text resizable to 200% without horizontal scrolling.
  - https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html
- **1.4.9 Images of Text (No Exception), AAA**: images of text only for decoration/essential presentation. Consequence: card content must be real text, never baked into an image.
- **3.1.5 Reading Level, AAA**: text must not require reading ability above **lower secondary education level** (≈7–9 years of schooling, ~14–15 y/o); otherwise supply a simplified version, visual aid, or audio version.
  - https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html
- W3C COGA guidance goes further and suggests aiming for a **reading age of 8–10** where feasible.
  - Making Content Usable for People with Cognitive and Learning Disabilities (W3C) — https://www.w3.org/TR/coga-usable/

**3.6 Typography, platform. (a) — standard**
Apple treats 11 pt as an absolute legibility floor and expects Dynamic Type support so users can scale text; SF Pro Text is used ≤19 pt and SF Pro Display ≥20 pt.
- https://developer.apple.com/design/human-interface-guidelines/typography (JS-rendered; corroborated via https://median.co/blog/apples-ui-dos-and-donts-typography)
- **Note:** 11 pt is a floor for *general* iOS apps. It is not defensible as a body size for an 80-year-old with AD-related contrast sensitivity loss.

### 4. Hearing and audio

**4.1 Prevalence. `[HOA]` (a)**
US disabling hearing loss: ~10% ages 55–64, **22% ages 65–74, 55% ages 75+**. Among adults 70+ who could benefit from hearing aids, **fewer than 1 in 3 (30%) has ever used one**.
- NIDCD Quick Statistics About Hearing — https://www.nidcd.nih.gov/health/statistics/quick-statistics-hearing
- Corroborating (different definitions/populations): 33% at 60–65, 55% at 75–80, 89% at 80+ as cited in GerontoVis — https://arxiv.org/html/2403.13173v1

**4.2 Presbycusis is high-frequency-first, which destroys consonants. `[HOA]` (a)**
Presbycusis is clinically identified by threshold elevation **above 2 kHz**, worsening monotonically (3 kHz worse than 2 kHz, 4 kHz worse than 3 kHz). Consonant cues that distinguish words ("s", "f", "th") sit at **2–4 kHz** — so speech becomes audible but unintelligible, especially in noise. The dominant complaint is speech understanding in noise, which is *not* explained by threshold elevation alone (central auditory processing decline).
- Functional Age-Related Changes Within the Human Auditory System Studied by Audiometric Examination — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6399208/
- Hearing Loss and Aging: Implications for Audiologists (ASHA) — https://www.asha.org/articles/hearing-loss-and-aging-implications-for-audiologists/
- Presbycusis (Johns Hopkins Medicine) — https://www.hopkinsmedicine.org/health/conditions-and-diseases/presbycusis

**4.3 Listening effort causes fatigue. `[HOA/MIXED-DEM]` (b)**
Normal speech runs ~4 syllables/second (>240 phonemic chunks/minute); when listeners must exert effort — because of hearing loss *or* dementia — the result is persistent significant fatigue, and the conversation moves on before processing completes.
- ASHA, Hearing Loss and Aging — https://www.asha.org/articles/hearing-loss-and-aging-implications-for-audiologists/

**4.4 In dementia specifically, on-screen text/animation prompts beat voice prompts. `[MIXED-DEM]` (b)**
The touchscreen literature review found that "integrated prompts (text boxes and animations)" were **more effective than voice** prompts for supporting independent use.
- Joddrell & Astell 2016 — https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/
- **Design tension:** our product's core asset is *relatives' voice recordings*. That is content, not instruction. The finding says: never deliver *instructions* by voice alone. It does not argue against voice content.

### 5. Animation, motion, and disorientation

**5.1 Interaction-triggered motion causes real physical harm. (a) — standard + clinical rationale**
WCAG 2.2 SC **2.3.3 Animation from Interactions (AAA)**: motion animation triggered by interaction must be disableable unless essential. Rationale, verbatim from W3C: "The impact of animation on people with vestibular disorders can be quite severe. Triggered reactions include nausea, migraine headaches, and potentially needing bed rest to recover."
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

**5.2 Cybersickness is observed directly in people with dementia. `[MILD-DEM/MOD-DEM]` (b)**
3 of 12 participants experienced cybersickness in HMD conditions; authors recommend minimising optic flow and forward motion.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7439148/

**5.3 Vestibular ageing. `[HOA]` (a)**
Vestibular motion perception declines with age and older adults show increased visual dependence, which is associated with falls. Where motion is unavoidable, translation/rotation speed should be matched to typical older-adult walking speed.
- Vestibular perceptual learning improves self-motion perception, posture, and gait in older adults (Commun Biol, 2024) — https://www.nature.com/articles/s42003-024-06802-5
- Impaired Subjective Visual Vertical and Increased Visual Dependence in Older Adults With Falls — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8232053/
- Immersive virtual reality for older adults: Challenges and solutions — https://www.sciencedirect.com/science/article/pii/S1568163725001175

**5.4 Nuance — motion is not uniformly bad.** The dementia touchscreen review found *animated prompts* effective for teaching. The distinction that matters is **local, purposeful, looping demonstration animation on a stationary layout** (good) vs **global page/viewport motion, transitions, parallax, and content that moves under the finger** (bad).
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/

### 6. Working memory load, choice count, and screen complexity

**6.1 Working memory capacity is reduced in ageing and further in MCI. `[HOA/MCI]` (a)**
Complex interfaces tax working memory, episodic memory, processing speed and visuospatial ability; MCI adds reduced WM capacity, slower processing, and spatial navigation difficulty, all of which raise cognitive load in multi-step tasks.
- GerontoVis — https://arxiv.org/html/2403.13173v1
- Creating a Digital Memory Notebook Application for Individuals with Mild Cognitive Impairment (2020) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7314313/
- Insights from Designing Context-Aware Meal Preparation Assistance for Older Adults with MCI (2025) — https://arxiv.org/html/2506.05663

**6.2 Reduce to single-button operation where possible. `[MOD-DEM]` (b)**
For users with notable cognitive impairment, "procedural operations should be replaced with simple operations (e.g. single-button operation)", the number of functions and buttons should not be high, buttons and text should be enlarged, and clear feedback must be provided.
- Interface Design for Products for Users with Advanced Age and Cognitive Impairment (IJERPH 2022;19:2466) — https://doi.org/10.3390/ijerph19042466

**6.3 W3C COGA concrete constraints. (a) — standard**
Limit options per screen; avoid simultaneous tasks; fewer process steps is better and progress must be shown visually; show current step plus completed/pending; allow pauses; avoid time limits; do not rely on memory (no passwords, show previous entries); pre-fill where possible; provide obvious human help from any screen; keep controls obviously controls (buttons look like buttons, links underlined).
- https://www.w3.org/TR/coga-usable/

**6.4 Session fatigue. `[MIXED-DEM]` (b)**
Testing/usage sessions with people living with dementia should be limited to **30–35 minutes** to prevent fatigue, and feedback should be gathered in real time rather than by recall.
- Technology Usability for People Living With Dementia: Concept Analysis (JMIR Aging, 2024) — https://pmc.ncbi.nlm.nih.gov/articles/PMC11255540/
- **Implication:** our target session length (a few minutes) is well inside this envelope; the constraint bites on *caregiver authoring* sessions and on clinician-run assessments, not on the daily patient exercise.

**6.5 The eight usability attributes for PLWD. `[MIXED-DEM]` (b)**
Effectiveness, efficiency, satisfaction, **learnability, adaptability, personalization, intuitiveness, simplicity**. Antecedents include dementia stage/subtype, availability of caregiver "co-use", and age-related sensory change. Recommendation: design features **adaptable as symptoms evolve**, prioritise audio support, large buttons, clear navigation.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC11255540/

### 7. Errors, failure feedback, and psychological harm

**7.1 Catastrophic reactions occur during cognitive testing at meaningful rates. `[MILD-DEM/MOD-DEM]` (a)**
In 146 patients with Alzheimer's disease, **16% showed a catastrophic reaction during neuropsychological evaluation**. Factor analysis produced an anxious/angry component (associated with higher irritability, longer illness duration) and a depressive component (associated with more severe cognitive impairment and older age).
- Tiberti C, Sabe L, Kuzis G, et al. (1998), Prevalence and correlates of the catastrophic reaction in Alzheimer's disease. Neurology 50(2):546-8 — https://pubmed.ncbi.nlm.nih.gov/9484396/
- **This is the most important single number in this document.** A recall-testing app *is* a neuropsychological evaluation from the patient's phenomenological point of view. The base rate of acute distress in that context is ~1 in 6, and it rises with severity.

**7.2 Learned helplessness and excess disability are recognised sequelae. `[MIXED-DEM]` (b/c)**
Patients with AD and other dementias are not immune to learned helplessness — the assumption, generalised from one failure, that no control is possible anywhere, which can lead them to reject subsequent interventions. Cognitive difficulty impacts confidence and can cause anxiety, depression and withdrawal, producing "excess disability" — functional loss beyond what the pathology alone dictates.
- Flannery RB (2002), Treating learned helplessness in the elderly dementia patient: preliminary inquiry — https://pubmed.ncbi.nlm.nih.gov/12501481/
- Clare & Woods, Cognitive training and cognitive rehabilitation for persons with mild to moderate dementia of the Alzheimer's or vascular type: a review — https://pmc.ncbi.nlm.nih.gov/articles/PMC3979126/
- Helplessness sits as a central node in the network of late-life depressive symptoms in MCI and early dementia — https://pmc.ncbi.nlm.nih.gov/articles/PMC11065523/

**7.3 Honest counterweight: formal cognitive training trials did NOT detect mood harm. `[MILD-DEM/MOD-DEM]` (d, for the harm hypothesis at trial level)**
Across 11 RCTs of cognitive training in mild-to-moderate dementia there were "no differences between cognitive training and control conditions on any of the primary or secondary outcomes" (SMDs −0.11 to 0.31) and — importantly — **"no adverse effects of cognitive training were detected"**, with no evidence of increased depression or reduced self-esteem.
- Clare & Woods review — https://pmc.ncbi.nlm.nih.gov/articles/PMC3979126/
- **How to hold both facts:** supervised, clinician-designed training does not measurably harm mood at group level. But those trials were human-mediated, with a facilitator who could adapt, reassure and stop. An unsupervised app has no such circuit-breaker. The 16% catastrophic-reaction rate is what happens in the *testing* context; the trials tell us a well-run *training* context is safe. Our app must resemble the latter, not the former.

**7.4 Errorless learning: weaker than its reputation. `[MILD-DEM/MOD-DEM]` (d for superiority in this population)**
- **REDALI-DEM RCT, n=161 (140 completed):** structured relearning improved ADL performance and gains held for 6 months, but **errorless learning had no additional effect over trial-and-error learning** on any primary or secondary outcome. The authors suggest the procedural nature of the tasks let both conditions learn implicitly.
  - Structured relearning of activities of daily living in dementia: the randomized controlled REDALI-DEM trial on errorless learning — https://pmc.ncbi.nlm.nih.gov/articles/PMC5364615/
- **Critical review:** EL's advantage is clearest in *severe amnesia* and on same-session tests. In mild-to-moderate memory impairment and dementia, errorful methods with retrieval practice are comparable or superior, and long-term retention often favours effortful retrieval. EL forfeits the retrieval-practice/desirable-difficulty benefit.
  - Middleton & Schwartz, Errorless learning in cognitive rehabilitation: A critical review — https://pmc.ncbi.nlm.nih.gov/articles/PMC3381647/
- **Contrary pilot RCT:** Kessels & Olde Hensken (2009) found errorless skill learning better overall, with largest effects in the mild-to-moderate group at delayed testing.
  - https://journals.sagepub.com/doi/abs/10.3233/NRE-2009-0529
- **Review-level:** de Werd et al. (2013) conclude EL is more effective than errorful learning or no treatment for teaching meaningful daily tasks, with maintenance at follow-up.
  - https://pubmed.ncbi.nlm.nih.gov/24049443/
- **Net verdict:** the literature is genuinely split; the largest and best-powered trial is null. **Do not build the product on a claim that errorless design improves learning.** Build error-avoidance for dignity and continued engagement, which is separately defensible via 7.1/7.2.

**7.5 Spaced retrieval — relevant because it is our scheduling engine's clinical cousin. `[MCI/MILD-DEM]` (b)**
Spaced retrieval improves *learning capacity* in patients with memory deficits, but evidence for long-term maintenance and generalisation to untrained measures is inconsistent, and methodological heterogeneity is wide.
- Spaced Retrieval Effects on Learning Capacity in Patients With Mild-to-Moderate Cognitive Impairment: A Systematic Review and Meta-Analysis (European Psychologist, 2023) — https://econtent.hogrefe.com/doi/10.1027/1016-9040/a000510
- A literature review of spaced-retrieval interventions: a direct memory intervention for people with dementia — https://www.sciencedirect.com/science/article/pii/S1041610224014807
- Effects of Spaced Retrieval Training on Semantic Memory in Alzheimer's Disease: A Systematic Review (JSLHR, 2013) — https://pubs.asha.org/doi/abs/10.1044/1092-4388(2013/12-0352)
- Self-generation within an error-free context outperformed standard errorless learning for face–name associations in AD — noted in https://econtent.hogrefe.com/doi/10.1027/1016-9040/a000510
- **Relevant to our design:** face–name learning is explicitly the paradigm where "generate it yourself, but in a context engineered so you cannot be wrong" beat pure errorless presentation. That is a real design pattern for us.

### 8. Can people with dementia learn a new interface? Consistency requirements

**8.1 Yes, partially — and unpredictably. `[MILD-DEM]` (b)**
Seven-day in-home trial with 21 people with early-stage dementia and their carers: **approximately half used the tablet independently**, and unsupervised use time correlated with carer relief. **No baseline traits predicted who would or would not use it.** Authors conclude needs must be assessed case-by-case.
- Usability of tablet computers by people with early-stage dementia (Dementia, 2013) — https://pubmed.ncbi.nlm.nih.gov/23257664/

**8.2 Corroborating independent-use rates. `[MIXED-DEM]` (b)**
From the 45-article review: majority of "Living In the Moment" game users navigated independently; two-thirds of Companion system users achieved independent operation. Success factors: training/demonstration phase, integrated prompts, immediate contextual feedback, familiar imagery cueing.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/

**8.3 The learning is procedural/implicit, not declarative. `[MIXED-DEM]` (b/c)**
Changes in how people with dementia interact with technology are attributed to procedural learning, which is relatively preserved relative to explicit memory; REDALI-DEM's null EL-vs-TEL result is explained the same way (procedural tasks learned implicitly in both arms).
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5364615/
- Kinect Project: People with dementia or MCI learning to play group motion-based games — https://www.sciencedirect.com/science/article/pii/S2352873719300460
- **Consequence:** procedural memory encodes *motor sequences bound to spatial positions*. If a button moves, changes label, or changes colour, the acquired procedure is invalidated. This is a much harder consistency requirement than normal product design tolerates — it rules out A/B tests on the patient surface, rules out progressive disclosure, rules out layout changes across releases.

**8.4 Consistency as a formal requirement. (a) — standard**
WCAG **3.2.3 Consistent Navigation** and **3.2.4 Consistent Identification** (both AA), plus **3.2.5 Change on Request** (AAA: content changes only on explicit user request, or provide a mechanism to disable such changes).
- https://www.w3.org/TR/WCAG22/
- COGA: "headings at the same level look identical; submit buttons behave uniformly"; don't style similar functions differently across pages.
- https://www.w3.org/TR/coga-usable/

### 9. Wayfinding and "where am I" in an app

**9.1 Standards. (a)**
- WCAG **2.4.8 Location (AAA)**: information about the user's location within a set of pages must be available. Sufficient techniques: breadcrumbs, nav bars marking the current page, `aria-current`, site maps.
  - https://www.w3.org/WAI/WCAG22/Understanding/location.html
- WCAG **2.4.10 Section Headings (AAA)**; COGA: use clear headings that show "where you are"; show current step plus completed/pending steps; avoid deep nesting.
  - https://www.w3.org/TR/coga-usable/

**9.2 Empirical, from the dementia app literature. `[MILD-DEM]` (b)**
Clear home/back keys, minimal clicks, no endless scrolling, consistent button placement.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6453092/
Minimise navigational steps and interface complexity; avoid drop-down menus.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/

**9.3 Physical wayfinding evidence transfers conceptually only. (c)**
DSDC/BS 8300 wayfinding guidance (contrast, landmarks, sightlines) is built-environment evidence; treating a screen as a "place" with persistent landmarks is a *plausible mechanism*, not a demonstrated transfer.
- https://signageforcare.com/us/learn/wayfinding-evidence-research

### 10. Timing, interruptions, authentication

**10.1 Standards directly relevant. (a)**
- **2.2.3 No Timing (AAA)**: all content operable without a time limit, except real-time events. → **No countdown timers on cards. Ever.**
- **2.2.4 Interruptions (AAA)**: alerts/updates can be postponed or suppressed. → No toasts, no banners, no "streak about to expire" nags on the patient surface.
- **2.2.6 Timeouts (AAA)**: warn about inactivity that could cause data loss and provide a save mechanism.
- **3.3.7 Redundant Entry (AA)**: don't make users re-enter information.
- **3.3.8 / 3.3.9 Accessible Authentication (AA / AAA)**: authentication must not rely on a cognitive function test (remembering a password, solving a puzzle, transcribing a code).
- **3.3.6 Error Prevention (All) (AAA)**: actions are reversible, checked, or confirmed.
- https://www.w3.org/TR/WCAG22/ and https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa

**10.2 Empirical corroboration on authentication. `[MILD-DEM]` (b)**
Carers were sceptical about teaching people with dementia to install apps because it requires "too many steps... entering codes and passwords"; focus groups explicitly demanded **no codes/passwords**.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6453092/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/

**10.3 Selection timers are a documented failure mode. `[MILD-DEM/MOD-DEM]` (b)**
Participants "forgot to wait for selection time" — dwell-to-select interactions failed.
- https://link.springer.com/chapter/10.1007/978-3-319-46100-7_21

### 11. Hardware and modality

**11.1 Larger screens are better for accessibility; tablets win on portability. `[MIXED-DEM]` (b)**
The review reports a 20" mode was superior for accessibility; all reviewed tablet studies used iPad; iOS was rated easier than Android or Windows.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/
  *(Caveat: iOS-vs-Android "ease" here is a 2016 judgement from a small literature, confounded by device quality and researcher familiarity. Grade (c).)*

**11.2 Fix the device physically. `[MILD-DEM/MOD-DEM]` (b)**
Involuntary dragging of the tablet itself was an observed failure; authors recommend fixing the tablet to a surface.
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7439148/
- https://link.springer.com/chapter/10.1007/978-3-319-46100-7_21

**11.3 Touchscreen closes the age gap relative to mouse. `[HOA]` (a)**
Touchscreen produced a ~35% movement-time reduction over mouse for older adults, narrowing the older/younger performance gap.
- Summarised in https://link.springer.com/chapter/10.1007/978-3-319-48746-5_43

---

## Evidence quality assessment

| Claim area | Grade | Why |
|---|---|---|
| Direct touch >> indirect input for PwD | **(a)** | Consistent across a controlled comparative study and a 45-article review; large effect; mechanism clear |
| Older adults need much larger targets than platform minimums | **(a)** direction, **(b)** exact mm | Many studies, but heterogeneous devices, postures, screen sizes and metrics; mm figures vary 6–40 mm |
| Contrast sensitivity loss in AD beyond ageing | **(a)** | Replicated psychophysics; small samples per study (n≈6–30) but consistent direction |
| Blue/green discrimination loss with lens yellowing | **(a)** physiology, **(b)** design rules | Physiology is settled; the specific "avoid lemon yellow on light" rule comes from one 2024 HCI study |
| Catastrophic reaction base rate ~16% in AD during testing | **(a)** | Single well-conducted study, n=146, clean measurement, published in Neurology; not replicated at that exact rate |
| Errorless learning improves learning in mild–moderate dementia | **(d)** | Largest RCT (n=161) null; critical review argues against; smaller studies positive. Split literature, best-powered evidence null |
| Cognitive training in dementia improves cognition | **(d)** | 11 RCTs, SMDs −0.11 to 0.31, no significant effects. *(Fully covered by the cognition-evidence domain; noted here for framing.)* |
| Cognitive training causes mood harm | **(d)** at trial level | No adverse effects detected across 11 RCTs — but all supervised |
| Spaced retrieval improves learning capacity | **(b)** | Meta-analysis positive on learning capacity; generalisation/maintenance inconsistent; high heterogeneity |
| PwD can use touchscreens independently | **(b)** | ~50% in one 21-dyad home study; no predictors found; small samples throughout |
| Interface consistency required because learning is procedural | **(c)** mechanism, **(b)** applied | The procedural-learning explanation is inferential (post-hoc in REDALI-DEM), not directly tested on UI layout changes |
| Gesture learnability ranking (tap > drag > pinch > rotate) | **(b)** | Consistent across several `[HOA]` studies; almost no direct `[DEM]` evidence for pinch/rotate |
| Hamburger icon comprehension figures | **(b)** | Widely cited, but the specific percentages circulate through secondary sources |
| Motion/animation harm | **(a)** for vestibular harm generally, **(b)** for PwD specifically | Strong standards rationale + n=3/12 cybersickness observation |
| 30-point LRV rule | **(b)** | Adopted in BS 8300:2018 and DSDC guidance; underlying "controlled studies" are not readily traceable to individual primary papers |

**Systematic weaknesses of this literature you should know about:**
- Sample sizes are tiny (n=6–30 is typical), attrition is high (4/12 could not complete in the JMIR study), and dementia severity is inconsistently reported — the 2016 review flags this explicitly.
- Almost all touch-target numbers come from healthy older adults, not from people with dementia. **We are extrapolating.**
- Almost no longitudinal data on sustained engagement.
- Publication bias toward "the technology worked" is likely; the one study that reports a participant crying is notable partly because such reporting is rare.

---

## Direct design implications for our app

Numbers below are targets for a **10.2"+ tablet held or mounted at ~40–50 cm**, the assumed patient device. Where I state a number not directly given by a source, I mark it **[derived]** and give the reasoning.

### A. Layout and touch targets (patient surface)

1. **DO make every patient-facing tap target ≥ 20 mm × 20 mm physical**, i.e. ~**76 × 76 CSS px at 96 dpi** / ~**56 × 56 pt on iPad** **[derived: above the ~17.5 mm performance plateau (1.3) and the 40 mm large-screen optimum scaled to a hand-held device]**. Primary answer buttons: **≥ 28 mm** tall, full-width or half-width.
2. **DO leave ≥ 8 mm of empty, non-interactive space between adjacent targets** **[derived from 1.1 off-target error rates + 1.3 finger-pad width 16–20 mm]**. Never place two tappable things closer than a finger width.
3. **DO enlarge targets in the outer 25% of the screen by ~2×** relative to centre-screen targets, or better, **keep all patient-facing controls in the central 50% of the screen** (2.3 cm vs 1.1 cm required area, §1.3).
4. **NEVER** put a destructive or navigational control adjacent to an answer control. Undo/back/exit go in a fixed, isolated corner with a large dead zone.
5. **DO show at most 2–3 choices on a patient screen**, and prefer **1 button** ("Show me" → "That's right / Not quite") over multiple-choice grids (§6.2, §6.3).
6. **DO use a fixed grid**: same number of elements, same positions, every session (§8.3, §8.4).
7. **NEVER** use scrolling on the patient surface. One card = one screen, no overflow (§9.2 "avoid endless scrolling").

### B. Gestures and input

8. **DO restrict the patient surface to single tap only.** No swipe, no long-press, no pinch, no rotate, no drag, no double-tap. Evidence: double-tap took 18.2 s and produced 3× the off-target errors in 80+ adults (§1.1); rotate is unlearnable (§2.2).
9. **DO disable multi-touch entirely on the patient surface** (`touch-action: manipulation`, ignore all but the first pointer, ignore pointer events during a 300–500 ms post-tap lockout) — accidental multi-touch activation is a documented failure (§2.4, §2.1).
10. **NEVER use dwell-to-select / hold-to-confirm timers** — participants forgot to wait (§10.3).
11. **DO debounce and de-jitter**: accept the *first* touch-down within a target's hit area, ignore micro-movement (essential tremor is kinetic and degrades accurate movement, §1.4). Do not require touch-up inside the target.
12. **DO consider allowing swipe as a redundant accelerator for the caregiver**, never as the only path, and never on the patient surface.
13. **NEVER use a hamburger menu, drop-down, tab bar, or any hidden navigation on the patient surface** (§2.4, §2.5). Caregiver surface may use conventional patterns; the caregiver is a different user with different capabilities.
14. **DO recommend physically mounting or propping the tablet** in onboarding, and consider a stand as part of the pilot kit — involuntary device dragging is documented (§11.2).

### C. Typography and colour

15. **DO set body text at ≥ 24 px / 18 pt minimum, headings ≥ 32 px, card content ≥ 32–40 px** **[derived: Apple's 11 pt floor is for general apps (§3.6); AD contrast-sensitivity loss is worst at high spatial frequencies (§3.1), and stroke frequency scales inversely with type size]**. Support Dynamic Type / user text scaling to 200% without horizontal scroll (WCAG 1.4.8/1.4.4).
16. **DO hit ≥ 7:1 contrast for all text (WCAG 1.4.6 AAA) and ≥ 4.5:1 for all non-text UI boundaries** — one level above the 3:1 AA non-text requirement **[derived from §3.1 + §3.4]**.
17. **DO enforce a ≥ 30-point Light Reflectance Value difference between adjacent large surfaces** — card vs background, button vs card, panel vs page (§3.4). This is a *surface* rule, not a *text* rule, and it is the one most commonly missed.
18. **NEVER encode meaning in blue-vs-green, blue-vs-purple, or any pastel pair** (§3.2). Use luminance + shape + text label. Colour must always be redundant.
19. **NEVER put orange or yellow — especially lemon yellow — text or content on a light background** (§3.3).
20. **DO use a plain sans-serif at regular or medium weight** (avoid Light/Thin weights — thin strokes are high-spatial-frequency, §3.1), **left-aligned, never justified**, line-height ≥ 1.5, paragraph spacing ≥ 1.5× line-height, line length ≤ 80 characters (WCAG 1.4.8, §3.5).
21. **NEVER render card text as an image** (WCAG 1.4.9). Photos are content; the prompt text must be real, scalable text.
22. **DO avoid pure white (#FFF) backgrounds at full brightness** as a default and offer a warm-reduced-glare theme **[derived from lens yellowing and light scatter, §3.2 — grade (c), plausible mechanism, not directly tested]**.

### D. Language

23. **DO write all patient-facing copy at a reading age of 8–10** (COGA, §3.5), and never above lower-secondary level (WCAG 3.1.5 AAA).
24. **DO cap patient-facing sentences at ~10–15 words, one idea per sentence, active voice, present tense, concrete nouns, no metaphor, no idiom** (COGA §6.3; §2.6).
25. **DO cap a card prompt at ~8 words** **[derived from §4.3 processing/fatigue + §6.3 "limit options, avoid simultaneous tasks"]**.
26. **DO use the person's own vocabulary** — the caregiver enters names and relationships; use "your daughter Sarah", not "Relative #2".
27. **NEVER use system/technical vocabulary** on the patient surface: "sync", "queue", "session", "deck", "card", "review", "algorithm", "due", "streak", "score", "accuracy".

### E. Failure, errors and feedback — the safety-critical section

28. **NEVER display "Wrong", "Incorrect", a red X, a buzzer sound, or a score.** Base rate of catastrophic reaction during recall testing in AD is ~16% (§7.1); learned helplessness and excess disability are documented sequelae (§7.2).
29. **DO design the interaction so there is no wrong answer state at all.** Preferred pattern, supported by §7.5 (self-generation inside an error-free context beat pure errorless presentation for face–name learning in AD):
    - Show the photo. Ask, warmly: "Who is this?"
    - Two large buttons: **"Tell me"** and **"I know"**.
    - Either button reveals the answer, in the relative's voice and in text.
    - The *self-report* ("I knew that" / "Show me again") is the grading signal. The system never adjudicates.
30. **DO route the difficulty signal to the scheduler silently.** The scheduler sees a grade; the patient never sees a grade. The clinician surface may see grades.
31. **DO provide an always-visible, always-identical exit** ("I'm done for now"), and treat leaving early as a neutral, unremarked event. Never guilt, never "you only did 3 of 10".
32. **NEVER use streaks, badges, leaderboards, timers, or "you're falling behind" language.** These are failure-framing devices by construction, and WCAG 2.2.3/2.2.4 (AAA) forbid time limits and un-suppressible interruptions anyway (§10.1).
33. **DO build a distress circuit-breaker.** Detect proxies for struggle — e.g. ≥ 2 consecutive "Tell me" responses, unusually long dwell with no touch, rapid repeated taps — and **soften rather than escalate**: switch to a recognition-free "just look and listen" mode with a favourite photo and a relative's voice, then end the session gently. The 11-RCT null on mood harm (§7.3) applies to *supervised* training; we do not have a facilitator, so we must synthesise one.
34. **DO make everything reversible / non-destructive** (WCAG 3.3.6 AAA). No confirmation modals on the patient surface — modals are unrecognised context switches; instead, make actions harmless.
35. **DO give immediate contextual feedback for every touch** — a documented success factor (§8.2) — but make it affirmational and neutral: the tapped element visibly depresses/highlights within 100 ms, no sound required.

### F. Instructions, prompts and audio

36. **DO deliver instructions as on-screen text plus a small looping demonstration animation, not as voice alone** (§4.4).
37. **NEVER make audio the sole carrier of any instruction or state** — 55% of 75+ have disabling hearing loss and only ~30% of those who'd benefit use hearing aids (§4.1).
38. **DO caption/transcribe relatives' voice recordings** on screen as they play, in large text. This makes the core content accessible to the majority of the cohort with presbycusis (§4.2).
39. **DO keep audio content in the low-mid frequency band and normalise levels; do not rely on 2–4 kHz consonant clarity for comprehension** (§4.2). Provide a large, always-available "play again" control.
40. **DO allow speech rate reduction on relative recordings** **[derived: ~4 syllables/s normal rate + listening-effort fatigue, §4.3 — grade (c)]**, and prefer short recordings (≤ 10 s).

### G. Motion

41. **NEVER use page transitions, slide/push navigation, parallax, autoplay video, or motion that moves content under the finger** (§5.1–5.3). Screens should replace instantly or cross-fade over ≤ 150 ms.
42. **DO honour `prefers-reduced-motion` and additionally provide an in-app "reduce motion" toggle** (WCAG 2.3.3 AAA).
43. **DO allow one exception: a small, local, looping instructional animation** demonstrating the tap gesture on a stationary layout (§5.4). Keep it under ~20% of the viewport and stationary in position.

### H. Orientation and navigation

44. **DO put a persistent, unchanging header on every patient screen** showing where they are in words a person would use ("Your photos — 2 of 5"). Satisfies WCAG 2.4.8 Location (AAA) and COGA's "show current step + completed/pending" (§9.1).
45. **DO make progress visual and finite** — a short row of dots or a filling bar with a visible end. Never an open-ended queue.
46. **DO give exactly one back/home affordance, in the same corner, on every screen, with a text label** ("Back", not just "‹") (§9.2, §2.6: pictogram **and** text).
47. **NEVER open modals, sheets, popovers, or overlays on the patient surface.** They break the "where am I" model and have no discoverable dismissal for this cohort. Use a full screen replacement with an explicit labelled "Back".
48. **NEVER change layout, wording, icon, colour, or position of any patient-facing element after the pilot begins** (§8.3, §8.4, WCAG 3.2.3/3.2.4/3.2.5). Version the patient UI and pin each participant to a version for the study duration. **No A/B testing on the patient surface.**

### I. Authentication and setup

49. **NEVER require the patient to log in, enter a code, remember a password, or solve any puzzle** (WCAG 3.3.8/3.3.9; §10.2). The patient device is provisioned once by the caregiver and opens straight into the session — ideally in Guided Access / kiosk / screen-pinning mode so the OS cannot be escaped.
50. **DO put all account, consent and configuration complexity on the caregiver surface**, which can use ordinary modern UI patterns.
51. **DO make the caregiver surface tolerant** — autosave, redundant-entry avoidance (WCAG 3.3.7), no timeouts that lose work (WCAG 2.2.6). Caregivers are often themselves 65+ and are entering content in fragmented, interrupted sessions.

### J. Adaptation over time

52. **DO build adaptability as a first-class feature** — text size, number of choices, prompt verbosity, audio on/off, session length — settable by caregiver/clinician, because dementia progresses (§6.5, §8.1).
53. **DO NOT auto-adapt the patient UI silently.** Layout changes invalidate procedural learning (§8.3). Adaptation should be a deliberate, infrequent, caregiver-initiated step, ideally accompanied by a re-teaching session.
54. **DO cap patient sessions well under the 30–35 minute fatigue threshold** (§6.4) — target 3–5 minutes. Apply the 30–35 minute cap to caregiver onboarding and clinician assessment sessions.

### K. Things that would be actively harmful — hard NEVERs

- Red X / "Wrong" / buzzer / score / percentage correct.
- Countdown timers or any time pressure.
- Streaks, "don't break your chain", missed-day guilt notifications.
- Any content that reminds the person of a deceased relative without the caregiver having flagged the relationship status — a "Who is this?" card featuring a dead spouse can be re-traumatising each time it is answered. **DO require the caregiver to mark deceased/estranged/sensitive people and provide per-person opt-out.** *(This is a design inference from the catastrophic-reaction and distress literature, not a directly cited finding — grade (c). Treat as a mandatory safety requirement anyway.)*
- Mouse, trackpad, cursor, stylus-only, or controller input (§2.1).
- Voice-only instructions (§4.4, §4.1).
- Anything that moves the viewport (§5.1).
- Modal dialogs, hidden menus, gestures other than tap (§2.4, §2.5).
- Changing the interface mid-study (§8.3).
- Presenting the app to the patient as a *test*. Frame it as looking at photos and hearing from family — the 16% catastrophic-reaction figure was measured in an explicit testing frame (§7.1).

### L. Honest framing obligations (interface-level)

55. **DO NOT display or imply improvement, "brain health", or slowed decline anywhere in the patient or caregiver UI.** Cognitive training in mild-to-moderate dementia showed no significant benefit across 11 RCTs (SMD −0.11 to 0.31) (§7.3). The defensible claims for our UI are: *engagement*, *contact with personally meaningful content*, *a shared activity*, and *possible learning of the specific trained items* (spaced retrieval does improve learning capacity for trained material, §7.5).
56. **DO put the honest framing in the caregiver onboarding**, not buried in terms. Caregivers who expect disease modification will be harmed by disappointment and may over-pressure the patient.

---

## Open questions

1. **What target size do people with *dementia* actually need?** Every mm figure I found is from healthy older adults or middle-aged/older comparisons. Given the AD-specific contrast sensitivity and visuospatial deficits, the true requirement may be larger than 20 mm. → *Measure this in the pilot: log tap coordinates relative to target centre and compute an empirical hit distribution per participant.*
2. **Does self-report grading ("I knew that" / "Show me") produce a usable scheduling signal in this population?** Metamemory is impaired in AD (anosognosia); self-reported recall confidence may be systematically miscalibrated. No source found. This is the single biggest unvalidated assumption in the design above.
3. **Is there a detectable behavioural signature of distress on a tablet** (dwell time, tap force/area, repeated taps, abandonment) that could drive the circuit-breaker in §33? I found nothing empirical. Currently heuristic.
4. **Does interface consistency actually matter as much as the procedural-learning argument implies?** The mechanism is inferred, never directly tested by manipulating UI layout with people with dementia. A cheap within-study test would be valuable and is publishable.
5. **Is a fixed-position 10–13" tablet better than a phone for this cohort?** The review suggests a 20" mode was better for accessibility but all tablet studies used iPad. Screen-size/portability tradeoff is unresolved for at-home daily use.
6. **Do transcribed captions of a relative's voice help or hurt?** Captions solve presbycusis but add a competing visual channel that may increase load. Untested.
7. **What is the right handling of "sensitive people" (deceased, estranged, dementia-relevant trauma)?** I found no HCI literature on this at all, despite it being obviously central to a personal-photo memory app. Needs clinical input before the pilot.
8. **How much of the "half used it independently" result is device familiarity vs. dementia severity?** The 2013 study found no predictive traits; with a larger pilot we could look for them (MMSE/MoCA band, prior tablet use, hand dexterity, visual acuity).
9. **Do WCAG AAA + our stricter numbers conflict with anything?** Specifically: 7:1 contrast plus a warm/low-glare theme plus 30-point LRV separation is a constrained palette. Needs a design spike to prove a viable colour system exists in both light and dark.
10. **Clinician surface**: none of this literature addresses the *researcher* user. That surface should follow ordinary data-dense design practice (and dataviz accessibility), and its constraints are essentially unrelated to the patient surface.

---

## Master citation list

- Alzheimer's / dementia HCI
  - Joddrell P, Astell AJ (2016). Studies Involving People With Dementia and Touchscreen Technology: A Literature Review. JMIR Rehabil Assist Technol. https://pmc.ncbi.nlm.nih.gov/articles/PMC5454556/
  - Manera V et al. (2020). User Experience of Interactive Technologies for People With Dementia: Comparative Observational Study. JMIR. https://pmc.ncbi.nlm.nih.gov/articles/PMC7439148/
  - Lim FS et al. (2013). Usability of tablet computers by people with early-stage dementia. Dementia. https://pubmed.ncbi.nlm.nih.gov/23257664/
  - Øksnebjerg L et al. (2019). Selecting apps for people with mild dementia: Identifying user requirements. https://pmc.ncbi.nlm.nih.gov/articles/PMC6453092/
  - (2024). Technology Usability for People Living With Dementia: Concept Analysis. JMIR Aging. https://pmc.ncbi.nlm.nih.gov/articles/PMC11255540/
  - Hackner et al. Mindtraining: Playful Interaction Techniques for People with Dementia. https://link.springer.com/chapter/10.1007/978-3-319-46100-7_21
  - Tapping into the Future – Touchscreen Technology for People with Dementia: A Scoping Review (2025). https://www.tandfonline.com/doi/full/10.1080/10447318.2025.2587243
  - Neal D et al. Digital assistive technologies for community-dwelling people with dementia: systematic review of systematic reviews (INTERDEM). https://journals.sagepub.com/doi/10.1177/20552076251362353
- Motor / touch targets
  - Effect of Age on the Touchscreen Manipulation Ability of Community-Dwelling Adults (2021). https://pmc.ncbi.nlm.nih.gov/articles/PMC7924826/
  - Correlation between the Ability to Manipulate a Touchscreen Device and Hand Strength and Manual Dexterity (2021). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8431526/
  - Optimization of Touch Active Area Size Based on Click Position Bias in Older Adults' Touchscreen Interaction (2024). https://link.springer.com/chapter/10.1007/978-3-031-61543-6_15
  - Jin ZX, Plocher T, Kiff L. Touch Screen User Interfaces for Older Adults: Button Size and Spacing. https://www.researchgate.net/publication/225367546_Touch_Screen_User_Interfaces_for_Older_Adults_Button_Size_and_Spacing
  - Touchscreen mobile devices and older adults: A usability study. https://www.researchgate.net/publication/264815431_Touchscreen_mobile_devices_and_older_adults_A_usability_study
  - Exploring Usability Disparities in Multi-touch Screen Interaction Among Older Adults and Younger Individuals. https://scholar.hit.edu.cn/en/publications/exploring-usability-disparities-in-multi-touch-screen-interaction/
  - Vigouroux N et al. Drag-and-drop for older adults using touchscreen devices. https://hal.science/hal-01090431/document
  - Intuitive Learnability of Touch Gestures for Technology-Naïve Older Adults. https://ieeexplore.ieee.org/document/8212636
  - Examining the Usability of Touch Screen Gestures for Elderly People. https://link.springer.com/chapter/10.1007/978-3-319-48746-5_43
  - Essential tremor / Parkinson prevalence: https://www.apdaparkinson.org/article/other-causes-of-tremor/ ; https://academic.oup.com/ageing/article/51/7/afac135/6625704
- Vision
  - Contrast sensitivity dysfunction in Alzheimer's disease (1993). https://pubmed.ncbi.nlm.nih.gov/8232951/
  - Cronin-Golomb A. Visuospatial Function in Alzheimer's Disease and Related Disorders. https://www.bu.edu/neuropsychology/files/2015/02/Cronin-Golomb-AD-chapter-Budson-2011.pdf
  - Risacher SL et al. Visual contrast sensitivity in AD, MCI, and older adults with cognitive complaints. https://www.sciencedirect.com/science/article/abs/pii/S0197458012004290
  - GerontoVis: Data Visualization at the Confluence of Aging (2024). https://arxiv.org/html/2403.13173v1
  - Age-related changes in visual search: colour cues based on cone contrast and opponent modulation space (2020). https://pmc.ncbi.nlm.nih.gov/articles/PMC7721812/
  - Elderly-Centric Chromatics (2024). https://www.tandfonline.com/doi/full/10.1080/10447318.2024.2338659
  - DSDC Stirling, Light reflectance values (LRVs). https://www.dementia.stir.ac.uk/newsblog/dementia-design-toolkit-lrvs
  - Contrast Ratios & LRV for Dementia Design. https://signageforcare.com/us/learn/contrast-ratio-lrv-guide
- Hearing
  - NIDCD Quick Statistics About Hearing. https://www.nidcd.nih.gov/health/statistics/quick-statistics-hearing
  - ASHA, Hearing Loss and Aging: Implications for Audiologists. https://www.asha.org/articles/hearing-loss-and-aging-implications-for-audiologists/
  - Functional Age-Related Changes Within the Human Auditory System. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6399208/
  - Johns Hopkins Medicine, Presbycusis. https://www.hopkinsmedicine.org/health/conditions-and-diseases/presbycusis
- Motion / vestibular
  - W3C, Understanding SC 2.3.3 Animation from Interactions. https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
  - Vestibular perceptual learning improves self-motion perception, posture, and gait in older adults (2024). https://www.nature.com/articles/s42003-024-06802-5
  - Impaired Subjective Visual Vertical and Increased Visual Dependence in Older Adults With Falls. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8232053/
  - Immersive virtual reality for older adults: Challenges and solutions. https://www.sciencedirect.com/science/article/pii/S1568163725001175
- Learning, errors, distress
  - Tiberti C et al. (1998). Prevalence and correlates of the catastrophic reaction in Alzheimer's disease. Neurology 50(2):546-8. https://pubmed.ncbi.nlm.nih.gov/9484396/
  - Voigt-Radloff S et al. Structured relearning of ADLs in dementia: the RCT REDALI-DEM trial on errorless learning. https://pmc.ncbi.nlm.nih.gov/articles/PMC5364615/
  - Middleton EL, Schwartz MF (2012). Errorless learning in cognitive rehabilitation: A critical review. https://pmc.ncbi.nlm.nih.gov/articles/PMC3381647/
  - Kessels RPC, Olde Hensken LMG (2009). Effects of errorless skill learning in people with mild-to-moderate or severe dementia: RCT pilot. https://journals.sagepub.com/doi/abs/10.3233/NRE-2009-0529
  - de Werd MME et al. (2013). Errorless learning of everyday tasks in people with dementia. https://pubmed.ncbi.nlm.nih.gov/24049443/
  - Clare L, Woods B. Cognitive training and cognitive rehabilitation for mild to moderate dementia: a review. https://pmc.ncbi.nlm.nih.gov/articles/PMC3979126/
  - Flannery RB (2002). Treating learned helplessness in the elderly dementia patient. https://pubmed.ncbi.nlm.nih.gov/12501481/
  - Network Analysis: helplessness among late-life depressive symptoms in MCI and early dementia. https://pmc.ncbi.nlm.nih.gov/articles/PMC11065523/
  - Spaced Retrieval Effects on Learning Capacity in Patients With Mild-to-Moderate Cognitive Impairment: Systematic Review and Meta-Analysis (2023). https://econtent.hogrefe.com/doi/10.1027/1016-9040/a000510
  - A literature review of spaced-retrieval interventions. https://www.sciencedirect.com/science/article/pii/S1041610224014807
  - Kinect Project: People with dementia or MCI learning to play group motion-based games. https://www.sciencedirect.com/science/article/pii/S2352873719300460
- Standards
  - W3C. Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
  - W3C. WCAG 2.2 Quick Reference (AAA filter). https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa
  - W3C. Understanding SC 1.4.8 Visual Presentation. https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html
  - W3C. Understanding SC 3.1.5 Reading Level. https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html
  - W3C. Understanding SC 2.4.8 Location. https://www.w3.org/WAI/WCAG22/Understanding/location.html
  - W3C. Understanding SC 1.4.3 Contrast (Minimum) — rationale for 7:1 AAA. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
  - W3C. Making Content Usable for People with Cognitive and Learning Disabilities. https://www.w3.org/TR/coga-usable/
  - Apple. Human Interface Guidelines — Accessibility. https://developer.apple.com/design/human-interface-guidelines/accessibility
  - Apple. Human Interface Guidelines — Typography. https://developer.apple.com/design/human-interface-guidelines/typography
  - Nielsen Norman Group. Usability for Senior Citizens. https://www.nngroup.com/articles/usability-for-senior-citizens/
  - Nielsen Norman Group. The Hamburger-Menu Icon Today: Is it Recognizable? https://www.nngroup.com/articles/hamburger-menu-icon-recognizability/
  - Nielsen Norman Group. Hamburger Menus and Hidden Navigation Hurt UX Metrics. https://www.nngroup.com/articles/hamburger-menus/
  - Interface Design for Products for Users with Advanced Age and Cognitive Impairment. IJERPH 2022;19:2466. https://doi.org/10.3390/ijerph19042466
