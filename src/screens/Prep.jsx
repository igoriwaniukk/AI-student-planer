import { SESSIONS, SESSION_DATES } from '../lib/plannerData';
import { BackButton, StickyFooter, PrimaryButton, BottomSheet, OptionRow, ConfirmCard } from '../components/ui';

export default function Prep({ planner }) {
  const {
    state, openSession, pickSessionDate, pickSessionTime, pickSessionDur, cancelSession, saveSession,
    togglePrepGcal, askOnlyDeadline, backToPrep, saveOnlyDeadline, confirmPrep, goHomeDeadline, go,
  } = planner;

  const sIdx = state.sessionIdx;
  const sEdit = state.sessionEdits[sIdx] || {};
  const curDate = sEdit.date || SESSION_DATES[sIdx];
  const curStart = sEdit.start || (sEdit.time || SESSIONS[sIdx].time).split('–')[0];
  const curDur = sEdit.dur || SESSIONS[sIdx].dur;
  const dateOpts = [SESSION_DATES[sIdx], 'Środa, 22 lipca', 'Sobota, 1 sierpnia'];

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('deadline')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>Do zatwierdzenia</span>
      </div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>Plan przygotowania</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>Biologia — 31 lipca</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>Plan przygotowania jest gotowy</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#c9baff', padding: '7px 11px', borderRadius: 9, background: 'rgba(124,92,255,.2)' }}>6 sesji</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#e2e2ea', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)' }}>3 godz. 30 min nauki</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#e2e2ea', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)' }}>11 dni do sprawdzianu</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#8ff0de', padding: '7px 11px', borderRadius: 9, background: 'rgba(46,230,197,.13)' }}>Ostatnia powtórka: dzień wcześniej</span>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>Plan zaczyna się od podstaw, przechodzi do zadań i kończy krótkim samosprawdzeniem.</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#9a9aab' }}>Szacowana gotowość początkowa</span>
          <span style={{ fontSize: 19, fontWeight: 750, color: '#2ee6c5' }}>40%</span>
        </div>
        <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 8 }}>To szacunek oparty na Twojej samoocenie, a nie przewidywana ocena.</div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Etapy przygotowania</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {SESSIONS.map((sx, i) => {
          const d = state.sessionEdits[i] || {};
          const date = d.date || SESSION_DATES[i];
          const time = d.time || sx.time;
          const dur = d.dur || sx.dur;
          return (
            <div key={i} style={{ padding: 14, borderRadius: 18, background: 'rgba(124,92,255,.05)', border: '1.5px solid rgba(124,92,255,.35)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{date} · {time}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 650, color: '#c9c9d6', padding: '3px 7px', borderRadius: 7, background: 'rgba(255,255,255,.07)' }}>{dur}</span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.28, marginTop: 7 }}>{sx.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.06em', color: '#8ff0de', marginTop: 6, textTransform: 'uppercase' }}>{sx.type}</div>
                </div>
                <span onClick={() => openSession(i)} style={{ fontSize: 11.5, fontWeight: 650, color: '#c9c9d6', padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', height: 'fit-content', cursor: 'pointer' }}>Zmień</span>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{sx.why}</div>
            </div>
          );
        })}

        <div style={{ padding: 14, borderRadius: 18, background: 'rgba(245,165,36,.06)', border: '1.5px solid rgba(245,165,36,.32)', display: 'flex', gap: 12 }}>
          <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(245,165,36,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="13" viewBox="0 0 12 14" fill="none"><rect x="1.5" y="5.5" width="9" height="7.2" rx="1.8" stroke="#f5a524" strokeWidth="1.2" /><path d="M3.8 5.5V4a2.2 2.2 0 014.4 0v1.5" stroke="#f5a524" strokeWidth="1.2" /></svg></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 11.5, color: '#8a8a99' }}>Piątek, 31 lipca · 09:00</span><span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524' }}>Termin</span></div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>Sprawdzian — Genetyka</div>
            <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>Termin nie może zostać przesunięty.</div>
          </div>
        </div>
      </div>

      <div onClick={togglePrepGcal} style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 13, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 26, flex: 'none', borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center', background: state.prepGcal ? '#7c5cff' : 'rgba(255,255,255,.14)', justifyContent: state.prepGcal ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Dodaj sesje do Google Calendar</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 4 }}>Po zatwierdzeniu dodamy 6 bloków nauki. Sprawdzian i istniejące wydarzenia nie zostaną zduplikowane.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 11, marginTop: 14 }}>
        <div onClick={() => openSession(0)} style={{ flex: 1, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>Edytuj plan</div>
        <div onClick={askOnlyDeadline} style={{ flex: 1, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, textAlign: 'center', lineHeight: 1.25, cursor: 'pointer' }}>Zapisz tylko termin</div>
      </div>

      <StickyFooter>
        <PrimaryButton onClick={confirmPrep}>Zatwierdź plan przygotowania</PrimaryButton>
      </StickyFooter>

      {state.sessionOpen && (
        <BottomSheet>
          <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>Zmień sesję: {SESSIONS[sIdx].title}</div>
          <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>Szkoła, tenis, sen i sprawdzian pozostają chronione.</div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>DATA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {dateOpts.map((d) => (
              <div key={d} onClick={() => pickSessionDate(d)} style={{ height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: curDate === d ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (curDate === d ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)') }}>{d}</div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>GODZINA ROZPOCZĘCIA</div>
          <div style={{ display: 'flex', gap: 9 }}>
            {['16:30', '17:00', '18:15', '22:15'].map((t) => <OptionRow key={t} label={t} active={curStart === t} onClick={() => pickSessionTime(t)} />)}
          </div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>DŁUGOŚĆ</div>
          <div style={{ display: 'flex', gap: 9 }}>
            {['25 min', '35 min', '40 min'].map((d) => <OptionRow key={d} label={d} active={curDur === d} onClick={() => pickSessionDur(d)} />)}
          </div>

          {state.sessionMessage && (
            <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c' }}>{state.sessionMessage}</div>
          )}

          <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
            <div onClick={cancelSession} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>Anuluj</div>
            <div
              onClick={saveSession}
              style={{ flex: 1.3, height: 50, borderRadius: 15, background: state.sessionMessage ? 'rgba(255,255,255,.06)' : 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: state.sessionMessage ? '#6b6b7a' : '#fff', cursor: 'pointer' }}
            >
              Zapisz zmiany
            </div>
          </div>
        </BottomSheet>
      )}

      {state.onlyDeadlineAsk && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 78, background: 'rgba(6,6,10,.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
          <div style={{ width: '100%', padding: 20, borderRadius: 24, background: '#101018', border: '1px solid rgba(255,255,255,.1)', animation: 'fadeUp .3s ease both' }}>
            <div style={{ fontSize: 15.5, fontWeight: 750, lineHeight: 1.35 }}>Zapisać tylko termin bez planu przygotowania?</div>
            <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 8 }}>Zaproponowane 6 sesji zostanie odrzuconych.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <div onClick={saveOnlyDeadline} style={{ height: 50, borderRadius: 15, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>Zapisz tylko termin</div>
              <div onClick={backToPrep} style={{ height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Wróć do planu</div>
            </div>
          </div>
        </div>
      )}

      {state.prepSaved && (
        <ConfirmCard
          title="Termin i plan przygotowania zostały zapisane."
          sub={state.bioSessionsSaved ? 'Dodano 6 sesji przed sprawdzianem.' : ''}
          onDone={goHomeDeadline}
        />
      )}
    </div>
  );
}
