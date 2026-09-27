// @vitest-environment node
import { expect, it } from "vitest"

it("refuses to load outside a server bundle, as server-only does in a client component", async () => {
  await expect(import("../src/server.ts")).rejects.toThrow("cannot be imported from a Client Component")
})
