export type EasingFunction = (t: number) => number;

// Constants for Back easing
const c1 = 1.70158;
const c3 = c1 + 1;

function bounceOut(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

// Solves x(t) = ((2a * t + 3b) * t + 3c) * t = x for t, with x in (0, 1):
// u = 1/t is the largest real root of x·u³ − 3c·u² − 3b·u − 2a = 0
function solveTForX(x: number, a: number, b: number, c: number): number {
  const j = 1 / Math.max(c, Math.sqrt(x));
  const k = x * j;
  const l = k * j;
  const s = c * j;
  const q = b * l;
  const m = s * s + q;
  const h = -s * (s * s + 1.5 * q) - a * k * l;
  const D = h * h - m * m * m;
  let v: number;
  if (m === 0 || D > 1e-12 * h * h) {
    // one real root (Cardano)
    const U = -Math.cbrt(h < 0 ? h - Math.sqrt(D) : h + Math.sqrt(D));
    v = (U + m / U) || 0;
  } else {
    // three real roots, take the largest
    const r = Math.sqrt(m);
    v = 2 * r * Math.cos(Math.acos(Math.max(-1, Math.min(1, -h / (m * r)))) / 3);
  }
  return Math.min(1, k / (v + s));
}

/**
 * Solves a cubic bezier curve for a given x.
 * Based on https://github.com/gre/bezier-easing
 */
function cubicBezier(mX1: number, mY1: number, mX2: number, mY2: number): EasingFunction {
  if (mX1 === mY1 && mX2 === mY2) return (t) => t; // Linear

  // x(t) = ((2a * t + 3b) * t + 3c) * t, y(t) = ((ay * t + by) * t + cy) * t
  const a = (3 * mX1 - 3 * mX2 + 1) / 2;
  const b = mX2 - 2 * mX1;
  const c = mX1;
  const ay = 3 * mY1 - 3 * mY2 + 1;
  const by = 3 * (mY2 - 2 * mY1);
  const cy = 3 * mY1;

  return (t: number) => {
    // t outside (0, 1) saturates to 0 / 1
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const u = solveTForX(t, a, b, c);
    return ((ay * u + by) * u + cy) * u;
  };
}

export const Easing = {
  // Basics
  linear: (t: number) => t,
  step: (steps: number) => (t: number) => Math.floor(t * steps) / steps,
  bezier: cubicBezier,

  // Polynomial
  quad: {
    in: (t: number) => t * t,
    out: (t: number) => 1 - (1 - t) * (1 - t),
    inOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  },
  cubic: {
    in: (t: number) => t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 3),
    inOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  },
  quart: {
    in: (t: number) => t * t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 4),
    inOut: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  },
  quint: {
    in: (t: number) => t * t * t * t * t,
    out: (t: number) => 1 - Math.pow(1 - t, 5),
    inOut: (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  },

  // Transcendental
  sine: {
    in: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
    out: (t: number) => Math.sin((t * Math.PI) / 2),
    inOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  },
  expo: {
    in: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    out: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inOut: (t: number) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if ((t *= 2) < 1) return Math.pow(2, 10 * (t - 1)) / 2;
      return (2 - Math.pow(2, -10 * (t - 1))) / 2;
    },
  },
  circ: {
    in: (t: number) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
    out: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
    inOut: (t: number) => t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  },

  // Physical
  back: {
    in: (t: number) => c3 * t * t * t - c1 * t * t,
    out: (t: number) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
    inOut: (t: number) => {
      const c2 = c1 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
  },
  elastic: {
    in: (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    out: (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    inOut: (t: number) => {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    }
  },
  bounce: {
    in: (t: number) => 1 - bounceOut(1 - t),
    out: bounceOut,
    inOut: (t: number) => t < 0.5
      ? (1 - bounceOut(1 - 2 * t)) / 2
      : (bounceOut(2 * t - 1) + 1) / 2,
  }
};
