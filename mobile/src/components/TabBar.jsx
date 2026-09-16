import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../lib/useLang';

const TABS = [
  { key: 'home', icon: '🏠', labelKey: 'tab.home' },
  { key: 'calendar', icon: '📅', labelKey: 'tab.calendar' },
  { key: 'goals', icon: '🎯', labelKey: 'tab.goals' },
  { key: 'profile', icon: '👤', labelKey: 'tab.profile' },
];

export default function TabBar({ screen, onNavigate }) {
  const { t } = useLang();
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = screen === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onNavigate(tab.key)} style={styles.tab}>
            <Text style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{t(tab.labelKey) || tab.key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.08)',
    backgroundColor: '#0c0c12',
    paddingBottom: 22,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10.5, fontWeight: '600', color: '#6b6b7a' },
  labelActive: { color: '#8b6dff' },
});
