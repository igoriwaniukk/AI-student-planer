import TabBar from './components/TabBar';
import ChatWidget from './components/ChatWidget';
import NotificationBell from './components/NotificationBell';
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
import {
  useStudentName, useSchoolPlan, useActivities, useProfileDefaults,
  useWeeklyCapacity, useEnergyLog, useStudyHistory, useRecurringActivities, useLanguage,
} from './lib/store';
import { usePlanner } from './hooks/usePlanner';
import { LanguageProvider } from './lib/LanguageContext';
import { computeStreak } from './lib/plannerLogic';

const TAB_SCREENS = new Set(['home', 'calendar', 'goals', 'profile']);

// Mounted only once onboarding is done, so usePlanner's initial state (a lazy
// useState initializer, which only ever runs on first mount) picks up the
// profile defaults onboarding just saved instead of whatever was there before.
function MainApp({ name, schoolPlan, activities, profileDefaults, weeklyCapacity, setWeeklyCapacity, energyLog, logEnergy, studyHistory, recordStudyDay, recurringActivities, setRecurringActivities }) {
  const planner = usePlanner(profileDefaults);
  const { state } = planner;
  const screen = state.screen;
  const streak = computeStreak(studyHistory);

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          planner={planner}
          studentName={name}
          energyLog={energyLog}
          logEnergy={logEnergy}
          studyHistory={studyHistory}
          recurringActivities={recurringActivities}
        />
      )}
      {screen === 'calendar' && <Calendar planner={planner} activities={activities} recurringActivities={recurringActivities} />}
      {screen === 'goals' && <Goals planner={planner} weeklyCapacity={weeklyCapacity} setWeeklyCapacity={setWeeklyCapacity} />}
      {screen === 'planner' && <Planner planner={planner} />}
      {screen === 'plan' && <Plan planner={planner} />}
      {screen === 'rescue' && <Rescue planner={planner} />}
      {screen === 'rescueResult' && <RescueResult planner={planner} />}
      {screen === 'deadline' && <Deadline planner={planner} />}
      {screen === 'prep' && <Prep planner={planner} />}
      {screen === 'summary' && <Summary planner={planner} recordStudyDay={recordStudyDay} />}
      {screen === 'profile' && (
        <Profile
          studentName={name}
          schoolPlan={schoolPlan}
          activities={activities}
          energy={state.energy}
          profileDefaults={profileDefaults}
          studyHistory={studyHistory}
          recurringActivities={recurringActivities}
          setRecurringActivities={setRecurringActivities}
        />
      )}

      {state.generating && <GeneratingOverlay labels={state.genLabels} step={state.genStep} />}

      <NotificationBell state={state} streak={streak} />

      <ChatWidget
        planner={planner}
        weeklyCapacity={weeklyCapacity}
        profileDefaults={profileDefaults}
        studyHistory={studyHistory}
        studentName={name}
        logEnergy={logEnergy}
        recurringActivities={recurringActivities}
        setRecurringActivities={setRecurringActivities}
      />

      {TAB_SCREENS.has(screen) && <TabBar screen={screen} onNavigate={planner.go} />}
    </div>
  );
}

export default function App() {
  const [name, setName] = useStudentName();
  const [schoolPlan, setSchoolPlan] = useSchoolPlan();
  const [activities, setActivities] = useActivities();
  const [profileDefaults, setProfileDefaults] = useProfileDefaults();
  const [weeklyCapacity, setWeeklyCapacity] = useWeeklyCapacity();
  const [energyLog, setEnergyLog] = useEnergyLog();
  const [studyHistory, setStudyHistory] = useStudyHistory();
  const [recurringActivities, setRecurringActivities] = useRecurringActivities();
  const [lang, setLang] = useLanguage();

  function logEnergy(level) {
    setEnergyLog((log) => log.concat({ at: new Date().toISOString(), level }).slice(-30));
  }

  function recordStudyDay(entry) {
    const today = new Date().toISOString().slice(0, 10);
    setStudyHistory((h) => ({ ...h, [today]: entry }));
  }

  if (!name) {
    return (
      <LanguageProvider lang={lang} setLang={setLang}>
        <Onboarding
          onComplete={({ name: newName, schoolPlan: plan, activities: acts, profile }) => {
            setSchoolPlan(plan);
            setActivities(acts);
            setProfileDefaults(profile);
            setName(newName);
          }}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <MainApp
        name={name}
        schoolPlan={schoolPlan}
        activities={activities}
        profileDefaults={profileDefaults}
        weeklyCapacity={weeklyCapacity}
        setWeeklyCapacity={setWeeklyCapacity}
        energyLog={energyLog}
        logEnergy={logEnergy}
        studyHistory={studyHistory}
        recordStudyDay={recordStudyDay}
        recurringActivities={recurringActivities}
        setRecurringActivities={setRecurringActivities}
      />
    </LanguageProvider>
  );
}
