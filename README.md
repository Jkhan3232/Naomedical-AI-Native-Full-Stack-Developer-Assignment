# Collaborative Document Editor MVP

## Overview

A production-minded MVP of a Google Docs-style editor built for a time-boxed assessment. It supports rich text authoring, autosave, role-based sharing, and file import, with a React frontend and Express/MongoDB backend.

## Features

- Email-based JWT login (no password)
- Create, rename, fetch, and edit documents
- Rich text editing with React Quill
- Debounced autosave with version conflict detection
- Role-based sharing: owner, editor, viewer
- Share management: add collaborator, change role, revoke access
- Personal and shared document lists
- .txt upload to document conversion
- Validation and structured API error responses
- Backend integration tests (Jest + supertest)

## Demo

- Live URL: TODO
- Video walkthrough: TODO

## Submission Artifacts

- Submission manifest: `SUBMISSION.md`
- Walkthrough link file: `WALKTHROUGH_URL.txt`
- Screenshot folder: `demo/screenshots/`

## Tech Stack

- Frontend: React, Vite, Axios, React Router, React Quill
- Backend: Node.js, Express, Mongoose, JWT, Multer
- Database: MongoDB
- Testing: Jest, supertest, mongodb-memory-server

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)

### 1) Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3) Run tests

```bash
cd backend
npm test
```

## API Overview

Auth:

- POST /api/auth/login

Documents:

- POST /api/documents
- GET /api/documents/my
- GET /api/documents/shared
- GET /api/documents/:id
- PUT /api/documents/:id
- POST /api/documents/upload

Sharing:

- POST /api/documents/:id/share
- GET /api/documents/:id/shares
- PATCH /api/documents/:id/shares/:userId
- DELETE /api/documents/:id/shares/:userId

## Architecture Summary

- Frontend handles session state, editor UX, and API orchestration.
- Backend enforces auth, validation, authorization, and persistence.
- MongoDB stores users and documents with embedded sharing records.
- Detailed design notes: see ARCHITECTURE.md.

## AI Usage Summary

- AI accelerated scaffolding, route/controller boilerplate, and initial UI flow.
- Final implementation required manual design corrections, access-control fixes, and validation hardening.
- Full breakdown: see AI_WORKFLOW.md.

## Tradeoffs

- No real-time co-editing (WebSockets/CRDT not implemented)
- No password/OAuth auth flow (email-based JWT only)
- .txt upload only
- Minimal collaboration UX to keep scope focused

## Future Improvements

- Real-time collaboration with WebSockets + CRDT/OT
- Production auth (password/OAuth, refresh tokens, revocation)
- Invitation lifecycle and email-based invite acceptance
- Richer observability (audit logs, metrics, tracing)
- Pagination/search and stronger test coverage (unit + e2e)

## Submission Status

### Working

- End-to-end document create, edit, rename, autosave, reopen
- File import (`.txt`)
- Sharing (owner/editor/viewer), role update, revoke
- MongoDB persistence + backend tests

### Incomplete

- Live deployed URL not added yet
- Walkthrough video URL not added yet
- Demo screenshots/GIF not added yet

### Next 2-4 Hours

- Deploy frontend + backend and add public URL
- Record walkthrough and update `WALKTHROUGH_URL.txt`
- Capture screenshots/GIF and add to `demo/screenshots/`

## How to Add Screenshots / GIF

1. Save images in `demo/screenshots/`.
2. Use consistent names (example):
	- `01-login.png`
	- `02-editor.png`
	- `03-sharing.png`
	- `04-shared-list.png`
3. Add them in README using Markdown:

```md
## Screenshots

![Login](demo/screenshots/01-login.png)
![Editor](demo/screenshots/02-editor.png)
![Sharing](demo/screenshots/03-sharing.png)
![Shared Documents](demo/screenshots/04-shared-list.png)
```

4. Optional: add one GIF:

```md
## Demo GIF

![Demo Flow](demo/screenshots/demo-flow.gif)
```

## Credentials

- No default credentials are pre-seeded.
- Login creates a user for any valid email on first use.
