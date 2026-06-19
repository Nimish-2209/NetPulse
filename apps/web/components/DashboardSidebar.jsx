export default function DashboardSidebar({
  currentTeamId,
  isAdmin,
  onSectionSelect,
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
        <button type="button" onClick={() => onSectionSelect("services")}>
          Services
        </button>
        <button type="button" onClick={() => onSectionSelect("incidents")}>
          Incidents
        </button>
        <button type="button" onClick={() => onSectionSelect("checks")}>
          Checks
        </button>
        {isAdmin ? (
          <button type="button" onClick={() => onSectionSelect("team")}>
            Team
          </button>
        ) : null}
      </nav>

      <button className="secondary-button" type="button" onClick={onSignOut}>
        Sign out
      </button>
    </aside>
  );
}
