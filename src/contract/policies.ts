/**
 * C12 — the RLS expectation table, as DATA.
 *
 * Written FROM the specification (ADR-DATA §13), never from the SQL migrations,
 * so an agent that has never seen a line of the migrations can iterate it.
 *
 * `deniedWhen` distinguishes the TWO failure shapes explicitly, because they are
 * DIFFERENT assertions and the suite must never conflate them (ADR-DATA §12.1):
 *   - a string beginning `'ALWAYS. 42501'` (or `'ALWAYS'` / `'42501'`) asserts an
 *     insufficient-privilege error — a GRANT is missing, and a grant cannot be edited away.
 *   - a string beginning `'ZERO ROWS'` asserts an empty result — a POLICY ran, and a
 *     policy is what does the scoping.
 *
 * Source: ADR-DATA §13 (the complete literal), §12 (the per-role policy design),
 * §6/§12.1 (the 42501-vs-zero-rows distinction), §3 (the information_schema assertions);
 * MODULES §6 LAYER C C12.
 *
 * deps: none. Pure data. No runtime imports.
 */

export interface PolicyExpectation {
  role: string;
  object: string;
  verb: string;
  allowedWhen: string;
  deniedWhen: string;
}

export const policyExpectations: readonly PolicyExpectation[] = [
  // ── device: the entire reachable surface, and it is four rows ─────────────────────────
  { role: 'device', object: 'device.device_roster', verb: 'select',
    allowedWhen: 'patient is assigned to the token device_id, device not revoked, care_delivery consent effective',
    deniedWhen: 'ZERO ROWS when the patient belongs to another device/ward/home, or consent is withdrawn, or dissent is active, or the patient is erased' },
  { role: 'device', object: 'device.device_content', verb: 'select',
    allowedWhen: 'as roster, and the item is not retired, not absorbing, and ALL its media are ready',
    deniedWhen: 'ZERO ROWS when the item is retired, absorbing, has any non-ready media, or names a do_not_show person' },
  { role: 'device', object: 'ingest.event', verb: 'insert',
    allowedWhen: 'device_id equals the token device_id AND the device has EVER been assigned that patient',
    deniedWhen: '42501 when device_id is any other value, or the device was never assigned that patient' },
  { role: 'device', object: 'ingest.session', verb: 'insert',
    allowedWhen: 'same as ingest.event',
    deniedWhen: '42501, same as ingest.event' },

  // ── device: the negatives that matter ────────────────────────────────────────────────
  { role: 'device', object: 'ingest.event', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501: no select grant exists on ingest.*' },
  { role: 'device', object: 'log.event_log', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501: no usage on schema log' },
  { role: 'device', object: 'app.patients', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501: no usage on schema app for select' },
  { role: 'device', object: 'app.items', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'device', object: 'proj.interaction', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501: no usage on schema proj' },
  { role: 'device', object: 'storage.objects', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. no grant, no policy' },
  { role: 'device', object: '*', verb: 'update', allowedWhen: 'never', deniedWhen: 'ALWAYS, in every schema, on every object' },
  { role: 'device', object: '*', verb: 'delete', allowedWhen: 'never', deniedWhen: 'ALWAYS, in every schema, on every object' },
  { role: 'device', object: 'ingest.event', verb: 'insert-naming-server-column', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 42501 "permission denied for column" at parse time — anchored_at_ms, ingest_seq, chain_pos and received_at are not in the column-level grant' },
  { role: 'device', object: 'ingest.event', verb: 'insert-returning', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. RETURNING requires SELECT; the client must send Prefer: return=minimal' },
  { role: 'device', object: 'ingest.event', verb: 'insert-duplicate-event_id', allowedWhen: 'always',
    deniedWhen: 'never — the second insert of the same event_id is a NO-OP, not an error' },
  { role: 'device', object: 'ingest.event', verb: 'insert-batch-with-one-bad-row', allowedWhen: 'always',
    deniedWhen: 'never — the good rows commit and the bad row appears in log.quarantine. A batch is NEVER aborted by one row' },
  { role: 'device', object: 'ingest.event', verb: 'ack-is-per-id', allowedWhen: 'always',
    deniedWhen: 'never — /sync returns {accepted, quarantined}; HTTP 201 alone is NOT an ACK and the device must not delete an unlisted outbox row' },
  { role: 'device', object: 'ingest.event', verb: 'insert-after-consent-withdrawn', allowedWhen: 'ALWAYS',
    deniedWhen: 'never — consent governs USE, not RECEIPT. A withdrawn patient\'s tablet must still be able to deposit the evidence' },
  { role: 'device', object: 'ingest.event', verb: 'insert-after-reassignment', allowedWhen: 'ALWAYS, for a patient the device was ever assigned',
    deniedWhen: 'never — the three-day backlog of a reassigned tablet must still land' },
  { role: 'device', object: 'auth.users', verb: 'update-app_metadata', allowedWhen: 'never',
    deniedWhen: 'ALWAYS; and a token re-minted after the attempt still carries role=device' },

  // ── append-only, for every role including the owner and service_role ─────────────────
  { role: '*', object: 'log.event_log', verb: 'update', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501 from the trigger, even for the table owner' },
  { role: '*', object: 'log.event_log', verb: 'delete', allowedWhen: 'never', deniedWhen: 'ALWAYS, except inside ops.execute_chain_break under the log.erasure_context GUC' },
  { role: '*', object: 'log.event_log', verb: 'truncate', allowedWhen: 'never', deniedWhen: 'ALWAYS' },
  { role: '*', object: 'app.consent_events', verb: 'update', allowedWhen: 'never', deniedWhen: 'ALWAYS. Corrections are superseding rows' },
  { role: '*', object: 'app.consent_events', verb: 'delete', allowedWhen: 'never', deniedWhen: 'ALWAYS' },
  { role: '*', object: 'app.arm_assignment', verb: 'update', allowedWhen: 'never', deniedWhen: 'ALWAYS. A changed arm is a new superseding row and an integrity flag' },

  // ── researcher: de-identification IS the missing grant ───────────────────────────────
  { role: 'researcher', object: 'schema app', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'schema identity', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501 "permission denied for schema identity" — a privilege error, NOT an empty result' },
  { role: 'researcher', object: 'schema log', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'schema proj', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'schema research', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501 — the base tables are unreachable; only `analysis` views are' },
  { role: 'researcher', object: 'schema ops', verb: 'usage', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501 — the ops console is identified and is not the research surface' },
  { role: 'researcher', object: 'app.patients', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'app.media_objects', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'identity.participant_map', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'identity.subject_map', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'research.interaction', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501 — base table; reachable only through analysis.interaction' },
  { role: 'researcher', object: 'link.sever / link.project / link.pseudo_id', verb: 'execute', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'researcher', object: 'storage.objects', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. no grant, no policy' },
  { role: 'researcher', object: 'analysis.interaction', verb: 'select',
    allowedWhen: 'the participant is in a study the researcher has unexpired study_access to, AND the row is published in a release at or before the pinned release, AND research_behavioural consent was effective when the row was projected',
    deniedWhen: 'ZERO ROWS for another study, expired access, a release after the pin, a superseded generation, or a participant severed retrospectively' },
  { role: 'researcher', object: 'analysis.safety_register', verb: 'select',
    allowedWhen: 'ALWAYS for the researcher\'s own study, INCLUDING for participants who withdrew research consent or were severed prospectively',
    deniedWhen: 'ZERO ROWS only for another study or expired access' },
  { role: 'researcher', object: 'analysis.*', verb: 'insert/update/delete', allowedWhen: 'never', deniedWhen: 'ALWAYS. views owned by bridge; no write grant exists' },

  // ── caregiver ───────────────────────────────────────────────────────────────────────
  { role: 'caregiver', object: 'app.patients', verb: 'select',
    allowedWhen: 'a patient_caregivers row exists for auth.uid() with removed_at null',
    deniedWhen: 'ZERO ROWS for a revoked link, or any other patient including one in the same care home' },
  { role: 'caregiver', object: 'app.patients', verb: 'insert', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. There is no INSERT policy; enrolment is an RPC that also writes consent as study_staff' },
  { role: 'caregiver', object: 'app.patients', verb: 'update', allowedWhen: 'the link carries can_author_content',
    deniedWhen: 'the update changes ui_version_pinned, dementia_subtype, enrolled_on or tz_offset_minutes (P10 / §9 Gate 3)' },
  { role: 'caregiver', object: 'app.consent_events', verb: 'insert-subject-consented', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 23514 — a caregiver may never assert that the patient consented (P22 / MCA ss.30-33)' },
  { role: 'caregiver', object: 'app.consent_events', verb: 'insert-consultee-consented', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 23514 — no enum value on the consultee pathway means "consented"' },
  { role: 'caregiver', object: 'app.consent_events', verb: 'insert-initial', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 23514 — entry events require recorded_by_role in (clinician, study_staff)' },
  { role: 'caregiver', object: 'app.consent_events', verb: 'insert-withdrawal', allowedWhen: 'always', deniedWhen: 'never' },
  { role: 'caregiver', object: 'app.consent_events', verb: 'insert-dissent_observed', allowedWhen: 'always', deniedWhen: 'never' },
  { role: 'caregiver', object: 'app.depicted_persons', verb: 'insert-without-person_status', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 23502 — P16 is NOT NULL with no default and cannot be skipped' },
  { role: 'caregiver', object: 'app.media_objects', verb: 'set-state-ready-with-no-subject-and-no-attestation', allowedWhen: 'never',
    deniedWhen: 'ALWAYS. 23514 — absence of a tag must not read as absence of a person (BIPA 15(b))' },
  { role: 'caregiver', object: 'app.items', verb: 'delete', allowedWhen: 'never', deniedWhen: 'ALWAYS. using(false)' },
  { role: 'caregiver', object: 'log.event_log', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'caregiver', object: 'proj.interaction', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'caregiver', object: 'analysis.interaction', verb: 'select', allowedWhen: 'never', deniedWhen: 'ALWAYS. 42501' },
  { role: 'caregiver', object: 'app.my_moments', verb: 'select',
    allowedWhen: 'the link carries can_view_moments',
    deniedWhen: 'ZERO ROWS when the permission is removed at the patient\'s request; and the view exposes NO accuracy, score, count or trend column of any kind (ND-22)' },
  { role: 'caregiver', object: 'auth.users', verb: 'update-app_metadata', allowedWhen: 'never', deniedWhen: 'ALWAYS' },

  // ── care-home admin ─────────────────────────────────────────────────────────────────
  { role: 'carehome_admin', object: 'app.devices', verb: 'update',
    allowedWhen: 'the device\'s care_home_id is in the admin\'s memberships',
    deniedWhen: 'ZERO ROWS / 23514 for a device in another home' },
  { role: 'carehome_admin', object: 'app.items', verb: 'select', allowedWhen: 'never',
    deniedWhen: 'ALWAYS, using(false) — an admin manages tablets, not a resident\'s family photographs' },
  { role: 'carehome_admin', object: 'ops.request_erasure', verb: 'execute',
    allowedWhen: 'the patient is in the admin\'s care home',
    deniedWhen: '42501 for any other patient' },

  // ── structural invariants, asserted as data ─────────────────────────────────────────
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no app.patients row with dementia_subtype PCA or svPPA and a non-null enrolled_on can exist (ND-35)' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no column in ANY schema can hold a biometric template, embedding, descriptor, voiceprint, faceprint, speaker_id or face_bbox (P20)' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no column in schema research or analysis has type uuid, date, timestamp, timestamptz or interval (ND-18)' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no relation in schema analysis has relkind <> \'v\' (a materialised view would freeze the consent gate)' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no foreign key leaves schema research' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no FK path with ON DELETE CASCADE reaches log.event_log from auth.users or app.devices' },
  { role: '*', object: 'INVARIANT', verb: 'schema',
    allowedWhen: '-', deniedWhen: 'no table anywhere carries both a participant-pseudonym-shaped and a patient-identifier-shaped column' },
  { role: '*', object: 'INVARIANT', verb: 'data',
    allowedWhen: '-', deniedWhen: 'no event payload accepts a string outside {lowercase snake token, uuid, hex digest, dotted version}; a 5,000-name dictionary is rejected 5,000 times' },
  { role: '*', object: 'INVARIANT', verb: 'data',
    allowedWhen: '-', deniedWhen: 'anchored_at_ms is non-decreasing in seq for every device_id (SCHEDULER-SPEC 6.1)' },
  { role: '*', object: 'INVARIANT', verb: 'data',
    allowedWhen: '-', deniedWhen: 'a device_roster row disappears within one sync of dissent_observed, and within hard_expiry_days for an offline device' },
  { role: '*', object: 'INVARIANT', verb: 'data',
    allowedWhen: '-', deniedWhen: 'no research release publishes with k < 5 on the quasi-identifier tuple or on the deck-composition tuple' },
  { role: '*', object: 'INVARIANT', verb: 'data',
    allowedWhen: '-', deniedWhen: 'the ZZSENTINELZZ fuzz string, written into every free-text column in app AND into every event payload string field, appears zero times in schema research and in every analysis view' },
  { role: '*', object: 'INVARIANT', verb: 'code',
    allowedWhen: '-', deniedWhen: 'the /sync ingest path constructs its Supabase client from SERVICE_ROLE_KEY rather than from the device Authorization header (CI check on the function source)' },
] as const;

/**
 * The obligations the domain CANNOT defend and that must be enforced by the CALLER.
 * The scheduler is pure and integer-only; these five facts live outside its reach and,
 * if the caller does not honour them, produce a silent divergence rather than a type error.
 * Source: MODULES §6 LAYER C C12; SCHEDULER-SPEC §10 note 3 (E49), §17.3 note 4, §17.4,
 * §6.1 (E7); ADR-DATA §6.1; ADR-PLATFORM §6.1.
 */
export interface CallerObligation {
  id: string;
  statement: string;
}

export const callerObligations: readonly CallerObligation[] = [
  { id: 'E49',
    statement: 'nextTrial must receive a nowMonoMs drawn from the monotonic clock of activeSession.bootId — never a wall clock and never a value from a different boot (SCHEDULER-SPEC §10 note 3, E49).' },
  { id: 'sessionTelemetry-before-fold',
    statement: 'sessionTelemetry must be called BEFORE folding its SessionEnded event, because it reads the active-session snapshot that the fold then retires (SCHEDULER-SPEC §17.4).' },
  { id: 'trialTelemetry-before-fold',
    statement: 'trialTelemetry must be called BEFORE folding its TrialCompleted event, because it reads item/entry state that the fold then mutates (SCHEDULER-SPEC §17.3 note 4).' },
  { id: 'fold-monotonic-input',
    statement: 'fold\'s input must already satisfy §6.1 per-device monotonicity: events per deviceId are delivered in non-decreasing seq/anchor order. The domain assumes it and does not re-sort (SCHEDULER-SPEC §6.1; ADR-DATA §6.1).' },
  { id: 'E7',
    statement: 'One device per patient at a time: no two devices may drive the same patient concurrently, so the caller must serialise session ownership (SCHEDULER-SPEC §6.1, E7).' },
] as const;
