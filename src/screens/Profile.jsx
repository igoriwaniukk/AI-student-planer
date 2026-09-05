import { useState } from 'react';
import { pairVulcan, disconnectVulcan } from '../lib/vulcanClient';
import { triggerFocusShortcut } from '../lib/focusShortcut';
import { Toggle } from '../components/ui';

function VulcanCard({ vulcanSession, setVulcanSession }) {
  const [token, setToken] = useState('');
  const [symbol, setSymbol] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (vulcanSession) {
    return (
      <div style={{ marginTop: 24, padding: 16, borderRadius: 20, background: 'rgba(53,208,127,.06)', border: '1px solid rgba(53,208,127,.22)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#5fdd9b' }}>Połączono z dziennikiem Vulcan</div>
        <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 6 }}>{vulcanSession.studentName}{vulcanSession.schoolName ? ' · ' + vulcanSession.schoolName : ''}</div>
        {vulcanSession.multipleStudents && (
          <div style={{ fontSize: 11.5, color: '#f7c46c', marginTop: 8, lineHeight: 1.45 }}>To konto ma więcej niż jednego ucznia — na razie pokazujemy dane pierwszego z nich.</div>
        )}
        <div
          onClick={async () => { await disconnectVulcan(vulcanSession.sessionId).catch(() => {}); setVulcanSession(null); }}
          style={{ marginTop: 14, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}
        >
          Rozłącz
        </div>
      </div>
    );
  }

  async function connect() {
    if (!token.trim() || !symbol.trim() || !pin.trim()) { setError('Podaj token, symbol i PIN.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await pairVulcan({ token: token.trim(), symbol: symbol.trim(), pin: pin.trim() });
      setVulcanSession(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>Połącz z dziennikiem (Vulcan / UONET+)</div>
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 6, lineHeight: 1.45 }}>
        W dzienniku UONET+ otwórz: Konto ucznia → Zarejestruj urządzenie mobilne. Pojawi się kod QR z tokenem, symbolem i PIN-em — są ważne tylko kilka minut.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" style={{ fontFamily: 'inherit' }} />
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" style={{ fontFamily: 'inherit' }} />
        <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" style={{ fontFamily: 'inherit' }} />
      </div>
      {error && <div style={{ fontSize: 12, color: '#f5a524', marginTop: 10, lineHeight: 1.45 }}>{error}</div>}
      <div
        onClick={loading ? undefined : connect}
        style={{ marginTop: 14, height: 46, borderRadius: 14, background: loading ? 'rgba(255,255,255,.06)' : 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 700, color: loading ? '#6b6b7a' : '#fff', cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? 'Łączenie…' : 'Połącz'}
      </div>
      <div style={{ fontSize: 11, color: '#7a7a8a', marginTop: 12, lineHeight: 1.45 }}>
        To integracja eksperymentalna, oparta na nieoficjalnym API Vulcan. Działa tylko, gdy aplikacja jest uruchomiona lokalnie razem z serwerem (<code>npm run dev:full</code>) — dane logowania nie są zapisywane na dysku.
      </div>
    </div>
  );
}

function FocusShortcutCard({ focusShortcut, setFocusShortcut }) {
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div onClick={() => setFocusShortcut((s) => ({ ...s, enabled: !s.enabled }))} style={{ display: 'flex', gap: 13, cursor: 'pointer' }}>
        <Toggle on={focusShortcut.enabled} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Tryb Skupienie przy starcie sesji (iPhone)</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 4 }}>Kliknięcie "Rozpocznij sesję" uruchomi Twój Skrót o podanej nazwie — np. taki, który włącza tryb Skupienie i wycisza powiadomienia.</div>
        </div>
      </div>
      {focusShortcut.enabled && (
        <>
          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '16px 0 9px' }}>NAZWA SKRÓTU</div>
          <input
            value={focusShortcut.name}
            onChange={(e) => setFocusShortcut((s) => ({ ...s, name: e.target.value }))}
            placeholder="Sesja nauki"
          />
          <div
            onClick={() => triggerFocusShortcut(focusShortcut)}
            style={{ marginTop: 12, height: 42, borderRadius: 13, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, color: '#c9baff', cursor: 'pointer' }}
          >
            Uruchom teraz (test)
          </div>
        </>
      )}
    </div>
  );
}

export default function Profile({ studentName, schoolPlan, activities, energy, vulcanSession, setVulcanSession, focusShortcut, setFocusShortcut }) {
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-.01em' }}>{studentName || 'Ty'}</div>
          <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 2 }}>Domyślna energia: {energy}</div>
        </div>
      </div>

      {(schoolPlan || activities?.selected?.length > 0) && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 10 }}>PROFIL</div>
          {schoolPlan && (
            <div style={{ padding: 14, borderRadius: 16, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>📎</span>
              <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9baff' }}>{schoolPlan.name}</div>
            </div>
          )}
          {activities?.selected?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activities.selected.map((a) => (
                <span key={a} style={{ fontSize: 12, color: '#c9c9d6', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 12px' }}>{a}</span>
              ))}
            </div>
          )}
          {activities?.note && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>{activities.note}</div>
          )}
        </div>
      )}

      <VulcanCard vulcanSession={vulcanSession} setVulcanSession={setVulcanSession} />
      <FocusShortcutCard focusShortcut={focusShortcut} setFocusShortcut={setFocusShortcut} />

      <div style={{ marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Student Planner</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>Twój asystent do planowania nauki, przygotowań do sprawdzianów i ratowania napiętych dni.</div>
      </div>
    </div>
  );
}
