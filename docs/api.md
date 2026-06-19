# NetPulse API

All team-scoped routes include a team identifier in the URL and require a bearer token.

## Health

- `GET /api/health`

Response:

```json
{
  "status": "ok",
  "service": "NetPulse API"
}
```

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### `POST /api/auth/register`

Body:

```json
{
  "name": "Nimish",
  "email": "nimish@example.com",
  "password": "password123",
  "teamName": "Demo Team"
}
```

Creates a user, team, admin team membership, and JWT.

### `POST /api/auth/login`

Body:

```json
{
  "email": "nimish@example.com",
  "password": "password123"
}
```

Returns the token, user, and teams.

### `GET /api/auth/me`

Requires:

```txt
Authorization: Bearer <token>
```

Returns the current user and team memberships.

## Teams

- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/:teamId`
- `GET /api/teams/:teamId/metrics`
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/members`
- `PATCH /api/teams/:teamId/members/:memberId`
- `DELETE /api/teams/:teamId/members/:memberId`
- `GET /api/teams/:teamId/invitations`
- `POST /api/teams/:teamId/invitations`

Reading team members requires team access. Member mutations and invitation management require the `admin` role.

### `GET /api/teams/:teamId/metrics`

Returns 24-hour uptime metrics based on stored checks.

Response:

```json
{
  "metrics": {
    "uptimeWindowHours": 24,
    "totalChecks": 42,
    "successfulChecks": 41,
    "uptimePercentage": 97.6
  }
}
```

### `POST /api/teams/:teamId/members`

Body:

```json
{
  "email": "teammate@example.com",
  "role": "viewer"
}
```

The user must already have a NetPulse account.

### `POST /api/teams/:teamId/invitations`

Body:

```json
{
  "email": "new-user@example.com",
  "role": "viewer"
}
```

If the email already belongs to a NetPulse user, the user is added to the team immediately. If the email is new, NetPulse returns an invitation code.

Invited users register with:

```json
{
  "name": "New User",
  "email": "new-user@example.com",
  "password": "password123",
  "inviteToken": "returned-invite-code"
}
```

Registering with an invite code joins the existing team directly and does not create a new admin workspace.

### `PATCH /api/teams/:teamId/members/:memberId`

Body:

```json
{
  "role": "maintainer"
}
```

NetPulse prevents removing or demoting the last team admin.

## Services

- `GET /api/teams/:teamId/services`
- `POST /api/teams/:teamId/services`
- `GET /api/teams/:teamId/services/:serviceId`
- `PATCH /api/teams/:teamId/services/:serviceId`
- `DELETE /api/teams/:teamId/services/:serviceId`
- `POST /api/teams/:teamId/services/:serviceId/checks/run`

### `POST /api/teams/:teamId/services`

Body:

```json
{
  "name": "Login API",
  "url": "https://example.com/health",
  "checkIntervalSeconds": 60,
  "timeoutMs": 5000
}
```

### `POST /api/teams/:teamId/services/:serviceId/checks/run`

Runs one immediate uptime check, stores the check result, and updates the service status.

## Checks

- `GET /api/teams/:teamId/services/:serviceId/checks`

Returns the 100 most recent checks for a service.

## Incidents

- `GET /api/teams/:teamId/incidents`
- `POST /api/teams/:teamId/incidents`
- `PATCH /api/teams/:teamId/incidents/:incidentId`
- `POST /api/teams/:teamId/incidents/:incidentId/timeline`

### `POST /api/teams/:teamId/incidents`

Body:

```json
{
  "serviceId": "serviceObjectId",
  "title": "Investigate latency spike",
  "severity": "medium",
  "description": "Latency crossed threshold.",
  "assignedTo": "userObjectId"
}
```

### `PATCH /api/teams/:teamId/incidents/:incidentId`

Body:

```json
{
  "status": "resolved"
}
```

Incidents can also be assigned or unassigned with the same endpoint:

```json
{
  "assignedTo": "userObjectId"
}
```

The assigned user must be a member of the same team.

### `POST /api/teams/:teamId/incidents/:incidentId/timeline`

Adds a timeline note to an incident.

Body:

```json
{
  "message": "Paged the owner and started investigation."
}
```

Timeline entries are also created automatically when incidents are created, assigned, unassigned, acknowledged, or resolved.

## Realtime Events

The API exposes Socket.IO on the same host as the Express server.

Clients should emit:

- `team:join` with a `teamId`
- `team:leave` with a `teamId`

Team room events:

- `service:created`
- `service:updated`
- `service:deleted`
- `check:created`
- `incident:created`
- `incident:updated`
