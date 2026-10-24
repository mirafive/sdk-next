# @mirafive/sdk-next

MIRA FIVE for Next.js: a client provider with hooks, and a server helper for events that
sends after the response with `after()`. Privacy-first analytics from MIRA FIVE, hosted in
the EU. App Router first; Pages Router covered below.

## Size

| Import | min + gzip |
|---|---|
| `@mirafive/sdk-next` (client) | 0.50 kB |
| `@mirafive/sdk-next/server` | 0.29 kB |

Measured with the peers external (`react`, `next`, `@mirafive/sdk-browser`,
`@mirafive/sdk-react` and `@mirafive/sdk-server`): these are the bytes
this package adds. The browser SDK core with pageviews is 2.31 kB on top. Nothing from the
server entry reaches the browser bundle. What you do not import is not shipped
(`sideEffects: false`).

## Install

```sh
npm install @mirafive/sdk-next @mirafive/sdk-react @mirafive/sdk-browser @mirafive/sdk-server
# or: bun add / pnpm add / yarn add
```

Peers: `next` ^15.1 or ^16, `react` ≥ 18.3, `@mirafive/sdk-react`,
`@mirafive/sdk-browser` and (for `/server` only) `@mirafive/sdk-server`, all ^1.0.0.

## Quickstart

`.env.local`:

```sh
NEXT_PUBLIC_MIRAFIVE_KEY=mf_…   # the source's website key, public
MIRAFIVE_SECRET_KEY=mf_…        # the source's secret key, server only
```

Analytics only: pageviews for every route, no banner needed.

```tsx
// app/layout.tsx
import { MiraProvider } from "@mirafive/sdk-next"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MiraProvider>{children}</MiraProvider>
      </body>
    </html>
  )
}
```

```tsx
// a client component
"use client"
import { useMira } from "@mirafive/sdk-next"

export function SignupButton() {
  const mira = useMira()

  return <button onClick={() => mira.track("signup_clicked", { plan: "pro" })}>Sign up</button>
}
```

```ts
// app/api/signup/route.ts: server events leave after the response
import { mira } from "@mirafive/sdk-next/server"

export async function POST(request: Request) {
  const { userId } = await request.json()

  mira().track("signup", { userId, properties: { plan: "pro" } })
  return Response.json({ ok: true })
}
```

A working App Router app lives in [`examples/app-router`](examples/app-router)
(`bun run example` packs the SDKs, installs them as npm would, and runs `next build`).

For revenue, add `payment_id` (1–255 characters) to the properties next to `revenue` and `currency`: the payment provider's id of the payment. For Stripe pass the Checkout Session id on the success page or the PaymentIntent id from a webhook, for example `mira().track("order completed", { properties: { revenue: 49, currency: "EUR", payment_id: paymentIntent.id } })`. MIRA FIVE merges the event with the payment it imports from your connected Stripe account, so the sale counts once.

Verify it: open a page on a deployed host (not `localhost`) and look for
`POST https://collect.mirafive.io/v1/batch/mf_…` answering `202` in the network tab; the
pageview then shows in the source's live view. For the server side, send
`$install_check` once: `await mira().send([{ name: "$install_check" }])` resolves to
`{ accepted: 0, dropped: 1, reason: "install_check" }` when the secret key and host work.

## Consent & privacy

- Default mode: `consentless` in the browser. No cookies, no storage, no ids; it needs no
  consent banner. `mode="full"` adds an anonymous id, a session id and your user id; it
  needs `identity()` in `plugins` and a consent answer from your consent manager
  (`useMira().consent({ statistics })`). Before an answer
  nothing is stored.
- Server events (`mira()`) default to `full` mode: you decide the lawful basis for the
  ids you send.
- Do Not Track, Global Privacy Control, `window.__mirafive_ignore` and prerendering send
  nothing from the browser.
- This package stores nothing. It reads `NEXT_PUBLIC_MIRAFIVE_KEY` (browser),
  `MIRAFIVE_SECRET_KEY` and `MIRAFIVE_HOST` (server).
- Statistics is the only consent purpose. A consent call that still has an `experiments` or `targeting` key is accepted. The keys are ignored.

## API reference

`@mirafive/sdk-next` (client, `"use client"`):

- `<MiraProvider websiteKey? host? mode? plugins? flushAt? flushAfterMs? trackLocalhost?>`:
  creates the browser client once, on the first render in the browser, and keeps it for
  the page's lifetime (later prop changes are ignored; in development a changed plugin set
  is warned about). `websiteKey` defaults to `process.env.NEXT_PUBLIC_MIRAFIVE_KEY`.
  `pageviews()` is added unless `plugins` already holds one. Without a key it sends nothing
  and warns once, in every build.
- `useMira()`, `useTrackOnMount(name, properties?)`: re-exported from `@mirafive/sdk-react`.
- `type MiraProviderProps`.

`@mirafive/sdk-next/server` (imports `server-only`: Next refuses it in a client component):

- `mira<Events>(): Mira<Events>`: one `Mira` per process from `MIRAFIVE_SECRET_KEY` and
  `MIRAFIVE_HOST`, flushed with `after()` when called inside a request. Outside one
  (module scope, scripts) its own one-second timer flushes.
## Framework / runtime notes

- **Why `websiteKey`, not `key`:** React reserves the `key` prop; a component never
  receives it.
- **Runtimes:** Node.js and Edge. `after()` keeps the function alive on Vercel until the
  flush finishes.
- **Navigation:** the `pageviews()` plugin counts App Router and Pages Router navigations
  through the History API; there is no `usePathname` wiring and no `Suspense` boundary.
- **Pages Router:** put `<MiraProvider>` in `pages/_app.tsx`; the hooks work unchanged.
  The Pages Router loads packages unbundled, where `server-only` throws, so add
  `transpilePackages: ["@mirafive/sdk-next"]` to `next.config` before importing
  `@mirafive/sdk-next/server`. `after()` does not run in the Pages Router:
  `await mira().flush()` before an API route returns.
- **CSP:** allow `connect-src https://collect.mirafive.io`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Nothing arrives | Local hosts are off by default (`trackLocalhost`); Do Not Track or GPC is on; `NEXT_PUBLIC_MIRAFIVE_KEY` was not set at build time (it is inlined then); the origin is not allowed on the source. |
| `403 secret_key_in_path` / `website_key_as_bearer` | The key kinds are swapped: the provider takes the website key, `mira()` the secret key. |
| `403 origin_not_allowed` | Add the site's origin to the source in MIRA FIVE. |
| "Functions cannot be passed directly to Client Components" | `plugins` was passed from a Server Component. Move `<MiraProvider plugins={…}>` into a `"use client"` file. |
| Server events arrive late or not at all | `mira()` was called outside a request, or in the Pages Router: `await mira().flush()`. |

## For AI agents

Copy-paste setup prompt:

```text
Add MIRA FIVE analytics to this Next.js app with @mirafive/sdk-next.
1. Install @mirafive/sdk-next @mirafive/sdk-react @mirafive/sdk-browser @mirafive/sdk-server with
   the project's package manager.
2. Add to .env.local (and the deployment's env): NEXT_PUBLIC_MIRAFIVE_KEY=<website key, mf_…>
   and MIRAFIVE_SECRET_KEY=<secret key>. The secret key is server-only: import it only through
   "@mirafive/sdk-next/server", never in a "use client" file, never with a NEXT_PUBLIC_ prefix.
3. App Router: wrap the body of app/layout.tsx in <MiraProvider> from "@mirafive/sdk-next".
   That alone counts pageviews on every navigation; do not add usePathname effects.
   Track in client components with useMira().track(name, props) or useTrackOnMount(name, props);
   on the server with mira().track(name, { userId, properties }) from "@mirafive/sdk-next/server".
   Pages Router: <MiraProvider> in pages/_app.tsx; for server helpers add
   transpilePackages: ["@mirafive/sdk-next"] to next.config.
4. Keep the default consentless mode: it needs no banner. Only if a consent manager exists and ids
   are wanted: plugins={[identity()]} from "@mirafive/sdk-browser/identity" plus mode="full" in the
   client providers file, and useMira().consent({ statistics }) in its callback.
5. Verify: run next build; open a deployed page and check the network tab for
   POST https://collect.mirafive.io/v1/batch/<key> answering 202; server side,
   await mira().send([{ name: "$install_check" }]) answers reason "install_check". Report what changed.
Do not add other analytics libraries, cookies or consent banners.
```

Facts for agents:

- Imports (client, `"use client"`): `import { MiraProvider, useMira, useTrackOnMount } from "@mirafive/sdk-next"`.
  Plugins: `import { identity } from "@mirafive/sdk-browser/identity"`,
  `/autocapture`, `/search`. `pageviews()` is added for you.
- Imports (server only): `import { mira } from "@mirafive/sdk-next/server"`;
  the entry imports `server-only`, so importing it from a `"use client"` file fails the build.
- One `<MiraProvider>` per app. Plugins are functions, so set `plugins` from a `"use client"` file.
- Env vars: `NEXT_PUBLIC_MIRAFIVE_KEY` (public website key, inlined at build),
  `MIRAFIVE_SECRET_KEY` (server only), `MIRAFIVE_HOST` (optional, server, default
  `https://collect.mirafive.io`); the provider's `host` prop sets the browser host.
- Never ship `MIRAFIVE_SECRET_KEY` to a browser bundle; a secret key in a browser is
  refused and marked exposed. Never prefix it with `NEXT_PUBLIC_`.
- The provider prop is `websiteKey`, not `key` (React reserves `key`). `plugins` holds
  functions, so it is set from a `"use client"` file, not from the server layout.
- Consentless (default) needs no banner; `mode="full"` needs `identity()` and a consent
  answer, behind the site's CMP.
- Nothing throws for transport reasons. Browser: dropped with a `[mirafive] …` warning on
  local hosts only. Server: `console.warn("[mirafive] …")`, or `send()` rejects with
  `MiraError`.
- Verify an install: `next build` passes; a deployed page's network tab shows
  `POST …/v1/batch/{key}` answering `202`; `await mira().send([{ name: "$install_check" }])`
  answers `reason: "install_check"`.
- Wire contract: [mirafive/protocol](https://github.com/mirafive/protocol).

## License

[MIT](LICENSE) © 2026 Cloo GmbH
