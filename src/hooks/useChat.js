import { useState } from 'react';
import { useLang } from '../lib/useLang';

export function useChat() {
  const { t } = useLang();
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);

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
        throw new Error(t('chat.serverBadResponse'));
      }
      if (!res.ok) throw new Error(data.error || t('chat.serverError'));
      if (data.reply) setMessages(next.concat({ role: 'assistant', content: data.reply }));
      if (data.action) setAction(data.action);
    } catch (err) {
      setError(err.message || t('chat.connectionError'));
    } finally {
      setSending(false);
    }
  }

  function clearAction() {
    setAction(null);
  }

  function appendAssistantMessage(content) {
    setMessages((prev) => prev.concat({ role: 'assistant', content }));
  }

  return { messages, sending, error, send, action, clearAction, appendAssistantMessage };
}
