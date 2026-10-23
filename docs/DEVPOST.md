# Return Relay

## Tagline

Leaving a day earlier? Move the return, too.

## Inspiration

The headphones need to go back on Thursday. The trip starts Friday. Then departure moves to Thursday morning, leaving a parcel by the door and a return plan that no longer works.

Return Relay finds an earlier time and shows what to pack. If Maya can take the parcel, Alex sends her the plan. The handoff stays pending until she accepts.

It is built for the person fitting a return around a trip and the household member taking the parcel. A changed departure affects the drop-off time, packing and who can help. Return Relay brings those decisions into one saved plan, so neither person has to reconstruct the arrangement from separate reminders and messages.

## What it does

Start with the headphones and save the proposed Thursday drop-off. Type **“Actually, I’m leaving Thursday morning.”** The app checks the store’s deadline, counter hours, travel time and household calendar, then offers Wednesday. The old and new times appear together so you can review the change before saving it.

After packing the four required items, ask Maya to take the parcel. Open Maya’s sample view to accept the time and report the drop-off. Loading the sample carrier receipt adds a separate receipt record; the refund field stays **Unknown**. Refreshing the page brings back the saved plan, packing progress and handoff history.

Two more items show where planning stops: an adapter whose deadline has passed and a bag with missing return instructions.

## How it works

Return Relay enters the Alexa+ track with a **working, self-hosted MCP server**, demonstrated through our own web client. The React app sends each action to the web host. The host uses the official TypeScript client over Streamable HTTP, negotiating MCP **2025-11-25**. Nine tools cover orders, policies, availability, plan previews, approved changes, handoffs and progress. Open **Actual MCP calls** to inspect initialization, tool discovery and calls made during the session.

The useful assistant behavior is what happens after “I’m leaving Thursday morning.” The server reads the saved return, checks the earlier departure and proposes a replacement. After approval, it saves the new plan and carries the same return through packing, Maya’s acceptance and the sample receipt. Closing and reopening the page preserves that work.

The planner checks candidate times against the same constraints before previewing and saving. Each approval names the exact change. Expiring proposals and revision checks stop an old preview from replacing a newer plan. Repeating a confirmed request returns its original result, avoiding a duplicate event. SQLite stores local sessions; Redis stores the hosted sessions.

The conversation uses a labelled guided parser for the supported departure changes. Orders, policies, calendars, family roles and receipts are synthetic. There is no live Alexa or language-model connection, Amazon account access, real return, refund or family message. The role switch lets the judge play both sides of a handoff in one browser.

## Challenges and changes made

A successful save can still look like a failure when its response never reaches the browser. Our first recovery message suggested the change had not happened, and the open confirmation dialog blocked the recovery button. The fix closes the dialog and offers **Refresh saved plan**. The regression test drops the response after the write, then confirms that recovery shows one saved event.

Keyboard testing caught another problem: cancelling a dialog lost focus because we had disabled its trigger before recording the focused element. Capturing it before the request fixed the issue. A two-tab test also exposed stale role information during recovery; the app now reloads the session as well as the case.

The first hosted deployment built successfully but returned HTTP 500. Its emitted Node modules needed explicit file extensions. We fixed the imports, added a NodeNext build check, and reran the hosted flows. The Friction Log records these failures and the checks that followed.

## What we learned

When a save response disappears, the app needs to retrieve the saved plan before asking the person to try again. Each recovery test now checks both the screen and the stored events. The same approach keeps Maya’s acceptance separate from the carrier receipt.

## What is next

Connect one authorized policy or calendar source, then test changes against it. Real household invitations would add separate accounts so that the recipient, rather than the demo visitor, accepts the handoff.

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
