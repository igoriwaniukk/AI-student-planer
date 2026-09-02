import { useState } from 'react';
import { colorForSubject, formatDayLabel, toISODate } from '../lib/store';
import WeekStrip from '../components/WeekStrip';

const SUBJECTS = ['Matematyka', 'Angielski', 'Fizyka', 'Historia', 'Chemia', 'Biologia'];

export default function Planner({ sessions, selectedDay, onSelectDay, onAddSession, onDeleteSession, onToggleSession }) {
  const [form, setForm] = useState({ time: '15:00', duration: 45, subject: SUBJECTS[0], type: 'study' });
  const [showForm, setShowForm] = useState(false);

  const sessionsByDay = sessions.reduce((acc, s) => {
    acc[s.day] = (acc[s.day] || 0) + 1;
    return acc;
  }, {});

  const dayList = sessions
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  function submit(e) {
    e.preventDefault();
    onAddSession({ ...form, day: selectedDay });
    setShowForm(false);
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 750 }}>Plan tygodnia</div>
      <WeekStrip selectedDay={selectedDay} onSelect={onSelectDay} sessionsByDay={sessionsByDay} />

      <div style={{ marginTop: 20, fontSize: 13.5, fontWeight: 700, textTransform: 'capitalize' }}>
        {formatDayLabel(selectedDay)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {dayList.length === 0 && (
          <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Brak sesji — dodaj pierwszą poniżej.</div>
        )}
        {dayList.map((s) => (
          <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: s.completed ? 0.5 : 1 }}>
            <input type="checkbox" checked={s.completed} onChange={() => onToggleSession(s.id)} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(s.subject), flex: 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650, textDecoration: s.completed ? 'line-through' : 'none' }}>{s.subject}</div>
              <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{s.time} · {s.duration} min · {s.type === 'class' ? 'zajęcia' : 'nauka'}</div>
            </div>
            <button className="btn" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => onDeleteSession(s.id)}>
              Usuń
            </button>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => setShowForm(true)}>
          + Dodaj sesję
        </button>
      ) : (
        <form onSubmit={submit} className="card" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <input
              type="number"
              min="15"
              step="15"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              placeholder="Minuty"
            />
          </div>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="study">Nauka</option>
            <option value="class">Zajęcia</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Zapisz</button>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Anuluj</button>
          </div>
        </form>
      )}
    </div>
  );
}
