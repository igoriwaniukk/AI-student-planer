import { useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import StreakCelebration from './components/StreakCelebration';
import ChatWidget from './components/ChatWidget';
import QuickAddSheet from './components/QuickAddSheet';
import { GeneratingOverlay } from './components/ui';
import Home from './screens/Home';
import Calendar from './screens/Calendar';
import Tasks from './screens/Tasks';
import Planner from './screens/Planner';
import Plan from './screens/Plan';
import Rescue from './screens/Rescue';
import RescueResult from './screens/RescueResult';
import Deadline from './screens/Deadline';
import Prep from './screens/Prep';
import Summary from './screens/Summary';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import Onboarding from './screens/Onboarding';
import Auth, { NewPasswordScreen } from './screens/Auth';
import {
  useStudentName, useProfilePhoto, useSchoolPlan, useActivities, useProfileDefaults,
  useWeeklyCapacity, useEnergyLog, useStudyHistory, useRecurringActivities, useLanguage, usePlannerData,
  KEYS, STORAGE_CHANGED_EVENT,
} from './lib/store';
import { usePlanner } from './hooks/usePlanner';
import { LanguageProvider } from './lib/LanguageContext';
import { computeStreak, studiedToday, localDateKey, daySessionBreakdown, statusOn } from './lib/plannerLogic';
import { NUM_TODAY } from './lib/plannerData';
import { TASK_TEXT_KEY } from './lib/i18n';
import { useLang } from './lib/useLang';
import { useStreakPushSync } from './hooks/usePushNotifications';
import { useAuth } from './lib/useAuth';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { pullFromCloud, pushToCloud } from './lib/cloudSync';

// Marks (per browser tab session, in sessionStorage so it survives the
// reload a fresh pull triggers below) which signed-in user's cloud data has
// already been pulled down — so a later reload for the SAME user (e.g.
// after "reset app data") doesn't immediately re-pull and undo it, while
// signing into a DIFFERENT account still triggers a fresh pull.
const SYNCED_FLAG = 'sp_cloud_synced_uid';

// Persisted in localStorage (unlike SYNCED_FLAG) because it has to survive
// across tabs and reloads: it records which signed-in user the KEYS data
// currently sitting in localStorage belongs to, so switching to a different
// account without ever hitting "Wyloguj" (which normally wipes it) can still
// be detected and the stale data cleared — otherwise a brand-new account
// would silently inherit and push up the previous account's local state.
const LOCAL_OWNER_FLAG = 'sp_local_owner_uid';

// Pulls the signed-in user's saved data into localStorage once per sign-in,
// then pushes any later local change back up (debounced) — see cloudSync.js
// for the actual read/write. Does nothing at all until real Supabase
// credentials are configured, so the no-backend demo is unaffected.
function useCloudSync(session) {
  // Whether this browser tab already pulled this exact user's data down —
  // derived straight from sessionStorage during render, so the common case
  // (already synced) never needs an effect-triggered re-render at all.
  const alreadySynced = isSupabaseConfigured && !!session && sessionStorage.getItem(SYNCED_FLAG) === session.user.id;
  const [pulled, setPulled] = useState(false);
  // Tracks the most recent push/pull failure so the UI can tell the student
  // their data might not be backed up, instead of failing silently — cleared
  // on the next successful sync.
  const [syncError, setSyncError] = useState(false);
  const ready = !isSupabaseConfigured || !session || alreadySynced || pulled;

  useEffect(() => {
    if (!isSupabaseConfigured || !session || alreadySynced) return undefined;
    const uid = session.user.id;

    const localOwner = localStorage.getItem(LOCAL_OWNER_FLAG);
    if (localOwner && localOwner !== uid) {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(LOCAL_OWNER_FLAG, uid);
      sessionStorage.setItem(SYNCED_FLAG, uid);
      window.location.reload();
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const pullResult = await pullFromCloud(uid);
      if (cancelled) return;
      if (!pullResult.ok) setSyncError(true);
      sessionStorage.setItem(SYNCED_FLAG, uid);
      localStorage.setItem(LOCAL_OWNER_FLAG, uid);
      if (pullResult.hadData) {
        window.location.reload();
        return;
      }
      const pushResult = await pushToCloud(uid);
      if (cancelled) return;
      if (!pushResult.ok) setSyncError(true);
      setPulled(true);
    })();
    return () => { cancelled = true; };
  }, [session, alreadySynced]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return undefined;
    const uid = session.user.id;
    let timer = null;
    let dirty = false;
    const flush = () => {
      if (!dirty) return;
      dirty = false;
      clearTimeout(timer);
      pushToCloud(uid).then((result) => setSyncError(!result.ok));
    };
    const onChange = () => {
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(flush, 1500);
    };
    // A change made right before closing the tab, reloading, or the app
    // going to the background (switching apps, locking the screen — the
    // events a plain `beforeunload` handler can miss, especially on mobile)
    // used to just sit in this debounce and never reach Supabase. The next
    // load's pullFromCloud() would then overwrite localStorage with
    // whatever *did* make it up last, silently erasing the unsaved change —
    // e.g. a task marked done right before closing showing as never done
    // again. Flushing immediately on the first sign of the tab going away
    // closes that window instead of waiting out the debounce.
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    window.addEventListener(STORAGE_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(STORAGE_CHANGED_EVENT, onChange);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      clearTimeout(timer);
    };
  }, [session]);

  return { ready, syncError };
}

const TAB_SCREENS = new Set(['home', 'calendar', 'tasks', 'profile']);

// Mounted only once onboarding is done, so usePlanner's initial state (a lazy
// useState initializer, which only ever runs on first mount) picks up the
// profile defaults onboarding just saved instead of whatever was there before.
function MainApp({ name, setName, profilePhoto, setProfilePhoto, schoolPlan, activities, profileDefaults, setProfileDefaults, weeklyCapacity, energyLog, logEnergy, studyHistory, recordStudyDay, recurringActivities, setRecurringActivities, onSignOut, onDeleteAccount, syncError }) {
  const [plannerData, setPlannerData] = usePlannerData();
  const planner = usePlanner(profileDefaults, activities, recurringActivities, plannerData, setPlannerData, recordStudyDay);
  const { state } = planner;
  const screen = state.screen;
  const streak = computeStreak(studyHistory);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { t } = useLang();

  // Celebrates the moment today's streak credit lands (first finished
  // session — see confirmFinish/recordStudyDay). `completed` is sticky, so
  // this flips false→true at most once per day; a value already true on
  // load (e.g. pulled from the cloud) isn't a fresh earn and stays quiet.
  const todayDone = studiedToday(studyHistory);
  const prevTodayDone = useRef(todayDone);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (todayDone && !prevTodayDone.current) setCelebrating(true);
    prevTodayDone.current = todayDone;
  }, [todayDone]);

  const planIsToday = state.planApproved && state.selectedDay === NUM_TODAY;
  const titleOf = (id) => {
    const d = planner.def(id);
    return d ? t(TASK_TEXT_KEY[d.id]?.title) || d.title : null;
  };
  const dayBreakdown = daySessionBreakdown(state, NUM_TODAY);
  const nextSessionId = planIsToday
    ? dayBreakdown.planned.find((id) => ['planned', 'paused'].includes(statusOn(state, id, NUM_TODAY)))
    : null;
  const nextSessionTitle = nextSessionId ? titleOf(nextSessionId) : null;
  const todayKey = localDateKey();
  const summarizedToday = !!state.daySummaries?.[todayKey];
  const unfinishedTitles = planIsToday && !summarizedToday ? dayBreakdown.unfinished.map(titleOf).filter(Boolean) : [];
  useStreakPushSync({
    streak,
    studiedTodayDate: todayDone ? todayKey : null,
    nextSessionTitle,
    nextSessionDate: nextSessionTitle ? todayKey : null,
    unfinishedTitles,
    unfinishedDate: unfinishedTitles.length ? todayKey : null,
    bedtime: profileDefaults?.bedtime || null,
  });

  // Opens the day summary once per day, by itself: when every session in
  // today's plan is done, or once the last one's scheduled time has passed.
  // Only from Home with nothing else on screen, and after the streak
  // celebration is closed, so it never cuts into another flow.
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const nowMinutes = clock.getHours() * 60 + clock.getMinutes();
  const hasPlan = dayBreakdown.planned.length > 0 && (planIsToday || dayBreakdown.done.length > 0);
  const allDone = dayBreakdown.done.length > 0 && dayBreakdown.unfinished.length === 0;
  const timeUp = nowMinutes >= dayBreakdown.lastEnd && !state.activeTask;
  const autoSummaryDue = hasPlan && (allDone || timeUp) && !summarizedToday && state.autoSummaryDate !== todayKey
    && screen === 'home' && !celebrating && !state.finishTask && !state.generating;
  useEffect(() => {
    if (autoSummaryDue) planner.update({ screen: 'summary', autoSummaryDate: todayKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSummaryDue]);

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          planner={planner}
          studentName={name}
          profilePhoto={profilePhoto}
          energyLog={energyLog}
          logEnergy={logEnergy}
          studyHistory={studyHistory}
          recurringActivities={recurringActivities}
        />
      )}
      {screen === 'calendar' && <Calendar planner={planner} activities={activities} recurringActivities={recurringActivities} />}
      {screen === 'tasks' && <Tasks planner={planner} />}
      {screen === 'planner' && <Planner planner={planner} />}
      {screen === 'plan' && <Plan planner={planner} />}
      {screen === 'rescue' && <Rescue planner={planner} />}
      {screen === 'rescueResult' && <RescueResult planner={planner} />}
      {screen === 'deadline' && <Deadline planner={planner} />}
      {screen === 'prep' && <Prep planner={planner} />}
      {screen === 'summary' && <Summary planner={planner} recordStudyDay={recordStudyDay} />}
      {screen === 'profile' && (
        <Profile
          studentName={name}
          setStudentName={setName}
          profilePhoto={profilePhoto}
          setProfilePhoto={setProfilePhoto}
          schoolPlan={schoolPlan}
          activities={activities}
          planner={planner}
          profileDefaults={profileDefaults}
          setProfileDefaults={setProfileDefaults}
          studyHistory={studyHistory}
          energyLog={energyLog}
          recurringActivities={recurringActivities}
          state={state}
          streak={streak}
        />
      )}
      {screen === 'settings' && (
        <Settings planner={planner} studyHistory={studyHistory} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} syncError={syncError} />
      )}

      {state.generating && <GeneratingOverlay labels={state.genLabels} step={state.genStep} />}

      <ChatWidget
        planner={planner}
        weeklyCapacity={weeklyCapacity}
        profileDefaults={profileDefaults}
        studyHistory={studyHistory}
        studentName={name}
        logEnergy={logEnergy}
        recurringActivities={recurringActivities}
        setRecurringActivities={setRecurringActivities}
      />

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAddExam={() => planner.go('deadline')}
        recurringActivities={recurringActivities}
        setRecurringActivities={setRecurringActivities}
      />

      {TAB_SCREENS.has(screen) && <TabBar screen={screen} onNavigate={planner.go} onFabClick={() => setQuickAddOpen(true)} fabActive={quickAddOpen} />}

      {celebrating && <StreakCelebration streak={streak} onClose={() => setCelebrating(false)} />}
    </div>
  );
}

function Splash() {
  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(255,255,255,.12)', borderTopColor: '#8b6dff', animation: 'spinRing .8s linear infinite' }} />
    </div>
  );
}

export default function App() {
  const {
    session, loading: authLoading, signUp, signIn, signInWithGoogle, signInWithApple, signOut,
    passwordRecovery, clearPasswordRecovery, resetPassword, updatePassword, deleteAccount,
  } = useAuth();
  const { ready: syncReady, syncError } = useCloudSync(session);

  const [name, setName] = useStudentName();
  const [profilePhoto, setProfilePhoto] = useProfilePhoto();
  const [schoolPlan] = useSchoolPlan();
  const [activities, setActivities] = useActivities();
  const [profileDefaults, setProfileDefaults] = useProfileDefaults();
  const [weeklyCapacity] = useWeeklyCapacity();
  const [energyLog, setEnergyLog] = useEnergyLog();
  const [studyHistory, setStudyHistory] = useStudyHistory();
  const [recurringActivities, setRecurringActivities] = useRecurringActivities();
  const [lang, setLang] = useLanguage();

  function logEnergy(level) {
    setEnergyLog((log) => log.concat({ at: new Date().toISOString(), level }).slice(-30));
  }

  // Merges onto today's existing entry instead of overwriting it — a real
  // study session finishing (see confirmFinish in usePlanner.js) can credit
  // the streak the moment it happens, well before "Finish day" (Summary.jsx)
  // supplies the fuller plannedMin/actualMin numbers, and neither call should
  // be able to erase what the other already recorded. `completed` in
  // particular is kept sticky (once true, always true) so a day that's
  // already earned its streak credit can't later get un-completed by
  // Finish day just because not every planned task got finished.
  function recordStudyDay(entry) {
    const today = new Date().toISOString().slice(0, 10);
    setStudyHistory((h) => {
      const prev = h[today] || {};
      return { ...h, [today]: { ...prev, ...entry, completed: !!(prev.completed || entry.completed) } };
    });
  }

  async function handleSignOut() {
    await signOut();
    sessionStorage.removeItem(SYNCED_FLAG);
    localStorage.removeItem(LOCAL_OWNER_FLAG);
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  async function handleDeleteAccount() {
    const { error } = await deleteAccount();
    if (error) return { error };
    sessionStorage.removeItem(SYNCED_FLAG);
    localStorage.removeItem(LOCAL_OWNER_FLAG);
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.reload();
    return { error: null };
  }

  if (isSupabaseConfigured && authLoading) return <Splash />;

  if (isSupabaseConfigured && passwordRecovery) {
    return (
      <LanguageProvider lang={lang} setLang={setLang}>
        <NewPasswordScreen
          updatePassword={updatePassword}
          onDone={async () => { await signOut(); clearPasswordRecovery(); }}
        />
      </LanguageProvider>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <LanguageProvider lang={lang} setLang={setLang}>
        <Auth signUp={signUp} signIn={signIn} signInWithGoogle={signInWithGoogle} signInWithApple={signInWithApple} resetPassword={resetPassword} />
      </LanguageProvider>
    );
  }

  if (isSupabaseConfigured && !syncReady) return <Splash />;

  if (!name) {
    return (
      <LanguageProvider lang={lang} setLang={setLang}>
        <Onboarding
          onComplete={({ name: newName, schoolHours, activities: acts, profile }) => {
            if (schoolHours && schoolHours.length) {
              setRecurringActivities((prev) => (prev || []).concat(schoolHours.map((h, i) => ({ ...h, id: Date.now() + i }))));
            }
            setActivities(acts);
            setProfileDefaults(profile);
            setName(newName);
          }}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider lang={lang} setLang={setLang}>
      <MainApp
        name={name}
        setName={setName}
        profilePhoto={profilePhoto}
        setProfilePhoto={setProfilePhoto}
        schoolPlan={schoolPlan}
        activities={activities}
        profileDefaults={profileDefaults}
        setProfileDefaults={setProfileDefaults}
        weeklyCapacity={weeklyCapacity}
        energyLog={energyLog}
        logEnergy={logEnergy}
        studyHistory={studyHistory}
        recordStudyDay={recordStudyDay}
        recurringActivities={recurringActivities}
        setRecurringActivities={setRecurringActivities}
        onSignOut={isSupabaseConfigured ? handleSignOut : undefined}
        onDeleteAccount={isSupabaseConfigured ? handleDeleteAccount : undefined}
        syncError={isSupabaseConfigured ? syncError : false}
      />
    </LanguageProvider>
  );
}
