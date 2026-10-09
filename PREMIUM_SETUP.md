# Pulgo Premium — setup checklist

Premium is built but **switched off**. Until `PREMIUM_ENABLED=true` is set in
Vercel, everyone keeps unlimited AI and no payment screen appears anywhere.
Do the steps below in order; the last one switches it on.

**What's agreed**
- Free: 10 chat messages a day, 1 AI day plan a day, 1 rescue a day, 1 exam prep a week (resets at the student's midnight). When the AI isn't allowed, plans, rescue and exam prep still work the simple way.
- Premium: unlimited AI. $9.99 a month, or $59.99 a year with 7 days free.
- Sold only in the iPhone app (Apple in-app purchase through RevenueCat). Premium works on the website too with the same account.
- The payment screen opens from Settings, from the pug's limit message, at a used-up limit, and at most once a day by itself (after a finished session or day; on opening the app at most every 3 days; never in the first 2 days).

---

## 1. Supabase: two new tables (2 min)
Supabase → **SQL Editor** → New query → paste the whole `supabase/schema.sql` → **Run**.
It's safe to run again; it only adds `ai_usage`, `entitlements` and two functions.

## 2. App Store Connect: get paid (one time)
1. **Business** (top menu) → **Agreements** → **Paid Apps** → accept it, then add your **bank account** and fill in the **tax forms**. Subscriptions can't be sold until this shows *Active*.
2. Join the **App Store Small Business Program** (developer.apple.com/app-store/small-business-program). Apple then keeps 15% instead of 30%.

## 3. App Store Connect: the two subscriptions
Your app → **Monetization → Subscriptions** → **Create** a subscription group called **Pulgo Premium**, then add two subscriptions in it:

| Reference name | Product ID (exactly) | Duration | Price |
|---|---|---|---|
| Premium Monthly | `pulgo_premium_monthly` | 1 month | $9.99 |
| Premium Yearly | `pulgo_premium_yearly` | 1 year | $59.99 |

For **Premium Yearly** → **Subscription Prices → Introductory Offers** → **Free**, **1 week**, all countries.
For each one add a **Localization** (at least English and Polish): display name `Pulgo Premium`, description `Unlimited AI planning and chat`.
**Review screenshot**: a picture of Pulgo's payment screen (ask Claude for one).

Then: **Users and Access → Integrations → In-App Purchase** → **Generate** a key. Download the `.p8` file and note the **Key ID** and **Issuer ID** (RevenueCat needs them).

## 4. RevenueCat (free until $2,500/month)
1. Sign up at **app.revenuecat.com** → create a project **Pulgo**.
2. **Add app → App Store**: bundle ID `com.igoriwaniuk.pulgo`; upload the In-App Purchase key (`.p8`, Key ID, Issuer ID) from step 3.
3. **Products** → import `pulgo_premium_monthly` and `pulgo_premium_yearly`.
4. **Entitlements** → New → identifier **`premium`** (exactly) → attach both products.
5. **Offerings** → the **default** offering → add two packages: **Monthly** → `pulgo_premium_monthly`, **Annual** → `pulgo_premium_yearly`.
6. RevenueCat shows an **Apple Server Notification URL** → paste it in App Store Connect → your app → **App Information → App Store Server Notifications** (Production and Sandbox).
7. **Integrations → Webhooks → Add**:
   - URL: `https://ai-student-planer.vercel.app/api/premium`
   - Authorization header: make up a long random password (e.g. 40 random letters and numbers). You'll paste the same one into Vercel.
8. **Project settings → API keys**:
   - the **public App Store key** (starts with `appl_`) goes into `mobile/app.json` → `expo.extra.revenueCatIosKey`. This one is public, it's meant to be inside the app. You can give it to Claude.
   - the **secret key** (starts with `sk_`) goes **only** into Vercel (step 5). Never paste it in the chat.

## 5. Vercel: the keys (don't paste these anywhere else)
Vercel → project → **Settings → Environment Variables** (Production):
- `SUPABASE_SERVICE_ROLE_KEY` — probably already there (push reminders use it). Supabase → Project Settings → API → `service_role`.
- `REVENUECAT_SECRET_KEY` — the `sk_…` key.
- `REVENUECAT_WEBHOOK_AUTH` — the same password you typed into RevenueCat's webhook Authorization header.
- `PREMIUM_ENABLED` — **wait** (step 8).

## 6. New iPhone build (version 1.1.0)
On your PC in the project folder:
1. `git pull` (if `mobile/app.json` shows a conflict, keep both your `projectId` and the new `revenueCatIosKey`).
2. In `mobile/app.json` set `"version": "1.1.0"` and put the `appl_…` key in `revenueCatIosKey`.
3. `cd mobile`, `npm install`, `eas build -p ios --profile production`, then `eas submit -p ios --latest`.

## 7. Test it with a sandbox account (free, no real money)
App Store Connect → **Users and Access → Sandbox → Testers** → add a test Apple ID.
Install the new build from **TestFlight**, set `PREMIUM_ENABLED=true` in Vercel (Redeploy), open Settings → **Pulgo Premium** → buy with the sandbox account. Settings should show **Premium is active ✓** and the chat has no limit. In sandbox a year lasts about an hour, so you can watch renewals.

## 8. Submit version 1.1 and switch on
1. App Store Connect → new version **1.1** → in the **In-App Purchases and Subscriptions** section add both subscriptions (the first subscriptions must go to review together with an app version).
2. Add to the App Store description: `Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` and the privacy link.
3. Review notes: "Premium (monthly/yearly) is offered in Settings → Pulgo Premium and when a free limit is reached. Sandbox purchases work with any sandbox account."
4. Keep **`PREMIUM_ENABLED=true`** in Vercel (Redeploy) so the reviewer sees Premium. People still on 1.0 will see "Update Pulgo from the App Store to get Premium" if they hit a limit, for the day or two until 1.1 is out.

To switch Premium off again at any time: set `PREMIUM_ENABLED` to `false` and Redeploy. Everyone is unlimited again straight away.
