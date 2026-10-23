# Return Relay

## Tagline

Leaving a day earlier? Move the return, too.

## Inspiration

Alex plans to return his headphones on Thursday, before a Friday trip. Then he has to leave on Thursday morning. He needs an earlier drop-off time and may need Maya to take the parcel.

Return Relay checks the return deadline, counter hours and household calendar, then proposes a time that fits. It keeps the packing list and handoff with that plan, so Alex and Maya can see what still needs to happen.

## What it does

Save Thursday’s plan, then type **“Actually, I’m leaving Thursday morning.”** The app offers Wednesday and shows the old and new times together. The saved plan changes when you confirm it.

Check the four packing items, then ask Maya to take the parcel. Switch to Maya’s demo view to accept the request and report the drop-off. The app records her report separately from the sample carrier receipt. Even after that receipt matches, the refund field stays **Unknown**. Refresh the page to retrieve the saved plan and history.

The other sample items show two common obstacles: the adapter’s return deadline has passed, and the bag is missing return instructions.

## How it works

The React interface sends actions to the web host, which connects to a **self-hosted MCP server** through the official TypeScript SDK. Nine tools read orders and policies, check available times, propose plans, save approved changes and handle the handoff. They run over **Streamable HTTP** with MCP **2025-11-25**. The app’s **Actual MCP calls** panel shows the connection, tool discovery and calls from your session.

Before saving, the server checks the plan again. An approval applies to the exact change shown on screen. If another tab has changed the plan, the old approval cannot replace it. Sending the same confirmed request twice returns the first result instead of adding another event. SQLite stores local sessions; Redis stores hosted sessions.

This entry uses a self-built Alexa+ web simulation. A guided parser handles the supported departure phrases; ambiguous wording prompts the user for an exact date and time. Orders, policies, calendars, household roles and receipts are fictional. The demo does not connect to Alexa hardware, a live language model or an Amazon account, and it does not process real returns or refunds.

## Challenges and fixes

A save can succeed even when its response never reaches the browser. Our first recovery screen suggested nothing had been saved, and the confirmation dialog covered the recovery button. We changed it to close the dialog and offer **Refresh saved plan**. The test now drops the response after a successful write and checks that recovery finds one saved event.

Another test found that **“I’m not leaving Thursday morning”** could still produce a Thursday proposal. The guided parser now asks for a date and time when the message contains a negation, a choice of days or a specific hour. It leaves the saved plan alone.

Keyboard tests also caught lost focus after cancelling a dialog. The hosted build exposed missing file extensions in the server’s imports. Both fixes have regression checks; the Friction Log includes the original failures and repairs.

## What we learned

The difficult part was keeping the screen and the saved record in agreement when a response went missing or another tab changed the plan. Checking the stored events as well as the screen caught errors that a successful button click would have missed.

## What is next

Connect an authorized calendar or return-policy source and test schedule changes against it. Separate household accounts would let Maya receive and accept an invitation on her own device.

## Submission fields

- Primary track: Alexa+
- Mini challenges: none
- Repository: https://github.com/Juhwa-Lee1023/return-relay
- Demo: https://return-relay.vercel.app
- Video: public URL pending upload and logged-out playback check
- Built with: TypeScript, React, Node.js, Express, MCP TypeScript SDK, Zod, Luxon, SQLite, Upstash Redis, Vite, Playwright, axe-core, Figma, Vercel, GitHub, OpenAI Codex
- New project: created during the hackathon period; no prior application or employer code reused
- AI assistance: OpenAI Codex assisted implementation, tests, review, English copy, design preparation and demo production. Runtime conversation uses the guided parser described above.
- Product Feedback: [PRODUCT_FEEDBACK.md](PRODUCT_FEEDBACK.md)
- Friction Log: [FRICTION_LOG.md](FRICTION_LOG.md)
- Judge instructions: [JUDGE_RUNBOOK.md](JUDGE_RUNBOOK.md)

Submission status: draft. Final competition entry is pending.
