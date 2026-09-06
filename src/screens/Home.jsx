import { useEffect, useState } from 'react';
import { STATUS_COLOR, GOALS, IMPORTANCE_OPTIONS, WEEK_DAYS, TENIS_DAY } from '../lib/plannerData';
import { span, hm, upcomingExams, computeStreak, computeTotalPoints } from '../lib/plannerLogic';
import { computeUnlockedAchievements } from '../lib/achievements';
import { useSeenAchievements, useLastSeenStreak } from '../lib/store';
import { DAY_KEY, VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import WeekStrip from '../components/WeekStrip';
import { Pill, BottomSheet, EnergyPicker, Chip, AnimatedNumber } from '../components/ui';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function AchievementModal({ achievement, onClose }) {
  const { t } = useLang();
  if (!achievement) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(6,6,10,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 340, padding: 28, borderRadius: 24, background: '#101018', border: '1px solid rgba(255,255,255,.1)', textAlign: 'center', animation: 'stepIconPop .4s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>{achievement.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.1em', color: '#f5a524' }}>{t('home.newAchievement')}</div>
        <div style={{ fontSize: 19, fontWeight: 750, marginTop: 8 }}>{t(achievement.titleKey)}</div>
        <div style={{ fontSize: 13, color: '#a3a3b3', marginTop: 8, lineHeight: 1.5 }}>{t(achievement.descKey)}</div>
        <div
          onClick={onClose}
          style={{ marginTop: 20, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          {t('home.great')}
        </div>
      </div>
    </div>
  );
}

function StreakNotice({ notice, onDismiss }) {
  const { t } = useLang();
  if (!notice) return null;
  const broken = notice.type === 'broken';
  return (
    <div
      style={{
        marginTop: 12, padding: 14, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp .3s ease both',
        background: broken ? 'rgba(245,165,36,.08)' : 'rgba(46,230,197,.08)',
        border: '1px solid ' + (broken ? 'rgba(245,165,36,.3)' : 'rgba(46,230,197,.3)'),
      }}
    >
      <span style={{ fontSize: 18 }}>{broken ? '💔' : '🎉'}</span>
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>{notice.text}</div>
      <span onClick={onDismiss} style={{ fontSize: 12, fontWeight: 650, color: broken ? '#f7c46c' : '#8ff0de', cursor: 'pointer', flex: 'none' }}>{t('home.ok')}</span>
    </div>
  );
}

function dayLoad(state, dayNum) {
  const info = WEEK_DAYS.find((d) => d.num === dayNum);
  let load = info?.school ? 1 : 0;
  if (dayNum === TENIS_DAY) load += 1;
  load += upcomingExams(state).filter((e) => e.day === dayNum).length * 2;
  return load;
}

// Combines the streak count with the week strip so the days that make up
// the streak are visible right where the count is, instead of a plain
// number with the calendar buried further down the page.
function StreakCard({ streak, selectedDay }) {
  const { t } = useLang();
  return (
    <div style={{ marginTop: 14, padding: '13px 15px 10px', borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.streak')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,165,36,.14)', border: '1px solid rgba(245,165,36,.3)' }}>
          <span style={{ fontSize: 12.5, animation: streak > 0 ? 'pulseGlow 1.8s ease-in-out infinite' : 'none' }}>🔥</span>
          <span style={{ fontSize: 13, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}><AnimatedNumber value={streak} /></span>
        </div>
      </div>
      <WeekStrip selectedDay={selectedDay} streakCount={streak} topMargin={12} />
    </div>
  );
}

function MorningSummaryCard({ state }) {
  const { t } = useLang();
  const sched = state.schedule || {};
  const ids = Object.keys(sched);
  const totalMin = ids.reduce((a, id) => a + sched[id].dur, 0);
  const nextExam = upcomingExams(state).filter((e) => e.daysUntil >= 0)[0];
  const loads = WEEK_DAYS.map((d) => ({ ...d, load: dayLoad(state, d.num) }));
  const heaviest = loads.reduce((a, b) => (b.load > a.load ? b : a));
  const lightest = loads.reduce((a, b) => (b.load < a.load ? b : a));
  const whenText = (n) => (n === 0 ? t('home.today') : n === 1 ? t('home.tomorrow') : t('home.inDays', { n }));

  return (
    <div style={{ marginTop: 18, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.morningSummary')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 13 }}>📅</span>
          <span style={{ fontSize: 12.5, color: '#c9c9d6' }}>
            {ids.length
              ? t('home.sessionsToday', { count: ids.length, word: t(ids.length === 1 ? 'home.sessionWord' : 'home.sessionsWordPl'), time: hm(totalMin) })
              : t('home.noSessionsToday')}
          </span>
        </div>
        {nextExam && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 13 }}>⏳</span>
            <span style={{ fontSize: 12.5, color: '#c9c9d6' }}>{t('home.nextExam', { subject: t(VALUE_KEY[nextExam.subject]) || nextExam.subject, when: whenText(nextExam.daysUntil) })}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 12.5, color: '#c9c9d6' }}>{t('home.heaviestLightest', { heavy: t(DAY_KEY[heaviest.label]) || heaviest.label, light: t(DAY_KEY[lightest.label]) || lightest.label })}</span>
        </div>
      </div>
    </div>
  );
}

function GoalPromptCard({ planner, exam }) {
  const { t } = useLang();
  const { answerGoalPrompt, dismissGoalPrompt } = planner;
  const [importance, setImportance] = useState('');
  const [grade, setGrade] = useState('');
  const canSave = importance && grade;

  return (
    <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(124,92,255,.08)', border: '1.5px solid rgba(124,92,255,.35)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 16 }}>🎯</span>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('home.examSoon', { subject: t(VALUE_KEY[exam.subject]) || exam.subject })}</div>
      </div>
      <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 6, lineHeight: 1.45 }}>
        {t('home.examSoonDesc', { title: t(VALUE_KEY[exam.title]) || exam.title, when: exam.daysUntil === 1 ? t('cal.tomorrowPill').toLowerCase() : t('cal.inDaysPill', { n: exam.daysUntil }).toLowerCase() })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '14px 0 8px' }}>{t('goals.howImportantQ')}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {IMPORTANCE_OPTIONS.map((imp) => (
          <Chip key={imp} label={t(VALUE_KEY[imp]) || imp} active={importance === imp} onClick={() => setImportance(imp)} style={{ flex: 1, textAlign: 'center' }} />
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '14px 0 8px' }}>{t('home.whatGradeWant')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {GOALS.map((g) => (
          <Chip key={g} label={t(VALUE_KEY[g]) || g} active={grade === g} onClick={() => setGrade(g)} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 11, marginTop: 16 }}>
        <div onClick={() => dismissGoalPrompt(exam.id)} style={{ flex: 1, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}>{t('home.later')}</div>
        <div
          onClick={() => canSave && answerGoalPrompt(exam.id, { importance, grade })}
          style={{ flex: 1.3, height: 44, borderRadius: 14, background: canSave ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: canSave ? '#fff' : '#6b6b7a', cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          {t('home.saveGoal')}
        </div>
      </div>
    </div>
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
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#8a8a99' }}>{overtime ? t('home.overtime') : t('home.remaining')}</span>
        <span style={{ fontSize: 28, fontWeight: 750, fontVariantNumeric: 'tabular-nums', color: overtime ? '#f5a524' : '#f4f4f7' }}>{label}</span>
      </div>
      <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: overtime ? '#f5a524' : 'linear-gradient(90deg,#7c5cff,#2ee6c5)', transition: 'width .5s ease' }} />
      </div>
      {showBreak && (
        <div style={{ marginTop: 11, padding: 11, borderRadius: 13, background: 'rgba(46,230,197,.08)', border: '1px solid rgba(46,230,197,.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15 }}>🌿</span>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4, color: '#c9c9d6' }}>{t('home.breakReminder')}</div>
          <span onClick={dismissBreakReminder} style={{ fontSize: 12, fontWeight: 650, color: '#8ff0de', cursor: 'pointer' }}>{t('home.ok')}</span>
        </div>
      )}
    </div>
  );
}

function SmallBtn({ label, onClick, accent }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 650, cursor: 'pointer',
        background: accent ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)',
        border: accent ? 'none' : '1px solid rgba(255,255,255,.12)',
      }}
    >
      {label}
    </div>
  );
}

function NextSessionCard({ planner }) {
  const { t } = useLang();
  const { state, def, ts, startSession, togglePause, openFinish, openBlockEdit, update } = planner;
  const sched = state.schedule || {};
  const ids = Object.keys(sched).sort((a, b) => sched[a].start - sched[b].start);
  const active = state.activeTask;
  const nextId = active || ids.filter((id) => ['planned', 'paused'].includes(ts(id).status))[0];

  const box = (children) => (
    <div style={{ marginTop: 18, padding: 16, borderRadius: 20, border: '1.5px solid rgba(124,92,255,.55)', background: 'linear-gradient(165deg,rgba(124,92,255,.13),rgba(124,92,255,.03))' }}>
      {children}
    </div>
  );

  if (!nextId) {
    const done = ids.filter((id) => ts(id).status === 'completed').length;
    return box(
      <>
        <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: '-.01em' }}>{done ? t('home.allDone') : t('home.noSessionsPlanned')}</div>
        <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 8, lineHeight: 1.45 }}>{done ? t('home.allDoneSub') : t('home.noSessionsPlannedSub')}</div>
        <div
          onClick={() => update({ screen: done ? 'summary' : 'planner', dayEnded: true })}
          style={{ marginTop: 14, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          {done ? t('home.summarizeDay') : t('home.planDay')}
        </div>
      </>
    );
  }

  const d = def(nextId);
  const b = sched[nextId];
  const st = ts(nextId);
  const running = st.status === 'in_progress' || st.status === 'paused';

  return box(
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#c9baff', padding: '6px 11px', borderRadius: 999, background: 'rgba(124,92,255,.22)', border: '1px solid rgba(124,92,255,.4)' }}>
          {running ? t('home.sessionInProgress') : t('home.nextSession')}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 650, color: st.status === 'paused' ? '#f5a524' : '#8a8a99' }}>
          {st.status === 'paused' ? t('home.paused') : span(b.start, b.start + b.dur)}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 650, color: d.color, marginTop: 14 }}>{t(VALUE_KEY[d.subject]) || d.subject}</div>
      <div style={{ fontSize: 22, fontWeight: 750, lineHeight: 1.22, letterSpacing: '-.02em', marginTop: 8 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <Pill text={b.dur + ' min'} color="#2ee6c5" bg="rgba(46,230,197,.13)" />
        {d.deadline && <Pill text={t(TASK_TEXT_KEY[d.id]?.deadline) || d.deadline} color="#f5a524" bg="rgba(245,165,36,.13)" />}
      </div>
      {running ? (
        <>
          <SessionTimer state={state} dur={b.dur} dismissBreakReminder={planner.dismissBreakReminder} />
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <SmallBtn label={st.status === 'paused' ? t('home.resume') : t('home.pause')} onClick={() => togglePause(nextId)} />
            <SmallBtn label={t('home.reschedule')} onClick={() => openBlockEdit(nextId)} />
            <SmallBtn label={t('home.finish')} accent onClick={() => openFinish(nextId, b.dur)} />
          </div>
        </>
      ) : (
        <div
          onClick={() => startSession(nextId)}
          style={{ marginTop: 14, height: 52, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 24px rgba(109,77,255,.3)' }}
        >
          {t('home.startSession')}
        </div>
      )}
    </>
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
      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 11, borderRadius: 14, background: st.status === 'in_progress' ? 'rgba(124,92,255,.08)' : 'rgba(255,255,255,.03)', border: st.status === 'in_progress' ? '1.5px solid rgba(124,92,255,.5)' : '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8a8a99' }}>{span(b.start, b.start + b.dur)}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{t(TASK_TEXT_KEY[d.id]?.short) || d.short}</div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 650, color: STATUS_COLOR[st.status], padding: '5px 9px', borderRadius: 8, background: 'rgba(255,255,255,.06)' }}>{t('status.' + st.status)}</span>
      </div>
    );
  });
  state.taskDefs.forEach((d) => {
    const st = ts(d.id);
    if (st.status !== 'moved' && st.status !== 'skipped') return;
    rows.push(
      <div key={'x' + d.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 11, borderRadius: 14, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8a8a99' }}>{st.status === 'moved' ? t('home.movedTo', { time: planner.state.engStart }) : t('home.notInPlan')}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{t(TASK_TEXT_KEY[d.id]?.short) || d.short}</div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 650, color: STATUS_COLOR[st.status], padding: '5px 9px', borderRadius: 8, background: 'rgba(255,255,255,.06)' }}>{t('status.' + st.status)}</span>
      </div>
    );
  });
  if (!rows.length) return <div style={{ fontSize: 12.5, color: '#6f6f7d' }}>{t('home.noSessionsToday2')}</div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{rows}</div>;
}

function FinishSheet({ planner }) {
  const { t } = useLang();
  const { state, def, cancelFinish, confirmFinish, update } = planner;
  if (!state.finishTask) return null;
  const d = def(state.finishTask);
  const HARD = ['Łatwa', 'W sam raz', 'Trudna'];
  const KNOW = ['Nie umiem', 'Częściowo umiem', 'Dobrze umiem', 'Opanowane'];
  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('home.finishSession', { title: t(TASK_TEXT_KEY[d.id]?.title) || d.title })}</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t('home.finishSessionSub')}</div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.actualTime')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div onClick={() => update((s) => ({ finishDur: Math.max(5, s.finishDur - 5) }))} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: 750 }}>{state.finishDur} min</div>
        <div onClick={() => update((s) => ({ finishDur: s.finishDur + 5 }))} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.howHard')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        {HARD.map((x) => (
          <div key={x} onClick={() => update({ finishHard: x })} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.finishHard === x ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.finishHard === x ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)'), color: state.finishHard === x ? '#e6dfff' : '#c9c9d6' }}>{t(VALUE_KEY[x]) || x}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('home.howWell')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {KNOW.map((x) => (
          <div key={x} onClick={() => update({ finishKnow: x })} style={{ padding: '14px 15px', fontSize: 14, fontWeight: state.finishKnow === x ? 700 : 550, cursor: 'pointer', color: state.finishKnow === x ? '#e6dfff' : '#c9c9d6', background: state.finishKnow === x ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.03)', borderRadius: 13, border: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between' }}>
            {t(VALUE_KEY[x]) || x}{state.finishKnow === x && <span style={{ color: '#a58cff' }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={cancelFinish} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('home.cancel')}</div>
        <div onClick={confirmFinish} style={{ flex: 1.4, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('home.finishSessionBtn')}</div>
      </div>
    </BottomSheet>
  );
}

function EnergySheet({ planner, logEnergy }) {
  const { t } = useLang();
  const { state, cancelEnergySheet, saveEnergySheet, update } = planner;
  if (!state.energySheet) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(6,6,10,.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', padding: 20, borderRadius: '24px 24px 0 0', background: '#101018', borderTop: '1px solid rgba(255,255,255,.12)', animation: 'fadeUp .3s ease both' }}>
        <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('home.energyPickerTitle')}</div>
        <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t('home.energyPickerSub')}</div>
        <div style={{ marginTop: 18 }}>
          <EnergyPicker value={state.energyDraft} onChange={(v) => update({ energyDraft: v })} emoji />
        </div>
        <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
          <div onClick={cancelEnergySheet} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('home.cancel')}</div>
          <div
            onClick={() => { logEnergy(state.energyDraft); saveEnergySheet(); }}
            style={{ flex: 1.3, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('home.save')}
          </div>
        </div>
      </div>
    </div>
  );
}

const ENERGY_EMOJI = { Niska: '🔋', Normalna: '⚡', Wysoka: '🔥' };

function EnergyHistory({ energyLog }) {
  const { t, lang } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const todays = energyLog.filter((e) => e.at.slice(0, 10) === today).slice(-5);
  if (!todays.length) return null;
  return (
    <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.energyCheckins')}</div>
      <div style={{ display: 'flex', gap: 9, marginTop: 11, overflowX: 'auto' }}>
        {todays.map((e, i) => (
          <div key={i} style={{ flex: 'none', textAlign: 'center', padding: '9px 12px', borderRadius: 13, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 16 }}>{ENERGY_EMOJI[e.level]}</div>
            <div style={{ fontSize: 10.5, color: '#8a8a99', marginTop: 4 }}>{new Date(e.at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home({ planner, studentName, energyLog = [], logEnergy = () => {}, studyHistory = {}, recurringActivities = [] }) {
  const { t } = useLang();
  const { state, ts, openEnergySheet } = planner;
  const goalExam = planner.nextGoalPrompt();
  const dayIds = state.taskDefs.filter((_, i) => state.tasks[i]).map((t) => t.id);
  const doneCount = dayIds.filter((id) => ts(id).status === 'completed').length;
  const totalCount = dayIds.filter((id) => ts(id).status !== 'skipped').length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const dateLong = state.selectedDay === 20 ? t('home.dateLongMon') : t('home.dateLongSun');
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const streak = computeStreak(studyHistory);
  const points = computeTotalPoints(studyHistory, energyLog);
  const [seenAchievements, setSeenAchievements] = useSeenAchievements();
  const [lastSeenStreak, setLastSeenStreak] = useLastSeenStreak();
  const stats = {
    streak,
    points,
    completedDays: Object.values(studyHistory).filter((e) => e.completed).length,
    energyCheckins: energyLog.length,
    recurringCount: recurringActivities.length,
  };
  const newlyUnlocked = computeUnlockedAchievements(stats).filter((a) => !seenAchievements.includes(a.id));
  const pendingAchievement = newlyUnlocked[0] || null;
  const streakNotice =
    lastSeenStreak > 0 && streak < lastSeenStreak
      ? { type: 'broken', text: t('home.streakEndedTitle', { n: lastSeenStreak, word: t(lastSeenStreak === 1 ? 'day.one' : 'day.many') }) }
      : streak > lastSeenStreak && STREAK_MILESTONES.includes(streak)
        ? { type: 'milestone', text: t('home.streakMilestone', { n: streak }) }
        : null;

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, color: '#8a8a99', letterSpacing: '.01em' }}>{dateLong}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-.02em' }}>{t('home.greeting', { name: parts[0] })}</div>
            <span style={{ fontSize: 22 }}>👋</span>
          </div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 6 }}>{t('home.subtitle')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4, paddingRight: 46 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '.02em' }}>{initials}</div>
        </div>
      </div>

      <StreakCard streak={streak} selectedDay={state.selectedDay} />
      <StreakNotice notice={streakNotice} onDismiss={() => setLastSeenStreak(streak)} />

      <MorningSummaryCard state={state} />

      {state.rescueApplied && (
        <div style={{ marginTop: 18, padding: 15, borderRadius: 18, background: 'rgba(53,208,127,.06)', border: '1px solid rgba(53,208,127,.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 9, background: 'rgba(53,208,127,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="10" viewBox="0 0 13 11" fill="none"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#35d07f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('home.planUpdated')}</div>
          </div>
          <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 11 }}>{t('home.englishMoved', { time: state.engStart })}</div>
        </div>
      )}

      {goalExam && <GoalPromptCard key={goalExam.id} planner={planner} exam={goalExam} />}

      <NextSessionCard planner={planner} />

      <div onClick={openEnergySheet} style={{ marginTop: 12, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(124,92,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M8 1L3 8h3.2L6 13l5-7.2H7.6L8 1z" fill="#a58cff" /></svg></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: '#8a8a99' }}>{t('home.energyLevel')}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{t('home.energyValue', { level: t(VALUE_KEY[state.energy]) || state.energy })}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 11, background: 'rgba(124,92,255,.18)', border: '1px solid rgba(124,92,255,.35)', fontSize: 12.5, fontWeight: 650, color: '#c9baff' }}>{t('home.change')} <span style={{ fontSize: 9 }}>▼</span></div>
      </div>

      <EnergyHistory energyLog={energyLog} />

      <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t('home.todayProgress')}</div>
          <div style={{ fontSize: 19, fontWeight: 750, color: '#2ee6c5' }}>{pct}%</div>
        </div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 3 }}>{t('home.sessionsDone', { done: doneCount, total: totalCount, word: t(totalCount === 1 ? 'home.sessionsCompletedOne' : 'home.sessionsCompletedMany') })}</div>
        <div style={{ marginTop: 12, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#7c5cff,#2ee6c5)', transition: 'width .5s ease' }} />
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.todayPlan')}</div>
        <div style={{ marginTop: 12 }}><TodayList planner={planner} /></div>
        <div onClick={() => planner.go('plan')} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('home.seeFullPlan')} <span style={{ fontSize: 11 }}>›</span></div>
      </div>

      <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(245,165,36,.06)', border: '1px solid rgba(245,165,36,.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(245,165,36,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="16" height="15" viewBox="0 0 16 15" fill="none"><path d="M8 1.6l6.2 11H1.8L8 1.6z" stroke="#f5a524" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 5.6v3.2" stroke="#f5a524" strokeWidth="1.3" strokeLinecap="round" /><circle cx="8" cy="11" r=".8" fill="#f5a524" /></svg></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.nextDeadline')}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{t('home.mathExam')}</div>
          <div style={{ fontSize: 12, fontWeight: 650, color: '#f5a524', marginTop: 2 }}>{t('cal.inDaysPill', { n: 3 })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 21, fontWeight: 750 }}>45%</div>
          <div style={{ fontSize: 10.5, color: '#8a8a99' }}>{t('home.readiness')}</div>
        </div>
      </div>

      {state.bioDeadlineSaved && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(46,230,197,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.2" width="12" height="11" rx="2.4" stroke="#2ee6c5" strokeWidth="1.2" /><path d="M2 6.6h12" stroke="#2ee6c5" strokeWidth="1.2" /></svg></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.nextUp')}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{t('home.bioExam')}</div>
            <div style={{ fontSize: 11.5, color: '#8ff0de', marginTop: 2 }}>{state.bioSessionsSaved ? t('home.prepSessionsInPlan') : t('home.noPrepSessions')}</div>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '20px 0 10px 2px' }}>{t('home.quickActions')}</div>
      <div onClick={() => planner.go('planner')} style={{ padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(124,92,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.2" width="12" height="11" rx="2.4" stroke="#a58cff" strokeWidth="1.2" /><path d="M2 6.6h12M5.6 1.8v2.4M10.4 1.8v2.4" stroke="#a58cff" strokeWidth="1.2" strokeLinecap="round" /></svg></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t('home.planTomorrow')}</div>
          <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 2 }}>{t('home.planTomorrowSub')}</div>
        </div>
        <span style={{ fontSize: 15, color: '#6b6b7a' }}>›</span>
      </div>
      <div onClick={() => planner.go('rescue')} style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,165,36,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.2 8a5.2 5.2 0 01-8.9 3.7M2.8 8a5.2 5.2 0 018.9-3.7" stroke="#f5a524" strokeWidth="1.3" strokeLinecap="round" /><path d="M11.4 2.4v2.4H9M4.6 13.6v-2.4H7" stroke="#f5a524" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.25 }}>{t('home.rescueDay')}</div>
      </div>

      <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('home.weekGoal')}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginTop: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-.01em' }}>{t('home.mathPrepGoal')}</div>
          <div style={{ fontSize: 19, fontWeight: 750, color: '#2ee6c5' }}>60%</div>
        </div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6 }}>{t('home.blocksdone')}</div>
        <div style={{ marginTop: 11, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ width: '60%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#7c5cff,#2ee6c5)', transition: 'width .5s ease' }} />
        </div>
      </div>

      <FinishSheet planner={planner} />
      <EnergySheet planner={planner} logEnergy={logEnergy} />
      <AchievementModal achievement={pendingAchievement} onClose={() => setSeenAchievements(seenAchievements.concat(pendingAchievement.id))} />
    </div>
  );
}
