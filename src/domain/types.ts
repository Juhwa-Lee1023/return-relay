export type Actor = "alex" | "maya";
export type Progress =
  | "DRAFT"
  | "PLAN_CONFIRMED"
  | "PREPARED"
  | "HANDOFF_REQUESTED"
  | "HANDOFF_ACCEPTED"
  | "DROPOFF_REPORTED"
  | "DROPOFF_CONFIRMED_DEMO";
export interface Plan {
  departure_at: string;
  home_departure: string;
  dropoff_start: string;
  completion: string;
  prepare_at: string;
  actor_id: Actor;
  location_id: string;
  timezone: string;
  required_items: string[];
  policy_id: string;
  deadline: string;
  basis: string;
  travel_minutes: number;
  processing_minutes: number;
}
export interface AuditEvent {
  id: string;
  kind: string;
  actor: Actor;
  recorded_at: string;
  revision: number;
  summary: string;
  evidence_level: "user_action" | "synthetic_receipt";
}
export interface Handoff {
  id: string;
  actor_id: Actor;
  status: "REQUESTED" | "ACCEPTED";
  plan_hash: string;
}
export interface ReturnCase {
  id: string;
  order_id: string;
  revision: number;
  progress: Progress;
  plan: Plan | null;
  prepared: boolean;
  handoff: Handoff | null;
  refund: { status: "UNKNOWN" };
  events: AuditEvent[];
}
export interface Household {
  id: string;
  version: number;
  created_at: string;
  expires_at: string;
  cases: ReturnCase[];
  operations: Record<string, { digest: string; result: ReturnCase }>;
}
export interface Principal {
  sid: string;
  actor: Actor;
  exp: number;
}
export interface Proposal {
  kind: "proposal";
  sid: string;
  actor: Actor;
  case_id: string;
  base_revision: number;
  plan: Plan;
  hash: string;
  exp: number;
}
export interface Preview {
  proposal_id: string | null;
  proposal_hash: string | null;
  plan: Plan | null;
  previous_plan: Plan | null;
  changes: { label: string; before: string; after: string }[];
  conflicts: string[];
  reasons: string[];
  code?: string;
  base_revision: number;
  expires_at?: string;
}
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}
