import { useEffect, useState } from 'react';
import { AppShellPortal } from './ui';
import { PugLive } from './PugMascot';
import { useLang } from '../lib/useLang';
import { localeOf } from '../lib/i18n';
import {
  DEFAULT_PRICES, APP_STORE_URL, TERMS_URL, canBuyHere, loadStorePrices, buyPremium, restorePremium, formatPrice, yearlySaving,
} from '../lib/premium';

// The Pulgo Premium payment screen: a big claim with the pug and three
// floating feature cards on the dark glow, then the yearly / monthly cards
// (yearly picked, with the free trial) and the button. Buying happens in the
// iPhone app (Apple's sheet through RevenueCat); on the website it points
// to the App Store instead.

const NOTE_KEY = {
  'limit-plan': 'premium.limit.plan',
  'limit-rescue': 'premium.limit.rescue',
  'limit-prep': 'premium.limit.prep',
  win: 'premium.win',
};

function FeatureCard({ icon, label, title, color, align }) {
  return (
    <div style={{
      alignSelf: align, width: 236, maxWidth: '78%', display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 16,
      background: '#141119', border: `1px solid ${color}80`, boxShadow: '0 16px 36px rgba(0,0,0,.5)',
    }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}>{title}</div>
      </div>
    </div>
  );
}

function PlanCard({ selected, title, sub, price, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', padding: '14px 16px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        background: selected ? 'rgba(139,109,255,.14)' : '#121019',
        border: selected ? '2px solid #8b6dff' : '1px solid rgba(255,255,255,.08)',
        margin: selected ? 0 : 1, transition: 'background .2s ease',
      }}
    >
      {badge && (
        <span style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: '.06em', padding: '4px 9px', borderRadius: 99, background: 'linear-gradient(90deg,#f5a524,#ff7a45)', color: '#2a1300' }}>{badge}</span>
      )}
      <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', boxSizing: 'border-box', ...(selected ? { background: '#8b6dff', boxShadow: 'inset 0 0 0 4px #1b1530' } : { border: '2px solid #44445a' }) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 750 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#a3a3b3', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{price}</div>
    </div>
  );
}

export default function Paywall({ reason, onClose }) {
  const { t, lang } = useLang();
  const locale = localeOf(lang);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [plan, setPlan] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const native = canBuyHere();

  useEffect(() => {
    let live = true;
    loadStorePrices().then((p) => { if (live && p) setPrices(p); });
    return () => { live = false; };
  }, []);

  const yearly = formatPrice(prices.yearly, locale);
  const monthly = formatPrice(prices.monthly, locale);
  const perMonth = formatPrice(prices.yearly, locale, 12);
  const saving = yearlySaving(prices);

  async function buy() {
    if (busy) return;
    if (!native) { window.location.href = APP_STORE_URL; return; }
    setBusy(true);
    setNotice('');
    const r = await buyPremium(plan);
    setBusy(false);
    if (r === 'done') setDone(true);
    else if (r === 'update') setNotice(t('premium.updateApp'));
    else if (r === 'error') setNotice(t('premium.error'));
  }

  async function restore() {
    if (busy || !native) return;
    setBusy(true);
    setNotice('');
    const r = await restorePremium();
    setBusy(false);
    if (r === 'restored') setDone(true);
    else setNotice(t({ none: 'premium.nothingToRestore', update: 'premium.updateApp' }[r] || 'premium.error'));
  }

  const note = NOTE_KEY[reason];
  const link = { color: '#6a6a7a', cursor: 'pointer', textDecoration: 'none' };

  return (
    <AppShellPortal>
      <div style={{ position: 'absolute', inset: 0, zIndex: 95, background: '#08080c', animation: 'fadeUp .3s ease both' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(80% 45% at 75% 30%,rgba(124,92,255,.42),transparent 70%),radial-gradient(60% 30% at 0% 0%,rgba(139,109,255,.22),transparent 70%)' }} />
        <div className="sc" style={{ position: 'relative', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 'calc(var(--safe-top) + 14px) 20px calc(var(--safe-bottom) + 18px)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', fontSize: 15, cursor: 'pointer' }}>✕</div>
          </div>

          {done ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 130, height: 130 }}>
                <div style={{ position: 'absolute', inset: -28, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,109,255,.55),transparent 65%)' }} />
                <PugLive size={130} style={{ position: 'relative', boxShadow: '0 0 0 4px #8b6dff, 0 18px 44px rgba(109,77,255,.5)' }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', marginTop: 24 }}>{t('premium.welcomeTitle')}</div>
              <div style={{ fontSize: 14.5, color: '#a3a3b3', marginTop: 8 }}>{t('premium.welcomeText')}</div>
              <div onClick={onClose} style={{ marginTop: 28, alignSelf: 'stretch', height: 56, borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 750, cursor: 'pointer' }}>{t('premium.letsGo')}</div>
            </div>
          ) : (
            <>
              {note && (
                <div style={{ marginTop: 10, padding: '10px 13px', borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c' }}>{t(note)}</div>
              )}
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', color: '#a58cff', marginTop: note ? 16 : 4 }}>👑 {t('premium.eyebrow')}</div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.035em', lineHeight: 1.04, marginTop: 8 }}>
                {t('premium.title1')}{' '}
                <span style={{ background: 'linear-gradient(90deg,#c9baff,#8b6dff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t('premium.title2')}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, padding: '12px 14px', borderRadius: '18px 18px 18px 4px', background: '#16131f', border: '1px solid rgba(255,255,255,.1)', fontSize: 13, lineHeight: 1.4, color: '#e6e3f2', boxShadow: '0 16px 36px rgba(0,0,0,.5)' }}>{t('premium.bubble')}</div>
                  <div style={{ position: 'relative', width: 92, height: 92, flex: 'none' }}>
                    <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,109,255,.55),transparent 65%)' }} />
                    <PugLive size={92} style={{ position: 'relative', boxShadow: '0 0 0 3px #8b6dff, 0 16px 36px rgba(109,77,255,.5)' }} />
                  </div>
                </div>
                <FeatureCard icon="✨" label={t('premium.card1Label')} title={t('premium.card1')} color="#2ee6c5" align="flex-end" />
                <FeatureCard icon="📚" label={t('premium.card2Label')} title={t('premium.card2')} color="#f5a524" align="flex-start" />
              </div>

              <div style={{ flex: 1, minHeight: 24 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PlanCard
                  selected={plan === 'yearly'} onClick={() => setPlan('yearly')}
                  title={t('premium.yearly')} sub={t('premium.yearlySub', { perMonth })} price={yearly}
                  badge={saving > 0 ? t('premium.bestValue', { pct: saving }) : t('premium.bestValueShort')}
                />
                <PlanCard selected={plan === 'monthly'} onClick={() => setPlan('monthly')} title={t('premium.monthly')} sub={t('premium.monthlySub')} price={monthly} />
              </div>

              {!native && <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#a3a3b3', textAlign: 'center', marginTop: 14 }}>{t('premium.webOnly')}</div>}
              {notice && <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c', textAlign: 'center', marginTop: 12 }}>{notice}</div>}

              <div
                onClick={buy}
                style={{ marginTop: 14, height: 56, flex: 'none', borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 750, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, boxShadow: '0 10px 26px rgba(109,77,255,.45)' }}
              >
                {busy ? t('premium.busy') : !native ? t('premium.openAppStore') : plan === 'yearly' ? t('premium.ctaTrial') : t('premium.ctaMonthly')}
              </div>
              <div style={{ textAlign: 'center', fontSize: 11.5, color: '#8a8a99', marginTop: 8 }}>
                {plan === 'yearly' ? t('premium.termsYearly', { price: yearly }) : t('premium.termsMonthly', { price: monthly })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, fontSize: 11.5 }}>
                {native && <span onClick={restore} style={link}>{t('premium.restore')}</span>}
                <a href={TERMS_URL} target="_blank" rel="noreferrer" style={link}>{t('premium.terms')}</a>
                <span onClick={() => setPrivacyOpen(true)} style={link}>{t('premium.privacy')}</span>
              </div>
            </>
          )}
        </div>

        {privacyOpen && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(6,6,10,.75)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setPrivacyOpen(false)}>
            <div className="sc" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '80%', overflowY: 'auto', padding: '20px 20px calc(20px + var(--safe-bottom))', borderRadius: '24px 24px 0 0', background: '#101018', borderTop: '1px solid rgba(255,255,255,.12)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 17, fontWeight: 750 }}>{t('settings.privacyPolicy')}</div>
                <span onClick={() => setPrivacyOpen(false)} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#c9c9d6', marginTop: 16, whiteSpace: 'pre-line' }}>{t('settings.privacyPolicyText')}</div>
            </div>
          </div>
        )}
      </div>
    </AppShellPortal>
  );
}
