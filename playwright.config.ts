import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.RR_TEST_URL ?? 'http://127.0.0.1:4326',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.RR_TEST_URL ? undefined : {
    command: 'npm start',
    url: 'http://127.0.0.1:4326/api/health',
    reuseExistingServer: false,
    env: {
      PORT: '4326',
      RR_PUBLIC_ORIGIN: 'http://127.0.0.1:4326',
      RR_DATA_DIR: `.private/browser-${Date.now()}`,
    },
  },
});
