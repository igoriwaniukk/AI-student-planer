import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage, KEYS } from '../lib/store';
import { bestStreak } from '../lib/plannerLogic';
import {
  EMPTY_REWARDS, MAX_FREEZES, SESSION_DONE_EVENT, normalizeRewards, addSession, missedDaysToFreeze, newMilestones,
} from '../lib/streakRewards';

// Owns the streak rewards (see lib/streakRewards.js). Mounted once, in
// MainApp — the only owner of KEYS.streakRewards — and handed down as props.
//  - Premium: every finished session counts towards the next freeze.
//  - Anyone holding freezes (Premium, or found in a chest): missed days
//    right before today are covered automatically (freezeDays marks them
//    `frozen` in studyHistory).
//  - Milestones (STREAK_MILESTONES): reaching one live (the streak going up
//    to it) is celebrated, with +1 freeze for Premium; milestones already
//    behind the student are just recorded quietly.
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
  // Freezes protect anyone who has one (free users can find them in Pug
  // World chests); only Premium earns them from sessions and milestones.
  useEffect(() => {
    if (!rewards.freezes) return;
    const days = missedDaysToFreeze(studyHistory, rewards.freezes);
    const key = days.join(',');
    if (!days.length || key === lastFrozen.current) return;
    lastFrozen.current = key;
    freezeDays(days);
    setStored((r) => {
      const n = normalizeRewards(r);
      return { ...n, freezes: Math.max(0, n.freezes - days.length) };
    });
  }, [rewards.freezes, studyHistory, freezeDays, setStored]);

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

  // A freeze found in a chest (up to the maximum).
  const addFreeze = useCallback(() => setStored((r) => {
    const n = normalizeRewards(r);
    return { ...n, freezes: Math.min(MAX_FREEZES, n.freezes + 1) };
  }), [setStored]);

  return { rewards, milestone, clearMilestone: () => setMilestone(null), addFreeze };
}
