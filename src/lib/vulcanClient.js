async function call(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Coś poszło nie tak.');
  return data;
}

export function pairVulcan({ token, symbol, pin }) {
  return call('/api/vulcan/pair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, symbol, pin }),
  });
}

export function fetchVulcanExams(sessionId) {
  return call('/api/vulcan/exams?sessionId=' + encodeURIComponent(sessionId));
}

export function fetchVulcanLessons(sessionId) {
  return call('/api/vulcan/lessons?sessionId=' + encodeURIComponent(sessionId));
}

export function disconnectVulcan(sessionId) {
  return call('/api/vulcan/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}
