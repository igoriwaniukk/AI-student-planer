# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Optional: connecting a Vulcan (UONET+) e-register account

The Profile screen has an experimental "Połącz z dziennikiem (Vulcan / UONET+)" card that can pull real exams and lessons from a Vulcan/UONET+ account using the unofficial [`vulcan-api-js`](https://www.npmjs.com/package/vulcan-api-js) SDK.

This needs the small backend under `server/` to be running alongside Vite, so use:

```
npm run dev:full
```

instead of `npm run dev`. Running `npm run dev` alone will show the connect form, but submitting it will fail (no backend to talk to).

To pair an account: in the UONET+ web panel, open the student's account menu → "Zarejestruj urządzenie mobilne" — it shows a QR code plus a token, symbol, and PIN valid for a few minutes. Enter the token, symbol, and PIN into the Profile card (no password is ever entered into this app).

Notes:
- This is an **unofficial, reverse-engineered API**, not something Vulcan publishes or supports. It can break if Vulcan changes their backend.
- The resulting device credentials are kept **in memory only**, on the local `server/` process — nothing is written to disk, and restarting the server invalidates the session (pair again).
- This only works when running locally with `npm run dev:full`; the production `npm run build` output is a static site with nowhere to run `server/`, so this feature has no effect there.
