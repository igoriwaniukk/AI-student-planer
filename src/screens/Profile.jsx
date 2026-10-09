import { useRef, useState } from 'react';
import { hm, weeklyReview } from '../lib/plannerLogic';
import { STUDY_TIME_OPTIONS, PREF_OPTIONS, PRIORITY_SUBJECT_OPTIONS, ACTIVITY_OPTIONS } from '../lib/plannerData';
import { aboutMeFacts, ABOUT_NOTE_MAX } from '../lib/aboutMe';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { resizeImageToDataURL } from '../lib/image';
import { Chip, EnergyPicker, BottomSheet } from '../components/ui';
import { PugImg } from '../components/PugMascot';
import { usePremium } from '../lib/premium';
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
          width: 64, height: 64, borderRadius: '50%', cursor: 'pointer', overflow: 'hidden',
          background: photo ? `center/cover no-repeat url(${photo})` : 'rgba(255,255,255,.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800,
        }}
      >
        {!photo && initials}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: '#7c5cff', border: '2px solid #3a2a8f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}
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
      {error && <div style={{ position: 'absolute', top: 70, left: 0, width: 170, fontSize: 10.5, color: '#ffb3b3' }}>{error}</div>}
    </div>
  );
}

function NameField({ studentName, setStudentName }) {
  const premium = usePremium();
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
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        onBlur={save}
        placeholder={t('profile.namePlaceholder')}
        autoFocus
        style={{ fontSize: 24, fontWeight: 800, width: '100%', background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 10, padding: '4px 8px', color: '#fff', fontFamily: 'inherit' }}
      />
    );
  }
  return (
    <div onClick={() => { setDraft(studentName || ''); setEditing(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>{studentName || t('profile.you')}</div>
      {premium.enabled && premium.premium && (
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', padding: '4px 8px', borderRadius: 99, background: 'linear-gradient(90deg,#fff,#e6dfff)', color: '#3a2a8a' }}>{t('premium.badge')}</span>
      )}
      <span style={{ fontSize: 13, color: '#cfc4ff' }}>✎</span>
    </div>
  );
}

function GearButton({ onClick }) {
  return (
    <div onClick={onClick} style={{ width: 38, height: 38, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M9.1 1.6l.32 1.4a5.4 5.4 0 011.5.87l1.36-.46 1 1.73-1.06.97a5.4 5.4 0 010 1.72l1.06.97-1 1.73-1.36-.46a5.4 5.4 0 01-1.5.87l-.32 1.4H6.9l-.32-1.4a5.4 5.4 0 01-1.5-.87l-1.36.46-1-1.73 1.06-.97a5.4 5.4 0 010-1.72L2.72 5.14l1-1.73 1.36.46a5.4 5.4 0 011.5-.87l.32-1.4h2.2z" stroke="#f4f4f7" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="2.1" stroke="#f4f4f7" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

// The purple card at the top: you, what you do, and this week's numbers.
function Hero({ studentName, setStudentName, profilePhoto, setProfilePhoto, activities, studyHistory, planner, streak }) {
  const { t } = useLang();
  const parts = (studentName || t('profile.you')).trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const { plannedMin, actualMin, completedDays, trackedDays } = weeklyReview(studyHistory || {});
  const iam = (activities?.selected || []).map((a) => t(VALUE_KEY[a]) || a).join(' · ');
  const stats = [[hm(plannedMin), t('profile.statPlanned')], [hm(actualMin), t('profile.statStudied')], [completedDays + '/' + trackedDays, t('profile.statDays')]];
  return (
    <div style={{ position: 'relative', marginTop: 4, borderRadius: 26, padding: 18, background: 'linear-gradient(150deg,#6d4dff,#3a2a8f 60%,#1d1640)', boxShadow: '0 14px 34px rgba(60,35,170,.35)' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
      </div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <AvatarPicker photo={profilePhoto} setPhoto={setProfilePhoto} initials={initials} />
        <div style={{ display: 'flex', gap: 8 }}>
          <NotificationBell state={planner.state} streak={streak} inline />
          <GearButton onClick={() => planner.go('settings')} />
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: 12 }}>
        <NameField studentName={studentName} setStudentName={setStudentName} />
        {iam && <div style={{ fontSize: 13, color: '#d9cfff', marginTop: 2 }}>{iam}</div>}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 18, marginTop: 16 }}>
        {stats.map(([n, l]) => (
          <div key={l}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{n}</div>
            <div style={{ fontSize: 11.5, color: '#cfc4ff' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// "Here's what I know about you": the pug says what the AI is told.
function KnowsBubble({ facts }) {
  const { t } = useLang();
  return (
    <div style={{ marginTop: 22, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', flex: 'none', overflow: 'hidden', boxShadow: '0 0 0 2.5px #8b6dff' }}><PugImg size={44} /></div>
      <div style={{ flex: 1, minWidth: 0, borderRadius: '18px 18px 18px 6px', padding: 14, background: '#17142a', border: '1px solid rgba(139,109,255,.35)' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{t('profile.knowsTitle')}</div>
        {facts.length === 0 && <div style={{ fontSize: 13, color: '#a3a3b3', marginTop: 6, lineHeight: 1.4 }}>{t('profile.knowsEmpty')}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: facts.length ? 10 : 0 }}>
          {facts.map((f) => (
            <span key={f.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 650, padding: '6px 10px', borderRadius: 999, background: 'rgba(139,109,255,.14)', color: '#d9cfff', lineHeight: 1.3 }}>
              <span>{f.icon}</span>{f.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// "Tell me more": the student's own note, always sent to the AI.
function NoteCard({ activities, setActivities }) {
  const { t } = useLang();
  const note = activities?.note || '';
  const setNote = (v) => setActivities((a) => ({ selected: [], ...(a || {}), note: v.slice(0, ABOUT_NOTE_MAX) }));
  const addExample = (ex) => setNote((note.trim() ? note.trim() + ' ' : '') + ex);
  return (
    <div style={{ borderRadius: 18, padding: 14, background: '#131119', border: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ fontSize: 13, color: '#9a9aab', lineHeight: 1.4 }}>{t('profile.tellMoreHint')}</div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('profile.tellMorePlaceholder')}
        rows={4}
        style={{ display: 'block', boxSizing: 'border-box', width: '100%', marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(139,109,255,.35)', color: '#e6e6ee', fontSize: 14, lineHeight: 1.45, fontFamily: 'inherit', resize: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {t('profile.noteExamples').split('|').map((ex) => (
            <span key={ex} onClick={() => addExample(ex)} style={{ fontSize: 12, fontWeight: 650, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,.05)', color: '#a3a3b3', cursor: 'pointer' }}>+ {ex}</span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#6b6b7a', flex: 'none', marginTop: 6 }}>{note.length}/{ABOUT_NOTE_MAX}</span>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: '#7a7a8a', margin: '24px 6px 8px', textTransform: 'uppercase' }}>{children}</div>;
}

function Row({ icon, bg, title, value, onClick, first }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 52, cursor: 'pointer', borderTop: first ? 'none' : '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, flex: 'none', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#8a8a99', maxWidth: '45%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <span style={{ color: '#55556a', fontSize: 17 }}>›</span>
    </div>
  );
}

function EditSheet({ title, onClose, children }) {
  const { t } = useLang();
  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750 }}>{title}</div>
      <div style={{ marginTop: 16 }}>{children}</div>
      <div onClick={onClose} style={{ marginTop: 20, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t('profile.done')}</div>
    </BottomSheet>
  );
}

// Every rhythm field writes back to profileDefaults (so it sticks across
// sessions); energy and planning style also apply to the live planner state
// immediately, since those two double as today's actual settings.
function RhythmList({ profileDefaults, setProfileDefaults, activities, setActivities, planner }) {
  const { t } = useLang();
  const [open, setOpen] = useState(null);
  const d = profileDefaults || {};
  const label = (v) => t(VALUE_KEY[v]) || v;
  const set = (field, value) => setProfileDefaults((p) => ({ ...p, [field]: value }));
  const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : list.concat(v));
  const subjects = d.prioritySubjects || [];
  const iam = activities?.selected || [];
  const rows = [
    { key: 'energy', icon: '⚡', bg: 'rgba(245,165,36,.18)', title: t('profile.energyLabel'), value: label(planner.state.energy) },
    { key: 'studyTime', icon: '🌙', bg: 'rgba(139,109,255,.2)', title: t('profile.bestStudyTime'), value: d.studyTime ? label(d.studyTime) : '' },
    { key: 'sleep', icon: '😴', bg: 'rgba(46,230,197,.16)', title: t('profile.sleep'), value: d.bedtime && d.wake ? d.bedtime + '–' + d.wake : '' },
    { key: 'pref', icon: '🧘', bg: 'rgba(53,208,127,.16)', title: t('profile.planningStyle'), value: d.pref ? label(d.pref) : '' },
    { key: 'subjects', icon: '⭐', bg: 'rgba(255,107,129,.16)', title: t('profile.prioritySubjects'), value: subjects.map(label).join(', ') || t('profile.none') },
    { key: 'iam', icon: '🎓', bg: 'rgba(143,186,255,.18)', title: t('profile.iam'), value: iam.map(label).join(', ') || t('profile.none') },
  ];
  const current = rows.find((r) => r.key === open);
  const chips = (options, active, onPick) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => <Chip key={o} label={label(o)} active={active(o)} onClick={() => onPick(o)} />)}
    </div>
  );

  return (
    <>
      <div style={{ borderRadius: 18, background: '#131119', border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
        {rows.map((r, i) => <Row key={r.key} {...r} first={i === 0} onClick={() => setOpen(r.key)} />)}
      </div>
      {current && (
        <EditSheet title={current.title} onClose={() => setOpen(null)}>
          {open === 'energy' && <EnergyPicker value={planner.state.energy} onChange={(v) => { planner.update({ energy: v }); set('energy', v); }} emoji />}
          {open === 'studyTime' && chips(STUDY_TIME_OPTIONS, (o) => d.studyTime === o, (o) => set('studyTime', o))}
          {open === 'sleep' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('onb.step3.bedtimeLabel')}</div>
                <WheelTimePicker value={d.bedtime} onChange={(v) => set('bedtime', v)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: '#7a7a8a', marginBottom: 6, textAlign: 'center' }}>{t('onb.step3.wakeLabel')}</div>
                <WheelTimePicker value={d.wake} onChange={(v) => set('wake', v)} />
              </div>
            </div>
          )}
          {open === 'pref' && chips(PREF_OPTIONS, (o) => d.pref === o, (o) => { planner.update({ pref: o }); set('pref', o); })}
          {open === 'subjects' && chips(PRIORITY_SUBJECT_OPTIONS, (o) => subjects.includes(o), (o) => set('prioritySubjects', toggleIn(subjects, o)))}
          {open === 'iam' && chips(ACTIVITY_OPTIONS, (o) => iam.includes(o), (o) => setActivities((a) => ({ note: '', ...(a || {}), selected: toggleIn(a?.selected || [], o) })))}
        </EditSheet>
      )}
    </>
  );
}

export default function Profile({ studentName, setStudentName, profilePhoto, setProfilePhoto, activities, setActivities, planner, profileDefaults, setProfileDefaults, studyHistory, recurringActivities, streak }) {
  const { t } = useLang();
  const facts = aboutMeFacts({ activities, defaults: profileDefaults, energy: planner.state.energy, recurringActivities });

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 18px 120px', position: 'relative', zIndex: 1 }}>
      <Hero
        studentName={studentName} setStudentName={setStudentName} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto}
        activities={activities} studyHistory={studyHistory} planner={planner} streak={streak}
      />
      <KnowsBubble facts={facts} />
      <Label>{t('profile.tellMore')}</Label>
      <NoteCard activities={activities} setActivities={setActivities} />
      <Label>{t('profile.yourRhythm')}</Label>
      <RhythmList profileDefaults={profileDefaults} setProfileDefaults={setProfileDefaults} activities={activities} setActivities={setActivities} planner={planner} />
    </div>
  );
}
