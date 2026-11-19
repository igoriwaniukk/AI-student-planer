import { useLang } from '../../lib/useLang';
import { MISSION_COINS } from '../../lib/pugWorld/logic.js';
import { missionProgress } from './missionUtil';
import { CoinIcon } from './icons';

// Shared by the Home card and the Missions page: one daily mission with a
// thick progress bar ("1 / 2" inside), and the hours until they reset.
const MISSION_ICON = { session: '📖', session2: '📚', chest: '🎁', chest2: '🎁', dress: '👕', plan: '🗓️', trick: '✨', album: '📒' };
const MISSION_TINT = { session: '#2ee6c5', session2: '#2ee6c5', chest: '#f5a524', chest2: '#f5a524', dress: '#ff7eb6', plan: '#a58cff', trick: '#ffd166', album: '#5aa9ff' };

export function ThickBar({ pct, done, height = 18, label }) {
  return (
    <div style={{ position: 'relative', height, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.max(0, Math.min(100, pct)) + '%', borderRadius: 99, background: done ? 'linear-gradient(90deg,#2fbf73,#35d07f)' : 'linear-gradient(90deg,#8b6dff,#a58cff)' }}>
        <div style={{ position: 'absolute', left: 8, right: 8, top: Math.round(height * 0.22), height: 3, borderRadius: 9, background: 'rgba(255,255,255,.3)' }} />
      </div>
      {label != null && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: height >= 18 ? 11.5 : 10.5, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.35)' }}>{label}</div>}
    </div>
  );
}

export function MissionRow({ state, m, big = false }) {
  const { t } = useLang();
  const { have, n } = missionProgress(state, m);
  const tint = MISSION_TINT[m.id] || '#a58cff';
  const size = big ? 42 : 34;
  return (
    <div data-mission-row={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: big ? '13px 0' : '8px 0' }}>
      <div style={{ width: size, height: size, borderRadius: 12, background: tint + '22', display: 'grid', placeItems: 'center', fontSize: big ? 20 : 16, flex: 'none' }}>{MISSION_ICON[m.id] || '⭐'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: big ? 15 : 13.5, fontWeight: 700, marginBottom: big ? 8 : 6, color: m.done ? '#a3a3b3' : '#f4f4f7' }}>{t('pw.mission.' + m.id)}</div>
        <ThickBar pct={(have / n) * 100} done={m.done} height={big ? 20 : 16} label={(m.done ? '✓ ' : '') + have + ' / ' + n} />
      </div>
      <span data-mission-chip={m.id} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: m.done ? '#7fe3ad' : '#ffd27a', padding: '4px 9px', borderRadius: 99, background: m.done ? 'rgba(53,208,127,.1)' : 'rgba(245,165,36,.12)', border: `1px solid ${m.done ? 'rgba(53,208,127,.3)' : 'rgba(245,165,36,.3)'}` }}>
        <CoinIcon size={13} />+{MISSION_COINS}
      </span>
    </div>
  );
}
