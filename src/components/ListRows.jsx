// Plain list rows shared by the planning screens (Planner, Restart).

export const ROW_LINE = '1px solid rgba(255,255,255,.06)';

export function Eyebrow({ text }) {
  return <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', marginTop: 22, textTransform: 'uppercase' }}>{text}</div>;
}

export function Check({ on, color = '#7c5cff' }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 7, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? color : 'transparent', border: '1.5px solid ' + (on ? color : 'rgba(255,255,255,.2)') }}>
      <svg width="11" height="9" viewBox="0 0 12 10" fill="none" style={{ opacity: on ? 1 : 0 }}><path d="M1 5l3.4 3.4L11 1.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}

// One settings line (Planner's and Restart's "Your day"): tap to open its
// settings right under it (children), or — without children — to go where
// it's edited. Without onClick it's a plain, locked line (no chevron).
export function SettingRow({ icon, label, value, open, onClick, children, color = '#c9baff' }) {
  return (
    <div style={{ borderBottom: ROW_LINE }}>
      <div role={onClick ? 'button' : undefined} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', cursor: onClick ? 'pointer' : 'default' }}>
        <span style={{ fontSize: 16, width: 22, textAlign: 'center', flex: 'none' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 650, color, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {value} {onClick && <span style={{ display: 'inline-block', color: '#6b6b7a', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>›</span>}
        </div>
      </div>
      {open && children && <div style={{ padding: '2px 0 16px' }}>{children}</div>}
    </div>
  );
}
