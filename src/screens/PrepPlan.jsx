import { useMemo, useState } from 'react';
import { addDays, colorForSubject, toISODate } from '../lib/store';

function generatePlan(deadline) {
  const today = toISODate(new Date());
  const start = new Date(today + 'T00:00:00');
  const due = new Date(deadline.dueDate + 'T00:00:00');
  const daysRemaining = Math.max(1, Math.round((due - start) / 86400000));

  const sessionCount = Math.min(5, Math.max(2, daysRemaining));
  const spacing = daysRemaining / sessionCount;

  const times = ['16:00', '17:00', '15:30', '18:00', '16:30'];

  return Array.from({ length: sessionCount }, (_, i) => {
    const offset = Math.min(daysRemaining - 1, Math.round(spacing * i));
    return {
      day: addDays(today, offset),
      time: times[i % times.length],
      duration: i === sessionCount - 1 ? 30 : 45,
      subject: deadline.subject,
      type: 'study',
      completed: false,
    };
  });
}

export default function PrepPlan({ deadlines, onAddSessions, onNavigate, deadlineId }) {
  const deadline = deadlines.find((d) => d.id === deadlineId) || deadlines[deadlines.length - 1];
  const plan = useMemo(() => (deadline ? generatePlan(deadline) : []), [deadline]);
  const [accepted, setAccepted] = useState(false);

  if (!deadline) {
    return (
      <div>
        <div style={{ fontSize: 15 }}>Brak terminu do zaplanowania.</div>
        <button className="btn" style={{ marginTop: 14 }} onClick={() => onNavigate('home')}>Wróć</button>
      </div>
    );
  }

  function accept() {
    onAddSessions(plan);
    setAccepted(true);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#a58cff', fontWeight: 650 }}>PLAN PRZYGOTOWAŃ</div>
      <div style={{ fontSize: 21, fontWeight: 750, marginTop: 6 }}>{deadline.title}</div>
      <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 4 }}>{deadline.subject} · termin {deadline.dueDate}</div>

      <div style={{ fontSize: 13, color: '#c9c9d6', marginTop: 16 }}>
        Zaproponowany plan nauki — {plan.length} sesje rozłożone równomiernie do terminu:
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {plan.map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(s.subject), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650 }}>{s.day}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{s.time} · {s.duration} min</div>
            </div>
          </div>
        ))}
      </div>

      {accepted ? (
        <div className="card" style={{ marginTop: 18, background: 'rgba(53,208,127,.06)', borderColor: 'rgba(53,208,127,.22)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#5fdd9b' }}>Sesje dodane do planu.</div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={() => onNavigate('planner')}>
            Zobacz w planerze
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={accept}>Zaakceptuj plan</button>
          <button className="btn" style={{ flex: 1 }} onClick={() => onNavigate('home')}>Pomiń</button>
        </div>
      )}
    </div>
  );
}
