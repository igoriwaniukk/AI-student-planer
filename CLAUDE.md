# Pulgo — notes for Claude

## Design, colour and layout changes: propose first
When Igor asks to change how something looks (design, colours, icons, layout, "make it look better", "change the style"), don't just implement one version. First show proposals:
- Render 2–3 distinct options as real mockups (HTML rendered to a PNG with the preinstalled Chromium/Playwright), at phone size, in the app's own dark theme and colours. Include the current design for comparison when it helps.
- Label them A / B / C, describe each in a line or two, and say which one you recommend and why.
- Let Igor pick (or mix, e.g. "A with B's colours"), then build the chosen one.
- A small, explicit request ("make this card purple") can be done directly — the proposal step is for open-ended look-and-feel changes.

## App look
Dark background `#08080c`, purple accents `#8b6dff → #6d4dff`, `#a58cff`, `#c9baff`; orange `#f5a524` for deadlines/streak, teal `#2ee6c5` for weekly activities, green `#35d07f` for done. Mascot: the pug in a graduation cap and suit (`src/components/PugMascot.jsx`, `public/pug-*`). UI text comes in 9 languages: Polish and English in `src/lib/i18n.js`, Spanish, Portuguese, German, French, Italian, Chinese and Japanese in `src/lib/locales/`. A new text needs all 9 (`src/lib/i18n.test.js` checks); counted words use `.one/.few/.many` keys with `pluralForm`.

Subject emojis live in `SUBJECT_ICON` (`src/lib/taskAuto.js`); English is 💬. Never use 🔤 anywhere — it renders as an ugly "abc" box.

## iPhone app
`mobile/` (Expo) is a thin shell that shows the live website in a web view — build every feature in the website, never a second copy in `mobile/`. The website talks to the app through `src/lib/nativeBridge.js` (sign-in sheet, reminders from `src/lib/appReminders.js`, haptics); the site URL is `mobile/app.json` → `expo.extra.appUrl`. Steps for the App Store are in `APP_STORE_READINESS.md`.

## Premium
Pulgo Premium ($9.99/month, $59.99/year with 7 days free) is off until `PREMIUM_ENABLED=true` in Vercel. Free limits (10 chats/day, 1 AI plan/day, 1 rescue/day, 1 exam prep/week) are enforced on the server in `api/_lib/premium.js` through `guardAiRequest(req, res, feature)`; Premium status comes from RevenueCat into Supabase `entitlements`, served by `api/premium.js`. The website side is `src/lib/premium.js` + `src/components/Paywall.jsx`; buying happens only in the iPhone app (`mobile/src/purchases.js`). Igor's setup steps: `PREMIUM_SETUP.md`.
