# trace

trace is a Next.js application built with React, Tailwind CSS, Clerk authentication, and Drizzle ORM.

## Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer
- A Clerk application (for authentication)
- A Neon/Postgres database (for persisted data)

## Build and run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` with your Clerk keys and `DATABASE_URL`.

4. Generate and apply database migrations:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. Start the development server:

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Production build

```bash
pnpm build
pnpm start
```

## Available commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the development server. |
| `pnpm build` | Create an optimized production build. |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint. |
| `pnpm db:generate` | Generate Drizzle migration files. |
| `pnpm db:migrate` | Apply database migrations. |
| `pnpm db:studio` | Open Drizzle Studio. |

## AI tooling used

- Codex was used to assist with implementation tasks such as refactors, schema updates, file scaffolding, and iterative code edits in this repository.
- GPT-5.6 was used to draft and refine product language, guardrails, and roadmap documentation for the assignment authenticity analysis workflow.
- All AI-assisted output was reviewed and adjusted by a human before being treated as final project behavior or policy guidance. 

## Assignment authenticity analysis roadmap

### Product goal

trace should help an instructor review how an assignment document was produced. It should summarize editing patterns, paste activity, and citation-like material, then produce an **evidence-backed, uncertain assessment** after submission. It must not claim to prove authorship or make an automatic grading or disciplinary decision.

The design should collect only signals generated inside the trace editor. Do not record browser-wide keystrokes, clipboard contents outside an explicit paste, passwords, unrelated tabs, or hidden background activity.

### Guardrails and product decisions

- [ ] Get approval for a student-facing disclosure that explains what is collected, why, who can see it, and how long it is retained.
- [ ] Require the student to acknowledge the disclosure before telemetry starts; provide an accessible policy page.
- [ ] Make the activity timeline visible to the student before submission, including the paste events attributed to their document.
- [ ] Treat the output as a review aid, never as a pass/fail, grade, misconduct finding, or automated penalty.
- [ ] Include uncertainty, alternative explanations, and the underlying evidence in every instructor-facing assessment.
- [ ] Define retention, deletion, export, and role-based-access policies before storing event data.
- [ ] Approve the OpenAI API data-handling configuration before sending any student content or telemetry to a model.
- [ ] Keep raw pasted text out of telemetry by default. Store event metadata and, where necessary, a short redacted excerpt or cryptographic hash with a documented retention limit.
- [ ] Test the experience with assistive technology, dictation, IME composition, and students who draft offline so those workflows are not treated as suspicious.

### Signals to collect

| Signal | Useful metadata | Do not collect | Interpretation limit |
| --- | --- | --- | --- |
| Editing sessions | start/end time, active editing duration, document ID | global keyboard activity | Time spent is context, not proof of authorship. |
| Document changes | inserted/deleted character counts, block count delta, change source | individual key values or full revision text per keystroke | Large edits can be legitimate revisions. |
| Paste events | timestamp, inserted character count, MIME types, source format, destination range size | full clipboard by default | A large paste may be a permitted draft, quote, accessibility tool, or citation. |
| Citation hints | URLs, DOI patterns, quoted/reference section markers, matching pasted range ID | browsing history or externally visited pages | Heuristics cannot verify source quality or authorship. |
| Submission state | submission timestamp, assignment due date, document version hash | unrelated document history | Supports a review timeline only. |

### Proposed tools and services

| Need | Recommended tool | Why |
| --- | --- | --- |
| Editor instrumentation | [BlockNote events](https://www.blocknotejs.org/docs/reference/editor/events) and [paste handler](https://www.blocknotejs.org/docs/reference/editor/paste-handling) | Provides change-source and paste hooks inside the existing editor. |
| Client event buffer | A small React telemetry hook plus `navigator.sendBeacon` / `fetch(..., { keepalive: true })` | Batch low-volume, privacy-filtered events instead of sending one request per edit. |
| Ingestion API | Next.js Route Handler with Clerk authentication and Yup validation | Authenticate, validate, rate-limit, and persist batches without exposing raw telemetry. |
| Persistence | Drizzle + Neon/Postgres tables, indexes, and migrations | Keeps event records relationally linked to assignment submissions and supports retention jobs. |
| Analysis orchestration | A queued worker; [Vercel Workflow](https://vercel.com/kb/vercel-workflow) is a good option for durable, retried runs | Runs analysis after submission without delaying the student-facing submission flow. |
| AI synthesis | [OpenAI Responses API](https://platform.openai.com/docs/guides/responses) with [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) | Returns a schema-constrained assessment object instead of free-form model prose. |
| Instructor review | Server-rendered report page plus immutable evidence references | Makes the conclusion inspectable and prevents a score-only workflow. |
| Observability | Structured logs, audit records, and privacy-safe metrics | Lets the team diagnose false positives, access, failures, and retention jobs. |

### Data model checklist

- [ ] Add an `assignment_activity_sessions` table:
  - [ ] `id`, `document_id`, `assignment_submission_id`, `clerk_user_id`
  - [ ] `started_at`, `ended_at`, `active_duration_ms`, `created_at`
- [ ] Add an `assignment_activity_events` table:
  - [ ] `id`, `session_id`, `document_id`, `event_type`, `occurred_at`
  - [ ] Aggregate fields such as `inserted_characters`, `deleted_characters`, `pasted_characters`, `mime_types`, and `change_source`
  - [ ] Optional redacted/hash fields only if approved by the privacy policy
  - [ ] Index by `document_id`, `assignment_submission_id`, and `occurred_at`
- [ ] Add an `assignment_analysis_reports` table:
  - [ ] `id`, `assignment_submission_id`, `document_version_hash`, `status`, `model`, `prompt_version`
  - [ ] Structured `report` JSON, `created_at`, `reviewed_at`, and reviewer identity fields
  - [ ] A uniqueness rule for the submission/version/report type to make reruns explicit
- [ ] Add Drizzle relations from submission → sessions/events/reports and generate migrations with `pnpm db:generate`.
- [ ] Define a scheduled retention job that deletes or aggregates expired telemetry and reports.

### Delivery checklist

#### Phase 0 — policy, UX, and success criteria

- [ ] Write the disclosure, consent copy, retention schedule, and instructor-use policy.
- [ ] Define allowed use cases such as quotations, citations, templates, code snippets, accessibility tools, and offline drafting.
- [ ] Define false-positive scenarios and a human-review escalation process.
- [ ] Agree on measurable success criteria: telemetry delivery rate, report latency, reviewer agreement, and appeal rate.
- [ ] Create test fixtures for normal drafting, research-heavy work, permitted bulk paste, and genuinely unusual editing patterns.

#### Phase 1 — instrument only the editor

- [ ] Create a client-side `useAssignmentActivityTracker` hook used only for documents linked to an assignment.
- [ ] Start an activity session when the editor receives focus; pause/close it on blur, visibility change, unmount, and submission.
- [ ] Use BlockNote change callbacks to derive aggregate insert/delete counts and the local/paste/drop/undo change source.
- [ ] Use the BlockNote paste handler to measure pasted character count, available MIME types, and a local event ID before delegating to the default paste behavior.
- [ ] Detect composition events and pause character-level aggregation while an IME is active.
- [ ] Add a visible “Activity tracking on” indicator and a student-accessible event summary.
- [ ] Confirm that no telemetry code runs for ordinary, non-assignment documents.

#### Phase 2 — safely ingest and store batches

- [ ] Define Yup schemas for each event and batch payload in `src/formSchemas/`.
- [ ] Add an authenticated Route Handler that derives the user ID from Clerk rather than trusting the client payload.
- [ ] Verify that the caller owns the document and is an active member of the linked assignment.
- [ ] Enforce event count, payload size, timestamp-range, and rate limits.
- [ ] Buffer events in memory and flush on a short interval, focus loss, page hide, and before submission.
- [ ] Use `sendBeacon` where supported, with an authenticated `fetch` fallback.
- [ ] Persist batches idempotently with client-generated event IDs to tolerate retries.
- [ ] Add database migrations, indexes, and a minimal admin-only inspection query.

#### Phase 3 — deterministic analysis before AI

- [ ] Build a server-side summarizer that turns raw events into aggregate facts: active time, edit bursts, paste counts, paste-to-document ratio, and revision timeline.
- [ ] Capture a document version hash and final character count at submission time.
- [ ] Add citation heuristics for URLs, DOI patterns, quote markers, and a references section; label them as hints, not verified citations.
- [ ] Link each paste event to its approximate final-document range only when the mapping is reliable; otherwise report it as an unlocated paste.
- [ ] Create plain-language explanations for every metric and a “cannot determine” state for insufficient telemetry.
- [ ] Unit-test the summarizer against the Phase 0 fixtures before introducing an LLM.

#### Phase 4 — analysis run at submission

- [ ] In the submission action, persist the final document hash and enqueue an analysis job after the submission is locked.
- [ ] Keep the student submission fast: return immediately after the job is enqueued rather than waiting for AI analysis.
- [ ] Make the worker idempotent by using the submission ID and version hash as its idempotency key.
- [ ] Persist lifecycle states: `queued`, `collecting`, `analyzing`, `complete`, `failed`, and `needs_review`.
- [ ] Add retries, failure visibility, and a manual rerun path with an audit log.

#### Phase 5 — AI synthesis with strict output

- [ ] Integrate the server-side OpenAI API client; store `OPENAI_API_KEY` only in server environment variables and never expose it to the browser.
- [ ] Use the Responses API with Structured Outputs and a versioned JSON Schema for the assessment, rather than parsing free-form text.
- [ ] Define the structured result before prompting: `summary`, `evidence`, `benign_explanations`, `uncertainty`, `review_recommendation`, `policy_notes`, and a schema/version identifier.
- [ ] Select a model that supports Structured Outputs, pin a model snapshot for reproducible evaluations, and record the model ID in each report.
- [ ] Validate the model result again on the server before persistence; mark an analysis `failed` or `needs_review` when it is incomplete or unsupported by evidence.
- [ ] Give the model only the final document, assignment instructions, approved telemetry summary, and citation hints needed for the analysis.
- [ ] Instruct the model never to infer protected traits, never to claim authorship certainty, and never to make a disciplinary or grading decision.
- [ ] Require evidence references for every claim; reject responses that contain claims without a linked metric or excerpt.
- [ ] Store model, prompt version, input version hash, token/cost metadata, and the exact validated output.
- [ ] Evaluate the report against a held-out fixture set and require human approval before enabling it for instructors.

#### Phase 6 — instructor review and student transparency

- [ ] Add an instructor submission list that shows analysis status, never a single “legit/not legit” score.
- [ ] Build a report view with the final document, submission time, aggregate timeline, paste/citation context, AI summary, uncertainty, and evidence links.
- [ ] Add reviewer actions: `reviewed`, `request clarification`, `dismiss concern`, and `rerun analysis`, all with audit entries.
- [ ] Let students see the same activity summary and the disclosure, and provide a clear correction/appeal path.
- [ ] Implement role checks so students can access only their own reports and instructors only submissions for their assignments.

#### Phase 7 — quality, privacy, and rollout

- [ ] Add unit tests for event classification, citation heuristics, authorization, retention, and status transitions.
- [ ] Add integration tests for draft → paste → submit → locked document → queued report.
- [ ] Add accessibility and browser coverage for keyboard input, IME, mobile, paste formats, offline/reconnect, and screen readers.
- [ ] Add observability for ingestion failures, dropped events, analysis latency, model failures, and reviewer overrides.
- [ ] Pilot with opt-in classes, compare reports against instructor judgment, and document false-positive/false-negative findings.
- [ ] Roll out behind a feature flag, with a kill switch that stops analysis while preserving normal document editing and submission.
