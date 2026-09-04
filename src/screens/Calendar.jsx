import { useState } from 'react';
import WeekStrip from '../components/WeekStrip';
import { BackButton, Pill, SectionTitle } from '../components/ui';
import { span } from '../lib/plannerLogic';

const DAYS = [
  { num: 16, label: 'Czwartek', short: 'CZW', school: true },
  { num: 17, label: 'Piątek', short: 'PT', school: true },
  { num: 18, label: 'Sobota', short: 'SOB', school: false },
  { num: 19, label: 'Niedziela', short: 'ND', school: false },
  { num: 20, label: 'Poniedziałek', short: 'PN', school: true },
  { num: 21, label: 'Wtorek', short: 'WT', school: true },
  { num: 22, label: 'Środa', short: 'ŚR', school: true },
];
const REFERENCE_DAY = 20; // "jutro" pivot used across the app (Poniedziałek, 20 lipca)
const TENIS_DAY = 20;

function dayInfo(num) {
  return DAYS.find((d) => d.num === num) || DAYS[0];
}

function Card({ children, style }) {
  return (
    <div style={{ padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', ...style }}>
      {children}
    </div>
  );
}

function Row({ icon, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 11, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <span style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', flex: 'none' }}>{right}</span>}
    </div>
  );
}

export default function Calendar({ planner, activities }) {
  const { state, go } = planner;
  const [calDay, setCalDay] = useState(state.selectedDay || REFERENCE_DAY);
  const info = dayInfo(calDay);

  // Exams within the visible 7-day window, derived the same way the rest of the
  // app phrases deadlines ("za N dni") relative to the planning pivot day.
  const exams = [{ subject: 'Matematyka', title: 'Sprawdzian', color: '#a58cff', day: 22 }];
  if (state.bioDeadlineSaved) exams.push({ subject: 'Biologia', title: 'Sprawdzian', color: '#2ee6c5', day: 31 });
  const weekExams = exams
    .filter((e) => e.day >= 16 && e.day <= 22)
    .map((e) => ({ ...e, daysUntil: e.day - REFERENCE_DAY }));
  const eventDays = new Set(weekExams.map((e) => e.day));
  if (info.school) eventDays.add(TENIS_DAY);

  const sched = calDay === state.selectedDay ? (state.schedule || {}) : {};
  const sessionIds = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const selectedActivities = activities?.selected || [];

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('home')} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.02em' }}>Kalendarz</div>
          <div style={{ fontSize: 12, color: '#8a8a99' }}>Najbliższy tydzień</div>
        </div>
      </div>

      <WeekStrip selectedDay={calDay} onSelect={setCalDay} eventDays={eventDays} />

      <SectionTitle style={{ margin: '22px 0 12px' }}>Nadchodzące terminy</SectionTitle>
      {weekExams.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {weekExams.map((e) => (
            <Card key={e.subject} style={{ background: 'rgba(245,165,36,.06)', border: '1px solid rgba(245,165,36,.28)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: e.color }}>{e.subject.toUpperCase()}</span>
                <Pill text={e.daysUntil === 1 ? 'Jutro' : 'Za ' + e.daysUntil + ' dni'} color="#f5a524" bg="rgba(245,165,36,.15)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{e.title}</div>
              <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{dayInfo(e.day).label}, {e.day} lipca</div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>Brak terminów w najbliższym tygodniu.</div></Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>Plan lekcji — {info.label}</SectionTitle>
      <Card>
        {info.school ? (
          <Row icon="🏫" title="Szkoła" sub="Plan lekcji" right="8:00–14:40" />
        ) : (
          <div style={{ fontSize: 12.5, color: '#8a8a99' }}>Weekend — brak zajęć szkolnych.</div>
        )}
      </Card>

      <SectionTitle style={{ margin: '22px 0 12px' }}>Sesje nauki — {info.label}</SectionTitle>
      {sessionIds.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sessionIds.map((id) => {
            const d = planner.def(id);
            const b = sched[id];
            return <Card key={id}><Row icon={d.subject[0]} title={d.short} sub={span(b.start, b.start + b.dur)} right={b.dur + ' min'} /></Card>;
          })}
        </div>
      ) : (
        <Card>
          <div style={{ fontSize: 12.5, color: '#8a8a99', lineHeight: 1.5 }}>Brak zaplanowanych sesji nauki na ten dzień.</div>
          <div onClick={() => go('planner')} style={{ marginTop: 12, height: 44, borderRadius: 14, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9baff', cursor: 'pointer' }}>Zaplanuj jutro</div>
        </Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>Zajęcia dodatkowe</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {info.num === TENIS_DAY && (
          <Card><Row icon="🎾" title="Tenis" sub="Stałe zajęcie" right="18:00–19:00" /></Card>
        )}
        {selectedActivities.length > 0 && (
          <Card>
            <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 10 }}>TWOJE STAŁE ZAJĘCIA</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedActivities.map((a) => (
                <span key={a} style={{ fontSize: 12, color: '#c9c9d6', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 12px' }}>{a}</span>
              ))}
            </div>
          </Card>
        )}
        {info.num !== TENIS_DAY && selectedActivities.length === 0 && (
          <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>Brak dodatkowych zajęć na ten dzień.</div></Card>
        )}
      </div>
    </div>
  );
}
