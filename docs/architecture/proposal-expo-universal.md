# Proposal: Expo Universal (React Native + react-native-web)

**Advocate position paper. Written to be cross-examined.**
Author: Expo advocate agent · Date: 2026-08-12 · Research verified against live sources on 2026-08-12.

---

## 0. One-line thesis

The patient app is a **kiosk-mode, offline-for-days, camera-and-microphone, media-heavy appliance that runs on a care-home iPad** — that is a native app wearing a browser costume for the first few months, and Expo lets us build the real thing now, run it in a browser today, and ship it to the App Store later without rewriting the product.

The corollary, which is the part most proposals get wrong: **only the patient surface should be universal.** The researcher dashboard should be plain DOM in `.web.tsx` files inside the same repo, and the caregiver surface should be online-only. One codebase, three renderers where it pays, zero renderers where it doesn't.

---

## 1. What I verified (and what I did not)

I checked these live rather than recalling them. Where I could not verify an exact number, I say so — an advocate who bluffs a version number loses the whole paper.

| Thing | Status as of 2026-08-12 | Confidence |
|---|---|---|
| **Expo SDK 57** | Released 2026-06-30. React Native 0.86, React 19.2. Expo's own changelog calls it "the easiest Expo SDK upgrade you've ever made" — RN 0.86 intended to have **no breaking changes** from 0.85. `expo@57.0.12` on npm. | **Verified** |
| Expo SDK 55 | Dropped Legacy Architecture. New Architecture is now the only supported option. SDK 54 was the last with Legacy. | **Verified** |
| **`expo-av` is REMOVED** | Removed in SDK 55. Replaced by `expo-audio` + `expo-video`. **The brief that assigned me this stack said "expo-camera/av" — that is out of date and I am correcting it.** | **Verified** |
| **react-native-web is in maintenance mode** | Nicolas Gallagher (creator) has pivoted to React Strict DOM; Zalando moved off it in 2025; Software Mansion's 2026 predictions say "no major features on the horizon." He will still review PRs and merge fixes and is open to adding maintainers from Expo / Software Mansion. **Repo is NOT archived**; Snyk classifies maintenance as "Sustainable" with releases in the last 12 months. | **Verified — and this is risk #1 below** |
| Expo web bundler | Metro (not Webpack) since SDK 50. First-class web out of the box. Expo Router does static rendering on web; streaming SSR alpha in SDK 55+; `generateMetadata` per-route SEO in SDK 56. (We need none of the SEO features — internal tool.) | **Verified** |
| **`expo-sqlite` web support is ALPHA** | Docs for SDK 57 state web support "is in alpha and may be unstable." Requires Metro configured for WASM **and** `Cross-Origin-Embedder-Policy` + `Cross-Origin-Opener-Policy` headers to enable `SharedArrayBuffer`. Exposes both sync and async APIs. `directory` param unsupported on web. | **Verified — risk #2 below** |
| `expo-secure-store` | SDK 57. iOS Keychain (`kSecClassGenericPassword`), Android Keystore-encrypted SharedPreferences. **No web support.** Historically rejects values over ~2048 bytes on iOS. | **Verified** |
| `@supabase/supabase-js` | `2.112.3`, published within the last day. Actively released. | **Verified** |
| Supabase anonymous sign-ins | Available, dashboard-toggled. JWT carries `is_anonymous: true`; anon users hold the `authenticated` Postgres role, so RLS must discriminate on the claim, and Supabase explicitly recommends **restrictive + permissive policy pairs**. Default 30 req/hr/IP. No automatic cleanup. Supabase warns they are an abuse target. | **Verified — and it is why I do NOT use them for patient devices, see §6** |
| Apple unlisted / Custom App distribution | Unlisted apps go through full App Store review, are not searchable, install via direct link — Apple names "research studies" as a good candidate. Custom Apps distribute privately via Apple Business Manager. Note: you cannot convert an ABM-private app to unlisted; you create a new app record. | **Verified** |
| PowerSync + Supabase | Real, documented, Supabase-partner-listed, non-invasive (no schema changes / no write perms needed on Postgres). Expo blog (Aug 2025) endorses PowerSync; **Expo has no official sync product of its own.** | **Verified** |
| NativeWind v5 | Preview/pre-release, aligns with Tailwind CSS v4, CSS-first config, fewer Metro/Babel steps. Docs updated Jan 2026. Migration from v4 "mostly compatible." | **Verified — it is a fresh major, see risk #3** |
| `react-native-web` exact version for SDK 57 | Could **not** verify the exact pin. SDK 54 shipped the 0.21.x line. **Never hand-pick it** — always `npx expo install react-native-web` so Expo's version resolver picks the pin it tested. | **Not verified — hedged** |
| `expo-router` major for SDK 57 | Could **not** verify (v6 shipped with SDK 54). Same rule: `npx expo install expo-router`. | **Not verified — hedged** |

**Standing rule for this project: every Expo-ecosystem package is installed with `npx expo install`, never `npm install`.** Expo maintains a compatibility matrix per SDK; bypassing it is the single most common way Expo projects break. `npx expo install --check` in CI fails the build on drift.

---

## 2. The stack

### 2.1 Runtime dependencies

Grouped by what they buy. If a package can't answer "what breaks without you," it isn't here.

**Core (7)**
| Package | Version | Why it earns its place |
|---|---|---|
| `expo` | `~57.0.x` | The SDK + Metro config + `expo install` version resolver + `expo prebuild`. This *is* the proposal. |
| `react` | `19.2.x` | Pinned by SDK 57. |
| `react-dom` | `19.2.x` | Web renderer. |
| `react-native` | `0.86.x` | Pinned by SDK 57. |
| `react-native-web` | SDK-pinned | Maps RN primitives to DOM. The load-bearing bet (risk #1). |
| `expo-router` | SDK-pinned | File-based routing that produces real URLs on web **and** native stack/tab navigation from the same files. Without it we hand-write two navigation systems and lose the universal claim. |
| `react-native-safe-area-context` + `react-native-screens` | SDK-pinned | Required peers of expo-router. Not optional, counted honestly (2 packages). |

**Offline & data (5)**
| Package | Why |
|---|---|
| `expo-sqlite` | Local relational store for cards, schedule state, media manifest, and the telemetry outbox. Native: stable, on-device, fast. Web: alpha (see §5.3 for the mitigation). |
| `expo-file-system` | Content-addressed media cache in the app sandbox. Gives us `file://` URIs → zero-latency playback with no network. |
| `expo-crypto` | SHA-256 for content addressing + UUID generation. Native crypto, no JS polyfill. |
| `expo-network` | Connectivity state so the sync loop knows when to drain the outbox. |
| `@supabase/supabase-js` | `^2.112.3` — Postgres/Auth/Storage/Realtime client. Requirement #3. |

**Media (5)**
| Package | Why |
|---|---|
| `expo-camera` | Photo capture on the caregiver's phone. Works on web via `getUserMedia`. Known web rough edges (camera-flip/`facing` has had bugs; permission checks in Firefox were patched) — caregiver web capture is a convenience path, phone-native is the real path. |
| `expo-audio` | Recording + playback. **Replaces `expo-av`, which no longer exists.** Preloaded players give instant patient playback. |
| `expo-video` | Only if the pilot uses video clips. **Drop it if not.** Listed so the count is honest. |
| `expo-image` | Disk + memory caching with `cachePolicy` and `recyclingKey`. The reason a patient's photo appears in <16 ms instead of flickering. |
| `expo-image-manipulator` | Downscale/re-encode on the caregiver device before upload. A 12 MP phone photo is 4 MB; a care-home tablet does not need 4 MB. Saves storage cost, bandwidth, and cache size — earns its place three times. |

**Auth & security (1)**
| Package | Why |
|---|---|
| `expo-secure-store` | iOS Keychain for the device secret (§6). No web support — web uses a deliberately weaker fallback that we document rather than pretend about. |

**UI & app-level (4)**
| Package | Why |
|---|---|
| `nativewind` + `tailwindcss` | One styling vocabulary across RN and DOM (2 packages). See §9, and see risk #3. |
| `@tanstack/react-query` | Caregiver + researcher surfaces only. Cache, retry, invalidation, request dedupe for online-first CRUD. Without it we hand-roll all four, badly. **The patient surface does not use it** — its data comes from SQLite. |
| `zod` | The contract layer. Runtime validation at every boundary *and* the single artifact a blind test-writer agent reads (§8). Load-bearing for requirement #9. |

**Researcher surface, web-only (1)**
| Package | Why |
|---|---|
| `recharts` (or `visx`) | Charts as real SVG in real DOM. Only bundled into the researcher route. Never compiled for native. |

**Runtime direct dependency count: 23** (22 if we drop `expo-video`).

### 2.2 Dev dependencies (9)

`typescript`, `jest`, `jest-expo`, `@testing-library/react-native`, `@playwright/test`, `eslint` + `eslint-config-expo`, `prettier`, `supabase` (CLI, local stack). Maestro is a binary, not an npm dep, and only arrives when iOS does.

### 2.3 What I am NOT installing, and why

- **PowerSync** — it is good, it is real, Expo endorses it, and it would solve §5 for me. I am not using it because our write model is 90% append-only telemetry, which has *no conflicts by construction*, and a hosted sync service is a second backend, a second vendor, a second bill, and a second thing to explain in a DPIA. See §5.5 for the exact trigger that would make me change my mind — I want it on record so this is a decision, not a blind spot.
- **Redux / Zustand / Jotai** — React state + React Query + SQLite is the whole state story. The patient app has one screen.
- **Reanimated / Gesture Handler** — not until a specific interaction needs them. (NativeWind v5 uses Reanimated for transitions; if we adopt v5 it arrives transitively and I'll count it then.)
- **date-fns / luxon** — `Intl.DateTimeFormat` and epoch milliseconds. Telemetry stores integers.
- **A component library** — three UIs this different share tokens, not components.
- **`react-native-url-polyfill`** — was required by older supabase-js on RN; verify against 2.112 before adding. Do not cargo-cult it.

---

## 3. Repo shape

```
app/                        # expo-router. URL structure == file structure.
  (patient)/                # universal. RN primitives ONLY. ships to iOS.
  (caregiver)/              # universal. RN primitives. ships to iOS later.
  (researcher)/             # .web.tsx ONLY. plain DOM. never compiled for native.
src/
  contracts/                # zod schemas + port interfaces + conformance suites.
                            #   the ONLY thing the blind test-writer agent reads.
  domain/                   # pure TS. scheduling, sync reducer, event model.
                            #   zero imports from react, react-native, or expo.
  adapters/                 # ports implemented: sqlite.native.ts / sqlite.web.ts,
                            #   media.native.ts / media.web.ts, supabase.ts, clock.ts
  ui/                       # tokens + the three primitive sets
supabase/
  migrations/               # real SQL migrations, run locally, deployed unchanged
  functions/                # edge functions: device-token, sync, export, erase
tests/
  unit/ contract/ integration/ e2e/
```

**The rule that makes this work:** `src/domain/**` may not import from `react`, `react-native`, `expo-*`, or `@supabase/*`. It is enforced by an ESLint `no-restricted-imports` rule and it is the reason none of the expensive thinking in this product is hostage to the view layer.

---

## 4. The path to a real iOS app

### 4.1 What actually happens

```
npx expo prebuild --platform ios     # generates the ios/ project from app.json
eas build --platform ios             # cloud build, signs, produces .ipa
eas submit --platform ios            # uploads to App Store Connect
```

That is the entire mechanical path. No architecture change, no port, no second repo. The patient app that ran at `localhost:8081` in month 1 is the app in TestFlight in month 6.

### 4.2 What breaks, concretely

I have listed these as *hard rules from day one*, because each one is cheap to obey up front and expensive to retrofit.

| # | What breaks | Rule from day one | Retrofit cost if ignored |
|---|---|---|---|
| 1 | **Blob/File vs `file://`** — web gives you `File`/`Blob`, native gives you a URI string. | All media flows through one `MediaStore` port. UI never touches a Blob. | 3–5 days of chasing type errors through every screen. |
| 2 | **Supabase session storage** — web uses `localStorage` (absent on native). | Pass a `storage` adapter to `createClient` (SecureStore on native, localStorage on web), set `detectSessionInUrl: false` on native, and wire `AppState` to `startAutoRefresh`/`stopAutoRefresh`. ~20 lines, written in week 1. | Sessions silently fail to refresh on iOS. Debugged in week 20. |
| 3 | **SecureStore has no web build.** | Web fallback is explicit, named `insecureWebStorage`, and documented as such. Care-home web pilot devices do not hold long-lived secrets. | You ship a false sense of security. |
| 4 | **`expo-sqlite` web is alpha + needs COOP/COEP.** | Everything behind a `Db` port; web ships an IndexedDB implementation of the same port. | Your entire offline story is unimplemented on the only platform you've shipped. |
| 5 | **CSS-isms leak in via NativeWind** — `position: fixed`, `:hover`, `box-shadow`, CSS grid, `filter`, cascading text styles. | CI runs `expo export --platform ios` from week 1. It catches these in minutes. | Silent web-only styling that has to be redesigned for native. |
| 6 | **The researcher DOM code.** | It is *supposed* to break on native — it is `.web.tsx` and Metro will never resolve it for iOS. That is the design, not a bug. | n/a |
| 7 | Permissions strings, icons, splash, privacy manifest. | `app.json` config plugins from week 1. | 2 days at the worst possible moment. |

### 4.3 Will Apple accept it?

React Native apps are ordinary native apps. Guideline 4.2 ("minimum functionality" / web-view wrappers) does not apply — we compile to native views and use the camera, microphone, and filesystem. Specific risks, ranked:

1. **Medical claims (Guideline 1.4.1 / 5.1.3).** The App Store listing must describe a **reminiscence and memory-practice tool for families**, not a treatment. No efficacy claims, no "slows cognitive decline," no diagnostic output. This is a copywriting constraint, not an engineering one, but it is the most likely rejection cause for this product and it needs to be in the spec.
2. **Account deletion (5.1.1(v)).** Any app offering account creation must offer in-app account deletion. The caregiver app creates accounts → it must have a delete path. We already owe this under requirement #8, so it costs nothing extra.
3. **Privacy manifests / required-reason APIs (ITMS-91053).** Expo modules ship their own `PrivacyInfo.xcprivacy` and Expo aggregates them, but we must still declare our own data collection and the nutrition labels. Half a day.
4. **Sign in with Apple (4.8).** Only triggered if we add third-party social login. **Recommendation: don't.** Email magic-link for caregivers, no social providers → guideline never fires.

**Distribution — this is the part worth getting right.** For a pilot with named care homes, the correct answer is almost certainly **unlisted distribution**: full App Store review, real App Store install, not searchable, direct link only. Apple explicitly names *research studies* as a good candidate. Alternative for care-home organisations already using MDM: **Custom App via Apple Business Manager**. Note the trap I verified: you cannot flip an ABM-private app to unlisted — that requires a new app record. **Pick one before the first submission.**

**Cost to go native:** Apple Developer Program $99/yr, EAS Build (free tier viable for a pilot, ~$19–99/mo if the queue matters), and roughly **1–2 focused weeks** of work: config plugins, assets, permission strings, privacy manifest, first TestFlight, first review cycle. Add a week of buffer for the first rejection — there is usually one.

Also note the direction of travel: going native **simplifies** this product. `expo-sqlite` goes alpha→stable. `SecureStore` goes fallback→Keychain. Background media prefetch goes best-effort→real. Kiosk mode goes impossible→Guided Access / MDM single-app mode. Every hard part of §5 and §6 gets *easier* on iOS.

---

## 5. Offline: the care-home tablet with no wifi for three days

### 5.1 The scoping decision that carries the whole design

**Only the patient surface is offline-capable.** The caregiver surface is online-first (a phone or laptop with wifi, uploading photos — offline photo upload queueing is a nice-to-have we explicitly cut). The researcher surface is read-only and online-only.

This single cut removes: offline conflict resolution on user-authored content, an offline upload queue for large binaries, offline auth for two roles, and merge UI. It is the biggest LESS-IS-MORE win available in this product and I want it argued for explicitly rather than smuggled in.

### 5.2 What is on the tablet before the wifi dies

At the end of every successful sync the device holds:

- **SQLite:** `cards`, `card_media`, `schedule_state`, `sessions`, `events` (outbox), `sync_meta`.
- **Filesystem:** every media file referenced by the assigned patients' cards, stored at `${documentDirectory}media/${sha256}`, content-addressed. The manifest row is only marked `ready` after the download completes *and* the hash verifies. A card is only shown to the patient if all its media are `ready`.

Consequence: **the patient's session never touches the network.** Not degraded-when-offline — it doesn't use the network when online either. Offline is not a mode; it is the normal operating condition. That is the only way to be sure it works on day three, because it is what we test on day one.

### 5.3 The web caveat, stated plainly

`expo-sqlite` on web is officially alpha and needs COOP/COEP headers for `SharedArrayBuffer`, which is intrusive hosting configuration. So for the browser pilot the `Db` port is implemented over **IndexedDB** (idb-keyval-style, ~2 KB, or hand-rolled over the raw API — I'd hand-roll it to avoid the dependency) with the media cache in the **Cache Storage API**.

Two implementations of one port, both verified by the same conformance suite (§8). This is honest about the cost: the offline store on the platform we ship *first* is not the one we ship *last*. It is also the sharpest argument in this document for not deferring iOS — the true 3-day-offline guarantee is a native-only guarantee, and pretending otherwise on a web-only pilot is how you find out in a care home instead of in CI.

### 5.4 Telemetry that is never lost (requirement #7)

The event model:

```ts
Event = {
  event_id:      uuid,      // client-generated, UUIDv7 (time-ordered)
  device_id:     uuid,
  patient_id:    uuid,
  session_id:    uuid,
  seq:           integer,   // strictly increasing per device, never reused
  type:          string,
  payload:       jsonb,
  t_wall_ms:     bigint,    // Date.now() at capture
  t_mono_ms:     integer,   // performance.now() delta from session start
  clock_offset_ms: integer  // (server_time - device_time) measured at last sync
}
```

Four properties that make loss impossible short of a wiped device:

1. **Write-before-render.** The event row is committed to SQLite in the same transaction that advances the UI. If the tablet dies mid-tap, the event survives.
2. **`event_id` is the primary key server-side.** Upload is `insert ... on conflict (event_id) do nothing`. At-least-once delivery + server dedupe = exactly-once effect. Retries are free and safe.
3. **Rows are deleted only on server ACK** of their specific `event_id`s. A partial batch failure loses nothing.
4. **`seq` gaps are detectable.** The server can prove whether it has a complete stream per device, which matters for research integrity — a researcher can distinguish "the patient didn't respond" from "we lost the event."

**Latency data specifically:** `performance.now()` is monotonic and unaffected by clock drift, so within-session timings (stimulus→response) are exact even if the tablet's clock is wrong. Wall clock plus the measured `clock_offset_ms` reconciles sessions against each other after sync. This matters: a care-home tablet offline for three days *will* have drifted.

**Volume sanity check:** ~200 bytes/event × ~500 events/session × 3 sessions/day × 3 days ≈ **900 KB**. SQLite does not care. Three *weeks* offline is ~6 MB. The outbox is not a scaling problem; a bounded-growth alarm at 50 MB is enough defensive engineering.

### 5.5 Sync and conflicts

One Edge Function, `POST /sync`, one round trip:

```
push: { device_id, events[<=500], last_server_cursor }
pull: { cards_delta, media_manifest_delta, revocations, server_time, new_cursor }
```

Conflict handling, by data class:

| Data | Written by | Conflict strategy |
|---|---|---|
| Telemetry events | Patient device only | **None possible.** Append-only, immutable, globally unique IDs. This is 90%+ of all writes. |
| Card content (photos, prompts) | Caregiver, online only | **None possible.** Single writer, server-authoritative, pulled to device. |
| Schedule state | Both | **Server recomputes from the event log.** The device's local schedule is a *cache of a pure function* of events. Push events, server replays, device pulls the answer. Nothing to merge. |
| Consent records | Caregiver, online only | Append-only, versioned. Never updated in place. |

The scheduling design is what makes this trivial: because the next-review state is *derived* rather than *stored-and-edited*, there is no mutable shared state to conflict over. If two devices somehow ran sessions for the same patient concurrently, the server's replay of the merged event stream is still deterministic and correct.

**The trigger to adopt PowerSync:** if a future requirement introduces genuinely bidirectional mutable state — e.g. care staff editing card content *offline* on the tablet — my hand-rolled sync stops being sufficient and PowerSync (Supabase-partnered, non-invasive, no schema changes) becomes the right call, at roughly a week of integration. I am recording the trigger so this is a decision with a review condition, not an omission.

---

## 6. Auth: three roles, and the hard part

### 6.1 Caregiver and researcher (easy, stated for completeness)

Supabase Auth, email magic-link (no passwords to forget, no social providers, so App Store guideline 4.8 never fires). Role in a `profiles` table + a custom access-token hook putting `role` in the JWT. RLS keys off `auth.uid()`.

Researchers **never** query base tables. They query `research.*` views that expose a stable pseudonymous `participant_code` and contain no names, no photos, no free text, no dates finer than the study requires. The de-identification is a database boundary, not an application filter — an application filter is one forgotten `select *` away from a breach.

### 6.2 Patient devices: no password, and a stolen tablet

This is the load-bearing security question, so here is the mechanism in full.

**What I explicitly reject: Supabase anonymous sign-ins.** I verified their semantics, and they are the wrong tool here: anonymous users hold the `authenticated` role (so every policy in the system must remember to check `is_anonymous`, using restrictive+permissive pairs, forever), they are rate-limited per IP at 30/hr by default (a care home behind one NAT is exactly that shape), they accumulate rows with no automatic cleanup, and Supabase's own docs flag them as an abuse target requiring CAPTCHA. A patient device is not an anonymous user. It is a **known, enrolled, revocable device**.

**Device enrolment (once, by an authenticated human):**

1. Caregiver or care-home admin, logged in, opens *Enrol device* and picks the mode (personal / shared) and the assigned patient(s).
2. Server (Edge Function) generates a 256-bit `device_secret`, stores only `hash(device_secret)` in `devices`, and returns a short-lived enrolment code (QR / 8 digits, 10-minute TTL, single use).
3. The tablet redeems the code once and receives the `device_secret`.
4. The tablet stores it in **`expo-secure-store` → iOS Keychain** with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — not backed up, not synced to iCloud, not restorable to a different device.

**Session tokens:**

The device exchanges `device_secret` for a **15-minute JWT** at `POST /device-token`. The Edge Function verifies the hash, checks the revocation flag, and signs a token with the project JWT secret carrying `role: authenticated`, `sub: device:<uuid>`, `device_id`, and `mode`. The device refreshes on wake and on each sync.

**RLS then reads the device, not the patient:**

```sql
-- illustrative
create policy device_reads_assigned_patients on cards
for select to authenticated
using (
  patient_id in (
    select patient_id from device_patients
    where device_id = (auth.jwt() ->> 'device_id')::uuid
  )
);
```

A device can only ever see rows for patients explicitly assigned to it. There is no query it can construct that reaches another care home, or another wing, or a patient who was unassigned yesterday.

**Now: the tablet is stolen. What does the thief get?**

| Attack | Outcome |
|---|---|
| Use the app normally | Sees only the patients assigned to *that* tablet. No cross-tenant exposure, ever. |
| Wait and reuse the JWT | Dead in ≤15 minutes. |
| Refresh with the stored secret | Admin sets `revoked_at` on the device; the next `/device-token` call fails. **Revocation is one row update and is effective within one token lifetime.** This is why the token is short and the secret is not itself a bearer token to Postgres. |
| Extract the secret from the Keychain | Requires a jailbreak or an unlocked device. `THIS_DEVICE_ONLY` means a backup doesn't carry it. |
| Read the local SQLite / media files directly | **The honest weak point.** `expo-sqlite` does not encrypt at rest. iOS file Data Protection encrypts the app sandbox — but its strength depends on a device passcode being set. **Therefore: care-home tablets must be MDM-supervised with an enforced passcode, and that is a deployment requirement written into the pilot protocol, not an app setting.** If the DPIA demands cryptographic separation regardless of passcode, swap `expo-sqlite` for `op-sqlite` with SQLCipher — both are thin wrappers behind the same `Db` port, so the swap is ~1 day, and media files get envelope-encrypted with a Keychain-held key. I would not pay that cost by default; I would pay it the moment an ethics board asks. |
| Steal the shared-tablet **face grid** | Real residual exposure and I won't hide it: the resident picker shows faces. Mitigation is minimisation — **first name + photo only**. No surname, no DOB, no room number, no diagnosis, no session history on the picker. A thief learns that N people live somewhere; they do not learn who, where, or what condition. |

**Both modes, one mechanism.** Personal device = one row in `device_patients`, app boots straight into the session. Shared tablet = N rows, app boots into the face grid. Zero patient-facing credentials in both cases; the security lives in enrolment, scoping, expiry, and revocation. And on iOS, **Guided Access / MDM single-app mode** makes the kiosk real — a browser tab cannot do that.

---

## 7. Media

**Capture (caregiver):** `expo-camera` for photos, `expo-audio` for voice recordings. `expo-image-manipulator` downscales to ~1600 px longest edge and re-encodes before upload. Audio recorded to compressed AAC.

**Upload:** direct to Supabase Storage into a **private** bucket, path-scoped `patient/<id>/<sha256>`, with RLS on `storage.objects`. Files above ~6 MB use Supabase's TUS resumable endpoint. Server computes/verifies the hash and writes the `card_media` row.

**Distribution to the patient device:** the sync pull returns a manifest of `{sha256, mime, bytes, signed_url}` with short-lived signed URLs. The device downloads to `${documentDirectory}media/${sha256}`, verifies the hash, then flips the row to `ready`. Content addressing means re-downloads never happen and two cards sharing a photo store it once.

**Playback (patient):** images render through `expo-image` from the local `file://` URI with `cachePolicy="memory-disk"`; audio players are constructed and preloaded for the *next* card while the current one is on screen. **Zero network, zero decode stall, sub-frame perceived latency.** On web the same port resolves to Cache Storage + object URLs.

**Deletion:** requirement #8's erase path deletes the storage object, the row, and issues a `revocations` entry so devices purge their local copy on next sync. Deleting from Postgres alone would leave photographs of a person on a tablet in a care home. That would be the worst bug in this product, so it gets its own integration test.

---

## 8. Tests: a stable contract for blind agents (requirement #9)

This requirement is unusual and it should drive the architecture, not be bolted onto it. The design has one central idea: **the contract is executable, and it is the only artifact both blind agents share.**

### 8.1 `src/contracts/` — what the test-writer agent reads

Three things, and nothing else:

1. **Zod schemas** for every entity and every boundary payload (`Event`, `Card`, `SyncPushRequest`, `SyncPullResponse`, `DeviceTokenResponse`, …). These are simultaneously the type source (`z.infer`), the runtime validator, and the spec.
2. **Port interfaces** — `Db`, `MediaStore`, `Clock`, `Net`, `Telemetry`, `Scheduler`. Pure TypeScript, fully documented, zero implementation.
3. **Conformance suites** — exported functions like `describeDbPort(makeDb: () => Db)` that a test file can invoke against *any* implementation.

The test-writer agent writes tests against these. The implementer agent writes code that satisfies these. Neither reads the other's output. The contract file is frozen before either starts and changing it is a deliberate, reviewed event.

This works far better than "write tests against the UI" because the interesting logic — scheduling, sync, event ordering, revocation — is behind ports, and ports are the thing you *can* specify without seeing an implementation.

### 8.2 The five layers

| Layer | Tooling | What it proves | Speed |
|---|---|---|---|
| **Unit (pure)** | `jest-expo` with a `node` project in the `projects` config | Scheduling, sync reducer, event serialisation, clock reconciliation. Pure functions of `src/domain/**`. Zero mocks — everything is injected. | ~1–3 s |
| **Contract** | Same runner, conformance suites | Every port implementation (`sqlite.native`, `sqlite.web`, `memory`) satisfies identical behaviour. **This is what lets the in-memory fake be trusted in every other layer.** | ~2–5 s |
| **Component** | `jest-expo` + `@testing-library/react-native` | Patient/caregiver screens against fake ports. Queried by `testID` and accessibility role. | ~10–30 s |
| **Integration** | Local Supabase (`supabase start`, real Docker Postgres, real migrations) | **RLS is the security design, so RLS gets tests.** Explicitly: "a device token scoped to patient A returns zero rows for patient B", "a revoked device cannot mint a token", "a researcher role cannot read `patients`", "an anonymous request reads nothing." A blind agent can write every one of those from §6 alone. | ~30–90 s |
| **E2E** | **Playwright** against `expo start --web` (all three surfaces) | Full journeys, headless, in CI, no simulator. | ~1–3 min |
| **E2E native** | **Maestro** on iOS simulator, patient app only, arrives with iOS | Camera permission dialogs, kiosk behaviour, airplane-mode offline runs — the things Playwright provably cannot do. | later |

### 8.3 The Expo-specific advantage worth naming

**`testID` on a React Native component renders as `data-testid` in react-native-web.** So a single selector strategy — and in many cases a single test intent — spans Playwright-on-web and Maestro-on-iOS. Test-writer agents author selectors once. On a split stack (Vite web now, RN later) that is two selector vocabularies and two test suites written by two sets of agents.

### 8.4 Determinism

`Clock` and `Rng` are ports, always injected, never imported. Tests run at a frozen timestamp with a seeded RNG. Network is either a fake `Net` port (unit/component) or a real local Supabase (integration). There is no flake surface from timers or randomness — which matters enormously when the tests were written by an agent who cannot debug against the implementation.

**Headless speed target:** unit + contract + component under 60 s; the full local suite including a warm Supabase and Playwright under 5 minutes. That is the number to hold CI to.

---

## 9. Styling three radically different UIs

**One vocabulary, three token sets, one escape hatch.**

- **NativeWind v5** (Tailwind v4 aligned, CSS-first config) gives identical class syntax on native and web. Design tokens live in one CSS/theme file.
- **Patient:** minimum 88 pt touch targets, 32–48 pt type, AAA contrast, no navigation chrome at all, one action per screen, no gestures beyond tap. Full-bleed layouts, no scroll where avoidable.
- **Caregiver:** ordinary density, responsive phone→desktop via `useWindowDimensions` breakpoints (note: **CSS media queries do not exist on native**; breakpoints must be a JS hook to stay universal).
- **Researcher:** `.web.tsx`, plain `<div>`/`<table>`/`<svg>`, real Tailwind, Recharts, real DOM semantics — but consuming *the same design tokens*, so it looks like the same product.

**Honest limitations of RNW styling** — these are real and I'd rather name them than be shown them:
no cascade or inheritance across component boundaries (text styles don't flow down through `<Text>`); no `:hover`/`:focus-visible` on native (state must be JS); no CSS Grid on native (flexbox only, and `flexDirection` defaults to `column`, not `row`); shadows are three different systems (iOS `shadow*`, Android `elevation`, web `box-shadow`); `overflow: visible` clips on Android; `position: fixed`/`sticky` are web-only. Each is a papercut. Collectively they are the reason the researcher dashboard should not be built this way — which is exactly why it isn't.

---

## 10. Bundle size and dependency weight — no spin

**Install weight.** An Expo app's `node_modules` is heavy: realistically **~1,100–1,500 packages, 700 MB–1.2 GB on disk**, versus roughly 250–400 packages for Vite + React. This is a genuine cost — slower cold CI installs, a larger supply-chain surface, more Dependabot noise. It is **install-time weight, not shipped weight**, and it is the price of a framework that also produces an iOS binary. I'd rather state the number than let it be discovered.

**Shipped web bundle.** These are **estimates I have not measured** and I flag them as such:

| Surface | Estimated gzipped JS |
|---|---|
| Baseline (React + RNW + expo-router, before app code) | ~300–450 KB |
| Patient app | ~500–700 KB |
| Caregiver app | ~700–900 KB |
| Researcher app (charts, tables) | ~1.0–1.3 MB |

For comparison, React + react-dom alone is ~60 KB gzipped. **react-native-web costs us roughly 5–7× the framework baseline.** On a public marketing site that would be disqualifying. On an internal, SEO-free, repeatedly-visited tool behind a login it is a first-load cost on a warm cache, and on iOS it is zero because the JS ships inside the binary.

**Verify in week 1, don't argue about it:**
```
npx expo export --platform web && npx source-map-explorer 'dist/_expo/static/js/web/*.js'
```
and put a hard CI budget gate on the patient bundle. If the real number is materially worse than the table above, that is evidence against this proposal and should be treated as such.

**Native IPA:** expect **~25–45 MB** download for an Expo app of this shape.

---

## 11. The YAGNI objection (the strongest attack on this proposal)

**The attack:** *"You are paying the react-native-web tax — bundle size, styling friction, a worse dashboard, 1,400 node_modules — today, for an iOS app that might never happen. Build plain Vite + React now. If iOS becomes real, rewrite then. That is what LESS IS MORE means."*

It is a good attack. Five answers, in order of force.

**1. YAGNI applies to speculative requirements. iOS is a stated one.**
Requirement #1 says iOS is "a stated destination, not a maybe." Requirement #4 says the patient tablet must work in a care home with flaky or no wifi. Requirement #5 says a shared tablet with no patient login. Requirement #7 says telemetry must never be lost. Those four together *describe a native app*. Applying YAGNI to a requirement the principal has already stated isn't discipline — it's overruling the principal's roadmap and calling it minimalism.

**2. A PWA does not clear this bar, and that's the real fork in the road.**
The "web now, maybe web forever" path implicitly bets on a PWA for the care-home tablet. On iOS that bet loses: no MDM app distribution and no single-app kiosk mode for a web page; no reliable background sync; storage subject to eviction pressure for non-installed origins; no Keychain; media autoplay constrained by gesture requirements. **A tablet offline for three days is precisely the scenario where a PWA fails, and it fails in a care home rather than in CI.** If you accept that the patient device eventually must be a native app, you are choosing *when* to pay, not *whether*.

**3. Price the rewrite honestly — because it isn't total, and it isn't small.**
Portable to any React stack: `src/domain/**`, `src/contracts/**`, all SQL, all Edge Functions, all RLS, all unit and contract tests. That's most of the *hard thinking*, and it is portable **because of §3's import rule, not because of Expo** — I won't claim credit Expo doesn't earn.
Not portable: the patient UI (~2–3 weeks), media capture/playback (~1 week), offline storage IndexedDB→SQLite (~1–2 weeks), permissions + native build + CI + store setup (~1 week), plus a full second QA cycle on a *clinical* app. **Call it 5–8 weeks of duplicated build**, plus permanent dual maintenance — because the caregiver and researcher surfaces will stay on the web forever, so "rewrite later" is really "run two frontends forever."

**4. The asymmetry of when you learn.**
Web-first means you discover native constraints in month 6: App Store review of a health-adjacent app, MDM/kiosk provisioning in a care home, background upload behaviour, camera/mic permission flows, Keychain semantics, IPA size. **Those are exactly the things that kill pilots**, and they are the things Expo forces you to confront in week 1 for near-zero marginal cost (`eas build` in CI from day one). Expo's real value here is not code reuse. It is *moving discovery of the expensive unknowns to the cheapest possible moment.*

**5. I have already conceded the strongest part of the attack.**
The genuine sting in YAGNI-vs-universal is the data-dense dashboard: react-native-web is bad at tables, charts, keyboard navigation, text selection, and virtualised grids. **So I am not building it in react-native-web.** The researcher surface is plain DOM in `.web.tsx`, using Recharts and real `<table>` elements, in the same repo, sharing the same tokens, contracts, and types. If the entire researcher surface ends up as DOM, we lose nothing — it was never going to iOS. The universal machinery is applied to the one surface where the destination is genuinely iOS, and withheld everywhere else.

**Falsifiable commitment.** If, at the end of week 2, (a) the measured patient web bundle exceeds ~800 KB gzipped, or (b) `expo-sqlite`/IndexedDB port parity has consumed more than 3 days, or (c) `eas build --platform ios` has not produced an installable TestFlight build — then this proposal has failed its own test and should be reconsidered. I'd rather be checked against numbers than defended by rhetoric.

---

## 12. The three biggest risks of this proposal

Stated as I'd want an opposing advocate to state them.

### Risk 1 — I am betting the web half of the product on a library in maintenance mode

**react-native-web is in maintenance mode.** Its creator has moved to React Strict DOM. Zalando migrated off it in 2025. Software Mansion's 2026 outlook says "no major features on the horizon." This is verified, not speculation.

**Why I still take the bet:** it is not archived; fixes are still merged; Snyk rates maintenance "Sustainable"; Expo's entire web story depends on it, which gives the best-funded party in the ecosystem a direct incentive and the maintainer has explicitly invited Expo and Software Mansion to co-maintain. A mature, feature-complete, unchanging library that we version-pin for an internal tool is a *tolerable* dependency in a way it would not be for a public consumer product.

**Why it could still hurt:** React 20 or a future RN architecture change lands and RNW lags. Then the web pilot's clock starts ticking. **Mitigation:** pin versions; keep the researcher surface on DOM (already immune); keep `src/domain` renderer-free (already portable); and treat "RNW stalls" as an accelerant for the native migration that was the destination anyway. If React Strict DOM matures into the successor, our RN-primitive components are the closest possible starting point — closer than a Vite app would be.

### Risk 2 — the offline store I am selling is alpha on the platform we ship first

`expo-sqlite` web support is officially **alpha**, needs WASM Metro config, and needs COOP/COEP cross-origin isolation headers — which are intrusive to host and can break embedding. So the browser pilot runs an IndexedDB implementation of the `Db` port, not SQLite.

**The honest consequence:** two storage implementations to keep behaviourally identical (the conformance suite is the defence, and it is a real defence — but it is work), and the *full* 3-day-offline guarantee is only truly proven once the native build exists. There is a scenario where the web pilot goes well, iOS slips, and we have shipped a weaker offline story than the one in this document.

**Mitigation:** conformance suite from day one; native build in CI from week 1; and if the pilot demands hardened offline before iOS is ready, that is the moment to bring in PowerSync (§5.5) rather than deepen the hand-rolled web path.

### Risk 3 — universal discipline is a rule, and rules erode

Two compounding sources of churn: **NativeWind v5 is a fresh major** (preview status, Tailwind v4 migration, Reanimated under the hood), and **the `.web.tsx`-only rule for the researcher surface is a convention, not a compiler error.** If someone builds the dashboard in RNW because "we're a universal app," they will produce a mediocre dashboard slowly and blame Expo — correctly.

**A fourth risk worth naming under this heading, given requirement #9:** blind implementer agents are measurably better at DOM than at React Native. There is more training data, fewer platform-conditional gotchas, and a shorter feedback loop. An agent-built RN component is likelier to be subtly wrong (a missing `flex: 1`, an Android-only clipping bug, a web-only `position: fixed`) than an agent-built DOM component. **Mitigation:** the ports/contracts design keeps agents mostly in pure TypeScript where they are strongest; component tests run on all platforms; and `expo export --platform ios` runs in CI so platform-conditional mistakes surface in minutes.

**Mitigations for the styling risk specifically:** an ESLint rule restricting `app/(researcher)/**` to `.web.tsx`; and a documented fallback from NativeWind to plain `StyleSheet.create` + a tokens object (zero dependencies) — cheap precisely because Tailwind classnames are mechanical to convert. If NativeWind v5 proves unstable, we drop it in a day rather than being trapped.

---

## 13. Summary

| Question | Answer |
|---|---|
| Client | Expo SDK 57 (RN 0.86, React 19.2), expo-router, Metro, react-native-web |
| Runtime direct deps | **23** (22 without `expo-video`) |
| iOS path | `expo prebuild` → `eas build` → `eas submit`. 1–2 weeks. **Unlisted distribution** for the pilot. |
| Offline | Patient surface only. SQLite (native) / IndexedDB (web) behind one port. Content-addressed media on disk. Append-only telemetry outbox, deleted only on per-ID server ACK. |
| Conflicts | Structurally absent: telemetry is immutable, content is single-writer, schedule state is derived and server-replayed. |
| Patient auth | Enrolled device with a Keychain-held secret → 15-minute JWTs → RLS scoped to `device_patients`. Instantly revocable. No patient credential exists. |
| Tests | Frozen `contracts/` (zod + ports + conformance suites) as the blind boundary; jest-expo, RNTL, local Supabase for RLS, Playwright on web, Maestro on iOS later. `testID` → `data-testid` gives one selector vocabulary. |
| Styling | NativeWind v5 tokens; RN primitives for patient/caregiver; plain DOM `.web.tsx` for researcher. |
| Biggest risk | react-native-web is in maintenance mode. |
| Biggest counter-argument I must beat | YAGNI — answered in §11, with a falsifiable two-week kill criterion. |

---

### Sources

- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57) · [Expo SDK 55](https://expo.dev/changelog/sdk-55) · [Expo SDK 54](https://expo.dev/changelog/sdk-54) · [expo on npm](https://www.npmjs.com/package/expo?activeTab=versions)
- [react-native-web repo](https://github.com/necolas/react-native-web) · [Future of React Native Web discussion #2816](https://github.com/necolas/react-native-web/discussions/2816) · [React Native Web enters maintenance mode (ITNEXT)](https://itnext.io/react-native-web-enters-maintenance-mode-a-drop-in-photo-gallery-and-the-strictest-button-ever-872c57a76c94) · [Snyk: react-native-web](https://security.snyk.io/package/npm/react-native-web)
- [Expo SQLite docs (SDK 57)](https://docs.expo.dev/versions/latest/sdk/sqlite/) · [Expo SecureStore docs](https://docs.expo.dev/versions/latest/sdk/securestore/) · [Expo Camera docs](https://docs.expo.dev/versions/latest/sdk/camera/) · [expo-camera changelog](https://github.com/expo/expo/blob/main/packages/expo-camera/CHANGELOG.md)
- [expo-av deprecation PR #36020](https://github.com/expo/expo/pull/36020) · [expo-av removal issue #37259](https://github.com/expo/expo/issues/37259)
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js) · [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [PowerSync + Supabase guide](https://docs.powersync.com/integrations/supabase/guide) · [Expo blog: synced in-app SQLite](https://expo.dev/blog/what-synced-in-app-sqlite-brings-to-expo-apps) · [Supabase partner listing](https://supabase.com/partners/powersync)
- [Apple unlisted app distribution](https://developer.apple.com/support/unlisted-app-distribution) · [Apple Custom Apps for Business](https://developer.apple.com/business/custom-apps) · [iOS Distribution Guide 2026](https://foresightmobile.com/blog/ios-app-distribution-guide-2026)
- [NativeWind v5 installation](https://www.nativewind.dev/v5/getting-started/installation) · [NativeWind v4→v5 migration](https://www.nativewind.dev/v5/guides/migrate-from-v4) · [Expo Tailwind guide](https://docs.expo.dev/guides/tailwind/)
- [Expo unit testing with Jest](https://docs.expo.dev/develop/unit-testing/) · [React Native Testing Guide 2026](https://reactnativerelay.com/article/complete-guide-testing-react-native-apps-2026-unit-tests-e2e-maestro) · [Detox alternatives 2026](https://getautonoma.com/blog/detox-alternatives-react-native)
