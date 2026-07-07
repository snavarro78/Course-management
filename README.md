# Course-management
IDP Training Management System
# IDP — Course and Enrollment Management System

Web system for the Instituto de Desarrollo Profesional (IDP) at Costa Rica's Ministry of Public Education. It manages people, courses, enrollments, mediators, and generates PDF reports.

Monorepo made up of:

```
idp-sistema/
├── backend/    → REST API (FastAPI + Supabase)
└── frontend/   → SPA (React + Vite)
```

## Overall architecture

```
┌─────────────┐        HTTPS/JSON        ┌──────────────┐        ┌───────────────┐
│   Frontend   │ ───────────────────────▶ │   Backend     │ ─────▶ │   Supabase     │
│  React (SPA) │ ◀─────────────────────── │  FastAPI API  │ ◀───── │  (PostgreSQL)  │
└─────────────┘         JWT Bearer        └──────────────┘        └───────────────┘
```

- **Frontend:** single-page application (SPA) with React Router, consumes the API via `fetch` and stores the JWT in `localStorage`.
- **Backend:** layered REST API built with FastAPI (details below), JWT authentication, rate limiting, and Supabase as the database.
- **Database:** PostgreSQL managed by Supabase.

---

## Backend (`/backend`)

REST API built with **FastAPI**, following a **layered architecture**:

```
backend/
├── app.py                  # Entry point: routers, middlewares, CORS, rate limiting
├── passenger_wsgi.py       # ASGI→WSGI adapter for shared hosting (cPanel/Passenger)
├── requirements.txt
├── .env.example
├── routes/                 # Presentation layer (REST controllers)
├── schema/schemas.py       # Pydantic models (DTOs) — input/output validation
├── models/database.py      # Supabase clients (anon and service_role)
└── middleware/security.py  # JWT, bcrypt hashing, auth dependencies
```

**Request flow:** `routes/` receives the request → validates it with `schema/schemas.py` → queries/mutates via `models/database.py` (Supabase) → optionally protected by `middleware/security.py` (JWT).

### Features

- JWT authentication (only `admin` and `sub_admin` roles can log in), passwords hashed with bcrypt.
- Rate limiting with `slowapi`, configurable CORS, security headers (HSTS, X-Frame-Options, etc.).
- Global error handling with structured logging.
- Bulk upload of people and enrollments from CSV, with flexible column mapping.
- `/health` endpoint for monitoring.

### Installation and running

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your Supabase credentials
uvicorn app:app --reload
```

API available at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs` (if `DEBUG=True`).

### Environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Anonymous (anon/public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service_role key (⚠️ server-side only) |
| `SECRET_KEY` | Secret key used to sign JWTs |
| `ALGORITHM` | JWT algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration in minutes |
| `APP_NAME` / `APP_VERSION` | App metadata |
| `DEBUG` | Enables `/docs` and `/redoc` |
| `ALLOWED_ORIGINS` | Allowed CORS origins, comma-separated |

### Main endpoints (`/api/v1`)

| Resource | Prefix |
|---|---|
| Authentication | `/auth/login`, `/auth/register`, `/auth/logout` |
| People | `/personas` |
| Courses | `/cursos` |
| Enrollments | `/matriculas` |
| Job classes | `/clases-puesto` |
| Strata | `/estratos` |
| Course-Mediators | `/curso-mediadores` |
| Bulk upload | `/carga-masiva/previsualizar/{id_curso}`, `/carga-masiva/matriculas/{id_curso}` |
| System | `/health` |

---

## Frontend (`/frontend`)

SPA built with **React 18 + Vite + React Router**.

```
frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx              # Route definitions
    ├── App.css
    ├── Pages/
    │   ├── Register.jsx     # User registration
    │   ├── Login.jsx        # Login (admin/sub_admin only)
    │   ├── Home.jsx         # Dashboard with statistics
    │   ├── Personas.jsx     # People CRUD
    │   ├── Mediadores.jsx   # Mediator assignment to courses
    │   ├── Cursos.jsx       # Courses CRUD
    │   ├── Matriculas.jsx   # Enrollment management + CSV bulk upload
    │   └── Reportes.jsx     # Search by national ID + PDF generation
    ├── Components/
    │   └── Sidebar.jsx      # Side navigation (role-based)
    ├── services/
    │   └── api.js           # HTTP client for the backend
    └── styles/
        ├── Home.css
        ├── Modal.css
        └── Register.css
```

### Features

- **Protected routes** via JWT token stored in `localStorage`.
- **Role-based access control** (`admin` sees the full menu; `sub_admin` only sees Enrollments and Reports, read-only mode).
- **Full CRUD** for People, Courses, Enrollments, and Mediator assignment (max. 4 per course).
- **Bulk upload** of enrollments via CSV with a preview step before confirming.
- **PDF reports** per person (course history) using `jsPDF` + `jspdf-autotable`.
- Institutional blue/gold color palette (Costa Rican Central Government).

### Installation and running

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (Vite's default port).

> ⚠️ **Important:** `src/services/api.js` has the backend URL hardcoded to `http://127.0.0.1:8000/api/v1`. For production, replace it with your deployed API's real URL (ideally via a `VITE_API_URL` environment variable).

### Production build

```bash
npm run build
```

Generates a `dist/` folder ready to deploy to any static hosting (Vercel, Netlify, cPanel, etc.).

---

## Typical usage flow

1. A user registers (`/`) or logs in (`/login`) with an institutional `@mep.go.cr` email.
2. Only `admin` and `sub_admin` roles can authenticate.
3. The `admin` manages People, Courses, Mediators, and Enrollments from the Dashboard.
4. The `sub_admin` can only view Enrollments and generate PDF Reports.
5. Enrollments can be added one at a time or in bulk via CSV.

## Security

- Never commit the `.env` files from `backend/` or `frontend/` to the repository (already excluded via `.gitignore`).
- Rotate your Supabase keys and `SECRET_KEY` periodically, and always if you suspect they were exposed.
- Login is restricted to `@mep.go.cr` emails and `admin`/`sub_admin` roles.

## Roadmap / known pending items

- Parametrize the frontend's `BASE_URL` using environment variables.
- Public registration (`Register.jsx`) is not yet connected to the backend (`// TODO: connect to backend`).
- Review duplicated functions in `backend/middleware/security.py`.

## License

To be defined.
