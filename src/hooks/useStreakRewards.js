import { useEffect, useRef, useState } from 'react';
import { useLocalStorage, KEYS } from '../lib/store';
import { bestStreak } from '../lib/plannerLogic';
import {
  EMPTY_REWARDS, MAX_FREEZES, SESSION_DONE_EVENT, normalizeRewards, addSession, missedDaysToFreeze, newMilestones,
} from '../lib/streakRewards';

// Owns the streak rewards (see lib/streakRewards.js). Mounted once, in
// MainApp — the only owner of KEYS.streakRewards — and handed down as props.
//  - Premium: every finished session counts towards the next freeze, and
//    missed days right before today are covered by freezes automatically
//    (freezeDays marks them `frozen` in studyHistory).
//  - Everyone: a badge at each milestone. Reaching one live (the streak
//    going up to it) is celebrated, with +1 freeze for Premium; badges for
//    milestones already behind the student are just added quietly.
export function useStreakRewards({ studyHistory, streak, isPremium, freezeDays }) {
  const [stored, setStored] = useLocalStorage(KEYS.streakRewards, EMPTY_REWARDS);
  const rewards = normalizeRewards(stored);
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (!isPremium) return undefined;
    const onDone = () => setStored((r) => addSession(r));
    window.addEventListener(SESSION_DONE_EVENT, onDone);
    return () => window.removeEventListener(SESSION_DONE_EVENT, onDone);
  }, [isPremium, setStored]);

  // Remembers what was frozen last, so a repeated run of this effect before
  // studyHistory catches up can't spend the same freezes twice.
  const lastFrozen = useRef('');
  useEffect(() => {
    if (!isPremium || !rewards.freezes) return;
    const days = missedDaysToFreeze(studyHistory, rewards.freezes);
    const key = days.join(',');
    if (!days.length || key === lastFrozen.current) return;
    lastFrozen.current = key;
    freezeDays(days);
    setStored((r) => {
      const n = normalizeRewards(r);
      return { ...n, freezes: Math.max(0, n.freezes - days.length) };
    });
  }, [isPremium, rewards.freezes, studyHistory, freezeDays, setStored]);

  const best = Math.max(streak, bestStreak(studyHistory));
  const prevStreak = useRef(streak);
  const badgesKey = rewards.badges.join(',');
  const freezesNow = rewards.freezes;
  useEffect(() => {
    const rose = streak > prevStreak.current;
    prevStreak.current = streak;
    const fresh = newMilestones(badgesKey ? badgesKey.split(',').map(Number) : [], best);
    if (!fresh.length) return;
    const hit = rose && fresh.includes(streak) ? streak : null;
    const gift = !!hit && isPremium && freezesNow < MAX_FREEZES;
    setStored((r) => {
      const n = normalizeRewards(r);
      return { ...n, badges: [...new Set([...n.badges, ...fresh])].sort((a, b) => a - b), freezes: gift ? Math.min(MAX_FREEZES, n.freezes + 1) : n.freezes };
    });
    if (hit) setMilestone({ n: hit, gift });
  }, [streak, best, badgesKey, isPremium, freezesNow, setStored]);

  return { rewards, milestone, clearMilestone: () => setMilestone(null) };
}
