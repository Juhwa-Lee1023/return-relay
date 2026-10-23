# Return Relay

## Tagline

Your trip moved. Your return plan should move with it.

## Inspiration

A parcel can sit by the door even when everyone knows the return deadline. Someone still has to find a time, check the packaging, and take it to the counter. A changed trip can undo that plan. Asking a family member to help creates another loose end: did they actually agree?

Return Relay follows those loose ends through one return. Its central moment is a simple change: “Actually, I’m leaving Thursday morning.”

## What it does

The sample household originally leaves on Friday. Return Relay finds a Thursday drop-off that fits the store’s deadline, counter hours, packing time and household calendar. When departure moves to Thursday morning, it shows why that errand no longer fits and proposes Wednesday instead. The saved plan changes only after approval.

The parcel then needs four packing items. Alex can ask Maya to take it; the request stays pending until the person playing Maya explicitly accepts in her labelled sample view. Reporting a drop-off is separate from matching a sample carrier receipt. Neither turns into a refund.

The exact plan and history survive a refresh. An adapter with an expired deadline and a bag with incomplete instructions show what happens when a return cannot be planned.

## How it works

This is a self-built Alexa+ web simulation backed by a real Streamable HTTP MCP server. The React interface talks to a web host, which uses the official TypeScript MCP client for `initialize`, `tools/list` and `tools/call`. Nine tools cover orders, policies, availability, previews, approved plans, handoffs and progress. A visible call log comes from those HTTP requests.

The schedule calculation enumerates feasible times and compares the same set of constraints again before saving. Signed proposals expire. Write approvals bind the session, actor, tool and exact arguments. Revision checks reject outdated changes, and repeated confirmed requests return the original result instead of adding duplicate events. SQLite provides the reproducible local persistence path; the hosted configuration uses Redis.

Conversation uses a labelled deterministic guided parser. It supports the demonstrated departure changes and asks for an exact date when a phrase is unclear. It is not a live language-model or Alexa+ device connection. Orders, policies, calendars, family members and receipts are synthetic. No Amazon account, real return, refund or family message is connected.

## Challenges and changes made

Testing found a date-control mismatch after a Friday conversation change, an expired session being reported as a generic connection failure, and error copy that could imply nothing had been saved after a lost response. We fixed all three and kept the failed test evidence. Browser testing then found that cancelling an approval dialog lost keyboard focus; capturing the trigger before the request fixed it.

Those issues mattered more than adding another feature: a return plan must make its saved state clear, especially after a change or interruption.

## What we learned

A tool call being authenticated is not the same as the person approving that change. A request for help is not acceptance. A drop-off report is not a carrier receipt, and a receipt is not a refund. Keeping those distinctions in the data model made the interface easier to explain and the failures easier to test.

## What is next

The next integration would replace a single synthetic policy or calendar adapter with an authorized source while retaining the same proposal, approval and revision boundaries. Real household invitations would also need independent authentication. Neither is required to try the complete local scenario.

## Submission fields

- Primary track: Alexa+
- Mini challenges: none
- Repository: https://github.com/Juhwa-Lee1023/return-relay
- Demo: hosted URL to be added after runtime verification; local run is available in README
- Video: public URL to be added after upload and logged-out verification
- Built with: TypeScript, React, Node.js, Express, MCP TypeScript SDK, Zod, Luxon, SQLite, Redis adapter, Vite, Playwright, axe-core, Figma, Vercel, GitHub, OpenAI Codex
- New project: created during the hackathon period; no prior application or employer code reused
- AI assistance: OpenAI Codex assisted implementation, test creation, review, documentation and demo preparation. Runtime conversation is the guided parser described above.
- Product Feedback: [PRODUCT_FEEDBACK.md](PRODUCT_FEEDBACK.md)
- Friction Log: [FRICTION_LOG.md](FRICTION_LOG.md)
- Judge instructions: [JUDGE_RUNBOOK.md](JUDGE_RUNBOOK.md)

This file is the current submission draft. Publication of this repository is not competition submission.
