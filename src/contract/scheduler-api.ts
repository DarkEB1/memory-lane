// C05 — the scheduler public API · src/contract/scheduler-api.ts
//
// The directive, plan, signal and telemetry shapes, and the Scheduler interface
// the barrel must satisfy. PURE: type-only imports from C01–C04.
//
// spec: SCHEDULER-SPEC §4, §4.1, §17.3 (verbatim), §17.4 (verbatim).
//
// The §17.3 block is transcribed field-for-field: there is NO
// `scheduledIntervalDays` and NO `intervalDeviationDays`; the within- and
// across-session deviation fields have DISTINCT names.

import type { SchedulerConfig } from './config';
import type { Attempt, SchedulerEvent } from './events';
import type { SchedulerState } from './scheduler-state';
import type {
  CueLevel,
  Grade,
  ItemId,
  PresentationMode,
  Rung,
  SessionEndReason,
  SessionId,
  Tier,
  TrialClass,
} from './types';

export type TrialDirective =
  | { kind: 'NO_SESSION' }
  | {
      kind: 'TRIAL';
      itemId: ItemId;
      openingCueLevel: CueLevel;
      floorCueLevel: CueLevel;
      trialClass: TrialClass;
      foilItemId: ItemId | null;
    }
  | { kind: 'PROBE_BLOCK'; probeItemIds: readonly ItemId[] }
  | { kind: 'FILLER' }
  | { kind: 'CLOSER'; itemId: ItemId | null } // null => generic P11 closer
  | { kind: 'END'; reason: SessionEndReason };

export interface RosterPlan {
  itemIds: readonly ItemId[]; // length <= SESSION_MAX_ITEMS, in truncation order
  forcedMissing: readonly ItemId[]; // tier-1 items squeezed out; ascending itemId
}

export type SchedulerSignal =
  | { kind: 'tier1_floor_unsatisfied'; itemIds: readonly ItemId[] }
  | { kind: 'items_set_aside'; itemIds: readonly ItemId[] }
  | { kind: 'acute_change_suspected'; limb: 'support' | 'miss' | 'absence' };

/**
 * SCHEDULER-SPEC §17.3, transcribed field-for-field. EXACTLY 23 fields.
 *
 * The item- and entry-derived fields are `T | null`: they carry a value on the
 * BRANCH-3 shape (a TRIAL, or a CLOSER naming a real item — §17.3 note 1) and
 * are `null` on the all-null shape (BRANCH 1 `activeSession === null`, BRANCH 2
 * `CLOSER{itemId:null}`, BRANCH 4 an id not in `state.items`). The nullability
 * of every field is therefore FORCED by the type: a closer that names a real
 * item cannot legally return `null` for `itemTier` / `attainedRung` /
 * `scheduledIntervalMs`, because those are non-null on the branch it takes.
 *
 * `repetitionNumber` is always present (never null) and is the PRE-increment
 * value at call time (§17.3 note 4) — the type pins its PRESENCE; the pre/post
 * increment is a rule discharged by `reduce`, not by this shape.
 *
 * The last four fields are typed `null` (not `number | null`): v1 has no
 * continuous model and never emits a non-null value for them (§22.12).
 */
export interface TrialSchedulingTelemetry {
  itemId: ItemId | null; // null ONLY for the all-null shape (CLOSER{itemId:null} etc.)
  itemTier: Tier | null; // null ONLY for the all-null shape
  repetitionNumber: number; // always present; PRE-increment (§17.3 note 4)
  daysSinceLastReview: number | null; // Math.floor(clampGap(now - lastSeenAtMs)/86400000)
  daysSinceFirstIntroduction: number | null; // Math.floor(clampGap(now - addedAtMs)/86400000)
  scheduledIntervalMs: number | null; // ACROSS_LADDER_MS[effectiveAcrossRung]; ALWAYS integer ms
  acrossIntervalDeviationMs: number | null; // (now - lastSeenAtMs) - scheduledIntervalMs, signed; NOT clamped
  withinSessionRung: Rung | null;
  withinIntervalDeviationMs: number | null; // nowMonoMs - entry.nextEligibleMonoMs, signed; NOT clamped
  attainedRung: Rung | null; // item.acrossRung
  driftAdjustmentApplied: 0 | 1 | 2;
  difficultyFloorTriggered: boolean; // session.gentleActive
  overdueReturnApplied: boolean;
  openingCueLevel: CueLevel;
  floorCueLevel: CueLevel;
  wasVanishAttempt: boolean;
  presentationMode: PresentationMode;
  nDistractors: 0 | 1;
  isCloser: boolean;
  stability: null;
  difficulty: null;
  retrievability: null;
  predictedRecallProbability: null;
}

/** SCHEDULER-SPEC §17.4, transcribed field-for-field. EXACTLY 9 fields. */
export interface SessionSchedulingTelemetry {
  sessionId: SessionId;
  endedOnSuccess: boolean; // === closerPresented (§12.3)
  sessionEndReason: SessionEndReason;
  plannedNItems: number; // activeSession.roster.length
  completedNItems: number; // count of roster entries with trialsThisSession >= 1
  probeBlockEmitted: boolean; // activeSession.probeEmitted
  probeTruncated: boolean; // activeSession.probeTruncated
  nFillersShown: number; // activeSession.fillersShown
  clockAnomalyCount: number; // participant.clockAnomalyCount, at call time
}

/** The ten methods of §4, exactly as declared. The barrel must satisfy this. */
export interface Scheduler {
  /** Pure. The only constructor. */
  initialState(config: SchedulerConfig): SchedulerState;

  /** Pure and TOTAL: every event applied to every state yields a state.
   *  Never throws. Never reads a clock. Never calls Rng. */
  reduce(state: SchedulerState, event: SchedulerEvent): SchedulerState;

  /** Pure. fold(config, events) === events.reduce(reduce, initialState(config)).
   *  `events` MUST already be in canonical order (§6.1); fold does not sort. */
  fold(config: SchedulerConfig, events: readonly SchedulerEvent[]): SchedulerState;

  /** Pure. `nowMonoMs` is scoped to state.activeSession.bootId. */
  nextTrial(state: SchedulerState, nowMonoMs: number): TrialDirective;

  /** Pure. `nowAnchorMs` is a server-anchored epoch ms. */
  planRoster(state: SchedulerState, nowAnchorMs: number): RosterPlan;

  /** Pure, total over its declared domain. */
  gradeOf(a: Attempt, slowLatencyMs: number): Grade;

  /** Pure. True when the attempt must drive no state transition (§7.3). */
  isVoid(a: Attempt, minPlausibleLatencyMs: number): boolean;

  /** Pure. Recomputed on demand; never mutates. Ordered per §17.2. */
  signals(state: SchedulerState, nowAnchorMs: number): readonly SchedulerSignal[];

  /** Pure. The scheduling-state group of telemetry §7 for one presentation.
   *  Call it BEFORE folding the TrialCompleted it describes, so every
   *  item-derived field is the PRE-increment value (§17.3). A CLOSER naming a
   *  real item returns the item-derived shape of §17.3; only CLOSER{itemId:null}
   *  — and the two fallbacks of §17.3 — return all-null. */
  trialTelemetry(
    state: SchedulerState,
    directive: Extract<TrialDirective, { kind: 'TRIAL' } | { kind: 'CLOSER' }>,
    nowAnchorMs: number,
    nowMonoMs: number,
  ): TrialSchedulingTelemetry;

  /** Pure. The per-session group of telemetry §7. Call it with the reason and
   *  closerPresented flag you are about to put on `SessionEnded`, BEFORE folding
   *  it. Returns null iff state.activeSession === null. §17.4. */
  sessionTelemetry(
    state: SchedulerState,
    reason: SessionEndReason,
    closerPresented: boolean,
  ): SessionSchedulingTelemetry | null;
}
