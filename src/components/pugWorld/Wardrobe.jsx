import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { OUTFITS } from '../../lib/pugWorld/catalog.js';
import { toggleOutfit } from '../../lib/pugWorld/logic.js';
import { CoinIcon, HangerIcon, OutfitPic } from './icons';
import { CARD } from './theme';

// The wardrobe: Head / Face / Neck, then every outfit of that slot as a
// picture. Tap one you own to put it on (tap again, or "None", to take it
// off); grey ones aren't yours yet (price shown, tap to go to the Shop).
const SLOTS = ['head', 'face', 'neck'];
const OWN_BG = '#c9d8f5';

export default function Wardrobe({ state, dogId, update, onShop, style }) {
  const { t } = useLang();
  const [slot, setSlot] = useState('head');
  const worn = state.outfits.worn[dogId] || {};
  const wornCount = SLOTS.filter((s) => worn[s]).length;
  const list = OUTFITS.filter((o) => o.slot === slot);
  const ring = { boxShadow: '0 0 0 2.5px #0f0e15, 0 0 0 4.5px #8b6dff' };
  const tileBase = { flex: 'none', width: 88, height: 96, borderRadius: 16, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <div style={{ ...CARD, marginTop: 14, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <HangerIcon />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 750 }}>{t('pw.outfits')}</div>
        {wornCount > 0 && <span style={{ fontSize: 12, color: '#8a8a99' }}>{t('pw.wornCount', { n: wornCount })}</span>}
      </div>
      <div style={{ display: 'flex', padding: 3, borderRadius: 12, background: 'rgba(255,255,255,.06)', marginBottom: 12 }}>
        {SLOTS.map((s) => (
          <div key={s} onClick={() => setSlot(s)} style={{ flex: 1, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer', ...(s === slot ? { background: '#8b6dff', color: '#fff' } : { color: '#a3a3b3' }) }}>
            {t('pw.slot.' + s)}{worn[s] && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s === slot ? '#fff' : '#a58cff' }} />}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 9, overflowX: 'auto', margin: '0 -15px', padding: '5px 15px 6px' }}>
        <div onClick={() => worn[slot] && update((s) => toggleOutfit(s, dogId, worn[slot]))} style={{ ...tileBase, border: '1.5px dashed rgba(255,255,255,.18)', gap: 6, ...(!worn[slot] ? ring : {}) }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7a7a8a" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M5.6 18.4L18.4 5.6" /></svg>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8a99' }}>{t('pw.none')}</div>
        </div>
        {list.map((o) => {
          const own = state.outfits.owned.includes(o.id);
          const on = worn[slot] === o.id;
          return (
            <div key={o.id} onClick={() => (own ? update((s) => toggleOutfit(s, dogId, o.id)) : onShop?.())} style={{ ...tileBase, background: own ? OWN_BG : 'rgba(255,255,255,.05)', ...(on ? ring : {}) }}>
              <OutfitPic id={o.id} size={52} style={own ? undefined : { filter: 'grayscale(1)', opacity: 0.4 }} />
              <div style={{ fontSize: 10.5, fontWeight: 750, color: own ? '#2a2440' : '#8a8a99', marginTop: 4, textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>{t('pw.outfit.' + o.id)}</div>
              {!own && <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 800, color: '#ffd27a', marginTop: 2 }}><CoinIcon size={11} />{o.price}</div>}
              {on && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: '#8b6dff', display: 'grid', placeItems: 'center' }}>
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
