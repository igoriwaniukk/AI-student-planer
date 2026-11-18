import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, RARITY_COLOR, RARITIES } from '../../lib/pugWorld/catalog.js';
import { CHEST_ODDS, CHEST_CONTENTS, LEVEL_COPIES, UPGRADE_TAPS, UPGRADE_CHANCE, openChest, rollUpgrade, setChestType } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import Dog2D from './Dog2D';
import { CoinIcon, OutfitPic, FreezeIcon } from './icons';
import ChestIcon from './Chest';
import { CHEST_COLORS } from './theme';
import { dogName } from './names';
import { RarityPill, Stars, Button } from './bits';

// Opening a chest: the closed chest → tap → it shakes harder and harder,
// glowing in the colour of what's inside → the lid bursts open with a flash
// and light rays → the dog jumps out, with what it means (new dog, a copy
// towards the next level, a level up, or coins when it's already at max
// level), the coins, and an outfit or set reward.
const KEYFRAMES = `
@keyframes pwShake{0%{transform:rotate(0) scale(1)}12%{transform:rotate(-3deg) scale(1.02)}25%{transform:rotate(3deg) scale(1.03)}38%{transform:rotate(-5deg) scale(1.05)}51%{transform:rotate(5deg) scale(1.06)}64%{transform:rotate(-7deg) scale(1.08)}77%{transform:rotate(7deg) scale(1.1)}90%{transform:rotate(-4deg) scale(1.12)}100%{transform:rotate(0) scale(1.14)}}
@keyframes pwPop{0%{transform:scale(1.14);opacity:1}30%{transform:scale(1.32);opacity:1}100%{transform:scale(.7) translateY(50px);opacity:0}}
@keyframes pwFlash{0%{transform:scale(.2);opacity:0}25%{opacity:1}100%{transform:scale(3.4);opacity:0}}
@keyframes pwRaysIn{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes pwSpin{to{transform:rotate(360deg)}}
@keyframes pwDogIn{0%{opacity:0;transform:scale(.45)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes pwSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
@keyframes pwBreath{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes pwUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes pwTap{0%{transform:scale(1)}40%{transform:scale(1.12,.9)}100%{transform:scale(1)}}
`;
const SHAKE_MS = 750;
const KIND_COLOR = { outfit: '#2ee6c5', freeze: '#7cc2ff', coins: '#f5c451' };
const BURST_MS = 520;
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + (i % 2) * 0.2;
  const r = 120 + (i % 3) * 40;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, size: 5 + (i % 3) * 3, delay: (i % 4) * 30 };
});

// `auto`: the chest right after a study session: 3 taps, each may upgrade
// it (small → silver → gold → epic), then it opens by itself; `banner`
// shows above it, and there's no "open next".
export default function ChestOpen({ pw, chestId, onNext, onClose, auto = false, banner = null }) {
  const { t } = useLang();
  const [type, setType] = useState(() => pw.state.chests.find((x) => x.id === chestId)?.type || 'small');
  const [res, setRes] = useState(null);
  const [phase, setPhase] = useState(auto ? 'charge' : 'closed'); // (charge →) closed → shake → burst → reveal
  const [taps, setTaps] = useState(0);
  const [flash, setFlash] = useState(0);
  const [dogReady, setDogReady] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // What's inside is decided on opening, for the chest as it is then.
  const open = (finalType = type) => {
    if (res) return;
    const r = openChest(setChestType(pw.state, chestId, finalType), chestId, Math.random, { freezeRoom: pw.freezeRoom !== false });
    if (!r) { onClose(); return; }
    pw.update(() => r.state);
    if (r.freeze) pw.addFreeze?.();
    setRes(r);
    setPhase('shake');
    timers.current.push(setTimeout(() => setPhase('burst'), SHAKE_MS));
    timers.current.push(setTimeout(() => {
      setPhase('reveal');
      if (isNativeApp()) postToApp('haptic', { kind: 'success' });
    }, SHAKE_MS + BURST_MS - 150));
  };
  // One of the 3 taps: maybe a better chest; after the last, it opens.
  const tap = () => {
    if (phase !== 'charge' || taps >= UPGRADE_TAPS) return;
    const nt = rollUpgrade(type);
    if (nt !== type) {
      setType(nt);
      setFlash((k) => k + 1);
      if (isNativeApp()) postToApp('haptic', { kind: 'success' });
    }
    const n = taps + 1;
    setTaps(n);
    if (n >= UPGRADE_TAPS) timers.current.push(setTimeout(() => open(nt), 750));
  };
  const next = (id) => onNext?.(id);

  const kindColor = res ? (res.kind === 'dog' ? RARITY_COLOR[res.rarity] : KIND_COLOR[res.kind]) : '#8b6dff';
  const c = res && phase !== 'closed' ? kindColor : '#8b6dff';
  const revealed = phase === 'reveal';
  const nextChest = onNext && res ? res.state.chests[0] : null;
  return (
    <div onClick={phase === 'closed' ? () => open() : phase === 'charge' ? tap : undefined} style={{ position: 'absolute', inset: 0, zIndex: 5, backgroundColor: '#08080c', overflow: 'hidden', cursor: phase === 'closed' || phase === 'charge' ? 'pointer' : 'default', animation: 'fadeUp .2s ease both' }}>
      <style>{KEYFRAMES}</style>
      {/* glow: the chest's own colour, turning into the rarity's while it shakes */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 42%, ${CHEST_COLORS[type].glow}, transparent 55%)`, opacity: phase === 'closed' || phase === 'charge' ? 1 : 0, transition: 'opacity .6s ease', animation: phase === 'closed' || phase === 'charge' ? 'pwBreath 2.6s ease-in-out infinite' : 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% ${revealed ? 38 : 42}%, ${c}55, transparent 60%)`, opacity: phase === 'closed' || phase === 'charge' ? 0 : 1, transition: 'opacity .7s ease' }} />
      {/* light rays from the burst on */}
      {(phase === 'burst' || revealed) && (
        <div style={{ position: 'absolute', left: '50%', top: '40%', width: 760, height: 760, marginLeft: -380, marginTop: -380, animation: 'pwRaysIn .6s ease-out both', pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `repeating-conic-gradient(from 0deg, ${c}40 0deg 7deg, transparent 7deg 22deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 12%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 12%, transparent 62%)', animation: 'pwSpin 40s linear infinite' }} />
        </div>
      )}

      <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', zIndex: 3, top: 'calc(var(--top-pad) + 6px)', left: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.07)', display: 'grid', placeItems: 'center', fontSize: 14, color: '#c9c9d6', cursor: 'pointer' }}>✕</div>

      {banner && !revealed && <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(var(--top-pad) + 60px)', display: 'flex', justifyContent: 'center', zIndex: 2 }}>{banner}</div>}
      {/* the chest */}
      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', marginTop: -40 }}>
            <div key={phase === 'charge' ? 'tap' + taps : phase} style={{ animation: phase === 'shake' ? `pwShake ${SHAKE_MS}ms ease-in both` : phase === 'burst' ? `pwPop ${BURST_MS}ms ease-in both` : phase === 'charge' && taps ? 'pwTap .35s ease-out both' : 'none', transformOrigin: '50% 80%' }}>
              <ChestIcon type={type} size={180} open={phase === 'burst'} />
            </div>
            {flash > 0 && phase === 'charge' && (
              <div key={'f' + flash} style={{ position: 'absolute', left: '50%', top: '40%', width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: '50%', background: `radial-gradient(circle, #fff, ${CHEST_COLORS[type].lid} 45%, transparent 70%)`, animation: 'pwFlash 600ms ease-out both', pointerEvents: 'none' }} />
            )}
            {phase === 'burst' && (
              <>
                <div style={{ position: 'absolute', left: '50%', top: '35%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', background: `radial-gradient(circle, #fff, ${c} 45%, transparent 70%)`, animation: `pwFlash ${BURST_MS}ms ease-out both`, pointerEvents: 'none' }} />
                {SPARKS.map((p, i) => (
                  <span key={i} style={{ position: 'absolute', left: '50%', top: '35%', width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, borderRadius: '50%', background: i % 3 ? c : '#fff', boxShadow: `0 0 8px ${c}`, '--dx': p.dx + 'px', '--dy': p.dy + 'px', animation: `pwSpark 700ms ${p.delay}ms ease-out both` }} />
                ))}
              </>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 14, letterSpacing: phase === 'charge' ? '.04em' : 0, color: phase === 'charge' ? CHEST_COLORS[type].lid : '#f4f4f7', opacity: phase === 'closed' || phase === 'charge' ? 1 : 0, transition: 'opacity .25s, color .3s' }}>
            {phase === 'charge' ? t('pw.chest.' + type).toUpperCase() : t('pw.chest.' + type)}
          </div>
          {flash > 0 && phase === 'charge' && <div key={'u' + flash} style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.14em', color: '#35d07f', marginTop: 6, animation: 'pwUp .3s ease-out both' }}>{t('pw.upgraded')}</div>}
          {phase === 'closed' && <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 8 }}>{t('pw.tapToOpen')}</div>}
          {phase === 'charge' && (
            <>
              <div style={{ display: 'flex', gap: 16, marginTop: 30 }}>
                {Array.from({ length: UPGRADE_TAPS }, (_, i) => {
                  const used = i < taps, active = i === taps;
                  return (
                    <span key={i} style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', background: active ? CHEST_COLORS[type].lid : used ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)', transform: active ? 'translateY(-6px)' : 'none', transition: 'all .25s', boxShadow: active ? `0 8px 20px ${CHEST_COLORS[type].glow}` : 'none' }}>
                      {used
                        ? <svg width="16" height="13" viewBox="0 0 13 11"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#9a9aab" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#1b1530' : '#6a6a7c'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>}
                    </span>
                  );
                })}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 22, textAlign: 'center', padding: '0 30px' }}>{t('pw.upgradeHint')}</div>
            </>
          )}
        </div>
      )}

      {/* the dog: loaded (hidden) from the start, shown at the burst */}
      {res && <Reveal key={res.chest.id} res={res} c={c} revealed={revealed} happy={revealed && dogReady ? 1 : 0} onDogReady={() => setDogReady(true)} nextChest={nextChest} onNext={next} onClose={onClose} />}
    </div>
  );
}

function Reveal({ res, c, revealed, happy, onDogReady, nextChest, onNext, onClose }) {
  const { t } = useLang();
  const isDog = res.kind === 'dog';
  const dog = isDog ? DOG_BY_ID[res.dog] : null;
  const have = isDog ? res.state.dogs[res.dog] : null;
  const headline = isDog
    ? { new: 'pw.res.new', copy: 'pw.res.copy', levelUp: 'pw.res.levelUp', coins: 'pw.res.coins' }[res.result]
    : { outfit: 'pw.res.outfit', freeze: 'pw.res.freeze', coins: 'pw.res.bonus' }[res.kind];
  let detail = '';
  if (res.result === 'copy') detail = t('pw.res.copyDetail', { n: have.copies, total: LEVEL_COPIES[have.level + 1] });
  if (res.result === 'levelUp') detail = t('pw.res.levelDetail', { n: have.level });
  if (res.result === 'coins') detail = t('pw.res.coinsDetail', { n: res.spareCoins });
  if (res.kind === 'freeze') detail = t('pw.res.freezeDetail');
  const up = (i) => ({ animation: revealed ? `pwUp .4s ${0.25 + i * 0.08}s ease-out both` : 'none', opacity: revealed ? undefined : 0 });
  const title = isDog ? dogName(t, dog.id) : res.kind === 'outfit' ? t('pw.outfit.' + res.outfit) : res.kind === 'freeze' ? t('pw.kind.freeze') : `+${res.coins}`;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', paddingBottom: 'calc(var(--safe-bottom) + 16px)', pointerEvents: revealed ? 'auto' : 'none' }}>
      <div style={{ textAlign: 'center', marginTop: 18, ...up(0) }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.16em', color: c }}>{t(headline)}</div>
      </div>
      <div style={{ flex: 1, minHeight: 240, position: 'relative', display: 'grid', placeItems: 'center', opacity: revealed ? 1 : 0, animation: revealed ? 'pwDogIn .55s ease-out both' : 'none' }}>
        {isDog && <Dog2D dogId={res.dog} worn={res.state.outfits.worn[res.dog]} happyKey={happy} onReady={onDogReady} />}
        {res.kind === 'outfit' && <div style={{ width: 210, height: 210, borderRadius: '50%', background: '#c9d8f5', display: 'grid', placeItems: 'center', boxShadow: '0 0 60px rgba(46,230,197,.35)' }}><OutfitPic id={res.outfit} size={150} /></div>}
        {res.kind === 'freeze' && <FreezeIcon size={190} style={{ filter: 'drop-shadow(0 0 40px rgba(124,194,255,.55))' }} />}
        {res.kind === 'coins' && <CoinIcon size={180} style={{ filter: 'drop-shadow(0 0 40px rgba(245,196,81,.55))' }} />}
      </div>
      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...up(1) }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>{title}</span>
          {isDog && <RarityPill rarity={res.rarity} />}
        </div>
        {isDog && <div style={{ marginTop: 6, ...up(2) }}><Stars level={have.level} size={16} /></div>}
        {detail && <div style={{ fontSize: 13.5, color: '#b9b9c8', marginTop: 6, ...up(2) }}>{detail}</div>}
        {res.kind !== 'coins' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap', ...up(3) }}>
            <Reward><CoinIcon size={15} /> +{res.coins}</Reward>
          </div>
        )}
        {res.set && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(53,208,127,.1)', border: '1px solid rgba(53,208,127,.35)', fontSize: 13, color: '#8ff0bf', fontWeight: 650, ...up(4) }}>
            🏆 {t('pw.res.set', { breed: t('pw.breed.' + res.set) })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, ...up(4) }}>
          {nextChest && <Button style={{ flex: 1 }} onClick={() => onNext(nextChest.id)}>{t('pw.openNext', { n: res.state.chests.length })}</Button>}
          <Button ghost={!!nextChest} style={{ flex: 1 }} onClick={onClose}>{t('pw.done')}</Button>
        </div>
      </div>
    </div>
  );
}

function Reward({ children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 750, padding: '7px 12px', borderRadius: 99, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>{children}</span>;
}

// What each chest can hold, in percent (shown openly, as App Store rules ask
// for random rewards).
export function ChancesSheet({ onClose }) {
  const { t } = useLang();
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 6, background: 'rgba(6,6,10,.75)', display: 'flex', alignItems: 'flex-end', animation: 'fadeUp .2s ease both' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: '#121019', borderRadius: '24px 24px 0 0', padding: '18px 18px calc(var(--safe-bottom) + 20px)', border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{t('pw.chancesTitle')}</div>
          <span onClick={onClose} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr repeat(4,1fr)', gap: '10px 4px', marginTop: 16, alignItems: 'center', fontSize: 12.5 }}>
          <span />
          {['small', 'silver', 'gold', 'epic'].map((ty) => <div key={ty} style={{ display: 'flex', justifyContent: 'center' }}><ChestIcon type={ty} size={30} /></div>)}
          {['dog', 'outfit', 'freeze', 'coins'].map((k) => (
            <KindRow key={k} k={k} label={t('pw.kind.' + k)} />
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 750, marginTop: 18 }}>{t('pw.chancesUpgrade')}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {Object.entries(UPGRADE_CHANCE).map(([from, pct]) => (
            <span key={from} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700 }}>
              <ChestIcon type={from} size={22} glow={false} />→<ChestIcon type={{ small: 'silver', silver: 'gold', gold: 'epic' }[from]} size={22} glow={false} />{pct}%
            </span>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 750, marginTop: 18 }}>{t('pw.chancesDogs')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr repeat(4,1fr)', gap: '10px 4px', marginTop: 10, alignItems: 'center', fontSize: 12.5 }}>
          <span />
          {['small', 'silver', 'gold', 'epic'].map((ty) => <div key={ty} style={{ display: 'flex', justifyContent: 'center' }}><ChestIcon type={ty} size={30} /></div>)}
          {RARITIES.map((r) => (
            <Row key={r} r={r} />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 16, lineHeight: 1.5 }}>{t('pw.chancesNote')}</div>
      </div>
    </div>
  );
}
function KindRow({ k, label }) {
  return (
    <>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#d9d9e6' }}>{label}</span>
      {['small', 'silver', 'gold', 'epic'].map((ty) => <div key={ty} style={{ textAlign: 'center', fontWeight: 700, color: CHEST_CONTENTS[ty][k] ? '#ececf3' : '#55556a' }}>{CHEST_CONTENTS[ty][k] ? CHEST_CONTENTS[ty][k] + '%' : '—'}</div>)}
    </>
  );
}
function Row({ r }) {
  return (
    <>
      <RarityPill rarity={r} small />
      {['small', 'silver', 'gold', 'epic'].map((ty) => <div key={ty} style={{ textAlign: 'center', fontWeight: 700, color: CHEST_ODDS[ty][r] ? '#ececf3' : '#55556a' }}>{CHEST_ODDS[ty][r] ? CHEST_ODDS[ty][r] + '%' : '—'}</div>)}
    </>
  );
}
