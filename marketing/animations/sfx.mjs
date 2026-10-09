// Synthesised sound effects for the ad animations (no samples, so no licensing questions).
//   node sfx.mjs   -> out/sfx/*.wav: single sounds plus one track per scene, timed to its animation
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SR = 48000;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

const buf = (sec) => new Float32Array(Math.round(sec * SR));

// Band-passed noise sweeping up then down: camera moves and flips
function whoosh(len = 0.45, from = 300, to = 2600, gain = 0.5) {
  const out = buf(len);
  let low = 0, band = 0;
  for (let i = 0; i < out.length; i++) {
    const p = i / out.length;
    const f = from + (to - from) * Math.sin(p * Math.PI);
    const k = 2 * Math.sin((Math.PI * f) / SR);
    const high = rand() - low - 0.6 * band;
    band += k * high;
    low += k * band;
    out[i] = band * gain * Math.pow(Math.sin(p * Math.PI), 1.6);
  }
  return out;
}

// Soft glassy tap
function tap(gain = 0.55) {
  const out = buf(0.09);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * 1900 * t) * 0.6 + Math.sin(2 * Math.PI * 3100 * t) * 0.25 + rand() * 0.15) * Math.exp(-t * 70) * gain;
  }
  return out;
}

// Bubbly pop for cards and rows landing
function pop(pitch = 1, gain = 0.4) {
  const out = buf(0.12);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = (520 + 900 * Math.exp(-t * 40)) * pitch;
    out[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 32) * gain;
  }
  return out;
}

function bell(freq, len, gain) {
  const out = buf(len);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t) + 0.12 * Math.sin(2 * Math.PI * freq * 3.01 * t))
      * Math.exp(-t * 4.5) * Math.min(1, t * 400) * gain;
  }
  return out;
}

const mix = (dst, src, at, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
  return dst;
};

// Two-note chime and a three-note "done" arpeggio (E major-ish, bright but soft)
const chime = () => mix(mix(buf(1.4), bell(1318.5, 1.2, 0.22), 0), bell(1975.5, 1.2, 0.18), 0.09);
const success = () => mix(mix(mix(buf(1.6), bell(987.8, 1.3, 0.2), 0), bell(1244.5, 1.3, 0.2), 0.08), bell(1661.2, 1.4, 0.22), 0.16);

function wav(samples) {
  const n = samples.length, data = Buffer.alloc(44 + n * 4);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 4, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
    data.writeInt16LE(v, 44 + i * 4); data.writeInt16LE(v, 46 + i * 4);
  }
  return data;
}

// Cue times match the scenes' timelines (seconds)
const W = () => whoosh(0.5, 250, 2200, 0.45), F = () => whoosh(0.4, 500, 3800, 0.4);
const tracks = {
  restart: [[W, 0], [tap, 1.35], [F, 1.58], [() => pop(1), 2.15], [() => pop(1.12), 2.35], [() => pop(1.26), 2.55], [chime, 2.9]],
  plan: [[W, 0], [tap, 1.25], [() => whoosh(0.5, 200, 1600, 0.35), 1.42], [() => pop(1), 1.95], [() => pop(1.12), 2.13], [() => pop(1.26), 2.31], [() => pop(1.4), 2.49], [chime, 2.9]],
  session: [[W, 0], [tap, 1.0], [F, 1.18], [() => whoosh(0.9, 900, 5000, 0.18), 1.6], [tap, 2.6], [success, 2.68]],
  exam: [[W, 0], [() => pop(1.3, 0.3), 0.3], [tap, 1.15], [F, 1.28], [() => pop(0.85), 1.75], [() => pop(1), 2.08], [() => pop(1.12), 2.25], [() => pop(1.26), 2.42], [() => pop(1.4), 2.59], [chime, 3.0]],
  streak: [[W, 0], ...[0, 1, 2, 3, 4, 5].map((i) => [() => pop(1 + i * 0.08, 0.25), 0.6 + i * 0.1]), [success, 1.05], [() => pop(1.6, 0.35), 1.2], [chime, 1.55]],
  weekly: [[W, 0], [() => whoosh(0.6, 300, 3000, 0.45), 0.95], [() => pop(0.7, 0.5), 1.45], [() => pop(1.1, 0.3), 1.7], [() => pop(1.25, 0.3), 1.85], [chime, 2.3]],
};

const dir = join(root, 'out', 'sfx');
await mkdir(dir, { recursive: true });
for (const [name, fn] of Object.entries({ whoosh: W, flip: F, tap, pop: () => pop(), chime, success })) {
  await writeFile(join(dir, `${name}.wav`), wav(fn()));
}
for (const [name, cues] of Object.entries(tracks)) {
  const out = buf({ session: 4.2, exam: 4.1 }[name] || 4.0);
  for (const [fn, at] of cues) mix(out, fn(), at);
  await writeFile(join(dir, `pulgo-${name}-sfx.wav`), wav(out));
}
console.log('out/sfx: 6 sounds + 6 scene tracks');
