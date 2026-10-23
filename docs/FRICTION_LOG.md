# Friction Log

These are observed issues from the Return Relay build, not invented customer incidents. None is presented as a defect in an Amazon SDK we did not access.

| ID / severity | Task and reproduction | Expected → observed | Resolution / actionable suggestion |
| --- | --- | --- | --- |
| RR-001 / Medium | Save a plan, ask for Friday morning, inspect the date control. | The control should match the preview → it held Thursday's value. | Our UI now uses the returned plan's departure. Test conversation and form state together. |
| RR-002 / Medium | Use an expired or reset session through the HTTP MCP path. | An actionable session error → our wrapper surfaced a generic 503. | Preserve the domain error and sanitized trace across the transport boundary. Initial failed HTTP run is retained. |
| RR-003 / Medium | Inspect error recovery after a request could lose its response. | State should be checked before retry → copy implied that no write had happened. | Changed the message and recovery action to refresh saved state. This was a review finding; no network incident or lost customer return is claimed. |
| RR-004 / Medium | Open approval with the keyboard, then press Escape. | Focus returns to the trigger → the trigger was inactive after closing. | Capture the trigger before disabling it for the network request; restore focus after closing. First browser run: 7/8; after repair: 8/8. |
| ENV-001 / Medium | Discover Vercel integrations and create environment variables through the connected tool. | Available configurations/write result → 403 permission errors. | Use the existing dashboard for authorized settings. The error is a connector permission boundary, not a Vercel outage. Clear permission scope in the tool response would reduce diagnosis time. |
| ENV-002 / Medium | Start Vercel CLI device login and open its verification page. | Device approval → the Allow Access control remained disabled; one request expired. | Did not bypass the disabled control. Used the connected deployment tool and dashboard instead. Cause remains unconfirmed. |
| OWN-001 / Low | First dependency installation. | Files in the isolated app → command used the parent working directory. | Identified and moved only task-created files. All later commands name the project directory. |
| OWN-002 / Low | Type-check Redis compare-and-swap. | Valid SDK call → wrong generic parameter ordering. | Read installed SDK typings and corrected the call. This is an implementation error. |
| DESIGN-001 / Low | Build editable Figma rows with layout helpers. | Content-driven height → helper left fixed-height rows and clipped content. | Applied explicit row sizing and inspected desktop/mobile renders. Keep helper defaults visible in layout review. |

## Useful next example for the Alexa+ ecosystem

**Important:** a small reference application that previews an action, asks the person to approve exact arguments, rejects stale revisions, and retries safely after an uncertain response. Return Relay implements this around a household errand; the same boundaries matter wherever a tool changes saved state.

The official FAQ explicitly allows a self-built web MCP client and states that the gated Alexa+ development tools are unavailable to hackathon entrants. We used that published route rather than treating unavailable partner tooling as a runtime defect. [Official FAQ](https://amazonappdev2026.devpost.com/details/faqs), checked October 23, 2026.
