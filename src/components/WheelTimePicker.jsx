import { useEffect, useRef } from 'react';

export const ITEM_H = 40;
const VISIBLE = 3;
export const PAD = (ITEM_H * (VISIBLE - 1)) / 2;
const fmt2 = (n) => String(n).padStart(2, '0');

// One scrollable column (hours, minutes, or — via WheelDatePicker — day/
// month/year, using its own `format`). Native scroll (touch drag, mouse
// wheel, trackpad) does the actual scrolling — scroll-snap settles it on an
// item, and a debounced onScroll reads back whichever one ended up
// centered, so there's no separate drag-gesture math to get wrong.
export function WheelColumn({ options, value, onChange, format = fmt2 }) {
  const ref = useRef(null);
  const settleRef = useRef(null);
  const idx = Math.max(0, options.indexOf(value));

  // Jump to the right spot on mount and whenever the value changes for a
  // reason other than this column's own scroll (e.g. the parent rounding
  // an odd initial minute down to the nearest step).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (Math.round(el.scrollTop / ITEM_H) !== idx) el.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleScroll(e) {
    const top = e.currentTarget.scrollTop;
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const i = Math.min(options.length - 1, Math.max(0, Math.round(top / ITEM_H)));
      if (options[i] !== value) onChange(options[i]);
    }, 120);
  }

  function pick(i) {
    onChange(options[i]);
    ref.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
  }

  return (
    <div
      ref={ref}
      className="wheel-col"
      onScroll={handleScroll}
      style={{ height: ITEM_H * VISIBLE, overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      <div style={{ height: PAD }} />
      {options.map((o, i) => (
        <div
          key={o}
          onClick={() => pick(i)}
          style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            scrollSnapAlign: 'center', fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
            fontSize: o === value ? 19 : 15, fontWeight: o === value ? 750 : 550,
            color: o === value ? '#f4f4f7' : '#6b6b7a', transition: 'font-size .12s,color .12s',
          }}
        >
          {format(o)}
        </div>
      ))}
      <div style={{ height: PAD }} />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Every minute, not a coarser 5- or 15-minute step — scrolling one more
// notch is cheap, and rounding away exact times (7:03, 8:47) the student
// actually wants isn't worth saving a handful of extra rows.
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// A rolling hour/minute picker (scroll to dial in a time, no typing) in
// place of the native <input type="time">, which some mobile browsers
// render as a plain text field with no working picker at all.
export default function WheelTimePicker({ value, onChange }) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  const hour = HOURS.includes(h) ? h : 0;
  const minute = MINUTES.includes(m) ? m : 0;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 6px' }}>
      <div style={{ position: 'absolute', top: PAD, left: 6, right: 6, height: ITEM_H, borderRadius: 10, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', pointerEvents: 'none' }} />
      <WheelColumn options={HOURS} value={hour} onChange={(nh) => onChange(`${fmt2(nh)}:${fmt2(minute)}`)} />
      <div style={{ fontSize: 17, fontWeight: 750, color: '#f4f4f7', padding: '0 1px' }}>:</div>
      <WheelColumn options={MINUTES} value={minute} onChange={(nm) => onChange(`${fmt2(hour)}:${fmt2(nm)}`)} />
    </div>
  );
}
