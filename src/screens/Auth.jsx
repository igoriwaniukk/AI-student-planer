import { useEffect, useState } from 'react';
import { useLang } from '../lib/useLang';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

// Shown instead of onboarding/the app whenever real accounts are configured
// (see supabaseClient.js) and no one is signed in yet. Google/Apple redirect
// away to that provider's own consent screen and back — Supabase's SDK
// picks the resulting session up automatically (see useAuth.js), nothing
// else to do here beyond starting that redirect and surfacing an error if
// it couldn't even begin (e.g. the provider isn't enabled yet in Supabase).
export default function Auth({ signUp, signIn, signInWithGoogle, signInWithApple, resetPassword, verifyEmailCode, resendEmailCode }) {
  const { t } = useLang();
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  function switchMode(next) {
    setMode(next);
    setError('');
    setInfo('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    if (mode === 'forgot') {
      const { error: err } = await resetPassword(email);
      setBusy(false);
      if (err) { setError(err.message); return; }
      setInfo(t('auth.resetLinkSent'));
      return;
    }
    if (mode === 'code') {
      const { error: err } = await verifyEmailCode(email, code);
      setBusy(false);
      if (err) setError(t('auth.codeWrong'));
      return;
    }
    const { data, error: err } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (err) {
      // Signed up earlier but never confirmed: send a fresh code and ask for it.
      if (mode === 'signIn' && /not confirmed/i.test(err.message) && verifyEmailCode) {
        resendEmailCode(email);
        setCode('');
        setMode('code');
        return;
      }
      setError(err.message);
      return;
    }
    // A new account waits for the code from the email (no session yet).
    if (mode === 'signUp' && !data?.session) {
      if (verifyEmailCode) { setCode(''); setMode('code'); } else setInfo(t('auth.checkEmail'));
    }
  }

  async function resend() {
    setError('');
    setInfo('');
    const { error: err } = await resendEmailCode(email);
    if (err) setError(err.message);
    else setInfo(t('auth.codeResent'));
  }

  async function oauth(startOAuth) {
    setError('');
    setInfo('');
    setBusy(true);
    const { error: err, cancelled } = await startOAuth();
    // Closing the iPhone app's sign-in sheet just brings the buttons back.
    if (err || cancelled) setBusy(false);
    if (err) setError(err.message);
  }

  // While waiting for the code: if the student tapped the link in the email
  // instead (it opens Safari), the account is confirmed — so coming back to
  // the app signs them in with what they just typed.
  useEffect(() => {
    if (mode !== 'code' || !password) return undefined;
    const tryAgain = () => {
      if (document.visibilityState !== 'visible') return;
      signIn(email, password).catch(() => {});
    };
    document.addEventListener('visibilitychange', tryAgain);
    window.addEventListener('focus', tryAgain);
    return () => {
      document.removeEventListener('visibilitychange', tryAgain);
      window.removeEventListener('focus', tryAgain);
    };
  }, [mode, email, password, signIn]);

  if (mode === 'code') {
    return (
      <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ fontSize: 40 }}>📬</div>
        <div style={{ fontSize: 26, fontWeight: 750, marginTop: 10 }}>{t('auth.codeTitle')}</div>
        <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8, lineHeight: 1.45 }}>{t('auth.codeSubtitle', { email })}</div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }} onSubmit={submit}>
          <input
            value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="123456" inputMode="numeric" autoComplete="one-time-code" required autoFocus aria-label={t('auth.codeTitle')}
            style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, letterSpacing: '.35em' }}
          />
          {error && <div style={{ fontSize: 12.5, color: '#ff8a5c', lineHeight: 1.4 }}>{error}</div>}
          {info && <div style={{ fontSize: 12.5, color: '#5fdd9b', lineHeight: 1.4 }}>{info}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy || code.length < 6}>{busy ? t('auth.working') : t('auth.codeConfirm')}</button>
        </form>
        <div onClick={resend} style={{ marginTop: 18, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('auth.codeResend')}</div>
        <div onClick={() => switchMode('signIn')} style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#8a8a99', cursor: 'pointer' }}>{t('auth.backToSignIn')}</div>
      </div>
    );
  }

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 750 }}>
        {mode === 'signIn' ? t('auth.signInTitle') : mode === 'signUp' ? t('auth.signUpTitle') : t('auth.forgotTitle')}
      </div>
      <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>{mode === 'forgot' ? t('auth.forgotSubtitle') : t('auth.subtitle')}</div>

      {mode !== 'forgot' && (
        <>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button" className="btn" disabled={busy} onClick={() => oauth(signInWithGoogle)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <GoogleIcon /> {t('auth.continueWithGoogle')}
            </button>
            <button
              type="button" className="btn" disabled={busy} onClick={() => oauth(signInWithApple)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14.5 }}
            >
               {t('auth.continueWithApple')}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
            <span style={{ fontSize: 11.5, color: '#6f6f7d' }}>{t('auth.or')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          </div>
        </>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: mode === 'forgot' ? 20 : 0 }} onSubmit={submit}>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')} autoComplete="email" required autoFocus
        />
        {mode !== 'forgot' && (
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')} autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            minLength={6} required
          />
        )}
        {mode === 'signIn' && (
          <div onClick={() => switchMode('forgot')} style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>
            {t('auth.forgotPassword')}
          </div>
        )}
        {error && <div style={{ fontSize: 12.5, color: '#ff8a5c', lineHeight: 1.4 }}>{error}</div>}
        {info && <div style={{ fontSize: 12.5, color: '#5fdd9b', lineHeight: 1.4 }}>{info}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('auth.working') : mode === 'signIn' ? t('auth.signIn') : mode === 'signUp' ? t('auth.signUp') : t('auth.sendResetLink')}
        </button>
      </form>

      {mode === 'forgot' ? (
        <div onClick={() => switchMode('signIn')} style={{ marginTop: 18, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>
          {t('auth.backToSignIn')}
        </div>
      ) : (
        <div
          onClick={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          style={{ marginTop: 18, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}
        >
          {mode === 'signIn' ? t('auth.needAccount') : t('auth.haveAccount')}
        </div>
      )}
    </div>
  );
}

// Shown instead of the normal signed-in app whenever useAuth reports
// passwordRecovery (the student followed the reset-password email's link,
// which signs them into a real but temporary session meant only for
// setting a new password) — see useAuth.js's PASSWORD_RECOVERY handling.
export function NewPasswordScreen({ updatePassword, onDone }) {
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setInfo(t('auth.passwordUpdated'));
  }

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 750 }}>{t('auth.newPasswordTitle')}</div>
      <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>{t('auth.newPasswordSubtitle')}</div>

      {info ? (
        <>
          <div style={{ fontSize: 12.5, color: '#5fdd9b', lineHeight: 1.4, marginTop: 20 }}>{info}</div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onDone}>{t('auth.signIn')}</button>
        </>
      ) : (
        <form style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }} onSubmit={submit}>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.newPasswordPlaceholder')} autoComplete="new-password" minLength={6} required autoFocus
          />
          {error && <div style={{ fontSize: 12.5, color: '#ff8a5c', lineHeight: 1.4 }}>{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('auth.working') : t('auth.savePassword')}</button>
        </form>
      )}
    </div>
  );
}
