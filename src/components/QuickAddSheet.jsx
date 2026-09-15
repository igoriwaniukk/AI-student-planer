import { useState } from 'react';
import { RECUR_DAYS } from '../lib/plannerData';
import { timeStrToMinutes } from '../lib/plannerLogic';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { BottomSheet, Chip } from './ui';
import WheelTimePicker from './WheelTimePicker';

const inputStyle = { boxSizing: 'border-box', width: '100%', height: 44, borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 13px', fontSize: 13.5, color: '#f4f4f7', fontFamily: 'inherit' };

const optionStyle = {
  display: 'flex', alignItems: 'center', gap: 13, padding: 15, borderRadius: 16,
  background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer',
};

// The center FAB's quick-add menu — the one place a student can add either
// kind of thing that shows up in their week: an exam date (routes into the
// existing Deadline flow) or a recurring weekly activity (added inline here,
// since it's just a few fields). Replaces the recurring-activities editor
// that used to live on the Profile screen.
export default function QuickAddSheet({ open, onClose, onAddExam, recurringActivities, setRecurringActivities }) {
  const { t } = useLang();
  const [mode, setMode] = useState('menu');
  const [name, setName] = useState('');
  const [day, setDay] = useState(RECUR_DAYS[0]);
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('19:00');

  if (!open) return null;

  function close() {
    setMode('menu');
    setName('');
    setDay(RECUR_DAYS[0]);
    setStart('18:00');
    setEnd('19:00');
    onClose();
  }

  function addActivity() {
    if (!name.trim()) return;
    // The picker only lets an activity start and end on the same day, so a
    // non-positive gap means the student dragged the end time before (or
    // onto) the start — treat it as the shortest valid slot rather than
    // silently saving a negative/zero duration.
    const dur = Math.max(15, timeStrToMinutes(end) - timeStrToMinutes(start));
    setRecurringActivities((recurringActivities || []).concat({ id: Date.now(), name: name.trim(), day, start, dur }));
    close();
  }

  return (
    <BottomSheet>
      {mode === 'menu' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('quickAdd.title')}</div>
            <span onClick={close} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18, paddingBottom: 8 }}>
            <div onClick={() => { onAddExam(); close(); }} style={optionStyle}>
              <span style={{ fontSize: 20 }}>📅</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t('quickAdd.examTitle')}</div>
                <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 2 }}>{t('quickAdd.examSub')}</div>
              </div>
            </div>
            <div onClick={() => setMode('activity')} style={optionStyle}>
              <span style={{ fontSize: 20 }}>🔁</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t('quickAdd.activityTitle')}</div>
                <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 2 }}>{t('quickAdd.activitySub')}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span onClick={() => setMode('menu')} style={{ fontSize: 15, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>‹</span>
            <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em', flex: 1 }}>{t('quickAdd.activityTitle')}</div>
            <span onClick={close} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
            <input placeholder={t('profile.activityName')} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RECUR_DAYS.map((d) => <Chip key={d} label={(t(DAY_KEY[d]) || d).slice(0, 3)} active={day === d} onClick={() => setDay(d)} />)}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('quickAdd.start')}</div>
                <WheelTimePicker value={start} onChange={setStart} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('quickAdd.end')}</div>
                <WheelTimePicker value={end} onChange={setEnd} />
              </div>
            </div>
            <div
              onClick={addActivity}
              style={{ marginTop: 4, height: 44, borderRadius: 13, background: name.trim() ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: name.trim() ? '#fff' : '#6b6b7a', cursor: name.trim() ? 'pointer' : 'not-allowed' }}
            >
              {t('profile.addActivity')}
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
