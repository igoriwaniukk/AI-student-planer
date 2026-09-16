import { useState } from 'react';
import { version as APP_VERSION } from '../../package.json';
import { upcomingExams, computeStreak } from '../lib/plannerLogic';
import { useLang } from '../lib/useLang';
import { useCustomReminders, resetAppData } from '../lib/store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { BackButton, Chip, BottomSheet } from '../components/ui';
import AmbientGlow from '../components/AmbientGlow';

function SectionCard({ title, children }) {
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function InfoSheet({ title, text, onClose }) {
  if (!text) return null;
  return (
    <BottomSheet>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{title}</div>
        <span onClick={onClose} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c9c9d6', marginTop: 16, whiteSpace: 'pre-line' }}>{text}</div>
    </BottomSheet>
  );
}

export default function Settings({ planner, studyHistory, onSignOut, onDeleteAccount, syncError }) {
  const { t, lang, setLang } = useLang();
  const [reminders] = useCustomReminders();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [infoSheet, setInfoSheet] = useState(null);
  const streak = computeStreak(studyHistory || {});
  const hasUpcomingExam = upcomingExams(planner.state).some((e) => e.daysUntil >= 0 && e.daysUntil <= 14);
  const { pushStatus, togglePush } = usePushNotifications({ streak, hasUpcomingExam, reminders: reminders.map((r) => r.text), lang });

  const pushNote = {
    unsupported: t('notif.pushUnsupported'),
    denied: t('notif.pushDenied'),
    error: t('notif.pushError'),
    subscribed: t('notif.pushOnNote'),
    idle: t('notif.pushOffNote'),
  }[pushStatus];

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError('');
    const { error } = await onDeleteAccount();
    if (error) {
      setDeleting(false);
      setDeleteError(t('profile.deleteAccountError'));
    }
  }

  return (
    <>
    <AmbientGlow />
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 40px', position: 'relative', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => planner.go('profile')} />
        <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-.01em' }}>{t('settings.title')}</div>
      </div>

      <SectionCard title={t('profile.settings')}>
        <div
          onClick={pushStatus === 'unsupported' ? undefined : togglePush}
          style={{ padding: '12px 14px', borderRadius: 15, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', cursor: pushStatus === 'unsupported' ? 'default' : 'pointer' }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c9baff' }}>
            🔔 {pushStatus === 'subscribed' ? t('notif.disablePush') : t('notif.enablePush')}
          </div>
          <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{pushNote}</div>
        </div>

        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 15, background: 'rgba(255,90,90,.06)', border: '1px solid rgba(255,90,90,.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ff9a9a' }}>🗑 {t('profile.resetData')}</div>
          <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{t('profile.resetDataDesc')}</div>
          {confirmingReset ? (
            <div style={{ marginTop: 11 }}>
              <div style={{ fontSize: 11.5, color: '#ff9a9a', marginBottom: 9 }}>{t('profile.resetConfirm')}</div>
              <div style={{ display: 'flex', gap: 9 }}>
                <div onClick={() => setConfirmingReset(false)} style={{ flex: 1, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}>{t('home.cancel')}</div>
                <div onClick={resetAppData} style={{ flex: 1.3, height: 40, borderRadius: 12, background: '#ff5a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{t('profile.resetConfirmBtn')}</div>
              </div>
            </div>
          ) : (
            <div onClick={() => setConfirmingReset(true)} style={{ marginTop: 11, height: 38, borderRadius: 12, background: 'rgba(255,90,90,.14)', border: '1px solid rgba(255,90,90,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, color: '#ff9a9a', cursor: 'pointer' }}>{t('profile.resetData')}</div>
          )}
        </div>

        {onDeleteAccount && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 15, background: 'rgba(255,90,90,.06)', border: '1px solid rgba(255,90,90,.25)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ff9a9a' }}>⚠️ {t('profile.deleteAccount')}</div>
            <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{t('profile.deleteAccountDesc')}</div>
            {deleteError && <div style={{ fontSize: 11.5, color: '#ff9a9a', marginTop: 9 }}>{deleteError}</div>}
            {confirmingDelete ? (
              <div style={{ marginTop: 11 }}>
                <div style={{ fontSize: 11.5, color: '#ff9a9a', marginBottom: 9 }}>{t('profile.deleteAccountConfirm')}</div>
                <div style={{ display: 'flex', gap: 9 }}>
                  <div onClick={() => { setConfirmingDelete(false); setDeleteError(''); }} style={{ flex: 1, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.5 : 1 }}>{t('home.cancel')}</div>
                  <div onClick={deleting ? undefined : confirmDelete} style={{ flex: 1.3, height: 40, borderRadius: 12, background: '#ff5a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? t('profile.deleteAccountDeleting') : t('profile.deleteAccountConfirmBtn')}
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={() => setConfirmingDelete(true)} style={{ marginTop: 11, height: 38, borderRadius: 12, background: 'rgba(255,90,90,.14)', border: '1px solid rgba(255,90,90,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, color: '#ff9a9a', cursor: 'pointer' }}>{t('profile.deleteAccount')}</div>
            )}
          </div>
        )}

        {syncError && (
          <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 15, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f7c46c' }}>⚠️ {t('profile.syncErrorTitle')}</div>
            <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{t('profile.syncErrorDesc')}</div>
          </div>
        )}

        {onSignOut && (
          <div onClick={onSignOut} style={{ marginTop: 12, height: 44, borderRadius: 15, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9c9d6', cursor: 'pointer' }}>{t('auth.signOut')}</div>
        )}
      </SectionCard>

      <SectionCard title={t('profile.language')}>
        <div style={{ display: 'flex', gap: 9 }}>
          <Chip label={t('profile.polish')} active={lang === 'pl'} onClick={() => setLang('pl')} style={{ flex: 1, textAlign: 'center' }} />
          <Chip label={t('profile.english')} active={lang === 'en'} onClick={() => setLang('en')} style={{ flex: 1, textAlign: 'center' }} />
        </div>
      </SectionCard>

      <SectionCard title={t('settings.about')}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('profile.appName')}</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>{t('profile.appDesc')}</div>
        <div style={{ fontSize: 11.5, color: '#6b6b7a', marginTop: 10 }}>{t('settings.version', { v: APP_VERSION })}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '14px 0' }} />
        <div onClick={() => setInfoSheet('privacy')} style={{ padding: '11px 0', fontSize: 13, fontWeight: 650, color: '#c9c9d6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('settings.privacyPolicy')} <span style={{ color: '#6b6b7a' }}>›</span>
        </div>
        <div onClick={() => setInfoSheet('terms')} style={{ padding: '11px 0', fontSize: 13, fontWeight: 650, color: '#c9c9d6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('settings.termsOfService')} <span style={{ color: '#6b6b7a' }}>›</span>
        </div>
      </SectionCard>

      <InfoSheet title={t('settings.privacyPolicy')} text={infoSheet === 'privacy' ? t('settings.privacyPolicyText') : null} onClose={() => setInfoSheet(null)} />
      <InfoSheet title={t('settings.termsOfService')} text={infoSheet === 'terms' ? t('settings.termsText') : null} onClose={() => setInfoSheet(null)} />
    </div>
    </>
  );
}
