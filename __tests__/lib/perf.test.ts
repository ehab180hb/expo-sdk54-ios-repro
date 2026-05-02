import { __resetPerf, getPerf, markFirstPaint, markLaunch } from '@/lib/perf';

beforeEach(() => {
  __resetPerf();
});

describe('perf markers', () => {
  it('markLaunch records the time on first call', () => {
    expect(getPerf().launch).toBeUndefined();
    markLaunch();
    expect(getPerf().launch).toBeGreaterThan(0);
  });

  it('markLaunch is idempotent (subsequent calls are no-ops)', () => {
    markLaunch();
    const first = getPerf().launch!;
    // tiny delay, then re-call
    const later = Date.now() + 10;
    jest.useFakeTimers().setSystemTime(later);
    markLaunch();
    expect(getPerf().launch).toBe(first);
    jest.useRealTimers();
  });

  it('markFirstPaint records the time on first call', () => {
    expect(getPerf().firstPaint).toBeUndefined();
    markFirstPaint();
    expect(getPerf().firstPaint).toBeGreaterThan(0);
  });

  it('exposes launchToFirstPaintMs when both markers are set', () => {
    markLaunch();
    markFirstPaint();
    const { launchToFirstPaintMs } = getPerf();
    expect(launchToFirstPaintMs).toBeGreaterThanOrEqual(0);
    expect(launchToFirstPaintMs).toBeLessThan(1000);
  });

  it('launchToFirstPaintMs is undefined if either marker is missing', () => {
    markLaunch();
    expect(getPerf().launchToFirstPaintMs).toBeUndefined();
    __resetPerf();
    markFirstPaint();
    expect(getPerf().launchToFirstPaintMs).toBeUndefined();
  });
});
