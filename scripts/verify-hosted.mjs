// Two synthetic sessions; never reads shared-store keys or prints credentials.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const base = process.env.RR_TEST_URL;
if (!base) throw new Error('Set RR_TEST_URL to your authorized test deployment.');
const report = { started_at: new Date().toISOString(), base, checks: [], requests: [] };
const pass = (name, details = {}) => report.checks.push({ name, status: 'PASS', ...details });
async function http(path, body, who, headers = {}) {
  const started = performance.now();
  const r = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(who ? { cookie: who.cookie, 'x-rr-csrf': who.csrf } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  const data = await r.json();
  report.requests.push({ path: path.replace(/\/api\/case\/.+/, '/api/case/[id]'), status: r.status, ms: Math.round(performance.now() - started) });
  return { r, data };
}
async function session() {
  const { r, data } = await http('/api/session', {});
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict']) assert.ok(cookie.includes(flag));
  return { cookie: cookie.split(';')[0], csrf: data.csrf, id: data.result.orders[0].case_id };
}
async function saved(who) {
  const {r,data} = await http('/api/case/' + who.id, undefined, who);
  assert.equal(r.status, 200); return data.result.case;
}
try {
  const {r, data} = await http('/api/health');
  assert.equal(r.status, 200); assert.equal(data.storage, 'redis'); report.build = data.build;
  const a = await session(), b = await session();
  pass('Two anonymous sessions use secure cookies');
  assert.notEqual(a.id, b.id);
  assert.equal((await http('/api/case/' + a.id, undefined, b)).r.status, 404);
  pass('Another session cannot read the first case');
  assert.equal((await http('/api/session', {}, undefined, {origin:'https://untrusted.example'})).r.status, 403);
  assert.equal((await http('/api/role', {actor:'maya'}, a, {'x-rr-csrf':''})).r.status, 403);
  assert.equal((await http('/api/mcp', {jsonrpc:'2.0',id:1,method:'tools/list'})).r.status, 401);
  pass('Origin, CSRF, and unauthenticated MCP checks reject requests');
  const access = await http('/api/mcp-access', {}, a);
  const client = new Client({name:'return-relay-hosted-verifier',version:'1'});
  let protocol;
  const transport = new StreamableHTTPClientTransport(new URL(base + '/api/mcp'), {
    requestInit:{headers:{Authorization:`Bearer ${access.data.token}`}},
    fetch: async (input, init) => {
      const r = await fetch(input, {...init, signal:AbortSignal.timeout(30_000)});
      try { const d=await r.clone().json(); if(d.result?.protocolVersion)protocol=d.result.protocolVersion; } catch {}
      return r;
    },
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.equal(protocol,'2025-11-25'); assert.equal(tools.tools.length,9);
    const refused = await client.callTool({name:'return_plan_commit',arguments:{case_id:a.id,proposal_id:'forged',expected_revision:0,idempotency_key:randomUUID()}});
    assert.equal(refused.isError,true); assert.match(JSON.stringify(refused.content),/APPROVAL_REQUIRED/);
    pass('Official MCP client negotiates protocol, lists nine tools, and cannot write without approval', {protocol, tools:9});
  } finally { await client.close(); }
  const preview = await http('/api/preview', {case_id:a.id,expected_revision:0,departure_at:'2026-11-06T08:00:00-08:00'}, a);
  assert.equal(preview.r.status,200); assert.equal((await saved(a)).revision,0);
  pass('Preview leaves saved revision unchanged');
  const args={case_id:a.id,expected_revision:0,proposal_id:preview.data.result.proposal_id,idempotency_key:randomUUID()};
  const confirmation=await http('/api/confirmation',{tool:'return_plan_commit',args},a);
  assert.equal(confirmation.r.status,200);
  const ticket=confirmation.data.ticket;
  assert.equal((await http('/api/confirm',{ticket},b)).r.status,403);
  pass('Another session cannot use the issued confirmation');
  assert.equal((await http('/api/confirm',{ticket},a)).r.status,200);
  assert.equal((await http('/api/confirm',{ticket},a)).r.status,200);
  const stored=await saved(a);
  assert.equal(stored.revision,1); assert.equal(stored.events.length,1);
  pass('Approved save and repeated confirmation produce one revision and one event');
  assert.equal((await http('/api/session',{},a)).r.status,200);
  assert.equal((await saved(a)).revision,1);
  pass('Session restoration retains the saved record');
  assert.equal((await http('/api/reset',{},b)).r.status,200);
  assert.equal((await saved(a)).revision,1);
  pass('Resetting the second household preserves the first');
  report.status='PASS';
} catch(e) {
  report.status='FAIL'; report.failure={name:e.name,message:e.message}; process.exitCode=1;
} finally {
  report.completed_at=new Date().toISOString();
  if(process.argv[2]) await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
