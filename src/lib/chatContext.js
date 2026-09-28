import { upcomingExams, computeStreak, fmt, planFor } from './plannerLogic';
import { NUM_TODAY } from './plannerData';

// Compact snapshot of the student's plan/goals sent to the AI chat backend
// with each message, instead of the full app state (keeps the request small
// and avoids sending data the assistant has no use for).
export function buildChatContext({ state, weeklyCapacity, profileDefaults, studyHistory }) {
  const exams = upcomingExams(state)
    .filter((e) => e.daysUntil >= 0)
    .slice(0, 5)
    .map((e) => {
      const goal = state.examGoals?.[e.id];
      return {
        id: e.id,
        subject: e.subject,
        title: e.title,
        daysUntil: e.daysUntil,
        goal: goal ? `${goal.grade} (${goal.importance})` : null,
      };
    });

  const weekGoalMinutes = upcomingExams(state)
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7)
    .reduce((a, e) => a + (state.examGoals?.[e.id]?.studyMinutes || 0), 0);

  // Only today's plan — an approved plan for tomorrow isn't today's sessions.
  const sched = planFor(state, NUM_TODAY) || {};
  const todaySessions = (state.taskDefs || [])
    .filter((d) => sched[d.id])
    .map((d) => ({
      id: d.id,
      label: d.short || d.subject,
      status: state.taskState?.[d.id]?.status || 'planned',
      start: fmt(sched[d.id].start),
      durationMinutes: sched[d.id].dur,
    }));

  return {
    exams,
    todaySessions,
    weeklyCapacityMinutes: weeklyCapacity,
    weekGoalMinutes,
    energy: state.energy,
    streak: computeStreak(studyHistory || {}),
    studyTime: profileDefaults?.studyTime,
    prioritySubjects: profileDefaults?.prioritySubjects || [],
  };
}
