// C16 — in-memory fakes · src/contract/testing/fakes.ts
//
// A real, in-memory implementation of every C10 port that the unit and
// component layers inject, so tests run with zero mocks and full determinism.
// No IO, no Date, no Math.random: every clock and every rng takes its seed or
// its time as a construction argument. These are test doubles, not production
// adapters — they live under src/contract/testing and are exercised by C17.
//
// spec: ADR-PLATFORM §6.1, §6.3 (zero mocks; everything injected); MODULES §6 C16.

import { PasscodeRequiredError } from '../ports';
import type {
  Db,
  Outbox,
  MediaStore,
  SecureStore,
  Net,
  Clock,
  MonoClock,
  Rng,
  Digest,
  AudioOut,
  Vad,
  Battery,
  CardRow,
  MediaRow,
  SchedJournalRow,
  SyncMeta,
  DeviceMeta,
} from '../ports';
import type { DeviceRosterRow } from '../wire/api';
import type { WireEvent } from '../wire/envelope';

// The transactional hook a memory Db plants on the `tx` it hands to a caller.
// A memory Outbox that is enqueued inside that transaction registers a rollback
// through it, so aborting the transaction unwinds the event and the state
// change together — the ADR §4.3 write-before-render atomicity, without SQL.
const TX_CTX = Symbol('memtx');
interface TxCtx {
  onRollback(fn: () => void): void;
}

// ---------------------------------------------------------------------------
// Db
// ---------------------------------------------------------------------------

export interface MemoryDbSeed {
  roster?: readonly DeviceRosterRow[];
  cards?: readonly CardRow[];
  media?: readonly MediaRow[];
  journal?: Readonly<Record<string, readonly SchedJournalRow[]>>;
  syncMeta?: SyncMeta;
  deviceMeta?: DeviceMeta;
}

interface World {
  roster: DeviceRosterRow[];
  cards: CardRow[];
  media: MediaRow[];
  journal: Record<string, SchedJournalRow[]>;
  syncMeta: SyncMeta;
  deviceMeta: DeviceMeta;
}

const EMPTY_SYNC_META: SyncMeta = {
  cursor: null,
  lastSuccessfulSyncMs: null,
  contentValidUntilMs: null,
  lastKnownSkewMs: 0,
};

const EMPTY_DEVICE_META: DeviceMeta = {
  bootOrdinal: 0,
  withinBootSeq: 0,
  allocationCounter: 0,
};

function emptyWorld(): World {
  return {
    roster: [],
    cards: [],
    media: [],
    journal: {},
    syncMeta: { ...EMPTY_SYNC_META },
    deviceMeta: { ...EMPTY_DEVICE_META },
  };
}

function cloneWorld(w: World): World {
  return JSON.parse(JSON.stringify(w)) as World;
}

function restoreWorld(target: World, source: World): void {
  target.roster = source.roster;
  target.cards = source.cards;
  target.media = source.media;
  target.journal = source.journal;
  target.syncMeta = source.syncMeta;
  target.deviceMeta = source.deviceMeta;
}

function upsertBy<T>(arr: T[], row: T, key: (x: T) => string): void {
  const k = key(row);
  const i = arr.findIndex((x) => key(x) === k);
  if (i >= 0) arr[i] = row;
  else arr.push(row);
}

export function makeMemoryDb(seed?: MemoryDbSeed): Db {
  const world: World = {
    roster: seed?.roster ? seed.roster.map((r) => ({ ...r })) : [],
    cards: seed?.cards ? seed.cards.map((c) => ({ ...c })) : [],
    media: seed?.media ? seed.media.map((m) => ({ ...m })) : [],
    journal: seed?.journal
      ? Object.fromEntries(Object.entries(seed.journal).map(([k, v]) => [k, [...v]]))
      : {},
    syncMeta: seed?.syncMeta ? { ...seed.syncMeta } : { ...EMPTY_SYNC_META },
    deviceMeta: seed?.deviceMeta ? { ...seed.deviceMeta } : { ...EMPTY_DEVICE_META },
  };

  function build(w: World): Db {
    const db: Db = {
      readRoster: async () => w.roster.map((r) => ({ ...r })),
      readCards: async (patientId) =>
        w.cards.filter((c) => c.patientId === patientId).map((c) => ({ ...c })),
      readMedia: async () => w.media.map((m) => ({ ...m })),
      applyPullPlan: async (plan) => {
        for (const r of plan.upsertRoster) upsertBy(w.roster, { ...r }, (x) => x.patient_id);
        for (const c of plan.upsertCards) upsertBy(w.cards, { ...c }, (x) => x.itemId);
        const del = new Set<string>(plan.deleteCards);
        w.cards = w.cards.filter((c) => !del.has(c.itemId));
        for (const m of plan.upsertMedia) upsertBy(w.media, { ...m }, (x) => x.sha256);
        w.syncMeta = {
          ...w.syncMeta,
          cursor: plan.cursor,
          contentValidUntilMs: plan.contentValidUntilMs,
        };
      },
      readSchedJournal: async (patientId) =>
        (w.journal[patientId] ?? []).slice().sort((a, b) => a.seq - b.seq),
      appendSchedJournal: async (patientId, rows) => {
        const bucket = w.journal[patientId] ?? (w.journal[patientId] = []);
        for (const row of rows) bucket.push(row);
      },
      readSyncMeta: async () => ({ ...w.syncMeta }),
      writeSyncMeta: async (m) => {
        w.syncMeta = { ...m };
      },
      readDeviceMeta: async () => ({ ...w.deviceMeta }),
      writeDeviceMeta: async (m) => {
        w.deviceMeta = { ...m };
      },
      transaction: async (fn) => {
        const snapshot = cloneWorld(w);
        const rollbacks: (() => void)[] = [];
        const tx = build(w);
        (tx as unknown as Record<symbol, TxCtx>)[TX_CTX] = {
          onRollback: (f) => rollbacks.push(f),
        };
        try {
          return await fn(tx);
        } catch (err) {
          restoreWorld(w, snapshot);
          for (const r of rollbacks.reverse()) r();
          throw err;
        }
      },
      wipe: async () => {
        restoreWorld(w, emptyWorld());
      },
    };
    return db;
  }

  return build(world);
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

export function makeMemoryOutbox(): Outbox {
  interface Row {
    event: WireEvent;
    nextAttemptAtMs: number | null;
  }
  const rows: Row[] = [];

  const removeByIds = (ids: readonly string[]): void => {
    const set = new Set<string>(ids);
    for (let i = rows.length - 1; i >= 0; i--) {
      if (set.has(rows[i].event.event_id)) rows.splice(i, 1);
    }
  };

  return {
    enqueue: async (tx, e) => {
      const row: Row = { event: e, nextAttemptAtMs: null };
      rows.push(row);
      const ctx = (tx as unknown as Record<symbol, TxCtx | undefined>)[TX_CTX];
      if (ctx) {
        ctx.onRollback(() => {
          const i = rows.indexOf(row);
          if (i >= 0) rows.splice(i, 1);
        });
      }
    },
    peekBatch: async (max, nowMs) => {
      const sorted = [...rows].sort((a, b) => a.event.seq - b.event.seq);
      const out: WireEvent[] = [];
      for (const r of sorted) {
        if (out.length >= max) break;
        // Strict FIFO: a not-yet-due row truncates the batch. We never skip
        // ahead of an unACKed row (ADR-DATA §6.4 client contract clause).
        if (r.nextAttemptAtMs !== null && r.nextAttemptAtMs > nowMs) break;
        out.push(r.event);
      }
      return out;
    },
    ackAccepted: async (ids) => removeByIds(ids),
    ackPermanentlyRejected: async (ids) => removeByIds(ids),
    markRetryable: async (ids, nextAttemptAtMs) => {
      const set = new Set<string>(ids);
      for (const r of rows) if (set.has(r.event.event_id)) r.nextAttemptAtMs = nextAttemptAtMs;
    },
    dropExpired: async (beforeMs) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].event.t_wall_ms < beforeMs) rows.splice(i, 1);
      }
      return before - rows.length;
    },
    depth: async () => rows.length,
    bytes: async () => rows.reduce((s, r) => s + JSON.stringify(r.event).length, 0),
  };
}

// ---------------------------------------------------------------------------
// MediaStore
// ---------------------------------------------------------------------------

// A memory download resolves against a self-describing signed URL of the form
// `memfile:<sha256>:<bytes>`. `download` verifies the URL's advertised content
// against the requested sha and expected bytes exactly as a real store verifies
// a hash, so a mismatching URL yields 'hash_mismatch' and stores nothing.
export const memMediaUrl = (sha256: string, bytes: number): string =>
  `memfile:${sha256}:${bytes}`;

function parseMemUrl(url: string): { sha: string; bytes: number } | null {
  const m = /^memfile:([^:]+):(\d+)$/.exec(url);
  if (!m) return null;
  return { sha: m[1], bytes: Number(m[2]) };
}

export function makeMemoryMediaStore(): MediaStore {
  const files = new Map<string, number>(); // sha256 -> bytes
  const order: string[] = []; // insertion order, for eviction
  const used = (): number => {
    let s = 0;
    for (const b of files.values()) s += b;
    return s;
  };

  return {
    has: async (sha256) => files.has(sha256),
    uri: (sha256) => `mem://media/${sha256}`,
    download: async (sha256, signedUrl, expectedBytes) => {
      const parsed = parseMemUrl(signedUrl);
      if (!parsed) return 'failed';
      if (parsed.sha !== sha256 || parsed.bytes !== expectedBytes) return 'hash_mismatch';
      if (!files.has(sha256)) order.push(sha256);
      files.set(sha256, parsed.bytes);
      return 'ready';
    },
    purge: async (sha256) => {
      const existed = files.delete(sha256);
      if (existed) {
        const i = order.indexOf(sha256);
        if (i >= 0) order.splice(i, 1);
      }
      return existed;
    },
    purgeAll: async () => {
      files.clear();
      order.length = 0;
    },
    bytesUsed: async () => used(),
    evictTo: async (bytes) => {
      let freed = 0;
      while (used() > bytes && order.length > 0) {
        const sha = order.shift()!;
        freed += files.get(sha) ?? 0;
        files.delete(sha);
      }
      return freed;
    },
  };
}

// ---------------------------------------------------------------------------
// SecureStore
// ---------------------------------------------------------------------------

export function makeMemorySecureStore(opts?: { hasPasscode?: boolean }): SecureStore {
  const hasPasscode = opts?.hasPasscode ?? true;
  let cred: { email: string; deviceSecret: string } | null = null;
  let dbKey: string | null = null;
  let bootOrdinal = 0;

  return {
    getDeviceCredential: async () => (cred ? { ...cred } : null),
    setDeviceCredential: async (v) => {
      if (!hasPasscode) throw new PasscodeRequiredError('device passcode required');
      cred = { ...v };
    },
    getDbKey: async () => dbKey,
    setDbKey: async (k) => {
      if (!hasPasscode) throw new PasscodeRequiredError('device passcode required');
      dbKey = k;
    },
    // Strictly increasing across cold starts, never 0. A separate object from
    // the Db, so it survives Db.wipe() exactly as the Keychain survives a
    // SQLite reinstall (V6).
    nextBootOrdinal: async () => {
      bootOrdinal += 1;
      return bootOrdinal;
    },
    clear: async () => {
      cred = null;
      dbKey = null;
      bootOrdinal = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Clock (Clock + MonoClock) — fixed and hand-advanced
// ---------------------------------------------------------------------------

export function makeFixedClock(
  nowMs: number,
  monoMs: number,
): Clock & MonoClock & { advance(ms: number): void } {
  let wall = nowMs;
  let mono = monoMs;
  return {
    nowMs: () => wall,
    localDayIndex: () => Math.floor(wall / 86_400_000),
    bootId: () => 'boot-00000000-0000-0000-0000-000000000000',
    nowMonoMs: () => mono,
    advance: (ms) => {
      wall += ms;
      mono += ms;
    },
  };
}

// ---------------------------------------------------------------------------
// Rng — seeded mulberry32; deterministic, no Math.random
// ---------------------------------------------------------------------------

export function makeSeededRng(seed: number): Rng {
  let s = seed >>> 0;
  return {
    nextInt: (boundExclusive) => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(r * boundExclusive);
    },
  };
}

// ---------------------------------------------------------------------------
// Digest — deterministic, NON-cryptographic; tests only
// ---------------------------------------------------------------------------

function fakeHashHex(bytes: Uint8Array): string {
  // Eight independent FNV-1a lanes → 8 × 8 hex = 64 hex chars, the length of a
  // real sha256. Deterministic, and emphatically not collision-resistant.
  const out: string[] = [];
  for (let lane = 0; lane < 8; lane++) {
    let h = (2166136261 ^ Math.imul(lane, 0x9e3779b1)) >>> 0;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 16777619) >>> 0;
    }
    out.push(h.toString(16).padStart(8, '0'));
  }
  return out.join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function makeFakeDigest(): Digest {
  const enc = new TextEncoder();
  let counter = 0;
  return {
    sha256Hex: async (b) => fakeHashHex(b),
    sha256File: async (uri) => fakeHashHex(enc.encode(uri)),
    hmacSha256: async (key, msg) => {
      const combined = new Uint8Array(key.length + msg.length);
      combined.set(key, 0);
      combined.set(enc.encode(msg), key.length);
      return hexToBytes(fakeHashHex(combined).slice(0, 64));
    },
    uuidv7: () => {
      counter += 1;
      const h = fakeHashHex(enc.encode(`uuidv7:${counter}`));
      const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-7${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
    },
  };
}

// ---------------------------------------------------------------------------
// Net — scripted
// ---------------------------------------------------------------------------

type SyncResult = Awaited<ReturnType<Net['sync']>>;

export interface NetScript {
  /** Result of every signIn call. Defaults to 'ok'. */
  signIn?: 'ok' | 'revoked' | 'unavailable';
  /** isOnline() value. Defaults to true. */
  online?: boolean;
  /** Consumed one per sync() call; once exhausted, sync returns 'unavailable'. */
  responses?: readonly SyncResult[];
}

export function makeScriptedNet(script?: NetScript): Net {
  const responses = script?.responses ?? [];
  let i = 0;
  return {
    signIn: async () => script?.signIn ?? 'ok',
    sync: async () => (i < responses.length ? responses[i++] : { status: 'unavailable' }),
    isOnline: () => script?.online ?? true,
  };
}

// ---------------------------------------------------------------------------
// AudioOut / Vad / Battery
// ---------------------------------------------------------------------------

export function makeFakeAudio(): AudioOut {
  return {
    // A spoken word is billed at a flat 400 ms — deterministic, no TTS engine.
    speak: async (text) => ({
      durationMs: text.trim().split(/\s+/).filter(Boolean).length * 400,
    }),
    playClip: async () => {},
    tone: async () => {},
    route: () => 'speaker',
    onRouteChange: () => () => {},
    confirmOutput: async () => -16,
    health: () => ({ audioHealthy: true, routeChanges: 0 }),
  };
}

export function makeFakeVad(
  windows: readonly { startMs: number; endMs: number; voiced: boolean }[],
): Vad {
  return {
    subscribe: () => () => {},
    windows: () => windows,
  };
}

export function makeFakeBattery(level: number): Battery {
  return {
    level: async () => level,
    lowPowerMode: async () => false,
    subscribe: () => () => {},
  };
}
