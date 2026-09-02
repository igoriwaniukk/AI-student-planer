import { useState } from 'react';
import TabBar from './components/TabBar';
import Home from './screens/Home';
import Planner from './screens/Planner';
import AddDeadline from './screens/AddDeadline';
import PrepPlan from './screens/PrepPlan';
import RescueDay from './screens/RescueDay';
import Summary from './screens/Summary';
import { useDeadlines, useSessions, useStudentName, toISODate } from './lib/store';

const TAB_SCREENS = new Set(['home', 'planner', 'deadline', 'summary']);

export default function App() {
  const [name, setName] = useStudentName();
  const [sessions, setSessions] = useSessions();
  const [deadlines, setDeadlines] = useDeadlines();
  const [screen, setScreen] = useState('home');
  const [screenParams, setScreenParams] = useState({});
  const [selectedDay, setSelectedDay] = useState(toISODate(new Date()));
  const [nameDraft, setNameDraft] = useState('');

  function navigate(next, params = {}) {
    setScreen(next);
    setScreenParams(params);
  }

  function addSession(session) {
    setSessions((prev) => [...prev, { id: crypto.randomUUID(), completed: false, ...session }]);
  }

  function addSessions(newSessions) {
    setSessions((prev) => [
      ...prev,
      ...newSessions.map((s) => ({ id: crypto.randomUUID(), completed: false, ...s })),
    ]);
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleSession(id) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  }

  function addDeadline(deadline) {
    const withId = { id: crypto.randomUUID(), ...deadline };
    setDeadlines((prev) => [...prev, withId]);
    return withId;
  }

  function applyRescue(changes) {
    const byId = new Map(changes.map((c) => [c.id, c]));
    setSessions((prev) =>
      prev.map((s) => {
        const c = byId.get(s.id);
        return c ? { ...s, day: c.newDay, time: c.newTime } : s;
      })
    );
  }

  if (!name) {
    return (
      <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 750 }}>Cześć! 👋</div>
        <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>Jak masz na imię?</div>
        <form
          style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (nameDraft.trim()) setName(nameDraft.trim());
          }}
        >
          <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Imię" autoFocus />
          <button type="submit" className="btn btn-primary">Zaczynajmy</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          name={name}
          sessions={sessions}
          deadlines={deadlines}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onToggleSession={toggleSession}
          onNavigate={navigate}
        />
      )}
      {screen === 'planner' && (
        <Planner
          sessions={sessions}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onAddSession={addSession}
          onDeleteSession={deleteSession}
          onToggleSession={toggleSession}
        />
      )}
      {screen === 'deadline' && (
        <AddDeadline onAddDeadline={addDeadline} onNavigate={navigate} />
      )}
      {screen === 'prep' && (
        <PrepPlan
          deadlines={deadlines}
          deadlineId={screenParams.deadlineId}
          onAddSessions={addSessions}
          onNavigate={navigate}
        />
      )}
      {screen === 'rescue' && (
        <RescueDay sessions={sessions} onApplyRescue={applyRescue} onNavigate={navigate} />
      )}
      {screen === 'summary' && <Summary sessions={sessions} deadlines={deadlines} />}

      {TAB_SCREENS.has(screen) && <TabBar screen={screen} onNavigate={navigate} />}
    </div>
  );
}
