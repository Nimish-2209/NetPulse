# NetPulse Schema Plan

## User

- `name`
- `email`
- `passwordHash`

## Team

- `name`
- `slug`
- `createdBy`

## TeamMember

- `userId`
- `teamId`
- `role`: `admin`, `maintainer`, or `viewer`

## Service

- `teamId`
- `name`
- `url`
- `checkIntervalSeconds`
- `currentStatus`
- `createdBy`

## CheckResult

- `teamId`
- `serviceId`
- `status`
- `latencyMs`
- `statusCode`
- `checkedAt`
- `errorMessage`

## Incident

- `teamId`
- `serviceId`
- `title`
- `description`
- `severity`
- `status`
- `assignedTo`
- `openedAt`
- `resolvedAt`
- `timeline`

## Incident Timeline Entry

- `type`: `created`, `updated`, `assigned`, `unassigned`, `acknowledged`, `resolved`, or `comment`
- `message`
- `actorId`
- `createdAt`
