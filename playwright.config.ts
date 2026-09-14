import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      SQLITE_PATH: "data/e2e.sqlite",
      ADMIN_PASSWORD: "local-e2e-password-only",
      SESSION_SECRET: "local-e2e-session-secret-not-for-production-000000000000",
      ALLOW_PREVIEW_ORDERS: "true",
      BANK_NAME: "Туршилтын банк",
      BANK_ACCOUNT: "TEST-ACCOUNT-DO-NOT-PAY",
      BANK_HOLDER: "Туршилт",
      DATABASE_URL: "",
    },
  },
});
