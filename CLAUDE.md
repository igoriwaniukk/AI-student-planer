# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Pulgo — notes for Claude

Pulgo is an AI study planner for students: a React 19 + Vite website (plain JS, no TypeScript) deployed on Vercel from `main` (https://ai-student-planer.vercel.app), shown inside a thin Expo iPhone app (`mobile/`). Igor, the owner, isn't a developer: answer in short, plain English with numbered steps, and expect screenshots instead of descriptions.

## Commands
- `npm run dev` — Vite only (no AI / push backend). `npm run dev:full` — Vite + the local Express backend (`server/index.js`, needs `server/.env`, see `server/.env.example`).
- `npm run lint` (oxlint) · `npm test` (vitest, all) · `npm run build`
- One test file: `npx vitest run src/lib/plannerLogic.test.js` · one test by name: `npx vitest run -t "weekDayItems"`
- CI (`.github/workflows/node.js.yml`) runs `npm ci`, build and test on Node 18/20/22 for `main`.
- Check a change in a browser: `npm run build && npx vite preview --port 4363`, then Playwright (`require('/opt/node22/lib/node_modules/playwright')`, `executablePath: '/opt/pw-browsers/chromium'`), seeding `localStorage` (`sp_name`, `sp_language`, `sp_activities`, `sp_dayAnchor`, `sp_plannerData`, `sp_profileDefaults`, `sp_recurringActivities`) in an init script and mocking `/api/*` with `page.route`. For the sign-in screens, build with fake `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` into a scratch `--outDir` and mock `https://<fake>/auth/v1/*`. Keep screenshots out of the repo.

## How changes ship
Work on the session's branch; commit, `git fetch`, `git rebase --autostash origin/<branch>`, push. Then put the app commit live: temporary branch from `origin/main` → `git cherry-pick <commit>` → `npm test` + `npm run build` → `git push origin <temp>:main` → delete the temp branch. Do this without asking once lint/tests/build pass and the change was checked. Doc-only commits from other sessions (e.g. `MARKETING_PLAN.md`) stay on the branch. No model names in commits. Everything on `main` is live at once for every user (and Apple's reviewer), so keep it solid.

## Architecture
- **No router.** `src/App.jsx` renders the screen named in `planner.state.screen` (`go(screen)` in `usePlanner`); sheets and the chat are overlays mounted alongside, and full-screen overlays portal into `.app-shell` (`AppShellPortal` in `src/components/ui.jsx`).
- **State.** `src/hooks/usePlanner.js` is one big hook holding the planner; only its `DURABLE_KEYS` are saved (to `sp_plannerData`). Everything else the app keeps lives in `localStorage` keys listed in `KEYS` (`src/lib/store.js`, via `useLocalStorage`). `src/lib/cloudSync.js` uploads all `KEYS` as one JSON blob per Supabase user and merges field by field on conflict; signing out or deleting the account clears `KEYS`. A new persisted thing = add it to `KEYS`.
- **Days are numbers.** `NUM_TODAY` (`src/lib/plannerData.js`) is an integer day index anchored by `sp_dayAnchor`; `REFERENCE_DAY` is tomorrow; `realDateForNum`/`dayInfo` turn numbers into dates. Plans are per day: `state.plans[dayNum]` (approved) and `state.drafts[dayNum]`.
- **Stored values are Polish.** Weekdays (`RECUR_DAYS`: 'Poniedziałek'…), subjects, priorities, energy and goal options are stored as Polish strings and shown through `VALUE_KEY` / `DAY_KEY` / `TASK_TEXT_KEY` in `src/lib/i18n.js`. Compare against the stored Polish value, never the translated label.
- **Scheduling logic** is pure and tested in `src/lib/plannerLogic.js` (free windows, conflicts, the deterministic packer `buildSchedule`, prep sessions…).
- **AI.** Client: `src/lib/aiPlan.js`, `aiPrep.js`, `aiRescue.js`, `src/hooks/useChat.js` call the server through `authedFetch` (`src/lib/authFetch.js`: Supabase token + time zone header). Server handlers live in `api/_lib/` (`plan.js`, `prep.js`, `rescue.js`, `chat.js`) and are shared by the Vercel functions in `api/` and the Express routes in `server/index.js` — change both entry points together. AI output is validated and the app falls back to the deterministic plan when it's broken or the AI is unavailable. Prompts are written in Polish; `api/_lib/lang.js` adds which language to answer in (the chat detects the student's message language). Every AI endpoint goes through `guardAiRequest` (sign-in check + free limits).
- **Vercel Hobby allows 12 functions** and every `.js` under `api/` outside `_lib` counts (11 now; `api/_lib/functions.test.js` guards it). Put new server logic and all server tests in `api/_lib/`, and route new actions through an existing function (e.g. "Report this answer" is a `report` body on `/api/chat`, `api/_lib/report.js`). Don't change the `vercel.json` cron.
- **Supabase**: auth (email + password with a 6-digit code typed in the app, Google, Apple) and the synced blob. Server-only tables (`ai_usage`, `entitlements`, `ai_reports`) are written with the service-role key (`api/_lib/supabaseAdmin.js`); `supabase/schema.sql` is run by Igor in the SQL editor. The "Confirm signup" email template is in `supabase/email-templates/` (needs the custom SMTP that's set up).
- **Safe areas**: use `var(--safe-top)` / `var(--safe-bottom)` / `var(--top-pad)`; `index.html` keeps `viewport-fit=cover` and has a device-height fallback for the iPhone app's web view.

## Design, colour and layout changes: propose first
When Igor asks to change how something looks (design, colours, icons, layout, "make it look better", "change the style"), don't just implement one version. First show proposals:
- Render 2–3 distinct options as real mockups (HTML rendered to a PNG with the preinstalled Chromium/Playwright), at phone size, in the app's own dark theme and colours. Include the current design for comparison when it helps.
- Label them A / B / C, describe each in a line or two, and say which one you recommend and why.
- Let Igor pick (or mix, e.g. "A with B's colours"), then build the chosen one.
- A small, explicit request ("make this card purple") or a bug from a screenshot can be done directly — the proposal step is for open-ended look-and-feel changes.

When Igor runs `/anthropic-skills:cc-handoff-prompt` and then says "go with it": interview him one question at a time with numbered options (option 1 = your recommendation), then mockups if it's visual, then build.

## App look
Dark background `#08080c`, purple accents `#8b6dff → #6d4dff`, `#a58cff`, `#c9baff`; orange `#f5a524` for deadlines/streak, teal `#2ee6c5` for weekly activities, green `#35d07f` for done. Mascot: the pug in a graduation cap and suit (`src/components/PugMascot.jsx`, `public/pug-*`). Igor likes clean, modern, dark designs and dislikes small fidgety animations. UI text comes in 9 languages: Polish and English in `src/lib/i18n.js`, Spanish, Portuguese, German, French, Italian, Chinese and Japanese in `src/lib/locales/`. A new text needs all 9 (`src/lib/i18n.test.js` checks); counted words use `.one/.few/.many` keys with `pluralForm`.

Subject emojis live in `SUBJECT_ICON` (`src/lib/taskAuto.js`); English is 💬. Never use 🔤 anywhere — it renders as an ugly "abc" box.

## iPhone app
`mobile/` (Expo) is a thin shell that shows the live website in a web view — build every feature in the website, never a second copy in `mobile/`. The website talks to the app through `src/lib/nativeBridge.js` (sign-in sheet, reminders from `src/lib/appReminders.js`, haptics); the site URL is `mobile/app.json` → `expo.extra.appUrl`. Anything in `mobile/` only reaches users with a new App Store build, so keep shell changes on the branch until a build is planned. Steps for the App Store are in `APP_STORE_READINESS.md` (step 10: answering Apple's "Information Needed"). Never put the AI key in the app.

App Store: version 1.0 was submitted in October 2026 and is in review. Never ask for or share the review demo account's password, and never suggest cancelling the submission or creating a second app. Contact address for Pulgo: pulgo.support@gmail.com (never Igor's work email).

## Premium
Pulgo Premium ($9.99/month, $59.99/year with 7 days free) is off until `PREMIUM_ENABLED=true` in Vercel. Free limits (10 chats/day, 1 AI plan/day, 1 rescue/day, 1 exam prep/week) are enforced on the server in `api/_lib/premium.js` through `guardAiRequest(req, res, feature)`; Premium status comes from RevenueCat into Supabase `entitlements`, served by `api/premium.js`. The website side is `src/lib/premium.js` + `src/components/Paywall.jsx`; buying happens only in the iPhone app (`mobile/src/purchases.js`, ships with 1.1). Igor's setup steps: `PREMIUM_SETUP.md`.
