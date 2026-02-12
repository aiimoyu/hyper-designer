import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { HyperDesignerLogger } from "../../utils/logger"

describe("HyperDesignerLogger strict error mode", () => {
  const originalEnv = process.env.HD_STRICT_ERRORS

  beforeEach(() => {
    // Reset logger state
    HyperDesignerLogger.setLevel("DEBUG")
    HyperDesignerLogger.setPrint(false)
  })

  afterEach(() => {
    process.env.HD_STRICT_ERRORS = originalEnv
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
