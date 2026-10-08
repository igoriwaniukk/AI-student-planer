import { useState } from 'react';
import { RECUR_DAYS } from '../lib/plannerData';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { Chip } from './ui';
import WheelTimePicker from './WheelTimePicker';

const inputStyle = { boxSizing: 'border-box', width: '100%', height: 50, borderRadius: 15, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', padding: '0 15px', fontSize: 15, color: '#f4f4f7', fontFamily: 'inherit' };
const label = { fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' };
const WEEKDAYS = RECUR_DAYS.slice(0, 5);

// A weekly activity's name, days (several at once — "School, Mon–Fri") and
// time. Adding (QuickAddSheet) and editing one line of an activity (Plans)
// both use it; onSubmit gets { name, days, start, end }.
export default function ActivityForm({ initial, submitLabel, onSubmit, onDelete }) {
  const { t } = useLang();
  const [name, setName] = useState(initial?.name || '');
  const [days, setDays] = useState(initial?.days || []);
  const [start, setStart] = useState(initial?.start || '18:00');
  const [end, setEnd] = useState(initial?.end || '19:00');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ready = !!name.trim() && days.length > 0;
  const toggle = (d) => setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : list.concat(d)));
  const weekdaysOnly = days.length === WEEKDAYS.length && WEEKDAYS.every((d) => days.includes(d));

  return (
    <>
      <div style={{ ...label, margin: '24px 0 9px' }}>{t('quickAdd.nameLabel')}</div>
      <input placeholder={t('profile.activityName')} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus={!initial} />
      {!initial && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
          {t('quickAdd.activityExamples').split('|').map((ex) => (
            <span key={ex} onClick={() => setName(ex)} style={{ fontSize: 12, fontWeight: 650, padding: '6px 11px', borderRadius: 999, background: 'rgba(46,230,197,.12)', color: '#8ff0de', cursor: 'pointer' }}>{ex}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 9px' }}>
        <div style={label}>{t('quickAdd.daysLabel')}</div>
        <span onClick={() => setDays(weekdaysOnly ? [] : WEEKDAYS.slice())} style={{ fontSize: 12, fontWeight: 700, color: weekdaysOnly ? '#8ff0de' : '#a58cff', cursor: 'pointer' }}>{t('quickAdd.weekdays')}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {RECUR_DAYS.map((d) => <Chip key={d} label={(t(DAY_KEY[d]) || d).slice(0, 3)} active={days.includes(d)} onClick={() => toggle(d)} />)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...label, marginBottom: 8, textAlign: 'center' }}>{t('quickAdd.start')}</div>
          <WheelTimePicker value={start} onChange={setStart} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...label, marginBottom: 8, textAlign: 'center' }}>{t('quickAdd.end')}</div>
          <WheelTimePicker value={end} onChange={setEnd} />
        </div>
      </div>

      <div
        onClick={() => ready && onSubmit({ name: name.trim(), days, start, end })}
        style={{ marginTop: 26, height: 54, borderRadius: 16, background: ready ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 750, color: ready ? '#fff' : '#6b6b7a', cursor: ready ? 'pointer' : 'not-allowed', boxShadow: ready ? '0 12px 28px rgba(109,77,255,.35)' : 'none' }}
      >
        {submitLabel}
      </div>
      {onDelete && (
        <div
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          style={{ marginTop: 12, height: 50, borderRadius: 16, border: '1px solid rgba(229,72,77,.45)', background: confirmDelete ? 'rgba(229,72,77,.16)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 700, color: '#ff8a8e', cursor: 'pointer' }}
        >
          {confirmDelete ? t('plans.confirmDelete') : t('plans.delete')}
        </div>
      )}
    </>
  );
}
