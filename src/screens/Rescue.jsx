import { useEffect, useState } from 'react';
import { REASON_OPTIONS, RESCUE_TIME_OPTIONS } from '../lib/plannerData';
import { durOf, hm, fmt, rescueCandidates } from '../lib/plannerLogic';
import { iconForTask, iconForActivity } from '../lib/taskAuto';
import { Eyebrow, SettingRow, ROW_LINE } from '../components/ListRows';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { BackButton, StickyFooter, PrimaryButton, Chip, EnergyPicker } from '../components/ui';
import { useLang } from '../lib/useLang';

// The real current time, re-read every 30s — this screen is specifically
// about "what's the situation right now," so a frozen clock (this used to
// be a hardcoded "Teraz 16:50"/"Now 4:50 PM" string, always the same
// regardless of when you actually opened it) undermines the whole premise.
function NowClock() {
  const { t } = useLang();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  return <>{t('rescue.nowLabel', { time })}</>;
}

export default function Rescue({ planner }) {
  const { t } = useLang();
  const { state, constraints, toggleReason, setRescueTime, update, openTaskEdit, rescueGenerate, go } = planner;
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const notEnoughTime = state.rescueTime === '45 min' && !state.rescueMoved;
  const noSafeBlock = state.rescueTime === 'Własny czas';
  // Only what a restart can still rearrange: today's unfinished tasks.
  const remainingIds = rescueCandidates(state.taskDefs, state.tasks, state.taskState);
  const remainingCount = remainingIds.length;

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 150px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('home')} />
        <span style={{ fontSize: 13, fontWeight: 650, color: '#8a8a99' }}><NowClock /></span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('rescue.title')}</div>
      <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 6 }}>{t('rescue.tasksLeft', { n: remainingCount })} · {t('rescue.sleep', { time: fmt(constraints.bedtimeMinutes) })}</div>

      <Eyebrow text={t('rescue.whatChanged')} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 11 }}>
        {REASON_OPTIONS.map((r) => (
          <Chip key={r} label={t(VALUE_KEY[r]) || r} active={state.reasons.includes(r)} onClick={() => toggleReason(r)} />
        ))}
      </div>

      <Eyebrow text={t('rescue.remaining')} />
      {state.taskDefs.filter((d) => remainingIds.includes(d.id)).map((d) => (
        <div key={d.id} role="button" onClick={() => openTaskEdit(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: ROW_LINE, cursor: 'pointer' }}>
          <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none' }}>{iconForTask(d)}</span>
          <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
          <span style={{ fontSize: 13, color: '#8a8a99', whiteSpace: 'nowrap' }}>{hm(durOf(d.id, state.taskDefs, state.durOverride))} <span style={{ color: '#5f5f70' }}>›</span></span>
        </div>
      ))}

      <Eyebrow text={t('planner.yourDay')} />
      <SettingRow icon="⏳" label={t('planner.studyTime')} value={t(VALUE_KEY[state.rescueTime]) || state.rescueTime} open={open === 'time'} onClick={() => toggle('time')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {RESCUE_TIME_OPTIONS.map((rt) => (
            <Chip key={rt} label={t(VALUE_KEY[rt]) || rt} active={state.rescueTime === rt} onClick={() => setRescueTime(rt)} />
          ))}
        </div>
      </SettingRow>
      <SettingRow icon="⚡" label={t('rescue.energy')} value={t(VALUE_KEY[state.rescueEnergy]) || state.rescueEnergy} open={open === 'energy'} onClick={() => toggle('energy')}>
        <EnergyPicker value={state.rescueEnergy} onChange={(v) => update({ rescueEnergy: v })} />
      </SettingRow>
      {constraints.blocks.map((b) => (
        <SettingRow key={b.label + b.start} icon={iconForActivity(b.label) || '📌'} label={b.label} value={'🔒 ' + fmt(b.start) + '–' + fmt(b.end)} color="#8fbaff" />
      ))}
      <SettingRow icon="🌙" label={t('rescue.sleepLabel')} value={'🔒 ' + fmt(constraints.bedtimeMinutes)} color="#8fbaff" />

      {notEnoughTime && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: 'rgba(245,165,36,.07)', border: '1px solid rgba(245,165,36,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.45, color: '#f7c46c' }}>⚠ {t('rescue.notEnoughTime')}</div>
          <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
            <div onClick={() => setRescueTime('1 godz. 30 min')} style={{ flex: 1, minHeight: 42, padding: '6px 8px', borderRadius: 13, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, textAlign: 'center', lineHeight: 1.25, cursor: 'pointer' }}>{t('rescue.increaseTime')}</div>
            <div onClick={() => update({ rescueMoved: true })} style={{ flex: 1, minHeight: 42, padding: '6px 8px', borderRadius: 13, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, textAlign: 'center', lineHeight: 1.25, cursor: 'pointer' }}>{t('rescue.moveLessImportant')}</div>
          </div>
        </div>
      )}
      {noSafeBlock && <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.45, color: '#a3a3b3' }}>{t('rescue.noSafeBlock')}</div>}

      <StickyFooter>
        <PrimaryButton onClick={rescueGenerate}>{t('rescue.rescueBtn')}</PrimaryButton>
      </StickyFooter>
    </div>
    </>
  );
}
