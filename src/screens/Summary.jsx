import { colorForSubject, toISODate } from '../lib/store';

export default function Summary({ sessions, deadlines }) {
  const today = toISODate(new Date());
  const todaySessions = sessions.filter((s) => s.day === today);
  const done = todaySessions.filter((s) => s.completed).length;
  const total = todaySessions.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const bySubject = sessions
    .filter((s) => s.completed)
    .reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + s.duration;
      return acc;
    }, {});

  const upcoming = deadlines.filter((d) => d.dueDate >= today).length;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 750 }}>Podsumowanie</div>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, color: '#8a8a99', fontWeight: 650 }}>DZISIAJ</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          <div style={{ fontSize: 32, fontWeight: 750 }}>{pct}%</div>
          <div style={{ fontSize: 13, color: '#8a8a99' }}>{done} / {total} sesji ukończonych</div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,.06)', marginTop: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#8b6dff,#6d4dff)' }} />
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 13.5, fontWeight: 700 }}>Czas nauki wg przedmiotu (łącznie)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {Object.keys(bySubject).length === 0 && (
          <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>Brak ukończonych sesji.</div>
        )}
        {Object.entries(bySubject).map(([subject, minutes]) => (
          <div key={subject} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForSubject(subject), flex: 'none' }} />
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 650 }}>{subject}</div>
            <div style={{ fontSize: 12.5, color: '#8a8a99' }}>{Math.round(minutes / 60 * 10) / 10} godz.</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 22 }}>📌</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 650 }}>{upcoming} nadchodzących terminów</div>
          <div style={{ fontSize: 11.5, color: '#8a8a99' }}>Zobacz je na ekranie głównym</div>
        </div>
      </div>
    </div>
  );
}
