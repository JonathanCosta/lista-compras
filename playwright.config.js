import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173/lista-compras/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'pixel-5',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
