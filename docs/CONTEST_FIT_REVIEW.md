# Return Relay — contest fit review

Reviewed October 24, 2026; evidence updated after cycle17. The entry remains a draft.

## Finding

Return Relay has a supported route into the Alexa+ track: its own MCP server runs over Streamable HTTP and a custom web client calls it. It follows one household task from a changed departure through packing and drop-off. Changing departure invalidates Thursday's drop-off; the app proposes Wednesday, waits for approval, preserves the new plan and continues the handoff.

The demo keeps Alex’s revised plan and Maya’s reply together. The current guided parser and fictional upstream data demonstrate that workflow. They do not establish open-ended assistant intelligence, a live Alexa integration or demand from households.

## Source check

- [Official rules](https://amazonappdev2026.devpost.com/rules), sections 1, 4 and 6: deadline, technical route, deliverables and judging.
- [Official FAQ](https://amazonappdev2026.devpost.com/details/faqs), gated-tools, hosting and real web-client answers: the custom client is permitted; Alexa hardware and gated tools are unnecessary.
- [Resources](https://amazonappdev2026.devpost.com/resources), Alexa+: Streamable HTTP and web simulation guidance.

The official deadline is October 24 at 04:00 KST. The 03:30 release freeze is the entrant's own schedule. The entry uses the working MCP-server route described in the FAQ.

## Evidence against the judging areas

| Area | What the judge can inspect | Assessment and remaining gap |
| --- | --- | --- |
| Technical implementation | `src/server/mcp.ts` imports and calls the official SDK. Current hosted verification negotiates 2025-11-25, discovers nine tools and rejects an unapproved write. | Strong implementation evidence for this scope. No live Amazon or third-party order/calendar connection. |
| Design | Old and proposed times appear together; confirmation, packing, waiting for Maya and receipt remain separate steps. Cycle17 repeats the full browser flow. | Coherent browser experience. The conversation supports a fixed set of phrases; this is not a tested voice interaction. |
| Potential impact | A person leaving earlier and a household helper need one agreed time and a packing list. The revised introduction identifies both users and the coordination problem. | A specific, plausible use case. No interviews, adoption results, refund recovery or measured time savings. |
| Quality of the idea | The changed departure affects the ongoing task, then the same case continues through packing and handoff. Reloading restores the state. | More complete than answering a return-policy question. Cross-service orchestration remains a simulated scenario, not multiple live integrations. |

No award probability or numerical judging score is assigned.

## Submission readiness

| Item | State | Evidence |
| --- | --- | --- |
| Real HTTP MCP runtime | Verified | [cycle17-hosted-api.json](verification/cycle17-hosted-api.json); nine current hosted checks |
| Full application flow | Verified locally | [cycle17-browser-after-isolation.txt](verification/cycle17-browser-after-isolation.txt); 19 cases, including replanning, handoff and recovery |
| Domain and HTTP service checks | Verified locally | [cycle17-service-after.txt](verification/cycle17-service-after.txt); 47 cases |
| Public source, license and setup | Available | Repository root README, LICENSE and dependency lockfile |
| English description and tool feedback | Updated | DEVPOST, PRODUCT_FEEDBACK, FRICTION_LOG and JUDGE_RUNBOOK documents |
| Working demo video | Local file verified | 155.234 seconds; [video-local.json](verification/video-local.json) |
| Public YouTube/Vimeo URL | Pending | Upload terms confirmation and logged-out playback remain open |
| Devpost details save and final receipt | Pending | Main story is entered; required video URL prevents completing that step. Final entry has not been sent. |

## Corrections made in this review

1. Named the working MCP-server route and protocol in the main story, instead of leaving the entry described only as a simulation.
2. Added the two users, their coordination problem and the full consequence of changing departure.
3. Replaced “Say” with “Type” in the judging instructions; the app does not use a microphone.
4. Updated the runbook and acceptance summary that described an old revision as current. Historic test records keep their original revision.
5. Rejoined two Friction Log entries to the existing table so they render as rows.

## Current runtime and recording

Runtime `44f0e38` passed the build, 47 service cases, 19 browser cases, 20 layout checks, nine hosted API/MCP checks and ten hosted browser checks in cycle17. A fresh installation and process restart were also checked. The revised captions use that version’s recording. The recording, public upload and final competition entry have separate status records in [video-local.json](verification/video-local.json) and the submission checklist.
