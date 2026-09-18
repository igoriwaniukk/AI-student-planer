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
// actual picker. minDate (ISO "YYYY-MM-DD") floors every column so a past
// date can't be dialed in — each column only offers options that keep the
// resulting date >= minDate.
export default function WheelDatePicker({ value, onChange, minDate }) {
  const { lang } = useLang();
  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.en;
  const todayIso = new Date().toISOString().slice(0, 10);
  const min = minDate || todayIso;
  const [minYear, minMonth1] = min.split('-').map(Number);
  const minDay = Number(min.split('-')[2]);

  const iso = value && value >= min ? value : min;
  const [year, month1, day] = iso.split('-').map(Number);
  const monthIdx = month1 - 1;

  const monthFloor = year === minYear ? minMonth1 - 1 : 0;
  const dayFloor = (year === minYear && monthIdx === minMonth1 - 1) ? minDay : 1;
  const maxDay = daysInMonth(year, monthIdx);

  const DAYS = Array.from({ length: Math.max(1, maxDay - dayFloor + 1) }, (_, i) => dayFloor + i);
  const MONTH_OPTIONS = Array.from({ length: 12 - monthFloor }, (_, i) => monthFloor + i);
  const YEARS = [minYear, minYear + 1, minYear + 2];

  function set(y, mIdx, d) {
    onChange(toISO(y, mIdx, Math.min(d, daysInMonth(y, mIdx))));
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 6px' }}>
      <div style={{ position: 'absolute', top: PAD, left: 6, right: 6, height: ITEM_H, borderRadius: 10, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', pointerEvents: 'none' }} />
      <WheelColumn options={DAYS} value={Math.min(Math.max(day, dayFloor), maxDay)} onChange={(d) => set(year, monthIdx, d)} format={(n) => String(n).padStart(2, '0')} />
      <WheelColumn options={MONTH_OPTIONS} value={monthIdx} onChange={(m) => set(year, m, day)} format={(m) => monthNames[m]} />
      <WheelColumn options={YEARS} value={year} onChange={(y) => set(y, monthIdx, day)} format={(y) => String(y)} />
    </div>
  );
}
