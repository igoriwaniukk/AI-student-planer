import { useEffect, useState } from 'react';
import { AppShellPortal, BackButton } from '../ui';
import { useLang } from '../../lib/useLang';
import { localDateKey } from '../../lib/plannerLogic';
import { DOGS, DOG_BY_ID, BREED_IDS, STARTERS, OUTFIT_BY_ID, OUTFIT_SETS, RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
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
import DogShowcase, { Places } from './DogShowcase';
import { dogName } from './names';
import { Card, RarityPill, Stars, Button, CoinPill, Stage, Chunky } from './bits';
import { SparkleIcon } from './icons';
import { PURPLE, CARD, CHEST_BRIGHT, RARITY_BRIGHT } from './theme';

// The dog collection game. Studying earns chests, chests hold dogs (and
// coins, outfits, streak freezes).
const TABS = ['yard', 'album', 'shop', 'friends'];
const CHEST_ORDER = ['epic', 'gold', 'silver', 'small'];
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
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '14px -16px 4px', padding: '0 16px 2px' }}>
            {TABS.map((id) => (
              <div key={id} onClick={() => setTab(id)} style={{ flex: 'none', height: 36, padding: '0 15px', borderRadius: 12, display: 'flex', alignItems: 'center', fontSize: 13.5, fontWeight: 900, cursor: 'pointer', marginBottom: 3, ...(tab === id ? { background: '#1cb0f6', boxShadow: '0 3px 0 #1899d6', color: '#fff' } : { background: '#1a1825', boxShadow: '0 3px 0 #0f0e17', color: '#b9b9c8' }) }}>
                {t(id === 'yard' ? 'pw.tab.dog' : 'pw.tab.' + id)}
              </div>
            ))}
          </div>
          {tab === 'yard' && <MyDogs pw={pw} onOpenChest={setOpening} onChances={() => setChances(true)} onStudy={onStudy} onShop={() => setTab('shop')} onAlbum={() => setTab('album')} />}
          {tab === 'album' && <Album state={state} onShowDog={setShowDog} onChances={() => setChances(true)} />}
          {tab === 'shop' && <Shop pw={pw} />}
          {tab === 'friends' && <Friends />}
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
  const [light, base, shade] = RARITY_BRIGHT[DOG_BY_ID[fav].rarity];
  return (
    <>
      <div onClick={() => setJump((k) => k + 1)} style={{ position: 'relative', marginTop: 14, height: 300, borderRadius: 28, overflow: 'hidden', cursor: 'pointer', background: `radial-gradient(circle at 50% 46%, ${light} 0, ${base} 48%, ${shade} 100%)`, boxShadow: `0 5px 0 ${shade}`, marginBottom: 5 }}>
        {[[8, 12], [86, 18], [14, 76], [84, 72], [48, 7]].map(([x, y], i) => (
          <span key={i} style={{ position: 'absolute', left: x + '%', top: y + '%', color: '#fff', fontSize: 14, opacity: 0.75 }}>✦</span>
        ))}
        <div style={{ position: 'absolute', left: '50%', bottom: 22, width: 190, height: 22, marginLeft: -95, borderRadius: '50%', background: 'rgba(0,0,0,.16)' }} />
        <div style={{ position: 'absolute', inset: '6px 40px 8px' }}><Dog2D dogId={fav} worn={state.outfits.worn[fav]} trickKey={trick} happyKey={jump} /></div>
        <div onClick={(e) => { e.stopPropagation(); doTrick(); }} style={{ position: 'absolute', right: 14, bottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffc800', boxShadow: '0 4px 0 #e5a900', display: 'grid', placeItems: 'center' }}><SparkleIcon size={24} /></div>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{t('pw.trick')}</span>
        </div>
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

      <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#a3a3b3' }}>{t('pw.collection')}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{t('pw.dogsOf', { n: owned, total: DOGS.length })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#a3a3b3' }}>{t('pw.score')}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3, color: '#c9baff' }}>{collectionScore(state)}</div>
        </div>
      </Card>
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
function Album({ state, onShowDog, onChances }) {
  const { t } = useLang();
  const [breed, setBreed] = useState('all');
  const list = DOGS.filter((d) => breed === 'all' || d.breed === breed);
  const owned = Object.keys(state.dogs).length;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ fontSize: 13.5, color: '#b9b9c8' }}>{t('pw.dogsOf', { n: owned, total: DOGS.length })} · {t('pw.score')} <b style={{ color: '#c9baff' }}>{collectionScore(state)}</b></div>
        <span onClick={onChances} style={{ fontSize: 12.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('pw.chances')}</span>
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '12px -16px 0', padding: '0 16px 2px' }}>
        {['all', ...BREED_IDS].map((b) => (
          <div key={b} onClick={() => setBreed(b)} style={{ flex: 'none', height: 32, padding: '0 13px', borderRadius: 99, display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: breed === b ? '#8b6dff' : 'rgba(255,255,255,.06)', color: breed === b ? '#fff' : '#b9b9c8' }}>
            {b === 'all' ? t('pw.all') : t('pw.breed.' + b)}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginTop: 12 }}>
        {list.map((d) => {
          const have = state.dogs[d.id];
          const c = RARITY_COLOR[d.rarity];
          return (
            <div key={d.id} onClick={have ? () => onShowDog(d.id) : undefined} style={{ borderRadius: 16, padding: '6px 4px 9px', background: TILE[d.rarity], opacity: have ? 1 : 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: have ? 'pointer' : 'default', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <DogThumb dogId={d.id} silhouette={!have} size={84} />
                {!have && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 900, color: '#fff' }}>?</span>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 750, textAlign: 'center', lineHeight: 1.25, minHeight: 28, display: 'flex', alignItems: 'center', padding: '0 2px', color: '#2a2440' }}>{have ? dogName(t, d.id) : '???'}</div>
              {have ? <Stars level={have.level} size={11} dim="#8a8aa6" /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, marginTop: 3 }} />}
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
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('pw.breed.' + b)} <span style={{ color: '#8a8a99', fontWeight: 600 }}>{have}/{all.length}</span></div>
                <div style={{ height: 5, borderRadius: 9, background: 'rgba(255,255,255,.07)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: (have / all.length) * 100 + '%', height: '100%', background: done ? '#35d07f' : PURPLE }} />
                </div>
              </div>
              {done ? <span style={{ fontSize: 12, fontWeight: 700, color: '#35d07f' }}>✓</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#b9b9c8' }}><ChestIcon type="gold" size={22} />+200</span>}
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ---------- Shop: today's outfits and chests, for coins only ----------
function Shop({ pw }) {
  const { t } = useLang();
  const { state, update } = pw;
  const today = localDateKey();
  const offers = shopOffers(state, today);
  const [msg, setMsg] = useState(null);
  const buy = (fn, text) => {
    const next = fn(state);
    if (!next) { setMsg(t('pw.shop.notEnough')); return; }
    update(() => next);
    setMsg(text);
  };
  return (
    <>
      <div style={{ fontSize: 13, color: '#a3a3b3', marginTop: 2 }}>{t('pw.shop.today')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 10 }}>
        {offers.map((o) => {
          const own = state.outfits.owned.includes(o.id);
          const full = OUTFIT_BY_ID[o.id].price;
          return (
            <div key={o.id} style={{ borderRadius: 18, padding: 12, background: 'rgba(255,255,255,.035)', border: o.deal ? '1.5px solid rgba(245,165,36,.6)' : '1px solid rgba(255,255,255,.07)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {o.deal && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: '#f5a524', color: '#2a1300' }}>−50%</span>}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#c9d8f5', display: 'grid', placeItems: 'center', marginTop: 4 }}><OutfitPic id={o.id} size={54} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, textAlign: 'center' }}>{t('pw.outfit.' + o.id)}</div>
              <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 2 }}>{t('pw.slot.' + OUTFIT_BY_ID[o.id].slot)}</div>
              <Button
                ghost={own} disabled={own || state.coins < o.price} style={{ height: 36, marginTop: 10, alignSelf: 'stretch', fontSize: 13 }}
                onClick={() => buy((s) => buyOutfit(s, today, o.id), t('pw.shop.got', { name: t('pw.outfit.' + o.id) }))}
              >
                {own ? t('pw.owned') : <>{o.deal && <s style={{ opacity: 0.6, fontWeight: 600 }}>{full}</s>} <CoinIcon size={14} /> {o.price}</>}
              </Button>
            </div>
          );
        })}
      </div>
      <OutfitSets state={state} today={today} buy={buy} update={update} />
      <Card title={t('pw.chests')} style={{ marginTop: 16 }}>
        {['small', 'silver'].map((type, i) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
            <ChestIcon type={type} size={44} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{t('pw.chest.' + type)}</div>
            <Button disabled={state.coins < CHEST_PRICE[type]} style={{ height: 36, fontSize: 13 }} onClick={() => buy((s) => buyChest(s, type), t('pw.shop.gotChest'))}><CoinIcon size={14} /> {CHEST_PRICE[type]}</Button>
          </div>
        ))}
      </Card>
      {msg && <div style={{ marginTop: 12, fontSize: 13, color: '#c9baff', textAlign: 'center' }}>{msg}</div>}
      <div style={{ fontSize: 11.5, color: '#77778a', textAlign: 'center', marginTop: 16, lineHeight: 1.45 }}>{t('pw.shop.note')}</div>
    </>
  );
}

// Full outfit sets: the favourite dog wearing it, its parts (buy one by
// one) and the whole set for 25% less; once owned, put it all on at once.
function OutfitSets({ state, today, buy, update }) {
  const { t } = useLang();
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const wearingSet = fullSetOn(state, fav);
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 750, marginTop: 20 }}>{t('pw.outfitSets')}</div>
      <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 4, lineHeight: 1.45 }}>{t('pw.outfitSetsSub')}</div>
      {OUTFIT_SETS.map((set) => {
        const owned = set.parts.filter((p) => state.outfits.owned.includes(p));
        const all = owned.length === set.parts.length;
        const price = setPrice(state, set.id);
        const full = set.parts.filter((p) => !owned.includes(p)).reduce((a, p) => a + OUTFIT_BY_ID[p].price, 0);
        const worn = Object.fromEntries(set.parts.map((p) => [OUTFIT_BY_ID[p].slot, p]));
        return (
          <div key={set.id} style={{ ...CARD, marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 16, background: '#c9d8f5', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <DogThumb dogId={fav} worn={worn} size={90} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{t('pw.set.' + set.id)}</span>
                {!all && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: '#f5a524', color: '#2a1300' }}>−25%</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {set.parts.map((p) => {
                  const own = owned.includes(p);
                  return (
                    <div key={p} onClick={own ? undefined : () => buy((s) => buyOutfit(s, today, p), t('pw.shop.got', { name: t('pw.outfit.' + p) }))} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: own ? 'default' : 'pointer' }}>
                      <div style={{ width: '100%', height: 40, borderRadius: 11, background: own ? '#c9d8f5' : 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center' }}>
                        <OutfitPic id={p} size={34} style={own ? undefined : { filter: 'grayscale(1)', opacity: 0.45 }} />
                      </div>
                      {own
                        ? <span style={{ fontSize: 10.5, fontWeight: 800, color: '#35d07f' }}>✓</span>
                        : <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 800, color: '#ffd27a' }}><CoinIcon size={11} />{OUTFIT_BY_ID[p].price}</span>}
                    </div>
                  );
                })}
              </div>
              {!all && (
                <Button disabled={state.coins < price} style={{ height: 36, marginTop: 8, fontSize: 13 }} onClick={() => buy((s) => buySet(s, set.id), t('pw.shop.got', { name: t('pw.set.' + set.id) }))}>
                  {t('pw.buySet')} · <s style={{ opacity: 0.6, fontWeight: 600 }}>{full}</s> <CoinIcon size={14} /> {price}
                </Button>
              )}
              {all && (wearingSet === set.id
                ? <div style={{ height: 36, marginTop: 8, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#7fe3ad', background: 'rgba(53,208,127,.1)', border: '1px solid rgba(53,208,127,.35)' }}>✓ {t('pw.wearing')}</div>
                : <Button ghost style={{ height: 36, marginTop: 8, fontSize: 13 }} onClick={() => update((s) => wearSet(s, fav, set.id))}>{t('pw.wearSet')}</Button>)}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Friends() {
  const { t } = useLang();
  return (
    <div style={{ textAlign: 'center', padding: '40px 12px 0' }}>
      <div style={{ fontSize: 52 }}>👥</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>{t('pw.friends.title')}</div>
      <div style={{ fontSize: 13.5, color: '#a3a3b3', marginTop: 8, lineHeight: 1.5 }}>{t('pw.friends.sub')}</div>
      <div style={{ display: 'inline-block', marginTop: 18, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', padding: '5px 12px', borderRadius: 99, background: 'rgba(139,109,255,.15)', color: '#c9baff' }}>{t('pw.soon')}</div>
    </div>
  );
}
