// C09 — the HTTP surface.
//
// Every request/response shape that crosses the network, plus the two device
// row shapes the pull returns. Source: ADR-PLATFORM §4.4/§4.5/§5.2, ADR-DATA
// §6.8 (the ACK contract), §12.2 (device_content / device_roster, widened by D-4).
import { z } from 'zod';
import { zBatchHeader, zEventEnvelope } from './envelope';
import type { BatchHeader, WireEvent } from './envelope';

export const MAX_EVENTS_PER_PUSH = 500 as const;

// D-4: device_roster is widened with the per-participant runtime configuration.
// It deliberately carries NO birth_year, surname, date of birth, room number or
// diagnosis — a stolen tablet learns that N people live somewhere, not who.
export const zDeviceRosterRow = z.object({
  patient_id: z.string(),
  display_first_name: z.string(),
  avatar_sha256: z.string().nullable(),
  ui_version_pinned: z.string(),
  content_valid_until_ms: z.number(),
  hard_expiry_days: z.number().int(),
  music_decade: z.number().int(),
  bump_decade: z.number().int(),
  content_language: z.string(),
  content_set_version: z.string(),
  probe_ordinals: z.array(z.number().int()),
  probe_disabled: z.boolean(),
  acute_signal_enabled: z.boolean(),
  within_start_rung: z.number().int(),
  params_version: z.string(),
  tz_offset_minutes: z.number().int(),
  session_order_variant: z.enum(['standard', 'front_loaded']),
  rung_dwell_step: z.enum(['short', 'standard', 'long']),
  patient_type_step: z.enum(['sm', 'md', 'lg']),
  audio_output: z.enum(['speaker', 'headphones', 'captions_only']),
  fluctuation_band: z.enum(['standard', 'high']),
  era_blocklist: z.array(z.string()),
  theme_blocklist: z.array(z.string()),
});
export type DeviceRosterRow = z.infer<typeof zDeviceRosterRow>;

export const zDeviceContentRow = z.object({
  op: z.enum(['upsert', 'purge']),
  patient_id: z.string(),
  item_id: z.string().nullable(),
  person_display_name: z.string().nullable(),
  one_sentence: z.string().nullable(),
  tier: z.number().int().nullable(),
  content_class: z.string().nullable(),
  era_decade: z.number().int().nullable(),
  content_language: z.string().nullable(),
  is_month_target: z.boolean().nullable(),
  recognition_allowed: z.boolean().nullable(),
  person_status: z.enum(['living', 'deceased', 'estranged', 'do_not_show']).nullable(),
  person_status_validated_at_ms: z.number().nullable(),
  relationship_group: z
    .enum(['partner', 'child_or_grandchild', 'sibling_or_parent', 'friend_or_other', 'self_or_pet'])
    .nullable(),
  era_band: z.enum(['pre_1950', '1950s_60s', 'post_1970']).nullable(),
  valence_band: z.string().nullable(),
  importance_band: z.string().nullable(),
  content_provenance: z.string().nullable(),
  content_is_generic: z.boolean().nullable(),
  media_sha256: z.string().nullable(),
  media_mime: z.string().nullable(),
  media_bytes: z.number().nullable(),
  media_role: z.string().nullable(),
  ord: z.number().int().nullable(),
  revocation_id: z.string().nullable(),
  updated_at_ms: z.number(),
});
export type DeviceContentRow = z.infer<typeof zDeviceContentRow>;

const zMediaManifestEntry = z.object({
  sha256: z.string(),
  mime: z.string(),
  bytes: z.number().int(),
  signed_url: z.string(),
});

const zBootAnchor = z.object({
  boot_id: z.string(),
  base_ms: z.number(),
  mono_origin_ms: z.number(),
});

export const zSyncPushRequest = z.object({
  header: zBatchHeader,
  events: z.array(zEventEnvelope).max(MAX_EVENTS_PER_PUSH),
  sessions: z.array(z.unknown()),
  last_cursor: z.string().nullable(),
});
export type SyncPushRequest = z.infer<typeof zSyncPushRequest>;

// §6.8: `accepted` is mandatory. A response omitting it is not an ACK, so an
// HTTP 201 with no body must fail to parse.
export const zSyncPullResponse = z.object({
  accepted: z.array(z.string()),
  quarantined: z.array(
    z.object({ event_id: z.string(), reason: z.string(), retryable: z.boolean() }),
  ),
  boot_anchors: z.array(zBootAnchor),
  roster_delta: z.array(zDeviceRosterRow),
  cards_delta: z.array(zDeviceContentRow),
  media_manifest_delta: z.array(zMediaManifestEntry),
  server_time_ms: z.number(),
  content_valid_until_ms: z.number(),
  new_cursor: z.string(),
});
export type SyncPullResponse = z.infer<typeof zSyncPullResponse>;

// Enrolment. The redeem response returns the device_secret exactly once; the
// enrol response (shown to a caregiver) never carries it.
export const zEnrolDeviceRequest = z.object({
  care_home_id: z.string(),
  patient_ids: z.array(z.string()),
  mode: z.enum(['personal', 'shared']),
  label: z.string(),
});
export const zEnrolDeviceResponse = z.object({
  device_id: z.string(),
  code: z.string().regex(/^[0-9A-HJ-NP-TV-Z]{8}$/),
  expires_at_ms: z.number(),
});
export const zRedeemEnrolmentRequest = z.object({ code: z.string() });
export const zRedeemEnrolmentResponse = z.object({
  device_id: z.string(),
  email: z.string(),
  device_secret: z.string(),
});

export const zExportRequest = z.object({ patient_id: z.string() });
export const zExportResponse = z.object({ export_id: z.string(), signed_url: z.string() });
export const zDeleteRequest = z.object({ patient_id: z.string(), confirm_phrase: z.string() });
export const zDeleteResponse = z.object({ deleted: z.boolean(), revocation_id: z.string() });

export type EnrolDeviceRequest = z.infer<typeof zEnrolDeviceRequest>;
export type EnrolDeviceResponse = z.infer<typeof zEnrolDeviceResponse>;
export type RedeemEnrolmentResponse = z.infer<typeof zRedeemEnrolmentResponse>;

// Re-exported so consumers of the HTTP surface can name the header/event too.
export type { BatchHeader, WireEvent };
