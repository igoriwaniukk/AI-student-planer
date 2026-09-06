import { useState } from 'react';
import { hm, weeklyReview, upcomingExams, computeStreak } from '../lib/plannerLogic';
import { STUDY_TIME_OPTIONS, PREF_OPTIONS, PRIORITY_SUBJECT_OPTIONS } from '../lib/plannerData';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { useCustomReminders, resetAppData } from '../lib/store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Chip, EnergyPicker } from '../components/ui';

function NameField({ studentName, setStudentName }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(studentName || '');

  function save() {
    const v = draft.trim();
    if (v) setStudentName(v);
    setEditing(false);
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          onBlur={save}
          placeholder={t('profile.namePlaceholder')}
          autoFocus
          style={{ fontSize: 20, fontWeight: 750, flex: 1 }}
        />
      </div>
    );
  }
  return (
    <div
      onClick={() => { setDraft(studentName || ''); setEditing(true); }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
    >
      <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-.01em' }}>{studentName || 'Ty'}</div>
      <span style={{ fontSize: 13, color: '#6b6b7a' }}>✎</span>
    </div>
  );
}

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

// Editable version of the old read-only rhythm card — every field here
// writes back to profileDefaults (so it sticks across sessions); energy and
// planning style also apply to the live planner state immediately, since
// those two double as today's actual settings, not just future defaults.
function EditableRhythmCard({ profileDefaults, setProfileDefaults, planner }) {
  const { t } = useLang();
  if (!profileDefaults) return null;
  const { studyTime, bedtime, wake, pref, prioritySubjects } = profileDefaults;

  function set(field, value) {
    setProfileDefaults((d) => ({ ...d, [field]: value }));
  }
  function toggleSubject(s) {
    setProfileDefaults((d) => {
      const list = d.prioritySubjects || [];
      return { ...d, prioritySubjects: list.includes(s) ? list.filter((x) => x !== s) : list.concat(s) };
    });
  }

  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('profile.yourRhythm')}</div>

      <div style={{ fontSize: 11.5, color: '#7a7a8a', margin: '16px 0 8px' }}>{t('profile.energyLabel')}</div>
      <EnergyPicker value={planner.state.energy} onChange={(v) => { planner.update({ energy: v }); set('energy', v); }} emoji />

      <div style={{ fontSize: 11.5, color: '#7a7a8a', margin: '16px 0 8px' }}>{t('profile.bestStudyTime')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STUDY_TIME_OPTIONS.map((opt) => (
          <Chip key={opt} label={t(VALUE_KEY[opt]) || opt} active={studyTime === opt} onClick={() => set('studyTime', opt)} />
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: '#7a7a8a', margin: '16px 0 8px' }}>{t('profile.sleep')}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <input type="time" value={bedtime} onChange={(e) => set('bedtime', e.target.value)} style={{ flex: 1 }} />
        <input type="time" value={wake} onChange={(e) => set('wake', e.target.value)} style={{ flex: 1 }} />
      </div>

      <div style={{ fontSize: 11.5, color: '#7a7a8a', margin: '16px 0 8px' }}>{t('profile.planningStyle')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PREF_OPTIONS.map((opt) => (
          <Chip key={opt} label={t(VALUE_KEY[opt]) || opt} active={pref === opt} onClick={() => { planner.update({ pref: opt }); set('pref', opt); }} />
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '16px -16px' }} />
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginBottom: 8 }}>{t('profile.prioritySubjects')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PRIORITY_SUBJECT_OPTIONS.map((s) => (
          <Chip key={s} label={t(VALUE_KEY[s]) || s} active={(prioritySubjects || []).includes(s)} onClick={() => toggleSubject(s)} />
        ))}
      </div>
    </div>
  );
}

function SettingsCard({ planner, studyHistory }) {
  const { t, lang } = useLang();
  const [reminders] = useCustomReminders();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const streak = computeStreak(studyHistory || {});
  const hasUpcomingExam = upcomingExams(planner.state).some((e) => e.daysUntil >= 0 && e.daysUntil <= 14);
  const { pushStatus, togglePush } = usePushNotifications({ streak, hasUpcomingExam, reminders: reminders.map((r) => r.text), lang });

  const pushNote = {
    unsupported: t('notif.pushUnsupported'),
    denied: t('notif.pushDenied'),
    error: t('notif.pushError'),
    subscribed: t('notif.pushOnNote'),
    idle: t('notif.pushOffNote'),
  }[pushStatus];

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginBottom: 12 }}>{t('profile.settings')}</div>

      <div
        onClick={pushStatus === 'unsupported' ? undefined : togglePush}
        style={{ padding: '12px 14px', borderRadius: 15, background: 'rgba(124,92,255,.08)', border: '1px solid rgba(124,92,255,.25)', cursor: pushStatus === 'unsupported' ? 'default' : 'pointer' }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#c9baff' }}>
          🔔 {pushStatus === 'subscribed' ? t('notif.disablePush') : t('notif.enablePush')}
        </div>
        <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{pushNote}</div>
      </div>

      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 15, background: 'rgba(255,90,90,.06)', border: '1px solid rgba(255,90,90,.25)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ff9a9a' }}>🗑 {t('profile.resetData')}</div>
        <div style={{ fontSize: 11, color: '#8a8a99', marginTop: 4, lineHeight: 1.4 }}>{t('profile.resetDataDesc')}</div>
        {confirmingReset ? (
          <div style={{ marginTop: 11 }}>
            <div style={{ fontSize: 11.5, color: '#ff9a9a', marginBottom: 9 }}>{t('profile.resetConfirm')}</div>
            <div style={{ display: 'flex', gap: 9 }}>
              <div onClick={() => setConfirmingReset(false)} style={{ flex: 1, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}>{t('home.cancel')}</div>
              <div onClick={resetAppData} style={{ flex: 1.3, height: 40, borderRadius: 12, background: '#ff5a5a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>{t('profile.resetConfirmBtn')}</div>
            </div>
          </div>
        ) : (
          <div onClick={() => setConfirmingReset(true)} style={{ marginTop: 11, height: 38, borderRadius: 12, background: 'rgba(255,90,90,.14)', border: '1px solid rgba(255,90,90,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, color: '#ff9a9a', cursor: 'pointer' }}>{t('profile.resetData')}</div>
        )}
      </div>
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

export default function Profile({ studentName, setStudentName, schoolPlan, activities, planner, profileDefaults, setProfileDefaults, studyHistory }) {
  const { t } = useLang();
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <div style={{ width: 58, height: 58, flex: 'none', borderRadius: '50%', background: 'linear-gradient(150deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <NameField studentName={studentName} setStudentName={setStudentName} />
          <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 2 }}>{t('profile.defaultEnergy', { energy: t(VALUE_KEY[planner.state.energy]) || planner.state.energy })}</div>
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

      <EditableRhythmCard profileDefaults={profileDefaults} setProfileDefaults={setProfileDefaults} planner={planner} />

      <WeeklyReviewCard studyHistory={studyHistory} />

      <SettingsCard planner={planner} studyHistory={studyHistory} />

      <LanguageCard />

      <div style={{ marginTop: 16, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('profile.appName')}</div>
        <div style={{ fontSize: 12, color: '#8a8a99', marginTop: 6, lineHeight: 1.5 }}>{t('profile.appDesc')}</div>
      </div>
    </div>
  );
}
