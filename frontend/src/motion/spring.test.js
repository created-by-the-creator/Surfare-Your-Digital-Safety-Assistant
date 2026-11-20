import { describe, expect, it } from 'vitest';
import { advanceSpring, scrollDamping } from './spring.js';

describe('tour spring', () => {
  it.each([800, -800, 4000])('overshoots softly and settles for a %spx shift', (target) => {
    let state = { position: 0, velocity: 0 };
    let overshoot = 0;
    for (let frame = 0; frame < 180; frame += 1) {
      state = advanceSpring(state.position, state.velocity, target, 1 / 60, scrollDamping(target));
      overshoot = Math.max(overshoot, (state.position - target) * Math.sign(target));
    }
    expect(overshoot).toBeGreaterThan(1);
    expect(overshoot).toBeLessThan(20);
    expect(state).toEqual({ position: target, velocity: 0 });
  });

  it('stays stable through dropped frames and a direction change', () => {
    let state = { position: 0, velocity: 0 };
    for (let frame = 0; frame < 12; frame += 1) state = advanceSpring(state.position, state.velocity, 800, .032);
    for (let frame = 0; frame < 120; frame += 1) state = advanceSpring(state.position, state.velocity, 0, .064);
    expect(state).toEqual({ position: 0, velocity: 0 });
  });
});
