import { BackButton, StickyFooter, PrimaryButton, BottomSheet, ConfirmCard } from '../components/ui';

export default function RescueResult({ planner }) {
  const {
    state, go, openRescueEdit, cancelRescueEdit, saveRescueEdit,
    setBioMin, pickMath, returnEnglish, confirmRescue, goHomeRescued,
  } = planner;

  const bioEnd = state.bioMin === 25 ? '17:25' : '17:35';
  const bioNewTime = '17:00–' + bioEnd;
  const engStatus = state.engToday ? 'Zostaje' : 'Przeniesiono';
  const engNewTime = state.engToday ? 'Dzisiaj 21:00–21:30' : 'Wtorek, 21 lipca, 17:30–18:00';
  const engEditLabel = state.engToday ? 'Angielski wrócił na dzisiaj — dotknij, aby przenieść na jutro' : 'Przywróć angielski na dzisiaj';

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('rescue')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>Gotowy do sprawdzenia</span>
      </div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>Nowy plan na dziś</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>Poniedziałek, 20 lipca</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em', lineHeight: 1.3 }}>Najważniejsze zadanie zostało zachowane</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#8fbaff', padding: '7px 11px', borderRadius: 9, background: 'rgba(91,156,255,.14)' }}>2 zadania zostają dzisiaj</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#e2e2ea', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)' }}>1 godz. 25 min nauki</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#c9baff', padding: '7px 11px', borderRadius: 9, background: 'rgba(124,92,255,.2)' }}>1 zadanie przeniesione</span>
          <span style={{ fontSize: 12, fontWeight: 650, color: '#e2e2ea', padding: '7px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)' }}>Koniec nauki: 20:30</span>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>Plan chroni przygotowanie do sprawdzianu, pozostawia tenis i nie skraca snu.</div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Co się zmieniło?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <ChangeCard subject="MATEMATYKA" subjectColor="#a58cff" badge="Zostaje" badgeColor="#8fbaff" badgeBg="rgba(91,156,255,.16)" title="Przygotowanie do sprawdzianu" from="15:30–16:30" to={state.mathSlot} dur="60 min" tag="Sprawdzian za 2 dni" note="Najbliższy ważny termin ma najwyższy priorytet, dlatego matematyka pozostaje dziś w pełnym wymiarze. Została przeniesiona na pierwszy dłuższy blok po tenisie." border="rgba(91,156,255,.35)" bg="rgba(91,156,255,.06)" />
        <ChangeCard subject="BIOLOGIA" subjectColor="#2ee6c5" badge="Skrócono" badgeColor="#f5a524" badgeBg="rgba(245,165,36,.14)" title="Powtórka z fotosyntezy" from="45 min" to={state.bioMin + ' min'} dur={bioNewTime} note="Krótka powtórka pozwala utrwalić materiał bez przeciążania dnia. Pozostałą część można uzupełnić później." border="rgba(245,165,36,.35)" bg="rgba(245,165,36,.06)" />
        <ChangeCard subject="ANGIELSKI" subjectColor="#a58cff" badge={engStatus} badgeColor="#c9baff" badgeBg="rgba(124,92,255,.22)" title="Nauka słówek" from="Dzisiaj 19:30–20:00" to={engNewTime} dur="30 min" note="To zadanie ma niższy priorytet i nie ma bliskiego terminu, dlatego zostało bezpiecznie przeniesione na jutro." border="rgba(124,92,255,.4)" bg="rgba(124,92,255,.06)" />
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Nowy plan od 16:50</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <PlainCard time="16:50–17:00" tag="Bufor" title="Chwila na reorganizację" sub="Przygotuj materiały i rozpocznij spokojnie." />
        <StudyBlock bg="rgba(245,165,36,.05)" border="rgba(245,165,36,.32)" time={bioNewTime} dur={state.bioMin + ' min'} status="Skrócono" statusColor="#f5a524" subject="BIOLOGIA" subjectColor="#2ee6c5" title="Powtórka z fotosyntezy" onEdit={() => openRescueEdit()} />
        <PlainCard time="17:25–18:00" dur="35 min" title="Bufor przed treningiem" sub="Przygotowanie i dotarcie na tenis." />
        <LockedCard time="18:00–19:00" title="Tenis" sub="Stałe wydarzenie" />
        <PlainCard time="19:00–19:30" dur="30 min" title="Kolacja i odpoczynek" sub="Odpoczynek" />
        <StudyBlock bg="rgba(91,156,255,.06)" border="rgba(91,156,255,.35)" time={state.mathSlot} dur="60 min" status="Zostaje" statusColor="#8fbaff" subject="MATEMATYKA" subjectColor="#a58cff" title="Przygotowanie do sprawdzianu" onEdit={() => openRescueEdit()} />
        <PlainCard time="20:30–22:30" dur="Czas wolny" title="Wolny wieczór" sub="Plan nie zabiera odpoczynku ani snu." />
        <LockedCard time="22:30" title="Sen" sub="Stała godzina" />
      </div>

      <div onClick={openRescueEdit} style={{ marginTop: 14, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>Edytuj zmiany</div>
      <div onClick={() => go('plan')} style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>Wróć do poprzedniego planu</div>

      <StickyFooter>
        <PrimaryButton onClick={confirmRescue}>Zatwierdź nowy plan</PrimaryButton>
      </StickyFooter>

      {state.editing && (
        <BottomSheet>
          <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>Edytuj zmiany</div>
          <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>Tenis i sen pozostają zablokowane.</div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>BIOLOGIA — DŁUGOŚĆ</div>
          <div style={{ display: 'flex', gap: 9 }}>
            {[25, 35, 45].map((v) => (
              <div key={v} onClick={() => setBioMin(v)} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.bioMin === v ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.bioMin === v ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)') }}>{v} min</div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>MATEMATYKA — GODZINA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {['19:30–20:30', '17:30–18:30', '21:45–22:45'].map((slot) => (
              <div key={slot} onClick={() => pickMath(slot)} style={{ height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.mathSlot === slot ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.mathSlot === slot ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)') }}>{slot}</div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>ANGIELSKI</div>
          <div onClick={returnEnglish} style={{ minHeight: 46, borderRadius: 13, display: 'flex', alignItems: 'center', padding: '12px 14px', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.engToday ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.engToday ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)'), color: state.engToday ? '#e6dfff' : '#c9c9d6' }}>{engEditLabel}</div>

          {state.editMessage && (
            <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c' }}>{state.editMessage}</div>
          )}

          <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
            <div onClick={cancelRescueEdit} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>Anuluj</div>
            <div onClick={saveRescueEdit} style={{ flex: 1.3, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Zapisz zmiany</div>
          </div>
        </BottomSheet>
      )}

      {state.rescueSaved && (
        <ConfirmCard
          title="Plan dnia został zaktualizowany."
          sub={'Angielski przeniesiono na jutro o ' + state.engStart + '.' + (state.gcal ? ' Bloki nauki w Google Calendar zostały zaktualizowane, bez duplikatów.' : '')}
          onDone={goHomeRescued}
          buttonLabel="Wróć do planu dnia"
        />
      )}
    </div>
  );
}

function ChangeCard({ subject, subjectColor, badge, badgeColor, badgeBg, title, from, to, dur, tag, note, border, bg }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: bg, border: '1.5px solid ' + border }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: subjectColor }}>{subject}</span>
        <span style={{ fontSize: 10.5, fontWeight: 750, color: badgeColor, padding: '4px 9px', borderRadius: 8, background: badgeBg }}>{badge}</span>
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginTop: 7 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#7a7a8a', textDecoration: 'line-through' }}>{from}</span>
        <span style={{ fontSize: 11, color: '#6b6b7a' }}>→</span>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{to}</span>
        <span style={{ fontSize: 10.5, fontWeight: 650, color: '#c9c9d6', padding: '3px 7px', borderRadius: 7, background: 'rgba(255,255,255,.07)' }}>{dur}</span>
      </div>
      {tag && <div style={{ marginTop: 9 }}><span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524', padding: '4px 8px', borderRadius: 7, background: 'rgba(245,165,36,.13)', border: '1px solid rgba(245,165,36,.28)' }}>{tag}</span></div>}
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{note}</div>
    </div>
  );
}

function PlainCard({ time, dur, title, sub, tag }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{time}</span>
        <span style={{ fontSize: 10.5, fontWeight: 650, color: '#c9c9d6', padding: '3px 7px', borderRadius: 7, background: 'rgba(255,255,255,.07)' }}>{tag || dur}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function LockedCard({ time, title, sub }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 12 }}>
      <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(91,156,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="13" viewBox="0 0 12 14" fill="none"><rect x="1.5" y="5.5" width="9" height="7.2" rx="1.8" stroke="#5b9cff" strokeWidth="1.2" /><path d="M3.8 5.5V4a2.2 2.2 0 014.4 0v1.5" stroke="#5b9cff" strokeWidth="1.2" /></svg></div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 11.5, color: '#8a8a99' }}>{time}</span><span style={{ fontSize: 10.5, fontWeight: 650, color: '#5b9cff' }}>Zablokowane</span></div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

function StudyBlock({ bg, border, time, dur, status, statusColor, subject, subjectColor, title, onEdit }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: bg, border: '1.5px solid ' + border }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{time}</span>
            <span style={{ fontSize: 10.5, fontWeight: 650, color: '#c9c9d6', padding: '3px 7px', borderRadius: 7, background: 'rgba(255,255,255,.07)' }}>{dur}</span>
            <span style={{ fontSize: 10.5, fontWeight: 750, color: statusColor }}>{status}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.06em', color: subjectColor, marginTop: 8 }}>{subject}</div>
          <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.28, marginTop: 5 }}>{title}</div>
        </div>
        <span onClick={onEdit} style={{ fontSize: 11.5, fontWeight: 650, color: '#c9c9d6', padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', height: 'fit-content', cursor: 'pointer' }}>Zmień</span>
      </div>
    </div>
  );
}
