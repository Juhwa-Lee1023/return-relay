# Product Feedback

Build observations from October 23–24, 2026. Exact dependency versions are in `package-lock.json`.

## Which tools did you use, and for what?

The official MCP TypeScript SDK connects the web host to nine tools over Streamable HTTP. Node.js and Express serve the app; SQLite stores local sessions and Upstash Redis stores hosted sessions. Zod checks inputs, and Luxon handles dates and time zones. React, TypeScript, Vite and tsx build and run the interface.

Playwright tests the browser flow, and axe-core checks accessibility. Figma holds editable layouts. Lucide supplies icons; Fontsource supplies Lora and Source Sans 3. GitHub holds the code, npm installs pinned dependencies and Vercel hosts the demo.

OpenAI Codex assisted code, tests, review, English copy and demo production. FFmpeg encodes the screen recording, and ffprobe checks the file. Write-good, alex and retext flag copy for review; Impeccable helps inspect the design. The Alexa+ Category SDK, Toolkit, CLI and official Web Simulator were not used.

## What worked well?

The MCP SDK’s official client could discover and call the same nine tools used by the web app. Zod rejected invalid inputs before a tool ran; Luxon made daylight-saving and explicit-offset tests straightforward. Node, Express and SQLite let the local app run without a cloud account, and saved plans survived a process restart.

React, Vite, TypeScript and tsx gave the UI and server shared types. Playwright caught lost keyboard focus and a blocked recovery button; axe-core added repeatable accessibility checks. The repaired Upstash/Vercel deployment passed nine API/MCP checks and ten browser checks, including restored sessions and separate households.

Figma made the layouts editable, while Lucide and the self-hosted fonts kept the assets consistent. GitHub and npm made the source and dependency versions repeatable. Codex helped produce changes that could be checked in small steps. FFmpeg and ffprobe produced the captioned recording and checked its length. The copy tools flagged vague phrases; Impeccable flagged small labels.

## What needs work?

Most problems came from our integration code. The MCP wrapper hid expired-session errors, and our annotations described field replacements as additive-only writes. The React UI lost focus after cancellation and left a dialog over the recovery button. Each has a regression check now.

Vercel’s first build reached READY, but the server failed because its ESM imports lacked file extensions. We fixed the imports and added a NodeNext check. The connected tool could not change environment settings, so we used the authorized dashboard. The Redis SDK’s eval type parameters also needed correction. Node’s SQLite module printed an experimental warning.

Our Figma layout helper clipped text; explicit row heights fixed it. Generated code still needed clean-install and browser tests. The ffprobe-static package supplied an x86_64 binary on this arm64 machine, so we used the darwin-arm64 package. Copy tools flagged valid technical words as well as awkward prose, so their suggestions needed review.

No separate tool issue was recorded for Zod, Luxon, Vite, tsx, Playwright, axe-core, GitHub, npm, Lucide or the font packages. Reproductions and fixes: https://github.com/Juhwa-Lee1023/return-relay/blob/main/docs/FRICTION_LOG.md

## How was onboarding?

We started with the MCP SDK and Zod tool schemas, then tested discovery and calls before building the full UI. Node, Express and SQLite provided the first saved plan locally. Luxon used explicit offsets from the first fixture. React, Vite, TypeScript and tsx were quick to start; the hosted Node imports needed a separate check.

Playwright and axe-core ran against fresh local servers and databases. Vercel could deploy the code before shared storage was ready; connecting the existing Upstash store completed persistence. Figma frames needed a sizing correction. Lucide and the fonts installed from npm, with their licenses included in the source.

A new GitHub repository and lockfile kept the Codex-assisted changes reviewable. FFmpeg worked for encoding; ffprobe worked after changing the architecture-specific package. The copy and design tools were installed separately from the app and checked alongside the rendered screens.

## Would you use these tools again?

Yes. I would keep the MCP SDK for the client/server connection, Zod and Luxon for input and time rules, and Node/Express with SQLite for a local version that judges can run. Upstash and Vercel provide the hosted version. React, Vite, TypeScript and tsx fit this small web app.

Playwright and axe-core earned their place by finding problems in the actual flow. I would keep Figma for editable layouts, with Lucide and the fonts for the interface. GitHub and npm preserve the source and dependency history. I would use Codex again and test each change it produces. FFmpeg and ffprobe are enough for recording and validating this demo. The copy and design tools are useful when their suggestions are checked against the screen and the intended meaning.

I have no hands-on feedback on the gated Alexa+ tools or hardware from this build.

## Feature request

Important: add a complete MCP example for changing an existing plan. It should show the proposed change, ask for approval, reject an outdated version and recover when a save succeeds but its response is lost. In Return Relay, these steps keep a new departure from silently replacing the wrong return plan.

[Reproductions and fixes](FRICTION_LOG.md) · [Verification results](verification/cycle17-review.json)
