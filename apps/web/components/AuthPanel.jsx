"use client";

export default function AuthPanel({
  authForm,
  authMode,
  busy,
  message,
  onSubmit,
  registerMode,
  setAuthForm,
  setAuthMode,
  setRegisterMode
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">NetPulse</p>
          <h1>Network Incident Monitor</h1>
        </div>

        <div className="segmented-control">
          <button
            className={authMode === "login" ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("login")}
          >
            Log in
          </button>
          <button
            className={authMode === "register" ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("register")}
          >
            Register
          </button>
        </div>

        <form className="stack" onSubmit={onSubmit}>
          {authMode === "register" ? (
            <>
              <div className="segmented-control compact">
                <button
                  className={registerMode === "createTeam" ? "active" : ""}
                  type="button"
                  onClick={() => setRegisterMode("createTeam")}
                >
                  Create team
                </button>
                <button
                  className={registerMode === "joinInvite" ? "active" : ""}
                  type="button"
                  onClick={() => setRegisterMode("joinInvite")}
                >
                  Join invite
                </button>
              </div>

              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  required
                />
              </label>
              {registerMode === "createTeam" ? (
                <label>
                  Team
                  <input
                    value={authForm.teamName}
                    onChange={(event) => setAuthForm({ ...authForm, teamName: event.target.value })}
                    placeholder="Connectify Demo Team"
                  />
                </label>
              ) : (
                <label>
                  Invite code
                  <input
                    value={authForm.inviteToken}
                    onChange={(event) => setAuthForm({ ...authForm, inviteToken: event.target.value })}
                    placeholder="Paste invite code"
                    required
                  />
                </label>
              )}
            </>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              required
            />
          </label>

          <button className="primary-button" disabled={busy} type="submit">
            {authMode === "register"
              ? registerMode === "joinInvite"
                ? "Join team"
                : "Create account"
              : "Log in"}
          </button>
        </form>

        {message ? <p className="message">{message}</p> : null}
      </section>
    </main>
  );
}
