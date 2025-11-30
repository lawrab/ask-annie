import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    watch: false, // Prevent watch mode by default (use vitest --watch to enable)
    pool: 'forks', // Use forks instead of threads to prevent hanging
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/types/',
        '**/*.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/App.tsx', // Just routes, not business logic
        'src/pages/DesignSystemPage.tsx', // Design showcase, not business logic
      ],
      // Thresholds accounting for Web Audio API mocking limitations
      // VoiceRecorder and voice-related CheckInPage code are hard to test in jsdom
      thresholds: {
        lines: 68,
        functions: 60,
        branches: 75,
        statements: 68,
      },
    },
  },
});
