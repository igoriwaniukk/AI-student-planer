import { DOG_BY_ID, RARITY_COLOR } from '../../lib/pugWorld/catalog.js';

// "Fawn Pug", "Carlin fauve", "Rehbrauner Mops"… — the word order lives in
// each language's pw.dogName text.
export function dogName(t, id) {
  const d = DOG_BY_ID[id];
  if (!d) return '';
  return t('pw.dogName', { variant: t('pw.var.' + d.variant), breed: t('pw.breed.' + d.breed) });
}
export const rarityOf = (id) => DOG_BY_ID[id]?.rarity || 'common';
export const rarityColor = (id) => RARITY_COLOR[rarityOf(id)];
