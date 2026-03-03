import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, rmSync, readFileSync } from "fs"
import { join } from "path"
import { HyperDesignerLogger, initLogger, resetLogger, getCurrentLogFilePath } from "../../utils/logger"

const TEST_LOG_DIR = join(process.cwd(), ".test-temp", "logger-test-logs")
const HD_DIR = join(process.cwd(), ".hyper-designer")

describe("HyperDesignerLogger strict error mode", () => {
  const originalEnv = process.env.HD_STRICT_ERRORS

  beforeEach(() => {
    resetLogger()
    HyperDesignerLogger.setLevel("DEBUG")
    HyperDesignerLogger.setPrint(false)
  })

  afterEach(() => {
    process.env.HD_STRICT_ERRORS = originalEnv
    resetLogger()
  })

  it("logs errors normally when HD_STRICT_ERRORS is not set", () => {
    delete process.env.HD_STRICT_ERRORS

    expect(() => {
      HyperDesignerLogger.error("Test", "Test error message", new Error("test error"))
    }).not.toThrow()
  })

  it("throws errors when HD_STRICT_ERRORS is set to '1'", () => {
    process.env.HD_STRICT_ERRORS = "1"

    expect(() => {
      HyperDesignerLogger.error("Test", "Test error message", new Error("test error"))
    }).toThrow("test error")
  })

  it("throws when HD_STRICT_ERRORS is enabled without explicit error", () => {
    process.env.HD_STRICT_ERRORS = "1"

    expect(() => {
      HyperDesignerLogger.error("Test", "Missing prompt file")
    }).toThrow("Missing prompt file")
  })

  it("throws errors when HD_STRICT_ERRORS is set to truthy value", () => {
    process.env.HD_STRICT_ERRORS = "true"

    expect(() => {
      HyperDesignerLogger.error("Test", "Test error message", new Error("test error"))
    }).toThrow("test error")
  })

  it("does not throw when HD_STRICT_ERRORS is set to falsy value", () => {
    process.env.HD_STRICT_ERRORS = "0"

    expect(() => {
      HyperDesignerLogger.error("Test", "Test error message", new Error("test error"))
    }).not.toThrow()
  })
})

describe("HyperDesignerLogger - no auto filesystem creation", () => {
  const originalEnv = {
    HYPER_DESIGNER_LOG_LEVEL: process.env.HYPER_DESIGNER_LOG_LEVEL,
    HYPER_DESIGNER_LOG_PRINT: process.env.HYPER_DESIGNER_LOG_PRINT,
    HYPER_DESIGNER_LOG_PERSIST: process.env.HYPER_DESIGNER_LOG_PERSIST,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_PRINT: process.env.LOG_PRINT,
    HD_STRICT_ERRORS: process.env.HD_STRICT_ERRORS,
  }

  beforeEach(() => {
    resetLogger()
    delete process.env.HYPER_DESIGNER_LOG_PERSIST
    delete process.env.HD_STRICT_ERRORS
    HyperDesignerLogger.setPrint(false)
  })

  afterEach(() => {
    Object.assign(process.env, originalEnv)
    resetLogger()
    if (existsSync(TEST_LOG_DIR)) {
      rmSync(TEST_LOG_DIR, { recursive: true, force: true })
    }
  })

  it("does NOT create .hyper-designer directory when calling debug()", () => {
    const hdDirExistedBefore = existsSync(HD_DIR)

    HyperDesignerLogger.debug("Test", "a debug message")

    // Only assert dir was not newly created; if it already existed, skip
    if (!hdDirExistedBefore) {
      expect(existsSync(HD_DIR)).toBe(false)
    }
  })

  it("does NOT create .hyper-designer directory when calling info()", () => {
    const hdDirExistedBefore = existsSync(HD_DIR)

    HyperDesignerLogger.info("Test", "an info message")

    if (!hdDirExistedBefore) {
      expect(existsSync(HD_DIR)).toBe(false)
    }
  })

  it("does NOT create .hyper-designer directory when calling warn()", () => {
    const hdDirExistedBefore = existsSync(HD_DIR)

    HyperDesignerLogger.warn("Test", "a warning message")

    if (!hdDirExistedBefore) {
      expect(existsSync(HD_DIR)).toBe(false)
    }
  })

  it("does NOT create .hyper-designer directory when calling error()", () => {
    const hdDirExistedBefore = existsSync(HD_DIR)

    HyperDesignerLogger.error("Test", "an error message")

    if (!hdDirExistedBefore) {
      expect(existsSync(HD_DIR)).toBe(false)
    }
  })

  it("does NOT create any log file without explicit initLogger({ persist: true })", () => {
    HyperDesignerLogger.debug("Test", "message 1")
    HyperDesignerLogger.info("Test", "message 2")
    HyperDesignerLogger.warn("Test", "message 3")

    expect(getCurrentLogFilePath()).toBeNull()
  })

  it("calling initLogger() without persist does NOT create .hyper-designer/logs", () => {
    const logsDir = join(HD_DIR, "logs")
    const existedBefore = existsSync(logsDir)

    initLogger({ print: false })

    if (!existedBefore) {
      expect(existsSync(logsDir)).toBe(false)
    }
  })

  it("calling initLogger({ persist: true, logDir }) creates the log directory and log file", () => {
    expect(existsSync(TEST_LOG_DIR)).toBe(false)

    initLogger({ persist: true, logDir: TEST_LOG_DIR, print: false })

    expect(existsSync(TEST_LOG_DIR)).toBe(true)
    expect(getCurrentLogFilePath()).not.toBeNull()
  })

  it("log messages are written to file only when persist is enabled", () => {
    initLogger({ persist: true, logDir: TEST_LOG_DIR, print: false })
    HyperDesignerLogger.info("Test", "hello persistent log")

    const logPath = getCurrentLogFilePath()
    expect(logPath).not.toBeNull()

    const contents = readFileSync(logPath!, "utf-8")
    expect(contents).toContain("hello persistent log")
  })

  it("HYPER_DESIGNER_LOG_PERSIST env var enables persistence on initLogger()", () => {
    expect(existsSync(TEST_LOG_DIR)).toBe(false)

    process.env.HYPER_DESIGNER_LOG_PERSIST = "true"
    initLogger({ logDir: TEST_LOG_DIR, print: false })

    expect(existsSync(TEST_LOG_DIR)).toBe(true)
  })
})
