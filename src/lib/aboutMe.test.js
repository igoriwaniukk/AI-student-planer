import { describe, it, expect } from 'vitest';
import { aboutMeFacts, aboutMeForAI, compactDays } from './aboutMe';

const short = (d) => ({ Poniedziałek: 'Mon', Wtorek: 'Tue', Środa: 'Wed', Czwartek: 'Thu', Piątek: 'Fri', Sobota: 'Sat', Niedziela: 'Sun' })[d];
const input = {
  activities: { selected: ['Szkoła / liceum', 'Sport / treningi'], note: '  Tutoring on Tuesdays.  ' },
  defaults: { studyTime: 'Wieczorem', bedtime: '22:30', wake: '06:30', pref: 'Wolny wieczór', prioritySubjects: ['Matematyka', 'Angielski'] },
  energy: 'Normalna',
  recurringActivities: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'].map((day, i) => ({ id: i, name: 'School', day, start: '08:00', dur: 450 }))
    .concat([{ id: 9, name: 'Football', day: 'Wtorek', start: '17:00', dur: 90 }, { id: 10, name: 'Football', day: 'Czwartek', start: '17:00', dur: 90 }]),
};

describe('what Pulgo knows about you', () => {
  it('turns the profile into short facts in the app language', () => {
    expect(aboutMeFacts(input, 'en').map((f) => f.text)).toEqual([
      'School / high school · Sports / training',
      'Best time to study: Evening',
      'Energy: Normal',
      'Sleep: 22:30–06:30',
      'Planning style: Free evening',
      'Priorities: Math, English',
      'Every week: School Mon–Fri · Football Tue, Thu',
    ]);
  });

  it('sends the facts and the trimmed note to the AI', () => {
    const out = aboutMeForAI(input);
    expect(out.note).toBe('Tutoring on Tuesdays.');
    expect(out.facts).toHaveLength(7);
    expect(aboutMeForAI({})).toBeNull();
  });

  it('shortens runs of three or more days', () => {
    expect(compactDays(['Piątek', 'Poniedziałek', 'Wtorek', 'Środa'], short)).toBe('Mon–Wed, Fri');
    expect(compactDays(['Sobota', 'Niedziela'], short)).toBe('Sat, Sun');
  });
});
