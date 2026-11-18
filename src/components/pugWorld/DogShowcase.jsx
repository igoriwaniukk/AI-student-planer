import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID, RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
import { LEVEL_COPIES, MAX_LEVEL, dogPower, dogPerk, bumpMission, PLACES, DOG_MAX_PLACES, PLACE_MAX_DOGS, placesOf, placeHasRoom, togglePlace } from '../../lib/pugWorld/logic.js';
import Dog2D from './Dog2D';
import Wardrobe from './Wardrobe';
import { CoinIcon } from './icons';
import { dogName } from './names';
import { RarityPill, Stars, Button, TopBar, Stage, TrickButton } from './bits';
import { CARD, PURPLE } from './theme';

// One dog up close: tap it to jump, a trick, outfits, set as favourite, its level
// (copies towards the next star), power and perk, and which screens it lives on.
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
        <Stage height={300} color={c}>
          <Dog2D dogId={dogId} worn={worn} trickKey={trick} />
          <TrickButton onClick={() => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); }} />
        </Stage>
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
          {fav ? (
            <div style={{ flex: 1, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 700, color: '#ffd27a', background: 'rgba(245,165,36,.1)', border: '1px solid rgba(245,165,36,.35)' }}>★ {t('pw.isFavorite')}</div>
          ) : (
            <Button style={{ flex: 1 }} onClick={() => update((s) => ({ ...s, favorite: dogId }))}>☆ {t('pw.setFavorite')}</Button>
          )}
        </div>

        <Places state={state} dogId={dogId} update={update} />
        <Wardrobe state={state} dogId={dogId} update={update} onShop={onShop} />
      </div>
    </div>
  );
}

// "Where does it live?": up to DOG_MAX_PLACES screens per dog, up to
// PLACE_MAX_DOGS dogs per screen (a full screen is greyed out). The
// favourite always lives on Home.
const PLACE_ICON = {
  home: (c) => <path d="M3.4 9.2L11 3.2l7.6 6v8.4a1.6 1.6 0 01-1.6 1.6H5a1.6 1.6 0 01-1.6-1.6V9.2z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />,
  calendar: (c) => <><rect x="3.2" y="4.6" width="15.6" height="14.2" rx="3" stroke={c} strokeWidth="1.5" /><path d="M3.2 9h15.6M7.6 2.8v3.2M14.4 2.8v3.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></>,
  tasks: (c) => <><path d="M3.6 5.6h9.4M3.6 11h9.4M3.6 16.4h6.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" /><path d="M16 4.4l1.4 1.4L20 3.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  planner: (c) => <><rect x="3.2" y="3.2" width="15.6" height="15.6" rx="3.4" stroke={c} strokeWidth="1.5" /><path d="M7 11.2l2.6 2.6L15 8.4" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  focus: (c) => <><circle cx="11" cy="12" r="7" stroke={c} strokeWidth="1.5" /><path d="M11 8.4V12l2.4 1.6M8.6 2.6h4.8" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></>,
  none: (c) => <path d="M6 11h10" stroke={c} strokeWidth="1.6" strokeLinecap="round" />,
};
export function Places({ state, dogId, update }) {
  const { t } = useLang();
  const fav = state.favorite === dogId;
  const mine = placesOf(state, dogId);
  const tiles = [...PLACES, 'none'];
  return (
    <div style={{ ...CARD, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 750 }}>{t('pw.live.title')}</div>
        <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{t('pw.live.pick', { n: DOG_MAX_PLACES })}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
        {tiles.map((p) => {
          const on = p === 'none' ? !mine.length && !fav : (p === 'home' && fav) || mine.includes(p);
          const locked = p === 'home' && fav;
          const blocked = !on && p !== 'none' && (mine.length >= DOG_MAX_PLACES || !placeHasRoom(state, p, dogId));
          const full = !on && p !== 'none' && !placeHasRoom(state, p, dogId);
          return (
            <div
              key={p}
              onClick={locked || blocked ? undefined : () => update((s) => togglePlace(s, dogId, p === 'none' ? null : p))}
              style={{ position: 'relative', height: 76, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: locked || blocked ? 'default' : 'pointer', background: on ? 'rgba(139,109,255,.16)' : 'rgba(255,255,255,.04)', border: `1.5px solid ${on ? '#8b6dff' : 'rgba(255,255,255,.06)'}`, opacity: blocked ? 0.4 : 1 }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">{PLACE_ICON[p](on ? '#c9baff' : '#8a8a99')}</svg>
              <span style={{ fontSize: 12, fontWeight: 750, color: on ? '#fff' : '#b9b9c8', textAlign: 'center', lineHeight: 1.15, padding: '0 4px' }}>{t('pw.place.' + p)}</span>
              {full && <span style={{ position: 'absolute', top: 5, right: 7, fontSize: 9.5, fontWeight: 800, color: '#8a8a99' }}>{t('pw.live.full')}</span>}
              {on && p !== 'none' && <span style={{ position: 'absolute', top: 6, right: 7, width: 17, height: 17, borderRadius: '50%', background: '#8b6dff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900 }}>✓</span>}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 10, lineHeight: 1.45 }}>{t('pw.live.note', { n: PLACE_MAX_DOGS })}</div>
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
