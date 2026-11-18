import { useEffect, useRef, useState } from 'react';
import { dogsOn } from '../../lib/pugWorld/logic.js';
import { openPugWorld } from '../../lib/pugWorld/events';
import DogThumb from './DogThumb';

// The tiny dogs that live on a screen (`place`: home, calendar, tasks,
// planner — chosen per dog in My dogs, see dogsOn) stand on the top edges of
// the cards marked `data-perch`. Every 6–10 s one of them walks a little
// along its card or hops to the card above or below — one at a time, calm.
// Tap a dog: it jumps, then My dogs opens on it.
// `data-perch="0.55-1"` = dogs only stand on that part of the card's edge
// (e.g. not under text that sits right above it).
// Render it as a direct child of the screen's scrolling area (position:
// relative), so the dogs scroll with the cards.
const SIZE = 34;
const FAV_SIZE = 40;
const EDGE = 26; // keep dogs this far from a card's rounded corners
const SPOTS = [0.7, 0.1, 0.62, 0.3]; // where dogs first stand on their card

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function ScreenPets({ pw, place }) {
  const layer = useRef(null);
  const els = useRef({});
  const [perches, setPerches] = useState([]); // [{top, x0, w}]: the edge dogs may stand on, relative to the layer
  const [spots, setSpots] = useState({}); // dogId → {p: perch index, f: 0..1 along it}
  const on = !!(pw?.enabled && pw.started);
  const ids = on ? dogsOn(pw.state, place) : [];
  const idsKey = ids.join(',');
  const active = ids.length > 0;

  // Where the cards are (they move as the page changes): check every second.
  useEffect(() => {
    if (!active) return undefined;
    const measure = () => {
      const L = layer.current;
      if (!L?.parentElement) return;
      const base = L.getBoundingClientRect();
      const next = [...L.parentElement.querySelectorAll('[data-perch]')].map((el) => {
        const r = el.getBoundingClientRect();
        const [lo, hi] = /^([\d.]+)-([\d.]+)$/.test(el.dataset.perch) ? el.dataset.perch.split('-').map(Number) : [0, 1];
        const len = r.width - 2 * EDGE;
        return { top: Math.round(r.top - base.top), x0: Math.round(r.left - base.left + EDGE + lo * len), w: Math.round((hi - lo) * len) };
      }).filter((p) => p.w > 40);
      setPerches((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
    };
    measure();
    const id = setInterval(measure, 1000);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('resize', measure); };
  }, [active]);

  // Give every dog a first spot: one dog per card, from the top.
  useEffect(() => {
    if (!perches.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpots((cur) => {
      const next = {};
      ids.forEach((id, i) => {
        next[id] = cur[id] && cur[id].p < perches.length ? cur[id] : { p: i % perches.length, f: SPOTS[i % SPOTS.length] };
      });
      return JSON.stringify(next) === JSON.stringify(cur) ? cur : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, perches.length]);

  const xy = (s) => {
    const P = perches[s.p];
    return P ? { x: P.x0 + s.f * P.w, y: P.top } : null;
  };

  // Now and then one dog moves: a walk along its card, or a hop to another.
  const latest = useRef({});
  latest.current = { perches, spots, ids };
  useEffect(() => {
    if (!active || reducedMotion()) return undefined;
    let timer;
    const step = () => {
      timer = setTimeout(step, 6000 + Math.random() * 4000);
      const { perches: P, spots: S, ids: dogs } = latest.current;
      if (document.hidden || !P.length || !dogs.length) return;
      const id = dogs[Math.floor(Math.random() * dogs.length)];
      const cur = S[id];
      const el = els.current[id];
      if (!cur || !el) return;
      const taken = (p) => dogs.filter((d) => d !== id && S[d]?.p === p).map((d) => S[d].f);
      const free = (p, f) => taken(p).every((g) => Math.abs(g - f) * P[p].w > SIZE + 14);
      const pick = (p) => { for (let k = 0; k < 8; k++) { const f = 0.05 + Math.random() * 0.9; if (free(p, f)) return f; } return null; };
      const others = [cur.p - 1, cur.p + 1].filter((i) => i >= 0 && i < P.length); // the next card up or down
      const hop = others.length && Math.random() < 0.6;
      const p = hop ? others[Math.floor(Math.random() * others.length)] : cur.p;
      const f = pick(p);
      if (f == null || (!hop && Math.abs(f - cur.f) * P[p].w < 40)) return;
      const from = { x: P[cur.p].x0 + cur.f * P[cur.p].w, y: P[cur.p].top };
      const to = { x: P[p].x0 + f * P[p].w, y: P[p].top };
      setSpots((s) => ({ ...s, [id]: { p, f } }));
      // FLIP: the dog is already at its new spot; animate it from the old one.
      const dx = from.x - to.x;
      const dy = from.y - to.y;
      if (hop) {
        const peak = Math.min(from.y, to.y) - 46;
        const frames = [];
        for (let i = 0; i <= 14; i++) {
          const t = i / 14;
          const bx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * ((from.x + to.x) / 2) + t * t * to.x;
          const by = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * peak + t * t * to.y;
          frames.push({ transform: `translate(${(bx - to.x).toFixed(1)}px,${(by - to.y).toFixed(1)}px)` });
        }
        el.animate(frames, { duration: Math.min(1400, 650 + Math.abs(dy) * 1.1), easing: 'ease-in-out' });
      } else {
        const hops = Math.max(2, Math.round(Math.abs(dx) / 34));
        const frames = [];
        for (let i = 0; i <= hops * 2; i++) {
          const t = i / (hops * 2);
          frames.push({ transform: `translate(${(dx * (1 - t)).toFixed(1)}px,${i % 2 ? -6 : 0}px)` });
        }
        el.animate(frames, { duration: hops * 300, easing: 'linear' });
      }
    };
    timer = setTimeout(step, 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;
  const chests = pw.state.chests.length;
  const tap = (id) => {
    els.current[id]?.animate([
      { transform: 'translateY(0)' }, { transform: 'translateY(-18px)', offset: 0.45 }, { transform: 'translateY(0)' },
    ], { duration: 420, easing: 'ease-out' });
    setTimeout(() => openPugWorld({ dog: id }), 380);
  };

  return (
    <div ref={layer} style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 3 }}>
      {ids.map((id) => {
        const s = spots[id];
        const pos = s && xy(s);
        if (!pos) return null;
        const fav = id === pw.state.favorite;
        const size = fav ? FAV_SIZE : SIZE;
        return (
          <div
            key={id}
            ref={(el) => { if (el) els.current[id] = el; else delete els.current[id]; }}
            onClick={() => tap(id)}
            style={{ position: 'absolute', left: pos.x - size / 2, top: pos.y - size + 3, width: size, height: size, cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: 0, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,.45)' }} />
            <DogThumb dogId={id} worn={pw.state.outfits.worn[id]} size={size} style={{ position: 'relative' }} />
            {fav && chests > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: '#ff5f6d', border: '2px solid #08080c', display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 800, color: '#fff' }}>{chests}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
