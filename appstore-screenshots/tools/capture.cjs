// Takes the raw app screens for the App Store promo images (see compose.cjs).
// Run against a local build:  npm run build && npx vite preview --port 4363
// then:  node appstore-screenshots/tools/capture.cjs <outDir>
// Each screen is 393×852 at 3× (1179×2556) with an iPhone's safe areas, the
// app filled with a believable student's week (Alex, Tuesday afternoon).
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = playwright;

const URL = process.env.PULGO_URL || 'http://localhost:4363';
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'raw'));
fs.mkdirSync(OUT, { recursive: true });

const TODAY = 19; // logical day number anchored to 2026-11-10 (a Tuesday)
const DATE = '2026-11-10';

function seed({ allDone = false, premium = false } = {}) {
  const task = (id, subject, kind, title, dur, priority, day) => ({ id, category: 'school', kind, subject, title, dur, priority, day, color: '#a58cff', short: title });
  const taskDefs = [
    task('t1', 'Matematyka', 'revision', 'Vectors: basics and notation', 45, 'Wysoki priorytet', TODAY),
    task('t2', 'Angielski', 'essay', 'Essay: my summer', 40, 'Normalny priorytet', TODAY),
    task('t3', 'Biologia', 'revision', "Mendel's laws", 30, 'Normalny priorytet', TODAY),
    task('n1', 'Chemia', 'project', 'Lab report: acids', 45, 'Wysoki priorytet', TODAY + 1),
    task('n2', 'Historia', 'reading', 'Read chapter 5', 30, 'Normalny priorytet', TODAY + 1),
    task('n3', 'Matematyka', 'revision', 'Practice test: vectors', 40, 'Normalny priorytet', TODAY + 1),
    { id: 'p1', category: 'personal', title: 'Buy a birthday gift for Mia', day: TODAY, color: '#a58cff', short: 'Buy a birthday gift for Mia' },
  ];
  const taskState = allDone
    ? { t1: { status: 'completed', actual: 50, day: TODAY }, t2: { status: 'completed', actual: 40, day: TODAY }, t3: { status: 'completed', actual: 30, day: TODAY } }
    : {};
  const sessionReview = allDone ? { t1: { minutes: 50, hard: 'W sam raz', know: 'Dobrze umiem' }, t2: { minutes: 40 }, t3: { minutes: 30 } } : {};
  const history = {};
  const key = (back) => { const d = new Date(DATE + 'T12:00:00'); d.setDate(d.getDate() - back); return d.toISOString().slice(0, 10); };
  for (let back = 1; back <= 6; back++) history[key(back)] = premium && back === 3 ? { frozen: true } : { completed: true };
  return {
    sp_name: 'Alex',
    sp_language: 'en',
    sp_activities: { selected: ['Szkoła / liceum', 'Trening / sport'], note: '' },
    sp_dayAnchor: { num: TODAY, dateISO: DATE },
    sp_profileDefaults: { energy: 'Normalna', studyTime: 'Popołudniu', bedtime: '22:30', wake: '07:00', pref: 'Wolny wieczór' },
    sp_recurringActivities: [
      ...['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'].map((day, i) => ({ id: 'sch' + i, name: 'School', day, start: '08:00', dur: 450 })),
      { id: 'gym', name: 'Gym', day: 'Wtorek', start: '18:00', dur: 90 },
    ],
    sp_studyHistory: history,
    sp_lastSeenStreak: 0,
    sp_streakRewards: { freezes: 2, progress: 2, badges: [] },
    sp_paywallOnboardingShown: true,
    sp_chatMessages: [
      { role: 'user', content: 'How should I spread out studying for my next exam?' },
      { role: 'assistant', content: "Your Genetics test is on Saturday, so you have 4 days. Here's an easy split:\n\n• Today 19:45 – Mendel's laws (30 min)\n• Wednesday – practice problems (45 min)\n• Thursday – quick review of DNA and genes (30 min)\n• Friday – one mock test, then rest 🧠\n\nI kept Tuesday's gym free. Want me to add these to your plan?" },
    ],
    sp_plannerData: {
      screen: 'home', taskDefs, tasks: {}, taskState, sessionReview,
      plans: { [TODAY]: { t1: { start: 960, dur: 45 }, t2: { start: 1015, dur: 40 }, t3: { start: 1185, dur: 30 } } },
      customExams: [{ id: 'e1', v: 2, kind: 'Sprawdzian', subject: 'Biologia', title: 'Genetics test', day: TODAY + 4, time: '09:00', topics: ["Mendel's laws", 'DNA and genes'] }],
    },
  };
}

async function shoot(browser, name, { time = '15:40', premium = false, allDone = false, paywall = false, act }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, timezoneId: 'Europe/Warsaw', locale: 'en-US' });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(`${DATE}T${time}:00+01:00`) });
  const data = seed({ allDone, premium });
  await page.addInitScript((d) => {
    if (!sessionStorage.getItem('seeded')) {
      Object.entries(d).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
      localStorage.setItem('sp_pugHelloOffDate', '2026-11-10'); // plain string, not JSON
      sessionStorage.setItem('seeded', '1');
    }
    // An iPhone's safe areas (status bar / home bar), as inside the app.
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = ':root{--safe-top:47px !important;--safe-bottom:34px !important}';
      document.head.appendChild(s);
    });
  }, data);
  // The purchase screen as it looks inside the iPhone app (buy button,
  // Restore), not the website's "Get the iPhone app".
  if (paywall) await page.addInitScript(() => { window.ReactNativeWebView = { postMessage() {} }; window.PulgoNative = { version: '1.1.0' }; });
  await page.route('**/api/premium', (r) => r.fulfill({ json: { enabled: premium || paywall, premium, expiresAt: premium ? '2027-11-10T10:00:00Z' : null, createdAt: '2026-11-01T00:00:00Z' } }));
  await page.route('**/api/plan**', (r) => r.fulfill({ status: 503, json: {} }));
  await page.route('**/api/rescue**', (r) => r.fulfill({ status: 503, json: {} }));
  await page.route('**/api/push**', (r) => r.fulfill({ json: {} }));
  await page.goto(URL);
  await page.waitForTimeout(1800);
  const fab = page.locator('.fab-btn:not([aria-label])');
  const scrollMain = (y) => page.evaluate((top) => { const el = document.querySelector('.app-shell > .sc'); if (el) el.scrollTop = top; }, y);
  if (act) await act(page, { fab, scrollMain });
  await page.mouse.move(2, 2);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  await ctx.close();
  console.log('✓', name);
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const scenes = {
    'home': {},
    // The purchase screen, for each subscription's App Review screenshot.
    'paywall': { paywall: true },
    'plan': { act: async (p) => { await p.getByText('See full plan').click(); await p.waitForTimeout(800); } },
    'chat': { act: async (p) => { await p.locator('.fab-btn[aria-label="AI Pulgo"]').click(); await p.waitForTimeout(1200); } },
    'planner': { act: async (p, { scrollMain }) => { await scrollMain(99999); await p.getByText('Plan tomorrow', { exact: true }).click(); await p.waitForTimeout(800); } },
    'exam': {
      act: async (p, { fab }) => {
        await fab.click(); await p.waitForTimeout(600);
        await p.getByText('Exam or deadline').first().click(); await p.waitForTimeout(700);
        await p.getByText('Biology', { exact: true }).first().click();
        await p.getByPlaceholder('Enter a name').fill('Genetics test');
        const add = p.getByText('+ Add topic');
        for (const topic of ["Mendel's laws", 'DNA and genes', 'Punnett squares']) {
          await add.click(); await p.waitForTimeout(150);
          await p.getByPlaceholder('e.g. Quadratic functions').last().fill(topic);
        }
        await p.evaluate(() => document.activeElement && document.activeElement.blur());
        await p.evaluate(() => { const el = document.querySelector('.app-shell > .sc'); if (el) el.scrollTop = 260; });
      },
    },
    'streak': { premium: true, act: async (p, { scrollMain }) => { await scrollMain(0); } },
    'addtask': {
      act: async (p, { fab }) => {
        await fab.click(); await p.waitForTimeout(600);
        await p.getByText('Task', { exact: true }).first().click(); await p.waitForTimeout(700);
        await p.getByText('Homework', { exact: true }).first().click();
        await p.getByText('Biology', { exact: true }).first().click();
        await p.getByText('When', { exact: true }).click(); await p.waitForTimeout(200);
        await p.getByText('Tomorrow', { exact: true }).last().click();
      },
    },
    'restart': {
      time: '17:20',
      act: async (p) => {
        const btn = p.getByText(/Yes, restart my day|Restart your day/).first();
        await btn.click(); await p.waitForTimeout(800);
        await p.getByText('I have less energy', { exact: true }).click();
      },
    },
    'focus': { time: '16:00', act: async (p) => { await p.getByText('Start session', { exact: true }).first().click(); await p.waitForTimeout(1500); await p.clock.runFor(13 * 60 * 1000 + 25000); await p.waitForTimeout(800); } },
    'summary': {
      time: '21:30', allDone: true,
      act: async (p) => {
        // At this hour the day summary opens by itself (see App.jsx).
        if (!(await p.getByText('Day summary', { exact: true }).count())) {
          await p.getByText(/See summary|Summarize day|Summarize anyway/).first().click(); await p.waitForTimeout(800);
        }
        await p.getByText('Vectors: basics and notation').first().click(); await p.waitForTimeout(300);
      },
    },
  };
  for (const [name, opts] of Object.entries(scenes)) {
    if (only && !only.includes(name)) continue;
    try { await shoot(browser, name, opts); } catch (e) { console.log('✗', name, e.message.split('\n')[0]); }
  }
  await browser.close();
})();
