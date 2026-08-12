// C06 — the four frozen runtime literals · src/contract/schema.ts
//
// Four plain-data frozen exports giving the type-level safety claims of §5.1 a
// runtime artefact to be asserted against. Without them invariant I-9 is
// unwritable. Transcribed VERBATIM from SCHEDULER-SPEC §21.2.
//
// Three decisions (§21.2): payload keys only; `type` is NOT a key of any entry
// (so AcuteSignalDelivered maps to []); arrays are order-sensitive — transcribe,
// do not sort.
//
// deps: C03 (SchedulerEvent, type-only).

import type { SchedulerEvent } from './events';

/** The five envelope keys of §5, shared by every event. NOT included in EVENT_SCHEMA entries. */
export const ENVELOPE_KEYS: readonly string[] = ['eventId', 'deviceId', 'bootId', 'seq', 'anchorMs'];

/** The keys of `Attempt` (§4), in declaration order. */
export const ATTEMPT_KEYS: readonly string[] = [
  'correct',
  'cueLevel',
  'latencyMs',
  'attemptIndex',
  'interrupted',
  'appBackgroundedMs',
];

/** PAYLOAD keys per event type, in §5 declaration order.
 *  Excludes `type`. Excludes ENVELOPE_KEYS. Exactly 14 entries. */
export const EVENT_SCHEMA: Record<SchedulerEvent['type'], readonly string[]> = {
  ItemAdded: ['itemId', 'tier', 'recognitionBlocked', 'contentReady'],
  ItemContentReadyChanged: ['itemId', 'contentReady'],
  ItemTierSet: ['itemId', 'tier', 'by'],
  ItemRecognitionBlockSet: ['itemId', 'recognitionBlocked', 'by'],
  ItemRetired: ['itemId', 'by', 'reason'],
  ItemReEnabled: ['itemId', 'by'],
  ProbeDisabledSet: ['disabled', 'by'],
  SessionStarted: ['sessionId', 'startedMonoMs'],
  TrialCompleted: [
    'sessionId',
    'itemId',
    'openingCueLevel',
    'floorCueLevel',
    'trialClass',
    'isCloser',
    'attempts',
    'terminalMonoMs',
    'terminalAnchorMs',
  ],
  GenericFillerShown: ['sessionId'],
  ProbeBlockCompleted: ['sessionId', 'elapsedMs', 'truncated'],
  DistressReported: ['sessionId', 'itemId', 'severity', 'source'],
  SessionEnded: ['sessionId', 'reason', 'closerPresented', 'endedMonoMs'],
  AcuteSignalDelivered: [],
};

/** VALUE DOMAINS for every string-union payload field in §5, keyed '<EventType>.<field>'.
 *  Exactly these 9 keys; no others. Members in §5 declaration order. */
export const EVENT_VARIANTS: Readonly<Record<string, readonly string[]>> = {
  'ItemTierSet.by': ['caregiver', 'clinician'],
  'ItemRecognitionBlockSet.by': ['caregiver', 'clinician'],
  'ItemRetired.by': ['caregiver', 'clinician'],
  'ItemReEnabled.by': ['caregiver', 'clinician'],
  'ProbeDisabledSet.by': ['caregiver', 'clinician'],
  'TrialCompleted.trialClass': ['FLOOR', 'SUPPORTED', 'VANISH'],
  'DistressReported.severity': ['mild', 'moderate', 'severe'],
  'DistressReported.source': ['patient_control', 'caregiver_report'],
  'SessionEnded.reason': [
    'budget_time',
    'budget_trials',
    'roster_exhausted',
    'user_ended',
    'distress_stop',
    'abandoned',
    'app_crash',
  ],
};
