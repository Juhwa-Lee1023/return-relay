import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { demo, newHousehold } from "../domain/fixtures.js";
import {
  DomainError,
  type Principal,
  type ReturnCase,
  type Preview,
  type Proposal,
} from "../domain/types.js";
import {
  WRITE_TOOLS,
  RelayService,
  type Approval,
  type Arguments,
} from "../domain/service.js";
import { getStore } from "./store.js";
import { seal, unseal, digest } from "./crypto.js";
import { mcpHandler, withMcp, callTool, schemas } from "./mcp.js";
import { label } from "../domain/planner.js";
const app = express();
app.disable("x-powered-by");
const hosted = !!process.env.VERCEL;
const origin = process.env.RR_PUBLIC_ORIGIN ?? "http://127.0.0.1:4318";
const origins = new Set([
  origin,
  ...(!hosted
    ? [
        "http://localhost:4318",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
      ]
    : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
    : []),
]);
const hosts = new Set([...origins].map((x) => new URL(x).host));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  );
  if (
    !hosts.has(req.get("host") ?? "") ||
    (req.get("origin") && !origins.has(req.get("origin")!))
  )
    return res
      .status(403)
      .json({
        code: "ORIGIN_DENIED",
        message: "This request came from an unrecognized origin.",
      });
  if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "24kb" }));
function principal(req: Request): Principal {
  const token = (req.headers.cookie ?? "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("rr_session="))
    ?.slice(11);
  if (!token)
    throw new DomainError(
      "SESSION_REQUIRED",
      "Start a sample return to continue.",
      401,
    );
  return unseal<Principal>("session", token);
}
function setSession(res: Response, p: Principal) {
  res.cookie("rr_session", seal("session", p), {
    httpOnly: true,
    secure: hosted,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 86400_000,
  });
}
function csrfToken(p: Principal) {
  return seal("csrf", { sid: p.sid, actor: p.actor, exp: p.exp });
}
function requireCsrf(req: Request, p: Principal) {
  const token = unseal<Principal>(
    "csrf",
    String(req.headers["x-rr-csrf"] ?? ""),
  );
  if (token.sid !== p.sid || token.actor !== p.actor)
    throw new DomainError(
      "CSRF_REJECTED",
      "Refresh this page before trying that action.",
      403,
    );
}
function access(p: Principal) {
  return seal("mcp-access", {
    ...p,
    exp: Math.min(p.exp, Date.now() + 15 * 60_000),
  });
}
function api(fn: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) =>
    void fn(req, res).catch(next);
}
app.get("/api/health", (_req, res) =>
  res.json({
    service: "return-relay",
    version: "0.1.0",
    transport: "Streamable HTTP",
    protocol_baseline: "2025-11-25",
    mode: "guided",
    data: "synthetic",
    storage: hosted ? "redis" : "sqlite",
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
  }),
);
app.all("/api/mcp", mcpHandler);
app.post(
  "/api/session",
  api(async (req, res) => {
    let p: Principal | undefined;
    try {
      p = principal(req);
      if (!(await getStore().get(p.sid))) p = undefined;
    } catch {}
    if (!p) {
      // New anonymous sessions are bounded independently of per-session traffic.
      const address = hosted
        ? String(req.headers["x-vercel-forwarded-for"] ?? req.ip)
        : String(req.ip);
      if (!(await getStore().hit("create:" + digest(address), 20, 3600)))
        throw new DomainError(
          "RATE_LIMIT",
          "Too many sample sessions were opened. Try again later.",
          429,
        );
      const sid = randomUUID();
      p = { sid, actor: "alex", exp: Date.now() + 7 * 86400_000 };
      await getStore().create(newHousehold(sid));
      setSession(res, p);
    }
    const pp = p;
    const mcp = await withMcp(origin, access(pp), (client) =>
      callTool(client, "orders_search", { query: "" }),
    );
    res.json({
      principal: { actor: pp.actor },
      csrf: csrfToken(pp),
      ...mcp,
      clock: demo.clock,
      mode: "guided",
      fixture: demo.fixture_version,
    });
  }),
);
app.post(
  "/api/role",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    const { actor } = z
      .object({ actor: z.enum(["alex", "maya"]) })
      .strict()
      .parse(req.body);
    await new RelayService(getStore()).household(p);
    const next = { ...p, actor };
    setSession(res, next);
    res.json({ actor, csrf: csrfToken(next) });
  }),
);
app.post(
  "/api/reset",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    await getStore().reset(p.sid);
    res.clearCookie("rr_session", { path: "/" });
    res.json({ reset: true });
  }),
);
app.post(
  "/api/mcp-access",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    await new RelayService(getStore()).household(p);
    res.json({
      token: access(p),
      expires_in_seconds: 900,
      note: "This capability is for your sample session only. Writes still need a separate UI approval.",
    });
  }),
);
app.get(
  "/api/case/:id",
  api(async (req, res) => {
    const p = principal(req);
    const result = await withMcp(origin, access(p), async (client) => {
      const c = await callTool<ReturnCase>(client, "return_case_get", {
        case_id: req.params.id,
      });
      const policy = await callTool(client, "return_policy_get", {
        order_id: c.order_id,
      });
      return { case: c, policy };
    });
    res.json(result);
  }),
);
app.post(
  "/api/preview",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    const args = schemas.return_plan_preview.parse(req.body);
    const result = await withMcp(origin, access(p), async (client) => {
      await callTool(client, "schedule_windows_get", {
        case_id: args.case_id,
        start: demo.clock.now,
        end: demo.trip.initial_departure,
      });
      return callTool<Preview>(client, "return_plan_preview", args);
    });
    res.json(result);
  }),
);
app.post(
  "/api/chat",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    const body = z
      .object({
        case_id: z.string().optional(),
        expected_revision: z.number().int().optional(),
        text: z.string().trim().min(1).max(500),
      })
      .strict()
      .parse(req.body);
    const text = body.text.toLowerCase();
    if (
      /ignore|override|refund|https?:|system prompt|mark.*complete/.test(text)
    )
      return res.json({
        message:
          "I can help plan a sample return. A message cannot approve a change, confirm a carrier receipt, or issue a refund.",
        trace: [],
      });
    let departure: string | undefined;
    if (/thursday.*morning|morning.*thursday/.test(text))
      departure = demo.trip.changed_departure;
    else if (/friday.*morning|morning.*friday/.test(text))
      departure = demo.trip.initial_departure;
    else if (
      /before friday|tomorrow|earlier|later|thursday|friday|leave|leaving/.test(
        text,
      )
    )
      return res.json({
        message:
          "What date and time will you leave? Choose a departure time below so I can check the whole errand.",
        needs_date: true,
        trace: [],
      });
    if (departure && body.case_id) {
      const result = await withMcp(origin, access(p), (client) =>
        callTool<Preview>(client, "return_plan_preview", {
          case_id: body.case_id!,
          expected_revision: body.expected_revision ?? 0,
          departure_at: departure,
        }),
      );
      return res.json({
        ...result,
        message: result.result.plan
          ? "The trip change needs a new drop-off time. Review the proposed change; your saved plan stays as it is until you approve."
          : result.result.reasons.join(" "),
        kind: "preview",
      });
    }
    if (/yes|save|approve|do it/.test(text))
      return res.json({
        message:
          "Use “Review & save” on the plan to approve the exact times shown.",
        trace: [],
      });
    const query = /headphone/.test(text)
      ? "headphones"
      : /adapter/.test(text)
        ? "adapter"
        : /bag/.test(text)
          ? "bag"
          : /return|order|item/.test(text)
            ? ""
            : body.text;
    const result = await withMcp(origin, access(p), (client) =>
      callTool<{ orders: unknown[] }>(client, "orders_search", { query }),
    );
    res.json({
      ...result,
      kind: "orders",
      message: result.result.orders.length
        ? "Choose the item you want to plan a return for."
        : "I could not find that in the sample orders. Try headphones, adapter, or bag.",
    });
  }),
);
interface Confirmation {
  sid: string;
  actor: Principal["actor"];
  tool: keyof typeof schemas;
  args: Arguments;
  exp: number;
  summary: string;
  nonce: string;
}
app.post(
  "/api/confirmation",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    const { tool, args } = z
      .object({ tool: z.string(), args: z.record(z.string(), z.unknown()) })
      .strict()
      .parse(req.body);
    if (!WRITE_TOOLS.has(tool))
      throw new DomainError(
        "INVALID_ACTION",
        "That action does not need a write confirmation.",
      );
    const parsed = schemas[tool as keyof typeof schemas].parse(
      args,
    ) as Arguments;
    const read = await withMcp(origin, access(p), (client) =>
      callTool<ReturnCase>(client, "return_case_get", {
        case_id: parsed.case_id,
      }),
    );
    const c = read.result;
    if (c.revision !== parsed.expected_revision)
      throw new DomainError(
        "STALE_REVISION",
        "Refresh this return before reviewing the change.",
        409,
      );
    let summary: string;
    if (tool === "return_plan_commit") {
      const prop = unseal<Proposal>("proposal", String(parsed.proposal_id));
      if (
        prop.sid !== p.sid ||
        prop.actor !== p.actor ||
        prop.case_id !== c.id ||
        prop.base_revision !== c.revision
      )
        throw new DomainError(
          "PROPOSAL_MISMATCH",
          "This proposal belongs to a different return.",
          403,
        );
      summary = `Save drop-off for ${label(prop.plan.dropoff_start)} and trip departure for ${label(prop.plan.departure_at)}.`;
    } else if (tool === "handoff_request")
      summary =
        "Ask sample member Maya to take this packed parcel. Her acceptance will remain pending.";
    else if (tool === "handoff_accept")
      summary = "Accept this handoff as Maya in the sample household.";
    else if (parsed.step === "PREPARED")
      summary = "Record that every item on the packing list is in the parcel.";
    else if (parsed.step === "DROPOFF_REPORTED")
      summary =
        "Record your statement that the parcel was dropped off. This is not a carrier receipt.";
    else
      summary =
        "Load the matching synthetic carrier receipt. Refund status will stay unknown.";
    const value: Confirmation = {
      sid: p.sid,
      actor: p.actor,
      tool: tool as keyof typeof schemas,
      args: parsed,
      exp: Date.now() + 5 * 60_000,
      summary,
      nonce: randomUUID(),
    };
    res.json({
      ticket: seal("confirmation", value),
      summary,
      trace: read.trace,
    });
  }),
);
app.post(
  "/api/confirm",
  api(async (req, res) => {
    const p = principal(req);
    requireCsrf(req, p);
    const { ticket } = z
      .object({ ticket: z.string().min(1).max(20000) })
      .strict()
      .parse(req.body);
    const c = unseal<Confirmation>("confirmation", ticket);
    if (c.sid !== p.sid || c.actor !== p.actor)
      throw new DomainError(
        "APPROVAL_MISMATCH",
        "This confirmation belongs to a different session or sample member.",
        403,
      );
    const approval = seal<Approval>("approval", {
      sid: p.sid,
      actor: p.actor,
      tool: c.tool,
      args_hash: digest(c.args),
      nonce: c.nonce,
      exp: c.exp,
    });
    const result = await withMcp(
      origin,
      access(p),
      (client) => callTool<ReturnCase>(client, c.tool, c.args),
      approval,
    );
    res.json(result);
  }),
);
app.get(
  "/api/receipt/:id",
  api(async (req, res) => {
    const p = principal(req);
    const result = await withMcp(origin, access(p), (client) =>
      callTool<ReturnCase>(client, "return_case_get", {
        case_id: req.params.id,
      }),
    );
    const c = result.result;
    if (c.progress !== "DROPOFF_REPORTED")
      throw new DomainError(
        "NOT_REPORTED",
        "Report the drop-off before loading the sample receipt.",
      );
    res.json({
      evidence_ref: `sample-carrier:${c.id}:${digest(c.plan).slice(0, 16)}`,
      source: "synthetic_carrier_event",
      trace: result.trace,
    });
  }),
);
if (existsSync(resolve("dist"))) {
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
}
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error =
    err instanceof DomainError
      ? err
      : err instanceof z.ZodError
        ? new DomainError(
            "INVALID_INPUT",
            "Some fields are missing or invalid. Check the request and try again.",
            400,
          )
        : new DomainError(
            "SERVICE_UNAVAILABLE",
            "The connection did not complete. Refresh the saved plan to check whether your change was recorded.",
            503,
          );
  res
    .status(error.status)
    .json({
      code: error.code,
      message: error.message,
      ...(err instanceof Error && "trace" in err ? { trace: err.trace } : {}),
    });
});
export default app;
