import { PRIO_STYLE } from '../lib/plannerData';
import { durOf } from '../lib/plannerLogic';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import AmbientGlow from '../components/AmbientGlow';
import TaskEditSheet from '../components/TaskEditSheet';

const DEFAULT_TASK_ICON = '📘';

export default function Tasks({ planner }) {
  const { t } = useLang();
  const { state, toggleTask, openTaskEdit, openNewTaskEdit } = planner;

  return (
    <>
    <AmbientGlow />
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px', position: 'relative', zIndex: 50 }}>
      <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.02em', marginTop: 20 }}>{t('tasks.title')}</div>
      <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 4 }}>{t('tasks.subtitle')}</div>

      <div style={{ marginTop: 18 }}>
        {state.taskDefs.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('tasks.empty')}</div>
        )}
        {state.taskDefs.map((d, i) => {
          const on = state.tasks[d.id];
          const ps = PRIO_STYLE[d.priority] || PRIO_STYLE['Normalny priorytet'];
          return (
            <div
              key={d.id}
              onClick={() => toggleTask(d.id)}
              style={{ marginTop: i ? 12 : 0, padding: 14, borderRadius: 18, cursor: 'pointer', background: on ? 'rgba(124,92,255,.07)' : 'rgba(255,255,255,.03)', border: '1.5px solid ' + (on ? 'rgba(124,92,255,.55)' : 'rgba(255,255,255,.07)') }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#7c5cff' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (on ? '#7c5cff' : 'rgba(255,255,255,.18)') }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ opacity: on ? 1 : 0 }}><path d="M1 5l3.4 3.4L11 1.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{DEFAULT_TASK_ICON}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: d.color, textTransform: 'uppercase' }}>{t(VALUE_KEY[d.subject]) || d.subject}</span>
                    <span style={{ fontSize: 10, fontWeight: 650, padding: '3px 8px', borderRadius: 7, color: ps.color, background: ps.bg }}>{t(VALUE_KEY[d.priority]) || d.priority}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 6 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: 9 }}>
                    {d.deadline && <span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524', padding: '4px 8px', borderRadius: 8, background: 'rgba(245,165,36,.13)', border: '1px solid rgba(245,165,36,.28)' }}>⚠ {t(TASK_TEXT_KEY[d.id]?.deadline) || d.deadline}</span>}
                    <span style={{ fontSize: 11.5, color: '#8a8a99' }}>🕐 {durOf(d.id, state.taskDefs, state.durOverride)} min</span>
                  </div>
                </div>
                <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ fontSize: 12, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('planner.edit')}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div onClick={openNewTaskEdit} style={{ marginTop: 12, height: 50, borderRadius: 16, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}>{t('planner.addTask')}</div>

      <TaskEditSheet planner={planner} />
    </div>
    </>
  );
}
