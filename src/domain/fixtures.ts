import fixture from "../../fixtures/demo_household.json" with { type: "json" };
import { DomainError, type Household } from "./types.js";
import { randomUUID } from "node:crypto";
export const demo = fixture;
export function getOrder(id: string) {
  const item = demo.orders.find((o) => o.id === id);
  if (!item)
    throw new DomainError(
      "ORDER_NOT_FOUND",
      "That item is not in this sample household.",
      404,
    );
  return item;
}
export function getPolicy(id: string) {
  const order = getOrder(id);
  return demo.policies.find((p) => p.id === order.policy_id)!;
}
export function newHousehold(id: string): Household {
  return {
    id,
    version: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
    cases: demo.orders.map((o) => ({
      id: randomUUID(),
      order_id: o.id,
      revision: 0,
      progress: "DRAFT",
      plan: null,
      prepared: false,
      handoff: null,
      refund: { status: "UNKNOWN" },
      events: [],
    })),
    operations: {},
  };
}
