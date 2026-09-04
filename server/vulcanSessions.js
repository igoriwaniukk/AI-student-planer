// In-memory only: sessions live for the lifetime of this process and are
// never written to disk. Restarting the server invalidates every session
// and the connected student has to pair again (enter a fresh token/PIN).
import { Keystore, VulcanHebe, registerAccount } from 'vulcan-api-js';
import { randomUUID } from 'node:crypto';

const sessions = new Map();

export async function pair({ token, symbol, pin }) {
  const keystore = new Keystore();
  await keystore.init('Student Planner');
  const account = await registerAccount(keystore, token, symbol, pin);
  const hebe = new VulcanHebe(keystore, account);

  const students = await hebe.getStudents();
  if (!students.length) throw new Error('To konto nie ma przypisanego żadnego ucznia.');
  const student = students[0];
  await hebe.selectStudent(student);

  const sessionId = randomUUID();
  sessions.set(sessionId, { hebe, student });

  return {
    sessionId,
    studentName: [student.pupil?.firstName, student.pupil?.surname].filter(Boolean).join(' '),
    schoolName: student.school?.name || '',
    multipleStudents: students.length > 1,
  };
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    const err = new Error('Sesja wygasła. Połącz się ponownie.');
    err.status = 401;
    throw err;
  }
  return session;
}

export async function getExams(sessionId) {
  const { hebe } = getSession(sessionId);
  const exams = await hebe.getExams();
  return exams.map((e) => ({
    id: 'vulcan-exam-' + e.id,
    subject: e.subject?.name || 'Sprawdzian',
    title: e.topic || e.type || 'Sprawdzian',
    kind: e.type,
    date: e.deadline?.date || null,
    color: '#8fbaff',
    source: 'vulcan',
  }));
}

export async function getLessons(sessionId) {
  const { hebe } = getSession(sessionId);
  const today = new Date();
  const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lessons = await hebe.getLessons(today, weekAhead);
  return lessons
    .filter((l) => l.visible !== false && l.subject)
    .map((l) => ({
      id: 'vulcan-lesson-' + l.id,
      subject: l.subject?.name || '',
      date: l.date?.date || null,
      start: l.timeSlot?.start || '',
      end: l.timeSlot?.end || '',
      room: l.room?.code || '',
      teacher: l.teacherPrimary?.displayName || '',
    }));
}

export function disconnect(sessionId) {
  sessions.delete(sessionId);
}
