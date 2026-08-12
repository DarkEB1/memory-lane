# Proposal: Vite + React SPA (PWA now) wrapped with Capacitor for iOS

**Advocate's brief.** Assigned stack: Vite + React SPA delivered as an installable offline PWA today, wrapped in Capacitor to reach the App Store later.

**Thesis in one line:** Ship one React codebase in a browser this week, and reach the App Store later by swapping four adapters — not by rewriting the app — because everything platform-specific is behind an interface the day it is written.

All versions below were verified against the npm registry and vendor documentation on **2026-08-12**. Nothing here is from memory.

---

## 1. Why this stack, stated as a bet

The product has three surfaces with almost nothing in common visually, one hard real-time-ish requirement (instant offline media playback for a patient), and a stated destination of the App Store. Three candidate shapes exist: web-only, native (React Native / Swift), or web-in-a-native-shell.

The bet this proposal makes is narrow and defensible:

> The dementia patient session is **a stack of large images, large text, big buttons, and one audio file playing**. It is not a 120fps gesture-driven interface. The web platform renders that perfectly. The parts that the web platform genuinely cannot do well — durable local storage that the OS will not evict, keychain-bound encryption, camera/mic with reliable permission UX, kiosk lockdown, background delivery — are exactly the parts Capacitor exposes as native plugins behind a JS call.

So: write the app once, in the platform where the UI is cheapest to build, and buy the four native capabilities we actually need instead of adopting a native framework to get them.

The counter-bet (React Native / Expo) is a legitimate rival and I address it honestly in §12. The counter-bet's strongest card is media reliability, and I concede it there.

---

## 2. Exact stack, with versions and justification

Every dependency below has to answer: *what breaks if we delete it?* Anything I could not answer, I deleted.

### 2.1 Build and language

| Package | Version | License | Why it earns its place |
|---|---|---|---|
| `vite` | **8.2.1** (2026-08-06) | MIT | Vite 8 went stable 2026-03-12 with Rolldown (Rust) as the single bundler for both dev and build, replacing the old esbuild-dev / Rollup-build split. Build times reported 10–30× faster. One bundler means one set of behaviours between dev and prod — which matters when a test agent and an implementation agent are debugging separately. |
| `@vitejs/plugin-react` | 6.0.5 | MIT | React Fast Refresh + JSX transform. Non-optional. |
| `typescript` | **7.0.2** (2026-07-08) | Apache-2.0 | TS 7 (the native/Go compiler) is stable. Type-checking a repo this size is now near-instant, which matters because the contract packages (§8) are type-checked on every agent run. `@supabase/supabase-js` requires TS ≥5.0 from 2027-01-31, so we are well ahead. |

**No Next.js, no Remix, no SSR.** There is no SEO surface, no shared-link surface, and no server-render benefit for a logged-in app. SSR would also actively fight Capacitor, which serves static files from the app bundle. Deleting SSR deletes an entire class of hydration bug and an entire deployment tier.

### 2.2 Runtime — shipped to the browser

| Package | Version | Gzip (approx) | Why |
|---|---|---|---|
| `react` / `react-dom` | **19.2.8** (2026-07-21) | ~45 KB | React 19 is the current major; React 20 does not exist as of 2026-08. Stable, boring, enormous hiring/agent-familiarity pool. |
| `react-router` | **8.3.0** (2026-07-22) | ~18 KB | Three surfaces = three route trees + lazy route-level code splitting, which is how each surface gets its own bundle (§10). |
| `@supabase/auth-js` | 2.112.3 | ~18 KB | Auth only. |
| `@supabase/postgrest-js` | 2.112.3 | ~14 KB | Data only. |
| `@supabase/storage-js` | 2.112.3 | ~8 KB | Media upload/signed URLs. **Caregiver bundle only.** |
| `zod` (`zod/mini` on the patient surface) | **4.4.3** | ~14 KB / ~5 KB mini | The contract layer. Executable schemas are what make blind test-authoring possible (§8). |
| `@tanstack/react-query` | 5.101.4 | ~13 KB | **Caregiver + researcher only.** Server-state caching, retry, invalidation. Deleting it means hand-rolling the same thing worse. The patient surface does *not* use it — the patient reads from local storage, never from the network. |
| `dexie` | 4.4.4 | ~26 KB | **Web/PWA build only.** A typed wrapper over IndexedDB. Raw IndexedDB is a callback swamp; `idb` (8.0.3, last published 2025-05) is smaller but Dexie's transaction + versioning story is worth 20 KB on a store we must not corrupt. |
| `recharts` | **3.10.1** (2026-07-25) | ~95 KB | **Researcher chunk only, lazy-loaded.** Actively maintained. I considered `uplot` (1.6.32, last published **2025-03-14** — stable but dormant for 17 months); it is faster for >10k point series but the maintenance signal is weak and the researcher charts are cohort aggregates, not oscilloscope traces. If a chart ever needs >5k points, add uPlot for that one chart. |

> **Deliberate omission — `@supabase/supabase-js`.** The meta-package pulls in `realtime-js` and `functions-js`, and Realtime is the single biggest chunk in it. We do not need websockets: the caregiver polls, the researcher queries, the patient is offline by design. Importing the three sub-packages directly (all published in lockstep at 2.112.3) is the same API surface minus ~25 KB gzip on every bundle. This is a real, measured lever, not a micro-optimisation.

**No UI component library. No Tailwind. No CSS-in-JS.** Justified in §9.

### 2.3 Native shell — added at iOS time, installed from day one

| Package | Version | License | Why |
|---|---|---|---|
| `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` | **8.5.0** (2026-07-31) | MIT | Capacitor 8: SPM is the default dependency manager for new iOS projects (CocoaPods still works for existing ones); iOS deployment target 15+. **8.5.0 adopts UIScene**, which iOS 27 requires for apps built against the latest SDK — and ships a one-command migrator. That is the correct signal about maintenance velocity: the ecosystem's most disruptive 2026 iOS change was absorbed by the framework, not by us. |
| `@capacitor-community/sqlite` | **8.1.1** (2026-08-06) | MIT | The durable local store on native. Actively released through 2026 (8.0.0 Jan, 8.1.1 Aug). This is the plugin that solves the eviction problem in §5. |
| `@capacitor/filesystem` | 8.1.2 | MIT | Media files on disk in the app container, playable by native path. |
| `@capacitor/camera` | 8.2.2 | MIT | Native photo capture + library picker with correct iOS permission prompts. |
| `@capacitor/preferences` | 8.0.1 | MIT | Small non-secret config (device mode, sync cursor). Eviction-proof. |
| `@aparajita/capacitor-secure-storage` | **8.0.0** (2026-02-10) | MIT | iOS Keychain / Android Keystore. Holds the device refresh token and the local-DB encryption key. MIT, Capacitor-8-current. |
| `@capacitor/network`, `@capacitor/device`, `@capacitor/app` | 8.0.1 / 8.0.3 / 8.1.1 | MIT | Connectivity transitions to trigger sync drain; stable device id; lifecycle hooks to flush the queue on background. |
| `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard` | 8.0.3 / 8.0.2 / 8.0.5 | MIT | Chrome control for the patient's full-bleed surface. |
| `@capacitor/local-notifications` | 8.2.1 | MIT | "Time for today's session" on a personal device. Optional; only if the product actually wants it. |

**A licensing warning I will not bury.** Capawesome's plugin line is the highest-quality Capacitor plugin catalogue in 2026, but it is split: App Review, Audio Player, Speech Recognition, File Picker etc. are MIT and free; **Biometrics, SQLite, NFC, BLE, Vault, Secure Preferences and the new Audio Recorder are Insiders-only** — sponsorware behind a private npm registry (`@capawesome-team/*` returns nothing on the public registry; I checked). Every plugin in my table above is public and MIT. If we later want Capawesome's Secure Preferences or Audio Recorder, that is a paid subscription decision, not a technical one, and nothing in this proposal depends on it.

### 2.4 Test and tooling — never shipped

| Package | Version | Why |
|---|---|---|
| `vitest` | **4.1.10** (2026-07-06) | Vitest 4 marked **Browser Mode stable**. Same config as Vite — one build pipeline for app and tests. |
| `@vitest/browser-playwright` | 4.1.10 | Real Chromium/WebKit for component tests, with Playwright trace support. |
| `@playwright/test` | **1.62.1** (2026-07-30) | E2E across three surfaces + offline simulation. |
| `@testing-library/react` / `jest-dom` | 16.3.2 / 7.0.1 | Behaviour-first queries. Necessary for blind test authoring. |
| `msw` | 2.15.0 | Network-level mocks for pure-frontend tests. Handlers generated from the PostgREST OpenAPI spec so mocks cannot drift from the schema. |
| `vite-plugin-pwa` | **1.3.0** (2026-05-05) | Supports Vite 3.1–8.0; wraps `workbox-build`/`workbox-window` 7.4.1. Note: the vite-pwa team announced in May 2026 that they are preparing a Workbox fork and a new modular PWA package — treat this as a watch item, not a blocker; 1.3.0 is stable today. |
| `supabase` (CLI) | 2.113.0 | Local Postgres + GoTrue + Storage + Studio in Docker, real migrations, `db reset` / `db push`. |
| `eslint` / `prettier` | 10.8.1 / 3.9.6 | Non-negotiable when multiple blind agents write into one repo. |

---

## 3. The path to a real iOS App Store app

### 3.1 The mechanical part (small)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Recall" com.example.recall --web-dir=dist
npx cap add ios
npm run build && npx cap sync ios && npx cap open ios
```

Capacitor copies `dist/` into the iOS app bundle and serves it from `capacitor://localhost` via a `WKURLSchemeHandler`. It is a **local origin, not a remote URL load** — this distinction is the whole ballgame for §3.3 and for offline behaviour. Getting a signed build onto a device is an afternoon.

### 3.2 The part that actually costs effort

Honest estimate, assuming the adapters described in §4–§7 were written correctly from day one:

| Work item | Effort | Risk |
|---|---|---|
| Storage adapter: native impl (SQLite + Filesystem) behind the same interface as the Dexie impl | 2–3 days | Low — it is the second implementation of a frozen interface |
| Media capture: `@capacitor/camera` + native audio record path behind `MediaPort` | 3–4 days | **Medium — see §12 risk 2** |
| Token storage moves to Keychain | 0.5 day | Low |
| Auth redirect / deep links (magic links, OAuth) via `appUrlOpen` + Universal Links | 1–2 days | Medium — this is the single most common "worked on web, broke on iOS" bug in Capacitor apps |
| Safe-area insets, disable rubber-band scroll, disable long-press callout/selection for patient mode | 1 day | Low |
| Kiosk hardening: Guided Access support / MDM Single App Mode guidance for the care home | 1 day | Low |
| Privacy manifest (`PrivacyInfo.xcprivacy`), nutrition labels, permission usage strings | 1 day | Low but mandatory |
| App icons/splash, TestFlight, review submission | 1–2 days | Low |
| **Total** | **~2 working weeks** | |

Fixed costs: Apple Developer Program **$99/yr**; a Mac (or a cloud Mac runner, ~$50–80/mo) — this cost is identical for React Native and Flutter; Xcode current; iOS 15+ target.

### 3.3 What breaks

1. **Service workers do not run on native.** Capacitor serves local files; the Workbox precache/runtime-cache layer is inert inside the app. This is real duplication: the PWA caching strategy and the native filesystem cache are two implementations of "keep media available offline." I do not pretend otherwise. It is contained because both sit behind one `MediaCache` interface, but it is two code paths to test.
2. **`server.url` live-reload must never ship.** Shipping a build that points `server.url` at a remote host is both a security hole (remote code into a privileged webview) and the fastest possible route to a 4.2 rejection. This belongs in the release checklist as a hard gate.
3. **Web APIs with no iOS WKWebView support** must already be behind ports: Web Push (use `@capacitor/push-notifications`), Background Sync (use lifecycle-triggered drain + `BGTaskScheduler` if truly needed), Web Share, File System Access.
4. **`limitsNavigationsToAppBoundDomains`** should be set `true` with a `WKAppBoundDomains` allow-list in `Info.plist`. This meaningfully hardens the webview; it also disables some WKWebView features, so it must be enabled early and tested, not bolted on at submission.

### 3.4 Will Apple accept it? — Guideline 4.2, straight

The actual text, from the current App Review Guidelines:

> **4.2 Minimum Functionality.** Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or "app-like," it doesn't belong on the App Store.
>
> **4.2.2** Other than catalogs, apps shouldn't primarily be marketing materials, advertisements, **web clippings**, content aggregators, or a collection of links.
>
> **4.2.3 (i)** Your app should work on its own without requiring installation of another app to function.

And **2.5.6**: apps that browse the web must use WebKit — which Capacitor does, so there is no engine problem at all.

The rejections you read about are overwhelmingly one shape: *an app whose native project loads `https://mysite.com` in a full-screen webview and does nothing else.* That app is a web clipping. It has no offline behaviour, no native API use, and it fails 4.2.3(i) the moment the network drops.

Ours is not that app. Concretely, at submission this app will:

- run **entirely offline with zero network**, from assets and a database inside the app container — 4.2.3(i) satisfied literally;
- capture photos and audio through **native camera and microphone APIs** with iOS permission dialogs;
- store data in a **native SQLite database** encrypted with a key in the **iOS Keychain**, bound to the device passcode;
- schedule **local notifications**;
- support **Guided Access / MDM Single App Mode** for a locked-down care-home tablet;
- ship a functioning app to a device that has never seen a network.

That is not "features, content and UI that could be a website." Guideline 4.2 is nonetheless **a human judgment call, and I will not promise acceptance** — see §12 risk 1, and the mitigation that matters: **submit to TestFlight in month 1, not month 9.** TestFlight builds go through App Review (Beta App Review). Getting a real reviewer verdict on a skeleton app that already does camera + offline is cheap insurance, and it converts an unbounded end-of-project risk into a bounded early one. Any proposal that does not front-load this is hiding the risk.

One risk that is **stack-independent and must be named anyway:** an app aimed at dementia patients may attract scrutiny under guidelines 1.4.1 / 5.1.3 (health claims, medical data). Expect to supply a privacy policy URL, a data-handling description, and possibly evidence for any therapeutic claim, or to soften the claim to "reminiscence and engagement activity." React Native would face exactly the same question.

---

## 4. Architecture: four ports, and everything else is portable

This is the discipline that makes "no rewrite later" true rather than aspirational. Four interfaces are defined **before any feature code**, each with a web implementation and (later) a native implementation:

```ts
// packages/contracts/ports.ts — frozen before implementation starts
export interface KeyValuePort   { get(k): Promise<string|null>; set(k,v): Promise<void>; remove(k): Promise<void> }
export interface SecretPort     { get(k): Promise<string|null>; set(k,v): Promise<void>; clear(): Promise<void> }
export interface LocalDbPort    { exec(sql, params): Promise<Row[]>; tx<T>(fn): Promise<T> }
export interface MediaPort {
  capturePhoto(): Promise<LocalMediaRef>
  recordAudio(): Promise<{ stop(): Promise<LocalMediaRef> }>
  save(blobOrRef, key): Promise<LocalMediaRef>
  playableUrl(key): Promise<string>        // http(s)/blob on web, capacitor://…/_capacitor_file_/… on native
  evict(key): Promise<void>
}
```

| Port | Web impl | Native impl |
|---|---|---|
| KeyValue | `localStorage` | `@capacitor/preferences` |
| Secret | IndexedDB (weaker — acknowledged, §7.4) | `@aparajita/capacitor-secure-storage` → Keychain |
| LocalDb | Dexie over IndexedDB | `@capacitor-community/sqlite` |
| Media | `getUserMedia`/`MediaRecorder` + Cache Storage + blob URLs | `@capacitor/camera`, native recorder, `@capacitor/filesystem` + `Capacitor.convertFileSrc` |

Everything above these ports — React components, routing, the scheduler, the telemetry queue logic, all business rules — is 100% shared and never learns which platform it is on. **Roughly 90% of the code never knows Capacitor exists.** That is the concrete meaning of "near-zero rewrite," and it is worth about a day of upfront design.

---

## 5. Offline: the care-home tablet with no wifi for three days

### 5.1 What actually happens

**Day 0, still online.** Device syncs: content rows into the local DB, every photo and audio file downloaded to disk as real files, a sync cursor stored.

**Day 1–3, no wifi at all.** A carer hands the tablet to a resident. The app is already installed (native) or already precached (PWA). It opens. The resident's face grid renders from local files. They tap their photo. The session starts. Photos render from local paths; audio plays from local paths with no buffering. Every tap, every latency measurement, every card outcome is written to the local DB **inside the same transaction as the session state change**. The scheduler decides what comes next using only local state — it never asks the server anything. Nothing about the patient's experience differs from being online, because the patient path has **no network calls in it at all, ever, by design**. Offline is not a degraded mode; it is the only mode the patient code knows.

**Day 4, wifi returns.** `@capacitor/network` fires, the drain loop wakes, batches of events go up idempotently, new content comes down. Total elapsed patient-visible impact: zero.

### 5.2 Why the data is still there on day 3 — the eviction problem, honestly

This is the sharpest technical objection to a web-based patient app, and it deserves a direct answer.

**The facts.** WebKit's storage policy (Safari 17+) gives browser apps up to 60% of disk per origin and 80% overall; **non-browser apps — which includes any WKWebView, i.e. Capacitor — get 15% per origin and 20% overall.** Storage is in "best-effort" mode by default and is evicted least-recently-used when an origin has no active page and no recent user interaction. Capacitor's own documentation is blunt: *"the OS will reclaim local storage from Web Views if a device is running low on space,"* IndexedDB included, and it explicitly recommends the native Preferences API for small data and SQLite for large data. There is an open Capacitor issue (#7594) requesting persisted-storage support precisely because iOS does not expose it inside a webview.

**So the design does not fight this — it steps around it:**

- **Native (the care-home tablet, the mode that matters):** durable data lives in **native SQLite in the app container** and media lives in **`Filesystem` `Directory.Data`** (`Library/NoCloud` on iOS — *not* `Caches`, which iOS will purge under pressure). App-container files are not WebKit storage and are not subject to WebKit eviction. They are deleted when the app is deleted, and that is the correct semantic. The web-storage APIs are used for nothing durable on native — only ephemeral view state. **This is why shared care-home tablets should run the native app, not the PWA.**
- **Web/PWA (the family's phone, the pilot's first weeks):** call `navigator.storage.persist()` on first run. WebKit grants persistence heuristically, and *"whether the website is opened as a Home Screen Web App"* is an explicit part of that heuristic — so the install prompt is a data-durability feature, not a nicety. Home-screen web apps also maintain their own days-of-use counter, separate from Safari's. Media goes in Cache Storage via a Workbox `CacheFirst` route; records go in IndexedDB via Dexie.
- **We measure it rather than hope.** `navigator.storage.estimate()` runs at startup; if quota or usage looks wrong, or if a required media key is missing from the cache, the app reports a `cache_integrity_fail` telemetry event and (when online) re-fetches. Silent data loss becomes a logged, visible event.

**The residual honesty:** on the web path, a family phone under severe storage pressure with the app unused for weeks *can* lose its cache. The consequence is bounded — cached content is a **replica**, never the source of truth; the source is Postgres. What is *not* replaceable is queued telemetry, and §5.3 addresses that.

### 5.3 Telemetry that is never lost

Requirement 7 says "never lost." That is a design constraint, not a feature, and it drives four rules:

1. **Local-durable-first.** An event is written to the local durable store in the same transaction as the state change that produced it. There is no in-memory queue. If the app is killed one millisecond later, the event exists.
2. **Client-assigned identity.** Every event carries a client-generated **UUIDv7** `event_id` (time-ordered, index-friendly) plus a per-device monotonic `device_seq`. Gaps in `device_seq` are detectable server-side — so "did we lose anything?" is a query, not a hope.
3. **Idempotent ingest.** Upload calls `rpc/ingest_events(jsonb[])` which does `INSERT … ON CONFLICT (event_id) DO NOTHING` and returns the accepted count. Local rows are deleted **only after** a 2xx. A crash mid-flight causes a resend, which is a no-op. This gives effectively-exactly-once delivery with no distributed transaction and no queue library.
4. **Clocks are not trusted.** Latency measurements use `performance.now()` deltas — monotonic and immune to a carer changing the tablet's clock or an NTP jump. Wall-clock stamps use `Date.now()` and are stored *alongside* a `clock_offset_ms` measured against the server's clock at each successful sync. Researchers query corrected timestamps. This is the detail that separates usable research telemetry from unusable research telemetry, and it costs about 30 lines.

Volume sanity check: a rich event row is ~300 bytes. A heavy session is ~200 events. Three days at three sessions a day ≈ 1,800 events ≈ **540 KB**. Three *weeks* offline is still under 4 MB. Queue size is a non-issue; durability was the only real problem.

---

## 6. Sync and conflict handling

No sync engine. No CRDT library. The conflict problem is dissolved by classifying data, and each class has a rule so simple it needs no framework:

| Class | Owner | Direction | Conflict rule |
|---|---|---|---|
| **Content** (patients, cards, media, device config) | Server | Pull only | **Impossible.** The patient device has no write grant. Pull by `updated_at > cursor`; deletions are tombstone rows so a device that was offline learns about them. |
| **Events** (telemetry, session outcomes) | Device | Push only | **Impossible.** Append-only, immutable, unique `event_id`. Two devices cannot conflict on rows only one of them can create. |
| **Derived scheduling state** (per-card interval, ease, due date) | Neither | **Not synced** | Recomputed deterministically from the event log by one pure function, `reduceSchedule(events) -> state`, run client-side for immediacy and server-side for the researcher view. Same TS module both places. |

That third row is the important one. Scheduling state is the *only* data both sides would otherwise want to write, and it is exactly where a naive design creates unresolvable conflicts (patient reviewed a card on the tablet; family reviewed the same card on a phone; whose interval wins?). By making it **derived rather than stored**, the answer is "neither — merge the two event logs and recompute." Order-independent by construction. This removes the entire conflict-resolution subsystem, which is the single largest simplification in this proposal.

**Caregiver edits** (two family members editing the same card) use optimistic concurrency: read `updated_at`, write with `.eq('updated_at', known)`, and on zero-rows-affected show "Someone else just changed this — reload?" A three-way merge UI would be speculative complexity for an event that will happen approximately never.

---

## 7. Auth: three roles, and the hard part

### 7.1 The two easy roles

- **Caregiver** — real Supabase Auth user (email + password or magic link), `app_metadata.role = 'caregiver'`, linked to patients through a `caregiver_patient` membership table. RLS everywhere.
- **Researcher** — real Supabase Auth user, `app_metadata.role = 'researcher'`, with **no grants on base tables at all**. Researchers can only `SELECT` from `researcher_*` views that expose `study_id` and never `patient_identity`. De-identification is enforced by the absence of a grant, not by a `WHERE` clause someone might forget. Export runs through an Edge Function that logs who exported what, when.

### 7.2 The hard part: a patient device with no password

**The reframe that solves it: the device authenticates, not the patient.** A patient with dementia cannot hold a credential — so we never ask them to. The credential belongs to the tablet, and the tablet was enrolled by an authenticated human.

**Enrollment (once, by a caregiver or care-home admin):**

1. In the caregiver app, the authenticated adult picks a mode (**personal** or **shared**) and selects which patient(s) this device may serve.
2. An Edge Function running as `service_role` creates a `device` row, creates a dedicated auth user `device+<uuid>@devices.invalid` with a 32-byte random password the user never sees, and stamps immutable claims into **`app_metadata`**: `{ role: 'device', device_id, mode }`. `app_metadata` is writable only by `service_role`, so it cannot be forged from the client — this is the property the whole scheme rests on.
3. It returns a **single-use enrollment code** valid for 10 minutes.
4. The tablet is handed the code once. It redeems it, receives the device credentials, signs in, and stores **only the refresh token** in the **iOS Keychain** with `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`.

**Daily use:** the patient opens the app and is instantly in their session (personal mode) or sees a grid of the faces of *the residents assigned to this tablet* and taps their own (shared mode). No password, no PIN, no keyboard. Ever.

### 7.3 What a thief gets — the stolen-tablet analysis

This is the question that must be answered concretely rather than waved at.

**Blast radius by design.** A device token grants:
- `SELECT` on content rows **only for patients joined to this `device_id`** via `device_patient`. Not the care home. Not the cohort. Just the residents on that tablet.
- `SELECT` on a `device_roster` view exposing `(patient_id, display_first_name, avatar_path)` — first name and face only.
- `INSERT` on `event` and `session`. That is all.
- **Zero** grants on `patient_identity` (surname, DOB, address, NHS number), zero on other devices, zero on caregivers, **zero UPDATE, zero DELETE anywhere**. A stolen tablet cannot destroy or alter a single row of research data.

RLS example, enforced in Postgres, not in JS:

```sql
create policy device_reads_own_patients on card for select to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'device'
  and patient_id in (
    select patient_id from device_patient
    where device_id = (auth.jwt() -> 'app_metadata' ->> 'device_id')::uuid
  )
);
```

**Six mitigations, layered:**

1. **Encrypted local cache.** The SQLite DB and media files are encrypted with a key held in the Keychain under `WhenPasscodeSetThisDeviceOnly`. On a stolen, locked, passcode-protected iPad the cached content is not readable and the key cannot be extracted via backup or another device. The care home is told, in writing, that a passcode is mandatory.
2. **Instant revocation.** An admin revokes a device with one tap: the auth user is deleted and `device.revoked_at` set. Access tokens are short-lived (1h) and refresh-token rotation with reuse detection means the stolen device is locked out within the hour without any cooperation from the device.
3. **Self-wipe on revocation.** On the next successful connection, a revoked device deletes its local DB, its media, and its Keychain key before anything renders.
4. **Dead-man wipe.** If the device has not reached the server in `N` days (configurable; default **14** — chosen to comfortably exceed the required 3-day offline window), it wipes cached PII locally and shows "Please contact your carer." A tablet that is stolen and kept off-network does not stay readable forever. Note the honest tension: this parameter directly trades offline tolerance against theft exposure, and the care home sets it consciously.
5. **Kiosk lockdown.** Guided Access or MDM Single App Mode prevents a resident — or a thief — from leaving the app. This is a native-only capability, and it is simultaneously one of the strongest 4.2 arguments.
6. **Exit-PIN.** Leaving patient mode requires a caregiver PIN (rate-limited, verified against a server-side hash when online, against a local scrypt hash when offline). This protects the *mode*, not the *data* — I am not going to claim otherwise.

**The genuinely honest residual:** a thief with an unlocked, un-revoked, still-online shared tablet can see the first names, faces and reminiscence content of the residents on that one tablet, for up to an hour. That exposure is real, it is bounded, and it should be written into the pilot's DPIA rather than engineered away with theatre. Any patient-facing device with no patient password has this property; the work is in bounding it, and it is bounded here.

### 7.4 The concession that matters

The Keychain guarantees in 7.3 (passcode-bound, device-bound, backup-proof) **do not exist in a browser.** Therefore:

> **Shared care-home tablets should run the native Capacitor app, not the PWA.** Personal/family devices may run the PWA during the pilot.

This is a real limitation of the "PWA now" half of the pitch and I am stating it up front rather than being caught with it in cross-examination. It affects sequencing, not architecture: the same code serves both, and the iOS build is ~2 weeks away at any point.

---

## 8. Test infrastructure and the blind-agent contract

Requirement 9 — test-writers who cannot see the implementation, implementers who cannot see the tests — is the requirement most likely to fail silently. It fails when the "contract" is prose. It succeeds when the contract is **executable artifacts that both agents import**.

### 8.1 The five frozen contract artifacts

Written and frozen **before** either agent starts:

1. **`packages/contracts/schema.ts`** — Zod 4 schemas for every entity and event payload; TS types inferred from them. A test-writer can assert `EventSchema.safeParse(x).success` for valid and invalid fixtures without seeing a line of implementation.
2. **`supabase/migrations/*.sql`** — the database schema *is* the backend contract. RLS policies are written here and are testable directly.
3. **`packages/contracts/ports.ts`** — the four port interfaces from §4. A test-writer writes a fake `LocalDbPort` and tests the sync engine against it; the implementer writes the real one. Neither reads the other's file.
4. **`packages/contracts/testids.ts`** — a frozen `const` object of every interactive element's `data-testid`. Both agents import it. The test-writer writes `getByTestId(ids.patient.answerEasy)`; the implementer writes `data-testid={ids.patient.answerEasy}`. Neither has to guess a selector, and if the id set changes, **both sides fail loudly at compile time**. This one file is what makes blind E2E authoring actually work, and it costs 40 lines.
5. **`packages/contracts/fixtures/`** — canonical seed data + expected-output tables for pure functions, especially `reduceSchedule`.

### 8.2 The layers

| Layer | Tool | What it proves | Runtime |
|---|---|---|---|
| **Unit** | Vitest 4 (node) | Pure logic: scheduler, queue drain, clock offset, UUIDv7 ordering | < 5s |
| **Contract** | Vitest + Zod | Every payload parses; **schema parity** — a test parses the local Supabase OpenAPI spec and asserts the Zod contracts match the actual DB columns. This catches migration/TS drift, the #1 failure mode of blind development. | < 5s |
| **RLS / security** | Vitest against **local Supabase** | Mint a device token, attempt a cross-tenant read, assert 0 rows. Attempt an UPDATE, assert 403. Every claim in §7.3 becomes an executable test. This suite is non-negotiable in CI. | ~30s |
| **Component** | Vitest 4 Browser Mode + Playwright provider | Real Chromium, real CSS. Can assert **`getBoundingClientRect().width >= 88`** for every patient-mode control — the "huge targets" requirement becomes a test rather than a hope. | ~40s |
| **E2E** | Playwright 1.62 | Three projects: caregiver (desktop Chromium), patient (iPad viewport, WebKit), researcher (desktop). Against local Supabase with seeded fixtures. | ~90s |
| **Offline E2E** | Playwright `context.setOffline(true)` | Go offline, run a full patient session, kill and reload the page mid-session, come back online, assert **every** event landed exactly once and `device_seq` has no gaps. **Requirement 7, executable.** | ~30s |
| **Native smoke** | XCUITest, minimal | App launches, camera permission prompt appears, offline session runs. Deliberately shallow — see below. | manual/CI-Mac |

Total headless CI target: **under 3 minutes**.

**Where I will not overreach:** full native E2E on a simulator is slow, flaky and expensive, and automating it deeply would violate the standing rule. I propose a *shallow* native smoke test and a **written manual device-test matrix** run once per iOS release. That is a real cost of this stack and I am pricing it in rather than hiding it.

**Why this stack suits blind testing specifically:** the DOM is the test surface. Testing Library queries are behavioural. There is no native bridge to mock, no simulator to boot, no Metro bundler to keep warm. A test agent that has never seen the implementation can write a Playwright spec from `testids.ts` + the Zod schemas + the acceptance criteria and it will run in a browser in seconds.

---

## 9. Styling three radically different UIs

**Plain CSS — native nesting, custom properties, and `@layer`. No Tailwind, no CSS-in-JS, no component library.**

The reasoning is the standing rule applied literally. A shared `<Button>` that must serve an 88px patient target, a 44px caregiver control, and a 24px researcher table-row action is not a reusable component — it is a props-driven configuration language with three incompatible users. That abstraction costs more than the duplication it removes.

```
styles/
  reset.css
  tokens.patient.css      --tap-min: 88px;  --font-body: 32px;  --space: 24px;  --radius: 24px;
  tokens.caregiver.css    --tap-min: 44px;  --font-body: 17px;  --space: 12px;  --radius: 8px;
  tokens.researcher.css   --tap-min: 28px;  --font-body: 14px;  --space: 8px;   --radius: 4px;
```

The same variable *names* at wildly different *values*. One attribute on the surface root — `<div data-surface="patient">` — selects the token set. Components live per-surface (`src/patient/`, `src/caregiver/`, `src/researcher/`) and are not shared. **What is shared is domain logic, never widgets.**

Three concrete wins: (1) the "huge targets" requirement becomes `min-block-size: var(--tap-min)` and is component-testable; (2) each surface's CSS is code-split with its route, so the patient tablet never downloads researcher styles; (3) zero runtime cost and zero build-plugin dependency — which is what keeps the toolchain small enough for Vitest Browser Mode to render real components fast.

Accessibility is not a token: the patient surface commits to WCAG AAA contrast, no reliance on colour alone, `prefers-reduced-motion` honoured, and no timed interactions that a dementia patient could fail.

---

## 10. Dependency count and bundle size, honestly

**Direct dependencies: ~34.** Runtime ~20 (including 11 Capacitor plugins whose *JavaScript* is a few KB each — their weight is native code in the IPA), dev/test ~14.

**Transitive `node_modules`: ~450–600 packages.** I am not going to pretend a modern JS toolchain is lean. The mitigating facts are that Vite 8's Rolldown consolidation cut the build-tool graph substantially versus the old esbuild+Rollup split, Playwright and the Supabase CLI are single large binaries rather than package sprawl, and **none of it ships**. The *shipped* runtime graph is roughly **25 packages**.

**Bundle sizes — estimates, gzipped, route-split with a shared React vendor chunk:**

| Surface | Estimate | Contents |
|---|---|---|
| Shared vendor | ~63 KB | react, react-dom, react-router |
| **Patient** | **~95–120 KB** | vendor + auth-js + postgrest-js + zod/mini + local store. Loaded once on a tablet, cached forever. |
| **Caregiver** | **~150–180 KB** | + react-query + storage-js + upload/compression |
| **Researcher** | **~200–260 KB** | + recharts + table/export |

These are estimates from published package sizes, not measurements. **A size budget goes in CI on day one** (`patient chunk ≤ 130 KB gzip`) so the number becomes enforced rather than aspirational.

**IPA size: ~8–15 MB.** WKWebView is provided by the OS, so the binary is our web assets plus the Capacitor runtime and plugin frameworks. Compare React Native (~15–25 MB) and Flutter (~25–40 MB). On a care-home tablet with 32 GB and a dozen residents' photos, this genuinely matters.

---

## 11. What this proposal explicitly does not include

Named so that nobody adds them by reflex: no state-management library (React state + react-query covers it), no form library (three forms, native validation), no i18n (not requested), no component library, no CSS framework, no CRDT/sync framework, no analytics SDK (we have our own telemetry, and a third-party SDK in a patient-data app is a privacy liability), no error-reporting SDK in v1 (telemetry carries error events), no Realtime.

---

## 12. The three biggest risks of my own proposal

**Risk 1 — Guideline 4.2 is a human judgment call and the verdict arrives late.**
Everything in §3.4 is a strong argument, not a guarantee. The failure mode is nasty because it lands after the pilot is built, and the remedy — porting to React Native — is a rewrite of the UI layer at exactly the worst moment. The mitigation is procedural, not technical, and it must be non-negotiable: **a TestFlight submission in month 1**, containing offline mode, native camera and native storage, purely to obtain a real reviewer's verdict while the cost of changing course is still low. A proposal that defers submission to the end is gambling with someone else's timeline. Secondary mitigation: the native differentiators must be *built*, not *planned* — if we reach submission with camera still on `getUserMedia` and storage still on IndexedDB, the reviewer will be looking at a web clipping and will be right.

**Risk 2 — WKWebView is a second-class runtime for exactly the thing the patient app does most: media.**
`getUserMedia` and `MediaRecorder` inside a custom-scheme WKWebView have a history of breaking across iOS point releases. `AVAudioSession` category is not controllable from JavaScript, so recording can duck or kill background audio, playback can route to the wrong output, and silent-switch behaviour differs from a native app. Autoplay after inactivity may still demand a user gesture — awkward when the "user" has dementia. **Every iOS release is a potential regression in a component we do not control and cannot patch.** This is the most likely source of "it worked yesterday" in a care home, and it is the one dimension where React Native or native Swift would be materially safer. Mitigation: the `MediaPort` interface exists precisely so any individual capability can be swapped to a native plugin without touching feature code; a per-iOS-release manual device matrix; and a hard rule that the patient's audio playback path uses **native file playback via `convertFileSrc`**, not blob URLs, on native builds. I concede this one rather than argue it.

**Risk 3 — two storage backends, and the less-tested one is the one families meet first.**
Web (IndexedDB + Cache Storage + service worker) and native (SQLite + Filesystem) are two implementations of the same interface, with different failure modes, different eviction semantics, and — realistically — unequal test attention. Compounding it: §7.4's concession means the PWA path **cannot** meet the stolen-device bar for shared care-home tablets, so the "PWA now, native later" story is genuinely weaker for surface (b) than the headline suggests. There is also a specific web-only hazard: a stale service worker can serve last month's JavaScript to a tablet that is never reloaded, producing bugs that do not reproduce anywhere else. Mitigations: identical contract test-suites run against both port implementations (same specs, two adapters); a version-check on startup with a controlled `skipWaiting` that never fires mid-session; and the sequencing rule that shared care-home tablets wait for the native build.

*(Honourable mention, below the top three: `vite-plugin-pwa`'s maintainers announced a Workbox fork and a rearchitected package in May 2026. Version 1.3.0 is stable today and Workbox 7.4.1 is not going anywhere, but this is a watch item — and if it ever becomes a problem, a hand-written service worker for this app is about 80 lines, since the native build does not use one at all.)*

---

## 13. Summary of the case

Build the whole product once, in the runtime where three wildly different UIs are cheapest to build and where blind agents can test against a real DOM in seconds. Put the four platform-dependent capabilities behind four interfaces on day one. Ship a PWA to families now. Two weeks of adapter work later, ship the same code to the App Store as a native app that runs offline for a week, encrypts its cache in the Secure Enclave, and takes photos with the real camera — which is not a repackaged website by any reading of 4.2.

The risks are real: Apple's judgment is not mine to make, WKWebView's media stack is not mine to fix, and two storage backends is two things to test. I would rather state them now than have them found.
