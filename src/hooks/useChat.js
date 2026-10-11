import { useState } from 'react';
import { useLang } from '../lib/useLang';
import { authedFetch } from '../lib/authFetch';
import { getCurrentLang } from '../lib/i18n';
import { useLocalStorage, KEYS } from '../lib/store';

// The conversation is saved (and synced with the account like the plan), so
// AI Pulgo still remembers it after the app reloads. Only the newest
// messages are kept and sent, so it stays quick and cheap.
const KEEP = 60;
const SEND = 30;

export function chatHistory(messages) {
  const history = messages.filter((m) => !m.skip).map(({ role, content }) => ({ role, content })).slice(-SEND);
  // The AI expects the conversation to start with the student.
  while (history.length && history[0].role !== 'user') history.shift();
  return history;
}

export function useChat() {
  const { t } = useLang();
  const [saved, setSaved] = useLocalStorage(KEYS.chatMessages, []);
  const messages = Array.isArray(saved) ? saved : [];
  const setMessages = (next) => setSaved((prev) => (typeof next === 'function' ? next(Array.isArray(prev) ? prev : []) : next).slice(-KEEP));
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
      // Messages around a used-up free allowance never reach the AI.
      const history = chatHistory(next);
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, context, lang: getCurrentLang() }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        // Not JSON: the server timed out or crashed before it could answer.
        throw new Error(t(res.status === 504 ? 'chat.timeout' : 'chat.serverBadResponse'));
      }
      // Free answers used up for today: the pug says so, with a Premium button.
      if (data.code === 'limit_reached') {
        setMessages(next.map((m, i) => (i === next.length - 1 ? { ...m, skip: true } : m)).concat({ role: 'assistant', content: t('premium.limit.chat'), limit: true, skip: true }));
        return;
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

  // "New chat": AI Pulgo forgets the conversation and starts fresh.
  function clearChat() {
    setMessages([]);
    setError('');
    setAction(null);
  }

  function appendAssistantMessage(content) {
    setMessages((prev) => prev.concat({ role: 'assistant', content }));
  }

  return { messages, sending, error, send, action, clearAction, appendAssistantMessage, clearChat };
}
