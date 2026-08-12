// Contract self-check — the W1 freeze gate.
//
// These are NOT blind tests. They are the contract package verifying its own
// frozen literals against the assertions the module manifest (§6 LAYER C, the
// "blind test" column) states for each C-module. Their job is to catch a
// mis-transcribed frozen constant BEFORE anything is built on it. They depend on
// no fixture data (that is the blind test-writer's job); only structural,
// count and negative assertions live here.
import { describe, it, expect } from '@jest/globals';
import { defaultConfig } from '@/contract/config';
import { ENVELOPE_KEYS, ATTEMPT_KEYS, EVENT_SCHEMA, EVENT_VARIANTS } from '@/contract/schema';
import * as testids from '@/contract/testids';

describe('C02 — SchedulerConfig / defaultConfig', () => {
  it('has exactly 49 fields', () => {
    expect(Object.keys(defaultConfig).length).toBe(49);
  });
  it('both ladders are length 7 and strictly increasing', () => {
    for (const ladder of [defaultConfig.withinLadderMs, defaultConfig.acrossLadderMs]) {
      expect(ladder.length).toBe(7);
      for (let i = 1; i < ladder.length; i++) expect(ladder[i]).toBeGreaterThan(ladder[i - 1]);
    }
  });
  it('ceilingRung keys are exactly {1,2,3}', () => {
    expect(Object.keys(defaultConfig.ceilingRung).map(Number).sort()).toEqual([1, 2, 3]);
  });
  it('sessionMaxTrials === sessionMaxItems * maxTrialsPerItemPerSession', () => {
    expect(defaultConfig.sessionMaxTrials).toBe(
      defaultConfig.sessionMaxItems * defaultConfig.maxTrialsPerItemPerSession,
    );
  });
  it('vanishPerSession === 1 (P: at most one vanish attempt per session)', () => {
    expect(defaultConfig.vanishPerSession).toBe(1);
  });
  it('latency thresholds are ordered min <= slow <= max', () => {
    expect(defaultConfig.minPlausibleLatencyMs).toBeLessThanOrEqual(defaultConfig.slowLatencyMs);
    expect(defaultConfig.slowLatencyMs).toBeLessThanOrEqual(defaultConfig.maxLatencyMs);
  });
});

describe('C06 — the four frozen runtime literals', () => {
  it('ENVELOPE_KEYS has exactly the 5 envelope keys', () => {
    expect(ENVELOPE_KEYS).toEqual(['eventId', 'deviceId', 'bootId', 'seq', 'anchorMs']);
  });
  it('ATTEMPT_KEYS has 6 keys and none is a self-report channel (I-9 clause 1)', () => {
    expect(ATTEMPT_KEYS.length).toBe(6);
    for (const k of ATTEMPT_KEYS) expect(k).not.toMatch(/confidence|rating|self|asr|grade/i);
  });
  it('EVENT_SCHEMA has exactly 14 keys and AcuteSignalDelivered maps to []', () => {
    expect(Object.keys(EVENT_SCHEMA).length).toBe(14);
    expect(EVENT_SCHEMA.AcuteSignalDelivered).toEqual([]);
  });
  it('EVENT_SCHEMA entries never include `type` or an envelope key', () => {
    for (const keys of Object.values(EVENT_SCHEMA)) {
      expect(keys).not.toContain('type');
      for (const env of ENVELOPE_KEYS) expect(keys).not.toContain(env);
    }
  });
  it('I-9 clause 2 — DistressReported.source is exactly the two human variants', () => {
    expect(EVENT_VARIANTS['DistressReported.source']).toEqual(['patient_control', 'caregiver_report']);
    expect(EVENT_VARIANTS['DistressReported.source']).not.toContain('abandonment');
    expect(EVENT_VARIANTS['DistressReported.source']).not.toContain('repeated_skip');
  });
  it('I-9 clause 3 — no *.by variant list contains "algorithm"', () => {
    for (const [k, members] of Object.entries(EVENT_VARIANTS)) {
      if (k.endsWith('.by')) {
        expect(members).toEqual(['caregiver', 'clinician']);
        expect(members).not.toContain('algorithm');
      }
    }
  });
});

describe('C11 — the patient test-id contract', () => {
  it('PATIENT_CONTROLS has exactly 4 members, all subset of patient ids', () => {
    expect(testids.PATIENT_CONTROLS.length).toBe(4);
    const all = Object.values(testids.patient);
    for (const c of testids.PATIENT_CONTROLS) expect(all).toContain(c);
  });
});
