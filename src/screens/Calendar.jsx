import { useState } from 'react';
import WeekStrip from '../components/WeekStrip';
import { BackButton, Pill, SectionTitle } from '../components/ui';
import { span, upcomingExams, hm } from '../lib/plannerLogic';
import { REFERENCE_DAY, WEEK_DAYS, TENIS_DAY } from '../lib/plannerData';

function dayInfo(num) {
  return WEEK_DAYS.find((d) => d.num === num) || WEEK_DAYS[0];
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

export default function Calendar({ planner, activities, recurringActivities = [] }) {
  const { state, go } = planner;
  const [calDay, setCalDay] = useState(state.selectedDay || REFERENCE_DAY);
  const info = dayInfo(calDay);

  const weekExams = upcomingExams(state).filter((e) => e.day >= 16 && e.day <= 22);
  const eventDays = new Set(weekExams.map((e) => e.day));
  if (info.school) eventDays.add(TENIS_DAY);

  const sched = calDay === state.selectedDay ? (state.schedule || {}) : {};
  const sessionIds = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const selectedActivities = activities?.selected || [];
  const dayRecurring = recurringActivities.filter((a) => a.day === info.label);

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
          {weekExams.map((e) => {
            const goal = state.examGoals?.[e.id];
            return (
              <Card key={e.id} style={{ background: 'rgba(245,165,36,.06)', border: '1px solid rgba(245,165,36,.28)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: e.color }}>{e.subject.toUpperCase()}</span>
                  <Pill text={e.daysUntil === 1 ? 'Jutro' : 'Za ' + e.daysUntil + ' dni'} color="#f5a524" bg="rgba(245,165,36,.15)" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{e.title}</div>
                <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{dayInfo(e.day).label}, {e.day} lipca</div>
                <div
                  onClick={() => go('goals')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)', cursor: 'pointer' }}
                >
                  {goal ? (
                    <span style={{ fontSize: 12, color: '#c9baff' }}>🎯 Cel: {goal.grade} · {hm(goal.studyMinutes)} nauki</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#8a8a99' }}>Nie ustawiono celu</span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 650, color: '#a58cff' }}>Cele ›</span>
                </div>
              </Card>
            );
          })}
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
        {dayRecurring.map((a) => (
          <Card key={a.id}><Row icon="🔁" title={a.name} sub="Zajęcie cykliczne" right={a.start + ' · ' + a.dur + ' min'} /></Card>
        ))}
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
        {info.num !== TENIS_DAY && dayRecurring.length === 0 && selectedActivities.length === 0 && (
          <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>Brak dodatkowych zajęć na ten dzień.</div></Card>
        )}
      </div>
    </div>
  );
}
