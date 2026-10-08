import { useState } from 'react';
import { saveActivityLine } from '../lib/plansView';
import { useLang } from '../lib/useLang';
import { PugLive } from './PugMascot';
import { ExamIcon, WeeklyIcon } from './planIcons';
import ActivityForm from './ActivityForm';

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
export default function QuickAddSheet({ open, onClose, onAddExam, recurringActivities, setRecurringActivities, initialMode = 'menu' }) {
  const { t } = useLang();
  const [mode, setMode] = useState(initialMode);

  if (!open) return null;

  function close() {
    setMode('menu');
    onClose();
  }

  // One entry per ticked day (see saveActivityLine).
  function addActivity(fields) {
    setRecurringActivities(saveActivityLine(recurringActivities, fields));
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
              <PugLive size={52} style={{ boxShadow: '0 0 0 2.5px #8b6dff', flex: 'none' }} />
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

            <ActivityForm submitLabel={t('profile.addActivity')} onSubmit={addActivity} />
          </>
        )}
      </div>
    </div>
  );
}
