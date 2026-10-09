import { useState } from 'react';
import { ENERGY_OPTIONS, PREF_OPTIONS, STUDY_TIME_OPTIONS, PRIORITY_SUBJECT_OPTIONS, RECUR_DAYS, ACTIVITY_OPTIONS } from '../lib/plannerData';
import { VALUE_KEY, DAY_KEY, LANGS, LANG_NAMES, LANG_FLAGS } from '../lib/i18n';
import { timeStrToMinutes } from '../lib/plannerLogic';
import { useLang } from '../lib/useLang';
import WheelTimePicker from '../components/WheelTimePicker';
import { BottomSheet } from '../components/ui';
import { PugLive } from '../components/PugMascot';


const TOTAL_STEPS = 6;

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className="btn"
      style={active ? { background: 'rgba(139,109,255,.18)', borderColor: '#8b6dff', color: '#a58cff' } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// One segment per step, filled up to the current one.
function Progress({ step }) {
  const { t } = useLang();
  return (
    <div role="progressbar" aria-label={t('onb.stepOf', { step: step + 1, total: TOTAL_STEPS })} style={{ flex: 1, display: 'flex', gap: 5 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 9, background: i <= step ? 'linear-gradient(90deg,#8b6dff,#a58cff)' : 'rgba(255,255,255,.08)', transition: 'background .3s ease' }} />
      ))}
    </div>
  );
}

// The language sits in a small pill on the first screen (the device
// language is already picked); tapping it opens the full list.
function LanguageButton() {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#16131f', border: '1px solid rgba(255,255,255,.1)', color: '#f4f4f7', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}
      >
        <span>{LANG_FLAGS[lang]}</span>{LANG_NAMES[lang]}<span style={{ color: '#8a8a99', fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <BottomSheet>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 750 }}>{t('settings.appLanguage')}</div>
            <span onClick={() => setOpen(false)} style={{ fontSize: 15, color: '#8a8a99', cursor: 'pointer', padding: 4 }}>✕</span>
          </div>
          <div style={{ marginTop: 12 }}>
            {LANGS.map((code, i) => (
              <div
                key={code}
                onClick={() => { setLang(code); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20 }}>{LANG_FLAGS[code]}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: lang === code ? '#c9baff' : '#f4f4f7' }}>{LANG_NAMES[code]}</span>
                {lang === code && <span style={{ color: '#a58cff', fontSize: 18, fontWeight: 800 }}>✓</span>}
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export default function Onboarding({ onComplete }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [nameDraft, setNameDraft] = useState('');
  // Keyed by day name (see RECUR_DAYS) — present with {start, end} only for
  // days the student actually has school, so a homeschooled/no-fixed-hours
  // student can just leave every day off instead of us inventing one.
  const [schoolDays, setSchoolDays] = useState({});
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activitiesNote, setActivitiesNote] = useState('');
  const [studyTime, setStudyTime] = useState('Wieczorem');
  const [bedtime, setBedtime] = useState('22:30');
  const [wake, setWake] = useState('06:30');
  const [energy, setEnergy] = useState('Normalna');
  const [pref, setPref] = useState('Wolny wieczór');
  const [prioritySubjects, setPrioritySubjects] = useState([]);

  function toggleSchoolDay(day) {
    setSchoolDays((prev) => {
      const next = { ...prev };
      if (next[day]) delete next[day];
      else next[day] = { start: '08:00', end: '15:00' };
      return next;
    });
  }
  function setSchoolDayTime(day, field, value) {
    setSchoolDays((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function toggleInList(value, list, setList) {
    setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function finish() {
    // Turned into the same {day, start, dur} shape as a recurring activity
    // (see QuickAddSheet.jsx) so school hours block out real schedule time
    // exactly like any other recurring activity, with no separate concept
    // in the scheduling engine — a day with end <= start is simply dropped.
    const schoolLabel = t('onb.step1.schoolActivityName');
    const schoolHours = Object.entries(schoolDays)
      .map(([day, { start, end }]) => ({ name: schoolLabel, day, start, dur: timeStrToMinutes(end) - timeStrToMinutes(start) }))
      .filter((h) => h.dur > 0);

    onComplete({
      name: nameDraft.trim(),
      schoolHours,
      activities: { selected: selectedActivities, note: activitiesNote.trim() },
      profile: { studyTime, bedtime, wake, energy, pref, prioritySubjects },
    });
  }

  return (
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 'calc(var(--safe-top) + 16px) 20px calc(var(--safe-bottom) + 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 34 }}>
        <Progress step={step} />
        {step === 0 && <LanguageButton />}
      </div>
      {/* auto margins centre a short step and let a long one scroll from its top */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 20 }}>
      <div style={step === 0 ? { flex: 1, display: 'flex', flexDirection: 'column' } : { margin: 'auto 0' }}>

      {step === 0 && (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 0 24px' }}>
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,109,255,.45),transparent 65%)' }} />
              <PugLive size={150} style={{ position: 'relative', boxShadow: '0 0 0 4px #8b6dff, 0 20px 50px rgba(109,77,255,.5)' }} />
            </div>
            <div style={{ marginTop: 22, padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#16131f', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, color: '#c9c9d6', animation: 'fadeUp .4s ease .2s both' }}>
              {t('onb.pugHello')}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginTop: 20 }}>{t('onb.imPulgo')}</div>
            <div style={{ fontSize: 15, color: '#8a8a99', marginTop: 6 }}>{t('onb.callYou')}</div>
          </div>
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDraft.trim()) setStep(1);
            }}
          >
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t('onb.namePlaceholder')} style={{ height: 54, borderRadius: 16, fontSize: 16 }} />
            <button type="submit" className="btn btn-primary" style={{ height: 56, borderRadius: 17, fontSize: 16, opacity: nameDraft.trim() ? 1 : 0.55 }}>{t('onb.letsStart')} →</button>
          </form>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>{t('onb.step1.title')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            {t('onb.step1.desc')}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RECUR_DAYS.map((day) => {
              const on = !!schoolDays[day];
              return (
                <div key={day} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Chip label={t(DAY_KEY[day]) || day} active={on} onClick={() => toggleSchoolDay(day)} />
                  {on && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
                      <WheelTimePicker value={schoolDays[day].start} onChange={(v) => setSchoolDayTime(day, 'start', v)} />
                      <span style={{ color: '#8a8a99' }}>–</span>
                      <WheelTimePicker value={schoolDays[day].end} onChange={(v) => setSchoolDayTime(day, 'end', v)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              {Object.keys(schoolDays).length ? t('onb.next') : t('onb.skip')}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>{t('onb.step2.title')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            {t('onb.step2.desc')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {ACTIVITY_OPTIONS.map((activity) => (
              <Chip key={activity} label={t(VALUE_KEY[activity]) || activity} active={selectedActivities.includes(activity)} onClick={() => toggleInList(activity, selectedActivities, setSelectedActivities)} />
            ))}
          </div>
          <label style={{ fontSize: 12, color: '#8a8a99', marginTop: 16, display: 'block' }}>
            {t('onb.step2.noteLabel')}
            <textarea
              rows={3}
              value={activitiesNote}
              onChange={(e) => setActivitiesNote(e.target.value)}
              placeholder={t('onb.step2.notePlaceholder')}
              style={{ marginTop: 4, resize: 'vertical' }}
            />
          </label>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setStep(3)}>
            {t('onb.next')}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>{t('onb.step3.title')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            {t('onb.step3.desc')}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>{t('onb.step3.studyTimeQ')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {STUDY_TIME_OPTIONS.map((opt) => (
              <Chip key={opt} label={t(VALUE_KEY[opt]) || opt} active={studyTime === opt} onClick={() => setStudyTime(opt)} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8a8a99', marginBottom: 6 }}>{t('onb.step3.bedtimeLabel')}</div>
              <WheelTimePicker value={bedtime} onChange={setBedtime} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8a8a99', marginBottom: 6 }}>{t('onb.step3.wakeLabel')}</div>
              <WheelTimePicker value={wake} onChange={setWake} />
            </div>
          </div>

          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(4)}>
            {t('onb.next')}
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>{t('onb.step4.title')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            {t('onb.step4.desc')}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>{t('onb.step4.energyQ')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {ENERGY_OPTIONS.map((opt) => (
              <Chip key={opt} label={t(VALUE_KEY[opt]) || opt} active={energy === opt} onClick={() => setEnergy(opt)} />
            ))}
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', marginTop: 18 }}>{t('onb.step4.prefQ')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {PREF_OPTIONS.map((opt) => (
              <Chip key={opt} label={t(VALUE_KEY[opt]) || opt} active={pref === opt} onClick={() => setPref(opt)} />
            ))}
          </div>

          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setStep(5)}>
            {t('onb.next')}
          </button>
        </>
      )}

      {step === 5 && (
        <>
          <div style={{ fontSize: 22, fontWeight: 750 }}>{t('onb.step5.title')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>
            {t('onb.step5.desc')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {PRIORITY_SUBJECT_OPTIONS.map((s) => (
              <Chip key={s} label={t(VALUE_KEY[s]) || s} active={prioritySubjects.includes(s)} onClick={() => toggleInList(s, prioritySubjects, setPrioritySubjects)} />
            ))}
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={finish}>
            {t('onb.finish')}
          </button>
        </>
      )}
      </div>
      </div>
    </div>
  );
}
