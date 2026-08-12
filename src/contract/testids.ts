// C11 — the test-id contract · src/contract/testids.ts
//
// Freezes every interactive element's `testID` so selector drift is a
// TypeScript error on both sides at once: the test-writer writes
// `getByTestId(ids.patient.stop)`, the implementer writes
// `testID={ids.patient.stop}`, and both import this one const. Under
// react-native-web a `testID` renders as `data-testid`, so one selector
// vocabulary spans Playwright-on-web and Maestro-on-iOS.
//
// PURE plain-data literals, `as const`. Zero runtime imports. deps: none.
//
// spec: DESIGN-SYSTEM §12.1 (the patient literal, VERBATIM), §12.2, §8.9;
//       ADR-PLATFORM §6.1; MODULES §6 LAYER C C11 and the frozen module
//       APIs U07–U14. The patient object is frozen field-for-field; the
//       other three surfaces are `Readonly<Record<string,string>>` keyed
//       to the frozen component APIs (NOT the unfrozen surface docs).

// ── PATIENT ────────────────────────────────────────────────────────────
// §12.1, verbatim. `Object.values(patient)` must deep-equal this literal.
export const patient = {
  ground:      'patient.ground',
  picture:     'patient.picture',        // control
  matSingle:   'patient.mat.single',
  cardLeft:    'patient.card.left',      // control
  cardRight:   'patient.card.right',     // control
  captionLine1:'patient.caption.1',
  captionLine2:'patient.caption.2',
  stop:        'patient.stop',           // control
} as const;

// The only four pressable test-ids the patient surface may ever mount (A1).
export const PATIENT_CONTROLS = [
  patient.picture,
  patient.cardLeft,
  patient.cardRight,
  patient.stop,
] as const;

// ── STAFF ──────────────────────────────────────────────────────────────
// The shared-tablet handover behind Guided Access (§8.9; U07). No resident
// is ever asked to identify her own photograph — staff select, then a
// reversible first page whose only touch target returns to the roster.
export const staff = {
  handover:          'staff.handover',
  residentList:      'staff.handover.residents',
  resident:          'staff.handover.resident',   // + `.${patientId}` per row
  firstPage:         'staff.firstPage',           // any touch here returns
  firstPageReturn:   'staff.firstPage.return',
  firstPageProceed:  'staff.firstPage.proceed',
} as const;

// ── CAREGIVER ──────────────────────────────────────────────────────────
// U08 onboarding/screening/comprehension, U09 deck, U10 home, U11 consent.
export const caregiver = {
  // onboarding (U08)
  onboarding:            'caregiver.onboarding',
  whoFirstName:          'caregiver.onboarding.firstName',
  whoBirthYear:          'caregiver.onboarding.birthYear',
  comprehensionInput:    'caregiver.comprehension.input',
  comprehensionSubmit:   'caregiver.comprehension.submit',
  screening:             'caregiver.screening',
  screeningYes:          'caregiver.screening.yes',
  screeningNo:           'caregiver.screening.no',
  screeningNotSure:      'caregiver.screening.notSure',
  screeningBack:         'caregiver.screening.back',
  blocklist:             'caregiver.blocklist',
  deviceModeHers:        'caregiver.device.mode.hers',
  deviceModeShared:      'caregiver.device.mode.shared',
  enrolCode:             'caregiver.device.code',
  enrolNewCode:          'caregiver.device.newCode',
  // deck (U09)
  deck:                  'caregiver.deck',
  deckAddPhotos:         'caregiver.deck.addPhotos',
  deckPhotoPass:         'caregiver.deck.photoPass',
  deckDetailPass:        'caregiver.deck.detailPass',
  deckCommit:            'caregiver.deck.commit',
  personStatus:          'caregiver.deck.personStatus',
  personStatusLiving:    'caregiver.deck.personStatus.living',
  personStatusDeceased:  'caregiver.deck.personStatus.deceased',
  personStatusEstranged: 'caregiver.deck.personStatus.estranged',
  personStatusDoNotShow: 'caregiver.deck.personStatus.doNotShow',
  releaseAttest:         'caregiver.deck.releaseAttest',
  releaseNoPersons:      'caregiver.deck.releaseNoPersons',
  itemRetire:            'caregiver.deck.item.retire',
  itemReEnable:          'caregiver.deck.item.reEnable',
  itemSetTier:           'caregiver.deck.item.setTier',
  monthTarget:           'caregiver.deck.monthTarget',
  monthTargetSave:       'caregiver.deck.monthTarget.save',
  // home (U10)
  home:                  'caregiver.home',
  momentsFeed:           'caregiver.home.moments',
  syncBanner:            'caregiver.home.syncBanner',
  syncBannerWifiHelp:    'caregiver.home.syncBanner.wifiHelp',
  acuteNoticeAck:        'caregiver.home.acuteNotice.acknowledge',
  stopUpsetting:         'caregiver.home.stopUpsetting',
  settings:              'caregiver.settings',
  // consent (U11)
  consent:               'caregiver.consent',
  consentDecision:       'caregiver.consent.decision',
  withdraw:              'caregiver.consent.withdraw',
  dissent:               'caregiver.consent.dissent',
  caregiverRemoval:      'caregiver.consent.removal',
  deleteEverything:      'caregiver.delete',
  deleteConfirm:         'caregiver.delete.confirm',
} as const;

// ── RESEARCHER ─────────────────────────────────────────────────────────
// U12 shell/primitives, U13 ops console, U14 releases/cohort/export.
// Read-only, plain DOM; every chart carries a table twin.
export const researcher = {
  surfaceLabel:      'researcher.surfaceLabel',   // P24, on every page
  releasePicker:     'researcher.releasePicker',
  releasePickerPin:  'researcher.releasePicker.pin',
  dataTable:         'researcher.dataTable',
  attritionChart:    'researcher.attritionChart',
  rateWithCI:        'researcher.rateWithCI',
  criterionTile:     'researcher.criterionTile',  // + `.${id}` (S1…F7)
  navCohort:         'researcher.nav.cohort',
  navSessions:       'researcher.nav.sessions',
  navSafety:         'researcher.nav.safety',
  navProbe:          'researcher.nav.probe',
  navParticipant:    'researcher.nav.participant',
  navArms:           'researcher.nav.arms',
  navOps:            'researcher.nav.ops',
  navExport:         'researcher.nav.export',
  exportRequest:     'researcher.export.request',
} as const;

// ── AGGREGATE ──────────────────────────────────────────────────────────
// The nested vocabulary both agents resolve against: `ids.patient.stop`,
// `ids.caregiver.dissent`, etc. (ADR-PLATFORM §6.1).
export const ids = { patient, staff, caregiver, researcher } as const;
