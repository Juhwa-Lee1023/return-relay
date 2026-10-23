// Records the real local application. It never sets business state directly.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = resolve(process.env.RR_VIDEO_DIR ?? '../video/take-1');
await mkdir(dir, {recursive:true});
const browser = await chromium.launch();
const context = await browser.newContext({viewport:{width:1280,height:640},recordVideo:{dir,size:{width:1280,height:640}},reducedMotion:'reduce'});
const page = await context.newPage();
const scenes = [], errors = [];
page.on('pageerror', e=>errors.push(e.message));
const start = performance.now();
const pause = ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function show(selector){await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));}
async function scene(caption, seconds, action){
  const from=(performance.now()-start)/1000;
  await action();
  await pause(Math.max(0,seconds*1000-(performance.now()-start-from*1000)));
  scenes.push({start:from,end:(performance.now()-start)/1000,caption});
  console.log(`Recorded scene ${scenes.length}: ${caption}`);
}
async function confirm(name, wait=1500){
  await page.getByRole('button',{name,exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await pause(wait);
  await page.getByRole('button',{name:'Confirm & save',exact:true}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
try {
  await scene('A trip moves from Friday to Thursday.\nThe return has to move with it.',9,async()=>{
    await page.goto(process.env.RR_RECORD_URL ?? 'http://127.0.0.1:4330');
    await expect(page.getByRole('button',{name:'Plan the headphones return'})).toBeEnabled();
  });
  await scene('Alex planned to drop off these headphones on Thursday.\nThis demo uses a fictional household and store policy.',10,async()=>{
    await page.getByRole('button',{name:'Plan the headphones return'}).click();
    await expect(page.getByRole('region',{name:'Return plan'})).toBeVisible();
    await show('.return-header');
  });
  await scene('These are the calls made by the app’s MCP client.\nIt connects over Streamable HTTP, finds the tools and runs them.',9,async()=>{
    await page.getByText('Actual MCP calls',{exact:true}).click();
    await show('.tool-trace');
  });
  await scene('The first plan fits before Friday’s departure.\nAlex checks the times and saves it.',13,async()=>{
    await page.getByText('Actual MCP calls',{exact:true}).click();
    await page.getByRole('button',{name:'Review & save'}).click();
    await pause(4500);
    await page.getByRole('button',{name:'Confirm & save'}).click();
    await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
    await show('.return-header');
  });
  await scene('Alex types: “Actually, I’m leaving Thursday morning.”\nThursday’s drop-off is now too late.',14,async()=>{
    await show('.conversation');
    await page.getByRole('textbox',{name:'Message Return Relay'}).pressSequentially('Actually, I’m leaving Thursday morning.',{delay:55});
    await page.getByRole('button',{name:'Send message'}).click();
    await expect(page.getByText('The old drop-off is too late.',{exact:true})).toBeVisible();
    await show('.return-header');
  });
  await scene('The app finds a Wednesday slot.\nThere’s time to pack, travel and finish at the counter.',11,async()=>{
    await show('.plan-sheet');
  });
  await scene('Alex checks the new times and confirms the change.\nWednesday becomes the saved plan.',12,async()=>{
    await page.getByRole('button',{name:'Review & save'}).click();
    await pause(5500);
    await page.getByRole('button',{name:'Confirm & save'}).click();
    await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
    await show('.return-header');
  });
  await scene('A refresh brings back the saved Wednesday plan.',8,async()=>{
    await page.reload();
    await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
    await show('.plan-sheet');
  });
  await scene('Alex checks the headphones, case, cable and sample return label,\nthen confirms that the parcel is packed.',12,async()=>{
    await show('.packing');
    for (const box of await page.getByRole('checkbox').all()){await box.check();await pause(500);}
    await confirm('Mark parcel packed',2500);
    await show('.packing');
  });
  await scene('Alex asks Maya to take the parcel on Wednesday.\nHer reply is still pending.',11,async()=>{
    await confirm('Ask Maya to take it',2500);
    await expect(page.getByText('Waiting for Maya',{exact:true})).toBeVisible();
    await show('.packing');
  });
  await scene('Switch to Maya’s demo view to accept the request.\nOne browser plays both household roles here.',12,async()=>{
    await page.getByRole('button',{name:'Open Maya’s view'}).click();
    await expect(page.getByRole('button',{name:'Accept as Maya'})).toBeVisible();
    await pause(2500);
    await confirm('Accept as Maya',2500);
    await show('.packing');
  });
  await scene('Maya reports the drop-off.\nThe app still needs a carrier receipt.',10,async()=>{
    await confirm('Report drop-off as Maya',2500);
    await expect(page.getByText('Drop-off reported',{exact:true})).toBeVisible();
    await show('.next-action');
  });
  await scene('A matching sample receipt confirms the demo drop-off.\nRefund status stays “Unknown.”',12,async()=>{
    await confirm('Load sample carrier receipt',2500);
    await expect(page.getByRole('heading',{name:'Parcel accepted'})).toBeVisible();
    await show('.receipt');
  });
  await scene('Try it at return-relay.vercel.app.\nThis is a guided web demo, with no Amazon account connection.',12,async()=>{
    await page.getByRole('button',{name:'How it works'}).click();
    await show('.help');
    await page.screenshot({path:resolve(dir,'last-frame.png')});
  });
  if(errors.length)throw Error(errors.join('\n'));
} catch(e){
  errors.push(String(e));
  await page.screenshot({path:resolve(dir,'recording-error.png'),fullPage:true});
} finally {
  const video=page.video();
  await context.close();
  const source=await video.path();
  await writeFile(resolve(dir,'recording.json'),JSON.stringify({source,scenes,errors,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),recorded_at:new Date().toISOString(),base_url:process.env.RR_RECORD_URL??'http://127.0.0.1:4330'},null,2));
  function clock(n){const ms=Math.round(n*1000);return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(x=>String(x).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');}
  await writeFile(resolve(dir,'captions.srt'),scenes.map((s,i)=>`${i+1}\n${clock(s.start)} --> ${clock(s.end)}\n${s.caption}\n`).join('\n'));
  console.log(JSON.stringify({source,errors,scenes:scenes.length}));
  await browser.close();
}
if(errors.length)process.exitCode=1;
