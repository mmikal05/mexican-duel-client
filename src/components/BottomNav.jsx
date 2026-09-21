export const NAV_ITEMS = [
  { id: "profile", icon: "👤", label: "Profile" },
  { id: "farm", icon: "🌾", label: "Farm" },
  { id: "forest", icon: "🌲", label: "Forest" },
  { id: "mine", icon: "⛏️", label: "Mine" },
  { id: "shed", icon: "🐄", label: "Shed" },
  { id: "workshop", icon: "🔨", label: "Workshop" },
  { id: "armoury", icon: "🛡️", label: "Armoury" },
  { id: "marketplace", icon: "🏪", label: "Market" },
  { id: "shop", icon: "🛒", label: "Shop" },
  { id: "duel", icon: "⚔️", label: "Duel" },
];

export default function BottomNav({ screen, onNavigate, badges = {}, locked = false }) {
  return (
    <>
      {locked && <div className="nav-lock-note">⚔️ Duel in progress</div>}

      <nav className="bottom-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const active = screen === item.id;
          const badge = badges[item.id] || 0;

          return (
            <button
              key={item.id}
              className="nav-btn"
              aria-current={active ? "page" : undefined}
              disabled={locked && !active}
              title={locked && !active ? "Finish or forfeit the duel first" : item.label}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge > 0 && (
                <span className="nav-badge" aria-label={`${badge} ready`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
