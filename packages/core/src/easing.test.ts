import { describe, it, expect } from 'vitest';
import { Easing } from './easing.js';

describe('Easing', () => {
  it('Easing.linear', () => {
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(1)).toBe(1);
  });

  it('Easing.step', () => {
    const step4 = Easing.step(4);
    expect(step4(0)).toBe(0);
    expect(step4(0.1)).toBe(0);
    expect(step4(0.25)).toBe(0.25);
    expect(step4(0.4)).toBe(0.25);
    expect(step4(0.5)).toBe(0.5);
    expect(step4(0.99)).toBe(0.75);
    expect(step4(1)).toBe(1);
  });

  const categories = [
    'quad', 'cubic', 'quart', 'quint',
    'sine', 'expo', 'circ',
    'back', 'elastic', 'bounce'
  ] as const;

  categories.forEach((cat) => {
    describe(`Easing.${cat}`, () => {
      const { in: easeIn, out: easeOut, inOut: easeInOut } = Easing[cat];

      it('starts at 0 and ends at 1', () => {
        expect(easeIn(0)).toBeCloseTo(0);
        expect(easeIn(1)).toBeCloseTo(1);
        expect(easeOut(0)).toBeCloseTo(0);
        expect(easeOut(1)).toBeCloseTo(1);
        expect(easeInOut(0)).toBeCloseTo(0);
        expect(easeInOut(1)).toBeCloseTo(1);
      });

      it('easeIn is slower at start than end (convex)', () => {
        if (cat === 'elastic' || cat === 'back' || cat === 'bounce') return; // physical models are complex
        expect(easeIn(0.25)).toBeLessThan(0.25);
        expect(easeIn(0.75)).toBeLessThan(0.75); // Generally true for power curves
      });

      it('easeOut is faster at start than end (concave)', () => {
        if (cat === 'elastic' || cat === 'back' || cat === 'bounce') return;
        expect(easeOut(0.25)).toBeGreaterThan(0.25);
        expect(easeOut(0.75)).toBeGreaterThan(0.75);
      });

      it('easeInOut is symmetricish', () => {
        if (cat === 'elastic' || cat === 'back' || cat === 'bounce') return;
        expect(easeInOut(0.5)).toBeCloseTo(0.5);
      });
    });
  });

  describe('Easing.bezier', () => {
    it('approximates linear when handles are diagonal', () => {
      const linear = Easing.bezier(0, 0, 1, 1);
      expect(linear(0)).toBe(0);
      expect(linear(0.5)).toBeCloseTo(0.5);
      expect(linear(1)).toBe(1);
    });

    it('approximates ease-in', () => {
      const easeIn = Easing.bezier(0.42, 0, 1, 1);
      expect(easeIn(0.25)).toBeLessThan(0.25);
    });

    it('approximates ease-out', () => {
      const easeOut = Easing.bezier(0, 0, 0.58, 1);
      expect(easeOut(0.25)).toBeGreaterThan(0.25);
    });

    it('matches points of the curve', () => {
      // x(t) and y(t) of the CSS "ease" curve for t = 0.3
      const t = 0.3;
      const x = 3 * 0.25 * t * (1 - t) ** 2 + 3 * 0.25 * t * t * (1 - t) + t ** 3;
      const y = 3 * 0.1 * t * (1 - t) ** 2 + 3 * t * t * (1 - t) + t ** 3;
      expect(Easing.bezier(0.25, 0.1, 0.25, 1)(x)).toBeCloseTo(y, 12);
    });

    it('is monotonic on steep curves', () => {
      // (1, 0, 0, 1) used to go backwards around 0.5
      const easing = Easing.bezier(1, 0, 0, 1);
      let previous = 0;
      for (let i = 0; i <= 10000; i++) {
        const y = easing(0.49 + (0.02 * i) / 10000);
        expect(y).toBeGreaterThanOrEqual(previous);
        previous = y;
      }
    });

    it('saturates outside of [0, 1]', () => {
      const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
      expect(ease(-0.5)).toBe(0);
      expect(ease(1.5)).toBe(1);
    });
  });
});
