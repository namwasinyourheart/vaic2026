# Lumina Frontend

React frontend for **Lumina – AI Assistant for Enterprise Knowledge**, an AI-assisted enterprise document search and governance platform for Customers, Bank Employees, Knowledge Managers, and System Administrators.

The application includes a public Guest Chat, role-specific workspaces, source inspection, retrieval graphs, document management, user administration, and audit views.

## Technology stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Lucide React icons
- Native Fetch API for Backend communication

## Main features

### Guest

- Opens the public chat directly at `/` without authentication.
- Can submit real public-scope questions through the Backend.
- Stores Guest conversations only in browser `localStorage` under `shb-rag-guest-chat-v1`.
- Can inspect public sources and retrieval graphs with a short-lived Guest token.
- Can rename, delete, or clear local Guest conversations.
- Can navigate to Login or Customer Registration from the public header.

### Customer

- Public-scope authenticated chat.
- Persistent account conversation history.
- Source and retrieval-graph inspection.
- Account profile and password management.

### Bank Employee

- Internal-scope chat.
- Document search and detail views.
- Clause search, version comparison, timeline, and related-document views.
- Account conversation history.

### Knowledge Manager

- Dashboard and document inventory.
- PDF/DOCX/image upload and metadata editing.
- Document lifecycle and expiry management.
- Relation, conflict, clause, chunk, and graph inspection through Backend APIs.
- Single and bulk re-index workflows.

### System Administrator

- User creation and editing.
- One role per user.
- Account lock/unlock management.
- Role-permission matrix.
- Audit-log inspection.

## Project structure

```text
solution/frontend/
├── src/
│   ├── auth/             # Auth context and route guards
│   ├── components/       # Shared UI components
│   ├── layouts/          # Role-aware application shell
│   ├── pages/
│   │   ├── admin/
│   │   ├── bank/
│   │   ├── customer/
│   │   └── knowledge/
│   ├── services/
│   │   ├── api.ts        # Backend API client
│   │   └── mock.ts       # UI/demo compatibility data
│   ├── App.tsx           # Route configuration
│   ├── domain.ts         # Frontend domain types
│   ├── index.css         # Global styles and design tokens
│   └── main.tsx          # React entry point
├── .env.example
├── package.json
├── vite.config.ts
└── vercel.json
```

## Local setup

Requirements:

- Node.js 22 or another version supported by the current Vite release
- Backend running at `http://localhost:8000`

```powershell
cd solution/frontend
npm install
npm run dev -- --host 0.0.0.0 --port 8443
```

Open `http://localhost:8443`.

When the browser hostname is `localhost` or `127.0.0.1`, the application calls:

```text
http://localhost:8000/api/v1
```

To use another Backend, create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Production API configuration

The API client resolves its base URL in this order:

1. `VITE_API_URL` supplied at build time;
2. `http://localhost:8000/api/v1` on localhost;
3. `https://vaic2026.onrender.com/api/v1` as the production fallback.

For an explicit production build:

```env
VITE_API_URL=https://vaic2026.onrender.com/api/v1
```

Because Vite variables are embedded at build time, changing `VITE_API_URL` requires rebuilding and redeploying the frontend.

## Routes

### Public routes

| Route | Purpose |
|---|---|
| `/` | Guest Chat when logged out; role workspace redirect when logged in |
| `/guest-chat` | Guest Public Chat |
| `/login` | Account login |
| `/register` | Customer registration |
| `/403` | Permission denied |

### Customer

```text
/customer/chat
/customer/history
/customer/account
```

### Bank Employee

```text
/bank-employee/chat
/bank-employee/documents
/bank-employee/documents/:id
/bank-employee/clauses
/bank-employee/compare
/bank-employee/timeline
/bank-employee/relations
/bank-employee/history
/bank-employee/account
```

### Knowledge Manager

```text
/knowledge-manager/dashboard
/knowledge-manager/documents
/knowledge-manager/upload
/knowledge-manager/metadata
/knowledge-manager/effectiveness
/knowledge-manager/relations
/knowledge-manager/reindex
/knowledge-manager/history
/knowledge-manager/account
```

### System Administrator

```text
/admin/dashboard
/admin/users
/admin/roles
/admin/logs
/admin/account
```

Legacy `/employee/*` routes redirect to the appropriate Bank Employee or Knowledge Manager workspace.

## Authentication

Login sends the raw password over HTTPS to the Backend; password hashing is a Backend responsibility. The Frontend never sends `password_md5`.

Depending on **Remember me**, access and refresh tokens are stored in either:

- `localStorage`, for a remembered login; or
- `sessionStorage`, for the current browser tab/session.

Guest history is stored separately and is not removed during account login or logout. Guest history is never migrated into an authenticated account conversation.

Frontend guards improve navigation and user experience, but Backend permissions remain authoritative.

## Customer registration

The registration form requires:

- username;
- full name;
- password;
- password confirmation.

Email is optional. The form does not allow role selection; the Backend always assigns the `customer` role.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production bundle in `dist` |
| `npm run preview` | Preview the production bundle locally |
| `npm run typecheck` | Run TypeScript checks without emitting files |
| `npm run format` | Format supported files with Oxfmt |

Recommended verification:

```powershell
npm run typecheck
npm run build
```

## Demo accounts

After the Backend seed has run, the following accounts use the password `password`:

| Username | Workspace |
|---|---|
| `customer` | Customer |
| `employee` | Bank Employee |
| `knowledge` | Knowledge Manager |
| `admin` | System Administrator |

Demo credentials must not be used for real users.

## Production deployment

The frontend can be deployed as a Render Static Site:

```text
Root Directory: solution/frontend
Build Command: npm ci && npm run build
Publish Directory: dist
Environment: VITE_API_URL=https://vaic2026.onrender.com/api/v1
Rewrite: /* -> /index.html
```

After obtaining the frontend domain, add its exact origin to the Backend `FRONTEND_ORIGINS` environment variable.

Deployment details are available in [`../../docs/DEPLOY_RENDER.md`](../../docs/DEPLOY_RENDER.md). API contracts are documented in [`../../docs/API_FE_BE.md`](../../docs/API_FE_BE.md).

## Security notes

- Do not commit `.env` files or tokens.
- Never store account passwords in browser storage.
- Do not render AI content with `dangerouslySetInnerHTML`.
- Do not treat hidden buttons or Frontend route guards as authorization.
- Always access protected source chunks, graphs, and files through the Backend.
