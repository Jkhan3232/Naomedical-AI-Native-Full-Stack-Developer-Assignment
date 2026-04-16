# Architecture

## Overview

This project is a collaborative document editor MVP designed for fast creation, editing, and sharing of rich-text documents. It supports core document workflows: create, rename, edit with rich text, autosave, share with role-based access, and import from .txt files.

The system is split into a React frontend and an Express API backed by MongoDB. The frontend manages user session state and editor interactions, while the backend enforces authorization, validation, persistence, and sharing rules.

## High-Level Architecture

- Frontend (React + Vite)
  - Authentication bootstrap (email-based login)
  - Document list and editor state management
  - Debounced autosave and sharing UI interactions
- Backend (Node.js + Express)
  - REST API for auth, document CRUD, sharing, and file upload
  - JWT verification middleware
  - Validation and structured error handling
- Database (MongoDB + Mongoose)
  - User and Document persistence
  - Embedded sharing relationship records inside Document

Request flow:

- User action in UI triggers HTTP request via Axios client.
- Express routes authenticate JWT and run controller logic.
- Controller validates input, applies access rules, reads/writes MongoDB.
- API returns JSON payload or structured error.
- Frontend updates local state and renders feedback.

## Key Design Decisions

- Why MongoDB
  - Document content is naturally JSON-friendly and evolves quickly in MVP scope.
  - Sharing records can be embedded in each document for straightforward access checks.
  - Mongoose schemas provide enough guardrails without heavy migration overhead.

- Why React Quill
  - Fast rich-text integration for MVP delivery.
  - Produces HTML payloads compatible with simple persistence and rendering.
  - Avoids building custom editor primitives under time constraints.

- Why JWT without password
  - Reduces authentication surface for short-scope assessment.
  - Keeps onboarding friction low for demonstration and testing.
  - Tradeoff accepted: this is mock/simple auth, not production identity security.

- Why REST over WebSockets
  - REST is simpler to implement, test, and reason about in a 4-6 hour MVP.
  - Fits request/response operations (create, list, update, share, upload).
  - Tradeoff accepted: no true multi-user live editing.

- Why debounce autosave instead of real-time sync
  - Debounce limits API write frequency and keeps UX responsive.
  - Combined with version checks, it provides basic conflict signaling.
  - Tradeoff accepted: edits are not merged across concurrent clients.

## Data Model

- User
  - email: unique identifier for login/share lookup
  - name: display identity
  - timestamps

- Document
  - title: constrained non-empty string
  - content: HTML string from editor/import
  - ownerId: reference to User (single owner)
  - sharedWith[]:
    - userId: reference to User
    - role: viewer or editor
    - sharedAt
  - timestamps
  - optimisticConcurrency enabled (version field used for conflict checks)

Relationships:

- One user owns many documents.
- Many users can be shared on one document.
- Sharing role determines write permissions for non-owner users.

## Tradeoffs

Intentionally not built in MVP:

- Real-time operational transform/CRDT collaboration
- Password-based auth, refresh tokens, and invitation lifecycle
- Fine-grained audit logs and activity history
- Full role hierarchy and team/workspace management
- Advanced file import formats (.docx, markdown)

Why:

- Time-boxed assessment scope prioritized reliable core flows over platform breadth.
- Focus was on clean API boundaries, permission correctness, and persistence stability.

## Scalability Considerations

Potential bottlenecks at scale:

- Frequent autosave writes can increase write load on hot documents.
- Single-document conflict handling is coarse (reject/reload, no merge).
- Token strategy is minimal (no revocation/session tracking).
- Embedded sharing list may grow large for highly shared docs.

Next steps for scale:

- Add Redis for rate limiting, caching document metadata, and queue coordination.
- Move to WebSocket collaboration and CRDT/OT for multi-user merge behavior.
- Add background jobs for heavy processing and analytics/audit trails.
- Introduce stronger auth model (password/OAuth, refresh tokens, revocation).
- Add pagination, partial projections, and denormalized read models where needed.
