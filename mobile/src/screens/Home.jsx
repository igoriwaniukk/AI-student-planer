import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../lib/useLang';
import { DAY_KEY, VALUE_KEY } from '../lib/i18n';
import { computeStreak, computeTotalPoints, dayInfo, formatMonthDay } from '../lib/plannerLogic';
import { ACHIEVEMENTS, computeUnlockedAchievements } from '../lib/achievements';
import { REFERENCE_DAY } from '../lib/plannerData';

const ENERGY_OPTIONS = [
  ['Niska', '🔋'],
  ['Normalna', '⚡'],
  ['Wysoka', '🔥'],
];

function EnergySheet({ visible, draft, setDraft, onCancel, onSave }) {
  const { t } = useLang();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{t('home.energyPickerTitle')}</Text>
            <Text style={styles.sheetSub}>{t('home.energyPickerSub')}</Text>
          </View>
          <Pressable onPress={onCancel} hitSlop={10}>
            <Text style={styles.closeX}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.energyRow}>
          {ENERGY_OPTIONS.map(([name, icon]) => {
            const on = draft === name;
            return (
              <Pressable key={name} onPress={() => setDraft(name)} style={[styles.energyCard, on && styles.energyCardOn]}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
                <Text style={styles.energyCardLabel}>{t(VALUE_KEY[name]) || name}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sheetActions}>
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>{t('home.cancel')}</Text>
          </Pressable>
          <Pressable onPress={onSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{t('home.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function Home({ studentName, energyLog, logEnergy }) {
  const { t } = useLang();
  const [energySheetOpen, setEnergySheetOpen] = useState(false);
  const [energyDraft, setEnergyDraft] = useState('Normalna');

  const info = useMemo(() => dayInfo(REFERENCE_DAY), []);
  const dateLong = t('home.dateLong', { day: t(DAY_KEY[info.label]) || info.label, date: formatMonthDay(REFERENCE_DAY, { year: true }) });
  const firstName = (studentName || 'Ty').trim().split(/\s+/)[0];

  const streak = computeStreak({});
  const points = computeTotalPoints({}, energyLog);
  const stats = {
    streak,
    points,
    completedDays: 0,
    energyCheckins: energyLog.length,
    recurringCount: 0,
  };
  const unlocked = computeUnlockedAchievements(stats);
  const lastEnergy = energyLog[energyLog.length - 1]?.level;

  function openSheet() {
    setEnergyDraft(lastEnergy || 'Normalna');
    setEnergySheetOpen(true);
  }

  function saveSheet() {
    logEnergy(energyDraft);
    setEnergySheetOpen(false);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{dateLong}</Text>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>{t('home.greeting', { name: firstName })}</Text>
        <Text style={{ fontSize: 22 }}>👋</Text>
      </View>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={{ fontSize: 12 }}>🎖️</Text>
          <Text style={styles.badgeText}>{t('home.badgesCount', { n: unlocked.length, total: ACHIEVEMENTS.length })}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: 'rgba(46,230,197,.1)', borderColor: 'rgba(46,230,197,.28)' }]}>
          <Text style={{ fontSize: 12 }}>🔥</Text>
          <Text style={[styles.badgeText, { color: '#7fe8cf' }]}>{streak}</Text>
        </View>
      </View>

      <Pressable onPress={openSheet} style={styles.energyPill}>
        <Text style={{ fontSize: 20 }}>🔋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.energyPillLabel}>{t('home.energyLevel')}</Text>
          <Text style={styles.energyPillValue}>
            {t('home.energyValue', { level: t(VALUE_KEY[lastEnergy]) || lastEnergy || t(VALUE_KEY['Normalna']) })}
          </Text>
        </View>
        <Text style={{ color: '#6b6b7a', fontSize: 18 }}>›</Text>
      </Pressable>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsValue}>{points}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>

      <EnergySheet
        visible={energySheetOpen}
        draft={energyDraft}
        setDraft={setEnergyDraft}
        onCancel={() => setEnergySheetOpen(false)}
        onSave={saveSheet}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#08080c' },
  content: { padding: 20, paddingBottom: 40 },
  date: { fontSize: 12.5, color: '#8a8a99' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  greeting: { fontSize: 28, fontWeight: '700', color: '#f4f4f7', letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: '#8a8a99', marginTop: 6 },
  badgeRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: 20, backgroundColor: 'rgba(240,169,60,.1)', borderWidth: 1, borderColor: 'rgba(240,169,60,.28)',
  },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: '#f0c078' },
  energyPill: {
    marginTop: 18, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.035)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  energyPillLabel: { fontSize: 11.5, color: '#8a8a99' },
  energyPillValue: { fontSize: 14, fontWeight: '700', color: '#f4f4f7', marginTop: 2 },
  pointsCard: {
    marginTop: 16, padding: 18, borderRadius: 18, backgroundColor: 'rgba(139,109,255,.1)',
    borderWidth: 1, borderColor: 'rgba(139,109,255,.28)', flexDirection: 'row', alignItems: 'baseline', gap: 6,
  },
  pointsValue: { fontSize: 28, fontWeight: '800', color: '#c9baff' },
  pointsLabel: { fontSize: 13, color: '#a58cff' },

  backdrop: { flex: 1, backgroundColor: 'rgba(6,6,10,.75)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86%',
    backgroundColor: '#101018', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,.12)', padding: 20,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#f4f4f7' },
  sheetSub: { fontSize: 12, color: '#7a7a8a', marginTop: 6 },
  closeX: { fontSize: 15, color: '#8a8a99', padding: 4 },
  energyRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  energyCard: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.08)',
  },
  energyCardOn: { backgroundColor: 'rgba(124,92,255,.12)', borderColor: 'rgba(124,92,255,.6)' },
  energyCardLabel: { fontSize: 13.5, fontWeight: '700', color: '#f4f4f7', marginTop: 6 },
  sheetActions: { flexDirection: 'row', gap: 11, marginTop: 18, paddingBottom: 8 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.055)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '650', color: '#f4f4f7' },
  saveBtn: {
    flex: 1.3, height: 50, borderRadius: 15, backgroundColor: '#7856ff', alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
