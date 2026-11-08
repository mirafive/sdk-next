import { Mira, type EventMap, type MiraOptions } from "@mirafive/node";
/**
 * `@mirafive/next/server`: server events from Route Handlers, Server Actions, Server Components
 * and middleware, delivered after the response is sent.
 *
 * ```ts
 * import { mira } from "@mirafive/next/server";
 *
 * export async function POST(request: Request) {
 *   const order = await createOrder(request);
 *   mira().revenue({ userId: order.userId, amount: order.totalCents, currency: "EUR", entryId: `order:${order.id}` });
 *   return Response.json(order);
 * }
 * ```
 */
import { after } from "next/server";

export {
  eventIdFor,
  Mira,
  MiraError,
  type EventMap,
  type GroupInput,
  type IdentifyInput,
  type MiraOptions,
  type RevenueInput,
  type TouchpointInput,
  type TrackInput,
} from "@mirafive/node";

if (typeof window !== "undefined") {
  throw new Error(
    "MIRA FIVE: @mirafive/next/server was imported in browser code. It holds the secret key; use @mirafive/next in client components.",
  );
}

let client: Mira | undefined;

/**
 * The process-wide server client (secret key from `MIRAFIVE_SECRET_KEY`), flushed with `after()`
 * once the current response is sent, so no request waits for analytics. Outside a request
 * (scripts, module scope) its own timer sends.
 *
 * Options apply when the client is first made.
 */
export function mira<Events extends EventMap = EventMap>(options?: MiraOptions): Mira<Events> {
  client ??= new Mira(options);
  const instance = client;
  try {
    after(() => instance.flush());
  } catch {
    // Not inside a request; the client's timer flushes.
  }
  return instance as unknown as Mira<Events>;
}
