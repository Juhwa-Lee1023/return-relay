import { randomUUID } from "node:crypto";
import { demo, getOrder, getPolicy } from "./fixtures";
import {
  assertPlanStillValid,
  canActorTakePlan,
  findPlan,
  instant,
  label,
} from "./planner";
import {
  DomainError,
  type Actor,
  type Household,
  type Principal,
  type Proposal,
  type Preview,
  type ReturnCase,
} from "./types";
import { digest, seal, unseal } from "../server/crypto";
import type { Store } from "../server/store";
export type Arguments = Record<string, unknown>;
export interface Approval {
  sid: string;
  actor: Actor;
  tool: string;
  args_hash: string;
  nonce: string;
  exp: number;
}
export const WRITE_TOOLS = new Set([
  "return_plan_commit",
  "handoff_request",
  "handoff_accept",
  "return_step_update",
]);
export class RelayService {
  constructor(readonly store: Store) {}
  async household(principal: Principal): Promise<Household> {
    const h = await this.store.get(principal.sid);
    if (!h)
      throw new DomainError(
        "SESSION_EXPIRED",
        "This sample session has expired. Start a new example.",
        401,
      );
    return h;
  }
  case(h: Household, id: unknown): ReturnCase {
    const c = h.cases.find((x) => x.id === id);
    if (!c)
      throw new DomainError(
        "CASE_NOT_FOUND",
        "That return is not part of your sample session.",
        404,
      );
    return c;
  }
  async execute(
    tool: string,
    args: Arguments,
    p: Principal,
    approval?: string,
  ): Promise<unknown> {
    const h = await this.household(p);
    if (tool === "orders_search") {
      const query = String(args.query).toLowerCase().trim();
      return {
        orders: demo.orders
          .filter((o) => (o.title + " " + o.id).toLowerCase().includes(query))
          .map((o) => ({
            ...o,
            case_id: h.cases.find((c) => c.order_id === o.id)!.id,
          })),
        source: "synthetic_fixture",
        fixture_version: demo.fixture_version,
      };
    }
    if (tool === "return_policy_get")
      return {
        ...getPolicy(String(args.order_id)),
        fixture_version: demo.fixture_version,
        note: demo.injection_fixture.text,
      };
    const c = this.case(h, args.case_id);
    if (tool === "return_case_get") return c;
    if (tool === "schedule_windows_get") {
      const start = instant(String(args.start)),
        end = instant(String(args.end));
      if (end <= start)
        throw new DomainError(
          "INVALID_RANGE",
          "End time must be after start time.",
        );
      return {
        availability: demo.availability,
        locations: demo.locations,
        trip_departure: c.plan?.departure_at ?? demo.trip.initial_departure,
        source: "synthetic_fixture",
        timezone: demo.clock.timezone,
      };
    }
    if (tool === "return_plan_preview") return this.preview(c, p, args);
    if (!WRITE_TOOLS.has(tool))
      throw new DomainError(
        "UNKNOWN_TOOL",
        "This operation is not available.",
        404,
      );
    if (!approval)
      throw new DomainError(
        "APPROVAL_REQUIRED",
        "Review and approve the exact change before saving.",
        403,
      );
    const a = unseal<Approval>("approval", approval),
      hash = digest(args);
    if (
      a.sid !== p.sid ||
      a.actor !== p.actor ||
      a.tool !== tool ||
      a.args_hash !== hash
    )
      throw new DomainError(
        "APPROVAL_MISMATCH",
        "This approval belongs to a different change.",
        403,
      );
    const key = String(args.idempotency_key),
      operationDigest = digest({ tool, args, actor: p.actor });
    if (h.operations[key]) {
      if (h.operations[key].digest !== operationDigest)
        throw new DomainError(
          "IDEMPOTENCY_CONFLICT",
          "That request identifier was already used for another change.",
          409,
        );
      return h.operations[key].result;
    }
    if (c.revision !== args.expected_revision)
      throw new DomainError(
        "STALE_REVISION",
        "This return changed in another view. Refresh it and review the new details.",
        409,
      );
    const next = structuredClone(c);
    let summary = "";
    let evidence: "user_action" | "synthetic_receipt" = "user_action";
    if (tool === "return_plan_commit") {
      if (p.actor !== "alex")
        throw new DomainError(
          "OWNER_REQUIRED",
          "Switch to Alex to change the return plan.",
          403,
        );
      if (["DROPOFF_REPORTED", "DROPOFF_CONFIRMED_DEMO"].includes(c.progress))
        throw new DomainError(
          "RETURN_ALREADY_HANDED_OVER",
          "This parcel has already been reported as handed over. Its history cannot be rescheduled.",
        );
      const proposal = unseal<Proposal>("proposal", String(args.proposal_id));
      if (
        proposal.sid !== p.sid ||
        proposal.actor !== p.actor ||
        proposal.case_id !== c.id ||
        proposal.base_revision !== c.revision ||
        proposal.hash !== digest(proposal.plan)
      )
        throw new DomainError(
          "PROPOSAL_MISMATCH",
          "The proposed plan does not match this return and revision.",
          409,
        );
      assertPlanStillValid(proposal.plan, c.order_id);
      next.plan = proposal.plan;
      next.handoff = null;
      next.progress = c.prepared ? "PREPARED" : "PLAN_CONFIRMED";
      summary = `${c.plan ? "Updated" : "Saved"} drop-off for ${label(proposal.plan.dropoff_start)}. Trip: ${label(proposal.plan.departure_at)}.`;
    } else if (tool === "handoff_request") {
      if (p.actor !== "alex")
        throw new DomainError(
          "OWNER_REQUIRED",
          "Only Alex can request help with this return.",
          403,
        );
      if (!c.plan || !c.prepared || c.progress !== "PREPARED")
        throw new DomainError(
          "PACK_FIRST",
          "Pack all required items before asking someone to take the parcel.",
        );
      if (args.actor_id !== "maya" || !canActorTakePlan("maya", c.plan))
        throw new DomainError(
          "ASSIGNEE_UNAVAILABLE",
          "Maya is not available for this drop-off. Choose a time that fits her calendar.",
        );
      next.handoff = {
        id: randomUUID(),
        actor_id: "maya",
        status: "REQUESTED",
        plan_hash: digest(c.plan),
      };
      next.progress = "HANDOFF_REQUESTED";
      summary =
        "Asked sample household member Maya to take the parcel. Awaiting her response.";
    } else if (tool === "handoff_accept") {
      if (
        !c.handoff ||
        c.handoff.id !== args.request_id ||
        c.handoff.actor_id !== p.actor
      )
        throw new DomainError(
          "ASSIGNEE_REQUIRED",
          "Only the requested sample household member can accept this handoff.",
          403,
        );
      if (
        c.progress !== "HANDOFF_REQUESTED" ||
        c.handoff.status !== "REQUESTED" ||
        !c.plan ||
        c.handoff.plan_hash !== digest(c.plan)
      )
        throw new DomainError(
          "HANDOFF_CHANGED",
          "This request is no longer awaiting acceptance.",
          409,
        );
      next.handoff = { ...c.handoff, status: "ACCEPTED" };
      next.progress = "HANDOFF_ACCEPTED";
      summary = "Maya accepted in the labelled sample-member view.";
    } else {
      const step = String(args.step);
      if (step === "PREPARED") {
        if (p.actor !== "alex" || !c.plan || c.progress !== "PLAN_CONFIRMED")
          throw new DomainError(
            "PLAN_REQUIRED",
            "Alex needs to confirm a plan before marking this parcel packed.",
          );
        const checked = args.checked_items as string[] | undefined;
        if (
          !checked ||
          c.plan.required_items.some((x) => !checked.includes(x)) ||
          checked.some((x) => !c.plan!.required_items.includes(x))
        )
          throw new DomainError(
            "PACKING_INCOMPLETE",
            "Check every required item before marking the parcel packed.",
          );
        next.prepared = true;
        next.progress = "PREPARED";
        summary =
          "Alex checked every required item and marked the parcel packed.";
      } else if (step === "DROPOFF_REPORTED") {
        const direct =
          c.progress === "PREPARED" && !c.handoff && p.actor === "alex";
        const delegated =
          c.progress === "HANDOFF_ACCEPTED" && c.handoff?.actor_id === p.actor;
        if (!direct && !delegated)
          throw new DomainError(
            "HANDOFF_NOT_READY",
            "The person taking the parcel must confirm the handoff first.",
          );
        next.progress = "DROPOFF_REPORTED";
        summary = `${p.actor === "alex" ? "Alex" : "Maya"} reported the drop-off. A carrier receipt is still needed.`;
      } else if (step === "DROPOFF_CONFIRMED_DEMO") {
        if (
          c.progress !== "DROPOFF_REPORTED" ||
          args.evidence_ref !==
            `sample-carrier:${c.id}:${digest(c.plan).slice(0, 16)}`
        )
          throw new DomainError(
            "RECEIPT_REQUIRED",
            "A matching sample carrier receipt is required.",
          );
        next.progress = "DROPOFF_CONFIRMED_DEMO";
        summary =
          "A matching synthetic carrier receipt confirmed the sample drop-off. Refund status stays unknown.";
        evidence = "synthetic_receipt";
      } else
        throw new DomainError(
          "INVALID_TRANSITION",
          "This tool cannot set that status or issue a refund.",
        );
    }
    next.revision++;
    next.events.push({
      id: randomUUID(),
      kind: tool,
      actor: p.actor,
      recorded_at: new Date().toISOString(),
      revision: next.revision,
      summary,
      evidence_level: evidence,
    });
    const updated = structuredClone(h);
    updated.version++;
    updated.cases = updated.cases.map((x) => (x.id === next.id ? next : x));
    updated.operations[key] = { digest: operationDigest, result: next };
    if (Object.keys(updated.operations).length > 100)
      throw new DomainError(
        "SESSION_LIMIT",
        "This sample session has reached its write limit. Start a new example.",
        429,
      );
    if (!(await this.store.replace(h.id, h.version, updated)))
      throw new DomainError(
        "STALE_REVISION",
        "Another change was saved first. Refresh before trying again.",
        409,
      );
    return next;
  }
  preview(c: ReturnCase, p: Principal, args: Arguments): Preview {
    if (c.revision !== args.expected_revision)
      throw new DomainError(
        "STALE_REVISION",
        "Refresh this return before asking for another plan.",
        409,
      );
    if (["DROPOFF_REPORTED", "DROPOFF_CONFIRMED_DEMO"].includes(c.progress))
      throw new DomainError(
        "RETURN_ALREADY_HANDED_OVER",
        "A completed handoff cannot be rescheduled.",
      );
    const actor = (args.preferred_actor_id ?? "alex") as Actor;
    if (!["alex", "maya"].includes(actor))
      throw new DomainError(
        "UNKNOWN_ACTOR",
        "Choose Alex or the sample household member Maya.",
      );
    const result = findPlan(c.order_id, String(args.departure_at), actor),
      conflicts: string[] = [];
    if (
      c.plan &&
      instant(c.plan.completion).plus({ minutes: c.plan.travel_minutes }) >
        instant(String(args.departure_at))
    )
      conflicts.push(
        `Your saved drop-off is ${label(c.plan.dropoff_start)}, after you need to leave. It no longer fits the trip.`,
      );
    const out: Preview = {
      proposal_id: null,
      proposal_hash: null,
      plan: result.plan,
      previous_plan: c.plan,
      changes: [],
      conflicts,
      reasons: result.reasons,
      code: result.code,
      base_revision: c.revision,
    };
    if (!result.plan) return out;
    const exp = Date.now() + 10 * 60_000,
      hash = digest(result.plan);
    out.proposal_id = seal<Proposal>("proposal", {
      kind: "proposal",
      sid: p.sid,
      actor: p.actor,
      case_id: c.id,
      base_revision: c.revision,
      plan: result.plan,
      hash,
      exp,
    });
    out.proposal_hash = hash;
    out.expires_at = new Date(exp).toISOString();
    for (const [key, name] of [
      ["departure_at", "Trip departure"],
      ["prepare_at", "Pack the parcel"],
      ["dropoff_start", "Drop off"],
      ["completion", "Finish at the counter"],
    ] as const)
      if (c.plan?.[key] !== result.plan[key])
        out.changes.push({
          label: name,
          before: c.plan ? label(c.plan[key]) : "Not scheduled",
          after: label(result.plan[key]),
        });
    if (c.handoff)
      out.reasons.push(
        "The old help request will be closed. Maya will need to accept the new time.",
      );
    return out;
  }
}
