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
  "teamName": "Connectify Demo Team"
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
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/members`
- `PATCH /api/teams/:teamId/members/:memberId`
- `DELETE /api/teams/:teamId/members/:memberId`

Member management requires the `admin` role.

### `POST /api/teams/:teamId/members`

Body:

```json
{
  "email": "teammate@example.com",
  "role": "viewer"
}
```

The user must already have a NetPulse account.

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

### `POST /api/teams/:teamId/incidents`

Body:

```json
{
  "serviceId": "serviceObjectId",
  "title": "Investigate latency spike",
  "severity": "medium",
  "description": "Latency crossed threshold."
}
```

### `PATCH /api/teams/:teamId/incidents/:incidentId`

Body:

```json
{
  "status": "resolved"
}
```

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
