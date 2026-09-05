# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Optional: AI chat assistant (ChatGPT/OpenAI)

The app includes an in-app AI chat (the 💬 button) that can see the student's upcoming exams, study goals, and energy level to give personalized advice. It talks to OpenAI's API through a small local backend, so your API key never reaches the browser.

1. Get an API key at [platform.openai.com](https://platform.openai.com/) (API keys section — you'll need billing/payment set up, it's pay-as-you-go, no subscription required for API usage).
2. Copy `server/.env.example` to `server/.env` and paste your key into `OPENAI_API_KEY=`. Never commit this file (it's already in `.gitignore`).
3. Run `npm run dev:full` instead of `npm run dev` — this starts both the Vite dev server and the chat backend together.
4. If you don't set up a key, the rest of the app works exactly as before; the chat button will just show an error explaining the key is missing.

Note: the chat only works when running the app with its own backend (`npm run dev:full`, or your own hosting of both `server/` and the built frontend). It will not work from a static, backend-less deployment of the built files alone.
