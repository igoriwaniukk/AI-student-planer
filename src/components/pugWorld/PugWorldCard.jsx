import { useLang } from '../../lib/useLang';
import { DOGS } from '../../lib/pugWorld/catalog.js';
import { openPugWorld } from '../../lib/pugWorld/events';
import { AppShellPortal } from '../ui';
import DogThumb from './DogThumb';
import ChestIcon from './Chest';

// Home: the way into Pug World — the favourite dog and the chests waiting.
export default function PugWorldCard({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled) return null;
  const { state } = pw;
  const chests = state.chests.length;
  const owned = Object.keys(state.dogs).length;
  const sub = !pw.started ? t('pw.home.start') : chests ? t('pw.home.chests', { n: chests }) : t('pw.dogsOf', { n: owned, total: DOGS.length });
  return (
    <div onClick={() => openPugWorld()} style={{ marginTop: 12, padding: '10px 14px 10px 8px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'linear-gradient(160deg,rgba(139,109,255,.16),rgba(139,109,255,.04))', border: '1px solid rgba(139,109,255,.35)' }}>
      {pw.started ? <DogThumb dogId={state.favorite} worn={state.outfits.worn[state.favorite]} size={58} /> : <div style={{ width: 58, height: 58, display: 'grid', placeItems: 'center', fontSize: 34 }}>🐶</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 750 }}>{t('pw.title')}</div>
        <div style={{ fontSize: 12.5, color: chests ? '#c9baff' : '#a3a3b3', marginTop: 3 }}>{sub}</div>
      </div>
      {chests > 0 && (
        <div style={{ position: 'relative' }}>
          <ChestIcon type="small" size={38} />
          <span style={{ position: 'absolute', top: -4, right: -6, fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: '#ff5f6d' }}>{chests}</span>
        </div>
      )}
      <span style={{ color: '#7a7a8c', fontSize: 18 }}>›</span>
    </div>
  );
}

// After a finished session: "+1 chest" at the top, tap to open the game.
export function PugWorldToast({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.toast || pw.open) return null;
  return (
    <AppShellPortal>
      <div
        onClick={() => { pw.clearToast(); openPugWorld(); }}
        style={{ position: 'absolute', left: 16, right: 16, top: 'calc(var(--top-pad) + 8px)', zIndex: 120, padding: '10px 14px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: '#17132a', border: '1px solid rgba(139,109,255,.55)', boxShadow: '0 16px 40px rgba(0,0,0,.55)', animation: 'fadeUp .3s ease both' }}
      >
        <ChestIcon type="small" size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 750 }}>{t('pw.toast.title')}</div>
          <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 2 }}>{t('pw.toast.sub')}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 750, color: '#c9baff' }}>{t('pw.open')}</span>
      </div>
    </AppShellPortal>
  );
}
