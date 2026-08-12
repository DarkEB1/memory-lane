// C10 — the ports.
//
// Every boundary the pure code is allowed to touch, as interfaces with zero
// implementation. src/domain depends on these; adapters implement them; the
// testing fakes (C16) provide in-memory versions the conformance suite (C17)
// proves equivalent. Nothing here has a function body.
//
// Source: ADR-PLATFORM §6.1/§4.2/§4.3/§4.4/§5.2; SCHEDULER-SPEC §4 (Clock and
// Rng are declared for conformance and NEVER called by the scheduler); D-2, D-3.
import type { ItemId, PatientId, Tier, PersonStatus, RelationshipGroup, EraBand, BootId } from './types';
import type { SchedulerEvent } from './events';
import type { WireEvent } from './wire/envelope';
import type { DeviceRosterRow, SyncPushRequest, SyncPullResponse } from './wire/api';

export interface CardRow {
  itemId: ItemId;
  patientId: PatientId;
  tier: Tier;
  recognitionAllowed: boolean;
  personStatus: PersonStatus;
  personStatusValidatedAtMs: number;
  displayName: string;
  oneSentence: string;
  eraDecade: number;
  relationshipGroup: RelationshipGroup;
  eraBand: EraBand;
  valenceBand: string;
  importanceBand: string;
  contentProvenance: string;
  contentIsGeneric: boolean;
  isMonthTarget: boolean;
  contentLanguage: string;
  contentReady: boolean;
}

export interface MediaRow {
  sha256: string;
  itemId: ItemId;
  role: string;
  mime: string;
  bytes: number;
  state: 'pending' | 'ready';
}

/** D-2: the device's local scheduler journal — reconstructed server-written events. */
export interface SchedJournalRow {
  seq: number;
  anchorMs: number;
  event: SchedulerEvent;
}

/** The resolved plan a sync pull applies to local storage in one transaction. */
export interface PullPlan {
  upsertRoster: readonly DeviceRosterRow[];
  upsertCards: readonly CardRow[];
  deleteCards: readonly ItemId[];
  upsertMedia: readonly MediaRow[];
  cursor: string | null;
  contentValidUntilMs: number;
}

export interface SyncMeta {
  cursor: string | null;
  lastSuccessfulSyncMs: number | null;
  contentValidUntilMs: number | null;
  lastKnownSkewMs: number;
}

export interface DeviceMeta {
  bootOrdinal: number;
  withinBootSeq: number;
  allocationCounter: number;
}

export interface Db {
  readRoster(): Promise<DeviceRosterRow[]>;
  readCards(patientId: PatientId): Promise<CardRow[]>;
  readMedia(): Promise<MediaRow[]>;
  applyPullPlan(plan: PullPlan): Promise<void>;
  readSchedJournal(patientId: PatientId): Promise<SchedJournalRow[]>;
  appendSchedJournal(patientId: PatientId, rows: readonly SchedJournalRow[]): Promise<void>;
  readSyncMeta(): Promise<SyncMeta>;
  writeSyncMeta(m: SyncMeta): Promise<void>;
  readDeviceMeta(): Promise<DeviceMeta>;
  writeDeviceMeta(m: DeviceMeta): Promise<void>;
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  wipe(): Promise<void>;
}

export interface Outbox {
  /** MUST be callable inside a Db transaction: write-before-render, ADR §4.3 property 1. */
  enqueue(tx: Db, e: WireEvent): Promise<void>;
  peekBatch(max: number, nowMs: number): Promise<WireEvent[]>;
  ackAccepted(ids: readonly string[]): Promise<void>;
  ackPermanentlyRejected(ids: readonly string[]): Promise<void>;
  markRetryable(ids: readonly string[], nextAttemptAtMs: number): Promise<void>;
  dropExpired(beforeMs: number): Promise<number>;
  depth(): Promise<number>;
  bytes(): Promise<number>;
}

export interface MediaStore {
  has(sha256: string): Promise<boolean>;
  uri(sha256: string): string;
  download(sha256: string, signedUrl: string, expectedBytes: number): Promise<'ready' | 'hash_mismatch' | 'failed'>;
  purge(sha256: string): Promise<boolean>; // returns whether a local file existed
  purgeAll(): Promise<void>;
  bytesUsed(): Promise<number>;
  evictTo(bytes: number): Promise<number>;
}

export interface SecureStore {
  getDeviceCredential(): Promise<{ email: string; deviceSecret: string } | null>;
  setDeviceCredential(v: { email: string; deviceSecret: string }): Promise<void>;
  getDbKey(): Promise<string | null>;
  setDbKey(k: string): Promise<void>;
  nextBootOrdinal(): Promise<number>;
  clear(): Promise<void>;
}

export class PasscodeRequiredError extends Error {
  constructor(message = 'This tablet must have a passcode before it can be enrolled.') {
    super(message);
    this.name = 'PasscodeRequiredError';
  }
}

export interface Net {
  signIn(email: string, secret: string): Promise<'ok' | 'revoked' | 'unavailable'>;
  sync(
    req: SyncPushRequest,
  ): Promise<{ status: 'ok'; body: SyncPullResponse } | { status: 'unavailable' } | { status: 'revoked' }>;
  isOnline(): boolean;
}

/** Declared for ADR contract conformance. NEVER CALLED by src/domain/scheduler. */
export interface Clock {
  nowMs(): number;
  localDayIndex(): number;
}

export interface MonoClock {
  bootId(): BootId;
  nowMonoMs(): number;
}

export interface Rng {
  nextInt(boundExclusive: number): number;
}

export interface Digest {
  sha256Hex(b: Uint8Array): Promise<string>;
  sha256File(uri: string): Promise<string>;
  hmacSha256(key: Uint8Array, msg: string): Promise<Uint8Array>;
  uuidv7(): string;
}

export interface AudioOut {
  speak(text: string): Promise<{ durationMs: number }>;
  playClip(uri: string, maxMs: number): Promise<void>;
  tone(): Promise<void>;
  route(): 'speaker' | 'headphones' | 'none';
  onRouteChange(cb: (r: 'speaker' | 'headphones' | 'none') => void): () => void;
  confirmOutput(): Promise<number | null>;
  health(): { audioHealthy: boolean; routeChanges: number };
}

export interface Vad {
  subscribe(cb: (active: boolean) => void): () => void;
  windows(): readonly { startMs: number; endMs: number; voiced: boolean }[];
}

/** CAREGIVER SURFACE ONLY. Absent from the patient runtime (D-3). */
export interface Recorder {
  start(): Promise<void>;
  stop(): Promise<{ uri: string; mime: string; durationMs: number } | null>;
}

export interface Battery {
  level(): Promise<number>;
  lowPowerMode(): Promise<boolean>;
  subscribe(cb: (level: number) => void): () => void;
}

export interface Notifications {
  scheduleChime(atMs: number | null, body: string): Promise<void>;
  cancelAll(): Promise<void>;
}
