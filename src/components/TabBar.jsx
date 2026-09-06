import { useLang } from '../lib/useLang';

const TABS = [
  {
    key: 'home', labelKey: 'tab.home', screens: ['home'],
    icon: (c) => <path d="M3.4 9.2L11 3.2l7.6 6v8.4a1.6 1.6 0 01-1.6 1.6H5a1.6 1.6 0 01-1.6-1.6V9.2z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />,
  },
  {
    key: 'calendar', labelKey: 'tab.calendar', screens: ['calendar'],
    icon: (c) => (
      <>
        <rect x="3.2" y="4.6" width="15.6" height="14.2" rx="3" stroke={c} strokeWidth="1.5" />
        <path d="M3.2 9h15.6M7.6 2.8v3.2M14.4 2.8v3.2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'deadline', labelKey: 'tab.deadline', fab: true,
  },
  {
    key: 'goals', labelKey: 'tab.goals', screens: ['goals'],
    icon: (c) => (
      <>
        <circle cx="11" cy="11" r="7.6" stroke={c} strokeWidth="1.5" />
        <circle cx="11" cy="11" r="3.4" stroke={c} strokeWidth="1.5" />
        <circle cx="11" cy="11" r="1" fill={c} />
      </>
    ),
  },
  {
    key: 'profile', labelKey: 'tab.profile', screens: ['profile'],
    icon: (c) => (
      <>
        <circle cx="11" cy="7.6" r="3.4" stroke={c} strokeWidth="1.5" />
        <path d="M4.4 18.6a6.6 6.6 0 0113.2 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
];

export default function TabBar({ screen, onNavigate, onFabClick, fabActive = false }) {
  const { t } = useLang();
  const activeIndex = TABS.findIndex((tab) => !tab.fab && tab.screens.includes(screen));
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, padding: '10px 12px 0',
      background: 'rgba(12,12,18,.92)', backdropFilter: 'blur(18px)', borderTop: '1px solid rgba(255,255,255,.07)',
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', zIndex: 40,
    }}
    >
      {activeIndex >= 0 && (
        <div
          style={{
            position: 'absolute', bottom: 6, width: 22, height: 3, borderRadius: 99,
            background: 'linear-gradient(90deg,#8b6dff,#6d4dff)',
            left: `calc(${activeIndex} * 20% + 10% - 11px)`,
            transition: 'left .25s ease',
          }}
        />
      )}
      {TABS.map((tab) => {
        if (tab.fab) {
          return (
            <div key={tab.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div
                onClick={onFabClick}
                style={{
                  width: 54, height: 54, marginTop: -26, borderRadius: '50%', flex: 'none',
                  background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', border: '4px solid #08080c',
                  boxShadow: '0 8px 20px rgba(109,77,255,.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: 27, fontWeight: 400, color: '#fff', lineHeight: 1, marginTop: -2,
                    display: 'inline-block', transform: fabActive ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform .25s ease',
                  }}
                >
                  +
                </span>
              </div>
            </div>
          );
        }
        const active = tab.screens.includes(screen);
        const color = active ? '#a58cff' : '#7a7a8a';
        return (
          <div
            key={tab.key}
            onClick={() => onNavigate(tab.screens[0])}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}
          >
            <svg width="21" height="21" viewBox="0 0 22 22" fill="none">{tab.icon(color)}</svg>
            <span style={{ fontSize: 10.5, fontWeight: 650, color }}>{t(tab.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
}
