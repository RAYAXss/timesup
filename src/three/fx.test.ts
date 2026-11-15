import { describe, it, expect } from 'vitest';
import { emitFx, onFx, Fx } from './fx';

describe('fx', () => {
  it('delivers effects to subscribers until they unsubscribe', () => {
    const got: Fx[] = [];
    const off = onFx((fx) => got.push(fx));
    emitFx('confetti');
    off();
    emitFx('timeup');
    expect(got).toEqual(['confetti']);
  });
});
