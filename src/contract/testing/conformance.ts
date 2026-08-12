// C17 — port conformance suites · src/contract/testing/conformance.ts
//
// Exported behavioural suites that ANY implementation of a C10 port must pass.
// This is what makes two Db implementations interchangeable and the in-memory
// fake trustworthy everywhere else: each suite takes a factory and registers
// jest tests describing the behaviour the port owes, independent of how it is
// built. A test file calls `describeDbPort(() => makeMemoryDb())` for the fake
// and `describeDbPort(() => makeSqliteDb())` for the native adapter, and both
// run the identical assertions.
//
// spec: ADR-PLATFORM §6.1, §6.3 (two implementations, not three);
//       ADR-DATA §6.4 (FIFO drain), §6.8 (the ACK contract); MODULES §6 C17.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PasscodeRequiredError } from '../ports';
import type { Db, Outbox, MediaStore, SecureStore, Net, AudioOut , SyncMeta } from '../ports';
import type { WireEvent } from '../wire/envelope';

const BASE_META: SyncMeta = {
  cursor: null,
  lastSuccessfulSyncMs: null,
  contentValidUntilMs: null,
  lastKnownSkewMs: 0,
};

function wireEvent(seq: number, overrides: Partial<WireEvent> = {}): WireEvent {
  return {
    event_id: `evt-${seq}`,
    device_id: 'dev-a',
    patient_id: 'pat-a',
    session_id: null,
    boot_id: 'boot-a',
    boot_ordinal: 1,
    seq,
    type: 'scheduler.session_started',
    payload_version: 1,
    payload: {},
    t_mono_ms: seq,
    t_wall_ms: 1_000 + seq,
    client_version: '1.0.0',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Db
// ---------------------------------------------------------------------------

export function describeDbPort(make: () => Db): void {
  describe('Db port conformance', () => {
    let db: Db;
    beforeEach(() => {
      db = make();
    });

    it('round-trips sync meta', async () => {
      const m: SyncMeta = { ...BASE_META, cursor: 'c1', lastKnownSkewMs: 42 };
      await db.writeSyncMeta(m);
      expect(await db.readSyncMeta()).toEqual(m);
    });

    it('round-trips device meta', async () => {
      const m = { bootOrdinal: 3, withinBootSeq: 7, allocationCounter: 2 };
      await db.writeDeviceMeta(m);
      expect(await db.readDeviceMeta()).toEqual(m);
    });

    it('returns the scheduler journal in strict seq order regardless of append order', async () => {
      await db.appendSchedJournal('pat-a', [
        { seq: 3, anchorMs: 30, event: {} as never },
        { seq: 1, anchorMs: 10, event: {} as never },
      ]);
      await db.appendSchedJournal('pat-a', [{ seq: 2, anchorMs: 20, event: {} as never }]);
      const seqs = (await db.readSchedJournal('pat-a')).map((r) => r.seq);
      expect(seqs).toEqual([1, 2, 3]);
    });

    it('isolates the journal per patient', async () => {
      await db.appendSchedJournal('pat-a', [{ seq: 1, anchorMs: 1, event: {} as never }]);
      expect(await db.readSchedJournal('pat-b')).toEqual([]);
    });

    it('commits transactional writes', async () => {
      await db.transaction(async (tx) => {
        await tx.writeSyncMeta({ ...BASE_META, cursor: 'committed' });
      });
      expect((await db.readSyncMeta()).cursor).toBe('committed');
    });

    it('rolls the whole state back when a transaction aborts', async () => {
      await db.writeSyncMeta({ ...BASE_META, cursor: 'before' });
      await expect(
        db.transaction(async (tx) => {
          await tx.writeSyncMeta({ ...BASE_META, cursor: 'during' });
          throw new Error('abort');
        }),
      ).rejects.toThrow('abort');
      expect((await db.readSyncMeta()).cursor).toBe('before');
    });

    it('wipes all local state', async () => {
      await db.writeSyncMeta({ ...BASE_META, cursor: 'x' });
      await db.appendSchedJournal('pat-a', [{ seq: 1, anchorMs: 1, event: {} as never }]);
      await db.wipe();
      expect((await db.readSyncMeta()).cursor).toBeNull();
      expect(await db.readSchedJournal('pat-a')).toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------
// Outbox — drains in strict FIFO seq order, deletes only on per-id ACK
// ---------------------------------------------------------------------------

export function describeOutboxPort(make: () => { db: Db; outbox: Outbox }): void {
  describe('Outbox port conformance', () => {
    let db: Db;
    let outbox: Outbox;
    beforeEach(() => {
      ({ db, outbox } = make());
    });

    const enqueue = (e: WireEvent) => db.transaction(async (tx) => outbox.enqueue(tx, e));

    it('peekBatch returns rows in strictly ascending seq', async () => {
      await enqueue(wireEvent(3));
      await enqueue(wireEvent(1));
      await enqueue(wireEvent(2));
      const seqs = (await outbox.peekBatch(10, 1_000_000)).map((e) => e.seq);
      expect(seqs).toEqual([1, 2, 3]);
    });

    it('never skips ahead of an unACKed row: a not-yet-due head truncates the batch', async () => {
      await enqueue(wireEvent(1));
      await enqueue(wireEvent(2));
      await enqueue(wireEvent(3));
      await outbox.markRetryable(['evt-1'], 5_000);
      // Head (seq 1) is not due at t=100, so the batch truncates to empty even
      // though seq 2 and 3 are due. FIFO is never violated to make progress.
      expect(await outbox.peekBatch(10, 100)).toEqual([]);
      // Once the head is due again, all three flow.
      expect((await outbox.peekBatch(10, 10_000)).map((e) => e.seq)).toEqual([1, 2, 3]);
    });

    it('honours the max batch size', async () => {
      await enqueue(wireEvent(1));
      await enqueue(wireEvent(2));
      await enqueue(wireEvent(3));
      expect((await outbox.peekBatch(2, 1_000_000)).map((e) => e.seq)).toEqual([1, 2]);
    });

    it('ackAccepted deletes only the named ids; the rest survive', async () => {
      await enqueue(wireEvent(1));
      await enqueue(wireEvent(2));
      await outbox.ackAccepted(['evt-1']);
      expect(await outbox.depth()).toBe(1);
      expect((await outbox.peekBatch(10, 1_000_000)).map((e) => e.seq)).toEqual([2]);
    });

    it('a row survives ackAccepted of a different id', async () => {
      await enqueue(wireEvent(1));
      await outbox.ackAccepted(['evt-999']);
      expect(await outbox.depth()).toBe(1);
    });

    it('enqueue is atomic with a caller write: aborting the transaction loses both', async () => {
      await db.writeSyncMeta({ ...BASE_META, cursor: 'before' });
      await expect(
        db.transaction(async (tx) => {
          await tx.writeSyncMeta({ ...BASE_META, cursor: 'during' });
          await outbox.enqueue(tx, wireEvent(1));
          throw new Error('abort');
        }),
      ).rejects.toThrow('abort');
      expect((await db.readSyncMeta()).cursor).toBe('before');
      expect(await outbox.depth()).toBe(0);
    });

    it('enqueue is atomic with a caller write: committing keeps both', async () => {
      await db.transaction(async (tx) => {
        await tx.writeSyncMeta({ ...BASE_META, cursor: 'kept' });
        await outbox.enqueue(tx, wireEvent(2));
      });
      expect((await db.readSyncMeta()).cursor).toBe('kept');
      expect(await outbox.depth()).toBe(1);
    });

    it('dropExpired removes rows older than the cutoff and counts them', async () => {
      await enqueue(wireEvent(1)); // t_wall_ms 1001
      await enqueue(wireEvent(2)); // t_wall_ms 1002
      const dropped = await outbox.dropExpired(1002);
      expect(dropped).toBe(1);
      expect(await outbox.depth()).toBe(1);
    });
  });
}

// ---------------------------------------------------------------------------
// MediaStore — content-addressed, hash-verified download
// ---------------------------------------------------------------------------

export interface MediaStoreCaps {
  /** A signed URL that delivers exactly (sha, bytes). */
  signedUrl(sha: string, bytes: number): string;
  /** A signed URL whose delivered content does NOT match (sha, bytes). */
  mismatchUrl(sha: string, bytes: number): string;
}

export function describeMediaStorePort(make: () => MediaStore, caps: MediaStoreCaps): void {
  describe('MediaStore port conformance', () => {
    let store: MediaStore;
    const sha = 'a'.repeat(64);
    beforeEach(() => {
      store = make();
    });

    it('downloads matching content and reports has()', async () => {
      expect(await store.download(sha, caps.signedUrl(sha, 128), 128)).toBe('ready');
      expect(await store.has(sha)).toBe(true);
    });

    it('rejects mismatching content as hash_mismatch and leaves no file', async () => {
      expect(await store.download(sha, caps.mismatchUrl(sha, 128), 128)).toBe('hash_mismatch');
      expect(await store.has(sha)).toBe(false);
    });

    it('purge reports whether a file existed', async () => {
      await store.download(sha, caps.signedUrl(sha, 64), 64);
      expect(await store.purge(sha)).toBe(true);
      expect(await store.purge(sha)).toBe(false);
    });

    it('bytesUsed and evictTo account for stored bytes', async () => {
      const shaB = 'b'.repeat(64);
      await store.download(sha, caps.signedUrl(sha, 100), 100);
      await store.download(shaB, caps.signedUrl(shaB, 100), 100);
      expect(await store.bytesUsed()).toBe(200);
      const freed = await store.evictTo(100);
      expect(freed).toBe(100);
      expect(await store.bytesUsed()).toBeLessThanOrEqual(100);
    });
  });
}

// ---------------------------------------------------------------------------
// SecureStore — boot ordinal monotonicity, passcode gate
// ---------------------------------------------------------------------------

export function describeSecureStorePort(
  make: () => SecureStore,
  opts?: { makeWithoutPasscode?: () => SecureStore },
): void {
  describe('SecureStore port conformance', () => {
    let store: SecureStore;
    beforeEach(() => {
      store = make();
    });

    it('nextBootOrdinal is strictly increasing and never 0', async () => {
      const a = await store.nextBootOrdinal();
      const b = await store.nextBootOrdinal();
      const c = await store.nextBootOrdinal();
      expect(a).toBeGreaterThan(0);
      expect(b).toBeGreaterThan(a);
      expect(c).toBeGreaterThan(b);
    });

    it('round-trips the device credential', async () => {
      await store.setDeviceCredential({ email: 'd@x', deviceSecret: 's' });
      expect(await store.getDeviceCredential()).toEqual({ email: 'd@x', deviceSecret: 's' });
    });

    it('round-trips the db key', async () => {
      await store.setDbKey('k');
      expect(await store.getDbKey()).toBe('k');
    });

    if (opts?.makeWithoutPasscode) {
      it('setDeviceCredential throws PasscodeRequiredError on a passcode-less device', async () => {
        const noPass = opts.makeWithoutPasscode!();
        await expect(noPass.setDeviceCredential({ email: 'd@x', deviceSecret: 's' })).rejects.toBeInstanceOf(
          PasscodeRequiredError,
        );
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Net — a 'revoked' result is distinguishable from 'unavailable'
// ---------------------------------------------------------------------------

export function describeNetPort(make: () => Net): void {
  describe('Net port conformance', () => {
    let net: Net;
    beforeEach(() => {
      net = make();
    });

    it('isOnline returns a boolean', () => {
      expect(typeof net.isOnline()).toBe('boolean');
    });

    it('signIn resolves to a known status', async () => {
      expect(['ok', 'revoked', 'unavailable']).toContain(await net.signIn('e', 's'));
    });

    it('sync returns a tagged union whose status names one of the three outcomes', async () => {
      const r = await net.sync({} as never);
      expect(['ok', 'unavailable', 'revoked']).toContain(r.status);
      // The discriminant lets the caller tell 'revoked' from 'unavailable'
      // without inspecting anything else — that is the whole contract.
      if (r.status === 'ok') expect('body' in r).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------
// AudioOut
// ---------------------------------------------------------------------------

export function describeAudioPort(make: () => AudioOut): void {
  describe('AudioOut port conformance', () => {
    let audio: AudioOut;
    beforeEach(() => {
      audio = make();
    });

    it('speak returns a non-negative durationMs', async () => {
      const { durationMs } = await audio.speak('two words');
      expect(durationMs).toBeGreaterThanOrEqual(0);
    });

    it('route names a known output', () => {
      expect(['speaker', 'headphones', 'none']).toContain(audio.route());
    });

    it('onRouteChange returns an unsubscribe function', () => {
      const off = audio.onRouteChange(() => {});
      expect(typeof off).toBe('function');
      off();
    });

    it('health reports a healthy flag and a route-change count', () => {
      const h = audio.health();
      expect(typeof h.audioHealthy).toBe('boolean');
      expect(typeof h.routeChanges).toBe('number');
    });
  });
}
