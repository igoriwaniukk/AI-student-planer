import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYS, STORAGE_CHANGED_EVENT } from '../lib/store';
import { localDateKey } from '../lib/plannerLogic';
import { SESSION_DONE_EVENT } from '../lib/streakRewards';
import { PLAN_DONE_EVENT, DAY_DONE_EVENT, PUG_OPEN_EVENT, PUG_PREVIEW_EVENT, TASK_DONE_EVENT, pugPreviewOn } from '../lib/pugWorld/events';
import { EMPTY, normalize, ensureDay, chestId, onSession, onTaskDone, onPlan, onDayFinished, onStreak, onPremiumDay, monthlyFor } from '../lib/pugWorld/logic';

// Owns Pug World's state (KEYS.pugWorld, synced like the rest). Mounted once
// in MainApp. Studying feeds the game: a finished session, an approved plan,
// a finished day, streak milestones and (Premium) a daily bonus chest.
// While the game is hidden (no preview on this device) nothing is collected.
export function usePugWorld({ streak, isPremium, freezeRoom = true, addFreeze, onOpenRequest }) {
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
  // openPugWorld(...) / openMissions() ask the app to show My dogs (a tab /
  // chest / dog) or the Missions page.
  const openRequest = useRef(onOpenRequest);
  useEffect(() => { openRequest.current = onOpenRequest; });
  const [toast, setToast] = useState(null);
  const sessionPending = useRef(false);
  const update = useCallback((fn) => setStored((s) => fn(normalize(s || EMPTY))), [setStored]);

  useEffect(() => {
    const onPreview = () => setEnabled(pugPreviewOn());
    const onOpen = (e) => {
      const d = e.detail || {};
      openRequest.current?.({ page: d.page === 'missions' ? 'missions' : 'pets', tab: d.tab || null, chest: d.chest || null, dog: d.dog || null });
    };
    window.addEventListener(PUG_PREVIEW_EVENT, onPreview);
    window.addEventListener(PUG_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(PUG_PREVIEW_EVENT, onPreview);
      window.removeEventListener(PUG_OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const session = (e) => {
      const id = chestId();
      sessionPending.current = true;
      update((s) => onSession(s, id, localDateKey().slice(0, 7), e?.detail?.minutes || 0));
      setToast({ at: Date.now(), chest: id });
    };
    const task = (e) => { if (e?.detail?.key) update((s) => onTaskDone(s, e.detail.key)); };
    const plan = () => update((s) => onPlan(s, localDateKey()));
    const day = () => update((s) => onDayFinished(s, localDateKey()));
    window.addEventListener(SESSION_DONE_EVENT, session);
    window.addEventListener(TASK_DONE_EVENT, task);
    window.addEventListener(PLAN_DONE_EVENT, plan);
    window.addEventListener(DAY_DONE_EVENT, day);
    return () => {
      window.removeEventListener(SESSION_DONE_EVENT, session);
      window.removeEventListener(TASK_DONE_EVENT, task);
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
  // The small "+1 chest" message (game not started yet) goes away by
  // itself; the session reward (SessionReward) waits to be opened or closed.
  const started = Object.keys(state.dogs).length > 0;
  useEffect(() => {
    if (!toast || started) return undefined;
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(toastTimer.current);
  }, [toast, started]);

  // Chests earned anywhere (missions, daily rewards, streaks, the shop…)
  // open right away, one after another: new chest ids join `queue`
  // (EarnedChest shows them). The session's own chest is opened by
  // SessionReward instead. `busy` = a chest is being opened on the My dogs
  // page (ChestOpen counts itself in); then the queue waits.
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(0);
  const [showingChest, setShowingChest] = useState(null);
  const showingRef = useRef(null);
  useEffect(() => { showingRef.current = showingChest; }, [showingChest]);
  const seenChests = useRef(null);
  const chestKey = state.chests.map((c) => c.id).join(',');
  useEffect(() => {
    const ids = chestKey ? chestKey.split(',') : [];
    const seen = seenChests.current;
    seenChests.current = new Set(ids);
    if (!seen || !enabled) return;
    const fresh = ids.filter((id) => !seen.has(id) && id !== toast?.chest);
    // New ones join; ones opened some other way (e.g. "open next") leave —
    // except the one on screen, which is gone from the list once opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue((q) => {
      const next = q.filter((id) => ids.includes(id) || id === showingRef.current).concat(fresh.filter((id) => !q.includes(id)));
      return next.length === q.length && next.every((id, i) => id === q[i]) ? q : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chestKey, enabled]);

  // The welcome chest (from picking your first dog) opens by itself the
  // first time the game is open with it still waiting.
  const welcomeDone = useRef(false);
  useEffect(() => {
    if (!enabled || !started || welcomeDone.current) return;
    welcomeDone.current = true;
    const w = state.chests.find((c) => c.from === 'welcome');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (w) setQueue((q) => (q.includes(w.id) ? q : [w.id, ...q]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, started]);

  // The mission progress screen (MissionProgress): after every finished
  // session, and whenever a mission gets finished, today's missions before
  // → after (and the monthly challenge after a session). Shown before the
  // chests it earned open.
  const [progress, setProgress] = useState(null);
  const prevMissions = useRef(null);
  const month = today.slice(0, 7);
  const monthSessions = monthlyFor(state, month).sessions;
  const missionsKey = state.missions.date + ':' + JSON.stringify(state.missions.counts) + ':' + (state.missions.items || []).map((m) => m.id + (m.done ? '1' : '0')).join(',') + ':' + monthSessions;
  useEffect(() => {
    const prev = prevMissions.current;
    const cur = { date: state.missions.date, counts: state.missions.counts, items: state.missions.items || [], monthly: monthSessions, month };
    prevMissions.current = cur;
    const fromSession = sessionPending.current;
    sessionPending.current = false;
    if (!prev || !enabled || !started || prev.date !== cur.date || !cur.items.length) return;
    const newly = cur.items.some((m) => m.done && !prev.items.find((p) => p.id === m.id)?.done);
    if (!fromSession && !newly) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress((p) => (p ? { ...p, to: cur, session: p.session || fromSession } : { at: Date.now(), from: prev, to: cur, session: fromSession }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionsKey]);

  // Coin animation (RewardFx) for coins gained outside a chest (daily
  // reward, an approved plan…), not while a chest or the progress screen
  // is showing (they show their own rewards).
  const [fx, setFx] = useState(null);
  const prevCoins = useRef(null);
  useEffect(() => {
    const prev = prevCoins.current;
    prevCoins.current = state.coins;
    if (prev == null || !enabled || !started) return;
    const hold = busy > 0 || !!toast || queue.length > 0 || !!showingChest || !!progress || sessionPending.current;
    const coins = hold ? 0 : Math.max(0, state.coins - prev);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (coins > 0) setFx({ at: Date.now(), coins });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.coins]);

  return {
    enabled,
    state,
    started,
    queue,
    dequeue: (id) => setQueue((q) => q.filter((x) => x !== id)),
    busy,
    track: (d) => setBusy((b) => Math.max(0, b + d)),
    showingChest,
    setShowingChest,
    fx,
    clearFx: () => setFx(null),
    progress,
    clearProgress: () => setProgress(null),
    freezeRoom,
    addFreeze: () => addFreeze?.(),
    update,
    toast,
    clearToast: () => setToast(null),
  };
}
