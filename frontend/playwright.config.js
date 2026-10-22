import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const dataDir = fileURLToPath(new URL(`../data/e2e-${process.pid}-${Date.now()}/`, import.meta.url));

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5050', trace: 'retain-on-failure' },
  webServer: [
    {
      command: '../.venv/bin/python ../backend/app.py',
      url: 'http://127.0.0.1:5050/health',
      env: { CIVILIUM_DATA_DIR: dataDir },
      reuseExistingServer: false,
    },
    {
      command: 'node tests/demo-server.mjs',
      url: 'http://127.0.0.1:4174/portfolio/civilium/',
      reuseExistingServer: false,
    },
  ],
});
