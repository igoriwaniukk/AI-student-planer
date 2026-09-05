import { upcomingExams, computeStreak } from './plannerLogic';

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
        subject: e.subject,
        title: e.title,
        daysUntil: e.daysUntil,
        goal: goal ? `${goal.grade} (${goal.importance})` : null,
      };
    });

  const weekGoalMinutes = upcomingExams(state)
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7)
    .reduce((a, e) => a + (state.examGoals?.[e.id]?.studyMinutes || 0), 0);

  return {
    exams,
    weeklyCapacityMinutes: weeklyCapacity,
    weekGoalMinutes,
    energy: state.energy,
    streak: computeStreak(studyHistory || {}),
    studyTime: profileDefaults?.studyTime,
    prioritySubjects: profileDefaults?.prioritySubjects || [],
  };
}
