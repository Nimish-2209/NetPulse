export default function DashboardSidebar({
  currentTeamId,
  isAdmin,
  onSignOut,
  setCurrentTeamId,
  teams
}) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">NetPulse</p>
        <h1>Operations</h1>
      </div>

      <label>
        Team
        <select value={currentTeamId} onChange={(event) => setCurrentTeamId(event.target.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.role})
            </option>
          ))}
        </select>
      </label>

      <nav>
        <a href="#services">Services</a>
        <a href="#incidents">Incidents</a>
        <a href="#checks">Checks</a>
        {isAdmin ? <a href="#team">Team</a> : null}
      </nav>

      <button className="secondary-button" type="button" onClick={onSignOut}>
        Sign out
      </button>
    </aside>
  );
}
