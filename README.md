# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Optional: AI chat assistant (Google Gemini)

The app includes an in-app AI chat (the 💬 button) that can see the student's upcoming exams, study goals, and energy level to give personalized advice. It talks to Google's Gemini API through a small local backend, so your API key never reaches the browser.

1. Get a free API key at [aistudio.google.com](https://aistudio.google.com/) (click "Get API key") — no credit card needed for the free tier (rate-limited, but plenty for personal use).
2. Copy `server/.env.example` to `server/.env` and paste your key into `GEMINI_API_KEY=`. Never commit this file (it's already in `.gitignore`) or paste a real key into `.env.example`.
3. Run `npm run dev:full` instead of `npm run dev` — this starts both the Vite dev server and the chat backend together.
4. If you don't set up a key, the rest of the app works exactly as before; the chat button will just show an error explaining the key is missing.

Note: the chat only works when running the app with its own backend (`npm run dev:full`, or your own hosting of both `server/` and the built frontend). It will not work from a static, backend-less deployment of the built files alone.

## Optional: real push notifications

The bell icon's "Enable phone notifications" option sends real OS-level push notifications (streak reminders, upcoming-exam nudges, your custom reminders) on a schedule — even while the app/tab is closed, using the browser's Push API + a small backend (`server/index.js`) that already exists for the AI chat.

1. Generate your own VAPID key pair once: `npx web-push generate-vapid-keys`.
2. In `server/.env`, set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to that pair, and `VAPID_CONTACT` to a `mailto:` address. Optionally set `PUSH_INTERVAL_MINUTES` (default 60) to control how often it checks.
3. Run `npm run dev:full` (same as the AI chat — both share this backend).
4. Open the bell menu in the app and tap "Enable phone notifications"; grant the browser's permission prompt.

Limitations to know about:
- Only works while running with the backend (`npm run dev:full` or your own hosting of `server/` + the built frontend) — not from the static demo build alone.
- On a phone, reliability (especially on iOS) is much better if you add the site to the home screen first.
- Whether a notification actually reaches a sleeping phone still depends on the OS/browser's own battery and background-activity rules — this isn't a guarantee the way a native app's push service is.
