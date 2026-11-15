import { useState } from 'react';
import { useLang } from '../../lib/useLang';
import { MISSIONS, MISSION_COINS, SESSION_COINS } from '../../lib/pugWorld/logic.js';
import { openPugWorld } from '../../lib/pugWorld/events';
import { AppShellPortal } from '../ui';
import Dog2D from './Dog2D';
import ChestIcon from './Chest';
import { CoinIcon } from './icons';
import { PURPLE } from './theme';

const MISSION_ICON = { session: '📖', session2: '📚', chest: '🎁', chest2: '🎁', dress: '👕', plan: '🗓️', trick: '✨', album: '📒' };

// Home: your dog (alive: breathes, blinks, wags), today's missions and the
// chests waiting, right under the streak; tap to open your dogs.
export default function PugWorldCard({ pw }) {
  const { t } = useLang();
  const [jump, setJump] = useState(0);
  if (!pw?.enabled) return null;
  const { state } = pw;
  const chests = state.chests.length;
  const items = state.missions.items || [];
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
        ) : items.map((m) => {
          const [ev, n] = MISSIONS[m.id] || ['', 1];
          const have = m.done ? n : Math.min(n, state.missions.counts[ev] || 0);
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 11.5, flex: 'none' }}>{MISSION_ICON[m.id] || '⭐'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 650, color: m.done ? '#8a8a99' : '#ececf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('pw.mission.' + m.id)}</div>
                <div style={{ height: 3, borderRadius: 9, background: 'rgba(255,255,255,.08)', marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ width: (have / n) * 100 + '%', height: '100%', background: m.done ? '#35d07f' : PURPLE }} />
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 800, color: m.done ? '#35d07f' : '#ffd27a', flex: 'none' }}>
                {m.done ? '✓' : <><CoinIcon size={11} />{MISSION_COINS}</>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The study timer: your dog studies with you.
export function StudyBuddy({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.started) return null;
  const fav = pw.state.favorite;
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

// After a finished session: the chest it earned, glowing, and your dog
// telling you to tap it (or "Later"). Before the game is started: a small
// "+1 chest" message at the top instead.
export function SessionReward({ pw, ready }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.toast || pw.open || !ready) return null;
  const chest = [...pw.state.chests].reverse().find((c) => c.from === 'session');
  if (!pw.started || !chest) return <PugWorldToast pw={pw} />;
  const fav = pw.state.favorite;
  const open = () => { pw.clearToast(); openPugWorld({ chest: chest.id }); };
  return (
    <AppShellPortal>
      <style>{'@keyframes pwDrop{0%{transform:translateY(-60px) scale(.6);opacity:0}60%{transform:translateY(8px) scale(1.05);opacity:1}100%{transform:none}}@keyframes pwPulse{0%,100%{opacity:.75}50%{opacity:1}}'}</style>
      <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: 'rgba(6,6,10,.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 'calc(var(--top-pad) + 40px)', animation: 'fadeUp .25s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', color: '#35d07f' }}>
          {t('pw.done.title').toUpperCase()} · <CoinIcon size={13} /> +{SESSION_COINS}
        </div>
        <div onClick={open} style={{ marginTop: 50, width: 240, height: 240, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'radial-gradient(circle, rgba(211,148,86,.45), transparent 65%)', animation: 'pwPulse 2.4s ease-in-out infinite' }}>
          <div style={{ animation: 'pwDrop .6s ease-out both' }}><ChestIcon type={chest.type} size={150} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 30, padding: '0 20px', alignSelf: 'stretch' }}>
          <div style={{ width: 110, height: 110, flex: 'none' }}><Dog2D dogId={fav} worn={pw.state.outfits.worn[fav]} happyKey={1} /></div>
          <SpeechBubble><span dangerouslySetInnerHTML={{ __html: t('pw.done.bubble').replace(/\*(.+?)\*/g, '<b>$1</b>') }} /></SpeechBubble>
        </div>
        <div style={{ flex: 1 }} />
        <div onClick={pw.clearToast} style={{ padding: '14px 30px', marginBottom: 'calc(var(--safe-bottom) + 24px)', fontSize: 14, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('pw.later')}</div>
      </div>
    </AppShellPortal>
  );
}

// Small "+1 chest" message at the top, tap to open the game.
export function PugWorldToast({ pw }) {
  const { t } = useLang();
  if (!pw?.enabled || !pw.toast || pw.open) return null;
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
