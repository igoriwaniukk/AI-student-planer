// Builds Pug World's toy-style 3D dogs from simple shapes (three.js).
// Loaded lazily (import('./dogModel.js')) so three.js only downloads when
// the game is opened. One shape per breed (catalog BREEDS), colours or a
// special skin per dog (catalog DOGS), outfits on head / face / neck.
// The model faces +X; the caller turns it (rotation.y ≈ -1 = 3/4 view).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BREEDS, DOG_BY_ID } from '../../lib/pugWorld/catalog.js';

export { THREE };

// ---------- textures for the special skins (made once, kept) ----------
const texCache = {};
function canvasTex(key, draw, size = 256) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache[key] = t;
  return t;
}
function stars(g, n, s, colors, seed) {
  let h = seed;
  const r = () => { h = (h * 16807) % 2147483647; return h / 2147483647; };
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[i % colors.length];
    g.globalAlpha = 0.5 + r() * 0.5;
    g.beginPath(); g.arc(r() * s, r() * s, 0.6 + r() * 2.2, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}
const galaxyTex = () => canvasTex('galaxy', (g, s) => {
  const gr = g.createLinearGradient(0, 0, s, s);
  gr.addColorStop(0, '#2a1a6e'); gr.addColorStop(0.5, '#6a2fb8'); gr.addColorStop(1, '#1f2a8a');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 5; i++) {
    const x = (i * 97) % s, y = (i * 53) % s, rg = g.createRadialGradient(x, y, 0, x, y, s * 0.35);
    rg.addColorStop(0, i % 2 ? 'rgba(255,110,210,0.45)' : 'rgba(110,180,255,0.4)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
  }
  stars(g, 140, s, ['#ffffff', '#ffd6f5', '#cfe4ff'], 7);
});
const cosmicTex = () => canvasTex('cosmic', (g, s) => {
  const gr = g.createLinearGradient(0, s, s, 0);
  gr.addColorStop(0, '#05081f'); gr.addColorStop(0.55, '#10265e'); gr.addColorStop(1, '#0a5a8a');
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 4; i++) {
    const x = (i * 131) % s, y = (i * 71 + 40) % s, rg = g.createRadialGradient(x, y, 0, x, y, s * 0.3);
    rg.addColorStop(0, 'rgba(80,230,255,0.4)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
  }
  stars(g, 220, s, ['#ffffff', '#9bf0ff', '#fff3b0'], 13);
});
const rainbowTex = () => canvasTex('rainbow', (g, s) => {
  const gr = g.createLinearGradient(0, 0, s, 0);
  ['#ff6b8b', '#ffb36b', '#ffe66b', '#7dffa0', '#6bd6ff', '#9b7bff', '#ff6b8b'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
});

// ---------- materials ----------
function skinMaterials(skin) {
  const P = (o) => new THREE.MeshPhysicalMaterial(o);
  switch (skin) {
    case 'gold': return { main: P({ color: '#ffcb4d', metalness: 1, roughness: 0.22, clearcoat: 1 }), dark: P({ color: '#b8862a', metalness: 1, roughness: 0.3, clearcoat: 1 }) };
    case 'crystal': return { main: P({ color: '#c9eeff', roughness: 0.05, transmission: 0.55, thickness: 0.8, ior: 1.5, clearcoat: 1, emissive: '#5fb8ff', emissiveIntensity: 0.25 }), dark: P({ color: '#7fc4ff', roughness: 0.1, clearcoat: 1, emissive: '#3f8fff', emissiveIntensity: 0.2 }) };
    case 'galaxy': return { main: P({ color: '#ffffff', map: galaxyTex(), roughness: 0.3, clearcoat: 1, emissive: '#ffffff', emissiveMap: galaxyTex(), emissiveIntensity: 0.35 }), dark: P({ color: '#1d1450', roughness: 0.3, clearcoat: 1, emissive: '#3a2a9a', emissiveIntensity: 0.3 }) };
    case 'cosmic': return { main: P({ color: '#ffffff', map: cosmicTex(), roughness: 0.25, clearcoat: 1, emissive: '#ffffff', emissiveMap: cosmicTex(), emissiveIntensity: 0.45, iridescence: 0.6 }), dark: P({ color: '#081236', roughness: 0.3, clearcoat: 1, emissive: '#1a6fff', emissiveIntensity: 0.35 }) };
    case 'rainbow': return { main: P({ color: '#ffffff', map: rainbowTex(), roughness: 0.35, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, sheen: 1, sheenColor: '#ffffff' }), dark: P({ color: '#5a3aa8', roughness: 0.35, clearcoat: 1, iridescence: 1 }) };
    case 'neon': return { main: P({ color: '#2bffb0', roughness: 0.35, clearcoat: 1, emissive: '#18e09a', emissiveIntensity: 0.55 }), dark: P({ color: '#ff3fd2', roughness: 0.3, clearcoat: 1, emissive: '#ff2fc8', emissiveIntensity: 0.6 }) };
    default: return null;
  }
}
const furMat = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.72, sheen: 1, sheenColor: '#fff3e0', sheenRoughness: 0.6 });

// ---------- outfits (head-local coordinates: front +X, up +Y) ----------
const OUTFIT_BUILD = {
  gradcap(h, add) {
    const black = new THREE.MeshPhysicalMaterial({ color: '#1b1a22', roughness: 0.5, clearcoat: 0.4 });
    const purple = new THREE.MeshStandardMaterial({ color: '#8b6dff', roughness: 0.4 });
    add(new THREE.CylinderGeometry(h * 0.48, h * 0.52, h * 0.28, 32), black, [0, h * 0.86, 0]);
    add(new THREE.BoxGeometry(h * 1.35, h * 0.06, h * 1.35), black, [0, h * 1.02, 0], [0, Math.PI / 4, 0]);
    add(new THREE.SphereGeometry(h * 0.06, 16, 16), purple, [0, h * 1.07, 0]);
    add(new THREE.CylinderGeometry(h * 0.025, h * 0.025, h * 0.5, 8), purple, [h * 0.5, h * 0.82, h * 0.5]);
    add(new THREE.SphereGeometry(h * 0.08, 16, 16), purple, [h * 0.5, h * 0.55, h * 0.5]);
  },
  cap(h, add) {
    const m = new THREE.MeshStandardMaterial({ color: '#6d4dff', roughness: 0.5 });
    add(new THREE.SphereGeometry(h * 0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, [0, h * 0.62, 0]);
    add(new THREE.CylinderGeometry(h * 0.5, h * 0.5, h * 0.04, 32, 1, false, -Math.PI / 2, Math.PI), m, [h * 0.3, h * 0.64, 0], [0, 0, -0.12]);
    add(new THREE.SphereGeometry(h * 0.07, 12, 12), new THREE.MeshStandardMaterial({ color: '#c9baff' }), [0, h * 1.24, 0]);
  },
  beanie(h, add) {
    const m = new THREE.MeshStandardMaterial({ color: '#f5a524', roughness: 0.85 });
    add(new THREE.SphereGeometry(h * 0.66, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, [0, h * 0.5, 0], [0, 0, 0], [1, 1.05, 1]);
    add(new THREE.TorusGeometry(h * 0.64, h * 0.11, 12, 40), new THREE.MeshStandardMaterial({ color: '#e08a10', roughness: 0.9 }), [0, h * 0.52, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.SphereGeometry(h * 0.17, 16, 16), new THREE.MeshStandardMaterial({ color: '#fff3e0', roughness: 1 }), [0, h * 1.22, 0]);
  },
  partyhat(h, add) {
    add(new THREE.ConeGeometry(h * 0.34, h * 0.8, 32), new THREE.MeshStandardMaterial({ color: '#ff5fa2', roughness: 0.45 }), [0, h * 1.18, 0], [0, 0, -0.12]);
    add(new THREE.SphereGeometry(h * 0.1, 16, 16), new THREE.MeshStandardMaterial({ color: '#ffe066' }), [h * 0.05, h * 1.6, 0]);
  },
  flowers(h, add) {
    const colors = ['#ff7bac', '#ffd166', '#c9baff', '#7de8ff', '#ff9f6b'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      add(new THREE.SphereGeometry(h * 0.12, 16, 16), new THREE.MeshStandardMaterial({ color: colors[i % 5], roughness: 0.5 }), [Math.cos(a) * h * 0.58, h * 0.72, Math.sin(a) * h * 0.58]);
    }
  },
  headphones(h, add) {
    const m = new THREE.MeshPhysicalMaterial({ color: '#2a2833', roughness: 0.35, clearcoat: 1 });
    add(new THREE.TorusGeometry(h * 0.92, h * 0.07, 12, 40, Math.PI), m, [-h * 0.05, h * 0.05, 0], [0, Math.PI / 2, 0]);
    for (const z of [-1, 1]) add(new THREE.CylinderGeometry(h * 0.26, h * 0.26, h * 0.16, 24), new THREE.MeshStandardMaterial({ color: '#8b6dff', roughness: 0.4 }), [-h * 0.05, h * 0.02, z * h * 0.95], [Math.PI / 2, 0, 0]);
  },
  sunglasses(h, add) {
    const m = new THREE.MeshPhysicalMaterial({ color: '#0d0c12', roughness: 0.1, metalness: 0.4, clearcoat: 1 });
    for (const z of [-1, 1]) add(new THREE.CylinderGeometry(h * 0.24, h * 0.24, h * 0.05, 24), m, [h * 0.98, h * 0.16, z * h * 0.34], [0, 0, Math.PI / 2], [1, 1, 0.85]);
    add(new THREE.BoxGeometry(h * 0.05, h * 0.05, h * 0.3), m, [h * 1.02, h * 0.2, 0]);
  },
  roundglasses(h, add) {
    const m = new THREE.MeshPhysicalMaterial({ color: '#d9b45a', metalness: 1, roughness: 0.25 });
    for (const z of [-1, 1]) add(new THREE.TorusGeometry(h * 0.2, h * 0.03, 10, 32), m, [h * 0.98, h * 0.16, z * h * 0.34], [0, Math.PI / 2, 0]);
    add(new THREE.BoxGeometry(h * 0.04, h * 0.04, h * 0.28), m, [h * 1.0, h * 0.2, 0]);
  },
};
// Neck-local: front +X.
const NECK_BUILD = {
  bowtie(r, add) {
    const m = new THREE.MeshPhysicalMaterial({ color: '#8b6dff', roughness: 0.4, sheen: 1, sheenColor: '#c9baff' });
    for (const z of [-1, 1]) add(new THREE.ConeGeometry(r * 0.28, r * 0.5, 4), m, [r * 0.82, 0, z * r * 0.24], [z * Math.PI / 2, 0, 0], [1, 1, 0.6]);
    add(new THREE.SphereGeometry(r * 0.13, 16, 16), m, [r * 0.86, 0, 0]);
  },
  scarf(r, add) {
    const m = new THREE.MeshStandardMaterial({ color: '#e0475b', roughness: 0.9 });
    add(new THREE.TorusGeometry(r * 0.78, r * 0.17, 12, 40), m, [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.CapsuleGeometry(r * 0.13, r * 0.55, 6, 12), m, [r * 0.72, -r * 0.4, r * 0.3], [0.2, 0, 0.15]);
  },
  bandana(r, add) {
    const m = new THREE.MeshStandardMaterial({ color: '#2ee6c5', roughness: 0.7 });
    add(new THREE.TorusGeometry(r * 0.78, r * 0.08, 10, 40), m, [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.ConeGeometry(r * 0.45, r * 0.7, 3), m, [r * 0.72, -r * 0.3, 0], [Math.PI, 0, 0.3], [0.5, 1, 1]);
  },
};

// ---------- the dog ----------
// Returns { root, parts: { body, head, tail, eyes }, dispose }.
// opts: { worn: { head, face, neck }, silhouette }
export function makeDog(dogId, opts = {}) {
  const def = DOG_BY_ID[dogId] || DOG_BY_ID['pug-fawn'];
  const B = BREEDS[def.breed];
  const C = def.colors;
  const worn = opts.worn || {};
  const geos = new Set(), mats = new Set();
  const silhouette = opts.silhouette ? new THREE.MeshBasicMaterial({ color: '#34324a' }) : null;
  const skin = silhouette ? null : skinMaterials(def.skin);
  const MAIN = silhouette || skin?.main || furMat(C.main);
  const SECOND = silhouette || skin?.main || furMat(C.second);
  const DARK = silhouette || skin?.dark || new THREE.MeshPhysicalMaterial({ color: C.dark, roughness: 0.55, sheen: 0.6, sheenColor: '#6b5040' });
  const mat = (m) => silhouette || m;

  const root = new THREE.Group();
  const model = new THREE.Group(); root.add(model);
  const body = new THREE.Group(); model.add(body);
  const S = (r, w = 40, h = 32) => new THREE.SphereGeometry(r, w, h);
  const add = (geo, m, pos, rot = [0, 0, 0], sc = [1, 1, 1], parent = body) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.scale.set(...sc);
    mesh.castShadow = true;
    parent.add(mesh); geos.add(geo); mats.add(m);
    return mesh;
  };

  const bodyY = B.legLen + B.bodyR * 0.8;
  const half = B.bodyLen / 2;
  add(new THREE.CapsuleGeometry(B.bodyR, B.bodyLen, 12, 32), MAIN, [0, bodyY, 0], [0, 0, Math.PI / 2]);
  add(S(B.bodyR * 0.8), SECOND, [half * 0.9 + B.bodyR * 0.25, bodyY - B.bodyR * 0.15, 0], [0, 0, 0], [0.8, 0.95, 0.9]);
  if (B.saddle) add(S(B.bodyR * 1.02), DARK, [-half * 0.15, bodyY + B.bodyR * 0.25, 0], [0, 0, 0], [Math.max(1, B.bodyLen * 1.3), 0.6, 1.0]);
  if (def.spots && !silhouette) {
    const q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
    const spots = [[-0.7, 0.3], [-0.2, -0.9], [0.35, 0.7], [0.75, -0.35], [-0.95, -0.4], [0.1, 0.05], [-0.45, 1.05], [0.6, 1.2]];
    for (const [fx, ang] of spots) {
      const n = new THREE.Vector3(0, Math.cos(ang), Math.sin(ang));
      const m = add(S(B.bodyR * 0.26, 20, 16), DARK, [fx * half, bodyY + n.y * B.bodyR * 0.97, n.z * B.bodyR * 0.97], [0, 0, 0], [1, 1, 0.3]);
      m.quaternion.copy(q.setFromUnitVectors(zAxis, n));
    }
  }
  for (const x of [half * 0.95, -half * 0.95]) for (const z of [-B.bodyR * 0.55, B.bodyR * 0.55]) {
    add(new THREE.CapsuleGeometry(B.legR, B.legLen * 0.75, 8, 16), MAIN, [x, B.legLen * 0.55, z]);
    add(S(B.legR * 1.25, 24, 16), B.socks ? SECOND : MAIN, [x + 0.04, B.legR * 0.7, z], [0, 0, 0], [1.4, 0.7, 1.1]);
  }

  // tail: a group pivoting at its base, so it can wag
  const tail = new THREE.Group();
  const tx = -half - B.bodyR * 0.75, ty = bodyY + B.bodyR * 0.35;
  tail.position.set(tx + 0.1, ty - 0.05, 0); body.add(tail);
  const T = (geo, m, pos, rot, sc) => add(geo, m, [pos[0] - tx - 0.1, pos[1] - ty + 0.05, pos[2]], rot, sc, tail);
  if (B.tail === 'curl') T(new THREE.TorusGeometry(0.15, 0.07, 16, 40, Math.PI * 1.6), MAIN, [tx + 0.05, ty + 0.12, 0], [0, Math.PI / 2, 0.4]);
  if (B.tail === 'fluffcurl') T(new THREE.TorusGeometry(0.2, 0.12, 16, 40, Math.PI * 1.5), MAIN, [tx + 0.08, ty + 0.2, 0], [0, Math.PI / 2, 0.2]);
  if (B.tail === 'up') { T(new THREE.CapsuleGeometry(0.07, 0.45, 8, 16), MAIN, [tx, ty + 0.25, 0], [0, 0, 0.5]); T(S(0.09, 20, 16), SECOND, [tx - 0.13, ty + 0.5, 0]); }
  if (B.tail === 'straight') T(new THREE.CapsuleGeometry(0.07, 0.5, 8, 16), MAIN, [tx - 0.1, ty, 0], [0, 0, 1.1]);
  if (B.tail === 'stub') T(S(0.13, 20, 16), MAIN, [tx + 0.1, ty, 0]);
  if (B.tail === 'fluff') T(new THREE.CapsuleGeometry(0.17, 0.45, 8, 16), MAIN, [tx - 0.05, ty + 0.25, 0], [0, 0, 0.35]);

  // neck accessory
  if (worn.neck && NECK_BUILD[worn.neck]) {
    const neck = new THREE.Group();
    neck.position.set(half + B.bodyR * 0.5, bodyY + B.bodyR * 0.55, 0);
    neck.rotation.z = -0.5; body.add(neck);
    NECK_BUILD[worn.neck](B.bodyR * 0.75, (g, m, p, r, s) => add(g, mat(m), p, r, s, neck));
  }

  // head
  const head = new THREE.Group();
  const h = B.head;
  head.position.set(half + B.bodyR * 0.55, bodyY + B.bodyR * 0.75 + h * 0.55, 0);
  body.add(head);
  const H = (geo, m, pos, rot, sc) => add(geo, m, pos, rot, sc, head);
  H(S(h), MAIN, [0, 0, 0], [0, 0, 0], [1.0, 0.95, 1.05]);
  if (B.cheeks) for (const z of [-1, 1]) H(S(h * 0.55), SECOND, [h * 0.38, -h * 0.32, z * h * 0.3], [0, 0, 0], [1, 0.8, 0.9]);
  if (B.blaze) H(S(h * 0.35), SECOND, [h * 0.62, h * 0.18, 0], [0, 0, 0.3], [0.5, 1.4, 0.55]);
  if (B.eyeMask) for (const z of [-1, 1]) H(S(h * 0.42), SECOND, [h * 0.55, h * 0.12, z * h * 0.28], [0, 0, 0], [0.6, 0.6, 0.7]);
  const sx = h * 0.78 + B.snout * 0.5;
  H(new THREE.CapsuleGeometry(B.snoutR, B.snout, 8, 24), B.mask ? DARK : SECOND, [sx, -h * 0.25, 0], [0, 0, Math.PI / 2], [1, 1, 1.15]);
  H(S(B.snoutR * 0.45, 24, 16), mat(new THREE.MeshPhysicalMaterial({ color: '#120c0a', roughness: 0.25, clearcoat: 1 })), [sx + B.snout * 0.5 + B.snoutR * 0.85, -h * 0.12, 0], [0, 0, 0], [0.8, 0.8, 1.1]);
  H(S(B.snoutR * 0.35, 24, 16), mat(new THREE.MeshStandardMaterial({ color: '#ff7f9c', roughness: 0.4 })), [sx + B.snout * 0.2, -h * 0.25 - B.snoutR * 0.85, 0], [0, 0, 0], [1, 0.5, 0.9]);
  if (B.mask) for (const z of [-1, 1]) H(S(h * 0.3), DARK, [h * 0.72, h * 0.12, z * h * 0.38], [0, 0, 0], [0.5, 0.9, 0.9]);
  const eyes = [];
  const white = mat(new THREE.MeshStandardMaterial({ color: '#f6efe6', roughness: 0.3 }));
  const iris = mat(new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.12, clearcoat: 1 }));
  const shine = mat(new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  for (const z of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(h * 0.82, h * 0.15, z * h * 0.36); head.add(eye);
    add(S(h * 0.26, 32, 24), white, [0, 0, 0], [0, 0, 0], [0.55, 1, 1], eye);
    add(S(h * 0.21, 32, 24), iris, [0.06, 0, 0], [0, 0, 0], [0.55, 1, 1], eye);
    add(S(h * 0.06, 12, 12), shine, [0.17, 0.06, z * -0.04], [0, 0, 0], [0.5, 1, 1], eye);
    eyes.push(eye);
  }
  const ears = [];
  for (const z of [-1, 1]) {
    if (B.ears === 'folded') ears.push(H(S(h * 0.38), DARK, [h * 0.15, h * 0.6, z * h * 0.8], [z * 0.9, 0, 0.2], [0.9, 0.55, 0.35]));
    if (B.ears === 'floppy') ears.push(H(S(h * 0.4), B.darkEars ? DARK : MAIN, [-h * 0.05, 0, z * h * 0.98], [z * 0.15, 0, 0.1], [0.75, 1.5, 0.3]));
    if (B.ears === 'pointy' || B.ears === 'big') {
      const s = B.ears === 'big' ? 1.35 : 1;
      ears.push(H(new THREE.ConeGeometry(h * 0.3 * s, h * 0.6 * s, 24), MAIN, [-h * 0.05, h * 0.85 + 0.05 * s, z * h * 0.55], [z * -0.35, 0, 0], [1, 1, 0.55]));
      H(new THREE.ConeGeometry(h * 0.18 * s, h * 0.4 * s, 24), skin?.main || mat(new THREE.MeshStandardMaterial({ color: '#f3b7b0', roughness: 0.6 })), [h * 0.06, h * 0.82 + 0.04 * s, z * h * 0.52], [z * -0.35, 0, 0], [1, 1, 0.4]);
    }
  }
  const hatOn = worn.head && OUTFIT_BUILD[worn.head];
  if (def.crown && !hatOn) {
    const cm = mat(new THREE.MeshPhysicalMaterial({ color: '#ffd45a', metalness: 1, roughness: 0.2 }));
    H(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 6, 1, true), cm, [0, h * 1.0, 0]);
    for (let i = 0; i < 6; i++) H(new THREE.ConeGeometry(0.05, 0.14, 8), cm, [Math.cos(i * Math.PI / 3) * 0.2, h * 1.0 + 0.12, Math.sin(i * Math.PI / 3) * 0.2]);
  }
  for (const slot of ['head', 'face']) {
    const id = worn[slot];
    if (id && OUTFIT_BUILD[id]) OUTFIT_BUILD[id](h, (g, m, p, r, s) => H(g, mat(m), p, r, s));
  }
  head.rotation.z = 0.05;

  // centre the model on its own feet so it spins in place
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  const size = box.getSize(new THREE.Vector3());

  return {
    root,
    size,
    parts: { body, head, tail, eyes, ears },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

// ---------- scene helpers ----------
export function makeRenderer(canvas, { alpha = true, keep = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: keep, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}
export function makeScene(renderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#c9baff', '#5a3a24', 1.0));
  const key = new THREE.DirectionalLight('#fff3e6', 2.0); key.position.set(3, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#a58cff', 1.4); rim.position.set(-4, 3, -3); scene.add(rim);
  return { scene, envTexture: env.texture };
}
// A soft round shadow under the dog.
export function makeShadow(radius = 1) {
  const tex = canvasTex('shadow', (g, s) => {
    const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    rg.addColorStop(0, 'rgba(0,0,0,0.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
  }, 128);
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.003;
  mesh.userData.dispose = () => { geo.dispose(); m.dispose(); };
  return mesh;
}
// Frames an object (with its current turn) in the camera, seen slightly from
// above: finds the closest distance where every corner of its box fits.
// `fill` = how much of the frame it may take (0–1); `pad` adds space below.
export function fitCamera(camera, object, { fill = 0.86, pad = 0 } = {}) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const c = box.getCenter(new THREE.Vector3());
  const target = new THREE.Vector3(c.x, c.y - pad * (box.max.y - box.min.y), c.z);
  const dir = new THREE.Vector3(0, 0.38, 1).normalize();
  const corners = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  const v = new THREE.Vector3();
  const fits = (dist) => {
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    return corners.every((p) => { v.copy(p).project(camera); return Math.abs(v.x) <= fill && Math.abs(v.y) <= fill && v.z < 1; });
  };
  let lo = 0.1, hi = 60;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
  fits(hi);
}

// ---------- still pictures for album cards (one shared renderer) ----------
let thumb = null;
const thumbCache = new Map();
export function dogThumbnail(dogId, { worn, silhouette, size = 256 } = {}) {
  const key = [dogId, silhouette ? 's' : '', worn ? JSON.stringify(worn) : '', size].join('|');
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!thumb) {
    const canvas = document.createElement('canvas');
    const renderer = makeRenderer(canvas, { keep: true });
    renderer.setPixelRatio(1);
    const { scene } = makeScene(renderer);
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    thumb = { canvas, renderer, scene, camera };
  }
  const { renderer, scene, camera, canvas } = thumb;
  renderer.setSize(size, size, false);
  const dog = makeDog(dogId, { worn, silhouette });
  dog.root.rotation.y = -1.0;
  scene.add(dog.root);
  camera.aspect = 1;
  fitCamera(camera, dog.root, { fill: 1 });
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  scene.remove(dog.root);
  dog.dispose();
  if (thumbCache.size > 120) thumbCache.delete(thumbCache.keys().next().value);
  thumbCache.set(key, url);
  return url;
}
