# Pulgo — logic audit

Only confirmed problems are listed, most serious first. Each one was checked by running the real code (unit-level scripts in the Europe/Warsaw time zone, Playwright with a fake clock) or by an exact code trace with concrete inputs. Line numbers refer to commit `35fcb49`.

---

## Serious — data loss, wrong data, or crashes

### 1. A failed cloud download wipes the account
**Where:** `src/App.jsx:87-99`, `src/lib/cloudSync.js:36-38`

**Steps:**
1. Sign in on a new phone or in a new tab while the network hiccups, so the first download from Supabase fails.
2. The app only notes the error, marks the tab as "synced", and uploads what the phone has locally.
3. At that moment that's just empty defaults (no name, no history, no plans). The upload replaces the whole saved account.
4. The tab never tries to download again.

**What you'd see:** your plans, streak history and profile are gone; the app sends you back to onboarding.

**Fix:** if the download fails, don't upload and don't mark the tab as synced. Show an error and retry.

### 2. An older copy on another device can overwrite newer data
**Where:** `src/App.jsx:64` (download only once per tab session), `:104-118` (upload on change), `src/lib/cloudSync.js:36-38` (whole-account overwrite, no version check), `src/hooks/usePlanner.js:210-212` (saves on every start)

**Steps:**
1. A laptop tab downloads your data in the morning.
2. On the phone you finish a session, which is uploaded.
3. You reload the laptop tab. It doesn't download again, but it saves its own state on start, and 1.5 s later uploads its old copy over the phone's.
4. The next fresh start on the phone downloads that old copy.

**What you'd see:** a finished session and today's streak credit disappear.

**Fix:** download again on start and when the app comes back to the foreground. Refuse to overwrite a newer cloud copy (compare `updated_at`), or merge per key (e.g. combine study-history dates). Don't upload on start when nothing changed.

### 3. Editing or adding a task with a specific date moves it one day earlier
**Where:** `src/hooks/usePlanner.js:509` (`realDateForNum(dayNum).toISOString()`), also `TaskEditSheet.jsx:9`, `Deadline.jsx:21`, `WheelDatePicker.jsx:30` (`TODAY_ISO` in universal time)

**Steps:** in Poland, a task on Wed 30 Sep opens in the editor as 29 Sep and is saved as Tue 29 Sep. Save again: Mon 28. Then Sun 27. Verified; in UTC it round-trips correctly.

**What you'd see:**
- Opening and saving a dated task, even just to rename it, moves it one day earlier each time.
- "+ Add task" on a day 2+ days ahead (Tasks screen) saves it on the day before.
- Between 00:00 and 02:00, "Pick date" starts on yesterday.

**Fix:** build the date string from the local date (`localDateKey(realDateForNum(n))`), and use `localDateKey()` for the "today" values in the pickers.

### 4. An approved plan's times reset every time the app opens (and tomorrow's plan gets today's tasks)
**Where:** `src/hooks/usePlanner.js:248-252`: on every start the plan is rebuilt from scratch for "today", even when it's approved. The same unconditional rebuild happens in `removeBlock` (:499), `saveTaskEdit` (:633) and `removeTaskDef` (:661). `saveBlockEdit` (:484-492) never saves the moved start time.

**Steps:**
- Approve a plan, move a session to 17:13, reload: it's back at 06:30. This is the jump seen in testing.
- Rename an unrelated to-do: the plan's times reset too.
- Approve tomorrow's plan and reload: it now contains today's tasks, while still being labelled as tomorrow's.

**What you'd see:** saved plans change by themselves, and tomorrow's plan loses its sessions.

**Fix:** never rebuild an approved plan automatically. When a rebuild is really needed, build it for the plan's own day and keep existing start times. Save moved start times.

### 5. Deleting an exam can crash Home
**Where:** `src/hooks/usePlanner.js:990-1006` (`removeCustomExam` removes the exam's prep tasks but not their entries in the plan), then `Home.jsx:241` reads `d.color` of a task that no longer exists

**Steps:** have an exam's prep session in today's plan, then delete the exam. Home (or the Plan screen's timeline) throws an error.

**What you'd see:** a broken screen until you reload.

**Fix:** remove the deleted sessions from `schedule`, `durOverride` and `sessionReview` too, and guard against missing tasks.

### 6. A bedtime after midnight breaks planning completely
**Where:** `src/lib/plannerLogic.js:162` (bedtime "00:30" becomes 30 minutes after the *start* of the day), used at `:247` and `:607`

**Steps:** set bedtime 00:30 and wake 08:00. Free time is empty, every task save fails with "that's after your bedtime", and "Restart your day" moves every task away. The bedtime wheel offers 00:00–05:00, so this is easy to hit.

**What you'd see:** you can't plan or add school tasks at all.

**Fix:** if bedtime is at or before wake time, treat it as the next day (+24 h).

### 7. After tapping "Plan tomorrow", today's finished sessions are logged under tomorrow
**Where:** `src/hooks/usePlanner.js:407, 422, 445-447`: starting, pausing and finishing use the Planner's Today/Tomorrow switch. Home's "Plan tomorrow" buttons (`Home.jsx:153, 695`) and `Summary.jsx:269` set it to tomorrow, and nothing sets it back.

**Steps:** approve today's plan, tap "Plan tomorrow", go back Home, finish your sessions. They're saved with tomorrow's day.

**What you'd see:**
- Today's summary shows them as not done, and the week card shows 0 minutes.
- A repeating task shows today as missed and tomorrow as already done.

**Fix:** sessions should always use the day their plan is for (`selectedDay`), never the Planner switch.

### 8. "Restart your day" uses the wrong tasks and times, and hides future tasks forever
**Where:** `src/lib/plannerLogic.js:227` (tasks gathered without a day, so every day counts, and finished ones aren't removed), `:238` (starts at wake time), `src/hooks/usePlanner.js:708` (marks tasks "moved" under the wrong key); same in `aiRescue.js:43`. Also `plannerLogic.js:206`: planning "today" in the afternoon starts at wake time.

**Steps:**
1. In the afternoon, with one finished session, one open session and a task for next week, restart the day.
2. The new plan contains the *finished* session and next week's task, starting at 06:30.
3. Today's open session is marked "moved".
4. A future task marked "moved" never appears in any plan again.

**What you'd see:** a rescued plan full of the wrong work at times already passed (so it instantly shows "missed"), and future tasks that vanish.

**Fix:** only use today's unfinished tasks, start at the current time, and mark "moved" only on today's task with today's day.

---

## Medium — wrong dates or messages

### 9. Streak and "studied today" use universal time, so just after midnight they're a day behind
**Where:** `src/lib/plannerLogic.js:442-455, 562-564, 585-589` and `src/App.jsx:347` (`toISOString` date), compared with the local dates used by the push sync (`App.jsx:181-188`), the summary and the day numbers; also `Home.jsx:532` (energy check-ins)

**Steps:**
- Study on Saturday evening, then open the app at 00:30 on Sunday with nothing done yet. Home says "Today's done — your streak is safe" and shows a 🔥 on Sunday (verified).
- The push server is told Sunday is done, so Sunday's push says "Streak secured" and you may skip studying.
- A session finished at 00:30 is credited to the previous day, which can break the streak.
- Around the clock change (last Sunday of October / March) the streak is off by one between 01:00 and 02:00, which can show a false "your streak ended".

**What you'd see:** a streak that's wrong between 00:00 and 02:00 (01:00 in winter); a false "streak secured" push.

**Fix:** save and read study history by the local date (`localDateKey()`) everywhere, stepping back by calendar day, with a one-time conversion of existing entries.

### 10. The app doesn't notice midnight while it stays open
**Where:** `src/lib/plannerData.js:62-91`: "today" (`NUM_TODAY`, `REFERENCE_DAY`, `WEEK_DAYS`) is worked out once when the app loads. `src/App.jsx:171-192` mixes it with the live date.

**Steps:** leave the app open at 23:58 on Saturday. At 00:00:16 on Sunday, Home still says Saturday, the highlighted day is Saturday, and Sunday's task isn't shown (verified). Yesterday's unfinished session is sent to the push server as today's.

**What you'd see:** yesterday's day until you reload; a morning push naming yesterday's task.

**Fix:** when the local date changes (checked on the existing 30 s clock and when the app returns to the foreground), reload or recompute "today".

### 11. Plans for another day are treated as today's (tomorrow's and old ones)
**Where:** `src/screens/Home.jsx:180` (`NextSessionCard`), `:598-610` (missed-session pop-up), `src/lib/chatContext.js:25-34`: they read `state.schedule` without checking which day it's for. Plans also never expire (`planApproved` with a past `selectedDay` stays forever).

**Steps:**
- At 20:00, approve tomorrow's plan with a 16:00 session. Home immediately shows "You missed a session", and "Next session" offers tomorrow's session with a Start button. The chat is told it's today's.
- An old plan's paused "Homework" stays active days later (seen on your phone).

**What you'd see:** false "missed session" pop-ups; old or tomorrow's sessions shown as today's.

**Fix:** only treat the plan as today's when it's for today (`scheduleIsFor(state, NUM_TODAY)`). Retire an approved plan once its day has passed.

### 12. Exams are saved one day late
**Where:**
- `src/hooks/usePlanner.js:944-951` (`addCustomExam`: `REFERENCE_DAY + daysUntil`, where `REFERENCE_DAY` is already tomorrow)
- the same off-by-one in `usePlanner.js:368` (prep plan's exam day), `Prep.jsx:37` (exam date in the header) and `Deadline.jsx:139` ("Deadline" row)
- `WeekStrip`'s countdown uses the same convention

**Steps:** add an exam for Sunday the 27th. It's placed on Monday the 28th in Calendar and Plans, while the countdown says "Today" (verified).

**What you'd see:** exam dates one day late everywhere.

**Fix:** store `NUM_TODAY + daysUntil` and count days until from today, in all the places above, and shift already-saved exams back by one day once.

### 13. Prep sessions land on or after the exam when it's 2 days away or less
**Where:** `src/lib/plannerLogic.js:397-405`: the first session is fixed at the day after tomorrow.

**Steps:** plan 5 sessions for an exam tomorrow: 3 land after the exam and 2 on it. For an exam in 2 days, all 5 land on exam day. The date fix in #12 alone doesn't solve it.

**What you'd see:** prep sessions after the exam; today and tomorrow are never used for prep.

**Fix:** start from today, never go past the day before the exam, and shorten the plan if there aren't enough days.

### 14. A new task's time is checked against the wrong day, so it can overlap activities or go past bedtime
**Where:** `src/hooks/usePlanner.js:604` (checked against the Planner day's activities, not the task's own day); `plannerLogic.js:213-214` (a task with a fixed start ignores activities and bedtime; every task saved in the editor gets one, `:621`)

**Steps:**
- Tennis on Tuesday 19:00–20:30: adding a Tuesday task at 19:00 saves without a warning, and it's scheduled on top of tennis.
- With one task fixed at 22:00, the next one is placed at 22:40–23:40, past a 22:30 bedtime.

**What you'd see:** overlapping sessions and sessions after bedtime.

**Fix:** check against the task's own day, and make fixed starts respect activities and bedtime.

### 15. Prep session times chosen on the Prep screen are thrown away
**Where:** `src/hooks/usePlanner.js:850-858`: `confirmPrep` creates the prep tasks without their chosen time.

**What you'd see:** a prep session you set for 17:00 shows up at your wake time (06:30 by default).

**Fix:** save each session's time as its start time when confirming.

### 16. Finishing a session through the chat doesn't count
**Where:** `src/components/ChatWidget.jsx:87-97`: it saves "completed" without a day, under the wrong key for repeating tasks, and doesn't credit the streak.

**What you'd see:** the week card ignores the session, today's streak isn't credited, and a repeating session stays unticked.

**Fix:** reuse the normal finish logic (right key, today's day, study-day credit).

### 17. Everyday tasks get classed as History
**Where:** `src/lib/taskAuto.js:15`: short History keywords match inside other words ("king" in "cooking"/"parking", "war" in "warzywa"/"Warszawa"), and subjects are checked before personal keywords.

**Steps:** "Cooking dinner", "Kupić warzywa", "Pay for parking" and "Wyjazd do Warszawy" all become school tasks (History 🏛️) and get a study session.

**Fix:** match whole words or word starts only, and check personal keywords first.

---

## Low

### 18. Polish/English grammar slips
Examples:
- `plans.inDays` "1 dni" (should be "1 dzień").
- `home.planReadyForDay` "1 sesji" / "1 sessions".
- English "Your 10-days streak" (should be "10-day").
- `zad()` and "moved" counts give "22 zadań" (should be "22 zadania").
- Chat exam confirmation "za 1 dni" / "in 1 days".

**Fix:** one Polish plural helper (1 / 2–4 except 12–14 / 5+) and English one/many forms.

### 19. Push settings can be lost when two updates overlap
**Where:** `api/_lib/pushStore.js:17-22` (read-then-write), `api/_lib/push.js:96, :99` (the cron writes back its old copy)

**What you'd see:** occasionally a push based on stale info (e.g. "streak secured" missing, or an outdated next session).

**Fix:** merge updates in the database in one step, and have the cron write only its own "last sent" fields.

### 20. Energy check-in points stop growing after 30 check-ins
**Where:** `src/App.jsx:335` keeps only the last 30 check-ins, and `computeTotalPoints` counts them.

**What you'd see:** check-in points cap at 60 instead of 2 per check-in forever.

**Fix:** keep a separate lifetime count.
