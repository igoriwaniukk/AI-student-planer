import { useLang } from '../lib/useLang';
import { TASK_TEXT_KEY, VALUE_KEY } from '../lib/i18n';
import { BottomSheet } from './ui';

// How the session went (real minutes, difficulty, how well it's known) —
// opened by Finish on the focus screen or Home, rendered app-wide.
export default function FinishSheet({ planner }) {
  const { t } = useLang();
  const { state, def, cancelFinish, confirmFinish, update } = planner;
  if (!state.finishTask) return null;
  const d = def(state.finishTask);
  const HARD = ['Łatwa', 'W sam raz', 'Trudna'];
  const KNOW = ['Nie umiem', 'Częściowo umiem', 'Dobrze umiem', 'Opanowane'];
  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('home.finishSession', { title: t(TASK_TEXT_KEY[d.id]?.title) || d.title })}</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t('home.finishSessionSub')}</div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.actualTime')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div onClick={() => update((s) => ({ finishDur: Math.max(5, s.finishDur - 5) }))} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: 750 }}>{state.finishDur} min</div>
        <div onClick={() => update((s) => ({ finishDur: s.finishDur + 5 }))} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.howHard')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        {HARD.map((x) => (
          <div key={x} onClick={() => update({ finishHard: x })} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.finishHard === x ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.finishHard === x ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)'), color: state.finishHard === x ? '#e6dfff' : '#c9c9d6' }}>{t(VALUE_KEY[x]) || x}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.howWell')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {KNOW.map((x) => (
          <div key={x} onClick={() => update({ finishKnow: x })} style={{ padding: '14px 15px', fontSize: 14, fontWeight: state.finishKnow === x ? 700 : 550, cursor: 'pointer', color: state.finishKnow === x ? '#e6dfff' : '#c9c9d6', background: state.finishKnow === x ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.03)', borderRadius: 13, border: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between' }}>
            {t(VALUE_KEY[x]) || x}{state.finishKnow === x && <span style={{ color: '#a58cff' }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={cancelFinish} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('home.cancel')}</div>
        <div onClick={confirmFinish} style={{ flex: 1.4, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('home.finishSessionBtn')}</div>
      </div>
    </BottomSheet>
  );
}
