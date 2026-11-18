# Pulgo — my app

## In one sentence
Pulgo is my iPhone app for everyone who studies (students, and adults taking courses or exams). It plans their studying with AI around school, activities and exams. Its mascot is a pug in a graduation cap and suit.

## Me and my goal
- I'm a student. I build Pulgo for everyone who studies, not just for myself. Claude does the coding, and I decide what to build and how it looks.
- **Goal:** grow Pulgo into a real business with lots of users, earning money through **Pulgo Premium**.
- **Where users come from first:** TikTok and social media, in English, for everyone (study-motivation videos with AI Pulgo and the pug).
- Claude may suggest ideas on its own, briefly: one short suggestion when it's really useful.

## Where things are
- **App Store name:** Pulgo · bundle ID `com.igoriwaniuk.pulgo`
- **Live app content:** https://ai-student-planer.vercel.app (the app loads its screens from here)
- **Code:** GitHub `igoriwaniukk/AI-student-planer`, work branch `claude/app-appearance-kprdoo`, live branch `main`
- **Services:**
  - Vercel: hosting
  - Supabase: accounts and data
  - Anthropic Claude: the AI
  - Apple App Store Connect
  - RevenueCat: Premium (from 1.1)
  - Gmail `pulgo.support@gmail.com`: support email and the sender of sign-up emails
- **Demo account for Apple:** `pulgo.support+review@gmail.com` (the password is only in App Store Connect, never shared)
- **Test accounts:** `pulgo.support+anything@gmail.com`. All of them land in the pulgo.support inbox.
- Secrets (API keys, passwords) live only in Vercel / Supabase settings, never in chats or files.

## What the app does (version 1.0)
- **Onboarding:** name, school hours per day, weekly activities (school, gym, football…), study preferences, 9 languages.
- **Home:** today's plan, the streak card (orange flame, round day bubbles), "This week" (an empty week shows a pug line instead of empty bars; "All plans ›" stays), **Pug's tip of the day** (a glowing card with a tip picked from your own day: exam coming up, keep your streak, a study tip; button "Ask AI Pulgo"), the next deadline, "Plan tomorrow". The Energy card was removed from Home (energy is still set in the planner and Profile).
- **Streak rewards:**
  - **Milestones** at 7, 10, 30, 50, 100, 200 and 365 days in a row: a celebration (no badges — removed at Igor's request).
  - **Streak freezes (Premium):** 1 freeze for every 3 finished sessions, plus 1 as a gift at each milestone, max 3. A missed day is covered automatically and shows as 🧊 on the streak card.
  - Premium streak card: gold edge, 👑 on the flame, a PREMIUM chip, 🧊 n/3 and the progress to the next freeze. Free users see a small locked "🔒 🧊 Freeze" chip that opens Premium; the Premium screen lists "🧊 Never lose your streak".
- **AI day plan:** builds study sessions around fixed things.
  - "Plan today / Plan tomorrow" is a clean list: tasks with checkboxes, then "Your day" rows (free time, fixed activities, energy, "More options" for preference and note) that open when tapped. The button shows the total ("Build my plan · 1 hr 15 min").
  - The finished plan is a timeline: times on the left, only study sessions are cards (tap one to move it or edit the task), breaks/gym/free time/sleep are one short line each. On top: "2 sessions · 1 hr 15 min · done by 17:25". The AI's reason is hidden behind "Why this plan?" and is one short sentence. "Edit" (top right) lets you remove or add sessions; "New plan" makes another one.
- **Adding a task** (+ menu → purple **Task** card, or any "+ Add task"): a full page with big tiles (Homework, Project, Presentation, Essay, Reading, Revision, To-do, Other) and optional subject chips. The name fills in by itself (e.g. "Biology Project") and the length by type, so almost no typing. When, How long and More options (time, priority, repeat, note) are rows you tap to open.
- **Exams:** add an exam or deadline, get an AI prep plan over the days before it. The form is the same clean list: type and subject chips, name, "When" rows (date, time), and a prep-plan switch with topics, difficulty, knowledge and goal rows.
- **Finish day (Day summary):** one line on top ("3 of 3 done · 2 hr studied"), sessions as rows (tap one to fix its time and rate it), "Not done" with Keep / Let it go, and "Your day" rows (how hard, energy, note). The summary box is gone.
- **Weekly activity:** name, days, then Start / End as rows you tap to change.
- **Restart your day (Rescue):** re-plans a busy or messed-up day. Same clean look as the planner: "What changed?" chips, the tasks still left, and "Your day" rows (study time, energy, fixed activities and sleep shown locked 🔒). The new plan shows as the same timeline, with tasks moved to another day listed under it and the AI's reason behind "Why this plan?".
- **Focus timer:** a soft wide ring, with the session counting through reloads.
- **Calendar:** day and week view of everything planned.
- **AI Pulgo chat** (the pug button):
  - answers in the language you write in
  - remembers the conversation; the pencil starts a new chat
  - starts at the top of the page
  - gives "tough love" when asked: one short, dramatic paragraph
  - has **Copy** and **Report** under each answer (reports land in Supabase → `ai_reports`)
- **Reminders:** 10 minutes before sessions, streak at risk, unfinished tasks before bed, the evening before an exam.
- **Sign-up:** email + password with a **6-digit code** from a Pulgo-styled email, typed in the app. Also Google and Sign in with Apple.
- **Settings:** language, reminders, sign out, **Delete account** (Apple requires it).
- **Languages:** Polish, English, Spanish, Portuguese, German, French, Italian, Chinese, Japanese.

## Pug World: dog collection game (phase 1 built, hidden preview)
Studying earns **chests**; chests hold **collectible 3D dogs**. Agreed with Igor (Nov 2026), replacing the earlier dog-school and dog-care ideas:
- **Start:** choose 1 of 3 starter dogs.
- **Chests 🎁:** small for every finished session, silver for a finished plan/day, gold for streak milestones, epic for winning the weekly friends ranking; plus the day-7 calendar chest and the 3-missions bonus chest.
- **Chest contents (Nov 18, 2026):** every chest gives coins plus one of: a dog (small 10% · silver 25% · gold 60% · epic 100%), an outfit, a **streak freeze** (works for free users too) or bonus coins. The chest from a study session **opens by itself** right after the session.
- **~30 dogs at launch:** 6 breeds × fur colours × special skins (golden, crystal, galaxy, rainbow) — about 15 Common, 9 Rare, 4 Epic, 2 Legendary. Chances shown in the app.
- **Duplicates level a dog up** (★ → ★★ → ★★★; at max level a copy turns into coins). Every dog has **power**; the **collection score** is the total and is compared with friends; Epic and Legendary dogs give **+% coins** (up to +30%).
- **No care** (no hunger/bath bars). Dogs are shown as **album cards** and in a **3D showcase** (spin, outfits, a trick).
- **Outfits** (head / face / neck / body) from chests and the shop, plus **full outfit sets** (Wizard, Superhero, Pirate, Chef: buy parts one by one or the whole set 25% cheaper; a full set on the favourite dog = +5% coins); **today's shop** (4 daily offers); **daily rewards calendar**; **3 daily missions**; **collection book set rewards** (e.g. "all corgis").
- **Friends:** invite codes, compare collections/power/favourite dogs, weekly ranking. No chat, nicknames, block/remove.
- **Never sold for money:** chests only from studying and playing (paid loot boxes are restricted by Apple and banned in some countries). Premium = one bonus chest a day.
- **Dog look (Nov 14, 2026):** cute **2D sticker cartoons** (Igor picked option A over soft 2D and the first 3D version): big head, dark outline, white sticker border, light album cards in the rarity's colour. Drawn in code (`src/components/pugWorld/dogArt.js`), outfits drawn on top; they blink and wag, tap = jump, Trick = flip. An illustrator can redraw them later — brief in `PUG_WORLD_ARTIST_BRIEF.md`.
- **Status (Nov 13, 2026): phase 1 is live but hidden.** Built: starter pick, chests from sessions / plans / finished days / streaks / calendar / missions / sets / Premium, chest opening (shake → burst with light rays → the dog jumps out), album with "?" cards and breed sets, chances table, levels / power / score / perks, the dog showcase (tap to jump, trick, outfits, favourite), shop (4 daily offers, one −50%, chests for coins), Home card and a "+1 chest" toast after a session. All 9 languages. **To see it on a phone:** Settings → tap **Version** 7 times (taps again turn it off); a "🐶 Pug World" row appears there and a card on Home. Nothing is collected or saved until it's switched on. Code: `src/lib/pugWorld/` (rules, tested), `src/components/pugWorld/` (screens, dog drawings), `src/hooks/usePugWorld.js`.
- **Part of Pulgo (Nov 15, 2026):** Igor picked "C with A's Home": a Home card under the streak (your dog, today's missions, chests), your dog studying with you on the study timer (book + speech bubble), and after a session the earned chest appears with your dog saying "tap it to open" (or Later).
- **Pets tab (Nov 18, 2026):** while the game is on, **Pets** replaces Profile in the bottom bar (profile = the photo on Home). The Pets page has Yard (all dogs wander a little night garden; tap one to see it), Missions (daily missions, **monthly challenge**: 20 study sessions a month → epic chest + 300 coins, daily rewards), Album, Shop, Friends. Home keeps a short card (your dog, chests, "Missions 1/3 · This month 4/20").
- **Little dogs on Home (Nov 18, 2026):** Igor picked option B. Once you have dogs, your favourite and your 2 rarest dogs (tiny, ~35 px) stand on the top edges of the Home cards (streak card, next session, today's tasks, this week). Every 6–10 s one of them walks a bit along its card or hops to the card above or below — one at a time, calm. On the streak card they stay on the right half, clear of the greeting. Tap a dog → it jumps and the Pets page opens; a red number on your favourite = chests waiting. Before you have a dog, Home shows the invitation card instead. Code: `src/components/pugWorld/HomePets.jsx`; cards opt in with `data-perch`.
- **Missions page + dogs everywhere (Nov 18, 2026):** Igor picked option B: the **Pets tab is gone, Profile is back** in the bottom bar. Home shows **today's 3 missions** (Duolingo-style thick bars, "Resets in X h", "See all ›"); tapping it opens the **Missions page**: a purple "November challenge" card (20 sessions a month, now with a chest on the way: small at 7, silver at 13, epic + 300 coins at 20), the daily missions + silver-chest bonus, daily rewards, and a row of your dogs ("Collection ›"). **My dogs** (yard, album, shop, friends) opens by tapping any dog or from the Missions page, with a back button. Each dog's card has **"Where does it live?"**: Home, Calendar, Tasks, Plan a day, Study timer or Nowhere — up to 2 screens per dog, up to 3 dogs per screen; the favourite always lives on Home. The dogs stand on the cards of those screens and hop around; the study timer shows the dog that lives there. Code: `src/components/pugWorld/MissionsPage.jsx`, `ScreenPets.jsx` (any screen; cards opt in with `data-perch`), `dogsOn`/`togglePlace` in `src/lib/pugWorld/logic.js`.
- **Colourful My dogs + treasure chests (Nov 18, 2026):** Igor picked design A with treasure chests. My dogs shows **one big dog** (no more yard) on a stage in its rarity's bright colour (common green, rare blue, epic purple, legendary yellow), chunky Duolingo-style tabs and buttons, its breed's versions, the chests as **colour tiles** (small orange, silver blue, gold yellow, epic purple — tap to open), "Where does it live?", outfits. **New chest drawing** everywhere: wooden planks and grain, metal bands with rivets and corners, a shield lock with a jewel (blue / red / pink), glow and sparkles on the better ones. **Opening a chest** happens on a bright sunburst in the chest's colour (it changes colour when the chest upgrades), with white tap pips and a big green "Tap!" / "Open" button; what comes out is shown on its own colour.
- **Phase 2 (next):** Friends tab (invite codes, compare collections, weekly ranking with epic chests) — needs a Supabase table Igor pastes into the SQL editor. Then switch the game on for everyone.
- Built inside the live 1.1 app, hidden, then switched on for everyone (no App Store build). Later: **real shelter dogs** (coins → real meals paid by Pulgo, monthly budget) in the first update after launch; App Store **1.2** later for new screenshots and a home-screen widget.

## Look
- Dark background `#08080c`
- Purple accents `#8b6dff → #6d4dff`
- Orange `#f5a524` for deadlines and the streak
- Teal `#2ee6c5` for weekly activities
- Green `#35d07f` for done
- I like clean, modern, dark designs. No small fidgety animations.
- Never use the 🔤 emoji.

## App Store status
- **Oct 10, 2026:** version 1.0 submitted (free, build 1.0.0 (2)).
- **Oct 12:** Apple asked for more information (Guideline 2.1, new developer account). I replied with a screen recording + text and resubmitted.
- **Oct 19:** expedited review requested and approved.
- **Oct 23:** still "Waiting for Review". I wrote to Apple through the contact form.
- **Oct 18:** the updated Apple Developer Program License Agreement is signed (nothing blocking on my side).
- **Oct 26:** still waiting. If there's no answer, call Apple Developer Support (developer.apple.com/contact → Membership and Account → Phone).
- **Oct 29–30:** the contact form went to the App Review Board as an "appeal" (ticket APL619794). They closed it because the app is already resubmitted, and forwarded my message to an App Review team member, who will write in App Store Connect if needed. Next step if nothing happens: reply to Apple's latest message in App Store Connect → App Review.
- **Oct 31, 2026: APPROVED 🎉** — "In Review" and then "Ready for Distribution" on the same day. Pulgo 1.0 is in the App Store.
- **Nov 9, 2026:** version 1.1 (Premium) submitted with both subscriptions. Apple's automatic check stopped it (Guideline 3.1.2: no Terms of Use (EULA) link in the Description). Fixed by adding the Terms of Use and Privacy Policy links to the end of the Description in every language, then resubmitted.
- **By Nov 13, 2026: 1.1 APPROVED 🎉** — Pulgo 1.1 with Pulgo Premium is live in the App Store.
- **For every future submission with subscriptions:** keep the Terms of Use and Privacy links at the end of the Description in every language.
- **TestFlight:**
  - internal group "Team (Expo)" works now (add people via Users and Access, role Marketing)
  - external group "Beta" with a public link created; build 1.0.0 (2) is "Waiting for Beta App Review", and the link starts working once it's approved
- **Rules for future versions:**
  - Never cancel and resubmit just because it's slow, and never create a second app.
  - Don't change a version or the demo account while it's in review.
  - Keep the demo account working, since Apple uses it for every update.
- The review answer text and recording script are in `APP_STORE_READINESS.md` (step 10). Reuse them for future versions.

## Version 1.1 (live since Nov 2026)
- **Setup progress (Nov 2026):**
  - Paid Apps agreement signed; bank account and US tax form (W-8BEN) submitted, waiting to become Active
  - Small Business Program applied for (15% instead of 30%)
  - Subscriptions created, not submitted yet: group "Pulgo Premium", `pulgo_premium_monthly` $9.99 and `pulgo_premium_yearly` $59.99 with a free week (no end date), names in 9 languages
  - RevenueCat done: App Store app with the In-App Purchase key, products, entitlement `premium` (both products), offering `default` (Monthly + Annual), webhook to `/api/premium`
  - Vercel: `REVENUECAT_SECRET_KEY` and `REVENUECAT_WEBHOOK_AUTH` added (Production); the public `appl_` key is in the 1.1 app config
  - still to do: wait for the bank to be Active, redeploy Vercel, the 1.1 build, a review screenshot of the payment screen, sandbox test, then submit 1.1 with both subscriptions and set `PREMIUM_ENABLED=true`
- **Pulgo Premium:** $9.99/month or $59.99/year with 7 days free.
  - Free limits: 10 chats/day, 1 AI plan/day, 1 rescue/day, 1 exam prep/week.
  - Bought only in the iPhone app (Apple in-app purchase via RevenueCat).
  - Switched on with `PREMIUM_ENABLED=true` in Vercel.
  - Setup steps: `PREMIUM_SETUP.md`.
  - The paywall appears once right after onboarding, from Settings and the Premium card on Profile, at a used-up limit, and at most once a day after finishing something.
  - Profile shows a big Premium card ("Try 7 days free") for free users; subscribers get a PREMIUM badge and a membership card (name, member since, renewal date, Manage).
- **Hide the gray ^ ˅ ✓ bar** above the keyboard (needs the new build).
- **Block social media during a study session** (Premium, Apple Screen Time). I applied to Apple for the Family Controls permission.
- Later ideas: let the planner plan any day of the week, a Polish screenshot set, new App Store screenshots (chat, focus, calendar), an App Store header banner (A/B/C designs were shown, none picked yet).

## Marketing
- All in **English**, for students everywhere. Sell the result, not the features: "I stopped cramming the night before."
- **The pug is the star**, the main character of every video (like Duolingo's owl).
- **TikTok** (Creator account) and **Instagram** (Creator, Reels):
  - post the same videos on both
  - first video idea: slide 1 "🗣️: I can't make myself study today" → slide 2 the chat asking AI Pulgo "Give me a brutally honest wake-up call…" → slide 3 its dramatic answer
  - caption e.g. "Asked Pulgo for a brutally honest wake-up call. Now I'm studying 😭📚 #studymotivation #studytok #academicweapon #pulgo #fyp"
- **Reddit:** be helpful first, mention Pulgo later, in student subs (r/GetStudying, r/studytips, r/college).
- Full plan: `MARKETING_PLAN.md`.

## How I work with Claude on Pulgo
- I send screenshots and short messages; Claude answers in plain English with numbered steps.
- **Small bug** → Claude fixes it right away and puts it live.
- **Design change** → Claude first shows A / B / C mockups, I pick, then it builds.
- **Bigger task** → I run `/anthropic-skills:cc-handoff-prompt`, then say "go with it". Claude asks me one question at a time with numbered answers, then builds.
- Fixes go live within about a minute. I close and reopen the app to see them. No App Store update is needed, except for changes in the iPhone shell (`mobile/`).
- Project notes for Claude are in `CLAUDE.md` inside the repo.

## Things I set up myself (done)
- Supabase:
  - `schema.sql` run (tables `ai_usage`, `entitlements`, `ai_reports`)
  - custom SMTP with Gmail (app password)
  - "Confirm signup" email = design A with the code
  - redirect URLs
- Vercel env variables (AI key, Supabase keys)
- App Store Connect:
  - app info, screenshots, privacy
  - demo account, review notes
