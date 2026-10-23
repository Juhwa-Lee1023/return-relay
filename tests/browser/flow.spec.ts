import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function start(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', {name: 'Plan the headphones return'})).toBeEnabled();
}
async function select(page: Page) {
  await page.getByRole('button', {name: 'Plan the headphones return'}).click();
  await expect(page.getByRole('region', {name: 'Return plan'})).toBeVisible();
}
async function save(page: Page) {
  await page.getByRole('button', {name: 'Review & save'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', {name: 'Confirm & save'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
async function confirm(page: Page, name: string) {
  await page.getByRole('button', {name, exact: true}).click();
  await page.getByRole('button', {name: 'Confirm & save'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
async function axe(page: Page) {
  const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations.map(v => ({id:v.id, impact:v.impact, nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2)).toEqual([]);
}

test('review17: a negated departure asks for a date and preserves the saved plan', async ({page}) => {
  await start(page); await select(page); await save(page);
  await page.getByRole('textbox',{name:'Message Return Relay'}).fill("I'm not leaving Thursday morning.");
  await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText('What date and time will you leave? Choose a departure time below so I can check the whole errand.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Review & save',exact:true})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Thursday, November 5');
});

test('review17: blocked optional local storage does not block planning or saved state', async ({page}) => {
  await page.addInitScript(() => {
    for (const method of ['getItem','setItem','removeItem']) {
      Object.defineProperty(Storage.prototype,method,{value(){throw new DOMException('Storage blocked','SecurityError');},configurable:true});
    }
  });
  await start(page); await select(page); await save(page);
  await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
  await page.reload(); await select(page);
  await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Thursday, November 5');
});

test('approve, change departure, hand off, distinguish receipt from refund, restore', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page); await select(page); await save(page);
  await expect(page.getByText('Plan saved', {exact:true})).toBeVisible();
  await page.getByRole('textbox', {name:'Message Return Relay'}).fill('Actually, I’m leaving Thursday morning.');
  await page.getByRole('button', {name:'Send message'}).click();
  await expect(page.getByText('The old drop-off is too late.', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Keep saved plan'}).click();
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Fri, Nov 6');
  await page.getByRole('button', {name:'“Actually, I’m leaving Thursday morning.”'}).click();
  await save(page);
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Thu, Nov 5');
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Wednesday, November 4');
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await confirm(page,'Mark parcel packed');
  await confirm(page,'Ask Maya to take it');
  await expect(page.getByText('Waiting for Maya', {exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Accept as Maya'})).toHaveCount(0);
  await page.getByRole('button',{name:'Open Maya’s view'}).click();
  await confirm(page,'Accept as Maya');
  await confirm(page,'Report drop-off as Maya');
  await expect(page.getByText('Drop-off reported', {exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Parcel accepted'})).toHaveCount(0);
  await confirm(page,'Load sample carrier receipt');
  await expect(page.getByRole('heading',{name:'Parcel accepted'})).toBeVisible();
  await expect(page.locator('.receipt')).toContainText('Unknown');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Parcel accepted'})).toBeVisible();
  await page.getByText('Actual MCP calls', {exact:true}).click();
  await expect(page.getByRole('region',{name:'MCP call log'})).toContainText('return_case_get');
  await expect(page.getByRole('region',{name:'MCP call log'})).toContainText('2025-11-25');
  expect(errors).toEqual([]);
  await page.screenshot({path:'test-results/complete-flow.png',fullPage:true});
});

test('unknown policy and passed deadline do not offer a plan', async ({page}) => {
  await start(page);
  await page.getByRole('button',{name:/adapter/i}).click();
  await expect(page.getByRole('heading',{name:'The return window has passed.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Review & save'})).toHaveCount(0);
  await page.getByRole('button',{name:/bag/i}).click();
  await expect(page.getByRole('heading',{name:'Check the store’s instructions first.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Review & save'})).toHaveCount(0);
});

test('keyboard approval can be cancelled without saving', async ({page}) => {
  await start(page); await select(page);
  await page.getByRole('button',{name:'Review & save'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Review & save'})).toBeFocused();
  await page.reload();
  await expect(page.getByText('No saved changes yet.',{exact:true})).toHaveCount(1);
});

test('WCAG automated checks cover welcome, preview, and confirmation', async ({page}) => {
  await start(page); await axe(page);
  await select(page); await axe(page);
  await page.getByRole('button',{name:'Review & save'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await axe(page);
});

for (const width of [360,390,768,1440]) {
  test(`responsive ${width}px: no page overflow and reachable approval`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    await start(page); await select(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.getByRole('button',{name:'Review & save'}).click();
    await expect(page.getByRole('button',{name:'Confirm & save'})).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/approval-${width}.png`,fullPage:true});
  });
}

test('C31: microphone permission denied still allows typed planning', async ({page}) => {
  await start(page); await select(page); await save(page);
  const permission = await page.evaluate(async()=>(await navigator.permissions.query({name:'microphone' as PermissionName})).state);
  expect(permission).toBe('denied');
  await page.getByRole('textbox',{name:'Message Return Relay'}).fill('Thursday morning');
  await page.getByRole('button',{name:'Send message'}).click();
  await expect(page.getByText('The old drop-off is too late.',{exact:true})).toBeVisible();
  await save(page);
});

test('C32: text zoom and reduced motion keep controls usable', async ({page}) => {
  await page.setViewportSize({width:768,height:900});
  await page.emulateMedia({reducedMotion:'reduce'});
  await start(page); await select(page);
  // Fault/setting injection in a test browser only: approximate 200% page zoom
  // through CSS zoom. True OS browser zoom is a separate manual check.
  await page.addStyleTag({content:'body { zoom: 2; }'});
  await page.getByRole('button',{name:'Review & save'}).click();
  await expect(page.getByRole('button',{name:'Confirm & save'})).toBeInViewport();
  expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.getByRole('button',{name:'Go back',exact:true}).click();
});

test('C33: blocked session request shows recovery and never fabricates a plan', async ({page}) => {
  await page.route('**/api/session',route=>route.abort('failed'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('We could not confirm that step.');
  await expect(page.getByRole('region',{name:'Return plan'})).toHaveCount(0);
  await page.unroute('**/api/session');
  await page.getByRole('button',{name:'Reconnect'}).click();
  await expect(page.getByRole('button',{name:'Plan the headphones return'})).toBeEnabled();
});

test('C33: failed confirmation response is recovered by reading saved state', async ({page}) => {
  await start(page); await select(page);
  await page.getByRole('button',{name:'Review & save'}).click();
  // Let the real write finish, then lose only its response in this test browser.
  await page.route('**/api/confirm',async route=>{await route.fetch();await route.abort('failed');});
  await page.getByRole('button',{name:'Confirm & save'}).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('check whether this change was saved');
  await expect(page.locator('.proposal-banner')).toHaveCount(0);
  await page.unroute('**/api/confirm');
  await page.getByRole('button',{name:'Refresh saved plan'}).click();
  await expect(page.getByText('Plan saved',{exact:true})).toBeVisible();
  await page.getByText('Return instructions & saved history',{exact:true}).click();
  await expect(page.locator('.event-list li')).toHaveCount(1);
});

test('C04: an approval from an older tab cannot replace a newer plan', async ({page,context}) => {
  await start(page); await select(page); await save(page);
  const other=await context.newPage(); await other.goto('/');
  await expect(other.getByText('Plan saved',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'“Actually, I’m leaving Thursday morning.”'}).click();
  await expect(page.getByRole('button',{name:'Review & save'})).toBeVisible();
  await other.getByRole('button',{name:'“Actually, I’m leaving Thursday morning.”'}).click();
  await save(other);
  await page.getByRole('button',{name:'Review & save'}).click();
  await expect(page.getByRole('alert')).toContainText('Refresh this return');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button',{name:'Refresh saved plan'}).click();
  await expect(page.getByRole('region',{name:'Return plan'})).toContainText('Wed');
  await page.getByText('Return instructions & saved history',{exact:true}).click();
  await expect(page.locator('.event-list li')).toHaveCount(2);
});

test('role changed in another tab is recovered with the current session', async ({page,context}) => {
  await start(page); await select(page); await save(page);
  for(const box of await page.getByRole('checkbox').all())await box.check();
  await confirm(page,'Mark parcel packed');
  const other=await context.newPage(); await other.goto('/');
  await other.getByRole('button',{name:'Open Maya’s view'}).click();
  await expect(other.getByRole('button',{name:'Back to Alex'})).toBeVisible();
  await page.getByRole('button',{name:'I dropped it off myself'}).click();
  await expect(page.getByRole('alert')).toContainText('Refresh this page');
  await page.getByRole('button',{name:'Refresh saved plan'}).click();
  await expect(page.getByRole('button',{name:'Back to Alex'})).toBeVisible();
  await expect(page.getByRole('button',{name:'I dropped it off myself'})).toHaveCount(0);
});

test('reset asks first; cancelling keeps the saved plan and keyboard focus', async ({page}) => {
  await start(page); await select(page); await save(page);
  let resetRequests = 0;
  page.on('request', request => { if(request.url().endsWith('/api/reset')) resetRequests++; });
  const reset = page.getByRole('button', {name:'Reset sample', exact:true});
  await reset.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', {name:'Reset this sample household?'})).toBeVisible();
  expect(resetRequests).toBe(0);
  await axe(page);
  await page.keyboard.press('Escape');
  await expect(reset).toBeFocused();
  await page.reload();
  await expect(page.getByText('Plan saved', {exact:true})).toBeVisible();
  expect(resetRequests).toBe(0);
});

test('confirmed reset clears the household and a reload starts with no saved changes', async ({page}) => {
  await page.setViewportSize({width:360,height:900});
  await start(page); await select(page); await save(page);
  await page.getByRole('button', {name:'Reset sample', exact:true}).click();
  const confirmReset = page.getByRole('button', {name:'Reset household', exact:true});
  await expect(confirmReset).toBeInViewport();
  await page.screenshot({path:'test-results/reset-360.png', fullPage:true});
  await confirmReset.click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('region', {name:'Return plan'})).toHaveCount(0);
  await page.reload(); await select(page);
  await page.getByText('Return instructions & saved history', {exact:true}).click();
  await expect(page.getByText('No saved changes yet.', {exact:true})).toBeVisible();
});

test('a lost reset response closes the dialog and recovery reads the fresh household', async ({page}) => {
  await start(page); await select(page); await save(page);
  await page.getByRole('button', {name:'Reset sample', exact:true}).click();
  await page.route('**/api/reset', async route => {await route.fetch(); await route.abort('failed');});
  await page.getByRole('button', {name:'Reset household', exact:true}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('alert')).toContainText('check whether the reset finished');
  await page.unroute('**/api/reset');
  await page.getByRole('button', {name:'Refresh saved plan'}).click();
  await expect(page.getByRole('region', {name:'Return plan'})).toHaveCount(0);
  await select(page);
  await page.getByText('Return instructions & saved history', {exact:true}).click();
  await expect(page.getByText('No saved changes yet.', {exact:true})).toBeVisible();
});
