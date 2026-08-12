// The rules in this file are load-bearing. They are not style preferences.
//
// The architecture depends on `src/domain/` being pure, portable, deterministic
// TypeScript: it is the module the server re-executes to recompute scheduler
// state canonically from the event log, and it is the module that blind-written
// tests must be able to pin down exactly. Both of those properties evaporate the
// moment domain code can reach a framework, the network, the wall clock, or a
// random number generator. Time and randomness are injected through ports.
//
// If you are here because a rule below is in your way: the rule is right and the
// import is wrong. Inject the dependency instead.
const expoConfig = require('eslint-config-expo/flat');

const FORBIDDEN_GLOBALS = [
  { name: 'Date', message: 'Domain code must take time from the injected Clock port. `new Date()` breaks determinism and replay.' },
  { name: 'crypto', message: 'Domain code must take randomness and ids from the injected Rng port.' },
  { name: 'fetch', message: 'Domain code must not perform IO. Use the Net port from an adapter.' },
  { name: 'window', message: 'Domain code must be portable to Node, the server and iOS. There is no window.' },
  { name: 'document', message: 'Domain code must be portable to Node, the server and iOS. There is no document.' },
  { name: 'localStorage', message: 'Domain code must not touch storage. Use the Db port.' },
  { name: 'setTimeout', message: 'Domain code must be a pure fold over events. Scheduling belongs to the caller.' },
  { name: 'setInterval', message: 'Domain code must be a pure fold over events. Scheduling belongs to the caller.' },
];

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    // Rule 1 + 3: the domain core is pure, portable and deterministic.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/domain must stay framework-free.' },
            { name: 'react-native', message: 'src/domain must stay framework-free.' },
            { name: 'react-dom', message: 'src/domain must stay framework-free.' },
          ],
          patterns: [
            { group: ['expo', 'expo-*', 'expo/*'], message: 'src/domain must run unchanged on a server with no Expo runtime.' },
            { group: ['@supabase/*'], message: 'src/domain must not know the backend exists. Use the Db/Net ports.' },
            { group: ['@/adapters/*', '../adapters/*', '../../adapters/*'], message: 'The domain depends on ports, never on adapters. This is the dependency rule that keeps it testable.' },
            { group: ['@/ui/*', '../ui/*', '../../ui/*'], message: 'src/domain must not depend on presentation.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...FORBIDDEN_GLOBALS],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Domain code must take randomness from the injected Rng port. Math.random() breaks replay and makes blind-written tests flaky.' },
        { object: 'Date', property: 'now', message: 'Domain code must take time from the injected Clock port.' },
      ],
    },
  },
  {
    // Rule 2: the researcher surface is DOM-only and must never be compiled for native.
    files: ['src/app/(researcher)/**/*.tsx'],
    ignores: ['src/app/(researcher)/**/*.web.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: 'Files under src/app/(researcher)/ must be named *.web.tsx. The researcher surface is plain DOM and is never bundled for iOS.',
        },
      ],
    },
  },
];
