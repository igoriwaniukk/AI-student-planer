import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, OUTFIT_ICON, RARITY_COLOR, RARITIES } from '../../lib/pugWorld/catalog.js';
import { CHEST_ODDS, LEVEL_COPIES, openChest } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import Dog3D from './Dog3D';
import ChestIcon from './Chest';
import { CHEST_COLORS } from './theme';
import { dogName } from './names';
import { RarityPill, Stars, Button } from './bits';

// Opening a chest: the closed chest → tap → the dog jumps out, with what it
// means (new dog, a copy towards the next level, a level up, or coins when
// the dog is already at max level), the coins, and an outfit or set reward.
export default function ChestOpen({ pw, chestId, onNext, onClose }) {
  const { t } = useLang();
  const chest = pw.state.chests.find((c) => c.id === chestId);
  const [res, setRes] = useState(null);
  const [happy, setHappy] = useState(0);
  const type = res ? res.chest.type : chest?.type || 'small';

  const open = () => {
    const r = openChest(pw.state, chestId);
    if (!r) { onClose(); return; }
    pw.update(() => r.state);
    setRes(r);
    if (isNativeApp()) postToApp('haptic', { kind: 'success' });
  };
  const nextChest = res && res.state.chests[0];

  if (!res) {
    return (
      <div onClick={open} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(6,6,10,.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'fadeUp .2s ease both' }}>
        <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', top: 'calc(var(--top-pad) + 6px)', left: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.07)', display: 'grid', placeItems: 'center', fontSize: 14, color: '#c9c9d6' }}>✕</div>
        <div style={{ width: 260, height: 260, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `radial-gradient(circle, ${CHEST_COLORS[type].glow}, transparent 65%)` }}>
          <ChestIcon type={type} size={170} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{t('pw.chest.' + type)}</div>
        <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 8 }}>{t('pw.tapToOpen')}</div>
      </div>
    );
  }

  const dog = DOG_BY_ID[res.dog];
  const c = RARITY_COLOR[res.rarity];
  const have = res.state.dogs[res.dog];
  const headline = { new: 'pw.res.new', copy: 'pw.res.copy', levelUp: 'pw.res.levelUp', coins: 'pw.res.coins' }[res.result];
  let detail = '';
  if (res.result === 'copy') detail = t('pw.res.copyDetail', { n: have.copies, total: LEVEL_COPIES[have.level + 1] });
  if (res.result === 'levelUp') detail = t('pw.res.levelDetail', { n: have.level });
  if (res.result === 'coins') detail = t('pw.res.coinsDetail', { n: res.spareCoins });
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: `radial-gradient(ellipse at 50% 38%, ${c}40, #08080c 62%)`, backgroundColor: '#08080c', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', paddingBottom: 'calc(var(--safe-bottom) + 16px)', animation: 'fadeUp .2s ease both' }}>
      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: c }}>{t(headline)}</div>
      </div>
      <div style={{ flex: 1, minHeight: 240, position: 'relative' }}>
        <Dog3D dogId={res.dog} worn={res.state.outfits.worn[res.dog]} happyKey={happy} onReady={() => setHappy((k) => k + 1)} />
      </div>
      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>{dogName(t, dog.id)}</span>
          <RarityPill rarity={res.rarity} />
        </div>
        <div style={{ marginTop: 6 }}><Stars level={have.level} size={16} /></div>
        {detail && <div style={{ fontSize: 13.5, color: '#b9b9c8', marginTop: 6 }}>{detail}</div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Reward>🪙 +{res.coins}</Reward>
          {res.outfit && <Reward>{OUTFIT_ICON[res.outfit]} {t('pw.outfit.' + res.outfit)}</Reward>}
        </div>
        {res.set && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(53,208,127,.1)', border: '1px solid rgba(53,208,127,.35)', fontSize: 13, color: '#8ff0bf', fontWeight: 650 }}>
            🏆 {t('pw.res.set', { breed: t('pw.breed.' + res.set) })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {nextChest && <Button style={{ flex: 1 }} onClick={() => { setRes(null); onNext(nextChest.id); }}>{t('pw.openNext', { n: res.state.chests.length })}</Button>}
          <Button ghost={!!nextChest} style={{ flex: 1 }} onClick={onClose}>{t('pw.done')}</Button>
        </div>
      </div>
    </div>
  );
}

function Reward({ children }) {
  return <span style={{ fontSize: 13.5, fontWeight: 750, padding: '7px 12px', borderRadius: 99, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>{children}</span>;
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
          {RARITIES.map((r) => (
            <Row key={r} r={r} />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 16, lineHeight: 1.5 }}>{t('pw.chancesNote')}</div>
      </div>
    </div>
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
