import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DomainError } from "../domain/types.js";
let cached: string;
function key(): string {
  if (cached) return cached;
  if (
    process.env.RR_SIGNING_SECRET &&
    process.env.RR_SIGNING_SECRET.length >= 32
  )
    return (cached = process.env.RR_SIGNING_SECRET);
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    throw new Error(
      "RR_SIGNING_SECRET must be configured for hosted production.",
    );
  const dir = resolve(process.env.RR_DATA_DIR ?? "data");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    return (cached = readFileSync(resolve(dir, ".signing-key"), "utf8"));
  } catch {
    cached = randomBytes(48).toString("hex");
    writeFileSync(resolve(dir, ".signing-key"), cached, { mode: 0o600 });
    return cached;
  }
}
export function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
export function seal<T>(purpose: string, value: T): string {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", key())
      .update(purpose + ":" + body)
      .digest("base64url")
  );
}
export function unseal<T extends { exp: number }>(
  purpose: string,
  token: string,
): T {
  if (!token || token.length > 18000)
    throw new DomainError(
      "INVALID_PROOF",
      "The confirmation could not be verified.",
      403,
    );
  const parts = token.split(".");
  if (parts.length !== 2)
    throw new DomainError(
      "INVALID_PROOF",
      "The confirmation could not be verified.",
      403,
    );
  const expected = createHmac("sha256", key())
      .update(purpose + ":" + parts[0])
      .digest(),
    actual = Buffer.from(parts[1], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(expected, actual))
    throw new DomainError(
      "INVALID_PROOF",
      "The confirmation could not be verified.",
      403,
    );
  let parsed: T;
  try {
    parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  } catch {
    throw new DomainError(
      "INVALID_PROOF",
      "The confirmation is unreadable.",
      403,
    );
  }
  if (!Number.isFinite(parsed.exp) || parsed.exp <= Date.now())
    throw new DomainError(
      "PROOF_EXPIRED",
      "This confirmation has expired. Review the current details again.",
      409,
    );
  return parsed;
}
