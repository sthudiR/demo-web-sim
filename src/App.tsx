import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Tex } from './Tex';
import {
  amplitudes, findExtremes, fmtTime, phaseName, springOrNeap, tideHeight, SYNODIC_DAYS,
} from './tide';
import type { TideParams } from './tide';

const Scene = lazy(() => import('./Scene'));

const TABS = [
  { id: 'sim', label: 'Simulator' },
  { id: 'table', label: 'Tide table calculator' },
  { id: 'video', label: 'Video' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const readHash = (): TabId => {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (TABS.find((t) => t.id === h)?.id ?? 'sim') as TabId;
};

const DEFAULTS: TideParams = { moonKm: 384400, moonAge: 0, sunAlign: 100 };

function Slider(props: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; id: string;
}) {
  return (
    <label className="slider" htmlFor={props.id}>
      <span className="slider-top"><span>{props.label}</span><b>{props.value.toLocaleString()} {props.unit}</b></span>
      <input
        id={props.id} type="range" min={props.min} max={props.max} step={props.step}
        value={props.value} onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Readout({ params }: { params: TideParams }) {
  const ex = findExtremes(params);
  const { m2, s2 } = amplitudes(params);
  return (
    <>
      <div className="formula">
        <Tex block src={String.raw`h(t)=A_{M2}\cos\!\frac{2\pi (t-t_m)}{12.42\,\mathrm{h}}+A_{S2}\cos\!\frac{2\pi (t-12)}{12\,\mathrm{h}}`} />
        <Tex block src={String.raw`A_{M2}=0.55\left(\frac{384\,400}{d}\right)^{3}\ \text{m}`} />
      </div>
      <p className="muted small">
        Here <Tex src="A_{M2}" /> = {m2.toFixed(2)} m, <Tex src="A_{S2}" /> = {s2.toFixed(2)} m. Tidal force falls off with the cube of
        distance, so a perigee moon pulls noticeably harder.
      </p>
      <table className="tbl" aria-label="High and low tides today">
        <thead><tr><th>Event</th><th>Time</th><th>Height</th></tr></thead>
        <tbody>
          {ex.map((e) => (
            <tr key={`${e.kind}${e.t}`} className={e.kind}>
              <td>{e.kind === 'high' ? 'High tide' : 'Low tide'}</td><td>{fmtTime(e.t)}</td><td>{e.h.toFixed(2)} m</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small">Right now: {phaseName(params.moonAge)}, {springOrNeap(params.moonAge)}. Largest range today: {(
        Math.max(...ex.map((e) => e.h)) - Math.min(...ex.map((e) => e.h))
      ).toFixed(2)} m.</p>
    </>
  );
}

function Simulator() {
  const [p, setP] = useState<TideParams>(DEFAULTS);
  const [clock, setClock] = useState(8);
  const [playing, setPlaying] = useState(true);
  const hours = useRef(clock);
  hours.current = clock;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setClock((c) => (c + 0.1) % 24), 50);
    return () => window.clearInterval(id);
  }, [playing]);
  const set = (k: keyof TideParams) => (v: number) => setP((s) => ({ ...s, [k]: v }));
  const level = tideHeight(clock, p);

  return (
    <div className="grid">
      <section className="card scene-card">
        <div className="scene-wrap">
          <Suspense fallback={<div className="loading">Loading 3D scene...</div>}>
            <Scene params={p} hours={hours} />
          </Suspense>
          <div className="hud">{fmtTime(clock)} · water {level >= 0 ? '+' : ''}{level.toFixed(2)} m</div>
        </div>
        <div className="controls">
          <Slider id="dist" label="Moon distance" value={p.moonKm} min={356000} max={407000} step={500} unit="km" onChange={set('moonKm')} />
          <Slider id="age" label={`Moon phase (${phaseName(p.moonAge)})`} value={p.moonAge} min={0} max={SYNODIC_DAYS} step={0.1} unit="days old" onChange={set('moonAge')} />
          <Slider id="sun" label="Sun alignment" value={p.sunAlign} min={0} max={100} step={1} unit="%" onChange={set('sunAlign')} />
          <Slider id="clock" label="Time of day" value={Number(clock.toFixed(1))} min={0} max={23.9} step={0.1} unit="h" onChange={(v) => { setPlaying(false); setClock(v); }} />
          <div className="row">
            <button onClick={() => setPlaying((x) => !x)}>{playing ? 'Pause' : 'Play'} time</button>
            <button className="ghost" onClick={() => setP(DEFAULTS)}>Reset</button>
          </div>
        </div>
      </section>
      <section className="card">
        <h2>Tide calculator</h2>
        <Readout params={p} />
      </section>
    </div>
  );
}

function TableCalc() {
  const [p, setP] = useState<TideParams>(DEFAULTS);
  const [step, setStep] = useState(60);
  const num = (k: keyof TideParams) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP((s) => ({ ...s, [k]: Number(e.target.value) }));
  const rows: number[] = [];
  for (let m = 0; m < 1440; m += step) rows.push(m / 60);
  return (
    <div className="grid">
      <section className="card">
        <h2>Inputs</h2>
        <div className="fields">
          <label>Moon distance (km)<input type="number" min={300000} max={450000} step={500} value={p.moonKm} onChange={num('moonKm')} /></label>
          <label>Moon age (days since new, 0 to 29.5)<input type="number" min={0} max={29.5} step={0.1} value={p.moonAge} onChange={num('moonAge')} /></label>
          <label>Sun alignment (%)<input type="number" min={0} max={100} step={1} value={p.sunAlign} onChange={num('sunAlign')} /></label>
          <label>Table step
            <select value={step} onChange={(e) => setStep(Number(e.target.value))}>
              <option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option>
            </select>
          </label>
        </div>
        <p className="muted small">The same two-constituent model as the simulator, for one 24 hour day starting at midnight. Not for navigation.</p>
        <h3>High and low tides</h3>
        <Readout params={p} />
      </section>
      <section className="card">
        <h2>Water height by time</h2>
        <div className="scroll">
          <table className="tbl">
            <thead><tr><th>Time</th><th>Height (m)</th><th></th></tr></thead>
            <tbody>
              {rows.map((h) => {
                const v = tideHeight(h, p);
                return (
                  <tr key={h}><td>{fmtTime(h)}</td><td>{v.toFixed(2)}</td>
                    <td><span className="bar" style={{ width: `${Math.max(2, 50 + v * 40)}px` }} /></td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Video() {
  return (
    <section className="card">
      <h2>Watch: how tides work</h2>
      <div className="video">
        <iframe
          src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
          title="Tides explainer video"
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="muted small">Placeholder clip, shown through the privacy-enhanced YouTube player.</p>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>(readHash);
  useEffect(() => {
    const on = () => setTab(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return (
    <div className="app">
      <header>
        <a className="back-link" href="https://sthudir.github.io/demo-web-hub/">&larr; Back to demo-web hub</a>
        <h1>Pocket Tides</h1>
        <p className="muted">Move the moon, turn the sun, and watch the shoreline answer.</p>
        <nav aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.id} href={`#/${t.id}`} className={t.id === tab ? 'active' : ''} aria-current={t.id === tab ? 'page' : undefined}>{t.label}</a>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'sim' && <Simulator />}
        {tab === 'table' && <TableCalc />}
        {tab === 'video' && <Video />}
      </main>
      <footer className="muted small">A simplified teaching model (M2 and S2 only). Real tides depend on coastline and many more constituents.</footer>
    </div>
  );
}
