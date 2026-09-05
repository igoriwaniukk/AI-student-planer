import { useState } from 'react';
import { BackButton, SectionTitle, Pill, BottomSheet, Chip } from '../components/ui';
import { GOALS, IMPORTANCE_OPTIONS, SUBJECTS } from '../lib/plannerData';
import { upcomingExams, hm } from '../lib/plannerLogic';

function Card({ children, style }) {
  return (
    <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', ...style }}>
      {children}
    </div>
  );
}

function Stepper({ value, onAdjust, step = 15 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div onClick={() => onAdjust(-step)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 19, fontWeight: 750 }}>{hm(value)}</div>
      <div onClick={() => onAdjust(step)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
    </div>
  );
}

function ExamGoalCard({ exam, goal, onGrade, onImportance, onAdjust, onRemove }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: exam.color }}>{exam.subject.toUpperCase()}</span>
        <Pill text={exam.daysUntil === 1 ? 'Jutro' : 'Za ' + exam.daysUntil + ' dni'} color="#f5a524" bg="rgba(245,165,36,.15)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{exam.title}</div>
        {onRemove && <span onClick={onRemove} style={{ fontSize: 12, fontWeight: 650, color: '#8a8a99', cursor: 'pointer', marginTop: 8 }}>Usuń</span>}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '16px 0 9px' }}>JAK WAŻNY JEST TEN SPRAWDZIAN?</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {IMPORTANCE_OPTIONS.map((imp) => (
          <Chip key={imp} label={imp} active={goal.importance === imp} onClick={() => onImportance(imp)} style={{ flex: 1, textAlign: 'center' }} />
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>JAKĄ OCENĘ PLANUJESZ ZDOBYĆ?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {GOALS.map((g) => {
          const active = goal.grade === g;
          return (
            <div
              key={g}
              onClick={() => onGrade(g)}
              style={{
                padding: '12px 14px', borderRadius: 13, fontSize: 13.5, fontWeight: active ? 700 : 550, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: active ? '#e6dfff' : '#c9c9d6',
                background: active ? 'rgba(124,92,255,.16)' : 'rgba(255,255,255,.03)',
                border: '1px solid ' + (active ? 'rgba(124,92,255,.5)' : 'rgba(255,255,255,.07)'),
              }}
            >
              {g}
              {active && <span style={{ color: '#a58cff' }}>✓</span>}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>ILE CHCESZ SIĘ POUCZYĆ?</div>
      <Stepper value={goal.studyMinutes} onAdjust={onAdjust} />
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 10, lineHeight: 1.45 }}>Łączny czas nauki, jaki chcesz poświęcić przed tym sprawdzianem.</div>
    </Card>
  );
}

function AddGoalSheet({ onCancel, onSave }) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [title, setTitle] = useState('');
  const [daysUntil, setDaysUntil] = useState(7);
  const [importance, setImportance] = useState('Średni');
  const [grade, setGrade] = useState(GOALS[2]);
  const [studyMinutes, setStudyMinutes] = useState(120);
  const nameEmpty = !title.trim();

  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>Dodaj własny cel</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>Dodaj sprawdzian, którego nie ma jeszcze w kalendarzu.</div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>PRZEDMIOT</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SUBJECTS.map((s) => <Chip key={s} label={s} active={subject === s} onClick={() => setSubject(s)} />)}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>NAZWA</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Np. Sprawdzian z działu II"
        style={{ width: '100%', boxSizing: 'border-box', height: 50, padding: '0 15px', borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f4f7', fontSize: 15, fontWeight: 650, fontFamily: 'inherit', outline: 'none' }}
      />

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>ZA ILE DNI JEST SPRAWDZIAN?</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div onClick={() => setDaysUntil((d) => Math.max(1, d - 1))} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 19, fontWeight: 750 }}>{daysUntil === 1 ? 'Jutro' : 'Za ' + daysUntil + ' dni'}</div>
        <div onClick={() => setDaysUntil((d) => d + 1)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>JAK WAŻNY JEST TEN SPRAWDZIAN?</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {IMPORTANCE_OPTIONS.map((imp) => <Chip key={imp} label={imp} active={importance === imp} onClick={() => setImportance(imp)} style={{ flex: 1, textAlign: 'center' }} />)}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>JAKĄ OCENĘ PLANUJESZ ZDOBYĆ?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {GOALS.map((g) => <Chip key={g} label={g} active={grade === g} onClick={() => setGrade(g)} />)}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>ILE CHCESZ SIĘ POUCZYĆ?</div>
      <Stepper value={studyMinutes} onAdjust={(d) => setStudyMinutes((m) => Math.max(15, m + d))} />

      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={onCancel} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>Anuluj</div>
        <div
          onClick={() => !nameEmpty && onSave({ subject, title: title.trim(), daysUntil, importance, grade, studyMinutes })}
          style={{ flex: 1.4, height: 50, borderRadius: 15, background: nameEmpty ? 'rgba(255,255,255,.06)' : 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: nameEmpty ? '#6b6b7a' : '#fff', cursor: nameEmpty ? 'not-allowed' : 'pointer' }}
        >
          Dodaj cel
        </div>
      </div>
    </BottomSheet>
  );
}

export default function Goals({ planner }) {
  const { state, go, setExamGrade, setExamImportance, adjustExamStudyMinutes, addCustomExam, removeCustomExam } = planner;
  const [adding, setAdding] = useState(false);
  const exams = upcomingExams(state);
  const DEFAULT_GOAL = { grade: GOALS[2], studyMinutes: 120, importance: 'Średni' };

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('home')} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.02em' }}>Cele</div>
          <div style={{ fontSize: 12, color: '#8a8a99' }}>Ocena i czas nauki na sprawdziany</div>
        </div>
      </div>

      <SectionTitle style={{ margin: '22px 0 12px' }}>Twoje sprawdziany</SectionTitle>
      {exams.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {exams.map((exam) => (
            <ExamGoalCard
              key={exam.id}
              exam={exam}
              goal={state.examGoals[exam.id] || DEFAULT_GOAL}
              onGrade={(g) => setExamGrade(exam.id, g)}
              onImportance={(imp) => setExamImportance(exam.id, imp)}
              onAdjust={(delta) => adjustExamStudyMinutes(exam.id, delta)}
              onRemove={exam.id.startsWith('custom-') ? () => removeCustomExam(exam.id) : null}
            />
          ))}
        </div>
      )}

      <div
        onClick={() => setAdding(true)}
        style={{ marginTop: exams.length ? 14 : 0, height: 50, borderRadius: 16, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}
      >
        + Dodaj własny cel
      </div>

      {adding && (
        <AddGoalSheet
          onCancel={() => setAdding(false)}
          onSave={(input) => { addCustomExam(input); setAdding(false); }}
        />
      )}
    </div>
  );
}
