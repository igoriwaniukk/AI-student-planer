import { useRef, useState } from 'react';
import { NUM_TODAY, RECUR_DAYS } from '../lib/plannerData';
import { upcomingExams, examPrepProgress, finishedOnDay, taskDayLabel, formatMonthDay, dayInfo, isTaskOn } from '../lib/plannerLogic';
import { iconForTask, iconForSubject, iconForActivity } from '../lib/taskAuto';
import { DAY_KEY, VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import { BackButton, BottomSheet } from '../components/ui';

const DELETE_W = 84;

// A row that slides left to reveal a Delete button — by swiping, or by
// tapping its ⋯ for a mouse. The parent keeps only one row open at a time.
function SwipeRow({ open, onOpenChange, onDelete, onClick, border = 'rgba(255,255,255,.07)', children }) {
  const { t } = useLang();
  const [drag, setDrag] = useState(null);
  const start = useRef(null);
  const moved = useRef(false);
  const base = open ? -DELETE_W : 0;
  const x = drag ?? base;

  function down(e) {
    start.current = e.clientX;
    moved.current = false;
  }
  function move(e) {
    if (start.current == null) return;
    const dx = e.clientX - start.current;
    if (Math.abs(dx) > 6) moved.current = true;
    if (moved.current) setDrag(Math.min(0, Math.max(-DELETE_W, base + dx)));
  }
  function up() {
    if (start.current == null) return;
    start.current = null;
    if (drag != null) onOpenChange(drag < -DELETE_W / 2);
    setDrag(null);
  }
  function clickCapture(e) {
    if (moved.current) {
      e.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div style={{ position: 'relative', marginTop: 10, borderRadius: 18, overflow: 'hidden', background: x < 0 ? '#e5484d' : 'transparent' }}>
      <div
        onClick={onDelete}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
      >
        {t('plans.delete')}
      </div>
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={clickCapture}
        onClick={onClick}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px 12px 14px', borderRadius: x < 0 ? '18px 0 0 18px' : 18,
          background: '#131119', border: '1px solid ' + border, transform: `translateX(${x}px)`,
          transition: drag == null ? 'transform .2s ease' : 'none', touchAction: 'pan-y', cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {children}
        <span
          aria-label={t('plans.more')}
          onClick={(e) => { e.stopPropagation(); onOpenChange(!open); }}
          style={{ width: 30, height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, letterSpacing: 1, color: '#6b6b7a', cursor: 'pointer' }}
        >
          ⋯
        </span>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <>
      <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '22px 0 0 2px' }}>{icon} {title.toUpperCase()}</div>
      {children}
    </>
  );
}

function Empty({ text }) {
  return <div style={{ marginTop: 10, padding: '13px 14px', borderRadius: 16, border: '1px dashed rgba(255,255,255,.1)', fontSize: 12.5, color: '#7a7a8a' }}>{text}</div>;
}

function Title({ children }) {
  return <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{children}</div>;
}

function Sub({ children }) {
  return <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 2 }}>{children}</div>;
}

// Weekly activities are stored one entry per weekday; the same name, time
// and length on several days shows as one row ("Mon, Wed · 17:00 · 90 min").
function groupActivities(list) {
  const groups = new Map();
  (list || []).forEach((a) => {
    const key = a.name + '|' + a.start + '|' + a.dur;
    if (!groups.has(key)) groups.set(key, { key, name: a.name, start: a.start, dur: a.dur, ids: [], days: [] });
    const g = groups.get(key);
    g.ids.push(a.id);
    g.days.push(a.day);
  });
  return [...groups.values()].map((g) => ({ ...g, days: g.days.sort((x, y) => RECUR_DAYS.indexOf(x) - RECUR_DAYS.indexOf(y)) }));
}

// Tasks still ahead: prep sessions live under their exam, and a finished
// or past one-off isn't a plan any more.
function upcomingTasks(state) {
  return state.taskDefs
    .filter((d) => !d.id.startsWith('examsession-'))
    .filter((d) => {
      if (d.repeatDays && d.repeatDays.length) return true;
      if (d.day != null) {
        if (d.day < NUM_TODAY) return false;
        const st = state.taskState[d.id] || {};
        return d.category === 'personal' ? !isTaskOn(state.tasks, d, d.day) : !['completed', 'skipped'].includes(st.status);
      }
      return finishedOnDay(state, d) === null;
    })
    .sort((a, b) => {
      const rank = (d) => (d.repeatDays && d.repeatDays.length ? 1e6 : d.day ?? NUM_TODAY + 1);
      return rank(a) - rank(b);
    });
}

export default function Plans({ planner, recurringActivities, setRecurringActivities, onAddActivity }) {
  const { t } = useLang();
  const { state, go, removeCustomExam, removeTaskDef, openTaskEdit, openNewTaskEdit } = planner;
  const [openRow, setOpenRow] = useState(null);
  const [adding, setAdding] = useState(false);

  const exams = upcomingExams(state).filter((e) => e.daysUntil >= 0);
  const activities = groupActivities(recurringActivities);
  const tasks = upcomingTasks(state);
  const rowProps = (key, onDelete) => ({
    open: openRow === key,
    onOpenChange: (o) => setOpenRow(o ? key : null),
    onDelete: () => { setOpenRow(null); onDelete(); },
  });
  const daysPill = (n) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 8, color: '#f5a524', background: 'rgba(245,165,36,.15)', flex: 'none' }}>
      {n === 0 ? t('plans.today') : t('plans.inDays', { n })}
    </span>
  );
  const shortDay = (label) => t(DAY_KEY[label] + '.short') || label;

  return (
    <>
      <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 120px', position: 'relative', zIndex: 1 }}>
        <BackButton onClick={() => go('home')} />
        <div style={{ fontSize: 24, fontWeight: 780, letterSpacing: '-.02em', marginTop: 18 }}>{t('plans.title')}</div>
        <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 5 }}>{t('plans.hint')}</div>

        <Section icon="🎓" title={t('plans.exams')}>
          {exams.length === 0 && <Empty text={t('plans.noExams')} />}
          {exams.map((e) => {
            const prog = examPrepProgress(state, e.id);
            const info = dayInfo(e.day);
            return (
              <SwipeRow key={e.id} {...rowProps('exam:' + e.id, () => removeCustomExam(e.id))} border="rgba(245,165,36,.22)">
                <span style={{ fontSize: 20, width: 26, textAlign: 'center', flex: 'none' }}>{iconForSubject(e.subject)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Title>{t(VALUE_KEY[e.title]) || e.title}</Title>
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginTop: 7 }}>
                    <div style={{ width: Math.max(prog.pct, prog.total ? 3 : 0) + '%', height: '100%', borderRadius: 4, background: prog.pct >= 50 ? '#8b6dff' : '#f5a524' }} />
                  </div>
                  <Sub>
                    {(t(DAY_KEY[info.label] + '.short') || info.short) + ', ' + formatMonthDay(e.day)}
                    {' · '}
                    {prog.total ? t('plans.sessionsDone', { done: prog.done, total: prog.total }) : t('plans.noPrep')}
                  </Sub>
                </div>
                {daysPill(e.daysUntil)}
              </SwipeRow>
            );
          })}
        </Section>

        <Section icon="🔁" title={t('plans.activities')}>
          {activities.length === 0 && <Empty text={t('plans.noActivities')} />}
          {activities.map((a) => (
            <SwipeRow
              key={a.key} border="rgba(46,230,197,.25)"
              {...rowProps('act:' + a.key, () => setRecurringActivities((list) => (list || []).filter((x) => !a.ids.includes(x.id))))}
            >
              <span style={{ fontSize: 20, width: 26, textAlign: 'center', flex: 'none' }}>{iconForActivity(a.name)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title>{a.name}</Title>
                <Sub>{a.days.map(shortDay).join(', ')} · {a.start} · {a.dur} min</Sub>
              </div>
            </SwipeRow>
          ))}
        </Section>

        <Section icon="✅" title={t('plans.tasks')}>
          {tasks.length === 0 && <Empty text={t('plans.noTasks')} />}
          {tasks.map((d) => (
            <SwipeRow key={d.id} {...rowProps('task:' + d.id, () => removeTaskDef(d.id))} onClick={() => openTaskEdit(d.id)}>
              <span style={{ fontSize: 20, width: 26, textAlign: 'center', flex: 'none' }}>{iconForTask(d)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</Title>
                <Sub>{taskDayLabel(t, d)}{d.category !== 'personal' && d.subject ? ' · ' + (t(VALUE_KEY[d.subject]) || d.subject) : ''}</Sub>
              </div>
            </SwipeRow>
          ))}
        </Section>

        <TaskEditSheet planner={planner} />
      </div>

      <div
        aria-label={t('plans.add')}
        onClick={() => setAdding(true)}
        style={{
          position: 'absolute', right: 16, bottom: 28, zIndex: 40, width: 54, height: 54, borderRadius: '50%', cursor: 'pointer',
          background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', boxShadow: '0 8px 24px rgba(109,77,255,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
      </div>

      {adding && (
        <BottomSheet>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 750 }}>{t('plans.addTitle')}</div>
            <span onClick={() => setAdding(false)} style={{ fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('notif.close')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, paddingBottom: 6 }}>
            {[
              { icon: '🎓', label: t('plans.addExam'), color: 'rgba(245,165,36,.3)', onClick: () => go('deadline') },
              { icon: '🔁', label: t('plans.addActivity'), color: 'rgba(46,230,197,.3)', onClick: onAddActivity },
              { icon: '✅', label: t('plans.addTask'), color: 'rgba(139,109,255,.35)', onClick: () => openNewTaskEdit(NUM_TODAY) },
            ].map((o) => (
              <div
                key={o.label}
                onClick={() => { setAdding(false); o.onClick(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid ' + o.color, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20 }}>{o.icon}</span>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{o.label}</span>
                <span style={{ fontSize: 15, color: '#6b6b7a' }}>›</span>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
