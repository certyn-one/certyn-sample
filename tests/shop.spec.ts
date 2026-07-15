import { test, expect } from "@playwright/test";

// Northwind Commerce E2E.
// These specs assert the CORRECT behavior. The suite runs in two modes, selected by the
// CLEAN env var (the playwright.yml workflow sets it from its `outcome` input):
//   CLEAN unset  → tests the real app with its planted defects → several FAIL on purpose.
//                  The red report is uploaded to Certyn to demo ingestion of a customer's CI.
//   CLEAN=1      → tests the corrected target (?clean + clean API fixtures) → all PASS,
//                  to demo a green CI upload.
const CLEAN = !!process.env.CLEAN;
const q = CLEAN ? "?clean" : "";
// Under CLEAN the static /api/*.json defects (contract drift, revenue mismatch) can't be
// toggled on a static host, so the API tests read corrected fixtures instead.
const ORDERS_API = CLEAN ? "/tests/fixtures/clean/orders.json" : "/api/orders.json";
const SUMMARY_API = CLEAN ? "/tests/fixtures/clean/summary.json" : "/api/orders/summary.json";

test("dashboard loads", async ({ page }) => {
  await page.goto("/index.html" + q);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
});

test("orders page lists all orders", async ({ page }) => {
  await page.goto("/orders.html" + q);
  await expect(page.locator("#orders-body tr")).toHaveCount(8);
});

test("checkout: settings save reports its outcome honestly", async ({ page }) => {
  await page.goto("/settings.html" + q);
  await page.fill("#display-name", "Acme Corp Renamed");
  await page.getByRole("button", { name: "Save changes" }).click();
  // With the defect on, the optimistic UI falsely claims success. With it off (?clean),
  // there is no backend on a static host, so it must honestly report that it could not save.
  await expect(page.locator("#save-toast")).toContainText(CLEAN ? "Could not save" : "Saved");
});

// FAILS with defects on — contract drift: /api/orders returns total as a string and omits currency.
test("orders API matches the documented contract", async ({ request }) => {
  const res = await request.get(ORDERS_API);
  const { orders } = await res.json();
  for (const o of orders) {
    expect(typeof o.total, `order ${o.id}: total must be a number`).toBe("number");
    expect(o.currency, `order ${o.id}: currency is required`).toBeTruthy();
  }
});

// FAILS with defects on — functional: summary.totalRevenue does not equal the sum of the orders.
test("revenue summary equals the sum of orders", async ({ request }) => {
  const { orders } = await (await request.get(ORDERS_API)).json();
  const sum = orders.reduce((a: number, o: any) => a + Number(o.total), 0);
  const summary = await (await request.get(SUMMARY_API)).json();
  expect(summary.totalRevenue).toBeCloseTo(sum, 2);
});

// FAILS with defects on — accessibility: the global search input exposes no accessible name.
test("global search has an accessible name", async ({ page }) => {
  await page.goto("/index.html" + q);
  const search = page.locator("#dash-search");
  const name = (await search.getAttribute("aria-label")) || (await search.getAttribute("placeholder"));
  expect(name, "search input needs an accessible name").toBeTruthy();
});

test("valid credentials reach the account area", async ({ page }) => {
  await page.goto("/login.html" + q);
  await page.fill("#login-username", "qa.tester@acme.example");
  await page.fill("#login-password", "Acme-QA-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/account\.html/);
  await expect(page.getByText("Signed in as")).toBeVisible();
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login.html" + q);
  await page.fill("#login-username", "qa.tester@acme.example");
  await page.fill("#login-password", "nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-toast")).toBeVisible();
  await expect(page).toHaveURL(/login\.html/);
});

// FAILS with defects on — security: the login must not reveal whether an email exists (user enumeration).
test("login gives the same error for unknown email and wrong password", async ({ page }) => {
  const messageFor = async (email: string, pw: string) => {
    await page.goto("/login.html" + q);
    await page.fill("#login-username", email);
    await page.fill("#login-password", pw);
    await page.getByRole("button", { name: "Sign in" }).click();
    return (await page.locator("#login-toast").textContent())?.trim() || "";
  };
  const unknownEmail = await messageFor("nobody@northwind.shop", "whatever1");
  const wrongPassword = await messageFor("qa.tester@acme.example", "whatever1");
  expect(unknownEmail).toBe(wrongPassword);
});
