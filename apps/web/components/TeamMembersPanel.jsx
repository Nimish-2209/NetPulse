export default function TeamMembersPanel({
  busy,
  memberForm,
  members,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  setMemberForm
}) {
  return (
    <section className="panel" id="team">
      <div className="section-heading">
        <h3>Team Members</h3>
        <span className="subtle">Admin only</span>
      </div>

      <form className="inline-form member-form" onSubmit={onAddMember}>
        <input
          type="email"
          value={memberForm.email}
          onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
          placeholder="teammate@example.com"
          required
        />
        <select
          value={memberForm.role}
          onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}
        >
          <option value="viewer">Viewer</option>
          <option value="maintainer">Maintainer</option>
          <option value="admin">Admin</option>
        </select>
        <button className="primary-button" disabled={busy} type="submit">
          Add member
        </button>
      </form>

      <div className="member-list">
        {members.length ? (
          members.map((member) => (
            <article className="member-row" key={member.id}>
              <span>
                <strong>{member.user.name}</strong>
                <small>{member.user.email}</small>
              </span>
              <select
                value={member.role}
                onChange={(event) => onUpdateMemberRole(member, event.target.value)}
              >
                <option value="viewer">Viewer</option>
                <option value="maintainer">Maintainer</option>
                <option value="admin">Admin</option>
              </select>
              <button className="secondary-button" type="button" onClick={() => onRemoveMember(member)}>
                Remove
              </button>
            </article>
          ))
        ) : (
          <p className="empty-state">No members loaded.</p>
        )}
      </div>
    </section>
  );
}
