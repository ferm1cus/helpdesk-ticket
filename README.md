# IT Helpdesk Ticketing System

An enterprise-style helpdesk app: employees raise tickets, agents work them through a controlled workflow, admins manage users and review an audit trail.

**Stack:** Node.js, Express, SQLite (better-sqlite3), JWT + bcrypt, vanilla HTML/CSS/JS frontend, Jest + Supertest.

## Prerequisites
- Node.js 18 or newer (`node -v`)

## Install and run locally
```bash
npm install
npm start
```
Open http://localhost:3000. The SQLite file (`helpdesk.db`) is created automatically on first run. Configuration lives in `.env` (copy from `.env.example`).

## Run tests
```bash
npm test
```

## Run with Docker (optional)
```bash
docker build -t helpdesk .
docker run -p 3000:3000 helpdesk
```

## Demo accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpdesk.com | Admin@123 |
| Agent | agent@helpdesk.com | Agent@123 |
| Employee | employee@helpdesk.com | Employee@123 |

Public sign-up always creates an employee. Admins create agents/admins from the Users tab. Set `SEED_DEMO=false` in `.env` to skip the demo agent/employee (the admin is always seeded).

## Architecture
```
project-root
├── frontend/       # index.html, app.js, style.css (served statically by Express)
├── backend/
│   ├── controllers/  # thin request handlers
│   ├── services/     # business rules (workflow, access checks, audit)
│   ├── middleware/   # JWT auth, RBAC, validation, error handling
│   ├── models/       # SQLite schema and data access, seed data
│   ├── routes/       # API route definitions
│   ├── app.js        # Express app (used by tests)
│   └── server.js     # entry point
├── tests/          # API tests
├── Dockerfile
└── README.md
```
Request flow: route -> middleware (auth, role, validation) -> controller -> service -> model -> SQLite.

## Roles
- **Employee:** create tickets, view own tickets, comment, close own resolved tickets.
- **Agent:** view all tickets, assign to self, move tickets through the workflow, comment.
- **Admin:** everything an agent can do, plus assign any agent, manage users, view the audit log.

## Ticket workflow
`Open -> In Progress -> Resolved -> Closed` (also `In Progress -> Open` and `Resolved -> In Progress`). Invalid jumps return `409`.

## API
All routes except register/login need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | /api/auth/register | public | Register an employee |
| POST | /api/auth/login | public | Log in, returns JWT |
| GET | /api/auth/me | any | Current user |
| GET | /api/users | admin | List users |
| POST | /api/users | admin | Create user with a role |
| GET | /api/users/agents | agent, admin | List agents |
| GET | /api/tickets | any | List (filters: status, priority, category, q, assignedTo=me; page, limit) |
| POST | /api/tickets | any | Create ticket |
| GET | /api/tickets/:id | any (employees: own only) | Ticket with comments |
| PATCH | /api/tickets/:id/status | any (rules apply) | Change status `{status}` |
| PATCH | /api/tickets/:id/assign | agent, admin | Assign `{assigneeId}` |
| POST | /api/tickets/:id/comments | any | Add comment `{body}` |
| GET | /api/audit | admin | Paginated audit log |

Errors return `{ "error": "message" }` with 400 (validation), 401 (auth), 403 (role), 404, or 409 (workflow/duplicate).
