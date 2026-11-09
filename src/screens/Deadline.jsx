import { useState } from 'react';
import { KINDS, SUBJECTS, GOALS, LEVELS, NUM_TODAY } from '../lib/plannerData';
import { formatMonthDay, daysUntilFromISODate, localDateKey } from '../lib/plannerLogic';
import { VALUE_KEY } from '../lib/i18n';
import { BackButton, StickyFooter, Chip, ConfirmCard, Toggle } from '../components/ui';
import { Eyebrow, SettingRow, ROW_LINE } from '../components/ListRows';
import WheelDatePicker from '../components/WheelDatePicker';
import WheelTimePicker from '../components/WheelTimePicker';
import { useLang } from '../lib/useLang';

const DIFFICULTIES = ['Łatwy', 'Średni', 'Trudny'];

function diffLabel(t, d) {
  return d === 'Łatwy' ? t('dl.diffEasy') : d === 'Trudny' ? t('dl.diffHard') : t('dl.diffMedium');
}

function daysLabel(t, daysUntil) {
  if (daysUntil === 0) return t('dl.dueToday');
  if (daysUntil === 1) return t('cal.tomorrowPill');
  return t('cal.inDaysPill', { n: daysUntil });
}


// Section labels come from the old form's uppercase field labels (dl.date
// "DATE"); rows want them in normal case.
const sentence = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);

export default function Deadline({ planner }) {
  const { t } = useLang();
  const { state, setField, addTopic, setTopic, removeTopic, deadlineSubmit, goHomeDeadline } = planner;
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const nameEmpty = !state.nameValue.trim();
  const topicsMissing = state.autoPlan && (state.topics.length === 0 || state.topics.some((tp) => !tp.trim()));
  const daysUntil = daysUntilFromISODate(state.examDate);
  const dateValid = daysUntil != null && daysUntil >= 0;
  const valid = !!state.kind && !!state.subject && !nameEmpty && dateValid && !topicsMissing;
  const dateValue = state.examDate ? formatMonthDay(NUM_TODAY + daysUntil) + ' · ' + (dateValid ? daysLabel(t, daysUntil) : t('dl.datePassed')) : '—';

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 210px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => planner.go('home')} />
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('dl.title')}</div>

      <Eyebrow text={t('dl.kindLabel')} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
        {KINDS.map((k) => <Chip key={k} label={t(VALUE_KEY[k]) || k} active={state.kind === k} onClick={() => setField('kind', k)} />)}
      </div>

      <Eyebrow text={t('dl.subjectLabel')} />
      <div className="sc" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '11px -20px 0', padding: '0 20px 2px' }}>
        {SUBJECTS.map((sub) => <div key={sub} style={{ flex: 'none' }}><Chip label={t(VALUE_KEY[sub]) || sub} active={state.subject === sub} onClick={() => planner.update({ subject: sub })} /></div>)}
      </div>

      <Eyebrow text={t('dl.nameLabel')} />
      <input
        value={state.nameValue}
        onChange={(e) => setField('nameValue', e.target.value)}
        placeholder={t('dl.namePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', height: 50, marginTop: 10, borderRadius: 14, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', padding: '0 14px', fontSize: 16, fontWeight: 650, color: '#f4f4f7', fontFamily: 'inherit', outline: 'none' }}
      />

      <Eyebrow text={t('addTask.when')} />
      <SettingRow icon="📅" label={sentence(t('dl.date'))} value={dateValue} color={state.examDate && !dateValid ? '#f7c46c' : '#c9baff'} open={open === 'date'} onClick={() => toggle('date')}>
        <WheelDatePicker value={state.examDate} minDate={localDateKey()} onChange={(v) => setField('examDate', v)} />
        {state.examDate && !dateValid && <div style={{ fontSize: 12.5, color: '#f5a524', marginTop: 8 }}>{t('dl.pickFuture')}</div>}
      </SettingRow>
      <SettingRow icon="🕘" label={sentence(t('dl.time'))} value={state.examTime || '09:00'} open={open === 'time'} onClick={() => toggle('time')}>
        <div style={{ width: 160 }}><WheelTimePicker value={state.examTime || '09:00'} onChange={(v) => setField('examTime', v)} /></div>
      </SettingRow>

      <div role="button" onClick={() => setField('autoPlan', !state.autoPlan)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 13px', marginTop: 10, borderBottom: ROW_LINE, cursor: 'pointer' }}>
        <span style={{ fontSize: 16, width: 22, textAlign: 'center', flex: 'none' }}>✨</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700 }}>{t('dl.autoPlanTitle')}</div>
        <Toggle on={state.autoPlan} />
      </div>

      {state.autoPlan && (
        <>
          <Eyebrow text={t('dl.topicsLabel')} />
          {state.topics.map((topic, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: ROW_LINE }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7a7a8a', width: 22, textAlign: 'center', flex: 'none' }}>{i + 1}</span>
              <input
                value={topic} onChange={(e) => setTopic(i, e.target.value)} placeholder={t('dl.topicPlaceholder')}
                style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 650, background: 'none', border: 'none', color: '#f4f4f7', fontFamily: 'inherit', padding: '4px 0', outline: 'none' }}
              />
              <span role="button" aria-label={t('dl.remove')} onClick={() => removeTopic(i)} style={{ fontSize: 13, color: '#8a8a99', cursor: 'pointer', padding: '4px 6px' }}>✕</span>
            </div>
          ))}
          <div role="button" onClick={addTopic} style={{ padding: '12px 0', fontSize: 14, fontWeight: 700, color: '#a58cff', cursor: 'pointer' }}>{t('dl.addTopic')}</div>
          {state.topicErr && topicsMissing && <div style={{ fontSize: 12.5, color: '#f5a524' }}>{t('dl.topicRequired')}</div>}

          <SettingRow icon="🧩" label={t('dl.difficulty')} value={diffLabel(t, state.difficulty)} open={open === 'diff'} onClick={() => toggle('diff')}>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map((d) => <Chip key={d} label={diffLabel(t, d)} active={state.difficulty === d} onClick={() => setField('difficulty', d)} />)}
            </div>
          </SettingRow>
          <SettingRow icon="🧠" label={t('dl.knowledge')} value={state.level + '/5'} open={open === 'level'} onClick={() => toggle('level')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LEVELS.map((l, i) => <Chip key={l} label={(i + 1) + '. ' + (t(VALUE_KEY[l]) || l)} active={state.level === i + 1} onClick={() => setField('level', i + 1)} />)}
            </div>
          </SettingRow>
          <SettingRow icon="🎯" label={t('dl.goal')} value={t(VALUE_KEY[state.goal]) || state.goal} open={open === 'goal'} onClick={() => toggle('goal')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOALS.map((g) => <Chip key={g} label={t(VALUE_KEY[g]) || g} active={state.goal === g} onClick={() => setField('goal', g)} />)}
            </div>
          </SettingRow>
        </>
      )}

      <StickyFooter>
        <div
          onClick={() => deadlineSubmit(valid)}
          style={{ height: 56, borderRadius: 17, background: valid ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16.5, fontWeight: 700, color: valid ? '#fff' : '#6b6b7a', cursor: valid ? 'pointer' : 'not-allowed', boxShadow: valid ? '0 12px 30px rgba(109,77,255,.35)' : 'none' }}
        >
          {state.autoPlan ? t('dl.saveAndCreate') : t('dl.saveDeadline')}
        </div>
        {nameEmpty && <div style={{ textAlign: 'center', fontSize: 12.5, color: '#f7c46c', marginTop: 10 }}>{t('dl.nameRequired')}</div>}
      </StickyFooter>

      {state.deadlineOnlySaved && (
        <ConfirmCard title={t('dl.savedTitle')} sub={t('dl.savedSub')} onDone={goHomeDeadline} buttonLabel={t('sum.backToStart')} />
      )}
    </div>
    </>
  );
}
