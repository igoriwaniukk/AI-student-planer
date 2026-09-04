import { BackButton, SectionTitle, Pill } from '../components/ui';
import { GOALS } from '../lib/plannerData';
import { upcomingExams, hm } from '../lib/plannerLogic';

function Card({ children, style }) {
  return (
    <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', ...style }}>
      {children}
    </div>
  );
}

function ExamGoalCard({ exam, goal, onGrade, onAdjust }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: exam.color }}>{exam.subject.toUpperCase()}</span>
        <Pill text={exam.daysUntil === 1 ? 'Jutro' : 'Za ' + exam.daysUntil + ' dni'} color="#f5a524" bg="rgba(245,165,36,.15)" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{exam.title}</div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '16px 0 9px' }}>JAKĄ OCENĘ PLANUJESZ ZDOBYĆ?</div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div onClick={() => onAdjust(-15)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 19, fontWeight: 750 }}>{hm(goal.studyMinutes)}</div>
        <div onClick={() => onAdjust(15)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
      </div>
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 10, lineHeight: 1.45 }}>Łączny czas nauki, jaki chcesz poświęcić przed tym sprawdzianem.</div>
    </Card>
  );
}

export default function Goals({ planner }) {
  const { state, go, setExamGrade, adjustExamStudyMinutes } = planner;
  const exams = upcomingExams(state);
  const DEFAULT_GOAL = { grade: GOALS[2], studyMinutes: 120 };

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
      {exams.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {exams.map((exam) => (
            <ExamGoalCard
              key={exam.id}
              exam={exam}
              goal={state.examGoals[exam.id] || DEFAULT_GOAL}
              onGrade={(g) => setExamGrade(exam.id, g)}
              onAdjust={(delta) => adjustExamStudyMinutes(exam.id, delta)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div style={{ fontSize: 12.5, color: '#8a8a99', lineHeight: 1.5 }}>Brak sprawdzianów w kalendarzu. Dodaj termin, aby ustawić dla niego cel.</div>
          <div onClick={() => go('deadline')} style={{ marginTop: 12, height: 44, borderRadius: 14, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9baff', cursor: 'pointer' }}>Dodaj termin</div>
        </Card>
      )}
    </div>
  );
}
