import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
import { LEVEL_COPIES, MAX_LEVEL, dogPower, dogPerk, bumpMission } from '../../lib/pugWorld/logic.js';
import Dog2D from './Dog2D';
import Wardrobe from './Wardrobe';
import { CoinIcon, SparkleIcon } from './icons';
import { dogName } from './names';
import { RarityPill, Stars, Button, TopBar, Stage } from './bits';
import { CARD, PURPLE } from './theme';

// One dog up close: spin it, a trick, outfits, set as favourite, its level
// (copies towards the next star), power and perk.
export default function DogShowcase({ pw, dogId, onClose, onShop }) {
  const { t } = useLang();
  const { state, update } = pw;
  const dog = DOG_BY_ID[dogId];
  const have = state.dogs[dogId] || { level: 1, copies: 0 };
  const worn = state.outfits.worn[dogId] || {};
  const [trick, setTrick] = useState(0);
  const fav = state.favorite === dogId;
  const perk = dogPerk(dogId, have.level);
  const need = have.level < MAX_LEVEL ? LEVEL_COPIES[have.level + 1] : 0;
  const c = RARITY_COLOR[dog.rarity];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#08080c', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', animation: 'fadeUp .2s ease both' }}>
      <TopBar title={dogName(t, dogId)} onBack={onClose} back="‹" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px calc(var(--safe-bottom) + 24px)' }}>
        <Stage height={300} color={c}><Dog2D dogId={dogId} worn={worn} trickKey={trick} /></Stage>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#77778a', marginTop: -6 }}>{t('pw.tapHint')}</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <RarityPill rarity={dog.rarity} />
          <Stars level={have.level} size={16} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          <Stat label={t('pw.powerLabel')} value={'⚡ ' + dogPower(dogId, have.level)} />
          <Stat label={t('pw.level')} value={need ? `${have.copies}/${need}` : t('pw.max')} sub={need ? t('pw.toNextStar') : null} />
          <Stat label={t('pw.perk')} value={perk ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>+{perk}% <CoinIcon size={15} /></span> : '—'} />
        </div>
        {need > 0 && (
          <div style={{ height: 5, borderRadius: 9, background: 'rgba(255,255,255,.07)', marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: (have.copies / need) * 100 + '%', height: '100%', background: PURPLE }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button ghost style={{ flex: 1 }} onClick={() => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); }}><SparkleIcon size={18} color="#c9baff" /> {t('pw.trick')}</Button>
          {fav ? (
            <div style={{ flex: 1, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 700, color: '#ffd27a', background: 'rgba(245,165,36,.1)', border: '1px solid rgba(245,165,36,.35)' }}>★ {t('pw.isFavorite')}</div>
          ) : (
            <Button style={{ flex: 1 }} onClick={() => update((s) => ({ ...s, favorite: dogId }))}>☆ {t('pw.setFavorite')}</Button>
          )}
        </div>

        <Wardrobe state={state} dogId={dogId} update={update} onShop={onShop} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ ...CARD, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#8a8a99', fontWeight: 650 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#77778a', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
