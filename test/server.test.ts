// @vitest-environment node
import type { Flag, FlagDocument } from "@mirafive/sdk-server/flags"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const SECRET = "mf_ab12cd34_secretsecretsecretsecret"
const tasks: (() => unknown)[] = []
const request = new Headers()
let inRequest = true

vi.mock("next/server", () => ({
  after: (task: () => unknown) => {
    if (!inRequest) {
      throw new Error("`after` was called outside a request scope")
    }

    tasks.push(task)
  }
}))

vi.mock("next/headers", () => ({ headers: async () => request }))

const seed = "3f9a1c0b7e2d"
// With this seed user-42 buckets into variant b.
const pricing: Flag = {
  s: seed,
  t: "m",
  u: "p",
  d: "a",
  p: { a: "Original", b: "Stop paying" },
  r: [
    {
      w: [
        ["a", 5000],
        ["b", 5000]
      ]
    }
  ],
  e: "o",
  c: "s",
  w: 1
}
const hostile = "</script><!-- "
const document: FlagDocument = {
  v: 1,
  at: Date.now(),
  flags: {
    pricing,
    limits: { s: seed, t: "c", u: "p", d: "pro", p: { pro: { note: hostile } }, r: [], w: 1 },
    internal: { s: seed, t: "b", u: "p", d: "on", r: [] }
  }
}

const fetchMock = vi.fn(async (url: string, _init?: RequestInit) =>
  url.endsWith("/v1/flags")
    ? Response.json(document, { headers: { ETag: '"1"' } })
    : Response.json({ batch: "b", accepted: 1, dropped: 0 }, { status: 202 })
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
  request.delete("sec-gpc")
  request.delete("dnt")
  vi.unstubAllGlobals()
})

const { flagsFor, mira, MiraFlagsScript } = await import("../src/server.ts")

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

describe("flagsFor()", () => {
  it("evaluates for the unit and hands the exposure to after()", async () => {
    const user = await flagsFor({ userId: "user-42" })

    expect(user.variant("pricing", "a")).toBe("b")
    await runAfter()
    expect(batches().flatMap((batch) => batch.events)).toEqual([
      expect.objectContaining({ name: "$exposure", userId: "user-42" })
    ])
  })

  it.each([
    ["sec-gpc", "1"],
    ["dnt", "1"]
  ])("honours %s: %s as an opt-out", async (name, value) => {
    request.set(name, value)

    const user = await flagsFor({ userId: "user-42" })

    expect(user.variant("pricing", "a")).toBe("a")
    expect(user.evaluate("pricing")).toMatchObject({ errorCode: "NOT_ALLOWED" })
    await runAfter()
    expect(batches().flatMap((batch) => batch.events)).toEqual([])
  })
})

describe("<MiraFlagsScript>", () => {
  it("renders the escaped bootstrap block, with only flags the website reads", async () => {
    const user = await flagsFor({ userId: "user-42" })
    const html = renderToStaticMarkup(MiraFlagsScript({ flags: user }))

    expect(html).toBe(user.bootstrap())
    expect(html).not.toContain(hostile)
    expect(html).not.toContain("internal")
    expect(renderToStaticMarkup(MiraFlagsScript({ flags: html }))).toBe(html)
  })
})
