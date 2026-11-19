import { useEffect, useState } from 'react';
import { AppShellPortal, BackButton } from '../ui';
import { useLang } from '../../lib/useLang';
import { localDateKey, pluralForm } from '../../lib/plannerLogic';
import { DOGS, DOG_BY_ID, BREED_IDS, STARTERS, OUTFIT_BY_ID, OUTFIT_SETS, RARITIES } from '../../lib/pugWorld/catalog.js';
import {
  CHEST_PRICE, collectionScore, dogPower, bumpMission,
  shopOffers, buyOutfit, buyChest, breedDogs, chooseStarter, buySet, setPrice, wearSet, fullSetOn,
} from '../../lib/pugWorld/logic.js';
import Dog2D from './Dog2D';
import Wardrobe from './Wardrobe';
import { CoinIcon, OutfitPic } from './icons';
import DogThumb from './DogThumb';
import ChestIcon from './Chest';
import ChestOpen, { ChancesSheet } from './ChestOpen';
import { ThickBar } from './missionBits';
import ShopReveal from './ShopReveal';
import { hoursToMidnight } from './missionUtil';
import DogShowcase, { Places } from './DogShowcase';
import { dogName } from './names';
import { Card, RarityPill, Stars, Button, CoinPill, Stage, Chunky, ColorStage } from './bits';
import { CHEST_BRIGHT, RARITY_BRIGHT } from './theme';

// The dog collection game. Studying earns chests, chests hold dogs (and
// coins, outfits, streak freezes).
const TABS = ['yard', 'album', 'shop', 'friends'];
const CHEST_ORDER = ['epic', 'gold', 'silver', 'small'];
const CARD_SLIM = { marginTop: 14, padding: '12px 16px', borderRadius: 20, background: '#151221', border: '1px solid rgba(255,255,255,.07)' };
// Album cards: light, in the rarity's colour (the dogs are stickers).
const TILE = { common: '#c9d8f5', rare: '#bfe0ff', epic: '#dccbff', legendary: '#ffe7a8' };

// The My dogs page (opened by tapping a dog anywhere, or from the Missions
// page): Yard · Album · Shop · Friends as chips on top. `intent` = what was
// asked for (a tab, a chest to open right away, or a dog to show up close);
// `onStudy` goes back to studying, `onBack` to where you came from.
export default function PugWorld({ pw, intent, onStudy, onBack }) {
  const { t } = useLang();
  const { state, update } = pw;
  const first = intent?.tab === 'dogs' ? 'yard' : intent?.tab;
  const [tab, setTab] = useState(TABS.includes(first) ? first : 'yard');
  const [opening, setOpening] = useState(() => (intent?.chest && pw.state.chests.some((c) => c.id === intent.chest) ? intent.chest : null));
  const [showDog, setShowDog] = useState(() => (intent?.dog && pw.state.dogs[intent.dog] ? intent.dog : null));
  const [chances, setChances] = useState(false);
  const overlay = opening || showDog || chances;

  useEffect(() => { if (tab === 'album' && pw.started) update((s) => bumpMission(s, 'album')); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 16px calc(var(--tabbar-h) + 28px)', position: 'relative', zIndex: 1 }}>
      {!pw.started ? (
        <>
          <BackButton onClick={onBack} />
          <Starter onPick={(id) => update((s) => chooseStarter(s, id))} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BackButton onClick={onBack} />
            <div style={{ flex: 1, fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{t('pw.title')}</div>
            <CoinPill n={state.coins} />
          </div>
          <TabBarPill tab={tab} onTab={setTab} />
          {tab === 'yard' && <MyDogs pw={pw} onOpenChest={setOpening} onChances={() => setChances(true)} onStudy={onStudy} onShop={() => setTab('shop')} onAlbum={() => setTab('album')} />}
          {tab === 'album' && <Album state={state} onShowDog={setShowDog} onChances={() => setChances(true)} />}
          {tab === 'shop' && <Shop pw={pw} />}
          {tab === 'friends' && <Friends state={state} />}
        </>
      )}
      {overlay && (
        <AppShellPortal>
          <div style={{ position: 'absolute', inset: 0, zIndex: 90 }}>
            {opening && <ChestOpen key={opening} pw={pw} chestId={opening} onNext={setOpening} onClose={() => setOpening(null)} />}
            {showDog && <DogShowcase pw={pw} dogId={showDog} onClose={() => setShowDog(null)} onShop={() => { setShowDog(null); setTab('shop'); }} />}
            {chances && <ChancesSheet onClose={() => setChances(false)} />}
          </div>
        </AppShellPortal>
      )}
    </div>
  );
}

// The page's parts as one calm bar; a white pill slides to the open one,
// whose icon shows in its colour (dog green, album purple, shop orange,
// friends blue).
const TAB_ICON = {
  yard: (c) => <><path d="M5 5c-1.6 0-2.6 2-2.4 4.2.2 1.7 1.2 2.6 2.1 2.4L6 9.5C6.4 7.6 6 5 5 5zm14 0c1.6 0 2.6 2 2.4 4.2-.2 1.7-1.2 2.6-2.1 2.4L18 9.5C17.6 7.6 18 5 19 5z" fill={c} opacity=".75" /><path d="M12 5.5c-3.6 0-6 2.6-6 6.4 0 3.9 2.6 6.6 6 6.6s6-2.7 6-6.6c0-3.8-2.4-6.4-6-6.4z" fill={c} /><circle cx="9.6" cy="11" r="1.1" fill="#1b1530" /><circle cx="14.4" cy="11" r="1.1" fill="#1b1530" /><ellipse cx="12" cy="14.2" rx="1.6" ry="1.1" fill="#1b1530" /></>,
  album: (c) => <><rect x="4" y="3" width="16" height="18" rx="3" fill={c} /><rect x="7" y="6" width="4.5" height="5" rx="1.2" fill="#1b1530" opacity=".55" /><rect x="12.5" y="6" width="4.5" height="5" rx="1.2" fill="#1b1530" opacity=".55" /><rect x="7" y="12.5" width="4.5" height="5" rx="1.2" fill="#1b1530" opacity=".55" /><rect x="12.5" y="12.5" width="4.5" height="5" rx="1.2" fill="#fff" opacity=".7" /></>,
  shop: (c) => <><path d="M3.5 9.5h17l-1.4 9.2a2 2 0 0 1-2 1.8H6.9a2 2 0 0 1-2-1.8z" fill={c} /><path d="M8 9.5V8a4 4 0 0 1 8 0v1.5" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="12" cy="14.5" r="2.2" fill="#1b1530" opacity=".5" /></>,
  friends: (c) => <><circle cx="8.5" cy="8.5" r="3.3" fill={c} /><circle cx="16" cy="9.5" r="2.8" fill={c} opacity=".75" /><path d="M2.5 19c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4z" fill={c} /><path d="M13.6 14.3c.7-.4 1.5-.6 2.4-.6 2.6 0 4.6 1.8 5.1 4.9h-5.6c-.3-1.7-1-3.1-1.9-4.3z" fill={c} opacity=".75" /></>,
};
const TAB_COLOR = { yard: '#58cc02', album: '#ce82ff', shop: '#ff9600', friends: '#1cb0f6' };
function TabBarPill({ tab, onTab }) {
  const { t } = useLang();
  const i = Math.max(0, TABS.indexOf(tab));
  return (
    <div style={{ position: 'relative', marginTop: 14, padding: 5, borderRadius: 18, background: '#17141f', display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
      <div style={{ position: 'absolute', top: 5, bottom: 5, left: `calc(5px + (100% - 10px) * ${i / TABS.length})`, width: `calc((100% - 10px) / ${TABS.length})`, borderRadius: 14, background: '#fff', boxShadow: '0 3px 0 rgba(0,0,0,.25)', transition: 'left .25s ease' }} />
      {TABS.map((id) => {
        const on = id === tab;
        return (
          <div key={id} onClick={() => onTab(id)} style={{ position: 'relative', height: 44, minWidth: 0, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', fontSize: 12.5, fontWeight: 900, color: on ? '#2a2440' : '#9a9aab', transition: 'color .2s' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" style={{ flex: 'none' }}>{TAB_ICON[id](on ? TAB_COLOR[id] : '#6f6f80')}</svg>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(id === 'yard' ? 'pw.tab.dog' : 'pw.tab.' + id)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- first visit: pick a starter ----------
function Starter({ onPick }) {
  const { t } = useLang();
  const [pick, setPick] = useState(STARTERS[0]);
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{t('pw.start.title')}</div>
          <div style={{ fontSize: 13.5, color: '#a3a3b3', marginTop: 6, lineHeight: 1.45 }}>{t('pw.start.sub')}</div>
        </div>
        <Stage height={270}><Dog2D dogId={pick} /></Stage>
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 750 }}>{dogName(t, pick)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
          {STARTERS.map((id) => (
            <div key={id} onClick={() => setPick(id)} style={{ borderRadius: 18, padding: '8px 4px 10px', cursor: 'pointer', background: pick === id ? 'rgba(139,109,255,.14)' : 'rgba(255,255,255,.035)', border: pick === id ? '2px solid #8b6dff' : '1px solid rgba(255,255,255,.08)', margin: pick === id ? 0 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DogThumb dogId={id} size={84} />
              <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginTop: 2 }}>{t('pw.breed.' + DOG_BY_ID[id].breed)}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 20 }} />
        <Button onClick={() => onPick(pick)} style={{ height: 52, fontSize: 16 }}>{t('pw.start.button', { name: dogName(t, pick) })}</Button>
        <div style={{ fontSize: 11.5, color: '#77778a', textAlign: 'center', marginTop: 10 }}>{t('pw.start.note')}</div>
      </div>
    </>
  );
}

// ---------- My dog: your favourite, big and alive, its chests and outfits ----------
// One dog on a stage in its rarity's bright colour: tap it to make it jump,
// Trick for a flip. Under it: its breed's versions (pick another to show),
// the chests as colour tiles, where it lives, its outfits.
function MyDogs({ pw, onOpenChest, onChances, onStudy, onShop, onAlbum }) {
  const { t } = useLang();
  const { state, update } = pw;
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const level = state.dogs[fav]?.level || 1;
  const [trick, setTrick] = useState(0);
  const [jump, setJump] = useState(0);
  const doTrick = () => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); };
  const owned = Object.keys(state.dogs).length;
  return (
    <>
      <div style={{ marginTop: 14 }}>
        <ColorStage rarity={DOG_BY_ID[fav].rarity} onTap={() => setJump((k) => k + 1)} onTrick={doTrick}>
          <Dog2D dogId={fav} worn={state.outfits.worn[fav]} trickKey={trick} happyKey={jump} />
        </ColorStage>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 900 }}>{dogName(t, fav)}</span>
        <RarityPill rarity={DOG_BY_ID[fav].rarity} solid />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6, fontSize: 13, fontWeight: 700, color: '#c9c9d6', alignItems: 'center' }}>
        <Stars level={level} size={15} />
        <span>⚡ {t('pw.power', { n: dogPower(fav, level) })}</span>
      </div>
      <DogStrip state={state} current={fav} onPick={(id) => update((s) => ({ ...s, favorite: id }))} onAlbum={onAlbum} />

      <Chests state={state} onOpenChest={onOpenChest} onChances={onChances} onStudy={onStudy} />
      <Places state={state} dogId={fav} update={update} />
      <Wardrobe state={state} dogId={fav} update={update} onShop={onShop} />

      {/* your collection as a slim bar; tap for the Album */}
      <div onClick={onAlbum} style={{ ...CARD_SLIM, cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 900 }}>🐾 {t('pw.dogsOf', { n: owned, total: DOGS.length })}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffd84d', whiteSpace: 'nowrap' }}>⭐ {collectionScore(state)}</span>
        </div>
        <div style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,.08)', marginTop: 9, overflow: 'hidden' }}>
          <div style={{ width: (owned / DOGS.length) * 100 + '%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ce82ff,#8b6dff)' }} />
        </div>
        {DOGS.length > owned && <div style={{ fontSize: 11.5, fontWeight: 800, color: '#8a8a99', marginTop: 6 }}>{t('pw.pack.hiding.' + pluralForm(DOGS.length - owned), { n: DOGS.length - owned })}</div>}
      </div>
    </>
  );
}

// The other versions of the same breed in a row under the big dog: tap one
// you have to make it your favourite; the ones not found yet look like in
// the album ("?"). "Album ›" switches to another breed.
function DogStrip({ state, current, onPick, onAlbum }) {
  const { t } = useLang();
  const breed = DOG_BY_ID[current]?.breed;
  if (!breed) return null;
  const all = breedDogs(breed);
  const have = all.filter((d) => state.dogs[d.id]).length;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 2px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#d9d9e6' }}>{t('pw.breed.' + breed)} <span style={{ color: '#8a8a99', fontWeight: 600 }}>{have}/{all.length}</span></div>
        <span onClick={onAlbum} style={{ fontSize: 12.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('pw.tab.album')} ›</span>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '6px -16px 0', padding: '4px 16px' }}>
        {all.map((d) => {
          const own = !!state.dogs[d.id];
          const on = d.id === current;
          return (
            <div key={d.id} onClick={own ? () => onPick(d.id) : undefined} style={{ flex: 'none', width: 56, height: 56, borderRadius: 16, position: 'relative', background: TILE[d.rarity], display: 'grid', placeItems: 'center', cursor: own ? 'pointer' : 'default', boxShadow: on ? '0 0 0 2.5px #08080c, 0 0 0 4.5px #8b6dff' : 'none', opacity: on ? 1 : own ? 0.9 : 0.7 }}>
              <DogThumb dogId={d.id} size={50} silhouette={!own} />
              {!own && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>?</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Chests: one bright tile per kind (small orange, silver blue, gold yellow,
// epic purple) with how many are waiting; tap a tile to open one. None at
// all: how to win one.
function Chests({ state, onOpenChest, onChances, onStudy }) {
  const { t } = useLang();
  const count = (type) => state.chests.filter((c) => c.type === type).length;
  const openType = (ty) => { const c = state.chests.find((x) => x.type === ty); if (c) onOpenChest(c.id); };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 2px 10px' }}>
        <div style={{ fontSize: 17, fontWeight: 900 }}>{t('pw.chests')}</div>
        <span onClick={onChances} style={{ fontSize: 12.5, fontWeight: 700, color: '#a58cff', cursor: 'pointer' }}>{t('pw.chances')}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {CHEST_ORDER.slice().reverse().map((ty) => {
          const n = count(ty);
          const [, base, shade] = CHEST_BRIGHT[ty];
          return (
            <div key={ty} onClick={n ? () => openType(ty) : undefined} style={{ borderRadius: 22, padding: '12px 12px 12px', marginBottom: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: n ? 'pointer' : 'default', ...(n ? { background: `linear-gradient(160deg, ${base}, ${shade})`, boxShadow: `0 5px 0 ${shade}` } : { background: '#1a1825', boxShadow: '0 5px 0 #0f0e17' }) }}>
              <ChestIcon type={ty} size={96} locked={!n} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, alignSelf: 'stretch', marginTop: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, color: n ? '#fff' : '#6f6f80', lineHeight: 1.15 }}>{t('pw.chest.' + ty)}</span>
                <span style={{ flex: 'none', fontSize: 14, fontWeight: 900, padding: '3px 10px', borderRadius: 99, background: n ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.05)', color: n ? '#fff' : '#4a4858' }}>×{n}</span>
              </div>
            </div>
          );
        })}
      </div>
      {!state.chests.length && (
        <>
          <div style={{ fontSize: 13, color: '#b9b9c8', textAlign: 'center', margin: '8px 10px 12px', lineHeight: 1.45 }}>{t('pw.noChests')}</div>
          <Chunky onClick={onStudy}>{t('pw.startSession')}</Chunky>
        </>
      )}
    </>
  );
}

// ---------- Album: every dog, "?" for the missing ones, breed sets ----------
// Colour counters on top; each dog you have on its rarity's bright colour
// (common green, rare blue, epic purple, legendary gold).
const CHIP = (on, pal = ['#e6bcff', '#ce82ff', '#a568cc']) => ({ flex: 'none', height: 32, padding: '0 13px', borderRadius: 11, display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', marginBottom: 3, ...(on ? { background: pal[1], boxShadow: `0 3px 0 ${pal[2]}`, color: '#fff' } : { background: '#1a1825', boxShadow: '0 3px 0 #0f0e17', color: '#b9b9c8' }) });
// The Album's top: your whole pack in one happy group photo (the favourite
// in the middle, the rarest next to it), how many you have, how many are
// still hiding, and your score.
function PackPhoto({ state, owned }) {
  const { t } = useLang();
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const rest = Object.keys(state.dogs).filter((id) => id !== fav && DOG_BY_ID[id])
    .sort((a, b) => RARITIES.indexOf(DOG_BY_ID[b].rarity) - RARITIES.indexOf(DOG_BY_ID[a].rarity)).slice(0, 8);
  // favourite in the middle, the others alternating right and left of it
  const left = rest.filter((_, i) => i % 2 === 1).reverse();
  const right = rest.filter((_, i) => i % 2 === 0);
  const row = [...left, fav, ...right].filter(Boolean);
  const hiding = DOGS.length - owned;
  const plural = (base, n) => t(base + '.' + pluralForm(n), { n });
  return (
    <div style={{ position: 'relative', marginTop: 6, marginBottom: 5, borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%, #ffe680 0, #ffc800 50%, #e5a900 100%)', boxShadow: '0 5px 0 #c08608' }}>
      {[[92, 9], [6, 50], [93, 46], [30, 44], [68, 47]].map(([x, y], i) => <span key={i} style={{ position: 'absolute', left: x + '%', top: y + '%', color: '#fff', opacity: 0.8 }}>✦</span>)}
      <div style={{ position: 'relative', padding: '14px 16px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '.1em', color: '#7a4d00' }}>{t('pw.pack.label').toUpperCase()}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.15)', lineHeight: 1.2 }}>{plural('pw.pack.title', owned)} 🎉</div>
      </div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 112, marginTop: 4 }}>
        {row.map((id, i) => {
          const isFav = id === fav;
          const size = isFav ? 100 : 66 + (i % 2) * 4;
          return (
            <div key={id} style={{ marginLeft: i ? -22 : 0, zIndex: isFav ? 20 : 10 - Math.abs(i - left.length), flex: 'none' }}>
              <DogThumb dogId={id} worn={state.outfits.worn[id]} size={size} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 12px', background: 'rgba(0,0,0,.14)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ height: 12, borderRadius: 99, background: 'rgba(255,255,255,.35)', overflow: 'hidden' }}>
            <div style={{ width: (owned / DOGS.length) * 100 + '%', height: '100%', borderRadius: 99, background: '#fff' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 5, color: '#fff', lineHeight: 1.3 }}>{hiding > 0 ? plural('pw.pack.hiding', hiding) : t('pw.pack.all')}</div>
        </div>
        <div style={{ flex: 'none', textAlign: 'center', padding: '5px 10px', borderRadius: 12, background: '#fff', color: '#c08608' }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>⭐ {collectionScore(state)}</div>
          <div style={{ fontSize: 10, fontWeight: 900 }}>{t('pw.score')}</div>
        </div>
      </div>
    </div>
  );
}
function Album({ state, onShowDog, onChances }) {
  const { t } = useLang();
  const [breed, setBreed] = useState('all');
  const list = DOGS.filter((d) => breed === 'all' || d.breed === breed);
  const owned = Object.keys(state.dogs).length;
  return (
    <>
      <PackPhoto state={state} owned={owned} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <span onClick={onChances} style={{ fontSize: 12.5, fontWeight: 700, color: '#a58cff', cursor: 'pointer' }}>{t('pw.chances')}</span>
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '6px -16px 0', padding: '0 16px 2px' }}>
        {['all', ...BREED_IDS].map((b) => (
          <div key={b} onClick={() => setBreed(b)} style={CHIP(breed === b)}>{b === 'all' ? t('pw.all') : t('pw.breed.' + b)}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
        {list.map((d) => {
          const have = state.dogs[d.id];
          const [light, base, shade] = RARITY_BRIGHT[d.rarity];
          return have ? (
            <div key={d.id} onClick={() => onShowDog(d.id)} style={{ borderRadius: 18, padding: '6px 4px 8px', marginBottom: 4, background: `linear-gradient(160deg, ${light}, ${base})`, boxShadow: `0 4px 0 ${shade}`, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <DogThumb dogId={d.id} worn={state.outfits.worn[d.id]} size={84} />
              <div style={{ fontSize: 11, fontWeight: 900, textAlign: 'center', lineHeight: 1.2, minHeight: 27, display: 'flex', alignItems: 'center', padding: '0 2px', color: '#fff', textShadow: '0 1px 1px rgba(0,0,0,.25)' }}>{dogName(t, d.id)}</div>
              <Stars level={have.level} size={11} dim="rgba(255,255,255,.4)" />
            </div>
          ) : (
            <div key={d.id} style={{ borderRadius: 18, padding: '6px 4px 8px', marginBottom: 4, background: '#1a1825', boxShadow: '0 4px 0 #0f0e17', border: '2px dashed rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <DogThumb dogId={d.id} silhouette size={80} />
                <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 900, color: '#6f6f80' }}>?</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, minHeight: 27, display: 'flex', alignItems: 'center', color: '#5f5f72' }}>???</div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: base }} />
            </div>
          );
        })}
      </div>
      <Card title={t('pw.sets')} style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: -6, marginBottom: 6 }}>{t('pw.setsSub')}</div>
        {BREED_IDS.map((b, i) => {
          const all = breedDogs(b);
          const have = all.filter((d) => state.dogs[d.id]).length;
          const done = state.sets.includes(b);
          return (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
              <DogThumb dogId={all[0].id} silhouette={!have} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{t('pw.breed.' + b)} <span style={{ color: '#8a8a99', fontWeight: 700 }}>{have}/{all.length}</span></div>
                <div style={{ marginTop: 6 }}><ThickBar pct={(have / all.length) * 100} done={done} height={10} /></div>
              </div>
              {done ? <span style={{ fontSize: 13, fontWeight: 900, color: '#58cc02' }}>✓</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 800, color: '#ffd84d' }}><ChestIcon type="gold" size={24} />+200</span>}
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ---------- Shop: today's outfits and chests, for coins only ----------
const SET_PAL = { wizard: ['#a58cff', '#7c5cff', '#5b3ee0'], hero: ['#ff8a8a', '#ff4b4b', '#d62828'], pirate: ['#6fb4ff', '#2b7fe0', '#1d5fb0'], chef: ['#ffc06b', '#ff9600', '#d97a00'] };
const GOLD = ['#ffe680', '#ffc800', '#e5a900'];
function Shop({ pw }) {
  const { t } = useLang();
  const { state, update } = pw;
  const today = localDateKey();
  const offers = shopOffers(state, today);
  const [msg, setMsg] = useState(null);
  const [reveal, setReveal] = useState(null); // what was just bought (ShopReveal); chests open by themselves
  const buy = (fn, text, item) => {
    const next = fn(state);
    if (!next) { setMsg(t('pw.shop.notEnough')); return; }
    update(() => next);
    setMsg(item ? null : text);
    if (item) setReveal(item);
  };
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
        <div style={{ fontSize: 17, fontWeight: 900 }}>{t('pw.shop.title')}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#ff9600', whiteSpace: 'nowrap' }}>⏱ {t('pw.resetsIn', { n: hoursToMidnight() })}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 12 }}>
        {offers.map((o) => {
          const own = state.outfits.owned.includes(o.id);
          const full = OUTFIT_BY_ID[o.id].price;
          return (
            <div key={o.id} style={{ position: 'relative', borderRadius: 20, padding: '12px 10px', marginBottom: 4, background: '#17141f', border: o.deal ? '2px solid #ff4b4b' : '2px solid rgba(255,255,255,.06)', boxShadow: o.deal ? '0 4px 0 #ea2b2b' : '0 4px 0 #0f0e17', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {o.deal && <span style={{ position: 'absolute', top: -11, right: 10, fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 8, background: '#ff4b4b', boxShadow: '0 2px 0 #ea2b2b', color: '#fff' }}>−50%</span>}
              <div style={{ width: 78, height: 78, borderRadius: 22, background: o.deal ? '#ffe3e3' : '#ddeeff', display: 'grid', placeItems: 'center' }}><OutfitPic id={o.id} size={58} /></div>
              <div style={{ fontSize: 13.5, fontWeight: 900, marginTop: 6, textAlign: 'center' }}>{t('pw.outfit.' + o.id)}</div>
              <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 1 }}>{t('pw.slot.' + OUTFIT_BY_ID[o.id].slot)}</div>
              <div style={{ alignSelf: 'stretch', marginTop: 10 }}>
                {own
                  ? <div style={{ height: 40, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, color: '#58cc02', background: 'rgba(88,204,2,.1)' }}>✓ {t('pw.owned')}</div>
                  : <Chunky disabled={state.coins < o.price} style={{ height: 40, fontSize: 14, padding: 0, gap: 5 }} onClick={() => buy((s) => buyOutfit(s, today, o.id), t('pw.shop.got', { name: t('pw.outfit.' + o.id) }), { kind: 'outfit', id: o.id })}>{o.deal && <s style={{ opacity: 0.7 }}>{full}</s>}<CoinIcon size={15} />{o.price}</Chunky>}
              </div>
            </div>
          );
        })}
      </div>
      <OutfitSets state={state} today={today} buy={buy} update={update} />
      <div style={{ fontSize: 17, fontWeight: 900, marginTop: 22 }}>{t('pw.chests')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
        {['small', 'silver'].map((type) => {
          const [, base, shade] = CHEST_BRIGHT[type];
          return (
            <div key={type} style={{ borderRadius: 22, padding: 12, marginBottom: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', background: `linear-gradient(160deg, ${base}, ${shade})`, boxShadow: `0 5px 0 ${shade}` }}>
              <ChestIcon type={type} size={88} />
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fff', marginTop: 4 }}>{t('pw.chest.' + type)}</div>
              <div style={{ alignSelf: 'stretch', marginTop: 8 }}>
                <Chunky pal={['#fff', '#fff', 'rgba(0,0,0,.2)']} text={shade} disabled={state.coins < CHEST_PRICE[type]} style={{ height: 40, fontSize: 14, padding: 0, gap: 5 }} onClick={() => buy((s) => buyChest(s, type), t('pw.shop.gotChest'))}><CoinIcon size={15} />{CHEST_PRICE[type]}</Chunky>
              </div>
            </div>
          );
        })}
      </div>
      {msg && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#c9baff', textAlign: 'center' }}>{msg}</div>}
      <div style={{ fontSize: 11.5, color: '#77778a', textAlign: 'center', marginTop: 16, lineHeight: 1.45 }}>{t('pw.shop.note')}</div>
      {reveal && <ShopReveal key={reveal.kind + reveal.id} pw={pw} item={reveal} onClose={() => setReveal(null)} />}
    </>
  );
}

// Full outfit sets, each on its own colour: the favourite dog wearing it,
// its parts (buy one by one) and the whole set for 25% less; once owned,
// put it all on at once.
function OutfitSets({ state, today, buy, update }) {
  const { t } = useLang();
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const wearingSet = fullSetOn(state, fav);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
        <span style={{ fontSize: 17, fontWeight: 900 }}>{t('pw.outfitSets')}</span>
        <span style={{ fontSize: 11, fontWeight: 900, padding: '3px 7px', borderRadius: 7, background: '#ff9600', boxShadow: '0 2px 0 #e08500', color: '#fff' }}>−25%</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 4, lineHeight: 1.45 }}>{t('pw.outfitSetsSub')}</div>
      {OUTFIT_SETS.map((set) => {
        const owned = set.parts.filter((p) => state.outfits.owned.includes(p));
        const all = owned.length === set.parts.length;
        const price = setPrice(state, set.id);
        const full = set.parts.filter((p) => !owned.includes(p)).reduce((a, p) => a + OUTFIT_BY_ID[p].price, 0);
        const worn = Object.fromEntries(set.parts.map((p) => [OUTFIT_BY_ID[p].slot, p]));
        const [light, base, shade] = SET_PAL[set.id] || SET_PAL.wizard;
        return (
          <div key={set.id} style={{ marginTop: 12, marginBottom: 5, borderRadius: 22, padding: 12, display: 'flex', gap: 12, alignItems: 'center', color: '#fff', background: `linear-gradient(160deg, ${light}, ${base} 55%, ${shade})`, boxShadow: `0 5px 0 ${shade}` }}>
            <div style={{ width: 96, height: 96, borderRadius: 18, background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <DogThumb dogId={fav} worn={worn} size={92} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{t('pw.set.' + set.id)}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                {set.parts.map((p) => {
                  const own = owned.includes(p);
                  return (
                    <div key={p} onClick={own ? undefined : () => buy((s) => buyOutfit(s, today, p), t('pw.shop.got', { name: t('pw.outfit.' + p) }), { kind: 'outfit', id: p })} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: own ? 'default' : 'pointer' }}>
                      <div style={{ width: '100%', height: 40, borderRadius: 11, background: own ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center' }}>
                        <OutfitPic id={p} size={32} style={own ? undefined : { opacity: 0.6 }} />
                      </div>
                      {own
                        ? <span style={{ fontSize: 10.5, fontWeight: 900 }}>✓</span>
                        : <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 900 }}><CoinIcon size={11} />{OUTFIT_BY_ID[p].price}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8 }}>
                {!all && (
                  <Chunky pal={GOLD} text="#5a3d00" disabled={state.coins < price} style={{ height: 38, fontSize: 12.5, padding: '0 8px', gap: 5, letterSpacing: '.03em' }} onClick={() => buy((s) => buySet(s, set.id), t('pw.shop.got', { name: t('pw.set.' + set.id) }), { kind: 'set', id: set.id })}>
                    {t('pw.buySet')} · <s style={{ opacity: 0.6 }}>{full}</s> <CoinIcon size={14} /> {price}
                  </Chunky>
                )}
                {all && (wearingSet === set.id
                  ? <div style={{ height: 38, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, background: 'rgba(255,255,255,.22)' }}>✓ {t('pw.wearing')}</div>
                  : <Chunky pal={['#fff', '#fff', 'rgba(0,0,0,.2)']} text={shade} style={{ height: 38, fontSize: 13 }} onClick={() => update((s) => wearSet(s, fav, set.id))}>{t('pw.wearSet')}</Chunky>)}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ---------- Friends: coming soon ----------
function Friends({ state }) {
  const { t } = useLang();
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : 'pug-fawn';
  const others = Object.keys(state.dogs).filter((id) => id !== fav && DOG_BY_ID[id]);
  const left = others[0] || 'corgi-red';
  const right = others[1] || 'husky-grey';
  const rows = [['🤝', 'pw.friends.f1', ['#7fd6ff', '#1cb0f6', '#1899d6']], ['🏆', 'pw.friends.f2', GOLD], ['🖐️', 'pw.friends.f3', ['#ffc06b', '#ff9600', '#e08500']]];
  return (
    <>
      <div style={{ position: 'relative', height: 230, marginTop: 14, marginBottom: 5, borderRadius: 28, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #9be35a 0, #58cc02 50%, #46a302 100%)', boxShadow: '0 5px 0 #3e8f00' }}>
        {[[8, 14], [88, 12], [20, 78], [80, 74]].map(([x, y], i) => <span key={i} style={{ position: 'absolute', left: x + '%', top: y + '%', color: '#fff', opacity: 0.75 }}>✦</span>)}
        <div style={{ position: 'absolute', left: 12, bottom: 10 }}><DogThumb dogId={left} worn={state.outfits.worn[left]} size={112} /></div>
        <div style={{ position: 'absolute', left: '50%', bottom: 14, marginLeft: -76 }}><DogThumb dogId={fav} worn={state.outfits.worn[fav]} size={152} /></div>
        <div style={{ position: 'absolute', right: 12, bottom: 10 }}><DogThumb dogId={right} worn={state.outfits.worn[right]} size={112} /></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 23, fontWeight: 900 }}>{t('pw.friends.head')}</div>
        <div style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, fontWeight: 900, letterSpacing: '.1em', color: '#fff', padding: '5px 12px', borderRadius: 10, background: '#ce82ff', boxShadow: '0 3px 0 #a568cc' }}>{t('pw.soon').toUpperCase()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {rows.map(([e, k, pal]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, marginBottom: 4, background: '#17141f', boxShadow: '0 4px 0 #0f0e17' }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, flex: 'none', display: 'grid', placeItems: 'center', fontSize: 20, background: pal[1], boxShadow: `0 3px 0 ${pal[2]}` }}>{e}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t(k)}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: '#8a8a99', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>{t('pw.friends.sub')}</div>
    </>
  );
}
