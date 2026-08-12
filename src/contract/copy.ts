// C13 — the closed patient vocabulary · src/contract/copy.ts
//
// Every string the product may say to the patient, each with its spoken-audio
// duration as data (deviation D-8: duration is per-string data, never a runtime
// syllable estimator); the two banned lists; the copy limits. Frozen here rather
// than in src/domain/ because the blind test-writer may read only
// src/contract/** (deviations D-7, D-8).
//
// TRANSCRIBED VERBATIM from DESIGN-SYSTEM §7.2 / §7.3 / §7.4 and SYNTHESIS §2.2.
//
// spokenMs sources:
//   - The five face-card rungs are PINNED by C14's blind test, which decomposes
//     one unanswered face card as RUNG_SILENCE_MS + the spoken durations on these
//     rows (§9.1 / §8.5): 8900 + 1200 + 11000 + 6900 + 12300 + 9900 = 50200.
//       rung -1 answer_first : 8900 - 3000 hold      = 5900
//       rung 0               : 11000 - 8000 silence  = 3000  ("And who is this?")
//       rung 1               : 6900  - 5000 silence  = 1900  ("Marg…")
//       rung 2 question+instr: 12300 - 6000 silence  = 6300  (split 3000 + 3300)
//       rung 3               : 9900  - 4000 hold      = 5900
//   - Sayings: §8.4 (stem 3.3 s, completion 3.9 s).
//   - All other strings: DESIGN-SYSTEM §6.3's stated rate of 3.0 syl/s + 800 ms
//     of silence each side, rounded to the nearest 100 ms. These rows are not
//     cross-checked by any other frozen export (C14 sums only the face card from
//     C13 rows; every other SEGMENT_MS total is transcribed directly from §9.1).
//
// deps: none (pure data + RegExp literals; imports nothing).

/** Every key in the §7.3 patient-facing vocabulary. Nothing else may reach the surface. */
export type CopyKey = 'notification' | 'ident.1' | 'ident.2' | 'saying.stem' | 'saying.full'
  | 'song' | 'answer_first' | 'rung0' | 'rung1' | 'rung2.question' | 'rung2.instruction'
  | 'rung3' | 'probe.intro' | 'probe.question' | 'probe.instruction' | 'probe.reveal'
  | 'month_target.full' | 'month_target.rung0' | 'interview.open' | 'interview.listening'
  | 'interview.cue1' | 'interview.cue2' | 'interview.close' | 'stop.label' | 'stop.spoken'
  | 'content_expired' | 'handover.first_name';

export interface CopyEntry {
  /** The string, verbatim, with `{…}` slots for human-typed content. */
  template: string;
  /** Spoken-audio duration in ms. 0 when the string is never spoken (`spoken: false`). */
  spokenMs: number;
  /** Whether the in-app voice speaks this string during the programme. */
  spoken: boolean;
  /** Whether this string is written on the caption strip / panel. */
  written: boolean;
}

/** The §7.3 vocabulary, verbatim. `Object.keys(COPY)` deep-equals the CopyKey set. */
export const COPY: Readonly<Record<CopyKey, CopyEntry>> = {
  // Notification (§9.3) — delivered by the OS, not the in-app voice.
  'notification': { template: 'This morning’s pictures are on now.', spokenMs: 0, spoken: false, written: true },

  // Ident (§8.3) — byte-identical every session.
  'ident.1': { template: 'Here are your pictures.', spokenMs: 3300, spoken: true, written: true },
  'ident.2': { template: 'I can hear you when you talk.', spokenMs: 3900, spoken: true, written: true },

  // The saying / M-35 (§8.4). Shipped, era + locale matched; the canonical default shown here.
  'saying.stem': { template: 'A stitch in time…', spokenMs: 3300, spoken: true, written: true },
  'saying.full': { template: 'A stitch in time… saves nine.', spokenMs: 3900, spoken: true, written: true },

  // Song (§8.2 / §7.3) — the clip plays; the voice announces the title card.
  'song': { template: '{title}. {artist}, {year}.', spokenMs: 4000, spoken: true, written: true },

  // The face card / M-20 (§8.5). answer_first and rung3 are the same string.
  'answer_first': { template: '{Name}. {sentence}', spokenMs: 5900, spoken: true, written: true },
  'rung0': { template: 'And who is this?', spokenMs: 3000, spoken: true, written: true },
  'rung1': { template: '{first k letters}…', spokenMs: 1900, spoken: true, written: true },
  'rung2.question': { template: 'Which one is {Name}?', spokenMs: 3000, spoken: true, written: true },
  'rung2.instruction': { template: 'Put your finger on {Name}.', spokenMs: 3300, spoken: true, written: true },
  'rung3': { template: '{Name}. {sentence}', spokenMs: 5900, spoken: true, written: true },

  // The probe / M-21 (§8.7). Shipped stock faces only; no family content, ever.
  'probe.intro': { template: 'Now some faces from an old album. Strangers, all of them.', spokenMs: 6000, spoken: true, written: true },
  'probe.question': { template: 'Which one is {Name}?', spokenMs: 3000, spoken: true, written: true },
  'probe.instruction': { template: 'Put your finger on {Name}.', spokenMs: 3300, spoken: true, written: true },
  'probe.reveal': { template: '{Name}.', spokenMs: 2600, spoken: true, written: true },

  // The month target / M-25 (§8.6). rung_ladder_variant = three_rung_target.
  'month_target.full': { template: '{sentence}', spokenMs: 5900, spoken: true, written: true },
  'month_target.rung0': { template: '{stem}…', spokenMs: 2600, spoken: true, written: true },

  // The interview / M-40 (§8.8).
  'interview.open': { template: 'Tell me about this one.', spokenMs: 3600, spoken: true, written: true },
  'interview.listening': { template: 'I’m listening.', spokenMs: 2900, spoken: true, written: true },
  'interview.cue1': { template: 'Take your time.', spokenMs: 2600, spoken: true, written: true },
  'interview.cue2': { template: 'Tell me anything at all.', spokenMs: 3900, spoken: true, written: true },
  'interview.close': { template: 'Thank you.', spokenMs: 2300, spoken: true, written: true },

  // The stop panel (§8.1). The label is written on a persistent panel; the tapped line is spoken.
  'stop.label': { template: 'Stop for now', spokenMs: 0, spoken: false, written: true },
  'stop.spoken': { template: 'All right. Let’s stop there.', spokenMs: 3300, spoken: true, written: true },

  // Content expired (§9.3) — the patient-facing empty state.
  'content_expired': { template: 'Nothing to look at just now.', spokenMs: 3900, spoken: true, written: true },

  // Handover first page (§7.3) — written only, never spoken.
  'handover.first_name': { template: '{First name}', spokenMs: 0, spoken: false, written: true },
} as const;

/**
 * The §7.4 banned lexicon, verbatim, over and above §9. Enforced by a CI check
 * over every string reachable from src/ui/patient/** and the shipped content
 * library, case-insensitively on word boundaries.
 *
 * NOTE FOR THE FREEZE REVIEW: this list contains `'right'` (the evaluation word
 * from the correct/incorrect/wrong/right quartet), yet §7.3 ships the approved
 * stop-panel line "All right. Let's stop there.", whose second word is `right`.
 * A word-boundary banned-word check cannot pass COPY['stop.spoken'] while `right`
 * is banned. Both are transcribed verbatim; the contradiction is surfaced here
 * rather than silently resolved, because the vocabulary is frozen by human review.
 */
export const BANNED_PATIENT_WORDS: readonly string[] = [
  'session', 'card', 'deck', 'review', 'practice', 'exercise', 'test', 'quiz', 'score',
  'correct', 'incorrect', 'wrong', 'right', 'try', 'again', 'next', 'start', 'begin',
  'finish', 'done', 'complete', 'continue', 'skip', 'due', 'streak', 'backlog',
  'today’s', 'remaining', 'level', 'progress', 'tap', 'press', 'click', 'choose',
  'select', 'ready', 'welcome', 'sorry', 'oops', 'well done', 'good', 'great', 'nearly',
  'almost', 'nice', 'brilliant', 'remember', 'forget', 'memory', 'recall', 'brain',
  'sync', 'queue', 'algorithm', 'error', 'failed', 'retry', 'loading', 'please wait',
];

/**
 * The fifteen numbered banned claims (SYNTHESIS §2.2). Each rule carries a
 * case-insensitive, word-bounded pattern that matches the claim's verbatim §2.2
 * source phrasing. Used by the claim-lint (B32) over marketing, app-store,
 * onboarding, in-app, investor, clinician-label and testimonial copy. Rule 15's
 * "~6-month delay in expected decline" must be caught on sight.
 */
export const BANNED_CLAIM_RULES: readonly { rule: number; pattern: RegExp; source: string }[] = [
  { rule: 1, pattern: /\b(slows?|delays?|halts?|prevents?|treats?|reverses?|modif(?:y|ies))\b[\s\S]{0,60}\b(dementia|alzheimer’?s?|alzheimer'?s?|mci|cognitive decline)\b/i,
    source: 'SYNTHESIS §2.2 #1 (disease-trajectory claim; FDA 2026 General Wellness, FTC Lumosity $2M)' },
  { rule: 2, pattern: /\breduces?\b[\s\S]{0,25}\bdementia risk\b/i,
    source: 'SYNTHESIS §2.2 #2 (Gates 2019: no trial reported incident dementia at all)' },
  { rule: 3, pattern: /\b(builds?|protects?|preserves?)\b[\s\S]{0,40}\bcognitive reserve\b/i,
    source: 'SYNTHESIS §2.2 #3 (Wilson 2010: higher reserve → faster post-diagnosis decline)' },
  { rule: 4, pattern: /\b(synapses|neurons|brain tissue|brain volume|neuroplasticity|use it or lose it|exercise for your brain)\b/i,
    source: 'SYNTHESIS §2.2 #4 (no human RCT; animal enrichment data contradictory)' },
  { rule: 5, pattern: /\bimproves?\b[\s\S]{0,40}\b(memory|focus|attention|thinking|brain health)\b/i,
    source: 'SYNTHESIS §2.2 #5 (Owen 2010; Simons 2016)' },
  { rule: 6, pattern: /\btransfers?\b[\s\S]{0,10}\bbeyond\b/i,
    source: 'SYNTHESIS §2.2 #6 (no transfer beyond practised items)' },
  { rule: 7, pattern: /\b(improves?|delays?)\b[\s\S]{0,40}\b(activities of daily living|independence|institutionali[sz]ation)\b/i,
    source: 'SYNTHESIS §2.2 #7 (Bahar-Fuchs 2019; Kudlicka 2023: small negative on function)' },
  { rule: 8, pattern: /\bimproves?\b[\s\S]{0,25}\bquality of life\b/i,
    source: 'SYNTHESIS §2.2 #8 (reminiscence QoL null overall; community subgroup null)' },
  { rule: 9, pattern: /\bimproves?\b[\s\S]{0,20}\bmood\b|\breduces?\b[\s\S]{0,20}\bdepression\b/i,
    source: 'SYNTHESIS §2.2 #9 (Bahar-Fuchs 2019: unable to determine; iCST: no improvement)' },
  { rule: 10, pattern: /\bbenefits?\b[\s\S]{0,25}\b(persist|last|remain|continue)\b|\bafter (you )?stop(ping)?\b/i,
    source: 'SYNTHESIS §2.2 #10 (Maintenance CST null on cognition; SenseCam gone at 6 months)' },
  { rule: 11, pattern: /\b(MMSE|MoCA|ADAS-Cog|CDR-SB)\b/i,
    source: 'SYNTHESIS §2.2 #11 (lecanemab −15-month effect below MCID; a memory app must not claim movement)' },
  { rule: 12, pattern: /\b(clinically proven|clinically validated|brain training|cognitive enhancement|protect their memory)\b|keeps? alzheimer’?s? at bay|keeps? alzheimer'?s? at bay/i,
    source: 'SYNTHESIS §2.2 #12 (forbidden marketing phrases)' },
  { rule: 13, pattern: /\b(improvement chart|upward trend|before\/after|before and after)\b/i,
    source: 'SYNTHESIS §2.2 #13 (no improvement chart, trend line, or before/after shown to a family)' },
  { rule: 14, pattern: /\b(FDA|MHRA|CE)\b[\s\S]{0,30}\b(status|clearance|cleared|approval|approved|designation)\b/i,
    source: 'SYNTHESIS §2.2 #14 (no regulatory status we do not hold; a designation is not a clearance)' },
  { rule: 15, pattern: /~?\s*6[-‑ ]?month delay in expected decline/i,
    source: 'SYNTHESIS §2.2 #15 (uncited cross-trial inference; DELETE ON SIGHT)' },
] as const;

/** §7.1 rule 3 (≤ 8 words per prompt, ≤ 15 words per sentence) and §8.1 (≤ 2 caption lines). */
export const COPY_LIMITS: { maxPromptWords: 8; maxSentenceWords: 15; maxLines: 2 } = {
  maxPromptWords: 8,
  maxSentenceWords: 15,
  maxLines: 2,
};

/** The mask glyph for a partial cue: an em-dash, never an underscore (§7.2 decision that also removed a colour token). */
export const MASK_GLYPH: '—' = '—';
