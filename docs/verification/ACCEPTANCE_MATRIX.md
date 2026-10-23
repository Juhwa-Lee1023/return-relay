# Acceptance checkpoint

Updated October 24, 2026 after cycle16. Development checkpoint; final submission remains pending.

40 acceptance cases: 36 scoped PASS, 3 PARTIAL, 1 NOT_RUN. Test counts are distinct from acceptance cases.

Current runtime `81735a6` passed the cycle16 build, 42 service tests, 17 browser tests and nine hosted API/MCP checks. See [cycle16-review.json](cycle16-review.json). Clean installation and process restart evidence below retains its original tested revision; it was not rerun in cycle16.

| Case | Status | Evidence and scope |
| --- | --- | --- |
| C01 Changed trip invalidates old Thursday drop-off | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C02 Approval gates plan commit | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C03 Exact change binding | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C04 Stale revision | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C05 Idempotent duplicate click | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C06 Expired approval | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C07 No feasible slot | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C08 Opening boundary | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C09 Relative date ambiguity | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C10 Timezone and DST | PASS | Both repeated-hour offsets tested in parsing and complete planning. The two acceptance deadlines yield completions exactly one hour apart, each before its own deadline and departure. [cycle5-dst-service.txt](cycle5-dst-service.txt) |
| C11 Unknown policy | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C12 Expired return window | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C13 Received-by versus handoff-by | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C14 Unclear order | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C15 Request versus acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C16 Wrong actor acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C17 Explicit sample acceptance | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C18 Drop-off versus refund | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C19 Verified demo scan | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C20 Invalid transition | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C21 Refresh/resume | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C22 Cross-session isolation | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C23 Prompt injection datum | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C24 Secret exposure | PARTIAL | Known signing secret and common token patterns absent from inspected history/bundle; selected video frames inspected. Repeat on final frozen release; not a universal secret-detection guarantee. [secret-scan.json](secret-scan.json); [video-local.json](video-local.json) |
| C25 Origin/auth checks | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C26 Usage and timeout | PASS | Real MCP per-session cap returns 429; a deliberately hanging upstream is interrupted at about 10 seconds. Local SQLite limiter tested; hosted Redis limiter not yet exercised. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C27 Protocol handshake | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C28 Actual tool execution | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt); [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C29 Schema rejection | PASS | Local synthetic fixtures; domain or actual HTTP MCP integration as named in the test log. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C30 Restart recovery | PASS | Extracted distributable source ZIP matches the tested a19626c source. Clean npm ci, full type-check/build, 42 service tests and actual SQLite process restart/idempotent replay passed. This row records the original local restart check; hosted Redis checks are recorded separately in cycle16-hosted-api.json. [cycle10-package-execution.json](cycle10-package-execution.json); [restart-package-cycle10.json](restart-package-cycle10.json) |
| C31 Microphone denied | PASS | Browser reports microphone denied by policy. Typed planning and approval work; product does not request or use microphone access. [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C32 Responsive and accessible | PASS | Four viewport widths, keyboard cancel/focus, reduced motion, selected-view axe checks, and actual Chrome 200% zoom passed. This is not a full screen-reader or WCAG certification. [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt); [browser-real-zoom.json](browser-real-zoom.json); [browser-real-200pct.jpg](browser-real-200pct.jpg) |
| C33 Loading/empty/error | PASS | No-plan policy states, failed session request/reconnect, successful write with a lost response, and stale-role recovery tested. No-match search is a service-only check. [cycle6-browser-fixed.txt](cycle6-browser-fixed.txt) |
| C34 Live versus guided mode | PASS | No model provider exists in this runtime. API and UI explicitly label guided mode and synthetic data; real MCP remains in use. [cycle6-tests-fixed.txt](cycle6-tests-fixed.txt) |
| C35 Clean checkout run | PASS | Anonymous fresh checkout at deployed commit. Clean install, full build including NodeNext, 42 service tests and actual local process restart/idempotent replay passed. Hosted storage is separately verified in cycle11. [clean-cycle12.json](clean-cycle12.json); [restart-cycle12.json](restart-cycle12.json) |
| C36 Public demo and code access | PASS | Public repository anonymously cloned; public Vercel demo tested in fresh browser contexts. Five hosted flows and nine API/MCP checks passed against deployed Redis-backed runtime. Public video remains a separate gate. [clean-cycle12.json](clean-cycle12.json); [cycle11-hosted-api.json](cycle11-hosted-api.json); [cycle11-hosted-browser.txt](cycle11-hosted-browser.txt) |
| C37 Video validation | PARTIAL | Actual local English-captioned recording is 155.234 seconds. No public upload or logged-out playback yet. [video-local.json](video-local.json) |
| C38 Copy and feedback truth | PARTIAL | English source draft reviewed against current implementation. Final form fields and final release/link consistency are pending. [DEVPOST.md](../DEVPOST.md); [PRODUCT_FEEDBACK.md](../PRODUCT_FEEDBACK.md); [FRICTION_LOG.md](../FRICTION_LOG.md) |
| C39 No early submission | PASS | Actual clock gate run before 03:30 KST rejected final submission. A check at freeze remains required. [deadline-gate-before-freeze.json](deadline-gate-before-freeze.json) |
| C40 Receipt and no duplicate | NOT_RUN | Final submission has not occurred. Do not retry an uncertain submit without checking the entry status.  |
