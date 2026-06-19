export default function DashboardHeader({ currentTeam, message, socketState, user }) {
  const displayName = user?.name || user?.email || "there";

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{currentTeam?.slug}</p>
        <p className="user-greeting">Hi, {displayName}</p>
        <h2>{currentTeam?.name}</h2>
      </div>

      <div className="topbar-actions">
        <span className={`realtime-pill realtime-${socketState}`}>Realtime {socketState}</span>
        {message ? <p className="message">{message}</p> : null}
      </div>
    </header>
  );
}
