# TaskFlow Pro

A full-stack collaborative project management tool — built with the MERN stack. Create projects, assign tasks, track progress on a Kanban board, comment in real time, and get live notifications.

Inspired by tools like Trello and Asana.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based register/login with role-based access (Admin, Project Manager, Team Member)
- 📁 **Projects** — Create, edit, delete, filter by status/priority, manual or smart auto-complete
- ✅ **Tasks** — Personal task list, full CRUD, status & priority filters
- 🗂️ **Kanban Board** — Drag-and-drop across Backlog → Todo → In Progress → Review → Done
- 💬 **Comments** — Real-time threaded comments on tasks, with edit/delete
- 📅 **Calendar** — Monthly and weekly views with task deadlines
- 👥 **Team** — Invite members, manage roles, remove members
- 📊 **Reports & Analytics** — Task distribution, workload distribution, project progress charts
- 🔔 **Notifications** — Real-time in-app notifications via Socket.io
- ⚙️ **Settings** — Profile, appearance, notification preferences, password change
- ⚡ **Real-time updates** — Live task moves, live comments, live notification badges (Socket.io)

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS v3
- React Router
- Recharts (charts)
- Socket.io Client
- Axios
- React Hot Toast
- Lucide React (icons)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT (jsonwebtoken)
- bcryptjs
- express-validator

---

## 📂 Project Structure

```
taskflow/
├── backend/
│   ├── models/          # User, Project, Task, Comment, Notification
│   ├── routes/           # Express routes per module
│   ├── controllers/       # Business logic
│   ├── middleware/       # Auth (JWT) + error handler
│   ├── socket/           # Socket.io connection handler
│   ├── seed/              # Database seed script
│   ├── .env
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/             # Axios instance with token interceptor
    │   ├── auth/             # Login, Register
    │   ├── components/
    │   │   ├── layout/      # Sidebar, Navbar, Layout
    │   │   ├── ui/            # Reusable UI pieces
    │   │   └── modals/       # Create/Edit modals
    │   ├── context/          # AuthContext, SocketContext
    │   ├── pages/            # Dashboard, Projects, Kanban, etc.
    │   ├── App.jsx
    │   └── main.jsx
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally, or a MongoDB Atlas connection string)
- npm

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd taskflow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## 🔑 Demo Login

After seeding, log in with:

```
Email:    kautilp7@gmail.com
Password: 123456
```

---

## 📡 API Overview

| Module | Base Route | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, get current user, update profile/password |
| Projects | `/api/projects` | CRUD + dashboard stats + mark complete |
| Tasks | `/api/tasks` | CRUD + Kanban board fetch + move (drag-and-drop) |
| Comments | `/api/comments` | CRUD on task comments |
| Team | `/api/team` | List, invite, change role, remove member |
| Notifications | `/api/notifications` | List, mark as read, mark all read, delete |

All routes except `/auth/register` and `/auth/login` require a `Bearer` JWT token in the `Authorization` header.

---

## ⚡ Real-Time Events (Socket.io)

| Event | Trigger | Who receives it |
|---|---|---|
| `newComment` | A comment is posted on a task | Everyone viewing that task |
| `newNotification` | Task assigned, comment added, project completed, etc. | The specific recipient's room |
| `taskMoved` | A task changes status (drag-and-drop) | Everyone on that project's Kanban board |
| `taskCreated` | A new task is created | Everyone on that project's Kanban board |
| `projectUpdated` | A project is auto-completed | All clients |

---

## 🧩 Key Feature — Project Completion

- **Manual complete** — Project owner can mark a project as `Completed` from the project card menu. All pending tasks are auto-moved to `Done`.
- **Smart auto-complete** — When the last task in a project is marked `Done` (via Kanban drag or My Tasks toggle), the backend automatically marks the project as `Completed` and notifies all members.

---

## 🗒️ Notes

- This project uses **Tailwind CSS v3** (not v4) for stability with the current Vite + React setup.
- Passwords must be **6+ characters** — this is enforced both on the frontend and in the Mongoose schema.
- Make sure `.env` is never committed — see `.gitignore`.

---

## 📄 License

This project is for personal/educational use.
