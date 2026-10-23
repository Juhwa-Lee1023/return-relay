# Product Feedback

Build observations from October 23–24, 2026. `package-lock.json` records the exact versions. Return Relay uses the official MCP TypeScript SDK and a self-built web client; the gated Alexa+ Category SDK, Toolkit, CLI and official Web Simulator were not available for this entry.

## MCP TypeScript SDK 1.32.1

The official client initializes the connection, discovers nine tools and calls them over Streamable HTTP. Defining Zod schemas and enabling stateless JSON responses gave the web app and integration tests the same tool path.

Our wrapper initially turned an expired session into a generic 503. Preserving the domain error and sanitized trace made recovery possible. Approval needed application rules too: the signed approval names the session, actor, tool and exact arguments, while revision checks prevent an old plan from overwriting a newer one.

A protocol review caught another mistake in our code. The tools advertised additive-only updates even when they replaced saved fields. Four tools now set `destructiveHint: true`, and the HTTP test checks all nine annotations. The service enforces approval separately from these hints. [ToolAnnotations specification](https://modelcontextprotocol.io/specification/2025-11-25/schema#toolannotations), checked October 23, 2026.

**Request — Important:** publish a working preview-and-approval example that also handles stale revisions and a lost save response. Return Relay needed all three for a changed departure. I would use this SDK again for a tool server with a separate trusted web host. Evidence: `src/server/mcp.ts`, HTTP tests C03/C27/C28 and the Friction Log.

## Node.js 24, Express 5.3.0 and SQLite

One Node server serves the interface and MCP endpoint. Built-in SQLite makes the local version runnable without a cloud account. The tests confirm that a process restart preserves the plan and that repeating a confirmed request returns the original result.

Node emitted an experimental SQLite warning in the tested release. The README specifies Node 24; the hosted application uses Redis for persistent state. I would keep Node, Express and SQLite for this local judging path. Evidence: `src/server/store.ts`, persistence and concurrency tests.

## Zod 4.6.7 and Luxon 3.7.2

Zod checks the tool arguments; Luxon handles exact timestamps and Los Angeles time. Tests cover unsupported step names, missing offsets, daylight-saving transitions and a drop-off that finishes after the deadline.

A Friday conversation change once left Thursday selected in the form, even though the planner returned Friday. Reading the returned departure fixed this UI state error. These libraries helped make the time and input rules testable, and I would use them again. Evidence: planner tests C08/C10 and HTTP C29.

## React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 and tsx 4.23.15

React provides the conversation, itinerary and native confirmation dialog. Vite builds the frontend; TypeScript checks the shared domain types; tsx runs the local server.

Keyboard tests found that cancelling a dialog lost focus. We had captured focus after disabling the button that opened it. Moving that capture before the request fixed it. Hot reload also needed explicit React-root disposal to avoid a duplicate-root warning.

The hosted build exposed a separate issue: Node could not resolve extensionless imports in emitted server modules. Explicit `.js` imports, a JSON import attribute and a NodeNext build check fixed the runtime failure. I would use this stack again, with both browser and native-server checks in the release path.

## Playwright and axe-core

The browser tests click through approval, replanning, packing, handoff, receipt and refresh against the application’s HTTP endpoints. An isolated server and fresh database keep those runs separate from the demonstration household.

The tests caught lost keyboard focus, a confirmation dialog covering recovery after a lost response, and stale identity after another tab changed roles. After the fixes, all 17 local browser cases passed. Ten further hosted checks covered narrow and landscape screens, Maya’s unavailable time, and automated accessibility in saved-plan, handoff and receipt states.

Full-page screenshots of a native dialog capture more than its viewport-sized backdrop, so viewport screenshots work better in the gallery. Axe checks stay useful alongside keyboard and visual inspection; screen-reader testing is still pending. I would use both tools again. Evidence: `tests/browser/flow.spec.ts`, cycle11 and cycle13 verification records.

## Upstash Redis SDK 1.39.0 and Vercel

Redis holds the hosted household state with atomic revision checks, seven-day expiry and rate limits. Vercel serves the frontend and HTTP function.

The connected Vercel tool returned 403 for environment changes. The authorized dashboard provided another path. After the owner approved sharing the existing free store, we connected it to this project’s Production environment. A wrong Redis `eval` generic also needed correction against the installed SDK types.

The first deployment reached READY but returned HTTP 500 because of the Node import problem described above. After the fix, five hosted browser flows and nine API/MCP checks passed, including restore, replay, revision conflict and session isolation. I would use this setup again for the demo; those short checks do not establish load capacity or long-term reliability. Evidence: `cycle11-review.json` and `cycle11-hosted-api.json` under `docs/verification/`.

## Figma, Lucide and self-hosted fonts

Figma holds editable desktop replanning and mobile handoff views. The app and frames share Lora headings, Source Sans 3 body text, colors and button styles. Lucide supplies the icons; font license files accompany the source.

An auto-layout helper left rows too short and clipped the text. Explicit row sizing fixed the renders. A component property also needed its text child attached before binding. I would use these tools again and keep the code as the implementation source.

## OpenAI Codex, GitHub and npm

Codex assisted code, tests, review, design preparation and English drafting. GitHub holds the new MIT-licensed repository; npm installs pinned dependencies. Failed runs and repaired runs provide a record of what changed.

An early install used the wrong working directory. We identified the task-created files, moved them into the isolated project and specified the directory in subsequent commands. Generated code also needed clean-install, browser and protocol checks. I would use this workflow again with source review and secret checks before publication. The app itself uses a guided parser, with no live model API.

## FFmpeg and ffprobe

FFmpeg encodes the actual browser recording and burns in English captions. ffprobe checks codec, dimensions and duration. The revised cut runs for 155.234 seconds. Frame checks confirmed that the updated interface and captions remain readable.

The arm64 path in `ffprobe-static` 3.1.0 contained an x86_64 binary in this installation. `@ffprobe-installer/darwin-arm64` 5.0.1 worked; `ffmpeg-static` 5.3.0 supplied the encoder. I would use them again for this recording workflow. They are local production tools, outside the app runtime. Evidence: `docs/verification/video-local.json`.
