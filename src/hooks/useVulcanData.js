import { useCallback, useEffect, useState } from 'react';
import { fetchVulcanExams, fetchVulcanLessons } from '../lib/vulcanClient';

function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Real data from a connected Vulcan (UONET+) account. Dates here are real
// calendar dates (unlike the rest of the app's fixed demo week), so exams
// carry their own `daysUntil` computed against the actual current date.
export function useVulcanData(session) {
  const [exams, setExams] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    if (!session?.sessionId) { setExams([]); setLessons([]); return; }
    setLoading(true);
    setError('');
    Promise.all([fetchVulcanExams(session.sessionId), fetchVulcanLessons(session.sessionId)])
      .then(([examsRes, lessonsRes]) => {
        setExams((examsRes.exams || []).map((e) => ({ ...e, daysUntil: daysFromToday(e.date) })).filter((e) => e.daysUntil != null));
        setLessons(lessonsRes.lessons || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  return { exams, lessons, loading, error, refresh };
}
