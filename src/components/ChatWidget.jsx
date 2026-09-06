import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import { buildChatContext } from '../lib/chatContext';
import { upcomingExams, hm, toMinutes, checkBlockConflict } from '../lib/plannerLogic';
import { VALUE_KEY, DAY_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { BottomSheet, Chip } from './ui';

// Gemini replies use light Markdown (bold, line breaks) — render that
// instead of showing literal "**...**" and losing paragraph breaks.
function renderMarkdownLite(text) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={j}>{part.slice(2, -2)}</strong> : part
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

function initialsOf(name) {
  const parts = (name || 'Ty').trim().split(/\s+/);
  return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function Avatar({ role, studentName }) {
  return (
    <div
      style={{
        width: 26, height: 26, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: role === 'user' ? 10.5 : 13, fontWeight: 700,
        background: role === 'user' ? 'linear-gradient(150deg,#8b6dff,#6d4dff)' : 'linear-gradient(150deg,#2ee6c5,#1fb8a3)',
        color: role === 'user' ? '#fff' : '#04241f',
      }}
    >
      {role === 'user' ? initialsOf(studentName) : '✨'}
    </div>
  );
}

// Turns a Gemini function-call proposal into a human-readable summary and
// the planner call that actually applies it, once the student confirms.
function describeAction(action, planner, deps, t) {
  const { name, args } = action;
  const subj = (s) => t(VALUE_KEY[s]) || s;
  const day = (d) => t(DAY_KEY[d]) || d;
  if (name === 'add_exam') {
    const label = subj(args.subject) + (args.title ? ' — ' + args.title : '');
    return {
      summary: t('chat.actionAddExam', { label, days: args.daysUntil, grade: subj(args.grade), importance: subj(args.importance), time: hm(args.studyMinutes) }),
      confirmedSummary: t('chat.actionAddExamDone', { label, days: args.daysUntil }),
      run: () => planner.addCustomExam(args),
    };
  }
  if (name === 'update_exam_goal') {
    const exam = upcomingExams(planner.state).find((e) => e.id === args.examId);
    const label = exam ? subj(exam.subject) + (exam.title ? ' — ' + subj(exam.title) : '') : args.examId;
    const changes = [];
    if (args.grade) changes.push(t('chat.changeGrade', { grade: subj(args.grade) }));
    if (args.importance) changes.push(t('chat.changeImportance', { importance: subj(args.importance) }));
    if (args.studyMinutes != null) changes.push(t('chat.changeStudyTime', { time: hm(args.studyMinutes) }));
    return {
      summary: t('chat.actionUpdateGoal', { label, changes: changes.join(', ') }),
      confirmedSummary: t('chat.actionUpdateGoalDone', { label }),
      run: () => {
        if (args.grade) planner.setExamGrade(args.examId, args.grade);
        if (args.importance) planner.setExamImportance(args.examId, args.importance);
        if (args.studyMinutes != null) planner.setExamStudyMinutes(args.examId, args.studyMinutes);
      },
    };
  }
  if (name === 'complete_session') {
    const d = planner.def(args.sessionId);
    const label = d?.short || subj(d?.subject) || args.sessionId;
    return {
      summary: t('chat.actionComplete', { label, time: args.actualMinutes != null ? ' (' + hm(args.actualMinutes) + ')' : '' }),
      confirmedSummary: t('chat.actionCompleteDone', { label }),
      run: () =>
        planner.update((s) => {
          const b = (s.schedule || {})[args.sessionId];
          const actual = args.actualMinutes != null ? args.actualMinutes : b ? b.dur : d?.dur || 30;
          return { taskState: { ...s.taskState, [args.sessionId]: { ...s.taskState[args.sessionId], status: 'completed', actual } } };
        }),
    };
  }
  if (name === 'reschedule_session') {
    const d = planner.def(args.sessionId);
    const label = d?.short || subj(d?.subject) || args.sessionId;
    const startMin = toMinutes(args.newStart);
    const sched = planner.state.schedule || {};
    const dur = (sched[args.sessionId] || {}).dur || d?.dur || 30;
    const conflict = checkBlockConflict(args.sessionId, startMin, dur, sched, planner.def);
    const conflictText = conflict ? t(conflict.key, { subject: conflict.vars?.subject ? subj(conflict.vars.subject) : '' }) : '';
    return {
      summary: t('chat.actionReschedule', { label, time: args.newStart }),
      confirmedSummary: conflict ? t('chat.actionRescheduleFailed', { label, reason: conflictText }) : t('chat.actionRescheduleDone', { label, time: args.newStart }),
      run: () => {
        if (conflict) return;
        planner.update((s) => ({
          schedule: { ...s.schedule, [args.sessionId]: { start: startMin, dur } },
          durOverride: { ...s.durOverride, [args.sessionId]: dur },
        }));
      },
    };
  }
  if (name === 'log_energy') {
    return {
      summary: t('chat.actionLogEnergy', { level: subj(args.level) }),
      confirmedSummary: t('chat.actionLogEnergyDone', { level: subj(args.level) }),
      run: () => {
        planner.update({ energy: args.level });
        deps.logEnergy(args.level);
      },
    };
  }
  if (name === 'add_recurring_activity') {
    return {
      summary: t('chat.actionAddRecurring', { name: args.name, day: day(args.day), start: args.start, min: args.durationMinutes }),
      confirmedSummary: t('chat.actionAddRecurringDone', { name: args.name, day: day(args.day), start: args.start }),
      run: () =>
        deps.setRecurringActivities(
          (deps.recurringActivities || []).concat({ id: Date.now(), name: args.name, day: args.day, start: args.start, dur: args.durationMinutes })
        ),
    };
  }
  return null;
}

function ActionConfirmCard({ action, planner, deps, onResolve }) {
  const { t } = useLang();
  const described = describeAction(action, planner, deps, t);
  if (!described) return null;
  return (
    <div style={{ padding: 14, borderRadius: 16, background: 'rgba(124,92,255,.1)', border: '1.5px solid rgba(124,92,255,.4)', animation: 'fadeUp .25s ease both' }}>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.06em', color: '#c9baff', marginBottom: 7 }}>{t('chat.aiProposes')}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#f4f4f7' }}>{described.summary}</div>
      <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
        <div
          onClick={() => onResolve(false)}
          style={{ flex: 1, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}
        >
          {t('chat.cancel')}
        </div>
        <div
          onClick={() => onResolve(true, described)}
          style={{ flex: 1.3, height: 40, borderRadius: 12, background: 'linear-gradient(155deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          {t('chat.confirm')}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, alignSelf: 'flex-start', animation: 'fadeUp .25s ease both' }}>
      <Avatar role="assistant" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8a8a99', animation: 'typingBounce 1.1s ease-in-out infinite', animationDelay: i * 0.15 + 's' }} />
        ))}
      </div>
    </div>
  );
}

export default function ChatWidget({ planner, weeklyCapacity, profileDefaults, studyHistory, studentName, logEnergy, recurringActivities, setRecurringActivities }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sending, error, send, action, clearAction, appendAssistantMessage } = useChat();
  const bottomRef = useRef(null);
  const deps = { logEnergy, recurringActivities, setRecurringActivities };

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, error, action, open]);

  function handleSend(text) {
    const toSend = text ?? input;
    if (!toSend.trim() || sending) return;
    const context = buildChatContext({ state: planner.state, weeklyCapacity, profileDefaults, studyHistory });
    send(toSend, context);
    setInput('');
  }

  function handleResolveAction(confirmed, described) {
    if (confirmed && described) {
      described.run();
      appendAssistantMessage(described.confirmedSummary);
    } else {
      appendAssistantMessage(t('chat.cancelledMessage'));
    }
    clearAction();
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', right: 16, bottom: 100, width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(155deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, cursor: 'pointer', boxShadow: '0 10px 28px rgba(109,77,255,.45), 0 0 0 1px rgba(255,255,255,.08) inset', zIndex: 45,
          animation: open ? 'none' : 'fabAttention 4.5s ease-in-out infinite',
        }}
      >
        ✨
      </div>

      {open && (
        <BottomSheet maxHeight="85%">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 38, height: 38, flex: 'none', borderRadius: 13, background: 'linear-gradient(155deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 6px 16px rgba(109,77,255,.4)' }}>
              <span style={{ display: 'inline-block', animation: 'sparkleTwinkle 2.6s ease-in-out infinite' }}>✨</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>{t('chat.title')}</div>
              <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 1 }}>{t('chat.subtitle')}</div>
            </div>
            <div
              onClick={() => setOpen(false)}
              style={{ width: 32, height: 32, flex: 'none', borderRadius: 11, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18, minHeight: 140 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, alignSelf: 'flex-start', animation: 'fadeUp .3s ease both' }}>
                  <Avatar role="assistant" />
                  <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, lineHeight: 1.5, color: '#c9c9d6' }}>
                    {t('chat.greeting')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 34 }}>
                  {[t('chat.suggestion1'), t('chat.suggestion2'), t('chat.suggestion3')].map((s, i) => (
                    <Chip key={s} label={s} onClick={() => handleSend(s)} style={{ textAlign: 'left', animation: `fadeUp .3s ease ${.12 + i * 0.08}s both` }} />
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp .25s ease both' }}>
                <Avatar role={m.role === 'user' ? 'user' : 'assistant'} studentName={studentName} />
                <div
                  style={{
                    maxWidth: '78%', padding: '11px 14px', fontSize: 13, lineHeight: 1.55,
                    borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: m.role === 'user' ? 'linear-gradient(155deg,rgba(139,109,255,.35),rgba(109,77,255,.28))' : 'rgba(255,255,255,.05)',
                    border: '1px solid ' + (m.role === 'user' ? 'rgba(139,109,255,.45)' : 'rgba(255,255,255,.08)'),
                  }}
                >
                  {m.role === 'assistant' ? renderMarkdownLite(m.content) : m.content}
                </div>
              </div>
            ))}

            {sending && <TypingBubble />}

            {action && <ActionConfirmCard action={action} planner={planner} deps={deps} onResolve={handleResolveAction} />}

            {error && (
              <div style={{ padding: 12, borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12, lineHeight: 1.45, color: '#f7c46c' }}>
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 9, marginTop: 16, paddingBottom: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder={t('chat.inputPlaceholder')}
              style={{ flex: 1, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', padding: '0 15px', fontSize: 13.5, color: '#f4f4f7', fontFamily: 'inherit' }}
            />
            <div
              onClick={() => handleSend()}
              style={{
                width: 48, height: 48, flex: 'none', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                background: input.trim() ? 'linear-gradient(155deg,#8b6dff,#6d4dff)' : 'rgba(255,255,255,.06)',
                boxShadow: input.trim() ? '0 6px 16px rgba(109,77,255,.4)' : 'none',
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
