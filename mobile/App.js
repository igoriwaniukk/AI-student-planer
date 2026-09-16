import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { LanguageProvider } from './src/lib/LanguageContext';
import {
  useActivities, useEnergyLog, useLanguage, useProfileDefaults, usePlannerData,
  useRecurringActivities, useStudentName, useStudyHistory,
} from './src/lib/storage';
import { usePlanner } from './src/hooks/usePlanner';
import Home from './src/screens/Home';
import ComingSoon from './src/screens/ComingSoon';
import TabBar from './src/components/TabBar';

const TAB_SCREENS = new Set(['home', 'calendar', 'goals', 'profile']);

function MainApp({ name, activities, profileDefaults, recurringActivities, energyLog, setEnergyLog, studyHistory }) {
  const [plannerData, setPlannerData] = usePlannerData();
  const planner = usePlanner(profileDefaults, activities, recurringActivities, plannerData, setPlannerData);
  const { state } = planner;
  const screen = state.screen;

  function logEnergy(level) {
    setEnergyLog((log) => log.concat({ at: new Date().toISOString(), level }).slice(-30));
  }

  return (
    <>
      {screen === 'home' && (
        <Home planner={planner} studentName={name} energyLog={energyLog} logEnergy={logEnergy} studyHistory={studyHistory} recurringActivities={recurringActivities} />
      )}
      {screen !== 'home' && (
        <ComingSoon title={screen} onBack={() => planner.go('home')} />
      )}
      {TAB_SCREENS.has(screen) && <TabBar screen={screen} onNavigate={planner.go} />}
    </>
  );
}

export default function App() {
  const [lang, setLang] = useLanguage();
  const [name] = useStudentName();
  const [activities] = useActivities();
  const [profileDefaults] = useProfileDefaults();
  const [recurringActivities] = useRecurringActivities();
  const [energyLog, setEnergyLog] = useEnergyLog();
  const [studyHistory] = useStudyHistory();

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <SafeAreaView style={styles.shell}>
        <StatusBar barStyle="light-content" />
        <MainApp
          name={name}
          activities={activities}
          profileDefaults={profileDefaults}
          recurringActivities={recurringActivities}
          energyLog={energyLog}
          setEnergyLog={setEnergyLog}
          studyHistory={studyHistory}
        />
      </SafeAreaView>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#08080c' },
});
