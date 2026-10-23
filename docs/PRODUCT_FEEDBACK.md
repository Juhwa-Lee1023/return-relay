# Product Feedback

Recorded from building Return Relay on October 23, 2026. Exact package versions are pinned in `package-lock.json`. This log separates problems in our code, tool permissions, and proposed improvements. The gated Alexa+ Category SDK, Toolkit, CLI and official Web Simulator were not used.

## MCP TypeScript SDK 1.32.1 — runtime

**Use.** The official server and client implement all nine tools over Streamable HTTP. The client performs initialization and tool discovery before the UI requests a tool action.

**Onboarding and what worked.** Installing the published package, defining Zod schemas and enabling stateless JSON responses produced an interoperable HTTP flow. The integration test connects the official client and lists all nine tools. The UI uses the same client path, rather than a separate mock dispatcher.

**What needed work.** Our HTTP wrapper initially collapsed an expired session into a generic 503. This was our error handling, not an SDK defect. Forwarding the domain error with a sanitized request trace made the actual failure visible. We also had to design approval, state revisions and idempotency outside the protocol: tool authentication does not supply those product rules.

**Suggestion.** A small end-to-end example of a read-only preview followed by a session-bound, exact-arguments approval would be useful for transactional household apps. Priority: Important. This is a sample request, not a claim that the protocol lacks authorization support.

**Use again?** Yes, for a tool service with a separate trusted UI host. Evidence: `src/server/mcp.ts`, HTTP tests C03/C27/C28, and `docs/verification/`.

A later protocol review found that we had described every tool as additive-only. Planning and progress tools replace saved fields, so their `destructiveHint` is now true. The HTTP test checks the published annotations. These remain descriptive hints; approval is enforced separately by the service. [MCP ToolAnnotations, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/schema#toolannotations), checked October 23, 2026.

## Node.js 24, Express 5.3.0 and SQLite — runtime

**Use.** HTTP routes, cookie sessions, request validation, persistent local household state, and compare-and-swap writes.

**Onboarding and what worked.** Node's built-in SQLite kept the local judging path independent of cloud accounts. The same application serves both the frontend and MCP endpoint. A repeated confirmed action returns its original result.

**What needed work.** SQLite emits an experimental API warning in the tested Node release. The README therefore pins Node 24. Local disk is deliberately not used as hosted Vercel persistence. No Express or SQLite defect was identified in this build.

**Use again?** Yes, for this small reproducible local application. Serverless hosting still needs an external durable store. Evidence: `src/server/store.ts`, domain concurrency test and HTTP persistence test.

## Zod 4.6.7 and Luxon 3.7.2 — runtime

**Use.** Strict tool input schemas and explicit time-zone-aware planning.

**What worked.** Invalid step names and offset-free timestamps are rejected. Los Angeles labels are derived from exact instants. Opening time, completion time and return travel are checked separately.

**What needed work.** The original Friday conversation handler updated a Thursday UI value even though the generated plan was correct. We changed the UI to read the returned departure. This was a state-copy mistake in our application. We did not observe a Zod or Luxon defect.

**Use again?** Yes. These libraries kept parsing and validation explicit without requiring a language model to decide whether a time fits. Evidence: planner tests C08/C10 and HTTP C29.

## React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 and tsx 4.23.15 — application development

**Use.** Responsive UI, native confirmation dialog, production build, type checking and local server execution.

**What worked.** The production frontend is a small static build. The same TypeScript domain model is used by the server and UI types. No build warning is treated as a successful runtime check.

**What needed work.** Disabling the confirmation trigger before opening the dialog meant we captured the wrong focused element. Keyboard testing caught it. We now capture focus before the request, then restore it when the dialog closes. During hot reload, we also explicitly dispose of the React root to avoid a duplicate-root warning.

**Use again?** Yes. Evidence: `src/client/main.tsx`, build logs and browser cycle 2.

## Playwright and axe-core — verification

**Use.** Real Chromium UI actions, screenshots, keyboard tests, four viewport widths, and automated WCAG A/AA checks. Versions are pinned in the lockfile.

**What worked.** A single browser flow exercised approval, replanning, packing, handoff, receipt and refresh against real HTTP endpoints. The initial suite found the focus-restoration failure; the repaired suite passed. An isolated server and fresh database make repeated runs independent of the demonstration household. Follow-up tests deliberately lost a successful write response and changed the role from a second tab. They found two recovery problems in our UI, both repaired; the expanded suite passed all 14 cases.

**What needed work.** Full-page screenshots of an open native dialog include the whole document while its backdrop follows the viewport. These are useful evidence but not the best presentation images. Automatic accessibility checks also do not replace screen-reader or manual usability testing.

**Use again?** Yes, for workflow regressions. Evidence: `tests/browser/flow.spec.ts` and `docs/verification/browser-cycle2.json`.

## Upstash Redis SDK 1.39.0 and Vercel — hosted path

**Use.** A Redis adapter with atomic revision checks, seven-day session expiry and rate limits; a Vercel build of the web application and HTTP function.

**Onboarding and what worked.** The first deployment built successfully. The adapter type-checks. The dashboard allowed the project environment settings to be entered.

**What needed work.** The connected Vercel tool returned 403 for integration discovery and environment writes. The dashboard provided the environment-setting path. The available storage-creation screen showed paid plans; we did not purchase one. Connecting an existing approved free store remains a separate access decision. A build marked READY does not prove Redis-backed runtime behavior. A TypeScript error in our first Redis `eval` generic was fixed by reading the installed SDK types.

**Use again?** Vercel: yes, subject to verified configuration. Upstash: a decision about reliability needs hosted tests; local success is not enough. This section will be updated after those tests. Evidence: `src/server/store.ts` and the deployment record.

## Figma, Lucide and self-hosted fonts — design

**Use.** Editable desktop replanning and focused mobile handoff views, shared colors and spacing, button variants, Lucide icons, Lora headings and Source Sans 3 body text. Font license copies are included.

**What worked.** The frames remain editable, and the code uses the same fonts and palette. This avoided relying on presentation-only images.

**What needed work.** An auto-layout helper changed row heights unexpectedly; screenshots exposed clipping. Setting fixed widths and content-driven heights corrected the affected rows. A component property was initially bound before its text child was appended; the rejected operation rolled back and was corrected. These were our construction mistakes, not evidence of a general Figma defect.

**Use again?** Yes. The code is still the implementation source; Figma documents the layout. No external design template or raster image was copied.

## OpenAI Codex, GitHub and npm — build workflow

**Use.** Codex assisted implementation, review, test creation and English drafting. GitHub stores the new public MIT-licensed project. npm installs exact package versions.

**What worked.** Small evidence-led cycles let tests challenge the generated code. Failed runs are retained alongside repaired runs. The public source is separate from private signing keys and raw browser traces.

**What needed work.** One early install ran from the wrong working directory. Only newly created task files were identified and moved into this project. Subsequent commands use explicit project paths. Agent output needed real browser and protocol checks; a plausible implementation was not sufficient.

**Use again?** Yes, with exact work directories, secret checks and independent execution evidence. No live model API is part of this runtime.

## FFmpeg and ffprobe — demo production

**Use.** Encoded a real Playwright browser recording as H.264, added English captions and removed idle frames at the end. ffprobe measured the finished video at 155.234 seconds, below the three-minute limit.

**What worked.** The video shows the working local application, including the HTTP MCP call log. Captions explain the synthetic data and guided conversation without replacing the actual screen recording.

**What needed work.** The arm64 path supplied by `ffprobe-static` 3.1.0 contained an x86_64 binary in this installation. We used `@ffprobe-installer/darwin-arm64` 5.0.1 instead. The encoder came from `ffmpeg-static` 5.3.0. These are development tools, not runtime dependencies or bundled app binaries.

**Use again?** Yes. The local file's codec, dimensions and duration were inspected; public playback remains a separate upload check. Evidence: `docs/verification/video-local.json`.
