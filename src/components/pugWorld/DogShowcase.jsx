import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, OUTFITS, OUTFIT_ICON, RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
import { LEVEL_COPIES, MAX_LEVEL, dogPower, dogPerk, toggleOutfit, bumpMission } from '../../lib/pugWorld/logic.js';
import Dog3D from './Dog3D';
import { dogName } from './names';
import { RarityPill, Stars, Button, TopBar, Stage } from './bits';
import { CARD, PURPLE } from './theme';

// One dog up close: spin it, a trick, outfits, set as favourite, its level
// (copies towards the next star), power and perk.
export default function DogShowcase({ pw, dogId, onClose }) {
  const { t } = useLang();
  const { state, update } = pw;
  const dog = DOG_BY_ID[dogId];
  const have = state.dogs[dogId] || { level: 1, copies: 0 };
  const worn = state.outfits.worn[dogId] || {};
  const [trick, setTrick] = useState(0);
  const fav = state.favorite === dogId;
  const perk = dogPerk(dogId, have.level);
  const need = have.level < MAX_LEVEL ? LEVEL_COPIES[have.level + 1] : 0;
  const owned = OUTFITS.filter((o) => state.outfits.owned.includes(o.id));
  const c = RARITY_COLOR[dog.rarity];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#08080c', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', animation: 'fadeUp .2s ease both' }}>
      <TopBar title={dogName(t, dogId)} onBack={onClose} back="‹" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px calc(var(--safe-bottom) + 24px)' }}>
        <Stage height={300} color={c}><Dog3D dogId={dogId} worn={worn} trickKey={trick} /></Stage>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#77778a', marginTop: -6 }}>{t('pw.spinHint')}</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <RarityPill rarity={dog.rarity} />
          <Stars level={have.level} size={16} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          <Stat label={t('pw.powerLabel')} value={'⚡ ' + dogPower(dogId, have.level)} />
          <Stat label={t('pw.level')} value={need ? `${have.copies}/${need}` : t('pw.max')} sub={need ? t('pw.toNextStar') : null} />
          <Stat label={t('pw.perk')} value={perk ? `+${perk}% 🪙` : '—'} />
        </div>
        {need > 0 && (
          <div style={{ height: 5, borderRadius: 9, background: 'rgba(255,255,255,.07)', marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: (have.copies / need) * 100 + '%', height: '100%', background: PURPLE }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button ghost style={{ flex: 1 }} onClick={() => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); }}>✨ {t('pw.trick')}</Button>
          <Button ghost={fav} style={{ flex: 1 }} onClick={() => update((s) => ({ ...s, favorite: dogId }))}>{fav ? '★ ' + t('pw.isFavorite') : '☆ ' + t('pw.setFavorite')}</Button>
        </div>

        <div style={{ ...CARD, marginTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 750, marginBottom: 10 }}>{t('pw.outfits')}</div>
          {!owned.length && <div style={{ fontSize: 13, color: '#a3a3b3', lineHeight: 1.45 }}>{t('pw.noOutfits')}</div>}
          {['head', 'face', 'neck'].map((slot) => {
            const list = owned.filter((o) => o.slot === slot);
            if (!list.length) return null;
            return (
              <div key={slot} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#8a8a99', textTransform: 'uppercase' }}>{t('pw.slot.' + slot)}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 7 }}>
                  {list.map((o) => {
                    const on = worn[slot] === o.id;
                    return (
                      <div key={o.id} onClick={() => update((s) => toggleOutfit(s, dogId, o.id))} style={{ height: 38, padding: '0 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 650, background: on ? 'rgba(139,109,255,.2)' : 'rgba(255,255,255,.05)', border: on ? '1.5px solid #8b6dff' : '1px solid rgba(255,255,255,.08)' }}>
                        <span style={{ fontSize: 17 }}>{OUTFIT_ICON[o.id]}</span>{t('pw.outfit.' + o.id)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
