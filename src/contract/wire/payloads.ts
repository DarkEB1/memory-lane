// C08 — the 20 payload schemas · src/contract/wire/payloads.ts
//
// A zod payload schema per registered wire type, the frozen stimulus descriptor,
// and the one mapping from a validated wire payload to a C03 SchedulerEvent.
//
// spec: ADR-DATA §6.6 (the 20-type table; which 14 are is_scheduler), §9 (the
//       stimulus descriptor literal), §8.6; SCHEDULER-SPEC §5 (authoritative for
//       the 14 scheduler payloads); MODULES C-2.

import { z } from 'zod';
import type {
  Attempt,
  EventEnvelope,
  SchedulerEvent,
} from '../events';
import type {
  CueLevel,
  EraBand,
  PersonStatus,
  PresentationMode,
  RelationshipGroup,
  Tier,
  TrialClass,
} from '../types';
import type { WireEvent } from './envelope';

// ---- shared scalar schemas ----
const zTier: z.ZodType<Tier> = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const zCueLevel: z.ZodType<CueLevel> = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const zBy = z.enum(['caregiver', 'clinician']); // ByRole — no 'algorithm' (I-9 clause 3)

// Shared vocabulary enums, re-exported for C09's device rows (which depend on C08).
export const zPersonStatus = z.enum(['living', 'deceased', 'estranged', 'do_not_show']);
export const zRelationshipGroup = z.enum([
  'partner',
  'child_or_grandchild',
  'sibling_or_parent',
  'friend_or_other',
  'self_or_pet',
]);
export const zEraBand = z.enum(['pre_1950', '1950s_60s', 'post_1970']);
export const zPresentationMode = z.enum([
  'free_recall',
  'cued_recall',
  'recognition',
  'familiarity_exposure',
]);
export const zContentProvenance = z.enum(['family_upload', 'generic_library', 'physical_scan']);

// On the wire, trial_class is a shape-legal lowercase token; C03 carries the
// uppercase TrialClass. toSchedulerEvent lifts it.
const zWireTrialClass = z.enum(['floor', 'supported', 'vanish']);
const WIRE_TO_TRIAL_CLASS: Readonly<Record<z.infer<typeof zWireTrialClass>, TrialClass>> = {
  floor: 'FLOOR',
  supported: 'SUPPORTED',
  vanish: 'VANISH',
};

/** The Attempt as carried on the wire (§9). Exactly the six C03 keys (I-9 clause 1). */
const zWireAttempt = z.object({
  correct: z.boolean(),
  cue_level: zCueLevel,
  latency_ms: z.number().int(),
  attempt_index: z.number().int(),
  interrupted: z.boolean(),
  app_backgrounded_ms: z.number().int(),
});

// ---- the frozen stimulus descriptor (ADR-DATA §9), written at stimulus paint ----
export const zStimulusDescriptor: z.ZodType<{
  content_class: string;
  relationship_group: RelationshipGroup;
  era_band: EraBand;
  person_status: PersonStatus;
  recognition_blocked: boolean;
  content_provenance: 'family_upload' | 'generic_library' | 'physical_scan';
  media_kind: string;
  n_media_assets: number;
  cue_modality: string;
  content_language: string;
  item_tier: Tier;
  is_month_target: boolean;
  content_is_generic: boolean;
  valence_band: string;
  importance_band: string;
  content_set_version: string;
  presentation_mode: PresentationMode;
  n_distractors: number;
}> = z.object({
  content_class: z.string(),
  relationship_group: zRelationshipGroup,
  era_band: zEraBand,
  person_status: zPersonStatus,
  recognition_blocked: z.boolean(),
  content_provenance: zContentProvenance,
  media_kind: z.string(),
  n_media_assets: z.number().int(),
  cue_modality: z.string(),
  content_language: z.string(),
  item_tier: zTier,
  is_month_target: z.boolean(),
  content_is_generic: z.boolean(),
  valence_band: z.string(),
  importance_band: z.string(),
  content_set_version: z.string(),
  presentation_mode: zPresentationMode,
  n_distractors: z.number().int(),
});

// ---- the 20 registered wire types (ADR-DATA §6.6) ----
export type WireType =
  // 14 is_scheduler — map 1:1 onto SCHEDULER-SPEC §5
  | 'item.added'
  | 'item.content_ready_changed'
  | 'item.tier_set'
  | 'item.recognition_block_set'
  | 'item.retired'
  | 'item.re_enabled'
  | 'probe.disabled_set'
  | 'session.started'
  | 'trial.completed'
  | 'filler.shown'
  | 'probe.block_completed'
  | 'distress.reported'
  | 'session.ended'
  | 'acute.signal_delivered'
  // 6 non-scheduler — telemetry only, no SchedulerEvent
  | 'probe.trial_completed'
  | 'session.co_present_declared'
  | 'device.booted'
  | 'device.sync_completed'
  | 'device.content_expired'
  | 'media.purged';

// ---- the 20 payload schemas ----
// The 14 scheduler payloads carry the §5 field set in snake_case wire form.
const zItemAdded = z.object({
  item_id: z.string(),
  tier: zTier,
  recognition_blocked: z.boolean(),
  content_ready: z.boolean(),
});
const zItemContentReadyChanged = z.object({
  item_id: z.string(),
  content_ready: z.boolean(),
});
const zItemTierSet = z.object({ item_id: z.string(), tier: zTier, by: zBy });
const zItemRecognitionBlockSet = z.object({
  item_id: z.string(),
  recognition_blocked: z.boolean(),
  by: zBy,
});
const zItemRetired = z.object({ item_id: z.string(), by: zBy, reason: z.string() });
const zItemReEnabled = z.object({ item_id: z.string(), by: zBy });
const zProbeDisabledSet = z.object({ disabled: z.boolean(), by: zBy });
const zSessionStarted = z.object({
  session_id: z.string(),
  started_mono_ms: z.number().int(),
});
const zTrialCompleted = z.object({
  session_id: z.string(),
  item_id: z.string(),
  opening_cue_level: zCueLevel,
  floor_cue_level: zCueLevel,
  trial_class: zWireTrialClass,
  is_closer: z.boolean(),
  attempts: z.array(zWireAttempt).max(64),
  terminal_mono_ms: z.number().int(),
  terminal_anchor_ms: z.number().int(),
  stimulus: zStimulusDescriptor,
});
const zGenericFillerShown = z.object({ session_id: z.string() });
const zProbeBlockCompleted = z.object({
  session_id: z.string(),
  elapsed_ms: z.number().int(),
  truncated: z.boolean(),
});
const zDistressReported = z.object({
  session_id: z.string(),
  item_id: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  source: z.enum(['patient_control', 'caregiver_report']), // DistressSource — both human (P18)
});
const zSessionEnded = z.object({
  session_id: z.string(),
  reason: z.enum([
    'budget_time',
    'budget_trials',
    'roster_exhausted',
    'user_ended',
    'distress_stop',
    'abandoned',
    'app_crash',
  ]),
  closer_presented: z.boolean(),
  ended_mono_ms: z.number().int(),
});
const zAcuteSignalDelivered = z.object({}); // empty payload (§5)

// The 6 non-scheduler payloads — telemetry only.
const zProbeTrialCompleted = z.object({
  session_id: z.string(),
  item_id: z.string(),
  opening_cue_level: z.literal(2), // C-2
  floor_cue_level: zCueLevel,
  correct: z.boolean(),
  latency_ms: z.number().int(),
  n_distractors: z.literal(1), // C-2
});
const zSessionCoPresentDeclared = z.object({
  session_id: z.string(),
  caregiver_present_source: z.literal('declared'), // the only producer; never 'inferred' (§8.6)
});
const zDeviceBooted = z.object({
  boot_id: z.string(),
  boot_ordinal: z.number().int().min(1),
  client_version: z.string(),
});
const zDeviceSyncCompleted = z.object({
  pushed_count: z.number().int(),
  backlog_est: z.number().int(),
});
const zDeviceContentExpired = z.object({
  content_valid_until_ms: z.number().int(),
});
const zMediaPurged = z.object({
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  revocation_id: z.string(),
  local_file_existed: z.boolean(),
});

export const WIRE_PAYLOADS: Readonly<Record<WireType, z.ZodTypeAny>> = {
  'item.added': zItemAdded,
  'item.content_ready_changed': zItemContentReadyChanged,
  'item.tier_set': zItemTierSet,
  'item.recognition_block_set': zItemRecognitionBlockSet,
  'item.retired': zItemRetired,
  'item.re_enabled': zItemReEnabled,
  'probe.disabled_set': zProbeDisabledSet,
  'session.started': zSessionStarted,
  'trial.completed': zTrialCompleted,
  'filler.shown': zGenericFillerShown,
  'probe.block_completed': zProbeBlockCompleted,
  'distress.reported': zDistressReported,
  'session.ended': zSessionEnded,
  'acute.signal_delivered': zAcuteSignalDelivered,
  'probe.trial_completed': zProbeTrialCompleted,
  'session.co_present_declared': zSessionCoPresentDeclared,
  'device.booted': zDeviceBooted,
  'device.sync_completed': zDeviceSyncCompleted,
  'device.content_expired': zDeviceContentExpired,
  'media.purged': zMediaPurged,
};

/** The 14 wire types the scheduler folds, in §6.6 table order. */
export const SCHEDULER_WIRE_TYPES: readonly WireType[] = [
  'item.added',
  'item.content_ready_changed',
  'item.tier_set',
  'item.recognition_block_set',
  'item.retired',
  'item.re_enabled',
  'probe.disabled_set',
  'session.started',
  'trial.completed',
  'filler.shown',
  'probe.block_completed',
  'distress.reported',
  'session.ended',
  'acute.signal_delivered',
];

function toAttempt(a: z.infer<typeof zWireAttempt>): Attempt {
  return {
    correct: a.correct,
    cueLevel: a.cue_level,
    latencyMs: a.latency_ms,
    attemptIndex: a.attempt_index,
    interrupted: a.interrupted,
    appBackgroundedMs: a.app_backgrounded_ms,
  };
}

/**
 * Map a wire event to its C03 SchedulerEvent, anchoring at `anchorMs`. Returns
 * null for the six non-scheduler types and for any payload that fails its
 * schema. Extra wire fields (the stimulus descriptor, the allocation) are
 * telemetry and are dropped — the scheduler folds only the §5 field set.
 */
export function toSchedulerEvent(w: WireEvent, anchorMs: number): SchedulerEvent | null {
  const schema = WIRE_PAYLOADS[w.type as WireType];
  if (!schema) return null;
  if (!(SCHEDULER_WIRE_TYPES as readonly string[]).includes(w.type)) return null;

  const env: EventEnvelope = {
    eventId: w.event_id,
    deviceId: w.device_id,
    bootId: w.boot_id,
    seq: w.seq,
    anchorMs,
  };

  switch (w.type) {
    case 'item.added': {
      const p = zItemAdded.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'ItemAdded',
        itemId: p.data.item_id,
        tier: p.data.tier,
        recognitionBlocked: p.data.recognition_blocked,
        contentReady: p.data.content_ready,
      };
    }
    case 'item.content_ready_changed': {
      const p = zItemContentReadyChanged.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'ItemContentReadyChanged',
        itemId: p.data.item_id,
        contentReady: p.data.content_ready,
      };
    }
    case 'item.tier_set': {
      const p = zItemTierSet.safeParse(w.payload);
      if (!p.success) return null;
      return { ...env, type: 'ItemTierSet', itemId: p.data.item_id, tier: p.data.tier, by: p.data.by };
    }
    case 'item.recognition_block_set': {
      const p = zItemRecognitionBlockSet.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'ItemRecognitionBlockSet',
        itemId: p.data.item_id,
        recognitionBlocked: p.data.recognition_blocked,
        by: p.data.by,
      };
    }
    case 'item.retired': {
      const p = zItemRetired.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'ItemRetired',
        itemId: p.data.item_id,
        by: p.data.by,
        reason: p.data.reason,
      };
    }
    case 'item.re_enabled': {
      const p = zItemReEnabled.safeParse(w.payload);
      if (!p.success) return null;
      return { ...env, type: 'ItemReEnabled', itemId: p.data.item_id, by: p.data.by };
    }
    case 'probe.disabled_set': {
      const p = zProbeDisabledSet.safeParse(w.payload);
      if (!p.success) return null;
      return { ...env, type: 'ProbeDisabledSet', disabled: p.data.disabled, by: p.data.by };
    }
    case 'session.started': {
      const p = zSessionStarted.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'SessionStarted',
        sessionId: p.data.session_id,
        startedMonoMs: p.data.started_mono_ms,
      };
    }
    case 'trial.completed': {
      const p = zTrialCompleted.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'TrialCompleted',
        sessionId: p.data.session_id,
        itemId: p.data.item_id,
        openingCueLevel: p.data.opening_cue_level,
        floorCueLevel: p.data.floor_cue_level,
        trialClass: WIRE_TO_TRIAL_CLASS[p.data.trial_class],
        isCloser: p.data.is_closer,
        attempts: p.data.attempts.map(toAttempt),
        terminalMonoMs: p.data.terminal_mono_ms,
        terminalAnchorMs: p.data.terminal_anchor_ms,
      };
    }
    case 'filler.shown': {
      const p = zGenericFillerShown.safeParse(w.payload);
      if (!p.success) return null;
      return { ...env, type: 'GenericFillerShown', sessionId: p.data.session_id };
    }
    case 'probe.block_completed': {
      const p = zProbeBlockCompleted.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'ProbeBlockCompleted',
        sessionId: p.data.session_id,
        elapsedMs: p.data.elapsed_ms,
        truncated: p.data.truncated,
      };
    }
    case 'distress.reported': {
      const p = zDistressReported.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'DistressReported',
        sessionId: p.data.session_id,
        itemId: p.data.item_id,
        severity: p.data.severity,
        source: p.data.source,
      };
    }
    case 'session.ended': {
      const p = zSessionEnded.safeParse(w.payload);
      if (!p.success) return null;
      return {
        ...env,
        type: 'SessionEnded',
        sessionId: p.data.session_id,
        reason: p.data.reason,
        closerPresented: p.data.closer_presented,
        endedMonoMs: p.data.ended_mono_ms,
      };
    }
    case 'acute.signal_delivered': {
      const p = zAcuteSignalDelivered.safeParse(w.payload);
      if (!p.success) return null;
      return { ...env, type: 'AcuteSignalDelivered' };
    }
    default:
      return null;
  }
}

/** JSON Schema for a wire payload, emitted into log.event_type.payload_schema. */
export function toJsonSchema(t: WireType): object {
  return z.toJSONSchema(WIRE_PAYLOADS[t]);
}
