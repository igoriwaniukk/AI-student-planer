# Pulgo — marketing plan

All marketing is in **English**, aimed at English-speaking students (high school, college, university).

## 1. The blueprint we follow ("First 10,000 Users Blueprint")

1. **Identify your viral marketing message**
   - People don't care about the product, they care about what it does for them.
   - Don't sell features, sell the transformation.
   - Content isn't there to explain functionality. Its **only** job is to drive a click.
2. **Market research**
   - Find viral content in your niche.
   - Ride trends for low-hanging-fruit views.
3. **Create content / hire creators**
   - Hire creators on a results-only basis with https://postedapp.com/
   - Build a team of consistent viral creators.
   - Pay CPM (per 1,000 views) or a flat rate per piece.
   - Use every channel.
4. **Scale with paid ads**
   - Simple math: **CAC < LTV** (cost to get a user < what a user is worth).
5. **Cheat code: subreddits**: don't spam links. Be helpful, be real, engage, *then* pitch. Provide value.
   r/SaaS, r/startups, r/Entrepreneur, r/startup, r/ProductMgt, r/sweatystartup, r/smallbusiness,
   r/RoastMyStartup, r/SideProject, r/indiebiz, r/startups_promotion, r/thesidehustle, r/growmybusiness,
   r/productivity, r/InternetIsBeautiful, r/Webdev, r/programming, r/Webdesign, r/EntrepreneurRideAlong,
   r/Plugyourproduct, r/MadeThis, r/AlphaandBetausers, r/advancedentrepreneur, r/design_critiques,
   r/Coupons, r/LadyBusiness, r/AskReddit, r/TodayILearned, r/WantToLearn

## 2. Applied to Pulgo

**The transformation, not the features.** Not "AI planner with streaks and reminders", but:
- "I stopped cramming the night before."
- "Finals without an all-nighter."
- "The pug tells me what to study today, so I don't have to think about it."

**The pug is the viral asset.** A pug in a graduation cap and suit that nags you to study is
shareable on its own (think Duolingo's owl). It is the main character of every video.

**About the subreddit list:** most of those subs are founders, not students. Use them for feedback and
beta testers (r/SideProject, r/RoastMyStartup, r/AlphaandBetausers, r/MadeThis, r/InternetIsBeautiful).
For **users**, go where students are: r/GetStudying, r/studytips, r/college, r/Studying, r/productivity.
Read each sub's self-promotion rules first.

**Paid ads only once the math works.** CAC < LTV needs a known LTV, so first we need revenue or known
retention. Until then, spend on creators, not ads.

**Calendar to push around:** back to school (Aug–Sep), midterms (Oct, Mar), finals (Dec, May),
UK exam season (May–Jun).

## 3. Timeline

| Phase | When | Goal |
|---|---|---|
| 0. Setup | Week 1 | Accounts, bios, warm-up, first videos |
| 1. Organic + Reddit | Weeks 2–6 | 2 videos/day, find the hooks that work, first 500 users |
| 2. Creators | Weeks 6–12 | 3–10 student creators on results-based pay (Posted), 1,000–3,000 users |
| 3. Paid ads | When CAC < LTV is proven | Scale the winning videos as ads, up to 10,000 users |

## 4. Social accounts

Same handle everywhere if possible (e.g. `@pulgo.app` / `@pulgoapp`). Profile photo: the pug
(`public/pug-avatar.webp`), cropped tight on the face. A short domain (e.g. `pulgo.app`) pointing at
https://ai-student-planer.vercel.app looks better in bios.

### TikTok
- Account type: **Personal / Creator** (business accounts lose most trending sounds).
- Name: `Pulgo 🐶 Study Planner`
- Bio: `The pug that plans your studying 🎓🐶 Exams in → daily plan out ⬇️`
- Link in bio once TikTok unlocks it for the account.
- Pin 3 videos: what Pulgo is (15 s), best performer, a pug POV skit.

### Instagram
- Account type: **Professional → Creator** (insights + link from day one).
- Name: `Pulgo | Study Planner 🐶`
- Bio:
  ```
  Pulgo 🐶🎓 The pug that plans your studying
  Add your exams → get a day-by-day plan
  One task at a time. No all-nighters.
  Try it ⬇️
  ```
- Post every TikTok as a Reel (export from CapCut, no TikTok watermark) and reshare it to Stories.
- Highlights: "How it works", "Tips", "Pug 🐶".

### Reddit
- A **personal** account, not a brand account. About:
  `Student & dev building Pulgo, a study planner with a pug mascot 🐶 Here for study methods, planning and beating procrastination.`
- Weeks 1–2: helpful comments only, no links, no mentions (new low-karma accounts get filtered).
- From week 3: mention Pulgo only where it truly answers the question, always saying "I'm building it".
  One "build in public" post in r/SideProject.

### First week
1. Create the accounts with the bios above.
2. Days 1–3: follow ~20 study creators, watch/like #studytok for 15 min a day, 3 helpful Reddit comments a day.
3. Day 4: post the first 2 videos from the content board.

## 5. Daily routine (60–90 min)

| When | What |
|---|---|
| ~6:30 | New brief lands on the content board (automatic) |
| Morning | Watch the 2 originals, record and edit both Pulgo versions in CapCut |
| 9:00 | Post video 1 on TikTok, Reels and Shorts |
| 18:00 | Post video 2 on TikTok, Reels and Shorts |
| Evening | Reply to every comment and DM; answer the 2 Reddit threads from the board |
| Each step | Tick Recorded / TikTok / Reels / Shorts on the board |

Batch-record on quiet days if it saves time. Monday: look at last week's numbers and keep doing what worked.

## 6. Automation

### Content board
https://claude.ai/artifact/H77qQZK3NfbsTx1nrrjTWQ (private, only the owner can open it)

Each day has 2 video cards, read top to bottom:
1. **Original video** — TikTok/Instagram link, creator, post date, length, views/likes/comments, why it worked.
2. **Your Pulgo version** — hook, 3–5 steps to make it, second-by-second script.
3. **Caption & hashtags** — with a Copy button.
4. **Done?** — Recorded / TikTok / Reels / Shorts ticks (saved across devices).

Plus 2 Reddit questions with a "top threads this week" link and a draft reply. The header shows
videos posted this week (goal 14).

### Daily brief (Claude Code routine)
- Name: **Pulgo daily content brief** — runs every day at ~6:22 Europe/Warsaw, writes the day's brief
  to the board and sends a push notification in the Claude app.
- Change or pause it at claude.ai/code → Routines, or ask Claude.
- Rules it follows:
  - English only.
  - Originals: direct TikTok/Instagram video links only, posted in the last 3 years, at least 200K views
    (or 20K+ likes when views aren't shown), 30 seconds or shorter. Never repeats a video already on the board.
  - Pulgo versions: max 30 s (aim 15–25 s), pug as main character, app on screen 3–5 s.
  - Never invents stats; never claims Pulgo is free or mentions prices.
- Limits: web search can't search Reddit and rarely shows view counts or video length, so counts may be
  likes-only or stale. For exact numbers and real Reddit threads, use Claude in Chrome on a computer.

### Weekly deeper search (optional, Claude in Chrome)
Run once a week in the Claude in Chrome side panel to find that week's viral videos with exact stats,
real Reddit threads and Instagram Reels the cloud search misses.

## 7. Numbers to track

- Views per video, by hook type
- Sign-ups per source (add `?ref=tiktok`, `?ref=instagram`, `?ref=reddit` to bio links)
- Day 1 and day 7 retention: do students come back?
- Later: CAC per channel, LTV, and CAC < LTV before spending on ads
