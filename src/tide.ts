// Simplified two-constituent tide model (M2 lunar + S2 solar semidiurnal).
export const MEAN_MOON_KM = 384400;
export const SYNODIC_DAYS = 29.53;
export const M2_PERIOD_H = 12.4206;
export const S2_PERIOD_H = 12;
export const A_M2_BASE = 0.55; // metres at mean distance
export const A_S2_BASE = 0.25; // metres, sun fully aligned

export interface TideParams {
  moonKm: number; // 356000 .. 407000
  moonAge: number; // days since new moon, 0..29.53
  sunAlign: number; // 0..100 %, how directly the sun acts on the tide
}

export const amplitudes = (p: TideParams) => ({
  m2: A_M2_BASE * Math.pow(MEAN_MOON_KM / p.moonKm, 3),
  s2: A_S2_BASE * (p.sunAlign / 100),
});

// Moon crosses the meridian ~50.5 min later each day; at new moon it crosses at 12:00 with the sun.
export const moonTransitH = (age: number) => 12 + age * (24.84 / SYNODIC_DAYS);

export function tideHeight(tHours: number, p: TideParams): number {
  const { m2, s2 } = amplitudes(p);
  const tm = moonTransitH(p.moonAge);
  return (
    m2 * Math.cos((2 * Math.PI * (tHours - tm)) / M2_PERIOD_H) +
    s2 * Math.cos((2 * Math.PI * (tHours - 12)) / S2_PERIOD_H)
  );
}

export interface Extreme { t: number; h: number; kind: 'high' | 'low' }

export function findExtremes(p: TideParams, from = 0, to = 24): Extreme[] {
  const out: Extreme[] = [];
  const step = 1 / 30;
  let a = tideHeight(from - step, p), b = tideHeight(from, p);
  for (let t = from; t < to; t += step) {
    const c = tideHeight(t + step, p);
    if (b > a && b >= c) out.push({ t, h: b, kind: 'high' });
    else if (b < a && b <= c) out.push({ t, h: b, kind: 'low' });
    a = b; b = c;
  }
  return out;
}

export const fmtTime = (h: number) => {
  const m = Math.round(h * 60) % 1440;
  const hh = Math.floor(m / 60), mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const phaseName = (age: number) => {
  const f = age / SYNODIC_DAYS;
  if (f < 0.03 || f > 0.97) return 'New moon';
  if (f < 0.22) return 'Waxing crescent';
  if (f < 0.28) return 'First quarter';
  if (f < 0.47) return 'Waxing gibbous';
  if (f < 0.53) return 'Full moon';
  if (f < 0.72) return 'Waning gibbous';
  if (f < 0.78) return 'Last quarter';
  return 'Waning crescent';
};

export const springOrNeap = (age: number) => {
  const f = (age / SYNODIC_DAYS) % 0.5; // 0 at new/full
  const d = Math.min(f, 0.5 - f); // 0..0.25
  if (d < 0.05) return 'spring tides (sun and moon pull together)';
  if (d > 0.2) return 'neap tides (sun and moon pull at right angles)';
  return 'in between spring and neap';
};
