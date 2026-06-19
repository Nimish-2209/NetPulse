# NetPulse Architecture

NetPulse is a multi-team network incident and uptime monitoring platform.

## Applications

- `apps/web`: Next.js dashboard for teams, services, incidents, and charts.
- `apps/api`: Express API for auth, team access, CRUD routes, and realtime events.
- `apps/worker`: Background process for uptime checks and incident detection.
- `packages/shared`: Shared constants and small cross-app helpers.

## Multi-Team Model

Every team-owned resource must include a `teamId`.

- Services belong to teams.
- Check results belong to a service and team.
- Incidents belong to a service and team.
- Users receive roles through team membership.

## Request Rules

Protected backend routes must verify:

1. The user is authenticated.
2. The user belongs to the target team.
3. The user's team role allows the requested action.
