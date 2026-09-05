import { PRIO_STYLE } from '../lib/plannerData';
import { durOf, hm } from '../lib/plannerLogic';
import { BackButton, StickyFooter, PrimaryButton, Chip, EnergyPicker } from '../components/ui';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';

const TASK_ICONS = { math: '📐', bio: '🔬', eng: '🗣' };
const PREFS = ['Wolny wieczór', 'Najpierw najtrudniejsze', 'Więcej krótkich przerw'];

export default function Planner({ planner }) {
  const { t } = useLang();
  const { state, toggleTask, openTaskEdit, update, generatePlan, go } = planner;
  const nTasks = state.tasks.filter(Boolean).length;
  const mins = [60, 45, 30].reduce((a, m, i) => a + (state.tasks[i] ? m : 0), 0);
  const sumTime = hm(mins);

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 176px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('home')} />
        <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.12em', color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.45)' }}>{t('planner.badge')}</span>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)' }} />
      </div>

      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 22 }}>{t('planner.title')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{t('planner.date')}</div>
      <div style={{ fontSize: 13, color: '#8a8a99', lineHeight: 1.45, marginTop: 6 }}>{t('planner.subtitle')}</div>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b6dff' }} />
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t('planner.alreadyPlanned')}</span>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 650, color: '#a58cff' }}>{t('planner.edit')}</span>
        </div>
        <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 7 }}>{t('planner.aiWontChange')}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '13px -14px 0' }} />
        {[['🏫', t('planner.school'), t('planner.schoolSub'), '8:00–14:40'], ['🎾', t('planner.tennis'), t('planner.tennisSub'), '18:00–19:00']].map(([icon, title, sub, time]) => (
          <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 0 0' }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div><div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 1 }}>{sub}</div></div>
            <span style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6' }}>{time}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('planner.whatToDo')}</div>
      {state.taskDefs.map((d, i) => {
        const on = state.tasks[i];
        const ps = PRIO_STYLE[d.priority] || PRIO_STYLE['Normalny priorytet'];
        return (
          <div
            key={d.id}
            onClick={() => toggleTask(i)}
            style={{ marginTop: i ? 12 : 0, padding: 14, borderRadius: 18, cursor: 'pointer', background: on ? 'rgba(124,92,255,.07)' : 'rgba(255,255,255,.03)', border: '1.5px solid ' + (on ? 'rgba(124,92,255,.55)' : 'rgba(255,255,255,.07)') }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#7c5cff' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (on ? '#7c5cff' : 'rgba(255,255,255,.18)') }}>
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ opacity: on ? 1 : 0 }}><path d="M1 5l3.4 3.4L11 1.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{TASK_ICONS[d.id]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: d.color, textTransform: 'uppercase' }}>{d.subject}</span>
                  <span style={{ fontSize: 10, fontWeight: 650, padding: '3px 8px', borderRadius: 7, color: ps.color, background: ps.bg }}>{d.priority}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 6 }}>{d.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: 9 }}>
                  {d.deadline && <span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524', padding: '4px 8px', borderRadius: 8, background: 'rgba(245,165,36,.13)', border: '1px solid rgba(245,165,36,.28)' }}>⚠ {d.deadline}</span>}
                  <span style={{ fontSize: 11.5, color: '#8a8a99' }}>🕐 {durOf(d.id, state.taskDefs, state.durOverride)} min</span>
                </div>
                {d.id === 'math' && <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 8 }}>{t('planner.readiness')}</div>}
              </div>
              <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ fontSize: 12, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('planner.edit')}</span>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 12, height: 50, borderRadius: 16, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}>{t('planner.addTask')}</div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em' }}>{t('planner.whenFree')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          {['15:30', '21:30'].map((tm, i) => (
            <div key={tm} style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 7 }}>{i === 0 ? t('planner.from') : t('planner.to')}</div>
              <div style={{ height: 56, borderRadius: 15, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
                <span style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.01em' }}>{tm}</span>
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.2" stroke="#9a9aab" strokeWidth="1.3" /><path d="M9 5.2V9l2.6 1.8" stroke="#9a9aab" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: 13, borderRadius: 15, background: 'rgba(53,208,127,.07)', border: '1px solid rgba(53,208,127,.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#35d07f' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#5fdd9b' }}>{t('planner.freeHours')}</span></div>
          <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 6 }}>{t('planner.freeRanges')}</div>
          <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 4 }}>{t('planner.aiBreaks')}</div>
        </div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('planner.energyQ')}</div>
      <EnergyPicker value={state.energy} onChange={(v) => update({ energy: v })} />

      <div style={{ fontSize: 14.5, fontWeight: 700, margin: '20px 0 11px' }}>{t('planner.prefQ')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {PREFS.map((p) => (
          <Chip key={p} label={t(VALUE_KEY[p]) || p} active={state.pref === p} onClick={() => update({ pref: p })} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, margin: '20px 0 10px' }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{t('planner.noteLabel')}</span>
        <span style={{ fontSize: 12, color: '#7a7a8a' }}>{t('planner.optional')}</span>
      </div>
      <textarea
        placeholder={t('planner.notePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 96, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: 14, fontSize: 13.5, lineHeight: 1.5, color: '#f4f4f7', fontFamily: 'inherit', resize: 'vertical' }}
      />

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('planner.summary')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <Row label={t('planner.tasks')} value={nTasks === 1 ? t('planner.oneTask') : t('planner.nTasks', { n: nTasks })} />
          <Row label={t('planner.studyTime')} value={sumTime} />
          <Row label={t('planner.availableTime')} value={t('planner.availableTimeValue')} />
          <Row label={t('planner.energy')} value={t(VALUE_KEY[state.energy]) || state.energy} />
          <Row label={t('planner.preference')} value={t(VALUE_KEY[state.pref]) || state.pref} />
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '15px -16px' }} />
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ color: '#35d07f', fontSize: 12 }}>✓</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: '#a3a3b3' }}>{t('planner.willFit')}</span>
        </div>
      </div>

      <StickyFooter>
        <PrimaryButton onClick={generatePlan}>{t('planner.buildPlan')}</PrimaryButton>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: '#7a7a8a', marginTop: 11 }}>{t('planner.canChange')}</div>
      </StickyFooter>

      <TaskEditSheet planner={planner} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#9a9aab' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}
