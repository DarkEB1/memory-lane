// C04 — the scheduler state model · src/contract/scheduler-state.ts
//
// Every state record with its exact field set, so eight domain modules taking
// SchedulerState mean the same thing by it. PURE: type-only imports from C01, C02.
//
// spec: SCHEDULER-SPEC §3.1, §3.2, §3.3, §3.4.
//
// Named absences (asserted by the blind test): no lapseCount, no missCount,
// no isProbe, no dueCount, no backlog on any interface. `gentleActive` and
// `driftAtStart` exist on ActiveSessionState and NOT on ParticipantState —
// which is what makes them snapshots.

import type { SchedulerConfig } from './config';
import type {
  BootId,
  CueLevel,
  DeviceId,
  Grade,
  ItemId,
  ItemStatus,
  Rung,
  SessionEndReason,
  SessionId,
  Tier,
  TrialClass,
} from './types';

/** One per non-probe content item. Exactly 13 fields. §3.1. */
export interface ItemState {
  itemId: ItemId;
  tier: Tier; // human-set. The algorithm NEVER writes this.
  recognitionBlocked: boolean; // P16: deceased / estranged / do-not-show. Human-set.
  contentReady: boolean; // ADR §4.2: a card is never shown unless all media are ready.
  acrossRung: Rung; // index into ACROSS_LADDER_MS. Telemetry: attained_rung.
  cueLevel: CueLevel; // the item's cue FLOOR — the support it is normally given.
  stableSessions: number; // 0..255. Consecutive qualifying sessions at this floor.
  status: ItemStatus;
  lastSeenAtMs: number | null; // anchorMs of the terminal response of its last counted trial.
  dueAtMs: number; // anchorMs. For a never-presented item, === addedAtMs.
  addedAtMs: number; // anchorMs.
  sessionsSincePresented: number; // 0..255. Drives the tier-1 frequency floor.
  repetitionNumber: number; // 0..2147483647. Telemetry only.
}

/** §3.2. One counted trial's grade and class, retained on the roster entry. */
export interface CountedTrial {
  grade0: Grade;
  trialClass: TrialClass;
}

/** One per item in the active session's roster. Exactly 13 fields. §3.2. */
export interface RosterEntry {
  itemId: ItemId;
  withinRung: Rung; // index of the delay to apply AFTER the next success
  nextEligibleMonoMs: number;
  trialsThisSession: number; // 0..7, counted trials only
  withinDone: boolean;
  vanishAttempted: boolean;
  vanishResolved: boolean;
  cueRaisedThisSession: boolean; // at most ONE floor-miss cue escalation per item per session
  overdueReturn: boolean; // snapshot taken at planRoster; §9.2
  floorAtSessionStart: CueLevel; // telemetry + fixtures; never read by a rule
  lastTerminalAnchorMs: number | null;
  lastTerminalMonoMs: number | null;
  trials: CountedTrial[]; // length <= 7
}

/** Ephemeral, discarded at session close. Exactly 18 fields. §3.2. */
export interface ActiveSessionState {
  sessionId: SessionId;
  deviceId: DeviceId;
  bootId: BootId;
  startedAnchorMs: number;
  startedMonoMs: number;
  localDayIndex: number;
  roster: RosterEntry[]; // length <= SESSION_MAX_ITEMS
  trialsCompleted: number; // counted, non-closer, non-probe
  fillersShown: number; // 0..SESSION_MAX_FILLERS
  lastPresentedItemId: ItemId | null;
  probeEmitted: boolean;
  probeElapsedMs: number;
  probeTruncated: boolean; // §16; the holder for telemetry's `probeTruncated`
  vanishUsed: boolean; // deck-wide cap of VANISH_PER_SESSION
  gentleActive: boolean; // snapshot of participant.gentleSessionsRemaining > 0
  driftAtStart: 0 | 1 | 2; // snapshot of participant.driftLevel
  closerEmitted: boolean;
  endRequested: SessionEndReason | null;
}

/** §3.3. One per closed session, held in the participant history ring buffer. Exactly 9 fields. */
export interface SessionSummary {
  sessionId: SessionId;
  startedAnchorMs: number;
  localDayIndex: number;
  presentedItems: number; // 0..8
  missRatePpt: number; // 0..1000
  supportIdxMilli: number; // 0..3000
  qualifying: boolean; // presentedItems >= DRIFT_MIN_ITEMS_PER_SESSION
  endedOnSuccess: boolean;
  endReason: SessionEndReason;
}

/** §3.3. Exactly 9 fields. */
export interface ParticipantState {
  driftLevel: 0 | 1 | 2; // req 10. Surfaces to nobody.
  gentleSessionsRemaining: 0 | 1 | 2 | 3; // req 7's fast lever
  probeDisabled: boolean; // §5.2 point 5, human-set only
  sessionCount: number; // 0..2147483647; incremented at session close
  lastSessionEndedAtMs: number | null; // anchorMs
  lastProbeLocalDay: number | null;
  acuteLastFiredAtMs: number | null; // anchorMs; advanced only by AcuteSignalDelivered
  clockAnomalyCount: number; // 0..255
  history: SessionSummary[]; // ring buffer, newest last, length <= SESSION_HISTORY_MAX
}

/** §3.4. Exactly 7 fields. */
export interface SchedulerState {
  readonly version: 1;
  readonly paramsVersion: string; // e.g. 'camp-1.0.0'; opaque to every rule
  config: SchedulerConfig;
  participant: ParticipantState;
  items: Readonly<Record<ItemId, ItemState>>; // key iteration order is NEVER relied upon
  activeSession: ActiveSessionState | null;
  seqHighWater: Readonly<Record<DeviceId, number>>; // §6.2 idempotency
}
