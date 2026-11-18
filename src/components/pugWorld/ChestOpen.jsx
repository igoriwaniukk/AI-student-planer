import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, RARITIES } from '../../lib/pugWorld/catalog.js';
import { CHEST_ODDS, CHEST_CONTENTS, LEVEL_COPIES, UPGRADE_TAPS, UPGRADE_CHANCE, openChest, rollUpgrade, setChestType } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import Dog2D from './Dog2D';
import { CoinIcon, OutfitPic, FreezeIcon } from './icons';
import ChestIcon from './Chest';
import { CHEST_BRIGHT, RARITY_BRIGHT, KIND_BRIGHT } from './theme';
import { dogName } from './names';
import { RarityPill, Stars, Chunky } from './bits';

// Opening a chest, on a bright sunburst in the chest's colour (small orange,
// silver blue, gold yellow, epic purple): the closed chest → tap → it shakes
// harder and harder → the lid bursts open with a flash → what's inside, on
// its own colour (a dog: its rarity's), with what it means (new dog, a copy
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
const SHADOW = '0 2px 0 rgba(0,0,0,.18)';
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

  // The screen's colour: the chest's, then (from the burst) what came out.
  const after = res && (phase === 'burst' || phase === 'reveal');
  const pal = after ? (res.kind === 'dog' ? RARITY_BRIGHT[res.rarity] : KIND_BRIGHT[res.kind]) : CHEST_BRIGHT[type];
  const c = '#fff';
  const revealed = phase === 'reveal';
  const nextChest = onNext && res ? res.state.chests[0] : null;
  const waiting = phase === 'closed' || phase === 'charge';
  return (
    <div onClick={phase === 'closed' ? () => open() : phase === 'charge' ? tap : undefined} style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', cursor: waiting ? 'pointer' : 'default', animation: 'fadeUp .2s ease both', background: `radial-gradient(circle at 50% 42%, ${pal[0]} 0, ${pal[1]} 45%, ${pal[2]} 100%)`, transition: 'background .3s ease' }}>
      <style>{KEYFRAMES}</style>
      {/* white sunburst rays, turning slowly */}
      <div style={{ position: 'absolute', left: '50%', top: '40%', width: 1100, height: 1100, marginLeft: -550, marginTop: -550, pointerEvents: 'none' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,.17) 0deg 8deg, transparent 8deg 22.5deg)', WebkitMaskImage: 'radial-gradient(circle, #000 8%, rgba(0,0,0,.6) 45%, transparent 70%)', maskImage: 'radial-gradient(circle, #000 8%, rgba(0,0,0,.6) 45%, transparent 70%)', animation: 'pwSpin 60s linear infinite' }} />
      </div>

      <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', zIndex: 3, top: 'calc(var(--top-pad) + 6px)', left: 16, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 900, color: '#fff', cursor: 'pointer' }}>✕</div>

      {banner && !revealed && <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(var(--top-pad) + 60px)', display: 'flex', justifyContent: 'center', zIndex: 2 }}>{banner}</div>}
      {/* the chest */}
      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', marginTop: -40 }}>
            <div key={phase === 'charge' ? 'tap' + taps : phase} style={{ animation: phase === 'shake' ? `pwShake ${SHAKE_MS}ms ease-in both` : phase === 'burst' ? `pwPop ${BURST_MS}ms ease-in both` : phase === 'charge' && taps ? 'pwTap .35s ease-out both' : 'none', transformOrigin: '50% 80%' }}>
              <ChestIcon type={type} size={230} open={phase === 'burst'} />
            </div>
            {flash > 0 && phase === 'charge' && (
              <div key={'f' + flash} style={{ position: 'absolute', left: '50%', top: '40%', width: 220, height: 220, marginLeft: -110, marginTop: -110, borderRadius: '50%', background: `radial-gradient(circle, #fff, ${pal[0]} 45%, transparent 70%)`, animation: 'pwFlash 600ms ease-out both', pointerEvents: 'none' }} />
            )}
            {phase === 'burst' && (
              <>
                <div style={{ position: 'absolute', left: '50%', top: '35%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', background: `radial-gradient(circle, #fff, ${c} 45%, transparent 70%)`, animation: `pwFlash ${BURST_MS}ms ease-out both`, pointerEvents: 'none' }} />
                {SPARKS.map((p, i) => (
                  <span key={i} style={{ position: 'absolute', left: '50%', top: '35%', width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, borderRadius: '50%', background: i % 3 ? pal[0] : '#fff', boxShadow: '0 0 8px #fff', '--dx': p.dx + 'px', '--dy': p.dy + 'px', animation: `pwSpark 700ms ${p.delay}ms ease-out both` }} />
                ))}
              </>
            )}
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, marginTop: 10, color: '#fff', textShadow: SHADOW, opacity: waiting ? 1 : 0, transition: 'opacity .25s' }}>
            {t('pw.chest.' + type)}
          </div>
          {flash > 0 && phase === 'charge' && <div key={'u' + flash} style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.14em', color: '#fff', textShadow: SHADOW, marginTop: 4, animation: 'pwUp .3s ease-out both' }}>{t('pw.upgraded')}</div>}
          {phase === 'charge' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                {Array.from({ length: UPGRADE_TAPS }, (_, i) => (
                  <span key={i} style={{ width: 46, height: 14, borderRadius: 99, background: i < taps ? '#fff' : 'rgba(255,255,255,.32)', boxShadow: '0 3px 0 rgba(0,0,0,.15)', transition: 'background .2s' }} />
                ))}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 14, textAlign: 'center', padding: '0 30px', color: '#fff', textShadow: SHADOW }}>{t('pw.upgradeHint')}</div>
            </>
          )}
        </div>
      )}
      {waiting && (
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 'calc(var(--safe-bottom) + 34px)', zIndex: 2 }}>
          <Chunky onClick={phase === 'charge' ? tap : () => open()} style={{ height: 56, fontSize: 18 }}>{t(phase === 'charge' ? 'pw.tapBtn' : 'pw.open')}</Chunky>
        </div>
      )}

      {/* the dog: loaded (hidden) from the start, shown at the burst */}
      {res && <Reveal key={res.chest.id} res={res} c={c} pal={pal} revealed={revealed} happy={revealed && dogReady ? 1 : 0} onDogReady={() => setDogReady(true)} nextChest={nextChest} onNext={next} onClose={onClose} />}
    </div>
  );
}

function Reveal({ res, c, pal, revealed, happy, onDogReady, nextChest, onNext, onClose }) {
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
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.16em', color: c, textShadow: SHADOW }}>{t(headline)}</div>
      </div>
      <div style={{ flex: 1, minHeight: 240, position: 'relative', display: 'grid', placeItems: 'center', opacity: revealed ? 1 : 0, animation: revealed ? 'pwDogIn .55s ease-out both' : 'none' }}>
        {isDog && <Dog2D dogId={res.dog} worn={res.state.outfits.worn[res.dog]} happyKey={happy} onReady={onDogReady} />}
        {res.kind === 'outfit' && <div style={{ width: 210, height: 210, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}><OutfitPic id={res.outfit} size={150} /></div>}
        {res.kind === 'freeze' && <FreezeIcon size={190} style={{ filter: 'drop-shadow(0 6px 0 rgba(0,0,0,.15))' }} />}
        {res.kind === 'coins' && <CoinIcon size={180} style={{ filter: 'drop-shadow(0 6px 0 rgba(0,0,0,.15))' }} />}
      </div>
      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...up(1) }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', textShadow: SHADOW }}>{title}</span>
          {isDog && <RarityPill rarity={res.rarity} solid="white" />}
        </div>
        {isDog && <div style={{ marginTop: 6, ...up(2) }}><Stars level={have.level} size={18} dim="rgba(255,255,255,.35)" /></div>}
        {detail && <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textShadow: SHADOW, marginTop: 6, ...up(2) }}>{detail}</div>}
        {res.kind !== 'coins' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap', ...up(3) }}>
            <Reward><CoinIcon size={15} /> +{res.coins}</Reward>
          </div>
        )}
        {res.set && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.22)', fontSize: 13.5, color: '#fff', fontWeight: 800, ...up(4) }}>
            🏆 {t('pw.res.set', { breed: t('pw.breed.' + res.set) })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, ...up(4) }}>
          {nextChest && <Chunky style={{ flex: 1, fontSize: 13.5, letterSpacing: '.03em', padding: '0 10px' }} onClick={() => onNext(nextChest.id)}>{t('pw.openNext', { n: res.state.chests.length })}</Chunky>}
          <Chunky pal={['#fff', '#fff', 'rgba(0,0,0,.18)']} text={pal[2]} style={{ flex: 1 }} onClick={onClose}>{t('pw.done')}</Chunky>
        </div>
      </div>
    </div>
  );
}

function Reward({ children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 900, color: '#fff', padding: '7px 14px', borderRadius: 99, background: 'rgba(255,255,255,.25)' }}>{children}</span>;
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
