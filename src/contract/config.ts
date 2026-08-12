// C02 — scheduler configuration · src/contract/config.ts
//
// The 49-field SchedulerConfig and the single defaultConfig value, so that no
// rule anywhere contains a number. PURE: type-only import from C01.
//
// spec: SCHEDULER-SPEC §2 (constants table), §2.1 (the complete declaration and
//       the literal), §2.3 (well-formedness precondition).

import type { ItemId, Rung, Tier } from './types';

export interface SchedulerConfig {
  // ---- per-participant settings ----
  paramsVersion: string; // opaque to every rule; copied verbatim into state
  tzOffsetMinutes: number; // integer in [-720, 840]; frozen at enrolment (§1.4)
  withinStartRung: Rung; // 0..6; DEFAULT 0
  probeItemIds: readonly ItemId[]; // ordered, frozen at enrolment; DEFAULT []
  acuteSignalEnabled: boolean; // §17.1 kill switch; DEFAULT true

  // ---- ladders and ceilings ----
  withinLadderMs: readonly number[]; // length exactly 7
  acrossLadderMs: readonly number[]; // length exactly 7
  ceilingRung: Readonly<Record<Tier, Rung>>; // keys exactly 1, 2, 3

  // ---- grading ----
  slowLatencyMs: number;
  responseTimeoutMs: number;
  minPlausibleLatencyMs: number;
  maxLatencyMs: number;

  // ---- cue ladder ----
  cueVanishSessions: number;
  vanishPerSession: number;
  tier1FloorSessions: number;

  // ---- session shape ----
  sessionMaxItems: number;
  sessionMaxMs: number;
  maxTrialsPerItemPerSession: number;
  sessionMaxTrials: number;
  sessionMaxFillers: number;
  newItemsFirstSession: number;
  newItemsPerSession: number;

  // ---- gentleness ----
  missTargetPpt: number;
  gentleOnMiss: number;
  gentleOnDistress: number;
  overdueReturnMultiplier: number;
  longAbsenceMs: number;

  // ---- drift ----
  driftWindowMs: number;
  driftMinSessions: number;
  driftConsecutive: number;
  driftMax: number;
  driftMinItemsPerSession: number;

  // ---- acute-change detector ----
  acuteRecentWindowMs: number;
  acuteBaseWindowMs: number;
  acuteRecentMinSessions: number;
  acuteBaseMinSessions: number;
  acuteSupportDeltaMilli: number;
  acuteSupportFloorMilli: number;
  acuteMissDeltaPpt: number;
  acuteMissFloorPpt: number;
  acuteAbsencePriorSessions: number;
  acuteAbsencePriorWindowMs: number;
  acuteAbsenceSilentMs: number;
  acuteRateLimitMs: number;

  // ---- probe ----
  probeMaxItems: number;
  probeMaxMs: number;

  // ---- bounds ----
  sessionHistoryMax: number;
  clockMaxGapMs: number;
  counterMax: number;
}

/** The §2.1 literal, verbatim. `fixtures/scheduler/config.json` deep-equals this. */
export const defaultConfig: SchedulerConfig = {
  paramsVersion: 'camp-1.0.0',
  tzOffsetMinutes: 0,
  withinStartRung: 0,
  probeItemIds: [],
  acuteSignalEnabled: true,

  withinLadderMs: [10000, 20000, 40000, 80000, 160000, 320000, 640000],
  acrossLadderMs: [5400000, 86400000, 172800000, 345600000, 604800000, 1209600000, 2592000000],
  ceilingRung: { 1: 4, 2: 6, 3: 6 },

  slowLatencyMs: 8000,
  responseTimeoutMs: 30000,
  minPlausibleLatencyMs: 300,
  maxLatencyMs: 600000,

  cueVanishSessions: 2,
  vanishPerSession: 1,
  tier1FloorSessions: 3,

  sessionMaxItems: 8,
  sessionMaxMs: 600000,
  maxTrialsPerItemPerSession: 7,
  sessionMaxTrials: 56,
  sessionMaxFillers: 16,
  newItemsFirstSession: 2,
  newItemsPerSession: 1,

  missTargetPpt: 50,
  gentleOnMiss: 1,
  gentleOnDistress: 2,
  overdueReturnMultiplier: 2,
  longAbsenceMs: 1209600000,

  driftWindowMs: 1209600000,
  driftMinSessions: 6,
  driftConsecutive: 3,
  driftMax: 2,
  driftMinItemsPerSession: 3,

  acuteRecentWindowMs: 604800000,
  acuteBaseWindowMs: 2419200000,
  acuteRecentMinSessions: 2,
  acuteBaseMinSessions: 4,
  acuteSupportDeltaMilli: 750,
  acuteSupportFloorMilli: 1500,
  acuteMissDeltaPpt: 300,
  acuteMissFloorPpt: 400,
  acuteAbsencePriorSessions: 10,
  acuteAbsencePriorWindowMs: 2592000000,
  acuteAbsenceSilentMs: 604800000,
  acuteRateLimitMs: 1209600000,

  probeMaxItems: 8,
  probeMaxMs: 120000,

  sessionHistoryMax: 90,
  clockMaxGapMs: 315360000000,
  counterMax: 255,
};
