import { useEffect, useRef, useState } from 'react';
import { DOG_BY_ID, RARITIES } from '../../lib/pugWorld/catalog.js';
import DogThumb from './DogThumb';

// The yard: your dogs (up to 10, favourite first) wander around a little
// night garden — one or two take a few calm hops to a new spot every
// couple of seconds. Tap a dog to see it up close. `trickKey`: the
// favourite does a flip.
const MAX_DOGS = 10;
const HOP_MS = 2600;
const rand = (a, b) => a + Math.random() * (b - a);

export default function Yard({ state, favorite, onTapDog, trickKey = 0, paused = false }) {
  const ids = [favorite, ...Object.keys(state.dogs)
    .filter((id) => id !== favorite && DOG_BY_ID[id])
    .sort((a, b) => RARITIES.indexOf(DOG_BY_ID[b].rarity) - RARITIES.indexOf(DOG_BY_ID[a].rarity))]
    .filter(Boolean).slice(0, MAX_DOGS);
  const idsKey = ids.join(',');
  const [spots, setSpots] = useState({});
  const favRef = useRef(null);

  // Start positions for new dogs; then every ~1.8 s one or two dogs move.
  useEffect(() => {
    const place = () => setSpots((cur) => {
      const next = {};
      ids.forEach((id, i) => { next[id] = cur[id] || { x: 12 + ((i * 37) % 76), y: rand(58, 86), moving: false }; });
      return next;
    });
    const t0 = setTimeout(place, 0);
    if (paused) return () => clearTimeout(t0);
    const timers = [];
    const tick = setInterval(() => {
      if (document.hidden) return;
      const movers = ids.filter(() => Math.random() < 0.28).slice(0, 2);
      if (!movers.length) return;
      setSpots((cur) => {
        const next = { ...cur };
        movers.forEach((id) => { if (next[id]) next[id] = { x: rand(10, 90), y: rand(56, 88), moving: true }; });
        return next;
      });
      timers.push(setTimeout(() => setSpots((cur) => {
        const next = { ...cur };
        movers.forEach((id) => { if (next[id]) next[id] = { ...next[id], moving: false }; });
        return next;
      }), HOP_MS));
    }, 1800);
    return () => { clearTimeout(t0); clearInterval(tick); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, paused]);

  useEffect(() => {
    if (!trickKey || !favRef.current) return;
    favRef.current.animate([
      { transform: 'translateY(0) rotateY(0)' },
      { transform: 'translateY(-26px) rotateY(180deg)', offset: 0.45 },
      { transform: 'translateY(0) rotateY(360deg)' },
    ], { duration: 900, easing: 'ease-out' });
  }, [trickKey]);

  return (
    <div style={{ position: 'relative', height: 270, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)', background: 'linear-gradient(180deg,#1a1538 0%,#141030 45%,#0f0c22 100%)' }}>
      <style>{'@keyframes pwHop{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}'}</style>
      {/* sky: moon and a few stars */}
      <div style={{ position: 'absolute', right: 26, top: 20, width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#fff7d6,#f5d98a)', boxShadow: '0 0 30px rgba(245,217,138,.45)' }} />
      {[[24, 18], [70, 34], [120, 14], [180, 40], [230, 22], [290, 52], [46, 60]].map(([x, y], i) => (
        <span key={i} style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.55 }} />
      ))}
      {/* ground, bushes */}
      <div style={{ position: 'absolute', left: -40, right: -40, top: '46%', bottom: -60, borderRadius: '50% 50% 0 0 / 30px 30px 0 0', background: 'linear-gradient(180deg,#22403a,#17302c 40%,#122420)' }} />
      {[[-8, '44%', 54, '#1d3a33'], [38, '42%', 38, '#24463d'], ['calc(100% - 60px)', '43%', 50, '#1d3a33'], ['calc(100% - 20px)', '45%', 36, '#24463d']].map(([l, t, s, c], i) => (
        <div key={i} style={{ position: 'absolute', left: l, top: t, width: s, height: s * 0.7, borderRadius: '50% 50% 40% 40%', background: c, transform: 'translateY(-60%)' }} />
      ))}
      {ids.map((id) => {
        const p = spots[id];
        if (!p) return null;
        const fav = id === favorite;
        const size = fav ? 74 : 58;
        return (
          <div
            key={id}
            onClick={() => onTapDog?.(id)}
            style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', zIndex: Math.round(p.y), transform: 'translate(-50%,-100%)', transition: `left ${HOP_MS}ms ease-in-out, top ${HOP_MS}ms ease-in-out`, cursor: 'pointer' }}
          >
            <div ref={fav ? favRef : undefined}>
              <div style={{ animation: p.moving ? 'pwHop .42s ease-in-out infinite' : 'none' }}>
                <DogThumb dogId={id} worn={state.outfits.worn[id]} size={size} />
              </div>
            </div>
            <div style={{ width: size * 0.62, height: 7, margin: '-5px auto 0', borderRadius: '50%', background: fav ? 'rgba(139,109,255,.55)' : 'rgba(0,0,0,.35)' }} />
          </div>
        );
      })}
    </div>
  );
}
