# Lumina Frontend

Frontend application for **Lumina – AI Assistant for Enterprise Knowledge**. It is a React/Vite workspace for public customer chat, staff knowledge retrieval, compliance operations, and system administration.

## Product experience

All chat routes and workspaces require an authenticated account. Unauthenticated visitors can only access the login and registration screens.

The application provides:

- Staff Chat for internal retrieval and document search, clauses, versions, timelines, and relations.
- Compliance Officer workspace for document upload, metadata, lifecycle, relations, re-indexing, and processing history.
- System Admin workspace for users, lock/unlock, password reset, role permissions, and audit logs.
- Shared account, logout, error, permission, empty, loading, offline, and retry states.


## Display roles and stable codes

The UI uses the following product-facing names:

| Display name | Stable API/database code | Workspace |
| --- | --- | --- |
| Customer | `ROLE_CUSTOMER` | `/customer` |
| Staff | `ROLE_STAFF` | `/bank-employee` |
| Compliance Officer | `ROLE_COMPLIANCE` | `/knowledge-manager` |
| System Admin | `ROLE_ADMIN` | `/admin` |

Role codes remain unchanged so existing JWTs, backend permissions, routes, and database rows remain compatible. Only display labels are renamed.

## Technology

- React 19 and TypeScript
- Vite 8
- React Router
- Tailwind CSS v4
- Lucide icons
- Browser storage for session preference and UI settings
- REST API integration through `src/services/api.ts`

## Project layout

```text
src/
├── App.tsx                  # Routes, workspace guards, public home redirect
├── auth/                    # Auth context and role/permission guards
├── components/shared.tsx    # Cards, forms, tables, drawers, states, toast, dialogs
├── domain.ts                # Product domain types, roles, labels, permissions
├── layouts/AppLayout.tsx    # Lumina shell, sidebar, header, account menu
├── pages/                   # Guest, auth, customer, staff, compliance, admin pages
├── services/api.ts          # Backend API client and response mapping
└── utils/                   # Safe IDs and browser utilities
```

## Local development

From `solution/frontend`:

```bash
npm install
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/macOS
npm run dev
```

The Vite development server runs on port `8443` by default. The local API fallback is:

```text
http://localhost:8000/api/v1
```

Set `VITE_API_URL` when using a deployed backend:

```env
VITE_API_URL=https://vaic2026.onrender.com/api/v1
```

## NPM commands

```bash
npm run dev        # Start Vite development server
npm run typecheck  # TypeScript validation
npm run build      # Production build
npm run preview    # Serve the production build locally
npm run format     # Format source files with oxfmt
```

## Routing

Public routes:

- `/`: redirects to the authenticated workspace or `/login`.
- `/login`: account login.
- `/register`: Customer registration; email is optional and role selection is not shown.

Protected workspaces:

- `/customer/chat`, `/customer/history`, `/customer/account`
- `/bank-employee/chat`, `/bank-employee/documents`, `/bank-employee/clauses`, `/bank-employee/compare`, `/bank-employee/timeline`, `/bank-employee/relations`, `/bank-employee/history`, `/bank-employee/account`
- `/knowledge-manager/dashboard`, `/knowledge-manager/documents`, `/knowledge-manager/upload`, `/knowledge-manager/metadata`, `/knowledge-manager/effectiveness`, `/knowledge-manager/relations`, `/knowledge-manager/reindex`, `/knowledge-manager/history`, `/knowledge-manager/account`
- `/admin/dashboard`, `/admin/users`, `/admin/roles`, `/admin/logs`, `/admin/account`

Direct access is guarded by role and permission. Legacy `/employee/*` routes redirect to the separated Staff or Compliance Officer workspace.

## API integration

`src/services/api.ts` is the only API boundary used by pages. It:

- Adds the account bearer token to protected requests.
- Keeps guest requests separate and sends only public scope.
- Maps snake_case backend responses to frontend domain objects.
- Supports login, registration, profile, password change, logout, conversations, documents, sources, graphs, workflows, admin users, and audit logs.
- Emits a global API-error event so mutation failures are visible instead of appearing as empty data.

The frontend never stores parsed document text, source content, embeddings, or graph payloads in the Backend. Source and graph details are retrieved by ID from the backend/AI boundary.

## Public API client

Public chat endpoints may remain available in the API client for controlled integrations, but there is no Guest Chat page or Guest Chat route in the Frontend.

## UI state conventions

Data-backed screens distinguish:

- Loading: spinner while the API request is pending.
- Error: API failure with a retry action; it is never presented as an empty list.
- Empty: API succeeded and returned no records.
- Denied/offline: explicit permission or connectivity messaging.

Reviewers can open `?state=loading`, `?state=empty`, `?state=error`, `?state=denied`, or `?state=offline` on supported screens.

## Production deployment

Build the application with the production API URL:

```bash
VITE_API_URL=https://vaic2026.onrender.com/api/v1 npm run build
```

Deploy the generated `dist` directory to the selected static hosting provider. Configure SPA fallback to `index.html` so direct workspace URLs continue to work after refresh.

For local development, keep `VITE_API_URL` pointed to `http://localhost:8000/api/v1`. Do not commit `.env`, access tokens, refresh tokens, or private service credentials.

## Verification checklist

```bash
npm run typecheck
npm run build
```

Before release, verify guest public scope, login/logout, role redirects, cross-role denial, loading/error/empty states, password change, document workflows, source/chunk detail, graph access, admin lock/reset, and browser history restoration.
