function RhythmCard({ profileDefaults }) {
  if (!profileDefaults) return null;
  const { studyTime, bedtime, wake, pref, prioritySubjects } = profileDefaults;

  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>TWÓJ RYTM DNIA</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Najlepiej uczysz się</span>
          <span style={{ fontWeight: 700 }}>{studyTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Sen</span>
          <span style={{ fontWeight: 700 }}>{bedtime}–{wake}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Styl planowania</span>
          <span style={{ fontWeight: 700 }}>{pref}</span>
        </div>
      </div>
      {prioritySubjects?.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '14px -16px' }} />
          <div style={{ fontSize: 11.5, color: '#7a7a8a', marginBottom: 8 }}>Priorytetowe przedmioty</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {prioritySubjects.map((s) => (
              <span key={s} style={{ fontSize: 12, fontWeight: 650, color: '#c9baff', background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.35)', borderRadius: 999, padding: '6px 12px' }}>{s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Profile({ studentName, schoolPlan, activities, energy, profileDefaults }) {
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-.01em' }}>{studentName || 'Ty'}</div>
          <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 2 }}>Domyślna energia: {energy}</div>
        </div>
      </div>

      {(schoolPlan || activities?.selected?.length > 0) && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 10 }}>PROFIL</div>
          {schoolPlan && (
            <div style={{ padding: 14, borderRadius: 16, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>📎</span>
              <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9baff' }}>{schoolPlan.name}</div>
            </div>
          )}
          {activities?.selected?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activities.selected.map((a) => (
                <span key={a} style={{ fontSize: 12, color: '#c9c9d6', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 12px' }}>{a}</span>
              ))}
            </div>
          )}
          {activities?.note && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>{activities.note}</div>
          )}
        </div>
      )}

      <RhythmCard profileDefaults={profileDefaults} />

      <div style={{ marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Student Planner</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>Twój asystent do planowania nauki, przygotowań do sprawdzianów i ratowania napiętych dni.</div>
      </div>
    </div>
  );
}
