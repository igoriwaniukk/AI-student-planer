import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { DOG_BY_ID } from '../../lib/pugWorld/catalog.js';
import { LEVEL_COPIES, MAX_LEVEL, dogPower, dogPerk, bumpMission, PLACES, DOG_MAX_PLACES, PLACE_MAX_DOGS, placesOf, placeHasRoom, togglePlace } from '../../lib/pugWorld/logic.js';
import Dog2D from './Dog2D';
import Wardrobe from './Wardrobe';
import { CoinIcon } from './icons';
import { dogName } from './names';
import { RarityPill, Stars, TopBar, Chunky, ColorStage } from './bits';
import { ThickBar } from './missionBits';
import { CARD } from './theme';

// One dog up close: tap it to jump, a trick, outfits, set as favourite, its level
// (copies towards the next star), power and perk, and which screens it lives on.
export default function DogShowcase({ pw, dogId, onClose, onShop }) {
  const { t } = useLang();
  const { state, update } = pw;
  const dog = DOG_BY_ID[dogId];
  const have = state.dogs[dogId] || { level: 1, copies: 0 };
  const worn = state.outfits.worn[dogId] || {};
  const [trick, setTrick] = useState(0);
  const [jump, setJump] = useState(0);
  const fav = state.favorite === dogId;
  const perk = dogPerk(dogId, have.level);
  const need = have.level < MAX_LEVEL ? LEVEL_COPIES[have.level + 1] : 0;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#08080c', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', animation: 'fadeUp .2s ease both' }}>
      <TopBar title={dogName(t, dogId)} onBack={onClose} back="‹" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px calc(var(--safe-bottom) + 24px)' }}>
        <div style={{ marginTop: 6 }}>
          <ColorStage rarity={dog.rarity} height={280} onTap={() => setJump((k) => k + 1)} onTrick={() => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); }}>
            <Dog2D dogId={dogId} worn={worn} trickKey={trick} happyKey={jump} />
          </ColorStage>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <RarityPill rarity={dog.rarity} solid />
          <Stars level={have.level} size={18} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          <Stat pal={['#ffc06b', '#ff9600', '#e08500']} label={t('pw.powerLabel')} value={'⚡ ' + dogPower(dogId, have.level)} />
          <Stat pal={['#7fd6ff', '#1cb0f6', '#1899d6']} label={t('pw.level')} value={need ? `${have.copies} / ${need}` : t('pw.max')} />
          <Stat pal={['#9be35a', '#58cc02', '#46a302']} label={t('pw.perk')} value={perk ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>+{perk}% <CoinIcon size={15} /></span> : '—'} />
        </div>
        {need > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#b9b9c8', marginBottom: 6 }}>{t('pw.res.copyDetail', { n: have.copies, total: need })}</div>
            <ThickBar pct={(have.copies / need) * 100} height={14} />
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {fav ? (
            <div style={{ height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, letterSpacing: '.04em', color: '#ffd84d', background: 'rgba(255,200,0,.12)', border: '2px solid rgba(255,200,0,.5)' }}>★ {t('pw.isFavorite')}</div>
          ) : (
            <Chunky pal={['#ffe680', '#ffc800', '#e5a900']} text="#5a3d00" onClick={() => update((s) => ({ ...s, favorite: dogId }))}>☆ {t('pw.setFavorite')}</Chunky>
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
              style={{ position: 'relative', height: 76, borderRadius: 16, marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: locked || blocked ? 'default' : 'pointer', ...(on ? { background: '#1cb0f6', boxShadow: '0 4px 0 #1899d6' } : { background: '#1f1c2b', boxShadow: '0 4px 0 #0f0e17' }), opacity: blocked ? 0.4 : 1 }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">{PLACE_ICON[p](on ? '#fff' : '#8a8a99')}</svg>
              <span style={{ fontSize: 12, fontWeight: 750, color: on ? '#fff' : '#b9b9c8', textAlign: 'center', lineHeight: 1.15, padding: '0 4px' }}>{t('pw.place.' + p)}</span>
              {full && <span style={{ position: 'absolute', top: 5, right: 7, fontSize: 9.5, fontWeight: 800, color: '#8a8a99' }}>{t('pw.live.full')}</span>}
              {on && p !== 'none' && <span style={{ position: 'absolute', top: 6, right: 7, width: 17, height: 17, borderRadius: '50%', background: '#fff', color: '#1899d6', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900 }}>✓</span>}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 10, lineHeight: 1.45 }}>{t('pw.live.note', { n: PLACE_MAX_DOGS })}</div>
    </div>
  );
}

function Stat({ label, value, pal }) {
  return (
    <div style={{ borderRadius: 18, padding: '10px 6px 11px', textAlign: 'center', color: '#fff', background: `linear-gradient(160deg, ${pal[1]}, ${pal[2]})`, boxShadow: `0 4px 0 ${pal[2]}`, marginBottom: 4 }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, opacity: 0.92 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3 }}>{value}</div>
    </div>
  );
}
