import { useEffect, useState } from 'react';
import { useLang } from '../../lib/useLang';
import { localeOf } from '../../lib/i18n';
import { MISSIONS, MONTHLY_TARGET } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import { AppShellPortal } from '../ui';
import ChestIcon from './Chest';
import DogThumb from './DogThumb';
import { Chunky } from './bits';
import { missionLabel } from './missionUtil';

// The mission progress screen (like Duolingo's): after a finished study
// session, or when a mission gets finished anywhere. Big title, today's 3
// missions with thick bars that fill from where they were to where they
// are now (a finished one turns green and its chest pops open), the
// monthly challenge counting up (after a session), and "Open chest" —
// the chests it earned then open one after another — or "Continue".
const KEYFRAMES = `
@keyframes pwMpIn{from{opacity:0}to{opacity:1}}
@keyframes pwMpUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pwMpPop{0%{transform:scale(1)}35%{transform:scale(1.35) rotate(-8deg)}60%{transform:scale(.92) rotate(5deg)}100%{transform:none}}
@keyframes pwMpRing{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.9)}}
`;
const PURPLE = ['#a58cff', '#7c5cff', '#5b3ee0'];
const START = 500; // ms before the first bar starts filling
const STEP = 450; // between bars
const FILL = 900; // how long a bar takes

const have = (counts, id, done) => {
  const [ev, n] = MISSIONS[id] || ['', 1];
  return done ? n : Math.min(n, (counts || {})[ev] || 0);
};

export default function MissionProgress({ pw, ready }) {
  if (!pw?.enabled || !pw.started || !pw.progress || !ready) return null;
  return <Screen key={pw.progress.at} pw={pw} p={pw.progress} />;
}

function Screen({ pw, p }) {
  const { t, lang } = useLang();
  const [go, setGo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const rows = p.to.items.map((m) => {
    const before = p.from.items.find((x) => x.id === m.id);
    const n = (MISSIONS[m.id] || ['', 1])[1];
    return { id: m.id, n, from: have(p.from.counts, m.id, before?.done), to: have(p.to.counts, m.id, m.done), wasDone: !!before?.done, done: m.done };
  });
  const newly = rows.filter((r) => r.done && !r.wasDone).length;
  // haptic as each finished bar lands
  useEffect(() => {
    if (!isNativeApp()) return undefined;
    const ids = rows.map((r, i) => (r.done && !r.wasDone ? setTimeout(() => postToApp('haptic', { kind: 'success' }), START + i * STEP + FILL) : null)).filter(Boolean);
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMonth = p.session && p.to.month;
  const monthName = showMonth ? (() => { const [y, mo] = p.to.month.split('-').map(Number); const n = new Date(y, mo - 1, 1).toLocaleDateString(localeOf(lang), { month: 'long' }); return n.charAt(0).toUpperCase() + n.slice(1); })() : '';
  const monthDelay = START + rows.length * STEP + 200;
  const [monthShown, setMonthShown] = useState(showMonth ? Math.min(p.from.monthly, MONTHLY_TARGET) : 0);
  useEffect(() => {
    if (!showMonth) return undefined;
    const id = setTimeout(() => setMonthShown(Math.min(p.to.monthly, MONTHLY_TARGET)), monthDelay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { state } = pw;
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const hasChest = !!pw.toast?.chest || pw.queue.length > 0;
  return (
    <AppShellPortal>
      <div style={{ position: 'absolute', inset: 0, zIndex: 118, background: '#08080c', display: 'flex', flexDirection: 'column', padding: 'calc(var(--top-pad) + 64px) 26px calc(var(--safe-bottom) + 22px)', animation: 'pwMpIn .3s ease both', overflowY: 'auto' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ textAlign: 'center', fontSize: 31, fontWeight: 900, color: PURPLE[0], letterSpacing: '-.01em', lineHeight: 1.15, animation: 'pwMpUp .45s .1s ease-out both' }}>
          {newly > 0 ? t('pw.missionDone') : t('pw.mp.progress')}
        </div>
        <div style={{ marginTop: 6 }}>
          {rows.map((r, i) => {
            const delay = START + i * STEP;
            const pct = ((go ? r.to : r.from) / r.n) * 100;
            const green = go ? r.done : r.wasDone;
            const pop = r.done && !r.wasDone;
            return (
              <div key={r.id} style={{ marginTop: 30, animation: `pwMpUp .4s ${150 + i * 90}ms ease-out both` }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: r.wasDone ? '#a3a3b3' : '#f4f4f7' }}>{t('pw.mission.' + r.id)}</div>
                <div style={{ position: 'relative', height: 56, display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, height: 26, borderRadius: 99, background: '#24232f', marginRight: 36, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.max(0, Math.min(100, pct)) + '%', borderRadius: 99, overflow: 'hidden', background: `linear-gradient(90deg,${PURPLE[1]},${PURPLE[0]})`, transition: `width ${FILL}ms cubic-bezier(.3,.8,.3,1) ${delay}ms` }}>
                      {/* turns green once full (a layer that fades in: gradients can't transition) */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#2fbf73,#35d07f)', opacity: green ? 1 : 0, transition: r.wasDone ? 'none' : `opacity .35s ${delay + FILL}ms` }} />
                      <div style={{ position: 'absolute', left: 10, right: 10, top: 5, height: 4, borderRadius: 9, background: 'rgba(255,255,255,.28)' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900, color: (go ? r.to : r.from) ? '#fff' : '#6f6f80', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
                      <Counted from={r.from} to={r.to} delay={delay} render={(v) => (r.done && (go || r.wasDone) && v === r.to ? '✓ ' : '') + missionLabel(r.id, v, r.n)} />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', right: -6, top: 0, width: 56, height: 56 }}>
                    {pop && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #35d07f', animation: `pwMpRing .7s ${delay + FILL}ms ease-out both` }} />}
                    <div style={{ animation: pop ? `pwMpPop .6s ${delay + FILL}ms ease-out both` : undefined, opacity: r.wasDone ? 0.5 : 1 }}>
                      <OpenLater open={r.done} wasOpen={r.wasDone} delay={delay + FILL} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {showMonth && (
          <div style={{ animation: `pwMpUp .4s ${150 + rows.length * 90}ms ease-out both` }}>
            <div style={{ height: 2, background: '#24232f', margin: '30px 0 26px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{t('pw.monthly.title', { month: monthName })}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: PURPLE[0], marginTop: 8, transition: 'transform .3s', transform: monthShown > Math.min(p.from.monthly, MONTHLY_TARGET) ? 'scale(1.08)' : 'none', transformOrigin: 'left center' }}>{monthShown} / {MONTHLY_TARGET}</div>
              </div>
              <div style={{ width: 78, height: 78, borderRadius: '50%', padding: 4, background: `linear-gradient(150deg,#c9baff,${PURPLE[1]})`, flex: 'none' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f1edff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {fav && <DogThumb dogId={fav} worn={(state.outfits.worn || {})[fav]} size={64} />}
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 24 }} />
        <div style={{ animation: `pwMpUp .4s ${START + rows.length * STEP}ms ease-out both` }}>
          <Chunky pal={PURPLE} style={{ height: 54 }} onClick={pw.clearProgress}>{hasChest ? t('pw.mp.open') : t('pw.mp.continue')}</Chunky>
        </div>
      </div>
    </AppShellPortal>
  );
}

// The number on a bar counts up while the bar fills.
function Counted({ from, to, delay, render }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (to === from) return undefined;
    let raf;
    const t0 = performance.now() + delay;
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / FILL));
      setV(Math.round(from + (to - from) * k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, delay]);
  return render(v);
}

// The chest at the end of a bar: opens when its bar is full.
function OpenLater({ open, wasOpen, delay }) {
  const [isOpen, setOpen] = useState(wasOpen);
  useEffect(() => {
    if (!open || wasOpen) return undefined;
    const id = setTimeout(() => setOpen(true), delay + 120);
    return () => clearTimeout(id);
  }, [open, wasOpen, delay]);
  return <ChestIcon type="small" size={56} open={isOpen} />;
}
