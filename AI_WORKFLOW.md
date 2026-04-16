# AI Workflow

## Tools Used

- GitHub Copilot (GPT-5.3-Codex) for iterative coding and refactoring support
- AI-assisted terminal/test loop for rapid validation and regression checks

## Where AI Helped

- Scaffolding
  - Bootstrapped backend/frontend structure, route wiring, and base project files.
- API implementation
  - Accelerated controller and route creation for documents, sharing, and upload.
- UI structure
  - Produced initial component/page flow for sidebar + editor interactions.
- Testing setup
  - Generated initial Jest + supertest integration test skeleton.
- Documentation
  - Helped draft architecture and setup narratives quickly.

## What AI Got Wrong

- Access control bug with populated references
  - Owner/shared checks initially relied on direct ObjectId toString assumptions.
  - After populate, comparisons could fail and return false 403 access denials.

- Sharing schema first pass was too shallow
  - Initial approach modeled sharedWith as plain user IDs.
  - This did not support role updates/revoke cleanly and required redesign.

- Autosave behavior risk
  - Initial autosave strategy could produce unnecessary save loops/noisy refetch patterns.
  - Required explicit last-saved tracking and tighter save conditions.

- Test reliability gap
  - Early integration test setup needed timeout/teardown hardening for in-memory Mongo startup.

## What I Changed or Rejected

- Reworked sharing model to embedded relationship objects:
  - userId + role + sharedAt
- Added explicit sharing management endpoints:
  - list shares, update role, revoke access
- Normalized ID comparison logic to handle populated and non-populated refs safely
- Added structured error utility + validation helpers for consistent API responses
- Kept REST and debounced autosave, rejected full real-time sync due to MVP scope

## How I Verified Correctness

- Automated checks
  - Ran backend Jest tests with role-based sharing and revoke scenarios.
  - Ran frontend production build to ensure compile integrity.

- Manual/API behavior checks
  - Login, create, rename, edit, and autosave flows.
  - Owner vs viewer permission enforcement.
  - Share, role change, and revoke behavior.
  - .txt upload validation and import path.

- Edge cases validated
  - Invalid IDs and malformed request bodies
  - Missing auth token and invalid token handling
  - Duplicate sharing updates and revoke-not-found behavior
  - Version conflict path (409 reload behavior)

## Reflection

Where AI was most useful:

- Speeding up boilerplate and first-pass implementations.
- Proposing refactor candidates quickly once constraints were clear.

Where AI needed strong human review:

- Authorization correctness and schema design quality.
- Concurrency behavior and autosave side effects.
- Test rigor and production realism.

Bottom line:

- AI materially improved development speed.
- Engineering judgment remained essential for correctness, security posture, and final architecture decisions.
