import { NUM_TODAY } from '../lib/plannerData';
import { dayInfo } from '../lib/plannerLogic';
import { DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { Confetti } from './ui';

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export default function StreakCelebration({ streak, onClose }) {
  const { t } = useLang();
  if (!streak) return null;
  const milestone = STREAK_MILESTONES.includes(streak);
  const week = Array.from({ length: 7 }, (_, i) => dayInfo(NUM_TODAY - 6 + i));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(6,6,10,.86)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeUp .25s ease both' }}>
      <div style={{ width: '100%', maxWidth: 340, padding: '30px 24px 24px', borderRadius: 26, background: 'linear-gradient(170deg,#1c130c,#101018 60%)', border: '1px solid rgba(245,165,36,.35)', boxShadow: '0 0 60px rgba(245,120,36,.25)', textAlign: 'center', animation: 'stepIconPop .45s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 76, lineHeight: 1, display: 'inline-block', animation: 'streakBump .9s ease .25s both, pulseGlow 1.8s ease-in-out 1.2s infinite', filter: 'drop-shadow(0 0 22px rgba(245,120,36,.7))' }}>🔥</div>
          <Confetti top={30} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.12em', color: '#f5a524', marginTop: 16 }}>{t('streak.celebrateLabel')}</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#ffb547', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{streak}</div>
        <div style={{ fontSize: 21, fontWeight: 750, marginTop: 2 }}>
          {streak === 1 ? t('streak.celebrateStarted') : t('streak.celebrateTitle', { n: streak })}
        </div>
        {milestone && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 12, background: 'rgba(245,165,36,.12)', border: '1px solid rgba(245,165,36,.35)', fontSize: 13, fontWeight: 650, color: '#f7c46c' }}>
            🎉 {t('streak.celebrateMilestone', { n: streak })}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginTop: 18 }}>
          {week.map((d, i) => {
            const lit = i >= 7 - streak;
            return (
              <div key={d.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9.5, fontWeight: 650, color: i === 6 ? '#f5a524' : '#7a7a8a', letterSpacing: '.05em' }}>{t(DAY_KEY[d.label] + '.short') || d.short}</span>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  background: lit ? 'rgba(245,101,36,.18)' : 'rgba(255,255,255,.04)',
                  border: '1px solid ' + (lit ? 'rgba(245,101,36,.5)' : 'rgba(255,255,255,.08)'),
                  animation: lit ? `chipPop .35s ease ${0.35 + i * 0.06}s both` : 'none',
                }}
                >
                  {lit ? '🔥' : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 13, color: '#c9c9d6', marginTop: 18, lineHeight: 1.5 }}>{t('streak.celebrateRule')}</div>
        <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 4, lineHeight: 1.5 }}>{t('streak.celebrateTomorrow')}</div>
        <div
          onClick={onClose}
          style={{ marginTop: 20, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#ff9f43,#f5652a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 750, cursor: 'pointer', color: '#fff' }}
        >
          {t('streak.celebrateBtn')}
        </div>
      </div>
    </div>
  );
}
