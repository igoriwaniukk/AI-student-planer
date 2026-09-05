import { useState } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send(text, context) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const next = messages.concat({ role: 'user', content: trimmed });
    setMessages(next);
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Serwer czatu nie odpowiedział poprawnie. Upewnij się, że jest uruchomiony (npm run dev:full).');
      }
      if (!res.ok) throw new Error(data.error || 'Błąd serwera czatu.');
      setMessages(next.concat({ role: 'assistant', content: data.reply }));
    } catch (err) {
      setError(err.message || 'Nie udało się połączyć z czatem AI.');
    } finally {
      setSending(false);
    }
  }

  return { messages, sending, error, send };
}
