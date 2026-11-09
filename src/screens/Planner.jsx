import { useState } from 'react';
import { durOf, hm, weekdayDateLabel, fmt, freeWindows, taskDueOnDay, isTaskOn, plannedElsewhere } from '../lib/plannerLogic';
import { iconForTask, iconForActivity } from '../lib/taskAuto';
import { BackButton, StickyFooter, PrimaryButton, Chip, EnergyPicker } from '../components/ui';
import WheelTimePicker from '../components/WheelTimePicker';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import { Eyebrow, Check, SettingRow, ROW_LINE } from '../components/ListRows';

const PREFS = ['Wolny wieczór', 'Najpierw najtrudniejsze', 'Więcej krótkich przerw'];

export default function Planner({ planner }) {
  const { t } = useLang();
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const { state, constraints, planDayNum, toggleTask, openTaskEdit, openNewTaskEdit, update, generatePlan, go } = planner;
  // Only school tasks due this day occupy a time slot (see the category
  // toggle in TaskEditSheet) — a task with no day set still applies to
  // either day, matching how tasks behaved before that field existed, and a
  // repeating task (see taskDueOnDay) applies whenever this day falls on one
  // of its chosen weekdays.
  // A one-off task already in the other day's approved plan belongs there.
  const schedulableTasks = state.taskDefs.filter((d) => d.category !== 'personal' && taskDueOnDay(d, planDayNum) && !plannedElsewhere(state, d, planDayNum));
  const personalTasks = state.taskDefs.filter((d) => d.category === 'personal' && taskDueOnDay(d, planDayNum));
  const enabledTasks = schedulableTasks.filter((d) => isTaskOn(state.tasks, d, planDayNum));
  const mins = enabledTasks.reduce((a, d) => a + durOf(d.id, state.taskDefs, state.durOverride), 0);
  const windows = freeWindows(constraints);
  const freeMinutes = windows.reduce((a, w) => a + (w.end - w.start), 0);
  const dayWord = t(state.planToday ? 'planner.dayToday' : 'planner.dayTomorrow');
  // Weekly activities (school, gym…) are edited on the Plans screen; its
  // back button brings the student back here.
  const openWeekly = () => update({ screen: 'plans', plansBack: 'planner' });

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 150px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => go('home')} />

      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('planner.title', { day: dayWord })}</div>
      <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 5 }}>{t('planner.date', { date: weekdayDateLabel(planDayNum) })}</div>

      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
        <Chip label={t('planner.pickToday')} active={!!state.planToday} onClick={() => update({ planToday: true })} />
        <Chip label={t('planner.pickTomorrow')} active={!state.planToday} onClick={() => update({ planToday: false })} />
      </div>

      <Eyebrow text={t('planner.tasks')} />
      {schedulableTasks.map((d) => {
        const on = isTaskOn(state.tasks, d, planDayNum);
        return (
          <div key={d.id} onClick={() => toggleTask(d.id, planDayNum)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: ROW_LINE, cursor: 'pointer' }}>
            <Check on={on} />
            <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none' }}>{iconForTask(d)}</span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: on ? '#f4f4f7' : '#8a8a99' }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
            <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ fontSize: 13, color: '#8a8a99', padding: '4px 0 4px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {hm(durOf(d.id, state.taskDefs, state.durOverride))} <span style={{ color: '#5f5f70' }}>›</span>
            </span>
          </div>
        );
      })}
      <div role="button" onClick={() => openNewTaskEdit(planDayNum)} style={{ padding: '13px 0', fontSize: 14, fontWeight: 700, color: '#a58cff', cursor: 'pointer' }}>{t('planner.addTask')}</div>

      {personalTasks.length > 0 && (
        <>
          <Eyebrow text={t('tl.todo')} />
          {personalTasks.map((d) => {
            const done = isTaskOn(state.tasks, d, planDayNum);
            return (
              <div key={d.id} onClick={() => toggleTask(d.id, planDayNum)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: ROW_LINE, cursor: 'pointer' }}>
                <Check on={done} color="#35d07f" />
                <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none' }}>{iconForTask(d)}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 650, textDecoration: done ? 'line-through' : 'none', color: done ? '#8a8a99' : '#f4f4f7' }}>{d.title}</div>
                <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ color: '#5f5f70', fontSize: 15, padding: '4px 0 4px 8px', cursor: 'pointer' }}>›</span>
              </div>
            );
          })}
        </>
      )}

      <Eyebrow text={t('planner.yourDay')} />
      <SettingRow icon="🕐" label={t('tl.freeTime')} value={fmt(constraints.wakeMinutes) + '–' + fmt(constraints.bedtimeMinutes)} open={open === 'time'} onClick={() => toggle('time')}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 7, textAlign: 'center' }}>{t('planner.from')}</div>
            <WheelTimePicker value={fmt(constraints.wakeMinutes)} onChange={(v) => update({ wakeOverride: v })} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 7, textAlign: 'center' }}>{t('planner.to')}</div>
            <WheelTimePicker value={fmt(constraints.bedtimeMinutes)} onChange={(v) => update({ bedtimeOverride: v })} />
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 650, color: freeMinutes ? '#7fe3ad' : '#f7c46c', marginTop: 10 }}>{freeMinutes ? t('planner.freeHours', { time: hm(freeMinutes) }) : t('planner.noFreeTime')}</div>
      </SettingRow>
      {constraints.blocks.map((b) => (
        <SettingRow
          key={b.label + b.start}
          icon={b.kind === 'todo' ? iconForTask({ category: 'personal', title: b.label }) : iconForActivity(b.label) || '📌'}
          label={b.label}
          value={fmt(b.start) + '–' + fmt(b.end)}
          onClick={() => (b.kind === 'todo' && b.taskId ? openTaskEdit(b.taskId) : openWeekly())}
        />
      ))}
      <SettingRow icon="⚡" label={t('planner.energy')} value={t(VALUE_KEY[state.energy]) || state.energy} open={open === 'energy'} onClick={() => toggle('energy')}>
        <EnergyPicker value={state.energy} onChange={(v) => update({ energy: v })} />
      </SettingRow>
      <SettingRow icon="⚙️" label={t('addTask.more')} value="" open={open === 'more'} onClick={() => toggle('more')}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>{t('planner.prefQ')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {PREFS.map((p) => (
            <Chip key={p} label={t(VALUE_KEY[p]) || p} active={state.pref === p} onClick={() => update({ pref: p })} />
          ))}
        </div>
        <textarea
          value={state.planNote || ''}
          onChange={(e) => update({ planNote: e.target.value })}
          placeholder={t('planner.notePlaceholder')}
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 84, marginTop: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: 13, fontSize: 13.5, lineHeight: 1.5, color: '#f4f4f7', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </SettingRow>

      <StickyFooter>
        <PrimaryButton onClick={generatePlan}>{mins > 0 ? t('planner.buildPlanTime', { time: hm(mins) }) : t('planner.buildPlan')}</PrimaryButton>
      </StickyFooter>

      <TaskEditSheet planner={planner} />
    </div>
    </>
  );
}
