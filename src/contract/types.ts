// C01 — scalar and union vocabulary · src/contract/types.ts
//
// Every scalar alias and closed union the whole system speaks, so no other
// module invents one. PURE: no runtime imports; imported by src/domain/ which
// may not touch react/react-native/expo/supabase/Date/Math.random.
//
// spec: SCHEDULER-SPEC §3 (type block), §4.1; ADR-DATA §5.1, §6.6, §11.2;
//       DESIGN-SYSTEM §8.5.2, §9.5, §4.1; MODULES §2.3.

// ---- opaque identifiers ----
export type ItemId = string;
export type DeviceId = string;
export type SessionId = string;
export type BootId = string;
export type PatientId = string;
export type SubjectId = string;

// ---- scheduler numeric unions ----
export type Tier = 1 | 2 | 3;
export type CueLevel = 0 | 1 | 2 | 3;
export type Rung = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---- item and trial state ----
export type ItemStatus = 'active' | 'absorbing_distress' | 'retired';
export type TrialClass = 'FLOOR' | 'SUPPORTED' | 'VANISH';
export type Grade = 'MISS' | 'SLOW' | 'CLEAN' | 'EXPOSURE';

export type SessionOutcome =
  | 'CLEAN_SESSION'
  | 'SLOW_SESSION'
  | 'SUPPORTED_SESSION'
  | 'EXPOSURE_SESSION'
  | 'MISSED_SESSION'
  | 'NO_EVIDENCE';

/** The FROZEN scheduler union. Carried on SessionEnded. Never extended. */
export type SessionEndReason =
  | 'budget_time'
  | 'budget_trials'
  | 'roster_exhausted'
  | 'user_ended'
  | 'distress_stop'
  | 'abandoned'
  | 'app_crash';

/** The runtime/telemetry union (§2.3). Contains NO 'timeout' — that absence is A40. */
export type RuntimeEndReason =
  | SessionEndReason
  | 'completed'
  | 'battery_truncated'
  | 'audio_unavailable'
  | 'content_expired'
  | 'wrong_resident';

// ---- person / content vocabulary ----
export type PersonStatus = 'living' | 'deceased' | 'estranged' | 'do_not_show';
export type RelationshipGroup =
  | 'partner'
  | 'child_or_grandchild'
  | 'sibling_or_parent'
  | 'friend_or_other'
  | 'self_or_pet';
export type EraBand = 'pre_1950' | '1950s_60s' | 'post_1970';
export type PresentationMode =
  | 'free_recall'
  | 'cued_recall'
  | 'recognition'
  | 'familiarity_exposure';

// ---- enrolment / presentation variants ----
export type RungLadderVariant = 'four_rung' | 'three_rung_no_foil' | 'three_rung_target';
export type SessionMode = 'standard' | 'nothing_today';
export type SessionOrderVariant = 'standard' | 'front_loaded';
export type RungDwellStep = 'short' | 'standard' | 'long';
export type PatientTypeStep = 'sm' | 'md' | 'lg';
export type AudioOutput = 'speaker' | 'headphones' | 'captions_only';
export type PrimeCondition = 'primed' | 'unprimed';
export type M2PhotoSource = 'personal' | 'generic';

/**
 * DistressReported.source (§5, I-9 clause 2). EXACTLY TWO members, both human.
 * P18: neither 'abandonment' nor 'repeated_skip' is a member. Asserted at
 * runtime against EVENT_VARIANTS['DistressReported.source'] (C06 / §21.2).
 */
export type DistressSource = 'patient_control' | 'caregiver_report';

/**
 * `by` on ItemTierSet / ItemRecognitionBlockSet / ItemRetired / ItemReEnabled /
 * ProbeDisabledSet (§5, I-9 clause 3, invariant I-6). NO 'algorithm' variant.
 * P3: the algorithm never authors these. Asserted at runtime against
 * EVENT_VARIANTS['ItemRetired.by'] / ['ItemReEnabled.by'] (C06 / §21.2).
 */
export type ByRole = 'caregiver' | 'clinician';

// ---- moment / consent vocabulary (ADR-DATA §11.2, §8.5) ----
export type MomentKind =
  | 'long_narration'
  | 'song_played'
  | 'item_first_success'
  | 'tier1_maintained'
  | 'session_shared_with_caregiver'
  | 'new_item_added';

export type ConsentPurpose =
  | 'care_delivery'
  | 'research_behavioural'
  | 'research_speech_features'
  | 'media_retention'
  | 'third_party_imagery'
  | 'contact_for_followup';

/** ADR-DATA §6.6: the sentinel device id for server-authored events. */
export const SERVER_DEVICE_ID = '00000000-0000-0000-0000-000000000000' as const;
