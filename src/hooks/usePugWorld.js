import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYS, STORAGE_CHANGED_EVENT } from '../lib/store';
import { localDateKey } from '../lib/plannerLogic';
import { SESSION_DONE_EVENT } from '../lib/streakRewards';
import { PLAN_DONE_EVENT, DAY_DONE_EVENT, PUG_OPEN_EVENT, PUG_PREVIEW_EVENT, pugPreviewOn } from '../lib/pugWorld/events';
import { EMPTY, normalize, ensureDay, chestId, onSession, onPlan, onDayFinished, onStreak, onPremiumDay } from '../lib/pugWorld/logic';

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
    const session = () => { const id = chestId(); update((s) => onSession(s, id, localDateKey().slice(0, 7))); setToast({ at: Date.now(), chest: id }); };
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

  // Reward animation (RewardFx): coins gained (not while a chest is being
  // opened — it shows its own coins) and missions just finished.
  const [fx, setFx] = useState(null);
  const prevReward = useRef(null);
  const doneIds = (state.missions.items || []).filter((m) => m.done).map((m) => m.id);
  const doneKey = state.missions.date + ':' + doneIds.join(',');
  useEffect(() => {
    const prev = prevReward.current;
    prevReward.current = { coins: state.coins, date: state.missions.date, done: doneIds };
    if (!prev || !enabled || !started) return;
    const hold = busy > 0 || !!toast || queue.length > 0 || !!showingChest;
    const gained = state.coins - prev.coins;
    const newly = prev.date === state.missions.date ? doneIds.filter((id) => !prev.done.includes(id)) : [];
    const coins = hold ? 0 : Math.max(0, gained);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (coins > 0 || newly.length) setFx({ at: Date.now(), coins, mission: newly[0] || null, hold });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.coins, doneKey]);

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
    freezeRoom,
    addFreeze: () => addFreeze?.(),
    update,
    toast,
    clearToast: () => setToast(null),
  };
}
