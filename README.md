# @mirafive/next

MIRA FIVE for Next.js (App Router and Pages Router): consent-aware analytics in the browser and
revenue from the server, sent after the response. Built on
[`@mirafive/web`](https://github.com/mirafive/sdk-web) and
[`@mirafive/node`](https://github.com/mirafive/sdk-node); no other dependencies.

## Install

```sh
npm install @mirafive/next   # or: bun add, pnpm add, yarn add
```

```sh
# .env.local
NEXT_PUBLIC_MIRAFIVE_KEY=mira_pk_…   # public key: browser
MIRAFIVE_SECRET_KEY=mira_sk_…        # secret key: server only, never NEXT_PUBLIC_
```

Next.js 15.1 or later.

## Browser

```tsx
// app/layout.tsx
import { MiraProvider } from "@mirafive/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MiraProvider>{children}</MiraProvider>
      </body>
    </html>
  );
}
```

The provider reads `NEXT_PUBLIC_MIRAFIVE_KEY` (and `NEXT_PUBLIC_MIRAFIVE_HOST`, if set). Route
changes are pageviews automatically. In client components:

```tsx
"use client";
import { useIdentify, useMira } from "@mirafive/next";

export function SignupButton() {
  const mira = useMira();
  return <button onClick={() => mira.track("signup_started", { plan: "pro" })}>Sign up</button>;
}
```

`useMira`, `useIdentify` and `useTrackOnMount` work as in
[`@mirafive/react`](https://github.com/mirafive/sdk-react#api).

## Server

```ts
// app/api/checkout/route.ts
import { eventIdFor, mira } from "@mirafive/next/server";

export async function POST(request: Request) {
  const { orderId, userId, totalCents, anonymousId } = await request.json();
  mira().revenue({
    userId,
    anonymousId, // the browser's mira.anonymousId: joins the purchase to the visit
    amount: totalCents,
    currency: "EUR",
    entryId: `order:${orderId}`,
    eventId: await eventIdFor(`order:${orderId}:paid`),
  });
  return Response.json({ ok: true });
}
```

`mira()` returns the process-wide `@mirafive/node` client (secret key from
`MIRAFIVE_SECRET_KEY`) and schedules a flush with `after()`, so the response never waits. It
works in Route Handlers, Server Actions, Server Components and middleware. Importing
`@mirafive/next/server` in browser code throws, so the secret key cannot leak there. The full
server API (`track`, `identify`, `group`, `revenue`, `touchpoint`) is in the
[`@mirafive/node` README](https://github.com/mirafive/sdk-node#readme).

## For AI coding assistants

Rules for integrating MIRA FIVE correctly. They hold for every MIRA FIVE SDK.

- **Keys:** the public key (`mira_pk_…`) goes in browser and app code. The secret key (`mira_sk_…`)
  goes only into the server's environment (`MIRAFIVE_SECRET_KEY`), never into client code, a
  `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` variable or a repository. The SDKs refuse the wrong key.
- **Money** is sent only from the server: integer minor units plus an ISO 4217 currency
  (`amount: 1999, currency: "EUR"` is 19.99 EUR), never floats.
- **Count once:** give money an `entryId` from the payment provider (`stripe:in_123`), so the
  Stripe connector and retries do not double it. Give business events a stable id:
  `eventId: await eventIdFor("order:123:paid")`. The same key gives the same id in every SDK.
- **Personal data** never goes into event names or properties. Use your own user id (not an email)
  for `identify`; put email, name and phone in its traits, which MIRA FIVE encrypts at rest.
- **Consent:** keep `consent: "auto"`; it follows the site's consent banner (Usercentrics,
  Cookiebot, consentmanager, CCM19, Borlabs, any TCF 2.2 CMP, Google Consent Mode). Call
  `consent()` only for a custom banner. Do not gate the SDK behind consent yourself: without
  consent it is cookieless and still counts.
- **Never block on analytics:** event methods return nothing, never throw, and batch on their
  own. Do not `await` or `try` them. Call `flush()`/`shutdown()` only at the end of a script or a
  serverless function.
- **Server events and visitors:** pass the browser's `mira.anonymousId` to your server and set it
  as `anonymousId` on server events, so a purchase joins the visit and its source.
