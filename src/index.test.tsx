import { describe, expect, mock, test } from "bun:test";

import { renderToString } from "react-dom/server";

const scheduled: (() => unknown)[] = [];
let insideRequest = true;
void mock.module("next/server", () => ({
  after: (task: () => unknown) => {
    if (!insideRequest) throw new Error("`after` was called outside a request scope");
    scheduled.push(task);
  },
}));

const { MiraProvider, useMira } = await import("./index");
const { mira } = await import("./server");

describe("@mirafive/next", () => {
  test("the provider renders on the server", () => {
    function Page() {
      useMira().track("x");
      return <i>ok</i>;
    }
    expect(
      renderToString(
        <MiraProvider>
          <Page />
        </MiraProvider>,
      ),
    ).toBe("<i>ok</i>");
  });

  test("mira() is one client per process and flushes after the response", () => {
    const first = mira({ enabled: false });
    const second = mira();
    expect(first).toBe(second);
    expect(scheduled).toHaveLength(2);
  });

  test("outside a request it still works and relies on its timer", () => {
    insideRequest = false;
    expect(() => mira().track({ event: "from_a_script" })).not.toThrow();
    insideRequest = true;
  });
});
