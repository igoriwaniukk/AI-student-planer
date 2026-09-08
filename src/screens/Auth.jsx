import { useState } from 'react';
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
export default function Auth({ signUp, signIn, signInWithGoogle, signInWithApple }) {
  const { t } = useLang();
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    const { error: err } = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (mode === 'signUp') setInfo(t('auth.checkEmail'));
  }

  async function oauth(startOAuth) {
    setError('');
    setInfo('');
    setBusy(true);
    const { error: err } = await startOAuth();
    if (err) {
      setBusy(false);
      setError(err.message);
    }
  }

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 750 }}>{mode === 'signIn' ? t('auth.signInTitle') : t('auth.signUpTitle')}</div>
      <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>{t('auth.subtitle')}</div>

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

      <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={submit}>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')} autoComplete="email" required autoFocus
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder')} autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          minLength={6} required
        />
        {error && <div style={{ fontSize: 12.5, color: '#ff8a5c', lineHeight: 1.4 }}>{error}</div>}
        {info && <div style={{ fontSize: 12.5, color: '#5fdd9b', lineHeight: 1.4 }}>{info}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t('auth.working') : mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
        </button>
      </form>

      <div
        onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(''); setInfo(''); }}
        style={{ marginTop: 18, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}
      >
        {mode === 'signIn' ? t('auth.needAccount') : t('auth.haveAccount')}
      </div>
    </div>
  );
}
