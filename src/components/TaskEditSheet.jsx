import { SUBJECTS, PRIORITIES } from '../lib/plannerData';
import { VALUE_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { BottomSheet, Chip } from './ui';

export default function TaskEditSheet({ planner }) {
  const { t } = useLang();
  const { state, patchTaskEdit, stepTaskDur, cancelTaskEdit, saveTaskEdit } = planner;
  const fm = state.taskEdit;
  if (!fm) return null;
  const errs = state.editErrors || {};

  return (
    <BottomSheet maxHeight="92%">
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('taskEdit.title')}</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t(VALUE_KEY[fm.subject]) || fm.subject} — {fm.name}</div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.taskName')}</div>
      <input
        value={fm.name}
        onChange={(e) => patchTaskEdit({ name: e.target.value })}
        style={{ width: '100%', boxSizing: 'border-box', height: 50, padding: '0 15px', borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f4f7', fontSize: 15, fontWeight: 650, fontFamily: 'inherit', outline: 'none' }}
      />
      {errs.name && <div style={{ fontSize: 11.5, color: '#f5a524', marginTop: 7 }}>{errs.name}</div>}

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.subject')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SUBJECTS.map((v) => (
          <Chip key={v} label={t(VALUE_KEY[v]) || v} active={fm.subject === v} onClick={() => patchTaskEdit({ subject: v })} style={{ padding: '9px 13px' }} />
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.duration')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div onClick={() => stepTaskDur(-5)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>−</div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 21, fontWeight: 750 }}>{fm.dur} min</div>
        <div onClick={() => stepTaskDur(5)} style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, cursor: 'pointer' }}>+</div>
      </div>
      {errs.dur && <div style={{ fontSize: 11.5, color: '#f5a524', marginTop: 7 }}>{errs.dur}</div>}

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.startTime')}</div>
      <input
        value={fm.start}
        onChange={(e) => patchTaskEdit({ start: e.target.value })}
        style={{ width: 110, boxSizing: 'border-box', height: 50, padding: '0 15px', borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f4f7', fontSize: 17, fontWeight: 750, fontFamily: 'inherit', outline: 'none' }}
      />
      {errs.start && <div style={{ fontSize: 11.5, color: '#f5a524', marginTop: 7 }}>{errs.start}</div>}

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.priority')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        {PRIORITIES.map((v) => (
          <div
            key={v}
            onClick={() => patchTaskEdit({ priority: v })}
            style={{ flex: 1, height: 44, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, background: fm.priority === v ? 'rgba(124,92,255,.16)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (fm.priority === v ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)'), color: fm.priority === v ? '#e6dfff' : '#c9c9d6' }}
          >
            {(t(VALUE_KEY[v]) || v).replace(/ (priorytet|priority)$/, '')}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('taskEdit.noteLabel')}</div>
      <textarea
        value={fm.note}
        onChange={(e) => patchTaskEdit({ note: e.target.value })}
        placeholder={t('taskEdit.notePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', height: 74, padding: '13px 15px', borderRadius: 15, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', color: '#f4f4f7', fontSize: 13.5, lineHeight: 1.45, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
      />

      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={cancelTaskEdit} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('taskEdit.cancel')}</div>
        <div onClick={saveTaskEdit} style={{ flex: 1.4, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('taskEdit.saveChanges')}</div>
      </div>
    </BottomSheet>
  );
}
