# NetPulse

Network incident and uptime monitoring platform for multi-team service monitoring.

## Stack

- Next.js and React for the dashboard
- Node.js and Express for the API
- MongoDB and Mongoose for persistence
- Socket.IO for realtime status updates
- Node worker process for scheduled uptime checks

## Repository Layout

```txt
NetPulse/
  apps/
    web/        Next.js frontend
    api/        Express backend
    worker/     background uptime checker
  packages/
    shared/     shared constants and helpers
  docs/
    architecture.md
    api.md
    schema.md
    git-workflow.md
```

## Frontend Organization

- `apps/web/app/page.jsx`: small page entry that chooses auth or dashboard view.
- `apps/web/hooks/useNetPulseDashboard.js`: dashboard state, API calls, and realtime socket wiring.
- `apps/web/components/AuthPanel.jsx`: login/register screen.
- `apps/web/components/DashboardView.jsx`: main dashboard layout composition.
- `apps/web/components/*Panel.jsx`: focused sections for services, incidents, checks, and team members.

## Current Phase

Working MVP.

## Local Development

Create `.env` from the example:

```bash
cp .env.example .env
```

Start MongoDB:

```bash
brew services start mongodb-community@8.0
```

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm run dev:api
```

Start the web app in another terminal:

```bash
npm run dev:web
```

Optional worker:

```bash
npm run dev:worker
```

## Demo Data

Seed a populated demo account:

```bash
npm run seed:demo
```

Demo login:

```txt
Email: demo@netpulse.local
Password: password123
```

The seed creates:

- Connectify Demo Team
- three monitored services
- latency/check history
- open and acknowledged incidents
- admin team membership for the demo user

## Tests

Run the backend integration tests:

```bash
npm --workspace apps/api run test
```

The API test suite uses an isolated in-memory MongoDB and covers:

- health check
- registration and session loading
- login
- service creation
- manual uptime checks
- incident creation/resolution
- admin/member/viewer permissions

## URLs

- Web app: `http://localhost:3000`
- API health: `http://localhost:4000/api/health`

## MVP Features

- Register and log in with JWT auth.
- Create an initial team during registration.
- Use admin, maintainer, and viewer team roles.
- Admins can add, remove, and change team member roles.
- Load team-scoped services and incidents.
- Add monitored services.
- Run a manual uptime check.
- Store check results and update service status.
- Create and resolve incidents.
- Run a background worker that checks services every minute.
- Stream service, check, and incident updates with Socket.IO.
- Plot recent latency history for the selected service.
