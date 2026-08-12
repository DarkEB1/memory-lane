// Two projects, deliberately separate.
//
// `domain` runs the pure TypeScript core in plain Node with no React Native
// runtime at all. It is fast, and it is where the scheduler, sync and telemetry
// logic is proved. `component` runs screens against the RN test renderer.
//
// Keeping them apart is what lets the domain suite stay in the 1-3s range that
// the ADR budgets for, and it stops a React Native environment quietly becoming
// a dependency of logic that is required to have none.
const nodePreset = require('jest-expo/node/jest-preset');
const iosPreset = require('jest-expo/ios/jest-preset');

module.exports = {
  projects: [
    {
      ...nodePreset,
      displayName: 'domain',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/contract/**/*.test.ts'],
    },
    {
      ...iosPreset,
      displayName: 'component',
      testMatch: ['<rootDir>/tests/component/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/component/setup.ts'],
    },
  ],
};
