# Pulgo — App Store readiness

Plan chosen: **option 1**. The Expo app in `mobile/` is the iPhone app. It shows the real Pulgo website in a full-screen web view and adds what a website can't do on an iPhone: the system sign-in sheet, reminders on the phone, haptics and an offline screen. It's built and uploaded with Expo EAS, so no Mac is needed.

Because the app shows the live website, **every website change reaches the iPhone app immediately**, with no new App Store review. A new build is needed only when something in `mobile/` changes.

✅ = done · 🟡 = partly · ❌ = missing · 👤 = only you can do it

## 1. What's built

| | Item | Where / how |
|---|---|---|
| ✅ | Web view of the production site | `mobile/App.js`. The address is one setting: `mobile/app.json` → `expo.extra.appUrl`. |
| ✅ | Native feel | Safe areas (notch and home bar), no pinch zoom or zoom on typing, no bounce, no long-press link previews, inline videos (the pug), and links to other sites opening in an in-app Safari sheet. |
| ✅ | Dark splash screen | The pug on `#08080c`. It stays until the website has loaded, for at most 10 s. |
| ✅ | Offline / error screen | `mobile/src/OfflineScreen.js`: the pug, "No connection" / "Brak połączenia" and "Try again". It retries by itself when you come back to the app. PL/EN follows the language chosen in Pulgo. |
| ✅ | Sign in inside the app | Email and password work as before. **Google** opens the phone's own sign-in sheet, then hands the session back. **Apple** uses the native Face ID sheet, and if that isn't set up yet it falls back to the sheet. Web: `src/lib/useAuth.js`; app: `mobile/src/auth.js`. |
| ✅ | App ↔ website bridge | `src/lib/nativeBridge.js` (website) ↔ `onMessage` in `mobile/App.js`. The website knows it's inside the app (`window.PulgoNative`) and sends its language, signed-in state, reminders, haptics and sign-in requests. |
| ✅ | Reminders on the phone | See the reminders table below. The website works them out (`src/lib/appReminders.js`, tested) and the app schedules them with `expo-notifications` (`mobile/src/reminders.js`). |
| ✅ | Notifications switch | Profile → Settings (and the bell). In the app it asks the iPhone for permission and turns reminders on/off. If you said "Don't allow" earlier, tapping it opens iPhone Settings. |
| ✅ | Haptic buzz when a focus session's time runs out | iPhones ignore web vibration, so the app buzzes instead. |
| ✅ | Old native skeleton removed | `mobile/src` now holds only the shell; there is no second copy of the planner logic. |
| ✅ | EAS setup | `mobile/eas.json` (development / preview / production; production build numbers go up by themselves). |
| ✅ | App settings | `app.json` has bundle ID `com.igoriwaniuk.pulgo`, iPhone only, `ITSAppUsesNonExemptEncryption = false`, Sign in with Apple, the `pulgo://` link scheme and Polish/English. Android is ready too (`com.igoriwaniuk.pulgo`). |
| ✅ | Public privacy page | `/privacy/` (PL/EN). Source: `public/privacy/index.html`. |
| ✅ | Public support page | `/support/` (PL/EN). Source: `public/support/index.html`. |
| 🟡 | Contact email on those pages | It says "coming soon" until you fill in `PULGO_CONTACT_EMAIL` in `public/legal.js`. |
| ❌ | Screen Time blocking during focus sessions | Planned for a later version. It needs the developer account plus a separate Apple permission. |

### Reminders

| Reminder | When |
|---|---|
| ⏰ Session starts soon | 10 minutes before each planned session (today's or tomorrow's approved plan). |
| 🔥 Streak at risk | 2 hours before bedtime, if you haven't studied yet today and have a streak. |
| 📋 Unfinished tasks | 1 hour before bedtime, listing what's still open. |
| 🎯 Exam tomorrow | 19:00 the evening before each exam (up to 30 days ahead). |
| 🔄 Restart your day (missed session) | 15 min after a session in today's plan should have ended if it was never started — once a day. Tapping it opens the Restart screen. |
| 🔄 Restart your day (no plan) | 14:00, if today has no approved plan and tasks are still due. Tapping it opens the Restart screen. |
| ✅ Session time's up | When a running focus session ends. It isn't shown while you're looking at the focus screen. |

The list is rebuilt every time something changes in Pulgo (a finished task clears its reminder right away) and each time the app is opened.

## 2. Your steps, in order 👤

### Step 1: Check the website address (2 min)
Open **https://ai-student-planer-igor-4a92.vercel.app** on your phone. This is Vercel's standard production address for your project, but I couldn't open it from my sandbox.
- If Pulgo opens, you're done.
- If it doesn't, copy your real address from Vercel → your project → **Domains**, and replace `appUrl` in `mobile/app.json` (or tell me and I'll do it).

### Step 2: Supabase settings for sign-in (5 min)
1. **Supabase → Authentication → URL Configuration → Redirect URLs → Add URL:** `pulgo://auth-callback`. Without this, Google and Apple sign-in inside the app will fail.
2. **Supabase → Authentication → Sign In / Providers → Apple → Client IDs:** add `com.igoriwaniuk.pulgo` after your existing Services ID, separated by a comma. This enables the native Face ID sheet; without it the app still works through the browser sheet.
3. Google needs no extra step.

### Step 2b: Vercel settings for the AI and account deletion (5 min)
1. **Vercel → your project → Settings → Environment Variables**, for Production (and Preview):
   - `ANTHROPIC_API_KEY`: the same value as in `server/.env` on your computer. Without it, the AI assistant, AI plans and exam study plans don't work on the live site.
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase → Project Settings → API → `service_role` key. Without it, **Delete account** fails, and Apple requires that to work.
2. **Deployments → ⋯ on the latest one → Redeploy**, so the new values are used.
3. Open `https://<your address>/api/chat`. It should show `{"ai":true,"accounts":true}`.

### Step 3: Contact email (2 min)
Create the Pulgo email address. Put it in `public/legal.js` (`PULGO_CONTACT_EMAIL = 'you@…'`) or send it to me.

### Step 4: Apple Developer Program ($99 / year)
1. Go to https://developer.apple.com/programs/enroll/ and sign in with your Apple ID (two-factor authentication must be on).
2. Enroll as an **Individual** (no company needed). You must be **18 or older**; if you're not, a parent enrolls and adds you.
3. Approval usually takes 1–2 days.

### Step 5: Expo account and first build (on any computer: Windows, Mac or Linux)
1. Create a free account at https://expo.dev.
2. In a terminal:
   ```
   git clone https://github.com/igoriwaniukk/AI-student-planer
   cd AI-student-planer/mobile
   npm install
   npx eas-cli login
   npx eas-cli init          # links the project; commit the change it makes to app.json
   npx eas-cli build -p ios --profile production
   ```
3. EAS asks for your Apple ID and creates the certificates and profiles by itself. Say **yes** to everything it offers to generate.
4. **Quick look before you have the Apple account:** install **Expo Go** from the App Store, run `npx expo start --tunnel` in `mobile/`, and scan the QR code. Expo Go limits: Apple's Face ID sheet falls back to the browser sheet, and the icon/splash are Expo's.

### Step 6: App Store Connect record
1. Go to https://appstoreconnect.apple.com → **Apps → + → New App**.
2. Fill in:
   - Platform: **iOS**
   - Name: **Pulgo** (if it's taken: "Pulgo – Planer nauki")
   - Primary language: **Polish**
   - Bundle ID: **com.igoriwaniuk.pulgo**
   - SKU: `pulgo-ios`
   - User access: Full
3. **App Information:**
   - Category: **Education** (secondary: Productivity)
   - Privacy Policy URL: `https://<your address>/privacy/`
4. **Version page:**
   - Support URL: `https://<your address>/support/`
   - Copyright: "2026 Igor Iwaniuk"

### Step 7: TestFlight on your iPhone
1. In `mobile/`: `npx eas-cli submit -p ios --latest`. This uploads the build from step 5.
2. Wait about 10–30 min for Apple's processing. Then App Store Connect → **TestFlight** → add yourself as an internal tester.
3. Install the **TestFlight** app on your iPhone and open Pulgo from there.
4. Test checklist:
   - [ ] Sign in with email, then sign out; sign in with Google; sign in with Apple.
   - [ ] Plan a day. Check that the "10 minutes before" reminder arrives with the phone locked.
   - [ ] Run a focus session with the phone locked: "time's up" arrives. With the screen open, it buzzes.
   - [ ] Airplane mode → open the app → "No connection" → turn the internet back on → "Try again".
   - [ ] Switch the language PL ↔ EN (reminders and the offline screen follow it).
   - [ ] Settings → notifications off/on. Delete a test account.
   - [ ] Links to other websites open in the Safari sheet, not inside Pulgo.

### Step 8: Store listing
- **Screenshots:** at least 3 for the 6.9" iPhone (1320 × 2868 or 1290 × 2796). I can generate them from the app at that size; just ask.
- **Subtitle (30 characters):** PL "Plan nauki, sesje i seria" · EN "Study plan, focus & streaks".
- **Description and keywords** in Polish and English (I can write them).
- **App Privacy** form (App Store Connect → App Privacy). Data is **linked to the user, not used for tracking**:
  - Contact Info → Email Address, Name (App Functionality)
  - User Content → Photos (profile photo, if added), Other User Content (tasks, exams, chat messages) (App Functionality)
  - Identifiers → User ID (App Functionality)
  - Tracking: **No**. Third-party advertising: **No**.
- **Age rating:** answer the questionnaire honestly. The AI chat writes free-form answers, so declare AI-generated content / chatbot where asked; it will probably come out as 12+ or 13+.
- **Encryption:** already answered in the build (`ITSAppUsesNonExemptEncryption = false`), so Apple won't ask.

### Step 9: App Review information
- Create a **demo account** (email + password) with a planned day, a few tasks and an exam, and put the login in "Sign-in required".
- Review notes, for example:
  > Pulgo is a study planner for students. Sign in with the demo account above. The app schedules local reminders (10 minutes before each planned study session, streak at risk, unfinished tasks before bedtime, and the evening before an exam), offers Sign in with Apple, and supports deleting the account in Profile → Settings → Delete account. The AI assistant helps plan study sessions.
- Then **Add for Review → Submit**. The first review usually takes 1–3 days.

## 3. Apple review rules

| | Item | Notes |
|---|---|---|
| 🟡 | More than "just a website" (guideline 4.2) | Native reminders scheduled on the phone, the native Apple sign-in sheet, haptics and the offline screen give real app value. Screen Time blocking later would make it stronger. |
| ✅ | Delete account inside the app | Settings → Delete account. |
| ✅ | Sign in with Apple offered next to Google | Native sheet, with the browser sheet as fallback. |
| ✅ | Privacy policy page | `/privacy/`, PL/EN. It also mentions the AI chat (the in-app text was updated too). |
| 👤 | App Privacy form, age rating | See step 8. |
| ✅ | Encryption question | `ITSAppUsesNonExemptEncryption = false`. |

## 4. Known limits
- **Not yet run on a real iPhone.** My sandbox has no Mac or phone. What I did check:
  - Expo config, and the iOS and Android JavaScript bundles build.
  - The whole website ↔ app conversation in a browser with a simulated app (reminder times and texts, the notifications switch, permission denied → iPhone Settings, Polish/English).
  - The public pages.

  TestFlight (step 7) is the first real-device test.
- **Reminders refresh when Pulgo is opened.** If you don't open it for several days, only the reminders already scheduled will fire. Exam reminders are scheduled up to 30 days ahead; session and streak reminders only for today and tomorrow.
- **Server pushes** (the website's once-a-day cron) don't reach the iPhone app; its local reminders cover them. Expo push tokens can be added later if needed.
- **Password-reset emails** open in Safari, not in the app. After choosing a new password, sign in again in the app.
- **Screen Time blocking** is a later version (developer account plus Apple's Family Controls permission).
