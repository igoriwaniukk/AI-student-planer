import { getCurrentLang, translate, VALUE_KEY, DAY_KEY } from './i18n';
import { RECUR_DAYS } from './plannerData';
import { groupActivities } from './plansView';

// "What Pulgo knows about you": short facts built live from the profile
// (what the student does, rhythm, priorities, weekly activities) plus their
// own note. Shown on Profile and sent with every AI plan, rescue, exam prep
// and chat message, so the AI always works from the same picture the
// student sees. Facts are "Label: value" lines, which read naturally in
// any language without pronouns or grammar.

export const ABOUT_NOTE_MAX = 600;
const TIME_ICON = { Rano: '☀️', Popołudniu: '🌤️', Wieczorem: '🌙' };

// "Mon, Tue, Wed, Thu, Fri" → "Mon–Fri"; runs shorter than three stay listed.
export function compactDays(days, short) {
  const idx = [...new Set(days)].map((d) => RECUR_DAYS.indexOf(d)).filter((i) => i >= 0).sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    if (j - i >= 2) parts.push(short(RECUR_DAYS[idx[i]]) + '–' + short(RECUR_DAYS[idx[j]]));
    else for (let k = i; k <= j; k++) parts.push(short(RECUR_DAYS[idx[k]]));
    i = j + 1;
  }
  return parts.join(', ');
}

export function aboutMeFacts({ activities, defaults, energy, recurringActivities }, lang = getCurrentLang()) {
  const t = (key, vars) => translate(lang, key, vars);
  const label = (v) => t(VALUE_KEY[v]) || v;
  const short = (d) => {
    const s = t(DAY_KEY[d] + '.short') || d;
    return s.charAt(0) + s.slice(1).toLowerCase();
  };
  const facts = [];
  const iam = activities?.selected || [];
  if (iam.length) facts.push({ key: 'iam', icon: '🎓', text: iam.map(label).join(' · ') });
  if (defaults?.studyTime) facts.push({ key: 'studyTime', icon: TIME_ICON[defaults.studyTime] || '🕒', text: t('about.studyTime', { v: label(defaults.studyTime) }) });
  if (energy) facts.push({ key: 'energy', icon: '⚡', text: t('about.energy', { v: label(energy) }) });
  if (defaults?.bedtime && defaults?.wake) facts.push({ key: 'sleep', icon: '😴', text: t('about.sleep', { from: defaults.bedtime, to: defaults.wake }) });
  if (defaults?.pref) facts.push({ key: 'pref', icon: '🧘', text: t('about.pref', { v: label(defaults.pref) }) });
  const subjects = defaults?.prioritySubjects || [];
  if (subjects.length) facts.push({ key: 'subjects', icon: '⭐', text: t('about.subjects', { v: subjects.map(label).join(', ') }) });
  const weekly = groupActivities(recurringActivities)
    .map((g) => g.name + ' ' + compactDays(g.lines.flatMap((l) => l.days), short))
    .join(' · ');
  if (weekly) facts.push({ key: 'weekly', icon: '🗓️', text: t('about.weekly', { v: weekly }) });
  return facts;
}

// What the AI gets: the same facts as text plus the student's own note, or
// null when there's nothing yet.
export function aboutMeForAI(input) {
  const facts = aboutMeFacts(input).map((f) => f.text);
  const note = String(input.activities?.note || '').trim().slice(0, ABOUT_NOTE_MAX);
  return facts.length || note ? { facts, note: note || null } : null;
}
