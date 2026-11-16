import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    cssCodeSplit: false,
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', 'react-markdown', 'remark-gfm'], output: { assetFileNames: 'style.css' } },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test-setup.ts'], css: false },
});
