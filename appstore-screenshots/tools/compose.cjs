// Builds the App Store promo images from the raw app screens (capture.cjs):
// dark glow, a pill label, a two-tone headline, the screen in a tilted
// iPhone and one or two cards popping out of it — plus the wide header.
//   node appstore-screenshots/tools/compose.cjs <rawDir> <outDir>
// Screenshots: 1206×2622 (iPhone 6.3"). Header: 3840×1646 and 5244×2950.
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = playwright;

const RAW = path.resolve(process.argv[2] || path.join(__dirname, '..', 'raw'));
const OUT = path.resolve(process.argv[3] || path.join(__dirname, '..', 'promo-1.1'));
const PUG = path.resolve(__dirname, '..', '..', 'public', 'pug-avatar.webp');
fs.mkdirSync(path.join(OUT, '6.3-inch'), { recursive: true });

const C = { purple: '#a58cff', teal: '#2ee6c5', orange: '#f5a524', green: '#35d07f', ice: '#78c8ff', grey: '#9a9aab' };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// h: headline pieces, [text, accent?]; "\n" forces a line break.
const SLIDES = [
  { file: '01-home', raw: 'home', pill: 'AI STUDY PLANNER', h: [['Your study day,'], ['\n'], ['planned by AI', 1]], sub: 'Tell Pulgo your tests and tasks — get a realistic plan in seconds.',
    cards: [{ top: 560, left: 10, w: 300, icon: '📐', color: C.purple, eyebrow: 'MATH · HIGH PRIORITY', title: 'Vectors: basics and notation', text: '16:00 → 16:45 · 45 min' }] },
  { file: '02-day-plan', raw: 'plan', pill: 'YOUR DAY', h: [['A plan that'], ['\n'], ['fits your life', 1]], sub: 'School, training and breaks stay put — studying fills the gaps.',
    cards: [{ top: 470, right: 10, w: 250, icon: '🏫', color: C.teal, eyebrow: 'LOCKED', title: 'School', text: '08:00 → 15:30' }, { top: 640, right: 10, w: 250, icon: '🏋️', color: C.teal, eyebrow: 'AT A SET TIME', title: 'Gym', text: '18:00 → 19:30' }] },
  { file: '03-chat', raw: 'chat', pill: 'AI CHAT', h: [['Ask your '], ['study pug', 1], ['\n'], ['anything']], sub: 'It knows your exams, your free time and how you like to learn.',
    cards: [{ top: 470, left: 10, w: 320, bubble: 'user', title: 'How should I spread out studying for my next exam?' }, { top: 610, right: 10, w: 320, bubble: 'ai', title: 'Your Genetics test is Saturday — 4 days. <b>Today 19:45</b>: Mendel’s laws (30 min) 🧠' }] },
  { file: '04-ai-planner', raw: 'planner', pill: 'AI PLANNER', h: [['Tomorrow, planned'], ['\n'], ['in one tap', 1]], sub: 'Pick your tasks, check your free time — Pulgo does the rest.',
    cards: [{ top: 600, left: 10, w: 340, icon: '✨', color: C.purple, eyebrow: 'BUILD MY PLAN', title: '3 tasks · 1 hr 55 min', text: 'Planned around school and gym' }] },
  { file: '05-exam', raw: 'exam', pill: 'EXAMS', h: [['Never cram'], ['\n'], ['the night before', 1]], sub: 'Add a test and get a prep plan spread over the days before it.',
    cards: [{ top: 560, right: 10, w: 340, icon: '🧬', color: C.orange, eyebrow: 'BIOLOGY · TEST', title: 'Genetics test', text: '3 topics · prep plan included' }] },
  { file: '06-streak', raw: 'streak', pill: 'STREAKS', h: [['Keep your'], ['\n'], ['streak alive', 1]], sub: 'Study a little every day. With Premium, a freeze saves a missed day.',
    cards: [{ top: 640, left: 10, w: 300, icon: '🧊', color: C.ice, eyebrow: 'STREAK FREEZE · PREMIUM', title: 'A freeze saved your streak', text: '2 of 3 freezes left' }] },
  { file: '07-add-task', raw: 'addtask', pill: 'ADD TASKS', h: [['Add a task'], ['\n'], ['in two taps', 1]], sub: 'Pick what it is and the subject — Pulgo names it and sets the time.',
    cards: [{ top: 620, right: 10, w: 330, icon: '📝', color: C.purple, eyebrow: 'HOMEWORK · BIOLOGY', title: 'Biology Homework', text: 'Tomorrow · 30 min' }] },
  { file: '08-restart', raw: 'restart', pill: 'RESTART', h: [['Day went wrong?'], ['\n'], ['Restart it', 1]], sub: 'Tell Pulgo what changed — it rebuilds the rest of your day.',
    cards: [{ top: 600, left: 10, w: 340, icon: '🔁', color: C.purple, eyebrow: 'NEW PLAN', title: 'Everything still fits', text: 'Gym and sleep stay locked 🔒' }] },
  { file: '09-focus', raw: 'focus', pill: 'FOCUS', h: [['One task. '], ['Full focus.', 1]], sub: 'A calm timer that keeps counting, even if you leave the app.',
    cards: [{ top: 650, right: 10, w: 270, icon: '⏱️', color: C.purple, eyebrow: 'FOCUS MODE', title: '31:31 left', text: 'Vectors: basics and notation' }] },
  { file: '10-day-summary', raw: 'summary', pill: 'END OF DAY', h: [['See what you'], ['\n'], ['really did', 1]], sub: 'Log your real study time — tomorrow’s plan gets smarter.',
    cards: [{ top: 620, left: 10, w: 340, icon: '✅', color: C.green, eyebrow: 'TODAY', title: '3 of 3 done', text: '2 hr studied 🎉' }] },
];

const FONT = "'Inter Display','Inter',-apple-system,sans-serif";

function phone(img, { w = 318, tilt = 'perspective(1700px) rotateY(9deg) rotateX(3deg) rotateZ(-3.5deg)' } = {}) {
  const sw = w - 22;
  return `<div style="width:${w}px;height:${Math.round(sw * 2.168) + 22}px;border-radius:52px;padding:11px;box-sizing:border-box;background:linear-gradient(160deg,#2c2938,#16141d);box-shadow:0 0 0 1.5px #3a3648,0 40px 80px rgba(0,0,0,.6),0 0 120px rgba(109,77,255,.35);transform:${tilt};transform-origin:50% 30%">
    <div style="position:relative;width:100%;height:100%;border-radius:42px;overflow:hidden;background:#08080c">
      <img src="file://${img}" style="width:100%;display:block">
      <div style="position:absolute;top:13px;left:50%;transform:translateX(-50%);width:${Math.round(sw * 0.33)}px;height:30px;border-radius:20px;background:#000"></div>
      <div style="position:absolute;top:17px;left:30px;font:700 15px ${FONT};color:#fff">9:41</div>
      <div style="position:absolute;top:19px;right:26px;display:flex;gap:5px;align-items:center">
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="#fff"/><rect x="4.5" y="5" width="3" height="6" rx="1" fill="#fff"/><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="#fff"/><rect x="13.5" y="0" width="3" height="11" rx="1" fill="#fff"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5"/><rect x="2" y="2" width="18" height="8" rx="2" fill="#fff"/><rect x="22.5" y="4" width="2" height="4" rx="1" fill="#fff" fill-opacity=".5"/></svg>
      </div>
    </div>
  </div>`;
}

function card(c) {
  const pos = `top:${c.top}px;${c.left != null ? `left:${c.left}px` : `right:${c.right}px`};width:${c.w}px`;
  if (c.bubble === 'user') {
    return `<div style="position:absolute;${pos};padding:16px 18px;border-radius:24px 24px 6px 24px;background:linear-gradient(160deg,#8b6dff,#6d4dff);box-shadow:0 20px 44px rgba(0,0,0,.5);font:600 17px/1.32 ${FONT};color:#fff;letter-spacing:-.01em">${c.title}</div>`;
  }
  if (c.bubble === 'ai') {
    return `<div style="position:absolute;${pos};padding:16px 18px;border-radius:24px 24px 24px 6px;background:#16141e;border:1.5px solid rgba(255,255,255,.14);box-shadow:0 20px 44px rgba(0,0,0,.55);font:500 16.5px/1.38 ${FONT};color:#ece9f6;letter-spacing:-.01em">${c.title.replace('<b>', `<b style="color:${C.purple};font-weight:700">`)}</div>`;
  }
  return `<div style="position:absolute;${pos};display:flex;align-items:center;gap:14px;padding:16px;border-radius:24px;background:#15131d;border:1.5px solid ${rgba(c.color, 0.55)};box-shadow:0 22px 46px rgba(0,0,0,.55)">
    <div style="width:52px;height:52px;flex:none;border-radius:16px;background:${rgba(c.color, 0.14)};display:flex;align-items:center;justify-content:center;font-size:27px">${c.icon}</div>
    <div style="min-width:0">
      <div style="font:800 11px ${FONT};letter-spacing:.11em;color:${c.color}">${c.eyebrow}</div>
      <div style="font:700 18px/1.2 ${FONT};color:#fff;margin-top:5px;letter-spacing:-.01em">${c.title}</div>
      <div style="font:500 14px ${FONT};color:#b9b9c6;margin-top:4px">${c.text}</div>
    </div>
  </div>`;
}

function headline(parts, size) {
  return parts.map(([t, accent]) => (t === '\n' ? '<br>' : accent
    ? `<span style="background:linear-gradient(90deg,#c9baff,#8b6dff);-webkit-background-clip:text;background-clip:text;color:transparent">${t}</span>`
    : t)).join('').replace(/^/, `<div style="font:800 ${size}px/1.04 ${FONT};letter-spacing:-.045em;color:#fff">`) + '</div>';
}

const pill = (text, size = 12.5) => `<span style="display:inline-block;padding:7px 18px;border-radius:99px;border:1.5px solid rgba(139,109,255,.55);background:rgba(124,92,255,.14);font:800 ${size}px ${FONT};letter-spacing:.16em;color:#c9baff">${text}</span>`;

function slideHtml(s) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:402px;height:874px;overflow:hidden;background:#08080c;position:relative}</style></head><body>
  <div style="position:absolute;width:360px;height:360px;border-radius:50%;left:-200px;top:-180px;background:#7f5cff;filter:blur(100px);opacity:.32"></div>
  <div style="position:absolute;width:420px;height:520px;border-radius:50%;left:-10px;top:380px;background:#5b3df0;filter:blur(120px);opacity:.36"></div>
  <div style="position:absolute;top:41px;left:0;right:0;text-align:center">${pill(s.pill)}</div>
  <div style="position:absolute;top:74px;left:16px;right:16px;text-align:center">${headline(s.h, 40)}
    <div style="font:500 15px/1.42 ${FONT};color:#b9b9c6;margin:12px auto 0;max-width:330px;letter-spacing:-.005em">${s.sub}</div></div>
  <div style="position:absolute;top:252px;left:42px">${phone(path.join(RAW, s.raw + '.png'))}</div>
  ${s.cards.map(card).join('')}
  </body></html>`;
}

// The wide header: headline on the left, three tilted phones on the right.
function headerHtml(W, H) {
  const k = H / 548.67; // designed for 1280×548.67 (3840×1646 at 3×)
  const tilt = (z) => `perspective(1700px) rotateY(-10deg) rotateZ(${z}deg)`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;background:#08080c;position:relative}</style></head><body>
  <div style="position:absolute;width:${900 * k}px;height:${900 * k}px;border-radius:50%;left:${-300 * k}px;top:${-450 * k}px;background:#7f5cff;filter:blur(${150 * k}px);opacity:.4"></div>
  <div style="position:absolute;width:${900 * k}px;height:${700 * k}px;border-radius:50%;right:${-100 * k}px;top:${50 * k}px;background:#5b3df0;filter:blur(${160 * k}px);opacity:.45"></div>
  <div style="position:absolute;left:${(W - 1280 * k) / 2 + 90 * k}px;top:50%;transform:translateY(-50%);width:${560 * k}px">
    <div style="display:flex;align-items:center;gap:${14 * k}px;margin-bottom:${22 * k}px"><img src="file://${PUG}" style="width:${64 * k}px;height:${64 * k}px;border-radius:50%;box-shadow:0 0 0 ${3 * k}px #8b6dff,0 0 ${30 * k}px rgba(139,109,255,.6)"><span style="font:800 ${34 * k}px ${FONT};color:#fff;letter-spacing:-.03em">Pulgo</span></div>
    ${pill('AI STUDY PLANNER', 13 * k)}
    <div style="margin-top:${20 * k}px">${headline([['Your study day,'], ['\n'], ['planned by AI', 1]], 66 * k)}</div>
    <div style="font:500 ${21 * k}px/1.45 ${FONT};color:#b9b9c6;margin-top:${18 * k}px;max-width:${500 * k}px">Plans, exam prep and an AI study buddy — in one calm app.</div>
  </div>
  <div style="position:absolute;left:${W / 2 + 70 * k}px;top:50%;width:0;height:0">
    <div style="position:absolute;left:${-30 * k}px;top:${-210 * k}px;transform:scale(${0.62 * k})translate(-50%,0);transform-origin:0 0">${phone(path.join(RAW, 'plan.png'), { tilt: tilt(-4) })}</div>
    <div style="position:absolute;left:${200 * k}px;top:${-250 * k}px;transform:scale(${0.7 * k})translate(-50%,0);transform-origin:0 0;z-index:2">${phone(path.join(RAW, 'home.png'), { tilt: tilt(-3) })}</div>
    <div style="position:absolute;left:${430 * k}px;top:${-200 * k}px;transform:scale(${0.62 * k})translate(-50%,0);transform-origin:0 0">${phone(path.join(RAW, 'chat.png'), { tilt: tilt(-2) })}</div>
  </div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
  const tmp = path.join(OUT, '.tmp.html');
  for (const s of SLIDES) {
    fs.writeFileSync(tmp, slideHtml(s));
    await page.goto('file://' + tmp); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, '6.3-inch', s.file + '.png') });
    console.log('✓', s.file);
  }
  for (const [W, H, name] of [[3840, 1646, 'header-3840x1646'], [5244, 2950, 'header-5244x2950']]) {
    const hp = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    fs.writeFileSync(tmp, headerHtml(W, H));
    await hp.goto('file://' + tmp); await hp.waitForTimeout(300);
    await hp.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: 0, y: 0, width: W, height: H } });
    await hp.close();
    console.log('✓', name);
  }
  fs.unlinkSync(tmp);
  await browser.close();
})();
