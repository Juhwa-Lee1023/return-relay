import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const cwd=resolve(process.env.RR_RESTART_CHECKOUT??'.');
const data=resolve(process.env.RR_RESTART_DATA??'.private/restart-check');
const output=resolve(process.env.RR_RESTART_REPORT??'test-results/restart.json');
const origin='http://127.0.0.1:4342';
const env={...process.env,PORT:'4342',RR_PUBLIC_ORIGIN:origin,RR_DATA_DIR:data};
let child, cookie='', csrf='';
const logs=[],steps=[];
async function start(){
  child=spawn(process.execPath,['--import','tsx','src/server.ts'],{cwd,env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>logs.push(b.toString())); child.stderr.on('data',b=>logs.push(b.toString()));
  for(let i=0;i<50;i++){
    if(child.exitCode!==null)throw Error('Server exited before readiness');
    try{if((await fetch(origin+'/api/health')).ok)return;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Server did not become ready');
}
async function stop(){if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}}
async function http(path,body){
  const r=await fetch(origin+'/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{cookie}:{}),...(csrf?{'x-rr-csrf':csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  const result=await r.json();assert.equal(r.status,200,JSON.stringify(result));return result;
}
let result='FAIL',error;
try{
  await start();steps.push('Started built app from selected checkout');
  const session=await http('/session',{});csrf=session.csrf;
  const id=session.result.orders[0].case_id;
  const preview=await http('/preview',{case_id:id,expected_revision:0,departure_at:'2026-11-05T07:00:00-08:00'});
  const proof=await http('/confirmation',{tool:'return_plan_commit',args:{case_id:id,expected_revision:0,proposal_id:preview.result.proposal_id,idempotency_key:randomUUID()}});
  const saved=await http('/confirm',{ticket:proof.ticket});assert.equal(saved.result.revision,1);
  steps.push('Approved and saved a Wednesday plan over real HTTP MCP');
  await stop();steps.push('Server process terminated');
  await start();steps.push('Started a new server process with the same data directory');
  const restored=await http('/case/'+id);assert.deepEqual(restored.result.case,saved.result);
  const replay=await http('/confirm',{ticket:proof.ticket});assert.deepEqual(replay.result,saved.result);
  steps.push('Prior signed session restored exact case; repeat confirmation did not add an event');
  result='PASS';
}catch(e){error=String(e);process.exitCode=1;}
finally{
  await stop();await mkdir(resolve(output,'..'),{recursive:true});
  await writeFile(output,JSON.stringify({status:result,checked_at:new Date().toISOString(),scope:'local process restart, durable SQLite and signing key; not hosted Redis',steps,error,server_log:logs.join('')},null,2));
  console.log(JSON.stringify({status:result,steps,error,report:output}));
}
