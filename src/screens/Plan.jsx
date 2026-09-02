import { timeline, span, hm, fmt } from '../lib/plannerLogic';
import { STATUS_COLOR, STATUS_LABEL } from '../lib/plannerData';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard, Pill } from '../components/ui';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';

function LockedCard({ it }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 12 }}>
      <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(91,156,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🔒</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{it.k === 'sleep' ? fmt(it.start) : span(it.start, it.end)}</span>
          <span style={{ fontSize: 10.5, fontWeight: 650, color: '#5b9cff' }}>Zablokowane</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{it.title}</div>
        <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{it.sub}</div>
      </div>
    </div>
  );
}

function GapCard({ it }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{span(it.start, it.end)}</span>
        <Pill text={(it.end - it.start) + ' min'} color="#c9c9d6" bg="rgba(255,255,255,.07)" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{it.title}</div>
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{it.sub}</div>
    </div>
  );
}

function StudyCard({ it, planner }) {
  const { state, def, ts, openBlockEdit, openTaskEdit, removeBlock } = planner;
  const d = def(it.id);
  const st = ts(it.id);
  const manual = state.manualMode;
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(124,92,255,.06)', border: '1.5px solid rgba(124,92,255,.42)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{span(it.start, it.end)}</span>
            <Pill text={(it.end - it.start) + ' min'} color="#c9baff" bg="rgba(124,92,255,.2)" />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: STATUS_COLOR[st.status] }}>{STATUS_LABEL[st.status]}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.06em', color: d.color, marginTop: 8, textTransform: 'uppercase' }}>{d.subject}</div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.28, marginTop: 5 }}>{d.title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <EditBtn label="Zmień" onClick={() => openBlockEdit(it.id)} />
          {manual && <EditBtn label="Usuń" onClick={() => removeBlock(it.id)} />}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 11 }}>
        <Pill text={d.priority} color="#c9baff" bg="rgba(124,92,255,.2)" />
        {d.deadline && <Pill text={d.deadline} color="#f5a524" bg="rgba(245,165,36,.13)" />}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{d.why}</div>
      <div onClick={() => openTaskEdit(it.id)} style={{ fontSize: 11.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer', marginTop: 8 }}>Edytuj szczegóły zadania</div>
    </div>
  );
}

function EditBtn({ label, onClick }) {
  return (
    <span onClick={onClick} style={{ fontSize: 11.5, fontWeight: 650, color: '#c9c9d6', padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', height: 'fit-content', cursor: 'pointer' }}>{label}</span>
  );
}

export default function Plan({ planner }) {
  const { state, update, toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved, go } = planner;
  const items = timeline(state.schedule);
  const sched = state.schedule || {};
  const schedIds = Object.keys(sched);
  const nBlocks = schedIds.length;
  const nTasks = state.tasks.filter(Boolean).length;
  const studyMins = schedIds.reduce((a, k) => a + sched[k].dur, 0);
  const studyEnd = nBlocks ? fmt(Math.max(...schedIds.map((k) => sched[k].start + sched[k].dur))) : '—';
  const blockWord = nBlocks === 1 ? '1 blok nauki' : (nBlocks > 1 && nBlocks < 5 ? nBlocks + ' bloki nauki' : nBlocks + ' bloków nauki');
  const energyPhrase = state.energy === 'Niska' ? 'niski poziom energii' : state.energy === 'Wysoka' ? 'wysoki poziom energii' : 'normalny poziom energii';
  const prefPhrase = state.pref === 'Więcej krótkich przerw' ? 'więcej krótkich przerw' : state.pref === 'Najpierw najtrudniejsze' ? 'najtrudniejsze zadania na początku' : 'wolny wieczór';

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('planner')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>Gotowy do sprawdzenia</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 20 }}>20 lipca 2026</div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 6 }}>Plan na poniedziałek</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>Twój plan jest gotowy</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Pill text={blockWord} color="#c9baff" bg="rgba(124,92,255,.2)" />
          <Pill text={hm(studyMins) + ' nauki'} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
          <Pill text={'Koniec nauki: ' + studyEnd} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>Plan uwzględnia szkołę, tenis, {energyPhrase} i {prefPhrase}.</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ color: '#35d07f', fontSize: 12 }}>✓</span>
          <span style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.45, color: '#5fdd9b' }}>{nBlocks === nTasks ? 'Wszystkie wybrane zadania zmieściły się w planie.' : 'Część zadań została pominięta w tym planie.'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 12px 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>PLAN DNIA</span>
        {state.manualMode && <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff' }}>Tryb edycji ręcznej</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {items.map((it, i) => {
          if (it.k === 'study') return <StudyCard key={i} it={it} planner={planner} />;
          if (it.k === 'gap') return <GapCard key={i} it={it} />;
          return <LockedCard key={i} it={it} />;
        })}
      </div>

      <div onClick={() => update((s) => ({ gcal: !s.gcal }))} style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 13, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 26, flex: 'none', borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center', background: state.gcal ? '#7c5cff' : 'rgba(255,255,255,.14)', justifyContent: state.gcal ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Dodaj bloki nauki do Google Calendar</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 4 }}>Dodane zostaną tylko {blockWord.toLowerCase()}. Szkoła i tenis nie zostaną dodane ponownie.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 11, marginTop: 14 }}>
        <div onClick={toggleManualMode} style={{ flex: 1, height: 48, borderRadius: 15, background: state.manualMode ? 'rgba(124,92,255,.22)' : 'rgba(255,255,255,.055)', border: '1px solid ' + (state.manualMode ? 'rgba(124,92,255,.5)' : 'rgba(255,255,255,.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>{state.manualMode ? 'Zapisz zmiany' : 'Edytuj ręcznie'}</div>
        <div onClick={regenerateOrCancel} style={{ flex: 1, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>{state.manualMode ? 'Anuluj' : 'Wygeneruj ponownie'}</div>
      </div>

      <StickyFooter>
        <PrimaryButton onClick={confirmPlan}>Zatwierdź plan</PrimaryButton>
      </StickyFooter>

      <BlockEditSheet planner={planner} />
      <TaskEditSheet planner={planner} />

      {state.saved && (
        <ConfirmCard
          title="Plan na poniedziałek został zapisany."
          sub={state.gcal ? 'Dodano ' + schedIds.length + ' bloki nauki do Google Calendar.' : null}
          onDone={goHomeSaved}
          buttonLabel="Przejdź do planu"
        />
      )}
    </div>
  );
}
