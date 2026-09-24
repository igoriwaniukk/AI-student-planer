import { useState } from 'react';
import { RECUR_DAYS } from '../lib/plannerData';
import { timeStrToMinutes } from '../lib/plannerLogic';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { Chip } from './ui';
import WheelTimePicker from './WheelTimePicker';

const inputStyle = { boxSizing: 'border-box', width: '100%', height: 50, borderRadius: 15, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', padding: '0 15px', fontSize: 15, color: '#f4f4f7', fontFamily: 'inherit' };

function ExamIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="18" rx="4" stroke="#f5a524" strokeWidth="2" />
      <path d="M4 11.5h20M9.5 3.5v4.5M18.5 3.5v4.5" stroke="#f5a524" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 17.5l2.2 2.2 4.3-4.6" stroke="#f5a524" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WeeklyIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="6" width="20" height="18" rx="4" stroke="#2ee6c5" strokeWidth="2" />
      <path d="M4 11.5h20M9.5 3.5v4.5M18.5 3.5v4.5" stroke="#2ee6c5" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.6 16.3a3.8 3.8 0 00-6.6-1.3M10.4 19a3.8 3.8 0 006.6 1.3" stroke="#2ee6c5" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 13.4l.4 1.9 1.9-.4M17.4 21.9l-.4-1.9-1.9.4" stroke="#2ee6c5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tile({ icon, title, desc, examples, accent, rgb, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden', padding: 20, borderRadius: 24, cursor: 'pointer',
        background: `linear-gradient(160deg,rgba(${rgb},.2),rgba(${rgb},.04))`, border: `1px solid rgba(${rgb},.35)`,
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 17, background: `rgba(${rgb},.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ position: 'absolute', right: 18, top: 20, width: 38, height: 38, borderRadius: '50%', background: accent, color: '#0b0b10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800 }}>›</div>
      <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.01em', marginTop: 14 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: '#b9b9c6', marginTop: 6, lineHeight: 1.45 }}>{desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
        {examples.map((ex) => (
          <span key={ex} style={{ fontSize: 12, fontWeight: 650, padding: '5px 10px', borderRadius: 999, background: `rgba(${rgb},.14)`, color: accent }}>{ex}</span>
        ))}
      </div>
    </div>
  );
}

// The center FAB's quick-add screen — the one place a student can add either
// kind of thing that shows up in their week: an exam date (routes into the
// existing Deadline flow) or a recurring weekly activity (added right here,
// since it's just a few fields). Full screen rather than a bottom sheet.
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

  const roundBtn = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', cursor: 'pointer', flex: 'none' };

  return (
    <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 85, background: '#08080c', overflowY: 'auto', animation: 'quickAddIn .26s ease both' }}>
      <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -170, left: -130, background: '#7f5cff', filter: 'blur(90px)', opacity: 0.3, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', padding: '24px 22px 40px' }}>
        {mode === 'menu' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div onClick={close} style={roundBtn}>✕</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 8 }}>
              <img src="/pug-avatar.webp?v=2" alt="" width={46} height={46} style={{ borderRadius: '50%', boxShadow: '0 0 0 2.5px #8b6dff', flex: 'none' }} />
              <div style={{ fontSize: 13, fontWeight: 650, color: '#c9baff', background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.35)', padding: '8px 12px', borderRadius: '14px 14px 14px 4px', animation: 'pugBubbleIn .3s cubic-bezier(.34,1.56,.64,1) .1s both' }}>
                {t('quickAdd.pugAsk')}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 20 }}>{t('quickAdd.heroTitle')}</div>
            <div style={{ fontSize: 14, color: '#8a8a99', marginTop: 6, lineHeight: 1.45 }}>{t('quickAdd.heroSub')}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
              <Tile
                icon={<ExamIcon />} title={t('quickAdd.examTile')} desc={t('quickAdd.examDesc')}
                examples={t('quickAdd.examExamples').split('|')} accent="#f5a524" rgb="245,165,36"
                onClick={() => { onAddExam(); close(); }}
              />
              <Tile
                icon={<WeeklyIcon />} title={t('quickAdd.activityTitle')} desc={t('quickAdd.activityDesc')}
                examples={t('quickAdd.activityExamples').split('|')} accent="#2ee6c5" rgb="46,230,197"
                onClick={() => setMode('activity')}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div onClick={() => setMode('menu')} style={{ ...roundBtn, fontSize: 20, color: '#a58cff' }}>‹</div>
              <div onClick={close} style={roundBtn}>✕</div>
            </div>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(46,230,197,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
              <WeeklyIcon size={32} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('quickAdd.activityTitle')}</div>
            <div style={{ fontSize: 14, color: '#8a8a99', marginTop: 6, lineHeight: 1.45 }}>{t('quickAdd.activityDesc')}</div>

            <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '24px 0 9px' }}>{t('quickAdd.nameLabel')}</div>
            <input placeholder={t('profile.activityName')} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} autoFocus />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
              {t('quickAdd.activityExamples').split('|').map((ex) => (
                <span key={ex} onClick={() => setName(ex)} style={{ fontSize: 12, fontWeight: 650, padding: '6px 11px', borderRadius: 999, background: 'rgba(46,230,197,.12)', color: '#8ff0de', cursor: 'pointer' }}>{ex}</span>
              ))}
            </div>

            <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '22px 0 9px' }}>{t('quickAdd.dayLabel')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RECUR_DAYS.map((d) => <Chip key={d} label={(t(DAY_KEY[d]) || d).slice(0, 3)} active={day === d} onClick={() => setDay(d)} />)}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 8, textAlign: 'center' }}>{t('quickAdd.start')}</div>
                <WheelTimePicker value={start} onChange={setStart} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 8, textAlign: 'center' }}>{t('quickAdd.end')}</div>
                <WheelTimePicker value={end} onChange={setEnd} />
              </div>
            </div>

            <div
              onClick={addActivity}
              style={{ marginTop: 26, height: 54, borderRadius: 16, background: name.trim() ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 750, color: name.trim() ? '#fff' : '#6b6b7a', cursor: name.trim() ? 'pointer' : 'not-allowed', boxShadow: name.trim() ? '0 12px 28px rgba(109,77,255,.35)' : 'none' }}
            >
              {t('profile.addActivity')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
