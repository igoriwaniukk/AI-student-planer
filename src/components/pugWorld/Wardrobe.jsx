import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { OUTFITS, SLOTS, DOG_BY_ID } from '../../lib/pugWorld/catalog.js';
import { toggleOutfit, fullSetOn, SET_BONUS } from '../../lib/pugWorld/logic.js';
import { CoinIcon, HangerIcon, OutfitPic } from './icons';
import DogThumb from './DogThumb';
import { CARD, RARITY_BRIGHT } from './theme';

// Dress up: the dog wearing its outfits on the left, the 4 slots (Head /
// Face / Neck / Body) as buttons showing what's on; under them every outfit
// of the chosen slot. Tap one you own to put it on (tap again, or "None",
// to take it off); grey ones aren't yours yet (price, tap to go to the Shop).
const OWN_BG = '#ddeeff';
const BLUE = ['#7fd6ff', '#1cb0f6', '#1899d6'];

export default function Wardrobe({ state, dogId, update, onShop, style }) {
  const { t } = useLang();
  const [slot, setSlot] = useState('head');
  const worn = state.outfits.worn[dogId] || {};
  const wornCount = SLOTS.filter((s) => worn[s]).length;
  const fullSet = fullSetOn(state, dogId);
  const isFav = state.favorite === dogId;
  const list = OUTFITS.filter((o) => o.slot === slot);
  const [light, base, shade] = RARITY_BRIGHT[DOG_BY_ID[dogId]?.rarity] || RARITY_BRIGHT.common;
  const tileBase = { flex: 'none', width: 86, height: 108, borderRadius: 18, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 4 };
  return (
    <div style={{ ...CARD, marginTop: 14, borderRadius: 22, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 11, background: '#1fd1ae', boxShadow: '0 3px 0 #14a88b', display: 'grid', placeItems: 'center', flex: 'none' }}><HangerIcon color="#fff" /></div>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 900 }}>{t('pw.dressUp')}</div>
        {fullSet
          ? <span style={{ fontSize: 11.5, fontWeight: 800, color: '#7fe3ad', padding: '3px 9px', borderRadius: 99, background: 'rgba(53,208,127,.1)', border: '1px solid rgba(53,208,127,.35)' }}>✓ {t('pw.set.' + fullSet)}{isFav ? ' · +' + SET_BONUS + '%' : ''}</span>
          : wornCount > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: '#1fd1ae' }}>{t('pw.wornCount', { n: wornCount })}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 108, height: 108, flex: 'none', borderRadius: 24, background: `radial-gradient(circle at 50% 45%, ${light}, ${base} 60%, ${shade})`, boxShadow: `0 4px 0 ${shade}`, display: 'grid', placeItems: 'center', marginBottom: 4 }}>
          <DogThumb dogId={dogId} worn={worn} size={102} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SLOTS.map((s) => {
            const on = s === slot;
            return (
              <div key={s} onClick={() => setSlot(s)} style={{ height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '0 7px', cursor: 'pointer', marginBottom: 3, ...(on ? { background: BLUE[1], boxShadow: `0 3px 0 ${BLUE[2]}` } : { background: '#1f1c2b', boxShadow: '0 3px 0 #0f0e17' }) }}>
                <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: worn[s] ? OWN_BG : 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center' }}>
                  {worn[s] ? <OutfitPic id={worn[s]} size={26} /> : <span style={{ color: on ? '#fff' : '#6f6f80', fontWeight: 900, fontSize: 16 }}>+</span>}
                </div>
                <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 900, color: on ? '#fff' : '#b9b9c8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('pw.slot.' + s)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '12px -15px 0', padding: '4px 15px 6px' }}>
        <div onClick={() => worn[slot] && update((s) => toggleOutfit(s, dogId, worn[slot]))} style={{ ...tileBase, border: `2px dashed ${!worn[slot] ? BLUE[1] : 'rgba(255,255,255,.15)'}`, gap: 6 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8a8a99" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M5.6 18.4L18.4 5.6" /></svg>
          <div style={{ fontSize: 11.5, fontWeight: 900, color: '#8a8a99' }}>{t('pw.none')}</div>
        </div>
        {list.map((o) => {
          const own = state.outfits.owned.includes(o.id);
          const on = worn[slot] === o.id;
          return (
            <div key={o.id} onClick={() => (own ? update((s) => toggleOutfit(s, dogId, o.id)) : onShop?.())} style={{ ...tileBase, ...(own ? { background: OWN_BG, boxShadow: on ? `0 4px 0 #9fbfe0, 0 0 0 3px ${BLUE[1]}` : '0 4px 0 #9fbfe0' } : { background: '#1f1c2b', boxShadow: '0 4px 0 #0f0e17' }) }}>
              <OutfitPic id={o.id} size={48} style={own ? undefined : { filter: 'grayscale(1)', opacity: 0.45 }} />
              <div style={{ fontSize: 11, fontWeight: 900, color: own ? '#2a2440' : '#b9b9c8', marginTop: 3, textAlign: 'center', lineHeight: 1.15, padding: '0 4px' }}>{t('pw.outfit.' + o.id)}</div>
              {!own && <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 900, color: '#fff', marginTop: 4, padding: '2px 8px', borderRadius: 99, background: '#58cc02', boxShadow: '0 2px 0 #46a302' }}><CoinIcon size={11} />{o.price}</div>}
              {on && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: BLUE[1], display: 'grid', placeItems: 'center' }}>
                  <svg width="11" height="9" viewBox="0 0 13 11"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
