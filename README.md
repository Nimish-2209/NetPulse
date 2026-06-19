# NetPulse

NetPulse is a full-stack uptime and incident monitoring platform for teams that need a clear view of service health. It combines public website checks, authenticated team dashboards, role-based access, background monitoring, incident tracking, and realtime status updates.

The project is organized as a JavaScript monorepo with a Next.js frontend, Express API, MongoDB persistence, and a worker process for scheduled checks.

## Highlights

- Public uptime checker for quick online/offline website checks.
- Authenticated dashboard for team-based service monitoring.
- JWT authentication with team-scoped access.
- Admin, maintainer, and viewer roles.
- Invite-code onboarding so new users can join an existing team directly.
- CRUD APIs for services, incidents, team members, and invitations.
- Manual uptime checks with latency and HTTP status capture.
- Background worker for scheduled service checks.
- Automatic incident creation when checks fail.
- Realtime service, check, and incident updates with Socket.IO.
- Recent latency history for monitored services.
- MongoDB/Mongoose data model with team-owned records.
- Backend integration tests using an isolated in-memory MongoDB.

## Tech Stack

- **Frontend:** Next.js, React, Recharts, Socket.IO client
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcrypt password hashing
- **Worker:** Node.js background process
- **Testing:** Node test runner, Supertest, mongodb-memory-server

## Repository Layout

```txt
NetPulse/
  apps/
    web/        Next.js frontend
    api/        Express API
    worker/     scheduled uptime checker
  packages/
    shared/     shared constants and helpers
  docs/
    architecture.md
    api.md
    schema.md
    git-workflow.md
```

## Application Routes

- `/` public uptime checker
- `/app` login, registration, and authenticated dashboard
- `/app?mode=register` registration-first auth screen

## API Surface

The API is organized around team-owned resources:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/public/uptime-check`
- `GET /api/teams/:teamId/services`
- `POST /api/teams/:teamId/services`
- `POST /api/teams/:teamId/services/:serviceId/checks/run`
- `GET /api/teams/:teamId/incidents`
- `POST /api/teams/:teamId/incidents`
- `PATCH /api/teams/:teamId/incidents/:incidentId`
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/invitations`

See [docs/api.md](docs/api.md) for more detail.

## Data Model

NetPulse stores operational data by team. Core collections include:

- `users`
- `teams`
- `teammembers`
- `services`
- `checks`
- `incidents`
- `invitations`
- `alertrules`

Most business records include a `teamId`, which keeps services, incidents, checks, and team membership isolated between organizations.

See [docs/schema.md](docs/schema.md) for schema details.

## Local Development

### Prerequisites

- Node.js
- npm
- MongoDB Community Edition

### Environment Setup

Create a local environment file:

```bash
cp .env.example .env
```

The default local values are:

```txt
API_PORT=4000
WEB_PORT=3000
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
MONGODB_URI=mongodb://127.0.0.1:27017/netpulse
JWT_SECRET=replace-with-a-long-random-secret
```

### Install Dependencies

```bash
npm install
```

### Start MongoDB

```bash
brew services start mongodb-community@8.0
```

### Start the API

```bash
npm run dev:api
```

The API runs on:

```txt
http://localhost:4000
```

### Start the Web App

In a second terminal:

```bash
npm run dev:web
```

The web app runs on:

```txt
http://localhost:3000
```

### Start the Worker

In a third terminal:

```bash
npm run dev:worker
```

The worker scans stored services and runs scheduled checks.

## Demo Data

Seed a populated sample workspace:

```bash
npm run seed:demo
```

Sample login:

```txt
Email: demo@netpulse.local
Password: password123
```

The seed creates a demo user, team, monitored services, check history, and sample incidents.

## Testing

Run the API integration tests:

```bash
npm --workspace apps/api run test
```

The test suite covers:

- API health
- public uptime checks
- user registration and login
- session loading
- service creation
- manual uptime checks
- check history
- incident creation and resolution
- admin, maintainer, and viewer authorization
- invite-code registration into an existing team

Build the web app:

```bash
npm --workspace apps/web run build
```

## Frontend Structure

- `apps/web/app/page.jsx` renders the public uptime checker.
- `apps/web/app/app/page.jsx` renders the authenticated app route.
- `apps/web/components/PublicUptimePage.jsx` handles public URL checks.
- `apps/web/components/AppShell.jsx` switches between auth and dashboard views.
- `apps/web/hooks/useNetPulseDashboard.js` owns dashboard state, API calls, and socket wiring.
- `apps/web/components/*Panel.jsx` contains focused dashboard sections.

## Backend Structure

- `apps/api/src/app.js` configures Express middleware and routes.
- `apps/api/src/controllers/` handles HTTP request and response boundaries.
- `apps/api/src/services/` contains business logic for monitoring, incidents, and authorization.
- `apps/api/src/models/` defines Mongoose schemas.
- `apps/api/src/middleware/` handles auth, team access, and errors.
- `apps/api/src/sockets/` manages realtime team rooms and status events.

## Product Workflow

1. A user registers and creates a team, or joins an existing team with an invite code.
2. Team members add websites or services to monitor.
3. NetPulse records manual and scheduled checks.
4. Service status updates based on check results.
5. Failed checks can open incidents automatically.
6. Team members create, update, and resolve incidents.
7. The dashboard receives realtime updates as service and incident state changes.

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Schema Reference](docs/schema.md)
- [Git Workflow](docs/git-workflow.md)

## Roadmap

- Public status pages for teams.
- Incident timelines and comments.
- Alert delivery through email or Slack webhooks.
- Service groups for environments such as production and staging.
- Uptime percentages over selectable time windows.
- Audit logs for role changes, service changes, and incident actions.

## License

This project is currently private and intended for development and demonstration use.
