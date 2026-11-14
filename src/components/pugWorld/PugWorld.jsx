import { useEffect, useState } from 'react';
import { AppShellPortal } from '../ui';
import { useLang } from '../../lib/useLang';
import { localDateKey } from '../../lib/plannerLogic';
import { DOGS, DOG_BY_ID, BREED_IDS, STARTERS, OUTFIT_BY_ID, OUTFIT_ICON, RARITY_COLOR, RARITIES } from '../../lib/pugWorld/catalog.js';
import {
  CALENDAR, CHEST_PRICE, MISSIONS, MISSION_COINS, canClaimCalendar, claimCalendar, collectionScore, dogPower, bumpMission,
  shopOffers, buyOutfit, buyChest, breedDogs, chooseStarter,
} from '../../lib/pugWorld/logic.js';
import Dog2D from './Dog2D';
import DogThumb from './DogThumb';
import ChestIcon from './Chest';
import { CHEST_COLORS } from './theme';
import ChestOpen, { ChancesSheet } from './ChestOpen';
import DogShowcase from './DogShowcase';
import { dogName } from './names';
import { Card, RarityPill, Stars, Button, TopBar, CoinPill, Stage } from './bits';
import { PURPLE, CARD } from './theme';

// Pug World: the dog collection game. Studying earns chests, chests hold
// dogs (and coins, sometimes outfits). Full screen over the app with its own
// tabs: My dogs · Album · Shop · Friends (coming next).
// Line icons like the app's own tab bar (no emoji).
const TABS = [
  ['dogs', (c) => (
    <>
      <ellipse cx="11" cy="14.4" rx="4.4" ry="3.6" stroke={c} strokeWidth="1.5" />
      <circle cx="5.6" cy="9.4" r="1.7" stroke={c} strokeWidth="1.5" />
      <circle cx="9" cy="6" r="1.8" stroke={c} strokeWidth="1.5" />
      <circle cx="13" cy="6" r="1.8" stroke={c} strokeWidth="1.5" />
      <circle cx="16.4" cy="9.4" r="1.7" stroke={c} strokeWidth="1.5" />
    </>
  )],
  ['album', (c) => <path d="M11 5.8C9 4.4 6 4 3.2 4.6v12.2c2.8-.6 5.8-.2 7.8 1.2 2-1.4 5-1.8 7.8-1.2V4.6C16 4 13 4.4 11 5.8zM11 5.8V18" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />],
  ['shop', (c) => (
    <>
      <path d="M4.4 7.6h13.2l-1 10a1.6 1.6 0 01-1.6 1.4H7a1.6 1.6 0 01-1.6-1.4l-1-10z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 9.8V6.6a3 3 0 016 0v3.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )],
  ['friends', (c) => (
    <>
      <circle cx="8.4" cy="7.8" r="2.9" stroke={c} strokeWidth="1.5" />
      <path d="M3 18.2a5.4 5.4 0 0110.8 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.4" cy="8.6" r="2.3" stroke={c} strokeWidth="1.5" />
      <path d="M15.2 13.2a4.4 4.4 0 014.2 4.6" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )],
];
const CHEST_ORDER = ['epic', 'gold', 'silver', 'small'];
// Album cards: light, in the rarity's colour (the dogs are stickers).
const TILE = { common: '#c9d8f5', rare: '#bfe0ff', epic: '#dccbff', legendary: '#ffe7a8' };

export default function PugWorld({ pw, onClose }) {
  const { t } = useLang();
  const { state, update } = pw;
  const [tab, setTab] = useState(pw.open && pw.open !== true ? pw.open : 'dogs');
  const [opening, setOpening] = useState(null);
  const [showDog, setShowDog] = useState(null);
  const [chances, setChances] = useState(false);
  const overlay = opening || showDog || chances;

  useEffect(() => { if (tab === 'album' && pw.started) update((s) => bumpMission(s, 'album')); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShellPortal>
      <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: '#08080c', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', animation: 'fadeUp .25s ease both' }}>
        {!pw.started ? (
          <Starter onClose={onClose} onPick={(id) => update((s) => chooseStarter(s, id))} />
        ) : (
          <>
            <TopBar title={t('pw.tab.' + tab)} onBack={onClose} right={<CoinPill n={state.coins} />} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 28px' }}>
              {tab === 'dogs' && <MyDogs pw={pw} hideStage={!!overlay} onOpenChest={setOpening} onShowDog={setShowDog} onChances={() => setChances(true)} onStudy={onClose} />}
              {tab === 'album' && <Album state={state} onShowDog={setShowDog} onChances={() => setChances(true)} />}
              {tab === 'shop' && <Shop pw={pw} />}
              {tab === 'friends' && <Friends />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(12,12,18,.96)', paddingBottom: 'var(--safe-bottom)' }}>
              {TABS.map(([id, icon]) => {
                const c = tab === id ? '#a58cff' : '#7a7a8a';
                return (
                  <div key={id} onClick={() => setTab(id)} style={{ position: 'relative', padding: '10px 0 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <svg width="21" height="21" viewBox="0 0 22 22" fill="none">{icon(c)}</svg>
                    <span style={{ fontSize: 10.5, fontWeight: 650, color: c }}>{t('pw.tab.' + id)}</span>
                    {tab === id && <span style={{ position: 'absolute', bottom: 3, width: 22, height: 3, borderRadius: 99, background: PURPLE }} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {opening && <ChestOpen key={opening} pw={pw} chestId={opening} onNext={setOpening} onClose={() => setOpening(null)} />}
        {showDog && <DogShowcase pw={pw} dogId={showDog} onClose={() => setShowDog(null)} />}
        {chances && <ChancesSheet onClose={() => setChances(false)} />}
      </div>
    </AppShellPortal>
  );
}

// ---------- first visit: pick a starter ----------
function Starter({ onPick, onClose }) {
  const { t } = useLang();
  const [pick, setPick] = useState(STARTERS[0]);
  return (
    <>
      <TopBar title={t('pw.title')} onBack={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column' }}>
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

// ---------- My dogs: the favourite on stage, chests, missions, calendar ----------
function MyDogs({ pw, hideStage, onOpenChest, onShowDog, onChances, onStudy }) {
  const { t } = useLang();
  const { state, update } = pw;
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const level = state.dogs[fav]?.level || 1;
  const [trick, setTrick] = useState(0);
  const owned = Object.keys(state.dogs).length;
  const today = localDateKey();
  return (
    <>
      <Stage height={280}>{!hideStage && <Dog2D dogId={fav} worn={state.outfits.worn[fav]} trickKey={trick} />}</Stage>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 19, fontWeight: 800 }}>{dogName(t, fav)}</span>
        <RarityPill rarity={DOG_BY_ID[fav].rarity} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 6, fontSize: 12.5, color: '#a3a3b3', alignItems: 'center' }}>
        <Stars level={level} />
        <span>⚡ {t('pw.power', { n: dogPower(fav, level) })}</span>
      </div>
      <DogStrip state={state} current={fav} onPick={(id) => update((s) => ({ ...s, favorite: id }))} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button ghost style={{ flex: 1 }} onClick={() => { setTrick((k) => k + 1); update((s) => bumpMission(s, 'trick')); }}>✨ {t('pw.trick')}</Button>
        <Button ghost style={{ flex: 1 }} onClick={() => onShowDog(fav)}>👕 {t('pw.dressUp')}</Button>
      </div>

      <Chests state={state} onOpenChest={onOpenChest} onChances={onChances} onStudy={onStudy} />

      <Missions state={state} />
      <Calendar state={state} today={today} onClaim={() => update((s) => claimCalendar(s, today).state)} />

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

// All your dogs in a row under the big one: tap one to make it your
// favourite (the dog on the stage and on Home).
function DogStrip({ state, current, onPick }) {
  const ids = DOGS.filter((d) => state.dogs[d.id]).sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity)).map((d) => d.id);
  if (ids.length < 2) return null;
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '14px -16px 0', padding: '4px 16px' }}>
      {ids.map((id) => {
        const on = id === current;
        return (
          <div key={id} onClick={() => onPick(id)} style={{ flex: 'none', width: 56, height: 56, borderRadius: 16, background: TILE[DOG_BY_ID[id].rarity], display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: on ? '0 0 0 2.5px #08080c, 0 0 0 4.5px #8b6dff' : 'none', opacity: on ? 1 : 0.85 }}>
            <DogThumb dogId={id} size={50} />
          </div>
        );
      })}
    </div>
  );
}

// Chests: a big card for the best chest waiting (or, with none, how to win
// one), then how many of each kind there are.
function Chests({ state, onOpenChest, onChances, onStudy }) {
  const { t } = useLang();
  const count = (type) => state.chests.filter((c) => c.type === type).length;
  const total = state.chests.length;
  const best = CHEST_ORDER.find((type) => count(type)) || null;
  const type = best || 'small';
  const col = CHEST_COLORS[type];
  const openType = (ty) => { const c = state.chests.find((x) => x.type === ty); if (c) onOpenChest(c.id); };
  const R = 48, LEN = 2 * Math.PI * R;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 2px 10px' }}>
        <div style={{ fontSize: 15, fontWeight: 750 }}>{t('pw.chests')}</div>
        <span onClick={onChances} style={{ fontSize: 12.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('pw.chances')}</span>
      </div>
      <div style={{ padding: 16, borderRadius: 20, border: '1px solid rgba(139,109,255,.35)', background: 'radial-gradient(circle at 22% 45%, rgba(139,109,255,.3), transparent 62%), #100d1c', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 112, height: 112, flex: 'none', display: 'grid', placeItems: 'center' }}>
          <svg width="112" height="112" viewBox="0 0 112 112" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
            {best && <circle cx="56" cy="56" r={R} fill="none" stroke={col.lid} strokeWidth="6" strokeDasharray={`${LEN} ${LEN}`} opacity=".9" />}
            {!best && <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(165,140,255,.45)" strokeWidth="2" strokeDasharray="4 7" />}
          </svg>
          <ChestIcon type={type} size={70} locked={!best} />
          {total > 1 && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#ff5f6d' }}>{total}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: '#c9baff' }}>{t(best ? 'pw.readyToOpen' : 'pw.nextChest')}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{t('pw.chest.' + type)}</div>
          <div style={{ fontSize: 12.5, color: '#b9b9c8', marginTop: 4, lineHeight: 1.4 }}>{best ? t('pw.home.chests', { n: total }) : t('pw.noChests')}</div>
          <Button onClick={best ? () => openType(best) : onStudy} style={{ marginTop: 10, height: 38, fontSize: 13.5, borderRadius: 12 }}>{t(best ? 'pw.open' : 'pw.startSession')}</Button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
        {['small', 'silver', 'gold', 'epic'].map((ty) => {
          const n = count(ty);
          return (
            <div key={ty} onClick={n ? () => openType(ty) : undefined} style={{ ...CARD, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: n ? 'pointer' : 'default' }}>
              <ChestIcon type={ty} size={26} locked={!n} />
              <span style={{ fontSize: 13, fontWeight: 800, color: n ? '#fff' : '#5f5f72' }}>×{n}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

const MISSION_ICON = { session: '📖', session2: '📚', chest: '🎁', chest2: '🎁', dress: '👕', plan: '🗓️', trick: '✨', album: '📒' };
function ProgressBar({ pct, done }) {
  return (
    <div style={{ height: 4, borderRadius: 9, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 9, background: done ? '#35d07f' : PURPLE }} />
    </div>
  );
}

// Today's 3 missions with their progress, and the silver chest for all 3.
function Missions({ state }) {
  const { t } = useLang();
  const items = state.missions.items || [];
  if (!items.length) return null;
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hours = Math.max(1, Math.ceil((midnight - now) / 3600000));
  const doneCount = items.filter((m) => m.done).length;
  return (
    <Card title={t('pw.missions')} right={<span style={{ fontSize: 12, color: '#8a8a99' }}>{t('pw.resetsIn', { n: hours })}</span>}>
      {items.map((m, i) => {
        const [ev, n] = MISSIONS[m.id] || ['', 1];
        const have = m.done ? n : Math.min(n, state.missions.counts[ev] || 0);
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none', marginTop: i ? 0 : -4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 17, flex: 'none' }}>{MISSION_ICON[m.id] || '⭐'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650, color: m.done ? '#8a8a99' : '#f4f4f7' }}>{t('pw.mission.' + m.id)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1 }}><ProgressBar pct={(have / n) * 100} done={m.done} /></div>
                <span style={{ fontSize: 11, color: '#8a8a99', fontWeight: 700 }}>{have}/{n}</span>
              </div>
            </div>
            <CoinChip n={'+' + MISSION_COINS} />
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, padding: '10px 12px', borderRadius: 14, background: state.missions.bonus ? 'rgba(53,208,127,.08)' : 'rgba(255,255,255,.04)' }}>
        <ChestIcon type="silver" size={30} glow={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: state.missions.bonus ? '#7fe3ad' : '#d9d9e6' }}>{t(state.missions.bonus ? 'pw.missionsBonusDone' : 'pw.missionsBonus')}</div>
          {!state.missions.bonus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1 }}><ProgressBar pct={(doneCount / items.length) * 100} /></div>
              <span style={{ fontSize: 11, color: '#8a8a99', fontWeight: 700 }}>{doneCount}/{items.length}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function CoinChip({ n }) {
  return <span style={{ fontSize: 12, fontWeight: 800, color: '#ffd27a', padding: '4px 9px', borderRadius: 99, background: 'rgba(245,165,36,.12)', border: '1px solid rgba(245,165,36,.3)', whiteSpace: 'nowrap', flex: 'none' }}>🪙 {n}</span>;
}

function Calendar({ state, today, onClaim }) {
  const { t } = useLang();
  const can = canClaimCalendar(state, today);
  const d = state.calendar.day;
  const claimed = can ? d % 7 : ((d - 1) % 7) + 1; // claimed in this week of rewards
  return (
    <Card title={t('pw.calendar')} right={<span style={{ fontSize: 12, color: '#8a8a99' }}>{t('pw.calendarNote')}</span>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {CALENDAR.map((r, i) => {
          const done = i < claimed;
          const next = can && i === claimed;
          return (
            <div key={i} style={{ borderRadius: 12, padding: '7px 0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: next ? 'rgba(139,109,255,.18)' : 'rgba(255,255,255,.04)', border: next ? '1.5px solid #8b6dff' : '1px solid rgba(255,255,255,.06)', opacity: done ? 0.45 : 1, position: 'relative' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#8a8a99' }}>{i + 1}</span>
              {r.chest ? <ChestIcon type={r.chest} size={22} /> : <span style={{ fontSize: 15, lineHeight: '22px' }}>🪙</span>}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#c9c9d6' }}>{r.coins || '×1'}</span>
              {done && <span style={{ position: 'absolute', top: 2, right: 3, fontSize: 10, color: '#35d07f' }}>✓</span>}
            </div>
          );
        })}
      </div>
      <Button onClick={onClaim} disabled={!can} ghost={!can} style={{ marginTop: 12, height: 42 }}>{t(can ? 'pw.claim' : 'pw.claimTomorrow')}</Button>
    </Card>
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
              <div style={{ fontSize: 40, marginTop: 6 }}>{OUTFIT_ICON[o.id]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, textAlign: 'center' }}>{t('pw.outfit.' + o.id)}</div>
              <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 2 }}>{t('pw.slot.' + OUTFIT_BY_ID[o.id].slot)}</div>
              <Button
                ghost={own} disabled={own || state.coins < o.price} style={{ height: 36, marginTop: 10, alignSelf: 'stretch', fontSize: 13 }}
                onClick={() => buy((s) => buyOutfit(s, today, o.id), t('pw.shop.got', { name: t('pw.outfit.' + o.id) }))}
              >
                {own ? t('pw.owned') : <>{o.deal && <s style={{ opacity: 0.6, fontWeight: 600 }}>{full}</s>} 🪙 {o.price}</>}
              </Button>
            </div>
          );
        })}
      </div>
      <Card title={t('pw.chests')} style={{ marginTop: 16 }}>
        {['small', 'silver'].map((type, i) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
            <ChestIcon type={type} size={44} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{t('pw.chest.' + type)}</div>
            <Button disabled={state.coins < CHEST_PRICE[type]} style={{ height: 36, fontSize: 13 }} onClick={() => buy((s) => buyChest(s, type), t('pw.shop.gotChest'))}>🪙 {CHEST_PRICE[type]}</Button>
          </div>
        ))}
      </Card>
      {msg && <div style={{ marginTop: 12, fontSize: 13, color: '#c9baff', textAlign: 'center' }}>{msg}</div>}
      <div style={{ fontSize: 11.5, color: '#77778a', textAlign: 'center', marginTop: 16, lineHeight: 1.45 }}>{t('pw.shop.note')}</div>
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
