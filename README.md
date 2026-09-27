# @mirafive/sdk-next

MIRA FIVE for Next.js: a client provider with feature-flag hooks, and server helpers for
events and flags that send after the response with `after()`. Privacy-first analytics and
feature flags from MIRA FIVE, hosted in the EU. App Router first; Pages Router covered below.

## Size

| Import | min + gzip |
|---|---|
| `@mirafive/sdk-next` (client) | 0.45 kB |
| `@mirafive/sdk-next` + `@mirafive/sdk-react` | 0.88 kB |
| `@mirafive/sdk-next/server` | 0.56 kB |

Measured with the peers external (`react`, `next`, `@mirafive/sdk-browser`,
`@mirafive/sdk-server`, and `@mirafive/sdk-react` in the first row): these are the bytes
this package adds. The browser SDK core with pageviews is 2.31 kB on top. Nothing from the
server entry reaches the browser bundle. What you do not import is not shipped
(`sideEffects: false`).

## Install

```sh
npm install @mirafive/sdk-next @mirafive/sdk-react @mirafive/sdk-browser @mirafive/sdk-server
# or: bun add / pnpm add / yarn add
```

Peers: `next` ^15.1 or ^16, `react` ≥ 18.3, `@mirafive/sdk-react`,
`@mirafive/sdk-browser` and (for `/server` only) `@mirafive/sdk-server`, all ^0.5.0.

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

With feature flags, rendered on the server and hydrated without a flicker. Plugins are
functions, so they are chosen in a client component:

```tsx
// app/providers.tsx
"use client"
import { flags } from "@mirafive/sdk-browser/flags"
import { MiraProvider } from "@mirafive/sdk-next"

export function Providers({ bootstrap, children }: { bootstrap: string; children: React.ReactNode }) {
  return (
    <MiraProvider bootstrap={bootstrap} plugins={[flags()]}>
      {children}
    </MiraProvider>
  )
}
```

```tsx
// app/layout.tsx
import { flagsFor, MiraFlagsScript } from "@mirafive/sdk-next/server"
import { Providers } from "./providers"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const flags = await flagsFor({ userId: session?.userId }) // your own pseudonymous id, if signed in
  const bootstrap = flags.bootstrap()

  return (
    <html lang="en">
      <body>
        <MiraFlagsScript flags={bootstrap} />
        <Providers bootstrap={bootstrap}>{children}</Providers>
      </body>
    </html>
  )
}
```

```tsx
// any client component
"use client"
import { useFlag, useFlagConfig, useTrackOnMount } from "@mirafive/sdk-next"

export function Checkout() {
  const newCheckout = useFlag("new-checkout", false)
  const { max } = useFlagConfig("limits", { max: 1 })

  useTrackOnMount("checkout_viewed")
  return <h1>{newCheckout === true ? `New checkout, up to ${max}` : "Checkout"}</h1>
}
```

A working App Router app lives in [`examples/app-router`](examples/app-router)
(`bun run example` packs the SDKs, installs them as npm would, and runs `next build`).

Verify it: open a page on a deployed host (not `localhost`) and look for
`POST https://events.mirafive.io/v1/batch/mf_…` answering `202` in the network tab; the
pageview then shows in the source's live view. For the server side, send
`$install_check` once: `await mira().send([{ name: "$install_check" }])` resolves to
`{ accepted: 0, dropped: 1, reason: "install_check" }` when the secret key and host work.

## Consent & privacy

- Default mode: `consentless` in the browser. No cookies, no storage, no ids; it needs no
  consent banner. `mode="full"` adds an anonymous id, a session id and your user id; it
  needs `identity()` in `plugins` and a consent answer from your consent manager
  (`useMira().consent({ statistics, experiments, targeting })`). Before an answer
  nothing is stored.
- Server events (`mira()`) default to `full` mode: you decide the lawful basis for the
  ids you send.
- Do Not Track, Global Privacy Control, `window.__mirafive_ignore` and prerendering send
  nothing from the browser. On the server, `flagsFor()` reads `Sec-GPC: 1` and `DNT: 1`
  from the request and passes `optedOut`: no ids, no segment lookup, no exposure.
- This package stores nothing. It reads `NEXT_PUBLIC_MIRAFIVE_KEY` (browser),
  `MIRAFIVE_SECRET_KEY` and `MIRAFIVE_HOST` (server), and the `Sec-GPC`/`DNT` request
  headers.

## API reference

`@mirafive/sdk-next` (client, `"use client"`):

- `<MiraProvider websiteKey? host? mode? plugins? flushAt? flushAfterMs? trackLocalhost? bootstrap?>`:
  creates the browser client once, on the first render in the browser, and keeps it for
  the page's lifetime (later prop changes are ignored). `websiteKey` defaults to
  `process.env.NEXT_PUBLIC_MIRAFIVE_KEY`. `pageviews()` is added unless `plugins` already
  holds one. `bootstrap` is `flags.bootstrap()` from `flagsFor()`. Without a key it sends
  nothing and warns once in development.
- `useMira()`, `useFlag(key, fallback)`, `useFlagConfig(key, fallback)`,
  `useTrackOnMount(name, properties?)`: re-exported from `@mirafive/sdk-react`.
- `type MiraProviderProps`, `type FlagBootstrap`.

`@mirafive/sdk-next/server`:

- `mira<Events>(): Mira<Events>`: one `Mira` per process from `MIRAFIVE_SECRET_KEY` and
  `MIRAFIVE_HOST`, flushed with `after()` when called inside a request. Outside one
  (module scope, scripts) its own one-second timer flushes.
- `flagsFor(unit?: FlagUnit): Promise<UserFlags>`: one visitor's flags from a process-wide
  `MiraFlags`. Reads `Sec-GPC`/`DNT` through `next/headers` (so the route renders
  dynamically) and hands refreshes and exposures to `after()`. `unit`: `userId`,
  `anonymousId`, `properties`, `consent`, `optedOut`.
- `<MiraFlagsScript flags={UserFlags | string} />`: the escaped
  `<script type="application/json" id="mirafive-flags">` block, from a `UserFlags` or the
  string `bootstrap()` returned.
- `type FlagUnit`, `type UserFlags`.

## Framework / runtime notes

- **Why `websiteKey`, not `key`:** React reserves the `key` prop; a component never
  receives it.
- **Hydration:** flag hooks render the `bootstrap` prop on the server and during
  hydration, then the browser SDK's answers. Pass the same string to `MiraFlagsScript`
  and the provider. Without `flags()` in `plugins`, hooks fall back after hydration.
- **Caching:** `flagsFor()` reads request headers, so the page is dynamic and Next sends
  `Cache-Control: private, no-cache, no-store`, as a bootstrap block requires. Do not put
  a flag read inside `"use cache"`.
- **Runtimes:** Node.js and Edge. `after()` keeps the function alive on Vercel until the
  flush finishes.
- **Navigation:** the `pageviews()` plugin counts App Router and Pages Router navigations
  through the History API; there is no `usePathname` wiring and no `Suspense` boundary.
- **Pages Router:** put `<MiraProvider>` in `pages/_app.tsx`; the hooks work unchanged.
  `flagsFor()` needs the App Router (`next/headers`). In `getServerSideProps` use
  `MiraFlags` from `@mirafive/sdk-server/flags` with
  `optedOut: req.headers["sec-gpc"] === "1" || req.headers["dnt"] === "1"`, pass
  `flags.bootstrap()` as a prop to the provider and render `<MiraFlagsScript>`, and send
  `bootstrapHeaders` on the response. `after()` does not run in the Pages Router:
  `await mira().flush()` before an API route returns.
- **CSP:** the bootstrap block is `type="application/json"`, which `script-src` does not
  govern. Allow `connect-src https://events.mirafive.io`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Nothing arrives | Local hosts are off by default (`trackLocalhost`); Do Not Track or GPC is on; `NEXT_PUBLIC_MIRAFIVE_KEY` was not set at build time (it is inlined then); the origin is not allowed on the source. |
| `403 secret_key_in_path` / `website_key_as_bearer` | The key kinds are swapped: the provider takes the website key, `mira()` and `flagsFor()` the secret key. |
| `403 origin_not_allowed` | Add the site's origin to the source in MIRA FIVE. |
| A flag always returns its fallback | No `flags()` in `plugins`; the flag is not in this source or not marked for the website (a bootstrap carries only those); experiments consent is missing; `MIRAFIVE_SECRET_KEY` is missing on the server (`[mirafive] no key` in the logs). |
| "Functions cannot be passed directly to Client Components" | `plugins` was passed from a Server Component. Move `<MiraProvider plugins={…}>` into a `"use client"` file. |
| Server events arrive late or not at all | `mira()` was called outside a request, or in the Pages Router: `await mira().flush()`. |

## For AI agents

Copy-paste setup prompt:

```text
Add MIRA FIVE analytics (and feature flags) to this Next.js app with @mirafive/sdk-next.
1. Install @mirafive/sdk-next @mirafive/sdk-react @mirafive/sdk-browser @mirafive/sdk-server with
   the project's package manager.
2. Add to .env.local (and the deployment's env): NEXT_PUBLIC_MIRAFIVE_KEY=<website key, mf_…>
   and MIRAFIVE_SECRET_KEY=<secret key>. The secret key is server-only: import it only through
   "@mirafive/sdk-next/server", never in a "use client" file, never with a NEXT_PUBLIC_ prefix.
3. App Router: wrap the body of app/layout.tsx in <MiraProvider> from "@mirafive/sdk-next".
   That alone counts pageviews on every navigation; do not add usePathname effects.
   Track in client components with useMira().track(name, props) or useTrackOnMount(name, props);
   on the server with mira().track(name, { userId, properties }) from "@mirafive/sdk-next/server".
   For flags: create app/providers.tsx ("use client") rendering
   <MiraProvider bootstrap={bootstrap} plugins={[flags()]}> (flags from "@mirafive/sdk-browser/flags");
   in the layout: const flags = await flagsFor({ userId }); const bootstrap = flags.bootstrap();
   render <MiraFlagsScript flags={bootstrap} /> and <Providers bootstrap={bootstrap}>.
   Read flags with useFlag(key, fallback) / useFlagConfig(key, fallback).
   Pages Router: <MiraProvider> in pages/_app.tsx; see the README's Pages Router notes.
4. Keep the default consentless mode: it needs no banner. Only if a consent manager exists and ids
   are wanted: plugins={[identity()]} from "@mirafive/sdk-browser/identity" plus mode="full" in the
   client providers file, and useMira().consent({ statistics, experiments, targeting }) in its callback.
5. Verify: run next build; open a deployed page and check the network tab for
   POST https://events.mirafive.io/v1/batch/<key> answering 202; server side,
   await mira().send([{ name: "$install_check" }]) answers reason "install_check". Report what changed.
Do not add other analytics libraries, cookies or consent banners.
```

Facts for agents:

- Imports (client, `"use client"`): `import { MiraProvider, useMira, useFlag, useFlagConfig, useTrackOnMount } from "@mirafive/sdk-next"`.
  Plugins: `import { flags } from "@mirafive/sdk-browser/flags"`, `/identity`,
  `/autocapture`, `/search`, `/experiments`. `pageviews()` is added for you.
- Imports (server only): `import { mira, flagsFor, MiraFlagsScript } from "@mirafive/sdk-next/server"`.
- Env vars: `NEXT_PUBLIC_MIRAFIVE_KEY` (public website key, inlined at build),
  `MIRAFIVE_SECRET_KEY` (server only), `MIRAFIVE_HOST` (optional, server, default
  `https://events.mirafive.io`); the provider's `host` prop sets the browser host.
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
