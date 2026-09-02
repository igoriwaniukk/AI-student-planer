import { useState } from 'react';
import TabBar from './components/TabBar';
import Home from './screens/Home';
import Planner from './screens/Planner';
import AddDeadline from './screens/AddDeadline';
import PrepPlan from './screens/PrepPlan';
import RescueDay from './screens/RescueDay';
import Summary from './screens/Summary';
import Onboarding from './screens/Onboarding';
import { useDeadlines, useSessions, useStudentName, useSchoolPlan, useActivities, toISODate } from './lib/store';

const TAB_SCREENS = new Set(['home', 'planner', 'deadline', 'summary']);

export default function App() {
  const [name, setName] = useStudentName();
  const [sessions, setSessions] = useSessions();
  const [deadlines, setDeadlines] = useDeadlines();
  const [schoolPlan, setSchoolPlan] = useSchoolPlan();
  const [activities, setActivities] = useActivities();
  const [screen, setScreen] = useState('home');
  const [screenParams, setScreenParams] = useState({});
  const [selectedDay, setSelectedDay] = useState(toISODate(new Date()));

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
      <Onboarding
        onComplete={({ name: newName, schoolPlan, activities }) => {
          setSchoolPlan(schoolPlan);
          setActivities(activities);
          setName(newName);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          name={name}
          sessions={sessions}
          deadlines={deadlines}
          schoolPlan={schoolPlan}
          activities={activities}
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
