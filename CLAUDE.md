# Pulgo — notes for Claude

## Design, colour and layout changes: propose first
When Igor asks to change how something looks (design, colours, icons, layout, "make it look better", "change the style"), don't just implement one version. First show proposals:
- Render 2–3 distinct options as real mockups (HTML rendered to a PNG with the preinstalled Chromium/Playwright), at phone size, in the app's own dark theme and colours. Include the current design for comparison when it helps.
- Label them A / B / C, describe each in a line or two, and say which one you recommend and why.
- Let Igor pick (or mix, e.g. "A with B's colours"), then build the chosen one.
- A small, explicit request ("make this card purple") can be done directly — the proposal step is for open-ended look-and-feel changes.

## App look
Dark background `#08080c`, purple accents `#8b6dff → #6d4dff`, `#a58cff`, `#c9baff`; orange `#f5a524` for deadlines/streak, teal `#2ee6c5` for weekly activities, green `#35d07f` for done. Mascot: the pug in a graduation cap and suit (`src/components/PugMascot.jsx`, `public/pug-*`). UI text is Polish and English (`src/lib/i18n.js`).
