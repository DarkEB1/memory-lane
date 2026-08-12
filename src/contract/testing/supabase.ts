// C18 — fixture sign-in · src/contract/testing/supabase.ts
//
// Gives the blind test-writer a real Supabase token against seeded fixture data
// with zero implementation knowledge — the helper that closes the last hole in
// the blind-agent contract (ADR-PLATFORM §6.1). Because patient-device auth is
// ordinary Supabase auth (§5.2), each of these is four lines of
// signInWithPassword against the deterministic identities `supabase/seed.sql`
// creates. This file references @supabase/supabase-js types only.
//
// spec: ADR-PLATFORM §6.1; ADR-DATA §15 (the seed paragraph). MODULES §6 C18.

import type { SupabaseClient } from '@supabase/supabase-js';

// The exact result shape of signInWithPassword, inferred rather than named, so
// this file never depends on an auth-js type export that may be renamed.
type SignInResult = ReturnType<SupabaseClient['auth']['signInWithPassword']>;

export type FixtureDevice = 'device-a' | 'device-b' | 'device-shared';
export type FixtureUserRole = 'caregiver' | 'carehome_admin' | 'researcher' | 'trial_ops';

// The documented deterministic identities of supabase/seed.sql. `seed.sql`
// creates exactly these uuids; both agents import this table so neither invents
// an id. It resolves every scenario ADR-DATA §15 names: three families, two
// devices, one shared tablet, and the offline-backlog, withdrawn, erased and
// adverse-event-before-withdrawal participants.
export const fixtureIds: Readonly<Record<string, string>> = {
  careHome: '0000ca00-0000-4000-8000-000000000001',

  // Devices — the two enrolled tablets plus the shared day-room tablet.
  deviceA: '0000de00-0000-4000-8000-00000000000a',
  deviceB: '0000de00-0000-4000-8000-00000000000b',
  deviceShared: '0000de00-0000-4000-8000-00000000005e',

  // Staff / research users.
  caregiver: '0000c60e-0000-4000-8000-000000000001',
  carehomeAdmin: '0000ad11-0000-4000-8000-000000000001',
  researcher: '0000e5ea-0000-4000-8000-000000000001',
  trialOps: '00000005-0000-4000-8000-000000000001',

  // The three families' participants.
  patientFamilyOne: '0000a000-0000-4000-8000-000000000001',
  patientFamilyTwo: '0000a000-0000-4000-8000-000000000002',
  patientFamilyThree: '0000a000-0000-4000-8000-000000000003',

  // The four special-case participants (each may coincide with a family above
  // in the seed; the ids are distinct so a test can address the case directly).
  patientBacklog: '0000a000-0000-4000-8000-0000000000b1',
  patientWithdrawn: '0000a000-0000-4000-8000-0000000000d1',
  patientErased: '0000a000-0000-4000-8000-0000000000e1',
  patientAdverseEvent: '0000a000-0000-4000-8000-0000000000a1',
} as const;

// seed.sql provisions each fixture device as a Supabase user whose email is
// derived from its label and whose password is the device secret (§5.2). These
// are FIXTURE credentials for a local `supabase start` database, never a real
// deployment.
const DEVICE_EMAIL_DOMAIN = 'devices.memory-lane.test';
const USER_EMAIL_DOMAIN = 'users.memory-lane.test';
const FIXTURE_DEVICE_SECRET: Readonly<Record<FixtureDevice, string>> = {
  'device-a': 'fixture-device-secret-a',
  'device-b': 'fixture-device-secret-b',
  'device-shared': 'fixture-device-secret-shared',
};
const FIXTURE_USER_PASSWORD = 'fixture-user-password';

/**
 * Sign the client in as one of the three seeded fixture devices. The returned
 * token decodes to `app_metadata.role === 'device'` with the matching
 * `device_id`. Idempotent: a second call re-signs the same identity.
 */
export function signInAsFixtureDevice(
  client: SupabaseClient,
  device: FixtureDevice,
): SignInResult {
  return client.auth.signInWithPassword({
    email: `${device}@${DEVICE_EMAIL_DOMAIN}`,
    password: FIXTURE_DEVICE_SECRET[device],
  });
}

/**
 * Sign the client in as a seeded staff or research user. `label` disambiguates
 * multiple users sharing a role in the seed (e.g. two caregivers in different
 * families), and maps to the seeded email `${role}.${label}@…`.
 */
export function signInAsFixtureUser(
  client: SupabaseClient,
  role: FixtureUserRole,
  label: string,
): SignInResult {
  return client.auth.signInWithPassword({
    email: `${role}.${label}@${USER_EMAIL_DOMAIN}`,
    password: FIXTURE_USER_PASSWORD,
  });
}
