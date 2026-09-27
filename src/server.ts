// oxlint-disable-next-line import/no-unassigned-import -- it exists for its side effect: a build error in client code
import "server-only"
import { type Events, Mira } from "@mirafive/sdk-server"
import { type FlagUnit, MiraFlags, type UserFlags } from "@mirafive/sdk-server/flags"
import { after } from "next/server"
import { createElement, type ReactElement } from "react"

export type { FlagUnit, UserFlags } from "@mirafive/sdk-server/flags"

let client: Mira | undefined
let flags: MiraFlags | undefined

const shared = (): Mira =>
  (client ??= new Mira({ key: process.env.MIRAFIVE_SECRET_KEY, host: process.env.MIRAFIVE_HOST }))

// after() throws outside a request (module scope, a script); the client's own timer flushes there.
const later = (task: () => unknown): void => {
  try {
    after(task)
  } catch {
    // Not in a request.
  }
}

/** The process-wide server client from `MIRAFIVE_SECRET_KEY`, flushed after the current response. */
export const mira = <E extends Events = Events>(): Mira<E> => {
  const instance = shared()

  later(() => instance.flush())
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the event map only narrows track()
  return instance as unknown as Mira<E>
}

/** One visitor's flags. `Sec-GPC: 1` or `DNT: 1` on the request sets `optedOut`. */
export const flagsFor = async (unit: FlagUnit = {}): Promise<UserFlags> => {
  const { headers } = await import("next/headers")
  const request = await headers()

  flags ??= new MiraFlags({
    key: process.env.MIRAFIVE_SECRET_KEY,
    host: process.env.MIRAFIVE_HOST,
    mira: shared()
  })

  return flags.for(
    {
      ...unit,
      optedOut: unit.optedOut || request.get("sec-gpc") === "1" || request.get("dnt") === "1"
    },
    { waitUntil: (promise) => later(() => promise) }
  )
}

/** The `<script id="mirafive-flags">` block the browser SDK reads at start. */
export const MiraFlagsScript = ({ flags: given }: { flags: UserFlags | string }): ReactElement => {
  const html = typeof given === "string" ? given : given.bootstrap()

  // The block's JSON is escaped: it holds no `<` or `>` of its own.
  return createElement("script", {
    type: "application/json",
    id: "mirafive-flags",
    dangerouslySetInnerHTML: { __html: html.slice(html.indexOf(">") + 1, html.lastIndexOf("<")) }
  })
}
