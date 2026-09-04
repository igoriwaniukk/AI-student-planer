import TabBar from './components/TabBar';
import { GeneratingOverlay } from './components/ui';
import Home from './screens/Home';
import Calendar from './screens/Calendar';
import Goals from './screens/Goals';
import Planner from './screens/Planner';
import Plan from './screens/Plan';
import Rescue from './screens/Rescue';
import RescueResult from './screens/RescueResult';
import Deadline from './screens/Deadline';
import Prep from './screens/Prep';
import Summary from './screens/Summary';
import Profile from './screens/Profile';
import Onboarding from './screens/Onboarding';
import { useStudentName, useSchoolPlan, useActivities } from './lib/store';
import { usePlanner } from './hooks/usePlanner';

const TAB_SCREENS = new Set(['home', 'calendar', 'goals', 'profile']);

export default function App() {
  const [name, setName] = useStudentName();
  const [schoolPlan, setSchoolPlan] = useSchoolPlan();
  const [activities, setActivities] = useActivities();
  const planner = usePlanner();

  if (!name) {
    return (
      <Onboarding
        onComplete={({ name: newName, schoolPlan: plan, activities: acts }) => {
          setSchoolPlan(plan);
          setActivities(acts);
          setName(newName);
        }}
      />
    );
  }

  const { state } = planner;
  const screen = state.screen;

  return (
    <div className="app-shell">
      {screen === 'home' && <Home planner={planner} studentName={name} />}
      {screen === 'calendar' && <Calendar planner={planner} activities={activities} />}
      {screen === 'goals' && <Goals planner={planner} />}
      {screen === 'planner' && <Planner planner={planner} />}
      {screen === 'plan' && <Plan planner={planner} />}
      {screen === 'rescue' && <Rescue planner={planner} />}
      {screen === 'rescueResult' && <RescueResult planner={planner} />}
      {screen === 'deadline' && <Deadline planner={planner} />}
      {screen === 'prep' && <Prep planner={planner} />}
      {screen === 'summary' && <Summary planner={planner} />}
      {screen === 'profile' && <Profile studentName={name} schoolPlan={schoolPlan} activities={activities} energy={state.energy} />}

      {state.generating && <GeneratingOverlay labels={state.genLabels} step={state.genStep} />}

      {TAB_SCREENS.has(screen) && <TabBar screen={screen} onNavigate={planner.go} />}
    </div>
  );
}
