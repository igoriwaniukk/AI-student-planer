// Renders scenes/*.html to 1080x1920 60 fps MP4s in out/.
//   node render.mjs                 all scenes
//   node render.mjs restart plan    only these
//   node render.mjs restart --sheet  a contact sheet of frames instead of a video (quick check)
// Needs ffmpeg on PATH (or FFMPEG=path) and Playwright's Chromium (npx playwright install chromium).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const FPS = 60, HOLD = 0.6;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const args = process.argv.slice(2);
const sheet = args.includes('--sheet');
let names = args.filter((a) => !a.startsWith('--'));
if (!names.length) names = (await readdir(join(root, 'scenes'))).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));

// file:// blocks ES modules, so serve the folder locally
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    res.writeHead(200, { 'Content-Type': types[extname(req.url.split('?')[0])] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const port = server.address().port;

await mkdir(join(root, 'out'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });

for (const name of names) {
  await page.goto(`http://localhost:${port}/scenes/${name}.html`);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);

  if (sheet) {
    const shots = [];
    for (let i = 0; i < 12; i++) {
      await page.evaluate((t) => window.seek(t), (i / 11) * duration);
      shots.push(await page.screenshot({ type: 'png' }));
    }
    const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-i', '-', '-vf', 'scale=360:-1,tile=6x2', '-frames:v', '1', join(root, 'out', `${name}-sheet.jpg`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (const s of shots) ff.stdin.write(s);
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log(`out/${name}-sheet.jpg`);
    continue;
  }

  const out = join(root, 'out', `pulgo-${name}.mp4`);
  const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round((duration + HOLD) * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.seek(t), Math.min(i / FPS, duration));
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`out/pulgo-${name}.mp4  (${frames} frames)`);
}

await browser.close();
server.close();
