# Pulgo — marketing plan

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

**Who we sell to:** students (PL + EN): high school, matura, university, exam sessions.

**The transformation, not the features.** Not "AI planner with streaks and reminders", but:
- "I stopped cramming the night before."
- "Passed the session without an all-nighter."
- "The pug tells me what to study today, so I don't have to think about it."
- PL: "Sesja bez zarywania nocy", "Koniec z nauką na ostatnią chwilę".

**The pug is the viral asset.** A pug in a graduation cap and suit that nags you to study is
shareable on its own. Make it the face of every video.

**About the subreddit list:** most of those subs are full of founders, not students.
Use them for feedback and beta testers (r/SideProject, r/RoastMyStartup, r/AlphaandBetausers,
r/MadeThis, r/InternetIsBeautiful, r/productivity). For **users**, go where students are:
r/GetStudying, r/studytips, r/college, r/Studying, r/productivity, plus Polish student
communities (check what's active: Polish subs, Facebook groups of your own university,
Discord servers). Read each sub's rules about self-promotion before posting.

**Main channels for students:** TikTok, Instagram Reels and YouTube Shorts (#studytok, #studywithme),
then Reddit, then university Facebook/Discord groups.

**Paid ads only once the math works.** CAC < LTV needs a known LTV, so first you need
revenue (premium plan) or at least known retention. Until then, spend on creators, not ads.

## 3. Timeline

| Phase | When | Goal |
|---|---|---|
| 0. Setup | Week 1 | Message, accounts, tracking, content bank |
| 1. Organic + Reddit | Weeks 2–6 | Post daily, find 2–3 hooks that work, first 500 users |
| 2. Creators | Weeks 6–12 | 3–10 student creators on results-based pay (Posted), 1,000–3,000 users |
| 3. Paid ads | When CAC < LTV is proven | Scale the winning videos as ads, up to 10,000 users |

**Seasonal timing:** push hardest before exam sessions (January/February and June) and at the start of
the semester (October, February). It's October now, so start-of-semester content is right on time,
with the winter session coming next.

## 4. Week 1: setup (once)

- **Day 1:** Write the message. 5 transformation one-liners (PL + EN), 1 per pain:
  cramming, procrastination, forgetting deadlines, chaos before the session, no motivation.
- **Day 2:** Create accounts: TikTok, Instagram, YouTube Shorts (handle: pulgo / pulgo.app),
  plus a Reddit account. Start commenting helpfully on Reddit now, since new accounts get filtered.
- **Day 3:** Tracking. Add `?ref=tiktok`, `?ref=reddit`, `?ref=creator-<name>` links and count
  sign-ups per source (Claude can build this in the app).
- **Day 4:** Market research. Save the 20 most-viewed study videos of the last month. Write down
  each hook (first 2 seconds), format and length.
- **Day 5:** Build a content bank of 30 video ideas (Claude drafts, you pick).
- **Day 6:** Record 5 videos in one batch (screen recording of the app + pug + text on screen).
- **Day 7:** Sign up on postedapp.com, look at how campaigns and pricing work, write the creator brief.

## 5. Every day (60–90 min)

| Time | What | Done by |
|---|---|---|
| 10 min | Read today's content brief (hooks, trend, Reddit ideas) | Claude routine, every morning |
| 30 min | Record and post 1 short video to TikTok, Reels and Shorts (same video, 3 places) | You |
| 20 min | Reddit: answer 3–5 student questions helpfully. Mention Pulgo only where it really answers the question (about 1 in 5 comments) | You, drafts from Claude |
| 10 min | Reply to every comment and DM on your posts | You |
| 5 min | Log the numbers: views, sign-ups per source | You, or automatic later |

**Weekly rhythm:**
- **Mon:** Weekly review. What got the most views and sign-ups? Do more of that. (Claude routine)
- **Tue–Thu:** Normal daily routine.
- **Fri:** Batch-record next week's videos (5–7 in one go).
- **Sat:** One bigger Reddit post: a value post such as "How I plan exam session in 15 min/day"
  or a "build in public" post in r/SideProject. The app is mentioned at the end.
- **Sun:** Rest, or research trends for next week.

**From phase 2 (creators):** +15 min/day to brief creators, review their videos and pay per results.

## 6. Claude automations

**What Claude cannot do:** post to TikTok, Instagram or Reddit for you. Auto-posting on Reddit also
gets accounts banned. Claude drafts, researches and tracks; you post.

| Automation | How | When |
|---|---|---|
| **Morning content brief**: 3 hooks for today's video (PL + EN), the script, a caption with hashtags, and 3 Reddit reply ideas | Routine (scheduled Claude session) | Every day, 7:45 |
| **Weekly review**: you paste or log the numbers, Claude says what worked, what to cut, and next week's 7 video ideas | Routine | Monday, 8:45 |
| **Marketing tracker page**: daily checklist, numbers per channel, progress to 10,000 users | Artifact page with its own database (Claude can add rows) | Build once |
| **Referral tracking in the app**: `?ref=` links saved on sign-up, plus a count per source | Code change in this repo | Build once |
| **Creator brief + outreach messages** for Posted / student creators | Ask in chat | Phase 2 |
| **Ad math**: CAC, LTV and break-even from your numbers | Ask in chat | Phase 3 |
| **Trend research** in your own browser (Claude in Chrome / desktop app) | Ask in chat | Weekly |

Routines are set up in Claude Code (claude.ai/code → Routines), or Claude can create them for you
from a session.

### Prompt for the morning routine

> You are the marketing assistant for Pulgo, a study planner for students (Polish + English) with a pug
> mascot in a graduation cap. Read MARKETING_PLAN.md. Today is {date}. Give me:
> 1. 3 video hooks for TikTok/Reels (first 2 seconds, sell the transformation, not features), in PL and EN.
> 2. A 20–30 s script for the best hook, with what to show on screen.
> 3. A caption + 5 hashtags.
> 4. 3 typical student questions from Reddit (r/GetStudying, r/studytips, r/college) and a short,
>    helpful answer to each. Mention Pulgo in at most one, naturally.
>
> Keep in mind the season (exam session coming? semester start?).

### Prompt for the weekly review

> Weekly marketing review for Pulgo. Read MARKETING_PLAN.md. Here are last week's numbers: {paste}.
> Tell me: the top 2 videos and why they worked, what to stop doing, sign-ups per channel,
> and 7 video ideas for next week based on what worked. Are we on track for the phase goal?

## 7. Numbers to track

- Views per video, by hook type
- Sign-ups per source (`ref`)
- Day 1 and day 7 retention: do students come back?
- Later: CAC per channel, LTV, and CAC < LTV before spending on ads
