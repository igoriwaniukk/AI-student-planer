import { useState } from 'react';
import { upcomingExams } from '../lib/plannerLogic';
import { useCustomReminders } from '../lib/store';
import { useLang } from '../lib/useLang';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { VALUE_KEY } from '../lib/i18n';

export default function NotificationBell({ state, streak = 0 }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [reminders, setReminders] = useCustomReminders();

  const examAlerts = upcomingExams(state)
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  const hasUpcomingExam = examAlerts.length > 0;
  const hasNew = hasUpcomingExam || reminders.length > 0;

  const { pushStatus, togglePush } = usePushNotifications({ streak, hasUpcomingExam, reminders: reminders.map((r) => r.text), lang });

  function addReminder() {
    const text = draft.trim();
    if (!text) return;
    setReminders((list) => list.concat({ id: Date.now() + '-' + Math.random().toString(36).slice(2), text }));
    setDraft('');
  }

  function removeReminder(id) {
    setReminders((list) => list.filter((r) => r.id !== id));
  }

  const pushNote = {
    unsupported: t('notif.pushUnsupported'),
    denied: t('notif.pushDenied'),
    error: t('notif.pushError'),
    subscribed: t('notif.pushOnNote'),
    idle: t('notif.pushOffNote'),
  }[pushStatus];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{ position: 'absolute', top: 20, right: 20, zIndex: 60, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <span style={{ display: 'inline-flex', transformOrigin: 'top center', animation: hasNew ? 'bellRing 4s ease-in-out infinite' : 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6.5a4 4 0 018 0v3l1.2 2H2.8L4 9.5v-3z" stroke="#c9c9d6" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6.5 13.4a1.6 1.6 0 003 0" stroke="#c9c9d6" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </span>
        {hasNew && <div style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#ff4d5e', border: '1.5px solid #08080c', animation: 'pulseGlow 1.8s ease-in-out infinite' }} />}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 74 }} />
          <div
            className="sc"
            style={{
              position: 'absolute', top: 64, right: 20, zIndex: 76, width: 300, maxHeight: '65%', overflowY: 'auto',
              padding: 16, borderRadius: 20, background: '#101018', border: '1px solid rgba(255,255,255,.12)',
              boxShadow: '0 16px 40px rgba(0,0,0,.5)', animation: 'fadeUp .22s ease both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('notif.title')}</div>
              <span onClick={() => setOpen(false)} style={{ fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('notif.close')}</span>
            </div>

            {examAlerts.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('notif.examSection')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {examAlerts.map((e) => (
                    <div key={e.id} style={{ padding: '12px 14px', borderRadius: 15, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.28)', display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span style={{ fontSize: 17 }}>⏰</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: e.color }}>{(t(VALUE_KEY[e.subject]) || e.subject).toUpperCase()}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{t(VALUE_KEY[e.title]) || e.title}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f5a524', flex: 'none' }}>{e.daysUntil === 1 ? t('cal.tomorrowPill') : t('cal.inDaysPill', { n: e.daysUntil })}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('notif.remindersSection')}</div>
            {reminders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {reminders.map((r) => (
                  <div key={r.id} style={{ padding: '12px 14px', borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ fontSize: 17 }}>📌</span>
                    <div style={{ flex: 1, fontSize: 13.5, fontWeight: 650 }}>{r.text}</div>
                    <span onClick={() => removeReminder(r.id)} style={{ fontSize: 12, fontWeight: 650, color: '#8a8a99', cursor: 'pointer', flex: 'none' }}>{t('dl.remove')}</span>
                  </div>
                ))}
              </div>
            ) : examAlerts.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('notif.empty')}</div>
            )}

            <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addReminder()}
                placeholder={t('notif.addPlaceholder')}
                style={{ flex: 1 }}
              />
              <div onClick={addReminder} style={{ width: 46, height: 46, flex: 'none', borderRadius: 13, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#c9baff', cursor: 'pointer' }}>+</div>
            </div>

            <div
              onClick={pushStatus === 'unsupported' ? undefined : togglePush}
              style={{ marginTop: 18, padding: '12px 14px', borderRadius: 15, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', cursor: pushStatus === 'unsupported' ? 'default' : 'pointer' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c9baff' }}>
                🔔 {pushStatus === 'subscribed' ? t('notif.disablePush') : t('notif.enablePush')}
              </div>
              <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{pushNote}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
