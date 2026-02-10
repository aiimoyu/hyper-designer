import { describe, it, expect } from "vitest"
import { debug } from "../../utils/debug"

describe("debug module", () => {
  it("exports log method", () => {
    expect(debug.log).toBeDefined()
    expect(typeof debug.log).toBe("function")
  })

  it("exports info method", () => {
    expect(debug.info).toBeDefined()
    expect(typeof debug.info).toBe("function")
  })

  it("exports warn method", () => {
    expect(debug.warn).toBeDefined()
    expect(typeof debug.warn).toBe("function")
  })

  it("exports error method", () => {
    expect(debug.error).toBeDefined()
    expect(typeof debug.error).toBe("function")
  })

  it("exports isEnabled method", () => {
    expect(debug.isEnabled).toBeDefined()
    expect(typeof debug.isEnabled).toBe("function")
  })

  it("exports getLogPath method", () => {
    expect(debug.getLogPath).toBeDefined()
    expect(typeof debug.getLogPath).toBe("function")
  })

  it("isEnabled returns boolean", () => {
    const enabled = debug.isEnabled()
    expect(typeof enabled).toBe("boolean")
  })

  it("getLogPath returns expected path", () => {
    const logPath = debug.getLogPath()
    expect(logPath).toContain(".hyper-designer")
    expect(logPath).toContain("debug.log")
  })

  it("log methods do not throw", () => {
    expect(() => debug.log("test")).not.toThrow()
    expect(() => debug.info("test")).not.toThrow()
    expect(() => debug.warn("test")).not.toThrow()
    expect(() => debug.error("test")).not.toThrow()
  })

  it("log methods accept optional data parameter", () => {
    expect(() => debug.log("test", { key: "value" })).not.toThrow()
    expect(() => debug.info("test", ["array"])).not.toThrow()
    expect(() => debug.warn("test", 42)).not.toThrow()
    expect(() => debug.error("test", null)).not.toThrow()
  })

  it("handles undefined data gracefully", () => {
    expect(() => debug.log("test", undefined)).not.toThrow()
  })

  it("handles non-serializable data gracefully", () => {
    const circular: any = {}
    circular.self = circular
    expect(() => debug.log("test", circular)).not.toThrow()
  })
})
