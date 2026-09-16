import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../lib/useLang';
import { STATUS_COLOR } from '../lib/plannerData';

export function Chip({ label, active, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, style]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, color, bg }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function ProgressBar({ pct, fill = '#7c5cff', height = 6, style }) {
  return (
    <View style={[{ height, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: fill }} />
    </View>
  );
}

export function StatusPill({ status }) {
  const { t } = useLang();
  return (
    <View style={styles.statusPill}>
      {status === 'completed' && <Text style={{ color: STATUS_COLOR.completed, fontSize: 10 }}>✓</Text>}
      <Text style={{ fontSize: 10.5, fontWeight: '650', color: STATUS_COLOR[status] }}>{t('status.' + status)}</Text>
    </View>
  );
}

export function AchievementMedal({ icon, unlocked, size = 40 }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, alignSelf: 'center',
        backgroundColor: unlocked ? '#f0b93c' : 'rgba(255,255,255,.05)',
        borderWidth: 2, borderColor: unlocked ? '#fff3d0' : 'rgba(255,255,255,.1)',
        alignItems: 'center', justifyContent: 'center', opacity: unlocked ? 1 : 0.35,
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.5) }}>{icon}</Text>
    </View>
  );
}

// Same visual shape everywhere a modal bottom sheet is needed: a dimmed
// backdrop (tap to dismiss) plus a card capped at maxHeight with its own
// internal scroll, so long content can never push its own close controls
// off-screen — see the web app's BottomSheet for why that capping matters.
export function BottomSheet({ visible, onRequestClose, children, maxHeight = '86%', scrollable }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose} />
      {scrollable ? (
        <ScrollView style={[styles.sheet, { maxHeight }]} contentContainerStyle={{ paddingBottom: 8 }}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.sheet, { maxHeight }]}>{children}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 11, paddingHorizontal: 15, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.1)',
  },
  chipActive: { backgroundColor: 'rgba(124,92,255,.14)', borderColor: 'rgba(124,92,255,.6)' },
  chipText: { fontSize: 12.5, fontWeight: '650', color: '#c9c9d6' },
  chipTextActive: { color: '#e6dfff' },
  pill: { paddingVertical: 3, paddingHorizontal: 7, borderRadius: 7, alignSelf: 'flex-start' },
  pillText: { fontSize: 10.5, fontWeight: '650' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 9,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,.06)',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,6,10,.75)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#101018', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,.12)', padding: 20,
  },
});
