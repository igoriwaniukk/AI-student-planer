import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYS, STORAGE_CHANGED_EVENT } from '../lib/store';
import { localDateKey } from '../lib/plannerLogic';
import { SESSION_DONE_EVENT } from '../lib/streakRewards';
import { PLAN_DONE_EVENT, DAY_DONE_EVENT, PUG_OPEN_EVENT, PUG_PREVIEW_EVENT, pugPreviewOn } from '../lib/pugWorld/events';
import { EMPTY, normalize, ensureDay, onSession, onPlan, onDayFinished, onStreak, onPremiumDay } from '../lib/pugWorld/logic';

// Owns Pug World's state (KEYS.pugWorld, synced like the rest). Mounted once
// in MainApp. Studying feeds the game: a finished session, an approved plan,
// a finished day, streak milestones and (Premium) a daily bonus chest.
// While the game is hidden (no preview on this device) nothing is collected.
export function usePugWorld({ streak, isPremium }) {
  // Saved only once there's something to save (not via useLocalStorage,
  // which would write an empty value on first load — and an empty copy from
  // a phone that never played could win a sync conflict over real progress).
  const [stored, setStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEYS.pugWorld) || 'null'); } catch { return null; }
  });
  useEffect(() => {
    if (stored == null) return;
    const next = JSON.stringify(stored);
    try {
      if (localStorage.getItem(KEYS.pugWorld) === next) return;
      localStorage.setItem(KEYS.pugWorld, next);
    } catch { return; }
    window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT));
  }, [stored]);
  const state = normalize(stored || EMPTY);
  const [enabled, setEnabled] = useState(pugPreviewOn);
  const [open, setOpen] = useState(null); // null = closed, else the tab
  const [toast, setToast] = useState(null);
  const update = useCallback((fn) => setStored((s) => fn(normalize(s || EMPTY))), [setStored]);

  useEffect(() => {
    const onPreview = () => setEnabled(pugPreviewOn());
    const onOpen = (e) => setOpen(e.detail?.tab || 'dogs');
    window.addEventListener(PUG_PREVIEW_EVENT, onPreview);
    window.addEventListener(PUG_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(PUG_PREVIEW_EVENT, onPreview);
      window.removeEventListener(PUG_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const session = () => { update(onSession); setToast({ at: Date.now() }); };
    const plan = () => update((s) => onPlan(s, localDateKey()));
    const day = () => update((s) => onDayFinished(s, localDateKey()));
    window.addEventListener(SESSION_DONE_EVENT, session);
    window.addEventListener(PLAN_DONE_EVENT, plan);
    window.addEventListener(DAY_DONE_EVENT, day);
    return () => {
      window.removeEventListener(SESSION_DONE_EVENT, session);
      window.removeEventListener(PLAN_DONE_EVENT, plan);
      window.removeEventListener(DAY_DONE_EVENT, day);
    };
  }, [enabled, update]);

  // New day: today's missions and shop. Streak milestones and the Premium
  // bonus are given once each (logic.js remembers what was rewarded).
  const today = localDateKey();
  // (A state update in an effect on purpose: these follow the date, the
  // streak and Premium, which change outside the game.)
  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react/set-state-in-effect
    update((s) => {
      let next = ensureDay(s, today);
      if (streak > 0) next = onStreak(next, streak);
      if (isPremium) next = onPremiumDay(next, today);
      return next;
    });
  }, [enabled, today, streak, isPremium, update]);

  const toastTimer = useRef(null);
  useEffect(() => {
    if (!toast) return undefined;
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  return {
    enabled,
    state,
    started: Object.keys(state.dogs).length > 0,
    update,
    open,
    setOpen,
    toast,
    clearToast: () => setToast(null),
  };
}
