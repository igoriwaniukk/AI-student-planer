import { useState } from 'react';
import { addDays, colorForSubject, toISODate } from '../lib/store';

function buildRescuePlan(sessions, selectedIds) {
  const today = toISODate(new Date());
  const occupied = new Set(
    sessions
      .filter((s) => !selectedIds.includes(s.id))
      .map((s) => `${s.day}_${s.time}`)
  );

  const candidateTimes = ['15:30', '16:30', '17:30', '18:30', '19:30'];
  const toReschedule = sessions
    .filter((s) => selectedIds.includes(s.id))
    .sort((a, b) => a.time.localeCompare(b.time));

  let dayOffset = 1;
  const changes = [];
  for (const s of toReschedule) {
    let placed = false;
    let attempts = 0;
    let offset = dayOffset;
    while (!placed && attempts < 10) {
      const day = addDays(today, offset);
      for (const time of candidateTimes) {
        const key = `${day}_${time}`;
        if (!occupied.has(key)) {
          occupied.add(key);
          changes.push({ id: s.id, subject: s.subject, duration: s.duration, oldTime: s.time, newDay: day, newTime: time });
          placed = true;
          break;
        }
      }
      offset += 1;
      attempts += 1;
    }
  }
  return changes;
}

export default function RescueDay({ sessions, onApplyRescue, onNavigate }) {
  const today = toISODate(new Date());
  const todaysOpen = sessions.filter((s) => s.day === today && !s.completed);

  const [selected, setSelected] = useState(() => new Set(todaysOpen.map((s) => s.id)));
  const [plan, setPlan] = useState(null);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function generate() {
    setPlan(buildRescuePlan(sessions, [...selected]));
  }

  function apply() {
    onApplyRescue(plan);
    onNavigate('home');
  }

  if (plan) {
    return (
      <div>
        <div style={{ fontSize: 12, color: '#ff8a5c', fontWeight: 650 }}>PRZEPLANOWANY DZIEŃ</div>
        <div style={{ fontSize: 21, fontWeight: 750, marginTop: 6 }}>Nowy plan gotowy</div>
        <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 4 }}>
          {plan.length} sesje przeniesione na najbliższe dni.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {plan.map((c, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(c.subject), flex: 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650 }}>{c.subject}</div>
                <div style={{ fontSize: 11.5, color: '#8a8a99' }}>
                  {c.oldTime} dziś → {c.newDay} {c.newTime}
                </div>
              </div>
            </div>
          ))}
          {plan.length === 0 && (
            <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Nie zaznaczono żadnych sesji.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={apply} disabled={plan.length === 0}>
            Zastosuj
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={() => setPlan(null)}>Wróć</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#ff8a5c', fontWeight: 650 }}>COŚ WYPADŁO</div>
      <div style={{ fontSize: 21, fontWeight: 750, marginTop: 6 }}>Przeplanuj dzień</div>
      <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 4 }}>
        Zaznacz sesje, których dziś nie zrobisz — rozłożymy je na kolejne dni.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {todaysOpen.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Brak otwartych sesji na dziś.</div>
        )}
        {todaysOpen.map((s) => (
          <label key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(s.subject), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650 }}>{s.subject}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{s.time} · {s.duration} min</div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={generate} disabled={todaysOpen.length === 0}>
          Wygeneruj nowy plan
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={() => onNavigate('home')}>Anuluj</button>
      </div>
    </div>
  );
}
