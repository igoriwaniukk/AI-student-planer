import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { buildChatContext } from '../lib/chatContext';
import { BottomSheet } from './ui';

export default function ChatWidget({ planner, weeklyCapacity, profileDefaults, studyHistory }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sending, error, send } = useChat();

  function handleSend() {
    if (!input.trim() || sending) return;
    const context = buildChatContext({ state: planner.state, weeklyCapacity, profileDefaults, studyHistory });
    send(input, context);
    setInput('');
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', right: 16, bottom: 100, width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 21, cursor: 'pointer', boxShadow: '0 10px 26px rgba(109,77,255,.4)', zIndex: 45,
        }}
      >
        💬
      </div>

      {open && (
        <BottomSheet maxHeight="82%">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>Asystent AI</div>
            <div
              onClick={() => setOpen(false)}
              style={{ width: 32, height: 32, borderRadius: 11, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6, lineHeight: 1.45 }}>Zna Twoje najbliższe sprawdziany i cele nauki.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, minHeight: 100 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12.5, color: '#7a7a8a', lineHeight: 1.5 }}>
                Zapytaj np. „Jak rozłożyć naukę do sprawdzianu z matematyki?” albo „Ile powinienem dziś jeszcze się uczyć?”.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 13px', borderRadius: 14,
                  fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap',
                  background: m.role === 'user' ? 'rgba(124,92,255,.22)' : 'rgba(255,255,255,.05)',
                  border: '1px solid ' + (m.role === 'user' ? 'rgba(124,92,255,.4)' : 'rgba(255,255,255,.08)'),
                }}
              >
                {m.content}
              </div>
            ))}
            {sending && <div style={{ fontSize: 12.5, color: '#8a8a99' }}>Asystent pisze…</div>}
            {error && (
              <div style={{ padding: 11, borderRadius: 13, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12, lineHeight: 1.45, color: '#f7c46c' }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 9, marginTop: 16, paddingBottom: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Napisz wiadomość…"
              style={{ flex: 1, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '0 14px', fontSize: 13.5, color: '#f4f4f7', fontFamily: 'inherit' }}
            />
            <div
              onClick={handleSend}
              style={{
                width: 46, height: 46, flex: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                background: input.trim() ? 'linear-gradient(160deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              ➤
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
