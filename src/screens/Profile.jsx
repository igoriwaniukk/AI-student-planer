import { useState } from 'react';
import { hm, weeklyReview } from '../lib/plannerLogic';
import { RECUR_DAYS } from '../lib/plannerData';
import { Chip } from '../components/ui';

function RecurringActivities({ recurringActivities, setRecurringActivities }) {
  const [name, setName] = useState('');
  const [day, setDay] = useState(RECUR_DAYS[0]);
  const [start, setStart] = useState('18:00');
  const [dur, setDur] = useState(60);
  const list = recurringActivities || [];

  function add() {
    if (!name.trim()) return;
    setRecurringActivities(list.concat({ id: Date.now(), name: name.trim(), day, start, dur }));
    setName('');
  }
  function remove(id) {
    setRecurringActivities(list.filter((a) => a.id !== id));
  }

  const inputStyle = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 13px', fontSize: 13.5, color: '#f4f4f7', fontFamily: 'inherit' };

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>CYKLICZNE ZAJĘCIA</div>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
          {list.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 11, borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: '#8a8a99', marginTop: 2 }}>{a.day} · {a.start} · {a.dur} min</div>
              </div>
              <span onClick={() => remove(a.id)} style={{ fontSize: 12, fontWeight: 650, color: '#f5a524', cursor: 'pointer', flex: 'none' }}>Usuń</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Nazwa zajęć (np. Basen)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RECUR_DAYS.map((d) => <Chip key={d} label={d.slice(0, 3)} active={day === d} onClick={() => setDay(d)} />)}
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <input type="number" min={15} step={5} value={dur} onChange={(e) => setDur(Math.max(15, Number(e.target.value) || 60))} style={{ ...inputStyle, width: 88, textAlign: 'center' }} />
        </div>
        <div onClick={add} style={{ height: 44, borderRadius: 13, background: name.trim() ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: name.trim() ? '#fff' : '#6b6b7a', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>+ Dodaj zajęcie</div>
      </div>
    </div>
  );
}

function WeeklyReviewCard({ studyHistory }) {
  const { plannedMin, actualMin, completedDays, trackedDays, rate } = weeklyReview(studyHistory || {});
  if (!trackedDays) return null;
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>PODSUMOWANIE TYGODNIA</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Planowany czas nauki</span>
          <span style={{ fontWeight: 700 }}>{hm(plannedMin)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Rzeczywisty czas nauki</span>
          <span style={{ fontWeight: 700 }}>{hm(actualMin)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>Dni z ukończonym planem</span>
          <span style={{ fontWeight: 700, color: '#2ee6c5' }}>{completedDays} z {trackedDays} ({rate}%)</span>
        </div>
      </div>
    </div>
  );
}

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

export default function Profile({ studentName, schoolPlan, activities, energy, profileDefaults, studyHistory, recurringActivities, setRecurringActivities }) {
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

      <WeeklyReviewCard studyHistory={studyHistory} />

      <RecurringActivities recurringActivities={recurringActivities} setRecurringActivities={setRecurringActivities} />

      <div style={{ marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Student Planner</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>Twój asystent do planowania nauki, przygotowań do sprawdzianów i ratowania napiętych dni.</div>
      </div>
    </div>
  );
}
