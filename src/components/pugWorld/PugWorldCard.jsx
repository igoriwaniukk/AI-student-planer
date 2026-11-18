import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { SESSION_COINS, MONTHLY_TARGET, monthlyFor, dogsOn } from '../../lib/pugWorld/logic.js';
import { localDateKey } from '../../lib/plannerLogic';
import { openPugWorld, openMissions } from '../../lib/pugWorld/events';
import { MissionRow } from './missionBits';
import { hoursToMidnight } from './missionUtil';
import { AppShellPortal } from '../ui';
import Dog2D from './Dog2D';
import ChestIcon from './Chest';
import ChestOpen from './ChestOpen';
import { CoinIcon } from './icons';

// Home: your dog (alive: breathes, blinks, wags), chests waiting, and one
// short progress line (today's missions, the monthly challenge); tap to
// open the Pets page.
export default function PugWorldCard({ pw }) {
  const { t } = useLang();
  const [jump, setJump] = useState(0);
  // Once you have dogs: the missions card (HomeMissions) and the little
  // dogs on the cards (ScreenPets) instead.
  if (!pw?.enabled || pw.started) return null;
  const { state } = pw;
  const chests = state.chests.length;
  const items = state.missions.items || [];
  const doneCount = items.filter((m) => m.done).length;
  const month = monthlyFor(state, localDateKey().slice(0, 7));
  return (
    <div onClick={() => { setJump((k) => k + 1); setTimeout(() => openPugWorld(), 350); }} style={{ marginTop: 12, padding: '12px 14px', borderRadius: 20, cursor: 'pointer', background: 'linear-gradient(160deg,rgba(139,109,255,.14),rgba(139,109,255,.03))', border: '1px solid rgba(139,109,255,.35)', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 76, height: 76, borderRadius: 18, background: '#c9d8f5', display: 'grid', placeItems: 'center', flex: 'none', overflow: 'hidden' }}>
        <div style={{ width: 90, height: 90, flex: 'none' }}><Dog2D dogId={pw.started ? state.favorite : 'pug-fawn'} worn={pw.started ? state.outfits.worn[state.favorite] : undefined} happyKey={jump} /></div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{t('pw.title')}</span>
          {chests > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 800, padding: '1px 8px 1px 3px', borderRadius: 99, background: '#ff5f6d' }}>
              <ChestIcon type="small" size={18} glow={false} />{chests}
            </span>
          )}
          <span style={{ marginLeft: 'auto', color: '#7a7a8c', fontSize: 18 }}>›</span>
        </div>
        {!pw.started || !items.length ? (
          <div style={{ fontSize: 12.5, color: '#b9b9c8', marginTop: 4, lineHeight: 1.4 }}>{t('pw.home.start')}</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Chip done={doneCount === items.length}>{t('pw.home.missions', { n: doneCount, total: items.length })}</Chip>
            <Chip done={month.done}>{t('pw.home.month', { n: Math.min(month.sessions, MONTHLY_TARGET), total: MONTHLY_TARGET })}</Chip>
          </div>
        )}
      </div>
    </div>
  );
}

// Home, once you have a dog: today's 3 missions (like Duolingo); tap to
// open the Missions page. Little dogs can stand on it (data-perch).
export function HomeMissions({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.started) return null;
  const { state } = pw;
  const items = state.missions.items || [];
  if (!items.length) return null;
  const doneCount = items.filter((m) => m.done).length;
  return (
    <div data-perch="" onClick={() => openMissions()} style={{ marginTop: 18, padding: '13px 15px 8px', borderRadius: 18, cursor: 'pointer', background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('pw.todayMissions').toUpperCase()} · {doneCount}/{items.length}</div>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#f5a524', whiteSpace: 'nowrap' }}>⏱ {t('pw.resetsIn', { n: hoursToMidnight() })}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#a58cff', whiteSpace: 'nowrap' }}>{t('pw.seeAll')} ›</span>
      </div>
      <div style={{ marginTop: 4 }}>
        {items.map((m) => <MissionRow key={m.id} state={state} m={m} />)}
      </div>
    </div>
  );
}

function Chip({ done, children }) {
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 99, background: done ? 'rgba(53,208,127,.12)' : 'rgba(255,255,255,.06)', color: done ? '#7fe3ad' : '#d9d9e6', whiteSpace: 'nowrap' }}>{done ? '✓ ' : ''}{children}</span>;
}

// The study timer: your dog studies with you (the one that lives on the
// study timer, else the favourite).
export function StudyBuddy({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.started) return null;
  const fav = dogsOn(pw.state, 'focus')[0] || pw.state.favorite;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 22, alignSelf: 'stretch', maxWidth: 360 }}>
      <div style={{ width: 96, height: 96, flex: 'none' }}><Dog2D dogId={fav} worn={pw.state.outfits.worn[fav]} book /></div>
      <SpeechBubble>
        {t('pw.focus.bubble')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11.5, color: '#a58cff', fontWeight: 700 }}>
          <ChestIcon type="small" size={18} glow={false} />{t('pw.focus.chest')}
        </div>
      </SpeechBubble>
    </div>
  );
}

function SpeechBubble({ children }) {
  return (
    <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: '16px 16px 16px 4px', background: '#1c1830', border: '1px solid rgba(139,109,255,.4)', fontSize: 13, lineHeight: 1.4, color: '#ececf3' }}>
      {children}
    </div>
  );
}

// After a finished session: the chest it earned opens by itself, right
// here (shake → burst → what's inside), not inside the collection. Before
// the game is started: a small "+1 chest" message at the top instead.
export function SessionReward({ pw, ready }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.toast || !ready) return null;
  // The chest this session added (remembered in the toast, so it stays put
  // while it opens and leaves the list).
  const chestId = pw.toast.chest;
  if (!pw.started || !chestId) return <PugWorldToast pw={pw} />;
  const banner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: '#35d07f' }}>
      {t('pw.done.title').toUpperCase()} · <CoinIcon size={13} /> +{SESSION_COINS}
    </div>
  );
  return (
    <AppShellPortal>
      <div style={{ position: 'absolute', inset: 0, zIndex: 120 }}>
        <ChestOpen key={chestId} pw={pw} chestId={chestId} auto banner={banner} onClose={pw.clearToast} />
      </div>
    </AppShellPortal>
  );
}

// Small "+1 chest" message at the top, tap to open the game.
export function PugWorldToast({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.toast) return null;
  return (
    <AppShellPortal>
      <div
        onClick={() => { pw.clearToast(); openPugWorld(); }}
        style={{ position: 'absolute', left: 16, right: 16, top: 'calc(var(--top-pad) + 8px)', zIndex: 120, padding: '10px 14px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: '#17132a', border: '1px solid rgba(139,109,255,.55)', boxShadow: '0 16px 40px rgba(0,0,0,.55)', animation: 'fadeUp .3s ease both' }}
      >
        <ChestIcon type="small" size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 750 }}>{t('pw.toast.title')}</div>
          <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 2 }}>{t('pw.toast.sub')}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 750, color: '#c9baff' }}>{t('pw.open')}</span>
      </div>
    </AppShellPortal>
  );
}
