# Return Relay

**Leaving a day earlier? Move the return, too.**

You planned to return the headphones on Thursday, before a Friday trip. Now you leave Thursday morning. Return Relay checks the return deadline, drop-point hours and household calendar, then offers Wednesday instead. Review the new time, save it, pack the parcel and ask Maya to take it.

[Open the demo](https://return-relay.vercel.app) — no sign-in required. Each visitor starts with a separate sample household, saved for seven days.

This is a **self-built Alexa+ web simulation**. A labelled guided parser handles the supported phrases. The web host calls nine MCP tools through the official TypeScript SDK over **Streamable HTTP**, negotiating protocol **2025-11-25**. The call log is visible in the app.

Orders, policies, calendars, family roles and receipts are synthetic. The demo has no live Alexa or language-model connection, Amazon account access, real returns, refunds or family messages.

## Run locally

Requires Node.js 24 and npm. No API key or paid service is needed for local use.

```sh
npm ci
npm run build
npm test
npm start
```

Open `http://127.0.0.1:4318`. The server serves the built web application and `/api/mcp` from the same origin. SQLite and a generated local signing key persist in the ignored `data/` directory. To start another local instance, give it its own `RR_DATA_DIR`, `PORT` and matching `RR_PUBLIC_ORIGIN`.

For frontend development, run `npm run dev` and `npx vite --host 127.0.0.1` in two terminals. Open the Vite address at port 5173; its API proxy connects to port 4318.

## Try the complete relay

1. Choose **Wireless headphones**. Review Thursday's proposed drop-off and confirm it.
2. Choose **“Actually, I’m leaving Thursday morning.”** The Thursday errand now conflicts with departure. Compare the Wednesday proposal with the saved plan. Cancel once to see that the saved plan stays unchanged, then approve the new time.
3. Check all four packing items and confirm **Mark parcel packed**.
4. Ask Maya to take the parcel. The request stays pending.
5. Open the labelled **Maya's view**, accept the request, then report the drop-off.
6. Load the **sample carrier receipt**. A matched sample receipt confirms only the demo drop-off. Refund remains **Unknown**.
7. Refresh the page. The saved household and its revision history return.

The adapter’s return deadline has passed. The bag needs a deadline and return method before planning can start. Both are available from the item list. The scenario uses a fixed clock: November 2, 2026, in Los Angeles.

## Architecture

```text
Browser UI and explicit confirmation
  -> Web host: same-origin session + CSRF + signed confirmation
  -> Official MCP client: initialize, tools/list, tools/call
  -> Streamable HTTP /api/mcp
  -> MCP tool validation and approval checks
  -> Planner + revisioned household state
  -> SQLite locally / approved Redis on hosted deployment
```

The UI's **Actual MCP calls** panel records HTTP request IDs, method/tool, negotiated protocol, status and duration. It does not expose bearer tokens or confirmation secrets.

### Tools

| Tool | What it does |
| --- | --- |
| `orders_search` | Finds the session's sample orders. |
| `return_policy_get` | Reads a synthetic policy and deadline basis. |
| `schedule_windows_get` | Reads sample availability and counter hours. |
| `return_plan_preview` | Calculates a candidate without saving it. |
| `return_plan_commit` | Saves the exact approved proposal. |
| `handoff_request` | Requests a sample handoff; it does not accept it. |
| `handoff_accept` | Accepts as the assigned sample member. |
| `return_step_update` | Records packing, reported drop-off, or a matching sample receipt. |
| `return_case_get` | Reads saved state, revision and history. |

Every MCP write needs a host-issued approval bound to the session, actor, tool and exact arguments. The server signs each preview and sets an expiry. If the saved plan changes, the user must review a fresh proposal. An idempotency key prevents a repeated confirmed request from adding a second event. The MCP access token alone cannot approve a write.

The role switch lets one visitor try both Alex and Maya within the sample household. Real family accounts would need independent authentication. **Reset sample** asks for confirmation before deleting that household’s saved plans and history.

## Planning rules

The planner checks packing time, travel in both directions, counter processing, opening hours, actor availability, departure and the policy's deadline basis. It enumerates 15-minute starts within the fixed scenario. It does not estimate road traffic or learn a schedule. When instructions are missing, or a received-by deadline lacks transit information, the planner asks for those details.

## Hosted configuration

The Vercel application requires a private signing secret and an approved Redis store. It refuses to use temporary server disk as persistent storage.

- `RR_PUBLIC_ORIGIN`: exact public origin of this application.
- `RR_SIGNING_SECRET`: a cryptographically random, server-only secret of at least 32 characters.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or Vercel's equivalent `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

Business keys use the `return-relay:v1:` prefix. Sessions expire after seven days. Anonymous session creation, MCP traffic and session writes are bounded. Reset removes only the caller's sample household. A production key rotation invalidates existing signed sessions and confirmations.

## Verification

`npm test` runs domain and real HTTP integration tests using temporary local stores. After `npx playwright install chromium`, `npm run test:browser` builds and tests the real interface on an isolated local server. Test logs and the acceptance matrix are added under `docs/verification/` as release candidates are verified. These checks cover the synthetic scenario and our application; Amazon integration and household user research have not been tested.

To repeat the hosted checks against the synthetic demo:

```sh
RR_TEST_URL=https://return-relay.vercel.app node scripts/verify-hosted.mjs
RR_TEST_URL=https://return-relay.vercel.app node scripts/verify-hosted-accessibility.mjs
```

The second script checks 320px and landscape approval layouts, replanning for an unavailable helper, and automated accessibility in saved-plan, handoff and receipt states. It creates its own sample session. Set `RR_TEST_URL` to test another deployment and `RR_VERIFY_OUTPUT` to choose its output directory. The hosted service limits new sessions per IP; avoid running the remote checks in parallel or repeatedly. An automated accessibility pass is a scoped check, not a complete audit.

## AI assistance and attribution

This project was developed with OpenAI Codex assistance for implementation, test creation, review and English drafting. Runtime conversation uses the guided parser described above. The original parcel illustration is CSS; interface icons are Lucide. No Amazon logos, proprietary code or real order data are included.

See [LICENSE](LICENSE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and the submission documents under `docs/`.
