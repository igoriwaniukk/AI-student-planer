// Pug World's content: the breeds, the ~30 collectible
// dogs (a breed + colours, or a special skin), and the outfits. Pure data —
// the drawings are made from it in components/pugWorld/dogArt.js, names
// come from the pw.breed.* / pw.var.* / pw.outfit.* texts.

export const RARITIES = ['common', 'rare', 'epic', 'legendary'];
export const RARITY_COLOR = { common: '#9a9aab', rare: '#4fa3ff', epic: '#b06dff', legendary: '#f5c451' };

// Shape of each breed (sizes in model units). ears: folded | floppy |
// pointy | big; tail: curl | fluffcurl | up | straight | stub | fluff.
export const BREEDS = {
  pug: { bodyLen: 0.35, bodyR: 0.5, legLen: 0.42, legR: 0.13, head: 0.62, snout: 0.12, snoutR: 0.3, ears: 'folded', tail: 'curl', mask: true },
  beagle: { bodyLen: 0.6, bodyR: 0.46, legLen: 0.5, legR: 0.12, head: 0.56, snout: 0.34, snoutR: 0.22, ears: 'floppy', tail: 'up', saddle: true, blaze: true, darkEars: true },
  dachshund: { bodyLen: 1.15, bodyR: 0.36, legLen: 0.26, legR: 0.11, head: 0.5, snout: 0.42, snoutR: 0.18, ears: 'floppy', tail: 'straight' },
  corgi: { bodyLen: 0.85, bodyR: 0.44, legLen: 0.26, legR: 0.12, head: 0.56, snout: 0.26, snoutR: 0.22, ears: 'big', tail: 'stub', cheeks: true, blaze: true, socks: true },
  shiba: { bodyLen: 0.55, bodyR: 0.45, legLen: 0.45, legR: 0.13, head: 0.57, snout: 0.24, snoutR: 0.22, ears: 'pointy', tail: 'fluffcurl', cheeks: true, socks: true },
  husky: { bodyLen: 0.65, bodyR: 0.5, legLen: 0.5, legR: 0.14, head: 0.6, snout: 0.26, snoutR: 0.24, ears: 'pointy', tail: 'fluff', cheeks: true, eyeMask: true, socks: true },
};
export const BREED_IDS = Object.keys(BREEDS);

// c = colours: main fur, second (chest/socks/cheeks), dark (mask, ears,
// saddle), eye. skin = a special material that replaces the fur.
const d = (id, breed, variant, rarity, c = {}, extra = {}) => ({ id, breed, variant, rarity, colors: { main: '#e2b583', second: '#f6ead8', dark: '#2e211b', eye: '#2a170e', ...c }, ...extra });

export const DOGS = [
  // Common (15)
  d('pug-fawn', 'pug', 'fawn', 'common', { main: '#e2b583', second: '#f1d2a8', dark: '#2e211b' }),
  d('pug-black', 'pug', 'black', 'common', { main: '#3a3230', second: '#57504c', dark: '#1a1513' }),
  d('pug-apricot', 'pug', 'apricot', 'common', { main: '#e9a76a', second: '#f4c999', dark: '#3a2418' }),
  d('beagle-tricolor', 'beagle', 'tricolor', 'common', { main: '#c27a3a', second: '#fbf5ec', dark: '#2a211c', eye: '#3a2212' }),
  d('beagle-lemon', 'beagle', 'lemon', 'common', { main: '#e8c27a', second: '#fbf5ec', dark: '#c99b4e' }),
  d('dachshund-red', 'dachshund', 'red', 'common', { main: '#a5552c', second: '#c97a4a', dark: '#3a1d10' }),
  d('dachshund-blacktan', 'dachshund', 'blackTan', 'common', { main: '#2c211c', second: '#b9763f', dark: '#1a120e' }),
  d('dachshund-cream', 'dachshund', 'cream', 'common', { main: '#e8d3a8', second: '#f4e7cb', dark: '#9a7a52' }),
  d('corgi-red', 'corgi', 'red', 'common', { main: '#e8933e', second: '#fbf5ec', dark: '#2a1a10' }),
  d('corgi-sable', 'corgi', 'sable', 'common', { main: '#b9773e', second: '#fbf5ec', dark: '#4a2a14' }),
  d('shiba-red', 'shiba', 'red', 'common', { main: '#d9823e', second: '#fbf1e2', dark: '#2a1a10' }),
  d('shiba-sesame', 'shiba', 'sesame', 'common', { main: '#a8743f', second: '#f4e6d0', dark: '#3a2616' }),
  d('husky-grey', 'husky', 'grey', 'common', { main: '#7d8494', second: '#f6f6f8', dark: '#2a2a33', eye: '#3fa8ff' }),
  d('husky-black', 'husky', 'black', 'common', { main: '#33343c', second: '#f6f6f8', dark: '#16161b', eye: '#3fa8ff' }),
  d('husky-red', 'husky', 'red', 'common', { main: '#b5683c', second: '#fbf3ea', dark: '#3a1d10', eye: '#7a4a22' }),
  // Rare (9)
  d('pug-snow', 'pug', 'snow', 'rare', { main: '#f6f1ea', second: '#ffffff', dark: '#3a3230' }),
  d('beagle-spotted', 'beagle', 'spotted', 'rare', { main: '#f4ece0', second: '#ffffff', dark: '#6b4a32' }, { spots: true }),
  d('dachshund-dapple', 'dachshund', 'dapple', 'rare', { main: '#8a5a3a', second: '#b98a62', dark: '#d9c2a8' }, { spots: true }),
  d('corgi-tricolor', 'corgi', 'tricolor', 'rare', { main: '#2c2420', second: '#fbf5ec', dark: '#c27a3a' }),
  d('corgi-merle', 'corgi', 'merle', 'rare', { main: '#9aa3b4', second: '#fbf5ec', dark: '#3a3f4c' }, { spots: true }),
  d('shiba-cream', 'shiba', 'cream', 'rare', { main: '#f1e2c4', second: '#fffaf0', dark: '#7a6248' }),
  d('shiba-blacktan', 'shiba', 'blackTan', 'rare', { main: '#2c241f', second: '#e9c79c', dark: '#16110e' }),
  d('husky-snow', 'husky', 'snow', 'rare', { main: '#eef0f4', second: '#ffffff', dark: '#9aa0ac', eye: '#3fa8ff' }),
  d('husky-wolf', 'husky', 'wolf', 'rare', { main: '#8a7a6a', second: '#efe7dc', dark: '#3a3028', eye: '#e3a63a' }),
  // Epic (4)
  d('shiba-galaxy', 'shiba', 'galaxy', 'epic', {}, { skin: 'galaxy' }),
  d('husky-crystal', 'husky', 'crystal', 'epic', { eye: '#3fa8ff' }, { skin: 'crystal' }),
  d('pug-rainbow', 'pug', 'rainbow', 'epic', {}, { skin: 'rainbow' }),
  d('dachshund-neon', 'dachshund', 'neon', 'epic', {}, { skin: 'neon' }),
  // Legendary (2)
  d('corgi-golden', 'corgi', 'golden', 'legendary', {}, { skin: 'gold', crown: true }),
  d('husky-cosmic', 'husky', 'cosmic', 'legendary', { eye: '#9bd8ff' }, { skin: 'cosmic', crown: true }),
];
export const DOG_BY_ID = Object.fromEntries(DOGS.map((x) => [x.id, x]));
export const STARTERS = ['pug-fawn', 'corgi-red', 'shiba-red'];

// Outfits: one per slot can be worn (head, face, neck).
export const OUTFITS = [
  { id: 'gradcap', slot: 'head', price: 300 },
  { id: 'cap', slot: 'head', price: 200 },
  { id: 'beanie', slot: 'head', price: 200 },
  { id: 'partyhat', slot: 'head', price: 150 },
  { id: 'flowers', slot: 'head', price: 350 },
  { id: 'headphones', slot: 'head', price: 400 },
  { id: 'sunglasses', slot: 'face', price: 250 },
  { id: 'roundglasses', slot: 'face', price: 200 },
  { id: 'bowtie', slot: 'neck', price: 150 },
  { id: 'scarf', slot: 'neck', price: 250 },
  { id: 'bandana', slot: 'neck', price: 150 },
];
export const OUTFIT_BY_ID = Object.fromEntries(OUTFITS.map((x) => [x.id, x]));
export const OUTFIT_ICON = { gradcap: '🎓', cap: '🧢', beanie: '🧶', partyhat: '🥳', flowers: '🌸', headphones: '🎧', sunglasses: '🕶️', roundglasses: '👓', bowtie: '🎀', scarf: '🧣', bandana: '🎽' };
