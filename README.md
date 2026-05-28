# Task Manager

A full-stack task management application built with .NET 8, EF Core, SQLite, and React.

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 8.0+ |
| Node.js | 18+ (tested with 24) |
| npm | 9+ (tested with 11) |

---

## Setup & Run

### 1. Backend

```bash
cd backend
dotnet run
```

- API starts at **http://localhost:5050**
- A `tasks.db` SQLite file is created in `backend/` on first run
- Data persists across restarts — stop and restart the API, tasks are still there

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App opens at **http://127.0.0.1:5173**
- The Vite dev server proxies all `/api` requests to `http://127.0.0.1:5050`, so no manual CORS setup is needed

### 3. Tests

Run from the solution root or the test project folder:

```bash
dotnet test
```

- 17 tests, all passing
- No external dependencies — each test run gets an isolated in-memory database
- The backend does not need to be running

**Run a specific test class:**
```bash
dotnet test --filter "ClassName=OwnershipTests"
dotnet test --filter "ClassName=ValidationTests"
```

**Run with test names printed:**
```bash
dotnet test --logger "console;verbosity=normal"
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in, returns JWT |
| GET | `/api/tasks` | Yes | List own tasks (optional `?status=Pending`) |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/{id}` | Yes | Get single task |
| PUT | `/api/tasks/{id}` | Yes | Update task |
| DELETE | `/api/tasks/{id}` | Yes | Delete task |

All authenticated endpoints require `Authorization: Bearer <token>`.  
Accessing another user's task returns **404** — the existence of the resource is not revealed.

---

## Project Structure

```
TaskManager.sln
├── backend/                    .NET 8 Web API (single project)
│   ├── Controllers/
│   │   ├── AuthController.cs   Register, login, JWT issuance
│   │   └── TasksController.cs  CRUD — all queries scoped to current user
│   ├── DTOs/
│   │   ├── AuthDtos.cs         RegisterRequest, LoginRequest, AuthResponse
│   │   └── TaskDtos.cs         CreateTaskRequest, UpdateTaskRequest, TaskResponse
│   ├── Models/
│   │   ├── User.cs             Id, Email, PasswordHash, CreatedAt
│   │   └── TaskItem.cs         Id, Title, Description, TaskState, DueDate, UserId
│   ├── AppDbContext.cs          EF Core DbContext, unique index on email, cascade delete
│   ├── Program.cs              Composition root — DB, JWT, CORS, controllers
│   └── appsettings.json        Connection string, JWT config, CORS origin
│
├── backend.Tests/              xUnit integration tests
│   ├── OwnershipTests.cs       User A cannot read/edit/delete User B's tasks
│   ├── ValidationTests.cs      API rejects bad titles, weak passwords, bad emails
│   ├── TestFactory.cs          WebApplicationFactory with per-test in-memory DB
│   └── Helpers.cs              Shared register/login/create-task helpers
│
└── frontend/                   React 18 + TypeScript + Vite
    └── src/
        ├── api/
        │   ├── client.ts       Central fetch wrapper, attaches Bearer token, normalises errors
        │   ├── auth.ts         register(), login()
        │   └── tasks.ts        getTasks(), createTask(), updateTask(), deleteTask()
        ├── components/
        │   ├── TaskForm.tsx    Create / edit form — validates before submit, preserves input on error
        │   ├── TaskItem.tsx    Task row — inline status select, edit form, delete with confirm
        │   └── ProtectedRoute.tsx  Redirects to /login if no token
        ├── context/
        │   └── AuthContext.tsx Session state, localStorage persistence, signIn / signOut
        └── pages/
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            └── TasksPage.tsx   List, filter, empty state, loading state, error + retry
```

---

## Thought Process & Architecture Decisions

### Keeping it flat

The brief asked for a task manager — one entity, a handful of endpoints. I chose the simplest shape that works correctly:

- **One .NET project**, not a solution split across Application / Domain / Infrastructure layers. An abstraction earns its place when it has a second use. With one entity and one database, a repository layer would just be a wrapper around EF Core with no additional value.
- **No MediatR or CQRS.** Those tools solve specific problems (decoupling command dispatch, scaling teams across bounded contexts). They are overhead here, not architecture.
- **EF Core directly in controllers via a thin service layer.** The code is easy to follow: request comes in, gets validated, query runs, response goes out.

### Authentication — complete or not at all

The brief was clear: a login screen with no data isolation is worse than no login at all. So auth is either fully closed or absent. I built it fully:

- Passwords hashed with **bcrypt** (cost factor 11)
- **JWT** (HS256, 24h expiry) — stateless, no session store needed
- Every task query includes `WHERE UserId = <current user>` — enforced at the database level, not just the UI
- Cross-user access returns **404**, not 403 — we don't confirm whether a resource exists for a different user

### SQLite over in-memory

The brief listed both as options. In-memory EF Core is fine for tests but data disappears on restart — that is a broken product, not a trade-off. SQLite gives real persistence with zero infrastructure. Tests use in-memory via `WebApplicationFactory` so they remain dependency-free.

### Tests focused on risk, not coverage

Two areas are genuinely dangerous if broken:

1. **Ownership** — a bug here exposes every user's data to every other user
2. **Validation** — bad input reaching the database causes corrupted state or crashes

I wrote explicit tests for both. I did not write tests for EF Core CRUD mechanics or button rendering — those aren't my code and aren't the risk. 17 focused tests signal better judgment than 50 tests that verify a label renders.

### Frontend — typed, no library sprawl

- **React + TypeScript + Vite** — nothing else. No state management library; `useState` and `useContext` are sufficient for this scope.
- **Central fetch wrapper** (`api/client.ts`) — one place that attaches the Bearer token and normalises errors into a typed `ApiError`. Every API call goes through it.
- **Controlled forms** — form state is never reset on a failed submit. The user's input is preserved. Error messages are shown inline, not just as a console log.
- **Full circle on every feature** — if a backend endpoint exists, the UI has the corresponding control. Delete button exists, edit form exists, status can be changed without navigating away.

### Date handling

Due dates are stored as UTC in the database. Displaying them with `new Date(str).toLocaleDateString()` introduces a timezone offset that shifts the displayed date by one day for users behind UTC. The fix: render with `{ timeZone: 'UTC' }` and slice the date portion directly from the ISO string rather than constructing a `Date` object just to format it back.

---

## What I Left Out (and why)

### Refresh tokens
The JWT expires after 24 hours and the user is redirected to login. A production app would use a short-lived access token (15 minutes) paired with a long-lived refresh token stored in an `httpOnly` cookie, with a revocation table for logout. I excluded it because implementing rotation and revocation correctly is a meaningful scope addition and the auth loop is complete without it.

### httpOnly cookies
The token is stored in `localStorage`, which is vulnerable to XSS. The production approach is an `httpOnly` + `SameSite=Strict` cookie issued by the server, with a CSRF token for state-mutating requests. Excluded to keep local setup simple — no cookie configuration or HTTPS requirement for a first run.

### Rate limiting on auth endpoints
No brute-force protection on `/api/auth/login`. In production: ASP.NET Core's built-in rate limiting middleware with a per-IP sliding window on auth routes.

### Email verification
Register accepts any valid email format. No confirmation step. Would add: a `Verified` flag on the `User` model, a background send-on-register job, and a `GET /api/auth/verify?token=…` endpoint.

### Pagination
The task list loads all tasks for the authenticated user. Acceptable at this scale. Would add cursor-based pagination at ~100+ tasks.

---

## What I Would Do With Another Day

1. **Refresh token rotation** — short-lived access token, long-lived refresh token, revocation table
2. **httpOnly cookie auth** — removes the localStorage XSS risk entirely
3. **Optimistic updates** — update the UI immediately, roll back on server error
4. **Overdue task surfacing** — highlight or sort tasks where `DueDate < now` and status is not Done
5. **E2E tests (Playwright)** — covering the full register → create → edit → delete → logout → login → verify loop

---

## Assumptions

- Single-tenant: one SQLite file, users isolated by `UserId` foreign key
- Email is the unique identifier — stored lowercase, compared case-insensitively
- Due dates are optional; if provided, stored as UTC
- Task status is a three-value enum: Pending / InProgress / Done
- The JWT signing key in `appsettings.json` is a placeholder for local development. In any real environment this must come from an environment variable or secrets manager and must never be committed to source control
