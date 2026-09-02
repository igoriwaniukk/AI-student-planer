import { addDays, toISODate } from '../lib/store';

const DAY_LETTERS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export default function WeekStrip({ selectedDay, onSelect, sessionsByDay }) {
  const today = toISODate(new Date());
  const jsWeekday = new Date(today + 'T00:00:00').getDay();
  const mondayOffset = jsWeekday === 0 ? -6 : 1 - jsWeekday;
  const monday = addDays(today, mondayOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 22 }}>
      {days.map((day, i) => {
        const isSelected = day === selectedDay;
        const isToday = day === today;
        const hasSessions = (sessionsByDay?.[day] || 0) > 0;
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            style={{
              border: 'none',
              cursor: 'pointer',
              borderRadius: 14,
              padding: '8px 0 10px',
              background: isSelected ? 'linear-gradient(150deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.03)',
              color: isSelected ? '#fff' : '#c9c9d6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, opacity: 0.75 }}>{DAY_LETTERS[i]}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{Number(day.slice(8, 10))}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: hasSessions ? (isSelected ? '#fff' : '#a58cff') : 'transparent',
              }}
            />
            {isToday && !isSelected && (
              <span style={{ fontSize: 8, color: '#a58cff' }}>dziś</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
