# 🔗 Team Sync

> **Collaborative Workspace & Task Management Platform**  
> Built by **Alok Kushwaha**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)

---

## 📌 Overview

**Team Sync** is a full-stack B2B project management platform that enables teams to collaborate in shared workspaces, manage projects and tasks, track progress in real time, and detect team burnout — all in one place.

Unlike traditional task managers, Team Sync includes:
- 🤖 **AI-powered task enhancement** (Google Gemini 1.5 Flash)
- 🔥 **Team Burnout Radar** with auto email alerts
- 📜 **Live Activity Feed** — real-time audit trail of everything that happens
- ✉️ **Email notifications** for every workspace event
- 🔄 **Real-time data sync** via polling

---

## ✨ Features

### 🏢 Workspaces
- Create and manage multiple workspaces
- Invite members via invite links or email
- Role-based access control (Owner / Admin / Member)
- Workspace analytics at a glance

### 📂 Projects
- Create projects with custom emoji and name
- View all projects in a workspace
- Per-project analytics: task counts by status/priority
- Email notifications to all parties on create/update/delete

### ✅ Tasks
- Create, edit, and delete tasks within projects
- Assign tasks to workspace members
- Set status, priority, due dates, and descriptions
- **Inline status editing** directly in the task table
- Task assignees can update their own task status without elevated permissions
- Email notifications on task assignment, update, deletion

### 🤖 AI Features (Google Gemini)
- **✨ AI Enhance**: Type a task title → AI auto-generates a professional description, suggests priority, and provides a subtask checklist
- **Smart Suggestions**: Context-aware task suggestions based on your project

### 📜 Activity Feed
- Live audit timeline of every action in the workspace
- Color-coded action badges (created, updated, deleted, status changed, etc.)
- Actor avatars and relative timestamps ("2 minutes ago")
- Paginated history, auto-refreshes every 10 seconds
- Activities auto-expire after 90 days (MongoDB TTL index)

### 🔥 Team Burnout Radar
- Computes a real-time **health score (0–100)** per workspace member
- Based on: overdue tasks, high-priority open tasks, workload vs. team average
- Score bands: 🟢 Healthy | 🟡 At Risk | 🔴 Overloaded
- SVG circular progress ring per member
- **Auto-emails overloaded members** (max once per 24 hours)
- Refreshes every 30 seconds

### 🔐 Authentication
- Email/password authentication with bcrypt hashing
- Google OAuth 2.0 login
- Session-based authentication

### ✉️ Email Notifications
- Task assigned / updated / deleted
- Project created / updated / deleted
- Member joined workspace
- Member role changed
- Workspace invite via email
- Burnout alert for overloaded members

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | Passport.js (Local + Google OAuth 2.0) |
| Sessions | cookie-session |
| Email | Nodemailer (Gmail SMTP) |
| AI | Google Generative AI (Gemini 1.5 Flash) |
| Validation | Zod |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Routing | React Router v6 |
| Icons | Lucide React |
| HTTP Client | Axios |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password (for email)
- Google Cloud project (for OAuth + Gemini API)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd task_management
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=8000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=teamsync

SESSION_SECRET=your_secret_key
SESSION_EXPIRES_IN=1d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_GOOGLE_CALLBACK_URL=http://localhost:5173/google/callback

SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Team Sync <your_gmail@gmail.com>"

# Get free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
task_management/
├── backend/
│   └── src/
│       ├── config/          # App config, Passport, DB connection
│       ├── controllers/     # Route handlers (task, project, workspace, analytics, ai)
│       ├── enums/           # Role permissions enums
│       ├── middlewares/     # Auth, error handler, async wrapper
│       ├── models/          # Mongoose schemas (User, Workspace, Project, Task, Member, Role, Activity)
│       ├── routes/          # Express route definitions
│       ├── services/        # Business logic layer
│       ├── utils/           # logActivity, sendEmail, emailTemplates, roleGuard
│       └── validation/      # Zod schemas
└── client/
    └── src/
        ├── components/      # All React components
        │   └── workspace/   # workspace-specific components
        │       ├── task/    # task table, create/edit forms
        │       ├── project/ # project list, analytics
        │       ├── member/  # member list, invite
        │       ├── activity-feed.tsx
        │       └── team-burnout-radar.tsx
        ├── context/         # Auth context
        ├── hooks/           # Custom hooks (API, workspace, filters)
        ├── lib/             # axios client, api.ts, helpers
        ├── page/            # Route pages
        └── types/           # TypeScript type definitions
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/google` | Google OAuth |

### Workspace
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspace/all` | All user workspaces |
| POST | `/api/workspace/create/new` | Create workspace |
| GET | `/api/workspace/:id` | Get workspace |
| PUT | `/api/workspace/:id/update` | Update workspace |
| DELETE | `/api/workspace/:id/delete` | Delete workspace |
| POST | `/api/workspace/invite/send/:id` | Send invite email |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/project/workspace/:id/create` | Create project |
| GET | `/api/project/workspace/:id/all` | List projects |
| PUT | `/api/project/:id/workspace/:id/update` | Update project |
| DELETE | `/api/project/:id/workspace/:id/delete` | Delete project |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/task/project/:id/workspace/:id/create` | Create task |
| GET | `/api/task/workspace/:id/all` | List tasks with filters |
| PUT | `/api/task/:id/project/:id/workspace/:id/update` | Update task |
| DELETE | `/api/task/:id/workspace/:id/delete` | Delete task |

### Analytics (New)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/workspace/:id/activity` | Activity feed (paginated) |
| GET | `/api/analytics/workspace/:id/health` | Team burnout scores |

### AI (New)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/enhance-task` | AI enhance task description + priority |
| POST | `/api/ai/suggest-tasks` | AI suggest task title completions |

---

## 🔒 Permission System

| Permission | Owner | Admin | Member |
|---|:-:|:-:|:-:|
| VIEW_ONLY | ✅ | ✅ | ✅ |
| ADD_MEMBER | ✅ | ✅ | ❌ |
| CHANGE_MEMBER_ROLE | ✅ | ✅ | ❌ |
| CREATE_PROJECT | ✅ | ✅ | ❌ |
| EDIT_PROJECT | ✅ | ✅ | ❌ |
| DELETE_PROJECT | ✅ | ❌ | ❌ |
| CREATE_TASK | ✅ | ✅ | ✅ |
| EDIT_TASK | ✅ | ✅ | ❌ |
| DELETE_TASK | ✅ | ✅ | ❌ |

> **Special rule**: Task assignees can always update their own task's **status**, regardless of the `EDIT_TASK` permission.

---

## 📬 Email Notifications

All emails are sent in the background (non-blocking) using Gmail SMTP via Nodemailer.  
Every email uses a styled HTML template branded with **Team Sync**.

Footer on all emails: *Built by **Alok Kushwaha***

---

## 👨‍💻 Developer

**Alok Kushwaha**  
Full-Stack Developer  

---

