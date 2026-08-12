// C07 — the wire envelope.
//
// The zod schema for the on-the-wire event envelope and batch header, the
// composite-seq bounds, and the four permitted payload string shapes. Imported
// by the device, /sync, the registry seed and the 5,000-name fuzz test.
//
// Source: ADR-DATA §6.1 (envelope + batch header, and why seq is composite),
// §6.5 layer 1 (the four permitted string shapes + the depth-4 / array-64 bounds).
import { z } from 'zod';

/** seq = boot_ordinal * SEQ_BOOT_MULTIPLIER + within_boot_seq. §6.1. */
export const SEQ_BOOT_MULTIPLIER = 100_000_000 as const;
export const WITHIN_BOOT_SEQ_MAX = 99_999_999 as const;

export const zEventEnvelope = z.object({
  event_id: z.string(),
  device_id: z.string(),
  patient_id: z.string(),
  session_id: z.string().nullable(),
  boot_id: z.string(),
  boot_ordinal: z.number().int().nonnegative(),
  seq: z.number().int().nonnegative(),
  type: z.string(),
  payload_version: z.number().int(),
  payload: z.record(z.string(), z.unknown()),
  t_mono_ms: z.number(),
  t_wall_ms: z.number(),
  client_version: z.string(),
});
export type WireEvent = z.infer<typeof zEventEnvelope>;

export const zBatchHeader = z.object({
  batch_id: z.string(),
  boot_wall_ms: z.number(),
  boot_mono_ms: z.number(),
  client_sent_wall_ms: z.number(),
});
export type BatchHeader = z.infer<typeof zBatchHeader>;

/**
 * The FOUR permitted payload string shapes (§6.5 layer 1). Any string in a
 * payload must match exactly one of these. This is the privacy firewall's first
 * layer: a free-text name like "Margaret" fails `snake` on the leading capital,
 * and "Margaret Thatcher" fails on the space. A lowercased "margaret" passes the
 * SHAPE and must be caught downstream by C08's closed-vocabulary layer.
 */
export const PAYLOAD_STRING_RE = {
  snake: /^[a-z][a-z0-9_]*$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  hex64: /^[0-9a-f]{64}$/,
  dotted: /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/,
} as const;

export const EVENT_TYPE_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

const PAYLOAD_MAX_DEPTH = 4;
const PAYLOAD_MAX_ARRAY = 64;

function stringShapeOk(s: string): boolean {
  return (
    PAYLOAD_STRING_RE.snake.test(s) ||
    PAYLOAD_STRING_RE.uuid.test(s) ||
    PAYLOAD_STRING_RE.hex64.test(s) ||
    PAYLOAD_STRING_RE.dotted.test(s)
  );
}

/**
 * Structural firewall: every string matches one permitted shape, no array
 * exceeds 64 elements, and nesting never exceeds depth 4. Depth 0 is a scalar
 * payload; a value nested five containers deep is rejected.
 */
export function payloadShapeOk(p: unknown, depth = 0): boolean {
  if (depth > PAYLOAD_MAX_DEPTH) return false;
  if (p === null) return true;
  const t = typeof p;
  if (t === 'number' || t === 'boolean') return true;
  if (t === 'string') return stringShapeOk(p as string);
  if (Array.isArray(p)) {
    if (p.length > PAYLOAD_MAX_ARRAY) return false;
    return p.every((x) => payloadShapeOk(x, depth + 1));
  }
  if (t === 'object') {
    return Object.values(p as Record<string, unknown>).every((x) =>
      payloadShapeOk(x, depth + 1),
    );
  }
  return false;
}
