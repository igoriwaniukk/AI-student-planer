import { StyleSheet, Text, View } from 'react-native';

// Placeholder for screens not ported yet — Home is the first real port;
// Calendar/Goals/Profile follow in later passes.
export default function ComingSoon({ title }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Coming soon in the mobile app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#08080c', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 32 },
  title: { fontSize: 18, fontWeight: '700', color: '#f4f4f7' },
  sub: { fontSize: 13, color: '#8a8a99' },
});
