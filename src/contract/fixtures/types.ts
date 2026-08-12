// C15 — fixture row types and the fixture manifest · src/contract/fixtures/types.ts
//
// The row shape of every scheduler fixture file plus the manifest of which file
// exercises which frozen §21.1 export. The blind test-writer authors the JSON
// DATA against these shapes; the runner loads it. Neither side invents a format.
//
// PURE: type-only imports from the C01–C05 foundation. No runtime import except
// the sibling contract modules. No react/react-native/expo/supabase/zod/Date/
// Math.random. This file lives one directory below the foundation, so the
// import specifiers are '../types', '../events', '../scheduler-state',
// '../scheduler-api'.
//
// spec: SCHEDULER-SPEC §23 (the manifest table and the `unreachable` predicate),
//        §7.2, §9.4, §13.2, §17.3, §17.4, §18, §18.1, §19.
// deps (MODULES §6 C15): C01, C02, C03, C04, C05, C14. C14 (programme.ts) is
//        listed as an available dependency, but NO fixture row shape in §23
//        references a C14 type — every scheduler fixture speaks scheduler
//        vocabulary only — so C14 is deliberately NOT imported here to keep the
//        surface minimal. Flagged in the authoring notes.

import type { SchedulerEvent } from '../events';
import type { TrialDirective } from '../scheduler-api';
import type { SchedulerState } from '../scheduler-state';
import type {
  CueLevel,
  Grade,
  Rung,
  SessionOutcome,
  Tier,
  TrialClass,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Row shapes — one exported interface / union per §23 "Shape" column family.
// The seven names below are the FROZEN api of C15 (MODULES §6). Several fixture
// files share one shape; that reuse is by design (see FIXTURE_MANIFEST).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `grades.json` — exercises `gradeOf`, `isVoid`.
 * SCHEDULER-SPEC §7.2. The exhaustive cross-product; the blind test pins 128
 * rows. Input is the full argument surface of both functions (the two config
 * thresholds are carried per-row so the fixture is self-contained); output is
 * the objective grade and the void flag.
 */
export interface GradeFixtureRow {
  // input — the six Attempt fields (§4 Attempt) plus the two consulted thresholds
  readonly correct: boolean;
  readonly cueLevel: CueLevel;
  readonly latencyMs: number;
  readonly attemptIndex: number;
  readonly interrupted: boolean;
  readonly appBackgroundedMs: number;
  readonly slowLatencyMs: number;
  readonly minPlausibleLatencyMs: number;
  // expected
  readonly grade: Grade;
  readonly isVoid: boolean;
}

/**
 * `cue-transitions.json` — exercises `cueTransition`.
 * SCHEDULER-SPEC §9.4 five-arm table, TOTAL over its five inputs; the blind test
 * pins 4×4×3×4×2 = 384 rows, every row carrying all five output values. `input`
 * matches the `cueTransition` parameter object exactly and `expected` matches its
 * return object exactly — `cueRaisedThisSession` legitimately appears on BOTH
 * sides (an input read and a distinct output value), which is why the row nests
 * input/expected rather than flattening.
 *
 * `unreachable` is an INFORMATIONAL label, never a missing value: the function is
 * total, so every row carries a full `expected`. Compute it with `unreachable()`.
 */
export interface CueTransitionFixtureRow {
  readonly input: {
    readonly floor: CueLevel;
    readonly openingCue: CueLevel;
    readonly trialClass: TrialClass;
    readonly grade0: Grade;
    readonly cueRaisedThisSession: boolean;
  };
  readonly expected: {
    readonly cueLevel: CueLevel; // the floor this rule WOULD write; equals `floor` when it writes none
    readonly writesCueLevel: boolean;
    readonly stableSessionsReset: boolean;
    readonly vanishResolved: boolean;
    readonly cueRaisedThisSession: boolean; // the NEW value
  };
  readonly unreachable: boolean; // §23 five-clause label; see unreachable()
}

/**
 * `across-transitions.json` — exercises `acrossTransition`, `effectiveAcrossRung`.
 * SCHEDULER-SPEC §13.2; the blind test pins 3×7×6×2×3 = 756 rows. Entering
 * `stableSessions` is FIXED at 0 for every row (so it is not a varied input), and
 * `dueOffsetMs = acrossLadderMs[effectiveAcrossRung({tier, acrossRung: expected.acrossRung}, driftLevel)]`.
 */
export interface AcrossTransitionFixtureRow {
  readonly input: {
    readonly tier: Tier;
    readonly acrossRung: Rung;
    readonly outcome: SessionOutcome;
    readonly vanishResolved: boolean;
    readonly driftLevel: 0 | 1 | 2;
    // entering stableSessions is fixed at 0 by §23 and therefore not enumerated
  };
  readonly expected: {
    readonly acrossRung: Rung;
    readonly stableSessions: number;
    readonly dueOffsetMs: number; // acrossLadderMs[effectiveAcrossRung(...)], integer ms
  };
}

/**
 * `decision-table.json` — exercises `reduce`.
 * SCHEDULER-SPEC §18 (the 72-row `correct × cue × tier × due-state` table) plus
 * §18.1 (the SUPPORTED / VANISH extension). The blind test pins 80 rows. The two
 * sub-tables have genuinely different column sets, so this is a discriminated
 * union on `section`; the fixture JSON parses each object by that discriminant.
 *
 * NOTE ON NAMING: §23's prose calls this "the fold", but the export that §18/§18.1
 * are the contract for is the single-event `reduce` (each row is one
 * `{state, event} → state'` step). `reduce` is a §21.1 frozen name; "the fold" is
 * not. The manifest keys this file to `reduce` so the §21.1 intersection stays
 * total (see the authoring notes).
 */
export type DecisionTableRow =
  | {
      readonly section: '18'; // the 72-row core table
      readonly input: {
        readonly correct: boolean;
        readonly cue: CueLevel; // == item.cueLevel (the floor) for these rows; trialClass = FLOOR
        readonly tier: Tier;
        readonly dueState: DueState;
      };
      readonly expected: {
        readonly grade: Grade;
        readonly cueLevel: CueLevel; // cueLevel'
        readonly stableSessions: number; // stable'
        readonly outcome: SessionOutcome;
        readonly acrossRung: Rung; // acrossRung'
        readonly dueOffsetMs: number;
      };
      readonly selection: string; // §18 "selection" column verbatim: 'FRESH' or a PRIORITY_KEY prefix e.g. '[1,1,1,…]'
      readonly reachable: boolean; // §18 "reachable" column
      readonly reachableNote: string | null; // the reason text where the table gives one, else null
    }
  | {
      readonly section: '18.1'; // the SUPPORTED / VANISH extension
      readonly input: {
        readonly trialClass: TrialClass;
        readonly grade0: Grade; // §18.1 "g0"
        readonly f: CueLevel; // the item's FLOOR (item.cueLevel). cueLevel' is min(f+1,3) / max(f-1,0), so f is required to derive it.
        readonly isVoid: boolean; // §18.1 final row: when attempt 0 isVoid, cueTransition is not called at all
      };
      readonly expected: {
        readonly cueLevelWritten: boolean; // "written" vs "not written" (arm 5) vs "not called" (isVoid)
        readonly cueLevel: CueLevel | null; // the value written, or null when not written / not called
        // stableSessions' at TRIAL CLOSE only. `written` false => the field is left untouched
        // (moves later at S3 via the outcome), so no concrete value is assertable here and it is null.
        readonly stableSessionsWritten: boolean;
        readonly stableSessions: number | null; // the value written at trial close (always 0 where written), else null
        readonly vanishResolved: boolean; // VANISH rows set this true
        readonly contributesToOutcome: boolean; // §18.1 "contributes to outcome?"
      };
    };

/** §18 due-state column. `NEVER` = lastSeenAtMs === null; `NOT_DUE` = dueAtMs > now; `DUE` = dueAtMs <= now. */
export type DueState = 'NEVER' | 'NOT_DUE' | 'DUE';

/**
 * `sessions/*.json`, `sessions/no-op-seq.json`, `ordering/out-of-order-batches.json`
 * — exercises `fold` (and, via the no-op-seq file, the per-rule `reduce`
 * behaviour of R1 vs R3–R12).
 * SCHEDULER-SPEC §19, §6.1–6.2, WE-17, WE-26. Feed the event array, compare the
 * serialised final `SchedulerState` field-for-field (deep equality). `initialState`
 * is `S0` (§19.0) for the first of a chain, `ordering`, and `no-op-seq`; for a
 * chained `sessions/*.json` it is the PREVIOUS file's asserted `expected`.
 */
export interface SessionFixture {
  readonly name: string; // the WE label or the rule under test, e.g. 'we-3', 'no-op-R7', 'we-26-case-1'
  readonly initialState: SchedulerState; // S0 (§19.0) or the prior file's asserted final state
  readonly events: readonly SchedulerEvent[]; // canonical-order for fold; deliberately non-monotone for ordering/*
  readonly expected: SchedulerState; // full expected final state, compared by deep equality
}

/**
 * `next-trial.json` — exercises `nextTrial`, `probeDue`, `closerItemId`.
 * SCHEDULER-SPEC §10, §16, §10.2. One picker step: given a state and the current
 * boot-scoped monotonic clock, assert the emitted directive. `probeDue` and
 * `closerItemId` are the two internal predicates that steer the emitted directive
 * (a `PROBE_BLOCK` iff `probeDue`, a `CLOSER` carrying `closerItemId`), so this
 * "walk" of the picker exercises all three names named in its manifest row.
 */
export interface WalkFixture {
  readonly name: string;
  readonly state: SchedulerState;
  readonly nowMonoMs: number; // scoped to state.activeSession.bootId
  readonly expected: TrialDirective;
}

/**
 * `helpers.json` and the remaining single-call pure-function files — a generic
 * `{input} → value` row.
 *
 * Used by: `helpers.json` (clampGap, gapBinds, localDayIndex, median, initialState),
 * `outcome.json` (outcomeFor), `roster-order.json` (planRoster),
 * `drift.json` (evaluateDrift), `acute.json` (acuteChange, median),
 * `presentation.json` (resolvePresentation, canVanish, foilFor, overdueReturn),
 * `telemetry.json` (trialTelemetry, sessionTelemetry), `signals.json` (signals).
 *
 * `fn` names the §21.1 export the row calls, so a file exercising several
 * functions (helpers.json, acute.json, presentation.json) discriminates its rows
 * by it. `In` / `Out` are instantiated per file against the real C01–C05 types
 * (e.g. `HelperFixtureRow<{ trials: readonly CountedTrial[] }, SessionOutcome>`
 * for outcome.json); the exported name stays generic because a single frozen row
 * type must span heterogeneous signatures. The concrete In/Out per file is
 * pinned by the manifest's `shape` string.
 */
export interface HelperFixtureRow<In = unknown, Out = unknown> {
  readonly fn: string; // the §21.1 export under test, e.g. 'clampGap'
  readonly name: string; // case label
  readonly input: In;
  readonly expected: Out;
}

// ─────────────────────────────────────────────────────────────────────────────
// The manifest — which file exists, what it exercises, what shape it parses
// against. SCHEDULER-SPEC §23, transcribed. The intersection of `exercises`
// across all entries with the §21.1 frozen list is TOTAL in both directions:
// every one of the 27 names is exercised by at least one file and no file names
// a non-export.
// ─────────────────────────────────────────────────────────────────────────────

/** The seven frozen row-shape names. Every fixture JSON parses against one of these. */
export type FixtureRowType =
  | 'GradeFixtureRow'
  | 'CueTransitionFixtureRow'
  | 'AcrossTransitionFixtureRow'
  | 'DecisionTableRow'
  | 'SessionFixture'
  | 'WalkFixture'
  | 'HelperFixtureRow';

export interface FixtureManifestEntry {
  /** Path relative to `src/contract/fixtures/scheduler/`. */
  readonly file: string;
  /** The §21.1 export name(s) this file exercises. Every name here is on §21.1. */
  readonly exercises: readonly string[];
  /** Which row shape above the file's JSON parses against. */
  readonly rowType: FixtureRowType;
  /** The §23 "Shape" column, transcribed, pinning the concrete input → output. */
  readonly shape: string;
  /** Exact row count where the blind test pins one; `null` where §23 says "~N". */
  readonly rows: number | null;
}

/** SCHEDULER-SPEC §23 fixture manifest, transcribed verbatim. Frozen. */
export const FIXTURE_MANIFEST: readonly FixtureManifestEntry[] = [
  {
    file: 'config.json',
    exercises: ['defaultConfig'],
    rowType: 'HelperFixtureRow',
    shape: 'the serialised object → deep equality',
    rows: 1,
  },
  {
    file: 'grades.json',
    exercises: ['gradeOf', 'isVoid'],
    rowType: 'GradeFixtureRow',
    shape: '{correct, cueLevel, latencyMs, attemptIndex, interrupted, appBackgroundedMs, slowLatencyMs, minPlausibleLatencyMs} → {grade, isVoid}',
    rows: 128,
  },
  {
    file: 'decision-table.json',
    exercises: ['reduce'],
    rowType: 'DecisionTableRow',
    shape: 'the 72 rows of §18, verbatim, plus the 8 rows of §18.1',
    rows: 80,
  },
  {
    file: 'cue-transitions.json',
    exercises: ['cueTransition'],
    rowType: 'CueTransitionFixtureRow',
    shape: '{floor, openingCue, trialClass, grade0, cueRaisedThisSession} → {cueLevel, writesCueLevel, stableSessionsReset, vanishResolved, cueRaisedThisSession}',
    rows: 384,
  },
  {
    file: 'outcome.json',
    exercises: ['outcomeFor'],
    rowType: 'HelperFixtureRow',
    shape: '{trials: [{grade0, trialClass}]} → SessionOutcome',
    rows: null,
  },
  {
    file: 'across-transitions.json',
    exercises: ['acrossTransition', 'effectiveAcrossRung'],
    rowType: 'AcrossTransitionFixtureRow',
    shape: '{tier, acrossRung, outcome, vanishResolved, driftLevel} → {acrossRung, stableSessions, dueOffsetMs} with entering stableSessions fixed at 0 and dueOffsetMs = acrossLadderMs[effectiveAcrossRung({tier, acrossRung: result.acrossRung}, driftLevel)]',
    rows: 756,
  },
  {
    file: 'roster-order.json',
    exercises: ['planRoster'],
    rowType: 'HelperFixtureRow',
    shape: '{items[], nowAnchorMs, sessionCount} → {itemIds[], forcedMissing[]}',
    rows: null,
  },
  {
    file: 'next-trial.json',
    exercises: ['nextTrial', 'probeDue', 'closerItemId'],
    rowType: 'WalkFixture',
    shape: '{state, nowMonoMs} → TrialDirective',
    rows: null,
  },
  {
    file: 'drift.json',
    exercises: ['evaluateDrift'],
    rowType: 'HelperFixtureRow',
    shape: "{history[], anchorMs, driftLevel} → driftLevel'",
    rows: null,
  },
  {
    file: 'acute.json',
    exercises: ['acuteChange', 'median'],
    rowType: 'HelperFixtureRow',
    shape: '{history[], nowAnchorMs, acuteLastFiredAtMs} → limb | null',
    rows: null,
  },
  {
    file: 'presentation.json',
    exercises: ['resolvePresentation', 'canVanish', 'foilFor', 'overdueReturn'],
    rowType: 'HelperFixtureRow',
    shape: '{state, entry} → {openingCueLevel, floorCueLevel, trialClass, foilItemId}',
    rows: null,
  },
  {
    file: 'telemetry.json',
    exercises: ['trialTelemetry', 'sessionTelemetry'],
    rowType: 'HelperFixtureRow',
    shape: '{state, directive, nowAnchorMs, nowMonoMs} → TrialSchedulingTelemetry, and {state, reason, closerPresented} → SessionSchedulingTelemetry | null',
    rows: null,
  },
  {
    file: 'helpers.json',
    exercises: ['clampGap', 'gapBinds', 'localDayIndex', 'median', 'initialState'],
    rowType: 'HelperFixtureRow',
    shape: '{input…} → value',
    rows: null,
  },
  {
    file: 'signals.json',
    exercises: ['signals'],
    rowType: 'HelperFixtureRow',
    shape: '{state, nowAnchorMs} → SchedulerSignal[]',
    rows: null,
  },
  {
    file: 'ordering/out-of-order-batches.json',
    exercises: ['fold'],
    rowType: 'SessionFixture',
    shape: 'a non-monotone log → the state fold actually produces (tolerated corruption, §6.1)',
    rows: 3,
  },
  {
    file: 'sessions/no-op-seq.json',
    exercises: ['reduce'],
    rowType: 'SessionFixture',
    shape: 'one no-op event per rule → expected state (R1 vs R3–R12)',
    rows: 10,
  },
  {
    file: 'sessions/*.json',
    exercises: ['fold'],
    rowType: 'SessionFixture',
    shape: 'full event log → full expected final SchedulerState, compared by deep equality (WE-2 → WE-3 → WE-4 → WE-5 chained, plus we-2-permuted, WE-6 ×3, WE-7..WE-11, WE-15, WE-16, WE-18..WE-23, WE-27 ×2, WE-29)',
    rows: null,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// The `unreachable` predicate for cue-transitions.json — SCHEDULER-SPEC §23's
// five-clause label, implemented MECHANICALLY so the blind test-writer and the
// blind implementer label the identical subset. It is a label ON a row, never a
// missing output value; `cueTransition` is total and every row carries a full
// `expected`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True iff the `input` of a `CueTransitionFixtureRow` is a state no
 * self-consistent presenter can produce. §23:
 *
 *   (a) trialClass !== (openingCue < floor ? 'VANISH' : openingCue === floor ? 'FLOOR' : 'SUPPORTED')
 *   (b) openingCue === 3 && grade0 !== 'EXPOSURE'
 *   (c) openingCue !== 3 && grade0 === 'EXPOSURE'
 *   (d) trialClass === 'VANISH' && cueRaisedThisSession === true   // a vanish is trial 0 of the session
 *   (e) trialClass === 'VANISH' && floor === 0                     // nothing below free recall
 *
 * Anything else is `false`.
 */
export function unreachable(row: CueTransitionFixtureRow): boolean {
  const { floor, openingCue, trialClass, grade0, cueRaisedThisSession } = row.input;
  const consistentClass: TrialClass =
    openingCue < floor ? 'VANISH' : openingCue === floor ? 'FLOOR' : 'SUPPORTED';
  return (
    trialClass !== consistentClass || // (a)
    (openingCue === 3 && grade0 !== 'EXPOSURE') || // (b)
    (openingCue !== 3 && grade0 === 'EXPOSURE') || // (c)
    (trialClass === 'VANISH' && cueRaisedThisSession === true) || // (d)
    (trialClass === 'VANISH' && floor === 0) // (e)
  );
}
