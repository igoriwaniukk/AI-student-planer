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
- **Home:** today's plan, the streak card (orange flame, round day bubbles), week strip, "Plan day" / "Plan tomorrow".
- **AI day plan:** builds study sessions around fixed things. "Already planned" items can be edited.
- **Exams:** add an exam or deadline, get an AI prep plan over the days before it.
- **Rescue:** re-plans a busy or messed-up day.
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
- **Rules:**
  - Don't cancel and resubmit.
  - Don't create a second app.
  - Don't change version 1.0 or the demo account while it's in review.
- The review answer text and recording script are in `APP_STORE_READINESS.md` (step 10). Reuse them for future versions.

## Version 1.1 (next)
- **Pulgo Premium:** $9.99/month or $59.99/year with 7 days free.
  - Free limits: 10 chats/day, 1 AI plan/day, 1 rescue/day, 1 exam prep/week.
  - Bought only in the iPhone app (Apple in-app purchase via RevenueCat).
  - Switched on with `PREMIUM_ENABLED=true` in Vercel.
  - Setup steps: `PREMIUM_SETUP.md`.
  - The paywall appears from Settings, at a used-up limit, and at most once a day after finishing something.
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
