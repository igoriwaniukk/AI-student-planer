import { useState } from 'react';
import { RECUR_DAYS } from '../lib/plannerData';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { BottomSheet, Chip } from './ui';

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
  const [dur, setDur] = useState(60);

  if (!open) return null;

  function close() {
    setMode('menu');
    setName('');
    setDay(RECUR_DAYS[0]);
    setStart('18:00');
    setDur(60);
    onClose();
  }

  function addActivity() {
    if (!name.trim()) return;
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
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="number" min={15} step={5} value={dur} onChange={(e) => setDur(Math.max(15, Number(e.target.value) || 60))} style={{ ...inputStyle, width: 88, textAlign: 'center' }} />
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
