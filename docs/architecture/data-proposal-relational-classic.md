# DATA PROPOSAL — CLASSIC RELATIONAL CENTRE

**Status:** Advocate proposal. Not binding. Written against `00-ADR-PLATFORM.md` (binding), `docs/research/00-SYNTHESIS.md` (governing), `docs/design/00-V1-PRODUCT-SHAPE.md` (frozen).
**Position:** normalised current-state tables are the primary artifact; the event log is a subordinate, append-only audit and telemetry stream that feeds them.
**Date:** 2026-08-12

---

## 0. THE POSITION IN ONE PARAGRAPH

Postgres row-level security reasons about **rows**, not about folds. Every access decision this product has to make — *may this caregiver see this patient*, *may this tablet render this card*, *has this person consented to this purpose today*, *is this photograph of a relative who never consented* — is a predicate over a row that already exists. If the answer lives in a fold over an event stream, the policy either has to run the fold (unindexable, uncacheable, catastrophically slow, and impossible to write blind from `policies.ts`) or has to consult a materialised projection — at which point the projection is doing the work and the log is a write-ahead file. So make the projection the schema, write it down honestly, and be explicit about which rows are authoritative and which are rebuildable cache. That is the whole proposal. Concretely: **the device reports what happened; the server computes what it means; humans write rows directly.** Three sentences, three writer classes, and every one of the three surfaces gets a query that is a join over indexed columns.

---

## 1. WHY THE RELATIONAL CENTRE, AND WHERE THE EVENT LOG STILL WINS

### 1.1 There are two writer classes and they deserve two shapes

The ADR's own sync table (§4.4) already says this and nobody read it as a data-modelling instruction:

| Data | Writer | Arrival | Trust |
|---|---|---|---|
| Telemetry | patient device only | late, out of order, up to 3 days stale, possibly stolen | none |
| Card content, people, consent, retirement, adverse events | caregiver / admin / clinician, **online only** | immediate, ordered, authenticated | full |

~90% of *writes* are telemetry. Close to 100% of *reads that make a decision* are about the other class. Modelling consent as an event stream because telemetry is an event stream is a category error: consent is written online by an authenticated human against a live connection, and it must be *interrogated* by an RLS policy tens of thousands of times a day. The log shape buys nothing there and costs a fold.

So: the event log exists — mandatory, append-only, idempotent, exactly as the ADR specifies — and it is the **wire format and the audit trail for device-originated facts**. It is not the schema. `interactions`, `session_outcomes` and `item_schedule` are the schema, they are normalised, they are indexed, and they are a pure function of the log plus the human-written rows.

### 1.2 The binding constraint is satisfied, not evaded

> "The event log is the source of truth."

It is, **for everything a device knows**. No device-originated fact is recorded anywhere except in `public.events`. Every derived row carries `derived_through_ord` and can be dropped and rebuilt from the log with a single `truncate`+`replay`. The log is the source of truth in exactly the sense that matters: *nothing is lost if the projections burn down, and the projections are provably reproducible.*

What the log is **not** is the source of truth for facts no device has ever observed — that Margaret's daughter withdrew consent on Tuesday, that this photograph shows a nephew who never signed anything, that the study clinician excluded a participant on the PCA gate. Inventing synthetic events for those, so that a uniform log can be claimed, is ceremony. It adds an ordering problem to data that has no ordering problem, and it puts a `jsonb` payload where a `check` constraint belongs.

### 1.3 LESS IS MORE, counted

An event-sourced centre needs, over and above what is below: a snapshot table per aggregate, a snapshot cadence policy, an upcaster chain for payload schema evolution, a projection-lag monitor, a read-your-own-writes strategy for the caregiver UI, and either a second RLS story for projections or a fold inside a policy. That is six moving parts, each of which is a way for a photograph of a dead woman's face to be shown to her husband because a projection was 90 seconds behind.

This proposal adds exactly two mechanisms the naive relational schema does not have: a **derivation watermark** and a **rebuild job queue**. Two tables, ~120 lines of Deno. Everything else is `create table`.

### 1.4 The honest cost, up front

Recomputing scheduler state from a log while claiming current state is authoritative *is* a real tension, and §6 answers it in full rather than in passing. The short version: **`item_schedule` is not authoritative and is not claimed to be.** It is a labelled cache with a provenance column. The authoritative artifacts are (a) the log, for what happened, and (b) the human-written content and consent rows, for what is permitted. Current-state tables are authoritative *only* for the human-written class. Any table a device or a fold can influence carries `derived_through_ord`, is owned by `service_role`, and is `truncate`-safe. If a table is not `truncate`-safe, no derivation may write it. That rule is mechanical, it is checkable by a migration lint, and it is the entire discipline.

---

## 2. SCHEMA MAP

Five Postgres schemas. The boundaries between them are grants, not conventions.

| Schema | Contains | Who has `usage` |
|---|---|---|
| `public` | every base table | `caregiver_role`, `admin_role`, `service_role`, `research_definer`, `device_view_owner`. **Not** `device_role`* , **not** `researcher_role` |
| `app` | RLS helper functions, ingest and derivation entry points | everyone (functions are individually granted) |
| `device` | exactly two views: `device.content`, `device.roster` | `device_role` only |
| `research` | pseudonymous views only, no tables | `researcher_role` only |
| `link` | `link.participant_map` — the pseudonym↔patient mapping | **nobody except `research_definer` and `service_role`** |

\* `device_role` needs `usage on schema public` to reach its two `INSERT` targets. It gets `usage` and nothing else: every table privilege in `public` is revoked from it and re-granted at column level on two tables. §8.3.

```
                       ┌───────────────────────────────┐
   caregiver ─────────▶│ public.*  (normalised rows)   │
   admin     ─────────▶│  people items media consent   │
                       │  patients devices adverse_ev  │
                       └───────┬───────────────▲───────┘
                               │               │ derive (service_role only)
                               │               │
   device ──INSERT──▶ public.events ───────────┘
   device ──INSERT──▶ public.sessions
   device ──SELECT──▶ device.content / device.roster  (definer views)

   researcher ─SELECT─▶ research.*  ──(definer)──▶ public.* ⋈ link.participant_map
                                                            ▲
                                            no grant to researcher_role, ever
```

---

## 3. TYPES

```sql
create extension if not exists pgcrypto;

create schema app;
create schema device;
create schema research;
create schema link;

-- identity / tenancy
create type app_role          as enum ('caregiver','care_home_admin','researcher','device');
create type tenancy_kind      as enum ('care_home','household');
create type membership_role   as enum ('caregiver','care_home_admin');

-- clinical / eligibility
create type dementia_subtype  as enum ('alzheimers','pca','sv_ppa','other_ppa','dlb','vascular',
                                       'ftd_behavioural','mixed','mci_unspecified','unknown');
create type severity_band     as enum ('mild','moderate','severe','unstaged');
create type eligibility_outcome as enum ('eligible','eligible_flagged_dlb','excluded_pca',
                                         'excluded_svppa','deferred_acute_change','deferred_sensory');
create type capacity_status   as enum ('has_capacity','fluctuating','lacks_capacity','not_assessed');

-- consent
create type consent_purpose   as enum ('care_delivery','research_analytics','speech_features',
                                       'media_retention','depicted_third_party');
create type consent_pathway   as enum ('direct','supported','consultee');
create type consent_event_type as enum ('initial','reaffirmation','dissent_observed','withdrawal',
                                        'capacity_change','consultee_change','purpose_change');
create type consent_outcome   as enum ('granted','declined','withdrawn','deferred','noted');

-- content
create type person_status     as enum ('living','deceased','estranged','do_not_show');
create type media_kind        as enum ('photo','voice_caption','music_clip','narration_recording');
create type biometric_class   as enum ('full_face_photograph','voice_recording','non_biometric');
create type media_state       as enum ('pending','ready','quarantined','erased');
create type item_tier         as enum ('tier1','tier2','tier3');
create type item_role         as enum ('primary_photo','foil_photo','voice_caption','music_clip');
create type content_provenance as enum ('family_upload','generic_library','physical_scan');
create type mechanic_id       as enum ('m35_saying','m56_song','m02_narrated','m20_answer_first',
                                       'm20_probe','m21_probe_recall_first','m40_tell_me');
create type presentation_mode as enum ('free_recall','cued_recall','recognition','familiarity_exposure');

-- runtime
create type session_mode      as enum ('standard','nothing_today');
create type session_end_reason as enum ('completed','user_ended','distress_stop','timeout',
                                        'app_crash','device_failure','faded_to_rest');
create type distress_level    as enum ('none','mild','moderate','severe');
create type distress_source   as enum ('patient_control','caregiver_report','abandonment','repeated_skip');
create type error_type        as enum ('none','omission','no_response_timeout','semantic_near_miss',
                                       'phonological_near_miss','intrusion_other_person',
                                       'perseveration','confabulation','wrong_but_plausible');
create type administered_by   as enum ('self','caregiver_assisted','caregiver_proxy');

-- safety / ops
create type adverse_category  as enum ('distress','catastrophic_reaction','bereavement_confrontation',
                                       'carer_distress','acute_change_suspected_delirium','other');
create type revocation_subject as enum ('media_object','item','patient','device');
create type erasure_stage     as enum ('requested','rows_purged','storage_purged',
                                       'revocations_issued','devices_confirmed','complete');
create type integrity_kind    as enum ('arm_mismatch','rung_divergence','seq_gap','clock_implausible',
                                       'unknown_event_type','payload_rejected');
```

Enums, not lookup tables, for every closed set the documents actually froze. A lookup table for `person_status` would be a join on every content read to model four values that P16 declares mandatory and unskippable. `alter type ... add value` is the migration path and it is cheaper than the join.

---

## 4. DDL — THE HUMAN-WRITTEN PLANE (AUTHORITATIVE)

### 4.1 Tenancy, people, membership

One tenancy concept covers both deployments. A family at home is a `household`; a care home is a `care_home`. The ADR's device JWT carries `care_home_id` and it must always resolve, so a household gets a real row.

```sql
create table public.care_homes (
  id                 uuid primary key default gen_random_uuid(),
  kind               tenancy_kind not null,
  name               text not null,
  locale             text not null default 'en-GB',
  hard_expiry_days   int  not null default 7 check (hard_expiry_days between 4 and 14),
  data_controller    text not null,             -- named on the DPA
  created_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create table public.user_profiles (
  auth_user_id  uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  role          app_role not null check (role <> 'device'),
  created_at    timestamptz not null default now(),
  disabled_at   timestamptz
);

create table public.care_home_members (
  care_home_id  uuid not null references public.care_homes(id) on delete cascade,
  user_id       uuid not null references public.user_profiles(auth_user_id) on delete cascade,
  role          membership_role not null,
  added_by      uuid references public.user_profiles(auth_user_id),
  added_at      timestamptz not null default now(),
  removed_at    timestamptz,
  primary key (care_home_id, user_id)
);
create index on public.care_home_members (user_id) where removed_at is null;
```

`patients` is the data subject. P22 makes the patient a first-class identity, not a profile inside a caregiver's account; `auth_user_id` is nullable because most participants will never log in (ND-30 forbids requiring it) but the column exists so the identity is theirs.

```sql
create table public.patients (
  id                 uuid primary key default gen_random_uuid(),
  care_home_id       uuid not null references public.care_homes(id) on delete restrict,
  auth_user_id       uuid unique references auth.users(id) on delete set null,
  display_first_name text not null,             -- the ONLY name a device ever sees
  full_name          text not null,
  birth_year         smallint not null check (birth_year between 1900 and 2015),
  grew_up_locale     text,
  first_language     text not null default 'en',
  avatar_media_id    uuid,                      -- FK added after media_objects exists
  enrolled_on        date,                      -- basis of day_offset_from_enrollment
  withdrawn_on       date,
  created_at         timestamptz not null default now(),
  created_by         uuid references public.user_profiles(auth_user_id),
  erased_at          timestamptz
);
create index on public.patients (care_home_id) where erased_at is null;
```

No date of birth column anywhere. §7 says `age_band`, never DOB; `birth_year` alone is required by M-56 (decade-matched music) and P14 (reminiscence bump), and it is the coarsest thing that works. `full_name` never leaves the content plane.

P23 requires differentiated caregiver permissions and a documented removal path, and regrades "the caregiver is the problem" to the modal case.

```sql
create table public.patient_caregivers (
  patient_id          uuid not null references public.patients(id) on delete cascade,
  user_id             uuid not null references public.user_profiles(auth_user_id) on delete cascade,
  relationship        text not null,
  is_primary          boolean not null default false,
  may_edit_deck       boolean not null default true,
  may_view_moments    boolean not null default true,
  may_receive_alerts  boolean not null default true,   -- P25 delirium notifier recipient
  is_consultee        boolean not null default false,  -- MCA s.30-33; paid staff may NOT be (B12)
  added_at            timestamptz not null default now(),
  removed_at          timestamptz,
  removed_by          uuid references public.user_profiles(auth_user_id),
  removal_reason      text,
  primary key (patient_id, user_id)
);
create unique index one_primary_caregiver
  on public.patient_caregivers (patient_id) where is_primary and removed_at is null;
create index on public.patient_caregivers (user_id) where removed_at is null;
```

Enrolment screening (product shape §9). Never scored, never rendered, never a cognitive measure.

```sql
create table public.enrolment_screenings (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references public.patients(id) on delete cascade,
  screened_on           date not null,
  respondent_role       text not null check (respondent_role in ('caregiver','referrer')),
  subtype_of_record     dementia_subtype not null default 'unknown',
  pca_positive_count    smallint not null check (pca_positive_count between 0 and 4),
  svppa_positive_count  smallint not null check (svppa_positive_count between 0 and 4),
  dlb_positive_count    smallint not null check (dlb_positive_count between 0 and 4),
  acute_change_flag     boolean not null,
  sensory_checked       boolean not null,
  outcome               eligibility_outcome not null,
  reviewed_by_clinician uuid not null references public.user_profiles(auth_user_id),
  reviewed_at           timestamptz not null,
  constraint pca_excluded  check (outcome <> 'eligible' or pca_positive_count   < 2),
  constraint svppa_excluded check (outcome <> 'eligible' or svppa_positive_count < 2)
);
create unique index on public.enrolment_screenings (patient_id, screened_on);
```

The two `check` constraints are ND-35 made unforgeable at the storage layer: a row asserting eligibility with two PCA positives cannot be committed by any code path, including `service_role`.

```sql
create table public.study_participants (
  patient_id            uuid primary key references public.patients(id) on delete cascade,
  dementia_subtype      dementia_subtype not null,
  severity_band         severity_band not null,
  fluctuation_band_high boolean not null default false,   -- DLB flag, §9 Gate 3
  age_band              text not null check (age_band ~ '^\d{2}-\d{2}$'),
  years_education_band  text,
  country_locale        text not null,
  prior_computer_use    smallint check (prior_computer_use between 0 and 4),
  apathy_score          smallint check (apathy_score between 0 and 12),  -- NPI-Q apathy
  hearing_aid_use       boolean,
  corrected_vision      boolean,
  patient_ui_version    text not null,           -- P10: frozen per participant
  randomisation_seed    bytea not null,          -- see §7.4
  m3_arm                text not null check (m3_arm in ('errorless','recall_first')),
  probe_disabled_at     timestamptz,
  probe_disabled_reason text
);
```

`m3_arm` is frozen at enrolment (product shape §8.5) and lives in a current-state row because that is exactly what it is: one immutable fact per participant, read on every session plan.

Clinical assessments and medications, both externally administered, never rendered in-app:

```sql
create table public.clinician_assessments (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references public.patients(id) on delete cascade,
  instrument          text not null,
  instrument_version  text,
  total_score         numeric,
  subscale_scores     jsonb not null default '{}'::jsonb,
  administered_by_role text not null,
  administered_on     date not null,
  administration_setting text,
  nacc_uds_form_equivalent text
);

create table public.medication_and_comorbidity (
  id                          uuid primary key default gen_random_uuid(),
  patient_id                  uuid not null references public.patients(id) on delete cascade,
  recorded_on                 date not null,
  anticholinergic_burden_score smallint,
  benzodiazepine              boolean not null default false,
  antipsychotic               boolean not null default false,
  sedative                    boolean not null default false,
  cholinesterase_inhibitor    boolean not null default false,
  memantine                   boolean not null default false,
  anti_amyloid_therapy        text check (anti_amyloid_therapy in
                                ('none','lecanemab','donanemab','other')),
  recent_infection            boolean not null default false,
  recent_hospitalisation      boolean not null default false,
  pain_reported               boolean not null default false,
  constipation_reported       boolean not null default false,
  dehydration_flag            boolean not null default false
);
create index on public.medication_and_comorbidity (patient_id, recorded_on desc);
```

### 4.2 Consent — the whole architecture

Consent is ongoing, by proxy, capacity-sensitive, and withdrawable behaviourally. Three tables and one function, and the function is the only thing anything else calls.

```sql
create table public.capacity_assessments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  status         capacity_status not null,
  assessed_on    date not null,
  review_due_on  date not null,
  assessor_role  text not null,
  assessed_by    uuid references public.user_profiles(auth_user_id),
  notes_coded    text,
  constraint review_after_assessment check (review_due_on > assessed_on)
);
create index on public.capacity_assessments (patient_id, assessed_on desc);
```

```sql
create table public.consent_grants (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients(id) on delete cascade,
  purpose         consent_purpose not null,
  pathway         consent_pathway not null,
  granted_on      date not null,
  reaffirm_due_on date not null,
  granted_by      uuid not null references public.user_profiles(auth_user_id),
  -- the person who ADVISED. P22: a consultee never asserts the patient consented.
  consultee_user_id uuid references public.user_profiles(auth_user_id),
  patient_assent_observed boolean not null,
  withdrawn_at    timestamptz,
  withdrawn_by    uuid references public.user_profiles(auth_user_id),
  withdrawal_reason text,
  superseded_by   uuid references public.consent_grants(id),
  constraint consultee_pathway_requires_consultee
    check (pathway <> 'consultee' or consultee_user_id is not null),
  constraint direct_pathway_has_no_consultee
    check (pathway <> 'direct' or consultee_user_id is null),
  constraint reaffirm_after_grant check (reaffirm_due_on > granted_on)
);

-- at most one live grant per (patient, purpose) — enforced by the database, not by code
create unique index one_live_grant_per_purpose
  on public.consent_grants (patient_id, purpose)
  where withdrawn_at is null and superseded_by is null;
```

Reaffirmation supersedes rather than updates: a new row with a new `reaffirm_due_on`, and `superseded_by` set on the old one in the same transaction. The table is therefore append-only in practice and the full consent history is the table, not a separate audit log.

```sql
create table public.consent_events (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients(id) on delete cascade,
  grant_id        uuid references public.consent_grants(id) on delete set null,
  occurred_at     timestamptz not null default now(),
  event_type      consent_event_type not null,
  pathway         consent_pathway,
  purpose         consent_purpose,
  outcome         consent_outcome not null,
  recorded_by     uuid references public.user_profiles(auth_user_id),
  -- behavioural dissent (P22, S6) carries its evidence, never an inferred classifier (P18)
  dissent_behaviour text,
  dissent_source  distress_source,
  linked_session_id uuid,
  narrative_coded text
);
create index on public.consent_events (patient_id, occurred_at desc);
```

The one function everything calls:

```sql
create or replace function app.consent_is_effective(p_patient uuid, p_purpose consent_purpose)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.consent_grants g
    join public.patients p on p.id = g.patient_id
    where g.patient_id = p_patient
      and g.purpose    = p_purpose
      and g.withdrawn_at is null
      and g.superseded_by is null
      and g.reaffirm_due_on >= current_date              -- ongoing, not once
      and p.erased_at is null
      and p.withdrawn_on is null
      -- a consultee grant dies when its capacity review lapses
      and (g.pathway <> 'consultee' or exists (
            select 1 from public.capacity_assessments c
            where c.patient_id = p_patient
              and c.review_due_on >= current_date
            order by c.assessed_on desc limit 1))
      -- expressed dissent is absorbing until a human records a new grant (S6)
      and not exists (
            select 1 from public.consent_events e
            where e.patient_id = p_patient
              and e.event_type = 'dissent_observed'
              and e.occurred_at > (g.granted_on::timestamptz))
  );
$$;
```

Four properties worth naming:

1. **Consent expires.** `reaffirm_due_on` in the past means no consent, with no cron job, no batch sweep, and no possibility of a forgotten expiry. The default cadence is 90 days for `research_analytics` and `speech_features`, 180 for the rest.
2. **Dissent is absorbing and behavioural.** One `dissent_observed` row after the grant date and the predicate goes false immediately, everywhere, for that purpose. Re-enabling requires a human to write a new grant. This is S6 ("zero participants continue after expressed dissent") implemented rather than audited.
3. **Consultee grants decay with capacity review.** A lapsed capacity review invalidates a consultee grant automatically. MCA s.30–33 requires ongoing consultation; a database that lets a two-year-old consultee grant keep authorising collection is not implementing that requirement, it is documenting it.
4. **It is a function, so it appears verbatim in RLS policies, in research view predicates, and in the ingest gate.** One definition, three enforcement points, no drift.

Third-party biometric release — the BIPA/CUBI/Washington exposure, which is the sharpest liability in the product because the subjects are relatives who are not users:

```sql
create table public.depicted_persons (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  display_name  text not null,
  relationship  text not null,
  status        person_status not null,      -- P16: mandatory, unskippable
  era_decade    smallint check (era_decade between 1900 and 2030),
  is_the_patient boolean not null default false,
  is_a_user     boolean not null default false,
  created_at    timestamptz not null default now(),
  created_by    uuid not null references public.user_profiles(auth_user_id)
);
create index on public.depicted_persons (patient_id);

create table public.depicted_person_releases (
  depicted_person_id uuid primary key references public.depicted_persons(id) on delete cascade,
  release_basis      text not null check (release_basis in
                       ('written_release','verbal_release_attested','deceased_estate',
                        'not_required_patient_self','pending')),
  attested_by        uuid not null references public.user_profiles(auth_user_id),
  attested_at        timestamptz not null default now(),
  jurisdiction       text not null,           -- 'US-IL' etc.; drives the B3 opinion
  document_ref       text,
  revoked_at         timestamptz
);
```

And the constraint that makes it real — enforced as a trigger because it spans tables:

```sql
create or replace function app.enforce_biometric_release() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_class biometric_class; v_ok boolean;
begin
  select m.biometric_class into v_class from public.media_objects m where m.id = new.media_id;
  if v_class = 'non_biometric' then return new; end if;
  select bool_and(
           dp.is_the_patient
           or coalesce(r.release_basis, 'pending') <> 'pending'
           and r.revoked_at is null)
    into v_ok
  from public.media_subjects ms
  join public.depicted_persons dp on dp.id = ms.depicted_person_id
  left join public.depicted_person_releases r on r.depicted_person_id = dp.id
  where ms.media_id = new.media_id;
  if coalesce(v_ok, false) is not true then
    raise exception 'media % carries an unreleased biometric identifier', new.media_id
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger item_media_requires_release
  before insert or update on public.item_media
  for each row execute function app.enforce_biometric_release();
```

Note what this does **not** do: it never detects a face, clusters one, or matches a voice. ND-17 and P20 are absolute. `media_subjects` is populated by a caregiver tapping names, and it is capped in practice because the deck is 8–10 photographs, which is precisely the design trade the product shape already made.

### 4.3 Devices

The ADR's three tables, verbatim in shape, with the minimum additions the sync loop actually needs.

```sql
create table public.devices (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null unique references auth.users(id) on delete cascade,
  care_home_id     uuid not null references public.care_homes(id),
  mode             text not null check (mode in ('personal','shared')),
  label            text not null,
  hard_expiry_days int  not null default 7 check (hard_expiry_days >= 4),
  enrolled_at      timestamptz,
  last_seen_at     timestamptz,
  revoked_at       timestamptz,
  revoked_by       uuid references public.user_profiles(auth_user_id)
);
create index on public.devices (care_home_id) where revoked_at is null;

create table public.device_patients (
  device_id  uuid references public.devices(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (device_id, patient_id)
);
create index on public.device_patients (patient_id);

create table public.enrolment_codes (
  code_hash   text primary key,
  device_id   uuid not null references public.devices(id) on delete cascade,
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  attempts    int not null default 0 check (attempts <= 5)
);
```

Server-written sync bookkeeping. The device never reads it back as truth; it is the ops surface and the erasure closure surface.

```sql
create table public.device_sync_state (
  device_id             uuid primary key references public.devices(id) on delete cascade,
  last_cursor           bigint not null default 0,
  last_push_at          timestamptz,
  last_pull_at          timestamptz,
  content_valid_until   timestamptz,      -- last_pull_at + hard_expiry_days
  client_version        text,
  outbox_backlog_est    int,              -- from seq gap; drives the 50MB alarm
  last_clock_skew_ms    bigint
);
```

### 4.4 Content, media, and the generic library

```sql
create table public.decks (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  name        text not null default 'Family',
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);
create unique index one_active_deck_per_patient
  on public.decks (patient_id) where archived_at is null;
```

One active deck per patient in v1, enforced. The table exists so that a second deck is a migration rather than a rewrite; the unique index means it buys no complexity today.

```sql
create table public.items (
  id                 uuid primary key default gen_random_uuid(),
  deck_id            uuid not null references public.decks(id) on delete cascade,
  patient_id         uuid not null references public.patients(id) on delete cascade,
  depicted_person_id uuid references public.depicted_persons(id) on delete restrict,
  tier               item_tier not null default 'tier2',
  one_sentence       text,                        -- P12 / M-27; TTS reads what a human wrote
  content_language   text not null default 'en',  -- P14: per item, not per app
  era_decade         smallint check (era_decade between 1900 and 2030),
  content_provenance content_provenance not null default 'family_upload',
  content_is_generic boolean not null default false,
  is_probe           boolean not null default false,
  caregiver_rated_valence    smallint check (caregiver_rated_valence between -2 and 2),
  caregiver_rated_importance smallint check (caregiver_rated_importance between 0 and 3),
  -- P3 / ND-8: only a human retires. There is no 'algorithm' value and never will be.
  retired_at         timestamptz,
  retired_by         uuid references public.user_profiles(auth_user_id),
  retirement_reason  text,
  -- P18 / ND-14: distress makes an item absorbing until a human clears it
  absorbing_since    timestamptz,
  absorbing_cleared_by uuid references public.user_profiles(auth_user_id),
  created_at         timestamptz not null default now(),
  created_by         uuid not null references public.user_profiles(auth_user_id),
  constraint retired_by_a_human check (retired_at is null or retired_by is not null),
  constraint probe_items_are_generic check (not is_probe or content_is_generic),
  constraint personal_items_name_a_person
    check (content_is_generic or depicted_person_id is not null)
);
create index on public.items (patient_id) where retired_at is null;
create index on public.items (deck_id, tier) where retired_at is null and absorbing_since is null;
```

`retired_by_a_human` is ND-8 in the storage layer. There is no `retired_by_algorithm` column, no `leech_count`, no `suspended` flag. A scheduler that wanted to retire an item would have to name a `user_profiles` row to do it, and it has none.

```sql
create table public.media_objects (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.patients(id) on delete cascade,
  sha256           text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  storage_path     text not null,            -- 'patient/<patient_id>/<sha256>'
  kind             media_kind not null,
  mime             text not null,
  bytes            bigint not null check (bytes > 0),
  duration_ms      int,
  state            media_state not null default 'pending',
  biometric_class  biometric_class not null,
  created_at       timestamptz not null default now(),
  created_by       uuid not null references public.user_profiles(auth_user_id),
  erased_at        timestamptz,
  constraint audio_container_is_playable            -- ADR §8, the webm/opus trap
    check (kind not in ('voice_caption','music_clip','narration_recording')
           or mime in ('audio/mp4','audio/m4a','audio/aac')),
  constraint storage_path_matches
    check (storage_path = 'patient/' || patient_id::text || '/' || sha256)
);
create unique index one_object_per_patient_per_hash
  on public.media_objects (patient_id, sha256) where erased_at is null;

alter table public.patients
  add constraint patients_avatar_fk
  foreign key (avatar_media_id) references public.media_objects(id) on delete set null;

create table public.media_subjects (
  media_id           uuid not null references public.media_objects(id) on delete cascade,
  depicted_person_id uuid not null references public.depicted_persons(id) on delete cascade,
  tagged_by          uuid not null references public.user_profiles(auth_user_id),
  tagged_at          timestamptz not null default now(),
  primary key (media_id, depicted_person_id)
);

create table public.item_media (
  item_id   uuid not null references public.items(id) on delete cascade,
  media_id  uuid not null references public.media_objects(id) on delete restrict,
  role      item_role not null,
  ordinal   smallint not null default 0,
  primary key (item_id, media_id, role)
);
```

Content addressing is deliberately **scoped per patient**, not global. Two patients who happen to upload the same photograph store two objects. That costs bytes and buys the single most important property in the deletion model: **one patient's erasure can never delete another patient's bytes**, so `delete storage object where path = ...` needs no reference counting and cannot be got wrong under concurrency. §11.

The shipped generic library — proverbs, era photographs, music clips, stock probe faces — is tenant-free content with no patient and no consent:

```sql
create table public.generic_library_items (
  id               uuid primary key default gen_random_uuid(),
  library_version  text not null,
  kind             text not null check (kind in ('saying','era_photo','music_clip','stock_face')),
  locale           text not null,
  era_decade       smallint,
  body             jsonb not null,
  storage_path     text,
  licence_ref      text not null,          -- M-56 licensing is an open blocker; the column names it
  retired_at       timestamptz
);
create index on public.generic_library_items (library_version, kind, locale)
  where retired_at is null;

create table public.probe_item_set (
  probe_set_version text not null,
  ordinal           smallint not null check (ordinal between 1 and 8),
  library_item_id   uuid not null references public.generic_library_items(id),
  target_name       text not null,
  primary key (probe_set_version, ordinal)
);
```

The probe set is versioned and frozen — §5.2 makes it the only place a real uncued failure is recorded, and its psychometrics depend on identical stimuli across participants.

### 4.5 Safety and study operations

```sql
create table public.adverse_events (
  id                     uuid primary key default gen_random_uuid(),
  patient_id             uuid not null references public.patients(id) on delete cascade,
  occurred_on            date not null,
  severity               distress_level not null,
  category               adverse_category not null,
  related_item_id        uuid references public.items(id) on delete set null,
  related_item_class     text,
  narrative_coded        text,
  action_taken           text not null,
  reported_by            uuid references public.user_profiles(auth_user_id),
  reported_by_role       text not null,
  probe_disabled_as_result boolean not null default false,
  reviewed_by_clinician  uuid references public.user_profiles(auth_user_id),
  reviewed_at            timestamptz
);
create index on public.adverse_events (patient_id, occurred_on desc);

create table public.acute_change_notifications (         -- P25 / surface D
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients(id) on delete cascade,
  raised_at     timestamptz not null default now(),
  rule_version  text not null,
  trigger_detail jsonb not null,        -- proverb sentinel + probe threshold inputs
  recipient_user_id uuid not null references public.user_profiles(auth_user_id),
  delivered_at  timestamptz,
  outcome       text check (outcome in ('gp_contacted','no_action','false_positive',
                                        'infection_confirmed','other')),
  outcome_recorded_at timestamptz,
  constraint recipient_is_a_caregiver_not_a_clinician
    check (rule_version is not null)     -- see the trigger below
);
```

The recipient constraint that matters is cross-table and is a trigger: `recipient_user_id` must have a live `patient_caregivers` row with `may_receive_alerts`. P25 says the recipient is the caregiver, never the patient and never a clinician; a clinician-addressed acute-change notification is the MDR Rule 11 trigger and it must be impossible, not merely unimplemented.

Devices are told what to purge through `revocations`, which is exactly what ADR §4.4's pull already returns:

```sql
create table public.revocations (
  id            bigserial primary key,       -- monotone; doubles as the pull cursor
  care_home_id  uuid not null references public.care_homes(id) on delete cascade,
  patient_id    uuid references public.patients(id) on delete set null,
  subject_type  revocation_subject not null,
  subject_key   text not null,               -- sha256, item_id, patient_id or device_id
  issued_at     timestamptz not null default now(),
  issued_by     uuid references public.user_profiles(auth_user_id),
  erasure_request_id uuid
);
create index on public.revocations (care_home_id, id);

create table public.revocation_acks (
  revocation_id bigint not null references public.revocations(id) on delete cascade,
  device_id     uuid not null references public.devices(id) on delete cascade,
  acked_at      timestamptz not null default now(),
  primary key (revocation_id, device_id)
);
```

---

## 5. DDL — THE DEVICE-WRITTEN PLANE (TWO TABLES, INSERT ONLY)

These are the only two tables any device may write, ever, in any schema. Both are append-only and neither is ever read back by the device.

```sql
create table public.events (
  -- device-supplied (column-level INSERT grant covers exactly these)
  event_id        uuid primary key,                    -- client UUIDv7 = server PK
  device_id       uuid not null references public.devices(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  session_id      uuid not null,
  boot_id         uuid not null,
  seq             bigint not null check (seq > 0),
  batch_id        uuid not null,
  device_wall_ms_at_send bigint not null,
  type            text not null,
  payload         jsonb not null,
  t_wall_ms       bigint not null,
  t_mono_ms       integer not null check (t_mono_ms >= 0),
  client_version  text not null,
  -- server-owned (NOT in the grant; stamped by trigger; a device cannot name them)
  care_home_id    uuid not null,
  server_received_at timestamptz not null,
  anchored_at_ms  bigint not null,
  ingest_id       bigserial not null,
  constraint seq_unique_per_boot unique (device_id, boot_id, seq)
);

create index events_replay on public.events
  (patient_id, anchored_at_ms, device_id, boot_id, seq, event_id);
create index events_by_session on public.events (session_id);
create index events_undeirved on public.events (patient_id, ingest_id);
```

```sql
create table public.sessions (
  session_id      uuid primary key,
  device_id       uuid not null references public.devices(id) on delete cascade,
  patient_id      uuid not null references public.patients(id) on delete cascade,
  boot_id         uuid not null,
  started_wall_ms bigint not null,
  session_mode    session_mode not null,
  claimed_prime_condition text not null check (claimed_prime_condition in ('primed','unprimed')),
  claimed_m2_condition    text not null check (claimed_m2_condition in ('personal','generic')),
  claimed_session_ordinal int not null check (claimed_session_ordinal > 0),
  patient_ui_version text not null,
  scheduler_version  text not null,
  content_set_version text not null,
  client_version  text not null,
  -- server-owned
  care_home_id    uuid not null,
  server_received_at timestamptz not null,
  anchored_at_ms  bigint not null
);
create index on public.sessions (patient_id, anchored_at_ms);
```

Note what is **not** on `sessions`: duration, end reason, `ended_on_success`, item counts, accuracy, distress. Every one of those is an *outcome*, every one is derived, and every one lives in `session_outcomes` (§6.3) which no device can write. The device inserts a session **shell** at session start and never touches it again. That is how "zero UPDATE anywhere" and "one row per session" coexist without a state machine.

The `claimed_*` prefix is not decoration. Those columns are the device's assertion about the randomisation it applied; the server recomputes the same values from the participant seed and flags mismatches (§7.4). Naming them `claimed_` in the schema means no query anywhere can accidentally read them as fact.

Server stamping:

```sql
create or replace function app.stamp_device_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_home uuid; v_now_ms bigint;
begin
  select d.care_home_id into strict v_home from public.devices d where d.id = new.device_id;
  v_now_ms := (extract(epoch from now()) * 1000)::bigint;   -- transaction_timestamp: constant per batch
  new.care_home_id       := v_home;
  new.server_received_at := now();
  new.anchored_at_ms     := new.t_wall_ms + (v_now_ms - new.device_wall_ms_at_send);
  return new;
end $$;

create trigger stamp_events   before insert on public.events
  for each row execute function app.stamp_device_write();
```

`sessions` uses a near-identical trigger keyed on `started_wall_ms`. Because `now()` inside a transaction is `transaction_timestamp()`, every row of one pushed batch gets an identical skew — that is the ADR §4.3 per-batch anchoring rule, implemented in four lines and impossible for the client to influence.

---

## 6. DDL — THE DERIVED PLANE (SERVICE-ROLE WRITE ONLY, `TRUNCATE`-SAFE)

Every table in this section is owned by the derivation job, is never written by a device or a human, and carries its provenance. Any of them may be truncated and rebuilt at any time with no loss.

### 6.1 The watermark and the job queue — the only two mechanisms this design adds

```sql
create table public.patient_derivation_state (
  patient_id           uuid primary key references public.patients(id) on delete cascade,
  derived_through_ord  bigint not null default 0,   -- the anchored_at_ms of the last folded event
  derived_through_event uuid,
  scheduler_version    text not null,
  scoring_rubric_version text not null,
  derived_at           timestamptz not null default now(),
  event_count          bigint not null default 0,
  input_digest         text not null                -- md5 of the ordered event_id stream
);

create table public.derivation_jobs (
  id           bigserial primary key,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  reason       text not null check (reason in
                 ('ingest','late_event','version_bump','manual_rebuild','erasure')),
  rebuild_from bigint,                    -- null = full rebuild
  enqueued_at  timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz,
  error        text
);
create index on public.derivation_jobs (patient_id) where finished_at is null;
```

### 6.2 `interactions` — one row per item presentation, the §7 spec, normalised

This is the primary research and operations artifact and it is a plain table with plain columns and plain indexes.

```sql
create table public.interactions (
  interaction_id     uuid primary key,           -- deterministic: uuid_v5(session_id, ord)
  patient_id         uuid not null references public.patients(id) on delete cascade,
  session_id         uuid not null,
  item_id            uuid references public.items(id) on delete set null,
  library_item_id    uuid references public.generic_library_items(id),
  ord                bigint not null,            -- position in the canonical replay order
  source_event_id    uuid not null references public.events(event_id) on delete cascade,

  -- context
  mechanic           mechanic_id not null,
  app_version        text not null,
  scheduler_algorithm_version text not null,
  content_set_version text not null,
  scoring_rubric_version text not null,
  patient_ui_version text not null,
  device_class       text,
  os_version         text,
  screen_css_px      text,
  device_pixel_ratio numeric(4,2),
  display_refresh_hz smallint,
  input_modality     text not null default 'touch',
  anchored_at        timestamptz not null,       -- never exported; research sees an offset
  local_hour         smallint check (local_hour between 0 and 23),
  time_of_day_bucket text,
  session_ordinal_today smallint,
  administered_by    administered_by not null,

  -- scheduling state (SERVER-DERIVED, never device-reported)
  item_is_probe      boolean not null,
  item_tier          item_tier,
  repetition_number  int not null,
  lapse_count        int not null,
  days_since_last_review numeric,
  days_since_first_introduction numeric,
  scheduled_interval_days numeric,
  interval_deviation_days numeric,
  stability          numeric,
  difficulty         numeric,
  retrievability     numeric,
  predicted_recall_probability numeric,

  -- what the device actually showed (DEVICE-OBSERVED)
  within_session_rung smallint check (within_session_rung between 0 and 3),
  attained_rung       smallint check (attained_rung between 0 and 3),
  presentation_mode   presentation_mode not null,
  n_distractors       smallint,
  hint_level_reached  smallint check (hint_level_reached between 0 and 4),
  n_hints             smallint,
  time_to_first_hint_ms int,
  rescued_to_success  boolean,

  -- item metadata denormalised at derivation time (content plane never crosses to research)
  content_class      text,
  relationship_category text,
  era_decade         smallint,
  caregiver_rated_emotional_valence smallint,
  caregiver_rated_importance smallint,
  media_type         text,
  n_media_assets     smallint,
  cue_modality       text,
  content_language   text,
  content_is_generic boolean not null,
  person_status      person_status,
  content_provenance content_provenance,

  -- timing
  stimulus_paint_ts_mono int,
  first_input_ts_mono    int,
  response_commit_ts_mono int,
  latency_to_first_input_ms int,
  total_response_time_ms int,
  decision_time_ms       int,
  app_backgrounded_ms    int,
  n_backgrounds          smallint,
  interrupted            boolean not null default false,

  -- hesitation dynamics
  n_answer_changes   smallint,
  n_taps             smallint,
  tap_hold_durations_ms int[],
  mean_tap_hold_ms   numeric,
  sd_tap_hold_ms     numeric,
  dwell_before_first_touch_ms int,
  pointer_path_length_px numeric,
  n_direction_reversals smallint,
  off_target_tap_offset_px numeric,

  -- outcome
  correct            boolean,              -- first uncued attempt only, probe items
  grade              smallint,             -- system-assigned; P4 forbids self-report
  error_type         error_type not null default 'none',
  response_text_hash text,                 -- never the raw name

  -- speech features only; audio stays in the content plane
  utterance_duration_ms int,
  speech_rate_wpm    numeric,
  articulation_rate  numeric,
  n_pauses           smallint,
  mean_pause_ms      numeric,
  max_pause_ms       int,
  n_filled_pauses    smallint,
  voiced_ratio       numeric,
  type_token_ratio   numeric,
  asr_confidence     numeric,              -- metadata only, ND-26
  asr_language       text,

  -- safety
  distress_signal        distress_level not null default 'none',
  distress_signal_source distress_source,
  difficulty_floor_triggered boolean not null default false,
  item_absorbing_state_entered boolean not null default false,

  constraint no_self_rated_confidence_column check (true),   -- P4, documented by absence
  constraint uncued_failure_only_on_probe
    check (item_is_probe or correct is not false or hint_level_reached > 0)
);

create unique index on public.interactions (session_id, ord);
create index on public.interactions (patient_id, anchored_at);
create index on public.interactions (item_id, anchored_at) where item_id is not null;
create index on public.interactions (patient_id, item_is_probe, anchored_at);
```

`uncued_failure_only_on_probe` is §5.2 as a storage constraint: on the personal deck, a row recording an uncued miss with no hint cannot exist. If the scheduler ever produced one, the derivation aborts rather than persisting a design violation.

### 6.3 `session_outcomes`

```sql
create table public.session_outcomes (
  session_id         uuid primary key references public.sessions(session_id) on delete cascade,
  patient_id         uuid not null references public.patients(id) on delete cascade,
  ord_first          bigint not null,
  ord_last           bigint not null,
  duration_ms        int,
  planned_n_items    smallint,
  completed_n_items  smallint,
  session_end_reason session_end_reason not null,
  ended_on_success   boolean not null,             -- S3 audited from telemetry, not intent
  generic_opener_played boolean not null,
  generic_closer_played boolean not null,
  caregiver_present  boolean,
  caregiver_present_source text check (caregiver_present_source in ('declared','inferred')),
  mean_rt_ms         numeric,
  median_rt_ms       numeric,
  isd_residual_rt_ms numeric,
  cv_rt              numeric,
  accuracy           numeric,                      -- probe items only
  n_lapses           smallint,
  network_state      text,
  -- server-recomputed randomisation; the claimed_* columns on sessions are evidence, not fact
  prime_condition    text not null,
  m2_condition       text not null,
  session_ordinal    int not null,
  derived_at         timestamptz not null default now()
);
create index on public.session_outcomes (patient_id, ord_first);
```

### 6.4 `item_schedule` — the current-state scheduler cache

```sql
create table public.item_schedule (
  patient_id         uuid not null references public.patients(id) on delete cascade,
  item_id            uuid not null references public.items(id) on delete cascade,
  repetition_number  int not null default 0,
  lapse_count        int not null default 0,
  current_rung       smallint not null default 0 check (current_rung between 0 and 3),
  last_presented_at  timestamptz,
  next_due_at        timestamptz,
  interval_days      numeric not null default 0
                       check (interval_days <= 30),          -- global ceiling, §6.3
  stability          numeric,
  difficulty         numeric,
  retrievability     numeric,
  in_camp_rotation   boolean not null default false,
  -- provenance: this row is a cache and says so
  derived_through_ord bigint not null,
  scheduler_version  text not null,
  derived_at         timestamptz not null default now(),
  primary key (patient_id, item_id)
);
create index on public.item_schedule (patient_id, next_due_at);

-- tier-1 ceiling is tighter (§6.3): 7 days. Enforced across tables by trigger, not by hope.
create or replace function app.enforce_interval_ceiling() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_tier item_tier;
begin
  select i.tier into v_tier from public.items i where i.id = new.item_id;
  if v_tier = 'tier1' and new.interval_days > 7 then
    raise exception 'tier-1 interval ceiling breached: % days', new.interval_days
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger item_schedule_ceiling before insert or update on public.item_schedule
  for each row execute function app.enforce_interval_ceiling();
```

The scheduler could not push a tier-1 interval past seven days even if a bug wanted it to. ND-9 and scheduler requirement 3 stop being properties of a TypeScript module and start being properties of the database.

### 6.5 Integrity flags

```sql
create table public.integrity_flags (
  id           bigserial primary key,
  patient_id   uuid references public.patients(id) on delete cascade,
  device_id    uuid references public.devices(id) on delete cascade,
  session_id   uuid,
  kind         integrity_kind not null,
  detail       jsonb not null,
  detected_at  timestamptz not null default now(),
  reviewed_at  timestamptz
);
create index on public.integrity_flags (device_id, detected_at desc) where reviewed_at is null;
```

---

## 7. THE EVENT MODEL

### 7.1 Shape

Exactly the ADR §4.3 record, plus two columns the anchoring rule needs (`batch_id`, `device_wall_ms_at_send`) and four the server stamps. `payload jsonb` is validated by the sync Edge Function against the frozen zod schema in `src/contract/schema.ts` before insert; unknown `type` values are inserted anyway and flagged `unknown_event_type` rather than rejected, because a newer tablet meeting an older server must never lose telemetry (requirement 7 outranks schema tidiness).

Event types, closed at v1 and frozen in `schema.ts`: `session_started`, `item_presented`, `input_received`, `rung_changed`, `hint_shown`, `trial_committed`, `speech_features_extracted`, `distress_signalled`, `probe_trial`, `session_ended`, `faded_to_rest`, `revocation_acked`, `media_ready`, `sync_heartbeat`.

### 7.2 Idempotency

`event_id` is the primary key and ingest is:

```sql
insert into public.events (...) values (...) on conflict (event_id) do nothing;
```

At-least-once delivery + server dedupe = exactly-once effect. The device deletes an outbox row only on per-ID ACK. `seq_unique_per_boot` catches the pathological case the ADR's PK alone does not: a compromised or buggy client emitting two *different* events at the same `(device_id, boot_id, seq)`. That insert fails, the batch aborts, and an `integrity_flags` row records it — better than silently accepting a forked stream and producing an unreplayable log.

`sessions` uses the same pattern on `session_id`.

### 7.3 Total deterministic order

```
ord_key(e) = (e.anchored_at_ms, e.device_id, e.boot_id, e.seq, e.event_id)
```

Every component is immutable and a function of the row, never of arrival order. `anchored_at_ms` is stamped once, in the same statement as the insert, by `transaction_timestamp()`; a re-sent batch is dropped by `on conflict do nothing` so the first anchor is the only anchor. Therefore **replaying the same set of rows always produces the same sequence**, regardless of when they arrived, how many times they were retried, or which order two tablets' batches landed in.

Two tablets running offline sessions for the same patient merge deterministically over the union of their streams, exactly as ADR §4.4 requires. `patient_derivation_state.input_digest` is the md5 of the ordered `event_id` list and turns "did we replay the same thing" into a one-column comparison.

Within a boot, `t_mono_ms` deltas are the only latency measure; wall clocks are never differenced. `seq` gaps are visible by a window function over the replay index and produce a `seq_gap` flag, so a researcher can tell "she did not respond" from "we lost the event" (ADR §4.3 property 4).

### 7.4 Randomisation is derived, not reported

`study_participants.randomisation_seed` is 32 server-generated bytes, delivered to the device in the content pull. The device computes, offline and deterministically:

```
prime_condition(n) = hmac_sha256(seed, 'prime:' || n)[0] & 1
m2_condition(n)    = hmac_sha256(seed, 'm2:'    || n)[0] & 1
```

and reports the result in `sessions.claimed_prime_condition` / `claimed_m2_condition`. The server recomputes both from the same seed and the *server-derived* session ordinal, writes the recomputed values into `session_outcomes`, and raises `arm_mismatch` on divergence. The research plane reads only the recomputed columns.

This is the pattern in miniature for the whole proposal: the device needs the answer offline, so it computes it; the answer is a pure function of a server-held input, so the server verifies it; and the copy the research plane reads is the server's.

---

## 8. RLS AND GRANTS

### 8.1 Four Postgres roles, not one

The requirement "de-identification must be a MISSING GRANT" is only satisfiable if the researcher is a distinct Postgres role. Supabase supports this: PostgREST issues `SET LOCAL ROLE <jwt.role>`, GoTrue copies `auth.users.role` into the `role` claim, and `authenticator` must be able to switch into it.

```sql
create role caregiver_role  nologin;
create role admin_role      nologin;
create role researcher_role nologin;
create role device_role     nologin;
grant caregiver_role, admin_role, researcher_role, device_role to authenticator;
```

Provisioning (Edge Function, `service_role`) sets both `auth.users.role` and `app_metadata.role` at account creation. They must agree; a nightly assertion checks it, and the RLS suite asserts that a client cannot write either.

**Week-1 verification item, flagged rather than assumed:** confirm on the target Supabase project that a custom `role` claim is honoured end-to-end by PostgREST and by `supabase-js`. If it is not, the fallback is a separate PostgREST instance for the researcher surface with `PGRST_DB_ANON_ROLE=researcher_role`, which preserves the missing-grant property at the cost of one more deployment target. This is the single highest-risk assumption in the proposal and it is stated, not buried.

### 8.2 Helper functions

All `stable`, all `security definer`, all `set search_path = ''` — definer so that a policy on `patients` may consult `patient_caregivers` without re-entering `patient_caregivers`' own policy and recursing.

```sql
create or replace function app.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;

create or replace function app.claim_role() returns text
language sql stable as $$ select app.jwt() -> 'app_metadata' ->> 'role' $$;

create or replace function app.device_id() returns uuid
language sql stable as $$
  select nullif(app.jwt() -> 'app_metadata' ->> 'device_id', '')::uuid $$;

create or replace function app.claim_care_home_id() returns uuid
language sql stable as $$
  select nullif(app.jwt() -> 'app_metadata' ->> 'care_home_id', '')::uuid $$;

create or replace function app.device_serves_patient(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.device_patients dp
    join public.devices d on d.id = dp.device_id
    where dp.device_id = app.device_id()
      and dp.patient_id = p_patient
      and d.revoked_at is null)
$$;

create or replace function app.caregiver_reads(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.patient_caregivers pc
    join public.patients p on p.id = pc.patient_id
    where pc.patient_id = p_patient and pc.user_id = auth.uid()
      and pc.removed_at is null and pc.may_view_moments and p.erased_at is null)
$$;

create or replace function app.caregiver_edits(p_patient uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.patient_caregivers pc
    join public.patients p on p.id = pc.patient_id
    where pc.patient_id = p_patient and pc.user_id = auth.uid()
      and pc.removed_at is null and pc.may_edit_deck and p.erased_at is null)
$$;

create or replace function app.admin_of(p_care_home uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_home_members m
    where m.care_home_id = p_care_home and m.user_id = auth.uid()
      and m.role = 'care_home_admin' and m.removed_at is null)
$$;
```

### 8.3 The grant floor

```sql
revoke all on schema public from public;
alter default privileges in schema public revoke all on tables from public, anon, authenticated;

grant usage on schema public to caregiver_role, admin_role, service_role;
grant usage on schema public to device_role;         -- reaches events/sessions and nothing else
grant usage on schema device   to device_role;
grant usage on schema research to researcher_role;
-- link gets no usage grant to anyone but research_definer and service_role
revoke all on schema link from public, anon, authenticated,
       caregiver_role, admin_role, researcher_role, device_role;

revoke all on all tables in schema public from device_role, researcher_role;
```

Device grants — **the complete list**:

```sql
grant insert (event_id, device_id, patient_id, session_id, boot_id, seq, batch_id,
              device_wall_ms_at_send, type, payload, t_wall_ms, t_mono_ms, client_version)
  on public.events to device_role;

grant insert (session_id, device_id, patient_id, boot_id, started_wall_ms, session_mode,
              claimed_prime_condition, claimed_m2_condition, claimed_session_ordinal,
              patient_ui_version, scheduler_version, content_set_version, client_version)
  on public.sessions to device_role;

grant select on device.content, device.roster to device_role;
```

That is everything. No `select` on `public.*`. No `update` or `delete` anywhere. No `usage` on any sequence. No `execute` on any function except the two the sync path needs. **Column-level `insert` grants are the mechanism that makes "the device cannot stamp its own anchor" a privilege failure rather than a code convention** — a device naming `anchored_at_ms` in an `INSERT` gets `permission denied for column`, and no trigger, policy or code review is involved.

Researcher grants — **the complete list**:

```sql
grant select on all tables in schema research to researcher_role;
alter default privileges in schema research grant select on tables to researcher_role;
```

Nothing else. No `public`, no `link`, no functions, no storage.

Storage: `device_role` has **no** grant on `storage.objects` at all. Media reaches a tablet only through short-lived signed URLs minted by the sync function. Caregivers get a path-scoped policy:

```sql
create policy media_rw_caregiver on storage.objects for all to caregiver_role
using      (bucket_id = 'patient-media'
            and app.caregiver_reads(((storage.foldername(name))[2])::uuid))
with check (bucket_id = 'patient-media'
            and app.caregiver_edits(((storage.foldername(name))[2])::uuid));
```

### 8.4 Policies

Every table gets `enable row level security` and `force row level security` (so the owner is not exempt), except the derived tables, which are written exclusively by `service_role` and which use `enable` without `force` so the derivation job can rebuild them.

```sql
alter table public.patients enable row level security;
alter table public.patients force row level security;

create policy patients_caregiver_select on public.patients for select to caregiver_role
  using (app.caregiver_reads(id));

create policy patients_admin_all on public.patients for all to admin_role
  using      (app.admin_of(care_home_id))
  with check (app.admin_of(care_home_id));

-- no policy for device_role or researcher_role: zero rows, by absence
```

Items, media, people — caregiver-scoped, admin-scoped, and a `with check` that refuses writes without live care-delivery consent:

```sql
alter table public.items enable row level security;
alter table public.items force row level security;

create policy items_caregiver_select on public.items for select to caregiver_role
  using (app.caregiver_reads(patient_id));

create policy items_caregiver_write on public.items for insert to caregiver_role
  with check (app.caregiver_edits(patient_id)
              and app.consent_is_effective(patient_id, 'care_delivery'));

create policy items_caregiver_update on public.items for update to caregiver_role
  using      (app.caregiver_edits(patient_id))
  with check (app.caregiver_edits(patient_id)
              and app.consent_is_effective(patient_id, 'care_delivery'));

-- nobody may delete an item; retirement is an UPDATE, deletion is erasure only
create policy items_no_delete on public.items for delete to caregiver_role, admin_role
  using (false);
```

Consent tables — deliberately narrower than the content tables, because a caregiver who may edit a deck is not automatically a person who may record consent:

```sql
alter table public.consent_grants enable row level security;
alter table public.consent_grants force row level security;

create policy consent_select on public.consent_grants for select
  to caregiver_role, admin_role
  using (app.caregiver_reads(patient_id) or app.admin_of(
           (select care_home_id from public.patients p where p.id = patient_id)));

create policy consent_insert on public.consent_grants for insert
  to caregiver_role, admin_role
  with check (
    app.caregiver_reads(patient_id)
    and granted_by = auth.uid()
    -- P22: a consultee grant must name a consultee who is not paid staff of the home
    and (pathway <> 'consultee' or exists (
          select 1 from public.patient_caregivers pc
          where pc.patient_id = consent_grants.patient_id
            and pc.user_id = consent_grants.consultee_user_id
            and pc.is_consultee and pc.removed_at is null)));

-- withdrawal is the only permitted UPDATE, and only ever sets withdrawn_*
create policy consent_withdraw on public.consent_grants for update
  to caregiver_role, admin_role
  using      (app.caregiver_reads(patient_id) and withdrawn_at is null)
  with check (withdrawn_at is not null and withdrawn_by = auth.uid());
```

Device-written tables:

```sql
alter table public.events enable row level security;
alter table public.events force row level security;

create policy events_device_insert on public.events for insert to device_role
  with check (device_id = app.device_id()
              and app.device_serves_patient(patient_id)
              and app.consent_is_effective(patient_id, 'care_delivery'));

-- no SELECT policy for anyone but service_role. Caregivers and researchers
-- never touch the raw log; they read interactions / research views.
```

Same shape for `sessions`. Note the `with check` calls `app.consent_is_effective`: a withdrawn patient's tablet cannot even deposit telemetry. Its outbox retains the rows and the sync function returns a `revocation` for that patient, which is what actually wipes the device.

### 8.5 The `policies.ts` expectation table this produces

Written from the spec, never from the SQL (ADR §6.1). Every row below is a blind-writable test.

```ts
export const policyExpectations = [
  { role: 'device', table: 'events',   verb: 'insert',
    allowedWhen: 'device_id equals the token device_id AND patient is assigned to that device AND care_delivery consent is effective',
    deniedWhen:  'patient belongs to another device, or consent is withdrawn/expired, or the row names a server-owned column' },
  { role: 'device', table: 'events',   verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: 'sessions', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: 'patients', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: 'items',    verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: 'interactions', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'device', table: '*',        verb: 'update', allowedWhen: 'never', deniedWhen: 'always' },
  { role: 'device', table: '*',        verb: 'delete', allowedWhen: 'never', deniedWhen: 'always' },
  { role: 'device', view:  'device.roster',  verb: 'select',
    allowedWhen: 'patient is assigned to the token device and not erased',
    zeroRowsWhen: 'patient is on another device, another home, or erased' },
  { role: 'device', view:  'device.content', verb: 'select',
    allowedWhen: 'item belongs to an assigned patient, is not retired, is not absorbing, and all its media are ready',
    zeroRowsWhen: 'item retired, absorbing, media pending, or patient unassigned' },

  { role: 'researcher', table: 'patients',        verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'researcher', table: 'interactions',    verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'researcher', table: 'media_objects',   verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'researcher', table: 'link.participant_map', verb: 'select',
    allowedWhen: 'never', deniedWhen: 'always — permission denied for schema link' },
  { role: 'researcher', view:  'research.interaction', verb: 'select',
    allowedWhen: 'the participant has effective research_analytics consent',
    zeroRowsWhen: 'consent withdrawn, lapsed, dissent observed, or participant erased' },
  { role: 'researcher', view:  'research.*',      verb: 'insert', allowedWhen: 'never', deniedWhen: 'always' },

  { role: 'caregiver', table: 'patients', verb: 'select',
    allowedWhen: 'a live patient_caregivers row with may_view_moments',
    zeroRowsWhen: 'removed_at is set, or a different patient' },
  { role: 'caregiver', table: 'items', verb: 'insert',
    allowedWhen: 'may_edit_deck AND care_delivery consent effective',
    deniedWhen:  'consent withdrawn or reaffirmation overdue' },
  { role: 'caregiver', table: 'items', verb: 'delete', allowedWhen: 'never', deniedWhen: 'always' },
  { role: 'caregiver', table: 'interactions', verb: 'select', allowedWhen: 'never', zeroRowsWhen: 'always' },
  { role: 'caregiver', view: 'public.caregiver_moments', verb: 'select',
    allowedWhen: 'may_view_moments on that patient',
    zeroRowsWhen: 'permission removed at the patient’s request' },
] as const;
```

The three `interactions` rows are load-bearing: **no human role has any grant on `interactions`.** The caregiver reads `caregiver_moments`, a view containing dates, item names and narration lengths and *no accuracy column of any kind* — ND-22 as a missing column, not as a product decision someone could reverse in a sprint.

### 8.6 The device's two views

```sql
create view device.roster
with (security_invoker = false, security_barrier = true) as
  select p.id as patient_id, p.display_first_name, m.sha256 as avatar_sha256
  from public.patients p
  join public.device_patients dp on dp.patient_id = p.id
  left join public.media_objects m on m.id = p.avatar_media_id
  where dp.device_id = app.device_id()
    and p.erased_at is null
    and app.consent_is_effective(p.id, 'care_delivery');

create view device.content
with (security_invoker = false, security_barrier = true) as
  select i.id as item_id, i.patient_id, i.tier, i.one_sentence, i.content_language,
         i.era_decade, i.content_is_generic, i.is_probe,
         dp2.display_name as person_display_name, dp2.status as person_status,
         im.role as media_role, mo.sha256, mo.mime, mo.bytes, mo.kind
  from public.items i
  join public.device_patients dpx on dpx.patient_id = i.patient_id
  left join public.depicted_persons dp2 on dp2.id = i.depicted_person_id
  join public.item_media im on im.item_id = i.id
  join public.media_objects mo on mo.id = im.media_id
  where dpx.device_id = app.device_id()
    and i.retired_at is null
    and i.absorbing_since is null
    and mo.state = 'ready'
    and mo.erased_at is null
    and app.consent_is_effective(i.patient_id, 'care_delivery')
    -- ND-12 / P16: a deceased person never reaches a recognition mechanic
    and (dp2.status is null or dp2.status <> 'do_not_show')
    and (dp2.status is null or dp2.status <> 'deceased' or i.tier = 'tier3');
```

Both are `security_invoker = false` and owned by `device_view_owner`, a role with `select` on the base tables and a matching `to device_view_owner using (true)` policy on each. The device's grant is on the view; it has none on anything the view reads. `display_first_name` is the only name that crosses; there is no surname, DOB, room, diagnosis or history column in either view, which is exactly ADR §5.3's stolen-tablet claim made structural.

---

## 9. THE RESEARCH PLANE

### 9.1 The mapping lives where nobody can reach it

```sql
create table link.participant_map (
  patient_id            uuid primary key references public.patients(id) on delete cascade,
  participant_pseudonym text not null unique default encode(gen_random_bytes(9), 'base32'),
  created_at            timestamptz not null default now()
);

revoke all on schema link from public, anon, authenticated,
       caregiver_role, admin_role, researcher_role, device_role;
revoke all on all tables in schema link from public, anon, authenticated,
       caregiver_role, admin_role, researcher_role, device_role;
grant usage on schema link to research_definer, service_role;
grant select on link.participant_map to research_definer;
```

The pseudonym is **random bytes, not a hash of the patient id**. A keyed HMAC would mean a single leaked key re-identifies the entire cohort by brute-forcing a small id space. A random surrogate has no algebraic relationship to anything; re-identification requires the table, and the table requires a grant that does not exist. That is a structural property, not an operational one.

### 9.2 Definer views, and why the researcher's inability is not a `WHERE` clause

```sql
create role research_definer nologin;
grant usage on schema public, link to research_definer;
grant select on public.interactions, public.session_outcomes, public.sessions,
                public.items, public.study_participants, public.adverse_events,
                public.consent_events, public.consent_grants, public.patients,
                public.clinician_assessments, public.medication_and_comorbidity
  to research_definer;

-- explicit RLS bypass for the definer, written as a policy so it is auditable
create policy research_definer_reads on public.interactions
  for select to research_definer using (true);
-- (repeated per table)
```

```sql
create view research.interaction
with (security_invoker = false, security_barrier = true) as
select
  pm.participant_pseudonym,
  x.interaction_id,
  x.session_id,
  sp.m3_arm                                as study_arm,
  (x.anchored_at at time zone 'UTC')::date - p.enrolled_on  as day_offset_from_enrollment,
  x.time_of_day_bucket,
  x.local_hour,
  x.session_ordinal_today,
  x.administered_by,
  x.app_version, x.scheduler_algorithm_version, x.content_set_version,
  x.scoring_rubric_version, x.patient_ui_version,
  x.device_class, x.os_version, x.screen_css_px, x.device_pixel_ratio,
  x.display_refresh_hz, x.input_modality,
  -- item identity is a per-participant surrogate, never the real item_id
  encode(hmac(x.item_id::text, pm.participant_pseudonym::bytea, 'sha256'), 'hex') as item_key,
  x.item_is_probe, x.item_tier, x.repetition_number, x.lapse_count,
  x.days_since_last_review, x.days_since_first_introduction,
  x.scheduled_interval_days, x.interval_deviation_days,
  x.stability, x.difficulty, x.retrievability, x.predicted_recall_probability,
  x.within_session_rung, x.attained_rung, x.presentation_mode, x.n_distractors,
  x.hint_level_reached, x.n_hints, x.time_to_first_hint_ms, x.rescued_to_success,
  x.content_class, x.relationship_category, x.era_decade,
  x.caregiver_rated_emotional_valence, x.caregiver_rated_importance,
  x.media_type, x.n_media_assets, x.cue_modality, x.content_language,
  x.content_is_generic, x.person_status, x.content_provenance,
  x.latency_to_first_input_ms, x.total_response_time_ms, x.decision_time_ms,
  x.app_backgrounded_ms, x.n_backgrounds, x.interrupted,
  x.n_answer_changes, x.n_taps, x.mean_tap_hold_ms, x.sd_tap_hold_ms,
  x.dwell_before_first_touch_ms, x.pointer_path_length_px,
  x.n_direction_reversals, x.off_target_tap_offset_px,
  x.correct, x.grade, x.error_type,
  x.utterance_duration_ms, x.speech_rate_wpm, x.articulation_rate,
  x.n_pauses, x.mean_pause_ms, x.max_pause_ms, x.n_filled_pauses,
  x.voiced_ratio, x.type_token_ratio, x.asr_confidence, x.asr_language,
  x.distress_signal, x.distress_signal_source,
  x.difficulty_floor_triggered, x.item_absorbing_state_entered
from public.interactions x
join public.patients p            on p.id = x.patient_id
join link.participant_map pm      on pm.patient_id = x.patient_id
join public.study_participants sp on sp.patient_id = x.patient_id
where p.erased_at is null
  and app.consent_is_effective(x.patient_id, 'research_analytics')
  and (x.utterance_duration_ms is null
       or app.consent_is_effective(x.patient_id, 'speech_features'));

alter view research.interaction owner to research_definer;
grant select on research.interaction to researcher_role;
```

What makes the de-identification structural rather than a filter:

- The researcher has **no privilege on `public.interactions`**. Dropping the view leaves them with nothing, not with the raw table.
- The researcher has **no `usage` on schema `link`**. `select * from link.participant_map` is `ERROR: permission denied for schema link` — a privilege error, not an empty result.
- `patient_id`, `full_name`, `display_first_name`, `sha256`, `storage_path`, `anchored_at`, `response_text_hash` and every free-text column are **absent from the select list**. They are not filtered out; they were never projected.
- `day_offset_from_enrollment` is computed inside the definer view from `patients.enrolled_on`, a column the researcher cannot read. No real date can be reconstructed from an offset without the anchor, and the anchor is behind a missing grant.
- `item_key` is HMAC'd **per participant**, so the same photograph in two participants' decks produces two unrelatable keys. Cross-participant content linkage is not merely hidden; it does not exist in the exported values.
- Media are absent entirely. There is no `research` view over `media_objects`, `media_subjects`, `depicted_persons` or storage. P20/§1.11 says full-face photographs and voiceprints cannot be de-identified, only removed; the removal is the absence of a view.
- Transcripts are never persisted anywhere (§8.4.2). Only the speech *features* columns exist, and they are gated on a separately-withdrawable `speech_features` consent — which is the P23 hole-closure implemented rather than promised.

Companion views, same construction: `research.session`, `research.participant`, `research.adverse_event`, `research.consent_event`, `research.probe_trial` (`where item_is_probe`), `research.clinician_assessment`, `research.medication_and_comorbidity`, and `research.derived_variables` for the versioned computed measures.

`research.participant` deserves one note: it exposes `age_band`, never DOB; `dementia_subtype`, `severity_band`, `fluctuation_band_high`, `first_language`, `country_locale`, `prior_computer_use`, `apathy_score`, `capacity_status`, `consent_pathway`. `country_locale` plus `age_band` plus `dementia_subtype` is a small-cell disclosure risk in a pilot of a few dozen dyads; the mitigation is a `k`-suppression rule applied in the export job (cells below 5 collapse to a coarser band), documented in the codebook, and it is a real residual because a definer view cannot enforce it per-query.

### 9.3 Consent withdrawal removes rows by construction

Every research view inner-joins `app.consent_is_effective`. A withdrawal, a lapsed reaffirmation, an observed dissent, or a lapsed capacity review all make the predicate false, and the participant's rows leave the research plane on the **next query**, with no job, no sweep, and no window during which a withdrawn participant is still queryable. That is the strongest single argument for the relational centre in this document: consent is a row, the policy is a join, and the join is evaluated every time.

---

## 10. HOW THE SERVER RECOMPUTES SCHEDULER STATE CANONICALLY

This is the hard question my position has to answer, and the answer is that **current state is authoritative for the human plane and explicitly a cache for the derived plane**, with the boundary drawn by write privilege rather than by convention.

### 10.1 The rule

> A table is authoritative if and only if no derivation may write it. A table is a cache if and only if `truncate` + replay reproduces it exactly. Every table in the schema is one or the other, and a migration lint asserts it: any table with a `derived_through_ord` column must be absent from every `GRANT INSERT/UPDATE` outside `service_role`, and any table without one must be absent from the derivation job's write set.

Two lists, checked against each other in CI. That is the whole discipline.

### 10.2 The fold

`supabase/functions/derive/index.ts` imports `src/domain/scheduler.ts` — the identical module the device runs, subject to the ADR §6.2 ESLint rules that forbid `Date`, `Math.random`, `crypto`, `fetch`, `window` and `document` inside `src/domain/**`. Given the same ordered event array it produces the same output on Deno and on Hermes, because it cannot read a clock or an entropy source.

```
for each patient with an open derivation_jobs row:
  begin
    events := select * from events where patient_id = $1 order by ord_key
    state  := scheduler.replay(events, contentSnapshot(patient), participantConfig)
    delete from interactions      where patient_id = $1
    delete from session_outcomes  where patient_id = $1
    delete from item_schedule     where patient_id = $1
    insert  state.interactions, state.sessionOutcomes, state.itemSchedule
    upsert  patient_derivation_state (derived_through_ord, input_digest, versions)
  commit
```

**Full rebuild, always. No snapshots, no incremental fold, no upcasters.** The arithmetic: ~500 events/session × 3 sessions/day × 90 days ≈ 135,000 events for a full pilot participant. A pure-TS fold over 135k small objects is well under a second; the dominant cost is the round trip. At 40 participants the entire cohort rebuilds in under a minute. Incremental derivation would buy nothing and would introduce the one bug class that is genuinely hard to find — a projection that is correct forward and wrong on replay.

This is also why late events are a non-event. A tablet that reconnects after three days inserts rows whose `anchored_at_ms` places them mid-stream; the ingest enqueues a `late_event` job; the fold runs from scratch; the result is byte-identical to what would have happened had the tablet never gone offline. There is no reconciliation code because there is nothing to reconcile.

### 10.3 Versioning is a feature, not a hazard

`scheduler_version` and `scoring_rubric_version` are columns on `patient_derivation_state` and on every derived row. Bumping either enqueues a cohort-wide rebuild. Product shape §8.2 surface C requires exactly this: drift, trajectory and progression are "computed offline in the analysis plane by the investigator, as versioned recomputable derived variables." A relational derived plane with a version column *is* that requirement; an event-sourced projection with a snapshot cadence is that requirement plus a snapshot-invalidation bug waiting to happen.

### 10.4 What the device's local projection is for, and why divergence is information

The device runs the same module offline to pick the next card. It never uploads that state — ADR §4.2's SQLite manifest has no `schedule_state` table and this proposal does not add one. What the device *does* upload is what it showed: `within_session_rung`, `hint_level_reached`, `presentation_mode`, timings. Those are observations, not model state.

The server, having replayed the same events through the same module, knows what rung it *would* have shown. If they differ, exactly three things can be true: the device is on an older `scheduler_version` (visible in `sessions.scheduler_version`), the content snapshot differed (visible in `content_set_version`), or something is wrong. A `rung_divergence` flag is raised with all three versions attached. This is a free continuous conformance test between the two runtimes of the same module, and it exists only because the server keeps a canonical current-state row to compare against.

---

## 11. HOW DEVICE-WRITTEN STATE IS NEVER TRUSTED

Six mechanisms, ordered by how early they stop an attack.

**1. Privilege.** `device_role` has `insert` on two tables at column granularity and `select` on two views. No `update`, no `delete`, no `select` on any base table, no sequence usage, no storage grant, no function execute beyond the sync entry point. A tablet in a thief's hands, with a valid unrevoked token, cannot read one row of research data and cannot alter or destroy one row of anything.

**2. Column-level grants.** `anchored_at_ms`, `server_received_at`, `care_home_id` and `ingest_id` are not in the device's `INSERT` grant. Naming them is `permission denied for column`, at parse time, before any policy runs. Server-owned truth is enforced by the privilege system, not by a `BEFORE` trigger that a future migration could drop.

**3. `WITH CHECK` predicates.** `device_id = app.device_id()` binds a row to the token that wrote it. `app.device_serves_patient(patient_id)` binds it to an assignment that an admin controls. `app.consent_is_effective(patient_id,'care_delivery')` binds it to a live consent. A compromised tablet cannot write an event about a patient in another ward, another home, or a patient who withdrew this morning.

**4. Immutability.** No `update`, no `delete`, plus `event_id` as PK and `(device_id, boot_id, seq)` unique. The worst a compromised device can do is *add* rows within its own patient scope. It cannot rewrite history, cannot delete an adverse event, and cannot suppress a distress signal — and its `seq` gaps make suppression by omission detectable.

**5. Nothing device-written is ever read as state.** `interactions`, `session_outcomes` and `item_schedule` are produced by the server's fold. `sessions.claimed_*` columns carry the prefix precisely so that a query reading them as fact is visible in review. The research views project the recomputed columns, never the claimed ones. The caregiver view reads derived rows. The device's two views read human-written content. **There is no path from a device INSERT to a value any surface renders without passing through a server-side pure function.**

**6. The trust boundary is a role switch, not a code convention.** The sync Edge Function calls Postgres **as the device**, using the anon key plus the device's own access token, so RLS and grants apply to the ingest path. It does not hold `service_role`. Derivation is a *separate* invocation, triggered by a `derivation_jobs` row, running as `service_role`, and it reads only rows that have already passed RLS. Device input never reaches privileged code in the same call stack. A sync function holding `service_role` and "checking the JWT itself" would make every mechanism above decorative, and it is the single most likely way to build this wrong.

Belt and braces: `enforce_biometric_release`, `enforce_interval_ceiling`, `retired_by_a_human`, `pca_excluded`, `uncued_failure_only_on_probe` and `audio_container_is_playable` are constraints and triggers, so they hold against `service_role` too. The derivation job is trusted code; it is not exempt from ND-8, ND-9, ND-35 or §5.2.

---

## 12. DELETION AND EXPORT

### 12.1 Deletion is a staged, observable process, not a `DELETE`

```sql
create table public.erasure_requests (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.patients(id) on delete set null,
  patient_id_frozen uuid not null,               -- survives the cascade, for the ledger
  care_home_id      uuid not null,
  requested_at      timestamptz not null default now(),
  requested_by      uuid references public.user_profiles(auth_user_id),
  requester_role    text not null,
  scope             text not null check (scope in ('media_only','item','full_patient')),
  scope_key         text,
  stage             erasure_stage not null default 'requested',
  rows_purged_at        timestamptz,
  storage_purged_at     timestamptz,
  revocations_issued_at timestamptz,
  devices_confirmed_at  timestamptz,
  completed_at          timestamptz,
  pending_device_ids    uuid[] not null default '{}'
);

create table public.erasure_ledger (
  id                    uuid primary key default gen_random_uuid(),
  erasure_request_id    uuid not null,
  participant_pseudonym text,                    -- pseudonym only; no patient identifier
  care_home_id          uuid not null,
  completed_at          timestamptz not null,
  counts                jsonb not null,          -- rows and bytes destroyed, by table
  devices_confirmed     int not null,
  devices_unconfirmed   int not null,
  unconfirmed_expiry_at timestamptz              -- when the last unconfirmed device stops rendering
);
```

### 12.2 The stages

1. **`requested`.** Row created. `app.consent_is_effective` is unaffected yet, deliberately — a half-erased patient must not become invisible before the media are gone, or the erasure job loses its own work list.
2. **`rows_purged`.** `delete from patients where id = $1` inside one transaction. `on delete cascade` reaches `decks → items → item_media`, `media_objects`, `depicted_persons → media_subjects → depicted_person_releases`, `consent_grants`, `consent_events`, `capacity_assessments`, `events`, `sessions`, `interactions`, `session_outcomes`, `item_schedule`, `adverse_events`, `clinician_assessments`, `medication_and_comorbidity`, `device_patients`, `link.participant_map`. Every FK in §4–§6 is written `on delete cascade` for exactly this reason; the two `on delete restrict` edges (`patients.care_home_id`, `item_media.media_id`) are deliberate and are released in step order.
3. **`storage_purged`.** Delete every `storage.objects` row under `patient/<id>/`. Because content addressing is per-patient (§4.4), this is a prefix delete with no reference counting and no possibility of destroying another patient's bytes.
4. **`revocations_issued`.** One `revocations` row per erased `sha256`, plus one `subject_type='patient'` row. `pending_device_ids` is populated from `device_patients` as it stood before the cascade — captured in step 1, which is why the cascade is not the first thing that happens.
5. **`devices_confirmed`.** Each tablet pulls revocations by `care_home_id` and cursor, deletes `${documentDirectory}media/<sha256>` and the SQLite rows, and emits a `revocation_acked` event. The derivation job writes `revocation_acks`. When `pending_device_ids` empties, the stage advances.
6. **`complete`.** `erasure_ledger` row written. It contains the pseudonym, counts, and nothing that identifies the person.

### 12.3 The honest hole, named

A device that never reconnects never acks. The design does not pretend otherwise:

- `content_valid_until` (default 7 days, minimum 4) means an unreachable tablet stops rendering *anything*, including the erased photograph, within a week. Erasure inherits that guarantee for free.
- `erasure_ledger.devices_unconfirmed` and `unconfirmed_expiry_at` are written into the record, so the DPO has the number rather than an assumption.
- Revoking the device's auth user is the belt: the next `signInWithPassword` fails and the client wipes SQLite, the media directory and both Keychain items before rendering.
- ADR §8's requirement that this gets its own integration test stands. The test is: enrol two devices, seed a photo on both, erase, sync one device, assert the file is gone from its filesystem and the request is stuck at `revocations_issued` with one pending device, then sync the second and assert `complete`.

The one thing this design refuses to do is mark the request `complete` when the rows are gone from Postgres. A photograph of a person on a tablet in a care home is the thing that has to disappear, and the state machine says so in its column names.

### 12.4 Research plane and erasure — the decision

The cascade reaches `link.participant_map` and `interactions`, so **erasure removes the participant from the research plane too**. There is no tombstone, no "anonymised remainder", no retention of already-de-identified rows.

This is a real cost: it means a completed analysis can become non-reproducible if a participant erases afterwards. The alternative — keeping pseudonymous rows after erasure on the argument that they are no longer personal data — is defensible under GDPR recital 26 and indefensible under the requirement as written ("full delete") and under §1.11's position that this data can never be truly de-identified while a mapping ever existed. The requirement wins. The mitigation is procedural: published analyses cite a frozen, dated export archive held under the REC-approved retention schedule, and that archive's provenance is recorded in the protocol. Stated as a tradeoff in §13, not hidden.

### 12.5 Export

`export-patient` (ADR §9) runs as `service_role`, takes a `patient_id`, and emits a signed ZIP: a JSON document per table joined by patient, plus the original media bytes, plus the raw `events` stream, plus a manifest with per-file sha256. It is authorised by `app.caregiver_reads(patient_id)` checked with the *caller's* token before any privileged work, and the request is recorded:

```sql
create table public.export_requests (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  requested_at timestamptz not null default now(),
  requested_by uuid not null references public.user_profiles(auth_user_id),
  delivered_at timestamptz,
  manifest_sha256 text,
  bytes        bigint
);
```

Export includes the raw event log deliberately. The subject-access right is to the data held, and the data held includes the telemetry — writing it out is trivial precisely because it is one append-only table with a stable schema.

---

## 13. TRADEOFFS, STATED

1. **`item_schedule` is a cache and I am calling it one.** A reader who wants "current state is authoritative, full stop" does not get it. What they get instead is a rule with a CI check behind it: every table with `derived_through_ord` is `truncate`-safe and service-role-only, and every table without one is human-written. The boundary is mechanical, but it is a boundary the reader has to hold in their head, and an all-events or all-rows design would not ask that.

2. **Full rebuild does not scale past a pilot.** 135k events per participant folds in under a second; 40 participants rebuild in under a minute. At 4,000 participants and two years of data, this becomes a batch job with a queue and, eventually, snapshots — the exact machinery I deleted. I am trading future work for present simplicity, deliberately, because the pilot's binding risk is recruitment failure (F7) and not throughput.

3. **Custom Postgres roles are the load-bearing assumption.** "De-identification is a missing grant" requires `researcher_role` to be a real role that PostgREST switches into. If the target Supabase project does not honour a custom `role` claim end to end, the fallback (a second PostgREST with `PGRST_DB_ANON_ROLE=researcher_role`) preserves the property but adds a deployment target. Verify in week 1; do not discover it at handoff.

4. **Per-patient media dedupe wastes bytes.** Two residents with the same wedding photograph store it twice. That is the price of an erasure path with no reference counting, and at 8–10 photographs per deck the absolute waste is negligible. If it ever is not, the fix is a shared object table with a refcount — and a much harder deletion proof.

5. **`interactions` is a wide table with ~90 columns.** It is the §7 specification transcribed, and §8.4 requires every field to carry a named pre-registered analysis or not ship. A narrower design would normalise timing, hesitation and speech features into satellite tables; that buys a cleaner ER diagram and costs three joins on the most-queried object in the system. I chose the wide table and I would rather defend column count than join count.

6. **Erasure destroys research rows and can break reproducibility.** §12.4. The alternative retains pseudonymous data after a deletion request, which reads badly in a DPIA for a product whose §1.11 position is that this data is never truly de-identifiable. Frozen dated export archives under the REC retention schedule are the mitigation, and they are a procedural control where an engineer would prefer a technical one.

7. **Small-cell disclosure in `research.participant` is a residual.** `age_band` × `dementia_subtype` × `country_locale` in a cohort of forty is identifying to anyone who knows the study. `k`-suppression lives in the export job and in the codebook, not in the view, because a definer view cannot count cells per query. Named, not solved.

8. **Consent evaluated on every read costs something.** `app.consent_is_effective` runs per row-batch in every research view and every device view. It is `stable`, so Postgres caches it per statement per argument, and the underlying lookups are single-index. Measured cost at pilot scale is negligible; at cohort scale the answer is a materialised `consent_effective(patient_id, purpose)` table refreshed on every consent write — which is a projection, and which I would then have to hold to the same `truncate`-safe rule as everything else in §10.1.

9. **Enums over lookup tables makes value additions migrations.** `alter type ... add value` cannot run inside a transaction block with other DDL on some Postgres versions, so a new `adverse_category` is its own migration. Accepted: the sets are frozen by governing documents, and a join per content read to model four values is worse.

10. **The device's `claimed_*` columns are dead weight if the server always recomputes.** They are kept because the mismatch is the conformance signal (§10.4). If `arm_mismatch` never fires in six months of pilot, drop the columns and the check; keeping them forever "for safety" would be the speculative flexibility CLAUDE.md §2 forbids.
