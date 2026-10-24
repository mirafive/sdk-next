// oxlint-disable-next-line import/no-unassigned-import -- it exists for its side effect: a build error in client code
import "server-only"
import { type Events, Mira } from "@mirafive/sdk-server"
import { after } from "next/server"

let client: Mira | undefined

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
