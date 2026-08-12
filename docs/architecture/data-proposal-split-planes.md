# Data Proposal — SPLIT-PLANE CENTRE

**Status:** proposal, one of several competing data-architecture designs.
**Governed by:** `docs/architecture/00-ADR-PLATFORM.md` (binding), `docs/research/00-SYNTHESIS.md` (governing), `docs/design/00-V1-PRODUCT-SHAPE.md` (frozen).
**Scope:** the complete Postgres schema, row-level security, consent architecture, event log, research plane, export and erasure design for Supabase.
**Thesis in one line:** the operational plane and the research plane are two physically separate sets of tables joined by nothing, bridged one-way by a projector, and de-identification is the *absence of a grant on a third schema* rather than a predicate anybody can forget.

---

## 0. Assumptions I am making explicit, per CLAUDE.md §1

1. **One Supabase project, one Postgres cluster, at least until the DPIA says otherwise.** Requirement 3 (a cloud project created at handoff) and the ADR's single-package posture both point this way. §13 addresses honestly what a single cluster does and does not buy, and specifies the migration to two clusters as a config change rather than a redesign.
2. **Custom Postgres roles are available.** The whole "missing grant" claim rests on the researcher not being the same Postgres role as the caregiver. Supabase supports this through a Custom Access Token Auth Hook that writes the `role` claim, plus `grant app_researcher to authenticator`. **This is a week-1 verification gate**, listed in §15. If it turns out to be unavailable, this design's central claim degrades to a `WHERE` clause and the proposal should be rejected rather than shipped in a weakened form.
3. **The scheduler design is not yet settled** (Board 5 is in flight). Nothing here depends on which of the three scheduler proposals wins; the event log is designed as the input to *a* pure fold, and §5.6 states the two properties any of them needs.
4. **"Ward" is not modelled.** The ADR mentions cross-ward isolation once (§5.3). `device_patients` is a strictly finer-grained boundary than a ward and already delivers it, so a ward table would be an unused join. Flagged rather than silently dropped.
5. I am deviating from ADR §4.3 in exactly one place — clock anchoring is **per boot, computed from `t_mono_ms`**, not per batch computed from `t_wall_ms`. §5.4 gives the reasoning. It is a strengthening, not a contradiction, but it is a deviation from a binding document and is called out rather than buried.

---

## 1. THE CENTRE — why physical separation, and why it is not a style choice

### 1.1 The biometric constraint is a *removal* constraint, and removal constraints require allow-lists

Synthesis §1.11 says the thing that decides this architecture:

> Full-face photographs and voice prints are irreducible HIPAA Safe Harbor identifiers — **they cannot be hashed or blurred into compliance, only removed.**

Every other identifier in this system has a de-identifying transform. A date becomes `day_offset_from_enrollment`. An age becomes an age band. A postcode becomes a locale. A name becomes a pseudonym. A photograph becomes *nothing*. There is no transform. The only operation is deletion.

Now consider the two ways to build a research view:

| | Deny-list (views over base tables) | Allow-list (projection into separate tables) |
|---|---|---|
| Default for a new column | **Exposed**, unless someone remembers to exclude it | **Absent**, unless someone deliberately adds it |
| Failure mode | A `select *`, a forgotten column in a hand-written list, a new column added by a migration six months later | A column that nobody projected, which the researcher notices and asks for |
| Failure direction for a photo | The photo path leaks | The photo does not exist in the plane |
| Reviewable by | Reading every view definition, every time any table changes | Reading one manifest table |

A deny-list architecture is safe only if every future migration remembers the rule. An allow-list architecture is safe by construction. **When the only available remedy for a category of data is removal, the architecture must default to removed.** That is the argument, and it is the whole argument.

The corollary is stronger than it looks: `research.interaction` is not a view over `app.events`. It is a *different table, with different rows, written by a projector*. There is no `patient_id` column anywhere in the research plane — not filtered out, not nullable, **not present**. A researcher who obtains a superuser dump of `research` and a superuser dump of `app` still cannot join them, because the join key was never written down in either place. It lives only in `link`.

### 1.2 BIPA specifically, stated precisely rather than invoked

Synthesis §1.11 and P20 (NEVER-DO #17) invoke Illinois BIPA, Texas CUBI and Washington. Being precise about what those statutes actually attach to changes the schema, so it is worth being precise.

BIPA's definition of "biometric identifier" **excludes photographs**, but "biometric information" — anything *derived from* a biometric identifier and used to identify a person — is covered, and a scan of face geometry derived from a photograph is the paradigm case. The 740 ILCS 14 exposure therefore attaches at the moment of **derivation of a template**, not at the moment of storage of a family snapshot. The private right of action and per-violation statutory damages attach to that derivation, and B3 is open precisely because nobody has yet got a written opinion on where the line sits for photos of non-user relatives.

Two schema consequences follow, and they are different from each other:

1. **The derivation must be structurally unrepresentable.** There is no `embedding`, `descriptor`, `template`, `face_bbox`, `voiceprint` or `speaker_id` column anywhere in this schema, in any plane. P20 is not enforced by a policy — it is enforced by there being no column to write to, plus a CI check (§14.4) that fails on any migration introducing a `vector` type or a column matching those names. A prohibition you can point at in `information_schema` is worth more to a regulator than a prohibition in a design document.
2. **The photographs themselves are a third-party-consent problem, not a BIPA problem** — and that is *worse*, not better, because it has no derivation trigger to avoid. The photos contain relatives who are not users, who never consented, some of whom are dead and some of whom are estranged. `app.depicted_persons` and its release chain (§4.5) exist for that, and the research plane's answer is that **no representation of a depicted person, of any fidelity, ever crosses** — not the photo, not the name, not a hash of the name, not the file's sha256.

### 1.3 What "structural" means here, and what it does not

The claim being made is bounded and I will not overstate it:

> **For every query the `app_researcher` role can issue, by any route, through PostgREST or a direct connection, now or after any future migration that does not itself grant new privileges, re-identification of a participant is impossible because the mapping is not reachable.**

That is a real, testable, `\dp`-inspectable property. It is not the same as "impossible for everyone" — §13.3 is the honest accounting of who can still do it and why that is acceptable.

---

## 2. THE PLANE MAP

Six schemas. `public` is emptied and stays empty.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ OPERATIONAL PLANE                                                        │
│                                                                          │
│  app          care homes, patients, caregivers, consent, capacity,       │
│               devices, enrolment, decks, depicted persons, items,        │
│               media objects, sessions, EVENTS (source of truth),         │
│               adverse events, arm assignments, revocations, erasure      │
│               ── identifiable. photos. voices. names. real dates. ──     │
│                                                                          │
│  device_api   exactly two views: device_content, device_roster           │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                    ONE-WAY BRIDGE (SECURITY DEFINER, owned by plane_bridge)
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│  link         participant_map, site_map, boot anchors' day-0 anchors,    │
│               break_glass log                                            │
│               ── GRANTED TO NOBODY. Not app_researcher. Not              │
│                  app_caregiver. Not app_carehome_admin. Not app_device.  │
│                  Not `authenticated`. Not `anon`. ──                     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│ RESEARCH PLANE                                                           │
│                                                                          │
│  research     participant, session, interaction, adverse_event,          │
│               consent_event, clinician_assessment, medication_and_       │
│               comorbidity, derived_variable, study, study_access         │
│               ── pseudonym-keyed. no patient_id column exists. ──        │
│               ── owned by plane_bridge; NO grant to app_researcher ──    │
│                                                                          │
│  research_api views only. the sole researcher-reachable objects.         │
└──────────────────────────────────────────────────────────────────────────┘

  audit        access_log, plane_crossing_log, erasure_log, break_glass_log
               ── append-only, insert-only for everyone, select for nobody
                  except service_role and the DPO export function ──
```

### 2.1 The grant matrix — the whole security model on one screen

| | `app` | `device_api` | `link` | `research` | `research_api` | `audit` |
|---|---|---|---|---|---|---|
| `anon` | — | — | — | — | — | — |
| `app_device` | `USAGE`; `INSERT` on `events` (7 cols), `sessions` (6 cols). **No SELECT on anything.** | `USAGE`; `SELECT` on 2 views | — | — | — | — |
| `app_caregiver` | `USAGE`; `SELECT/INSERT/UPDATE` on content + consent tables, RLS-scoped | — | — | — | — | `INSERT` |
| `app_carehome_admin` | `USAGE`; `SELECT/INSERT/UPDATE` on device + membership tables, RLS-scoped | — | — | — | — | `INSERT` |
| `app_researcher` | **— nothing. no `USAGE`.** | — | **— nothing —** | **— nothing —** | `USAGE`; `SELECT` on views | `INSERT` |
| `plane_bridge` | `SELECT` (read-only, no write) | — | owner | owner | owner | `INSERT` |
| `service_role` | full | full | full | full | full | full |

Read the `app_researcher` row across. It has no `USAGE` on `app`, so it cannot name a table there even to be denied. It has no `USAGE` on `link`, so the mapping is not addressable. It has no privileges on `research` base tables, so even `research` is reached only through the views. **Three of the four cells are empty, and that emptiness is the de-identification.**

```sql
-- The four lines that are the actual security boundary.
revoke all on schema public from public;
revoke all on schema app,      link, research from public;
revoke all on schema device_api, research_api, audit from public;
alter default privileges in schema app, link, research revoke all on tables from public;
```

---

## 3. ROLES AND THE JWT PLUMBING

### 3.1 Four Postgres roles behind three human roles plus the device

```sql
create role app_device          nologin noinherit;
create role app_caregiver       nologin noinherit;
create role app_carehome_admin  nologin noinherit;
create role app_researcher      nologin noinherit;
create role plane_bridge        nologin noinherit;   -- owns link + research

grant app_device, app_caregiver, app_carehome_admin, app_researcher to authenticator;
```

`noinherit` matters: PostgREST does `set local role`, which works regardless of inheritance, but `noinherit` means these roles pick up nothing from each other or from `authenticated` by accident.

### 3.2 How a JWT becomes a Postgres role

`app_metadata` is writable only by `service_role` (ADR §5.2) and is set at enrolment. A Custom Access Token Auth Hook maps it to the `role` claim PostgREST switches on:

```sql
create or replace function auth.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare claimed text;
begin
  claimed := event #>> '{claims,app_metadata,role}';
  if claimed in ('device','caregiver','carehome_admin','researcher') then
    return jsonb_set(event, '{claims,role}', to_jsonb('app_' || claimed));
  end if;
  return event;                       -- unknown or absent: stays `authenticated`, which has nothing
end $$;

revoke execute on function auth.custom_access_token_hook from authenticated, anon, public;
grant  execute on function auth.custom_access_token_hook to supabase_auth_admin;
```

The default branch is the important one. A user with no recognised role in `app_metadata` lands on `authenticated`, and `authenticated` has been stripped of every grant in §2.1. **Failure of the role mapping fails closed, to zero access, not to caregiver access.**

### 3.3 Claim accessors

Wrapped, `stable`, `search_path`-pinned, and always called as `(select app.fn())` so the planner hoists them into an InitPlan instead of re-evaluating per row.

```sql
create or replace function app.jwt_role() returns text
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,role}', '')
$$;

create or replace function app.jwt_device_id() returns uuid
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,device_id}', '')::uuid
$$;

create or replace function app.jwt_care_home_id() returns uuid
language sql stable set search_path = '' as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,care_home_id}', '')::uuid
$$;
```

The device JWT carries `role`, `device_id`, `care_home_id`, `mode`. **It never carries `patient_id`** (ADR §5.2, adopted from `split-surfaces`). Patient scope is resolved server-side from `device_patients`, which the device cannot read.

---

## 4. OPERATIONAL PLANE — DDL

### 4.1 Enumerations

Enums rather than `text` + `check`, so that a blind test-writer gets exhaustiveness from `pg_enum` and a bad value is a type error at insert rather than a constraint violation discovered in review.

```sql
create schema app;
create schema device_api;
create schema link;
create schema research;
create schema research_api;
create schema audit;

create type app.membership_role      as enum ('caregiver','carehome_admin','researcher');
create type app.device_mode          as enum ('personal','shared');
create type app.person_status        as enum ('living','deceased','estranged','do_not_show');
create type app.relationship_category as enum
  ('spouse_partner','child','grandchild','sibling','parent','other_family',
   'friend','neighbour','carer_professional','pet','self','other');
create type app.release_status       as enum ('not_obtained','obtained','refused','not_contactable','deceased_no_representative');
create type app.media_kind           as enum ('photo','voice_caption','narration_recording','music_local');
create type app.media_state          as enum ('uploading','ready','quarantined','deleted');
create type app.item_kind            as enum
  ('identity_card','month_target','narration_prompt','generic_saying','generic_song','probe_face');
create type app.retired_by           as enum ('caregiver','clinician','patient');   -- NO 'algorithm' variant. P3.
create type app.dementia_subtype     as enum
  ('AD','PCA','svPPA','other_PPA','DLB','vascular','FTD_behavioural','mixed','MCI_unspecified','unknown');
create type app.consent_pathway      as enum ('direct','supported','consultee');
create type app.consent_purpose      as enum
  ('care_delivery','research_behavioural','research_speech_features',
   'media_retention','audio_capture','third_party_imagery','contact_for_followup');
create type app.consent_event_type   as enum
  ('initial','reaffirmation','dissent_observed','withdrawal','capacity_change',
   'consultee_change','purpose_change','reinstated','paused_review_overdue');
create type app.consent_outcome      as enum
  ('subject_consented','subject_declined','subject_withdrew',
   'consultee_advises_inclusion','consultee_advises_exclusion','consultee_advises_withdrawal',
   'dissent_observed','paused','reinstated');
create type app.withdrawal_scope     as enum ('prospective','retrospective');
create type app.capacity_status      as enum ('has_capacity','fluctuating','lacks_capacity','not_assessed');
create type app.adverse_category     as enum
  ('distress','catastrophic_reaction','bereavement_confrontation','carer_distress',
   'acute_change_suspected_delirium','hallucination_watch','other');
create type app.adverse_severity     as enum ('mild','moderate','severe');
create type app.event_type           as enum (
  'session.started','session.ended','session.mode_set',
  'trial.presented','trial.completed','trial.timeout',
  'item.introduced','item.absorbing_entered',
  'probe.block_started','probe.block_ended','probe.disabled',
  'distress.reported','skip.recorded','fade_to_rest.entered',
  'media.purged','content.expired','app.crashed','clock.anchor');
create type app.erasure_status       as enum ('requested','content_deleted','awaiting_devices','complete','failed');
create type app.export_status        as enum ('requested','building','ready','delivered','expired','failed');
```

### 4.2 Care homes, people, membership

```sql
create table app.care_homes (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  locale            text not null default 'en-GB',
  hard_expiry_days  int  not null default 7 check (hard_expiry_days between 4 and 14),  -- ADR §4.5
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- one row per human auth user. NOT one row per patient - see app.patients.
create table app.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  email_at_signup text not null,
  created_at    timestamptz not null default now(),
  disabled_at   timestamptz
);

create table app.memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references app.user_profiles(id) on delete cascade,
  care_home_id  uuid          references app.care_homes(id)    on delete cascade,
  role          app.membership_role not null,
  granted_by    uuid references app.user_profiles(id),
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  -- a researcher is study-scoped, never care-home-scoped; a caregiver at home has no care home
  constraint researcher_has_no_care_home check (role <> 'researcher' or care_home_id is null),
  unique (user_id, care_home_id, role)
);
create index on app.memberships (user_id) where revoked_at is null;
```

### 4.3 Patients — a first-class subject, not a profile inside a caregiver account (P22)

```sql
create table app.patients (
  id                    uuid primary key default gen_random_uuid(),
  care_home_id          uuid references app.care_homes(id) on delete restrict,   -- null = at home
  -- identity, operational plane only, never crosses
  given_name            text not null,
  family_name           text not null,
  preferred_name        text not null,
  date_of_birth         date not null,
  birth_year            smallint generated always as (extract(year from date_of_birth)::smallint) stored,
  grew_up_locality      text,
  first_language        text not null default 'en',
  -- optional real auth identity for the patient (P22, CRPD Art. 12 direction of travel)
  auth_user_id          uuid unique references auth.users(id) on delete set null,
  -- eligibility, §9 of the product shape
  dementia_subtype      app.dementia_subtype not null default 'unknown',
  severity_band         text check (severity_band in ('mild','moderate','severe')),
  fluctuation_band      text not null default 'normal' check (fluctuation_band in ('normal','high')),
  eligibility_decided_by uuid references app.user_profiles(id),
  eligibility_decided_at timestamptz,
  eligibility_outcome   text check (eligibility_outcome in ('eligible','eligible_flagged','deferred','not_eligible')),
  -- runtime gates
  enrolled_on           date,
  processing_paused_at  timestamptz,          -- set by the dissent trigger, §10.5
  ui_version_pinned     text,                 -- P10: frozen at enrolment
  created_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  -- ND-35 / P26: a PCA or svPPA diagnosis of record cannot be enrolled at all
  constraint subtype_exclusion check (
    enrolled_on is null or dementia_subtype not in ('PCA','svPPA','other_PPA')
  )
);

create table app.patient_caregivers (
  patient_id       uuid not null references app.patients(id) on delete cascade,
  user_id          uuid not null references app.user_profiles(id) on delete cascade,
  relationship     app.relationship_category not null,
  -- P23: differentiated permissions, and a documented removal path
  can_author_content   boolean not null default true,
  can_view_moments     boolean not null default true,
  can_receive_p25_alert boolean not null default false,   -- the delirium notifier, one named recipient
  can_manage_consent   boolean not null default false,    -- consultee / supporter only
  is_paid_professional boolean not null default false,    -- B12: paid carers cannot be personal consultees
  added_by         uuid references app.user_profiles(id),
  added_at         timestamptz not null default now(),
  removed_at       timestamptz,
  removal_requested_by_patient boolean not null default false,
  primary key (patient_id, user_id),
  constraint paid_carer_cannot_hold_consent check (not (is_paid_professional and can_manage_consent))
);

-- exactly one P25 alert recipient per patient, or the notifier has no addressee
create unique index one_p25_recipient on app.patient_caregivers (patient_id)
  where can_receive_p25_alert and removed_at is null;
```

### 4.4 Devices, enrolment (ADR §5.2 verbatim, extended only where necessary)

```sql
create table app.devices (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null unique references auth.users(id) on delete cascade,
  care_home_id     uuid not null references app.care_homes(id),
  mode             app.device_mode not null,
  label            text not null,
  hard_expiry_days int  not null default 7 check (hard_expiry_days >= 4),
  enrolled_at      timestamptz,
  last_seen_at     timestamptz,
  last_sync_at     timestamptz,
  client_version   text,
  revoked_at       timestamptz,
  revoked_by       uuid references app.user_profiles(id),
  wipe_confirmed_at timestamptz     -- set when the device reports it has wiped, §11.4
);

create table app.device_patients (
  device_id  uuid not null references app.devices(id)  on delete cascade,
  patient_id uuid not null references app.patients(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (device_id, patient_id)
);
create index on app.device_patients (patient_id);

create table app.enrolment_codes (
  code_hash   text primary key,                 -- sha256(code), never the code
  device_id   uuid not null references app.devices(id) on delete cascade,
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  attempts    int not null default 0 check (attempts <= 5)
);
```

### 4.5 Depicted persons — the BIPA-relevant entity, and P16's mandatory field

This table has no counterpart in any other proposal and it is where §1.11 lands in the schema. A *depicted person* is a human being who appears in a photograph or a voice recording and who is, in the overwhelming majority of cases, not a user of this product and has never consented to anything.

```sql
create table app.depicted_persons (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references app.patients(id) on delete cascade,
  display_name       text not null,                     -- the answer string. typed by a caregiver.
  relationship       app.relationship_category not null,
  -- P16 / ND-12. mandatory, unskippable, no default. A caregiver cannot get past the
  -- upload screen without choosing, because the column is NOT NULL with no default.
  person_status      app.person_status not null,
  is_third_party     boolean not null default true,     -- false only for the patient themself
  -- third-party consent chain (GDPR Art. 6/9, not BIPA - see §1.2)
  release_status     app.release_status not null default 'not_obtained',
  release_obtained_at timestamptz,
  release_evidence_ref text,
  release_recorded_by uuid references app.user_profiles(id),
  -- P16: deceased content is permitted for M-02/M-40 and defaults OFF for recognition
  recognition_override_at timestamptz,
  recognition_override_by uuid references app.user_profiles(id),
  created_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  constraint override_needs_author check (
    (recognition_override_at is null) = (recognition_override_by is null)
  )
);
comment on table app.depicted_persons is
  'BIPA/CUBI/Washington scope note: this schema contains NO face template, embedding, '
  'descriptor, bounding box, voiceprint or speaker identifier column, in any plane, by '
  'construction. P20 / NEVER-DO #17. See CI check rls-no-biometric-derivation.';
```

### 4.6 Decks, items, media

```sql
create table app.decks (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references app.patients(id) on delete cascade,
  label       text not null default 'Family',
  created_at  timestamptz not null default now(),
  unique (patient_id, label)
);

create table app.media_objects (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references app.patients(id) on delete cascade,
  kind            app.media_kind not null,
  sha256          bytea not null check (octet_length(sha256) = 32),
  mime            text not null,
  bytes           bigint not null check (bytes > 0 and bytes <= 52428800),
  storage_path    text not null unique,          -- patient/<patient_id>/<hex sha256>
  state           app.media_state not null default 'uploading',
  captured_by     uuid references app.user_profiles(id),
  depicts_third_party_face  boolean not null default false,
  depicts_third_party_voice boolean not null default false,
  created_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (patient_id, sha256),
  -- ADR §8: the webm/opus trap, enforced in the schema and not only in the edge function
  constraint audio_container_is_mp4 check (
    kind not in ('voice_caption','narration_recording')
    or mime in ('audio/mp4','audio/m4a','audio/aac')
  ),
  constraint photo_mime check (kind <> 'photo' or mime in ('image/jpeg','image/png','image/heic'))
);
create index on app.media_objects (patient_id) where deleted_at is null;

create table app.items (
  id                  uuid primary key default gen_random_uuid(),
  deck_id             uuid references app.decks(id) on delete cascade,   -- null for shipped generic library
  patient_id          uuid references app.patients(id) on delete cascade,
  kind                app.item_kind not null,
  depicted_person_id  uuid references app.depicted_persons(id) on delete cascade,
  headline_name       text,                       -- the answer. e.g. 'Margaret'
  one_sentence        text,                       -- P12/M-27. read by TTS. never AI-generated (P19).
  era_decade          smallint check (era_decade between 1900 and 2030 and era_decade % 10 = 0),
  content_language    text not null default 'en',
  tier                smallint not null default 2 check (tier in (1,2,3)),
  is_probe            boolean not null default false,
  content_is_generic  boolean not null default false,
  content_provenance  text not null default 'family_upload'
                      check (content_provenance in ('family_upload','generic_library','physical_scan')),
  caregiver_rated_valence     smallint check (caregiver_rated_valence between -2 and 2),
  caregiver_rated_importance  smallint check (caregiver_rated_importance between 1 and 5),
  recognition_enabled boolean not null default true,
  -- P3 / ND-8: retirement is human-only. app.retired_by has no 'algorithm' variant.
  retired_at          timestamptz,
  retired_by_role     app.retired_by,
  retired_by_user     uuid references app.user_profiles(id),
  retirement_reason   text,
  -- scheduler requirement 14 / P18: distress is absorbing until a human re-enables
  absorbing_since     timestamptz,
  absorbing_cleared_by uuid references app.user_profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint retirement_is_human check (
    (retired_at is null) = (retired_by_role is null)
  ),
  -- §5.2 point 4 / product shape step 6: no family face is EVER in the probe
  constraint probe_is_never_personal check (
    not is_probe or (depicted_person_id is null and content_is_generic and patient_id is null)
  ),
  constraint personal_item_has_owner check (
    content_is_generic or patient_id is not null
  )
);
create index on app.items (patient_id) where retired_at is null;
create index on app.items (deck_id);

create table app.item_media (
  item_id   uuid not null references app.items(id) on delete cascade,
  media_id  uuid not null references app.media_objects(id) on delete cascade,
  role      text not null check (role in ('primary_photo','foil_photo','voice_caption','audio_clip')),
  ord       smallint not null default 0,
  primary key (item_id, media_id, role)
);
```

#### The S4 gate, enforced in the database

Success criterion S4 requires **zero** instances of a deceased person surfaced in a recognition mechanic without an explicit caregiver decision. Client-side enforcement of a "zero instances" criterion is a hope. This is a trigger, and the same predicate is repeated in the device view so a compromised client cannot route around it:

```sql
create or replace function app.enforce_recognition_gate() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st app.person_status; ovr timestamptz;
begin
  if new.depicted_person_id is null or not new.recognition_enabled then return new; end if;
  select dp.person_status, dp.recognition_override_at into st, ovr
    from app.depicted_persons dp where dp.id = new.depicted_person_id;
  if st = 'do_not_show' then
    raise exception 'item % references a do_not_show person', new.id using errcode = '23514';
  end if;
  if st in ('deceased','estranged') and ovr is null then
    new.recognition_enabled := false;      -- silently defaults OFF, per P16. Not an error to the caregiver.
  end if;
  return new;
end $$;

create trigger items_recognition_gate before insert or update on app.items
  for each row execute function app.enforce_recognition_gate();

-- and the reverse direction: flipping a person to deceased must retract recognition everywhere
create or replace function app.retract_recognition_on_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.person_status is distinct from old.person_status
     and new.person_status in ('deceased','estranged','do_not_show')
     and new.recognition_override_at is null then
    update app.items set recognition_enabled = false
      where depicted_person_id = new.id and recognition_enabled;
  end if;
  if new.person_status = 'do_not_show' then
    insert into app.revocations (patient_id, scope, item_id, reason)
      select new.patient_id, 'item', i.id, 'person_marked_do_not_show'
        from app.items i where i.depicted_person_id = new.id;
  end if;
  return new;
end $$;

create trigger depicted_persons_status_change after update on app.depicted_persons
  for each row execute function app.retract_recognition_on_status_change();
```

`do_not_show` therefore *propagates to the tablet* rather than merely hiding a row in Postgres, which is the failure the ADR §8 named as "the worst bug in this product".

### 4.7 Sessions, arm assignment, adverse events, revocations

```sql
-- Header only. Every derived field (duration, ended_on_success, end reason) comes from
-- the event log, because the device has INSERT and no UPDATE and therefore CANNOT
-- write an outcome. This constraint is a gift: session outcomes are unforgeable.
create table app.sessions (
  id               uuid primary key,                  -- client UUIDv7
  patient_id       uuid not null references app.patients(id) on delete cascade,
  device_id        uuid not null references app.devices(id)  on delete restrict,
  boot_id          uuid not null,
  started_wall_ms  bigint not null,
  client_version   text not null,
  created_at       timestamptz not null default now()
);
create index on app.sessions (patient_id, created_at);

create table app.arm_assignments (
  patient_id     uuid not null references app.patients(id) on delete cascade,
  factor         text not null check (factor in ('m3_probe_format')),  -- per-participant, frozen (§8.5)
  arm            text not null,
  allocation_seq bigint not null,
  allocation_method text not null default 'permuted_block_4',
  assigned_at    timestamptz not null default now(),
  primary key (patient_id, factor)
);
-- M2 (personal vs generic photo) and prime_condition are WITHIN-participant, randomised
-- per session, and live in the event payload of session.started. They are not rows here
-- because they are not frozen and a table would imply they were.

create table app.adverse_events (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references app.patients(id) on delete cascade,
  occurred_at       timestamptz not null,
  severity          app.adverse_severity not null,
  category          app.adverse_category not null,
  related_item_id   uuid references app.items(id) on delete set null,
  narrative         text,                          -- FREE TEXT. operational plane only. never projected.
  narrative_coded   text,                          -- the coded value that IS projected
  action_taken      text,
  reported_by       uuid references app.user_profiles(id),
  reported_by_role  text not null check (reported_by_role in ('caregiver','clinician','study_staff','patient')),
  probe_disabled_as_result boolean not null default false,
  reviewed_by       uuid references app.user_profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- what a device must delete locally on next sync. ADR §8.
create table app.revocations (
  id          bigint generated always as identity primary key,
  patient_id  uuid not null references app.patients(id) on delete cascade,
  scope       text not null check (scope in ('media','item','patient','device_wipe')),
  media_sha256 bytea check (octet_length(media_sha256) = 32),
  item_id     uuid,
  reason      text not null,
  created_at  timestamptz not null default now(),
  constraint scope_payload check (
    (scope = 'media'  and media_sha256 is not null) or
    (scope = 'item'   and item_id is not null) or
    (scope in ('patient','device_wipe'))
  )
);
create index on app.revocations (patient_id, id);
```

Note what `app.revocations` does *not* contain: no name, no path, no mime, no thumbnail. The purge list is a list of hashes. A tablet that is stolen and whose network is intercepted leaks a set of 32-byte digests.

---

## 5. THE EVENT MODEL

### 5.1 The table

```sql
create table app.events (
  event_id           uuid    primary key,                 -- client-generated UUIDv7
  patient_id         uuid    not null references app.patients(id) on delete cascade,
  device_id          uuid    not null references app.devices(id)  on delete cascade,
  session_id         uuid    not null,
  boot_id            uuid    not null,
  seq                bigint  not null check (seq >= 0),
  type               app.event_type not null,
  payload            jsonb   not null default '{}'::jsonb,
  t_mono_ms          bigint  not null check (t_mono_ms >= 0),   -- authoritative within a boot
  t_wall_ms          bigint  not null,                          -- audit only. never projected. may be wrong.
  client_sent_mono_ms bigint not null,                          -- t_mono at the moment of send
  client_version     text    not null,

  -- server-stamped, trigger-set, NOT insertable by any client (see column grants, §9.2)
  server_received_at timestamptz not null default now(),
  server_anchored_ms bigint,
  ingest_seq         bigint generated always as identity,

  unique (device_id, boot_id, seq)          -- gap detection, ADR §4.3 property 4
);

create index events_replay      on app.events (patient_id, server_anchored_ms, device_id, seq, event_id);
create index events_ingest      on app.events (patient_id, ingest_seq);
create index events_type_partial on app.events (patient_id, type) where type in
  ('distress.reported','media.purged','session.ended');
```

### 5.2 Idempotency under retry

Ingest is exactly the ADR's line, and nothing more:

```sql
insert into app.events (event_id, patient_id, device_id, session_id, boot_id, seq, type,
                        payload, t_mono_ms, t_wall_ms, client_sent_mono_ms, client_version)
values (...)
on conflict (event_id) do nothing;
```

At-least-once delivery plus a client-generated primary key equals exactly-once effect. Retries are free and unbounded. Three supporting properties:

- `unique (device_id, boot_id, seq)` catches the pathological case of a client reusing a `seq` with a fresh `event_id` — that is a client bug and it becomes a hard error at ingest rather than a silent duplication in the fold.
- **No `RETURNING`.** PostgREST returns the inserted representation by default and that requires `SELECT`, which the device does not have. The client must send `Prefer: return=minimal` (which is `supabase-js`'s default when `.select()` is not chained). This is a real trap and it is in `policies.ts` as a test.
- **The ACK is per-ID.** The `/sync` Edge Function returns `{accepted: uuid[], rejected: [{event_id, reason}]}` and the device deletes outbox rows only for IDs in `accepted`. A partial batch failure loses nothing (ADR §4.3 property 3).

### 5.3 Append-only, enforced twice

```sql
revoke update, delete, truncate on app.events from public;
-- (no role is granted them either; the trigger is defence in depth against a future migration)

create or replace function app.forbid_event_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE'
     and coalesce(current_setting('app.erasure_context', true), '') = 'on' then
    return old;                                   -- §11 erasure, and only §11 erasure
  end if;
  raise exception 'app.events is append-only (% attempted)', tg_op using errcode = '42501';
end $$;

create trigger events_append_only before update or delete on app.events
  for each row execute function app.forbid_event_mutation();
```

The `app.erasure_context` GUC is set with `set_config('app.erasure_context','on', true)` — transaction-local — inside `app.execute_erasure()`, which is `security definer` and executable only by `service_role`. **Erasure is the only path that can remove an event, it is one function, and it writes an audit row before it deletes anything.**

### 5.4 Clock anchoring — one anchor per boot, computed from the monotonic clock

This is my one deviation from ADR §4.3, which specifies a per-batch skew applied to `t_wall_ms`. Per-batch-on-wall-clock has a defect that matters for the fold: two batches from the *same boot* can receive different skew corrections, which can reorder events relative to their own `seq`. A scheduler that must be replayed deterministically cannot tolerate that.

Anchoring per boot on `t_mono_ms` fixes it and is strictly simpler:

```sql
create table app.boot_anchors (
  device_id       uuid not null references app.devices(id) on delete cascade,
  boot_id         uuid not null,
  anchor_server_ms bigint not null,     -- server clock at first receipt from this boot
  anchor_mono_ms   bigint not null,     -- client_sent_mono_ms of that same first batch
  created_at      timestamptz not null default now(),
  primary key (device_id, boot_id)
);

create or replace function app.stamp_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a_srv bigint; a_mono bigint;
begin
  insert into app.boot_anchors (device_id, boot_id, anchor_server_ms, anchor_mono_ms)
  values (new.device_id, new.boot_id,
          (extract(epoch from clock_timestamp()) * 1000)::bigint,
          new.client_sent_mono_ms)
  on conflict (device_id, boot_id) do nothing;

  select anchor_server_ms, anchor_mono_ms into a_srv, a_mono
    from app.boot_anchors where device_id = new.device_id and boot_id = new.boot_id;

  new.server_received_at  := now();
  new.server_anchored_ms  := a_srv + (new.t_mono_ms - a_mono);
  return new;
end $$;

create trigger events_stamp before insert on app.events
  for each row execute function app.stamp_event();
```

Properties this buys, all testable:

| Property | Why |
|---|---|
| Within a `(device_id, boot_id)`, `server_anchored_ms` is **strictly monotone in `seq`** | It is an affine function of `t_mono_ms`, which the client guarantees monotone within a boot |
| The device's wall clock is **never load-bearing** | `t_wall_ms` is stored for audit and is never read by the fold and never projected |
| A tablet three days offline lands its events **in the correct relative past** | The anchor is taken at send time; earlier events resolve to `anchor − (elapsed mono)` |
| The device cannot forge its position in the ordering | `server_anchored_ms`, `server_received_at` and `ingest_seq` are trigger-set and not in the device's column grant (§9.2) |

Honest limit: two tablets running offline sessions for the same patient simultaneously are ordered against each other only as well as their two independent anchors allow, which is as well as the problem admits. The fold is still deterministic over the union.

### 5.5 The canonical replay order

```sql
create view app.event_stream as
select e.*,
       row_number() over (partition by e.patient_id
                          order by e.server_anchored_ms, e.device_id, e.seq, e.event_id) as event_seq
from app.events e
order by e.patient_id, e.server_anchored_ms, e.device_id, e.seq, e.event_id;
```

The order key is `(server_anchored_ms, device_id, seq, event_id)` — total, deterministic, and stable, since `event_id` is a UUID primary key and cannot tie. This maps exactly onto the `(atMs, eventSeq)` pair the scheduler fold requires: `atMs := server_anchored_ms`, `eventSeq := event_seq`.

### 5.6 Determinism, and the honest caveat about late arrival

Two properties any scheduler proposal must satisfy for this to work, stated so Board 5 can be held to them:

1. `reduce` is **total** — a `trial.completed` with no open session returns state unchanged rather than throwing. A fold that throws cannot be replayed on a server.
2. `reduce` uses **no wall clock and no randomness** — time enters only through `event.atMs`.

Given those, `replay(events) → state` is a pure function of the event *set*.

**The caveat, stated because it would otherwise be discovered in production:** replay is deterministic given a set, but it is **not monotone under late arrival**. A second tablet that has been offline for three days lands events whose `server_anchored_ms` interleaves *behind* events already folded. Canonical state therefore changes retroactively. This is correct behaviour — the union is the truth — but it means:

```sql
create table app.scheduler_snapshots (
  patient_id        uuid primary key references app.patients(id) on delete cascade,
  state             jsonb  not null,
  scheduler_version text   not null,
  folded_through_ingest_seq bigint not null,
  folded_event_count integer not null,
  computed_at       timestamptz not null default now()
);
```

is a **cache and nothing else**. It is granted to no role. Any ingest whose `server_anchored_ms` falls before `max(server_anchored_ms)` already folded invalidates it, and the fold restarts from zero. At ~1500 events/patient/day that costs milliseconds. Never make the snapshot authoritative, never let a client read it, and never repair it incrementally.

### 5.7 Gap detection (ADR §4.3 property 4)

```sql
create view app.event_seq_gaps as
select device_id, boot_id, prev_seq + 1 as gap_from, seq - 1 as gap_to
from (select device_id, boot_id, seq,
             lag(seq) over (partition by device_id, boot_id order by seq) as prev_seq
      from app.events) s
where prev_seq is not null and seq <> prev_seq + 1;
```

This is what lets a researcher distinguish "she did not respond" from "we lost the event", which is the difference between a data point and a missing value. It is projected to the research plane as a per-session `events_lost_estimate`, because a research plane that hides its own holes is worse than useless.

---

## 6. THE BRIDGE — `link`, and the one-way projector

### 6.1 `link`

```sql
create schema link authorization plane_bridge;
revoke all on schema link from public;
-- and nothing else. no grant statement for link appears anywhere else in the migrations.

create table link.participant_map (
  participant_pseudonym text primary key
      check (participant_pseudonym ~ '^P-[0-9A-HJ-NP-Z]{8}$'),   -- Crockford-ish, no vowels
  patient_id            uuid not null unique references app.patients(id) on delete restrict,
  study_id              uuid not null,
  enrolled_on_local     date not null,                 -- day 0. THE date that never crosses.
  timezone              text not null,
  created_at            timestamptz not null default now(),
  severed_at            timestamptz                    -- §11.5: erasure severs, it does not delete
);

create table link.site_map (
  site_code    text primary key check (site_code ~ '^S-[0-9]{3}$'),
  care_home_id uuid unique references app.care_homes(id) on delete restrict,
  created_at   timestamptz not null default now()
);

create table link.response_pepper (
  study_id uuid primary key,
  pepper   bytea not null                              -- §7.4. never leaves this schema.
);

create table link.break_glass (
  id            uuid primary key default gen_random_uuid(),
  participant_pseudonym text not null,
  requested_by  uuid not null,
  countersigned_by uuid not null,
  reason        text not null,
  safety_criterion text not null check (safety_criterion in ('S1','S2','S6','S7','regulatory')),
  resolved_at   timestamptz not null default now(),
  constraint two_person check (requested_by <> countersigned_by)
);
```

`participant_map.patient_id` is `on delete restrict`, not `cascade`. A patient row cannot be deleted while a live mapping exists; the erasure orchestrator must sever the mapping first, deliberately, in its own step. That is the difference between "we deleted them" and "we deleted them and also silently destroyed a REC-approved dataset".

### 6.2 The projector

```sql
create or replace function link.project(p_through_ingest_seq bigint)
returns table (rows_projected bigint, participants_touched int)
language plpgsql
security definer                 -- runs as plane_bridge: SELECT on app, owner of link + research
set search_path = ''
as $$
declare n bigint := 0;
begin
  -- 1. participants: only those with a live, unsevered mapping, live consent, and
  --    a capacity review that is not overdue. Consent is checked HERE, not in a view.
  insert into research.participant as rp (participant_pseudonym, study_id, site_code, ...)
  select m.participant_pseudonym, m.study_id, s.site_code,
         app.age_band(p.date_of_birth, m.enrolled_on_local),
         p.dementia_subtype, p.severity_band, p.fluctuation_band, p.first_language, ...
  from link.participant_map m
  join app.patients p on p.id = m.patient_id
  left join link.site_map s on s.care_home_id = p.care_home_id
  where m.severed_at is null
    and app.consent_permits(p.id, 'research_behavioural')
    and app.capacity_review_current(p.id)
  on conflict (participant_pseudonym) do update set ... ;

  -- 2. interactions: the allow-list. Every column below has a row in
  --    app.research_field_manifest or the assertion at the end of this function fails.
  insert into research.interaction (
      interaction_id, participant_pseudonym, session_pseudonym, day_offset_from_enrollment,
      local_hour, time_of_day_bucket, item_ref, item_is_probe, item_tier, content_class,
      relationship_category, era_decade, person_status, content_is_generic, content_language,
      content_provenance, caregiver_rated_valence, caregiver_rated_importance, media_type,
      cue_modality, presentation_mode, opening_cue_level, hint_level_reached, n_hints,
      attained_rung, within_session_rung, repetition_number, days_since_last_review,
      days_since_first_introduction, scheduled_interval_ms, interval_deviation_ms,
      correct, grade, error_type, rescued_to_success, latency_to_first_input_ms,
      total_response_time_ms, decision_time_ms, app_backgrounded_ms, n_backgrounds, interrupted,
      n_taps, off_target_tap_offset_px, administered_by, distress_signal, distress_signal_source,
      app_version, scheduler_algorithm_version, patient_ui_version, device_class, os_version,
      screen_css_px, device_pixel_ratio, input_modality)
  select
      link.pseudo_id(e.event_id, m.study_id),
      m.participant_pseudonym,
      link.pseudo_id(e.session_id, m.study_id),
      ((timezone(m.timezone, to_timestamp(e.server_anchored_ms/1000.0)))::date
         - m.enrolled_on_local)::int,
      extract(hour from timezone(m.timezone, to_timestamp(e.server_anchored_ms/1000.0)))::smallint,
      app.tod_bucket(...),
      link.pseudo_id(i.id, m.study_id),          -- item identity is pseudonymous too
      i.is_probe, i.tier, app.content_class(i), dp.relationship, i.era_decade,
      dp.person_status, i.content_is_generic, i.content_language, i.content_provenance,
      i.caregiver_rated_valence, i.caregiver_rated_importance, app.media_type_of(i),
      e.payload->>'cue_modality', e.payload->>'presentation_mode',
      (e.payload->>'opening_cue_level')::smallint, ...
  from app.events e
  join link.participant_map m on m.patient_id = e.patient_id and m.severed_at is null
  left join app.items i           on i.id = (e.payload->>'item_id')::uuid
  left join app.depicted_persons dp on dp.id = i.depicted_person_id
  where e.type = 'trial.completed'
    and e.ingest_seq <= p_through_ingest_seq
    and e.ingest_seq >  coalesce(link.watermark(m.participant_pseudonym, 'interaction'), 0)
    and app.consent_permits(e.patient_id, 'research_behavioural')
    and app.consent_covers_instant(e.patient_id, 'research_behavioural', e.server_anchored_ms)
  on conflict (interaction_id) do nothing;      -- idempotent, same reason as ingest

  -- 3..7. session, adverse_event, consent_event, clinician_assessment, medication_and_comorbidity
  --       identical shape, all allow-listed, all consent-gated, all watermarked.

  perform link.assert_manifest_complete();      -- §6.4
  perform audit.log_projection(p_through_ingest_seq, n);
  return query select n, count(*)::int from link.participant_map where severed_at is null;
end $$;

revoke execute on function link.project(bigint) from public;
grant   execute on function link.project(bigint) to service_role;
```

Three things to notice.

- **`security definer` + `set search_path = ''`.** Without the pinned empty search path this function is a privilege-escalation primitive. With it, every object is schema-qualified and there is nothing to shadow.
- **`revoke execute ... from public`.** The projector is not reachable by any human role. It runs from a `pg_cron` job (every 15 minutes) or from an Edge Function under `service_role`.
- **The direction is enforced by grants, not by discipline.** `plane_bridge` has `SELECT` on `app` and nothing else. It physically cannot write back. There is no code path from research to operational, because the role that spans the boundary is read-only on one side.

```sql
grant usage on schema app to plane_bridge;
grant select on all tables in schema app to plane_bridge;
alter default privileges in schema app grant select on tables to plane_bridge;
-- note the absence of insert, update, delete. This is the "one-way" in "one-way bridge".
```

### 6.3 Pseudonym derivation

```sql
create or replace function link.pseudo_id(p_uuid uuid, p_study uuid) returns text
language sql stable security definer set search_path = '' as $$
  select encode(hmac(p_uuid::text, (select pepper from link.response_pepper where study_id = p_study),
                     'sha256'), 'hex')
$$;
```

Keyed, not plain. A plain `sha256(uuid)` is reversible by anyone holding the operational plane's UUID list — which is everyone with a database dump. The pepper lives in `link`, so a research-plane dump is not invertible even by someone who also holds `app`. This is the single cheapest hardening in the design and the one most commonly skipped.

### 6.4 The field manifest — §8.4's data-minimisation rule as a table

Synthesis §8.4 rule 1: *"Every §7 field carries a named pre-registered analysis in the protocol, or it does not ship."* That is a governance rule that will be obeyed for six weeks and then quietly stop being obeyed. Make it a constraint:

```sql
create table app.research_field_manifest (
  research_table    text not null,
  research_column   text not null,
  source_expression text not null,
  preregistered_analysis text not null,
  protocol_section  text not null,
  approved_by       text not null,
  approved_on       date not null,
  removed_on        date,
  primary key (research_table, research_column)
);

create or replace function link.assert_manifest_complete() returns void
language plpgsql security definer set search_path = '' as $$
declare orphan text;
begin
  select string_agg(c.table_name || '.' || c.column_name, ', ') into orphan
  from information_schema.columns c
  left join app.research_field_manifest m
    on m.research_table = c.table_name and m.research_column = c.column_name
       and m.removed_on is null
  where c.table_schema = 'research'
    and c.column_name not in ('participant_pseudonym','study_id')
    and m.research_column is null;
  if orphan is not null then
    raise exception 'research columns with no pre-registered analysis: %', orphan;
  end if;
end $$;
```

A migration that adds a column to the research plane without a manifest row **breaks the projector on its next run and the CI test immediately**. GDPR purpose limitation becomes a failing test rather than a paragraph.

---

## 7. THE RESEARCH PLANE

### 7.1 What is structurally absent

Before the DDL, the negative space, because it is the point:

- **No `patient_id`.** Not nullable, not filtered — the column does not exist in any table in `research`.
- **No `care_home_id`** — only `site_code`, mapped in `link`.
- **No date, timestamp, timestamptz or interval column** anywhere. Only `day_offset_from_enrollment int`, `local_hour smallint`, `time_of_day_bucket text`. A `create table` in `research` using a temporal type fails a pgTAP test by name.
- **No name, no free text, no transcript, no narrative, no `headline_name`, no `one_sentence`.**
- **No `sha256`, no `storage_path`, no media reference of any kind.** `media_type` is an enum-shaped label, not a pointer.
- **No `device_id`** — device is projected as `device_class` and `os_version` only.
- **No foreign key to any object outside the `research` schema.** `pg_constraint` proves it.

### 7.2 DDL

```sql
create schema research authorization plane_bridge;

create table research.study (
  study_id      uuid primary key,
  label         text not null,
  protocol_ref  text not null,
  rec_approval_ref text not null,
  opened_on_day int not null default 0
);

create table research.participant (
  participant_pseudonym text primary key,
  study_id              uuid not null references research.study(study_id),
  site_code             text,
  m3_arm                text,                       -- probe format arm, frozen at enrolment
  dementia_subtype      text not null,
  severity_band         text,
  fluctuation_band      text not null,
  age_band              text not null,              -- '65-69' etc. never a DOB, never an age.
  years_education_band  text,
  first_language        text,
  country_locale        text,
  prior_computer_use    text,
  apathy_score          smallint,
  hearing_aid_use       boolean,
  corrected_vision      boolean,
  capacity_status       text not null,
  consent_pathway       text not null,
  enrolment_day         int not null default 0,
  withdrawn_on_day      int,
  patient_ui_version    text
);

create table research.session (
  session_pseudonym     text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  day_offset_from_enrollment int not null,
  session_ordinal_today smallint not null,
  local_hour            smallint check (local_hour between 0 and 23),
  time_of_day_bucket    text not null,
  session_mode          text not null,              -- normal | nothing_today (M-135)
  prime_condition       text,                       -- song before/after the Camp block
  duration_ms           int,
  planned_n_items       smallint,
  completed_n_items     smallint,
  session_end_reason    text not null,              -- completed|user_ended|distress_stop|timeout|app_crash|device_failure
  ended_on_success      boolean,                    -- S3
  generic_opener_played boolean,
  generic_closer_played boolean,
  caregiver_present     boolean,
  caregiver_present_source text,
  mood_checkin          smallint,
  fatigue_checkin       smallint,
  enjoyability_rating   smallint,
  mean_rt_ms            int, median_rt_ms int, isd_residual_rt_ms int, cv_rt numeric(6,4),
  accuracy_ppt          smallint, n_lapses smallint,
  network_state         text,
  events_lost_estimate  int not null default 0,     -- §5.7. the plane declares its own holes.
  device_class          text, os_version text
);
create index on research.session (participant_pseudonym, day_offset_from_enrollment);

create table research.interaction (
  interaction_id        text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  session_pseudonym     text not null references research.session on delete cascade,
  day_offset_from_enrollment int not null,
  local_hour            smallint, time_of_day_bucket text,
  administered_by       text not null,               -- self | caregiver_assisted | caregiver_proxy

  item_ref              text not null,               -- HMAC'd item id. stable within participant.
  item_is_probe         boolean not null,
  item_tier             smallint,
  content_class         text, relationship_category text, era_decade smallint,
  person_status         text, content_is_generic boolean, content_language text,
  content_provenance    text, media_type text, n_media_assets smallint,
  caregiver_rated_emotional_valence smallint, caregiver_rated_importance smallint,

  repetition_number     int, lapse_count int, days_since_last_review int,
  days_since_first_introduction int, scheduled_interval_ms bigint, interval_deviation_ms bigint,
  within_session_rung   smallint, attained_rung smallint, drift_adjustment_applied smallint,
  stability numeric, difficulty numeric, retrievability numeric,
  predicted_recall_probability numeric,              -- null under a ladder scheduler; documented as such

  latency_to_first_input_ms int, total_response_time_ms int, decision_time_ms int,
  app_backgrounded_ms int, n_backgrounds smallint, interrupted boolean not null default false,

  n_answer_changes smallint, n_taps smallint, mean_tap_hold_ms int, sd_tap_hold_ms int,
  dwell_before_first_touch_ms int, pointer_path_length_px int, n_direction_reversals smallint,
  off_target_tap_offset_px int,

  correct boolean, grade smallint, error_type text,
  response_token_class   text,                       -- CODED. see §7.4.
  response_hmac          text,                       -- NULL unless a manifest row authorises it.

  hint_level_reached smallint, n_hints smallint, time_to_first_hint_ms int,
  presentation_mode text, opening_cue_level smallint, n_distractors smallint,
  assistance_dependency_index numeric(5,4), rescued_to_success boolean,

  utterance_duration_ms int, speech_rate_wpm numeric(6,2), articulation_rate numeric(6,2),
  n_pauses smallint, mean_pause_ms int, max_pause_ms int, n_filled_pauses smallint,
  voiced_ratio numeric(5,4), type_token_ratio numeric(5,4),
  asr_confidence numeric(5,4), asr_language text,    -- METADATA ONLY. P27 / ND-26.

  distress_signal text, distress_signal_source text,
  difficulty_floor_triggered boolean, item_absorbing_state_entered boolean,
  item_retired_by text, retirement_reason text,

  app_version text, scheduler_algorithm_version text, content_set_version text,
  scoring_rubric_version text, patient_ui_version text,
  device_class text, os_version text, screen_css_px text,
  device_pixel_ratio numeric(4,2), display_refresh_hz smallint, input_modality text,

  constraint item_retired_by_is_never_algorithm check (item_retired_by is distinct from 'algorithm'),
  constraint probe_has_no_relationship check (not item_is_probe or relationship_category is null)
);
create index on research.interaction (participant_pseudonym, day_offset_from_enrollment);
create index on research.interaction (item_ref);

create table research.adverse_event (
  adverse_event_id      text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  day_offset_from_enrollment int not null,
  severity              text not null,
  category              text not null,
  related_item_class    text,                       -- CLASS. never the item, never the person.
  narrative_coded       text,                       -- coded value only. free text stays operational.
  action_taken          text,
  reported_by_role      text not null,
  probe_disabled_as_result boolean not null default false
);

create table research.consent_event (
  consent_event_id      text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  day_offset_from_enrollment int not null,
  event_type            text not null,
  pathway               text not null,
  purpose               text not null,
  outcome               text not null,
  recorded_by_role      text not null
);

create table research.clinician_assessment (
  assessment_id         text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  day_offset_from_enrollment int not null,
  instrument            text not null, instrument_version text,
  total_score           numeric, subscale_scores jsonb,
  administered_by_role  text, administration_setting text,
  nacc_uds_form_equivalent text
);

create table research.medication_and_comorbidity (
  record_id             text primary key,
  participant_pseudonym text not null references research.participant on delete cascade,
  day_offset_from_enrollment int not null,
  anticholinergic_burden_score smallint,
  benzodiazepine boolean, antipsychotic boolean, sedative boolean,
  cholinesterase_inhibitor boolean, memantine boolean,
  anti_amyloid_therapy text,
  recent_infection boolean, recent_hospitalisation boolean,
  pain_reported boolean, constipation_reported boolean, dehydration_flag boolean
);

create table research.derived_variable (
  participant_pseudonym text not null references research.participant on delete cascade,
  variable_name         text not null,
  computed_at_day       int not null,
  method_version        text not null,
  value                 numeric,
  value_json            jsonb,
  primary key (participant_pseudonym, variable_name, computed_at_day, method_version)
);

create table research.study_access (
  study_id           uuid not null references research.study(study_id),
  researcher_user_id uuid not null,       -- an auth.users id. identifies the RESEARCHER, not a subject.
  granted_on         date not null default current_date,
  expires_on         date,
  primary key (study_id, researcher_user_id)
);
```

### 7.3 `research_api` — the only researcher-reachable objects

```sql
create schema research_api;
grant usage on schema research_api to app_researcher;

create view research_api.participant with (security_invoker = false) as
  select p.* from research.participant p
  join research.study_access sa on sa.study_id = p.study_id
   and sa.researcher_user_id = auth.uid()
   and (sa.expires_on is null or sa.expires_on >= current_date)
  where p.withdrawn_on_day is null or p.withdrawn_on_day is not null;   -- withdrawal handling: §11.5

create view research_api.interaction with (security_invoker = false) as
  select i.* from research.interaction i
  join research_api.participant p using (participant_pseudonym);

-- ...session, adverse_event, consent_event, clinician_assessment,
--    medication_and_comorbidity, derived_variable: identical shape.

grant select on all tables in schema research_api to app_researcher;
alter default privileges in schema research_api grant select on tables to app_researcher;

-- and, explicitly, nothing else:
revoke all on schema research, link, app, device_api from app_researcher;
```

The views are `security_invoker = false` (definer, owned by `plane_bridge`) precisely so that `app_researcher` needs no privilege on `research` base tables. Study scoping is in the view body. That makes the view body security-critical, which is a real cost — it is in `policies.ts` and pgTAP as an explicit expectation, and §13.4 discusses it.

### 7.4 The response-text problem, solved rather than inherited

Synthesis §7 specifies `response_text_hash or coded category`. A plain hash of a spoken name is a catastrophe: the space of first names is ~50,000, so a rainbow table recovers the plaintext in seconds, and the plaintext is *the name of the patient's daughter*.

The design:

1. **Default: `response_token_class` only** — one of `target_exact | target_variant | other_family_member_in_deck | other_person_name | non_name_word | no_response | unintelligible`. This is what `error_type` needs (intrusion vs perseveration vs semantic near-miss) and it is not re-identifying.
2. **`response_hmac` is `NULL` unless a manifest row authorises it**, keyed with `link.response_pepper`. Even then it permits only equality comparison, and *equality across participants is itself a re-identification lever* ("which two participants said the same word"), so the manifest row must name the analysis and the analysis must be within-participant. This is exactly the kind of decision §8.4 rule 1 exists to force, and it is the kind of decision that gets made badly at 6pm on a Friday if there is no table to fill in.
3. **Transcripts are never projected, at any fidelity.** §8.4 rule 2. Speech *features* only. `research.interaction` has no text column that can hold a sentence.

---

## 8. ROW-LEVEL SECURITY

### 8.1 Approach

- RLS is **enabled and forced on every table in `app`**. `force row level security` matters: without it the table owner bypasses RLS, and migrations run as owner.
- Policies are written `to <specific role>`, never `to authenticated` and never `to public`. A policy with no `to` clause applies to `public` and is a common silent hole.
- Every policy that references another table does so through a `security definer` helper, for two reasons: the role does not need `SELECT` on the referenced table (which is how the device gets zero SELECT while policies still reference `device_patients`), and RLS on the referenced table does not recurse.
- Every helper is called as `(select app.fn())` so it becomes an InitPlan evaluated once per query rather than once per row.

### 8.2 Scope helpers

```sql
create or replace function app.device_patient_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select dp.patient_id
  from app.device_patients dp
  join app.devices d on d.id = dp.device_id
  where dp.device_id = app.jwt_device_id()
    and d.revoked_at is null
$$;
revoke execute on function app.device_patient_ids() from public;
grant  execute on function app.device_patient_ids() to app_device;

create or replace function app.caregiver_patient_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select pc.patient_id
  from app.patient_caregivers pc
  where pc.user_id = auth.uid() and pc.removed_at is null
$$;
revoke execute on function app.caregiver_patient_ids() from public;
grant  execute on function app.caregiver_patient_ids() to app_caregiver;

create or replace function app.admin_care_home_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.care_home_id from app.memberships m
  where m.user_id = auth.uid() and m.role = 'carehome_admin' and m.revoked_at is null
$$;
revoke execute on function app.admin_care_home_ids() from public;
grant  execute on function app.admin_care_home_ids() to app_carehome_admin;
```

### 8.3 Policies

```sql
alter table app.patients            enable row level security;
alter table app.patients            force  row level security;
-- ... repeated for every table in app. A pgTAP test asserts relrowsecurity AND relforcerowsecurity
--     are true for every relation in the schema, so a new table cannot ship unprotected.

--------------------------------------------------------------------- patients
create policy caregiver_reads_own_patients on app.patients
for select to app_caregiver
using (id in (select app.caregiver_patient_ids()));

create policy caregiver_updates_own_patients on app.patients
for update to app_caregiver
using      (id in (select app.caregiver_patient_ids()))
with check (id in (select app.caregiver_patient_ids()));

create policy admin_reads_home_patients on app.patients
for select to app_carehome_admin
using (care_home_id in (select app.admin_care_home_ids()));

-- app_device: NO POLICY. No grant either. Both, deliberately. RLS with no policy denies,
-- and the missing grant means the table cannot even be named.

--------------------------------------------------------------------- items / media / decks
create policy caregiver_rw_items on app.items
for all to app_caregiver
using      (patient_id in (select app.caregiver_patient_ids()))
with check (patient_id in (select app.caregiver_patient_ids()));

create policy caregiver_rw_media on app.media_objects
for all to app_caregiver
using      (patient_id in (select app.caregiver_patient_ids()))
with check (patient_id in (select app.caregiver_patient_ids()));

--------------------------------------------------------------------- events (INSERT ONLY)
create policy device_appends_own_events on app.events
for insert to app_device
with check (
      device_id  = (select app.jwt_device_id())
  and patient_id in (select app.device_patient_ids())
  and (select count(*) from app.devices d
        where d.id = (select app.jwt_device_id()) and d.revoked_at is null) = 1
);
-- there is no SELECT, UPDATE or DELETE policy on app.events for app_device.
-- policies.ts row: {role:'device', table:'events', verb:'select', allowedWhen:'never'}

create policy caregiver_no_events on app.events
for select to app_caregiver using (false);
-- explicit false rather than absence: it documents the intent and it is testable positively.
-- The caregiver's "moments" surface reads app.moments_for_caregiver (§8.5), never raw events.

--------------------------------------------------------------------- sessions
create policy device_appends_own_sessions on app.sessions
for insert to app_device
with check (
      device_id  = (select app.jwt_device_id())
  and patient_id in (select app.device_patient_ids())
);

--------------------------------------------------------------------- devices / enrolment
create policy admin_manages_devices on app.devices
for all to app_carehome_admin
using      (care_home_id in (select app.admin_care_home_ids()))
with check (care_home_id in (select app.admin_care_home_ids()));

-- enrolment_codes is service_role only. No policy for any human role: redemption happens
-- inside the redeem-enrolment Edge Function, which is the only place the atomic
-- single-use UPDATE can be performed safely.

--------------------------------------------------------------------- adverse events
create policy caregiver_reports_ae on app.adverse_events
for insert to app_caregiver
with check (patient_id in (select app.caregiver_patient_ids()));

create policy caregiver_reads_own_ae on app.adverse_events
for select to app_caregiver
using (patient_id in (select app.caregiver_patient_ids()));
```

### 8.4 What the caregiver sees, and P5

P5 forbids any aggregate of failure reaching the caregiver. The schema enforces it by giving the caregiver *no readable surface that contains one*:

```sql
create view app.moments_for_caregiver with (security_invoker = true) as
select e.patient_id,
       e.server_anchored_ms,
       e.payload->>'moment_kind' as moment_kind,       -- narration_produced | song_played | ...
       (e.payload->>'utterance_duration_ms')::int as utterance_duration_ms
from app.events e
where e.type = 'trial.completed'
  and (e.payload->>'moment_kind') is not null;
```

There is no `correct`, no `grade`, no accuracy, no count, no trend. `security_invoker = true` here (unlike the device views) because the caregiver *does* have `SELECT` on `app.events`… except they do not — the `caregiver_no_events` policy returns zero rows. So this view is deliberately non-functional as written and must be a definer view with the caregiver scope in its body, exactly like the device views. **Stated as a caught error rather than silently fixed**, because it is the single easiest mistake to make in this design and it will be made again: *a definer view is the only way to expose a shaped projection to a role that has no base-table access, and every definer view is a security boundary that must appear in `policies.ts`.*

### 8.5 `policies.ts` — the rows this design adds

```ts
export const policyExpectations = [
  // device: the entire surface
  { role:'device', table:'device_api.device_content', verb:'select',
    allowedWhen:'patient_id is in device_patients for the token device_id and the device is not revoked',
    zeroRowsWhen:'patient belongs to another device or care home; device revoked; item recognition_enabled=false and mechanic is recognition' },
  { role:'device', table:'device_api.device_roster', verb:'select',
    allowedWhen:'as above', zeroRowsWhen:'as above' },
  { role:'device', table:'app.events',   verb:'insert', allowedWhen:'device_id = token device_id and patient in device_patients' },
  { role:'device', table:'app.sessions', verb:'insert', allowedWhen:'as above' },
  { role:'device', table:'app.events',   verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'device', table:'app.patients', verb:'select', allowedWhen:'never', deniedWhen:'always (no grant: expect 42501, not zero rows)' },
  { role:'device', table:'*',            verb:'update', allowedWhen:'never', deniedWhen:'always' },
  { role:'device', table:'*',            verb:'delete', allowedWhen:'never', deniedWhen:'always' },
  { role:'device', table:'app.events',   verb:'insert-returning', allowedWhen:'never',
    deniedWhen:'always — RETURNING requires SELECT; client must send Prefer: return=minimal' },
  { role:'device', table:'app.events',   verb:'insert-duplicate-event_id', allowedWhen:'always',
    note:'second insert of the same event_id is a no-op, not an error (on conflict do nothing)' },
  { role:'device', table:'app.events',   verb:'insert-forged-server_anchored_ms', allowedWhen:'never',
    deniedWhen:'always — column not in the device grant list' },

  // researcher: the negative space IS the design
  { role:'researcher', schema:'app',      verb:'usage',  allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', schema:'link',     verb:'usage',  allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', schema:'research', verb:'usage',  allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', table:'app.patients',            verb:'select', allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', table:'app.media_objects',       verb:'select', allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', table:'link.participant_map',    verb:'select', allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', table:'research.interaction',    verb:'select', allowedWhen:'never', deniedWhen:'always',
    note:'base table. the researcher reaches interaction only via research_api.' },
  { role:'researcher', func:'link.project',             verb:'execute', allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', func:'link.pseudo_id',           verb:'execute', allowedWhen:'never', deniedWhen:'always' },
  { role:'researcher', table:'research_api.interaction', verb:'select',
    allowedWhen:'participant is in a study the researcher has unexpired study_access to',
    zeroRowsWhen:'another study; access expired; participant severed' },

  // caregiver
  { role:'caregiver', table:'app.events',            verb:'select', allowedWhen:'never', zeroRowsWhen:'always' },
  { role:'caregiver', table:'app.items',             verb:'update', allowedWhen:'patient is in patient_caregivers with removed_at null' },
  { role:'caregiver', table:'app.consent_events',    verb:'insert',
    allowedWhen:'pathway is consultee or supported', deniedWhen:'pathway is direct (CHECK: only the subject consents)' },
  { role:'caregiver', table:'app.depicted_persons',  verb:'insert',
    deniedWhen:'person_status omitted (NOT NULL, no default — P16 is a column constraint)' },
  { role:'caregiver', table:'app.patients',          verb:'select',
    allowedWhen:'patient is in patient_caregivers', zeroRowsWhen:'any other patient, including in the same care home' },

  // admin
  { role:'carehome_admin', table:'app.devices',      verb:'update', allowedWhen:'device.care_home_id in admin memberships' },
  { role:'carehome_admin', table:'app.items',        verb:'select', allowedWhen:'never', zeroRowsWhen:'always',
    note:'an admin manages tablets, not a resident\'s family photographs' },

  // the claim that holds the whole scheme up (ADR §5.2)
  { role:'device', table:'auth.users', verb:'update-app_metadata', allowedWhen:'never', deniedWhen:'always' },
  { role:'caregiver', table:'auth.users', verb:'update-app_metadata', allowedWhen:'never', deniedWhen:'always' },
] as const;
```

---

## 9. THE DEVICE SURFACE

### 9.1 The two views

```sql
create schema device_api;
grant usage on schema device_api to app_device;

-- definer views (security_invoker = false). The scope predicate is IN THE VIEW BODY,
-- because the device has no SELECT on any base table and therefore invoker semantics
-- would deny everything.
create view device_api.device_content as
select
  i.id                              as item_id,
  i.patient_id,
  i.kind,
  i.tier,
  i.is_probe,
  i.content_is_generic,
  i.content_language,
  i.era_decade,
  i.headline_name,
  i.one_sentence,
  -- S4 enforced a second time, at the only boundary the tablet can actually see
  (i.recognition_enabled
     and coalesce(dp.person_status, 'living') not in ('deceased','estranged','do_not_show'))
   or dp.recognition_override_at is not null                     as recognition_allowed,
  coalesce(dp.person_status::text, 'living')                     as person_status,
  dp.relationship,
  m.sha256, m.mime, m.bytes, im.role as media_role, im.ord
from app.items i
join app.device_patients dpat on dpat.patient_id = i.patient_id
join app.devices d            on d.id = dpat.device_id
left join app.depicted_persons dp on dp.id = i.depicted_person_id
left join app.item_media im   on im.item_id = i.id
left join app.media_objects m on m.id = im.media_id and m.state = 'ready' and m.deleted_at is null
where dpat.device_id = app.jwt_device_id()
  and d.revoked_at is null
  and i.retired_at is null
  and i.absorbing_since is null                                   -- P18: absorbing items do not ship
  and coalesce(dp.person_status, 'living') <> 'do_not_show'
  and app.consent_permits(i.patient_id, 'care_delivery');

create view device_api.device_roster as
select p.id as patient_id, p.preferred_name as display_first_name,
       m.sha256 as avatar_sha256
from app.patients p
join app.device_patients dpat on dpat.patient_id = p.id
join app.devices d            on d.id = dpat.device_id
left join app.media_objects m on m.id = p.avatar_media_id
where dpat.device_id = app.jwt_device_id()
  and d.revoked_at is null
  and p.deleted_at is null
  and p.processing_paused_at is null;                             -- dissent stops the tablet, §10.5

alter view device_api.device_content owner to plane_bridge;   -- not the app owner; least privilege
alter view device_api.device_roster  owner to plane_bridge;
grant select on device_api.device_content, device_api.device_roster to app_device;
```

`device_roster` is `patient_id`, first name, avatar hash. Exactly what ADR §5.3 says a thief gets: *"N people live somewhere, not who, where, or with what condition."*

### 9.2 Column-level INSERT grants — the sharpest tool in the box

```sql
grant usage on schema app to app_device;

grant insert (event_id, patient_id, device_id, session_id, boot_id, seq, type,
              payload, t_mono_ms, t_wall_ms, client_sent_mono_ms, client_version)
  on app.events to app_device;

grant insert (id, patient_id, device_id, boot_id, started_wall_ms, client_version)
  on app.sessions to app_device;

grant execute on function app.device_patient_ids() to app_device;
-- and nothing else, anywhere, in any schema.
```

The device cannot write `server_anchored_ms`, `server_received_at` or `ingest_seq` because those columns are not in the grant. A malicious tablet cannot place itself at an arbitrary point in the replay order. That is a one-line defence against the only interesting attack a stolen tablet has left, and it costs nothing.

### 9.3 What the device gets for erasure, without a new grant

The purge receipt is an ordinary telemetry event:

```
type: 'media.purged'
payload: { "sha256": "<hex>", "revocation_id": 41871, "local_file_existed": true }
```

No new table, no new grant, and it arrives through the same at-least-once, idempotent, never-lost outbox as everything else. §11.4 uses it to close the erasure loop.

---

## 10. CONSENT

### 10.1 The four properties that make this different from a checkbox

1. **The person enrolling is not the data subject.** MCA 2005 ss.30–33: a personal consultee *advises*; they cannot authorise. So the schema must make "the caregiver said yes on her behalf" **structurally unable to be recorded as consent**.
2. **Capacity fluctuates.** So consent has a review date, and an overdue review is a *processing state*, not a reminder.
3. **Assent may be withdrawn behaviourally.** So dissent is a first-class observation with an automatic effect, not a form somebody fills in later.
4. **Purposes are separable.** Care delivery, behavioural research, speech features and media retention are four different decisions with four different revocation paths.

### 10.2 The log is the truth; state is a materialisation

```sql
create table app.consent_events (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references app.patients(id) on delete cascade,
  event_type      app.consent_event_type not null,
  pathway         app.consent_pathway not null,
  purpose         app.consent_purpose not null,
  outcome         app.consent_outcome not null,
  effective_from  timestamptz not null default now(),
  withdrawal_scope app.withdrawal_scope,
  recorded_by     uuid references app.user_profiles(id),
  recorded_by_role text not null check (recorded_by_role in
                     ('patient','caregiver','consultee','clinician','study_staff')),
  evidence_ref    text,
  notes           text,                              -- operational plane only, never projected
  created_at      timestamptz not null default now(),

  -- THE constraint. MCA ss.30-33 as a CHECK.
  constraint only_the_subject_consents check (
    (pathway = 'direct'   and outcome in ('subject_consented','subject_declined','subject_withdrew','dissent_observed'))
 or (pathway = 'supported' and outcome in ('subject_consented','subject_declined','subject_withdrew','dissent_observed'))
 or (pathway = 'consultee' and outcome in ('consultee_advises_inclusion','consultee_advises_exclusion',
                                           'consultee_advises_withdrawal','dissent_observed','paused','reinstated'))
  ),
  constraint subject_outcomes_recorded_by_subject_or_clinician check (
    outcome not in ('subject_consented','subject_declined')
    or recorded_by_role in ('patient','clinician','study_staff')
  ),
  constraint withdrawal_states_its_scope check (
    event_type <> 'withdrawal' or withdrawal_scope is not null
  )
);
```

Read `only_the_subject_consents` carefully. On the `consultee` pathway there is **no value in the enum that means "consented"**. A consultee row can say `consultee_advises_inclusion` and nothing stronger, forever. A caregiver cannot record that the patient consented, not because a policy forbids it but because **the sentence cannot be formed in this database.** That is ND-21 and P22 made structural.

```sql
create table app.consent_state (
  patient_id      uuid not null references app.patients(id) on delete cascade,
  purpose         app.consent_purpose not null,
  permitted       boolean not null,
  pathway         app.consent_pathway not null,
  since           timestamptz not null,
  last_event_id   uuid not null references app.consent_events(id),
  reaffirm_due_on date,
  primary key (patient_id, purpose)
);
```

Maintained by an `after insert` trigger on `app.consent_events`. `app.consent_state` is a cache; dropping and rebuilding it from the log must produce an identical table, and a pgTAP test asserts exactly that.

### 10.3 Capacity

```sql
create table app.capacity_records (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  status        app.capacity_status not null,
  assessed_by   uuid not null references app.user_profiles(id),
  assessed_by_role text not null check (assessed_by_role in ('clinician','study_staff')),
  assessed_on   date not null,
  review_due_on date not null,
  basis         text,
  created_at    timestamptz not null default now(),
  constraint review_is_after_assessment check (review_due_on > assessed_on)
);
create index on app.capacity_records (patient_id, assessed_on desc);

create or replace function app.capacity_review_current(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select cr.review_due_on >= current_date
       from app.capacity_records cr
      where cr.patient_id = p_patient
      order by cr.assessed_on desc, cr.created_at desc limit 1),
    false)
$$;
```

`coalesce(..., false)`: no capacity record means **not current**, which means the projector does not project. Absence of evidence is not consent.

### 10.4 The gate the projector calls

```sql
create or replace function app.consent_permits(p_patient uuid, p_purpose app.consent_purpose)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select cs.permitted from app.consent_state cs
                    where cs.patient_id = p_patient and cs.purpose = p_purpose), false)
     and coalesce((select cs.reaffirm_due_on is null or cs.reaffirm_due_on >= current_date
                     from app.consent_state cs
                    where cs.patient_id = p_patient and cs.purpose = p_purpose), false)
     and not exists (select 1 from app.patients p
                      where p.id = p_patient and p.processing_paused_at is not null)
$$;

-- and the temporal version, for retrospective-scope withdrawals
create or replace function app.consent_covers_instant(
  p_patient uuid, p_purpose app.consent_purpose, p_at_ms bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from app.consent_events ce
    where ce.patient_id = p_patient and ce.purpose = p_purpose
      and ce.event_type = 'withdrawal'
      and ce.withdrawal_scope = 'retrospective'
      and (ce.effective_from is null or true)
  ) and exists (
    select 1 from app.consent_events ce
    where ce.patient_id = p_patient and ce.purpose = p_purpose
      and ce.outcome in ('subject_consented','consultee_advises_inclusion','reinstated')
      and (extract(epoch from ce.effective_from) * 1000)::bigint <= p_at_ms
  )
$$;
```

A prospective withdrawal stops projection from now on and leaves projected rows in place. A retrospective withdrawal makes `consent_covers_instant` false for every instant, and the erasure path (§11.5) deletes what was already projected. **The participant chooses which, and the choice is a column.**

### 10.5 Behavioural dissent, with teeth

```sql
create table app.dissent_observations (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references app.patients(id) on delete cascade,
  observed_at timestamptz not null default now(),
  channel     text not null check (channel in
                ('patient_control','caregiver_report','repeated_abandonment','repeated_skip','staff_report')),
  description text,
  observed_by uuid references app.user_profiles(id),
  session_id  uuid,
  created_at  timestamptz not null default now()
  -- NOTE: `channel` has no 'inferred_classifier' value and never will. P18 / ND-15 /
  -- EU AI Act Art. 5(1)(f). The absence of the enum value is the enforcement.
);

create or replace function app.apply_dissent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update app.patients set processing_paused_at = coalesce(processing_paused_at, new.observed_at)
   where id = new.patient_id;

  insert into app.consent_events (patient_id, event_type, pathway, purpose, outcome,
                                  effective_from, recorded_by, recorded_by_role, notes)
  select new.patient_id, 'dissent_observed', cs.pathway, cs.purpose, 'dissent_observed',
         new.observed_at, new.observed_by, 'study_staff',
         'auto-recorded from dissent_observations ' || new.id
  from app.consent_state cs where cs.patient_id = new.patient_id and cs.permitted;

  insert into app.revocations (patient_id, scope, reason)
  values (new.patient_id, 'patient', 'dissent_observed');    -- the tablet stops too
  return new;
end $$;

create trigger dissent_pauses_everything after insert on app.dissent_observations
  for each row execute function app.apply_dissent();
```

A dissent observation pauses the tablet, pauses the projector, and writes a consent event — in one transaction, with no human in the loop to forget. Reinstatement requires an explicit `reinstated` consent event recorded by a clinician; a caregiver cannot clear it. **S6 ("zero participants continue after expressed dissent") is then auditable as a single query and, more importantly, is hard to violate by accident.**

```sql
create view audit.s6_violations as
select p.id as patient_id, d.observed_at, e.event_id, e.server_anchored_ms
from app.dissent_observations d
join app.patients p on p.id = d.patient_id
join app.events   e on e.patient_id = p.id
                   and e.server_anchored_ms > (extract(epoch from d.observed_at)*1000)::bigint
where not exists (
  select 1 from app.consent_events ce
  where ce.patient_id = p.id and ce.outcome = 'reinstated'
    and ce.effective_from between d.observed_at and to_timestamp(e.server_anchored_ms/1000.0)
);
```

Offline tablets will produce rows here legitimately — a device that has not synced cannot know. That is why the view exists and why the number is reported rather than assumed to be zero: `hard_expiry_days` bounds it at ≤7 days, and the bound is what gets written into the protocol.

---

## 11. EXPORT AND ERASURE

### 11.1 Two different rights that get conflated

- **Export** (GDPR Art. 15/20, App Store 5.1.1(v)) is the *identifiable* plane. The family wants their photographs and their recordings back. It is served entirely from `app` and from Storage. It does not touch `research`.
- **Erasure** (Art. 17) has to reach four places: Postgres, Storage, **the tablets**, and the research plane — where it means something different (§11.5).

### 11.2 Export

```sql
create table app.export_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete cascade,
  requested_by  uuid not null references app.user_profiles(id),
  requested_by_role text not null check (requested_by_role in ('patient','caregiver','consultee','study_staff')),
  include_research_rows boolean not null default false,
  status        app.export_status not null default 'requested',
  bundle_path   text,
  bundle_sha256 bytea,
  expires_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);
```

The bundle: `patient.json`, `depicted_persons.json`, `consent_log.json` (the full append-only log, not the current state — a person is entitled to see what was recorded on their behalf and by whom), `items.json`, `sessions.json`, `events.ndjson`, and `media/<sha256>.<ext>` for every object. `include_research_rows` resolves the pseudonym via `link` inside the Edge Function under `service_role` and appends `research_rows.json`; it is off by default because most families are asking for the photographs.

### 11.3 Erasure — the orchestrator

```sql
create table app.erasure_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references app.patients(id) on delete restrict,
  requested_by  uuid not null references app.user_profiles(id),
  requested_by_role text not null,
  research_scope app.withdrawal_scope not null default 'prospective',
  status        app.erasure_status not null default 'requested',
  content_deleted_at   timestamptz,
  link_severed_at      timestamptz,
  devices_confirmed_at timestamptz,
  guaranteed_purged_by timestamptz,          -- max(last_sync + hard_expiry) over assigned devices
  completed_at         timestamptz,
  created_at    timestamptz not null default now()
);

create table app.device_purge_expectations (
  erasure_id   uuid not null references app.erasure_requests(id) on delete cascade,
  device_id    uuid not null references app.devices(id) on delete cascade,
  media_sha256 bytea not null,
  expected_at  timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by_event uuid references app.events(event_id),
  primary key (erasure_id, device_id, media_sha256)
);
```

Steps, in order, each idempotent:

| # | Step | Effect |
|---|---|---|
| 1 | Write `revocations` rows (`scope='media'` per sha256, then `scope='patient'`) | Every assigned tablet learns on its next sync |
| 2 | Populate `device_purge_expectations` for the cross product of assigned non-revoked devices × media | The completion condition becomes a countable set of rows |
| 3 | Delete Storage objects, then `update app.media_objects set state='deleted', deleted_at=now()` | Storage first: a row pointing at a deleted object is recoverable, an object with no row is an orphan nobody will find |
| 4 | Delete `items`, `item_media`, `depicted_persons`, `decks` | cascades |
| 5 | `link.sever(participant_pseudonym)` — §11.5 | The research rows become anonymous or are deleted |
| 6 | `app.execute_erasure(patient_id)` under the `app.erasure_context` GUC | `events`, `sessions`, `adverse_events`, `consent_events`, `patients` |
| 7 | Wait for purge receipts | Status `awaiting_devices` |
| 8 | Complete | When every expectation row is confirmed, **or** `now() > guaranteed_purged_by` |

### 11.4 The tablet is the hard part, and it has a bounded answer

ADR §8: *"Deleting only from Postgres would leave photographs of a person on a tablet in a care home; that would be the worst bug in this product."*

```sql
create or replace function app.confirm_purge_from_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type <> 'media.purged' then return new; end if;
  update app.device_purge_expectations pe
     set confirmed_at = now(), confirmed_by_event = new.event_id
   where pe.device_id = new.device_id
     and pe.media_sha256 = decode(new.payload->>'sha256', 'hex')
     and pe.confirmed_at is null;
  return new;
end $$;

create trigger events_confirm_purge after insert on app.events
  for each row execute function app.confirm_purge_from_event();
```

And the completion guarantee, which is the honest part:

```sql
-- an erasure is complete when every device has confirmed, OR when every device that
-- has not confirmed has passed its hard expiry and therefore cannot render anything.
create or replace function app.erasure_is_complete(p_erasure uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from app.device_purge_expectations pe
    join app.devices d on d.id = pe.device_id
    where pe.erasure_id = p_erasure
      and pe.confirmed_at is null
      and d.revoked_at is null
      and coalesce(d.last_sync_at, 'epoch'::timestamptz)
          + make_interval(days => d.hard_expiry_days) > now()
  )
$$;
```

**A deletion request therefore has a stated maximum time-to-completion of `hard_expiry_days` (default 7, minimum 4), and after that the photograph is unrenderable even on a tablet that never reconnects.** That is a number you can put in a privacy policy and defend, and it exists only because §4.5's dead-man expiry exists. Without it, "we deleted it" would be unfalsifiable.

### 11.5 Erasure in the research plane — the argument that most justifies the split

Under GDPR, pseudonymised data is still personal data **while the key exists**. Delete the key and the same rows become anonymous data, outside the Regulation. Split-plane makes that a one-row operation:

```sql
create or replace function link.sever(p_pseudonym text, p_scope app.withdrawal_scope)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_scope = 'retrospective' then
    delete from research.participant where participant_pseudonym = p_pseudonym;   -- cascades
    delete from link.participant_map  where participant_pseudonym = p_pseudonym;
  else
    update link.participant_map set severed_at = now(), patient_id = null
     where participant_pseudonym = p_pseudonym;
    update research.participant  set withdrawn_on_day = ...
     where participant_pseudonym = p_pseudonym;
  end if;
  perform audit.log_severance(p_pseudonym, p_scope);
end $$;
```

The consequence, stated plainly because it is the single strongest argument for this architecture:

> **In a deny-list architecture, "delete this participant" is a cascading delete across every research table plus every analysis artefact, and it destroys the study's data. In split-plane, the default (`prospective`) is one `update` on one row, after which the behavioural dataset survives as genuinely anonymous data that no longer engages the Regulation, and the participant's identifiable content is gone.** A family gets their erasure without the pilot losing its N, and the REC gets a defensible answer to the question it always asks.

The participant can still choose `retrospective`, and then the rows go too. The point is that the *easy* path is also the *correct* path, which is not true of any single-plane design.

---

## 12. WHAT THE OPERATIONAL PLANE KEEPS FOR ITSELF

Not everything analytical belongs in the research plane, and pretending otherwise is how a split-plane design collapses into a join problem.

| Need | Plane | Why |
|---|---|---|
| **P25 delirium notifier** (S7) | Operational | It must reach a *named* caregiver about a *named* person within hours. It reads `app.events` for the same patient it alerts about. It never touches `research`. |
| **Scheduler recomputation** | Operational | Canonical fold over `app.event_stream`, keyed by `patient_id`. |
| **Caregiver "moments"** (P5) | Operational | `app.moments_for_caregiver`, no aggregates. |
| **S4 deceased-surfacing audit** | **Research** | `person_status` and `presentation_mode` are both projected, so the audit runs entirely inside `research_api`. No cross-plane join needed. |
| **Trial operations console** (surface B) | **Research** | Adherence, attrition curves, `ended_on_success` rate, adverse-event register, consent events — all projected. The console is pseudonym-keyed. |
| **A trial manager who must act on a specific participant's safety** | `link.break_glass` | Two-person, reason-coded, audit-logged, S-criterion-tagged. §13.2. |

---

## 13. THE THREE HONEST PROBLEMS

### 13.1 The join problem

Split-plane forbids the join that a single-plane design gets free. Four real cases, and what each actually costs:

1. **"Which participant is having adverse events?"** — Solved by projection: `research.adverse_event` carries severity, category, coded narrative and `probe_disabled_as_result`. The researcher sees the pattern under a pseudonym. **Cost: zero.**
2. **"This pseudonym is having severe distress events and I need to stop their participation *today*."** — Genuinely needs re-identification. This is `link.break_glass`, two-person, logged, tagged with the safety criterion that justified it. **Cost: a deliberate, auditable, rare procedure — which is the correct cost, because re-identifying a research subject should be an event, not a query.** A single-plane design would let a trial manager do this with a `join` and no record that it happened; that is not better, it is just quieter.
3. **"Is the drop in probe accuracy in P-7K2M9QRS explained by her new medication?"** — `research.medication_and_comorbidity` is projected, so this works. But it works only because somebody put those fields in the manifest *before* the question was asked. **Cost: forethought, enforced by §6.4.** The honest failure mode of this architecture is a question you did not anticipate, which requires a manifest amendment, a REC amendment, and a backfill run. That is slower than a `join`. It is meant to be.
4. **"Recompute a derived variable with a new method over the whole cohort."** — Fully inside `research`. `research.derived_variable` is keyed by `method_version`, so recomputation is additive. **Cost: zero, and better than single-plane**, because the research plane is immutable-by-construction and therefore reproducible.

The residual: **there is no path from a research finding back to an operational action except break-glass.** That is by design and it is exactly what §8.2 of the product shape ("no live view of a named participant") demands.

### 13.2 Double-writing costs

| Cost | Size | Mitigation |
|---|---|---|
| Storage duplication | ~1.8× for behavioural rows. At the pilot's ~1500 events/patient/day × 30 patients × 26 weeks ≈ 8M rows ≈ 4 GB before the copy. **Negligible.** | None needed. If it stopped being negligible, `research` would be the plane that partitions. |
| Projector lag | 15 minutes by default | The research plane is retrospective and cohort-level by mandate (§8.2 surface A). Lag is not a defect here; a live research view is a *prohibited* feature. |
| Schema drift between planes | **The real cost.** A field added to `app.events.payload` does not appear in research until someone edits the projector. | `app.research_field_manifest` + `link.assert_manifest_complete()` make an unmapped research column a hard failure. The reverse — an operational field with no research counterpart — is intentionally allowed and is the whole point of an allow-list. |
| Projector correctness | The projector is now security-critical code, not just plumbing | It is one function, in one file, with one test per manifest row asserting that the projected value matches the expected transform, plus the negative tests of §14.2. Compare with a deny-list design, where the security-critical surface is *every view definition, forever*. |
| Two sets of migrations | Real, ~20% more migration work | Reduced by there being **zero foreign keys across the boundary**, so the two planes' migrations never have to be ordered against each other. |

The honest summary: this design costs roughly one extra engineer-week up front and one extra file to keep in step, and buys a security property that cannot be regressed by a careless `select *`.

### 13.3 Is the split real, or theatre, if both schemas live in one database?

Partly theatre, and the boundary of the theatre can be drawn exactly.

**Who can still re-identify a participant, and by what route:**

| Actor | Route | Mitigated by |
|---|---|---|
| Anyone holding the `service_role` key | Everything, trivially | Key is in Edge Function secrets only, never in a client, never in CI logs. Rotate on any suspicion. **This is the largest residual risk in the whole design and it is not created by this design — every Supabase architecture has it.** |
| A Supabase dashboard user with SQL editor access | Everything | Dashboard access list is a named, reviewed set; MFA enforced; §14.5 makes dashboard queries appear in `audit` only if run through the wrapper, which they will not be. **Unmitigated. Stated.** |
| Anyone with a database backup or PITR snapshot | Everything, including `link` | Backups are encrypted at rest and access-controlled by the platform. **Unmitigated at the schema level.** |
| A Postgres superuser / the platform operator | Everything | Out of scope for any design short of client-side encryption. |
| **A researcher, by any query, ever** | **None.** No `USAGE` on `app`, `link` or `research`. | **This is the mitigated case, and it is the case the design exists for.** |
| A researcher's compromised laptop / stolen JWT | Only `research_api`, only their studies | Same as above. A stolen researcher token is worth pseudonymous behavioural rows and nothing else. |
| A SQL-injection bug in researcher-facing code | Only `research_api` | The blast radius of an injection is the role's grants, and the role's grants are seven views. |
| A future migration that adds a column with a photo path to a research view | Blocked | `assert_manifest_complete()` fails the projector and the CI test |

So: the split does **not** protect against a compromised platform credential. It **does** protect, absolutely and without relying on anyone remembering anything, against every query issuable by the role that will run thousands of ad-hoc queries over three years — which is the researcher, and which is precisely the actor whose ordinary daily work is the recurring risk.

**And the second answer, which matters more:** because there are zero foreign keys, zero shared sequences and zero cross-schema functions from research back to operational, the research plane can be moved to a **separate Postgres instance** by logical replication of `research.*` alone, leaving `link` behind, as a **configuration change rather than a redesign**. That migration is one publication, one subscription, one connection string, and a `revoke`. No other data architecture in this repository has that property. If B3 (the US biometric-law opinion) or the DPIA comes back demanding physical separation, this design is a week away from it and every alternative is a quarter away from it.

That is the correct way to evaluate "is it theatre": not *does it stop a superuser today*, but *does it make the strong version cheap tomorrow*. It does.

### 13.4 The definer-view liability, named rather than buried

Three views in this design run as their owner and carry their scope predicate in their body: `device_api.device_content`, `device_api.device_roster`, and the `research_api.*` family. Definer views bypass RLS on their base tables. That means:

- Each view body is a security boundary with the same weight as a policy.
- Each appears in `policies.ts` with positive **and** negative expectations.
- Each is owned by `plane_bridge`, not by the schema owner, so a bug in a view body escalates to *read-only on `app`*, not to write access.
- `security_invoker = true` is not available for these, because the whole point is that the calling role has no base-table grants.

This is the price of "zero SELECT on base patient tables". It is worth paying, but it moves risk from the policy layer to the view layer and pretending otherwise would be dishonest.

---

## 14. VERIFICATION

### 14.1 Structural assertions (pgTAP, run in CI on every migration)

```sql
-- every table in app has RLS enabled AND forced
select is_empty($$
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'app' and c.relkind = 'r'
    and (not c.relrowsecurity or not c.relforcerowsecurity)
$$, 'every app table has RLS enabled and forced');

-- no policy addresses PUBLIC
select is_empty($$ select polname from pg_policy where polroles = '{0}' $$,
                'no policy targets PUBLIC');

-- the researcher has no privilege anywhere outside research_api
select is_empty($$
  select table_schema||'.'||table_name from information_schema.table_privileges
  where grantee = 'app_researcher' and table_schema <> 'research_api'
$$, 'app_researcher holds no privilege outside research_api');

-- no role but plane_bridge and the owner can even USE schema link
select is_empty($$
  select r.rolname from pg_roles r
  where r.rolname like 'app\_%' and has_schema_privilege(r.rolname, 'link', 'USAGE')
$$, 'no application role has USAGE on link');

-- no temporal column anywhere in research
select is_empty($$
  select table_name||'.'||column_name from information_schema.columns
  where table_schema = 'research'
    and data_type in ('date','timestamp with time zone','timestamp without time zone','interval')
$$, 'the research plane contains no date or timestamp column');

-- no patient_id, no care_home_id, no sha256, no storage_path, no device_id in research
select is_empty($$
  select table_name||'.'||column_name from information_schema.columns
  where table_schema = 'research'
    and column_name in ('patient_id','care_home_id','sha256','storage_path','device_id',
                        'given_name','family_name','preferred_name','date_of_birth',
                        'headline_name','one_sentence','narrative','transcript')
$$, 'the research plane contains no operational identifier');

-- no foreign key crosses out of research
select is_empty($$
  select conname from pg_constraint c
  join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
  join pg_class f on f.oid = c.confrelid join pg_namespace fn on fn.oid = f.relnamespace
  where c.contype='f' and n.nspname='research' and fn.nspname <> 'research'
$$, 'no foreign key leaves the research plane');

-- P20: no biometric derivation is representable
select is_empty($$
  select table_schema||'.'||table_name||'.'||column_name from information_schema.columns
  where column_name ~* '(embedding|descriptor|template|voiceprint|faceprint|speaker_id|face_bbox|landmark)'
     or udt_name = 'vector'
$$, 'no biometric template column exists in any schema');

-- app.retired_by has no algorithm variant (P3 / ND-8)
select is_empty($$
  select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
  where t.typname = 'retired_by' and e.enumlabel = 'algorithm'
$$, 'items can never be retired by the algorithm');
```

### 14.2 Behavioural assertions (the RLS suite, driven by `policies.ts`)

Every row of §8.5, positive and negative, using `signInAsFixtureDevice`, `signInAsFixtureCaregiver`, `signInAsFixtureResearcher`. Three of them are worth calling out as the ones that would catch a real regression:

1. `select * from link.participant_map` as `app_researcher` must fail with **42501 (insufficient privilege)**, not return zero rows. Zero rows would mean a policy is doing the work and a policy can be edited; 42501 means the grant is doing the work.
2. `select * from app.events` as `app_device` must fail with **42501**. Same reasoning.
3. `insert into app.events (..., server_anchored_ms) values (..., 0)` as `app_device` must fail with **42501** on the column grant, proving the device cannot forge its position in the replay order.

### 14.3 The projector's own tests

- **Round trip:** for a seeded patient with a known event log, `link.project()` twice produces identical `research` contents (idempotence under the `on conflict do nothing` path).
- **Consent gate:** a patient with `research_behavioural` withdrawn produces zero new interaction rows, and a patient with an overdue capacity review produces zero new rows.
- **Manifest:** adding a column to `research.interaction` without a manifest row fails the migration test.
- **No leakage:** a fuzz test writes a recognisable sentinel string (`'ZZSENTINELZZ'`) into every free-text column in `app` — names, one_sentence, adverse-event narrative, consent notes — runs the projector, then greps the entire `research` schema for the sentinel. **Zero hits is the assertion.** This one test is worth more than most of the structural ones because it tests the projector's actual behaviour rather than its declared shape.

### 14.4 CI checks outside the database

- A migration diff check that fails on `create extension vector` or any column matching the biometric regex.
- A check that no file under `supabase/functions/` other than `sync/`, `enrol-device/`, `redeem-enrolment/`, `export-patient/`, `delete-patient/` references `SERVICE_ROLE_KEY`.
- A check that the sync function's event-ingest path constructs its Supabase client from the **device's** Authorization header and not from `service_role` — otherwise every grant in §9 is decorative. This is the single most important non-SQL test in the design.

---

## 15. OPEN RISKS AND WEEK-ONE GATES

| # | Risk | Gate |
|---|---|---|
| 1 | **Custom Postgres roles via the access-token hook may not be usable on the target Supabase plan.** The entire "missing grant" claim depends on it. | **Week 1.** Build a throwaway project, create `app_researcher`, grant it to `authenticator`, install the hook, and prove `select 1 from app.patients` returns 42501. If it fails, this proposal should be rejected, not weakened. |
| 2 | Definer views are now three security boundaries (§13.4) | Every view body in `policies.ts`; pgTAP negative tests before pilot |
| 3 | `service_role` remains a universal bypass | Not solvable in-schema. Secrets hygiene, rotation, and the §14.4 CI check are the whole mitigation, and they are not enough on their own. Named for the DPIA. |
| 4 | Late-arriving events change canonical scheduler state retroactively (§5.6) | Snapshot is a cache with a watermark; a full-refold test with a 3-day-late second device is in the contract fixtures |
| 5 | The pilot's N is ~30. Quasi-identifiers (`age_band` × `dementia_subtype` × `site_code` × `first_language`) may be unique within a cohort even with no direct identifier. | k-anonymity check on `research_api.participant` before any export leaves the building; suppress `site_code` and collapse `age_band` where a cell has k<5. **Split-plane does not solve small-cohort re-identification and does not claim to.** |
| 6 | B3 (US biometric-law opinion) is still open and gates the content pipeline | §13.3's escalation path (logical replication to a second cluster) is the prepared answer |
| 7 | Deviating from ADR §4.3 on clock anchoring (§5.4) | Needs the presiding architect's sign-off; it is a strengthening, but it is a deviation from a binding document |
| 8 | Erasure completion depends on `hard_expiry_days` for offline devices | Stated in the privacy policy as "within 7 days"; do not claim immediate |

---

## 16. THE SUMMARY ARGUMENT

Photographs and voice recordings of relatives who never consented cannot be de-identified — only removed (§1.11). A category of data whose only remedy is removal must live behind an architecture whose default is *removed*, and only an allow-list has that default. A view over a base table is a deny-list; a projected plane is an allow-list. That is the whole case for split-plane, and everything else in this document is the consequence of taking it seriously: no `patient_id` column in the research plane, no foreign key across the boundary, a bridge role that is read-only on the operational side, a mapping schema with no grant to anybody, and a projector that fails loudly when someone adds a column nobody pre-registered.

The design costs an extra week, an extra file, and the loss of an ad-hoc join. It buys a de-identification guarantee that survives every future migration, an erasure story where the easy path is also the lawful one, and a one-week migration to genuine physical separation if the regulator asks for it.
