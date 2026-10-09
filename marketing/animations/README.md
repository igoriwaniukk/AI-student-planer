# Pulgo ad animations

Short (~4 s) "app moment" inserts for TikTok / Reels / Shorts. Each one shows a real Pulgo card floating in 3D on a deep purple field, with a camera push-in, a tap, and the result. There's no caption text: only the app's own English UI words (from `src/lib/i18n.js`). Times are 12-hour for US viewers.

| Scene | What happens | Length |
|---|---|---|
| `restart` | "Your day slipped a bit" → tap **Restart my day** → card flips to "Today's new plan" (Moved / Stays) | 4.0 s |
| `plan` | "No sessions planned for today" → tap **Plan day** → "Thursday's plan" timeline fills | 4.0 s |
| `session` | NEXT SESSION → **Start session** → focus timer runs → **Finish session** → green ✓ | 4.2 s |
| `exam` | Pug "What are we adding? 🐾" → **Exam or deadline** → prep sessions pop in Mon–Thu before Friday's test | 4.1 s |
| `streak` | 🔥 bump, 6 → 7, "7-day streak!", milestone, 7 days lit, pug hop | 4.0 s |
| `weekly` | Teal "Soccer training" block lands in the day, study blocks move later | 4.0 s |

Every clip ends on a ~0.6 s still hold, so there's a clean cut point.

## Render

You need [ffmpeg](https://ffmpeg.org) on PATH (or `FFMPEG=path/to/ffmpeg`).

```bash
cd marketing/animations
npm install
npx playwright install chromium
node render.mjs              # all scenes -> out/pulgo-<scene>.mp4 (1080x1920, 60 fps, H.264)
node render.mjs restart      # one scene
node render.mjs plan --sheet # 12-frame contact sheet, for quick checks
node sfx.mjs                 # out/sfx/: whoosh, flip, tap, pop, chime, success + pulgo-<scene>-sfx.wav timed to each clip
```

To preview a scene live in a browser, serve this folder and open `scenes/<name>.html`. The ES modules need http, so `file://` won't work: for example, run `npx serve` and open `http://localhost:3000/scenes/restart.html`.

`out/` is git-ignored: videos aren't committed.

## Editing

- `kit/kit.css` holds the shared look: background, cards and buttons. The values are copied from the app's components.
- `kit/kit.js` holds easing, the camera with emoji parallax, the tap ripple, and `scene(duration, draw)`. Every scene is a pure function of time `t`, so renders are frame-exact.
- To change texts or times, edit the HTML in `scenes/`. To change a cue time, keep `sfx.mjs` in sync.
