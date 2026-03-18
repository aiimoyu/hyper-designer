import { describe, it, expect } from "vitest"
import { createTempTestDir, cleanupTempDir, withTempDir } from "./tempDir"
import { existsSync } from "fs"

describe("tempDir", () => {
  describe("createTempTestDir", () => {
    it("creates a directory that exists", () => {
      const dir = createTempTestDir("test-prefix")
      expect(existsSync(dir)).toBe(true)
      // Cleanup after test
      cleanupTempDir(dir)
    })

    it("returns an absolute path", () => {
      const dir = createTempTestDir("test-prefix")
      expect(dir.startsWith("/") || dir.match(/^[A-Za-z]:\\/)).toBeTruthy()
      cleanupTempDir(dir)
    })

    it("includes the prefix in the directory name", () => {
      const dir = createTempTestDir("my-test-prefix")
      expect(dir.includes("my-test-prefix")).toBe(true)
      cleanupTempDir(dir)
    })
  })

  describe("cleanupTempDir", () => {
    it("removes the directory", () => {
      const dir = createTempTestDir("cleanup-test")
      expect(existsSync(dir)).toBe(true)
      
      cleanupTempDir(dir)
      
      expect(existsSync(dir)).toBe(false)
    })

    it("handles non-existent directory gracefully", () => {
      // Should not throw
      expect(() => cleanupTempDir("/non-existent-dir-12345")).not.toThrow()
    })
  })

  describe("withTempDir", () => {
    it("creates dir, runs fn, and cleans up", async () => {
      let capturedDir: string | null = null
      
      await withTempDir("with-test", (dir) => {
        capturedDir = dir
        expect(existsSync(dir)).toBe(true)
      })
      
      // Should be cleaned up after fn completes
      expect(capturedDir).not.toBeNull()
      expect(existsSync(capturedDir!)).toBe(false)
    })

    it("cleans up even when fn throws", async () => {
      let capturedDir: string | null = null
      
      await expect(
        withTempDir("with-throw-test", (dir) => {
          capturedDir = dir
          expect(existsSync(dir)).toBe(true)
          throw new Error("intentional error")
        })
      ).rejects.toThrow("intentional error")
      
      // Should still be cleaned up
      expect(capturedDir).not.toBeNull()
      expect(existsSync(capturedDir!)).toBe(false)
    })

    it("works with async fn", async () => {
      let capturedDir: string | null = null
      
      await withTempDir("with-async-test", async (dir) => {
        capturedDir = dir
        expect(existsSync(dir)).toBe(true)
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      
      // Should be cleaned up after fn completes
      expect(capturedDir).not.toBeNull()
      expect(existsSync(capturedDir!)).toBe(false)
    })
  })
})
