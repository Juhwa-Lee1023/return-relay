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
  projects: [
    {name: 'core', grepInvert: /review17:/, use: {baseURL: process.env.RR_TEST_URL ?? 'http://127.0.0.1:4326'}},
    {name: 'input-boundaries', grep: /review17:/, use: {baseURL: process.env.RR_TEST_URL ?? 'http://127.0.0.1:4327'}},
  ],
  // Separate local stores keep independent suites below the real session-creation limit.
  webServer: process.env.RR_TEST_URL ? undefined : [4326, 4327].map(port => ({
    command: 'npm start',
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    env: {
      PORT: String(port),
      RR_PUBLIC_ORIGIN: `http://127.0.0.1:${port}`,
      RR_DATA_DIR: `.private/browser-${port}-${Date.now()}`,
    },
  })),
});
