import { useLang } from '../../lib/useLang';
import { localeOf } from '../../lib/i18n';
import { localDateKey } from '../../lib/plannerLogic';
import { DOG_BY_ID, RARITIES } from '../../lib/pugWorld/catalog.js';
import { CALENDAR, canClaimCalendar, claimCalendar, monthlyFor, MONTHLY_TARGET, MONTHLY_MILESTONES, MONTHLY_COINS } from '../../lib/pugWorld/logic.js';
import { openPugWorld } from '../../lib/pugWorld/events';
import { BackButton } from '../ui';
import DogThumb from './DogThumb';
import ChestIcon from './Chest';
import { CoinIcon } from './icons';
import { Chunky, CoinPill } from './bits';
import { RARITY_BRIGHT } from './theme';
import { dogName } from './names';
import { MissionRow, ThickBar } from './missionBits';
import { hoursToMidnight } from './missionUtil';

// The Missions page (like Duolingo's quests), opened from the missions card
// on Home: the monthly challenge (20 sessions, a chest at 7 / 13 / 20),
// today's 3 missions, the daily rewards and a row of your dogs (tap one, or
// "Collection", to open My dogs).

export default function MissionsPage({ pw, onBack }) {
  const { t } = useLang();
  const { state, update } = pw;
  const today = localDateKey();
  const items = state.missions.items || [];
  const doneCount = items.filter((m) => m.done).length;
  const dogs = [state.favorite, ...Object.keys(state.dogs).filter((id) => id !== state.favorite && DOG_BY_ID[id])
    .sort((a, b) => RARITIES.indexOf(DOG_BY_ID[b].rarity) - RARITIES.indexOf(DOG_BY_ID[a].rarity))].filter((id) => id && DOG_BY_ID[id]);
  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 16px calc(var(--tabbar-h) + 28px)', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={onBack} />
        <CoinPill n={state.coins} />
      </div>
      <MonthlyHero state={state} today={today} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 2px 2px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: '#8a8a99' }}>{t('pw.missions').toUpperCase()}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#f5a524' }}>⏱ {t('pw.resetsIn', { n: hoursToMidnight() })}</div>
      </div>
      {items.map((m, i) => (
        <div key={m.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none' }}><MissionRow state={state} m={m} big /></div>
      ))}
      {items.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, padding: '12px 14px', borderRadius: 16, background: state.missions.bonus ? 'rgba(53,208,127,.08)' : 'rgba(139,109,255,.08)', border: state.missions.bonus ? '1px solid rgba(53,208,127,.3)' : '1px dashed rgba(139,109,255,.4)' }}>
          <ChestIcon type="silver" size={34} glow={false} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: state.missions.bonus ? '#7fe3ad' : '#d9d9e6' }}>{t(state.missions.bonus ? 'pw.missionsBonusDone' : 'pw.missionsBonus')}</div>
            {!state.missions.bonus && <div style={{ marginTop: 7 }}><ThickBar pct={(doneCount / items.length) * 100} height={10} /></div>}
          </div>
          {!state.missions.bonus && <span style={{ fontSize: 12, fontWeight: 800, color: '#a3a3b3' }}>{doneCount}/{items.length}</span>}
        </div>
      )}

      <DailyRewards state={state} today={today} onClaim={() => update((s) => claimCalendar(s, today).state)} />

      {dogs.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 2px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: '#8a8a99' }}>{t('pw.title').toUpperCase()} · {dogs.length}</div>
            <span onClick={() => openPugWorld()} style={{ fontSize: 12.5, fontWeight: 750, color: '#a58cff', cursor: 'pointer' }}>{t('pw.collection')} ›</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -16px', padding: '4px 16px 6px' }}>
            {dogs.map((id) => {
              const [light, base, shade] = RARITY_BRIGHT[DOG_BY_ID[id].rarity];
              return (
                <div key={id} onClick={() => openPugWorld({ dog: id })} style={{ flex: 'none', width: 80, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(160deg, ${light}, ${base})`, boxShadow: `0 4px 0 ${shade}${id === state.favorite ? ', 0 0 0 3px #08080c, 0 0 0 5.5px #ffc800' : ''}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                    <DogThumb dogId={id} worn={state.outfits.worn[id]} size={76} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 8, lineHeight: 1.2, color: '#d9d9e6' }}>{dogName(t, id)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// The big purple card: "November challenge", days left, your favourite dog,
// and a bar to 20 sessions with a chest at each milestone (✓ once reached).
function MonthlyHero({ state, today }) {
  const { t, lang } = useLang();
  const m = monthlyFor(state, today.slice(0, 7));
  const [y, mo, d] = today.split('-').map(Number);
  const daysLeft = new Date(y, mo, 0).getDate() - d;
  const monthName = new Date(y, mo - 1, 1).toLocaleDateString(localeOf(lang), { month: 'long' });
  const name = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const sessions = Math.min(m.sessions, MONTHLY_TARGET);
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : null;
  return (
    <div style={{ position: 'relative', marginTop: 14, borderRadius: 26, padding: '20px 16px 16px', background: 'linear-gradient(160deg,#7c5cff,#5b3ee0)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -6, top: 2 }}>{fav && <DogThumb dogId={fav} worn={state.outfits.worn[fav]} size={124} />}</div>
      <div style={{ position: 'relative', maxWidth: '62%' }}>
        <div style={{ fontSize: 27, fontWeight: 850, lineHeight: 1.1, letterSpacing: '-.01em' }}>{t('pw.monthly.title', { month: name })}</div>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.04em', color: '#e3dcff', marginTop: 10 }}>⏱ {(m.done ? '✓ ' + t('pw.monthly.done') : t('pw.monthly.daysLeft', { n: daysLeft })).toUpperCase()}</div>
      </div>
      <div style={{ position: 'relative', marginTop: 18, padding: '16px 16px 12px', borderRadius: 20, background: '#17141f' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 750 }}>{t('pw.monthly.goal', { n: MONTHLY_TARGET })}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: m.done ? '#7fe3ad' : '#a58cff', whiteSpace: 'nowrap' }}>{sessions} / {MONTHLY_TARGET}</div>
        </div>
        <div style={{ position: 'relative', margin: '22px 6px 30px' }}>
          <ThickBar pct={(sessions / MONTHLY_TARGET) * 100} done={m.done} height={16} />
          {MONTHLY_MILESTONES.map((ms) => {
            const reached = sessions >= ms.at;
            const pct = (ms.at / MONTHLY_TARGET) * 100;
            return (
              <div key={ms.at} style={{ position: 'absolute', left: `calc(${pct}% - 20px)`, top: -12, width: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #17141f', display: 'grid', placeItems: 'center', background: reached ? '#35d07f' : '#2a2638', fontSize: 17, fontWeight: 900 }}>
                  {reached ? '✓' : <ChestIcon type={ms.chest} size={26} glow={false} />}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, marginTop: 3, color: reached ? '#7fe3ad' : '#8a8a99' }}>{ms.at}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#a3a3b3' }}>
          {t('pw.monthly.reward')} <ChestIcon type="small" size={16} glow={false} /> <ChestIcon type="silver" size={16} glow={false} /> <ChestIcon type="epic" size={16} glow={false} /> + <CoinIcon size={13} /> {MONTHLY_COINS}
        </div>
      </div>
    </div>
  );
}

// Daily rewards as gift tiles: done = green ✓, today = glowing orange,
// day 7 = a wide gold "BIG CHEST"; a big Collect button.
const CAL_TILE = { done: ['#9be35a', '#58cc02', '#46a302'], today: ['#ffc06b', '#ff9600', '#e08500'] };
function DailyRewards({ state, today, onClaim }) {
  const { t } = useLang();
  const can = canClaimCalendar(state, today);
  const d = state.calendar.day;
  const claimed = can ? d % 7 : ((d - 1) % 7) + 1; // claimed in this week of rewards
  const dayNo = can ? claimed + 1 : claimed;
  const tile = (r, i) => {
    const done = i < claimed;
    const now = can && i === claimed;
    const pal = done ? CAL_TILE.done : now ? CAL_TILE.today : null;
    return (
      <div key={i} style={{ position: 'relative', height: 92, borderRadius: 18, marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, ...(pal ? { background: `linear-gradient(160deg, ${pal[0]}, ${pal[1]})`, boxShadow: `0 4px 0 ${pal[2]}${now ? ', 0 0 22px rgba(255,150,0,.45)' : ''}` } : { background: '#1f1c2b', boxShadow: '0 4px 0 #0f0e17' }) }}>
        <span style={{ position: 'absolute', top: 6, left: 9, fontSize: 10.5, fontWeight: 900, color: pal ? 'rgba(255,255,255,.92)' : '#8a8a99' }}>{now ? t('pw.today').toUpperCase() : i + 1}</span>
        {done
          ? <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>✓</span>
          : r.chest ? <ChestIcon type={r.chest} size={now ? 44 : 34} glow={false} /> : <CoinIcon size={now ? 36 : 28} />}
        <span style={{ fontSize: 11.5, fontWeight: 900, color: pal ? '#fff' : '#b9b9c8' }}>{r.coins ? '+' + r.coins : '×1'}</span>
      </div>
    );
  };
  const last = CALENDAR[6];
  const lastDone = claimed > 6;
  const lastNow = can && claimed === 6;
  return (
    <div style={{ marginTop: 20, padding: 16, borderRadius: 24, background: '#151221', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{t('pw.calendar')}</div>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#ff9600' }}>{t('pw.calDay', { n: Math.min(7, Math.max(1, dayNo)) })}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginTop: 14 }}>{CALENDAR.slice(0, 4).map((r, i) => tile(r, i))}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 9, marginTop: 9 }}>
        {CALENDAR.slice(4, 6).map((r, k) => tile(r, k + 4))}
        <div style={{ position: 'relative', height: 92, borderRadius: 18, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#5a3d00', background: lastDone ? 'linear-gradient(160deg,#9be35a,#58cc02)' : 'linear-gradient(160deg,#ffe680,#ffc800)', boxShadow: `0 4px 0 ${lastDone ? '#46a302' : '#e5a900'}${lastNow ? ', 0 0 22px rgba(255,200,0,.6)' : ''}` }}>
          <span style={{ position: 'absolute', top: 6, left: 9, fontSize: 10.5, fontWeight: 900 }}>{lastNow ? t('pw.today').toUpperCase() : 7}</span>
          {lastDone ? <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>✓</span> : <><ChestIcon type={last.chest || 'gold'} size={54} glow={false} /><span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.1, maxWidth: 70 }}>{t('pw.bigChest').toUpperCase()}</span></>}
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {can
          ? <Chunky onClick={onClaim}>{t('pw.claim')}</Chunky>
          : <div style={{ height: 50, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 900, color: '#8a8a99', background: 'rgba(255,255,255,.05)' }}>{t('pw.claimTomorrow')}</div>}
      </div>
    </div>
  );
}
