const TABS = [
  { key: 'home', label: 'Dziś', icon: '🏠' },
  { key: 'planner', label: 'Plan', icon: '🗓️' },
  { key: 'deadline', label: 'Dodaj', icon: '➕' },
  { key: 'summary', label: 'Podsumowanie', icon: '📊' },
];

export default function TabBar({ screen, onNavigate }) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab-btn ${screen === tab.key ? 'active' : ''}`}
          onClick={() => onNavigate(tab.key)}
        >
          <span style={{ fontSize: 16 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
