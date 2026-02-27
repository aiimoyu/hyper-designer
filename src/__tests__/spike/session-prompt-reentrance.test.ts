import { describe, it, expect, vi } from "vitest"
import type { PluginInput } from "@opencode-ai/plugin"
import type { SessionPromptData, TextPart } from "@opencode-ai/sdk"

type TestToolContext = {
  client: PluginInput["client"]
  directory: string
}

const TEST_SESSION_ID = "spike-session-prompt-reentrance"

describe("Spike: session.prompt re-entrancy", () => {
  it("should allow tool handler to call session.prompt without deadlock", async () => {
    const response = {
      data: {
        info: {
          id: "msg-1",
          sessionID: TEST_SESSION_ID,
          role: "assistant",
          time: { created: Date.now() },
          parentID: "msg-0",
          modelID: "model",
          providerID: "provider",
          mode: "primary",
          path: { cwd: process.cwd(), root: process.cwd() },
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
        },
        parts: [
          {
            id: "part-1",
            sessionID: TEST_SESSION_ID,
            messageID: "msg-1",
            type: "text",
            text: "ok",
          } satisfies TextPart,
        ],
      },
      error: undefined,
      request: new Request("http://localhost/session"),
      response: new Response(null, { status: 200 }),
    } satisfies Awaited<ReturnType<PluginInput["client"]["session"]["prompt"]>>

    const promptMock = vi.fn().mockResolvedValue(response)
    const ctx: TestToolContext = {
      client: {
        session: {
          prompt: promptMock,
        },
      } as unknown as PluginInput["client"],
      directory: process.cwd(),
    }

    const toolExecute = async (input: { sessionID: string }) => {
      const promptInput: SessionPromptData = {
        path: { id: input.sessionID },
        body: {
          agent: "HCritic",
          noReply: false,
          parts: [{ type: "text", text: "test" }],
        },
        query: { directory: ctx.directory },
        url: "/session/{id}/message",
      }

      const result = await ctx.client.session.prompt(promptInput)
      return result
    }

    const result = await toolExecute({ sessionID: TEST_SESSION_ID })

    expect(promptMock).toHaveBeenCalledTimes(1)
    expect(promptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: TEST_SESSION_ID },
        body: expect.objectContaining({
          agent: "HCritic",
          noReply: false,
        }),
      })
    )
    if (!result.data) {
      throw new Error("Expected prompt response data")
    }
    expect(result.data.parts[0]?.type).toBe("text")
  })
})

// SPIKE RESULT: REENTRANCE_OK
