import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../lib/useLang';
import { DAY_KEY, VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { GOALS, IMPORTANCE_OPTIONS, REFERENCE_DAY } from '../lib/plannerData';
import { span, fmt, computeStreak, computeTotalPoints, dayInfo, upcomingExams, examProgressMinutes, formatMonthDay, weekdayOn } from '../lib/plannerLogic';
import { ACHIEVEMENTS, computeUnlockedAchievements } from '../lib/achievements';
import { useLastSeenStreak, useSeenAchievements } from '../lib/storage';
import WeekStrip from '../components/WeekStrip';
import { AchievementMedal, BottomSheet, Chip, Pill, ProgressBar, StatusPill } from '../components/ui';

const DEFAULT_EXAM_GOAL = { grade: GOALS[2], studyMinutes: 120, importance: 'Średni' };
const ENERGY_OPTIONS = [['Niska', '🔋'], ['Normalna', '⚡'], ['Wysoka', '🔥']];

function AchievementModal({ achievement, onClose }) {
  const { t } = useLang();
  if (!achievement) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerBackdrop}>
        <View style={styles.centerCard}>
          <Text style={{ fontSize: 40 }}>{achievement.icon}</Text>
          <Text style={styles.achUnlocked}>{t('home.achievementUnlocked')}</Text>
          <Text style={styles.achTitle}>{t(achievement.titleKey)}</Text>
          <Text style={styles.achDesc}>{t(achievement.descKey)}</Text>
          <Pressable onPress={onClose} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('home.great')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function StreakNotice({ notice, onDismiss }) {
  const { t } = useLang();
  if (!notice) return null;
  const broken = notice.type === 'broken';
  return (
    <View style={[styles.notice, broken ? styles.noticeBroken : styles.noticeGood]}>
      <Text style={{ fontSize: 18 }}>{broken ? '💔' : '🎉'}</Text>
      <Text style={styles.noticeText}>{notice.text}</Text>
      <Pressable onPress={onDismiss}>
        <Text style={[styles.noticeOk, { color: broken ? '#f7c46c' : '#8ff0de' }]}>{t('home.ok')}</Text>
      </Pressable>
    </View>
  );
}

function StreakCard({ streak, selectedDay, onSelectDay, eventDays }) {
  const { t } = useLang();
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <Text style={styles.sectionLabel}>{t('home.streak')}</Text>
        <View style={styles.streakBadge}>
          <Text style={{ fontSize: 12.5 }}>🔥</Text>
          <Text style={styles.streakNum}>{streak}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <WeekStrip selectedDay={selectedDay} onSelect={onSelectDay} streakCount={streak} eventDays={eventDays} />
      </View>
    </View>
  );
}

function GoalPromptCard({ planner, exam }) {
  const { t } = useLang();
  const { answerGoalPrompt, dismissGoalPrompt } = planner;
  const [step, setStep] = useState(0);
  const [importance, setImportance] = useState('');
  const [grade, setGrade] = useState('');
  const canSave = importance && grade;

  return (
    <View style={styles.goalCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text style={{ fontSize: 16 }}>🎯</Text>
        <Text style={styles.goalTitle}>{t('home.examSoon', { subject: t(VALUE_KEY[exam.subject]) || exam.subject })}</Text>
      </View>
      <Text style={styles.goalDesc}>
        {t('home.examSoonDesc', { title: t(VALUE_KEY[exam.title]) || exam.title, when: exam.daysUntil === 1 ? t('cal.tomorrowPill').toLowerCase() : t('cal.inDaysPill', { n: exam.daysUntil }).toLowerCase() })}
      </Text>
      {step === 0 ? (
        <>
          <Text style={styles.miniLabel}>{t('goals.howImportantQ')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {IMPORTANCE_OPTIONS.map((imp) => (
              <Chip key={imp} label={t(VALUE_KEY[imp]) || imp} active={importance === imp} onPress={() => { setImportance(imp); setStep(1); }} style={{ flex: 1, alignItems: 'center' }} />
            ))}
          </View>
          <Pressable onPress={() => dismissGoalPrompt(exam.id)} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{t('home.later')}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.rowBetween}>
            <Text style={styles.miniLabel}>{t('home.whatGradeWant')}</Text>
            <Pressable onPress={() => setStep(0)}><Text style={styles.linkText}>‹ {t('home.back')}</Text></Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map((g) => (
              <Chip key={g} label={t(VALUE_KEY[g]) || g} active={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 11, marginTop: 16 }}>
            <Pressable onPress={() => dismissGoalPrompt(exam.id)} style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}>
              <Text style={styles.secondaryBtnText}>{t('home.later')}</Text>
            </Pressable>
            <Pressable
              disabled={!canSave}
              onPress={() => canSave && answerGoalPrompt(exam.id, { importance, grade })}
              style={[styles.primaryBtnSm, { flex: 1.3, opacity: canSave ? 1 : 0.4 }]}
            >
              <Text style={styles.primaryBtnText}>{t('home.saveGoal')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function SessionTimer({ state, dur, dismissBreakReminder }) {
  const { t } = useLang();
  const [now, setNow] = useState(() => Date.now());
  const paused = !state.sessionStart;

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const elapsedMs = state.sessionElapsedMs + (paused ? 0 : now - state.sessionStart);
  const totalMs = dur * 60000;
  const remainingMs = totalMs - elapsedMs;
  const overtime = remainingMs < 0;
  const displayMs = Math.abs(remainingMs);
  const mm = Math.floor(displayMs / 60000);
  const ss = Math.floor((displayMs % 60000) / 1000);
  const label = (overtime ? '+' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  const pct = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
  const showBreak = !paused && !overtime && !state.breakDismissed && elapsedMs >= 25 * 60000 && dur >= 40;

  return (
    <View style={{ marginTop: 14 }}>
      <View style={styles.rowBaseline}>
        <Text style={{ fontSize: 11, color: '#8a8a99' }}>{overtime ? t('home.overtime') : t('home.remaining')}</Text>
        <Text style={[styles.timerLabel, overtime && { color: '#f5a524' }]}>{label}</Text>
      </View>
      <ProgressBar pct={pct} fill={overtime ? '#f5a524' : '#7c5cff'} style={{ marginTop: 8 }} />
      {showBreak && (
        <View style={styles.breakCard}>
          <Text style={{ fontSize: 15 }}>🌿</Text>
          <Text style={styles.breakText}>{t('home.breakReminder')}</Text>
          <Pressable onPress={dismissBreakReminder}><Text style={{ fontSize: 12, fontWeight: '650', color: '#8ff0de' }}>{t('home.ok')}</Text></Pressable>
        </View>
      )}
    </View>
  );
}

function SmallBtn({ label, onPress, accent }) {
  return (
    <Pressable onPress={onPress} style={[styles.smallBtn, accent && styles.smallBtnAccent]}>
      <Text style={styles.smallBtnText}>{label}</Text>
    </Pressable>
  );
}

function NextSessionCard({ planner }) {
  const { t } = useLang();
  const { state, def, ts, startSession, isBeforeScheduledStart, togglePause, openFinish, openBlockEdit, update } = planner;
  const sched = state.schedule || {};
  const ids = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const active = state.activeTask;
  const nextId = active || ids.filter((id) => ['planned', 'paused'].includes(ts(id).status))[0];

  if (!nextId) {
    const done = ids.filter((id) => ts(id).status === 'completed').length;
    return (
      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>{done ? t('home.allDone') : t('home.noSessionsPlanned')}</Text>
        <Text style={styles.nextSub}>{done ? t('home.allDoneSub') : t('home.noSessionsPlannedSub')}</Text>
        <Pressable onPress={() => update({ screen: done ? 'summary' : 'planner', dayEnded: true })} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{done ? t('home.summarizeDay') : t('home.planDay')}</Text>
        </Pressable>
      </View>
    );
  }

  const d = def(nextId);
  const b = sched[nextId];
  const st = ts(nextId);
  const running = st.status === 'in_progress' || st.status === 'paused';

  return (
    <View style={styles.nextCard}>
      <View style={styles.rowBetween}>
        <View style={styles.statusTag}>
          <Text style={styles.statusTagText}>{running ? t('home.sessionInProgress') : t('home.nextSession')}</Text>
        </View>
        <Text style={{ fontSize: 11.5, fontWeight: '650', color: st.status === 'paused' ? '#f5a524' : '#8a8a99' }}>
          {st.status === 'paused' ? t('home.paused') : span(b.start, b.start + b.dur)}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '650', color: d.color, marginTop: 14 }}>{t(VALUE_KEY[d.subject]) || d.subject}</Text>
      <Text style={styles.nextSessionTitle}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <Pill text={b.dur + ' min'} color="#2ee6c5" bg="rgba(46,230,197,.13)" />
        {d.deadline && <Pill text={t(TASK_TEXT_KEY[d.id]?.deadline) || d.deadline} color="#f5a524" bg="rgba(245,165,36,.13)" />}
      </View>
      {running ? (
        <>
          <SessionTimer state={state} dur={b.dur} dismissBreakReminder={planner.dismissBreakReminder} />
          <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
            <SmallBtn label={st.status === 'paused' ? t('home.resume') : t('home.pause')} onPress={() => togglePause(nextId)} />
            <SmallBtn label={t('home.reschedule')} onPress={() => openBlockEdit(nextId)} />
            <SmallBtn label={t('home.finish')} accent onPress={() => openFinish(nextId, b.dur)} />
          </View>
        </>
      ) : isBeforeScheduledStart(nextId) ? (
        <View style={[styles.primaryBtn, { height: 52, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' }]}>
          <Text style={{ fontSize: 14, fontWeight: '650', color: '#8a8a99' }}>{t('home.startsAt', { time: fmt(b.start) })}</Text>
        </View>
      ) : (
        <Pressable onPress={() => startSession(nextId)} style={[styles.primaryBtn, { height: 52 }]}>
          <Text style={styles.primaryBtnText}>{t('home.startSession')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function DayPlanPlaceholder({ info, onPlan }) {
  const { t } = useLang();
  return (
    <View style={styles.nextCard}>
      <Text style={{ fontSize: 13, fontWeight: '650', color: '#c9baff' }}>{t(DAY_KEY[info.label]) || info.label}, {info.monthDay}</Text>
      <Text style={styles.nextTitle}>{t('home.noPlanForDay')}</Text>
      <Pressable onPress={onPlan} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>{t('home.planThisDay')}</Text>
      </Pressable>
    </View>
  );
}

function TodayList({ planner }) {
  const { t } = useLang();
  const { state, def, ts } = planner;
  const sched = state.schedule || {};
  const ids = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const rows = ids.map((id) => {
    const d = def(id);
    const b = sched[id];
    const st = ts(id);
    return (
      <View key={id} style={[styles.taskRow, st.status === 'in_progress' && styles.taskRowActive]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 11, color: '#8a8a99' }}>{span(b.start, b.start + b.dur)}</Text>
          <Text style={styles.taskRowTitle}>{t(TASK_TEXT_KEY[d.id]?.short) || d.short}</Text>
        </View>
        <StatusPill status={st.status} />
      </View>
    );
  });
  state.taskDefs.forEach((d) => {
    const st = ts(d.id);
    if (st.status !== 'moved' && st.status !== 'skipped') return;
    rows.push(
      <View key={'x' + d.id} style={styles.taskRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 11, color: '#8a8a99' }}>{st.status === 'moved' ? t('home.movedOther') : t('home.notInPlan')}</Text>
          <Text style={styles.taskRowTitle}>{t(TASK_TEXT_KEY[d.id]?.short) || d.short}</Text>
        </View>
        <StatusPill status={st.status} />
      </View>
    );
  });
  if (!rows.length) return <Text style={{ fontSize: 12.5, color: '#6f6f7d' }}>{t('home.noSessionsToday2')}</Text>;
  return <View style={{ gap: 9 }}>{rows}</View>;
}

function FinishSheet({ planner }) {
  const { t } = useLang();
  const { state, def, cancelFinish, confirmFinish, update } = planner;
  const HARD = ['Łatwa', 'W sam raz', 'Trudna'];
  const KNOW = ['Nie umiem', 'Częściowo umiem', 'Dobrze umiem', 'Opanowane'];
  const d = state.finishTask ? def(state.finishTask) : null;
  return (
    <BottomSheet visible={!!state.finishTask} onRequestClose={cancelFinish} scrollable>
      {d && (
        <>
          <Text style={styles.sheetTitle}>{t('home.finishSession', { title: t(TASK_TEXT_KEY[d.id]?.title) || d.title })}</Text>
          <Text style={styles.sheetSub}>{t('home.finishSessionSub')}</Text>
          <Text style={styles.miniLabel}>{t('home.actualTime')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Pressable onPress={() => update((s) => ({ finishDur: Math.max(5, s.finishDur - 5) }))} style={styles.stepBtn}>
              <Text style={{ fontSize: 19, color: '#f4f4f7' }}>−</Text>
            </Pressable>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: '750', color: '#f4f4f7' }}>{state.finishDur} min</Text>
            <Pressable onPress={() => update((s) => ({ finishDur: s.finishDur + 5 }))} style={styles.stepBtn}>
              <Text style={{ fontSize: 19, color: '#f4f4f7' }}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.miniLabel}>{t('home.howHard')}</Text>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            {HARD.map((x) => (
              <Pressable key={x} onPress={() => update({ finishHard: x })} style={[styles.optionBtn, state.finishHard === x && styles.optionBtnActive]}>
                <Text style={[styles.optionBtnText, state.finishHard === x && styles.optionBtnTextActive]}>{t(VALUE_KEY[x]) || x}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.miniLabel}>{t('home.howWell')}</Text>
          <View style={{ gap: 9 }}>
            {KNOW.map((x) => (
              <Pressable key={x} onPress={() => update({ finishKnow: x })} style={[styles.listOption, state.finishKnow === x && styles.optionBtnActive]}>
                <Text style={[styles.optionBtnText, state.finishKnow === x && styles.optionBtnTextActive]}>{t(VALUE_KEY[x]) || x}</Text>
                {state.finishKnow === x && <Text style={{ color: '#a58cff' }}>✓</Text>}
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 11, marginTop: 18, paddingBottom: 8 }}>
            <Pressable onPress={cancelFinish} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>{t('home.cancel')}</Text></Pressable>
            <Pressable onPress={confirmFinish} style={[styles.saveBtn, { flex: 1.4 }]}><Text style={styles.saveBtnText}>{t('home.finishSessionBtn')}</Text></Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

function EnergySheet({ planner, logEnergy }) {
  const { t } = useLang();
  const { state, cancelEnergySheet, saveEnergySheet, update } = planner;
  return (
    <BottomSheet visible={!!state.energySheet} onRequestClose={cancelEnergySheet}>
      <View style={styles.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>{t('home.energyPickerTitle')}</Text>
          <Text style={styles.sheetSub}>{t('home.energyPickerSub')}</Text>
        </View>
        <Pressable onPress={cancelEnergySheet} hitSlop={10}><Text style={styles.closeX}>✕</Text></Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        {ENERGY_OPTIONS.map(([name, icon]) => {
          const on = state.energyDraft === name;
          return (
            <Pressable key={name} onPress={() => update({ energyDraft: name })} style={[styles.energyCard, on && styles.energyCardOn]}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
              <Text style={styles.energyCardLabel}>{t(VALUE_KEY[name]) || name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <Pressable onPress={cancelEnergySheet} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>{t('home.cancel')}</Text></Pressable>
        <Pressable onPress={() => { logEnergy(state.energyDraft); saveEnergySheet(); }} style={[styles.saveBtn, { flex: 1.3 }]}><Text style={styles.saveBtnText}>{t('home.save')}</Text></Pressable>
      </View>
    </BottomSheet>
  );
}

export default function Home({ planner, studentName, energyLog = [], logEnergy = () => {}, studyHistory = {}, recurringActivities = [] }) {
  const { t } = useLang();
  const { state, ts, openEnergySheet } = planner;
  const [seenAchievements, setSeenAchievements] = useSeenAchievements();
  const [lastSeenStreak, setLastSeenStreak] = useLastSeenStreak();
  const [viewDay, setViewDay] = useState(state.selectedDay);
  const info = dayInfo(viewDay);
  const isRealDay = viewDay === state.selectedDay;
  const dateLong = t('home.dateLong', { day: t(DAY_KEY[info.label]) || info.label, date: formatMonthDay(viewDay, { year: true }) });
  const firstName = (studentName || 'Ty').trim().split(/\s+/)[0];

  const dayIds = state.taskDefs.filter((d) => state.tasks[d.id]).map((d) => d.id);
  const doneCount = dayIds.filter((id) => ts(id).status === 'completed').length;
  const totalCount = dayIds.filter((id) => ts(id).status !== 'skipped').length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const streak = computeStreak(studyHistory);
  const points = computeTotalPoints(studyHistory, energyLog);
  const stats = {
    streak, points,
    completedDays: Object.values(studyHistory).filter((e) => e.completed).length,
    energyCheckins: energyLog.length,
    recurringCount: recurringActivities.length,
  };
  const unlockedAchievements = computeUnlockedAchievements(stats);
  const newlyUnlocked = unlockedAchievements.filter((a) => !seenAchievements.includes(a.id));
  const pendingAchievement = newlyUnlocked[0] || null;
  const streakNotice =
    lastSeenStreak > 0 && streak < lastSeenStreak
      ? { type: 'broken', text: t('home.streakEndedTitle', { n: lastSeenStreak, word: t(lastSeenStreak === 1 ? 'day.one' : 'day.many') }) }
      : streak > lastSeenStreak
        ? { type: 'milestone', text: t('home.streakMilestone', { n: streak }) }
        : null;

  const [deadlinesOpen, setDeadlinesOpen] = useState(false);
  const [openBadge, setOpenBadge] = useState(null);
  const toggleBadge = (key) => setOpenBadge((cur) => (cur === key ? null : key));
  const upcoming = upcomingExams(state).filter((e) => e.daysUntil >= 0);
  const nearestExam = upcoming[0] || null;
  const goalExam = planner.nextGoalPrompt();

  const examPct = (exam) => {
    const goal = state.examGoals?.[exam.id] || DEFAULT_EXAM_GOAL;
    return goal.studyMinutes ? Math.min(100, Math.round((examProgressMinutes(state, exam.id) / goal.studyMinutes) * 100)) : 0;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{dateLong}</Text>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>{t('home.greeting', { name: firstName })}</Text>
        <Text style={{ fontSize: 22 }}>👋</Text>
      </View>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <View style={styles.badgeRow}>
        <Pressable onPress={() => toggleBadge('achievements')} style={styles.badge}>
          <Text style={{ fontSize: 12 }}>🎖️</Text>
          <Text style={styles.badgeText}>{t('home.badgesCount', { n: unlockedAchievements.length, total: ACHIEVEMENTS.length })}</Text>
        </Pressable>
        {isRealDay && (
          <Pressable onPress={() => toggleBadge('progress')} style={[styles.badge, styles.badgeGreen]}>
            <Text style={{ fontSize: 12 }}>📊</Text>
            <Text style={[styles.badgeText, { color: '#7fe8cf' }]}>{t('home.todayProgressBadge', { pct, done: doneCount, total: totalCount })}</Text>
          </Pressable>
        )}
        {nearestExam && (
          <Pressable onPress={() => toggleBadge('goal')} style={[styles.badge, styles.badgePurple]}>
            <Text style={{ fontSize: 12 }}>🎯</Text>
            <Text style={[styles.badgeText, { color: '#c9baff' }]}>{t('home.weekGoalBadge', { subject: t(VALUE_KEY[nearestExam.subject]) || nearestExam.subject, pct: examPct(nearestExam) })}</Text>
          </Pressable>
        )}
      </View>

      {openBadge === 'achievements' && (
        <View style={styles.popover}>
          <View style={styles.rowBetween}>
            <Text style={styles.popoverTitle}>{t('profile.achievements')}</Text>
            <Pressable onPress={() => setOpenBadge(null)}><Text style={styles.closeX}>×</Text></Pressable>
          </View>
          <View style={styles.medalGrid}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedAchievements.some((u) => u.id === a.id);
              return (
                <View key={a.id} style={{ width: '30%', alignItems: 'center' }}>
                  <AchievementMedal icon={a.icon} unlocked={unlocked} size={32} />
                  <Text style={{ fontSize: 9, fontWeight: '650', marginTop: 5, color: unlocked ? '#f7dfa8' : '#6f6f7d', textAlign: 'center' }}>{t(a.titleKey)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
      {openBadge === 'progress' && (
        <View style={styles.popover}>
          <View style={styles.rowBetween}>
            <Text style={styles.popoverTitle}>{t('home.todayProgress')}</Text>
            <Pressable onPress={() => setOpenBadge(null)}><Text style={styles.closeX}>×</Text></Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 11 }}>
            <Text style={{ fontSize: 24, fontWeight: '750', color: '#2ee6c5' }}>{pct}%</Text>
            <Text style={{ fontSize: 11.5, color: '#8a8a99' }}>{t('home.sessionsDone', { done: doneCount, total: totalCount, word: t(totalCount === 1 ? 'home.sessionsCompletedOne' : 'home.sessionsCompletedMany') })}</Text>
          </View>
          <ProgressBar pct={pct} style={{ marginTop: 11 }} />
          <View style={{ marginTop: 13 }}><TodayList planner={planner} /></View>
        </View>
      )}

      <StreakCard streak={streak} selectedDay={viewDay} onSelectDay={setViewDay} eventDays={new Set(upcoming.map((e) => e.day))} />
      <StreakNotice notice={streakNotice} onDismiss={() => setLastSeenStreak(streak)} />

      {goalExam && <GoalPromptCard key={goalExam.id} planner={planner} exam={goalExam} />}

      {isRealDay ? (
        <>
          <NextSessionCard planner={planner} />
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{t('home.todayPlan')}</Text>
            <View style={{ marginTop: 12 }}><TodayList planner={planner} /></View>
            <Pressable onPress={() => planner.go('plan')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <Text style={styles.linkText}>{t('home.seeFullPlan')} ›</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <DayPlanPlaceholder info={info} onPlan={() => planner.go('planner')} />
      )}

      <Pressable onPress={openEnergySheet} style={styles.energyPill}>
        <Text style={{ fontSize: 20 }}>🔋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.energyPillLabel}>{t('home.energyLevel')}</Text>
          <Text style={styles.energyPillValue}>{t('home.energyValue', { level: t(VALUE_KEY[state.energy]) || state.energy })}</Text>
        </View>
        <View style={styles.changeBtn}><Text style={styles.changeBtnText}>{t('home.change')} ▼</Text></View>
      </Pressable>

      {nearestExam && (
        <Pressable onPress={() => setDeadlinesOpen(true)} style={styles.deadlineCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deadlineLabel}>{t('home.nextDeadline')}</Text>
            <Text style={styles.deadlineTitle}>{t(VALUE_KEY[nearestExam.title]) || nearestExam.title}</Text>
            <Text style={styles.deadlineWhen}>{nearestExam.daysUntil === 1 ? t('cal.tomorrowPill') : t('cal.inDaysPill', { n: nearestExam.daysUntil })}</Text>
          </View>
        </Pressable>
      )}

      <BottomSheet visible={deadlinesOpen} onRequestClose={() => setDeadlinesOpen(false)} scrollable>
        <View style={styles.rowBetween}>
          <Text style={styles.sheetTitle}>{t('home.allDeadlines')}</Text>
          <Pressable onPress={() => setDeadlinesOpen(false)}><Text style={styles.linkText}>{t('notif.close')}</Text></Pressable>
        </View>
        <View style={{ gap: 12, marginTop: 16, paddingBottom: 8 }}>
          {upcoming.length ? upcoming.map((exam) => (
            <View key={exam.id} style={styles.deadlineListItem}>
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: 10.5, fontWeight: '750', color: exam.color }}>{(t(VALUE_KEY[exam.subject]) || exam.subject).toUpperCase()}</Text>
                <Pill text={exam.daysUntil === 1 ? t('cal.tomorrowPill') : t('cal.inDaysPill', { n: exam.daysUntil })} color="#f5a524" bg="rgba(245,165,36,.15)" />
              </View>
              <Text style={{ fontSize: 14.5, fontWeight: '700', marginTop: 6, color: '#f4f4f7' }}>{t(VALUE_KEY[exam.title]) || exam.title}</Text>
            </View>
          )) : <Text style={{ fontSize: 12.5, color: '#8a8a99' }}>{t('cal.noUpcoming')}</Text>}
        </View>
      </BottomSheet>

      <Text style={[styles.sectionLabel, { marginTop: 20, marginBottom: 10 }]}>{t('home.quickActions')}</Text>
      <Pressable onPress={() => planner.go('planner')} style={styles.actionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{t('home.planTomorrow')}</Text>
          <Text style={styles.actionSub}>{t('home.planTomorrowSub', { weekday: weekdayOn(REFERENCE_DAY) })}</Text>
        </View>
      </Pressable>
      <Pressable onPress={() => planner.go('rescue')} style={[styles.actionRow, { marginTop: 12 }]}>
        <Text style={styles.actionTitleSm}>{t('home.rescueDay')}</Text>
      </Pressable>

      <FinishSheet planner={planner} />
      <EnergySheet planner={planner} logEnergy={logEnergy} />
      <AchievementModal achievement={pendingAchievement} onClose={() => setSeenAchievements(seenAchievements.concat(pendingAchievement.id))} />
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
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: 20, backgroundColor: 'rgba(240,169,60,.1)', borderWidth: 1, borderColor: 'rgba(240,169,60,.28)',
  },
  badgeGreen: { backgroundColor: 'rgba(46,230,197,.1)', borderColor: 'rgba(46,230,197,.28)' },
  badgePurple: { backgroundColor: 'rgba(165,140,255,.1)', borderColor: 'rgba(165,140,255,.28)' },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: '#f0c078' },
  popover: { marginTop: 10, maxWidth: 320, padding: 15, borderRadius: 16, backgroundColor: '#14141c', borderWidth: 1, borderColor: 'rgba(240,169,60,.3)' },
  popoverTitle: { fontSize: 13.5, fontWeight: '750', color: '#f4f4f7' },
  medalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'space-between' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  closeX: { fontSize: 16, color: '#6b6b7a', padding: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '750', letterSpacing: 1.2, color: '#7a7a8a' },
  streakCard: { marginTop: 14, padding: 15, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  streakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(245,165,36,.14)', borderWidth: 1, borderColor: 'rgba(245,165,36,.3)' },
  streakNum: { fontSize: 13, fontWeight: '750', color: '#f4f4f7' },
  notice: { marginTop: 12, padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  noticeBroken: { backgroundColor: 'rgba(245,165,36,.08)', borderColor: 'rgba(245,165,36,.3)' },
  noticeGood: { backgroundColor: 'rgba(46,230,197,.08)', borderColor: 'rgba(46,230,197,.3)' },
  noticeText: { flex: 1, fontSize: 12.5, color: '#f4f4f7', lineHeight: 17 },
  noticeOk: { fontSize: 12, fontWeight: '650' },
  goalCard: { marginTop: 18, padding: 16, borderRadius: 20, backgroundColor: 'rgba(124,92,255,.08)', borderWidth: 1.5, borderColor: 'rgba(124,92,255,.35)' },
  goalTitle: { fontSize: 13.5, fontWeight: '700', color: '#f4f4f7' },
  goalDesc: { fontSize: 12, color: '#a3a3b3', marginTop: 6, lineHeight: 17 },
  miniLabel: { fontSize: 11, fontWeight: '750', letterSpacing: 0.8, color: '#7a7a8a', marginTop: 14, marginBottom: 8 },
  linkText: { fontSize: 12.5, fontWeight: '650', color: '#a58cff' },
  secondaryBtn: { marginTop: 16, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '650', color: '#f4f4f7' },
  nextCard: { marginTop: 18, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(124,92,255,.55)', backgroundColor: 'rgba(124,92,255,.08)' },
  nextTitle: { fontSize: 18, fontWeight: '750', color: '#f4f4f7', letterSpacing: -0.2 },
  nextSub: { fontSize: 12.5, color: '#a3a3b3', marginTop: 8, lineHeight: 17 },
  nextSessionTitle: { fontSize: 22, fontWeight: '750', lineHeight: 27, letterSpacing: -0.3, marginTop: 8, color: '#f4f4f7' },
  statusTag: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(124,92,255,.22)', borderWidth: 1, borderColor: 'rgba(124,92,255,.4)' },
  statusTagText: { fontSize: 9.5, fontWeight: '750', letterSpacing: 1, color: '#c9baff' },
  primaryBtn: { marginTop: 14, height: 50, borderRadius: 15, backgroundColor: '#7856ff', alignItems: 'center', justifyContent: 'center' },
  primaryBtnSm: { height: 44, borderRadius: 14, backgroundColor: '#7856ff', alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  timerLabel: { fontSize: 28, fontWeight: '750', color: '#f4f4f7' },
  breakCard: { marginTop: 11, padding: 11, borderRadius: 13, backgroundColor: 'rgba(46,230,197,.08)', borderWidth: 1, borderColor: 'rgba(46,230,197,.25)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakText: { flex: 1, fontSize: 12, color: '#c9c9d6', lineHeight: 16 },
  smallBtn: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  smallBtnAccent: { backgroundColor: '#7856ff', borderWidth: 0 },
  smallBtnText: { fontSize: 13, fontWeight: '650', color: '#f4f4f7' },
  sectionCard: { marginTop: 12, padding: 15, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,.06)' },
  taskRowActive: { backgroundColor: 'rgba(124,92,255,.08)', borderColor: 'rgba(124,92,255,.5)', borderWidth: 1.5 },
  taskRowTitle: { fontSize: 13.5, fontWeight: '700', marginTop: 2, color: '#f4f4f7' },
  energyPill: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  energyPillLabel: { fontSize: 11.5, color: '#8a8a99' },
  energyPillValue: { fontSize: 14, fontWeight: '700', color: '#f4f4f7', marginTop: 2 },
  changeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11, backgroundColor: 'rgba(124,92,255,.18)', borderWidth: 1, borderColor: 'rgba(124,92,255,.35)' },
  changeBtnText: { fontSize: 12.5, fontWeight: '650', color: '#c9baff' },
  deadlineCard: { marginTop: 12, padding: 15, borderRadius: 18, backgroundColor: 'rgba(245,165,36,.06)', borderWidth: 1, borderColor: 'rgba(245,165,36,.22)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  deadlineLabel: { fontSize: 9.5, fontWeight: '750', letterSpacing: 1, color: '#7a7a8a' },
  deadlineTitle: { fontSize: 14, fontWeight: '700', marginTop: 4, color: '#f4f4f7' },
  deadlineWhen: { fontSize: 12, fontWeight: '650', color: '#f5a524', marginTop: 2 },
  deadlineListItem: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(245,165,36,.06)', borderWidth: 1, borderColor: 'rgba(245,165,36,.22)' },
  actionRow: { padding: 15, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  actionTitle: { fontSize: 14.5, fontWeight: '700', color: '#f4f4f7' },
  actionTitleSm: { fontSize: 13.5, fontWeight: '700', color: '#f4f4f7' },
  actionSub: { fontSize: 12, color: '#8a8a99', marginTop: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#f4f4f7' },
  sheetSub: { fontSize: 12, color: '#7a7a8a', marginTop: 6 },
  energyCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.08)' },
  energyCardOn: { backgroundColor: 'rgba(124,92,255,.12)', borderColor: 'rgba(124,92,255,.6)' },
  energyCardLabel: { fontSize: 13.5, fontWeight: '700', color: '#f4f4f7', marginTop: 6 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '650', color: '#f4f4f7' },
  saveBtn: { flex: 1, height: 50, borderRadius: 15, backgroundColor: '#7856ff', alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  optionBtn: { flex: 1, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.09)' },
  optionBtnActive: { backgroundColor: 'rgba(124,92,255,.14)', borderColor: 'rgba(124,92,255,.6)' },
  optionBtnText: { fontSize: 13, fontWeight: '650', color: '#c9c9d6' },
  optionBtnTextActive: { color: '#e6dfff', fontWeight: '700' },
  listOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,.06)' },
  closeXLg: { fontSize: 15, color: '#8a8a99', padding: 4 },
  centerBackdrop: { flex: 1, backgroundColor: 'rgba(6,6,10,.8)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerCard: { width: '100%', maxWidth: 340, padding: 28, borderRadius: 24, backgroundColor: '#101018', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center' },
  achUnlocked: { fontSize: 11, fontWeight: '750', letterSpacing: 1, color: '#f0c078', marginTop: 10 },
  achTitle: { fontSize: 19, fontWeight: '750', marginTop: 8, color: '#f4f4f7', textAlign: 'center' },
  achDesc: { fontSize: 13, color: '#a3a3b3', marginTop: 8, textAlign: 'center', lineHeight: 18 },
});
