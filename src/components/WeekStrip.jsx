import { WEEK_DAYS } from '../lib/plannerData';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';

export default function WeekStrip({ selectedDay, onSelect, eventDays }) {
  const { t } = useLang();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 22 }}>
      {WEEK_DAYS.map(({ num, label, short }) => {
        const on = num === selectedDay;
        const hasEvent = eventDays ? eventDays.has(num) : num % 2 === 0;
        const shortLabel = t(DAY_KEY[label] + '.short') || short;
        return (
          <div
            key={num}
            onClick={onSelect ? () => onSelect(num) : undefined}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0 10px', borderRadius: 14,
              background: on ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'transparent',
              boxShadow: on ? '0 6px 18px rgba(109,77,255,.35)' : 'none',
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 650, color: on ? 'rgba(255,255,255,.85)' : '#7a7a8a', letterSpacing: '.06em' }}>{shortLabel}</span>
            <span style={{ fontSize: 17, fontWeight: on ? 750 : 700 }}>{num}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: on ? '#fff' : (hasEvent ? '#2ee6c5' : 'transparent') }} />
          </div>
        );
      })}
    </div>
  );
}
