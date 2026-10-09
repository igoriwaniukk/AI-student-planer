import { useState } from 'react';
import { version as APP_VERSION } from '../../package.json';
import { upcomingExams, computeStreak, planFor } from '../lib/plannerLogic';
import { NUM_TODAY } from '../lib/plannerData';
import { LANGS } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { useCustomReminders, resetAppData } from '../lib/store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { BackButton, BottomSheet, Toggle } from '../components/ui';

// Each language named in itself, as phone settings do.
const LANG_NAME = { pl: 'Polski', en: 'English' };

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: '#7a7a8a', margin: '24px 6px 8px', textTransform: 'uppercase' }}>{children}</div>;
}

function Group({ children }) {
  return <div style={{ borderRadius: 18, background: '#131119', border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>{children}</div>;
}

// One settings row: a title, an optional value or control on the right, and
// › when it opens something. `danger` rows are red text, nothing louder.
function Row({ title, sub, value, right, onClick, nav, danger, first }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', minHeight: 52, cursor: onClick ? 'pointer' : 'default', borderTop: first ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: danger ? '#ff6b70' : '#f4f4f7' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      {value != null && <div style={{ fontSize: 14, color: '#8a8a99' }}>{value}</div>}
      {right}
      {nav && <span style={{ color: '#55556a', fontSize: 17 }}>›</span>}
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

// "Are you sure?" for the destructive account actions.
function ConfirmSheet({ title, text, confirmLabel, busy, error, onConfirm, onCancel }) {
  const { t } = useLang();
  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: '#a3a3b3', marginTop: 8, lineHeight: 1.5 }}>{text}</div>
      {error && <div style={{ fontSize: 12.5, color: '#ff9a9a', marginTop: 10 }}>{error}</div>}
      <div onClick={busy ? undefined : onConfirm} style={{ marginTop: 18, height: 50, borderRadius: 15, background: '#e5484d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>{confirmLabel}</div>
      <div onClick={busy ? undefined : onCancel} style={{ marginTop: 10, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 650, color: '#c9c9d6', cursor: 'pointer' }}>{t('home.cancel')}</div>
    </BottomSheet>
  );
}

function LanguagePage({ onBack }) {
  const { t, lang, setLang } = useLang();
  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 18px 130px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={onBack} />
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{t('settings.language')}</div>
      </div>
      <Label>{t('settings.appLanguage')}</Label>
      <Group>
        {LANGS.map((code, i) => (
          <Row
            key={code} first={i === 0} title={LANG_NAME[code] || code} onClick={() => setLang(code)}
            right={lang === code ? <span style={{ color: '#a58cff', fontSize: 18, fontWeight: 800 }}>✓</span> : null}
          />
        ))}
      </Group>
    </div>
  );
}

export default function Settings({ planner, studentName, profilePhoto, email, studyHistory, onSignOut, onDeleteAccount, syncError }) {
  const { t, lang } = useLang();
  const [reminders] = useCustomReminders();
  const [page, setPage] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [infoSheet, setInfoSheet] = useState(null);
  const streak = computeStreak(studyHistory || {});
  const hasUpcomingExam = upcomingExams(planner.state).some((e) => e.daysUntil >= 0 && e.daysUntil <= 14);
  const noPlanToday = !planFor(planner.state, NUM_TODAY);
  const { pushStatus, togglePush, native } = usePushNotifications({ streak, hasUpcomingExam, reminders: reminders.map((r) => r.text), lang, noPlanToday });
  const initials = (studentName || t('profile.you')).trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const pushNote = {
    unsupported: t('notif.pushUnsupported'),
    denied: t(native ? 'notif.appDenied' : 'notif.pushDenied'),
    error: t('notif.pushError'),
    subscribed: t(native ? 'notif.appOnNote' : 'notif.pushOnNote'),
    idle: t(native ? 'notif.appOffNote' : 'notif.pushOffNote'),
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

  if (page === 'language') return <LanguagePage onBack={() => setPage(null)} />;

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 18px 130px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => planner.go('profile')} />
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginTop: 16 }}>{t('settings.title')}</div>

      <div style={{ marginTop: 16, borderRadius: 20, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(160deg,rgba(139,109,255,.18),rgba(139,109,255,.04))', border: '1px solid rgba(139,109,255,.3)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', flex: 'none', background: profilePhoto ? `center/cover no-repeat url(${profilePhoto})` : 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>{!profilePhoto && initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 750 }}>{studentName || t('profile.you')}</div>
          <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email || t('settings.localAccount')}</div>
        </div>
      </div>

      <Label>{t('settings.preferences')}</Label>
      <Group>
        <Row
          first title={t('settings.reminders')} sub={pushNote}
          right={pushStatus === 'unsupported' ? null : <Toggle on={pushStatus === 'subscribed'} onClick={togglePush} />}
        />
        <Row title={t('settings.language')} value={LANG_NAME[lang] || lang} nav onClick={() => setPage('language')} />
      </Group>

      <Label>{t('settings.about')}</Label>
      <Group>
        <Row first title={t('settings.privacyPolicy')} nav onClick={() => setInfoSheet('privacy')} />
        <Row title={t('settings.termsOfService')} nav onClick={() => setInfoSheet('terms')} />
        <Row title={t('settings.versionLabel')} value={APP_VERSION} />
      </Group>

      <Label>{t('settings.account')}</Label>
      {syncError && (
        <div style={{ marginBottom: 10, padding: '12px 14px', borderRadius: 16, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f7c46c' }}>⚠️ {t('profile.syncErrorTitle')}</div>
          <div style={{ fontSize: 11.5, color: '#a3a3b3', marginTop: 4, lineHeight: 1.4 }}>{t('profile.syncErrorDesc')}</div>
        </div>
      )}
      <Group>
        {onSignOut && <Row first title={t('auth.signOut')} nav onClick={onSignOut} />}
        <Row first={!onSignOut} title={t('profile.resetData')} danger onClick={() => setConfirming('reset')} />
        {onDeleteAccount && <Row title={t('profile.deleteAccount')} danger onClick={() => { setDeleteError(''); setConfirming('delete'); }} />}
      </Group>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#55556a', marginTop: 22 }}>🐾 {t('profile.appName')} · {t('settings.version', { v: APP_VERSION })}</div>
    </div>

    <InfoSheet title={t('settings.privacyPolicy')} text={infoSheet === 'privacy' ? t('settings.privacyPolicyText') : null} onClose={() => setInfoSheet(null)} />
    <InfoSheet title={t('settings.termsOfService')} text={infoSheet === 'terms' ? t('settings.termsText') : null} onClose={() => setInfoSheet(null)} />
    {confirming === 'reset' && (
      <ConfirmSheet title={t('profile.resetData')} text={t('profile.resetDataDesc') + ' ' + t('profile.resetConfirm')} confirmLabel={t('profile.resetConfirmBtn')} onConfirm={resetAppData} onCancel={() => setConfirming(null)} />
    )}
    {confirming === 'delete' && (
      <ConfirmSheet
        title={t('profile.deleteAccount')} text={t('profile.deleteAccountDesc') + ' ' + t('profile.deleteAccountConfirm')}
        confirmLabel={deleting ? t('profile.deleteAccountDeleting') : t('profile.deleteAccountConfirmBtn')} busy={deleting} error={deleteError}
        onConfirm={confirmDelete} onCancel={() => setConfirming(null)}
      />
    )}
    </>
  );
}
