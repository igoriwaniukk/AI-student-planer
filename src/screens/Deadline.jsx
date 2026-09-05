import { KINDS, SUBJECTS, GOALS, LEVELS } from '../lib/plannerData';
import { BackButton, StickyFooter, Chip, ListRow, ConfirmCard, LabelRequired } from '../components/ui';
import { useLang } from '../lib/useLang';

const DIFFICULTIES = ['Łatwy', 'Średni', 'Trudny'];

function diffLabel(t, d) {
  return d === 'Łatwy' ? t('dl.diffEasy') : d === 'Trudny' ? t('dl.diffHard') : t('dl.diffMedium');
}

export default function Deadline({ planner }) {
  const { t } = useLang();
  const { state, setField, addTopic, removeTopic, deadlineSubmit, goHomeDeadline } = planner;
  const nameEmpty = !state.nameValue.trim();
  const topicsMissing = state.autoPlan && state.topics.length === 0;
  const valid = !!state.kind && !!state.subject && !nameEmpty && state.dateValid && !topicsMissing;
  const difficultyLabel = diffLabel(t, state.difficulty);

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <BackButton onClick={() => planner.go('home')} />
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('dl.title')}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#8a8a99', marginTop: 8 }}>{t('dl.subtitle')}</div>

      <LabelRequired label={t('dl.kindLabel')} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {KINDS.map((k) => <Chip key={k} label={k} active={state.kind === k} onClick={() => setField('kind', k)} />)}
      </div>

      <LabelRequired label={t('dl.subjectLabel')} />
      <div onClick={() => setField('subjectsOpen', !state.subjectsOpen)} style={{ height: 54, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', cursor: 'pointer' }}>
        <span style={{ fontSize: 15, fontWeight: 650 }}>{state.subject}</span>
        <span style={{ fontSize: 10, color: '#8a8a99' }}>▼</span>
      </div>
      {state.subjectsOpen && (
        <div style={{ marginTop: 9, borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.09)', overflow: 'hidden' }}>
          {SUBJECTS.map((s, i) => <ListRow key={s} label={s} active={state.subject === s} onClick={() => planner.update({ subject: s, subjectsOpen: false })} last={i === SUBJECTS.length - 1} />)}
        </div>
      )}

      <LabelRequired label={t('dl.nameLabel')} />
      <input
        value={state.nameValue}
        onChange={(e) => setField('nameValue', e.target.value)}
        placeholder={t('dl.namePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 54, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid ' + (nameEmpty ? 'rgba(245,165,36,.5)' : 'rgba(255,255,255,.09)'), padding: '14px 15px', fontSize: 15, fontWeight: 650, lineHeight: 1.35, color: '#f4f4f7', fontFamily: 'inherit', outline: 'none' }}
      />
      {nameEmpty && <div style={{ fontSize: 12, color: '#f5a524', marginTop: 8 }}>{t('dl.nameRequired')}</div>}

      <LabelRequired label={t('dl.dateLabel')} />
      <div style={{ display: 'flex', gap: 10 }}>
        <div onClick={() => setField('dateValid', !state.dateValid)} style={{ flex: 2, height: 66, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid ' + (state.dateValid ? 'rgba(255,255,255,.09)' : 'rgba(245,165,36,.5)'), padding: '0 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
          <span style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('dl.date')}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: state.dateValid ? '#f4f4f7' : '#f5a524' }}>{state.dateValid ? t('dl.dateFuture') : t('dl.datePast')}</span>
        </div>
        <div style={{ flex: 1, height: 66, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', padding: '0 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('dl.time')}</span>
          <span style={{ fontSize: 17, fontWeight: 750 }}>09:00</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 650, color: state.dateValid ? '#8ff0de' : '#f5a524', padding: '5px 10px', borderRadius: 8, background: state.dateValid ? 'rgba(46,230,197,.13)' : 'rgba(245,165,36,.13)' }}>{state.dateValid ? t('dl.inDays11') : t('dl.datePassed')}</span>
        {!state.dateValid && <span style={{ fontSize: 12, color: '#f5a524' }}>{t('dl.pickFuture')}</span>}
      </div>

      <LabelRequired label={t('dl.topicsLabel')} tag={t('dl.recommended')} tagColor="#8ff0de" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {state.topics.map((topic, i) => (
          <div key={i} style={{ minHeight: 52, borderRadius: 15, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7a7a8a', width: 14 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>{topic}</span>
            <span onClick={() => removeTopic(i)} style={{ fontSize: 12.5, fontWeight: 650, color: '#8a8a99', cursor: 'pointer', padding: '4px 6px' }}>{t('dl.remove')}</span>
          </div>
        ))}
      </div>
      <div onClick={addTopic} style={{ marginTop: 10, height: 48, borderRadius: 15, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}>{t('dl.addTopic')}</div>
      {state.topicErr && topicsMissing && <div style={{ fontSize: 12, color: '#f5a524', marginTop: 8 }}>{t('dl.topicRequired')}</div>}

      <div style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 11px' }}>{t('dl.difficultyQ')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {DIFFICULTIES.map((d) => (
          <div key={d} onClick={() => setField('difficulty', d)} style={{ height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.difficulty === d ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.035)', border: '1.5px solid ' + (state.difficulty === d ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.1)'), color: state.difficulty === d ? '#e6dfff' : '#c9c9d6' }}>{diffLabel(t, d)}</div>
        ))}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 11px' }}>{t('dl.knowledgeQ')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {LEVELS.map((l, i) => <ListRow key={l} label={(i + 1) + '. ' + l} active={state.level === i + 1} onClick={() => setField('level', i + 1)} last={i === LEVELS.length - 1} />)}
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 10 }}>{t('dl.knowledgeNote')}</div>

      <div style={{ fontSize: 15, fontWeight: 700, margin: '22px 0 11px' }}>{t('dl.goalQ')}</div>
      <div onClick={() => setField('goalsOpen', !state.goalsOpen)} style={{ height: 54, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', cursor: 'pointer' }}>
        <span style={{ fontSize: 15, fontWeight: 650 }}>{state.goal}</span>
        <span style={{ fontSize: 10, color: '#8a8a99' }}>▼</span>
      </div>
      {state.goalsOpen && (
        <div style={{ marginTop: 9, borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.09)', overflow: 'hidden' }}>
          {GOALS.map((g, i) => <ListRow key={g} label={g} active={state.goal === g} onClick={() => planner.update({ goal: g, goalsOpen: false })} last={i === GOALS.length - 1} />)}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 10 }}>{t('dl.goalNote')}</div>

      <div onClick={() => setField('autoPlan', !state.autoPlan)} style={{ marginTop: 20, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 13, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 26, flex: 'none', borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center', background: state.autoPlan ? '#7c5cff' : 'rgba(255,255,255,.14)', justifyContent: state.autoPlan ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{t('dl.autoPlanTitle')}</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 5 }}>{t('dl.autoPlanDesc')}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('dl.summary')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
          <Row label={t('dl.kind')} value={state.kind} />
          <Row label={t('dl.subject')} value={state.subject} />
          <Row label={t('dl.deadline')} value={t('dl.deadlineValue')} />
          <Row label={t('dl.left')} value={state.dateValid ? t('dl.inDays11') : t('dl.datePassed')} />
          <Row label={t('dl.scope')} value={state.topics.length === 1 ? t('dl.oneTopic') : t('dl.nTopics', { n: state.topics.length })} />
          <Row label={t('dl.difficulty')} value={t('dl.difficultyValue', { level: difficultyLabel })} />
          <Row label={t('dl.knowledge')} value={t('dl.knowledgeValue', { level: state.level })} />
          <Row label={t('dl.goal')} value={t('dl.goalValue', { goal: state.goal })} />
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '15px -16px' }} />
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ color: '#35d07f', fontSize: 12 }}>✓</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: '#5fdd9b' }}>{state.autoPlan ? t('dl.enoughTime') : t('dl.noSessionsWillSave')}</span>
        </div>
      </div>

      <StickyFooter>
        <div
          onClick={() => deadlineSubmit(valid)}
          style={{ height: 56, borderRadius: 17, background: valid ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16.5, fontWeight: 700, color: valid ? '#fff' : '#6b6b7a', cursor: valid ? 'pointer' : 'not-allowed', boxShadow: valid ? '0 12px 30px rgba(109,77,255,.35)' : 'none' }}
        >
          {state.autoPlan ? t('dl.saveAndCreate') : t('dl.saveDeadline')}
        </div>
      </StickyFooter>

      {state.deadlineOnlySaved && (
        <ConfirmCard title={t('dl.savedTitle')} sub={t('dl.savedSub')} onDone={goHomeDeadline} buttonLabel={t('sum.backToStart')} />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: '#9a9aab' }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
