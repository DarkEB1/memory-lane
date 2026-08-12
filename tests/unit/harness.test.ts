// Harness smoke test: proves the domain project runs pure TS with no RN runtime.
describe('domain test harness', () => {
  it('runs TypeScript in plain node', () => {
    const double = (n: number): number => n * 2;
    expect(double(21)).toBe(42);
  });
});
