import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@wiz/react': r('../react/src/index.ts') } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test-setup.ts'], css: false },
});
