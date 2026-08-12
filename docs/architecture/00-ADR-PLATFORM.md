# ADR-000: Platform and Architecture

**Status:** Accepted · **Date:** 2026-08-12 · **Decider:** presiding architect
**Supersedes:** nothing · **Superseded by:** nothing

This ADR is binding. The four advocate proposals in this directory are retained as evidence, not as options. Do not relitigate the platform choice without new facts; §9 lists the specific facts that would reopen it.

---

## 1. Decision

**Expo SDK 57 (React Native 0.86 + react-native-web), single package, no monorepo, no NativeWind, with Supabase as the only backend.**

Amended in five places from the `expo-universal` proposal as written, because cross-examination proved those five parts wrong or unnecessary:

1. **Device auth is a real Supabase auth user whose password is the device secret.** No hand-signed JWTs. No stored refresh tokens. (§5)
2. **One offline storage implementation, not two.** `expo-sqlite` with SQLCipher on native. The browser build is online-first and makes no multi-day-offline promise. The IndexedDB adapter, the Cache-Storage media path, and the two-backend conformance burden are deleted. (§4)
3. **No NativeWind, no Tailwind.** `StyleSheet.create` plus a plain tokens module for React Native surfaces; plain CSS with the same token values for the researcher DOM surface. (§7)
4. **Scheduler state is never synced.** The device computes a local projection; the server recomputes canonically from the ingested event log using the same TypeScript module. Adopted from `split-surfaces`. (§4.4)
5. **A frozen `testids.ts` and a machine-readable RLS policy table are part of the contract package.** Adopted from `vite-pwa-capacitor` and `split-surfaces` respectively. (§6)

Runtime dependency count: **21**. Total direct manifest entries including dev: **30**.

### Why this is a synthesis and not a failure of nerve

Everything imported from a rival proposal is a *correction to a specific defect that survived cross-examination*, and four of the five **delete** code rather than add it. The synthesis removes an entire storage backend, an entire styling toolchain, a bespoke JWT minter, a synced table, and a refresh-token rotation state machine. It adds one 40-line const file and one data table. The net direction is smaller.

---

## 2. Rationale

### 2.1 Every proposal concluded the care-home tablet must be native

This is the decisive convergence and it should be stated first, because it collapses the debate.

- `vite-pwa-capacitor`: *"shared care-home tablets should run the native app; the PWA is for personal/family devices during the pilot."*
- `split-surfaces`: *"I recommend shared-tablet mode be Capacitor-only in production."*
- `nextjs-fullstack`: *"security and reliability therefore point the same direction: get to native."*
- `expo-universal`: native from week 1 by construction.

Fixed requirements 4(b) (three days, flaky or no wifi) and 5 (shared tablet, no patient login) attach to the care-home tablet. All four advocates agree that surface cannot be a browser. Therefore the browser deliverable is the caregiver surface, the researcher surface, and a fully-functional-but-online patient surface for development, demo and E2E. The real question is not *web or native*; it is **which native**.

### 2.2 Which native: React Native beats WKWebView on this product's specific hard parts

| Hard requirement | React Native (Expo) | WKWebView shell (Capacitor) |
|---|---|---|
| App Store guideline 4.2 | Compiles to real `UIView`s. The "repackaged website" reading is structurally unavailable to a reviewer. 4.2 minimum-functionality still applies to any binary (correctly noted by `nextjs-fullstack`), but the specific rejection shape does not. | A genuine, unbounded, human judgment call. `vite-pwa-capacitor` conceded this outright: *"my app is HTML in a WKWebView, which is literally the shape the guideline was written to catch."* Its cited defence, 4.2.3(i), does not say what it claimed — that clause is about depending on a companion app. |
| Microphone capture (requirement 6) | `expo-audio`, first-party, records AAC in `.m4a` on iOS and Android, with direct `AVAudioSession` control and its own privacy manifest. | Capacitor ships **no** official audio-recording plugin. `@capacitor/camera` declares camera and photo-library usage strings only. Capawesome's Audio Recorder is Insiders-only sponsorware — `vite-pwa-capacitor` documented this itself. The remaining path is `getUserMedia`/`MediaRecorder` in a custom-scheme WKWebView, which the same proposal lists as its own worst risk. |
| Large media writes | `expo-file-system` writes files directly. | `@capacitor/filesystem` requires base64-encoded input, so every family photo crosses the JS bridge as a contiguous string with 33% inflation. Unpriced in that proposal's 3–4 day MediaPort estimate. |
| Durable local store | `expo-sqlite` in the app sandbox, outside WebKit storage entirely. SQLCipher is first-party (`useSQLCipher: true` config plugin + `PRAGMA key`) — the `expo-universal` proposal was wrong to price a swap to `op-sqlite`, and the correction is in our favour. | `@capacitor-community/sqlite` — community-maintained, and the encryption and stolen-tablet story rests on it. Ionic's own wording is that community plugins "should work." |
| Audio playback for a user who cannot follow a "tap to enable sound" prompt | Native player, no gesture gate. | WKWebView autoplay after inactivity can still require a gesture; `AVAudioSession` category is not settable from JS. |

### 2.3 Fatal attacks that removed options

Applying the stated rule — *fatal and unrebutted loses*:

- **`nextjs-fullstack` — eliminated.** Attacked as fatal by two independent attackers on the same point and never rebutted: Next's static-export target (which *is* the iOS build) does not support Route Handlers that read the request, supports only `force-static` GET, and forbids `cookies()` and `proxy.ts`. Its headline differentiator — a typed HTTP contract as the blind test boundary — is absent from the build that becomes the app. Its CI gate proves the patient surface has no server; it cannot prove the contract tier ships. Compounding: a second implementation of the scheduler in SQL cross-checked by a 10,000-case property test is the largest single duplication proposed by anyone, and `split-surfaces` dissolved the need for it.
- **`split-surfaces` — offline substrate eliminated, architecture partly adopted.** Its load-bearing claim — *"inside Capacitor the store is app-container-local so WebKit eviction does not apply at all"* — is false, was attacked as fatal by two proposals, and the advocate **conceded it in writing**. Non-browser WKWebViews get a 15%/20% quota against a browser's 60%/80%, best-effort by default, LRU-evicted under system pressure, with `navigator.storage.persist()` unreachable from inside a webview. Its telemetry outbox and its media cache sat in the same evictable origin, so requirement 7 was unenforceable. Its two genuinely superior ideas — derived-not-synced scheduler state, and `patient_id` never appearing in the device JWT — are adopted here.
- **`vite-pwa-capacitor` — eliminated, three ideas adopted.** Two fatal attacks landed. (a) Refresh-token rotation with reuse detection is an availability landmine on care-home wifi: outside a 10-second reuse interval Supabase terminates the whole session, and a lost response plus a backed-off retry is indistinguishable from theft. Recovery on a keyboardless tablet requires a caregiver walking over with a new enrolment code. (b) Its 4.2 defence rests on a misread of 4.2.3(i). Add the unrebutted microphone-plugin and base64-filesystem findings. Its `testids.ts`, its `getBoundingClientRect` touch-target assertion, and its correct native storage placement are adopted.
- **`expo-universal` — survived. No fatal attack landed and was unrebutted.** The serious hits are real and are all fixed in §4–§6: no SecureStore on web, no built-in service worker on Expo web, hand-signed JWTs using the legacy shared secret, an unexecutable week-2 kill criterion, and RLS tests that could not actually be authored blind against a hand-minted token.

### 2.4 What we are paying for this

Stated plainly so nobody is surprised.

- **react-native-web is in maintenance mode.** Verified, not speculation: the creator has moved to React Strict DOM, Zalando migrated off in 2025, no major features are planned. We are betting the web half on a frozen library. Mitigations: pin versions; keep `src/domain` renderer-free; keep the researcher surface on plain DOM (already immune); treat an RNW stall as an accelerant for the native migration that is the destination anyway.
- **`node_modules` will be ~1,100–1,500 packages, 700 MB–1.2 GB.** Install-time weight, not shipped weight. This is the price of a toolchain that also produces an `.ipa`.
- **Agents are better at DOM than at React Native.** Real, and it lands on requirement 9. Mitigated by keeping agents in pure TypeScript behind ports, by `expo export --platform ios` in CI from week 1, and by the researcher surface being plain DOM.
- **Researcher dashboard carries the RNW baseline** (~300–450 KB gz) even though it renders plain DOM, because the root layout is RN. Accepted: it is an internal desktop dashboard behind a login.

---

## 3. Final stack

Every Expo-ecosystem package is installed with `npx expo install`, never `npm install`. `npx expo install --check` runs in CI and fails on drift. This is not a style preference; bypassing Expo's per-SDK compatibility matrix is the single most common way Expo projects break.

### Runtime (21)

| # | Package | Purpose |
|---|---|---|
| 1 | `expo` `~57.0.x` | SDK, Metro config, version resolver, `prebuild` |
| 2 | `react` `19.2.x` | pinned by SDK 57 |
| 3 | `react-dom` `19.2.x` | web renderer |
| 4 | `react-native` `0.86.x` | pinned by SDK 57 |
| 5 | `react-native-web` | SDK-pinned. Never hand-pick the version. |
| 6 | `expo-router` | one file tree → URLs on web, stacks on native |
| 7 | `react-native-safe-area-context` | required peer of expo-router |
| 8 | `react-native-screens` | required peer of expo-router |
| 9 | `expo-sqlite` | local store, **`useSQLCipher: true`** |
| 10 | `expo-file-system` | content-addressed media at `${documentDirectory}media/<sha256>` |
| 11 | `expo-crypto` | SHA-256 content addressing, UUIDv7 generation |
| 12 | `expo-network` | connectivity transitions drive the sync drain |
| 13 | `@supabase/supabase-js` `^2.112.3` | the only backend client |
| 14 | `expo-camera` | caregiver photo capture |
| 15 | `expo-audio` | caregiver recording (AAC/`.m4a`), patient playback |
| 16 | `expo-image` | memory+disk cache, `recyclingKey`, sub-frame photo display |
| 17 | `expo-image-manipulator` | downscale to 1600px before upload |
| 18 | `expo-secure-store` | Keychain for the device secret and the SQLCipher key |
| 19 | `@tanstack/react-query` | caregiver + researcher only. Patient surface must not import it. |
| 20 | `zod` `^4.4.3` | the contract layer — schemas are the spec, the types, and the validators |
| 21 | `recharts` `^3.10.1` | researcher `.web.tsx` only |

### Dev (9)

`typescript` `7.0.2`, `jest`, `jest-expo`, `@testing-library/react-native`, `@playwright/test` `1.62.x`, `eslint` + `eslint-config-expo`, `prettier`, `supabase` CLI `2.113.x`.

Maestro is a binary, not an npm dependency, and arrives with the iOS build.

### Explicitly not installed

`nativewind`, `tailwindcss` (v5 is a preview major; §7 explains the cut) · `expo-video` (no video in v1) · `dexie` (no IndexedDB backend) · Redux/Zustand/Jotai · `react-native-reanimated`/`gesture-handler` (until a specific interaction needs them) · `date-fns`/`luxon` (epoch integers and `Intl`) · any component library · PowerSync, RxDB, ElectricSQL, Yjs, Automerge (§4.4 shows there is nothing to merge) · `ffmpeg.wasm` (§8) · any analytics or error-reporting SDK.

**The PowerSync trigger, recorded so its absence is a decision and not a blind spot:** if a future requirement introduces genuinely bidirectional mutable state — care staff editing card content *offline on the tablet* — hand-rolled sync stops being sufficient and PowerSync becomes correct, at roughly a week of integration.

---

## 4. Offline, storage and sync

### 4.1 The scoping cut

**Only the patient surface is offline-capable, and only on native.** Caregiver is online-first. Researcher is read-only and online-only. This removes offline conflict resolution, an offline binary upload queue, offline auth for two roles, and all merge UI.

**The browser build makes no multi-day-offline promise.** It runs the full patient surface against an in-memory `Db` implementation hydrated from the network at load, with the outbox POSTed immediately rather than queued. It is for development, demo, and Playwright E2E of interaction logic. It is labelled as such in the app and in the README.

This is the largest simplification in this ADR. It deletes: a second `Db` implementation, a Cache-Storage media path, the COOP/COEP hosting requirement, a service-worker layer Expo does not provide, `dexie`, and the permanent obligation to hold two storage backends behaviourally identical. Every proposal admitted the two-backend burden as a top-three risk. We are not paying it.

The honest consequence, stated: **the three-day offline guarantee is a native-only guarantee.** That is precisely why `eas build` runs in CI from week 1 and TestFlight lands in month 1 (§10) rather than month 6.

### 4.2 What is on the tablet after every successful sync

- **SQLite (SQLCipher-encrypted):** `cards`, `card_media`, `sessions`, `events` (outbox), `sync_meta`. Note the absence of `schedule_state` — see §4.4.
- **Filesystem:** every media file referenced by the assigned patients' cards, at `${documentDirectory}media/<sha256>`, content-addressed. A row flips to `ready` only after the download completes **and** the hash verifies. A card is never shown unless all its media are `ready`.

Consequence: **the patient session issues zero network calls, online or offline.** Offline is not a mode; it is the normal operating condition, which is the only way to be confident it works on day three — it is what we test on day one.

### 4.3 Telemetry that is never lost (requirement 7)

```ts
Event = {
  event_id: uuid,          // client-generated UUIDv7, server primary key
  device_id: uuid,
  patient_id: uuid,
  session_id: uuid,
  boot_id: uuid,           // regenerated on cold start
  seq: integer,            // strictly increasing per device, never reused
  type: string,
  payload: jsonb,
  t_wall_ms: bigint,       // may be wrong
  t_mono_ms: integer,      // performance.now() delta — always right within a boot
  client_version: string
}
```

Four properties, all testable:

1. **Write-before-render.** The event row commits in the same SQLite transaction that advances the UI. A mid-tap crash loses nothing, and no state change can exist without its event.
2. **`event_id` is the server primary key.** Ingest is `insert … on conflict (event_id) do nothing`. At-least-once delivery plus server dedupe equals exactly-once effect; retries are free.
3. **Rows are deleted only on per-ID server ACK.** A partial batch failure loses nothing.
4. **`seq` gaps are detectable.** A researcher can distinguish "the patient did not respond" from "we lost the event."

**Clocks are not trusted.** Within-session latency is `t_mono_ms` deltas scoped to a `boot_id`. Cross-session ordering uses a server-anchored timestamp: each batch carries the device's wall clock at send time, the server records `server_received_at`, and the per-batch skew is applied to that batch's events. Researcher views expose only `server_anchored_at`. A tablet offline for three days *will* have drifted; this costs one column and one small function and getting it wrong silently corrupts the study.

**Volume:** ~250 bytes/event × ~500 events/session × 3 sessions/day × 3 days ≈ 1 MB. Three weeks ≈ 6 MB. Volume was never the problem; durability was. A bounded-growth alarm fires at 50 MB.

**Eviction policy:** media is deleted to make room; the outbox never is. Unlike the IndexedDB-based proposals, this rule is enforceable here, because the app owns its sandbox files and WebKit's storage manager has no jurisdiction over them.

### 4.4 Sync and conflicts — there is nothing to merge

One Edge Function, `POST /sync`, one round trip: push up to 500 events plus `last_cursor`; pull `cards_delta`, `media_manifest_delta`, `revocations`, `server_time`, `new_cursor`.

| Data | Writer | Conflict |
|---|---|---|
| Telemetry events | patient device only | none possible — append-only, immutable, UUID-keyed. ~90% of writes. |
| Card content, media, consent | caregiver, online only | none possible — single writer, server-authoritative, pull-only on the device |
| **Scheduler state** | **nobody** | **eliminated by design** |

The third row is adopted from `split-surfaces` and is the best single idea produced by the debate. Scheduler state is not stored and not synced. The device computes a local projection to pick the next card offline; the server **recomputes it canonically** from the ingested event log by importing the *same* `src/domain/scheduler.ts` module in a Deno Edge Function. The server derives rather than receives, so there is no write to conflict with. Two tablets running offline sessions for the same patient merge deterministically over the union of their event streams. Last-writer-wins never arises, and there is no second implementation of the scheduler to keep in step.

**Zero sync-engine dependencies.** That is a property of this data model, not a preference.

### 4.5 Hard expiry — the theft-versus-offline dial

Adopted from `vite-pwa-capacitor` and `split-surfaces`, because the `expo-universal` proposal had no answer for a stolen tablet that never reconnects and therefore never learns it was revoked.

Each content sync stamps `content_valid_until = last_successful_sync + hard_expiry_days`. **Default 7 days**, configurable per care home, hard minimum 4. Past it the patient surface refuses to render content and shows a single "Please reconnect this tablet" screen.

7, not 14. The requirement is three days; five times the requirement is an unforced two-week window in which a stolen tablet keeps rendering residents' faces. Seven gives a care home a comfortable margin over a long weekend outage and halves the exposure.

**The outbox is never discarded at hard expiry.** It survives indefinitely and flushes whenever the device eventually connects. Expiry stops rendering; it does not destroy research data.

---

## 5. Patient device authentication

This is the hardest security problem in the product. It is designed here in full because a hand-wave fails.

### 5.1 The two things we are not doing, and why

**Not Supabase anonymous sign-ins.** Anonymous users hold the `authenticated` Postgres role, so every policy forever must discriminate on `is_anonymous` via restrictive+permissive pairs; they accumulate rows with no automatic cleanup; Supabase's own docs flag them as an abuse target needing CAPTCHA. A patient device is not an anonymous user. It is a known, enrolled, revocable device. (The 30-req/hr/IP limit often cited against them is a dashboard field and is *not* a good reason — the structural reasons above are.)

**Not hand-minting JWTs with the project JWT secret.** This is where `expo-universal` and `split-surfaces` were both wrong and both conceded. The legacy shared secret is documented as no-longer-recommended and available only for backward compatibility; a shared secret in a malicious actor's hands can impersonate any user; and the `service_role` key is itself a JWT signed with that same secret, so an Edge Function able to mint device tokens is also able to mint god-mode tokens. It also collides with requirement 3: a cloud project created at the end may be on asymmetric signing keys, from which no shared secret can be extracted, so the Edge Function that worked locally fails at handoff.

**Not storing a rotating refresh token either.** This is where `vite-pwa-capacitor` and `nextjs-fullstack` were both wrong and `nextjs-fullstack` conceded. Supabase refresh tokens are single-use outside a 10-second reuse interval; outside it, reuse terminates the entire session and revokes all its refresh tokens. On care-home wifi, a rotation whose response is lost plus a backed-off retry is indistinguishable from theft, and the penalty is a permanently dead tablet in front of a resident with dementia, recoverable only by a caregiver walking over with a new enrolment code.

### 5.2 What we are doing: a real Supabase user whose password is the device secret

The device is a genuine Supabase auth user. Its long-lived credential is a 256-bit secret in the Keychain, used as that user's password. Every token acquisition is `signInWithPassword` — **idempotent, retryable forever, with no rotation state to lose.**

This takes the "no bespoke crypto, claims in `app_metadata`" property from `nextjs-fullstack`/`vite-pwa-capacitor` and the "durable device secret exchanged for a short-lived token" property from `expo-universal`/`split-surfaces`, and drops the failure mode each of them carried alone.

#### Schema

```sql
create table devices (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null references auth.users(id) on delete cascade,
  care_home_id     uuid not null references care_homes(id),
  mode             text not null check (mode in ('personal','shared')),
  label            text not null,
  hard_expiry_days int  not null default 7 check (hard_expiry_days >= 4),
  enrolled_at      timestamptz,
  last_seen_at     timestamptz,
  revoked_at       timestamptz
);

create table device_patients (
  device_id  uuid references devices(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  primary key (device_id, patient_id)
);

create table enrolment_codes (
  code_hash   text primary key,            -- sha256(code), never the code
  device_id   uuid not null references devices(id) on delete cascade,
  expires_at  timestamptz not null,        -- now() + interval '10 minutes'
  redeemed_at timestamptz,
  attempts    int not null default 0
);
```

#### Enrolment (once, by an authenticated human)

`POST /functions/v1/enrol-device` — caller is an authenticated caregiver or care-home admin; the function verifies the caller's own JWT and their membership of `care_home_id` before doing anything with `service_role`.

1. Insert `devices` + `device_patients` rows.
2. Create an auth user `device.<device_id>@devices.invalid` via the admin API with a 32-byte random password — **this is the `device_secret`** — and set
   `app_metadata = { role: 'device', device_id, care_home_id, mode }`.
   `app_metadata` is writable only by `service_role`; that property is what the whole scheme rests on and it is the one thing the RLS test suite must assert cannot be forged from a client.
3. Generate an 8-character code from a 32-symbol alphabet (40 bits), store only `sha256(code)`, TTL 10 minutes, single use.
4. Return **the code** to the caregiver's screen. The secret is never returned here.

`POST /functions/v1/redeem-enrolment` — caller is anonymous, from the tablet.

- `update enrolment_codes set redeemed_at = now() where code_hash = $1 and redeemed_at is null and expires_at > now() returning device_id` — the atomic update is what makes it genuinely single-use under concurrency.
- Rejects if `devices.revoked_at is not null`. Increments `attempts`; five failures burn the code.
- Returns `{ device_id, email, device_secret }` exactly once, and never again for any reason.

#### Storage on the tablet

```ts
await SecureStore.setItemAsync('device_credential', JSON.stringify({ email, device_secret }), {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
});
```

`WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` is the correct class and it was chosen by exactly one of the four advocates. `AfterFirstUnlock` (proposed by `nextjs-fullstack` and, in its `ThisDeviceOnly` form, by `split-surfaces`) keeps the item readable from the first post-boot unlock until power-off — and a care-home tablet on a charging trolley is never powered off, so that class protects almost nothing in this deployment. Plain `AfterFirstUnlock` is worse still: it migrates in an encrypted backup and can be restored onto hardware the admin never enrolled.

Two further consequences, both deliberate:

- The item cannot be written on a device with no passcode. `setItemAsync` throws, enrolment refuses, and the UI says *"This tablet must have a passcode before it can be enrolled."* **The MDM passcode requirement becomes enforced in code rather than written in a deployment protocol nobody reads.**
- Removing the passcode later destroys the item, and the device must be re-enrolled. Correct.

A second 256-bit value under the same class is the SQLCipher key.

**On web, `expo-secure-store` does not exist.** We do not paper over this. The browser build has **no enrolment path at all** — it authenticates as a caregiver or researcher, or it runs the patient surface against seeded fixture data in development. A browser cannot hold a device credential, so it is never issued one.

#### Session

```ts
createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
// on each sync, and only on each sync:
await client.auth.signInWithPassword({ email, password: device_secret });
```

Project JWT expiry is set to the shortest the project permits (target 15 minutes; if the project minimum is higher, use the minimum and record the actual number in `supabase/README.md`). No refresh token is stored, requested, or rotated. A failed sign-in — 429, timeout, captive portal, packet loss — is retried with backoff forever using the same stored secret, and cannot brick the device.

Sign-in traffic is trivial: ~10 tablets × a handful of syncs per day sits far below the per-IP `/auth/v1/token` budget even behind a single care-home NAT.

**Three days offline does not touch auth at all**, because the patient session never needs a token.

#### RLS

Policies key off the **device**, never the patient, and the JWT **never carries `patient_id`** (adopted from `split-surfaces`):

```sql
create policy device_reads_assigned_content on cards
for select to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'device'
  and patient_id in (
    select patient_id from device_patients
    where device_id = (auth.jwt() -> 'app_metadata' ->> 'device_id')::uuid
  )
);
```

On a shared tablet, tapping a face is a purely client-side selection that grants nothing server-side. There is no privilege boundary between residents on one tablet and pretending otherwise would be theatre; a care home needing a hard boundary between two residents gets two tablets.

Grants for the device role: `SELECT` on exactly two views — `device_content` and `device_roster` (`patient_id`, `display_first_name`, `avatar_path` only) — and `INSERT` on exactly two tables, `events` and `sessions`. **Zero `SELECT` on any base patient table, zero on telemetry, zero `UPDATE`, zero `DELETE`, anywhere, in any schema.** A stolen tablet cannot alter or destroy one row of research data, and cannot read anything through the API that is not already on it.

#### Revocation

An admin sets `devices.revoked_at` and bans the auth user. The next `signInWithPassword` fails; the app wipes the SQLite database, the media directory, and both Keychain items before rendering anything. Effective within one token lifetime **for an online device**; for an offline device, `hard_expiry_days` (§4.5) is the backstop and it is honest about being one.

### 5.3 Stolen tablet: what a thief actually gets

| Attack | Outcome |
|---|---|
| Use the app normally | Only the patients assigned to *that* tablet. Never cross-home, never cross-ward. |
| Reuse a captured access token | Dead within one token lifetime (target 15 min). |
| Re-authenticate with the stored secret | Fails the moment `revoked_at` is set — one row update. |
| Extract the secret from the Keychain | Requires a jailbreak or an unlocked passcode-protected device. `ThisDeviceOnly` means no backup carries it; `WhenPasscodeSet` means it does not exist on a passcode-less device. |
| Read the local database | SQLCipher-encrypted, key in the Keychain under the same class. |
| Read the local media files | **Residual, stated:** media files are not application-encrypted. They rely on iOS Data Protection over the app container, which is real because a passcode is guaranteed by the Keychain class above — but it is weaker than the database's protection. If the DPIA requires cryptographic separation for media, envelope-encrypt files with a Keychain-held key behind the existing `MediaStore` port. Budget 2 days. Do not claim it is done until it is. |
| Photograph the face grid | **Residual, stated:** first name and photo only. No surname, DOB, room number, diagnosis, or session history. A thief learns that N people live somewhere, not who, where, or with what condition. |
| Keep it offline forever | Renders until `content_valid_until` (default 7 days), then refuses. |

### 5.4 Caregivers and researchers

Supabase Auth, email magic link. **No social providers**, so App Store guideline 4.8 (Sign in with Apple) never fires. Role in `app_metadata` via the admin API, mirrored into the JWT.

Researchers never query base tables. They query `research.*` views exposing a stable pseudonymous `participant_code`, age band, and metrics — no names, no media, no free text. The pseudonym↔patient mapping lives in a schema with **no grant to the researcher role at all**. De-identification is a missing grant, not a `WHERE` clause somebody can forget.

---

## 6. The blind-agent contract

Requirement 9 — test-writers who cannot see the implementation, implementers who cannot see the tests — fails when the contract is prose and succeeds when it is executable artifacts both sides import.

### 6.1 `src/contract/` — frozen before either agent starts

```
src/contract/
  schema.ts        zod schemas for every entity and boundary payload.
                   Simultaneously the type source (z.infer), the runtime
                   validator, and the spec. Event, Card, Session,
                   SyncPushRequest, SyncPullResponse, EnrolmentRedeemResponse.
  ports.ts         interfaces only, zero implementation:
                   Db, MediaStore, Outbox, Clock, Rng, Net, Scheduler.
  testids.ts       a frozen const object of every interactive element's
                   testID. ~40 lines.
  policies.ts      the RLS expectation table, as DATA.
  fixtures/        canonical seeds + expected-output tables for pure functions.
  testing/         in-memory fakes for every port; exported conformance
                   suites describeDbPort(make), describeOutboxPort(make);
                   signInAsFixtureDevice(client, 'device-a').
```

**`testids.ts` is adopted from `vite-pwa-capacitor` and is the single highest-value item in this section.** The test-writer writes `getByTestId(ids.patient.answerEasy)`; the implementer writes `testID={ids.patient.answerEasy}`. Both import the same const, so selector drift is a TypeScript error on both sides simultaneously rather than a red test with a message neither agent can diagnose. It costs 40 lines. Expo adds a bonus the other stacks cannot have: `testID` on a React Native component renders as `data-testid` under react-native-web, so **one selector vocabulary spans Playwright-on-web and Maestro-on-iOS**.

**`policies.ts` is adopted from `split-surfaces`' rule "written from the policy spec, never from the policies."** `vite-pwa-capacitor` proposed freezing the migration SQL itself as the contract, which is circular on the security layer — a test derived from a policy asserts whatever that policy happens to do, so a policy reading `auth.uid()` where it should read the `device_id` claim produces a green test encoding the bug. Instead:

```ts
export const policyExpectations = [
  { role: 'device', table: 'cards',  verb: 'select',
    allowedWhen: 'patient_id is in device_patients for the token device_id',
    zeroRowsWhen: 'patient belongs to another device, ward, or care home' },
  { role: 'device', table: 'events', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: '*',      verb: 'update', allowedWhen: 'never', deniedWhen: 'always' },
  { role: 'researcher', table: 'patients', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  // …
] as const;
```

The RLS suite iterates this table. It is written from the spec, it is data, and it is readable by an agent that has never seen a line of SQL.

**`testing/signInAsFixtureDevice`** closes the last hole. `split-surfaces` correctly attacked `expo-universal` for claiming RLS tests were blind-writable while requiring a hand-signed JWT that only the implementer could construct. Because §5.2 uses ordinary Supabase auth, this helper is four lines of `signInWithPassword` against a seeded fixture device, lives in the contract package, and gives the blind test-writer a real device token without any implementation knowledge.

### 6.2 Process rules, enforced in CI

| Agent | May read | May write |
|---|---|---|
| Test-writer | `src/contract/**`, `supabase/seed.sql`, `supabase/migrations/**` schema DDL, the spec | `tests/**` only |
| Implementer | `src/contract/**`, the spec | `src/**`, `app/**`, `supabase/**` |

- CI rejects an implementer commit that touches `tests/**`, and a test-writer commit that touches `src/domain/**`, `src/adapters/**`, or `app/**`.
- Any change to `src/contract/**` requires a commit prefixed `contract:` and an explicit human review. Freezing is a process, not a wish.
- ESLint `no-restricted-imports`: `src/domain/**` may not import `react`, `react-native`, `expo-*`, or `@supabase/*`. This is why all the expensive thinking is portable and why agents spend most of their time in pure TypeScript, where they are strongest.
- ESLint restricts `app/(researcher)/**` to `.web.tsx`.
- `no-restricted-globals` inside `src/domain/**`: `Date`, `Math.random`, `crypto`, `fetch`, `window`, `document`. Six lines of config, adopted from `split-surfaces`, and it is what makes blind-written tests deterministic instead of flaky.

### 6.3 Test layers

| Layer | Tool | Proves | Target |
|---|---|---|---|
| Unit | `jest-expo` node project | scheduler fold, sync reducer, event serialisation, clock reconciliation. Zero mocks; everything injected. | 1–3 s |
| Contract | same runner + conformance suites | `sqlite.native` and `memory` satisfy identical `Db`/`Outbox` behaviour. This is what makes the in-memory fake trustworthy everywhere else. **Two implementations, not three — the IndexedDB backend is deleted.** | 2–5 s |
| Component | `@testing-library/react-native` | screens against fake ports, queried via `testids.ts` | 10–30 s |
| RLS / authz | Vitest-style specs against local Supabase (`supabase start`, real Docker Postgres, real migrations) | every row of `policies.ts`, positive and negative. Plus: `app_metadata` cannot be written from a client. **This is the suite the pilot is gated on.** | 30–90 s |
| E2E web | Playwright against `expo start --web` | all three surfaces headless, no simulator. **Includes the touch-target assertion `getBoundingClientRect().width >= 88` on every patient control** — adopted from `vite-pwa-capacitor`, because `@testing-library/react-native` runs on `react-test-renderer` with no Yoga layout pass and can never assert geometry. | 1–3 min |
| E2E native | Maestro, iOS simulator, patient surface only | camera and microphone permission dialogs, kiosk behaviour, real airplane-mode runs | with iOS |
| Physical device | written checklist, before pilot | one tablet, three days airplane mode, force-quits, storage pressure, Bluetooth speaker routing | manual |

**Honesty about Playwright's WebKit**, because one attacker made this point against all three web proposals and it lands on us too: Playwright's WebKit is not branded Safari and its codec set is not the iPad's. The patient project therefore proves interaction logic, layout geometry and offline *logic* — not media codec behaviour and not storage durability. Those are proved by the codec normalisation rule (§8), by Maestro, and by the physical-device checklist. That last row is real work and it is priced, not hidden.

**Speed target held in CI:** unit + contract + component under 60 s; the full local suite including warm Supabase and Playwright under 5 minutes.

---

## 7. Styling

**No NativeWind. No Tailwind. `StyleSheet.create` plus a plain tokens module.**

The `expo-universal` proposal listed NativeWind v5 — a preview major, mid-migration to Tailwind v4, pulling Reanimated in transitively — under its own third-biggest risk, and then shipped it anyway. It also documented a one-day fallback to `StyleSheet.create` plus a tokens object with zero dependencies. We take the fallback as the starting position. Two dependencies deleted, one preview-grade major avoided, and the patient surface is about eight bespoke components where a class-name DSL buys nothing.

```
src/ui/tokens.ts     one module, three exported token sets
src/ui/tokens.css    the same values as CSS custom properties, researcher surface only
```

- **Patient:** minimum 88pt touch targets (asserted in Playwright, not hoped for), 32–48pt type, 7:1 contrast, no navigation chrome, one action per screen, no gestures beyond tap, no transition under 300 ms, no user-facing theme control.
- **Caregiver:** ordinary density; breakpoints via `useWindowDimensions`, because **CSS media queries do not exist on native**.
- **Researcher:** `.web.tsx`, real `<table>`, real `<svg>`, Recharts, plain CSS — consuming the same token values so it looks like the same product.

There is no shared component library. A `<Button>` serving an 88pt patient target, a 44pt caregiver control and a 24pt table-row action is not a component; it is a props-driven configuration language with three incompatible users.

---

## 8. Media

**Capture (caregiver):** `expo-camera` for photos, `expo-audio` for voice. `expo-image-manipulator` downscales to 1600px longest edge before upload.

**The audio codec trap, caught by `nextjs-fullstack` and applicable to us.** A caregiver recording in Chrome gets `audio/webm;codecs=opus` by default, which Safari and WKWebView cannot play — the family's recording would be *silent* on the patient's iPad, with no way for a patient with dementia to report it. The rule, from week one:

- Native capture uses `expo-audio`'s high-quality preset, which produces AAC in `.m4a` on both platforms. Done.
- Web capture requests `audio/mp4`; if `MediaRecorder.isTypeSupported('audio/mp4')` is false, the record button is **disabled** with "please record in the app on your phone."
- The `sync` Edge Function rejects any audio object whose container is not `mp4`/`m4a`.
- A unit test runs fixture files captured from both browser families through the validator.

No `ffmpeg.wasm`, no server-side transcoding, no 25 MB dependency.

**Upload:** direct to a private Supabase Storage bucket at `patient/<id>/<sha256>`, RLS on `storage.objects`, TUS resumable above ~6 MB.

**Distribution:** the sync pull returns `{sha256, mime, bytes, signed_url}`. The device downloads to `${documentDirectory}media/<sha256>`, verifies the hash, then flips the row to `ready`. Content addressing means re-downloads never happen and two cards sharing a photo store it once.

**Playback:** `expo-image` from the local `file://` URI with `cachePolicy="memory-disk"`; `expo-audio` players constructed and preloaded for the *next* card while the current one is on screen. Zero network, zero decode stall, no gesture gate.

**Deletion:** requirement 8's erase path deletes the storage object, deletes the row, and issues a `revocations` entry so devices purge their local copy on next sync. Deleting only from Postgres would leave photographs of a person on a tablet in a care home; that would be the worst bug in this product and it gets its own integration test.

---

## 9. Repository layout

Single package. **No pnpm workspace, no Turborepo.** Expo plus a workspace means Metro symlink configuration and resolver friction for a boundary that ESLint and a CI diff check already enforce. Four packages would be ceremony, not enforcement.

```
dementia-anki/
├─ app/                             # expo-router: file tree == URL tree
│  ├─ _layout.tsx
│  ├─ (patient)/                    # RN primitives ONLY. ships to iOS.
│  │  ├─ enrol.tsx                  #   8-char code entry, once, ever
│  │  ├─ roster.tsx                 #   shared mode: face grid (first name + photo)
│  │  └─ session.tsx                #   the whole product, one screen
│  ├─ (caregiver)/                  # RN primitives. online-first. iOS later.
│  └─ (researcher)/                 # *.web.tsx ONLY. plain DOM + recharts.
├─ src/
│  ├─ contract/                     # FROZEN. §6. the only artifact both agents share.
│  │  ├─ schema.ts  ports.ts  testids.ts  policies.ts
│  │  ├─ fixtures/
│  │  └─ testing/
│  ├─ domain/                       # pure TS. no react/react-native/expo/supabase imports.
│  │  ├─ scheduler.ts               #   also imported by the server Edge Function
│  │  ├─ sync.ts  telemetry.ts  session.ts
│  ├─ adapters/
│  │  ├─ db.sqlite.ts  db.memory.ts
│  │  ├─ media.native.ts  media.web.ts
│  │  ├─ secure.native.ts           #   web has no counterpart, by design
│  │  ├─ supabase.ts  clock.ts  rng.ts
│  └─ ui/
│     ├─ tokens.ts  tokens.css
│     └─ patient/  caregiver/  researcher/
├─ supabase/
│  ├─ migrations/*.sql
│  ├─ functions/
│  │  ├─ enrol-device/  redeem-enrolment/  sync/
│  │  ├─ export-patient/  delete-patient/
│  ├─ tests/                        # pgTAP
│  └─ seed.sql                      # three families, two devices, one shared tablet
├─ tests/
│  ├─ unit/  contract/  component/  rls/  e2e/  maestro/
├─ app.json                         # config plugins, permission strings, useSQLCipher
├─ eas.json
└─ eslint.config.js                 # the four rules that hold the whole design up
```

### Scaffold — one command, then install

```bash
cd C:/Users/nicho/Documents/dementia-anki
npx create-expo-app@latest . --template default

npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-sqlite expo-file-system expo-crypto expo-network \
  expo-camera expo-audio expo-image expo-image-manipulator expo-secure-store
npm i @supabase/supabase-js@^2.112.3 zod@^4.4.3 @tanstack/react-query recharts
npm i -D jest jest-expo @testing-library/react-native @playwright/test \
  eslint eslint-config-expo prettier supabase typescript
npx supabase init && npx supabase start
```

Then, in order: freeze `src/contract/`; write `supabase/migrations/` and `seed.sql`; wire `useSQLCipher: true` into `app.json`; get `eas build --platform ios` green in CI **in week one, before any feature work**.

---

## 10. Sequencing and the two things that must start in week one

1. **`eas build --platform ios` in CI from week 1, TestFlight internal build in month 1.** Internal TestFlight testers do not require Beta App Review, so this is cheap and it front-loads the expensive unknowns — provisioning, privacy manifest, permission strings, IPA size, MDM/Guided Access provisioning in an actual care home. These are what kill pilots, and Expo's real value is moving their discovery from month 6 to week 1.
2. **The ethics review board.** App Store guideline 5.1.3(iv), verbatim: *"Apps conducting health-related human subject research must secure approval from an independent ethics review board. Proof of such approval must be provided upon request."* And 5.1.3(iii) mandates documented consent covering nature, purpose, duration, risks, confidentiality, a point of contact, and the withdrawal process. Requirement 7's heavy research telemetry plus a researcher cohort dashboard with export makes this health-related human subject research on any honest reading. **This is stack-independent, has a lead time measured in months, has no engineering workaround, and is a hard submission blocker on every option that was on the table.** It was found by `nextjs-fullstack` and missed by everyone else including the winning proposal; it is the most valuable single finding of the whole exercise. Start it in week one or discover it in week twenty.

Also settled before first submission: **distribution model.** For a clinical pilot with named care homes, use **Apple Business Manager Custom App** distribution, or **unlisted distribution** (full App Store review, direct link, not searchable — Apple names research studies as a good candidate). Verified trap: an ABM-private app cannot be flipped to unlisted; that requires a new app record. **Choose one before the first submission.**

Listing copy is a constraint, not a preference: a reminiscence and memory-practice tool for families. No treatment claim, no efficacy claim, no diagnostic output (guideline 1.4.1). In-app account deletion is required because the caregiver app creates accounts (5.1.1(v)) — already owed under requirement 8, so it is free. No social login, so 4.8 never fires.

---

## 11. Rejected options

Recorded in full so this is not relitigated.

### `nextjs-fullstack` — Next.js 16 App Router, PWA patient surface, Capacitor later

**Rejected: fatal, twice, unrebutted.** Next's static-export target is the build that becomes the iOS app, and it does not support Route Handlers that read the request; only `force-static` GET is supported, and `cookies()`, Server Actions, and `proxy.ts` are forbidden. The proposal's headline advantage — a typed, versioned HTTP contract as the blind test boundary, plus a server tier for enrolment, telemetry ingest, export and de-identification — is therefore **absent from the shipped app**. The native client must call either the remote Next server (destroying the "zero server dependency" property its own CI gate exists to prove) or Supabase Edge Functions (which is the exact "second language, second deploy pipeline" cost it used to argue against everyone else — and which is factually wrong anyway, since Edge Functions are TypeScript on Deno deployed by the same CLI the project already requires).

Secondary and independently disqualifying: it required the scheduler implemented twice, in TypeScript and in SQL, reconciled by a 10,000-case property test. That test is either self-consistent by construction or it breaks the blind boundary, and `split-surfaces` showed the correct answer is to delete the second implementation.

Also wrong: `kSecAttrAccessibleAfterFirstUnlock` for the device credential (migrates in encrypted backups, restorable to another device); and "IndexedDB in the app container is un-evictable and backed up," which inverts WebKit's actual policy.

**Kept from it:** the ethics-board finding (§10), the webm/opus codec trap (§8), and the "no Vercel-only primitives" instinct — irrelevant here since we have no Next server.

### `split-surfaces` — separate patient app and clinic app, shared pure-TS core

**Rejected: one fatal attack, conceded by its own advocate.** Its entire offline guarantee rested on *"inside Capacitor the store is app-container-local so WebKit eviction does not apply at all."* This is false. A WKWebView is a non-browser app under WebKit's storage policy: 15% origin / 20% overall quota against a browser's 60%/80%, best-effort by default, LRU-evicted under system pressure, with `navigator.storage.persist()` unreachable from inside a webview. Its 300 MB media cache **and its telemetry outbox** sat in the same evictable origin, so its application-level rule "media is evicted, the outbox never is" was unenforceable — WebKit evicts per-origin, not per-object-store. Requirement 7 was therefore unmet. The advocate conceded this in writing.

Also: `AfterFirstUnlockThisDeviceOnly` is the wrong Keychain class for a tablet that is never powered off; "Secure Enclave-protected" overstates what a generic-password keychain item gets; `hard_expiry_at` defaulted at 14 days is 4.6× the stated requirement; a `min_client_version` gate composed with a 14-day render refusal on an MDM single-app-mode tablet deadlocks with no on-site recovery path; and its `runOutboxStoreContract` executed against a clinic app that has no outbox is abstraction for symmetry.

**Kept from it — and these are the two best ideas produced by the entire debate:** scheduler state derived rather than synced, with the server recomputing from the event log using the same module (§4.4); and the invariant that the device JWT never carries `patient_id` (§5.2). Also its `no-restricted-globals` determinism rule (§6.2) and its "written from the policy spec, never from the policies" rule (§6.1).

### `vite-pwa-capacitor` — Vite + React SPA as a PWA, Capacitor for iOS

**Rejected: two fatal attacks.** (a) Its stated security mitigation — refresh-token rotation with reuse detection, storing *only* the refresh token — is an availability landmine on the exact network it must survive. Outside a 10-second reuse interval, Supabase treats reuse as compromise and terminates the whole session; a rotation whose response is lost to a care-home wifi dropout, followed by a backed-off retry, is indistinguishable from theft. The result is a permanently dead tablet in front of a resident, with no patient credential and no keyboard, recoverable only by a caregiver with a fresh enrolment code. (b) Its central App Store defence misreads 4.2.3(i), which is about depending on a companion app, not about network independence — so its confidence in the offline-from-container argument is derived from a clause that does not say that. Its own advocate then conceded the underlying point: *"my app is HTML in a WKWebView, which is literally the shape the guideline was written to catch."*

Serious and unrebutted on top: there is no official Capacitor microphone/audio-recording plugin, and the community alternative is Insiders-only sponsorware, so requirement 6's family audio capture falls back to `getUserMedia`/`MediaRecorder` in WKWebView — the mechanism the proposal itself ranks as its worst risk. `@capacitor/filesystem` accepts only base64 input, so every photo crosses the JS bridge with 33% inflation on the oldest device in the system, unpriced. Freezing the migration SQL as the test-writer's contract is circular on the security layer. And the concession that shared care-home tablets must wait for the native build means the "ship in a browser this week" pitch delivers only the surfaces that carry no risk.

**Kept from it — and these are excellent:** `testids.ts` as a frozen shared const (§6.1); `getBoundingClientRect().width >= 88` turning "huge targets" into a test rather than an intention (§6.3); the dead-man expiry dial (§4.5); and the correct native storage placement — durable data outside WebKit storage, media in the app container, never in `Caches` — which is the same conclusion this ADR reaches by a different route.

---

## 12. Open risks

1. **react-native-web is in maintenance mode.** If React 20 or an RN architecture change lands and RNW lags, the web pilot's clock starts. Mitigation: pin versions, keep `src/domain` renderer-free, keep the researcher surface on DOM, treat a stall as an accelerant for the native migration that was always the destination.
2. **The three-day offline guarantee is native-only and unproven until the physical-device run.** Neither Playwright nor the iOS simulator reproduces jetsam, real storage pressure, or `AVAudioSession` routing in a day room. Scheduled explicitly in §6.3, not treated as a formality.
3. **Media files rely on iOS Data Protection, not application encryption.** Weaker than the SQLCipher-protected database. Named in §5.3 with a 2-day remedy behind an existing port if the DPIA demands it.
4. **Ethics board approval has a months-long lead time and is a hard submission blocker.** §10. Not an engineering risk, and the largest schedule risk in the project.
5. **Guideline 2.1 "could not review."** A reviewer opens the app and hits an enrolment-code screen with no way past. Mitigation is procedural: a demo enrolment code, a synthetic resident, and a screen recording in the review notes.
6. **Agents are weaker at React Native than at DOM.** Mitigated by ports keeping them in pure TypeScript, by `expo export --platform ios` in CI, and by the researcher surface being plain DOM — but it will still produce subtly wrong RN components and reviews should expect it.
7. **The device-auth design is still the highest-consequence code in the repo**, even without bespoke crypto. The blind negative-authorisation suite over `policies.ts` and the near-zero grant surface are serious mitigations, but this needs an independent security review before it touches a real patient. That review is a gate on the pilot, not a nice-to-have.
8. **Supabase minimum JWT expiry may exceed 15 minutes.** If so, the stolen-tablet online exposure window is longer than stated. Verify in week 1 and record the real number.
