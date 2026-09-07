import { useState } from 'react';
import { useLang } from '../lib/useLang';

// Shown instead of onboarding/the app whenever real accounts are configured
// (see supabaseClient.js) and no one is signed in yet — email/password is
// the simplest option that works the same on every platform, no extra
// provider setup required.
export default function Auth({ signUp, signIn }) {
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

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 750 }}>{mode === 'signIn' ? t('auth.signInTitle') : t('auth.signUpTitle')}</div>
      <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>{t('auth.subtitle')}</div>

      <form style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={submit}>
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
