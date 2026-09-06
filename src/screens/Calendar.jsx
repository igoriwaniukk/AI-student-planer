import { useState } from 'react';
import WeekStrip from '../components/WeekStrip';
import { BackButton, Pill, SectionTitle } from '../components/ui';
import { upcomingExams, hm, dayInfo } from '../lib/plannerLogic';
import { REFERENCE_DAY, TENIS_DAY } from '../lib/plannerData';
import { DAY_KEY, VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import DayTimeline from '../components/DayTimeline';

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
  const { t } = useLang();
  const { state, go } = planner;
  const [calDay, setCalDay] = useState(state.selectedDay || REFERENCE_DAY);
  const [weekOffset, setWeekOffset] = useState(0);
  const info = dayInfo(calDay);
  const dayLabel = t(DAY_KEY[info.label]) || info.label;

  const weekStart = 16 + weekOffset * 7;
  const weekEnd = weekStart + 6;
  const weekExams = upcomingExams(state).filter((e) => e.day >= weekStart && e.day <= weekEnd);
  const eventDays = new Set(weekExams.map((e) => e.day));
  if (info.school) eventDays.add(TENIS_DAY);
  const nearestExamDay = weekExams.filter((e) => e.daysUntil >= 0).sort((a, b) => a.day - b.day)[0]?.day ?? null;

  const sched = calDay === state.selectedDay ? (state.schedule || {}) : {};
  const sessionIds = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const selectedActivities = activities?.selected || [];
  const dayRecurring = recurringActivities.filter((a) => a.day === info.label);

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <WeekStrip
        selectedDay={calDay} onSelect={setCalDay} eventDays={eventDays} examDay={nearestExamDay} topMargin={44}
        pageable weekOffset={weekOffset} onOffsetChange={setWeekOffset}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
        <BackButton onClick={() => go('home')} />
        <div style={{ textAlign: 'right', paddingRight: 46 }}>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.02em' }}>{t('cal.title')}</div>
          <div style={{ fontSize: 12, color: '#8a8a99' }}>{t('cal.subtitle')}</div>
        </div>
      </div>

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.upcoming')}</SectionTitle>
      {weekExams.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {weekExams.map((e) => {
            const goal = state.examGoals?.[e.id];
            return (
              <Card key={e.id} style={{ background: 'rgba(245,165,36,.06)', border: '1px solid rgba(245,165,36,.28)', animation: 'cardGlowPulse 3.4s ease-in-out infinite', '--glow-color': 'rgba(245,165,36,.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: e.color }}>{(t(VALUE_KEY[e.subject]) || e.subject).toUpperCase()}</span>
                  <Pill text={e.daysUntil === 1 ? t('cal.tomorrowPill') : t('cal.inDaysPill', { n: e.daysUntil })} color="#f5a524" bg="rgba(245,165,36,.15)" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{t(VALUE_KEY[e.title]) || e.title}</div>
                <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{t(DAY_KEY[dayInfo(e.day).label]) || dayInfo(e.day).label}, {e.day} {t('month.july')}</div>
                <div
                  onClick={() => go('goals')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)', cursor: 'pointer' }}
                >
                  {goal ? (
                    <span style={{ fontSize: 12, color: '#c9baff' }}>🎯 {t('cal.goal', { grade: goal.grade, time: hm(goal.studyMinutes) })}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#8a8a99' }}>{t('cal.noGoal')}</span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 650, color: '#a58cff' }}>{t('cal.goToGoals')} ›</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.noUpcoming')}</div></Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.schedule', { day: dayLabel })}</SectionTitle>
      <Card>
        {info.school ? (
          <Row icon="🏫" title={t('cal.school')} sub={t('cal.lessonPlan')} right="8:00–14:40" />
        ) : (
          <div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.weekend')}</div>
        )}
      </Card>

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.studySessions', { day: dayLabel })}</SectionTitle>
      {sessionIds.length ? (
        <DayTimeline schedule={sched} planner={planner} t={t} compact only={['study', 'gap']} />
      ) : (
        <Card>
          <div style={{ fontSize: 12.5, color: '#8a8a99', lineHeight: 1.5 }}>{t('cal.noSessions')}</div>
          <div onClick={() => go('planner')} style={{ marginTop: 12, height: 44, borderRadius: 14, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9baff', cursor: 'pointer' }}>{t('cal.planTomorrow')}</div>
        </Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.extraActivities')}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {info.num === TENIS_DAY && (
          <Card><Row icon="🎾" title={t('cal.tennis')} sub={t('cal.fixedActivity')} right="18:00–19:00" /></Card>
        )}
        {dayRecurring.map((a) => (
          <Card key={a.id}><Row icon="🔁" title={a.name} sub={t('cal.recurringActivity')} right={a.start + ' · ' + a.dur + ' min'} /></Card>
        ))}
        {selectedActivities.length > 0 && (
          <Card>
            <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 10 }}>{t('cal.yourActivities')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedActivities.map((a) => (
                <span key={a} style={{ fontSize: 12, color: '#c9c9d6', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 12px' }}>{t(VALUE_KEY[a]) || a}</span>
              ))}
            </div>
          </Card>
        )}
        {info.num !== TENIS_DAY && dayRecurring.length === 0 && selectedActivities.length === 0 && (
          <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.noActivities')}</div></Card>
        )}
      </div>
    </div>
  );
}
