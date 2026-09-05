import { WEEK_DAYS, REFERENCE_DAY } from '../lib/plannerData';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';

// examDay pulls the days counting down to it (today through the exam,
// inclusive) to the front of the strip and marks them with an orange bar +
// caption. streakCount instead marks the most recent `streakCount` days up
// to today (no reordering) with a warm flame highlight, for a habit-streak
// view — the two modes are never used together by any current caller.
export default function WeekStrip({ selectedDay, onSelect, eventDays, examDay, streakCount = 0, topMargin = 22 }) {
  const { t } = useLang();
  const countdownSet = examDay != null
    ? new Set(WEEK_DAYS.filter((d) => d.num >= REFERENCE_DAY && d.num <= examDay).map((d) => d.num))
    : null;
  const streakSet = streakCount > 0
    ? new Set(WEEK_DAYS.filter((d) => d.num <= REFERENCE_DAY && d.num > REFERENCE_DAY - streakCount).map((d) => d.num))
    : null;
  const orderedDays = countdownSet
    ? WEEK_DAYS.filter((d) => countdownSet.has(d.num)).concat(WEEK_DAYS.filter((d) => !countdownSet.has(d.num)))
    : WEEK_DAYS;
  const daysUntilExam = examDay != null ? examDay - REFERENCE_DAY : null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: topMargin }}>
        {orderedDays.map(({ num, label, short }) => {
          const on = num === selectedDay;
          const hasEvent = eventDays ? eventDays.has(num) : num % 2 === 0;
          const isCountdown = countdownSet ? countdownSet.has(num) : false;
          const isStreak = streakSet ? streakSet.has(num) : false;
          const shortLabel = t(DAY_KEY[label] + '.short') || short;
          return (
            <div
              key={num}
              onClick={onSelect ? () => onSelect(num) : undefined}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: onSelect ? 'pointer' : 'default' }}
            >
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 13px 10px', borderRadius: 999,
                  background: on
                    ? 'linear-gradient(160deg,#8b6dff,#6d4dff)'
                    : isCountdown ? 'rgba(245,165,36,.1)' : isStreak ? 'rgba(245,101,36,.14)' : 'transparent',
                  border: on
                    ? '1px solid transparent'
                    : isCountdown ? '1px solid rgba(245,165,36,.35)' : isStreak ? '1px solid rgba(245,101,36,.38)' : '1px solid transparent',
                  boxShadow: on ? '0 6px 18px rgba(109,77,255,.35)' : 'none',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 650, color: on ? 'rgba(255,255,255,.85)' : '#7a7a8a', letterSpacing: '.06em' }}>{shortLabel}</span>
                <span style={{ fontSize: 17, fontWeight: on ? 750 : 700 }}>{num}</span>
              </div>
              {isStreak && !isCountdown ? (
                <span style={{ fontSize: 9, lineHeight: 1 }}>🔥</span>
              ) : (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: hasEvent && !on ? '#2ee6c5' : 'transparent' }} />
              )}
              {isCountdown && <div style={{ marginTop: -2, width: '50%', height: 3, borderRadius: 2, background: '#f5a524' }} />}
            </div>
          );
        })}
      </div>
      {countdownSet && daysUntilExam >= 0 && (
        <div style={{ marginTop: 9, fontSize: 11.5, fontWeight: 650, color: '#f5a524', textAlign: 'center' }}>
          {t('cal.examCountdown', { when: daysUntilExam === 1 ? t('cal.tomorrowPill').toLowerCase() : t('cal.inDaysPill', { n: daysUntilExam }).toLowerCase() })}
        </div>
      )}
    </div>
  );
}
