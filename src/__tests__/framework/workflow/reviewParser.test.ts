import { describe, it, expect } from "vitest"
import { inferPassFromText, parseReviewResult } from '../../../workflows/core'

describe("reviewParser", () => {
  describe("inferPassFromText", () => {
    it("returns false for fail keywords", () => {
      expect(inferPassFromText("fail")).toBe(false)
      expect(inferPassFromText("FAIL")).toBe(false)
      expect(inferPassFromText("未通过")).toBe(false)
      expect(inferPassFromText("不通过")).toBe(false)
    })

    it("returns true for pass keywords", () => {
      expect(inferPassFromText("pass")).toBe(true)
      expect(inferPassFromText("PASS")).toBe(true)
      expect(inferPassFromText("通过")).toBe(true)
      expect(inferPassFromText("approved")).toBe(true)
      expect(inferPassFromText("APPROVED")).toBe(true)
    })

    it("returns false for text without pass or fail keywords", () => {
      expect(inferPassFromText("some review text")).toBe(false)
      expect(inferPassFromText("")).toBe(false)
    })
  })

  describe("parseReviewResult", () => {
    it("parses valid structured output correctly", () => {
      const structuredOutput = {
        passed: true,
        summary: "评审通过",
        issues: ["minor issue"],
        score: 85
      }
      const reviewText = "PASS"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(true)
      expect(result.summary).toBe("评审通过")
      expect(result.issues).toEqual(["minor issue"])
      expect(result.score).toBe(85)
    })

    it("filters non-string issues", () => {
      const structuredOutput = {
        passed: false,
        summary: "评审未通过",
        issues: ["valid issue", 123, null, "another issue"]
      }
      const reviewText = "FAIL"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(false)
      expect(result.summary).toBe("评审未通过")
      expect(result.issues).toEqual(["valid issue", "another issue"])
    })

    it("infers pass from text when structured output has no passed field", () => {
      const structuredOutput = {
        summary: "评审通过",
        issues: []
      }
      const reviewText = "PASS"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(true)
      expect(result.summary).toBe("评审通过")
      expect(result.issues).toEqual([])
      expect(result.score).toBeUndefined()
    })

    it("uses default summary when structured output has no summary", () => {
      const structuredOutput = {
        passed: true,
        issues: []
      }
      const reviewText = "通过"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(true)
      expect(result.summary).toBe("通过")
      expect(result.issues).toEqual([])
    })

    it("falls back to review text when structured output is invalid", () => {
      const structuredOutput = null
      const reviewText = "FAIL"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(false)
      expect(result.summary).toBe("FAIL")
      expect(result.issues).toEqual([])
    })

    it("uses default summary when review text is empty and structured output invalid", () => {
      const structuredOutput = undefined
      const reviewText = ""

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.passed).toBe(false)
      expect(result.summary).toBe("HCritic 未返回结构化结论。")
      expect(result.issues).toEqual([])
    })

    it("handles empty issues array", () => {
      const structuredOutput = {
        passed: true,
        summary: "通过",
        issues: []
      }
      const reviewText = "PASS"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.issues).toEqual([])
    })

    it("handles missing score", () => {
      const structuredOutput = {
        passed: true,
        summary: "通过",
        issues: []
      }
      const reviewText = "PASS"

      const result = parseReviewResult(structuredOutput, reviewText)

      expect(result.score).toBeUndefined()
    })
  })
})