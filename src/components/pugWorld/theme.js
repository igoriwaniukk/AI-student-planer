// Pug World's shared look.
export const CARD = { padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' };
export const PURPLE = 'linear-gradient(160deg,#8b6dff,#6d4dff)';

// The chests: small (wood), silver, gold, epic (purple).
export const CHEST_COLORS = {
  small: { lid: '#d39456', body: '#b97a3f', band: '#7a4c22', glow: 'rgba(211,148,86,.35)' },
  silver: { lid: '#e9edf5', body: '#c3cad8', band: '#7d8698', glow: 'rgba(201,214,238,.4)' },
  gold: { lid: '#ffd86e', body: '#f2b93b', band: '#a8731a', glow: 'rgba(245,196,81,.5)' },
  epic: { lid: '#c3a2ff', body: '#9a6dff', band: '#5a34b8', glow: 'rgba(176,109,255,.55)' },
};

// Bright, Duolingo-like colours [light, base, shade]: chest tiles and the
// chest-opening screen (by chest), the big dog's stage and the reveal (by
// rarity, or by what came out of the chest). `shade` is the pressed-down
// edge under chunky buttons and tiles.
export const CHEST_BRIGHT = {
  small: ['#ffc06b', '#ff9600', '#e08500'],
  silver: ['#7fd6ff', '#1cb0f6', '#1899d6'],
  gold: ['#ffe680', '#ffc800', '#e5a900'],
  epic: ['#e6bcff', '#ce82ff', '#a568cc'],
};
export const RARITY_BRIGHT = {
  common: ['#9be35a', '#58cc02', '#46a302'],
  rare: ['#7fd6ff', '#1cb0f6', '#1899d6'],
  epic: ['#e6bcff', '#ce82ff', '#a568cc'],
  legendary: ['#ffe680', '#ffc800', '#e5a900'],
};
export const KIND_BRIGHT = {
  outfit: ['#8ff5e0', '#1fd1ae', '#14a88b'],
  freeze: ['#bfe6ff', '#49b8ff', '#1f8fd6'],
  coins: ['#ffe680', '#ffc800', '#e5a900'],
};
export const GREEN = ['#89e219', '#58cc02', '#46a302'];
