# Try Return Relay

Open [Return Relay](https://return-relay.vercel.app) and allow about three minutes for the core scenario. No account, API key, microphone or Amazon device is needed. To run your own copy, follow the local setup below.

## Start

Use Node.js 24. In a clean checkout, run:

```sh
npm ci
npm run build
npm test
npm start
```

Open **http://127.0.0.1:4318**. This starts the real HTTP MCP server and serves the built interface. The sample household is created on first visit. The server stores its SQLite database and generated signing key in the ignored `data/` directory.

## Follow one parcel

1. Choose **Plan the headphones return**. Thursday is the initial proposal for a Friday trip. Choose **Review & save**, then **Confirm & save**.
2. Type **Actually, I’m leaving Thursday morning.** or use that exact suggestion. The old Thursday drop-off is too late. The new proposal moves it to Wednesday.
3. Choose **Keep saved plan** once. The Friday trip and Thursday errand stay saved. Try the change again and approve it.
4. Check all four items. Confirm **Mark parcel packed**, then **Ask Maya to take it**. The status should read **Waiting for Maya**.
5. Choose **Open Maya’s view**. The role switch lets you try Maya’s actions in the same demo session. Confirm **Accept as Maya**, then **Report drop-off as Maya**.
6. Confirm **Load sample carrier receipt**. The sample parcel is accepted; **Refund** remains **Unknown**.
7. Refresh. The saved plan, steps and receipt remain. Open **Return instructions & saved history** to see the revisions.

Open **Actual MCP calls** at any point. It lists the actual HTTP calls made by the web host, including the negotiated protocol. Tokens are not displayed.

## Try a failure

- The travel adapter's deadline has passed, so there is no proposed plan.
- The canvas bag has no confirmed return instructions, so the app asks for them.
- **Before Friday** is ambiguous; the guided conversation asks for an exact departure.
- **Change departure or person** lets you select a departure before any available slot. The app explains that no slot fits.
- Escape closes a confirmation without saving. Keyboard focus returns to the button that opened it.

## Verification commands

```sh
npm test
npx playwright install chromium
npm run test:browser
```

The browser suite builds the app and starts an isolated local server on port 4326 with a fresh test database. It covers the complete relay, cancelled approval, blocked policies, automatic accessibility checks, and 360/390/768/1440px layouts. It does not reuse or reset your normal sample household. Raw browser traces can contain session capabilities; do not publish them.

## State and scope

The clock is fixed at November 2, 2026, in Los Angeles. Calendars and journeys are fictional inputs. The planner checks feasibility; it does not predict traffic. A sample session lasts seven days. **Reset sample** deletes only the current sample household. An incognito window receives a separate household.

The hosted version is available at https://return-relay.vercel.app. It uses the approved Redis connection and a server-only signing secret. Five hosted browser flows and nine API/MCP checks passed on beeeec8; the exact scope is in docs/verification/cycle11-review.json.
