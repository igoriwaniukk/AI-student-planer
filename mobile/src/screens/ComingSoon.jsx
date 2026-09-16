import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../lib/useLang';

// Placeholder for screens not ported yet — Home now runs on the real
// planner engine, so tapping into Planner/Plan/Rescue/Calendar/Goals/Profile
// lands here with a way back, instead of the app getting stuck.
export default function ComingSoon({ title, onBack }) {
  const { t } = useLang();
  return (
    <View style={styles.screen}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Coming soon in the mobile app</Text>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{t('tab.home') || 'Home'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#08080c', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emoji: { fontSize: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#f4f4f7' },
  sub: { fontSize: 13, color: '#8a8a99' },
  backBtn: { marginTop: 20, height: 48, paddingHorizontal: 24, borderRadius: 15, backgroundColor: '#7856ff', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
