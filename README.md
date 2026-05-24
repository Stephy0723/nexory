# NEXORY — Developer Command Center

NEXORY is a self-hosted personal dashboard for developers to manage projects, credentials, tasks, notes, and database connections in one dark, premium interface. All sensitive data (passwords, secrets, connection strings) is encrypted with AES-256-GCM before storage.

## Supabase Setup (required before first run)

1. Go to https://supabase.com and create a free account
2. Click "New Project" — choose a name and strong password
3. Wait ~2 minutes for the project to be ready
4. Go to: Project Settings → Database → Connection string
5. Copy the "Transaction pooler" string → paste as DATABASE_URL in backend/.env
6. Copy the "Session pooler" string → paste as DIRECT_URL in backend/.env
7. Replace [YOUR-PASSWORD] in both strings with the password you chose in step 2
8. Run: ./start.sh

Note: The free tier includes 500MB storage and 2 projects. No credit card needed.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup (5 steps)

```bash
# 1. Clone / navigate to the project
cd nexory

# 2. Run the startup script (Windows PowerShell)
./start.ps1

# or on macOS / Linux:
chmod +x start.sh && ./start.sh
```

That's it. The script installs dependencies, sets up the SQLite database, seeds demo data, and starts both servers.

## Default Login

| Field    | Value              |
|----------|--------------------|
| Email    | demo@nexory.dev    |
| Password | nexory2024         |

## Routes

### Frontend (http://localhost:5173)
| Route       | Description                          |
|-------------|--------------------------------------|
| /           | Login / Register                     |
| Dashboard   | Stats, recent activity, quick actions|
| Projects    | Full CRUD, table + kanban view        |
| Credentials | Encrypted secrets manager            |
| Tasks       | Kanban board + list view             |
| Notes       | Masonry grid with markdown support   |
| Database    | DB connection manager                |
| Activity    | Full audit log timeline              |

### Backend API (http://localhost:3001/api)
| Method | Path                       | Description            |
|--------|----------------------------|------------------------|
| POST   | /auth/register             | Create account         |
| POST   | /auth/login                | Login                  |
| POST   | /auth/refresh              | Refresh access token   |
| POST   | /auth/logout               | Logout                 |
| GET    | /auth/me                   | Current user           |
| GET    | /projects                  | List projects          |
| POST   | /projects                  | Create project         |
| GET    | /projects/:id              | Get project detail     |
| PUT    | /projects/:id              | Update project         |
| DELETE | /projects/:id              | Delete project         |
| GET    | /credentials               | List credentials       |
| POST   | /credentials               | Create credential      |
| GET    | /credentials/:id/reveal    | Decrypt credential     |
| PUT    | /credentials/:id           | Update credential      |
| DELETE | /credentials/:id           | Delete credential      |
| GET    | /tasks                     | List tasks             |
| POST   | /tasks                     | Create task            |
| PUT    | /tasks/:id                 | Update task            |
| DELETE | /tasks/:id                 | Delete task            |
| GET    | /notes                     | List notes             |
| POST   | /notes                     | Create note            |
| PUT    | /notes/:id                 | Update note            |
| DELETE | /notes/:id                 | Delete note            |
| GET    | /database                  | List DB connections    |
| POST   | /database                  | Create DB connection   |
| GET    | /database/:id/reveal       | Decrypt DB credentials |
| PUT    | /database/:id              | Update DB connection   |
| DELETE | /database/:id              | Delete DB connection   |
| GET    | /activity                  | Activity log           |
| GET    | /dashboard                 | Dashboard stats        |

## Environment Variables

Located at `backend/.env`:

| Variable          | Description                                  |
|-------------------|----------------------------------------------|
| DATABASE_URL      | SQLite file path (`file:./dev.db`)           |
| JWT_SECRET        | Secret for signing access tokens (15m TTL)   |
| JWT_REFRESH_SECRET| Secret for signing refresh tokens (7d TTL)   |
| ENCRYPTION_KEY    | 32-byte key for AES-256-GCM encryption       |
| PORT              | Backend port (default: 3001)                 |

## Tech Stack

**Backend:** Node.js · Express · Prisma · SQLite · bcryptjs · jsonwebtoken  
**Frontend:** React 18 · TypeScript · Vite · Zustand · @dnd-kit · Axios
