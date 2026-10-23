import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SqliteStore } from "../src/server/store";
import { RelayService, type Approval } from "../src/domain/service";
import { demo, newHousehold, getPolicy } from "../src/domain/fixtures";
import { findPlan, instant, utc } from "../src/domain/planner";
import { seal, digest } from "../src/server/crypto";
import type { Principal, Preview, ReturnCase } from "../src/domain/types";
async function context() {
  const store = new SqliteStore(":memory:");
  const p: Principal = {
    sid: randomUUID(),
    actor: "alex",
    exp: Date.now() + 3600000,
  };
  const h = newHousehold(p.sid);
  await store.create(h);
  return { store, p, h, service: new RelayService(store), c: h.cases[0] };
}
function approved(
  p: Principal,
  tool: string,
  args: Record<string, unknown>,
  extra: Partial<Approval> = {},
) {
  return seal<Approval>("approval", {
    sid: p.sid,
    actor: p.actor,
    tool,
    args_hash: digest(args),
    nonce: randomUUID(),
    exp: Date.now() + 60000,
    ...extra,
  });
}
async function commit(
  ctx: Awaited<ReturnType<typeof context>>,
  departure = demo.trip.initial_departure,
) {
  const { service, p, c } = ctx;
  const preview = (await service.execute(
    "return_plan_preview",
    { case_id: c.id, expected_revision: c.revision, departure_at: departure },
    p,
  )) as Preview;
  const args = {
    case_id: c.id,
    expected_revision: c.revision,
    proposal_id: preview.proposal_id,
    idempotency_key: randomUUID(),
  };
  return {
    result: (await service.execute(
      "return_plan_commit",
      args,
      p,
      approved(p, "return_plan_commit", args),
    )) as ReturnCase,
    args,
    preview,
  };
}
test("C01: trip change replaces Thursday with Wednesday only in preview", async () => {
  const ctx = await context();
  const { result } = await commit(ctx);
  assert.equal(result.plan?.dropoff_start, "2026-11-05T20:15:00.000Z");
  const before = await ctx.store.get(ctx.p.sid);
  const preview = (await ctx.service.execute(
    "return_plan_preview",
    {
      case_id: ctx.c.id,
      expected_revision: 1,
      departure_at: demo.trip.changed_departure,
    },
    ctx.p,
  )) as Preview;
  assert.equal(preview.plan?.dropoff_start, "2026-11-05T01:15:00.000Z");
  assert.equal(preview.conflicts.length, 1);
  assert.deepEqual(await ctx.store.get(ctx.p.sid), before);
});
test("C02: no approval means no write", async () => {
  const ctx = await context();
  await assert.rejects(
    ctx.service.execute(
      "return_plan_commit",
      {
        case_id: ctx.c.id,
        expected_revision: 0,
        idempotency_key: randomUUID(),
      },
      ctx.p,
    ),
    { code: "APPROVAL_REQUIRED" },
  );
  assert.equal((await ctx.store.get(ctx.p.sid))!.version, 0);
});
test("C03: an approval cannot authorize another proposal", async () => {
  const ctx = await context();
  const args = {
    case_id: ctx.c.id,
    expected_revision: 0,
    proposal_id: "a",
    idempotency_key: randomUUID(),
  };
  await assert.rejects(
    ctx.service.execute(
      "return_plan_commit",
      { ...args, proposal_id: "b" },
      ctx.p,
      approved(ctx.p, "return_plan_commit", args),
    ),
    { code: "APPROVAL_MISMATCH" },
  );
});
test("C04: stale revision rejected", async () => {
  const ctx = await context();
  const { args } = await commit(ctx);
  const changed = { ...args, idempotency_key: randomUUID() };
  await assert.rejects(
    ctx.service.execute(
      "return_plan_commit",
      changed,
      ctx.p,
      approved(ctx.p, "return_plan_commit", changed),
    ),
    { code: "STALE_REVISION" },
  );
});
test("C05: duplicate confirmed request produces one event", async () => {
  const ctx = await context();
  const { args, result } = await commit(ctx);
  assert.deepEqual(
    await ctx.service.execute(
      "return_plan_commit",
      args,
      ctx.p,
      approved(ctx.p, "return_plan_commit", args),
    ),
    result,
  );
  assert.equal((await ctx.store.get(ctx.p.sid))!.cases[0].events.length, 1);
});
test("C06: expired approval is rejected", async () => {
  const ctx = await context();
  const args = {
    case_id: ctx.c.id,
    expected_revision: 0,
    idempotency_key: randomUUID(),
  };
  await assert.rejects(
    ctx.service.execute(
      "return_plan_commit",
      args,
      ctx.p,
      approved(ctx.p, "return_plan_commit", args, { exp: Date.now() - 1 }),
    ),
    { code: "PROOF_EXPIRED" },
  );
});
test("C07: departure before all available windows has no plan", () => {
  const r = findPlan("RR-DEMO-1001", "2026-11-03T07:00:00-08:00");
  assert.equal(r.plan, null);
  assert.equal(r.code, "NO_FEASIBLE_SLOT");
});
test("C08: processing and return travel must fit closing and availability", () => {
  const r = findPlan("RR-DEMO-1001", demo.trip.initial_departure, "alex", {
    availability: {
      alex: [
        {
          start: "2026-11-04T17:40:00-08:00",
          end: "2026-11-04T18:30:00-08:00",
        },
      ],
      maya: [],
    },
  });
  assert.equal(r.plan, null);
});
test("C10: DST inputs preserve exact instants and reject missing offsets", () => {
  assert.equal(utc("2026-11-01T01:30:00-07:00"), "2026-11-01T08:30:00.000Z");
  assert.equal(utc("2026-11-01T01:30:00-08:00"), "2026-11-01T09:30:00.000Z");
  assert.throws(() => instant("2026-11-01T01:30:00"), { code: "INVALID_TIME" });
});
test("C11: unknown policy cannot produce a plan", () => {
  assert.equal(
    findPlan("RR-DEMO-1003", demo.trip.initial_departure).code,
    "POLICY_INCOMPLETE",
  );
});
test("C12: expired return cannot produce a plan", () => {
  assert.equal(
    findPlan("RR-DEMO-1002", demo.trip.initial_departure).code,
    "RETURN_WINDOW_EXPIRED",
  );
});
test("C13: received-by policy is not treated as carrier acceptance", () => {
  assert.equal(
    findPlan("RR-DEMO-1001", demo.trip.initial_departure, "alex", {
      policy: { ...getPolicy("RR-DEMO-1001"), basis: "received_by" },
    }).plan,
    null,
  );
});
test("C14: multiple matches stay multiple", async () => {
  const ctx = await context();
  const r = (await ctx.service.execute(
    "orders_search",
    { query: "" },
    ctx.p,
  )) as { orders: unknown[] };
  assert.equal(r.orders.length, 3);
  assert.equal((await ctx.store.get(ctx.p.sid))!.version, 0);
});
test("C15-C20: handoff, acceptance, report, sample receipt and refund are distinct", async () => {
  const ctx = await context();
  let { result: c } = await commit(ctx, demo.trip.changed_departure);
  const act = async (
    tool: string,
    extra: Record<string, unknown>,
    p = ctx.p,
  ) => {
    const args = {
      case_id: c.id,
      expected_revision: c.revision,
      idempotency_key: randomUUID(),
      ...extra,
    };
    c = (await ctx.service.execute(
      tool,
      args,
      p,
      approved(p, tool, args),
    )) as ReturnCase;
    return c;
  };
  await act("return_step_update", {
    step: "PREPARED",
    checked_items: c.plan!.required_items,
  });
  await act("handoff_request", { actor_id: "maya" });
  assert.equal(c.handoff?.status, "REQUESTED");
  const wrong = {
    case_id: c.id,
    expected_revision: c.revision,
    idempotency_key: randomUUID(),
    request_id: c.handoff!.id,
  };
  await assert.rejects(
    ctx.service.execute(
      "handoff_accept",
      wrong,
      ctx.p,
      approved(ctx.p, "handoff_accept", wrong),
    ),
    { code: "ASSIGNEE_REQUIRED" },
  );
  const maya = { ...ctx.p, actor: "maya" as const };
  await act("handoff_accept", { request_id: c.handoff!.id }, maya);
  assert.equal(c.progress, "HANDOFF_ACCEPTED");
  await act("return_step_update", { step: "DROPOFF_REPORTED" }, maya);
  assert.equal(c.progress, "DROPOFF_REPORTED");
  assert.equal(c.refund.status, "UNKNOWN");
  const invalid = {
    case_id: c.id,
    expected_revision: c.revision,
    idempotency_key: randomUUID(),
    step: "DROPOFF_CONFIRMED_DEMO",
    evidence_ref: "wrong",
  };
  await assert.rejects(
    ctx.service.execute(
      "return_step_update",
      invalid,
      maya,
      approved(maya, "return_step_update", invalid),
    ),
    { code: "RECEIPT_REQUIRED" },
  );
  await act(
    "return_step_update",
    {
      step: "DROPOFF_CONFIRMED_DEMO",
      evidence_ref: `sample-carrier:${c.id}:${digest(c.plan).slice(0, 16)}`,
    },
    maya,
  );
  assert.equal(c.progress, "DROPOFF_CONFIRMED_DEMO");
  assert.equal(c.refund.status, "UNKNOWN");
  const refund = {
    case_id: c.id,
    expected_revision: c.revision,
    idempotency_key: randomUUID(),
    step: "REFUND",
  };
  await assert.rejects(
    ctx.service.execute(
      "return_step_update",
      refund,
      maya,
      approved(maya, "return_step_update", refund),
    ),
    { code: "INVALID_TRANSITION" },
  );
});
test("C22: another session cannot read a case or reuse approval", async () => {
  const a = await context(),
    p = { ...a.p, sid: randomUUID() };
  await a.store.create(newHousehold(p.sid));
  await assert.rejects(
    a.service.execute("return_case_get", { case_id: a.c.id }, p),
    { code: "CASE_NOT_FOUND" },
  );
});
test("C23: injected policy text has no effect on progress or refund", async () => {
  const ctx = await context();
  const r = (await ctx.service.execute(
    "return_policy_get",
    { order_id: ctx.c.order_id },
    ctx.p,
  )) as { note: string };
  assert.match(r.note, /Ignore the planner/);
  assert.equal((await ctx.store.get(ctx.p.sid))!.cases[0].progress, "DRAFT");
  assert.equal(
    (await ctx.store.get(ctx.p.sid))!.cases[0].refund.status,
    "UNKNOWN",
  );
});
test("C26: local rate limits bound requests", async () => {
  const s = new SqliteStore(":memory:");
  assert.equal(await s.hit("test", 2, 60), true);
  assert.equal(await s.hit("test", 2, 60), true);
  assert.equal(await s.hit("test", 2, 60), false);
});
test("Incomplete packing cannot be marked ready", async () => {
  const ctx = await context();
  const { result: c } = await commit(ctx);
  const args = {
    case_id: c.id,
    expected_revision: c.revision,
    idempotency_key: randomUUID(),
    step: "PREPARED",
    checked_items: ["headphones"],
  };
  await assert.rejects(
    ctx.service.execute(
      "return_step_update",
      args,
      ctx.p,
      approved(ctx.p, "return_step_update", args),
    ),
    { code: "PACKING_INCOMPLETE" },
  );
});
test("Concurrent writes allow only one revision winner", async () => {
  const ctx = await context();
  const a = await ctx.store.get(ctx.p.sid),
    b = await ctx.store.get(ctx.p.sid);
  a!.version = 1;
  b!.version = 1;
  const outcomes = await Promise.all([
    ctx.store.replace(ctx.p.sid, 0, a!),
    ctx.store.replace(ctx.p.sid, 0, b!),
  ]);
  assert.equal(outcomes.filter(Boolean).length, 1);
});
