// Pug World's dogs as cute 2D "sticker" drawings (SVG made in code): a big
// head, a small sitting body, a dark outline and a white sticker border.
// One drawing per breed shape, coloured per dog (catalog DOGS), special
// skins as gradients, outfits drawn on top. Parts that move are grouped:
// .pw-tail (wag), .pw-eyes (blink) — see Dog2D.jsx.
import { DOG_BY_ID } from '../../lib/pugWorld/catalog.js';

const BREED = {
  pug: { ears: 'folded', tail: 'curl', mask: true },
  beagle: { ears: 'floppy', tail: 'up', blaze: true, darkEars: true },
  dachshund: { ears: 'floppy', tail: 'thin', brows: true, longMuzzle: true },
  corgi: { ears: 'big', tail: 'none', blaze: true, cheeks: true, socks: true },
  shiba: { ears: 'pointy', tail: 'fluffcurl', cheeks: true, brows: true, socks: true },
  husky: { ears: 'pointy', tail: 'fluff', huskyFace: true, socks: true },
};
const SKIN = {
  gold: { main: 'url(#g-gold)', second: '#fff1c2', dark: '#c48a1e' },
  crystal: { main: 'url(#g-crystal)', second: '#f2fbff', dark: '#7cc2ff' },
  galaxy: { main: 'url(#g-galaxy)', second: '#d9c8ff', dark: '#24175e', stars: true },
  rainbow: { main: 'url(#g-rainbow)', second: '#fff', dark: '#7a5ad8' },
  neon: { main: 'url(#g-neon)', second: '#d7fff0', dark: '#ff3fd2' },
  cosmic: { main: 'url(#g-cosmic)', second: '#bfe8ff', dark: '#081236', stars: true },
};
const OL = '#3a2a24';
const o = ` stroke="${OL}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"`;
const mir = (s) => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const both = (s) => s + mir(s);

// Outfits, drawn in the dog's coordinates (head centre ≈ 100,88).
const HEAD_WEAR = {
  gradcap: `<path d="M64 48 C64 34 136 34 136 48 L136 58 C120 52 80 52 64 58 Z" fill="#1d1b24"${o}/><path d="M100 14 L156 34 L100 52 L44 34 Z" fill="#26232f"${o}/><circle cx="100" cy="33" r="4" fill="#8b6dff"/><path d="M100 33 L146 40 L146 66" fill="none" stroke="#8b6dff" stroke-width="3.5" stroke-linecap="round"/><circle cx="146" cy="70" r="6" fill="#8b6dff"${o}/>`,
  cap: `<path d="M56 56 C56 22 144 22 144 56 Z" fill="#6d4dff"${o}/><path d="M100 30 L100 54" stroke="#4a30c4" stroke-width="2.5"/><path d="M60 56 C76 50 124 50 140 56 C150 58 160 62 164 68 C140 66 112 62 60 60 Z" fill="#8b6dff"${o}/><circle cx="100" cy="27" r="5" fill="#c9baff"${o}/>`,
  beanie: `<path d="M50 60 C48 18 152 18 150 60 Z" fill="#f5a524"${o}/><path d="M70 30 L70 56 M86 24 L86 56 M100 22 L100 56 M114 24 L114 56 M130 30 L130 56" stroke="#e08a10" stroke-width="2.5"/><rect x="44" y="52" width="112" height="16" rx="8" fill="#e08a10"${o}/><circle cx="100" cy="18" r="11" fill="#fff6e8"${o}/>`,
  partyhat: `<path d="M82 46 L104 -6 L124 46 Z" fill="#ff5fa2"${o}/><path d="M90 30 L116 30 M96 16 L112 16" stroke="#ffe066" stroke-width="4" stroke-linecap="round"/><circle cx="104" cy="-8" r="7" fill="#ffe066"${o}/>`,
  flowers: [[54, 52, '#ff7bac'], [70, 40, '#ffd166'], [88, 34, '#c9baff'], [106, 33, '#7de8ff'], [124, 37, '#ff9f6b'], [140, 46, '#ff7bac']]
    .map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6" rx="4.5" ry="6" fill="${c}" stroke="${OL}" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="3.4" fill="#fff3b0" stroke="${OL}" stroke-width="1.4"/></g>`).join(''),
  headphones: `<path d="M44 90 C40 30 160 30 156 90" fill="none" stroke="${OL}" stroke-width="13" stroke-linecap="round"/><path d="M44 90 C40 30 160 30 156 90" fill="none" stroke="#2c2a36" stroke-width="7" stroke-linecap="round"/>${both('<rect x="30" y="78" width="22" height="34" rx="10" fill="#8b6dff" stroke="#3a2a24" stroke-width="3.6"/>')}`,
};
const FACE_WEAR = {
  sunglasses: `${both(`<path d="M56 78 L92 78 C92 96 84 102 74 102 C62 102 56 94 56 78 Z" fill="#17151d"${o}/><path d="M62 82 L72 82" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`)}<path d="M92 82 Q100 78 108 82" fill="none" stroke="${OL}" stroke-width="3.6"/>`,
  roundglasses: `${both('<circle cx="74" cy="88" r="17" fill="rgba(255,255,255,.12)" stroke="#d9a73a" stroke-width="4"/>')}<path d="M91 86 Q100 81 109 86" fill="none" stroke="#d9a73a" stroke-width="4"/>`,
};
const NECK_WEAR = {
  bowtie: `<path d="M100 140 L74 128 L76 154 Z" fill="#8b6dff"${o}/><path d="M100 140 L126 128 L124 154 Z" fill="#8b6dff"${o}/><circle cx="100" cy="141" r="7" fill="#a58cff"${o}/>`,
  scarf: `<path d="M58 132 C80 146 120 146 142 132 L144 146 C120 160 80 160 56 146 Z" fill="#e0475b"${o}/><path d="M118 148 L132 182 L116 186 L106 152 Z" fill="#e0475b"${o}/><path d="M64 140 L72 150 M84 146 L88 154" stroke="#b8323f" stroke-width="2.5"/>`,
  bandana: `<path d="M62 134 C84 144 116 144 138 134 L100 176 Z" fill="#2ee6c5"${o}/><circle cx="92" cy="148" r="2.6" fill="#fff"/><circle cx="108" cy="148" r="2.6" fill="#fff"/><circle cx="100" cy="160" r="2.6" fill="#fff"/>`,
};

let uid = 0;
// Returns an SVG string. opts: { worn: { head, face, neck }, size }
export function dogSVG(dogId, opts = {}) {
  const d = DOG_BY_ID[dogId] || DOG_BY_ID['pug-fawn'];
  const B = BREED[d.breed];
  const sk = d.skin ? SKIN[d.skin] : null;
  const C = { ...d.colors, ...(sk ? { main: sk.main, second: sk.second, dark: sk.dark } : {}) };
  const worn = opts.worn || {};
  const p = [];
  const tails = {
    curl: `<path d="M138 150 C164 150 172 128 160 118 C150 110 140 120 148 128 C154 134 146 140 138 138 Z" fill="${C.main}"${o}/>`,
    fluffcurl: `<path d="M134 152 C170 156 184 122 166 106 C150 94 134 108 144 120 C152 128 150 138 134 138 Z" fill="${C.main}"${o}/><path d="M160 112 C168 118 166 128 158 132" fill="none" stroke="${C.second}" stroke-width="6" stroke-linecap="round"/>`,
    up: `<path d="M136 150 C150 140 160 118 158 100 C157 94 150 94 149 100 C148 116 140 134 132 140 Z" fill="${C.main}"${o}/><ellipse cx="154" cy="98" rx="7" ry="8" fill="${C.second}"${o}/>`,
    thin: `<path d="M136 160 C156 158 170 150 176 136 C178 131 172 129 169 134 C164 144 152 150 136 150 Z" fill="${C.main}"${o}/>`,
    fluff: `<path d="M132 160 C168 162 182 132 172 108 C168 100 158 102 158 110 C160 128 150 142 132 142 Z" fill="${C.main}"${o}/><path d="M170 112 C174 124 170 136 160 144" fill="none" stroke="${C.second}" stroke-width="7" stroke-linecap="round"/>`,
    none: '',
  };
  if (B.tail !== 'none') p.push(`<g class="pw-tail">${tails[B.tail]}</g>`);
  p.push(`<path d="M56 186 C50 150 66 118 100 118 C134 118 150 150 144 186 Z" fill="${C.main}"${o}/>`);
  p.push(`<path d="M78 186 C74 158 86 136 100 136 C114 136 126 158 122 186 Z" fill="${C.second}"/>`);
  if (d.spots) p.push(`<circle cx="70" cy="160" r="7" fill="${C.dark}"/><circle cx="132" cy="150" r="5" fill="${C.dark}"/><circle cx="128" cy="172" r="6" fill="${C.dark}"/>`);
  const paw = B.socks || sk ? C.second : C.main;
  p.push(both(`<ellipse cx="80" cy="186" rx="15" ry="10" fill="${paw}"${o}/><path d="M76 182 L76 189 M84 182 L84 189" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>`));
  if (B.ears === 'pointy' || B.ears === 'big') {
    const big = B.ears === 'big';
    const outer = big ? 'M42 74 C40 46 44 20 50 10 C66 18 84 32 96 48 Z' : 'M50 68 C48 48 52 28 58 18 C70 26 84 36 92 48 Z';
    const inner = big ? 'M54 64 C54 46 56 30 58 24 C68 32 78 40 86 50 Z' : 'M60 60 C60 46 62 36 64 30 C72 36 80 42 84 50 Z';
    p.push(both(`<path d="${outer}" fill="${C.main}"${o}/><path d="${inner}" fill="${sk ? C.second : '#f6b8ae'}"/>`));
  }
  p.push(`<ellipse cx="100" cy="88" rx="62" ry="53" fill="${C.main}"${o}/>`);
  if (d.spots) p.push(`<circle cx="134" cy="62" r="8" fill="${C.dark}"/><circle cx="62" cy="70" r="5" fill="${C.dark}"/>`);
  if (B.huskyFace) p.push(`<path d="M44 92 C50 128 72 141 100 141 C128 141 150 128 156 92 C144 98 128 96 120 82 C112 90 106 98 100 104 C94 98 88 90 80 82 C72 96 56 98 44 92 Z" fill="${C.second}"/><path d="M100 40 C94 56 94 74 100 88 C106 74 106 56 100 40 Z" fill="${C.second}" opacity=".9"/>`);
  if (B.cheeks) p.push(both(`<ellipse cx="70" cy="114" rx="27" ry="20" fill="${C.second}"/>`));
  if (B.blaze) p.push(`<path d="M100 44 C93 60 92 82 96 100 L104 100 C108 82 107 60 100 44 Z" fill="${C.second}"/>`);
  if (B.brows) p.push(both(`<ellipse cx="78" cy="68" rx="7" ry="4.5" fill="${C.second}"/>`));
  if (B.mask) p.push(both(`<ellipse cx="76" cy="88" rx="17" ry="16" fill="${C.dark}" opacity=".55"/>`) + `<path d="M88 58 Q100 53 112 58 M91 66 Q100 62 109 66" fill="none" stroke="${C.dark}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`);
  p.push(`<ellipse cx="100" cy="${B.longMuzzle ? 114 : 112}" rx="${B.longMuzzle ? 21 : 25}" ry="${B.longMuzzle ? 20 : 17}" fill="${B.mask ? C.dark : C.second}"${o}/>`);
  p.push(`<path d="M89 102 Q100 96 111 102 Q109 111 100 113 Q91 111 89 102 Z" fill="#231713"/><ellipse cx="96" cy="101" rx="4" ry="2" fill="#fff" opacity=".55"/>`);
  p.push(`<path d="M93 120 Q100 136 107 120 Z" fill="#ff8fa3"${o}/>`);
  p.push(`<path d="M100 113 L100 119 M89 117 Q94.5 124 100 119 Q105.5 124 111 117" fill="none" stroke="#231713" stroke-width="2.6" stroke-linecap="round"/>`);
  const blue = /3fa8ff|9bd8ff/.test(d.colors.eye || '');
  const eye = blue
    ? `<ellipse cx="74" cy="88" rx="12" ry="13" fill="${d.colors.eye}"/><ellipse cx="74" cy="89" rx="7" ry="8" fill="#14100e"/><circle cx="78" cy="83" r="4.4" fill="#fff"/><circle cx="70.5" cy="93.5" r="2" fill="#fff"/>`
    : `<ellipse cx="74" cy="88" rx="12" ry="13" fill="#1d130f"/><circle cx="78" cy="83" r="4.4" fill="#fff"/><circle cx="70.5" cy="93.5" r="2" fill="#fff"/>`;
  p.push(`<g class="pw-eyes">${both(eye)}</g>`);
  p.push(both(`<ellipse cx="56" cy="110" rx="9" ry="5" fill="#ff8fa6" opacity=".45"/>`));
  if (B.ears === 'floppy') p.push(both(`<path d="M50 52 C30 58 24 92 30 120 C34 134 50 132 54 118 C58 100 60 76 62 58 Z" fill="${B.darkEars ? C.dark : C.main}"${o}/>`));
  if (B.ears === 'folded') p.push(both(`<path d="M50 44 C34 46 26 62 34 80 C42 70 54 64 70 54 C64 46 58 43 50 44 Z" fill="${C.dark}"${o}/>`));
  if (sk?.stars) p.push(`<g fill="#fff">${[[70, 60, 1.8], [128, 70, 1.4], [110, 50, 1.2], [60, 150, 1.6], [134, 160, 1.3], [88, 172, 1.1], [146, 96, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`);
  if (d.skin === 'crystal') p.push(`<path d="M62 60 C70 48 84 42 96 42" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
  if (worn.neck && NECK_WEAR[worn.neck]) p.push(NECK_WEAR[worn.neck]);
  if (worn.face && FACE_WEAR[worn.face]) p.push(FACE_WEAR[worn.face]);
  if (worn.head && HEAD_WEAR[worn.head]) p.push(HEAD_WEAR[worn.head]);
  else if (d.crown) p.push(`<path d="M78 40 L80 18 L90 30 L100 12 L110 30 L120 18 L122 40 Z" fill="url(#g-gold)"${o}/><circle cx="100" cy="30" r="3.5" fill="#ff5f8a"/>`);

  const id = 'pw' + (uid++).toString(36);
  const defs = `<defs>
<linearGradient id="g-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98f"/><stop offset=".55" stop-color="#f5c64d"/><stop offset="1" stop-color="#d99a26"/></linearGradient>
<linearGradient id="g-crystal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0fbff"/><stop offset=".5" stop-color="#bde6ff"/><stop offset="1" stop-color="#8ccdff"/></linearGradient>
<linearGradient id="g-galaxy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b2fb0"/><stop offset=".5" stop-color="#8a3fd6"/><stop offset="1" stop-color="#d04fb4"/></linearGradient>
<linearGradient id="g-rainbow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8fa8"/><stop offset=".25" stop-color="#ffd27a"/><stop offset=".5" stop-color="#9df0a8"/><stop offset=".75" stop-color="#8fd3ff"/><stop offset="1" stop-color="#c3a2ff"/></linearGradient>
<linearGradient id="g-neon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dffd6"/><stop offset="1" stop-color="#1fd99a"/></linearGradient>
<radialGradient id="g-cosmic" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#2a6fe0"/><stop offset=".6" stop-color="#132f7a"/><stop offset="1" stop-color="#0a1440"/></radialGradient>
<filter id="sticker" x="-12%" y="-12%" width="124%" height="124%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/><feDropShadow in="w" dx="0" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".25" result="ws"/><feMerge><feMergeNode in="ws"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
  const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : ' width="100%" height="100%"';
  const svg = `<svg${size} viewBox="-10 -16 220 222" xmlns="http://www.w3.org/2000/svg">${defs}<g filter="url(#sticker)">${p.join('')}</g></svg>`;
  // Give the gradient / filter ids this drawing's own suffix, so several dogs
  // on one screen never borrow each other's.
  return svg.replace(/(id="|url\(#)(g-[a-z]+|sticker)/g, `$1$2-${id}`);
}
