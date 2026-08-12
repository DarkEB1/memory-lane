# ADR-001: Data Architecture, Row-Level Security, Consent and Privacy

**Status:** Accepted · **Date:** 2026-08-12 · **Decider:** presiding data architect
**Binding on:** `supabase/migrations/**`, `supabase/functions/**`, `src/contract/**`
**Governed by:** `00-ADR-PLATFORM.md` (binding), `docs/research/00-SYNTHESIS.md` (governing), `docs/design/00-V1-PRODUCT-SHAPE.md` (frozen), `docs/design/00-SCHEDULER-SPEC.md` (frozen)
**Supersedes:** nothing. The three data proposals in this directory are retained as evidence, not as options.

---

## 1. DECISION

**An event-sourced operational core with a physically separated, allow-list research plane that is published in immutable versioned releases.**

Three sentences that carry the whole design:

1. **The append-only event log is the source of truth for everything a device observed, and for the scheduler fold.** This is not a preference; ADR §4.4 and `00-SCHEDULER-SPEC.md` §6 already require a pure fold over a totally-ordered event set, and once one aggregate is derived rather than stored, the log is the truth.
2. **Human-written facts — consent, capacity, adverse events, content, retirement, eligibility — are ordinary append-only rows in `app`, with real `CHECK` constraints and real indexes,** because every access decision this product makes is a predicate over a row and a fold inside an RLS policy is unindexable, uncacheable and unwritable-blind. Where the scheduler needs one of those facts, an `AFTER` trigger emits the corresponding scheduler event into the log, so the log remains the single ordered input to `fold` without anybody inventing synthetic events for a spelling correction.
3. **The research plane is a different set of tables with different rows, holding no `uuid`, no date, no free text and no media reference, written by a one-way projector, and readable only as immutable numbered releases.** Because the only remedy for a full-face photograph is *removal* (synthesis §1.11), the architecture whose default is *removed* is the only correct one — and because a continuously-updating plane leaks the enrolment date through its own update times, it must not be live.

The boundary between tiers 1 and 2 of the operational core is exactly the P21 content/research firewall, for the reason the `event-sourced` proposal identified and which survives cross-examination: *this must be immutable* and *this must be erasable* are genuinely opposed requirements, and the resolution is to guarantee they never apply to the same bytes.

### 1.1 What was taken from each proposal, and what was rejected from each

| From | Adopted | Rejected |
|---|---|---|
| `event-sourced` | log as truth; two tiers on the P21 line; split identity maps; erasure by orphaning; per-device hash chain; real Postgres roles; quarantine rather than silent drop; `dissent_active` absorbing | `select i.*` in a research view; per-batch clock skew; `unique(device_id, seq)` without boot scope; synchronous projection inside the device transaction; a character-class "free-text firewall" that accepts first names; a live research view; `researcher` grants on `ops`; `response_hash`; snapshots |
| `relational-classic` | human-written plane as rows with CHECK constraints; "a table is a cache iff truncate+replay reproduces it", CI-checked against the grant list; full rebuild instead of snapshots; server-verifies-device-computes; `claimed_*` naming discipline (inverted — see §6.6) | consent inside the ingest `WITH CHECK`; research reading the *recomputed* arm; derived-plane constraints that `raise`; destructive rebuild against *current* content; raw `session_id` in research; `alter default privileges` in the researcher-reachable schema |
| `split-planes` | physical plane separation; the allow-list argument; `link`-style schema granted to nobody; keyed (peppered) surrogates; the field manifest as a constraint; per-boot clock anchoring; MCA ss.30–33 as a `CHECK` with no "consented" value on the consultee pathway; `response_token_class`; column-level INSERT grants; purge receipt as an ordinary telemetry event | `anchor_mono_ms := client_sent_mono_ms` (a cross-boot category error); `t_mono_ms` as the sole cross-session time base; `event.type` as a Postgres `enum`; consent-gating the safety register at the projector; `on delete cascade` from devices to events; unvalidated `payload` reaching typed research columns; k-suppression only at export |

### 1.2 The seven fatal findings that forced this shape

Every fatal finding from the adversarial review is answered by a named mechanism, and each mechanism is testable.

| Fatal finding | Mechanism | §|
|---|---|---|
| Research views leak operational UUIDs (`i.*`, `session_id`, UUIDv7 timestamps) | Research plane contains **no `uuid`-typed column at all**; every id is `hmac(id, study_pepper)`; DDL generated from the manifest; pgTAP asserts the column set equals the manifest | §8 |
| A live research plane leaks the enrolment date through row arrival times | Research is published as **immutable numbered releases** on a fixed cadence with a fixed cutoff and a minimum participant history | §8.3 |
| Free-text firewall accepts "Margaret" | Payload strings must be a lowercase snake token, a UUID, a hex digest or a dotted numeric — plus per-key vocabulary validation at ingest and a 5,000-name fuzz test | §6.5 |
| Stimulus provenance destroyed by projection-time joins to mutable content | The **stimulus descriptor is frozen into the event at stimulus paint**; the projector joins nothing mutable | §9 |
| Safety register censored by consent and destroyed by erasure | `research.safety_register` is **not consent-gated and not severed**; it survives on a separate legal basis, coded and anonymous | §7.7, §10.5 |
| Consent in the ingest predicate destroys the evidence of the dissent that triggered it | **Ingest is never consent-gated.** Consent governs use, not receipt | §7.5 |
| A three-day backlog bricks the tablet (CHECK violation, seq collision after reinstall, enum cast, synchronous projection, stale assignment) | Per-row savepoints → quarantine, never batch abort; `seq = boot_ordinal·10⁸ + n` with `boot_ordinal` in the Keychain; `type text` validated against a registry; projection is queued; ingest authorises on *ever-assigned* | §6.4, §6.7 |

---

## 2. RATIONALE

### 2.1 Why not the relational centre, despite its best argument being right

`relational-classic` is right that RLS reasons about rows, and this design agrees with it completely for the human-written plane: consent, capacity, caregiver links, eligibility and content are rows with constraints, not folds. Where it fails is that it took the same instinct one step too far and put `app.consent_is_effective()` inside the `WITH CHECK` on event ingest. The consequence is fatal and was demonstrated: a resident shows behavioural refusal on Monday, a caregiver records it on Tuesday, and the tablet — offline since Sunday — can then never upload the distress events that *are the evidence for the dissent*. Requirement 7 fails, the S6 audit becomes unfalsifiable, and the ADR §5.2 revocation wipe destroys the outbox that was supposedly retaining them.

The correction is one word: consent governs **use**, not **receipt**. Once that word moves, the relational centre's remaining objection — "an event-sourced design needs snapshots, a cadence policy, an upcaster chain, a lag monitor and a read-your-own-writes strategy" — is answered by deleting five of those six things (§6.8, §11), not by abandoning the log.

### 2.2 Why not the pure event-sourced centre

Because its research plane was a deny-list built out of `select i.*`, and because its erasure argument, which is the best in the field, does not require the log to also be the home of consent. The two-tier boundary is kept; the third plane is added.

### 2.3 Why not split-planes as written

Because its clock anchoring subtracts one boot's monotonic clock from another's, which scatters a three-day backlog across a window bearing no relation to when anything happened — the exact scenario the requirement exists for. And because gating the *projector* on consent means an adverse event that occurs five minutes before the family withdraws never crosses at all, which truncates the pilot's most defensible research contribution (M5) precisely on the correlate of harm. Its architecture is right; two of its mechanisms are wrong and are replaced.

### 2.4 The convergence worth noticing

`hard_expiry_days = 7` was chosen in ADR §4.5 to halve the stolen-tablet window. It independently bounds (a) the projection rewind depth, (b) the maximum residency of an erased photograph on an unreachable device, and (c) the S6 offline-continuation residual. One dial, three guarantees, none of them retrofitted.

---

## 3. SCHEMA AND GRANT MAP — the security design on one screen

Ten schemas. Each one exists because it is a distinct grant boundary, and every claim below is provable with a single `information_schema` query that is in the RLS suite.

| Schema | Contains | `device` | `caregiver` | `carehome_admin` | `researcher` | `trial_ops` |
|---|---|---|---|---|---|---|
| `authn` | claim accessors (functions only, no tables) | `USAGE` + `EXECUTE` | ditto | ditto | ditto | ditto |
| `ingest` | the device's **two** write targets | `USAGE` + column-scoped `INSERT` | — | — | — | — |
| `device` | the device's **two** read views | `USAGE` + `SELECT` | — | — | — | — |
| `log` | event log, boot anchors, chain, quarantine, queue, content audit | — | — | — | — | — |
| `app` | the mutable identifiable plane | — | `USAGE`, RLS-scoped CRUD | ditto, home-scoped | — | — |
| `proj` | operational projections | — | — (reads `app.*` views) | — | — | — |
| `identity` | the two maps and the study pepper | — | `SELECT` on `subject_map` under RLS | ditto | **nothing. no `USAGE`.** | — |
| `research` | projected pseudonymous **tables**, releases, manifest | — | — | — | **nothing. no `USAGE`.** | — |
| `analysis` | release-scoped definer views | — | — | — | `USAGE` + `SELECT` | — |
| `ops` | trial-operations console views | — | — | — | **nothing** | `USAGE` + `SELECT` |

```sql
-- Assertion 1: the device's entire reachable surface. Must return exactly four rows.
select table_schema, table_name, privilege_type
from information_schema.role_table_grants where grantee = 'device';
--   device | device_content | SELECT
--   device | device_roster  | SELECT
--   ingest | event          | INSERT
--   ingest | session        | INSERT

-- Assertion 2: the researcher's reachable surface. Must return exactly one schema.
select distinct table_schema from information_schema.role_table_grants where grantee = 'researcher';
--   analysis

-- Assertion 3: nobody can reach the bridge.
select 1 from information_schema.usage_privileges
 where object_schema in ('identity','research','log','proj')
   and grantee in ('device','caregiver','carehome_admin','researcher','trial_ops','authenticated','anon');
--   0 rows
```

### 3.1 Roles — real Postgres roles, not JWT string comparison

If `researcher` is only a string in `app_metadata` and every logged-in user holds `authenticated`, then "de-identification is a missing grant" is a `WHERE` clause in disguise, which ADR §5.4 forbids. So:

```sql
create role device         nologin noinherit;
create role caregiver      nologin noinherit;
create role carehome_admin nologin noinherit;
create role researcher     nologin noinherit;
create role trial_ops      nologin noinherit;
grant device, caregiver, carehome_admin, researcher, trial_ops to authenticator;

-- Owners. NONE of these is granted to authenticator, so no JWT can ever become one.
create role log_writer     nologin noinherit;   -- owns log.*, ingest.*, the canonicaliser
create role app_view_owner nologin noinherit;   -- owns device.* and the caregiver definer views
create role bridge         nologin noinherit;   -- owns identity.*, research.*, analysis.*
create role ops_view_owner nologin noinherit;   -- owns ops.*

-- The floor, established before any object exists.
revoke all on schema public from public, anon, authenticated;
revoke all on all tables in schema public from public, anon, authenticated;
alter default privileges revoke all on tables    from public, anon, authenticated;
alter default privileges revoke all on functions from public, anon, authenticated;
alter default privileges revoke all on sequences from public, anon, authenticated;
```

`bridge` is the only principal in the database with `SELECT` on `identity.participant_map` and on `identity.study_pepper`, and it cannot log in. That is what makes de-identification structural rather than aspirational. `bridge` has **`SELECT` only** on `app`, `log` and `proj` — it physically cannot write back, which is the "one-way" in one-way bridge.

**Week-1 verification gate, not an assumption.** Build a throwaway Supabase project, create `researcher`, `grant researcher to authenticator`, install the access-token hook, and prove that `select 1 from app.patients` as a researcher JWT returns `42501` and not zero rows. If custom roles are not honoured end-to-end by PostgREST and `supabase-js` on the target plan, the fallback is a second PostgREST deployment with `PGRST_DB_ANON_ROLE=researcher`, which preserves the property at the cost of one deployment target. **Discovering this at handoff is not acceptable; it is ADR open risk 7's data-layer twin.**

### 3.2 The access-token hook

```sql
create schema authn;

create or replace function authn.access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  meta   jsonb := coalesce(event #> '{claims,app_metadata}', '{}'::jsonb);
  r      text  := meta ->> 'role';
  claims jsonb := event -> 'claims';
begin
  -- app_metadata ONLY. user_metadata is client-writable and is never read here.
  if r is null or r not in ('device','caregiver','carehome_admin','researcher','trial_ops') then
    r := 'authenticated';                    -- which has had every grant revoked. Fails closed.
  end if;
  claims := jsonb_set(claims, '{role}',         to_jsonb(r));
  claims := jsonb_set(claims, '{device_id}',    coalesce(meta -> 'device_id',    'null'::jsonb));
  claims := jsonb_set(claims, '{care_home_id}', coalesce(meta -> 'care_home_id', 'null'::jsonb));
  return jsonb_set(event, '{claims}', claims);
end $$;

grant usage on schema authn to supabase_auth_admin, device, caregiver, carehome_admin, researcher, trial_ops;
grant execute on function authn.access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function authn.access_token_hook(jsonb) from public, anon, authenticated;

create or replace function authn.jwt_role() returns text
language sql stable set search_path = '' as $$
  select current_setting('request.jwt.claims', true)::jsonb ->> 'role' $$;

create or replace function authn.device_id() returns uuid
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'device_id','')::uuid $$;

create or replace function authn.care_home_id() returns uuid
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'care_home_id','')::uuid $$;

grant execute on function authn.jwt_role(), authn.device_id(), authn.care_home_id()
  to device, caregiver, carehome_admin, researcher, trial_ops;
```

The unrecognised-role branch is the load-bearing one. An absent, misspelled or forged role lands on `authenticated`, which holds nothing anywhere.

---

## 4. IDENTITY — three tables, disjoint readers

This is the smallest structure in the design and the one everything else rests on.

```sql
create schema identity authorization bridge;
revoke all on schema identity from public, anon, authenticated, device, researcher, trial_ops;
grant usage on schema identity to caregiver, carehome_admin;   -- for subject_map ONLY

-- subject_id <-> patient_id. Caregivers and admins may read their own rows, RLS-scoped.
-- ON DELETE RESTRICT, deliberately: a patient row cannot be deleted while a live mapping
-- exists, so the erasure orchestrator must sever FIRST, as its own step. That is the
-- difference between "we deleted them" and "we deleted them and also silently destroyed
-- a REC-approved dataset because a foreign key happened to cascade."
create table identity.subject_map (
  subject_id  uuid primary key default gen_random_uuid(),
  patient_id  uuid not null unique references app.patients(id) on delete restrict,
  created_at  timestamptz not null default now()
);

-- subject_id <-> participant_code. NO LOGIN ROLE MAY READ THIS.
-- Also the anchor for every temporal derivation, and the randomisation subkey.
create table identity.participant_map (
  participant_code   text primary key
                     check (participant_code ~ '^P-[0-9A-HJ-NP-TV-Z]{8}$'),   -- Crockford, no vowels
  study_id           uuid not null,               -- deliberately NOT an FK: no constraint crosses a plane
  subject_id         uuid unique,                 -- NULLED on severance. Not an FK: it must outlive the map.
  enrolled_on        date not null,               -- day 0. The date that never crosses.
  tz_offset_minutes  int  not null check (tz_offset_minutes between -720 and 840),
  allocation_subkey  bytea not null default gen_random_bytes(32),
  severed_at         timestamptz,
  severance_scope    text check (severance_scope in ('prospective','retrospective')),
  created_at         timestamptz not null default now()
);

-- One pepper per study. Held in Supabase Vault; this row is a Vault reference, not the bytes.
create table identity.study_pepper (
  study_id        uuid primary key,               -- again: no FK crosses a plane boundary
  vault_secret_id uuid not null                   -- pgsodium/Vault key id. Never the raw pepper.
);

-- The anchor is the axis of every derived temporal variable AND of the scheduler's localDayIndex.
-- It cannot move once any event exists; corrections are a superseding row with a case_ref.
create or replace function identity.freeze_anchor() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.enrolled_on is distinct from old.enrolled_on
      or new.tz_offset_minutes is distinct from old.tz_offset_minutes)
     and old.subject_id is not null
     and exists (select 1 from log.event_log e where e.subject_id = old.subject_id) then
    raise exception 'the day-0 anchor is frozen once telemetry exists (use a superseding row)'
      using errcode = '23514';
  end if;
  return new;
end $$;
create trigger participant_anchor_frozen before update on identity.participant_map
  for each row execute function identity.freeze_anchor();

alter table identity.subject_map      enable row level security;
alter table identity.subject_map      force  row level security;
alter table identity.participant_map  enable row level security;
alter table identity.participant_map  force  row level security;
alter table identity.study_pepper     enable row level security;
alter table identity.study_pepper     force  row level security;

grant select on identity.subject_map to caregiver, carehome_admin;
-- identity.participant_map, identity.study_pepper: granted to NOBODY. Reached only by `bridge`,
-- which owns the schema, and by SECURITY DEFINER functions owned by `bridge`.

create policy subject_map_caregiver on identity.subject_map for select to caregiver
using (exists (select 1 from app.patient_caregivers pc
               where pc.patient_id = subject_map.patient_id
                 and pc.user_id = auth.uid() and pc.removed_at is null));

create policy subject_map_admin on identity.subject_map for select to carehome_admin
using (exists (select 1 from app.patients p
               where p.id = subject_map.patient_id
                 and p.care_home_id = authn.care_home_id()));
```

**The property that matters, stated at exactly its true strength.** `caregiver` can bridge `subject_id → patient_id` for their own patient and nothing else. `researcher` has no `USAGE` on `identity` and no `uuid` anywhere in anything they can query, so they hold neither half. `bridge` can compose `participant_code → subject_id → patient_id` and cannot log in, is not granted to `authenticator`, and is not a member of any role that is. **No login principal, and no pair of colluding login principals, can traverse the map.** This is not a claim about `service_role` holders, dashboard users, backup holders or the platform operator; §14.3 enumerates those and says which are unmitigated.

**Severance, not deletion.** `participant_map.subject_id` is nullable and is deliberately **not** a foreign key, so that severance is an explicit step rather than a side effect of a cascade (§10.5). Severance nulls `subject_id`, `enrolled_on`, `tz_offset_minutes` and the allocation subkey. What survives is `participant_code`, `study_id`, `severed_at` and `severance_scope` — enough for the CONSORT flow diagram and for the safety register's denominator (§7.7), and nothing that identifies anybody.

**Immutability of the anchor.** `enrolled_on` and `tz_offset_minutes` are the axes of every derived temporal variable and the scheduler's `localDayIndex`. A trigger raises if either changes once any event exists for that subject; corrections go through a superseding row carrying a `case_ref`, and `research.participant_status.anchor_corrected_in_release` records that the axis moved. A coordinator tidying a date in week 6 must not silently shift eight weeks of published figures.

---

## 5. THE OPERATIONAL PLANE — `app`

27 tables. Mutable, identifiable, erasable. This is where the photographs live and it is the only place a name exists.

### 5.1 Tenancy and people

```sql
create schema app;
revoke all on schema app from public, anon, authenticated, device, researcher, trial_ops;
grant usage on schema app to caregiver, carehome_admin;

create type app.membership_role   as enum ('caregiver','carehome_admin','study_staff','clinician');
create type app.person_status     as enum ('living','deceased','estranged','do_not_show');
create type app.relationship_category as enum
  ('spouse_partner','child','grandchild','sibling','parent','other_family',
   'friend','neighbour','carer_professional','pet','self','other');
create type app.release_basis     as enum
  ('subject_is_patient','self_recorded_consented','written_release','verbal_release_attested',
   'deceased_estate','none_held');
create type app.media_kind        as enum ('photo','voice_caption','narration_recording','music_local');
create type app.media_state       as enum ('uploading','ready','quarantined','deleted');
create type app.dementia_subtype  as enum
  ('AD','PCA','svPPA','other_PPA','DLB','vascular','FTD_behavioural','mixed','MCI_unspecified','unknown');
create type app.consent_pathway   as enum ('direct','supported','consultee');
create type app.consent_purpose   as enum
  ('care_delivery','research_behavioural','research_speech_features',
   'media_retention','third_party_imagery','contact_for_followup');
create type app.consent_event_type as enum
  ('initial','reaffirmation','dissent_observed','withdrawal','capacity_change',
   'consultee_change','purpose_change','reinstated','paused_review_overdue');
create type app.consent_outcome   as enum
  ('subject_consented','subject_declined','subject_withdrew',
   'consultee_advises_inclusion','consultee_advises_exclusion','consultee_advises_withdrawal',
   'dissent_observed','paused','reinstated');
create type app.dissent_channel   as enum
  ('patient_control','caregiver_report','repeated_abandonment','repeated_skip','staff_report');
-- There is no 'inferred_classifier' value and there never will be. P18 / ND-15 / EU AI Act 5(1)(f).
create type app.capacity_status   as enum ('has_capacity','fluctuating','lacks_capacity','not_assessed');
create type app.withdrawal_scope  as enum ('prospective','retrospective');
create type app.adverse_category  as enum
  ('distress','catastrophic_reaction','bereavement_confrontation','carer_distress',
   'acute_change_suspected_delirium','other');
create type app.adverse_severity  as enum ('mild','moderate','severe');
create type app.retired_by_role   as enum ('caregiver','clinician');   -- NO 'algorithm'. P3 / ND-8.
create type app.erasure_stage     as enum
  ('requested','revocations_issued','storage_purged','content_deleted','map_severed',
   'awaiting_devices','complete','failed');

create table app.care_homes (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('care_home','household')),
  name             text not null,
  country_locale   text not null check (country_locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  hard_expiry_days int  not null default 7 check (hard_expiry_days between 4 and 14),   -- ADR §4.5
  data_controller  text not null,
  dpa_reference    text,
  rec_approval_ref text not null,             -- B5: a home without REC approval cannot exist
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table app.user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  email_at_signup text not null,
  created_at      timestamptz not null default now(),
  disabled_at     timestamptz
);

create table app.memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references app.user_profiles(id) on delete cascade,
  care_home_id uuid references app.care_homes(id) on delete cascade,
  role         app.membership_role not null,
  granted_by   uuid references app.user_profiles(id),
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz,
  unique (user_id, care_home_id, role)
);
create index on app.memberships (user_id) where revoked_at is null;
```

`app.patients` carries identity, eligibility and the §7 `participant` context in one row, because splitting them buys a second RLS policy set and nothing else.

```sql
create table app.patients (
  id                    uuid primary key default gen_random_uuid(),
  care_home_id          uuid not null references app.care_homes(id) on delete restrict,
  auth_user_id          uuid unique references auth.users(id) on delete set null,  -- P22
  -- identity: never crosses any plane boundary
  display_first_name    text not null,          -- the ONLY name a device ever sees
  full_name             text not null,
  birth_year            smallint not null check (birth_year between 1900 and 1990),
  grew_up_locality      text,
  first_language        text not null default 'en',
  content_language      text not null default 'en',           -- P14, per participant
  avatar_media_id       uuid,                                  -- FK added after media_objects
  -- study axes, frozen at enrolment
  enrolled_on           date,
  tz_offset_minutes     int check (tz_offset_minutes between -720 and 840),  -- scheduler §1.4
  ui_version_pinned     text,                                  -- P10
  -- clinical context (§7 `participant`)
  dementia_subtype      app.dementia_subtype not null default 'unknown',
  severity_band         text check (severity_band in ('mild','moderate')),
  fluctuation_band      text not null default 'standard' check (fluctuation_band in ('standard','high')),
  years_education_band  text check (years_education_band ~ '^[0-9]{1,2}-[0-9]{1,2}$'),
  prior_computer_use    smallint check (prior_computer_use between 0 and 4),
  apathy_score          smallint check (apathy_score between 0 and 12),        -- NPI-Q apathy
  hearing_aid_use       boolean,
  corrected_vision      boolean,
  -- P17 content guards
  era_blocklist         text[] not null default '{}',
  theme_blocklist       text[] not null default '{}',
  -- P23 ceiling: the set of permissions the patient UI states in plain words
  disclosed_permissions text[] not null default '{view_moments,author_content}',
  -- runtime gates
  processing_paused_at  timestamptz,             -- set by the dissent trigger. §7.4
  withdrawn_on          date,
  erased_at             timestamptz,
  created_at            timestamptz not null default now(),
  -- ND-35 / P26 / §9 Gate 3: an excluded participant's row CANNOT EXIST
  constraint subtype_exclusion check (enrolled_on is null or dementia_subtype not in ('PCA','svPPA')),
  constraint enrolled_needs_axes check (enrolled_on is null
    or (tz_offset_minutes is not null and ui_version_pinned is not null))
);
create index on app.patients (care_home_id) where erased_at is null;

create table app.patient_caregivers (               -- P23
  patient_id            uuid not null references app.patients(id) on delete cascade,
  user_id               uuid not null references app.user_profiles(id) on delete cascade,
  relationship          app.relationship_category not null,
  can_author_content    boolean not null default true,
  can_view_moments      boolean not null default true,
  can_receive_p25_alert boolean not null default false,
  can_manage_consent    boolean not null default false,
  is_consultee          boolean not null default false,
  is_paid_professional  boolean not null default false,
  is_primary            boolean not null default false,
  added_by              uuid references app.user_profiles(id),
  added_at              timestamptz not null default now(),
  removed_at            timestamptz,
  removed_by            uuid references app.user_profiles(id),
  removal_reason        text,
  removal_requested_by_patient boolean not null default false,
  primary key (patient_id, user_id),
  -- B12: paid carers cannot be personal consultees, and cannot hold consent authority
  constraint paid_carer_is_not_a_consultee check (not (is_paid_professional and is_consultee)),
  constraint paid_carer_cannot_manage_consent check (not (is_paid_professional and can_manage_consent))
);
create unique index one_primary_caregiver on app.patient_caregivers (patient_id)
  where is_primary and removed_at is null;
create unique index one_p25_recipient on app.patient_caregivers (patient_id)
  where can_receive_p25_alert and removed_at is null;
create index on app.patient_caregivers (user_id) where removed_at is null;

-- P23 made enforceable: a caregiver can never hold a permission the patient was not told about.
create or replace function app.enforce_disclosure() returns trigger
language plpgsql security definer set search_path = '' as $$
declare disclosed text[];
begin
  select disclosed_permissions into disclosed from app.patients where id = new.patient_id;
  if (new.can_author_content   and 'author_content'  <> all(disclosed))
  or (new.can_view_moments     and 'view_moments'    <> all(disclosed))
  or (new.can_receive_p25_alert and 'receive_alerts' <> all(disclosed))
  or (new.can_manage_consent   and 'manage_consent'  <> all(disclosed)) then
    raise exception 'permission not disclosed to the patient (P23)' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger caregiver_permission_disclosure before insert or update on app.patient_caregivers
  for each row execute function app.enforce_disclosure();

create table app.enrolment_screenings (              -- product shape §9. Never scored, never rendered.
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references app.patients(id) on delete cascade,
  screened_on           date not null,
  respondent_role       text not null check (respondent_role in ('caregiver','referrer')),
  subtype_of_record     app.dementia_subtype not null default 'unknown',
  pca_positive_count    smallint not null check (pca_positive_count   between 0 and 4),
  svppa_positive_count  smallint not null check (svppa_positive_count between 0 and 4),
  dlb_positive_count    smallint not null check (dlb_positive_count   between 0 and 4),
  acute_change_flag     boolean not null,
  sensory_checked       boolean not null,
  outcome               text not null check (outcome in
                          ('eligible','eligible_flagged','deferred_acute','deferred_sensory','excluded')),
  reviewed_by_clinician uuid not null references app.user_profiles(id),
  reviewed_at           timestamptz not null,
  constraint pca_excluded   check (outcome not in ('eligible','eligible_flagged') or pca_positive_count   < 2),
  constraint svppa_excluded check (outcome not in ('eligible','eligible_flagged') or svppa_positive_count < 2),
  unique (patient_id, screened_on)
);
```

Those two `CHECK`s are ND-35 made unforgeable at the storage layer: a row asserting eligibility with two PCA positives cannot be committed by any code path, including `service_role`. The clearest avoidable harm in the product is not preventable by a screen someone might skip.

### 5.2 Consent, capacity and dissent

Three tables and one function. The function is the only thing anything else calls.

```sql
create table app.consent_events (                    -- append-only. UPDATE and DELETE are revoked.
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references app.patients(id) on delete cascade,
  event_type       app.consent_event_type not null,
  pathway          app.consent_pathway not null,
  purpose          app.consent_purpose not null,
  outcome          app.consent_outcome not null,
  effective_from   timestamptz not null default now(),
  reaffirm_due_on  date,
  withdrawal_scope app.withdrawal_scope,
  consultee_user_id uuid references app.user_profiles(id),
  subject_assent   text check (subject_assent in ('assented','no_objection_observed','not_obtainable')),
  dissent_channel  app.dissent_channel,
  dissent_scope    text check (dissent_scope in ('session','item','research_use','all')),
  related_item_id  uuid,
  linked_session_id uuid,
  recorded_by      uuid references app.user_profiles(id),
  recorded_by_role text not null check (recorded_by_role in
                     ('patient','caregiver','consultee','clinician','study_staff')),
  protocol_version text, form_version text, evidence_ref text,
  notes            text,                              -- operational plane only. NEVER projected.
  created_at       timestamptz not null default now(),

  -- MCA 2005 ss.30-33 AS A CHECK. On the consultee pathway there is NO VALUE THAT MEANS CONSENTED.
  constraint only_the_subject_consents check (
     (pathway in ('direct','supported')
       and outcome in ('subject_consented','subject_declined','subject_withdrew','dissent_observed',
                       'paused','reinstated'))
  or (pathway = 'consultee'
       and outcome in ('consultee_advises_inclusion','consultee_advises_exclusion',
                       'consultee_advises_withdrawal','dissent_observed','paused','reinstated'))),
  -- a caregiver may never be the recorder of a "the subject consented" row, on any pathway
  constraint subject_outcomes_recorded_by_subject_or_clinician check (
     outcome not in ('subject_consented','subject_declined')
     or recorded_by_role in ('patient','clinician','study_staff')),
  -- entry is harder than exit: only a clinician or study staff may admit; anyone may object
  constraint entry_requires_clinical_authority check (
     event_type not in ('initial','reaffirmation','capacity_change','consultee_change',
                        'purpose_change','reinstated')
     or recorded_by_role in ('clinician','study_staff')),
  constraint consultee_pathway_names_a_consultee check (
     pathway <> 'consultee' or consultee_user_id is not null),
  constraint dissent_states_its_channel check (
     outcome <> 'dissent_observed' or dissent_channel is not null),
  constraint withdrawal_states_its_scope check (
     event_type <> 'withdrawal' or withdrawal_scope is not null),
  constraint grants_carry_a_reaffirm_date check (
     event_type not in ('initial','reaffirmation') or reaffirm_due_on is not null)
);
create index on app.consent_events (patient_id, purpose, effective_from desc);

create table app.capacity_records (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references app.patients(id) on delete cascade,
  status           app.capacity_status not null,
  assessed_by      uuid not null references app.user_profiles(id),
  assessed_by_role text not null check (assessed_by_role in ('clinician','study_staff')),
  instrument       text,
  assessed_on      date not null,
  review_due_on    date not null,
  basis_coded      text,
  created_at       timestamptz not null default now(),
  constraint review_is_after_assessment check (review_due_on > assessed_on)
);
create index on app.capacity_records (patient_id, assessed_on desc);

-- Materialisation of the log. A pgTAP test drops it, rebuilds it from consent_events,
-- and asserts an identical table.
create table app.consent_state (
  patient_id      uuid not null references app.patients(id) on delete cascade,
  purpose         app.consent_purpose not null,
  permitted       boolean not null,
  pathway         app.consent_pathway not null,
  since           timestamptz not null,
  reaffirm_due_on date,
  dissent_active  boolean not null default false,
  last_event_id   uuid not null references app.consent_events(id),
  primary key (patient_id, purpose)
);
```

The gate every other object calls:

```sql
create or replace function app.consent_permits(p_patient uuid, p_purpose app.consent_purpose)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select cs.permitted
       and not cs.dissent_active
       and (cs.reaffirm_due_on is null or cs.reaffirm_due_on >= current_date)
       and (cs.pathway <> 'consultee' or app.capacity_review_current(p_patient))
    from app.consent_state cs
    where cs.patient_id = p_patient and cs.purpose = p_purpose), false)
  and not exists (select 1 from app.patients p
                  where p.id = p_patient
                    and (p.processing_paused_at is not null or p.erased_at is not null));
$$;

create or replace function app.capacity_review_current(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select cr.review_due_on >= current_date
                     from app.capacity_records cr
                    where cr.patient_id = p_patient
                    order by cr.assessed_on desc, cr.created_at desc limit 1), false);
$$;
```

`coalesce(..., false)` on capacity: **no capacity record means not current.** Absence of evidence is not consent.

### 5.3 Devices and enrolment

ADR §5.2 verbatim in shape, with the two additions the erasure ledger and the dead-man expiry require.

```sql
create table app.devices (
  id                  uuid primary key default gen_random_uuid(),
  auth_user_id        uuid not null unique references auth.users(id) on delete restrict,
  care_home_id        uuid not null references app.care_homes(id) on delete restrict,
  mode                text not null check (mode in ('personal','shared')),
  label               text not null,
  hard_expiry_days    int  not null default 7 check (hard_expiry_days between 4 and 14),
  enrolled_at         timestamptz,
  last_seen_at        timestamptz,
  last_sync_at        timestamptz,
  content_valid_until timestamptz,
  client_version      text,
  outbox_backlog_est  int,
  revoked_at          timestamptz,
  revoked_by          uuid references app.user_profiles(id),
  revoked_reason      text
);

create table app.device_patients (
  device_id     uuid not null references app.devices(id) on delete restrict,
  patient_id    uuid not null references app.patients(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz,                    -- SOFT. The erasure ledger and the ingest gate need it.
  primary key (device_id, patient_id)
);
create index on app.device_patients (patient_id);

create table app.enrolment_codes (
  code_hash   text primary key,                 -- sha256(code). The code is never stored.
  device_id   uuid not null references app.devices(id) on delete cascade,
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  attempts    int not null default 0 check (attempts <= 5)
);
```

`auth_user_id` and `device_id` are `on delete restrict`, not cascade. **Deleting a device must never be able to delete telemetry.** A pgTAP assertion proves there is no `CASCADE` path from `auth.users` or `app.devices` to `log.event_log`.

`unassigned_at` rather than a row delete: which patients a device *held* is exactly what the erasure ledger needs, and it is what lets a reassigned tablet still deposit the three days of telemetry it is holding (§6.7).

### 5.4 Depicted persons, media, content

`app.depicted_persons` is where synthesis §1.11 lands in the schema. A depicted person is a human being who appears in a photograph or a recording and who is, in the overwhelming majority of cases, not a user and has never consented to anything — including, and this is the case every proposal missed, **the caregiver whose own voice is on the narration**.

```sql
create table app.depicted_persons (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references app.patients(id) on delete cascade,
  display_name       text not null,                       -- the answer string. Typed by a human.
  relationship       app.relationship_category not null,
  -- P16 / ND-12: mandatory, unskippable, NOT NULL with NO DEFAULT.
  person_status      app.person_status not null,
  is_the_patient     boolean not null default false,
  linked_user_id     uuid references app.user_profiles(id),   -- set when the depicted person IS a user
  -- third-party consent chain. NOT NULL with no default: absence of a claim is not absence of a person.
  release_basis      app.release_basis not null,
  release_attested_by uuid references app.user_profiles(id),
  release_attested_at timestamptz,
  release_jurisdiction text,                               -- 'US-IL' etc. Drives the B3 opinion.
  release_evidence_ref text,
  release_revoked_at timestamptz,
  -- P16: deceased/estranged content is permitted for narration and defaults OFF for recognition
  recognition_override_at timestamptz,
  recognition_override_by uuid references app.user_profiles(id),
  recognition_override_rationale text,
  created_by         uuid not null references app.user_profiles(id),
  created_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  constraint override_needs_author check
    ((recognition_override_at is null) = (recognition_override_by is null)),
  constraint patient_self_release check
    (not is_the_patient or release_basis = 'subject_is_patient'),
  constraint attested_release_names_an_attestor check
    (release_basis in ('subject_is_patient','none_held') or release_attested_by is not null)
);
comment on table app.depicted_persons is
  'BIPA/CUBI/Washington scope note: NO face template, embedding, descriptor, bounding box, '
  'voiceprint or speaker identifier column exists in ANY schema, by construction. P20 / ND-17. '
  'The recording caregiver is a depicted person of their own voice and holds their own release row.';

create table app.media_objects (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references app.patients(id) on delete cascade,
  kind           app.media_kind not null,
  sha256         bytea not null check (octet_length(sha256) = 32),
  storage_path   text not null unique,              -- patient/<patient_id>/<hex sha256>
  mime           text not null,
  bytes          bigint not null check (bytes > 0 and bytes <= 52428800),
  duration_ms    int,
  state          app.media_state not null default 'uploading',
  -- NOT NULL, NO DEFAULT. The permissive value must never be reachable by omission.
  depicts_third_party_face  boolean not null,
  depicts_third_party_voice boolean not null,
  no_persons_depicted_attested_by uuid references app.user_profiles(id),
  captured_by    uuid not null references app.user_profiles(id),
  destroy_by     date not null,                     -- BIPA §15(a): a retention schedule, enforced
  destroyed_at   timestamptz,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (patient_id, sha256),
  constraint audio_container_is_mp4 check (          -- ADR §8, the webm/opus trap, in the schema
    kind not in ('voice_caption','narration_recording','music_local')
    or mime in ('audio/mp4','audio/m4a','audio/aac')),
  constraint photo_mime check (kind <> 'photo' or mime in ('image/jpeg','image/png','image/heic')),
  constraint storage_path_matches check
    (storage_path = 'patient/' || patient_id::text || '/' || encode(sha256,'hex'))
);

create table app.media_subjects (
  media_id           uuid not null references app.media_objects(id) on delete cascade,
  depicted_person_id uuid not null references app.depicted_persons(id) on delete cascade,
  appears_as         text not null check (appears_as in ('face','voice','both')),
  tagged_by          uuid not null references app.user_profiles(id),
  tagged_at          timestamptz not null default now(),
  primary key (media_id, depicted_person_id)
);
```

Content addressing is **scoped per patient, not globally.** Two residents who upload the same wedding photograph store it twice. That costs bytes and buys the single most important property in the deletion model: one patient's erasure can never delete another patient's object, so the storage purge is a prefix delete with no reference counting and no concurrency hazard.

**The release check is not vacuous, and it runs at upload, not at attach.** The vacuous-truth hole ("every depicted person holds a release" is satisfied by the empty set) is closed by making readiness impossible without a claim:

```sql
create or replace function app.enforce_media_release() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n_subjects int; n_unreleased int;
begin
  if new.state <> 'ready' then return new; end if;

  select count(*) into n_subjects from app.media_subjects ms where ms.media_id = new.id;

  -- Absence of a tag must not read as absence of a person. Either name someone, or attest nobody.
  if n_subjects = 0 and new.no_persons_depicted_attested_by is null then
    raise exception 'media % may not become ready: name its depicted persons or attest that it '
                    'depicts none (BIPA 15(b) notice-before-collection)', new.id using errcode = '23514';
  end if;

  select count(*) into n_unreleased
  from app.media_subjects ms
  join app.depicted_persons dp on dp.id = ms.depicted_person_id
  where ms.media_id = new.id
    and (dp.release_basis = 'none_held' or dp.release_revoked_at is not null);

  if n_unreleased > 0 then
    raise exception 'media % carries % depicted person(s) with no release', new.id, n_unreleased
      using errcode = '23514';
  end if;

  if (new.depicts_third_party_face  and not exists (select 1 from app.media_subjects ms
        join app.depicted_persons dp on dp.id = ms.depicted_person_id
        where ms.media_id = new.id and ms.appears_as in ('face','both') and not dp.is_the_patient))
  or (new.depicts_third_party_voice and not exists (select 1 from app.media_subjects ms
        where ms.media_id = new.id and ms.appears_as in ('voice','both'))) then
    raise exception 'media % declares a third-party biometric with no matching subject row', new.id
      using errcode = '23514';
  end if;
  return new;
end $$;
create trigger media_release_gate before insert or update on app.media_objects
  for each row execute function app.enforce_media_release();
```

This applies to **every** mechanic, not only recognition. BIPA §15(b) attaches to collection and storage, not to whether we later asked a question about the face. And a `voice_caption` recorded by the daughter cannot become `ready` until she exists as a `depicted_persons` row with `release_basis = 'self_recorded_consented'` and her own `linked_user_id` — which is what makes her Article 15 and Article 17 requests answerable. She is the third data subject class the DPIA must name.

```sql
create table app.decks (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  label      text not null default 'Family',
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index one_active_deck_per_patient on app.decks (patient_id) where archived_at is null;

create table app.items (
  id                 uuid primary key default gen_random_uuid(),
  deck_id            uuid references app.decks(id) on delete cascade,
  patient_id         uuid references app.patients(id) on delete cascade,
  depicted_person_id uuid references app.depicted_persons(id) on delete restrict,
  kind               text not null check (kind in
                       ('identity_card','month_target','narration_prompt','saying','song','probe_face')),
  content_class      text not null check (content_class in
                       ('person_identity','place','event','object','saying','song','probe_face')),
  headline_name      text,
  one_sentence       text,                          -- P12 / M-27. TTS reads it. Never AI (P19).
  era_decade         smallint check (era_decade between 1900 and 2030 and era_decade % 10 = 0),
  content_language   text not null default 'en',
  tier               smallint not null default 2 check (tier in (1,2,3)),
  is_probe           boolean not null default false,
  content_is_generic boolean not null default false,
  content_provenance text not null check (content_provenance in
                       ('family_upload','generic_library','physical_scan')),
  caregiver_rated_valence    smallint check (caregiver_rated_valence between -2 and 2),
  caregiver_rated_importance smallint check (caregiver_rated_importance between 1 and 5),
  recognition_enabled boolean not null default true,
  is_month_target    boolean not null default false,          -- M-25
  content_ready      boolean not null default false,          -- ADR §4.2
  -- P3 / ND-8: retirement is human-only. app.retired_by_role has no 'algorithm' variant.
  retired_at         timestamptz,
  retired_by_role    app.retired_by_role,
  retired_by_user    uuid references app.user_profiles(id),
  retirement_reason  text check (retirement_reason ~ '^[a-z_]{0,40}$'),   -- CODED, not prose
  -- scheduler req 14 / P18 / ND-14: distress is absorbing until a human re-enables
  absorbing_since    timestamptz,
  absorbing_cleared_by uuid references app.user_profiles(id),
  created_by         uuid not null references app.user_profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint retirement_is_human check ((retired_at is null) = (retired_by_role is null)),
  constraint probe_is_never_personal check (
    not is_probe or (depicted_person_id is null and content_is_generic and patient_id is null)),
  constraint personal_item_has_owner check (content_is_generic or patient_id is not null),
  constraint personal_item_names_a_person check (
    content_class <> 'person_identity' or depicted_person_id is not null)
);
create unique index one_month_target_per_deck on app.items (deck_id)
  where is_month_target and retired_at is null;
create index on app.items (patient_id) where retired_at is null;

create table app.item_media (
  item_id  uuid not null references app.items(id) on delete cascade,
  media_id uuid not null references app.media_objects(id) on delete restrict,
  role     text not null check (role in ('primary_photo','foil_photo','voice_caption','audio_clip')),
  ord      smallint not null default 0,
  primary key (item_id, media_id, role)
);

create table app.generic_library (                  -- proverbs, era photos, music, stock probe faces
  id                  uuid primary key default gen_random_uuid(),
  content_set_version text not null check (content_set_version ~ '^[0-9]{1,3}(\.[0-9]{1,3}){1,2}$'),
  kind                text not null check (kind in ('saying','era_photo','music_clip','stock_face')),
  locale              text not null,
  era_decade          smallint,
  birth_year_lo       smallint, birth_year_hi smallint,
  probe_ordinal       smallint check (probe_ordinal between 1 and 8),   -- non-null == in the probe set
  target_name         text,
  asset_path          text,
  licence_ref         text not null,                -- M-56 licensing is an open blocker; name it
  body                jsonb not null default '{}'::jsonb,
  retired_at          timestamptz
);
create unique index probe_set_is_frozen on app.generic_library (content_set_version, probe_ordinal)
  where probe_ordinal is not null;
```

**The S4 gate, in two places.** Once as a trigger so the row cannot exist, once in the device view so a compromised client cannot route around it.

```sql
create or replace function app.enforce_recognition_gate() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st app.person_status; ovr timestamptz;
begin
  if new.depicted_person_id is null then return new; end if;
  select dp.person_status, dp.recognition_override_at into st, ovr
    from app.depicted_persons dp where dp.id = new.depicted_person_id;
  if st = 'do_not_show' then
    raise exception 'item % references a do_not_show person (P16)', new.id using errcode = '23514';
  end if;
  if st in ('deceased','estranged') and ovr is null then
    new.recognition_enabled := false;      -- silently OFF, per P16. Not an error to the caregiver.
  end if;
  return new;
end $$;
create trigger items_recognition_gate before insert or update on app.items
  for each row execute function app.enforce_recognition_gate();

-- The reverse direction: flipping a person to deceased retracts recognition everywhere AND
-- reaches the tablet. ADR §8's "worst bug in this product" is a propagation, not a hidden row.
create or replace function app.retract_recognition_on_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.person_status is distinct from old.person_status
     and new.person_status in ('deceased','estranged','do_not_show')
     and new.recognition_override_at is null then
    update app.items set recognition_enabled = false, updated_at = now()
      where depicted_person_id = new.id and recognition_enabled;
  end if;
  if new.person_status = 'do_not_show' and old.person_status is distinct from 'do_not_show' then
    insert into app.revocations (patient_id, scope, item_id, reason)
      select new.patient_id, 'item', i.id, 'person_marked_do_not_show'
        from app.items i where i.depicted_person_id = new.id;
  end if;
  return new;
end $$;
create trigger depicted_persons_status_change after update on app.depicted_persons
  for each row execute function app.retract_recognition_on_status_change();
```

**And the guarantee that no biometric template can exist,** which is the actual P20 defence — not a policy, a schema invariant tested in CI:

```sql
-- supabase/tests/no_biometric_derivation.sql (pgTAP)
select is_empty($$ select 1 from pg_extension where extname in ('vector','pgvector','cube') $$,
                'no vector/embedding extension is installed');
select is_empty($$ select 1 from information_schema.columns
                    where udt_name in ('vector','halfvec','cube')
                       or column_name ~ '(embed|template|faceprint|voiceprint|descriptor|speaker_id|face_bbox)' $$,
                'no column in any schema can hold a biometric template');
```

There is no table that can hold a face template because there is no *type* in this database that can represent one. P20 says "ever, in any jurisdiction"; that is what "ever" looks like in DDL.

### 5.5 Safety, alerts, revocations, requests

```sql
create table app.adverse_events (                    -- SCRIBE item 21, first-class from day one
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references app.patients(id) on delete cascade,
  occurred_at       timestamptz not null,
  severity          app.adverse_severity not null,
  category          app.adverse_category not null,
  related_item_id   uuid references app.items(id) on delete set null,
  related_item_class text,
  narrative         text,                            -- FREE TEXT. Erased with the patient. Never projected.
  narrative_coded   text check (narrative_coded ~ '^[a-z_]{0,60}$'),   -- the value that IS projected
  action_taken      text check (action_taken ~ '^[a-z_]{0,40}$'),
  reported_by       uuid references app.user_profiles(id),
  reported_by_role  text not null check (reported_by_role in
                      ('caregiver','clinician','study_staff','patient')),
  probe_disabled_as_result boolean not null default false,
  reviewed_by       uuid references app.user_profiles(id),
  reviewed_at       timestamptz,
  superseded_by     uuid references app.adverse_events(id),   -- amended, never deleted
  created_at        timestamptz not null default now()
);

create table app.acute_change_notifications (        -- P25 / S7. Caregiver-addressed, always.
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references app.patients(id) on delete cascade,
  raised_at         timestamptz not null default now(),
  rule_version      text not null,
  trigger_detail    jsonb not null,
  recipient_user_id uuid not null references app.user_profiles(id),
  delivered_at      timestamptz,
  outcome           text check (outcome in
                      ('gp_contacted','no_action','false_positive','infection_confirmed','other')),
  outcome_recorded_at timestamptz
);

-- P25: the recipient is the caregiver, never the patient and never a clinician. A clinician-addressed
-- acute-change notification is the MDR Rule 11 trigger and must be impossible, not unimplemented.
create or replace function app.enforce_p25_recipient() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from app.patient_caregivers pc
                 where pc.patient_id = new.patient_id and pc.user_id = new.recipient_user_id
                   and pc.can_receive_p25_alert and pc.removed_at is null) then
    raise exception 'P25 notification recipient must be the nominated caregiver' using errcode='23514';
  end if;
  if exists (select 1 from app.patients p where p.id = new.patient_id
             and p.auth_user_id = new.recipient_user_id) then
    raise exception 'P25 notification may never be addressed to the patient' using errcode='23514';
  end if;
  return new;
end $$;
create trigger p25_recipient_gate before insert on app.acute_change_notifications
  for each row execute function app.enforce_p25_recipient();

create table app.revocations (                       -- what a device must delete. Hashes only.
  id           bigint generated always as identity primary key,   -- monotone; the device pull cursor
  patient_id   uuid references app.patients(id) on delete set null,  -- nulled on erasure
  care_home_id uuid not null references app.care_homes(id) on delete cascade,
  scope        text not null check (scope in ('media','item','patient','device_wipe')),
  media_sha256 bytea check (octet_length(media_sha256) = 32),
  item_id      uuid,
  device_id    uuid references app.devices(id) on delete cascade,
  reason       text not null check (reason in
                 ('erasure','item_retired','person_marked_do_not_show','person_status_changed',
                  'content_corrected','release_revoked','dissent_observed','device_revoked')),
  erasure_id   uuid,
  created_at   timestamptz not null default now(),
  constraint scope_payload check (
     (scope = 'media' and media_sha256 is not null)
  or (scope = 'item'  and item_id is not null)
  or (scope = 'device_wipe' and device_id is not null)
  or  scope = 'patient')
);
create index on app.revocations (care_home_id, id);

create table app.revocation_acks (
  revocation_id bigint not null references app.revocations(id) on delete cascade,
  device_id     uuid   not null references app.devices(id) on delete cascade,
  acked_at      timestamptz not null default now(),
  source_event_id uuid,
  primary key (revocation_id, device_id)
);

create table app.erasure_requests (
  id                uuid primary key default gen_random_uuid(),
  case_ref          text not null unique,
  patient_id        uuid references app.patients(id) on delete set null,
  care_home_id      uuid not null references app.care_homes(id) on delete restrict,
  requested_at      timestamptz not null default now(),
  requested_by      uuid references app.user_profiles(id),
  requester_role    text not null,
  scope             text not null check (scope in ('media_only','item','full_patient')),
  scope_key         text,
  research_scope    app.withdrawal_scope not null default 'prospective',
  stage             app.erasure_stage not null default 'requested',
  revocations_issued_at timestamptz,
  storage_purged_at timestamptz,
  content_deleted_at timestamptz,
  map_severed_at    timestamptz,
  devices_confirmed_at timestamptz,
  guaranteed_purged_by timestamptz,        -- max(last_sync + hard_expiry) over the holding devices
  backup_horizon_clear_at timestamptz,
  completed_at      timestamptz,
  counts            jsonb not null default '{}'::jsonb,
  failure_detail    text
);

create table app.export_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  requested_by  uuid not null references app.user_profiles(id),
  requested_by_role text not null check (requested_by_role in
                      ('patient','primary_caregiver','caregiver','consultee','study_staff')),
  redaction_profile text not null check (redaction_profile in ('subject_full','caregiver_redacted')),
  status        text not null default 'requested'
                check (status in ('requested','building','ready','delivered','expired','failed')),
  bundle_path   text, bundle_sha256 bytea, expires_at timestamptz,
  completed_at  timestamptz, created_at timestamptz not null default now()
);

create table app.clinician_assessments (             -- externally administered, never rendered in-app
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  instrument    text not null, instrument_version text,
  total_score   numeric, subscale_scores jsonb not null default '{}'::jsonb,
  administered_by_role text not null, administered_on date not null,
  administration_setting text, nacc_uds_form_equivalent text
);

create table app.medication_and_comorbidity (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  recorded_on   date not null,
  anticholinergic_burden_score smallint,
  benzodiazepine boolean not null default false, antipsychotic boolean not null default false,
  sedative boolean not null default false, cholinesterase_inhibitor boolean not null default false,
  memantine boolean not null default false,
  anti_amyloid_therapy text check (anti_amyloid_therapy in ('none','lecanemab','donanemab','other')),
  recent_infection boolean not null default false, recent_hospitalisation boolean not null default false,
  pain_reported boolean not null default false, constipation_reported boolean not null default false,
  dehydration_flag boolean not null default false
);
```

---

## 6. THE EVENT LOG AND THE ENVELOPE CONTRACT

### 6.1 The envelope, exactly

This is the frozen wire contract in `src/contract/schema.ts`. The device, the sync function, the server fold and the blind test-writer all import it. Nothing else may be sent and nothing else is accepted.

```ts
/** Per-event. Every field is client-supplied and every field is in the column-level INSERT grant. */
export interface EventEnvelope {
  event_id:     string;   // client UUIDv7. THE idempotency key. Never leaves the operational plane.
  device_id:    string;   // uuid
  patient_id:   string;   // uuid. Translated to subject_id at canonicalisation; never stored raw in log.
  session_id:   string | null;   // client UUIDv7
  boot_id:      string;   // uuid, regenerated on cold start
  boot_ordinal: number;   // integer >= 1, from the Keychain, +1 per cold start. SURVIVES REINSTALL.
  seq:          number;   // = boot_ordinal * 100_000_000 + within_boot_seq   (see below)
  type:         string;   // lowercase dotted token, validated against log.event_type
  payload_version: number;
  payload:      Record<string, unknown>;  // shape-constrained (§6.5), vocabulary-validated at ingest
  t_mono_ms:    number;   // performance.now() delta within this boot. Latency arithmetic only.
  t_wall_ms:    number;   // device wall clock at write. AUDIT ONLY. Never differenced, never projected.
  client_version: string;
}

/** Per push. Three of these four fields are what make the anchor deterministic. */
export interface BatchHeader {
  batch_id:            string;  // uuid
  boot_wall_ms:        number;  // device wall clock captured AT COLD START of this boot, monotonised
                                //   locally: max(Date.now(), prev_boot_wall_ms + prev_boot_max_mono_ms + 1)
  boot_mono_ms:        number;  // performance.now() captured at that same instant (normally 0)
  client_sent_wall_ms: number;  // device wall clock at the moment of send
}
```

**`seq` is a composite and that is deliberate.** `seq = boot_ordinal × 10⁸ + within_boot_seq`. `boot_ordinal` lives in the Keychain (`SecureStore`, one write per cold start); `within_boot_seq` lives in memory and restarts at 1 each boot. The result is a single `bigint`, strictly increasing per device, never reused — which is exactly what `00-SCHEDULER-SPEC.md` §6.2 rule R0 requires — **and which survives an app reinstall that destroys SQLite.** That failure is not hypothetical: MDM pushes a reinstall, SQLite and its counter are gone, the Keychain credential survives, the tablet signs in as the same device, `seq` restarts at 1, and every event thereafter collides with history under a fresh `event_id`. In a design keyed on `(device_id, seq)` alone, the tablet then quarantines 100% of its telemetry forever while reporting clean syncs. One Keychain integer prevents it. `within_boot_seq ≤ 99_999_999` is enforced client-side; a boot producing 10⁸ events would need 66,000 days at three sessions a day.

### 6.2 Idempotency, in three layers by decreasing trust in the client

1. **`event_id` is the primary key**, and ingest is `on conflict (event_id) do nothing`. At-least-once delivery plus server dedupe equals exactly-once effect; retries are free and unbounded. ADR §4.3 property 2, unchanged.
2. **`unique (device_id, seq)`** catches the client bug that regenerates `event_id` on retry — the failure mode that silently doubles every event and that a PK on `event_id` alone cannot see.
3. **A collision on (2) carrying a different `event_id` is neither dropped nor raised.** It lands in `log.quarantine` with `reason='seq_collision'` and the existing `event_id`, and the row is ACKed so the device drains. Silent drops are how research datasets acquire holes nobody can explain; a quarantine row is a data-completeness alarm on the trial-operations console and is projected into the research plane as `events_lost_estimate`.

**No `RETURNING`.** PostgREST returns the inserted representation by default and that requires `SELECT`, which the device does not have. The client must send `Prefer: return=minimal`. This is a real trap and it is a row in `policies.ts`.

### 6.3 Clock anchoring — one anchor per boot, wall-based, monotonised

This is the mechanism three independent attackers broke in three different proposals, so it is specified completely.

```sql
create table log.boot_anchor (
  device_id       uuid   not null,
  boot_id         uuid   not null,
  boot_ordinal    bigint not null,
  base_ms         bigint not null,   -- boot_wall_ms + skew_ms, clamped above the device's prior max
  mono_origin_ms  bigint not null,   -- THIS boot's boot_mono_ms. Not the sending boot's.
  skew_ms         bigint not null,   -- server_received_ms - client_sent_wall_ms, of the FIRST batch
  clamped         boolean not null default false,
  first_seen_at   timestamptz not null default now(),
  primary key (device_id, boot_id)
);
```

```
anchored_at_ms(e) = boot_anchor.base_ms + (e.t_mono_ms − boot_anchor.mono_origin_ms)
```

The anchor row is created once, on the first event ever seen from that `(device_id, boot_id)`, and is immutable thereafter:

```
skew_ms  = server_received_ms − batch.client_sent_wall_ms
base_ms  = greatest( batch.boot_wall_ms + skew_ms,
                     coalesce(log.device_chain.max_anchor_ms, 0) + 1 )
clamped  = (the greatest() bound)
```

**Five properties, each fixing a specific demonstrated failure.**

| Property | Why it holds | What it fixes |
|---|---|---|
| Strictly monotone in `seq` **within** a boot | `anchored_at_ms` is affine in `t_mono_ms`, which the client guarantees monotone within a boot | Per-batch skew reordering a response before its own stimulus (event-sourced, relational-classic) |
| Monotone in `seq` **across** boots on one device | `boot_wall_ms` is monotonised device-locally at cold start; `base_ms` is additionally clamped above the device's running maximum | NTP steps and wall-clock corrections inverting two boots |
| The mono origin is **this boot's**, not the sending boot's | `mono_origin_ms = batch.boot_mono_ms`, a per-boot constant shipped with every batch | Scattering a three-day, three-boot backlog across a fabricated window (split-planes) |
| The wall clock carries the base; the mono clock carries only the intra-boot offset | `base_ms` is wall-derived once per boot | `performance.now()` freezing across an iOS suspension and collapsing three days into 45 minutes |
| The device cannot forge its position | `anchored_at_ms`, `ingest_seq`, `chain_pos`, `received_at` are not in the column-level INSERT grant | A stolen tablet inserting itself anywhere in the replay order |

**The residual, stated.** If the mono and wall clocks disagree about elapsed time within one boot — a suspension, or a mid-boot NTP step — the two estimates diverge. The server stores `clock_divergence_ms = (t_wall_ms + skew_ms) − anchored_at_ms` on every row and raises `proj.integrity_flag(kind='clock_divergence')` above 60 s. The anchor is **not** silently corrected, because a silent correction is what breaks monotonicity. It is flagged, projected into `research.session.clock_divergence_max_ms`, and visible on the ops console.

### 6.4 The canonical total order, and why replay and the device fold are identical

```
canonicalOrder(e) = ( anchored_at_ms ASC, device_id ASC, seq ASC )
```

materialised as

```sql
ordering_key bytea generated always as
  (int8send(anchored_at_ms) || uuid_send(device_id) || int8send(seq)) stored
```

This is `00-SCHEDULER-SPEC.md` §6.1 verbatim. It is:

- **Total** — `(device_id, seq)` is unique, so no two rows tie.
- **Deterministic** — every component is fixed at ingest from `(row, boot_anchor)` and is immutable thereafter, so sorting the same row set in any physical order yields exactly one sequence.
- **Per-device causal** — §6.3 guarantees `anchored_at_ms` is non-decreasing in `seq` within every device, which is precisely the *boundary obligation* the scheduler spec says the ingest layer MUST enforce. It is met by construction here, and asserted:

```sql
select is_empty($$
  select device_id, seq from (
    select device_id, seq, anchored_at_ms,
           lag(anchored_at_ms) over (partition by device_id order by seq) as prev
    from log.event_log) s
  where prev is not null and anchored_at_ms < prev $$,
  'anchored_at_ms is non-decreasing in seq for every device (SCHEDULER-SPEC 6.1)');
```

**The determinism statement, at exactly its true strength.**

> Given the same *set* of events, and given FIFO delivery within each device, ingest produces byte-identical `anchored_at_ms` for every event — regardless of how batches from different devices interleave, regardless of retries, regardless of how many times a batch is delivered, and regardless of transaction commit order. Therefore `fold(sort(events, canonicalOrder))` is a pure function of the event set and produces deeply-equal state on Hermes and on Deno.

FIFO within a device is a **client contract clause**, not a hope: the outbox drains in `seq` order, deletes a row only on a per-ID ACK, and never skips ahead of an unACKed row. It is a conformance test in `describeOutboxPort`. The only arrival-dependent quantity in the entire design is the `greatest()` clamp in `base_ms`, which can bind only when a device's boots are delivered out of ordinal order — unreachable under FIFO — and which records `clamped = true` when it does.

**Device fold vs server fold.** Both import `src/domain/scheduler.ts` unmodified, under the ADR §6.2 ESLint rules forbidding `Date`, `Math.random`, `crypto`, `fetch`, `window` and `document` inside `src/domain/**`. Before its first sync of a boot the device does not know `skew_ms`, so it anchors with `last_known_skew_ms` from its most recent successful sync. The `/sync` response therefore returns, for every boot the device has pushed, the server's `{boot_id, base_ms, mono_origin_ms}`; the device stores them and re-folds. **After any successful sync, device and server agree exactly on every pushed event. Only the unpushed tail can differ, and only by the skew accumulated since the last sync.** That is a precise, bounded, testable statement, and it replaces "two tablets merge deterministically", which the scheduler spec correctly declares to be a claim about the *server's* state only.

### 6.5 The payload firewall — shape by constraint, vocabulary by validation

P21 and ND-18 forbid a real name, a real date, a transcript or a narrative reaching the research plane. "No string may contain a space" is not enough: **a first name contains no space either**, and `{"response":"Margaret"}` passes it cleanly into a table that has no UPDATE and no DELETE for anybody, in the design whose entire erasure argument is that the log never contained an identifier. The rule here is narrower, and it is three layers.

**Layer 1 — shape, as an immutable `CHECK`. A payload string must be one of exactly four things.**

```sql
create or replace function log.payload_shape_ok(p jsonb, depth int default 0)
returns boolean language plpgsql immutable parallel safe as $$
declare v jsonb; k text; s text;
begin
  if depth > 4 then return false; end if;
  case jsonb_typeof(p)
    when 'object' then
      for k, v in select * from jsonb_each(p) loop
        if k !~ '^[a-z][a-z0-9_]{0,39}$' then return false; end if;
        if not log.payload_shape_ok(v, depth + 1) then return false; end if;
      end loop; return true;
    when 'array' then
      if jsonb_array_length(p) > 64 then return false; end if;
      for v in select * from jsonb_array_elements(p) loop
        if not log.payload_shape_ok(v, depth + 1) then return false; end if;
      end loop; return true;
    when 'string' then
      s := p #>> '{}';
      return s ~ '^[a-z][a-z0-9_]{0,31}$'                                          -- snake token
          or s ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- uuid
          or s ~ '^[0-9a-f]{64}$'                                                  -- sha256 / hmac
          or s ~ '^[0-9]{1,3}(\.[0-9]{1,3}){1,2}$';                                -- dotted version
    else return true;   -- number, boolean, null
  end case;
end $$;
```

`"Margaret"` fails on the leading capital. `"Margaret Thatcher"` fails on the space. `"14 Elm Street"` fails on both. A lowercased `"margaret"` passes the *shape* and is caught by layer 2.

**Layer 2 — vocabulary, validated at ingest.** `log.event_type.payload_schema` holds the JSON Schema emitted from the same zod definitions in `src/contract/schema.ts` that the device and the blind test-writer import. Every string field in every schema is declared `format: uuid`, `format: hex64`, or an explicit `enum`. `"margaret"` is in no enum. Validation runs in the `/sync` Edge Function, the only writer, and a failure routes the row to `log.quarantine(reason='schema_invalid')` — never a batch abort (§6.7).

**Layer 3 — a standing assertion that the vocabulary is actually closed.** `log.assert_payload_vocabulary()` checks that every distinct string value in every payload is a uuid, a hex digest, or a member of `log.payload_vocabulary(type, key, value)` seeded from `schema.ts`. It runs in CI over the seed corpus and nightly on the ops console. A violation is a data-completeness incident, not a warning.

**And the test that proves it.** A fuzz test pushes a 5,000-entry first-name dictionary — original case, lowercased, underscore-joined and hyphen-joined — through every registered event type and every string field, and asserts 100% rejection. The character-class firewall in the `event-sourced` proposal passes roughly a third of them.

`response_text_hash` is **not implemented in v1.** §7 permits "`response_text_hash` *or* coded category", and the coded category is what `error_type` actually needs. A hash of a spoken first name over a ~50,000-word space is one rainbow table away from being the name of the patient's daughter. The research plane carries `response_token_class ∈ {target_exact, target_variant, other_person_in_deck, other_person_name, non_name_word, no_response, unintelligible}` and nothing else. If a within-participant equality analysis is ever pre-registered, `response_hmac` may be added — keyed with the study pepper, gated on a `research.field_manifest` row naming that analysis, and never compared across participants.

### 6.6 Event types — a registry, not an enum

`type` is `text`, validated against a registry table. It is **not** a Postgres `enum`: an unknown enum value is a `22P02` cast error raised at parse time, which aborts the entire batch, which means a TestFlight build shipping one new event type a day before the server migration bricks every tablet on that update ring, with no recovery on a keyboardless kiosk device. Requirement 7 outranks schema tidiness, and the registry gives the blind test-writer the same exhaustiveness at none of the risk.

```sql
create table log.event_type (
  type            text primary key check (type ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  writer          text not null check (writer in ('device','server','human')),
  is_scheduler    boolean not null default false,   -- folded by src/domain/scheduler.ts
  is_safety       boolean not null default false,
  current_payload_version smallint not null default 1,
  payload_schema  jsonb not null
);
```

The 20 types. The 14 marked `is_scheduler` map 1:1 onto `00-SCHEDULER-SPEC.md` §5, which is authoritative for their payloads.

| Wire `type` | Writer | Scheduler event | Notes |
|---|---|---|---|
| `item.added` | server | `ItemAdded` | trigger on `app.items` |
| `item.content_ready_changed` | server | `ItemContentReadyChanged` | all media `ready` (ADR §4.2) |
| `item.tier_set` | server | `ItemTierSet` | |
| `item.recognition_block_set` | server | `ItemRecognitionBlockSet` | from `depicted_persons.person_status` |
| `item.retired` | server | `ItemRetired` | `by ∈ {caregiver, clinician}`; no `algorithm` variant exists |
| `item.re_enabled` | server | `ItemReEnabled` | |
| `probe.disabled_set` | server | `ProbeDisabledSet` | |
| `session.started` | device | `SessionStarted` | carries the delivered allocation (§6.9) |
| `trial.completed` | device | `TrialCompleted` | carries the **stimulus descriptor** (§9) |
| `filler.shown` | device | `GenericFillerShown` | |
| `probe.block_completed` | device | `ProbeBlockCompleted` | |
| `distress.reported` | device | `DistressReported` | `source ∈ {patient_control, caregiver_report}` only |
| `session.ended` | device | `SessionEnded` | |
| `acute.signal_delivered` | server | `AcuteSignalDelivered` | P25 |
| `probe.trial_completed` | device | — | probe trials produce **no** scheduler event (spec §5.1 note 1); telemetry only |
| `session.co_present_declared` | device | — | the only legal producer of `administered_by` (§8.6) |
| `device.booted` | device | — | |
| `device.sync_completed` | device | — | drives `outbox_backlog_est` |
| `device.content_expired` | device | — | ADR §4.5 dead-man expiry fired. The F-criteria need it. |
| `media.purged` | device | — | the erasure receipt (§10.4). No new table, no new grant. |

Seven server-written types are emitted by `AFTER` triggers on `app.items` and `app.depicted_persons`, under a fixed server device id `00000000-0000-0000-0000-000000000000` and a `log.server_seq` sequence. All-zeros sorts first under `strAsc`, so a server event and a device event in the same millisecond put the item creation before the trial that uses it — the only ordering anyone would want.

**Human-written facts are rows first and events second, and that is the whole of the relational proposal's correct instinct.** Consent, capacity, eligibility, adverse events and content are `app` tables with real `CHECK` constraints, real indexes and real RLS. Exactly six of them — the six the scheduler folds — also emit an event. Nobody invents a synthetic event for a spelling correction, and no RLS policy ever runs a fold.

### 6.7 The log, the inbox, and the canonicaliser

```sql
create schema log authorization log_writer;
revoke all on schema log from public, anon, authenticated, device, caregiver, carehome_admin,
                            researcher, trial_ops;

create table log.event_log (
  event_id        uuid        primary key,          -- client UUIDv7. THE idempotency key.
  ingest_seq      bigint      generated always as identity,
  chain_pos       bigint      not null,             -- this device's own chain position (ARRIVAL order)
  subject_id      uuid        not null,             -- OPAQUE. Never a patient_id.
  device_id       uuid        not null,
  boot_id         uuid        not null,
  boot_ordinal    bigint      not null,
  seq             bigint      not null,
  session_id      uuid,
  type            text        not null references log.event_type(type),
  payload_version smallint    not null default 1,
  payload         jsonb       not null,
  t_mono_ms       bigint      not null,
  t_wall_ms       bigint      not null,             -- audit only. Never differenced. Never projected.
  anchored_at_ms  bigint      not null,
  clock_divergence_ms bigint  not null default 0,
  batch_id        uuid        not null,
  client_version  text        not null,
  received_at     timestamptz not null default clock_timestamp(),
  prev_hash       bytea       not null,
  row_hash        bytea       not null,
  ordering_key    bytea generated always as
                    (int8send(anchored_at_ms) || uuid_send(device_id) || int8send(seq)) stored,
  constraint event_log_device_seq_unique unique (device_id, seq),
  constraint event_log_chain_unique      unique (device_id, chain_pos),
  constraint event_log_payload_object    check (jsonb_typeof(payload) = 'object'),
  constraint event_log_payload_shape     check (log.payload_shape_ok(payload))
);

alter table log.event_log enable row level security;
alter table log.event_log force  row level security;
-- Zero policies. With RLS forced and no policy, every role INCLUDING THE OWNER reads zero rows.
-- Access is exclusively through SECURITY DEFINER functions owned by log_writer.

revoke insert, update, delete, truncate on log.event_log from public;

create or replace function log.deny_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE'
     and coalesce(current_setting('log.erasure_context', true), '') = 'on' then
    return old;                       -- §10.6 chain-break fallback, and ONLY that
  end if;
  raise exception 'log.event_log is append-only (% attempted)', tg_op using errcode = '42501';
end $$;
create trigger event_log_no_update   before update   on log.event_log for each row  execute function log.deny_mutation();
create trigger event_log_no_delete   before delete   on log.event_log for each row  execute function log.deny_mutation();
create trigger event_log_no_truncate before truncate on log.event_log for statement execute function log.deny_mutation();

create index event_log_subject_order on log.event_log (subject_id, anchored_at_ms, device_id, seq)
  include (type, session_id);
create index event_log_ingest  on log.event_log (ingest_seq);
create index event_log_chain   on log.event_log (device_id, chain_pos);
create index event_log_safety  on log.event_log (type, anchored_at_ms)
  where type in ('distress.reported','probe.disabled_set','item.retired','acute.signal_delivered');
create index event_log_session on log.event_log (session_id) where session_id is not null;

create table log.device_chain (
  device_id      uuid primary key,
  last_chain_pos bigint not null default 0,
  head_hash      bytea  not null default '\x00'::bytea,
  max_anchor_ms  bigint not null default 0,
  last_seq       bigint not null default 0
);

create table log.quarantine (
  id            bigint generated always as identity primary key,
  observed_at   timestamptz not null default now(),
  reason        text not null check (reason in
                  ('seq_collision','schema_invalid','unknown_type','payload_shape',
                   'unauthorised_subject','unassigned_patient','exception')),
  retryable     boolean not null default false,
  device_id     uuid, event_id uuid, existing_event_id uuid,
  sqlstate_code text, message text,
  raw           jsonb not null,
  replayed_at   timestamptz
);

create table log.projection_queue (
  queue_id    bigint generated always as identity primary key,
  event_id    uuid not null,
  subject_id  uuid not null,
  projector   text not null,
  enqueued_at timestamptz not null default now(),
  attempts    smallint not null default 0,
  failed_reason text
);
create index projection_queue_pending on log.projection_queue (projector, queue_id)
  where failed_reason is null;

create table log.content_change (      -- Tier-2 audit. Column NAMES, never values.
  change_id     uuid primary key default gen_random_uuid(),
  changed_at    timestamptz not null default now(),
  actor_user_id uuid not null, actor_role text not null,
  entity        text not null, entity_id uuid not null,
  patient_id    uuid,                  -- nulled on erasure
  op            text not null check (op in ('insert','update','delete')),
  columns_changed text[] not null default '{}',
  reason        text check (reason ~ '^[a-z_]{0,40}$')
);
```

Column names, never values, so the audit does not become a second unerasable copy of the person's name.

**The inbox — the device's two write targets.**

```sql
create schema ingest authorization log_writer;
grant usage on schema ingest to device;

create table ingest.event (
  event_id uuid primary key, batch_id uuid not null,
  device_id uuid not null, patient_id uuid not null, session_id uuid,
  boot_id uuid not null, boot_ordinal bigint not null, seq bigint not null,
  type text not null, payload_version smallint not null default 1, payload jsonb not null,
  t_mono_ms bigint not null, t_wall_ms bigint not null,
  boot_wall_ms bigint not null, boot_mono_ms bigint not null, client_sent_wall_ms bigint not null,
  client_version text not null,
  received_at timestamptz not null default clock_timestamp()
);

create table ingest.session (
  session_id uuid primary key, batch_id uuid not null,
  device_id uuid not null, patient_id uuid not null,
  boot_id uuid not null, boot_ordinal bigint not null, seq bigint not null,
  session_mode text not null check (session_mode in ('standard','nothing_today')),
  ui_version text not null, scheduler_version text not null, content_set_version text not null,
  planned_n_items int not null,
  t_mono_ms bigint not null, t_wall_ms bigint not null,
  boot_wall_ms bigint not null, boot_mono_ms bigint not null, client_sent_wall_ms bigint not null,
  client_version text not null,
  received_at timestamptz not null default clock_timestamp()
);

grant insert (event_id, batch_id, device_id, patient_id, session_id, boot_id, boot_ordinal, seq,
              type, payload_version, payload, t_mono_ms, t_wall_ms,
              boot_wall_ms, boot_mono_ms, client_sent_wall_ms, client_version)
  on ingest.event to device;
grant insert (session_id, batch_id, device_id, patient_id, boot_id, boot_ordinal, seq, session_mode,
              ui_version, scheduler_version, content_set_version, planned_n_items,
              t_mono_ms, t_wall_ms, boot_wall_ms, boot_mono_ms, client_sent_wall_ms, client_version)
  on ingest.session to device;
-- No select, no update, no delete, to anybody. The device can never read back what it wrote.
```

The inbox rows are **kept for 30 days** and then cron-pruned. That is the raw forensic tier: if canonicalisation has a bug, the bytes the device actually sent are still on disk. "Telemetry is never lost" should survive a server-side defect, not only a network one.

`ingest.session` exists because ADR §5.2 budgets the grant and because a session that produced **zero** interactions — F2's 22% zero-delivery families, the single most predictive early number — must be evidenced by a mechanism independent of the interaction path, so a bug there cannot make it vanish. The trigger folds it into a `session.started` event, so the log remains the single source of truth.

**The canonicaliser, and the rule that no single row may ever abort a batch.**

```sql
create or replace function ingest.canonicalise() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record; v_subject uuid; v_anchor bigint; v_base bigint; v_mono bigint; v_skew bigint;
  v_prev bytea; v_hash bytea; v_pos bigint; v_now_ms bigint; v_max bigint; v_ok boolean;
begin
  v_now_ms := (extract(epoch from clock_timestamp()) * 1000)::bigint;

  for r in select * from inserted order by device_id, seq loop
    begin                                 -- implicit SAVEPOINT: one bad row cannot kill a batch
      -- 1. resolve the opaque subject. A missing map row means erased mid-flight.
      select subject_id into v_subject from identity.subject_map where patient_id = r.patient_id;
      if v_subject is null then
        insert into log.quarantine (reason, retryable, device_id, event_id, raw)
        values ('unauthorised_subject', false, r.device_id, r.event_id, to_jsonb(r));
        continue;
      end if;

      -- 2. registry. An unknown type is RETRYABLE: the server may learn it in the next migration.
      if not exists (select 1 from log.event_type where type = r.type) then
        insert into log.quarantine (reason, retryable, device_id, event_id, raw)
        values ('unknown_type', true, r.device_id, r.event_id, to_jsonb(r));
        continue;
      end if;

      -- 3. chain head, under a row lock. Also the source of the device's running max anchor.
      insert into log.device_chain (device_id) values (r.device_id) on conflict do nothing;
      select last_chain_pos, head_hash, max_anchor_ms into v_pos, v_prev, v_max
        from log.device_chain where device_id = r.device_id for update;

      -- 4. the boot anchor, created once, immutable, clamped above the device's running maximum
      v_skew := v_now_ms - r.client_sent_wall_ms;
      insert into log.boot_anchor (device_id, boot_id, boot_ordinal, base_ms, mono_origin_ms,
                                   skew_ms, clamped)
      values (r.device_id, r.boot_id, r.boot_ordinal,
              greatest(r.boot_wall_ms + v_skew, v_max + 1),
              r.boot_mono_ms, v_skew,
              (r.boot_wall_ms + v_skew) <= v_max)
      on conflict (device_id, boot_id) do nothing;

      select base_ms, mono_origin_ms, skew_ms into v_base, v_mono, v_skew
        from log.boot_anchor where device_id = r.device_id and boot_id = r.boot_id;
      v_anchor := v_base + (r.t_mono_ms - v_mono);

      v_hash := digest(v_prev
        || convert_to(r.event_id::text || v_subject::text || r.device_id::text || r.seq::text
                   || r.type || r.payload::text || r.t_mono_ms::text || r.t_wall_ms::text
                   || v_anchor::text, 'UTF8'), 'sha256');

      insert into log.event_log (
        event_id, chain_pos, subject_id, device_id, boot_id, boot_ordinal, seq, session_id, type,
        payload_version, payload, t_mono_ms, t_wall_ms, anchored_at_ms, clock_divergence_ms,
        batch_id, client_version, prev_hash, row_hash)
      values (
        r.event_id, v_pos + 1, v_subject, r.device_id, r.boot_id, r.boot_ordinal, r.seq,
        r.session_id, r.type, r.payload_version, r.payload, r.t_mono_ms, r.t_wall_ms,
        v_anchor, (r.t_wall_ms + v_skew) - v_anchor,
        r.batch_id, r.client_version, v_prev, v_hash)
      on conflict (event_id) do nothing;

      get diagnostics v_ok = row_count;
      if v_ok then
        update log.device_chain
           set last_chain_pos = v_pos + 1, head_hash = v_hash,
               max_anchor_ms  = greatest(max_anchor_ms, v_anchor),
               last_seq       = greatest(last_seq, r.seq)
         where device_id = r.device_id;

        insert into log.projection_queue (event_id, subject_id, projector)
        select r.event_id, v_subject, p
          from unnest(array['operational','research_stage']) p;
      end if;

    exception
      when unique_violation then
        insert into log.quarantine (reason, retryable, device_id, event_id, existing_event_id, raw)
        select 'seq_collision', false, r.device_id, r.event_id, e.event_id, to_jsonb(r)
          from log.event_log e where e.device_id = r.device_id and e.seq = r.seq;
      when others then
        insert into log.quarantine (reason, retryable, device_id, event_id, raw,
                                    sqlstate_code, message)
        values ('exception', false, r.device_id, r.event_id, to_jsonb(r), sqlstate, sqlerrm);
    end;
  end loop;
  return null;
end $$;

alter function ingest.canonicalise() owner to log_writer;
create trigger event_canonicalise after insert on ingest.event
  referencing new table as inserted for each statement execute function ingest.canonicalise();
```

Four decisions in there are load-bearing.

1. **A per-row `BEGIN … EXCEPTION` block.** Every `CHECK`, every constraint, every unexpected `SQLSTATE` becomes a quarantine row and the loop continues. Without it, a payload-shape violation, a `client_version` regex or a `seq` collision aborts the whole statement, PostgREST returns 500, the outbox retries the identical batch forever, and a healthy-looking tablet is permanently unable to deliver telemetry. **This is what makes it safe for the free-text firewall to be a `CHECK` constraint.**
2. **The batch is processed in one statement-level loop under one chain-head lock.** A `BEFORE ROW` trigger cannot see rows inserted earlier in the same statement, which is the subtle way naive hash chains break.
3. **The chain follows arrival (`chain_pos`), not `seq`.** Out-of-order arrival is normal here, so a verifier walking by `seq` would report `hash_mismatch` on an honest device after an ordinary wifi dropout. `log.verify_chain(device_id)` walks `chain_pos` and reports `seq` gaps separately, because a gap is real information and not a fault.
4. **The canonicaliser inserts, chains and enqueues. It does not project.** All projection is drained by a worker using `for update skip locked` plus a per-subject `pg_advisory_xact_lock`. A three-day, 400-event backlog is the *likely* ingest path, not the exotic one, and it must not carry a fold, a rewind and two projections inside the device's transaction.

**A queue, deliberately, and not an `ingest_seq > watermark` cursor.** Identity columns are allocated before commit, so transaction A can take `ingest_seq = 100` and B take 101 with B committing first; a watermark worker reads 101, advances, and never sees 100. That bug silently drops events, is invisible in testing, and is the most common defect in hand-rolled event-sourced systems. A queue row becomes visible at exactly the same instant as its log row.

**The per-subject advisory lock** is the other half. `session_ordinal_today`, `proj.moment` and `proj.scheduler_state` are keyed on `subject_id`, and two tablets syncing for one resident at 18:00 will otherwise compute the same ordinal twice under READ COMMITTED. `pg_advisory_xact_lock(hashtextextended(subject_id::text, 0))` before any projection write makes all writers for one subject serialise regardless of which device they came from.

### 6.8 The ACK contract — what "delivered" means

`/sync` returns

```ts
{ accepted:     string[],                                                  // in log.event_log
  quarantined:  { event_id: string, reason: string, retryable: boolean }[],
  boot_anchors: { boot_id: string, base_ms: number, mono_origin_ms: number }[],
  ... }
```

- The device deletes an outbox row only for an `event_id` in `accepted`, or in `quarantined` with `retryable: false`.
- A `retryable: true` quarantine (today, only `unknown_type`) stays in the outbox and is retried with backoff, capped at `hard_expiry_days`, after which it is dropped locally and counted. The server's raw copy is durable in `log.quarantine` regardless, and `log.replay_quarantine(type)` re-ingests every row of that type once the migration registering it lands.
- **HTTP 201 is not an ACK.** Returning 201 for a row that was quarantined, and letting the device delete it, is how a newer tablet loses 100% of its telemetry to an older server while every sync looks clean.

`/sync` **must call Postgres as the device**, using the anon key plus the device's own access token, so RLS and the column grants apply to the ingest path. It must not hold `service_role`. If ingest and derivation are ever collapsed into one function that holds `service_role` and "checks the JWT itself", every grant, policy and column restriction in this document becomes decorative. Nothing in the schema can prevent that; a CI check on the function source can, and does.

### 6.9 Randomisation — the delivered arm is the recorded arm

M3 (probe paradigm) is frozen per participant. M2 (personal vs generic photograph) and `prime_condition` are within-participant, per session, and must be decided **on the tablet, three days offline, with zero network calls**.

Two proposals had the server recompute the arm from a server-derived session ordinal and had the research plane read the recomputed value. That inverts the exposure variable: a second tablet's three-day backlog shifts every subsequent ordinal, the recomputed arm flips for roughly half the study, and the analysis then runs against a photograph the patient never saw — differentially by connectivity, therefore by site.

**The device computes, the device records what it delivered, and the server verifies but never overrides.**

```
subkey             = identity.participant_map.allocation_subkey   -- 32 bytes, per participant
allocation_counter = device-local, persisted in SQLite, never renumbered, +1 per session start
m2_photo_source    = hmac_sha256(subkey, 'm2:'    || device_id || ':' || counter)[0] & 1
prime_condition    = hmac_sha256(subkey, 'prime:' || device_id || ':' || counter)[0] & 1
```

`session.started` carries `{allocation_counter, allocation_method, m2_photo_source, prime_condition}`. The server recomputes from the subkey it holds and the counter the device reported, and writes `allocation_verified boolean` beside the delivered value. `research.session` publishes the **delivered** arm plus `allocation_verified`; a mismatch is an integrity flag on the ops console, not a silent substitution. The counter is device-local and never renumbered, so it is stable under late arrival. The subkey is delivered once at enrolment, so allocation is **unpredictable to the site** — nobody at the care home can read it — and **verifiable by an auditor** who holds the study secret.

M3 lives in `app.arm_assignment(patient_id, factor, arm, allocation_method, allocation_seq, assigned_at, superseded_by)` with a `BEFORE UPDATE` trigger that raises. A coordinator "correcting" an arm in week 6 therefore creates a visible superseding row rather than silently rewriting six weeks of allocation, and the research projector raises rather than `do update` if a participant's M3 arm changes after any interaction has been projected.

---

## 7. CONSENT

Consent here has six independently moving parts — who is the data subject, what is their capacity today, who is advising, what did they agree to, what have they since done that looks like objection, and what did we do about it. A boolean column can represent none of them, and a mutable `consented_at` actively destroys the audit S6 depends on. The DDL is in §5.2; this section is the behaviour.

### 7.1 The proxy problem — MCA ss.30–33 as a `CHECK`

The person enrolling is not the data subject. A personal consultee under MCA 2005 ss.30–33 **advises** on what the person would have wanted; they cannot authorise participation. So:

```sql
constraint only_the_subject_consents check (
   (pathway in ('direct','supported')
     and outcome in ('subject_consented','subject_declined','subject_withdrew',
                     'dissent_observed','paused','reinstated'))
or (pathway = 'consultee'
     and outcome in ('consultee_advises_inclusion','consultee_advises_exclusion',
                     'consultee_advises_withdrawal','dissent_observed','paused','reinstated')))
```

**On the consultee pathway there is no value in the enum that means "consented."** A consultee row can say `consultee_advises_inclusion` and nothing stronger, forever. A caregiver cannot record that the patient consented — not because a policy forbids it, but because *the sentence cannot be formed in this database*. That is ND-21 and P22 made structural, and it is the single best idea in the `split-planes` proposal.

Two supporting constraints close the flanks. `subject_outcomes_recorded_by_subject_or_clinician` stops a caregiver being the *recorder* of a `subject_consented` row even on the direct pathway. `entry_requires_clinical_authority` restricts `initial`, `reaffirmation`, `capacity_change`, `consultee_change`, `purpose_change` and `reinstated` to `clinician` or `study_staff`.

**Withdrawal is deliberately asymmetric.** `withdrawal` and `dissent_observed` may be recorded by a caregiver. The role that cannot let someone in can always let them out, and anyone at all may record an objection. And B12 is enforced twice: `paid_carer_is_not_a_consultee` and `paid_carer_cannot_manage_consent` are `CHECK`s on `app.patient_caregivers`, because paid care-home staff cannot be personal consultees under the MCA and the consultee pathway must be able to refuse them.

### 7.2 Ongoing consent — expiry is a processing state, not a reminder

Every `initial` and `reaffirmation` row carries `reaffirm_due_on` (`NOT NULL`, enforced). `app.consent_permits()` returns false the day it passes. There is no cron job, no batch sweep, and no possibility of a forgotten expiry. Default cadence: **90 days** for `research_behavioural` and `research_speech_features`, **180 days** for the rest.

A consultee-pathway grant additionally decays with the capacity review: `app.capacity_review_current()` is `coalesce(latest.review_due_on >= current_date, false)`, so **no capacity record means not current**, and a lapsed review invalidates the grant automatically. MCA ss.30–33 requires ongoing consultation; a database that lets a two-year-old consultee grant keep authorising collection is documenting that requirement, not implementing it.

**Lapse degrades; it does not stop.** When `research_behavioural` lapses, `care_delivery` stays true. Telemetry keeps flowing into the operational plane where the product needs it; the study stops accruing. Killing the product for a person with dementia because a form expired would itself be a harm, and the design should not be capable of it.

### 7.3 Six separable purposes

`care_delivery` · `research_behavioural` · `research_speech_features` · `media_retention` · `third_party_imagery` · `contact_for_followup`.

Separating `research_speech_features` from `research_behavioural` is what makes product-shape §8.4.3 real: the speech layer is disclosed in the patient UI in plain words and is separately removable, and removing it does not stop the app running or eject the participant from the study. It is gated at the **projector**, not at read time, so the features never cross the plane rather than crossing and being hidden.

### 7.4 Behavioural withdrawal of assent, with teeth

Dissent is a first-class observation with an automatic effect and a closed vocabulary:

```sql
create type app.dissent_channel as enum
  ('patient_control','caregiver_report','repeated_abandonment','repeated_skip','staff_report');
```

There is **no `inferred_classifier` value and there never will be.** P18, ND-15 and EU AI Act Art. 5(1)(f) forbid an inferred-affect classifier, and the absence of the enum value is the enforcement — there is no way to record a dissent signal that came from a model. The same trick appears in `proj.interaction.distress_signal_source`, and in `00-SCHEDULER-SPEC.md` §5.1 note 2, where `DistressReported.source` has exactly two variants, both human.

```sql
create or replace function app.apply_dissent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.outcome <> 'dissent_observed' then return new; end if;

  update app.patients
     set processing_paused_at = coalesce(processing_paused_at, new.effective_from)
   where id = new.patient_id;

  update app.consent_state set dissent_active = true
   where patient_id = new.patient_id
     and (new.dissent_scope = 'all' or purpose::text like 'research%' or new.dissent_scope <> 'research_use');

  -- the tablet stops too, in the same transaction, with no human in the loop to forget
  insert into app.revocations (patient_id, care_home_id, scope, reason)
  select new.patient_id, p.care_home_id, 'patient', 'dissent_observed'
    from app.patients p where p.id = new.patient_id;
  return new;
end $$;
create trigger dissent_pauses_everything after insert on app.consent_events
  for each row execute function app.apply_dissent();
```

**`dissent_active` is absorbing.** Only an explicit `reinstated` event recorded by a `clinician` or `study_staff` clears it. No `initial` clears it. No timeout clears it. A caregiver cannot clear it. ND-14 ("never re-present an item that produced distress until a human re-enables it") and ND-21 ("never override the patient's expressed objection").

**S6 is enforced by a row disappearing from a view.** `device.roster` requires `app.consent_permits(patient_id,'care_delivery')`, which is false the instant `processing_paused_at` is set. A device that syncs gets an empty roster and has nothing to render. Not a banner, not a client-side check, not a flag the app might ignore. Its residual is stated rather than hidden: **up to `hard_expiry_days` for a device that is switched off in a drawer**, after which it refuses to render anything at all. `ops.s6_exposure` reports that number per participant rather than assuming it is zero, because a tablet that has not synced cannot know.

### 7.5 Consent is never in the ingest predicate

This is the correction that eliminated the relational proposal, and it is worth stating as a rule:

> **Consent governs use, not receipt.** No consent predicate appears in any `WITH CHECK` on `ingest.event` or `ingest.session`.

The failure it prevents was demonstrated end to end. A resident shows behavioural refusal on Monday. A caregiver, correctly, records `dissent_observed` on Tuesday. The tablet, offline since Sunday, syncs on Wednesday — and every event from Sunday to Tuesday, *including the distress events that are the evidence for the dissent*, is refused with 42501 and can never be uploaded. Then ADR §5.2's revocation path wipes SQLite and destroys the outbox that was supposedly retaining them. Requirement 7 fails, the adverse-event register loses its primary record, and S6 becomes unfalsifiable because the proof of the violation is blocked at the door.

Consent gates, in the six places where it belongs:

| Gate | Purpose | Effect |
|---|---|---|
| `device.roster` | `care_delivery` | the patient vanishes from the tablet's only source of who exists |
| `device.content` | `care_delivery` | no card is shipped |
| storage policy | `media_retention` | no signed URL is minted |
| research projector | `research_behavioural` | no new behavioural row crosses the plane |
| research projector, speech block | `research_speech_features` | the prosodic columns are `NULL` for that participant |
| media release trigger | `third_party_imagery` | media cannot become `ready` |

### 7.6 What happens to already-collected data when consent is withdrawn

The participant chooses, in the withdrawal flow, in plain words. It is a column, not a decision an engineer makes for them.

| | `prospective` (default) | `retrospective` |
|---|---|---|
| Operational plane (`app`, `log`) | untouched; the product keeps running under `care_delivery` unless that too was withdrawn | erasure request enqueued (§10) |
| Research projection | stops at the withdrawal instant; already-projected rows stay | `link.sever(..., 'retrospective')` deletes the participant's research rows |
| Published releases | **unchanged, forever.** A release is immutable; a citation must remain resolvable | unchanged (a published release cannot be unpublished), and the fact is stated in the withdrawal form |
| `research.participant_status` | acquires `withdrawn_on_day` in the next release | acquires `withdrawn_on_day`, then the participant row is removed |
| **Safety register** | **retained** | **retained** (§7.7) |
| Erasure ledger | not created | created; Art. 30 requires it |

Prospective withdrawal is the default because it is the honest one: it stops collection without destroying a REC-approved dataset, and it is what a participant almost always means. Retrospective is available, it is described in the same sentence, and it costs the study an N — which the protocol states in advance rather than discovering later.

### 7.7 The safety register survives consent withdrawal, and this is deliberate

Three of the four attackers found the same fatal defect in three different proposals: gating the adverse-event register on research consent truncates the safety data **exactly on the correlate of harm**. A participant becomes distressed in week 5; the probe is disabled and it is logged as an adverse event; the family, upset, withdraws research consent that evening. In every proposal as written, S1's numerator *and its denominator* then vanish, S2 becomes unfalsifiable rather than satisfied, and M5 — "the field's first systematic adverse-event data for a memory intervention" — is systematically biased downward by construction.

So:

- `research.safety_register` and the exposure denominator (`research.participant_status.sessions_completed`) are projected on a **separate legal basis** (Art. 9(2)(i) public health / Art. 17(3)(d) scientific research, plus the sponsor's REC-approved pharmacovigilance duty), and are **not gated on `research_behavioural`**.
- They are projected in coded form only: `day_offset`, `severity`, `category`, `related_item_class`, `narrative_coded`, `action_taken`, `reported_by_role`, `probe_disabled_as_result`. The clinician's free-text `narrative` lives in `app.adverse_events.narrative`, is never projected, and is hard-deleted with the rest of `app` on erasure.
- They survive `link.sever` because `identity.participant_map` retains `participant_code`, `study_id`, `severed_at` and `severance_scope` after severance while nulling `subject_id`, `enrolled_on` and `tz_offset_minutes`. The register is then a coded row about an anonymous participant code, which is what a safety register is supposed to be.
- **B5 must confirm this in writing before the pilot opens.** The data-subject's erasure right and the sponsor's safety-reporting duty are different obligations and §12.4 of the relational proposal conflated them. A safety register editable by the people it might indict is not a safety register.

---

## 8. THE RESEARCH PLANE

### 8.1 What is structurally absent — this is the design

Before any DDL, the negative space, because it is the point.

- **No `uuid`-typed column, anywhere in `research` or `analysis`.** Not `patient_id`, not `subject_id`, not `session_id`, not `item_id`, not `event_id`. Every identifier is `hmac_sha256(id, study_pepper)` rendered as 64 hex characters. This closes two independent fatal findings at once: the `select i.*` leak, and the fact that **a client-generated UUIDv7 is a wall-clock timestamp with a random tail** — twelve hex digits of millisecond epoch that any researcher can decode in one expression, recovering the true calendar date and time of every session in the cohort with no auxiliary data and no collusion.
- **No `date`, `timestamp`, `timestamptz` or `interval` column.** Only `day_offset_from_enrollment int`, `local_hour smallint`, `time_of_day_bucket text`.
- **No name, no free text, no transcript, no `headline_name`, no `one_sentence`, no narrative.** `narrative_coded` is a coded token and is typed as such.
- **No `sha256`, no `storage_path`, no media reference of any kind.** `media_type` is an enum-shaped label, not a pointer. A content hash of a full-face photograph is not a pseudonym; it is a perfect index on the photograph, and anyone holding the JPEG can compute it.
- **No `device_id`** — device is projected as a single `device_class` band and nothing else (§8.5).
- **No foreign key leaving the `research` schema.** `pg_constraint` proves it, and it is what makes escalation to a second Postgres instance a configuration change rather than a redesign.
- **No `embedding`, `descriptor`, `template`, `voiceprint`, `faceprint`, `speaker_id` or `face_bbox` column in any schema, in any plane.**

```sql
-- pgTAP, run on every migration
select is_empty($$ select table_name, column_name from information_schema.columns
  where table_schema in ('research','analysis')
    and (data_type in ('uuid','date','timestamp with time zone','timestamp without time zone','interval')
         or column_name ~ '(name|dob|birth_date|email|phone|address|transcript|narrative$|path|sha256|url|device_id|patient)')
$$, 'the research plane exposes no uuid, no temporal type and no identifier-shaped column');

select is_empty($$ select conname from pg_constraint c
  join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'research' and c.contype = 'f'
    and (select nspname from pg_namespace where oid =
         (select relnamespace from pg_class where oid = c.confrelid)) <> 'research'
$$, 'no foreign key leaves the research schema');
```

### 8.2 Projected tables, not views over base tables

`research.*` holds **different rows**, physically separate, written by `link_project()` running as `bridge`, which has `SELECT` and only `SELECT` on `app`, `log` and `proj`. The one-way direction is a grant, not a discipline: the role that spans the boundary physically cannot write back.

The argument, from synthesis §1.11: full-face photographs and voice prints "cannot be hashed or blurred into compliance, only removed." Every other identifier has a de-identifying transform; a photograph has none. **When the only remedy for a category of data is removal, the architecture must default to removed.** A view over a base table is a deny-list — a new column is exposed unless someone remembers to exclude it, forever, on every future migration. A projected plane is an allow-list — a column is absent unless someone deliberately adds it with a manifest row and a named pre-registered analysis. That is not a style preference; it is the only architecture whose failure mode points away from the photograph.

**The manifest is the source of the DDL, not a checklist against it.**

```sql
create table research.field_manifest (
  research_table    text not null,
  research_column   text not null,
  pg_type           text not null,
  source_kind       text not null check (source_kind in
                      ('event_payload','app_column','computed','derived_variable')),
  source_expression text not null,
  preregistered_analysis text not null,
  protocol_section  text not null,
  approved_by       text not null,
  approved_on       date not null,
  removed_on        date,
  primary key (research_table, research_column)
);
```

Four assertions run in CI, and the fourth is the one every proposal missed:

1. **Forward** — every column in `research` has a live manifest row. A migration adding a column with no pre-registered analysis breaks the projector on its next run and fails CI immediately. GDPR purpose limitation becomes a failing test rather than a paragraph.
2. **Reverse** — every field named in synthesis §7 maps to a manifest row or to a `research.field_waiver` row carrying a reason and an approver. This is what stops `turnaround_decade`, the month-target identity and `phase` from being discovered as missing in month nine, when the backfill is impossible.
3. **Populated** — every manifest column appears in the projector's insert list. A *declared but never filled* column is a hole an allow-list is supposed to prevent, and it is how `retirement_reason` — free text a family types when they retire a card — reaches the research plane in a later revision.
4. **`source_kind <> 'literal'`** — there is no such value in the enum. A column whose source expression is a constant is a column that reads as measurement and is not one. That single check catches the `administered_by = 'self'` class of defect generally.

### 8.3 The plane is not live — immutable numbered releases

**The finding that forced this.** `day_offset_from_enrollment` is only de-identifying if the observer cannot see *when the row appeared*. All three proposals served the researcher from a plane that tracked the operational plane continuously — synchronously, on the next query, or on a 15-minute cron. A researcher (or a script under a researcher JWT) that polls hourly and records the local time at which each row first becomes visible computes `enrolled_on = date(observed_at) − day_offset` from a single row. The enrolment date is the exact column that `identity.participant_map` protects with a missing grant, and it is recoverable from the research plane alone, with no auxiliary access. Enrolment date plus site plus age band plus subtype, in a pilot of thirty, is identifying to anyone holding the site's enrolment register — which every care-home admin does. ND-18 is breached without a single date column being exposed.

The same channel carries a second disclosure: a participant's row count *stopping* on a Tuesday and their rows *disappearing* a week later tells the researcher, to the day, that this person withdrew, dissented, lost capacity or died. That is an unlogged, undated, unconsented disclosure of the most sensitive event in the study, produced by the mechanism designed to protect them.

**So the research plane is published, not queried.**

```sql
create table research.release (
  study_id             uuid not null references research.study(study_id),
  release_no           int  not null,
  cutoff_day_offset    int  not null,     -- rows with day_offset <= this, and no others
  min_participant_days int  not null default 28,
  cadence_days         int  not null default 7,
  derivation_version   text not null,
  scheduler_version    text not null,
  content_set_version  text not null,
  manifest_sha256      bytea not null,
  k_min                int  not null,     -- the smallest quasi-identifier cell in this release
  row_counts           jsonb not null,
  content_sha256       bytea not null,
  published_at         timestamptz,
  primary key (study_id, release_no)
);
```

Every research row carries `published_in_release int` and `superseded_in_release int`. `analysis.*` views expose rows where `published_in_release <= pinned` and `(superseded_in_release is null or superseded_in_release > pinned)`. Rows are never updated and never deleted except by severance; a corrected derivation inserts a new generation and supersedes the old one **at a future release number**, so a published figure stays reproducible forever.

Four properties fall out:

- **Publication is on a fixed cadence at a fixed hour**, and a participant enters the plane only once they have `min_participant_days` (default 28) of history, at which point their whole history to the cutoff appears at once. The arrival-time channel is bounded to `max(cadence_days, min_participant_days)` ≈ 28 days rather than one hour, which — combined with §8.4's k-gate — is no longer identifying on its own. **It is not zero, and it cannot be while the plane is updated at all; that is the stated residual.**
- **A withdrawal is a published fact, not a silent disappearance.** The participant's row set freezes and `research.participant_status.withdrawn_on_day` appears in the next release. One disclosure the consent form can describe honestly, instead of a continuous side channel it cannot describe at all.
- **A publication cites a release number**, and re-running the analysis against that release returns the same numbers in two years. That is what product-shape §8.2 already asks for — "a versioned, scheduled export job … cohort-level and retrospective, no live view of a named participant" — and which none of the three proposals implemented.
- **A scheduler-version bump cannot rewrite history.** In the `event-sourced` proposal, bumping the scheduler invalidated every snapshot and refolded eight weeks of `proj.interaction`, so every scheduler-derived column in the research plane silently described an algorithm that never ran and M1's retention curves were fitted to intervals the patient never experienced. Here a re-derivation is a new generation published in a new release; the release the paper cites is untouched; and `was_delivered` marks the generation that actually ran on the tablet, which is what a trial reports.

### 8.4 k-anonymity is a release gate, not an export-time hope

Two proposals named small-cell disclosure as a residual and put the mitigation in the export job — a path the researcher's normal, designed access does not go through. One did not mention it at all while claiming re-identification was impossible in four independent layers.

```
link.assert_k_anonymity(study_id, release_no) must return k >= 5 or the release does not publish.
```

The quasi-identifier tuple is `(age_band, dementia_subtype, site_code, first_language, fluctuation_band)`. Where a cell is below 5, the projector suppresses in a fixed order: `site_code` → null, then `first_language` → null, then `age_band` widened to a decade, then `dementia_subtype` collapsed to `{AD, non_AD}`. The applied suppressions are recorded per release so the codebook is accurate.

**Deck composition is also a quasi-identifier and is treated as one.** Grouping interactions by `item_ref` reconstructs each participant's eight to ten items with their relationship, decade, status and provenance attached. A caregiver who is also study staff reads down the list looking for the deck she built — a 1940s spouse marked deceased, two 1960s children, a sibling marked estranged, a pet, a 1930s era photo in Welsh — and there is exactly one such participant. So the projector coarsens:

| §7 field | Projected as |
|---|---|
| `era_decade` | `era_band ∈ {pre_1950, 1950s_60s, post_1970}` |
| `relationship_category` (12 values) | `relationship_group ∈ {partner, child_or_grandchild, sibling_or_parent, friend_or_other, self_or_pet}` |
| `caregiver_rated_emotional_valence`, `caregiver_rated_importance` | participant-level medians only, not per interaction |
| `content_language` | dropped unless a manifest row names an analysis |

And a **linkage test runs before every release**: given each participant's projected deck composition tuple, how many participants match? Suppress or generalise until k ≥ 5 on composition too. No proposal did any linkage testing at all.

### 8.5 Device fingerprints are collapsed to one band

`device_class`, `os_version`, `screen_css_px`, `device_pixel_ratio`, `display_refresh_hz` and `input_modality` are in all three research planes and §8.4 rule 1 names an analysis for none of them. A care home runs four tablets for eleven residents and the admin maintains the mapping; screen size × pixel ratio × refresh rate partitions the cohort by hardware model, an OS upgrade happens on an observable date, and a personal-mode tablet is one resident, so for those participants the fingerprint *is* the identity.

The research plane carries **`device_class` alone**, a fixed enum for the study duration. If a rendering-performance analysis is ever pre-registered, it gets one banded `display_class` computed at projection. This is the cheapest fix in the whole review and it costs the study nothing anyone has claimed to need.

### 8.6 `administered_by` — nullable, with exactly one legal producer

§7 specifies `administered_by` per interaction and calls it "a hard confound". All three proposals declared it `NOT NULL` and supplied no producer, which forces the projector to write the only plausible constant — `'self'` — and thereby to assert that 100% of trials were unassisted. Every latency, every hesitation measure and every speech feature is then attributed to the patient, and M2's primary outcome (words spoken) is the field most damaged, because a caregiver sitting alongside is precisely the person who fills a fifteen-second silence.

P28 forbids requiring caregiver input on the day, P9 forbids patient control beyond a single tap, and P18 forbids inferring presence. So there is exactly one legal producer: a caregiver-app declaration ("I'm sitting with her for this one") writing `session.co_present_declared`, projected as `caregiver_present_source = 'declared'`. There is no `'inferred'` value.

`administered_by` and `caregiver_present` are therefore **nullable and default `NULL`**, and the protocol pre-registers the residual confound as unmeasured for sessions with no declaration. A hole you can see is better than a constant that reads as measurement.

### 8.7 The plane declares its own holes

A research plane that hides its holes is worse than useless, and a session that never happened must be distinguishable from a session whose telemetry was lost.

`research.session` carries `events_lost_estimate` (from the `seq`-gap analysis), `quarantined_event_count` and `clock_divergence_max_ms`. `research.participant_status` carries `last_contact_day`, `device_change_count` and `sessions_completed`. `research.coverage_gap(participant_pseudonym, from_day, to_day, reason)` records windows excluded for a *temporary* reason — `capacity_review_overdue`, `consent_lapsed`, `device_unreachable` — because a three-week hole caused by a clinician being off sick is otherwise indistinguishable from three weeks of non-usage, and it lands on F1's "≥1 session per week for ≥8 consecutive weeks" as a false negative.

**Temporary exclusions do not advance the watermark.** Events excluded for a revocable reason are held in a pending set and re-evaluated at the next release; only permanent exclusions (withdrawal, retrospective severance) advance past them. A lapsed capacity review must not permanently delete a window of a participant's data.

### 8.8 Speech features are a speaker biometric and are treated as one

Per-trial `speech_rate_wpm`, `articulation_rate`, `voiced_ratio`, `mean_pause_ms`, `max_pause_ms`, `n_pauses`, `n_filled_pauses` and `type_token_ratio`, accumulated over hundreds of trials, yield a stable low-dimensional per-speaker profile — which is what a speaker model is. All three proposals shipped the block while asserting they did not; `split-planes` proved only that no column is *named* `voiceprint`.

Four mitigations, and one gate:

1. Reduce to the minimum pre-registered set; §8.4 rule 1 permits nothing else.
2. Coarsen continuous values to bands at projection.
3. Gate the entire block at the **projector** on `research_speech_features`, so the features never cross rather than crossing and being hidden.
4. **B3 must be scoped explicitly to aggregated prosodic features**, not only to templates. The current blocker text covers photographs of non-users; it does not cover this.
5. Before the block ships, run the actual test: attempt text-independent speaker verification of held-out recordings against the exported profiles, and put the equal-error rate in the DPIA. **If it verifies, the block does not ship.**

### 8.9 The three-layer reach and what a researcher can actually do

`research` holds the tables, owned by `bridge`, with no grant to `researcher`. `analysis` holds release-scoped and study-scoped definer views, owned by `bridge`, and is the only schema `researcher` can name.

```sql
create table research.study        (study_id uuid primary key, label text not null,
                                    protocol_ref text not null, rec_approval_ref text not null);
create table research.study_access (study_id uuid not null references research.study(study_id),
                                    researcher_user_id uuid not null,
                                    pinned_release_no int,
                                    granted_on date not null default current_date,
                                    expires_on date,
                                    primary key (study_id, researcher_user_id));

create or replace function analysis.release_no() returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(max(sa.pinned_release_no),
                  max((select max(r.release_no) from research.release r
                        where r.study_id = sa.study_id and r.published_at is not null)))
  from research.study_access sa
  where sa.researcher_user_id = auth.uid()
    and (sa.expires_on is null or sa.expires_on >= current_date)
$$;

create view analysis.interaction with (security_invoker = false) as
select i.interaction_ref, i.participant_pseudonym, i.session_ref,
       i.day_offset_from_enrollment, i.local_hour, i.time_of_day_bucket, i.phase,
       i.item_ref, i.item_is_probe, i.item_tier, i.is_month_target, i.content_class,
       i.relationship_group, i.era_band, i.person_status, i.content_is_generic,
       i.content_provenance, i.media_type, i.n_media_assets, i.cue_modality,
       i.repetition_number, i.lapse_count, i.days_since_last_review,
       i.days_since_first_introduction, i.scheduled_interval_days, i.interval_deviation_days,
       i.opening_cue_level, i.floor_cue_level, i.trial_class, i.within_session_rung,
       i.attained_rung, i.drift_adjustment_applied, i.presentation_mode, i.n_distractors,
       i.hint_level_reached, i.n_hints, i.time_to_first_hint_ms, i.rescued_to_success,
       i.assistance_dependency_index, i.attempt_count, i.administered_by,
       i.latency_to_first_input_ms, i.total_response_time_ms, i.decision_time_ms,
       i.app_backgrounded_ms, i.n_backgrounds, i.interrupted,
       i.n_answer_changes, i.n_taps, i.mean_tap_hold_ms, i.sd_tap_hold_ms,
       i.dwell_before_first_touch_ms, i.pointer_path_length_px, i.n_direction_reversals,
       i.off_target_tap_offset_px,
       i.correct, i.grade, i.error_type, i.response_token_class,
       i.utterance_duration_ms, i.speech_rate_band, i.articulation_rate_band,
       i.n_pauses, i.mean_pause_ms_band, i.max_pause_ms_band, i.n_filled_pauses,
       i.voiced_ratio_band, i.type_token_ratio_band, i.asr_confidence_band, i.asr_language,
       i.distress_signal, i.distress_signal_source,
       i.difficulty_floor_triggered, i.item_absorbing_state_entered,
       i.item_retired_by, i.retirement_reason_coded,
       i.app_version, i.scheduler_algorithm_version, i.content_set_version,
       i.scoring_rubric_version, i.patient_ui_version, i.device_class,
       i.derivation_generation, i.was_delivered, i.derived_from_complete_stream
from research.interaction i
join research.participant p using (participant_pseudonym)
join research.study_access sa on sa.study_id = p.study_id
     and sa.researcher_user_id = auth.uid()
     and (sa.expires_on is null or sa.expires_on >= current_date)
where i.published_in_release <= analysis.release_no()
  and (i.superseded_in_release is null or i.superseded_in_release > analysis.release_no());

alter view analysis.interaction owner to bridge;
grant select on analysis.interaction to researcher;
```

**Every column is enumerated. `select i.*` is banned by lint and by the manifest-equality assertion**, because that one shortcut is what exported `subject_id`, `item_id` and `session_id` in the `event-sourced` proposal and handed a caregiver-who-is-also-a-researcher the pseudonym of her own father in two browser tabs.

`analysis.session`, `.participant`, `.participant_status`, `.probe_trial` (a view, `where item_is_probe`), `.safety_register`, `.consent_event`, `.clinician_assessment`, `.medication_and_comorbidity`, `.derived_variable`, `.coverage_gap`, `.release` — identical construction.

**No `alter default privileges` in `research` or `analysis`.** Grants are per object, explicitly, so a new object fails closed and forces a review. A pgTAP assertion additionally requires every relation in `analysis` to have `relkind = 'v'`: a materialised view has `relkind = 'm'` and would fail immediately. That closes the "someone materialises the slow view six months in and the consent gate silently freezes" hole that an automatic default privilege leaves open.

### 8.10 Why re-identification is impossible, stated at exactly its true strength

> For every query the `researcher` role can issue, by any route, through PostgREST or a direct connection, now or after any future migration that does not itself grant new privileges, re-identification of a participant is impossible — because the mapping is not reachable, because the join key was never written into the plane, and because the plane contains no `uuid`, no date, no media reference and no free text.

Five mechanisms, all of them absences:

1. **No `USAGE` on `identity`, `app`, `log`, `proj` or `research`.** `select * from identity.participant_map` is `ERROR: permission denied for schema identity` — a privilege error, not an empty result set.
2. **The join key was never written down.** A superuser dump of `research` and a superuser dump of `app` still cannot be joined; the bridge exists only inside `bridge`, which is `nologin` and is not granted to `authenticator`.
3. **Pseudonyms are keyed, not hashed.** `hmac(id, study_pepper)` with the pepper in Supabase Vault. A plain `sha256(uuid)` is invertible by anyone holding the operational plane's UUID list, which is everyone with a database dump. This is the cheapest hardening in the design and the one most commonly skipped.
4. **Nothing identifying can be in the source.** `proj.*` is folded exclusively from `log.event_log`, whose payloads cannot structurally hold a name (§6.5). `app` is touched by the projector only for deliberately banded fields.
5. **The plane is retrospective and released, so its update times carry no information** beyond the stated 28-day residual.

**It is NOT a claim about `service_role` holders, Supabase dashboard SQL-editor users, backup and PITR snapshot holders, or the platform operator.** §14.3 enumerates each and says which are unmitigated. Pretending otherwise is what makes a four-layer "structurally impossible" framing worse than an honest one.

### 8.11 The negative test worth more than the structural ones

A fuzz test writes the sentinel `ZZSENTINELZZ` and the sentinel date `1931-04-07` into **every free-text column in `app` and every string field of every event payload** — names, `one_sentence`, `retirement_reason`, adverse-event narrative, consent notes, and the untrusted device payload, which is the one the `split-planes` sentinel test missed because a jsonb payload is not a free-text column. Then it runs the projector and greps the entire `research` schema and every `analysis` view. **Zero hits is the assertion.** It tests the projector's behaviour rather than its declared shape.

---

## 9. STIMULUS PROVENANCE — how a past interaction stays interpretable after its photograph is deleted

This is the question that decided the shape of `trial.completed`, and every proposal got it wrong in the same way.

**The failure.** All three sourced `content_class`, `relationship_category`, `era_decade`, `person_status`, `caregiver_rated_*` and `content_provenance` by joining the *mutable* content tables at projection time — up to three days after the trial, and again on every rewind and every version bump. So: Margaret dies in week 8, the caregiver dutifully flips `person_status` to `deceased` (P16 requires the field, the product requires the flip), a tablet syncs a two-day backlog, and weeks 1–7 of recognition trials on Margaret are re-stamped `person_status = 'deceased'`. **S4 — "zero instances of a deceased person surfaced in a recognition mechanic", where any instance is a serious incident — then reports dozens of incidents that never happened.** Run the mirror case, a data-entry correction from `deceased` to `living`, and a real S4 violation silently disappears. The same mechanism rewrites `era_decade` (destroying M-131's era-stratified analysis) and the valence covariate in every model. The only audit that could recover the prior value, `log.content_change`, deliberately records column *names* and never values.

**The answer: the stimulus descriptor is frozen into the event at stimulus paint, and the projector joins nothing mutable.**

Every field synthesis §7 lists under "Item metadata" is an enum, a decade integer or a small rating. All of it passes the payload shape constraint. So `trial.completed` carries it:

```jsonc
{ "session_id": "...", "item_id": "...",
  "opening_cue_level": 2, "floor_cue_level": 2, "trial_class": "supported", "is_closer": false,
  "attempts": [ { "attempt_index": 0, "cue_level": 2, "correct": true, "latency_ms": 4120,
                  "hint_level": 0, "error_class": "none", "void": false } ],
  "terminal_mono_ms": 918233, "terminal_anchor_ms": 1786000000000,

  // THE STIMULUS DESCRIPTOR — what the patient actually saw, written at stimulus paint
  "stimulus": {
    "content_class":       "person_identity",
    "relationship_group":  "child_or_grandchild",
    "era_band":            "1950s_60s",
    "person_status":       "living",          // AS AT PRESENTATION. This is the S4 input.
    "recognition_blocked": false,
    "content_provenance":  "family_upload",
    "media_kind":          "photo",
    "n_media_assets":      1,
    "cue_modality":        "visual_plus_audio",
    "content_language":    "en",
    "item_tier":           1,
    "is_month_target":     true,
    "content_is_generic":  false,
    "valence_band":        "positive",
    "importance_band":     "high",
    "content_set_version": "1.4.0",
    "presentation_mode":   "cued_recall",
    "n_distractors":       2
  } }
```

Five consequences, and the fifth is the one the question asks about.

1. **S4 measures what the patient saw**, not what the database currently believes. A person who was living when the photograph was shown is recorded as living, permanently, and a status change next month cannot manufacture or erase an incident.
2. **The projector reads only the log.** It joins no mutable table, so projection is a pure fold, rewind is genuinely idempotent, and the same event projects to the same row on any day, at any derivation version. A manifest rule enforces it: no research column may have `source_kind = 'app_column'` for any field a device could witness.
3. **`app.item_revision` is not needed and is not built.** A revision table records what the *database* believed at time T; the event records what the *patient saw*. The second is strictly better evidence and it is one column of jsonb rather than a table, a trigger, a bitemporal join and a backfill.
4. **The device is the only witness, so the device echoes.** `device.content` exposes the banded telemetry fields (`relationship_group`, `era_band`, `valence_band`, `importance_band`) alongside the fields it renders, precisely so the raw values never reach the tablet *and* never reach the research plane. A stolen tablet learns a decade band, not a rating.
5. **The photograph was never an analysis variable, so deleting it destroys nothing.** No field in synthesis §7 has an image as its value. What the analysis uses is the descriptor above plus `item_ref = hmac(item_id, study_pepper)` — a 64-character value, not a foreign key — which keeps an item identifiable *to itself across time* (M1's per-item retention curves, M4's tier-1 maintenance) after the row, the file and the storage object are gone. After severance the pepper reference is destroyed and `item_ref` is an orphan hex string that identifies nothing.

> **A past interaction remains interpretable because its interpretation was never in the photograph. It was in a typed descriptor written at the moment of presentation, by the only party that knows what was rendered, into a record that cannot be edited afterwards.**

The residual, stated: a descriptor written by a compromised or buggy device is a lie the server cannot detect from the log alone. Mitigations are the presentation-mismatch check (`00-SCHEDULER-SPEC.md` §5.1 note 4 — the fold trusts the payload and the adapter emits `presentation_mismatch`), the per-field vocabulary validation at ingest, and the fact that a device has no motive and no reachable benefit. It is a smaller residual than "the analysis silently describes a deck that never existed", which is what the alternative guarantees.

---

## 10. DELETION

### 10.1 The two rights that get conflated, separated

**Export** (GDPR Art. 15/20, App Store 5.1.1(v)) is the identifiable plane: the family wants their photographs and recordings back. It is served entirely from `app` and Storage and never touches `research`.

**Erasure** (Art. 17) must reach four places: Postgres, Storage, **the tablets**, and the research plane, where it means something different.

### 10.2 Why the usual two answers are bad, and what this design does instead

Rewriting the log destroys the property the log exists for: the hash chain breaks, the safety register becomes deniable, and the audit six of seven Tier-1 criteria depend on stops being evidence. Crypto-shredding as the *primary* mechanism is weak: the ciphertext remains personal data held by the controller until the key is provably unrecoverable everywhere including backups, and it requires being right about key management forever.

**The answer: the log never contained an identifier, so there is nothing in it to erase.**

Every row in `log.event_log` carries `subject_id`, `device_id`, `item_id` — three opaque UUIDs — plus tokens and integers, structurally, by the §6.5 shape constraint and the vocabulary validation. No name, no date, no free text, no media, no transcript. While `identity.subject_map` exists, `subject_id` is *pseudonymised personal data* (Art. 4(5): still personal data, which is the point the "we hashed it" arguments get wrong). Once the map row is deleted and the content plane is gone, there is no additional information — held by us or reasonably available to anyone — that attributes those rows to a natural person. Recital 26: the Regulation does not apply to anonymous information.

And because `proj.*` is keyed on `subject_id` too, **one deletion anonymises the entire derived estate** — projections, moments, the scheduler cache — at the same instant, without a single `UPDATE`.

This is a **legal position, not an engineering fact**, and B2 and B3 must confirm it in writing **before** the pilot. §10.6 is the designed fallback if a regulator disagrees.

### 10.3 The orchestrator — nine ordered, idempotent steps

`ops.request_erasure(patient_id, case_ref, scope, research_scope)` is granted to `carehome_admin` — an identified human at the site, which is who actually receives the request — and creates the `app.erasure_requests` row. The orchestrator then advances the state machine as `service_role`, one stage per invocation, each idempotent and each stamping its own timestamp column. **The request is never marked complete when the rows are gone from Postgres.**

| # | Stage | Action | Why in this order |
|---|---|---|---|
| 1 | `requested` | Capture the holding-device set from `app.device_patients` **including `unassigned_at` rows**, and `guaranteed_purged_by = max(last_sync_at + hard_expiry_days)` | Capture before any cascade, or the job loses its own work list. This is why `unassigned_at` is soft |
| 2 | `revocations_issued` | One `app.revocations(scope='media')` per `sha256`, then one `scope='patient'`, then `update app.devices set content_valid_until = now()` for every holder | Every assigned tablet learns on its next sync, and refuses to render **anything** until it has synced and therefore purged |
| 3 | `storage_purged` | Delete every `storage.objects` row under `patient/<id>/` | Storage first, deliberately: a row pointing at a deleted object is recoverable; an object with no row is an orphan nobody will ever find. Per-patient content addressing makes this a prefix delete with no reference counting and no concurrency hazard |
| 4 | `map_severed` | `link.sever(participant_code, research_scope)`, then `delete from identity.subject_map` | **This is the erasure of the log.** Nothing in `log` or `proj` is touched. It happens *before* the content delete because `subject_map.patient_id` is `ON DELETE RESTRICT`, so severance is a deliberate step that a cascade cannot perform by accident |
| 5 | `content_deleted` | `delete from app.patients where id = $1` — a real hard `DELETE`, cascading to depicted persons, media objects, media subjects, decks, items, item media, consent events, capacity records, adverse-event **narratives**, caregiver links, device links, assessments, medications | The photographs, the names, the sentences and the recordings are gone. The `RESTRICT` above guarantees stage 4 has already run |
| 6 | — | Null `patient_id` in `log.content_change` and `app.revocations` | The only identifying columns outside `app` |
| 7 | `awaiting_devices` | Wait for `media.purged` receipts | The photograph on a tablet in a care home is the thing that has to disappear |
| 8 | `complete` | When every expected purge is confirmed **or** every unconfirmed device has passed its hard expiry | §10.4 |
| 9 | — | Stamp `backup_horizon_clear_at = now() + ops.config.pitr_days`; write the counts | §10.7 |

Steps 1 and 9 are recorded **in** the log as `erasure.requested` and `erasure.map_severed` server events, referencing a `subject_id` that is meaningless a few statements later. Article 30 record-keeping and Article 17 compliance in the same append-only structure, holding nothing that identifies whose erasure it was.

`media_only` and `item` scopes use the same machine with `scope_key` set, so deleting one photograph is tracked to device confirmation identically. **There is no fast path that skips the device leg.**

### 10.4 Purging media from devices that are currently offline

Four mechanisms, in order of speed, and one honest bound.

**(a) Tombstone.** Every revoked `sha256` appears in `device.device_content` as `op = 'purge'`. ADR §5.2 budgets exactly two device views, so revocations **ride inside the content view** rather than getting a third — a real constraint honoured rather than negotiated. On the next sync the device deletes `${documentDirectory}media/<sha256>` and the SQLite rows.

**(b) Acknowledgement is an ordinary telemetry event.** No new table and **no new grant**: the device writes `media.purged { sha256, revocation_id, local_file_existed }` through the same at-least-once, idempotent, never-lost outbox as everything else, and an `AFTER INSERT` trigger on `log.event_log` stamps `app.revocation_acks`.

**(c) Forced reconnect.** Step 2 sets `content_valid_until = now()`, so the tablet refuses to render anything until it has synced and therefore purged. Powered on and networked: purged within one sync interval. Powered on and offline: it shows "please reconnect this tablet" immediately, which is a caregiver-visible prompt rather than a silent failure.

**(d) Hard expiry as the backstop.** A tablet switched off in a drawer cannot be reached by any mechanism. So:

```sql
create or replace function ops.erasure_is_complete(p_erasure uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1
    from app.revocations rv
    join app.device_patients dp on dp.patient_id = rv.patient_id
    join app.devices d          on d.id = dp.device_id
    left join app.revocation_acks ak on ak.revocation_id = rv.id and ak.device_id = d.id
    where rv.erasure_id = p_erasure
      and ak.acked_at is null
      and d.revoked_at is null
      and coalesce(d.last_sync_at, 'epoch'::timestamptz)
          + make_interval(days => d.hard_expiry_days) > now())
$$;
```

> **A deletion request has a stated maximum time-to-completion of `hard_expiry_days` — default 7, hard minimum 4 — after which the photograph is unrenderable even on a tablet that never reconnects.** That is a number that can go in a privacy policy and be defended under questioning, and it exists only because ADR §4.5's dead-man expiry exists. Without it, "we deleted it" would be unfalsifiable. The policy wording is "within 7 days", never "immediately".

`app.erasure_requests.counts` records `devices_confirmed` and `devices_unconfirmed` and the ledger names the specific devices, so the DPO has a number rather than an assumption. Anything stronger than this is a lie about physics: a device with no power and no radio cannot be commanded.

### 10.5 Erasure in the research plane

```sql
create or replace function link.sever(p_code text, p_scope app.withdrawal_scope)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_scope = 'retrospective' then
    delete from research.participant where participant_pseudonym = p_code;   -- cascades in-schema
    update identity.participant_map
       set subject_id = null, enrolled_on = null, tz_offset_minutes = null,
           allocation_subkey = '\x00'::bytea, severed_at = now(), severance_scope = 'retrospective'
     where participant_code = p_code;
  else
    update identity.participant_map
       set subject_id = null, enrolled_on = null, tz_offset_minutes = null,
           allocation_subkey = '\x00'::bytea, severed_at = now(), severance_scope = 'prospective'
     where participant_code = p_code;
    -- the behavioural rows stay, now genuinely anonymous; the status row records the fact
    update research.participant_status set withdrawn_on_day = <day>, severed = true
     where participant_pseudonym = p_code;
  end if;
end $$;
```

Under GDPR, pseudonymised data is personal data **while the key exists**. Delete the key and the same rows are anonymous data outside the Regulation. In a single-plane design "delete this participant" is a cascading delete across every research table plus every analysis artefact, and it destroys the study's N. Here the default is one row, after which the identifiable content is gone and the behavioural dataset survives as genuinely anonymous data. **The easy path and the lawful path are the same path**, which is not true of any single-plane design.

Three safety interlocks:

- `identity.subject_map.patient_id` is `ON DELETE RESTRICT` and `identity.participant_map.subject_id` is not a foreign key at all. A patient row therefore **cannot** be deleted while a live mapping exists, so the orchestrator must sever at stage 4 before the content delete at stage 5, deliberately, in its own step. No cascade can perform it by accident.
- **Published releases are never rewritten.** A citation stays resolvable. The withdrawal form says so.
- **The safety register survives** (§7.7), keyed on the surviving `participant_code`, coded, anonymous.

**And the invariant that closes the `relational-classic` finding:** *no row anywhere may contain both a research pseudonym and an operational patient identifier.* `app.erasure_requests` holds `case_ref`, dates and counts; it does not hold `participant_code`, and it nulls `patient_id` at step 6. A pgTAP assertion scans `information_schema` for any table carrying both a `participant`-shaped and a `patient`-shaped column. An erasure ledger that retains the key it was created to prove the destruction of is not a ledger.

### 10.6 The fallback, designed rather than hoped for

If a regulator rejects "orphaned pseudonymous data with no reachable mapping is anonymous", the log rows for that subject must be moved to quarantine and dropped, breaking the hash chain.

```sql
create table log.chain_break_register (
  device_id uuid not null, chain_pos_from bigint not null, chain_pos_to bigint not null,
  case_ref text not null, reason text not null, broken_at timestamptz not null default now()
);
```

`log.deny_mutation()` permits a `DELETE` only under the transaction-local `log.erasure_context` GUC, which is set only inside that one function, which is executable only by `service_role`, and which writes the register row **before** it deletes anything. `log.verify_chain()` then reports a registered break rather than tampering. It is a documented, degraded safety register — which is exactly why B2 and B3 must confirm the primary position **before** the pilot, not after.

### 10.7 Backups, where most erasure claims quietly fail

- PITR is configured at **7 days** and `ops.config.pitr_days` mirrors it, so the ledger can compute `backup_horizon_clear_at`.
- **A restore is not complete until `ops.replay_erasure_ledger()` has run**, re-executing every erasure recorded after the restore point. It is a documented runbook step, it is in the disaster-recovery drill, and **the drill is a pilot gate** — because an untested restore that silently resurrects a deleted family photograph is exactly the failure ADR §8 calls "the worst bug in this product".
- `app.erasure_requests` is additionally streamed to append-only object storage outside the database, because it is the one table that must survive a restore *ahead* of the data it governs.
- `identity.study_pepper` is a Supabase Vault reference rather than raw bytes, so a restored backup predating its rotation cannot re-derive a surrogate. This is the narrow case where crypto-shredding genuinely earns its keep. **`link`/`identity` are additionally placed in a separate backup and PITR domain from `research`,** so a single dump is not invertible.

### 10.8 Export — redacted by requester, not by patient

Two proposals authorised the subject-access export on "any caregiver with view permission" and emitted every row joined by patient, including the raw event stream. In a population where 34% of family carers report important levels of abusive behaviour toward the person (§3 #50, P23), **the hostile requester is the modal case, not the edge case.** A full bundle hands a controlling son documentary evidence that his mother asked for his removal, which staff member logged her behavioural refusal and what they wrote, when his sister was added as a second caregiver, and who marked his late father `do_not_show`. GDPR Art. 15(4) says the copy "shall not adversely affect the rights and freedoms of others."

So the export is a function of the **requester**, recorded in `app.export_requests.redaction_profile`:

| Bundle content | `subject_full` (patient's own account, or an independent advocate) | `caregiver_redacted` |
|---|---|---|
| `patient.json`, `items.json`, `media/<sha256>.<ext>` | full | full |
| `consent_log.json` | full append-only log, with recorder identities | outcomes and dates; recorder identity only where it is the requester |
| `depicted_persons.json` | full | names and relationships; **no** `person_status` attribution, no release attestor, no `do_not_show` author |
| Other caregivers' links | full, including removal reasons | **absent** |
| Dissent and adverse-event records | coded, with observer role | coded; **no observer identity, no narrative** |
| `sessions.json`, `events.ndjson` | full, with ids **re-mapped to per-export random values** | ditto |
| Research rows | resolved via `link` under `service_role`, off by default | not offered |

Two further rules. **Ids are re-mapped per export**, so no value in a bundle a family holds also appears in a research release — the linkage that turned a lawful SAR into a permanent pseudonym-to-name bridge in the `relational-classic` proposal. And **every export request is logged where the requesting caregiver cannot read it**: `app.export_requests` is readable by `carehome_admin` and `trial_ops`, and by the patient's own account, never by a non-requesting caregiver.

### 10.9 BIPA retention, enforced rather than published

§15(a) requires a written retention schedule *and* a destruction guideline. `app.media_objects.destroy_by` is `NOT NULL`, set by trigger to `least(purpose_end_date, last_interaction + 3 years)`, with a scheduled job that actually destroys and stamps `destroyed_at`. §15(b) is the release gate in §5.4, applied at upload and to every mechanic. And the actual defence is that no biometric template is ever derived — which is a `pg_extension` and `information_schema` query, not a paragraph.

---

## 11. PROJECTIONS, THE DERIVED PLANE, AND REBUILD DISCIPLINE

### 11.1 The rule, and the CI check behind it

> A table is **authoritative** if and only if no derivation may write it. A table is a **cache** if and only if `truncate` + replay reproduces it exactly. Every table is one or the other. Any table with a `derived_through_ingest_seq` column must be absent from every `GRANT INSERT/UPDATE` outside the derivation role; any table without one must be absent from the derivation job's write set.

Two lists checked against each other in CI. That is the whole discipline, and it is the `relational-classic` proposal's best contribution.

### 11.2 The operational projections

```sql
create schema proj authorization log_writer;
revoke all on schema proj from public, anon, authenticated, device, caregiver,
                             carehome_admin, researcher, trial_ops;

create table proj.session (
  session_id uuid primary key, subject_id uuid not null, device_id uuid not null,
  day_offset int not null, local_hour smallint not null, time_of_day_bucket text not null,
  session_ordinal_today smallint not null, session_mode text not null,
  m2_photo_source text, prime_condition text, allocation_counter bigint, allocation_verified boolean,
  started_anchor_ms bigint not null, duration_ms int,
  planned_n_items smallint not null, completed_n_items smallint,
  session_end_reason text check (session_end_reason in
    ('completed','user_ended','distress_stop','timeout','app_crash','device_failure','faded_to_rest','abandoned')),
  ended_on_success boolean,                    -- S3: computed from telemetry, never asserted
  outcome_provisional boolean not null default true,
  generic_opener_played boolean, generic_closer_played boolean,
  caregiver_present boolean, caregiver_present_source text,
  mean_rt_ms int, median_rt_ms int, isd_residual_rt_ms real, cv_rt real,
  accuracy_ppt smallint, n_lapses smallint, network_state text,
  turnaround_decade smallint,                  -- M-131. First-class or the era analysis is uninterpretable.
  events_lost_estimate int not null default 0, quarantined_event_count int not null default 0,
  clock_divergence_max_ms bigint not null default 0,
  ui_version text not null, scheduler_version text not null,
  content_set_version text not null, scoring_rubric_version text not null,
  derivation_generation int not null, derived_through_ingest_seq bigint not null
);

create table proj.interaction (              -- the §7 interaction row. ~85 columns; see the manifest.
  interaction_id uuid not null,              -- uuid_v5(session_id, ord). Never crosses to research.
  derivation_generation int not null,
  session_id uuid not null, subject_id uuid not null, item_id uuid,
  ord int not null,
  was_delivered boolean not null default true,
  derived_from_complete_stream boolean not null default true,
  -- (identity, context, scheduling state, presentation, timing, hesitation, outcome,
  --  speech features, safety — every field of synthesis §7, sourced ONLY from the log)
  ...
  derived_through_ingest_seq bigint not null,
  primary key (interaction_id, derivation_generation)
);
create index on proj.interaction (subject_id, day_offset);
create index on proj.interaction (item_id, day_offset);
create index on proj.interaction (subject_id, day_offset) where item_is_probe;

create table proj.scheduler_state (          -- a cache. Never authoritative. Granted to no role.
  subject_id uuid not null, scheduler_version text not null,
  state jsonb not null,                      -- opaque to SQL; shape owned by src/domain/scheduler.ts
  folded_through_ingest_seq bigint not null, folded_event_count int not null,
  max_anchor_ms bigint not null, stale boolean not null default false,
  computed_at timestamptz not null default now(),
  primary key (subject_id, scheduler_version)
);

create table proj.moment (                   -- the caregiver's ONLY read path. P5-shaped.
  moment_id uuid primary key,                -- uuid_v5(subject_id, kind, source_event_id): idempotent
  subject_id uuid not null, occurred_on date not null,
  kind text not null check (kind in ('long_narration','song_played','item_first_success',
    'tier1_maintained','session_shared_with_caregiver','new_item_added')),
  item_id uuid, magnitude int,               -- e.g. seconds of speech. Never a score.
  source_event_id uuid not null,
  derived_through_ingest_seq bigint not null
);

create table proj.integrity_flag (
  id bigint generated always as identity primary key,
  subject_id uuid, device_id uuid, session_id uuid,
  kind text not null check (kind in ('seq_gap','clock_divergence','allocation_mismatch',
    'presentation_mismatch','unknown_event_type','seq_collision','concurrent_device',
    'interval_ceiling_breach','arm_changed_after_projection')),
  detail jsonb not null, detected_at timestamptz not null default now(), reviewed_at timestamptz
);

create table proj.derivation_state (
  subject_id uuid primary key,
  derivation_generation int not null default 1,
  derived_through_ingest_seq bigint not null default 0,
  max_anchor_ms bigint not null default 0,
  scheduler_version text not null, scoring_rubric_version text not null,
  input_digest text not null,                -- md5 of the ordered (event_id) stream
  event_count bigint not null default 0,
  derived_at timestamptz not null default now()
);
```

### 11.3 No snapshots. Full refold, and here is the arithmetic

`00-SCHEDULER-SPEC.md` §3 defines one `SchedulerState` per participant, not per item. A 12-week pilot participant produces ~500 events/session × 3 sessions/day × 84 days ≈ **126,000 events**, and a pure integer fold over 126k small objects in Deno is 100–300 ms. Forty participants rebuild in under a minute.

So there is **no `proj.scheduler_snapshot` table, no snapshot cadence policy, and no snapshot invalidation code.** Snapshot invalidation under late arrival is the single most common defect in hand-rolled event-sourced systems, it is silent, it corrupts scheduler state, and it surfaces only as unexplained interval drift. Deleting the mechanism deletes the bug class. At 10× the pilot this decision is revisited with a measured number, not a guess; the migration is additive and is planned in §14.4.

**Late arrival, and why rewind is bounded.** The canonical order is stable but not append-only-in-order: a three-day-offline tablet delivers events that sort before events already projected. `proj.invalidate_from(subject, ingest_seq)` marks the scheduler state stale, bumps `derivation_generation`, and re-enqueues the affected window. `proj.interaction` is keyed `(interaction_id, derivation_generation)` and is an insert, not an update, so a rewind never destroys the generation that was delivered. **The rewind depth is bounded by `hard_expiry_days`**, because a device that has not synced refuses to render and therefore produces no new events — the stolen-tablet dial and the rewind bound turn out to be the same number, which is a genuine convergence and not a retrofit.

### 11.4 Derived-plane constraints record; they never reject

The `relational-classic` proposal put `raise exception` on the derived plane: a tier-1 interval ceiling breach or an uncued-failure-on-a-personal-item aborted the rebuild transaction *after* it had deleted the prior rows, so one anomalous caregiver tap could permanently remove a participant from the study, visible only in a `derivation_jobs.error` column with no research view.

**A constraint on a derived table must record, never reject.** Every scheduler invariant is enforced where it is enforceable — in `src/domain/scheduler.ts`, with property tests — and the database records violations as `proj.integrity_flag` rows that are projected into `research.session` as countable breach counts. And the derivation never deletes before the replacement is computed: it builds into a staging generation and swaps by bumping `derivation_generation`, so a failed rebuild leaves the previous derivation intact.

### 11.5 The research tables, generated from the manifest

`research.*` is a staging plane written by `link_project()` as `bridge`, and its DDL is generated from `research.field_manifest`, so the manifest cannot drift from the schema in either direction (§8.2 assertions 1 and 3).

| Table | Key | Consent gate | Notes |
|---|---|---|---|
| `research.study` | `study_id` | — | protocol and REC references |
| `research.study_access` | `(study_id, researcher_user_id)` | — | identifies the **researcher**, never a subject |
| `research.release` | `(study_id, release_no)` | — | §8.3. Immutable once `published_at` is set |
| `research.field_manifest` | `(research_table, research_column)` | — | the source of the DDL |
| `research.participant` | `participant_pseudonym` | `research_behavioural` | banded clinical context, `m3_arm`, `site_code` |
| `research.participant_status` | `participant_pseudonym` | **none** | enrolment day, `withdrawn_on_day`, `severed`, `sessions_completed`, `last_contact_day`, `device_change_count`, `capacity_status`, `consent_pathway`. Accounting, not behavioural data — this is what `split-planes` could never write, because its status projection sat behind the gate the withdrawal closes |
| `research.session` | `session_ref` | `research_behavioural` | §7 `session`, plus the completeness columns |
| `research.interaction` | `(interaction_ref, derivation_generation)` | `research_behavioural`; speech block on `research_speech_features` | §7 `interaction`, banded per §8.4–§8.5 |
| `research.safety_register` | `adverse_event_ref` | **none** | §7.7. Coded, survives severance |
| `research.consent_event` | `consent_event_ref` | **none** | S6 audit; day offset, type, pathway, outcome, recorder **role** |
| `research.clinician_assessment` | `assessment_ref` | `research_behavioural` | |
| `research.medication_and_comorbidity` | `record_ref` | `research_behavioural` | |
| `research.derived_variable` | `(participant_pseudonym, variable_name, method_version, computed_at_day)` | `research_behavioural` | additive; recomputation is a new `method_version`, never an overwrite |
| `research.coverage_gap` | `(participant_pseudonym, from_day)` | **none** | §8.7 |

Every one of them carries `published_in_release` and `superseded_in_release`.

### 11.6 The caregiver's read path, and its cost

P5 forbids every aggregate of failure, so the caregiver surface is "moments and actions" and nothing else.

```sql
create view app.my_moments with (security_invoker = false) as
select sm.patient_id, m.occurred_on, m.kind, m.magnitude, m.item_id
from proj.moment m
join identity.subject_map sm on sm.subject_id = m.subject_id
where exists (select 1 from app.patient_caregivers pc
              where pc.patient_id = sm.patient_id and pc.user_id = auth.uid()
                and pc.removed_at is null and pc.can_view_moments);
alter view app.my_moments owner to app_view_owner;
grant select on app.my_moments to caregiver;
```

There is no `correct`, no `grade`, no accuracy, no count, no trend, and no trajectory — **ND-22 as a set of missing columns, not as a product decision someone could reverse in a sprint.**

**The honest cost, and it is the objection to this whole design.** "Show me this week's moments for Mum" against a raw log is a scan of every event that subject ever produced; it is fast only because `proj.moment` exists. Every caregiver screen needs a projection built for it, which means **adding a screen is a migration, not a query**: define the fold, write the projector, write the backfill, run it over the whole log, add the index. Half a day rather than half an hour, every time, forever.

What we buy is that the backfill is *possible*. A mutable-state design that did not record the underlying facts cannot produce a screen about the past at all. Over a 12-week pilot where the analysis questions are not fully known at week 1, retrospective answerability is worth more than fast answers to known questions — and P5 has already capped the caregiver surface at "moments and actions", so the number of projections is small and known in advance. **If that cap moves, this argument moves with it**, and that is the objection I would want argued hardest.

Projection lag is a few seconds, not zero: the queue is drained by a worker, not inside the device's transaction (§6.7). The caregiver surface therefore shows a "syncing" state, which it needs anyway because the tablet may have been offline for three days.

---

## 12. ROW-LEVEL SECURITY

### 12.1 Approach

- **Grants first, policies second.** Three of the five cells on the `researcher` row of §3's matrix are empty, and that emptiness *is* the de-identification. The RLS suite therefore asserts `42501` (insufficient privilege) rather than zero rows for the negative cases: zero rows means a policy is doing the work and a policy can be edited; `42501` means the grant is doing the work.
- **RLS is enabled AND forced on every table in `app`, `log`, `proj`, `identity`, `research`.** `force` matters because migrations run as owner and an unforced table lets the owner bypass. A pgTAP test asserts `relrowsecurity and relforcerowsecurity` for every relation in those schemas, so a new table cannot ship unprotected.
- **Every policy names a role.** `to caregiver`, never `to authenticated`, never omitted — a policy with no `TO` clause applies to `PUBLIC` and is a common silent hole. A pgTAP test asserts `pg_policy.polroles <> '{0}'` everywhere.
- **Cross-table predicates go through `security definer` helpers**, so the role needs no `SELECT` on the referenced table (this is exactly how the device gets zero `SELECT` while policies still reference `device_patients`) and so RLS on the referenced table does not recurse. Every call site is wrapped as `(select app.fn())` so the planner hoists it into an InitPlan evaluated once per query.

```sql
create or replace function app.device_patient_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select dp.patient_id from app.device_patients dp
  where dp.device_id = authn.device_id() and dp.unassigned_at is null $$;

-- NOTE the second one: ingest authorises on EVER-ASSIGNED, not currently-assigned.
create or replace function app.device_ever_served(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.device_patients dp
                 where dp.device_id = authn.device_id() and dp.patient_id = p_patient) $$;

create or replace function app.caregiver_patient_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select pc.patient_id from app.patient_caregivers pc
  where pc.user_id = auth.uid() and pc.removed_at is null $$;

create or replace function app.caregiver_edits(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.patient_caregivers pc join app.patients p on p.id = pc.patient_id
                 where pc.patient_id = p_patient and pc.user_id = auth.uid()
                   and pc.removed_at is null and pc.can_author_content and p.erased_at is null) $$;

create or replace function app.admin_care_home_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.care_home_id from app.memberships m
  where m.user_id = auth.uid() and m.role = 'carehome_admin' and m.revoked_at is null $$;
```

### 12.2 The device — a four-row surface

```sql
create policy device_appends_own_events on ingest.event for insert to device
with check (
      authn.jwt_role() = 'device'
  and device_id = (select authn.device_id())
  and (select app.device_ever_served(patient_id))
);
-- and the identical policy on ingest.session.
-- There is NO select, update or delete policy on ingest.*, for any role.
```

Three deliberate omissions in that `WITH CHECK`, each of which was a fatal finding somewhere:

- **No consent predicate.** §7.5.
- **No `revoked_at is null` predicate.** A revoked device must still be able to *deposit* — it can already never read anything — because revocation is precisely when a device is holding evidence somebody wants. The client sequences the drain before the wipe.
- **`device_ever_served`, not currently-assigned.** A shared tablet reassigned on Friday still holds three days of telemetry for the previous resident, including adverse events. Authorising on the *current* assignment refuses it permanently with `42501`, and F2's zero-delivery number is lost for exactly the disrupted deployments most likely to produce it.

The device's two views are the only place in the design where a `WHERE` clause carries authorisation for the device rather than a missing grant. That is unavoidable — the device must see *some* patients — and it is why `policies.ts` pins them with negative tests as well as positive ones.

```sql
create view device.device_content with (security_invoker = false) as
select 'upsert'::text as op, i.patient_id, i.id as item_id,
       dp.display_name as person_display_name, i.one_sentence, i.tier, i.content_class,
       i.era_decade, i.content_language, i.is_month_target,
       (i.recognition_enabled and coalesce(dp.person_status,'living')
          not in ('deceased','estranged','do_not_show'))
         or dp.recognition_override_at is not null            as recognition_allowed,
       coalesce(dp.person_status::text,'living')              as person_status,
       -- telemetry echo fields: banded here so the raw values reach neither the tablet
       -- nor the research plane, and so the device can freeze them into the event (§9)
       app.relationship_group(dp.relationship)                as relationship_group,
       app.era_band(i.era_decade)                             as era_band,
       app.valence_band(i.caregiver_rated_valence)            as valence_band,
       app.importance_band(i.caregiver_rated_importance)      as importance_band,
       i.content_provenance, i.content_is_generic,
       m.sha256 as media_sha256, m.mime as media_mime, m.bytes as media_bytes,
       im.role as media_role, im.ord,
       d.content_valid_until, i.updated_at
from app.items i
join app.device_patients dpat on dpat.patient_id = i.patient_id and dpat.unassigned_at is null
join app.devices d on d.id = dpat.device_id
left join app.depicted_persons dp on dp.id = i.depicted_person_id
left join app.item_media im on im.item_id = i.id
left join app.media_objects m on m.id = im.media_id
where dpat.device_id = (select authn.device_id())
  and authn.jwt_role() = 'device'
  and d.revoked_at is null
  and i.retired_at is null
  and i.absorbing_since is null                                  -- P18: absorbing items do not ship
  and coalesce(dp.person_status,'living') <> 'do_not_show'
  and app.consent_permits(i.patient_id, 'care_delivery')
  -- ADR §4.2: a card is never shown unless ALL its media are ready. Withheld server-side,
  -- so a half-ready item cannot render with a missing photograph.
  and not exists (select 1 from app.item_media im2
                  join app.media_objects m2 on m2.id = im2.media_id
                  where im2.item_id = i.id
                    and (m2.state <> 'ready' or m2.deleted_at is not null))
union all
-- revocations RIDE INSIDE the content view, because ADR §5.2 budgets exactly two device views
select 'purge'::text, rv.patient_id, rv.item_id, null,null,null,null,null,null,null,null,null,
       null,null,null,null,null,null,
       rv.media_sha256, null,null,null,null, null, rv.created_at
from app.revocations rv
join app.device_patients dpat on dpat.patient_id = rv.patient_id
where dpat.device_id = (select authn.device_id()) and authn.jwt_role() = 'device';

create view device.device_roster with (security_invoker = false) as
select p.id as patient_id, p.display_first_name, p.ui_version_pinned, av.sha256 as avatar_sha256,
       d.content_valid_until, d.hard_expiry_days
from app.patients p
join app.device_patients dpat on dpat.patient_id = p.id and dpat.unassigned_at is null
join app.devices d on d.id = dpat.device_id
left join app.media_objects av on av.id = p.avatar_media_id
where dpat.device_id = (select authn.device_id())
  and authn.jwt_role() = 'device'
  and d.revoked_at is null
  and p.erased_at is null
  and app.consent_permits(p.id, 'care_delivery');   -- S6: the row VANISHES on dissent

alter view device.device_content owner to app_view_owner;
alter view device.device_roster  owner to app_view_owner;
grant usage  on schema device to device;
grant select on device.device_content, device.device_roster to device;
```

`device_roster` is `patient_id`, first name, avatar hash, and the expiry dial. Exactly what ADR §5.3 says a thief gets: *N people live somewhere, not who, where, or with what condition.*

### 12.3 The caregiver

```sql
create policy patients_caregiver_select on app.patients for select to caregiver
  using (id in (select app.caregiver_patient_ids()));

-- There is deliberately NO INSERT policy on app.patients. Enrolment goes through an RPC that
-- also writes consent.initial as study_staff, and the missing policy IS the enforcement.
create policy patients_caregiver_update on app.patients for update to caregiver
  using      (id in (select app.caregiver_patient_ids()) and app.caregiver_edits(id))
  with check (id in (select app.caregiver_patient_ids())
              -- P10 and §9 Gate 3 as a policy: study-integrity fields are frozen at enrolment,
              -- and the enrolling caregiver is exactly the person with a motive to edit them.
              and ui_version_pinned  = (select o.ui_version_pinned  from app.patients o where o.id = app.patients.id)
              and dementia_subtype   = (select o.dementia_subtype   from app.patients o where o.id = app.patients.id)
              and tz_offset_minutes  is not distinct from (select o.tz_offset_minutes from app.patients o where o.id = app.patients.id)
              and enrolled_on        is not distinct from (select o.enrolled_on       from app.patients o where o.id = app.patients.id));

create policy items_caregiver_rw on app.items for all to caregiver
  using      (patient_id in (select app.caregiver_patient_ids()))
  with check (app.caregiver_edits(patient_id)
              and app.consent_permits(patient_id, 'care_delivery'));
create policy items_no_delete on app.items for delete to caregiver, carehome_admin using (false);
-- nobody deletes an item. Retirement is an UPDATE; deletion is erasure only.

-- identical shape on app.depicted_persons, app.media_objects, app.media_subjects,
-- app.item_media, app.decks — all gated on can_author_content.

create policy consent_caregiver_select on app.consent_events for select to caregiver
  using (patient_id in (select app.caregiver_patient_ids()));
create policy consent_caregiver_insert on app.consent_events for insert to caregiver
  with check (patient_id in (select app.caregiver_patient_ids())
              and recorded_by = auth.uid()
              and recorded_by_role in ('caregiver','consultee')
              -- the CHECK constraints in §5.2 do the rest: a caregiver physically cannot
              -- form a "the subject consented" row, and cannot record an entry event.
             );
create policy consent_no_update on app.consent_events for update to caregiver, carehome_admin using (false);
create policy consent_no_delete on app.consent_events for delete to caregiver, carehome_admin using (false);

create policy caregiver_no_events on log.event_log for select to caregiver using (false);
-- explicit false rather than absence: it documents the intent and is testable positively.
```

The caregiver's read path is `app.my_moments` (§11.6), a definer view. The asymmetry with the researcher — the caregiver has a legitimate RLS-scoped grant on `identity.subject_map`, the researcher has none on `identity` at all — is intentional and is written into `policies.ts`.

### 12.4 The care-home admin, the researcher, the trial-ops role

```sql
create policy patients_admin_all on app.patients for all to carehome_admin
  using      (care_home_id in (select app.admin_care_home_ids()))
  with check (care_home_id in (select app.admin_care_home_ids())
              -- the freeze applies with MORE force to the role with more power, not less
              and ui_version_pinned = (select o.ui_version_pinned from app.patients o where o.id = app.patients.id)
              and enrolled_on       is not distinct from (select o.enrolled_on from app.patients o where o.id = app.patients.id));

-- same shape on app.devices, app.device_patients, app.enrolment_codes, app.memberships,
-- app.patient_caregivers, app.acute_change_notifications.
create policy items_admin_none on app.items for select to carehome_admin using (false);
-- an admin manages tablets, not a resident's family photographs.

-- researcher: NO POLICIES, because NO GRANTS. It cannot name a table outside `analysis`.
-- trial_ops: NO POLICIES on app/log/proj, because NO GRANTS. It reaches `ops` definer views only.
```

`ops` views are owned by `ops_view_owner`, which holds `SELECT` on `app`, `proj` and `log` aggregates. The trial-operations console is **identified** — it names participants, care homes and devices — because it is the sponsor's live safety instrument and six of seven Tier-1 criteria depend on it. That is why it is a separate role and a separate schema from `researcher`/`analysis`, and why the `event-sourced` proposal's `where grantee='researcher' and table_schema not in ('research','ops')` assertion was wrong: `ops.erasure_ledger` carried `subject_id` and `media_sha256`, which is a three-way bridge and a perfect index on a family photograph sitting inside the researcher's own sanctioned surface. **`researcher` has no grant on `ops`. The assertion is `table_schema <> 'analysis'`, with no exception.**

### 12.5 Storage

```sql
create policy media_caregiver_rw on storage.objects for all to caregiver
using      (bucket_id = 'patient-media'
            and ((storage.foldername(name))[2])::uuid in (select app.caregiver_patient_ids()))
with check (bucket_id = 'patient-media'
            and app.caregiver_edits(((storage.foldername(name))[2])::uuid)
            and app.consent_permits(((storage.foldername(name))[2])::uuid, 'media_retention'));
-- device: NO policy and NO grant on storage.objects. Media reaches a tablet only through
--   short-lived signed URLs minted by /sync.
-- researcher and trial_ops: NO policy and NO grant. They never touch media.
```

### 12.6 `service_role`, and the three mitigations

`service_role` bypasses RLS in Supabase. That is not fixable; it is bounded.

- **The Edge Functions that hold it verify the caller's own JWT and membership first.** `/sync` does **not** hold it at all for the ingest path (§6.8).
- **Definer functions in `log`, `ingest` and `proj` are owned by `log_writer`; those in `identity`, `research` and `analysis` are owned by `bridge`.** Neither is a superuser, neither can log in, and `bridge` has `SELECT`-only on `app`. A defect in a definer function escalates to almost nothing. Every definer function without exception carries `set search_path = ''`; without the pinned empty path, a definer function is a privilege-escalation primitive.
- **`ops.request_erasure` is granted to `carehome_admin`, not hidden behind `service_role`,** so the most destructive operation in the system is initiated by an identified human whose action lands in `log.content_change` and `app.erasure_requests`.

---

## 13. `policies.ts` — the machine-readable expectation table

Written from the spec, never from the SQL (ADR §6.1). The RLS suite iterates this table. Every row is blind-writable by an agent that has never seen a line of the migrations. `deniedWhen` distinguishes the two failure shapes explicitly, because they are different assertions: **`42501` means a grant is missing; zero rows means a policy ran.**

```ts
export const policyExpectations = [
  // ── device: the entire reachable surface, and it is four rows ─────────────────────────
  { role:'device', object:'device.device_roster', verb:'select',
    allowedWhen:'patient is assigned to the token device_id, device not revoked, care_delivery consent effective',
    deniedWhen:'ZERO ROWS when the patient belongs to another device/ward/home, or consent is withdrawn, or dissent is active, or the patient is erased' },
  { role:'device', object:'device.device_content', verb:'select',
    allowedWhen:'as roster, and the item is not retired, not absorbing, and ALL its media are ready',
    deniedWhen:'ZERO ROWS when the item is retired, absorbing, has any non-ready media, or names a do_not_show person' },
  { role:'device', object:'ingest.event', verb:'insert',
    allowedWhen:'device_id equals the token device_id AND the device has EVER been assigned that patient',
    deniedWhen:'42501 when device_id is any other value, or the device was never assigned that patient' },
  { role:'device', object:'ingest.session', verb:'insert',
    allowedWhen:'same as ingest.event',
    deniedWhen:'42501, same as ingest.event' },

  // ── device: the negatives that matter ────────────────────────────────────────────────
  { role:'device', object:'ingest.event',  verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501: no select grant exists on ingest.*' },
  { role:'device', object:'log.event_log', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501: no usage on schema log' },
  { role:'device', object:'app.patients',  verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501: no usage on schema app for select' },
  { role:'device', object:'app.items',     verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'device', object:'proj.interaction', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501: no usage on schema proj' },
  { role:'device', object:'storage.objects',  verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. no grant, no policy' },
  { role:'device', object:'*', verb:'update', allowedWhen:'never', deniedWhen:'ALWAYS, in every schema, on every object' },
  { role:'device', object:'*', verb:'delete', allowedWhen:'never', deniedWhen:'ALWAYS, in every schema, on every object' },
  { role:'device', object:'ingest.event', verb:'insert-naming-server-column', allowedWhen:'never',
    deniedWhen:'ALWAYS. 42501 "permission denied for column" at parse time — anchored_at_ms, ingest_seq, chain_pos and received_at are not in the column-level grant' },
  { role:'device', object:'ingest.event', verb:'insert-returning', allowedWhen:'never',
    deniedWhen:'ALWAYS. RETURNING requires SELECT; the client must send Prefer: return=minimal' },
  { role:'device', object:'ingest.event', verb:'insert-duplicate-event_id', allowedWhen:'always',
    deniedWhen:'never — the second insert of the same event_id is a NO-OP, not an error' },
  { role:'device', object:'ingest.event', verb:'insert-batch-with-one-bad-row', allowedWhen:'always',
    deniedWhen:'never — the good rows commit and the bad row appears in log.quarantine. A batch is NEVER aborted by one row' },
  { role:'device', object:'ingest.event', verb:'ack-is-per-id', allowedWhen:'always',
    deniedWhen:'never — /sync returns {accepted, quarantined}; HTTP 201 alone is NOT an ACK and the device must not delete an unlisted outbox row' },
  { role:'device', object:'ingest.event', verb:'insert-after-consent-withdrawn', allowedWhen:'ALWAYS',
    deniedWhen:'never — consent governs USE, not RECEIPT. A withdrawn patient\'s tablet must still be able to deposit the evidence' },
  { role:'device', object:'ingest.event', verb:'insert-after-reassignment', allowedWhen:'ALWAYS, for a patient the device was ever assigned',
    deniedWhen:'never — the three-day backlog of a reassigned tablet must still land' },
  { role:'device', object:'auth.users', verb:'update-app_metadata', allowedWhen:'never',
    deniedWhen:'ALWAYS; and a token re-minted after the attempt still carries role=device' },

  // ── append-only, for every role including the owner and service_role ─────────────────
  { role:'*', object:'log.event_log',      verb:'update', allowedWhen:'never', deniedWhen:'ALWAYS. 42501 from the trigger, even for the table owner' },
  { role:'*', object:'log.event_log',      verb:'delete', allowedWhen:'never', deniedWhen:'ALWAYS, except inside ops.execute_chain_break under the log.erasure_context GUC' },
  { role:'*', object:'log.event_log',      verb:'truncate', allowedWhen:'never', deniedWhen:'ALWAYS' },
  { role:'*', object:'app.consent_events', verb:'update', allowedWhen:'never', deniedWhen:'ALWAYS. Corrections are superseding rows' },
  { role:'*', object:'app.consent_events', verb:'delete', allowedWhen:'never', deniedWhen:'ALWAYS' },
  { role:'*', object:'app.arm_assignment', verb:'update', allowedWhen:'never', deniedWhen:'ALWAYS. A changed arm is a new superseding row and an integrity flag' },

  // ── researcher: de-identification IS the missing grant ───────────────────────────────
  { role:'researcher', object:'schema app',      verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'schema identity', verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501 "permission denied for schema identity" — a privilege error, NOT an empty result' },
  { role:'researcher', object:'schema log',      verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'schema proj',     verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'schema research', verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501 — the base tables are unreachable; only `analysis` views are' },
  { role:'researcher', object:'schema ops',      verb:'usage',  allowedWhen:'never', deniedWhen:'ALWAYS. 42501 — the ops console is identified and is not the research surface' },
  { role:'researcher', object:'app.patients',    verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'app.media_objects', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'identity.participant_map', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'identity.subject_map',     verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'research.interaction',     verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501 — base table; reachable only through analysis.interaction' },
  { role:'researcher', object:'link.sever / link.project / link.pseudo_id', verb:'execute', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'researcher', object:'storage.objects', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. no grant, no policy' },
  { role:'researcher', object:'analysis.interaction', verb:'select',
    allowedWhen:'the participant is in a study the researcher has unexpired study_access to, AND the row is published in a release at or before the pinned release, AND research_behavioural consent was effective when the row was projected',
    deniedWhen:'ZERO ROWS for another study, expired access, a release after the pin, a superseded generation, or a participant severed retrospectively' },
  { role:'researcher', object:'analysis.safety_register', verb:'select',
    allowedWhen:'ALWAYS for the researcher\'s own study, INCLUDING for participants who withdrew research consent or were severed prospectively',
    deniedWhen:'ZERO ROWS only for another study or expired access' },
  { role:'researcher', object:'analysis.*', verb:'insert/update/delete', allowedWhen:'never', deniedWhen:'ALWAYS. views owned by bridge; no write grant exists' },

  // ── caregiver ───────────────────────────────────────────────────────────────────────
  { role:'caregiver', object:'app.patients', verb:'select',
    allowedWhen:'a patient_caregivers row exists for auth.uid() with removed_at null',
    deniedWhen:'ZERO ROWS for a revoked link, or any other patient including one in the same care home' },
  { role:'caregiver', object:'app.patients', verb:'insert', allowedWhen:'never',
    deniedWhen:'ALWAYS. There is no INSERT policy; enrolment is an RPC that also writes consent as study_staff' },
  { role:'caregiver', object:'app.patients', verb:'update', allowedWhen:'the link carries can_author_content',
    deniedWhen:'the update changes ui_version_pinned, dementia_subtype, enrolled_on or tz_offset_minutes (P10 / §9 Gate 3)' },
  { role:'caregiver', object:'app.consent_events', verb:'insert-subject-consented', allowedWhen:'never',
    deniedWhen:'ALWAYS. 23514 — a caregiver may never assert that the patient consented (P22 / MCA ss.30-33)' },
  { role:'caregiver', object:'app.consent_events', verb:'insert-consultee-consented', allowedWhen:'never',
    deniedWhen:'ALWAYS. 23514 — no enum value on the consultee pathway means "consented"' },
  { role:'caregiver', object:'app.consent_events', verb:'insert-initial', allowedWhen:'never',
    deniedWhen:'ALWAYS. 23514 — entry events require recorded_by_role in (clinician, study_staff)' },
  { role:'caregiver', object:'app.consent_events', verb:'insert-withdrawal', allowedWhen:'always' , deniedWhen:'never' },
  { role:'caregiver', object:'app.consent_events', verb:'insert-dissent_observed', allowedWhen:'always', deniedWhen:'never' },
  { role:'caregiver', object:'app.depicted_persons', verb:'insert-without-person_status', allowedWhen:'never',
    deniedWhen:'ALWAYS. 23502 — P16 is NOT NULL with no default and cannot be skipped' },
  { role:'caregiver', object:'app.media_objects', verb:'set-state-ready-with-no-subject-and-no-attestation', allowedWhen:'never',
    deniedWhen:'ALWAYS. 23514 — absence of a tag must not read as absence of a person (BIPA 15(b))' },
  { role:'caregiver', object:'app.items', verb:'delete', allowedWhen:'never', deniedWhen:'ALWAYS. using(false)' },
  { role:'caregiver', object:'log.event_log',  verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'caregiver', object:'proj.interaction', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'caregiver', object:'analysis.interaction', verb:'select', allowedWhen:'never', deniedWhen:'ALWAYS. 42501' },
  { role:'caregiver', object:'app.my_moments', verb:'select',
    allowedWhen:'the link carries can_view_moments',
    deniedWhen:'ZERO ROWS when the permission is removed at the patient\'s request; and the view exposes NO accuracy, score, count or trend column of any kind (ND-22)' },
  { role:'caregiver', object:'auth.users', verb:'update-app_metadata', allowedWhen:'never', deniedWhen:'ALWAYS' },

  // ── care-home admin ─────────────────────────────────────────────────────────────────
  { role:'carehome_admin', object:'app.devices', verb:'update',
    allowedWhen:'the device\'s care_home_id is in the admin\'s memberships',
    deniedWhen:'ZERO ROWS / 23514 for a device in another home' },
  { role:'carehome_admin', object:'app.items', verb:'select', allowedWhen:'never',
    deniedWhen:'ALWAYS, using(false) — an admin manages tablets, not a resident\'s family photographs' },
  { role:'carehome_admin', object:'ops.request_erasure', verb:'execute',
    allowedWhen:'the patient is in the admin\'s care home',
    deniedWhen:'42501 for any other patient' },

  // ── structural invariants, asserted as data ─────────────────────────────────────────
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no app.patients row with dementia_subtype PCA or svPPA and a non-null enrolled_on can exist (ND-35)' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no column in ANY schema can hold a biometric template, embedding, descriptor, voiceprint, faceprint, speaker_id or face_bbox (P20)' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no column in schema research or analysis has type uuid, date, timestamp, timestamptz or interval (ND-18)' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no relation in schema analysis has relkind <> \'v\' (a materialised view would freeze the consent gate)' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no foreign key leaves schema research' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no FK path with ON DELETE CASCADE reaches log.event_log from auth.users or app.devices' },
  { role:'*', object:'INVARIANT', verb:'schema',
    allowedWhen:'-', deniedWhen:'no table anywhere carries both a participant-pseudonym-shaped and a patient-identifier-shaped column' },
  { role:'*', object:'INVARIANT', verb:'data',
    allowedWhen:'-', deniedWhen:'no event payload accepts a string outside {lowercase snake token, uuid, hex digest, dotted version}; a 5,000-name dictionary is rejected 5,000 times' },
  { role:'*', object:'INVARIANT', verb:'data',
    allowedWhen:'-', deniedWhen:'anchored_at_ms is non-decreasing in seq for every device_id (SCHEDULER-SPEC 6.1)' },
  { role:'*', object:'INVARIANT', verb:'data',
    allowedWhen:'-', deniedWhen:'a device_roster row disappears within one sync of dissent_observed, and within hard_expiry_days for an offline device' },
  { role:'*', object:'INVARIANT', verb:'data',
    allowedWhen:'-', deniedWhen:'no research release publishes with k < 5 on the quasi-identifier tuple or on the deck-composition tuple' },
  { role:'*', object:'INVARIANT', verb:'data',
    allowedWhen:'-', deniedWhen:'the ZZSENTINELZZ fuzz string, written into every free-text column in app AND into every event payload string field, appears zero times in schema research and in every analysis view' },
  { role:'*', object:'INVARIANT', verb:'code',
    allowedWhen:'-', deniedWhen:'the /sync ingest path constructs its Supabase client from SERVICE_ROLE_KEY rather than from the device Authorization header (CI check on the function source)' },
] as const;
```

---

## 14. LESS IS MORE — what was deliberately not built

60 tables across ten schemas is a lot of schema. It is defensible only if every table maps to an obligation nobody can delete, so here is the counting, and here is the list of things I was tempted to add and did not.

**The count:** `app` 27 · `log` 7 · `ingest` 2 · `identity` 3 · `proj` 6 · `research` 14 · `ops` 1. Against: a ~120-field telemetry specification, a 40-item never-do list, seven Tier-1 safety criteria measured from telemetry, seven Tier-2 feasibility criteria, six mechanism criteria, four separately-revocable consent purposes, three biometric statutes, and a regulated population under MCA ss.30–33. Every table below is named in one of those documents.

### 14.1 Tables I was tempted to add, and did not

| Table | Why it was tempting | Why it is not here |
|---|---|---|
| `app.item_revision` | "What was true about this item at time T" is a real question | The stimulus descriptor is frozen into the event at stimulus paint (§9). A revision table records what the *database* believed; the event records what the *patient saw*. The second is strictly better evidence, and it is one jsonb key rather than a table, a trigger, a bitemporal join and a backfill |
| `proj.scheduler_snapshot` | Every event-sourced design has snapshots | A full refold of a 12-week participant is 126k events and 100–300 ms. Snapshot invalidation under late arrival is the most common defect in hand-rolled event sourcing, it is silent, and it corrupts scheduler state. **Deleting the mechanism deletes the bug class.** Revisit at 10× with a measured number |
| `identity.subject_salt` | Per-subject HMAC salt for `response_hash` | `response_hash` is not in v1 at all (§6.5). No consumer, no table |
| `identity.safety_tombstone` | The safety register must outlive severance | The severed `participant_map` row **is** the tombstone: `participant_code` survives while `subject_id`, `enrolled_on`, `tz_offset_minutes` and the subkey are destroyed |
| `identity.allocation_subkey` | A secret with a different reader | One column on `participant_map`. The reader is the same (`bridge`) and the lifetime is the same |
| `link.break_glass` | Legitimate re-identification for safety | Product-shape §8.2 forbids "a live view of a named participant". The safety instrument is the **ops console**, which is identified, live and operational. Re-identifying from the *research* plane is the thing this design exists to prevent, so there is no lawful reason to build a door. **Stated cost:** a safety signal first noticed in a release cannot be traced to a person; the mitigation is that the same signal is visible in real time on the ops console, which is where it should have been noticed |
| `app.consent_write_authority` | "Who may write which consent event" as data | Three `CHECK` constraints on `app.consent_events` say it, and a constraint you can point at is better evidence than a lookup table an RPC has to remember to consult |
| `app.dissent_observations` | Dissent has its own vocabulary and its own trigger | It is a `consent_events` row with `outcome='dissent_observed'` and `dissent_channel`. Two tables meant two write paths that could disagree about whether dissent had been recorded |
| `app.enrolment_context` | The §7 `participant` block is conceptually separate | Eight columns on `app.patients`. A second table buys a second RLS policy set and nothing else |
| `app.probe_item_set` | The probe set is versioned and frozen | `app.generic_library.probe_ordinal`, with a partial unique index on `(content_set_version, probe_ordinal)`. Same guarantee, no join |
| `app.device_purge_expectations` | The completion condition should be a countable set of rows | It is computable as `revocations × device_patients` (including `unassigned_at` rows, which is why that column is soft). Only the **acks** are stored, because only the acks are facts nobody can recompute |
| `ops.erasure_ledger` | Art. 30 needs a permanent record | `app.erasure_requests` already carries the case reference, every stage timestamp and the counts. A second table was the exact place where `relational-classic` accidentally kept a permanent pseudonym-to-patient bridge |
| `research.probe_trial` | §7 names it | A view: `analysis.probe_trial` over `research.interaction where item_is_probe`. Duplicating ~85 columns to filter one boolean is not normalisation |
| `research.session_outcome` | Two proposals split header from outcome | The device never writes an outcome — it has INSERT and no UPDATE — so there is nothing to separate. One `research.session` |
| `app.sessions` as a mutable table | "One row per session" feels like a table | The device inserts a shell into `ingest.session` and never touches it again. Every outcome is derived. That is how "zero UPDATE anywhere" and "one row per session" coexist without a state machine |
| `app.derivation_jobs` | The rebuild needs a queue | `log.projection_queue` plus `proj.derivation_state` already are one |
| `proj.consent_state` | Consistency: everything derived lives in `proj` | Consent is human-written, so its materialisation lives beside its source in `app`, where policies can read it without a cross-schema grant. `proj` is *event-log*-derived, `app.consent_state` is *consent-log*-derived, and mixing them would have hidden that distinction |
| `app.wards` | ADR §5.3 mentions cross-ward isolation | `device_patients` is a strictly finer-grained boundary and already delivers it. A ward table would be an unused join |
| `log.upcaster` registry | An event at `payload_version 1` must replay at v7 forever | v1 has one payload version. The obligation is named in §17 and the machinery is built when the second version exists, not before |
| A separate `research.speech_feature` table | The block must be droppable wholesale | It is droppable by removing its manifest rows, which regenerates the DDL and fails CI if the projector still writes them. The manifest already is the mechanism |

### 14.2 Mechanisms deliberately not built

- **No snapshot cadence policy, no projection-lag SLO, no read-your-own-writes strategy.** The caregiver surface already needs a "syncing" state because the tablet may have been offline for three days.
- **No upcaster chain.** §17 names it as a monotonically growing obligation the moment version 2 exists.
- **No partitioning of `log.event_log`.** Range-partitioning forces the partition key into the primary key, which weakens the `event_id` idempotency guarantee the whole telemetry story rests on. §14.4.
- **No materialised views anywhere.** A pgTAP assertion enforces it, because a materialised view over a consent-gated query is a consent gate that silently freezes.
- **No `alter default privileges ... grant` in any schema.** Every grant is per object, so a new object fails closed.
- **No CRDT, no PowerSync, no merge engine.** ADR §4.4 established there is nothing to merge, and this design does not reintroduce it.
- **No SQL scheduler.** ADR §11 eliminated `nextjs-fullstack` partly for requiring the scheduler implemented twice and reconciled by a property test. `proj.scheduler_state.state` is an opaque jsonb blob Postgres never interprets.

### 14.3 Residual risks, named rather than papered over

**Who can still re-identify a participant, and what is done about it.**

| Actor | Can they? | Mitigation |
|---|---|---|
| `researcher` role, by any query, now or after any future migration that grants nothing | **No.** The mapping is unreachable, the join key was never written into the plane, and the plane holds no uuid, no date, no media reference and no free text | This is the claim, and it is `\dp`-inspectable |
| A caregiver who also holds a researcher account | **No.** They hold `subject_id ↔ patient_id` for their own patient; the researcher half of the bridge does not exist in any queryable object | The 28-day enrolment-window residual (§8.3) and the k≥5 deck-composition gate (§8.4) are what stand between them and a *guess* about their own relative. Both are stated |
| `service_role` key holder | **Yes.** | Largest residual in the design, and not created by it — every Supabase architecture has it. Mitigated by Vault-held peppers, non-superuser definer owners, and `/sync` not holding it |
| Supabase dashboard SQL-editor user | **Yes. UNMITIGATED at the schema level.** | Named as a DPIA control: restricted membership, MFA, access logging, quarterly review |
| Backup / PITR snapshot holder | **Yes, for a full-cluster dump.** | `identity` is in a separate backup and PITR domain from `research`; peppers are Vault references, so a research-only dump is not invertible. A full-cluster dump is not defended and is stated |
| Postgres superuser / platform operator | **Yes.** | Out of scope for any design short of client-side encryption. Stated |
| Small-N arithmetic on quasi-identifiers | **Possibly**, in a cohort of thirty | k≥5 release gate on both the demographic tuple and the deck-composition tuple, with suppressions recorded per release. Structural separation defeats the join; it does not defeat arithmetic |

**The other residuals.**

1. **GDPR erasure holds, but it is a legal position and not an engineering fact.** The design depends on "orphaned pseudonymous data with no reachable mapping is anonymous" (Recital 26) being accepted. It is materially stronger than crypto-shredding — no key to recover, no ciphertext to attack, nothing but tokens and integers, and the payload constraint makes the claim verifiable rather than asserted. **B2 and B3 must confirm it before the pilot.** The fallback (§10.6) is a documented chain break, which is a degraded safety register.
2. **The safety register's separate legal basis is a legal position too.** §7.7. **B5 must confirm in writing** that adverse-event retention survives research-consent withdrawal, before the pilot opens.
3. **`administered_by` is unmeasured for undeclared sessions**, and the protocol pre-registers the confound rather than filling it with a constant (§8.6).
4. **The speech-feature block may not ship.** If the equal-error-rate test in §8.8 shows the exported prosodic profiles verify a speaker, it does not ship, and B3 must be scoped to aggregated features rather than templates.
5. **Two writers, one subject is a misconfiguration the design flags rather than absorbs.** Two shared tablets running offline sessions for one resident produce interleaved streams; the fold sees one interleaved history and its interval bookkeeping is slightly wrong for the overlapping window. `00-SCHEDULER-SPEC.md` §6.1 already ships "one device per patient at a time" as a stated precondition; `proj.integrity_flag(kind='concurrent_device')` raises it rather than silently producing subtly wrong intervals in the research dataset.
6. **The definer-view liability.** `device.*`, `app.my_moments`, `analysis.*` and `ops.*` run as their owner with the scope predicate in the body, because the calling role has no base-table grants and `security_invoker = true` would deny everything. Each view body is therefore a security boundary with the same weight as a policy. Mitigated by: every one appears in `policies.ts` with positive *and* negative expectations; and each is owned by a role (`app_view_owner`, `bridge`, `ops_view_owner`) whose worst-case escalation is read-only on `app`, never write access.
7. **The canonicaliser is doing a lot and is `SECURITY DEFINER`.** It resolves the subject, anchors, chains, inserts and enqueues inside the device's transaction. It is the highest-consequence function in the repository after the device auth path, and a defect in it is a privilege escalation. Mitigations: owned by `log_writer`, a non-superuser `nologin` role whose only grants are on `log` and `ingest`; `set search_path = ''` without exception; the most heavily fuzzed function in the suite; and an independent security review alongside the device auth path (ADR open risk 7). Concentration is preferred to canonicalisation spread across an Edge Function, a cron job and a trigger, where the invariant is nobody's — but the concentration is real.
8. **Storage is roughly 2.2× a mutable-state design.** ~250 bytes/event × 27M events/year ≈ 7 GB/year in the log, plus roughly the same again in `proj.interaction` and its indexes, plus the 30-day forensic inbox, plus the per-patient media duplication.
9. **Every caregiver screen is a migration.** §11.6, and it is the objection I would want argued hardest.

### 14.4 What changes at 10×, and what is planned rather than discovered

| Trigger | Change | Cost |
|---|---|---|
| Sustained > 100 events/second | `log.event_log` range-partitioned on `ingest_seq`, with uniqueness moved into a small unpartitioned `log.event_id_seen` dedupe table checked by the canonicaliser | Real work. Planned, not discovered at 40M rows |
| Full refold exceeds ~2 s per participant | Reintroduce `proj.scheduler_snapshot`, keyed by `scheduler_version`, invalidated wholesale rather than repaired incrementally | The mechanism, plus its invalidation test |
| More than ~12 caregiver screens | Revisit the event-sourced centre for the caregiver plane. §11.6 states the condition under which this design becomes the wrong one |
| A second payload version | Build `log.upcast(type, from_version, payload)` with fixture tests. Handlers accumulate and can never be deleted | Permanent, monotonically growing |
| DPIA or B3 demands physical separation | Logical-replicate `research.*` alone to a second Postgres instance, leaving `identity` behind. Zero cross-schema FKs make this one publication, one subscription, one connection string and a revoke | A week, not a quarter. This is why the zero-FK rule is enforced by pgTAP |

---

## 15. MIGRATIONS PLAN — ordered

Thirty files. The floor is established first so nothing can be granted before its object exists; grants are last so the grant map is one readable diff; RLS precedes grants so no window exists in which a table is reachable and unprotected.

| # | File | Contains |
|---|---|---|
| 01 | `0001_roles_and_floor.sql` | the nine roles; `revoke all` from `public`/`anon`/`authenticated`; default-privilege revokes; `pgcrypto` |
| 02 | `0002_schemas.sql` | the ten schemas with their authorizations; schema-level revokes |
| 03 | `0003_authn.sql` | `access_token_hook`, `jwt_role`, `device_id`, `care_home_id`; the auth-hook grants |
| 04 | `0004_app_types.sql` | every `app.*` enum and every banding function (`age_band`, `era_band`, `relationship_group`, `valence_band`, `importance_band`, `tod_bucket`) |
| 05 | `0005_app_tenancy_people.sql` | `care_homes`, `user_profiles`, `memberships`, `patients`, `patient_caregivers`, `enrolment_screenings`; the disclosure trigger |
| 06 | `0006_app_consent_capacity.sql` | `consent_events` with all seven CHECKs, `capacity_records`, `consent_state`, `consent_permits`, `capacity_review_current`, the dissent trigger |
| 07 | `0007_app_devices_enrolment.sql` | `devices`, `device_patients`, `enrolment_codes`, `arm_assignment` + its no-UPDATE trigger |
| 08 | `0008_app_content_media.sql` | `depicted_persons`, `media_objects`, `media_subjects`, `decks`, `items`, `item_media`, `generic_library`; the release gate, the recognition gate, the retraction trigger, `set_destroy_by` |
| 09 | `0009_app_safety_revocations.sql` | `adverse_events`, `acute_change_notifications` + P25 recipient trigger, `revocations`, `revocation_acks`, `clinician_assessments`, `medication_and_comorbidity` |
| 10 | `0010_app_erasure_export.sql` | `erasure_requests`, `export_requests` |
| 11 | `0011_identity.sql` | `subject_map`, `participant_map`, `study_pepper`; the anchor-immutability trigger. **No FK leaves this schema toward `research`** |
| 12 | `0012_log_registry.sql` | `event_type`, `payload_vocabulary`, `payload_shape_ok`, `assert_payload_vocabulary` |
| 13 | `0013_log_event_log.sql` | `event_log`, `boot_anchor`, `device_chain`, `quarantine`, `projection_queue`, `content_change`, `chain_break_register`; `deny_mutation`, `verify_chain`, `write_server_event` |
| 14 | `0014_ingest.sql` | `ingest.event`, `ingest.session`, `canonicalise()`, the statement triggers, `replay_quarantine` |
| 15 | `0015_app_to_log_triggers.sql` | the seven server-written scheduler events emitted from `app.items` and `app.depicted_persons` |
| 16 | `0016_proj_tables.sql` | `session`, `interaction`, `scheduler_state`, `moment`, `integrity_flag`, `derivation_state` |
| 17 | `0017_proj_projectors.sql` | `proj.apply()`, the queue drain with `skip locked` + per-subject advisory lock, `proj.invalidate_from()` |
| 18 | `0018_device_views.sql` | `device.device_content` (with the purge union), `device.device_roster` |
| 19 | `0019_caregiver_views.sql` | `app.my_moments` and the caregiver action RPCs |
| 20 | `0020_research_study_manifest.sql` | `research.study`, `study_access`, `release`, `field_manifest`; the four manifest assertions |
| 21 | `0021_research_tables.sql` | the ten projected tables, **generated from the manifest** |
| 22 | `0022_research_projector.sql` | `link_project()`, `link.pseudo_id()`, `link.sever()`, `link.assert_k_anonymity()`, the release builder |
| 23 | `0023_analysis_views.sql` | the eleven release-scoped definer views, every column enumerated |
| 24 | `0024_ops_console.sql` | `ops.config` and the console views: S1–S7, F1–F7, quarantine counts, erasure status, S6 exposure, concurrent-device overlap |
| 25 | `0025_erasure_orchestrator.sql` | `ops.request_erasure`, the nine-stage advance function, `ops.erasure_is_complete`, `ops.replay_erasure_ledger` |
| 26 | `0026_rls_enable.sql` | `enable` + `force` on every table in `app`, `log`, `proj`, `identity`, `research` |
| 27 | `0027_rls_policies.sql` | every policy in §12, each naming its role explicitly |
| 28 | `0028_storage_policies.sql` | the `patient-media` bucket and its single caregiver policy |
| 29 | `0029_grants.sql` | every grant in the design, in one readable diff. **This file is the security review.** |
| 30 | `0030_seed_registry.sql` | the 20 event types with their JSON Schemas, the payload vocabulary, `ops.config`, the initial `research.study` |

`supabase/seed.sql` follows: three families, two devices, one shared tablet, one participant with an offline three-day backlog across three boots, one withdrawn participant, one erased participant, and one participant whose adverse event precedes their withdrawal by five minutes.

---

## 16. VERIFICATION — the tests that gate the pilot

The RLS suite over `policies.ts` is the suite ADR §6.3 already gates the pilot on. These are the additional ones this design makes necessary, all writable blind from this document.

| # | Test | What it catches |
|---|---|---|
| V1 | **Replay idempotence.** Fold a fixture set twice, hash both, assert equal | the R0 high-water rule |
| V2 | **Cross-device arrival permutation.** Shuffle *batch* arrival order across devices into 50 permutations, preserving FIFO within each device; ingest each into a fresh database; replay; hash. All 50 identical | that the anchor is not accidentally arrival-sensitive |
| V3 | **Late-arrival convergence.** Ingest device A, project; then ingest device B's three-day-stale stream that sorts into the middle; assert the final projection equals ingesting A+B together in canonical order from clean | a rewind bug, which is how this design fails in production |
| V4 | **Per-device monotonicity.** For every `device_id`, `anchored_at_ms` is non-decreasing in `seq` | the scheduler spec's §6.1 boundary obligation |
| V5 | **Three boots, 72 hours, one push.** Fixture: a tablet cold-started on three consecutive days, offline throughout, pushing everything at once. Assert the recovered `day_offset` for each session is 0, 1, 2 | the cross-boot monotonic-clock category error |
| V6 | **Reinstall.** Destroy the client's SQLite, keep the Keychain, sign in, emit 100 events. Assert zero quarantine rows and 100 log rows | `seq` restart bricking a device |
| V7 | **One bad row in a 400-row batch.** Assert 399 log rows, 1 quarantine row, HTTP 200, and a per-ID ACK that omits the bad one | batch-abort bricking |
| V8 | **Unknown event type.** Push a type the server does not know; assert `retryable: true`, no ACK, a durable quarantine row; then register the type and run `log.replay_quarantine`; assert the event lands | requirement 7 vs schema tidiness |
| V9 | **Device/server fold equality.** Run `fold` on the Hermes fixture and in Deno over the same canonical array; deep-equal | the two-runtime claim |
| V10 | **Name fuzz.** 5,000 first names × 4 casings × every event type × every string field. Assert 100% rejection | the free-text firewall |
| V11 | **Sentinel projection fuzz.** `ZZSENTINELZZ` and `1931-04-07` into every free-text column in `app` **and** every event payload string; run the projector; grep `research` and every `analysis` view. Zero hits | the allow-list, tested behaviourally |
| V12 | **UUIDv7 decode.** Attempt v7 timestamp extraction on every id-shaped column in every `analysis` view; fail if any decodes to a plausible date | the timestamp-in-the-identifier leak |
| V13 | **Arrival-time channel.** Poll `analysis.*` hourly for a simulated week; assert no participant's row set changes outside a release boundary | the live-plane leak |
| V14 | **Consent → device.** Insert `dissent_observed`; assert `device.device_roster` returns zero rows on the next sync for a connected device, and that an offline device's exposure is bounded by `hard_expiry_days` | S6 |
| V15 | **AE survives withdrawal.** AE at T, withdrawal at T+5min; assert the AE and the session denominator appear in the next release; assert the behavioural rows do not | S1, S2, M5 |
| V16 | **Stimulus provenance.** Trial with `person_status='living'`; flip the person to `deceased`; re-derive; assert the projected `person_status` is still `living` and S4 reports zero incidents | the S4 false-positive storm |
| V17 | **Erasure reaches two tablets.** Enrol two devices, seed a photo on both, erase, sync one; assert the file is gone from that filesystem and the request is stuck at `awaiting_devices` with one outstanding; sync the second; assert `complete` | ADR §8's named worst bug |
| V18 | **Restore drill.** Restore to a point before an erasure; run `ops.replay_erasure_ledger()`; assert the photograph is gone again | the resurrection failure |
| V19 | **k-anonymity gate.** Build a release from a cohort with a k=2 cell; assert the release refuses to publish, then publishes with the suppression recorded | small-cell disclosure |
| V20 | **Consent-state rebuild.** Drop `app.consent_state`, rebuild from `consent_events`, assert an identical table | materialisation drift |
| V21 | **Manifest equality.** The column set of `research` equals the live manifest; every manifest column appears in the projector's insert list; every §7 field maps to a manifest row or a waiver | declared-but-unfilled and missing-mandated-variable defects |
| V22 | **`app_metadata` is unforgeable.** Attempt to write it from every client role; assert failure; re-mint a token and assert the role is unchanged | ADR §5.2's one required assertion |

---

## 17. OPEN RISKS AND WEEK-ONE GATES

1. **Custom Postgres roles must be honoured end to end by PostgREST and `supabase-js` on the target plan.** Everything in §3 rests on it. Build a throwaway project in week 1 and prove `42501`. If it fails, the fallback is a second PostgREST with `PGRST_DB_ANON_ROLE=researcher`; **a split-plane design whose planes are separated by a `WHERE` clause is worse than an honest single-plane design, because it claims a guarantee it does not have.**
2. **B2 / B3 must confirm the Recital 26 erasure position before the pilot** (§10.2), and B3 must be scoped to *aggregated prosodic features*, not only templates (§8.8).
3. **B5 must confirm in writing that adverse-event retention survives research-consent withdrawal** (§7.7).
4. **The canonicaliser and the device auth path need an independent security review** before either touches a real patient. ADR open risk 7.
5. **The disaster-recovery drill including `ops.replay_erasure_ledger()` is a pilot gate**, not a formality (§10.7).
6. **Supabase dashboard SQL-editor access is an unmitigated re-identification path** and must appear in the DPIA as a named organisational control (§14.3).
7. **Deferred, and planned rather than discovered:** partitioning, snapshots, the upcaster chain, and the second-instance research plane (§14.4).

---

## 18. WHERE I WOULD YIELD

The parts of this decision I would defend to the end: the log as the source of truth for device-observed facts; human-written facts as rows with `CHECK` constraints; the stimulus descriptor frozen into the event; consent out of the ingest predicate; the safety register on its own legal basis; releases instead of a live research plane; and real Postgres roles rather than JWT string comparison. Those seven are the design.

The parts I would trade:

- **The per-device hash chain.** It costs a serialised insert per device and a verifier nobody may ever run. If the REC and the sponsor are satisfied by grant-based append-only, dropping it removes moderate complexity from the hottest function in the system. I keep it because a safety register whose immutability rests on our own database configuration is weaker evidence than one whose immutability rests on arithmetic — and a SCRIBE item-21 register the sponsor cannot independently verify is worth less than one they can. It is the first thing I would cut under pressure.
- **`ingest.session` as a separate table.** Purism says a session is `session.started` plus `session.ended`. It stays because the ADR mandates the grant and because F2's zero-delivery number must be evidenced by a path independent of the interaction stream. If the ADR is amended, one table disappears and nothing else changes.
- **The 28-day `min_participant_days` release lag.** It is the largest cost the release model imposes on the study, and it is the only knob between the arrival-time channel and usefulness. If the DPIA accepts a 7-day window, the number moves and everything else stays.

And the thing I would want argued against hardest: **§11.6's tax.** Every caregiver screen is a projection, a backfill and an index. My case is that P5 has already capped the caregiver surface at "moments and actions" — a deliberately thin dashboard is a *product* requirement here, not an engineering compromise — so the number of projections is small and known in advance. If that cap moves, so does the argument.
