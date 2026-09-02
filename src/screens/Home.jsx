import { colorForSubject, toISODate } from '../lib/store';
import WeekStrip from '../components/WeekStrip';

export default function Home({ name, sessions, deadlines, selectedDay, onSelectDay, onToggleSession, onNavigate }) {
  const today = toISODate(new Date());
  const todaysSessions = sessions
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const sessionsByDay = sessions.reduce((acc, s) => {
    acc[s.day] = (acc[s.day] || 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const nowHHMM = now.toTimeString().slice(0, 5);
  const nextSession = sessions
    .filter((s) => s.day === today && !s.completed && s.time >= nowHHMM)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const upcomingDeadlines = [...deadlines]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const dateLong = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <div style={{ fontSize: 12.5, color: '#8a8a99' }}>{dateLong}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <div style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-.02em' }}>
          Cześć{name ? `, ${name}` : ''}
        </div>
        <span style={{ fontSize: 20 }}>👋</span>
      </div>
      <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 6 }}>Gotowy na produktywny dzień?</div>

      <WeekStrip selectedDay={selectedDay} onSelect={onSelectDay} sessionsByDay={sessionsByDay} />

      {nextSession && (
        <div className="card" style={{ marginTop: 16, background: 'rgba(139,109,255,.08)', borderColor: 'rgba(139,109,255,.25)' }}>
          <div style={{ fontSize: 11.5, color: '#a58cff', fontWeight: 650 }}>NAJBLIŻSZA SESJA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(nextSession.subject) }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{nextSession.subject}</div>
              <div style={{ fontSize: 12, color: '#8a8a99' }}>{nextSession.time} · {nextSession.duration} min</div>
            </div>
            <button className="btn btn-primary" onClick={() => onToggleSession(nextSession.id)}>
              Oznacz jako zrobione
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, fontSize: 13.5, fontWeight: 700 }}>
        Plan na {selectedDay === today ? 'dziś' : selectedDay}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {todaysSessions.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Brak zaplanowanych sesji tego dnia.</div>
        )}
        {todaysSessions.map((s) => (
          <div
            key={s.id}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: s.completed ? 0.5 : 1 }}
          >
            <input type="checkbox" checked={s.completed} onChange={() => onToggleSession(s.id)} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(s.subject), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650, textDecoration: s.completed ? 'line-through' : 'none' }}>{s.subject}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{s.time} · {s.duration} min</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Nadchodzące terminy</div>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 11.5 }} onClick={() => onNavigate('deadline')}>
          + Dodaj
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {upcomingDeadlines.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Brak zbliżających się terminów.</div>
        )}
        {upcomingDeadlines.map((d) => (
          <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(d.subject), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650 }}>{d.title}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{d.subject} · {d.dueDate}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn"
        style={{ marginTop: 20, width: '100%', borderColor: 'rgba(255,138,92,.3)', color: '#ff8a5c' }}
        onClick={() => onNavigate('rescue')}
      >
        ⚡ Coś mi wypadło — przeplanuj dzień
      </button>
    </div>
  );
}
