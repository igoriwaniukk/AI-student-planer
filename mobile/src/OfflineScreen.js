import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from './config';
import { STRINGS } from './strings';

// Shown instead of a blank page when the website can't load: no internet,
// or the server answered with an error.
export default function OfflineScreen({ lang, kind, retrying, onRetry }) {
  const s = STRINGS[lang] || STRINGS.en;
  const offline = kind !== 'server';
  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/pug-offline.png')} style={styles.pug} />
      <Text style={styles.title}>{offline ? s.offlineTitle : s.errorTitle}</Text>
      <Text style={styles.body}>{offline ? s.offlineBody : s.errorBody}</Text>
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        accessibilityRole="button"
      >
        {retrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{s.retry}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pug: { width: 168, height: 168, marginBottom: 18 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: COLORS.muted, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  button: {
    marginTop: 28, height: 52, minWidth: 220, paddingHorizontal: 28, borderRadius: 16,
    backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6d4dff', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
