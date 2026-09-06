import { hm, weeklyReview } from '../lib/plannerLogic';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { Chip } from '../components/ui';

function WeeklyReviewCard({ studyHistory }) {
  const { t } = useLang();
  const { plannedMin, actualMin, completedDays, trackedDays, rate } = weeklyReview(studyHistory || {});
  if (!trackedDays) return null;
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('profile.weeklyReview')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.plannedTime')}</span>
          <span style={{ fontWeight: 700 }}>{hm(plannedMin)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.actualTime')}</span>
          <span style={{ fontWeight: 700 }}>{hm(actualMin)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.completedDays')}</span>
          <span style={{ fontWeight: 700, color: '#2ee6c5' }}>{completedDays} / {trackedDays} ({rate}%)</span>
        </div>
      </div>
    </div>
  );
}

function RhythmCard({ profileDefaults }) {
  const { t } = useLang();
  if (!profileDefaults) return null;
  const { studyTime, bedtime, wake, pref, prioritySubjects } = profileDefaults;

  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('profile.yourRhythm')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.bestStudyTime')}</span>
          <span style={{ fontWeight: 700 }}>{t(VALUE_KEY[studyTime]) || studyTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.sleep')}</span>
          <span style={{ fontWeight: 700 }}>{bedtime}–{wake}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#9a9aab' }}>{t('profile.planningStyle')}</span>
          <span style={{ fontWeight: 700 }}>{t(VALUE_KEY[pref]) || pref}</span>
        </div>
      </div>
      {prioritySubjects?.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '14px -16px' }} />
          <div style={{ fontSize: 11.5, color: '#7a7a8a', marginBottom: 8 }}>{t('profile.prioritySubjects')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {prioritySubjects.map((s) => (
              <span key={s} style={{ fontSize: 12, fontWeight: 650, color: '#c9baff', background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.35)', borderRadius: 999, padding: '6px 12px' }}>{s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LanguageCard() {
  const { lang, setLang, t } = useLang();
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 12 }}>{t('profile.language')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        <Chip label={t('profile.polish')} active={lang === 'pl'} onClick={() => setLang('pl')} style={{ flex: 1, textAlign: 'center' }} />
        <Chip label={t('profile.english')} active={lang === 'en'} onClick={() => setLang('en')} style={{ flex: 1, textAlign: 'center' }} />
      </div>
    </div>
  );
}

export default function Profile({ studentName, schoolPlan, activities, energy, profileDefaults, studyHistory }) {
  const { t } = useLang();
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-.01em' }}>{studentName || 'Ty'}</div>
          <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 2 }}>{t('profile.defaultEnergy', { energy: t(VALUE_KEY[energy]) || energy })}</div>
        </div>
      </div>

      {(schoolPlan || activities?.selected?.length > 0) && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 10 }}>{t('profile.section')}</div>
          {schoolPlan && (
            <div style={{ padding: 14, borderRadius: 16, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>📎</span>
              <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9baff' }}>{schoolPlan.name}</div>
            </div>
          )}
          {activities?.selected?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {activities.selected.map((a) => (
                <span key={a} style={{ fontSize: 12, color: '#c9c9d6', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, padding: '6px 12px' }}>{t(VALUE_KEY[a]) || a}</span>
              ))}
            </div>
          )}
          {activities?.note && (
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>{activities.note}</div>
          )}
        </div>
      )}

      <RhythmCard profileDefaults={profileDefaults} />

      <WeeklyReviewCard studyHistory={studyHistory} />

      <LanguageCard />

      <div style={{ marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('profile.appName')}</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>{t('profile.appDesc')}</div>
      </div>
    </div>
  );
}
