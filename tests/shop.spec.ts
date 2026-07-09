import { test, expect } from "@playwright/test";

// Northwind Commerce E2E.
// These specs assert the CORRECT behavior. Because the demo app ships with planted
// defects, several intentionally FAIL — that is the point: the failing Playwright report
// is uploaded to Certyn (POST /api/ci/results) to demo ingestion of a customer's own CI.

test("dashboard loads", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
});

test("orders page lists all orders", async ({ page }) => {
  await page.goto("/orders.html");
  await expect(page.locator("#orders-body tr")).toHaveCount(8);
});

test("checkout: settings save persists", async ({ page }) => {
  await page.goto("/settings.html");
  await page.fill("#display-name", "Acme Corp Renamed");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("#save-toast")).toContainText("Saved");
});

// FAILS — contract drift: /api/orders returns total as a string and omits currency.
test("orders API matches the documented contract", async ({ request }) => {
  const res = await request.get("/api/orders.json");
  const { orders } = await res.json();
  for (const o of orders) {
    expect(typeof o.total, `order ${o.id}: total must be a number`).toBe("number");
    expect(o.currency, `order ${o.id}: currency is required`).toBeTruthy();
  }
});

// FAILS — functional: summary.totalRevenue does not equal the sum of the orders.
test("revenue summary equals the sum of orders", async ({ request }) => {
  const { orders } = await (await request.get("/api/orders.json")).json();
  const sum = orders.reduce((a: number, o: any) => a + Number(o.total), 0);
  const summary = await (await request.get("/api/orders/summary.json")).json();
  expect(summary.totalRevenue).toBeCloseTo(sum, 2);
});

// FAILS — accessibility: the global search input exposes no accessible name.
test("global search has an accessible name", async ({ page }) => {
  await page.goto("/index.html");
  const search = page.locator("#dash-search");
  const name = (await search.getAttribute("aria-label")) || (await search.getAttribute("placeholder"));
  expect(name, "search input needs an accessible name").toBeTruthy();
});

test("valid credentials reach the account area", async ({ page }) => {
  await page.goto("/login.html");
  await page.fill("#login-username", "qa.tester@acme.example");
  await page.fill("#login-password", "Acme-QA-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/account\.html/);
  await expect(page.getByText("Signed in as")).toBeVisible();
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login.html");
  await page.fill("#login-username", "qa.tester@acme.example");
  await page.fill("#login-password", "nope");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("#login-toast")).toBeVisible();
  await expect(page).toHaveURL(/login\.html/);
});

// FAILS — security: the login must not reveal whether an email exists (user enumeration).
test("login gives the same error for unknown email and wrong password", async ({ page }) => {
  const messageFor = async (email: string, pw: string) => {
    await page.goto("/login.html");
    await page.fill("#login-username", email);
    await page.fill("#login-password", pw);
    await page.getByRole("button", { name: "Sign in" }).click();
    return (await page.locator("#login-toast").textContent())?.trim() || "";
  };
  const unknownEmail = await messageFor("nobody@northwind.shop", "whatever1");
  const wrongPassword = await messageFor("qa.tester@acme.example", "whatever1");
  expect(unknownEmail).toBe(wrongPassword);
});
