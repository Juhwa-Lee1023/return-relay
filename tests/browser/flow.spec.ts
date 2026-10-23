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
