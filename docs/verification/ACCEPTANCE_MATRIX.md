# Acceptance checkpoint

Checked 2026-10-23T11:35:42.582026+00:00. Code tested: `2c086da7e984a2608f758dbb371b9d17289840f7`.

Full type-check/build, 39 service tests and 14 browser tests passed. A fresh anonymous checkout installed, built, passed all 39 service tests and survived process restart.

The failed first clean build is retained. The repair changes test typing only; product behavior remains the same.

| Case | Status | Evidence and scope |
| --- | --- | --- |
| C01 Changed trip invalidates old Thursday drop-off | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C02 Approval gates plan commit | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C03 Exact change binding | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C04 Stale revision | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C05 Idempotent duplicate click | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C06 Expired approval | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C07 No feasible slot | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C08 Opening boundary | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C09 Relative date ambiguity | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C10 Timezone and DST | PASS | Both repeated-hour offsets tested in parsing and complete planning. The two acceptance deadlines yield completions exactly one hour apart, each before its own deadline and departure. Evidence: `cycle5-dst-service.txt` |
| C11 Unknown policy | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C12 Expired return window | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C13 Received-by versus handoff-by | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C14 Unclear order | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C15 Request versus acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C16 Wrong actor acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C17 Explicit sample acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C18 Drop-off versus refund | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C19 Verified demo scan | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C20 Invalid transition | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C21 Refresh/resume | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C22 Cross-session isolation | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C23 Prompt injection datum | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C24 Secret exposure | PARTIAL | Known signing secret and common token patterns absent from inspected history/bundle; selected video frames inspected. Repeat on final frozen release; not a universal secret-detection guarantee. Evidence: `secret-scan.json`, `video-local.json` |
| C25 Origin/auth checks | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C26 Usage and timeout | PASS | Real MCP per-session cap returns 429; a deliberately hanging upstream is interrupted at about 10 seconds. Local SQLite limiter tested; hosted Redis limiter not yet exercised. Evidence: `cycle6-tests-fixed.txt` |
| C27 Protocol handshake | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C28 Actual tool execution | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt`, `cycle6-browser-fixed.txt` |
| C29 Schema rejection | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. Evidence: `cycle6-tests-fixed.txt` |
| C30 Restart recovery | PASS | Actual process stop/restart of the fresh repaired checkout restored the exact SQLite plan; repeated confirmation added no event. Hosted recovery remains untested. Evidence: `restart-cycle6-fixed.json` |
| C31 Microphone denied | PASS | Browser reports microphone denied by policy. Typed planning and approval work; product does not request or use microphone access. Evidence: `cycle6-browser-fixed.txt` |
| C32 Responsive and accessible | PASS | Four viewport widths, keyboard cancel/focus, reduced motion, selected-view axe checks, and actual Chrome 200% zoom passed. This is not a full screen-reader or WCAG certification. Evidence: `cycle6-browser-fixed.txt`, `browser-real-zoom.json`, `browser-real-200pct.jpg` |
| C33 Loading/empty/error | PASS | No-plan policy states, failed session request/reconnect, successful write with a lost response, and stale-role recovery tested. No-match search is a service-only check. Evidence: `cycle6-browser-fixed.txt` |
| C34 Live versus guided mode | PASS | No model provider exists in this runtime. API and UI explicitly label guided mode and synthetic data; real MCP remains in use. Evidence: `cycle6-tests-fixed.txt` |
| C35 Clean checkout run | PASS | Fresh anonymous public clone, npm ci, full type-check/build, 39 tests, start, actual process restart and idempotent replay all passed after repairing the DST test fixture. First failed build is retained. Evidence: `clean-cycle6-fixed.json`, `restart-cycle6-fixed.json` |
| C36 Public demo and code access | PARTIAL | Public repository anonymously cloned. Hosted build exists, but persistent runtime and anonymous demo path are not yet verified. Evidence: `clean-cycle3.json` |
| C37 Video validation | PARTIAL | Actual local English-captioned recording is 155.234 seconds. No public upload or logged-out playback yet. Evidence: `video-local.json` |
| C38 Copy and feedback truth | PARTIAL | English source draft reviewed against current implementation. Final form fields and final release/link consistency are pending. Evidence: `DEVPOST.md`, `PRODUCT_FEEDBACK.md`, `FRICTION_LOG.md` |
| C39 No early submission | PASS | Actual clock gate run before 03:30 KST rejected final submission. A check at freeze remains required. Evidence: `deadline-gate-before-freeze.json` |
| C40 Receipt and no duplicate | NOT_RUN | Final submission has not occurred. Do not retry an uncertain submit without checking the entry status. Evidence: none |
