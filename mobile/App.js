import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { LanguageProvider } from './src/lib/LanguageContext';
import { useEnergyLog, useLanguage, useStudentName } from './src/lib/storage';
import Home from './src/screens/Home';
import ComingSoon from './src/screens/ComingSoon';
import TabBar from './src/components/TabBar';

export default function App() {
  const [lang, setLang] = useLanguage();
  const [name] = useStudentName();
  const [energyLog, setEnergyLog] = useEnergyLog();
  const [screen, setScreen] = useState('home');

  function logEnergy(level) {
    setEnergyLog((log) => log.concat({ at: new Date().toISOString(), level }).slice(-30));
  }

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <SafeAreaView style={styles.shell}>
        <StatusBar barStyle="light-content" />
        {screen === 'home' && <Home studentName={name} energyLog={energyLog} logEnergy={logEnergy} />}
        {screen === 'calendar' && <ComingSoon title="Calendar" />}
        {screen === 'goals' && <ComingSoon title="Goals" />}
        {screen === 'profile' && <ComingSoon title="Profile" />}
        <TabBar screen={screen} onNavigate={setScreen} />
      </SafeAreaView>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#08080c' },
});
