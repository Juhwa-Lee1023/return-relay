import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Redis } from "@upstash/redis";
import type { Household } from "../domain/types";
export interface Store {
  create(value: Household): Promise<boolean>;
  get(sid: string): Promise<Household | null>;
  replace(sid: string, version: number, value: Household): Promise<boolean>;
  reset(sid: string): Promise<void>;
  hit(key: string, limit: number, seconds: number): Promise<boolean>;
}
export class SqliteStore implements Store {
  db: DatabaseSync;
  constructor(
    path = resolve(process.env.RR_DATA_DIR ?? "data", "return-relay.sqlite"),
  ) {
    if (path !== ":memory:")
      mkdirSync(resolve(path, ".."), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS households(id TEXT PRIMARY KEY, version INTEGER NOT NULL, expires INTEGER NOT NULL, document TEXT NOT NULL); CREATE TABLE IF NOT EXISTS limits(k TEXT PRIMARY KEY, n INTEGER NOT NULL, expires INTEGER NOT NULL);",
    );
  }
  async create(value: Household) {
    return !!this.db
      .prepare("INSERT OR IGNORE INTO households VALUES (?,?,?,?)")
      .run(
        value.id,
        value.version,
        Date.parse(value.expires_at),
        JSON.stringify(value),
      ).changes;
  }
  async get(sid: string) {
    const r = this.db
      .prepare("SELECT document FROM households WHERE id=? AND expires>?")
      .get(sid, Date.now()) as { document: string } | undefined;
    return r ? (JSON.parse(r.document) as Household) : null;
  }
  async replace(sid: string, version: number, value: Household) {
    return !!this.db
      .prepare(
        "UPDATE households SET version=?, document=? WHERE id=? AND version=? AND expires>?",
      )
      .run(value.version, JSON.stringify(value), sid, version, Date.now())
      .changes;
  }
  async reset(sid: string) {
    this.db.prepare("DELETE FROM households WHERE id=?").run(sid);
  }
  async hit(key: string, limit: number, seconds: number) {
    const now = Date.now();
    const row = this.db
      .prepare(
        "INSERT INTO limits VALUES (?,1,?) ON CONFLICT(k) DO UPDATE SET n=CASE WHEN expires<=? THEN 1 ELSE n+1 END, expires=CASE WHEN expires<=? THEN ? ELSE expires END RETURNING n",
      )
      .get(key, now + seconds * 1000, now, now, now + seconds * 1000) as {
      n: number;
    };
    return row.n <= limit;
  }
}
export class RedisStore implements Store {
  constructor(
    private redis: Redis,
    private prefix = "return-relay:v1:",
  ) {}
  async create(value: Household) {
    return (
      (await this.redis.set(this.prefix + value.id, value, {
        nx: true,
        ex: 7 * 86400,
      })) === "OK"
    );
  }
  async get(sid: string) {
    return this.redis.get<Household>(this.prefix + sid);
  }
  async replace(sid: string, version: number, value: Household) {
    const n = await this.redis.eval<(string | number)[], number>(
      "local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end; local old=cjson.decode(raw); if old.version~=tonumber(ARGV[1]) then return 0 end; redis.call('SET',KEYS[1],ARGV[2],'KEEPTTL'); return 1",
      [this.prefix + sid],
      [version, JSON.stringify(value)],
    );
    return n === 1;
  }
  async reset(sid: string) {
    await this.redis.del(this.prefix + sid);
  }
  async hit(key: string, limit: number, seconds: number) {
    const n = await this.redis.eval<(string | number)[], number>(
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
      [this.prefix + "limit:" + key],
      [seconds],
    );
    return n <= limit;
  }
}
let store: Store;
export function getStore(): Store {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    token =
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token)
    return (store = new RedisStore(
      new Redis({ url, token, automaticDeserialization: true }),
    ));
  if (process.env.VERCEL)
    throw new Error(
      "Persistent Redis is required for hosted deployments; temporary disk is disabled.",
    );
  return (store = new SqliteStore());
}
