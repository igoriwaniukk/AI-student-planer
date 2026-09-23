import { useRef, useState } from 'react';
import { hm, weeklyReview, computeStreak, computeTotalPoints } from '../lib/plannerLogic';
import { STUDY_TIME_OPTIONS, PREF_OPTIONS, PRIORITY_SUBJECT_OPTIONS } from '../lib/plannerData';
import { ACHIEVEMENTS, computeUnlockedAchievements } from '../lib/achievements';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { resizeImageToDataURL } from '../lib/image';
import { Chip, EnergyPicker, AchievementMedal } from '../components/ui';
import AmbientGlow from '../components/AmbientGlow';
import NotificationBell from '../components/NotificationBell';
import WheelTimePicker from '../components/WheelTimePicker';

// Clicking the avatar (or its camera badge) opens the device's photo/file
// picker; the chosen image is downscaled client-side (see lib/image.js)
// before being stored, so a multi-MB phone photo doesn't blow up
// localStorage. The small ✕ badge clears it back to the initials avatar.
function AvatarPicker({ photo, setPhoto, initials }) {
  const { t } = useLang();
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      setPhoto(await resizeImageToDataURL(file));
    } catch {
      setError(t('profile.photoError'));
    }
  }

  return (
    <div style={{ position: 'relative', flex: 'none' }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 58, height: 58, borderRadius: '50%', cursor: 'pointer', overflow: 'hidden',
          background: photo ? `center/cover no-repeat url(${photo})` : 'linear-gradient(150deg,#8b6dff,#6d4dff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700,
        }}
      >
        {!photo && initials}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: '#7c5cff', border: '2px solid #08080c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}
      >
        📷
      </div>
      {photo && (
        <span
          onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
          style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#1a1a24', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, color: '#c9c9d6' }}
        >
          ✕
        </span>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {error && <div style={{ position: 'absolute', top: 64, left: 0, width: 170, fontSize: 10.5, color: '#ff9a9a' }}>{error}</div>}
    </div>
  );
}

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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('onb.step3.bedtimeLabel')}</div>
          <WheelTimePicker value={bedtime} onChange={(v) => set('bedtime', v)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('onb.step3.wakeLabel')}</div>
          <WheelTimePicker value={wake} onChange={(v) => set('wake', v)} />
        </div>
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

function AchievementDetail({ achievement, unlocked, onClose }) {
  const { t } = useLang();
  if (!achievement) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(6,6,10,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 340, padding: 28, borderRadius: 24, background: '#101018', border: '1px solid rgba(255,255,255,.1)', textAlign: 'center', animation: 'stepIconPop .4s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ marginBottom: 14 }}><AchievementMedal icon={achievement.icon} unlocked={unlocked} size={64} /></div>
        <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.1em', color: unlocked ? '#f5a524' : '#7a7a8a' }}>{unlocked ? t('profile.unlocked') : t('profile.locked')}</div>
        <div style={{ fontSize: 19, fontWeight: 750, marginTop: 8 }}>{t(achievement.titleKey)}</div>
        <div style={{ fontSize: 13, color: '#a3a3b3', marginTop: 8, lineHeight: 1.5 }}>{t(achievement.descKey)}</div>
        <div onClick={onClose} style={{ marginTop: 20, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t('home.great')}</div>
      </div>
    </div>
  );
}

// All achievements — locked and unlocked — so the student can see what
// they've earned (per their tap on the "achievement unlocked" popup) and
// what's still ahead, instead of only ever seeing the one-off unlock toast.
function AchievementsCard({ studyHistory, energyLog, recurringActivities }) {
  const { t } = useLang();
  const [selected, setSelected] = useState(null);
  const streak = computeStreak(studyHistory || {});
  const points = computeTotalPoints(studyHistory || {}, energyLog || []);
  const stats = {
    streak,
    points,
    completedDays: Object.values(studyHistory || {}).filter((e) => e.completed).length,
    energyCheckins: (energyLog || []).length,
    recurringCount: (recurringActivities || []).length,
  };
  const unlockedIds = new Set(computeUnlockedAchievements(stats).map((a) => a.id));

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <span style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('profile.achievements')}</span>
        <span style={{ fontSize: 11.5, fontWeight: 650, color: '#a58cff' }}>{unlockedIds.size}/{ACHIEVEMENTS.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          return (
            <div
              key={a.id}
              onClick={() => setSelected(a)}
              style={{
                padding: '14px 8px', borderRadius: 15, textAlign: 'center', cursor: 'pointer',
                background: unlocked ? 'rgba(240,169,60,.1)' : 'rgba(255,255,255,.03)',
                border: '1.5px solid ' + (unlocked ? 'rgba(240,169,60,.45)' : 'rgba(255,255,255,.08)'),
              }}
            >
              <AchievementMedal icon={a.icon} unlocked={unlocked} size={40} />
              <div style={{ fontSize: 10.5, fontWeight: 650, marginTop: 6, color: unlocked ? '#f7dfa8' : '#7a7a8a', lineHeight: 1.3 }}>{t(a.titleKey)}</div>
            </div>
          );
        })}
      </div>
      <AchievementDetail achievement={selected} unlocked={selected ? unlockedIds.has(selected.id) : false} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function Profile({ studentName, setStudentName, profilePhoto, setProfilePhoto, schoolPlan, activities, planner, profileDefaults, setProfileDefaults, studyHistory, energyLog, recurringActivities, state, streak }) {
  const { t } = useLang();
  const parts = (studentName || 'Ty').trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
    <AmbientGlow />
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 108px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
        <AvatarPicker photo={profilePhoto} setPhoto={setProfilePhoto} initials={initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <NameField studentName={studentName} setStudentName={setStudentName} />
          <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 2 }}>{t('profile.defaultEnergy', { energy: t(VALUE_KEY[planner.state.energy]) || planner.state.energy })}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <NotificationBell state={state} streak={streak} inline />
          <div
            onClick={() => planner.go('settings')}
            style={{ width: 38, height: 38, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M9.1 1.6l.32 1.4a5.4 5.4 0 011.5.87l1.36-.46 1 1.73-1.06.97a5.4 5.4 0 010 1.72l1.06.97-1 1.73-1.36-.46a5.4 5.4 0 01-1.5.87l-.32 1.4H6.9l-.32-1.4a5.4 5.4 0 01-1.5-.87l-1.36.46-1-1.73 1.06-.97a5.4 5.4 0 010-1.72L2.72 5.14l1-1.73 1.36.46a5.4 5.4 0 011.5-.87l.32-1.4h2.2z" stroke="#c9c9d6" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2.1" stroke="#c9c9d6" strokeWidth="1.2" />
            </svg>
          </div>
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

      <AchievementsCard studyHistory={studyHistory} energyLog={energyLog} recurringActivities={recurringActivities} />
    </div>
    </>
  );
}
