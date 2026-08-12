// C14 — the programme timetable and timing floors · src/contract/programme.ts
//
// The frozen §9.1 zero-input table, the §6.3 dwell floors at all three
// enrolment steps, and every motion, input, tone and probe duration — as
// contract DATA so A38 (the zero-input walk), A27 (the closed duration set)
// and A43 are assertable blind and there is exactly one definition (D-6).
// src/ui/tokens.ts (U01) re-exports these; the numbers live here once.
//
// PURE: the only import is the type-only RungDwellStep. No runtime imports,
// no react/react-native/expo/supabase/Date/Math.random, no zod. Imported by
// src/domain/session/** which composes segments from these primitives.
//
// spec: DESIGN-SYSTEM §9.1 (the executable zero-input table), §9.2 (Nothing
//       Today), §8.2 (session order), §6.3 (dwell floors), §6.4 (motion),
//       §6.6 (input), §4.1 (patientTiming / patientMotion / patientSound —
//       the literal source of every number), §9.3/§11.5; MODULES D-6, DEFECT-4.
//
// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITION ARITHMETIC (internally consistent — verified below).
//
// STANDARD zero-input walk (§9.1), one instance each unless multiplied:
//   ident 8000 + 2×saying 28400 + song 30000 + month_target 37900
//   + 6×face_card 301200 + probe_intro 6000 + 6×probe_item 97800
//   + interview 70000 + signoff 14200                     = 593 500 ms
//   (closedown never advances on the timer → 0 contribution).
//   ⇒ TOTAL_ZERO_INPUT_MS_STANDARD = 593_500. A38: 593.5 s ± 0.5 s.
//
// LONG: CAMP_CARDS drops to 5 while each dwell lengthens; the walk stays
//   under budget: 8000 + 28400 + 30000 + 44900 + 5×57200(=286000) + 6000
//   + 97800 + 70000 + 14200 = 585 300 ms < 600 000. SHORT = 558 500 ms.
//   Only month_target and face_card vary by step — they are the speech-gated
//   dwell segments; the variation is exactly the sum of the RUNG_SILENCE_MS
//   deltas for the rungs each contains. Everything else is step-invariant.
//
// NOTHING TODAY (§9.2, amendment A5): the demand block (month_target, the six
//   face cards, the probe block and the interview) is replaced by six M-02
//   cards; the song ALWAYS plays; ident, both sayings and the sign-off are
//   unchanged. Composition:
//     ident 8000 + 2×saying 28400 + song 30000 + 6×m02_card 83400
//     + signoff 14200                                     = 164 000 ms.
//   DEFECT-1: §9.2's printed "160 s" is superseded — the components win and
//   sum to 164 000 ms. There is no month_target/face_card/probe/interview in
//   this walk, so the total is step-invariant.
// ─────────────────────────────────────────────────────────────────────────────

import type { RungDwellStep } from './types';

/**
 * Every segment kind the programme can present. The demand segments
 * (month_target, face_card, probe_item) are speech-gated; the rest run on a
 * plain timer. closedown and content_expired hold forever (never advance).
 */
export type SegmentKind =
  | 'ident'
  | 'saying'
  | 'song'
  | 'month_target'
  | 'face_card'
  | 'm02_card'
  | 'probe_intro'
  | 'probe_item'
  | 'interview'
  | 'signoff'
  | 'closedown'
  | 'content_expired'
  | 'handover_first_page';

/**
 * Zero-input dwell for ONE instance of each segment kind, per rungDwellStep,
 * in ms. DESIGN-SYSTEM §9.1 (standard column) + §4.1 (short / long columns).
 * Multiply by the instance counts (CAMP_CARDS, NOTHING_TODAY_CARDS, the two
 * sayings, six probe items) to compose a walk. closedown / content_expired
 * hold forever → 0 contribution.
 *
 * Only month_target and face_card vary across steps: each embeds speech-gated
 * rungs, so its dwell changes by exactly the RUNG_SILENCE_MS delta of the
 * rungs it contains. face_card = answer-first 8900 + withdrawal 1200 + rung0
 * + rung1 + rung2 + rung3; at standard 8900+1200+11000+6900+12300+9900=50 200.
 */
export const SEGMENT_MS: Readonly<Record<SegmentKind, Readonly<Record<RungDwellStep, number>>>> = {
  ident: { short: 8_000, standard: 8_000, long: 8_000 },
  saying: { short: 14_200, standard: 14_200, long: 14_200 },
  song: { short: 30_000, standard: 30_000, long: 30_000 },
  // month target — 3 rungs (0/1/2), speech-gated; varies by their silence deltas.
  month_target: { short: 32_900, standard: 37_900, long: 44_900 },
  // face card — answer-first + withdrawal + rungs 0/1/2/3, speech-gated.
  face_card: { short: 45_200, standard: 50_200, long: 57_200 },
  m02_card: { short: 13_900, standard: 13_900, long: 13_900 },
  probe_intro: { short: 6_000, standard: 6_000, long: 6_000 },
  probe_item: { short: 16_300, standard: 16_300, long: 16_300 },
  interview: { short: 70_000, standard: 70_000, long: 70_000 },
  signoff: { short: 14_200, standard: 14_200, long: 14_200 },
  closedown: { short: 0, standard: 0, long: 0 },
  content_expired: { short: 0, standard: 0, long: 0 },
  handover_first_page: { short: 5_000, standard: 5_000, long: 5_000 },
};

/** The §9.1 standard zero-input walk sums here exactly. A38: 593.5 s ± 0.5 s. */
export const TOTAL_ZERO_INPUT_MS_STANDARD: 593_500 = 593_500;

/** The hard session budget (§11.5). Every walk at every step stays under it. */
export const SESSION_BUDGET_MS: 600_000 = 600_000;

/**
 * §6.3 dwell floors — the silence budget (NOT the total dwell) added to the
 * spoken prompt duration at each rung, per rungDwellStep, in ms.
 * baseDwellMs(rung, spokenMs, step) = spokenMs + RUNG_SILENCE_MS[rung][step].
 * Rung −1 = answer-first (3.0 s hold); rung 3 = familiarity exposure (4.0 s
 * hold). DEFECT-4: rungs −1 and 3 are constant across steps; the short/long
 * columns for rungs 0/1/2 come from §4.1, not §6.3's printed standard column.
 */
export const RUNG_SILENCE_MS: Readonly<Record<-1 | 0 | 1 | 2 | 3, Readonly<Record<RungDwellStep, number>>>> = {
  [-1]: { short: 3_000, standard: 3_000, long: 3_000 },
  0: { short: 6_000, standard: 8_000, long: 11_000 },
  1: { short: 3_500, standard: 5_000, long: 7_000 },
  2: { short: 4_500, standard: 6_000, long: 8_000 },
  3: { short: 4_000, standard: 4_000, long: 4_000 },
};

/** §6.3 / §4.1: the caption withdrawal after the answer-first beat. */
export const WITHDRAWAL_MS: 1200 = 1200;

/** §6.3 (B2): the rung clock restarts this long after voice activity stops. */
export const SPEECH_GATE_RESTART_MS: 1500 = 1500;

/** §6.3 (B2): a rung may be extended by speech to at most this × its base dwell. */
export const SPEECH_GATE_MAX_EXTENSION: 3 = 3;

/** §6.1 / §4.1: a touch replays and holds one picture up to this hard ceiling. */
export const REPLAY_CEILING_MS: 60_000 = 60_000;

/** §6.6 / §4.1: input lockout after any committing touch (still acknowledged). */
export const INPUT_LOCKOUT_MS: 400 = 400;

/**
 * §6.4 / §4.1 (patientMotion): every animation duration on the patient surface.
 * demoGap is the pause between the two demonstration mats — a delay, not an
 * animation duration — which is why it is the one value here NOT in
 * ALLOWED_DURATIONS_MS (A27 enumerates animation durations only).
 */
export const MOTION_MS: {
  crossDissolve: 600;
  captionWithdraw: 1200;
  ackIn: 100;
  ackHold: 200;
  ackOut: 200;
  demoRise: 300;
  demoHold: 600;
  demoFall: 300;
  demoGap: 400;
  demoLoop: 4000;
} = {
  crossDissolve: 600,
  captionWithdraw: 1200,
  ackIn: 100,
  ackHold: 200,
  ackOut: 200,
  demoRise: 300,
  demoHold: 600,
  demoFall: 300,
  demoGap: 400,
  demoLoop: 4000,
};

/**
 * §6.4 / A27: the closed set of animation durations on the patient surface.
 * Every animation value in MOTION_MS is a member (demoGap is a pause, not an
 * animation) and nothing else is. ackIn ≤ 100 is the one sub-300 ms member.
 */
export const ALLOWED_DURATIONS_MS: readonly [100, 200, 300, 600, 1200, 4000] = [
  100, 200, 300, 600, 1200, 4000,
];

/** §4.1 (patientSound): the single undifferentiated tone. M-137. */
export const TONE: { ms: 180; attackMs: 40; fundamentalHz: 220; lufs: -16 } = {
  ms: 180,
  attackMs: 40,
  fundamentalHz: 220,
  lufs: -16,
};

/** §9.1 / §4.1: the probe block's hard time cap. */
export const PROBE_BLOCK_CAP_MS: 120_000 = 120_000;

/** §9.1: the probe block's hard item cap. */
export const PROBE_MAX_ITEMS: 8 = 8;

/** §8.2 / §9.1: face-card count per step. Drops to 5 at long to stay under budget. */
export const CAMP_CARDS: Readonly<Record<RungDwellStep, number>> = {
  short: 6,
  standard: 6,
  long: 5,
};

/** §9.2: one M-02 card (photo, name, one spoken sentence, nothing asked). */
export const M02_CARD_MS: 13_900 = 13_900;

/** §9.2: M-02 cards substituted into a Nothing Today walk. */
export const NOTHING_TODAY_CARDS: 6 = 6;

/** §6.2: the shared-device handover first page advances to ident at this time. */
export const HANDOVER_FIRST_PAGE_MS: 5_000 = 5_000;

/** §11.5: below this battery percent the session ends at the next zero-demand boundary. */
export const BATTERY_TRUNCATE_PERCENT: 25 = 25;
