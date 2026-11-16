import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@wiz/react': r('../../packages/react/src/index.ts') } },
  server: { fs: { allow: [r('../..')] } },
});
