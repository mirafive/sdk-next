// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const SECRET = "mf_ab12cd34_secretsecretsecretsecret"
const tasks: (() => unknown)[] = []
let inRequest = true

vi.mock("next/server", () => ({
  after: (task: () => unknown) => {
    if (!inRequest) {
      throw new Error("`after` was called outside a request scope")
    }

    tasks.push(task)
  }
}))

// Next resolves server-only to an empty module on the server; test/server-only.test.ts covers the real one.
vi.mock("server-only", () => ({}))

const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
  Response.json({ batch: "b", accepted: 1, dropped: 0 }, { status: 202 })
)

const batches = () =>
  fetchMock.mock.calls
    .filter(([url]) => url.endsWith("/v1/batch"))
    .map(([, init]) => ({
      auth: new Headers(init?.headers).get("authorization"),
      events: (JSON.parse(init?.body as string) as { events: { name: string; userId?: string }[] }).events
    }))

const runAfter = async () => {
  await Promise.all(tasks.splice(0).map((task) => task()))
}

beforeEach(() => {
  process.env["MIRAFIVE_SECRET_KEY"] = SECRET
  vi.stubGlobal("fetch", fetchMock)
  inRequest = true
})

afterEach(() => {
  tasks.length = 0
  fetchMock.mockClear()
  vi.unstubAllGlobals()
})

const { mira } = await import("../src/server.ts")

describe("mira()", () => {
  it("is one client per process, flushed after the response", async () => {
    const client = mira()

    expect(mira()).toBe(client)

    client.track("signup", { userId: "user-42", properties: { plan: "pro" } })
    expect(batches()).toHaveLength(0)

    await runAfter()

    expect(batches()).toEqual([
      { auth: `Bearer ${SECRET}`, events: [expect.objectContaining({ name: "signup", userId: "user-42" })] }
    ])
  })

  it("works outside a request, where after() throws", () => {
    inRequest = false

    expect(() => mira()).not.toThrow()
  })
})
