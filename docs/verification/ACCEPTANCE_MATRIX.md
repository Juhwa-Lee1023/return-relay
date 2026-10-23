# Acceptance checkpoint

Checked 2026-10-23T11:27:13.066574+00:00. Development checkpoint; final submission remains pending.

Source set: `62869ab3ce0b5611c85cdf2517739e73e5bb66ea85cc338f75e56f3a535bbcf2`. See `cycle5-source-manifest.json`.

39 domain/HTTP tests passed. The 14 browser tests passed before adding the new DST-only test; product code is unchanged since that browser run.

| Case | Status | Evidence and scope |
| --- | --- | --- |
| C01 Changed trip invalidates old Thursday drop-off | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C02 Approval gates plan commit | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C03 Exact change binding | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C04 Stale revision | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C05 Idempotent duplicate click | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C06 Expired approval | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C07 No feasible slot | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C08 Opening boundary | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C09 Relative date ambiguity | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C10 Timezone and DST | PASS | Both repeated-hour offsets tested in parsing and complete planning. The two acceptance deadlines yield completions exactly one hour apart, each before its own deadline and departure. Evidence: `cycle5-dst-service.txt` |
| C11 Unknown policy | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C12 Expired return window | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C13 Received-by versus handoff-by | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C14 Unclear order | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C15 Request versus acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C16 Wrong actor acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C17 Explicit sample acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C18 Drop-off versus refund | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C19 Verified demo scan | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C20 Invalid transition | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C21 Refresh/resume | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C22 Cross-session isolation | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C23 Prompt injection datum | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C24 Secret exposure | PARTIAL | Known signing secret and common token patterns absent from inspected history/bundle; selected video frames inspected. Repeat on final frozen release; not a universal secret-detection guarantee. Evidence: `secret-scan.json`, `video-local.json` |
| C25 Origin/auth checks | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C26 Usage and timeout | PASS | Real MCP per-session cap returns 429; a deliberately hanging upstream is interrupted at about 10 seconds. Local SQLite limiter tested; hosted Redis limiter not yet exercised. Evidence: `cycle4-service-fixed.txt` |
| C27 Protocol handshake | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C28 Actual tool execution | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt`, `cycle4-browser.txt` |
| C29 Schema rejection | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle4-service-fixed.txt` |
| C30 Restart recovery | PASS | Actual process stop/restart with the same SQLite directory restored the exact plan; repeated confirmation added no event. Hosted recovery is untested. Evidence: `restart-cycle3.json` |
| C31 Microphone denied | PASS | Browser reports microphone denied by policy. Typed planning and approval work; product does not request or use microphone access. Evidence: `cycle4-browser.txt` |
| C32 Responsive and accessible | PASS | Four viewport widths, keyboard cancel/focus, reduced motion, selected-view axe checks, and actual Chrome 200% zoom passed. This is not a full screen-reader or WCAG certification. Evidence: `cycle4-browser.txt`, `browser-real-zoom.json`, `browser-real-200pct.jpg` |
| C33 Loading/empty/error | PASS | No-plan policy states, failed session request/reconnect, successful write with a lost response, and stale-role recovery tested. No-match search is a service-only check. Evidence: `cycle4-browser.txt` |
| C34 Live versus guided mode | PASS | No model provider exists in this runtime. API and UI explicitly label guided mode and synthetic data; real MCP remains in use. Evidence: `cycle4-service-fixed.txt` |
| C35 Clean checkout run | PASS | Anonymous public clone, clean npm install, build, 35 tests, server start and restart performed at ee4c487. Repeat on final freeze commit. Evidence: `clean-cycle3.json`, `restart-cycle3.json` |
| C36 Public demo and code access | PARTIAL | Public repository anonymously cloned. Hosted build exists, but persistent runtime and anonymous demo path are not yet verified. Evidence: `clean-cycle3.json` |
| C37 Video validation | PARTIAL | Actual local English-captioned recording is 155.234 seconds. No public upload or logged-out playback yet. Evidence: `video-local.json` |
| C38 Copy and feedback truth | PARTIAL | English source draft reviewed against current implementation. Final form fields and final release/link consistency are pending. Evidence: `DEVPOST.md`, `PRODUCT_FEEDBACK.md`, `FRICTION_LOG.md` |
| C39 No early submission | PASS | Actual clock gate run before 03:30 KST rejected final submission. A check at freeze remains required. Evidence: `deadline-gate-before-freeze.json` |
| C40 Receipt and no duplicate | NOT_RUN | Final submission has not occurred. Do not retry an uncertain submit without checking the entry status. Evidence: none |
