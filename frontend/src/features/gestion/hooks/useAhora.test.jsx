import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useAhora from './useAhora.js';

beforeEach(() => vi.useFakeTimers({ now: new Date('2026-10-04T10:00:00Z') }));
afterEach(() => vi.useRealTimers());

describe('useAhora', () => {
  it('devuelve el instante actual y lo actualiza cada minuto', () => {
    const { result } = renderHook(() => useAhora());
    const inicial = result.current;
    expect(inicial).toBe(Date.parse('2026-10-04T10:00:00Z'));

    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current).toBe(inicial);
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(inicial + 60_000);
  });

  it('libera el temporizador al desmontar', () => {
    const { unmount } = renderHook(() => useAhora());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
