import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ["./src/__tests__/setup.ts"],
    fileParallelism: false,
    exclude: [
      '**/node_modules/**',
      '**/.opencode/**',
      '**/.worktrees/**',
      '**/dist/**',
      '**/coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: ['src/__tests__/**', 'node_modules/**', 'opencode/**']
    },
  }
})
