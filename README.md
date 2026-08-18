# QuickSplit

> A modern, API-first bill-splitting platform for groups, expenses, balances, and settlements — with AI-powered receipt intelligence as the product direction.

QuickSplit is designed to remove the friction from splitting shared expenses. Instead of manually calculating who owes whom, the platform models groups, members, expenses, individual splits, balances, and settlements through a structured backend API and a cross-platform mobile frontend.

## What QuickSplit Does

- **Accounts** — user registration, login, JWT-based authentication, and current-user access.
- **Groups** — create and manage shared expense groups and their members.
- **Expenses** — record shared expenses with structured data.
- **Expense splits** — associate expenses with individual members and their portions.
- **Balances** — calculate what participants owe within a group.
- **Settlements** — record and manage payments between members.
- **AI receipt intelligence** — planned product layer for turning receipt data into structured expenses and reducing manual entry.

The backend currently exposes dedicated API modules for authentication, groups, members, expenses, expense splits, balances, and settlements. fileciteturn36file0L2-L2

## Architecture

```text
┌─────────────────────────────┐
│       React Native / Expo   │
│        TypeScript App       │
└──────────────┬──────────────┘
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│          FastAPI            │
│        REST API             │
├─────────────────────────────┤
│ Auth │ Groups │ Expenses    │
│ Splits │ Balances │ Settlements │
└──────────────┬──────────────┘
               │ SQLAlchemy
               ▼
┌─────────────────────────────┐
│        PostgreSQL            │
│       Persistent Data        │
└─────────────────────────────┘
```

The API is built with FastAPI and SQLAlchemy, uses PostgreSQL through Psycopg, and manages schema changes with Alembic. fileciteturn29file0L2-L2

## Tech Stack

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy 2
- PostgreSQL
- Psycopg 3
- Alembic
- Pydantic
- JWT authentication
- Uvicorn

The backend dependency set includes FastAPI, SQLAlchemy, Psycopg, Alembic, Pydantic, PyJWT, and Uvicorn. fileciteturn29file0L2-L2

### Frontend

- React Native
- Expo
- TypeScript
- Expo Router / file-based navigation
- React Navigation
- TanStack React Query
- Axios
- React Hook Form
- Zod
- NativeWind

The mobile client is structured as an Expo application with TypeScript and React Native, with React Query, Axios, form validation, and NativeWind included in its dependencies. fileciteturn33file0L2-L2

## Backend API

The current FastAPI application registers these API areas:

| Area | Purpose |
|---|---|
| `/auth` | Registration, login, current user |
| Groups | Group management |
| Members | Group membership |
| Expenses | Expense management |
| Expense Splits | Per-member expense allocation |
| Balances | Group balance calculations |
| Settlements | Settlement records and payments |

Authentication currently provides `/auth/register`, `/auth/login`, and `/auth/me`. fileciteturn37file0L2-L2

### Health & API documentation

When the backend is running locally:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

The health endpoint also verifies database connectivity. fileciteturn36file0L2-L2

## Project Structure

```text
QuickSplit/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   └── frontend/
│       ├── app/
│       ├── src/
│       ├── assets/
│       └── package.json
│
└── Planning/
    ├── Phase 1 — Product Planning
    ├── Phase 2 — Architecture
    ├── Phase 3 — Database / PostgreSQL
    ├── Phase 4 — UI/UX
    └── Phase 5 — Authentication
```

The repository keeps the implementation and the phased architecture/database/UI/authentication planning documents together. fileciteturn27file0L2-L2 fileciteturn34file0L2-L2

## Getting Started

### 1. Clone

```bash
git clone https://github.com/ashwin4087-a11y/QuickSplit.git
cd QuickSplit
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

**macOS / Linux:**

```bash
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The backend README documents the same local setup and uses `uvicorn app.main:app --reload` to start the API. fileciteturn32file0L2-L2

### 3. Start the mobile app

```bash
cd frontend/frontend
npm install
npx expo start
```

You can then open the project using an Android emulator, iOS simulator, Expo Go, or the web target supported by the Expo project. fileciteturn38file0L2-L2

## Database

QuickSplit uses PostgreSQL as its persistent database and SQLAlchemy as its ORM layer. Alembic is included for database migrations. fileciteturn29file0L2-L2

Configure the database connection and application settings through `backend/.env`. A template is provided at `backend/.env.example`.

## Authentication

Authentication is implemented around registration, login, JWT access tokens, and authenticated current-user access. Protected API routes use the backend's current-user dependency. fileciteturn37file0L2-L2

## Product Direction

The long-term differentiator for QuickSplit is **receipt intelligence**:

```text
Receipt / Bill
      ↓
Receipt understanding
      ↓
Structured items + amounts
      ↓
Group members
      ↓
Item-level / expense-level allocation
      ↓
Balances
      ↓
Settlement
```

The repository contains dedicated planning documents covering product planning, architecture, database design, UI/UX, and authentication. fileciteturn34file0L2-L2

The README intentionally distinguishes the current API foundation from planned AI functionality rather than presenting roadmap items as already implemented.

## Development Status

QuickSplit is an actively developed project. The current repository contains a functional FastAPI backend foundation, PostgreSQL persistence layer, authentication flow, expense/group/balance/settlement API structure, and an Expo/React Native client. The AI receipt-intelligence layer remains part of the product roadmap.

## Why QuickSplit?

Traditional bill splitting usually means:

> take receipt → read every item → calculate shares → message everyone → chase payments

QuickSplit is built around reducing that workflow to:

> **capture → understand → split → settle**

## License

See the frontend license and repository contents for the current licensing information.

## Repository

urlGitHub — QuickSplithttps://github.com/ashwin4087-a11y/QuickSplit
