# Task Manager

A full-stack task management application built with .NET 8 and React.

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

The API starts at **http://localhost:5050**.  
A `tasks.db` SQLite file is created in the `backend/` folder on first run. Data persists across restarts.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://127.0.0.1:5173**.

> The Vite dev server proxies `/api` requests to `http://localhost:5000`, so no CORS configuration is needed during development.

### 3. Tests

```bash
cd backend.Tests
dotnet test
```

17 tests. No external dependencies — uses an isolated in-memory database per test run.

---

## What I Built

- **Authentication** — register, login, JWT-based sessions (24-hour expiry). Tokens stored in `localStorage`.
- **Task CRUD** — create, edit, delete, and toggle tasks between Pending / In Progress / Done.
- **Ownership enforced at the query level** — every database query includes `WHERE UserId = <current user>`. Accessing another user's task returns 404 — the existence of the resource is not confirmed.
- **Input validation** — on both frontend and backend. Forms preserve user input on validation failure and show field-level errors.
- **Immediate UI updates** — list updates after every create, edit, or delete without a page refresh.
- **Error states** — network errors, server errors, and validation errors are all surfaced to the user. No silent failures.
- **Empty and loading states** — the task list shows a spinner while loading, a clear empty state when there are no tasks, and a retry button if the network request fails.
- **Filter by status** — All / Pending / In Progress / Done.
- **Persistent storage** — SQLite file. Restart the API; tasks are still there.

---

## What I Left Out (and why)

### Refresh tokens
The JWT expires after 24 hours and the user is redirected to login. A production app would use a short-lived access token paired with a long-lived refresh token (rotation + revocation table). I excluded it because implementing it correctly is a meaningful scope addition and the core auth loop is complete without it.

### httpOnly cookies
The token is stored in `localStorage`, which is vulnerable to XSS. Production approach: `httpOnly` + `SameSite=Strict` cookie issued by the server, with a CSRF token for state-mutating requests. Excluded to keep local setup simple.

### Rate limiting on auth endpoints
No brute-force protection on `/api/auth/login`. In production: ASP.NET Core rate limiting middleware with a per-IP sliding window.

### Email verification
Register accepts any valid email format. No confirmation step. Would add: a `Verified` flag on the `User` model, a send-on-register job, and a `GET /api/auth/verify?token=…` endpoint.

### Pagination
The task list loads all tasks for the authenticated user. Would add cursor-based pagination once the list grows beyond ~100 items.

---

## What I Would Do With Another Day

1. **Refresh token rotation** — short-lived access token, long-lived refresh token with a revocation table.
2. **httpOnly cookie auth** — eliminates the localStorage XSS risk.
3. **Optimistic updates** — update the UI before the server confirms and roll back on error, for a snappier feel.
4. **Due date notifications** — a background job to mark overdue tasks and surface them at the top of the list.
5. **E2E tests (Playwright)** — covering the full register → create task → logout → login → verify task flow.

---

## Assumptions

- Single tenant: one SQLite database, users isolated by `UserId` FK.
- Email is the unique user identifier (case-insensitive, stored lowercase).
- Due dates are optional. If provided, stored as UTC, displayed in the user's local timezone.
- "Complete" is a three-state toggle (Pending → In Progress → Done), not a workflow.
- The JWT signing key in `appsettings.json` is a placeholder. In a real deployment this would come from an environment variable or secrets manager and would not be committed.

---

## Project Structure

```
TaskManager.sln
├── backend/                  .NET 8 Web API
│   ├── Controllers/          AuthController, TasksController
│   ├── DTOs/                 Request and response shapes
│   ├── Models/               User, TaskItem, TaskState
│   ├── AppDbContext.cs       EF Core / SQLite
│   └── Program.cs            Composition root
│
├── backend.Tests/            xUnit integration tests
│   ├── OwnershipTests.cs     Can User A access User B's data?
│   ├── ValidationTests.cs    Does the API reject bad input?
│   └── TestFactory.cs        WebApplicationFactory with in-memory DB
│
└── frontend/                 React 18 + TypeScript + Vite
    └── src/
        ├── api/              Typed fetch wrapper, auth and task calls
        ├── components/       TaskForm, TaskItem, ProtectedRoute
        ├── context/          AuthContext (JWT storage + session restore)
        └── pages/            LoginPage, RegisterPage, TasksPage
```
