import { useState } from 'react';
import { useLang } from '../lib/useLang';
import { authedFetch } from '../lib/authFetch';
import { getCurrentLang } from '../lib/i18n';

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
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context, lang: getCurrentLang() }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        // Not JSON: the server timed out or crashed before it could answer.
        throw new Error(t(res.status === 504 ? 'chat.timeout' : 'chat.serverBadResponse'));
      }
      if (data.code === 'no_key') throw new Error(t('chat.noKey'));
      if (data.code === 'bad_key') throw new Error(t('chat.badKey'));
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
