# Submission route

Official rules and FAQ rechecked October 24, 2026, at 01:50 KST. Entry is still a draft.

## Official rules

[Build, Ship, Shape — Rules](https://amazonappdev2026.devpost.com/rules), sections 1, 4 and 6.

- Deadline: October 23 at noon Pacific, or October 24 at 04:00 Korea time.
- Selected track: Alexa+. Our primary technical route is a working MCP server over Streamable HTTP, negotiating protocol 2025-11-25, demonstrated through our own web client. This is stronger evidence than relying only on the separate simulation exemption: the required technology is imported and called in the runtime.
- GitHub source, working setup instructions, an open-source license, a feature description and Product Feedback are required. We use a new public MIT repository.
- The demonstration must show the application working. It must be public on YouTube or Vimeo; our video target is under three minutes.
- We claim no mini-challenge entry, AWS credits or real Amazon service connection.
- The entrant confirmed eligibility and accepted the registration terms. Final entry is pending.

## Why this project belongs in the track

The changed departure triggers work on an existing return: read its state, propose an earlier time, save after approval, then continue packing and handoff. The saved state survives a page reload. The MCP server performs these operations; the web client exposes the calls and decisions.

The four equally weighted judging areas are technical implementation, design, potential impact and idea quality. Our strongest evidence is the working multi-step flow and recoverable state. The limited guided conversation, synthetic upstream data and absence of household user research constrain the impact and conversational-intelligence claims. They are not measured real-world benefits.

## Official FAQ

[Build, Ship, Shape — FAQs](https://amazonappdev2026.devpost.com/details/faqs), Alexa+ tools, hosting and web-client questions.

The gated Alexa+ development tools are unavailable to entrants. A custom web client can demonstrate a self-hosted MCP server by making actual initialization, discovery and tool calls. A locally runnable public repository and demonstration video are sufficient; continuous public hosting is not mandatory.

Return Relay follows that route with the official TypeScript MCP client and server. Current execution evidence is in [cycle16-hosted-api.json](verification/cycle16-hosted-api.json); the preceding screen and accessibility checks are in [cycle15-review.json](verification/cycle15-review.json).

## User's execution window

The entrant requested no final submission before October 24 at 03:30 KST. Feature additions stop at 02:30; review and regression continue until 03:30. Target submission is 03:45 and receipt verification 03:50. These are the entrant's operating deadlines, not additional contest rules.

## Current evidence

- Protocol and workflow: `docs/verification/ACCEPTANCE_MATRIX.md`.
- Public source: <https://github.com/Juhwa-Lee1023/return-relay>.
- Video: actual local recording prepared; public link awaits upload and anonymous playback verification.
- Registration: completed. Devpost project 1502840 / submission 1257279 is a draft. Final submission and receipt: pending.
