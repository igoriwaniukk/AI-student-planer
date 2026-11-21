import { useLang } from '../../lib/useLang';
import { missionProgress, missionLabel, MISSION_ICON, MISSION_TINT } from './missionUtil';
import ChestIcon from './Chest';

// Shared by the Home card and the Missions page: one daily mission with a
// thick progress bar ("1 / 2" inside) and the chest it gives at the end.

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
        <ThickBar pct={(have / n) * 100} done={m.done} height={big ? 20 : 16} label={(m.done ? '✓ ' : '') + missionLabel(m.id, have, n)} />
      </div>
      <span data-mission-chip={m.id} style={{ flex: 'none', width: big ? 44 : 38, display: 'grid', placeItems: 'center', opacity: m.done ? 0.55 : 1 }}>
        <ChestIcon type="small" size={big ? 40 : 34} open={m.done} />
      </span>
    </div>
  );
}
