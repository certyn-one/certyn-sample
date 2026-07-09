import { defineConfig, devices } from "@playwright/test";

// Point BASE_URL at the deployed site (e.g. the GitHub Pages URL) to test that instead.
// Unset, Playwright serves the static site locally for the run.
const BASE_URL = process.env.BASE_URL || "http://localhost:8000";

export default defineConfig({
  testDir: "./tests",
  reporter: [["list"], ["json", { outputFile: "playwright-report.json" }]],
  use: { baseURL: BASE_URL, trace: "off" },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "python3 -m http.server 8000", url: "http://localhost:8000", reuseExistingServer: true },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
