import { REASON_OPTIONS, RESCUE_TIME_OPTIONS, PRIO_STYLE, STATUS_LABEL } from '../lib/plannerData';
import { durOf, startOf, span } from '../lib/plannerLogic';
import { BackButton, StickyFooter, PrimaryButton, Chip, EnergyPicker } from '../components/ui';

export default function Rescue({ planner }) {
  const { state, ts, toggleReason, setRescueTime, update, openTaskEdit, rescueGenerate, go } = planner;
  const notEnoughTime = state.rescueTime === '45 min' && !state.rescueMoved;
  const noSafeBlock = state.rescueTime === 'Własny czas';

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('home')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9c9d6', padding: '8px 13px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>Teraz 16:50</span>
      </div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>Uratuj mój dzień</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>Poniedziałek, 20 lipca</div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>Plan się opóźnił</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 7 }}>Sprawdźmy, co nadal warto zrobić i czego nie trzeba już wciskać na siłę.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }}>
          <span style={{ fontSize: 11.5, fontWeight: 650, color: '#e2e2ea', padding: '6px 10px', borderRadius: 9, background: 'rgba(255,255,255,.07)' }}>3 zadania pozostały</span>
          <span style={{ fontSize: 11.5, fontWeight: 650, color: '#8fbaff', padding: '6px 10px', borderRadius: 9, background: 'rgba(91,156,255,.13)' }}>Do tenisa: 1 godz. 10 min</span>
          <span style={{ fontSize: 11.5, fontWeight: 650, color: '#8fbaff', padding: '6px 10px', borderRadius: 9, background: 'rgba(91,156,255,.13)' }}>Sen: 22:30</span>
        </div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Co się zmieniło?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {REASON_OPTIONS.map((r) => (
          <Chip key={r} label={r} active={state.reasons.includes(r)} onClick={() => toggleReason(r)} />
        ))}
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Pozostało do zrobienia</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {state.taskDefs.map((d) => {
          const ps = PRIO_STYLE[d.priority] || PRIO_STYLE['Normalny priorytet'];
          const dur = durOf(d.id, state.taskDefs, state.durOverride);
          const start = startOf(d.id, state);
          const st = ts(d.id);
          return (
            <div key={d.id} style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: d.color, textTransform: 'uppercase' }}>{d.subject}</span>
                    <span style={{ fontSize: 10, fontWeight: 650, padding: '3px 8px', borderRadius: 7, color: ps.color, background: ps.bg }}>{d.priority}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 6 }}>{d.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginTop: 9 }}>
                    <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{span(start, start + dur)} · {dur} min</span>
                    {d.deadline && <span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524', padding: '4px 8px', borderRadius: 7, background: 'rgba(245,165,36,.13)', border: '1px solid rgba(245,165,36,.28)' }}>{d.deadline}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 8 }}>{STATUS_LABEL[st.status]}</div>
                </div>
                <span onClick={() => openTaskEdit(d.id)} style={{ fontSize: 12.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer', flex: 'none' }}>Edytuj</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, padding: 14, borderRadius: 18, background: 'rgba(91,156,255,.06)', border: '1px solid rgba(91,156,255,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(91,156,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="13" viewBox="0 0 12 14" fill="none"><rect x="1.5" y="5.5" width="9" height="7.2" rx="1.8" stroke="#5b9cff" strokeWidth="1.2" /><path d="M3.8 5.5V4a2.2 2.2 0 014.4 0v1.5" stroke="#5b9cff" strokeWidth="1.2" /></svg></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Tenis</div><div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 2 }}>Stałe wydarzenie</div></div>
          <span style={{ fontSize: 12.5, fontWeight: 650, color: '#8fbaff' }}>18:00–19:00</span>
        </div>
        <div style={{ fontSize: 11.5, color: '#a3a3b3', marginTop: 10 }}>AI nie przesunie ani nie usunie tego wydarzenia.</div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>Ile masz teraz energii?</div>
      <EnergyPicker value={state.rescueEnergy} onChange={(v) => update({ rescueEnergy: v })} />
      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 10 }}>Przy niskiej energii ograniczymy liczbę zadań i zachowamy przerwy.</div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', lineHeight: 1.3, margin: '22px 0 12px' }}>Ile czasu naprawdę masz jeszcze na naukę?</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {RESCUE_TIME_OPTIONS.map((t) => (
          <Chip key={t} label={t} active={state.rescueTime === t} onClick={() => setRescueTime(t)} />
        ))}
      </div>

      <div style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: '#c9c9d6', lineHeight: 1.3 }}>Najpóźniej chcę skończyć naukę</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 13, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
            <span style={{ fontSize: 17, fontWeight: 750 }}>20:30</span>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.2" stroke="#9a9aab" strokeWidth="1.3" /><path d="M9 5.2V9l2.6 1.8" stroke="#9a9aab" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: '#8fbaff', marginTop: 11 }}>Sen pozostaje bez zmian: 22:30</div>
      </div>

      {notEnoughTime && (
        <div style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(245,165,36,.07)', border: '1px solid rgba(245,165,36,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45 }}>Nie da się bezpiecznie zmieścić wszystkich ważnych zadań w wybranym czasie.</div>
          <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
            <div onClick={() => setRescueTime('1 godz. 30 min')} style={{ flex: 1, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, textAlign: 'center', cursor: 'pointer' }}>Zwiększ dostępny czas</div>
            <div onClick={() => update({ rescueMoved: true })} style={{ flex: 1, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, textAlign: 'center', lineHeight: 1.25, cursor: 'pointer' }}>Przenieś mniej ważne zadania</div>
          </div>
        </div>
      )}

      {noSafeBlock && (
        <div style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.45, color: '#c9c9d6' }}>Dziś nie ma już miejsca na bezpieczny blok nauki. Najważniejsze zadanie możemy przenieść na najbliższy wolny termin.</div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>PODSUMOWANIE RATUNKU</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
          <Row label="Pozostałe zadania" value="3 pozostałe zadania" />
          <Row label="Dostępna nauka" value={state.rescueTime} />
          <Row label="Energia" value={'Energia: ' + state.rescueEnergy} />
          <Row label="Tenis" value="Tenis pozostaje bez zmian" color="#8fbaff" />
          <Row label="Sen" value="Sen pozostaje bez zmian" color="#8fbaff" />
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '15px -16px' }} />
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3' }}>Nie wszystkie zadania zmieszczą się dzisiaj. AI pokaże dokładnie, co zostaje, co skraca i co przenosi.</div>
      </div>

      <StickyFooter>
        <PrimaryButton onClick={rescueGenerate}>Uratuj mój dzień</PrimaryButton>
      </StickyFooter>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#9a9aab' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || undefined }}>{value}</span>
    </div>
  );
}
