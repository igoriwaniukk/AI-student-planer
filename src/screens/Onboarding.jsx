import { useState } from 'react';
import { PREF_OPTIONS, STUDY_TIME_OPTIONS, PRIORITY_SUBJECT_OPTIONS, RECUR_DAYS, ACTIVITY_OPTIONS } from '../lib/plannerData';
import { VALUE_KEY, DAY_KEY, LANGS, LANG_NAMES, LANG_FLAGS } from '../lib/i18n';
import { timeStrToMinutes } from '../lib/plannerLogic';
import { iconForActivity, iconForSubject } from '../lib/taskAuto';
import { KEYS, STORAGE_CHANGED_EVENT } from '../lib/store';
import { useLang } from '../lib/useLang';
import { STARTERS } from '../lib/pugWorld/catalog.js';
import { chooseStarter, EMPTY } from '../lib/pugWorld/logic.js';
import { pugPreviewOn } from '../lib/pugWorld/events';
import WheelTimePicker from '../components/WheelTimePicker';
import { BottomSheet } from '../components/ui';
import { PugLive } from '../components/PugMascot';
import Dog2D from '../components/pugWorld/Dog2D';
import DogThumb from '../components/pugWorld/DogThumb';
import { ColorStage } from '../components/pugWorld/bits';
import { dogName } from '../components/pugWorld/names';

// The first questions, one per screen: Pulgo (the pug) asks in a speech
// bubble, you tap big cards, a green Continue at the bottom. Name → school
// (days + one time for all, or per day) → your day (when you study best,
// sleep) → what you do → subjects that matter → what matters most → and,
// while the dog game is on, pick your study buddy (it then lives in the app
// right away; its welcome chest opens on Home).
const STUDY_EMOJI = { Rano: '🌅', 'Popołudniu': '☀️', Wieczorem: '🌙' };
const STUDY_SUB = { Rano: 'onb.a.morningSub', 'Popołudniu': 'onb.a.afternoonSub', Wieczorem: 'onb.a.eveningSub' };
const PREF_EMOJI = { 'Wolny wieczór': '🛋️', 'Najpierw najtrudniejsze': '💪', 'Więcej krótkich przerw': '☕' };
const PREF_SUB = { 'Wolny wieczór': 'onb.a.prefEveningSub', 'Najpierw najtrudniejsze': 'onb.a.prefHardSub', 'Więcej krótkich przerw': 'onb.a.prefBreaksSub' };
const WEEKDAYS = RECUR_DAYS.slice(0, 5);
const BLUE = ['#1cb0f6', '#1899d6'];
const ORANGE = ['#ff9600', '#e08500'];
// The onboarding's main colour [light, base, shade]: progress bar, Continue,
// the chosen answer and the buddy's stage.
const ACCENT = ['#a58cff', '#7c5cff', '#5b3ee0'];
const MAIN = [ACCENT[1], ACCENT[2]];

// A thick green bar with the step number; a back arrow after the first step.
function Progress({ step, total, onBack }) {
  const { t } = useLang();
  return (
    <div role="progressbar" aria-label={t('onb.stepOf', { step: step + 1, total })} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
      {onBack ? <span onClick={onBack} style={{ fontSize: 24, color: '#8a8a99', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>‹</span> : null}
      <div style={{ flex: 1, height: 14, borderRadius: 99, background: '#1f1c2b', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: ((step + 1) / total) * 100 + '%', height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT[1]}, ${ACCENT[0]})`, transition: 'width .3s ease' }}>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 3, height: 3, borderRadius: 9, background: 'rgba(255,255,255,.35)' }} />
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 900, color: '#8a8a99' }}>{step + 1}/{total}</span>
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

// Pulgo with a speech bubble.
function PugSays({ children, size = 84 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 18 }}>
      <PugLive size={size} style={{ flex: 'none', boxShadow: '0 0 0 3px #8b6dff' }} />
      <div style={{ flex: 1, marginBottom: size * 0.25, padding: '12px 14px', borderRadius: '18px 18px 18px 4px', background: '#fff', color: '#2a2440', fontSize: 16, fontWeight: 800, lineHeight: 1.35, animation: 'fadeUp .3s ease both' }}>
        {children}
      </div>
    </div>
  );
}

// A big tap card (emoji, label, small line under it).
function TapCard({ emoji, label, sub, on, pal = BLUE, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 18, marginBottom: 12, cursor: 'pointer', ...(on ? { background: pal[0] + '22', border: `2.5px solid ${pal[0]}`, boxShadow: `0 4px 0 ${pal[1]}` } : { background: '#17141f', border: '2.5px solid #2a2638', boxShadow: '0 4px 0 #0f0e17' }) }}
    >
      <span style={{ fontSize: 28, flex: 'none' }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16.5, fontWeight: 900 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a3a3b3', marginTop: 2 }}>{sub}</div>}
      </div>
      {on && <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: pal[0], display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14 }}>✓</span>}
    </div>
  );
}

// A chunky chip (several can be on).
function TapChip({ label, on, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '11px 14px', borderRadius: 16, fontSize: 14.5, fontWeight: 900, cursor: 'pointer', marginBottom: 3, ...(on ? { background: BLUE[0], boxShadow: `0 3px 0 ${BLUE[1]}`, color: '#fff' } : { background: '#17141f', boxShadow: '0 3px 0 #0f0e17', color: '#d9d9e6' }) }}>
      {label}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: '.08em', color: '#8a8a99', margin: '16px 0 10px' }}>{children}</div>;
}

export default function Onboarding({ onComplete }) {
  const { t } = useLang();
  const withDog = pugPreviewOn();
  const total = withDog ? 7 : 6;
  const [step, setStep] = useState(0);
  const [nameDraft, setNameDraft] = useState('');
  // School: the days (Mon–Fri to start) with one time for all — or, after
  // "Different hours on some days?", a time per day.
  const [days, setDays] = useState(WEEKDAYS);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('15:00');
  const [perDay, setPerDay] = useState(null); // { [day]: { start, end } } when set per day
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activitiesNote, setActivitiesNote] = useState('');
  const [studyTime, setStudyTime] = useState('Wieczorem');
  const [bedtime, setBedtime] = useState('22:30');
  const [wake, setWake] = useState('06:30');
  const [pref, setPref] = useState('Wolny wieczór');
  const [prioritySubjects, setPrioritySubjects] = useState([]);
  const [starter, setStarter] = useState(STARTERS[0]);
  const name = nameDraft.trim();

  const toggle = (value, setList) => setList((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  const schoolDays = perDay || Object.fromEntries(days.map((d) => [d, { start, end }]));
  const togglePerDay = (day) => setPerDay((prev) => {
    const next = { ...prev };
    if (next[day]) delete next[day]; else next[day] = { start, end };
    return next;
  });

  function finish() {
    // Turned into the same {day, start, dur} shape as a recurring activity
    // (see QuickAddSheet.jsx) so school hours block out real schedule time
    // exactly like any other recurring activity, with no separate concept
    // in the scheduling engine — a day with end <= start is simply dropped.
    const schoolLabel = t('onb.step1.schoolActivityName');
    const schoolHours = Object.entries(schoolDays)
      .map(([day, h]) => ({ name: schoolLabel, day, start: h.start, dur: timeStrToMinutes(h.end) - timeStrToMinutes(h.start) }))
      .filter((h) => h.dur > 0);
    // The study buddy: saved like picking a starter in My dogs (the game's
    // state isn't loaded yet — it reads this when the app opens).
    if (withDog) {
      try {
        const cur = JSON.parse(localStorage.getItem(KEYS.pugWorld) || 'null');
        localStorage.setItem(KEYS.pugWorld, JSON.stringify(chooseStarter(cur || EMPTY, starter)));
        window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT));
      } catch { /* storage blocked: pick the dog later in My dogs */ }
    }
    onComplete({
      name,
      schoolHours,
      activities: { selected: selectedActivities, note: activitiesNote.trim() },
      profile: { studyTime, bedtime, wake, pref, prioritySubjects },
    });
  }
  const next = () => (step + 1 >= total ? finish() : setStep(step + 1));
  const canGo = step !== 0 || !!name;
  const noSchool = step === 1 && !Object.keys(schoolDays).length;
  const buttonLabel = step === total - 1
    ? (withDog ? t('onb.a.go', { name: dogName(t, starter) }) : t('onb.finish'))
    : noSchool ? t('onb.skip') : t('onb.a.continue');

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--top-pad) 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 34, padding: '0 20px' }}>
        <Progress step={step} total={total} onBack={step > 0 ? () => setStep(step - 1) : null} />
        {step === 0 && <LanguageButton />}
      </div>

      <div key={step} className="sc" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 20px', animation: 'fadeUp .25s ease both' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16 }}>
            <div style={{ position: 'relative', width: 150, height: 150 }}>
              <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,109,255,.45),transparent 65%)' }} />
              <PugLive size={150} style={{ position: 'relative', boxShadow: '0 0 0 4px #8b6dff, 0 20px 50px rgba(109,77,255,.5)' }} />
            </div>
            <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 18, background: '#fff', color: '#2a2440', fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>
              {t('onb.imPulgo')}<br />{t('onb.pugHello')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 26 }}>{t('onb.callYou')}</div>
            <form style={{ alignSelf: 'stretch', marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); if (name) next(); }}>
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder={t('onb.namePlaceholder')} style={{ height: 58, borderRadius: 16, fontSize: 18, fontWeight: 800, border: '2.5px solid #1cb0f6', background: '#17141f' }} />
            </form>
          </div>
        )}

        {step === 1 && (
          <>
            <PugSays>{t('onb.a.school', { name })}</PugSays>
            {!perDay ? (
              <>
                <Label>{t('onb.a.schoolDays').toUpperCase()}</Label>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  {RECUR_DAYS.map((d) => {
                    const on = days.includes(d);
                    return (
                      <div key={d} onClick={() => toggle(d, setDays)} style={{ flex: 1, height: 50, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, cursor: 'pointer', marginBottom: 3, ...(on ? { background: BLUE[0], boxShadow: `0 3px 0 ${BLUE[1]}`, color: '#fff' } : { background: '#17141f', boxShadow: '0 3px 0 #0f0e17', color: '#8a8a99' }) }}>
                        {(t(DAY_KEY[d] + '.short') || d).slice(0, 2)}
                      </div>
                    );
                  })}
                </div>
                {days.length > 0 && (
                  <>
                    <Label>{t('onb.a.fromTo').toUpperCase()}</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}><WheelTimePicker value={start} onChange={setStart} /></div>
                      <span style={{ color: '#8a8a99', fontWeight: 900 }}>–</span>
                      <div style={{ flex: 1 }}><WheelTimePicker value={end} onChange={setEnd} /></div>
                    </div>
                    <div onClick={() => setPerDay(Object.fromEntries(days.map((d) => [d, { start, end }])))} style={{ marginTop: 16, fontSize: 14.5, fontWeight: 800, color: '#a58cff', cursor: 'pointer' }}>{t('onb.a.diffHours')} ›</div>
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {RECUR_DAYS.map((day) => {
                    const on = !!perDay[day];
                    return (
                      <div key={day} style={{ padding: 10, borderRadius: 16, background: '#17141f', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <TapChip label={t(DAY_KEY[day]) || day} on={on} onClick={() => togglePerDay(day)} />
                        {on && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                            <WheelTimePicker value={perDay[day].start} onChange={(v) => setPerDay((p) => ({ ...p, [day]: { ...p[day], start: v } }))} />
                            <span style={{ color: '#8a8a99' }}>–</span>
                            <WheelTimePicker value={perDay[day].end} onChange={(v) => setPerDay((p) => ({ ...p, [day]: { ...p[day], end: v } }))} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div onClick={() => setPerDay(null)} style={{ marginTop: 14, fontSize: 14.5, fontWeight: 800, color: '#a58cff', cursor: 'pointer' }}>‹ {t('onb.a.sameHours')}</div>
              </>
            )}
            <div style={{ fontSize: 13, color: '#77778a', marginTop: 12, lineHeight: 1.45 }}>{t('onb.a.noSchool')}</div>
          </>
        )}

        {step === 2 && (
          <>
            <PugSays>{t('onb.step3.studyTimeQ')}</PugSays>
            {STUDY_TIME_OPTIONS.map((opt) => (
              <TapCard key={opt} emoji={STUDY_EMOJI[opt] || '📚'} label={t(VALUE_KEY[opt]) || opt} sub={t(STUDY_SUB[opt])} on={studyTime === opt} pal={ORANGE} onClick={() => setStudyTime(opt)} />
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#8a8a99', marginBottom: 6 }}>⏰ {t('onb.step3.wakeLabel')}</div>
                <WheelTimePicker value={wake} onChange={setWake} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#8a8a99', marginBottom: 6 }}>😴 {t('onb.step3.bedtimeLabel')}</div>
                <WheelTimePicker value={bedtime} onChange={setBedtime} />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <PugSays>{t('onb.a.activities')}</PugSays>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {ACTIVITY_OPTIONS.map((a) => (
                <TapChip key={a} label={`${iconForActivity(a) || '📌'} ${t(VALUE_KEY[a]) || a}`} on={selectedActivities.includes(a)} onClick={() => toggle(a, setSelectedActivities)} />
              ))}
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: '#8a8a99', marginTop: 18, display: 'block' }}>
              {t('onb.step2.noteLabel')}
              <textarea rows={3} value={activitiesNote} onChange={(e) => setActivitiesNote(e.target.value)} placeholder={t('onb.step2.notePlaceholder')} style={{ marginTop: 6, resize: 'vertical' }} />
            </label>
          </>
        )}

        {step === 4 && (
          <>
            <PugSays>{t('onb.a.subjects')}</PugSays>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {PRIORITY_SUBJECT_OPTIONS.map((s) => (
                <TapChip key={s} label={`${iconForSubject(s)} ${t(VALUE_KEY[s]) || s}`} on={prioritySubjects.includes(s)} onClick={() => toggle(s, setPrioritySubjects)} />
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <PugSays>{t('onb.step4.prefQ')}</PugSays>
            {PREF_OPTIONS.map((opt) => (
              <TapCard key={opt} emoji={PREF_EMOJI[opt] || '⭐'} label={t(VALUE_KEY[opt]) || opt} sub={t(PREF_SUB[opt])} on={pref === opt} pal={MAIN} onClick={() => setPref(opt)} />
            ))}
          </>
        )}

        {step === 6 && withDog && (
          <>
            <PugSays size={72}>{t('onb.a.buddy')}</PugSays>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {STARTERS.map((id) => {
                const on = starter === id;
                return (
                  <div key={id} onClick={() => setStarter(id)} style={{ borderRadius: 20, padding: '6px 4px 10px', textAlign: 'center', cursor: 'pointer', marginBottom: 4, ...(on ? { background: `linear-gradient(160deg, ${ACCENT[0]}, ${ACCENT[1]})`, boxShadow: `0 4px 0 ${ACCENT[2]}, 0 0 0 3px #08080c, 0 0 0 6px ${ACCENT[1]}` } : { background: '#17141f', boxShadow: '0 4px 0 #0f0e17' }) }}>
                    <DogThumb dogId={id} size={92} style={{ margin: '0 auto' }} />
                    <div style={{ fontSize: 12.5, fontWeight: 900 }}>{dogName(t, id)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, position: 'relative' }}>
              <ColorStage pal={ACCENT} height={230}>
                <Dog2D key={starter} dogId={starter} />
              </ColorStage>
              <div style={{ position: 'absolute', right: 14, top: 12, padding: '5px 10px', borderRadius: 99, background: 'rgba(0,0,0,.18)', fontSize: 12, fontWeight: 900 }}>{t('onb.a.welcomeChest')}</div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '10px 20px calc(var(--safe-bottom) + 18px)' }}>
        <button
          type="button"
          onClick={() => canGo && next()}
          style={{ width: '100%', height: 56, border: 'none', borderRadius: 16, background: MAIN[0], boxShadow: `0 4px 0 ${MAIN[1]}`, color: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', cursor: canGo ? 'pointer' : 'default', opacity: canGo ? 1 : 0.5, fontFamily: 'inherit' }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
