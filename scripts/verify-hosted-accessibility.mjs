import { createRequire } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(new URL("../package.json", import.meta.url));
const { chromium, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const output = resolve(
  process.env.RR_VERIFY_OUTPUT ?? "test-results/hosted-accessibility",
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const result = {
  started_at: new Date().toISOString(),
  base_url: process.env.RR_TEST_URL ?? "https://return-relay.vercel.app",
  source_commit: process.env.RR_DEPLOYED_COMMIT ?? null,
  scope: "Synthetic hosted browser checks; not a complete accessibility audit",
  checks: [],
  errors: [],
};
const context = await browser.newContext({
  viewport: { width: 320, height: 740 },
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.on("pageerror", (error) => result.errors.push(error.message));
async function check(name, run) {
  try {
    await run();
    result.checks.push({ name, status: "PASS" });
  } catch (error) {
    result.checks.push({ name, status: "FAIL", error: error.message });
    throw error;
  }
}
async function axe(name) {
  await check(name, async () => {
    const data = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      data.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
}
async function approve(name) {
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Confirm & save" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
try {
  await page.goto(result.base_url);
  await expect(
    page.getByRole("button", { name: "Plan the headphones return" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Plan the headphones return" })
    .click();
  await check("320px preview has no horizontal overflow", async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true),
  );
  await page.getByRole("button", { name: "Review & save" }).click();
  await check("320px approval is reachable", async () =>
    expect(
      page.getByRole("button", { name: "Confirm & save" }),
    ).toBeInViewport(),
  );
  await page.screenshot({
    path: resolve(output, "cycle13-approval-320.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 812, height: 375 });
  await check("landscape approval stays within viewport", async () => {
    await expect(
      page.getByRole("button", { name: "Confirm & save" }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
  await page.screenshot({
    path: resolve(output, "cycle13-approval-landscape.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Confirm & save" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await axe("saved plan automated accessibility");
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await approve("Mark parcel packed");
  await check("Thursday plan does not offer an unavailable Maya", async () => {
    await expect(
      page.getByRole("button", { name: "Ask Maya to take it", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Find a time for Maya", exact: true }),
    ).toBeVisible();
  });
  await page
    .getByRole("button", { name: "Find a time for Maya", exact: true })
    .click();
  await approve("Review & save");
  await check(
    "replan for Maya keeps packing and offers Wednesday",
    async () => {
      await expect(
        page.getByRole("region", { name: "Return plan" }),
      ).toContainText("Wednesday, November 4");
      await expect(
        page.getByRole("button", { name: "Ask Maya to take it", exact: true }),
      ).toBeVisible();
    },
  );
  await approve("Ask Maya to take it");
  await axe("pending handoff automated accessibility");
  await page.getByRole("button", { name: "Open Maya’s view" }).click();
  await approve("Accept as Maya");
  await axe("accepted handoff automated accessibility");
  await approve("Report drop-off as Maya");
  await approve("Load sample carrier receipt");
  await expect(
    page.getByRole("heading", { name: "Parcel accepted" }),
  ).toBeVisible();
  await axe("carrier receipt automated accessibility");
  await page.screenshot({
    path: resolve(output, "cycle13-receipt.png"),
    fullPage: true,
  });
  await check("no uncaught browser errors", async () =>
    expect(result.errors).toEqual([]),
  );
  result.status = "PASS";
} catch (error) {
  result.status = "FAIL";
  result.failure = error.message;
  await page
    .screenshot({
      path: resolve(output, "cycle13-failure.png"),
      fullPage: true,
    })
    .catch(() => {});
  process.exitCode = 1;
} finally {
  result.finished_at = new Date().toISOString();
  await writeFile(
    resolve(output, "result.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}
