import { useLang } from '../lib/useLang';
import { WheelColumn, ITEM_H, PAD } from './WheelTimePicker';

const MONTH_NAMES = {
  pl: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}
function toISO(year, monthIdx, day) {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// A rolling Day / Month / Year picker (scroll to dial in a date, no typing)
// in place of the native <input type="date">, which some desktop browsers
// render as a plain text field the student has to type into rather than an
// actual picker. Every month (Jan-Dec) and a handful of years are always
// offered — unlike an earlier version of this component, which floored
// each column at minDate and, in doing so, cut the month wheel down to
// just whatever was left of the current year (e.g. only Sep-Dec), making
// it impossible to scroll a few months past a December without first
// jumping the year wheel by hand. Whether the picked date is actually in
// the future is validated by the caller (see Deadline.jsx's dateValid /
// "pick a future date" notice) instead of being fought here.
export default function WheelDatePicker({ value, onChange, minDate }) {
  const { lang } = useLang();
  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.en;
  const todayIso = new Date().toISOString().slice(0, 10);
  const base = value || minDate || todayIso;
  const [year, month1, day] = base.split('-').map(Number);
  const monthIdx = month1 - 1;
  const maxDay = daysInMonth(year, monthIdx);

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
  const MONTHS = Array.from({ length: 12 }, (_, i) => i);
  const startYear = Number(todayIso.slice(0, 4));
  const YEARS = [startYear, startYear + 1, startYear + 2, startYear + 3];

  function set(y, mIdx, d) {
    onChange(toISO(y, mIdx, Math.min(d, daysInMonth(y, mIdx))));
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 6px' }}>
      <div style={{ position: 'absolute', top: PAD, left: 6, right: 6, height: ITEM_H, borderRadius: 10, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', pointerEvents: 'none' }} />
      <WheelColumn options={DAYS} value={Math.min(day, maxDay)} onChange={(d) => set(year, monthIdx, d)} format={(n) => String(n).padStart(2, '0')} />
      <WheelColumn options={MONTHS} value={monthIdx} onChange={(m) => set(year, m, day)} format={(m) => monthNames[m]} />
      <WheelColumn options={YEARS} value={year} onChange={(y) => set(y, monthIdx, day)} format={(y) => String(y)} />
    </div>
  );
}
