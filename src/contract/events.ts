// C03 — the scheduler event union · src/contract/events.ts
//
// The exhaustive 14-member SchedulerEvent union, its envelope, and Attempt.
// PURE: type-only imports from C01.
//
// spec: SCHEDULER-SPEC §5, §5.1 notes 1–8.

import type {
  BootId,
  CueLevel,
  DeviceId,
  DistressSource,
  ByRole,
  ItemId,
  SessionEndReason,
  SessionId,
  Tier,
  TrialClass,
} from './types';

export interface EventEnvelope {
  eventId: string; // UUIDv7, ADR §4.3
  deviceId: DeviceId;
  bootId: BootId;
  seq: number; // integer >= 0, strictly increasing per device, never reused
  anchorMs: number; // integer epoch ms, server-anchored (§1.3)
}

export interface Attempt {
  correct: boolean; // from tap or caregiver marking. NEVER from ASR (P27).
  cueLevel: CueLevel; // the cue level this attempt was PRESENTED at
  latencyMs: number; // integer, [0, MAX_LATENCY_MS], stimulus paint -> response commit
  attemptIndex: number; // integer >= 0; 0 for the first attempt of a trial
  interrupted: boolean; // telemetry §7 `interrupted`
  appBackgroundedMs: number; // integer >= 0; telemetry §7 `app_backgrounded_ms`
}

/**
 * The exhaustive 14-member scheduler event union. A blind test may assert
 * exhaustiveness by `switch (e.type)` with a `never` default.
 *
 * I-9 clause 2: DistressReported.source is DistressSource (exactly two human
 * variants). I-9 clause 3: `by` is ByRole (no 'algorithm' variant).
 */
export type SchedulerEvent = EventEnvelope &
  (
    | {
        type: 'ItemAdded';
        itemId: ItemId;
        tier: Tier;
        recognitionBlocked: boolean;
        contentReady: boolean;
      }
    | { type: 'ItemContentReadyChanged'; itemId: ItemId; contentReady: boolean }
    | { type: 'ItemTierSet'; itemId: ItemId; tier: Tier; by: ByRole }
    | {
        type: 'ItemRecognitionBlockSet';
        itemId: ItemId;
        recognitionBlocked: boolean;
        by: ByRole;
      }
    | { type: 'ItemRetired'; itemId: ItemId; by: ByRole; reason: string }
    | { type: 'ItemReEnabled'; itemId: ItemId; by: ByRole }
    | { type: 'ProbeDisabledSet'; disabled: boolean; by: ByRole }
    | { type: 'SessionStarted'; sessionId: SessionId; startedMonoMs: number }
    | {
        type: 'TrialCompleted';
        sessionId: SessionId;
        itemId: ItemId;
        openingCueLevel: CueLevel;
        floorCueLevel: CueLevel;
        trialClass: TrialClass;
        isCloser: boolean;
        attempts: readonly Attempt[]; // length >= 1, ordered by attemptIndex ascending
        terminalMonoMs: number;
        terminalAnchorMs: number;
      }
    | { type: 'GenericFillerShown'; sessionId: SessionId }
    | { type: 'ProbeBlockCompleted'; sessionId: SessionId; elapsedMs: number; truncated: boolean }
    | {
        type: 'DistressReported';
        sessionId: SessionId;
        itemId: ItemId | null;
        severity: 'mild' | 'moderate' | 'severe';
        source: DistressSource;
      }
    | {
        type: 'SessionEnded';
        sessionId: SessionId;
        reason: SessionEndReason;
        closerPresented: boolean;
        endedMonoMs: number;
      }
    | { type: 'AcuteSignalDelivered' }
  );
