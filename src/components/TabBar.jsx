const TABS = [
  {
    key: 'Start', screens: ['home'],
    icon: (c) => <path d="M3.4 9.2L11 3.2l7.6 6v8.4a1.6 1.6 0 01-1.6 1.6H5a1.6 1.6 0 01-1.6-1.6V9.2z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />,
  },
  {
    key: 'Kalendarz', screens: ['planner', 'plan'],
    icon: (c) => (
      <>
        <rect x="3.2" y="4.6" width="15.6" height="14.2" rx="3" stroke={c} strokeWidth="1.5" />
        <path d="M3.2 9h15.6M7.6 2.8v3.2M14.4 2.8v3.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'Terminy', screens: ['deadline', 'prep'],
    icon: (c) => <path d="M11 4l8 14H3l8-14z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />,
  },
  {
    key: 'Cele', screens: ['summary'],
    icon: (c) => (
      <>
        <circle cx="11" cy="11" r="7.6" stroke={c} strokeWidth="1.5" />
        <circle cx="11" cy="11" r="3.4" stroke={c} strokeWidth="1.5" />
        <circle cx="11" cy="11" r="1" fill={c} />
      </>
    ),
  },
  {
    key: 'Profil', screens: ['profile'],
    icon: (c) => (
      <>
        <circle cx="11" cy="7.6" r="3.4" stroke={c} strokeWidth="1.5" />
        <path d="M4.4 18.6a6.6 6.6 0 0113.2 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
];

export default function TabBar({ screen, onNavigate }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, padding: '10px 12px 0',
      background: 'rgba(12,12,18,.92)', backdropFilter: 'blur(18px)', borderTop: '1px solid rgba(255,255,255,.07)',
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', zIndex: 40,
    }}
    >
      {TABS.map((tab) => {
        const active = tab.screens.includes(screen);
        const color = active ? '#a58cff' : '#7a7a8a';
        return (
          <div
            key={tab.key}
            onClick={() => onNavigate(tab.screens[0])}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <svg width="21" height="21" viewBox="0 0 22 22" fill="none">{tab.icon(color)}</svg>
            <span style={{ fontSize: 10.5, fontWeight: 650, color }}>{tab.key}</span>
          </div>
        );
      })}
    </div>
  );
}
