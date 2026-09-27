# Pulgo — App Store readiness

Plan chosen: **option 1**. The Expo app in `mobile/` becomes the iPhone app. It shows the real Pulgo web app (the Vercel site) in a built-in web view, and adds native iPhone features on top. Everything is built and uploaded with Expo EAS, so no Mac is needed.

✅ = done · 🟡 = partly · ❌ = missing

## 1. Apple account and setup (Igor)
| | Item | Notes |
|---|---|---|
| ❌ | Apple Developer Program account ($99/year) | Needed for TestFlight, App Store Connect, push keys and the Screen Time permission. |
| ❌ | App Store Connect app record | Name "Pulgo", primary language, bundle ID (e.g. `pl.pulgo.app`), SKU. |
| ❌ | Expo account + EAS project | `eas init` links `mobile/` to it. It's free for occasional builds. |
| ❌ | Screen Time (Family Controls) permission | Requested from Apple separately after the account exists; approval can take weeks. It's needed only for the blocking feature, not for the first release. |

## 2. The iPhone app itself (`mobile/`)
| | Item | Notes |
|---|---|---|
| 🟡 | Expo project, name, icon, splash | `app.json` has name/icon/splash (icon 1024×1024 ✅). Missing: `ios.bundleIdentifier`, `buildNumber`, `eas.json`. |
| ❌ | Show the real app in a web view | Today `mobile/src` is an early native skeleton: Home + "Coming soon", plus an **outdated copy of the planner logic without the 20 audit fixes**. It should be replaced by a web view of the production site, so both stay identical. |
| ❌ | Login that works inside the app | **Google blocks sign-in inside embedded web views** ("disallowed_useragent"). Google/Apple sign-in must open in the system sign-in sheet (`expo-web-browser` / `expo-auth-session`, or native `expo-apple-authentication`) and hand the session back to the web view. Email + password works as is. |
| ❌ | Notifications | iPhone web views don't support Web Push. Use `expo-notifications`: **local notifications** scheduled on the phone (session reminders, bedtime "unfinished tasks", streak at risk) — which also gets around the once-a-day server cron — plus, optionally, server pushes via Expo push tokens. |
| ❌ | App ↔ website bridge | A small message channel (`postMessage`) so the website can tell the app "schedule this reminder", "session started/finished", "user signed out". |
| ❌ | Offline / error screen | A friendly "no connection, try again" screen instead of a blank web view. |
| ❌ | Native feel details | Safe areas (notch), no bounce/zoom, links to other sites open outside the app, and the back gesture. |
| ❌ | Screen Time blocking during focus sessions (later) | Custom native module plus Apple's permission. Planned for a later version. |

## 3. Apple review rules
| | Item | Notes |
|---|---|---|
| 🟡 | More than "just a website" (guideline 4.2) | Native notifications and reminders, a native sign-in sheet and the offline screen give real app value. Screen Time blocking would strengthen it further. |
| ✅ | Delete account inside the app | Exists in Settings (`deleteAccount`). |
| ✅ | Sign in with Apple offered alongside Google | Exists (must keep working inside the app, see login above). |
| 🟡 | Privacy policy | The text exists in Settings (PL/EN). A **public web page** (e.g. `/privacy` on the Vercel site) is still needed for the App Store listing. |
| ❌ | App Privacy form ("nutrition label") | Collected data: email (account), name, study data, energy log; AI chat content is sent to Anthropic's API. Linked to identity, not used for tracking. |
| ❌ | Age rating questionnaire | The AI chat answers free text, so answer the "unrestricted web access / user-generated content" questions honestly. It's probably 12+. |
| ✅ | Encryption export question | HTTPS only → set `ITSAppUsesNonExemptEncryption = false`. |

## 4. Store listing
| | Item | Notes |
|---|---|---|
| ❌ | Screenshots | Needed for 6.7" and 6.5" iPhones (and iPad, if tablet support stays on — consider `supportsTablet: false`). |
| ❌ | Description, keywords, subtitle | Polish + English. |
| ❌ | Support URL and contact email | A simple page on the Vercel site works. |
| ❌ | App review notes + demo account | Apple needs a login to test with. |

## 5. Before submitting
| | Item | Notes |
|---|---|---|
| ❌ | TestFlight build on your own iPhone | Test sign-in (email, Google, Apple), the focus session, notifications, offline, deleting the account, and Polish/English. |
| 🟡 | Known limits written down | The daily server cron (local notifications solve most of it). The Screen Time permission is pending. |
