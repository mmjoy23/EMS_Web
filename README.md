# 🎓 UniEvents — Online Event Registration System

A full-stack campus event registration platform. Students can discover and register for events; organizers can host and manage them; admins review, moderate, and enforce policies.

Original Figma design: [Online Event Registration System](https://www.figma.com/design/0D2DUGQ9ki9Lz1qkbsbkqf/Online-Event-Registration-System--Copy-)

---

## 📐 Project Architecture

```
/                        ← Root (frontend + monorepo config)
├── src/                 ← React frontend (Vite + TypeScript)
├── server/              ← Express API backend (Node.js + TypeScript)
│   ├── src/             ← API routes, auth, middleware, scheduler
│   ├── prisma/          ← Database schema & seed data
│   │   ├── schema.prisma    ← SQLite database models
│   │   └── seed.ts          ← Sample data seeder
│   └── .env             ← Backend environment variables
├── package.json         ← Root scripts (runs both frontend + backend)
└── vite.config.ts       ← Vite config (proxies /api → backend)
```

### How the two parts connect

| Part | Tech | Port |
|------|------|------|
| **Frontend** | React + Vite + TailwindCSS + shadcn/ui | `http://localhost:5173` |
| **Backend API** | Express + Prisma + SQLite | `http://localhost:4000` |

> Vite automatically proxies all `/api` requests from the frontend to the backend on port 4000, so you only ever open `localhost:5173` in your browser.

---

## 🗃️ Database Overview

The backend uses **SQLite** (a local file — no server installation needed) managed by **Prisma ORM**.

The database file is stored at: `server/prisma/dev.db`

### Database Models / Tables

| Model | Purpose |
|-------|---------|
| `User` | Students, organizers, admins (role-based) |
| `Category` | Event categories (e.g., Tech, Sports, Arts) |
| `Event` | Campus events with seats, pricing, approval flow |
| `EventCoHost` | Co-organizers for an event |
| `Registration` | Student registrations with ticket codes & QR check-in |
| `Cancellation` | Cancellation records with penalty/refund tracking |
| `Feedback` | Star ratings and comments after events |
| `Complaint` | Participant complaints against events |
| `Fine` | Fines issued to event organizers |
| `EmailMessage` | In-app email outbox (stores rendered emails) |

---

## ⚙️ Environment Variables

The backend reads from `server/.env`. The file is already included with safe defaults for local development:

```env
DATABASE_URL="file:./prisma/dev.db"          # SQLite file location
JWT_SECRET="unievents-dev-secret-change-me"  # Change in production!
PORT=4000                                     # API server port
CLIENT_ORIGIN="http://localhost:5173"         # Frontend origin (for CORS)
SMTP_URL=""                                   # Leave empty for in-app Outbox mode
```

> **Email:** By default emails are **not sent** — they are stored in the database and viewable in the in-app Outbox. Set `SMTP_URL` to a real SMTP server to enable actual sending.

---

## 🚀 Running the Project

### Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later

---

### Option A — One-command full setup (recommended for first time)

This installs all dependencies, sets up the database, and seeds it with sample data:

```bash
npm run setup
```

Then start the app:

```bash
npm run dev
```

Open your browser at **http://localhost:5173**

---

### Option B — Step by step

#### 1. Install dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run server:install
```

#### 2. Set up the database

```bash
# Create/update the SQLite database file from the Prisma schema + seed sample data
npm run server:reset
```

This runs `prisma db push` (creates `server/prisma/dev.db`) and then seeds it with sample users, categories, and events.

#### 3. Start the development servers

```bash
npm run dev
```

This starts **both** the frontend (Vite) and backend (Express) concurrently:
- 🟦 `web` → Vite frontend on http://localhost:5173
- 🟪 `api` → Express backend on http://localhost:4000

---

## 🛠️ All Available Scripts

Run these from the **root** directory:

| Script | What it does |
|--------|-------------|
| `npm run setup` | Full first-time setup: install deps + DB push + seed |
| `npm run dev` | Start frontend + backend together (recommended) |
| `npm run dev:web` | Start only the Vite frontend |
| `npm run dev:api` | Start only the Express backend |
| `npm run build` | Build the frontend for production |
| `npm run server:install` | Install backend-only dependencies |
| `npm run server:seed` | Re-seed the database with sample data |
| `npm run server:reset` | **Wipe & recreate** the database, then re-seed |

---

## 🗄️ Database Commands

Run these from inside the `server/` directory, or use the root shortcuts below.

| Command | What it does |
|---------|-------------|
| `npx prisma db push` | Apply schema changes to the SQLite file |
| `npx prisma generate` | Re-generate the Prisma Client after schema changes |
| `npx prisma studio` | Open a visual browser UI to browse/edit the database |
| `npx tsx prisma/seed.ts` | Manually run the seed script |

Root-level shortcuts (run from project root):

```bash
npm run server:seed    # re-seed data (keeps existing DB)
npm run server:reset   # wipe DB completely and re-seed
```

---

## 🔄 Day-to-Day Development Workflow

```
1. npm run dev          ← start both servers
2. Edit code in src/    ← frontend hot-reloads automatically
3. Edit code in server/ ← backend restarts automatically (tsx watch)
4. If you change prisma/schema.prisma → run: npm run server:reset
```

---

## 👤 Default Test Accounts (after seeding)

After running `npm run setup` or `npm run server:seed`, sample accounts are created. Check `server/prisma/seed.ts` for the exact email addresses and passwords used.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + React Router 7 |
| Build Tool | Vite 6 |
| Styling | TailwindCSS 4 + shadcn/ui (Radix UI) |
| Icons | Lucide React + MUI Icons |
| Charts | Recharts |
| Backend | Express 5 (Node.js) |
| ORM | Prisma 6 |
| Database | SQLite (local file, no server needed) |
| Auth | JWT (stored in HTTP-only cookies) |
| Validation | Zod |
| Password hashing | bcryptjs |