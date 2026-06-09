# EMPS — Employee Management Platform System

A full-stack employee management web application built on Netlify. Manages employees, leave requests, and payroll visibility through a browser-based interface backed by a managed Postgres database.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with live stats |
| `/dashboard.html` | Admin dashboard — KPIs, departments, leave status |
| `/employees.html` | Employee management — full CRUD, search, filters |
| `/article.html` | Editorial article: from C terminal to web platform |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| GET | `/api/employees/:id` | Get single employee |
| PUT | `/api/employees/:id` | Update employee (any fields) |
| DELETE | `/api/employees/:id` | Soft-deactivate employee |
| GET | `/api/stats` | Dashboard statistics |

## Stack

- **Frontend**: Vanilla HTML/CSS/JS — Oswald + Source Sans 3 + JetBrains Mono
- **Functions**: Netlify Functions v2 (TypeScript + esbuild)
- **Database**: Netlify Database (managed Postgres) via Drizzle ORM `@beta`
- **Deployment**: Netlify

## Origin

Ported from a C-language employee management system. The data model (leave states, soft deletion, salary tracking) maps directly to the original C struct.

## Development

```bash
npm install
netlify dev
```

Open [http://localhost:8889](http://localhost:8889).
