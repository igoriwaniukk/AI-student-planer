import { fmt } from '../lib/plannerLogic';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { BottomSheet } from './ui';

export default function BlockEditSheet({ planner }) {
  const { t } = useLang();
  const { state, def, moveBlockEdit, cancelBlockEdit, saveBlockEdit } = planner;
  const b = state.blockEdit;
  if (!b) return null;
  const d = def(b.id);
  const msg = b.msg ? t(b.msg.key, { subject: (b.msg.vars?.subject && (t(VALUE_KEY[b.msg.vars.subject]) || b.msg.vars.subject)) || '' }) : '';

  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('block.changeTitle', { subject: t(VALUE_KEY[d.subject]) || d.subject })}</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t('block.lockedNote')}</div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('block.startTime')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <Stepper onClick={() => moveBlockEdit({ start: Math.max(880, b.start - 15) })} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: 750 }}>{fmt(b.start)}</div>
        <Stepper plus onClick={() => moveBlockEdit({ start: Math.min(1320, b.start + 15) })} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('block.duration')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <Stepper onClick={() => moveBlockEdit({ dur: Math.max(15, b.dur - 5) })} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: 750 }}>{b.dur} min</div>
        <Stepper plus onClick={() => moveBlockEdit({ dur: Math.min(180, b.dur + 5) })} />
      </div>

      <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 14 }}>{t('block.end', { time: fmt(b.start + b.dur) })}</div>

      {msg && (
        <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c' }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={cancelBlockEdit} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('block.cancel')}</div>
        <div
          onClick={saveBlockEdit}
          style={{ flex: 1.3, height: 50, borderRadius: 15, background: b.msg ? 'rgba(255,255,255,.06)' : 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: b.msg ? '#6b6b7a' : '#fff', cursor: 'pointer' }}
        >
          {t('block.saveChanges')}
        </div>
      </div>
    </BottomSheet>
  );
}

function Stepper({ plus, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>
      {plus ? '+' : '−'}
    </div>
  );
}
