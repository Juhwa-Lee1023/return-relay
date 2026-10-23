import { DateTime } from "luxon";
import { demo, getPolicy } from "./fixtures.js";
import { DomainError, type Actor, type Plan } from "./types.js";
export const ZONE = demo.clock.timezone;
export function instant(value: string): DateTime {
  const d = DateTime.fromISO(value, { setZone: true });
  if (!d.isValid || !/(Z|[+-]\d{2}:\d{2})$/.test(value))
    throw new DomainError(
      "INVALID_TIME",
      "Use a complete date and time with a time-zone offset.",
    );
  return d;
}
export const utc = (value: string) => instant(value).toUTC().toISO()!;
export function label(value: string): string {
  return instant(value).setZone(ZONE).toFormat("ccc, LLL d · h:mm a");
}
export interface Constraints {
  now?: string;
  availability?: typeof demo.availability;
  locations?: typeof demo.locations;
  policy?: ReturnType<typeof getPolicy>;
}
export function findPlan(
  orderId: string,
  departureAt: string,
  actor: Actor = "alex",
  constraints: Constraints = {},
): { plan: Plan | null; code?: string; reasons: string[] } {
  const policy = constraints.policy ?? getPolicy(orderId),
    departure = instant(departureAt),
    now = instant(constraints.now ?? demo.clock.now);
  if (
    policy.basis !== "carrier_acceptance_by" ||
    !policy.deadline ||
    !policy.required_items?.length ||
    !policy.methods.includes("sample_dropoff")
  )
    return {
      plan: null,
      code: "POLICY_INCOMPLETE",
      reasons: [
        policy.basis === "received_by"
          ? "This policy requires delivery to the seller. A drop-off time alone cannot establish that."
          : "The return deadline or required method is missing. Add the seller’s instructions before making a plan.",
      ],
    };
  const deadline = instant(policy.deadline);
  if (deadline <= now)
    return {
      plan: null,
      code: "RETURN_WINDOW_EXPIRED",
      reasons: [
        "The sample return deadline has already passed. There is no automatic exception.",
      ],
    };
  const availability = (constraints.availability ?? demo.availability)[actor],
    locations = constraints.locations ?? demo.locations;
  const plans: Plan[] = [];
  for (const location of locations)
    for (const slot of availability)
      for (const opening of location.windows) {
        const begin = instant(slot.start).setZone(ZONE),
          end = instant(slot.end);
        // Fifteen-minute candidates; prefer the latest window that leaves time to prepare and return home.
        for (let home = begin; home < end; home = home.plus({ minutes: 15 })) {
          const prepare = home.minus({ minutes: 30 }),
            drop = home.plus({ minutes: location.travel_minutes }),
            done = drop.plus({ minutes: location.processing_minutes }),
            back = done.plus({ minutes: location.travel_minutes });
          if (
            prepare < now ||
            prepare < begin ||
            drop < instant(opening.start) ||
            done > instant(opening.end) ||
            back > end ||
            back > departure ||
            done > deadline
          )
            continue;
          plans.push({
            departure_at: departure.toUTC().toISO()!,
            home_departure: home.toUTC().toISO()!,
            dropoff_start: drop.toUTC().toISO()!,
            completion: done.toUTC().toISO()!,
            prepare_at: prepare.toUTC().toISO()!,
            actor_id: actor,
            location_id: location.id,
            timezone: ZONE,
            required_items: policy.required_items,
            policy_id: policy.id,
            deadline: deadline.toUTC().toISO()!,
            basis: policy.basis,
            travel_minutes: location.travel_minutes,
            processing_minutes: location.processing_minutes,
          });
        }
      }
  // Keep the demo’s preferred errand times, then rank feasible candidates by latest completion.
  const preferred = plans.filter(
    (p) =>
      [12, 17].includes(instant(p.home_departure).setZone(ZONE).hour) &&
      instant(p.home_departure).setZone(ZONE).minute === 0,
  );
  const chosen = (preferred.length ? preferred : plans).sort((a, b) =>
    b.completion.localeCompare(a.completion),
  )[0];
  return chosen
    ? {
        plan: chosen,
        reasons: [
          "Fits the sample calendar and drop-point opening hours.",
          "Includes 30 minutes to pack, 15 minutes each way, and 20 minutes at the counter.",
          "Completes before both the trip departure and the carrier-acceptance deadline.",
        ],
      }
    : {
        plan: null,
        code: "NO_FEASIBLE_SLOT",
        reasons: [
          "No available slot leaves enough time to pack, travel, and finish before departure. Try a later departure or choose another household member.",
        ],
      };
}
export function assertPlanStillValid(plan: Plan, orderId: string): void {
  const r = findPlan(orderId, plan.departure_at, plan.actor_id);
  if (!r.plan || JSON.stringify(r.plan) !== JSON.stringify(plan))
    throw new DomainError(
      "PLAN_NO_LONGER_VALID",
      "The plan changed. Review the new times before saving.",
    );
}
export function canActorTakePlan(actor: Actor, plan: Plan): boolean {
  return demo.availability[actor].some(
    (w) =>
      instant(w.start) <= instant(plan.home_departure) &&
      instant(w.end) >=
        instant(plan.completion).plus({ minutes: plan.travel_minutes }),
  );
}
