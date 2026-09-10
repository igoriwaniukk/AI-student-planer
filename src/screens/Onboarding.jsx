import { useState } from 'react';
import { ENERGY_OPTIONS, PREF_OPTIONS, STUDY_TIME_OPTIONS, PRIORITY_SUBJECT_OPTIONS, RECUR_DAYS } from '../lib/plannerData';
import { VALUE_KEY, DAY_KEY } from '../lib/i18n';
import { timeStrToMinutes } from '../lib/plannerLogic';
import { useLang } from '../lib/useLang';

const ACTIVITY_OPTIONS = [
  'Szkoła / liceum',
  'Korepetycje',
  'Kółko naukowe',
  'Sport / treningi',
  'Praca',
  'Kurs językowy',
];

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

function LanguagePicker() {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 14 }}>
      <Chip label="Polski" active={lang === 'pl'} onClick={() => setLang('pl')} />
      <Chip label="English" active={lang === 'en'} onClick={() => setLang('en')} />
    </div>
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
    <div className="app-shell sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '24px 20px' }}>
      {step === 0 && <LanguagePicker />}
      <div style={{ fontSize: 11.5, color: '#6f6f7d', fontWeight: 650, marginBottom: 10 }}>
        {t('onb.stepOf', { step: step + 1, total: TOTAL_STEPS })}
      </div>

      {step === 0 && (
        <>
          <div style={{ fontSize: 24, fontWeight: 750 }}>{t('onb.hey')}</div>
          <div style={{ fontSize: 13.5, color: '#8a8a99', marginTop: 8 }}>{t('onb.step0.q')}</div>
          <form
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDraft.trim()) setStep(1);
            }}
          >
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t('onb.namePlaceholder')} autoFocus />
            <button type="submit" className="btn btn-primary">{t('onb.letsStart')}</button>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                      <input type="time" value={schoolDays[day].start} onChange={(e) => setSchoolDayTime(day, 'start', e.target.value)} style={{ flex: 1 }} />
                      <span style={{ color: '#8a8a99' }}>–</span>
                      <input type="time" value={schoolDays[day].end} onChange={(e) => setSchoolDayTime(day, 'end', e.target.value)} style={{ flex: 1 }} />
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
            <label style={{ flex: 1, fontSize: 12, color: '#8a8a99' }}>
              {t('onb.step3.bedtimeLabel')}
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} style={{ marginTop: 6 }} />
            </label>
            <label style={{ flex: 1, fontSize: 12, color: '#8a8a99' }}>
              {t('onb.step3.wakeLabel')}
              <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} style={{ marginTop: 6 }} />
            </label>
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
  );
}
