// Pulgo ad animations: shared timing, camera and parallax helpers.
// Every scene draws purely from time t (seconds), so render.mjs can step it frame by frame.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
// Progress of t through [a, b], clamped to 0..1
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
export const easeIn = (p) => p * p * p;
// Damped spring 0 -> 1 with a small overshoot
export const spring = (p, bounce = 1) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(p * Math.PI * (2.2 + bounce)));

export const $ = (s) => document.querySelector(s);

// Subject emojis drifting at different depths. depth < 1 sits behind the card, > 1 in front.
export function makeFloats(items) {
  return items.map(([emoji, x, y, size, rot, depth]) => {
    const layer = $(depth > 1 ? '.floats.front' : '.floats.back');
    const d = document.createElement('div');
    d.className = 'float emo';
    d.textContent = emoji;
    const blur = depth < 1 ? (1 - depth) * 6 : (depth - 1) * 3;
    d.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px;filter:blur(${blur.toFixed(1)}px) drop-shadow(0 ${size / 5}px ${size / 4}px rgba(0,0,0,.5));opacity:${depth < 1 ? 0.55 + depth * 0.4 : 1}`;
    layer.appendChild(d);
    return { el: d, rot, depth, phase: x * 0.013 + y * 0.007 };
  });
}

// Camera: zoom z and pan (px, py) in screen px. Floats move with parallax by their depth.
export function camera(t, z, px, py, floats) {
  $('.world').style.transform = `translate(${px}px,${py}px) scale(${z})`;
  for (const f of floats) {
    const k = f.depth;
    const dx = Math.sin(t * 0.9 + f.phase) * 6 * k;
    const dy = Math.cos(t * 0.7 + f.phase) * 8 * k - t * 5 * k;
    const s = 1 + (z - 1) * k;
    f.el.style.transform = `translate(${px * k + dx}px,${py * k + dy}px) scale(${s}) rotate(${f.rot + Math.sin(t * 0.6 + f.phase) * 6}deg)`;
  }
}

// Tap indicator: finger fades in at tIn, presses at tTap, ripple grows after.
export function tap(el, t, tIn, tTap) {
  const finger = el.querySelector('.finger');
  const ripple = el.querySelector('.ripple');
  const pin = easeOut(seg(t, tIn, tIn + 0.25));
  const out = seg(t, tTap + 0.25, tTap + 0.5);
  const press = seg(t, tTap - 0.08, tTap) - seg(t, tTap, tTap + 0.15);
  finger.style.opacity = pin * (1 - out);
  finger.style.transform = `translate(${(1 - pin) * 18}px,${(1 - pin) * 22}px) scale(${1 - press * 0.22})`;
  const r = seg(t, tTap, tTap + 0.55);
  ripple.style.opacity = r > 0 ? 1 - r : 0;
  ripple.style.transform = `scale(${0.3 + easeOut(r) * 1.6})`;
  return press; // 0..1, for pressing the button itself
}

// Register the scene. render.mjs calls window.seek(t); opening the page plays it live in a loop.
export function scene(duration, draw) {
  window.DURATION = duration;
  window.seek = (t) => draw(t);
  window.ready = document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 300)));
  if (!navigator.webdriver) {
    const t0 = performance.now();
    const loop = () => { draw(((performance.now() - t0) / 1000) % (duration + 0.6)); requestAnimationFrame(loop); };
    window.ready.then(loop);
  } else draw(0);
}
