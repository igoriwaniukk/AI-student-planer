import { useState } from 'react';
import WeekStrip from '../components/WeekStrip';
import { BackButton, Pill, SectionTitle } from '../components/ui';
import { upcomingExams, dayInfo, formatMonthDay, daysPill, planFor, fmt } from '../lib/plannerLogic';
import { NUM_TODAY, WEEK_DAYS } from '../lib/plannerData';
import { weekDayItems } from '../lib/weekView';
import { DAY_KEY, VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import DayTimeline from '../components/DayTimeline';
import { WeeklyIcon } from '../components/planIcons';
import { iconForActivity } from '../lib/taskAuto';

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

const KIND_COLOR = { study: '#a58cff', school: '#2ee6c5', todo: '#8a8a99', test: '#f5a524' };
const VIEW_KEY = 'sp_calView';

function DayWeekSwitch({ view, setView }) {
  const { t } = useLang();
  const tab = (key, label) => (
    <div
      onClick={() => setView(key)}
      style={{
        flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 11, fontSize: 13.5, cursor: 'pointer', transition: 'background .2s ease',
        fontWeight: view === key ? 800 : 700, color: view === key ? '#fff' : '#8a8a99',
        background: view === key ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'transparent',
      }}
    >
      {label}
    </div>
  );
  return (
    <div style={{ display: 'flex', padding: 4, borderRadius: 14, background: '#121019', border: '1px solid rgba(255,255,255,.08)', marginTop: 16 }}>
      {tab('day', t('cal.dayView'))}
      {tab('week', t('cal.weekView'))}
    </div>
  );
}

// The week view: one card per day with everything on it, colour-coded.
// Tapping a card opens that day in the Day view.
function WeekView({ planner, recurringActivities, weekStart, onOpenDay }) {
  const { t } = useLang();
  const { state, go, update } = planner;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      {Array.from({ length: 7 }, (_, i) => weekStart + i).map((num) => {
        const info = dayInfo(num);
        const items = weekDayItems(state, num, recurringActivities, t);
        const today = num === NUM_TODAY;
        const past = num < NUM_TODAY;
        const canPlan = !planFor(state, num) && (num === NUM_TODAY || num === NUM_TODAY + 1);
        const later = !planFor(state, num) && num > NUM_TODAY + 1;
        return (
          <div
            key={num}
            onClick={() => onOpenDay(num)}
            style={{
              padding: '12px 14px', borderRadius: 18, cursor: 'pointer', opacity: past ? 0.62 : 1,
              background: today ? 'linear-gradient(160deg,rgba(139,109,255,.16),rgba(139,109,255,.04))' : '#121019',
              border: '1px solid ' + (today ? 'rgba(139,109,255,.45)' : 'rgba(255,255,255,.06)'),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: today ? '#c9baff' : '#8a8a99' }}>{t(DAY_KEY[info.label] + '.short') || info.short}</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{info.monthDay}</span>
              {today && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.04em', padding: '3px 8px', borderRadius: 99, background: '#8b6dff', color: '#fff' }}>{t('cal.todayPill').toUpperCase()}</span>}
            </div>
            {items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 9 }}>
                {items.map((it) => (
                  <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, minWidth: 0 }}>
                    <span style={{ width: 3, height: 18, borderRadius: 2, flex: 'none', background: it.done ? '#35d07f' : KIND_COLOR[it.kind] }} />
                    <span style={{ width: 44, flex: 'none', color: '#8a8a99', fontVariantNumeric: 'tabular-nums' }}>{it.start == null || it.start < 0 ? '' : fmt(it.start)}</span>
                    <span style={{ flex: 'none' }}>{it.icon}</span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(it.done ? { textDecoration: 'line-through', color: '#8a8a99' } : {}) }}>{it.title}</span>
                    {it.kind === 'test' && <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,165,36,.15)', color: '#f5a524' }}>{t('cal.testLabel')}</span>}
                    {it.done && <span style={{ flex: 'none', color: '#35d07f', fontWeight: 800 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
            {items.length === 0 && !canPlan && !later && <div style={{ fontSize: 12, color: '#6a6a7a', marginTop: 8 }}>{t('cal.nothingPlanned')}</div>}
            {canPlan && (
              <div
                onClick={(e) => { e.stopPropagation(); update({ planToday: num === NUM_TODAY }); go('planner'); }}
                style={{ marginTop: 9, height: 36, borderRadius: 11, border: '1px dashed rgba(139,109,255,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 750, color: '#c9baff' }}
              >
                {t('cal.planThisDay')}
              </div>
            )}
            {later && <div style={{ fontSize: 11.5, color: '#6a6a7a', marginTop: 8 }}>{t('cal.planLater')}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Calendar({ planner, activities, recurringActivities = [] }) {
  const { t } = useLang();
  const { state, go, update } = planner;
  const [calDay, setCalDay] = useState(NUM_TODAY);
  const [weekOffset, setWeekOffset] = useState(0);
  // Day or Week, remembered on this device.
  const [view, setViewState] = useState(() => { try { return localStorage.getItem(VIEW_KEY) === 'week' ? 'week' : 'day'; } catch { return 'day'; } });
  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage blocked */ } };
  const info = dayInfo(calDay);
  const dayLabel = t(DAY_KEY[info.label]) || info.label;

  // The same 7 days the week strip shows (it moves with the real date).
  const weekStart = WEEK_DAYS[0].num + weekOffset * 7;
  const weekEnd = weekStart + 6;
  // Only exams still ahead — one that's already happened isn't "upcoming".
  const weekExams = upcomingExams(state).filter((e) => e.daysUntil >= 0 && e.day >= weekStart && e.day <= weekEnd);
  const eventDays = new Set(weekExams.map((e) => e.day));
  const nearestExamDay = [...weekExams].sort((a, b) => a.day - b.day)[0]?.day ?? null;

  const sched = planFor(state, calDay) || {};
  const sessionIds = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const selectedActivities = activities?.selected || [];
  const dayRecurring = recurringActivities.filter((a) => a.day === info.label);

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => go('home')} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-.02em' }}>{t('cal.title')}</div>
          <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 4 }}>{view === 'week' ? formatMonthDay(weekStart, { short: true }) + ' – ' + formatMonthDay(weekEnd, { short: true }) : t('cal.subtitle')}</div>
        </div>
        {view === 'week' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[[-1, '‹'], [1, '›']].map(([step, label]) => (
              <span key={step} onClick={() => setWeekOffset(weekOffset + step)} style={{ width: 34, height: 34, borderRadius: 11, background: '#141119', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', fontSize: 18, cursor: 'pointer' }}>{label}</span>
            ))}
          </div>
        )}
      </div>
      <DayWeekSwitch view={view} setView={setView} />

      {view === 'week' ? (
        <WeekView planner={planner} recurringActivities={recurringActivities} weekStart={weekStart} onOpenDay={(num) => { setCalDay(num); setView('day'); }} />
      ) : (
      <>
      <WeekStrip
        selectedDay={calDay} onSelect={setCalDay} eventDays={eventDays} examDay={nearestExamDay} topMargin={18}
        pageable weekOffset={weekOffset} onOffsetChange={setWeekOffset}
      />

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.upcoming')}</SectionTitle>
      {weekExams.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {weekExams.map((e) => (
            <Card key={e.id} style={{ background: 'rgba(245,165,36,.06)', border: '1px solid rgba(245,165,36,.28)', animation: 'cardGlowPulse 3.4s ease-in-out infinite', '--glow-color': 'rgba(245,165,36,.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: e.color }}>{(t(VALUE_KEY[e.subject]) || e.subject).toUpperCase()}</span>
                <Pill text={daysPill(t, e.daysUntil)} color="#f5a524" bg="rgba(245,165,36,.15)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{t(VALUE_KEY[e.title]) || e.title}</div>
              <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{t(DAY_KEY[dayInfo(e.day).label]) || dayInfo(e.day).label}, {formatMonthDay(e.day)}</div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.noUpcoming')}</div></Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.studySessions', { day: dayLabel })}</SectionTitle>
      {sessionIds.length ? (
        <DayTimeline schedule={sched} planner={planner} t={t} compact only={['study', 'gap']} />
      ) : (
        <Card>
          <div style={{ fontSize: 12.5, color: '#8a8a99', lineHeight: 1.5 }}>{t('cal.noSessions')}</div>
          <div onClick={() => { update({ planToday: false }); go('planner'); }} style={{ marginTop: 12, height: 44, borderRadius: 14, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9baff', cursor: 'pointer' }}>{t('cal.planTomorrow')}</div>
        </Card>
      )}

      <SectionTitle style={{ margin: '22px 0 12px' }}>{t('cal.extraActivities')}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {dayRecurring.map((a) => (
          <Card key={a.id}><Row icon={iconForActivity(a.name) || <WeeklyIcon size={18} />} title={a.name} sub={t('cal.recurringActivity')} right={a.start + ' · ' + a.dur + ' min'} /></Card>
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
        {dayRecurring.length === 0 && selectedActivities.length === 0 && (
          <Card><div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.noActivities')}</div></Card>
        )}
      </div>
      </>
      )}
    </div>
    </>
  );
}
