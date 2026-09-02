const DAYS = [['CZW', 16], ['PT', 17], ['SOB', 18], ['ND', 19], ['PN', 20], ['WT', 21], ['ŚR', 22]];

export default function WeekStrip({ selectedDay }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 22 }}>
      {DAYS.map(([label, num]) => {
        const on = num === selectedDay;
        return (
          <div
            key={num}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0 10px', borderRadius: 14,
              background: on ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'transparent',
              boxShadow: on ? '0 6px 18px rgba(109,77,255,.35)' : 'none',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 650, color: on ? 'rgba(255,255,255,.85)' : '#7a7a8a', letterSpacing: '.06em' }}>{label}</span>
            <span style={{ fontSize: 17, fontWeight: on ? 750 : 700 }}>{num}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: on ? '#fff' : (num % 2 === 0 ? '#2ee6c5' : 'transparent') }} />
          </div>
        );
      })}
    </div>
  );
}
