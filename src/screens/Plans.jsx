import { useRef, useState } from 'react';
import { NUM_TODAY, RECUR_DAYS } from '../lib/plannerData';
import { upcomingExams, examPrepProgress, formatMonthDay, dayInfo } from '../lib/plannerLogic';
import { iconForTask, iconForSubject, iconForActivity } from '../lib/taskAuto';
import { groupActivities, saveActivityLine, removeActivities, upcomingTasks, groupPlanTasks, examStudySessions } from '../lib/plansView';
import { DAY_KEY, VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import ActivityForm from '../components/ActivityForm';
import { ExamIcon, WeeklyIcon, TaskIcon } from '../components/planIcons';
import { AppShellPortal, BackButton, BottomSheet } from '../components/ui';

const DELETE_W = 84;
const KIND = {
  exam: { color: '#f5a524', rgb: '245,165,36', Icon: ExamIcon },
  act: { color: '#2ee6c5', rgb: '46,230,197', Icon: WeeklyIcon },
  task: { color: '#a58cff', rgb: '139,109,255', Icon: TaskIcon },
};

// A row that slides left to reveal Delete. Its ⋯ opens a small menu (Edit /
// Delete, or one Edit per time line for an activity) instead, which also
// works with a mouse. The parent keeps only one row slid open at a time.
function SwipeRow({ open, onOpenChange, onDelete, onClick, menu, radius = 0, bg, style, children }) {
  const { t } = useLang();
  const [drag, setDrag] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div style={{ position: 'relative', zIndex: menuOpen ? 30 : 'auto', ...style }}>
      <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden', background: x < 0 ? '#e5484d' : 'transparent' }}>
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
            position: 'relative', background: bg, borderRadius: radius, transform: `translateX(${x}px)`,
            transition: drag == null ? 'transform .2s ease' : 'none', touchAction: 'pan-y', cursor: onClick ? 'pointer' : 'default',
          }}
        >
          {children(
            <span
              aria-label={t('plans.more')}
              onClick={(e) => { e.stopPropagation(); onOpenChange(false); setMenuOpen((o) => !o); }}
              style={{ width: 30, height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, letterSpacing: 1, color: '#6b6b7a', cursor: 'pointer' }}
            >
              ⋯
            </span>,
          )}
        </div>
      </div>
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
          <div style={{ position: 'absolute', right: 8, top: 46, zIndex: 2, minWidth: 170, borderRadius: 14, background: '#1c1830', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 10px 30px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            {menu.map((m, i) => (
              <div
                key={m.label}
                onClick={() => { setMenuOpen(false); m.onClick(); }}
                style={{ padding: '13px 15px', fontSize: 13.5, fontWeight: 650, cursor: 'pointer', color: m.danger ? '#ff8a8e' : '#f4f4f7', borderTop: i ? '1px solid rgba(255,255,255,.07)' : 'none' }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// A section: one panel with a soft glow in its colour, an icon tile, the
// title and how many items it holds.
function Panel({ kind, title, count, padded = true, children }) {
  const { color, rgb, Icon } = KIND[kind];
  return (
    <div style={{ position: 'relative', marginTop: 20, borderRadius: 22, background: '#111017', border: `1px solid rgba(${rgb},.2)` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 22, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 200, height: 120, top: -60, left: -40, background: color, filter: 'blur(60px)', opacity: 0.14 }} />
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 12px' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${rgb},.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></div>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 750 }}>{title}</div>
        {count > 0 && (
          <div style={{ minWidth: 24, height: 24, padding: '0 8px', borderRadius: 999, background: `rgba(${rgb},.14)`, color, fontSize: 12, fontWeight: 750, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</div>
        )}
      </div>
      <div style={{ position: 'relative', padding: padded ? '0 14px 14px' : 0 }}>{children}</div>
    </div>
  );
}

function Empty({ kind, text, button, onClick }) {
  const { color, rgb } = KIND[kind];
  return (
    <div style={{ padding: '0 2px 2px' }}>
      <div style={{ fontSize: 13.5, color: '#9a9aab', lineHeight: 1.4 }}>{text}</div>
      <div onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', marginTop: 11, height: 34, padding: '0 14px', borderRadius: 999, background: `rgba(${rgb},.14)`, fontSize: 13, fontWeight: 700, color, cursor: 'pointer' }}>+ {button}</div>
    </div>
  );
}

function useDayNames() {
  const { t } = useLang();
  const short = (day) => {
    const s = t(DAY_KEY[day] + '.short') || day;
    return s.charAt(0) + s.slice(1).toLowerCase();
  };
  const letter = (day) => (t(DAY_KEY[day]) || day).charAt(0);
  const date = (num) => short(dayInfo(num).label) + ', ' + formatMonthDay(num, { short: true });
  return { short, letter, date };
}

function ProgressRing({ done, total }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={{ flex: 'none' }}>
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="6" />
      {total > 0 && <circle cx="26" cy="26" r={r} fill="none" stroke="#f5a524" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 26 26)" />}
      <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{total ? done + '/' + total : '–'}</text>
    </svg>
  );
}

function daysLeftText(t, n) {
  return n === 0 ? t('plans.examToday') : n === 1 ? t('plans.oneDay') : t('plans.nDays', { n });
}

function ExamCard({ e, state, wide, onClick }) {
  const { t } = useLang();
  const days = useDayNames();
  const prog = examPrepProgress(state, e.id);
  return (
    <div
      onClick={onClick}
      style={{
        flex: 'none', width: wide ? '100%' : 232, scrollSnapAlign: 'start', borderRadius: 20, padding: 15, cursor: 'pointer',
        background: 'linear-gradient(150deg,rgba(245,165,36,.28),rgba(245,165,36,.06) 55%,rgba(255,255,255,.02))', border: '1px solid rgba(245,165,36,.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{iconForSubject(e.subject)}</span>
        <div style={{ textAlign: 'right' }}>
          {e.daysUntil === 0
            ? <div style={{ fontSize: 20, fontWeight: 800, color: '#ffc35a' }}>{t('plans.examToday')}</div>
            : <>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: '#ffc35a' }}>{e.daysUntil}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e0b46a' }}>{t(e.daysUntil === 1 ? 'plans.dayLeft' : 'plans.daysLeft')}</div>
            </>}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 750, marginTop: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(VALUE_KEY[e.title]) || e.title}</div>
      <div style={{ fontSize: 12.5, color: '#c4b49a', marginTop: 2 }}>{(t(VALUE_KEY[e.subject]) || e.subject || '') + (e.subject ? ' · ' : '') + days.date(e.day)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <ProgressRing done={prog.done} total={prog.total} />
        <div style={{ fontSize: 12.5, color: '#d9cdb8', lineHeight: 1.35, whiteSpace: 'pre-line' }}>{prog.total ? t('plans.sessionsDoneLabel') : t('plans.noStudyPlan')}</div>
      </div>
    </div>
  );
}

function ExamSheet({ e, state, onClose, onDelete }) {
  const { t } = useLang();
  const days = useDayNames();
  const [confirm, setConfirm] = useState(false);
  const sessions = examStudySessions(state, e.id);
  const grade = (state.examGoals || {})[e.id]?.grade;
  const stats = [
    [t('plans.examDate'), days.date(e.day)],
    [t('plans.examCountdown'), daysLeftText(t, e.daysUntil)],
    grade && grade !== 'Bez konkretnego celu' ? [t('plans.examGoal'), t(VALUE_KEY[grade]) || grade] : null,
  ].filter(Boolean);
  return (
    <BottomSheet>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 15, flex: 'none', background: 'rgba(245,165,36,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{iconForSubject(e.subject)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 780, letterSpacing: '-.01em' }}>{t(VALUE_KEY[e.title]) || e.title}</div>
          {e.subject && <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 2 }}>{t(VALUE_KEY[e.subject]) || e.subject}</div>}
        </div>
        <span onClick={onClose} style={{ fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer', alignSelf: 'flex-start' }}>{t('notif.close')}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {stats.map(([k, v]) => (
          <div key={k} style={{ flex: 1, minWidth: 0, padding: '10px 11px', borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.2)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.08em', color: '#c9a35e' }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '20px 0 4px' }}>{t('plans.studySessions').toUpperCase()}</div>
      {sessions.length === 0 && <div style={{ fontSize: 13.5, color: '#9a9aab', marginTop: 6, lineHeight: 1.4 }}>{t('plans.noSessions')}</div>}
      {sessions.map((s) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.done ? '#35d07f' : 'transparent', border: s.done ? 'none' : '2px solid rgba(255,255,255,.2)' }}>
            {s.done && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5l3 3 6-6" stroke="#06210f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 650, color: s.done ? '#8a8a99' : '#f4f4f7', textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</div>
            <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 2 }}>{[s.day != null ? days.date(s.day) : null, s.time || (s.dur ? s.dur + ' min' : null)].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      ))}

      <div
        onClick={() => (confirm ? onDelete() : setConfirm(true))}
        style={{ marginTop: 18, height: 48, borderRadius: 15, border: '1px solid rgba(229,72,77,.45)', background: confirm ? 'rgba(229,72,77,.16)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#ff8a8e', cursor: 'pointer' }}
      >
        {confirm ? t('plans.confirmDelete') : t('plans.deleteExam')}
      </div>
    </BottomSheet>
  );
}

function ActivityEditor({ group, line, onSave, onDelete, onClose }) {
  const { t } = useLang();
  return (
    <AppShellPortal>
      <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 85, background: '#08080c', overflowY: 'auto', animation: 'quickAddIn .26s ease both' }}>
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -170, left: -130, background: '#2ee6c5', filter: 'blur(110px)', opacity: 0.16, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '24px 22px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', cursor: 'pointer' }}>✕</div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(46,230,197,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, fontSize: 30 }}>
            {iconForActivity(group.name) || <WeeklyIcon size={32} />}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('plans.editActivity')}</div>
          <ActivityForm
            initial={{ name: group.name, days: line.days, start: line.start, end: line.end }}
            submitLabel={t('plans.save')}
            onSubmit={onSave}
            onDelete={onDelete}
          />
        </div>
      </div>
    </AppShellPortal>
  );
}

export default function Plans({ planner, recurringActivities, setRecurringActivities, onAddActivity }) {
  const { t } = useLang();
  const days = useDayNames();
  const { state, go, removeCustomExam, removeTaskDef, openTaskEdit, openNewTaskEdit } = planner;
  const [openRow, setOpenRow] = useState(null);
  const [adding, setAdding] = useState(false);
  const [examOpen, setExamOpen] = useState(null);
  const [editing, setEditing] = useState(null);

  const exams = upcomingExams(state).filter((e) => e.daysUntil >= 0);
  const activities = groupActivities(recurringActivities);
  const tasks = upcomingTasks(state);
  const taskGroups = groupPlanTasks(tasks);
  const rowProps = (key, onDelete) => ({
    open: openRow === key,
    onOpenChange: (o) => setOpenRow(o ? key : null),
    onDelete: () => { setOpenRow(null); onDelete(); },
  });
  const removeIds = (ids) => setRecurringActivities((list) => removeActivities(list, ids));
  const shownExam = examOpen && exams.find((e) => e.id === examOpen);

  const taskSub = (d, group) => {
    const parts = [];
    if (group === 'repeating') parts.push(t('plans.every', { days: RECUR_DAYS.filter((x) => d.repeatDays.includes(x)).map(days.short).join(', ') }));
    if (group === 'later') parts.push(days.date(d.day));
    if (d.category === 'personal') parts.push(t('plans.todo'));
    else {
      if (d.subject) parts.push(t(VALUE_KEY[d.subject]) || d.subject);
      if (d.dur) parts.push(d.dur + ' min');
    }
    return parts.join(' · ');
  };
  const groupLabel = { today: 'plans.groupToday', tomorrow: 'plans.groupTomorrow', later: 'plans.groupLater', repeating: 'plans.groupRepeating' };

  return (
    <>
      <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 120px', position: 'relative', zIndex: 1 }}>
        <BackButton onClick={() => go('home')} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em' }}>{t('plans.title')}</div>
          <div
            onClick={() => setAdding(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 15px 0 12px', borderRadius: 999, cursor: 'pointer', background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', boxShadow: '0 8px 22px rgba(109,77,255,.4)', fontSize: 14, fontWeight: 750 }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg>
            {t('plans.add')}
          </div>
        </div>

        <Panel kind="exam" title={t('plans.exams')} count={exams.length}>
          {exams.length === 0
            ? <Empty kind="exam" text={t('plans.emptyExams')} button={t('plans.addExamBtn')} onClick={() => go('deadline')} />
            : (
              <div className="sc" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -14px', padding: '0 14px', scrollPaddingLeft: 14 }}>
                {exams.map((e) => <ExamCard key={e.id} e={e} state={state} wide={exams.length === 1} onClick={() => setExamOpen(e.id)} />)}
              </div>
            )}
        </Panel>

        <Panel kind="act" title={t('plans.activities')} count={activities.length}>
          {activities.length === 0 && <Empty kind="act" text={t('plans.emptyActivities')} button={t('plans.addActivityBtn')} onClick={onAddActivity} />}
          {activities.map((a, ai) => {
            const icon = iconForActivity(a.name);
            const edit = (line) => setEditing({ group: a, line });
            const menu = a.lines.map((l) => ({ label: a.lines.length === 1 ? t('plans.edit') : t('plans.editDays', { days: l.days.map(days.short).join(', ') }), onClick: () => edit(l) }))
              .concat({ label: t('plans.delete'), danger: true, onClick: () => removeIds(a.ids) });
            return (
              <SwipeRow key={a.key} {...rowProps('act:' + a.key, () => removeIds(a.ids))} menu={menu} radius={18} bg="#18161f" style={{ marginTop: ai ? 10 : 0 }}>
                {(dots) => (
                  <div style={{ padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 26, display: 'flex', justifyContent: 'center', fontSize: 22, lineHeight: 1 }}>{icon || <WeeklyIcon size={22} />}</span>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                      {dots}
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
                      {RECUR_DAYS.map((d) => {
                        const li = a.lines.findIndex((l) => l.days.includes(d));
                        const on = li >= 0;
                        return (
                          <div key={d} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 750, background: on ? (li === 0 ? '#2ee6c5' : 'rgba(46,230,197,.45)') : 'rgba(255,255,255,.05)', color: on ? '#062720' : '#55556a' }}>
                            {days.letter(d)}
                          </div>
                        );
                      })}
                    </div>
                    {a.lines.map((l, li) => (
                      <div key={l.key} onClick={() => edit(l)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, fontSize: 12.5, cursor: 'pointer' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: li === 0 ? '#2ee6c5' : 'rgba(46,230,197,.45)' }} />
                        <span style={{ color: '#a3a3b3', flex: 1 }}>{l.days.map(days.short).join(', ')}</span>
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{l.start}–{l.end}</span>
                        <span style={{ color: '#55556a' }}>›</span>
                      </div>
                    ))}
                  </div>
                )}
              </SwipeRow>
            );
          })}
        </Panel>

        <Panel kind="task" title={t('plans.tasks')} count={tasks.length} padded={taskGroups.length === 0}>
          {taskGroups.length === 0 && <Empty kind="task" text={t('plans.emptyTasks')} button={t('plans.addTaskBtn')} onClick={() => openNewTaskEdit(NUM_TODAY)} />}
          {taskGroups.map((g, gi) => (
            <div key={g.key}>
              <div style={{ padding: '10px 16px 2px', fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#6b6b7a', borderTop: '1px solid rgba(255,255,255,.06)' }}>{t(groupLabel[g.key]).toUpperCase()}</div>
              {g.items.map((d, i) => (
                <SwipeRow
                  key={d.id} {...rowProps('task:' + d.id, () => removeTaskDef(d.id))} onClick={() => openTaskEdit(d.id)} bg="#111017"
                  radius={gi === taskGroups.length - 1 && i === g.items.length - 1 ? '0 0 22px 22px' : 0}
                  menu={[{ label: t('plans.edit'), onClick: () => openTaskEdit(d.id) }, { label: t('plans.delete'), danger: true, onClick: () => removeTaskDef(d.id) }]}
                >
                  {(dots) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px 11px 16px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, flex: 'none', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{iconForTask(d)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.3 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
                        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 2 }}>{taskSub(d, g.key)}</div>
                      </div>
                      {dots}
                    </div>
                  )}
                </SwipeRow>
              ))}
            </div>
          ))}
        </Panel>

        <TaskEditSheet planner={planner} />
      </div>

      {shownExam && (
        <ExamSheet e={shownExam} state={state} onClose={() => setExamOpen(null)} onDelete={() => { setExamOpen(null); removeCustomExam(shownExam.id); }} />
      )}

      {editing && (
        <ActivityEditor
          group={editing.group}
          line={editing.line}
          onClose={() => setEditing(null)}
          onSave={(fields) => { setRecurringActivities((list) => saveActivityLine(list, { ...fields, replaceIds: editing.line.ids })); setEditing(null); }}
          onDelete={() => { removeIds(editing.line.ids); setEditing(null); }}
        />
      )}

      {adding && (
        <BottomSheet>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 750 }}>{t('plans.addTitle')}</div>
            <span onClick={() => setAdding(false)} style={{ fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('notif.close')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, paddingBottom: 6 }}>
            {[
              { kind: 'exam', label: t('plans.addExam'), onClick: () => go('deadline') },
              { kind: 'act', label: t('plans.addActivity'), onClick: onAddActivity },
              { kind: 'task', label: t('plans.addTask'), onClick: () => openNewTaskEdit(NUM_TODAY) },
            ].map((o) => {
              const { rgb, Icon } = KIND[o.kind];
              return (
                <div
                  key={o.label}
                  onClick={() => { setAdding(false); o.onClick(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 16, background: `rgba(${rgb},.06)`, border: `1px solid rgba(${rgb},.3)`, cursor: 'pointer' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: `rgba(${rgb},.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={19} /></div>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{o.label}</span>
                  <span style={{ fontSize: 15, color: '#6b6b7a' }}>›</span>
                </div>
              );
            })}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
