# Proposal: Split Surfaces

**Two clients, one pure-TypeScript core, one Supabase backend.**

Advocate's brief. All versions verified against the npm registry and vendor release notes on 2026-08-12.

---

## 0. Thesis

The three user experiences are not three views of one app. They are three products that happen to share a database and a domain model. Forcing them into one client does not save work — it relocates the work into a runtime mode switch that every future change has to reason about, and it drags an App Store release train around the necks of the caregiver and researcher surfaces forever.

So: **share the logic, never the pixels.** One framework-agnostic `core` package with zero UI dependencies, consumed by an offline-first patient client (which later becomes the iOS app) and a conventional online web client for caregivers and researchers.

This is a *smaller* system than the single-app alternative, not a bigger one. Section 2 proves that with numbers rather than assertion.

---

## 1. Repository shape

```
dementia-anki/
├─ package.json               # pnpm workspace root, no deps of its own
├─ pnpm-workspace.yaml
├─ packages/
│  └─ core/                   # pure TS. zero UI deps. THE CONTRACT.
│     ├─ src/
│     │  ├─ types.ts          # zod schemas + inferred types
│     │  ├─ scheduler.ts      # pure functions
│     │  ├─ session.ts        # session state machine, pure
│     │  ├─ telemetry.ts      # event envelope construction
│     │  ├─ sync.ts           # outbox protocol, batching, idempotency keys
│     │  ├─ ports.ts          # interfaces ONLY: PatientRepo, OutboxStore,
│     │  │                    #   MediaCache, Clock, Ids, Crypto
│     │  └─ db.generated.ts   # supabase gen types --local
│     └─ testing/             # in-memory fakes for every port + contract suites
├─ apps/
│  ├─ patient/                # React + Vite + Dexie + Capacitor. Tablet/iOS.
│  └─ clinic/                 # React + Vite. Caregiver + researcher. Web only.
└─ supabase/
   ├─ migrations/*.sql
   ├─ functions/{enroll-device,device-token,export-patient,delete-patient}/
   ├─ tests/*.sql             # pgTAP
   └─ seed.sql
```

Four workspace packages. That is the entire "monorepo".

**No Turborepo, no Nx, no Lerna, no changesets.** Turborepo 2.10.9 is excellent and I am deliberately not using it. With four packages and no publishing, `pnpm -r --parallel run test` is the whole task runner. Turbo earns its place when CI exceeds ~3 minutes or when there are ten packages; adding it on day one is exactly the speculative infrastructure the standing rule forbids. It is a two-file addition later if we need it.

Toolchain: **pnpm 11.21.0** (workspaces, strict `node_modules`, so `apps/patient` physically cannot import a package it did not declare — this is what actually enforces the boundary), **TypeScript 7.0.2** (the Go-native compiler, GA 2026-07-08, 8–12x faster type-checking; we use no Vue/Svelte/Angular template tooling, so the missing public compiler API does not affect us), **Vite 8.2.1** (Rolldown default since 8.0, 2026-03-12).

---

## 2. The LESS IS MORE argument, with numbers

This is the objection I have to beat, so I will take it head-on.

### 2.1 What the single-app alternative actually costs

A single client serving all three roles must carry, in one bundle and one codebase:

| Concern | Single app | Split |
|---|---|---|
| Offline data layer | Applies to all code paths, or you build a two-mode data layer inside one app — which *is* the split, without a compiler-enforced wall | Exists only in `apps/patient` |
| Router | Needed, with guards that must distinguish "no auth at all" from "auth + role" — the highest-risk guard logic in the product | Patient app has **no router** (4 screens, a `useState` union). Clinic app has a normal one |
| Charting (Recharts ~95KB gz) | Ships to the care-home tablet whether or not it is reachable | Never enters the patient bundle |
| Audio transcode fallback (`ffmpeg.wasm`, ~25MB) | Sits in the same dependency graph as the patient app | Physically cannot reach the patient device |
| Release train | One. A caregiver dashboard typo fix requires an App Store submission, or a version-skew story between the web build and the shipped iOS build of the *same bundle* | Two independent trains. Clinic deploys continuously; patient ships on Apple's cadence |
| Design tokens | One token set stretched across 96px targets and 12px table rows. Every component grows a `variant="patient"` prop | Two token sets, zero variant props |
| Stolen-tablet blast radius | Bundle contains researcher routes, cohort query shapes, admin form schemas | Bundle contains none of it |

The release-train row is the decisive one and it is not aesthetic. Requirement 1 states the iOS app is a destination, not a maybe. From the day that ships, a single-client architecture couples every caregiver-facing change to App Review. That is not a theoretical cost; it is a permanent 24–48h latency tax on the surface that will change most often.

### 2.2 What the split actually costs

Honest accounting of the *duplicated* artefacts:

- Two `vite.config.ts` (~25 lines each)
- Two `index.html` (~15 lines each)
- Two Tailwind entry CSS files (~40 lines each — but these are *different by design*, not duplicated)
- Two Supabase client bootstraps (~30 lines each — and they are genuinely different: one does email auth, one does device-token exchange)
- Two CI jobs (one matrix entry)
- Two bundle budgets

**Total genuinely duplicated code: ~250 lines and one extra config file.**

Against that, `packages/core` holds the scheduler, the session state machine, all types and validation, the telemetry envelope, and the sync protocol — call it 60–70% of the non-trivial logic — written once, imported twice, tested once.

### 2.3 "Doesn't this double the UI work?"

No, because **the UI was never shareable.** A 96×96px two-choice card with no chrome and a paginated cohort table with CSV export share no component, no layout, no interaction model, no accessibility target, and no theme. In a single app you write both anyway. The split does not add a second UI; it removes the mode-switch scaffolding that would otherwise sit between them.

The trap that kills shared-UI monorepos is the "shared component library" that ends up as `<Button size="patient" | "dense">`. **We are not building one.** There is no `packages/ui`. That absence is a design decision, and it is the reason this split stays cheap.

---

## 3. `packages/core` — the contract

Runtime dependencies: **`zod@4.4.3`. That is the entire list.**

`tsconfig.json` for `core` sets `"lib": ["ES2023"]` with **no `DOM`**. If it compiles, it provably does not touch `window`, `document`, `fetch`, `localStorage`, or `IndexedDB`. This is not a convention; it is a compiler error. It is the single cheapest guardrail in the whole proposal.

What lives here:

```ts
// ports.ts — interfaces only, no implementations
export interface Clock { now(): number; monotonic(): number }
export interface Ids { uuid(): string }
export interface PatientRepo {
  getPatient(id: PatientId): Promise<Patient | null>
  getDueItems(id: PatientId, at: number, limit: number): Promise<Item[]>
  putSchedulerState(id: PatientId, s: SchedulerState): Promise<void>
}
export interface OutboxStore {
  append(events: TelemetryEvent[]): Promise<void>
  peek(limit: number): Promise<TelemetryEvent[]>
  ack(ids: EventId[]): Promise<void>
  depth(): Promise<number>
}
export interface MediaCache {
  get(id: MediaId): Promise<Blob | null>
  put(id: MediaId, blob: Blob): Promise<void>
  evictLru(targetBytes: number): Promise<number>
}
```

```ts
// scheduler.ts — pure. no I/O, no clock reads, no randomness.
export function selectNext(state: SchedulerState, now: number): Item | null
export function applyResponse(state: SchedulerState, r: Response): SchedulerState
```

`Clock`, `Ids`, and `Crypto` are ports rather than globals for one reason: **it makes the three-day-offline scenario a unit test.** An E2E test that needs to simulate 72 hours of drift injects a fake clock instead of waiting.

Enforced by ESLint 10.8.1 inside `core` only:
`no-restricted-globals: [Date, Math.random, crypto, fetch, window, document]`. Six lines of config. This is what makes blind-written tests deterministic and therefore stable.

---

## 4. `apps/patient`

**Runtime deps (4):** `react@19.2.8`, `react-dom@19.2.8`, `dexie@4.4.4`, `@supabase/supabase-js@2.112.3`
**Native (6):** `@capacitor/core@8.5.0`, `@capacitor/ios@8.5.0`, `@capacitor/app@8.1.1`, `@capacitor/network@8.0.1`, `@capacitor/haptics@8.0.2`, `capacitor-secure-storage-plugin`
**Build/dev:** `vite@8.2.1`, `@vitejs/plugin-react@6.0.5`, `tailwindcss@4.3.3`

No router. No state library. No query library. No form library. No component library. No animation library.

Why each of the four earns its place:

- **react/react-dom** — the principal fixed React. It is also what makes the later Capacitor path uneventful.
- **dexie 4.4.4** — a ~28KB gz wrapper over IndexedDB with real transactions and `liveQuery`. The alternative (raw `idb`, 3KB) would cost us ~150 lines of transaction plumbing we would then have to test. Dexie's transaction semantics are load-bearing for the telemetry durability guarantee in §6.
- **@supabase/supabase-js 2.112.3** — used for exactly two things on this device: exchanging a device secret for a JWT, and POSTing outbox batches. It is arguably replaceable with 60 lines of `fetch`, and if the bundle budget bites, that is the first thing I cut.

### Why not SQLite-WASM, RxDB, PowerSync, or ElectricSQL

I checked all four and rejected all four.

- **`@sqlite.org/sqlite-wasm@3.53.0` / `sqlocal@0.18.0` / `wa-sqlite@1.0.0`** — OPFS-backed SQLite needs a worker plus `COOP`/`COEP` headers, which fight with Capacitor's `capacitor://localhost` scheme. Our entire query surface is "give me N due items for one patient" and "append events". SQL buys nothing here. It would be ~300KB of WASM and a build-config problem in exchange for query power we do not use.
- **RxDB** — genuinely good, and the wrong shape. Its core is Apache-2.0 but the replication and encryption plugins that would be the *reason* to adopt it are commercially licensed. It also assumes bidirectional document replication with conflict handlers, which §7 shows we do not have.
- **PowerSync** — a hosted sync service. Adds a second vendor, a second bill, and a second thing to configure in the principal's final key-paste step.
- **ElectricSQL / CRDTs (Yjs, Automerge)** — solve concurrent editing of shared state. We have no concurrent editing of shared state.

**We ship zero sync-engine dependencies.** §7 explains why that is a design property, not a gap.

---

## 5. `apps/clinic` — caregiver + researcher

**Runtime deps (6):** `react`, `react-dom`, `react-router@8.3.0`, `@supabase/supabase-js`, `@tanstack/react-query@5.101.4`, `recharts@3.10.1`

Caregiver and researcher share one app because they share every axis that matters: both authenticate with a password, both assume network, both are form/table/chart-driven, both work on desktop and mobile browsers, both deploy to the same static host on the same cadence. They differ in route tree and RLS scope. That is a directory, not an application.

- **react-router 8.3.0** — the clinic app has ~14 routes and needs deep links (a researcher shares a cohort URL with a colleague). Earned.
- **@tanstack/react-query 5.101.4** — ~13KB gz. Earns its place on the researcher dashboards specifically: cached, deduped, background-refetched cohort queries. The caregiver side would survive without it; the researcher side would need me to reimplement it.
- **recharts 3.10.1** — ~95KB gz, **code-split to the researcher routes only** via `React.lazy`. Hand-rolled SVG for time-series, distribution, and cohort-comparison charts would be more code than the dependency.

Media capture here uses **zero dependencies**: `<input type="file" accept="image/*" capture="environment">` for photos, `MediaRecorder` for audio, `createImageBitmap` + `OffscreenCanvas` for downscaling. See §8 for the one exception.

---

## 6. Offline: the care-home tablet, three days, no wifi

This is the requirement that most designs quietly fail. Here is the concrete timeline.

### T-0, last successful sync

The device pulls a **prefetch horizon** (default 14 days) of session plan and *every media blob referenced by it*. Media is stored as `Blob` in Dexie — IndexedDB backs large blobs with files, not heap, so a 300MB cache does not cost 300MB of RAM. Cache ceiling is 300MB per device with LRU eviction. On first run the app calls `navigator.storage.persist()`; inside Capacitor the WKWebView store lives in the app container and is not subject to WebKit's LRU eviction at all, which is a concrete advantage of the native path over a pure PWA.

### Days 1–3, offline

Sessions run entirely from Dexie. `apps/patient` never checks the network before rendering; the network is a background concern with no path into the render tree. There is no spinner, no "you are offline" banner, no degraded mode — because there is no non-degraded mode. **The patient app is offline-first in the strict sense: online is the exception path.**

Every interaction appends a telemetry event. The durability rule:

> **The event and the state change it describes are written in the same IndexedDB transaction.**

Not "update state, then log". If the app is killed mid-write, Dexie rolls back both. No event can exist without its cause and no cause without its event. This is why Dexie's transactions are load-bearing and why I did not use raw `idb`.

Event envelope (from `core/telemetry.ts`):

```ts
{
  event_uuid, device_id, patient_id, session_id, seq,   // monotonic per device
  kind, payload,
  wall_ms,            // Date.now() via Clock port — may be WRONG
  monotonic_ms,       // performance.now() — reliable within a boot
  boot_id,            // regenerated each cold start
  client_version
}
```

**The clock problem, stated honestly.** A care-home tablet's wall clock can be wrong by hours. Research-grade latency data cannot depend on it. So: within-session latency is computed from `monotonic_ms` deltas within a single `boot_id` (always correct). Cross-session and cross-patient ordering uses a server-anchored timestamp — on each successful sync the server records `server_received_at` and the batch carries the device's `wall_ms` at send time, giving a per-batch skew estimate that is applied to that batch's events. Researcher views expose `server_anchored_at` and never raw `wall_ms`. This costs one column and one small function; getting it wrong would silently corrupt the study.

**Storage headroom.** An event serialises to ~250 bytes. 500 events/day × 3 days ≈ 375KB. Even 30 days offline is ~4MB. Telemetry is not the storage risk; media is, and media is read-only. **Eviction policy: media is evicted to make room, the outbox never is.** If storage genuinely fills, the patient loses photos before the study loses data.

### Day 4, wifi returns

Flush is triggered by three things: app foreground (`@capacitor/app`), network online (`@capacitor/network`), and a 60s timer. Batches of 500, oldest first, exponential backoff to a 5-minute ceiling. The server ingests with `INSERT ... ON CONFLICT (event_uuid) DO NOTHING`, so replay after a partial failure is free and the client can safely re-send anything it did not get an explicit ACK for. Rows leave the outbox only on ACK of their exact ids.

### If wifi never returns

Content sync carries a `hard_expiry_at` (default: last sync + 14 days). Past it, the app refuses to render patient content and shows a single "Please reconnect this tablet" screen. This is the enforcement point for revocation (§9) and it is the deliberate resolution of a real tension: **offline tolerance and revocation immediacy are directly opposed, and 14 days is where I am putting the dial.** The outbox is *not* discarded at hard expiry — it survives indefinitely and flushes whenever the device eventually connects.

---

## 7. Sync and conflict

The strongest structural claim in this proposal: **this product has almost no true conflict, and the architecture should refuse to pay for one.**

| Data | Direction | Authority | Conflict? |
|---|---|---|---|
| Cards, media, schedule config | Down only | Server | Impossible — device never writes |
| Telemetry, session results | Up only | Client | Impossible — append-only, UUID-keyed |
| Scheduler state (due dates, difficulty) | **Neither** | Derived | Eliminated by design |

That third row is the trick. Scheduler state is the only thing that looks bidirectional, so **we do not sync it.** The device computes a local projection to pick the next item offline; the server *recomputes it canonically* from the ingested event log. The server derives rather than receives, so there is no write to conflict with. If two devices ran sessions for the same patient while both were offline, their event streams merge by server-anchored order and the derivation is deterministic over the union. Last-writer-wins never arises.

The same derivation function is `core/scheduler.ts`, executed client-side in TypeScript and server-side in a Postgres function or an Edge Function importing the same module. One implementation, one test suite, two execution sites.

This is what buys the zero-sync-engine result in §4.

---

## 8. Media

**Capture** (clinic app, caregiver's phone): file input with `capture` for photos, `MediaRecorder` for audio. Photos are downscaled client-side to 1600px longest edge and encoded WebP q85 — typically 3.2MB → ~180KB, which matters when the caregiver is on cellular and matters more when the tablet has to pull it.

**The audio codec wart, stated plainly.** Safari's `MediaRecorder` produces MP4/AAC; Chrome's produces WebM/Opus; WKWebView does not reliably decode WebM. Since the patient device *is* WKWebView, the patient app must only ever see MP4/AAC. So: prefer `audio/mp4` when `MediaRecorder.isTypeSupported` allows it; on the fallback path, lazy-load `ffmpeg.wasm` (~25MB, loaded once, only for Chrome-family caregivers) and convert at capture time. This is an ugly dependency and I am not hiding it.

It is also an argument *for* the split: that 25MB transcoder lives in `apps/clinic`, is loaded on one code path, and **cannot end up in the patient bundle by accident** because pnpm's strict `node_modules` will not resolve it there. In a single app, keeping it out of the tablet's bundle is a lazy-import discipline problem forever.

**Storage:** Supabase Storage, private bucket, path `media/{patient_id}/{media_id}.{ext}`, encrypted at rest by the provider. Patient devices get 1-hour signed URLs from an RPC scoped by `device_id`. Researchers never receive media URLs of any kind.

**Playback:** always from the local Dexie blob via `URL.createObjectURL`. Never from the network at play time. Instant, offline, no exceptions. WKWebView requires a user gesture before the first audio playback — the session always starts with a tap, and we unlock an `AudioContext` on that tap so no later playback is blocked.

---

## 9. Auth, three roles, and the hard part

### Caregiver and researcher (clinic app)

Supabase Auth, email + password. Researchers additionally require MFA. Role in a `profiles.role` column and mirrored into a JWT custom claim via an auth hook, so RLS reads it without a table join.

### Patient device — no password, on a possibly-stolen shared tablet

This is the genuinely hard part and it is bespoke, so it gets the most detail and the most caveats.

**Enrolment (once, by a caregiver or care-home admin):**

1. In the clinic app, an authorised user provisions a device and gets a one-time 8-character code. Single use, 15-minute TTL.
2. On the tablet, that code is entered once. `POST /functions/v1/enroll-device` validates it, creates a `devices` row, generates a 256-bit `device_secret`, and returns it **exactly once**.
3. The tablet stores `device_secret` in the **iOS Keychain** (Capacitor secure-storage plugin, Secure Enclave-protected, `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` — not synced to iCloud, not extractable by backup). On plain web it goes to IndexedDB, which is **materially weaker**; I recommend shared-tablet mode be Capacitor-only in production and personal-device browser mode be treated as lower assurance.

**Session:**

4. `POST /functions/v1/device-token` exchanges `device_secret` for a short-lived Supabase JWT with custom claims `{ role: 'patient_device', device_id, home_id }` — minted server-side with the service-role key, which never leaves the Edge Function.
5. **The JWT never carries `patient_id`.** On a shared tablet, tapping a face is a *client-side* selection. It grants nothing server-side.

**Why a stolen tablet is contained:**

- **Scope minimisation.** A device is bound to a ward roster (≤12 residents), never a whole home. RLS: `device_id = (auth.jwt()->>'device_id')::uuid` joined through `device_patients`. Data for resident #13 is not merely hidden — it was never fetchable by that token.
- **Grants are near-zero.** The `patient_device` role has `SELECT` on exactly two views (`device_roster`, `device_content`) and `INSERT` on exactly two tables (`telemetry_events`, `session_results`). No `SELECT` on telemetry, no `UPDATE`, no `DELETE`, nothing else in any schema. **A stolen tablet cannot exfiltrate research data through the API at all** — only what is already on it.
- **Encryption at rest.** Local content and media blobs are encrypted with AES-GCM via WebCrypto; the key is wrapped by the Keychain-held secret. Pulling the app container off a compromised device yields ciphertext. On plain web the wrapping key is a non-extractable `CryptoKey` in IndexedDB — better than nothing, not equivalent to Secure Enclave, and I will not pretend otherwise.
- **Remote revocation.** `devices.revoked_at` is checked on every token mint (≤1h). A revoked device fails its next mint and wipes local storage. **Honest limit:** an offline stolen tablet keeps working until `hard_expiry_at` (§6) — up to 14 days. That is the price of the three-day-offline requirement and the dial is explicit and configurable per deployment.
- **Minimal PII on screen.** The roster shows first name and face only. No surname, no DOB, no room number, no diagnosis.
- **Deployment requirement, not a code one:** care-home tablets run in MDM single-app mode or Guided Access. Stated so it lands in the pilot checklist rather than being discovered later.

**Personal-device mode** is the same mechanism with exactly one row in `device_patients`; the app skips the roster. No separate code path, no separate auth model — a deliberate reduction.

---

## 10. Backend and the "paste keys at the end" requirement

Everything developed against local Supabase (`supabase@2.113.0` CLI, Docker): `supabase start`, migrations in `supabase/migrations/*.sql`, `supabase/seed.sql` with a realistic three-family fixture, `supabase gen types typescript --local > packages/core/src/db.generated.ts` wired into a pnpm script.

Deploy-unchanged path: `supabase link` → `supabase db push` → `supabase functions deploy` → set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for each of the two apps. **The principal's final step is two values, twice.** The service-role key exists only as an Edge Function secret and appears in no client build.

**Privacy by design:**

- `consents` — versioned consent text hash, granting party, granted/withdrawn timestamps. A trigger on `telemetry_events` rejects inserts for a patient with no active consent. Enforced in the database, not in application code, so neither client can bypass it.
- **De-identified researcher view** — researchers query `research_sessions` / `research_events`, exposing a per-study stable pseudonym, age band, and metrics. No name, no media, no free text. The pseudonym↔patient mapping lives in a separate schema with **no policies granting the researcher role any access**. Researchers cannot join back; it is not a convention, it is an absent grant.
- **Export** — `export-patient` Edge Function returns a zip of the patient's rows plus full-fidelity media, for the family.
- **Delete** — `delete-patient` cascades content and media, hard-deletes or tombstones telemetry according to the consent record, and flips `devices.revoked_at` so every associated tablet wipes on next contact.

---

## 11. Test infrastructure and the blind-authoring contract

Requirement 9 — test-writers who cannot see the implementation, implementers who cannot see the tests — is the requirement this architecture is best at, because **the contract is a real package, not a document.**

`packages/core` exports schemas, pure function signatures, port interfaces, and (in `core/testing`) an in-memory fake of every port. A test-writer agent is given `packages/core` and nothing else. That is a complete, compilable, executable specification.

**Layer 1 — Domain unit tests.** `vitest@4.1.10` against `core`. Pure functions, injected `Clock`/`Ids`. Runs in ~1–2s. The test-writer needs only the type signatures and doc comments.

**Layer 2 — Port contract suites.** This is the sharpest tool available and it exists *because* of the split. `core/testing` exports parameterised suites:

```ts
export function runOutboxStoreContract(make: () => Promise<OutboxStore>): void
export function runPatientRepoContract(make: () => Promise<PatientRepo>): void
```

The test-writer agent writes the suite against the interface. It is then executed **twice**: once against the Dexie adapter in `apps/patient` (with `fake-indexeddb@6.2.5`) and once against the Supabase adapter in `apps/clinic` (against local Supabase). Two implementers, working blind and independently, must satisfy one suite neither of them wrote. This is as clean as contract-first testing gets.

**Layer 3 — RLS / authorisation tests.** pgTAP via `supabase test db`, plus a TypeScript negative-authorisation suite that authenticates as each of caregiver, researcher, and `patient_device` and asserts precisely what each **cannot** read or write — including the cross-device and cross-patient cases from §9. Written from the policy *spec*, never from the policies. Given §14's risk 3, this is the suite I would gate the pilot on.

**Layer 4 — Integration.** Each app's real data layer against local Supabase, in Node, no browser. Covers sync, idempotent replay, partial-batch failure, and token exchange.

**Layer 5 — E2E.** `@playwright/test@1.62.1`, headless, against seeded local Supabase.
- Patient: `context.setOffline(true)`, then advance the injected `Clock` by 72 hours to run the entire §6 timeline as a deterministic test that takes ~4 seconds. **This is only possible because `Clock` is a port.**
- Clinic: caregiver upload flow (MSW `2.15.0` where a real upload is not the thing under test), researcher cohort and export flows.

Component tests use `@testing-library/react@16.3.2` on `happy-dom@20.11.2`.

**Layer 6 — Native smoke.** Playwright cannot drive WKWebView. This tier is a short manual/XCUITest checklist per release: camera and microphone permission prompts, background/foreground flush, storage survival across a force-quit, audio unlock on first tap. **This is the one tier that is not cheaply automatable, and I am not going to claim otherwise.**

Headless full run target: **under 90 seconds** for layers 1–4, which is the loop the implementer agents actually live in.

---

## 12. Styling

`packages/core` contains no styling whatsoever. Two independent Tailwind 4.3.3 setups. Tailwind 4 is CSS-first (`@theme`), so "shared" means one small `tokens.css` of brand colour primitives imported by both; each app defines its own type scale, spacing scale, and component layer on top.

**Patient:** base font 28px, minimum interactive target 96×96px (WCAG 2.2 AAA asks 44px; dementia guidance wants far more), maximum three interactive elements on screen, no hover states, no gestures beyond tap, no transition under 300ms, 7:1 contrast minimum, **one locked theme with no user-facing theme control** — a patient must not be able to change the appearance of their own app.

**Clinic:** 14–16px base, dense tables, standard form controls, light/dark. Hand-rolled components plus Tailwind; a single headless primitive gets added only if a real focus-trap or combobox accessibility need appears, and not before.

**No `packages/ui`.** Deliberate, and restated here because it is the load-bearing reason the split does not become expensive.

---

## 13. Dependency count and bundle size, honestly

**Direct manifest entries, all four packages, runtime + dev: ~36.**

- `core`: 1 runtime (`zod`)
- `apps/patient`: 4 runtime + 6 Capacitor
- `apps/clinic`: 6 runtime
- Shared dev: vite, @vitejs/plugin-react, typescript, vitest, @playwright/test, msw, happy-dom, fake-indexeddb, @testing-library/react, tailwindcss, eslint, prettier, supabase CLI — ~13
- Root: 0

**The honest part about transitives.** `node_modules` will still contain roughly 700–900 packages and a few hundred MB, dominated by the Vite/Vitest/Playwright/ESLint toolchains. Anyone claiming a "12 dependency" React project is counting manifest lines and hoping you do not look. None of that toolchain ships to a device, but it is all supply-chain surface and it all needs patching.

**Bundle estimates (gzip, not measured — estimates):**

| | Patient | Clinic |
|---|---|---|
| React + ReactDOM | ~45KB | ~45KB |
| Router | — (none) | ~18KB |
| Dexie | ~28KB | — |
| supabase-js | ~40KB | ~40KB |
| react-query | — | ~13KB |
| core | ~12KB | ~12KB |
| app code | ~35KB | ~45KB |
| **Initial** | **~160KB** | **~173KB** |
| Recharts (lazy, researcher routes) | never | +95KB |

The single-app alternative lands at roughly **280–320KB gz on the care-home tablet**, all of it over care-home wifi, on the oldest device in the deployment. The split roughly halves what the worst-connected device must load.

I would hold these with a `size-limit` check in CI that **fails the build if the patient bundle exceeds 200KB gz.** Estimates that are not enforced are wishes.

---

## 14. The path to a real iOS app

**Only `apps/patient` gets Capacitor.** The caregiver and researcher surfaces stay web forever. This alone removes half the App Store work that a single-client architecture would incur.

Current facts, verified: Capacitor **8.5.0**; since 8.3 (2026-03-25) new iOS projects default to **Swift Package Manager** rather than CocoaPods; since **2026-04-28** Apple requires all App Store Connect submissions to be built with **Xcode 26 / iOS 26 SDK**. So the hard prerequisites are a Mac running Xcode 26 and an Apple Developer Program membership ($99/yr).

**What changes:** `npx cap add ios`; `vite build` output feeds `webDir`; `base: './'` because the app is served from `capacitor://localhost`; `viewport-fit=cover` plus `env(safe-area-inset-*)`; a `PrivacyInfo.xcprivacy` manifest declaring the required-reason APIs (UserDefaults, file timestamps).

**What gets easier:** the WKWebView store is app-container-local, so WebKit's eviction policy does not apply and the three-day (and fourteen-day) offline guarantee gets *stronger* than in a browser. And because patient auth is a token exchange rather than OAuth, **there is no custom URL scheme, no `ASWebAuthenticationSession`, no redirect handling** — the auth work that usually eats a week on Capacitor projects simply does not exist here. That is a direct consequence of the split: the app with the complicated auth is the one that stays on the web.

**What needs real work:** WKWebView requires a user gesture before first audio — unlock an `AudioContext` on the session's opening tap. There is no Background Sync API — v1 flushes the outbox on foreground and network events only, which is sufficient because a care-home tablet is opened daily; true background flush would need a ~80-line Swift plugin wrapping `BGTaskScheduler` and is explicitly deferred. iPadOS 26 has deprecated `UIRequiresFullScreen`, so the layout must survive Split View — it is responsive already, but it must be *tested* in Split View.

**Will Apple accept it? Honestly: not automatically, and Guideline 4.2 rejections for web wrappers got materially stricter through 2026.** Two specific risks and their answers:

1. *4.2, "repackaged website."* Our defence is real: there is no public web equivalent of the patient app, and it uses capabilities a browser tab cannot — Keychain/Secure Enclave-backed device identity, an app-container-local encrypted store that survives eviction, haptics, audio session control, and genuine offline-first operation. That is a defensible submission. It is not a guaranteed one.
2. *2.1, "we could not review it."* More likely than 4.2, honestly. A reviewer opens the app and hits an enrolment-code screen with no way past. **Mitigation is procedural:** ship a demo enrolment code and a synthetic demo resident, and put both in App Review notes with a screen recording.

**The stronger recommendation: do not ship to the public App Store first.** Care-home tablets are managed organisational devices. **Apple Business Manager Custom App distribution** delivers privately to named organisations, sidesteps Guideline 4.2 almost entirely, and is the correct distribution model for a clinical pilot. Public App Store becomes a later, optional step once the app has a self-service onboarding story that a reviewer can complete.

**Effort:** ~3–5 days to a working TestFlight build, ~2 further days for privacy manifest, review notes, and demo mode, and ~0.5 day per subsequent release.

---

## 15. The three biggest risks in my own proposal

**1. The core package can rot, and config only partly prevents it.**
The split's whole value rests on `packages/core` staying framework-agnostic. The failure mode is gradual and extremely common: someone adds "just one React hook", then a `useEffect`, then a DOM measurement, and within a month `core` is a React library and the boundary is ceremony. The `"lib": ["ES2023"]` / no-DOM tsconfig and the zero-dependencies rule catch most of it at compile time — but they do not stop the subtler version, where `core` grows an API shaped around one app's rendering needs and the second app has to bend to fit. This is a discipline risk that no configuration fully removes, and it is the risk I would watch hardest in month two.

**2. Two clients means version skew, and I undersold its cost in §2.**
The clinic app deploys continuously; the patient app ships through Apple. A family who has not updated in three months is running an old `core` against a new schema. That is a real, permanent tax the single-app-web-only alternative does not pay. Mitigations: additive-only migrations (never drop or rename a column a shipped client reads), a `min_client_version` gate on the device-token endpoint that can force an update, and a CI job that runs the **oldest supported `core`** against the current database. All three work. All three are ongoing effort, forever. **This is the strongest honest argument against my own position** — and note it is an argument against *shipping iOS at all*, not specifically against the split, since a single-client architecture pays the same tax the moment it enters the App Store.

**3. The device-credential design is bespoke custom auth on a clinical dataset.**
There is no off-the-shelf Supabase primitive for "device identity with no user password", so I am proposing to mint JWTs from an Edge Function using the service-role key. Every classic failure mode is available: a missing enrolment-code expiry check, a `device_id` not verified against the presented secret, an RLS policy that reads `auth.uid()` where it should read the `device_id` claim, a view that forgets the `device_patients` join. Any one of those is a cross-patient breach of dementia-patient data. The mitigations in §11 layer 3 are serious — pgTAP plus a negative-authorisation suite written blind from the spec, plus the near-zero grant surface in §9 — but the honest statement is: **this is custom auth, custom auth is where breaches live, and it needs an independent security review before this touches a real patient.** I would not let the pilot start without one.

---

## 16. What would change my mind

An advocate who concedes nothing is not worth cross-examining.

- **If iOS were genuinely optional**, the split's strongest argument (decoupled release trains) evaporates and the case narrows to bundle size and blast radius — real, but probably not worth a second app.
- **If the patient surface turned out to need only two screens and no offline media**, a single app with a `/patient` route would be the right answer and I would say so.
- **If the caregiver app also had to go native** (e.g. background photo upload), the "only one app needs Capacitor" saving disappears and the split gets meaningfully more expensive.
- **If `packages/core` cannot be kept under ~1,500 lines with one dependency**, the boundary is not paying for itself and should be collapsed.

None of those hold given the stated requirements. All four are worth re-checking at the end of the first milestone.
