import { useState } from 'react';
import { SUBJECTS, PRIORITIES, RECUR_DAYS } from '../lib/plannerData';
import { localDateKey } from '../lib/plannerLogic';
import { VALUE_KEY, DAY_KEY, getCurrentLang, localeOf } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { iconForSubject, iconForTask } from '../lib/taskAuto';
import { AppShellPortal, Chip, Toggle } from './ui';
import WheelDatePicker from './WheelDatePicker';
import WheelTimePicker from './WheelTimePicker';
import { SettingRow } from './ListRows';

// What a new task is. Picking one names the task (with the subject, e.g.
// "Biology Project") and sets a sensible length, so most tasks are added in
// a few taps without typing. Stored on the task as `kind` (language-free).
const TASK_KINDS = [
  { kind: 'homework', icon: '📝', dur: 30 },
  { kind: 'project', icon: '📊', dur: 60 },
  { kind: 'presentation', icon: '🎤', dur: 45 },
  { kind: 'essay', icon: '✍️', dur: 45 },
  { kind: 'reading', icon: '📖', dur: 20 },
  { kind: 'revision', icon: '🔁', dur: 30 },
  { kind: 'todo', icon: '✅', personal: true },
  { kind: 'other', icon: '➕', dur: 30 },
];
const TODO_IDEAS = ['gym', 'errands', 'call', 'tidy'];
const SCHOOL_SUBJECTS = SUBJECTS.filter((s) => s !== 'Inny');
const WEEKDAYS_5 = RECUR_DAYS.slice(0, 5);

const label = { fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px', textTransform: 'uppercase' };
const segBtn = (on) => ({
  flex: 1, height: 44, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650,
  background: on ? 'rgba(139,109,255,.2)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (on ? '#8b6dff' : 'rgba(255,255,255,.09)'), color: on ? '#fff' : '#d5d5df',
});
const stepBtn = { width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' };
const errStyle = { fontSize: 11.5, color: '#f5a524', marginTop: 7 };

// The full-page "Add task" screen: opened from the + menu's Task card and
// from every "+ Add task" button (a new task in planner.state.taskEdit).
// Editing an existing task stays in TaskEditSheet.
export default function AddTaskPage({ planner }) {
  const { t } = useLang();
  const { state, patchTaskEdit, stepTaskDur, cancelTaskEdit, saveTaskEdit } = planner;
  const fm = state.taskEdit;
  const errs = state.editErrors || {};
  const [moreOpen, setMoreOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [openRow, setOpenRow] = useState(null);
  if (!fm || fm.id != null) return null;

  const kindDef = TASK_KINDS.find((k) => k.kind === fm.kind);
  const isTodo = fm.category === 'personal';
  const showTime = !isTodo || fm.timed;
  const showMore = moreOpen || !!(errs.start || errs.dur || errs.repeatDays);

  const typeLabel = (kind) => t('addTask.type.' + kind);
  const subjectLabel = (s) => t(VALUE_KEY[s]) || s;
  // The automatic name from the picks; a name the student typed wins.
  function autoName(kind, subject, idea) {
    if (kind === 'todo') return idea ? t('addTask.idea.' + idea) : typeLabel('todo');
    if (kind === 'other') return subject ? subjectLabel(subject) : '';
    return subject ? t('addTask.nameFormat', { subject: subjectLabel(subject), type: typeLabel(kind) }) : typeLabel(kind);
  }
  function pickKind(k) {
    const patch = { kind: k.kind, category: k.personal ? 'personal' : 'school', autoCategory: false };
    if (!k.personal) patch.dur = k.dur;
    if (k.personal) patch.subject = null;
    if (!fm.customName) patch.name = autoName(k.kind, k.personal ? null : fm.subject, null);
    if (k.kind === 'other' && !fm.customName) setRenaming(true);
    patchTaskEdit(patch);
  }
  function pickSubject(s) {
    const subject = fm.subject === s ? null : s;
    patchTaskEdit({ subject, ...(fm.customName || !fm.kind ? {} : { name: autoName(fm.kind, subject, null) }) });
  }
  function pickIdea(idea) {
    patchTaskEdit({ name: t('addTask.idea.' + idea), customName: false });
  }

  const dayText = fm.dayChoice === 'tomorrow' ? t('taskEdit.dayTomorrow')
    : fm.dayChoice === 'pick' && fm.dayDate ? new Intl.DateTimeFormat(localeOf(getCurrentLang()), { day: 'numeric', month: 'short' }).format(new Date(fm.dayDate + 'T12:00:00'))
      : fm.dayChoice === 'repeat' ? t('taskEdit.dayRepeat') : t('taskEdit.dayToday');
  const summary = dayText + (showTime ? ' · ' + fm.dur + ' min' : '');
  const name = fm.name.trim();
  const icon = !fm.kind ? '✨' : isTodo ? iconForTask({ category: 'personal', title: name }) : fm.subject ? iconForSubject(fm.subject) : kindDef.icon;

  return (
    <AppShellPortal>
      <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 86, background: '#08080c', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'quickAddIn .26s ease both' }}>
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -170, left: -130, background: '#7f5cff', filter: 'blur(90px)', opacity: 0.3, pointerEvents: 'none' }} />
        {/* .app-shell > .sc already adds the status-bar room (index.css) */}
        <div style={{ position: 'relative', flex: '1 0 auto', padding: '12px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div onClick={cancelTaskEdit} aria-label={t('taskEdit.cancel')} role="button" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', fontSize: 20, cursor: 'pointer', flex: 'none' }}>‹</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{t('addTask.title')}</div>
          </div>

          {/* What gets added, updated with every tap */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 18, background: 'linear-gradient(160deg,rgba(139,109,255,.22),rgba(139,109,255,.06))', border: '1px solid rgba(139,109,255,.4)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, flex: 'none', background: 'rgba(139,109,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renaming ? (
                <input
                  autoFocus
                  value={fm.name}
                  placeholder={t('addTask.namePlaceholder')}
                  onChange={(e) => patchTaskEdit({ name: e.target.value, customName: true })}
                  onBlur={() => setRenaming(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  style={{ width: '100%', boxSizing: 'border-box', height: 36, padding: '0 10px', borderRadius: 10, background: 'rgba(0,0,0,.25)', border: '1px solid rgba(139,109,255,.5)', color: '#f4f4f7', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }}
                />
              ) : (
                <div style={{ fontSize: 16.5, fontWeight: 800, color: name ? '#f4f4f7' : '#b9b9c6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || t('addTask.pickType')}</div>
              )}
              <div style={{ fontSize: 12, color: '#b9b9c6', marginTop: 3 }}>
                {summary}
                {!renaming && <span role="button" onClick={() => setRenaming(true)} style={{ color: '#c9baff', fontWeight: 650, cursor: 'pointer' }}> · ✏️ {t('addTask.rename')}</span>}
              </div>
            </div>
          </div>
          {errs.name && <div style={errStyle}>{t('addTask.pickType')}</div>}

          <div style={label}>{t('addTask.what')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {TASK_KINDS.map((k) => {
              const on = fm.kind === k.kind;
              return (
                <div
                  key={k.kind}
                  role="button"
                  onClick={() => pickKind(k)}
                  style={{ padding: '12px 3px 10px', borderRadius: 16, cursor: 'pointer', textAlign: 'center', background: on ? 'rgba(139,109,255,.2)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (on ? '#8b6dff' : 'rgba(255,255,255,.09)'), color: on ? '#fff' : '#d5d5df' }}
                >
                  <div style={{ fontSize: 24, lineHeight: 1 }}>{k.icon}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 650, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typeLabel(k.kind)}</div>
                </div>
              );
            })}
          </div>

          {isTodo ? (
            <>
              <div style={label}>{t('addTask.ideas')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TODO_IDEAS.map((idea) => <Chip key={idea} label={t('addTask.idea.' + idea)} active={name === t('addTask.idea.' + idea)} onClick={() => pickIdea(idea)} />)}
              </div>
            </>
          ) : (
            <>
              <div style={label}>{t('addTask.subject')}</div>
              <div className="sc" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px 2px' }}>
                {SCHOOL_SUBJECTS.map((s) => <div key={s} style={{ flex: 'none' }}><Chip label={subjectLabel(s)} active={fm.subject === s} onClick={() => pickSubject(s)} /></div>)}
              </div>
            </>
          )}

          <div style={{ marginTop: 14 }}>
            <SettingRow icon="📅" label={t('addTask.when')} value={dayText} open={openRow === 'when'} onClick={() => setOpenRow(openRow === 'when' ? null : 'when')}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div role="button" style={segBtn(fm.dayChoice === 'today')} onClick={() => patchTaskEdit({ dayChoice: 'today' })}>{t('taskEdit.dayToday')}</div>
                <div role="button" style={segBtn(fm.dayChoice === 'tomorrow')} onClick={() => patchTaskEdit({ dayChoice: 'tomorrow' })}>{t('taskEdit.dayTomorrow')}</div>
                <div role="button" style={segBtn(fm.dayChoice === 'pick')} onClick={() => patchTaskEdit({ dayChoice: 'pick', dayDate: fm.dayDate || localDateKey() })}>📅 {t('addTask.date')}</div>
              </div>
              {fm.dayChoice === 'pick' && (
                <div style={{ marginTop: 10 }}>
                  <WheelDatePicker value={fm.dayDate} minDate={localDateKey()} onChange={(v) => patchTaskEdit({ dayDate: v })} />
                </div>
              )}
            </SettingRow>
            {!isTodo && (
              <SettingRow icon="⏱️" label={t('addTask.howLong')} value={fm.dur + ' min'} open={openRow === 'dur'} onClick={() => setOpenRow(openRow === 'dur' ? null : 'dur')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 6, borderRadius: 15, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
                  <div role="button" onClick={() => stepTaskDur(-5)} style={stepBtn}>−</div>
                  <div style={{ fontSize: 19, fontWeight: 750 }}>{fm.dur} min</div>
                  <div role="button" onClick={() => stepTaskDur(5)} style={stepBtn}>+</div>
                </div>
              </SettingRow>
            )}
            {!isTodo && errs.dur && <div style={errStyle}>{errs.dur}</div>}
            <SettingRow icon="⚙️" label={t('addTask.more')} value="" open={showMore} onClick={() => setMoreOpen(!showMore)} />
          </div>

          {showMore && (
            <div>
              {isTodo && (
                <div role="button" onClick={() => patchTaskEdit({ timed: !fm.timed })} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 14px', borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid ' + (fm.timed ? 'rgba(124,92,255,.45)' : 'rgba(255,255,255,.08)'), cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t('taskEdit.timedToggle')}</div>
                    <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 3, lineHeight: 1.4 }}>{t('taskEdit.timedHint')}</div>
                  </div>
                  <Toggle on={!!fm.timed} />
                </div>
              )}
              {isTodo && fm.timed && (
                <>
                  <div style={label}>{t('addTask.howLong')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 6, borderRadius: 15, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
                    <div role="button" onClick={() => stepTaskDur(-5)} style={stepBtn}>−</div>
                    <div style={{ fontSize: 19, fontWeight: 750 }}>{fm.dur} min</div>
                    <div role="button" onClick={() => stepTaskDur(5)} style={stepBtn}>+</div>
                  </div>
                  {errs.dur && <div style={errStyle}>{errs.dur}</div>}
                </>
              )}
              {showTime && (
                <>
                  <div style={label}>{t('taskEdit.startTime')}</div>
                  <div style={{ width: 150 }}>
                    <WheelTimePicker value={fm.start} onChange={(v) => patchTaskEdit({ start: v })} />
                  </div>
                  {errs.start && <div style={errStyle}>{errs.start}</div>}
                </>
              )}

              <div style={label}>{t('taskEdit.priority')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITIES.map((v) => (
                  <div key={v} role="button" onClick={() => patchTaskEdit({ priority: v })} style={segBtn(fm.priority === v)}>
                    {(t(VALUE_KEY[v]) || v).replace(/ (priorytet|priority)$/, '')}
                  </div>
                ))}
              </div>

              <div role="button" onClick={() => patchTaskEdit(fm.dayChoice === 'repeat' ? { dayChoice: 'today' } : { dayChoice: 'repeat', repeatDays: fm.repeatDays.length ? fm.repeatDays : WEEKDAYS_5.slice() })} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '12px 14px', borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid ' + (fm.dayChoice === 'repeat' ? 'rgba(124,92,255,.45)' : 'rgba(255,255,255,.08)'), cursor: 'pointer' }}>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{t('taskEdit.dayRepeat')}</div>
                <Toggle on={fm.dayChoice === 'repeat'} />
              </div>
              {fm.dayChoice === 'repeat' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Chip label={t('taskEdit.repeatEveryDay')} active={fm.repeatDays.length === RECUR_DAYS.length} onClick={() => patchTaskEdit({ repeatDays: RECUR_DAYS.slice() })} />
                    <Chip label={t('taskEdit.repeatWeekdays')} active={fm.repeatDays.length === WEEKDAYS_5.length && WEEKDAYS_5.every((d) => fm.repeatDays.includes(d))} onClick={() => patchTaskEdit({ repeatDays: WEEKDAYS_5.slice() })} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {RECUR_DAYS.map((day) => (
                      <Chip key={day} label={(t(DAY_KEY[day]) || day).slice(0, 3)} active={fm.repeatDays.includes(day)} onClick={() => patchTaskEdit({ repeatDays: fm.repeatDays.includes(day) ? fm.repeatDays.filter((x) => x !== day) : fm.repeatDays.concat(day) })} />
                    ))}
                  </div>
                  {errs.repeatDays && <div style={errStyle}>{errs.repeatDays}</div>}
                </div>
              )}

              <div style={label}>{t('taskEdit.noteLabel')}</div>
              <textarea
                value={fm.note}
                onChange={(e) => patchTaskEdit({ note: e.target.value })}
                placeholder={t('taskEdit.notePlaceholder')}
                style={{ width: '100%', boxSizing: 'border-box', height: 74, padding: '13px 15px', borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f4f7', fontSize: 16, lineHeight: 1.45, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
              />
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, padding: '14px 20px calc(var(--safe-bottom) + 14px)', background: 'linear-gradient(transparent,#08080c 30%)' }}>
          <div
            role="button"
            onClick={saveTaskEdit}
            style={{ height: 56, borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 26px rgba(109,77,255,.45)' }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, maxWidth: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name ? t('addTask.addNamed', { name }) : t('addTask.add')}</span>
            {name && <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.85, marginTop: 1 }}>{summary}</span>}
          </div>
        </div>
      </div>
    </AppShellPortal>
  );
}
