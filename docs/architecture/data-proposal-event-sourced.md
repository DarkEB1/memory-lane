# DATA PROPOSAL — EVENT-SOURCED CENTRE

**Status:** Proposal. Bound by `docs/architecture/00-ADR-PLATFORM.md` (§4, §5, §6), `docs/research/00-SYNTHESIS.md` (§7, §8, §9, P16–P23), and `docs/design/00-V1-PRODUCT-SHAPE.md`.
**Advocate position:** the append-only event log is the primary artifact; every other table in the database is a projection of it or an input to it.
**Date:** 2026-08-12

---

## 0. THE ARGUMENT IN ONE PAGE

The ADR already decided this without saying so. §4.4 states that scheduler state is **not stored and not synced** — the server "recomputes it canonically from the ingested event log by importing the *same* `src/domain/scheduler.ts` module." That is an event-sourced system. Once one aggregate is derived rather than stored, the log is the source of truth for that aggregate, and the only question left is whether the rest of the system agrees or fights it.

Four things fall out for free, and each of them is otherwise a line item:

1. **Auditability.** §8 makes six of seven Tier-1 safety criteria auditable *from telemetry rather than from intent* — S3 (`ended_on_success` ≥99%), S4 (zero deceased-in-recognition), S6 (zero continuation after dissent). An append-only hash-chained log with no UPDATE and no DELETE granted to anybody is the cheapest possible instrument for that, and a mutable-state design has to bolt on an audit trigger that is itself mutable.
2. **Replay.** ADR §4.4 requires it. In an event-sourced centre it is not a feature, it is the read path.
3. **Research reconstruction.** §7 specifies ~120 per-interaction fields plus derived variables that are "computed, versioned, recomputable". §8.2 surface C says drift and trajectory are "computed **offline in the analysis plane by the investigator** … recomputable when the method changes." You cannot recompute a derived variable from a table that only holds its current value. You can recompute it from the log, forever, at any algorithm version.
4. **Determinism.** ADR §6.2 already forbids `Date`, `Math.random`, `crypto`, `fetch` inside `src/domain/**`. A pure fold over a totally-ordered event set is the only thing that rule is *for*.

And one thing that is normally the fatal objection — **GDPR erasure against an append-only log** — is answered here structurally rather than rhetorically, in §11. The short version: the log never contains an identifier. It contains `subject_id`, an opaque UUID whose only meaning is a row in a schema no role can read. Erasure deletes that row. The log is not modified; it is *orphaned*, and orphaned pseudonymous data with no reachable mapping is anonymous data under Recital 26 and therefore outside the Regulation. The photographs, names, sentences and recordings — the things a person actually wants erased — never entered the log in the first place, live in ordinary mutable tables, and are hard-`DELETE`d.

**What I am not claiming.** I am not claiming event sourcing for the content plane. Care homes, patients, people, photographs and typed sentences are ordinary mutable rows, because they must be erasable and because nobody needs to replay the history of a spelling correction. The design has **two tiers, and the boundary between them is exactly the P21 content-plane / research-plane firewall.** That is the single most important decision in this document and §2 defends it.

---

## 1. SCHEMAS AND THE GRANT MAP

Seven schemas. The grant map is the security design; everything else is bookkeeping.

| Schema | Contains | `device` | `caregiver` | `carehome_admin` | `researcher` |
|---|---|---|---|---|---|
| `device` | exactly two views | `USAGE` + `SELECT` on both | — | — | — |
| `ingest` | exactly two tables | `USAGE` + column-scoped `INSERT` | — | — | — |
| `log` | the event log, chain heads, quarantine | — | — | — | — |
| `app` | mutable content plane | — | `SELECT/INSERT/UPDATE/DELETE` under RLS | ditto, home-scoped | — |
| `proj` | projections | — | — (reads through `app` views) | — | — |
| `identity` | the two pseudonym maps | — | `SELECT` on `subject_map` under RLS | `SELECT` on `subject_map` under RLS | **nothing. no `USAGE`.** |
| `research` | pseudonymous views | — | — | — | `USAGE` + `SELECT` |
| `ops` | trial-operations console views | — | — | `SELECT` | `SELECT` |

Two properties are auditable with a single query each, and both are in the RLS suite:

```sql
-- The device's entire reachable surface. Must return exactly four rows.
select table_schema, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'device';
-- device | device_content | SELECT
-- device | device_roster  | SELECT
-- ingest | events         | INSERT
-- ingest | sessions       | INSERT

-- The researcher's reachable surface. Must contain no schema other than 'research' and 'ops'.
select distinct table_schema from information_schema.role_table_grants where grantee = 'researcher';
```

### 1.1 Real Postgres roles, not JWT string comparisons

The ADR's `policies.ts` expectations are written against roles. If "researcher" is only a string inside `app_metadata` and every logged-in user holds the `authenticated` Postgres role, then "no grant to the researcher role" is not a grant statement — it is a `WHERE` clause in disguise, which is the exact thing ADR §5.4 forbids.

So the four roles are **real Postgres roles**, and PostgREST switches into them from the `role` claim:

```sql
create role device        nologin noinherit;
create role caregiver     nologin noinherit;
create role carehome_admin nologin noinherit;
create role researcher    nologin noinherit;

grant device, caregiver, carehome_admin, researcher to authenticator;

-- Nothing is reachable by default, from any of them.
revoke all on schema public       from public, anon, authenticated;
revoke all on all tables in schema public from public, anon, authenticated;
alter default privileges in schema app, log, proj, identity, ingest, research, ops
  revoke all on tables from public, anon, authenticated;
```

The `role` claim is set by a Supabase custom access token hook, from `app_metadata` only — never `user_metadata`, which is client-writable:

```sql
create schema authn;

create or replace function authn.access_token_hook(event jsonb)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  meta  jsonb := coalesce(event #> '{claims,app_metadata}', '{}'::jsonb);
  r     text  := meta ->> 'role';
  claims jsonb := event -> 'claims';
begin
  -- Whitelist. An unknown or absent role degrades to a role with no grants anywhere.
  if r not in ('device','caregiver','carehome_admin','researcher') then
    r := 'authenticated';
  end if;

  claims := jsonb_set(claims, '{role}', to_jsonb(r));

  -- Re-project the three claims policies read, so a policy never has to walk app_metadata.
  claims := jsonb_set(claims, '{device_id}',    coalesce(meta -> 'device_id',    'null'::jsonb));
  claims := jsonb_set(claims, '{care_home_id}', coalesce(meta -> 'care_home_id', 'null'::jsonb));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema authn to supabase_auth_admin;
grant execute on function authn.access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function authn.access_token_hook(jsonb) from authenticated, anon, public;
```

Helper accessors, used by every policy below:

```sql
create or replace function authn.jwt_role() returns text
language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb ->> 'role' $$;

create or replace function authn.device_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'device_id','')::uuid
$$;

create or replace function authn.care_home_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'care_home_id','')::uuid
$$;
```

`app_metadata` is writable only by `service_role` via the admin API. ADR §5.2 names this as "the one thing the RLS test suite must assert cannot be forged from a client", and the assertion is: sign in as a device, `POST /rest/v1/rpc/...` attempting to update `auth.users.raw_app_meta_data`, assert 403; then re-mint a token and assert `role` is still `device`.

### 1.2 View ownership

Two nologin roles own the definer views. Neither is granted to `authenticator`, so no JWT can ever become them:

```sql
create role app_view_owner      nologin noinherit;
create role research_view_owner nologin noinherit;
-- deliberately NOT granted to authenticator
```

`research_view_owner` is the **only** principal in the database with `SELECT` on `identity.participant_map`. It cannot log in and cannot be assumed. That is what makes §10's de-identification structural.

---

## 2. THE TWO TIERS, AND WHY THE BOUNDARY IS WHERE IT IS

| | Tier 1 — event-sourced | Tier 2 — mutable state |
|---|---|---|
| **What** | sessions, interactions, probe results, adverse events, consent, dissent, capacity, arm assignment, device lifecycle, revocations, erasure, item absorbing state, retirement | care homes, patients, caregivers, people, decks, items, media objects, memberships, devices, enrolment codes |
| **Where** | `log.event_log` → `proj.*` | `app.*` |
| **Mutability** | append-only. No `UPDATE`, no `DELETE`, to any role, ever. Corrections are superseding events. | ordinary CRUD, ordinary `DELETE`, `ON DELETE CASCADE` |
| **Identifier** | `subject_id` (opaque) | `patient_id` (real) |
| **Free text** | structurally impossible (§4.3) | yes — names, sentences, narratives, photographs, audio |
| **Erasure** | orphaned by destroying the map (§11) | hard `DELETE` + storage purge + device purge |
| **Why this tier** | it is evidence in a study and a safety register; it must be immutable, replayable and recomputable | it is a person's family photographs; it must be erasable on demand |

The two requirements — *this must be immutable* and *this must be erasable* — are genuinely opposed, and every event-sourced system that pretends otherwise ends up doing crypto-shredding and hoping the regulator agrees. **The resolution is to make sure the two requirements never apply to the same bytes.** P21 already drew that line for a different reason ("two physically separate data planes"), and it turns out to be the same line. That is not a coincidence: the things that must be erasable are exactly the identifying things, and the things that must be immutable are exactly the de-identified measurements.

Tier 2 mutations are still *audited* — but the audit row carries no value:

```sql
create table log.content_change (
  change_id     uuid primary key default gen_random_uuid(),
  changed_at    timestamptz not null default now(),
  actor_user_id uuid        not null,
  actor_role    text        not null,
  entity        text        not null check (entity in
                  ('care_home','patient','caregiver','caregiver_link','person',
                   'deck','item','media_object','device','device_patient')),
  entity_id     uuid        not null,
  patient_id    uuid,                          -- nullable; erased with the patient
  op            text        not null check (op in ('insert','update','delete')),
  columns_changed text[]    not null default '{}',   -- names only. never values.
  reason        text        check (reason ~ '^[a-z_]{0,40}$')
);
```

Column *names*, never values. So the register proves "the caregiver changed `person_status` on item X at 14:02" without becoming a second, unerasable copy of the person's name. It is written by an `AFTER` trigger on every `app.*` table, and it is in `log` so it inherits `log`'s no-UPDATE/no-DELETE guarantee — except for the one deliberate exception: `patient_id` is set `NULL` and the row retained on erasure, because the count of changes is not personal data and the pilot's data-completeness audit needs it.

---

## 3. IDENTITY — THE TWO MAPS

Two maps, disjoint grants. This is the load-bearing structure of both the research plane and the erasure story.

```sql
create schema identity;
revoke all on schema identity from public, anon, authenticated, device, researcher;

-- subject_id <-> patient_id. Caregivers and admins may read their own rows.
create table identity.subject_map (
  subject_id  uuid primary key default gen_random_uuid(),
  patient_id  uuid not null unique references app.patients(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- subject_id <-> participant_code. NO ROLE MAY READ THIS.
create table identity.participant_map (
  subject_id       uuid primary key,
  participant_code text not null unique
                   default 'P-' || upper(encode(gen_random_bytes(5),'hex')),
  enrolled_on      date not null,          -- the anchor for day_offset. Never leaves this schema.
  created_at       timestamptz not null default now()
);

-- Per-subject HMAC salt. Destroying it destroys the meaning of every hash derived from it.
create table identity.subject_salt (
  subject_id uuid primary key,
  salt       bytea not null default gen_random_bytes(32)
);

-- Study-wide allocation salt. Makes A/B assignment verifiable but not predictable.
create table identity.study_salt (
  singleton boolean primary key default true check (singleton),
  salt      bytea   not null default gen_random_bytes(32)
);

grant usage on schema identity to app_view_owner, research_view_owner, caregiver, carehome_admin;
grant select on identity.subject_map      to app_view_owner, caregiver, carehome_admin;
grant select on identity.participant_map  to research_view_owner;
grant select on identity.subject_salt     to research_view_owner;
-- identity.study_salt: granted to nobody. Read only by SECURITY DEFINER allocation fn.

alter table identity.subject_map enable row level security;
alter table identity.subject_map force  row level security;

create policy subject_map_caregiver on identity.subject_map for select to caregiver
using (exists (
  select 1 from app.caregiver_patients cp
  where cp.patient_id = subject_map.patient_id
    and cp.caregiver_user_id = auth.uid()
    and cp.revoked_at is null));

create policy subject_map_admin on identity.subject_map for select to carehome_admin
using (exists (
  select 1 from app.patients p
  where p.id = subject_map.patient_id
    and p.care_home_id = authn.care_home_id()));
```

**The property that matters:** `caregiver` can bridge `subject_id → patient_id` but not `subject_id → participant_code`. `researcher` can see `participant_code` but has no `USAGE` on `identity` at all — cannot bridge in either direction. `research_view_owner` can bridge `subject_id → participant_code` but cannot log in and is not granted to `authenticator`. **No principal, and no pair of colluding non-service principals, can compose `participant_code → patient_id`.** Re-identification is not forbidden by a policy; it is not expressible as a query by anyone who can issue queries.

---

## 4. THE EVENT LOG

### 4.1 Event types

```sql
create schema log;
revoke all on schema log from public, anon, authenticated, device, caregiver, carehome_admin, researcher;

create table log.event_type (
  type            text primary key check (type ~ '^[a-z_]+\.[a-z_]+$'),
  since_version   int  not null default 1,
  current_payload_version smallint not null default 1,
  payload_schema  jsonb not null,        -- JSON Schema; the same shape zod emits in src/contract
  writer          text  not null check (writer in ('device','server','human')),
  is_safety       boolean not null default false
);

insert into log.event_type (type, writer, is_safety, payload_schema) values
  -- device-written, patient surface
  ('session.opened',            'device', false, '{}'),
  ('session.closed',            'device', false, '{}'),
  ('interaction.presented',     'device', false, '{}'),
  ('interaction.responded',     'device', false, '{}'),
  ('interaction.resolved',      'device', false, '{}'),
  ('probe.attempted',           'device', false, '{}'),
  ('device.booted',             'device', false, '{}'),
  ('device.sync_completed',     'device', false, '{}'),
  ('device.media_purged',       'device', false, '{}'),
  ('device.wiped',              'device', false, '{}'),
  -- safety, written by a human through the caregiver/admin surface
  ('safety.adverse_event',      'human',  true,  '{}'),
  ('safety.adverse_event_amended','human',true,  '{}'),
  ('safety.item_absorbed',      'human',  true,  '{}'),   -- distress -> absorbing state (P18, ND-14)
  ('safety.item_reenabled',     'human',  true,  '{}'),
  ('safety.item_retired',       'human',  true,  '{}'),   -- P3: only a human, never the algorithm
  ('safety.probe_disabled',     'human',  true,  '{}'),
  ('safety.acute_change_flagged','server',true,  '{}'),   -- P25 delirium notifier
  -- consent, written by a human
  ('consent.initial',           'human',  true,  '{}'),
  ('consent.reaffirmed',        'human',  true,  '{}'),
  ('consent.dissent_observed',  'human',  true,  '{}'),
  ('consent.withdrawn',         'human',  true,  '{}'),
  ('consent.capacity_assessed', 'human',  true,  '{}'),
  ('consent.consultee_changed', 'human',  true,  '{}'),
  ('consent.purpose_changed',   'human',  true,  '{}'),
  -- study
  ('study.enrolled',            'server', false, '{}'),
  ('study.arm_assigned',        'server', false, '{}'),
  ('study.phase_changed',       'server', false, '{}'),
  ('study.withdrawn',           'human',  true,  '{}'),
  -- content lifecycle, server-authored
  ('content.published',         'server', false, '{}'),
  ('content.revoked',           'server', false, '{}'),
  -- erasure
  ('erasure.requested',         'human',  true,  '{}'),
  ('erasure.content_deleted',   'server', true,  '{}'),
  ('erasure.map_destroyed',     'server', true,  '{}');
```

### 4.2 The log table

```sql
create table log.event_log (
  event_id        uuid        primary key,           -- client UUIDv7. THE idempotency key.
  ingest_seq      bigint      generated always as identity,
  subject_id      uuid        not null,              -- opaque. never a patient_id.
  device_id       uuid        not null,
  boot_id         uuid        not null,
  seq             bigint      not null,              -- strictly increasing per device, never reused
  session_id      uuid,
  type            text        not null references log.event_type(type),
  payload_version smallint    not null default 1,
  payload         jsonb       not null,

  -- clocks. ADR §4.3: none of the wall values are trusted.
  t_wall_ms       bigint      not null,              -- device wall clock at write. may be wrong.
  t_mono_ms       bigint      not null,              -- monotonic delta within boot_id. always right.
  anchored_at_ms  bigint      not null,              -- t_wall_ms + per-batch skew. server-derived.
  clock_skew_ms   bigint      not null,
  clock_anomaly   boolean     not null default false,

  batch_id        uuid        not null,
  client_version  text        not null check (client_version ~ '^[0-9A-Za-z.\-+]{1,32}$'),
  received_at     timestamptz not null default clock_timestamp(),

  -- per-device hash chain
  prev_hash       bytea       not null,
  row_hash        bytea       not null,

  ordering_key    bytea generated always as (
                    int8send(anchored_at_ms) || uuid_send(device_id) || int8send(seq)
                  ) stored,

  constraint event_log_device_seq_unique unique (device_id, seq),
  constraint event_log_payload_object    check (jsonb_typeof(payload) = 'object'),
  constraint event_log_payload_tokenised check (log.payload_is_tokenised(payload)),
  constraint event_log_mono_sane         check (t_mono_ms between 0 and 2592000000),  -- 30d
  constraint event_log_seq_positive      check (seq > 0)
);

alter table log.event_log enable row level security;
alter table log.event_log force  row level security;
-- No policies are created. With RLS forced and zero policies, every role including the
-- table owner reads zero rows and writes nothing. Access is exclusively through
-- SECURITY DEFINER functions owned by log_writer.

create role log_writer nologin noinherit;   -- not granted to authenticator
alter table log.event_log owner to log_writer;

revoke insert, update, delete, truncate on log.event_log from public;
-- defence in depth: even a future migration that grants UPDATE cannot mutate a row.
create or replace function log.deny_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'log.event_log is append-only (attempted %)', tg_op
    using errcode = 'raise_exception';
end $$;

create trigger event_log_no_update before update on log.event_log
  for each row execute function log.deny_mutation();
create trigger event_log_no_delete before delete on log.event_log
  for each row execute function log.deny_mutation();
create trigger event_log_no_truncate before truncate on log.event_log
  for each statement execute function log.deny_mutation();
```

Indexes:

```sql
-- the replay path: everything the scheduler fold reads, in canonical order
create index event_log_subject_order on log.event_log (subject_id, anchored_at_ms, device_id, seq)
  include (type, session_id);
-- the projection drain
create index event_log_ingest on log.event_log (ingest_seq);
-- the chain verifier
create index event_log_device_chain on log.event_log (device_id, seq);
-- the safety register
create index event_log_safety on log.event_log (type, anchored_at_ms)
  where type like 'safety.%' or type like 'consent.%';
-- session rollup
create index event_log_session on log.event_log (session_id) where session_id is not null;
-- payload lookups the research plane actually issues
create index event_log_item on log.event_log ((payload->>'item_id'))
  where type like 'interaction.%' or type = 'probe.attempted';
```

### 4.3 The free-text firewall — a CHECK constraint, not a review process

P21 and ND-18 forbid a real name, a real date, a transcript or a narrative reaching the research plane. Every system that enforces that with code review eventually fails. Here it is a constraint, and the rule is one line: **no string value anywhere in an event payload may contain a space.**

Prose contains spaces. Tokens, enums, UUIDs, hex digests and numbers do not.

```sql
create or replace function log.payload_is_tokenised(p jsonb, depth int default 0)
returns boolean
language plpgsql immutable parallel safe
as $$
declare v jsonb; k text; s text;
begin
  if depth > 4 then return false; end if;
  case jsonb_typeof(p)
    when 'object' then
      for k, v in select * from jsonb_each(p) loop
        if k !~ '^[a-z][a-z0-9_]{0,39}$' then return false; end if;
        if not log.payload_is_tokenised(v, depth + 1) then return false; end if;
      end loop;
      return true;
    when 'array' then
      if jsonb_array_length(p) > 256 then return false; end if;
      for v in select * from jsonb_array_elements(p) loop
        if not log.payload_is_tokenised(v, depth + 1) then return false; end if;
      end loop;
      return true;
    when 'string' then
      s := p #>> '{}';
      return s ~ '^[A-Za-z0-9_:.\-]{0,64}$';   -- no spaces. no punctuation. no prose.
    else
      return true;   -- number, boolean, null
  end case;
end $$;
```

This is not a substitute for per-type validation. The ingest function validates `payload` against `log.event_type.payload_schema` (the JSON Schema emitted from the same zod schemas in `src/contract/schema.ts`, so the device, the server and the test-writer share one definition). The CHECK is the thing that holds when the validator is wrong, when a new event type is added carelessly, or when a future developer wants "just a small note field". It cannot be argued with in a pull request.

A concrete consequence: `response_text_hash` in §7 is `hmac_sha256(identity.subject_salt || normalised_text)`, hex — 64 characters, no spaces, passes. The raw text is never sent. And because the salt is per-subject and destroyed on erasure, even the hash's meaning dies with the subject.

`safety.adverse_event.narrative_coded` is a coded category. The clinician's free-text narrative lives in `app.adverse_event_narrative` — content plane, erasable, and never in a research view. §11.4 explains why that is legally defensible rather than a fudge.

### 4.4 Idempotency

Three layers, in order of how much they trust the client:

1. `event_id` is the primary key. Ingest is `on conflict (event_id) do nothing`. At-least-once delivery plus server dedupe equals exactly-once effect. This is ADR §4.3 property 2, unchanged.
2. `unique (device_id, seq)` catches a client bug that regenerates `event_id` on retry — the failure mode that silently doubles every event and that a PK on `event_id` alone cannot see.
3. A collision on (2) with a *different* `event_id` is not dropped and not raised. It is quarantined:

```sql
create table log.event_quarantine (
  quarantine_id  bigint generated always as identity primary key,
  observed_at    timestamptz not null default now(),
  reason         text not null check (reason in
                   ('seq_collision','schema_invalid','unknown_type','clock_implausible',
                    'unauthorised_subject','payload_not_tokenised')),
  raw            jsonb not null,
  existing_event_id uuid
);
```

Silent drops are how research datasets acquire holes nobody can explain. A quarantine row is a data-completeness alarm on the trial-operations console (surface B), and it is the difference between "the patient did not respond" and "we lost the event" that ADR §4.3 property 4 promises.

### 4.5 Deterministic total order

The canonical order is `(anchored_at_ms, device_id, seq)`, materialised as `ordering_key`.

- **Total.** `(device_id, seq)` is unique, so no two rows tie.
- **Deterministic.** Every component is fixed at ingest and immutable thereafter. Replaying the same set of rows in any physical order, sorted by `ordering_key`, yields one sequence.
- **Within a boot,** `seq` is strictly increasing and `t_mono_ms` is monotonic, so intra-session latency arithmetic (§7's `latency_to_first_input_ms`, `decision_time_ms`) never touches a wall clock. ADR §4.3.
- **Across boots and devices,** `anchored_at_ms = t_wall_ms + skew`, where `skew = server_received_ms − client_sent_wall_ms` is computed once per batch. Accuracy is bounded by one-way network delay, typically well under a second — three orders of magnitude below the analysis resolution (`time_of_day_bucket`, `day_offset_from_enrollment`). A tablet three days offline whose clock has drifted by an hour is corrected by exactly one column.
- **Implausible clocks are clamped, not trusted.** If `|skew| > 400 days`, the batch is flagged `clock_anomaly` and `anchored_at_ms` falls back to `server_received_ms − (max_t_mono_in_batch − t_mono_ms)`, which reconstructs relative order from the monotonic clock and anchors the batch at arrival. Flagged, visible, and never silently wrong.

**The uncomfortable consequence, stated up front:** this order is *stable* but not *append-only in order*. A tablet that has been offline for three days delivers events whose `ordering_key` sorts *before* events already ingested from another device. Projections must therefore be able to rewind. §8.4 handles that, and the rewind depth is bounded — by `hard_expiry_days`, which ADR §4.5 already fixed at 7. The theft dial doubles as the projection-rewind bound, which is a pleasing accident and a real one.

### 4.6 Tamper evidence: a per-device hash chain

`log.event_log` is a regulated safety register (SCRIBE item 21, §7 `adverse_event`) and a study dataset. Append-only-by-grant is a claim about the database's configuration. A hash chain is a claim about the bytes, verifiable by an auditor who does not trust our configuration.

```sql
create table log.device_chain_head (
  device_id uuid primary key,
  last_seq  bigint not null,
  head_hash bytea  not null
);
```

`row_hash = sha256(prev_hash || canonical_bytes(event_id, subject_id, device_id, seq, type, payload, t_wall_ms, t_mono_ms, anchored_at_ms))`, chained per device. Chaining per device rather than globally means (a) inserts from different devices never contend, (b) a `seq` gap and a byte alteration are both detectable, and (c) the verifier is `O(events per device)` and parallel.

```sql
create or replace function log.verify_chain(p_device_id uuid)
returns table (broken_at_seq bigint, kind text)
language plpgsql security definer set search_path = '' as $$
declare r record; expected bytea := '\x00'::bytea; prev_seq bigint := 0;
begin
  for r in select * from log.event_log where device_id = p_device_id order by seq loop
    if r.prev_hash is distinct from expected then
      return query select r.seq, 'hash_mismatch'; return;
    end if;
    if prev_seq <> 0 and r.seq <> prev_seq + 1 then
      return query select r.seq, 'seq_gap';   -- reported, not fatal: a gap is real information
    end if;
    expected := log.row_digest(r);
    prev_seq := r.seq;
  end loop;
end $$;
```

Cost: the chain serialises writes per device. At pilot volume — ~500 events/session × 3 sessions/day × one device — that is nothing. The honest ceiling is roughly a few thousand chained inserts per second per device before the head-row lock matters, and we are four orders of magnitude below it.

---

## 5. THE INGEST SURFACE — THE DEVICE'S TWO TABLES

ADR §5.2: devices get `INSERT` on exactly two tables. Here they are.

```sql
create schema ingest;

create table ingest.events (
  event_id       uuid primary key,
  batch_id       uuid    not null,
  device_id      uuid    not null,
  patient_id     uuid    not null,          -- translated to subject_id by the trigger
  session_id     uuid,
  boot_id        uuid    not null,
  seq            bigint  not null,
  type           text    not null,
  payload_version smallint not null default 1,
  payload        jsonb   not null,
  t_wall_ms      bigint  not null,
  t_mono_ms      bigint  not null,
  client_sent_wall_ms bigint not null,      -- the batch's clock at send. drives skew.
  client_version text    not null,
  received_at    timestamptz not null default clock_timestamp()
);

create table ingest.sessions (
  session_id     uuid primary key,
  batch_id       uuid    not null,
  device_id      uuid    not null,
  patient_id     uuid    not null,
  boot_id        uuid    not null,
  seq            bigint  not null,
  session_mode   text    not null check (session_mode in ('standard','nothing_today')),
  ui_version     text    not null,
  scheduler_version text not null,
  content_set_version text not null,
  planned_n_items int     not null,
  t_wall_ms      bigint  not null,
  t_mono_ms      bigint  not null,
  client_sent_wall_ms bigint not null,
  client_version text    not null,
  received_at    timestamptz not null default clock_timestamp()
);
```

**Why `sessions` exists at all in an event-sourced design.** Purism says a session is `session.opened` / `session.closed`. But the ADR mandates the grant, and there is a real reason to keep it: a session that produced *zero* interactions — the patient picked the tablet up and put it down, F2's zero-delivery families — must still be evidenced, and it must be evidenced by a different mechanism from the interaction stream so that a bug in the interaction path cannot make it disappear. `ingest.sessions` is a session-open declaration, and the trigger folds it into a `session.opened` event. The log stays the single source of truth; the device gets a second, independent write path for the one fact that must never go missing.

**Column-scoped grants** — the device cannot write `received_at`, and there is no server-controlled column in these tables for it to forge:

```sql
grant usage on schema ingest to device;
grant insert (event_id, batch_id, device_id, patient_id, session_id, boot_id, seq, type,
              payload_version, payload, t_wall_ms, t_mono_ms, client_sent_wall_ms, client_version)
  on ingest.events to device;
grant insert (session_id, batch_id, device_id, patient_id, boot_id, seq, session_mode,
              ui_version, scheduler_version, content_set_version, planned_n_items,
              t_wall_ms, t_mono_ms, client_sent_wall_ms, client_version)
  on ingest.sessions to device;
-- no select, no update, no delete, to anybody.
```

RLS:

```sql
alter table ingest.events enable row level security;
alter table ingest.events force  row level security;

create policy device_inserts_own_events on ingest.events
for insert to device
with check (
      authn.jwt_role() = 'device'
  and device_id = authn.device_id()
  and exists (select 1 from app.device_patients dp
              where dp.device_id  = authn.device_id()
                and dp.patient_id = ingest.events.patient_id
                and dp.unassigned_at is null)
  and exists (select 1 from app.devices d
              where d.id = authn.device_id() and d.revoked_at is null)
);
-- no select/update/delete policies exist, so the device can never read back what it wrote.
```

Identical policy on `ingest.sessions`. Note there is **no** `patient_id` in the JWT (ADR §5.2, adopted from `split-surfaces`); authorisation is a join against `device_patients` keyed on `device_id`.

### 5.1 Canonicalisation

One `AFTER INSERT ... FOR EACH STATEMENT` trigger with a transition table, so the whole batch is processed once, in `seq` order, under one chain-head lock.

```sql
create or replace function ingest.canonicalise() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r          record;
  v_subject  uuid;
  v_skew     bigint;
  v_anchor   bigint;
  v_anomaly  boolean;
  v_prev     bytea;
  v_head     record;
begin
  for r in select * from inserted order by device_id, seq loop

    select subject_id into v_subject from identity.subject_map where patient_id = r.patient_id;
    if v_subject is null then
      insert into log.event_quarantine (reason, raw) values ('unauthorised_subject', to_jsonb(r));
      continue;                                   -- erased mid-flight; drop, do not fail the batch
    end if;

    v_skew    := extract(epoch from r.received_at)::bigint * 1000 - r.client_sent_wall_ms;
    v_anomaly := abs(v_skew) > 34560000000;       -- 400 days
    v_anchor  := case when v_anomaly
                      then extract(epoch from r.received_at)::bigint * 1000
                      else r.t_wall_ms + v_skew end;

    if not log.validate_payload(r.type, r.payload_version, r.payload) then
      insert into log.event_quarantine (reason, raw) values ('schema_invalid', to_jsonb(r));
      continue;
    end if;

    select * into v_head from log.device_chain_head
      where device_id = r.device_id for update;
    v_prev := coalesce(v_head.head_hash, '\x00'::bytea);

    begin
      insert into log.event_log (
        event_id, subject_id, device_id, boot_id, seq, session_id, type,
        payload_version, payload, t_wall_ms, t_mono_ms, anchored_at_ms,
        clock_skew_ms, clock_anomaly, batch_id, client_version, prev_hash, row_hash)
      values (
        r.event_id, v_subject, r.device_id, r.boot_id, r.seq, r.session_id, r.type,
        r.payload_version, r.payload, r.t_wall_ms, r.t_mono_ms, v_anchor,
        v_skew, v_anomaly, r.batch_id, r.client_version, v_prev,
        log.digest(v_prev, r.event_id, v_subject, r.device_id, r.seq, r.type,
                   r.payload, r.t_wall_ms, r.t_mono_ms, v_anchor))
      on conflict (event_id) do nothing;
    exception when unique_violation then                 -- (device_id, seq) collision
      insert into log.event_quarantine (reason, raw, existing_event_id)
      select 'seq_collision', to_jsonb(r), e.event_id
      from log.event_log e where e.device_id = r.device_id and e.seq = r.seq;
      continue;
    end;

    if found then
      insert into log.device_chain_head (device_id, last_seq, head_hash)
      values (r.device_id, r.seq, log.digest(...))
      on conflict (device_id) do update set last_seq = excluded.last_seq,
                                            head_hash = excluded.head_hash;
      perform proj.apply(r.event_id);                    -- §8: synchronous hot projections
      insert into log.projection_queue (event_id, projector)
        select r.event_id, p from unnest(array['interaction_flat','research_derived']) p;
    end if;
  end loop;
  return null;
end $$;

alter function ingest.canonicalise() owner to log_writer;

create trigger events_canonicalise after insert on ingest.events
  referencing new table as inserted
  for each statement execute function ingest.canonicalise();
```

The inbox rows are **kept for 30 days** and then pruned by cron. That is the raw forensic tier: if canonicalisation has a bug, the bytes the device actually sent are still on disk, which is the only honest way to make "telemetry is never lost" survive a server-side defect rather than only a network one.

The device's ACK is the HTTP 201 on the `ingest.events` insert. Per ADR §4.3 property 3, the device deletes outbox rows only on per-`event_id` ACK, and a partial batch failure loses nothing because the whole statement is one transaction and the retry is idempotent.

---

## 6. THE CONTENT PLANE (`app`)

Ordinary tables. Mutable. Erasable. This is where the photographs live.

```sql
create schema app;

create table app.care_homes (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  country_locale    text not null check (country_locale ~ '^[a-z]{2}-[A-Z]{2}$'),
  hard_expiry_days  int  not null default 7 check (hard_expiry_days between 4 and 14),
  dpa_reference     text,
  rec_approval_ref  text not null,               -- B5. no care home without REC approval.
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table app.patients (
  id                uuid primary key default gen_random_uuid(),
  care_home_id      uuid references app.care_homes(id) on delete restrict,
  auth_user_id      uuid unique references auth.users(id) on delete set null,  -- P22: first-class
  display_first_name text not null,              -- the ONLY name a device ever sees
  full_name         text not null,
  birth_year        smallint not null check (birth_year between 1900 and 1990),
  home_town         text,
  first_language    text not null,               -- BCP-47. P14.
  content_language  text not null,
  -- eligibility, from §9 of the product shape. Never a cognitive measure, never scored.
  dementia_subtype  text not null check (dementia_subtype in
                      ('AD','PCA','svPPA','other_PPA','DLB','vascular','FTD_behavioural',
                       'mixed','MCI_unspecified')),
  severity_band     text not null check (severity_band in ('mild','moderate')),
  fluctuation_band  text not null default 'standard' check (fluctuation_band in ('standard','high')),
  eligibility_outcome text not null check (eligibility_outcome in
                      ('eligible','eligible_flagged','deferred_acute','deferred_sensory','excluded')),
  eligibility_reviewed_by uuid not null references auth.users(id),
  -- P17: era and theme blocklists, captured at onboarding
  era_blocklist     text[] not null default '{}',
  theme_blocklist   text[] not null default '{}',
  -- P23: the ceiling on what any caregiver may be granted. Disclosed in the patient UI.
  disclosed_permissions text[] not null default '{view_moments,author_content}',
  ui_version        text not null,               -- P10: frozen at enrolment, per participant
  created_at        timestamptz not null default now(),
  constraint patient_subtype_gate check (dementia_subtype not in ('PCA','svPPA'))  -- ND-35
);
```

That last constraint is worth pausing on. ND-35 forbids enrolling PCA or svPPA participants into photo/face mechanics, and §9 Gate 3 makes it a hard exclusion. In a mutable-state design that is a validation rule in an onboarding form. Here it is a table constraint: **a PCA patient row cannot exist.** The clearest avoidable harm in the whole product is not preventable by a screen that someone might skip.

```sql
create table app.caregivers (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  care_home_id uuid references app.care_homes(id) on delete set null,
  full_name    text not null,
  is_paid_staff boolean not null default false,   -- B12: paid carers cannot be personal consultees
  created_at   timestamptz not null default now()
);

-- P23: multiple caregivers, differentiated permissions, a documented removal path.
create table app.caregiver_patients (
  id                uuid primary key default gen_random_uuid(),
  caregiver_user_id uuid not null references app.caregivers(user_id) on delete cascade,
  patient_id        uuid not null references app.patients(id) on delete cascade,
  relationship      text not null,
  permissions       text[] not null default '{view_moments}',
  is_primary        boolean not null default false,
  granted_by        uuid not null references auth.users(id),
  granted_at        timestamptz not null default now(),
  revoked_at        timestamptz,
  revoked_by        uuid references auth.users(id),
  revocation_reason text,
  unique (caregiver_user_id, patient_id)
);

create unique index one_primary_caregiver on app.caregiver_patients (patient_id)
  where is_primary and revoked_at is null;

-- P23 made enforceable: a caregiver can never be granted a permission the patient
-- has not been told about in the patient UI.
create or replace function app.enforce_disclosure() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from unnest(new.permissions) p
             where p <> all ((select disclosed_permissions from app.patients
                              where id = new.patient_id))) then
    raise exception 'permission not disclosed to the patient (P23): %', new.permissions;
  end if;
  return new;
end $$;

create trigger caregiver_permission_disclosure
  before insert or update on app.caregiver_patients
  for each row execute function app.enforce_disclosure();
```

### 6.1 People, media, decks, items

```sql
-- A person who appears in the content. NOT necessarily a user. NOT necessarily consenting.
create table app.people (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  display_name  text not null,
  relationship_category text not null check (relationship_category in
                  ('spouse','child','grandchild','sibling','parent','friend',
                   'colleague','pet','self','other')),
  -- P16: mandatory, unskippable. No default. The insert fails without it.
  person_status text not null check (person_status in
                  ('living','deceased','estranged','do_not_show')),
  one_sentence  text,                     -- P12 / M-27. Family-typed. TTS reads it. Never AI.
  created_at    timestamptz not null default now()
);

create table app.media_objects (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references app.patients(id) on delete cascade,
  sha256         bytea not null,
  storage_path   text  not null,          -- patient/<id>/<sha256>, private bucket
  mime           text  not null check (mime in ('image/jpeg','image/png','audio/mp4','audio/x-m4a')),
  bytes          bigint not null,
  -- §1.11 / P20: irreducible biometric identifiers get their own classification
  biometric_class text not null check (biometric_class in
                    ('face_photo','voice_recording','non_biometric')),
  provenance     text not null check (provenance in
                    ('family_upload','generic_library','physical_scan')),
  -- BIPA §15(a): a written retention schedule, enforced rather than published
  destroy_by     date not null,
  destroyed_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (patient_id, sha256)
);

-- Every human depicted or audible. Including relatives who are not users and never consented.
create table app.depicted_people (
  media_object_id uuid not null references app.media_objects(id) on delete cascade,
  person_id       uuid references app.people(id) on delete cascade,
  is_data_subject boolean not null default false,
  release_status  text not null check (release_status in
                    ('subject_is_patient','written_release_held','no_release','unknown')),
  release_ref     text,
  recorded_by     uuid not null references auth.users(id),
  recorded_at     timestamptz not null default now(),
  primary key (media_object_id, person_id)
);

create table app.decks (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null unique references app.patients(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table app.items (
  id              uuid primary key default gen_random_uuid(),
  deck_id         uuid not null references app.decks(id) on delete cascade,
  person_id       uuid references app.people(id) on delete cascade,
  media_object_id uuid references app.media_objects(id) on delete restrict,
  item_tier       smallint not null default 2 check (item_tier in (1,2,3)),
  content_class   text not null check (content_class in
                    ('person_identity','place','event','object','saying','song','probe_face')),
  era_decade      smallint check (era_decade between 1900 and 2030),
  caregiver_rated_valence    smallint check (caregiver_rated_valence between 1 and 5),
  caregiver_rated_importance smallint check (caregiver_rated_importance between 1 and 5),
  content_language text not null,
  is_month_target boolean not null default false,   -- M-25
  created_at      timestamptz not null default now(),
  -- retirement is recorded here as a projection of safety.item_retired; the algorithm
  -- can never write it because the algorithm cannot write events of writer='human'.
  retired_at      timestamptz,
  retired_by      uuid references auth.users(id)
);

create unique index one_month_target_per_deck on app.items (deck_id)
  where is_month_target and retired_at is null;

-- Generic library: proverbs, stock probe faces, era photographs, music. No patient linkage.
create table app.generic_items (
  id            uuid primary key default gen_random_uuid(),
  content_set_version text not null,
  content_class text not null check (content_class in
                  ('saying','song','probe_face','era_photo')),
  locale        text not null,
  era_decade    smallint,
  birth_year_lo smallint, birth_year_hi smallint,
  asset_path    text,
  payload       jsonb not null
);
```

### 6.2 The BIPA constraints, as constraints

```sql
-- ND-12 / S4: a deceased person cannot be attached to an item used in a recognition
-- mechanic without an explicit caregiver decision, recorded as a row that must exist.
create table app.deceased_recognition_consent (
  item_id     uuid primary key references app.items(id) on delete cascade,
  decided_by  uuid not null references auth.users(id),
  decided_at  timestamptz not null default now(),
  rationale   text not null
);

create or replace function app.enforce_recognition_eligibility() returns trigger
language plpgsql as $$
declare st text; unreleased int;
begin
  if new.item_tier = 1 or new.content_class = 'person_identity' then
    select person_status into st from app.people where id = new.person_id;
    if st in ('do_not_show','estranged') then
      raise exception 'person_status % forbids recognition use (P16)', st;
    end if;
    if st = 'deceased' and not exists
       (select 1 from app.deceased_recognition_consent where item_id = new.id) then
      raise exception 'deceased person requires an explicit caregiver decision (ND-12, S4)';
    end if;
    -- BIPA §15(b): third parties in the frame who never consented
    select count(*) into unreleased from app.depicted_people d
      where d.media_object_id = new.media_object_id
        and d.release_status not in ('subject_is_patient','written_release_held');
    if unreleased > 0 then
      raise exception 'media has % depicted people without release; not usable in a '
                      'recognition mechanic (BIPA 15(b))', unreleased;
    end if;
  end if;
  return new;
end $$;

create trigger item_recognition_eligibility
  before insert or update on app.items
  for each row execute function app.enforce_recognition_eligibility();
```

**The BIPA §15(a) retention schedule, enforced:**

```sql
create or replace function app.set_destroy_by() returns trigger
language plpgsql as $$
begin
  new.destroy_by := least(
    (select coalesce(purpose_end_date, current_date + interval '3 years')::date
       from app.patients p join app.care_homes ch on ch.id = p.care_home_id
       where p.id = new.patient_id),
    (current_date + interval '3 years')::date);   -- BIPA: 3 years from last interaction
  return new;
end $$;
```

**And the guarantee that no biometric template can ever exist**, which is the actual P20 / BIPA §15(b) defence — not a policy, a schema invariant tested in CI:

```sql
-- supabase/tests/no_biometrics.sql  (pgTAP)
select is_empty($$ select 1 from pg_extension
                   where extname in ('vector','pgvector','pg_similarity','pg_trgm_vector') $$,
                'no vector/embedding extension is installed');
select is_empty($$ select 1 from information_schema.columns
                   where udt_name in ('vector','halfvec','cube')
                      or column_name ~ '(embed|template|faceprint|voiceprint|descriptor)' $$,
                'no column can hold a biometric template');
```

There is no table that can hold a face template because there is no type in this database that can represent one. P20 says "ever, in any jurisdiction"; this is what "ever" looks like in DDL.

### 6.3 Devices and enrolment — ADR §5.2, unchanged, plus what the ES centre adds

```sql
create table app.devices (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null references auth.users(id) on delete cascade,
  care_home_id     uuid not null references app.care_homes(id),
  mode             text not null check (mode in ('personal','shared')),
  label            text not null,
  hard_expiry_days int  not null default 7 check (hard_expiry_days >= 4),
  enrolled_at      timestamptz,
  last_seen_at     timestamptz,
  content_valid_until timestamptz,
  revoked_at       timestamptz,
  revoked_reason   text
);

create table app.device_patients (
  device_id     uuid not null references app.devices(id) on delete cascade,
  patient_id    uuid not null references app.patients(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  unassigned_at timestamptz,
  primary key (device_id, patient_id)
);

create table app.enrolment_codes (
  code_hash   text primary key,
  device_id   uuid not null references app.devices(id) on delete cascade,
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  attempts    int not null default 0 check (attempts <= 5)
);
```

`unassigned_at` rather than a delete: which patients a device *held* is exactly what the erasure ledger needs in §11.3, and a `PRIMARY KEY` delete would destroy it.

### 6.4 The device's two views

```sql
create schema device;
grant usage on schema device to device;

-- One view. Carries content, media manifest AND revocations, because ADR §5.2 budgets
-- exactly two views and a third for revocations is not available. op='purge' is the tombstone.
create view device.device_content
with (security_invoker = false) as
select
  op, patient_id, item_id, person_display_name, one_sentence, item_tier,
  content_class, era_decade, content_language, cue_ladder_max_rung,
  media_sha256, media_mime, media_bytes, is_month_target, is_absorbing,
  content_set_version, content_valid_until, updated_at
from app.build_device_content(authn.device_id());

create view device.device_roster
with (security_invoker = false) as
select p.id as patient_id, p.display_first_name, p.ui_version,
       av.sha256 as avatar_sha256
from app.patients p
join app.device_patients dp on dp.patient_id = p.id and dp.unassigned_at is null
join app.devices d on d.id = dp.device_id
left join app.media_objects av on av.id = p.avatar_media_id
where dp.device_id = authn.device_id()
  and d.revoked_at is null
  and authn.jwt_role() = 'device'
  -- consent gate, from the projection. A withdrawn or dissenting subject disappears
  -- from the roster on the next sync. S6 is enforced by absence, not by a flag.
  and exists (select 1 from proj.consent_state cs
              join identity.subject_map sm on sm.subject_id = cs.subject_id
              where sm.patient_id = p.id
                and cs.care_use_active
                and not cs.dissent_active);

alter view device.device_roster      owner to app_view_owner;
alter view device.device_content     owner to app_view_owner;
grant select on device.device_roster, device.device_content to device;
```

These two views are the only place in the design where a `WHERE` clause carries authorisation for the device rather than a missing grant. That is unavoidable — the device must see *some* patients — and it is why `policies.ts` §14 pins them with negative tests as well as positive ones. Everything else the device could touch is a missing grant.

Note what the consent gate does: **S6 ("zero participants continue after expressed dissent") is implemented as a row disappearing from a view.** Not a banner, not a check in the app, not a flag the client might ignore. A device that has been offline for three days keeps rendering until `content_valid_until` and then stops (ADR §4.5); a device that syncs gets an empty roster and has nothing to render. That is the strongest enforcement available given that the tablet is sometimes unreachable, and its residual — up to `hard_expiry_days` — is stated rather than hidden.

---

## 7. CONSENT AS AN EVENT STREAM

P22 is the hardest requirement in the product and it is the one an event log is best suited to. Consent is **not a boolean**. It is a time series with at least six independently moving parts: who is the data subject, what is their capacity today, who is advising, what did they agree to, what have they since done that looks like objection, and what did we do about it.

### 7.1 The five consent event types and their payloads

```jsonc
// consent.initial
{ "pathway": "direct" | "supported" | "consultee",
  "grants": ["care_use", "research_use", "speech_features", "media_retention"],
  "capacity_status": "has_capacity" | "fluctuating" | "lacks_capacity",
  "recorded_by_role": "study_clinician" | "carehome_admin",
  "consultee_id": "<uuid>",            // present iff pathway = consultee
  "consultee_opinion": "would_have_wished_to_join" | "would_not_have_wished_to_join",
  "subject_assent": "assented" | "no_objection_observed" | "not_obtainable",
  "reaffirm_interval_days": 90,
  "protocol_version": "v1.2",
  "form_version": "PIS-3" }

// consent.dissent_observed        (P22, ND-21, S6)
{ "signal": "verbal_refusal" | "behavioural_refusal" | "distress"
           | "repeated_abandonment" | "caregiver_reported",
  "scope": "session" | "item" | "research_use" | "all",
  "item_id": "<uuid>",
  "observed_by_role": "caregiver" | "carehome_admin" | "study_clinician" | "system_deterministic",
  "action_taken": "session_ended" | "item_absorbed" | "study_withdrawn" | "product_stopped" }

// consent.capacity_assessed
{ "capacity_status": "...", "assessed_by_role": "study_clinician",
  "review_due_day_offset": 90, "instrument": "mca_functional_test" }
```

Note `signal` has no `inferred` value and `observed_by_role` has no `classifier` value. `system_deterministic` covers only the deterministic triggers the product shape already permits (two consecutive skips, previous-session abandonment) — P18 and ND-15 forbid an inferred-affect classifier and the enum is where that is enforced. There is no way to record a dissent signal that came from a model, because the vocabulary does not contain one.

**Who may write which event is an RLS policy, not a convention:**

```sql
create table app.consent_write_authority (
  event_type text primary key references log.event_type(type),
  allowed_roles text[] not null
);

insert into app.consent_write_authority values
  ('consent.initial',           '{carehome_admin}'),          -- never 'caregiver'
  ('consent.reaffirmed',        '{carehome_admin}'),
  ('consent.capacity_assessed', '{carehome_admin}'),
  ('consent.consultee_changed', '{carehome_admin}'),
  ('consent.purpose_changed',   '{carehome_admin}'),
  ('consent.withdrawn',         '{caregiver,carehome_admin}'), -- withdrawal is always easier than entry
  ('consent.dissent_observed',  '{caregiver,carehome_admin}'), -- anyone may observe an objection
  ('safety.adverse_event',      '{caregiver,carehome_admin}');
```

**A caregiver cannot write `consent.initial`.** That is P22 as a grant: the person enrolling is not the data subject and cannot assert that the data subject consented. What a caregiver *can* do is supply `consultee_opinion` — advice on what the person would have wanted — through a separate RPC that writes the event with `recorded_by_role = 'carehome_admin'` only after the admin countersigns. And withdrawal is deliberately asymmetric: the role that cannot let someone in can always let them out.

### 7.2 The projection

```sql
create table proj.consent_state (
  subject_id            uuid primary key,
  pathway               text not null,
  capacity_status       text not null,
  capacity_review_due   date,
  care_use_active       boolean not null,      -- may we run the product at all
  research_use_active   boolean not null,      -- may telemetry enter the research plane
  speech_features_active boolean not null,     -- §8.4.3: separately removable, as promised
  media_retention_active boolean not null,
  dissent_active        boolean not null,      -- S6. absorbing until a human clears it.
  dissent_scope         text,
  last_reaffirmed_at    timestamptz,
  reaffirm_due_at       timestamptz not null,
  consultee_user_id     uuid,
  withdrawn_at          timestamptz,
  withdrawal_retroactive boolean not null default false,
  computed_from_ingest_seq bigint not null,
  updated_at            timestamptz not null default now()
);
```

Three properties the fold guarantees, and each is a test in the RLS/consent suite:

- **`dissent_active` is absorbing.** Once true, only `consent.reaffirmed` written by `carehome_admin` with an explicit `dissent_cleared: true` can set it false. No `consent.initial` clears it. No timeout clears it. ND-14 and ND-21.
- **Lapse degrades, it does not stop.** If `reaffirm_due_at < now()`, `research_use_active` goes false and `care_use_active` stays true. Telemetry stops entering the research plane; the person keeps their photographs. Killing the product for a person with dementia because a form expired would itself be a harm, and the design should not be capable of it.
- **Withdrawal is prospective by default.** `consent.withdrawn` with `retroactive: false` stops collection from that moment; the existing data stays in the study under Art. 17(3)(d). With `retroactive: true` it enqueues an erasure request (§11). The distinction is made by the person withdrawing, in the withdrawal flow, in plain words — not decided for them by an engineer.

The gate is applied where it bites, in `device.device_roster` (§6.4) and in the research views (§10): a subject whose `research_use_active` is false **produces no rows in `research.*` at all**, and their events keep accumulating in the log where the product needs them and the study cannot see them.

---

## 8. PROJECTIONS

### 8.1 The tables

```sql
create schema proj;
revoke all on schema proj from public, anon, authenticated, device, caregiver, carehome_admin, researcher;
```

Nobody reads `proj` directly. Caregivers read `app.*` views over it; researchers read `research.*` views over it. That keeps the projection shape refactorable without a public contract.

```sql
-- one row per session. §7 `session`.
create table proj.session (
  session_id        uuid primary key,
  subject_id        uuid not null,
  device_id         uuid not null,
  day_offset        int  not null,             -- from identity.participant_map.enrolled_on
  local_hour        smallint not null,
  time_of_day_bucket text not null check (time_of_day_bucket in
                      ('early_morning','mid_morning','afternoon','evening')),
  session_ordinal_today smallint not null,
  session_mode      text not null,             -- 'standard' | 'nothing_today'  (M-135)
  prime_condition   text,                      -- 'primed' | 'unprimed'
  duration_ms       int,
  planned_n_items   smallint not null,
  completed_n_items smallint,
  session_end_reason text check (session_end_reason in
                      ('completed','user_ended','distress_stop','timeout','app_crash',
                       'device_failure','faded_to_rest')),
  ended_on_success  boolean,                   -- S3. computed, never asserted.
  generic_opener_played boolean,
  generic_closer_played boolean,
  caregiver_present boolean,
  caregiver_present_source text,
  mean_rt_ms int, median_rt_ms int, isd_residual_rt_ms real, cv_rt real,
  accuracy real, n_lapses smallint,
  network_state text,
  turnaround_decade smallint,                  -- M-131
  ui_version text not null, scheduler_version text not null,
  content_set_version text not null, scoring_rubric_version text not null,
  computed_from_ingest_seq bigint not null
);

-- one row per item presentation. §7 `interaction`. The expensive projection.
create table proj.interaction (
  interaction_id    uuid primary key,
  session_id        uuid not null references proj.session(session_id),
  subject_id        uuid not null,
  item_id           uuid not null,
  day_offset        int  not null,
  local_hour        smallint not null,
  time_of_day_bucket text not null,
  administered_by   text not null check (administered_by in
                      ('self','caregiver_assisted','caregiver_proxy')),
  -- scheduling state (all recomputed, never client-asserted)
  item_is_probe     boolean not null,
  item_tier         smallint not null,
  repetition_number int not null,
  lapse_count       int not null,
  days_since_last_review real,
  days_since_first_introduction real,
  scheduled_interval_days real,
  interval_deviation_days real,
  within_session_rung smallint,
  attained_rung     smallint,
  stability real, difficulty real, retrievability real,
  predicted_recall_probability real,
  -- item metadata (content plane never crosses over)
  content_class text not null, relationship_category text, era_decade smallint,
  caregiver_rated_emotional_valence smallint, caregiver_rated_importance smallint,
  media_type text, n_media_assets smallint, cue_modality text,
  content_language text not null, content_is_generic boolean not null,
  person_status text, content_provenance text,
  -- timing (monotonic, from stimulus paint)
  stimulus_paint_ts_mono bigint, first_input_ts_mono bigint, response_commit_ts_mono bigint,
  latency_to_first_input_ms int, total_response_time_ms int, decision_time_ms int,
  app_backgrounded_ms int, n_backgrounds smallint, interrupted boolean not null default false,
  -- hesitation dynamics
  n_answer_changes smallint, n_taps smallint, mean_tap_hold_ms int, sd_tap_hold_ms int,
  tap_hold_durations_ms int[], dwell_before_first_touch_ms int,
  pointer_path_length_px int, n_direction_reversals smallint,
  off_target_tap_offset_px real,
  -- outcome
  correct boolean, grade smallint,
  error_type text check (error_type in
    ('omission','no_response_timeout','semantic_near_miss','phonological_near_miss',
     'intrusion_other_person','perseveration','confabulation','wrong_but_plausible')),
  response_hash text,                          -- hmac with identity.subject_salt. never raw text.
  -- assistance
  hint_level_reached smallint, n_hints smallint, time_to_first_hint_ms int,
  presentation_mode text check (presentation_mode in
    ('free_recall','cued_recall','recognition','familiarity_exposure')),
  n_distractors smallint, assistance_dependency_index real,
  rescued_to_success boolean,
  -- speech features (features only; audio and transcript stay in the content plane)
  utterance_duration_ms int, speech_rate_wpm real, articulation_rate real,
  n_pauses smallint, mean_pause_ms int, max_pause_ms int, n_filled_pauses smallint,
  voiced_ratio real, type_token_ratio real, asr_confidence real, asr_language text,
  -- safety
  distress_signal text check (distress_signal in ('none','mild','moderate','severe')),
  distress_signal_source text check (distress_signal_source in
    ('patient_control','caregiver_report','abandonment','repeated_skip')),
  difficulty_floor_triggered boolean, item_absorbing_state_entered boolean,
  computed_from_ingest_seq bigint not null
);

create index interaction_subject_day on proj.interaction (subject_id, day_offset);
create index interaction_item        on proj.interaction (item_id, day_offset);
create index interaction_probe       on proj.interaction (subject_id, day_offset) where item_is_probe;

-- the scheduler cache. never authoritative; always rederivable.
create table proj.scheduler_state (
  subject_id        uuid not null,
  item_id           uuid not null,
  state             jsonb not null,           -- opaque to SQL. shape owned by src/domain/scheduler.ts
  scheduler_version text not null,
  computed_upto_ordering_key bytea not null,
  computed_at       timestamptz not null default now(),
  stale             boolean not null default false,
  primary key (subject_id, item_id)
);

create table proj.scheduler_snapshot (
  subject_id        uuid not null,
  scheduler_version text not null,
  upto_ordering_key bytea not null,
  state             jsonb not null,
  event_count       int   not null,
  created_at        timestamptz not null default now(),
  primary key (subject_id, scheduler_version, upto_ordering_key)
);

-- the caregiver's surface. P5-shaped: moments and actions, never aggregates of failure.
create table proj.moment (
  moment_id   uuid primary key,
  subject_id  uuid not null,
  occurred_on date not null,
  kind        text not null check (kind in
                ('long_narration','song_played','item_first_success','tier1_maintained',
                 'session_shared_with_caregiver','new_item_added')),
  item_id     uuid,
  magnitude   int,                             -- e.g. seconds of speech. never a score.
  computed_from_ingest_seq bigint not null
);

create table proj.adverse_event (
  event_id    uuid primary key,
  subject_id  uuid not null,
  day_offset  int not null,
  severity    text not null check (severity in ('mild','moderate','severe')),
  category    text not null check (category in
                ('distress','catastrophic_reaction','bereavement_confrontation',
                 'carer_distress','acute_change_suspected_delirium','other')),
  related_item_class text,
  narrative_coded text,
  action_taken text, reported_by_role text,
  probe_disabled_as_result boolean not null default false,
  amended_by  uuid references proj.adverse_event(event_id),   -- never deleted, only superseded
  computed_from_ingest_seq bigint not null
);

create table proj.arm_assignment (
  subject_id  uuid not null,
  factor      text not null check (factor in ('m3_probe_paradigm','m2_photo_source','prime_condition')),
  scope       text not null check (scope in ('participant','session')),
  session_id  uuid,
  arm         text not null,
  allocation_version text not null,
  assigned_at_day_offset int not null,
  primary key (subject_id, factor, coalesce(session_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

create table proj.revocation (
  revocation_id uuid primary key,
  patient_id    uuid,                          -- nulled on erasure; the sha256 is what devices need
  media_sha256  bytea not null,
  item_id       uuid,
  issued_at     timestamptz not null default now(),
  reason        text not null check (reason in
                  ('erasure','item_retired','person_status_changed','content_corrected','revoked_release'))
);

create table proj.device_purge_ack (
  device_id     uuid not null,
  media_sha256  bytea not null,
  acked_at      timestamptz not null,
  primary key (device_id, media_sha256)
);
```

### 8.2 Synchronous for the hot set, queued for the rest

`proj.apply(event_id)` runs **inside the ingest transaction** for `proj.session`, `proj.moment`, `proj.consent_state`, `proj.adverse_event`, `proj.revocation` and `proj.arm_assignment`. Those are small folds and they are what a human looks at.

`proj.interaction` and the research derived variables go on a queue:

```sql
create table log.projection_queue (
  queue_id   bigint generated always as identity primary key,
  event_id   uuid not null,
  projector  text not null,
  enqueued_at timestamptz not null default now(),
  attempts   smallint not null default 0,
  failed_reason text
);
create index projection_queue_pending on log.projection_queue (projector, queue_id)
  where failed_reason is null;
```

**A queue, deliberately, and not an `ingest_seq > watermark` cursor.** Identity columns are allocated before commit, so transaction A can take `ingest_seq = 100`, transaction B take 101, and B commit first. A worker polling `where ingest_seq > watermark` reads 101, advances the watermark to 101, and never sees 100 when it commits a millisecond later. That bug silently drops events, is invisible in testing, and is the single most common defect in hand-rolled event-sourced systems. A queue table drained with `for update skip locked` is transactionally correct because the queue row becomes visible at exactly the same instant as the log row.

### 8.3 Scheduler recomputation — in Deno, never in SQL

ADR §11 eliminated `nextjs-fullstack` partly for requiring "the scheduler implemented twice, in TypeScript and in SQL, reconciled by a 10,000-case property test." **There is no SQL scheduler here.** `proj.scheduler_state` is a cache of a `jsonb` blob that Postgres never interprets. The recompute lives in `supabase/functions/sync/`, imports `src/domain/scheduler.ts` unmodified, and is the same fold the device runs.

```ts
// supabase/functions/sync/replay.ts — the whole read path, in outline
const snap   = await loadSnapshot(subjectId, SCHEDULER_VERSION);
const tail   = await loadEvents(subjectId, { after: snap?.uptoOrderingKey });
const state  = fold(snap?.state ?? initialState(), tail);   // src/domain/scheduler.ts
if (tail.length > SNAPSHOT_EVERY) await writeSnapshot(subjectId, state, lastKey(tail));
```

Snapshot arithmetic: ~500 events per session × 3 sessions/day × 84 days ≈ 126,000 events per subject over a 12-week pilot. A pure fold over 126k small objects is roughly 100–300 ms in Deno — acceptable but not free, and unbounded in a longer study. Snapshot every 5,000 events and the tail is bounded at 5,000, so a recompute is single-digit milliseconds regardless of study length.

Snapshots are keyed by `scheduler_version`. Bumping the scheduler invalidates every snapshot and the next replay recomputes from zero at the new algorithm. **That is the free re-derivation the ES centre exists for**: fix a scheduler bug in week 9 and every participant's state is correct as if the fix had shipped in week 1, with the corrected history available to the research plane as a versioned derived variable.

### 8.4 Late arrivals and rewind

A three-day-offline tablet delivers events that sort before events already projected. Handling:

```sql
create or replace function proj.invalidate_from(p_subject uuid, p_key bytea)
returns void language sql security definer set search_path = '' as $$
  update proj.scheduler_state set stale = true
    where subject_id = p_subject and computed_upto_ordering_key >= p_key;
  delete from proj.scheduler_snapshot
    where subject_id = p_subject and upto_ordering_key >= p_key;
  insert into log.projection_queue (event_id, projector)
    select event_id, 'interaction_flat' from log.event_log
     where subject_id = p_subject and ordering_key >= p_key;
$$;
```

`proj.interaction` rows are keyed by `interaction_id` and are recomputed idempotently, so rewind is an upsert, not a delete-and-rebuild. `proj.session` aggregates are recomputed for the affected sessions only.

**Rewind depth is bounded by `hard_expiry_days`.** A device that has not synced in 7 days refuses to render (ADR §4.5) and therefore produces no new events. So the deepest possible rewind is 7 days of one device's stream — a few thousand events. That bound is not something we chose for this purpose; it falls out of the stolen-tablet dial, and it is worth noticing that the two constraints agree.

---

## 9. THE CAREGIVER'S READ PATH, AND WHAT IT COSTS

P5 forbids every aggregate of failure. The caregiver surface is "events and moments" plus "actions". So the caregiver's only read path is `proj.moment` and `app.*`:

```sql
create view app.my_moments with (security_invoker = true) as
select sm.patient_id, m.occurred_on, m.kind, m.magnitude, m.item_id
from proj.moment m
join identity.subject_map sm on sm.subject_id = m.subject_id
where exists (select 1 from app.caregiver_patients cp
              where cp.patient_id = sm.patient_id
                and cp.caregiver_user_id = auth.uid()
                and cp.revoked_at is null
                and 'view_moments' = any(cp.permissions));
grant select on app.my_moments to caregiver;
```

`security_invoker = true` here, deliberately: the caregiver has a legitimate RLS-scoped grant on `identity.subject_map`, so the view can run as the caller and the RLS policy on `subject_map` does the authorisation. That is stronger than a definer view carrying its own predicate, and it is available *only* for the caregiver — the researcher gets the definer path because the researcher must never have any grant on `identity` at all. The asymmetry is intentional and it is stated in `policies.ts`.

**The honest cost, and this is the objection to the whole design.** "Show me this week's moments for Mum" against a raw event log is a scan of every event that subject ever produced. It is fast here only because `proj.moment` exists. Every caregiver screen needs a projection built for it, which means **adding a screen is a migration, not a query.** In a mutable-state design a new caregiver view is a `SELECT` written on a Tuesday afternoon. Here it is: define the fold, write the projector, write the backfill, run the backfill over the whole log, add the index. Call it half a day rather than half an hour, every time.

That is a real tax and I am not going to pretend the projections make it disappear. What I will say is what we buy for it: the backfill is *possible*. A mutable-state design that did not record the underlying facts cannot produce a screen about the past at all — it can only start collecting for it now. Over a 12-week pilot where the analysis questions are not fully known at week 1 (and §8.4's data-minimisation discipline means every field must be pre-registered but the *derived variables* explicitly may not be), the ability to answer a question retrospectively is worth more than the ability to answer a known question quickly.

---

## 10. THE RESEARCH PLANE

### 10.1 Structure

```sql
create schema research;
grant usage on schema research to researcher;
-- researcher has no USAGE on app, log, proj, identity, ingest, storage, public.
```

Every view is owned by `research_view_owner` and is a **definer** view (`security_invoker = false`, which is the default; stated explicitly because PG15 changed the ergonomics and a future migration that flips it would break the plane open):

```sql
create view research.participant
with (security_invoker = false) as
select pm.participant_code,
       p.dementia_subtype, p.severity_band, p.fluctuation_band,
       app.age_band(p.birth_year)          as age_band,        -- never DOB, never birth year
       p.first_language, p.content_language,
       ch.country_locale,
       cs.pathway                          as consent_pathway,
       cs.capacity_status,
       e.years_education_band, e.prior_computer_use, e.apathy_score,
       e.hearing_aid_use, e.corrected_vision,
       a3.arm                              as m3_probe_paradigm
from identity.participant_map pm
join identity.subject_map     sm using (subject_id)
join app.patients             p  on p.id = sm.patient_id
join app.care_homes           ch on ch.id = p.care_home_id
join app.enrolment_context    e  on e.patient_id = p.id
join proj.consent_state       cs on cs.subject_id = pm.subject_id
left join proj.arm_assignment a3 on a3.subject_id = pm.subject_id
                                and a3.factor = 'm3_probe_paradigm'
where cs.research_use_active;                                  -- the consent gate

alter view research.participant owner to research_view_owner;
grant select on research.participant to researcher;
```

```sql
create view research.interaction with (security_invoker = false) as
select pm.participant_code, i.*   -- minus subject_id, minus response_hash's salt lineage
from proj.interaction i
join identity.participant_map pm on pm.subject_id = i.subject_id
join proj.consent_state cs on cs.subject_id = i.subject_id
where cs.research_use_active
  and (cs.speech_features_active or i.utterance_duration_ms is null);
```

Analogous views: `research.session`, `research.probe_trial`, `research.adverse_event`, `research.consent_event`, `research.arm_assignment`, `research.clinician_assessment`, `research.medication_and_comorbidity`, `research.derived`.

### 10.2 Why re-identification is structurally impossible, in four independent layers

1. **No grant on `identity`.** `researcher` has no `USAGE` on the schema, so `identity.participant_map` and `identity.subject_map` are not nameable, let alone selectable. The bridge exists only inside `research_view_owner`, which is `nologin` and is not granted to `authenticator`, so no JWT can ever become it. **This is the missing grant the ADR demands, and it is a grant statement you can read, not a predicate you have to trust.**
2. **The maps are split.** Even if a caregiver and a researcher collude and pool everything they can each read, the caregiver holds `subject_id ↔ patient_id` and the researcher holds `participant_code` with no `subject_id` anywhere in any view. The composition requires `participant_map`, which neither can reach. Splitting the map in two costs one table and closes the collusion path.
3. **There is nothing identifying to leak.** `proj.*` is folded exclusively from `log.event_log`, and §4.3's CHECK constraint makes it impossible for a name, a sentence, a transcript or a date to be in an event payload. A researcher who somehow got `SELECT` on `proj.interaction` directly would find tokens and numbers. The `app` schema — where the names and photographs are — is not referenced by any research view except for `research.participant`'s deliberately banded fields, and `app.age_band()` is `IMMUTABLE` and returns a five-year band.
4. **No date ever leaves.** `day_offset` is computed inside the view from `identity.participant_map.enrolled_on`, which the researcher cannot read. There is no `timestamptz` column in any `research.*` view. `local_hour` and `time_of_day_bucket` are permitted by §7 and are not date elements under Safe Harbor.

And a fifth, which is the one that catches the mistake nobody anticipates: a pgTAP test asserts the shape rather than the intent.

```sql
-- supabase/tests/research_plane.sql
select is_empty($$
  select c.table_name, c.column_name
  from information_schema.columns c
  where c.table_schema = 'research'
    and (c.data_type in ('timestamp with time zone','timestamp without time zone','date')
         or c.column_name ~ '(name|dob|birth|email|phone|address|transcript|narrative|path|sha256|url)')
    and c.column_name <> 'narrative_coded'
$$, 'no research view exposes a date or an identifier-shaped column');

select is_empty($$
  select * from information_schema.role_table_grants
  where grantee = 'researcher' and table_schema <> 'research' and table_schema <> 'ops'
$$, 'researcher has no grant outside research and ops');

select is_empty($$
  select * from information_schema.usage_privileges
  where grantee = 'researcher' and object_schema = 'identity'
$$, 'researcher has no usage on identity');
```

### 10.3 A/B allocation that the researcher can verify but not predict

M3 is frozen per participant; M2 and the prime condition are randomised per session (product shape §8.5). Per-session assignment is **derived, not stored** — and then also logged, so the two can be compared:

```
session_seed  = hmac_sha256(identity.study_salt.salt, subject_id || session_ordinal)
m2_photo_source = (session_seed[0] & 1) ? 'personal' : 'generic'
prime_condition = (session_seed[1] & 1) ? 'primed'   : 'unprimed'
```

M3 uses block randomisation stratified on `fluctuation_band`, because §9 Gate 3 makes DLB a pre-registered stratification variable rather than a post-hoc split — so the allocation must actually be balanced within stratum, not merely recorded.

The salt is readable by nobody, so allocation is unpredictable to the site. But an auditor with the salt can recompute every assignment from `subject_id` and `session_ordinal` and compare against `proj.arm_assignment`. A mismatch is a data-integrity alarm on the ops console. Allocation concealment and allocation verifiability at the same time, from one 32-byte row.

---

## 11. ERASURE — THE HARD PROBLEM, ANSWERED

The classic objection to an event-sourced centre is that GDPR Art. 17 and an append-only log cannot both be true. Three answers are usually offered and two of them are bad.

**Bad answer 1: rewrite the log.** Delete or update the offending rows. This destroys the property the log exists for. The hash chain breaks, the safety register becomes deniable, and the audit that six of seven Tier-1 criteria depend on is no longer evidence.

**Bad answer 2: crypto-shredding as the primary mechanism.** Encrypt each subject's payloads with a per-subject key, destroy the key. This works and it is used here for one narrow purpose (§11.5), but as the *primary* answer it is weak: the ciphertext is still personal data held by the controller until the key is provably unrecoverable everywhere including backups, the EDPB has never blessed it as erasure in a live system, and it requires you to be right about your key management forever.

**The answer here: the log never contained an identifier, so there is nothing in it to erase.**

### 11.1 Why the log is already pseudonymous, and how erasure makes it anonymous

Every row in `log.event_log` carries `subject_id`, `device_id`, `item_id` — three opaque UUIDs — plus tokens and numbers. It carries no name, no date, no free text, no media, no transcript. Structurally, by the §4.3 CHECK.

While `identity.subject_map` exists, `subject_id` is pseudonymised personal data (UK GDPR Art. 4(5): still personal data — this is the point the "we hashed it" arguments get wrong). Once the map row is deleted and the content plane is gone, **there is no additional information, held by us or reasonably available to anyone, that attributes those rows to a natural person.** Recital 26: the Regulation does not apply to anonymous information. That is not a legal opinion I am qualified to give and B2/B3 must confirm it — but it is a structurally sound position, and it is a far stronger one than "we deleted the key".

**One deletion anonymises the entire derived estate.** `proj.*` is keyed on `subject_id` too, so the projections, the snapshots, the moments and the adverse-event register all become anonymous at the same instant, without a single `UPDATE`. That is the property that makes this design's erasure story short.

### 11.2 What is actually deleted

```sql
create or replace function ops.execute_erasure(p_patient_id uuid, p_case_ref text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_subject uuid; v_erasure_id uuid := gen_random_uuid();
begin
  select subject_id into strict v_subject from identity.subject_map where patient_id = p_patient_id;

  -- 1. Record the intent in the log, BEFORE destroying the ability to record it.
  perform log.write_server_event(v_subject, 'erasure.requested',
    jsonb_build_object('case_ref', p_case_ref, 'erasure_id', v_erasure_id));

  -- 2. Queue every storage object for deletion (Postgres cannot delete from S3).
  insert into ops.storage_purge_queue (erasure_id, bucket, path, sha256)
  select v_erasure_id, 'patient-media', m.storage_path, m.sha256
  from app.media_objects m where m.patient_id = p_patient_id;

  -- 3. Issue purge tombstones so every device drops its local copy on next sync.
  insert into proj.revocation (revocation_id, patient_id, media_sha256, reason)
  select gen_random_uuid(), p_patient_id, m.sha256, 'erasure'
  from app.media_objects m where m.patient_id = p_patient_id;

  -- 4. Open the outstanding-device ledger BEFORE unassigning anything.
  insert into ops.erasure_device_outstanding (erasure_id, device_id, media_sha256)
  select v_erasure_id, dp.device_id, m.sha256
  from app.device_patients dp
  join app.media_objects m on m.patient_id = dp.patient_id
  where dp.patient_id = p_patient_id;          -- includes previously-unassigned devices

  -- 5. Force every holding device to reconnect before it may render anything again.
  update app.devices d set content_valid_until = now()
  where exists (select 1 from app.device_patients dp
                where dp.device_id = d.id and dp.patient_id = p_patient_id);

  -- 6. Hard delete the content plane. Cascades to people, decks, items, media_objects,
  --    depicted_people, caregiver_patients, device_patients, adverse_event_narrative.
  delete from app.patients where id = p_patient_id;

  -- 7. Destroy the maps and the salt. This is the erasure of the log.
  delete from identity.subject_map     where subject_id = v_subject;
  delete from identity.participant_map where subject_id = v_subject;
  delete from identity.subject_salt    where subject_id = v_subject;

  -- 8. Nullify the one identifying column that survives outside the log.
  update log.content_change set patient_id = null where patient_id = p_patient_id;
  update proj.revocation      set patient_id = null where patient_id = p_patient_id;

  -- 9. Record completion, and the backup horizon.
  insert into ops.erasure_ledger (erasure_id, case_ref, subject_id, requested_at, content_deleted_at,
                                  map_destroyed_at, backup_horizon_clear_at)
  values (v_erasure_id, p_case_ref, v_subject, now(), now(), now(),
          now() + (select pitr_days from ops.config) * interval '1 day');

  perform log.write_server_event(v_subject, 'erasure.map_destroyed',
    jsonb_build_object('erasure_id', v_erasure_id));
  return v_erasure_id;
end $$;

revoke execute on function ops.execute_erasure(uuid, text) from public, anon, authenticated;
grant execute on function ops.execute_erasure(uuid, text) to carehome_admin;
```

Note step 1 and the final `write_server_event`: the erasure itself is recorded *in the log*, referencing a `subject_id` that is meaningless a few statements later. So the audit trail proves an erasure happened, when, and under which case reference, without holding anything that identifies whose it was. Article 30 record-keeping and Article 17 compliance in the same append-only structure.

### 11.3 Erasure that reaches the tablet

> "A deleted photograph must be purged from the tablet, not just from Postgres."

Four mechanisms, in order of speed:

1. **Tombstone in `device.device_content`.** Every revoked `sha256` appears as `op = 'purge'`. On the next sync the device deletes `${documentDirectory}media/<sha256>` and the corresponding SQLite rows. ADR §8 already requires this and gives it its own integration test.
2. **Purge acknowledgement is an event.** The device writes `device.media_purged { sha256 }`, which folds into `proj.device_purge_ack`. The erasure is not *closed* until every outstanding device has ACKed:

```sql
create view ops.erasure_status as
select el.erasure_id, el.case_ref, el.requested_at,
       count(*) filter (where ack.acked_at is null) as devices_outstanding,
       max(d.content_valid_until)                    as latest_forced_reconnect,
       (count(*) filter (where ack.acked_at is null) = 0
        and el.storage_purged_at is not null
        and el.map_destroyed_at is not null)         as complete
from ops.erasure_ledger el
left join ops.erasure_device_outstanding o on o.erasure_id = el.erasure_id
left join proj.device_purge_ack ack on ack.device_id = o.device_id
                                   and ack.media_sha256 = o.media_sha256
left join app.devices d on d.id = o.device_id
group by el.erasure_id, el.case_ref, el.requested_at, el.storage_purged_at, el.map_destroyed_at;
```

3. **Forced reconnect.** Step 5 sets `content_valid_until = now()` for every holding device, so the tablet refuses to render *anything* until it has synced and therefore purged. A device that is powered on and on the network purges within one sync interval; a device that is powered on and offline shows the "please reconnect this tablet" screen immediately.
4. **Hard expiry as the backstop.** A tablet that is switched off in a drawer cannot be reached by any mechanism. The honest guarantee is: **maximum residency of an erased photograph on an unreachable device is `hard_expiry_days`, default 7**, after which it refuses to render and, on its next successful sign-in, either purges or (if revoked) wipes SQLite, the media directory and both Keychain items. ADR §4.5 chose 7 over 14 to halve the stolen-tablet window; it halves this one too.

Anything stronger than that is a lie about physics. A device with no power and no radio cannot be commanded. What we can promise, and do, is: the object is gone from storage immediately, gone from Postgres immediately, unrenderable on every device within `hard_expiry_days`, and the ledger names the specific devices that have not yet confirmed.

### 11.4 Export, and the two things that survive an erasure request

Full export (`supabase/functions/export-patient/`) emits, for one patient: every `app.*` row, every media object as bytes, and the *human-meaningful* part of their event history rendered through `proj.*` — sessions, moments, adverse events, consent history — in JSON plus the raw media files. Not the raw event log, which is unreadable and would be a data dump rather than a subject access response.

Two things do not go away on an Art. 17 request, and both should be said in the withdrawal flow in plain words rather than discovered later:

- **The coded adverse-event register.** Art. 17(3)(d) exempts processing necessary for scientific research where erasure would seriously impair the objectives, and a safety register that can be edited by the people it might indict is not a safety register. So the coded category, severity and day-offset stay in the log — anonymous after §11.2 — while the **free-text clinical narrative is hard-deleted with the rest of `app`**. That split is exactly why the narrative lives in `app.adverse_event_narrative` and only the code goes in the event.
- **The erasure ledger itself.** Case reference, dates, device list. Art. 30 requires it.

### 11.5 Backups, which is where most erasure claims quietly fail

Point-in-time recovery holds the pre-erasure state for the PITR window. Concretely:

- PITR is configured at **7 days** and `ops.config.pitr_days` mirrors it, so the erasure ledger can compute `backup_horizon_clear_at`.
- **A restore is not complete until `ops.replay_erasure_ledger()` has run.** It re-executes every erasure recorded after the restore point. It is a documented step in the runbook, it is in the disaster-recovery drill, and the drill is a pilot gate — because an untested restore procedure that silently resurrects a deleted family photograph is the exact failure ADR §8 calls "the worst bug in this product".
- `ops.erasure_ledger` is the only table that must survive a restore *ahead* of the data it governs, so it is additionally streamed to append-only object storage outside the database.

And this is the one place crypto-shredding earns its keep: `identity.subject_salt` is held in Supabase Vault rather than in a plain column, so a restored backup that predates the salt's destruction cannot re-derive the meaning of a `response_hash` even before the ledger replay runs. Belt and braces, for the narrow case where it actually adds something.

---

## 12. RLS — THE COMPLETE POLICY SET

Every table: `enable row level security` **and** `force row level security`, so the table owner is subject to its own policies and a compromised definer function cannot walk past them.

### 12.1 The device

```sql
-- ingest.events, ingest.sessions: INSERT only, shown in §5.
-- log.*, proj.*, app.*, identity.*, research.*: no grant, no policy, unreachable.
-- device.device_content, device.device_roster: SELECT on the two definer views.
```

Zero `SELECT` on any base patient table. Zero `UPDATE`. Zero `DELETE`. Anywhere, in any schema. The audit query in §1 proves it in four rows.

### 12.2 The caregiver

```sql
alter table app.patients enable row level security;
alter table app.patients force  row level security;

create policy patients_caregiver_select on app.patients for select to caregiver
using (exists (select 1 from app.caregiver_patients cp
               where cp.patient_id = app.patients.id
                 and cp.caregiver_user_id = auth.uid()
                 and cp.revoked_at is null));

-- A caregiver may never insert a patient directly: enrolment goes through an RPC that
-- also writes consent.initial as carehome_admin. The missing INSERT policy is the enforcement.
create policy patients_caregiver_update on app.patients for update to caregiver
using (exists (select 1 from app.caregiver_patients cp
               where cp.patient_id = app.patients.id and cp.caregiver_user_id = auth.uid()
                 and cp.revoked_at is null and 'author_content' = any(cp.permissions)))
with check (
  -- eligibility and UI version are frozen at enrolment (P10, §9 Gate 3)
  dementia_subtype   = (select dementia_subtype   from app.patients o where o.id = app.patients.id)
  and ui_version     = (select ui_version         from app.patients o where o.id = app.patients.id)
  and eligibility_outcome = (select eligibility_outcome from app.patients o where o.id = app.patients.id));

create policy items_caregiver_all on app.items for all to caregiver
using (exists (select 1 from app.decks d
               join app.caregiver_patients cp on cp.patient_id = d.patient_id
               where d.id = app.items.deck_id and cp.caregiver_user_id = auth.uid()
                 and cp.revoked_at is null and 'author_content' = any(cp.permissions)))
with check (exists (select 1 from app.decks d
               join app.caregiver_patients cp on cp.patient_id = d.patient_id
               where d.id = app.items.deck_id and cp.caregiver_user_id = auth.uid()
                 and cp.revoked_at is null and 'author_content' = any(cp.permissions)));
```

Analogous `for all` policies on `app.people`, `app.media_objects`, `app.depicted_people`, `app.decks`, gated on `'author_content'`.

The `with check` on `patients_caregiver_update` is P10 in a policy: **a caregiver cannot change the participant's UI version mid-study, and cannot change the subtype that decided their eligibility.** Those are study-integrity fields and the enrolling caregiver is exactly the person with a motive to edit them.

### 12.3 The care-home admin

```sql
create policy patients_admin_all on app.patients for all to carehome_admin
using (care_home_id = authn.care_home_id())
with check (care_home_id = authn.care_home_id());
```

Same shape on `app.devices`, `app.device_patients`, `app.enrolment_codes`, `app.caregivers`, `app.caregiver_patients`.

### 12.4 The researcher

No policies, because no grants. `researcher` cannot name a table outside `research` and `ops`.

### 12.5 Storage

```sql
create policy media_caregiver_rw on storage.objects for all to caregiver
using (bucket_id = 'patient-media'
   and exists (select 1 from app.media_objects m
               join app.caregiver_patients cp on cp.patient_id = m.patient_id
               where m.storage_path = storage.objects.name
                 and cp.caregiver_user_id = auth.uid() and cp.revoked_at is null))
with check (bucket_id = 'patient-media' and (storage.foldername(name))[1] = 'patient');

-- device and researcher get no policy at all on storage.objects.
-- devices receive signed URLs from the sync function; researchers never touch media.
```

### 12.6 `service_role`

`service_role` bypasses RLS in Supabase. Three mitigations, all enforceable:

- The three Edge Functions that hold it (`enrol-device`, `redeem-enrolment`, `sync`) verify the *caller's* own JWT and the caller's membership before using it — ADR §5.2 already requires this for enrolment.
- The definer functions in `log` and `proj` are owned by `log_writer`, a **non-superuser, nologin** role, not by `postgres`. A defect in one of them escalates to `log_writer`'s grants, which are `INSERT` on the log and nothing else.
- `ops.execute_erasure` is granted to `carehome_admin`, not held behind `service_role`, so the most destructive operation in the system is performed by an identified human whose action lands in `log.content_change` and `ops.erasure_ledger`.

---

## 13. `policies.ts` — THE BLIND-TESTABLE EXPECTATION TABLE

ADR §6.1 requires this as data, written from the spec and never from the policies. The rows this design commits to:

```ts
export const policyExpectations = [
  // --- device: the four-row surface -----------------------------------------
  { role:'device', table:'device.device_content', verb:'select',
    allowedWhen:'patient is assigned to the token device_id, device not revoked, consent active',
    zeroRowsWhen:'patient belongs to another device, ward or care home; or consent withdrawn; or dissent active' },
  { role:'device', table:'device.device_roster', verb:'select',
    allowedWhen:'same', zeroRowsWhen:'same' },
  { role:'device', table:'ingest.events', verb:'insert',
    allowedWhen:'device_id equals the token device_id AND patient_id is in device_patients',
    deniedWhen:'device_id is any other value, or patient_id is not assigned, or device revoked' },
  { role:'device', table:'ingest.sessions', verb:'insert',
    allowedWhen:'same', deniedWhen:'same' },
  { role:'device', table:'ingest.events',  verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'device', table:'log.event_log',  verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'device', table:'app.patients',   verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'device', table:'*',              verb:'update', allowedWhen:'never', deniedWhen:'always' },
  { role:'device', table:'*',              verb:'delete', allowedWhen:'never', deniedWhen:'always' },

  // --- append-only, for every role including service_role --------------------
  { role:'*', table:'log.event_log', verb:'update', allowedWhen:'never', deniedWhen:'always' },
  { role:'*', table:'log.event_log', verb:'delete', allowedWhen:'never', deniedWhen:'always' },

  // --- researcher: de-identification as a missing grant ----------------------
  { role:'researcher', table:'app.patients',            verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'researcher', table:'identity.subject_map',    verb:'select', allowedWhen:'never', deniedWhen:'always (no schema usage)' },
  { role:'researcher', table:'identity.participant_map',verb:'select', allowedWhen:'never', deniedWhen:'always (no schema usage)' },
  { role:'researcher', table:'proj.interaction',        verb:'select', allowedWhen:'never', deniedWhen:'always (no schema usage)' },
  { role:'researcher', table:'storage.objects',         verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'researcher', table:'research.interaction',    verb:'select',
    allowedWhen:'always, for subjects whose research_use consent is active',
    zeroRowsWhen:'subject withdrew research consent, or consent lapsed past reaffirm_due_at' },
  { role:'researcher', table:'research.*', verb:'select',
    allowedWhen:'always', invariant:'no column of type date or timestamptz is exposed by any view' },

  // --- caregiver ------------------------------------------------------------
  { role:'caregiver', table:'app.patients', verb:'select',
    allowedWhen:'an unrevoked caregiver_patients link exists for auth.uid()',
    zeroRowsWhen:'link revoked, or patient in another family or home' },
  { role:'caregiver', table:'app.patients', verb:'update',
    allowedWhen:'link has author_content',
    deniedWhen:'the update changes ui_version, dementia_subtype or eligibility_outcome' },
  { role:'caregiver', table:'app.patients', verb:'insert', allowedWhen:'never', deniedWhen:'always' },
  { role:'caregiver', table:'consent.initial', verb:'write-event',
    allowedWhen:'never', deniedWhen:'always — a caregiver may never assert the patient consented (P22)' },
  { role:'caregiver', table:'consent.withdrawn', verb:'write-event', allowedWhen:'always' },
  { role:'caregiver', table:'consent.dissent_observed', verb:'write-event', allowedWhen:'always' },
  { role:'caregiver', table:'safety.item_retired', verb:'write-event', allowedWhen:'always' },
  { role:'caregiver', table:'research.interaction', verb:'select', allowedWhen:'never', deniedWhen:'always' },

  // --- structural invariants, asserted as data ------------------------------
  { role:'*', invariant:'no event payload contains a string with a space character' },
  { role:'*', invariant:'no column in any schema can hold a biometric template or embedding' },
  { role:'*', invariant:'an app.items row with item_tier=1 and a deceased person requires a
                         deceased_recognition_consent row' },
  { role:'*', invariant:'an app.patients row with dementia_subtype PCA or svPPA cannot exist' },
  { role:'*', invariant:'a device_roster row disappears within one sync of dissent_active' },
] as const;
```

The last five rows are the ones a mutable-state design cannot offer as *invariants*. They are constraints and grants, so the blind test-writer asserts them by attempting the forbidden thing and expecting an error code, without ever seeing a policy.

---

## 14. VERIFYING DETERMINISM

Three tests, all writable blind from this document.

**Replay idempotence.** Fold a fixture event set twice; hash both outputs; assert equal.

**Order independence of ingest.** Shuffle the fixture's *arrival* order into 50 random permutations, ingest each into a fresh database, replay, hash. Assert all 50 hashes are identical. This is the actual proof that `ordering_key` gives a deterministic total order and that the canonicalisation is not accidentally arrival-sensitive.

**Late-arrival convergence.** Ingest device A's stream, project, snapshot. Then ingest device B's three-days-stale stream, whose events sort into the middle. Assert the final projection equals the projection produced by ingesting A and B together in canonical order from a clean database. This is the test that catches a rewind bug, and a rewind bug is the way this design fails in production.

Plus the one the ADR already requires: a pgTAP assertion that `app_metadata` cannot be written from a client, and that a token re-minted after such an attempt still carries the original role.

---

## 15. WHAT THIS COSTS — HONESTLY

**1. Projection freshness.** The hot projections are written synchronously inside the ingest transaction, so a caregiver's moments list is current the instant a sync returns 201. That is affordable because the volume is tiny: 500 events/session × 3 sessions/day × 50 participants ≈ 75,000 events/day ≈ **0.9 events/second average**, single-digit peak. The crossover where synchronous projection starts hurting sync latency is roughly 200–500 events/second sustained — two to three orders of magnitude away. **This design's freshness story is a small-N pilot story and I am saying so.** At 10× the pilot, `proj.session` and `proj.moment` move to the queue and acquire a lag SLO of a few seconds, and the caregiver surface acquires a "syncing" state it does not need today.

**2. Query cost for the caregiver's simple views.** Covered in §9. A new caregiver screen is a migration and a backfill, not a `SELECT`. Half a day rather than half an hour, every time, forever. That is the real tax and it does not go away.

**3. Storage.** ~250 bytes/event × 27M events/year ≈ 7 GB/year in the log, plus roughly the same again in `proj.interaction` and its indexes, plus the 30-day inbox. Call it **2.2× the storage a mutable-state design would use**. Partitioning is deliberately deferred: range-partitioning `log.event_log` forces the partition key into the primary key, which weakens the `event_id` idempotency guarantee that the whole telemetry story rests on. If it becomes necessary, partition on `ingest_seq` and move uniqueness into a small unpartitioned `log.event_id_seen` dedupe table checked by the ingest function. That migration is real work and should be planned, not discovered.

**4. Schema evolution.** An event written at `payload_version = 1` must still replay at v7. That means `log.upcast(type, from_version, payload)` handlers accumulate and **can never be deleted**. Every version of every event type is a permanent maintenance obligation. The mitigation is that `src/contract/schema.ts` is the single zod definition and the upcasters are pure functions with fixture tests, so the cost is bounded and testable — but it is a cost that grows monotonically with the age of the project.

**5. GDPR erasure.** Answered in §11 and I believe it holds, but the honest caveat: the position depends on "orphaned pseudonymous data with no reachable mapping is anonymous" being accepted. That is well-supported by Recital 26 and by the structure — no key to recover, no ciphertext to attack, nothing but tokens and integers — but it is a legal position and **B2 and B3 must confirm it before the pilot**, not after. If a regulator disagrees, the fallback is severe: the log rows for that subject would have to be moved to a quarantine table and dropped, breaking the hash chain at a recorded point with a recorded reason. That fallback is designed (`log.chain_break_register`, a table with `device_id`, `seq_from`, `seq_to`, `case_ref`) precisely so that if we ever have to do it, the break is documented rather than silent.

**6. Two writers, one subject.** Two shared tablets both running offline sessions for the same resident produce two interleaved streams that merge by `anchored_at_ms`. The scheduler fold sees one interleaved history and its interval bookkeeping is slightly wrong for the overlapping window. ADR §5.2 already says "a care home needing a hard boundary between two residents gets two tablets"; the mirror of that is *a resident on two tablets at once is a misconfiguration*, and `ops.concurrent_session_overlap` flags it rather than silently absorbing it.

**7. The trigger is doing a lot.** `ingest.canonicalise()` validates, translates, chains, projects and enqueues, inside the device's insert transaction. It is the highest-consequence function in the repository after the device auth path. It is `SECURITY DEFINER`, so a defect in it is an escalation. Mitigations: owned by a non-superuser `log_writer` with `INSERT`-only grants; `set search_path = ''` on every definer function without exception; and it is the single most heavily fuzzed function in the test suite. I would rather have this concentration than the alternative — canonicalisation spread across an Edge Function, a cron job and a trigger, where the invariant is nobody's.

---

## 16. WHERE I WOULD YIELD

The parts of this proposal I would defend to the end: the two-tier boundary (§2), the split identity maps (§3), the tokenised-payload CHECK (§4.3), erasure by orphaning (§11), and real Postgres roles rather than JWT string comparison (§1.1). Those five are the design.

The parts I would trade:

- **The hash chain.** It costs a serialised insert per device and a verifier nobody may ever run. If the REC and the sponsor are satisfied by grant-based append-only, drop it and save a moderate amount of complexity in the hottest function in the system. I would keep it, because a safety register whose immutability rests on our own database configuration is weaker evidence than one whose immutability rests on arithmetic — but it is the first thing I would cut under pressure.
- **Synchronous hot projections.** If sync latency ever matters, move everything to the queue and let the caregiver surface show a lag indicator. Nothing structural depends on it.
- **`ingest.sessions` as a separate table.** Purism says fold it into the event stream. The ADR mandates the grant, so it stays — but if the ADR is amended, one table disappears and nothing else changes.

And the thing I would want argued against hardest: **§9's tax.** Every caregiver screen is a projection. If the product turns out to need a lot of ad-hoc caregiver views, this design is the wrong one and a mutable-state centre with an audit log bolted on is the right one. My case is that P5 has already capped the caregiver surface at "moments and actions" — a deliberately thin dashboard is a *product requirement* here, not an engineering compromise — so the number of projections is small and known in advance. If that cap moves, so does the argument.
