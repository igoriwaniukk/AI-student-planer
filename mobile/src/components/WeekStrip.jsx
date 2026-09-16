import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WEEK_DAYS, realDateForNum } from '../lib/plannerData';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';

// Simplified from the web version: no swipe-between-weeks gesture (that used
// pointer drag events specific to the web), just the current 7-day window
// with tap-to-select — streakCount still highlights the most recent days.
export default function WeekStrip({ selectedDay, onSelect, eventDays, streakCount = 0 }) {
  const { t } = useLang();
  const streakSet = streakCount > 0
    ? new Set(WEEK_DAYS.filter((d) => d.num <= selectedDay && d.num > selectedDay - streakCount).map((d) => d.num))
    : null;

  return (
    <View style={styles.row}>
      {WEEK_DAYS.map(({ num, label, short }) => {
        const on = num === selectedDay;
        const hasEvent = eventDays ? eventDays.has(num) : false;
        const isStreak = streakSet ? streakSet.has(num) : false;
        const shortLabel = t(DAY_KEY[label] + '.short') || short;
        return (
          <Pressable key={num} onPress={onSelect ? () => onSelect(num) : undefined} style={styles.dayCol}>
            <View style={[styles.dayPill, on && styles.dayPillOn, isStreak && !on && styles.dayPillStreak]}>
              <Text style={[styles.dayLabel, on && styles.dayLabelOn]}>{shortLabel}</Text>
              <Text style={[styles.dayNum, on && styles.dayNumOn]}>{realDateForNum(num).getDate()}</Text>
            </View>
            {isStreak && !on ? (
              <Text style={{ fontSize: 9 }}>🔥</Text>
            ) : (
              <View style={[styles.dot, hasEvent && !on && styles.dotOn]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3 },
  dayCol: { flex: 1, alignItems: 'center', gap: 5 },
  dayPill: {
    alignItems: 'center', gap: 3, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 999,
    borderWidth: 1, borderColor: 'transparent', width: '100%',
  },
  dayPillOn: { backgroundColor: '#7856ff' },
  dayPillStreak: { backgroundColor: 'rgba(245,101,36,.14)', borderColor: 'rgba(245,101,36,.38)' },
  dayLabel: { fontSize: 10, fontWeight: '650', color: '#7a7a8a', letterSpacing: 0.6 },
  dayLabelOn: { color: 'rgba(255,255,255,.85)' },
  dayNum: { fontSize: 17, fontWeight: '700', color: '#f4f4f7' },
  dayNumOn: { fontWeight: '750' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: '#2ee6c5' },
});
